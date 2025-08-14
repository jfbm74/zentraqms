/**
 * Tests for Step1OrganizationData Component - TASK-026
 *
 * Comprehensive test suite for organization wizard step 1 including:
 * - Formulario principal rendering and validation
 * - NIT input validation and formatting
 * - Form field interactions
 * - Error handling and display
 *
 * Author: Claude
 * Date: 2025-08-14
 * Coverage Target: >80%
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Step1OrganizationData from "../Step1OrganizationData";

// Mock NitInput component
vi.mock("../../../forms/NitInput", () => ({
  default: ({ label, value, onChange, error, required, placeholder }: any) => (
    <div data-testid="nit-input">
      <label>
        {label}
        {required && " *"}
      </label>
      <input
        data-testid="nit-input-field"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value, "1", true)}
      />
      {error && <div data-testid="nit-error">{error}</div>}
    </div>
  ),
}));

describe("Step1OrganizationData", () => {
  const mockOnChange = vi.fn();

  const defaultProps = {
    data: {},
    errors: {},
    onChange: mockOnChange,
  };

  const sampleData = {
    name: "Empresa Test S.A.S.",
    description: "Empresa de prueba para testing",
    email: "contacto@empresatest.com",
    phone: "+57 1 234-5678",
    website: "https://www.empresatest.com",
    nit: "900123456",
    digito_verificacion: "1",
  };

  const sampleErrors = {
    name: "El nombre es requerido",
    email: "Email inválido",
    phone: "Teléfono inválido",
    nit: "NIT inválido",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render all form fields correctly", () => {
      render(<Step1OrganizationData {...defaultProps} />);

      // Check main title and description
      expect(
        screen.getByText("Información de la Organización"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Ingrese la información básica de su organización/),
      ).toBeInTheDocument();

      // Check all form fields
      expect(
        screen.getByLabelText(/Nombre de la Organización/),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Principal/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Teléfono Principal/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Sitio Web/)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Descripción de la Organización/),
      ).toBeInTheDocument();

      // Check NIT input component
      expect(screen.getByTestId("nit-input")).toBeInTheDocument();
    });

    it("should render required field indicators", () => {
      render(<Step1OrganizationData {...defaultProps} />);

      // Check for required asterisks
      const requiredLabels = screen.getAllByText("*");
      expect(requiredLabels).toHaveLength(3); // name, email, phone
    });

    it("should render NIT information panel", () => {
      render(<Step1OrganizationData {...defaultProps} />);

      expect(screen.getByText("Información NIT")).toBeInTheDocument();
      expect(
        screen.getByText(/Número de Identificación Tributaria/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Auto-calcula/)).toBeInTheDocument();
    });
  });

  describe("Form Field Values", () => {
    it("should display provided data values", () => {
      render(<Step1OrganizationData {...defaultProps} data={sampleData} />);

      expect(screen.getByDisplayValue(sampleData.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(sampleData.email)).toBeInTheDocument();
      expect(screen.getByDisplayValue(sampleData.phone)).toBeInTheDocument();
      expect(screen.getByDisplayValue(sampleData.website)).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(sampleData.description),
      ).toBeInTheDocument();
    });

    it("should handle empty data gracefully", () => {
      render(<Step1OrganizationData {...defaultProps} data={{}} />);

      // All inputs should be empty but not throw errors
      const nameInput = screen.getByLabelText(
        /Nombre de la Organización/,
      ) as HTMLInputElement;
      const emailInput = screen.getByLabelText(
        /Email Principal/,
      ) as HTMLInputElement;

      expect(nameInput.value).toBe("");
      expect(emailInput.value).toBe("");
    });

    it("should handle partial data correctly", () => {
      const partialData = {
        name: "Test Company",
        email: "test@example.com",
      };

      render(<Step1OrganizationData {...defaultProps} data={partialData} />);

      expect(screen.getByDisplayValue("Test Company")).toBeInTheDocument();
      expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();

      // Other fields should be empty
      const phoneInput = screen.getByLabelText(
        /Teléfono Principal/,
      ) as HTMLInputElement;
      expect(phoneInput.value).toBe("");
    });
  });

  describe("Form Field Interactions", () => {
    it("should call onChange when organization name changes", async () => {
      const user = userEvent.setup();
      render(<Step1OrganizationData {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre de la Organización/);
      await user.type(nameInput, "New Company Name");

      expect(mockOnChange).toHaveBeenCalledWith({ name: "N" });
      expect(mockOnChange).toHaveBeenCalledWith({ name: "Ne" });
      // ... and so on for each character
    });

    it("should call onChange when email changes", async () => {
      const user = userEvent.setup();
      render(<Step1OrganizationData {...defaultProps} />);

      const emailInput = screen.getByLabelText(/Email Principal/);
      await user.type(emailInput, "test@example.com");

      expect(mockOnChange).toHaveBeenCalledWith({ email: "t" });
      // Should be called for each character typed
    });

    it("should call onChange when phone changes", async () => {
      const user = userEvent.setup();
      render(<Step1OrganizationData {...defaultProps} />);

      const phoneInput = screen.getByLabelText(/Teléfono Principal/);
      await user.type(phoneInput, "+57 1 234-5678");

      expect(mockOnChange).toHaveBeenCalledWith({ phone: "+" });
    });

    it("should call onChange when website changes", async () => {
      const user = userEvent.setup();
      render(<Step1OrganizationData {...defaultProps} />);

      const websiteInput = screen.getByLabelText(/Sitio Web/);
      await user.type(websiteInput, "https://example.com");

      expect(mockOnChange).toHaveBeenCalledWith({ website: "h" });
    });

    it("should call onChange when description changes", async () => {
      const user = userEvent.setup();
      render(<Step1OrganizationData {...defaultProps} />);

      const descriptionInput = screen.getByLabelText(
        /Descripción de la Organización/,
      );
      await user.type(descriptionInput, "Test description");

      expect(mockOnChange).toHaveBeenCalledWith({ description: "T" });
    });
  });

  describe("NIT Input Integration", () => {
    it("should render NIT input component with correct props", () => {
      render(<Step1OrganizationData {...defaultProps} data={sampleData} />);

      const nitInput = screen.getByTestId("nit-input");
      expect(nitInput).toBeInTheDocument();

      // Check NIT input receives correct value
      const nitInputField = screen.getByTestId("nit-input-field");
      expect(nitInputField).toHaveValue(sampleData.nit);
    });

    it("should handle NIT changes correctly", async () => {
      const user = userEvent.setup();
      render(<Step1OrganizationData {...defaultProps} />);

      const nitInputField = screen.getByTestId("nit-input-field");
      await user.type(nitInputField, "900123456");

      // Should call onChange with nit and verification digit
      expect(mockOnChange).toHaveBeenCalledWith({
        nit: "900123456",
        digito_verificacion: "1",
      });
    });

    it("should display NIT validation errors", () => {
      render(
        <Step1OrganizationData
          {...defaultProps}
          errors={{ nit: "NIT inválido" }}
        />,
      );

      expect(screen.getByTestId("nit-error")).toHaveTextContent("NIT inválido");
    });
  });

  describe("Error Display", () => {
    it("should display all field errors correctly", () => {
      render(<Step1OrganizationData {...defaultProps} errors={sampleErrors} />);

      expect(screen.getByText(sampleErrors.name)).toBeInTheDocument();
      expect(screen.getByText(sampleErrors.email)).toBeInTheDocument();
      expect(screen.getByText(sampleErrors.phone)).toBeInTheDocument();
      expect(screen.getByTestId("nit-error")).toHaveTextContent(
        sampleErrors.nit,
      );
    });

    it("should apply error CSS classes to invalid fields", () => {
      render(<Step1OrganizationData {...defaultProps} errors={sampleErrors} />);

      const nameInput = screen.getByLabelText(/Nombre de la Organización/);
      const emailInput = screen.getByLabelText(/Email Principal/);

      expect(nameInput).toHaveClass("is-invalid");
      expect(emailInput).toHaveClass("is-invalid");
    });

    it("should not show errors when none provided", () => {
      render(<Step1OrganizationData {...defaultProps} />);

      // Should not have any error feedback elements
      expect(screen.queryByClass("invalid-feedback")).not.toBeInTheDocument();
    });

    it("should handle partial errors correctly", () => {
      const partialErrors = { name: "Name required" };
      render(
        <Step1OrganizationData {...defaultProps} errors={partialErrors} />,
      );

      // Only name field should show error
      expect(screen.getByText("Name required")).toBeInTheDocument();

      // Other fields should not have error classes
      const emailInput = screen.getByLabelText(/Email Principal/);
      expect(emailInput).not.toHaveClass("is-invalid");
    });
  });

  describe("Input Field Properties", () => {
    it("should have correct input types", () => {
      render(<Step1OrganizationData {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre de la Organización/);
      const emailInput = screen.getByLabelText(/Email Principal/);
      const phoneInput = screen.getByLabelText(/Teléfono Principal/);
      const websiteInput = screen.getByLabelText(/Sitio Web/);
      const descriptionInput = screen.getByLabelText(
        /Descripción de la Organización/,
      );

      expect(nameInput).toHaveAttribute("type", "text");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(phoneInput).toHaveAttribute("type", "text");
      expect(websiteInput).toHaveAttribute("type", "url");
      expect(descriptionInput.tagName.toLowerCase()).toBe("textarea");
    });

    it("should have correct placeholders", () => {
      render(<Step1OrganizationData {...defaultProps} />);

      expect(
        screen.getByPlaceholderText("Ingrese el nombre de la organización"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("contacto@organizacion.com"),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("+57 1 234 5678")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("https://www.organizacion.com"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Describa brevemente su organización/),
      ).toBeInTheDocument();
    });

    it("should have correct textarea rows", () => {
      render(<Step1OrganizationData {...defaultProps} />);

      const descriptionInput = screen.getByLabelText(
        /Descripción de la Organización/,
      );
      expect(descriptionInput).toHaveAttribute("rows", "4");
    });
  });

  describe("Component Layout", () => {
    it("should have proper Bootstrap grid structure", () => {
      const { container } = render(<Step1OrganizationData {...defaultProps} />);

      // Check for row and column classes
      expect(container.querySelector(".row")).toBeInTheDocument();
      expect(container.querySelector(".col-lg-6")).toBeInTheDocument();
      expect(container.querySelector(".col-lg-12")).toBeInTheDocument();
    });

    it("should have proper form group structure", () => {
      const { container } = render(<Step1OrganizationData {...defaultProps} />);

      // Check for form groups with mb-3 class
      const formGroups = container.querySelectorAll(".mb-3");
      expect(formGroups.length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for all inputs", () => {
      render(<Step1OrganizationData {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre de la Organización/);
      const emailInput = screen.getByLabelText(/Email Principal/);
      const phoneInput = screen.getByLabelText(/Teléfono Principal/);
      const websiteInput = screen.getByLabelText(/Sitio Web/);
      const descriptionInput = screen.getByLabelText(
        /Descripción de la Organización/,
      );

      expect(nameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      expect(phoneInput).toBeInTheDocument();
      expect(websiteInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
    });

    it("should have correct HTML structure for screen readers", () => {
      const { container } = render(<Step1OrganizationData {...defaultProps} />);

      // Check for proper label-input associations
      const labels = container.querySelectorAll("label[for]");
      labels.forEach((label) => {
        const forAttribute = label.getAttribute("for");
        const associatedInput = container.querySelector(`#${forAttribute}`);
        expect(associatedInput).toBeInTheDocument();
      });
    });

    it("should mark required fields appropriately", () => {
      render(<Step1OrganizationData {...defaultProps} />);

      // Check for required field indicators
      const requiredSpans = screen.getAllByText("*");
      expect(requiredSpans).toHaveLength(3);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle rapid input changes without errors", async () => {
      const user = userEvent.setup();
      render(<Step1OrganizationData {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre de la Organización/);

      // Rapidly change input value
      await user.type(nameInput, "a");
      await user.clear(nameInput);
      await user.type(nameInput, "b");
      await user.clear(nameInput);
      await user.type(nameInput, "final value");

      expect(mockOnChange).toHaveBeenCalledWith({ name: "final value" });
    });

    it("should handle very long input values", async () => {
      const user = userEvent.setup();
      const longText = "a".repeat(1000);

      render(<Step1OrganizationData {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre de la Organización/);
      await user.type(nameInput, longText);

      expect(mockOnChange).toHaveBeenCalledWith({ name: longText });
    });

    it("should handle special characters in input", async () => {
      const user = userEvent.setup();
      const specialText = "Empresa & Compañía S.A.S. - División Ñoño";

      render(<Step1OrganizationData {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre de la Organización/);
      await user.clear(nameInput);
      await user.type(nameInput, specialText);

      expect(mockOnChange).toHaveBeenCalledWith({ name: specialText });
    });

    it("should handle null/undefined data properties", () => {
      const dataWithNulls = {
        name: null,
        email: undefined,
        phone: "",
        website: null,
      };

      expect(() => {
        render(
          <Step1OrganizationData
            {...defaultProps}
            data={dataWithNulls as any}
          />,
        );
      }).not.toThrow();
    });
  });
});
