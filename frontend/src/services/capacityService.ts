/**
 * API Service for Capacity Management (Capacidad Instalada REPS)
 * 
 * This service handles all API communications related to healthcare capacity management,
 * including CRUD operations, import/export, and REPS synchronization.
 * Based on Colombian healthcare capacity regulations (Resolution 3100/2019).
 */

import { apiClient } from '../api/endpoints';
import type {
  CapacidadInstalada,
  CapacidadListResponse,
  CapacidadFormData,
  CapacidadFilters,
  CapacidadImportConfig,
  CapacidadImportResponse,
  CapacidadBulkAction,
  CapacidadBulkResponse,
  CapacidadStatistics,
  SedeCapacityOverview,
  CapacidadGrouped,
  CapacidadValidationResult,
  CapacidadHistorial,
  CapacidadImportLog,
  CapacidadApiError,
  GrupoCapacidad,
  EstadoCapacidad,
} from '@/types/capacity.types';

// ====================================
// API ENDPOINTS
// ====================================

const ENDPOINTS = {
  // Core capacity endpoints
  capacities: '/api/v1/capacidad/',
  capacityById: (id: string) => `/api/v1/capacidad/${id}/`,
  
  // Import/Export endpoints
  importReps: '/api/v1/capacidad/import-reps/',
  exportCapacity: '/api/v1/capacidad/export/',
  validateImport: '/api/v1/capacidad/import-reps/', // Same endpoint for validation and import
  
  // Bulk operations
  bulkActions: '/api/v1/capacidad/bulk-action/',
  
  // Statistics and reports
  statistics: '/api/v1/capacidad/statistics/',
  sedeOverview: (sedeId: string) => `/api/v1/capacidad/by-sede/${sedeId}/`,
  groupedBySede: '/api/v1/capacidad/grouped_by_sede/',
  groupedByType: '/api/organization/capacidad/grouped_by_type/',
  
  // History and logs
  history: (capacityId: string) => `/api/organization/capacidad-historial/?capacidad=${capacityId}`,
  importLogs: '/api/organization/capacidad-import-logs/',
  importLogById: (id: string) => `/api/organization/capacidad-import-logs/${id}/`,
  
  // REPS synchronization
  syncReps: '/api/organization/capacidad/sync_reps/',
  repsStatus: '/api/organization/capacidad/reps_status/',
} as const;

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Build query parameters for filters
 */
function buildQueryParams(filters: CapacidadFilters = {}): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'boolean') {
        params.append(key, value.toString());
      } else {
        params.append(key, String(value));
      }
    }
  });
  
  return params;
}

/**
 * Handle API errors consistently
 */
function handleApiError(error: any): never {
  if (error.response?.data) {
    const errorData = error.response.data as CapacidadApiError;
    throw new Error(errorData.detail || errorData.message || 'Error en la operación');
  }
  throw new Error(error.message || 'Error de conexión');
}

// ====================================
// CORE CRUD OPERATIONS
// ====================================

