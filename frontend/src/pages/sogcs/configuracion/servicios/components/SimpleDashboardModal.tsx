import React from 'react';
import { useServicioStore } from '../../../../../stores/servicioStore';
import { useCurrentOrganization } from '../../../../../hooks/useCurrentOrganization';

// ====================================
// INTERFACES
// ====================================

interface SimpleDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

// ====================================
// COMPONENT
// ====================================

const SimpleDashboardModal: React.FC<SimpleDashboardModalProps> = ({
  isOpen,
  onClose,
  title = 'Dashboard Avanzado de Servicios de Salud'
}) => {
  const { statistics, loading } = useServicioStore();
  const { hasOrganization } = useCurrentOrganization();

  if (!isOpen) {
    return null;
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-CO').format(num);
  };

  const formatPercentage = (value: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const getDisplayLabel = (key: string): string => {
    const labelMap: Record<string, string> = {
      activo: 'Activo',
      inactivo: 'Inactivo', 
      suspendido: 'Suspendido',
      en_proceso: 'En Proceso',
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta',
      intramural: 'Intramural',
      extramural: 'Extramural',
      telemedicina: 'Telemedicina',
      atencion_domiciliaria: 'Atención Domiciliaria'
    };
    return labelMap[key] || key;
  };

  return (
    <>
      {/* Modal backdrop */}
      <div 
        className="modal-backdrop fade show" 
        style={{ zIndex: 1050 }}
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div 
        className="modal fade show" 
        style={{ 
          display: 'block', 
          zIndex: 1055,
          paddingLeft: '0px'
        }} 
        tabIndex={-1}
      >
        <div className="modal-dialog modal-fullscreen">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header bg-primary text-white">
              <h4 className="modal-title mb-0 text-white">
                <i className="ri-dashboard-3-line me-2"></i>
                {title}
              </h4>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
              ></button>
            </div>

            {/* Body */}
            <div className="modal-body p-4" style={{ backgroundColor: '#f8f9fa' }}>
              {!hasOrganization ? (
                <div className="text-center py-5">
                  <i className="ri-building-line display-4 text-muted mb-3"></i>
                  <h5 className="text-muted">Organización requerida</h5>
                  <p className="text-muted">Se requiere una organización activa para mostrar las estadísticas.</p>
                </div>
              ) : loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border mb-3"></div>
                  <h5 className="text-muted">Cargando estadísticas...</h5>
                  <p className="text-muted">Obteniendo datos del sistema...</p>
                </div>
              ) : statistics ? (
                <>
                  {/* Header with key metrics */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h4 className="mb-1">Dashboard de Servicios de Salud</h4>
                          <p className="text-muted mb-0">
                            Análisis completo y métricas interactivas
                          </p>
                        </div>
                        <div className="d-flex gap-2">
                          <button className="btn btn-outline-primary btn-sm">
                            <i className="ri-refresh-line me-1"></i>
                            Actualizar
                          </button>
                          <button className="btn btn-outline-info btn-sm">
                            <i className="ri-download-line me-1"></i>
                            Exportar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="row mb-4">
                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <div className="avatar-sm bg-primary-subtle rounded">
                                <div className="avatar-title text-primary">
                                  <i className="ri-service-line fs-4"></i>
                                </div>
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <p className="text-muted mb-1 fs-13">Total Servicios</p>
                              <h4 className="mb-0 text-primary">{formatNumber(statistics.total_services)}</h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <div className="avatar-sm bg-success-subtle rounded">
                                <div className="avatar-title text-success">
                                  <i className="ri-checkbox-circle-line fs-4"></i>
                                </div>
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <p className="text-muted mb-1 fs-13">Servicios Activos</p>
                              <h4 className="mb-0 text-success">
                                {formatNumber(statistics.services_by_status?.activo || 0)}
                              </h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <div className="avatar-sm bg-info-subtle rounded">
                                <div className="avatar-title text-info">
                                  <i className="ri-bar-chart-line fs-4"></i>
                                </div>
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <p className="text-muted mb-1 fs-13">Capacidad Total</p>
                              <h4 className="mb-0 text-info">{formatNumber(statistics.total_capacity)}</h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              <div className="avatar-sm bg-warning-subtle rounded">
                                <div className="avatar-title text-warning">
                                  <i className="ri-calculator-line fs-4"></i>
                                </div>
                              </div>
                            </div>
                            <div className="flex-grow-1 ms-3">
                              <p className="text-muted mb-1 fs-13">Promedio Capacidad</p>
                              <h4 className="mb-0 text-warning">
                                {statistics.average_capacity_per_service?.toFixed(1) || '0'}
                              </h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics Cards Row 1 */}
                  <div className="row mb-4">
                    {/* Services by Status */}
                    <div className="col-lg-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-header">
                          <h6 className="card-title mb-0">
                            <i className="ri-pie-chart-line me-2"></i>
                            Servicios por Estado
                          </h6>
                        </div>
                        <div className="card-body">
                          {Object.entries(statistics.services_by_status || {}).map(([status, count]) => {
                            const percentage = formatPercentage(count, statistics.total_services);
                            const statusColors: Record<string, string> = {
                              activo: 'success',
                              inactivo: 'secondary',
                              suspendido: 'danger',
                              en_proceso: 'warning'
                            };
                            const color = statusColors[status] || 'primary';
                            
                            return (
                              <div key={status} className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center">
                                  <span className={`badge bg-${color}-subtle text-${color} me-2`} style={{ minWidth: '70px' }}>
                                    {getDisplayLabel(status)}
                                  </span>
                                  <span className="text-muted small">{count} servicios</span>
                                </div>
                                <div className="text-end">
                                  <span className="text-muted small fw-medium">{percentage}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Services by Complexity */}
                    <div className="col-lg-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-header">
                          <h6 className="card-title mb-0">
                            <i className="ri-bar-chart-box-line me-2"></i>
                            Servicios por Complejidad
                          </h6>
                        </div>
                        <div className="card-body">
                          {Object.entries(statistics.services_by_complexity || {}).map(([complexity, count]) => {
                            const percentage = formatPercentage(count, statistics.total_services);
                            const complexityColors: Record<string, string> = {
                              baja: 'success',
                              media: 'warning',
                              alta: 'danger'
                            };
                            const color = complexityColors[complexity] || 'secondary';
                            
                            return (
                              <div key={complexity} className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center">
                                  <span className={`badge bg-${color}-subtle text-${color} me-2`} style={{ minWidth: '70px' }}>
                                    {getDisplayLabel(complexity)}
                                  </span>
                                  <span className="text-muted small">{count} servicios</span>
                                </div>
                                <div className="text-end">
                                  <span className="text-muted small fw-medium">{percentage}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics Cards Row 2 */}
                  <div className="row mb-4">
                    {/* Services by Modality */}
                    <div className="col-lg-8">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-header">
                          <h6 className="card-title mb-0">
                            <i className="ri-stack-line me-2"></i>
                            Servicios por Modalidad
                          </h6>
                        </div>
                        <div className="card-body">
                          {Object.entries(statistics.services_by_modality || {}).map(([modality, count]) => {
                            const percentage = formatPercentage(count, statistics.total_services);
                            const modalityColors: Record<string, string> = {
                              intramural: 'primary',
                              extramural: 'info',
                              telemedicina: 'success',
                              atencion_domiciliaria: 'warning'
                            };
                            const color = modalityColors[modality] || 'secondary';
                            
                            return (
                              <div key={modality} className="d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center">
                                  <span className={`badge bg-${color}-subtle text-${color} me-2`} style={{ minWidth: '120px' }}>
                                    {getDisplayLabel(modality)}
                                  </span>
                                  <span className="text-muted small">{count} servicios</span>
                                </div>
                                <div className="text-end">
                                  <span className="text-muted small fw-medium">{percentage}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Authorization Status */}
                    <div className="col-lg-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-header">
                          <h6 className="card-title mb-0">
                            <i className="ri-shield-check-line me-2"></i>
                            Estado de Autorizaciones
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <div className="avatar-xs bg-success-subtle rounded me-2">
                                <div className="avatar-title text-success">
                                  <i className="ri-shield-check-line fs-6"></i>
                                </div>
                              </div>
                              <div>
                                <div className="fw-medium">Con Autorización</div>
                                <small className="text-muted">
                                  {formatPercentage(statistics.services_with_authorization || 0, statistics.total_services)}
                                </small>
                              </div>
                            </div>
                            <div className="text-end">
                              <h5 className="mb-0 text-success">{formatNumber(statistics.services_with_authorization || 0)}</h5>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center">
                              <div className="avatar-xs bg-danger-subtle rounded me-2">
                                <div className="avatar-title text-danger">
                                  <i className="ri-shield-cross-line fs-6"></i>
                                </div>
                              </div>
                              <div>
                                <div className="fw-medium">Vencidas</div>
                                <small className="text-muted">
                                  {formatPercentage(statistics.expired_authorizations || 0, statistics.total_services)}
                                </small>
                              </div>
                            </div>
                            <div className="text-end">
                              <h5 className="mb-0 text-danger">{formatNumber(statistics.expired_authorizations || 0)}</h5>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <div className="avatar-xs bg-warning-subtle rounded me-2">
                                <div className="avatar-title text-warning">
                                  <i className="ri-time-line fs-6"></i>
                                </div>
                              </div>
                              <div>
                                <div className="fw-medium">Por Vencer</div>
                                <small className="text-muted">
                                  {formatPercentage(statistics.expiring_soon || 0, statistics.total_services)}
                                </small>
                              </div>
                            </div>
                            <div className="text-end">
                              <h5 className="mb-0 text-warning">{formatNumber(statistics.expiring_soon || 0)}</h5>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services by Sede */}
                  <div className="row mb-4">
                    <div className="col-lg-12">
                      <div className="card border-0 shadow-sm">
                        <div className="card-header">
                          <h6 className="card-title mb-0">
                            <i className="ri-building-line me-2"></i>
                            Distribución de Servicios por Sede
                          </h6>
                        </div>
                        <div className="card-body">
                          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {statistics.services_by_sede
                              ?.sort((a, b) => b.service_count - a.service_count)
                              ?.map((sede, index) => {
                                const percentage = formatPercentage(sede.service_count, statistics.total_services);
                                return (
                                  <div key={sede.sede_id} className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="d-flex align-items-center">
                                      <span className="badge bg-primary me-2">
                                        #{index + 1}
                                      </span>
                                      <div>
                                        <div className="fw-medium">{sede.sede_name}</div>
                                        <small className="text-muted">{sede.service_count} servicios</small>
                                      </div>
                                    </div>
                                    <div className="text-end">
                                      <span className="text-muted fw-medium">{percentage}</span>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="card bg-light border-0">
                    <div className="card-body">
                      <div className="row text-center">
                        <div className="col-md-3">
                          <div className="fw-bold text-primary fs-4">
                            {formatNumber(statistics.total_services)}
                          </div>
                          <div className="text-muted small">Total Servicios</div>
                        </div>
                        <div className="col-md-3">
                          <div className="fw-bold text-success fs-4">
                            {formatNumber(statistics.services_24_hours || 0)}
                          </div>
                          <div className="text-muted small">Servicios 24h</div>
                        </div>
                        <div className="col-md-3">
                          <div className="fw-bold text-info fs-4">
                            {formatNumber(statistics.total_capacity)}
                          </div>
                          <div className="text-muted small">Capacidad Total</div>
                        </div>
                        <div className="col-md-3">
                          <div className="fw-bold text-warning fs-4">
                            {statistics.services_by_sede?.length || 0}
                          </div>
                          <div className="text-muted small">Sedes con Servicios</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="ri-bar-chart-line display-4 text-muted mb-3"></i>
                  <h5 className="text-muted">No hay estadísticas disponibles</h5>
                  <p className="text-muted">No se pudieron cargar las estadísticas del sistema.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light">
              <div className="d-flex justify-content-between w-100">
                <div>
                  <span className="badge bg-success-subtle text-success">
                    <i className="ri-check-line me-1"></i>
                    Dashboard Funcional
                  </span>
                  {loading && (
                    <span className="badge bg-info-subtle text-info ms-2">
                      <div className="spinner-border spinner-border-sm me-1"></div>
                      Cargando...
                    </span>
                  )}
                </div>
                <div>
                  <button className="btn btn-secondary" onClick={onClose}>
                    <i className="ri-close-line me-1"></i>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SimpleDashboardModal;