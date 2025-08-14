/**
 * Step 2: Location Data Component (Professional Velzon Style)
 *
 * Handles organization location information input with professional UI
 */
import React from "react";

// Types
interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

interface Step2Props {
  data: Partial<LocationData>;
  errors: Partial<LocationData>;
  onChange: (data: Partial<LocationData>) => void;
}

const Step2LocationData: React.FC<Step2Props> = ({
  data,
  errors,
  onChange,
}) => {
  // Colombian departments/states
  const stateOptions = [
    "Amazonas",
    "Antioquia",
    "Arauca",
    "Atlántico",
    "Bolívar",
    "Boyacá",
    "Caldas",
    "Caquetá",
    "Casanare",
    "Cauca",
    "Cesar",
    "Chocó",
    "Córdoba",
    "Cundinamarca",
    "Guainía",
    "Guaviare",
    "Huila",
    "La Guajira",
    "Magdalena",
    "Meta",
    "Nariño",
    "Norte de Santander",
    "Putumayo",
    "Quindío",
    "Risaralda",
    "San Andrés y Providencia",
    "Santander",
    "Sucre",
    "Tolima",
    "Valle del Cauca",
    "Vaupés",
    "Vichada",
  ];

  // Handle input change
  const handleInputChange = (field: keyof LocationData, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <div>
      <div className="mb-4">
        <h5 className="mb-1">Ubicación de la Organización</h5>
        <p className="text-muted">
          Ingrese la dirección y ubicación principal de su organización
        </p>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="address">
              Dirección Completa <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.address ? "is-invalid" : ""}`}
              id="address"
              placeholder="Ej: Calle 123 # 45-67, Oficina 890"
              value={data.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
            {errors.address && (
              <div className="invalid-feedback">{errors.address}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="city">
              Ciudad <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.city ? "is-invalid" : ""}`}
              id="city"
              placeholder="Ej: Bogotá, Medellín, Cali"
              value={data.city || ""}
              onChange={(e) => handleInputChange("city", e.target.value)}
            />
            {errors.city && (
              <div className="invalid-feedback">{errors.city}</div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="state">
              Departamento/Estado <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.state ? "is-invalid" : ""}`}
              id="state"
              value={data.state || ""}
              onChange={(e) => handleInputChange("state", e.target.value)}
            >
              <option value="">Seleccione el departamento</option>
              {stateOptions.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {errors.state && (
              <div className="invalid-feedback">{errors.state}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="country">
              País <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.country ? "is-invalid" : ""}`}
              id="country"
              value={data.country || ""}
              onChange={(e) => handleInputChange("country", e.target.value)}
            >
              <option value="">Seleccione el país</option>
              <option value="Colombia">Colombia</option>
              <option value="Argentina">Argentina</option>
              <option value="Brasil">Brasil</option>
              <option value="Chile">Chile</option>
              <option value="Ecuador">Ecuador</option>
              <option value="México">México</option>
              <option value="Perú">Perú</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Otro">Otro</option>
            </select>
            {errors.country && (
              <div className="invalid-feedback">{errors.country}</div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="postal_code">
              Código Postal
            </label>
            <input
              type="text"
              className={`form-control ${errors.postal_code ? "is-invalid" : ""}`}
              id="postal_code"
              placeholder="Ej: 110111"
              value={data.postal_code || ""}
              onChange={(e) => handleInputChange("postal_code", e.target.value)}
            />
            {errors.postal_code && (
              <div className="invalid-feedback">{errors.postal_code}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2LocationData;
