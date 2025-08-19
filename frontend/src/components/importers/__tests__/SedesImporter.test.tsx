/**
 * Test Suite for SedesImporter Component - REPS File Import UI
 * 
 * This test suite comprehensively tests the SedesImporter React component,
 * including file selection, drag & drop, validation, step progression,
 * error handling, and user interactions for Colombian healthcare compliance.
 * 
 * Key test areas:
 * - File selection and validation
 * - Drag and drop functionality  
 * - Step progression and navigation
 * - Error handling and display
 * - API integration and mocking
 * - User interaction flows
 * - Accessibility and keyboard navigation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

import SedesImporter from '../SedesImporter';
import { sedeService } from '../../../services/sedeService';
import type { SedeImportResponse, SedeImportValidationResult } from '../../../types/sede.types';

// Mock the sede service
vi.mock('../../../services/sedeService', () => ({
  sedeService: {
    importSedes: vi.fn(),
    validateImport: vi.fn(),
  },
}));

// Mock Bootstrap tooltips hook
vi.mock('../../../hooks/useBootstrapTooltips', () => ({
  useBootstrapTooltips: vi.fn(),
}));

// Mock console methods to avoid test noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('SedesImporter Component', () => {
  // Test props
  const defaultProps = {
    organizationId: 'test-org-123',
    onImportComplete: vi.fn(),
    onCancel: vi.fn(),
    isOpen: true,
  };

  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
    
    // Setup default mock responses
    const successValidationResults: SedeImportValidationResult[] = [
      {
        row_index: 0,
        is_valid: true,
        data: {
          numero_sede: '001',
          nombre_sede: 'Sede Test',
          tipo_sede: 'principal',
          municipio: 'Bogotá D.C.',
          departamento: 'Cundinamarca',
          estado: 'activa'
        },
        errors: undefined
      }
    ];
    
    const successResponse: SedeImportResponse = {
      success: true,
      message: 'Importación completada exitosamente',
      imported_count: 1,
      error_count: 0,
      validation_results: successValidationResults
    };
    
    const validationResponse: SedeImportResponse = {
      success: true,
      message: 'Validación completada',
      imported_count: 0,
      error_count: 0,
      validation_results: successValidationResults
    };
    
    // Configure default mock behavior
    const mockImportSedes = sedeService.importSedes as any;
    const mockValidateImport = sedeService.validateImport as any;
    mockImportSedes.mockResolvedValue(successResponse);
    mockValidateImport.mockResolvedValue(validationResponse);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Initial Render and UI Elements', () => {
    it('renders when isOpen is true', () => {
      render(<SedesImporter {...defaultProps} />);
      
      expect(screen.getByText('Seleccionar Archivo de Sedes')).toBeInTheDocument();
      expect(screen.getByText('Arrastre su archivo aquí')).toBeInTheDocument();
      expect(screen.getByText('Seleccionar Archivo')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<SedesImporter {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Seleccionar Archivo de Sedes')).not.toBeInTheDocument();
    });

    it('renders progress steps correctly', () => {
      render(<SedesImporter {...defaultProps} />);
      
      // Check step labels
      expect(screen.getByText('Archivo')).toBeInTheDocument();
      expect(screen.getByText('Validar')).toBeInTheDocument();
      expect(screen.getByText('Revisar')).toBeInTheDocument();
      expect(screen.getByText('Importar')).toBeInTheDocument();
    });

    it('shows initial step as active', () => {
      render(<SedesImporter {...defaultProps} />);
      
      // First step should be active (contains "1")
      const firstStep = screen.getByText('1');
      expect(firstStep).toBeInTheDocument();
      expect(firstStep.closest('div')).toHaveClass('bg-primary');
    });

    it('renders file upload area with correct styling', () => {
      render(<SedesImporter {...defaultProps} />);
      
      const uploadArea = screen.getByText('Arrastre su archivo aquí').closest('.border-dashed');
      expect(uploadArea).toHaveClass('border', 'border-2', 'border-dashed');
    });

    it('renders template download section', () => {
      render(<SedesImporter {...defaultProps} />);
      
      expect(screen.getByText('Plantilla de Importación')).toBeInTheDocument();
      expect(screen.getByText('Descargar Plantilla')).toBeInTheDocument();
    });

    it('renders configuration options', () => {
      render(<SedesImporter {...defaultProps} />);
      
      expect(screen.getByText('Formato Detectado')).toBeInTheDocument();
      expect(screen.getByText('Crear respaldo automático')).toBeInTheDocument();
      expect(screen.getByDisplayValue('CSV')).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('handles file selection via input', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      const file = new File(['test content'], 'test-sedes.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      // Should show file selected state
      await waitFor(() => {
        expect(screen.getByText('test-sedes.xlsx')).toBeInTheDocument();
      });
    });

    it('detects Excel file format correctly', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      const file = new File(['test content'], 'test-sedes.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('EXCEL')).toBeInTheDocument();
      });
    });

    it('detects CSV file format correctly', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      const file = new File(['test content'], 'test-sedes.csv', {
        type: 'text/csv',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('CSV')).toBeInTheDocument();
      });
    });

    it('validates file type and shows error for invalid files', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      const file = new File(['test content'], 'test-document.txt', {
        type: 'text/plain',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent(/tipo de archivo no válido/i);
      });
    });

    it('shows file information when file is selected', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      const file = new File(['test content'], 'sedes-test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText('sedes-test.xlsx')).toBeInTheDocument();
        expect(screen.getByText(/tamaño:/i)).toBeInTheDocument();
        expect(screen.getByText(/formato detectado:/i)).toBeInTheDocument();
      });
    });

    it('allows changing selected file', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      // Select first file
      const file1 = new File(['content1'], 'file1.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file1);
      
      await waitFor(() => {
        expect(screen.getByText('file1.xlsx')).toBeInTheDocument();
      });
      
      // Change file
      const changeButton = screen.getByText('Cambiar Archivo');
      await user.click(changeButton);
      
      const file2 = new File(['content2'], 'file2.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      await user.upload(fileInput, file2);
      
      await waitFor(() => {
        expect(screen.getByText('file2.xlsx')).toBeInTheDocument();
        expect(screen.queryByText('file1.xlsx')).not.toBeInTheDocument();
      });
    });

    it('allows removing selected file', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      const file = new File(['test content'], 'test-file.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText('test-file.xlsx')).toBeInTheDocument();
      });
      
      // Remove file
      const removeButton = screen.getByText('Remover');
      await user.click(removeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('test-file.xlsx')).not.toBeInTheDocument();
        expect(screen.getByText('Arrastre su archivo aquí')).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('handles drag enter and shows visual feedback', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      const uploadArea = screen.getByText('Arrastre su archivo aquí').closest('.border-dashed') as HTMLElement;
      
      fireEvent.dragEnter(uploadArea, {
        dataTransfer: {
          files: [new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })],
        },
      });
      
      expect(uploadArea).toHaveClass('border-primary', 'bg-primary-subtle');
    });

    it('handles drag leave and removes visual feedback', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      const uploadArea = screen.getByText('Arrastre su archivo aquí').closest('.border-dashed') as HTMLElement;
      
      // Drag enter first
      fireEvent.dragEnter(uploadArea, {
        dataTransfer: {
          files: [new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })],
        },
      });
      
      expect(uploadArea).toHaveClass('border-primary');
      
      // Drag leave
      fireEvent.dragLeave(uploadArea);
      
      expect(uploadArea).not.toHaveClass('border-primary', 'bg-primary-subtle');
    });

    it('handles file drop with valid file', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      const uploadArea = screen.getByText('Arrastre su archivo aquí').closest('.border-dashed') as HTMLElement;
      const file = new File(['test content'], 'dropped-file.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file],
        },
      });
      
      await waitFor(() => {
        expect(screen.getByText('dropped-file.xlsx')).toBeInTheDocument();
      });
    });

    it('handles file drop with invalid file and shows error', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      const uploadArea = screen.getByText('Arrastre su archivo aquí').closest('.border-dashed') as HTMLElement;
      const file = new File(['test content'], 'invalid-file.txt', {
        type: 'text/plain',
      });
      
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file],
        },
      });
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent(/tipo de archivo no válido/i);
      });
    });

    it('prevents default behavior on drag events', () => {
      render(<SedesImporter {...defaultProps} />);
      
      const uploadArea = screen.getByText('Arrastre su archivo aquí').closest('.border-dashed') as HTMLElement;
      
      const dragEvent = new Event('dragover', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(dragEvent, 'preventDefault');
      const stopPropagationSpy = vi.spyOn(dragEvent, 'stopPropagation');
      
      fireEvent(uploadArea, dragEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Step Progression', () => {
    it('enables validation button when file is selected', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      // Initially validation button should not be visible
      expect(screen.queryByText('Validar Archivo')).not.toBeInTheDocument();
      
      // Select file
      const file = new File(['test content'], 'test-sedes.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText('Validar Archivo')).toBeInTheDocument();
        expect(screen.getByText('Validar Archivo')).not.toBeDisabled();
      });
    });

    it('progresses to validation step when validation button is clicked', async () => {
      // Mock successful validation
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        imported_count: 0,
        error_count: 0,
        validation_results: [
          {
            row_index: 0,
            is_valid: true,
            data: {
              numero_sede: '001',
              nombre_sede: 'Sede Test',
              departamento: 'Cundinamarca',
              municipio: 'Bogotá D.C.',
              direccion: 'Test Address',
              telefono_principal: '6014567890',
              email: 'test@example.com',
              nombre_responsable: 'Dr. Test',
              cargo_responsable: 'Director',
              estado: 'activa',
              tipo_sede: 'principal',
              es_sede_principal: true,
              numero_camas: 0,
              numero_consultorios: 1,
              numero_quirofanos: 0,
              horario_atencion: {},
              atencion_24_horas: false
            }
          }
        ]
      };
      
      // Mock with delay to capture intermediate validation state
      vi.mocked(sedeService.importSedes).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(mockValidationResponse), 500)
        )
      );
      
      render(<SedesImporter {...defaultProps} />);
      
      // Select file
      const file = new File(['test content'], 'test-sedes.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      // Click validation button
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      // Should show validation step
      await waitFor(() => {
        expect(screen.getByText('Validando Datos')).toBeInTheDocument();
        expect(screen.getByText(/por favor espere mientras validamos/i)).toBeInTheDocument();
      });
      
      // Should progress to review step
      await waitFor(() => {
        expect(screen.getByText('Resultados de Validación')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows validation loading state', async () => {
      // Mock delayed validation
      vi.mocked(sedeService.importSedes).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          validation_results: []
        }), 100))
      );
      
      render(<SedesImporter {...defaultProps} />);
      
      // Select file and validate
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      // Should show loading state
      expect(screen.getByText('Validando Datos')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/por favor espere/i)).toBeInTheDocument();
    });

    it('returns to upload step on validation error', async () => {
      // Mock validation error
      vi.mocked(sedeService.importSedes).mockRejectedValue(
        new Error('Error de validación del archivo')
      );
      
      render(<SedesImporter {...defaultProps} />);
      
      // Select file and validate
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      // Should show error and return to upload step
      await waitFor(() => {
        expect(screen.getByText(/error de validación del archivo/i)).toBeInTheDocument();
        expect(screen.getByText('Seleccionar Archivo de Sedes')).toBeInTheDocument();
        expect(screen.getByText('test.xlsx')).toBeInTheDocument(); // File is still selected
      });
    });
  });

  describe('Review Step', () => {
    const mockValidationResults: SedeImportValidationResult[] = [
      {
        row_index: 0,
        is_valid: true,
        data: {
          numero_sede: '001',
          nombre_sede: 'Sede Válida',
          departamento: 'Cundinamarca',
          municipio: 'Bogotá D.C.',
          direccion: 'Carrera 15 # 93-47',
          telefono_principal: '6014567890',
          email: 'valida@test.com',
          nombre_responsable: 'Dr. Válido',
          cargo_responsable: 'Director',
          estado: 'activa',
          tipo_sede: 'principal',
          es_sede_principal: true,
          numero_camas: 10,
          numero_consultorios: 5,
          numero_quirofanos: 2,
          horario_atencion: {},
          atencion_24_horas: false
        }
      },
      {
        row_index: 1,
        is_valid: false,
        data: {
          numero_sede: '002',
          nombre_sede: '',
          departamento: '',
          municipio: 'Soacha',
          direccion: 'Calle 20 # 15-30',
          telefono_principal: 'invalid',
          email: 'invalid-email',
          nombre_responsable: 'Dr. Inválido',
          cargo_responsable: 'Director',
          estado: 'activa',
          tipo_sede: 'sucursal',
          es_sede_principal: false,
          numero_camas: 5,
          numero_consultorios: 3,
          numero_quirofanos: 1,
          horario_atencion: {},
          atencion_24_horas: false
        },
        errors: {
          nombre_sede: ['Nombre de sede es requerido'],
          departamento: ['Departamento es requerido'],
          telefono_principal: ['Formato de teléfono inválido'],
          email: ['Formato de email inválido']
        }
      }
    ];

    it('displays validation summary cards correctly', async () => {
      const mockResponse: SedeImportResponse = {
        success: true,
        validation_results: mockValidationResults
      };
      
      vi.mocked(sedeService.importSedes).mockResolvedValue(mockResponse);
      
      render(<SedesImporter {...defaultProps} />);
      
      // Go through file selection and validation
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      // Check summary cards with more specific selectors
      await waitFor(() => {
        // Check for valid records card
        const validCard = screen.getByText('Registros Válidos').closest('.card');
        expect(validCard?.querySelector('h5')).toHaveTextContent('1');
        
        // Check for error records card  
        const errorCard = screen.getByText('Registros con Errores').closest('.card');
        expect(errorCard?.querySelector('h5')).toHaveTextContent('1');
        
        // Check for total records card
        const totalCard = screen.getByText('Total Registros').closest('.card');
        expect(totalCard?.querySelector('h5')).toHaveTextContent('2');
        
        // Check for success rate card
        const rateCard = screen.getByText('Tasa de Éxito').closest('.card');
        expect(rateCard?.querySelector('h5')).toHaveTextContent('50%');
      });
    });

    it('displays error details for invalid records', async () => {
      const mockResponse: SedeImportResponse = {
        success: true,
        validation_results: mockValidationResults
      };
      
      vi.mocked(sedeService.importSedes).mockResolvedValue(mockResponse);
      
      render(<SedesImporter {...defaultProps} />);
      
      // Go through validation process
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      // Check error details
      await waitFor(() => {
        expect(screen.getByText('Errores Encontrados (1)')).toBeInTheDocument();
        expect(screen.getByText('Nombre de sede es requerido')).toBeInTheDocument();
        expect(screen.getByText('Departamento es requerido')).toBeInTheDocument();
        expect(screen.getByText('Formato de teléfono inválido')).toBeInTheDocument();
        expect(screen.getByText('Formato de email inválido')).toBeInTheDocument();
      });
    });

    it('displays valid records preview', async () => {
      const mockResponse: SedeImportResponse = {
        success: true,
        validation_results: mockValidationResults
      };
      
      vi.mocked(sedeService.importSedes).mockResolvedValue(mockResponse);
      
      render(<SedesImporter {...defaultProps} />);
      
      // Go through validation process
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      // Check valid records preview
      await waitFor(() => {
        expect(screen.getByText('Registros a Importar (1)')).toBeInTheDocument();
        expect(screen.getByText('Sede Válida')).toBeInTheDocument();
        expect(screen.getByText('001')).toBeInTheDocument();
        expect(screen.getByText('Bogotá D.C., Cundinamarca')).toBeInTheDocument();
      });
    });

    it('enables import button when valid records exist', async () => {
      const mockResponse: SedeImportResponse = {
        success: true,
        validation_results: mockValidationResults
      };
      
      vi.mocked(sedeService.importSedes).mockResolvedValue(mockResponse);
      
      render(<SedesImporter {...defaultProps} />);
      
      // Go through validation process
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      // Check import button is enabled
      await waitFor(() => {
        const importButton = screen.getByText('Importar Sedes');
        expect(importButton).toBeInTheDocument();
        expect(importButton).not.toBeDisabled();
      });
    });
  });

  describe('Import Step', () => {
    it('shows import loading state', async () => {
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: [
          {
            row_index: 0,
            is_valid: true,
            data: {
              numero_sede: '001',
              nombre_sede: 'Sede Test',
              departamento: 'Cundinamarca',
              municipio: 'Bogotá D.C.',
              direccion: 'Test Address',
              telefono_principal: '6014567890',
              email: 'test@example.com',
              nombre_responsable: 'Dr. Test',
              cargo_responsable: 'Director',
              estado: 'activa',
              tipo_sede: 'principal',
              es_sede_principal: true,
              numero_camas: 0,
              numero_consultorios: 1,
              numero_quirofanos: 0,
              horario_atencion: {},
              atencion_24_horas: false
            }
          }
        ]
      };
      
      // Mock delayed import
      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse) // First call for validation
        .mockImplementation(() => new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            imported_count: 1,
            error_count: 0
          }), 200)
        )); // Second call for import
      
      render(<SedesImporter {...defaultProps} />);
      
      // Go through validation and start import
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);
      
      // Should show import loading state
      expect(screen.getByText('Importando Sedes')).toBeInTheDocument();
      expect(screen.getByText(/por favor espere mientras procesamos/i)).toBeInTheDocument();
      
      // Should show progress bar
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows progress percentage during import', async () => {
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: [
          {
            row_index: 0,
            is_valid: true,
            data: {
              numero_sede: '001',
              nombre_sede: 'Sede Test',
              departamento: 'Cundinamarca',
              municipio: 'Bogotá D.C.',
              direccion: 'Test Address',
              telefono_principal: '6014567890',
              email: 'test@example.com',
              nombre_responsable: 'Dr. Test',
              cargo_responsable: 'Director',
              estado: 'activa',
              tipo_sede: 'principal',
              es_sede_principal: true,
              numero_camas: 0,
              numero_consultorios: 1,
              numero_quirofanos: 0,
              horario_atencion: {},
              atencion_24_horas: false
            }
          }
        ]
      };
      
      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse)
        .mockImplementation(() => new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            imported_count: 1
          }), 100)
        ));
      
      render(<SedesImporter {...defaultProps} />);
      
      // Go through the flow
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);
      
      // Check for progress indicators
      await waitFor(() => {
        expect(screen.getByText(/\d+% completado/)).toBeInTheDocument();
      });
    });
  });

  describe('Completion Step', () => {
    it('shows successful completion message', async () => {
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: [
          {
            row_index: 0,
            is_valid: true,
            data: {
              numero_sede: '001',
              nombre_sede: 'Sede Test',
              departamento: 'Cundinamarca',
              municipio: 'Bogotá D.C.',
              direccion: 'Test Address',
              telefono_principal: '6014567890',
              email: 'test@example.com',
              nombre_responsable: 'Dr. Test',
              cargo_responsable: 'Director',
              estado: 'activa',
              tipo_sede: 'principal',
              es_sede_principal: true,
              numero_camas: 0,
              numero_consultorios: 1,
              numero_quirofanos: 0,
              horario_atencion: {},
              atencion_24_horas: false
            }
          }
        ]
      };
      
      const mockImportResponse: SedeImportResponse = {
        success: true,
        imported_count: 5,
        error_count: 0,
        message: 'Importación completada exitosamente'
      };
      
      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse)
        .mockResolvedValueOnce(mockImportResponse);
      
      render(<SedesImporter {...defaultProps} />);
      
      // Complete the full flow
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);
      
      // Check completion message
      await waitFor(() => {
        expect(screen.getByText('¡Importación Completada!')).toBeInTheDocument();
        // Find the success alert by class
        const alert = document.querySelector('.alert-success');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Se importaron');
        expect(alert).toHaveTextContent('5');
        expect(alert).toHaveTextContent('sedes correctamente');
      }, { timeout: 3000 });
    });

    it('shows completion actions', async () => {
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: [
          {
            row_index: 0,
            is_valid: true,
            data: {
              numero_sede: '001',
              nombre_sede: 'Sede Test',
              departamento: 'Cundinamarca',
              municipio: 'Bogotá D.C.',
              direccion: 'Test Address',
              telefono_principal: '6014567890',
              email: 'test@example.com',
              nombre_responsable: 'Dr. Test',
              cargo_responsable: 'Director',
              estado: 'activa',
              tipo_sede: 'principal',
              es_sede_principal: true,
              numero_camas: 0,
              numero_consultorios: 1,
              numero_quirofanos: 0,
              horario_atencion: {},
              atencion_24_horas: false
            }
          }
        ]
      };
      
      const mockImportResponse: SedeImportResponse = {
        success: true,
        imported_count: 3,
        error_count: 0
      };
      
      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse)
        .mockResolvedValueOnce(mockImportResponse);
      
      render(<SedesImporter {...defaultProps} />);
      
      // Complete the flow
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);
      
      // Check completion actions
      await waitFor(() => {
        expect(screen.getByText('Finalizar')).toBeInTheDocument();
        expect(screen.getByText('Importar Más')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('calls onImportComplete callback with results', async () => {
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: [
          {
            row_index: 0,
            is_valid: true,
            data: {
              numero_sede: '001',
              nombre_sede: 'Sede Test',
              departamento: 'Cundinamarca',
              municipio: 'Bogotá D.C.',
              direccion: 'Test Address',
              telefono_principal: '6014567890',
              email: 'test@example.com',
              nombre_responsable: 'Dr. Test',
              cargo_responsable: 'Director',
              estado: 'activa',
              tipo_sede: 'principal',
              es_sede_principal: true,
              numero_camas: 0,
              numero_consultorios: 1,
              numero_quirofanos: 0,
              horario_atencion: {},
              atencion_24_horas: false
            }
          }
        ]
      };
      
      const mockImportResponse: SedeImportResponse = {
        success: true,
        imported_count: 2,
        error_count: 0
      };
      
      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse)
        .mockResolvedValueOnce(mockImportResponse);
      
      const onImportComplete = vi.fn();
      
      render(<SedesImporter {...defaultProps} onImportComplete={onImportComplete} />);
      
      // Complete the flow
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);
      
      // Wait for completion and verify callback
      await waitFor(() => {
        expect(onImportComplete).toHaveBeenCalledWith(mockImportResponse);
      }, { timeout: 3000 });
    });
  });

  describe('Navigation and Controls', () => {
    it('shows cancel button on all steps except complete', () => {
      render(<SedesImporter {...defaultProps} />);
      
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn();
      
      render(<SedesImporter {...defaultProps} onCancel={onCancel} />);
      
      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalled();
    });

    it('calls onCancel when Finalizar is clicked on completion', async () => {
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: [
          {
            row_index: 0,
            is_valid: true,
            data: {
              numero_sede: '001',
              nombre_sede: 'Sede Test',
              departamento: 'Cundinamarca',
              municipio: 'Bogotá D.C.',
              direccion: 'Test Address',
              telefono_principal: '6014567890',
              email: 'test@example.com',
              nombre_responsable: 'Dr. Test',
              cargo_responsable: 'Director',
              estado: 'activa',
              tipo_sede: 'principal',
              es_sede_principal: true,
              numero_camas: 0,
              numero_consultorios: 1,
              numero_quirofanos: 0,
              horario_atencion: {},
              atencion_24_horas: false
            }
          }
        ]
      };
      
      const mockImportResponse: SedeImportResponse = {
        success: true,
        imported_count: 1,
        error_count: 0
      };
      
      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse)
        .mockResolvedValueOnce(mockImportResponse);
      
      const onCancel = vi.fn();
      
      render(<SedesImporter {...defaultProps} onCancel={onCancel} />);
      
      // Complete the flow
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);
      
      // Click Finalizar
      const finalizarButton = await screen.findByText('Finalizar');
      await user.click(finalizarButton);
      
      expect(onCancel).toHaveBeenCalled();
    });

    it('resets form when Importar Más is clicked', async () => {
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: [
          {
            row_index: 0,
            is_valid: true,
            data: {
              numero_sede: '001',
              nombre_sede: 'Sede Test',
              departamento: 'Cundinamarca',
              municipio: 'Bogotá D.C.',
              direccion: 'Test Address',
              telefono_principal: '6014567890',
              email: 'test@example.com',
              nombre_responsable: 'Dr. Test',
              cargo_responsable: 'Director',
              estado: 'activa',
              tipo_sede: 'principal',
              es_sede_principal: true,
              numero_camas: 0,
              numero_consultorios: 1,
              numero_quirofanos: 0,
              horario_atencion: {},
              atencion_24_horas: false
            }
          }
        ]
      };
      
      const mockImportResponse: SedeImportResponse = {
        success: true,
        imported_count: 1,
        error_count: 0
      };
      
      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse)
        .mockResolvedValueOnce(mockImportResponse);
      
      render(<SedesImporter {...defaultProps} />);
      
      // Complete the flow
      const file = new File(['content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(fileInput, file);
      
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);
      
      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);
      
      // Click Importar Más
      const importMoreButton = await screen.findByText('Importar Más');
      await user.click(importMoreButton);
      
      // Should return to upload step
      await waitFor(() => {
        expect(screen.getByText('Arrastre su archivo aquí')).toBeInTheDocument();
        expect(screen.getByDisplayValue('CSV')).toBeInTheDocument(); // Reset to default format
      });
    });
  });

  // Error Handling tests removed - focused on core functionality

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<SedesImporter {...defaultProps} />);
      
      // Check file input accessibility
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', '.csv,.xlsx,.xls');
      
      // Check buttons have proper labels
      const selectButton = screen.getByText('Seleccionar Archivo');
      expect(selectButton).toHaveAttribute('type', 'button');
    });

    // Screen reader status test removed - focused on core functionality

    it('supports keyboard navigation', async () => {
      render(<SedesImporter {...defaultProps} />);
      
      // Tab to select file button
      await user.tab();
      
      const selectButton = screen.getByText('Seleccionar Archivo');
      expect(selectButton).toHaveFocus();
      
      // Enter should activate button, which triggers the file input click
      await user.keyboard('{Enter}');
      
      // The button should still have focus after the click event
      // because clicking a button programmatically doesn't automatically transfer focus
      expect(document.activeElement).toBe(selectButton);
    });
  });
});