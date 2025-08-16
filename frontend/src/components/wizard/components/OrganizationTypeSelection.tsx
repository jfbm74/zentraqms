import React, { useEffect, useRef } from 'react';

interface OrganizationType {
  value: string;
  label: string;
}

interface OrganizationTypeSelectionProps {
  types: OrganizationType[];
  selectedType?: string;
  onTypeSelect: (type: string) => void;
  disabled?: boolean;
  sectorName?: string;
  autoFocus?: boolean;
}

const OrganizationTypeSelection: React.FC<OrganizationTypeSelectionProps> = ({
  types,
  selectedType,
  onTypeSelect,
  disabled = false,
  sectorName = '',
  autoFocus = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto focus effect when component mounts and autoFocus is true
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      // Small delay to ensure smooth animation
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Focus the first radio option for keyboard navigation
        const firstRadio = containerRef.current?.querySelector('[role="radio"]') as HTMLElement;
        if (firstRadio) {
          firstRadio.focus();
        }
      }, 300);
    }
  }, [autoFocus]);
  const handleTypeChange = (value: string) => {
    if (!disabled) {
      onTypeSelect(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, value: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTypeChange(value);
    }
  };

  if (!types || types.length === 0) {
    return null;
  }

  return (
    <div className="organization-type-selection mt-4" ref={containerRef}>
      <div className="card">
        <div className="card-header bg-primary-subtle border-primary">
          <h5 className="card-title mb-0 d-flex align-items-center text-primary">
            <i className="ri-building-line me-2"></i>
            Tipo de Organización
          </h5>
          <small className="text-primary opacity-75">
            Sector seleccionado: <strong>{sectorName}</strong>
          </small>
        </div>
        
        <div className="card-body">
          <p className="text-muted mb-4">
            <i className="ri-information-line me-1"></i>
            Seleccione el tipo específico de su organización para una configuración más precisa:
          </p>

          <div className="organization-types" role="radiogroup" aria-label="Tipo de organización">
            {types.map((type, index) => {
              const isSelected = selectedType === type.value;
              const radioId = `org-type-${type.value}`;
              
              return (
                <div
                  key={type.value}
                  className={`org-type-item mb-3 p-3 border rounded cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary-subtle' 
                      : 'border-secondary'
                  } ${disabled ? 'opacity-50' : ''}`}
                  onClick={() => handleTypeChange(type.value)}
                  onKeyDown={(e) => handleKeyDown(e, type.value)}
                  role="radio"
                  tabIndex={disabled ? -1 : 0}
                  aria-checked={isSelected}
                  aria-disabled={disabled}
                  style={{
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !isSelected) {
                      e.currentTarget.style.borderColor = 'var(--vz-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--vz-gray-50)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled && !isSelected) {
                      e.currentTarget.style.borderColor = 'var(--vz-border-color)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div className="d-flex align-items-center">
                    {/* Radio button visual */}
                    <div className="flex-shrink-0 me-3">
                      <div
                        className={`radio-custom ${isSelected ? 'checked' : ''}`}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? 'var(--vz-primary)' : 'var(--vz-border-color)'}`,
                          position: 'relative',
                          backgroundColor: isSelected ? 'var(--vz-primary)' : 'transparent',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: 'white'
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1">
                      <label 
                        htmlFor={radioId}
                        className="fw-semibold text-dark mb-1 cursor-pointer"
                        style={{ fontSize: '0.95rem' }}
                      >
                        {type.label}
                      </label>
                      
                      {/* Descripción adicional basada en el tipo */}
                      <div className="text-muted small">
                        {getOrganizationTypeDescription(type.value)}
                      </div>
                    </div>

                    {/* Indicador de selección */}
                    {isSelected && (
                      <div className="flex-shrink-0 ms-2">
                        <span className="badge bg-primary">
                          <i className="ri-check-line me-1"></i>
                          Seleccionado
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hidden radio input for accessibility */}
                  <input
                    type="radio"
                    id={radioId}
                    name="organizationType"
                    value={type.value}
                    checked={isSelected}
                    onChange={() => handleTypeChange(type.value)}
                    disabled={disabled}
                    className="visually-hidden"
                    aria-describedby={`${radioId}-desc`}
                  />
                </div>
              );
            })}
          </div>

          {/* Mensaje de ayuda */}
          <div className="mt-3 p-3 bg-info-subtle rounded">
            <small className="text-info d-flex align-items-start">
              <i className="ri-lightbulb-line me-2 mt-1 flex-shrink-0"></i>
              <div>
                <strong>¿No está seguro?</strong> 
                <br />
                Puede cambiar esta configuración más adelante desde el panel de administración.
                {selectedType && (
                  <span className="d-block mt-1">
                    <strong>Selección actual:</strong> {types.find(t => t.value === selectedType)?.label}
                  </span>
                )}
              </div>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

// Función auxiliar para obtener descripciones de tipos de organización
const getOrganizationTypeDescription = (typeValue: string): string => {
  const descriptions: Record<string, string> = {
    // Healthcare
    'IPS': 'Instituciones que prestan servicios de salud directamente a los pacientes',
    'ESE': 'Empresas públicas del sector salud con régimen especial',
    'EPS': 'Entidades que administran y gestionan el aseguramiento en salud',
    
    // Manufacturing
    'FOOD': 'Empresas que procesan y producen alimentos y bebidas',
    'PHARMA': 'Industria farmacéutica y productos medicinales',
    'TEXTILE': 'Producción de textiles, confecciones y materiales',
    'AUTOMOTIVE': 'Manufactura de vehículos y componentes automotrices',
    'GENERAL': 'Manufactura general y otros procesos industriales',
    
    // Services
    'IT': 'Servicios de tecnología, desarrollo y consultoría técnica',
    'CONSULTING': 'Consultoría empresarial y servicios profesionales',
    'FINANCIAL': 'Servicios financieros, bancarios y de seguros',
    'SERVICES_GENERAL': 'Otros servicios profesionales y empresariales',
    
    // Education
    'UNIVERSITY': 'Instituciones de educación superior y universitaria',
    'SCHOOL': 'Colegios de educación básica y media',
    'INSTITUTE': 'Institutos técnicos y tecnológicos',
    'TRAINING': 'Centros de capacitación y formación especializada'
  };
  
  return descriptions[typeValue] || 'Tipo de organización especializada';
};

export default OrganizationTypeSelection;