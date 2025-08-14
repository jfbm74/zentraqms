/**
 * Step 3: Sector Configuration Component (Professional Velzon Style)
 *
 * Handles sector configuration and template selection with professional UI
 */
import React from "react";
import TemplateSelector from "../../forms/TemplateSelector";

// Types
interface SectorData {
  sector_template: string;
  industry: string;
  organization_size: string;
}

interface Step3Props {
  data: Partial<SectorData>;
  errors: Partial<SectorData>;
  onChange: (data: Partial<SectorData>) => void;
  currentData?: Record<string, unknown>; // Full organization data for template application
}

const Step3SectorTemplate: React.FC<Step3Props> = ({
  data,
  errors,
  onChange,
  currentData,
}) => {
  // Sector template options
  const sectorTemplateOptions = [
    { value: "tecnologia", label: "Tecnología e Innovación" },
    { value: "manufactura", label: "Manufactura y Producción" },
    { value: "servicios", label: "Servicios Profesionales" },
    { value: "salud", label: "Salud y Medicina" },
    { value: "educacion", label: "Educación y Formación" },
    { value: "construccion", label: "Construcción e Ingeniería" },
    { value: "comercio", label: "Comercio y Retail" },
    { value: "financiero", label: "Servicios Financieros" },
    { value: "turismo", label: "Turismo y Hospitalidad" },
    { value: "transporte", label: "Transporte y Logística" },
    { value: "energia", label: "Energía y Utilities" },
    { value: "alimentos", label: "Alimentos y Bebidas" },
    { value: "agricultura", label: "Agricultura y Ganadería" },
    { value: "mineria", label: "Minería y Extractivos" },
    { value: "telecomunicaciones", label: "Telecomunicaciones" },
    { value: "gobierno", label: "Gobierno y Sector Público" },
    { value: "ong", label: "ONGs y Sin Ánimo de Lucro" },
    { value: "otro", label: "Otro Sector" },
  ];

  // Industry options
  const industryOptions = [
    { value: "software", label: "Desarrollo de Software" },
    { value: "consultoria", label: "Consultoría" },
    { value: "manufactura_textil", label: "Manufactura Textil" },
    { value: "manufactura_metalmecanica", label: "Metalmecánica" },
    { value: "manufactura_quimica", label: "Química y Farmacéutica" },
    { value: "manufactura_alimentos", label: "Procesamiento de Alimentos" },
    { value: "servicios_legales", label: "Servicios Legales" },
    { value: "servicios_contables", label: "Servicios Contables" },
    { value: "servicios_marketing", label: "Marketing y Publicidad" },
    { value: "salud_hospitalaria", label: "Servicios Hospitalarios" },
    { value: "salud_clinica", label: "Clínicas y Consultorios" },
    { value: "salud_farmaceutica", label: "Farmacéutica" },
    { value: "educacion_superior", label: "Educación Superior" },
    { value: "educacion_basica", label: "Educación Básica" },
    { value: "educacion_tecnica", label: "Educación Técnica" },
    { value: "construccion_civil", label: "Construcción Civil" },
    { value: "construccion_industrial", label: "Construcción Industrial" },
    { value: "comercio_retail", label: "Retail y Comercio" },
    { value: "comercio_mayorista", label: "Comercio Mayorista" },
    { value: "ecommerce", label: "Comercio Electrónico" },
    { value: "otro", label: "Otra Industria" },
  ];

  // Organization size options
  const organizationSizeOptions = [
    { value: "micro", label: "Microempresa (1-10 empleados)" },
    { value: "small", label: "Pequeña empresa (11-50 empleados)" },
    { value: "medium", label: "Mediana empresa (51-200 empleados)" },
    { value: "large", label: "Grande empresa (201-1000 empleados)" },
    { value: "enterprise", label: "Corporación (1000+ empleados)" },
  ];

  // Handle input change
  const handleInputChange = (field: keyof SectorData, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <div>
      <div className="mb-4">
        <h5 className="mb-1">Configuración del Sector</h5>
        <p className="text-muted">
          Configure el sector y tamaño de su organización para personalizar la
          experiencia
        </p>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="sector-template">
              Sector de la Organización <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.sector_template ? "is-invalid" : ""}`}
              id="sector-template"
              value={data.sector_template || ""}
              onChange={(e) =>
                handleInputChange("sector_template", e.target.value)
              }
            >
              <option value="">Seleccione el sector</option>
              {sectorTemplateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.sector_template && (
              <div className="invalid-feedback">{errors.sector_template}</div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="industry">
              Industria Específica <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.industry ? "is-invalid" : ""}`}
              id="industry"
              value={data.industry || ""}
              onChange={(e) => handleInputChange("industry", e.target.value)}
            >
              <option value="">Seleccione la industria</option>
              {industryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.industry && (
              <div className="invalid-feedback">{errors.industry}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="organization-size">
              Tamaño de la Organización
            </label>
            <select
              className={`form-select ${errors.organization_size ? "is-invalid" : ""}`}
              id="organization-size"
              value={data.organization_size || ""}
              onChange={(e) =>
                handleInputChange("organization_size", e.target.value)
              }
            >
              <option value="">Seleccione el tamaño</option>
              {organizationSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.organization_size && (
              <div className="invalid-feedback">{errors.organization_size}</div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="alert alert-info d-flex align-items-start">
        <i className="ri-information-line me-2 mt-1"></i>
        <div>
          <strong>Configuración Inteligente:</strong> Basándose en su sector e
          industria, ZentraQMS configurará automáticamente las mejores prácticas
          y plantillas específicas para su tipo de organización. Esto incluye
          procesos, indicadores y documentos relevantes para su sector.
        </div>
      </div>

      {/* Template Selector */}
      {data.sector_template && (
        <div className="mt-4">
          <div className="card border-2 border-primary">
            <div className="card-header bg-primary bg-soft">
              <h6 className="mb-0 text-primary">
                <i className="ri-file-list-3-line me-2"></i>
                Plantillas Predefinidas
              </h6>
            </div>
            <div className="card-body">
              <p className="text-muted mb-3">
                Acelere la configuración aplicando una plantilla predefinida con
                procesos, indicadores y documentos específicos para su sector.
              </p>

              <TemplateSelector
                sector={data.sector_template}
                currentData={currentData}
                onTemplateSelect={(template) => {
                  console.log("[Step3] Template selected:", template);
                }}
                onTemplateApply={(template) => {
                  console.log("[Step3] Template applied:", template);
                  // Could trigger a refresh or update of organization data
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3SectorTemplate;
