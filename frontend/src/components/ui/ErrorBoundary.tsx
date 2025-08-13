/**
 * Error Boundary Component for ZentraQMS Frontend
 * 
 * React Error Boundary for catching JavaScript errors anywhere in the child component tree.
 * Provides a fallback UI with Velzon styling when errors occur.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Here you could also log the error to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    // Reload the entire page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI with Velzon styling
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="card">
                  <div className="card-body p-4 text-center">
                    <div className="mb-4">
                      <i className="ri-error-warning-line display-4 text-danger"></i>
                    </div>
                    
                    <h4 className="text-danger mb-3">
                      ¡Ups! Algo salió mal
                    </h4>
                    
                    <p className="text-muted mb-4">
                      Se ha producido un error inesperado en la aplicación. 
                      Nuestro equipo ha sido notificado y está trabajando para solucionarlo.
                    </p>

                    {/* Error details for development */}
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                      <div className="text-start mb-4">
                        <div className="alert alert-danger">
                          <h6 className="alert-heading">Detalles del Error (Desarrollo):</h6>
                          <hr />
                          <p className="mb-2">
                            <strong>Error:</strong> {this.state.error.toString()}
                          </p>
                          {this.state.errorInfo && (
                            <details className="mt-2">
                              <summary className="mb-2">Stack Trace</summary>
                              <pre className="small">
                                {this.state.errorInfo.componentStack}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="d-flex gap-2 justify-content-center">
                      <button 
                        type="button"
                        className="btn btn-success"
                        onClick={this.handleRetry}
                      >
                        <i className="ri-refresh-line me-1"></i>
                        Intentar de Nuevo
                      </button>
                      
                      <button 
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={this.handleReload}
                      >
                        <i className="ri-reload-line me-1"></i>
                        Recargar Página
                      </button>
                    </div>

                    <div className="mt-4">
                      <p className="text-muted small">
                        Si el problema persiste, contacte a soporte técnico.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;