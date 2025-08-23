/**
 * API Service for Servicios de Salud
 * 
 * This service handles all API calls related to health services
 * including CRUD operations, import/export, and statistics.
 */

import { apiClient } from '../api/endpoints';
import type {
  ServicioListResponse,
  SedeHealthService,
  ServicioFormData,
  ServicioCatalogoResponse,
  ServicioStatisticsResponse,
  ServicioFilters,
  ServicioImportConfig,
  ServicioImportResponse,
  ServicioBulkResponse,
  ServicioDuplicateFormData,
} from '@/types/servicios';

// ====================================
// BASE ENDPOINTS
// ====================================

const ENDPOINTS = {
  SERVICIOS: '/api/v1/sede-health-services/',
  CATALOGO: '/api/v1/health-service-catalog/',
  STATISTICS: '/api/v1/sede-health-services/statistics/',
  IMPORT: '/api/v1/sede-health-services/import-excel/',
  EXPORT: '/api/v1/sede-health-services/export/',
  BULK_ACTION: '/api/v1/sede-health-services/bulk-action/',
  DUPLICATE: '/api/v1/sede-health-services/duplicate/',
  TEMPLATE: '/api/v1/sede-health-services/import-template/',
} as const;

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Build query string from filters
 */
const buildQueryString = (filters: ServicioFilters): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
};

/**
 * Handle API errors
 */
const handleApiError = (error: any): never => {
  // Log the full error for debugging
  console.error('API Error Details:', JSON.stringify(error.response?.data, null, 2));
  
  // Handle wrapped error format {success: false, error: {...}}
  if (error.response?.data?.success === false && error.response?.data?.error) {
    const errorData = error.response.data.error;
    if (errorData.message) {
      throw new Error(errorData.message);
    }
    if (errorData.details) {
      throw new Error(JSON.stringify(errorData.details));
    }
  }
  
  if (error.response?.data?.detail) {
    throw new Error(error.response.data.detail);
  }
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  if (error.response?.data?.errors) {
    const errorMessages = Object.values(error.response.data.errors).flat();
    throw new Error(errorMessages.join(', '));
  }
  // Handle DRF validation errors
  if (error.response?.data && typeof error.response.data === 'object') {
    const validationErrors = [];
    for (const [field, errors] of Object.entries(error.response.data)) {
      if (Array.isArray(errors)) {
        validationErrors.push(`${field}: ${errors.join(', ')}`);
      } else if (typeof errors === 'string') {
        validationErrors.push(`${field}: ${errors}`);
      }
    }
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('; '));
    }
  }
  throw new Error(error.message || 'Error en la operación');
};

// ====================================
// SERVICE IMPLEMENTATION
// ====================================

