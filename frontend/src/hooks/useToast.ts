/**
 * Custom hook for toast notifications with deduplication
 * 
 * Prevents duplicate toast notifications, especially useful when
 * React Strict Mode causes double execution in development.
 */

import { useRef, useCallback } from 'react';
import { toast, ToastOptions } from 'react-toastify';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastRef {
  message: string;
  type: ToastType;
  timestamp: number;
}

export const useToast = (deduplicationWindow: number = 3000) => {
  const lastToastRef = useRef<ToastRef | null>(null);

  const showToast = useCallback((
    type: ToastType, 
    message: string, 
    options?: ToastOptions
  ) => {
    const now = Date.now();
    const lastToast = lastToastRef.current;
    
    // Prevent duplicate toasts within the deduplication window
    if (
      lastToast && 
      lastToast.message === message && 
      lastToast.type === type &&
      now - lastToast.timestamp < deduplicationWindow
    ) {
      console.log(`[useToast] Prevented duplicate ${type} toast: "${message}"`);
      return;
    }
    
    // Update last toast reference
    lastToastRef.current = { message, type, timestamp: now };
    
    console.log(`[useToast] Showing ${type} toast: "${message}"`);
    
    // Show the toast
    toast[type](message, options);
  }, [deduplicationWindow]);

  const showSuccess = useCallback((message: string, options?: ToastOptions) => {
    showToast('success', message, options);
  }, [showToast]);

  const showError = useCallback((message: string, options?: ToastOptions) => {
    showToast('error', message, options);
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: ToastOptions) => {
    showToast('info', message, options);
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: ToastOptions) => {
    showToast('warning', message, options);
  }, [showToast]);

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
};

export default useToast;