/**
 * Indicador de cumplimiento SOGCS para organigramas
 * Muestra estado de cumplimiento normativo para sector salud
 * ZentraQMS - Sistema de Gestión de Calidad
 */

import React, { useState } from 'react';
import { OrganizationalChart, ChartNode } from '../../types/organizationalChart';

interface ComplianceIndicatorProps {
  chart?: OrganizationalChart;
  node?: ChartNode;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ComplianceIndicator: React.FC<ComplianceIndicatorProps> = ({
  chart,
  node,
  showDetails = false,
  size = 'md',
  className = ''
}) => {

  const [showTooltip, setShowTooltip] = useState(false);

  // ============================================================================
  // DATOS DE CUMPLIMIENTO
  // ============================================================================

  const getComplianceData = () => {
    if (node?.compliance) {
      return {
        status: node.compliance.status,
        score: node.compliance.score,
        issues: node.compliance.issues,
        isNodeCompliance: true
      };
    }
    
    if (chart?.compliance_status) {
      return {
        status: chart.compliance_status.summary.complies_with_regulations ? 'COMPLIANT' : 'NON_COMPLIANT',
        score: chart.compliance_status.summary.score,
        issues: chart.compliance_status.details.filter(d => d.status === 'FAIL').map(d => d.message),
        isNodeCompliance: false,
        criticalErrors: chart.compliance_status.summary.critical_errors,
        warnings: chart.compliance_status.summary.warnings
      };
    }

    return null;
  };

  const complianceData = getComplianceData();

  if (!complianceData) return null;

  // ============================================================================
  // CONFIGURACIONES POR ESTADO
  // ============================================================================

  const getStatusConfig = () => {
    switch (complianceData.status) {
      case 'COMPLIANT':
        return {
          color: 'success',
          icon: 'ri-checkbox-circle-fill',
          label: 'Cumple',
          bgClass: 'bg-success',
          textClass: 'text-success',
          description: 'Cumple con todos los requisitos SOGCS'
        };
      
      case 'NON_COMPLIANT':
        return {
          color: 'danger',
          icon: 'ri-close-circle-fill',
          label: 'No Cumple',
          bgClass: 'bg-danger',
          textClass: 'text-danger',
          description: 'No cumple con los requisitos SOGCS'
        };
      
      case 'PENDING':
        return {
          color: 'warning',
          icon: 'ri-time-fill',
          label: 'Pendiente',
          bgClass: 'bg-warning',
          textClass: 'text-warning',
          description: 'Evaluación de cumplimiento pendiente'
        };
      
      default:
        return {
          color: 'secondary',
          icon: 'ri-question-fill',
          label: 'N/A',
          bgClass: 'bg-secondary',
          textClass: 'text-muted',
          description: 'Cumplimiento no aplicable'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // ============================================================================
  // CONFIGURACIONES POR TAMAÑO
  // ============================================================================

  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return {
          containerClass: 'compliance-indicator-sm',
          iconSize: '12px',
          scoreSize: '10px',
          badgeSize: 'badge-sm'
        };
      
      case 'lg':
        return {
          containerClass: 'compliance-indicator-lg',
          iconSize: '20px',
          scoreSize: '16px',
          badgeSize: 'badge-lg'
        };
      
      default:
        return {
          containerClass: 'compliance-indicator-md',
          iconSize: '16px',
          scoreSize: '12px',
          badgeSize: ''
        };
    }
  };

  const sizeConfig = getSizeConfig();

  // ============================================================================
  // COMPONENTES DE RENDERIZADO
  // ============================================================================

  const renderCompactIndicator = () => (
    <div 
      className={`compliance-indicator ${sizeConfig.containerClass} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`compliance-badge ${statusConfig.bgClass} text-white`}>
        <i 
          className={statusConfig.icon} 
          style={{ fontSize: sizeConfig.iconSize }}
        ></i>
        <span 
          className="compliance-score"
          style={{ fontSize: sizeConfig.scoreSize }}
        >
          {complianceData.score}%
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="compliance-tooltip">
          <div className="tooltip-header">
            <strong>Cumplimiento SOGCS</strong>
          </div>
          <div className="tooltip-body">
            <div className={`status-line ${statusConfig.textClass}`}>
              <i className={statusConfig.icon}></i>
              <span>{statusConfig.label} ({complianceData.score}%)</span>
            </div>
            {statusConfig.description && (
              <p className="text-muted small mb-0">{statusConfig.description}</p>
            )}
            {complianceData.issues.length > 0 && (
              <p className="text-muted small mb-0">
                {complianceData.issues.length} observación(es)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailedIndicator = () => (
    <div className={`compliance-detailed ${className}`}>
      <div className="compliance-header">
        <div className="d-flex align-items-center gap-2">
          <i className={`${statusConfig.icon} ${statusConfig.textClass}`}></i>
          <span className="fw-bold">Cumplimiento SOGCS</span>
          <span className={`badge ${statusConfig.bgClass} text-white`}>
            {complianceData.score}%
          </span>
        </div>
        <p className="text-muted small mb-0">{statusConfig.description}</p>
      </div>

      {/* Barra de progreso */}
      <div className="compliance-progress">
        <div className="progress" style={{ height: '8px' }}>
          <div 
            className={`progress-bar ${statusConfig.bgClass}`}
            style={{ width: `${complianceData.score}%` }}
          ></div>
        </div>
        <div className="progress-labels d-flex justify-content-between mt-1">
          <small className="text-muted">0%</small>
          <small className="text-muted">100%</small>
        </div>
      </div>

      {/* Resumen de errores y advertencias */}
      {!complianceData.isNodeCompliance && (
        <div className="compliance-summary">
          <div className="row g-2">
            {complianceData.criticalErrors > 0 && (
              <div className="col-auto">
                <div className="stat-card bg-danger-subtle">
                  <div className="stat-value text-danger">{complianceData.criticalErrors}</div>
                  <div className="stat-label">Errores Críticos</div>
                </div>
              </div>
            )}
            
            {complianceData.warnings > 0 && (
              <div className="col-auto">
                <div className="stat-card bg-warning-subtle">
                  <div className="stat-value text-warning">{complianceData.warnings}</div>
                  <div className="stat-label">Advertencias</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de issues */}
      {complianceData.issues.length > 0 && (
        <div className="compliance-issues">
          <h6 className="small fw-bold text-muted mb-2">Observaciones:</h6>
          <ul className="list-unstyled mb-0">
            {complianceData.issues.slice(0, 3).map((issue, index) => (
              <li key={index} className="small text-muted mb-1">
                <i className="ri-alert-line text-warning me-1"></i>
                {issue}
              </li>
            ))}
            {complianceData.issues.length > 3 && (
              <li className="small text-muted">
                <i className="ri-more-line me-1"></i>
                +{complianceData.issues.length - 3} más...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <>
      {showDetails ? renderDetailedIndicator() : renderCompactIndicator()}
      
      {/* Estilos del componente */}
      <style jsx>{`
        .compliance-indicator {
          position: relative;
          display: inline-block;
        }

        .compliance-indicator-sm {
          font-size: 0.75rem;
        }

        .compliance-indicator-md {
          font-size: 0.875rem;
        }

        .compliance-indicator-lg {
          font-size: 1rem;
        }

        .compliance-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.75rem;
          white-space: nowrap;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .compliance-indicator-sm .compliance-badge {
          padding: 2px 6px;
          gap: 2px;
          font-size: 0.65rem;
        }

        .compliance-indicator-lg .compliance-badge {
          padding: 6px 10px;
          gap: 6px;
          font-size: 0.875rem;
        }

        .compliance-score {
          font-weight: 700;
        }

        .compliance-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 8px 12px;
          min-width: 200px;
          z-index: 1000;
          margin-bottom: 4px;
        }

        .compliance-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #fff;
        }

        .tooltip-header {
          margin-bottom: 4px;
        }

        .status-line {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
        }

        .compliance-detailed {
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 1rem;
        }

        .compliance-header {
          margin-bottom: 1rem;
        }

        .compliance-progress {
          margin-bottom: 1rem;
        }

        .compliance-summary {
          margin-bottom: 1rem;
        }

        .stat-card {
          padding: 0.5rem;
          border-radius: 6px;
          text-align: center;
          min-width: 70px;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
          margin-top: 2px;
        }

        .compliance-issues {
          border-top: 1px solid #f1f3f4;
          padding-top: 0.75rem;
        }

        /* Estados de cumplimiento */
        .bg-success { background-color: #0ab39c !important; }
        .bg-danger { background-color: #f06548 !important; }
        .bg-warning { background-color: #f7b84b !important; }
        .bg-secondary { background-color: #74788d !important; }

        .text-success { color: #0ab39c !important; }
        .text-danger { color: #f06548 !important; }
        .text-warning { color: #f7b84b !important; }

        .bg-success-subtle { background-color: rgba(10, 179, 156, 0.1) !important; }
        .bg-danger-subtle { background-color: rgba(240, 101, 72, 0.1) !important; }
        .bg-warning-subtle { background-color: rgba(247, 184, 75, 0.1) !important; }

        /* Responsive */
        @media (max-width: 576px) {
          .compliance-tooltip {
            min-width: 180px;
            left: 0;
            transform: none;
          }
          
          .stat-card {
            min-width: 60px;
          }
          
          .stat-value {
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default ComplianceIndicator;