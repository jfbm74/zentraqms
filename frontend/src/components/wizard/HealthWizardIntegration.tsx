/**
 * Health Wizard Integration Component
 *
 * Manages conditional display of health-specific wizard steps
 * Based on sector selection in Step 3
 */
import React from "react";
import Step3bHealthOrganization from "./steps/Step3bHealthOrganization";
import Step3cHealthServices from "./steps/Step3cHealthServices";

// Types
interface HealthOrganizationData {
  codigo_prestador: string;
  verificado_reps: boolean;
  fecha_verificacion_reps?: string;
  datos_reps?: Record<string, unknown>;
  naturaleza_juridica: string;
  tipo_prestador: string;
  nivel_complejidad: string;
  representante_tipo_documento: string;
  representante_numero_documento: string;
  representante_nombre_completo: string;
  representante_telefono: string;
  representante_email: string;
  fecha_habilitacion?: string;
  resolucion_habilitacion?: string;
  registro_especial?: string;
  observaciones_salud?: string;
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

interface HealthWizardIntegrationProps {
  // Current wizard state
  currentStep: number;
  selectedSector?: string;
  organizationName?: string;
  
  // Health organization data
  healthData: Partial<HealthOrganizationData>;
  healthErrors: Partial<HealthOrganizationData>;
  onHealthDataChange: (data: Partial<HealthOrganizationData>) => void;
  
  // Health services data
  selectedServices: SelectedService[];
  onServicesChange: (services: SelectedService[]) => void;
  
  // Navigation functions
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void;
}

// Health step mapping
const HEALTH_STEPS = {
  ORGANIZATION_INFO: 'health-org-info',
  SERVICES_SELECTION: 'health-services'
};

const HealthWizardIntegration: React.FC<HealthWizardIntegrationProps> = ({
  currentStep,
  selectedSector,
  organizationName,
  healthData,
  healthErrors,
  onHealthDataChange,
  selectedServices,
  onServicesChange,
  onNext,
  onPrevious,
  onSkip
}) => {
  // Check if we should show health steps
  const isHealthSector = selectedSector === 'salud';
  
  // Determine which health step to show
  const getHealthStep = () => {
    // This logic would be integrated with the main wizard's step management
    // For now, we'll use a simple approach based on completion status
    const hasBasicHealthInfo = healthData.codigo_prestador && 
                               healthData.naturaleza_juridica && 
                               healthData.nivel_complejidad;
    
    if (!hasBasicHealthInfo) {
      return HEALTH_STEPS.ORGANIZATION_INFO;
    }
    
    return HEALTH_STEPS.SERVICES_SELECTION;
  };
  
  // Don't render anything if not health sector
  if (!isHealthSector) {
    return null;
  }
  
  const currentHealthStep = getHealthStep();
  
  // Validation functions
  const validateHealthOrganization = () => {
    const errors: Partial<HealthOrganizationData> = {};
    
    if (!healthData.codigo_prestador) {
      errors.codigo_prestador = 'El código REPS es requerido';
    }
    
    if (!healthData.naturaleza_juridica) {
      errors.naturaleza_juridica = 'La naturaleza jurídica es requerida';
    }
    
    if (!healthData.tipo_prestador) {
      errors.tipo_prestador = 'El tipo de prestador es requerido';
    }
    
    if (!healthData.nivel_complejidad) {
      errors.nivel_complejidad = 'El nivel de complejidad es requerido';
    }
    
    if (!healthData.representante_nombre_completo) {
      errors.representante_nombre_completo = 'El nombre del representante es requerido';
    }
    
    if (!healthData.representante_email) {
      errors.representante_email = 'El email del representante es requerido';
    }
    
    return errors;
  };
  
  const validateHealthServices = () => {
    return selectedServices.length === 0 ? 
      ['Debe seleccionar al menos un servicio de salud'] : 
      [];
  };
  
  // Handle navigation
  const handleNext = () => {
    if (currentHealthStep === HEALTH_STEPS.ORGANIZATION_INFO) {
      const errors = validateHealthOrganization();
      if (Object.keys(errors).length === 0) {
        // Move to services step (this would be handled by parent wizard)
        onNext();
      } else {
        // Show validation errors
        console.warn('Health organization validation errors:', errors);
      }
    } else if (currentHealthStep === HEALTH_STEPS.SERVICES_SELECTION) {
      const errors = validateHealthServices();
      if (errors.length === 0) {
        onNext();
      } else {
        console.warn('Health services validation errors:', errors);
      }
    }
  };
  
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onNext();
    }
  };

  return (
    <div className="health-wizard-integration">
      {/* Health Organization Information Step */}
      {currentHealthStep === HEALTH_STEPS.ORGANIZATION_INFO && (
        <div>
          <Step3bHealthOrganization
            data={healthData}
            errors={healthErrors}
            onChange={onHealthDataChange}
            organizationName={organizationName}
            selectedSector={selectedSector}
            showIntroduction={true}
          />
          
          {/* Navigation for Health Organization Step */}
          <div className="wizard-navigation mt-4">
            <div className="d-flex justify-content-between align-items-center">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onPrevious}
              >
                <i className="ri-arrow-left-line me-1"></i>
                Anterior
              </button>
              
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-warning"
                  onClick={handleSkip}
                  data-bs-toggle="tooltip"
                  title="Puede completar esta información más tarde"
                >
                  <i className="ri-skip-forward-line me-1"></i>
                  Saltar por Ahora
                </button>
                
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={Object.keys(validateHealthOrganization()).length > 0}
                >
                  Continuar
                  <i className="ri-arrow-right-line ms-1"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Health Services Selection Step */}
      {currentHealthStep === HEALTH_STEPS.SERVICES_SELECTION && (
        <div>
          <Step3cHealthServices
            selectedServices={selectedServices}
            nivelComplejidad={healthData.nivel_complejidad || ''}
            organizationName={organizationName}
            selectedSector={selectedSector}
            onChange={onServicesChange}
            showIntroduction={true}
          />
          
          {/* Navigation for Health Services Step */}
          <div className="wizard-navigation mt-4">
            <div className="d-flex justify-content-between align-items-center">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onPrevious}
              >
                <i className="ri-arrow-left-line me-1"></i>
                Anterior
              </button>
              
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-warning"
                  onClick={handleSkip}
                  data-bs-toggle="tooltip"
                  title="Puede agregar servicios más tarde desde el panel de administración"
                >
                  <i className="ri-skip-forward-line me-1"></i>
                  Configurar Después
                </button>
                
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleNext}
                  disabled={validateHealthServices().length > 0}
                >
                  <i className="ri-checkbox-circle-line me-1"></i>
                  Completar Configuración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Indicator for Health Steps */}
      <div className="health-progress-indicator mt-3">
        <div className="card border-0 bg-light">
          <div className="card-body p-2">
            <div className="row align-items-center">
              <div className="col-md-8">
                <small className="text-muted">
                  <strong>Configuración de Salud:</strong> {' '}
                  {currentHealthStep === HEALTH_STEPS.ORGANIZATION_INFO ? 
                    'Información Institucional' : 
                    'Selección de Servicios'
                  }
                </small>
              </div>
              <div className="col-md-4">
                <div className="progress" style={{ height: '4px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ 
                      width: currentHealthStep === HEALTH_STEPS.ORGANIZATION_INFO ? '50%' : '100%' 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthWizardIntegration;