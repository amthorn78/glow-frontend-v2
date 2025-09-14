// Global Menu - T-UI-001 Implementation
// Mobile-first design with logout functionality and cross-tab coherence

import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Settings, Heart, Users, Shield, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, authSelectors, getUserDisplayName } from '../stores/authStore';
import { useLogoutMutation, useLogoutAllMutation } from '../queries/auth/authQueries';
import { Button } from './ui/button';

// ============================================================================
// FEATURE FLAG
// ============================================================================

// T-UI-001 Feature flag - GLOBAL_MENU_ENABLED (default true, can be disabled)
const GLOBAL_MENU_ENABLED = process.env.REACT_APP_GLOBAL_MENU_ENABLED !== 'false';

// ============================================================================
// TYPES
// ============================================================================

interface GlobalMenuProps {
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GlobalMenu: React.FC<GlobalMenuProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  // Auth state
  const user = useAuthStore(authSelectors.user);
  const isAuthenticated = useAuthStore(authSelectors.isAuthenticated);
  
  // Logout mutations
  const logoutMutation = useLogoutMutation();
  const logoutAllMutation = useLogoutAllMutation();

  // Don't render if feature flag is disabled or user is not authenticated
  if (!GLOBAL_MENU_ENABLED || !isAuthenticated || !user) {
    return null;
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setIsOpen(false);
      // Navigation will be handled by auth store subscription
    } catch (error) {
      console.error('Logout error:', error);
      setIsOpen(false);
      // Navigation will be handled by auth store subscription
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAllMutation.mutateAsync();
      setIsOpen(false);
      // Navigation will be handled by auth store subscription
    } catch (error) {
      console.error('Logout all error:', error);
      setIsOpen(false);
      // Navigation will be handled by auth store subscription
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    closeMenu();
  };

  // ============================================================================
  // CROSS-TAB COHERENCE
  // ============================================================================

  useEffect(() => {
    // Listen for auth changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'glow-auth-v2-store' && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          if (!newState.state?.isAuthenticated) {
            // User logged out in another tab
            setIsOpen(false);
          }
        } catch (error) {
          console.warn('Error parsing storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Menu Button - Fixed position for mobile */}
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <Button
          onClick={toggleMenu}
          variant="outline"
          size="icon"
          className="bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50 shadow-lg transition-all duration-200"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? (
            <X className="h-5 w-5 text-gray-700" />
          ) : (
            <Menu className="h-5 w-5 text-gray-700" />
          )}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Menu Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-white border-l border-gray-200 z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          shadow-xl
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <Button
                onClick={closeMenu}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-pink-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getUserDisplayName(user)}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              <MenuButton
                icon={Home}
                label="Dashboard"
                onClick={() => handleNavigation('/dashboard')}
                enabled={true}
              />
              <MenuButton
                icon={User}
                label="Profile"
                onClick={() => handleNavigation('/profile')}
                enabled={true}
              />
              <MenuButton
                icon={Heart}
                label="Matches"
                onClick={() => handleNavigation('/discovery')}
                enabled={true}
                tooltip="Discovery page"
              />
              <MenuButton
                icon={Users}
                label="Connections"
                onClick={() => {}}
                enabled={false}
                tooltip="Coming in Phase IV"
              />
              <MenuButton
                icon={Settings}
                label="Settings"
                onClick={() => {}}
                enabled={false}
                tooltip="Coming soon"
              />
            </div>
          </nav>

          {/* Footer - Logout Actions */}
          <div className="p-6 border-t border-gray-200 space-y-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start text-gray-700 border-gray-300 hover:bg-gray-50"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </Button>
            
            <Button
              onClick={handleLogoutAll}
              variant="outline"
              className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50"
              disabled={logoutAllMutation.isPending}
            >
              <Shield className="h-4 w-4 mr-2" />
              {logoutAllMutation.isPending ? 'Logging out...' : 'Logout All Devices'}
            </Button>
            
            <p className="text-xs text-gray-400 text-center">
              GLOW v1.0 - CALCINATION Phase
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// MENU BUTTON COMPONENT
// ============================================================================

interface MenuButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  enabled?: boolean;
  tooltip?: string;
}

const MenuButton: React.FC<MenuButtonProps> = ({ 
  icon: Icon, 
  label, 
  onClick, 
  enabled = true, 
  tooltip 
}) => {
  return (
    <Button
      onClick={enabled ? onClick : undefined}
      variant="ghost"
      className={`
        w-full justify-start h-auto p-3 text-gray-700
        ${enabled 
          ? 'hover:bg-gray-100 cursor-pointer' 
          : 'opacity-50 cursor-not-allowed hover:bg-transparent'
        }
      `}
      disabled={!enabled}
      title={tooltip}
    >
      <Icon className="h-4 w-4 mr-3" />
      <span className="text-left">{label}</span>
      {!enabled && (
        <span className="ml-auto text-xs text-gray-400">
          Soon
        </span>
      )}
    </Button>
  );
};

export default GlobalMenu;

