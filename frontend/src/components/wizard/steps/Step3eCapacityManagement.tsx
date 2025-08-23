/**
 * Step 3e: Capacity Management Component
 *
 * Handles capacity data management with CRUD operations, REPS import,
 * and comprehensive filtering capabilities for wizard workflow
 */
import React, { useState, useEffect } from 'react';
import { capacityService } from '../../../services/capacityService';
import { useBootstrapTooltips } from '../../../hooks/useBootstrapTooltips';
import CapacityImportModal from '../../modals/CapacityImportModal';
import InfoTooltip from '../../common/InfoTooltip';
import type {
  CapacidadInstalada,
  CapacidadFilters,
  CapacidadImportResponse,
  CapacidadStatistics,
  SedeCapacityOverview,
} from '../../../types/capacity.types';

// Types
interface Step3eProps {
  organizationId: string;
  readonly?: boolean;
  onCapacityImport?: (response: CapacidadImportResponse) => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

interface CapacityStats {
  totalCapacity: number;
  byGroup: Record<string, number>;
  bySede: SedeCapacityOverview[];
  syncStatus: {
    synchronized: number;
    needsUpdate: number;
    total: number;
  };
}

const Step3eCapacityManagement: React.FC<Step3eProps> = ({
  organizationId,
  readonly = false,
  onCapacityImport,
  onNext,
  onPrevious,
}) => {
  // Bootstrap tooltips hook
  useBootstrapTooltips([], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 200, hide: 100 },
    animation: true,
  });

  // State management
  const [capacities, setCapacities] = useState<CapacidadInstalada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [stats, setStats] = useState<CapacityStats | null>(null);
  const [filters, setFilters] = useState<CapacidadFilters>({
    page: 1,
    page_size: 10,
  });

  // Load capacity data
  const loadCapacities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await capacityService.getCapacities(filters);
      setCapacities(response.results);

      // Load statistics
      const statsResponse = await capacityService.getCapacityStatistics(filters);
      setStats({
        totalCapacity: statsResponse.total_capacity,
        byGroup: Object.fromEntries(
          Object.entries(statsResponse.by_group).map(([key, value]) => [
            key,
            typeof value === 'object' && value !== null && 'count' in value 
              ? (value as any).count 
              : 0
          ])
        ),
        bySede: statsResponse.by_sede,
        syncStatus: {
          synchronized: statsResponse.reps_sync_status.synchronized,
          needsUpdate: statsResponse.reps_sync_status.needs_update,
          total: statsResponse.reps_sync_status.synchronized + statsResponse.reps_sync_status.needs_update,
        },
      });
    } catch (err) {
      console.error('Error loading capacities:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar capacidades');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (organizationId) {
      loadCapacities();
    }
  }, [organizationId, filters]);

  // Handle capacity import success
  const handleCapacityImportSuccess = async (response: CapacidadImportResponse) => {
    if (onCapacityImport) {
      onCapacityImport(response);
    }
    
    // Refresh capacity data
    await loadCapacities();
    
    setShowImportModal(false);
  };

  // Export capacities
  const handleExport = async () => {
    try {
      const blob = await capacityService.exportCapacities(filters, 'excel');
      capacityService.downloadFile(blob, `capacidad-instalada-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error exporting capacities:', err);
      setError('Error al exportar capacidades');
    }
  };

  // Sync with REPS
  const handleRepsSync = async () => {
    try {
      setLoading(true);
      const result = await capacityService.syncWithReps();
      console.log('REPS sync completed:', result);
      
      // Refresh data
      await loadCapacities();
    } catch (err) {
      console.error('Error syncing with REPS:', err);
      setError('Error al sincronizar con REPS');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !capacities.length) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted">Cargando datos de capacidad...</p>
      </div>
    );
  }

  return (
    <div className="capacity-management-step">
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="mb-2">
              Gestión de Capacidad Instalada
              <InfoTooltip 
                content="Administre la capacidad instalada de sus sedes según los datos del portal REPS" 
                placement="right"
              />
            </h5>
            <p className="text-muted mb-0">
              Configure y mantenga actualizada la información de capacidad de sus instalaciones
            </p>
          </div>
          {!readonly && (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={handleRepsSync}
                disabled={loading}
              >
                <i className="ri-refresh-line me-1" aria-hidden="true"></i>
                Sincronizar REPS
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleExport}
                disabled={loading}
              >
                <i className="ri-download-line me-1" aria-hidden="true"></i>
                Exportar
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowImportModal(true)}
              >
                <i className="ri-upload-cloud-2-line me-1" aria-hidden="true"></i>
                Importar Capacidad
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
            aria-label="Cerrar alerta"
          ></button>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="row mb-4">
          <div className="col-lg-3">
            <div className="card bg-primary-subtle border-primary">
              <div className="card-body text-center">
                <i className="ri-database-2-line display-6 text-primary mb-2" aria-hidden="true"></i>
                <h5 className="text-primary mb-1">{stats.totalCapacity}</h5>
                <p className="text-primary mb-0 small">Total Capacidad</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card bg-info-subtle border-info">
              <div className="card-body text-center">
                <i className="ri-building-line display-6 text-info mb-2" aria-hidden="true"></i>
                <h5 className="text-info mb-1">{stats.bySede.length}</h5>
                <p className="text-info mb-0 small">Sedes con Capacidad</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card bg-success-subtle border-success">
              <div className="card-body text-center">
                <i className="ri-check-circle-line display-6 text-success mb-2" aria-hidden="true"></i>
                <h5 className="text-success mb-1">{stats.syncStatus.synchronized}</h5>
                <p className="text-success mb-0 small">Sincronizado REPS</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card bg-warning-subtle border-warning">
              <div className="card-body text-center">
                <i className="ri-alert-line display-6 text-warning mb-2" aria-hidden="true"></i>
                <h5 className="text-warning mb-1">{stats.syncStatus.needsUpdate}</h5>
                <p className="text-warning mb-0 small">Necesita Actualización</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capacity by Group */}
      {stats && Object.keys(stats.byGroup).length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">
              <i className="ri-pie-chart-2-line me-2" aria-hidden="true"></i>
              Capacidad por Grupo
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              {Object.entries(stats.byGroup).map(([group, count]) => (
                <div key={group} className="col-md-4 col-lg-2 mb-3">
                  <div className="text-center">
                    <div className="bg-light rounded p-3 mb-2">
                      <i className="ri-database-line display-6 text-muted" aria-hidden="true"></i>
                    </div>
                    <h6 className="mb-1">{count}</h6>
                    <small className="text-muted text-uppercase">{group.replace('_', ' ')}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Capacity by Sede */}
      {stats && stats.bySede.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">
              <i className="ri-building-line me-2" aria-hidden="true"></i>
              Capacidad por Sede
            </h6>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Sede</th>
                    <th>Total Capacidad</th>
                    <th>Ocupación Promedio</th>
                    <th>Estado REPS</th>
                    <th>Última Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.bySede.slice(0, 5).map((sede) => (
                    <tr key={sede.sede_id}>
                      <td>
                        <div className="fw-medium">{sede.sede_nombre}</div>
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary">
                          {sede.total_capacity}
                        </span>
                      </td>
                      <td>
                        {sede.average_occupancy !== undefined && sede.average_occupancy !== null ? (
                          <span className="text-muted">
                            {sede.average_occupancy.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            sede.needs_sync
                              ? 'bg-warning-subtle text-warning'
                              : 'bg-success-subtle text-success'
                          }`}
                        >
                          {sede.needs_sync ? 'Necesita Sync' : 'Sincronizado'}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {sede.last_update 
                            ? new Date(sede.last_update).toLocaleDateString()
                            : 'No disponible'
                          }
                        </small>
                      </td>
                    </tr>
                  ))}
                  {stats.bySede.length > 5 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        ... y {stats.bySede.length - 5} sedes más
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && capacities.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="ri-database-2-line display-4 text-muted mb-3" aria-hidden="true"></i>
            <h6 className="mb-3">No hay datos de capacidad</h6>
            <p className="text-muted mb-4">
              Importe los datos de capacidad instalada desde el portal REPS para comenzar
              a gestionar la información de sus instalaciones.
            </p>
            {!readonly && (
              <div className="d-flex gap-2 justify-content-center">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowImportModal(true)}
                >
                  <i className="ri-upload-cloud-2-line me-1" aria-hidden="true"></i>
                  Importar Capacidad REPS
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Capacity Import Instructions */}
      {!readonly && capacities.length === 0 && (
        <div className="mt-4 p-4 bg-info-subtle rounded border border-info">
          <div className="d-flex align-items-start">
            <i className="ri-information-line text-info me-3 mt-1" aria-hidden="true"></i>
            <div>
              <h6 className="text-info mb-2">¿Cómo importar la capacidad instalada?</h6>
              <p className="text-info mb-2 small">
                Para obtener el archivo de capacidad instalada, debe:
              </p>
              <ol className="text-info mb-0 small">
                <li>Acceder al <strong>Portal REPS</strong> con sus credenciales institucionales</li>
                <li>Navegar a <strong>Reportes → Capacidad Instalada</strong></li>
                <li>Hacer clic en la pestaña <strong>"Capacidad"</strong></li>
                <li>Descargar el archivo de capacidad de su institución</li>
                <li>Usar el botón "Importar Capacidad" para cargar el archivo</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="d-flex justify-content-between mt-5">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onPrevious}
        >
          <i className="ri-arrow-left-line me-1" aria-hidden="true"></i>
          Anterior
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onNext}
        >
          Continuar
          <i className="ri-arrow-right-line ms-1" aria-hidden="true"></i>
        </button>
      </div>

      {/* Capacity Import Modal */}
      <CapacityImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleCapacityImportSuccess}
      />
    </div>
  );
};

export default Step3eCapacityManagement;