export const capacityService = {
  /**
   * Get list of capacities with filtering
   */
  async getCapacities(filters: CapacidadFilters = {}): Promise<CapacidadListResponse> {
    try {
      const queryParams = buildQueryParams(filters);
      const url = `${ENDPOINTS.capacities}?${queryParams}`;
      
      const response = await apiClient.get<CapacidadListResponse>(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching capacities:', error);
      handleApiError(error);
    }
  },

  /**
   * Get capacity detail by ID
   */
  async getCapacityById(capacityId: string): Promise<CapacidadInstalada> {
    try {
      const response = await apiClient.get<CapacidadInstalada>(
        ENDPOINTS.capacityById(capacityId)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching capacity detail:', error);
      handleApiError(error);
    }
  },

  /**
   * Create a new capacity record
   */
  async createCapacity(data: CapacidadFormData): Promise<CapacidadInstalada> {
    try {
      const response = await apiClient.post<CapacidadInstalada>(
        ENDPOINTS.capacities,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error creating capacity:', error);
      handleApiError(error);
    }
  },

  /**
   * Update an existing capacity record
   */
  async updateCapacity(
    capacityId: string, 
    data: Partial<CapacidadFormData>
  ): Promise<CapacidadInstalada> {
    try {
      const response = await apiClient.patch<CapacidadInstalada>(
        ENDPOINTS.capacityById(capacityId),
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating capacity:', error);
      handleApiError(error);
    }
  },

  /**
   * Delete a capacity record
   */
  async deleteCapacity(capacityId: string): Promise<void> {
    try {
      await apiClient.delete(ENDPOINTS.capacityById(capacityId));
    } catch (error) {
      console.error('Error deleting capacity:', error);
      handleApiError(error);
    }
  },

  // ====================================
  // IMPORT/EXPORT OPERATIONS
  // ====================================

  /**
   * Import capacity data from REPS file
   */
  async importRepsFile(config: CapacidadImportConfig): Promise<CapacidadImportResponse> {
    try {
      const formData = new FormData();
      formData.append('file', config.file);
      
      if (config.sede_id) {
        formData.append('sede_id', config.sede_id);
      }
      
      if (config.validate_only !== undefined) {
        formData.append('validate_only', config.validate_only.toString());
      }
      
      if (config.update_existing !== undefined) {
        formData.append('update_existing', config.update_existing.toString());
      }

      const response = await apiClient.post<CapacidadImportResponse>(
        ENDPOINTS.importReps,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error importing capacity file:', error);
      handleApiError(error);
    }
  },

  /**
   * Validate import file without importing
   */
  async validateImportFile(config: Omit<CapacidadImportConfig, 'validate_only'>): Promise<CapacidadValidationResult> {
    try {
      const formData = new FormData();
      formData.append('file', config.file);
      formData.append('validate_only', 'true'); // Add validation flag
      
      if (config.sede_id) {
        formData.append('sede_id', config.sede_id);
      }

      const response = await apiClient.post<CapacidadValidationResult>(
        ENDPOINTS.validateImport,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error validating capacity file:', error);
      handleApiError(error);
    }
  },

  /**
   * Export capacity data to file
   */
  async exportCapacities(
    filters: CapacidadFilters = {},
    format: 'csv' | 'excel' = 'csv'
  ): Promise<Blob> {
    try {
      const queryParams = buildQueryParams({ ...filters, format });
      
      const response = await apiClient.get(
        `${ENDPOINTS.exportCapacity}?${queryParams}`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting capacities:', error);
      handleApiError(error);
    }
  },

  // ====================================
  // BULK OPERATIONS
  // ====================================

  /**
   * Perform bulk actions on capacity records
   */
  async performBulkAction(action: CapacidadBulkAction): Promise<CapacidadBulkResponse> {
    try {
      const response = await apiClient.post<CapacidadBulkResponse>(
        ENDPOINTS.bulkActions,
        action
      );
      return response.data;
    } catch (error) {
      console.error('Error performing bulk action:', error);
      handleApiError(error);
    }
  },

  /**
   * Enable multiple capacity records
   */
  async bulkEnableCapacities(capacityIds: string[]): Promise<CapacidadBulkResponse> {
    return this.performBulkAction({
      capacity_ids: capacityIds,
      action: 'enable',
    });
  },

  /**
   * Disable multiple capacity records
   */
  async bulkDisableCapacities(capacityIds: string[]): Promise<CapacidadBulkResponse> {
    return this.performBulkAction({
      capacity_ids: capacityIds,
      action: 'disable',
    });
  },

  /**
   * Delete multiple capacity records
   */
  async bulkDeleteCapacities(capacityIds: string[]): Promise<CapacidadBulkResponse> {
    return this.performBulkAction({
      capacity_ids: capacityIds,
      action: 'delete',
    });
  },

  /**
   * Synchronize multiple capacity records with REPS
   */
  async bulkSyncWithReps(capacityIds: string[]): Promise<CapacidadBulkResponse> {
    return this.performBulkAction({
      capacity_ids: capacityIds,
      action: 'sync_reps',
    });
  },

  // ====================================
  // STATISTICS AND REPORTS
  // ====================================

  /**
   * Get overall capacity statistics
   */
  async getCapacityStatistics(filters: CapacidadFilters = {}): Promise<CapacidadStatistics> {
    try {
      const queryParams = buildQueryParams(filters);
      const response = await apiClient.get<CapacidadStatistics>(
        `${ENDPOINTS.statistics}?${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching capacity statistics:', error);
      handleApiError(error);
    }
  },

  /**
   * Get capacity overview for a specific sede
   */
  async getSedeCapacityOverview(sedeId: string): Promise<SedeCapacityOverview> {
    try {
      const response = await apiClient.get<SedeCapacityOverview>(
        ENDPOINTS.sedeOverview(sedeId)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching sede capacity overview:', error);
      handleApiError(error);
    }
  },

  /**
   * Get capacities grouped by sede
   */
  async getCapacitiesGroupedBySede(filters: CapacidadFilters = {}): Promise<SedeCapacityOverview[]> {
    try {
      const queryParams = buildQueryParams(filters);
      const response = await apiClient.get<SedeCapacityOverview[]>(
        `${ENDPOINTS.groupedBySede}?${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching capacities grouped by sede:', error);
      handleApiError(error);
    }
  },

  /**
   * Get capacities grouped by type
   */
  async getCapacitiesGroupedByType(filters: CapacidadFilters = {}): Promise<CapacidadGrouped[]> {
    try {
      const queryParams = buildQueryParams(filters);
      const response = await apiClient.get<CapacidadGrouped[]>(
        `${ENDPOINTS.groupedByType}?${queryParams}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching capacities grouped by type:', error);
      handleApiError(error);
    }
  },

  // ====================================
  // HISTORY AND AUDIT
  // ====================================

  /**
   * Get history for a capacity record
   */
  async getCapacityHistory(capacityId: string): Promise<CapacidadHistorial[]> {
    try {
      const response = await apiClient.get<{ results: CapacidadHistorial[] }>(
        ENDPOINTS.history(capacityId)
      );
      return response.data.results;
    } catch (error) {
      console.error('Error fetching capacity history:', error);
      handleApiError(error);
    }
  },

  /**
   * Get import logs
   */
  async getImportLogs(filters: { sede_prestadora?: string } = {}): Promise<CapacidadImportLog[]> {
    try {
      const queryParams = buildQueryParams(filters);
      const response = await apiClient.get<{ results: CapacidadImportLog[] }>(
        `${ENDPOINTS.importLogs}?${queryParams}`
      );
      return response.data.results;
    } catch (error) {
      console.error('Error fetching import logs:', error);
      handleApiError(error);
    }
  },

  /**
   * Get specific import log
   */
  async getImportLogById(logId: string): Promise<CapacidadImportLog> {
    try {
      const response = await apiClient.get<CapacidadImportLog>(
        ENDPOINTS.importLogById(logId)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching import log detail:', error);
      handleApiError(error);
    }
  },

  // ====================================
  // REPS SYNCHRONIZATION
  // ====================================

  /**
   * Synchronize with REPS system
   */
  async syncWithReps(sedeId?: string): Promise<{ success: boolean; message: string; synced_count: number }> {
    try {
      const data = sedeId ? { sede_id: sedeId } : {};
      const response = await apiClient.post(ENDPOINTS.syncReps, data);
      return response.data;
    } catch (error) {
      console.error('Error syncing with REPS:', error);
      handleApiError(error);
    }
  },

  /**
   * Get REPS synchronization status
   */
  async getRepsStatus(): Promise<{
    last_sync: string | null;
    pending_updates: number;
    sync_in_progress: boolean;
    last_sync_errors: string[];
  }> {
    try {
      const response = await apiClient.get(ENDPOINTS.repsStatus);
      return response.data;
    } catch (error) {
      console.error('Error fetching REPS status:', error);
      handleApiError(error);
    }
  },

  // ====================================
  // UTILITY FUNCTIONS
  // ====================================

  /**
   * Validate capacity form data client-side
   */
  validateCapacityForm(data: Partial<CapacidadFormData>): Record<string, string> {
    const errors: Record<string, string> = {};

    // Required field validations
    if (!data.sede_prestadora?.trim()) {
      errors.sede_prestadora = 'Sede es obligatoria';
    }

    if (!data.grupo_capacidad?.trim()) {
      errors.grupo_capacidad = 'Grupo de capacidad es obligatorio';
    }

    if (!data.codigo_concepto?.trim()) {
      errors.codigo_concepto = 'Código de concepto es obligatorio';
    } else if (data.codigo_concepto.length > 10) {
      errors.codigo_concepto = 'Código de concepto no debe exceder 10 caracteres';
    }

    if (!data.nombre_concepto?.trim()) {
      errors.nombre_concepto = 'Nombre de concepto es obligatorio';
    } else if (data.nombre_concepto.length > 200) {
      errors.nombre_concepto = 'Nombre de concepto no debe exceder 200 caracteres';
    }

    if (!data.estado_capacidad?.trim()) {
      errors.estado_capacidad = 'Estado de capacidad es obligatorio';
    }

    // Numeric validations
    if (data.cantidad !== undefined && data.cantidad < 0) {
      errors.cantidad = 'Cantidad no puede ser negativa';
    }

    if (data.cantidad_habilitada !== undefined && data.cantidad_habilitada < 0) {
      errors.cantidad_habilitada = 'Cantidad habilitada no puede ser negativa';
    }

    if (data.cantidad_funcionando !== undefined && data.cantidad_funcionando < 0) {
      errors.cantidad_funcionando = 'Cantidad funcionando no puede ser negativa';
    }

    // Logical validations
    if (data.cantidad !== undefined && data.cantidad_habilitada !== undefined && 
        data.cantidad_habilitada > data.cantidad) {
      errors.cantidad_habilitada = 'Cantidad habilitada no puede ser mayor que la cantidad total';
    }

    if (data.cantidad !== undefined && data.cantidad_funcionando !== undefined && 
        data.cantidad_funcionando > data.cantidad) {
      errors.cantidad_funcionando = 'Cantidad funcionando no puede ser mayor que la cantidad total';
    }

    // Ambulance-specific validations
    if (data.grupo_capacidad === 'AMBULANCIAS') {
      if (!data.numero_placa?.trim()) {
        errors.numero_placa = 'Número de placa es obligatorio para ambulancias';
      }

      if (!data.modalidad_ambulancia?.trim()) {
        errors.modalidad_ambulancia = 'Modalidad es obligatoria para ambulancias';
      }
    }

    // Occupancy percentage validation
    if (data.porcentaje_ocupacion !== undefined && 
        (data.porcentaje_ocupacion < 0 || data.porcentaje_ocupacion > 100)) {
      errors.porcentaje_ocupacion = 'Porcentaje de ocupación debe estar entre 0 y 100';
    }

    // Operating hours validations
    if (data.horas_funcionamiento_dia !== undefined && 
        (data.horas_funcionamiento_dia < 0 || data.horas_funcionamiento_dia > 24)) {
      errors.horas_funcionamiento_dia = 'Horas de funcionamiento debe estar entre 0 y 24';
    }

    if (data.dias_funcionamiento_semana !== undefined && 
        (data.dias_funcionamiento_semana < 0 || data.dias_funcionamiento_semana > 7)) {
      errors.dias_funcionamiento_semana = 'Días de funcionamiento debe estar entre 0 y 7';
    }

    return errors;
  },

  /**
   * Format capacity data for display
   */
  formatCapacityForDisplay(capacity: CapacidadInstalada): {
    basicInfo: Array<{ label: string; value: string | number }>;
    capacityInfo: Array<{ label: string; value: string | number }>;
    equipmentInfo: Array<{ label: string; value: string | number }>;
    operationalInfo: Array<{ label: string; value: string | number }>;
  } {
    return {
      basicInfo: [
        { label: 'Sede', value: capacity.sede_nombre },
        { label: 'Grupo', value: capacity.grupo_display },
        { label: 'Código Concepto', value: capacity.codigo_concepto },
        { label: 'Concepto', value: capacity.nombre_concepto },
        { label: 'Estado', value: capacity.estado_display },
      ],
      capacityInfo: [
        { label: 'Cantidad Total', value: capacity.cantidad },
        { label: 'Cantidad Habilitada', value: capacity.cantidad_habilitada },
        { label: 'Cantidad Funcionando', value: capacity.cantidad_funcionando },
        { label: '% Habilitación', value: `${capacity.porcentaje_habilitacion.toFixed(1)}%` },
        { label: '% Funcionamiento', value: `${capacity.porcentaje_funcionamiento.toFixed(1)}%` },
      ],
      equipmentInfo: [
        { label: 'Número de Placa', value: capacity.numero_placa || 'N/A' },
        { label: 'Modalidad', value: capacity.modalidad_display || 'N/A' },
        { label: 'Marca', value: capacity.marca || 'N/A' },
        { label: 'Modelo', value: capacity.modelo_equipo || capacity.modelo_vehiculo || 'N/A' },
        { label: 'Número de Serie', value: capacity.numero_serie || 'N/A' },
      ],
      operationalInfo: [
        { label: 'Ocupación', value: capacity.porcentaje_ocupacion ? `${capacity.porcentaje_ocupacion}%` : 'N/A' },
        { label: 'Horas/Día', value: capacity.horas_funcionamiento_dia || 'N/A' },
        { label: 'Días/Semana', value: capacity.dias_funcionamiento_semana || 'N/A' },
        { label: 'Sincronizado REPS', value: capacity.sincronizado_reps ? 'Sí' : 'No' },
        { label: 'Necesita Actualización', value: capacity.necesita_actualizacion_reps ? 'Sí' : 'No' },
      ],
    };
  },

  /**
   * Get capacity group display options
   */
  getCapacityGroupOptions(): Array<{ value: GrupoCapacidad; label: string }> {
    return [
      { value: 'CAMAS', label: 'Camas' },
      { value: 'CAMILLAS', label: 'Camillas' },
      { value: 'CONSULTORIOS', label: 'Consultorios' },
      { value: 'SALAS', label: 'Salas' },
    ];
  },

  /**
   * Get capacity status display options
   */
  getCapacityStatusOptions(): Array<{ value: EstadoCapacidad; label: string }> {
    return [
      { value: 'ACTIVO', label: 'Activo' },
      { value: 'INACTIVO', label: 'Inactivo' },
      { value: 'EN_MANTENIMIENTO', label: 'En Mantenimiento' },
      { value: 'FUERA_DE_SERVICIO', label: 'Fuera de Servicio' },
    ];
  },

  /**
   * Download file from blob with proper filename
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default capacityService;