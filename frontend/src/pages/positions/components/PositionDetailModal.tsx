import React from 'react';
import { Cargo, HierarchyLevel, PositionType } from '../../../types/organizationalChart';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface PositionDetailModalProps {
  show: boolean;
  onHide: () => void;
  position: Cargo | null;
  loading: boolean;
}

const PositionDetailModal: React.FC<PositionDetailModalProps> = ({
  show,
  onHide,
  position,
  loading
}) => {
  if (!position || !show) return null;

  const getHierarchyLevelLabel = (level: HierarchyLevel): string => {
    const labels: Record<HierarchyLevel, string> = {
      'BOARD': 'Junta Directiva',
      'EXECUTIVE': 'Ejecutivo',
      'SENIOR_MANAGEMENT': 'Alta Gerencia',
      'MIDDLE_MANAGEMENT': 'Gerencia Media',
      'PROFESSIONAL': 'Profesional',
      'TECHNICAL': 'Técnico',
      'AUXILIARY': 'Auxiliar',
      'OPERATIONAL': 'Operacional'
    };
    return labels[level] || level;
  };

  const getPositionTypeLabel = (type: PositionType): string => {
    const labels: Record<PositionType, string> = {
      'PERMANENT': 'Permanente',
      'TEMPORARY': 'Temporal',
      'CONTRACT': 'Contrato',
      'CONSULTANT': 'Consultor',
      'VOLUNTEER': 'Voluntario',
      'INTERN': 'Interno'
    };
    return labels[type] || type;
  };

  const getHierarchyLevelColor = (level: HierarchyLevel): string => {
    const colors: Record<HierarchyLevel, string> = {
      'BOARD': 'purple',
      'EXECUTIVE': 'primary',
      'SENIOR_MANAGEMENT': 'info',
      'MIDDLE_MANAGEMENT': 'success',
      'PROFESSIONAL': 'warning',
      'TECHNICAL': 'secondary',
      'AUXILIARY': 'light',
      'OPERATIONAL': 'dark'
    };
    return colors[level] || 'secondary';
  };

  const formatSalary = (amount?: number): string => {
    if (!amount || amount === 0) return 'No especificado';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      {/* Modal */}
      <div 
        className="modal fade show"
        style={{ display: 'block' }}
        tabIndex={-1}
        aria-hidden={false}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">Detalles del Puesto</h5>
                <div className="text-muted small">
                  {position.code} - {position.name}
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onHide}
                aria-label="Close"
              ></button>
            </div>
            
            <div className="modal-body">
              {loading ? (
                <div className="text-center py-4">
                  <LoadingSpinner />
                  <p className="mt-2">Cargando detalles...</p>
                </div>
              ) : (
                <div className="row">
                  {/* General Information */}
                  <div className="col-md-12">
                    <div className="card border-0 shadow-none bg-light">
                      <div className="card-body">
                        <h6 className="mb-3">
                          <i className="ri-information-line me-2"></i>
                          Información General
                        </h6>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <strong>Código:</strong>
                              <div>{position.code}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <strong>Nombre:</strong>
                              <div>{position.name}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <strong>Área:</strong>
                              <div>{position.area_name}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <strong>Nivel Jerárquico:</strong>
                              <div>
                                <span className={`badge bg-${getHierarchyLevelColor(position.hierarchy_level)}`}>
                                  {getHierarchyLevelLabel(position.hierarchy_level)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <strong>Tipo de Posición:</strong>
                              <div>{getPositionTypeLabel(position.position_type)}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <strong>Reporta a:</strong>
                              <div>{position.reports_to_name || 'Sin jefe directo'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Purpose and Description */}
                  <div className="col-md-12">
                    <div className="card border-0 shadow-none bg-light mt-3">
                      <div className="card-body">
                        <h6 className="mb-3">
                          <i className="ri-target-line me-2"></i>
                          Propósito Principal
                        </h6>
                        <p className="mb-0">{position.main_purpose || 'No especificado'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assigned User */}
                  <div className="col-md-12">
                    <div className="card border-0 shadow-none bg-light mt-3">
                      <div className="card-body">
                        <h6 className="mb-3">
                          <i className="ri-user-line me-2"></i>
                          Usuario Asignado
                        </h6>
                        {position.assigned_user ? (
                          <div className="row">
                            <div className="col-md-6">
                              <div className="mb-2">
                                <strong>Nombre:</strong>
                                <div>{position.assigned_user.full_name}</div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="mb-2">
                                <strong>Email:</strong>
                                <div>{position.assigned_user.email}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-3">
                            <span className="badge bg-warning fs-6 px-3 py-2">
                              <i className="ri-user-unfollow-line me-2"></i>
                              Vacante
                            </span>
                            <p className="text-muted mt-2 mb-0">No hay usuario asignado a este puesto</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Configuration and Characteristics */}
                  <div className="col-md-6">
                    <div className="card border-0 shadow-none bg-light mt-3">
                      <div className="card-body">
                        <h6 className="mb-3">
                          <i className="ri-settings-line me-2"></i>
                          Configuración
                        </h6>
                        <table className="table table-sm mb-0">
                          <tbody>
                            <tr>
                              <td><strong>Posiciones Autorizadas:</strong></td>
                              <td>{position.authorized_positions}</td>
                            </tr>
                            <tr>
                              <td><strong>Puesto Crítico:</strong></td>
                              <td>
                                {position.is_critical ? (
                                  <span className="badge bg-danger">Sí</span>
                                ) : (
                                  <span className="badge bg-secondary">No</span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Dueño de Proceso:</strong></td>
                              <td>
                                {position.is_process_owner ? (
                                  <span className="badge bg-info">Sí</span>
                                ) : (
                                  <span className="badge bg-secondary">No</span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Líder de Servicio:</strong></td>
                              <td>
                                {position.is_service_leader ? (
                                  <span className="badge bg-success">Sí</span>
                                ) : (
                                  <span className="badge bg-secondary">No</span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Requirements and Licenses */}
                  <div className="col-md-6">
                    <div className="card border-0 shadow-none bg-light mt-3">
                      <div className="card-body">
                        <h6 className="mb-3">
                          <i className="ri-award-line me-2"></i>
                          Requisitos
                        </h6>
                        <table className="table table-sm mb-0">
                          <tbody>
                            <tr>
                              <td><strong>Licencia Profesional:</strong></td>
                              <td>
                                {position.requires_professional_license ? (
                                  <span className="badge bg-warning">Requerida</span>
                                ) : (
                                  <span className="badge bg-secondary">No requerida</span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Licencia SST:</strong></td>
                              <td>
                                {position.requires_sst_license ? (
                                  <span className="badge bg-warning">Requerida</span>
                                ) : (
                                  <span className="badge bg-secondary">No requerida</span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div className="col-md-12">
                    <div className="card border-0 shadow-none bg-light mt-3">
                      <div className="card-body">
                        <h6 className="mb-3">
                          <i className="ri-money-dollar-circle-line me-2"></i>
                          Rango Salarial
                        </h6>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-2">
                              <strong>Salario Mínimo:</strong>
                              <div className="fs-5 text-success">{formatSalary(position.salary_range_min)}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-2">
                              <strong>Salario Máximo:</strong>
                              <div className="fs-5 text-success">{formatSalary(position.salary_range_max)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Position Status */}
                  <div className="col-md-12">
                    <div className="card border-0 shadow-none bg-light mt-3">
                      <div className="card-body">
                        <h6 className="mb-3">
                          <i className="ri-pulse-line me-2"></i>
                          Estado del Puesto
                        </h6>
                        <div className="d-flex gap-2">
                          {position.is_active ? (
                            <span className="badge bg-success fs-6 px-3 py-2">
                              <i className="ri-check-line me-1"></i>
                              Activo
                            </span>
                          ) : (
                            <span className="badge bg-danger fs-6 px-3 py-2">
                              <i className="ri-close-line me-1"></i>
                              Inactivo
                            </span>
                          )}
                          
                          {position.is_critical && (
                            <span className="badge bg-warning fs-6 px-3 py-2">
                              <i className="ri-alert-line me-1"></i>
                              Crítico
                            </span>
                          )}
                          
                          {!position.assigned_user && (
                            <span className="badge bg-info fs-6 px-3 py-2">
                              <i className="ri-user-unfollow-line me-1"></i>
                              Vacante
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="col-md-12">
                    <div className="card border-0 shadow-none bg-light mt-3">
                      <div className="card-body">
                        <h6 className="mb-3">
                          <i className="ri-calendar-line me-2"></i>
                          Información de Fechas
                        </h6>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-2">
                              <strong>Creado:</strong>
                              <div>{new Date(position.created_at).toLocaleDateString('es-CO')}</div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-2">
                              <strong>Actualizado:</strong>
                              <div>{new Date(position.updated_at).toLocaleDateString('es-CO')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onHide}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal backdrop */}
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default PositionDetailModal;