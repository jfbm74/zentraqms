import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import BreadCrumb from '../common/BreadCrumb';
import { ModuleConfig } from './ModuleLayout';

interface LayoutWithBreadcrumbProps {
  children: React.ReactNode;
  moduleConfig: ModuleConfig;
}

const LayoutWithBreadcrumb: React.FC<LayoutWithBreadcrumbProps> = ({ 
  children, 
  moduleConfig 
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Monitor sidebar state by checking the layout wrapper class
  useEffect(() => {
    const checkSidebarState = () => {
      const layoutWrapper = document.getElementById('layout-wrapper');
      if (layoutWrapper) {
        setSidebarCollapsed(layoutWrapper.classList.contains('sidebar-collapsed'));
      }
    };

    // Check initial state
    checkSidebarState();

    // Set up MutationObserver to watch for class changes on layout-wrapper
    const layoutWrapper = document.getElementById('layout-wrapper');
    if (layoutWrapper) {
      const observer = new MutationObserver(checkSidebarState);
      observer.observe(layoutWrapper, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });

      return () => observer.disconnect();
    }
  }, []);

  // Calculate dynamic left positioning based on sidebar state
  const getLeftPosition = () => {
    if (window.innerWidth < 992) {
      // Mobile: always start from left edge
      return '0';
    }
    return sidebarCollapsed ? 'var(--vz-vertical-menu-width-sm)' : 'var(--vz-vertical-menu-width)';
  };

  // Calculate dynamic content padding
  const getContentHeight = () => {
    const baseHeight = 70; // Header height
    const breadcrumbHeight = 50; // Estimated breadcrumb height
    const subheaderHeight = moduleConfig.subheader ? 60 : 0; // Estimated subheader height
    return baseHeight + breadcrumbHeight + subheaderHeight;
  };

  return (
    <Layout>
      {/* Zona fija para breadcrumb y subheader - fuera del page-content */}
      <div 
        style={{
          position: 'fixed',
          top: 'var(--vz-header-height)', // Usar variable CSS para consistencia
          left: getLeftPosition(),
          right: '0',
          backgroundColor: 'var(--vz-body-bg)',
          borderBottom: '1px solid var(--vz-border-color)',
          zIndex: 998, // Debajo del header y sidebar, pero arriba del contenido
          padding: '0 1.5rem', // Consistent con el header padding
          transition: 'all 0.3s ease'
        }}
        className="breadcrumb-subheader-fixed"
      >
        {/* Breadcrumb */}
        <div style={{ paddingTop: '12px', paddingBottom: '8px' }}>
          <BreadCrumb 
            title={moduleConfig.breadcrumb.title} 
            pageTitle={moduleConfig.breadcrumb.pageTitle} 
          />
        </div>
        
        {/* SubHeader si está configurado */}
        {moduleConfig.subheader && (
          <div style={{ paddingBottom: '12px' }}>
            <moduleConfig.subheader.component {...(moduleConfig.subheader.props || {})} />
          </div>
        )}
      </div>

      {/* Contenido principal con padding dinámico para no superponerse */}
      <div 
        className="page-content" 
        style={{ 
          paddingTop: `${getContentHeight()}px`,
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingBottom: 'var(--vz-footer-height)'
        }}
      >
        <div className="container-fluid" style={{ padding: 0 }}>
          {children}
        </div>
      </div>
    </Layout>
  );
};

export default LayoutWithBreadcrumb;