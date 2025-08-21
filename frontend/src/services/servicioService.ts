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
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
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
        headquarters: data.sede, // Map sede to headquarters
        service_code: serviceCatalog.service_code,
        service_name: serviceCatalog.service_name,
        service_group_code: serviceCatalog.service_group_code,
        service_group_name: serviceCatalog.service_group_name,
        distinctive_number: `${data.sede}-${serviceCatalog.service_code}-${Date.now()}`, // Generate unique number
        
        // Map modalities
        ambulatory: data.modality === 'intramural' ? 'SI' : 'NO',
        hospital: data.modality === 'intramural' ? 'SI' : 'NO', 
        mobile_unit: data.modality === 'extramural' ? 'SI' : 'NO',
        domiciliary: data.modality === 'atencion_domiciliaria' ? 'SI' : 'NO',
        
        // Map complexity
        low_complexity: data.complexity === 'baja' ? 'SI' : 'NO',
        medium_complexity: data.complexity === 'media' ? 'SI' : 'NO',
        high_complexity: data.complexity === 'alta' ? 'SI' : 'NO',
        complexity_level: data.complexity === 'baja' ? 'BAJA' : data.complexity === 'media' ? 'MEDIANA' : 'ALTA',
        
        // Map other fields
        installed_capacity: data.capacity || 1,
        opening_date: data.authorization_date || new Date().toISOString().split('T')[0],
        is_enabled: data.status === 'activo',
        observations: data.observation || '',
        
        // Default values for required fields
        is_reference_center: 'NO',
        is_referring_institution: 'NO',
        intramural_modality: true,
        telemedicine_modality: data.modality === 'telemedicina' ? 'SI' : 'NO',
        schedule: data.operating_hours || '08:00-17:00',
        norm_version: 'RES_3100_2019',
        manager_name: 'Administrador',
        is_pdet_municipality: false,
        is_zomac_municipality: false,
        is_pnis_municipality: false,
      };
      
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
        value: sede.id,
        label: `${sede.codigo_sede || sede.id} - ${sede.nombre_sede || sede.name}`,
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