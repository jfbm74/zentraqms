/**
 * Error Boundary Component for ZentraQMS
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  Logger,
  ErrorHandler,
  ErrorType,
  ErrorSeverity,
} from "../../utils/errorHandler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Log to our error handler
    Logger.log(
      "error",
      `React Error Boundary caught error: ${error.message}`,
      errorData,
    );

    // Create structured error info
    const structuredError = {
      type: ErrorType.CLIENT,
      severity: ErrorSeverity.HIGH,
      message: error.message,
      userMessage: "Ha ocurrido un error en la aplicación",
      timestamp: new Date(),
      retryable: true,
      details: errorData,
    };

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Report to error tracking service (if implemented)
    this.reportError(structuredError);
  }

  private reportError(errorInfo: unknown) {
    // Here you would send the error to your error tracking service
    // like Sentry, LogRocket, Bugsnag, etc.

    // For now, we'll just store it in our local logger
    Logger.log("error", "Error Boundary Report", errorInfo);
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private copyErrorToClipboard = async () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      alert("Información del error copiada al portapapeles");
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="container-fluid">
            <div className="row justify-content-center">
              <div className="col-lg-6 col-md-8">
                <div className="card mt-5">
                  <div className="card-body text-center p-5">
                    {/* Error Icon */}
                    <div className="avatar-lg mx-auto mb-4">
                      <div className="avatar-title bg-danger bg-soft text-danger rounded-circle">
                        <i className="ri-error-warning-line display-4"></i>
                      </div>
                    </div>

                    {/* Error Title */}
                    <h4 className="text-danger mb-3">¡Oops! Algo salió mal</h4>

                    {/* Error Description */}
                    <p className="text-muted mb-4">
                      Ha ocurrido un error inesperado en la aplicación. Nuestro
                      equipo ha sido notificado y estamos trabajando para
                      solucionarlo.
                    </p>

                    {/* Error ID */}
                    {this.state.errorId && (
                      <div className="alert alert-info">
                        <small>
                          <strong>ID del Error:</strong> {this.state.errorId}
                        </small>
                      </div>
                    )}

                    {/* Error Details (Development only) */}
                    {this.props.showDetails &&
                      import.meta.env.MODE === "development" && (
                        <div className="alert alert-warning text-start">
                          <h6 className="alert-heading">
                            Detalles del Error (Desarrollo)
                          </h6>
                          <strong>Mensaje:</strong> {this.state.error?.message}
                          <br />
                          {this.state.error?.stack && (
                            <>
                              <strong>Stack Trace:</strong>
                              <pre
                                className="mt-2 small"
                                style={{
                                  fontSize: "0.75rem",
                                  maxHeight: "200px",
                                  overflow: "auto",
                                }}
                              >
                                {this.state.error.stack}
                              </pre>
                            </>
                          )}
                        </div>
                      )}

                    {/* Action Buttons */}
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={this.handleRetry}
                      >
                        <i className="ri-refresh-line me-2"></i>
                        Intentar Nuevamente
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={this.handleReload}
                      >
                        <i className="ri-restart-line me-2"></i>
                        Recargar Página
                      </button>

                      {import.meta.env.MODE === "development" && (
                        <button
                          type="button"
                          className="btn btn-outline-info"
                          onClick={this.copyErrorToClipboard}
                        >
                          <i className="ri-file-copy-line me-2"></i>
                          Copiar Error
                        </button>
                      )}
                    </div>

                    {/* Support Info */}
                    <div className="mt-4 pt-3 border-top">
                      <p className="text-muted small mb-2">
                        Si el problema persiste, contacta a soporte técnico:
                      </p>
                      <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <a
                          href="mailto:soporte@zentraqms.com"
                          className="text-decoration-none"
                        >
                          <i className="ri-mail-line me-1"></i>
                          soporte@zentraqms.com
                        </a>
                        <a
                          href="tel:+573001234567"
                          className="text-decoration-none"
                        >
                          <i className="ri-phone-line me-1"></i>
                          +57 300 123 4567
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
// eslint-disable-next-line react-refresh/only-export-components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Simple error fallback component
 */
export const SimpleErrorFallback: React.FC<{
  error?: Error;
  resetError?: () => void;
  message?: string;
}> = ({ error, resetError, message = "Ha ocurrido un error" }) => (
  <div className="alert alert-danger d-flex align-items-center" role="alert">
    <i className="ri-error-warning-line me-2"></i>
    <div className="flex-grow-1">
      <strong>{message}</strong>
      {error && import.meta.env.MODE === "development" && (
        <div className="small mt-1 text-muted">{error.message}</div>
      )}
    </div>
    {resetError && (
      <button
        type="button"
        className="btn btn-sm btn-outline-danger ms-2"
        onClick={resetError}
      >
        <i className="ri-refresh-line"></i>
      </button>
    )}
  </div>
);

/**
 * Error boundary hook for functional components
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
    ErrorHandler.handleError(error, "useErrorHandler");
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError, error };
}

export default ErrorBoundary;
