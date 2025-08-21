/**
 * Custom hook for managing import progress tracking
 */

import { useState, useCallback } from 'react';
import type { ImportProgress } from '../../../../../types/servicios';

export const useImportProgress = () => {
  const [progress, setProgress] = useState<ImportProgress>({
    stage: 'uploading',
    progress: 0,
    message: 'Iniciando...',
  });

  const updateProgress = useCallback((newProgress: Partial<ImportProgress>) => {
    setProgress(prev => ({
      ...prev,
      ...newProgress,
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      stage: 'uploading',
      progress: 0,
      message: 'Iniciando...',
    });
  }, []);

  const startValidation = useCallback(() => {
    setProgress({
      stage: 'validating',
      progress: 0,
      message: 'Validando archivo...',
    });
  }, []);

  const startProcessing = useCallback(() => {
    setProgress({
      stage: 'processing',
      progress: 0,
      message: 'Procesando importación...',
    });
  }, []);

  const setCompleted = useCallback((message: string = 'Completado') => {
    setProgress({
      stage: 'completed',
      progress: 100,
      message,
    });
  }, []);

  const setError = useCallback((message: string) => {
    setProgress({
      stage: 'error',
      progress: 0,
      message,
    });
  }, []);

  const incrementProgress = useCallback((amount: number = 10) => {
    setProgress(prev => ({
      ...prev,
      progress: Math.min(prev.progress + amount, 100),
    }));
  }, []);

  return {
    progress,
    updateProgress,
    resetProgress,
    startValidation,
    startProcessing,
    setCompleted,
    setError,
    incrementProgress,
  };
};