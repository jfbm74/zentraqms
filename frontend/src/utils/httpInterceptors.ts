/**
 * HTTP Interceptors for ZentraQMS
 *
 * Axios interceptors with comprehensive error handling,
 * retry logic, and logging integration.
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import {
  ErrorHandler,
  ErrorClassifier,
  RetryHandler,
  Logger,
  NotificationHandler,
  ErrorType,
} from "./errorHandler";
import { AuthStorage } from "./storage";

interface RequestMetadata {
  startTime: number;
  url: string;
  method: string;
  retryCount: number;
}

/**
 * Setup comprehensive HTTP interceptors
 */
export function setupHttpInterceptors(axiosInstance: AxiosInstance) {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      // Add request metadata
      const metadata: RequestMetadata = {
        startTime: Date.now(),
        url: config.url || "",
        method: config.method?.toUpperCase() || "GET",
        retryCount: (config as any).__retryCount || 0,
      };

      // Store metadata in config
      (config as any).__metadata = metadata;

      // Add authentication token
      const authData = AuthStorage.getAuthData();
      if (authData.tokens?.access) {
        config.headers.Authorization = `Bearer ${authData.tokens.access}`;
      }

      // Add request ID for tracking (internal only, not sent to server to avoid CORS issues)
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // config.headers['X-Request-ID'] = requestId; // Disabled to avoid CORS issues
      (config as any).__requestId = requestId;

      // Log outgoing request
      Logger.log("info", `[HTTP Request] ${metadata.method} ${metadata.url}`, {
        data: config.data,
        headers: config.headers,
        timestamp: new Date().toISOString(),
        requestId,
      });

      return config;
    },
    (error) => {
      Logger.log("error", "[HTTP Request Error]", error);
      return Promise.reject(error);
    },
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      // Calculate request duration
      const metadata = (response.config as any).__metadata as RequestMetadata;
      const duration = Date.now() - metadata.startTime;
      const requestId = (response.config as any).__requestId;

      // Log successful response
      Logger.log("info", `[HTTP Response] ${metadata.method} ${metadata.url}`, {
        status: response.status,
        data: response.data,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        requestId,
      });

      return response;
    },
    async (error: AxiosError) => {
      const config = error.config as any;
      const metadata = config?.__metadata as RequestMetadata;
      const requestId = config?.__requestId;
      const retryCount = config?.__retryCount || 0;

      // Calculate request duration
      const duration = metadata ? Date.now() - metadata.startTime : 0;

      // Classify the error
      const errorInfo = ErrorClassifier.classifyError(error);

      // Log the error
      Logger.log(
        "error",
        `[HTTP Response Error] ${metadata?.method || "UNKNOWN"} ${metadata?.url || "UNKNOWN"}`,
        {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
          requestId,
          retryCount,
          errorType: errorInfo.type,
          severity: errorInfo.severity,
        },
      );

      // Handle specific error types
      await handleSpecificErrors(error, errorInfo);

      // Attempt retry if applicable
      if (shouldRetryRequest(errorInfo, retryCount)) {
        return retryRequest(axiosInstance, config, retryCount);
      }

      // Handle authentication errors
      if (errorInfo.type === ErrorType.AUTHENTICATION) {
        handleAuthenticationError(error);
      }

      // Show user notification (unless it's a background request)
      if (!config.skipErrorNotification) {
        NotificationHandler.handleError(errorInfo, {
          showToast: !config.silent,
          throttle: true,
        });
      }

      return Promise.reject(error);
    },
  );
}

/**
 * Handle specific error types
 */
async function handleSpecificErrors(
  error: AxiosError,
  errorInfo: unknown,
): Promise<void> {
  switch (errorInfo.type) {
    case ErrorType.AUTHENTICATION:
      // Try to refresh token
      try {
        const authData = AuthStorage.getAuthData();
        if (authData.tokens?.refresh) {
          // Attempt token refresh (would need to implement refresh logic)
          console.log("[HTTP Interceptor] Attempting token refresh...");
          // This would trigger the auth service to refresh tokens
          window.dispatchEvent(new CustomEvent("auth:token-refresh-needed"));
        }
      } catch (refreshError) {
        console.error("[HTTP Interceptor] Token refresh failed:", refreshError);
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
      break;

    case ErrorType.NETWORK:
      // Dispatch network status event
      window.dispatchEvent(
        new CustomEvent("network:error", {
          detail: { error: errorInfo },
        }),
      );
      break;

    case ErrorType.SERVER:
      // Could implement server status monitoring
      console.warn("[HTTP Interceptor] Server error detected:", errorInfo);
      break;
  }
}

/**
 * Check if request should be retried
 */
function shouldRetryRequest(errorInfo: unknown, retryCount: number): boolean {
  const maxRetries = 3;

  if (retryCount >= maxRetries) {
    return false;
  }

  // Only retry certain types of errors
  const retryableTypes = [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.SERVER,
  ];
  if (!retryableTypes.includes(errorInfo.type)) {
    return false;
  }

  // Only retry certain status codes
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504, 522, 524];
  if (
    errorInfo.statusCode &&
    !retryableStatusCodes.includes(errorInfo.statusCode)
  ) {
    return false;
  }

  return true;
}

/**
 * Retry a failed request
 */
async function retryRequest(
  axiosInstance: AxiosInstance,
  config: AxiosRequestConfig,
  retryCount: number,
): Promise<AxiosResponse> {
  const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

  Logger.log(
    "warn",
    `[HTTP Retry] Retrying request after ${delay}ms (attempt ${retryCount + 1})`,
    {
      url: config.url,
      method: config.method,
      retryCount: retryCount + 1,
    },
  );

  // Wait before retrying
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Increment retry count
  (config as any).__retryCount = retryCount + 1;

  // Retry the request
  return axiosInstance(config);
}

/**
 * Handle authentication errors
 */
function handleAuthenticationError(error: AxiosError): void {
  // Check if this is a token expiration
  const response = error.response;
  if (response?.status === 401) {
    // Clear stored auth data
    AuthStorage.clearAuth();

    // Dispatch logout event
    window.dispatchEvent(
      new CustomEvent("auth:logout", {
        detail: { reason: "token_expired" },
      }),
    );
  }
}

/**
 * Create a specialized axios instance with error handling
 */
export function createAxiosInstance(
  baseURL: string,
  options: {
    timeout?: number;
    retries?: number;
    enableLogging?: boolean;
    skipAuth?: boolean;
  } = {},
): AxiosInstance {
  const {
    timeout = 30000, // 30 seconds
    enableLogging = true,
    skipAuth = false,
  } = options;

  const instance = axios.create({
    baseURL,
    timeout,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // Setup interceptors
  setupHttpInterceptors(instance);

  // Add custom config options
  instance.defaults.skipAuth = skipAuth;
  instance.defaults.enableLogging = enableLogging;

  return instance;
}

/**
 * Utility functions for making requests with enhanced error handling
 */
export const httpClient = {
  /**
   * Make a GET request with enhanced error handling
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig & {
      silent?: boolean;
      skipErrorNotification?: boolean;
    },
  ): Promise<T> {
    try {
      const response = await axios.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Make a POST request with enhanced error handling
   */
  async post<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & {
      silent?: boolean;
      skipErrorNotification?: boolean;
    },
  ): Promise<T> {
    try {
      const response = await axios.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Make a PUT request with enhanced error handling
   */
  async put<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig & {
      silent?: boolean;
      skipErrorNotification?: boolean;
    },
  ): Promise<T> {
    try {
      const response = await axios.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Make a DELETE request with enhanced error handling
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig & {
      silent?: boolean;
      skipErrorNotification?: boolean;
    },
  ): Promise<T> {
    try {
      const response = await axios.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Make a request with automatic retry
   */
  async withRetry<T = any>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    return RetryHandler.executeWithRetry(operation, {
      type: ErrorType.UNKNOWN,
      severity: "MEDIUM" as any,
      message: "Operation failed",
      userMessage: "Operación fallida",
      timestamp: new Date(),
      retryable: true,
    });
  },
};

/**
 * Initialize HTTP interceptors for the default axios instance
 */
export function initializeHttpInterceptors(): void {
  setupHttpInterceptors(axios);

  // Initialize error handler
  ErrorHandler.init();

  Logger.log("info", "[HTTP Interceptors] Initialized successfully");
}

// Export types
export type HttpClientConfig = AxiosRequestConfig & {
  silent?: boolean;
  skipErrorNotification?: boolean;
};
