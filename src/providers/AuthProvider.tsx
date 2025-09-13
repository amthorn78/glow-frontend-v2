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

  // Handle initialization - set to true on ANY resolution
  useEffect(() => {
    if (isSuccess || isError) {
      setIsInitialized(true);
      authStore.setInitialized(true);
    }
  }, [isSuccess, isError, authStore]);

  // Handle authentication state from resolved result
  useEffect(() => {
    if (isSuccess && authResult) {
      if (authResult.auth === 'authenticated' && authResult.user) {
        authStore.setUser(authResult.user);
      } else {
        authStore.logout();
      }
    } else if (isError) {
      // Fallback: treat query errors as unauthenticated
      authStore.logout();
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

