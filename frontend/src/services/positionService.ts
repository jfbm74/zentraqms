/**
 * Position Service - Gestión de Puestos (Cargos)
 * ZentraQMS - Sistema de Gestión de Calidad
 * 
 * Servicio para el CRUD completo de puestos organizacionales
 */

import axios, { AxiosResponse } from 'axios';
import { 
  Cargo, 
  PaginatedResponse, 
  HierarchyLevel, 
  PositionType 
} from '../types/organizationalChart';

// Base URL de la API
const API_BASE_URL = '/api/v1';

// Interceptor para incluir token de autenticación
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface PositionFilters {
  chart?: string;
  area?: string;
  hierarchy_level?: HierarchyLevel;
  position_type?: PositionType;
  is_critical?: boolean;
  is_vacant?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface CreatePositionRequest {
  area: string;
  code: string;
  name: string;
  hierarchy_level: HierarchyLevel;
  reports_to?: string;
  main_purpose: string;
  requirements?: Record<string, any>;
  is_critical: boolean;
  is_process_owner?: boolean;
  is_service_leader?: boolean;
  requires_professional_license?: boolean;
  requires_sst_license?: boolean;
  authorized_positions: number;
  salary_range_min?: number;
  salary_range_max?: number;
  position_type: PositionType;
}

export interface UpdatePositionRequest extends Partial<CreatePositionRequest> {}

export interface PositionAssignment {
  user: string;
  start_date: string;
  end_date?: string;
  assignment_type: 'PERMANENT' | 'TEMPORARY' | 'INTERIM';
  appointment_document?: string;
}

class PositionService {
  private baseUrl = `${API_BASE_URL}/positions`;

  /**
   * Obtiene lista paginada de posiciones con filtros
   */
  async getPositions(filters: PositionFilters = {}): Promise<PaginatedResponse<Cargo>> {
    const params = new URLSearchParams();
    
    // Agregar filtros como parámetros de query
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    console.log('=== GET POSITIONS DEBUG ===');
    console.log('Filters:', filters);
    console.log('Query params:', params.toString());
    console.log('API URL:', `${this.baseUrl}/?${params.toString()}`);

    const response: AxiosResponse<PaginatedResponse<Cargo>> = await axios.get(
      `${this.baseUrl}/?${params.toString()}`
    );

    console.log('API Response:', response.data);
    console.log('Positions found:', response.data.results.length);
    console.log('================================');

    return response.data;
  }

  /**
   * Obtiene una posición específica por ID
   */
  async getPosition(id: string): Promise<Cargo> {
    console.log('=== GET POSITION BY ID DEBUG ===');
    console.log('Position ID:', id);
    console.log('API URL:', `${this.baseUrl}/${id}/`);

    const response: AxiosResponse<Cargo> = await axios.get(`${this.baseUrl}/${id}/`);

    console.log('Position found:', response.data.name);
    console.log('================================');

    return response.data;
  }

  /**
   * Crea una nueva posición
   */
  async createPosition(positionData: CreatePositionRequest): Promise<Cargo> {
    console.log('=== CREATE POSITION DEBUG ===');
    console.log('Position data:', positionData);
    console.log('API URL:', `${this.baseUrl}/`);

    const response: AxiosResponse<Cargo> = await axios.post(this.baseUrl, positionData);

    console.log('Position created:', response.data.id);
    console.log('================================');

    return response.data;
  }

  /**
   * Actualiza una posición existente
   */
  async updatePosition(id: string, positionData: UpdatePositionRequest): Promise<Cargo> {
    console.log('=== UPDATE POSITION DEBUG ===');
    console.log('Position ID:', id);
    console.log('Update data:', positionData);
    console.log('API URL:', `${this.baseUrl}/${id}/`);

    const response: AxiosResponse<Cargo> = await axios.put(`${this.baseUrl}/${id}/`, positionData);

    console.log('Position updated:', response.data.id);
    console.log('================================');

    return response.data;
  }

  /**
   * Actualiza parcialmente una posición
   */
  async patchPosition(id: string, positionData: Partial<UpdatePositionRequest>): Promise<Cargo> {
    console.log('=== PATCH POSITION DEBUG ===');
    console.log('Position ID:', id);
    console.log('Patch data:', positionData);
    console.log('API URL:', `${this.baseUrl}/${id}/`);

    const response: AxiosResponse<Cargo> = await axios.patch(`${this.baseUrl}/${id}/`, positionData);

    console.log('Position patched:', response.data.id);
    console.log('================================');

    return response.data;
  }

  /**
   * Elimina una posición
   */
  async deletePosition(id: string): Promise<void> {
    console.log('=== DELETE POSITION DEBUG ===');
    console.log('Position ID:', id);
    console.log('API URL:', `${this.baseUrl}/${id}/`);

    await axios.delete(`${this.baseUrl}/${id}/`);

    console.log('Position deleted successfully');
    console.log('================================');
  }

  /**
   * Obtiene las posiciones disponibles como jefes para una posición específica
   */
  async getAvailableReportsTo(areaId?: string, excludeId?: string): Promise<Cargo[]> {
    const params = new URLSearchParams();
    
    if (areaId) params.append('area', areaId);
    if (excludeId) params.append('exclude', excludeId);
    params.append('can_supervise', 'true');

    const response: AxiosResponse<PaginatedResponse<Cargo>> = await axios.get(
      `${this.baseUrl}/?${params.toString()}`
    );

    return response.data.results;
  }

  /**
   * Obtiene los subordinados directos de una posición
   */
  async getDirectReports(positionId: string): Promise<Cargo[]> {
    const response: AxiosResponse<PaginatedResponse<Cargo>> = await axios.get(
      `${this.baseUrl}/?reports_to=${positionId}`
    );

    return response.data.results;
  }

  /**
   * Asigna un usuario a una posición
   */
  async assignUserToPosition(positionId: string, assignment: PositionAssignment): Promise<void> {
    console.log('=== ASSIGN USER TO POSITION DEBUG ===');
    console.log('Position ID:', positionId);
    console.log('Assignment data:', assignment);
    console.log('API URL:', `${this.baseUrl}/${positionId}/assign/`);

    await axios.post(`${this.baseUrl}/${positionId}/assign/`, assignment);

    console.log('User assigned successfully');
    console.log('================================');
  }

  /**
   * Desasigna un usuario de una posición
   */
  async unassignUserFromPosition(positionId: string, endDate?: string): Promise<void> {
    console.log('=== UNASSIGN USER FROM POSITION DEBUG ===');
    console.log('Position ID:', positionId);
    console.log('End date:', endDate);
    console.log('API URL:', `${this.baseUrl}/${positionId}/unassign/`);

    await axios.post(`${this.baseUrl}/${positionId}/unassign/`, { 
      end_date: endDate || new Date().toISOString().split('T')[0] 
    });

    console.log('User unassigned successfully');
    console.log('================================');
  }

  /**
   * Obtiene estadísticas de una posición específica
   */
  async getPositionStats(positionId: string): Promise<{
    current_assignments: number;
    vacancy_count: number;
    is_occupied: boolean;
    span_of_control: number;
    responsibilities_count: number;
    authorities_count: number;
  }> {
    const response: AxiosResponse<any> = await axios.get(`${this.baseUrl}/${positionId}/stats/`);
    return response.data;
  }

  /**
   * Valida si un código de posición está disponible en un área
   */
  async validatePositionCode(areaId: string, code: string, excludeId?: string): Promise<{
    available: boolean;
    message?: string;
  }> {
    const params = new URLSearchParams();
    params.append('area', areaId);
    params.append('code', code);
    if (excludeId) params.append('exclude', excludeId);

    try {
      const response: AxiosResponse<any> = await axios.get(`${this.baseUrl}/validate-code/?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        return {
          available: false,
          message: error.response?.data?.message || 'Código no disponible'
        };
      }
      throw error;
    }
  }

  /**
   * Obtiene posiciones por organigrama (método de conveniencia)
   */
  async getPositionsByChart(chartId: string): Promise<Cargo[]> {
    return this.getPositions({ chart: chartId }).then(response => response.results);
  }

  /**
   * Obtiene posiciones por área (método de conveniencia)
   */
  async getPositionsByArea(areaId: string): Promise<Cargo[]> {
    return this.getPositions({ area: areaId }).then(response => response.results);
  }

  /**
   * Busca posiciones por término de búsqueda
   */
  async searchPositions(query: string, filters: Omit<PositionFilters, 'search'> = {}): Promise<Cargo[]> {
    return this.getPositions({ ...filters, search: query }).then(response => response.results);
  }
}

// Instancia singleton del servicio
const positionService = new PositionService();
export default positionService;