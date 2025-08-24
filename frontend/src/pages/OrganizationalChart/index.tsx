/**
 * Página principal del módulo de organigramas con layout integrado
 * Utiliza LayoutWithBreadcrumb para integración con la navegación existente
 * ZentraQMS - Sistema de Gestión de Calidad
 */

import React from 'react';
import { useLocation } from '../../utils/SimpleRouter';

// Layout y componentes
import LayoutWithBreadcrumb from '../../components/layout/LayoutWithBreadcrumb';
import SimpleOrganizationalChart from './SimpleOrganizationalChart';
import OrganizationalChartView from './OrganizationalChartView';
import { getModuleConfig } from '../../config/moduleConfigs';

// Tipos
interface OrganizationalChartPageProps {
  mode?: 'view' | 'edit' | 'create';
}

const OrganizationalChartPage: React.FC<OrganizationalChartPageProps> = ({
  mode = 'view'
}) => {
  
  const location = useLocation();
  const pathParts = location.pathname.split('/');
  const chartId = pathParts[pathParts.length - 1];
  
  // ============================================================================
  // CONFIGURACIÓN DEL MÓDULO
  // ============================================================================
  
  const getPageConfig = () => {
    const baseConfig = getModuleConfig('organizational_chart');
    
    // Personalizar configuración según el modo
    switch (mode) {
      case 'create':
        return {
          ...baseConfig,
          breadcrumb: {
            ...baseConfig.breadcrumb,
            pageTitle: 'Aplicar Template Organizacional',
            items: [
              { label: 'Organización', path: '/organization' },
              { label: 'Organigramas', path: '/organization/charts' },
              { label: 'Aplicar Template', path: '/organization/charts/new', active: true }
            ]
          }
        };
      
      case 'edit':
        return {
          ...baseConfig,
          breadcrumb: {
            ...baseConfig.breadcrumb,
            pageTitle: 'Editar Organigrama',
            items: [
              { label: 'Organización', path: '/organization' },
              { label: 'Organigramas', path: '/organization/charts' },
              { label: 'Editar', path: `/organization/charts/${chartId}/edit`, active: true }
            ]
          }
        };
      
      default:
        return {
          ...baseConfig,
          breadcrumb: {
            ...baseConfig.breadcrumb,
            items: [
              { label: 'Organización', path: '/organization' },
              { label: 'Organigrama', path: '/organization/chart', active: true }
            ]
          }
        };
    }
  };

  const pageConfig = getPageConfig();

  // ============================================================================
  // RENDERIZADO DEL CONTENIDO
  // ============================================================================

  const renderContent = () => {
    switch (mode) {
      case 'create':
        return (
          <div className="alert alert-info" role="alert">
            <h4>Funcionalidad de Creación</h4>
            <p>La funcionalidad de creación de organigramas estará disponible próximamente.</p>
          </div>
        );
      
      case 'edit':
        return (
          <div className="alert alert-info" role="alert">
            <h4>Funcionalidad de Edición</h4>
            <p>La funcionalidad de edición de organigramas estará disponible próximamente.</p>
          </div>
        );
      
      case 'view':
        return <SimpleOrganizationalChart />;
      
      default:
        return <OrganizationalChartView chartId={chartId} />;
    }
  };

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <LayoutWithBreadcrumb moduleConfig={pageConfig}>
      <div className="organizational-chart-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {renderContent()}
      </div>
    </LayoutWithBreadcrumb>
  );
};

// ============================================================================
// COMPONENTES ESPECÍFICOS PARA CADA MODO
// ============================================================================

/**
 * Página principal de visualización de organigrama
 */
export const OrganizationalChartMainPage: React.FC = () => {
  return <OrganizationalChartPage mode="view" />;
};

/**
 * Página de creación de organigrama
 */
export const OrganizationalChartCreatePage: React.FC = () => {
  return <OrganizationalChartPage mode="create" />;
};

/**
 * Página de edición de organigrama
 */
export const OrganizationalChartEditPage: React.FC = () => {
  return <OrganizationalChartPage mode="edit" />;
};

// Export por defecto la vista principal
export default OrganizationalChartMainPage;