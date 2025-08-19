/**
 * Sede Detail Modal Component (Professional Velzon Style)
 *
 * Modal for displaying comprehensive sede prestadora information in a read-only,
 * organized layout using Velzon design patterns and Bootstrap components.
 */
import React, { useEffect, useState } from "react";
import { useSedeStore } from "../../stores/sedeStore";
import { useBootstrapTooltips } from "../../hooks/useBootstrapTooltips";
import InfoTooltip from "../common/InfoTooltip";
import type { SedePrestadora } from "../../types/sede.types";

// ====================================
// INTERFACES
// ====================================

interface SedeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sedeId: string | null;
  isLoading?: boolean;
  onEdit?: (sede: SedePrestadora) => void;
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

const getStatusBadge = (status: string | undefined | null, type: 'habilitation' | 'operational' | 'sync'): JSX.Element => {
  let badgeClass = "badge fs-14 fw-semibold px-3 py-2";
  let icon = "";
  
  // Handle null/undefined status
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
    case 'habilitation':
      switch (status) {
        case 'habilitada':
          badgeClass += " bg-success-subtle text-success";
          icon = "ri-check-line";
          break;
        case 'en_proceso':
          badgeClass += " bg-warning-subtle text-warning";
          icon = "ri-time-line";
          break;
        case 'suspendida':
          badgeClass += " bg-danger-subtle text-danger";
          icon = "ri-pause-line";
          break;
        case 'cancelada':
          badgeClass += " bg-secondary-subtle text-secondary";
          icon = "ri-close-line";
          break;
        case 'vencida':
          badgeClass += " bg-dark-subtle text-dark";
          icon = "ri-calendar-check-line";
          break;
        default:
          badgeClass += " bg-light text-muted";
          icon = "ri-question-line";
      }
      break;
    
    case 'operational':
      switch (status) {
        case 'activa':
          badgeClass += " bg-success-subtle text-success";
          icon = "ri-play-circle-line";
          break;
        case 'inactiva':
          badgeClass += " bg-secondary-subtle text-secondary";
          icon = "ri-pause-circle-line";
          break;
        case 'temporal_cerrada':
          badgeClass += " bg-warning-subtle text-warning";
          icon = "ri-door-lock-line";
          break;
        case 'permanente_cerrada':
          badgeClass += " bg-danger-subtle text-danger";
          icon = "ri-door-close-line";
          break;
        case 'en_construccion':
          badgeClass += " bg-info-subtle text-info";
          icon = "ri-hammer-line";
          break;
        default:
          badgeClass += " bg-light text-muted";
          icon = "ri-question-line";
      }
      break;
    
    case 'sync':
      switch (status) {
        case 'success':
          badgeClass += " bg-success-subtle text-success";
          icon = "ri-check-line";
          break;
        case 'pending':
          badgeClass += " bg-warning-subtle text-warning";
          icon = "ri-time-line";
          break;
        case 'in_progress':
          badgeClass += " bg-info-subtle text-info";
          icon = "ri-loader-4-line";
          break;
        case 'failed':
          badgeClass += " bg-danger-subtle text-danger";
          icon = "ri-error-warning-line";
          break;
        case 'partial':
          badgeClass += " bg-secondary-subtle text-secondary";
          icon = "ri-information-line";
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

const getSedeTypeLabel = (type: string | undefined | null): string => {
  if (!type) return "N/A";
  
  const types: Record<string, string> = {
    'principal': 'Sede Principal',
    'satelite': 'Sede Satélite',
    'movil': 'Unidad Móvil',
    'domiciliaria': 'Atención Domiciliaria',
    'telemedicina': 'Centro de Telemedicina',
  };
  return types[type] || type;
};

const parseWorkingHours = (workingHours: any): string => {
  if (!workingHours || typeof workingHours !== 'object' || Object.keys(workingHours).length === 0) {
    return "No especificado";
  }
  
  try {
    // Convert working hours object to readable format
    const days = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const schedules: string[] = [];
    
    for (const [day, hours] of Object.entries(workingHours)) {
      if (hours && typeof hours === 'object') {
        const dayHours = hours as any;
        if (dayHours.start && dayHours.end) {
          schedules.push(`${day}: ${dayHours.start} - ${dayHours.end}`);
        }
      }
    }
    
    return schedules.length > 0 ? schedules.join(', ') : "No especificado";
  } catch {
    return "Formato inválido";
  }
};

// ====================================
// MAIN COMPONENT
// ====================================

const SedeDetailModal: React.FC<SedeDetailModalProps> = ({
  isOpen,
  onClose,
  sedeId,
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
  const { currentSede, loading, error, fetchSedeDetail } = useSedeStore();
  const [sede, setSede] = useState<SedePrestadora | null>(null);

  // Fetch sede detail when modal opens
  useEffect(() => {
    if (isOpen && sedeId && sedeId !== sede?.id) {
      fetchSedeDetail(sedeId).then(setSede).catch(() => {
        // Error handling is managed by the store
      });
    }
  }, [isOpen, sedeId, fetchSedeDetail, sede?.id]);

  // Update local state when store data changes
  useEffect(() => {
    if (currentSede && currentSede.id === sedeId) {
      setSede(currentSede);
    }
  }, [currentSede, sedeId]);

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
        <p className="text-muted">Cargando información de la sede...</p>
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
    if (!sede) return null;

    return renderInfoCard(
      "Información General",
      "ri-building-line",
      <div className="row">
        {renderDataField("Código REPS", 
          <div className="d-flex align-items-center">
            <span className="badge bg-primary text-white fs-15 fw-bold px-4 py-2 me-2" style={{ borderRadius: '8px' }}>
              <i className="ri-qr-code-line me-2" aria-hidden="true"></i>
              {sede.reps_code || "N/A"}
            </span>
            <small className="text-muted">Código único</small>
          </div>,
          "Código único REPS asignado a esta sede"
        )}
        
        {renderDataField("Nombre de la Sede", 
          <div className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>
            {sede.name}
          </div>
        )}
        
        {renderDataField("Tipo de Sede", 
          sede.sede_type ? (
            <span className="badge bg-info text-white fs-14 fw-semibold px-3 py-2" style={{ borderRadius: '6px' }}>
              <i className="ri-building-2-line me-1" aria-hidden="true"></i>
              {getSedeTypeLabel(sede.sede_type)}
            </span>
          ) : (
            <span className="text-muted fst-italic">No especificado</span>
          )
        )}
        
        {renderDataField("Organización", 
          <div className="fw-semibold text-primary" style={{ fontSize: '1rem' }}>
            {sede.organization_name}
          </div>
        )}
        
        {renderDataField("Sede Principal", 
          sede.is_main_headquarters ? (
            <span className="badge bg-success text-white fs-14 fw-semibold px-3 py-2" style={{ borderRadius: '6px' }}>
              <i className="ri-star-fill me-1" aria-hidden="true"></i>
              Sede Principal
            </span>
          ) : (
            <span className="badge bg-secondary text-white fs-14 fw-medium px-3 py-2" style={{ borderRadius: '6px' }}>
              <i className="ri-building-line me-1" aria-hidden="true"></i>
              Sede Secundaria
            </span>
          )
        )}
        
        {renderDataField("Atención 24 Horas", 
          sede.atencion_24_horas ? (
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

  const renderLocationInformation = () => {
    if (!sede) return null;

    return renderInfoCard(
      "Ubicación",
      "ri-map-pin-line",
      <div className="row">
        {renderDataField("Departamento", 
          <div className="d-flex align-items-center">
            <i className="ri-map-2-line me-2 text-info" aria-hidden="true"></i>
            <span className="fw-semibold">{sede.department_name}</span>
          </div>
        )}
        {renderDataField("Municipio", 
          <div className="d-flex align-items-center">
            <i className="ri-community-line me-2 text-info" aria-hidden="true"></i>
            <span className="fw-semibold">{sede.municipality_name}</span>
          </div>
        )}
        {renderDataField("Dirección", 
          <div className="d-flex align-items-start">
            <i className="ri-road-map-line me-2 text-primary mt-1" aria-hidden="true"></i>
            <span className="fw-medium">{sede.address}</span>
          </div>,
          "", "col-md-12"
        )}
        {renderDataField("Barrio", 
          sede.barrio ? (
            <div className="d-flex align-items-center">
              <i className="ri-home-4-line me-2 text-secondary" aria-hidden="true"></i>
              <span>{sede.barrio}</span>
            </div>
          ) : (
            <span className="text-muted fst-italic">No especificado</span>
          )
        )}
        {renderDataField("Código Postal", 
          sede.postal_code ? (
            <div className="d-flex align-items-center">
              <i className="ri-mail-line me-2 text-secondary" aria-hidden="true"></i>
              <span className="font-monospace fw-medium">{sede.postal_code}</span>
            </div>
          ) : (
            <span className="text-muted fst-italic">No especificado</span>
          )
        )}
        
        {(sede.latitude && sede.longitude) && (
          <>
            <div className="col-12">
              <hr className="my-3" />
              <h6 className="fw-bold text-success mb-3">
                <i className="ri-map-pin-2-fill me-2" aria-hidden="true"></i>
                Coordenadas GPS
              </h6>
            </div>
            {renderDataField("Latitud", 
              <div className="d-flex align-items-center">
                <span className="badge bg-success-subtle text-success fs-13 fw-bold font-monospace px-3 py-2">
                  {sede.latitude}
                </span>
              </div>,
              "Coordenada de latitud GPS"
            )}
            {renderDataField("Longitud", 
              <div className="d-flex align-items-center">
                <span className="badge bg-success-subtle text-success fs-13 fw-bold font-monospace px-3 py-2">
                  {sede.longitude}
                </span>
              </div>,
              "Coordenada de longitud GPS"
            )}
          </>
        )}
      </div>,
      "info"
    );
  };

  const renderContactInformation = () => {
    if (!sede) return null;

    return renderInfoCard(
      "Información de Contacto",
      "ri-phone-line",
      <div className="row">
        {renderDataField("Teléfono Principal", 
          sede.phone_primary ? (
            <a href={`tel:${sede.phone_primary}`} className="text-decoration-none d-flex align-items-center text-primary fw-semibold">
              <div className="icon-wrapper me-2" style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'var(--bs-primary-bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="ri-phone-fill text-primary" aria-hidden="true"></i>
              </div>
              {sede.phone_primary}
            </a>
          ) : (
            <span className="text-muted fst-italic">No especificado</span>
          )
        )}
        
        {renderDataField("Teléfono Secundario", 
          sede.phone_secondary ? (
            <a href={`tel:${sede.phone_secondary}`} className="text-decoration-none d-flex align-items-center text-secondary fw-medium">
              <div className="icon-wrapper me-2" style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'var(--bs-secondary-bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="ri-phone-line text-secondary" aria-hidden="true"></i>
              </div>
              {sede.phone_secondary}
            </a>
          ) : (
            <span className="text-muted fst-italic">No especificado</span>
          )
        )}
        
        {renderDataField("Email Institucional", 
          sede.email ? (
            <a href={`mailto:${sede.email}`} className="text-decoration-none d-flex align-items-center text-info fw-medium">
              <div className="icon-wrapper me-2" style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'var(--bs-info-bg-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="ri-mail-fill text-info" aria-hidden="true"></i>
              </div>
              {sede.email}
            </a>
          ) : (
            <span className="text-muted fst-italic">No especificado</span>
          ),
          "", "col-md-12"
        )}
        
        <div className="col-12">
          <div className="border rounded-3 p-3 mt-3" style={{ backgroundColor: 'var(--bs-light-bg-subtle)' }}>
            <h6 className="fw-bold mb-3 text-dark">
              <i className="ri-user-settings-fill me-2 text-warning" aria-hidden="true"></i>
              Contacto Administrativo
            </h6>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-2">
                  <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>Nombre</label>
                  <div className="fw-medium">{sede.administrative_contact || <span className="text-muted fst-italic">No especificado</span>}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-2">
                  <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>Cargo</label>
                  <div className="fw-medium">{sede.cargo_responsable_administrativo || <span className="text-muted fst-italic">No especificado</span>}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-2">
                  <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>Teléfono</label>
                  <div className="fw-medium">
                    {sede.administrative_contact_phone ? (
                      <a href={`tel:${sede.administrative_contact_phone}`} className="text-decoration-none text-primary">
                        <i className="ri-phone-line me-1" aria-hidden="true"></i>
                        {sede.administrative_contact_phone}
                      </a>
                    ) : (
                      <span className="text-muted fst-italic">No especificado</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-2">
                  <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>Email</label>
                  <div className="fw-medium">
                    {sede.administrative_contact_email ? (
                      <a href={`mailto:${sede.administrative_contact_email}`} className="text-decoration-none text-info">
                        <i className="ri-mail-line me-1" aria-hidden="true"></i>
                        {sede.administrative_contact_email}
                      </a>
                    ) : (
                      <span className="text-muted fst-italic">No especificado</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,
      "success"
    );
  };

  const renderHabilitationStatus = () => {
    if (!sede) return null;

    const renewalWarning = sede.next_renewal_date && 
      new Date(sede.next_renewal_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return renderInfoCard(
      "Estado de Habilitación",
      "ri-shield-check-line",
      <div className="row">
        {renderDataField("Estado Actual", 
          <div className="d-flex align-items-center">
            {getStatusBadge(sede.habilitation_status, 'habilitation')}
            {sede.habilitation_status === 'habilitada' && (
              <i className="ri-verified-badge-fill text-success ms-2 fs-18" title="Verificado" aria-hidden="true"></i>
            )}
          </div>
        )}
        
        {renderDataField("Fecha de Habilitación", 
          sede.habilitation_date ? (
            <div className="d-flex align-items-center">
              <i className="ri-calendar-check-fill me-2 text-success" aria-hidden="true"></i>
              <span className="fw-semibold">{formatDate(sede.habilitation_date)}</span>
            </div>
          ) : (
            <span className="text-muted fst-italic">No especificada</span>
          )
        )}
        
        {renderDataField("Resolución", 
          sede.habilitation_resolution ? (
            <div className="d-flex align-items-center">
              <span className="badge bg-warning text-dark fs-13 fw-bold px-3 py-2" style={{ borderRadius: '6px' }}>
                <i className="ri-file-text-fill me-1" aria-hidden="true"></i>
                {sede.habilitation_resolution}
              </span>
            </div>
          ) : (
            <span className="text-muted fst-italic">No especificada</span>
          ),
          "Número de resolución que otorga la habilitación"
        )}
        
        {renderDataField("Próxima Renovación", 
          sede.next_renewal_date ? (
            <div className="d-flex align-items-center">
              <div className={`d-flex align-items-center ${renewalWarning ? 'text-warning' : 'text-info'}`}>
                <i className={`${renewalWarning ? 'ri-alarm-warning-fill' : 'ri-calendar-event-fill'} me-2 fs-16`} aria-hidden="true"></i>
                <span className="fw-semibold">{formatDate(sede.next_renewal_date)}</span>
                {renewalWarning && (
                  <span className="badge bg-warning text-dark ms-2 fs-12 fw-bold" style={{ borderRadius: '4px' }}>
                    ¡Próxima!
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-muted fst-italic">No programada</span>
          ),
          "Fecha programada para renovación de habilitación"
        )}
      </div>,
      "warning"
    );
  };

  const renderOperationalStatus = () => {
    if (!sede) return null;

    return renderInfoCard(
      "Estado Operacional",
      "ri-play-circle-line",
      <div className="row">
        {renderDataField("Estado Operacional", 
          <div className="d-flex align-items-center">
            {getStatusBadge(sede.operational_status, 'operational')}
            {sede.operational_status === 'activa' && (
              <div className="ms-2">
                <div className="spinner-grow text-success" style={{ width: '0.5rem', height: '0.5rem' }} role="status">
                  <span className="visually-hidden">Activa</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {renderDataField("Fecha de Apertura", 
          sede.opening_date ? (
            <div className="d-flex align-items-center">
              <i className="ri-door-open-fill me-2 text-success" aria-hidden="true"></i>
              <span className="fw-semibold">{formatDate(sede.opening_date)}</span>
            </div>
          ) : (
            <span className="text-muted fst-italic">No especificada</span>
          )
        )}
        {renderDataField("Fecha de Cierre", 
          sede.closing_date ? (
            <div className="d-flex align-items-center">
              <i className="ri-door-close-fill me-2 text-danger" aria-hidden="true"></i>
              <span className="fw-semibold text-danger">{formatDate(sede.closing_date)}</span>
            </div>
          ) : (
            <span className="text-muted fst-italic">No especificada</span>
          )
        )}
        
        {(sede.suspension_start || sede.suspension_end) && (
          <>
            <div className="col-12">
              <div className="alert alert-warning mt-2" role="alert" style={{ borderRadius: '8px' }}>
                <h6 className="alert-heading fw-bold">
                  <i className="ri-pause-circle-fill me-2" aria-hidden="true"></i>
                  Información de Suspensión
                </h6>
                <div className="row">
                  {sede.suspension_start && (
                    <div className="col-md-6">
                      <small className="text-muted fw-semibold">Inicio:</small>
                      <div className="fw-medium">{formatDate(sede.suspension_start)}</div>
                    </div>
                  )}
                  {sede.suspension_end && (
                    <div className="col-md-6">
                      <small className="text-muted fw-semibold">Fin:</small>
                      <div className="fw-medium">{formatDate(sede.suspension_end)}</div>
                    </div>
                  )}
                  {sede.suspension_reason && (
                    <div className="col-12 mt-2">
                      <small className="text-muted fw-semibold">Motivo:</small>
                      <div className="fw-medium">{sede.suspension_reason}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        
        {renderDataField("Servicio de Urgencias", 
          sede.has_emergency_service ? (
            <span className="badge bg-danger text-white fs-14 fw-bold px-3 py-2" style={{ borderRadius: '6px' }}>
              <i className="ri-heart-pulse-fill me-1" aria-hidden="true"></i>
              Disponible
            </span>
          ) : (
            <span className="badge bg-light text-dark fs-14 fw-medium px-3 py-2" style={{ borderRadius: '6px' }}>
              <i className="ri-close-line me-1" aria-hidden="true"></i>
              No disponible
            </span>
          )
        )}
      </div>,
      "danger"
    );
  };

  const renderInstalledCapacity = () => {
    if (!sede) return null;

    return renderInfoCard(
      "Capacidad Instalada",
      "ri-hospital-line",
      <div className="row g-2">
        <div className="col-6">
          <div className="text-center p-2 rounded-3 bg-info-subtle d-flex flex-column justify-content-center" style={{ minHeight: '70px' }}>
            <i className="ri-hotel-bed-fill text-info fs-18 mb-1" aria-hidden="true"></i>
            <div className="fw-bold text-dark fs-16">{sede.total_beds || 0}</div>
            <div className="text-muted small">Camas</div>
          </div>
        </div>
        
        <div className="col-6">
          <div className="text-center p-2 rounded-3 bg-warning-subtle d-flex flex-column justify-content-center" style={{ minHeight: '70px' }}>
            <i className="ri-heart-pulse-fill text-warning fs-18 mb-1" aria-hidden="true"></i>
            <div className="fw-bold text-dark fs-16">{sede.icu_beds || 0}</div>
            <div className="text-muted small">UCI</div>
          </div>
        </div>
        
        <div className="col-6">
          <div className="text-center p-2 rounded-3 bg-danger-subtle d-flex flex-column justify-content-center" style={{ minHeight: '70px' }}>
            <i className="ri-emergency-line text-danger fs-18 mb-1" aria-hidden="true"></i>
            <div className="fw-bold text-dark fs-16">{sede.emergency_beds || 0}</div>
            <div className="text-muted small">Urgencias</div>
          </div>
        </div>
        
        <div className="col-6">
          <div className="text-center p-2 rounded-3 bg-success-subtle d-flex flex-column justify-content-center" style={{ minHeight: '70px' }}>
            <i className="ri-surgical-mask-fill text-success fs-18 mb-1" aria-hidden="true"></i>
            <div className="fw-bold text-dark fs-16">{sede.surgery_rooms || 0}</div>
            <div className="text-muted small">Quirófanos</div>
          </div>
        </div>
        
        <div className="col-12">
          <div className="text-center p-2 rounded-3 bg-primary-subtle d-flex flex-column justify-content-center" style={{ minHeight: '70px' }}>
            <i className="ri-stethoscope-line text-primary fs-18 mb-1" aria-hidden="true"></i>
            <div className="fw-bold text-dark fs-16">{sede.consultation_rooms || 0}</div>
            <div className="text-muted small">Consultorios</div>
          </div>
        </div>
      </div>,
      "secondary"
    );
  };

  const renderEnabledServices = () => {
    if (!sede) return null;

    return renderInfoCard(
      "Servicios Habilitados",
      "ri-service-line",
      <div className="text-center">
        <div className="icon-wrapper mx-auto mb-3" style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          backgroundColor: 'var(--bs-success-bg-subtle)',
          border: '3px solid var(--bs-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <i className="ri-list-check-2 text-success fs-36" aria-hidden="true"></i>
        </div>
        
        <div className="fw-bold text-dark fs-32 mb-2">{sede.services_count || 0}</div>
        <div className="text-muted fw-semibold mb-3">Servicios Registrados</div>
        
        {sede.services_count > 0 ? (
          <div className="alert alert-success" role="alert" style={{ borderRadius: '10px' }}>
            <div className="d-flex align-items-center justify-content-center">
              <i className="ri-check-double-line me-2 fs-18" aria-hidden="true"></i>
              <span className="fw-semibold">Sede con servicios habilitados</span>
            </div>
            <small className="d-block mt-2 text-muted">
              Use el botón "Ver Servicios" para consultar el detalle
            </small>
          </div>
        ) : (
          <div className="alert alert-warning" role="alert" style={{ borderRadius: '10px' }}>
            <div className="d-flex align-items-center justify-content-center">
              <i className="ri-alert-line me-2 fs-18" aria-hidden="true"></i>
              <span className="fw-semibold">Sin servicios registrados</span>
            </div>
          </div>
        )}
      </div>,
      "success"
    );
  };

  const renderREPSSynchronization = () => {
    if (!sede) return null;

    return renderInfoCard(
      "Sincronización REPS",
      "ri-refresh-line",
      <div className="row">
        {renderDataField("Estado de Sincronización", 
          <div className="d-flex align-items-center">
            {getStatusBadge(sede.sync_status, 'sync')}
            {sede.sync_status === 'success' && (
              <div className="ms-2">
                <i className="ri-check-double-fill text-success fs-16" title="Sincronizado correctamente" aria-hidden="true"></i>
              </div>
            )}
          </div>
        )}
        
        {renderDataField("Última Sincronización", 
          sede.last_reps_sync ? (
            <div className="d-flex align-items-center">
              <i className="ri-time-fill me-2 text-info" aria-hidden="true"></i>
              <div>
                <div className="fw-semibold">{formatDateTime(sede.last_reps_sync)}</div>
                <small className="text-muted">Última actualización REPS</small>
              </div>
            </div>
          ) : (
            <span className="text-muted fst-italic">Nunca sincronizada</span>
          ),
          "Fecha y hora de la última sincronización con REPS",
          "col-12"
        )}
        
        {sede.sync_errors && Array.isArray(sede.sync_errors) && sede.sync_errors.length > 0 && (
          <div className="col-12">
            <div className="alert alert-danger mt-3" role="alert" style={{ borderRadius: '10px' }}>
              <h6 className="alert-heading fw-bold">
                <i className="ri-error-warning-fill me-2" aria-hidden="true"></i>
                Errores de Sincronización Detectados
              </h6>
              <div className="mt-2">
                {sede.sync_errors.map((error, index) => (
                  <div key={index} className="d-flex align-items-start mb-2">
                    <i className="ri-close-circle-fill text-danger me-2 mt-1 flex-shrink-0" aria-hidden="true"></i>
                    <span className="small">{typeof error === 'string' ? error : JSON.stringify(error)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>,
      "info"
    );
  };

  const renderAdditionalInformation = () => {
    if (!sede) return null;

    return renderInfoCard(
      "Información Adicional",
      "ri-information-line",
      <div className="row">
        {renderDataField("Horario de Atención", 
          <div className="border rounded-3 p-3" style={{ backgroundColor: 'var(--bs-light-bg-subtle)' }}>
            <div className="d-flex align-items-center mb-2">
              <i className="ri-time-fill me-2 text-primary" aria-hidden="true"></i>
              <span className="fw-semibold text-dark">Horarios de Funcionamiento</span>
            </div>
            <div className="fw-medium text-muted small">
              {parseWorkingHours(sede.working_hours)}
            </div>
          </div>,
          "Horario de atención por día de la semana",
          "col-md-12"
        )}
        
        {sede.observations && renderDataField(
          "Observaciones", 
          <div className="border rounded-3 p-3" style={{ backgroundColor: 'var(--bs-warning-bg-subtle)' }}>
            <div className="d-flex align-items-center mb-2">
              <i className="ri-sticky-note-fill me-2 text-warning" aria-hidden="true"></i>
              <span className="fw-semibold text-dark">Notas Importantes</span>
            </div>
            <div className="fw-medium text-dark small">
              {sede.observations}
            </div>
          </div>, 
          "Observaciones adicionales sobre la sede",
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
                    {formatDateTime(sede.created_at)}
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-2">
                  <label className="form-label text-muted fw-semibold mb-1" style={{ fontSize: '0.875rem' }}>Última Actualización</label>
                  <div className="fw-medium">
                    <i className="ri-edit-line me-1 text-info" aria-hidden="true"></i>
                    {formatDateTime(sede.updated_at)}
                  </div>
                </div>
              </div>
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
                <i className="ri-building-2-fill fs-24" aria-hidden="true"></i>
              </div>
              <div>
                <h4 className="modal-title mb-1 fw-bold text-white">
                  Detalles de Sede Prestadora
                </h4>
                {sede && (
                  <div className="d-flex align-items-center">
                    <span className="badge bg-white text-primary fs-13 fw-bold px-3 py-2 me-2" style={{ borderRadius: '8px' }}>
                      <i className="ri-qr-code-line me-1" aria-hidden="true"></i>
                      {sede.reps_code}
                    </span>
                    <span className="text-white-50 fw-medium">
                      {getSedeTypeLabel(sede.sede_type)}
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
              <i className="ri-hospital-line" aria-hidden="true"></i>
            </div>
          </div>

          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.25rem' }}>
            {isLoadingData && renderLoadingState()}
            {displayError && !isLoadingData && renderErrorState()}
            
            {!isLoadingData && !displayError && sede && (
              <div className="container-fluid">
                <div className="row g-3">
                  <div className="col-md-6 d-flex flex-column">
                    {renderGeneralInformation()}
                    {renderLocationInformation()}
                    {renderContactInformation()}
                    {renderInstalledCapacity()}
                    {renderREPSSynchronization()}
                  </div>
                  <div className="col-md-6 d-flex flex-column">
                    {renderHabilitationStatus()}
                    {renderOperationalStatus()}
                    {renderEnabledServices()}
                    {renderAdditionalInformation()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer bg-light border-0" style={{ padding: '1.5rem 2rem' }}>
            <div className="d-flex justify-content-between w-100 align-items-center">
              <div className="d-flex gap-2">
                {sede && sede.services_count > 0 && (
                  <button
                    type="button"
                    className="btn btn-info fw-semibold"
                    title="Ver servicios habilitados"
                    style={{ borderRadius: '10px', padding: '0.75rem 1.5rem' }}
                  >
                    <i className="ri-service-line me-2 fs-16" aria-hidden="true"></i>
                    Ver Servicios
                    <span className="badge bg-white text-info ms-2 fw-bold">{sede.services_count}</span>
                  </button>
                )}
                
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
                {sede && onEdit && (
                  <button
                    type="button"
                    className="btn btn-success fw-bold"
                    onClick={() => {
                      onEdit(sede);
                      onClose();
                    }}
                    style={{ borderRadius: '10px', padding: '0.75rem 2rem' }}
                  >
                    <i className="ri-edit-2-fill me-2 fs-16" aria-hidden="true"></i>
                    Editar Sede
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

export default SedeDetailModal;