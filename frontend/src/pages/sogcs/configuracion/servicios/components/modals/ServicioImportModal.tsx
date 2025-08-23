/**
 * Professional Service Import Modal Component (Velzon Design System)
 * 
 * Complete Excel import system for servicios de salud that integrates with
 * the existing backend REPS import functionality. Follows Velzon design patterns.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useImportProgress } from '../../hooks/useImportProgress';
import type { 
  ServiciosImporterProps, 
  ServicioImportResponse, 
  ServicioImportConfig 
} from '../../../../../../types/servicios';
import { servicioService } from '../../../../../../services/servicioService';

const ServicioImportModal: React.FC<ServiciosImporterProps> = ({
  isOpen,
  onImportComplete,
  onCancel,
  sedeOptions = [],
}) => {
  const [step, setStep] = useState(1); // 1: config, 2: upload, 3: validation, 4: results
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<Partial<ServicioImportConfig>>({
    validate_only: false,
    update_existing: false,
    create_backup: true,
  });
  const [validationResults, setValidationResults] = useState<ServicioImportResponse | null>(null);
  const [importResults, setImportResults] = useState<ServicioImportResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { progress, updateProgress, resetProgress, startValidation, startProcessing, setCompleted, setError: setProgressError } = useImportProgress();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setConfig({
      validate_only: false,
      update_existing: false,
      create_backup: true,
    });
    setValidationResults(null);
    setImportResults(null);
    setIsProcessing(false);
    setError(null);
    setIsDragging(false);
    resetProgress();
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileSelection = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xls')) {
      setError('Por favor seleccione un archivo Excel (.xlsx, .xls) o CSV (.csv)');
      return;
    }
    
    // Validate file size (max 25MB)
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('El archivo no puede ser mayor a 25MB');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileSelection(selectedFile);
    }
  };

  const handleConfigChange = (field: keyof ServicioImportConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const validateImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setStep(3);
    setError(null);
    startValidation();

    try {
      const validationConfig: ServicioImportConfig = {
        file,
        validate_only: true,
        sede_id: config.sede_id,
        update_existing: config.update_existing,
        create_backup: config.create_backup,
      };

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        updateProgress({ progress: Math.min(progress.progress + 10, 90) });
      }, 300);

      const results = await servicioService.validateImportFile(file, config.sede_id);
      
      clearInterval(progressInterval);
      setCompleted('Validación completada');
      
      setValidationResults(results);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error durante la validación');
      setProgressError('Error en la validación');
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  const processImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    startProcessing();

    try {
      const importConfig: ServicioImportConfig = {
        file,
        validate_only: false,
        sede_id: config.sede_id,
        update_existing: config.update_existing,
        create_backup: config.create_backup,
      };

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        updateProgress({ progress: Math.min(progress.progress + 5, 95) });
      }, 500);

      const results = await servicioService.importServicios(importConfig);
      
      clearInterval(progressInterval);
      setCompleted('Importación completada');
      
      setImportResults(results);
      
      // Call completion callback after a short delay to show completion
      setTimeout(() => {
        onImportComplete(results);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error durante la importación');
      setProgressError('Error en la importación');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await servicioService.downloadImportTemplate('excel');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_servicios_salud_reps.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al descargar la plantilla');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="step-content">
            <div className="mb-4">
              <h6 className="mb-3">
                <i className="ri-settings-line me-2 text-primary"></i>
                Configuración de Importación
              </h6>
              
              <div className="row">
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Sede Específica (Opcional)</label>
                    <select
                      className="form-select"
                      value={config.sede_id || ''}
                      onChange={(e) => handleConfigChange('sede_id', e.target.value || undefined)}
                    >
                      <option value="">Todas las sedes del archivo</option>
                      {sedeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="form-text text-muted">
                      Si selecciona una sede, solo se importarán servicios para esa sede
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="update_existing"
                      checked={config.update_existing || false}
                      onChange={(e) => handleConfigChange('update_existing', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="update_existing">
                      Actualizar servicios existentes
                    </label>
                    <div className="form-text text-muted">
                      Si está marcado, actualizará servicios que ya existan. Si no, los saltará.
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="create_backup"
                      checked={config.create_backup || false}
                      onChange={(e) => handleConfigChange('create_backup', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="create_backup">
                      Crear respaldo antes de importar
                    </label>
                    <div className="form-text text-muted">
                      Recomendado: Crea un respaldo de los servicios actuales.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-top pt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">
                  <i className="ri-download-line me-2 text-primary"></i>
                  Plantilla de Importación REPS
                </h6>
                <button 
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={downloadTemplate}
                >
                  <i className="ri-download-line me-1"></i>
                  Descargar Plantilla
                </button>
              </div>
              
              <div className="alert alert-info mb-0">
                <div className="d-flex">
                  <i className="ri-information-line me-2 mt-1 text-info"></i>
                  <div>
                    <strong>Importante:</strong> Descargue y utilice la plantilla oficial de REPS para asegurar que 
                    sus datos tengan el formato correcto. La plantilla incluye las 93 columnas del formato REPS 
                    con ejemplos y validaciones que le ayudarán a preparar sus datos correctamente.
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="mb-4">
              <h6 className="mb-3">
                <i className="ri-upload-line me-2 text-primary"></i>
                Seleccionar Archivo REPS
              </h6>
              
              {/* Drag and Drop Area */}
              <div
                className={`upload-area border-2 border-dashed rounded-3 p-4 text-center mb-3 ${
                  isDragging ? 'border-primary bg-primary-subtle' : 'border-secondary'
                } ${file ? 'border-success bg-success-subtle' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{ cursor: 'pointer', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div>
                  {file ? (
                    <div className="text-success">
                      <i className="ri-file-excel-line fs-1 mb-2"></i>
                      <div className="fw-medium">{file.name}</div>
                      <div className="text-muted small">
                        Tamaño: {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <div className="text-success small mt-1">
                        <i className="ri-check-line me-1"></i>
                        Archivo seleccionado
                      </div>
                    </div>
                  ) : (
                    <div className={isDragging ? 'text-primary' : 'text-muted'}>
                      <i className="ri-upload-cloud-line fs-1 mb-2"></i>
                      <div className="fw-medium">Arrastra tu archivo aquí o haz clic para seleccionar</div>
                      <div className="small">
                        Formatos soportados: Excel (.xlsx, .xls) y CSV (.csv)
                      </div>
                      <div className="small">Tamaño máximo: 25MB</div>
                    </div>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="d-none"
              />
              
              {error && (
                <div className="alert alert-danger">
                  <i className="ri-error-warning-line me-2"></i>
                  {error}
                </div>
              )}
            </div>
            
            <div className="alert alert-warning">
              <div className="d-flex">
                <i className="ri-alert-line me-2 mt-1 text-warning"></i>
                <div>
                  <strong>Antes de continuar:</strong>
                  <ul className="mb-0 mt-2">
                    <li>Asegúrese de que el archivo siga el formato de exportación REPS oficial</li>
                    <li>Verifique que todos los códigos de servicio sean válidos según REPS</li>
                    <li>Confirme que las sedes mencionadas existan en el sistema</li>
                    <li>Revise que no hay filas vacías o datos incompletos</li>
                    <li>El archivo debe contener las 93 columnas del formato REPS</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="mb-4">
              <h6 className="mb-3">
                <i className="ri-search-line me-2 text-primary"></i>
                {progress.stage === 'validating' ? 'Validando Archivo REPS' : 'Procesando Importación'}
              </h6>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">{progress.message}</span>
                  <span className="text-muted">{progress.progress}%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className={`progress-bar ${progress.stage === 'error' ? 'bg-danger' : 'bg-primary'} ${isProcessing ? 'progress-bar-striped progress-bar-animated' : ''}`}
                    role="progressbar"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>
              
              {progress.currentRow && progress.totalRows && (
                <div className="text-center text-muted">
                  Procesando fila {progress.currentRow} de {progress.totalRows}
                </div>
              )}
              
              <div className="text-center mt-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Procesando...</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            {validationResults && (
              <div className="mb-4">
                <h6 className="mb-3">
                  <i className="ri-check-line me-2 text-success"></i>
                  Resultados de Validación
                </h6>
                
                <div className="row mb-3">
                  <div className="col-md-3">
                    <div className="text-center p-3 border rounded">
                      <div className="fs-4 fw-bold text-primary">{validationResults.total_rows || 0}</div>
                      <div className="text-muted small">Total de Filas</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3 border rounded">
                      <div className="fs-4 fw-bold text-success">{validationResults.valid_rows || 0}</div>
                      <div className="text-muted small">Válidas</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3 border rounded">
                      <div className="fs-4 fw-bold text-danger">{validationResults.invalid_rows || 0}</div>
                      <div className="text-muted small">Con Errores</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-center p-3 border rounded">
                      <div className="fs-4 fw-bold text-warning">{validationResults.warning_count || 0}</div>
                      <div className="text-muted small">Advertencias</div>
                    </div>
                  </div>
                </div>
                
                {validationResults.errors && validationResults.errors.length > 0 && (
                  <div className="alert alert-danger">
                    <h6 className="alert-heading">
                      <i className="ri-error-warning-line me-2"></i>
                      Errores Encontrados
                    </h6>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {validationResults.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="mb-1 small">
                          <strong>Fila {error.row}:</strong> {error.error}
                          {error.service_code && (
                            <span className="text-muted"> (Servicio: {error.service_code})</span>
                          )}
                        </div>
                      ))}
                      {validationResults.errors.length > 10 && (
                        <div className="text-muted small">
                          ... y {validationResults.errors.length - 10} errores más
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {validationResults.warnings && validationResults.warnings.length > 0 && (
                  <div className="alert alert-warning">
                    <h6 className="alert-heading">
                      <i className="ri-alert-line me-2"></i>
                      Advertencias
                    </h6>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {validationResults.warnings.slice(0, 5).map((warning, index) => (
                        <div key={index} className="mb-1 small">
                          <strong>Fila {warning.row}:</strong> {warning.warning}
                        </div>
                      ))}
                      {validationResults.warnings.length > 5 && (
                        <div className="text-muted small">
                          ... y {validationResults.warnings.length - 5} advertencias más
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {validationResults.valid_rows === validationResults.total_rows && (
                  <div className="alert alert-success">
                    <i className="ri-check-line me-2"></i>
                    <strong>¡Excelente!</strong> Todos los datos son válidos y están listos para importar.
                  </div>
                )}
              </div>
            )}
            
            {importResults && (
              <div className="mb-4">
                <h6 className="mb-3">
                  <i className="ri-check-double-line me-2 text-success"></i>
                  Resultados de Importación
                </h6>
                
                <div className="row mb-3">
                  <div className="col-md-4">
                    <div className="text-center p-3 border rounded">
                      <div className="fs-4 fw-bold text-success">{importResults.imported_count || 0}</div>
                      <div className="text-muted small">Servicios Importados</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 border rounded">
                      <div className="fs-4 fw-bold text-info">{importResults.updated_count || 0}</div>
                      <div className="text-muted small">Servicios Actualizados</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center p-3 border rounded">
                      <div className="fs-4 fw-bold text-danger">{importResults.error_count || 0}</div>
                      <div className="text-muted small">Errores</div>
                    </div>
                  </div>
                </div>
                
                {importResults.success ? (
                  <div className="alert alert-success">
                    <i className="ri-check-line me-2"></i>
                    <strong>¡Importación exitosa!</strong> Los servicios de salud han sido importados correctamente desde REPS.
                  </div>
                ) : (
                  <div className="alert alert-danger">
                    <i className="ri-error-warning-line me-2"></i>
                    <strong>Error en la importación:</strong> {importResults.message}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderButtons = () => {
    switch (step) {
      case 1:
        return (
          <>
            <button type="button" className="btn btn-light" onClick={onCancel}>
              Cancelar
            </button>
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={() => setStep(2)}
            >
              Continuar
              <i className="ri-arrow-right-line ms-1"></i>
            </button>
          </>
        );

      case 2:
        return (
          <>
            <button 
              type="button"
              className="btn btn-outline-secondary" 
              onClick={() => setStep(1)}
              disabled={isProcessing}
            >
              <i className="ri-arrow-left-line me-1"></i>
              Anterior
            </button>
            <button type="button" className="btn btn-light" onClick={onCancel} disabled={isProcessing}>
              Cancelar
            </button>
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={validateImport}
              disabled={!file || isProcessing}
            >
              Validar Archivo
              <i className="ri-search-line ms-1"></i>
            </button>
          </>
        );

      case 3:
        return (
          <>
            <button type="button" className="btn btn-light" onClick={onCancel} disabled={isProcessing}>
              Cancelar
            </button>
          </>
        );

      case 4:
        return (
          <>
            <button 
              type="button"
              className="btn btn-outline-secondary" 
              onClick={() => setStep(2)}
              disabled={isProcessing || !!importResults}
            >
              <i className="ri-arrow-left-line me-1"></i>
              Seleccionar Otro Archivo
            </button>
            
            {validationResults && !importResults && (
              <>
                {validationResults.valid_rows === 0 ? (
                  <button type="button" className="btn btn-light" onClick={onCancel}>
                    Cerrar
                  </button>
                ) : (
                  <button 
                    type="button"
                    className="btn btn-success" 
                    onClick={processImport}
                    disabled={isProcessing}
                  >
                    {isProcessing && <span className="spinner-border spinner-border-sm me-2"></span>}
                    Proceder con Importación
                    <i className="ri-upload-line ms-1"></i>
                  </button>
                )}
              </>
            )}
            
            {importResults && (
              <button type="button" className="btn btn-primary" onClick={onCancel}>
                <i className="ri-check-line me-1"></i>
                Finalizar
              </button>
            )}
          </>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal fade show" 
      style={{ 
        display: 'block', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
      tabIndex={-1}
      role="dialog"
      aria-labelledby="importModalTitle"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onCancel();
        }
      }}
    >
      <div 
        className="modal-dialog modal-xl" 
        role="document"
        style={{
          maxWidth: '900px',
          margin: '1.75rem auto'
        }}
      >
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary-subtle border-bottom-0">
            <h5 className="modal-title d-flex align-items-center" id="importModalTitle">
              <i className="ri-upload-cloud-line me-2 text-primary"></i>
              Importar Servicios de Salud desde REPS
            </h5>
            {!isProcessing && (
              <button 
                type="button" 
                className="btn-close" 
                aria-label="Cerrar"
                onClick={onCancel}
              />
            )}
          </div>
          
          <div className="modal-body p-4">
            {/* Progress Steps */}
            <div className="d-flex justify-content-center mb-4">
              <div className="d-flex align-items-center">
                <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${step >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                  {step > 1 ? <i className="ri-check-line"></i> : '1'}
                </div>
                <div className={`border-top ${step > 1 ? 'border-primary' : 'border-light'}`} style={{ width: '60px' }}></div>
                <div className={`rounded-circle d-flex align-items-center justify-content-center mx-3 ${step >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                  {step > 2 ? <i className="ri-check-line"></i> : '2'}
                </div>
                <div className={`border-top ${step > 2 ? 'border-primary' : 'border-light'}`} style={{ width: '60px' }}></div>
                <div className={`rounded-circle d-flex align-items-center justify-content-center mx-3 ${step >= 3 ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                  {step > 3 ? <i className="ri-check-line"></i> : '3'}
                </div>
                <div className={`border-top ${step > 3 ? 'border-primary' : 'border-light'}`} style={{ width: '60px' }}></div>
                <div className={`rounded-circle d-flex align-items-center justify-content-center ms-3 ${step >= 4 ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                  {step >= 4 ? <i className="ri-check-line"></i> : '4'}
                </div>
              </div>
            </div>

            {/* Step Labels */}
            <div className="d-flex justify-content-center mb-4">
              <div className="d-flex" style={{ width: '400px' }}>
                <div className="text-center flex-fill">
                  <small className={`${step >= 1 ? 'text-primary fw-medium' : 'text-muted'}`}>
                    Configurar
                  </small>
                </div>
                <div className="text-center flex-fill">
                  <small className={`${step >= 2 ? 'text-primary fw-medium' : 'text-muted'}`}>
                    Seleccionar
                  </small>
                </div>
                <div className="text-center flex-fill">
                  <small className={`${step >= 3 ? 'text-primary fw-medium' : 'text-muted'}`}>
                    Validar
                  </small>
                </div>
                <div className="text-center flex-fill">
                  <small className={`${step >= 4 ? 'text-success fw-medium' : 'text-muted'}`}>
                    Finalizar
                  </small>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="alert alert-danger mb-4">
                <i className="ri-error-warning-line me-2"></i>
                {error}
              </div>
            )}
            
            {renderStepContent()}
          </div>
          
          <div className="modal-footer bg-light border-top-0">
            <div className="d-flex justify-content-between w-100 align-items-center">
              <div className="text-muted small">
                {step === 1 && 'Configurar opciones de importación'}
                {step === 2 && 'Seleccionar archivo REPS a importar'}
                {step === 3 && 'Procesando archivo...'}
                {step === 4 && 'Revisar resultados de la importación'}
              </div>
              <div className="d-flex gap-2">
                {renderButtons()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicioImportModal;