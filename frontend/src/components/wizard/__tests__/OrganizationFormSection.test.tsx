/**
 * Unit tests for OrganizationFormSection component.
 * 
 * Tests form field validation, data binding, and user interactions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { OrganizationFormSection } from '../components/OrganizationFormSection';
import { DEFAULT_FORM_DATA, OrganizationFormData } from '../../../types/wizard.types';

// Mock validation service
jest.mock('../../../services/validationService', () => ({
  validateNit: jest.fn(),
  validateEmail: jest.fn(),
  validatePhone: jest.fn()
}));

const mockProps = {
  formData: DEFAULT_FORM_DATA,
  onUpdate: jest.fn(),
  onValidate: jest.fn(),
  errors: {},
  warnings: {},
  isValidating: false,
  className: ''
};

describe('OrganizationFormSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders all required form fields', () => {
      render(<OrganizationFormSection {...mockProps} />);
      
      expect(screen.getByLabelText(/razón social/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dígito de verificación/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email de contacto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/teléfono principal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sitio web/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    });

    test('displays current form values', () => {
      const formDataWithValues: OrganizationFormData = {
        ...DEFAULT_FORM_DATA,
        razon_social: 'Hospital Test',
        nit: '123456789',
        digito_verificacion: '1',
        email_contacto: 'test@hospital.com',
        telefono_principal: '+57 1 234 5678'
      };

      render(<OrganizationFormSection {...mockProps} formData={formDataWithValues} />);
      
      expect(screen.getByDisplayValue('Hospital Test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@hospital.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+57 1 234 5678')).toBeInTheDocument();
    });

    test('shows field labels and help text', () => {
      render(<OrganizationFormSection {...mockProps} />);
      
      expect(screen.getByText(/razón social completa/i)).toBeInTheDocument();
      expect(screen.getByText(/número de identificación tributaria/i)).toBeInTheDocument();
      expect(screen.getByText(/email principal de contacto/i)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    test('calls onUpdate when text field changes', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const razonSocialInput = screen.getByLabelText(/razón social/i);
      await user.type(razonSocialInput, 'Hospital San Rafael');
      
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        razon_social: 'Hospital San Rafael'
      });
    });

    test('calls onUpdate for NIT field', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const nitInput = screen.getByLabelText(/nit/i);
      await user.type(nitInput, '123456789');
      
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        nit: '123456789'
      });
    });

    test('calls onUpdate for verification digit', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const digitoInput = screen.getByLabelText(/dígito de verificación/i);
      await user.type(digitoInput, '7');
      
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        digito_verificacion: '7'
      });
    });

    test('calls onUpdate for email field', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const emailInput = screen.getByLabelText(/email de contacto/i);
      await user.type(emailInput, 'test@example.com');
      
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        email_contacto: 'test@example.com'
      });
    });

    test('calls onUpdate for phone field', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const phoneInput = screen.getByLabelText(/teléfono principal/i);
      await user.type(phoneInput, '+57 1 234 5678');
      
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        telefono_principal: '+57 1 234 5678'
      });
    });

    test('calls onUpdate for website field', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const websiteInput = screen.getByLabelText(/sitio web/i);
      await user.type(websiteInput, 'https://example.com');
      
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        website: 'https://example.com'
      });
    });

    test('calls onUpdate for description field', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const descriptionInput = screen.getByLabelText(/descripción/i);
      await user.type(descriptionInput, 'Hospital description');
      
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        descripcion: 'Hospital description'
      });
    });
  });

  describe('Field Validation', () => {
    test('displays validation errors', () => {
      const propsWithErrors = {
        ...mockProps,
        errors: {
          razon_social: 'Razón social es requerida',
          nit: 'NIT debe tener formato válido',
          email_contacto: 'Email debe ser válido'
        }
      };
      
      render(<OrganizationFormSection {...propsWithErrors} />);
      
      expect(screen.getByText('Razón social es requerida')).toBeInTheDocument();
      expect(screen.getByText('NIT debe tener formato válido')).toBeInTheDocument();
      expect(screen.getByText('Email debe ser válido')).toBeInTheDocument();
    });

    test('displays validation warnings', () => {
      const propsWithWarnings = {
        ...mockProps,
        warnings: {
          telefono_principal: 'Formato de teléfono podría ser incorrecto',
          website: 'URL no pudo ser verificada'
        }
      };
      
      render(<OrganizationFormSection {...propsWithWarnings} />);
      
      expect(screen.getByText('Formato de teléfono podría ser incorrecto')).toBeInTheDocument();
      expect(screen.getByText('URL no pudo ser verificada')).toBeInTheDocument();
    });

    test('applies error styling to fields with errors', () => {
      const propsWithErrors = {
        ...mockProps,
        errors: {
          nit: 'NIT inválido'
        }
      };
      
      render(<OrganizationFormSection {...propsWithErrors} />);
      
      const nitInput = screen.getByLabelText(/nit/i);
      expect(nitInput).toHaveClass('is-invalid');
    });

    test('calls onValidate when field loses focus', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const nitInput = screen.getByLabelText(/nit/i);
      await user.type(nitInput, '123456789');
      await user.tab(); // Move focus away
      
      expect(mockProps.onValidate).toHaveBeenCalledWith('nit', '123456789');
    });

    test('shows validation loading state', () => {
      const propsWithValidating = {
        ...mockProps,
        isValidating: true
      };
      
      render(<OrganizationFormSection {...propsWithValidating} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/validando/i)).toBeInTheDocument();
    });
  });

  describe('NIT Validation', () => {
    test('shows NIT availability status', () => {
      const propsWithNitValidation = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          nit: '123456789'
        },
        nitAvailable: true
      };
      
      render(<OrganizationFormSection {...propsWithNitValidation} />);
      
      expect(screen.getByText(/nit disponible/i)).toBeInTheDocument();
      expect(screen.getByTestId('nit-status-success')).toBeInTheDocument();
    });

    test('shows NIT unavailable status', () => {
      const propsWithNitValidation = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          nit: '123456789'
        },
        nitAvailable: false
      };
      
      render(<OrganizationFormSection {...propsWithNitValidation} />);
      
      expect(screen.getByText(/nit ya está registrado/i)).toBeInTheDocument();
      expect(screen.getByTestId('nit-status-error')).toBeInTheDocument();
    });

    test('formats NIT input correctly', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const nitInput = screen.getByLabelText(/nit/i);
      await user.type(nitInput, '123456789');
      
      // Should allow only numeric input
      expect(nitInput).toHaveValue('123456789');
    });

    test('validates verification digit input', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const digitoInput = screen.getByLabelText(/dígito de verificación/i);
      
      // Should only allow single digit
      await user.type(digitoInput, '12');
      expect(digitoInput).toHaveValue('1'); // Should truncate to single digit
    });
  });

  describe('Character Limits', () => {
    test('enforces character limits on text fields', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const razonSocialInput = screen.getByLabelText(/razón social/i);
      
      // Try to type more than allowed
      const longText = 'A'.repeat(300); // Longer than 200 char limit
      await user.type(razonSocialInput, longText);
      
      expect(razonSocialInput.value.length).toBeLessThanOrEqual(200);
    });

    test('shows character count for description field', () => {
      render(<OrganizationFormSection {...mockProps} />);
      
      expect(screen.getByText(/0 \/ 1000 caracteres/i)).toBeInTheDocument();
    });

    test('updates character count as user types', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const descriptionInput = screen.getByLabelText(/descripción/i);
      await user.type(descriptionInput, 'Test description');
      
      expect(screen.getByText(/16 \/ 1000 caracteres/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<OrganizationFormSection {...mockProps} />);
      
      expect(screen.getByLabelText(/razón social/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/nit/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/email de contacto/i)).toHaveAttribute('aria-required', 'true');
    });

    test('associates error messages with form fields', () => {
      const propsWithErrors = {
        ...mockProps,
        errors: {
          nit: 'NIT inválido'
        }
      };
      
      render(<OrganizationFormSection {...propsWithErrors} />);
      
      const nitInput = screen.getByLabelText(/nit/i);
      const errorMessage = screen.getByText('NIT inválido');
      
      expect(nitInput).toHaveAttribute('aria-describedby');
      expect(errorMessage).toHaveAttribute('id');
    });

    test('has proper tab order', () => {
      render(<OrganizationFormSection {...mockProps} />);
      
      const inputs = [
        screen.getByLabelText(/razón social/i),
        screen.getByLabelText(/nit/i),
        screen.getByLabelText(/dígito de verificación/i),
        screen.getByLabelText(/email de contacto/i),
        screen.getByLabelText(/teléfono principal/i),
        screen.getByLabelText(/sitio web/i),
        screen.getByLabelText(/descripción/i)
      ];
      
      inputs.forEach((input, index) => {
        expect(input).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Input Formatting', () => {
    test('formats phone number input', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const phoneInput = screen.getByLabelText(/teléfono principal/i);
      await user.type(phoneInput, '1234567890');
      
      // Should format Colombian phone numbers
      expect(phoneInput.value).toMatch(/^\+?[\d\s\-\(\)]+$/);
    });

    test('validates email format on blur', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const emailInput = screen.getByLabelText(/email de contacto/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();
      
      expect(mockProps.onValidate).toHaveBeenCalledWith('email_contacto', 'invalid-email');
    });

    test('validates URL format for website field', async () => {
      const user = userEvent.setup();
      render(<OrganizationFormSection {...mockProps} />);
      
      const websiteInput = screen.getByLabelText(/sitio web/i);
      await user.type(websiteInput, 'invalid-url');
      await user.tab();
      
      expect(mockProps.onValidate).toHaveBeenCalledWith('website', 'invalid-url');
    });
  });

  describe('Form State Management', () => {
    test('disables form when in validating state', () => {
      const propsWithValidating = {
        ...mockProps,
        isValidating: true
      };
      
      render(<OrganizationFormSection {...propsWithValidating} />);
      
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });

    test('maintains form state during validation', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<OrganizationFormSection {...mockProps} />);
      
      const razonSocialInput = screen.getByLabelText(/razón social/i);
      await user.type(razonSocialInput, 'Hospital Test');
      
      // Simulate validation state change
      rerender(<OrganizationFormSection {...mockProps} isValidating={true} />);
      
      expect(screen.getByDisplayValue('Hospital Test')).toBeInTheDocument();
    });
  });
});