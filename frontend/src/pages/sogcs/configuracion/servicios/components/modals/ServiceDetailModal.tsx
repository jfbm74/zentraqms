/**
 * Service Detail Modal Component (Professional Velzon Style)
 *
 * Modal for displaying comprehensive health service information in a read-only,
 * organized layout using Velzon design patterns following SedeDetailModal.
 */
import React, { useEffect, useState } from "react";
import { useServicioStore } from "../../../../../../stores/servicioStore";
import { useBootstrapTooltips } from "../../../../../../hooks/useBootstrapTooltips";
import InfoTooltip from "../../../../../../components/common/InfoTooltip";
import type { SedeHealthService } from "../../../../../../types/servicios";

// ====================================
// INTERFACES
// ====================================

interface ServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicioId: string | null;
  isLoading?: boolean;
  onEdit?: (servicio: SedeHealthService) => void;
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const formatDateTime = (dateTimeString?: string): string => {
  if (!dateTimeString) return "N/A";
  try {
    return new Date(dateTimeString).toLocaleString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

const getStatusBadge = (status: string | undefined | null, type: 'service' | 'authorization'): JSX.Element => {
  let badgeClass = "badge fs-14 fw-semibold px-3 py-2";
  let icon = "";
  
  if (!status) {
    badgeClass += " bg-light text-muted";
    icon = "ri-question-line";
    return (
      <span className={badgeClass}>
        <i className={`${icon} me-1`} aria-hidden="true"></i>
        N/A
      </span>
    );
  }
  
  switch (type) {
    case 'service':
      switch (status) {
        case 'activo':
          badgeClass += " bg-success-subtle text-success";
          icon = "ri-check-line";
          break;
        case 'inactivo':
          badgeClass += " bg-secondary-subtle text-secondary";
          icon = "ri-pause-line";
          break;
        case 'suspendido':
          badgeClass += " bg-danger-subtle text-danger";
          icon = "ri-close-line";
          break;
        case 'en_proceso':
          badgeClass += " bg-warning-subtle text-warning";
          icon = "ri-time-line";
          break;
        default:
          badgeClass += " bg-light text-muted";
          icon = "ri-question-line";
      }
      break;
    
    case 'authorization':
      switch (status) {
        case 'vigente':
          badgeClass += " bg-success-subtle text-success";
          icon = "ri-check-line";
          break;
        case 'vencida':
          badgeClass += " bg-danger-subtle text-danger";
          icon = "ri-error-warning-line";
          break;
        case 'proxima_vencer':
          badgeClass += " bg-warning-subtle text-warning";
          icon = "ri-alarm-warning-line";
          break;
        default:
          badgeClass += " bg-light text-muted";
          icon = "ri-question-line";
      }
      break;
  }
  
  return (
    <span className={badgeClass}>
      <i className={`${icon} me-1`} aria-hidden="true"></i>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
};

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

const getComplexityBadgeClass = (complexity: string | undefined | null): string => {
  switch (complexity) {
    case 'baja':
      return 'bg-success-subtle text-success';
    case 'media':
      return 'bg-warning-subtle text-warning';
    case 'alta':
      return 'bg-danger-subtle text-danger';
    default:
      return 'bg-info-subtle text-info';
  }
};

// ====================================
// MAIN COMPONENT
// ====================================

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  isOpen,
  onClose,
  servicioId,
  isLoading = false,
  onEdit,
}) => {
  // Bootstrap tooltips hook
  useBootstrapTooltips([], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 200, hide: 100 },
    animation: true
  });

  // Store and state
  const { currentServicio, loading, error, fetchServicioDetail } = useServicioStore();
  const [servicio, setServicio] = useState<SedeHealthService | null>(null);

  // Fetch servicio detail when modal opens
  useEffect(() => {
    if (isOpen && servicioId && servicioId !== servicio?.id) {
      fetchServicioDetail(servicioId).then(setServicio).catch(() => {
        // Error handling is managed by the store
      });
    }
  }, [isOpen, servicioId, fetchServicioDetail, servicio?.id]);

  // Update local state when store data changes
  useEffect(() => {
    if (currentServicio && currentServicio.id === servicioId) {
      setServicio(currentServicio);
    }
  }, [currentServicio, servicioId]);

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  const isLoadingData = isLoading || loading;
  const displayError = error;

  // ====================================
  // RENDER HELPERS
  // ====================================

  const renderLoadingState = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted">Cargando información del servicio...</p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="alert alert-danger" role="alert">
      <div className="d-flex align-items-center">
        <i className="ri-error-warning-line me-2 fs-18" aria-hidden="true"></i>
        <div>
          <strong>Error al cargar los datos</strong>
          <div className="mt-1">{displayError}</div>
        </div>
      </div>
    </div>
  );

  const renderInfoCard = (title: string, icon: string, children: React.ReactNode, headerColor: string = "primary") => (
    <div className="card border-0 shadow-lg mb-3" style={{ borderRadius: '10px', overflow: 'hidden', minHeight: 'auto' }}>
      <div 
        className={`card-header border-0 bg-${headerColor} bg-gradient text-white position-relative`}
        style={{ 
          background: `linear-gradient(135deg, var(--bs-${headerColor}) 0%, var(--bs-${headerColor}-dark, var(--bs-${headerColor})) 100%)`,
          padding: '0.75rem 1rem'
        }}
      >
        <h6 className="card-title mb-0 fw-bold d-flex align-items-center text-white">
          <div className="icon-wrapper me-2" style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className={`${icon} fs-14`} aria-hidden="true"></i>
          </div>
          <span style={{ fontSize: '0.95rem' }}>{title}</span>
        </h6>
        <div 
          className="position-absolute"
          style={{
            top: '50%',
            right: '1rem',
            transform: 'translateY(-50%)',
            opacity: '0.1',
            fontSize: '1.8rem'
          }}
        >
          <i className={icon} aria-hidden="true"></i>
        </div>
      </div>
      <div className="card-body" style={{ padding: '0.75rem' }}>
        {children}
      </div>
    </div>
  );

  const renderDataField = (label: string, value: any, tooltip?: string, className: string = "col-md-6") => (
    <div className={className}>
      <div className="mb-2">
        <label className="form-label text-muted fw-semibold d-flex align-items-center mb-1" style={{ fontSize: '0.8rem' }}>
          {label}
          {tooltip && (
            <InfoTooltip
              content={tooltip}
              placement="top"
              ariaLabel={`Información sobre ${label}`}
            />
          )}
        </label>
        <div className="fw-medium" style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
          {value || <span className="text-muted fst-italic">No especificado</span>}
        </div>
      </div>
    </div>
  );

  // ====================================
  // CONTENT SECTIONS
  // ====================================

  const renderGeneralInformation = () => {
    if (!servicio) return null;

    return renderInfoCard(
      "Información General",
      "ri-service-line",
      <div className="row">
        {renderDataField("Código del Servicio", 
          <div className="d-flex align-items-center">
            <span className="badge bg-primary text-white fs-15 fw-bold px-4 py-2 me-2" style={{ borderRadius: '8px' }}>
              <i className="ri-qr-code-line me-2" aria-hidden="true"></i>
              {servicio.service_code || "N/A"}
            </span>
            <small className="text-muted">Código único</small>
          </div>,
          "Código único del servicio en el catálogo"
        )}
        
        {renderDataField("Nombre del Servicio", 
          <div className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>
            {servicio.service_name}
          </div>
        )}
        
        {renderDataField("Categoría", 
          <div className="fw-semibold text-secondary" style={{ fontSize: '1rem' }}>
            {servicio.service_category}
          </div>
        )}
        
        {renderDataField("Modalidad", 
          servicio.modality ? (
            <span className="badge bg-info text-white fs-14 fw-semibold px-3 py-2" style={{ borderRadius: '6px' }}>
              <i className="ri-global-line me-1" aria-hidden="true"></i>
              {getModalityLabel(servicio.modality)}
            </span>
          ) : (
            <span className="text-muted fst-italic">No especificado</span>
          )
        )}
        
        {renderDataField("Complejidad", 
          servicio.complexity ? (
            <span className={`badge ${getComplexityBadgeClass(servicio.complexity)} fs-14 fw-semibold px-3 py-2`} style={{ borderRadius: '6px' }}>
              <i className="ri-line-chart-line me-1" aria-hidden="true"></i>
              {getComplexityLabel(servicio.complexity)}
            </span>
          ) : (
            <span className="text-muted fst-italic">No especificado</span>
          )
        )}
        
        {renderDataField("Atención 24 Horas", 
          servicio.is_24_hours ? (
            <span className="badge bg-warning text-dark fs-14 fw-semibold px-3 py-2" style={{ borderRadius: '6px' }}>
              <i className="ri-time-fill me-1" aria-hidden="true"></i>
              Disponible 24/7
            </span>
          ) : (
            <span className="badge bg-light text-dark fs-14 fw-medium px-3 py-2" style={{ borderRadius: '6px' }}>
              <i className="ri-time-line me-1" aria-hidden="true"></i>
              Horario Regular
            </span>
          )
        )}
      </div>,
      "primary"
    );
  };

  const renderSedeInformation = () => {
    if (!servicio) return null;

    return renderInfoCard(
      "Información de la Sede",
      "ri-building-line",
      <div className="row">
        {renderDataField("Nombre de la Sede", 
          <div className="d-flex align-items-center">
            <i className="ri-building-2-line me-2 text-primary" aria-hidden="true"></i>
            <span className="fw-semibold text-primary" style={{ fontSize: '1.1rem' }}>{servicio.sede_name}</span>
          </div>,
          "", "col-md-12"
        )}
        
        {renderDataField("Código REPS", 
          <div className="d-flex align-items-center">
            <span className="badge bg-info text-white fs-15 fw-bold px-4 py-2" style={{ borderRadius: '8px' }}>
              <i className="ri-shield-check-line me-2" aria-hidden="true"></i>
              {servicio.sede_reps_code || "N/A"}
            </span>
            <small className="text-muted ms-2">Código REPS de la sede</small>
          </div>,
          "Código REPS de la sede donde se presta el servicio", "col-md-12"
        )}
      </div>,
      "info"
    );
  };

  const renderCapacityInformation = () => {
    if (!servicio) return null;

    return renderInfoCard(
      "Capacidad y Estado",
      "ri-settings-line",
      <div className="row">
        {renderDataField("Capacidad Instalada", 
          <div className="text-center p-3 rounded-3 bg-primary-subtle d-flex flex-column justify-content-center" style={{ minHeight: '80px' }}>
            <i className="ri-group-line text-primary fs-24 mb-2" aria-hidden="true"></i>
            <div className="fw-bold text-dark fs-20">{servicio.capacity || 0}</div>
            <div className="text-muted small">Pacientes simultáneos</div>
          </div>,
          "Capacidad máxima de atención simultánea", "col-md-6"
        )}
        
        {renderDataField("Estado del Servicio", 
          <div className="d-flex align-items-center justify-content-center">
            {getStatusBadge(servicio.status, 'service')}
            {servicio.is_active && (
              <div className="ms-2">
                <div className="spinner-grow text-success" style={{ width: '0.5rem', height: '0.5rem' }} role="status">
                  <span className="visually-hidden">Activo</span>
                </div>
              </div>
            )}
          </div>,
          "Estado actual del servicio de salud", "col-md-6"
        )}
        
        {servicio.distinctive_feature && renderDataField(
          "Distintivo/Característica", 
          <div className="p-2 rounded-3 bg-light">
            <i className="ri-star-line me-2 text-warning" aria-hidden="true"></i>
            <span className="fw-medium">{servicio.distinctive_feature}</span>
          </div>,
          "Características distintivas del servicio", "col-md-12"
        )}
      </div>,
      "success"
    );
  };

  const renderAuthorizationInformation = () => {
    if (!servicio) return null;

    const hasAuthInfo = servicio.authorization_date || servicio.authorization_resolution || servicio.expiration_date;
    if (!hasAuthInfo) return null;

    const isExpiringSoon = servicio.expiration_date && 
      new Date(servicio.expiration_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const isExpired = servicio.expiration_date && 
      new Date(servicio.expiration_date) <= new Date();

    return renderInfoCard(
      "Autorización y Habilitación",
      "ri-shield-check-line",
      <div className="row">
        {servicio.authorization_date && renderDataField(
          "Fecha de Autorización", 
          <div className="d-flex align-items-center">
            <i className="ri-calendar-check-fill me-2 text-success" aria-hidden="true"></i>
            <span className="fw-semibold">{formatDate(servicio.authorization_date)}</span>
          </div>
        )}
        
        {servicio.expiration_date && renderDataField(
          "Fecha de Vencimiento", 
          <div className="d-flex align-items-center">
            <div className={`d-flex align-items-center ${isExpired ? 'text-danger' : isExpiringSoon ? 'text-warning' : 'text-info'}`}>
              <i className={`${isExpired ? 'ri-error-warning-fill' : isExpiringSoon ? 'ri-alarm-warning-fill' : 'ri-calendar-event-fill'} me-2 fs-16`} aria-hidden="true"></i>
              <span className="fw-semibold">{formatDate(servicio.expiration_date)}</span>
              {isExpired && (
                <span className="badge bg-danger text-white ms-2 fs-12 fw-bold" style={{ borderRadius: '4px' }}>
                  ¡Vencida!
                </span>
              )}
              {isExpiringSoon && !isExpired && (
                <span className="badge bg-warning text-dark ms-2 fs-12 fw-bold" style={{ borderRadius: '4px' }}>
                  ¡Próxima a vencer!
                </span>
              )}
            </div>
          </div>
        )}
        
        {servicio.authorization_resolution && renderDataField(
          "Resolución de Autorización", 
          <div className="d-flex align-items-center">
            <span className="badge bg-warning text-dark fs-13 fw-bold px-3 py-2" style={{ borderRadius: '6px' }}>
              <i className="ri-file-text-fill me-1" aria-hidden="true"></i>
              {servicio.authorization_resolution}
            </span>
          </div>,
          "Número de resolución que autoriza el servicio", "col-md-12"
        )}
      </div>,
      "warning"
    );
  };

  const renderStaffInformation = () => {
    if (!servicio) return null;

    const hasStaffInfo = servicio.medical_staff_count || servicio.nursing_staff_count || servicio.technical_staff_count;
    if (!hasStaffInfo) return null;

    return renderInfoCard(
      "Información de Personal",
      "ri-team-line",
      <div className="row g-2">
        {servicio.medical_staff_count && (
          <div className="col-4">
            <div className="text-center p-2 rounded-3 bg-primary-subtle d-flex flex-column justify-content-center" style={{ minHeight: '70px' }}>
              <i className="ri-user-heart-line text-primary fs-18 mb-1" aria-hidden="true"></i>
              <div className="fw-bold text-dark fs-16">{servicio.medical_staff_count}</div>
              <div className="text-muted small">Médicos</div>
            </div>
          </div>
        )}
        
        {servicio.nursing_staff_count && (
          <div className="col-4">
            <div className="text-center p-2 rounded-3 bg-success-subtle d-flex flex-column justify-content-center" style={{ minHeight: '70px' }}>
              <i className="ri-nurse-line text-success fs-18 mb-1" aria-hidden="true"></i>
              <div className="fw-bold text-dark fs-16">{servicio.nursing_staff_count}</div>
              <div className="text-muted small">Enfermería</div>
            </div>
          </div>
        )}
        
        {servicio.technical_staff_count && (
          <div className="col-4">
            <div className="text-center p-2 rounded-3 bg-info-subtle d-flex flex-column justify-content-center" style={{ minHeight: '70px' }}>
              <i className="ri-tools-line text-info fs-18 mb-1" aria-hidden="true"></i>
              <div className="fw-bold text-dark fs-16">{servicio.technical_staff_count}</div>
              <div className="text-muted small">Técnicos</div>
            </div>
          </div>
        )}
      </div>,
      "secondary"
    );
  };

  const renderEquipmentInformation = () => {
    if (!servicio || !servicio.equipment_list || servicio.equipment_list.length === 0) return null;

    return renderInfoCard(
      "Equipos Disponibles",
      "ri-tools-line",
      <div>
        <div className="d-flex flex-wrap gap-2">
          {servicio.equipment_list.map((equipment, index) => (
            <span key={index} className="badge bg-light text-dark fs-13 fw-medium px-3 py-2" style={{ borderRadius: '8px' }}>
              <i className="ri-tools-fill me-1 text-secondary" aria-hidden="true"></i>
              {equipment}
            </span>
          ))}
        </div>
        <div className="mt-3 alert alert-info border-0" style={{ borderRadius: '10px' }}>
          <div className="d-flex align-items-center">
            <i className="ri-information-line me-2 fs-16" aria-hidden="true"></i>
            <small className="fw-semibold">
              Total de equipos registrados: {servicio.equipment_list.length}
            </small>
          </div>
        </div>
      </div>,
      "dark"
    );
  };

  const renderAdditionalInformation = () => {
    if (!servicio) return null;

    const hasAdditionalInfo = servicio.special_requirements || servicio.observation;
    if (!hasAdditionalInfo) return null;

    return renderInfoCard(
      "Información Adicional",
      "ri-file-text-line",
      <div className="row">
        {servicio.special_requirements && renderDataField(
          "Requisitos Especiales", 
          <div className="border rounded-3 p-3" style={{ backgroundColor: 'var(--bs-warning-bg-subtle)' }}>
            <div className="d-flex align-items-center mb-2">
              <i className="ri-shield-check-fill me-2 text-warning" aria-hidden="true"></i>
              <span className="fw-semibold text-dark">Requisitos Especiales</span>
            </div>
            <div className="fw-medium text-dark small">
              {servicio.special_requirements}
            </div>
          </div>, 
          "Requisitos especiales para la prestación del servicio",
          "col-md-12"
        )}
        
        {servicio.observation && renderDataField(
          "Observaciones", 
          <div className="border rounded-3 p-3" style={{ backgroundColor: 'var(--bs-info-bg-subtle)' }}>
            <div className="d-flex align-items-center mb-2">
              <i className="ri-sticky-note-fill me-2 text-info" aria-hidden="true"></i>
              <span className="fw-semibold text-dark">Observaciones</span>
            </div>
            <div className="fw-medium text-dark small">
              {servicio.observation}
            </div>
          </div>, 
          "Observaciones adicionales sobre el servicio",
          "col-md-12"
        )}
        
        <div className="col-12">
          <div className="border rounded-3 p-3 mt-3" style={{ backgroundColor: 'var(--bs-secondary-bg-subtle)' }}>
            <h6 className="fw-bold mb-3 text-dark">
              <i className="ri-history-line me-2 text-secondary" aria-hidden="true"></i>
              Información del Registro
            </h6>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-2">
                  <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>Fecha de Creación</label>
                  <div className="fw-medium">
                    <i className="ri-calendar-check-line me-1 text-success" aria-hidden="true"></i>
                    {formatDateTime(servicio.created_at)}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-2">
                  <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>Última Actualización</label>
                  <div className="fw-medium">
                    <i className="ri-edit-line me-1 text-info" aria-hidden="true"></i>
                    {formatDateTime(servicio.updated_at)}
                  </div>
                </div>
              </div>
              
              {servicio.imported_from_file && (
                <div className="col-12">
                  <div className="mt-2">
                    <span className="badge bg-info text-white fs-13 fw-semibold px-3 py-2" style={{ borderRadius: '6px' }}>
                      <i className="ri-upload-cloud-line me-1" aria-hidden="true"></i>
                      Importado desde archivo
                    </span>
                    {servicio.import_date && (
                      <small className="text-muted ms-2">
                        el {formatDate(servicio.import_date)}
                      </small>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>,
      "secondary"
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
        className="modal-dialog modal-xl" 
        role="document"
        style={{ 
          margin: '1.75rem auto',
          maxWidth: '1140px',
          position: 'relative',
          zIndex: 1056
        }}
      >
        <div className="modal-content" style={{ position: 'relative', zIndex: 1057, borderRadius: '16px', overflow: 'hidden' }}>
          <div 
            className="modal-header border-0 text-white position-relative"
            style={{ 
              background: 'linear-gradient(135deg, #405189 0%, #2d3c6b 100%)',
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
                <i className="ri-service-line fs-24" aria-hidden="true"></i>
              </div>
              <div>
                <h4 className="modal-title mb-1 fw-bold text-white">
                  Detalles del Servicio de Salud
                </h4>
                {servicio && (
                  <div className="d-flex align-items-center">
                    <span className="badge bg-white text-primary fs-13 fw-bold px-3 py-2 me-2" style={{ borderRadius: '8px' }}>
                      <i className="ri-qr-code-line me-1" aria-hidden="true"></i>
                      {servicio.service_code}
                    </span>
                    <span className="text-white-50 fw-medium">
                      {getModalityLabel(servicio.modality)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Cerrar modal"
              disabled={isLoadingData}
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
              <i className="ri-stethoscope-line" aria-hidden="true"></i>
            </div>
          </div>

          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.25rem' }}>
            {isLoadingData && renderLoadingState()}
            {displayError && !isLoadingData && renderErrorState()}
            
            {!isLoadingData && !displayError && servicio && (
              <div className="container-fluid">
                <div className="row g-3">
                  <div className="col-md-6 d-flex flex-column">
                    {renderGeneralInformation()}
                    {renderSedeInformation()}
                    {renderCapacityInformation()}
                    {renderStaffInformation()}
                  </div>
                  <div className="col-md-6 d-flex flex-column">
                    {renderAuthorizationInformation()}
                    {renderEquipmentInformation()}
                    {renderAdditionalInformation()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer bg-light border-0" style={{ padding: '1.5rem 2rem' }}>
            <div className="d-flex justify-content-between w-100 align-items-center">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary fw-semibold"
                  title="Imprimir información"
                  onClick={() => window.print()}
                  style={{ borderRadius: '10px', padding: '0.75rem 1.5rem' }}
                >
                  <i className="ri-printer-line me-2 fs-16" aria-hidden="true"></i>
                  Imprimir
                </button>
              </div>
              
              <div className="d-flex gap-3">
                {servicio && onEdit && (
                  <button
                    type="button"
                    className="btn btn-success fw-bold"
                    onClick={() => {
                      onEdit(servicio);
                      onClose();
                    }}
                    style={{ borderRadius: '10px', padding: '0.75rem 2rem' }}
                  >
                    <i className="ri-edit-2-fill me-2 fs-16" aria-hidden="true"></i>
                    Editar Servicio
                  </button>
                )}
                
                <button
                  type="button"
                  className="btn btn-outline-primary fw-semibold"
                  onClick={onClose}
                  style={{ borderRadius: '10px', padding: '0.75rem 2rem' }}
                >
                  <i className="ri-close-line me-2 fs-16" aria-hidden="true"></i>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailModal;