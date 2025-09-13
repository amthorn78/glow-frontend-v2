// Authentication Store - Zustand Implementation
// Auth v2: Cookie-based session management (no tokens)

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
  
  // UI state
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Session metadata
  lastChecked: number | null; // Timestamp of last /me check
}

export interface AuthActions {
  // Authentication actions
  setUser: (user: User | null) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // Session actions
  setLastChecked: (timestamp: number) => void;
  
  // Complete actions
  login: (user: User) => void;
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
  
  // UI state
  isLoading: false,
  error: null,
  isInitialized: false,
  
  // Session metadata
  lastChecked: null,
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
            state.lastChecked = Date.now();
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
        // SESSION ACTIONS
        // ========================================================================
        
        setLastChecked: (timestamp) => {
          set((state) => {
            state.lastChecked = timestamp;
          });
        },
        
        // ========================================================================
        // COMPLETE ACTIONS
        // ========================================================================
        
        login: (user) => {
          set((state) => {
            // Set authentication data
            state.user = user;
            state.isAuthenticated = true;
            state.lastChecked = Date.now();
            
            // Clear UI state
            state.isLoading = false;
            state.error = null;
          });
        },
        
        logout: () => {
          set((state) => {
            // Clear authentication data
            state.user = null;
            state.isAuthenticated = false;
            state.lastChecked = null;
            
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
        name: 'glow-auth-v2-store', // Changed name to avoid old localStorage conflicts
        
        // Selective persistence - only persist user and UI preferences
        partialize: (state) => {
          try {
            return {
              user: state.user,
              isAuthenticated: state.isAuthenticated,
              lastChecked: state.lastChecked,
            };
          } catch (error) {
            console.warn('AuthStore partialize error, returning empty state:', error);
            return {
              user: null,
              isAuthenticated: false,
              lastChecked: null,
            };
          }
        },
        
        // Version for migration handling
        version: 2, // Incremented for Auth v2
        
        // Migration function for Auth v2
        migrate: (persistedState: any, version: number) => {
          try {
            if (version < 2) {
              // Migration from token-based to cookie-based auth
              console.log('AuthStore: Migrating from token-based to cookie-based auth');
              return {
                user: persistedState?.user || null,
                isAuthenticated: false, // Force re-authentication via /me
                lastChecked: null,
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
              return { state: initialState, version: 2 };
            }
            
            const parsed = JSON.parse(str);
            
            // Validate the parsed object structure
            if (!parsed || typeof parsed !== 'object') {
              console.warn('AuthStore: Invalid persisted object structure, using initial state');
              return { state: initialState, version: 2 };
            }
            
            // Ensure state exists and is an object
            if (!parsed.state || typeof parsed.state !== 'object') {
              console.warn('AuthStore: Invalid state in persisted data, using initial state');
              return { state: initialState, version: 2 };
            }
            
            return parsed;
          } catch (error) {
            console.warn('AuthStore: JSON parse error, falling back to initial state:', error);
            // Clear the corrupted value and old token-based storage
            try {
              localStorage.removeItem('glow-auth-v2-store');
              localStorage.removeItem('glow-auth-store'); // Remove old token-based storage
            } catch (clearError) {
              console.warn('AuthStore: Could not clear corrupted localStorage:', clearError);
            }
            return { state: initialState, version: 2 };
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
  lastChecked: (state: AuthStore) => state.lastChecked,
  
  // Computed selectors
  isLoggedIn: (state: AuthStore) => state.isAuthenticated && !!state.user,
  canLogin: (state: AuthStore) => !state.isLoading,
  needsRecheck: (state: AuthStore) => {
    if (!state.lastChecked) return true;
    // Recheck if last check was more than 5 minutes ago
    return Date.now() - state.lastChecked > 5 * 60 * 1000;
  },
  
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

