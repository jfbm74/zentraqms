import React, { useEffect, useState, useCallback, useRef } from "react";
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
  
  // Toast deduplication
  const lastToastRef = useRef<{ message: string; timestamp: number } | null>(null);
  const [organizationCheck, setOrganizationCheck] = useState<OrganizationCheck>(
    {
      hasOrganizations: true, // Assume true by default to avoid premature redirect
      canCreateOrganizations: false,
      shouldRedirectToWizard: false,
    },
  );
  
  /**
   * Show toast with deduplication to prevent duplicates
   */
  const showToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string, options?: any) => {
    const now = Date.now();
    const lastToast = lastToastRef.current;
    
    // Prevent duplicate toasts within 3 seconds
    if (lastToast && lastToast.message === message && now - lastToast.timestamp < 3000) {
      return;
    }
    
    // Update last toast reference
    lastToastRef.current = { message, timestamp: now };
    
    // Show the toast
    toast[type](message, options);
  }, []);

  // Check organization status
  const checkOrganizationStatus = useCallback(async () => {
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
        showToast('info',
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
        showToast('warning',
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
  }, [user, authLoading, hasPermission, navigate]);

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
        showToast('error', "Error al cargar los datos del dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !authLoading) {
      loadDashboardData();
    }
  }, [user, authLoading, hasPermission, navigate, checkOrganizationStatus]);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('success', "Sesión cerrada correctamente");
      navigate("/login");
    } catch {
      showToast('error', "Error al cerrar sesión");
    }
  };

  // Test de endpoint protegido
  const testProtectedEndpoint = async () => {
    try {
      const response = await apiClient.get("/api/auth/user/");
      console.log("Protected endpoint response:", response.data);
      showToast('success', "Endpoint protegido accedido correctamente");
    } catch (error) {
      console.error("Error accessing protected endpoint:", error);
      showToast('error', "Error al acceder al endpoint protegido");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Sistema de Gestión de Calidad</h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
