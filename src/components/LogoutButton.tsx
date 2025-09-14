// Minimal Logout Button - T-UI-001 Phase 1
// Simple logout with hard navigation to avoid race conditions

import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'button' | 'link';
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = '', 
  children = 'Logout',
  variant = 'button'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // Only render if authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Get CSRF token from cookie
      const getCsrfToken = (): string | null => {
        if (typeof document === 'undefined') return null;
        
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'glow_csrf') {
            return decodeURIComponent(value);
          }
        }
        return null;
      };

      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      console.log('[LOGOUT] Starting logout with CSRF token:', csrfToken ? 'present' : 'missing');

      // Direct API call to logout endpoint
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers,
        credentials: 'same-origin',
      });

      console.log('[LOGOUT] Logout response:', response.status, response.ok);

      if (response.ok) {
        // Broadcast logout to other tabs for cross-tab coherence
        if (typeof window !== 'undefined' && window.BroadcastChannel) {
          try {
            const channel = new BroadcastChannel('glow-auth');
            channel.postMessage({ type: 'LOGOUT' });
            channel.close();
            console.log('[LOGOUT] Broadcasted logout to other tabs');
          } catch (e) {
            console.warn('[LOGOUT] BroadcastChannel not available:', e);
          }
        }

        // Hard navigation to /login (full reload to eliminate router/store races)
        console.log('[LOGOUT] Hard navigation to /login');
        window.location.assign('/login');
      } else {
        // Handle logout failure
        const errorData = await response.json().catch(() => ({ error: 'Logout failed' }));
        console.error('[LOGOUT] Logout failed:', errorData);
        
        // Even on failure, try to navigate to login
        window.location.assign('/login');
      }
    } catch (error) {
      console.error('[LOGOUT] Logout error:', error);
      
      // On any error, still try to navigate to login
      window.location.assign('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const baseClasses = variant === 'link' 
    ? 'text-pink-600 hover:text-pink-700 font-medium'
    : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200';

  const disabledClasses = isLoading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`${baseClasses} ${disabledClasses} ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Logging out...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default LogoutButton;

