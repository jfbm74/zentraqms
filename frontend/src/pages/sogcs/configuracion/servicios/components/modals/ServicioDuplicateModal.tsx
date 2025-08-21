import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Badge } from 'react-bootstrap';
import Select from 'react-select';
import type { 
  ServicioDuplicateModalProps, 
  ServicioDuplicateFormData 
} from '../../../../../../types/servicios';
import { servicioService } from '../../../../../../services/servicioService';

interface ServiceOption {
  value: string;
  label: string;
  category: string;
  sede_name: string;
}

const ServicioDuplicateModal: React.FC<ServicioDuplicateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  sourceSedeId,
  isLoading = false,
  sedeOptions = [],
  serviceOptions = [],
}) => {
  const [formData, setFormData] = useState<ServicioDuplicateFormData>({
    source_sede_id: sourceSedeId || '',
    target_sede_ids: [],
    service_ids: [],
    duplicate_mode: 'all',
    update_existing: false,
    copy_staff_info: true,
    copy_operating_hours: true,
    copy_equipment: true,
  });
  const [availableServices, setAvailableServices] = useState<ServiceOption[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<{
    total_services: number;
    target_sedes: number;
    estimated_duplications: number;
  } | null>(null);

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      setFormData({
        source_sede_id: sourceSedeId || '',
        target_sede_ids: [],
        service_ids: [],
        duplicate_mode: 'all',
        update_existing: false,
        copy_staff_info: true,
        copy_operating_hours: true,
        copy_equipment: true,
      });
      setValidationErrors({});
      setPreviewData(null);
      
      if (sourceSedeId) {
        loadServicesForSede(sourceSedeId);
      }
    }
  }, [isOpen, sourceSedeId]);

  // Load services when source sede changes
  useEffect(() => {
    if (formData.source_sede_id) {
      loadServicesForSede(formData.source_sede_id);
    } else {
      setAvailableServices([]);
    }
  }, [formData.source_sede_id]);

  // Update preview when form data changes
  useEffect(() => {
    updatePreview();
  }, [formData.target_sede_ids, formData.service_ids, formData.duplicate_mode, availableServices]);

  const loadServicesForSede = async (sedeId: string) => {
    setLoadingServices(true);
    try {
      const response = await servicioService.getServicesBySede(sedeId);
      
      const services: ServiceOption[] = response.results.map(service => ({
        value: service.id,
        label: `${service.service_code} - ${service.service_name}`,
        category: service.service_category,
        sede_name: service.sede_name,
      }));
      
      setAvailableServices(services);
      
      // Auto-select all services if duplicate_mode is 'all'
      if (formData.duplicate_mode === 'all') {
        setFormData(prev => ({
          ...prev,
          service_ids: services.map(s => s.value),
        }));
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const updatePreview = () => {
    if (formData.target_sede_ids.length === 0) {
      setPreviewData(null);
      return;
    }

    const servicesToDuplicate = formData.duplicate_mode === 'all' 
      ? availableServices.length 
      : formData.service_ids.length;

    setPreviewData({
      total_services: servicesToDuplicate,
      target_sedes: formData.target_sede_ids.length,
      estimated_duplications: servicesToDuplicate * formData.target_sede_ids.length,
    });
  };

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

    // Handle duplicate mode change
    if (field === 'duplicate_mode') {
      if (value === 'all') {
        setFormData(prev => ({
          ...prev,
          service_ids: availableServices.map(s => s.value),
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          service_ids: [],
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.source_sede_id) {
      errors.source_sede_id = 'Debe seleccionar una sede origen';
    }
    
    if (formData.target_sede_ids.length === 0) {
      errors.target_sede_ids = 'Debe seleccionar al menos una sede destino';
    }
    
    if (formData.target_sede_ids.includes(formData.source_sede_id)) {
      errors.target_sede_ids = 'La sede destino no puede ser la misma que la sede origen';
    }
    
    if (formData.duplicate_mode === 'selected' && formData.service_ids.length === 0) {
      errors.service_ids = 'Debe seleccionar al menos un servicio para duplicar';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await onSave(formData);
      } catch (error) {
        console.error('Error duplicating services:', error);
      }
    }
  };

  // Filter available target sedes (exclude source sede)
  const availableTargetSedes = sedeOptions.filter(
    sede => sede.value !== formData.source_sede_id
  );

  // Group services by category for better organization
  const servicesByCategory = availableServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceOption[]>);

  return (
    <Modal show={isOpen} onHide={onClose} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="ri-file-copy-line me-2"></i>
          Duplicar Servicios de Salud
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div className="mb-4">
          <Alert variant="info">
            <div className="d-flex">
              <i className="ri-information-line me-2 mt-1"></i>
              <div>
                <strong>¿Qué hace esta función?</strong>
                <p className="mb-0 mt-1">
                  Permite copiar servicios de salud desde una sede hacia otras sedes, 
                  incluyendo toda la configuración como personal, horarios y equipos.
                </p>
              </div>
            </div>
          </Alert>
        </div>

        <Row>
          {/* Sede Origen */}
          <Col lg={6}>
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-primary-subtle">
                <h6 className="card-title mb-0 text-primary">
                  <i className="ri-building-line me-2"></i>
                  Sede Origen
                </h6>
              </div>
              <div className="card-body">
                <Form.Group className="mb-3">
                  <Form.Label>Seleccionar Sede Origen <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={sedeOptions}
                    value={sedeOptions.find(option => option.value === formData.source_sede_id)}
                    onChange={(selected) => handleInputChange('source_sede_id', selected?.value || '')}
                    placeholder="Seleccionar sede origen..."
                    className={validationErrors.source_sede_id ? 'is-invalid' : ''}
                  />
                  {validationErrors.source_sede_id && (
                    <div className="invalid-feedback d-block">{validationErrors.source_sede_id}</div>
                  )}
                </Form.Group>

                {availableServices.length > 0 && (
                  <div>
                    <Form.Label className="fw-semibold">Servicios Disponibles:</Form.Label>
                    <div className="bg-light p-2 rounded">
                      <Badge bg="primary" className="me-1 mb-1">
                        Total: {availableServices.length}
                      </Badge>
                      {Object.keys(servicesByCategory).map(category => (
                        <Badge key={category} bg="light" text="dark" className="me-1 mb-1">
                          {category}: {servicesByCategory[category].length}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {loadingServices && (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm me-2"></div>
                    <span className="text-muted">Cargando servicios...</span>
                  </div>
                )}
              </div>
            </div>
          </Col>

          {/* Sedes Destino */}
          <Col lg={6}>
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-success-subtle">
                <h6 className="card-title mb-0 text-success">
                  <i className="ri-building-2-line me-2"></i>
                  Sedes Destino
                </h6>
              </div>
              <div className="card-body">
                <Form.Group className="mb-0">
                  <Form.Label>Seleccionar Sedes Destino <span className="text-danger">*</span></Form.Label>
                  <Select
                    isMulti
                    options={availableTargetSedes}
                    value={availableTargetSedes.filter(option => 
                      formData.target_sede_ids.includes(option.value)
                    )}
                    onChange={(selected) => 
                      handleInputChange('target_sede_ids', selected.map(s => s.value))
                    }
                    placeholder="Seleccionar sedes destino..."
                    className={validationErrors.target_sede_ids ? 'is-invalid' : ''}
                  />
                  {validationErrors.target_sede_ids && (
                    <div className="invalid-feedback d-block">{validationErrors.target_sede_ids}</div>
                  )}
                  <Form.Text className="text-muted">
                    Puede seleccionar múltiples sedes destino
                  </Form.Text>
                </Form.Group>
              </div>
            </div>
          </Col>
        </Row>

        {/* Configuración de Servicios */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-header bg-warning-subtle">
            <h6 className="card-title mb-0 text-warning">
              <i className="ri-settings-line me-2"></i>
              Configuración de Servicios
            </h6>
          </div>
          <div className="card-body">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Modo de Duplicación <span className="text-danger">*</span></Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      id="duplicate_all"
                      label="Duplicar todos los servicios de la sede"
                      name="duplicate_mode"
                      value="all"
                      checked={formData.duplicate_mode === 'all'}
                      onChange={(e) => handleInputChange('duplicate_mode', e.target.value)}
                      className="mb-2"
                    />
                    <Form.Check
                      type="radio"
                      id="duplicate_selected"
                      label="Seleccionar servicios específicos"
                      name="duplicate_mode"
                      value="selected"
                      checked={formData.duplicate_mode === 'selected'}
                      onChange={(e) => handleInputChange('duplicate_mode', e.target.value)}
                    />
                  </div>
                </Form.Group>

                {formData.duplicate_mode === 'selected' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Servicios a Duplicar <span className="text-danger">*</span></Form.Label>
                    <Select
                      isMulti
                      options={availableServices}
                      value={availableServices.filter(option => 
                        formData.service_ids.includes(option.value)
                      )}
                      onChange={(selected) => 
                        handleInputChange('service_ids', selected.map(s => s.value))
                      }
                      placeholder="Seleccionar servicios..."
                      className={validationErrors.service_ids ? 'is-invalid' : ''}
                      isDisabled={!formData.source_sede_id}
                    />
                    {validationErrors.service_ids && (
                      <div className="invalid-feedback d-block">{validationErrors.service_ids}</div>
                    )}
                  </Form.Group>
                )}
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Opciones de Duplicación</Form.Label>
                  
                  <Form.Check
                    type="checkbox"
                    id="update_existing"
                    label="Actualizar servicios existentes"
                    checked={formData.update_existing}
                    onChange={(e) => handleInputChange('update_existing', e.target.checked)}
                    className="mb-2"
                  />
                  <Form.Text className="text-muted d-block mb-3">
                    Si existe un servicio igual en la sede destino, lo actualizará
                  </Form.Text>

                  <Form.Check
                    type="checkbox"
                    id="copy_staff_info"
                    label="Copiar información de personal"
                    checked={formData.copy_staff_info}
                    onChange={(e) => handleInputChange('copy_staff_info', e.target.checked)}
                    className="mb-2"
                  />

                  <Form.Check
                    type="checkbox"
                    id="copy_operating_hours"
                    label="Copiar horarios de atención"
                    checked={formData.copy_operating_hours}
                    onChange={(e) => handleInputChange('copy_operating_hours', e.target.checked)}
                    className="mb-2"
                  />

                  <Form.Check
                    type="checkbox"
                    id="copy_equipment"
                    label="Copiar lista de equipos"
                    checked={formData.copy_equipment}
                    onChange={(e) => handleInputChange('copy_equipment', e.target.checked)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        </div>

        {/* Preview de la Duplicación */}
        {previewData && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-info-subtle">
              <h6 className="card-title mb-0 text-info">
                <i className="ri-eye-line me-2"></i>
                Vista Previa de la Duplicación
              </h6>
            </div>
            <div className="card-body">
              <Row className="text-center">
                <Col md={4}>
                  <div className="fs-4 fw-bold text-primary">{previewData.total_services}</div>
                  <div className="text-muted small">Servicios a Duplicar</div>
                </Col>
                <Col md={4}>
                  <div className="fs-4 fw-bold text-success">{previewData.target_sedes}</div>
                  <div className="text-muted small">Sedes Destino</div>
                </Col>
                <Col md={4}>
                  <div className="fs-4 fw-bold text-info">{previewData.estimated_duplications}</div>
                  <div className="text-muted small">Total de Duplicaciones</div>
                </Col>
              </Row>
              
              <Alert variant="info" className="mt-3 mb-0">
                <i className="ri-information-line me-2"></i>
                Se crearán <strong>{previewData.estimated_duplications}</strong> nuevos servicios 
                ({previewData.total_services} servicios × {previewData.target_sedes} sedes)
              </Alert>
            </div>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div className="text-muted small">
            {previewData 
              ? `${previewData.estimated_duplications} servicios serán duplicados`
              : 'Configure los parámetros de duplicación'
            }
          </div>
          
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            
            <Button 
              variant="success" 
              onClick={handleSubmit}
              disabled={isLoading || !previewData}
            >
              {isLoading && <span className="spinner-border spinner-border-sm me-2"></span>}
              <i className="ri-file-copy-line me-2"></i>
              Duplicar Servicios
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ServicioDuplicateModal;