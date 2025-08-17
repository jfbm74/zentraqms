import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '../../../components/ui/Dropdown';
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
        <React.Fragment>
            <div className="col-xxl-6 col-md-6">
                <div className="card card-height-100">
                    <div className="card-header align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Componentes SOGCS</h4>
                        <div className="flex-shrink-0">
                            <Dropdown className="card-header-dropdown">
                                <DropdownToggle className="text-reset dropdown-btn">
                                    <span className="fw-semibold text-uppercase fs-12">Vista: </span>
                                    <span className="text-muted">
                                        {selectedView}
                                        <i className="mdi mdi-chevron-down ms-1"></i>
                                    </span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-end">
                                    <DropdownItem 
                                        onClick={() => onChangeView("Resumen General")} 
                                        className={selectedView === "Resumen General" ? "active" : ""}
                                    >
                                        Resumen General
                                    </DropdownItem>
                                    <DropdownItem 
                                        onClick={() => onChangeView("Por Estado")} 
                                        className={selectedView === "Por Estado" ? "active" : ""}
                                    >
                                        Por Estado
                                    </DropdownItem>
                                    <DropdownItem 
                                        onClick={() => onChangeView("Por Cumplimiento")} 
                                        className={selectedView === "Por Cumplimiento" ? "active" : ""}
                                    >
                                        Por Cumplimiento
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
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
        </React.Fragment>
    );
};

export default ComponentesSOGCS;