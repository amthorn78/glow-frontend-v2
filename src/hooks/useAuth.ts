// Authentication Hook - Auth v2 Cookie-based
// Phase 2: DISSOLUTION - Unified Auth Experience

import { useCallback, useEffect } from 'react';
import { useAuthStore, authSelectors } from '../stores/authStore';
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useCurrentUser,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useDeleteAccountMutation,
} from '../queries/auth/authQueries';
import { updateBasicInfoWithCsrf } from '../utils/csrfMutations';
import type { LoginCredentials, RegisterData, User } from '../core/types';

// ============================================================================
// ENHANCED AUTH HOOK - AUTH v2
// ============================================================================

/**
 * Comprehensive authentication hook for cookie-based auth
 * Provides a unified interface for all authentication operations
 */
const useAuth = () => {
  // ========================================================================
  // STORE STATE
  // ========================================================================
  
  const authStore = useAuthStore();
  const {
    isAuthenticated,
    user: storeUser,
    isLoading: storeLoading,
    error: storeError,
    canLogin,
    lastChecked,
    needsRecheck,
  } = useAuthStore((state) => ({
    isAuthenticated: authSelectors.isAuthenticated(state),
    user: authSelectors.user(state),
    isLoading: authSelectors.isLoading(state),
    error: authSelectors.error(state),
    canLogin: authSelectors.canLogin(state),
    lastChecked: authSelectors.lastChecked(state),
    needsRecheck: authSelectors.needsRecheck(state),
  }));

  // ========================================================================
  // QUERIES AND MUTATIONS
  // ========================================================================
  
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const resetPasswordMutation = useResetPasswordMutation();
  const deleteAccountMutation = useDeleteAccountMutation();
  
  // Current user query for /me endpoint
  const { 
    data: currentUserData, 
    isLoading: userLoading, 
    error: userError,
    refetch: refetchUser 
  } = useCurrentUser();

  // ========================================================================
  // COMPUTED STATE
  // ========================================================================
  
  const user = currentUserData || storeUser;
  const isLoading = storeLoading || userLoading;
  const error = storeError || (userError as any)?.message;

  // ========================================================================
  // AUTH ACTIONS
  // ========================================================================

  /**
   * Login with email and password
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      authStore.setLoading(true);
      authStore.setError(null);
      
      // Call login endpoint (sets cookie)
      const response = await loginMutation.mutateAsync(credentials);
      
      if (response.ok && response.user) {
        // Update store with user data
        authStore.login(response.user);
        
        // Immediately call /me to get fresh user data
        const meResponse = await refetchUser();
        if (meResponse.data) {
          authStore.setUser(meResponse.data);
        }
      }
      
      return response;
    } catch (error: any) {
      authStore.setError(error.message || 'Login failed');
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  }, [loginMutation, authStore, refetchUser]);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterData) => {
    try {
      authStore.setLoading(true);
      authStore.setError(null);
      
      const response = await registerMutation.mutateAsync(data);
      
      if (response.ok && response.user) {
        authStore.login(response.user);
      }
      
      return response;
    } catch (error: any) {
      authStore.setError(error.message || 'Registration failed');
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  }, [registerMutation, authStore]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      authStore.setLoading(true);
      
      // Call logout endpoint (clears cookie)
      await logoutMutation.mutateAsync();
      
      // Clear local state
      authStore.logout();
      
      // Broadcast logout to other tabs
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const channel = new BroadcastChannel('glow-auth');
        channel.postMessage({ type: 'LOGOUT' });
        channel.close();
      }
      
    } catch (error: any) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      authStore.logout();
    } finally {
      authStore.setLoading(false);
    }
  }, [logoutMutation, authStore]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      authStore.setLoading(true);
      authStore.setError(null);
      
      console.log('save.profile.put.sent', { 
        path: '/api/profile/basic', 
        method: 'PUT', 
        hasCookieHeader: true 
      });
      
      // FE-CSRF-PIPE-02: Use centralized CSRF wrapper
      const response = await updateBasicInfoWithCsrf(updates);
      
      if (response.ok && response.data?.user) {
        console.log('save.profile.put.200', { success: true });
        authStore.updateUser(response.data.user);
      } else {
        console.error('save.profile.put.error', response);
        throw new Error(response.error || 'Profile update failed');
      }
      
      return response;
    } catch (error: any) {
      authStore.setError(error.message || 'Profile update failed');
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  }, [authStore]);

  /**
   * Change password
   */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      authStore.setLoading(true);
      authStore.setError(null);
      
      const response = await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      
      return response;
    } catch (error: any) {
      authStore.setError(error.message || 'Password change failed');
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  }, [changePasswordMutation, authStore]);

  /**
   * Request password reset
   */
  const forgotPassword = useCallback(async (email: string) => {
    try {
      authStore.setLoading(true);
      authStore.setError(null);
      
      const response = await forgotPasswordMutation.mutateAsync({ email });
      
      return response;
    } catch (error: any) {
      authStore.setError(error.message || 'Password reset request failed');
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  }, [forgotPasswordMutation, authStore]);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      authStore.setLoading(true);
      authStore.setError(null);
      
      const response = await resetPasswordMutation.mutateAsync({ token, newPassword });
      
      return response;
    } catch (error: any) {
      authStore.setError(error.message || 'Password reset failed');
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  }, [resetPasswordMutation, authStore]);

  /**
   * Delete user account
   */
  const deleteAccount = useCallback(async (password: string) => {
    try {
      authStore.setLoading(true);
      authStore.setError(null);
      
      const response = await deleteAccountMutation.mutateAsync({ password });
      
      if (response.success) {
        authStore.logout();
      }
      
      return response;
    } catch (error: any) {
      authStore.setError(error.message || 'Account deletion failed');
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  }, [deleteAccountMutation, authStore]);

  /**
   * Check authentication status via /me
   */
  const checkAuth = useCallback(async () => {
    try {
      const response = await refetchUser();
      if (response.data) {
        authStore.setUser(response.data);
        return true;
      } else {
        authStore.logout();
        return false;
      }
    } catch (error) {
      authStore.logout();
      return false;
    }
  }, [refetchUser, authStore]);

  // ========================================================================
  // CROSS-TAB SYNC
  // ========================================================================

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel('glow-auth');
    
    channel.onmessage = (event) => {
      if (event.data.type === 'LOGOUT') {
        authStore.logout();
      } else if (event.data.type === 'LOGIN' && event.data.user) {
        authStore.login(event.data.user);
      }
    };

    return () => {
      channel.close();
    };
  }, [authStore]);

  // ========================================================================
  // RETURN INTERFACE
  // ========================================================================

  return {
    // State
    isAuthenticated,
    user,
    isLoading,
    error,
    canLogin,
    lastChecked,
    needsRecheck,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    deleteAccount,
    checkAuth,

    // Utilities
    clearError: () => authStore.setError(null),
    setLoading: authStore.setLoading,
  };
};

export default useAuth;

