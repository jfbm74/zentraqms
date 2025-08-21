/**
 * Validation utilities for servicios
 */

import type { ServicioFormData, FieldValidation } from '../../../../../types/servicios';

export const validateServicioField = (
  field: keyof ServicioFormData,
  value: any,
  formData: ServicioFormData
): FieldValidation => {
  switch (field) {
    case 'sede':
      if (!value || !value.trim()) {
        return { isValid: false, message: 'La sede es obligatoria' };
      }
      return { isValid: true };

    case 'service_catalog':
      if (!value || !value.trim()) {
        return { isValid: false, message: 'El servicio del catálogo es obligatorio' };
      }
      return { isValid: true };

    case 'modality':
      if (!value) {
        return { isValid: false, message: 'La modalidad es obligatoria' };
      }
      return { isValid: true };

    case 'capacity':
      if (!value || value < 1) {
        return { isValid: false, message: 'La capacidad debe ser mayor a 0' };
      }
      return { isValid: true };

    case 'status':
      if (!value) {
        return { isValid: false, message: 'El estado es obligatorio' };
      }
      return { isValid: true };

    case 'authorization_date':
      if (value && formData.expiration_date) {
        const authDate = new Date(value);
        const expDate = new Date(formData.expiration_date);
        if (authDate >= expDate) {
          return { 
            isValid: false, 
            message: 'La fecha de autorización debe ser anterior a la fecha de vencimiento' 
          };
        }
      }
      return { isValid: true };

    case 'expiration_date':
      if (value && formData.authorization_date) {
        const authDate = new Date(formData.authorization_date);
        const expDate = new Date(value);
        if (expDate <= authDate) {
          return { 
            isValid: false, 
            message: 'La fecha de vencimiento debe ser posterior a la fecha de autorización' 
          };
        }
      }
      return { isValid: true };

    case 'medical_staff_count':
    case 'nursing_staff_count':
    case 'technical_staff_count':
      if (value && value < 0) {
        return { isValid: false, message: 'El número de personal no puede ser negativo' };
      }
      return { isValid: true };

    default:
      return { isValid: true };
  }
};

export const validateServicioForm = (formData: ServicioFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Validate required fields
  const requiredFields: (keyof ServicioFormData)[] = [
    'sede',
    'service_catalog',
    'modality',
    'capacity',
    'status'
  ];

  requiredFields.forEach(field => {
    const validation = validateServicioField(field, formData[field], formData);
    if (!validation.isValid && validation.message) {
      errors[field] = validation.message;
    }
  });

  // Additional cross-field validations
  if (formData.authorization_date && formData.expiration_date) {
    const authDate = new Date(formData.authorization_date);
    const expDate = new Date(formData.expiration_date);
    if (authDate >= expDate) {
      errors.expiration_date = 'La fecha de vencimiento debe ser posterior a la fecha de autorización';
    }
  }

  return errors;
};

export const validateImportFile = (file: File): { isValid: boolean; message?: string } => {
  // Check file type
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      message: 'Por favor seleccione un archivo Excel (.xlsx, .xls) o CSV (.csv)'
    };
  }

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      message: 'El archivo no puede ser mayor a 10MB'
    };
  }

  return { isValid: true };
};