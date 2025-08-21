import React, { useEffect, useState, useMemo, useCallback } from 'react';
import classnames from 'classnames';
import { useSOGCSConfig } from '../../../../hooks/useModuleConfig';
import { useCurrentOrganization } from '../../../../hooks/useCurrentOrganization';
import LayoutWithBreadcrumb from '../../../../components/layout/LayoutWithBreadcrumb';
import SimpleTable from '../../../../components/common/SimpleTable';
import DeleteModal from '../../../../components/common/DeleteModal';
import ServicioFormModal from './components/modals/ServicioFormModal';
import ServicioDetailModal from './components/modals/ServicioDetailModal';
import ServicioImportModal from './components/modals/ServicioImportModal';
import ServicioDuplicateModal from './components/modals/ServicioDuplicateModal';
import ServicioStats from './components/ServicioStats';
import { useServicioStore } from '../../../../stores/servicioStore';
import type { ServicioListItem, ServicioFormData } from '../../../../types/servicios';
import { toast } from 'react-toastify';

// Component state interface
interface ServiciosPageState {
  showCreateModal: boolean;
  showImportModal: boolean;
  showDetailModal: boolean;
  showDuplicateModal: boolean;
  showStatsModal: boolean;
  selectedServicio: ServicioListItem | null;
  selectedServicioId: string | null;
  isEditMode: boolean;
}

