// Public Only Route - T-UI-001 Phase 5
// Enhanced route guard with deterministic logic and telemetry

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useAuthContext } from '../providers/AuthProvider';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const location = useLocation();
  const { isInitialized, isLoading } = useAuthContext();
  const { isAuthenticated, user } = useAuthStore();

  // Dev-only telemetry
  const log = (event: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GUARD_TELEMETRY] ${event}`, data || '');
    }
  };

  // If not initialized yet, show finite loading
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <span className="ml-2 text-sm text-gray-600">Loading...</span>
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
          log('guard.publicOnly.redirect', { 
            from: location.pathname, 
            to: decodedReturnTo,
            reason: 'returnTo' 
          });
          
          return <Navigate to={decodedReturnTo} replace />;
        }
      } catch (error) {
        console.warn('Invalid returnTo parameter:', returnTo);
      }
    }
    
    log('guard.publicOnly.redirect', { 
      from: location.pathname, 
      to: redirectTo,
      reason: 'default' 
    });
    
    return <Navigate to={redirectTo} replace />;
  }

  // Render public content
  return <>{children}</>;
};

export default PublicOnlyRoute;

