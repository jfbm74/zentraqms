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
            pageTitle: 'Crear Organigrama',
            items: [
              { label: 'Organización', path: '/organization' },
              { label: 'Organigramas', path: '/organization/charts' },
              { label: 'Crear', path: '/organization/charts/new', active: true }
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
        // TODO: Implementar wizard de creación
        return (
          <div className="alert alert-info">
            <h5 className="alert-heading">Funcionalidad en desarrollo</h5>
            <p>El wizard de creación de organigramas estará disponible próximamente.</p>
          </div>
        );
      
      case 'edit':
        // TODO: Implementar vista de edición
        return (
          <div className="alert alert-info">
            <h5 className="alert-heading">Funcionalidad en desarrollo</h5>
            <p>El editor de organigramas estará disponible próximamente.</p>
          </div>
        );
      
      default:
        return <OrganizationalChartView chartId={chartId} />;
    }
  };

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <LayoutWithBreadcrumb moduleConfig={pageConfig}>
      <div className="organizational-chart-page">
        {renderContent()}
        
        {/* Estilos específicos del módulo */}
        <style jsx>{`
          .organizational-chart-page {
            height: 100%;
            display: flex;
            flex-direction: column;
          }

          .organizational-chart-page :global(.page-content) {
            padding: 0;
            height: calc(100vh - var(--header-height, 70px) - var(--breadcrumb-height, 60px));
          }

          .organizational-chart-page :global(.organizational-chart-content) {
            background: #f8f9fa;
          }

          /* Ajustes para el layout del organigrama */
          .organizational-chart-page :global(.organizational-chart-view) {
            height: 100%;
          }

          .organizational-chart-page :global(.chart-header) {
            border-top: none;
          }

          .organizational-chart-page :global(.chart-layout) {
            height: calc(100% - 140px); /* Ajustar según altura del header */
          }

          /* Responsive adjustments */
          @media (max-width: 992px) {
            .organizational-chart-page :global(.page-content) {
              height: calc(100vh - var(--header-height, 70px) - var(--breadcrumb-height, 60px) - var(--mobile-padding, 20px));
            }
          }
        `}</style>
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
  return <SimpleOrganizationalChart />;
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