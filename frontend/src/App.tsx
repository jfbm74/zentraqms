/**
 * Main App Component for ZentraQMS Frontend
 * 
 * This component sets up the main application structure with routing,
 * authentication protection, and global providers.
 */

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Layouts
import Layout from './components/layout/Layout';

// Pages - Lazy loaded for better performance
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'));
const OrganizationWizard = React.lazy(() => import('./pages/organization/wizard/OrganizationWizard'));
const ProcesosPage = React.lazy(() => import('./pages/procesos/ProcesosPage'));
const AuditoriasPage = React.lazy(() => import('./pages/auditorias/AuditoriasPage'));
const NormogramaPage = React.lazy(() => import('./pages/normograma/NormogramaPage'));
const IndicadoresPage = React.lazy(() => import('./pages/indicadores/IndicadoresPage'));
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

// Styles
import './pages/auth/auth.css';
import './components/layout/layout.css';

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
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Layout>
    {children}
  </Layout>
);

/**
 * Main App Component
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="App">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                  {/* Public Routes */}
                  <Route
                    path="/login"
                    element={<LoginPage />}
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <Dashboard />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/organization/wizard"
                    element={
                      <ProtectedRoute permissions={['organization.create']}>
                        <DashboardLayout>
                          <OrganizationWizard />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/procesos"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <ProcesosPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/auditorias"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <AuditoriasPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/normograma"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <NormogramaPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/indicadores"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <IndicadoresPage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout>
                          <ProfilePage />
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Root redirect */}
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />

                  {/* Access denied route */}
                  <Route
                    path="/access-denied"
                    element={
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
                    }
                  />

                  {/* Catch all route - 404 */}
                  <Route
                    path="*"
                    element={<NotFoundPage />}
                  />
                </Routes>
              </Suspense>
            </div>

            {/* Toast Container */}
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
            />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;