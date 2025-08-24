/**
 * Componente de tarjeta de empleado para organigramas
 * Representa un nodo individual con información del cargo y usuario asignado
 * ZentraQMS - Sistema de Gestión de Calidad
 */

import React from 'react';
import { 
  ChartNode, 
  Cargo, 
  Assignment 
} from '../../types/organizationalChart';

interface EmployeeCardProps {
  node: ChartNode;
  cargo?: Cargo;
  assignment?: Assignment;
  isEditable?: boolean;
  showPhoto?: boolean;
  showBadges?: boolean;
  showActions?: boolean;
  compactMode?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onAssign?: () => void;
  onUnassign?: () => void;
  className?: string;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  node,
  cargo,
  assignment,
  isEditable = false,
  showPhoto = true,
  showBadges = true,
  showActions = true,
  compactMode = false,
  onClick,
  onEdit,
  onAssign,
  onUnassign,
  className = ''
}) => {

  // ============================================================================
  // FUNCIONES DE RENDERIZADO
  // ============================================================================

  const renderAvatar = () => {
    if (node.user?.photo && showPhoto) {
      return (
        <div className="employee-avatar">
          <img 
            src={node.user.photo} 
            alt={node.user.name} 
            className="avatar-img"
            loading="lazy"
          />
        </div>
      );
    } else {
      const initials = node.user?.initials || 
        node.name.split(' ').map(n => n[0]).join('').substring(0, 2);
      
      return (
        <div className="employee-avatar avatar-initials">
          <span>{initials}</span>
        </div>
      );
    }
  };

  const renderBadges = () => {
    if (!showBadges) return null;

    const badges = [];

    if (node.isVacant) {
      badges.push(
        <span key="vacant" className="badge bg-light text-dark">
          <i className="ri-user-unfollow-line me-1"></i>
          Vacante
        </span>
      );
    }

    if (node.isCritical) {
      badges.push(
        <span key="critical" className="badge bg-danger-subtle text-danger">
          <i className="ri-error-warning-line me-1"></i>
          Crítico
        </span>
      );
    }

    if (node.isTemporary) {
      badges.push(
        <span key="temporary" className="badge bg-info-subtle text-info">
          <i className="ri-time-line me-1"></i>
          Temporal
        </span>
      );
    }

    if (node.isManager) {
      badges.push(
        <span key="manager" className="badge bg-success-subtle text-success">
          <i className="ri-user-star-line me-1"></i>
          Gerente
        </span>
      );
    }

    if (cargo?.is_management && !node.isManager) {
      badges.push(
        <span key="management" className="badge bg-primary-subtle text-primary">
          <i className="ri-group-line me-1"></i>
          Dirección
        </span>
      );
    }

    return badges.length > 0 ? (
      <div className="employee-badges">
        {badges}
      </div>
    ) : null;
  };

  const renderComplianceIndicator = () => {
    if (!node.compliance) return null;

    const getComplianceColor = () => {
      switch (node.compliance!.status) {
        case 'COMPLIANT': return 'text-success';
        case 'NON_COMPLIANT': return 'text-danger';
        case 'PENDING': return 'text-warning';
        default: return 'text-muted';
      }
    };

    const getComplianceIcon = () => {
      switch (node.compliance!.status) {
        case 'COMPLIANT': return 'ri-checkbox-circle-fill';
        case 'NON_COMPLIANT': return 'ri-close-circle-fill';
        case 'PENDING': return 'ri-time-fill';
        default: return 'ri-question-fill';
      }
    };

    return (
      <div className="compliance-indicator">
        <span className={`${getComplianceColor()}`} title={`Cumplimiento SOGCS: ${node.compliance.score}%`}>
          <i className={getComplianceIcon()}></i>
          <span className="ms-1">{node.compliance.score}%</span>
        </span>
        {node.compliance.issues.length > 0 && (
          <span className="text-muted ms-2" title={`${node.compliance.issues.length} observaciones`}>
            <i className="ri-information-line"></i>
          </span>
        )}
      </div>
    );
  };

  const renderActions = () => {
    if (!showActions || (!isEditable && !node.isVacant)) return null;

    return (
      <div className="employee-actions">
        {isEditable && onEdit && (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Editar cargo"
          >
            <i className="ri-edit-line"></i>
          </button>
        )}

        {node.isVacant && onAssign && (
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
            onClick={(e) => {
              e.stopPropagation();
              onAssign();
            }}
            title="Asignar empleado"
          >
            <i className="ri-user-add-line"></i>
          </button>
        )}

        {!node.isVacant && onUnassign && isEditable && (
          <button
            type="button"
            className="btn btn-sm btn-outline-warning"
            onClick={(e) => {
              e.stopPropagation();
              onUnassign();
            }}
            title="Desasignar empleado"
          >
            <i className="ri-user-unfollow-line"></i>
          </button>
        )}
      </div>
    );
  };

  const renderContactInfo = () => {
    if (compactMode || !node.user) return null;

    return (
      <div className="employee-contact">
        {node.user.email && (
          <div className="contact-item">
            <i className="ri-mail-line text-muted"></i>
            <span className="text-muted">{node.user.email}</span>
          </div>
        )}
        {assignment?.start_date && (
          <div className="contact-item">
            <i className="ri-calendar-line text-muted"></i>
            <span className="text-muted">
              Desde: {new Date(assignment.start_date).toLocaleDateString('es-CO')}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderHierarchyInfo = () => {
    if (compactMode) return null;

    return (
      <div className="hierarchy-info">
        {node.hierarchyPath && (
          <div className="hierarchy-path">
            <i className="ri-route-line text-muted me-1"></i>
            <span className="text-muted small">{node.hierarchyPath}</span>
          </div>
        )}
        {node.directReports > 0 && (
          <div className="direct-reports">
            <i className="ri-user-3-line text-muted me-1"></i>
            <span className="text-muted small">{node.directReports} reportes directos</span>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // ESTILOS DINÁMICOS
  // ============================================================================

  const getCardStyles = () => {
    const baseStyles = 'employee-card card h-100';
    const stateStyles = [];

    if (node.isVacant) stateStyles.push('card-vacant');
    if (node.isCritical) stateStyles.push('card-critical');
    if (node.isTemporary) stateStyles.push('card-temporary');
    if (compactMode) stateStyles.push('card-compact');

    return `${baseStyles} ${stateStyles.join(' ')} ${className}`;
  };

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <div 
      className={getCardStyles()}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="card-body p-3">
        {/* Header con avatar e información básica */}
        <div className="employee-header d-flex align-items-start gap-3 mb-3">
          {renderAvatar()}
          
          <div className="employee-info flex-grow-1 min-w-0">
            <h6 className="employee-name mb-1 text-truncate">
              {node.isVacant ? (
                <span className="text-muted">
                  <i className="ri-user-unfollow-line me-1"></i>
                  Vacante
                </span>
              ) : (
                node.name
              )}
            </h6>
            
            <p className="employee-position text-muted mb-1 small text-truncate">
              {node.position}
            </p>
            
            {!compactMode && (
              <p className="employee-area text-muted mb-0 small text-truncate">
                <i className="ri-building-line me-1"></i>
                {node.area}
              </p>
            )}
          </div>

          {/* Indicador de cumplimiento */}
          {node.compliance && (
            <div className="compliance-wrapper">
              {renderComplianceIndicator()}
            </div>
          )}
        </div>

        {/* Badges de estado */}
        {renderBadges()}

        {/* Información de contacto */}
        {renderContactInfo()}

        {/* Información jerárquica */}
        {renderHierarchyInfo()}

        {/* Acciones */}
        {renderActions()}
      </div>

      {/* Estilos específicos del componente */}
      <style jsx>{`
        .employee-card {
          border: 1px solid #dee2e6;
          border-radius: 8px;
          transition: all 0.2s ease;
          min-height: 160px;
        }

        .employee-card:hover {
          border-color: #405189;
          box-shadow: 0 4px 8px rgba(64, 81, 137, 0.15);
        }

        .card-vacant {
          border-style: dashed;
          background-color: rgba(248, 249, 250, 0.5);
        }

        .card-critical {
          border-left: 4px solid #f06548;
        }

        .card-temporary {
          border-left: 4px solid #3577f1;
        }

        .card-compact {
          min-height: 120px;
        }

        .card-compact .card-body {
          padding: 0.75rem !important;
        }

        .employee-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .card-compact .employee-avatar {
          width: 40px;
          height: 40px;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-initials {
          background: linear-gradient(135deg, #405189, #3577f1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
        }

        .card-compact .avatar-initials {
          font-size: 14px;
        }

        .employee-name {
          color: #495057;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .employee-position {
          font-size: 0.875rem;
          line-height: 1.3;
        }

        .employee-area {
          font-size: 0.75rem;
          line-height: 1.2;
        }

        .employee-badges {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .employee-badges .badge {
          font-size: 0.65rem;
          padding: 0.25rem 0.5rem;
          font-weight: 500;
        }

        .employee-contact {
          margin-bottom: 8px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
          font-size: 0.75rem;
        }

        .hierarchy-info {
          margin-bottom: 8px;
          font-size: 0.75rem;
        }

        .hierarchy-path {
          margin-bottom: 2px;
        }

        .direct-reports {
          display: flex;
          align-items: center;
        }

        .employee-actions {
          display: flex;
          gap: 4px;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #f1f3f4;
        }

        .employee-actions .btn {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
        }

        .compliance-indicator {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .compliance-wrapper {
          position: relative;
        }

        @media (max-width: 576px) {
          .employee-header {
            gap: 0.5rem !important;
          }
          
          .employee-avatar {
            width: 40px;
            height: 40px;
          }
          
          .employee-name {
            font-size: 0.875rem;
          }
          
          .employee-badges .badge {
            font-size: 0.6rem;
            padding: 0.125rem 0.375rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeCard;