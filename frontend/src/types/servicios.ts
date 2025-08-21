/**
 * Types for Servicios de Salud (Health Services) module
 * 
 * This file contains TypeScript interfaces and types for managing
 * health services within health provider facilities.
 */

// ====================================
// ENUMS AND CONSTANTS
// ====================================

export const MODALIDAD_SERVICIO_OPTIONS = [
  { value: 'intramural', label: 'Intramural' },
  { value: 'extramural', label: 'Extramural' },
  { value: 'telemedicina', label: 'Telemedicina' },
  { value: 'atencion_domiciliaria', label: 'Atención Domiciliaria' },
] as const;

export const COMPLEJIDAD_SERVICIO_OPTIONS = [
  { value: 'baja', label: 'Baja Complejidad' },
  { value: 'media', label: 'Mediana Complejidad' },
  { value: 'alta', label: 'Alta Complejidad' },
  { value: 'no_aplica', label: 'No Aplica' },
] as const;

export const ESTADO_SERVICIO_OPTIONS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'suspendido', label: 'Suspendido' },
  { value: 'en_proceso', label: 'En Proceso' },
] as const;

export const CATEGORIA_SERVICIO_OPTIONS = [
  { value: 'apoyo_diagnostico', label: 'Apoyo Diagnóstico y Complementación Terapéutica' },
  { value: 'consulta_externa', label: 'Consulta Externa' },
  { value: 'hospitalizacion', label: 'Hospitalización' },
  { value: 'urgencias', label: 'Urgencias' },
  { value: 'quirurgicos', label: 'Quirúrgicos' },
  { value: 'promocion_prevencion', label: 'Promoción y Prevención' },
  { value: 'medicina_especializada', label: 'Medicina Especializada' },
  { value: 'proteccion_especifica', label: 'Protección Específica' },
  { value: 'deteccion_temprana', label: 'Detección Temprana' },
  { value: 'atencion_parto', label: 'Atención del Parto' },
  { value: 'transporte_asistencial', label: 'Transporte Asistencial' },
] as const;

export type ModalidadServicio = typeof MODALIDAD_SERVICIO_OPTIONS[number]['value'];
export type ComplejidadServicio = typeof COMPLEJIDAD_SERVICIO_OPTIONS[number]['value'];
export type EstadoServicio = typeof ESTADO_SERVICIO_OPTIONS[number]['value'];
export type CategoriaServicio = typeof CATEGORIA_SERVICIO_OPTIONS[number]['value'];

// ====================================
// CORE INTERFACES
// ====================================

/**
 * Interface for ServicioCatalogo (Health Service Catalog)
 */
export interface ServicioCatalogo {
  id: string;
  service_code: string;
  service_name: string;
  service_group_code: string;
  service_group_name: string;
  requires_infrastructure: boolean;
  requires_equipment: boolean;
  requires_human_talent: Record<string, any>;
  allows_ambulatory: boolean;
  allows_hospital: boolean;
  allows_mobile_unit: boolean;
  allows_domiciliary: boolean;
  allows_telemedicine: boolean;
  min_complexity: number;
  max_complexity: number;
  dependent_services: string[];
  dependent_services_count: number;
  standard_requirements: Record<string, any>;
  documentation_required: string[];
  resolution_reference: string;
  is_active: boolean;
  notes: string;
}

/**
 * Interface for SedeHealthService (Health Service per Facility)
 */
export interface SedeHealthService {
  id: string;
  sede: string;
  sede_name: string;
  sede_reps_code: string;
  service_catalog: string;
  service_code: string;
  service_name: string;
  service_category: CategoriaServicio;
  modality: ModalidadServicio;
  complexity: ComplejidadServicio;
  capacity: number;
  status: EstadoServicio;
  
  // Habilitación y fechas
  authorization_date?: string;
  authorization_resolution?: string;
  expiration_date?: string;
  suspension_date?: string;
  suspension_reason?: string;
  
  // Información específica del servicio
  distinctive_feature?: string;
  special_requirements?: string;
  observation?: string;
  
  // Horarios de atención
  operating_hours?: Record<string, any>;
  is_24_hours?: boolean;
  
  // Personal y recursos
  medical_staff_count?: number;
  nursing_staff_count?: number;
  technical_staff_count?: number;
  equipment_list?: string[];
  
  // Metadatos
  is_active: boolean;
  imported_from_file?: boolean;
  import_date?: string;
  last_updated_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Simplified interface for service list views
 */
export interface ServicioListItem {
  id: string;
  service_code: string;
  service_name: string;
  service_category: CategoriaServicio;
  sede_name: string;
  sede_reps_code: string;
  modality: ModalidadServicio;
  complexity: ComplejidadServicio;
  capacity: number;
  status: EstadoServicio;
  authorization_date?: string;
  is_active: boolean;
  created_at: string;
}

// ====================================
// FORM INTERFACES
// ====================================

/**
 * Interface for service creation/update forms
 */
export interface ServicioFormData {
  sede: string;
  service_catalog: string;
  modality: ModalidadServicio;
  complexity?: ComplejidadServicio;
  capacity: number;
  status: EstadoServicio;
  
