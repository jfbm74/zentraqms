/**
 * Service Duplicate Modal Component (Professional Velzon Style)
 *
 * Modal for duplicating health services between headquarters,
 * following Velzon design patterns and comprehensive service selection.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useBootstrapTooltips } from '../../../../../../hooks/useBootstrapTooltips';
import InfoTooltip from '../../../../../../components/common/InfoTooltip';
import { useServicioStore } from '../../../../../../stores/servicioStore';
import { servicioService } from '../../../../../../services/servicioService';
import type { 
  ServicioDuplicateFormData, 
  ServicioListItem,
  CategoriaServicio,
  ModalidadServicio,
  ComplejidadServicio
} from '../../../../../../types/servicios';

// ====================================
// INTERFACES
// ====================================

interface ServiceDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: ServicioDuplicateFormData) => Promise<void>;
  sourceSedeId?: string;
  isLoading?: boolean;
}

interface SedeOption {
  value: string;
  label: string;
  services_count: number;
}

interface ServiceOption extends ServicioListItem {
  selected: boolean;
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

const getModalityLabel = (modality: ModalidadServicio): string => {
  const modalities: Record<string, string> = {
    'intramural': 'Intramural',
    'extramural': 'Extramural',
    'telemedicina': 'Telemedicina',
    'atencion_domiciliaria': 'Atención Domiciliaria',
  };
  return modalities[modality] || modality;
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

const getComplexityLabel = (complexity: ComplejidadServicio): string => {
  const complexities: Record<string, string> = {
    'baja': 'Baja',
    'media': 'Media',
    'alta': 'Alta',
    'no_aplica': 'N/A',
  };
  return complexities[complexity] || complexity;
};

// ====================================
// MAIN COMPONENT
// ====================================

const ServiceDuplicateModal: React.FC<ServiceDuplicateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  sourceSedeId,
  isLoading = false,
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
  const [formData, setFormData] = useState<ServicioDuplicateFormData>({
    source_sede_id: sourceSedeId || '',
    target_sede_ids: [],
    service_ids: [],
    duplicate_mode: 'selected',
    update_existing: false,
    copy_staff_info: true,
    copy_operating_hours: true,
    copy_equipment: true,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [sedeOptions, setSedeOptions] = useState<SedeOption[]>([]);
  const [sourceServices, setSourceServices] = useState<ServiceOption[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoriaServicio | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { servicios, loading } = useServicioStore();

  const totalSteps = 3;

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (sourceSedeId) {
        setFormData(prev => ({ ...prev, source_sede_id: sourceSedeId }));
      }
      loadSedeOptions();
      loadSourceServices();
    }
  }, [isOpen, sourceSedeId]);

  // Load sede options
  const loadSedeOptions = async () => {
    try {
      const options = await servicioService.getAvailableSedes();
      const sedeOptionsWithCounts = options.map(option => ({
        ...option,
        services_count: servicios.filter(s => s.sede_reps_code === option.value).length
      }));
      setSedeOptions(sedeOptionsWithCounts);
    } catch (error) {
      console.error('Error loading sede options:', error);
    }
  };

  // Load source services
  const loadSourceServices = useCallback(() => {
    if (formData.source_sede_id) {
      const services = servicios
        .filter(s => s.sede_reps_code === formData.source_sede_id)
        .map(s => ({ ...s, selected: false }));
      setSourceServices(services);
      setFilteredServices(services);
    }
  }, [formData.source_sede_id, servicios]);

  // Update filtered services when filters change
  useEffect(() => {
    let filtered = [...sourceServices];

    if (selectedCategory) {
      filtered = filtered.filter(s => s.service_category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.service_name.toLowerCase().includes(term) ||
        s.service_code.toLowerCase().includes(term) ||
        s.service_category.toLowerCase().includes(term)
      );
    }

    setFilteredServices(filtered);
  }, [sourceServices, selectedCategory, searchTerm]);

  // Handle input changes
  const handleInputChange = (field: keyof ServicioDuplicateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Load services when source sede changes
    if (field === 'source_sede_id') {
      loadSourceServices();
    }
  };

  // Handle service selection
  const handleServiceToggle = (serviceId: string) => {
    setSourceServices(prev => 
      prev.map(s => 
        s.id === serviceId ? { ...s, selected: !s.selected } : s
      )
    );

    const selectedServices = sourceServices.filter(s => s.selected || s.id === serviceId);
    const selectedIds = selectedServices.map(s => s.id);
    
    if (formData.service_ids.includes(serviceId)) {
      handleInputChange('service_ids', formData.service_ids.filter(id => id !== serviceId));
    } else {
      handleInputChange('service_ids', [...formData.service_ids, serviceId]);
    }
  };

  // Handle select all services
  const handleSelectAllServices = () => {
    const allSelected = filteredServices.every(s => s.selected);
    const newSelectedState = !allSelected;
    
    setSourceServices(prev => 
      prev.map(s => 
        filteredServices.some(fs => fs.id === s.id) 
          ? { ...s, selected: newSelectedState }
          : s
      )
    );

    if (newSelectedState) {
      const newSelectedIds = [...new Set([...formData.service_ids, ...filteredServices.map(s => s.id)])];
      handleInputChange('service_ids', newSelectedIds);
    } else {
      const filteredIds = filteredServices.map(s => s.id);
      const newSelectedIds = formData.service_ids.filter(id => !filteredIds.includes(id));
      handleInputChange('service_ids', newSelectedIds);
    }
  };

  // Validation functions
  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1: // Source and target selection
        if (!formData.source_sede_id?.trim()) {
          errors.source_sede_id = 'La sede origen es obligatoria';
        }
        if (formData.target_sede_ids.length === 0) {
          errors.target_sede_ids = 'Debe seleccionar al menos una sede destino';
        }
        if (formData.target_sede_ids.includes(formData.source_sede_id)) {
          errors.target_sede_ids = 'La sede destino no puede ser la misma que la sede origen';
        }
        break;
        
      case 2: // Service selection
        if (formData.duplicate_mode === 'selected' && formData.service_ids.length === 0) {
          errors.service_ids = 'Debe seleccionar al menos un servicio para duplicar';
        }
        break;
        
      case 3: // Options
        // No required validations for options
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
      console.error('Error duplicating services:', error);
    }
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  const isLoadingData = isLoading || loading;

  // ====================================
  // RENDER HELPERS
  // ====================================

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
        {[1, 2, 3].map((step) => (
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
              {step === 1 && 'Sedes'}
              {step === 2 && 'Servicios'}
              {step === 3 && 'Opciones'}
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
                  <i className="ri-building-line fs-14" aria-hidden="true"></i>
                </div>
                Selección de Sedes
              </h6>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-semibold d-flex align-items-center mb-2">
                      Sede Origen
                      <span className="text-danger ms-1">*</span>
                      <InfoTooltip
                        content="Sede desde la cual se copiarán los servicios"
                        placement="top"
                        ariaLabel="Información sobre sede origen"
                      />
                    </label>
                    <select
                      className={`form-select ${validationErrors.source_sede_id ? 'is-invalid' : ''}`}
                      value={formData.source_sede_id}
                      onChange={(e) => handleInputChange('source_sede_id', e.target.value)}
                    >
                      <option value="">Seleccionar sede origen...</option>
                      {sedeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.services_count} servicios)
                        </option>
                      ))}
                    </select>
                    {validationErrors.source_sede_id && (
                      <div className="invalid-feedback">
                        {validationErrors.source_sede_id}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-semibold d-flex align-items-center mb-2">
                      Sedes Destino
                      <span className="text-danger ms-1">*</span>
                      <InfoTooltip
                        content="Sedes a las cuales se duplicarán los servicios"
                        placement="top"
                        ariaLabel="Información sobre sedes destino"
                      />
                    </label>
                    <select
                      className={`form-select ${validationErrors.target_sede_ids ? 'is-invalid' : ''}`}
                      multiple
                      size={5}
                      value={formData.target_sede_ids}
                      onChange={(e) => {
                        const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                        handleInputChange('target_sede_ids', selectedValues);
                      }}
                    >
                      {sedeOptions
                        .filter(option => option.value !== formData.source_sede_id)
                        .map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label} ({option.services_count} servicios)
                          </option>
                        ))}
                    </select>
                    {validationErrors.target_sede_ids && (
                      <div className="invalid-feedback">
                        {validationErrors.target_sede_ids}
                      </div>
                    )}
                    <div className="form-text">
                      Mantenga presionado Ctrl (Windows) o Cmd (Mac) para seleccionar múltiples sedes
                    </div>
                  </div>
                </div>
              </div>

              {formData.source_sede_id && (
                <div className="alert alert-info border-0 mt-3" style={{ borderRadius: '10px' }}>
                  <div className="d-flex align-items-center">
                    <i className="ri-information-line me-2 fs-16" aria-hidden="true"></i>
                    <div>
                      <strong>Sede origen seleccionada:</strong>
                      <div className="mt-1">
                        {sedeOptions.find(s => s.value === formData.source_sede_id)?.label}
                        <span className="badge bg-primary ms-2">
                          {sedeOptions.find(s => s.value === formData.source_sede_id)?.services_count || 0} servicios disponibles
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.target_sede_ids.length > 0 && (
                <div className="alert alert-success border-0 mt-3" style={{ borderRadius: '10px' }}>
                  <div className="d-flex align-items-center">
                    <i className="ri-check-line me-2 fs-16" aria-hidden="true"></i>
                    <div>
                      <strong>Sedes destino seleccionadas ({formData.target_sede_ids.length}):</strong>
                      <div className="mt-2 d-flex flex-wrap gap-1">
                        {formData.target_sede_ids.map(sedeId => {
                          const sede = sedeOptions.find(s => s.value === sedeId);
                          return (
                            <span key={sedeId} className="badge bg-success-subtle text-success">
                              {sede?.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
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
                  <i className="ri-service-line fs-14" aria-hidden="true"></i>
                </div>
                Selección de Servicios
              </h6>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Modo de Duplicación</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="duplicate_mode"
                        id="mode_all"
                        value="all"
                        checked={formData.duplicate_mode === 'all'}
                        onChange={(e) => handleInputChange('duplicate_mode', e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="mode_all">
                        Todos los servicios
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="duplicate_mode"
                        id="mode_selected"
                        value="selected"
                        checked={formData.duplicate_mode === 'selected'}
                        onChange={(e) => handleInputChange('duplicate_mode', e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="mode_selected">
                        Servicios seleccionados
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {formData.duplicate_mode === 'selected' && (
                <>
                  {/* Filters */}
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Filtrar por Categoría</label>
                      <select
                        className="form-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as CategoriaServicio | '')}
                      >
                        <option value="">Todas las categorías</option>
                        <option value="apoyo_diagnostico">Apoyo Diagnóstico</option>
                        <option value="consulta_externa">Consulta Externa</option>
                        <option value="hospitalizacion">Hospitalización</option>
                        <option value="urgencias">Urgencias</option>
                        <option value="quirurgicos">Quirúrgicos</option>
                        <option value="promocion_prevencion">Promoción y Prevención</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Buscar Servicios</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por nombre, código o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Service selection */}
                  {sourceServices.length > 0 && (
                    <div className="border rounded-3 p-3" style={{ backgroundColor: 'var(--bs-light-bg-subtle)', maxHeight: '400px', overflowY: 'auto' }}>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">
                          Servicios Disponibles ({filteredServices.length})
                        </h6>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={handleSelectAllServices}
                        >
                          {filteredServices.every(s => s.selected) ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                        </button>
                      </div>

                      {filteredServices.length > 0 ? (
                        <div className="row g-2">
                          {filteredServices.map(service => (
                            <div key={service.id} className="col-12">
                              <div className={`card border ${service.selected ? 'border-primary bg-primary-subtle' : 'border-light'}`} style={{ borderRadius: '8px' }}>
                                <div className="card-body p-3">
                                  <div className="form-check d-flex align-items-start">
                                    <input
                                      className="form-check-input me-3"
                                      type="checkbox"
                                      id={`service_${service.id}`}
                                      checked={service.selected}
                                      onChange={() => handleServiceToggle(service.id)}
                                    />
                                    <div className="flex-grow-1">
                                      <label className="form-check-label w-100" htmlFor={`service_${service.id}`}>
                                        <div className="d-flex justify-content-between align-items-start">
                                          <div>
                                            <div className="fw-semibold text-dark">{service.service_name}</div>
                                            <div className="small text-muted mb-1">
                                              <i className="ri-qr-code-line me-1" aria-hidden="true"></i>
                                              {service.service_code}
                                            </div>
                                            <div className="small text-secondary">{service.service_category}</div>
                                          </div>
                                          <div className="text-end">
                                            <span className="badge bg-info-subtle text-info small me-1">
                                              {getModalityLabel(service.modality)}
                                            </span>
                                            <span className={`badge ${getComplexityBadgeClass(service.complexity)} small`}>
                                              {getComplexityLabel(service.complexity)}
                                            </span>
                                            <div className="mt-1">
                                              <span className="badge bg-primary-subtle text-primary small">
                                                <i className="ri-group-line me-1" aria-hidden="true"></i>
                                                {service.capacity}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="ri-search-line display-6 text-muted mb-3"></i>
                          <h6 className="text-muted">No se encontraron servicios</h6>
                          <p className="text-muted small">Ajuste los filtros para ver más servicios</p>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.service_ids.length > 0 && (
                    <div className="alert alert-success border-0 mt-3" style={{ borderRadius: '10px' }}>
                      <div className="d-flex align-items-center">
                        <i className="ri-check-line me-2 fs-16" aria-hidden="true"></i>
                        <strong>{formData.service_ids.length} servicio(s) seleccionado(s) para duplicar</strong>
                      </div>
                    </div>
                  )}
                </>
              )}

              {formData.duplicate_mode === 'all' && sourceServices.length > 0 && (
                <div className="alert alert-info border-0" style={{ borderRadius: '10px' }}>
                  <div className="d-flex align-items-center">
                    <i className="ri-information-line me-2 fs-16" aria-hidden="true"></i>
                    <div>
                      <strong>Se duplicarán todos los servicios disponibles:</strong>
                      <div className="mt-2">
                        <span className="badge bg-primary">
                          {sourceServices.length} servicios
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
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
                  <i className="ri-settings-line fs-14" aria-hidden="true"></i>
                </div>
                Opciones de Duplicación
              </h6>
            </div>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="update_existing"
                      checked={formData.update_existing}
                      onChange={(e) => handleInputChange('update_existing', e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="update_existing">
                      <i className="ri-refresh-line me-2 text-primary" aria-hidden="true"></i>
                      Actualizar servicios existentes
                    </label>
                    <div className="form-text">
                      Si está marcado, los servicios que ya existen en las sedes destino serán actualizados
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="copy_staff_info"
                      checked={formData.copy_staff_info}
                      onChange={(e) => handleInputChange('copy_staff_info', e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="copy_staff_info">
                      <i className="ri-team-line me-2 text-success" aria-hidden="true"></i>
                      Copiar información de personal
                    </label>
                    <div className="form-text">
                      Incluye la cantidad de personal médico, enfermería y técnico
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="copy_operating_hours"
                      checked={formData.copy_operating_hours}
                      onChange={(e) => handleInputChange('copy_operating_hours', e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="copy_operating_hours">
                      <i className="ri-time-line me-2 text-info" aria-hidden="true"></i>
                      Copiar horarios de atención
                    </label>
                    <div className="form-text">
                      Incluye los horarios de funcionamiento y atención 24 horas
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="copy_equipment"
                      checked={formData.copy_equipment}
                      onChange={(e) => handleInputChange('copy_equipment', e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="copy_equipment">
                      <i className="ri-tools-line me-2 text-warning" aria-hidden="true"></i>
                      Copiar lista de equipos
                    </label>
                    <div className="form-text">
                      Incluye la lista de equipos médicos disponibles
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="alert alert-info border-0 mt-4" style={{ borderRadius: '10px' }}>
                <h6 className="fw-bold mb-3">
                  <i className="ri-file-list-line me-2" aria-hidden="true"></i>
                  Resumen de la Duplicación
                </h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-2">
                      <strong>Sede origen:</strong>
                      <div className="text-primary">
                        {sedeOptions.find(s => s.value === formData.source_sede_id)?.label || 'No seleccionada'}
                      </div>
                    </div>
                    <div className="mb-2">
                      <strong>Sedes destino:</strong>
                      <div className="text-success">
                        {formData.target_sede_ids.length} sede(s) seleccionada(s)
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-2">
                      <strong>Servicios:</strong>
                      <div className="text-warning">
                        {formData.duplicate_mode === 'all' 
                          ? `Todos (${sourceServices.length})` 
                          : `${formData.service_ids.length} seleccionado(s)`}
                      </div>
                    </div>
                    <div className="mb-2">
                      <strong>Opciones activas:</strong>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {formData.update_existing && (
                          <span className="badge bg-primary-subtle text-primary small">Actualizar existentes</span>
                        )}
                        {formData.copy_staff_info && (
                          <span className="badge bg-success-subtle text-success small">Personal</span>
                        )}
                        {formData.copy_operating_hours && (
                          <span className="badge bg-info-subtle text-info small">Horarios</span>
                        )}
                        {formData.copy_equipment && (
                          <span className="badge bg-warning-subtle text-warning small">Equipos</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                <i className="ri-file-copy-line fs-24" aria-hidden="true"></i>
              </div>
              <div>
                <h4 className="modal-title mb-1 fw-bold text-white">
                  Duplicar Servicios entre Sedes
                </h4>
                <p className="mb-0 text-white-50 fw-medium">
                  Copie servicios de salud de una sede a otras sedes
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
              <i className="ri-building-line" aria-hidden="true"></i>
            </div>
          </div>

          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.5rem 2rem' }}>
            <div className="container-fluid">
              {renderProgressIndicator()}
              {renderStepContent()}
            </div>
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
                        <span className="visually-hidden">Duplicando...</span>
                      </span>
                    )}
                    <i className="ri-file-copy-fill me-2 fs-16" aria-hidden="true"></i>
                    Duplicar Servicios
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

export default ServiceDuplicateModal;