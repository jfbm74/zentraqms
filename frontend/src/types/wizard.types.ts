/**
 * TypeScript interfaces for the simplified organization wizard.
 * Defines all data structures, API responses, and component props.
 */

// Multi-Sector Types
export type SectorType = 'HEALTHCARE' | 'MANUFACTURING' | 'SERVICES' | 'EDUCATION';

export interface SectorConfig {
  autoActivatedModules: string[];
  requiredFields: string[];
  optionalFields: string[];
  integrations: string[];
}

export interface HealthcareDetails {
  repsCode?: string;
  ipsType?: 'IPS' | 'ESE' | 'EPS';
  complexityLevel?: 'BAJA' | 'MEDIA' | 'ALTA';
  accreditationStatus?: string;
  services?: string[];
}

export interface ManufacturingDetails {
  industryType?: string;
  isoCertifications?: string[];
  productionCapacity?: string;
  mainProducts?: string[];
}

export interface ServicesDetails {
  serviceType?: string;
  clientTypes?: string[];
  serviceAreas?: string[];
}

export interface EducationDetails {
  educationType?: string;
  studentCapacity?: number;
  accreditationLevel?: string;
}

export type SectorDetails = HealthcareDetails | ManufacturingDetails | ServicesDetails | EducationDetails;

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
  
  // Multi-sector fields
  sector: SectorType;
  organization_type: string;
  enabled_modules: string[];
  sector_config: SectorConfig;
  sector_details?: SectorDetails;
  setup_completed: boolean;
  
  created_at: string;
  updated_at: string;
}

// Form Data Structure
export interface OrganizationFormData {
  // ✅ NUEVO: Sector Selection (compatible con backend)
  selectedSector?: SectorType;
  selectedOrgType?: string;
  
  // Legacy fields (mantenidos por compatibilidad)
  sector?: SectorType;
  organization_type?: string;
  
  // Basic Info (Step 2)
  razon_social: string;
  nit: string;
  digito_verificacion: string;
  
  // Contact Info
  email_contacto: string;
  telefono_principal: string;
  website: string;
  
  // Additional Info
  descripcion: string;
  
  // Classification fields
  tipo_organizacion?: string;
  sector_economico?: string;
  tamaño_empresa?: string;
  fecha_fundacion?: string;
  
  // Logo
  logo?: File | null;
  logoPreview?: string;
  
  // Multi-sector specific data
  sector_details?: SectorDetails;
  selected_modules?: string[];
  auto_activated_modules?: string[];
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
  // Sector fields
  sector: undefined,
  organization_type: undefined,
  
  // Basic fields
  razon_social: '',
  nit: '',
  digito_verificacion: '',
  email_contacto: '',
  telefono_principal: '',
  website: '',
  descripcion: '',
  logo: null,
  logoPreview: '',
  
  // Classification fields
  tipo_organizacion: '',
  sector_economico: '',
  tamaño_empresa: '',
  fecha_fundacion: '',
  