const ServiciosPage = () => {
  document.title = "Servicios de Salud - SOGCS | ZentraQMS";
  
  // Hooks
  const { organization, isLoading: organizationLoading, error: organizationError, hasOrganization } = useCurrentOrganization();
  const {
    servicios,
    statistics,
    loading,
    error,
    fetchServicios,
    fetchStatistics,
    createServicio,
    updateServicio,
    deleteServicio,
    bulkDeleteServicios,
    clearError,
  } = useServicioStore();
  
  // State
  const [activeTab, setActiveTab] = useState("1");
  const [state, setState] = useState<ServiciosPageState>({
    showCreateModal: false,
    showImportModal: false,
    showDetailModal: false,
    showDuplicateModal: false,
    showStatsModal: false,
    selectedServicio: null,
    selectedServicioId: null,
    isEditMode: false,
  });
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState<boolean>(false);
  const [selectedCheckBoxDelete, setSelectedCheckBoxDelete] = useState<string[]>([]);
  const [isMultiDeleteButton, setIsMultiDeleteButton] = useState<boolean>(false);

  // Personalizar configuración del módulo para servicios
  const moduleConfig = useSOGCSConfig('configuracion');
  
  // Personalizar breadcrumb para servicios
  const customModuleConfig = {
    ...moduleConfig,
    breadcrumb: {
      title: 'SOGCS',
      pageTitle: 'Gestión de Servicios de Salud',
      links: [
        {
          name: 'SOGCS',
          url: '/sogcs/dashboard'
        },
        {
          name: 'Configuración',
          url: '#'
        },
        {
          name: 'Servicios de Salud'
        }
      ]
    }
  };

  // Load servicios data on component mount
  useEffect(() => {
    if (organization?.id) {
      fetchServicios();
      fetchStatistics();
    }
  }, [organization?.id, fetchServicios, fetchStatistics]);

  // Show error toast when there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Computed filtered servicios based on active tab
  const filteredServicios = useMemo(() => {
    if (!servicios) return [];
    
    switch (activeTab) {
      case "2": // Activos
        return servicios.filter(servicio => servicio.status === 'activo');
      case "3": // Inactivos
        return servicios.filter(servicio => servicio.status === 'inactivo');
      case "4": // Suspendidos
        return servicios.filter(servicio => servicio.status === 'suspendido');
      case "5": // En proceso
        return servicios.filter(servicio => servicio.status === 'en_proceso');
      default: // Todos los servicios
        return servicios;
    }
  }, [servicios, activeTab]);

  // Tab toggle handler
  const toggleTab = (tab: string) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  // Modal handlers
  const handleCreateServicio = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCreateModal: true,
      selectedServicio: null,
      isEditMode: false,
    }));
  }, []);

  const handleEditServicio = useCallback((servicio: ServicioListItem) => {
    setState(prev => ({
      ...prev,
      showCreateModal: true,
      selectedServicio: servicio,
      isEditMode: true,
    }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCreateModal: false,
      selectedServicio: null,
      isEditMode: false,
    }));
  }, []);

  const handleShowImport = useCallback(() => {
    setState(prev => ({ ...prev, showImportModal: true }));
  }, []);

  const handleCloseImport = useCallback(() => {
    setState(prev => ({ ...prev, showImportModal: false }));
  }, []);

  const handleShowDuplicate = useCallback(() => {
    setState(prev => ({ ...prev, showDuplicateModal: true }));
  }, []);

  const handleCloseDuplicate = useCallback(() => {
    setState(prev => ({ ...prev, showDuplicateModal: false }));
  }, []);

  const handleShowStats = useCallback(() => {
    setState(prev => ({ ...prev, showStatsModal: true }));
  }, []);

  const handleCloseStats = useCallback(() => {
    setState(prev => ({ ...prev, showStatsModal: false }));
  }, []);

  const handleViewServicio = useCallback((servicio: ServicioListItem) => {
    setState(prev => ({
      ...prev,
      showDetailModal: true,
      selectedServicioId: servicio.id,
    }));
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showDetailModal: false,
      selectedServicioId: null,
    }));
  }, []);

  const handleEditFromDetail = useCallback((servicio: any) => {
    // Convert the detailed servicio data to a ServicioListItem for consistency
    const servicioListItem: ServicioListItem = {
      id: servicio.id,
      service_code: servicio.service_code,
      service_name: servicio.service_name,
      service_category: servicio.service_category,
      sede_name: servicio.sede_name,
      sede_reps_code: servicio.sede_reps_code,
      modality: servicio.modality,
      complexity: servicio.complexity,
      capacity: servicio.capacity,
      status: servicio.status,
      authorization_date: servicio.authorization_date,
      is_active: servicio.is_active,
      created_at: servicio.created_at,
    };
    
    setState(prev => ({
      ...prev,
      showDetailModal: false,
      selectedServicioId: null,
      showCreateModal: true,
      selectedServicio: servicioListItem,
      isEditMode: true,
    }));
  }, []);

  // Handle servicio operations
  const handleSaveServicio = useCallback(async (formData: ServicioFormData) => {
    if (!hasOrganization) {
      toast.error('No se pudo identificar la organización');
      return;
    }

    try {
      if (state.isEditMode && state.selectedServicio) {
        await updateServicio(state.selectedServicio.id, formData);
        toast.success('Servicio actualizado exitosamente');
      } else {
        await createServicio(formData);
        toast.success('Servicio creado exitosamente');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving servicio:', error);
      toast.error(state.isEditMode ? 'Error al actualizar el servicio' : 'Error al crear el servicio');
    }
  }, [hasOrganization, state.isEditMode, state.selectedServicio, updateServicio, createServicio, handleCloseModal]);

  // Delete servicio operations
  const onClickDelete = useCallback((servicio: ServicioListItem) => {
    setState(prev => ({ ...prev, selectedServicio: servicio }));
    setDeleteModal(true);
  }, []);

  const handleDeleteServicio = useCallback(async () => {
    if (!state.selectedServicio) return;

    try {
      await deleteServicio(state.selectedServicio.id);
      toast.success('Servicio eliminado exitosamente');
      setDeleteModal(false);
      setState(prev => ({ ...prev, selectedServicio: null }));
    } catch (error) {
      console.error('Error deleting servicio:', error);
      toast.error('Error al eliminar el servicio');
    }
  }, [state.selectedServicio, deleteServicio]);

  // Checkbox operations
  const checkedAll = useCallback(() => {
    const checkall = document.getElementById("checkBoxAll") as HTMLInputElement;
    const checkboxes = document.querySelectorAll(".servicioCheckBox") as NodeListOf<HTMLInputElement>;
    
    if (checkall?.checked) {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = true;
      });
      const allIds = filteredServicios.map(servicio => servicio.id);
      setSelectedCheckBoxDelete(allIds);
      setIsMultiDeleteButton(allIds.length > 0);
    } else {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
      setSelectedCheckBoxDelete([]);
      setIsMultiDeleteButton(false);
    }
  }, [filteredServicios]);

  const handleCheckboxChange = useCallback((servicioId: string, checked: boolean) => {
    setSelectedCheckBoxDelete(prev => {
      const newSelected = checked 
        ? [...prev, servicioId]
        : prev.filter(id => id !== servicioId);
      setIsMultiDeleteButton(newSelected.length > 0);
      return newSelected;
    });
  }, []);

  const handleDeleteMultiple = useCallback(async () => {
    if (!hasOrganization || selectedCheckBoxDelete.length === 0) return;

    try {
      await bulkDeleteServicios(selectedCheckBoxDelete);
      toast.success(`${selectedCheckBoxDelete.length} servicios eliminados exitosamente`);
      setSelectedCheckBoxDelete([]);
      setIsMultiDeleteButton(false);
      setDeleteModalMulti(false);
      
      // Clear all checkboxes
      const checkboxes = document.querySelectorAll(".servicioCheckBox") as NodeListOf<HTMLInputElement>;
      const checkall = document.getElementById("checkBoxAll") as HTMLInputElement;
      checkboxes.forEach(checkbox => checkbox.checked = false);
      if (checkall) checkall.checked = false;
    } catch (error) {
      console.error('Error deleting multiple servicios:', error);
      toast.error('Error al eliminar los servicios seleccionados');
    }
  }, [hasOrganization, selectedCheckBoxDelete, bulkDeleteServicios]);

  // Handle import completion
  const handleImportComplete = useCallback((result: any) => {
    if (result.success) {
      toast.success(`Importación completada: ${result.imported_count} servicios importados`);
      if (hasOrganization) {
        fetchServicios(); // Refresh the list
        fetchStatistics(); // Refresh statistics
      }
    } else {
      toast.error(result.message || 'Error durante la importación');
    }
    handleCloseImport();
  }, [hasOrganization, fetchServicios, fetchStatistics, handleCloseImport]);

  // Handle duplicate completion
  const handleDuplicateComplete = useCallback((result: any) => {
    if (result.success) {
      toast.success(`Duplicación completada: ${result.created_count} servicios duplicados`);
      if (hasOrganization) {
        fetchServicios(); // Refresh the list
        fetchStatistics(); // Refresh statistics
      }
    } else {
      toast.error(result.message || 'Error durante la duplicación');
    }
    handleCloseDuplicate();
  }, [hasOrganization, fetchServicios, fetchStatistics, handleCloseDuplicate]);

  // Table columns
  const columns = useMemo(
    () => [
      {
        header: (
          <input 
            type="checkbox" 
            id="checkBoxAll" 
            className="form-check-input" 
            onClick={checkedAll} 
          />
        ),
        accessorKey: '#',
        enableSorting: false,
        cell: (value: any, row: ServicioListItem) => (
          <input 
            type="checkbox" 
            className="servicioCheckBox form-check-input" 
            value={row.id} 
            onChange={(e) => handleCheckboxChange(row.id, e.target.checked)} 
          />
        ),
      },
      {
        header: "Código",
        accessorKey: "service_code",
        cell: (value: any) => <span className="fw-medium text-primary">{value}</span>,
      },
      {
        header: "Nombre del Servicio",
        accessorKey: "service_name",
        cell: (value: any, row: ServicioListItem) => (
          <div>
            <span className="fw-medium">{value}</span>
            <div className="text-muted small">{row.service_category}</div>
          </div>
        ),
      },
      {
        header: "Sede", 
        accessorKey: "sede_name",
        cell: (value: any, row: ServicioListItem) => (
          <div>
            <div className="fw-medium">{value}</div>
            <small className="text-muted">{row.sede_reps_code}</small>
          </div>
        ),
      },
      {
        header: "Modalidad",
        accessorKey: "modality",
        cell: (value: any) => {
          const getModalityLabel = (modality: string) => {
            switch (modality?.toLowerCase()) {
              case "intramural":
                return "Intramural";
              case "extramural":
                return "Extramural";
              case "telemedicina":
                return "Telemedicina";
              case "atencion_domiciliaria":
                return "Atención Domiciliaria";
              default:
                return modality || "N/A";
            }
          };
          
          return (
            <span className="badge bg-info-subtle text-info">
              {getModalityLabel(value)}
            </span>
          );
        },
      },
      {
        header: "Complejidad",
        accessorKey: "complexity",
        cell: (value: any) => {
          const getComplexityBadge = (complexity: string) => {
            switch (complexity?.toLowerCase()) {
              case "baja":
                return "bg-success-subtle text-success";
              case "media":
                return "bg-warning-subtle text-warning";
              case "alta":
                return "bg-danger-subtle text-danger";
              default:
                return "bg-light text-dark";
            }
          };
          
          const getComplexityLabel = (complexity: string) => {
            switch (complexity?.toLowerCase()) {
              case "baja":
                return "Baja";
              case "media":
                return "Media";
              case "alta":
                return "Alta";
              default:
                return complexity || "N/A";
            }
          };
          
          return (
            <span className={`badge ${getComplexityBadge(value)}`}>
              {getComplexityLabel(value)}
            </span>
          );
        },
      },
      {
        header: "Capacidad",
        accessorKey: "capacity",
        cell: (value: any) => (
          <span className="badge bg-primary-subtle text-primary">
            {value || 0}
          </span>
        ),
      },
      {
        header: 'Estado',
        accessorKey: 'status',
        cell: (value: any, row: ServicioListItem) => {
          const getEstadoBadge = (estado: string) => {
            switch (estado?.toLowerCase()) {
              case "activo":
                return "bg-success-subtle text-success";
              case "en_proceso":
                return "bg-warning-subtle text-warning";
              case "suspendido":
                return "bg-danger-subtle text-danger";
              case "inactivo":
                return "bg-secondary-subtle text-secondary";
              default:
                return "bg-light text-dark";
            }
          };
          
          const displayEstado = (estado: string) => {
            switch (estado?.toLowerCase()) {
              case "activo":
                return "Activo";
              case "en_proceso":
                return "En Proceso";
              case "suspendido":
                return "Suspendido";
              case "inactivo":
                return "Inactivo";
              default:
                return estado || "N/A";
            }
          };
          
          return (
            <div>
              <span className={`badge ${getEstadoBadge(value)}`}>
                {displayEstado(value)}
              </span>
              {row.is_active && (
                <div className="mt-1">
                  <span className="badge bg-info-subtle text-info small">Activo</span>
                </div>
              )}
            </div>
          );
        }
      },
      {
        header: "Acciones",
        accessorKey: "acciones",
        enableSorting: false,
        cell: (value: any, row: ServicioListItem) => (
          <ul className="list-inline hstack gap-2 mb-0">
            <li className="list-inline-item">
              <button
                className="btn btn-primary btn-sm btn-icon"
                onClick={() => handleViewServicio(row)}
                title="Ver detalles"
              >
                <i className="ri-eye-fill"></i>
              </button>
            </li>
            <li className="list-inline-item edit">
              <button
                className="btn btn-success btn-sm btn-icon"
                onClick={() => handleEditServicio(row)}
                title="Editar servicio"
              >
                <i className="ri-pencil-fill"></i>
              </button>
            </li>
            <li className="list-inline-item">
              <button
                className="btn btn-danger btn-sm btn-icon"
                onClick={() => onClickDelete(row)}
                title="Eliminar servicio"
              >
                <i className="ri-delete-bin-5-fill"></i>
              </button>
            </li>
          </ul>
        ),
      },
    ],
    [checkedAll, handleCheckboxChange, handleEditServicio, onClickDelete, handleViewServicio]
  );

  // Loading and error states
  if (organizationLoading || (loading && !servicios.length)) {
    return (
      <LayoutWithBreadcrumb moduleConfig={customModuleConfig}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">
              {organizationLoading ? 'Cargando información de la organización...' : 'Cargando servicios...'}
            </p>
          </div>
        </div>
      </LayoutWithBreadcrumb>
    );
  }

  // Show organization error
  if (organizationError && !hasOrganization) {
    return (
      <LayoutWithBreadcrumb moduleConfig={customModuleConfig}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="mb-4">
              <i className="ri-building-line display-4 text-warning mb-3"></i>
              <h5 className="text-warning">Problema con la Organización</h5>
              <p className="text-muted mb-3">{organizationError}</p>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <i className="ri-refresh-line me-1"></i>
                Intentar de Nuevo
              </button>
            </div>
          </div>
        </div>
      </LayoutWithBreadcrumb>
    );
  }

  return (
    <LayoutWithBreadcrumb moduleConfig={customModuleConfig}>
      {/* Delete Modals */}
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteServicio}
        onCloseClick={() => setDeleteModal(false)}
      />
      <DeleteModal
        show={deleteModalMulti}
        onDeleteClick={handleDeleteMultiple}
        onCloseClick={() => setDeleteModalMulti(false)}
      />
      
      {/* Servicio Form Modal */}
      {state.showCreateModal && hasOrganization && (
        <ServicioFormModal
          isOpen={state.showCreateModal}
          onClose={handleCloseModal}
          onSave={handleSaveServicio}
          servicio={state.selectedServicio}
          isLoading={loading}
        />
      )}
      
      {/* Detail Modal */}
      <ServicioDetailModal
        isOpen={state.showDetailModal}
        onClose={handleCloseDetailModal}
        servicioId={state.selectedServicioId}
        onEdit={handleEditFromDetail}
      />
      
      {/* Import Modal */}
      <ServicioImportModal
        isOpen={state.showImportModal}
        onClose={handleCloseImport}
        onImportComplete={handleImportComplete}
      />
      
      {/* Duplicate Modal */}
      <ServicioDuplicateModal
        isOpen={state.showDuplicateModal}
        onClose={handleCloseDuplicate}
        onSave={handleDuplicateComplete}
        isLoading={loading}
      />

      {/* Statistics Modal */}
      {state.showStatsModal && statistics && (
        <div className={`modal fade show`} 
             style={{ display: 'block', zIndex: 1055, backgroundColor: 'rgba(0,0,0,0.5)' }} 
             tabIndex={-1}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-bar-chart-line me-2"></i>
                  Estadísticas de Servicios
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseStats}
                ></button>
              </div>
              <div className="modal-body">
                <ServicioStats
                  statistics={statistics}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-12">
          <div className="card" id="serviciosList">
            <div className="card-header border-0">
              <div className="row align-items-center gy-3">
                <div className="col-sm">
                  <h5 className="card-title mb-0">Gestión de Servicios de Salud</h5>
                </div>
                <div className="col-sm-auto">
                  <div className="d-flex gap-1 flex-wrap">
                    <button
                      className="btn btn-success add-btn"
                      id="create-btn"
                      onClick={handleCreateServicio}
                      disabled={!hasOrganization}
                    >
                      <i className="ri-add-line align-bottom me-1"></i>
                      Crear Servicio
                    </button>
                    <button 
                      className="btn btn-info"
                      onClick={handleShowImport}
                      disabled={!hasOrganization}
                    >
                      <i className="ri-upload-cloud-line align-bottom me-1"></i>
                      Importar
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={handleShowDuplicate}
                      disabled={!hasOrganization}
                    >
                      <i className="ri-file-copy-line align-bottom me-1"></i>
                      Duplicar
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={handleShowStats}
                      disabled={!hasOrganization || !statistics}
                    >
                      <i className="ri-bar-chart-line align-bottom me-1"></i>
                      Estadísticas
                    </button>
                    {isMultiDeleteButton && (
                      <button 
                        className="btn btn-danger"
                        onClick={() => setDeleteModalMulti(true)}
                        title={`Eliminar ${selectedCheckBoxDelete.length} servicio(s) seleccionado(s)`}
                      >
                        <i className="ri-delete-bin-2-line me-1"></i>
                        Eliminar ({selectedCheckBoxDelete.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body pt-0">
              <div>
                <ul className="nav nav-tabs nav-tabs-custom nav-success" role="tablist">
                  <li className="nav-item">
                    <a
                      className={classnames("nav-link", { active: activeTab === "1" })}
                      onClick={() => toggleTab("1")}
                      href="#"
                      role="tab"
                    >
                      <i className="ri-service-line me-1 align-bottom"></i>
                      Todos los Servicios
                      <span className="badge bg-secondary ms-2">{servicios?.length || 0}</span>
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className={classnames("nav-link", { active: activeTab === "2" })}
                      onClick={() => toggleTab("2")}
                      href="#"
                      role="tab"
                    >
                      <i className="ri-checkbox-circle-line me-1 align-bottom"></i>
                      Activos
                      <span className="badge bg-success ms-2">
                        {servicios?.filter(s => s.status === 'activo').length || 0}
                      </span>
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className={classnames("nav-link", { active: activeTab === "3" })}
                      onClick={() => toggleTab("3")}
                      href="#"
                      role="tab"
                    >
                      <i className="ri-close-circle-line me-1 align-bottom"></i>
                      Inactivos
                      <span className="badge bg-secondary ms-2">
                        {servicios?.filter(s => s.status === 'inactivo').length || 0}
                      </span>
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className={classnames("nav-link", { active: activeTab === "4" })}
                      onClick={() => toggleTab("4")}
                      href="#"
                      role="tab"
                    >
                      <i className="ri-pause-circle-line me-1 align-bottom"></i>
                      Suspendidos
                      <span className="badge bg-danger ms-2">
                        {servicios?.filter(s => s.status === 'suspendido').length || 0}
                      </span>
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className={classnames("nav-link", { active: activeTab === "5" })}
                      onClick={() => toggleTab("5")}
                      href="#"
                      role="tab"
                    >
                      <i className="ri-time-line me-1 align-bottom"></i>
                      En Proceso
                      <span className="badge bg-warning ms-2">
                        {servicios?.filter(s => s.status === 'en_proceso').length || 0}
                      </span>
                    </a>
                  </li>
                </ul>

                {filteredServicios.length > 0 ? (
                  <SimpleTable
                    columns={columns}
                    data={filteredServicios}
                    isGlobalFilter={true}
                    customPageSize={10}
                    divClass="table-responsive table-card mb-1 mt-3"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase"
                    SearchPlaceholder='Buscar por código, nombre, sede o categoría...'
                  />
                ) : (
                  <div className="mt-4 text-center py-4">
                    {loading ? (
                      <div>
                        <div className="spinner-border text-primary mb-3" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted">Cargando servicios...</p>
                      </div>
                    ) : (
                      <div>
                        <i className="ri-service-line display-4 text-muted mb-3"></i>
                        <h5 className="text-muted">No hay servicios registrados</h5>
                        <p className="text-muted mb-3">
                          {activeTab === "1" 
                            ? "No se han registrado servicios para esta organización."
                            : `No hay servicios con el estado seleccionado.`}
                        </p>
                        {activeTab === "1" && hasOrganization && (
                          <button
                            className="btn btn-primary"
                            onClick={handleCreateServicio}
                          >
                            <i className="ri-add-line me-1"></i>
                            Crear Primer Servicio
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="alert alert-danger alert-dismissible mt-3" role="alert">
                <i className="ri-error-warning-line me-1"></i>
                {error}
                <button
                  type="button"
                  className="btn-close"
                  onClick={clearError}
                ></button>
              </div>
            )}

          </div>
        </div>
      </div>
    </LayoutWithBreadcrumb>
  );
};

export default ServiciosPage;