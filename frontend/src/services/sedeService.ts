/**
 * API Service for Sede Prestadora (Health Service Provider Facilities)
 * 
 * This service handles all API communications related to sede management,
 * including CRUD operations, import/export, and validation.
 */

import { apiClient } from '../api/endpoints';
import type {
  SedePrestadora,
  SedeListItem,
  SedeListResponse,
  SedeFormData,
  SedeFilters,
  SedeImportConfig,
  SedeImportResponse,
  SedeBulkCreateRequest,
  SedeBulkUpdateRequest,
  SedeBulkDeleteRequest,
  SedeBulkResponse,
  SedeServicio,
  SedeServicioFormData,
  SedeApiError,
} from '@/types/sede.types';

// ====================================
// API ENDPOINTS
// ====================================

const ENDPOINTS = {
  // Base endpoints
  sedes: '/api/v1/sedes/',
  sedesById: (id: string) => `/api/v1/sedes/${id}/`,
  
  // Organization-specific endpoints
  organizationSedes: (orgId: string) => `/api/v1/organizations/${orgId}/sedes/`,
  organizationSedeById: (orgId: string, sedeId: string) => `/api/v1/organizations/${orgId}/sedes/${sedeId}/`,
  organizationSedesImport: (orgId: string) => `/api/v1/organizations/${orgId}/sedes/import/`,
  organizationSedesExport: (orgId: string) => `/api/v1/organizations/${orgId}/sedes/export/`,
  organizationSedesValidate: (orgId: string) => `/api/v1/organizations/${orgId}/sedes/validate/`,
  organizationSedesBulkCreate: (orgId: string) => `/api/v1/organizations/${orgId}/sedes/bulk-create/`,
  
  // Service management endpoints
  sedeServicios: (sedeId: string) => `/api/v1/sedes/${sedeId}/servicios/`,
  sedeAddServicio: (sedeId: string) => `/api/v1/sedes/${sedeId}/servicios/agregar/`,
} as const;

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Build query parameters for filters
 */
function buildQueryParams(filters: SedeFilters = {}): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params;
}

/**
 * Handle API errors consistently
 */
function handleApiError(error: any): never {
  if (error.response?.data) {
    const errorData = error.response.data as SedeApiError;
    throw new Error(errorData.detail || errorData.message || 'Error en la operación');
  }
  throw new Error(error.message || 'Error de conexión');
}

// ====================================
// CORE CRUD OPERATIONS
// ====================================