  // Dates
  authorization_date?: string;
  authorization_resolution?: string;
  expiration_date?: string;
  
  // Service details
  distinctive_feature?: string;
  special_requirements?: string;
  observation?: string;
  
  // Operating hours
  operating_hours?: Record<string, any>;
  is_24_hours?: boolean;
  
  // Staff information
  medical_staff_count?: number;
  nursing_staff_count?: number;
  technical_staff_count?: number;
  
  // Equipment
  equipment_list?: string[];
}

/**
 * Interface for service duplicate form
 */
export interface ServicioDuplicateFormData {
  source_sede_id: string;
  target_sede_ids: string[];
  service_ids: string[];
  duplicate_mode: 'all' | 'selected';
  update_existing: boolean;
  copy_staff_info: boolean;
  copy_operating_hours: boolean;
  copy_equipment: boolean;
}

// ====================================
// API INTERFACES
// ====================================

/**
 * API response for service list
 */
export interface ServicioListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: ServicioListItem[];
}

/**
 * API response for service detail
 */
export interface ServicioDetailResponse extends SedeHealthService {}

/**
 * API response for service catalog
 */
export interface ServicioCatalogoResponse {
  count: number;
  next?: string;
  previous?: string;
  results: ServicioCatalogo[];
}

/**
 * API response for service statistics
 */
export interface ServicioStatisticsResponse {
  total_services: number;
  services_by_status: Record<EstadoServicio, number>;
  services_by_category: Record<CategoriaServicio, number>;
  services_by_complexity: Record<ComplejidadServicio, number>;
  services_by_modality: Record<ModalidadServicio, number>;
  services_by_sede: Array<{
    sede_id: string;
    sede_name: string;
    service_count: number;
  }>;
  total_capacity: number;
  average_capacity_per_service: number;
  services_24_hours: number;
  services_with_authorization: number;
  expired_authorizations: number;
  expiring_soon: number;
}

/**
 * Validation error interface
 */
export interface ServicioValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * API error response
 */
export interface ServicioApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  validation_errors?: ServicioValidationError[];
}

// ====================================
// IMPORT/EXPORT INTERFACES
// ====================================

/**
 * Interface for service import configuration
 */
export interface ServicioImportConfig {
  file: File;
  sede_id?: string;
  validate_only?: boolean;
  update_existing?: boolean;
  create_backup?: boolean;
}

/**
 * Interface for import validation result
 */
export interface ServicioImportValidationResult {
  row_index: number;
  is_valid: boolean;
  data?: Partial<ServicioFormData>;
  errors?: Record<string, string[]>;
  warnings?: string[];
}

/**
 * Interface for import response
 */
export interface ServicioImportResponse {
  success: boolean;
  message?: string;
  imported_count?: number;
  updated_count?: number;
  error_count?: number;
  warning_count?: number;
  services?: ServicioListItem[];
  errors?: Array<{
    row?: number;
    service_code?: string;
    error: string;
  }>;
  warnings?: Array<{
    row?: number;
    service_code?: string;
    warning: string;
  }>;
  validation_results?: ServicioImportValidationResult[];
  total_rows?: number;
  valid_rows?: number;
  invalid_rows?: number;
}

/**
 * Interface for bulk operations
 */
export interface ServicioBulkCreateRequest {
  services: ServicioFormData[];
}

export interface ServicioBulkUpdateRequest {
  updates: Array<Partial<SedeHealthService> & { id: string }>;
}

export interface ServicioBulkDeleteRequest {
  service_ids: string[];
}

export interface ServicioBulkResponse {
  success: boolean;
  message?: string;
  created_count?: number;
  updated_count?: number;
  deleted_count?: number;
  services?: ServicioListItem[];
  errors?: Array<{
    id?: string;
    index?: number;
    service_code?: string;
    errors?: Record<string, string[]>;
    error?: string;
  }>;
}

// ====================================
// FILTER AND SEARCH INTERFACES
// ====================================

/**
 * Interface for service filters
 */
export interface ServicioFilters {
  search?: string;
  sede?: string;
  service_category?: CategoriaServicio;
  modality?: ModalidadServicio;
  complexity?: ComplejidadServicio;
  status?: EstadoServicio;
  is_24_hours?: boolean;
  has_authorization?: boolean;
  authorization_expired?: boolean;
  expiring_soon?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

/**
 * Interface for service statistics
 */
export interface ServicioStatistics {
  total_services: number;
  services_by_status: Record<EstadoServicio, number>;
  services_by_category: Record<CategoriaServicio, number>;
  services_by_complexity: Record<ComplejidadServicio, number>;
  services_by_modality: Record<ModalidadServicio, number>;
  services_by_sede: Array<{
    sede_id: string;
    sede_name: string;
    service_count: number;
  }>;
  total_capacity: number;
  average_capacity_per_service: number;
  services_24_hours: number;
  services_with_authorization: number;
  expired_authorizations: number;
  expiring_soon: number;
}

// ====================================
// COMPONENT PROPS INTERFACES
// ====================================

/**
 * Props for ServicioFormModal component
 */
export interface ServicioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServicioFormData) => Promise<void>;
  servicio?: SedeHealthService;
  isLoading?: boolean;
  errors?: Record<string, string[]>;
  sedeOptions?: Array<{ value: string; label: string }>;
  catalogOptions?: ServicioCatalogo[];
}

/**
 * Props for ServicioDetailModal component
 */
export interface ServicioDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicioId: string | null;
  onEdit?: (servicio: SedeHealthService) => void;
}

/**
 * Props for ServicioDuplicateModal component
 */
export interface ServicioDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServicioDuplicateFormData) => Promise<void>;
  sourceSedeId?: string;
  isLoading?: boolean;
  sedeOptions?: Array<{ value: string; label: string }>;
  serviceOptions?: Array<{ value: string; label: string; category: string }>;
}

/**
 * Props for ServiciosImporter component
 */
export interface ServiciosImporterProps {
  onImportComplete: (result: ServicioImportResponse) => void;
  onCancel: () => void;
  isOpen: boolean;
  sedeOptions?: Array<{ value: string; label: string }>;
}

/**
 * Props for ServiciosTable component
 */
export interface ServiciosTableProps {
  servicios: ServicioListItem[];
  loading?: boolean;
  onEdit: (servicio: ServicioListItem) => void;
  onDelete: (servicio: ServicioListItem) => void;
  onView: (servicio: ServicioListItem) => void;
  selectedServicios?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  filters?: ServicioFilters;
  onFiltersChange?: (filters: ServicioFilters) => void;
}

/**
 * Props for ServicioStats component
 */
export interface ServicioStatsProps {
  statistics: ServicioStatistics;
  loading?: boolean;
  filters?: ServicioFilters;
  onFilterChange?: (filters: ServicioFilters) => void;
}

// ====================================
// STORE INTERFACES
// ====================================

/**
 * Zustand store interface for service management
 */
export interface ServicioStore {
  // State
  servicios: ServicioListItem[];
  currentServicio: SedeHealthService | null;
  serviceCatalog: ServicioCatalogo[];
  statistics: ServicioStatistics | null;
  loading: boolean;
  error: string | null;
  filters: ServicioFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  
  // Actions
  fetchServicios: (filters?: ServicioFilters) => Promise<void>;
  fetchServicioDetail: (servicioId: string) => Promise<SedeHealthService>;
  fetchServiceCatalog: (filters?: { search?: string; category?: CategoriaServicio }) => Promise<void>;
  fetchStatistics: (filters?: ServicioFilters) => Promise<void>;
  createServicio: (data: ServicioFormData) => Promise<SedeHealthService>;
  updateServicio: (servicioId: string, data: Partial<ServicioFormData>) => Promise<SedeHealthService>;
  deleteServicio: (servicioId: string) => Promise<void>;
  
  // Bulk operations
  bulkCreateServicios: (servicios: ServicioFormData[]) => Promise<ServicioBulkResponse>;
  bulkUpdateServicios: (updates: Array<Partial<SedeHealthService> & { id: string }>) => Promise<ServicioBulkResponse>;
  bulkDeleteServicios: (servicioIds: string[]) => Promise<ServicioBulkResponse>;
  duplicateServicios: (data: ServicioDuplicateFormData) => Promise<ServicioBulkResponse>;
  
  // Import/Export
  importServicios: (config: ServicioImportConfig) => Promise<ServicioImportResponse>;
  validateImport: (config: ServicioImportConfig) => Promise<ServicioImportResponse>;
  exportServicios: (format: 'csv' | 'excel', filters?: ServicioFilters) => Promise<Blob>;
  
  // Utilities
  setFilters: (filters: Partial<ServicioFilters>) => void;
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
export type FormValidationState = Record<keyof ServicioFormData, FieldValidation>;

/**
 * Type for table sort configuration
 */
export type TableSortConfig = {
  field: keyof ServicioListItem;
  direction: 'asc' | 'desc';
};

/**
 * Type for modal modes
 */
export type ModalMode = 'create' | 'edit' | 'view' | 'duplicate';

/**
 * Type for import progress
 */
export type ImportProgress = {
  stage: 'uploading' | 'validating' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  currentRow?: number;
  totalRows?: number;
};