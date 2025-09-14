// Protected Route - T-UI-001 Phase 5 + GM11-FE-2
// Enhanced route guard with deterministic logic and telemetry
// Integrated with AuthenticatedLayout for GlobalMenu shell

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useAuthContext } from '../providers/AuthProvider';
import { AuthenticatedLayout } from './AuthenticatedLayout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
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

  // Show finite loader while not initialized (no infinite spinners)
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <span className="ml-2 text-sm text-gray-600">Initializing...</span>
      </div>
    );
  }

  // If not authenticated, redirect to login with returnTo
  if (!isAuthenticated || !user) {
    const currentPath = location.pathname + location.search;
    const returnTo = encodeURIComponent(currentPath);
    
    log('guard.protected.redirect', { 
      from: currentPath, 
      to: `/login?returnTo=${returnTo}` 
    });
    
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // If admin required but user is not admin
  if (requireAdmin && !user.isAdmin) {
    log('guard.protected.admin_required', { 
      userId: user.id, 
      isAdmin: user.isAdmin 
    });
    
    return <Navigate to="/dashboard" replace />;
  }

  // Render protected content wrapped in AuthenticatedLayout
  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  );
};

export default ProtectedRoute;

