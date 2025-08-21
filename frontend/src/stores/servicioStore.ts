/**
 * Zustand Store for Servicios de Salud Management
 * 
 * This store manages the state for health services operations
 * including CRUD, import/export, filtering, and statistics.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { servicioService } from '@/services/servicioService';
import type {
  ServicioStore,
  SedeHealthService,
  ServicioListItem,
  ServicioFormData,
  ServicioCatalogo,
  ServicioFilters,
  ServicioImportConfig,
  ServicioImportResponse,
  ServicioBulkResponse,
  ServicioStatistics,
  ServicioDuplicateFormData,
} from '@/types/servicios';

// ====================================
// INITIAL STATE
// ====================================

const initialState = {
  servicios: [] as ServicioListItem[],
  currentServicio: null as SedeHealthService | null,
  serviceCatalog: [] as ServicioCatalogo[],
  statistics: null as ServicioStatistics | null,
  loading: false,
  error: null as string | null,
  filters: {} as ServicioFilters,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasNext: false,
    hasPrevious: false,
  },
};

// ====================================
// STORE IMPLEMENTATION
// ====================================

export const useServicioStore = create<ServicioStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      ...initialState,

      // ====================================
      // CORE CRUD OPERATIONS
      // ====================================

      fetchServicios: async (filters: ServicioFilters = {}) => {
        set((state) => {
          state.loading = true;
          state.error = null;
          state.filters = { ...state.filters, ...filters };
        });

        try {
          const response = await servicioService.getServicios(filters);
          
          set((state) => {
            state.servicios = response.results;
            state.pagination = {
              page: filters.page || 1,
              pageSize: filters.page_size || 20,
              total: response.count,
              hasNext: !!response.next,
              hasPrevious: !!response.previous,
            };
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error fetching servicios';
            state.loading = false;
          });
          throw error;
        }
      },

      fetchServicioDetail: async (servicioId: string): Promise<SedeHealthService> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const servicio = await servicioService.getServicioById(servicioId);
          
          set((state) => {
            state.currentServicio = servicio;
            state.loading = false;
          });
          
          return servicio;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error fetching servicio detail';
            state.loading = false;
          });
          throw error;
        }
      },

      fetchServiceCatalog: async (filters: { search?: string; category?: string } = {}) => {
        try {
          const response = await servicioService.getServiceCatalog(filters);
          
          set((state) => {
            state.serviceCatalog = response.results;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error fetching service catalog';
          });
          throw error;
        }
      },

      fetchStatistics: async (filters: ServicioFilters = {}) => {
        try {
          const statistics = await servicioService.getStatistics(filters);
          
          set((state) => {
            state.statistics = statistics;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error fetching statistics';
          });
          throw error;
        }
      },

      createServicio: async (data: ServicioFormData): Promise<SedeHealthService> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const newServicio = await servicioService.createServicio(data);
          
          set((state) => {
            // Add to the list if it matches current filters
            const servicioListItem: ServicioListItem = {
              id: newServicio.id,
              service_code: newServicio.service_code,
              service_name: newServicio.service_name,
              service_category: newServicio.service_category,
              sede_name: newServicio.sede_name,
              sede_reps_code: newServicio.sede_reps_code,
              modality: newServicio.modality,
              complexity: newServicio.complexity,
              capacity: newServicio.capacity,
              status: newServicio.status,
              authorization_date: newServicio.authorization_date,
              is_active: newServicio.is_active,
              created_at: newServicio.created_at,
            };
            
            state.servicios.unshift(servicioListItem);
            state.pagination.total += 1;
            state.currentServicio = newServicio;
            state.loading = false;
          });
          
          return newServicio;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error creating servicio';
            state.loading = false;
          });
          throw error;
        }
      },

      updateServicio: async (servicioId: string, data: Partial<ServicioFormData>): Promise<SedeHealthService> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const updatedServicio = await servicioService.updateServicio(servicioId, data);
          
          set((state) => {
            // Update in the list
            const index = state.servicios.findIndex(servicio => servicio.id === servicioId);
            if (index !== -1) {
              const updatedListItem: ServicioListItem = {
                id: updatedServicio.id,
                service_code: updatedServicio.service_code,
                service_name: updatedServicio.service_name,
                service_category: updatedServicio.service_category,
                sede_name: updatedServicio.sede_name,
                sede_reps_code: updatedServicio.sede_reps_code,
                modality: updatedServicio.modality,
                complexity: updatedServicio.complexity,
                capacity: updatedServicio.capacity,
                status: updatedServicio.status,
                authorization_date: updatedServicio.authorization_date,
                is_active: updatedServicio.is_active,
                created_at: updatedServicio.created_at,
              };
              
              state.servicios[index] = updatedListItem;
            }
            
            // Update current servicio if it's the same
            if (state.currentServicio?.id === servicioId) {
              state.currentServicio = updatedServicio;
            }
            
            state.loading = false;
          });
          
          return updatedServicio;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error updating servicio';
            state.loading = false;
          });
          throw error;
        }
      },

      deleteServicio: async (servicioId: string): Promise<void> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          await servicioService.deleteServicio(servicioId);
          
          set((state) => {
            // Remove from the list
            state.servicios = state.servicios.filter(servicio => servicio.id !== servicioId);
            state.pagination.total -= 1;
            
            // Clear current servicio if it's the same
            if (state.currentServicio?.id === servicioId) {
              state.currentServicio = null;
            }
            
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error deleting servicio';
            state.loading = false;
          });
          throw error;
        }
      },

      // ====================================
      // BULK OPERATIONS
      // ====================================

      bulkCreateServicios: async (servicios: ServicioFormData[]): Promise<ServicioBulkResponse> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await servicioService.bulkCreateServicios(servicios);
          
          if (response.success && response.services) {
            set((state) => {
              // Add new servicios to the beginning of the list
              state.servicios.unshift(...response.services!);
              state.pagination.total += response.created_count || 0;
              state.loading = false;
            });
          } else {
            set((state) => {
              state.error = response.message || 'Error in bulk create';
              state.loading = false;
            });
          }
          
          return response;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error in bulk create servicios';
            state.loading = false;
          });
          throw error;
        }
      },

      bulkUpdateServicios: async (updates: Array<Partial<SedeHealthService> & { id: string }>): Promise<ServicioBulkResponse> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await servicioService.bulkUpdateServicios(updates);
          
          if (response.success && response.services) {
            set((state) => {
              // Update servicios in the list
              response.services!.forEach(updatedServicio => {
                const index = state.servicios.findIndex(servicio => servicio.id === updatedServicio.id);
                if (index !== -1) {
                  state.servicios[index] = updatedServicio;
                }
              });
              state.loading = false;
            });
          } else {
            set((state) => {
              state.error = response.message || 'Error in bulk update';
              state.loading = false;
            });
          }
          
          return response;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error in bulk update servicios';
            state.loading = false;
          });
          throw error;
        }
      },

      bulkDeleteServicios: async (servicioIds: string[]): Promise<ServicioBulkResponse> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await servicioService.bulkDeleteServicios(servicioIds);
          
          if (response.success) {
            set((state) => {
              // Remove deleted servicios from the list
              state.servicios = state.servicios.filter(servicio => !servicioIds.includes(servicio.id));
              state.pagination.total -= response.deleted_count || 0;
              
              // Clear current servicio if it was deleted
              if (state.currentServicio && servicioIds.includes(state.currentServicio.id)) {
                state.currentServicio = null;
              }
              
              state.loading = false;
            });
          } else {
            set((state) => {
              state.error = response.message || 'Error in bulk delete';
              state.loading = false;
            });
          }
          
          return response;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error in bulk delete servicios';
            state.loading = false;
          });
          throw error;
        }
      },

      duplicateServicios: async (data: ServicioDuplicateFormData): Promise<ServicioBulkResponse> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await servicioService.duplicateServicios(data);
          
          if (response.success && response.services) {
            set((state) => {
              // Add duplicated servicios to the list
              state.servicios.unshift(...response.services!);
              state.pagination.total += response.created_count || 0;
              state.loading = false;
            });
          } else {
            set((state) => {
              state.error = response.message || 'Error duplicating servicios';
              state.loading = false;
            });
          }
          
          return response;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error duplicating servicios';
            state.loading = false;
          });
          throw error;
        }
      },

      // ====================================
      // IMPORT/EXPORT OPERATIONS
      // ====================================

      importServicios: async (config: ServicioImportConfig): Promise<ServicioImportResponse> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await servicioService.importServicios(config);
          
          if (response.success && response.services && !config.validate_only) {
            set((state) => {
              // Add imported servicios to the list
              state.servicios.unshift(...response.services!);
              state.pagination.total += response.imported_count || 0;
              state.loading = false;
            });
          } else {
            set((state) => {
              state.loading = false;
            });
          }
          
          return response;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error importing servicios';
            state.loading = false;
          });
          throw error;
        }
      },

      validateImport: async (config: ServicioImportConfig): Promise<ServicioImportResponse> => {
        return get().importServicios({ ...config, validate_only: true });
      },

      exportServicios: async (format: 'csv' | 'excel', filters?: ServicioFilters): Promise<Blob> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const blob = await servicioService.exportServicios(format, filters);
          
          set((state) => {
            state.loading = false;
          });
          
          return blob;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error exporting servicios';
            state.loading = false;
          });
          throw error;
        }
      },

      // ====================================
      // UTILITY METHODS
      // ====================================

      setFilters: (filters: Partial<ServicioFilters>) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    {
      name: 'servicio-store',
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination,
      }),
    }
  )
);

// ====================================
// SELECTOR HOOKS
// ====================================

/**
 * Hook to get servicios with optional filtering
 */
