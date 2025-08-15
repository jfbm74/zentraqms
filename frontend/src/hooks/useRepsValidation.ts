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
      // Call the health validation endpoint
      const response = await apiClient.post('/organization/health/validate-reps/', {
        codigo_prestador: codigo
      });

      const result: RepsValidationResult = {
        isValid: response.data.isValid,
        message: response.data.message,
        providerData: response.data.providerData || undefined,
        lastValidated: response.data.lastValidated
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