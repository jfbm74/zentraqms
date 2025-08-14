/**
 * API Endpoints Configuration for ZentraQMS Frontend
 *
 * This module centralizes all API endpoint definitions and provides
 * a configured Axios instance with comprehensive error handling.
 */

import axios from "axios";
import { setupHttpInterceptors } from "../utils/httpInterceptors";

// Base API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_VERSION = "v1";

/**
 * Authentication endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: "/api/auth/login/",
  LOGOUT: "/api/auth/logout/",
  REFRESH: "/api/auth/refresh/",
  CURRENT_USER: "/api/auth/user/",
  VERIFY_TOKEN: "/api/auth/verify/",
  HEALTH: "/api/auth/health/",
  // RBAC endpoints (Phase 5)
  PERMISSIONS: "/api/auth/permissions/",
  ROLES: "/api/auth/roles/",
} as const;

/**
 * Future module endpoints (prepared for Phase 2)
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: AUTH_ENDPOINTS,

  // Future endpoints
  PROCESOS: {
    LIST: `/api/${API_VERSION}/procesos/`,
    DETAIL: (id: string) => `/api/${API_VERSION}/procesos/${id}/`,
    CREATE: `/api/${API_VERSION}/procesos/`,
    UPDATE: (id: string) => `/api/${API_VERSION}/procesos/${id}/`,
    DELETE: (id: string) => `/api/${API_VERSION}/procesos/${id}/`,
  },

  AUDITORIAS: {
    LIST: `/api/${API_VERSION}/auditorias/`,
    DETAIL: (id: string) => `/api/${API_VERSION}/auditorias/${id}/`,
    CREATE: `/api/${API_VERSION}/auditorias/`,
    UPDATE: (id: string) => `/api/${API_VERSION}/auditorias/${id}/`,
    DELETE: (id: string) => `/api/${API_VERSION}/auditorias/${id}/`,
  },

  NORMOGRAMA: {
    LIST: `/api/${API_VERSION}/normograma/`,
    DETAIL: (id: string) => `/api/${API_VERSION}/normograma/${id}/`,
    CREATE: `/api/${API_VERSION}/normograma/`,
    UPDATE: (id: string) => `/api/${API_VERSION}/normograma/${id}/`,
    DELETE: (id: string) => `/api/${API_VERSION}/normograma/${id}/`,
  },

  INDICADORES: {
    LIST: `/api/${API_VERSION}/indicadores/`,
    DETAIL: (id: string) => `/api/${API_VERSION}/indicadores/${id}/`,
    CREATE: `/api/${API_VERSION}/indicadores/`,
    UPDATE: (id: string) => `/api/${API_VERSION}/indicadores/${id}/`,
    DELETE: (id: string) => `/api/${API_VERSION}/indicadores/${id}/`,
  },

  // System endpoints
  HEALTH: "/health/",
} as const;

/**
 * Create Axios instance with enhanced error handling
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds (increased for better UX)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Setup comprehensive HTTP interceptors with error handling, retry logic, and logging
setupHttpInterceptors(apiClient);

/**
 * Helper function to create query string from params
 */
export const createQueryString = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((item: unknown) =>
          searchParams.append(key, String(item)),
        );
      } else {
        searchParams.set(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Helper function to build URLs with parameters
 */
export const buildUrl = (
  endpoint: string,
  params?: Record<string, unknown>,
): string => {
  const queryString = params ? createQueryString(params) : "";
  return `${endpoint}${queryString}`;
};

/**
 * HTTP methods enum for type safety
 */
export enum HTTP_METHODS {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

/**
 * Common HTTP status codes
 */
export enum HTTP_STATUS {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Export configured instance as default
 */
export default apiClient;
