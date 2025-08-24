/**
 * Wizard de configuración inicial para organigramas
 * Guía paso a paso para crear un organigrama desde plantillas o desde cero
 * ZentraQMS - Sistema de Gestión de Calidad
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  Sector,
  PlantillaOrganigrama,
  OrganizationalChartForm,
  TemplateComplexity
} from '../../../types/organizationalChart';
import { useOrganizationalChartStore } from '../../../stores/organizationalChart/organizationalChartStore';
import { useCurrentOrganization } from '../../../hooks/useCurrentOrganization';
import LoadingSpinner from '../../common/LoadingSpinner';

interface OrganizationalChartWizardProps {
  onComplete?: (chartId: string) => void;
  onCancel?: () => void;
}

const OrganizationalChartWizard: React.FC<OrganizationalChartWizardProps> = ({
  onComplete,
  onCancel
}) => {

  const navigate = useNavigate();
  const { currentOrganization } = useCurrentOrganization();
  
  const {
    sectors,
    templates,
    loading,
    loadSectors,
    loadTemplates,
    createChart,
    reset
  } = useOrganizationalChartStore();

  // ============================================================================
  // ESTADO DEL WIZARD
  // ============================================================================

  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    // Paso 1: Tipo de organigrama
    creation_type: 'template' as 'template' | 'scratch',
    
    // Paso 2: Selección de sector
    sector: '',
    organization_type: '',
    
    // Paso 3: Selección de plantilla (si aplica)
    selected_template: '',
    
    // Paso 4: Configuración básica
    hierarchy_levels: 5,
    allows_temporary_positions: true,
    uses_raci_matrix: true,
    
    // Paso 5: Configuración específica del sector
    sector_config: {
      validations_active: [] as string[],
      additional_committees: [] as string[],
      special_positions: [] as string[],
      applied_standards: [] as string[],
      customizations: {}
    }
  });

  const [isCreating, setIsCreating] = useState(false);

  const totalSteps = wizardData.creation_type === 'template' ? 4 : 5;

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    loadSectors();
    
    return () => {
      // Limpiar al desmontar si no se completó
      if (currentStep < totalSteps && !isCreating) {
        reset();
      }
    };
  }, []);

  useEffect(() => {
    if (wizardData.sector) {
      loadTemplates(wizardData.sector);
    }
  }, [wizardData.sector]);

  // ============================================================================
  // FUNCIONES DE NAVEGACIÓN
  // ============================================================================

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep || validateStepsUpTo(step - 1)) {
      setCurrentStep(step);
    }
  };

  // ============================================================================
  // VALIDACIONES
  // ============================================================================

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!wizardData.creation_type;
      case 2:
        return !!(wizardData.sector && wizardData.organization_type);
      case 3:
        return wizardData.creation_type === 'scratch' || !!wizardData.selected_template;
      case 4:
        return wizardData.hierarchy_levels >= 3 && wizardData.hierarchy_levels <= 10;
      default:
        return true;
    }
  };

  const validateStepsUpTo = (step: number): boolean => {
    for (let i = 1; i <= step; i++) {
      const currentStepTemp = currentStep;
      setCurrentStep(i);
      const isValid = validateCurrentStep();
      setCurrentStep(currentStepTemp);
      if (!isValid) return false;
    }
    return true;
  };

  // ============================================================================
  // MANEJADORES DE DATOS
  // ============================================================================

  const updateWizardData = (field: string, value: any) => {
    setWizardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateSectorConfig = (field: string, value: any) => {
    setWizardData(prev => ({
      ...prev,
      sector_config: {
        ...prev.sector_config,
        [field]: value
      }
    }));
  };

  // ============================================================================
  // CREACIÓN DEL ORGANIGRAMA
  // ============================================================================

  const handleComplete = async () => {
    if (!currentOrganization) {
      toast.error('No se ha seleccionado una organización');
      return;
    }

    setIsCreating(true);
    try {
      // Preparar datos del organigrama
      const chartData: OrganizationalChartForm & { organization: string; sector: string } = {
        organization: currentOrganization.id,
        sector: wizardData.sector,
        organization_type: wizardData.organization_type,
        base_template: wizardData.creation_type === 'template' ? wizardData.selected_template : undefined,
        hierarchy_levels: wizardData.hierarchy_levels,
        allows_temporary_positions: wizardData.allows_temporary_positions,
        uses_raci_matrix: wizardData.uses_raci_matrix,
        sector_config: wizardData.sector_config
      };

      // Crear organigrama
      const chartId = await createChart(chartData);

      // Si se seleccionó plantilla, aplicarla
      if (wizardData.creation_type === 'template' && wizardData.selected_template) {
        await fetch(`/api/organization/orgchart-templates/${wizardData.selected_template}/apply/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ organization_id: currentOrganization.id })
        });
        
        toast.success('Organigrama creado y plantilla aplicada exitosamente');
      } else {
        toast.success('Organigrama base creado exitosamente');
      }

      if (onComplete) {
        onComplete(chartId);
      } else {
        navigate(`/organization/charts/${chartId}`);
      }

    } catch (error: any) {
      console.error('Error al crear organigrama:', error);
      toast.error('Error al crear el organigrama');
    } finally {
      setIsCreating(false);
    }
  };

  // ============================================================================
  // RENDER DE PASOS
  // ============================================================================

  const renderStep1 = () => (
    <div className="wizard-step">
      <h4 className="mb-4">¿Cómo deseas crear el organigrama?</h4>
      
      <div className="row g-3">
        <div className="col-md-6">
          <div 
            className={`creation-option ${wizardData.creation_type === 'template' ? 'selected' : ''}`}
            onClick={() => updateWizardData('creation_type', 'template')}
          >
            <div className="option-icon">
              <i className="ri-layout-4-line"></i>
            </div>
            <h5>Usar Plantilla</h5>
            <p className="text-muted">
              Comenzar con una plantilla predefinida según tu sector y tipo de organización.
              Más rápido y con mejores prácticas incluidas.
            </p>
            <div className="option-benefits">
              <div className="benefit-item">
                <i className="ri-check-line text-success"></i>
                <span>Configuración automática</span>
              </div>
              <div className="benefit-item">
                <i className="ri-check-line text-success"></i>
                <span>Cumplimiento normativo</span>
              </div>
              <div className="benefit-item">
                <i className="ri-check-line text-success"></i>
                <span>Mejores prácticas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div 
            className={`creation-option ${wizardData.creation_type === 'scratch' ? 'selected' : ''}`}
            onClick={() => updateWizardData('creation_type', 'scratch')}
          >
            <div className="option-icon">
              <i className="ri-pencil-ruler-2-line"></i>
            </div>
            <h5>Crear desde Cero</h5>
            <p className="text-muted">
              Diseñar un organigrama completamente personalizado desde cero.
              Control total sobre la estructura y configuración.
            </p>
            <div className="option-benefits">
              <div className="benefit-item">
                <i className="ri-check-line text-success"></i>
                <span>Personalización total</span>
              </div>
              <div className="benefit-item">
                <i className="ri-check-line text-success"></i>
                <span>Flexibilidad máxima</span>
              </div>
              <div className="benefit-item">
                <i className="ri-check-line text-success"></i>
                <span>Adaptación específica</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const selectedSector = sectors.find(s => s.id === wizardData.sector);
    
    return (
      <div className="wizard-step">
        <h4 className="mb-4">Información del Sector</h4>
        
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">
              Sector <span className="text-danger">*</span>
            </label>
            <select
              className="form-select"
              value={wizardData.sector}
              onChange={(e) => updateWizardData('sector', e.target.value)}
            >
              <option value="">Seleccionar sector</option>
              {sectors.map(sector => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">
              Tipo de Organización <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={wizardData.organization_type}
              onChange={(e) => updateWizardData('organization_type', e.target.value)}
              placeholder="ej: IPS, Hospital, Clínica"
            />
          </div>

          {selectedSector && (
            <div className="col-12">
              <div className="alert alert-info">
                <h6 className="alert-heading">{selectedSector.name}</h6>
                <p className="mb-0">{selectedSector.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    if (wizardData.creation_type === 'scratch') {
      return (
        <div className="wizard-step">
          <h4 className="mb-4">Configuración Básica</h4>
          {renderBasicConfiguration()}
        </div>
      );
    }

    const filteredTemplates = templates.filter(t => 
      t.sector === wizardData.sector &&
      t.organization_type.toLowerCase().includes(wizardData.organization_type.toLowerCase())
    );

    return (
      <div className="wizard-step">
        <h4 className="mb-4">Seleccionar Plantilla</h4>
        
        {loading.templates ? (
          <div className="text-center py-4">
            <LoadingSpinner />
            <p className="text-muted mt-2">Cargando plantillas...</p>
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="row g-3">
            {filteredTemplates.map(template => (
              <div key={template.id} className="col-md-6">
                <div 
                  className={`template-option ${wizardData.selected_template === template.id ? 'selected' : ''}`}
                  onClick={() => updateWizardData('selected_template', template.id)}
                >
                  <div className="template-header">
                    <h6>{template.name}</h6>
                    <span className={`badge bg-${template.complexity === 'HIGH' ? 'danger' : template.complexity === 'MEDIUM' ? 'warning' : 'success'}-subtle`}>
                      {template.complexity}
                    </span>
                  </div>
                  <p className="text-muted small">{template.description}</p>
                  <div className="template-stats">
                    <div className="stat-item">
                      <i className="ri-organization-chart"></i>
                      <span>{template.structure.areas?.length || 0} áreas</span>
                    </div>
                    <div className="stat-item">
                      <i className="ri-user-line"></i>
                      <span>{template.structure.positions?.length || 0} cargos</span>
                    </div>
                    <div className="stat-item">
                      <i className="ri-group-line"></i>
                      <span>{template.structure.committees?.length || 0} comités</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-warning">
            <h6 className="alert-heading">No hay plantillas disponibles</h6>
            <p>No se encontraron plantillas para el sector y tipo de organización seleccionados.</p>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => updateWizardData('creation_type', 'scratch')}
            >
              Crear desde cero
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderStep4 = () => {
    if (wizardData.creation_type === 'template') {
      return (
        <div className="wizard-step">
          <h4 className="mb-4">Resumen y Confirmación</h4>
          {renderSummary()}
        </div>
      );
    } else {
      return (
        <div className="wizard-step">
          <h4 className="mb-4">Configuración del Sector</h4>
          {renderSectorConfiguration()}
        </div>
      );
    }
  };

  const renderStep5 = () => (
    <div className="wizard-step">
      <h4 className="mb-4">Resumen y Confirmación</h4>
      {renderSummary()}
    </div>
  );

  const renderBasicConfiguration = () => (
    <div className="row g-3">
      <div className="col-md-6">
        <label className="form-label">Niveles Jerárquicos</label>
        <input
          type="number"
          className="form-control"
          min="3"
          max="10"
          value={wizardData.hierarchy_levels}
          onChange={(e) => updateWizardData('hierarchy_levels', parseInt(e.target.value))}
        />
      </div>

      <div className="col-12">
        <div className="row g-2">
          <div className="col-md-6">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="allows_temporary"
                checked={wizardData.allows_temporary_positions}
                onChange={(e) => updateWizardData('allows_temporary_positions', e.target.checked)}
              />
              <label className="form-check-label" htmlFor="allows_temporary">
                Permitir cargos temporales
              </label>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="uses_raci"
                checked={wizardData.uses_raci_matrix}
                onChange={(e) => updateWizardData('uses_raci_matrix', e.target.checked)}
              />
              <label className="form-check-label" htmlFor="uses_raci">
                Usar matriz RACI
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectorConfiguration = () => (
    <div className="alert alert-info">
      <h6>Configuración Específica del Sector</h6>
      <p>La configuración específica del sector se aplicará automáticamente según las normativas vigentes.</p>
    </div>
  );

  const renderSummary = () => {
    const selectedSector = sectors.find(s => s.id === wizardData.sector);
    const selectedTemplate = templates.find(t => t.id === wizardData.selected_template);

    return (
      <div className="summary-content">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="summary-section">
              <h6>Información General</h6>
              <dl className="row">
                <dt className="col-sm-4">Organización:</dt>
                <dd className="col-sm-8">{currentOrganization?.nombre_comercial}</dd>
                
                <dt className="col-sm-4">Sector:</dt>
                <dd className="col-sm-8">{selectedSector?.name}</dd>
                
                <dt className="col-sm-4">Tipo:</dt>
                <dd className="col-sm-8">{wizardData.organization_type}</dd>
                
                <dt className="col-sm-4">Método:</dt>
                <dd className="col-sm-8">{wizardData.creation_type === 'template' ? 'Plantilla' : 'Desde cero'}</dd>
              </dl>
            </div>
          </div>

          <div className="col-md-6">
            <div className="summary-section">
              <h6>Configuración</h6>
              <dl className="row">
                <dt className="col-sm-5">Niveles jerárquicos:</dt>
                <dd className="col-sm-7">{wizardData.hierarchy_levels}</dd>
                
                <dt className="col-sm-5">Cargos temporales:</dt>
                <dd className="col-sm-7">{wizardData.allows_temporary_positions ? 'Sí' : 'No'}</dd>
                
                <dt className="col-sm-5">Matriz RACI:</dt>
                <dd className="col-sm-7">{wizardData.uses_raci_matrix ? 'Sí' : 'No'}</dd>
              </dl>
            </div>
          </div>

          {selectedTemplate && (
            <div className="col-12">
              <div className="summary-section">
                <h6>Plantilla Seleccionada</h6>
                <div className="alert alert-success">
                  <strong>{selectedTemplate.name}</strong>
                  <p className="mb-0 mt-1">{selectedTemplate.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <div className="organizational-chart-wizard">
      
      {/* Header con progreso */}
      <div className="wizard-header">
        <div className="container">
          <div className="wizard-progress">
            {Array.from({ length: totalSteps }, (_, index) => {
              const step = index + 1;
              const isActive = step === currentStep;
              const isCompleted = step < currentStep;
              const isAvailable = step <= currentStep || validateStepsUpTo(step - 1);

              return (
                <div
                  key={step}
                  className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!isAvailable ? 'disabled' : ''}`}
                  onClick={() => isAvailable && handleStepClick(step)}
                >
                  <div className="step-number">
                    {isCompleted ? <i className="ri-check-line"></i> : step}
                  </div>
                  <div className="step-label">
                    {step === 1 && 'Tipo'}
                    {step === 2 && 'Sector'}
                    {step === 3 && (wizardData.creation_type === 'template' ? 'Plantilla' : 'Config. Básica')}
                    {step === 4 && (wizardData.creation_type === 'template' ? 'Resumen' : 'Config. Sector')}
                    {step === 5 && 'Resumen'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="wizard-content">
        <div className="container">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>
      </div>

      {/* Footer con navegación */}
      <div className="wizard-footer">
        <div className="container">
          <div className="d-flex justify-content-between">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handlePrevious}
                  disabled={isCreating}
                >
                  <i className="ri-arrow-left-line me-1"></i>
                  Anterior
                </button>
              )}
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={onCancel || (() => navigate('/organization'))}
                disabled={isCreating}
              >
                Cancelar
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={!validateCurrentStep() || isCreating}
                >
                  Siguiente
                  <i className="ri-arrow-right-line ms-1"></i>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleComplete}
                  disabled={!validateCurrentStep() || isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Creando...
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line me-1"></i>
                      Crear Organigrama
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estilos del componente */}
      <style jsx>{`
        .organizational-chart-wizard {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
        }

        .wizard-header {
          background: white;
          border-bottom: 1px solid #dee2e6;
          padding: 2rem 0;
        }

        .wizard-progress {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 2rem;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .progress-step.disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-bottom: 0.5rem;
          border: 2px solid #dee2e6;
          background: white;
          color: #6c757d;
        }

        .progress-step.active .step-number {
          border-color: #405189;
          background: #405189;
          color: white;
        }

        .progress-step.completed .step-number {
          border-color: #0ab39c;
          background: #0ab39c;
          color: white;
        }

        .step-label {
          font-size: 0.875rem;
          color: #6c757d;
          text-align: center;
        }

        .progress-step.active .step-label {
          color: #405189;
          font-weight: 600;
        }

        .wizard-content {
          flex: 1;
          padding: 3rem 0;
        }

        .wizard-step {
          max-width: 800px;
          margin: 0 auto;
        }

        .creation-option {
          border: 2px solid #dee2e6;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          height: 100%;
          background: white;
        }

        .creation-option:hover {
          border-color: #405189;
          box-shadow: 0 4px 12px rgba(64, 81, 137, 0.15);
        }

        .creation-option.selected {
          border-color: #405189;
          background: rgba(64, 81, 137, 0.05);
        }

        .option-icon {
          font-size: 3rem;
          color: #405189;
          margin-bottom: 1rem;
        }

        .option-benefits {
          margin-top: 1.5rem;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .template-option {
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          height: 100%;
          background: white;
        }

        .template-option:hover {
          border-color: #405189;
          box-shadow: 0 2px 8px rgba(64, 81, 137, 0.1);
        }

        .template-option.selected {
          border-color: #405189;
          background: rgba(64, 81, 137, 0.05);
        }

        .template-header {
          display: flex;
          justify-content: between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .template-stats {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #6c757d;
        }

        .summary-section {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1.5rem;
          height: 100%;
        }

        .wizard-footer {
          background: white;
          border-top: 1px solid #dee2e6;
          padding: 1.5rem 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .wizard-progress {
            gap: 1rem;
          }

          .step-number {
            width: 32px;
            height: 32px;
            font-size: 0.875rem;
          }

          .step-label {
            font-size: 0.75rem;
          }

          .wizard-content {
            padding: 2rem 0;
          }

          .creation-option,
          .template-option {
            padding: 1rem;
          }

          .option-icon {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default OrganizationalChartWizard;