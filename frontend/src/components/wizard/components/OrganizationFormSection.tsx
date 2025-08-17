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

      {/* Clasificación Organizacional */}
      <div className="row">
        <div className="col-12">
          <h6 className="mb-3 text-muted">
            <i className="ri-organization-chart me-2"></i>
            Clasificación Organizacional
          </h6>
        </div>
      </div>

      {/* Tipo de Organización */}
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="tipo_organizacion" className="form-label">
            Tipo de Organización
          </label>
          <select
            id="tipo_organizacion"
            className={`form-select ${getFieldClass('tipo_organizacion')}`}
            value={formData.tipo_organizacion || ''}
            onChange={(e) => handleFieldChange('tipo_organizacion', e.target.value)}
          >
            <option value="">Seleccione el tipo de organización</option>
            <option value="empresa_privada">Empresa Privada</option>
            <option value="empresa_publica">Empresa Pública</option>
            <option value="mixta">Mixta</option>
            <option value="fundacion">Fundación</option>
            <option value="ong">ONG</option>
            <option value="cooperativa">Cooperativa</option>
            <option value="ips">IPS</option>
            <option value="eps">EPS</option>
            <option value="hospital">Hospital</option>
            <option value="clinica">Clínica</option>
            <option value="centro_medico">Centro Médico</option>
            <option value="laboratorio">Laboratorio</option>
            <option value="institucion_educativa">Institución Educativa</option>
            <option value="universidad">Universidad</option>
            <option value="otra">Otra</option>
          </select>
          {validation.errors.tipo_organizacion && (
            <div className="invalid-feedback">
              {validation.errors.tipo_organizacion}
            </div>
          )}
          <div className="form-text">
            Tipo de organización según su naturaleza jurídica.
          </div>
        </div>

        {/* Sector Económico */}
        <div className="col-md-6">
          <label htmlFor="sector_economico" className="form-label">
            Sector Económico
          </label>
          <select
            id="sector_economico"
            className={`form-select ${getFieldClass('sector_economico')}`}
            value={formData.sector_economico || ''}
            onChange={(e) => handleFieldChange('sector_economico', e.target.value)}
          >
            <option value="">Seleccione el sector económico</option>
            <option value="salud">Salud</option>
            <option value="educacion">Educación</option>
            <option value="manufactura">Manufactura</option>
            <option value="servicios">Servicios</option>
            <option value="tecnologia">Tecnología</option>
            <option value="financiero">Financiero</option>
            <option value="comercio">Comercio</option>
            <option value="construccion">Construcción</option>
            <option value="transporte">Transporte</option>
            <option value="agropecuario">Agropecuario</option>
            <option value="mineria">Minería</option>
            <option value="energia">Energía</option>
            <option value="telecomunicaciones">Telecomunicaciones</option>
            <option value="turismo">Turismo</option>
            <option value="otro">Otro</option>
          </select>
          {validation.errors.sector_economico && (
            <div className="invalid-feedback">
              {validation.errors.sector_economico}
            </div>
          )}
          <div className="form-text">
            Sector económico principal al que pertenece la organización.
          </div>
        </div>
      </div>

      {/* Tamaño de Empresa */}
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="tamaño_empresa" className="form-label">
            Tamaño de Empresa
          </label>
          <select
            id="tamaño_empresa"
            className={`form-select ${getFieldClass('tamaño_empresa')}`}
            value={formData.tamaño_empresa || ''}
            onChange={(e) => handleFieldChange('tamaño_empresa', e.target.value)}
          >
            <option value="">Seleccione el tamaño de empresa</option>
            <option value="microempresa">Microempresa (1-10 empleados)</option>
            <option value="pequeña">Pequeña Empresa (11-50 empleados)</option>
            <option value="mediana">Mediana Empresa (51-200 empleados)</option>
            <option value="grande">Gran Empresa (200+ empleados)</option>
          </select>
          {validation.errors.tamaño_empresa && (
            <div className="invalid-feedback">
              {validation.errors.tamaño_empresa}
            </div>
          )}
          <div className="form-text">
            Clasificación por tamaño según número de empleados.
          </div>
        </div>

        {/* Fecha de Fundación */}
        <div className="col-md-6">
          <label htmlFor="fecha_fundacion" className="form-label">
            Fecha de Fundación
          </label>
          <input
            type="date"
            id="fecha_fundacion"
            className={`form-control ${getFieldClass('fecha_fundacion')}`}
            value={formData.fecha_fundacion || ''}
            onChange={(e) => handleFieldChange('fecha_fundacion', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
          {validation.errors.fecha_fundacion && (
            <div className="invalid-feedback">
              {validation.errors.fecha_fundacion}
            </div>
          )}
          <div className="form-text">
            Fecha de fundación o constitución de la organización.
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