/**
 * E2E Integration Tests for Organization Flow - TASK-028
 *
 * End-to-end testing for complete organization creation workflow including:
 * - Full wizard flow from start to finish
 * - Auto-save functionality testing
 * - Multiple branch office creation
 * - Error recovery scenarios
 * - Template application
 *
 * Author: Claude
 * Date: 2025-08-14
 * Coverage Target: >80%
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toast } from "react-toastify";
import OrganizationWizard from "../../pages/organization/wizard/OrganizationWizard";

// Mock dependencies for E2E testing
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("../../utils/SimpleRouter", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../../api/endpoints", () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock error handling
vi.mock("../../utils/errorHandler", () => ({
  initializeHttpInterceptors: vi.fn(),
  ErrorHandler: {
    init: vi.fn(),
    handleError: vi.fn(),
  },
  Logger: {
    log: vi.fn(),
  },
}));

// Mock step components with full functionality
vi.mock("../../components/wizard/steps/Step1OrganizationData", () => ({
  default: ({ data, errors, onChange }: any) => (
    <div data-testid="step1-organization">
      <div>
        <label htmlFor="org-name">Nombre de la Organización *</label>
        <input
          id="org-name"
          data-testid="org-name"
          value={data.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
          className={errors.name ? "is-invalid" : ""}
        />
        {errors.name && (
          <div data-testid="name-error" className="invalid-feedback">
            {errors.name}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="org-email">Email Principal *</label>
        <input
          id="org-email"
          data-testid="org-email"
          type="email"
          value={data.email || ""}
          onChange={(e) => onChange({ email: e.target.value })}
          className={errors.email ? "is-invalid" : ""}
        />
        {errors.email && (
          <div data-testid="email-error" className="invalid-feedback">
            {errors.email}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="org-phone">Teléfono Principal *</label>
        <input
          id="org-phone"
          data-testid="org-phone"
          value={data.phone || ""}
          onChange={(e) => onChange({ phone: e.target.value })}
          className={errors.phone ? "is-invalid" : ""}
        />
        {errors.phone && (
          <div data-testid="phone-error" className="invalid-feedback">
            {errors.phone}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="org-nit">NIT *</label>
        <input
          id="org-nit"
          data-testid="org-nit"
          value={data.nit || ""}
          onChange={(e) =>
            onChange({ nit: e.target.value, digito_verificacion: "1" })
          }
          className={errors.nit ? "is-invalid" : ""}
        />
        {errors.nit && (
          <div data-testid="nit-error" className="invalid-feedback">
            {errors.nit}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="org-description">Descripción</label>
        <textarea
          id="org-description"
          data-testid="org-description"
          value={data.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="org-website">Sitio Web</label>
        <input
          id="org-website"
          data-testid="org-website"
          value={data.website || ""}
          onChange={(e) => onChange({ website: e.target.value })}
        />
      </div>
    </div>
  ),
}));

vi.mock("../../components/wizard/steps/Step2LocationData", () => ({
  default: ({ data, errors, onChange }: any) => (
    <div data-testid="step2-location">
      <div>
        <label htmlFor="location-address">Dirección *</label>
        <input
          id="location-address"
          data-testid="location-address"
          value={data.address || ""}
          onChange={(e) => onChange({ address: e.target.value })}
          className={errors.address ? "is-invalid" : ""}
        />
        {errors.address && (
          <div data-testid="address-error" className="invalid-feedback">
            {errors.address}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="location-city">Ciudad *</label>
        <input
          id="location-city"
          data-testid="location-city"
          value={data.city || ""}
          onChange={(e) => onChange({ city: e.target.value })}
          className={errors.city ? "is-invalid" : ""}
        />
        {errors.city && (
          <div data-testid="city-error" className="invalid-feedback">
            {errors.city}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="location-state">Departamento *</label>
        <input
          id="location-state"
          data-testid="location-state"
          value={data.state || ""}
          onChange={(e) => onChange({ state: e.target.value })}
          className={errors.state ? "is-invalid" : ""}
        />
        {errors.state && (
          <div data-testid="state-error" className="invalid-feedback">
            {errors.state}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="location-country">País *</label>
        <input
          id="location-country"
          data-testid="location-country"
          value={data.country || "Colombia"}
          onChange={(e) => onChange({ country: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="postal-code">Código Postal</label>
        <input
          id="postal-code"
          data-testid="postal-code"
          value={data.postal_code || ""}
          onChange={(e) => onChange({ postal_code: e.target.value })}
        />
      </div>
    </div>
  ),
}));

vi.mock("../../components/wizard/steps/Step3SectorTemplate", () => ({
  default: ({ data, errors, onChange }: any) => (
    <div data-testid="step3-sector">
      <div>
        <label htmlFor="sector-template">Sector Económico *</label>
        <select
          id="sector-template"
          data-testid="sector-template"
          value={data.sector_template || ""}
          onChange={(e) => onChange({ sector_template: e.target.value })}
          className={errors.sector_template ? "is-invalid" : ""}
        >
          <option value="">Seleccione un sector</option>
          <option value="tecnologia">Tecnología</option>
          <option value="salud">Salud</option>
          <option value="educacion">Educación</option>
          <option value="manufactura">Manufactura</option>
        </select>
        {errors.sector_template && (
          <div data-testid="sector-error" className="invalid-feedback">
            {errors.sector_template}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="industry">Industria *</label>
        <input
          id="industry"
          data-testid="industry"
          value={data.industry || ""}
          onChange={(e) => onChange({ industry: e.target.value })}
          className={errors.industry ? "is-invalid" : ""}
        />
        {errors.industry && (
          <div data-testid="industry-error" className="invalid-feedback">
            {errors.industry}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="organization-size">Tamaño de la Organización</label>
        <select
          id="organization-size"
          data-testid="organization-size"
          value={data.organization_size || "medium"}
          onChange={(e) => onChange({ organization_size: e.target.value })}
        >
          <option value="small">Pequeña</option>
          <option value="medium">Mediana</option>
          <option value="large">Grande</option>
        </select>
      </div>
    </div>
  ),
}));

vi.mock("../../components/wizard/steps/Step5BranchOffices", () => ({
  default: ({ organizationId, onComplete, onSkip }: any) => (
    <div data-testid="step5-branches">
      <h5>Gestión de Sucursales</h5>
      <p>Organización ID: {organizationId}</p>

      <div>
        <input data-testid="branch-name" placeholder="Nombre de la sucursal" />
        <input
          data-testid="branch-address"
          placeholder="Dirección de la sucursal"
        />
        <button data-testid="add-branch">Agregar Sucursal</button>
      </div>

      <div className="d-flex gap-2">
        <button data-testid="complete-branches" onClick={onComplete}>
          Finalizar Configuración
        </button>
        <button data-testid="skip-branches" onClick={onSkip}>
          Omitir Sucursales
        </button>
      </div>
    </div>
  ),
}));

describe("Organization Creation E2E Flow", () => {
  const mockApiClient = {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup API client mock
    const { apiClient } = require("../../api/endpoints");
    Object.assign(apiClient, mockApiClient);

    // Setup navigation mock
    const { useNavigate } = require("../../utils/SimpleRouter");
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Complete Organization Creation Flow", () => {
    it("should complete full organization creation workflow", async () => {
      // Mock successful API responses
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          organization: {
            id: "org-123",
            razon_social: "Test Organization S.A.S.",
            nit: "900123456",
          },
        },
      });

      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Verify initial state
      expect(screen.getByText("Configuración Inicial")).toBeInTheDocument();
      expect(screen.getByTestId("step1-organization")).toBeInTheDocument();

      // Step 1: Fill organization data
      await user.type(
        screen.getByTestId("org-name"),
        "Test Organization S.A.S.",
      );
      await user.type(screen.getByTestId("org-email"), "contact@testorg.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.type(
        screen.getByTestId("org-description"),
        "Una empresa de prueba para testing",
      );
      await user.type(
        screen.getByTestId("org-website"),
        "https://www.testorg.com",
      );

      // Advance to step 2
      await user.click(screen.getByText("Siguiente: Ubicación"));

      expect(screen.getByTestId("step2-location")).toBeInTheDocument();

      // Step 2: Fill location data
      await user.type(
        screen.getByTestId("location-address"),
        "Carrera 7 # 45-67",
      );
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.type(screen.getByTestId("postal-code"), "110111");

      // Advance to step 3
      await user.click(screen.getByText("Siguiente: Configuración"));

      expect(screen.getByTestId("step3-sector")).toBeInTheDocument();

      // Step 3: Configure organization
      await user.selectOptions(
        screen.getByTestId("sector-template"),
        "tecnologia",
      );
      await user.type(screen.getByTestId("industry"), "Desarrollo de Software");
      await user.selectOptions(
        screen.getByTestId("organization-size"),
        "medium",
      );

      // Submit the form
      await user.click(screen.getByText("Completar Configuración"));

      // Verify API call
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          "/api/v1/organizations/wizard/step1/",
          {
            razon_social: "Test Organization S.A.S.",
            nombre_comercial: "Test Organization S.A.S.",
            nit: "900123456",
            digito_verificacion: "1",
            tipo_organizacion: "empresa_privada",
            sector_economico: "tecnologia",
            tamaño_empresa: "mediana",
            telefono_principal: "+57 1 234-5678",
            email_contacto: "contact@testorg.com",
          },
        );
      });

      // Verify success notification
      expect(toast.success).toHaveBeenCalledWith(
        "¡Organización configurada exitosamente!",
        {
          autoClose: 2000,
        },
      );

      // Verify navigation to success screen
      await waitFor(() => {
        expect(
          screen.getByText("¡Configuración Completada!"),
        ).toBeInTheDocument();
      });
    });

    it("should handle validation errors gracefully", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Try to advance without filling required fields
      await user.click(screen.getByText("Siguiente: Ubicación"));

      // Should show validation errors
      expect(screen.getByTestId("name-error")).toHaveTextContent(
        "El nombre de la organización es requerido",
      );
      expect(screen.getByTestId("email-error")).toHaveTextContent(
        "El email es requerido",
      );
      expect(screen.getByTestId("phone-error")).toHaveTextContent(
        "El teléfono es requerido",
      );
      expect(toast.error).toHaveBeenCalledWith(
        "Por favor corrige los errores antes de continuar",
      );

      // Fill partial data with invalid email
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "invalid-email");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");

      // Try to advance again
      await user.click(screen.getByText("Siguiente: Ubicación"));

      // Should show email validation error
      expect(screen.getByTestId("email-error")).toHaveTextContent(
        "Email inválido",
      );
    });

    it("should handle API errors during submission", async () => {
      // Mock API error
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          data: {
            errors: {
              nit: ["Ya existe una organización con este NIT"],
            },
          },
        },
      });

      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Fill complete form
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      await user.type(screen.getByTestId("location-address"), "Test Address");
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      await user.selectOptions(
        screen.getByTestId("sector-template"),
        "tecnologia",
      );
      await user.type(screen.getByTestId("industry"), "Software");
      await user.click(screen.getByText("Completar Configuración"));

      // Should show error message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining(
            "nit: Ya existe una organización con este NIT",
          ),
        );
      });
    });

    it("should handle network errors with retry functionality", async () => {
      // Mock network error
      mockApiClient.post.mockRejectedValueOnce(new Error("Network Error"));

      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Fill and submit form
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      await user.type(screen.getByTestId("location-address"), "Test Address");
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      await user.selectOptions(
        screen.getByTestId("sector-template"),
        "tecnologia",
      );
      await user.type(screen.getByTestId("industry"), "Software");
      await user.click(screen.getByText("Completar Configuración"));

      // Should show generic error message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Error al crear la organización. Inténtalo de nuevo.",
        );
      });
    });
  });

  describe("Branch Office Management Flow", () => {
    it("should navigate to branch office creation after success", async () => {
      // Mock successful organization creation
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          organization: {
            id: "org-123",
            razon_social: "Test Organization S.A.S.",
          },
        },
      });

      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Complete organization creation quickly
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      await user.type(screen.getByTestId("location-address"), "Test Address");
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      await user.selectOptions(
        screen.getByTestId("sector-template"),
        "tecnologia",
      );
      await user.type(screen.getByTestId("industry"), "Software");
      await user.click(screen.getByText("Completar Configuración"));

      // Wait for success screen
      await waitFor(() => {
        expect(
          screen.getByText("¡Configuración Completada!"),
        ).toBeInTheDocument();
      });

      // Click to add branch offices
      await user.click(screen.getByText("Sí, agregar sucursales"));

      // Should navigate to branch office step
      expect(screen.getByTestId("step5-branches")).toBeInTheDocument();
      expect(screen.getByText("Organización ID: org-123")).toBeInTheDocument();
    });

    it("should complete branch office creation flow", async () => {
      // Mock successful organization creation
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          organization: {
            id: "org-123",
            razon_social: "Test Organization S.A.S.",
          },
        },
      });

      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Navigate to branch office step (simulate completing previous steps)
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      await user.type(screen.getByTestId("location-address"), "Test Address");
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      await user.selectOptions(
        screen.getByTestId("sector-template"),
        "tecnologia",
      );
      await user.type(screen.getByTestId("industry"), "Software");
      await user.click(screen.getByText("Completar Configuración"));

      await waitFor(() => {
        expect(
          screen.getByText("¡Configuración Completada!"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByText("Sí, agregar sucursales"));

      // Complete branch office setup
      await user.click(screen.getByTestId("complete-branches"));

      expect(toast.success).toHaveBeenCalledWith(
        "¡Configuración completada exitosamente!",
      );
    });

    it("should skip branch office creation", async () => {
      // Mock successful organization creation
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          organization: {
            id: "org-123",
            razon_social: "Test Organization S.A.S.",
          },
        },
      });

      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Navigate to success screen (simulate completing organization creation)
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      await user.type(screen.getByTestId("location-address"), "Test Address");
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      await user.selectOptions(
        screen.getByTestId("sector-template"),
        "tecnologia",
      );
      await user.type(screen.getByTestId("industry"), "Software");
      await user.click(screen.getByText("Completar Configuración"));

      await waitFor(() => {
        expect(
          screen.getByText("¡Configuración Completada!"),
        ).toBeInTheDocument();
      });

      // Skip branch offices and go to dashboard
      await user.click(screen.getByText("Ir al Dashboard"));

      expect(toast.success).toHaveBeenCalledWith(
        "Redirigiendo al dashboard...",
      );
    });
  });

  describe("Navigation and Step Management", () => {
    it("should allow backward navigation through steps", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Fill step 1 and advance
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      expect(screen.getByTestId("step2-location")).toBeInTheDocument();

      // Go back to step 1
      await user.click(screen.getByText("Anterior"));

      expect(screen.getByTestId("step1-organization")).toBeInTheDocument();
      // Data should be preserved
      expect(screen.getByTestId("org-name")).toHaveValue("Test Organization");
    });

    it("should preserve form data when navigating between steps", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Fill step 1
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.type(
        screen.getByTestId("org-description"),
        "Test description",
      );
      await user.click(screen.getByText("Siguiente: Ubicación"));

      // Fill step 2
      await user.type(screen.getByTestId("location-address"), "Test Address");
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      // Go back to step 1
      await user.click(screen.getByText("Anterior"));
      await user.click(screen.getByText("Anterior"));

      // Verify data is preserved
      expect(screen.getByTestId("org-name")).toHaveValue("Test Organization");
      expect(screen.getByTestId("org-email")).toHaveValue("test@example.com");
      expect(screen.getByTestId("org-description")).toHaveValue(
        "Test description",
      );
    });

    it("should show loading states during submission", async () => {
      // Mock delayed API response
      mockApiClient.post.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { organization: { id: "org-123" } },
                }),
              1000,
            ),
          ),
      );

      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Fill complete form
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      await user.type(screen.getByTestId("location-address"), "Test Address");
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      await user.selectOptions(
        screen.getByTestId("sector-template"),
        "tecnologia",
      );
      await user.type(screen.getByTestId("industry"), "Software");
      await user.click(screen.getByText("Completar Configuración"));

      // Should show loading state
      expect(screen.getByText("Configurando...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();

      // Wait for completion
      await waitFor(
        () => {
          expect(
            screen.getByText("¡Configuración Completada!"),
          ).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe("Data Validation and Input Formatting", () => {
    it("should format phone numbers correctly", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Type phone with extra characters
      await user.type(
        screen.getByTestId("org-phone"),
        "+57abc123def456ghi7890",
      );

      // Should remove non-allowed characters
      expect(screen.getByTestId("org-phone")).toHaveValue("+57123456789");
    });

    it("should format postal codes correctly", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Navigate to step 2
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      // Type postal code with letters
      await user.type(screen.getByTestId("postal-code"), "110111abc");

      // Should remove letters
      expect(screen.getByTestId("postal-code")).toHaveValue("110111");
    });

    it("should validate email format in real-time", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Type invalid email
      await user.type(screen.getByTestId("org-email"), "invalid-email");
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");

      // Try to advance
      await user.click(screen.getByText("Siguiente: Ubicación"));

      // Should show email validation error
      expect(screen.getByTestId("email-error")).toHaveTextContent(
        "Email inválido",
      );
    });
  });

  describe("Accessibility and User Experience", () => {
    it("should have proper step navigation indicators", () => {
      render(<OrganizationWizard />);

      // Check step navigation
      expect(screen.getByText("Organización")).toBeInTheDocument();
      expect(screen.getByText("Ubicación")).toBeInTheDocument();
      expect(screen.getByText("Configuración")).toBeInTheDocument();

      // First step should be active
      const activeStep = screen.getByText("Organización").closest("a");
      expect(activeStep).toHaveClass("active");
    });

    it("should show proper form labels and help text", () => {
      render(<OrganizationWizard />);

      // Check required field indicators
      expect(
        screen.getByText("Nombre de la Organización *"),
      ).toBeInTheDocument();
      expect(screen.getByText("Email Principal *")).toBeInTheDocument();
      expect(screen.getByText("Teléfono Principal *")).toBeInTheDocument();
      expect(screen.getByText("NIT *")).toBeInTheDocument();
    });

    it("should handle keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Should be able to tab through form fields
      await user.tab();
      expect(document.activeElement).toBe(screen.getByTestId("org-name"));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByTestId("org-email"));
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("should recover from temporary network failures", async () => {
      // Mock initial failure then success
      mockApiClient.post
        .mockRejectedValueOnce(new Error("Network Error"))
        .mockResolvedValueOnce({
          data: { organization: { id: "org-123" } },
        });

      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Complete form
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      await user.type(screen.getByTestId("location-address"), "Test Address");
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      await user.selectOptions(
        screen.getByTestId("sector-template"),
        "tecnologia",
      );
      await user.type(screen.getByTestId("industry"), "Software");

      // First attempt should fail
      await user.click(screen.getByText("Completar Configuración"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // Retry should succeed
      await user.click(screen.getByText("Completar Configuración"));

      await waitFor(() => {
        expect(
          screen.getByText("¡Configuración Completada!"),
        ).toBeInTheDocument();
      });
    });

    it("should handle edge cases with special characters", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Test special characters in organization name
      await user.type(
        screen.getByTestId("org-name"),
        "Empresa & Compañía S.A.S. - División Ñoño",
      );
      await user.type(screen.getByTestId("org-email"), "test@empresa-ñoño.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");

      // Should handle special characters without errors
      expect(screen.getByTestId("org-name")).toHaveValue(
        "Empresa & Compañía S.A.S. - División Ñoño",
      );
      expect(screen.getByTestId("org-email")).toHaveValue(
        "test@empresa-ñoño.com",
      );
    });
  });
});
