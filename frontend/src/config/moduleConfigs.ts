import { ModuleConfig } from '../components/layout/ModuleLayout';
import SubHeader from '../components/navigation/SubHeader';

// Configuraciones para cada módulo del sistema
export const moduleConfigs: Record<string, ModuleConfig> = {
  // Módulo SOGCS
  sogcs: {
    breadcrumb: {
      title: 'SOGCS',
      pageTitle: 'Sistema de Gestión de Calidad'
    },
    subheader: {
      component: SubHeader,
      props: {
        activeTab: 'dashboard' // Se puede sobrescribir desde la página
      }
    },
    pageContentClass: 'page-content sogcs-page-content'
  },

  // Módulo Dashboard Principal
  dashboard: {
    breadcrumb: {
      title: 'Dashboard',
      pageTitle: 'Panel Principal'
    },
    pageContentClass: 'page-content'
  },

  // Módulo de Organización
  organization: {
    breadcrumb: {
      title: 'Organización',
      pageTitle: 'Gestión Organizacional'
    },
    pageContentClass: 'page-content'
  },

  // Módulo de Organigramas
  organizational_chart: {
    breadcrumb: {
      title: 'Organigrama',
      pageTitle: 'Estructura Organizacional'
    },
    pageContentClass: 'page-content organizational-chart-content'
  },

  // Módulo de Procesos
  processes: {
    breadcrumb: {
      title: 'Procesos',
      pageTitle: 'Gestión de Procesos'
    },
    pageContentClass: 'page-content'
  },

  // Módulo de Auditorías
  audits: {
    breadcrumb: {
      title: 'Auditorías',
      pageTitle: 'Sistema de Auditorías'
    },
    pageContentClass: 'page-content'
  },

  // Módulo de Indicadores
  indicators: {
    breadcrumb: {
      title: 'Indicadores',
      pageTitle: 'Métricas y KPIs'
    },
    pageContentClass: 'page-content'
  },

  // Módulo de Normograma
  normogram: {
    breadcrumb: {
      title: 'Normograma',
      pageTitle: 'Marco Normativo'
    },
    pageContentClass: 'page-content'
  },

  // Perfil de Usuario
  profile: {
    breadcrumb: {
      title: 'Perfil',
      pageTitle: 'Mi Perfil'
    },
    pageContentClass: 'page-content'
  }
};

// Función helper para obtener la configuración de un módulo
export const getModuleConfig = (moduleName: string): ModuleConfig => {
  return moduleConfigs[moduleName] || moduleConfigs.dashboard;
};

// Función para crear configuración con override de props
export const createModuleConfig = (
  moduleName: string, 
  overrides?: Partial<ModuleConfig>
): ModuleConfig => {
  const baseConfig = getModuleConfig(moduleName);
  
  return {
    ...baseConfig,
    ...overrides,
    breadcrumb: {
      ...baseConfig.breadcrumb,
      ...(overrides?.breadcrumb || {})
    },
    subheader: overrides?.subheader || baseConfig.subheader
  };
};