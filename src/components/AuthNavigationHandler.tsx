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
    if (!isInitialized) {
      console.log('[DEBUG] AuthNavigationHandler: Not initialized yet');
      return;
    }

    console.log('[DEBUG] AuthNavigationHandler: Setting up subscription');
    const traceEnabled = import.meta.env.VITE_TRACE_AUTH === '1' || true; // Force enable for debugging

    // F1: Subscribe to auth store changes for navigation
    const unsubscribe = useAuthStore.subscribe(
      (state, prevState) => {
        const traceId = Math.random().toString(36).substr(2, 8);
        
        console.log(`[DEBUG-${traceId}] Store subscription fired:`, {
          from: { isAuthenticated: prevState.isAuthenticated },
          to: { isAuthenticated: state.isAuthenticated },
          location: location.pathname
        });

        if (traceEnabled) {
          console.log(`[STORE-${traceId}] Auth state transition:`, {
            from: { 
              isAuthenticated: prevState.isAuthenticated,
              isInitialized: prevState.isInitialized 
            },
            to: { 
              isAuthenticated: state.isAuthenticated,
              isInitialized: state.isInitialized 
            },
            reason: 'store_subscription'
          });
        }

        // Handle login: false → true
        if (!prevState.isAuthenticated && state.isAuthenticated) {
          if (traceEnabled) {
            console.log(`[NAV_PLAN-${traceId}] Login navigation planned:`, {
              from: location.pathname,
              reason: 'isAuthenticated: false → true',
              source: 'store_subscription'
            });
          }
          
          // Check for stored returnTo
          const returnTo = sessionStorage.getItem('auth-returnTo');
          if (returnTo) {
            sessionStorage.removeItem('auth-returnTo');
            if (traceEnabled) {
              console.log(`[NAV_DO-${traceId}] Navigating to returnTo: ${returnTo}`);
            }
            navigate(returnTo, { replace: true });
            return;
          }
          
          // Default to dashboard
          if (traceEnabled) {
            console.log(`[NAV_DO-${traceId}] Navigating to dashboard: /dashboard`);
          }
          navigate('/dashboard', { replace: true });
        }
        
        // Handle logout: true → false
        if (prevState.isAuthenticated && !state.isAuthenticated) {
          if (traceEnabled) {
            console.log(`[NAV_PLAN-${traceId}] Logout navigation planned:`, {
              from: location.pathname,
              reason: 'isAuthenticated: true → false',
              source: 'store_subscription'
            });
          }
          
          // Preserve returnTo if on protected route
          if (location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/') {
            const returnTo = encodeURIComponent(location.pathname + location.search);
            if (traceEnabled) {
              console.log(`[NAV_PLAN-${traceId}] Preserving returnTo: ${returnTo}`);
            }
            if (traceEnabled) {
              console.log(`[NAV_DO-${traceId}] Navigating to login with returnTo: /login?returnTo=${returnTo}`);
            }
            navigate(`/login?returnTo=${returnTo}`, { replace: true });
            return;
          }
          
          // Default to login
          if (traceEnabled) {
            console.log(`[NAV_DO-${traceId}] Navigating to login: /login`);
          }
          navigate('/login', { replace: true });
        }
      },
      // Selector: only subscribe to auth-relevant changes
      (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized 
      })
    );

    return unsubscribe;
  }, [navigate, location, isInitialized]);

  return null; // This component only handles navigation, no UI
};

export default AuthNavigationHandler;

