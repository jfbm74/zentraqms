/**
 * Hook for REPS (Colombian Health Registry) validation
 * 
 * Provides functionality to validate provider codes against Colombian REPS
 */
import { useState, useCallback } from 'react';
import { apiClient } from '../api/endpoints';

interface RepsValidationResult {
  isValid: boolean;
  message: string;
  providerData?: {
    nombre: string;
    departamento: string;
    municipio: string;
    direccion: string;
  };
  lastValidated?: string;
}

interface UseRepsValidationReturn {
  validateReps: (codigo: string) => Promise<{valid: boolean; data?: any; error?: string}>;
  isLoading: boolean;
  lastResult: RepsValidationResult | null;
  clearResult: () => void;
}

export const useRepsValidation = (): UseRepsValidationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<RepsValidationResult | null>(null);

  const validateReps = useCallback(async (codigo: string) => {
    if (!codigo || codigo.length !== 12 || !/^\d{12}$/.test(codigo)) {
      const result = {
        isValid: false,
        message: 'El código debe tener exactamente 12 dígitos numéricos'
      };
      setLastResult(result);
      return { valid: false, error: result.message };
    }

    setIsLoading(true);
    
    try {
      // Call the SUH validation endpoint (using existing SUH service)
      const response = await apiClient.get('/api/v1/suh/validate-nit/', {
        params: {
          nit: codigo.substring(0, 9), // Extract NIT from REPS code
          dv: codigo.substring(9, 10)  // Extract verification digit
        }
      });

      const result: RepsValidationResult = {
        isValid: response.data.valid || false,
        message: response.data.message || 'Validación completada',
        providerData: response.data.prestador_info ? {
          nombre: response.data.prestador_info.razon_social,
          departamento: '',
          municipio: '',
          direccion: ''
        } : undefined,
        lastValidated: new Date().toISOString()
      };

      setLastResult(result);

      return {
        valid: result.isValid,
        data: result.providerData,
        error: result.isValid ? undefined : result.message
      };

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al conectar con el servicio REPS';
      
      const result: RepsValidationResult = {
        isValid: false,
        message: errorMessage
      };

      setLastResult(result);

      return {
        valid: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    validateReps,
    isLoading,
    lastResult,
    clearResult
  };
};