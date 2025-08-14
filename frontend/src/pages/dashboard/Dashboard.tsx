import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "../../utils/SimpleRouter";
import { toast } from "react-toastify";
import { apiClient } from "../../api/endpoints";

interface DashboardStats {
  totalUsers?: number;
  activeUsers?: number;
  pendingTasks?: number;
  completedTasks?: number;
}

interface OrganizationCheck {
  hasOrganizations: boolean;
  canCreateOrganizations: boolean;
  shouldRedirectToWizard: boolean;
}

const Dashboard: React.FC = () => {
  const { user, logout, isLoading: authLoading, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({});
  const [isLoading, setIsLoading] = useState(false);
  const [organizationCheck, setOrganizationCheck] = useState<OrganizationCheck>(
    {
      hasOrganizations: true, // Assume true by default to avoid premature redirect
      canCreateOrganizations: false,
      shouldRedirectToWizard: false,
    },
  );

  // Check organization status
  const checkOrganizationStatus = async () => {
    console.log("[Dashboard] checkOrganizationStatus called");
    console.log("[Dashboard] User:", user);
    console.log("[Dashboard] AuthLoading:", authLoading);

    if (!user || authLoading) {
      console.log("[Dashboard] Skipping check - no user or still loading");
      return;
    }

    try {
      // Check if user has permission to create organizations
      const canCreate = hasPermission("organization.create");
      console.log("[Dashboard] Can create organizations:", canCreate);

      // Check if organizations exist using the lightweight endpoint
      console.log("[Dashboard] Fetching organization existence...");
      const response = await apiClient.get(
        "/api/v1/organizations/exists_check/",
      );
      console.log("[Dashboard] Organization check response:", response.data);
      const hasOrgs = response.data.exists;

      // Determine if should redirect to wizard
      const shouldRedirect = !hasOrgs && canCreate;
      console.log("[Dashboard] Should redirect to wizard:", shouldRedirect);

      setOrganizationCheck({
        hasOrganizations: hasOrgs,
        canCreateOrganizations: canCreate,
        shouldRedirectToWizard: shouldRedirect,
      });

      // Auto-redirect if needed (only if user has permissions)
      if (shouldRedirect) {
        console.log("[Dashboard] Triggering auto-redirect...");
        toast.info(
          "No se han configurado organizaciones. Redirigiendo al asistente de configuración...",
          {
            autoClose: 3000,
          },
        );
        setTimeout(() => {
          navigate("/organization/wizard");
        }, 3000);
      } else if (!hasOrgs && !canCreate) {
        // Show message to users without permission
        console.log(
          "[Dashboard] User cannot create organizations, showing info message",
        );
        toast.warning(
          "Las organizaciones no han sido configuradas. Contacte al administrador.",
          {
            autoClose: 5000,
          },
        );
      }
    } catch (error) {
      console.error("[Dashboard] Error checking organization status:", error);
      // Don't show error toast, just assume organizations exist
      setOrganizationCheck((prev) => ({
        ...prev,
        hasOrganizations: true,
        shouldRedirectToWizard: false,
      }));
    }
  };

  // Cargar datos del dashboard (simulado por ahora)
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Check organization status first
        await checkOrganizationStatus();

        // Simular carga de datos
        // En el futuro, esto será una llamada real a la API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setStats({
          totalUsers: 150,
          activeUsers: 89,
          pendingTasks: 23,
          completedTasks: 67,
        });
      } catch (error) {
        console.error("Error loading dashboard:", error);
        toast.error("Error al cargar los datos del dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !authLoading) {
      loadDashboardData();
    }
  }, [user, authLoading, hasPermission, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada correctamente");
      navigate("/login");
    } catch {
      toast.error("Error al cerrar sesión");
    }
  };

  // Test de endpoint protegido
  const testProtectedEndpoint = async () => {
    try {
      const response = await apiClient.get("/api/auth/user/");
      console.log("Protected endpoint response:", response.data);
      toast.success("Endpoint protegido accedido correctamente");
    } catch (error) {
      console.error("Error accessing protected endpoint:", error);
      toast.error("Error al acceder al endpoint protegido");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "400px" }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container-fluid">
        {/* Page Title */}
        <div className="row">
          <div className="col-12">
            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
              <h4 className="mb-sm-0">Dashboard</h4>
              <div className="page-title-right">
                <ol className="breadcrumb m-0">
                  <li className="breadcrumb-item">
                    <a href="#">Home</a>
                  </li>
                  <li className="breadcrumb-item active">Dashboard</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="card-title">
                      ¡Bienvenido, {user?.first_name || "Usuario"}! 👋
                    </h5>
                    <p className="text-muted mb-0">
                      Has iniciado sesión como: <strong>{user?.email}</strong>
                    </p>
                    {user?.department && (
                      <p className="text-muted mb-0">
                        Departamento: <strong>{user.department}</strong>
                      </p>
                    )}
                    {user?.position && (
                      <p className="text-muted mb-0">
                        Cargo: <strong>{user.position}</strong>
                      </p>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={handleLogout}
                      className="btn btn-soft-danger"
                    >
                      <i className="ri-logout-box-line align-middle me-1"></i>
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Status Alert */}
        {!organizationCheck.hasOrganizations && (
          <div className="row">
            <div className="col-12">
              {organizationCheck.canCreateOrganizations ? (
                <div
                  className="alert alert-warning d-flex align-items-center"
                  role="alert"
                >
                  <i className="ri-error-warning-line me-2 fs-16"></i>
                  <div className="flex-grow-1">
                    <strong>Configuración inicial requerida:</strong> No se han
                    configurado organizaciones en el sistema.
                    {organizationCheck.shouldRedirectToWizard && (
                      <span>
                        {" "}
                        Redirigiendo automáticamente al asistente de
                        configuración...
                      </span>
                    )}
                  </div>
                  <div className="ms-3">
                    <button
                      onClick={() => navigate("/organization/wizard")}
                      className="btn btn-warning btn-sm"
                    >
                      <i className="ri-settings-line me-1"></i>
                      Configurar Ahora
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="alert alert-info d-flex align-items-center"
                  role="alert"
                >
                  <i className="ri-information-line me-2 fs-16"></i>
                  <div>
                    <strong>Sistema en configuración:</strong> Las
                    organizaciones están siendo configuradas por un
                    administrador. Por favor contacta al administrador del
                    sistema si necesitas acceso.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="row">
          <div className="col-xl-3 col-md-6">
            <div className="card card-animate">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1 overflow-hidden">
                    <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                      Total Usuarios
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-end justify-content-between mt-4">
                  <div>
                    <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                      <span
                        className="counter-value"
                        data-target={stats.totalUsers}
                      >
                        {stats.totalUsers || 0}
                      </span>
                    </h4>
                  </div>
                  <div className="avatar-sm flex-shrink-0">
                    <span className="avatar-title bg-primary-subtle rounded fs-3">
                      <i className="bx bx-user text-primary"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6">
            <div className="card card-animate">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1 overflow-hidden">
                    <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                      Usuarios Activos
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-end justify-content-between mt-4">
                  <div>
                    <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                      <span
                        className="counter-value"
                        data-target={stats.activeUsers}
                      >
                        {stats.activeUsers || 0}
                      </span>
                    </h4>
                  </div>
                  <div className="avatar-sm flex-shrink-0">
                    <span className="avatar-title bg-success-subtle rounded fs-3">
                      <i className="bx bx-user-check text-success"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6">
            <div className="card card-animate">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1 overflow-hidden">
                    <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                      Tareas Pendientes
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-end justify-content-between mt-4">
                  <div>
                    <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                      <span
                        className="counter-value"
                        data-target={stats.pendingTasks}
                      >
                        {stats.pendingTasks || 0}
                      </span>
                    </h4>
                  </div>
                  <div className="avatar-sm flex-shrink-0">
                    <span className="avatar-title bg-warning-subtle rounded fs-3">
                      <i className="bx bx-task text-warning"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6">
            <div className="card card-animate">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1 overflow-hidden">
                    <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                      Tareas Completadas
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-end justify-content-between mt-4">
                  <div>
                    <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                      <span
                        className="counter-value"
                        data-target={stats.completedTasks}
                      >
                        {stats.completedTasks || 0}
                      </span>
                    </h4>
                  </div>
                  <div className="avatar-sm flex-shrink-0">
                    <span className="avatar-title bg-info-subtle rounded fs-3">
                      <i className="bx bx-check-circle text-info"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Section (Solo en desarrollo) */}
        {import.meta.env.DEV && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    Área de Pruebas (Solo Desarrollo)
                  </h5>
                </div>
                <div className="card-body">
                  <div className="d-flex gap-2">
                    <button
                      onClick={testProtectedEndpoint}
                      className="btn btn-primary"
                    >
                      Test Endpoint Protegido
                    </button>
                    <button
                      onClick={() => {
                        console.log("Current user:", user);
                        console.log(
                          "Access token:",
                          localStorage.getItem("access_token"),
                        );
                        console.log(
                          "Refresh token:",
                          localStorage.getItem("refresh_token"),
                        );
                      }}
                      className="btn btn-info"
                    >
                      Ver Info de Sesión
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem("access_token");
                        toast.info("Access token eliminado. Intenta navegar.");
                      }}
                      className="btn btn-warning"
                    >
                      Simular Token Expirado
                    </button>
                  </div>

                  {/* User Info Display */}
                  <div className="mt-3">
                    <h6>Información del Usuario:</h6>
                    <pre className="bg-light p-3 rounded">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder para futuras secciones */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Sistema de Gestión de Calidad</h5>
                <p className="card-text">
                  Este es el dashboard principal. Aquí se mostrarán métricas y
                  accesos rápidos a las funcionalidades principales del sistema.
                </p>
                <div className="alert alert-info" role="alert">
                  <strong>Próximamente:</strong> Módulos de gestión de procesos,
                  auditorías, no conformidades, indicadores y más.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
