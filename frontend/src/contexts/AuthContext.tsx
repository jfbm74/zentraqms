/**
 * Authentication Context for ZentraQMS Frontend
 *
 * This context provides global authentication state management using React Context API.
 * It handles login, logout, token refresh, and user state across the entire application.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/auth.service";
import { AuthStorage } from "../utils/storage";
import {
  AuthState,
  AuthContextType,
  LoginRequest,
  AuthError,
  AuthEventType,
} from "../types/auth.types";
import { User } from "../types/user.types";
import { RBACService } from "../services/rbac.service";

/**
 * Authentication actions for reducer
 */
type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "LOGIN_SUCCESS";
      payload: { user: User; tokens: { access: string; refresh: string } };
    }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "TOKEN_REFRESHED"; payload: { access: string; refresh?: string } }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_RBAC_LOADING"; payload: boolean }
  | { type: "SET_RBAC_ERROR"; payload: string | null }
  | {
      type: "SET_RBAC_DATA";
      payload: {
        permissions: string[];
        roles: string[];
        permissionsByResource: Record<string, string[]>;
      };
    }
  | { type: "CLEAR_RBAC_ERROR" };

/**
 * Initial authentication state
 */
const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true, // Start as loading to check existing auth
  user: null,
  tokens: null,
  error: null,

  // RBAC state (Phase 5)
  permissions: [],
  roles: [],
  permissionsByResource: {},
  rbacLoading: false,
  rbacError: null,
  rbacLastUpdated: null,
};