export const servicioService = {
  // ====================================
  // CRUD OPERATIONS
  // ====================================

  /**
   * Get servicios list with optional filtering
   */
  async getServicios(filters: ServicioFilters = {}): Promise<ServicioListResponse> {
    try {
      const queryString = buildQueryString(filters);
      const url = queryString ? `${ENDPOINTS.SERVICIOS}?${queryString}` : ENDPOINTS.SERVICIOS;
      
      console.log('🌐 ServicioService: Making GET request to:', url);
      console.log('🔧 ServicioService: Filters:', filters);
      console.log('🔧 ServicioService: Query string:', queryString);
      
      const response = await apiClient.get(url);
      
      console.log('📦 ServicioService: Raw API response:', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        dataLength: JSON.stringify(response.data)?.length,
        dataStructure: response.data,
        firstResult: response.data?.results?.[0],
        resultFields: response.data?.results?.[0] ? Object.keys(response.data.results[0]) : []
      });
      
      return response.data;
    } catch (error) {
      console.error('🚫 ServicioService: API error:', error);
      handleApiError(error);
    }
  },

  /**
   * Get servicio by ID
   */
  async getServicioById(servicioId: string): Promise<SedeHealthService> {
    try {
      const response = await apiClient.get(`${ENDPOINTS.SERVICIOS}${servicioId}/`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Create new servicio
   */
  async createServicio(data: ServicioFormData): Promise<SedeHealthService> {
    try {
      // Get service catalog details to populate required fields
      const serviceCatalogResponse = await apiClient.get(`${ENDPOINTS.CATALOGO}${data.service_catalog}/`);
      const serviceCatalog = serviceCatalogResponse.data;
      
      // Transform frontend data to backend format
      const backendData = {
        headquarters: data.sede, // Map sede to headquarters (should be UUID string)
        service_code: serviceCatalog.service_code,
        service_name: serviceCatalog.service_name,
        service_group_code: serviceCatalog.service_group_code,
        service_group_name: serviceCatalog.service_group_name,
        distinctive_number: `${serviceCatalog.service_code}-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`.slice(0, 20), // Generate unique number within 20 chars
        
        // Map modalities - ensure at least one is 'SI' to pass validation
        ambulatory: data.modality === 'intramural' || data.modality === 'ambulatorio' ? 'SI' : 'NO',
        hospital: data.modality === 'intramural' || data.modality === 'hospitalario' ? 'SI' : 'NO', 
        mobile_unit: data.modality === 'extramural' || data.modality === 'unidad_movil' ? 'SI' : 'NO',
        domiciliary: data.modality === 'atencion_domiciliaria' || data.modality === 'domiciliario' ? 'SI' : 'NO',
        other_extramural: data.modality === 'extramural' ? 'SI' : 'NO',
        
        // Map complexity - ensure consistency
        low_complexity: data.complexity === 'baja' ? 'SI' : 'NO',
        medium_complexity: data.complexity === 'media' ? 'SI' : 'NO',
        high_complexity: data.complexity === 'alta' ? 'SI' : 'NO',
        complexity_level: data.complexity === 'baja' ? 'BAJA' : data.complexity === 'media' ? 'MEDIANA' : 'ALTA',
        
        // Map other fields with proper formats - Fix date format to YYYYMMDD as expected by model
        installed_capacity: parseInt(data.capacity?.toString() || '1', 10),
        opening_date: data.authorization_date ? data.authorization_date.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, ''), // YYYYMMDD format
        is_enabled: data.status === 'activo',
        observations: data.observation || '',
        
        // Default values for required fields - Fix to proper types
        is_reference_center: 'NO',
        is_referring_institution: 'NO',
        intramural_modality: true, // BooleanField
        
        // Fix JSONField formats - ensure proper JSON objects for JSONField types
        telemedicine_modality: data.modality === 'telemedicina' ? { enabled: true, types: ['consulta'] } : {},
        schedule: data.operating_hours ? { default: data.operating_hours } : { default: '08:00-17:00' },
        specificities: data.distinctive_feature ? { note: data.distinctive_feature } : {},
        human_talent: {},
        
        norm_version: 'RESOLUCION_3100',
        manager_name: 'Administrador',
        is_pdet_municipality: false,
        is_zomac_municipality: false,
        is_pnis_municipality: false,
      };
      
      // Log the payload for debugging
      console.log('Sending payload to backend:', backendData);
      
      const response = await apiClient.post(ENDPOINTS.SERVICIOS, backendData);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Update existing servicio
   */
  async updateServicio(servicioId: string, data: Partial<ServicioFormData>): Promise<SedeHealthService> {
    try {
      const response = await apiClient.patch(`${ENDPOINTS.SERVICIOS}${servicioId}/`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Delete servicio
   */
  async deleteServicio(servicioId: string): Promise<void> {
    try {
      await apiClient.delete(`${ENDPOINTS.SERVICIOS}${servicioId}/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // ====================================
  // SERVICE CATALOG
  // ====================================

  /**
   * Get health service catalog
   */
  async getServiceCatalog(filters: { search?: string; category?: string } = {}): Promise<ServicioCatalogoResponse> {
    try {
      const queryString = buildQueryString(filters);
      const url = queryString ? `${ENDPOINTS.CATALOGO}?${queryString}` : ENDPOINTS.CATALOGO;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // ====================================
  // STATISTICS
  // ====================================

  /**
   * Get servicios statistics
   */
  async getStatistics(filters: ServicioFilters = {}): Promise<ServicioStatisticsResponse> {
    try {
      const queryString = buildQueryString(filters);
      const url = queryString ? `${ENDPOINTS.STATISTICS}?${queryString}` : ENDPOINTS.STATISTICS;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // ====================================
  // BULK OPERATIONS
  // ====================================

  /**
   * Bulk create servicios
   */
  async bulkCreateServicios(servicios: ServicioFormData[]): Promise<ServicioBulkResponse> {
    try {
      const response = await apiClient.post(ENDPOINTS.BULK_ACTION, {
        action: 'create',
        data: servicios,
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Bulk update servicios
   */
  async bulkUpdateServicios(updates: Array<Partial<SedeHealthService> & { id: string }>): Promise<ServicioBulkResponse> {
    try {
      const response = await apiClient.post(ENDPOINTS.BULK_ACTION, {
        action: 'update',
        data: updates,
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Bulk delete servicios
   */
  async bulkDeleteServicios(servicioIds: string[]): Promise<ServicioBulkResponse> {
    try {
      const response = await apiClient.post(ENDPOINTS.BULK_ACTION, {
        action: 'delete',
        ids: servicioIds,
      });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Duplicate servicios between sedes
   */
  async duplicateServicios(data: ServicioDuplicateFormData): Promise<ServicioBulkResponse> {
    try {
      const response = await apiClient.post(ENDPOINTS.DUPLICATE, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // ====================================
  // IMPORT/EXPORT OPERATIONS
  // ====================================

  /**
   * Import servicios from Excel file
   */
  async importServicios(config: ServicioImportConfig): Promise<ServicioImportResponse> {
    try {
      const formData = new FormData();
      formData.append('file', config.file);
      
      if (config.sede_id) {
        formData.append('sede_id', config.sede_id);
      }
      if (config.validate_only !== undefined) {
        formData.append('validate_only', String(config.validate_only));
      }
      if (config.update_existing !== undefined) {
        formData.append('update_existing', String(config.update_existing));
      }
      if (config.create_backup !== undefined) {
        formData.append('create_backup', String(config.create_backup));
      }

      const response = await apiClient.post(ENDPOINTS.IMPORT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes for large files
      });
      
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Export servicios to Excel or CSV
   */
  async exportServicios(format: 'csv' | 'excel', filters?: ServicioFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams({ format });
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }

      const response = await apiClient.get(`${ENDPOINTS.EXPORT}?${params.toString()}`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Download import template
   */
  async downloadImportTemplate(format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    try {
      const response = await apiClient.get(`${ENDPOINTS.TEMPLATE}?format=${format}`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // ====================================
  // UTILITY METHODS
  // ====================================

  /**
   * Validate import file without processing
   */
  async validateImportFile(file: File, sedeId?: string): Promise<ServicioImportResponse> {
    return this.importServicios({
      file,
      sede_id: sedeId,
      validate_only: true,
    });
  },

  /**
   * Get available sedes for service assignment
   */
  async getAvailableSedes(): Promise<Array<{ value: string; label: string }>> {
    try {
      // Use the correct headquarters endpoint from SOGCS
      const response = await apiClient.get('/api/sogcs/api/v1/headquarters/');
      return response.data.results.map((sede: any) => ({
        value: sede.id, // This should be the full UUID
        label: `${sede.reps_code || sede.codigo_sede || sede.id.slice(0, 8)} - ${sede.name || sede.nombre_sede}`,
      }));
    } catch (error) {
      handleApiError(error);
      // Return empty array as fallback
      return [];
    }
  },

  /**
   * Get service catalog options for forms
   */
  async getServiceCatalogOptions(category?: string): Promise<Array<{ value: string; label: string; category: string }>> {
    try {
      const filters = category ? { service_group_code: category } : {};
      const response = await this.getServiceCatalog(filters);
      
      return response.results.map((service) => ({
        value: service.id,
        label: `${service.service_code} - ${service.service_name}`,
        category: service.service_group_name,
      }));
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Search services by criteria
   */
  async searchServices(query: string, filters?: Partial<ServicioFilters>): Promise<ServicioListResponse> {
    return this.getServicios({
      search: query,
      ...filters,
    });
  },

  /**
   * Get services expiring soon
   */
  async getExpiringServices(days: number = 30): Promise<ServicioListResponse> {
    return this.getServicios({
      expiring_soon: true,
      // Additional filter for days would be handled by the backend
    });
  },

  /**
   * Get services by sede
   */
  async getServicesBySede(sedeId: string, filters?: Partial<ServicioFilters>): Promise<ServicioListResponse> {
    return this.getServicios({
      sede: sedeId,
      ...filters,
    });
  },
};

export default servicioService;