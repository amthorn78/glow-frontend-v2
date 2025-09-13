// Logout Button - Auth v2 with Cross-tab Sync
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../queries/auth/authQueries';

// ============================================================================
// TYPES
// ============================================================================

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'button' | 'link';
}

// ============================================================================
// COMPONENT
// ============================================================================

export const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = '',
  children = 'Logout',
  variant = 'button'
}) => {
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate anyway since local state is cleared
      navigate('/login', { replace: true });
    }
  };

  const baseClasses = variant === 'button' 
    ? 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed'
    : 'text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer';

  const combinedClasses = `${baseClasses} ${className}`.trim();

  if (variant === 'link') {
    return (
      <span
        onClick={handleLogout}
        className={combinedClasses}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleLogout();
          }
        }}
      >
        {logoutMutation.isPending ? 'Logging out...' : children}
      </span>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
      className={combinedClasses}
    >
      {logoutMutation.isPending ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Logging out...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default LogoutButton;

