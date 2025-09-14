// Auth Navigation Handler - F1: Event-driven auth navigation
// Subscribes to auth store changes and handles navigation

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const AuthNavigationHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isInitialized } = useAuthStore();

  useEffect(() => {
    // Only handle navigation after auth is initialized
    if (!isInitialized) return;

    const traceEnabled = import.meta.env.VITE_TRACE_AUTH === '1';

    // F1: Subscribe to auth store changes for navigation
    const unsubscribe = useAuthStore.subscribe(
      (state, prevState) => {
        if (traceEnabled) {
          console.log('[STORE] Auth state transition:', {
            from: { isAuthenticated: prevState.isAuthenticated },
            to: { isAuthenticated: state.isAuthenticated },
            reason: 'store_subscription'
          });
        }

        // Handle login: false → true
        if (!prevState.isAuthenticated && state.isAuthenticated) {
          if (traceEnabled) {
            console.log('[NAV_ACTION] Login navigation triggered', {
              from: location.pathname,
              source: 'store'
            });
          }
          
          // Check for stored returnTo
          const returnTo = sessionStorage.getItem('auth-returnTo');
          if (returnTo) {
            sessionStorage.removeItem('auth-returnTo');
            if (traceEnabled) {
              console.log('[NAV_ACTION] Navigating to returnTo:', returnTo);
            }
            navigate(returnTo, { replace: true });
            return;
          }
          
          // Default to dashboard
          if (traceEnabled) {
            console.log('[NAV_ACTION] Navigating to dashboard');
          }
          navigate('/dashboard', { replace: true });
        }
        
        // Handle logout: true → false
        if (prevState.isAuthenticated && !state.isAuthenticated) {
          if (traceEnabled) {
            console.log('[NAV_ACTION] Logout navigation triggered', {
              from: location.pathname,
              source: 'store'
            });
          }
          
          // Preserve returnTo if on protected route
          if (location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/') {
            const returnTo = encodeURIComponent(location.pathname + location.search);
            if (traceEnabled) {
              console.log('[NAV_ACTION] Preserving returnTo:', returnTo);
            }
            navigate(`/login?returnTo=${returnTo}`, { replace: true });
            return;
          }
          
          // Default to login
          if (traceEnabled) {
            console.log('[NAV_ACTION] Navigating to login');
          }
          navigate('/login', { replace: true });
        }
      },
      // Selector: only subscribe to auth-relevant changes
      (state) => ({ isAuthenticated: state.isAuthenticated })
    );

    return unsubscribe;
  }, [navigate, location, isInitialized]);

  return null; // This component only handles navigation, no UI
};

export default AuthNavigationHandler;

