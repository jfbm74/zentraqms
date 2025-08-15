/**
 * Sede Form Modal Component (Professional Velzon Style)
 *
 * Modal form for creating and editing sede prestadora with comprehensive
 * validation and user-friendly interface using native HTML with Bootstrap classes
 */
import React, { useState, useEffect } from "react";
import { sedeService } from "../../services/sedeService";
import { useBootstrapTooltips } from "../../hooks/useBootstrapTooltips";
import InfoTooltip from "../common/InfoTooltip";
import type {
  SedeFormModalProps,
  SedeFormData,
  SedePrestadora,
  TipoSede,
  EstadoSede,
} from "../../types/sede.types";
import {
  TIPO_SEDE_OPTIONS,
  ESTADO_SEDE_OPTIONS,
} from "../../types/sede.types";

// Colombian departments and municipalities (simplified)
const DEPARTAMENTOS = [
  { value: 'Amazonas', label: 'Amazonas' },
  { value: 'Antioquia', label: 'Antioquia' },
  { value: 'Arauca', label: 'Arauca' },
  { value: 'Atlántico', label: 'Atlántico' },
  { value: 'Bolívar', label: 'Bolívar' },
  { value: 'Boyacá', label: 'Boyacá' },
  { value: 'Caldas', label: 'Caldas' },
  { value: 'Caquetá', label: 'Caquetá' },
  { value: 'Casanare', label: 'Casanare' },
  { value: 'Cauca', label: 'Cauca' },
  { value: 'Cesar', label: 'Cesar' },
  { value: 'Chocó', label: 'Chocó' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Cundinamarca', label: 'Cundinamarca' },
  { value: 'Guainía', label: 'Guainía' },
  { value: 'Guaviare', label: 'Guaviare' },
  { value: 'Huila', label: 'Huila' },
  { value: 'La Guajira', label: 'La Guajira' },
  { value: 'Magdalena', label: 'Magdalena' },
  { value: 'Meta', label: 'Meta' },
  { value: 'Nariño', label: 'Nariño' },
  { value: 'Norte de Santander', label: 'Norte de Santander' },
  { value: 'Putumayo', label: 'Putumayo' },
  { value: 'Quindío', label: 'Quindío' },
  { value: 'Risaralda', label: 'Risaralda' },
  { value: 'San Andrés y Providencia', label: 'San Andrés y Providencia' },
  { value: 'Santander', label: 'Santander' },
  { value: 'Sucre', label: 'Sucre' },
  { value: 'Tolima', label: 'Tolima' },
  { value: 'Valle del Cauca', label: 'Valle del Cauca' },
  { value: 'Vaupés', label: 'Vaupés' },
  { value: 'Vichada', label: 'Vichada' },
] as const;

const SedeFormModal: React.FC<SedeFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  sede,
  organizationId,
  isLoading = false,
  errors: externalErrors = {},
}) => {
  // Bootstrap tooltips hook
  useBootstrapTooltips([], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 200, hide: 100 },
    animation: true
  });

  // Form data state
  const [formData, setFormData] = useState<Partial<SedeFormData>>({
    health_organization: organizationId,
    numero_sede: '',
    codigo_prestador: '',
    nombre_sede: '',
    tipo_sede: 'sucursal' as TipoSede,
    es_sede_principal: false,
    direccion: '',
    departamento: '',
    municipio: '',
    barrio: '',
    codigo_postal: '',
    telefono_principal: '',
    telefono_secundario: '',
    email: '',
    nombre_responsable: '',
    cargo_responsable: '',
    telefono_responsable: '',
    email_responsable: '',
    estado: 'activa' as EstadoSede,
    fecha_habilitacion: '',
    fecha_renovacion: '',
    numero_camas: 0,
    numero_consultorios: 0,
    numero_quirofanos: 0,
    horario_atencion: {},
    atencion_24_horas: false,
    observaciones: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const TOTAL_STEPS = 4;

  // Initialize form data when sede changes
  useEffect(() => {
    if (sede) {
      setFormData({
        health_organization: organizationId,
        numero_sede: sede.numero_sede || '',
        codigo_prestador: sede.codigo_prestador || '',
        nombre_sede: sede.nombre_sede || '',
        tipo_sede: sede.tipo_sede || 'sucursal',
        es_sede_principal: sede.es_sede_principal || false,
        direccion: sede.direccion || '',
        departamento: sede.departamento || '',
        municipio: sede.municipio || '',
        barrio: sede.barrio || '',
        codigo_postal: sede.codigo_postal || '',
        telefono_principal: sede.telefono_principal || '',
        telefono_secundario: sede.telefono_secundario || '',
        email: sede.email || '',
        nombre_responsable: sede.nombre_responsable || '',
        cargo_responsable: sede.cargo_responsable || '',
        telefono_responsable: sede.telefono_responsable || '',
        email_responsable: sede.email_responsable || '',
        estado: sede.estado || 'activa',
        fecha_habilitacion: sede.fecha_habilitacion || '',
        fecha_renovacion: sede.fecha_renovacion || '',
        numero_camas: sede.numero_camas || 0,
        numero_consultorios: sede.numero_consultorios || 0,
        numero_quirofanos: sede.numero_quirofanos || 0,
        horario_atencion: sede.horario_atencion || {},
        atencion_24_horas: sede.atencion_24_horas || false,
        observaciones: sede.observaciones || '',
      });
      setCurrentStep(1);
    } else {
      // Reset form for new sede
      setFormData({
        health_organization: organizationId,
        numero_sede: '',
        codigo_prestador: '',
        nombre_sede: '',
        tipo_sede: 'sucursal',
        es_sede_principal: false,
        direccion: '',
        departamento: '',
        municipio: '',
        barrio: '',
        codigo_postal: '',
        telefono_principal: '',
        telefono_secundario: '',
        email: '',
        nombre_responsable: '',
        cargo_responsable: '',
        telefono_responsable: '',
        email_responsable: '',
        estado: 'activa',
        fecha_habilitacion: '',
        fecha_renovacion: '',
        numero_camas: 0,
        numero_consultorios: 0,
        numero_quirofanos: 0,
        horario_atencion: {},
        atencion_24_horas: false,
        observaciones: '',
      });
      setCurrentStep(1);
    }
    setValidationErrors({});
  }, [sede, organizationId]);

  // Handle input changes
  const handleInputChange = (field: keyof SedeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Client-side validation
  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    switch (currentStep) {
      case 1: // Basic Information
        if (!formData.numero_sede?.trim()) {
          errors.numero_sede = 'Número de sede es obligatorio';
        } else if (!/^\d{1,3}$/.test(formData.numero_sede)) {
          errors.numero_sede = 'Número de sede debe ser numérico (máximo 3 dígitos)';
        }

        if (!formData.codigo_prestador?.trim()) {
          errors.codigo_prestador = 'Código de prestador es obligatorio';
        } else if (formData.codigo_prestador.length < 9) {
          errors.codigo_prestador = 'Código de prestador debe tener al menos 9 caracteres';
        }

        if (!formData.nombre_sede?.trim()) {
          errors.nombre_sede = 'Nombre de sede es obligatorio';
        }

        if (!formData.tipo_sede) {
          errors.tipo_sede = 'Tipo de sede es obligatorio';
        }
        break;

      case 2: // Location Information
        if (!formData.direccion?.trim()) {
          errors.direccion = 'Dirección es obligatoria';
        }

        if (!formData.departamento?.trim()) {
          errors.departamento = 'Departamento es obligatorio';
        }

        if (!formData.municipio?.trim()) {
          errors.municipio = 'Municipio es obligatorio';
        }
        break;

      case 3: // Contact Information
        if (!formData.telefono_principal?.trim()) {
          errors.telefono_principal = 'Teléfono principal es obligatorio';
        } else if (!/^\+?[\d\s\-\(\)]{7,20}$/.test(formData.telefono_principal)) {
          errors.telefono_principal = 'Formato de teléfono inválido';
        }

        if (!formData.email?.trim()) {
          errors.email = 'Email es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Formato de email inválido';
        }

        if (!formData.nombre_responsable?.trim()) {
          errors.nombre_responsable = 'Nombre del responsable es obligatorio';
        }

        if (!formData.cargo_responsable?.trim()) {
          errors.cargo_responsable = 'Cargo del responsable es obligatorio';
        }

        // Optional field validations
        if (formData.telefono_secundario && !/^\+?[\d\s\-\(\)]{7,20}$/.test(formData.telefono_secundario)) {
          errors.telefono_secundario = 'Formato de teléfono secundario inválido';
        }

        if (formData.telefono_responsable && !/^\+?[\d\s\-\(\)]{7,20}$/.test(formData.telefono_responsable)) {
          errors.telefono_responsable = 'Formato de teléfono del responsable inválido';
        }

        if (formData.email_responsable && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_responsable)) {
          errors.email_responsable = 'Formato de email del responsable inválido';
        }
        break;

      case 4: // Capacity & Additional Information
        // Numeric validations
        if (formData.numero_camas !== undefined && formData.numero_camas < 0) {
          errors.numero_camas = 'Número de camas no puede ser negativo';
        }

        if (formData.numero_consultorios !== undefined && formData.numero_consultorios < 0) {
          errors.numero_consultorios = 'Número de consultorios no puede ser negativo';
        }

        if (formData.numero_quirofanos !== undefined && formData.numero_quirofanos < 0) {
          errors.numero_quirofanos = 'Número de quirófanos no puede ser negativo';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (validateCurrentStep() && currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    try {
      setIsValidating(true);
      
      // Clean up form data: convert empty date strings to null
      const cleanedFormData = {
        ...formData,
        fecha_habilitacion: formData.fecha_habilitacion.trim() || null,
        fecha_renovacion: formData.fecha_renovacion.trim() || null,
      };
      
      await onSave(cleanedFormData as SedeFormData);
    } catch (error) {
      // Error will be handled by the parent component
    } finally {
      setIsValidating(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderLocationInformation();
      case 3:
        return renderContactInformation();
      case 4:
        return renderCapacityInformation();
      default:
        return null;
    }
  };

  // Step 1: Basic Information
  const renderBasicInformation = () => (
    <div>
      <div className="mb-4">
        <h6 className="fw-semibold">Información Básica</h6>
        <p className="text-muted small mb-0">Datos identificativos de la sede prestadora</p>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="numero_sede">
              Número de Sede <span className="text-danger ms-1">*</span>
              <InfoTooltip
                content="Número único que identifica la sede dentro de la organización (máximo 3 dígitos)"
                placement="top"
                ariaLabel="Información sobre el número de sede"
              />
            </label>
            <input
              type="text"
              className={`form-control ${validationErrors.numero_sede || externalErrors.numero_sede ? "is-invalid" : ""}`}
              id="numero_sede"
              placeholder="Ej: 001, 002, 010"
              value={formData.numero_sede || ""}
              onChange={(e) => handleInputChange("numero_sede", e.target.value)}
              maxLength={3}
              aria-required="true"
            />
            {(validationErrors.numero_sede || externalErrors.numero_sede) && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.numero_sede || externalErrors.numero_sede}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="codigo_prestador">
              Código de Prestador <span className="text-danger ms-1">*</span>
              <InfoTooltip
                content="Código único del prestador ante el REPS (Registro Especial de Prestadores de Servicios de Salud)"
                placement="top"
                ariaLabel="Información sobre el código de prestador"
              />
            </label>
            <input
              type="text"
              className={`form-control ${validationErrors.codigo_prestador || externalErrors.codigo_prestador ? "is-invalid" : ""}`}
              id="codigo_prestador"
              placeholder="Código REPS"
              value={formData.codigo_prestador || ""}
              onChange={(e) => handleInputChange("codigo_prestador", e.target.value)}
              aria-required="true"
            />
            {(validationErrors.codigo_prestador || externalErrors.codigo_prestador) && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.codigo_prestador || externalErrors.codigo_prestador}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="nombre_sede">
              Nombre de la Sede <span className="text-danger ms-1">*</span>
              <InfoTooltip
                content="Nombre descriptivo de la sede prestadora de servicios de salud"
                placement="top"
                ariaLabel="Información sobre el nombre de la sede"
              />
            </label>
            <input
              type="text"
              className={`form-control ${validationErrors.nombre_sede || externalErrors.nombre_sede ? "is-invalid" : ""}`}
              id="nombre_sede"
              placeholder="Ej: Sede Principal Centro, Clínica Norte"
              value={formData.nombre_sede || ""}
              onChange={(e) => handleInputChange("nombre_sede", e.target.value)}
              aria-required="true"
            />
            {(validationErrors.nombre_sede || externalErrors.nombre_sede) && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.nombre_sede || externalErrors.nombre_sede}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="tipo_sede">
              Tipo de Sede <span className="text-danger ms-1">*</span>
            </label>
            <select
              className={`form-select ${validationErrors.tipo_sede || externalErrors.tipo_sede ? "is-invalid" : ""}`}
              id="tipo_sede"
              value={formData.tipo_sede || ''}
              onChange={(e) => handleInputChange("tipo_sede", e.target.value)}
              aria-required="true"
            >
              <option value="">Seleccione tipo</option>
              {TIPO_SEDE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {(validationErrors.tipo_sede || externalErrors.tipo_sede) && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.tipo_sede || externalErrors.tipo_sede}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="es_sede_principal"
              checked={formData.es_sede_principal || false}
              onChange={(e) => handleInputChange("es_sede_principal", e.target.checked)}
            />
            <label className="form-check-label d-flex align-items-center" htmlFor="es_sede_principal">
              Es sede principal
              <InfoTooltip
                content="Marque si esta es la sede principal de la organización"
                placement="top"
                ariaLabel="Información sobre sede principal"
              />
            </label>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="estado">
              Estado <span className="text-danger ms-1">*</span>
            </label>
            <select
              className="form-select"
              id="estado"
              value={formData.estado || 'activa'}
              onChange={(e) => handleInputChange("estado", e.target.value)}
            >
              {ESTADO_SEDE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: Location Information
  const renderLocationInformation = () => (
    <div>
      <div className="mb-4">
        <h6 className="fw-semibold">Información de Ubicación</h6>
        <p className="text-muted small mb-0">Dirección y ubicación geográfica de la sede</p>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="direccion">
              Dirección <span className="text-danger ms-1">*</span>
              <InfoTooltip
                content="Dirección completa de la sede (calle, carrera, número, etc.)"
                placement="top"
                ariaLabel="Información sobre la dirección"
              />
            </label>
            <input
              type="text"
              className={`form-control ${validationErrors.direccion || externalErrors.direccion ? "is-invalid" : ""}`}
              id="direccion"
              placeholder="Ej: Calle 123 # 45-67"
              value={formData.direccion || ""}
              onChange={(e) => handleInputChange("direccion", e.target.value)}
              aria-required="true"
            />
            {(validationErrors.direccion || externalErrors.direccion) && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.direccion || externalErrors.direccion}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="departamento">
              Departamento <span className="text-danger ms-1">*</span>
            </label>
            <select
              className={`form-select ${validationErrors.departamento || externalErrors.departamento ? "is-invalid" : ""}`}
              id="departamento"
              value={formData.departamento || ''}
              onChange={(e) => handleInputChange("departamento", e.target.value)}
              aria-required="true"
            >
              <option value="">Seleccione departamento</option>
              {DEPARTAMENTOS.map(dept => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
            {(validationErrors.departamento || externalErrors.departamento) && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.departamento || externalErrors.departamento}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="municipio">
              Municipio <span className="text-danger ms-1">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${validationErrors.municipio || externalErrors.municipio ? "is-invalid" : ""}`}
              id="municipio"
              placeholder="Nombre del municipio"
              value={formData.municipio || ""}
              onChange={(e) => handleInputChange("municipio", e.target.value)}
              aria-required="true"
            />
            {(validationErrors.municipio || externalErrors.municipio) && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.municipio || externalErrors.municipio}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="barrio">
              Barrio/Sector
            </label>
            <input
              type="text"
              className="form-control"
              id="barrio"
              placeholder="Nombre del barrio o sector"
              value={formData.barrio || ""}
              onChange={(e) => handleInputChange("barrio", e.target.value)}
            />
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="codigo_postal">
              Código Postal
            </label>
            <input
              type="text"
              className="form-control"
              id="codigo_postal"
              placeholder="Código postal"
              value={formData.codigo_postal || ""}
              onChange={(e) => handleInputChange("codigo_postal", e.target.value)}
              maxLength={10}
            />
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="latitud">
              Latitud (Opcional)
            </label>
            <input
              type="number"
              step="any"
              className="form-control"
              id="latitud"
              placeholder="Ej: 4.6097100"
              value={formData.latitud || ""}
              onChange={(e) => handleInputChange("latitud", parseFloat(e.target.value) || undefined)}
            />
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="longitud">
              Longitud (Opcional)
            </label>
            <input
              type="number"
              step="any"
              className="form-control"
              id="longitud"
              placeholder="Ej: -74.0817500"
              value={formData.longitud || ""}
              onChange={(e) => handleInputChange("longitud", parseFloat(e.target.value) || undefined)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Contact Information
  const renderContactInformation = () => (
    <div>
      <div className="mb-4">
        <h6 className="fw-semibold">Información de Contacto</h6>
        <p className="text-muted small mb-0">Datos de contacto de la sede y responsable</p>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="telefono_principal">
              Teléfono Principal <span className="text-danger ms-1">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="ri-phone-line" aria-hidden="true"></i>
              </span>
              <input
                type="tel"
                className={`form-control ${validationErrors.telefono_principal || externalErrors.telefono_principal ? "is-invalid" : ""}`}
                id="telefono_principal"
                placeholder="Ej: +57 300 123 4567"
                value={formData.telefono_principal || ""}
                onChange={(e) => handleInputChange("telefono_principal", e.target.value)}
                aria-required="true"
              />
            </div>
            {(validationErrors.telefono_principal || externalErrors.telefono_principal) && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.telefono_principal || externalErrors.telefono_principal}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="telefono_secundario">
              Teléfono Secundario
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="ri-phone-line" aria-hidden="true"></i>
              </span>
              <input
                type="tel"
                className={`form-control ${validationErrors.telefono_secundario ? "is-invalid" : ""}`}
                id="telefono_secundario"
                placeholder="Teléfono adicional"
                value={formData.telefono_secundario || ""}
                onChange={(e) => handleInputChange("telefono_secundario", e.target.value)}
              />
            </div>
            {validationErrors.telefono_secundario && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.telefono_secundario}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="mb-4">
            <label className="form-label d-flex align-items-center" htmlFor="email">
              Email de la Sede <span className="text-danger ms-1">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="ri-mail-line" aria-hidden="true"></i>
              </span>
              <input
                type="email"
                className={`form-control ${validationErrors.email || externalErrors.email ? "is-invalid" : ""}`}
                id="email"
                placeholder="contacto@sede.com"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                aria-required="true"
              />
            </div>
            {(validationErrors.email || externalErrors.email) && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.email || externalErrors.email}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsible Person Section */}
      <div className="border-top pt-4">
        <h6 className="fw-semibold mb-3">
          <i className="ri-user-settings-line me-1" aria-hidden="true"></i>
          Información del Responsable
        </h6>

        <div className="row">
          <div className="col-lg-6">
            <div className="mb-3">
              <label className="form-label" htmlFor="nombre_responsable">
                Nombre del Responsable <span className="text-danger ms-1">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${validationErrors.nombre_responsable || externalErrors.nombre_responsable ? "is-invalid" : ""}`}
                id="nombre_responsable"
                placeholder="Nombre completo"
                value={formData.nombre_responsable || ""}
                onChange={(e) => handleInputChange("nombre_responsable", e.target.value)}
                aria-required="true"
              />
              {(validationErrors.nombre_responsable || externalErrors.nombre_responsable) && (
                <div className="invalid-feedback" role="alert">
                  <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                  {validationErrors.nombre_responsable || externalErrors.nombre_responsable}
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="mb-3">
              <label className="form-label" htmlFor="cargo_responsable">
                Cargo del Responsable <span className="text-danger ms-1">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${validationErrors.cargo_responsable || externalErrors.cargo_responsable ? "is-invalid" : ""}`}
                id="cargo_responsable"
                placeholder="Ej: Director Médico, Administrador"
                value={formData.cargo_responsable || ""}
                onChange={(e) => handleInputChange("cargo_responsable", e.target.value)}
                aria-required="true"
              />
              {(validationErrors.cargo_responsable || externalErrors.cargo_responsable) && (
                <div className="invalid-feedback" role="alert">
                  <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                  {validationErrors.cargo_responsable || externalErrors.cargo_responsable}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6">
            <div className="mb-3">
              <label className="form-label" htmlFor="telefono_responsable">
                Teléfono del Responsable
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="ri-phone-line" aria-hidden="true"></i>
                </span>
                <input
                  type="tel"
                  className={`form-control ${validationErrors.telefono_responsable ? "is-invalid" : ""}`}
                  id="telefono_responsable"
                  placeholder="Teléfono directo"
                  value={formData.telefono_responsable || ""}
                  onChange={(e) => handleInputChange("telefono_responsable", e.target.value)}
                />
              </div>
              {validationErrors.telefono_responsable && (
                <div className="invalid-feedback" role="alert">
                  <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                  {validationErrors.telefono_responsable}
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="mb-3">
              <label className="form-label" htmlFor="email_responsable">
                Email del Responsable
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="ri-mail-line" aria-hidden="true"></i>
                </span>
                <input
                  type="email"
                  className={`form-control ${validationErrors.email_responsable ? "is-invalid" : ""}`}
                  id="email_responsable"
                  placeholder="email.responsable@sede.com"
                  value={formData.email_responsable || ""}
                  onChange={(e) => handleInputChange("email_responsable", e.target.value)}
                />
              </div>
              {validationErrors.email_responsable && (
                <div className="invalid-feedback" role="alert">
                  <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                  {validationErrors.email_responsable}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Capacity Information
  const renderCapacityInformation = () => (
    <div>
      <div className="mb-4">
        <h6 className="fw-semibold">Capacidad Instalada y Configuración</h6>
        <p className="text-muted small mb-0">Capacidad de atención y configuración operativa</p>
      </div>

      <div className="row">
        <div className="col-lg-4">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="numero_camas">
              Número de Camas
              <InfoTooltip
                content="Cantidad total de camas disponibles en la sede"
                placement="top"
                ariaLabel="Información sobre número de camas"
              />
            </label>
            <input
              type="number"
              min="0"
              className={`form-control ${validationErrors.numero_camas ? "is-invalid" : ""}`}
              id="numero_camas"
              placeholder="0"
              value={formData.numero_camas || 0}
              onChange={(e) => handleInputChange("numero_camas", parseInt(e.target.value) || 0)}
            />
            {validationErrors.numero_camas && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.numero_camas}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="numero_consultorios">
              Número de Consultorios
              <InfoTooltip
                content="Cantidad de consultorios disponibles para atención ambulatoria"
                placement="top"
                ariaLabel="Información sobre número de consultorios"
              />
            </label>
            <input
              type="number"
              min="0"
              className={`form-control ${validationErrors.numero_consultorios ? "is-invalid" : ""}`}
              id="numero_consultorios"
              placeholder="0"
              value={formData.numero_consultorios || 0}
              onChange={(e) => handleInputChange("numero_consultorios", parseInt(e.target.value) || 0)}
            />
            {validationErrors.numero_consultorios && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.numero_consultorios}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="numero_quirofanos">
              Número de Quirófanos
              <InfoTooltip
                content="Cantidad de quirófanos disponibles para procedimientos"
                placement="top"
                ariaLabel="Información sobre número de quirófanos"
              />
            </label>
            <input
              type="number"
              min="0"
              className={`form-control ${validationErrors.numero_quirofanos ? "is-invalid" : ""}`}
              id="numero_quirofanos"
              placeholder="0"
              value={formData.numero_quirofanos || 0}
              onChange={(e) => handleInputChange("numero_quirofanos", parseInt(e.target.value) || 0)}
            />
            {validationErrors.numero_quirofanos && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {validationErrors.numero_quirofanos}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="fecha_habilitacion">
              Fecha de Habilitación
            </label>
            <input
              type="date"
              className="form-control"
              id="fecha_habilitacion"
              value={formData.fecha_habilitacion || ""}
              onChange={(e) => handleInputChange("fecha_habilitacion", e.target.value)}
            />
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="fecha_renovacion">
              Fecha de Renovación
            </label>
            <input
              type="date"
              className="form-control"
              id="fecha_renovacion"
              value={formData.fecha_renovacion || ""}
              onChange={(e) => handleInputChange("fecha_renovacion", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="atencion_24_horas"
              checked={formData.atencion_24_horas || false}
              onChange={(e) => handleInputChange("atencion_24_horas", e.target.checked)}
            />
            <label className="form-check-label d-flex align-items-center" htmlFor="atencion_24_horas">
              Atención 24 horas
              <InfoTooltip
                content="Marque si la sede ofrece atención las 24 horas del día"
                placement="top"
                ariaLabel="Información sobre atención 24 horas"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="observaciones">
              Observaciones
            </label>
            <textarea
              className="form-control"
              id="observaciones"
              rows={3}
              placeholder="Observaciones adicionales sobre la sede..."
              value={formData.observaciones || ""}
              onChange={(e) => handleInputChange("observaciones", e.target.value)}
              maxLength={500}
            />
            <div className="form-text d-flex justify-content-end">
              <small className="text-muted">
                {(formData.observaciones || "").length}/500 caracteres
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <div 
      className="modal fade show" 
      style={{ 
        display: 'block', 
        zIndex: 1055,
        backgroundColor: 'rgba(0,0,0,0.5)' 
      }} 
      tabIndex={-1} 
      role="dialog" 
      aria-hidden="false"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="modal-dialog modal-xl" 
        role="document"
        style={{ 
          margin: '1.75rem auto',
          maxWidth: '1140px',
          position: 'relative',
          zIndex: 1056
        }}
      >
        <div className="modal-content" style={{ position: 'relative', zIndex: 1057 }}>
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ri-building-line me-2" aria-hidden="true"></i>
              {sede ? 'Editar Sede Prestadora' : 'Nueva Sede Prestadora'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Cerrar modal"
              disabled={isLoading || isValidating}
            ></button>
          </div>

          <div className="modal-body">
            {/* Progress Steps */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                {Array.from({ length: TOTAL_STEPS }, (_, index) => {
                  const stepNumber = index + 1;
                  const isActive = stepNumber === currentStep;
                  const isCompleted = stepNumber < currentStep;
                  
                  return (
                    <div key={stepNumber} className="d-flex align-items-center flex-fill">
                      <div className={`rounded-circle d-flex align-items-center justify-content-center ${
                        isActive ? 'bg-primary text-white' : 
                        isCompleted ? 'bg-success text-white' : 
                        'bg-light text-muted'
                      }`} style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                        {isCompleted ? (
                          <i className="ri-check-line" aria-hidden="true"></i>
                        ) : (
                          stepNumber
                        )}
                      </div>
                      {stepNumber < TOTAL_STEPS && (
                        <div className={`flex-fill mx-2 ${isCompleted ? 'bg-success' : 'bg-light'}`} style={{ height: '2px' }}></div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="d-flex justify-content-between">
                <small className="text-muted">Información Básica</small>
                <small className="text-muted">Ubicación</small>
                <small className="text-muted">Contacto</small>
                <small className="text-muted">Capacidad</small>
              </div>
            </div>

            {/* Step Content */}
            {renderStepContent()}

            {/* External errors */}
            {externalErrors.general && (
              <div className="alert alert-danger mt-3" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {Array.isArray(externalErrors.general) ? externalErrors.general.join(', ') : externalErrors.general}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <div className="d-flex justify-content-between w-100">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handlePrevStep}
                    disabled={isLoading || isValidating}
                  >
                    <i className="ri-arrow-left-line me-1" aria-hidden="true"></i>
                    Anterior
                  </button>
                )}
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={isLoading || isValidating}
                >
                  Cancelar
                </button>
                {currentStep < TOTAL_STEPS ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNextStep}
                    disabled={isLoading || isValidating}
                  >
                    Siguiente
                    <i className="ri-arrow-right-line ms-1" aria-hidden="true"></i>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSubmit}
                    disabled={isLoading || isValidating}
                  >
                    {(isLoading || isValidating) ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="ri-save-line me-1" aria-hidden="true"></i>
                        {sede ? 'Actualizar Sede' : 'Crear Sede'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SedeFormModal;