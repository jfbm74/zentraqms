/**
 * Capacity Import Modal Component
 * 
 * Modal that appears after CSV sede import to offer capacity data import
 * with instructions linking to the REPS portal for downloading capacity files.
 */

import React, { useState, useRef } from 'react';
import { capacityService } from '../../services/capacityService';
import { useBootstrapTooltips } from '../../hooks/useBootstrapTooltips';
import type {
  CapacidadImportConfig,
  CapacidadImportResponse,
  CapacidadValidationResult,
  CapacidadImportModalProps,
} from '../../types/capacity.types';

interface ImportStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

const CapacityImportModal: React.FC<CapacidadImportModalProps> = ({
  isOpen,
  onClose,
  sedeId,
  onSuccess,
}) => {
  // Bootstrap tooltips hook
  useBootstrapTooltips([], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 200, hide: 100 },
    animation: true,
  });

  // State management
  const [currentStep, setCurrentStep] = useState<
    'instructions' | 'upload' | 'validate' | 'review' | 'import' | 'complete'
  >('instructions');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState<CapacidadValidationResult | null>(null);
  const [importResponse, setImportResponse] = useState<CapacidadImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [updateExisting, setUpdateExisting] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps configuration
  const steps: ImportStep[] = [
    {
      id: 'instructions',
      title: 'Instrucciones REPS',
      description: 'Cómo descargar el archivo de capacidad',
      completed: currentStep !== 'instructions',
      active: currentStep === 'instructions',
    },
    {
      id: 'upload',
      title: 'Cargar Archivo',
      description: 'Seleccionar archivo de capacidad REPS',
      completed: selectedFile !== null,
      active: currentStep === 'upload',
    },
    {
      id: 'validate',
      title: 'Validar',
      description: 'Verificar contenido del archivo',
      completed: validationResults !== null,
      active: currentStep === 'validate',
    },
    {
      id: 'import',
      title: 'Importar',
      description: 'Procesar e importar datos',
      completed: importResponse?.success === true,
      active: currentStep === 'import',
    },
  ];

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setValidationResults(null);
    setImportResponse(null);
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
        setError('Tipo de archivo no válido. Solo se permiten archivos XLS, XLSX, CSV y HTML');
      }
    }
  };

  // Validate file type
  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/html',
      'application/html',
    ];
    return validTypes.includes(file.type) || /\.(csv|xlsx|xls|html|htm)$/i.test(file.name);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isValidFileType(file)) {
        handleFileSelect(file);
      } else {
        setError('Tipo de archivo no válido. Solo se permiten archivos XLS, XLSX, CSV y HTML');
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
      const config: CapacidadImportConfig = {
        file: selectedFile,
        sede_id: sedeId,
      };

      const response = await capacityService.validateImportFile(config);
      setValidationResults(response);
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
      const config: CapacidadImportConfig = {
        file: selectedFile,
        sede_id: sedeId,
        update_existing: updateExisting,
      };

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await capacityService.importRepsFile(config);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setImportResponse(response);
      setCurrentStep('complete');

      // Call success callback
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error durante la importación');
      setCurrentStep('review');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  // Reset modal
  const handleReset = () => {
    setCurrentStep('instructions');
    setSelectedFile(null);
    setValidationResults(null);
    setImportResponse(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Close modal
  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Skip capacity import
  const handleSkip = () => {
    handleClose();
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'instructions':
        return renderInstructionsStep();
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

  // Instructions step content
  const renderInstructionsStep = () => (
    <div>
      <div className="mb-4 text-center">
        <i className="ri-information-line display-4 text-primary mb-3" aria-hidden="true"></i>
        <h5 className="text-primary mb-2">¡Sedes importadas exitosamente!</h5>
        <p className="text-muted">
          Ahora puede importar los datos de capacidad instalada desde el portal REPS
        </p>
      </div>

      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card border-primary">
            <div className="card-header bg-primary-subtle">
              <h6 className="mb-0 text-primary">
                <i className="ri-download-cloud-2-line me-2" aria-hidden="true"></i>
                Cómo descargar el archivo de capacidad desde REPS
              </h6>
            </div>
            <div className="card-body">
              <div className="timeline timeline-one-side">
                <div className="timeline-block d-flex">
                  <div className="timeline-left">
                    <span className="timeline-icon timeline-icon-success">
                      <i className="ri-external-link-line" aria-hidden="true"></i>
                    </span>
                  </div>
                  <div className="timeline-content">
                    <h6 className="mb-2">1. Acceder al Portal REPS</h6>
                    <p className="text-muted mb-2">
                      Ingrese al{' '}
                      <a
                        href="https://prestadores.minsalud.gov.co/habilitacion/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary fw-medium"
                      >
                        Portal de Prestadores de Servicios de Salud
                        <i className="ri-external-link-line ms-1" aria-hidden="true"></i>
                      </a>
                    </p>
                  </div>
                </div>

                <div className="timeline-block d-flex">
                  <div className="timeline-left">
                    <span className="timeline-icon timeline-icon-info">
                      <i className="ri-login-circle-line" aria-hidden="true"></i>
                    </span>
                  </div>
                  <div className="timeline-content">
                    <h6 className="mb-2">2. Iniciar sesión</h6>
                    <p className="text-muted mb-2">
                      Use sus credenciales institucionales para acceder al portal
                    </p>
                  </div>
                </div>

                <div className="timeline-block d-flex">
                  <div className="timeline-left">
                    <span className="timeline-icon timeline-icon-warning">
                      <i className="ri-database-2-line" aria-hidden="true"></i>
                    </span>
                  </div>
                  <div className="timeline-content">
                    <h6 className="mb-2">3. Navegar a Capacidad Instalada</h6>
                    <p className="text-muted mb-0">
                      • Vaya al menú <strong>"Reportes"</strong>
                    </p>
                    <p className="text-muted mb-0">
                      • Seleccione <strong>"Capacidad Instalada"</strong>
                    </p>
                    <p className="text-muted mb-2">
                      • Haga clic en la pestaña <strong>"Capacidad"</strong>
                    </p>
                  </div>
                </div>

                <div className="timeline-block d-flex">
                  <div className="timeline-left">
                    <span className="timeline-icon timeline-icon-primary">
                      <i className="ri-download-2-line" aria-hidden="true"></i>
                    </span>
                  </div>
                  <div className="timeline-content">
                    <h6 className="mb-2">4. Descargar archivo</h6>
                    <p className="text-muted mb-0">
                      Busque el enlace de descarga del archivo de capacidad instalada
                    </p>
                    <p className="text-muted mb-0">
                      Ejemplo: <strong>"[Nombre]CapacidadInstalada.xls"</strong>
                    </p>
                    <div className="alert alert-info mt-2 p-2">
                      <small>
                        <i className="ri-information-line me-1" aria-hidden="true"></i>
                        El archivo puede estar en formato XLS, XLSX, CSV o HTML
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-success-subtle rounded border border-success">
            <div className="d-flex align-items-start">
              <i className="ri-lightbulb-line text-success me-2 mt-1" aria-hidden="true"></i>
              <div>
                <h6 className="text-success mb-1">Consejo</h6>
                <p className="text-success mb-0 small">
                  Una vez descargado el archivo, regrese a este modal y proceda con la importación.
                  El sistema detectará automáticamente el formato del archivo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Upload step content
  const renderUploadStep = () => (
    <div>
      <div className="mb-4">
        <h6 className="fw-semibold">Cargar Archivo de Capacidad REPS</h6>
        <p className="text-muted small mb-0">
          Seleccione el archivo de capacidad instalada descargado desde el portal REPS
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
        accept=".csv,.xlsx,.xls,.html,.htm"
        onChange={handleFileInputChange}
      />

      {/* Configuration Options */}
      <div className="mt-4">
        <h6 className="fw-semibold mb-3">Opciones de Importación</h6>

        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="updateExisting"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="updateExisting">
            Actualizar registros existentes
            <small className="text-muted d-block">
              Si ya existen datos de capacidad, se actualizarán con la nueva información
            </small>
          </label>
        </div>
      </div>

      {/* Accepted formats info */}
      <div className="mt-4 p-3 bg-info-subtle rounded">
        <div className="d-flex align-items-start">
          <i className="ri-file-list-line text-info me-2 mt-1" aria-hidden="true"></i>
          <div>
            <h6 className="text-info mb-2">Formatos Aceptados</h6>
            <p className="text-info mb-0 small">
              <strong>XLS/XLSX:</strong> Archivos de Excel descargados directamente de REPS
              <br />
              <strong>CSV:</strong> Archivos de valores separados por comas
              <br />
              <strong>HTML:</strong> Reportes HTML exportados desde REPS
            </p>
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
      <h6 className="mb-2">Validando Datos de Capacidad</h6>
      <p className="text-muted">
        Por favor espere mientras procesamos y validamos el archivo de capacidad...
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
    if (!validationResults) return null;

    const { is_valid, errors, warnings, summary } = validationResults;

    // Handle case where validation failed and summary is undefined
    if (!summary) {
      return (
        <div className="text-center py-4">
          <i className="ri-error-warning-line display-4 text-danger mb-3" aria-hidden="true"></i>
          <h5 className="text-danger mb-2">Error en la validación</h5>
          <p className="text-muted">
            No se pudieron obtener los resultados de validación. 
            {errors && errors.length > 0 && (
              <>
                <br/>
                <small className="text-danger">
                  {Array.isArray(errors) ? errors[0] : 'Error al procesar el archivo'}
                </small>
              </>
            )}
          </p>
          <button 
            type="button" 
            className="btn btn-outline-secondary"
            onClick={() => setCurrentStep('file')}
          >
            <i className="ri-arrow-left-line me-1"></i>
            Seleccionar otro archivo
          </button>
        </div>
      );
    }

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
            <div className="card bg-info-subtle border-info">
              <div className="card-body text-center">
                <i className="ri-file-list-line display-6 text-info mb-2" aria-hidden="true"></i>
                <h5 className="text-info mb-1">{summary?.total_records || 0}</h5>
                <p className="text-info mb-0 small">Total Registros</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card bg-success-subtle border-success">
              <div className="card-body text-center">
                <i className="ri-check-circle-line display-6 text-success mb-2" aria-hidden="true"></i>
                <h5 className="text-success mb-1">{summary?.valid_records || 0}</h5>
                <p className="text-success mb-0 small">Registros Válidos</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card bg-danger-subtle border-danger">
              <div className="card-body text-center">
                <i className="ri-error-warning-line display-6 text-danger mb-2" aria-hidden="true"></i>
                <h5 className="text-danger mb-1">{summary?.invalid_records || 0}</h5>
                <p className="text-danger mb-0 small">Registros con Errores</p>
              </div>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="card bg-warning-subtle border-warning">
              <div className="card-body text-center">
                <i className="ri-alert-line display-6 text-warning mb-2" aria-hidden="true"></i>
                <h5 className="text-warning mb-1">{summary?.warnings_count || 0}</h5>
                <p className="text-warning mb-0 small">Advertencias</p>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Status */}
        <div className={`alert ${is_valid ? 'alert-success' : 'alert-danger'} mb-4`}>
          <i
            className={`${is_valid ? 'ri-check-circle-line' : 'ri-error-warning-line'} me-2`}
            aria-hidden="true"
          ></i>
          {is_valid
            ? '✓ El archivo es válido y se puede proceder con la importación'
            : '✗ El archivo tiene errores que deben corregirse antes de importar'}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-semibold text-danger mb-3">
              <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
              Errores Encontrados
            </h6>
            <div className="list-group list-group-flush">
              {errors.map((error, index) => (
                <div key={index} className="list-group-item border-start border-danger border-3 ps-3">
                  <small className="text-danger">{error}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-4">
            <h6 className="fw-semibold text-warning mb-3">
              <i className="ri-alert-line me-1" aria-hidden="true"></i>
              Advertencias
            </h6>
            <div className="list-group list-group-flush">
              {warnings.map((warning, index) => (
                <div key={index} className="list-group-item border-start border-warning border-3 ps-3">
                  <small className="text-warning">{warning}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {validationResults.suggestions && validationResults.suggestions.length > 0 && (
          <div className="p-3 bg-light rounded">
            <h6 className="fw-semibold text-info mb-2">
              <i className="ri-lightbulb-line me-1" aria-hidden="true"></i>
              Sugerencias
            </h6>
            <ul className="mb-0 small text-muted">
              {validationResults.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
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
      <h6 className="mb-2">Importando Capacidad Instalada</h6>
      <p className="text-muted mb-3">
        Por favor espere mientras procesamos e importamos los datos de capacidad...
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
      <h5 className="text-success mb-3">¡Importación de Capacidad Completada!</h5>

      {importResponse && (
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {importResponse.success ? (
              <div className="alert alert-success" role="alert">
                <i className="ri-check-circle-line me-2" aria-hidden="true"></i>
                Se procesaron <strong>{importResponse.summary?.total_processed || 0}</strong> registros de capacidad.
                <div className="mt-2">
                  <small>
                    • <strong>{importResponse.summary?.successfully_imported || 0}</strong> registros importados
                    • <strong>{importResponse.summary?.updated || 0}</strong> registros actualizados
                    {importResponse.summary?.errors && importResponse.summary.errors > 0 && (
                      <>
                        • <strong className="text-warning">{importResponse.summary.errors}</strong> errores
                      </>
                    )}
                  </small>
                </div>
              </div>
            ) : (
              <div className="alert alert-danger" role="alert">
                <i className="ri-error-warning-line me-2" aria-hidden="true"></i>
                {importResponse.message || 'Error durante la importación de capacidad'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="d-flex gap-2 justify-content-center mt-4">
        <button type="button" className="btn btn-primary" onClick={handleClose}>
          <i className="ri-check-line me-1" aria-hidden="true"></i>
          Finalizar
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={handleReset}>
          <i className="ri-upload-2-line me-1" aria-hidden="true"></i>
          Importar Más
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ri-database-2-line text-primary me-2" aria-hidden="true"></i>
              Importar Capacidad Instalada
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Cerrar modal"
            ></button>
          </div>

          <div className="modal-body">
            {/* Progress Steps */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                {steps.filter((step) => step.id !== 'complete').map((step, index) => {
                  const isLast = index === steps.filter((s) => s.id !== 'complete').length - 1;

                  return (
                    <div key={step.id} className="d-flex align-items-center flex-fill">
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center ${
                          step.active
                            ? 'bg-primary text-white'
                            : step.completed
                            ? 'bg-success text-white'
                            : 'bg-light text-muted'
                        }`}
                        style={{ width: '32px', height: '32px', fontSize: '14px' }}
                      >
                        {step.completed ? (
                          <i className="ri-check-line" aria-hidden="true"></i>
                        ) : (
                          index + 1
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={`flex-fill mx-2 ${step.completed ? 'bg-success' : 'bg-light'}`}
                          style={{ height: '2px' }}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="d-flex justify-content-between">
                <small className="text-muted">Instrucciones</small>
                <small className="text-muted">Archivo</small>
                <small className="text-muted">Validar</small>
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
            {renderStepContent()}
          </div>

          <div className="modal-footer">
            <div className="d-flex justify-content-between w-100">
              <div>
                {currentStep !== 'instructions' && currentStep !== 'complete' && !isProcessing && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      if (currentStep === 'upload') setCurrentStep('instructions');
                      else if (currentStep === 'validate') setCurrentStep('upload');
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
                {currentStep === 'instructions' && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleSkip}
                    disabled={isProcessing}
                  >
                    Omitir por ahora
                  </button>
                )}
                {currentStep !== 'complete' && currentStep !== 'instructions' && (
                  <button type="button" className="btn btn-outline-secondary" onClick={handleClose} disabled={isProcessing}>
                    Cancelar
                  </button>
                )}
                {currentStep === 'instructions' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setCurrentStep('upload')}
                  >
                    <i className="ri-arrow-right-line me-1" aria-hidden="true"></i>
                    Continuar
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
                {currentStep === 'review' && validationResults?.is_valid && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleImport}
                    disabled={isProcessing}
                  >
                    <i className="ri-upload-2-line me-1" aria-hidden="true"></i>
                    Importar Capacidad
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapacityImportModal;