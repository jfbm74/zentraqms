/**
 * TypeScript definitions for Capacity Management
 * 
 * These types correspond to the backend API models for REPS capacity management.
 * Based on Colombian healthcare capacity regulations (Resolution 3100/2019).
 */

// ====================================
// ENUMS AND CONSTANTS
// ====================================

export const GRUPO_CAPACIDAD_CHOICES = {
  CAMAS: 'CAMAS',
  CAMILLAS: 'CAMILLAS',
  CONSULTORIOS: 'CONSULTORIOS',
  SALAS: 'SALAS',
} as const;

export const ESTADO_CAPACIDAD_CHOICES = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  EN_MANTENIMIENTO: 'EN_MANTENIMIENTO',
  FUERA_DE_SERVICIO: 'FUERA_DE_SERVICIO',
} as const;

export const MODALIDADES_AMBULANCIA = {
  BASICA: 'BASICA',
  MEDICALIZADA: 'MEDICALIZADA',
  TRANSPORTE_ASISTENCIAL: 'TRANSPORTE_ASISTENCIAL',
} as const;

export type GrupoCapacidad = keyof typeof GRUPO_CAPACIDAD_CHOICES;
export type EstadoCapacidad = keyof typeof ESTADO_CAPACIDAD_CHOICES;
export type ModalidadAmbulancia = keyof typeof MODALIDADES_AMBULANCIA;

// ====================================
// CORE DATA TYPES
// ====================================

export interface CapacidadInstalada {
  id: string;
  sede_prestadora: string;
  sede_nombre: string;
  sede_codigo: string;
  health_service?: string;
  servicio_nombre?: string;
  grupo_capacidad: GrupoCapacidad;
  grupo_display: string;
  codigo_concepto: string;
  nombre_concepto: string;
  cantidad: number;
  cantidad_habilitada: number;
  cantidad_funcionando: number;
  estado_capacidad: EstadoCapacidad;
  estado_display: string;
  
  // Equipment/Vehicle specific fields
  numero_placa?: string;
  modalidad_ambulancia?: ModalidadAmbulancia;
  modalidad_display?: string;
  modelo_vehiculo?: string;
  numero_tarjeta_propiedad?: string;
  marca?: string;
  modelo_equipo?: string;
  numero_serie?: string;
  
  // Operational data
  porcentaje_ocupacion?: number;
  horas_funcionamiento_dia?: number;
  dias_funcionamiento_semana?: number;
  observaciones?: string;
  
  // REPS synchronization
  sincronizado_reps: boolean;
  fecha_corte_reps?: string;
  necesita_actualizacion_reps: boolean;
  
  // Computed fields
  porcentaje_habilitacion: number;
  porcentaje_funcionamiento: number;
  es_ambulancia: boolean;
  es_equipo_biomedico: boolean;
  requiere_placa: boolean;
  concepto_display_complete: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CapacidadHistorial {
  id: string;
  capacidad: string;
  accion: 'creacion' | 'modificacion' | 'eliminacion' | 'importacion' | 'sincronizacion';
  accion_display: string;
  campo_modificado?: string;
  valor_anterior?: string;
  valor_nuevo?: string;
  justificacion: string;
  origen_cambio: 'manual' | 'importacion' | 'sincronizacion' | 'sistema';
  origen_display: string;
  usuario_nombre: string;
  created_at: string;
}

export interface CapacidadImportLog {
  id: string;
  sede_prestadora?: string;
  sede_nombre?: string;
  nombre_archivo: string;
  tamaño_archivo: number;
  formato_archivo: 'xls' | 'xlsx' | 'csv' | 'html';
  formato_display: string;
  total_registros: number;
  registros_importados: number;
  registros_actualizados: number;
  registros_con_error: number;
  estado_importacion: 'pendiente' | 'procesando' | 'completada' | 'completada_con_errores' | 'fallida';
  estado_display: string;
  errores: string[];
  advertencias: string[];
  estadisticas: Record<string, any>;
  fecha_inicio: string;
  fecha_finalizacion?: string;
  duracion_segundos?: number;
  porcentaje_exito: number;
  tiene_errores: boolean;
  tiempo_procesamiento: string;
  usuario_nombre: string;
  created_at: string;
}

// ====================================
// FORM DATA TYPES
// ====================================

export interface CapacidadFormData {
  sede_prestadora: string;
  health_service?: string;
  grupo_capacidad: GrupoCapacidad;
  codigo_concepto: string;
  nombre_concepto: string;
  cantidad: number;
  cantidad_habilitada: number;
  cantidad_funcionando: number;
  estado_capacidad: EstadoCapacidad;
  
  // Equipment/Vehicle specific fields
  numero_placa?: string;
  modalidad_ambulancia?: ModalidadAmbulancia;
  modelo_vehiculo?: string;
  numero_tarjeta_propiedad?: string;
  marca?: string;
  modelo_equipo?: string;
  numero_serie?: string;
  
  // Operational data
  porcentaje_ocupacion?: number;
  horas_funcionamiento_dia?: number;
  dias_funcionamiento_semana?: number;
  observaciones?: string;
}

export interface CapacidadImportConfig {
  file: File;
  sede_id?: string;
  validate_only?: boolean;
  update_existing?: boolean;
}

export interface CapacidadBulkAction {
  capacity_ids: string[];
  action: 'enable' | 'disable' | 'delete' | 'sync_reps' | 'update_status';
  additional_data?: Record<string, any>;
}

// ====================================
// FILTER TYPES
// ====================================

export interface CapacidadFilters {
  sede_prestadora?: string;
  grupo_capacidad?: GrupoCapacidad;
  estado_capacidad?: EstadoCapacidad;
  codigo_concepto?: string;
  search?: string;
  sincronizado_reps?: boolean;
  necesita_actualizacion_reps?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}

// ====================================
// RESPONSE TYPES
// ====================================

export interface CapacidadListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: CapacidadInstalada[];
}

export interface CapacidadImportResponse {
  success: boolean;
  message: string;
  import_log: CapacidadImportLog;
  summary?: {
    total_processed: number;
    successfully_imported: number;
    updated: number;
    errors: number;
    warnings: number;
  };
  errors?: Record<string, string[]>;
}

export interface CapacidadBulkResponse {
  success: boolean;
  message: string;
  processed_count: number;
  successful_count: number;
  failed_count: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

// ====================================
// STATISTICS TYPES
// ====================================

export interface CapacidadStatistics {
  total_capacity: number;
  by_group: Record<GrupoCapacidad, {
    count: number;
    total_cantidad: number;
    total_funcionando: number;
    porcentaje_funcionamiento: number;
  }>;
  by_sede: Array<{
    sede_id: string;
    sede_nombre: string;
    total_capacity: number;
    average_occupancy: number;
    needs_sync: boolean;
  }>;
  by_status: Record<EstadoCapacidad, number>;
  occupancy_rates: {
    average: number;
    by_group: Record<GrupoCapacidad, number>;
  };
  reps_sync_status: {
    synchronized: number;
    needs_update: number;
    never_synced: number;
  };
  recent_imports: CapacidadImportLog[];
  pending_updates: number;
}

export interface SedeCapacityOverview {
  sede: {
    id: string;
    name: string;
    reps_code: string;
    address: string;
  };
  summary: {
    total_capacity: number;
    total_cantidad: number;
    average_occupancy?: number;
    last_update?: string;
    needs_sync: boolean;
  };
  capacity_by_group: Array<{
    grupo_capacidad: GrupoCapacidad;
    grupo_display: string;
    capacidades: CapacidadInstalada[];
    totales: {
      count: number;
      total_cantidad: number;
      total_habilitada: number;
      total_funcionando: number;
    };
  }>;
}

export interface CapacidadGrouped {
  grupo_capacidad: GrupoCapacidad;
  grupo_display: string;
  capacidades: CapacidadInstalada[];
  totales: {
    cantidad: number;
    habilitada: number;
    funcionando: number;
    porcentaje_funcionamiento: number;
  };
}

// ====================================
// VALIDATION TYPES
// ====================================

export interface CapacidadValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    total_records: number;
    valid_records: number;
    invalid_records: number;
    warnings_count: number;
  };
  suggestions?: string[];
}

// ====================================
// ERROR TYPES
// ====================================

export interface CapacidadApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
  code?: string;
}

// ====================================
// UI HELPER TYPES
// ====================================

export interface CapacidadTableColumn {
  key: keyof CapacidadInstalada;
  label: string;
  sortable?: boolean;
  render?: (value: any, record: CapacidadInstalada) => React.ReactNode;
}

export interface CapacidadModalProps {
  isOpen: boolean;
  onClose: () => void;
  capacity?: CapacidadInstalada;
  sedeId?: string;
  onSuccess?: (capacity: CapacidadInstalada) => void;
}

export interface CapacidadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sedeId?: string;
  onSuccess?: (result: CapacidadImportResponse) => void;
}