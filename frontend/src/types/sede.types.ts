/**
 * Types for Sede Prestadora (Health Service Provider Facilities) module
 * 
 * This file contains TypeScript interfaces and types for managing
 * health service provider facilities within organizations.
 */

// ====================================
// ENUMS AND CONSTANTS
// ====================================

export const ESTADO_SEDE_OPTIONS = [
  { value: 'activa', label: 'Activa' },
  { value: 'inactiva', label: 'Inactiva' },
  { value: 'suspendida', label: 'Suspendida' },
  { value: 'en_proceso', label: 'En Proceso de Habilitación' },
  { value: 'cerrada', label: 'Cerrada Permanentemente' },
] as const;

export const TIPO_SEDE_OPTIONS = [
  { value: 'principal', label: 'Sede Principal' },
  { value: 'sucursal', label: 'Sucursal' },
  { value: 'ambulatoria', label: 'Sede Ambulatoria' },
  { value: 'hospitalaria', label: 'Sede Hospitalaria' },
  { value: 'administrativa', label: 'Sede Administrativa' },
  { value: 'diagnostico', label: 'Centro de Diagnóstico' },
  { value: 'urgencias', label: 'Centro de Urgencias' },
] as const;

export const ESTADO_SERVICIO_OPTIONS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'suspendido', label: 'Suspendido' },
] as const;

export type EstadoSede = typeof ESTADO_SEDE_OPTIONS[number]['value'];
export type TipoSede = typeof TIPO_SEDE_OPTIONS[number]['value'];
export type EstadoServicio = typeof ESTADO_SERVICIO_OPTIONS[number]['value'];

// ====================================
// CORE INTERFACES
// ====================================

/**
 * Interface for SedeServicio (Service per Facility)
 */
export interface SedeServicio {
  id: string;
  servicio: string;
  codigo_servicio: string;
  nombre_servicio: string;
  grupo_servicio: string;
  distintivo: string;
  capacidad_instalada: number;
  fecha_habilitacion?: string;
  estado_servicio: EstadoServicio;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for SedePrestadora (Health Service Provider Facility)
 */
export interface SedePrestadora {
  id: string;
  health_organization: string;
  organization_name: string;
  codigo_prestador_organizacion: string;
  numero_sede: string;
  codigo_prestador: string;
  nombre_sede: string;
  tipo_sede: TipoSede;
  es_sede_principal: boolean;
  
  // Ubicación
  direccion: string;
  departamento: string;
  municipio: string;
  barrio?: string;
  codigo_postal?: string;
  direccion_completa: string;
  latitud?: number;
  longitud?: number;
  
  // Contacto
  telefono_principal: string;
  telefono_secundario?: string;
  email: string;
  
  // Responsable
  nombre_responsable: string;
  cargo_responsable: string;
  telefono_responsable?: string;
  email_responsable?: string;
  
  // Estado y habilitación
  estado: EstadoSede;
  fecha_habilitacion?: string;
  fecha_renovacion?: string;
  
  // Capacidad instalada
  numero_camas: number;
  numero_consultorios: number;
  numero_quirofanos: number;
  
  // Horarios
  horario_atencion: Record<string, any>;
  atencion_24_horas: boolean;
  
  // Servicios y metadata
  servicios_habilitados: SedeServicio[];
  total_servicios: number;
  observaciones?: string;
  
