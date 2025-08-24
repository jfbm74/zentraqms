/**
 * Tipos TypeScript para el módulo de organigramas organizacionales
 * ZentraQMS - Sistema de Gestión de Calidad
 * 
 * Basado en los modelos del backend en:
 * - backend/apps/organization/models/organizational_chart.py
 * - backend/apps/organization/models/organizational_structure.py
 */

import { BaseEntity } from '../auth.types';

// ============================================================================
// ENUMS Y CONSTANTES
// ============================================================================

export const SECTOR_CHOICES = [
  'HEALTH',
  'EDUCATION', 
  'MANUFACTURING',
  'SERVICES',
  'PUBLIC',
  'OTHER'
] as const;

export const AREA_TYPE_CHOICES = [
  'DIRECTION',
  'SUBDIRECTION', 
  'DEPARTMENT',
  'UNIT',
  'SERVICE',
  'SECTION',
  'OFFICE',
  'COMMITTEE',
  'WORKGROUP'
] as const;

export const HIERARCHY_LEVEL_CHOICES = [
  'BOARD',
  'EXECUTIVE',
  'SENIOR_MANAGEMENT',
  'MIDDLE_MANAGEMENT',
  'PROFESSIONAL',
  'TECHNICAL',
  'AUXILIARY',
  'OPERATIONAL'
] as const;

export const POSITION_TYPE_CHOICES = [
  'PERMANENT',
  'TEMPORARY',
  'CONTRACT',
  'CONSULTANT',
  'VOLUNTEER',
  'INTERN'
] as const;

export const TEMPLATE_COMPLEXITY = [
  'BASIC',
  'MEDIUM', 
  'HIGH'
] as const;

export const NORMATIVE_TYPE_CHOICES = [
  'LAW',
  'DECREE',
  'RESOLUTION',
  'CIRCULAR',
  'ISO_STANDARD',
  'STANDARD',
  'OTHER'
] as const;

// ============================================================================
// TIPOS BASE
// ============================================================================

export type SectorCode = typeof SECTOR_CHOICES[number];
export type AreaType = typeof AREA_TYPE_CHOICES[number];
export type HierarchyLevel = typeof HIERARCHY_LEVEL_CHOICES[number];
export type PositionType = typeof POSITION_TYPE_CHOICES[number];
export type TemplateComplexity = typeof TEMPLATE_COMPLEXITY[number];
export type NormativeType = typeof NORMATIVE_TYPE_CHOICES[number];

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

/**
 * Sector - Define sectores disponibles y su configuración base
 */
export interface Sector extends BaseEntity {
  code: SectorCode;
  name: string;
  description: string;
  default_config: {
    hierarchy_levels_default: number;
    requires_mandatory_committees: boolean;
    normative_validations: string[];
    mandatory_positions: string[];
    mandatory_committees: string[];
    applicable_standards: string[];
  };
  normative_requirements: string[];
  has_templates: boolean;
}

/**
 * Normativa del Sector - Requisitos normativos específicos por sector
 */
export interface SectorNormativa extends BaseEntity {
  sector: string; // UUID del sector
  code: string;
  name: string;
  description: string;
  normative_type: NormativeType;
  is_mandatory: boolean;
  is_current: boolean;
  requirements: string[];
}

/**
 * Plantilla de Organigrama - Estructuras predefinidas por sector
 */
export interface PlantillaOrganigrama extends BaseEntity {
  sector: string; // UUID del sector
  organization_type: string;
  name: string;
  description: string;
  complexity: TemplateComplexity;
  structure: {
    areas: Array<{
      code: string;
      name: string;
      type: AreaType;
      level: number;
      parent_code?: string;
    }>;
    positions: Array<{
      code: string;
      name: string;
      area_code: string;
      level: HierarchyLevel;
      is_critical: boolean;
      reporting_to?: string;
    }>;
    committees: Array<{
      code: string;
      name: string;
      type: 'MANDATORY' | 'OPTIONAL';
      members: string[];
    }>;
    hierarchy_levels: number;
  };
  times_used: number;
  last_used_date?: string;
}

/**
 * Organigrama Organizacional - Organigrama versionado multi-sector
 */