  // Multi-sector fields
  sector_details: undefined,
  selected_modules: [],
  auto_activated_modules: [],
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

// Multi-Sector Configuration
export interface SectorInfo {
  id: SectorType;
  name: string;
  icon: string;
  description: string;
  types: Array<{ value: string; label: string; }>;
  modules: string[];
  integrations: string[];
}

export const SECTORS: SectorInfo[] = [
  {
    id: 'HEALTHCARE',
    name: 'Salud',
    icon: 'ri-hospital-line',
    description: 'Instituciones de salud, clínicas, hospitales',
    types: [
      { value: 'ips', label: 'IPS - Institución Prestadora de Salud' },
      { value: 'eps', label: 'EPS - Entidad Promotora de Salud' },
      { value: 'hospital', label: 'Hospital' },
      { value: 'clinica', label: 'Clínica' },
      { value: 'centro_medico', label: 'Centro Médico' },
      { value: 'laboratorio', label: 'Laboratorio' }
    ],
    modules: ['SUH', 'PAMEC', 'Seguridad del Paciente', 'RIPS'],
    integrations: ['REPS', 'SISPRO', 'ADRES']
  },
  {
    id: 'MANUFACTURING',
    name: 'Manufactura',
    icon: 'ri-settings-3-line',
    description: 'Empresas de producción y manufactura',
    types: [
      { value: 'empresa_privada', label: 'Empresa Privada' },
      { value: 'empresa_publica', label: 'Empresa Pública' },
      { value: 'mixta', label: 'Mixta' },
      { value: 'cooperativa', label: 'Cooperativa' }
    ],
    modules: ['Producción', 'Control Calidad', 'Inventarios'],
    integrations: ['ISO 9001', 'ISO 14001', 'HACCP']
  },
  {
    id: 'SERVICES',
    name: 'Servicios',
    icon: 'ri-service-line',
    description: 'Empresas de servicios profesionales',
    types: [
      { value: 'empresa_privada', label: 'Empresa Privada' },
      { value: 'empresa_publica', label: 'Empresa Pública' },
      { value: 'mixta', label: 'Mixta' },
      { value: 'fundacion', label: 'Fundación' },
      { value: 'ong', label: 'ONG' },
      { value: 'cooperativa', label: 'Cooperativa' }
    ],
    modules: ['Proyectos', 'Satisfacción Cliente', 'SLA'],
    integrations: ['ITIL', 'ISO 27001', 'COBIT']
  },
  {
    id: 'EDUCATION',
    name: 'Educación',
    icon: 'ri-school-line',
    description: 'Instituciones educativas',
    types: [
      { value: 'universidad', label: 'Universidad' },
      { value: 'institucion_educativa', label: 'Institución Educativa' },
      { value: 'empresa_privada', label: 'Centro de Capacitación Privado' },
      { value: 'fundacion', label: 'Fundación Educativa' }
    ],
    modules: ['Gestión Académica', 'Evaluación', 'Investigación'],
    integrations: ['SNIES', 'MEN', 'ICFES']
  }
];

// ✅ Mapeo de frontend a backend
export const SECTOR_MAPPING: Record<SectorType, string> = {
  'HEALTHCARE': 'salud',
  'MANUFACTURING': 'manufactura', 
  'SERVICES': 'servicios',
  'EDUCATION': 'educacion',
};

// ✅ Función utilitaria para mapear sector del frontend al backend
export function mapSectorToBackend(frontendSector: SectorType): string {
  return SECTOR_MAPPING[frontendSector] || 'otro';
}

// ✅ Función utilitaria para mapear tipo de organización (ya están en formato correcto)
export function mapOrgTypeToBackend(orgType: string): string {
  return orgType.toLowerCase();
}

// Module categories - Define first to avoid temporal dead zone
export const TRANSVERSAL_MODULES = {
  // Operaciones Diarias - Aplicables a todos los sectores
  DAILY_OPERATIONS: [
    'DASHBOARD', 'NONCONFORMITIES', 'AUDITS', 'IMPROVEMENT_PLANS', 'CAPAS', 'ORGANIZATION'
  ],
  
  // Gestión de Calidad - Aplicables a todos los sectores  
  QUALITY_MANAGEMENT: [
    'PROCESSES', 'ANALYSIS', 'DOCUMENTATION', 'COMMITTEES', 'STRATEGIC_PLANNING'
  ],
  
  // Configuración - Aplicables a todos los sectores
  CONFIGURATION: [
    'ADMINISTRATION', 'USERS', 'ROLES', 'PERMISSIONS'
  ]
};

// Helper function to get all transversal modules
const getTransversalModules = () => [
  ...TRANSVERSAL_MODULES.DAILY_OPERATIONS,
  ...TRANSVERSAL_MODULES.QUALITY_MANAGEMENT,
  ...TRANSVERSAL_MODULES.CONFIGURATION
];

// Auto-activation rules based on sector and organization type
// All organizations get transversal modules + sector-specific modules
export const AUTO_ACTIVATION_RULES: Record<SectorType, Record<string, string[]>> = {
  'HEALTHCARE': {
    'IPS': [
      ...getTransversalModules(),
      'SUH', 'PAMEC', 'CLINICAL_SAFETY'
    ],
    'EPS': [
      ...getTransversalModules(),
      'MEMBER_MANAGEMENT', 'AUTHORIZATION'
    ],
    'ESE': [
      ...getTransversalModules(),
      'SUH', 'PAMEC', 'PUBLIC_HEALTH'
    ]
  },
  'MANUFACTURING': {
    'FOOD': [
      ...getTransversalModules(),
      'PRODUCTION', 'QUALITY_CONTROL', 'FOOD_SAFETY'
    ],
    'PHARMA': [
      ...getTransversalModules(),
      'PRODUCTION', 'GMP', 'PHARMACOVIGILANCE'
    ],
    'TEXTILE': [
      ...getTransversalModules(),
      'PRODUCTION', 'QUALITY_CONTROL', 'INVENTORY'
    ],
    'AUTOMOTIVE': [
      ...getTransversalModules(),
      'PRODUCTION', 'QUALITY_CONTROL', 'ISO_TS'
    ],
    'GENERAL': [
      ...getTransversalModules(),
      'PRODUCTION', 'QUALITY_CONTROL'
    ]
  },
  'SERVICES': {
    'IT': [
      ...getTransversalModules(),
      'PROJECTS', 'SLA', 'IT_SERVICE_MANAGEMENT'
    ],
    'CONSULTING': [
      ...getTransversalModules(),
      'PROJECTS', 'CLIENT_SATISFACTION'
    ],
    'FINANCIAL': [
      ...getTransversalModules(),
      'RISK_MANAGEMENT', 'COMPLIANCE'
    ],
    'SERVICES_GENERAL': [
      ...getTransversalModules(),
      'PROJECTS'
    ]
  },
  'EDUCATION': {
    'UNIVERSITY': [
      ...getTransversalModules(),
      'ACADEMIC', 'RESEARCH', 'ACCREDITATION'
    ],
    'SCHOOL': [
      ...getTransversalModules(),
      'ACADEMIC', 'STUDENTS', 'EVALUATION'
    ],
    'INSTITUTE': [
      ...getTransversalModules(),
      'ACADEMIC', 'TRAINING', 'CERTIFICATION'
    ],
    'TRAINING': [
      ...getTransversalModules(),
      'TRAINING', 'CERTIFICATION'
    ]
  }
};

export const SECTOR_SPECIFIC_MODULES = {
  HEALTHCARE: [
    'SUH', 'PAMEC', 'CLINICAL_SAFETY', 'ACCREDITATION', 'RIPS', 'CLINICAL_RISK'
  ],
  
  MANUFACTURING: [
    'PRODUCTION', 'QUALITY_CONTROL', 'INVENTORY', 'MAINTENANCE', 'INDUSTRIAL_SAFETY'
  ],
  
  SERVICES: [
    'PROJECTS', 'SLA', 'CLIENT_SATISFACTION', 'IT_SERVICE_MANAGEMENT'
  ],
  
  EDUCATION: [
    'ACADEMIC', 'STUDENTS', 'EVALUATION', 'RESEARCH'
  ]
};