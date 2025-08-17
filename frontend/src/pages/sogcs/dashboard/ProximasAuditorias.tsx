import React from 'react';

const ProximasAuditorias = () => {
    return (
        <React.Fragment>
            <div className="col-xxl-6 col-md-6">
                <div className="card">
                    <div className="card-header align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Próximas Auditorías</h4>
                    </div>
                    <div className="card-body">
                        <div className="text-center py-4">
                            <i className="ri-shield-check-line display-4 text-muted"></i>
                            <h5 className="mt-3 text-muted">Componente en desarrollo</h5>
                            <p className="text-muted">Aquí se mostrarán las próximas auditorías programadas</p>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default ProximasAuditorias;