/**
 * Indicadores Page for ZentraQMS Frontend
 * 
 * Management page for QMS KPIs and metrics.
 */

import React, { useEffect } from 'react';

const IndicadoresPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Indicadores KPI | ZentraQMS';
  }, []);

  return (
    <React.Fragment>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-sm-flex align-items-center justify-content-between">
            <h4 className="mb-sm-0">Indicadores KPI</h4>
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
                <li className="breadcrumb-item active">Indicadores</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Indicadores Clave de Rendimiento</h4>
            </div>
            <div className="card-body">
              <div className="text-center py-5">
                <i className="ri-line-chart-line display-4 text-muted"></i>
                <h5 className="mt-3">Módulo en Desarrollo</h5>
                <p className="text-muted">La funcionalidad de indicadores KPI estará disponible próximamente.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default IndicadoresPage;