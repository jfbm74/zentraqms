/**
 * Índice de exportación para componentes de organigramas organizacionales
 * ZentraQMS - Sistema de Gestión de Calidad
 */

// Componentes principales
export { default as OrganizationalChart } from './OrganizationalChart';
export { default as EmployeeCard } from './EmployeeCard';
export { default as DepartmentNavigation } from './DepartmentNavigation';
export { default as ChartControls } from './ChartControls';
export { default as ComplianceIndicator } from './ComplianceIndicator';

// Modales
export { default as PositionFormModal } from './modals/PositionFormModal';
export { default as AssignUserModal } from './modals/AssignUserModal';

// Wizard
export { default as OrganizationalChartWizard } from './wizard/OrganizationalChartWizard';

// Tipos
export * from '../../types/organizationalChart';

// Servicios
export { default as organizationalChartService } from '../../services/organizationalChart/organizationalChartService';

// Store
export * from '../../stores/organizationalChart/organizationalChartStore';

// Hooks especializados para organigramas
export {
  useOrganizationalChartStore,
  useOrganizationalChartLoading,
  useOrganizationalChartErrors,
  useCurrentChart,
  useChartViewSettings,
  useChartEditMode
} from '../../stores/organizationalChart/organizationalChartStore';