// Mobile-First App Layout Component
// Phase 1: CALCINATION - Pure Foundation Architecture

import React, { ReactNode } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import { UI_CONFIG, MOBILE_CONFIG } from '../../core/constants';

// ============================================================================
// LAYOUT TYPES
// ============================================================================

interface AppLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  showHeader?: boolean;
  className?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  requireAuth: boolean;
}

// ============================================================================
// NAVIGATION CONFIGURATION
// ============================================================================

const navigationItems: NavigationItem[] = [
  {
    id: 'discovery',
    label: 'Discover',
    icon: '🔍',
    path: '/discovery',
    requireAuth: true,
  },
  {
    id: 'matches',
    label: 'Matches',
    icon: '💕',
    path: '/matches',
    requireAuth: true,
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: '💬',
    path: '/messages',
    requireAuth: true,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    path: '/profile',
    requireAuth: true,
  },
];

// ============================================================================
// MOBILE NAVIGATION COMPONENT
// ============================================================================

const MobileNavigation: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const currentPath = window.location.pathname;

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16 px-4">
        {navigationItems.map((item) => {
          if (item.requireAuth && !isAuthenticated) return null;
          
          const isActive = currentPath === item.path;
          
          return (
            <a
              key={item.id}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors duration-200 ${
                isActive
                  ? 'text-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};

// ============================================================================
// MOBILE HEADER COMPONENT
// ============================================================================

const MobileHeader: React.FC<{ title?: string }> = ({ title = 'GLOW' }) => {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 safe-area-pt">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo/Title */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-pink-600">{title}</h1>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-3">
          {user && (
            <>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Hi, {user.firstName}</span>
                {user.profilePicture && (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// MAIN LAYOUT COMPONENT
// ============================================================================

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showNavigation = true,
  showHeader = true,
  className = '',
}) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile Header */}
      {showHeader && <MobileHeader />}

      {/* Main Content */}
      <main
        className={`
          ${showHeader ? 'pt-14' : ''}
          ${showNavigation && isAuthenticated ? 'pb-16' : ''}
          min-h-screen
        `}
      >
        <div className="max-w-md mx-auto bg-white min-h-full">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      {showNavigation && <MobileNavigation />}
    </div>
  );
};

// ============================================================================
// RESPONSIVE CONTAINER COMPONENT
// ============================================================================

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 'md',
  padding = 'md',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

// ============================================================================
// SAFE AREA COMPONENT
// ============================================================================

interface SafeAreaProps {
  children: ReactNode;
  className?: string;
}

const SafeArea: React.FC<SafeAreaProps> = ({ children, className = '' }) => {
  return (
    <div className={`safe-area-pt safe-area-pb ${className}`}>
      {children}
    </div>
  );
};

// ============================================================================
// TOUCH OPTIMIZED BUTTON
// ============================================================================

interface TouchButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 active:scale-95 touch-manipulation';
  
  const variantClasses = {
    primary: 'bg-pink-600 text-white hover:bg-pink-700 active:bg-pink-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
    outline: 'border-2 border-pink-600 text-pink-600 hover:bg-pink-50 active:bg-pink-100',
    ghost: 'text-pink-600 hover:bg-pink-50 active:bg-pink-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  };

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed active:scale-100'
    : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AppLayout;
export { MobileNavigation, MobileHeader, ResponsiveContainer, SafeArea, TouchButton };
export type { AppLayoutProps, ResponsiveContainerProps, SafeAreaProps, TouchButtonProps };

