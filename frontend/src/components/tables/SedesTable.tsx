/**
 * Sedes Table Component (Professional Velzon Style)
 *
 * Displays sedes in a responsive table with sorting, filtering, selection,
 * and action capabilities using native HTML with Bootstrap classes
 */
import React, { useState } from "react";
import type {
  SedesTableProps,
  SedeListItem,
  SedeFilters,
  TableSortConfig,
} from "../../types/sede.types";

const SedesTable: React.FC<SedesTableProps> = ({
  sedes,
  loading = false,
  onEdit,
  onDelete,
  onViewServices,
  selectedSedes = [],
  onSelectionChange,
  filters,
  onFiltersChange,
}) => {
  const [sortConfig, setSortConfig] = useState<TableSortConfig>({
    field: 'created_at',
    direction: 'desc',
  });

  // Handle sorting
  const handleSort = (field: keyof SedeListItem) => {
    const direction = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ field, direction });
    
    if (onFiltersChange) {
      onFiltersChange({ 
        ...filters, 
        ordering: `${direction === 'desc' ? '-' : ''}${field}`
      });
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? sedes.map(sede => sede.id) : []);
    }
  };

  // Handle individual selection
  const handleSelectSede = (sedeId: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked 
        ? [...selectedSedes, sedeId]
        : selectedSedes.filter(id => id !== sedeId);
      onSelectionChange(newSelection);
    }
  };

  // Get sort icon
  const getSortIcon = (field: keyof SedeListItem) => {
    if (sortConfig.field !== field) {
      return <i className="ri-expand-up-down-line text-muted" aria-hidden="true"></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="ri-arrow-up-s-line text-primary" aria-hidden="true"></i>
      : <i className="ri-arrow-down-s-line text-primary" aria-hidden="true"></i>;
  };

  // Get estado badge class
  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'activa':
        return 'bg-success-subtle text-success';
      case 'inactiva':
        return 'bg-secondary-subtle text-secondary';
      case 'suspendida':
        return 'bg-warning-subtle text-warning';
      case 'en_proceso':
        return 'bg-info-subtle text-info';
      case 'cerrada':
        return 'bg-danger-subtle text-danger';
      default:
        return 'bg-light text-muted';
    }
  };

  // Get tipo sede icon
  const getTipoSedeIcon = (tipo: string) => {
    switch (tipo) {
      case 'principal':
        return 'ri-building-4-line';
      case 'sucursal':
        return 'ri-building-line';
      case 'ambulatoria':
        return 'ri-walk-line';
      case 'hospitalaria':
        return 'ri-hospital-line';
      case 'administrativa':
        return 'ri-briefcase-line';
      case 'diagnostico':
        return 'ri-microscope-line';
      case 'urgencias':
        return 'ri-alarm-warning-line';
      default:
        return 'ri-building-line';
    }
  };

  // Format estado for display
  const formatEstado = (estado: string) => {
    const estados = {
      'activa': 'Activa',
      'inactiva': 'Inactiva',
      'suspendida': 'Suspendida',
      'en_proceso': 'En Proceso',
      'cerrada': 'Cerrada',
    };
    return estados[estado as keyof typeof estados] || estado;
  };

  // Format tipo for display
  const formatTipo = (tipo: string) => {
    const tipos = {
      'principal': 'Principal',
      'sucursal': 'Sucursal',
      'ambulatoria': 'Ambulatoria',
      'hospitalaria': 'Hospitalaria',
      'administrativa': 'Administrativa',
      'diagnostico': 'Diagnóstico',
      'urgencias': 'Urgencias',
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  const isAllSelected = sedes.length > 0 && selectedSedes.length === sedes.length;
  const isPartiallySelected = selectedSedes.length > 0 && selectedSedes.length < sedes.length;

  return (
    <div className="table-responsive">
      {loading && (
        <div className="d-flex justify-content-center align-items-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <span className="ms-2 text-muted">Cargando sedes...</span>
        </div>
      )}

      {!loading && sedes.length === 0 && (
        <div className="text-center py-5">
          <div className="mb-3">
            <i className="ri-building-line display-4 text-muted" aria-hidden="true"></i>
          </div>
          <h6 className="text-muted">No se encontraron sedes</h6>
          <p className="text-muted mb-0">
            {filters?.search ? 
              'No hay sedes que coincidan con los criterios de búsqueda.' :
              'No hay sedes registradas para esta organización.'
            }
          </p>
        </div>
      )}

      {!loading && sedes.length > 0 && (
        <table className="table table-hover align-middle table-nowrap mb-0">
          <thead className="table-light">
            <tr>
              {onSelectionChange && (
                <th scope="col" className="ps-4" style={{ width: '50px' }}>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="checkAll"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isPartiallySelected && !isAllSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Seleccionar todas las sedes"
                    />
                  </div>
                </th>
              )}
              <th scope="col">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost-primary p-0 fw-semibold border-0 d-flex align-items-center"
                  onClick={() => handleSort('numero_sede')}
                >
                  # Sede
                  {getSortIcon('numero_sede')}
                </button>
              </th>
              <th scope="col">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost-primary p-0 fw-semibold border-0 d-flex align-items-center"
                  onClick={() => handleSort('nombre_sede')}
                >
                  Nombre
                  {getSortIcon('nombre_sede')}
                </button>
              </th>
              <th scope="col">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost-primary p-0 fw-semibold border-0 d-flex align-items-center"
                  onClick={() => handleSort('tipo_sede')}
                >
                  Tipo
                  {getSortIcon('tipo_sede')}
                </button>
              </th>
              <th scope="col">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost-primary p-0 fw-semibold border-0 d-flex align-items-center"
                  onClick={() => handleSort('direccion_completa')}
                >
                  Ubicación
                  {getSortIcon('direccion_completa')}
                </button>
              </th>
              <th scope="col">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost-primary p-0 fw-semibold border-0 d-flex align-items-center"
                  onClick={() => handleSort('telefono_principal')}
                >
                  Contacto
                  {getSortIcon('telefono_principal')}
                </button>
              </th>
              <th scope="col">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost-primary p-0 fw-semibold border-0 d-flex align-items-center"
                  onClick={() => handleSort('estado')}
                >
                  Estado
                  {getSortIcon('estado')}
                </button>
              </th>
              <th scope="col" className="text-center">
                Servicios
              </th>
              <th scope="col" className="text-center">
                24h
              </th>
              <th scope="col">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost-primary p-0 fw-semibold border-0 d-flex align-items-center"
                  onClick={() => handleSort('created_at')}
                >
                  Fecha Registro
                  {getSortIcon('created_at')}
                </button>
              </th>
              <th scope="col" className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sedes.map((sede) => (
              <tr key={sede.id}>
                {onSelectionChange && (
                  <td className="ps-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`check-${sede.id}`}
                        checked={selectedSedes.includes(sede.id)}
                        onChange={(e) => handleSelectSede(sede.id, e.target.checked)}
                        aria-label={`Seleccionar sede ${sede.nombre_sede}`}
                      />
                    </div>
                  </td>
                )}
                <td>
                  <div className="d-flex align-items-center">
                    <span className="fw-medium">
                      {sede.numero_sede}
                    </span>
                    {sede.es_sede_principal && (
                      <span className="badge bg-primary-subtle text-primary ms-2" title="Sede Principal">
                        <i className="ri-star-line" aria-hidden="true"></i>
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div>
                    <h6 className="mb-1 fw-semibold">
                      {sede.nombre_sede}
                    </h6>
                    <p className="text-muted mb-0 small">
                      {sede.organization_name}
                    </p>
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <i className={`${getTipoSedeIcon(sede.tipo_sede)} text-muted me-2`} aria-hidden="true"></i>
                    <span className="text-capitalize">
                      {formatTipo(sede.tipo_sede)}
                    </span>
                  </div>
                </td>
                <td>
                  <div>
                    <p className="mb-1 fw-medium">
                      {sede.direccion_completa}
                    </p>
                    <p className="text-muted mb-0 small">
                      {sede.municipio}, {sede.departamento}
                    </p>
                  </div>
                </td>
                <td>
                  <div>
                    <div className="d-flex align-items-center mb-1">
                      <i className="ri-phone-line text-muted me-1" aria-hidden="true"></i>
                      <span className="small">{sede.telefono_principal}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="ri-mail-line text-muted me-1" aria-hidden="true"></i>
                      <span className="small text-truncate" style={{ maxWidth: '150px' }} title={sede.email}>
                        {sede.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${getEstadoBadgeClass(sede.estado)}`}>
                    {formatEstado(sede.estado)}
                  </span>
                </td>
                <td className="text-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info"
                    onClick={() => onViewServices(sede)}
                    title="Ver servicios habilitados"
                  >
                    <i className="ri-service-line me-1" aria-hidden="true"></i>
                    {sede.total_servicios}
                  </button>
                </td>
                <td className="text-center">
                  {sede.atencion_24_horas ? (
                    <span className="badge bg-success-subtle text-success">
                      <i className="ri-time-line" aria-hidden="true"></i>
                    </span>
                  ) : (
                    <span className="text-muted">
                      <i className="ri-time-line" aria-hidden="true"></i>
                    </span>
                  )}
                </td>
                <td>
                  <small className="text-muted">
                    {new Date(sede.created_at).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </small>
                </td>
                <td className="text-end">
                  <div className="dropdown">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      aria-label={`Acciones para sede ${sede.nombre_sede}`}
                    >
                      <i className="ri-more-2-fill" aria-hidden="true"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => onViewServices(sede)}
                        >
                          <i className="ri-service-line me-2 text-muted" aria-hidden="true"></i>
                          Ver Servicios
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item"
                          onClick={() => onEdit(sede)}
                        >
                          <i className="ri-edit-2-line me-2 text-muted" aria-hidden="true"></i>
                          Editar
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item text-danger"
                          onClick={() => onDelete(sede)}
                        >
                          <i className="ri-delete-bin-line me-2" aria-hidden="true"></i>
                          Eliminar
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Table Footer with Summary */}
      {!loading && sedes.length > 0 && (
        <div className="card-footer border-top bg-light">
          <div className="row align-items-center">
            <div className="col-sm-6">
              <div className="text-muted">
                <span className="fw-semibold">{sedes.length}</span> sedes encontradas
                {selectedSedes.length > 0 && (
                  <span className="ms-2">
                    (<span className="fw-semibold text-primary">{selectedSedes.length}</span> seleccionadas)
                  </span>
                )}
              </div>
            </div>
            <div className="col-sm-6">
              <div className="d-flex justify-content-end gap-3">
                <div className="d-flex align-items-center">
                  <i className="ri-check-circle-fill text-success me-1" aria-hidden="true"></i>
                  <small className="text-muted">
                    {sedes.filter(s => s.estado === 'activa').length} Activas
                  </small>
                </div>
                <div className="d-flex align-items-center">
                  <i className="ri-star-fill text-warning me-1" aria-hidden="true"></i>
                  <small className="text-muted">
                    {sedes.filter(s => s.es_sede_principal).length} Principales
                  </small>
                </div>
                <div className="d-flex align-items-center">
                  <i className="ri-time-line text-info me-1" aria-hidden="true"></i>
                  <small className="text-muted">
                    {sedes.filter(s => s.atencion_24_horas).length} 24h
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SedesTable;