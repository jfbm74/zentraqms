import React, { useState } from 'react';
import { componentesSOGCS } from './data/sogcsData';

const ComponentesSOGCS = () => {
    const [selectedView, setSelectedView] = useState("Resumen General");
    
    const onChangeView = (view: string) => {
        setSelectedView(view);
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'activo':
                return 'badge bg-success-subtle text-success';
            case 'en_progreso':
                return 'badge bg-warning-subtle text-warning';
            case 'pendiente':
                return 'badge bg-danger-subtle text-danger';
            default:
                return 'badge bg-secondary-subtle text-secondary';
        }
    };

    const getEstadoTexto = (estado: string) => {
        switch (estado) {
            case 'activo':
                return 'Activo';
            case 'en_progreso':
                return 'En Progreso';
            case 'pendiente':
                return 'Pendiente';
            default:
                return 'Sin Estado';
        }
    };

    return (
        <div className="col-xxl-6 col-md-6">
            <div className="card card-height-100">
                <div className="card-header align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">Componentes SOGCS</h4>
                    <div className="flex-shrink-0">
                        <div className="dropdown">
                            <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Vista: {selectedView}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li><button className="dropdown-item" onClick={() => onChangeView("Resumen General")}>Resumen General</button></li>
                                <li><button className="dropdown-item" onClick={() => onChangeView("Por Estado")}>Por Estado</button></li>
                                <li><button className="dropdown-item" onClick={() => onChangeView("Por Cumplimiento")}>Por Cumplimiento</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        {componentesSOGCS.map((componente, index) => (
                            <div className="col-12" key={index}>
                                <div className="p-3 border rounded">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0">
                                            <div className="avatar-sm">
                                                <span 
                                                    className="avatar-title rounded-circle fs-2" 
                                                    style={{ 
                                                        backgroundColor: `${componente.color}20`, 
                                                        color: componente.color 
                                                    }}
                                                >
                                                    <i className={componente.icono}></i>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6 className="mb-1 fw-semibold">
                                                        {componente.componente}
                                                        <span className={getEstadoBadge(componente.estado) + " ms-2"}>
                                                            {getEstadoTexto(componente.estado)}
                                                        </span>
                                                    </h6>
                                                    <p className="text-muted mb-2 fs-13">{componente.nombre}</p>
                                                </div>
                                                <div className="text-end">
                                                    <h5 className="mb-0" style={{ color: componente.color }}>
                                                        {componente.cumplimiento}%
                                                    </h5>
                                                    <small className="text-muted">Cumplimiento</small>
                                                </div>
                                            </div>
                                            <div className="progress progress-sm mt-2">
                                                <div 
                                                    className="progress-bar" 
                                                    role="progressbar" 
                                                    style={{ 
                                                        width: `${componente.cumplimiento}%`,
                                                        backgroundColor: componente.color
                                                    }}
                                                    aria-valuenow={componente.cumplimiento} 
                                                    aria-valuemin={0} 
                                                    aria-valuemax={100}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComponentesSOGCS;