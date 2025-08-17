import { useMemo } from 'react';
import { useLocation } from '../utils/SimpleRouter';
import { getModuleConfig, createModuleConfig } from '../config/moduleConfigs';
import { ModuleConfig } from '../components/layout/ModuleLayout';
import SubHeader from '../components/navigation/SubHeader';

// Hook para obtener automáticamente la configuración del módulo basada en la ruta
export const useModuleConfig = (
  moduleName?: string,
  overrides?: Partial<ModuleConfig>
): ModuleConfig => {
  const location = useLocation();

  const detectedModule = useMemo(() => {
    if (moduleName) return moduleName;

    // Detectar módulo basado en la ruta actual
    const path = location.pathname;
    
    if (path.startsWith('/sogcs')) return 'sogcs';
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/organization')) return 'organization';
    if (path.startsWith('/procesos')) return 'processes';
    if (path.startsWith('/auditorias')) return 'audits';
    if (path.startsWith('/indicadores')) return 'indicators';
    if (path.startsWith('/normograma')) return 'normogram';
    if (path.startsWith('/profile')) return 'profile';
    
    return 'dashboard'; // default
  }, [location.pathname, moduleName]);

  return useMemo(() => {
    if (overrides) {
      return createModuleConfig(detectedModule, overrides);
    }
    return getModuleConfig(detectedModule);
  }, [detectedModule, overrides]);
};

// Hook específico para SOGCS con configuración de tab activo
export const useSOGCSConfig = (activeTab: string = 'dashboard'): ModuleConfig => {
  return useModuleConfig('sogcs', {
    subheader: {
      component: SubHeader,
      props: { activeTab }
    }
  });
};