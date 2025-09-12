// Authentication Queries - React Query Implementation
// Phase 2: DISSOLUTION - Server State Management

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../../providers/QueryProvider';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../core/api';
import type { 
  LoginCredentials, 
  RegisterData, 
  User, 
  AuthResponse,
  RefreshTokenResponse 
} from '../../core/types';

// ============================================================================
// AUTHENTICATION MUTATIONS
// ============================================================================

/**
 * Login mutation with automatic state management
 */
const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      // Check account lock before attempting login
      if (authStore.checkAccountLock()) {
        const lockTime = authStore.lockUntil;
        const remainingTime = lockTime ? Math.ceil((lockTime - Date.now()) / 60000) : 0;
        throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
      }

      try {
        const response = await apiClient.login(credentials);
        return response;
      } catch (error) {
        // Increment login attempts on failure
        authStore.incrementLoginAttempts();
        throw error;
      }
    },

    onMutate: async (credentials) => {
      // Set loading state
      authStore.setLoading(true);
      authStore.setError(null);

      return { credentials };
    },

    onSuccess: (data, variables) => {
      // Update auth store with successful login
      authStore.login(data.user, data.token, data.refreshToken);
      
      // Reset login attempts on success
      authStore.resetLoginAttempts();

      // Invalidate and refetch user-related queries
      invalidateQueries.auth();
      
      // Prefetch user profile data
      queryClient.prefetchQuery({
        queryKey: queryKeys.profiles.profile(data.user.id),
        queryFn: () => apiClient.getUserProfile(data.user.id),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });

      console.log('Login successful:', data.user.email);
    },

    onError: (error, variables) => {
      console.error('Login failed:', error);
      
      // Set error in auth store
      if (error instanceof Error) {
        authStore.setError(error.message);
      } else {
        authStore.setError('Login failed. Please try again.');
      }
    },

    onSettled: () => {
      // Always clear loading state
      authStore.setLoading(false);
    },
  });
};

/**
 * Registration mutation with profile setup
 */
const useRegisterMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (registerData: RegisterData): Promise<AuthResponse> => {
      const response = await apiClient.register(registerData);
      return response;
    },

    onMutate: async (registerData) => {
      authStore.setLoading(true);
      authStore.setError(null);

      return { registerData };
    },

    onSuccess: (data, variables) => {
      // Update auth store with new user
      authStore.login(data.user, data.token, data.refreshToken);

      // Invalidate auth queries
      invalidateQueries.auth();

      console.log('Registration successful:', data.user.email);
    },

    onError: (error, variables) => {
      console.error('Registration failed:', error);
      
      if (error instanceof Error) {
        authStore.setError(error.message);
      } else {
        authStore.setError('Registration failed. Please try again.');
      }
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};

/**
 * Logout mutation with cleanup
 */
const useLogoutMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      // Call logout endpoint if token exists
      if (authStore.token) {
        try {
          await apiClient.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Logout API call failed:', error);
        }
      }
    },

    onMutate: async () => {
      authStore.setLoading(true);
    },

    onSuccess: () => {
      // Clear auth store
      authStore.logout();

      // Clear all cached data
      queryClient.clear();

      console.log('Logout successful');
    },

    onError: (error) => {
      console.error('Logout failed:', error);
      
      // Force logout even on error
      authStore.logout();
      queryClient.clear();
    },

    onSettled: () => {
      authStore.setLoading(false);
    },
  });
};

/**
 * Refresh token mutation for automatic token renewal
 */
const useRefreshTokenMutation = () => {
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (): Promise<RefreshTokenResponse> => {
      const refreshToken = authStore.refreshToken;
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.refreshToken(refreshToken);
      return response;
    },

    onSuccess: (data) => {
      // Update tokens in auth store
      authStore.setTokens(data.token, data.refreshToken);
      
      console.log('Token refreshed successfully');
    },

    onError: (error) => {
      console.error('Token refresh failed:', error);
      
      // Force logout on refresh failure
      authStore.logout();
    },

    // Don't retry token refresh
    retry: false,
  });
};

// ============================================================================
// USER PROFILE MUTATIONS
// ============================================================================

/**
 * Update user profile mutation
 */
