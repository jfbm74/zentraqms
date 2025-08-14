/**
 * Error Handler Utilities for ZentraQMS Frontend
 *
 * Comprehensive error handling system with:
 * - HTTP error interceptors
 * - User-friendly error messages
 * - Automatic retry logic
 * - Centralized logging
 */

import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "react-toastify";

// Error types
export enum ErrorType {
  NETWORK = "NETWORK",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  VALIDATION = "VALIDATION",
  SERVER = "SERVER",
  CLIENT = "CLIENT",
  TIMEOUT = "TIMEOUT",
  UNKNOWN = "UNKNOWN",
}

export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string | number;
  details?: any;
  timestamp: Date;
  url?: string;
  method?: string;
  statusCode?: number;
  retryable: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryDelayMultiplier: number;
  retryableStatusCodes: number[];
  retryableErrorTypes: ErrorType[];
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryDelayMultiplier: 2, // Exponential backoff
  retryableStatusCodes: [408, 429, 500, 502, 503, 504, 522, 524],
  retryableErrorTypes: [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SERVER],
};

/**
 * Logger utility for debugging
 */
export class Logger {
  private static isDevelopment = import.meta.env.MODE === "development";
  private static errorLogs: ErrorInfo[] = [];

  static log(level: "info" | "warn" | "error", message: string, data?: any) {
    const timestamp = new Date();
    const logEntry = {
      level,
      message,
      data,
      timestamp,
      url: window.location.href,
    };

    if (this.isDevelopment) {
      console[level](`[${timestamp.toISOString()}] ${message}`, data);
    }

    // Store error logs for debugging
    if (level === "error") {
      this.errorLogs.push({
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        message,
        userMessage: message,
        details: data,
        timestamp,
        url: window.location.href,
        retryable: false,
      });

      // Keep only last 100 error logs
      if (this.errorLogs.length > 100) {
        this.errorLogs = this.errorLogs.slice(-100);
      }
    }
  }

  static getErrorLogs(): ErrorInfo[] {
    return this.errorLogs;
  }

  static clearLogs() {
    this.errorLogs = [];
  }

  static exportLogs(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }
}

/**
 * Error classifier to determine error type and severity
 */
export class ErrorClassifier {
  static classifyError(error: AxiosError): ErrorInfo {
    const timestamp = new Date();
    const statusCode = error.response?.status;
    const config = error.config;

    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let userMessage = "Ha ocurrido un error inesperado";
    let retryable = false;

    // Network errors
    if (!error.response) {
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        type = ErrorType.TIMEOUT;
        severity = ErrorSeverity.MEDIUM;
        userMessage =
          "La operación tardó demasiado tiempo. Intenta nuevamente.";
        retryable = true;
      } else {
        type = ErrorType.NETWORK;
        severity = ErrorSeverity.HIGH;
        userMessage = "Error de conexión. Verifica tu conexión a internet.";
        retryable = true;
      }
    } else {
      // HTTP status code errors
      switch (statusCode) {
        case 400:
          type = ErrorType.VALIDATION;
          severity = ErrorSeverity.LOW;
          userMessage =
            "Los datos enviados no son válidos. Revisa la información.";
          break;

        case 401:
          type = ErrorType.AUTHENTICATION;
          severity = ErrorSeverity.HIGH;
          userMessage = "Tu sesión ha expirado. Inicia sesión nuevamente.";
          break;

        case 403:
          type = ErrorType.AUTHORIZATION;
          severity = ErrorSeverity.MEDIUM;
          userMessage = "No tienes permisos para realizar esta acción.";
          break;

        case 404:
          type = ErrorType.CLIENT;
          severity = ErrorSeverity.LOW;
          userMessage = "El recurso solicitado no fue encontrado.";
          break;

        case 408:
          type = ErrorType.TIMEOUT;
          severity = ErrorSeverity.MEDIUM;
          userMessage =
            "La solicitud tardó demasiado tiempo. Intenta nuevamente.";
          retryable = true;
          break;

        case 409:
          type = ErrorType.VALIDATION;
          severity = ErrorSeverity.LOW;
          userMessage = "Conflicto con los datos existentes.";
          break;

        case 422:
          type = ErrorType.VALIDATION;
          severity = ErrorSeverity.LOW;
          userMessage = "Los datos no pudieron ser procesados.";
          break;

        case 429:
          type = ErrorType.CLIENT;
          severity = ErrorSeverity.MEDIUM;
          userMessage =
            "Demasiadas solicitudes. Espera un momento antes de intentar nuevamente.";
          retryable = true;
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          type = ErrorType.SERVER;
          severity = ErrorSeverity.HIGH;
          userMessage =
            "Error interno del servidor. Intenta nuevamente en unos momentos.";
          retryable = true;
          break;

        default:
          if (statusCode && statusCode >= 500) {
            type = ErrorType.SERVER;
            severity = ErrorSeverity.HIGH;
            userMessage = "Error del servidor. Intenta nuevamente más tarde.";
            retryable = true;
          } else if (statusCode && statusCode >= 400) {
            type = ErrorType.CLIENT;
            severity = ErrorSeverity.MEDIUM;
            userMessage = "Error en la solicitud. Revisa los datos enviados.";
          }
      }
    }

