/**
 * Professional Organization Wizard for ZentraQMS
 *
 * Based on Velzon's Arrow Nav Steps wizard design for a modern, intuitive user experience.
 * This wizard guides users through the initial organization setup process.
 */

import React, { useState } from "react";
import classnames from "classnames";
import { toast } from "react-toastify";
import { useNavigate } from "../../../utils/SimpleRouter";

// No longer using Velzon logos

// Import step components
import Step1OrganizationData from "../../../components/wizard/steps/Step1OrganizationData";
import Step2LocationData from "../../../components/wizard/steps/Step2LocationData";
import Step3SectorTemplate from "../../../components/wizard/steps/Step3SectorTemplate";
import Step5BranchOffices from "../../../components/wizard/steps/Step5BranchOffices";

// APIs
import { apiClient } from "../../../api/endpoints";

interface OrganizationData {
  // Step 1: Organization Info
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  nit?: string;
  digito_verificacion?: string;

  // Step 2: Location Info
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;

  // Step 3: Sector Template
  sector_template: string;
  industry: string;
  organization_size: string;

  // Additional data
  organizationId?: string;
}

const OrganizationWizard: React.FC = () => {
  // Wizard navigation state
  const [activeTab, setActiveTab] = useState(1);
  const [passedSteps, setPassedSteps] = useState([1]);
  const [isLoading, setIsLoading] = useState(false);

  // Navigation
  const navigate = useNavigate();

  // Form data state
  const [formData, setFormData] = useState<OrganizationData>({
    // Step 1
    name: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    nit: "",
    digito_verificacion: "",

    // Step 2
    address: "",
    city: "",
    state: "",
    country: "Colombia",
    postal_code: "",

    // Step 3
    sector_template: "tecnologia",
    industry: "software",
    organization_size: "medium",
  });

  // Form validation state
  const [errors, setErrors] = useState<Partial<OrganizationData>>({});

  /**
   * Navigate between wizard steps
   */
  const toggleTab = (tab: number) => {
    if (activeTab !== tab) {
      // Add the new tab to passed steps if moving forward
      if (tab > activeTab) {
        const modifiedSteps = [...passedSteps, tab];
        setPassedSteps(modifiedSteps);
      }

      // Allow navigation to steps 1-5
      if (tab >= 1 && tab <= 5) {
        setActiveTab(tab);
      }
    }
  };

  /**
   * Update form data
   */
  const updateFormData = (stepData: Partial<OrganizationData>) => {
    // Apply field-specific formatting/validation
    const processedData = { ...stepData };

    // Phone field: allow only numbers, spaces, +, -, ()
    if (processedData.phone !== undefined) {
      processedData.phone = processedData.phone.replace(/[^+0-9\s\-()]/g, "");
    }

    // Postal code field: allow only numbers
    if (processedData.postal_code !== undefined) {
      processedData.postal_code = processedData.postal_code.replace(
        /[^0-9]/g,
        "",
      );
    }

    setFormData((prev) => ({ ...prev, ...processedData }));

    // Clear errors for updated fields
    const updatedFields = Object.keys(processedData);
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedFields.forEach((field) => {
        delete newErrors[field as keyof OrganizationData];
      });
      return newErrors;
    });
  };

  /**
   * Validate current step
   */
  const validateStep = (step: number): boolean => {
    const newErrors: Partial<OrganizationData> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim())
          newErrors.name = "El nombre de la organización es requerido";
        if (!formData.email.trim()) newErrors.email = "El email es requerido";
        else if (!/\S+@\S+\.\S+/.test(formData.email))
          newErrors.email = "Email inválido";
        if (!formData.phone.trim()) {
          newErrors.phone = "El teléfono es requerido";
        } else if (!/^[+]?[0-9\s\-()]{10,}$/.test(formData.phone)) {
          newErrors.phone =
            "El teléfono debe contener solo números, espacios, guiones y paréntesis";
        }
        if (!formData.nit || formData.nit.length < 8) {
          newErrors.nit = "El NIT es requerido y debe tener al menos 8 dígitos";
        }
        if (!formData.digito_verificacion) {
          newErrors.digito_verificacion =
            "El dígito de verificación es requerido";
        }
        break;

      case 2:
        if (!formData.address.trim())
          newErrors.address = "La dirección es requerida";
        if (!formData.city.trim()) newErrors.city = "La ciudad es requerida";
        if (!formData.state.trim())
          newErrors.state = "El departamento/estado es requerido";
        if (!formData.country.trim())
          newErrors.country = "El país es requerido";
        if (formData.postal_code && !/^[0-9]+$/.test(formData.postal_code)) {
          newErrors.postal_code = "El código postal debe contener solo números";
        }
        break;

      case 3:
        if (!formData.sector_template)
          newErrors.sector_template = "Debe seleccionar un sector";
        if (!formData.industry.trim())
          newErrors.industry = "La industria es requerida";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle next step
   */
  const handleNext = () => {
    if (validateStep(activeTab)) {
      if (activeTab < 3) {
        toggleTab(activeTab + 1);
      } else {
        handleSubmit();
      }
    } else {
      toast.error("Por favor corrige los errores antes de continuar");
    }
  };

  /**
   * Handle previous step
   */
  const handlePrevious = () => {
    if (activeTab > 1) {
      toggleTab(activeTab - 1);
    }
  };

  /**
   * Submit the complete organization data
   */
  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setIsLoading(true);

    try {
      // Map frontend form data to backend expected format
      const organizationPayload = {
        razon_social: formData.name,
        nombre_comercial: formData.name,
        nit: formData.nit || "", // Use real NIT from form
        digito_verificacion: formData.digito_verificacion || "", // Use real verification digit
        tipo_organizacion: "empresa_privada", // Fixed: use valid choice
        sector_economico: formData.sector_template || "tecnologia",
        tamaño_empresa:
          formData.organization_size === "medium" ? "mediana" : "pequeña", // Fixed: map to valid choices
        telefono_principal: formData.phone.substring(0, 15), // Fixed: limit to 15 characters
        email_contacto: formData.email,
      };

      console.log(
        "[OrganizationWizard] Submitting organization data:",
        organizationPayload,
      );

      const response = await apiClient.post(
        "/api/v1/organizations/wizard/step1/",
        organizationPayload,
      );

      console.log(
        "[OrganizationWizard] Organization created successfully:",
        response.data,
      );

      toast.success("¡Organización configurada exitosamente!", {
        autoClose: 2000,
      });

      // Navigate to success state
      toggleTab(4); // Show success screen

      // Store organization data for potential branch office creation
      const createdOrganization = response.data.organization;
      setFormData((prev) => ({
        ...prev,
        organizationId: createdOrganization.id,
      }));
    } catch (error: any) {
      console.error("[OrganizationWizard] Error creating organization:", error);
      console.error(
        "[OrganizationWizard] Error response data:",
        error.response?.data,
      );

      // Better error handling to see what the backend is returning
      let errorMessage = "Error al crear la organización. Inténtalo de nuevo.";

      if (error.response?.data) {
        const errorData = error.response.data;

        if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.errors) {
          // If there are validation errors, show them
          if (typeof errorData.errors === "object") {
            const errorList = Object.entries(errorData.errors)
              .map(([field, msgs]) => {
                const messages = Array.isArray(msgs) ? msgs : [msgs];
                return `${field}: ${messages.join(", ")}`;
              })
              .join("\n");
            errorMessage = `Errores de validación:\n${errorList}`;
          } else {
            errorMessage = errorData.errors;
          }
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle branch office completion
   */
  const handleBranchOfficeComplete = () => {
    toast.success("¡Configuración completada exitosamente!");
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  /**
   * Handle skipping branch offices
   */
  const handleSkipBranchOffices = () => {
    toast.info("Puede agregar sucursales más tarde desde Configuración");
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  // Set page title
  document.title = "Configuración Inicial | ZentraQMS";

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-xl-8 col-lg-10">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-primary border-0">
                <div className="text-center pt-3 pb-3">
                  <h4 className="mb-1 fw-semibold text-white">
                    Configuración Inicial
                  </h4>
                  <p className="text-white-50 mb-0">
                    Configure su organización en ZentraQMS
                  </p>
                </div>
              </div>

              <div className="card-body p-4">
                <form className="form-steps">
                  {/* Arrow Navigation Steps */}
                  <div className="step-arrow-nav mb-4">
                    <nav
                      className="nav nav-pills custom-nav nav-justified"
                      role="tablist"
                    >
                      <a
                        href="#"
                        className={classnames("nav-link", {
                          active: activeTab === 1,
                          done: passedSteps.includes(1) && activeTab !== 1,
                        })}
                        onClick={(e) => {
                          e.preventDefault();
                          if (passedSteps.includes(1)) toggleTab(1);
                        }}
                      >
                        <span className="step-title">
                          <i className="ri-building-line step-icon me-2"></i>
                          Organización
                        </span>
                      </a>

                      <a
                        href="#"
                        className={classnames("nav-link", {
                          active: activeTab === 2,
                          done: passedSteps.includes(2) && activeTab !== 2,
                        })}
                        onClick={(e) => {
                          e.preventDefault();
                          if (passedSteps.includes(2)) toggleTab(2);
                        }}
                      >
                        <span className="step-title">
                          <i className="ri-map-pin-line step-icon me-2"></i>
                          Ubicación
                        </span>
                      </a>

                      <a
                        href="#"
                        className={classnames("nav-link", {
                          active: activeTab === 3,
                          done: passedSteps.includes(3) && activeTab !== 3,
                        })}
                        onClick={(e) => {
                          e.preventDefault();
                          if (passedSteps.includes(3)) toggleTab(3);
                        }}
                      >
                        <span className="step-title">
                          <i className="ri-settings-3-line step-icon me-2"></i>
                          Configuración
                        </span>
                      </a>
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="tab-content">
                    {/* Step 1: Organization Data */}
                    {activeTab === 1 && (
                      <div className="tab-pane active">
                        <Step1OrganizationData
                          data={formData}
                          errors={errors}
                          onChange={updateFormData}
                        />

                        <div className="d-flex align-items-start gap-3 mt-4">
                          <button
                            type="button"
                            className="btn btn-success btn-label right ms-auto"
                            onClick={handleNext}
                          >
                            <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                            Siguiente: Ubicación
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Location Data */}
                    {activeTab === 2 && (
                      <div className="tab-pane active">
                        <Step2LocationData
                          data={formData}
                          errors={errors}
                          onChange={updateFormData}
                        />

                        <div className="d-flex align-items-start gap-3 mt-4">
                          <button
                            type="button"
                            className="btn btn-light btn-label"
                            onClick={handlePrevious}
                          >
                            <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>
                            Anterior
                          </button>
                          <button
                            type="button"
                            className="btn btn-success btn-label right ms-auto"
                            onClick={handleNext}
                          >
                            <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                            Siguiente: Configuración
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Sector Template */}
                    {activeTab === 3 && (
                      <div className="tab-pane active">
                        <Step3SectorTemplate
                          data={formData}
                          errors={errors}
                          onChange={updateFormData}
                          currentData={formData}
                        />

                        <div className="d-flex align-items-start gap-3 mt-4">
                          <button
                            type="button"
                            className="btn btn-light btn-label"
                            onClick={handlePrevious}
                          >
                            <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>
                            Anterior
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-label right ms-auto"
                            onClick={handleNext}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <div
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                >
                                  <span className="visually-hidden">
                                    Loading...
                                  </span>
                                </div>
                                Configurando...
                              </>
                            ) : (
                              <>
                                <i className="ri-check-line label-icon align-middle fs-16 ms-2"></i>
                                Completar Configuración
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Success Screen with Branch Office Option */}
                    {activeTab === 4 && (
                      <div className="tab-pane active">
                        <div className="text-center py-5">
                          <div className="avatar-md mt-5 mb-4 mx-auto">
                            <div className="avatar-title bg-light text-success display-4 rounded-circle">
                              <i className="ri-checkbox-circle-fill"></i>
                            </div>
                          </div>
                          <h5 className="text-success">
                            ¡Configuración Completada!
                          </h5>
                          <p className="text-muted mb-4">
                            Su organización ha sido configurada exitosamente en
                            ZentraQMS.
                            <br />
                            Su sede principal ya está registrada.
                          </p>

                          {/* Branch Office Options */}
                          <div
                            className="card border-0 bg-light mx-auto"
                            style={{ maxWidth: "500px" }}
                          >
                            <div className="card-body p-4">
                              <h6 className="mb-3">
                                <i className="ri-building-2-line me-2 text-primary"></i>
                                ¿Desea agregar sucursales adicionales?
                              </h6>
                              <p className="text-muted small mb-4">
                                Puede agregar otras sedes, oficinas o sucursales
                                de su organización ahora o más tarde desde el
                                panel de administración.
                              </p>

                              <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                                <button
                                  type="button"
                                  className="btn btn-primary btn-label"
                                  onClick={() => toggleTab(5)} // Go to branch office step
                                >
                                  <i className="ri-add-line label-icon align-middle fs-16 me-2"></i>
                                  Sí, agregar sucursales
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-label"
                                  onClick={() => {
                                    toast.success(
                                      "Redirigiendo al dashboard...",
                                    );
                                    setTimeout(
                                      () => navigate("/dashboard"),
                                      1500,
                                    );
                                  }}
                                >
                                  <i className="ri-dashboard-line label-icon align-middle fs-16 me-2"></i>
                                  Ir al Dashboard
                                </button>
                              </div>

                              <div className="mt-3">
                                <small className="text-muted">
                                  Puede agregar sucursales más tarde desde
                                  Configuración → Ubicaciones
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Branch Offices */}
                    {activeTab === 5 && (
                      <div className="tab-pane active">
                        <Step5BranchOffices
                          organizationId={formData.organizationId || ""}
                          onComplete={handleBranchOfficeComplete}
                          onSkip={handleSkipBranchOffices}
                        />
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationWizard;
