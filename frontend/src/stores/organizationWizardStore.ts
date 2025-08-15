/**
 * Zustand store for the simplified organization wizard.
 * Manages form state, validation, UI state, and API interactions.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  OrganizationWizardStore,
  OrganizationFormData,
  FormValidationState,
  WizardUIState,
  WizardCacheState,
  DEFAULT_FORM_DATA,
  Organization,
  Department,
  Municipality,
} from '../types/wizard.types';
import { OrganizationApiService, DivipolaApiService, WizardApiErrorHandler } from '../services/wizardApiService';

// Initial state
const initialFormData: OrganizationFormData = { ...DEFAULT_FORM_DATA };

const initialValidationState: FormValidationState = {
  errors: {},
  warnings: {},
  isValidating: false,
  nitAvailable: null,
};

const initialUIState: WizardUIState = {
  isLoading: false,
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  showSuccessModal: false,
  submitAttempted: false,
};

const initialCacheState: WizardCacheState = {
  departments: [],
  municipalities: {},
};

// Local storage keys
const DRAFT_STORAGE_KEY = 'wizard_draft_data';
const LAST_SAVED_KEY = 'wizard_last_saved';

/**
 * Organization Wizard Store
 */
export const useOrganizationWizardStore = create<OrganizationWizardStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        formData: initialFormData,
        validation: initialValidationState,
        ui: initialUIState,
        cache: initialCacheState,

        // Form Actions
        updateField: (field, value) => {
          set((state) => ({
            formData: {
              ...state.formData,
              [field]: value,
            },
            ui: {
              ...state.ui,
              hasUnsavedChanges: true,
            },
            validation: {
              ...state.validation,
              errors: {
                ...state.validation.errors,
                [field]: '', // Clear error when user starts typing
              },
            },
          }));
        },

        updateMultipleFields: (fields) => {
          set((state) => ({
            formData: {
              ...state.formData,
              ...fields,
            },
            ui: {
              ...state.ui,
              hasUnsavedChanges: true,
            },
          }));
        },

        uploadLogo: (file) => {
          // Create preview URL
          const preview = URL.createObjectURL(file);
          
          set((state) => ({
            formData: {
              ...state.formData,
              logo: file,
              logoPreview: preview,
            },
            ui: {
              ...state.ui,
              hasUnsavedChanges: true,
            },
            validation: {
              ...state.validation,
              errors: {
                ...state.validation.errors,
                logo: '', // Clear logo error
              },
            },
          }));
        },

        removeLogo: () => {
          const { logoPreview } = get().formData;
          
          // Cleanup preview URL
          if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
          }
          
          set((state) => ({
            formData: {
              ...state.formData,
              logo: null,
              logoPreview: '',
            },
            ui: {
              ...state.ui,
              hasUnsavedChanges: true,
            },
          }));
        },

        resetForm: () => {
          const { logoPreview } = get().formData;
          
          // Cleanup preview URL
          if (logoPreview) {
            URL.revokeObjectURL(logoPreview);
          }
          
          set({
            formData: { ...initialFormData },
            validation: { ...initialValidationState },
            ui: { ...initialUIState },
          });
        },

        // Validation Actions
        setFieldError: (field, error) => {
          set((state) => ({
            validation: {
              ...state.validation,
              errors: {
                ...state.validation.errors,
                [field]: error,
              },
            },
          }));
        },

        clearFieldError: (field) => {
          set((state) => ({
            validation: {
              ...state.validation,
              errors: {
                ...state.validation.errors,
                [field]: '',
              },
            },
          }));
        },

        setFieldWarning: (field, warning) => {
          set((state) => ({
            validation: {
              ...state.validation,
              warnings: {
                ...state.validation.warnings,
                [field]: warning,
              },
            },
          }));
        },

        clearFieldWarning: (field) => {
          set((state) => ({
            validation: {
              ...state.validation,
              warnings: {
                ...state.validation.warnings,
                [field]: '',
              },
            },
          }));
        },

        setValidating: (isValidating) => {
          set((state) => ({
            validation: {
              ...state.validation,
              isValidating,
            },
          }));
        },

        setNitAvailable: (available) => {
          set((state) => ({
            validation: {
              ...state.validation,
              nitAvailable: available,
            },
          }));
        },

        // API Actions
        validateNit: async (nit) => {
          const store = get();
          
          if (!nit || nit.length < 9) {
            store.setNitAvailable(null);
            return false;
          }
          
          try {
            store.setValidating(true);
            const result = await OrganizationApiService.validateNit(nit);
            
            store.setNitAvailable(result.available);
            
            if (!result.available) {
              store.setFieldError('nit', result.message);
            } else {
              store.clearFieldError('nit');
            }
            
            return result.available;
          } catch (error) {
            const errorInfo = WizardApiErrorHandler.handle(error);
            store.setFieldError('nit', errorInfo.message);
            store.setNitAvailable(null);
            return false;
          } finally {
            store.setValidating(false);
          }
        },

        createOrganization: async () => {
          const store = get();
          
          try {
            store.setLoading(true);
            store.setSubmitAttempted(true);
            
            const organization = await OrganizationApiService.create(store.formData);
            
            // Clear draft after successful creation
            store.clearDraft();
            store.setHasUnsavedChanges(false);
            
            return organization;
          } catch (error) {
            const errorInfo = WizardApiErrorHandler.handle(error);
            
            // Set field-specific errors if available
            if (errorInfo.errors) {
              Object.entries(errorInfo.errors).forEach(([field, errors]) => {
                const errorMessage = Array.isArray(errors) ? errors[0] : String(errors);
                store.setFieldError(field, errorMessage);
              });
            }
            
            throw new Error(errorInfo.message);
          } finally {
            store.setLoading(false);
          }
        },

        // Location Actions
        loadDepartments: async () => {
          const store = get();
          
          try {
            const departments = await DivipolaApiService.getDepartments();
            
            set((state) => ({
              cache: {
                ...state.cache,
                departments,
              },
            }));
          } catch (error) {
            console.error('Error loading departments:', error);
            // Could show a toast notification here
          }
        },

        loadMunicipalities: async (departmentCode) => {
          const store = get();
          
          try {
            const municipalities = await DivipolaApiService.getMunicipalities(departmentCode);
            
            set((state) => ({
              cache: {
                ...state.cache,
                municipalities: {
                  ...state.cache.municipalities,
                  [departmentCode]: municipalities,
                },
              },
            }));
          } catch (error) {
            console.error('Error loading municipalities:', error);
            // Could show a toast notification here
          }
        },

        searchMunicipalities: async (query, departmentCode) => {
          try {
            return await DivipolaApiService.searchMunicipalities(query, departmentCode);
          } catch (error) {
            console.error('Error searching municipalities:', error);
            return [];
          }
        },

        // UI Actions
        setLoading: (loading) => {
          set((state) => ({
            ui: {
              ...state.ui,
              isLoading: loading,
            },
          }));
        },

        setSaving: (saving) => {
          set((state) => ({
            ui: {
              ...state.ui,
              isSaving: saving,
            },
          }));
        },

        setLastSaved: (date) => {
          set((state) => ({
            ui: {
              ...state.ui,
              lastSaved: date,
            },
          }));
          
          // Save to localStorage
          if (date) {
            localStorage.setItem(LAST_SAVED_KEY, date.toISOString());
          } else {
            localStorage.removeItem(LAST_SAVED_KEY);
          }
        },

        setHasUnsavedChanges: (hasChanges) => {
          set((state) => ({
            ui: {
              ...state.ui,
              hasUnsavedChanges: hasChanges,
            },
          }));
        },

        showSuccess: () => {
          set((state) => ({
            ui: {
              ...state.ui,
              showSuccessModal: true,
            },
          }));
        },

        hideSuccess: () => {
          set((state) => ({
            ui: {
              ...state.ui,
              showSuccessModal: false,
            },
          }));
        },

        setSubmitAttempted: (attempted) => {
          set((state) => ({
            ui: {
              ...state.ui,
              submitAttempted: attempted,
            },
          }));
        },

        // Draft Actions
        loadDraft: () => {
          try {
            const draftData = localStorage.getItem(DRAFT_STORAGE_KEY);
            const lastSavedStr = localStorage.getItem(LAST_SAVED_KEY);
            
            if (draftData) {
              const parsedData = JSON.parse(draftData);
              
              set((state) => ({
                formData: {
                  ...state.formData,
                  ...parsedData,
                  logo: null, // Don't restore file objects
                  logoPreview: '', // Don't restore preview URLs
                },
                ui: {
                  ...state.ui,
                  hasUnsavedChanges: false,
                  lastSaved: lastSavedStr ? new Date(lastSavedStr) : null,
                },
              }));
            }
          } catch (error) {
            console.error('Error loading draft:', error);
          }
        },

        saveDraft: () => {
          const { formData } = get();
          
          try {
            // Save form data without file objects
            const dataToSave = {
              ...formData,
              logo: null, // Don't save file objects
              logoPreview: '', // Don't save preview URLs
            };
            
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(dataToSave));
            
            const now = new Date();
            get().setLastSaved(now);
            get().setHasUnsavedChanges(false);
          } catch (error) {
            console.error('Error saving draft:', error);
          }
        },

        clearDraft: () => {
          try {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            localStorage.removeItem(LAST_SAVED_KEY);
            
            set((state) => ({
              ui: {
                ...state.ui,
                lastSaved: null,
                hasUnsavedChanges: false,
              },
            }));
          } catch (error) {
            console.error('Error clearing draft:', error);
          }
        },
      }),
      {
        name: 'organization-wizard-store',
        // Only persist cache data, not form data (that's handled separately)
        partialize: (state) => ({
          cache: state.cache,
        }),
      }
    ),
    {
      name: 'organization-wizard-store',
    }
  )
);