const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (updates: Partial<User>): Promise<User> => {
      const userId = authStore.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await apiClient.updateUserProfile(userId, updates);
      return response;
    },

    onMutate: async (updates) => {
      // Optimistic update
      const previousUser = authStore.user;
      
      if (previousUser) {
        authStore.updateUser(updates);
      }

      return { previousUser };
    },

    onSuccess: (updatedUser, variables) => {
      // Update auth store with server response
      authStore.setUser(updatedUser);

      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.profiles.profile(updatedUser.id) 
      });

      console.log('Profile updated successfully');
    },

    onError: (error, variables, context) => {
      console.error('Profile update failed:', error);

      // Rollback optimistic update
      if (context?.previousUser) {
        authStore.setUser(context.previousUser);
      }
    },
  });
};

/**
 * Update birth data mutation
 */
const useUpdateBirthDataMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (birthData: any): Promise<User> => {
      const userId = authStore.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await apiClient.updateBirthData(userId, birthData);
      return response;
    },

    onSuccess: (updatedUser) => {
      // Update auth store
      authStore.setUser(updatedUser);

      // Invalidate compatibility-related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.matches.all 
      });

      console.log('Birth data updated successfully');
    },

    onError: (error) => {
      console.error('Birth data update failed:', error);
    },
  });
};

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Current user query with automatic refresh
 */
const useCurrentUser = () => {
  const authStore = useAuthStore();

  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async (): Promise<User> => {
      const response = await apiClient.getCurrentUser();
      return response;
    },
    enabled: authStore.isAuthenticated && !!authStore.token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

/**
 * User profile query by ID
 */
const useUserProfile = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.profiles.profile(userId),
    queryFn: async (): Promise<User> => {
      const response = await apiClient.getUserProfile(userId);
      return response;
    },
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * User birth data query
 */
const useUserBirthData = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.profiles.birthData(userId),
    queryFn: async () => {
      const response = await apiClient.getUserBirthData(userId);
      return response;
    },
    enabled: enabled && !!userId,
    staleTime: 60 * 60 * 1000, // 1 hour - birth data rarely changes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

/**
 * Change password mutation
 */
const useChangePasswordMutation = () => {
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
      await apiClient.changePassword(data.currentPassword, data.newPassword);
    },

    onSuccess: () => {
      console.log('Password changed successfully');
      
      // Optionally force re-login for security
      // authStore.logout();
    },

    onError: (error) => {
      console.error('Password change failed:', error);
    },
  });
};

/**
 * Forgot password mutation
 */
const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: async (email: string): Promise<void> => {
      await apiClient.forgotPassword(email);
    },

    onSuccess: () => {
      console.log('Password reset email sent');
    },

    onError: (error) => {
      console.error('Forgot password failed:', error);
    },
  });
};

/**
 * Reset password mutation
 */
const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: async (data: { token: string; newPassword: string }): Promise<void> => {
      await apiClient.resetPassword(data.token, data.newPassword);
    },

    onSuccess: () => {
      console.log('Password reset successful');
    },

    onError: (error) => {
      console.error('Password reset failed:', error);
    },
  });
};

// ============================================================================
// ACCOUNT MANAGEMENT
// ============================================================================

/**
 * Delete account mutation
 */
const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient();
  const authStore = useAuthStore();

  return useMutation({
    mutationFn: async (password: string): Promise<void> => {
      await apiClient.deleteAccount(password);
    },

    onSuccess: () => {
      // Clear all data and logout
      authStore.logout();
      queryClient.clear();
      
      console.log('Account deleted successfully');
    },

    onError: (error) => {
      console.error('Account deletion failed:', error);
    },
  });
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Hook to check if user is authenticated with fresh data
 */
const useIsAuthenticated = () => {
  const authStore = useAuthStore();
  const { data: currentUser, isLoading, error } = useCurrentUser();

  return {
    isAuthenticated: authStore.isAuthenticated && !error,
    user: currentUser || authStore.user,
    isLoading: isLoading || authStore.isLoading,
    error: error || authStore.error,
  };
};

/**
 * Hook for automatic token refresh
 */
const useTokenRefresh = () => {
  const authStore = useAuthStore();
  const refreshMutation = useRefreshTokenMutation();

  // Auto-refresh token when it's about to expire
  // This would typically be called by an interval or axios interceptor
  const refreshToken = async () => {
    if (authStore.token && authStore.refreshToken) {
      try {
        await refreshMutation.mutateAsync();
      } catch (error) {
        console.error('Auto token refresh failed:', error);
      }
    }
  };

  return {
    refreshToken,
    isRefreshing: refreshMutation.isPending,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useUpdateProfileMutation,
  useUpdateBirthDataMutation,
  useCurrentUser,
  useUserProfile,
  useUserBirthData,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useDeleteAccountMutation,
  useIsAuthenticated,
  useTokenRefresh,
};

