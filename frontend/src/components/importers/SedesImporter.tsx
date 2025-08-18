/**
 * Sedes Importer Component (Professional Velzon Style)
 *
 * File import component for bulk sede creation with validation,
 * progress tracking, and error handling using native HTML with Bootstrap classes
 */
import React, { useState, useRef } from "react";
import { sedeService } from "../../services/sedeService";
import { useBootstrapTooltips } from "../../hooks/useBootstrapTooltips";
import type {
  SedesImporterProps,
  SedeImportConfig,
  SedeImportResponse,
  SedeImportValidationResult,
} from "../../types/sede.types";

interface ImportStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

const SedesImporter: React.FC<SedesImporterProps> = ({
  organizationId,
  onImportComplete,
  onCancel,
  isOpen,
}) => {
  // Bootstrap tooltips hook
  useBootstrapTooltips([], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 200, hide: 100 },
    animation: true
  });

  // State management
  const [currentStep, setCurrentStep] = useState<'upload' | 'validate' | 'review' | 'import' | 'complete'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<'csv' | 'excel'>('csv');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState<SedeImportValidationResult[]>([]);
  const [importResponse, setImportResponse] = useState<SedeImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps configuration
  const steps: ImportStep[] = [
    {
      id: 'upload',
      title: 'Seleccionar Archivo',
      description: 'Cargar archivo CSV o Excel con datos de sedes',
      completed: selectedFile !== null,
      active: currentStep === 'upload',
    },
    {
      id: 'validate',
      title: 'Validar Datos',
      description: 'Verificar formato y contenido del archivo',
      completed: validationResults.length > 0,
      active: currentStep === 'validate',
    },
    {
      id: 'review',
      title: 'Revisar Resultados',
      description: 'Examinar errores y datos a importar',
      completed: importResponse !== null && currentStep !== 'review',
      active: currentStep === 'review',
    },
    {
      id: 'import',
      title: 'Importar Datos',
      description: 'Ejecutar la importación final',
      completed: importResponse?.success === true,
      active: currentStep === 'import',
    },
  ];

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setValidationResults([]);
    setImportResponse(null);
    
    // Auto-detect format from file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'xlsx' || extension === 'xls') {
      setFileFormat('excel');
    } else {
      setFileFormat('csv');
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file)) {
        handleFileSelect(file);
      } else {
        setError('Tipo de archivo no válido. Solo se permiten archivos CSV y Excel (.xlsx, .xls)');
      }
    }
  };

  // Validate file type
  const isValidFileType = (file: File): boolean => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    return validTypes.includes(file.type) || /\.(csv|xlsx|xls)$/i.test(file.name);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isValidFileType(file)) {
        handleFileSelect(file);
      } else {
        setError('Tipo de archivo no válido. Solo se permiten archivos CSV y Excel (.xlsx, .xls)');
      }
    }
  };

  // Handle validation
  const handleValidation = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setCurrentStep('validate');

    try {
      const config: SedeImportConfig = {
        file: selectedFile,
        create_backup: true,
      };

      const response = await sedeService.importSedes(organizationId, config);
      setValidationResults(response.validation_results || []);
      setImportResponse(response);
      setCurrentStep('review');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error durante la validación');
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle final import
  const handleImport = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setCurrentStep('import');

    try {
      const config: SedeImportConfig = {
        file: selectedFile,
        create_backup: true,
      };

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await sedeService.importSedes(organizationId, config);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setImportResponse(response);
      setCurrentStep('complete');
      
      // Call completion callback
      onImportComplete(response);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error durante la importación');
      setCurrentStep('review');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  // Reset form
  const handleReset = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setFileFormat('csv');
    setValidationResults([]);
    setImportResponse(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep();
      case 'validate':
        return renderValidationStep();
      case 'review':
        return renderReviewStep();
      case 'import':
        return renderImportStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  // Upload step content
  const renderUploadStep = () => (
    <div>
      <div className="mb-4">
        <h6 className="fw-semibold">Seleccionar Archivo de Sedes</h6>
        <p className="text-muted small mb-0">
          Cargue un archivo CSV o Excel con la información de las sedes a importar
        </p>
      </div>

      {/* File Upload Area */}
      <div
        className={`border border-2 border-dashed rounded p-4 text-center ${
          dragActive ? 'border-primary bg-primary-subtle' : 'border-light'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div>
            <div className="mb-3">
              <i className="ri-file-check-line display-6 text-success" aria-hidden="true"></i>
            </div>
            <h6 className="mb-2">{selectedFile.name}</h6>
            <p className="text-muted mb-2">
              Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="text-muted mb-3">
              Formato detectado: {fileFormat.toUpperCase()}
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="ri-upload-2-line me-1" aria-hidden="true"></i>
                Cambiar Archivo
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <i className="ri-delete-bin-line me-1" aria-hidden="true"></i>
                Remover
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-3">
              <i className="ri-upload-cloud-2-line display-6 text-muted" aria-hidden="true"></i>
            </div>
            <h6 className="mb-2">Arrastre su archivo aquí</h6>
            <p className="text-muted mb-3">o haga clic para seleccionar</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="ri-folder-open-line me-1" aria-hidden="true"></i>
              Seleccionar Archivo
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="d-none"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileInputChange}
      />

      {/* Configuration Options */}
      <div className="mt-4">
        <h6 className="fw-semibold mb-3">Información del Archivo</h6>
        
        <div className="row">
          <div className="col-lg-6">
            <div className="mb-3">
              <label className="form-label" htmlFor="fileFormat">
                Formato Detectado
              </label>
              <input
                className="form-control"
                id="fileFormat"
                value={fileFormat.toUpperCase()}
                readOnly
                disabled
              />
              <small className="text-muted">
                El formato se detecta automáticamente según la extensión del archivo
              </small>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="mb-3">
              <label className="form-label">Configuración de Importación</label>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="createBackup"
                  checked={true}
                  disabled
                />
                <label className="form-check-label" htmlFor="createBackup">
                  Crear respaldo automático
                  <small className="text-muted d-block">
                    Se crea automáticamente un respaldo antes de la importación
                  </small>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Download */}
      <div className="mt-4 p-3 bg-info-subtle rounded">
        <div className="d-flex align-items-start">
          <i className="ri-information-line text-info me-2 mt-1" aria-hidden="true"></i>
          <div>
            <h6 className="mb-2">Plantilla de Importación</h6>
            <p className="text-muted mb-2 small">
              Descargue la plantilla con el formato correcto para la importación de sedes.
            </p>
            <button
              type="button"
              className="btn btn-sm btn-outline-info"
              onClick={() => {
                // TODO: Implement template download
                console.log('Download template');
              }}
            >
              <i className="ri-download-line me-1" aria-hidden="true"></i>
              Descargar Plantilla
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Validation step content
  const renderValidationStep = () => (
    <div className="text-center py-4">
      <div className="mb-3">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Validando...</span>
        </div>
      </div>
      <h6 className="mb-2">Validando Datos</h6>
      <p className="text-muted">
        Por favor espere mientras validamos el formato y contenido del archivo...
      </p>
      <div className="progress mt-3" style={{ height: '4px' }}>
        <div
          className="progress-bar progress-bar-striped progress-bar-animated"
          role="progressbar"
          style={{ width: '75%' }}
        ></div>
      </div>
    </div>
  );

  // Review step content
  const renderReviewStep = () => {
    const validResults = validationResults.filter(r => r.is_valid);
    const invalidResults = validationResults.filter(r => !r.is_valid);

    return (
      <div>
        <div className="mb-4">
          <h6 className="fw-semibold">Resultados de Validación</h6>
          <p className="text-muted small mb-0">
            Revise los resultados antes de proceder con la importación
          </p>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-lg-3">
            <div className="card bg-success-subtle border-success">
              <div className="card-body text-center">
                <i className="ri-check-circle-line display-6 text-success mb-2" aria-hidden="true"></i>
                <h5 className="text-success mb-1">{validResults.length}</h5>
                <p className="text-success mb-0 small">Registros Válidos</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card bg-danger-subtle border-danger">
              <div className="card-body text-center">
                <i className="ri-error-warning-line display-6 text-danger mb-2" aria-hidden="true"></i>
                <h5 className="text-danger mb-1">{invalidResults.length}</h5>
                <p className="text-danger mb-0 small">Registros con Errores</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card bg-info-subtle border-info">
              <div className="card-body text-center">
                <i className="ri-file-list-line display-6 text-info mb-2" aria-hidden="true"></i>
                <h5 className="text-info mb-1">{validationResults.length}</h5>
                <p className="text-info mb-0 small">Total Registros</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card bg-warning-subtle border-warning">
              <div className="card-body text-center">
                <i className="ri-percent-line display-6 text-warning mb-2" aria-hidden="true"></i>
                <h5 className="text-warning mb-1">
                  {validationResults.length > 0 ? Math.round((validResults.length / validationResults.length) * 100) : 0}%
                </h5>
                <p className="text-warning mb-0 small">Tasa de Éxito</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Details */}
        {invalidResults.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-semibold text-danger mb-3">
              <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
              Errores Encontrados ({invalidResults.length})
            </h6>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="table table-sm table-striped">
                <thead className="table-light">
                  <tr>
                    <th>Fila</th>
                    <th>Sede</th>
                    <th>Errores</th>
                  </tr>
                </thead>
                <tbody>
                  {invalidResults.map((result, index) => (
                    <tr key={index}>
                      <td>
                        <span className="badge bg-danger-subtle text-danger">
                          {result.row_index + 1}
                        </span>
                      </td>
                      <td>
                        <span className="fw-medium">
                          {result.data?.nombre_sede || result.data?.numero_sede || 'N/A'}
                        </span>
                      </td>
                      <td>
                        {result.errors && Object.entries(result.errors).map(([field, errors]) => (
                          <div key={field} className="mb-1">
                            <span className="badge bg-light text-dark me-1">{field}</span>
                            <small className="text-danger">
                              {Array.isArray(errors) ? errors.join(', ') : errors}
                            </small>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Valid Records Preview */}
        {validResults.length > 0 && (
          <div>
            <h6 className="fw-semibold text-success mb-3">
              <i className="ri-check-circle-line me-1" aria-hidden="true"></i>
              Registros a Importar ({validResults.length})
            </h6>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="table table-sm table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Fila</th>
                    <th># Sede</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {validResults.slice(0, 10).map((result, index) => (
                    <tr key={index}>
                      <td>
                        <span className="badge bg-success-subtle text-success">
                          {result.row_index + 1}
                        </span>
                      </td>
                      <td className="fw-medium">{result.data?.numero_sede}</td>
                      <td>{result.data?.nombre_sede}</td>
                      <td>
                        <span className="text-capitalize">{result.data?.tipo_sede}</span>
                      </td>
                      <td>
                        <small>{result.data?.municipio}, {result.data?.departamento}</small>
                      </td>
                      <td>
                        <span className={`badge ${
                          result.data?.estado === 'activa' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'
                        }`}>
                          {result.data?.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {validResults.length > 10 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted">
                        ... y {validResults.length - 10} registros más
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Import step content
  const renderImportStep = () => (
    <div className="text-center py-4">
      <div className="mb-3">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Importando...</span>
        </div>
      </div>
      <h6 className="mb-2">Importando Sedes</h6>
      <p className="text-muted mb-3">
        Por favor espere mientras procesamos e importamos las sedes...
      </p>
      <div className="progress" style={{ height: '8px' }}>
        <div
          className="progress-bar bg-success progress-bar-striped progress-bar-animated"
          role="progressbar"
          style={{ width: `${uploadProgress}%` }}
          aria-valuenow={uploadProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
      <small className="text-muted mt-2 d-block">{uploadProgress}% completado</small>
    </div>
  );

  // Complete step content
  const renderCompleteStep = () => (
    <div className="text-center py-4">
      <div className="mb-3">
        <i className="ri-check-circle-line display-4 text-success" aria-hidden="true"></i>
      </div>
      <h5 className="text-success mb-3">¡Importación Completada!</h5>
      
      {importResponse && (
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {importResponse.success ? (
              <div className="alert alert-success">
                <i className="ri-check-circle-line me-2" aria-hidden="true"></i>
                Se importaron <strong>{importResponse.imported_count}</strong> sedes correctamente.
                {importResponse.error_count && importResponse.error_count > 0 && (
                  <div className="mt-2">
                    <small>
                      {importResponse.error_count} registros tuvieron errores y no se importaron.
                    </small>
                  </div>
                )}
              </div>
            ) : (
              <div className="alert alert-danger">
                <i className="ri-error-warning-line me-2" aria-hidden="true"></i>
                {importResponse.message || 'Error durante la importación'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="d-flex gap-2 justify-content-center mt-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onCancel}
        >
          <i className="ri-check-line me-1" aria-hidden="true"></i>
          Finalizar
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={handleReset}
        >
          <i className="ri-upload-2-line me-1" aria-hidden="true"></i>
          Importar Más
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div>
      {/* Progress Steps */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          {steps.filter(step => step.id !== 'complete').map((step, index) => {
            const isLast = index === steps.filter(s => s.id !== 'complete').length - 1;
            
            return (
              <div key={step.id} className="d-flex align-items-center flex-fill">
                <div className={`rounded-circle d-flex align-items-center justify-content-center ${
                  step.active ? 'bg-primary text-white' : 
                  step.completed ? 'bg-success text-white' : 
                  'bg-light text-muted'
                }`} style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                  {step.completed ? (
                    <i className="ri-check-line" aria-hidden="true"></i>
                  ) : (
                    index + 1
                  )}
                </div>
                {!isLast && (
                  <div className={`flex-fill mx-2 ${step.completed ? 'bg-success' : 'bg-light'}`} style={{ height: '2px' }}></div>
                )}
              </div>
            );
          })}
        </div>
        <div className="d-flex justify-content-between">
          <small className="text-muted">Archivo</small>
          <small className="text-muted">Validar</small>
          <small className="text-muted">Revisar</small>
          <small className="text-muted">Importar</small>
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
            onClick={() => setError(null)}
            aria-label="Cerrar alerta"
          ></button>
        </div>
      )}

      {/* Step Content */}
      <div className="card">
        <div className="card-body">
          {renderStepContent()}
        </div>

        {/* Action Buttons */}
        <div className="card-footer">
          <div className="d-flex justify-content-between">
            <div>
              {currentStep !== 'upload' && currentStep !== 'complete' && !isProcessing && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    if (currentStep === 'validate') setCurrentStep('upload');
                    else if (currentStep === 'review') setCurrentStep('upload');
                    else if (currentStep === 'import') setCurrentStep('review');
                  }}
                >
                  <i className="ri-arrow-left-line me-1" aria-hidden="true"></i>
                  Anterior
                </button>
              )}
            </div>
            <div className="d-flex gap-2">
              {currentStep !== 'complete' && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onCancel}
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
              )}
              {currentStep === 'upload' && selectedFile && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleValidation}
                  disabled={isProcessing}
                >
                  <i className="ri-search-line me-1" aria-hidden="true"></i>
                  Validar Archivo
                </button>
              )}
              {currentStep === 'review' && validationResults.some(r => r.is_valid) && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleImport}
                  disabled={isProcessing}
                >
                  <i className="ri-upload-2-line me-1" aria-hidden="true"></i>
                  Importar Sedes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SedesImporter;