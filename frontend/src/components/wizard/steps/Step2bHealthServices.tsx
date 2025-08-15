/**
 * Step 2b: Health Services Selection (Conditional)
 *
 * Only shown when organization sector is "salud"
 * Based on Velzon 4.4.1 patterns
 */
import React, { useState } from "react";
import HealthServicesSelector from "../../forms/HealthServicesSelector";
import { useHealthServices } from "../../../hooks/useHealthServices";
import { useBootstrapTooltips } from "../../../hooks/useBootstrapTooltips";

// Types for Health Services in wizard context
interface SelectedService {
  codigo_servicio: string;
  nombre_servicio: string;
  grupo_servicio: string;
  fecha_habilitacion?: string;
  fecha_vencimiento?: string;
  modalidad?: string;
  observaciones?: string;
}

interface Step2bProps {
  selectedServices: SelectedService[];
  nivelComplejidad: string;
  organizationName?: string;
  onChange: (services: SelectedService[]) => void;
  showIntroduction?: boolean;
}

const Step2bHealthServices: React.FC<Step2bProps> = ({
  selectedServices,
  nivelComplejidad,
  organizationName = "",
  onChange,
  showIntroduction = true
}) => {
  const { loadServicesCatalog, validateServices } = useHealthServices();
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize Bootstrap tooltips
  useBootstrapTooltips([], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 200, hide: 100 },
    animation: true
  });

  // Handle services loading
  const handleLoadServices = async () => {
    try {
      return await loadServicesCatalog();
    } catch (error) {
      console.error('Error loading services:', error);
      return [];
    }
  };

  // Handle services validation
  const handleValidateServices = async (services: SelectedService[], nivel: string) => {
    try {
      return await validateServices(services, nivel);
    } catch (error) {
      console.error('Error validating services:', error);
      throw error;
    }
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (selectedServices.length === 0) return 0;
    if (selectedServices.length < 3) return 33;
    if (selectedServices.length < 6) return 66;
    return 100;
  };

  // Get status message
  const getStatusMessage = () => {
    if (selectedServices.length === 0) {
      return "Seleccione al menos un servicio básico para continuar";
    }
    if (selectedServices.length < 3) {
      return "Agregue más servicios según la capacidad de su institución";
    }
    if (selectedServices.length < 6) {
      return "Perfil de servicios bien definido, puede agregar servicios adicionales";
    }
    return "Excelente selección de servicios para su nivel de complejidad";
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="health-services-step">
      {showIntroduction && (
        <div className="mb-4">
          <div className="alert alert-primary border-0 shadow-sm">
            <div className="d-flex align-items-start">
              <div className="flex-shrink-0">
                <i className="ri-health-book-line text-primary" style={{ fontSize: '2rem' }}></i>
              </div>
              <div className="flex-grow-1 ms-3">
                <h5 className="alert-heading mb-2">
                  Configuración de Servicios de Salud
                </h5>
                <p className="mb-2">
                  Configure los servicios que <strong>{organizationName}</strong> prestará según su 
                  nivel de complejidad <strong>{nivelComplejidad}</strong>.
                </p>
                <p className="mb-0">
                  Esta configuración determinará qué módulos QMS se activarán y cómo se 
                  estructurarán los procesos de calidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Paso 2b: Servicios de Salud</h5>
          <div className="d-flex align-items-center gap-2">
            <div className="badge bg-info-subtle text-info px-3 py-2">
              <i className="ri-award-line me-1"></i>
              Nivel {nivelComplejidad}
            </div>
            <div className="badge bg-success-subtle text-success px-3 py-2">
              <i className="ri-service-line me-1"></i>
              {selectedServices.length} Servicios
            </div>
          </div>
        </div>
        <div className="progress" style={{ height: '3px' }}>
          <div 
            className="progress-bar bg-primary" 
            role="progressbar" 
            style={{ width: '50%' }}
            aria-valuenow={50} 
            aria-valuemin={0} 
            aria-valuemax={100}
          ></div>
        </div>
        <small className="text-muted mt-1 d-block">
          {getStatusMessage()}
        </small>
      </div>

      {/* Completion Status */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row align-items-center">
            <div className="col-md-3">
              <div className="text-center">
                <div className="position-relative d-inline-block">
                  <div 
                    className="progress mx-auto" 
                    style={{ width: '60px', height: '60px', background: 'transparent' }}
                  >
                    <svg width="60" height="60" className="position-absolute top-0 start-0">
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke="#e9ecef"
                        strokeWidth="4"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke="#0d6efd"
                        strokeWidth="4"
                        strokeDasharray={`${(completionPercentage / 100) * 157} 157`}
                        strokeLinecap="round"
                        transform="rotate(-90 30 30)"
                      />
                    </svg>
                    <div className="position-absolute top-50 start-50 translate-middle">
                      <small className="fw-bold text-primary">{completionPercentage}%</small>
                    </div>
                  </div>
                </div>
                <p className="mb-0 mt-2">
                  <small className="text-muted">Completado</small>
                </p>
              </div>
            </div>
            <div className="col-md-9">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="text-center p-2 border rounded">
                    <i className="ri-hospital-line text-info d-block mb-1" style={{ fontSize: '1.2rem' }}></i>
                    <small className="text-muted">
                      <strong>Institución</strong><br />
                      Nivel {nivelComplejidad}
                    </small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-2 border rounded">
                    <i className="ri-service-line text-success d-block mb-1" style={{ fontSize: '1.2rem' }}></i>
                    <small className="text-muted">
                      <strong>Servicios</strong><br />
                      {selectedServices.length} Seleccionados
                    </small>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="text-center p-2 border rounded">
                    <i className="ri-file-list-3-line text-warning d-block mb-1" style={{ fontSize: '1.2rem' }}></i>
                    <small className="text-muted">
                      <strong>Grupos</strong><br />
                      {new Set(selectedServices.map(s => s.grupo_servicio)).size} Diferentes
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Selector */}
      <HealthServicesSelector
        selectedServices={selectedServices}
        nivelComplejidad={nivelComplejidad}
        onChange={onChange}
        onLoadServices={handleLoadServices}
        onValidateServices={handleValidateServices}
        className="wizard-services-selector"
      />

      {/* Service Groups Summary */}
      {selectedServices.length > 0 && (
        <div className="mt-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-light py-2">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="ri-pie-chart-line me-2 text-primary"></i>
                  Resumen por Grupos de Servicios
                </h6>
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <i className={`ri-${isExpanded ? 'subtract' : 'add'}-line`}></i>
                </button>
              </div>
            </div>
            {(isExpanded || selectedServices.length <= 6) && (
              <div className="card-body p-3">
                <div className="row g-2">
                  {Object.entries(
                    selectedServices.reduce((acc, service) => {
                      const grupo = service.grupo_servicio;
                      if (!acc[grupo]) acc[grupo] = [];
                      acc[grupo].push(service);
                      return acc;
                    }, {} as Record<string, SelectedService[]>)
                  ).map(([grupo, services]) => (
                    <div key={grupo} className="col-md-6 col-lg-4">
                      <div className="border rounded p-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <h6 className="mb-0 font-size-13 text-capitalize">
                            {grupo.replace('_', ' ')}
                          </h6>
                          <span className="badge bg-primary-subtle text-primary">
                            {services.length}
                          </span>
                        </div>
                        <div className="text-muted">
                          {services.slice(0, 2).map(service => (
                            <div key={service.codigo_servicio} className="font-size-12">
                              <code className="text-primary">{service.codigo_servicio}</code> {service.nombre_servicio}
                            </div>
                          ))}
                          {services.length > 2 && (
                            <div className="font-size-12 text-muted">
                              +{services.length - 2} más...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {nivelComplejidad && (
        <div className="mt-4">
          <div className="card border-0 bg-light">
            <div className="card-body p-3">
              <h6 className="card-title mb-2">
                <i className="ri-lightbulb-line me-2 text-warning"></i>
                Recomendaciones para Nivel {nivelComplejidad}
              </h6>
              
              {nivelComplejidad === 'I' && (
                <div className="alert alert-info py-2 mb-2">
                  <small>
                    <strong>Nivel I (Baja Complejidad):</strong> Enfóquese en servicios de 
                    consulta externa, medicina general, y servicios básicos de apoyo diagnóstico.
                  </small>
                </div>
              )}
              
              {nivelComplejidad === 'II' && (
                <div className="alert alert-info py-2 mb-2">
                  <small>
                    <strong>Nivel II (Mediana Complejidad):</strong> Puede incluir especialidades 
                    básicas, cirugía ambulatoria, y servicios de hospitalización.
                  </small>
                </div>
              )}
              
              {(nivelComplejidad === 'III' || nivelComplejidad === 'IV') && (
                <div className="alert alert-info py-2 mb-2">
                  <small>
                    <strong>Nivel {nivelComplejidad} (Alta/Máxima Complejidad):</strong> Puede ofrecer 
                    todos los servicios especializados, UCI, y procedimientos de alta complejidad.
                  </small>
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 mt-2">
                <a 
                  href="https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/CA/Resolucion-3100-2019-cups.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm"
                >
                  <i className="ri-external-link-line me-1"></i>
                  Resolución 3100/2019
                </a>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#servicesHelpModal"
                >
                  <i className="ri-question-line me-1"></i>
                  Ayuda con Servicios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2bHealthServices;