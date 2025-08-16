/**
 * Validation utilities for the simplified organization wizard.
 * Provides client-side validation for Colombian business requirements.
 */

import { FORM_FIELD_LIMITS, LOGO_CONSTRAINTS } from '../types/wizard.types';

// Regular expressions for validation
const REGEX_PATTERNS = {
  NIT: /^\d{9,10}$/,
  VERIFICATION_DIGIT: /^\d$/,
  COLOMBIAN_PHONE: /^(\+?57)?\s?([3][0-9]{9}|[1-8][0-9]{6,7})$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  ORGANIZATION_NAME: /^[a-zA-ZÀ-ÿ0-9\s\.\-\_\&\(\)]+$/,
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Field Validators
 */
export class FormValidators {
  /**
   * Validate organization name (razón social)
   */
  static validateOrganizationName(value: string): ValidationResult {
    if (!value?.trim()) {
      return {
        isValid: false,
        error: 'El nombre de la organización es requerido',
      };
    }

    const trimmed = value.trim();

    if (trimmed.length < FORM_FIELD_LIMITS.RAZON_SOCIAL.min) {
      return {
        isValid: false,
        error: `El nombre debe tener al menos ${FORM_FIELD_LIMITS.RAZON_SOCIAL.min} caracteres`,
      };
    }

    if (trimmed.length > FORM_FIELD_LIMITS.RAZON_SOCIAL.max) {
      return {
        isValid: false,
        error: `El nombre no puede exceder ${FORM_FIELD_LIMITS.RAZON_SOCIAL.max} caracteres`,
      };
    }

    if (!REGEX_PATTERNS.ORGANIZATION_NAME.test(trimmed)) {
      return {
        isValid: false,
        error: 'El nombre contiene caracteres no válidos',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate Colombian NIT format
   */
  static validateNIT(value: string): ValidationResult {
    if (!value?.trim()) {
      return {
        isValid: false,
        error: 'El NIT es requerido',
      };
    }

    const cleanNIT = value.replace(/[^\d]/g, '');

    if (!REGEX_PATTERNS.NIT.test(cleanNIT)) {
      return {
        isValid: false,
        error: 'El NIT debe tener entre 9 y 10 dígitos',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate verification digit
   */
  static validateVerificationDigit(value: string): ValidationResult {
    if (!value?.trim()) {
      return {
        isValid: false,
        error: 'El dígito de verificación es requerido',
      };
    }

    if (!REGEX_PATTERNS.VERIFICATION_DIGIT.test(value)) {
      return {
        isValid: false,
        error: 'Debe ser un dígito del 0 al 9',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate email format
   */
  static validateEmail(value: string): ValidationResult {
    if (!value?.trim()) {
      return {
        isValid: false,
        error: 'El email es requerido',
      };
    }

    const trimmed = value.trim();

    if (trimmed.length > FORM_FIELD_LIMITS.EMAIL.max) {
      return {
        isValid: false,
        error: `El email no puede exceder ${FORM_FIELD_LIMITS.EMAIL.max} caracteres`,
      };
    }

    // More permissive email validation
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      return {
        isValid: false,
        error: 'Formato de email inválido',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return {
        isValid: false,
        error: 'Formato de email inválido',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate Colombian phone number
   */
  static validatePhone(value: string): ValidationResult {
    if (!value?.trim()) {
      return {
        isValid: false,
        error: 'El teléfono es requerido',
      };
    }

    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    
    // More flexible phone validation - just check for reasonable length and digits
    const phoneDigits = cleanPhone.replace(/\+/g, '');
    
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return {
        isValid: false,
        error: 'El teléfono debe tener entre 7 y 15 dígitos',
      };
    }

    if (!/^\+?[\d\s\-\(\)]+$/.test(value)) {
      return {
        isValid: false,
        error: 'El teléfono contiene caracteres inválidos',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate website URL (optional field)
   */
  static validateWebsite(value: string): ValidationResult {
    if (!value?.trim()) {
      return { isValid: true }; // Optional field
    }

    const trimmed = value.trim();

    if (trimmed.length > FORM_FIELD_LIMITS.WEBSITE.max) {
      return {
        isValid: false,
        error: `La URL no puede exceder ${FORM_FIELD_LIMITS.WEBSITE.max} caracteres`,
      };
    }

    if (!REGEX_PATTERNS.URL.test(trimmed)) {
      return {
        isValid: false,
        error: 'Formato de URL inválido. Debe comenzar con http:// o https://',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate description (optional field)
   */
  static validateDescription(value: string): ValidationResult {
    if (!value?.trim()) {
      return { isValid: true }; // Optional field
    }

    const trimmed = value.trim();

    if (trimmed.length > FORM_FIELD_LIMITS.DESCRIPCION.max) {
      return {
        isValid: false,
        error: `La descripción no puede exceder ${FORM_FIELD_LIMITS.DESCRIPCION.max} caracteres`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate logo file
   */
  static validateLogo(file: File): ValidationResult {
    // Check file size
    const maxSizeBytes = LOGO_CONSTRAINTS.MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `La imagen no debe exceder ${LOGO_CONSTRAINTS.MAX_SIZE_MB}MB`,
      };
    }

    // Check file type
    if (!LOGO_CONSTRAINTS.ACCEPTED_FORMATS.includes(file.type)) {
      return {
        isValid: false,
        error: 'Formato de archivo no soportado. Use JPEG, PNG, SVG o WebP',
      };
    }

    return { isValid: true };
  }

  /**
   * Validate image dimensions (async)
   */
  static async validateImageDimensions(file: File): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const { width, height } = img;
        const { MIN_DIMENSIONS, MAX_DIMENSIONS } = LOGO_CONSTRAINTS;

        if (width < MIN_DIMENSIONS.width || height < MIN_DIMENSIONS.height) {
          resolve({
            isValid: false,
            error: `La imagen debe ser de al menos ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height} píxeles`,
          });
          return;
        }

        if (width > MAX_DIMENSIONS.width || height > MAX_DIMENSIONS.height) {
          resolve({
            isValid: false,
            error: `La imagen no debe exceder ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height} píxeles`,
          });
          return;
        }

        resolve({ isValid: true });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          isValid: false,
          error: 'Error al procesar la imagen',
        });
      };

      img.src = url;
    });
  }
}

/**
 * Debounced validation helper
 */
export class DebouncedValidator {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Validate field with debouncing
   */
  validate(
    field: string,
    value: string,
    validator: (value: string) => ValidationResult,
    delay: number = 400
  ): Promise<ValidationResult> {
    return new Promise((resolve) => {
      // Clear existing timer
      const existingTimer = this.timers.get(field);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        const result = validator(value);
        resolve(result);
        this.timers.delete(field);
      }, delay);

      this.timers.set(field, timer);
    });
  }

  /**
   * Clear all timers
   */
  clearAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }

  /**
   * Clear timer for specific field
   */
  clearField(field: string): void {
    const timer = this.timers.get(field);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(field);
    }
  }
}

/**
 * Form-level validation
 */
export class FormValidator {
  /**
   * Validate all required fields
   */
  static validateForm(data: {
    razon_social: string;
    nit: string;
    digito_verificacion: string;
    email_contacto: string;
    telefono_principal: string;
    website?: string;
    descripcion?: string;
  }): Record<string, string> {
    const errors: Record<string, string> = {};

    // Validate required fields
    const nameResult = FormValidators.validateOrganizationName(data.razon_social);
    if (!nameResult.isValid) {
      errors.razon_social = nameResult.error!;
    }

    const nitResult = FormValidators.validateNIT(data.nit);
    if (!nitResult.isValid) {
      errors.nit = nitResult.error!;
    }

    const digitResult = FormValidators.validateVerificationDigit(data.digito_verificacion);
    if (!digitResult.isValid) {
      errors.digito_verificacion = digitResult.error!;
    }

    const emailResult = FormValidators.validateEmail(data.email_contacto);
    if (!emailResult.isValid) {
      errors.email_contacto = emailResult.error!;
    }

    const phoneResult = FormValidators.validatePhone(data.telefono_principal);
    if (!phoneResult.isValid) {
      errors.telefono_principal = phoneResult.error!;
    }

    // Validate optional fields if provided
    if (data.website) {
      const websiteResult = FormValidators.validateWebsite(data.website);
      if (!websiteResult.isValid) {
        errors.website = websiteResult.error!;
      }
    }

    if (data.descripcion) {
      const descResult = FormValidators.validateDescription(data.descripcion);
      if (!descResult.isValid) {
        errors.descripcion = descResult.error!;
      }
    }

    return errors;
  }

  /**
   * Check if form has any errors
   */
  static hasErrors(errors: Record<string, string>): boolean {
    return Object.values(errors).some((error) => error.trim().length > 0);
  }

  /**
   * Get first error message
   */
  static getFirstError(errors: Record<string, string>): string | null {
    const errorEntries = Object.entries(errors);
    const firstError = errorEntries.find(([_, error]) => error.trim().length > 0);
    return firstError ? firstError[1] : null;
  }
}

/**
 * Utility functions
 */
export const ValidationUtils = {
  /**
   * Clean NIT by removing non-digit characters
   */
  cleanNIT: (nit: string): string => nit.replace(/[^\d]/g, ''),

  /**
   * Format phone number for display
   */
  formatPhone: (phone: string): string => {
    const clean = phone.replace(/[^\d+]/g, '');
    if (clean.startsWith('+57')) {
      const number = clean.substring(3);
      if (number.length === 10) {
        return `+57 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
      }
    }
    return phone;
  },

  /**
   * Check if URL needs protocol
   */
  addProtocolToURL: (url: string): string => {
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  },

  /**
   * Truncate text with ellipsis
   */
  truncateText: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  /**
   * Generate file size display string
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};