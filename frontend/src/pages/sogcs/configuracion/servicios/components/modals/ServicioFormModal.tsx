import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import Select from 'react-select';
import type { 
  ServicioFormModalProps, 
  ServicioFormData, 
  ServicioCatalogo,
  ModalidadServicio,
  ComplejidadServicio,
  EstadoServicio 
} from '../../../../../../types/servicios';
import { 
  MODALIDAD_SERVICIO_OPTIONS,
  COMPLEJIDAD_SERVICIO_OPTIONS,
  ESTADO_SERVICIO_OPTIONS,
} from '../../../../../../types/servicios';
import { useServicioStore } from '../../../../../../stores/servicioStore';
import { servicioService } from '../../../../../../services/servicioService';

const ServicioFormModal: React.FC<ServicioFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  servicio,
  isLoading = false,
  errors = {},
}) => {
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

  const { serviceCatalog, fetchServiceCatalog } = useServicioStore();

  const isEditMode = !!servicio;
  const totalSteps = 4;

  // Initialize form data
  useEffect(() => {
    if (servicio && isEditMode) {
      setFormData({
        sede: servicio.sede_reps_code || '',
        service_catalog: servicio.service_code || '',
        modality: servicio.modality,
        complexity: servicio.complexity,
        capacity: servicio.capacity,
        status: servicio.status,
        authorization_date: servicio.authorization_date || '',
        distinctive_feature: '',
        special_requirements: '',
        observation: '',
        is_24_hours: false,
        medical_staff_count: 0,
        nursing_staff_count: 0,
        technical_staff_count: 0,
        equipment_list: [],
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
        label: `${service.code} - ${service.name}`,
        category: service.category,
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

  const handleSubmit = async () => {
    if (validateCurrentStep()) {
      try {
        await onSave(formData);
      } catch (error) {
        console.error('Error saving service:', error);
      }
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <h6 className="mb-3">
              <i className="ri-information-line me-2"></i>
              Información Básica del Servicio
            </h6>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sede <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={sedeOptions}
                    value={sedeOptions.find(option => option.value === formData.sede)}
                    onChange={(selected) => handleInputChange('sede', selected?.value || '')}
                    placeholder="Seleccionar sede..."
                    isDisabled={isEditMode}
                    className={validationErrors.sede ? 'is-invalid' : ''}
                  />
                  {validationErrors.sede && (
                    <div className="invalid-feedback d-block">{validationErrors.sede}</div>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Servicio del Catálogo <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={filteredCatalogOptions}
                    value={filteredCatalogOptions.find(option => option.value === formData.service_catalog)}
                    onChange={(selected) => handleInputChange('service_catalog', selected?.value || '')}
                    placeholder="Seleccionar servicio..."
                    isSearchable
                    className={validationErrors.service_catalog ? 'is-invalid' : ''}
                  />
                  {validationErrors.service_catalog && (
                    <div className="invalid-feedback d-block">{validationErrors.service_catalog}</div>
                  )}
                  {selectedCatalogService && (
                    <small className="text-muted">
                      Categoría: {selectedCatalogService.category}
                      {selectedCatalogService.description && (
                        <> | {selectedCatalogService.description}</>
                      )}
                    </small>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Modalidad <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={formData.modality}
                    onChange={(e) => handleInputChange('modality', e.target.value as ModalidadServicio)}
                    className={validationErrors.modality ? 'is-invalid' : ''}
                  >
                    {MODALIDAD_SERVICIO_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                  {validationErrors.modality && (
                    <div className="invalid-feedback">{validationErrors.modality}</div>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Complejidad</Form.Label>
                  <Form.Select
                    value={formData.complexity}
                    onChange={(e) => handleInputChange('complexity', e.target.value as ComplejidadServicio)}
                  >
                    {COMPLEJIDAD_SERVICIO_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </>
        );

      case 2:
        return (
          <>
            <h6 className="mb-3">
              <i className="ri-settings-line me-2"></i>
              Capacidad y Estado del Servicio
            </h6>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacidad Instalada <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 1)}
                    className={validationErrors.capacity ? 'is-invalid' : ''}
                  />
                  {validationErrors.capacity && (
                    <div className="invalid-feedback">{validationErrors.capacity}</div>
                  )}
                  <Form.Text className="text-muted">
                    Número máximo de pacientes que pueden ser atendidos simultáneamente
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as EstadoServicio)}
                    className={validationErrors.status ? 'is-invalid' : ''}
                  >
                    {ESTADO_SERVICIO_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                  {validationErrors.status && (
                    <div className="invalid-feedback">{validationErrors.status}</div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Distintivo / Característica Especial</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.distinctive_feature || ''}
                    onChange={(e) => handleInputChange('distinctive_feature', e.target.value)}
                    placeholder="Ej: Cirugía ambulatoria, Atención 24 horas, etc."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Check
                  type="checkbox"
                  id="is_24_hours"
                  label="Atención 24 horas"
                  checked={formData.is_24_hours || false}
                  onChange={(e) => handleInputChange('is_24_hours', e.target.checked)}
                />
              </Col>
            </Row>
          </>
        );

      case 3:
        return (
          <>
            <h6 className="mb-3">
              <i className="ri-calendar-line me-2"></i>
              Fechas y Autorización
            </h6>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Autorización</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.authorization_date || ''}
                    onChange={(e) => handleInputChange('authorization_date', e.target.value)}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Vencimiento</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.expiration_date || ''}
                    onChange={(e) => handleInputChange('expiration_date', e.target.value)}
                    className={validationErrors.expiration_date ? 'is-invalid' : ''}
                  />
                  {validationErrors.expiration_date && (
                    <div className="invalid-feedback">{validationErrors.expiration_date}</div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Resolución de Autorización</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.authorization_resolution || ''}
                    onChange={(e) => handleInputChange('authorization_resolution', e.target.value)}
                    placeholder="Número de resolución o acto administrativo"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Requisitos Especiales</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.special_requirements || ''}
                    onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                    placeholder="Describa requisitos especiales, certificaciones necesarias, etc."
                  />
                </Form.Group>
              </Col>
            </Row>
          </>
        );

      case 4:
        return (
          <>
            <h6 className="mb-3">
              <i className="ri-team-line me-2"></i>
              Personal y Equipos
            </h6>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Personal Médico</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.medical_staff_count || 0}
                    onChange={(e) => handleInputChange('medical_staff_count', parseInt(e.target.value) || 0)}
                    className={validationErrors.medical_staff_count ? 'is-invalid' : ''}
                  />
                  {validationErrors.medical_staff_count && (
                    <div className="invalid-feedback">{validationErrors.medical_staff_count}</div>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Personal de Enfermería</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.nursing_staff_count || 0}
                    onChange={(e) => handleInputChange('nursing_staff_count', parseInt(e.target.value) || 0)}
                    className={validationErrors.nursing_staff_count ? 'is-invalid' : ''}
                  />
                  {validationErrors.nursing_staff_count && (
                    <div className="invalid-feedback">{validationErrors.nursing_staff_count}</div>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Personal Técnico</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.technical_staff_count || 0}
                    onChange={(e) => handleInputChange('technical_staff_count', parseInt(e.target.value) || 0)}
                    className={validationErrors.technical_staff_count ? 'is-invalid' : ''}
                  />
                  {validationErrors.technical_staff_count && (
                    <div className="invalid-feedback">{validationErrors.technical_staff_count}</div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Lista de Equipos</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.equipment_list?.join(', ') || ''}
                    onChange={(e) => handleEquipmentChange(e.target.value)}
                    placeholder="Lista de equipos separados por comas (ej: Rayos X, Ecógrafo, Monitor de signos vitales)"
                  />
                  <Form.Text className="text-muted">
                    Separe cada equipo con una coma
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Observaciones</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.observation || ''}
                    onChange={(e) => handleInputChange('observation', e.target.value)}
                    placeholder="Observaciones adicionales sobre el servicio..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </>
        );

      default:
        return null;
    }
  };

  // Render progress indicator
  const renderProgressIndicator = () => (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="text-muted small">Paso {currentStep} de {totalSteps}</span>
        <span className="text-muted small">{Math.round((currentStep / totalSteps) * 100)}% completado</span>
      </div>
      <div className="progress" style={{ height: '4px' }}>
        <div 
          className="progress-bar" 
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <Modal show={isOpen} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="ri-service-line me-2"></i>
          {isEditMode ? 'Editar Servicio de Salud' : 'Crear Nuevo Servicio de Salud'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {renderProgressIndicator()}
        
        {Object.keys(errors).length > 0 && (
          <Alert variant="danger">
            <div className="mb-0">
              {Object.entries(errors).map(([field, fieldErrors]) => (
                <div key={field}>
                  <strong>{field}:</strong> {Array.isArray(fieldErrors) ? fieldErrors.join(', ') : fieldErrors}
                </div>
              ))}
            </div>
          </Alert>
        )}
        
        {renderStepContent()}
      </Modal.Body>
      
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div>
            {currentStep > 1 && (
              <Button 
                variant="outline-secondary" 
                onClick={handlePrevious}
                disabled={isLoading}
              >
                <i className="ri-arrow-left-line me-1"></i>
                Anterior
              </Button>
            )}
          </div>
          
          <div className="d-flex gap-2">
            <Button variant="outline-danger" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                variant="primary" 
                onClick={handleNext}
                disabled={isLoading}
              >
                Siguiente
                <i className="ri-arrow-right-line ms-1"></i>
              </Button>
            ) : (
              <Button 
                variant="success" 
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading && <span className="spinner-border spinner-border-sm me-2"></span>}
                {isEditMode ? 'Actualizar Servicio' : 'Crear Servicio'}
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ServicioFormModal;