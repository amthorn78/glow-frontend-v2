// Enhanced Authentication Hook
// Phase 2: DISSOLUTION - Unified Auth Experience

import { useCallback, useEffect } from 'react';
import { useAuthStore, authSelectors } from '../stores/authStore';
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useCurrentUser,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useDeleteAccountMutation,
  useTokenRefresh,
} from '../queries/auth/authQueries';
import type { LoginCredentials, RegisterData, User } from '../core/types';

// ============================================================================
// ENHANCED AUTH HOOK
// ============================================================================

/**
 * Comprehensive authentication hook that combines Zustand store and React Query
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
  } = useAuthStore((state) => ({
    isAuthenticated: authSelectors.isAuthenticated(state),
    user: authSelectors.user(state),
    isLoading: authSelectors.isLoading(state),
    error: authSelectors.error(state),
    canLogin: authSelectors.canLogin(state),
  }));

  // ========================================================================
  // QUERIES AND MUTATIONS
  // ========================================================================
  
  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();
  const updateProfileMutation = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const resetPasswordMutation = useResetPasswordMutation();
  const deleteAccountMutation = useDeleteAccountMutation();
  const { refreshToken, isRefreshing } = useTokenRefresh();

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================
  
  const user = currentUser || storeUser;
  const isLoading = storeLoading || userLoading || isRefreshing;
  const error = storeError || (userError instanceof Error ? userError.message : null);
  
  const isLoggedIn = isAuthenticated && !!user && !error;
  const needsProfileCompletion = user && (!user.birthData || !user.birthData.birthDate);
  const isAdmin = user?.isAdmin || false;

  // ========================================================================
  // AUTHENTICATION ACTIONS
  // ========================================================================
  
  /**
   * Login with credentials
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const result = await loginMutation.mutateAsync(credentials);
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [loginMutation]);

  /**
   * Register new user
   */
  const register = useCallback(async (registerData: RegisterData) => {
    try {
      const result = await registerMutation.mutateAsync(registerData);
      return result;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, [registerMutation]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even on error
      authStore.logout();
    }
  }, [logoutMutation, authStore]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const result = await updateProfileMutation.mutateAsync(updates);
      return result;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }, [updateProfileMutation]);

  /**
   * Change password
   */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }, [changePasswordMutation]);

  /**
   * Request password reset
   */
  const forgotPassword = useCallback(async (email: string) => {
    try {
      await forgotPasswordMutation.mutateAsync(email);
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  }, [forgotPasswordMutation]);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      await resetPasswordMutation.mutateAsync({ token, newPassword });
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }, [resetPasswordMutation]);

  /**
   * Delete user account
   */
  const deleteAccount = useCallback(async (password: string) => {
    try {
      await deleteAccountMutation.mutateAsync(password);
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw error;
    }
  }, [deleteAccountMutation]);

  // ========================================================================
  // UTILITY ACTIONS
  // ========================================================================
  
  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    authStore.setError(null);
  }, [authStore]);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.isAdmin) return true;
    
    // Add specific permission logic here
    // For now, authenticated users have basic permissions
    return isAuthenticated;
  }, [user, isAuthenticated]);

  /**
   * Get user display name
   */
  const getDisplayName = useCallback((): string => {
    if (!user) return 'Guest';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.firstName) return user.firstName;
    if (user.username) return user.username;
    
    return 'User';
  }, [user]);

  // ========================================================================
  // EFFECTS
  // ========================================================================
  
  /**
   * Initialize authentication state
   */
  useEffect(() => {
    if (!authStore.isInitialized) {
      authStore.setInitialized(true);
    }
  }, [authStore]);

  /**
   * Auto-refresh token when needed
   */
  useEffect(() => {
    if (isAuthenticated && authStore.token) {
      // Set up token refresh interval (every 50 minutes for 1-hour tokens)
      const interval = setInterval(() => {
        refreshToken();
      }, 50 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, authStore.token, refreshToken]);

  // ========================================================================
  // RETURN OBJECT
  // ========================================================================
  
  return {
    // ======================================================================
    // STATE
    // ======================================================================
    
    // Authentication status
    isAuthenticated,
    isLoggedIn,
    isLoading,
    error,
    
    // User data
    user,
    needsProfileCompletion,
    isAdmin,
    
    // Security state
    canLogin,
    
    // Loading states for specific operations
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isForgettingPassword: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
    isRefreshingToken: isRefreshing,
    
    // ======================================================================
    // ACTIONS
    // ======================================================================
    
    // Authentication
    login,
    register,
    logout,
    
    // Profile management
    updateProfile,
    
    // Password management
    changePassword,
    forgotPassword,
    resetPassword,
    
    // Account management
    deleteAccount,
    
    // Utility functions
    clearError,
    hasPermission,
    getDisplayName,
    refreshToken,
    
    // ======================================================================
    // COMPUTED VALUES
    // ======================================================================
    
    // User info
    userName: getDisplayName(),
    userEmail: user?.email || '',
    userId: user?.id || '',
    
    // Permissions
    canEditProfile: isAuthenticated,
    canChangePassword: isAuthenticated,
    canDeleteAccount: isAuthenticated,
    canAccessAdmin: isAdmin,
    
    // Profile completion status
    profileCompletionPercentage: user ? calculateProfileCompletion(user) : 0,
    missingProfileFields: user ? getMissingProfileFields(user) : [],
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate profile completion percentage
 */
function calculateProfileCompletion(user: User): number {
  const fields = [
    user.firstName,
    user.lastName,
    user.email,
    user.birthData?.birthDate,
    user.birthData?.birthTime,
    user.birthData?.birthLocation,
    user.photos && user.photos.length > 0,
    user.bio,
  ];
  
  const completedFields = fields.filter(Boolean).length;
  return Math.round((completedFields / fields.length) * 100);
}

/**
 * Get missing profile fields
 */
function getMissingProfileFields(user: User): string[] {
  const missing: string[] = [];
  
  if (!user.firstName) missing.push('First Name');
  if (!user.lastName) missing.push('Last Name');
  if (!user.birthData?.birthDate) missing.push('Birth Date');
  if (!user.birthData?.birthTime) missing.push('Birth Time');
  if (!user.birthData?.birthLocation) missing.push('Birth Location');
  if (!user.photos || user.photos.length === 0) missing.push('Profile Photos');
  if (!user.bio) missing.push('Bio');
  
  return missing;
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for authentication status only
 */
const useAuthStatus = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
  };
};

/**
 * Hook for user profile data only
 */
const useAuthUser = () => {
  const { user, isLoading, updateProfile, isUpdatingProfile } = useAuth();
  
  return {
    user,
    isLoading,
    updateProfile,
    isUpdating: isUpdatingProfile,
  };
};

/**
 * Hook for authentication actions only
 */
const useAuthActions = () => {
  const { 
    login, 
    register, 
    logout, 
    isLoggingIn, 
    isRegistering, 
    isLoggingOut 
  } = useAuth();
  
  return {
    login,
    register,
    logout,
    isLoggingIn,
    isRegistering,
    isLoggingOut,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default useAuth;
export { useAuthStatus, useAuthUser, useAuthActions };

