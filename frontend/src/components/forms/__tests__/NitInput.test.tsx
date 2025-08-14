/**
 * Tests for NitInput Component - TASK-026
 *
 * Comprehensive test suite for Colombian NIT input component including:
 * - NIT validation and formatting
 * - Verification digit calculation
 * - User interaction handling
 * - Error states and accessibility
 *
 * Author: Claude
 * Date: 2025-08-14
 * Coverage Target: >80%
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NitInput from "../NitInput";

describe("NitInput", () => {
  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();

  const defaultProps = {
    onChange: mockOnChange,
    onBlur: mockOnBlur,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render NIT input and verification digit input", () => {
      render(<NitInput {...defaultProps} />);

      // Should have both inputs
      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(2);

      // Check placeholders
      expect(screen.getByPlaceholderText("Ingrese el NIT")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("0")).toBeInTheDocument();
    });

    it("should render with custom label", () => {
      const customLabel = "NIT de la Empresa";
      render(<NitInput {...defaultProps} label={customLabel} />);

      expect(screen.getByText(customLabel)).toBeInTheDocument();
    });

    it("should render required indicator when required", () => {
      render(<NitInput {...defaultProps} label="NIT" required={true} />);

      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render helper text", () => {
      render(<NitInput {...defaultProps} />);

      expect(screen.getByText("Formato: 123.456.789")).toBeInTheDocument();
      expect(screen.getByText("Dígito de verificación")).toBeInTheDocument();
    });

    it("should render with custom placeholder", () => {
      const customPlaceholder = "Ingrese su NIT aquí";
      render(<NitInput {...defaultProps} placeholder={customPlaceholder} />);

      expect(
        screen.getByPlaceholderText(customPlaceholder),
      ).toBeInTheDocument();
    });
  });

  describe("NIT Formatting", () => {
    it("should format NIT with dots as user types", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");

      // Type NIT without formatting
      await user.type(nitInput, "900123456");

      // Should be formatted with dots
      expect(nitInput).toHaveValue("900.123.456");
    });

    it("should handle partial NIT formatting correctly", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");

      // Test different lengths
      await user.type(nitInput, "900");
      expect(nitInput).toHaveValue("900");

      await user.type(nitInput, "123");
      expect(nitInput).toHaveValue("900.123");

      await user.type(nitInput, "456");
      expect(nitInput).toHaveValue("900.123.456");
    });

    it("should handle pasted NIT values", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");

      // Simulate pasting unformatted NIT
      await user.click(nitInput);
      await user.paste("900123456");

      expect(nitInput).toHaveValue("900.123.456");
    });

    it("should remove non-numeric characters", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");

      await user.type(nitInput, "9a0b0.1-2c3d4e5f6");
      expect(nitInput).toHaveValue("900.123.456");
    });

    it("should enforce maximum length", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");

      // Try to type more than 15 digits
      await user.type(nitInput, "1234567890123456789");

      // Should be limited to 15 digits (formatted)
      expect(nitInput.value.replace(/\D/g, "")).toHaveLength(15);
    });
  });

  describe("Verification Digit Calculation", () => {
    it("should calculate verification digit for valid NITs", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      const dvInput = screen.getByPlaceholderText("0");

      // Type a known NIT
      await user.type(nitInput, "900123456");

      // Wait for calculation
      await waitFor(() => {
        expect(dvInput).toHaveValue("1");
      });

      // Should call onChange with calculated values
      expect(mockOnChange).toHaveBeenCalledWith("900123456", "1", true);
    });

    it("should calculate correct verification digits for test cases", async () => {
      const testCases = [
        { nit: "830020154", expectedDv: "6" },
        { nit: "860518614", expectedDv: "7" },
        { nit: "900359991", expectedDv: "5" },
      ];

      for (const testCase of testCases) {
        const user = userEvent.setup();
        render(<NitInput {...defaultProps} key={testCase.nit} />);

        const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
        const dvInput = screen.getByPlaceholderText("0");

        await user.type(nitInput, testCase.nit);

        await waitFor(() => {
          expect(dvInput).toHaveValue(testCase.expectedDv);
        });
      }
    });

    it("should show calculation in progress", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");

      await user.type(nitInput, "90012345");

      // Should show spinner temporarily
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should not calculate for short NITs", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      const dvInput = screen.getByPlaceholderText("0");

      await user.type(nitInput, "9001234"); // 7 digits

      // Should not calculate DV
      expect(dvInput).toHaveValue("");
      expect(mockOnChange).toHaveBeenCalledWith("9001234", "", false);
    });
  });

  describe("Manual Verification Digit Input", () => {
    it("should allow manual DV input", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      const dvInput = screen.getByPlaceholderText("0");

      await user.type(nitInput, "900123456");
      await user.clear(dvInput);
      await user.type(dvInput, "5");

      expect(dvInput).toHaveValue("5");
      expect(mockOnChange).toHaveBeenCalledWith("900123456", "5", false); // Should be invalid
    });

    it("should validate manual DV input", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      const dvInput = screen.getByPlaceholderText("0");

      await user.type(nitInput, "900123456");
      await user.clear(dvInput);
      await user.type(dvInput, "1"); // Correct DV

      expect(mockOnChange).toHaveBeenCalledWith("900123456", "1", true);
    });

    it("should restrict DV to single digit", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const dvInput = screen.getByPlaceholderText("0");

      await user.type(dvInput, "123");
      expect(dvInput).toHaveValue("1"); // Should only keep first digit
    });

    it("should remove non-numeric characters from DV", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const dvInput = screen.getByPlaceholderText("0");

      await user.type(dvInput, "a5b");
      expect(dvInput).toHaveValue("5");
    });
  });

  describe("Validation States", () => {
    it("should show valid state for correct NIT and DV", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");

      await user.type(nitInput, "900123456");

      await waitFor(() => {
        expect(nitInput).toHaveClass("is-valid");
        expect(screen.getByText(/NIT válido:/)).toBeInTheDocument();
        expect(screen.getByTestId("ri-check-line")).toBeInTheDocument();
      });
    });

    it("should show invalid state for incorrect NIT", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      const dvInput = screen.getByPlaceholderText("0");

      await user.type(nitInput, "900123456");
      await user.clear(dvInput);
      await user.type(dvInput, "9"); // Wrong DV

      await waitFor(() => {
        expect(nitInput).toHaveClass("is-invalid");
        expect(screen.getByText(/NIT inválido/)).toBeInTheDocument();
        expect(screen.getByTestId("ri-close-line")).toBeInTheDocument();
      });
    });

    it("should show no validation state initially", () => {
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      expect(nitInput).not.toHaveClass("is-valid");
      expect(nitInput).not.toHaveClass("is-invalid");
    });

    it("should show auto-calculation notice", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      await user.type(nitInput, "900123456");

      await waitFor(() => {
        expect(
          screen.getByText(/Dígito de verificación calculado automáticamente/),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display custom error message", () => {
      const errorMessage = "NIT is required";
      render(<NitInput {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it("should apply error styling when error prop is provided", () => {
      render(<NitInput {...defaultProps} error="Invalid NIT" />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      expect(nitInput).toHaveClass("is-invalid");
    });

    it("should prioritize custom error over validation state", async () => {
      const user = userEvent.setup();
      const customError = "Custom error message";

      render(<NitInput {...defaultProps} error={customError} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      await user.type(nitInput, "900123456"); // Valid NIT

      // Custom error should still be shown
      expect(screen.getByText(customError)).toBeInTheDocument();
      expect(nitInput).toHaveClass("is-invalid");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should move focus to DV input on Tab from NIT input", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      const dvInput = screen.getByPlaceholderText("0");

      await user.type(nitInput, "900123456");
      await user.tab();

      expect(dvInput).toHaveFocus();
    });

    it("should move focus back to NIT input on Backspace from empty DV", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      const dvInput = screen.getByPlaceholderText("0");

      await user.type(nitInput, "900123456");
      await user.click(dvInput);
      await user.keyboard("{Backspace}");

      expect(nitInput).toHaveFocus();
    });
  });

  describe("Component Props", () => {
    it("should handle disabled state", () => {
      render(<NitInput {...defaultProps} disabled={true} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      const dvInput = screen.getByPlaceholderText("0");

      expect(nitInput).toBeDisabled();
      expect(dvInput).toBeDisabled();
    });

    it("should apply custom className", () => {
      const customClass = "custom-nit-input";
      const { container } = render(
        <NitInput {...defaultProps} className={customClass} />,
      );

      expect(container.firstChild).toHaveClass(customClass);
    });

    it("should use custom id", () => {
      const customId = "custom-nit-id";
      render(<NitInput {...defaultProps} id={customId} label="NIT" />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      expect(nitInput).toHaveAttribute("id", customId);
    });

    it("should handle initial value prop", () => {
      render(<NitInput {...defaultProps} value="900123456" />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      expect(nitInput).toHaveValue("900.123.456");
    });
  });

  describe("Event Handling", () => {
    it("should call onBlur when input loses focus", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");

      await user.click(nitInput);
      await user.tab();

      expect(mockOnBlur).toHaveBeenCalled();
    });

    it("should call onChange with correct parameters", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      await user.type(nitInput, "900123456");

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith("900123456", "1", true);
      });
    });

    it("should handle onChange callback absence gracefully", async () => {
      const user = userEvent.setup();
      render(<NitInput />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");

      expect(() => user.type(nitInput, "900123456")).not.toThrow();
    });
  });

  describe("Edge Cases and Performance", () => {
    it("should handle rapid input changes", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");

      // Rapidly type and delete
      await user.type(nitInput, "900");
      await user.clear(nitInput);
      await user.type(nitInput, "123");
      await user.clear(nitInput);
      await user.type(nitInput, "900123456");

      await waitFor(() => {
        expect(nitInput).toHaveValue("900.123.456");
      });
    });

    it("should handle empty string gracefully", () => {
      render(<NitInput {...defaultProps} value="" />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      expect(nitInput).toHaveValue("");
    });

    it("should handle undefined value prop", () => {
      render(<NitInput {...defaultProps} value={undefined} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      expect(nitInput).toHaveValue("");
    });

    it("should handle very long input gracefully", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      const longInput = "12345678901234567890"; // 20 digits

      await user.type(nitInput, longInput);

      // Should be truncated to max length
      expect(nitInput.value.replace(/\D/g, "")).toHaveLength(15);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<NitInput {...defaultProps} label="NIT" required={true} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      expect(nitInput).toHaveAttribute("id");

      const label = screen.getByText("NIT");
      expect(label).toHaveAttribute("for");
    });

    it("should provide screen reader friendly validation feedback", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      await user.type(nitInput, "900123456");

      await waitFor(() => {
        const validationText = screen.getByText(/NIT válido:/);
        expect(validationText).toBeInTheDocument();
      });
    });

    it("should have proper spinner accessibility", async () => {
      const user = userEvent.setup();
      render(<NitInput {...defaultProps} />);

      const nitInput = screen.getByPlaceholderText("Ingrese el NIT");
      await user.type(nitInput, "90012345");

      const spinner = screen.getByRole("status");
      expect(spinner).toHaveTextContent("Calculando...");
    });
  });
});
