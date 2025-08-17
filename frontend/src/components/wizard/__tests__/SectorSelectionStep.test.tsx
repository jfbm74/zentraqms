/**
 * Unit tests for SectorSelectionStep component.
 * 
 * Tests sector selection, organization type selection, and form data handling.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { SectorSelectionStep } from '../steps/SectorSelectionStep';
import { SECTORS, SectorType, DEFAULT_FORM_DATA } from '../../../types/wizard.types';

// Mock the entire wizard types module
jest.mock('../../../types/wizard.types', () => ({
  ...jest.requireActual('../../../types/wizard.types'),
  SECTORS: [
    {
      id: 'HEALTHCARE',
      name: 'Salud',
      icon: 'ri-hospital-line',
      description: 'Instituciones de salud, clínicas, hospitales',
      types: [
        { value: 'ips', label: 'IPS - Institución Prestadora de Salud' },
        { value: 'eps', label: 'EPS - Entidad Promotora de Salud' },
        { value: 'hospital', label: 'Hospital' },
        { value: 'clinica', label: 'Clínica' }
      ],
      modules: ['SUH', 'PAMEC', 'Seguridad del Paciente'],
      integrations: ['REPS', 'SISPRO', 'ADRES']
    },
    {
      id: 'MANUFACTURING',
      name: 'Manufactura',
      icon: 'ri-settings-3-line',
      description: 'Empresas de producción y manufactura',
      types: [
        { value: 'empresa_privada', label: 'Empresa Privada' },
        { value: 'empresa_publica', label: 'Empresa Pública' },
        { value: 'cooperativa', label: 'Cooperativa' }
      ],
      modules: ['Producción', 'Control Calidad', 'Inventarios'],
      integrations: ['ISO 9001', 'ISO 14001']
    },
    {
      id: 'SERVICES',
      name: 'Servicios',
      icon: 'ri-service-line',
      description: 'Empresas de servicios profesionales',
      types: [
        { value: 'empresa_privada', label: 'Empresa Privada' },
        { value: 'fundacion', label: 'Fundación' },
        { value: 'ong', label: 'ONG' }
      ],
      modules: ['Proyectos', 'Satisfacción Cliente'],
      integrations: ['ITIL', 'ISO 27001']
    }
  ]
}));

// Mock props
const mockProps = {
  formData: DEFAULT_FORM_DATA,
  onUpdate: jest.fn(),
  onNext: jest.fn(),
  onPrevious: jest.fn(),
  errors: {},
  isLoading: false
};

describe('SectorSelectionStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders all available sectors', () => {
      render(<SectorSelectionStep {...mockProps} />);
      
      expect(screen.getByText('Salud')).toBeInTheDocument();
      expect(screen.getByText('Manufactura')).toBeInTheDocument();
      expect(screen.getByText('Servicios')).toBeInTheDocument();
    });

    test('renders sector descriptions', () => {
      render(<SectorSelectionStep {...mockProps} />);
      
      expect(screen.getByText('Instituciones de salud, clínicas, hospitales')).toBeInTheDocument();
      expect(screen.getByText('Empresas de producción y manufactura')).toBeInTheDocument();
      expect(screen.getByText('Empresas de servicios profesionales')).toBeInTheDocument();
    });

    test('renders sector icons', () => {
      render(<SectorSelectionStep {...mockProps} />);
      
      // Check that icon classes are applied
      expect(document.querySelector('.ri-hospital-line')).toBeInTheDocument();
      expect(document.querySelector('.ri-settings-3-line')).toBeInTheDocument();
      expect(document.querySelector('.ri-service-line')).toBeInTheDocument();
    });

    test('shows step title and instructions', () => {
      render(<SectorSelectionStep {...mockProps} />);
      
      expect(screen.getByText(/Seleccione el sector/i)).toBeInTheDocument();
      expect(screen.getByText(/Tipo de organización/i)).toBeInTheDocument();
    });
  });

  describe('Sector Selection', () => {
    test('calls onUpdate when sector is selected', async () => {
      const user = userEvent.setup();
      render(<SectorSelectionStep {...mockProps} />);
      
      const healthcareCard = screen.getByText('Salud').closest('.sector-card') || screen.getByText('Salud');
      await user.click(healthcareCard);
      
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        selectedSector: 'HEALTHCARE'
      });
    });

    test('highlights selected sector', () => {
      const propsWithSelection = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType
        }
      };
      
      render(<SectorSelectionStep {...propsWithSelection} />);
      
      const healthcareCard = screen.getByText('Salud').closest('[class*="selected"]');
      expect(healthcareCard).toBeInTheDocument();
    });

    test('shows organization types when sector is selected', () => {
      const propsWithSelection = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType
        }
      };
      
      render(<SectorSelectionStep {...propsWithSelection} />);
      
      expect(screen.getByText('IPS - Institución Prestadora de Salud')).toBeInTheDocument();
      expect(screen.getByText('EPS - Entidad Promotora de Salud')).toBeInTheDocument();
      expect(screen.getByText('Hospital')).toBeInTheDocument();
      expect(screen.getByText('Clínica')).toBeInTheDocument();
    });

    test('does not show organization types when no sector is selected', () => {
      render(<SectorSelectionStep {...mockProps} />);
      
      expect(screen.queryByText('IPS - Institución Prestadora de Salud')).not.toBeInTheDocument();
      expect(screen.queryByText('Empresa Privada')).not.toBeInTheDocument();
    });

    test('changes organization types when different sector is selected', async () => {
      const user = userEvent.setup();
      const propsWithSelection = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType
        }
      };
      
      const { rerender } = render(<SectorSelectionStep {...propsWithSelection} />);
      
      // Should show healthcare types
      expect(screen.getByText('IPS - Institución Prestadora de Salud')).toBeInTheDocument();
      
      // Select manufacturing sector
      const manufacturingCard = screen.getByText('Manufactura');
      await user.click(manufacturingCard);
      
      // Update props to reflect the change
      const updatedProps = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'MANUFACTURING' as SectorType
        }
      };
      
      rerender(<SectorSelectionStep {...updatedProps} />);
      
      // Should show manufacturing types
      expect(screen.getByText('Empresa Privada')).toBeInTheDocument();
      expect(screen.getByText('Empresa Pública')).toBeInTheDocument();
      expect(screen.queryByText('IPS - Institución Prestadora de Salud')).not.toBeInTheDocument();
    });
  });

  describe('Organization Type Selection', () => {
    const propsWithHealthcareSector = {
      ...mockProps,
      formData: {
        ...DEFAULT_FORM_DATA,
        selectedSector: 'HEALTHCARE' as SectorType
      }
    };

    test('calls onUpdate when organization type is selected', async () => {
      const user = userEvent.setup();
      render(<SectorSelectionStep {...propsWithHealthcareSector} />);
      
      const ipsOption = screen.getByLabelText('IPS - Institución Prestadora de Salud');
      await user.click(ipsOption);
      
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        selectedOrgType: 'ips'
      });
    });

    test('highlights selected organization type', () => {
      const propsWithBothSelections = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType,
          selectedOrgType: 'ips'
        }
      };
      
      render(<SectorSelectionStep {...propsWithBothSelections} />);
      
      const ipsRadio = screen.getByLabelText('IPS - Institución Prestadora de Salud') as HTMLInputElement;
      expect(ipsRadio.checked).toBe(true);
    });

    test('clears organization type when sector changes', async () => {
      const user = userEvent.setup();
      const propsWithBothSelections = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType,
          selectedOrgType: 'ips'
        }
      };
      
      render(<SectorSelectionStep {...propsWithBothSelections} />);
      
      // Select different sector
      const servicesCard = screen.getByText('Servicios');
      await user.click(servicesCard);
      
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        selectedSector: 'SERVICES',
        selectedOrgType: undefined // Should clear organization type
      });
    });
  });

  describe('Modules and Integrations Display', () => {
    test('shows sector modules when sector is selected', () => {
      const propsWithSelection = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType
        }
      };
      
      render(<SectorSelectionStep {...propsWithSelection} />);
      
      expect(screen.getByText('SUH')).toBeInTheDocument();
      expect(screen.getByText('PAMEC')).toBeInTheDocument();
      expect(screen.getByText('Seguridad del Paciente')).toBeInTheDocument();
    });

    test('shows sector integrations when sector is selected', () => {
      const propsWithSelection = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType
        }
      };
      
      render(<SectorSelectionStep {...propsWithSelection} />);
      
      expect(screen.getByText('REPS')).toBeInTheDocument();
      expect(screen.getByText('SISPRO')).toBeInTheDocument();
      expect(screen.getByText('ADRES')).toBeInTheDocument();
    });

    test('changes modules when different sector is selected', () => {
      const propsWithManufacturing = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'MANUFACTURING' as SectorType
        }
      };
      
      render(<SectorSelectionStep {...propsWithManufacturing} />);
      
      expect(screen.getByText('Producción')).toBeInTheDocument();
      expect(screen.getByText('Control Calidad')).toBeInTheDocument();
      expect(screen.getByText('Inventarios')).toBeInTheDocument();
      
      // Healthcare modules should not be visible
      expect(screen.queryByText('SUH')).not.toBeInTheDocument();
      expect(screen.queryByText('PAMEC')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('enables next button when both sector and organization type are selected', () => {
      const propsWithBothSelections = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType,
          selectedOrgType: 'ips'
        }
      };
      
      render(<SectorSelectionStep {...propsWithBothSelections} />);
      
      const nextButton = screen.getByRole('button', { name: /siguiente/i });
      expect(nextButton).not.toBeDisabled();
    });

    test('disables next button when sector is not selected', () => {
      render(<SectorSelectionStep {...mockProps} />);
      
      const nextButton = screen.getByRole('button', { name: /siguiente/i });
      expect(nextButton).toBeDisabled();
    });

    test('disables next button when organization type is not selected', () => {
      const propsWithOnlySector = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType
        }
      };
      
      render(<SectorSelectionStep {...propsWithOnlySector} />);
      
      const nextButton = screen.getByRole('button', { name: /siguiente/i });
      expect(nextButton).toBeDisabled();
    });

    test('calls onNext when next button is clicked', async () => {
      const user = userEvent.setup();
      const propsWithBothSelections = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType,
          selectedOrgType: 'ips'
        }
      };
      
      render(<SectorSelectionStep {...propsWithBothSelections} />);
      
      const nextButton = screen.getByRole('button', { name: /siguiente/i });
      await user.click(nextButton);
      
      expect(mockProps.onNext).toHaveBeenCalled();
    });

    test('calls onPrevious when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<SectorSelectionStep {...mockProps} />);
      
      const backButton = screen.getByRole('button', { name: /anterior/i });
      await user.click(backButton);
      
      expect(mockProps.onPrevious).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('displays sector selection error', () => {
      const propsWithErrors = {
        ...mockProps,
        errors: {
          selectedSector: 'Por favor seleccione un sector'
        }
      };
      
      render(<SectorSelectionStep {...propsWithErrors} />);
      
      expect(screen.getByText('Por favor seleccione un sector')).toBeInTheDocument();
    });

    test('displays organization type selection error', () => {
      const propsWithErrors = {
        ...mockProps,
        errors: {
          selectedOrgType: 'Por favor seleccione un tipo de organización'
        }
      };
      
      render(<SectorSelectionStep {...propsWithErrors} />);
      
      expect(screen.getByText('Por favor seleccione un tipo de organización')).toBeInTheDocument();
    });

    test('highlights sector cards with error state', () => {
      const propsWithErrors = {
        ...mockProps,
        errors: {
          selectedSector: 'Error message'
        }
      };
      
      render(<SectorSelectionStep {...propsWithErrors} />);
      
      // Check if error styling is applied
      expect(document.querySelector('.sector-selection')).toHaveClass('has-error');
    });
  });

  describe('Loading State', () => {
    test('disables interactions when loading', () => {
      const propsWithLoading = {
        ...mockProps,
        isLoading: true
      };
      
      render(<SectorSelectionStep {...propsWithLoading} />);
      
      const nextButton = screen.getByRole('button', { name: /siguiente/i });
      expect(nextButton).toBeDisabled();
      
      const backButton = screen.getByRole('button', { name: /anterior/i });
      expect(backButton).toBeDisabled();
    });

    test('shows loading indicator', () => {
      const propsWithLoading = {
        ...mockProps,
        isLoading: true
      };
      
      render(<SectorSelectionStep {...propsWithLoading} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for sector selection', () => {
      render(<SectorSelectionStep {...mockProps} />);
      
      expect(screen.getByRole('group', { name: /selección de sector/i })).toBeInTheDocument();
    });

    test('has proper ARIA labels for organization type selection', () => {
      const propsWithSector = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType
        }
      };
      
      render(<SectorSelectionStep {...propsWithSector} />);
      
      expect(screen.getByRole('radiogroup', { name: /tipo de organización/i })).toBeInTheDocument();
    });

    test('sector cards are keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<SectorSelectionStep {...mockProps} />);
      
      const healthcareCard = screen.getByText('Salud').closest('[role="button"]');
      expect(healthcareCard).toBeInTheDocument();
      
      // Should be focusable
      healthcareCard?.focus();
      expect(healthcareCard).toHaveFocus();
      
      // Should respond to Enter key
      await user.keyboard('{Enter}');
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        selectedSector: 'HEALTHCARE'
      });
    });

    test('organization type radio buttons are keyboard navigable', async () => {
      const user = userEvent.setup();
      const propsWithSector = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType
        }
      };
      
      render(<SectorSelectionStep {...propsWithSector} />);
      
      const ipsRadio = screen.getByLabelText('IPS - Institución Prestadora de Salud');
      
      // Should be focusable and selectable via keyboard
      await user.tab();
      expect(ipsRadio).toHaveFocus();
      
      await user.keyboard(' '); // Space to select
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        selectedOrgType: 'ips'
      });
    });
  });

  describe('Health Organization Special Cases', () => {
    test('shows health-specific information for healthcare sector', () => {
      const propsWithHealthcare = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType
        }
      };
      
      render(<SectorSelectionStep {...propsWithHealthcare} />);
      
      // Should show Colombian health system information
      expect(screen.getByText(/Sistema Único de Habilitación/i)).toBeInTheDocument();
      expect(screen.getByText(/REPS/i)).toBeInTheDocument();
    });

    test('shows IPS-specific information when IPS is selected', () => {
      const propsWithIPS = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType,
          selectedOrgType: 'ips'
        }
      };
      
      render(<SectorSelectionStep {...propsWithIPS} />);
      
      expect(screen.getByText(/Institución Prestadora de Servicios/i)).toBeInTheDocument();
      expect(screen.getByText(/habilitación/i)).toBeInTheDocument();
    });

    test('shows EPS-specific information when EPS is selected', () => {
      const propsWithEPS = {
        ...mockProps,
        formData: {
          ...DEFAULT_FORM_DATA,
          selectedSector: 'HEALTHCARE' as SectorType,
          selectedOrgType: 'eps'
        }
      };
      
      render(<SectorSelectionStep {...propsWithEPS} />);
      
      expect(screen.getByText(/Entidad Promotora de Salud/i)).toBeInTheDocument();
    });
  });
});