export interface OrganizationalChart extends BaseEntity {
  organization: string; // UUID de la organización
  sector: string; // UUID del sector
  organization_type: string;
  base_template?: string; // UUID de la plantilla base
  version: string;
  effective_date: string;
  end_date?: string;
  is_current: boolean;
  approved_by?: string; // UUID del usuario que aprobó
  approval_date?: string;
  approval_document?: string; // URL del documento
  hierarchy_levels: number;
  allows_temporary_positions: boolean;
  uses_raci_matrix: boolean;
  sector_config: {
    validations_active: string[];
    additional_committees: string[];
    special_positions: string[];
    applied_standards: string[];
    customizations: Record<string, any>;
  };
  last_validation_date?: string;
  compliance_status: {
    summary: {
      complies_with_regulations: boolean;
      critical_errors: number;
      warnings: number;
      score: number;
    };
    details: Array<{
      check: string;
      status: 'PASS' | 'FAIL' | 'WARNING';
      message: string;
    }>;
  };
  
  // Propiedades calculadas
  total_positions?: number;
  filled_positions?: number;
  vacancy_rate?: number;
  is_compliant?: boolean;
  has_critical_issues?: boolean;
}

/**
 * Área - Departamento o unidad organizacional
 */
export interface Area extends BaseEntity {
  organizational_chart: string; // UUID del organigrama
  code: string;
  name: string;
  area_type: AreaType;
  parent_area?: string; // UUID del área padre
  hierarchy_level: number;
  description: string;
  main_purpose: string;
  sede?: string; // UUID de la sede
  health_services: string[]; // UUIDs de servicios de salud
  managed_services: string[]; // UUIDs de servicios genéricos
  requires_license: boolean;
  is_revenue_generating: boolean;
  physical_location: string;
  area_m2?: number;
  capacity_persons?: number;
  area_manager?: string; // UUID del cargo responsable
  
  // Propiedades calculadas/adicionales para el frontend
  children?: Area[];
  positions?: Cargo[];
  total_positions?: number;
  hierarchy_path?: string;
  is_leaf?: boolean; // No tiene hijos
}

/**
 * Cargo - Posición dentro de la estructura organizacional
 */
export interface Cargo extends BaseEntity {
  area: string; // UUID del área
  code: string;
  name: string;
  hierarchy_level: HierarchyLevel;
  position_type: PositionType;
  reports_to?: string; // UUID del cargo superior
  description: string;
  main_purpose: string;
  grade_level: number;
  min_salary?: number;
  max_salary?: number;
  is_critical: boolean;
  is_management: boolean;
  allows_remote_work: boolean;
  travel_required: boolean;
  travel_percentage?: number;
  
  // Propiedades adicionales para el frontend
  current_assignment?: Assignment;
  direct_reports?: Cargo[];
  responsibilities?: Responsabilidad[];
  authorities?: Autoridad[];
  is_vacant?: boolean;
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
    photo_url?: string;
  };
}

/**
 * Responsabilidad - Deberes específicos de un cargo
 */
export interface Responsabilidad extends BaseEntity {
  cargo: string; // UUID del cargo
  description: string;
  category: 'PRIMARY' | 'SECONDARY' | 'OCCASIONAL';
  is_critical: boolean;
  requires_approval: boolean;
  estimated_time_percentage: number;
}

/**
 * Autoridad - Poderes de decisión y límites
 */
export interface Autoridad extends BaseEntity {
  cargo: string; // UUID del cargo
  authority_type: 'APPROVAL' | 'DECISION' | 'SUPERVISION' | 'AUTHORIZATION';
  description: string;
  scope: string;
  monetary_limit?: number;
  requires_higher_approval: boolean;
  delegation_allowed: boolean;
}

/**
 * Asignación - Asignación de usuario a cargo
 */
export interface Assignment extends BaseEntity {
  cargo: string; // UUID del cargo
  user: string; // UUID del usuario
  start_date: string;
  end_date?: string;
  assignment_type: 'PERMANENT' | 'TEMPORARY' | 'INTERIM';
  appointment_document?: string; // URL del documento
  is_current: boolean;
}

// ============================================================================
// TIPOS PARA COMPONENTES D3-ORG-CHART
// ============================================================================

/**
 * Nodo para d3-org-chart - Estructura optimizada para visualización
 */
export interface ChartNode {
  id: string;
  parentId?: string;
  name: string;
  position: string;
  area: string;
  level: number;
  
  // Información del usuario asignado
  user?: {
    id: string;
    name: string;
    email: string;
    photo?: string;
    initials: string;
  };
  
  // Estado del nodo
  isVacant: boolean;
  isCritical: boolean;
  isTemporary: boolean;
  isManager: boolean;
  
  // Información adicional
  description?: string;
  department: string;
  directReports: number;
  hierarchyPath: string;
  
  // Metadatos para d3
  expanded?: boolean;
  children?: ChartNode[];
  _children?: ChartNode[]; // Nodos colapsados
  
  // Información de cumplimiento SOGCS (para sector salud)
  compliance?: {
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'NOT_APPLICABLE';
    score: number;
    issues: string[];
  };
}

