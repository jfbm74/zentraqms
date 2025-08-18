/**
 * Zustand Store for Sede Prestadora Management
 * 
 * This store manages the state for sede (health service provider facilities)
 * operations including CRUD, import/export, and filtering.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { sedeService } from '@/services/sedeService';
import type {
  SedeStore,
  SedePrestadora,
  SedeListItem,
  SedeFormData,
  SedeFilters,
  SedeImportConfig,
  SedeImportResponse,
  SedeBulkResponse,
} from '@/types/sede.types';

// ====================================
// INITIAL STATE
// ====================================

const initialState = {
  sedes: [] as SedeListItem[],
  currentSede: null as SedePrestadora | null,
  loading: false,
  error: null as string | null,
  filters: {} as SedeFilters,
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

export const useSedeStore = create<SedeStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      ...initialState,

      // ====================================
      // CORE CRUD OPERATIONS
      // ====================================

      fetchSedes: async (organizationId: string, filters: SedeFilters = {}) => {
        set((state) => {
          state.loading = true;
          state.error = null;
          state.filters = { ...state.filters, ...filters };
        });

        try {
          const response = await sedeService.getSedes(organizationId, filters);
          
          set((state) => {
            state.sedes = response.results;
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
            state.error = error instanceof Error ? error.message : 'Error fetching sedes';
            state.loading = false;
          });
          throw error;
        }
      },

      fetchSedeDetail: async (sedeId: string): Promise<SedePrestadora> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const sede = await sedeService.getSedeById(sedeId);
          
          set((state) => {
            state.currentSede = sede;
            state.loading = false;
          });
          
          return sede;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error fetching sede detail';
            state.loading = false;
          });
          throw error;
        }
      },

      createSede: async (organizationId: string, data: SedeFormData): Promise<SedePrestadora> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const newSede = await sedeService.createSede(organizationId, data);
          
          set((state) => {
            // Add to the list if it matches current filters
            const sedeListItem: SedeListItem = {
              id: newSede.id,
              numero_sede: newSede.numero_sede,
              nombre_sede: newSede.nombre_sede,
              tipo_sede: newSede.tipo_sede,
              es_sede_principal: newSede.es_sede_principal,
              direccion_completa: newSede.direccion_completa,
              departamento: newSede.departamento,
              municipio: newSede.municipio,
              telefono_principal: newSede.telefono_principal,
              email: newSede.email,
              estado: newSede.estado,
              total_servicios: newSede.total_servicios,
              atencion_24_horas: newSede.atencion_24_horas,
              organization_name: newSede.organization_name,
              created_at: newSede.created_at,
            };
            
            state.sedes.unshift(sedeListItem);
            state.pagination.total += 1;
            state.currentSede = newSede;
            state.loading = false;
          });
          
          return newSede;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error creating sede';
            state.loading = false;
          });
          throw error;
        }
      },

      updateSede: async (sedeId: string, data: Partial<SedeFormData>): Promise<SedePrestadora> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // We need organizationId for the API call
          // For now, we'll extract it from current sede or first sede in the list
          const organizationId = get().currentSede?.health_organization || 
                                get().sedes[0]?.id; // This is a simplification
          
          if (!organizationId) {
            throw new Error('Organization ID not found');
          }

          const updatedSede = await sedeService.updateSede(sedeId, data);
          
          set((state) => {
            // Update in the list
            const index = state.sedes.findIndex(sede => sede.id === sedeId);
            if (index !== -1) {
              const updatedListItem: SedeListItem = {
                id: updatedSede.id,
                numero_sede: updatedSede.numero_sede,
                nombre_sede: updatedSede.nombre_sede,
                tipo_sede: updatedSede.tipo_sede,
                es_sede_principal: updatedSede.es_sede_principal,
                direccion_completa: updatedSede.direccion_completa,
                departamento: updatedSede.departamento,
                municipio: updatedSede.municipio,
                telefono_principal: updatedSede.telefono_principal,
                email: updatedSede.email,
                estado: updatedSede.estado,
                total_servicios: updatedSede.total_servicios,
                atencion_24_horas: updatedSede.atencion_24_horas,
                organization_name: updatedSede.organization_name,
                created_at: updatedSede.created_at,
              };
              
              state.sedes[index] = updatedListItem;
            }
            
            // Update current sede if it's the same
            if (state.currentSede?.id === sedeId) {
              state.currentSede = updatedSede;
            }
            
            state.loading = false;
          });
          
          return updatedSede;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error updating sede';
            state.loading = false;
          });
          throw error;
        }
      },

      deleteSede: async (sedeId: string): Promise<void> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // We need organizationId for the API call
          const organizationId = get().currentSede?.health_organization || 
                                get().sedes[0]?.id; // This is a simplification
          
          if (!organizationId) {
            throw new Error('Organization ID not found');
          }

          await sedeService.deleteSede(sedeId);
          
          set((state) => {
            // Remove from the list
            state.sedes = state.sedes.filter(sede => sede.id !== sedeId);
            state.pagination.total -= 1;
            
            // Clear current sede if it's the same
            if (state.currentSede?.id === sedeId) {
              state.currentSede = null;
            }
            
            state.loading = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error deleting sede';
            state.loading = false;
          });
          throw error;
        }
      },

      // ====================================
      // BULK OPERATIONS
      // ====================================

      bulkCreateSedes: async (organizationId: string, sedes: SedeFormData[]): Promise<SedeBulkResponse> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await sedeService.bulkCreateSedes(sedes);
          
          if (response.success && response.sedes) {
            set((state) => {
              // Add new sedes to the beginning of the list
              state.sedes.unshift(...response.sedes!);
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
            state.error = error instanceof Error ? error.message : 'Error in bulk create sedes';
            state.loading = false;
          });
          throw error;
        }
      },

      bulkUpdateSedes: async (updates: Array<Partial<SedePrestadora> & { id: string }>): Promise<SedeBulkResponse> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const organizationId = get().currentSede?.health_organization || 
                                get().sedes[0]?.id; // This is a simplification
          
          if (!organizationId) {
            throw new Error('Organization ID not found');
          }

          const response = await sedeService.bulkUpdateSedes(updates);
          
          if (response.success && response.sedes) {
            set((state) => {
              // Update sedes in the list
              response.sedes!.forEach(updatedSede => {
                const index = state.sedes.findIndex(sede => sede.id === updatedSede.id);
                if (index !== -1) {
                  state.sedes[index] = updatedSede;
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
            state.error = error instanceof Error ? error.message : 'Error in bulk update sedes';
            state.loading = false;
          });
          throw error;
        }
      },

      bulkDeleteSedes: async (sedeIds: string[]): Promise<SedeBulkResponse> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const organizationId = get().currentSede?.health_organization || 
                                get().sedes[0]?.id; // This is a simplification
          
          if (!organizationId) {
            throw new Error('Organization ID not found');
          }

          const response = await sedeService.bulkDeleteSedes(sedeIds);
          
          if (response.success) {
            set((state) => {
              // Remove deleted sedes from the list
              state.sedes = state.sedes.filter(sede => !sedeIds.includes(sede.id));
              state.pagination.total -= response.deleted_count || 0;
              
              // Clear current sede if it was deleted
              if (state.currentSede && sedeIds.includes(state.currentSede.id)) {
                state.currentSede = null;
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
            state.error = error instanceof Error ? error.message : 'Error in bulk delete sedes';
            state.loading = false;
          });
          throw error;
        }
      },

      // ====================================
      // IMPORT/EXPORT OPERATIONS
      // ====================================

      importSedes: async (organizationId: string, config: SedeImportConfig): Promise<SedeImportResponse> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await sedeService.importSedes(organizationId, config);
          
          if (response.success && response.sedes && !config.validate_only) {
            set((state) => {
              // Add imported sedes to the list
              state.sedes.unshift(...response.sedes!);
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
            state.error = error instanceof Error ? error.message : 'Error importing sedes';
            state.loading = false;
          });
          throw error;
        }
      },

      validateImport: async (organizationId: string, config: SedeImportConfig): Promise<SedeImportResponse> => {
        return get().importSedes(organizationId, { ...config, validate_only: true });
      },

      exportSedes: async (organizationId: string, format: 'csv' | 'excel', includeServices?: boolean): Promise<Blob> => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const blob = await sedeService.exportSedes(organizationId, format, includeServices);
          
          set((state) => {
            state.loading = false;
          });
          
          return blob;
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Error exporting sedes';
            state.loading = false;
          });
          throw error;
        }
      },

      // ====================================
      // UTILITY METHODS
      // ====================================

      setFilters: (filters: Partial<SedeFilters>) => {
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
      name: 'sede-store',
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
 * Hook to get sedes with optional filtering
 */
