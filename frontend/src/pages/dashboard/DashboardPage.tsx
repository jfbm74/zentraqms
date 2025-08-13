/**
 * Dashboard Page for ZentraQMS Frontend
 * 
 * Main dashboard with KPIs and analytics for the Quality Management System.
 * Phase 5: Enhanced with role-based dashboard differentiation.
 */

import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRoleBasedUI } from '../../hooks/usePermissions';
import {
  SuperAdminDashboard,
  AdminDashboard,
  CoordinatorDashboard,
  AuditorDashboard,
  ReadOnlyDashboard,
  DefaultDashboard,
} from '../../components/dashboard/RoleBasedDashboard';

/**
 * Dashboard Page Component
 * 
 * Displays role-specific dashboard content based on user permissions and roles.
 * Phase 5: Dynamically renders different dashboard experiences.
 */
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { uiConfig } = useRoleBasedUI();

  useEffect(() => {
    document.title = 'Dashboard | ZentraQMS - Sistema de Gestión de Calidad';
  }, []);

  /**
   * Render appropriate dashboard based on user role and permissions
   */
  const renderRoleDashboard = () => {
    switch (uiConfig.dashboardType) {
      case 'admin':
        return user?.roles?.includes('super_admin') ? 
          <SuperAdminDashboard /> : 
          <AdminDashboard />;
      
      case 'coordinator':
        return <CoordinatorDashboard />;
      
      case 'auditor':
        return <AuditorDashboard />;
      
      case 'readonly':
        return <ReadOnlyDashboard />;
      
      default:
        return <DefaultDashboard />;
    }
  };

  return (
    <React.Fragment>
      {/* Page Title */}
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-sm-flex align-items-center justify-content-between">
            <h4 className="mb-sm-0">Dashboard</h4>
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item active">Dashboard</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="row">
        <div className="col-12">
          <div className="alert alert-primary alert-border-left" role="alert">
            <i className="ri-home-line me-3 align-middle"></i>
            Bienvenido/a <strong>{user?.first_name || 'Usuario'}</strong> al Sistema de Gestión de Calidad ZentraQMS
          </div>
        </div>
      </div>

      {/* Role-based Dashboard Content */}
      {renderRoleDashboard()}

      {/* Common Recent Activities Section */}
      <div className="row">
        <div className="col-xl-8">
          <div className="card">
            <div className="card-header align-items-center d-flex">
              <h4 className="card-title mb-0 flex-grow-1">Actividades Recientes</h4>
              <div className="flex-shrink-0">
                <button type="button" className="btn btn-soft-info btn-sm">
                  <i className="ri-file-list-3-line align-middle"></i> Ver Todo
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive table-card">
                <table className="table table-borderless table-centered align-middle table-nowrap mb-0">
                  <thead className="text-muted table-light">
                    <tr>
                      <th scope="col">Actividad</th>
                      <th scope="col">Usuario</th>
                      <th scope="col">Fecha</th>
                      <th scope="col">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-xs me-3">
                            <span className="avatar-title rounded-circle bg-success-subtle text-success">
                              <i className="ri-file-add-line"></i>
                            </span>
                          </div>
                          <div>
                            <h5 className="fs-13 mb-0">Nuevo proceso creado: "Control de Calidad v2.1"</h5>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img src="/src/assets/images/users/avatar-2.jpg" alt="" className="avatar-xs rounded-circle me-2" />
                          <span>Ana Rodríguez</span>
                        </div>
                      </td>
                      <td>Hace 2 horas</td>
                      <td>
                        <span className="badge bg-success-subtle text-success">Completado</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-xs me-3">
                            <span className="avatar-title rounded-circle bg-warning-subtle text-warning">
                              <i className="ri-search-eye-line"></i>
                            </span>
                          </div>
                          <div>
                            <h5 className="fs-13 mb-0">Auditoría interna programada para el área de Producción</h5>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img src="/src/assets/images/users/avatar-3.jpg" alt="" className="avatar-xs rounded-circle me-2" />
                          <span>Carlos Mendez</span>
                        </div>
                      </td>
                      <td>Hace 4 horas</td>
                      <td>
                        <span className="badge bg-warning-subtle text-warning">Programado</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-xs me-3">
                            <span className="avatar-title rounded-circle bg-info-subtle text-info">
                              <i className="ri-book-open-line"></i>
                            </span>
                          </div>
                          <div>
                            <h5 className="fs-13 mb-0">Documento actualizado en Normograma: ISO 9001:2015</h5>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img src="/src/assets/images/users/avatar-4.jpg" alt="" className="avatar-xs rounded-circle me-2" />
                          <span>María García</span>
                        </div>
                      </td>
                      <td>Ayer</td>
                      <td>
                        <span className="badge bg-info-subtle text-info">Actualizado</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">Indicadores de Calidad</h4>
            </div>
            <div className="card-body">
              <div className="text-center">
                <div className="mb-4">
                  <i className="ri-medal-line display-5 text-success"></i>
                </div>
                <h4>Excelente Desempeño</h4>
                <p className="text-muted">El sistema mantiene un 95.8% de conformidad con los estándares de calidad establecidos.</p>
                
                <div className="mt-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Procesos Conformes</span>
                    <span>95.8%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar bg-success" style={{ width: '95.8%' }}></div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Auditorías Completadas</span>
                    <span>87.2%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar bg-info" style={{ width: '87.2%' }}></div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Documentación Actualizada</span>
                    <span>92.5%</span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar bg-warning" style={{ width: '92.5%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default DashboardPage;