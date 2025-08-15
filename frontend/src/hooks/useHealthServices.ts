/**
 * Hook for Health Services management
 * 
 * Provides functionality to load and validate Colombian health services
 */
import { useState, useCallback } from 'react';
import { apiClient } from '../api/endpoints';

interface HealthService {
  codigo: string;
  nombre: string;
  grupo: string;
  grupo_display: string;
  complejidad_minima: string;
  descripcion: string;
}

interface SelectedService {
  codigo_servicio: string;
  nombre_servicio: string;
  grupo_servicio: string;
  fecha_habilitacion?: string;
  fecha_vencimiento?: string;
  modalidad?: string;
  observaciones?: string;
}

interface ComplexityLevel {
  code: string;
  name: string;
  description: string;
  services_allowed: string[];
}

interface ServiceValidationResult {
  validation_results: Array<{
    codigo_servicio: string;
    nombre_servicio: string;
    is_valid: boolean;
    reason: string;
  }>;
  summary: {
    total_services: number;
    valid_services: number;
    invalid_services: number;
    organization_level: string;
    overall_valid: boolean;
  };
}

interface UseHealthServicesReturn {
  // Services catalog
  loadServicesCatalog: (filters?: { grupo?: string; complejidad?: string }) => Promise<HealthService[]>;
  isLoadingCatalog: boolean;
  catalogError: string | null;
  
  // Services validation
  validateServices: (services: SelectedService[], nivelComplejidad: string) => Promise<ServiceValidationResult>;
  isValidating: boolean;
  validationError: string | null;
  
  // Complexity levels
  loadComplexityLevels: () => Promise<ComplexityLevel[]>;
  isLoadingLevels: boolean;
  levelsError: string | null;
  
  // Utils
  clearErrors: () => void;
}

export const useHealthServices = (): UseHealthServicesReturn => {
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [isLoadingLevels, setIsLoadingLevels] = useState(false);
  const [levelsError, setLevelsError] = useState<string | null>(null);

  const loadServicesCatalog = useCallback(async (filters?: { grupo?: string; complejidad?: string }) => {
    setIsLoadingCatalog(true);
    setCatalogError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.grupo) params.append('grupo', filters.grupo);
      if (filters?.complejidad) params.append('complejidad', filters.complejidad);
      
      const queryString = params.toString();
      const url = `/organization/health/services-catalog/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      
      if (response.data && response.data.services) {
        return response.data.services as HealthService[];
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al cargar el catálogo de servicios';
      setCatalogError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  const validateServices = useCallback(async (services: SelectedService[], nivelComplejidad: string) => {
    setIsValidating(true);
    setValidationError(null);
    
    try {
      const payload = {
        services: services.map(service => ({
          codigo_servicio: service.codigo_servicio
        })),
        nivel_complejidad: nivelComplejidad
      };

      const response = await apiClient.post('/organization/health/validate-services/', payload);
      
      if (response.data) {
        return response.data as ServiceValidationResult;
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al validar los servicios';
      setValidationError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  }, []);

  const loadComplexityLevels = useCallback(async () => {
    setIsLoadingLevels(true);
    setLevelsError(null);
    
    try {
      const response = await apiClient.get('/organization/health/complexity-levels/');
      
      if (response.data && response.data.complexity_levels) {
        return response.data.complexity_levels as ComplexityLevel[];
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al cargar los niveles de complejidad';
      setLevelsError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoadingLevels(false);
    }
  }, []);

  const clearErrors = useCallback(() => {
    setCatalogError(null);
    setValidationError(null);
    setLevelsError(null);
  }, []);

  return {
    // Services catalog
    loadServicesCatalog,
    isLoadingCatalog,
    catalogError,
    
    // Services validation
    validateServices,
    isValidating,
    validationError,
    
    // Complexity levels
    loadComplexityLevels,
    isLoadingLevels,
    levelsError,
    
    // Utils
    clearErrors
  };
};