/**
 * Authentication reducer for state management
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case "LOGIN_SUCCESS":
      // Save auth data to storage
      AuthStorage.setAuthData({
        user: action.payload.user,
        tokens: action.payload.tokens,
        rememberMe: true, // Default to remember
      });

      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        tokens: action.payload.tokens,
        error: null,
      };

    case "LOGOUT":
      // Clear auth data from storage
      AuthStorage.clearAuth();

      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: null,
      };

    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };

    case "TOKEN_REFRESHED": {
      const newTokens = {
        access: action.payload.access,
        refresh: action.payload.refresh || state.tokens?.refresh || "",
      };

      // Update stored tokens
      if (state.user) {
        AuthStorage.setAuthData({
          user: state.user,
          tokens: newTokens,
          rememberMe: true,
        });
      }

      return {
        ...state,
        tokens: newTokens,
      };
    }

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "SET_RBAC_LOADING":
      return {
        ...state,
        rbacLoading: action.payload,
      };

    case "SET_RBAC_ERROR":
      return {
        ...state,
        rbacError: action.payload,
        rbacLoading: false,
      };

    case "SET_RBAC_DATA":
      return {
        ...state,
        permissions: action.payload.permissions,
        roles: action.payload.roles,
        permissionsByResource: action.payload.permissionsByResource,
        rbacLoading: false,
        rbacError: null,
        rbacLastUpdated: new Date(),
      };

    case "CLEAR_RBAC_ERROR":
      return {
        ...state,
        rbacError: null,
      };

    default:
      return state;
  }
};

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication provider component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  /**
   * Refresh permissions and roles from backend (internal)
   */
  const internalRefreshPermissions = useCallback(async (): Promise<void> => {
    console.log("[AuthProvider] internalRefreshPermissions called");

    try {
      dispatch({ type: "SET_RBAC_LOADING", payload: true });
      dispatch({ type: "CLEAR_RBAC_ERROR" });

      const rbacData = await RBACService.fetchUserRBACData();
      console.log("[AuthProvider] RBAC data fetched successfully");

      // Transform backend data to frontend format
      console.log("[AuthProvider] Transforming permissions data...");
      const transformedPermissions = RBACService.transformPermissionsData(
        rbacData.permissions,
      );
      console.log(
        "[AuthProvider] Permissions transformed:",
        transformedPermissions ? "success" : "failed",
      );

      console.log("[AuthProvider] Transforming roles data...");
      const transformedRoles = RBACService.transformRolesData(rbacData.roles);
      console.log(
        "[AuthProvider] Roles transformed:",
        transformedRoles ? "success" : "failed",
      );

      console.log("[AuthProvider] Creating RBAC payload...");
      const rbacPayload = {
        permissions: transformedPermissions?.permissions || [],
        roles: transformedRoles?.roles || [],
        permissionsByResource:
          transformedPermissions?.permissionsByResource || {},
      };
      console.log("[AuthProvider] RBAC payload created:", {
        permissionsCount: rbacPayload.permissions.length,
        rolesCount: rbacPayload.roles.length,
      });

      // Update state
      console.log("[AuthProvider] Dispatching RBAC data to state...");
      dispatch({
        type: "SET_RBAC_DATA",
        payload: rbacPayload,
      });
      console.log("[AuthProvider] RBAC data dispatched successfully");

      // Cache the data in sessionStorage
      console.log("[AuthProvider] Caching RBAC data...");
      try {
        AuthStorage.setRBACData(rbacPayload);
        console.log("[AuthProvider] RBAC data cached successfully");
      } catch (storageError) {
        console.error(
          "[AuthProvider] Failed to cache RBAC data:",
          storageError,
        );
        // Continue even if caching fails
      }

      console.log("[AuthProvider] RBAC data refreshed successfully", {
        permissionsCount: rbacPayload.permissions.length,
        rolesCount: rbacPayload.roles.length,
        hasOrgCreate: rbacPayload.permissions.includes("organization.create"),
      });
    } catch (error) {
      console.error("[AuthProvider] Failed to refresh permissions:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load permissions";
      dispatch({ type: "SET_RBAC_ERROR", payload: errorMessage });
    }
  }, []);

  /**
   * Load cached RBAC data from sessionStorage
   */
  const loadCachedRBACData = useCallback(async () => {
    try {
      const cachedRBACData = AuthStorage.getRBACData();

      // Check if cache is valid (less than 1 hour old)
      if (cachedRBACData.timestamp && AuthStorage.isRBACCacheValid()) {
        dispatch({
          type: "SET_RBAC_DATA",
          payload: {
            permissions: cachedRBACData.permissions,
            roles: cachedRBACData.roles,
            permissionsByResource: cachedRBACData.permissionsByResource,
          },
        });
        return true; // Cache was valid and loaded
      } else {
        // Cache is stale, fetch fresh data
        await internalRefreshPermissions();
        return false; // Cache was stale, had to refresh
      }
    } catch (error) {
      console.error("[AuthProvider] Failed to load cached RBAC data:", error);
      // If loading cached data fails, try to refresh
      await internalRefreshPermissions();
      return false;
    }
  }, [internalRefreshPermissions]);

  /**
   * Public refresh permissions method for external use
   */
  const refreshPermissions = useCallback(async (): Promise<void> => {
    await internalRefreshPermissions();
  }, [internalRefreshPermissions]);

  /**
   * Initialize authentication state from storage
   */
  const initializeAuth = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Check if user has stored auth data
      const authData = AuthStorage.getAuthData();

      if (authData.tokens && authData.user) {
        // Verify if stored tokens are still valid
        const isValid = await authService.verifyToken(authData.tokens.access);

        if (isValid) {
          // Tokens are valid, restore auth state
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: authData.user,
              tokens: authData.tokens,
            },
          });

          // Load cached RBAC data
          await loadCachedRBACData();
        } else {
          // Try to refresh tokens
          try {
            const refreshResponse = await authService.refreshToken();
            if (refreshResponse.success) {
              // Get updated user data
              const userResponse = await authService.getCurrentUser();
              if (userResponse.success) {
                dispatch({
                  type: "LOGIN_SUCCESS",
                  payload: {
                    user: userResponse.data,
                    tokens: {
                      access: refreshResponse.data.access,
                      refresh:
                        refreshResponse.data.refresh || authData.tokens.refresh,
                    },
                  },
                });
              }
            }
          } catch {
            // Refresh failed, clear auth data
            AuthStorage.clearAuth();
            dispatch({ type: "LOGOUT" });
          }
        }
      } else {
        // No stored auth data
        dispatch({ type: "SET_LOADING", payload: false });
      }
    } catch (error) {
      console.error("[AuthProvider] Initialization error:", error);
      AuthStorage.clearAuth();
      dispatch({ type: "LOGOUT" });
    }
  }, [loadCachedRBACData]);

  /**
   * Login user with credentials
   */
  const login = useCallback(
    async (credentials: LoginRequest): Promise<void> => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "CLEAR_ERROR" });

        const response = await authService.login(credentials);

        if (response.success) {
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: response.data.user,
              tokens: {
                access: response.data.access,
                refresh: response.data.refresh,
              },
            },
          });

          // Mark that RBAC data should be loaded
          console.log(
            "[AuthProvider] Login successful, will load RBAC data...",
          );

          // Dispatch login success event
          window.dispatchEvent(
            new CustomEvent(AuthEventType.LOGIN_SUCCESS, {
              detail: { user: response.data.user },
            }),
          );
        }
      } catch (error) {
        console.error("[AuthProvider] Login error:", error);

        const authError = error as AuthError;
        dispatch({ type: "SET_ERROR", payload: authError.message });

        // Dispatch login failed event
        window.dispatchEvent(
          new CustomEvent(AuthEventType.LOGIN_FAILED, {
            detail: { error: authError },
          }),
        );

        throw error;
      }
    },
    [],
  );

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      await authService.logout();
      dispatch({ type: "LOGOUT" });

      // Dispatch logout event
      window.dispatchEvent(new CustomEvent(AuthEventType.LOGOUT));
    } catch (error) {
      console.error("[AuthProvider] Logout error:", error);
      // Still logout locally even if server call fails
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  /**
   * Refresh authentication tokens
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const response = await authService.refreshToken();

      if (response.success) {
        dispatch({
          type: "TOKEN_REFRESHED",
          payload: {
            access: response.data.access,
            refresh: response.data.refresh,
          },
        });

        // Dispatch token refreshed event
        window.dispatchEvent(
          new CustomEvent(AuthEventType.TOKEN_REFRESHED, {
            detail: { tokens: response.data },
          }),
        );
      }
    } catch (error) {
      console.error("[AuthProvider] Token refresh error:", error);

      // If refresh fails, logout user
      await logout();

      // Dispatch session expired event
      window.dispatchEvent(
        new CustomEvent(AuthEventType.SESSION_EXPIRED, {
          detail: { error },
        }),
      );

      throw error;
    }
  }, [logout]);

  /**
   * Get current user data from server
   */
  const getCurrentUser = useCallback(async (): Promise<void> => {
    try {
      const response = await authService.getCurrentUser();

      if (response.success) {
        dispatch({ type: "UPDATE_USER", payload: response.data });
      }
    } catch (error) {
      console.error("[AuthProvider] Get current user error:", error);

      // If getting user fails due to auth, logout
      if (error instanceof Error && error.message.includes("401")) {
        await logout();
      }

      throw error;
    }
  }, [logout]);

  /**
   * Clear authentication error
   */
  const clearError = useCallback((): void => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  /**
   * Check if token is expired
   */
  const isTokenExpired = useCallback((token?: string): boolean => {
    return authService.isTokenExpired(token);
  }, []);

  /**
   * Get access token
   */
  const getAccessToken = useCallback((): string | null => {
    return state.tokens?.access || AuthStorage.getAccessToken();
  }, [state.tokens]);

  /**
   * Get refresh token
   */
  const getRefreshToken = useCallback((): string | null => {
    return state.tokens?.refresh || AuthStorage.getRefreshToken();
  }, [state.tokens]);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return RBACService.hasPermission(state.permissions, permission);
    },
    [state.permissions],
  );

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      return RBACService.hasAnyPermission(state.permissions, permissions);
    },
    [state.permissions],
  );

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      return RBACService.hasAllPermissions(state.permissions, permissions);
    },
    [state.permissions],
  );

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      return RBACService.hasRole(state.roles, role);
    },
    [state.roles],
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return RBACService.hasAnyRole(state.roles, roles);
    },
    [state.roles],
  );

  /**
   * Check if user has all of the specified roles
   */
  const hasAllRoles = useCallback(
    (roles: string[]): boolean => {
      return RBACService.hasAllRoles(state.roles, roles);
    },
    [state.roles],
  );

  /**
   * Get permissions for specific resource
   */
  const getResourcePermissions = useCallback(
    (resource: string): string[] => {
      return RBACService.getResourcePermissions(
        state.permissionsByResource,
        resource,
      );
    },
    [state.permissionsByResource],
  );

  /**
   * Clear RBAC error
   */
  const clearRbacError = useCallback((): void => {
    dispatch({ type: "CLEAR_RBAC_ERROR" });
  }, []);

  /**
   * Load RBAC data when user becomes authenticated
   */
  useEffect(() => {
    if (
      state.isAuthenticated &&
      !state.rbacLoading &&
      state.permissions.length === 0 &&
      !state.rbacLastUpdated // Only load if never loaded before
    ) {
      console.log("[AuthProvider] User authenticated, loading RBAC data...");
      internalRefreshPermissions().catch((error) => {
        console.error(
          "[AuthProvider] Failed to load RBAC data on auth:",
          error,
        );
      });
    }
  }, [state.isAuthenticated, state.rbacLoading, state.rbacLastUpdated]);

  /**
   * Auto-refresh token when it's about to expire
   */
  useEffect(() => {
    if (!state.isAuthenticated || !state.tokens) {
      return;
    }

    const checkTokenExpiration = () => {
      const token = state.tokens?.access;
      if (token && isTokenExpired(token)) {
        refreshToken().catch((error) => {
          console.error("[AuthProvider] Auto-refresh failed:", error);
        });
      }
    };

    // Check token expiration every minute
    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.tokens, isTokenExpired, refreshToken]);

  /**
   * Listen for auth events from other tabs/windows
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Handle logout from another tab
      if (
        event.key === "zentra_access_token" &&
        !event.newValue &&
        state.isAuthenticated
      ) {
        dispatch({ type: "LOGOUT" });
      }
    };

    const handleAuthLogout = () => {
      if (state.isAuthenticated) {
        dispatch({ type: "LOGOUT" });
      }
    };

    // Listen for storage changes (multi-tab support)
    window.addEventListener("storage", handleStorageChange);

    // Listen for auth logout events
    window.addEventListener("auth:logout", handleAuthLogout);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, [state.isAuthenticated]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Context value
   */
  const contextValue: AuthContextType = React.useMemo(() => ({
    // State
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user,
    tokens: state.tokens,
    error: state.error,

    // RBAC state (Phase 5)
    permissions: state.permissions,
    roles: state.roles,
    permissionsByResource: state.permissionsByResource,
    rbacLoading: state.rbacLoading,
    rbacError: state.rbacError,
    rbacLastUpdated: state.rbacLastUpdated,

    // Actions
    login,
    logout,
    refreshToken,
    getCurrentUser,
    clearError,

    // RBAC methods (Phase 5)
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getResourcePermissions,
    refreshPermissions,
    clearRbacError,

    // Utility methods
    isTokenExpired,
    getAccessToken,
    getRefreshToken,
  }), [
    state.isAuthenticated,
    state.isLoading,
    state.user,
    state.tokens,
    state.error,
    state.permissions,
    state.roles,
    state.permissionsByResource,
    state.rbacLoading,
    state.rbacError,
    state.rbacLastUpdated,
    login,
    logout,
    refreshToken,
    getCurrentUser,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getResourcePermissions,
    refreshPermissions,
    clearRbacError,
    isTokenExpired,
    getAccessToken,
    getRefreshToken,
  ]);

  // Make auth context available for debugging in development
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      (window as unknown as { authContext: AuthContextType }).authContext = contextValue;
    }
  }, [contextValue]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context (internal use only)
 * Use useAuth from ../hooks/useAuth instead for external usage
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;
