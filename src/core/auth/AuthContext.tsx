// Unified Authentication Context for GLOW Dating App
// Phase 1: CALCINATION - Pure Foundation Architecture
// Replaces the problematic AuthContext with clean, consistent patterns

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '../types';
import { apiClient } from '../api';
import { AUTH_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

// ============================================================================
// AUTH STATE TYPES
// ============================================================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// AUTH ACTIONS
// ============================================================================

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_INITIALIZE'; payload: User | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// ============================================================================
// AUTH REDUCER
// ============================================================================

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isInitialized: true,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true,
      };

    case 'AUTH_INITIALIZE':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
        isInitialized: true,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isInitialized: false,
};

// ============================================================================
// AUTH CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// AUTH PROVIDER COMPONENT
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ============================================================================
  // INITIALIZATION EFFECT
  // ============================================================================

  useEffect(() => {
    initializeAuth();
  }, []);

  // ============================================================================
  // TOKEN REFRESH EFFECT
  // ============================================================================

  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(() => {
        checkTokenExpiration();
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated]);

  // ============================================================================
  // AUTH METHODS
  // ============================================================================

  const initializeAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Check if user is already authenticated
      if (apiClient.isAuthenticated()) {
        const userData = apiClient.getCurrentUserData();
        
        if (userData) {
          // Verify token is still valid by fetching current user
          try {
            const response = await apiClient.getCurrentUser();
            if (response.success && response.data) {
              dispatch({ type: 'AUTH_INITIALIZE', payload: response.data });
              return;
            }
          } catch (error) {
            // Token is invalid, clear auth data
            await apiClient.logout();
          }
        }
      }

      // No valid authentication found
      dispatch({ type: 'AUTH_INITIALIZE', payload: null });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      dispatch({ type: 'AUTH_INITIALIZE', payload: null });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await apiClient.login(credentials);
      
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
        
        // Show success message (could be handled by a toast system)
        console.log(SUCCESS_MESSAGES.LOGIN_SUCCESS);
      } else {
        throw new Error(response.error || ERROR_MESSAGES.INVALID_CREDENTIALS);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.SOMETHING_WENT_WRONG;
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await apiClient.register(userData);
      
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
        
        // Show success message
        console.log(SUCCESS_MESSAGES.REGISTER_SUCCESS);
      } else {
        throw new Error(response.error || ERROR_MESSAGES.SOMETHING_WENT_WRONG);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.SOMETHING_WENT_WRONG;
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await apiClient.logout();
      dispatch({ type: 'AUTH_LOGOUT' });
      
      // Show success message
      console.log(SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear local state
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const refreshUser = async () => {
    try {
      if (!state.isAuthenticated) return;

      const response = await apiClient.getCurrentUser();
      
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails, user might need to re-authenticate
      if (error instanceof Error && error.message.includes('401')) {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  const checkTokenExpiration = async () => {
    try {
      // This will automatically handle token refresh if needed
      await apiClient.getCurrentUser();
    } catch (error) {
      console.error('Token check failed:', error);
      // If token refresh fails, logout user
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// AUTH HOOK
// ============================================================================

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// ============================================================================
// AUTH GUARD COMPONENT
// ============================================================================

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = <div>Loading...</div>,
  requireAuth = true 
}) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return <>{fallback}</>;
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    // Redirect to login or show login form
    window.location.href = '/login';
    return <>{fallback}</>;
  }

  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from public pages
    window.location.href = '/dashboard';
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AuthContext;
export { AuthProvider, useAuth, AuthGuard };
export type { AuthState, AuthContextType };

