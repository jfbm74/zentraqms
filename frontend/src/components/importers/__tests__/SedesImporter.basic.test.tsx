/**
 * Basic Tests for SedesImporter Component
 * 
 * Tests basic rendering and functionality of the sedes importer
 * using native HTML with Bootstrap classes.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SedesImporter from '../SedesImporter';
import type { SedesImporterProps, SedeImportResponse } from '../../../types/sede.types';

// Mock dependencies
vi.mock('../../../hooks/useBootstrapTooltips', () => ({
  useBootstrapTooltips: vi.fn(),
}));

vi.mock('../../../services/sedeService', () => ({
  sedeService: {
    importSedes: vi.fn(),
    validateImport: vi.fn(),
  },
}));

// Mock file for testing
const createMockFile = (name: string, type: string, content: string = 'test,content') => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

describe('SedesImporter', () => {
  const defaultProps: SedesImporterProps = {
    organizationId: 'org-123',
    onImportComplete: vi.fn(),
    onCancel: vi.fn(),
    isOpen: true,
  };

  const mockImportResponse: SedeImportResponse = {
    success: true,
    message: 'Importación exitosa',
    imported_count: 5,
    error_count: 0,
    sedes: [],
    validation_results: [
      {
        row_index: 0,
        is_valid: true,
        data: {
          numero_sede: '001',
          nombre_sede: 'Sede Test',
          tipo_sede: 'principal',
          direccion: 'Calle 123',
          departamento: 'Cundinamarca',
          municipio: 'Bogotá',
          telefono_principal: '+57 300 123 4567',
          email: 'test@example.com',
          nombre_responsable: 'Juan Pérez',
          cargo_responsable: 'Director',
          estado: 'activa',
          numero_camas: 0,
          numero_consultorios: 0,
          numero_quirofanos: 0,
          horario_atencion: {},
          atencion_24_horas: false,
          es_sede_principal: true,
        },
      },
    ],
    total_rows: 1,
    valid_rows: 1,
    invalid_rows: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders importer when open', () => {
    render(<SedesImporter {...defaultProps} />);
    
    expect(screen.getByText('Seleccionar Archivo de Sedes')).toBeInTheDocument();
    expect(screen.getByText('Cargue un archivo CSV o Excel con la información de las sedes a importar')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SedesImporter {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Seleccionar Archivo de Sedes')).not.toBeInTheDocument();
  });

  it('shows upload step initially', () => {
    render(<SedesImporter {...defaultProps} />);
    
    expect(screen.getByText('Arrastre su archivo aquí')).toBeInTheDocument();
    expect(screen.getByText('o haga clic para seleccionar')).toBeInTheDocument();
    expect(screen.getByText('Seleccionar Archivo')).toBeInTheDocument();
  });

  it('renders progress steps correctly', () => {
    render(<SedesImporter {...defaultProps} />);
    
    expect(screen.getByText('Archivo')).toBeInTheDocument();
    expect(screen.getByText('Validar')).toBeInTheDocument();
    expect(screen.getByText('Revisar')).toBeInTheDocument();
    expect(screen.getByText('Importar')).toBeInTheDocument();
  });

  it('shows configuration options', () => {
    render(<SedesImporter {...defaultProps} />);
    
    expect(screen.getByText('Opciones de Importación')).toBeInTheDocument();
    expect(screen.getByText('Formato del Archivo')).toBeInTheDocument();
    expect(screen.getByLabelText('Sobrescribir sedes existentes')).toBeInTheDocument();
  });

  it('handles file selection via input', async () => {
    render(<SedesImporter {...defaultProps} />);
    
    const file = createMockFile('test.csv', 'text/csv');
    const fileInput = screen.getByRole('button', { name: 'Seleccionar Archivo' });
    
    // Mock the file input
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.click(fileInput);
    
    // Simulate file selection
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
      expect(screen.getByText(/Tamaño:/)).toBeInTheDocument();
      expect(screen.getByText('Formato detectado: CSV')).toBeInTheDocument();
    });
  });

  it('auto-detects file format from extension', async () => {
    render(<SedesImporter {...defaultProps} />);
    
    const excelFile = createMockFile('test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [excelFile],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      expect(screen.getByText('Formato detectado: EXCEL')).toBeInTheDocument();
    });
  });

  it('handles drag and drop', async () => {
    render(<SedesImporter {...defaultProps} />);
    
    const file = createMockFile('test.csv', 'text/csv');
    const dropZone = screen.getByText('Arrastre su archivo aquí').closest('div');
    
    // Mock drag and drop events
    const dragEnterEvent = new Event('dragenter', { bubbles: true });
    const dropEvent = new Event('drop', { bubbles: true });
    
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file],
      },
    });
    
    fireEvent(dropZone!, dragEnterEvent);
    fireEvent(dropZone!, dropEvent);
    
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });
  });

  it('validates file types', async () => {
    render(<SedesImporter {...defaultProps} />);
    
    const invalidFile = createMockFile('test.txt', 'text/plain');
    const dropZone = screen.getByText('Arrastre su archivo aquí').closest('div');
    
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [invalidFile],
      },
    });
    
    fireEvent(dropZone!, dropEvent);
    
    await waitFor(() => {
      expect(screen.getByText(/Tipo de archivo no válido/)).toBeInTheDocument();
    });
  });

  it('shows validation step after file selection', async () => {
    const { sedeService } = await import('../../../services/sedeService');
    (sedeService.importSedes as any).mockResolvedValue(mockImportResponse);
    
    render(<SedesImporter {...defaultProps} />);
    
    // Add file
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      expect(screen.getByText('Validar Archivo')).toBeInTheDocument();
    });
    
    // Click validate
    fireEvent.click(screen.getByText('Validar Archivo'));
    
    await waitFor(() => {
      expect(screen.getByText('Validando Datos')).toBeInTheDocument();
    });
  });

  it('shows review step after validation', async () => {
    const { sedeService } = await import('../../../services/sedeService');
    (sedeService.importSedes as any).mockResolvedValue(mockImportResponse);
    
    render(<SedesImporter {...defaultProps} />);
    
    // Add file and validate
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Validar Archivo'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Resultados de Validación')).toBeInTheDocument();
      expect(screen.getByText('1 Registros Válidos')).toBeInTheDocument();
      expect(screen.getByText('0 Registros con Errores')).toBeInTheDocument();
    });
  });

  it('displays validation statistics correctly', async () => {
    const { sedeService } = await import('../../../services/sedeService');
    (sedeService.importSedes as any).mockResolvedValue(mockImportResponse);
    
    render(<SedesImporter {...defaultProps} />);
    
    // Simulate reaching review step
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Validar Archivo'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('1 Registros Válidos')).toBeInTheDocument();
      expect(screen.getByText('1 Total Registros')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument(); // Success rate
    });
  });

  it('shows import button when validation passes', async () => {
    const { sedeService } = await import('../../../services/sedeService');
    (sedeService.importSedes as any).mockResolvedValue(mockImportResponse);
    
    render(<SedesImporter {...defaultProps} />);
    
    // Simulate reaching review step
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Validar Archivo'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Importar Sedes')).toBeInTheDocument();
    });
  });

  it('handles import process', async () => {
    const { sedeService } = await import('../../../services/sedeService');
    const onImportComplete = vi.fn();
    
    (sedeService.importSedes as any)
      .mockResolvedValueOnce(mockImportResponse) // For validation
      .mockResolvedValueOnce({ ...mockImportResponse, success: true }); // For import
    
    render(<SedesImporter {...defaultProps} onImportComplete={onImportComplete} />);
    
    // Complete the flow
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Validar Archivo'));
    });
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Importar Sedes'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Importando Sedes')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(onImportComplete).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
      }));
    });
  });

  it('handles validation errors', async () => {
    const errorResponse: SedeImportResponse = {
      success: false,
      message: 'Errores en validación',
      imported_count: 0,
      error_count: 1,
      validation_results: [
        {
          row_index: 0,
          is_valid: false,
          errors: {
            numero_sede: ['Este campo es obligatorio'],
            email: ['Formato de email inválido'],
          },
        },
      ],
      total_rows: 1,
      valid_rows: 0,
      invalid_rows: 1,
    };
    
    const { sedeService } = await import('../../../services/sedeService');
    (sedeService.importSedes as any).mockResolvedValue(errorResponse);
    
    render(<SedesImporter {...defaultProps} />);
    
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Validar Archivo'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Errores Encontrados (1)')).toBeInTheDocument();
      expect(screen.getByText('Este campo es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('Formato de email inválido')).toBeInTheDocument();
    });
  });

  it('shows template download option', () => {
    render(<SedesImporter {...defaultProps} />);
    
    expect(screen.getByText('Plantilla de Importación')).toBeInTheDocument();
    expect(screen.getByText('Descargar Plantilla')).toBeInTheDocument();
  });

  it('handles format selection', async () => {
    render(<SedesImporter {...defaultProps} />);
    
    const formatSelect = screen.getByLabelText('Formato del Archivo');
    
    fireEvent.change(formatSelect, { target: { value: 'excel' } });
    
    expect(formatSelect).toHaveValue('excel');
  });

  it('handles overwrite option', () => {
    render(<SedesImporter {...defaultProps} />);
    
    const overwriteCheckbox = screen.getByLabelText('Sobrescribir sedes existentes');
    
    expect(overwriteCheckbox).not.toBeChecked();
    
    fireEvent.click(overwriteCheckbox);
    
    expect(overwriteCheckbox).toBeChecked();
  });

  it('shows cancel button', () => {
    const onCancel = vi.fn();
    render(<SedesImporter {...defaultProps} onCancel={onCancel} />);
    
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('handles file removal', async () => {
    render(<SedesImporter {...defaultProps} />);
    
    // Add file first
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });
    
    // Remove file
    const removeButton = screen.getByText('Remover');
    fireEvent.click(removeButton);
    
    expect(screen.getByText('Arrastre su archivo aquí')).toBeInTheDocument();
  });

  it('shows navigation buttons correctly', async () => {
    const { sedeService } = await import('../../../services/sedeService');
    (sedeService.importSedes as any).mockResolvedValue(mockImportResponse);
    
    render(<SedesImporter {...defaultProps} />);
    
    // Initially no anterior button
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
    
    // Add file and validate
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Validar Archivo'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Anterior')).toBeInTheDocument();
    });
  });

  it('handles navigation back', async () => {
    const { sedeService } = await import('../../../services/sedeService');
    (sedeService.importSedes as any).mockResolvedValue(mockImportResponse);
    
    render(<SedesImporter {...defaultProps} />);
    
    // Go to review step
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Validar Archivo'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Resultados de Validación')).toBeInTheDocument();
    });
    
    // Go back
    fireEvent.click(screen.getByText('Anterior'));
    
    await waitFor(() => {
      expect(screen.getByText('Seleccionar Archivo de Sedes')).toBeInTheDocument();
    });
  });

  it('disables buttons during processing', async () => {
    const { sedeService } = await import('../../../services/sedeService');
    (sedeService.importSedes as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<SedesImporter {...defaultProps} />);
    
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Validar Archivo'));
    });
    
    // Buttons should be disabled during processing
    expect(screen.getByText('Cancelar')).toBeDisabled();
  });

  it('shows completion step after successful import', async () => {
    const { sedeService } = await import('../../../services/sedeService');
    (sedeService.importSedes as any)
      .mockResolvedValueOnce(mockImportResponse) // Validation
      .mockResolvedValueOnce({ ...mockImportResponse, success: true }); // Import
    
    render(<SedesImporter {...defaultProps} />);
    
    // Complete full flow
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => fireEvent.click(screen.getByText('Validar Archivo')));
    await waitFor(() => fireEvent.click(screen.getByText('Importar Sedes')));
    
    await waitFor(() => {
      expect(screen.getByText('¡Importación Completada!')).toBeInTheDocument();
      expect(screen.getByText('Finalizar')).toBeInTheDocument();
      expect(screen.getByText('Importar Más')).toBeInTheDocument();
    });
  });

  it('shows preview of valid records', async () => {
    const { sedeService } = await import('../../../services/sedeService');
    (sedeService.importSedes as any).mockResolvedValue(mockImportResponse);
    
    render(<SedesImporter {...defaultProps} />);
    
    const file = createMockFile('test.csv', 'text/csv');
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Validar Archivo'));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Registros a Importar (1)')).toBeInTheDocument();
      expect(screen.getByText('001')).toBeInTheDocument();
      expect(screen.getByText('Sede Test')).toBeInTheDocument();
      expect(screen.getByText('principal')).toBeInTheDocument();
    });
  });
});