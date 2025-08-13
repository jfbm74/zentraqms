/**
 * Role-based Dashboard Components for ZentraQMS Frontend
 * 
 * These components provide differentiated dashboard experiences
 * based on user roles and permissions.
 */

import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionGate } from '../common/PermissionGate';

/**
 * KPI Card Component
 */
interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  iconColor: string;
  link?: string;
  permission?: string;
  permissions?: string[];
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconColor,
  link,
  permission,
  permissions,
}) => {
  const changeColorClass = 
    changeType === 'positive' ? 'text-success' : 
    changeType === 'negative' ? 'text-danger' : 
    'text-muted';

  const changeIcon = 
    changeType === 'positive' ? 'ri-arrow-right-up-line' : 
    changeType === 'negative' ? 'ri-arrow-right-down-line' : 
    'ri-subtract-line';

  const cardContent = (
    <div className="card card-animate">
      <div className="card-body">
        <div className="d-flex align-items-center">
          <div className="flex-grow-1 overflow-hidden">
            <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
              {title}
            </p>
          </div>
          {change && (
            <div className="flex-shrink-0">
              <h5 className={`${changeColorClass} fs-14 mb-0`}>
                <i className={`${changeIcon} fs-13 align-middle`}></i>
                {change}
              </h5>
            </div>
          )}
        </div>
        <div className="d-flex align-items-end justify-content-between mt-4">
          <div>
            <h4 className="fs-22 fw-semibold ff-secondary mb-4">
              <span className="counter-value">{value}</span>
            </h4>
            {link && (
              <a href={link} className="text-decoration-underline">
                Ver Detalles
              </a>
            )}
          </div>
          <div className="avatar-sm flex-shrink-0">
            <span className={`avatar-title bg-${iconColor}-subtle rounded fs-3`}>
              <i className={`${icon} text-${iconColor}`}></i>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (permission || permissions) {
    return (
      <PermissionGate permission={permission} permissions={permissions}>
        {cardContent}
      </PermissionGate>
    );
  }

  return cardContent;
};

/**
 * Super Admin Dashboard
 */
export const SuperAdminDashboard: React.FC = () => {
  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="alert alert-success alert-border-left" role="alert">
            <i className="ri-shield-check-line me-3 align-middle"></i>
            <strong>Panel de Super Administrador</strong> - Acceso completo al sistema
          </div>
        </div>
      </div>

      {/* Super Admin KPIs */}
      <div className="row">
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Total Usuarios"
            value={156}
            change="+8.2%"
            changeType="positive"
            icon="ri-user-line"
            iconColor="primary"
            link="/configuracion/usuarios"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Roles Activos"
            value={8}
            change="+2"
            changeType="positive"
            icon="ri-shield-user-line"
            iconColor="success"
            link="/configuracion/roles"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Sesiones Activas"
            value={42}
            change="-5.3%"
            changeType="negative"
            icon="ri-computer-line"
            iconColor="warning"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Eventos de Sistema"
            value={1254}
            change="+12.5%"
            changeType="positive"
            icon="ri-notification-3-line"
            iconColor="info"
          />
        </div>
      </div>

      {/* System Health */}
      <div className="row">
        <div className="col-xl-8">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">Estado del Sistema</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar-xs me-3">
                      <span className="avatar-title rounded-circle bg-success">
                        <i className="ri-database-2-line text-white"></i>
                      </span>
                    </div>
                    <div>
                      <h5 className="mb-1">Base de Datos</h5>
                      <span className="badge bg-success-subtle text-success">Operativa</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar-xs me-3">
                      <span className="avatar-title rounded-circle bg-success">
                        <i className="ri-server-line text-white"></i>
                      </span>
                    </div>
                    <div>
                      <h5 className="mb-1">Servidor Web</h5>
                      <span className="badge bg-success-subtle text-success">Operativo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">Acciones Rápidas</h4>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <a href="/configuracion/usuarios" className="btn btn-primary">
                  <i className="ri-user-add-line me-1"></i>
                  Crear Usuario
                </a>
                <a href="/configuracion/sistema" className="btn btn-outline-secondary">
                  <i className="ri-settings-3-line me-1"></i>
                  Configuración Sistema
                </a>
                <a href="/reportes/sistema" className="btn btn-outline-info">
                  <i className="ri-file-chart-line me-1"></i>
                  Reportes del Sistema
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Admin Dashboard
 */
export const AdminDashboard: React.FC = () => {
  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="alert alert-info alert-border-left" role="alert">
            <i className="ri-admin-line me-3 align-middle"></i>
            <strong>Panel de Administrador</strong> - Gestión completa de QMS
          </div>
        </div>
      </div>

      {/* Admin KPIs */}
      <div className="row">
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Procesos Gestionados"
            value={45}
            change="+15.3%"
            changeType="positive"
            icon="ri-file-list-3-line"
            iconColor="success"
            link="/procesos"
            permissions={['processes.read', 'processes.*']}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Auditorías Activas"
            value={12}
            change="-3.57%"
            changeType="negative"
            icon="ri-search-eye-line"
            iconColor="warning"
            link="/auditorias"
            permissions={['audits.read', 'audits.*']}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Documentos Normograma"
            value={128}
            change="+2.85%"
            changeType="positive"
            icon="ri-book-open-line"
            iconColor="info"
            link="/normograma"
            permissions={['documents.read', 'documents.*']}
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Usuarios Activos"
            value={89}
            change="+5.2%"
            changeType="positive"
            icon="ri-user-line"
            iconColor="primary"
            link="/configuracion/usuarios"
            permissions={['users.read', 'users.*']}
          />
        </div>
      </div>
    </>
  );
};

/**
 * Coordinator Dashboard
 */
export const CoordinatorDashboard: React.FC = () => {
  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="alert alert-warning alert-border-left" role="alert">
            <i className="ri-user-star-line me-3 align-middle"></i>
            <strong>Panel de Coordinador</strong> - Gestión de procesos y auditorías
          </div>
        </div>
      </div>

      {/* Coordinator KPIs */}
      <div className="row">
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Procesos Asignados"
            value={18}
            change="+3.2%"
            changeType="positive"
            icon="ri-file-list-3-line"
            iconColor="success"
            link="/procesos"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Auditorías Coordinadas"
            value={7}
            change="+1"
            changeType="positive"
            icon="ri-search-eye-line"
            iconColor="warning"
            link="/auditorias"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Equipos de Trabajo"
            value={4}
            icon="ri-team-line"
            iconColor="info"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Tareas Pendientes"
            value={23}
            change="-8.5%"
            changeType="positive"
            icon="ri-task-line"
            iconColor="primary"
          />
        </div>
      </div>
    </>
  );
};

