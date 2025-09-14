// Enhanced Logout Button - T-UI-001 Phase 5
// Router navigation with feature flag fallback to hard navigation

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isRouterNavEnabled, logFeatureFlag } from '../utils/featureFlags';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'button' | 'link';
}

// Simple toast notification for errors
const showToast = (message: string) => {
  // Create a simple toast element
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    max-width: 300px;
  `;
  
  document.body.appendChild(toast);
  
  // Remove after 4 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 4000);
};

export const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = '', 
  children = 'Logout',
  variant = 'button'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Only render if authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Dev-only telemetry
  const log = (event: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[LOGOUT_TELEMETRY] ${event}`, data || '');
    }
  };

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

  // Fetch fresh CSRF token
  const fetchCsrfToken = async (signal: AbortSignal): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'same-origin',
        signal,
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.csrf_token || null;
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        log('csrf_fetch_error', error);
      }
    }
    return null;
  };

  // Perform logout request
  const performLogout = async (csrfToken: string | null, signal: AbortSignal): Promise<boolean> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      signal,
    });

    if (response.ok) {
      return true;
    }

    // Check for CSRF error
    if (response.status === 403) {
      try {
        const errorData = await response.json();
        if (errorData.code === 'CSRF_MISSING' || errorData.code === 'CSRF_INVALID') {
          throw new Error('CSRF_ERROR');
        }
      } catch (e) {
        if (e.message === 'CSRF_ERROR') {
          throw e;
        }
      }
    }

    // Other error
    const errorData = await response.json().catch(() => ({ error: 'Logout failed' }));
    throw new Error(`HTTP_${response.status}: ${errorData.error || 'Logout failed'}`);
  };

  const handleLogout = async () => {
    // Prevent double-clicks
    if (isLoading) return;
    
    // Check if offline
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      showToast("You're offline. Try again.");
      log('logout_offline');
      return;
    }
    
    setIsLoading(true);
    log('logout_click');
    
    // Create abort controller with 5s timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        log('logout_timeout');
        showToast("Request timed out. Please try again.");
        setIsLoading(false);
      }
    }, 5000);

    const startTime = Date.now();
    
    try {
      log('logout_start', { ts: startTime });
      
      let csrfToken = getCsrfToken();
      let retryAttempted = false;
      
      try {
        // First attempt
        await performLogout(csrfToken, abortControllerRef.current.signal);
      } catch (error) {
        // Handle CSRF error with retry
        if (error.message === 'CSRF_ERROR' && !retryAttempted) {
          log('logout_retry_csrf');
          retryAttempted = true;
          
          // Fetch fresh CSRF token
          const freshToken = await fetchCsrfToken(abortControllerRef.current.signal);
          if (freshToken) {
            // Retry with fresh token
            await performLogout(freshToken, abortControllerRef.current.signal);
          } else {
            throw new Error('Failed to refresh CSRF token');
          }
        } else {
          throw error;
        }
      }
      
      // Success
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      log('logout_ok', { latency_ms: latency });
      
      // Broadcast logout to other tabs for cross-tab coherence
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        try {
          const channel = new BroadcastChannel('glow-auth');
          channel.postMessage({ type: 'LOGOUT' });
          channel.close();
        } catch (e) {
          // BroadcastChannel not available, continue
        }
      }

      // Phase 5: Router navigation with feature flag fallback
      const useRouterNav = isRouterNavEnabled();
      logFeatureFlag('ROUTER_NAV_ENABLED', 'logout_success');
      
      if (useRouterNav) {
        try {
          log('auth.logout.seq', { route: 'router' });
          navigate('/login', { replace: true });
        } catch (error) {
          // Fallback to hard navigation if router fails
          log('auth.logout.seq', { route: 'hard', reason: 'router_error' });
          window.location.assign('/login');
        }
      } else {
        // Hard navigation (Phase 4 behavior)
        log('auth.logout.seq', { route: 'hard', reason: 'feature_flag_disabled' });
        window.location.assign('/login');
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        // Timeout already handled
        return;
      }
      
      log('logout_fail', { 
        code: error.message.includes('HTTP_') ? error.message.split(':')[0] : 'NETWORK_ERROR',
        status: error.message 
      });
      
      // Show user-friendly error
      if (error.message.includes('HTTP_5')) {
        showToast("Server error. Please try again.");
      } else if (error.message.includes('CSRF')) {
        showToast("Security error. Please refresh and try again.");
      } else {
        showToast("Couldn't log you out. Please try again.");
      }
      
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

