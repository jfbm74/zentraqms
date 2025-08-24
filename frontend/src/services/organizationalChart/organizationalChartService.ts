/**
 * Servicio API para el módulo de organigramas organizacionales
 * ZentraQMS - Sistema de Gestión de Calidad
 * 
 * Consume los endpoints del backend:
 * - /api/organization/organizational-charts/
 * - /api/organization/sectors/
 * - /api/organization/orgchart-templates/
 * - /api/organization/areas/
 * - /api/organization/positions/
 */

import axios, { AxiosResponse } from 'axios';
import {
  OrganizationalChart,
  Sector,
  PlantillaOrganigrama,
  Area,
  Cargo,
  OrganizationalChartForm,
  PaginatedResponse,
  ChartValidationResponse,
  TemplateApplicationResponse,
  ExportOptions,
  ChartStatistics,
  ChartData,
  ChartNode
} from '../../types/organizationalChart';

// Base URL de la API
const API_BASE_URL = '/api/organization';

// ============================================================================
// CONFIGURACIÓN DE AXIOS
// ============================================================================

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

// ============================================================================
// SERVICIOS PARA SECTORES
// ============================================================================

export const sectorService = {
  /**
   * Obtener todos los sectores disponibles
   */
  async getAll(): Promise<Sector[]> {
    const response: AxiosResponse<PaginatedResponse<Sector>> = await axios.get(
      `${API_BASE_URL}/sectors/`
    );
    return response.data.results;
  },

  /**
   * Obtener un sector específico
   */
  async getById(id: string): Promise<Sector> {
    const response: AxiosResponse<Sector> = await axios.get(
      `${API_BASE_URL}/sectors/${id}/`
    );
    return response.data;
  },

  /**
   * Obtener normativas de un sector
   */
  async getNormativas(sectorId: string): Promise<any[]> {
    const response: AxiosResponse<PaginatedResponse<any>> = await axios.get(
      `${API_BASE_URL}/sector-normativas/?sector=${sectorId}`
    );
    return response.data.results;
  }
};

// ============================================================================
// SERVICIOS PARA PLANTILLAS
// ============================================================================

export const templateService = {
  /**
   * Obtener plantillas filtradas por sector
   */
  async getBySector(sectorId?: string, organizationType?: string): Promise<PlantillaOrganigrama[]> {
    let url = `${API_BASE_URL}/orgchart-templates/`;
    const params = new URLSearchParams();
    
    if (sectorId) params.append('sector', sectorId);
    if (organizationType) params.append('organization_type', organizationType);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response: AxiosResponse<PaginatedResponse<PlantillaOrganigrama>> = await axios.get(url);
    return response.data.results;
  },

  /**
   * Obtener una plantilla específica
   */
  async getById(id: string): Promise<PlantillaOrganigrama> {
    const response: AxiosResponse<PlantillaOrganigrama> = await axios.get(
      `${API_BASE_URL}/orgchart-templates/${id}/`
    );
    return response.data;
  },

  /**
   * Aplicar plantilla a una organización
   */
  async applyTemplate(templateId: string, organizationId: string): Promise<TemplateApplicationResponse> {
    const response: AxiosResponse<TemplateApplicationResponse> = await axios.post(
      `${API_BASE_URL}/orgchart-templates/${templateId}/apply/`,
      { organization_id: organizationId }
    );
    return response.data;
  },

  /**
   * Clonar plantilla
   */
  async cloneTemplate(templateId: string, newName: string): Promise<PlantillaOrganigrama> {
    const response: AxiosResponse<PlantillaOrganigrama> = await axios.post(
      `${API_BASE_URL}/orgchart-templates/${templateId}/clone/`,
      { name: newName }
    );
    return response.data;
  }
};

// ============================================================================
// SERVICIOS PARA ORGANIGRAMAS
// ============================================================================

