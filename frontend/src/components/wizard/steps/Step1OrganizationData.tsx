/**
 * Step 1: Organization Basic Data Component (Professional Velzon Style)
 *
 * Handles basic organization information input with professional UI
 */
import React from "react";
import NitInput from "../../forms/NitInput";

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
            <label className="form-label" htmlFor="org-name">
              Nombre de la Organización <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              id="org-name"
              placeholder="Ingrese el nombre de la organización"
              value={data.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
            {errors.name && (
              <div className="invalid-feedback">{errors.name}</div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="org-email">
              Email Principal <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              id="org-email"
              placeholder="contacto@organizacion.com"
              value={data.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
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
                <strong>Formato:</strong> 123.456.789-0
                <br />
                <strong>Auto-calcula</strong> el dígito de verificación
              </small>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="org-phone">
              Teléfono Principal <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
              id="org-phone"
              placeholder="+57 1 234 5678"
              value={data.phone || ""}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
            {errors.phone && (
              <div className="invalid-feedback">{errors.phone}</div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="org-website">
              Sitio Web
            </label>
            <input
              type="url"
              className={`form-control ${errors.website ? "is-invalid" : ""}`}
              id="org-website"
              placeholder="https://www.organizacion.com"
              value={data.website || ""}
              onChange={(e) => handleInputChange("website", e.target.value)}
            />
            {errors.website && (
              <div className="invalid-feedback">{errors.website}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="org-description">
              Descripción de la Organización
            </label>
            <textarea
              className={`form-control ${errors.description ? "is-invalid" : ""}`}
              id="org-description"
              placeholder="Describa brevemente su organización, su misión y actividades principales"
              rows={4}
              value={data.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
            {errors.description && (
              <div className="invalid-feedback">{errors.description}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1OrganizationData;