export const sedeService = {
  /**
   * Get list of sedes for an organization
   */
  async getSedes(organizationId: string, filters: SedeFilters = {}): Promise<SedeListResponse> {
    try {
      const queryParams = buildQueryParams(filters);
      const url = `${ENDPOINTS.organizationSedes(organizationId)}?${queryParams}`;
      
      const response = await apiClient.get<SedeListResponse>(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching sedes:', error);
      handleApiError(error);
    }
  },

  /**
   * Get sede detail by ID
   */
  async getSedeById(sedeId: string): Promise<SedePrestadora> {
    try {
      const response = await apiClient.get<SedePrestadora>(ENDPOINTS.sedesById(sedeId));
      return response.data;
    } catch (error) {
      console.error('Error fetching sede detail:', error);
      handleApiError(error);
    }
  },

  /**
   * Create a new sede
   */
  async createSede(organizationId: string, data: SedeFormData): Promise<SedePrestadora> {
    try {
      const response = await apiClient.post<SedePrestadora>(
        ENDPOINTS.organizationSedes(organizationId),
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error creating sede:', error);
      handleApiError(error);
    }
  },

  /**
   * Update an existing sede
   */
  async updateSede(organizationId: string, sedeId: string, data: Partial<SedeFormData>): Promise<SedePrestadora> {
    try {
      const response = await apiClient.patch<SedePrestadora>(
        ENDPOINTS.organizationSedeById(organizationId, sedeId),
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating sede:', error);
      handleApiError(error);
    }
  },

  /**
   * Delete a sede
   */
  async deleteSede(organizationId: string, sedeId: string): Promise<void> {
    try {
      await apiClient.delete(ENDPOINTS.organizationSedeById(organizationId, sedeId));
    } catch (error) {
      console.error('Error deleting sede:', error);
      handleApiError(error);
    }
  },

  // ====================================
  // VALIDATION OPERATIONS
  // ====================================

  /**
   * Validate sede data without saving
   */
  async validateSede(organizationId: string, data: SedeFormData): Promise<{ is_valid: boolean; errors?: Record<string, string[]> }> {
    try {
      const response = await apiClient.post(
        ENDPOINTS.organizationSedesValidate(organizationId),
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error validating sede:', error);
      // For validation, we might want to return the validation errors instead of throwing
      if (error.response?.status === 400) {
        return {
          is_valid: false,
          errors: error.response.data.errors || {}
        };
      }
      handleApiError(error);
    }
  },

  // ====================================
  // BULK OPERATIONS
  // ====================================

  /**
   * Create multiple sedes at once
   */
  async bulkCreateSedes(organizationId: string, sedes: SedeFormData[]): Promise<SedeBulkResponse> {
    try {
      const request: SedeBulkCreateRequest = { sedes };
      const response = await apiClient.post<SedeBulkResponse>(
        ENDPOINTS.organizationSedesBulkCreate(organizationId),
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error in bulk create sedes:', error);
      handleApiError(error);
    }
  },

  /**
   * Update multiple sedes at once
   */
  async bulkUpdateSedes(organizationId: string, updates: Array<Partial<SedePrestadora> & { id: string }>): Promise<SedeBulkResponse> {
    try {
      const request: SedeBulkUpdateRequest = { updates };
      const response = await apiClient.patch<SedeBulkResponse>(
        `${ENDPOINTS.organizationSedes(organizationId)}bulk-update/`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error in bulk update sedes:', error);
      handleApiError(error);
    }
  },

  /**
   * Delete multiple sedes at once
   */
  async bulkDeleteSedes(organizationId: string, sedeIds: string[]): Promise<SedeBulkResponse> {
    try {
      const request: SedeBulkDeleteRequest = { sede_ids: sedeIds };
      const response = await apiClient.delete<SedeBulkResponse>(
        `${ENDPOINTS.organizationSedes(organizationId)}bulk-delete/`,
        { data: request }
      );
      return response.data;
    } catch (error) {
      console.error('Error in bulk delete sedes:', error);
      handleApiError(error);
    }
  },

  // ====================================
  // IMPORT/EXPORT OPERATIONS
  // ====================================

  /**
   * Import sedes from file
   */
  async importSedes(organizationId: string, config: SedeImportConfig): Promise<SedeImportResponse> {
    try {
      const formData = new FormData();
      formData.append('file', config.file);
      formData.append('format', config.format);
      formData.append('validate_only', config.validate_only.toString());
      formData.append('overwrite_existing', config.overwrite_existing.toString());
      
      if (config.mapping) {
        formData.append('mapping', JSON.stringify(config.mapping));
      }

      const response = await apiClient.post<SedeImportResponse>(
        ENDPOINTS.organizationSedesImport(organizationId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error importing sedes:', error);
      handleApiError(error);
    }
  },

  /**
   * Validate import file without importing
   */
  async validateImport(organizationId: string, config: Omit<SedeImportConfig, 'validate_only'>): Promise<SedeImportResponse> {
    return this.importSedes(organizationId, { ...config, validate_only: true });
  },

  /**
   * Export sedes to file
   */
  async exportSedes(
    organizationId: string, 
    format: 'csv' | 'excel' = 'csv',
    includeServices: boolean = false
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        format,
        include_services: includeServices.toString(),
      });

      const response = await apiClient.get(
        `${ENDPOINTS.organizationSedesExport(organizationId)}?${params}`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting sedes:', error);
      handleApiError(error);
    }
  },

  // ====================================
  // SERVICE MANAGEMENT
  // ====================================

  /**
   * Get services for a sede
   */
  async getSedeServicios(sedeId: string): Promise<{ sede: string; total_servicios: number; servicios: SedeServicio[] }> {
    try {
      const response = await apiClient.get(ENDPOINTS.sedeServicios(sedeId));
      return response.data;
    } catch (error) {
      console.error('Error fetching sede servicios:', error);
      handleApiError(error);
    }
  },

  /**
   * Add a service to a sede
   */
  async addServicioToSede(sedeId: string, data: SedeServicioFormData): Promise<{ success: boolean; message: string; sede_servicio: SedeServicio }> {
    try {
      const response = await apiClient.post(ENDPOINTS.sedeAddServicio(sedeId), data);
      return response.data;
    } catch (error) {
      console.error('Error adding servicio to sede:', error);
      handleApiError(error);
    }
  },

  // ====================================
  // UTILITY FUNCTIONS
  // ====================================

  /**
   * Generate sede number suggestion
   */
  generateSedeNumber(existingSedes: SedeListItem[]): string {
    const existingNumbers = existingSedes
      .map(sede => parseInt(sede.numero_sede, 10))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    let nextNumber = 1;
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }

    return nextNumber.toString().padStart(2, '0');
  },

  /**
   * Validate sede form data client-side
   */
  validateSedeForm(data: Partial<SedeFormData>): Record<string, string> {
    const errors: Record<string, string> = {};

    // Required field validations
    if (!data.numero_sede?.trim()) {
      errors.numero_sede = 'Número de sede es obligatorio';
    } else if (!/^\d{1,3}$/.test(data.numero_sede)) {
      errors.numero_sede = 'Número de sede debe ser numérico (máximo 3 dígitos)';
    }

    if (!data.codigo_prestador?.trim()) {
      errors.codigo_prestador = 'Código de prestador es obligatorio';
    } else if (data.codigo_prestador.length < 9) {
      errors.codigo_prestador = 'Código de prestador debe tener al menos 9 caracteres';
    }

    if (!data.nombre_sede?.trim()) {
      errors.nombre_sede = 'Nombre de sede es obligatorio';
    }

    if (!data.direccion?.trim()) {
      errors.direccion = 'Dirección es obligatoria';
    }

    if (!data.departamento?.trim()) {
      errors.departamento = 'Departamento es obligatorio';
    }

    if (!data.municipio?.trim()) {
      errors.municipio = 'Municipio es obligatorio';
    }

    if (!data.telefono_principal?.trim()) {
      errors.telefono_principal = 'Teléfono principal es obligatorio';
    } else if (!/^\+?[\d\s\-\(\)]{7,20}$/.test(data.telefono_principal)) {
      errors.telefono_principal = 'Formato de teléfono inválido';
    }

    if (!data.email?.trim()) {
      errors.email = 'Email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Formato de email inválido';
    }

    if (!data.nombre_responsable?.trim()) {
      errors.nombre_responsable = 'Nombre del responsable es obligatorio';
    }

    if (!data.cargo_responsable?.trim()) {
      errors.cargo_responsable = 'Cargo del responsable es obligatorio';
    }

    // Optional field validations
    if (data.telefono_secundario && !/^\+?[\d\s\-\(\)]{7,20}$/.test(data.telefono_secundario)) {
      errors.telefono_secundario = 'Formato de teléfono secundario inválido';
    }

    if (data.telefono_responsable && !/^\+?[\d\s\-\(\)]{7,20}$/.test(data.telefono_responsable)) {
      errors.telefono_responsable = 'Formato de teléfono del responsable inválido';
    }

    if (data.email_responsable && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email_responsable)) {
      errors.email_responsable = 'Formato de email del responsable inválido';
    }

    // Numeric validations
    if (data.numero_camas !== undefined && data.numero_camas < 0) {
      errors.numero_camas = 'Número de camas no puede ser negativo';
    }

    if (data.numero_consultorios !== undefined && data.numero_consultorios < 0) {
      errors.numero_consultorios = 'Número de consultorios no puede ser negativo';
    }

    if (data.numero_quirofanos !== undefined && data.numero_quirofanos < 0) {
      errors.numero_quirofanos = 'Número de quirófanos no puede ser negativo';
    }

    return errors;
  },

  /**
   * Format sede data for display
   */
  formatSedeForDisplay(sede: SedePrestadora): {
    basicInfo: Array<{ label: string; value: string }>;
    contactInfo: Array<{ label: string; value: string }>;
    capacityInfo: Array<{ label: string; value: string | number }>;
  } {
    return {
      basicInfo: [
        { label: 'Número de Sede', value: sede.numero_sede },
        { label: 'Nombre', value: sede.nombre_sede },
        { label: 'Tipo', value: sede.tipo_sede },
        { label: 'Estado', value: sede.estado },
        { label: 'Es Principal', value: sede.es_sede_principal ? 'Sí' : 'No' },
        { label: 'Dirección', value: sede.direccion_completa },
      ],
      contactInfo: [
        { label: 'Teléfono Principal', value: sede.telefono_principal },
        { label: 'Teléfono Secundario', value: sede.telefono_secundario || 'N/A' },
        { label: 'Email', value: sede.email },
        { label: 'Responsable', value: sede.nombre_responsable },
        { label: 'Cargo Responsable', value: sede.cargo_responsable },
        { label: 'Email Responsable', value: sede.email_responsable || 'N/A' },
      ],
      capacityInfo: [
        { label: 'Camas', value: sede.numero_camas },
        { label: 'Consultorios', value: sede.numero_consultorios },
        { label: 'Quirófanos', value: sede.numero_quirofanos },
        { label: 'Servicios Habilitados', value: sede.total_servicios },
        { label: 'Atención 24h', value: sede.atencion_24_horas ? 'Sí' : 'No' },
      ],
    };
  },
};

export default sedeService;