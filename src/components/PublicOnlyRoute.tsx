// Public Only Route - Auth v2 Route Guard
// Redirects authenticated users away from public-only pages (like login)

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useAuthContext } from '../providers/AuthProvider';

// ============================================================================
// TYPES
// ============================================================================

interface PublicOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const location = useLocation();
  const { isInitialized, isLoading } = useAuthContext();
  const { isAuthenticated, user } = useAuthStore();

  // If not initialized yet, show loading
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated, redirect to returnTo or default
  if (isAuthenticated && user) {
    const searchParams = new URLSearchParams(location.search);
    const returnTo = searchParams.get('returnTo');
    
    if (returnTo) {
      try {
        const decodedReturnTo = decodeURIComponent(returnTo);
        // Validate returnTo is a relative path
        if (decodedReturnTo.startsWith('/') && !decodedReturnTo.startsWith('//')) {
          return <Navigate to={decodedReturnTo} replace />;
        }
      } catch (error) {
        console.warn('Invalid returnTo parameter:', returnTo);
      }
    }
    
    return <Navigate to={redirectTo} replace />;
  }

  // Render public content
  return <>{children}</>;
};

export default PublicOnlyRoute;

