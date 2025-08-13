/**
 * Authentication Service for ZentraQMS Frontend
 * 
 * This service handles all authentication-related API calls and token management.
 * It provides methods for login, logout, token refresh, and user data retrieval.
 */

import type { AxiosResponse } from 'axios';
import axiosInstance from '../api/axios.config';
import { AUTH_ENDPOINTS } from '../api/endpoints';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  CurrentUserResponse,
  VerifyTokenRequest,
  TokenPair,
  AuthError,
  AuthErrorType,
  TokenPayload,
} from '../types/auth.types';
import { User } from '../types/user.types';

/**
 * Authentication service class containing all auth-related methods
 */
class AuthService {
  /**
   * Login user with email and password
   * 
   * @param credentials - User login credentials
   * @returns Promise with login response data
   * @throws AuthError on login failure
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<LoginResponse> = await axiosInstance.post(
        AUTH_ENDPOINTS.LOGIN,
        credentials
      );

      if (response.data.success) {
        // Store tokens and user data
        this.storeAuthData(response.data.data);
        return response.data;
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('[AuthService] Login error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout user and invalidate tokens
   * 
   * @returns Promise that resolves when logout is complete
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (refreshToken) {
        const logoutData: LogoutRequest = {
          refresh_token: refreshToken,
        };

        // Attempt to logout on server (invalidate refresh token)
        try {
          await axiosInstance.post(AUTH_ENDPOINTS.LOGOUT, logoutData);
        } catch (error) {
          // Log error but don't throw - we still want to clear local data
          console.warn('[AuthService] Server logout failed:', error);
        }
      }

      // Clear all stored auth data
      this.clearAuthData();
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
      // Always clear local data even if server call fails
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * 
   * @returns Promise with new token data
   * @throws AuthError if refresh fails
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshData: RefreshTokenRequest = {
        refresh: refreshToken,
      };

      const response: AxiosResponse<RefreshTokenResponse> = await axiosInstance.post(
        AUTH_ENDPOINTS.REFRESH,
        refreshData
      );

      if (response.data.success) {
        // Update stored tokens
        this.updateTokens(response.data.data);
        return response.data;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error: any) {
      console.error('[AuthService] Token refresh error:', error);
      
      // If refresh fails, clear auth data and logout
      this.clearAuthData();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current user information
   * 
   * @returns Promise with current user data
   * @throws AuthError if request fails
   */
  async getCurrentUser(): Promise<CurrentUserResponse> {
    try {
      const response: AxiosResponse<CurrentUserResponse> = await axiosInstance.get(
        AUTH_ENDPOINTS.CURRENT_USER
      );

      if (response.data.success) {
        // Update stored user data
        this.storeUserData(response.data.data);
        return response.data;
      } else {
        throw new Error('Failed to get current user');
      }
    } catch (error: any) {
      console.error('[AuthService] Get current user error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Verify if a token is valid
   * 
   * @param token - Token to verify (defaults to stored access token)
   * @returns Promise that resolves if token is valid
   */
  async verifyToken(token?: string): Promise<boolean> {
    try {
      const tokenToVerify = token || this.getAccessToken();
      
      if (!tokenToVerify) {
        return false;
      }

      const verifyData: VerifyTokenRequest = {
        token: tokenToVerify,
      };

      const response = await axiosInstance.post(AUTH_ENDPOINTS.VERIFY_TOKEN, verifyData);
      return response.status === 200;
    } catch (error) {
      console.warn('[AuthService] Token verification failed:', error);
      return false;
    }
  }

  /**
   * Check if user is currently authenticated
   * 
   * @returns boolean indicating authentication status
   */
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const user = this.getStoredUser();
    
    if (!accessToken || !user) {
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired(accessToken)) {
      return false;
    }

    return true;
  }

  /**
   * Get stored access token
   * 
   * @returns Access token string or null
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get stored refresh token
   * 
   * @returns Refresh token string or null
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Get stored user data
   * 
   * @returns User object or null
   */
  getStoredUser(): User | null {
    const userData = localStorage.getItem('user_data');
    if (!userData) return null;

    try {
      return JSON.parse(userData) as User;
    } catch (error) {
      console.error('[AuthService] Failed to parse stored user data:', error);
      return null;
    }
  }

  /**
   * Check if a token is expired
   * 
   * @param token - JWT token to check
   * @returns boolean indicating if token is expired
   */
  isTokenExpired(token?: string): boolean {
    try {
      const tokenToCheck = token || this.getAccessToken();
      
      if (!tokenToCheck) {
        return true;
      }

      const payload = this.decodeToken(tokenToCheck);
      if (!payload || !payload.exp) {
        return true;
      }

      // Check if token expires in the next 60 seconds (buffer)
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const bufferTime = 60 * 1000; // 60 seconds buffer
      const currentTime = Date.now();

      return (expirationTime - bufferTime) <= currentTime;
    } catch (error) {
      console.error('[AuthService] Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Decode JWT token payload (without verification)
   * 
   * @param token - JWT token to decode
   * @returns Decoded token payload or null
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload) as TokenPayload;
    } catch (error) {
      console.error('[AuthService] Error decoding token:', error);
      return null;
    }
  }

  /**
   * Store authentication data in localStorage
   * 
   * @param authData - Authentication data from login response
   */
  private storeAuthData(authData: LoginResponse['data']): void {
    try {
      localStorage.setItem('access_token', authData.access);
      localStorage.setItem('refresh_token', authData.refresh);
      localStorage.setItem('user_data', JSON.stringify(authData.user));
    } catch (error) {
      console.error('[AuthService] Error storing auth data:', error);
    }
  }

  /**
   * Update tokens in localStorage
   * 
   * @param tokenData - New token data
   */
  private updateTokens(tokenData: RefreshTokenResponse['data']): void {
    try {
      localStorage.setItem('access_token', tokenData.access);
      
      // Update refresh token if provided (token rotation)
      if (tokenData.refresh) {
        localStorage.setItem('refresh_token', tokenData.refresh);
      }
    } catch (error) {
      console.error('[AuthService] Error updating tokens:', error);
    }
  }

  /**
   * Store user data in localStorage
   * 
   * @param user - User data to store
   */
  private storeUserData(user: User): void {
    try {
      localStorage.setItem('user_data', JSON.stringify(user));
    } catch (error) {
      console.error('[AuthService] Error storing user data:', error);
    }
  }

  /**
   * Clear all authentication data from localStorage
   */
  private clearAuthData(): void {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
    } catch (error) {
      console.error('[AuthService] Error clearing auth data:', error);
    }
  }

  /**
   * Handle authentication errors and convert to AuthError
   * 
   * @param error - Raw error from API call
   * @returns Formatted AuthError
   */
  private handleAuthError(error: any): AuthError {
    // Default error
    let authError: AuthError = {
      type: AuthErrorType.UNKNOWN_ERROR,
      message: 'Ha ocurrido un error desconocido. Intente nuevamente.',
    };

    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Handle backend error response format
      if (errorData.error) {
        authError.message = errorData.error.message || authError.message;
        authError.code = errorData.error.code;
        authError.details = errorData.error.details;

        // Map backend error codes to AuthErrorType
        switch (errorData.error.code) {
          case 'INVALID_CREDENTIALS':
            authError.type = AuthErrorType.INVALID_CREDENTIALS;
            break;
          case 'ACCOUNT_LOCKED':
            authError.type = AuthErrorType.ACCOUNT_LOCKED;
            break;
          case 'ACCOUNT_INACTIVE':
            authError.type = AuthErrorType.ACCOUNT_INACTIVE;
            break;
          case 'TOKEN_EXPIRED':
            authError.type = AuthErrorType.TOKEN_EXPIRED;
            break;
          case 'TOKEN_INVALID':
            authError.type = AuthErrorType.TOKEN_INVALID;
            break;
          case 'RATE_LIMITED':
            authError.type = AuthErrorType.RATE_LIMITED;
            break;
          default:
            authError.type = AuthErrorType.UNKNOWN_ERROR;
        }
      }
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      authError.type = AuthErrorType.NETWORK_ERROR;
      authError.message = 'Error de conexión. Verifique su conexión a internet.';
    } else if (error.response?.status === 429) {
      authError.type = AuthErrorType.RATE_LIMITED;
      authError.message = 'Demasiadas peticiones. Intente más tarde.';
    }

    return authError;
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export class for testing
export default AuthService;