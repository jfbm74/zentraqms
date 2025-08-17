import React from 'react';

const CumplimientoOverview = () => {
    return (
        <React.Fragment>
            <div className="col-xxl-12 col-md-12">
                <div className="card">
                    <div className="card-header align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Resumen de Cumplimiento</h4>
                    </div>
                    <div className="card-body">
                        <div className="text-center py-4">
                            <i className="ri-bar-chart-box-line display-4 text-muted"></i>
                            <h5 className="mt-3 text-muted">Gráfico de cumplimiento en desarrollo</h5>
                            <p className="text-muted">Aquí se mostrará el gráfico general de cumplimiento SOGCS</p>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default CumplimientoOverview;