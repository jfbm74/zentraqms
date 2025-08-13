/**
 * Authentication Context for ZentraQMS Frontend
 * 
 * This context provides global authentication state management using React Context API.
 * It handles login, logout, token refresh, and user state across the entire application.
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { AuthStorage } from '../utils/storage';
import {
  AuthState,
  AuthContextType,
  LoginRequest,
  AuthError,
  AuthEventType,
} from '../types/auth.types';
import { User } from '../types/user.types';

/**
 * Authentication actions for reducer
 */
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: { access: string; refresh: string } } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'TOKEN_REFRESHED'; payload: { access: string; refresh?: string } }
  | { type: 'CLEAR_ERROR' };

/**
 * Initial authentication state
 */
const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true, // Start as loading to check existing auth
  user: null,
  tokens: null,
  error: null,
};

/**
 * Authentication reducer for state management
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        tokens: action.payload.tokens,
        error: null,
      };

    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        tokens: null,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'TOKEN_REFRESHED':
      return {
        ...state,
        tokens: {
          access: action.payload.access,
          refresh: action.payload.refresh || state.tokens?.refresh || '',
        },
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
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
   * Initialize authentication state from storage
   */
  const initializeAuth = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Check if user has stored auth data
      const authData = AuthStorage.getAuthData();
      
      if (authData.tokens && authData.user) {
        // Verify if stored tokens are still valid
        const isValid = await authService.verifyToken(authData.tokens.access);
        
        if (isValid) {
          // Tokens are valid, restore auth state
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: authData.user,
              tokens: authData.tokens,
            },
          });
        } else {
          // Try to refresh tokens
          try {
            const refreshResponse = await authService.refreshToken();
            if (refreshResponse.success) {
              // Get updated user data
              const userResponse = await authService.getCurrentUser();
              if (userResponse.success) {
                dispatch({
                  type: 'LOGIN_SUCCESS',
                  payload: {
                    user: userResponse.data,
                    tokens: {
                      access: refreshResponse.data.access,
                      refresh: refreshResponse.data.refresh || authData.tokens.refresh,
                    },
                  },
                });
              }
            }
          } catch {
            // Refresh failed, clear auth data
            AuthStorage.clearAuth();
            dispatch({ type: 'LOGOUT' });
          }
        }
      } else {
        // No stored auth data
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('[AuthProvider] Initialization error:', error);
      AuthStorage.clearAuth();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  /**
   * Login user with credentials
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const response = await authService.login(credentials);
      
      if (response.success) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            tokens: {
              access: response.data.access,
              refresh: response.data.refresh,
            },
          },
        });

        // Dispatch login success event
        window.dispatchEvent(
          new CustomEvent(AuthEventType.LOGIN_SUCCESS, {
            detail: { user: response.data.user },
          })
        );
      }
    } catch (error) {
      console.error('[AuthProvider] Login error:', error);
      
      const authError = error as AuthError;
      dispatch({ type: 'SET_ERROR', payload: authError.message });

      // Dispatch login failed event
      window.dispatchEvent(
        new CustomEvent(AuthEventType.LOGIN_FAILED, {
          detail: { error: authError },
        })
      );

      throw error;
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await authService.logout();
      dispatch({ type: 'LOGOUT' });

      // Dispatch logout event
      window.dispatchEvent(new CustomEvent(AuthEventType.LOGOUT));
    } catch (error) {
      console.error('[AuthProvider] Logout error:', error);
      // Still logout locally even if server call fails
      dispatch({ type: 'LOGOUT' });
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
          type: 'TOKEN_REFRESHED',
          payload: {
            access: response.data.access,
            refresh: response.data.refresh,
          },
        });

        // Dispatch token refreshed event
        window.dispatchEvent(
          new CustomEvent(AuthEventType.TOKEN_REFRESHED, {
            detail: { tokens: response.data },
          })
        );
      }
    } catch (error) {
      console.error('[AuthProvider] Token refresh error:', error);
      
      // If refresh fails, logout user
      await logout();
      
      // Dispatch session expired event
      window.dispatchEvent(
        new CustomEvent(AuthEventType.SESSION_EXPIRED, {
          detail: { error },
        })
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
        dispatch({ type: 'UPDATE_USER', payload: response.data });
      }
    } catch (error) {
      console.error('[AuthProvider] Get current user error:', error);
      
      // If getting user fails due to auth, logout
      if (error instanceof Error && error.message.includes('401')) {
        await logout();
      }
      
      throw error;
    }
  }, [logout]);

  /**
   * Clear authentication error
   */
  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
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
          console.error('[AuthProvider] Auto-refresh failed:', error);
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
      if (event.key === 'zentra_access_token' && !event.newValue && state.isAuthenticated) {
        dispatch({ type: 'LOGOUT' });
      }
    };

    const handleAuthLogout = () => {
      if (state.isAuthenticated) {
        dispatch({ type: 'LOGOUT' });
      }
    };

    // Listen for storage changes (multi-tab support)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for auth logout events
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:logout', handleAuthLogout);
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
  const contextValue: AuthContextType = {
    // State
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user,
    tokens: state.tokens,
    error: state.error,

    // Actions
    login,
    logout,
    refreshToken,
    getCurrentUser,
    clearError,

    // Utility methods
    isTokenExpired,
    getAccessToken,
    getRefreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Higher-order component for auth protection
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return function AuthProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuthContext();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login will be handled by route protection
      return null;
    }

    return <Component {...props} />;
  };
};

export default AuthContext;