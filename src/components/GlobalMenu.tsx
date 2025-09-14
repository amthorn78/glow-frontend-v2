// GM-1: Global Menu Shell - T-UI-001 Phase 6 + GM11-FE-3
// Hybrid UI: Persistent bar (desktop) + hamburger/popover (mobile)
// Hard navigation only, CSRF protection via centralized wrapper, cross-tab coherence

import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, Menu, X, Users } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { isLogoutAllEnabled } from '../config/authFlags';
import { emitAuthBreadcrumb } from '../utils/authTelemetry';
import { logoutWithCsrf, logoutAllWithCsrf } from '../utils/csrfMutations';

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

  // GM-2: Logout action with centralized CSRF handling
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    emitAuthBreadcrumb('auth.logout.request', {
      user_id: user.id
    });

    try {
      // Use centralized CSRF mutation wrapper
      const result = await logoutWithCsrf();

      if (result.ok) {
        emitAuthBreadcrumb('auth.logout.success', {});

        // Clear auth store
        useAuthStore.getState().clearAuth();

        // GM-4: BroadcastChannel for cross-tab coherence
        const channel = new BroadcastChannel('glow-auth');
        channel.postMessage({ type: 'LOGOUT', timestamp: new Date().toISOString() });
        channel.close();

        // GM-2: Hard navigation to login
        window.location.assign('/login');
      } else {
        throw new Error(result.error || 'Logout failed');
      }

    } catch (error) {
      emitAuthBreadcrumb('auth.login.break_glass.reload', { 
        error_code: error instanceof Error ? error.message : 'Unknown error' 
      });
      setIsLoggingOut(false);
      
      // Show error to user
      alert('Logout failed. Please refresh the page and try again.');
    }
  };

  // GM-3: Logout-All action with centralized CSRF handling (feature-flagged)
  const handleLogoutAll = async () => {
    if (isLoggingOutAll || !logoutAllEnabled) return;
    
    setIsLoggingOutAll(true);
    emitAuthBreadcrumb('auth.logout.request', {
      user_id: user.id
    });

    try {
      // Use centralized CSRF mutation wrapper
      const result = await logoutAllWithCsrf();

      if (result.ok) {
        emitAuthBreadcrumb('auth.logout.success', {});

        // Show success message
        alert('Logged out everywhere');

        // Clear auth store
        useAuthStore.getState().clearAuth();

        // GM-4: BroadcastChannel for cross-tab coherence
        const channel = new BroadcastChannel('glow-auth');
        channel.postMessage({ type: 'LOGOUT_ALL', timestamp: new Date().toISOString() });
        channel.close();

        // GM-2: Hard navigation to login
        window.location.assign('/login');
      } else {
        throw new Error(result.error || 'Logout-All failed');
      }

    } catch (error) {
      emitAuthBreadcrumb('auth.login.break_glass.reload', { 
        error_code: error instanceof Error ? error.message : 'Unknown error' 
      });
      setIsLoggingOutAll(false);
      
      // Show error to user
      alert('Logout-All failed. Please refresh the page and try again.');
    }
  };

  // GM-4: Profile and Settings hard navigation
  const handleProfile = () => {
    emitAuthBreadcrumb('auth.nav.hard.to_dashboard', { route: '/profile' });
    window.location.assign('/profile');
  };

  const handleSettings = () => {
    emitAuthBreadcrumb('auth.nav.hard.to_dashboard', { route: '/settings' });
    window.location.assign('/settings');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    emitAuthBreadcrumb('auth.bootstrap.me.start', {
      route: 'globalmenu_toggle'
    });
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

