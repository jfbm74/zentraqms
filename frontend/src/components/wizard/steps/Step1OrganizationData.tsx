/**
 * Step 1: Organization Basic Data Component (Professional Velzon Style)
 *
 * Handles basic organization information input with professional UI
 */
import React from "react";
import NitInput from "../../forms/NitInput";
import { useBootstrapTooltips } from "../../../hooks/useBootstrapTooltips";
import InfoTooltip from "../../common/InfoTooltip";

// Types
interface OrganizationData {
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  nit?: string;
  digito_verificacion?: string;
}

interface Step1Props {
  data: Partial<OrganizationData>;
  errors: Partial<OrganizationData>;
  onChange: (data: Partial<OrganizationData>) => void;
}

const Step1OrganizationData: React.FC<Step1Props> = ({
  data,
  errors,
  onChange,
}) => {
  // Initialize Bootstrap tooltips with custom hook
  useBootstrapTooltips([data, errors], {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 200, hide: 100 },
    animation: true
  });

  // Handle input change
  const handleInputChange = (field: keyof OrganizationData, value: string) => {
    onChange({ [field]: value });
  };

  // Handle NIT change
  const handleNitChange = (
    nit: string,
    verificationDigit: string,
  ) => {
    onChange({
      nit,
      digito_verificacion: verificationDigit,
    });
  };

  return (
    <div>
      <div className="mb-4">
        <h5 className="mb-1">Información de la Organización</h5>
        <p className="text-muted">
          Ingrese la información básica de su organización
        </p>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="org-name">
              Nombre de la Organización <span className="text-danger ms-1">*</span>
              <InfoTooltip
                content="Razón social completa de la organización tal como aparece en documentos legales"
                placement="top"
                ariaLabel="Información sobre el nombre de la organización"
              />
            </label>
            <input
              type="text"
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              id="org-name"
              placeholder="Ej. Empresa de Tecnología SAS"
              value={data.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              aria-describedby="org-name-help"
              aria-required="true"
              aria-invalid={errors.name ? "true" : "false"}
            />
            <div id="org-name-help" className="form-text">
              <small className="text-muted">Nombre legal completo de la organización</small>
            </div>
            {errors.name && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {errors.name}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="org-email">
              Email Principal <span className="text-danger ms-1">*</span>
              <InfoTooltip
                content="Correo electrónico principal para comunicaciones oficiales y notificaciones del sistema"
                placement="top"
                ariaLabel="Información sobre el email principal"
              />
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="ri-mail-line" aria-hidden="true"></i>
              </span>
              <input
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                id="org-email"
                placeholder="contacto@organizacion.com"
                value={data.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                aria-describedby="org-email-help"
                aria-required="true"
                aria-invalid={errors.email ? "true" : "false"}
              />
            </div>
            <div id="org-email-help" className="form-text">
              <small className="text-muted">Se usará para notificaciones importantes del sistema</small>
            </div>
            {errors.email && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {errors.email}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NIT Input Row */}
      <div className="row">
        <div className="col-lg-8">
          <div className="mb-3">
            <NitInput
              label="NIT de la Organización"
              placeholder="Ingrese el NIT"
              value={data.nit || ""}
              verificationDigit={data.digito_verificacion || ""}
              onChange={handleNitChange}
              required={true}
              error={errors.nit}
            />
          </div>
        </div>
        <div className="col-lg-4">
          <div className="mb-3">
            <label className="form-label text-muted small">
              <i className="ri-information-line me-1"></i>
              Información NIT
            </label>
            <div className="alert alert-info p-2">
              <small>
                <strong>NIT:</strong> Número de Identificación Tributaria
                <br />
                <strong>Formato:</strong> 123456789 + dígito verificación
                <br />
                <strong>Ingreso manual:</strong> NIT y dígito por separado
              </small>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="org-phone">
              Teléfono Principal <span className="text-danger ms-1">*</span>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-1"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Número telefónico principal de la organización. Incluya código de país y ciudad si es necesario"
                aria-label="Información sobre el teléfono principal"
              >
                <i className="ri-question-line text-primary" aria-hidden="true"></i>
              </button>
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="ri-phone-line" aria-hidden="true"></i>
              </span>
              <input
                type="tel"
                className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                id="org-phone"
                placeholder="Ej: +57 300 123 4567"
                value={data.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                aria-describedby="org-phone-help"
                aria-required="true"
                aria-invalid={errors.phone ? "true" : "false"}
                maxLength={18}
              />
            </div>
            <div id="org-phone-help" className="form-text">
              <small className="text-muted">Ejemplo: +57 300 123 4567 o 3001234567</small>
            </div>
            {errors.phone && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {errors.phone}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="org-website">
              Sitio Web
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-1"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="URL del sitio web oficial de la organización (opcional)"
                aria-label="Información sobre el sitio web"
              >
                <i className="ri-question-line text-primary" aria-hidden="true"></i>
              </button>
            </label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="ri-global-line" aria-hidden="true"></i>
              </span>
              <input
                type="url"
                className={`form-control ${errors.website ? "is-invalid" : ""}`}
                id="org-website"
                placeholder="https://www.organizacion.com"
                value={data.website || ""}
                onChange={(e) => handleInputChange("website", e.target.value)}
                aria-describedby="org-website-help"
                aria-invalid={errors.website ? "true" : "false"}
              />
            </div>
            <div id="org-website-help" className="form-text">
              <small className="text-muted">URL completa incluyendo https:// (opcional)</small>
            </div>
            {errors.website && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {errors.website}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="mb-3">
            <label className="form-label d-flex align-items-center" htmlFor="org-description">
              Descripción de la Organización
              <button
                type="button"
                className="btn btn-link btn-sm p-0 ms-1"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Descripción general de la organización, su misión, visión y actividades principales. Esta información ayudará a configurar mejor el sistema QMS"
                aria-label="Información sobre la descripción"
              >
                <i className="ri-question-line text-primary" aria-hidden="true"></i>
              </button>
            </label>
            <textarea
              className={`form-control ${errors.description ? "is-invalid" : ""}`}
              id="org-description"
              placeholder="Describa brevemente su organización: misión, visión, actividades principales, mercado objetivo, etc."
              rows={4}
              value={data.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              aria-describedby="org-description-help"
              aria-invalid={errors.description ? "true" : "false"}
              maxLength={500}
            />
            <div id="org-description-help" className="form-text d-flex justify-content-between">
              <small className="text-muted">
                <i className="ri-information-line me-1" aria-hidden="true"></i>
                Esta información ayudará a personalizar las configuraciones del QMS
              </small>
              <small className="text-muted">
                {(data.description || "").length}/500 caracteres
              </small>
            </div>
            {errors.description && (
              <div className="invalid-feedback" role="alert">
                <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
                {errors.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1OrganizationData;
