/**
 * Step 2: Location Data Component (Professional Velzon Style)
 *
 * Handles organization location information input with professional UI using DIVIPOLA service
 */
import React, { useEffect } from "react";
import { useDivipola } from "../../../hooks/useDivipola";

// Types
interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  department_code?: string;
  municipality_code?: string;
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
  // Use DIVIPOLA hook
  const {
    departments,
    municipalities,
    loadingDepartments,
    loadingMunicipalities,
    error: divipolaError,
    loadMunicipalities,
    getDepartmentName,
    getMunicipalityName,
  } = useDivipola();

  // Load municipalities when department changes
  useEffect(() => {
    if (data.department_code) {
      loadMunicipalities(data.department_code);
    }
  }, [data.department_code, loadMunicipalities]);

  // Handle input change
  const handleInputChange = (field: keyof LocationData, value: string) => {
    const updates: Partial<LocationData> = { [field]: value };
    
    // Special handling for department changes
    if (field === 'department_code') {
      // Clear municipality when department changes
      updates.municipality_code = '';
      updates.city = '';
      
      // Update state name based on department selection
      const departmentName = getDepartmentName(value);
      if (departmentName) {
        updates.state = departmentName;
      }
    }
    
    // Special handling for municipality changes
    if (field === 'municipality_code') {
      const municipalityName = getMunicipalityName(value);
      if (municipalityName) {
        updates.city = municipalityName;
      }
    }
    
    onChange(updates);
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
            <label className="form-label" htmlFor="department_code">
              Departamento <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.state ? "is-invalid" : ""}`}
              id="department_code"
              value={data.department_code || ""}
              onChange={(e) => handleInputChange("department_code", e.target.value)}
              disabled={loadingDepartments}
            >
              <option value="">
                {loadingDepartments ? "Cargando departamentos..." : "Seleccione el departamento"}
              </option>
              {departments.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.name}
                </option>
              ))}
            </select>
            {errors.state && (
              <div className="invalid-feedback">{errors.state}</div>
            )}
            {divipolaError && (
              <div className="text-warning small mt-1">
                <i className="mdi mdi-alert-circle me-1"></i>
                {divipolaError}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="municipality_code">
              Municipio <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.city ? "is-invalid" : ""}`}
              id="municipality_code"
              value={data.municipality_code || ""}
              onChange={(e) => handleInputChange("municipality_code", e.target.value)}
              disabled={!data.department_code || loadingMunicipalities}
            >
              <option value="">
                {!data.department_code 
                  ? "Primero seleccione el departamento"
                  : loadingMunicipalities 
                  ? "Cargando municipios..." 
                  : "Seleccione el municipio"
                }
              </option>
              {municipalities.map((muni) => (
                <option key={muni.code} value={muni.code}>
                  {muni.name}
                </option>
              ))}
            </select>
            {errors.city && (
              <div className="invalid-feedback">{errors.city}</div>
            )}
          </div>
        </div>
      </div>

      {/* City field (readonly - populated automatically) */}
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
              placeholder="Se completa automáticamente al seleccionar municipio"
              value={data.city || ""}
              readOnly
              style={{ backgroundColor: '#f8f9fa' }}
            />
            {errors.city && (
              <div className="invalid-feedback">{errors.city}</div>
            )}
            <div className="form-text">
              Este campo se completa automáticamente al seleccionar el municipio
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="state">
              Estado/Departamento <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.state ? "is-invalid" : ""}`}
              id="state"
              placeholder="Se completa automáticamente al seleccionar departamento"
              value={data.state || ""}
              readOnly
              style={{ backgroundColor: '#f8f9fa' }}
            />
            {errors.state && (
              <div className="invalid-feedback">{errors.state}</div>
            )}
            <div className="form-text">
              Este campo se completa automáticamente al seleccionar el departamento
            </div>
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
