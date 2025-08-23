import React, { useEffect, useState, useMemo, useCallback } from 'react';
import classnames from 'classnames';
import { useSOGCSConfig } from '../../../../hooks/useModuleConfig';
import { useCurrentOrganization } from '../../../../hooks/useCurrentOrganization';
import LayoutWithBreadcrumb from '../../../../components/layout/LayoutWithBreadcrumb';
import SimpleTable from '../../../../components/common/SimpleTable';
import DeleteModal from '../../../../components/common/DeleteModal';
import SedeFormModal from '../../../../components/forms/SedeFormModal';
import SedeDetailModal from '../../../../components/modals/SedeDetailModal';
import SedesImporter from '../../../../components/importers/SedesImporter';
import CapacityImportModal from '../../../../components/modals/CapacityImportModal';
import { useSedeStore } from '../../../../stores/sedeStore';
import type { SedeListItem, SedeFormData } from '../../../../types/sede.types';
import { toast } from 'react-toastify';

// Component state interface
interface SedesPageState {
  showCreateModal: boolean;
  showImportModal: boolean;
  showCapacityImportModal: boolean;
  showDetailModal: boolean;
  selectedSede: SedeListItem | null;
  selectedSedeId: string | null;
  isEditMode: boolean;
}

const SedesPage = () => {
  document.title = "Sedes - SOGCS | ZentraQMS";
  
  // Hooks
  const { organization, isLoading: organizationLoading, error: organizationError, hasOrganization } = useCurrentOrganization();
  const {
    sedes,
    loading,
    error,
    fetchSedes,
    createSede,
    updateSede,
    deleteSede,
    bulkDeleteSedes,
    importSedes,
    clearError,
  } = useSedeStore();
  
  // State
  const [activeTab, setActiveTab] = useState("1");
  const [state, setState] = useState<SedesPageState>({
    showCreateModal: false,
    showImportModal: false,
    showCapacityImportModal: false,
    showDetailModal: false,
    selectedSede: null,
    selectedSedeId: null,
    isEditMode: false,
  });
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState<boolean>(false);
  const [selectedCheckBoxDelete, setSelectedCheckBoxDelete] = useState<string[]>([]);
  const [isMultiDeleteButton, setIsMultiDeleteButton] = useState<boolean>(false);

  // Personalizar configuración del módulo para sedes
  const moduleConfig = useSOGCSConfig('configuracion');
  
  // Personalizar breadcrumb para sedes
  const customModuleConfig = {
    ...moduleConfig,
    breadcrumb: {
      title: 'SOGCS',
      pageTitle: 'Gestión de Sedes',
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
          name: 'Sedes'
        }
      ]
    }
  };

  // Load sedes data on component mount
  useEffect(() => {
    if (organization?.id) {
      fetchSedes();
    }
  }, [organization?.id, fetchSedes]);

  // Show error toast when there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Computed filtered sedes based on active tab
  const filteredSedes = useMemo(() => {
    if (!sedes) return [];
    
    switch (activeTab) {
      case "2": // Habilitadas
        return sedes.filter(sede => sede.habilitation_status === 'habilitada');
      case "3": // Suspendidas
        return sedes.filter(sede => sede.habilitation_status === 'suspendida');
      case "4": // En proceso
        return sedes.filter(sede => sede.habilitation_status === 'en_proceso');
      default: // Todas las sedes
        return sedes;
    }
  }, [sedes, activeTab]);

  // Tab toggle handler
  const toggleTab = (tab: string) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  // Modal handlers
  const handleCreateSede = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCreateModal: true,
      selectedSede: null,
      isEditMode: false,
    }));
  }, []);

  const handleEditSede = useCallback((sede: SedeListItem) => {
    setState(prev => ({
      ...prev,
      showCreateModal: true,
      selectedSede: sede,
      isEditMode: true,
    }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCreateModal: false,
      selectedSede: null,
      isEditMode: false,
    }));
  }, []);

  const handleShowImport = useCallback(() => {
    setState(prev => ({ ...prev, showImportModal: true }));
  }, []);

  const handleCloseImport = useCallback(() => {
    setState(prev => ({ ...prev, showImportModal: false }));
  }, []);

  const handleShowCapacityImport = useCallback(() => {
    setState(prev => ({ ...prev, showCapacityImportModal: true }));
  }, []);

  const handleCloseCapacityImport = useCallback(() => {
    setState(prev => ({ ...prev, showCapacityImportModal: false }));
  }, []);

  const handleViewSede = useCallback((sede: SedeListItem) => {
    setState(prev => ({
      ...prev,
      showDetailModal: true,
      selectedSedeId: sede.id,
    }));
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showDetailModal: false,
      selectedSedeId: null,
    }));
  }, []);

  const handleEditFromDetail = useCallback((sede: any) => {
    // Convert the detailed sede data to a SedeListItem for consistency
    const sedeListItem: SedeListItem = {
      id: sede.id,
      reps_code: sede.reps_code,
      name: sede.name,
      sede_type: sede.sede_type,
      habilitation_status: sede.habilitation_status,
      department_name: sede.department_name,
      municipality_name: sede.municipality_name,
      address: sede.address,
      phone_primary: sede.phone_primary,
      email: sede.email,
      services_count: sede.services_count,
      is_active: sede.is_active,
      organization_name: sede.organization_name,
      created_at: sede.created_at,
    };
    
    setState(prev => ({
      ...prev,
      showDetailModal: false,
      selectedSedeId: null,
      showCreateModal: true,
      selectedSede: sedeListItem,
      isEditMode: true,
    }));
  }, []);

  // Handle sede operations
  const handleSaveSede = useCallback(async (formData: SedeFormData) => {
    if (!hasOrganization) {
      toast.error('No se pudo identificar la organización');
      return;
    }

    try {
      if (state.isEditMode && state.selectedSede) {
        await updateSede(state.selectedSede.id, formData);
        toast.success('Sede actualizada exitosamente');
      } else {
        await createSede(formData);
        toast.success('Sede creada exitosamente');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving sede:', error);
      toast.error(state.isEditMode ? 'Error al actualizar la sede' : 'Error al crear la sede');
    }
  }, [hasOrganization, state.isEditMode, state.selectedSede, updateSede, createSede, handleCloseModal]);

  // Delete sede operations
  const onClickDelete = useCallback((sede: SedeListItem) => {
    setState(prev => ({ ...prev, selectedSede: sede }));
    setDeleteModal(true);
  }, []);

  const handleDeleteSede = useCallback(async () => {
    if (!state.selectedSede) return;

    try {
      await deleteSede(state.selectedSede.id);
      toast.success('Sede eliminada exitosamente');
      setDeleteModal(false);
      setState(prev => ({ ...prev, selectedSede: null }));
    } catch (error) {
      console.error('Error deleting sede:', error);
      toast.error('Error al eliminar la sede');
    }
  }, [state.selectedSede, deleteSede]);

  // Checkbox operations
  const checkedAll = useCallback(() => {
    const checkall = document.getElementById("checkBoxAll") as HTMLInputElement;
    const checkboxes = document.querySelectorAll(".sedeCheckBox") as NodeListOf<HTMLInputElement>;
    
    if (checkall?.checked) {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = true;
      });
      const allIds = filteredSedes.map(sede => sede.id);
      setSelectedCheckBoxDelete(allIds);
      setIsMultiDeleteButton(allIds.length > 0);
    } else {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
      setSelectedCheckBoxDelete([]);
      setIsMultiDeleteButton(false);
    }
  }, [filteredSedes]);

  const handleCheckboxChange = useCallback((sedeId: string, checked: boolean) => {
    setSelectedCheckBoxDelete(prev => {
      const newSelected = checked 
        ? [...prev, sedeId]
        : prev.filter(id => id !== sedeId);
      setIsMultiDeleteButton(newSelected.length > 0);
      return newSelected;
    });
  }, []);

  const handleDeleteMultiple = useCallback(async () => {
    if (!hasOrganization || selectedCheckBoxDelete.length === 0) return;

    try {
      await bulkDeleteSedes(selectedCheckBoxDelete);
      toast.success(`${selectedCheckBoxDelete.length} sedes eliminadas exitosamente`);
      setSelectedCheckBoxDelete([]);
      setIsMultiDeleteButton(false);
      setDeleteModalMulti(false);
      
      // Clear all checkboxes
      const checkboxes = document.querySelectorAll(".sedeCheckBox") as NodeListOf<HTMLInputElement>;
      const checkall = document.getElementById("checkBoxAll") as HTMLInputElement;
      checkboxes.forEach(checkbox => checkbox.checked = false);
      if (checkall) checkall.checked = false;
    } catch (error) {
      console.error('Error deleting multiple sedes:', error);
      toast.error('Error al eliminar las sedes seleccionadas');
    }
  }, [hasOrganization, selectedCheckBoxDelete, bulkDeleteSedes]);

  // Handle import completion
  const handleImportComplete = useCallback((result: any) => {
    if (result.success) {
      toast.success(`Importación completada: ${result.imported_count} sedes importadas`);
      if (hasOrganization) {
        fetchSedes(); // Refresh the list
      }
    } else {
      toast.error(result.message || 'Error durante la importación');
    }
    handleCloseImport();
  }, [hasOrganization, fetchSedes, handleCloseImport]);

  // Handle capacity import completion
  const handleCapacityImportComplete = useCallback((result: any) => {
    if (result.success) {
      toast.success(`Importación de capacidad completada: ${result.summary?.successfully_imported || 0} registros importados`);
    } else {
      toast.error(result.message || 'Error durante la importación de capacidad');
    }
    handleCloseCapacityImport();
  }, [handleCloseCapacityImport]);

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
        cell: (value: any, row: SedeListItem) => (
          <input 
            type="checkbox" 
            className="sedeCheckBox form-check-input" 
            value={row.id} 
            onChange={(e) => handleCheckboxChange(row.id, e.target.checked)} 
          />
        ),
      },
      {
        header: "Número",
        accessorKey: "reps_code",
        cell: (value: any) => <span className="fw-medium text-primary">{value}</span>,
      },
      {
        header: "Nombre de la Sede",
        accessorKey: "name",
        cell: (value: any, row: SedeListItem) => (
          <div>
            <span className="fw-medium">{value}</span>
            {row.sede_type === 'principal' && (
              <span className="badge bg-success-subtle text-success ms-2 small">Principal</span>
            )}
          </div>
        ),
      },
      {
        header: "Ubicación", 
        accessorKey: "address",
        cell: (value: any, row: SedeListItem) => (
          <div>
            <div className="fw-medium">{row.municipality_name}</div>
            <small className="text-muted">{row.department_name}</small>
          </div>
        ),
      },
      {
        header: "Contacto",
        accessorKey: "phone_primary",
        cell: (value: any, row: SedeListItem) => (
          <div>
            <div className="small">{value}</div>
            <div className="small text-muted">{row.email}</div>
          </div>
        ),
      },
      {
        header: "Servicios",
        accessorKey: "services_count",
        cell: (value: any) => (
          <span className="badge bg-primary-subtle text-primary">
            {value || 0}
          </span>
        ),
      },
      {
        header: 'Estado',
        accessorKey: 'habilitation_status',
        cell: (value: any, row: SedeListItem) => {
          const getEstadoBadge = (estado: string) => {
            switch (estado?.toLowerCase()) {
              case "habilitada":
                return "bg-success-subtle text-success";
              case "en_proceso":
                return "bg-warning-subtle text-warning";
              case "suspendida":
                return "bg-danger-subtle text-danger";
              case "cancelada":
                return "bg-secondary-subtle text-secondary";
              case "vencida":
                return "bg-danger-subtle text-danger";
              default:
                return "bg-light text-dark";
            }
          };
          
          const displayEstado = (estado: string) => {
            switch (estado?.toLowerCase()) {
              case "habilitada":
                return "Habilitada";
              case "en_proceso":
                return "En Proceso";
              case "suspendida":
                return "Suspendida";
              case "cancelada":
                return "Cancelada";
              case "vencida":
                return "Vencida";
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
                  <span className="badge bg-info-subtle text-info small">Activa</span>
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
        cell: (value: any, row: SedeListItem) => (
          <ul className="list-inline hstack gap-2 mb-0">
            <li className="list-inline-item">
              <button
                className="btn btn-primary btn-sm btn-icon"
                onClick={() => handleViewSede(row)}
                title="Ver detalles"
              >
                <i className="ri-eye-fill"></i>
              </button>
            </li>
            <li className="list-inline-item edit">
              <button
                className="btn btn-success btn-sm btn-icon"
                onClick={() => handleEditSede(row)}
                title="Editar sede"
              >
                <i className="ri-pencil-fill"></i>
              </button>
            </li>
            <li className="list-inline-item">
              <button
                className="btn btn-danger btn-sm btn-icon"
                onClick={() => onClickDelete(row)}
                title="Eliminar sede"
              >
                <i className="ri-delete-bin-5-fill"></i>
              </button>
            </li>
          </ul>
        ),
      },
    ],
    [checkedAll, handleCheckboxChange, handleEditSede, onClickDelete]
  );

  // Loading and error states
  if (organizationLoading || (loading && !sedes.length)) {
    return (
      <LayoutWithBreadcrumb moduleConfig={customModuleConfig}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">
              {organizationLoading ? 'Cargando información de la organización...' : 'Cargando sedes...'}
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
        onDeleteClick={handleDeleteSede}
        onCloseClick={() => setDeleteModal(false)}
      />
      <DeleteModal
        show={deleteModalMulti}
        onDeleteClick={handleDeleteMultiple}
        onCloseClick={() => setDeleteModalMulti(false)}
      />
      
      {/* Sede Form Modal */}
      {state.showCreateModal && hasOrganization && (
        <SedeFormModal
          isOpen={state.showCreateModal}
          onClose={handleCloseModal}
          onSave={handleSaveSede}
          sede={state.selectedSede}
          organizationId={organization!.id}
          isLoading={loading}
        />
      )}
      
      {/* Detail Modal */}
      <SedeDetailModal
        isOpen={state.showDetailModal}
        onClose={handleCloseDetailModal}
        sedeId={state.selectedSedeId}
        onEdit={handleEditFromDetail}
      />
      
      {/* Import Modal */}
      {state.showImportModal && hasOrganization && (
        <div className={`modal fade show`} 
             style={{ display: 'block', zIndex: 1055, backgroundColor: 'rgba(0,0,0,0.5)' }} 
             tabIndex={-1}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-upload-cloud-line me-2"></i>
                  Importar Sedes
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseImport}
                ></button>
              </div>
              <div className="modal-body">
                <SedesImporter
                  organizationId={organization!.id}
                  onImportComplete={handleImportComplete}
                  onCancel={handleCloseImport}
                  isOpen={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capacity Import Modal */}
      <CapacityImportModal
        isOpen={state.showCapacityImportModal}
        onClose={handleCloseCapacityImport}
        onSuccess={handleCapacityImportComplete}
      />

      <div className="row">
        <div className="col-12">
          <div className="card" id="sedesList">
            <div className="card-header border-0">
              <div className="row align-items-center gy-3">
                <div className="col-sm">
                  <h5 className="card-title mb-0">Gestión de Sedes</h5>
                </div>
                <div className="col-sm-auto">
                  <div className="d-flex gap-1 flex-wrap">
                    <button
                      className="btn btn-success add-btn"
                      id="create-btn"
                      onClick={handleCreateSede}
                      disabled={!hasOrganization}
                    >
                      <i className="ri-add-line align-bottom me-1"></i>
                      Crear Sede
                    </button>
                    <button 
                      className="btn btn-info"
                      onClick={handleShowImport}
                      disabled={!hasOrganization}
                    >
                      <i className="ri-upload-cloud-line align-bottom me-1"></i>
                      Importar Sedes
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={handleShowCapacityImport}
                      disabled={!hasOrganization || !sedes || sedes.length === 0}
                      title={!sedes || sedes.length === 0 ? "Debe crear al menos una sede antes de importar capacidad" : "Importar capacidad instalada desde REPS"}
                    >
                      <i className="ri-database-2-line align-bottom me-1"></i>
                      Importar Capacidad
                    </button>
                    {isMultiDeleteButton && (
                      <button 
                        className="btn btn-danger"
                        onClick={() => setDeleteModalMulti(true)}
                        title={`Eliminar ${selectedCheckBoxDelete.length} sede(s) seleccionada(s)`}
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
                      <i className="ri-building-line me-1 align-bottom"></i>
                      Todas las Sedes
                      <span className="badge bg-secondary ms-2">{sedes?.length || 0}</span>
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
                      Habilitadas
                      <span className="badge bg-success ms-2">
                        {sedes?.filter(s => s.habilitation_status === 'habilitada').length || 0}
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
                      Suspendidas
                      <span className="badge bg-danger ms-2">
                        {sedes?.filter(s => s.habilitation_status === 'suspendida').length || 0}
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
                      <i className="ri-time-line me-1 align-bottom"></i>
                      En Proceso
                      <span className="badge bg-warning ms-2">
                        {sedes?.filter(s => s.habilitation_status === 'en_proceso').length || 0}
                      </span>
                    </a>
                  </li>
                </ul>

                {filteredSedes.length > 0 ? (
                  <SimpleTable
                    columns={columns}
                    data={filteredSedes}
                    isGlobalFilter={true}
                    customPageSize={10}
                    divClass="table-responsive table-card mb-1 mt-3"
                    tableClass="align-middle table-nowrap"
                    theadClass="table-light text-muted text-uppercase"
                    SearchPlaceholder='Buscar por número, nombre, ciudad o departamento...'
                  />
                ) : (
                  <div className="mt-4 text-center py-4">
                    {loading ? (
                      <div>
                        <div className="spinner-border text-primary mb-3" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted">Cargando sedes...</p>
                      </div>
                    ) : (
                      <div>
                        <i className="ri-building-line display-4 text-muted mb-3"></i>
                        <h5 className="text-muted">No hay sedes registradas</h5>
                        <p className="text-muted mb-3">
                          {activeTab === "1" 
                            ? "No se han registrado sedes para esta organización."
                            : `No hay sedes con el estado seleccionado.`}
                        </p>
                        {activeTab === "1" && hasOrganization && (
                          <button
                            className="btn btn-primary"
                            onClick={handleCreateSede}
                          >
                            <i className="ri-add-line me-1"></i>
                            Crear Primera Sede
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

export default SedesPage;