export const useServiciosSelector = (filter?: (servicio: ServicioListItem) => boolean) => {
  return useServicioStore((state) => {
    if (filter) {
      return state.servicios.filter(filter);
    }
    return state.servicios;
  });
};

/**
 * Hook to get servicios by status
 */
export const useServiciosByStatus = (status: string) => {
  return useServicioStore((state) => 
    state.servicios.filter(servicio => servicio.status === status)
  );
};

/**
 * Hook to get servicios by category
 */
export const useServiciosByCategory = (category: string) => {
  return useServicioStore((state) => 
    state.servicios.filter(servicio => servicio.service_category === category)
  );
};

/**
 * Hook to get servicios by sede
 */
export const useServiciosBySede = (sedeId: string) => {
  return useServicioStore((state) => 
    state.servicios.filter(servicio => servicio.sede_reps_code === sedeId)
  );
};

/**
 * Hook to get servicio statistics
 */
export const useServicioStatistics = () => {
  return useServicioStore((state) => state.statistics);
};

/**
 * Hook to check if store is loading
 */
export const useServicioLoading = () => {
  return useServicioStore((state) => state.loading);
};

/**
 * Hook to get store error
 */
export const useServicioError = () => {
  return useServicioStore((state) => state.error);
};

/**
 * Hook to get current servicio
 */
export const useCurrentServicio = () => {
  return useServicioStore((state) => state.currentServicio);
};

/**
 * Hook to get pagination info
 */
export const useServicioPagination = () => {
  return useServicioStore((state) => state.pagination);
};

/**
 * Hook to get service catalog
 */
export const useServiceCatalog = () => {
  return useServicioStore((state) => state.serviceCatalog);
};

export default useServicioStore;