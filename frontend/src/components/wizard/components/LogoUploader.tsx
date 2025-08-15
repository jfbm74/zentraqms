/**
 * Logo Uploader Component
 * 
 * Handles logo file upload with drag-and-drop, preview, and validation.
 * Supports image cropping, resizing, and format validation.
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { LogoUploaderProps, LOGO_CONSTRAINTS } from '../../../types/wizard.types';
import { FormValidators, ValidationUtils } from '../../../utils/validation';

const LogoUploader: React.FC<LogoUploaderProps> = ({
  value,
  preview,
  onChange,
  onError,
  maxSize = LOGO_CONSTRAINTS.MAX_SIZE_MB,
  acceptedFormats = LOGO_CONSTRAINTS.ACCEPTED_FORMATS,
  className = ''
}) => {
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  
  // Local state
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;
    
    setIsProcessing(true);
    
    try {
      // Validate file type and size
      const validation = FormValidators.validateLogo(file);
      if (!validation.isValid) {
        onError(validation.error!);
        setIsProcessing(false);
        return;
      }
      
      // Validate dimensions
      const dimensionValidation = await FormValidators.validateImageDimensions(file);
      if (!dimensionValidation.isValid) {
        onError(dimensionValidation.error!);
        setIsProcessing(false);
        return;
      }
      
      // File is valid, proceed with upload
      onChange(file);
      
    } catch (error) {
      console.error('Error processing logo file:', error);
      onError('Error al procesar el archivo de imagen');
    } finally {
      setIsProcessing(false);
    }
  }, [onChange, onError]);
  
  /**
   * Handle file input change
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    
    // Clear input to allow re-selecting same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);
  
  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current++;
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    dragCounterRef.current = 0;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if it's an image file
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      } else {
        onError('Por favor selecciona un archivo de imagen válido');
      }
    }
  }, [handleFileSelect, onError]);
  
  /**
   * Open file browser
   */
  const openFileBrowser = useCallback(() => {
    if (fileInputRef.current && !isProcessing) {
      fileInputRef.current.click();
    }
  }, [isProcessing]);
  
  /**
   * Remove current logo
   */
  const removeLogo = useCallback(() => {
    onChange(null);
  }, [onChange]);
  
  /**
   * Get accepted file types for input
   */
  const acceptedFileTypes = acceptedFormats.join(',');
  
  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    return ValidationUtils.formatFileSize(bytes);
  };
  
  /**
   * Clean up preview URL on unmount
   */
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, []);
  
  return (
    <div className={`logo-uploader ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleInputChange}
        className="d-none"
        aria-label="Seleccionar logo"
      />
      
      {/* Upload Area */}
      <div
        className={`upload-area border-2 border-dashed rounded-3 p-4 text-center position-relative ${
          isDragging ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
        } ${isProcessing ? 'opacity-50' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ 
          minHeight: '200px', 
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={openFileBrowser}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFileBrowser();
          }
        }}
      >
        {isProcessing && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Procesando...</span>
            </div>
            <div className="mt-2 small text-muted">Procesando imagen...</div>
          </div>
        )}
        
        {!isProcessing && preview ? (
          // Preview mode
          <div className="logo-preview">
            <img
              src={preview}
              alt="Vista previa del logo"
              className="img-fluid rounded"
              style={{ 
                maxHeight: '150px', 
                maxWidth: '100%',
                objectFit: 'contain'
              }}
            />
            <div className="mt-3">
              <p className="mb-2 fw-medium text-success">
                <i className="ri-check-line me-1"></i>
                Logo cargado correctamente
              </p>
              {value && (
                <small className="text-muted d-block mb-3">
                  {value.name} ({formatFileSize(value.size)})
                </small>
              )}
              <div className="d-flex gap-2 justify-content-center">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFileBrowser();
                  }}
                >
                  <i className="ri-upload-2-line me-1"></i>
                  Cambiar
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLogo();
                  }}
                >
                  <i className="ri-delete-bin-line me-1"></i>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ) : !isProcessing ? (
          // Upload prompt
          <div className="upload-prompt">
            <div className="mb-3">
              <i 
                className={`ri-upload-cloud-2-line display-4 ${
                  isDragging ? 'text-primary' : 'text-muted'
                }`}
              ></i>
            </div>
            <h6 className={`mb-2 ${isDragging ? 'text-primary' : ''}`}>
              {isDragging ? 'Suelta el archivo aquí' : 'Cargar Logo'}
            </h6>
            <p className="text-muted mb-3">
              Arrastra una imagen aquí o <span className="text-primary fw-medium">haz clic para seleccionar</span>
            </p>
            <div className="upload-requirements">
              <small className="text-muted">
                <strong>Requisitos:</strong><br />
                • Formatos: JPEG, PNG, SVG, WebP<br />
                • Tamaño máximo: {maxSize}MB<br />
                • Dimensiones: {LOGO_CONSTRAINTS.MIN_DIMENSIONS.width}x{LOGO_CONSTRAINTS.MIN_DIMENSIONS.height} a {LOGO_CONSTRAINTS.MAX_DIMENSIONS.width}x{LOGO_CONSTRAINTS.MAX_DIMENSIONS.height} píxeles
              </small>
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Additional help text */}
      <div className="text-center mt-2">
        <small className="text-muted">
          El logo aparecerá en documentos, reportes y la interfaz del sistema
        </small>
      </div>
    </div>
  );
};

export default LogoUploader;