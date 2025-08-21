/**
 * Import History Component (Velzon Design System)
 * 
 * Component for displaying import history and logs with audit trail functionality.
 * Provides detailed view of import operations with download capabilities.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { servicioService } from '../../../../../services/servicioService';

interface ImportLogEntry {
  id: string;
  file_name: string;
  file_size: number;
  import_type: string;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  services_created: number;
  services_updated: number;
  services_disabled: number;
  headquarters_created: number;
  processing_time: number;
  created_by: string;
  started_at: string;
  completed_at: string;
  errors: string[];
  warnings: string[];
  message: string;
}

interface ImportHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onRetryImport?: (logId: string) => void;
}

const ImportHistory: React.FC<ImportHistoryProps> = ({
  isOpen,
  onClose,
  onRetryImport,
}) => {
  const [importLogs, setImportLogs] = useState<ImportLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ImportLogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch import logs
  const fetchImportLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This endpoint would need to be implemented in the backend
      const response = await fetch('/api/v1/sede-health-services/import-logs/');
      if (!response.ok) {
        throw new Error('Error al cargar el historial de importaciones');
      }
      
      const data = await response.json();
      setImportLogs(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el historial');
      console.error('Error fetching import logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchImportLogs();
    }
  }, [isOpen, fetchImportLogs]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { class: 'bg-warning', icon: 'ri-time-line', text: 'Pendiente' },
      processing: { class: 'bg-info', icon: 'ri-loader-line', text: 'Procesando' },
      completed: { class: 'bg-success', icon: 'ri-check-line', text: 'Completado' },
      partial: { class: 'bg-warning', icon: 'ri-alert-line', text: 'Parcial' },
      failed: { class: 'bg-danger', icon: 'ri-error-warning-line', text: 'Fallido' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`badge ${config.class} d-flex align-items-center`}>
        <i className={`${config.icon} me-1`}></i>
        {config.text}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const handleViewDetails = (log: ImportLogEntry) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const handleDownloadErrorReport = async (log: ImportLogEntry) => {
    try {
      // This would generate and download an Excel error report
      const errorData = {
        import_id: log.id,
        file_name: log.file_name,
        errors: log.errors,
        warnings: log.warnings,
        summary: {
          total_rows: log.total_rows,
          successful_rows: log.successful_rows,
          failed_rows: log.failed_rows,
        }
      };

      const blob = new Blob([JSON.stringify(errorData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `import_errors_${log.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading error report:', err);
    }
  };

  const renderDetailsModal = () => {
    if (!showDetails || !selectedLog) return null;

    return (
      <div 
        className="modal fade show" 
        style={{ 
          display: 'block', 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        tabIndex={-1}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowDetails(false);
          }
        }}
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ri-file-list-line me-2"></i>
                Detalles de Importación
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowDetails(false)}
              />
            </div>
            
            <div className="modal-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Información General</h6>
                      <div className="mb-2">
                        <strong>Archivo:</strong> {selectedLog.file_name}
                      </div>
                      <div className="mb-2">
                        <strong>Tamaño:</strong> {formatFileSize(selectedLog.file_size)}
                      </div>
                      <div className="mb-2">
                        <strong>Estado:</strong> {getStatusBadge(selectedLog.status)}
                      </div>
                      <div className="mb-2">
                        <strong>Procesado por:</strong> {selectedLog.created_by}
                      </div>
                      <div className="mb-2">
                        <strong>Duración:</strong> {formatDuration(selectedLog.processing_time)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Estadísticas</h6>
                      <div className="row text-center">
                        <div className="col-6">
                          <div className="border-end">
                            <div className="fs-4 fw-bold text-primary">{selectedLog.total_rows}</div>
                            <div className="small text-muted">Total Filas</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="fs-4 fw-bold text-success">{selectedLog.successful_rows}</div>
                          <div className="small text-muted">Exitosas</div>
                        </div>
                      </div>
                      <div className="row text-center mt-3">
                        <div className="col-4">
                          <div className="fs-5 fw-bold text-info">{selectedLog.services_created}</div>
                          <div className="small text-muted">Creados</div>
                        </div>
                        <div className="col-4">
                          <div className="fs-5 fw-bold text-warning">{selectedLog.services_updated}</div>
                          <div className="small text-muted">Actualizados</div>
                        </div>
                        <div className="col-4">
                          <div className="fs-5 fw-bold text-danger">{selectedLog.failed_rows}</div>
                          <div className="small text-muted">Fallidas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedLog.errors && selectedLog.errors.length > 0 && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-danger mb-0">
                      <i className="ri-error-warning-line me-2"></i>
                      Errores ({selectedLog.errors.length})
                    </h6>
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDownloadErrorReport(selectedLog)}
                    >
                      <i className="ri-download-line me-1"></i>
                      Descargar Reporte
                    </button>
                  </div>
                  <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedLog.errors.map((error, index) => (
                      <div key={index} className="mb-2 small">
                        <span className="badge bg-danger-subtle text-danger me-2">{index + 1}</span>
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.warnings && selectedLog.warnings.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-warning">
                    <i className="ri-alert-line me-2"></i>
                    Advertencias ({selectedLog.warnings.length})
                  </h6>
                  <div className="border rounded p-3" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {selectedLog.warnings.map((warning, index) => (
                      <div key={index} className="mb-2 small">
                        <span className="badge bg-warning-subtle text-warning me-2">{index + 1}</span>
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.message && (
                <div className="alert alert-info">
                  <i className="ri-information-line me-2"></i>
                  {selectedLog.message}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              {selectedLog.status === 'failed' && onRetryImport && (
                <button 
                  className="btn btn-warning"
                  onClick={() => {
                    onRetryImport(selectedLog.id);
                    setShowDetails(false);
                  }}
                >
                  <i className="ri-restart-line me-1"></i>
                  Reintentar Importación
                </button>
              )}
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDetails(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="modal fade show" 
        style={{ 
          display: 'block', 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        tabIndex={-1}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ri-history-line me-2"></i>
                Historial de Importaciones REPS
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
              />
            </div>
            
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">
                  <i className="ri-error-warning-line me-2"></i>
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <div className="mt-3 text-muted">Cargando historial...</div>
                </div>
              ) : importLogs.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ri-file-list-line fs-1 text-muted mb-3"></i>
                  <h6 className="text-muted">No hay importaciones registradas</h6>
                  <p className="text-muted">
                    Las importaciones de archivos REPS aparecerán aquí una vez que realice su primera importación.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Archivo</th>
                        <th>Estado</th>
                        <th>Resultados</th>
                        <th>Duración</th>
                        <th>Fecha</th>
                        <th>Usuario</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <div>
                              <div className="fw-medium">{log.file_name}</div>
                              <small className="text-muted">
                                {formatFileSize(log.file_size)}
                              </small>
                            </div>
                          </td>
                          <td>
                            {getStatusBadge(log.status)}
                          </td>
                          <td>
                            <div className="small">
                              <div className="text-success">
                                <i className="ri-check-line me-1"></i>
                                {log.successful_rows} exitosas
                              </div>
                              {log.failed_rows > 0 && (
                                <div className="text-danger">
                                  <i className="ri-error-warning-line me-1"></i>
                                  {log.failed_rows} fallidas
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <small>
                              {log.processing_time ? formatDuration(log.processing_time) : '-'}
                            </small>
                          </td>
                          <td>
                            <small>
                              {new Date(log.started_at).toLocaleDateString('es-CO')}
                              <br />
                              {new Date(log.started_at).toLocaleTimeString('es-CO')}
                            </small>
                          </td>
                          <td>
                            <small>{log.created_by}</small>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleViewDetails(log)}
                                title="Ver detalles"
                              >
                                <i className="ri-eye-line"></i>
                              </button>
                              {log.errors && log.errors.length > 0 && (
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDownloadErrorReport(log)}
                                  title="Descargar reporte de errores"
                                >
                                  <i className="ri-download-line"></i>
                                </button>
                              )}
                              {log.status === 'failed' && onRetryImport && (
                                <button
                                  className="btn btn-outline-warning btn-sm"
                                  onClick={() => onRetryImport(log.id)}
                                  title="Reintentar importación"
                                >
                                  <i className="ri-restart-line"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline-primary"
                onClick={fetchImportLogs}
                disabled={loading}
              >
                <i className="ri-refresh-line me-1"></i>
                Actualizar
              </button>
              <button 
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {renderDetailsModal()}
    </>
  );
};

export default ImportHistory;