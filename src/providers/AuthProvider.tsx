// Auth Provider - Auth v2 Bootstrap
// Handles app initialization and authentication state

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCurrentUser } from '../queries/auth/authQueries';
import { useAuthStore } from '../stores/authStore';

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
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
  const authStore = useAuthStore();
  
  // Bootstrap authentication via /me endpoint (non-throwing)
  const { 
    data: authResult, 
    isLoading, 
    error,
    isSuccess,
    isError 
  } = useCurrentUser();

  // Step 4: Handle initialization - set to true on ANY first resolution (200 or 401)
  useEffect(() => {
    if (isSuccess || isError) {
      const traceEnabled = import.meta.env.VITE_TRACE_AUTH === '1' || true; // Force enable for debugging
      
      if (traceEnabled) {
        console.log('[STORE] AuthProvider initialization - first resolve:', {
          isSuccess,
          isError,
          hasAuthResult: !!authResult,
          auth: authResult?.auth,
          prevInitialized: authStore.isInitialized,
          nextInitialized: true,
          timestamp: new Date().toISOString()
        });
      }
      
      // Step 4: Set isInitialized=true on first resolve (success or error)
      if (!authStore.isInitialized) {
        setIsInitialized(true);
        authStore.setInitialized(true);
        
        if (traceEnabled) {
          console.log('[STORE] isInitialized: false → true (first resolve)');
        }
      }
    }
  }, [isSuccess, isError, authStore, authResult]);

  // DEBUGGING: Track all query state changes
  useEffect(() => {
    const traceEnabled = import.meta.env.VITE_TRACE_AUTH === '1' || true;
    if (traceEnabled) {
      console.log('[DEBUG] AuthProvider query state change:', {
        isLoading,
        isSuccess,
        isError,
        hasAuthResult: !!authResult,
        auth: authResult?.auth,
        hasUser: !!authResult?.user,
        currentStoreAuth: authStore.isAuthenticated,
        timestamp: new Date().toISOString()
      });
    }
  }, [isLoading, isSuccess, isError, authResult, authStore.isAuthenticated]);

  // Handle authentication state from resolved result
  useEffect(() => {
    const traceEnabled = import.meta.env.VITE_TRACE_AUTH === '1' || true; // Force enable for debugging
    
    if (isSuccess && authResult) {
      const prevAuth = authStore.isAuthenticated;
      
      if (authResult.auth === 'authenticated' && authResult.user) {
        if (traceEnabled) {
          console.log('[STORE] Setting authenticated user:', {
            prevAuth,
            nextAuth: true,
            userId: authResult.user.id,
            reason: 'AuthProvider_success_authenticated'
          });
        }
        
        authStore.setUser(authResult.user);
        
        if (traceEnabled && prevAuth !== true) {
          console.log('[STORE] isAuthenticated: false → true');
        }
      } else {
        if (traceEnabled) {
          console.log('[STORE] Setting unauthenticated state:', {
            prevAuth,
            nextAuth: false,
            reason: 'AuthProvider_success_unauthenticated'
          });
        }
        
        authStore.logout();
        
        if (traceEnabled && prevAuth !== false) {
          console.log('[STORE] isAuthenticated: true → false');
        }
      }
    } else if (isError) {
      const prevAuth = authStore.isAuthenticated;
      
      if (traceEnabled) {
        console.log('[STORE] Setting unauthenticated due to error:', {
          prevAuth,
          nextAuth: false,
          reason: 'AuthProvider_error'
        });
      }
      
      // Fallback: treat query errors as unauthenticated
      authStore.logout();
      
      if (traceEnabled && prevAuth !== false) {
        console.log('[STORE] isAuthenticated: true → false (error)');
      }
    }
  }, [isSuccess, isError, authResult, authStore]);

  const contextValue: AuthContextType = {
    isInitialized,
    isLoading,
    error: error?.message || null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

