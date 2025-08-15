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
  const [newService, setNewService] = useState<Partial<SelectedService>>({});

  // Initialize Bootstrap tooltips
  useBootstrapTooltips([selectedServices, validationResults], {
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

  // Auto-validate when services or complexity level changes
  useEffect(() => {
    if (selectedServices.length > 0 && nivelComplejidad) {
      const timeoutId = setTimeout(validateServices, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedServices, nivelComplejidad]);

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

      {/* Service Browser */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light">
          <div className="row align-items-center">
            <div className="col">
              <h6 className="mb-0">
                <i className="ri-search-line me-2"></i>
                Catálogo de Servicios
              </h6>
            </div>
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={validateServices}
                disabled={validationLoading || selectedServices.length === 0}
              >
                {validationLoading && (
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                )}
                <i className="ri-shield-check-line me-1"></i>
                Validar Servicios
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {/* Filters */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Filtrar por Grupo</label>
              <select
                className="form-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                disabled={disabled}
              >
                <option value="">Todos los grupos</option>
                {SERVICE_GROUPS.map(group => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Buscar Servicio</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="ri-search-line"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={disabled}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="ri-close-line"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Service Groups */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando servicios...</span>
              </div>
              <p className="text-muted mt-2">Cargando catálogo de servicios...</p>
            </div>
          ) : (
            <div className="row">
              {Object.entries(servicesByGroup).map(([grupo, services]) => {
                const groupConfig = SERVICE_GROUPS.find(g => g.value === grupo);
                return (
                  <div key={grupo} className="col-12 mb-4">
                    <div className="card border-start border-3" style={{borderLeftColor: `var(--bs-${groupConfig?.color || 'primary'})`}}>
                      <div className="card-header py-2">
                        <h6 className="mb-0">
                          <i className={`${groupConfig?.icon || 'ri-service-line'} me-2 text-${groupConfig?.color || 'primary'}`}></i>
                          {groupConfig?.label || grupo}
                          <span className="badge bg-light text-dark ms-2">{services.length}</span>
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          {services.map(service => (
                            <div key={service.codigo} className="col-md-6 col-lg-4 mb-2">
                              <div className={`border rounded p-2 h-100 ${isServiceSelected(service.codigo) ? 'border-success bg-light' : 'border-light'}`}>
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <div className="flex-grow-1">
                                    <h6 className="mb-1 font-size-14">
                                      <code className="text-primary">{service.codigo}</code>
                                    </h6>
                                    <p className="mb-1 font-size-13">{service.nombre}</p>
                                    <small className="text-muted">
                                      Mín. Nivel {service.complejidad_minima}
                                    </small>
                                  </div>
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${isServiceSelected(service.codigo) ? 'btn-success' : 'btn-outline-primary'}`}
                                    onClick={() => isServiceSelected(service.codigo) ? removeService(service.codigo) : addService(service)}
                                    disabled={disabled}
                                    data-bs-toggle="tooltip"
                                    title={isServiceSelected(service.codigo) ? 'Remover servicio' : 'Agregar servicio'}
                                  >
                                    <i className={`ri-${isServiceSelected(service.codigo) ? 'check' : 'add'}-line`}></i>
                                  </button>
                                </div>
                                {service.descripcion && (
                                  <p className="mb-0 font-size-12 text-muted">{service.descripcion}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredServices.length === 0 && !loading && (
            <div className="text-center py-4">
              <i className="ri-search-line text-muted" style={{fontSize: '3rem'}}></i>
              <p className="text-muted mt-2">
                {searchTerm || selectedGroup ? 'No se encontraron servicios con los filtros aplicados' : 'No hay servicios disponibles'}
              </p>
            </div>
          )}
        </div>
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

      {/* Validation Results */}
      {validationResults && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-info bg-opacity-10">
            <h6 className="mb-0 text-info">
              <i className="ri-shield-check-line me-2"></i>
              Resultado de Validación
            </h6>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-3">
                <div className="text-center">
                  <h4 className="text-primary mb-1">{validationResults.summary?.total_services || 0}</h4>
                  <small className="text-muted">Total Servicios</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <h4 className="text-success mb-1">{validationResults.summary?.valid_services || 0}</h4>
                  <small className="text-muted">Válidos</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <h4 className="text-warning mb-1">{validationResults.summary?.invalid_services || 0}</h4>
                  <small className="text-muted">Con Alertas</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center">
                  <div className={`badge ${validationResults.summary?.overall_valid ? 'bg-success' : 'bg-warning'} p-2`}>
                    <i className={`ri-${validationResults.summary?.overall_valid ? 'check' : 'alert'}-line me-1`}></i>
                    {validationResults.summary?.overall_valid ? 'Válido' : 'Revisar'}
                  </div>
                </div>
              </div>
            </div>

            {validationResults.validation_results && validationResults.validation_results.length > 0 && (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Servicio</th>
                      <th>Estado</th>
                      <th>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.validation_results.map((result: any, index: number) => (
                      <tr key={index}>
                        <td>
                          <code>{result.codigo_servicio}</code>
                        </td>
                        <td>{result.nombre_servicio}</td>
                        <td>
                          <span className={`badge ${result.is_valid ? 'bg-success' : 'bg-warning'}`}>
                            <i className={`ri-${result.is_valid ? 'check' : 'alert'}-line me-1`}></i>
                            {result.is_valid ? 'Válido' : 'Alerta'}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">{result.reason}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthServicesSelector;