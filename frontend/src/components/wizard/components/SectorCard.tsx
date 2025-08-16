import React, { useState } from 'react';
import { SectorInfo, SectorType } from '../../../types/wizard.types';

interface SectorCardProps {
  sector: SectorInfo;
  isSelected: boolean;
  onSelect: (sectorId: SectorType) => void;
  disabled?: boolean;
}

const SectorCard: React.FC<SectorCardProps> = ({
  sector,
  isSelected,
  onSelect,
  disabled = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      onSelect(sector.id);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div 
      className={`card sector-card ${isSelected ? 'border-primary' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      role="radio"
      tabIndex={disabled ? -1 : 0}
      aria-checked={isSelected}
      aria-disabled={disabled}
      aria-labelledby={`sector-${sector.id}-title`}
      aria-describedby={`sector-${sector.id}-desc`}
      onKeyDown={handleKeyDown}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transform: isHovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
        position: 'relative',
        borderWidth: isSelected ? '2px' : '1px'
      }}
    >
      <div className="card-body">
        <div className="row gy-3">
          <div className="col-sm-auto">
            <div className="avatar-lg bg-light rounded p-1">
              <div className="avatar-title bg-primary-subtle rounded d-flex align-items-center justify-content-center h-100">
                <i 
                  className={`${sector.icon} text-primary`}
                  style={{ fontSize: '2rem' }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
          <div className="col-sm">
            <h5 
              id={`sector-${sector.id}-title`}
              className={`card-title mb-2 ${isSelected ? 'text-primary' : 'text-dark'}`}
              style={{ fontWeight: 600 }}
            >
              {sector.name}
            </h5>
            <p 
              id={`sector-${sector.id}-desc`}
              className="text-muted mb-2"
              style={{ fontSize: '0.875rem', lineHeight: '1.4' }}
            >
              {sector.description}
            </p>
            
            {/* Module indicators */}
            <div className="d-flex flex-wrap gap-1 mb-2">
              {sector.modules.slice(0, 3).map((module, index) => (
                <span 
                  key={index}
                  className={`badge ${isSelected ? 'bg-primary' : 'bg-light text-muted'}`}
                  style={{ fontSize: '0.6875rem' }}
                >
                  {module}
                </span>
              ))}
              {sector.modules.length > 3 && (
                <span className="badge bg-secondary">
                  +{sector.modules.length - 3} más
                </span>
              )}
            </div>

            {/* Selection indicator */}
            <div className="d-flex align-items-center justify-content-between">
              <small className="text-muted">
                {sector.types.length} tipos disponibles
              </small>
              {isSelected && (
                <div className="d-flex align-items-center text-primary">
                  <i className="ri-check-circle-fill me-1"></i>
                  <small>Seleccionado</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with additional info */}
      <div className="card-footer bg-light-subtle border-top-dashed">
        <div className="row align-items-center gy-2">
          <div className="col-sm">
            <div className="d-flex flex-wrap gap-1">
              {sector.integrations.map((integration, index) => (
                <span 
                  key={index}
                  className="badge bg-info-subtle text-info"
                  style={{ fontSize: '0.625rem' }}
                >
                  {integration}
                </span>
              ))}
            </div>
          </div>
          <div className="col-sm-auto">
            <small className="text-muted">
              {sector.integrations.length} integraciones
            </small>
          </div>
        </div>
      </div>

      {/* Selection overlay */}
      {isSelected && (
        <div 
          className="position-absolute top-0 end-0 p-2"
        >
          <i 
            className="ri-check-circle-fill text-primary"
            style={{ fontSize: '12px' }}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

export default SectorCard;