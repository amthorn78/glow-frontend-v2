// Auth Provider - T-UI-001 Phase 5B
// Deterministic bootstrap with single /me call and telemetry

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useCurrentUser } from '../queries/auth/authQueries';
import { useAuthStore } from '../stores/authStore';
import { 
  isBootstrapSingleMe, 
  isPersistBarrierEnabled,
  logAuthFlags 
} from '../config/authFlags';
import {
  logBootstrapStart,
  logBootstrapSuccess,
  logBootstrapUnauthenticated,
  logPersistHydrationStart,
  logPersistHydrationComplete,
  logPersistHydrationBlocked
} from '../utils/authTelemetry';

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  isPersistHydrated: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPersistHydrated, setIsPersistHydrated] = useState(!isPersistBarrierEnabled());
  const authStore = useAuthStore();
  const bootstrapStartedRef = useRef(false);
  const bootstrapStartTime = useRef<number>(0);
  
  // F2: Bootstrap authentication via /me endpoint (single call, non-throwing)
  const { 
    data: authResult, 
    isLoading, 
    error,
    isSuccess,
    isError 
  } = useCurrentUser();

  // Log auth flags on mount (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logAuthFlags();
    }
  }, []);

  // F4: Persist hydration barrier - wait for Zustand to hydrate before proceeding
  useEffect(() => {
    if (isPersistBarrierEnabled() && !isPersistHydrated) {
      logPersistHydrationStart();
      
      // Check if Zustand persist has hydrated
      const checkHydration = () => {
        // Zustand persist sets hasHydrated flag when complete
        if (authStore.hasHydrated !== false) {
          logPersistHydrationComplete(['auth']);
          setIsPersistHydrated(true);
        } else {
          // Check again in next tick
          setTimeout(checkHydration, 10);
        }
      };
      
      checkHydration();
    }
  }, [isPersistHydrated, authStore.hasHydrated]);

  // F2: Log bootstrap start (single time)
  useEffect(() => {
    if (!bootstrapStartedRef.current && isPersistHydrated) {
      bootstrapStartedRef.current = true;
      bootstrapStartTime.current = Date.now();
      logBootstrapStart(window.location.pathname);
    }
  }, [isPersistHydrated]);

  // F2: Handle initialization - set to true on ANY first resolution (200 or 401)
  useEffect(() => {
    if ((isSuccess || isError) && isPersistHydrated) {
      const latency = Date.now() - bootstrapStartTime.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH_PROVIDER] Bootstrap resolution:', {
          isSuccess,
          isError,
          hasAuthResult: !!authResult,
          auth: authResult?.auth,
          latency_ms: latency,
          prevInitialized: authStore.isInitialized,
          nextInitialized: true,
          timestamp: new Date().toISOString()
        });
      }
      
      // F2: Set isInitialized=true on first resolve (success or error)
      if (!authStore.isInitialized) {
        setIsInitialized(true);
        authStore.setInitialized(true);
        
        // Log appropriate breadcrumb
        if (isSuccess && authResult?.auth === 'authenticated') {
          logBootstrapSuccess(latency, authResult.user?.id);
        } else {
          logBootstrapUnauthenticated(latency);
        }
      }
    }
  }, [isSuccess, isError, authStore, authResult, isPersistHydrated]);

  // Handle authentication state from resolved result
  useEffect(() => {
    if (isSuccess && authResult && isPersistHydrated) {
      const prevAuth = authStore.isAuthenticated;
      
      if (authResult.auth === 'authenticated' && authResult.user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH_PROVIDER] Setting authenticated user:', {
            prevAuth,
            nextAuth: true,
            userId: authResult.user.id,
            reason: 'bootstrap_success_authenticated'
          });
        }
        
        // F4: Only update if not overwriting fresher state
        if (!prevAuth || !authStore.user || authStore.user.id !== authResult.user.id) {
          authStore.setUser(authResult.user);
        }
        
      } else if (authResult.auth === 'unauthenticated') {
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH_PROVIDER] Setting unauthenticated state:', {
            prevAuth,
            nextAuth: false,
            reason: 'bootstrap_success_unauthenticated'
          });
        }
        
        authStore.clearAuth();
      }
    }
  }, [isSuccess, authResult, authStore, isPersistHydrated]);

  // F2: Handle /me 401 as data (not error) - clear auth state
  useEffect(() => {
    if (isError && isPersistHydrated) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH_PROVIDER] Bootstrap error (treating as unauthenticated):', {
          error: error?.message,
          prevAuth: authStore.isAuthenticated,
          nextAuth: false,
          reason: 'bootstrap_error_401'
        });
      }
      
      // Clear auth state on error (likely 401)
      authStore.clearAuth();
    }
  }, [isError, error, authStore, isPersistHydrated]);

  const contextValue: AuthContextType = {
    isInitialized: isInitialized && isPersistHydrated,
    isLoading: isLoading || !isPersistHydrated,
    error: error?.message || null,
    isPersistHydrated,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

