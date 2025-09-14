// GM-1: Global Menu Shell - T-UI-001 Phase 6
// Hybrid UI: Persistent bar (desktop) + hamburger/popover (mobile)
// Hard navigation only, CSRF protection, cross-tab coherence

import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Menu, X, Users } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { isLogoutAllEnabled } from '../config/authFlags';

interface GlobalMenuProps {
  className?: string;
}

export const GlobalMenu: React.FC<GlobalMenuProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  const { user, isAuthenticated } = useAuthStore();
  const logoutAllEnabled = isLogoutAllEnabled();

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Get user display info
  const getDisplayName = () => {
    if (user.display_name) return user.display_name;
    if (user.email) return user.email.split('@')[0];
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.slice(0, 2).toUpperCase();
  };

  // GM-2: Logout action with hard navigation
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    console.log('[AUTH_BREADCRUMB] ui.globalmenu.logout.click', JSON.stringify({
      timestamp: new Date().toISOString(),
      user_id: user.id
    }));

    try {
      // Get CSRF token
      let csrfToken = '';
      try {
        const csrfResponse = await fetch('/api/auth/csrf', {
          method: 'GET',
          credentials: 'include'
        });
        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrf_token;
        }
      } catch (error) {
        console.warn('[AUTH_BREADCRUMB] auth.logout.csrf_fetch_failed', { error: error.message });
      }

      // Logout request
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        }
      });

      console.log('[AUTH_BREADCRUMB] auth.logout.http_200', JSON.stringify({
        status: response.status,
        timestamp: new Date().toISOString()
      }));

      if (response.status === 403 && csrfToken) {
        // CSRF retry
        console.log('[AUTH_BREADCRUMB] auth.logout.csrf_retry', JSON.stringify({
          timestamp: new Date().toISOString()
        }));

        const retryResponse = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          }
        });

        if (!retryResponse.ok) {
          throw new Error(`Logout failed after CSRF retry: ${retryResponse.status}`);
        }
      } else if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
      }

      // Clear auth store
      useAuthStore.getState().clearAuth();

      // GM-4: BroadcastChannel for cross-tab coherence
      const channel = new BroadcastChannel('glow-auth');
      channel.postMessage({ type: 'LOGOUT', timestamp: new Date().toISOString() });
      channel.close();

      console.log('[AUTH_BREADCRUMB] auth.logout.done', JSON.stringify({
        timestamp: new Date().toISOString()
      }));

      // GM-2: Hard navigation to login
      window.location.assign('/login');

    } catch (error) {
      console.error('[AUTH_BREADCRUMB] auth.logout.error', { error: error.message });
      setIsLoggingOut(false);
      
      // Show error to user
      alert('Logout failed. Please refresh the page and try again.');
    }
  };

  // GM-3: Logout-All action (feature-flagged)
  const handleLogoutAll = async () => {
    if (isLoggingOutAll || !logoutAllEnabled) return;
    
    setIsLoggingOutAll(true);
    console.log('[AUTH_BREADCRUMB] ui.globalmenu.logout_all.click', JSON.stringify({
      timestamp: new Date().toISOString(),
      user_id: user.id
    }));

    try {
      // Get CSRF token
      let csrfToken = '';
      try {
        const csrfResponse = await fetch('/api/auth/csrf', {
          method: 'GET',
          credentials: 'include'
        });
        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrf_token;
        }
      } catch (error) {
        console.warn('[AUTH_BREADCRUMB] auth.logout_all.csrf_fetch_failed', { error: error.message });
      }

      // Logout-All request
      const response = await fetch('/api/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        }
      });

      console.log('[AUTH_BREADCRUMB] auth.logout_all.http_200', JSON.stringify({
        status: response.status,
        timestamp: new Date().toISOString()
      }));

      if (response.status === 403 && csrfToken) {
        // CSRF retry
        console.log('[AUTH_BREADCRUMB] auth.logout_all.csrf_retry', JSON.stringify({
          timestamp: new Date().toISOString()
        }));

        const retryResponse = await fetch('/api/auth/logout-all', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          }
        });

        if (!retryResponse.ok) {
          throw new Error(`Logout-All failed after CSRF retry: ${retryResponse.status}`);
        }
      } else if (!response.ok) {
        throw new Error(`Logout-All failed: ${response.status}`);
      }

      // Show success message
      alert('Logged out everywhere');

      // Clear auth store
      useAuthStore.getState().clearAuth();

      // GM-4: BroadcastChannel for cross-tab coherence
      const channel = new BroadcastChannel('glow-auth');
      channel.postMessage({ type: 'LOGOUT_ALL', timestamp: new Date().toISOString() });
      channel.close();

      console.log('[AUTH_BREADCRUMB] auth.logout_all.done', JSON.stringify({
        timestamp: new Date().toISOString()
      }));

      // GM-2: Hard navigation to login
      window.location.assign('/login');

    } catch (error) {
      console.error('[AUTH_BREADCRUMB] auth.logout_all.error', { error: error.message });
      setIsLoggingOutAll(false);
      
      // Show error to user
      alert('Logout-All failed. Please refresh the page and try again.');
    }
  };

  // GM-4: Profile and Settings hard navigation
  const handleProfile = () => {
    console.log('[AUTH_BREADCRUMB] ui.globalmenu.profile.click', JSON.stringify({
      timestamp: new Date().toISOString()
    }));
    window.location.assign('/profile');
  };

  const handleSettings = () => {
    console.log('[AUTH_BREADCRUMB] ui.globalmenu.settings.click', JSON.stringify({
      timestamp: new Date().toISOString()
    }));
    window.location.assign('/settings');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    console.log('[AUTH_BREADCRUMB] ui.globalmenu.open', JSON.stringify({
      isOpen: !isOpen,
      timestamp: new Date().toISOString()
    }));
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Desktop: Persistent bar */}
      <div className="hidden md:flex items-center space-x-4">
        {/* User info */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {getInitials()}
          </div>
          <span className="text-sm font-medium text-gray-700">{getDisplayName()}</span>
        </div>

        {/* Menu items */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleProfile}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Profile"
          >
            <User size={16} />
            <span>Profile</span>
          </button>

          <button
            onClick={handleSettings}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Settings"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300 mx-2" />

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Logout"
          >
            <LogOut size={16} />
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>

          {logoutAllEnabled && (
            <button
              onClick={handleLogoutAll}
              disabled={isLoggingOutAll}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Logout All Devices"
            >
              <Users size={16} />
              <span>{isLoggingOutAll ? 'Logging out...' : 'Logout All'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile: Hamburger menu */}
      <div className="md:hidden">
        <button
          ref={triggerRef}
          onClick={toggleMenu}
          className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          aria-controls="mobile-menu"
          aria-expanded={isOpen}
          aria-label="Open menu"
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {getInitials()}
          </div>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile menu popover */}
        {isOpen && (
          <div
            id="mobile-menu"
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
            role="menu"
            aria-orientation="vertical"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {getInitials()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{getDisplayName()}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => { setIsOpen(false); handleProfile(); }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                role="menuitem"
              >
                <User size={16} />
                <span>Profile</span>
              </button>

              <button
                onClick={() => { setIsOpen(false); handleSettings(); }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                role="menuitem"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>

              <hr className="my-1 border-gray-200" />

              <button
                onClick={() => { setIsOpen(false); handleLogout(); }}
                disabled={isLoggingOut}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                role="menuitem"
              >
                <LogOut size={16} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>

              {logoutAllEnabled && (
                <button
                  onClick={() => { setIsOpen(false); handleLogoutAll(); }}
                  disabled={isLoggingOutAll}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  role="menuitem"
                >
                  <Users size={16} />
                  <span>{isLoggingOutAll ? 'Logging out...' : 'Logout All'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalMenu;

