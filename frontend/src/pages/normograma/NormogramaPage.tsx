/**
 * Normograma Page for ZentraQMS Frontend
 *
 * Management page for QMS standards and documentation.
 */

import React, { useEffect } from "react";

const NormogramaPage: React.FC = () => {
  useEffect(() => {
    document.title = "Normograma | ZentraQMS";
  }, []);

  return (
    <React.Fragment>
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-sm-flex align-items-center justify-content-between">
            <h4 className="mb-sm-0">Normograma</h4>
            <div className="page-title-right">
              <ol className="breadcrumb m-0">
                <li className="breadcrumb-item">
                  <a href="/dashboard">Dashboard</a>
                </li>
                <li className="breadcrumb-item active">Normograma</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Documentos Normativos y Estándares</h4>
            </div>
            <div className="card-body">
              <div className="text-center py-5">
                <i className="ri-book-open-line display-4 text-muted"></i>
                <h5 className="mt-3">Módulo en Desarrollo</h5>
                <p className="text-muted">
                  La funcionalidad del normograma estará disponible
                  próximamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default NormogramaPage;
