/**
 * Componente principal de visualización de organigrama
 * Utiliza d3-org-chart para renderizar el organigrama interactivo
 * ZentraQMS - Sistema de Gestión de Calidad
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3';

import { 
  ChartData, 
  ChartNode, 
  ChartViewConfig, 
  ChartFilters 
} from '../../types/organizationalChart';
import { useOrganizationalChartStore, useChartViewSettings } from '../../stores/organizationalChart/organizationalChartStore';
import LoadingSpinner from '../common/LoadingSpinner';

interface OrganizationalChartProps {
  chartData?: ChartData;
  onNodeClick?: (node: ChartNode) => void;
  onNodeRightClick?: (node: ChartNode) => void;
  className?: string;
  height?: number;
  width?: number;
}

const OrganizationalChart: React.FC<OrganizationalChartProps> = ({
  chartData,
  onNodeClick,
  onNodeRightClick,
  className = '',
  height = 600,
  width
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  
  const { viewConfig, filters } = useChartViewSettings();
  const { loading } = useOrganizationalChartStore(state => ({ loading: state.loading }));

  // ============================================================================
  // CONFIGURACIÓN DEL NODO
  // ============================================================================

  const nodeTemplate = useCallback((d: any, i: number, arr: any[]) => {
    const node = d.data as ChartNode;
    
    // Configurar colores según estado
    const getNodeColor = () => {
      if (node.isVacant) return '#f8f9fa'; // Gris claro para vacantes
      if (node.isCritical) return '#fff5f5'; // Rosa claro para críticos
      if (node.isTemporary) return '#f0f9ff'; // Azul claro para temporales
      return '#ffffff'; // Blanco por defecto
    };

    const getBorderColor = () => {
      if (node.isVacant) return '#6c757d'; // Gris
      if (node.isCritical) return '#dc3545'; // Rojo
      if (node.isTemporary) return '#0d6efd'; // Azul
      if (node.isManager) return '#0ab39c'; // Verde para gerentes
      return '#405189'; // Azul primario por defecto
    };

    // Avatar del usuario
    const renderAvatar = () => {
      if (node.user?.photo && viewConfig.showPhotos) {
        return `
          <div class="org-node-avatar">
            <img src="${node.user.photo}" alt="${node.user.name}" class="avatar-img" />
          </div>
        `;
      } else {
        const initials = node.user?.initials || node.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        return `
          <div class="org-node-avatar avatar-initials">
            <span>${initials}</span>
          </div>
        `;
      }
    };

    // Badges de estado
    const renderBadges = () => {
      if (!viewConfig.showBadges) return '';
      
      const badges = [];
      if (node.isVacant) badges.push('<span class="org-badge badge-vacant">Vacante</span>');
      if (node.isCritical) badges.push('<span class="org-badge badge-critical">Crítico</span>');
      if (node.isTemporary) badges.push('<span class="org-badge badge-temporary">Temporal</span>');
      if (node.isManager) badges.push('<span class="org-badge badge-manager">Gerente</span>');
      
      return badges.length > 0 ? `<div class="org-badges">${badges.join('')}</div>` : '';
    };

    // Indicador de cumplimiento SOGCS
    const renderComplianceIndicator = () => {
      if (!node.compliance) return '';
      
      const statusClass = {
        'COMPLIANT': 'compliance-good',
        'NON_COMPLIANT': 'compliance-bad',
        'PENDING': 'compliance-pending',
        'NOT_APPLICABLE': 'compliance-na'
      }[node.compliance.status] || 'compliance-na';

      return `
        <div class="org-compliance ${statusClass}" title="Cumplimiento: ${node.compliance.score}%">
          <i class="ri-checkbox-circle-line"></i>
          <span>${node.compliance.score}%</span>
        </div>
      `;
    };

    return `
      <div class="org-node ${viewConfig.compactMode ? 'org-node-compact' : ''}"
           style="background-color: ${getNodeColor()}; border-color: ${getBorderColor()};">
        
        <div class="org-node-header">
          ${renderAvatar()}
          <div class="org-node-info">
            <div class="org-node-name" title="${node.name}">
              ${node.isVacant ? 'Vacante' : node.name}
            </div>
            <div class="org-node-position" title="${node.position}">
              ${node.position}
            </div>
            ${!viewConfig.compactMode ? `
              <div class="org-node-area" title="${node.area}">
                ${node.area}
              </div>
            ` : ''}
          </div>
        </div>

        ${!viewConfig.compactMode ? renderBadges() : ''}
        
        ${node.directReports > 0 ? `
          <div class="org-node-reports">
            <i class="ri-user-3-line"></i>
            <span>${node.directReports} reportes directos</span>
          </div>
        ` : ''}

        ${node.compliance ? renderComplianceIndicator() : ''}
      </div>
    `;
  }, [viewConfig]);

  // ============================================================================
  // INICIALIZACIÓN Y CONFIGURACIÓN DEL GRÁFICO
  // ============================================================================

  const initializeChart = useCallback(() => {
    if (!chartRef.current || !chartData) return;

    // Limpiar instancia anterior
    if (chartInstanceRef.current) {
      d3.select(chartRef.current).selectAll('*').remove();
    }

    // Crear nueva instancia
    const chart = new OrgChart();
    chartInstanceRef.current = chart;

    // Configuración básica
    chart
      .container(chartRef.current)
      .data(chartData.nodes)
      .nodeId(d => d.id)
      .parentNodeId(d => d.parentId)
      .nodeContent(nodeTemplate)
      .nodeWidth(() => viewConfig.compactMode ? 200 : 280)
      .nodeHeight(() => viewConfig.compactMode ? 80 : 120)
      .childrenMargin(() => 50)
      .siblingsMargin(() => 20)
      .neighbourMargin(() => 20)
      .compact(viewConfig.compactMode)
      .layout(viewConfig.layout === 'horizontal' ? 'left' : 'top')
      .initialZoom(viewConfig.zoomLevel);

    // Configurar conexiones
    if (viewConfig.showHierarchyLines) {
      chart.linkUpdate(function (d: any, i: number, arr: any[]) {
        d3.select(this)
          .attr('stroke', '#dee2e6')
          .attr('stroke-width', 2)
          .attr('fill', 'none');
      });
    }

    // Eventos
    chart
      .onNodeClick((nodeId: string) => {
        const node = chartData.nodes.find(n => n.id === nodeId);
        if (node && onNodeClick) {
          onNodeClick(node);
        }
      })
      .onNodeRightClick?.((nodeId: string) => {
        const node = chartData.nodes.find(n => n.id === nodeId);
        if (node && onNodeRightClick) {
          onNodeRightClick(node);
        }
      });

    // Renderizar
    chart.render();

    // Centrar en nodo específico si está configurado
    if (viewConfig.centerOnNode) {
      chart.setCentered(viewConfig.centerOnNode);
    }

  }, [chartData, viewConfig, nodeTemplate, onNodeClick, onNodeRightClick]);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    initializeChart();
  }, [initializeChart]);

  // Re-renderizar cuando cambien las configuraciones
  useEffect(() => {
    if (chartInstanceRef.current && chartData) {
      chartInstanceRef.current
        .nodeWidth(() => viewConfig.compactMode ? 200 : 280)
        .nodeHeight(() => viewConfig.compactMode ? 80 : 120)
        .compact(viewConfig.compactMode)
        .layout(viewConfig.layout === 'horizontal' ? 'left' : 'top')
        .render();
    }
  }, [viewConfig.compactMode, viewConfig.layout, viewConfig.showPhotos, viewConfig.showBadges]);

  // Aplicar zoom cuando cambie
  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.initialZoom(viewConfig.zoomLevel);
    }
  }, [viewConfig.zoomLevel]);

  // ============================================================================
  // MÉTODOS PÚBLICOS
  // ============================================================================

  const centerOnNode = useCallback((nodeId: string) => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.setCentered(nodeId);
    }
  }, []);

  const expandAll = useCallback(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.expandAll();
    }
  }, []);

  const collapseAll = useCallback(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.collapseAll();
    }
  }, []);

  const exportChart = useCallback((format: 'svg' | 'png' = 'png') => {
    if (!chartInstanceRef.current) return;

    if (format === 'svg') {
      return chartInstanceRef.current.exportSvg();
    } else {
      return chartInstanceRef.current.exportImg();
    }
  }, []);

  // Exponer métodos a través de ref si es necesario
  React.useImperativeHandle(React.forwardRef(() => null).ref, () => ({
    centerOnNode,
    expandAll,
    collapseAll,
    exportChart
  }));

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading.chart) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height }}>
        <LoadingSpinner />
        <span className="ms-2">Cargando organigrama...</span>
      </div>
    );
  }

  if (!chartData || chartData.nodes.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height }}>
        <div className="text-center">
          <i className="ri-organization-chart text-muted" style={{ fontSize: '3rem' }}></i>
          <p className="text-muted mt-2">No hay datos de organigrama disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`organizational-chart-container ${className}`}>
      <div
        ref={chartRef}
        className="org-chart-wrapper"
        style={{ 
          height,
          width: width || '100%',
          overflow: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}
      />
      
      <style>{`
        .org-node {
          background: white;
          border: 2px solid #405189;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .org-node:hover {
          box-shadow: 0 4px 8px rgba(64,81,137,0.15);
          transform: translateY(-1px);
        }

        .org-node-compact {
          padding: 8px;
        }

        .org-node-header {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .org-node-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .org-node-compact .org-node-avatar {
          width: 32px;
          height: 32px;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-initials {
          background: #405189;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .org-node-info {
          flex: 1;
          min-width: 0;
        }

        .org-node-name {
          font-weight: 600;
          color: #495057;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .org-node-position {
          font-size: 12px;
          color: #6c757d;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .org-node-area {
          font-size: 11px;
          color: #868e96;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .org-badges {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .org-badge {
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
          white-space: nowrap;
        }

        .badge-vacant { background: rgba(108,117,125,0.1); color: #6c757d; }
        .badge-critical { background: rgba(220,53,69,0.1); color: #dc3545; }
        .badge-temporary { background: rgba(13,110,253,0.1); color: #0d6efd; }
        .badge-manager { background: rgba(10,179,156,0.1); color: #0ab39c; }

        .org-node-reports {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #6c757d;
          margin-top: 6px;
        }

        .org-compliance {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          border: 2px solid white;
        }

        .compliance-good { background: #0ab39c; color: white; }
        .compliance-bad { background: #f06548; color: white; }
        .compliance-pending { background: #f7b84b; color: white; }
        .compliance-na { background: #adb5bd; color: white; }

        .org-chart-wrapper svg {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default OrganizationalChart;