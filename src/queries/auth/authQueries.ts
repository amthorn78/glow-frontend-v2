// Auth Queries - Auth v2 Cookie-based
// Phase 2: DISSOLUTION - Server State Management

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries, getQueryClient } from '../../providers/QueryProvider';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../core/api';
import type { 
  LoginCredentials, 
  RegisterData, 
  User, 
} from '../../core/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const authQueryKeys = {
  me: ['auth', 'me'] as const,
  user: (id: string) => ['auth', 'user', id] as const,
};

// ============================================================================
// CURRENT USER QUERY - SINGLE SOURCE OF TRUTH
// ============================================================================

/**
 * Current user query - Auth v2 single source of truth via /api/auth/me
 * Non-throwing: treats 401 as valid "unauthenticated" state
 */
export const useCurrentUser = () => {
  const authStore = useAuthStore();

  return useQuery({
    queryKey: authQueryKeys.me,
    queryFn: async () => {
      const traceId = Math.random().toString(36).substr(2, 8);
      const traceEnabled = import.meta.env.VITE_TRACE_AUTH === '1' || true; // Force enable for debugging
      
      if (traceEnabled) {
        console.log(`[BOOTSTRAP-${traceId}] START: /api/auth/me probe starting...`);
      }
      
      try {
        const response = await apiClient.getCurrentUser();
        
        if (traceEnabled) {
          console.log(`[BOOTSTRAP-${traceId}] RESPONSE: /api/auth/me`, {
            status: response.status,
            auth: response.data.auth,
            hasUser: !!response.data.user
          });
        }
        
        // Always resolves - never throws
        if (response.data.auth === 'authenticated' && response.data.user) {
          if (traceEnabled) {
            console.log(`[BOOTSTRAP-${traceId}] END: Branch authenticated`);
          }
          
          // F3: Do not write directly to store - let AuthProvider handle it
          return { auth: 'authenticated', user: response.data.user };
        } else {
          if (traceEnabled) {
            console.log(`[BOOTSTRAP-${traceId}] END: Branch unauthenticated`);
          }
          
          // F3: Do not write directly to store - let AuthProvider handle it
          return { auth: 'unauthenticated', user: null };
        }
      } catch (error) {
        if (traceEnabled) {
          console.log(`[BOOTSTRAP-${traceId}] ERROR: /api/auth/me error:`, error);
        }
        
        // F3: Do not write directly to store - let AuthProvider handle it
        return { auth: 'unauthenticated', user: null };
      }
    },
    retry: false, // Single-shot: never retry, first result is terminal
    refetchOnWindowFocus: false, // Prevent background churn
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  });
};

// ============================================================================
// AUTHENTICATION MUTATIONS
// ============================================================================

/**
 * Login mutation with Auth v2 cookie flow
 */
export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.login(credentials);
      return response.data;
    },

    onMutate: async (credentials) => {
      // Set loading state
      authStore.setLoading(true);
      authStore.setError(null);
      return { credentials };
    },

    onSuccess: async (data, variables) => {
      const traceEnabled = import.meta.env.VITE_TRACE_AUTH === '1';
      
      if (traceEnabled) {
        console.log('[MUTATIONS] Login success:', {
          ok: data.ok,
          hasUser: !!data.user,
          endpoint: '/api/auth/login'
        });
      }
      
      if (data.ok && data.user) {
        // CRITICAL FIX: Use refetchQueries to trigger AuthProvider hook updates
        // 1. Invalidate /me query
        if (traceEnabled) {
          console.log('[SYNC_NAV] Step 1: Invalidating /me after login');
        }
        
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
        
        // 2. Refetch to trigger AuthProvider's useCurrentUser() hook
        try {
          if (traceEnabled) {
            console.log('[SYNC_NAV] Step 2: Refetching /me to trigger AuthProvider hook');
          }
          
          await queryClient.refetchQueries({ 
            queryKey: authQueryKeys.me,
            type: 'active' // Only refetch active queries (the AuthProvider hook)
          });
          
          if (traceEnabled) {
            console.log('[SYNC_NAV] Step 3: Refetch complete - AuthProvider should update store');
          }
          
          // 3. Navigation will be handled by AuthNavigationHandler when store updates
          if (traceEnabled) {
            console.log('[SYNC_NAV] Step 4: Waiting for store update to trigger navigation');
          }
          
        } catch (error) {
          if (traceEnabled) {
            console.warn('[SYNC_NAV] Failed to refetch /me after login:', error);
          }
        }

        // Broadcast login to other tabs
        if (typeof window !== 'undefined' && window.BroadcastChannel) {
          const channel = new BroadcastChannel('glow-auth');
          channel.postMessage({ type: 'LOGIN', user: data.user });
          channel.close();
        }

        // Invalidate all auth-related queries
        await invalidateQueries(queryClient, ['auth']);
      }
    },

    onError: (error: any, variables) => {
      authStore.setError(error.message || 'Login failed');
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};

/**
 * Register mutation
 */
export const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiClient.register(data);
      return response.data;
    },

    onMutate: async (data) => {
      authStore.setLoading(true);
      authStore.setError(null);
      return { data };
    },

    onSuccess: async (data, variables) => {
      if (data.ok && data.user) {
        authStore.login(data.user);

        // Trust pattern: call /me for authoritative state
        try {
          await queryClient.refetchQueries({ queryKey: authQueryKeys.me });
        } catch (error) {
          console.warn('Failed to refetch user after register:', error);
        }

        // Broadcast login to other tabs
        if (typeof window !== 'undefined' && window.BroadcastChannel) {
          const channel = new BroadcastChannel('glow-auth');
          channel.postMessage({ type: 'LOGIN', user: data.user });
          channel.close();
        }

        await invalidateQueries(queryClient, ['auth']);
      }
    },

    onError: (error: any, variables) => {
      authStore.setError(error.message || 'Registration failed');
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};

/**
 * Logout mutation
 */
export const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.logout();
      return response.data;
    },

    onMutate: async () => {
      authStore.setLoading(true);
      return {};
    },

    onSuccess: async (data) => {
      const traceEnabled = import.meta.env.VITE_TRACE_AUTH === '1';
      
      if (traceEnabled) {
        console.log('[MUTATIONS] Logout success:', {
          ok: data.ok,
          endpoint: '/api/auth/logout'
        });
      }
      
      // CRITICAL FIX: Use refetchQueries to trigger AuthProvider hook updates
      // 1. Invalidate /me query
      if (traceEnabled) {
        console.log('[SYNC_NAV] Step 1: Invalidating /me after logout');
      }
      
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
      
      // 2. Refetch to trigger AuthProvider's useCurrentUser() hook
      try {
        if (traceEnabled) {
          console.log('[SYNC_NAV] Step 2: Refetching /me to trigger AuthProvider hook');
        }
        
        await queryClient.refetchQueries({ 
          queryKey: authQueryKeys.me,
          type: 'active' // Only refetch active queries (the AuthProvider hook)
        });
        
        if (traceEnabled) {
          console.log('[SYNC_NAV] Step 3: Refetch complete - AuthProvider should update store');
        }
        
        // 3. Navigation will be handled by AuthNavigationHandler when store updates
        if (traceEnabled) {
          console.log('[SYNC_NAV] Step 4: Waiting for store update to trigger navigation');
        }
        
      } catch (error) {
        if (traceEnabled) {
          console.warn('[SYNC_NAV] Failed to refetch /me after logout:', error);
        }
      }

      // Broadcast logout to other tabs
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const channel = new BroadcastChannel('glow-auth');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
      }
    },

    onError: (error: any) => {
      const traceEnabled = import.meta.env.VITE_TRACE_AUTH === '1';
      
      if (traceEnabled) {
        console.error('[MUTATIONS] Logout error:', error);
      }
      
      // F3: Even on error, normalize via /me
      queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};

/**
 * Logout All Sessions mutation - T-UI-001
 */
