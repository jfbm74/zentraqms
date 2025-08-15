/**
 * Health Organization Form Component
 * 
 * Based on Velzon 4.4.1 FormWizard patterns
 * Handles Colombian health organization specific data
 */
import React, { useState, useEffect } from "react";
import InfoTooltip from "../common/InfoTooltip";
import { useBootstrapTooltips } from "../../hooks/useBootstrapTooltips";

// Types for Colombian Health Organizations
interface HealthOrganizationData {
  // REPS Information
  codigo_prestador: string;
  verificado_reps: boolean;
  fecha_verificacion_reps?: string;
  datos_reps?: any;
  
  // Classification
  naturaleza_juridica: string;
  tipo_prestador: string;
  nivel_complejidad: string;
  
  // Legal Representative
  representante_tipo_documento: string;
  representante_numero_documento: string;
  representante_nombre_completo: string;
  representante_telefono: string;
  representante_email: string;
  
  // Qualification Information
  fecha_habilitacion?: string;
  resolucion_habilitacion?: string;
  registro_especial?: string;
  
  // Additional Information
  observaciones_salud?: string;
}

interface HealthOrganizationFormProps {
  data: Partial<HealthOrganizationData>;
  errors: Partial<HealthOrganizationData>;
  onChange: (data: Partial<HealthOrganizationData>) => void;
  className?: string;
}

// Constants based on Colombian health regulations
const NATURALEZA_JURIDICA_OPTIONS = [
  { value: 'privada', label: 'Privada' },
  { value: 'publica', label: 'Pública' },
  { value: 'mixta', label: 'Mixta' }
];

const TIPO_PRESTADOR_OPTIONS = [
  { value: 'IPS', label: 'IPS - Institución Prestadora de Servicios' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'CLINICA', label: 'Clínica' },
  { value: 'CENTRO_MEDICO', label: 'Centro Médico' },
  { value: 'LABORATORIO', label: 'Laboratorio Clínico' },
  { value: 'CENTRO_DIAGNOSTICO', label: 'Centro de Diagnóstico' },
  { value: 'AMBULATORIO', label: 'Centro Ambulatorio' },
  { value: 'OTRO', label: 'Otro' }
];

const NIVEL_COMPLEJIDAD_OPTIONS = [
  { value: 'I', label: 'Nivel I - Baja Complejidad' },
  { value: 'II', label: 'Nivel II - Mediana Complejidad' },
  { value: 'III', label: 'Nivel III - Alta Complejidad' },
  { value: 'IV', label: 'Nivel IV - Máxima Complejidad' }
];

const TIPO_DOCUMENTO_OPTIONS = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'NIT', label: 'NIT' },
  { value: 'TI', label: 'Tarjeta de Identidad' }
];

