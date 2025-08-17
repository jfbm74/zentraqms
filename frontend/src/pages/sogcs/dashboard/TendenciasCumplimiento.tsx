import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '../../../components/ui/Dropdown';
// Note: tendenciasCumplimientoData will be used when chart integration is implemented

const TendenciasCumplimiento = () => {
    const [selectedPeriod, setSelectedPeriod] = useState("Último Año");
    
    const onChangePeriod = (period: string) => {
        setSelectedPeriod(period);
    };

    return (
        <React.Fragment>
            <div className="card">
                    <div className="card-header align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Tendencias de Cumplimiento SOGCS</h4>
                        <div className="flex-shrink-0">
                            <Dropdown className="card-header-dropdown">
                                <DropdownToggle className="text-reset dropdown-btn">
                                    <span className="fw-semibold text-uppercase fs-12">Período: </span>
                                    <span className="text-muted">
                                        {selectedPeriod}
                                        <i className="mdi mdi-chevron-down ms-1"></i>
                                    </span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-start">
                                    <DropdownItem onClick={() => onChangePeriod("Último Mes")} className={selectedPeriod === "Último Mes" ? "active" : ""}>
                                        Último Mes
                                    </DropdownItem>
                                    <DropdownItem onClick={() => onChangePeriod("Último Trimestre")} className={selectedPeriod === "Último Trimestre" ? "active" : ""}>
                                        Último Trimestre
                                    </DropdownItem>
                                    <DropdownItem onClick={() => onChangePeriod("Último Año")} className={selectedPeriod === "Último Año" ? "active" : ""}>
                                        Último Año
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="w-100">
                            {/* Aquí irá el gráfico de líneas con Chart.js o ApexCharts */}
                            <div className="d-flex align-items-center mb-3">
                                <h2 className="flex-grow-1 mb-0">
                                    <span className="counter-value text-success">87.5</span>
                                    <small className="text-muted fs-13 ms-2">% Promedio</small>
                                </h2>
                                <div className="flex-shrink-0">
                                    <i className="ri-arrow-up-circle-line text-success fs-18"></i>
                                    <span className="text-success fs-12 ms-1">+5.2%</span>
                                </div>
                            </div>
                            
                            {/* Resumen por componente */}
                            <div className="row g-2 mb-2">
                                <div className="col-6">
                                    <div className="p-2 border rounded">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0">
                                                <div className="avatar-xs">
                                                    <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-14">
                                                        <i className="ri-shield-check-line"></i>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-2">
                                                <p className="text-uppercase fw-medium text-muted mb-0 fs-11">SUH</p>
                                                <h6 className="mb-0 fs-13">92.5%</h6>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-2 border rounded">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0">
                                                <div className="avatar-xs">
                                                    <span className="avatar-title bg-success-subtle text-success rounded-circle fs-14">
                                                        <i className="ri-file-search-line"></i>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-2">
                                                <p className="text-uppercase fw-medium text-muted mb-0 fs-11">PAMEC</p>
                                                <h6 className="mb-0 fs-13">78.3%</h6>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-2 border rounded">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0">
                                                <div className="avatar-xs">
                                                    <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-14">
                                                        <i className="ri-bar-chart-line"></i>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-2">
                                                <p className="text-uppercase fw-medium text-muted mb-0 fs-11">SIC</p>
                                                <h6 className="mb-0 fs-13">95.1%</h6>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-2 border rounded">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0">
                                                <div className="avatar-xs">
                                                    <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-14">
                                                        <i className="ri-award-line"></i>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1 ms-2">
                                                <p className="text-uppercase fw-medium text-muted mb-0 fs-11">SUA</p>
                                                <h6 className="mb-0 fs-13">45.7%</h6>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        </React.Fragment>
    );
};

export default TendenciasCumplimiento;