export const useLogoutAllMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.logoutAll();
      return response.data;
    },

    onMutate: async () => {
      authStore.setLoading(true);
      return {};
    },

    onSuccess: async (data) => {
      const traceEnabled = import.meta.env.VITE_TRACE_AUTH === '1';
      
      if (traceEnabled) {
        console.log('[MUTATIONS] Logout-all success:', {
          ok: data.ok,
          endpoint: '/api/auth/logout-all'
        });
      }
      
      // F3: Normalize via /me - do not write directly to store
      // 1. Invalidate /me query
      if (traceEnabled) {
        console.log('[ME_QUERY] Invalidating /me after logout-all');
      }
      
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
      
      // 2. Await refetch to get authoritative state
      try {
        if (traceEnabled) {
          console.log('[ME_QUERY] Refetching /me for authoritative state');
        }
        
        await queryClient.refetchQueries({ queryKey: authQueryKeys.me });
        
        if (traceEnabled) {
          console.log('[ME_QUERY] Refetch complete - store updated from /me');
        }
      } catch (error) {
        if (traceEnabled) {
          console.warn('[ME_QUERY] Failed to refetch /me after logout-all:', error);
        }
      }

      // Broadcast logout to other tabs
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const channel = new BroadcastChannel('glow-auth');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
      }
    },

    onError: (error: any) => {
      const traceEnabled = import.meta.env.VITE_TRACE_AUTH === '1';
      
      if (traceEnabled) {
        console.error('[MUTATIONS] Logout-all error:', error);
      }
      
      // F3: Even on error, normalize via /me
      queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};

// ============================================================================
// PROFILE MUTATIONS
// ============================================================================

/**
 * Update profile mutation
 */
export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const response = await apiClient.updateProfile(updates);
      return response.data;
    },

    onMutate: async (updates) => {
      authStore.setLoading(true);
      authStore.setError(null);

      // Optimistic update
      const previousUser = authStore.user;
      if (previousUser) {
        authStore.updateUser(updates);
      }

      return { previousUser };
    },

    onSuccess: async (data, variables) => {
      if (data.user) {
        authStore.updateUser(data.user);
        
        // Invalidate user queries
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
      }
    },

    onError: (error: any, variables, context) => {
      // Revert optimistic update
      if (context?.previousUser) {
        authStore.setUser(context.previousUser);
      }
      authStore.setError(error.message || 'Profile update failed');
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};

/**
 * Change password mutation
 */
export const useChangePasswordMutation = () => {
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiClient.changePassword(data);
      return response.data;
    },

    onMutate: async (data) => {
      authStore.setLoading(true);
      authStore.setError(null);
      return { data };
    },

    onError: (error: any, variables) => {
      authStore.setError(error.message || 'Password change failed');
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};

/**
 * Forgot password mutation
 */
export const useForgotPasswordMutation = () => {
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await apiClient.forgotPassword(data);
      return response.data;
    },

    onMutate: async (data) => {
      authStore.setLoading(true);
      authStore.setError(null);
      return { data };
    },

    onError: (error: any, variables) => {
      authStore.setError(error.message || 'Password reset request failed');
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};

/**
 * Reset password mutation
 */
export const useResetPasswordMutation = () => {
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const response = await apiClient.resetPassword(data);
      return response.data;
    },

    onMutate: async (data) => {
      authStore.setLoading(true);
      authStore.setError(null);
      return { data };
    },

    onError: (error: any, variables) => {
      authStore.setError(error.message || 'Password reset failed');
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};

/**
 * Delete account mutation
 */
export const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (data: { password: string }) => {
      const response = await apiClient.deleteAccount(data);
      return response.data;
    },

    onMutate: async (data) => {
      authStore.setLoading(true);
      authStore.setError(null);
      return { data };
    },

    onSuccess: async (data) => {
      if (data.success) {
        // Clear all state and redirect
        authStore.logout();
        // Only invalidate auth queries, not entire cache (T-UI-001 spec)
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
        
        // Broadcast logout to other tabs
        if (typeof window !== 'undefined' && window.BroadcastChannel) {
          const channel = new BroadcastChannel('glow-auth');
          channel.postMessage({ type: 'LOGOUT' });
          channel.close();
        }
      }
    },

    onError: (error: any, variables) => {
      authStore.setError(error.message || 'Account deletion failed');
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};


/**
 * Update birth data mutation
 */
export const useUpdateBirthDataMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (birthData: any) => {
      const response = await apiClient.updateBirthData(birthData);
      return response.data;
    },

    onMutate: async (birthData) => {
      authStore.setLoading(true);
      authStore.setError(null);
      return { birthData };
    },

    onSuccess: async (data, variables) => {
      if (data.user) {
        authStore.updateUser(data.user);
        
        // Invalidate user queries
        await queryClient.invalidateQueries({ queryKey: authQueryKeys.me });
      }
    },

    onError: (error: any, variables) => {
      authStore.setError(error.message || 'Birth data update failed');
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};


/**
 * User birth data query
 */
export const useUserBirthData = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'birthData', user?.id],
    queryFn: async () => {
      if (!user?.birthData) {
        return null;
      }
      return user.birthData;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

