/**
 * Access Denied Page for ZentraQMS Frontend
 *
 * This page is displayed when users don't have sufficient permissions
 * to access a protected route or resource.
 */

import React from "react";
import { Link, useLocation, useNavigate } from "../../utils/SimpleRouter";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import { RBACService } from "../../services/rbac.service";

/**
 * Location state interface for access denied information
 */
interface AccessDeniedLocationState {
  from?: {
    pathname: string;
    search: string;
  };
  reason?: string;
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

/**
 * Access Denied Page Component
 */
const AccessDeniedPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, permissions, roles } = useAuth();
  const { getPrimaryRole, getUserCapabilities } = usePermissions();

  // Get state passed from ProtectedRoute
  const locationState = location.state as AccessDeniedLocationState | null;
  const fromPath = locationState?.from?.pathname || "/";
  const reason = locationState?.reason || "insufficient_permissions";
  const requiredPermissions = locationState?.requiredPermissions || [];
  const requiredRoles = locationState?.requiredRoles || [];

  const primaryRole = getPrimaryRole();
  const capabilities = getUserCapabilities();

  /**
   * Handle go back action
   */
  const handleGoBack = () => {
    // Try to go back in history, fallback to dashboard
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const defaultRoute = RBACService.getDefaultRouteForRole(primaryRole);
      navigate(defaultRoute);
    }
  };

  /**
   * Handle logout action
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Force redirect to login even if logout fails
      navigate("/login");
    }
  };

  /**
   * Get suggested actions based on user role
   */
  const getSuggestedActions = () => {
    const actions: Array<{ label: string; path: string; icon: string }> = [];

    if (capabilities.canViewReports) {
      actions.push({
        label: "Ver Reportes",
        path: "/reportes",
        icon: "ri-file-chart-line",
      });
    }

    if (capabilities.canManageProcesses) {
      actions.push({
        label: "Gestión de Procesos",
        path: "/procesos",
        icon: "ri-file-list-3-line",
      });
    }

    if (capabilities.canManageAudits) {
      actions.push({
        label: "Auditorías",
        path: "/auditorias",
        icon: "ri-search-eye-line",
      });
    }

    // Always add dashboard
    actions.push({
      label: "Dashboard",
      path: "/dashboard",
      icon: "ri-dashboard-line",
    });

    return actions;
  };

  const suggestedActions = getSuggestedActions();

  /**
   * Render required permissions list
   */
  const renderRequiredPermissions = () => {
    if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <h6 className="text-muted mb-3">Permisos Requeridos:</h6>

        {requiredRoles.length > 0 && (
          <div className="mb-3">
            <small className="text-muted d-block mb-2">Roles:</small>
            <div className="d-flex flex-wrap gap-2">
              {requiredRoles.map((role, index) => (
                <span
                  key={index}
                  className="badge bg-primary-subtle text-primary"
                >
                  <i className="ri-user-line me-1"></i>
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {requiredPermissions.length > 0 && (
          <div className="mb-3">
            <small className="text-muted d-block mb-2">Permisos:</small>
            <div className="d-flex flex-wrap gap-2">
              {requiredPermissions.map((permission, index) => (
                <span
                  key={index}
                  className="badge bg-warning-subtle text-warning"
                >
                  <i className="ri-shield-keyhole-line me-1"></i>
                  {permission}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render user current permissions summary
   */
  const renderCurrentPermissions = () => {
    return (
      <div className="mt-4">
        <h6 className="text-muted mb-3">Tus Permisos Actuales:</h6>

        <div className="row">
          <div className="col-md-6">
            <small className="text-muted d-block mb-2">Rol Principal:</small>
            <span className="badge bg-info-subtle text-info fs-6">
              <i className="ri-user-star-line me-1"></i>
              {primaryRole || "Sin rol asignado"}
            </span>
          </div>

          <div className="col-md-6">
            <small className="text-muted d-block mb-2">
              Total de Permisos:
            </small>
            <span className="badge bg-success-subtle text-success fs-6">
              <i className="ri-shield-check-line me-1"></i>
              {permissions.length} permisos
            </span>
          </div>
        </div>

        <div className="mt-3">
          <small className="text-muted d-block mb-2">Capacidades:</small>
          <div className="d-flex flex-wrap gap-2">
            {capabilities.canManageUsers && (
              <span className="badge bg-secondary-subtle text-secondary">
                <i className="ri-user-settings-line me-1"></i>
                Gestionar Usuarios
              </span>
            )}
            {capabilities.canManageProcesses && (
              <span className="badge bg-secondary-subtle text-secondary">
                <i className="ri-file-list-line me-1"></i>
                Gestionar Procesos
              </span>
            )}
            {capabilities.canManageAudits && (
              <span className="badge bg-secondary-subtle text-secondary">
                <i className="ri-search-line me-1"></i>
                Gestionar Auditorías
              </span>
            )}
            {capabilities.canViewReports && (
              <span className="badge bg-secondary-subtle text-secondary">
                <i className="ri-file-chart-line me-1"></i>
                Ver Reportes
              </span>
            )}
            {capabilities.canManageSystem && (
              <span className="badge bg-secondary-subtle text-secondary">
                <i className="ri-settings-line me-1"></i>
                Administrar Sistema
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="auth-page-wrapper pt-5">
      <div className="auth-one-bg-position auth-one-bg" id="auth-particles">
        <div className="bg-overlay"></div>

        <div className="shape">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            viewBox="0 0 1440 120"
          >
            <path d="M 0,36 C 144,53.6 432,123.2 720,124 C 1008,124.8 1296,56.8 1440,40L1440 140L0 140z"></path>
          </svg>
        </div>
      </div>

      <div className="auth-page-content">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="text-center mt-sm-5 mb-4 text-white-50">
                <div>
                  <Link to="/" className="d-inline-block auth-logo">
                    <img
                      src="/assets/images/logo-light.png"
                      alt=""
                      height="20"
                    />
                  </Link>
                </div>
                <p className="mt-3 fs-15 fw-medium">
                  Sistema de Gestión de Calidad - ZentraQMS
                </p>
              </div>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6 col-xl-5">
              <div className="card mt-4">
                <div className="card-body p-4">
                  <div className="text-center mt-2">
                    <div className="avatar-lg mx-auto">
                      <div className="avatar-title bg-light text-danger display-3 rounded-circle">
                        <i className="ri-shield-cross-line"></i>
                      </div>
                    </div>

                    <h4 className="text-danger mt-4">Acceso Denegado</h4>
                    <p className="text-muted mt-3">
                      No tienes permisos suficientes para acceder a este
                      recurso.
                    </p>

                    {fromPath !== "/" && (
                      <div className="alert alert-warning mt-3" role="alert">
                        <i className="ri-information-line me-2"></i>
                        Intentabas acceder a: <strong>{fromPath}</strong>
                      </div>
                    )}

                    {renderRequiredPermissions()}
                    {renderCurrentPermissions()}

                    <div className="mt-4">
                      <h6 className="text-muted mb-3">¿Qué puedes hacer?</h6>

                      <div className="d-grid gap-2">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleGoBack}
                        >
                          <i className="ri-arrow-left-line me-1"></i>
                          Volver
                        </button>

                        <Link
                          to="/dashboard"
                          className="btn btn-outline-primary"
                        >
                          <i className="ri-dashboard-line me-1"></i>
                          Ir al Dashboard
                        </Link>
                      </div>
                    </div>

                    {suggestedActions.length > 0 && (
                      <div className="mt-4">
                        <h6 className="text-muted mb-3">
                          Acciones Disponibles:
                        </h6>
                        <div className="row g-2">
                          {suggestedActions.map((action, index) => (
                            <div key={index} className="col-6">
                              <Link
                                to={action.path}
                                className="btn btn-outline-secondary btn-sm w-100"
                              >
                                <i className={`${action.icon} me-1`}></i>
                                {action.label}
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-top">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {user && (
                            <>
                              Conectado como:{" "}
                              <strong>
                                {user.first_name} {user.last_name}
                              </strong>
                            </>
                          )}
                        </small>
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-decoration-none"
                          onClick={handleLogout}
                        >
                          <i className="ri-logout-circle-line me-1"></i>
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>

                    {/* Contact admin message */}
                    <div className="mt-4">
                      <div className="alert alert-info" role="alert">
                        <i className="ri-information-line me-2"></i>
                        <strong>¿Necesitas más permisos?</strong>
                        <br />
                        Contacta a tu administrador de sistema para solicitar
                        acceso adicional.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Debug info for development */}
              {process.env.NODE_ENV === "development" && (
                <div className="card mt-3">
                  <div className="card-body p-3">
                    <h6 className="text-muted mb-2">
                      Debug Info (Development Only):
                    </h6>
                    <small className="text-muted">
                      <div>
                        <strong>Reason:</strong> {reason}
                      </div>
                      <div>
                        <strong>From:</strong> {fromPath}
                      </div>
                      <div>
                        <strong>User Roles:</strong>{" "}
                        {roles.join(", ") || "None"}
                      </div>
                      <div>
                        <strong>User Permissions:</strong> {permissions.length}{" "}
                        total
                      </div>
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="text-center">
                <p className="mb-0 text-muted">
                  &copy;2024 ZentraQMS. Desarrollado por
                  <i className="mdi mdi-heart text-danger"></i> Zentra Solutions
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AccessDeniedPage;