export const useSedesSelector = (filter?: (sede: SedeListItem) => boolean) => {
  return useSedeStore((state) => {
    if (filter) {
      return state.sedes.filter(filter);
    }
    return state.sedes;
  });
};

/**
 * Hook to get sedes by estado
 */
export const useSedesByEstado = (estado: string) => {
  return useSedeStore((state) => 
    state.sedes.filter(sede => sede.estado === estado)
  );
};

/**
 * Hook to get sede statistics
 */
export const useSedeStatistics = () => {
  return useSedeStore((state) => {
    const sedes = state.sedes;
    
    const statistics = {
      total_sedes: sedes.length,
      sedes_activas: sedes.filter(s => s.estado === 'activa').length,
      sedes_principales: sedes.filter(s => s.es_sede_principal).length,
      total_servicios: sedes.reduce((sum, s) => sum + s.total_servicios, 0),
      sedes_por_estado: {} as Record<string, number>,
      sedes_por_tipo: {} as Record<string, number>,
      sedes_por_departamento: {} as Record<string, number>,
    };
    
    // Group by estado
    sedes.forEach(sede => {
      statistics.sedes_por_estado[sede.estado] = 
        (statistics.sedes_por_estado[sede.estado] || 0) + 1;
    });
    
    // Group by tipo
    sedes.forEach(sede => {
      statistics.sedes_por_tipo[sede.tipo_sede] = 
        (statistics.sedes_por_tipo[sede.tipo_sede] || 0) + 1;
    });
    
    // Group by departamento
    sedes.forEach(sede => {
      statistics.sedes_por_departamento[sede.departamento] = 
        (statistics.sedes_por_departamento[sede.departamento] || 0) + 1;
    });
    
    return statistics;
  });
};

/**
 * Hook to check if store is loading
 */
export const useSedeLoading = () => {
  return useSedeStore((state) => state.loading);
};

/**
 * Hook to get store error
 */
export const useSedeError = () => {
  return useSedeStore((state) => state.error);
};

/**
 * Hook to get current sede
 */
export const useCurrentSede = () => {
  return useSedeStore((state) => state.currentSede);
};

/**
 * Hook to get pagination info
 */
export const useSedePagination = () => {
  return useSedeStore((state) => state.pagination);
};

export default useSedeStore;