/**
 * Step 3b: Health Organization Data Component (Conditional)
 *
 * Only shown when organization sector is "salud" in Step 3
 * Based on Velzon 4.4.1 patterns
 */
import React from "react";
import HealthOrganizationForm from "../../forms/HealthOrganizationForm";
import { useRepsValidation } from "../../../hooks/useRepsValidation";
import { useBootstrapTooltips } from "../../../hooks/useBootstrapTooltips";

// Types for Health Organization in wizard context
interface HealthOrganizationData {
  // REPS Information
  codigo_prestador: string;
  verificado_reps: boolean;
  fecha_verificacion_reps?: string;
  datos_reps?: Record<string, unknown>;
  
  // Classification
  naturaleza_juridica: string;
  tipo_prestador: string;
  nivel_complejidad: string;
  
  // Legal Representative
  representante_tipo_documento: string;
  representante_numero_documento: string;
  representante_nombre_completo: string;
  representante_telefono: string;
  representante_email: string;
  
  // Qualification Information
  fecha_habilitacion?: string;
  resolucion_habilitacion?: string;
  registro_especial?: string;
  
  // Additional Information
  observaciones_salud?: string;
}

interface Step3bProps {
  data: Partial<HealthOrganizationData>;
  errors: Partial<HealthOrganizationData>;
  onChange: (data: Partial<HealthOrganizationData>) => void;
  organizationName?: string;
  selectedSector?: string;
  showIntroduction?: boolean;
}

