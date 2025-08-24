import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useCurrentOrganization } from '../../hooks/useCurrentOrganization';
import organizationalChartService from '../../services/organizationalChart/organizationalChartService';
import positionService, { PositionFilters } from '../../services/positionService';
import { Cargo, OrganizationalChart, Area, HierarchyLevel, PositionType } from '../../types/organizationalChart';
import { toast } from 'react-toastify';

// Componentes de UI
import LayoutWithBreadcrumb from '../../components/layout/LayoutWithBreadcrumb';
import { ModuleConfig } from '../../components/layout/ModuleLayout';
import SimpleTable from '../../components/common/SimpleTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Modales
import PositionFormModal from './components/PositionFormModal';
import PositionDetailModal from './components/PositionDetailModal';
import PositionDeleteModal from './components/PositionDeleteModal';
import UserAssignmentModal from './components/UserAssignmentModal';

interface PositionsPageState {
  showCreateModal: boolean;
  showDetailModal: boolean;
  showDeleteModal: boolean;
  showAssignmentModal: boolean;
  selectedPosition: Cargo | null;
  selectedPositionId: string | null;
  isEditMode: boolean;
  filters: PositionFilters;
}

const PositionsManagementPage = () => {
  document.title = "Gestión de Puestos - Organigrama | ZentraQMS";
  
  // Hooks
  const { organization, isLoading: organizationLoading, hasOrganization } = useCurrentOrganization();
  
  // Estado local
  const [state, setState] = useState<PositionsPageState>({
    showCreateModal: false,
    showDetailModal: false,
    showDeleteModal: false,
    showAssignmentModal: false,
    selectedPosition: null,
    selectedPositionId: null,
    isEditMode: false,
    filters: {}
  });

  // Estados de datos
  const [positions, setPositions] = useState<Cargo[]>([]);
  const [currentChart, setCurrentChart] = useState<OrganizationalChart | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState({
    positions: false,
    chart: false,
    areas: false,
    action: false
  });
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 25,
    total: 0
  });

  // Module configuration for LayoutWithBreadcrumb
  const moduleConfig: ModuleConfig = {
    breadcrumb: {
      title: "Organigrama",
      pageTitle: "Gestión de Puestos"
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (hasOrganization && organization?.id) {
      loadInitialData();
    }
  }, [hasOrganization, organization?.id]);

  const loadInitialData = async () => {
    if (!organization?.id) return;

    try {
      setLoading(prev => ({ ...prev, chart: true }));
      
      // Obtener el organigrama actual
      const chart = await organizationalChartService.chart.getCurrent(organization.id);
      
      if (chart) {
        setCurrentChart(chart);
        await Promise.all([
          loadPositions(chart.id),
          loadAreas(chart.id)
        ]);
      } else {
        setError('No se encontró un organigrama activo para esta organización');
      }
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      setError('Error al cargar los datos del organigrama');
      toast.error('Error al cargar los datos del organigrama');
    } finally {
      setLoading(prev => ({ ...prev, chart: false }));
    }
  };

  const loadPositions = async (chartId: string) => {
    if (!chartId) return;

    try {
      setLoading(prev => ({ ...prev, positions: true }));
      setError(null);

      const filters: PositionFilters = {
        chart: chartId,
        page: pagination.currentPage,
        page_size: pagination.pageSize,
        ...state.filters
      };

      const response = await positionService.getPositions(filters);
      
      setPositions(response.results);
      setPagination(prev => ({
        ...prev,
        total: response.count
      }));

    } catch (error: any) {
      console.error('Error loading positions:', error);
      setError('Error al cargar las posiciones');
      toast.error('Error al cargar las posiciones');
    } finally {
      setLoading(prev => ({ ...prev, positions: false }));
    }
  };

  const loadAreas = async (chartId: string) => {
    if (!chartId) return;

    try {
      setLoading(prev => ({ ...prev, areas: true }));
      const areasData = await organizationalChartService.area.getByChart(chartId);
      setAreas(areasData);
    } catch (error: any) {
      console.error('Error loading areas:', error);
      toast.error('Error al cargar las áreas');
    } finally {
      setLoading(prev => ({ ...prev, areas: false }));
    }
  };

  // Handlers de acciones
  const handleCreatePosition = () => {
    setState(prev => ({
      ...prev,
      showCreateModal: true,
      isEditMode: false,
      selectedPosition: null
    }));
  };

  const handleEditPosition = (position: Cargo) => {
    setState(prev => ({
      ...prev,
      showCreateModal: true,
      isEditMode: true,
      selectedPosition: position
    }));
  };

  const handleViewPosition = async (positionId: string) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      const position = await positionService.getPosition(positionId);
      setState(prev => ({
        ...prev,
        showDetailModal: true,
        selectedPosition: position
      }));
    } catch (error: any) {
      console.error('Error loading position details:', error);
      toast.error('Error al cargar los detalles del puesto');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleDeletePosition = (position: Cargo) => {
    setState(prev => ({
      ...prev,
      showDeleteModal: true,
      selectedPosition: position
    }));
  };

  const handleAssignUser = (position: Cargo) => {
    setState(prev => ({
      ...prev,
      showAssignmentModal: true,
      selectedPosition: position
    }));
  };

  const handleSavePosition = async (positionData: any) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));

      if (state.isEditMode && state.selectedPosition) {
        await positionService.updatePosition(state.selectedPosition.id, positionData);
        toast.success('Puesto actualizado exitosamente');
      } else {
        await positionService.createPosition(positionData);
        toast.success('Puesto creado exitosamente');
      }

      // Recargar posiciones
      if (currentChart) {
        await loadPositions(currentChart.id);
      }

      setState(prev => ({
        ...prev,
        showCreateModal: false,
        selectedPosition: null,
        isEditMode: false
      }));

    } catch (error: any) {
      console.error('Error saving position:', error);
      toast.error(state.isEditMode ? 'Error al actualizar el puesto' : 'Error al crear el puesto');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!state.selectedPosition) return;

    try {
      setLoading(prev => ({ ...prev, action: true }));
      await positionService.deletePosition(state.selectedPosition.id);
      toast.success('Puesto eliminado exitosamente');

      // Recargar posiciones
      if (currentChart) {
        await loadPositions(currentChart.id);
      }

      setState(prev => ({
        ...prev,
        showDeleteModal: false,
        selectedPosition: null
      }));

    } catch (error: any) {
      console.error('Error deleting position:', error);
      toast.error('Error al eliminar el puesto');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleUserAssignment = async (assignmentData: any) => {
    if (!state.selectedPosition) return;

    try {
      setLoading(prev => ({ ...prev, action: true }));
      await positionService.assignUserToPosition(state.selectedPosition.id, assignmentData);
      toast.success('Usuario asignado exitosamente');

      // Recargar posiciones
      if (currentChart) {
        await loadPositions(currentChart.id);
      }

      setState(prev => ({
        ...prev,
        showAssignmentModal: false,
        selectedPosition: null
      }));

    } catch (error: any) {
      console.error('Error assigning user:', error);
      toast.error('Error al asignar el usuario');
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Configuración de columnas para la tabla
  const tableColumns = [
    {
      accessorKey: 'code',
      header: 'Código',
      enableSorting: true
    },
    {
      accessorKey: 'name',
      header: 'Nombre del Puesto',
      enableSorting: true,
      cell: (value: any, position: Cargo) => (
        <div>
          <div className="fw-medium">{position.name}</div>
          <small className="text-muted">{position.area_name}</small>
        </div>
      )
    },
    {
      accessorKey: 'hierarchy_level',
      header: 'Nivel Jerárquico',
      enableSorting: true,
      cell: (value: any, position: Cargo) => (
        <span 
          className={`badge bg-${getHierarchyLevelColor(position.hierarchy_level)} text-uppercase`}
        >
          {getHierarchyLevelLabel(position.hierarchy_level)}
        </span>
      )
    },
    {
      accessorKey: 'assigned_user',
      header: 'Asignado a',
      cell: (value: any, position: Cargo) => (
        position.assigned_user ? (
          <div>
            <div className="fw-medium">{position.assigned_user.full_name}</div>
            <small className="text-muted">{position.assigned_user.email}</small>
          </div>
        ) : (
          <span className="badge bg-warning">Vacante</span>
        )
      )
    },
    {
      accessorKey: 'is_critical',
      header: 'Estado',
      cell: (value: any, position: Cargo) => (
        <div>
          {position.is_critical && (
            <span className="badge bg-danger me-1">Crítico</span>
          )}
          {position.is_active ? (
            <span className="badge bg-success">Activo</span>
          ) : (
            <span className="badge bg-secondary">Inactivo</span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'actions',
      header: 'Acciones',
      enableSorting: false,
      cell: (value: any, position: Cargo) => (
        <div className="d-flex gap-1">
          <button
            className="btn btn-outline-info btn-sm"
            onClick={() => handleViewPosition(position.id)}
            disabled={loading.action}
          >
            <i className="ri-eye-line"></i>
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => handleEditPosition(position)}
            disabled={loading.action}
          >
            <i className="ri-edit-line"></i>
          </button>
          <button
            className="btn btn-outline-success btn-sm"
            onClick={() => handleAssignUser(position)}
            disabled={loading.action}
            title={position.assigned_user ? 'Reasignar usuario' : 'Asignar usuario'}
          >
            <i className="ri-user-add-line"></i>
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => handleDeletePosition(position)}
            disabled={loading.action}
          >
            <i className="ri-delete-bin-line"></i>
          </button>
        </div>
      )
    }
  ];

  // Funciones auxiliares
  const getHierarchyLevelColor = (level: HierarchyLevel): string => {
    const colors: Record<HierarchyLevel, string> = {
      'BOARD': 'purple',
      'EXECUTIVE': 'primary',
      'SENIOR_MANAGEMENT': 'info',
      'MIDDLE_MANAGEMENT': 'success',
      'PROFESSIONAL': 'warning',
      'TECHNICAL': 'secondary',
      'AUXILIARY': 'light',
      'OPERATIONAL': 'dark'
    };
    return colors[level] || 'secondary';
  };

  const getHierarchyLevelLabel = (level: HierarchyLevel): string => {
    const labels: Record<HierarchyLevel, string> = {
      'BOARD': 'Junta',
      'EXECUTIVE': 'Ejecutivo',
      'SENIOR_MANAGEMENT': 'Alta Gerencia',
      'MIDDLE_MANAGEMENT': 'Gerencia Media',
      'PROFESSIONAL': 'Profesional',
      'TECHNICAL': 'Técnico',
      'AUXILIARY': 'Auxiliar',
      'OPERATIONAL': 'Operacional'
    };
    return labels[level] || level;
  };

  // Renderizado
  if (organizationLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <LoadingSpinner />
        <span className="ms-2">Cargando organización...</span>
      </div>
    );
  }

  if (!hasOrganization) {
    return (
      <LayoutWithBreadcrumb moduleConfig={moduleConfig}>
        <div className="container-fluid">
          <div className="text-center py-5">
            <i className="ri-building-line display-4 text-muted"></i>
            <h4 className="mt-3">No hay organización seleccionada</h4>
            <p className="text-muted">
              Selecciona una organización para gestionar sus puestos.
            </p>
          </div>
        </div>
      </LayoutWithBreadcrumb>
    );
  }

  return (
    <LayoutWithBreadcrumb moduleConfig={moduleConfig}>
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-12">
            <div className="card">
              <div className="card-header">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="card-title mb-0">Gestión de Puestos</h5>
                    {currentChart && (
                      <small className="text-muted">
                        Organigrama: {currentChart.organization_name} - Versión {currentChart.version}
                      </small>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreatePosition}
                    disabled={loading.positions || !currentChart}
                  >
                    <i className="ri-add-line me-1"></i>
                    Nuevo Puesto
                  </button>
                </div>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {loading.positions ? (
                  <div className="text-center py-4">
                    <LoadingSpinner />
                    <p className="mt-2">Cargando puestos...</p>
                  </div>
                ) : (
                  <SimpleTable
                    data={positions}
                    columns={tableColumns}
                    isGlobalFilter={true}
                    SearchPlaceholder="Buscar puestos..."
                    customPageSize={pagination.pageSize}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <PositionFormModal
        show={state.showCreateModal}
        onHide={() => setState(prev => ({ ...prev, showCreateModal: false }))}
        position={state.selectedPosition}
        isEditMode={state.isEditMode}
        areas={areas}
        positions={positions}
        onSave={handleSavePosition}
        loading={loading.action}
      />

      <PositionDetailModal
        show={state.showDetailModal}
        onHide={() => setState(prev => ({ ...prev, showDetailModal: false }))}
        position={state.selectedPosition}
        loading={loading.action}
      />

      <PositionDeleteModal
        show={state.showDeleteModal}
        onHide={() => setState(prev => ({ ...prev, showDeleteModal: false }))}
        position={state.selectedPosition}
        onConfirm={handleDeleteConfirm}
        loading={loading.action}
      />

      <UserAssignmentModal
        show={state.showAssignmentModal}
        onHide={() => setState(prev => ({ ...prev, showAssignmentModal: false }))}
        position={state.selectedPosition}
        onAssign={handleUserAssignment}
        loading={loading.action}
      />
    </LayoutWithBreadcrumb>
  );
};

export default PositionsManagementPage;