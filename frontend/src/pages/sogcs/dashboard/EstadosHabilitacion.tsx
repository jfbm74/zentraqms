import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '../../../components/ui/Dropdown';
import { estadosHabilitacion } from './data/sogcsData';

const EstadosHabilitacion = () => {
    const [selectedFilter, setSelectedFilter] = useState("Todas las Sedes");
    
    const onChangeFilter = (filter: string) => {
        setSelectedFilter(filter);
    };

    return (
        <React.Fragment>
            <div className="col-xxl-4 col-md-6">
                <div className="card" style={{ minHeight: "500px", height: "100%" }}>
                    <div className="card-header align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Estados de Habilitación</h4>
                        <div className="flex-shrink-0">
                            <Dropdown className="card-header-dropdown">
                                <DropdownToggle className="text-reset dropdown-btn">
                                    <span className="text-muted">
                                        {selectedFilter}
                                        <i className="mdi mdi-chevron-down ms-1"></i>
                                    </span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-end">
                                    <DropdownItem onClick={() => onChangeFilter("Todas las Sedes")}>
                                        Todas las Sedes
                                    </DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("Sede Principal")}>
                                        Sede Principal
                                    </DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("Sedes Satélite")}>
                                        Sedes Satélite
                                    </DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("Último Mes")}>
                                        Último Mes
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>

                    <div className="card-body d-flex flex-column" style={{ flex: "1" }}>
                        <div className="row g-3 flex-grow-1">
                            {estadosHabilitacion.map((estado, index) => (
                                <div className="col-12" key={index}>
                                    <div className="border rounded p-3">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0">
                                                <div className="avatar-sm">
                                                    <span 
                                                        className="avatar-title rounded-circle fs-4" 
                                                        style={{ 
                                                            backgroundColor: `${estado.color}20`, 
                                                            color: estado.color 
                                                        }}
                                                    >
                                                        <i className={estado.icono}></i>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 className="mb-1">{estado.estado}</h6>
                                                        <p className="text-muted mb-0 fs-13">
                                                            {estado.cantidad} sedes ({estado.porcentaje}%)
                                                        </p>
                                                    </div>
                                                    <div className="text-end">
                                                        <h4 className="mb-0" style={{ color: estado.color }}>
                                                            {estado.cantidad}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <div className="progress progress-sm mt-2">
                                                    <div 
                                                        className="progress-bar" 
                                                        role="progressbar" 
                                                        style={{ 
                                                            width: `${estado.porcentaje}%`,
                                                            backgroundColor: estado.color
                                                        }}
                                                        aria-valuenow={estado.porcentaje} 
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
                        
                        {/* Resumen total */}
                        <div className="mt-3 pt-3 border-top">
                            <div className="d-flex justify-content-between">
                                <span className="fw-medium">Total de Sedes:</span>
                                <span className="fw-semibold">
                                    {estadosHabilitacion.reduce((total, estado) => total + estado.cantidad, 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default EstadosHabilitacion;