  // Auditoría
  imported_from_file: boolean;
  import_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Simplified interface for sede list views
 * Matches the API response from HeadquarterLocationSerializer
 */
export interface SedeListItem {
  id: string;
  reps_code: string;              // API returns reps_code instead of numero_sede
  name: string;                   // API returns name instead of nombre_sede
  sede_type: string;              // API returns sede_type
  habilitation_status: string;    // API returns habilitation_status instead of estado
  department_name: string;        // API returns department_name instead of departamento
  municipality_name: string;      // API returns municipality_name instead of municipio
  address: string;                // API returns address instead of direccion_completa
  phone_primary: string;          // API returns phone_primary instead of telefono_principal
  email: string;
  services_count: number;         // API returns services_count instead of total_servicios
  is_active: boolean;             // API returns is_active
  organization_name: string;
  created_at: string;
}

// ====================================
// FORM INTERFACES
// ====================================

/**
 * Interface for sede creation/update forms
 */
export interface SedeFormData {
  health_organization?: string;
  numero_sede: string;
  codigo_prestador: string;
  nombre_sede: string;
  tipo_sede: TipoSede;
  es_sede_principal: boolean;
  
  // Ubicación
  direccion: string;
  departamento: string;
  municipio: string;
  barrio?: string;
  codigo_postal?: string;
  latitud?: number;
  longitud?: number;
  
  // Contacto
  telefono_principal: string;
  telefono_secundario?: string;
  email: string;
  
  // Responsable
  nombre_responsable: string;
  cargo_responsable: string;
  telefono_responsable?: string;
  email_responsable?: string;
  
  // Estado y habilitación
  estado: EstadoSede;
  fecha_habilitacion?: string;
  fecha_renovacion?: string;
  
  // Capacidad instalada
  numero_camas: number;
  numero_consultorios: number;
  numero_quirofanos: number;
  
  // Horarios
  horario_atencion: Record<string, any>;
  atencion_24_horas: boolean;
  
  // Metadata
  observaciones?: string;
}

/**
 * Interface for sede servicio form data
 */
export interface SedeServicioFormData {
  servicio_id: string;
  distintivo: string;
  capacidad_instalada: number;
  fecha_habilitacion?: string;
  observaciones?: string;
}

// ====================================
// API INTERFACES
// ====================================

/**
 * API response for sede list
 */
export interface SedeListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: SedeListItem[];
}

/**
 * API response for sede detail
 */
export interface SedeDetailResponse extends SedePrestadora {}

/**
 * Validation error interface
 */
export interface SedeValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * API error response
 */
export interface SedeApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  validation_errors?: SedeValidationError[];
}

// ====================================
// IMPORT/EXPORT INTERFACES
// ====================================

/**
 * Interface for sede import configuration
 */
export interface SedeImportConfig {
  file: File;
  create_backup?: boolean; // Optional, defaults to true
}

/**
 * Interface for import validation result
 */
export interface SedeImportValidationResult {
  row_index: number;
  is_valid: boolean;
  data?: Partial<SedeFormData>;
  errors?: Record<string, string[]>;
}

/**
 * Interface for import response
 */
export interface SedeImportResponse {
  success: boolean;
  message?: string;
  imported_count?: number;
  error_count?: number;
  sedes?: SedeListItem[];
  errors?: Array<{
    row?: number;
    numero_sede?: string;
    error: string;
  }>;
  validation_results?: SedeImportValidationResult[];
  total_rows?: number;
  valid_rows?: number;
  invalid_rows?: number;
}

/**
 * Interface for bulk operations
 */
export interface SedeBulkCreateRequest {
  sedes: SedeFormData[];
}

export interface SedeBulkUpdateRequest {
  updates: Array<Partial<SedePrestadora> & { id: string }>;
}

export interface SedeBulkDeleteRequest {
  sede_ids: string[];
}

export interface SedeBulkResponse {
  success: boolean;
  message?: string;
  created_count?: number;
  updated_count?: number;
  deleted_count?: number;
  sedes?: SedeListItem[];
  errors?: Array<{
    id?: string;
    index?: number;
    numero_sede?: string;
    errors?: Record<string, string[]>;
    error?: string;
  }>;
}

// ====================================
// FILTER AND SEARCH INTERFACES
// ====================================

/**
 * Interface for sede filters
 */
export interface SedeFilters {
  search?: string;
  estado?: EstadoSede;
  tipo_sede?: TipoSede;
  departamento?: string;
  municipio?: string;
  es_sede_principal?: boolean;
  atencion_24_horas?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

/**
 * Interface for sede statistics
 */
export interface SedeStatistics {
  total_sedes: number;
  sedes_activas: number;
  sedes_principales: number;
  total_servicios: number;
  sedes_por_estado: Record<EstadoSede, number>;
  sedes_por_tipo: Record<TipoSede, number>;
  sedes_por_departamento: Record<string, number>;
}

// ====================================
// COMPONENT PROPS INTERFACES
// ====================================

/**
 * Props for SedeFormModal component
 */
export interface SedeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SedeFormData) => Promise<void>;
  sede?: SedePrestadora;
  organizationId: string;
  isLoading?: boolean;
  errors?: Record<string, string[]>;
}

/**
 * Props for SedesTable component
 */
export interface SedesTableProps {
  sedes: SedeListItem[];
  loading?: boolean;
  onEdit: (sede: SedeListItem) => void;
  onDelete: (sede: SedeListItem) => void;
  onViewServices: (sede: SedeListItem) => void;
  selectedSedes?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  filters?: SedeFilters;
  onFiltersChange?: (filters: SedeFilters) => void;
}

/**
 * Props for SedesImporter component
 */
export interface SedesImporterProps {
  organizationId: string;
  onImportComplete: (result: SedeImportResponse) => void;
  onCancel: () => void;
  isOpen: boolean;
}

/**
 * Props for main sedes management component
 */
export interface SedesManagementProps {
  organizationId: string;
  readonly?: boolean;
  onSedeCreate?: (sede: SedePrestadora) => void;
  onSedeUpdate?: (sede: SedePrestadora) => void;
  onSedeDelete?: (sedeId: string) => void;
}

// ====================================
// STORE INTERFACES
// ====================================

/**
 * Zustand store interface for sede management
 */
export interface SedeStore {
  // State
  sedes: SedeListItem[];
  currentSede: SedePrestadora | null;
  loading: boolean;
  error: string | null;
  filters: SedeFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  
  // Actions
  fetchSedes: (organizationId: string, filters?: SedeFilters) => Promise<void>;
  fetchSedeDetail: (sedeId: string) => Promise<SedePrestadora>;
  createSede: (organizationId: string, data: SedeFormData) => Promise<SedePrestadora>;
  updateSede: (sedeId: string, data: Partial<SedeFormData>) => Promise<SedePrestadora>;
  deleteSede: (sedeId: string) => Promise<void>;
  
  // Bulk operations
  bulkCreateSedes: (organizationId: string, sedes: SedeFormData[]) => Promise<SedeBulkResponse>;
  bulkUpdateSedes: (updates: Array<Partial<SedePrestadora> & { id: string }>) => Promise<SedeBulkResponse>;
  bulkDeleteSedes: (sedeIds: string[]) => Promise<SedeBulkResponse>;
  
  // Import/Export
  importSedes: (organizationId: string, config: SedeImportConfig) => Promise<SedeImportResponse>;
  validateImport: (organizationId: string, config: SedeImportConfig) => Promise<SedeImportResponse>;
  exportSedes: (organizationId: string, format: 'csv' | 'excel', includeServices?: boolean) => Promise<Blob>;
  
  // Utilities
  setFilters: (filters: Partial<SedeFilters>) => void;
  clearError: () => void;
  reset: () => void;
}

// ====================================
// UTILITY TYPES
// ====================================

/**
 * Type for form field validation
 */
export type FieldValidation = {
  isValid: boolean;
  message?: string;
};

/**
 * Type for form validation state
 */
export type FormValidationState = Record<keyof SedeFormData, FieldValidation>;

/**
 * Type for table sort configuration
 */
export type TableSortConfig = {
  field: keyof SedeListItem;
  direction: 'asc' | 'desc';
};

/**
 * Type for modal modes
 */
export type ModalMode = 'create' | 'edit' | 'view';