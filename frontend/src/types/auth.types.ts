/**
 * Authentication Types for ZentraQMS Frontend
 *
 * This module defines all TypeScript types and interfaces related to
 * authentication, including request/response types, token handling, and auth state.
 */

import { User } from "./user.types";

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Token pair returned by authentication endpoints
 */
export interface TokenPair {
  access: string;
  refresh: string;
}

/**
 * Login response from backend
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access: string;
    refresh: string;
    user: User;
  };
}

/**
 * Token refresh request payload
 */
export interface RefreshTokenRequest {
  refresh: string;
}

/**
 * Token refresh response from backend
 */
export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    access: string;
    refresh?: string; // Optional if rotation is enabled
  };
}

/**
 * Logout request payload
 */
export interface LogoutRequest {
  refresh_token: string;
}

/**
 * Current user response from backend
 */
export interface CurrentUserResponse {
  success: boolean;
  message: string;
  data: User;
}

/**
 * Token verification request
 */
export interface VerifyTokenRequest {
  token: string;
}

/**
 * Generic API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: TokenPair | null;
  error: string | null;

  // RBAC state (Phase 5)
  permissions: string[];
  roles: string[];
  permissionsByResource: Record<string, string[]>;
  rbacLoading: boolean;
  rbacError: string | null;
  rbacLastUpdated: Date | null;
}

/**
 * Authentication context interface
 */
export interface AuthContextType extends AuthState {
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;

  // RBAC methods (Phase 5)
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  getResourcePermissions: (resource: string) => string[];
  refreshPermissions: () => Promise<void>;
  clearRbacError: () => void;

  // Utility methods
  isTokenExpired: (token?: string) => boolean;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
}

/**
 * Login form validation schema
 */
export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean; // For future "Remember Me" functionality
}

/**
 * Authentication event types for custom events
 */
export enum AuthEventType {
  LOGIN_SUCCESS = "auth:login_success",
  LOGIN_FAILED = "auth:login_failed",
  LOGOUT = "auth:logout",
  TOKEN_REFRESHED = "auth:token_refreshed",
  TOKEN_EXPIRED = "auth:token_expired",
  SESSION_EXPIRED = "auth:session_expired",
}

/**
 * Authentication errors enum
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  RATE_LIMITED = "RATE_LIMITED",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Authentication error interface
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Token payload interface (for JWT decoding)
 */
export interface TokenPayload {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  roles: string[];
  permissions: string[];
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  jti: string; // JWT ID
  token_type: "access" | "refresh";
}

/**
 * Storage keys for authentication data
 */
export enum StorageKeys {
  ACCESS_TOKEN = "access_token",
  REFRESH_TOKEN = "refresh_token",
  USER_DATA = "user_data",
  REMEMBER_ME = "remember_me",

  // RBAC storage keys (Phase 5)
  USER_PERMISSIONS = "user_permissions",
  USER_ROLES = "user_roles",
  PERMISSIONS_BY_RESOURCE = "permissions_by_resource",
  RBAC_CACHE_TIMESTAMP = "rbac_cache_timestamp",
}

/**
 * Authentication configuration interface
 */
export interface AuthConfig {
  tokenRefreshBuffer: number; // Minutes before expiration to refresh
  maxRetryAttempts: number;
  sessionTimeoutWarning: number; // Minutes before showing warning
  rememberMeEnabled: boolean;
}

/**
 * Default authentication configuration
 */
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  tokenRefreshBuffer: 5, // Refresh 5 minutes before expiration
  maxRetryAttempts: 3,
  sessionTimeoutWarning: 10, // Show warning 10 minutes before expiration
  rememberMeEnabled: true,
};

/**
 * Password strength levels (for future password change functionality)
 */
export enum PasswordStrength {
  VERY_WEAK = "very_weak",
  WEAK = "weak",
  MODERATE = "moderate",
  STRONG = "strong",
  VERY_STRONG = "very_strong",
}

/**
 * Password requirements interface
 */
export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbidCommonPatterns: boolean;
}

/**
 * Account status enum (for user management)
 */
export enum AccountStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  LOCKED = "locked",
  PENDING_VERIFICATION = "pending_verification",
  SUSPENDED = "suspended",
}

/**
 * Login attempt result interface
 */
export interface LoginAttemptResult {
  success: boolean;
  user?: User;
  tokens?: TokenPair;
  error?: AuthError;
  attemptsRemaining?: number;
  lockoutUntil?: Date;
}

/**
 * Session info interface
 */
export interface SessionInfo {
  isActive: boolean;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Type guards for authentication responses
 */
export const isLoginResponse = (
  response: unknown,
): response is LoginResponse => {
  return (
    response &&
    typeof response.success === "boolean" &&
    response.success &&
    response.data &&
    typeof response.data.access === "string" &&
    typeof response.data.refresh === "string" &&
    response.data.user
  );
};

export const isApiErrorResponse = (
  response: unknown,
): response is ApiErrorResponse => {
  return (
    response &&
    response.success === false &&
    response.error &&
    typeof response.error.message === "string"
  );
};

export const isTokenPair = (tokens: unknown): tokens is TokenPair => {
  return (
    tokens &&
    typeof tokens.access === "string" &&
    typeof tokens.refresh === "string"
  );
};
