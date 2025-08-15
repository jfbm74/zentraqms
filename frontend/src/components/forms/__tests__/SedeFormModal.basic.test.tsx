/**
 * Basic Tests for SedeFormModal Component
 * 
 * Tests basic rendering and functionality of the sede form modal
 * using native HTML with Bootstrap classes.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SedeFormModal from '../SedeFormModal';
import type { SedeFormModalProps, SedePrestadora } from '../../../types/sede.types';

// Mock dependencies
vi.mock('../../../hooks/useBootstrapTooltips', () => ({
  useBootstrapTooltips: vi.fn(),
}));

vi.mock('../../../services/sedeService', () => ({
  sedeService: {
    validateSedeForm: vi.fn(() => ({})),
  },
}));

vi.mock('../../common/InfoTooltip', () => {
  return {
    default: ({ content, ariaLabel }: { content: string; ariaLabel: string }) => (
      <span data-testid="info-tooltip" aria-label={ariaLabel}>
        {content}
      </span>
    ),
  };
});

describe('SedeFormModal', () => {
  const defaultProps: SedeFormModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    organizationId: 'org-123',
    isLoading: false,
  };

  const mockSede: Partial<SedePrestadora> = {
    id: 'sede-123',
    numero_sede: '001',
    codigo_prestador: 'PRES123456789',
    nombre_sede: 'Sede Principal',
    tipo_sede: 'principal',
    es_sede_principal: true,
    direccion: 'Calle 123 # 45-67',
    departamento: 'Cundinamarca',
    municipio: 'Bogotá',
    barrio: 'Centro',
    codigo_postal: '111111',
    telefono_principal: '+57 300 123 4567',
    telefono_secundario: '+57 301 234 5678',
    email: 'sede@example.com',
    nombre_responsable: 'Juan Pérez',
    cargo_responsable: 'Director Médico',
    telefono_responsable: '+57 302 345 6789',
    email_responsable: 'juan.perez@example.com',
    estado: 'activa',
    fecha_habilitacion: '2024-01-15',
    fecha_renovacion: '2025-01-15',
    numero_camas: 50,
    numero_consultorios: 10,
    numero_quirofanos: 5,
    horario_atencion: {},
    atencion_24_horas: true,
    observaciones: 'Sede principal con todos los servicios',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<SedeFormModal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nueva Sede Prestadora')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SedeFormModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows edit title when sede is provided', () => {
    render(<SedeFormModal {...defaultProps} sede={mockSede as SedePrestadora} />);
    
    expect(screen.getByText('Editar Sede Prestadora')).toBeInTheDocument();
  });

  it('renders step 1 form fields initially', () => {
    render(<SedeFormModal {...defaultProps} />);
    
    expect(screen.getByLabelText(/Número de Sede/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Código de Prestador/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de la Sede/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo de Sede/)).toBeInTheDocument();
  });

  it('pre-fills form when editing existing sede', () => {
    render(<SedeFormModal {...defaultProps} sede={mockSede as SedePrestadora} />);
    
    expect(screen.getByDisplayValue('001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PRES123456789')).toBeInTheDocument();
    
    const nameInput = screen.getByLabelText(/Nombre de la Sede/) as HTMLInputElement;
    expect(nameInput.value).toBe('Sede Principal');
    
    const typeSelect = screen.getByLabelText(/Tipo de Sede/) as HTMLSelectElement;
    expect(typeSelect.value).toBe('principal');
  });

  it('handles form input changes', async () => {
    render(<SedeFormModal {...defaultProps} />);
    
    const numeroSedeInput = screen.getByLabelText(/Número de Sede/) as HTMLInputElement;
    
    fireEvent.change(numeroSedeInput, { target: { value: '002' } });
    
    expect(numeroSedeInput.value).toBe('002');
  });

  it('shows validation errors for required fields', async () => {
    render(<SedeFormModal {...defaultProps} />);
    
    const nextButton = screen.getByText('Siguiente');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Número de sede es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('Código de prestador es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('Nombre de sede es obligatorio')).toBeInTheDocument();
    });
  });

  it('progresses through wizard steps', async () => {
    render(<SedeFormModal {...defaultProps} />);
    
    // Fill required fields for step 1
    fireEvent.change(screen.getByLabelText(/Número de Sede/), { target: { value: '001' } });
    fireEvent.change(screen.getByLabelText(/Código de Prestador/), { target: { value: 'PRES123456789' } });
    fireEvent.change(screen.getByLabelText(/Nombre de la Sede/), { target: { value: 'Test Sede' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Sede/), { target: { value: 'sucursal' } });
    
    const nextButton = screen.getByText('Siguiente');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Información de Ubicación')).toBeInTheDocument();
      expect(screen.getByLabelText(/Dirección/)).toBeInTheDocument();
    });
  });

  it('handles checkbox inputs correctly', () => {
    render(<SedeFormModal {...defaultProps} />);
    
    const principalCheckbox = screen.getByLabelText(/Es sede principal/) as HTMLInputElement;
    
    expect(principalCheckbox.checked).toBe(false);
    
    fireEvent.click(principalCheckbox);
    
    expect(principalCheckbox.checked).toBe(true);
  });

  it('handles close modal action', () => {
    const onCloseMock = vi.fn();
    render(<SedeFormModal {...defaultProps} onClose={onCloseMock} />);
    
    const closeButton = screen.getByLabelText('Cerrar modal');
    fireEvent.click(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledOnce();
  });

  it('shows loading state correctly', () => {
    render(<SedeFormModal {...defaultProps} isLoading={true} />);
    
    // Check that buttons are disabled during loading
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
    
    // The close button should be disabled
    const closeButton = screen.getByLabelText('Cerrar modal');
    expect(closeButton).toBeDisabled();
  });

  it('displays external errors', () => {
    const errors = {
      numero_sede: ['Este número ya existe'],
      general: ['Error general en el formulario'],
    };
    
    render(<SedeFormModal {...defaultProps} errors={errors} />);
    
    // Check that the numero_sede error is shown (it's on step 1)
    expect(screen.getByText('Este número ya existe')).toBeInTheDocument();
    
    // Check that general error is shown
    expect(screen.getByText('Error general en el formulario')).toBeInTheDocument();
  });

  it('shows progress steps indicator', () => {
    render(<SedeFormModal {...defaultProps} />);
    
    // Should show 4 steps - check by looking at the step numbers in the progress indicator
    expect(screen.getByText('Información Básica')).toBeInTheDocument();
    expect(screen.getByText('Ubicación')).toBeInTheDocument();
    expect(screen.getByText('Contacto')).toBeInTheDocument();
    expect(screen.getByText('Capacidad')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<SedeFormModal {...defaultProps} />);
    
    // Navigate to step 3 (contact information)
    // First fill step 1
    fireEvent.change(screen.getByLabelText(/Número de Sede/), { target: { value: '001' } });
    fireEvent.change(screen.getByLabelText(/Código de Prestador/), { target: { value: 'PRES123456789' } });
    fireEvent.change(screen.getByLabelText(/Nombre de la Sede/), { target: { value: 'Test Sede' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Sede/), { target: { value: 'sucursal' } });
    
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Dirección/)).toBeInTheDocument();
    });
    
    // Fill step 2
    fireEvent.change(screen.getByLabelText(/Dirección/), { target: { value: 'Calle 123' } });
    fireEvent.change(screen.getByLabelText(/Departamento/), { target: { value: 'Cundinamarca' } });
    fireEvent.change(screen.getByLabelText(/Municipio/), { target: { value: 'Bogotá' } });
    
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Email de la Sede/)).toBeInTheDocument();
    });
    
    // Test invalid email
    const emailInput = screen.getByLabelText(/Email de la Sede/);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      expect(screen.getByText('Formato de email inválido')).toBeInTheDocument();
    });
  });

  it('handles form submission', async () => {
    const onSaveMock = vi.fn();
    render(<SedeFormModal {...defaultProps} onSave={onSaveMock} sede={mockSede as SedePrestadora} />);
    
    // Navigate to final step
    fireEvent.click(screen.getByText('Siguiente')); // Step 2
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Siguiente')); // Step 3
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Siguiente')); // Step 4
    });
    
    await waitFor(() => {
      const saveButton = screen.getByText('Actualizar Sede');
      fireEvent.click(saveButton);
    });
    
    expect(onSaveMock).toHaveBeenCalledWith(expect.objectContaining({
      numero_sede: '001',
      codigo_prestador: 'PRES123456789',
      nombre_sede: 'Sede Principal',
      tipo_sede: 'principal',
    }));
  });

  it('formats phone number validation', async () => {
    render(<SedeFormModal {...defaultProps} />);
    
    // Navigate to contact step
    fireEvent.change(screen.getByLabelText(/Número de Sede/), { target: { value: '001' } });
    fireEvent.change(screen.getByLabelText(/Código de Prestador/), { target: { value: 'PRES123456789' } });
    fireEvent.change(screen.getByLabelText(/Nombre de la Sede/), { target: { value: 'Test Sede' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Sede/), { target: { value: 'sucursal' } });
    
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/Dirección/), { target: { value: 'Calle 123' } });
      fireEvent.change(screen.getByLabelText(/Departamento/), { target: { value: 'Cundinamarca' } });
      fireEvent.change(screen.getByLabelText(/Municipio/), { target: { value: 'Bogotá' } });
    });
    
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      const phoneInput = screen.getByLabelText(/Teléfono Principal/);
      fireEvent.change(phoneInput, { target: { value: '123' } }); // Invalid phone
    });
    
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      expect(screen.getByText('Formato de teléfono inválido')).toBeInTheDocument();
    });
  });

  it('handles numeric inputs for capacity', async () => {
    render(<SedeFormModal {...defaultProps} />);
    
    // Navigate to final step
    const steps = ['Siguiente', 'Siguiente', 'Siguiente'];
    
    // Fill required fields to reach final step
    fireEvent.change(screen.getByLabelText(/Número de Sede/), { target: { value: '001' } });
    fireEvent.change(screen.getByLabelText(/Código de Prestador/), { target: { value: 'PRES123456789' } });
    fireEvent.change(screen.getByLabelText(/Nombre de la Sede/), { target: { value: 'Test Sede' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Sede/), { target: { value: 'sucursal' } });
    
    for (const step of steps) {
      fireEvent.click(screen.getByText(step));
      
      if (step === 'Siguiente') {
        await waitFor(() => {
          const direccionField = screen.queryByLabelText(/Dirección/);
          if (direccionField) {
            fireEvent.change(direccionField, { target: { value: 'Calle 123' } });
            fireEvent.change(screen.getByLabelText(/Departamento/), { target: { value: 'Cundinamarca' } });
            fireEvent.change(screen.getByLabelText(/Municipio/), { target: { value: 'Bogotá' } });
          }
          
          const telefonoField = screen.queryByLabelText(/Teléfono Principal/);
          if (telefonoField) {
            fireEvent.change(telefonoField, { target: { value: '+57 300 123 4567' } });
            fireEvent.change(screen.getByLabelText(/Email de la Sede/), { target: { value: 'test@example.com' } });
            fireEvent.change(screen.getByLabelText(/Nombre del Responsable/), { target: { value: 'Juan Pérez' } });
            fireEvent.change(screen.getByLabelText(/Cargo del Responsable/), { target: { value: 'Director' } });
          }
        });
      }
    }
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Número de Camas/)).toBeInTheDocument();
    });
    
    const camasInput = screen.getByLabelText(/Número de Camas/) as HTMLInputElement;
    fireEvent.change(camasInput, { target: { value: '25' } });
    
    expect(camasInput.value).toBe('25');
  });

  it('shows appropriate success state for different actions', () => {
    const { rerender } = render(
      <SedeFormModal {...defaultProps} sede={mockSede as SedePrestadora} />
    );
    
    // Navigate to final step to see the save button text
    expect(screen.getByText('Editar Sede Prestadora')).toBeInTheDocument();
    
    // Test new sede
    rerender(<SedeFormModal {...defaultProps} />);
    expect(screen.getByText('Nueva Sede Prestadora')).toBeInTheDocument();
  });
});