import React, { useState } from 'react';
import { Link } from '../../../utils/SimpleRouter';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '../../../components/ui/Dropdown';
import { proximasActividades } from './data/sogcsData';

const ProximasActividades = () => {
    const [selectedFilter, setSelectedFilter] = useState("Todas");
    
    const onChangeFilter = (filter: string) => {
        setSelectedFilter(filter);
    };

    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case 'auditoria':
                return 'ri-shield-check-line';
            case 'capacitacion':
                return 'ri-graduation-cap-line';
            case 'revision':
                return 'ri-file-search-line';
            case 'entrega':
                return 'ri-file-upload-line';
            default:
                return 'ri-calendar-event-line';
        }
    };

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'auditoria':
                return 'bg-danger-subtle text-danger';
            case 'capacitacion':
                return 'bg-primary-subtle text-primary';
            case 'revision':
                return 'bg-warning-subtle text-warning';
            case 'entrega':
                return 'bg-success-subtle text-success';
            default:
                return 'bg-secondary-subtle text-secondary';
        }
    };

    const formatFecha = (fechaStr: string) => {
        const fecha = new Date(fechaStr);
        return {
            dia: fecha.getDate().toString().padStart(2, '0'),
            mes: fecha.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase()
        };
    };

    return (
        <React.Fragment>
            <div className="col-xxl-6 col-md-6">
                <div className="card">
                    <div className="card-header align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Próximas Actividades</h4>
                        <div className="flex-shrink-0">
                            <Dropdown className="card-header-dropdown">
                                <DropdownToggle className="text-reset dropdown-btn">
                                    <span className="text-muted">
                                        <i className="ri-filter-3-line align-bottom me-1 fs-15"></i>
                                        {selectedFilter}
                                    </span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu dropdown-menu-end">
                                    <DropdownItem onClick={() => onChangeFilter("Todas")}>Todas</DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("Auditorías")}>Auditorías</DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("Capacitaciones")}>Capacitaciones</DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("Revisiones")}>Revisiones</DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("Entregas")}>Entregas</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        <ul className="list-group list-group-flush border-dashed">
                            {proximasActividades.map((actividad, index) => {
                                const fechaFormateada = formatFecha(actividad.fecha);
                                return (
                                    <li className="list-group-item ps-0" key={index}>
                                        <div className="row align-items-center g-3">
                                            <div className="col-auto">
                                                <div className="avatar-sm p-1 py-2 h-auto bg-light rounded-3 material-shadow">
                                                    <div className="text-center">
                                                        <h5 className="mb-0">{fechaFormateada.dia}</h5>
                                                        <div className="text-muted fs-11">{fechaFormateada.mes}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col">
                                                <h5 className="text-muted mt-0 mb-1 fs-13">
                                                    <i className="ri-time-line me-1"></i>
                                                    {actividad.hora}
                                                </h5>
                                                <Link to="#" className="text-reset fs-14 mb-1 fw-medium">
                                                    {actividad.titulo}
                                                </Link>
                                                <div className="d-flex align-items-center gap-2 mt-1">
                                                    <span className={`badge ${getTipoColor(actividad.tipo)} fs-11`}>
                                                        <i className={`${getTipoIcon(actividad.tipo)} me-1`}></i>
                                                        {actividad.tipo.charAt(0).toUpperCase() + actividad.tipo.slice(1)}
                                                    </span>
                                                </div>
                                                <p className="text-muted fs-12 mb-0 mt-1">
                                                    <i className="ri-map-pin-line me-1"></i>
                                                    {actividad.ubicacion}
                                                </p>
                                            </div>
                                            <div className="col-sm-auto text-end">
                                                <div className="text-muted fs-12 mb-1">
                                                    <i className="ri-user-line me-1"></i>
                                                    Responsable
                                                </div>
                                                <div className="fw-medium fs-13">
                                                    {actividad.responsable}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="align-items-center mt-3 row g-3 text-center text-sm-start">
                            <div className="col-sm">
                                <div className="text-muted">
                                    Mostrando <span className="fw-semibold">{proximasActividades.length}</span> de{' '}
                                    <span className="fw-semibold">{proximasActividades.length}</span> actividades
                                </div>
                            </div>
                            <div className="col-sm-auto">
                                <Link to="#" className="btn btn-sm btn-primary">
                                    <i className="ri-calendar-event-line me-1"></i>
                                    Ver Calendario
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default ProximasActividades;