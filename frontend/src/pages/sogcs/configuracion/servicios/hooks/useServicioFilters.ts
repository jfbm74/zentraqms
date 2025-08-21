/**
 * Custom hook for managing service filters
 */

import { useState, useCallback } from 'react';
import type { ServicioFilters } from '../../../../../types/servicios';

export const useServicioFilters = (initialFilters: ServicioFilters = {}) => {
  const [filters, setFilters] = useState<ServicioFilters>(initialFilters);

  const updateFilter = useCallback((key: keyof ServicioFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<ServicioFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    resetFilters,
  };
};