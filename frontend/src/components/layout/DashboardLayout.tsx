import React from 'react';
import Layout from './Layout';
import ModuleLayout, { ModuleConfig } from './ModuleLayout';
import { useModuleConfig } from '../../hooks/useModuleConfig';

interface DashboardLayoutProps {
  children: React.ReactNode;
  moduleName?: string;
  moduleOverrides?: Partial<ModuleConfig>;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  moduleName,
  moduleOverrides 
}) => {
  const moduleConfig = useModuleConfig(moduleName, moduleOverrides);

  return (
    <Layout>
      <ModuleLayout module={moduleConfig}>
        {children}
      </ModuleLayout>
    </Layout>
  );
};

export default DashboardLayout;