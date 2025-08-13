/**
 * API Endpoints Configuration for ZentraQMS Frontend
 * 
 * This module centralizes all API endpoint definitions and provides
 * a configured Axios instance with interceptors for token handling.
 */

import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = 'v1';

/**
 * Authentication endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login/',
  LOGOUT: '/api/auth/logout/',
  REFRESH: '/api/auth/refresh/',
  CURRENT_USER: '/api/auth/user/',
  VERIFY_TOKEN: '/api/auth/verify/',
  HEALTH: '/api/auth/health/',
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
  HEALTH: '/health/',
} as const;

/**
 * Create Axios instance with base configuration
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request interceptor to add authentication token
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        headers: config.headers,
        timestamp: new Date().toISOString(),
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling and token refresh
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
        timestamp: new Date().toISOString(),
      });
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`[API Response Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Handle 401 (Unauthorized) errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH}`,
            { refresh: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          if (response.data.success) {
            const { access, refresh } = response.data.data;
            
            // Update tokens in localStorage
            localStorage.setItem('access_token', access);
            if (refresh) {
              localStorage.setItem('refresh_token', refresh);
            }
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('[Token Refresh Error]', refreshError);
        
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        
        // Redirect to login (will be handled by AuthContext)
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other specific error codes
    switch (error.response?.status) {
      case 403:
        console.warn('[API] Access forbidden - insufficient permissions');
        break;
      case 404:
        console.warn('[API] Resource not found');
        break;
      case 429:
        console.warn('[API] Rate limit exceeded');
        break;
      case 500:
        console.error('[API] Internal server error');
        break;
      default:
        console.error('[API] Unexpected error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Helper function to create query string from params
 */
export const createQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item: any) => searchParams.append(key, String(item)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Helper function to build URLs with parameters
 */
export const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  const queryString = params ? createQueryString(params) : '';
  return `${endpoint}${queryString}`;
};

/**
 * HTTP methods enum for type safety
 */
export enum HTTP_METHODS {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
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