/**
 * Service Delete Modal Component (Professional Velzon Style)
 *
 * Modal for confirming service deletion with impact assessment,
 * following Velzon design patterns and the existing DeleteModal structure.
 */
import React from 'react';
import { useBootstrapTooltips } from '../../../../../../hooks/useBootstrapTooltips';
import type { SedeHealthService } from '../../../../../../types/servicios';

// ====================================
// INTERFACES
// ====================================

interface ServiceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  servicio?: SedeHealthService | null;
  isLoading?: boolean;
  title?: string;
  message?: string;
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

const getModalityLabel = (modality: string | undefined | null): string => {
  if (!modality) return "N/A";
  
  const modalities: Record<string, string> = {
    'intramural': 'Intramural',
    'extramural': 'Extramural',
    'telemedicina': 'Telemedicina',
    'atencion_domiciliaria': 'Atención Domiciliaria',
  };
  return modalities[modality] || modality;
};

const getComplexityLabel = (complexity: string | undefined | null): string => {
  if (!complexity) return "N/A";
  
  const complexities: Record<string, string> = {
    'baja': 'Baja Complejidad',
    'media': 'Mediana Complejidad',
    'alta': 'Alta Complejidad',
    'no_aplica': 'No Aplica',
  };
  return complexities[complexity] || complexity;
};

const getStatusLabel = (status: string | undefined | null): string => {
  if (!status) return "N/A";
  
  const statuses: Record<string, string> = {
    'activo': 'Activo',
    'inactivo': 'Inactivo',
    'suspendido': 'Suspendido',
    'en_proceso': 'En Proceso',
  };
  return statuses[status] || status;
};

// ====================================
// MAIN COMPONENT
// ====================================

