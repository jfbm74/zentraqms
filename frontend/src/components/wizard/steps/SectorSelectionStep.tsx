import React, { useState, useEffect, useCallback } from 'react';
import { SectorType, SECTORS, SectorInfo } from '../../../types/wizard.types';
import SectorCard from '../components/SectorCard';
import ModulePreview from '../components/ModulePreview';
import OrganizationTypeSelection from '../components/OrganizationTypeSelection';

interface SectorSelectionStepProps {
  onSectorSelect: (sector: SectorType, organizationType?: string) => void;
  selectedSector?: SectorType;
  selectedOrgType?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  canProceed?: boolean;
  isLoading?: boolean;
}

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

const SectorSelectionStep: React.FC<SectorSelectionStepProps> = ({
  onSectorSelect,
  selectedSector,
  selectedOrgType,
  onNext,
  onPrevious,
  canProceed = true,
  isLoading = false
}) => {
  // Estados locales
  const [currentStep, setCurrentStep] = useState<'SECTOR' | 'ORG_TYPE'>('SECTOR');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showModulePreview, setShowModulePreview] = useState(false);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);

  // Referencias para accesibilidad
  const sectorGridRef = React.useRef<HTMLDivElement>(null);

  // Efectos
  useEffect(() => {
    if (selectedSector) {
      setCurrentStep('ORG_TYPE');
      setShowModulePreview(true);
    } else {
      setCurrentStep('SECTOR');
      setShowModulePreview(false);
    }
  }, [selectedSector]);

  useEffect(() => {
    // Auto-scroll hacia el componente cuando cambia el paso
    if (currentStep === 'ORG_TYPE' && sectorGridRef.current) {
      sectorGridRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [currentStep]);

  // Handlers
  const handleSectorSelect = useCallback((sectorId: SectorType) => {
    setValidationErrors([]);
    onSectorSelect(sectorId);
    setShouldAutoFocus(true); // Trigger auto focus on organization type selection
    
    // Anunciar cambio para screen readers
    announceToScreenReader(`Sector ${sectorId} seleccionado. Ahora seleccione el tipo de organización.`);
  }, [onSectorSelect]);

  const handleOrgTypeSelect = useCallback((orgType: string) => {
    setValidationErrors([]);
    setShouldAutoFocus(false); // Reset auto focus flag
    onSectorSelect(selectedSector!, orgType);
    
    // Anunciar cambio para screen readers
    announceToScreenReader(`Tipo de organización ${orgType} seleccionado.`);
  }, [selectedSector, onSectorSelect]);

  const handleBackToSector = useCallback(() => {
    setCurrentStep('SECTOR');
    setShowModulePreview(false);
    setShouldAutoFocus(false); // Reset auto focus flag
    onSectorSelect(undefined as any); // Reset selection
  }, [onSectorSelect]);

  const handleContinue = useCallback(() => {
    const errors = validateSelection();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      announceToScreenReader(`Error de validación: ${errors[0].message}`);
      return;
    }

    if (onNext) {
      onNext();
    }
  }, [selectedSector, selectedOrgType, onNext]);

  // Validación
  const validateSelection = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!selectedSector) {
      errors.push({
        field: 'sector',
        message: 'Debe seleccionar un sector para continuar',
        type: 'error'
      });
    }

    if (selectedSector && selectedSector === 'HEALTHCARE' && !selectedOrgType) {
      errors.push({
        field: 'organizationType',
        message: 'Debe seleccionar el tipo de organización de salud',
        type: 'error'
      });
    }

    return errors;
  };

  // Utilidades
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'visually-hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const selectedSectorInfo = SECTORS.find(s => s.id === selectedSector);
  const canContinue = selectedSector && (!selectedSectorInfo?.types?.length || selectedOrgType);

  return (
    <div className="sector-selection-step">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="fw-bold text-primary mb-2">
          <i className="ri-building-line me-2"></i>
          Configuración Multi-Sector
        </h3>
        <p className="text-muted mb-0">
          ZentraQMS se adapta a su industria. Seleccione su sector para una configuración personalizada.
        </p>
      </div>

      {/* Breadcrumb visual */}
      <div className="d-flex justify-content-center mb-4">
        <div className="d-flex align-items-center">
          <div className={`step-indicator ${currentStep === 'SECTOR' ? 'active' : 'completed'}`}>
            <span className="step-number">1</span>
            <span className="step-label">Sector</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step-indicator ${currentStep === 'ORG_TYPE' ? 'active' : 'pending'}`}>
            <span className="step-number">2</span>
            <span className="step-label">Tipo</span>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Columna principal */}
        <div className="col-lg-8">
          <div ref={sectorGridRef}>
            {/* Selección de Sector */}
            <div className="sector-grid-container">
              <h4 className="mb-3">
                <i className="ri-compass-3-line me-2 text-primary"></i>
                Seleccione su Sector
              </h4>
              
              <div className="row g-3 sector-grid">
                {SECTORS.map((sector, index) => (
                  <div key={sector.id} className="col-md-6">
                    <SectorCard
                      sector={sector}
                      isSelected={selectedSector === sector.id}
                      onSelect={handleSectorSelect}
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Selección de Tipo de Organización */}
            {selectedSectorInfo && selectedSectorInfo.types && selectedSectorInfo.types.length > 0 && (
              <div className="mt-4">
                <div className="d-flex align-items-center mb-3">
                  <button
                    type="button"
                    className="btn btn-ghost-secondary btn-sm me-3"
                    onClick={handleBackToSector}
                    disabled={isLoading}
                  >
                    <i className="ri-arrow-left-line me-1"></i>
                    Cambiar Sector
                  </button>
                </div>

                <OrganizationTypeSelection
                  types={selectedSectorInfo.types}
                  selectedType={selectedOrgType}
                  onTypeSelect={handleOrgTypeSelect}
                  disabled={isLoading}
                  sectorName={selectedSectorInfo.name}
                  autoFocus={shouldAutoFocus}
                />
              </div>
            )}
          </div>
        </div>

        {/* Columna lateral - Preview de módulos */}
        <div className="col-lg-4">
          <div className="sticky-top" style={{ top: '20px' }}>
            <ModulePreview
              selectedSector={selectedSectorInfo}
              selectedOrgType={selectedOrgType}
              show={showModulePreview}
            />
          </div>
        </div>
      </div>

      {/* Errores de validación */}
      {validationErrors.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            {validationErrors.map((error, index) => (
              <div 
                key={index} 
                className={`alert alert-${error.type === 'error' ? 'danger' : 'warning'} d-flex align-items-center`} 
                role="alert"
              >
                <i className="ri-alert-line me-2 flex-shrink-0"></i>
                <div>{error.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <button
              type="button"
              className="btn btn-light btn-label"
              onClick={onPrevious}
              disabled={isLoading}
            >
              <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>
              Anterior
            </button>
            
            <button
              type="button"
              className="btn btn-primary btn-label"
              onClick={handleContinue}
              disabled={!canContinue || isLoading || !canProceed}
            >
              {isLoading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  Configurando...
                </>
              ) : (
                <>
                  Continuar
                  <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Estilos específicos */}
      <style jsx>{`
        .step-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.3s ease;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-bottom: 8px;
          transition: all 0.3s ease;
        }

        .step-label {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .step-connector {
          width: 60px;
          height: 2px;
          margin: 0 20px;
          margin-bottom: 28px;
          transition: all 0.3s ease;
        }

        .step-indicator.pending .step-number {
          background-color: var(--vz-gray-200);
          color: var(--vz-gray-600);
          border: 2px solid var(--vz-gray-300);
        }

        .step-indicator.pending .step-label {
          color: var(--vz-gray-600);
        }

        .step-indicator.active .step-number {
          background-color: var(--vz-primary);
          color: white;
          border: 2px solid var(--vz-primary);
          box-shadow: 0 0 0 4px rgba(53, 119, 241, 0.2);
        }

        .step-indicator.active .step-label {
          color: var(--vz-primary);
          font-weight: 600;
        }

        .step-indicator.completed .step-number {
          background-color: var(--vz-success);
          color: white;
          border: 2px solid var(--vz-success);
        }

        .step-indicator.completed .step-label {
          color: var(--vz-success);
        }

        .step-connector {
          background-color: var(--vz-gray-300);
        }

        .step-indicator.completed + .step-connector {
          background-color: var(--vz-success);
        }

        .sector-grid {
          min-height: 400px;
        }

        @media (max-width: 767.98px) {
          .step-connector {
            width: 40px;
            margin: 0 10px;
          }
          
          .sticky-top {
            position: relative !important;
            top: auto !important;
            margin-top: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SectorSelectionStep;