/**
 * Tests for OrganizationWizard Component - TASK-026
 *
 * Comprehensive test suite for organization wizard including:
 * - Wizard navigation and step validation
 * - Form submission and API integration
 * - Error handling and user feedback
 * - Multi-step workflow testing
 *
 * Author: Claude
 * Date: 2025-08-14
 * Coverage Target: >80%
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toast } from "react-toastify";
import OrganizationWizard from "../OrganizationWizard";

// Mock dependencies
vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../../../utils/SimpleRouter", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../../../../api/endpoints", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// Mock step components
vi.mock("../../../../components/wizard/steps/Step1OrganizationData", () => ({
  default: ({ data, onChange }: { data: Record<string, unknown>; onChange: (data: Record<string, unknown>) => void }) => (
    <div data-testid="step1-organization">
      <input
        data-testid="org-name"
        value={data.name || ""}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <input
        data-testid="org-email"
        value={data.email || ""}
        onChange={(e) => onChange({ email: e.target.value })}
      />
      <input
        data-testid="org-phone"
        value={data.phone || ""}
        onChange={(e) => onChange({ phone: e.target.value })}
      />
      <input
        data-testid="org-nit"
        value={data.nit || ""}
        onChange={(e) =>
          onChange({ nit: e.target.value, digito_verificacion: "1" })
        }
      />
      {errors.name && <div data-testid="name-error">{errors.name}</div>}
      {errors.email && <div data-testid="email-error">{errors.email}</div>}
    </div>
  ),
}));

vi.mock("../../../../components/wizard/steps/Step2LocationData", () => ({
  default: ({ data, onChange }: { data: Record<string, unknown>; onChange: (data: Record<string, unknown>) => void }) => (
    <div data-testid="step2-location">
      <input
        data-testid="location-address"
        value={data.address || ""}
        onChange={(e) => onChange({ address: e.target.value })}
      />
      <input
        data-testid="location-city"
        value={data.city || ""}
        onChange={(e) => onChange({ city: e.target.value })}
      />
      <input
        data-testid="location-state"
        value={data.state || ""}
        onChange={(e) => onChange({ state: e.target.value })}
      />
    </div>
  ),
}));

vi.mock("../../../../components/wizard/steps/Step3SectorTemplate", () => ({
  default: ({ data, onChange }: { data: Record<string, unknown>; onChange: (data: Record<string, unknown>) => void }) => (
    <div data-testid="step3-sector">
      <select
        data-testid="sector-template"
        value={data.sector_template || ""}
        onChange={(e) => onChange({ sector_template: e.target.value })}
      >
        <option value="">Select Sector</option>
        <option value="tecnologia">Technology</option>
        <option value="salud">Health</option>
      </select>
      <input
        data-testid="industry"
        value={data.industry || ""}
        onChange={(e) => onChange({ industry: e.target.value })}
      />
    </div>
  ),
}));

vi.mock("../../../../components/wizard/steps/Step5BranchOffices", () => ({
  default: ({ onComplete, onSkip }: unknown) => (
    <div data-testid="step5-branches">
      <button data-testid="complete-branches" onClick={onComplete}>
        Complete Branch Offices
      </button>
      <button data-testid="skip-branches" onClick={onSkip}>
        Skip Branch Offices
      </button>
    </div>
  ),
}));

describe("OrganizationWizard", () => {
  const mockApiPost = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup API mock
    const { apiClient } = await import("../../../../api/endpoints");
    apiClient.post = mockApiPost;

    // Setup navigation mock
    const { useNavigate } = await import("../../../../utils/SimpleRouter");
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Render", () => {
    it("should render wizard with correct title and initial step", () => {
      render(<OrganizationWizard />);

      expect(screen.getByText("Configuración Inicial")).toBeInTheDocument();
      expect(
        screen.getByText("Configure su organización en ZentraQMS"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("step1-organization")).toBeInTheDocument();
    });

    it("should render step navigation correctly", () => {
      render(<OrganizationWizard />);

      expect(screen.getByText("Organización")).toBeInTheDocument();
      expect(screen.getByText("Ubicación")).toBeInTheDocument();
      expect(screen.getByText("Configuración")).toBeInTheDocument();
    });

    it("should start with step 1 active", () => {
      render(<OrganizationWizard />);

      const step1Nav = screen.getByText("Organización").closest("a");
      expect(step1Nav).toHaveClass("active");
    });

    it("should show next button on step 1", () => {
      render(<OrganizationWizard />);

      expect(screen.getByText("Siguiente: Ubicación")).toBeInTheDocument();
    });
  });

  describe("Navigation Between Steps", () => {
    it("should advance to step 2 when step 1 is completed", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Fill required fields for step 1
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");

      // Click next
      await user.click(screen.getByText("Siguiente: Ubicación"));

      expect(screen.getByTestId("step2-location")).toBeInTheDocument();
    });

    it("should show validation errors when advancing with incomplete data", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Try to advance without filling required fields
      await user.click(screen.getByText("Siguiente: Ubicación"));

      expect(toast.error).toHaveBeenCalledWith(
        "Por favor corrige los errores antes de continuar",
      );
      expect(screen.getByTestId("name-error")).toBeInTheDocument();
      expect(screen.getByTestId("email-error")).toBeInTheDocument();
    });

    it("should allow navigation back to previous steps", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Complete step 1
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      // Now go back
      await user.click(screen.getByText("Anterior"));

      expect(screen.getByTestId("step1-organization")).toBeInTheDocument();
    });

    it("should advance to step 3 from step 2", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Complete step 1
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      // Complete step 2
      await user.type(
        screen.getByTestId("location-address"),
        "Test Address 123",
      );
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      expect(screen.getByTestId("step3-sector")).toBeInTheDocument();
    });
  });

  describe("Step Validation", () => {
    it("should validate organization name is required", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      await user.click(screen.getByText("Siguiente: Ubicación"));

      expect(screen.getByTestId("name-error")).toHaveTextContent(
        "El nombre de la organización es requerido",
      );
    });

    it("should validate email format", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "invalid-email");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      expect(screen.getByTestId("email-error")).toHaveTextContent(
        "Email inválido",
      );
    });

    it("should validate phone number format", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "invalid");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      expect(
        screen.queryByText(/El teléfono debe contener solo números/),
      ).toBeInTheDocument();
    });

    it("should validate location fields in step 2", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Complete step 1
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      // Try to advance without location data
      await user.click(screen.getByText("Siguiente: Configuración"));

      expect(toast.error).toHaveBeenCalledWith(
        "Por favor corrige los errores antes de continuar",
      );
    });
  });

  describe("Form Data Management", () => {
    it("should update form data when fields change", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      const nameInput = screen.getByTestId("org-name");
      await user.type(nameInput, "Test Organization");

      expect(nameInput).toHaveValue("Test Organization");
    });

    it("should clear errors when valid data is entered", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Trigger validation error
      await user.click(screen.getByText("Siguiente: Ubicación"));
      expect(screen.getByTestId("name-error")).toBeInTheDocument();

      // Fix the error
      await user.type(screen.getByTestId("org-name"), "Test Organization");

      // Error should be cleared
      expect(screen.queryByTestId("name-error")).not.toBeInTheDocument();
    });

    it("should format phone number correctly", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      const phoneInput = screen.getByTestId("org-phone");
      await user.type(phoneInput, "+57abc123def456");

      // Should remove non-allowed characters
      expect(phoneInput).toHaveValue("+57123456");
    });

    it("should persist data when navigating between steps", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Fill step 1
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      // Go back to step 1
      await user.click(screen.getByText("Anterior"));

      // Data should be preserved
      expect(screen.getByTestId("org-name")).toHaveValue("Test Organization");
      expect(screen.getByTestId("org-email")).toHaveValue("test@example.com");
    });
  });

  describe("Form Submission", () => {
    const fillCompleteForm = async (user: unknown) => {
      // Step 1
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      // Step 2
      await user.type(
        screen.getByTestId("location-address"),
        "Test Address 123",
      );
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      // Step 3
      await user.selectOptions(
        screen.getByTestId("sector-template"),
        "tecnologia",
      );
      await user.type(screen.getByTestId("industry"), "Software Development");
    };

    it("should submit form data successfully", async () => {
      const user = userEvent.setup();
      mockApiPost.mockResolvedValue({
        data: {
          organization: { id: "123", name: "Test Organization" },
        },
      });

      render(<OrganizationWizard />);

      await fillCompleteForm(user);
      await user.click(screen.getByText("Completar Configuración"));

      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/v1/organizations/wizard/step1/",
        {
          razon_social: "Test Organization",
          nombre_comercial: "Test Organization",
          nit: "900123456",
          digito_verificacion: "1",
          tipo_organizacion: "empresa_privada",
          sector_economico: "tecnologia",
          tamaño_empresa: "pequeña",
          telefono_principal: "+57 1 234-5678",
          email_contacto: "test@example.com",
        },
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "¡Organización configurada exitosamente!",
          {
            autoClose: 2000,
          },
        );
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      mockApiPost.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );

      render(<OrganizationWizard />);

      await fillCompleteForm(user);
      await user.click(screen.getByText("Completar Configuración"));

      expect(screen.getByText("Configurando...")).toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should handle API errors gracefully", async () => {
      const user = userEvent.setup();
      mockApiPost.mockRejectedValue({
        response: {
          data: {
            errors: {
              nit: ["This NIT already exists"],
            },
          },
        },
      });

      render(<OrganizationWizard />);

      await fillCompleteForm(user);
      await user.click(screen.getByText("Completar Configuración"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining("nit: This NIT already exists"),
        );
      });
    });

    it("should navigate to success screen after submission", async () => {
      const user = userEvent.setup();
      mockApiPost.mockResolvedValue({
        data: {
          organization: { id: "123", name: "Test Organization" },
        },
      });

      render(<OrganizationWizard />);

      await fillCompleteForm(user);
      await user.click(screen.getByText("Completar Configuración"));

      await waitFor(() => {
        expect(
          screen.getByText("¡Configuración Completada!"),
        ).toBeInTheDocument();
        expect(
          screen.getByText("Su organización ha sido configurada exitosamente"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Success Screen and Branch Offices", () => {
    const navigateToSuccessScreen = async () => {
      const user = userEvent.setup();
      mockApiPost.mockResolvedValue({
        data: {
          organization: { id: "123", name: "Test Organization" },
        },
      });

      render(<OrganizationWizard />);

      // Fill and submit form
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      await user.type(
        screen.getByTestId("location-address"),
        "Test Address 123",
      );
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      await user.selectOptions(
        screen.getByTestId("sector-template"),
        "tecnologia",
      );
      await user.type(screen.getByTestId("industry"), "Software Development");
      await user.click(screen.getByText("Completar Configuración"));

      await waitFor(() => {
        expect(
          screen.getByText("¡Configuración Completada!"),
        ).toBeInTheDocument();
      });

      return user;
    };

    it("should show branch office options on success screen", async () => {
      await navigateToSuccessScreen();

      expect(
        screen.getByText("¿Desea agregar sucursales adicionales?"),
      ).toBeInTheDocument();
      expect(screen.getByText("Sí, agregar sucursales")).toBeInTheDocument();
      expect(screen.getByText("Ir al Dashboard")).toBeInTheDocument();
    });

    it("should navigate to branch office step when selected", async () => {
      const user = await navigateToSuccessScreen();

      await user.click(screen.getByText("Sí, agregar sucursales"));

      expect(screen.getByTestId("step5-branches")).toBeInTheDocument();
    });

    it("should navigate to dashboard when selected", async () => {
      const user = await navigateToSuccessScreen();

      await user.click(screen.getByText("Ir al Dashboard"));

      expect(toast.success).toHaveBeenCalledWith(
        "Redirigiendo al dashboard...",
      );
    });

    it("should handle branch office completion", async () => {
      const user = await navigateToSuccessScreen();
      await user.click(screen.getByText("Sí, agregar sucursales"));

      await user.click(screen.getByTestId("complete-branches"));

      expect(toast.success).toHaveBeenCalledWith(
        "¡Configuración completada exitosamente!",
      );
    });

    it("should handle skipping branch offices", async () => {
      const user = await navigateToSuccessScreen();
      await user.click(screen.getByText("Sí, agregar sucursales"));

      await user.click(screen.getByTestId("skip-branches"));

      expect(toast.info).toHaveBeenCalledWith(
        "Puede agregar sucursales más tarde desde Configuración",
      );
    });
  });

  describe("Accessibility and UX", () => {
    it("should have proper ARIA attributes", () => {
      render(<OrganizationWizard />);

      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();

      const tabList = screen.getByRole("tablist");
      expect(tabList).toBeInTheDocument();
    });

    it("should handle keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      screen.getByText("Siguiente: Ubicación");
      await user.tab();

      // Should be able to focus on interactive elements
      expect(document.activeElement).toBeTruthy();
    });

    it("should provide clear visual feedback for active step", () => {
      render(<OrganizationWizard />);

      const activeStep = screen.getByText("Organización").closest("a");
      expect(activeStep).toHaveClass("active");
    });

    it("should show step completion states", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Complete step 1
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      // Step 1 should be marked as done
      const step1Nav = screen.getByText("Organización").closest("a");
      expect(step1Nav).toHaveClass("done");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      const user = userEvent.setup();
      mockApiPost.mockRejectedValue(new Error("Network error"));

      render(<OrganizationWizard />);

      // Fill and submit form
      await user.type(screen.getByTestId("org-name"), "Test Organization");
      await user.type(screen.getByTestId("org-email"), "test@example.com");
      await user.type(screen.getByTestId("org-phone"), "+57 1 234-5678");
      await user.type(screen.getByTestId("org-nit"), "900123456");
      await user.click(screen.getByText("Siguiente: Ubicación"));

      await user.type(
        screen.getByTestId("location-address"),
        "Test Address 123",
      );
      await user.type(screen.getByTestId("location-city"), "Bogotá");
      await user.type(screen.getByTestId("location-state"), "Cundinamarca");
      await user.click(screen.getByText("Siguiente: Configuración"));

      await user.selectOptions(
        screen.getByTestId("sector-template"),
        "tecnologia",
      );
      await user.type(screen.getByTestId("industry"), "Software Development");
      await user.click(screen.getByText("Completar Configuración"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Error al crear la organización. Inténtalo de nuevo.",
        );
      });
    });

    it("should handle invalid step navigation attempts", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      // Try to click on step 2 without completing step 1
      const step2Nav = screen.getByText("Ubicación").closest("a");
      await user.click(step2Nav!);

      // Should remain on step 1
      expect(screen.getByTestId("step1-organization")).toBeInTheDocument();
    });

    it("should handle empty form submission attempts", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      await user.click(screen.getByText("Siguiente: Ubicación"));

      expect(toast.error).toHaveBeenCalledWith(
        "Por favor corrige los errores antes de continuar",
      );
    });

    it("should handle very long input values", async () => {
      const user = userEvent.setup();
      render(<OrganizationWizard />);

      const longName = "A".repeat(1000);
      await user.type(screen.getByTestId("org-name"), longName);

      expect(screen.getByTestId("org-name")).toHaveValue(longName);
    });
  });
});
