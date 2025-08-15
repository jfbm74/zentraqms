/**
 * TypeScript interfaces for the simplified organization wizard.
 * Defines all data structures, API responses, and component props.
 */

// Core Organization Types
export interface Organization {
  id: string;
  razon_social: string;
  nit: string;
  digito_verificacion: string;
  nit_completo: string;
  email_contacto: string;
  telefono_principal: string;
  website?: string;
  descripcion?: string;
  logo?: string; // URL to logo
  created_at: string;
  updated_at: string;
}

// Form Data Structure
export interface OrganizationFormData {
  // Basic Info
  razon_social: string;
  nit: string;
  digito_verificacion: string;
  
  // Contact Info
  email_contacto: string;
  telefono_principal: string;
  website: string;
  
  // Additional Info
  descripcion: string;
  
  // Logo
  logo?: File | null;
  logoPreview?: string;
}

// DIVIPOLA Types
export interface Department {
  code: string;
  name: string;
  capital: string;
}

export interface Municipality {
  code: string;
  name: string;
  department_code: string;
  department_name?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface NitValidationResponse {
  success: boolean;
  data: {
    nit: string;
    is_available: boolean;
    message: string;
  };
}

export interface OrganizationSummary {
  id: string;
  razon_social: string;
  nit_completo: string;
  email_contacto: string;
  telefono_principal: string;
  website?: string;
  descripcion?: string;
  logo_url?: string;
  fecha_creacion?: string;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface FormValidationState {
  errors: Record<string, string>;
  warnings: Record<string, string>;
  isValidating: boolean;
  nitAvailable: boolean | null;
}

// UI State Types
export interface WizardUIState {
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  showSuccessModal: boolean;
  submitAttempted: boolean;
}

// Cache Types
export interface WizardCacheState {
  departments: Department[];
  municipalities: Record<string, Municipality[]>;
}

// Error Types
export interface ErrorInfo {
  type: 'validation' | 'network' | 'server' | 'authentication' | 'authorization' | 'conflict' | 'business_logic' | 'unknown';
  message: string;
  errors?: Record<string, string[]>;
  retryable: boolean;
  action?: 'redirect_login' | 'retry' | 'reload';
}

// Component Props Types
export interface LogoUploaderProps {
  value?: File | null;
  preview?: string;
  onChange: (file: File | null) => void;
  onError: (error: string) => void;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  className?: string;
}

export interface DivipolaSelectorProps {
  departmentValue: string;
  municipalityValue: string;
  onDepartmentChange: (code: string) => void;
  onMunicipalityChange: (code: string) => void;
  departments: Department[];
  municipalities: Municipality[];
  isLoadingMunicipalities?: boolean;
  errors?: {
    department?: string;
    municipality?: string;
  };
  className?: string;
}

export interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: 'text' | 'email' | 'tel' | 'url' | 'textarea';
  placeholder?: string;
  error?: string;
  warning?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  helpText?: string;
  className?: string;
}

export interface ValidationFieldProps extends FormFieldProps {
  onValidate?: (field: string, value: string) => Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

// Hook Types
export interface UseFormValidationReturn {
  validateField: (field: string, value: string) => Promise<ValidationResult>;
  validateForm: (data: OrganizationFormData) => Promise<boolean>;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
}

export interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  forceSave: () => Promise<void>;
  clearDraft: () => void;
}

// Store Types
export interface OrganizationWizardStore {
  // State
  formData: OrganizationFormData;
  validation: FormValidationState;
  ui: WizardUIState;
  cache: WizardCacheState;
  
  // Form Actions
  updateField: (field: keyof OrganizationFormData, value: any) => void;
  updateMultipleFields: (fields: Partial<OrganizationFormData>) => void;
  uploadLogo: (file: File) => void;
  removeLogo: () => void;
  resetForm: () => void;
  
  // Validation Actions
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  setFieldWarning: (field: string, warning: string) => void;
  clearFieldWarning: (field: string) => void;
  setValidating: (isValidating: boolean) => void;
  setNitAvailable: (available: boolean | null) => void;
  
  // API Actions
  validateNit: (nit: string) => Promise<boolean>;
  createOrganization: () => Promise<Organization>;
  
  // Location Actions
  loadDepartments: () => Promise<void>;
  loadMunicipalities: (departmentCode: string) => Promise<void>;
  searchMunicipalities: (query: string, departmentCode?: string) => Promise<Municipality[]>;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setLastSaved: (date: Date | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  showSuccess: () => void;
  hideSuccess: () => void;
  setSubmitAttempted: (attempted: boolean) => void;
  
  // Draft Actions
  loadDraft: () => void;
  saveDraft: () => void;
  clearDraft: () => void;
}

// Utility Types
export type FormFieldKey = keyof OrganizationFormData;

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Constants
export const DEFAULT_FORM_DATA: OrganizationFormData = {
  razon_social: '',
  nit: '',
  digito_verificacion: '',
  email_contacto: '',
  telefono_principal: '',
  website: '',
  descripcion: '',
  logo: null,
  logoPreview: '',
};

export const VALIDATION_DELAYS = {
  NIT: 800,
  EMAIL: 600,
  PHONE: 500,
  DEFAULT: 400,
} as const;

export const LOGO_CONSTRAINTS = {
  MAX_SIZE_MB: 5,
  MIN_DIMENSIONS: { width: 200, height: 200 },
  MAX_DIMENSIONS: { width: 2000, height: 2000 },
  ACCEPTED_FORMATS: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
} as const;

export const FORM_FIELD_LIMITS = {
  RAZON_SOCIAL: { min: 3, max: 200 },
  NIT: { min: 9, max: 10 },
  EMAIL: { max: 100 },
  PHONE: { min: 7, max: 15 },
  WEBSITE: { max: 200 },
  DESCRIPCION: { max: 1000 },
} as const;