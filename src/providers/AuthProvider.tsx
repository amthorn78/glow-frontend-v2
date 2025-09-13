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
  
  // Bootstrap authentication via /me endpoint
  const { 
    data: user, 
    isLoading, 
    error,
    isSuccess,
    isError 
  } = useCurrentUser();

  // Handle initialization
  useEffect(() => {
    if (isSuccess || isError) {
      setIsInitialized(true);
      authStore.setInitialized(true);
    }
  }, [isSuccess, isError, authStore]);

  // Handle authentication state
  useEffect(() => {
    if (isSuccess && user) {
      authStore.setUser(user);
    } else if (isError) {
      authStore.logout();
    }
  }, [isSuccess, isError, user, authStore]);

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

