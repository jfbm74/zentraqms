/**
 * Store Zustand para el módulo de organigramas organizacionales
 * ZentraQMS - Sistema de Gestión de Calidad
 * 
 * Maneja el estado completo del módulo incluyendo:
 * - Datos de sectores, plantillas, organigramas, áreas y cargos
 * - Estados de carga y errores
 * - Configuración de vista y filtros
 * - Modo de edición y cambios sin guardar
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { toast } from 'react-toastify';

import {
  OrganizationalChartState,
  Sector,
  PlantillaOrganigrama,
  OrganizationalChart,
  Area,
  Cargo,
  ChartData,
  OrganizationalChartForm,
  ChartViewConfig,
  ChartFilters
} from '../../types/organizationalChart';

import organizationalChartService from '../../services/organizationalChart/organizationalChartService';

// ============================================================================
// CONFIGURACIÓN INICIAL DEL ESTADO
// ============================================================================

const initialViewConfig: ChartViewConfig = {
  layout: 'vertical',
  compactMode: false,
  showPhotos: true,
  showBadges: true,
  showHierarchyLines: true,
  zoomLevel: 1,
  centerOnNode: undefined
};

const initialFilters: ChartFilters = {
  showVacantOnly: false,
  showCriticalOnly: false,
  areaFilter: undefined,
  levelFilter: undefined,
  departmentFilter: undefined,
  searchQuery: ''
};

const initialState = {
  // Datos
  sectors: [],
  templates: [],
  currentChart: undefined,
  areas: [],
  positions: [],
  chartData: undefined,

  // Estado de carga
  loading: {
    sectors: false,
    templates: false,
    chart: false,
    areas: false,
    positions: false,
    saving: false
  },

  // Errores
  errors: {
    load: null,
    save: null,
    validation: null
  },

  // Configuración de vista
  viewConfig: initialViewConfig,
  filters: initialFilters,

  // Estado de edición
  editMode: false,
  hasUnsavedChanges: false,
  selectedNodeId: undefined
};

// ============================================================================
// STORE PRINCIPAL
// ============================================================================

export const useOrganizationalChartStore = create<OrganizationalChartState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ====================================================================
        // ACCIONES DE CARGA DE DATOS
        // ====================================================================

        loadSectors: async () => {
          set((state) => {
            state.loading.sectors = true;
            state.errors.load = null;
          });

          try {
            const sectors = await organizationalChartService.sector.getAll();
            
            set((state) => {
              state.sectors = sectors;
              state.loading.sectors = false;
            });

            console.log('Sectores cargados:', sectors.length);
          } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Error al cargar sectores';
            
            set((state) => {
              state.loading.sectors = false;
              state.errors.load = errorMessage;
            });

            toast.error(`Error al cargar sectores: ${errorMessage}`);
            throw error;
          }
        },

        loadTemplates: async (sectorId?: string) => {
          set((state) => {
            state.loading.templates = true;
            state.errors.load = null;
          });

          try {
            const templates = await organizationalChartService.template.getBySector(sectorId);
            
            set((state) => {
              state.templates = templates;
              state.loading.templates = false;
            });

            console.log('Plantillas cargadas:', templates.length);
          } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Error al cargar plantillas';
            
            set((state) => {
              state.loading.templates = false;
              state.errors.load = errorMessage;
            });

            toast.error(`Error al cargar plantillas: ${errorMessage}`);
            throw error;
          }
        },

        loadChart: async (chartId: string) => {
          set((state) => {
            state.loading.chart = true;
            state.errors.load = null;
          });

          try {
            const chart = await organizationalChartService.chart.getById(chartId);
            
            set((state) => {
              state.currentChart = chart;
              state.loading.chart = false;
            });

            // Cargar automáticamente áreas y posiciones
            await Promise.all([
              get().loadAreas(chartId),
              get().loadPositions(chartId)
            ]);

            // Construir datos del gráfico
            await get().buildChartData();

            console.log('Organigrama cargado:', chart.version);
          } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Error al cargar organigrama';
            
            set((state) => {
              state.loading.chart = false;
              state.errors.load = errorMessage;
            });

            toast.error(`Error al cargar organigrama: ${errorMessage}`);
            throw error;
          }
        },

        loadAreas: async (chartId: string) => {
          set((state) => {
            state.loading.areas = true;
            state.errors.load = null;
          });

          try {
            const areas = await organizationalChartService.area.getByChart(chartId);
            
            set((state) => {
              state.areas = areas;
              state.loading.areas = false;
            });

            console.log('Áreas cargadas:', areas.length);
          } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Error al cargar áreas';
            
            set((state) => {
              state.loading.areas = false;
              state.errors.load = errorMessage;
            });

            toast.error(`Error al cargar áreas: ${errorMessage}`);
            throw error;
          }
        },

        loadPositions: async (chartId: string) => {
          set((state) => {
            state.loading.positions = true;
            state.errors.load = null;
          });

          try {
            const positions = await organizationalChartService.position.getByChart(chartId);
            
            set((state) => {
              state.positions = positions;
              state.loading.positions = false;
            });

            console.log('Cargos cargados:', positions.length);
          } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Error al cargar cargos';
            
            set((state) => {
              state.loading.positions = false;
              state.errors.load = errorMessage;
            });

            toast.error(`Error al cargar cargos: ${errorMessage}`);
            throw error;
          }
        },

        // ====================================================================
        // ACCIONES CRUD PARA ORGANIGRAMAS
        // ====================================================================

        createChart: async (data: OrganizationalChartForm & { organization: string; sector: string }) => {
          set((state) => {
            state.loading.saving = true;
            state.errors.save = null;
          });

          try {
            const newChart = await organizationalChartService.chart.create(data);
            
            set((state) => {
              state.currentChart = newChart;
              state.loading.saving = false;
              state.hasUnsavedChanges = false;
            });

            toast.success('Organigrama creado exitosamente');
            console.log('Organigrama creado:', newChart.id);
            
            return newChart.id;
          } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Error al crear organigrama';
            
            set((state) => {
              state.loading.saving = false;
              state.errors.save = errorMessage;
            });

            toast.error(`Error al crear organigrama: ${errorMessage}`);
            throw error;
          }
        },

        updateChart: async (chartId: string, data: Partial<OrganizationalChartForm>) => {
          set((state) => {
            state.loading.saving = true;
            state.errors.save = null;
          });

          try {
            const updatedChart = await organizationalChartService.chart.update(chartId, data);
            
            set((state) => {
              state.currentChart = updatedChart;
              state.loading.saving = false;
              state.hasUnsavedChanges = false;
            });

            toast.success('Organigrama actualizado exitosamente');
            console.log('Organigrama actualizado:', updatedChart.id);
          } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Error al actualizar organigrama';
            
            set((state) => {
              state.loading.saving = false;
              state.errors.save = errorMessage;
            });

            toast.error(`Error al actualizar organigrama: ${errorMessage}`);
            throw error;
          }
        },

        deleteChart: async (chartId: string) => {
          set((state) => {
            state.loading.saving = true;
            state.errors.save = null;
          });

          try {
            await organizationalChartService.chart.delete(chartId);
            
            set((state) => {
              if (state.currentChart?.id === chartId) {
                state.currentChart = undefined;
                state.areas = [];
                state.positions = [];
                state.chartData = undefined;
              }
              state.loading.saving = false;
              state.hasUnsavedChanges = false;
            });

            toast.success('Organigrama eliminado exitosamente');
            console.log('Organigrama eliminado:', chartId);
          } catch (error: any) {
            const errorMessage = error.response?.data?.detail || error.message || 'Error al eliminar organigrama';
            
            set((state) => {
              state.loading.saving = false;
              state.errors.save = errorMessage;
            });

            toast.error(`Error al eliminar organigrama: ${errorMessage}`);
            throw error;
          }
        },

        // ====================================================================
        // ACCIONES PARA VISUALIZACIÓN
        // ====================================================================

        buildChartData: async () => {
          const { currentChart } = get();
          if (!currentChart) return;

          try {
            const chartData = await organizationalChartService.visualization.buildChartData(currentChart.id);
            
            set((state) => {
              state.chartData = chartData;
            });

            console.log('Datos del gráfico construidos:', chartData.metadata.totalNodes, 'nodos');
          } catch (error: any) {
            console.error('Error al construir datos del gráfico:', error);
            toast.error('Error al procesar datos del organigrama');
          }
        },

        // ====================================================================
        // ACCIONES DE CONFIGURACIÓN
        // ====================================================================

        setViewConfig: (config: Partial<ChartViewConfig>) => {
          set((state) => {
            state.viewConfig = { ...state.viewConfig, ...config };
          });
        },

        setFilters: (filters: Partial<ChartFilters>) => {
          set((state) => {
            state.filters = { ...state.filters, ...filters };
          });
        },

        setEditMode: (enabled: boolean) => {
          set((state) => {
            state.editMode = enabled;
            if (!enabled) {
              state.selectedNodeId = undefined;
            }
          });
        },

        selectNode: (nodeId?: string) => {
          set((state) => {
            state.selectedNodeId = nodeId;
          });
        },

        // ====================================================================
        // UTILIDADES
        // ====================================================================

        clearErrors: () => {
          set((state) => {
            state.errors = {
              load: null,
              save: null,
              validation: null
            };
          });
        },

        reset: () => {
          set((state) => {
            return { ...initialState };
          });
        },

        // ====================================================================
        // GETTERS COMPUTADOS
        // ====================================================================

        getFilteredNodes: () => {
          const { chartData, filters } = get();
          if (!chartData) return [];

          let nodes = [...chartData.nodes];

          // Aplicar filtros
          if (filters.showVacantOnly) {
            nodes = nodes.filter(node => node.isVacant);
          }

          if (filters.showCriticalOnly) {
            nodes = nodes.filter(node => node.isCritical);
          }

          if (filters.areaFilter) {
            nodes = nodes.filter(node => node.area === filters.areaFilter);
          }

          if (filters.levelFilter) {
            nodes = nodes.filter(node => node.level === organizationalChartService.visualization.mapHierarchyLevelToNumber(filters.levelFilter));
          }

          if (filters.departmentFilter) {
            nodes = nodes.filter(node => node.department === filters.departmentFilter);
          }

          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            nodes = nodes.filter(node => 
              node.name.toLowerCase().includes(query) ||
              node.position.toLowerCase().includes(query) ||
              node.area.toLowerCase().includes(query) ||
              node.department.toLowerCase().includes(query)
            );
          }

          return nodes;
        },

        getAreasHierarchy: () => {
          const { areas } = get();
          return organizationalChartService.area.buildHierarchy(areas);
        },

        getCurrentChartStatistics: async () => {
          const { currentChart } = get();
          if (!currentChart) return null;

          try {
            return await organizationalChartService.chart.getStatistics(currentChart.id);
          } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return null;
          }
        }

      })),
      {
        name: 'organizational-chart-store',
        // Solo persistir configuraciones de vista, no datos temporales
        partialize: (state) => ({
          viewConfig: state.viewConfig,
          filters: {
            ...state.filters,
            searchQuery: '' // No persistir búsquedas
          }
        })
      }
    ),
    {
      name: 'OrganizationalChartStore'
    }
  )
);

// ============================================================================
// HOOKS DE UTILIDAD
// ============================================================================

/**
 * Hook para obtener solo el estado de carga
 */
export const useOrganizationalChartLoading = () => {
  return useOrganizationalChartStore(state => state.loading);
};

/**
 * Hook para obtener solo los errores
 */
export const useOrganizationalChartErrors = () => {
  return useOrganizationalChartStore(state => state.errors);
};

/**
 * Hook para obtener solo los datos del gráfico actual
 */
export const useCurrentChart = () => {
  return useOrganizationalChartStore(state => ({
    chart: state.currentChart,
    chartData: state.chartData,
    areas: state.areas,
    positions: state.positions
  }));
};

/**
 * Hook para obtener configuración de vista y filtros
 */
export const useChartViewSettings = () => {
  return useOrganizationalChartStore(state => ({
    viewConfig: state.viewConfig,
    filters: state.filters,
    setViewConfig: state.setViewConfig,
    setFilters: state.setFilters
  }));
};

/**
 * Hook para estado de edición
 */
export const useChartEditMode = () => {
  return useOrganizationalChartStore(state => ({
    editMode: state.editMode,
    hasUnsavedChanges: state.hasUnsavedChanges,
    selectedNodeId: state.selectedNodeId,
    setEditMode: state.setEditMode,
    selectNode: state.selectNode
  }));
};

export default useOrganizationalChartStore;