/**
 * Datos del organigrama para d3-org-chart
 */
export interface ChartData {
  nodes: ChartNode[];
  root: ChartNode;
  metadata: {
    organizationId: string;
    chartId: string;
    version: string;
    totalNodes: number;
    maxDepth: number;
    vacancyRate: number;
    complianceRate?: number;
  };
}

// ============================================================================
// TIPOS PARA FORMULARIOS Y ESTADO
// ============================================================================

/**
 * Datos para crear/editar organigrama
 */
export interface OrganizationalChartForm {
  organization_type: string;
  base_template?: string;
  hierarchy_levels: number;
  allows_temporary_positions: boolean;
  uses_raci_matrix: boolean;
  sector_config: {
    validations_active: string[];
    additional_committees: string[];
    special_positions: string[];
    applied_standards: string[];
    customizations: Record<string, any>;
  };
}

/**
 * Filtros para la vista de organigramas
 */
export interface ChartFilters {
  showVacantOnly?: boolean;
  showCriticalOnly?: boolean;
  areaFilter?: string;
  levelFilter?: HierarchyLevel;
  departmentFilter?: string;
  searchQuery?: string;
}

/**
 * Configuración de vista del organigrama
 */
export interface ChartViewConfig {
  layout: 'vertical' | 'horizontal';
  compactMode: boolean;
  showPhotos: boolean;
  showBadges: boolean;
  showHierarchyLines: boolean;
  zoomLevel: number;
  centerOnNode?: string;
}

// ============================================================================
// TIPOS PARA STORE/ESTADO
// ============================================================================

/**
 * Estado del store de organigramas
 */
export interface OrganizationalChartState {
  // Datos
  sectors: Sector[];
  templates: PlantillaOrganigrama[];
  currentChart?: OrganizationalChart;
  areas: Area[];
  positions: Cargo[];
  chartData?: ChartData;
  
  // Estado de carga
  loading: {
    sectors: boolean;
    templates: boolean;
    chart: boolean;
    areas: boolean;
    positions: boolean;
    saving: boolean;
  };
  
  // Errores
  errors: {
    load: string | null;
    save: string | null;
    validation: string | null;
  };
  
  // Configuración de vista
  viewConfig: ChartViewConfig;
  filters: ChartFilters;
  
  // Estado de edición
  editMode: boolean;
  hasUnsavedChanges: boolean;
  selectedNodeId?: string;
  
  // Acciones
  loadSectors: () => Promise<void>;
  loadTemplates: (sectorId?: string) => Promise<void>;
  loadChart: (chartId: string) => Promise<void>;
  loadAreas: (chartId: string) => Promise<void>;
  loadPositions: (chartId: string) => Promise<void>;
  
  createChart: (data: OrganizationalChartForm) => Promise<string>;
  updateChart: (chartId: string, data: Partial<OrganizationalChartForm>) => Promise<void>;
  deleteChart: (chartId: string) => Promise<void>;
  
  setViewConfig: (config: Partial<ChartViewConfig>) => void;
  setFilters: (filters: Partial<ChartFilters>) => void;
  setEditMode: (enabled: boolean) => void;
  selectNode: (nodeId?: string) => void;
  
  clearErrors: () => void;
  reset: () => void;
}

// ============================================================================
// TIPOS PARA API RESPONSES
// ============================================================================

/**
 * Respuesta paginada de la API
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Respuesta de validación de organigrama
 */
export interface ChartValidationResponse {
  valid: boolean;
  summary: {
    complies_with_regulations: boolean;
    critical_errors: number;
    warnings: number;
    score: number;
  };
  details: Array<{
    check: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    message: string;
  }>;
}

/**
 * Respuesta de aplicación de plantilla
 */
export interface TemplateApplicationResponse {
  success: boolean;
  chart_id: string;
  areas_created: number;
  positions_created: number;
  committees_created: number;
  warnings: string[];
}

/**
 * Opciones de exportación
 */
export interface ExportOptions {
  format: 'PDF' | 'PNG' | 'SVG' | 'JSON';
  includeMetadata: boolean;
  includeCompliance?: boolean;
  pageSize?: 'A4' | 'A3' | 'LETTER';
  orientation?: 'portrait' | 'landscape';
  quality?: number; // Para PNG, 1-100
}

/**
 * Estadísticas del organigrama
 */
export interface ChartStatistics {
  total_positions: number;
  filled_positions: number;
  vacant_positions: number;
  vacancy_rate: number;
  critical_positions: number;
  temporary_positions: number;
  areas_count: number;
  hierarchy_levels: number;
  compliance_score?: number;
  last_updated: string;
}