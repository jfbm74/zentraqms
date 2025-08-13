import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const SimpleDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-sm-flex align-items-center justify-content-between">
            <h4 className="mb-sm-0">Dashboard</h4>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-xl-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">Bienvenido a ZentraQMS</h4>
            </div>
            <div className="card-body">
              <p>Hola, {user?.first_name || user?.email}!</p>
              <p>El dashboard se está cargando correctamente.</p>
              <div className="alert alert-success" role="alert">
                ✅ La autenticación y navegación funcionan correctamente
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;