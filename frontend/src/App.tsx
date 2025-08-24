/**
 * Main App Component for ZentraQMS Frontend
 * React 19 Compatible Version
 */

import React, { Suspense, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Initialize error handling system
import { initializeHttpInterceptors } from "./utils/httpInterceptors";

// Simple Router
import {
  SimpleRouter,
  Route,
  Navigate,
  useLocation,
} from "./utils/SimpleRouter";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";

// Components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Layouts
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages - Lazy loaded for better performance
const LoginPage = React.lazy(() => import("./pages/auth/LoginPage"));
const Dashboard = React.lazy(() => import("./pages/dashboard/Dashboard"));
const OrganizationWizard = React.lazy(
  () => import("./pages/organization/wizard/OrganizationWizard"),
);
// Organizational Chart pages
const OrganizationalChartMainPage = React.lazy(
  () => import("./pages/OrganizationalChart").then(module => ({ default: module.OrganizationalChartMainPage })),
);
const OrganizationalChartCreatePage = React.lazy(
  () => import("./pages/OrganizationalChart").then(module => ({ default: module.OrganizationalChartCreatePage })),
);
const OrganizationalChartEditPage = React.lazy(
  () => import("./pages/OrganizationalChart").then(module => ({ default: module.OrganizationalChartEditPage })),
);
const PositionsManagementPage = React.lazy(() => import("./pages/positions"));
const ProcesosPage = React.lazy(() => import("./pages/procesos/ProcesosPage"));
const AuditoriasPage = React.lazy(
  () => import("./pages/auditorias/AuditoriasPage"),
);
const NormogramaPage = React.lazy(
  () => import("./pages/normograma/NormogramaPage"),
);
const IndicadoresPage = React.lazy(
  () => import("./pages/indicadores/IndicadoresPage"),
);
const SOGCSDashboard = React.lazy(() => import("./pages/sogcs/dashboard"));
const SOGCSSedesPage = React.lazy(() => import("./pages/sogcs/configuracion/sedes"));
const SOGCSServiciosPage = React.lazy(() => import("./pages/sogcs/configuracion/servicios"));
const OrganizationalCustomizationPage = React.lazy(() => import("./pages/OrganizationalCustomization/OrganizationalCustomizationPage"));
const ProfilePage = React.lazy(() => import("./pages/profile/ProfilePage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

// Styles
import "./pages/auth/auth.css";
import "./components/layout/layout.css";

/**
 * Loading fallback component
 */
const PageLoader: React.FC = () => (
  <div className="d-flex justify-content-center align-items-center min-vh-100">
    <LoadingSpinner size="lg" />
  </div>
);


/**
 * Router component to handle navigation logic
 */
const AppRouter: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Handle root redirect
  if (currentPath === "/") {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      {/* Public Routes */}
      <Route path="/login">
        <LoginPage />
      </Route>

      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/organization/wizard">
        <ProtectedRoute permissions={["organization.create"]}>
          <DashboardLayout>
            <OrganizationWizard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Organizational Chart Routes */}
      <Route path="/organization/chart">
        <ProtectedRoute permissions={["organization.read_orgchart"]}>
          <OrganizationalChartMainPage />
        </ProtectedRoute>
      </Route>

      <Route path="/organigramas">
        <ProtectedRoute permissions={["organization.read_orgchart"]}>
          <OrganizationalChartMainPage />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/charts/new">
        <ProtectedRoute permissions={["organization.create_orgchart"]}>
          <OrganizationalChartCreatePage />
        </ProtectedRoute>
      </Route>

      <Route path="/organigramas/nuevo">
        <ProtectedRoute permissions={["organization.create_orgchart"]}>
          <OrganizationalChartCreatePage />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/charts/:chartId/edit">
        <ProtectedRoute permissions={["organization.update_orgchart"]}>
          <OrganizationalChartEditPage />
        </ProtectedRoute>
      </Route>

      <Route path="/organigramas/:chartId/editar">
        <ProtectedRoute permissions={["organization.update_orgchart"]}>
          <OrganizationalChartEditPage />
        </ProtectedRoute>
      </Route>

      <Route path="/organization/charts/:chartId">
        <ProtectedRoute permissions={["organization.read_orgchart"]}>
          <OrganizationalChartMainPage />
        </ProtectedRoute>
      </Route>

      <Route path="/organigramas/:chartId">
        <ProtectedRoute permissions={["organization.read_orgchart"]}>
          <OrganizationalChartMainPage />
        </ProtectedRoute>
      </Route>

      {/* Positions Management Routes */}
      <Route path="/positions">
        <ProtectedRoute permissions={["organization.read_orgchart"]}>
          <PositionsManagementPage />
        </ProtectedRoute>
      </Route>

      <Route path="/puestos">
        <ProtectedRoute permissions={["organization.read_orgchart"]}>
          <PositionsManagementPage />
        </ProtectedRoute>
      </Route>

      <Route path="/procesos">
        <ProtectedRoute>
          <DashboardLayout>
            <ProcesosPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/auditorias">
        <ProtectedRoute>
          <DashboardLayout>
            <AuditoriasPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/normograma">
        <ProtectedRoute>
          <DashboardLayout>
            <NormogramaPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/indicadores">
        <ProtectedRoute>
          <DashboardLayout>
            <IndicadoresPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/sogcs/dashboard">
        <ProtectedRoute permissions={["sogcs.read"]}>
          <SOGCSDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/sogcs/configuracion/sedes">
        <ProtectedRoute>
          <SOGCSSedesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/sogcs/configuracion/servicios">
        <ProtectedRoute>
          <SOGCSServiciosPage />
        </ProtectedRoute>
      </Route>

      {/* Organizational Customization Routes */}
      <Route path="/organizacion/customizaciones/:customizationId">
        <ProtectedRoute permissions={["organization.read_customization"]}>
          <OrganizationalCustomizationPage />
        </ProtectedRoute>
      </Route>

      <Route path="/organizacion/customizaciones/:customizationId/editar">
        <ProtectedRoute permissions={["organization.update_customization"]}>
          <OrganizationalCustomizationPage mode="edit" />
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <DashboardLayout>
            <ProfilePage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Access denied route */}
      <Route path="/access-denied">
        <div className="d-flex align-items-center justify-content-center min-vh-100">
          <div className="text-center">
            <div className="card">
              <div className="card-body p-4">
                <h1 className="display-1 text-danger">🚫</h1>
                <h2 className="h4 mb-3">Acceso Denegado</h2>
                <p className="text-muted mb-4">
                  No tienes permisos suficientes para acceder a esta página.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => window.history.back()}
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      </Route>

      {/* Default fallback - 404 */}
      {!currentPath.startsWith("/organization/chart") &&
       !currentPath.startsWith("/organization/charts/") &&
       !currentPath.startsWith("/organigramas") &&
       !currentPath.startsWith("/organizacion/customizaciones/") &&
       ![
        "/",
        "/login",
        "/dashboard",
        "/organization/wizard",
        "/organigramas",
        "/procesos",
        "/auditorias",
        "/normograma",
        "/indicadores",
        "/sogcs/dashboard",
        "/sogcs/configuracion/sedes",
        "/sogcs/configuracion/servicios",
        "/profile",
        "/access-denied",
       ].includes(currentPath) && <NotFoundPage />}
    </Suspense>
  );
};

/**
 * Main App Component
 */
const App: React.FC = () => {
  // Initialize error handling system on app start
  useEffect(() => {
    initializeHttpInterceptors();
  }, []);

  return (
    <ErrorBoundary showDetails={true}>
      <AuthProvider>
        <SimpleRouter>
          <div className="App">
            <AppRouter />
          </div>

          {/* Toast Container for error notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            className="toast-container"
          />
        </SimpleRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
