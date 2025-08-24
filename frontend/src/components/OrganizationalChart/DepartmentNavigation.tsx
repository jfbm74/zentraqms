/**
 * Navegación lateral por departamentos/áreas del organigrama
 * Muestra estructura jerárquica de áreas con estadísticas
 * ZentraQMS - Sistema de Gestión de Calidad
 */

import React, { useState, useMemo } from 'react';
import { 
  Area, 
  ChartFilters, 
  ChartNode 
} from '../../types/organizationalChart';
import { useOrganizationalChartStore, useChartViewSettings } from '../../stores/organizationalChart/organizationalChartStore';

interface DepartmentNavigationProps {
  areas: Area[];
  chartNodes?: ChartNode[];
  selectedAreaId?: string;
  onAreaSelect: (areaId: string | undefined) => void;
  collapsible?: boolean;
  showStatistics?: boolean;
  className?: string;
}

const DepartmentNavigation: React.FC<DepartmentNavigationProps> = ({
  areas,
  chartNodes = [],
  selectedAreaId,
  onAreaSelect,
  collapsible = true,
  showStatistics = true,
  className = ''
}) => {

  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const { filters, setFilters } = useChartViewSettings();
  
  // ============================================================================
  // DATOS COMPUTADOS
  // ============================================================================

  // Construir jerarquía de áreas
  const hierarchicalAreas = useMemo(() => {
    const areaMap = new Map<string, Area & { children: Area[] }>();
    const rootAreas: (Area & { children: Area[] })[] = [];

    // Inicializar todas las áreas con children vacío
    areas.forEach(area => {
      areaMap.set(area.id, { ...area, children: [] });
    });

    // Construir jerarquía
    areas.forEach(area => {
      const areaWithChildren = areaMap.get(area.id)!;
      
      if (area.parent_area) {
        const parent = areaMap.get(area.parent_area);
        if (parent) {
          parent.children.push(areaWithChildren);
        }
      } else {
        rootAreas.push(areaWithChildren);
      }
    });

    // Ordenar por hierarchy_level y nombre
    const sortAreas = (areaList: (Area & { children: Area[] })[]) => {
      areaList.sort((a, b) => {
        if (a.hierarchy_level !== b.hierarchy_level) {
          return a.hierarchy_level - b.hierarchy_level;
        }
        return a.name.localeCompare(b.name, 'es');
      });
      
      areaList.forEach(area => sortAreas(area.children));
    };

    sortAreas(rootAreas);
    return rootAreas;
  }, [areas]);

  // Estadísticas por área
  const areaStatistics = useMemo(() => {
    const stats = new Map<string, {
      totalPositions: number;
      filledPositions: number;
      vacantPositions: number;
      criticalPositions: number;
    }>();

    areas.forEach(area => {
      const areaNodes = chartNodes.filter(node => 
        areas.find(a => a.id === area.id && a.name === node.area)
      );

      stats.set(area.id, {
        totalPositions: areaNodes.length,
        filledPositions: areaNodes.filter(n => !n.isVacant).length,
        vacantPositions: areaNodes.filter(n => n.isVacant).length,
        criticalPositions: areaNodes.filter(n => n.isCritical).length
      });
    });

    return stats;
  }, [areas, chartNodes]);

  // ============================================================================
  // MANEJADORES DE EVENTOS
  // ============================================================================

  const handleAreaClick = (area: Area) => {
    // Si ya está seleccionada, deseleccionar
    if (selectedAreaId === area.id) {
      onAreaSelect(undefined);
      setFilters({ areaFilter: undefined });
    } else {
      onAreaSelect(area.id);
      setFilters({ areaFilter: area.name });
    }
  };

  const toggleAreaExpansion = (areaId: string, hasChildren: boolean) => {
    if (!hasChildren) return;

    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  const clearFilters = () => {
    onAreaSelect(undefined);
    setFilters({ 
      areaFilter: undefined,
      departmentFilter: undefined 
    });
  };

  // ============================================================================
  // COMPONENTES DE RENDERIZADO
  // ============================================================================

  const renderAreaIcon = (areaType: string) => {
    const iconMap: Record<string, string> = {
      'DIRECTION': 'ri-building-line',
      'SUBDIRECTION': 'ri-building-2-line',
      'DEPARTMENT': 'ri-community-line',
      'UNIT': 'ri-team-line',
      'SERVICE': 'ri-service-line',
      'SECTION': 'ri-folder-line',
      'OFFICE': 'ri-home-office-line',
      'COMMITTEE': 'ri-group-line',
      'WORKGROUP': 'ri-group-2-line'
    };

    return iconMap[areaType] || 'ri-folder-line';
  };

  const renderStatisticsBadge = (areaId: string) => {
    if (!showStatistics) return null;

    const stats = areaStatistics.get(areaId);
    if (!stats || stats.totalPositions === 0) return null;

    const vacancyRate = (stats.vacantPositions / stats.totalPositions) * 100;
    const badgeColor = vacancyRate > 30 ? 'bg-danger' : 
                      vacancyRate > 10 ? 'bg-warning' : 'bg-success';

    return (
      <div className="area-statistics">
        <span className={`badge ${badgeColor} badge-sm`}>
          {stats.filledPositions}/{stats.totalPositions}
        </span>
        {stats.criticalPositions > 0 && (
          <span className="badge bg-danger-subtle text-danger badge-sm ms-1" title="Cargos críticos">
            <i className="ri-error-warning-line"></i>
            {stats.criticalPositions}
          </span>
        )}
      </div>
    );
  };

  const renderArea = (area: Area & { children: Area[] }, level: number = 0) => {
    const hasChildren = area.children.length > 0;
    const isExpanded = expandedAreas.has(area.id);
    const isSelected = selectedAreaId === area.id;

    return (
      <div key={area.id} className="area-item">
        <div 
          className={`area-link ${isSelected ? 'area-selected' : ''}`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => handleAreaClick(area)}
        >
          {/* Indicador de expansión */}
          {collapsible && (
            <button
              className="expand-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleAreaExpansion(area.id, hasChildren);
              }}
              disabled={!hasChildren}
            >
              {hasChildren ? (
                <i className={`ri-arrow-${isExpanded ? 'down' : 'right'}-s-line`}></i>
              ) : (
                <i className="ri-subtract-line text-muted"></i>
              )}
            </button>
          )}

          {/* Icono del área */}
          <i className={`area-icon ${renderAreaIcon(area.area_type)}`}></i>

          {/* Información del área */}
          <div className="area-info flex-grow-1">
            <div className="area-name">{area.name}</div>
            {area.description && (
              <div className="area-description text-muted">{area.description}</div>
            )}
          </div>

          {/* Estadísticas */}
          {renderStatisticsBadge(area.id)}
        </div>

        {/* Áreas hijas */}
        {hasChildren && isExpanded && (
          <div className="area-children">
            {area.children.map(child => renderArea(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderHeader = () => (
    <div className="nav-header">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="nav-title mb-1">Estructura Organizacional</h6>
          <p className="nav-subtitle text-muted mb-0">
            {areas.length} {areas.length === 1 ? 'área' : 'áreas'}
          </p>
        </div>
        
        {(selectedAreaId || filters.areaFilter) && (
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={clearFilters}
            title="Limpiar filtros"
          >
            <i className="ri-close-line"></i>
          </button>
        )}
      </div>
    </div>
  );

  const renderGlobalStatistics = () => {
    if (!showStatistics) return null;

    const totalStats = Array.from(areaStatistics.values()).reduce(
      (acc, stats) => ({
        totalPositions: acc.totalPositions + stats.totalPositions,
        filledPositions: acc.filledPositions + stats.filledPositions,
        vacantPositions: acc.vacantPositions + stats.vacantPositions,
        criticalPositions: acc.criticalPositions + stats.criticalPositions
      }),
      { totalPositions: 0, filledPositions: 0, vacantPositions: 0, criticalPositions: 0 }
    );

    const vacancyRate = totalStats.totalPositions > 0 
      ? (totalStats.vacantPositions / totalStats.totalPositions) * 100 
      : 0;

    return (
      <div className="global-statistics">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{totalStats.totalPositions}</div>
            <div className="stat-label">Cargos Total</div>
          </div>
          <div className="stat-item">
            <div className="stat-value text-success">{totalStats.filledPositions}</div>
            <div className="stat-label">Ocupados</div>
          </div>
          <div className="stat-item">
            <div className="stat-value text-warning">{totalStats.vacantPositions}</div>
            <div className="stat-label">Vacantes</div>
          </div>
          {totalStats.criticalPositions > 0 && (
            <div className="stat-item">
              <div className="stat-value text-danger">{totalStats.criticalPositions}</div>
              <div className="stat-label">Críticos</div>
            </div>
          )}
        </div>
        
        <div className="vacancy-rate">
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">Tasa de Vacancia</span>
            <span className={`fw-bold ${vacancyRate > 30 ? 'text-danger' : vacancyRate > 10 ? 'text-warning' : 'text-success'}`}>
              {vacancyRate.toFixed(1)}%
            </span>
          </div>
          <div className="progress mt-1" style={{ height: '4px' }}>
            <div 
              className={`progress-bar ${vacancyRate > 30 ? 'bg-danger' : vacancyRate > 10 ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${Math.min(vacancyRate, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  if (areas.length === 0) {
    return (
      <div className={`department-navigation ${className}`}>
        <div className="empty-state text-center py-4">
          <i className="ri-building-line text-muted mb-2" style={{ fontSize: '2rem' }}></i>
          <p className="text-muted">No hay áreas configuradas</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`department-navigation ${className}`}>
      {renderHeader()}
      
      {showStatistics && (
        <div className="mb-3">
          {renderGlobalStatistics()}
        </div>
      )}

      <div className="areas-tree">
        {hierarchicalAreas.map(area => renderArea(area))}
      </div>

      {/* Estilos del componente */}
      <style jsx>{`
        .department-navigation {
          background: white;
          border-right: 1px solid #dee2e6;
          height: 100%;
          overflow-y: auto;
        }

        .nav-header {
          padding: 1rem;
          border-bottom: 1px solid #f1f3f4;
          background: #f8f9fa;
        }

        .nav-title {
          color: #495057;
          font-weight: 600;
        }

        .nav-subtitle {
          font-size: 0.875rem;
        }

        .global-statistics {
          padding: 0.75rem 1rem;
          background: #f8f9fa;
          border-bottom: 1px solid #f1f3f4;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.65rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .vacancy-rate {
          margin-top: 0.5rem;
        }

        .areas-tree {
          padding: 0.5rem 0;
        }

        .area-item {
          margin-bottom: 2px;
        }

        .area-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 4px;
          margin: 0 8px;
        }

        .area-link:hover {
          background-color: #f8f9fa;
        }

        .area-selected {
          background-color: rgba(64, 81, 137, 0.1) !important;
          border-left: 3px solid #405189;
          color: #405189;
          font-weight: 600;
        }

        .expand-toggle {
          background: none;
          border: none;
          padding: 2px;
          cursor: pointer;
          color: #6c757d;
          transition: color 0.2s ease;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .expand-toggle:hover:not(:disabled) {
          color: #405189;
        }

        .expand-toggle:disabled {
          opacity: 0.3;
          cursor: default;
        }

        .area-icon {
          color: #6c757d;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .area-selected .area-icon {
          color: #405189;
        }

        .area-info {
          min-width: 0;
        }

        .area-name {
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .area-description {
          font-size: 0.75rem;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .area-statistics {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .badge-sm {
          font-size: 0.65rem;
          padding: 0.125rem 0.375rem;
        }

        .area-children {
          margin-left: 12px;
        }

        .empty-state {
          padding: 2rem 1rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .area-name {
            font-size: 0.8rem;
          }
          
          .area-description {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DepartmentNavigation;