const ServiceDeleteModal: React.FC<ServiceDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  servicio,
  isLoading = false,
  title = "Confirmar Eliminación",
  message = "¿Está seguro de que desea eliminar este servicio de salud?",
}) => {
  // Bootstrap tooltips hook
  useBootstrapTooltips([], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 200, hide: 100 },
    animation: true
  });

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  // ====================================
  // RENDER HELPERS
  // ====================================

  const renderServiceInfo = () => {
    if (!servicio) return null;

    return (
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
        <div className="card-header bg-danger bg-gradient text-white border-0" style={{ borderRadius: '12px 12px 0 0' }}>
          <h6 className="card-title mb-0 fw-bold d-flex align-items-center">
            <div className="icon-wrapper me-2" style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="ri-service-line fs-14" aria-hidden="true"></i>
            </div>
            Información del Servicio a Eliminar
          </h6>
        </div>
        <div className="card-body" style={{ padding: '1.5rem' }}>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>
                  Código del Servicio
                </label>
                <div className="fw-bold text-primary" style={{ fontSize: '1.1rem' }}>
                  <i className="ri-qr-code-line me-2" aria-hidden="true"></i>
                  {servicio.service_code}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>
                  Nombre del Servicio
                </label>
                <div className="fw-semibold text-dark" style={{ fontSize: '1rem' }}>
                  {servicio.service_name}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>
                  Sede
                </label>
                <div className="d-flex align-items-center">
                  <i className="ri-building-line me-2 text-info" aria-hidden="true"></i>
                  <div>
                    <div className="fw-medium">{servicio.sede_name}</div>
                    <small className="text-muted">{servicio.sede_reps_code}</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>
                  Categoría
                </label>
                <div className="fw-medium text-secondary">
                  {servicio.service_category}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>
                  Modalidad
                </label>
                <div>
                  <span className="badge bg-info-subtle text-info fs-13 fw-medium px-2 py-1">
                    {getModalityLabel(servicio.modality)}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>
                  Complejidad
                </label>
                <div>
                  <span className="badge bg-warning-subtle text-warning fs-13 fw-medium px-2 py-1">
                    {getComplexityLabel(servicio.complexity)}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>
                  Estado
                </label>
                <div>
                  <span className="badge bg-success-subtle text-success fs-13 fw-medium px-2 py-1">
                    {getStatusLabel(servicio.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>
                  Capacidad
                </label>
                <div className="d-flex align-items-center">
                  <i className="ri-group-line me-2 text-primary" aria-hidden="true"></i>
                  <span className="fw-bold text-primary">{servicio.capacity || 0}</span>
                  <small className="text-muted ms-1">pacientes</small>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>
                  Atención 24 Horas
                </label>
                <div>
                  <span className={`badge ${servicio.is_24_hours ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} fs-13 fw-medium px-2 py-1`}>
                    <i className={`${servicio.is_24_hours ? 'ri-check-line' : 'ri-close-line'} me-1`} aria-hidden="true"></i>
                    {servicio.is_24_hours ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderImpactAssessment = () => {
    if (!servicio) return null;

    const hasStaffInfo = servicio.medical_staff_count || servicio.nursing_staff_count || servicio.technical_staff_count;
    const hasEquipment = servicio.equipment_list && servicio.equipment_list.length > 0;
    const hasAuthorization = servicio.authorization_date || servicio.authorization_resolution;

    return (
      <div className="alert alert-warning border-0" style={{ borderRadius: '12px' }}>
        <div className="d-flex align-items-start">
          <i className="ri-alert-line me-3 mt-1 fs-18" aria-hidden="true"></i>
          <div className="flex-grow-1">
            <h6 className="alert-heading fw-bold mb-3">
              Evaluación de Impacto de la Eliminación
            </h6>
            
            <div className="row">
              <div className="col-md-6">
                <div className="mb-2">
                  <strong className="text-warning">Afectará directamente:</strong>
                  <ul className="list-unstyled mt-2 ms-3">
                    <li>
                      <i className="ri-user-line me-2 text-info" aria-hidden="true"></i>
                      Capacidad de atención: <strong>{servicio.capacity || 0} pacientes</strong>
                    </li>
                    {hasStaffInfo && (
                      <li>
                        <i className="ri-team-line me-2 text-info" aria-hidden="true"></i>
                        Personal asignado al servicio
                      </li>
                    )}
                    {hasEquipment && (
                      <li>
                        <i className="ri-tools-line me-2 text-info" aria-hidden="true"></i>
                        Equipos registrados: <strong>{servicio.equipment_list!.length}</strong>
                      </li>
                    )}
                    {hasAuthorization && (
                      <li>
                        <i className="ri-shield-check-line me-2 text-warning" aria-hidden="true"></i>
                        Información de autorización y habilitación
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="mb-2">
                  <strong className="text-danger">Consecuencias:</strong>
                  <ul className="list-unstyled mt-2 ms-3">
                    <li>
                      <i className="ri-close-circle-line me-2 text-danger" aria-hidden="true"></i>
                      Pérdida permanente de datos del servicio
                    </li>
                    <li>
                      <i className="ri-history-line me-2 text-danger" aria-hidden="true"></i>
                      Eliminación del historial de registros
                    </li>
                    <li>
                      <i className="ri-bar-chart-line me-2 text-danger" aria-hidden="true"></i>
                      Impacto en estadísticas de la sede
                    </li>
                    <li>
                      <i className="ri-file-text-line me-2 text-danger" aria-hidden="true"></i>
                      Necesidad de re-registrar si se requiere nuevamente
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-3 p-3 bg-danger-subtle rounded-3">
              <div className="d-flex align-items-center text-danger">
                <i className="ri-error-warning-line me-2 fs-16" aria-hidden="true"></i>
                <strong>Esta acción no se puede deshacer</strong>
              </div>
              <small className="text-dark mt-1 d-block">
                Una vez eliminado el servicio, todos los datos asociados se perderán permanentemente.
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ====================================
  // MAIN RENDER
  // ====================================

  return (
    <div 
      className="modal fade show" 
      style={{ 
        display: 'block', 
        zIndex: 1055,
        backgroundColor: 'rgba(0,0,0,0.5)' 
      }} 
      tabIndex={-1} 
      role="dialog" 
      aria-hidden="false"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="modal-dialog modal-lg" 
        role="document"
        style={{ 
          margin: '1.75rem auto',
          maxWidth: '800px',
          position: 'relative',
          zIndex: 1056
        }}
      >
        <div className="modal-content" style={{ position: 'relative', zIndex: 1057, borderRadius: '16px', overflow: 'hidden' }}>
          <div 
            className="modal-header border-0 text-white position-relative"
            style={{ 
              background: 'linear-gradient(135deg, #f06548 0%, #d63384 100%)',
              padding: '2rem 2rem 1.5rem 2rem'
            }}
          >
            <div className="d-flex align-items-center flex-grow-1">
              <div 
                className="icon-wrapper me-3"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="ri-delete-bin-line fs-24" aria-hidden="true"></i>
              </div>
              <div>
                <h4 className="modal-title mb-1 fw-bold text-white">
                  {title}
                </h4>
                <p className="mb-0 text-white-50 fw-medium">
                  Eliminación de Servicio de Salud
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Cerrar modal"
              disabled={isLoading}
              style={{ fontSize: '1.2rem' }}
            ></button>
            
            {/* Decorative background elements */}
            <div 
              className="position-absolute"
              style={{
                top: '20px',
                right: '80px',
                opacity: '0.1',
                fontSize: '6rem',
                transform: 'rotate(-15deg)'
              }}
            >
              <i className="ri-alert-line" aria-hidden="true"></i>
            </div>
          </div>

          <div className="modal-body" style={{ padding: '1.5rem 2rem' }}>
            <div className="container-fluid">
              {/* Warning Message */}
              <div className="alert alert-danger border-0 mb-4" style={{ borderRadius: '12px' }}>
                <div className="d-flex align-items-center">
                  <i className="ri-error-warning-fill me-3 fs-24" aria-hidden="true"></i>
                  <div>
                    <h6 className="alert-heading fw-bold mb-2">
                      ¡Atención! Acción irreversible
                    </h6>
                    <p className="mb-0 fw-medium">
                      {message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Information */}
              {renderServiceInfo()}

              {/* Impact Assessment */}
              {renderImpactAssessment()}
            </div>
          </div>

          <div className="modal-footer bg-light border-0" style={{ padding: '1.5rem 2rem' }}>
            <div className="d-flex justify-content-between w-100 align-items-center">
              <div>
                <small className="text-muted fw-medium">
                  <i className="ri-information-line me-1" aria-hidden="true"></i>
                  Esta acción eliminará permanentemente el servicio
                </small>
              </div>
              
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary fw-semibold"
                  onClick={onClose}
                  disabled={isLoading}
                  style={{ borderRadius: '10px', padding: '0.75rem 1.5rem' }}
                >
                  <i className="ri-close-line me-2 fs-16" aria-hidden="true"></i>
                  Cancelar
                </button>
                
                <button
                  type="button"
                  className="btn btn-danger fw-bold"
                  onClick={onConfirm}
                  disabled={isLoading}
                  style={{ borderRadius: '10px', padding: '0.75rem 2rem' }}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Eliminando...</span>
                      </span>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <i className="ri-delete-bin-fill me-2 fs-16" aria-hidden="true"></i>
                      Sí, Eliminar Servicio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDeleteModal;