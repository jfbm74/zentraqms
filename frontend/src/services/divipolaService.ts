/**
 * DIVIPOLA Service
 * 
 * Service for consuming Colombian administrative division data (departments and municipalities).
 */

import { api } from './api/endpoints';

export interface Department {
  code: string;
  name: string;
}

export interface Municipality {
  code: string;
  name: string;
  department?: string;
}

export interface DivipolaResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  error?: string;
}

export interface SearchMunicipalitiesResponse extends DivipolaResponse<Municipality> {
  query: string;
  department_filter: string | null;
}

class DivipolaService {
  private readonly baseUrl = '/api/organization/divipola';

  /**
   * Get all Colombian departments.
   */
  async getDepartments(): Promise<Department[]> {
    try {
      const response = await api.get<DivipolaResponse<Department>>(`${this.baseUrl}/departments/`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Error al obtener departamentos');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw new Error('Error al conectar con el servidor para obtener departamentos');
    }
  }

  /**
   * Get municipalities for a specific department.
   */
  async getMunicipalities(departmentCode: string): Promise<Municipality[]> {
    try {
      const response = await api.get<DivipolaResponse<Municipality>>(
        `${this.baseUrl}/municipalities/${departmentCode}/`
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Error al obtener municipios');
      }
    } catch (error) {
      console.error('Error fetching municipalities:', error);
      throw new Error('Error al conectar con el servidor para obtener municipios');
    }
  }

  /**
   * Search municipalities by name.
   */
  async searchMunicipalities(
    query: string, 
    departmentCode?: string
  ): Promise<Municipality[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (departmentCode) {
        params.append('department', departmentCode);
      }
      
      const response = await api.get<SearchMunicipalitiesResponse>(
        `${this.baseUrl}/search_municipalities/?${params.toString()}`
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Error al buscar municipios');
      }
    } catch (error) {
      console.error('Error searching municipalities:', error);
      throw new Error('Error al conectar con el servidor para buscar municipios');
    }
  }

  /**
   * Get major Colombian cities.
   */
  async getMajorCities(): Promise<Municipality[]> {
    try {
      const response = await api.get<DivipolaResponse<Municipality>>(`${this.baseUrl}/major_cities/`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Error al obtener ciudades principales');
      }
    } catch (error) {
      console.error('Error fetching major cities:', error);
      throw new Error('Error al conectar con el servidor para obtener ciudades principales');
    }
  }

  /**
   * Get department name by code.
   */
  async getDepartmentName(code: string): Promise<string | null> {
    try {
      const departments = await this.getDepartments();
      const department = departments.find(dept => dept.code === code);
      return department?.name || null;
    } catch (error) {
      console.error('Error getting department name:', error);
      return null;
    }
  }

  /**
   * Get municipality name by code.
   */
  async getMunicipalityName(code: string): Promise<string | null> {
    try {
      // Extract department code from municipality code (first 2 digits)
      const departmentCode = code.substring(0, 2);
      const municipalities = await this.getMunicipalities(departmentCode);
      const municipality = municipalities.find(muni => muni.code === code);
      return municipality?.name || null;
    } catch (error) {
      console.error('Error getting municipality name:', error);
      return null;
    }
  }
}

// Export singleton instance
export const divipolaService = new DivipolaService();
export default divipolaService;