import React from 'react';
import Layout from './components/layout/Layout';
import './components/layout/layout.css';

function App() {
  return (
    <Layout>
      {/* Dashboard temporal - esto será reemplazado por routing */}
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-sm-flex align-items-center justify-content-between">
            <h4 className="mb-sm-0">Dashboard</h4>
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item"><a href="/">ZentraQMS</a></li>
                <li className="breadcrumb-item active">Dashboard</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-3 col-md-6">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                    Procesos Activos
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                    <span>24</span>
                  </h4>
                  <span className="badge bg-success-subtle text-success mb-0">
                    <i className="ri-arrow-up-line align-middle"></i> +16.24%
                  </span>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title bg-primary-subtle rounded fs-3">
                    📋
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                    Auditorías Pendientes
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                    <span>7</span>
                  </h4>
                  <span className="badge bg-warning-subtle text-warning mb-0">
                    <i className="ri-arrow-right-line align-middle"></i> 0.00%
                  </span>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title bg-warning-subtle rounded fs-3">
                    🔍
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                    Documentos Normativos
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                    <span>156</span>
                  </h4>
                  <span className="badge bg-info-subtle text-info mb-0">
                    <i className="ri-arrow-up-line align-middle"></i> +5.02%
                  </span>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title bg-info-subtle rounded fs-3">
                    📚
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card card-animate">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1 overflow-hidden">
                  <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                    Indicadores KPI
                  </p>
                </div>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-4">
                <div>
                  <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                    <span>12</span>
                  </h4>
                  <span className="badge bg-success-subtle text-success mb-0">
                    <i className="ri-arrow-up-line align-middle"></i> +2.65%
                  </span>
                </div>
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title bg-success-subtle rounded fs-3">
                    📈
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">¡Bienvenido a ZentraQMS!</h4>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Sistema de Gestión de Calidad desarrollado para optimizar sus procesos organizacionales.
              </p>
              <div className="row">
                <div className="col-md-4">
                  <h6>✅ Gestión de Procesos</h6>
                  <p className="text-muted fs-13">Documentación y control de procesos organizacionales</p>
                </div>
                <div className="col-md-4">
                  <h6>📋 Auditorías</h6>
                  <p className="text-muted fs-13">Planificación y seguimiento de auditorías internas</p>
                </div>
                <div className="col-md-4">
                  <h6>📊 Indicadores</h6>
                  <p className="text-muted fs-13">Monitoreo de KPIs y métricas de gestión</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App
