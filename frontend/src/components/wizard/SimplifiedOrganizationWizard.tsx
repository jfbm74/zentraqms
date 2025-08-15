/**
 * Simplified Organization Wizard - Single tab for basic organization setup
 * 
 * This replaces the complex multi-tab wizard with a streamlined single-form approach.
 * Only handles basic organization information and logo upload as requested.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from '../../utils/SimpleRouter';

// Store and validation
import { 
  useOrganizationWizardStore,
  useFormData,
  useValidation,
  useUIState
} from '../../stores/organizationWizardStore';

// Components (to be created)
import OrganizationFormSection from './components/OrganizationFormSection';
import LogoUploader from './components/LogoUploader';
import ErrorBoundary from '../common/ErrorBoundary';
import LoadingSpinner from '../common/LoadingSpinner';

// Types
import { Organization } from '../../types/wizard.types';

// Validation utilities
import { FormValidator, FormValidators, DebouncedValidator } from '../../utils/validation';

interface SimplifiedOrganizationWizardProps {
  onComplete?: (organization: Organization) => void;
  onCancel?: () => void;
  className?: string;
}

const SimplifiedOrganizationWizard: React.FC<SimplifiedOrganizationWizardProps> = ({
  onComplete,
  onCancel,
  className = ''
}) => {
  // Store selectors
  const formData = useFormData();
  const validation = useValidation();
  const uiState = useUIState();
  
  // Access store directly to avoid creating new objects on every render
  const store = useOrganizationWizardStore();
  
  // Local state
  const [debouncedValidator] = useState(() => new DebouncedValidator());
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Navigation
  const navigate = useNavigate();
  
  /**
   * Show toast notifications
   */
  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    toast[type](message, {
      position: 'top-right',
      autoClose: type === 'error' ? 5000 : 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
  }, []);
  
  /**
   * Load draft on mount
   */
  useEffect(() => {
    store.loadDraft();
  }, []); // Empty dependency array - only run on mount
  
  /**
   * Auto-save changes with debouncing
   */
  useEffect(() => {
    if (!hasInteracted) return;
    
    const timeoutId = setTimeout(() => {
      store.saveDraft();
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [formData, hasInteracted]); // Removed saveDraft from dependencies
  
  /**
   * Clean up debounced validator on unmount
   */
  useEffect(() => {
    return () => {
      debouncedValidator.clearAll();
    };
  }, []); // debouncedValidator is stable from useState
  
  /**
   * Handle field changes with validation
   */
  const handleFieldChange = useCallback((field: string, value: string) => {
    setHasInteracted(true);
    store.updateField(field as any, value);
    
    // Clear existing error
    store.clearFieldError(field);
    
    // Skip validation for empty values (unless it's a required field and user has attempted submit)
    if (!value && !uiState.submitAttempted) {
      return;
    }
    
    // Validate field with debouncing
    debouncedValidator.validate(
      field,
      value,
      (val) => {
        switch (field) {
          case 'razon_social':
            return FormValidators.validateOrganizationName(val);
          case 'nit':
            return FormValidators.validateNIT(val);
          case 'digito_verificacion':
            return FormValidators.validateVerificationDigit(val);
          case 'email_contacto':
            return FormValidators.validateEmail(val);
          case 'telefono_principal':
            return FormValidators.validatePhone(val);
          case 'website':
            return FormValidators.validateWebsite(val);
          case 'descripcion':
            return FormValidators.validateDescription(val);
          default:
            return { isValid: true };
        }
      },
      field === 'nit' ? 800 : 400
    ).then((result) => {
      if (!result.isValid && result.error) {
        store.setFieldError(field, result.error);
      }
    });
  }, []);
  
  /**
   * Handle NIT validation with backend check
   */
  const handleNitValidation = useCallback(async (nit: string) => {
    if (!nit || nit.length < 9) return;
    
    try {
      await store.validateNit(nit);
    } catch (error) {
      console.error('NIT validation error:', error);
    }
  }, []);
  
  /**
   * Handle logo upload
   */
  const handleLogoUpload = useCallback((file: File | null) => {
    setHasInteracted(true);
    
    if (file) {
      // Validate logo before uploading
      const validation = FormValidators.validateLogo(file);
      if (!validation.isValid) {
        store.setFieldError('logo', validation.error!);
        return;
      }
      
      // Validate dimensions asynchronously
      FormValidators.validateImageDimensions(file).then((dimensionResult) => {
        if (!dimensionResult.isValid) {
          store.setFieldError('logo', dimensionResult.error!);
          store.removeLogo();
        } else {
          store.clearFieldError('logo');
        }
      });
      
      store.uploadLogo(file);
    } else {
      store.removeLogo();
      store.clearFieldError('logo');
    }
  }, []);
  
  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    const errors = FormValidator.validateForm({
      razon_social: formData.razon_social,
      nit: formData.nit,
      digito_verificacion: formData.digito_verificacion,
      email_contacto: formData.email_contacto,
      telefono_principal: formData.telefono_principal,
      website: formData.website,
      descripcion: formData.descripcion,
    });
    
    // Set all errors
    Object.entries(errors).forEach(([field, error]) => {
      store.setFieldError(field, error);
    });
    
    return !FormValidator.hasErrors(errors);
  }, [formData]);
  
  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    store.setSubmitAttempted(true);
    
    // Validate form
    if (!validateForm()) {
      showToast('error', 'Por favor corrige los errores en el formulario');
      return;
    }
    
    // Check if NIT is available
    if (validation.nitAvailable === false) {
      showToast('error', 'El NIT ingresado ya está en uso');
      return;
    }
    
    try {
      store.setLoading(true);
      
      // Create organization
      const organization = await store.createOrganization();
      
      showToast('success', '¡Organización creada exitosamente!');
      store.showSuccess();
      
      // Clear draft after successful creation
      store.clearDraft();
      
      // Call completion callback
      if (onComplete) {
        onComplete(organization);
      } else {
        // Default navigation to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error creating organization:', error);
      showToast('error', error instanceof Error ? error.message : 'Error al crear la organización');
    } finally {
      store.setLoading(false);
    }
  }, [validateForm, validation.nitAvailable, onComplete, navigate, showToast]);
  
  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    if (uiState.hasUnsavedChanges) {
      const confirmDiscard = window.confirm(
        'Tienes cambios sin guardar. ¿Estás seguro que quieres salir?'
      );
      if (!confirmDiscard) return;
    }
    
    store.resetForm();
    store.clearDraft();
    
    if (onCancel) {
      onCancel();
    } else {
      navigate('/dashboard');
    }
  }, [uiState.hasUnsavedChanges, onCancel, navigate]);
  
  /**
   * Handle success modal close
   */
  const handleSuccessClose = useCallback(() => {
    store.hideSuccess();
    
    if (onComplete) {
      // Let parent handle navigation
      return;
    }
    
    // Default navigation
    navigate('/dashboard');
  }, [onComplete, navigate]);
  
  // Set page title
  useEffect(() => {
    document.title = 'Configuración de Organización | ZentraQMS';
  }, []);
  
  return (
    <ErrorBoundary>
      <div className={`simplified-organization-wizard ${className}`}>
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-xl-8 col-lg-10 col-md-12">
              <div className="card shadow-sm border-0">
                {/* Header */}
                <div className="card-header bg-primary border-0">
                  <div className="text-center py-3">
                    <h4 className="mb-1 fw-semibold text-white d-flex align-items-center justify-content-center">
                      <i className="ri-building-line me-2" aria-hidden="true"></i>
                      Configuración de Organización
                      {uiState.hasUnsavedChanges && (
                        <span 
                          className="badge bg-warning ms-2 fs-6"
                          title="Guardando cambios automáticamente..."
                        >
                          <i className="ri-save-line me-1" aria-hidden="true"></i>
                          Guardando...
                        </span>
                      )}
                    </h4>
                    <p className="text-white-50 mb-0">
                      Configure la información básica de su organización
                    </p>
                    {uiState.lastSaved && (
                      <small className="text-white-75 d-block mt-1">
                        <i className="ri-check-line me-1" aria-hidden="true"></i>
                        Último guardado: {uiState.lastSaved.toLocaleTimeString()}
                      </small>
                    )}
                  </div>
                </div>

                {/* Form */}
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit} noValidate>
                    {/* Logo Upload Section */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="text-center">
                          <h5 className="mb-3">
                            <i className="ri-image-line me-2 text-primary"></i>
                            Logo de la Organización
                          </h5>
                          <LogoUploader
                            value={formData.logo}
                            preview={formData.logoPreview}
                            onChange={handleLogoUpload}
                            onError={(error) => store.setFieldError('logo', error)}
                            className="mx-auto"
                          />
                          {validation.errors.logo && (
                            <div className="text-danger small mt-2">
                              {validation.errors.logo}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Organization Form Section */}
                    <OrganizationFormSection
                      formData={formData}
                      validation={validation}
                      onChange={handleFieldChange}
                      onNitValidation={handleNitValidation}
                      submitAttempted={uiState.submitAttempted}
                    />

                    {/* Action Buttons */}
                    <div className="row mt-4">
                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                          <button
                            type="button"
                            className="btn btn-light btn-label"
                            onClick={handleCancel}
                            disabled={uiState.isLoading}
                          >
                            <i className="ri-close-line label-icon align-middle fs-16 me-2"></i>
                            Cancelar
                          </button>
                          
                          <button
                            type="submit"
                            className="btn btn-primary btn-label"
                            disabled={uiState.isLoading || validation.isValidating}
                          >
                            {uiState.isLoading ? (
                              <>
                                <div 
                                  className="spinner-border spinner-border-sm me-2" 
                                  role="status"
                                >
                                  <span className="visually-hidden">Cargando...</span>
                                </div>
                                Creando...
                              </>
                            ) : (
                              <>
                                <i className="ri-save-line label-icon align-middle fs-16 me-2"></i>
                                Crear Organización
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {uiState.showSuccessModal && (
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-body text-center p-4">
                  <div className="avatar-md mt-2 mb-4 mx-auto">
                    <div className="avatar-title bg-light text-success display-4 rounded-circle">
                      <i className="ri-checkbox-circle-fill"></i>
                    </div>
                  </div>
                  <h5 className="text-success mb-3">
                    ¡Organización Creada Exitosamente!
                  </h5>
                  <p className="text-muted mb-4">
                    Su organización ha sido configurada correctamente en ZentraQMS.
                    Ahora puede comenzar a usar el sistema.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSuccessClose}
                  >
                    <i className="ri-arrow-right-line me-2"></i>
                    Continuar al Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {uiState.isLoading && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-25" style={{ zIndex: 9999 }}>
            <LoadingSpinner size="lg" message="Creando organización..." />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default SimplifiedOrganizationWizard;