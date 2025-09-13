// Authentication Store - Zustand Implementation
// Phase 2: DISSOLUTION - Client State Management

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '../core/types';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthState {
  // Authentication status
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface AuthActions {
  // Authentication actions
  setUser: (user: User | null) => void;
  setTokens: (token: string, refreshToken: string) => void;
  clearTokens: () => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // Complete actions
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  
  // Utility actions
  reset: () => void;
}

export type AuthStore = AuthState & AuthActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AuthState = {
  // Authentication
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  
  // UI state
  isLoading: false,
  error: null,
  isInitialized: false,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        ...initialState,
        
        // ========================================================================
        // AUTHENTICATION ACTIONS
        // ========================================================================
        
        setUser: (user) => {
          set((state) => {
            state.user = user;
            state.isAuthenticated = !!user;
            state.error = null;
          });
        },
        
        setTokens: (token, refreshToken) => {
          set((state) => {
            state.token = token;
            state.refreshToken = refreshToken;
          });
        },
        
        clearTokens: () => {
          set((state) => {
            state.token = null;
            state.refreshToken = null;
          });
        },
        
        // ========================================================================
        // UI ACTIONS
        // ========================================================================
        
        setLoading: (isLoading) => {
          set((state) => {
            state.isLoading = isLoading;
          });
        },
        
        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },
        
        setInitialized: (isInitialized) => {
          set((state) => {
            state.isInitialized = isInitialized;
          });
        },
        
        // ========================================================================
        // COMPLETE ACTIONS
        // ========================================================================
        
        login: (user, token, refreshToken) => {
          set((state) => {
            // Set authentication data
            state.user = user;
            state.token = token;
            state.refreshToken = refreshToken;
            state.isAuthenticated = true;
            
            // Clear UI state
            state.isLoading = false;
            state.error = null;
          });
        },
        
        logout: () => {
          set((state) => {
            // Clear authentication data
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            
            // Clear UI state
            state.isLoading = false;
            state.error = null;
          });
        },
        
        updateUser: (updates) => {
          set((state) => {
            if (state.user) {
              state.user = { ...state.user, ...updates };
            }
          });
        },
        
        // ========================================================================
        // UTILITY ACTIONS
        // ========================================================================
        
        reset: () => {
          set(() => ({ ...initialState }));
        },
      })),
      {
        name: 'glow-auth-store',
        
        // Selective persistence - only persist important data
        partialize: (state) => {
          // Ensure partialize always returns a valid object
          try {
            return {
              user: state.user,
              token: state.token,
              refreshToken: state.refreshToken,
              isAuthenticated: state.isAuthenticated,
            };
          } catch (error) {
            console.warn('AuthStore partialize error, returning empty state:', error);
            return {
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            };
          }
        },
        
        // Version for migration handling
        version: 1,
        
        // Migration function for future updates
        migrate: (persistedState: any, version: number) => {
          try {
            if (version === 0) {
              // Migration from version 0 to 1
              return {
                ...persistedState,
                isInitialized: false,
              };
            }
            return persistedState;
          } catch (error) {
            console.warn('AuthStore migration error, falling back to initial state:', error);
            return initialState;
          }
        },
        
        // Defensive deserialization to handle corrupted localStorage
        deserialize: (str: string) => {
          try {
            // Handle empty or invalid strings
            if (!str || str.trim() === '' || str === 'undefined' || str === 'null') {
              console.warn('AuthStore: Empty or invalid persisted value, using initial state');
              return { state: initialState, version: 1 };
            }
            
            const parsed = JSON.parse(str);
            
            // Validate the parsed object structure
            if (!parsed || typeof parsed !== 'object') {
              console.warn('AuthStore: Invalid persisted object structure, using initial state');
              return { state: initialState, version: 1 };
            }
            
            // Ensure state exists and is an object
            if (!parsed.state || typeof parsed.state !== 'object') {
              console.warn('AuthStore: Invalid state in persisted data, using initial state');
              return { state: initialState, version: 1 };
            }
            
            return parsed;
          } catch (error) {
            console.warn('AuthStore: JSON parse error, falling back to initial state:', error);
            // Clear the corrupted value
            try {
              localStorage.removeItem('glow-auth-store');
            } catch (clearError) {
              console.warn('AuthStore: Could not clear corrupted localStorage:', clearError);
            }
            return { state: initialState, version: 1 };
          }
        },
      }
    ),
    {
      name: 'AuthStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

// Optimized selectors for common use cases
export const authSelectors = {
  // Basic selectors
  isAuthenticated: (state: AuthStore) => state.isAuthenticated,
  user: (state: AuthStore) => state.user,
  isLoading: (state: AuthStore) => state.isLoading,
  error: (state: AuthStore) => state.error,
  
  // Computed selectors
  isLoggedIn: (state: AuthStore) => state.isAuthenticated && !!state.user,
  hasToken: (state: AuthStore) => !!state.token,
  canLogin: (state: AuthStore) => !state.isLoading,
  
  // User info selectors
  userName: (state: AuthStore) => state.user?.firstName || state.user?.username || 'User',
  userEmail: (state: AuthStore) => state.user?.email || '',
  isAdmin: (state: AuthStore) => state.user?.isAdmin || false,
  hasProfile: (state: AuthStore) => !!state.user?.birthData,
};

// ============================================================================
// HOOKS
// ============================================================================

// Convenience hooks for common patterns
export const useAuthUser = () => useAuthStore(authSelectors.user);
export const useIsAuthenticated = () => useAuthStore(authSelectors.isAuthenticated);
export const useAuthLoading = () => useAuthStore(authSelectors.isLoading);
export const useAuthError = () => useAuthStore(authSelectors.error);
export const useCanLogin = () => useAuthStore(authSelectors.canLogin);

// ============================================================================
// UTILITIES
// ============================================================================

// Helper function to check if user needs to complete profile
export const needsProfileCompletion = (user: User | null): boolean => {
  if (!user) return false;
  
  return !user.birthData || 
         !user.birthData.birthDate || 
         !user.birthData.birthTime || 
         !user.birthData.birthLocation;
};

// Helper function to get user display name
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Guest';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.firstName) {
    return user.firstName;
  }
  
  if (user.username) {
    return user.username;
  }
  
  return 'User';
};

// ============================================================================
// EXPORTS
// ============================================================================

export default useAuthStore;
export type { AuthState, AuthActions };

