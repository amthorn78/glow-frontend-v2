// Protected Route - Auth v2 Route Guard
// Ensures authentication before accessing protected pages

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCurrentUser } from '../queries/auth/authQueries';
import { useAuthContext } from '../providers/AuthProvider';

// ============================================================================
// TYPES
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const location = useLocation();
  const { isInitialized, isLoading } = useAuthContext();
  const { isAuthenticated, user } = useAuthStore();
  const { refetch: refetchUser } = useCurrentUser();

  // If not initialized yet, show loading
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login with returnTo
  if (!isAuthenticated || !user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // If admin required but user is not admin
  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;

