/**
 * Step 3d: Sedes Management Component (Professional Velzon Style)
 *
 * Handles sede prestadora management with CRUD operations, import/export,
 * and comprehensive filtering capabilities
 */
import React, { useState, useEffect } from "react";
import { useSedeStore } from "../../../stores/sedeStore";
import { useBootstrapTooltips } from "../../../hooks/useBootstrapTooltips";
import InfoTooltip from "../../common/InfoTooltip";
import SedeFormModal from "../../forms/SedeFormModal";
import SedesTable from "../../tables/SedesTable";
import SedesImporter from "../../importers/SedesImporter";
import type {
  SedeListItem,
  SedeFilters,
  SedeFormData,
  SedePrestadora,
  SedeImportResponse,
} from "../../../types/sede.types";

// Types
interface Step3dProps {
  organizationId: string;
  readonly?: boolean;
  onSedeCreate?: (sede: SedePrestadora) => void;
  onSedeUpdate?: (sede: SedePrestadora) => void;
  onSedeDelete?: (sedeId: string) => void;
}

const Step3dSedesManagement: React.FC<Step3dProps> = ({
  organizationId,
  readonly = false,
  onSedeCreate,
  onSedeUpdate,
  onSedeDelete,
}) => {
  // Bootstrap tooltips hook
  useBootstrapTooltips([], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 200, hide: 100 },
    animation: true
  });

  // Zustand store
  const {
    sedes,
    loading,
    error,
    filters,
    pagination,
    fetchSedes,
    createSede,
    updateSede,
    deleteSede,
    setFilters,
    clearError,
    exportSedes,
  } = useSedeStore();

  // Local state
  const [showSedeModal, setShowSedeModal] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [editingSede, setEditingSede] = useState<SedeListItem | null>(null);
  const [selectedSedes, setSelectedSedes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkOperating, setBulkOperating] = useState(false);

  // Load sedes on mount
  useEffect(() => {
    if (organizationId && organizationId.trim() !== '') {
      fetchSedes(organizationId);
    } else {
      console.warn('[Step3dSedesManagement] No valid organizationId provided:', organizationId);
    }
  }, [organizationId, fetchSedes]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        handleFiltersChange({ search: searchTerm, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters.search]);

  // Event handlers
  const handleFiltersChange = (newFilters: Partial<SedeFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchSedes(organizationId, updatedFilters);
  };

  const handleCreateSede = () => {
    setEditingSede(null);
    setShowSedeModal(true);
  };

  const handleEditSede = (sede: SedeListItem) => {
    setEditingSede(sede);
    setShowSedeModal(true);
  };

  const handleDeleteSede = async (sede: SedeListItem) => {
    if (window.confirm(`¿Está seguro de eliminar la sede "${sede.nombre_sede}"?`)) {
      try {
        await deleteSede(sede.id);
        onSedeDelete?.(sede.id);
        // Show success message using Bootstrap alert
        showAlert('success', 'Sede eliminada correctamente');
      } catch (error) {
        showAlert('danger', 'Error al eliminar la sede');
      }
    }
  };

  const handleSaveSede = async (data: SedeFormData) => {
    try {
      if (editingSede) {
        const updatedSede = await updateSede(editingSede.id, data);
        onSedeUpdate?.(updatedSede);
        showAlert('success', 'Sede actualizada correctamente');
      } else {
        const newSede = await createSede(organizationId, data);
        onSedeCreate?.(newSede);
        showAlert('success', 'Sede creada correctamente');
      }
      setShowSedeModal(false);
      setEditingSede(null);
    } catch (error) {
      // Error handled by the store and shown in the modal
    }
  };

  const handleImportComplete = (result: SedeImportResponse) => {
    if (result.success) {
      showAlert('success', `Importación completada: ${result.imported_count} sedes importadas`);
      fetchSedes(organizationId); // Refresh list
    } else {
      showAlert('warning', `Importación con errores: ${result.error_count} errores encontrados`);
    }
    setShowImporter(false);
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const blob = await exportSedes(organizationId, format, true);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sedes_${organizationId}_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showAlert('success', 'Archivo exportado correctamente');
    } catch (error) {
      showAlert('danger', 'Error al exportar el archivo');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSedes.length === 0) return;
    
    if (window.confirm(`¿Está seguro de eliminar ${selectedSedes.length} sedes seleccionadas?`)) {
      setBulkOperating(true);
      try {
        // Delete one by one for now (could be optimized with bulk API)
        for (const sedeId of selectedSedes) {
          await deleteSede(sedeId);
        }
        setSelectedSedes([]);
        showAlert('success', `${selectedSedes.length} sedes eliminadas correctamente`);
      } catch (error) {
        showAlert('danger', 'Error en la operación masiva');
      } finally {
        setBulkOperating(false);
      }
    }
  };

  // Utility function to show alerts
  const showAlert = (type: 'success' | 'danger' | 'warning' | 'info', message: string) => {
    // Create and show Bootstrap alert
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
      const alertElement = document.createElement('div');
      alertElement.className = `alert alert-${type} alert-dismissible fade show`;
      alertElement.setAttribute('role', 'alert');
      alertElement.innerHTML = `
        <i class="ri-${type === 'success' ? 'check-circle' : type === 'danger' ? 'error-warning' : 'information'}-line me-1"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      alertContainer.appendChild(alertElement);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (alertElement.parentNode) {
          alertElement.parentNode.removeChild(alertElement);
        }
      }, 5000);
    }
  };

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  return (
    <div>
      {/* Alert Container */}
      <div id="alert-container" className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
        {/* Dynamic alerts will be inserted here */}
      </div>

      {/* Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="mb-1">Gestión de Sedes Prestadoras</h5>
            <p className="text-muted mb-0">
              Configure y administre las sedes donde se prestan los servicios de salud
            </p>
          </div>
          <div className="d-flex flex-column align-items-end">
            <div className="d-flex gap-2 mb-2">
              <span className="badge bg-primary-subtle text-primary">
                <i className="ri-building-line me-1" aria-hidden="true"></i>
                {sedes.length} Sedes
              </span>
              <span className="badge bg-success-subtle text-success">
                <i className="ri-check-circle-line me-1" aria-hidden="true"></i>
                {sedes.filter(s => s.estado === 'activa').length} Activas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={clearError}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="card">
        <div className="card-header border-0">
          <ul className="nav nav-tabs nav-tabs-custom card-header-tabs border-bottom-0" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveTab('list')}
                role="tab"
                aria-selected={activeTab === 'list'}
              >
                <i className="ri-list-check me-1" aria-hidden="true"></i>
                Lista de Sedes
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'import' ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveTab('import')}
                role="tab"
                aria-selected={activeTab === 'import'}
                disabled={readonly}
              >
                <i className="ri-upload-2-line me-1" aria-hidden="true"></i>
                Importar Sedes
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          {/* List Tab Content */}
          {activeTab === 'list' && (
            <>
              {/* Action Bar */}
              <div className="row g-3 mb-4">
                <div className="col-lg-4">
                  <div className="search-box">
                    <input
                      type="search"
                      className="form-control search"
                      placeholder="Buscar sedes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Buscar sedes"
                    />
                    <i className="ri-search-line search-icon" aria-hidden="true"></i>
                  </div>
                </div>
                <div className="col-lg-8">
                  <div className="d-flex justify-content-end gap-2">
                    {/* Bulk Actions */}
                    {selectedSedes.length > 0 && !readonly && (
                      <div className="d-flex gap-2 me-2">
                        <span className="badge bg-info-subtle text-info align-self-center">
                          {selectedSedes.length} seleccionadas
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={handleBulkDelete}
                          disabled={bulkOperating}
                        >
                          {bulkOperating ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Eliminando...
                            </>
                          ) : (
                            <>
                              <i className="ri-delete-bin-line me-1" aria-hidden="true"></i>
                              Eliminar
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {/* Export Buttons */}
                    <div className="btn-group" role="group" aria-label="Opciones de exportación">
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => handleExport('csv')}
                        disabled={loading || sedes.length === 0}
                      >
                        <i className="ri-file-excel-2-line me-1" aria-hidden="true"></i>
                        CSV
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => handleExport('excel')}
                        disabled={loading || sedes.length === 0}
                      >
                        <i className="ri-file-excel-line me-1" aria-hidden="true"></i>
                        Excel
                      </button>
                    </div>

                    {/* Create Button */}
                    {!readonly && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleCreateSede}
                        disabled={loading}
                      >
                        <i className="ri-add-line me-1" aria-hidden="true"></i>
                        Nueva Sede
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Filters Row */}
              <div className="row g-3 mb-4">
                <div className="col-lg-3">
                  <select
                    className="form-select form-select-sm"
                    value={filters.estado || ''}
                    onChange={(e) => handleFiltersChange({ estado: e.target.value as any, page: 1 })}
                    aria-label="Filtrar por estado"
                  >
                    <option value="">Todos los estados</option>
                    <option value="activa">Activa</option>
                    <option value="inactiva">Inactiva</option>
                    <option value="suspendida">Suspendida</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="cerrada">Cerrada</option>
                  </select>
                </div>
                <div className="col-lg-3">
                  <select
                    className="form-select form-select-sm"
                    value={filters.tipo_sede || ''}
                    onChange={(e) => handleFiltersChange({ tipo_sede: e.target.value as any, page: 1 })}
                    aria-label="Filtrar por tipo"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="principal">Principal</option>
                    <option value="sucursal">Sucursal</option>
                    <option value="ambulatoria">Ambulatoria</option>
                    <option value="hospitalaria">Hospitalaria</option>
                    <option value="administrativa">Administrativa</option>
                    <option value="diagnostico">Diagnóstico</option>
                    <option value="urgencias">Urgencias</option>
                  </select>
                </div>
                <div className="col-lg-3">
                  <select
                    className="form-select form-select-sm"
                    value={filters.departamento || ''}
                    onChange={(e) => handleFiltersChange({ departamento: e.target.value, page: 1 })}
                    aria-label="Filtrar por departamento"
                  >
                    <option value="">Todos los departamentos</option>
                    {Array.from(new Set(sedes.map(s => s.departamento))).map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-3">
                  <div className="d-flex gap-2">
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filter-principal"
                        checked={filters.es_sede_principal === true}
                        onChange={(e) => handleFiltersChange({ 
                          es_sede_principal: e.target.checked ? true : undefined, 
                          page: 1 
                        })}
                      />
                      <label className="form-check-label small" htmlFor="filter-principal">
                        Solo principales
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filter-24h"
                        checked={filters.atencion_24_horas === true}
                        onChange={(e) => handleFiltersChange({ 
                          atencion_24_horas: e.target.checked ? true : undefined, 
                          page: 1 
                        })}
                      />
                      <label className="form-check-label small" htmlFor="filter-24h">
                        24 horas
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sedes Table */}
              <SedesTable
                sedes={sedes}
                loading={loading}
                onEdit={handleEditSede}
                onDelete={handleDeleteSede}
                onViewServices={(sede) => {
                  // TODO: Implement services view modal
                  console.log('View services for:', sede);
                }}
                selectedSedes={selectedSedes}
                onSelectionChange={setSelectedSedes}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </>
          )}

          {/* Import Tab Content */}
          {activeTab === 'import' && (
            <SedesImporter
              organizationId={organizationId}
              onImportComplete={handleImportComplete}
              onCancel={() => setActiveTab('list')}
              isOpen={true}
            />
          )}
        </div>
      </div>

      {/* Sede Form Modal */}
      <SedeFormModal
        isOpen={showSedeModal}
        onClose={() => {
          setShowSedeModal(false);
          setEditingSede(null);
        }}
        onSave={handleSaveSede}
        sede={editingSede ? sedes.find(s => s.id === editingSede.id) as any : undefined}
        organizationId={organizationId}
        isLoading={loading}
        errors={error ? { general: [error] } : undefined}
      />
    </div>
  );
};

export default Step3dSedesManagement;