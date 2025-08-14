/**
 * Main App Component for ZentraQMS Frontend
 *
 * This component sets up the main application structure with routing,
 * authentication protection, and global providers.
 */

import React, { Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import Layout from "./components/layout/Layout";

// Pages - Lazy loaded for better performance
const LoginPage = React.lazy(() => import("./pages/auth/LoginPage"));
const Dashboard = React.lazy(() => import("./pages/dashboard/Dashboard"));
const OrganizationWizard = React.lazy(
  () => import("./pages/organization/wizard/OrganizationWizard"),
);
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
const ProfilePage = React.lazy(() => import("./pages/profile/ProfilePage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

// Styles
import "./pages/auth/auth.css";
import "./components/layout/layout.css";

/**
 * Create React Query client with default configuration
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Loading fallback component
 */
const PageLoader: React.FC = () => (
  <div className="d-flex justify-content-center align-items-center min-vh-100">
    <LoadingSpinner size="lg" />
  </div>
);

/**
 * Dashboard layout wrapper for protected pages
 */
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <Layout>{children}</Layout>;

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
      {![
        "/",
        "/login",
        "/dashboard",
        "/organization/wizard",
        "/procesos",
        "/auditorias",
        "/normograma",
        "/indicadores",
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
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