const HealthOrganizationForm: React.FC<HealthOrganizationFormProps> = ({
  data,
  errors,
  onChange,
  className = ""
}) => {

  // Initialize Bootstrap tooltips
  useBootstrapTooltips([], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 300, hide: 100 },
    animation: true
  });

  // Handle input change
  const handleInputChange = (field: keyof HealthOrganizationData, value: string | boolean) => {
    onChange({ [field]: value });
  };

  // Handle REPS validation
  const handleRepsValidation = async () => {
    if (!data.codigo_prestador || data.codigo_prestador.length !== 12) {
      setRepsValidationResult({
        valid: false,
        message: 'El código debe tener exactamente 12 dígitos'
      });
      return;
    }

    if (!onValidateReps) {
      setRepsValidationResult({
        valid: false,
        message: 'Validación REPS no disponible'
      });
      return;
    }

    setRepsValidationLoading(true);
    setRepsValidationResult({});

    try {
      const result = await onValidateReps(data.codigo_prestador);
      
      setRepsValidationResult({
        valid: result.valid,
        message: result.valid ? 'Código válido en REPS' : (result.error || 'Código no encontrado en REPS'),
        data: result.data
      });

      // Update form data with REPS result
      onChange({
        verificado_reps: result.valid,
        fecha_verificacion_reps: new Date().toISOString(),
        datos_reps: result.data || null
      });

    } catch (error) {
      setRepsValidationResult({
        valid: false,
        message: 'Error al validar en REPS'
      });
    } finally {
      setRepsValidationLoading(false);
    }
  };


  return (
    <div className={`health-organization-form ${className}`}>
      <div className="mb-4">
        <h5 className="mb-1">
          <i className="ri-hospital-line me-2 text-primary"></i>
          Información de Salud
        </h5>
        <p className="text-muted">
          Complete la información específica para organizaciones del sector salud en Colombia
        </p>
      </div>

      {/* REPS Information */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">
            <i className="ri-shield-check-line me-2 text-success"></i>
            Registro REPS
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-12">
              <div className="mb-3">
                <label className="form-label d-flex align-items-center" htmlFor="codigo-prestador">
                  Código Prestador REPS <span className="text-danger ms-1">*</span>
                  <InfoTooltip
                    content="Código de 12 dígitos asignado por el Ministerio de Salud en el Registro Especial de Prestadores de Servicios de Salud (REPS)"
                    placement="top"
                    ariaLabel="Información sobre el código REPS"
                  />
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.codigo_prestador ? "is-invalid" : ""}`}
                  id="codigo-prestador"
                  placeholder="110012345678"
                  value={data.codigo_prestador || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                    handleInputChange("codigo_prestador", value);
                  }}
                  maxLength={12}
                  pattern="[0-9]{12}"
                  aria-describedby="codigo-prestador-help"
                  aria-required="true"
                />
                <div id="codigo-prestador-help" className="form-text">
                  <small className="text-muted">
                    Formato: 12 dígitos numéricos. Ejemplo: 110012345678
                  </small>
                </div>
                {errors.codigo_prestador && (
                  <div className="invalid-feedback d-block">
                    <i className="ri-error-warning-line me-1"></i>
                    {errors.codigo_prestador}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classification Information */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">
            <i className="ri-building-line me-2 text-info"></i>
            Clasificación Institucional
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-lg-4">
              <div className="mb-3">
                <label className="form-label" htmlFor="naturaleza-juridica">
                  Naturaleza Jurídica <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.naturaleza_juridica ? "is-invalid" : ""}`}
                  id="naturaleza-juridica"
                  value={data.naturaleza_juridica || ""}
                  onChange={(e) => handleInputChange("naturaleza_juridica", e.target.value)}
                  aria-required="true"
                >
                  <option value="">Seleccione...</option>
                  {NATURALEZA_JURIDICA_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.naturaleza_juridica && (
                  <div className="invalid-feedback">
                    {errors.naturaleza_juridica}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4">
              <div className="mb-3">
                <label className="form-label" htmlFor="tipo-prestador">
                  Tipo de Prestador <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.tipo_prestador ? "is-invalid" : ""}`}
                  id="tipo-prestador"
                  value={data.tipo_prestador || ""}
                  onChange={(e) => handleInputChange("tipo_prestador", e.target.value)}
                  aria-required="true"
                >
                  <option value="">Seleccione...</option>
                  {TIPO_PRESTADOR_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.tipo_prestador && (
                  <div className="invalid-feedback">
                    {errors.tipo_prestador}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4">
              <div className="mb-3">
                <label className="form-label d-flex align-items-center" htmlFor="nivel-complejidad">
                  Nivel de Complejidad <span className="text-danger ms-1">*</span>
                  <InfoTooltip
                    content="Nivel de complejidad según la capacidad resolutiva de la institución. Determina qué servicios puede prestar"
                    placement="top"
                    ariaLabel="Información sobre nivel de complejidad"
                  />
                </label>
                <select
                  className={`form-select ${errors.nivel_complejidad ? "is-invalid" : ""}`}
                  id="nivel-complejidad"
                  value={data.nivel_complejidad || ""}
                  onChange={(e) => handleInputChange("nivel_complejidad", e.target.value)}
                  aria-required="true"
                >
                  <option value="">Seleccione...</option>
                  {NIVEL_COMPLEJIDAD_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.nivel_complejidad && (
                  <div className="invalid-feedback">
                    {errors.nivel_complejidad}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Representative */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">
            <i className="ri-user-3-line me-2 text-warning"></i>
            Representante Legal
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-lg-3">
              <div className="mb-3">
                <label className="form-label" htmlFor="rep-tipo-doc">
                  Tipo de Documento <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.representante_tipo_documento ? "is-invalid" : ""}`}
                  id="rep-tipo-doc"
                  value={data.representante_tipo_documento || ""}
                  onChange={(e) => handleInputChange("representante_tipo_documento", e.target.value)}
                  aria-required="true"
                >
                  <option value="">Seleccione...</option>
                  {TIPO_DOCUMENTO_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.representante_tipo_documento && (
                  <div className="invalid-feedback">
                    {errors.representante_tipo_documento}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-3">
              <div className="mb-3">
                <label className="form-label" htmlFor="rep-numero-doc">
                  Número de Documento <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.representante_numero_documento ? "is-invalid" : ""}`}
                  id="rep-numero-doc"
                  placeholder="12345678"
                  value={data.representante_numero_documento || ""}
                  onChange={(e) => handleInputChange("representante_numero_documento", e.target.value)}
                  aria-required="true"
                />
                {errors.representante_numero_documento && (
                  <div className="invalid-feedback">
                    {errors.representante_numero_documento}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="mb-3">
                <label className="form-label" htmlFor="rep-nombre">
                  Nombre Completo <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.representante_nombre_completo ? "is-invalid" : ""}`}
                  id="rep-nombre"
                  placeholder="Juan Pérez García"
                  value={data.representante_nombre_completo || ""}
                  onChange={(e) => handleInputChange("representante_nombre_completo", e.target.value)}
                  aria-required="true"
                />
                {errors.representante_nombre_completo && (
                  <div className="invalid-feedback">
                    {errors.representante_nombre_completo}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6">
              <div className="mb-3">
                <label className="form-label" htmlFor="rep-telefono">
                  Teléfono <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="ri-phone-line"></i>
                  </span>
                  <input
                    type="tel"
                    className={`form-control ${errors.representante_telefono ? "is-invalid" : ""}`}
                    id="rep-telefono"
                    placeholder="3001234567"
                    value={data.representante_telefono || ""}
                    onChange={(e) => handleInputChange("representante_telefono", e.target.value)}
                    aria-required="true"
                  />
                </div>
                {errors.representante_telefono && (
                  <div className="invalid-feedback">
                    {errors.representante_telefono}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-6">
              <div className="mb-3">
                <label className="form-label" htmlFor="rep-email">
                  Email <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="ri-mail-line"></i>
                  </span>
                  <input
                    type="email"
                    className={`form-control ${errors.representante_email ? "is-invalid" : ""}`}
                    id="rep-email"
                    placeholder="representante@organizacion.com"
                    value={data.representante_email || ""}
                    onChange={(e) => handleInputChange("representante_email", e.target.value)}
                    aria-required="true"
                  />
                </div>
                {errors.representante_email && (
                  <div className="invalid-feedback">
                    {errors.representante_email}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-light">
          <h6 className="mb-0">
            <i className="ri-file-text-line me-2 text-secondary"></i>
            Información Adicional
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-lg-4">
              <div className="mb-3">
                <label className="form-label" htmlFor="fecha-habilitacion">
                  Fecha de Habilitación
                </label>
                <input
                  type="date"
                  className={`form-control ${errors.fecha_habilitacion ? "is-invalid" : ""}`}
                  id="fecha-habilitacion"
                  value={data.fecha_habilitacion || ""}
                  onChange={(e) => handleInputChange("fecha_habilitacion", e.target.value)}
                />
                {errors.fecha_habilitacion && (
                  <div className="invalid-feedback">
                    {errors.fecha_habilitacion}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4">
              <div className="mb-3">
                <label className="form-label" htmlFor="resolucion-habilitacion">
                  Resolución de Habilitación
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.resolucion_habilitacion ? "is-invalid" : ""}`}
                  id="resolucion-habilitacion"
                  placeholder="Ej: 0001234 de 2023"
                  value={data.resolucion_habilitacion || ""}
                  onChange={(e) => handleInputChange("resolucion_habilitacion", e.target.value)}
                />
                {errors.resolucion_habilitacion && (
                  <div className="invalid-feedback">
                    {errors.resolucion_habilitacion}
                  </div>
                )}
              </div>
            </div>
            <div className="col-lg-4">
              <div className="mb-3">
                <label className="form-label" htmlFor="registro-especial">
                  Registro Especial
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.registro_especial ? "is-invalid" : ""}`}
                  id="registro-especial"
                  placeholder="Si aplica"
                  value={data.registro_especial || ""}
                  onChange={(e) => handleInputChange("registro_especial", e.target.value)}
                />
                {errors.registro_especial && (
                  <div className="invalid-feedback">
                    {errors.registro_especial}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              <div className="mb-3">
                <label className="form-label" htmlFor="observaciones-salud">
                  Observaciones
                </label>
                <textarea
                  className={`form-control ${errors.observaciones_salud ? "is-invalid" : ""}`}
                  id="observaciones-salud"
                  rows={3}
                  placeholder="Observaciones adicionales sobre la institución de salud..."
                  value={data.observaciones_salud || ""}
                  onChange={(e) => handleInputChange("observaciones_salud", e.target.value)}
                  maxLength={1000}
                />
                <div className="form-text d-flex justify-content-between">
                  <small className="text-muted">
                    Información adicional relevante para el registro
                  </small>
                  <small className="text-muted">
                    {(data.observaciones_salud || "").length}/1000 caracteres
                  </small>
                </div>
                {errors.observaciones_salud && (
                  <div className="invalid-feedback">
                    {errors.observaciones_salud}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthOrganizationForm;