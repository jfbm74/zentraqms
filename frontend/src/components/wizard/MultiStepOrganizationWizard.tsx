/**
 * Multi-Step Organization Wizard - Includes sector selection and multi-sector support
 * 
 * This wizard implements the complete multi-sector architecture with:
 * 1. Sector and organization type selection
 * 2. Basic organization information
 * 3. Module auto-activation based on sector rules
 */

import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from '../../utils/SimpleRouter';

// Store and validation
import { 
  useOrganizationWizardStore,
  useFormData,
  useValidation,
  useUIState
} from '../../stores/organizationWizardStore';

// Components
import SectorSelectionStep from './steps/SectorSelectionStep';
import OrganizationFormSection from './components/OrganizationFormSection';
import LogoUploader from './components/LogoUploader';
import ErrorBoundary from '../common/ErrorBoundary';
import LoadingSpinner from '../common/LoadingSpinner';

// Types
import { Organization, OrganizationFormData, SectorType, AUTO_ACTIVATION_RULES } from '../../types/wizard.types';

// Validation utilities
import { FormValidator, FormValidators, DebouncedValidator } from '../../utils/validation';

interface MultiStepOrganizationWizardProps {
  onComplete?: (organization: Organization) => void;
  onCancel?: () => void;
  className?: string;
}

type WizardStep = 'SECTOR_SELECTION' | 'ORGANIZATION_INFO';

const STEPS = [
  { id: 'SECTOR_SELECTION', title: 'Configuración', description: 'Configure su organización' },
  { id: 'ORGANIZATION_INFO', title: 'Información', description: 'Datos básicos de la organización' }
];

const MultiStepOrganizationWizard: React.FC<MultiStepOrganizationWizardProps> = ({
  onComplete,
  onCancel,
  className = ''
}) => {
  // ✅ UNIFIED FIX: Use store directly for ALL data access to prevent selector sync issues
  // This ensures consistent state access for both auto-save and validation scenarios
  const store = useOrganizationWizardStore();
  
  // Local state
  const [currentStep, setCurrentStep] = useState<WizardStep>('SECTOR_SELECTION');
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
  }, []);
  
  /**
   * Auto-save changes with debouncing
   */
  useEffect(() => {
    if (!hasInteracted) return;
    
    const timeoutId = setTimeout(() => {
      store.saveDraft();
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [store.formData, hasInteracted, store]);
  
  /**
   * Clean up debounced validator on unmount
   */
  useEffect(() => {
    return () => {
      debouncedValidator.clearAll();
    };
  }, []);

  /**
   * Handle sector and organization type selection
   */
  const handleSectorSelect = useCallback((sector: SectorType, organizationType?: string) => {
    setHasInteracted(true);
    
    // ✅ ACTUALIZADO: Guardar en ambos formatos para compatibilidad
    const updateData: Partial<OrganizationFormData> = {
      // Legacy fields (compatibilidad)
      sector,
      // New fields (backend mapping)
      selectedSector: sector,
    };
    
    if (organizationType) {
      updateData.organization_type = organizationType;
      updateData.selectedOrgType = organizationType;
      updateData.tipo_organizacion = organizationType; // Add to classification
    }
    
    // Auto-fill sector económico based on sector selection
    const sectorMapping = {
      'HEALTHCARE': 'salud',
      'MANUFACTURING': 'manufactura', 
      'SERVICES': 'servicios',
      'EDUCATION': 'educacion',
    };
    
    updateData.sector_economico = sectorMapping[sector] || '';
    
    store.updateMultipleFields(updateData);
    
    // Auto-activate modules based on rules
    if (sector && organizationType) {
      const activationRules = AUTO_ACTIVATION_RULES[sector];
      const modulesToActivate = activationRules[organizationType] || [];
      
      store.updateField('auto_activated_modules', modulesToActivate);
      store.updateField('selected_modules', modulesToActivate);
      
      showToast('info', `Se activaron automáticamente ${modulesToActivate.length} módulos para ${sector} - ${organizationType}`);
    }
  }, [store, showToast]);

  /**
   * Navigation handlers
   */
  const handleNext = useCallback(() => {
    const currentFormData = store.formData;
    switch (currentStep) {
      case 'SECTOR_SELECTION':
        if (currentFormData.sector && (currentFormData.organization_type || !currentFormData.sector)) {
          setCurrentStep('ORGANIZATION_INFO');
        } else {
          showToast('error', 'Debe completar la selección de sector y tipo de organización');
        }
        break;
      case 'ORGANIZATION_INFO':
        handleSubmit();
        break;
    }
  }, [currentStep, store, showToast]);

  const handlePrevious = useCallback(() => {
    switch (currentStep) {
      case 'ORGANIZATION_INFO':
        setCurrentStep('SECTOR_SELECTION');
        break;
      case 'SECTOR_SELECTION':
        if (onCancel) {
          onCancel();
        }
        break;
    }
  }, [currentStep, onCancel]);

  /**
   * Handle field changes with validation
   */
  const handleFieldChange = useCallback((field: string, value: string) => {
    console.log('🔄 Field change:', { field, value, previousValue: store.formData[field as keyof OrganizationFormData] });
    
    setHasInteracted(true);
    store.updateField(field as any, value);
    
    // Clear existing error
    store.clearFieldError(field);
    
    // Skip validation for empty values (unless it's a required field and user has attempted submit)
    if (!value && !store.ui.submitAttempted) {
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
  }, [store, debouncedValidator]);
  
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
  }, [store]);
  
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
  }, [store]);
  
  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    // ✅ UNIFIED FIX: Always use store direct access for consistency
    const currentFormData = store.formData;
    const currentValidation = store.validation;
    
    // DEBUG: Log validation state
    console.log('🔍 Form validation with unified store access:', {
      formData: currentFormData,
      validation: currentValidation,
      ui: store.ui
    });
    
    const errors = FormValidator.validateForm({
      razon_social: currentFormData.razon_social,
      nit: currentFormData.nit,
      digito_verificacion: currentFormData.digito_verificacion,
      email_contacto: currentFormData.email_contacto,
      telefono_principal: currentFormData.telefono_principal,
      website: currentFormData.website,
      descripcion: currentFormData.descripcion,
    });
    
    // DEBUG: Log validation results
    console.log('🔍 Form validation results:', {
      formData: {
        razon_social: currentFormData.razon_social,
        nit: currentFormData.nit,
        digito_verificacion: currentFormData.digito_verificacion,
        email_contacto: currentFormData.email_contacto,
        telefono_principal: currentFormData.telefono_principal,
        website: currentFormData.website,
        descripcion: currentFormData.descripcion,
      },
      errors,
      hasErrors: FormValidator.hasErrors(errors),
      nitAvailable: currentValidation.nitAvailable
    });
    
    // DEBUG: Log specific errors
    if (FormValidator.hasErrors(errors)) {
      console.log('❌ Specific validation errors:');
      Object.entries(errors).forEach(([field, error]) => {
        if (error && error.trim().length > 0) {
          console.log(`  - ${field}: ${error}`);
        }
      });
    }
    
    // Set all errors
    Object.entries(errors).forEach(([field, error]) => {
      store.setFieldError(field, error);
    });
    
    return !FormValidator.hasErrors(errors);
  }, [store]);
  
  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    console.log('🚀 Starting form submission...');
    store.setSubmitAttempted(true);
    
    // Validate form
    const isFormValid = validateForm();
    console.log('✅ Form validation result:', isFormValid);
    
    if (!isFormValid) {
      console.log('❌ Form validation failed');
      showToast('error', 'Por favor corrige los errores en el formulario');
      return;
    }
    
    // Check if NIT is available (only if validation was performed and failed)
    if (store.validation.nitAvailable === false) {
      console.log('❌ NIT not available');
      showToast('error', 'El NIT ingresado ya está en uso');
      return;
    }
    
    console.log('✅ All validations passed, proceeding with creation...');
    
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
  }, [store, validateForm, onComplete, navigate, showToast]);
  
  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    if (store.ui.hasUnsavedChanges) {
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
  }, [store, onCancel, navigate]);
  
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
  }, [onComplete, navigate, store]);

  // Get current step info
  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep);
  const currentStepInfo = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  // Get step icon based on step ID
  const getStepIcon = (stepId: string): string => {
    switch (stepId) {
      case 'SECTOR_SELECTION':
        return 'ri-building-line';
      case 'ORGANIZATION_INFO':
        return 'ri-information-line';
      default:
        return 'ri-checkbox-circle-line';
    }
  };

  // Set page title
  useEffect(() => {
    document.title = 'Configuración de Organización | ZentraQMS';
    
    // DEBUG: Add global debug function
    (window as any).debugWizard = {
      getStoreState: () => store,
      logFullState: () => {
        console.log('🎯 WIZARD DEBUG - Unified Store Access:', {
          store: store,
          formData: store.formData,
          validation: store.validation,
          ui: store.ui,
          hasInteracted,
          currentStep,
        });
      },
      testValidation: () => {
        console.log('🧪 Testing validation with current data:');
        const currentData = store.formData;
        console.log('Current form data:', currentData);
        const requiredFields = ['razon_social', 'nit', 'digito_verificacion', 'email_contacto', 'telefono_principal'];
        requiredFields.forEach(field => {
          const value = currentData[field as keyof typeof currentData];
          console.log(`${field}: "${value}" (length: ${String(value).length})`);
        });
      }
    };
  }, [store, hasInteracted, currentStep]);
  
  return (
    <ErrorBoundary>
      <div className={`multi-step-organization-wizard ${className}`}>
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-xl-12 col-lg-12 col-md-12">
              <div className="card shadow-sm border">
                <div className="card-body checkout-tab">
                  <div className="step-arrow-nav mt-n3 mx-n3 mb-3">
                    <ul className="nav nav-pills nav-justified custom-nav" role="tablist">
                      {STEPS.map((step, index) => (
                        <li key={step.id} className="nav-item" role="presentation">
                          <button 
                            className={`nav-link fs-14 p-2 ${index === currentStepIndex ? 'active' : ''}`}
                            type="button" 
                            role="tab"
                            disabled={true}
                            style={{ cursor: 'default' }}
                          >
                            <i className={`${getStepIcon(step.id)} fs-14 p-1 bg-primary-subtle text-primary rounded-circle align-middle me-2`}></i>
                            {step.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Form Content */}
                  <div>
                    {currentStep === 'SECTOR_SELECTION' && (
                      <SectorSelectionStep
                        onSectorSelect={handleSectorSelect}
                        selectedSector={store.formData.sector}
                        selectedOrgType={store.formData.organization_type}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        canProceed={true}
                        isLoading={store.ui.isLoading}
                      />
                    )}

                    {currentStep === 'ORGANIZATION_INFO' && (
                      <div>
                        {/* Sector summary */}
                        <div className="mb-4 p-3 bg-primary-subtle rounded">
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <h6 className="mb-1 text-primary">
                                <i className="ri-check-circle-line me-1"></i>
                                Configuración Seleccionada
                              </h6>
                              <p className="mb-0 text-primary">
                                Sector: <strong>{store.formData.sector}</strong>
                                {store.formData.organization_type && (
                                  <span> • Tipo: <strong>{store.formData.organization_type}</strong></span>
                                )}
                                {store.formData.auto_activated_modules && store.formData.auto_activated_modules.length > 0 && (
                                  <span> • {store.formData.auto_activated_modules.length} módulos activados</span>
                                )}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setCurrentStep('SECTOR_SELECTION')}
                            >
                              <i className="ri-edit-line me-1"></i>
                              Cambiar
                            </button>
                          </div>
                        </div>

                        {/* Logo Upload Section */}
                        <div className="row mb-4">
                          <div className="col-12">
                            <div className="text-center">
                              <h5 className="mb-3">
                                <i className="ri-image-line me-2 text-primary"></i>
                                Logo de la Organización
                              </h5>
                              <LogoUploader
                                value={store.formData.logo}
                                preview={store.formData.logoPreview}
                                onChange={handleLogoUpload}
                                onError={(error) => store.setFieldError('logo', error)}
                                className="mx-auto"
                              />
                              {store.validation.errors.logo && (
                                <div className="text-danger small mt-2">
                                  {store.validation.errors.logo}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Organization Form Section */}
                        <OrganizationFormSection
                          formData={store.formData}
                          validation={store.validation}
                          onChange={handleFieldChange}
                          onNitValidation={handleNitValidation}
                          submitAttempted={store.ui.submitAttempted}
                        />

                        {/* Navigation Buttons */}
                        <div className="row mt-4">
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                              <button
                                type="button"
                                className="btn btn-light btn-label"
                                onClick={handlePrevious}
                                disabled={store.ui.isLoading}
                              >
                                <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>
                                Anterior
                              </button>
                              
                              <button
                                type="button"
                                className="btn btn-primary btn-label"
                                onClick={handleNext}
                                disabled={store.ui.isLoading}
                              >
                                {store.ui.isLoading ? (
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {store.ui.showSuccessModal && (
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
                    Su organización ha sido configurada correctamente en ZentraQMS con {store.formData.auto_activated_modules?.length || 0} módulos activados 
                    ({store.formData.sector ? `${store.formData.sector}${store.formData.organization_type ? ' - ' + store.formData.organization_type : ''}` : 'Multi-sector'}).
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
        {store.ui.isLoading && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-25" style={{ zIndex: 9999 }}>
            <LoadingSpinner size="lg" message="Configurando organización..." />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default MultiStepOrganizationWizard;