import React from 'react';

const CumplimientoOverview = () => {
    return (
        <React.Fragment>
            <div className="card">
                    <div className="card-header align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Resumen de Cumplimiento</h4>
                        <div className="flex-shrink-0">
                            <select className="form-select form-select-sm" style={{ minWidth: '120px' }}>
                                <option value="mensual">Mensual</option>
                                <option value="trimestral">Trimestral</option>
                                <option value="anual" selected>Anual</option>
                            </select>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="text-center py-4">
                            <i className="ri-bar-chart-box-line display-4 text-muted"></i>
                            <h5 className="mt-3 text-muted">Gráfico de cumplimiento en desarrollo</h5>
                            <p className="text-muted">Aquí se mostrará el gráfico general de cumplimiento SOGCS</p>
                        </div>
                    </div>
                </div>
        </React.Fragment>
    );
};

export default CumplimientoOverview;