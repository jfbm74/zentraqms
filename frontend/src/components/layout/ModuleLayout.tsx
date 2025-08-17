import React from 'react';
import BreadCrumb from '../common/BreadCrumb';
import SubHeader from '../navigation/SubHeader';

// Configuración de módulos para breadcrumb y subheader
export interface ModuleConfig {
  // Breadcrumb configuration
  breadcrumb: {
    title: string;
    pageTitle: string;
  };
  // SubHeader configuration
  subheader?: {
    component: React.ComponentType<any>;
    props?: any;
  };
  // Page content styling
  pageContentClass?: string;
}

interface ModuleLayoutProps {
  module: ModuleConfig;
  children: React.ReactNode;
}

const ModuleLayout: React.FC<ModuleLayoutProps> = ({ module, children }) => {
  // Para pages que usan ModuleLayout directamente (como DashboardLayout), 
  // simplemente renderizamos el contenido sin breadcrumb/subheader
  // porque el DashboardLayout ya los maneja
  return (
    <div className="page-content">
      <div className="container-fluid">
        {/* Breadcrumb consistente */}
        <BreadCrumb 
          title={module.breadcrumb.title} 
          pageTitle={module.breadcrumb.pageTitle} 
        />
        
        {/* SubHeader si está configurado */}
        {module.subheader && (
          <module.subheader.component {...(module.subheader.props || {})} />
        )}
        
        {/* Contenido del módulo */}
        {children}
      </div>
    </div>
  );
};

export default ModuleLayout;