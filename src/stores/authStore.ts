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
  
  // Login attempt tracking
  loginAttempts: number;
  lastLoginAttempt: number | null;
  isLocked: boolean;
  lockUntil: number | null;
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
  
  // Security actions
  incrementLoginAttempts: () => void;
  resetLoginAttempts: () => void;
  lockAccount: (duration: number) => void;
  checkAccountLock: () => boolean;
  
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
  
  // Security
  loginAttempts: 0,
  lastLoginAttempt: null,
  isLocked: false,
  lockUntil: null,
};

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

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
        // SECURITY ACTIONS
        // ========================================================================
        
        incrementLoginAttempts: () => {
          set((state) => {
            state.loginAttempts += 1;
            state.lastLoginAttempt = Date.now();
            
            // Lock account if too many attempts
            if (state.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
              state.isLocked = true;
              state.lockUntil = Date.now() + LOCK_DURATION;
            }
          });
        },
        
        resetLoginAttempts: () => {
          set((state) => {
            state.loginAttempts = 0;
            state.lastLoginAttempt = null;
            state.isLocked = false;
            state.lockUntil = null;
          });
        },
        
        lockAccount: (duration) => {
          set((state) => {
            state.isLocked = true;
            state.lockUntil = Date.now() + duration;
          });
        },
        
        checkAccountLock: () => {
          const state = get();
          
          if (state.isLocked && state.lockUntil) {
            if (Date.now() > state.lockUntil) {
              // Lock expired, reset
              set((draft) => {
                draft.isLocked = false;
                draft.lockUntil = null;
                draft.loginAttempts = 0;
              });
              return false;
            }
            return true;
          }
          
          return false;
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
            
            // Reset security state
            state.loginAttempts = 0;
            state.lastLoginAttempt = null;
            state.isLocked = false;
            state.lockUntil = null;
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
            
            // Keep security state for protection
            // Don't reset login attempts on logout
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
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
          loginAttempts: state.loginAttempts,
          lastLoginAttempt: state.lastLoginAttempt,
          isLocked: state.isLocked,
          lockUntil: state.lockUntil,
        }),
        
        // Version for migration handling
        version: 1,
        
        // Migration function for future updates
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migration from version 0 to 1
            return {
              ...persistedState,
              isInitialized: false,
            };
          }
          return persistedState;
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
  canLogin: (state: AuthStore) => !state.isLocked && !state.isLoading,
  
  // Security selectors
  remainingAttempts: (state: AuthStore) => Math.max(0, MAX_LOGIN_ATTEMPTS - state.loginAttempts),
  lockTimeRemaining: (state: AuthStore) => {
    if (!state.isLocked || !state.lockUntil) return 0;
    return Math.max(0, state.lockUntil - Date.now());
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
export { MAX_LOGIN_ATTEMPTS, LOCK_DURATION };
export type { AuthState, AuthActions };

