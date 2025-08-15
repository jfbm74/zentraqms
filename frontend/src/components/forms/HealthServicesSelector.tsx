/**
 * Health Services Selector Component
 * 
 * Based on Velzon 4.4.1 FormSelect and advanced patterns
 * Handles Colombian health services selection with complexity validation
 */
import React, { useState, useEffect, useMemo } from "react";
import InfoTooltip from "../common/InfoTooltip";
import { useBootstrapTooltips } from "../../hooks/useBootstrapTooltips";

// Types for Colombian Health Services
interface HealthService {
  codigo: string;
  nombre: string;
  grupo: string;
  grupo_display: string;
  complejidad_minima: string;
  descripcion: string;
}

interface SelectedService {
  codigo_servicio: string;
  nombre_servicio: string;
  grupo_servicio: string;
  fecha_habilitacion?: string;
  fecha_vencimiento?: string;
  modalidad?: string;
  observaciones?: string;
}

interface HealthServicesSelectorProps {
  selectedServices: SelectedService[];
  nivelComplejidad: string;
  onChange: (services: SelectedService[]) => void;
  onLoadServices?: () => Promise<HealthService[]>;
  onValidateServices?: (services: SelectedService[], nivel: string) => Promise<{
    validation_results: any[];
    summary: any;
  }>;
  className?: string;
  disabled?: boolean;
}

// Service groups configuration
const SERVICE_GROUPS = [
  { value: 'consulta_externa', label: 'Consulta Externa', icon: 'ri-user-heart-line', color: 'primary' },
  { value: 'apoyo_diagnostico', label: 'Apoyo Diagnóstico', icon: 'ri-microscope-line', color: 'info' },
  { value: 'quirurgicos', label: 'Quirúrgicos', icon: 'ri-surgical-mask-line', color: 'warning' },
  { value: 'internacion', label: 'Internación', icon: 'ri-hotel-bed-line', color: 'success' },
  { value: 'cuidados_intensivos', label: 'Cuidados Intensivos', icon: 'ri-heart-pulse-line', color: 'danger' },
  { value: 'urgencias', label: 'Urgencias', icon: 'ri-alarm-warning-line', color: 'warning' },
  { value: 'otros', label: 'Otros', icon: 'ri-more-line', color: 'secondary' }
];

const MODALIDAD_OPTIONS = [
  { value: 'intramural', label: 'Intramural' },
  { value: 'extramural', label: 'Extramural' },
  { value: 'telemedicina', label: 'Telemedicina' },
  { value: 'domiciliaria', label: 'Domiciliaria' }
];