/**
 * Selectors for specific store slices
 */
export const useFormData = () => useOrganizationWizardStore((state) => state.formData);
export const useValidation = () => useOrganizationWizardStore((state) => state.validation);
export const useUIState = () => useOrganizationWizardStore((state) => state.ui);
export const useCache = () => useOrganizationWizardStore((state) => state.cache);

/**
 * Action selectors
 */
export const useFormActions = () => useOrganizationWizardStore((state) => ({
  updateField: state.updateField,
  updateMultipleFields: state.updateMultipleFields,
  uploadLogo: state.uploadLogo,
  removeLogo: state.removeLogo,
  resetForm: state.resetForm,
}));

export const useValidationActions = () => useOrganizationWizardStore((state) => ({
  setFieldError: state.setFieldError,
  clearFieldError: state.clearFieldError,
  setFieldWarning: state.setFieldWarning,
  clearFieldWarning: state.clearFieldWarning,
  setValidating: state.setValidating,
  setNitAvailable: state.setNitAvailable,
  validateNit: state.validateNit,
}));

export const useApiActions = () => useOrganizationWizardStore((state) => ({
  createOrganization: state.createOrganization,
  loadDepartments: state.loadDepartments,
  loadMunicipalities: state.loadMunicipalities,
  searchMunicipalities: state.searchMunicipalities,
}));

export const useUIActions = () => useOrganizationWizardStore((state) => ({
  setLoading: state.setLoading,
  setSaving: state.setSaving,
  setLastSaved: state.setLastSaved,
  setHasUnsavedChanges: state.setHasUnsavedChanges,
  showSuccess: state.showSuccess,
  hideSuccess: state.hideSuccess,
  setSubmitAttempted: state.setSubmitAttempted,
}));

export const useDraftActions = () => useOrganizationWizardStore((state) => ({
  loadDraft: state.loadDraft,
  saveDraft: state.saveDraft,
  clearDraft: state.clearDraft,
}));