import React, { useEffect, useState, useMemo, useCallback } from 'react';
import classnames from 'classnames';
import { useSOGCSConfig } from '../../../../hooks/useModuleConfig';
import { useCurrentOrganization } from '../../../../hooks/useCurrentOrganization';
import LayoutWithBreadcrumb from '../../../../components/layout/LayoutWithBreadcrumb';
import SimpleTable from '../../../../components/common/SimpleTable';
import DeleteModal from '../../../../components/common/DeleteModal';
import ServiceFormModal from './components/modals/ServiceFormModal';
import ServiceDetailModal from './components/modals/ServiceDetailModal';
import ServiceDeleteModal from './components/modals/ServiceDeleteModal';
import ServiceDuplicateModal from './components/modals/ServiceDuplicateModal';
import ServicioImportModal from './components/modals/ServicioImportModal';
import ImportHistory from './components/ImportHistory';
import SimpleDashboardModal from './components/SimpleDashboardModal';
import { toast } from 'react-toastify';
import { useServicioStore } from '../../../../stores/servicioStore';
import type { ServicioListItem, ServicioFilters, ServicioFormData, ServicioDuplicateFormData, SedeHealthService } from '../../../../types/servicios';


// Component state interface
interface ServiciosPageState {
  showCreateModal: boolean;
  showImportModal: boolean;
  showDetailModal: boolean;
  showDuplicateModal: boolean;
  showDeleteModal: boolean;
  showStatsModal: boolean;
  showDashboardModal: boolean;
  showImportHistoryModal: boolean;
  selectedServicio: ServicioListItem | null;
  selectedServicioDetail: SedeHealthService | null;
  selectedServicioId: string | null;
  isEditMode: boolean;
  filters: ServicioFilters;
}

