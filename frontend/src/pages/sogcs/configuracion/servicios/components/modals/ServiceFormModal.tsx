/**
 * Service Form Modal Component (Professional Velzon Style)
 *
 * Enhanced modal for creating and editing health services following
 * the exact patterns established in SedeDetailModal with Velzon design system.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useBootstrapTooltips } from '../../../../../../hooks/useBootstrapTooltips';
import InfoTooltip from '../../../../../../components/common/InfoTooltip';
import type { 
  ServicioFormData, 
  ServicioCatalogo,
  ModalidadServicio,
  ComplejidadServicio,
  EstadoServicio,
  SedeHealthService 
} from '../../../../../../types/servicios';
import { 
  MODALIDAD_SERVICIO_OPTIONS,
  COMPLEJIDAD_SERVICIO_OPTIONS,
  ESTADO_SERVICIO_OPTIONS,
} from '../../../../../../types/servicios';
import { useServicioStore } from '../../../../../../stores/servicioStore';
import { servicioService } from '../../../../../../services/servicioService';

// ====================================
// INTERFACES
// ====================================

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: ServicioFormData) => Promise<void>;
  servicio?: SedeHealthService | null;
  organizationId: string;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return "";
  }
};

const getStatusBadgeClass = (status: EstadoServicio): string => {
  switch (status) {
    case 'activo':
      return 'bg-success-subtle text-success';
    case 'inactivo':
      return 'bg-secondary-subtle text-secondary';
    case 'suspendido':
      return 'bg-danger-subtle text-danger';
    case 'en_proceso':
      return 'bg-warning-subtle text-warning';
    default:
      return 'bg-light text-muted';
  }
};

const getComplexityBadgeClass = (complexity: ComplejidadServicio): string => {
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

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  servicio,
  organizationId,
  isLoading = false,
  errors: externalErrors = {},
}) => {
  // Bootstrap tooltips hook
  useBootstrapTooltips([], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 200, hide: 100 },
    animation: true
  });

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ServicioFormData>({
    sede: '',
    service_catalog: '',
    modality: 'intramural',
    complexity: 'baja',
    capacity: 1,
    status: 'activo',
    is_24_hours: false,
    medical_staff_count: 0,
    nursing_staff_count: 0,
    technical_staff_count: 0,
    equipment_list: [],
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [sedeOptions, setSedeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [catalogOptions, setCatalogOptions] = useState<ServicioCatalogo[]>([]);
  const [filteredCatalogOptions, setFilteredCatalogOptions] = useState<Array<{ value: string; label: string; category: string }>>([]);
  const [selectedCatalogService, setSelectedCatalogService] = useState<ServicioCatalogo | null>(null);

  const { serviceCatalog, fetchServiceCatalog, loading, error } = useServicioStore();

  const isEditMode = !!servicio;
  const totalSteps = 4;

  // Initialize form data
  useEffect(() => {
    if (servicio && isEditMode) {
      setFormData({
        sede: servicio.sede_reps_code || '',
        service_catalog: servicio.service_catalog || '',
        modality: servicio.modality,
        complexity: servicio.complexity,
        capacity: servicio.capacity,
        status: servicio.status,
        authorization_date: formatDate(servicio.authorization_date),
        authorization_resolution: servicio.authorization_resolution || '',
        expiration_date: formatDate(servicio.expiration_date),
        distinctive_feature: servicio.distinctive_feature || '',
        special_requirements: servicio.special_requirements || '',
        observation: servicio.observation || '',
        is_24_hours: servicio.is_24_hours || false,
        medical_staff_count: servicio.medical_staff_count || 0,
        nursing_staff_count: servicio.nursing_staff_count || 0,
        technical_staff_count: servicio.technical_staff_count || 0,
        equipment_list: servicio.equipment_list || [],
        operating_hours: servicio.operating_hours,
      });
    } else {
      // Reset for new service
      setFormData({
        sede: '',
        service_catalog: '',
        modality: 'intramural',
        complexity: 'baja',
        capacity: 1,
        status: 'activo',
        is_24_hours: false,
        medical_staff_count: 0,
        nursing_staff_count: 0,
        technical_staff_count: 0,
        equipment_list: [],
      });
    }
    
    setCurrentStep(1);
    setValidationErrors({});
  }, [servicio, isEditMode, isOpen]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadSedeOptions();
      loadServiceCatalog();
    }
  }, [isOpen]);

  // Update catalog options when service catalog changes
  useEffect(() => {
    if (serviceCatalog) {
      const options = serviceCatalog.map((service) => ({
        value: service.id,
        label: `${service.service_code} - ${service.service_name}`,
        category: service.service_group_name,
      }));
      setFilteredCatalogOptions(options);
    }
  }, [serviceCatalog]);

  // Load sede options
  const loadSedeOptions = async () => {
    try {
      const options = await servicioService.getAvailableSedes();
      setSedeOptions(options);
    } catch (error) {
      console.error('Error loading sede options:', error);
    }
  };

  // Load service catalog
  const loadServiceCatalog = async () => {
    try {
      await fetchServiceCatalog();
    } catch (error) {
      console.error('Error loading service catalog:', error);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof ServicioFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Handle service catalog selection
    if (field === 'service_catalog') {
      const selectedService = serviceCatalog.find(s => s.id === value);
      setSelectedCatalogService(selectedService || null);
      
      // Auto-populate complexity if available
      if (selectedService?.complexity) {
        setFormData(prev => ({ ...prev, complexity: selectedService.complexity }));
      }
    }
  };

  // Handle equipment list changes
  const handleEquipmentChange = (equipmentString: string) => {
    const equipmentArray = equipmentString
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    handleInputChange('equipment_list', equipmentArray);
  };

  // Validation functions
  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1: // Información básica
        if (!formData.sede?.trim()) {
          errors.sede = 'La sede es obligatoria';
        }
        if (!formData.service_catalog?.trim()) {
          errors.service_catalog = 'El servicio del catálogo es obligatorio';
        }
        if (!formData.modality) {
          errors.modality = 'La modalidad es obligatoria';
        }
        break;
        
      case 2: // Capacidad y estado
        if (!formData.capacity || formData.capacity < 1) {
          errors.capacity = 'La capacidad debe ser mayor a 0';
        }
        if (!formData.status) {
          errors.status = 'El estado es obligatorio';
        }
        break;
        
      case 3: // Fechas y autorización
        if (formData.authorization_date && formData.expiration_date) {
          const authDate = new Date(formData.authorization_date);
          const expDate = new Date(formData.expiration_date);
          if (authDate >= expDate) {
            errors.expiration_date = 'La fecha de vencimiento debe ser posterior a la fecha de autorización';
          }
        }
        break;
        
      case 4: // Personal y equipos
        if (formData.medical_staff_count && formData.medical_staff_count < 0) {
          errors.medical_staff_count = 'El número de personal médico no puede ser negativo';
        }
        if (formData.nursing_staff_count && formData.nursing_staff_count < 0) {
          errors.nursing_staff_count = 'El número de personal de enfermería no puede ser negativo';
        }
        if (formData.technical_staff_count && formData.technical_staff_count < 0) {
          errors.technical_staff_count = 'El número de personal técnico no puede ser negativo';
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

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
        <p className="text-muted">Cargando formulario...</p>
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

  const renderFormField = (
    label: string,
    children: React.ReactNode,
    required: boolean = false,
    tooltip?: string,
    className: string = "col-md-6"
  ) => (
    <div className={className}>
      <div className="mb-3">
        <label className="form-label fw-semibold d-flex align-items-center mb-2">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
          {tooltip && (
            <InfoTooltip
              content={tooltip}
              placement="top"
              ariaLabel={`Información sobre ${label}`}
            />
          )}
        </label>
        {children}
      </div>
    </div>
  );

  // Render progress indicator
  const renderProgressIndicator = () => (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="text-muted small fw-semibold">Paso {currentStep} de {totalSteps}</span>
        <span className="text-muted small fw-medium">{Math.round((currentStep / totalSteps) * 100)}% completado</span>
      </div>
      <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
        <div 
          className="progress-bar bg-primary" 
          style={{ 
            width: `${(currentStep / totalSteps) * 100}%`,
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }}
        ></div>
      </div>
      
      <div className="d-flex justify-content-between mt-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
            <div 
              className={`rounded-circle d-flex align-items-center justify-content-center ${
                step <= currentStep ? 'bg-primary text-white' : 'bg-light text-muted'
              }`}
              style={{ width: '24px', height: '24px', fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              {step <= currentStep ? (
                <i className="ri-check-line" aria-hidden="true"></i>
              ) : (
                step
              )}
            </div>
            <small className={`mt-1 text-center ${step <= currentStep ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
              {step === 1 && 'Básicos'}
              {step === 2 && 'Capacidad'}
              {step === 3 && 'Fechas'}
              {step === 4 && 'Personal'}
            </small>
          </div>
        ))}
      </div>
    </div>
  );

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-primary bg-gradient text-white border-0" style={{ borderRadius: '12px 12px 0 0' }}>
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
                  <i className="ri-information-line fs-14" aria-hidden="true"></i>
                </div>
                Información Básica del Servicio
              </h6>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <div className="row">
                {renderFormField(
                  "Sede",
                  <select
                    className={`form-select ${validationErrors.sede || externalErrors.sede ? 'is-invalid' : ''}`}
                    value={formData.sede}
                    onChange={(e) => handleInputChange('sede', e.target.value)}
                    disabled={isEditMode}
                  >
                    <option value="">Seleccionar sede...</option>
                    {sedeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>,
                  true,
                  "Sede donde se prestará el servicio de salud"
                )}
                
                {renderFormField(
                  "Servicio del Catálogo",
                  <select
                    className={`form-select ${validationErrors.service_catalog ? 'is-invalid' : ''}`}
                    value={formData.service_catalog}
                    onChange={(e) => handleInputChange('service_catalog', e.target.value)}
                  >
                    <option value="">Seleccionar servicio...</option>
                    {filteredCatalogOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>,
                  true,
                  "Servicio del catálogo oficial de servicios de salud"
                )}
              </div>

              {selectedCatalogService && (
                <div className="alert alert-info border-0" style={{ borderRadius: '10px' }}>
                  <div className="d-flex align-items-start">
                    <i className="ri-information-line me-2 mt-1 fs-16" aria-hidden="true"></i>
                    <div>
                      <strong>Información del Servicio Seleccionado</strong>
                      <div className="mt-2">
                        <div className="row">
                          <div className="col-md-6">
                            <small className="text-muted fw-semibold">Categoría:</small>
                            <div className="fw-medium">{selectedCatalogService.category}</div>
                          </div>
                          <div className="col-md-6">
                            <small className="text-muted fw-semibold">Complejidad:</small>
                            <div>
                              <span className={`badge ${getComplexityBadgeClass(selectedCatalogService.complexity)} fs-12 fw-semibold px-2 py-1`}>
                                {COMPLEJIDAD_SERVICIO_OPTIONS.find(opt => opt.value === selectedCatalogService.complexity)?.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        {selectedCatalogService.description && (
                          <div className="mt-2">
                            <small className="text-muted fw-semibold">Descripción:</small>
                            <div className="fw-medium">{selectedCatalogService.description}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="row">
                {renderFormField(
                  "Modalidad",
                  <select
                    className={`form-select ${validationErrors.modality ? 'is-invalid' : ''}`}
                    value={formData.modality}
                    onChange={(e) => handleInputChange('modality', e.target.value as ModalidadServicio)}
                  >
                    {MODALIDAD_SERVICIO_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>,
                  true,
                  "Modalidad de prestación del servicio de salud"
                )}
                
                {renderFormField(
                  "Complejidad",
                  <select
                    className="form-select"
                    value={formData.complexity}
                    onChange={(e) => handleInputChange('complexity', e.target.value as ComplejidadServicio)}
                  >
                    {COMPLEJIDAD_SERVICIO_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>,
                  false,
                  "Nivel de complejidad del servicio de salud"
                )}
              </div>

              {/* Display validation errors */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="alert alert-danger border-0 mt-3" style={{ borderRadius: '10px' }}>
                  <div className="d-flex align-items-start">
                    <i className="ri-error-warning-line me-2 mt-1 fs-16" aria-hidden="true"></i>
                    <div>
                      <strong>Por favor corrija los siguientes errores:</strong>
                      <ul className="mb-0 mt-2">
                        {Object.entries(validationErrors).map(([field, error]) => (
                          <li key={field}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-success bg-gradient text-white border-0" style={{ borderRadius: '12px 12px 0 0' }}>
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
                  <i className="ri-settings-line fs-14" aria-hidden="true"></i>
                </div>
                Capacidad y Estado del Servicio
              </h6>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <div className="row">
                {renderFormField(
                  "Capacidad Instalada",
                  <input
                    type="number"
                    className={`form-control ${validationErrors.capacity ? 'is-invalid' : ''}`}
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 1)}
                  />,
                  true,
                  "Número máximo de pacientes que pueden ser atendidos simultáneamente"
                )}
                
                {renderFormField(
                  "Estado",
                  <select
                    className={`form-select ${validationErrors.status ? 'is-invalid' : ''}`}
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as EstadoServicio)}
                  >
                    {ESTADO_SERVICIO_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>,
                  true,
                  "Estado actual del servicio de salud"
                )}
              </div>

              {renderFormField(
                "Distintivo / Característica Especial",
                <input
                  type="text"
                  className="form-control"
                  value={formData.distinctive_feature || ''}
                  onChange={(e) => handleInputChange('distinctive_feature', e.target.value)}
                  placeholder="Ej: Cirugía ambulatoria, Atención especializada, etc."
                />,
                false,
                "Características distintivas o especiales del servicio",
                "col-12"
              )}

              <div className="col-12">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="is_24_hours"
                    checked={formData.is_24_hours || false}
                    onChange={(e) => handleInputChange('is_24_hours', e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="is_24_hours">
                    <i className="ri-time-fill me-2 text-warning" aria-hidden="true"></i>
                    Atención 24 horas
                  </label>
                </div>
              </div>

              {/* Display validation errors */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="alert alert-danger border-0 mt-3" style={{ borderRadius: '10px' }}>
                  <div className="d-flex align-items-start">
                    <i className="ri-error-warning-line me-2 mt-1 fs-16" aria-hidden="true"></i>
                    <div>
                      <strong>Por favor corrija los siguientes errores:</strong>
                      <ul className="mb-0 mt-2">
                        {Object.entries(validationErrors).map(([field, error]) => (
                          <li key={field}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-warning bg-gradient text-dark border-0" style={{ borderRadius: '12px 12px 0 0' }}>
              <h6 className="card-title mb-0 fw-bold d-flex align-items-center">
                <div className="icon-wrapper me-2" style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="ri-calendar-line fs-14" aria-hidden="true"></i>
                </div>
                Fechas y Autorización
              </h6>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <div className="row">
                {renderFormField(
                  "Fecha de Autorización",
                  <input
                    type="date"
                    className="form-control"
                    value={formData.authorization_date || ''}
                    onChange={(e) => handleInputChange('authorization_date', e.target.value)}
                  />,
                  false,
                  "Fecha de autorización del servicio de salud"
                )}
                
                {renderFormField(
                  "Fecha de Vencimiento",
                  <input
                    type="date"
                    className={`form-control ${validationErrors.expiration_date ? 'is-invalid' : ''}`}
                    value={formData.expiration_date || ''}
                    onChange={(e) => handleInputChange('expiration_date', e.target.value)}
                  />,
                  false,
                  "Fecha de vencimiento de la autorización"
                )}
              </div>

              {renderFormField(
                "Resolución de Autorización",
                <input
                  type="text"
                  className="form-control"
                  value={formData.authorization_resolution || ''}
                  onChange={(e) => handleInputChange('authorization_resolution', e.target.value)}
                  placeholder="Número de resolución o acto administrativo"
                />,
                false,
                "Número de resolución que autoriza el servicio",
                "col-12"
              )}

              {renderFormField(
                "Requisitos Especiales",
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.special_requirements || ''}
                  onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                  placeholder="Describa requisitos especiales, certificaciones necesarias, etc."
                ></textarea>,
                false,
                "Requisitos especiales para la prestación del servicio",
                "col-12"
              )}

              {/* Display validation errors */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="alert alert-danger border-0 mt-3" style={{ borderRadius: '10px' }}>
                  <div className="d-flex align-items-start">
                    <i className="ri-error-warning-line me-2 mt-1 fs-16" aria-hidden="true"></i>
                    <div>
                      <strong>Por favor corrija los siguientes errores:</strong>
                      <ul className="mb-0 mt-2">
                        {Object.entries(validationErrors).map(([field, error]) => (
                          <li key={field}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-info bg-gradient text-white border-0" style={{ borderRadius: '12px 12px 0 0' }}>
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
                  <i className="ri-team-line fs-14" aria-hidden="true"></i>
                </div>
                Personal y Equipos
              </h6>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <div className="row">
                {renderFormField(
                  "Personal Médico",
                  <input
                    type="number"
                    className={`form-control ${validationErrors.medical_staff_count ? 'is-invalid' : ''}`}
                    min="0"
                    value={formData.medical_staff_count || 0}
                    onChange={(e) => handleInputChange('medical_staff_count', parseInt(e.target.value) || 0)}
                  />,
                  false,
                  "Número de profesionales médicos asignados al servicio",
                  "col-md-4"
                )}
                
                {renderFormField(
                  "Personal de Enfermería",
                  <input
                    type="number"
                    className={`form-control ${validationErrors.nursing_staff_count ? 'is-invalid' : ''}`}
                    min="0"
                    value={formData.nursing_staff_count || 0}
                    onChange={(e) => handleInputChange('nursing_staff_count', parseInt(e.target.value) || 0)}
                  />,
                  false,
                  "Número de profesionales de enfermería asignados al servicio",
                  "col-md-4"
                )}
                
                {renderFormField(
                  "Personal Técnico",
                  <input
                    type="number"
                    className={`form-control ${validationErrors.technical_staff_count ? 'is-invalid' : ''}`}
                    min="0"
                    value={formData.technical_staff_count || 0}
                    onChange={(e) => handleInputChange('technical_staff_count', parseInt(e.target.value) || 0)}
                  />,
                  false,
                  "Número de técnicos y auxiliares asignados al servicio",
                  "col-md-4"
                )}
              </div>

              {renderFormField(
                "Lista de Equipos",
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.equipment_list?.join(', ') || ''}
                  onChange={(e) => handleEquipmentChange(e.target.value)}
                  placeholder="Lista de equipos separados por comas (ej: Rayos X, Ecógrafo, Monitor de signos vitales)"
                ></textarea>,
                false,
                "Equipos médicos disponibles en el servicio (separar con comas)",
                "col-12"
              )}

              {renderFormField(
                "Observaciones",
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.observation || ''}
                  onChange={(e) => handleInputChange('observation', e.target.value)}
                  placeholder="Observaciones adicionales sobre el servicio..."
                ></textarea>,
                false,
                "Observaciones adicionales sobre el servicio de salud",
                "col-12"
              )}

              {/* Display validation errors */}
              {Object.keys(validationErrors).length > 0 && (
                <div className="alert alert-danger border-0 mt-3" style={{ borderRadius: '10px' }}>
                  <div className="d-flex align-items-start">
                    <i className="ri-error-warning-line me-2 mt-1 fs-16" aria-hidden="true"></i>
                    <div>
                      <strong>Por favor corrija los siguientes errores:</strong>
                      <ul className="mb-0 mt-2">
                        {Object.entries(validationErrors).map(([field, error]) => (
                          <li key={field}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
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
                  {isEditMode ? 'Editar Servicio de Salud' : 'Crear Nuevo Servicio de Salud'}
                </h4>
                <p className="mb-0 text-white-50 fw-medium">
                  {isEditMode ? `Modificar información del servicio ${servicio?.service_name}` : 'Complete la información del nuevo servicio'}
                </p>
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

          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.5rem 2rem' }}>
            {isLoadingData && renderLoadingState()}
            {displayError && !isLoadingData && renderErrorState()}
            
            {!isLoadingData && !displayError && (
              <div className="container-fluid">
                {renderProgressIndicator()}
                {renderStepContent()}
              </div>
            )}
          </div>

          <div className="modal-footer bg-light border-0" style={{ padding: '1.5rem 2rem' }}>
            <div className="d-flex justify-content-between w-100 align-items-center">
              <div>
                {currentStep > 1 && (
                  <button 
                    type="button"
                    className="btn btn-outline-secondary fw-semibold"
                    onClick={handlePrevious}
                    disabled={isLoadingData}
                    style={{ borderRadius: '10px', padding: '0.75rem 1.5rem' }}
                  >
                    <i className="ri-arrow-left-line me-2 fs-16" aria-hidden="true"></i>
                    Anterior
                  </button>
                )}
              </div>
              
              <div className="d-flex gap-3">
                <button
                  type="button"
                  className="btn btn-outline-danger fw-semibold"
                  onClick={onClose}
                  disabled={isLoadingData}
                  style={{ borderRadius: '10px', padding: '0.75rem 1.5rem' }}
                >
                  <i className="ri-close-line me-2 fs-16" aria-hidden="true"></i>
                  Cancelar
                </button>
                
                {currentStep < totalSteps ? (
                  <button 
                    type="button"
                    className="btn btn-primary fw-bold"
                    onClick={handleNext}
                    disabled={isLoadingData}
                    style={{ borderRadius: '10px', padding: '0.75rem 2rem' }}
                  >
                    Siguiente
                    <i className="ri-arrow-right-line ms-2 fs-16" aria-hidden="true"></i>
                  </button>
                ) : (
                  <button 
                    type="button"
                    className="btn btn-success fw-bold"
                    onClick={handleSubmit}
                    disabled={isLoadingData}
                    style={{ borderRadius: '10px', padding: '0.75rem 2rem' }}
                  >
                    {isLoadingData && (
                      <span className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Guardando...</span>
                      </span>
                    )}
                    <i className="ri-save-line me-2 fs-16" aria-hidden="true"></i>
                    {isEditMode ? 'Actualizar Servicio' : 'Crear Servicio'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceFormModal;