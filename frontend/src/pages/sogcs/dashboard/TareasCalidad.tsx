import React, { useState } from 'react';
import { Link } from '../../../utils/SimpleRouter';
import { tareasCalidad } from './data/sogcsData';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '../../../components/ui/Dropdown';


const TareasCalidad = () => {
    const [selectedFilter, setSelectedFilter] = useState("Todas");
    
    const onChangeFilter = (filter: string) => {
        setSelectedFilter(filter);
    };

    const getPrioridadBadge = (prioridad: string) => {
        switch (prioridad) {
            case 'alta':
                return 'badge bg-danger-subtle text-danger';
            case 'media':
                return 'badge bg-warning-subtle text-warning';
            case 'baja':
                return 'badge bg-success-subtle text-success';
            default:
                return 'badge bg-secondary-subtle text-secondary';
        }
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'completado':
                return 'badge bg-success-subtle text-success';
            case 'en_progreso':
                return 'badge bg-primary-subtle text-primary';
            case 'pendiente':
                return 'badge bg-warning-subtle text-warning';
            default:
                return 'badge bg-secondary-subtle text-secondary';
        }
    };

    const getEstadoTexto = (estado: string) => {
        switch (estado) {
            case 'completado':
                return 'Completado';
            case 'en_progreso':
                return 'En Progreso';
            case 'pendiente':
                return 'Pendiente';
            default:
                return 'Sin Estado';
        }
    };

    const tareasCompletadas = tareasCalidad.filter(tarea => tarea.estado === 'completado').length;
    const totalTareas = tareasCalidad.length;

    return (
        <React.Fragment>
            <div className="col-xxl-8 col-md-6">
                <div className="card" style={{ minHeight: "500px", height: "100%" }}>
                    <div className="card-header align-items-center d-flex">
                        <h4 className="card-title mb-0 flex-grow-1">Tareas de Calidad</h4>
                        <div className="flex-shrink-0">
                            <Dropdown className="card-header-dropdown">
                                <DropdownToggle className="text-reset dropdown-btn">
                                    <span className="text-muted">
                                        <i className="ri-filter-3-line align-bottom me-1 fs-15"></i>
                                        Filtro: {selectedFilter}
                                    </span>
                                </DropdownToggle>
                                <DropdownMenu className="dropdown-menu-end">
                                    <DropdownItem onClick={() => onChangeFilter("Todas")}>Todas</DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("SUH")}>SUH</DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("PAMEC")}>PAMEC</DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("SIC")}>SIC</DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("SUA")}>SUA</DropdownItem>
                                    <hr className="dropdown-divider" />
                                    <DropdownItem onClick={() => onChangeFilter("Pendientes")}>Pendientes</DropdownItem>
                                    <DropdownItem onClick={() => onChangeFilter("En Progreso")}>En Progreso</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>

                    <div className="card-body p-0">
                        <div className="align-items-center p-3 justify-content-between d-flex">
                            <div className="flex-shrink-0">
                                <div className="text-muted">
                                    <span className="fw-semibold">{tareasCompletadas}</span> de{' '}
                                    <span className="fw-semibold">{totalTareas}</span> completadas
                                </div>
                            </div>
                            <button type="button" className="btn btn-sm btn-success">
                                <i className="ri-add-line align-middle me-1"></i> Nueva Tarea
                            </button>
                        </div>

                        <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                            <ul className="list-group list-group-flush border-dashed px-3">
                                {tareasCalidad.map((tarea, index) => (
                                    <li className="list-group-item ps-0" key={index}>
                                        <div className="d-flex align-items-start">
                                            <div className="form-check ps-0 flex-sharink-0">
                                                <input 
                                                    type="checkbox" 
                                                    className="form-check-input ms-0" 
                                                    id={`tarea-${tarea.id}`}
                                                    defaultChecked={tarea.estado === 'completado'}
                                                />
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <label 
                                                            className="form-check-label mb-1 ps-2 fw-medium" 
                                                            htmlFor={`tarea-${tarea.id}`}
                                                        >
                                                            {tarea.titulo}
                                                        </label>
                                                        <div className="ps-2">
                                                            <span className={getPrioridadBadge(tarea.prioridad) + " me-2"}>
                                                                {tarea.prioridad.charAt(0).toUpperCase() + tarea.prioridad.slice(1)}
                                                            </span>
                                                            <span className={getEstadoBadge(tarea.estado)}>
                                                                {getEstadoTexto(tarea.estado)}
                                                            </span>
                                                        </div>
                                                        <p className="text-muted fs-12 mb-0 ps-2 mt-1">
                                                            <i className="ri-user-line me-1"></i>
                                                            {tarea.responsable} • {tarea.categoria}
                                                        </p>
                                                    </div>
                                                    <div className="text-end">
                                                        <p className="text-muted fs-12 mb-0">
                                                            <i className="ri-calendar-line me-1"></i>
                                                            {new Date(tarea.fechaVencimiento).toLocaleDateString('es-CO', {
                                                                day: '2-digit',
                                                                month: 'short'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-3 pt-2">
                            <Link to="#" className="text-muted text-decoration-underline">
                                Ver todas las tareas...
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default TareasCalidad;