    // Try to get a more specific message from server response
    const serverMessage = this.extractServerMessage(error);
    if (serverMessage && type === ErrorType.VALIDATION) {
      userMessage = serverMessage;
    }

    return {
      type,
      severity,
      message: error.message,
      userMessage,
      code: error.code,
      details: {
        response: error.response?.data,
        config: {
          url: config?.url,
          method: config?.method,
          data: config?.data,
        },
      },
      timestamp,
      url: config?.url,
      method: config?.method?.toUpperCase(),
      statusCode,
      retryable:
        retryable &&
        DEFAULT_RETRY_CONFIG.retryableStatusCodes.includes(statusCode || 0),
    };
  }

  private static extractServerMessage(error: AxiosError): string | null {
    const data = error.response?.data as any;

    if (typeof data === "string") {
      return data;
    }

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      if (typeof data.error === "string") {
        return data.error;
      }
      if (data.error.message) {
        return data.error.message;
      }
    }

    if (data?.errors) {
      if (typeof data.errors === "string") {
        return data.errors;
      }

      // Handle validation errors object
      if (typeof data.errors === "object") {
        const errorMessages = Object.entries(data.errors)
          .map(([field, messages]) => {
            const messageList = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${messageList.join(", ")}`;
          })
          .join("; ");
        return errorMessages;
      }
    }

    return null;
  }
}

/**
 * Retry mechanism for failed requests
 */
export class RetryHandler {
  private static retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;

  static setConfig(config: Partial<RetryConfig>) {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorInfo: ErrorInfo,
    retryCount = 0,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const isAxiosError = this.isAxiosError(error);
      const currentErrorInfo = isAxiosError
        ? ErrorClassifier.classifyError(error)
        : errorInfo;

      if (this.shouldRetry(currentErrorInfo, retryCount)) {
        const delay = this.calculateDelay(retryCount);

        Logger.log(
          "warn",
          `Retrying request after ${delay}ms (attempt ${retryCount + 1}/${this.retryConfig.maxRetries})`,
          {
            url: currentErrorInfo.url,
            method: currentErrorInfo.method,
            error: currentErrorInfo.message,
          },
        );

        await this.sleep(delay);
        return this.executeWithRetry(
          operation,
          currentErrorInfo,
          retryCount + 1,
        );
      }

      throw error;
    }
  }

  private static shouldRetry(
    errorInfo: ErrorInfo,
    retryCount: number,
  ): boolean {
    if (retryCount >= this.retryConfig.maxRetries) {
      return false;
    }

    if (!errorInfo.retryable) {
      return false;
    }

    if (
      errorInfo.statusCode &&
      !this.retryConfig.retryableStatusCodes.includes(errorInfo.statusCode)
    ) {
      return false;
    }

    if (!this.retryConfig.retryableErrorTypes.includes(errorInfo.type)) {
      return false;
    }

    return true;
  }

  private static calculateDelay(retryCount: number): number {
    return (
      this.retryConfig.retryDelay *
      Math.pow(this.retryConfig.retryDelayMultiplier, retryCount)
    );
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private static isAxiosError(error: any): error is AxiosError {
    return error && error.isAxiosError === true;
  }
}

/**
 * User notification handler
 */
export class NotificationHandler {
  private static showToast = true;
  private static lastErrorTime = new Map<string, number>();
  private static errorThrottleMs = 5000; // 5 seconds

  static setToastEnabled(enabled: boolean) {
    this.showToast = enabled;
  }

  static handleError(
    errorInfo: ErrorInfo,
    options: {
      showToast?: boolean;
      throttle?: boolean;
    } = {},
  ) {
    const { showToast = this.showToast, throttle = true } = options;

    // Log the error
    Logger.log("error", errorInfo.message, errorInfo);

    // Throttle duplicate errors
    if (throttle && this.isDuplicateError(errorInfo)) {
      return;
    }

    // Show toast notification
    if (showToast) {
      this.showErrorToast(errorInfo);
    }

    // Handle specific error types
    this.handleSpecificErrors(errorInfo);
  }

  private static isDuplicateError(errorInfo: ErrorInfo): boolean {
    const errorKey = `${errorInfo.type}-${errorInfo.statusCode}-${errorInfo.url}`;
    const now = Date.now();
    const lastTime = this.lastErrorTime.get(errorKey) || 0;

    if (now - lastTime < this.errorThrottleMs) {
      return true;
    }

    this.lastErrorTime.set(errorKey, now);
    return false;
  }

  private static showErrorToast(errorInfo: ErrorInfo) {
    const toastOptions = {
      autoClose: this.getAutoCloseTime(errorInfo.severity),
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (errorInfo.severity) {
      case ErrorSeverity.LOW:
        toast.info(errorInfo.userMessage, toastOptions);
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(errorInfo.userMessage, toastOptions);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        toast.error(errorInfo.userMessage, toastOptions);
        break;
    }
  }

  private static getAutoCloseTime(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 3000;
      case ErrorSeverity.MEDIUM:
        return 5000;
      case ErrorSeverity.HIGH:
        return 8000;
      case ErrorSeverity.CRITICAL:
        return false as any; // Don't auto-close critical errors
      default:
        return 5000;
    }
  }

  private static handleSpecificErrors(errorInfo: ErrorInfo) {
    switch (errorInfo.type) {
      case ErrorType.AUTHENTICATION:
        // Trigger logout or redirect to login
        window.dispatchEvent(new CustomEvent("auth:logout"));
        break;

      case ErrorType.AUTHORIZATION:
        // Could redirect to access denied page
        // navigate('/access-denied');
        break;

      case ErrorType.NETWORK:
        // Could show offline indicator
        window.dispatchEvent(new CustomEvent("network:offline"));
        break;
    }
  }
}

/**
 * Main error handler class
 */
export class ErrorHandler {
  static init() {
    // Initialize global error handlers
    this.setupGlobalErrorHandlers();

    Logger.log("info", "Error handler initialized");
  }

  static handleError(error: any, context?: string): ErrorInfo {
    let errorInfo: ErrorInfo;

    if (this.isAxiosError(error)) {
      errorInfo = ErrorClassifier.classifyError(error);
    } else {
      errorInfo = {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        message: error.message || "Unknown error",
        userMessage: "Ha ocurrido un error inesperado",
        timestamp: new Date(),
        retryable: false,
        details: { context, error },
      };
    }

    NotificationHandler.handleError(errorInfo);
    return errorInfo;
  }

  static async handleWithRetry<T>(
    operation: () => Promise<T>,
    context?: string,
  ): Promise<T> {
    try {
      const result = await RetryHandler.executeWithRetry(operation, {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        message: "Operation failed",
        userMessage: "Operación fallida",
        timestamp: new Date(),
        retryable: true,
      });
      return result;
    } catch (error) {
      this.handleError(error, context);
      throw error;
    }
  }

  private static isAxiosError(error: any): error is AxiosError {
    return error && error.isAxiosError === true;
  }

  private static setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      Logger.log("error", "Unhandled promise rejection", event.reason);

      // Prevent the default browser behavior
      event.preventDefault();
    });

    // Handle global JavaScript errors
    window.addEventListener("error", (event) => {
      Logger.log("error", "Global JavaScript error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });
  }
}

// Export utility functions
export const logError = (message: string, data?: any) =>
  Logger.log("error", message, data);
export const logWarn = (message: string, data?: any) =>
  Logger.log("warn", message, data);
export const logInfo = (message: string, data?: any) =>
  Logger.log("info", message, data);

export const handleApiError = (error: any, context?: string) =>
  ErrorHandler.handleError(error, context);
export const executeWithRetry = <T>(
  operation: () => Promise<T>,
  context?: string,
) => ErrorHandler.handleWithRetry(operation, context);
