/**
 * Custom hook for managing service CRUD actions
 */

import { useCallback } from 'react';
import { useServicioStore } from '../../../../../stores/servicioStore';
import type { ServicioFormData, ServicioDuplicateFormData } from '../../../../../types/servicios';

export const useServicioActions = () => {
  const {
    createServicio,
    updateServicio,
    deleteServicio,
    bulkDeleteServicios,
    duplicateServicios,
    importServicios,
    exportServicios,
    loading,
    error,
  } = useServicioStore();

  const handleCreate = useCallback(async (data: ServicioFormData) => {
    try {
      const result = await createServicio(data);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error creating service' 
      };
    }
  }, [createServicio]);

  const handleUpdate = useCallback(async (id: string, data: Partial<ServicioFormData>) => {
    try {
      const result = await updateServicio(id, data);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error updating service' 
      };
    }
  }, [updateServicio]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteServicio(id);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error deleting service' 
      };
    }
  }, [deleteServicio]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const result = await bulkDeleteServicios(ids);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error deleting services' 
      };
    }
  }, [bulkDeleteServicios]);

  const handleDuplicate = useCallback(async (data: ServicioDuplicateFormData) => {
    try {
      const result = await duplicateServicios(data);
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error duplicating services' 
      };
    }
  }, [duplicateServicios]);

  const handleExport = useCallback(async (format: 'csv' | 'excel', filters?: any) => {
    try {
      const blob = await exportServicios(format, filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `servicios.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error exporting services' 
      };
    }
  }, [exportServicios]);

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    handleBulkDelete,
    handleDuplicate,
    handleExport,
    loading,
    error,
  };
};