export const organizationalChartService = {
  /**
   * Obtener todos los organigramas de una organización
   */
  async getByOrganization(organizationId: string): Promise<OrganizationalChart[]> {
    const response: AxiosResponse<PaginatedResponse<OrganizationalChart>> = await axios.get(
      `${API_BASE_URL}/organizational-charts/?organization=${organizationId}`
    );
    return response.data.results;
  },

  /**
   * Obtener organigrama actual de una organización
   */
  async getCurrent(organizationId: string): Promise<OrganizationalChart | null> {
    const response: AxiosResponse<PaginatedResponse<OrganizationalChart>> = await axios.get(
      `${API_BASE_URL}/organizational-charts/?organization=${organizationId}&is_current=true`
    );
    return response.data.results.length > 0 ? response.data.results[0] : null;
  },

  /**
   * Obtener un organigrama específico
   */
  async getById(id: string): Promise<OrganizationalChart> {
    const response: AxiosResponse<OrganizationalChart> = await axios.get(
      `${API_BASE_URL}/organizational-charts/${id}/`
    );
    return response.data;
  },

  /**
   * Crear nuevo organigrama
   */
  async create(data: OrganizationalChartForm & { organization: string; sector: string }): Promise<OrganizationalChart> {
    const response: AxiosResponse<OrganizationalChart> = await axios.post(
      `${API_BASE_URL}/organizational-charts/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar organigrama
   */
  async update(id: string, data: Partial<OrganizationalChartForm>): Promise<OrganizationalChart> {
    const response: AxiosResponse<OrganizationalChart> = await axios.patch(
      `${API_BASE_URL}/organizational-charts/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar organigrama
   */
  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/organizational-charts/${id}/`);
  },

  /**
   * Validar organigrama contra requisitos del sector
   */
  async validate(id: string): Promise<ChartValidationResponse> {
    const response: AxiosResponse<ChartValidationResponse> = await axios.post(
      `${API_BASE_URL}/organizational-charts/${id}/validate/`
    );
    return response.data;
  },

  /**
   * Aprobar organigrama
   */
  async approve(id: string, reason?: string): Promise<OrganizationalChart> {
    const response: AxiosResponse<OrganizationalChart> = await axios.post(
      `${API_BASE_URL}/organizational-charts/${id}/approve/`,
      { reason }
    );
    return response.data;
  },

  /**
   * Crear nueva versión del organigrama
   */
  async createNewVersion(id: string): Promise<OrganizationalChart> {
    const response: AxiosResponse<OrganizationalChart> = await axios.post(
      `${API_BASE_URL}/organizational-charts/${id}/create-version/`
    );
    return response.data;
  },

  /**
   * Obtener estadísticas del organigrama
   */
  async getStatistics(id: string): Promise<ChartStatistics> {
    const chart = await this.getById(id);
    const areas = await areaService.getByChart(id);
    const positions = await positionService.getByChart(id);

    // Calcular estadísticas
    const totalPositions = positions.length;
    const filledPositions = positions.filter(p => p.current_assignment).length;
    const vacantPositions = totalPositions - filledPositions;
    const vacancyRate = totalPositions > 0 ? (vacantPositions / totalPositions) * 100 : 0;
    const criticalPositions = positions.filter(p => p.is_critical).length;
    const temporaryPositions = positions.filter(p => p.position_type === 'TEMPORARY').length;

    return {
      total_positions: totalPositions,
      filled_positions: filledPositions,
      vacant_positions: vacantPositions,
      vacancy_rate: Number(vacancyRate.toFixed(2)),
      critical_positions: criticalPositions,
      temporary_positions: temporaryPositions,
      areas_count: areas.length,
      hierarchy_levels: chart.hierarchy_levels,
      compliance_score: chart.compliance_status?.summary?.score,
      last_updated: chart.updated_at!
    };
  }
};

// ============================================================================
// SERVICIOS PARA ÁREAS
// ============================================================================

export const areaService = {
  /**
   * Obtener todas las áreas de un organigrama
   */
  async getByChart(chartId: string): Promise<Area[]> {
    const response: AxiosResponse<PaginatedResponse<Area>> = await axios.get(
      `${API_BASE_URL}/areas/?organizational_chart=${chartId}`
    );
    return response.data.results;
  },

  /**
   * Obtener un área específica
   */
  async getById(id: string): Promise<Area> {
    const response: AxiosResponse<Area> = await axios.get(
      `${API_BASE_URL}/areas/${id}/`
    );
    return response.data;
  },

  /**
   * Crear nueva área
   */
  async create(data: Partial<Area>): Promise<Area> {
    const response: AxiosResponse<Area> = await axios.post(
      `${API_BASE_URL}/areas/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar área
   */
  async update(id: string, data: Partial<Area>): Promise<Area> {
    const response: AxiosResponse<Area> = await axios.patch(
      `${API_BASE_URL}/areas/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar área
   */
  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/areas/${id}/`);
  },

  /**
   * Crear múltiples áreas de una vez
   */
  async bulkCreate(areas: Partial<Area>[]): Promise<Area[]> {
    const response: AxiosResponse<Area[]> = await axios.post(
      `${API_BASE_URL}/areas/bulk-create/`,
      { areas }
    );
    return response.data;
  },

  /**
   * Obtener jerarquía de áreas como árbol
   */
  buildHierarchy(areas: Area[]): Area[] {
    const areaMap = new Map<string, Area>();
    const rootAreas: Area[] = [];

    // Inicializar todas las áreas con array de children vacío
    areas.forEach(area => {
      areaMap.set(area.id, { ...area, children: [] });
    });

    // Construir jerarquía
    areas.forEach(area => {
      const areaWithChildren = areaMap.get(area.id)!;
      
      if (area.parent_area) {
        const parent = areaMap.get(area.parent_area);
        if (parent) {
          parent.children!.push(areaWithChildren);
        }
      } else {
        rootAreas.push(areaWithChildren);
      }
    });

    return rootAreas;
  }
};

// ============================================================================
// SERVICIOS PARA CARGOS/POSICIONES
// ============================================================================

export const positionService = {
  /**
   * Obtener todos los cargos de un organigrama
   */
  async getByChart(chartId: string): Promise<Cargo[]> {
    const response: AxiosResponse<PaginatedResponse<Cargo>> = await axios.get(
      `${API_BASE_URL}/positions/?organizational_chart=${chartId}`
    );
    return response.data.results;
  },

  /**
   * Obtener cargos de un área específica
   */
  async getByArea(areaId: string): Promise<Cargo[]> {
    const response: AxiosResponse<PaginatedResponse<Cargo>> = await axios.get(
      `${API_BASE_URL}/positions/?area=${areaId}`
    );
    return response.data.results;
  },

  /**
   * Obtener un cargo específico
   */
  async getById(id: string): Promise<Cargo> {
    const response: AxiosResponse<Cargo> = await axios.get(
      `${API_BASE_URL}/positions/${id}/`
    );
    return response.data;
  },

  /**
   * Crear nuevo cargo
   */
  async create(data: Partial<Cargo>): Promise<Cargo> {
    const response: AxiosResponse<Cargo> = await axios.post(
      `${API_BASE_URL}/positions/`,
      data
    );
    return response.data;
  },

  /**
   * Actualizar cargo
   */
  async update(id: string, data: Partial<Cargo>): Promise<Cargo> {
    const response: AxiosResponse<Cargo> = await axios.patch(
      `${API_BASE_URL}/positions/${id}/`,
      data
    );
    return response.data;
  },

  /**
   * Eliminar cargo
   */
  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/positions/${id}/`);
  },

  /**
   * Crear múltiples cargos de una vez
   */
  async bulkCreate(positions: Partial<Cargo>[]): Promise<Cargo[]> {
    const response: AxiosResponse<Cargo[]> = await axios.post(
      `${API_BASE_URL}/positions/bulk-create/`,
      { positions }
    );
    return response.data;
  }
};

// ============================================================================
// SERVICIOS PARA VISUALIZACIÓN DE ORGANIGRAMAS
// ============================================================================

export const chartVisualizationService = {
  /**
   * Convertir datos del backend a formato d3-org-chart
   */
  async buildChartData(chartId: string): Promise<ChartData> {
    const [chart, areas, positions] = await Promise.all([
      organizationalChartService.getById(chartId),
      areaService.getByChart(chartId),
      positionService.getByChart(chartId)
    ]);

    // Crear mapa de áreas para fácil acceso
    const areaMap = new Map<string, Area>();
    areas.forEach(area => areaMap.set(area.id, area));

    // Convertir cargos a nodos para d3-org-chart
    const nodes: ChartNode[] = positions.map(position => {
      const area = areaMap.get(position.area);
      const user = position.assigned_user;

      return {
        id: position.id,
        parentId: position.reports_to || undefined,
        name: user?.full_name || 'Vacante',
        position: position.name,
        area: area?.name || 'Sin área',
        level: this.mapHierarchyLevelToNumber(position.hierarchy_level),
        
        user: user ? {
          id: user.id,
          name: user.full_name,
          email: user.email,
          photo: user.photo_url,
          initials: this.getInitials(user.full_name)
        } : undefined,
        
        isVacant: !position.current_assignment,
        isCritical: position.is_critical,
        isTemporary: position.position_type === 'TEMPORARY',
        isManager: position.is_management,
        
        description: position.description,
        department: area?.name || 'Sin departamento',
        directReports: 0, // Se calculará después
        hierarchyPath: area ? this.buildHierarchyPath(area, areas) : '',
        
        // Información de cumplimiento SOGCS si aplica
        compliance: chart.sector === 'HEALTH' ? {
          status: 'PENDING', // Se actualizará con validación real
          score: 85,
          issues: []
        } : undefined
      };
    });

    // Calcular direct reports
    nodes.forEach(node => {
      node.directReports = nodes.filter(n => n.parentId === node.id).length;
    });

    // Encontrar nodo raíz (sin parent)
    const rootNode = nodes.find(node => !node.parentId);
    if (!rootNode) {
      throw new Error('No se encontró nodo raíz en el organigrama');
    }

    return {
      nodes,
      root: rootNode,
      metadata: {
        organizationId: chart.organization,
        chartId: chart.id,
        version: chart.version,
        totalNodes: nodes.length,
        maxDepth: this.calculateMaxDepth(nodes),
        vacancyRate: this.calculateVacancyRate(nodes),
        complianceRate: chart.compliance_status?.summary?.score
      }
    };
  },

  /**
   * Mapear nivel jerárquico a número para ordenamiento
   */
  mapHierarchyLevelToNumber(level: string): number {
    const levelMap: Record<string, number> = {
      'BOARD': 1,
      'EXECUTIVE': 2,
      'SENIOR_MANAGEMENT': 3,
      'MIDDLE_MANAGEMENT': 4,
      'PROFESSIONAL': 5,
      'TECHNICAL': 6,
      'AUXILIARY': 7,
      'OPERATIONAL': 8
    };
    return levelMap[level] || 5;
  },

  /**
   * Obtener iniciales de un nombre
   */
  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  },

  /**
   * Construir ruta jerárquica de un área
   */
  buildHierarchyPath(area: Area, allAreas: Area[]): string {
    const path: string[] = [];
    const areaMap = new Map<string, Area>();
    allAreas.forEach(a => areaMap.set(a.id, a));

    let current: Area | undefined = area;
    while (current) {
      path.unshift(current.name);
      current = current.parent_area ? areaMap.get(current.parent_area) : undefined;
    }

    return path.join(' > ');
  },

  /**
   * Calcular profundidad máxima del árbol
   */
  calculateMaxDepth(nodes: ChartNode[]): number {
    let maxDepth = 0;
    
    const calculateDepth = (nodeId: string, currentDepth: number = 0): number => {
      const children = nodes.filter(n => n.parentId === nodeId);
      if (children.length === 0) return currentDepth;
      
      return Math.max(
        ...children.map(child => calculateDepth(child.id, currentDepth + 1))
      );
    };

    const rootNodes = nodes.filter(n => !n.parentId);
    rootNodes.forEach(root => {
      maxDepth = Math.max(maxDepth, calculateDepth(root.id));
    });

    return maxDepth;
  },

  /**
   * Calcular tasa de vacancia
   */
  calculateVacancyRate(nodes: ChartNode[]): number {
    const totalNodes = nodes.length;
    const vacantNodes = nodes.filter(n => n.isVacant).length;
    return totalNodes > 0 ? (vacantNodes / totalNodes) * 100 : 0;
  }
};

// ============================================================================
// SERVICIOS DE EXPORTACIÓN
// ============================================================================

export const exportService = {
  /**
   * Exportar organigrama como PDF
   */
  async exportToPdf(chartId: string, options: ExportOptions): Promise<Blob> {
    const response = await axios.post(
      `${API_BASE_URL}/organizational-charts/${chartId}/export/`,
      options,
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * Descargar archivo exportado
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  sector: sectorService,
  template: templateService,
  chart: organizationalChartService,
  area: areaService,
  position: positionService,
  visualization: chartVisualizationService,
  export: exportService
};