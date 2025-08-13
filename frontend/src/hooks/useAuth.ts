/**
 * useAuth Hook for ZentraQMS Frontend
 * 
 * This custom hook provides a convenient interface for authentication operations
 * and state management throughout the application.
 */

import { useCallback, useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { User } from '../types/user.types';
import { LoginRequest, AuthError } from '../types/auth.types';

/**
 * Authentication hook interface
 */
interface UseAuthReturn {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;

  // Authentication actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;

  // User utility methods
  getUserFullName: () => string;
  getUserInitials: () => string;
  getUserDisplayName: () => string;
  isUserActive: () => boolean;
  isUserStaff: () => boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;

  // Token utility methods
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  isTokenExpired: (token?: string) => boolean;

  // Convenience methods
  canAccess: (requiredRoles?: string[], requiredPermissions?: string[]) => boolean;
  isAdmin: () => boolean;
  isSuperUser: () => boolean;
}

/**
 * Custom hook for authentication management
 * 
 * @returns Authentication state and methods
 */
export const useAuth = (): UseAuthReturn => {
  const {
    isAuthenticated,
    isLoading,
    user,
    error,
    login,
    logout,
    refreshToken,
    getCurrentUser,
    clearError,
    getAccessToken,
    getRefreshToken,
    isTokenExpired,
  } = useAuthContext();

  /**
   * Get user's full name
   */
  const getUserFullName = useCallback((): string => {
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`.trim() || user.email;
  }, [user]);

  /**
   * Get user's initials
   */
  const getUserInitials = useCallback((): string => {
    if (!user) return '';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || user.email[0].toUpperCase();
  }, [user]);

  /**
   * Get user's display name (full name or email)
   */
  const getUserDisplayName = useCallback((): string => {
    if (!user) return '';
    const fullName = getUserFullName();
    return fullName !== user.email ? fullName : user.email;
  }, [user, getUserFullName]);

  /**
   * Check if user is active
   */
  const isUserActive = useCallback((): boolean => {
    if (!user) return false;
    return user.is_active && user.is_verified;
  }, [user]);

  /**
   * Check if user is staff
   */
  const isUserStaff = useCallback((): boolean => {
    if (!user) return false;
    return user.is_staff;
  }, [user]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  }, [user]);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    if (!user || !user.roles || roles.length === 0) return false;
    return roles.some(role => user.roles.includes(role));
  }, [user]);

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user || !user.permissions || permissions.length === 0) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  }, [user]);

  /**
   * Check if user can access based on roles and permissions
   */
  const canAccess = useCallback((
    requiredRoles?: string[],
    requiredPermissions?: string[]
  ): boolean => {
    if (!isAuthenticated || !user) return false;

    // If no requirements specified, just check if authenticated
    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    // Check roles (user must have ALL required roles)
    if (requiredRoles?.length) {
      const hasAllRoles = requiredRoles.every(role => hasRole(role));
      if (!hasAllRoles) return false;
    }

    // Check permissions (user must have ALL required permissions)
    if (requiredPermissions?.length) {
      const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
      if (!hasAllPermissions) return false;
    }

    return true;
  }, [isAuthenticated, user, hasRole, hasPermission]);

  /**
   * Check if user is admin (has admin role or is staff)
   */
  const isAdmin = useCallback((): boolean => {
    if (!user) return false;
    return user.is_staff || hasRole('admin') || hasRole('administrator');
  }, [user, hasRole]);

  /**
   * Check if user is superuser
   */
  const isSuperUser = useCallback((): boolean => {
    if (!user) return false;
    // Check for superuser role or property when implemented
    return hasRole('superuser') || hasRole('super_admin');
  }, [user, hasRole]);

  /**
   * Enhanced login with error handling
   */
  const handleLogin = useCallback(async (credentials: LoginRequest): Promise<void> => {
    try {
      await login(credentials);
    } catch (error) {
      console.error('[useAuth] Login failed:', error);
      
      // Re-throw with additional context if needed
      const authError = error as AuthError;
      throw authError;
    }
  }, [login]);

  /**
   * Enhanced logout with cleanup
   */
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await logout();
    } catch (error) {
      console.error('[useAuth] Logout failed:', error);
      
      // Even if logout fails on server, we should clear local state
      // This is already handled in the AuthContext
    }
  }, [logout]);

  /**
   * Memoized return value for performance
   */
  const authHookValue = useMemo((): UseAuthReturn => ({
    // Authentication state
    isAuthenticated,
    isLoading,
    user,
    error,

    // Authentication actions (use enhanced versions)
    login: handleLogin,
    logout: handleLogout,
    refreshToken,
    getCurrentUser,
    clearError,

    // User utility methods
    getUserFullName,
    getUserInitials,
    getUserDisplayName,
    isUserActive,
    isUserStaff,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAnyPermission,

    // Token utility methods
    getAccessToken,
    getRefreshToken,
    isTokenExpired,

    // Convenience methods
    canAccess,
    isAdmin,
    isSuperUser,
  }), [
    isAuthenticated,
    isLoading,
    user,
    error,
    handleLogin,
    handleLogout,
    refreshToken,
    getCurrentUser,
    clearError,
    getUserFullName,
    getUserInitials,
    getUserDisplayName,
    isUserActive,
    isUserStaff,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAnyPermission,
    getAccessToken,
    getRefreshToken,
    isTokenExpired,
    canAccess,
    isAdmin,
    isSuperUser,
  ]);

  return authHookValue;
};

/**
 * Hook for authentication with automatic loading states
 */
export const useAuthWithLoading = () => {
  const auth = useAuth();
  
  return {
    ...auth,
    isInitializing: auth.isLoading && !auth.isAuthenticated && !auth.error,
    isLoginRequired: !auth.isLoading && !auth.isAuthenticated && !auth.error,
  };
};

/**
 * Hook for user profile operations
 */
export const useUserProfile = () => {
  const {
    user,
    getCurrentUser,
    isLoading,
    error,
  } = useAuth();

  const refreshProfile = useCallback(async () => {
    try {
      await getCurrentUser();
    } catch (error) {
      console.error('[useUserProfile] Failed to refresh profile:', error);
      throw error;
    }
  }, [getCurrentUser]);

  return {
    user,
    refreshProfile,
    isLoading,
    error,
    isProfileComplete: user ? !!(user.first_name && user.last_name && user.department) : false,
  };
};

/**
 * Hook for role-based access control
 */
export const useRoleAccess = (requiredRoles: string[] = [], requiredPermissions: string[] = []) => {
  const { canAccess, hasRole, hasPermission, hasAnyRole, hasAnyPermission, isAuthenticated } = useAuth();

  const hasAccess = useMemo(() => {
    return canAccess(requiredRoles, requiredPermissions);
  }, [canAccess, requiredRoles, requiredPermissions]);

  const hasAllRoles = useMemo(() => {
    return requiredRoles.every(role => hasRole(role));
  }, [hasRole, requiredRoles]);

  const hasAllPermissions = useMemo(() => {
    return requiredPermissions.every(permission => hasPermission(permission));
  }, [hasPermission, requiredPermissions]);

  return {
    hasAccess,
    hasAllRoles,
    hasAllPermissions,
    hasAnyRole: (roles: string[]) => hasAnyRole(roles),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(permissions),
    isAuthenticated,
  };
};

export default useAuth;