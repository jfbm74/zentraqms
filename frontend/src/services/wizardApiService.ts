/**
 * API Service for simplified organization wizard.
 * Handles all backend communication for organization creation and DIVIPOLA data.
 */

import axios, { AxiosResponse } from 'axios';
import { 
  Organization, 
  OrganizationFormData, 
  Department, 
  Municipality, 
  NitValidationResponse,
  OrganizationSummary,
  ApiResponse
} from '../types/wizard.types';
import { createAxiosInstance } from '../utils/httpInterceptors';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance using the main HTTP interceptor system
const apiClient = createAxiosInstance(API_BASE_URL, {
  timeout: 10000,
});

/**
 * Organization API Service
 */
export class OrganizationApiService {
  /**
   * Create a new organization
   */
  static async create(data: OrganizationFormData): Promise<Organization> {
    const formData = new FormData();
    
    // Append text fields
    formData.append('razon_social', data.razon_social);
    formData.append('nit', data.nit);
    formData.append('digito_verificacion', data.digito_verificacion);
    formData.append('email_contacto', data.email_contacto);
    formData.append('telefono_principal', data.telefono_principal);
    
    if (data.website) {
      formData.append('website', data.website);
    }
    if (data.descripcion) {
      formData.append('descripcion', data.descripcion);
    }
    
    // Append logo if present
    if (data.logo) {
      formData.append('logo', data.logo);
    }
    
    const response: AxiosResponse<ApiResponse<Organization>> = await apiClient.post(
      '/api/v1/wizard/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error creating organization');
    }
  }
  
  /**
   * Update an existing organization
   */
  static async update(id: string, data: Partial<OrganizationFormData>): Promise<Organization> {
    const formData = new FormData();
    
    // Append only provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'logo' && key !== 'logoPreview') {
        formData.append(key, String(value));
      }
    });
    
    // Append logo if present
    if (data.logo) {
      formData.append('logo', data.logo);
    }
    
    const response: AxiosResponse<ApiResponse<Organization>> = await apiClient.put(
      `/api/v1/wizard/${id}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error updating organization');
    }
  }
  
  /**
   * Validate NIT availability and format
   */
  static async validateNit(nit: string): Promise<{ available: boolean; message: string }> {
    const response: AxiosResponse<NitValidationResponse> = await apiClient.post(
      '/api/v1/wizard/validate_nit/',
      { nit }
    );
    
    if (response.data.success && response.data.data) {
      return {
        available: response.data.data.is_available,
        message: response.data.data.message,
      };
    } else {
      throw new Error('Error validating NIT');
    }
  }
  
  /**
   * Get organization summary
   */
  static async getSummary(id: string): Promise<OrganizationSummary> {
    const response: AxiosResponse<ApiResponse<OrganizationSummary>> = await apiClient.get(
      `/api/v1/wizard/${id}/summary/`
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Error getting organization summary');
    }
  }
}

/**
 * DIVIPOLA API Service
 */
export class DivipolaApiService {
  private static departmentCache: Department[] | null = null;
  private static municipalityCache: Map<string, Municipality[]> = new Map();
  
  /**
   * Get all Colombian departments
   */
  static async getDepartments(): Promise<Department[]> {
    // Return cached data if available
    if (this.departmentCache) {
      return this.departmentCache;
    }
    
    try {
      const response: AxiosResponse<ApiResponse<Department[]>> = await apiClient.get(
        '/api/v1/divipola/departments/'
      );
      
      if (response.data.success && response.data.data) {
        this.departmentCache = response.data.data;
        return this.departmentCache;
      } else {
        throw new Error(response.data.message || 'Error loading departments');
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      throw error;
    }
  }
  
  /**
   * Get municipalities for a specific department
   */
  static async getMunicipalities(departmentCode: string): Promise<Municipality[]> {
    // Return cached data if available
    if (this.municipalityCache.has(departmentCode)) {
      return this.municipalityCache.get(departmentCode)!;
    }
    
    try {
      const response: AxiosResponse<ApiResponse<Municipality[]>> = await apiClient.get(
        `/api/v1/divipola/municipalities/${departmentCode}/`
      );
      
      if (response.data.success && response.data.data) {
        const municipalities = response.data.data;
        this.municipalityCache.set(departmentCode, municipalities);
        return municipalities;
      } else {
        throw new Error(response.data.message || 'Error loading municipalities');
      }
    } catch (error) {
      console.error('Error loading municipalities:', error);
      throw error;
    }
  }
  
  /**
   * Search municipalities by name
   */
  static async searchMunicipalities(
    query: string, 
    departmentCode?: string
  ): Promise<Municipality[]> {
    try {
      const params = new URLSearchParams({ q: query });
      if (departmentCode) {
        params.append('department', departmentCode);
      }
      
      const response: AxiosResponse<ApiResponse<Municipality[]>> = await apiClient.get(
        `/api/v1/divipola/search_municipalities/?${params}`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error searching municipalities');
      }
    } catch (error) {
      console.error('Error searching municipalities:', error);
      throw error;
    }
  }
  
  /**
   * Get major Colombian cities
   */
  static async getMajorCities(): Promise<Municipality[]> {
    try {
      const response: AxiosResponse<ApiResponse<Municipality[]>> = await apiClient.get(
        '/api/v1/divipola/major_cities/'
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error loading major cities');
      }
    } catch (error) {
      console.error('Error loading major cities:', error);
      throw error;
    }
  }
  
  /**
   * Clear cache (useful for testing or forced refresh)
   */
  static clearCache(): void {
    this.departmentCache = null;
    this.municipalityCache.clear();
  }
}

/**
 * Error Handler for API responses
 */
export class WizardApiErrorHandler {
  static handle(error: any): { message: string; errors?: Record<string, string[]>; retryable: boolean } {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            return {
              message: 'Datos inválidos en el formulario',
              errors: data.errors || {},
              retryable: false,
            };
            
          case 401:
            return {
              message: 'Sesión expirada. Por favor inicia sesión nuevamente.',
              retryable: false,
            };
            
          case 403:
            return {
              message: 'No tienes permisos para realizar esta acción',
              retryable: false,
            };
            
          case 409:
            return {
              message: data.message || 'El recurso ya existe',
              retryable: false,
            };
            
          case 422:
            return {
              message: data.message || 'Error de validación',
              errors: data.errors || {},
              retryable: false,
            };
            
          case 500:
          case 502:
          case 503:
            return {
              message: 'Error del servidor. Por favor intenta más tarde.',
              retryable: true,
            };
            
          default:
            return {
              message: data.message || `Error ${status}: Error desconocido`,
              retryable: false,
            };
        }
      } else if (error.request) {
        return {
          message: 'Error de conexión. Verifica tu internet.',
          retryable: true,
        };
      }
    }
    
    return {
      message: 'Ha ocurrido un error inesperado',
      retryable: false,
    };
  }
}

// Export the configured axios instance for direct use if needed
export { apiClient };