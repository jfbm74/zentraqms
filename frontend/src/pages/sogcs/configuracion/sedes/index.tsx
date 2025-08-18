import React from 'react';
import { useSOGCSConfig } from '../../../../hooks/useModuleConfig';
import LayoutWithBreadcrumb from '../../../../components/layout/LayoutWithBreadcrumb';

const SedesPage = () => {
  document.title = "Sedes - SOGCS | ZentraQMS";
  
  // Usar el hook específico para SOGCS con tab 'configuracion' activo
  const moduleConfig = useSOGCSConfig('configuracion');

  return (
    <LayoutWithBreadcrumb moduleConfig={moduleConfig}>
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center p-5">
              <div className="avatar-lg mx-auto mb-4">
                <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                  <i className="ri-building-line"></i>
                </div>
              </div>
              <h4 className="mb-3">Gestión de Sedes</h4>
              <p className="text-muted mb-0">
                Página en desarrollo para la gestión de sedes en el módulo SOGCS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LayoutWithBreadcrumb>
  );
};

export default SedesPage;