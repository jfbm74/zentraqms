/**
 * Vista principal del módulo de organigramas organizacionales
 * Integra todos los componentes para visualización y gestión de organigramas
 * ZentraQMS - Sistema de Gestión de Calidad
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Componentes
import OrganizationalChart from '../../components/OrganizationalChart/OrganizationalChart';
import EmployeeCard from '../../components/OrganizationalChart/EmployeeCard';
import DepartmentNavigation from '../../components/OrganizationalChart/DepartmentNavigation';
import ChartControls from '../../components/OrganizationalChart/ChartControls';
import ComplianceIndicator from '../../components/OrganizationalChart/ComplianceIndicator';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PermissionGate from '../../components/common/PermissionGate';

// Hooks y stores
import { useOrganizationalChartStore, useCurrentChart } from '../../stores/organizationalChart/organizationalChartStore';
import { useCurrentOrganization } from '../../hooks/useCurrentOrganization';

// Tipos
import { ChartNode } from '../../types/organizationalChart';

interface OrganizationalChartViewProps {
  chartId?: string; // Para visualización específica de un organigrama
}

const OrganizationalChartView: React.FC<OrganizationalChartViewProps> = ({
  chartId: propChartId
}) => {
  
  // ============================================================================
  // HOOKS Y ESTADO
  // ============================================================================
  
  const { chartId: paramChartId } = useParams<{ chartId: string }>();
  const navigate = useNavigate();
  const chartRef = useRef<any>(null);
  
  const chartId = propChartId || paramChartId;
  
  const { currentOrganization } = useCurrentOrganization();
  const { chart, chartData, areas, positions } = useCurrentChart();
  
  const {
    loading,
    errors,
    loadChart,
    loadSectors,
    buildChartData,
    selectNode,
    selectedNodeId,
    reset
  } = useOrganizationalChartStore();
  
  const [selectedAreaId, setSelectedAreaId] = useState<string | undefined>();
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedNode, setSelectedNode] = useState<ChartNode | undefined>();

  // ============================================================================
  // EFECTOS
  // ============================================================================

  // Cargar datos iniciales
  useEffect(() => {
    if (currentOrganization && !chartId) {
      // Si no hay chartId específico, cargar organigrama actual
      loadCurrentOrganizationChart();
    } else if (chartId) {
      // Cargar organigrama específico
      loadSpecificChart(chartId);
    }

    // Cargar sectores si no están cargados
    loadSectors().catch(console.error);

    // Cleanup al desmontar
    return () => {
      // No hacer reset completo para mantener configuraciones
      selectNode(undefined);
    };
  }, [currentOrganization, chartId]);

  // Actualizar nodo seleccionado
  useEffect(() => {
    if (selectedNodeId && chartData) {
      const node = chartData.nodes.find(n => n.id === selectedNodeId);
      setSelectedNode(node);
    } else {
      setSelectedNode(undefined);
    }
  }, [selectedNodeId, chartData]);

  // ============================================================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================================================

  const loadCurrentOrganizationChart = async () => {
    if (!currentOrganization) return;

    try {
      // Intentar cargar organigrama actual de la organización
      const response = await fetch(`/api/organization/organizational-charts/?organization=${currentOrganization.id}&is_current=true`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        await loadChart(data.results[0].id);
      } else {
        // No hay organigrama actual, mostrar mensaje y opción de crear
        toast.info('Esta organización no tiene un organigrama configurado');
      }
    } catch (error: any) {
      console.error('Error al cargar organigrama actual:', error);
      toast.error('Error al cargar organigrama de la organización');
    }
  };

  const loadSpecificChart = async (id: string) => {
    try {
      await loadChart(id);
    } catch (error: any) {
      console.error('Error al cargar organigrama:', error);
      toast.error('Error al cargar organigrama');
      
      // Si no se puede cargar, volver a la lista o dashboard
      navigate('/organization/charts');
    }
  };

  // ============================================================================
  // MANEJADORES DE EVENTOS
  // ============================================================================

  const handleNodeClick = (node: ChartNode) => {
    selectNode(node.id);
    setSelectedNode(node);
  };

  const handleNodeRightClick = (node: ChartNode) => {
    // Mostrar menú contextual
    console.log('Right click on node:', node);
  };

  const handleAreaSelect = (areaId: string | undefined) => {
    setSelectedAreaId(areaId);
    
    // Si se selecciona un área, centrar en el primer nodo de esa área
    if (areaId && chartData) {
      const areaNode = chartData.nodes.find(n => 
        areas.find(a => a.id === areaId && a.name === n.area)
      );
      if (areaNode && chartRef.current) {
        chartRef.current.centerOnNode(areaNode.id);
      }
    }
  };

  const handleExport = async (format: 'PDF' | 'PNG' | 'SVG') => {
    if (!chartRef.current) return;

    try {
      if (format === 'PNG' || format === 'SVG') {
        const exportData = chartRef.current.exportChart(format.toLowerCase());
        
        // Crear blob y descargar
        const blob = new Blob([exportData], { 
          type: format === 'PNG' ? 'image/png' : 'image/svg+xml' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `organigrama_${chart?.version || 'current'}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error('Error al exportar:', error);
      throw error;
    }
  };

  const handleExpandAll = () => {
    if (chartRef.current) {
      chartRef.current.expandAll();
    }
  };

  const handleCollapseAll = () => {
    if (chartRef.current) {
      chartRef.current.collapseAll();
    }
  };

  const handleCenterChart = () => {
    if (chartRef.current && chartData) {
      chartRef.current.centerOnNode(chartData.root.id);
    }
  };

  const handleFitToScreen = () => {
    if (chartRef.current) {
      // Implementar ajuste a pantalla
      console.log('Fit to screen');
    }
  };

  // ============================================================================
  // RENDERIZADO DE COMPONENTES
  // ============================================================================

  const renderHeader = () => (
    <div className="chart-header">
      <div className="d-flex justify-content-between align-items-start">
        <div className="chart-info">
          <div className="d-flex align-items-center gap-3">
            <h2 className="h4 mb-1">
              Organigrama Organizacional
              {chart && (
                <span className="badge bg-primary-subtle text-primary ms-2">
                  v{chart.version}
                </span>
              )}
            </h2>
            
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-lg-none"
              onClick={() => setShowSidebar(!showSidebar)}
              title="Alternar navegación"
            >
              <i className="ri-menu-line"></i>
            </button>
          </div>

          {chart && (
            <div className="chart-meta d-flex align-items-center gap-3 text-muted">
              <span>
                <i className="ri-building-line me-1"></i>
                {currentOrganization?.nombre_comercial}
              </span>
              <span>
                <i className="ri-calendar-line me-1"></i>
                Vigente desde: {new Date(chart.effective_date).toLocaleDateString('es-CO')}
              </span>
              {chart.sector === 'HEALTH' && (
                <ComplianceIndicator chart={chart} size="sm" />
              )}
            </div>
          )}
        </div>

        <div className="chart-actions">
          <PermissionGate permissions={['organization.change_organizationalchart']}>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm me-2"
              onClick={() => navigate(`/organization/charts/${chart?.id}/edit`)}
              disabled={!chart}
            >
              <i className="ri-edit-line me-1"></i>
              Editar
            </button>
          </PermissionGate>

          <PermissionGate permissions={['organization.add_organizationalchart']}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/organization/charts/new')}
            >
              <i className="ri-add-line me-1"></i>
              Nuevo
            </button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className={`chart-sidebar ${!showSidebar ? 'd-none d-lg-block' : ''}`}>
      {areas.length > 0 && (
        <DepartmentNavigation
          areas={areas}
          chartNodes={chartData?.nodes}
          selectedAreaId={selectedAreaId}
          onAreaSelect={handleAreaSelect}
          showStatistics={true}
        />
      )}
    </div>
  );

  const renderMainContent = () => {
    if (loading.chart) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="text-center">
            <LoadingSpinner />
            <p className="text-muted mt-2">Cargando organigrama...</p>
          </div>
        </div>
      );
    }

    if (errors.load) {
      return (
        <div className="alert alert-danger" role="alert">
          <div className="d-flex align-items-center">
            <i className="ri-error-warning-line me-2"></i>
            <div>
              <h5 className="alert-heading">Error al cargar organigrama</h5>
              <p className="mb-0">{errors.load}</p>
            </div>
          </div>
        </div>
      );
    }

    if (!chart) {
      return (
        <div className="empty-state">
          <div className="text-center py-5">
            <i className="ri-organization-chart text-muted mb-3" style={{ fontSize: '4rem' }}></i>
            <h4 className="text-muted">No hay organigrama configurado</h4>
            <p className="text-muted">Esta organización aún no tiene un organigrama definido.</p>
            
            <PermissionGate permissions={['organization.add_organizationalchart']}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/organization/charts/new')}
              >
                <i className="ri-add-line me-2"></i>
                Crear Organigrama
              </button>
            </PermissionGate>
          </div>
        </div>
      );
    }

    return (
      <div className="chart-content">
        {/* Controles */}
        <ChartControls
          onExport={handleExport}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onCenterChart={handleCenterChart}
          onFitToScreen={handleFitToScreen}
        />

        {/* Organigrama */}
        <div className="chart-container">
          <OrganizationalChart
            ref={chartRef}
            chartData={chartData}
            onNodeClick={handleNodeClick}
            onNodeRightClick={handleNodeRightClick}
            height={600}
          />
        </div>
      </div>
    );
  };

  const renderSelectedNodeDetail = () => {
    if (!selectedNode) return null;

    return (
      <div className="selected-node-detail">
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Detalles del Cargo</h6>
              <button
                type="button"
                className="btn-close"
                onClick={() => selectNode(undefined)}
              ></button>
            </div>
          </div>
          <div className="card-body p-0">
            <EmployeeCard
              node={selectedNode}
              showActions={true}
              showPhoto={true}
              showBadges={true}
              className="border-0"
            />
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <div className="organizational-chart-view">
      {renderHeader()}

      <div className="chart-layout">
        {/* Sidebar */}
        {areas.length > 0 && renderSidebar()}

        {/* Contenido principal */}
        <div className={`chart-main ${areas.length > 0 && showSidebar ? 'with-sidebar' : ''}`}>
          {renderMainContent()}
        </div>

        {/* Panel de detalles */}
        {selectedNode && (
          <div className="chart-details">
            {renderSelectedNodeDetail()}
          </div>
        )}
      </div>

      {/* Estilos del componente */}
      <style jsx>{`
        .organizational-chart-view {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
        }

        .chart-header {
          background: white;
          border-bottom: 1px solid #dee2e6;
          padding: 1.5rem;
          flex-shrink: 0;
        }

        .chart-meta {
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .chart-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .chart-sidebar {
          width: 320px;
          flex-shrink: 0;
          background: white;
          border-right: 1px solid #dee2e6;
          overflow-y: auto;
        }

        .chart-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .with-sidebar {
          width: calc(100% - 320px);
        }

        .chart-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chart-container {
          flex: 1;
          overflow: auto;
          background: white;
        }

        .chart-details {
          width: 300px;
          flex-shrink: 0;
          background: white;
          border-left: 1px solid #dee2e6;
          overflow-y: auto;
          padding: 1rem;
        }

        .selected-node-detail .card {
          border: none;
        }

        .empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .chart-details {
            position: fixed;
            top: 0;
            right: -300px;
            height: 100vh;
            z-index: 1050;
            transition: right 0.3s ease;
            box-shadow: -2px 0 8px rgba(0,0,0,0.15);
          }

          .chart-details.show {
            right: 0;
          }
        }

        @media (max-width: 992px) {
          .chart-sidebar {
            position: fixed;
            top: 0;
            left: -320px;
            height: 100vh;
            z-index: 1040;
            transition: left 0.3s ease;
            box-shadow: 2px 0 8px rgba(0,0,0,0.15);
          }

          .chart-sidebar.show {
            left: 0;
          }

          .with-sidebar {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .chart-header {
            padding: 1rem;
          }

          .chart-header h2 {
            font-size: 1.25rem;
          }

          .chart-meta {
            flex-direction: column;
            gap: 0.25rem !important;
            align-items: flex-start !important;
          }

          .chart-actions {
            gap: 0.5rem;
          }

          .chart-actions .btn {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default OrganizationalChartView;