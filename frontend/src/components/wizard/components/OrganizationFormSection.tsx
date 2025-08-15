/**
 * Organization Form Section Component
 * 
 * Handles the main form fields for organization data input with Colombian compliance.
 */

import React, { useCallback, useMemo } from 'react';
import { OrganizationFormData, FormValidationState } from '../../../types/wizard.types';
import { ValidationUtils } from '../../../utils/validation';

interface OrganizationFormSectionProps {
  formData: OrganizationFormData;
  validation: FormValidationState;
  onChange: (field: string, value: string) => void;
  onNitValidation?: (nit: string) => Promise<void>;
  submitAttempted: boolean;
}

const OrganizationFormSection: React.FC<OrganizationFormSectionProps> = ({
  formData,
  validation,
  onChange,
  onNitValidation,
  submitAttempted
}) => {
  
  /**
   * Handle field change with formatting
   */
  const handleFieldChange = useCallback((field: string, value: string) => {
    let processedValue = value;
    
    // Apply field-specific formatting
    switch (field) {
      case 'nit':
        // Only allow digits for NIT
        processedValue = value.replace(/\D/g, '');
        break;
      case 'digito_verificacion':
        // Only allow single digit
        processedValue = value.replace(/\D/g, '').slice(0, 1);
        break;
      case 'telefono_principal':
        // Format phone number for display
        processedValue = value.replace(/[^\d+\s\-()]/g, '');
        break;
      case 'website':
        // Add protocol if missing
        if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
          processedValue = value;
        }
        break;
    }
    
    onChange(field, processedValue);
  }, [onChange]);
  
  /**
   * Handle NIT field blur for validation
   */
  const handleNitBlur = useCallback(() => {
    if (formData.nit && formData.nit.length >= 9 && onNitValidation) {
      onNitValidation(formData.nit);
    }
  }, [formData.nit, onNitValidation]);
  
  /**
   * Get field validation class
   */
  const getFieldClass = useCallback((field: string): string => {
    const hasError = validation.errors[field];
    const hasWarning = validation.warnings[field];
    
    if (hasError) return 'is-invalid';
    if (hasWarning) return 'is-warning';
    if (submitAttempted && formData[field as keyof OrganizationFormData]) return 'is-valid';
    
    return '';
  }, [validation.errors, validation.warnings, submitAttempted, formData]);
  
  /**
   * Format NIT display
   */
  const formattedNit = useMemo(() => {
    if (!formData.nit) return '';
    
    // Add formatting for display (but keep raw value in state)
    const digits = formData.nit.replace(/\D/g, '');
    if (digits.length > 3) {
      return `${digits.slice(0, -3)}.${digits.slice(-3)}`;
    }
    return digits;
  }, [formData.nit]);
  
  /**
   * Get NIT availability indicator
   */
  const getNitAvailabilityIndicator = () => {
    if (validation.isValidating) {
      return (
        <div className="input-group-text">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Validando...</span>
          </div>
        </div>
      );
    }
    
    if (validation.nitAvailable === true) {
      return (
        <div className="input-group-text text-success">
          <i className="ri-check-line"></i>
        </div>
      );
    }
    
    if (validation.nitAvailable === false) {
      return (
        <div className="input-group-text text-danger">
          <i className="ri-close-line"></i>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="organization-form-section">
      <div className="row">
        <div className="col-12">
          <h5 className="mb-4">
            <i className="ri-building-line me-2 text-primary"></i>
            Información de la Organización
          </h5>
        </div>
      </div>

      {/* Organization Name */}
      <div className="row mb-3">
        <div className="col-12">
          <label htmlFor="razon_social" className="form-label">
            Razón Social <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="razon_social"
            className={`form-control ${getFieldClass('razon_social')}`}
            value={formData.razon_social}
            onChange={(e) => handleFieldChange('razon_social', e.target.value)}
            placeholder="Ingrese la razón social de la organización"
            maxLength={200}
            required
          />
          {validation.errors.razon_social && (
            <div className="invalid-feedback">
              {validation.errors.razon_social}
            </div>
          )}
          <div className="form-text">
            Nombre legal completo de la organización
          </div>
        </div>
      </div>

      {/* NIT and Verification Digit */}
      <div className="row mb-3">
        <div className="col-md-8">
          <label htmlFor="nit" className="form-label">
            NIT <span className="text-danger">*</span>
          </label>
          <div className="input-group">
            <input
              type="text"
              id="nit"
              className={`form-control ${getFieldClass('nit')}`}
              value={formData.nit}
              onChange={(e) => handleFieldChange('nit', e.target.value)}
              onBlur={handleNitBlur}
              placeholder="123456789"
              maxLength={10}
              required
            />
            {getNitAvailabilityIndicator()}
          </div>
          {validation.errors.nit && (
            <div className="invalid-feedback d-block">
              {validation.errors.nit}
            </div>
          )}
          <div className="form-text">
            Número de Identificación Tributaria (9-10 dígitos)
          </div>
        </div>
        
        <div className="col-md-4">
          <label htmlFor="digito_verificacion" className="form-label">
            DV <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="digito_verificacion"
            className={`form-control ${getFieldClass('digito_verificacion')}`}
            value={formData.digito_verificacion}
            onChange={(e) => handleFieldChange('digito_verificacion', e.target.value)}
            placeholder="0"
            maxLength={1}
            required
          />
          {validation.errors.digito_verificacion && (
            <div className="invalid-feedback">
              {validation.errors.digito_verificacion}
            </div>
          )}
          <div className="form-text">
            Dígito de verificación
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="row">
        <div className="col-12">
          <h6 className="mb-3 text-muted">
            <i className="ri-contacts-line me-2"></i>
            Información de Contacto
          </h6>
        </div>
      </div>

      {/* Email */}
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="email_contacto" className="form-label">
            Email de Contacto <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            id="email_contacto"
            className={`form-control ${getFieldClass('email_contacto')}`}
            value={formData.email_contacto}
            onChange={(e) => handleFieldChange('email_contacto', e.target.value)}
            placeholder="contacto@empresa.com"
            maxLength={100}
            required
          />
          {validation.errors.email_contacto && (
            <div className="invalid-feedback">
              {validation.errors.email_contacto}
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="col-md-6">
          <label htmlFor="telefono_principal" className="form-label">
            Teléfono Principal <span className="text-danger">*</span>
          </label>
          <input
            type="tel"
            id="telefono_principal"
            className={`form-control ${getFieldClass('telefono_principal')}`}
            value={formData.telefono_principal}
            onChange={(e) => handleFieldChange('telefono_principal', e.target.value)}
            placeholder="+57 301 234 5678"
            maxLength={15}
            required
          />
          {validation.errors.telefono_principal && (
            <div className="invalid-feedback">
              {validation.errors.telefono_principal}
            </div>
          )}
          <div className="form-text">
            Formato: +57 301 234 5678
          </div>
        </div>
      </div>

      {/* Website (Optional) */}
      <div className="row mb-3">
        <div className="col-12">
          <label htmlFor="website" className="form-label">
            Sitio Web <span className="text-muted">(Opcional)</span>
          </label>
          <input
            type="url"
            id="website"
            className={`form-control ${getFieldClass('website')}`}
            value={formData.website}
            onChange={(e) => handleFieldChange('website', e.target.value)}
            placeholder="https://www.empresa.com"
            maxLength={200}
          />
          {validation.errors.website && (
            <div className="invalid-feedback">
              {validation.errors.website}
            </div>
          )}
        </div>
      </div>

      {/* Description (Optional) */}
      <div className="row mb-3">
        <div className="col-12">
          <label htmlFor="descripcion" className="form-label">
            Descripción <span className="text-muted">(Opcional)</span>
          </label>
          <textarea
            id="descripcion"
            className={`form-control ${getFieldClass('descripcion')}`}
            value={formData.descripcion}
            onChange={(e) => handleFieldChange('descripcion', e.target.value)}
            placeholder="Breve descripción de la organización y sus actividades principales"
            rows={3}
            maxLength={1000}
          />
          {validation.errors.descripcion && (
            <div className="invalid-feedback">
              {validation.errors.descripcion}
            </div>
          )}
          <div className="form-text">
            {formData.descripcion.length}/1000 caracteres
          </div>
        </div>
      </div>

      {/* NIT Display Preview */}
      {formData.nit && formData.digito_verificacion && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="alert alert-info d-flex align-items-center">
              <i className="ri-information-line me-2"></i>
              <div>
                <strong>NIT Completo:</strong> {formData.nit}-{formData.digito_verificacion}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationFormSection;