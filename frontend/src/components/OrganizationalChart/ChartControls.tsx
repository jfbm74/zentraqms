/**
 * Controles para el organigrama: zoom, vista, filtros y exportación
 * ZentraQMS - Sistema de Gestión de Calidad
 */

import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';

import {
  ChartViewConfig,
  ChartFilters,
  ExportOptions,
  HIERARCHY_LEVEL_CHOICES,
  HierarchyLevel
} from '../../types/organizationalChart';
import { useChartViewSettings, useOrganizationalChartStore } from '../../stores/organizationalChart/organizationalChartStore';
import organizationalChartService from '../../services/organizationalChart/organizationalChartService';

interface ChartControlsProps {
  onExport?: (format: 'PDF' | 'PNG' | 'SVG') => Promise<void>;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onCenterChart?: () => void;
  onFitToScreen?: () => void;
  showExportOptions?: boolean;
  className?: string;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  onExport,
  onExpandAll,
  onCollapseAll,
  onCenterChart,
  onFitToScreen,
  showExportOptions = true,
  className = ''
}) => {

  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportFormRef = useRef<HTMLFormElement>(null);

  const { viewConfig, filters, setViewConfig, setFilters } = useChartViewSettings();
  const { currentChart, areas } = useOrganizationalChartStore(state => ({
    currentChart: state.currentChart,
    areas: state.areas
  }));

  // ============================================================================
  // MANEJADORES DE ZOOM Y VISTA
  // ============================================================================

  const handleZoomIn = () => {
    const newZoom = Math.min(viewConfig.zoomLevel + 0.25, 3);
    setViewConfig({ zoomLevel: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(viewConfig.zoomLevel - 0.25, 0.25);
    setViewConfig({ zoomLevel: newZoom });
  };

  const handleResetZoom = () => {
    setViewConfig({ zoomLevel: 1 });
  };

  const toggleLayout = () => {
    setViewConfig({ 
      layout: viewConfig.layout === 'vertical' ? 'horizontal' : 'vertical' 
    });
  };

  const toggleCompactMode = () => {
    setViewConfig({ compactMode: !viewConfig.compactMode });
  };

  const togglePhotos = () => {
    setViewConfig({ showPhotos: !viewConfig.showPhotos });
  };

  const toggleBadges = () => {
    setViewConfig({ showBadges: !viewConfig.showBadges });
  };

  const toggleHierarchyLines = () => {
    setViewConfig({ showHierarchyLines: !viewConfig.showHierarchyLines });
  };

  // ============================================================================
  // MANEJADORES DE FILTROS
  // ============================================================================

  const clearAllFilters = () => {
    setFilters({
      showVacantOnly: false,
      showCriticalOnly: false,
      areaFilter: undefined,
      levelFilter: undefined,
      departmentFilter: undefined,
      searchQuery: ''
    });
    toast.success('Filtros eliminados');
  };

  const toggleVacantFilter = () => {
    setFilters({ showVacantOnly: !filters.showVacantOnly });
  };

  const toggleCriticalFilter = () => {
    setFilters({ showCriticalOnly: !filters.showCriticalOnly });
  };

  const handleLevelFilter = (level: HierarchyLevel | undefined) => {
    setFilters({ levelFilter: level });
  };

  const handleSearchChange = (query: string) => {
    setFilters({ searchQuery: query });
  };

  // ============================================================================
  // MANEJADORES DE EXPORTACIÓN
  // ============================================================================

  const handleExportClick = async (format: 'PDF' | 'PNG' | 'SVG') => {
    if (!currentChart || !onExport) return;

    setIsExporting(true);
    try {
      await onExport(format);
      toast.success(`Organigrama exportado como ${format}`);
    } catch (error: any) {
      toast.error(`Error al exportar: ${error.message}`);
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  const handleAdvancedExport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentChart || !exportFormRef.current) return;

    const formData = new FormData(exportFormRef.current);
    const options: ExportOptions = {
      format: formData.get('format') as 'PDF' | 'PNG' | 'SVG',
      includeMetadata: formData.get('includeMetadata') === 'on',
      includeCompliance: formData.get('includeCompliance') === 'on',
      pageSize: formData.get('pageSize') as 'A4' | 'A3' | 'LETTER',
      orientation: formData.get('orientation') as 'portrait' | 'landscape',
      quality: parseInt(formData.get('quality') as string) || 100
    };

    setIsExporting(true);
    try {
      const blob = await organizationalChartService.export.exportToPdf(currentChart.id, options);
      const filename = `organigrama_${currentChart.organization}_v${currentChart.version}.${options.format.toLowerCase()}`;
      organizationalChartService.export.downloadFile(blob, filename);
      
      toast.success(`Organigrama exportado exitosamente`);
    } catch (error: any) {
      toast.error(`Error al exportar: ${error.message}`);
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  // ============================================================================
  // COMPONENTES DE RENDERIZADO
  // ============================================================================

  const renderZoomControls = () => (
    <div className="control-group">
      <label className="control-label">Zoom</label>
      <div className="btn-group" role="group">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={handleZoomOut}
          disabled={viewConfig.zoomLevel <= 0.25}
          title="Alejar"
        >
          <i className="ri-subtract-line"></i>
        </button>
        
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={handleResetZoom}
          title={`Zoom: ${Math.round(viewConfig.zoomLevel * 100)}%`}
        >
          {Math.round(viewConfig.zoomLevel * 100)}%
        </button>
        
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={handleZoomIn}
          disabled={viewConfig.zoomLevel >= 3}
          title="Acercar"
        >
          <i className="ri-add-line"></i>
        </button>
      </div>
    </div>
  );

  const renderViewControls = () => (
    <div className="control-group">
      <label className="control-label">Vista</label>
      <div className="btn-group" role="group">
        <button
          type="button"
          className={`btn btn-sm ${viewConfig.layout === 'vertical' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setViewConfig({ layout: 'vertical' })}
          title="Vista vertical"
        >
          <i className="ri-layout-column-line"></i>
        </button>
        
        <button
          type="button"
          className={`btn btn-sm ${viewConfig.layout === 'horizontal' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setViewConfig({ layout: 'horizontal' })}
          title="Vista horizontal"
        >
          <i className="ri-layout-row-line"></i>
        </button>
        
        <button
          type="button"
          className={`btn btn-sm ${viewConfig.compactMode ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={toggleCompactMode}
          title="Modo compacto"
        >
          <i className="ri-compress-2-line"></i>
        </button>
      </div>
    </div>
  );

  const renderDisplayOptions = () => (
    <div className="control-group">
      <label className="control-label">Mostrar</label>
      <div className="display-toggles">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="showPhotos"
            checked={viewConfig.showPhotos}
            onChange={togglePhotos}
          />
          <label className="form-check-label" htmlFor="showPhotos">
            Fotos
          </label>
        </div>
        
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="showBadges"
            checked={viewConfig.showBadges}
            onChange={toggleBadges}
          />
          <label className="form-check-label" htmlFor="showBadges">
            Badges
          </label>
        </div>
        
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="showLines"
            checked={viewConfig.showHierarchyLines}
            onChange={toggleHierarchyLines}
          />
          <label className="form-check-label" htmlFor="showLines">
            Líneas
          </label>
        </div>
      </div>
    </div>
  );

  const renderNavigationControls = () => (
    <div className="control-group">
      <label className="control-label">Navegación</label>
      <div className="btn-group" role="group">
        {onExpandAll && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onExpandAll}
            title="Expandir todo"
          >
            <i className="ri-node-tree"></i>
          </button>
        )}
        
        {onCollapseAll && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onCollapseAll}
            title="Contraer todo"
          >
            <i className="ri-subtract-box-line"></i>
          </button>
        )}
        
        {onCenterChart && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onCenterChart}
            title="Centrar"
          >
            <i className="ri-focus-2-line"></i>
          </button>
        )}
        
        {onFitToScreen && (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onFitToScreen}
            title="Ajustar a pantalla"
          >
            <i className="ri-fullscreen-line"></i>
          </button>
        )}
      </div>
    </div>
  );

  const renderFiltersPanel = () => (
    <div className={`filters-panel ${showFiltersPanel ? 'filters-panel-open' : ''}`}>
      <div className="filters-header">
        <h6 className="mb-0">Filtros</h6>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setShowFiltersPanel(false)}
        >
          <i className="ri-close-line"></i>
        </button>
      </div>
      
      <div className="filters-body">
        {/* Búsqueda */}
        <div className="mb-3">
          <label className="form-label small">Buscar</label>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Nombre, cargo o área..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Filtros rápidos */}
        <div className="mb-3">
          <label className="form-label small">Filtros rápidos</label>
          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className={`btn btn-sm ${filters.showVacantOnly ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={toggleVacantFilter}
            >
              <i className="ri-user-unfollow-line me-1"></i>
              Solo vacantes
            </button>
            
            <button
              type="button"
              className={`btn btn-sm ${filters.showCriticalOnly ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={toggleCriticalFilter}
            >
              <i className="ri-error-warning-line me-1"></i>
              Solo críticos
            </button>
          </div>
        </div>

        {/* Filtro por nivel jerárquico */}
        <div className="mb-3">
          <label className="form-label small">Nivel jerárquico</label>
          <select
            className="form-select form-select-sm"
            value={filters.levelFilter || ''}
            onChange={(e) => handleLevelFilter(e.target.value as HierarchyLevel || undefined)}
          >
            <option value="">Todos los niveles</option>
            {HIERARCHY_LEVEL_CHOICES.map(level => (
              <option key={level} value={level}>
                {level.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Botón limpiar filtros */}
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary w-100"
          onClick={clearAllFilters}
        >
          <i className="ri-refresh-line me-1"></i>
          Limpiar filtros
        </button>
      </div>
    </div>
  );

  const renderExportModal = () => (
    <div className={`modal fade ${showExportModal ? 'show' : ''}`} 
         style={{ display: showExportModal ? 'block' : 'none' }}
         tabIndex={-1}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Exportar Organigrama</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowExportModal(false)}
            ></button>
          </div>
          
          <form ref={exportFormRef} onSubmit={handleAdvancedExport}>
            <div className="modal-body">
              {/* Formato */}
              <div className="mb-3">
                <label className="form-label">Formato</label>
                <div className="row">
                  <div className="col">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="format" value="PDF" id="formatPDF" defaultChecked />
                      <label className="form-check-label" htmlFor="formatPDF">PDF</label>
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="format" value="PNG" id="formatPNG" />
                      <label className="form-check-label" htmlFor="formatPNG">PNG</label>
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="format" value="SVG" id="formatSVG" />
                      <label className="form-check-label" htmlFor="formatSVG">SVG</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tamaño de página */}
              <div className="mb-3">
                <label className="form-label">Tamaño de página</label>
                <select className="form-select" name="pageSize" defaultValue="A4">
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="LETTER">Carta</option>
                </select>
              </div>

              {/* Orientación */}
              <div className="mb-3">
                <label className="form-label">Orientación</label>
                <div className="row">
                  <div className="col">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="orientation" value="portrait" id="portrait" defaultChecked />
                      <label className="form-check-label" htmlFor="portrait">Vertical</label>
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="orientation" value="landscape" id="landscape" />
                      <label className="form-check-label" htmlFor="landscape">Horizontal</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opciones adicionales */}
              <div className="mb-3">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" name="includeMetadata" id="includeMetadata" defaultChecked />
                  <label className="form-check-label" htmlFor="includeMetadata">
                    Incluir metadatos (versión, fecha, etc.)
                  </label>
                </div>
                
                {currentChart?.sector === 'HEALTH' && (
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" name="includeCompliance" id="includeCompliance" />
                    <label className="form-check-label" htmlFor="includeCompliance">
                      Incluir indicadores de cumplimiento SOGCS
                    </label>
                  </div>
                )}
              </div>

              {/* Calidad para PNG */}
              <div className="mb-3">
                <label className="form-label">Calidad (para PNG)</label>
                <input type="range" className="form-range" name="quality" min="50" max="100" defaultValue="100" />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowExportModal(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Exportando...
                  </>
                ) : (
                  <>
                    <i className="ri-download-line me-1"></i>
                    Exportar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <>
      <div className={`chart-controls ${className}`}>
        <div className="controls-wrapper">
          
          {/* Controles principales */}
          <div className="main-controls">
            {renderZoomControls()}
            {renderViewControls()}
            {renderNavigationControls()}
          </div>

          {/* Opciones de visualización */}
          <div className="display-controls">
            {renderDisplayOptions()}
          </div>

          {/* Filtros y exportación */}
          <div className="action-controls">
            <div className="control-group">
              <button
                type="button"
                className={`btn btn-sm ${showFiltersPanel ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              >
                <i className="ri-filter-3-line me-1"></i>
                Filtros
              </button>
              
              {showExportOptions && (
                <div className="btn-group">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={() => handleExportClick('PNG')}
                    disabled={isExporting}
                  >
                    <i className="ri-image-line me-1"></i>
                    PNG
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success dropdown-toggle dropdown-toggle-split"
                    data-bs-toggle="dropdown"
                  >
                    <span className="visually-hidden">Toggle Dropdown</span>
                  </button>
                  
                  <ul className="dropdown-menu">
                    <li>
                      <a className="dropdown-item" href="#" onClick={() => handleExportClick('PDF')}>
                        <i className="ri-file-pdf-line me-2"></i>PDF
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#" onClick={() => handleExportClick('SVG')}>
                        <i className="ri-file-code-line me-2"></i>SVG
                      </a>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <a className="dropdown-item" href="#" onClick={() => setShowExportModal(true)}>
                        <i className="ri-settings-3-line me-2"></i>Opciones avanzadas
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de filtros */}
        {renderFiltersPanel()}
      </div>

      {/* Modal de exportación */}
      {showExportModal && renderExportModal()}

      {/* Estilos del componente */}
      <style jsx>{`
        .chart-controls {
          background: white;
          border-bottom: 1px solid #dee2e6;
          padding: 0.75rem 1rem;
          position: relative;
        }

        .controls-wrapper {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .main-controls,
        .display-controls,
        .action-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          align-items: flex-start;
        }

        .control-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0;
        }

        .display-toggles {
          display: flex;
          gap: 1rem;
        }

        .display-toggles .form-check {
          margin-bottom: 0;
        }

        .display-toggles .form-check-label {
          font-size: 0.875rem;
          color: #495057;
        }

        .filters-panel {
          position: absolute;
          top: 100%;
          right: 0;
          width: 300px;
          background: white;
          border: 1px solid #dee2e6;
          border-top: none;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          z-index: 1050;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .filters-panel-open {
          max-height: 400px;
        }

        .filters-header {
          display: flex;
          justify-content: between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid #f1f3f4;
          background: #f8f9fa;
        }

        .filters-body {
          padding: 0.75rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .controls-wrapper {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .main-controls,
          .display-controls,
          .action-controls {
            justify-content: center;
            flex-wrap: wrap;
          }

          .display-toggles {
            justify-content: center;
          }

          .filters-panel {
            width: 100%;
            right: 0;
          }
        }
      `}</style>
    </>
  );
};

export default ChartControls;