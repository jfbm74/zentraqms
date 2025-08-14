/**
 * Step 5: Branch Offices Management Component (Professional Velzon Style)
 *
 * Handles adding multiple branch offices/locations for the organization
 */
import React, { useState } from "react";
import { toast } from "react-toastify";

// Types
interface BranchOffice {
  id?: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  codigo_postal?: string;
  telefono?: string;
  email?: string;
  tipo_sede: string;
  responsable_nombre?: string;
  responsable_cargo?: string;
  responsable_telefono?: string;
  responsable_email?: string;
  observaciones?: string;
}

interface Step5Props {
  organizationId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const Step5BranchOffices: React.FC<Step5Props> = ({
  organizationId,
  onComplete,
  onSkip,
}) => {
  const [branchOffices, setBranchOffices] = useState<BranchOffice[]>([]);
  const [currentBranch, setCurrentBranch] = useState<BranchOffice>({
    nombre: "",
    direccion: "",
    ciudad: "",
    departamento: "",
    pais: "Colombia",
    codigo_postal: "",
    telefono: "",
    email: "",
    tipo_sede: "sucursal",
    responsable_nombre: "",
    responsable_cargo: "",
    responsable_telefono: "",
    responsable_email: "",
    observaciones: "",
  });
  const [errors, setErrors] = useState<Partial<BranchOffice>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Branch office types
  const branchTypes = [
    { value: "sucursal", label: "Sucursal" },
    { value: "oficina", label: "Oficina" },
    { value: "centro_distribucion", label: "Centro de Distribución" },
    { value: "almacen", label: "Almacén" },
    { value: "planta", label: "Planta de Producción" },
    { value: "laboratorio", label: "Laboratorio" },
    { value: "centro_servicio", label: "Centro de Servicio" },
    { value: "punto_venta", label: "Punto de Venta" },
    { value: "representacion", label: "Oficina de Representación" },
    { value: "otra", label: "Otra" },
  ];

  // Colombian departments
  const departments = [
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

  // Validate branch office
  const validateBranch = (branch: BranchOffice): boolean => {
    const newErrors: Partial<BranchOffice> = {};

    if (!branch.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    if (!branch.direccion.trim())
      newErrors.direccion = "La dirección es requerida";
    if (!branch.ciudad.trim()) newErrors.ciudad = "La ciudad es requerida";
    if (!branch.departamento.trim())
      newErrors.departamento = "El departamento es requerido";
    if (!branch.pais.trim()) newErrors.pais = "El país es requerido";

    // Phone validation (if provided)
    if (branch.telefono && !/^[+]?[0-9\s\-()]{10,}$/.test(branch.telefono)) {
      newErrors.telefono = "Formato de teléfono inválido";
    }

    // Email validation (if provided)
    if (branch.email && !/\S+@\S+\.\S+/.test(branch.email)) {
      newErrors.email = "Email inválido";
    }

    // Postal code validation (if provided)
    if (branch.codigo_postal && !/^[0-9]+$/.test(branch.codigo_postal)) {
      newErrors.codigo_postal = "El código postal debe contener solo números";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (field: keyof BranchOffice, value: string) => {
    let processedValue = value;

    // Phone field: allow only numbers, spaces, +, -, ()
    if (field === "telefono" || field === "responsable_telefono") {
      processedValue = value.replace(/[^+0-9\s\-()]/g, "");
    }

    // Postal code field: allow only numbers
    if (field === "codigo_postal") {
      processedValue = value.replace(/[^0-9]/g, "");
    }

    setCurrentBranch((prev) => ({ ...prev, [field]: processedValue }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Add branch to list
  const addBranchToList = () => {
    if (validateBranch(currentBranch)) {
      setBranchOffices((prev) => [
        ...prev,
        { ...currentBranch, id: Date.now().toString() },
      ]);
      setCurrentBranch({
        nombre: "",
        direccion: "",
        ciudad: "",
        departamento: "",
        pais: "Colombia",
        codigo_postal: "",
        telefono: "",
        email: "",
        tipo_sede: "sucursal",
        responsable_nombre: "",
        responsable_cargo: "",
        responsable_telefono: "",
        responsable_email: "",
        observaciones: "",
      });
      setIsAdding(false);
      toast.success("Sucursal agregada a la lista");
    }
  };

  // Remove branch from list
  const removeBranch = (id: string) => {
    setBranchOffices((prev) => prev.filter((branch) => branch.id !== id));
    toast.info("Sucursal eliminada de la lista");
  };

  // Save all branches
  const saveAllBranches = async () => {
    if (branchOffices.length === 0) {
      toast.warning("No hay sucursales para guardar");
      return;
    }

    setIsSaving(true);

    try {
      // Import apiClient here to avoid circular dependencies
      const { apiClient } = await import("../../../api/endpoints");

      const promises = branchOffices.map((branch) => {
        const payload = {
          ...branch,
          organization: organizationId,
          es_principal: false,
          is_active: true,
        };
        delete payload.id; // Remove temporary ID

        return apiClient.post("/api/v1/locations/", payload);
      });

      await Promise.all(promises);

      toast.success(
        `${branchOffices.length} sucursal(es) guardada(s) exitosamente`,
      );
      onComplete();
    } catch (error: any) {
      console.error("[Step5BranchOffices] Error saving branches:", error);
      toast.error("Error al guardar las sucursales. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h5 className="mb-1">Sucursales y Ubicaciones</h5>
        <p className="text-muted">
          Agregue las sucursales, oficinas o ubicaciones adicionales de su
          organización
        </p>
      </div>

      {/* Branch Offices List */}
      {branchOffices.length > 0 && (
        <div className="mb-4">
          <h6 className="mb-3">
            Sucursales Agregadas ({branchOffices.length})
          </h6>
          <div className="table-responsive">
            <table className="table table-bordered table-sm">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Ciudad</th>
                  <th>Departamento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {branchOffices.map((branch) => (
                  <tr key={branch.id}>
                    <td className="fw-medium">{branch.nombre}</td>
                    <td>
                      <span className="badge bg-secondary">
                        {
                          branchTypes.find((t) => t.value === branch.tipo_sede)
                            ?.label
                        }
                      </span>
                    </td>
                    <td>{branch.ciudad}</td>
                    <td>{branch.departamento}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeBranch(branch.id!)}
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Branch Form */}
      {isAdding ? (
        <div className="card border-2 border-primary">
          <div className="card-header bg-primary bg-soft">
            <h6 className="mb-0 text-primary">
              <i className="ri-add-line me-2"></i>
              Nueva Sucursal
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    Nombre de la Sucursal <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
                    value={currentBranch.nombre}
                    onChange={(e) =>
                      handleInputChange("nombre", e.target.value)
                    }
                    placeholder="Ej: Sucursal Norte, Oficina Bogotá"
                  />
                  {errors.nombre && (
                    <div className="invalid-feedback">{errors.nombre}</div>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    Tipo de Sede <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.tipo_sede ? "is-invalid" : ""}`}
                    value={currentBranch.tipo_sede}
                    onChange={(e) =>
                      handleInputChange("tipo_sede", e.target.value)
                    }
                  >
                    {branchTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.tipo_sede && (
                    <div className="invalid-feedback">{errors.tipo_sede}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label">
                    Dirección <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.direccion ? "is-invalid" : ""}`}
                    value={currentBranch.direccion}
                    onChange={(e) =>
                      handleInputChange("direccion", e.target.value)
                    }
                    placeholder="Dirección completa"
                  />
                  {errors.direccion && (
                    <div className="invalid-feedback">{errors.direccion}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">
                    Ciudad <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.ciudad ? "is-invalid" : ""}`}
                    value={currentBranch.ciudad}
                    onChange={(e) =>
                      handleInputChange("ciudad", e.target.value)
                    }
                    placeholder="Ciudad"
                  />
                  {errors.ciudad && (
                    <div className="invalid-feedback">{errors.ciudad}</div>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">
                    Departamento <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.departamento ? "is-invalid" : ""}`}
                    value={currentBranch.departamento}
                    onChange={(e) =>
                      handleInputChange("departamento", e.target.value)
                    }
                  >
                    <option value="">Seleccione departamento</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  {errors.departamento && (
                    <div className="invalid-feedback">
                      {errors.departamento}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Código Postal</label>
                  <input
                    type="text"
                    className={`form-control ${errors.codigo_postal ? "is-invalid" : ""}`}
                    value={currentBranch.codigo_postal}
                    onChange={(e) =>
                      handleInputChange("codigo_postal", e.target.value)
                    }
                    placeholder="Código postal"
                    maxLength={10}
                  />
                  {errors.codigo_postal && (
                    <div className="invalid-feedback">
                      {errors.codigo_postal}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className={`form-control ${errors.telefono ? "is-invalid" : ""}`}
                    value={currentBranch.telefono}
                    onChange={(e) =>
                      handleInputChange("telefono", e.target.value)
                    }
                    placeholder="Teléfono de contacto"
                    maxLength={15}
                  />
                  {errors.telefono && (
                    <div className="invalid-feedback">{errors.telefono}</div>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    value={currentBranch.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="email@sucursal.com"
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-success"
                onClick={addBranchToList}
              >
                <i className="ri-add-line me-1"></i>
                Agregar a la Lista
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setIsAdding(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center mb-4">
          <button
            type="button"
            className="btn btn-outline-primary btn-label"
            onClick={() => setIsAdding(true)}
          >
            <i className="ri-add-line label-icon align-middle fs-16 me-2"></i>
            Agregar Nueva Sucursal
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="d-flex align-items-start gap-3 mt-4">
        <button
          type="button"
          className="btn btn-light btn-label"
          onClick={onSkip}
        >
          <i className="ri-skip-forward-line label-icon align-middle fs-16 me-2"></i>
          Omitir por Ahora
        </button>

        {branchOffices.length > 0 && (
          <button
            type="button"
            className="btn btn-success btn-label ms-auto"
            onClick={saveAllBranches}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                >
                  <span className="visually-hidden">Guardando...</span>
                </div>
                Guardando Sucursales...
              </>
            ) : (
              <>
                <i className="ri-save-line label-icon align-middle fs-16 ms-2"></i>
                Guardar {branchOffices.length} Sucursal(es)
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Step5BranchOffices;