/**
 * Auditor Dashboard
 */
export const AuditorDashboard: React.FC = () => {
  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="alert alert-secondary alert-border-left" role="alert">
            <i className="ri-search-eye-line me-3 align-middle"></i>
            <strong>Panel de Auditor</strong> - Gestión de auditorías y hallazgos
          </div>
        </div>
      </div>

      {/* Auditor KPIs */}
      <div className="row">
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Auditorías Asignadas"
            value={5}
            change="+2"
            changeType="positive"
            icon="ri-search-eye-line"
            iconColor="warning"
            link="/auditorias"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Hallazgos Identificados"
            value={18}
            change="+12%"
            changeType="neutral"
            icon="ri-error-warning-line"
            iconColor="danger"
            link="/auditorias/hallazgos"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Reportes Pendientes"
            value={3}
            change="-2"
            changeType="positive"
            icon="ri-file-paper-line"
            iconColor="info"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Procesos Auditados"
            value={12}
            change="+1"
            changeType="positive"
            icon="ri-file-list-check-line"
            iconColor="success"
          />
        </div>
      </div>
    </>
  );
};

/**
 * Read-only/Consultation Dashboard
 */
export const ReadOnlyDashboard: React.FC = () => {
  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="alert alert-light alert-border-left" role="alert">
            <i className="ri-eye-line me-3 align-middle"></i>
            <strong>Panel de Consulta</strong> - Acceso de solo lectura al sistema QMS
          </div>
        </div>
      </div>

      {/* Read-only KPIs */}
      <div className="row">
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Procesos Disponibles"
            value={45}
            icon="ri-file-list-3-line"
            iconColor="success"
            link="/procesos"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Documentos Normograma"
            value={128}
            icon="ri-book-open-line"
            iconColor="info"
            link="/normograma"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Reportes Disponibles"
            value={24}
            icon="ri-line-chart-line"
            iconColor="primary"
            link="/indicadores"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Última Actualización"
            value="Hoy"
            icon="ri-refresh-line"
            iconColor="secondary"
          />
        </div>
      </div>

      {/* Information Notice */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center">
              <div className="mb-3">
                <i className="ri-information-line display-4 text-info"></i>
              </div>
              <h5>Acceso de Solo Lectura</h5>
              <p className="text-muted">
                Tu cuenta tiene permisos de consulta. Puedes visualizar información pero no realizar modificaciones.
                Si necesitas permisos adicionales, contacta a tu administrador.
              </p>
              <div className="mt-3">
                <a href="/normograma" className="btn btn-primary me-2">
                  <i className="ri-book-open-line me-1"></i>
                  Ver Normograma
                </a>
                <a href="/indicadores" className="btn btn-outline-info">
                  <i className="ri-line-chart-line me-1"></i>
                  Ver Reportes
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Default Dashboard for authenticated users without specific roles
 */
export const DefaultDashboard: React.FC = () => {
  return (
    <>
      <div className="row">
        <div className="col-12">
          <div className="alert alert-primary alert-border-left" role="alert">
            <i className="ri-home-line me-3 align-middle"></i>
            Bienvenido al Sistema de Gestión de Calidad ZentraQMS
          </div>
        </div>
      </div>

      {/* Basic KPIs */}
      <div className="row">
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Procesos Activos"
            value={45}
            change="+15.3%"
            changeType="positive"
            icon="ri-file-list-3-line"
            iconColor="success"
            link="/procesos"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Auditorías Pendientes"
            value={12}
            change="-3.57%"
            changeType="negative"
            icon="ri-search-eye-line"
            iconColor="warning"
            link="/auditorias"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Documentos Normograma"
            value={128}
            change="+2.85%"
            changeType="positive"
            icon="ri-book-open-line"
            iconColor="info"
            link="/normograma"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <KPICard
            title="Indicadores KPI"
            value={24}
            change="+8.42%"
            changeType="positive"
            icon="ri-line-chart-line"
            iconColor="primary"
            link="/indicadores"
          />
        </div>
      </div>
    </>
  );
};