const Step3bHealthOrganization: React.FC<Step3bProps> = ({
  data,
  errors,
  onChange,
  organizationName = "",
  selectedSector = "",
  showIntroduction = true
}) => {
  const { validateReps } = useRepsValidation();

  // Initialize Bootstrap tooltips
  useBootstrapTooltips([data, errors], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 200, hide: 100 },
    animation: true
  });

  // Handle REPS validation
  const handleValidateReps = async (codigo: string) => {
    try {
      const result = await validateReps(codigo);
      return result;
    } catch (error) {
      console.error('Error validating REPS:', error);
      return { valid: false, error: 'Error al validar REPS' };
    }
  };

  return (
    <div className="health-organization-step">
      {showIntroduction && (
        <div className="mb-4">
          <div className="alert alert-info border-0 shadow-sm">
            <div className="d-flex align-items-start">
              <div className="flex-shrink-0">
                <i className="ri-hospital-line text-info" style={{ fontSize: '2rem' }}></i>
              </div>
              <div className="flex-grow-1 ms-3">
                <h5 className="alert-heading mb-2">
                  Configuración para el Sector Salud
                </h5>
                <p className="mb-2">
                  Has seleccionado <strong>"{selectedSector}"</strong> como sector económico para <strong>{organizationName}</strong>.
                  Ahora necesitamos información específica requerida por la normatividad colombiana para instituciones de salud.
                </p>
                <hr className="my-3" />
                <div className="row text-center">
                  <div className="col-md-4">
                    <div className="p-2">
                      <i className="ri-shield-check-line text-success mb-1 d-block" style={{ fontSize: '1.5rem' }}></i>
                      <small className="text-muted">
                        <strong>REPS</strong><br />
                        Registro Especial de Prestadores
                      </small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-2">
                      <i className="ri-building-line text-info mb-1 d-block" style={{ fontSize: '1.5rem' }}></i>
                      <small className="text-muted">
                        <strong>Clasificación</strong><br />
                        Tipo y nivel de complejidad
                      </small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-2">
                      <i className="ri-user-3-line text-warning mb-1 d-block" style={{ fontSize: '1.5rem' }}></i>
                      <small className="text-muted">
                        <strong>Representante</strong><br />
                        Información legal requerida
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Paso 3b: Información de Salud</h5>
          <div className="d-flex align-items-center gap-2">
            <div className="badge bg-primary-subtle text-primary px-3 py-2">
              <i className="ri-hospital-line me-1"></i>
              Sector Salud
            </div>
            <div className="badge bg-info-subtle text-info px-3 py-2">
              <i className="ri-settings-3-line me-1"></i>
              Configuración Inicial
            </div>
          </div>
        </div>
        <div className="progress" style={{ height: '3px' }}>
          <div 
            className="progress-bar bg-primary" 
            role="progressbar" 
            style={{ width: '70%' }}
            aria-valuenow={70} 
            aria-valuemin={0} 
            aria-valuemax={100}
          ></div>
        </div>
        <small className="text-muted mt-1 d-block">
          Esta información se utilizará para configurar automáticamente los módulos QMS apropiados
        </small>
      </div>

      {/* Health Organization Form */}
      <HealthOrganizationForm
        data={data}
        errors={errors}
        onChange={onChange}
        onValidateReps={handleValidateReps}
        className="wizard-health-form"
      />

      {/* Integration Notice */}
      <div className="mt-4">
        <div className="card border-0 bg-light">
          <div className="card-body p-3">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h6 className="card-title mb-1">
                  <i className="ri-lightbulb-line me-2 text-warning"></i>
                  Configuración Automática del QMS
                </h6>
                <p className="card-text mb-0">
                  <small className="text-muted">
                    Basándose en esta información, ZentraQMS configurará automáticamente los módulos 
                    específicos para instituciones de salud, incluyendo PAMEC, SUH, y SOGCS según aplique.
                  </small>
                </p>
              </div>
              <div className="col-md-4 text-center">
                <div className="d-flex justify-content-center align-items-center gap-2">
                  <div className="text-center">
                    <i className="ri-cpu-line text-primary" style={{ fontSize: '1.5rem' }}></i>
                    <br />
                    <small className="text-muted">QMS Inteligente</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-3">
        <div className="card border-0 bg-light">
          <div className="card-body p-3">
            <h6 className="card-title mb-2">
              <i className="ri-question-line me-2 text-primary"></i>
              ¿Necesita ayuda?
            </h6>
            <div className="row">
              <div className="col-md-6">
                <p className="card-text mb-2">
                  <small className="text-muted">
                    <strong>Código REPS:</strong> Puede encontrarlo en su certificado de habilitación 
                    o consultarlo en el portal del Ministerio de Salud.
                  </small>
                </p>
              </div>
              <div className="col-md-6">
                <p className="card-text mb-2">
                  <small className="text-muted">
                    <strong>Nivel de Complejidad:</strong> Determine según los servicios que presta 
                    y la tecnología disponible en su institución.
                  </small>
                </p>
              </div>
            </div>
            <div className="row">
              <div className="col-12">
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <a 
                    href="https://prestadores.minsalud.gov.co/habilitacion/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary btn-sm"
                  >
                    <i className="ri-external-link-line me-1"></i>
                    Portal Habilitación
                  </a>
                  <a 
                    href="https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/CA/Guia-habilitacion-prestadores.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline-info btn-sm"
                  >
                    <i className="ri-file-text-line me-1"></i>
                    Guía de Habilitación
                  </a>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#healthHelpModal"
                  >
                    <i className="ri-customer-service-2-line me-1"></i>
                    Soporte
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Summary (if data exists) */}
      {data.codigo_prestador && (
        <div className="mt-3">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-success bg-opacity-10 py-2">
              <div className="d-flex align-items-center">
                <i className="ri-checkbox-circle-line text-success me-2"></i>
                <h6 className="mb-0">Resumen de Configuración</h6>
              </div>
            </div>
            <div className="card-body p-3">
              <div className="row g-2">
                <div className="col-md-3">
                  <div className="text-center p-2 border rounded">
                    <i className={`ri-${data.verificado_reps ? 'checkbox-circle' : 'time'}-line text-${data.verificado_reps ? 'success' : 'warning'} d-block mb-1`} style={{ fontSize: '1.2rem' }}></i>
                    <small className="text-muted">
                      <strong>REPS</strong><br />
                      {data.verificado_reps ? 'Verificado' : 'Pendiente'}
                    </small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-2 border rounded">
                    <i className={`ri-${data.naturaleza_juridica ? 'building' : 'building-2'}-line text-${data.naturaleza_juridica ? 'success' : 'muted'} d-block mb-1`} style={{ fontSize: '1.2rem' }}></i>
                    <small className="text-muted">
                      <strong>Naturaleza</strong><br />
                      {data.naturaleza_juridica || 'Pendiente'}
                    </small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-2 border rounded">
                    <i className={`ri-${data.nivel_complejidad ? 'award' : 'award-2'}-line text-${data.nivel_complejidad ? 'success' : 'muted'} d-block mb-1`} style={{ fontSize: '1.2rem' }}></i>
                    <small className="text-muted">
                      <strong>Complejidad</strong><br />
                      {data.nivel_complejidad ? `Nivel ${data.nivel_complejidad}` : 'Pendiente'}
                    </small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-center p-2 border rounded">
                    <i className={`ri-${data.representante_nombre_completo ? 'user-3' : 'user-add'}-line text-${data.representante_nombre_completo ? 'success' : 'muted'} d-block mb-1`} style={{ fontSize: '1.2rem' }}></i>
                    <small className="text-muted">
                      <strong>Representante</strong><br />
                      {data.representante_nombre_completo ? 'Completado' : 'Pendiente'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3bHealthOrganization;