const ServiciosPage = () => {
  document.title = "Servicios de Salud - SOGCS | ZentraQMS";
  
  // Hooks
  const { organization, isLoading: organizationLoading, error: organizationError, hasOrganization } = useCurrentOrganization();
  
  // Store state
  const {
    servicios,
    loading,
    error,
    statistics,
    fetchServicios,
    fetchStatistics,
    createServicio,
    updateServicio,
    deleteServicio,
    bulkDeleteServicios,
    duplicateServicios,
    fetchServicioDetail,
    importServicios,
    validateImport,
    clearError,
  } = useServicioStore();
  
  // State
  const [activeTab, setActiveTab] = useState("1");
  const [state, setState] = useState<ServiciosPageState>({
    showCreateModal: false,
    showImportModal: false,
    showDetailModal: false,
    showDuplicateModal: false,
    showDeleteModal: false,
    showStatsModal: false,
    showDashboardModal: false,
    showImportHistoryModal: false,
    selectedServicio: null,
    selectedServicioDetail: null,
    selectedServicioId: null,
    isEditMode: false,
    filters: {},
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

  // Computed filtered servicios based on active tab
  const filteredServicios = useMemo(() => {
    console.log('🎯 ServiciosPage: filteredServicios computed with:', {
      serviciosExists: !!servicios,
      serviciosLength: servicios?.length,
      serviciosType: typeof servicios,
      activeTab,
      servicios: servicios
    });
    
    if (!servicios) {
      console.log('⚠️ ServiciosPage: servicios is falsy, returning empty array');
      return [];
    }
    
    let filtered;
    switch (activeTab) {
      case "2": // Activos
        filtered = servicios.filter(servicio => servicio.status === 'activo');
        break;
      case "3": // Inactivos
        filtered = servicios.filter(servicio => servicio.status === 'inactivo');
        break;
      case "4": // Suspendidos
        filtered = servicios.filter(servicio => servicio.status === 'suspendido');
        break;
      case "5": // En proceso
        filtered = servicios.filter(servicio => servicio.status === 'en_proceso');
        break;
      default: // Todos los servicios
        filtered = servicios;
    }
    
    console.log('📋 ServiciosPage: filtered result:', {
      filteredLength: filtered.length,
      firstFiltered: filtered[0],
      filtered: filtered
    });
    
    return filtered;
  }, [servicios, activeTab]);

  // Tab toggle handler with optional filtering
  const toggleTab = (tab: string) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      
      // Apply status filter based on tab if needed
      if (hasOrganization) {
        let statusFilter = {};
        switch (tab) {
          case "2": // Activos
            statusFilter = { status: 'activo' };
            break;
          case "3": // Inactivos
            statusFilter = { status: 'inactivo' };
            break;
          case "4": // Suspendidos
            statusFilter = { status: 'suspendido' };
            break;
          case "5": // En proceso
            statusFilter = { status: 'en_proceso' };
            break;
          default: // Todos
            statusFilter = {};
        }
        
        const newFilters = {
          page: 1,
          page_size: 50,
          ...statusFilter,
        };
        
        setState(prev => ({ ...prev, filters: newFilters }));
        
        // Optionally refetch with new filters
        // fetchServicios(newFilters);
      }
    }
  };

  // Load servicios on component mount
  useEffect(() => {
    console.log('🔄 ServiciosPage: useEffect triggered with:', {
      hasOrganization,
      organizationLoading,
      organization: organization?.id
    });
    
    if (hasOrganization) {
      const filters = {
        page: 1,
        page_size: 50,
        ...state.filters,
      };
      
      console.log('📥 ServiciosPage: Starting data load with filters:', filters);
      
      const loadData = async () => {
        try {
          console.log('🚀 ServiciosPage: Calling fetchServicios and fetchStatistics');
          await Promise.all([
            fetchServicios(filters),
            fetchStatistics(filters)
          ]);
          console.log('✅ ServiciosPage: Data loading completed successfully');
        } catch (error) {
          console.error('❌ ServiciosPage: Error loading servicios data:', error);
          toast.error('Error al cargar los datos de servicios');
        }
      };
      
      loadData();
    } else {
      console.log('⏳ ServiciosPage: Not loading data, hasOrganization is false');
    }
  }, [hasOrganization, fetchServicios, fetchStatistics]);

  // Clear any errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Modal handlers
  const handleCreateServicio = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCreateModal: true,
      selectedServicio: null,
      selectedServicioDetail: null,
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

  const handleViewServicio = useCallback((servicio: ServicioListItem) => {
    setState(prev => ({
      ...prev,
      showDetailModal: true,
      selectedServicioId: servicio.id,
    }));
  }, []);

  const handleCloseModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCreateModal: false,
      selectedServicio: null,
      selectedServicioDetail: null,
      isEditMode: false,
    }));
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showDetailModal: false,
      selectedServicioId: null,
    }));
  }, []);

  const handleEditFromDetail = useCallback((servicio: SedeHealthService) => {
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
      selectedServicioDetail: servicio,
      isEditMode: true,
    }));
  }, []);

  const handleShowImport = useCallback(() => {
    setState(prev => ({ ...prev, showImportModal: true }));
  }, []);

  const handleCloseImport = useCallback(() => {
    setState(prev => ({ ...prev, showImportModal: false }));
  }, []);

  const handleImportComplete = useCallback(async (result: any) => {
    if (!hasOrganization) {
      toast.error('No se pudo identificar la organización');
      return;
    }

    try {
      if (result.success) {
        let message = `Importación exitosa: ${result.imported_count || 0} servicios importados`;
        if (result.updated_count > 0) {
          message += `, ${result.updated_count} actualizados`;
        }
        toast.success(message);
        
        // Refresh data
        const filters = {
          page: 1,
          page_size: 50,
          ...state.filters,
        };
        await fetchServicios(filters);
        await fetchStatistics(filters);
      } else {
        toast.error(result.message || 'Error durante la importación');
      }
      
      handleCloseImport();
    } catch (error) {
      console.error('Error handling import completion:', error);
      toast.error('Error al procesar los resultados de la importación');
    }
  }, [hasOrganization, state.filters, fetchServicios, fetchStatistics, handleCloseImport]);

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

  const handleShowDashboard = useCallback(() => {
    setState(prev => ({ ...prev, showDashboardModal: true }));
  }, []);

  const handleCloseDashboard = useCallback(() => {
    setState(prev => ({ ...prev, showDashboardModal: false }));
  }, []);

  const handleShowImportHistory = useCallback(() => {
    setState(prev => ({ ...prev, showImportHistoryModal: true }));
  }, []);

  const handleCloseImportHistory = useCallback(() => {
    setState(prev => ({ ...prev, showImportHistoryModal: false }));
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
      
      // Refresh data
      const filters = {
        page: 1,
        page_size: 50,
        ...state.filters,
      };
      await fetchServicios(filters);
      await fetchStatistics(filters);
    } catch (error) {
      console.error('Error saving servicio:', error);
      toast.error(state.isEditMode ? 'Error al actualizar el servicio' : 'Error al crear el servicio');
    }
  }, [hasOrganization, state.isEditMode, state.selectedServicio, state.filters, updateServicio, createServicio, handleCloseModal, fetchServicios, fetchStatistics]);

  // Handle duplicate operation
  const handleSaveDuplicate = useCallback(async (formData: ServicioDuplicateFormData) => {
    if (!hasOrganization) {
      toast.error('No se pudo identificar la organización');
      return;
    }

    try {
      const result = await duplicateServicios(formData);
      if (result.success) {
        toast.success(`${result.created_count || 0} servicios duplicados exitosamente`);
        handleCloseDuplicate();
        
        // Refresh data
        const filters = {
          page: 1,
          page_size: 50,
          ...state.filters,
        };
        await fetchServicios(filters);
        await fetchStatistics(filters);
      } else {
        toast.error('Error al duplicar los servicios');
      }
    } catch (error) {
      console.error('Error duplicating servicios:', error);
      toast.error('Error al duplicar los servicios');
    }
  }, [hasOrganization, state.filters, duplicateServicios, handleCloseDuplicate, fetchServicios, fetchStatistics]);

  const onClickDelete = useCallback((servicio: ServicioListItem) => {
    setState(prev => ({ ...prev, selectedServicio: servicio, showDeleteModal: true }));
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setState(prev => ({ ...prev, showDeleteModal: false, selectedServicio: null }));
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!state.selectedServicio) return;

    try {
      await deleteServicio(state.selectedServicio.id);
      toast.success('Servicio eliminado exitosamente');
      handleCloseDeleteModal();
      
      // Refresh data
      const filters = {
        page: 1,
        page_size: 50,
        ...state.filters,
      };
      await fetchServicios(filters);
      await fetchStatistics(filters);
    } catch (error) {
      console.error('Error deleting servicio:', error);
      toast.error('Error al eliminar el servicio');
    }
  }, [state.selectedServicio, state.filters, deleteServicio, handleCloseDeleteModal, fetchServicios, fetchStatistics]);

  const handleDeleteServicio = useCallback(async () => {
    if (!state.selectedServicio) return;

    try {
      await deleteServicio(state.selectedServicio.id);
      toast.success('Servicio eliminado exitosamente');
      setDeleteModal(false);
      setState(prev => ({ ...prev, selectedServicio: null }));
      
      // Refresh data
      const filters = {
        page: 1,
        page_size: 50,
        ...state.filters,
      };
      await fetchServicios(filters);
      await fetchStatistics(filters);
    } catch (error) {
      console.error('Error deleting servicio:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el servicio');
    }
  }, [state.selectedServicio, deleteServicio, fetchServicios, fetchStatistics, state.filters]);

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
      
      // Refresh data
      const filters = {
        page: 1,
        page_size: 50,
        ...state.filters,
      };
      await fetchServicios(filters);
      await fetchStatistics(filters);
    } catch (error) {
      console.error('Error deleting multiple servicios:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar los servicios seleccionados');
    }
  }, [hasOrganization, selectedCheckBoxDelete, bulkDeleteServicios, fetchServicios, fetchStatistics, state.filters]);

  // Utility function to refresh data
  const refreshData = useCallback(async () => {
    if (!hasOrganization) return;
    
    try {
      const filters = {
        page: 1,
        page_size: 50,
        ...state.filters,
      };
      await Promise.all([
        fetchServicios(filters),
        fetchStatistics(filters)
      ]);
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Error al actualizar los datos');
    }
  }, [hasOrganization, state.filters, fetchServicios, fetchStatistics]);


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
        cell: (value: any, row: any) => (
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
        cell: (value: any, row: any) => (
          <div>
            <span className="fw-medium">{value}</span>
            <div className="text-muted small">{row.service_category}</div>
          </div>
        ),
      },
      {
        header: "Sede", 
        accessorKey: "sede_name",
        cell: (value: any, row: any) => (
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
        cell: (value: any, row: any) => {
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
            <span className={`badge ${getEstadoBadge(value)}`}>
              {displayEstado(value)}
            </span>
          );
        }
      },
      {
        header: "Acciones",
        accessorKey: "acciones",
        enableSorting: false,
        cell: (value: any, row: any) => (
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
  if (organizationLoading || (loading && (!servicios || servicios.length === 0))) {
    return (
      <LayoutWithBreadcrumb moduleConfig={customModuleConfig}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">
              {organizationLoading ? 'Cargando información de la organización...' : 'Cargando servicios de salud...'}
            </p>
            <small className="text-muted">
              Conectando con el backend para obtener los datos...
            </small>
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
      {/* Modals */}
      <ServiceFormModal
        isOpen={state.showCreateModal}
        onClose={handleCloseModal}
        onSave={handleSaveServicio}
        servicio={state.selectedServicioDetail}
        organizationId={organization?.id || ''}
        isLoading={loading}
      />
      
      <ServiceDetailModal
        isOpen={state.showDetailModal}
        onClose={handleCloseDetailModal}
        servicioId={state.selectedServicioId}
        isLoading={loading}
        onEdit={handleEditFromDetail}
      />
      
      <ServiceDeleteModal
        isOpen={state.showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        servicio={state.selectedServicio ? {
          ...state.selectedServicio,
          sede: state.selectedServicio.sede_reps_code,
          sede_name: state.selectedServicio.sede_name,
          sede_reps_code: state.selectedServicio.sede_reps_code,
          service_catalog: '',
          is_24_hours: false,
          medical_staff_count: 0,
          nursing_staff_count: 0,
          technical_staff_count: 0,
          equipment_list: [],
          updated_at: state.selectedServicio.created_at,
        } as SedeHealthService : undefined}
        isLoading={loading}
      />
      
      <ServiceDuplicateModal
        isOpen={state.showDuplicateModal}
        onClose={handleCloseDuplicate}
        onSave={handleSaveDuplicate}
        isLoading={loading}
      />

      <ServicioImportModal
        isOpen={state.showImportModal}
        onImportComplete={handleImportComplete}
        onCancel={handleCloseImport}
        sedeOptions={[]} // We'll populate this with available sedes
      />

      <ImportHistory
        isOpen={state.showImportHistoryModal}
        onClose={handleCloseImportHistory}
      />

      <SimpleDashboardModal
        isOpen={state.showDashboardModal}
        onClose={handleCloseDashboard}
        title="Dashboard Avanzado de Servicios de Salud"
      />

      {/* Legacy Delete Modals (for bulk operations) */}
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


      <div className="row">
        <div className="col-12">
          <div className="card" id="serviciosList">
            <div className="card-header border-0">
              <div className="row align-items-center gy-3">
                <div className="col-sm">
                  <h5 className="card-title mb-0">Gestión de Servicios de Salud</h5>
                  <p className="text-muted mb-0">Sistema de administración de servicios habilitados por sede</p>
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
                      className="btn btn-outline-info"
                      onClick={handleShowImportHistory}
                      disabled={!hasOrganization}
                      title="Ver historial de importaciones"
                    >
                      <i className="ri-history-line align-bottom me-1"></i>
                      Historial
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
                      disabled={!hasOrganization}
                    >
                      <i className="ri-bar-chart-line align-bottom me-1"></i>
                      Estadísticas
                    </button>
                    <button 
                      className="btn btn-info"
                      onClick={handleShowDashboard}
                      disabled={!hasOrganization}
                    >
                      <i className="ri-dashboard-3-line align-bottom me-1"></i>
                      Dashboard
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
              <div className="card-footer">
                <div className="alert alert-danger mb-0" role="alert">
                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <i className="ri-error-warning-line fs-4"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="alert-heading">Error al cargar servicios</h6>
                      <p className="mb-2">{error}</p>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          clearError();
                          refreshData();
                        }}
                      >
                        <i className="ri-refresh-line me-1"></i>
                        Reintentar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backend Integration Status */}
            <div className="card-footer">
              <div className="alert alert-success mb-0" role="alert">
                <div className="d-flex">
                  <div className="flex-shrink-0">
                    <i className="ri-check-double-line fs-4"></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="alert-heading">Integración Backend Completada</h6>
                    <p className="mb-2">
                      La interfaz de servicios de salud está ahora completamente integrada con el backend. 
                      Los datos mostrados provienen directamente de la API y las operaciones de eliminación funcionan con datos reales.
                    </p>
                    <div className="d-flex gap-2 flex-wrap">
                      <span className="badge bg-success-subtle text-success">
                        <i className="ri-database-2-line me-1"></i>
                        Datos reales del backend
                      </span>
                      <span className="badge bg-info-subtle text-info">
                        <i className="ri-delete-bin-line me-1"></i>
                        Eliminación funcional
                      </span>
                      <span className="badge bg-warning-subtle text-warning">
                        <i className="ri-file-add-line me-1"></i>
                        Creación/Edición próximamente
                      </span>
                      {loading && (
                        <span className="badge bg-primary-subtle text-primary">
                          <span className="spinner-border spinner-border-sm me-1"></span>
                          Cargando...
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={refreshData}
                        disabled={loading}
                      >
                        <i className="ri-refresh-line me-1"></i>
                        Actualizar Datos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWithBreadcrumb>
  );
};

export default ServiciosPage;