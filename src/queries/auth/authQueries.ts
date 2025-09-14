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
      const response = await apiClient.getCurrentUser();
      
      // Always resolves - never throws
      if (response.data.auth === 'authenticated' && response.data.user) {
        // Update store with authenticated user
        authStore.setUser(response.data.user);
        return { auth: 'authenticated', user: response.data.user };
      } else {
        // Clear store for unauthenticated state
        authStore.logout();
        return { auth: 'unauthenticated', user: null };
      }
    },
    retry: false, // Never retry - first result is terminal
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
      if (data.ok && data.user) {
        // Update store with login response
        authStore.login(data.user);

        // Trust pattern: immediately call /api/auth/me for authoritative state
        try {
          await queryClient.refetchQueries({ queryKey: authQueryKeys.me });
        } catch (error) {
          console.warn('Failed to refetch user after login:', error);
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
      // Clear local state
      authStore.logout();

      // Broadcast logout to other tabs
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const channel = new BroadcastChannel('glow-auth');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
      }

      // Clear all cached data
      queryClient.clear();
    },

    onError: (error: any) => {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      authStore.logout();
      queryClient.clear();
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
      // Clear local state
      authStore.logout();

      // Broadcast logout to other tabs
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const channel = new BroadcastChannel('glow-auth');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
      }

      // Clear all cached data
      queryClient.clear();
    },

    onError: (error: any) => {
      console.error('Logout all error:', error);
      // Clear local state even if API call fails
      authStore.logout();
      queryClient.clear();
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
        queryClient.clear();
        
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