const HealthServicesSelector: React.FC<HealthServicesSelectorProps> = ({
  selectedServices,
  nivelComplejidad,
  onChange,
  onLoadServices,
  onValidateServices,
  className = "",
  disabled = false
}) => {
  const [availableServices, setAvailableServices] = useState<HealthService[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState<Partial<SelectedService>>({
    modalidad: 'intramural',
    fecha_habilitacion: new Date().toISOString().split('T')[0]
  });

  // Initialize Bootstrap tooltips
  useBootstrapTooltips([], {
    placement: 'top',
    trigger: 'hover focus'
  });

  // Load available services
  useEffect(() => {
    if (onLoadServices) {
      setLoading(true);
      onLoadServices()
        .then(setAvailableServices)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [onLoadServices]);

  // Filter services based on complexity, group and search
  const filteredServices = useMemo(() => {
    let filtered = availableServices;

    // Filter by complexity level (only show services the organization can provide)
    if (nivelComplejidad) {
      const complexityMap: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };
      const orgLevel = complexityMap[nivelComplejidad] || 0;
      
      filtered = filtered.filter(service => {
        const serviceLevel = complexityMap[service.complejidad_minima] || 0;
        return serviceLevel <= orgLevel;
      });
    }

    // Filter by selected group
    if (selectedGroup) {
      filtered = filtered.filter(service => service.grupo === selectedGroup);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(service => 
        service.nombre.toLowerCase().includes(term) ||
        service.codigo.includes(term) ||
        service.descripcion.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [availableServices, nivelComplejidad, selectedGroup, searchTerm]);

  // Group services by group for display
  const servicesByGroup = useMemo(() => {
    const grouped: Record<string, HealthService[]> = {};
    filteredServices.forEach(service => {
      if (!grouped[service.grupo]) {
        grouped[service.grupo] = [];
      }
      grouped[service.grupo].push(service);
    });
    return grouped;
  }, [filteredServices]);

  // Check if service is already selected
  const isServiceSelected = (codigo: string) => {
    return selectedServices.some(s => s.codigo_servicio === codigo);
  };

  // Add service to selection
  const addService = (service: HealthService) => {
    if (isServiceSelected(service.codigo)) return;

    const newSelectedService: SelectedService = {
      codigo_servicio: service.codigo,
      nombre_servicio: service.nombre,
      grupo_servicio: service.grupo,
      modalidad: 'intramural',
      fecha_habilitacion: new Date().toISOString().split('T')[0]
    };

    onChange([...selectedServices, newSelectedService]);
  };

  // Remove service from selection
  const removeService = (codigo: string) => {
    onChange(selectedServices.filter(s => s.codigo_servicio !== codigo));
  };

  // Update service details
  const updateService = (codigo: string, updates: Partial<SelectedService>) => {
    onChange(selectedServices.map(service => 
      service.codigo_servicio === codigo ? { ...service, ...updates } : service
    ));
  };

  // Validate services with backend
  const validateServices = async () => {
    if (!onValidateServices || selectedServices.length === 0) return;

    setValidationLoading(true);
    try {
      const result = await onValidateServices(selectedServices, nivelComplejidad);
      setValidationResults(result);
    } catch (error) {
      console.error('Error validating services:', error);
    } finally {
      setValidationLoading(false);
    }
  };

  // Handle adding service from modal
  const handleAddService = () => {
    if (!newService.codigo_servicio || !newService.nombre_servicio) {
      return;
    }

    // Check if service already exists
    if (isServiceSelected(newService.codigo_servicio)) {
      return;
    }

    const serviceToAdd: SelectedService = {
      codigo_servicio: newService.codigo_servicio,
      nombre_servicio: newService.nombre_servicio,
      grupo_servicio: newService.grupo_servicio || 'otros',
      modalidad: newService.modalidad || 'intramural',
      fecha_habilitacion: newService.fecha_habilitacion || new Date().toISOString().split('T')[0],
      observaciones: newService.observaciones
    };

    onChange([...selectedServices, serviceToAdd]);
    setShowAddModal(false);
    setNewService({
      modalidad: 'intramural',
      fecha_habilitacion: new Date().toISOString().split('T')[0]
    });
  };

  // Reset modal when closing
  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewService({
      modalidad: 'intramural',
      fecha_habilitacion: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className={`health-services-selector ${className}`}>
      <div className="mb-4">
        <h5 className="mb-1">
          <i className="ri-health-book-line me-2 text-primary"></i>
          Servicios de Salud Habilitados
        </h5>
        <p className="text-muted">
          Seleccione los servicios que prestará su institución según su nivel de complejidad ({nivelComplejidad})
        </p>
      </div>

      {/* Add Service Button */}
      <div className="text-center mb-4">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => setShowAddModal(true)}
          disabled={disabled}
        >
          <i className="ri-add-line me-2"></i>
          Agregar Servicio de Salud
        </button>
        <p className="text-muted mt-2">
          Agregue los servicios que prestará su institución según su nivel de complejidad ({nivelComplejidad})
        </p>
      </div>

      {/* Selected Services */}
      {selectedServices.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-success bg-opacity-10">
            <div className="row align-items-center">
              <div className="col">
                <h6 className="mb-0 text-success">
                  <i className="ri-checkbox-circle-line me-2"></i>
                  Servicios Seleccionados
                  <span className="badge bg-success ms-2">{selectedServices.length}</span>
                </h6>
              </div>
              <div className="col-auto">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => onChange([])}
                  disabled={disabled}
                >
                  <i className="ri-delete-bin-line me-1"></i>
                  Limpiar Todo
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Servicio</th>
                    <th>Grupo</th>
                    <th>Modalidad</th>
                    <th>Fecha Habilitación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedServices.map((service, index) => (
                    <tr key={service.codigo_servicio}>
                      <td>
                        <code className="text-primary">{service.codigo_servicio}</code>
                      </td>
                      <td>
                        <span className="font-size-13">{service.nombre_servicio}</span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {SERVICE_GROUPS.find(g => g.value === service.grupo_servicio)?.label || service.grupo_servicio}
                        </span>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={service.modalidad || 'intramural'}
                          onChange={(e) => updateService(service.codigo_servicio, { modalidad: e.target.value })}
                          disabled={disabled}
                        >
                          {MODALIDAD_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={service.fecha_habilitacion || ''}
                          onChange={(e) => updateService(service.codigo_servicio, { fecha_habilitacion: e.target.value })}
                          disabled={disabled}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeService(service.codigo_servicio)}
                          disabled={disabled}
                          data-bs-toggle="tooltip"
                          title="Remover servicio"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* Add Service Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-add-line me-2 text-primary"></i>
                  Agregar Servicio de Salud
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Código del Servicio <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: 105, 106, 201..."
                        value={newService.codigo_servicio || ''}
                        onChange={(e) => setNewService(prev => ({ ...prev, codigo_servicio: e.target.value }))}
                      />
                      <div className="form-text">
                        Código oficial según clasificación de servicios de salud
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        Grupo de Servicio <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={newService.grupo_servicio || ''}
                        onChange={(e) => setNewService(prev => ({ ...prev, grupo_servicio: e.target.value }))}
                      >
                        <option value="">Seleccione un grupo...</option>
                        {SERVICE_GROUPS.map(group => (
                          <option key={group.value} value={group.value}>
                            {group.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Nombre del Servicio <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Cuidado Intensivo Adultos, Cirugía Cardiovascular..."
                    value={newService.nombre_servicio || ''}
                    onChange={(e) => setNewService(prev => ({ ...prev, nombre_servicio: e.target.value }))}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Modalidad</label>
                      <select
                        className="form-select"
                        value={newService.modalidad || 'intramural'}
                        onChange={(e) => setNewService(prev => ({ ...prev, modalidad: e.target.value }))}
                      >
                        {MODALIDAD_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Fecha de Habilitación</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newService.fecha_habilitacion || ''}
                        onChange={(e) => setNewService(prev => ({ ...prev, fecha_habilitacion: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Observaciones</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Observaciones adicionales sobre el servicio..."
                    value={newService.observaciones || ''}
                    onChange={(e) => setNewService(prev => ({ ...prev, observaciones: e.target.value }))}
                  ></textarea>
                </div>

                {/* Validation Alert */}
                {newService.codigo_servicio && isServiceSelected(newService.codigo_servicio) && (
                  <div className="alert alert-warning">
                    <i className="ri-alert-line me-2"></i>
                    Este servicio ya está agregado
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddService}
                  disabled={!newService.codigo_servicio || !newService.nombre_servicio || isServiceSelected(newService.codigo_servicio || '')}
                >
                  <i className="ri-add-line me-1"></i>
                  Agregar Servicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthServicesSelector;