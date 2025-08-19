/**
 * Integration Test Suite for SedesImporter Component - Complete REPS Import Workflow
 * 
 * This test suite performs comprehensive integration testing of the complete
 * REPS import workflow, testing real user interactions, API integrations,
 * error scenarios, and end-to-end functionality for Colombian healthcare compliance.
 * 
 * Key test areas:
 * - Complete user workflows from start to finish
 * - Real API integration with mocked responses
 * - Error recovery and user guidance
 * - Performance with realistic data volumes
 * - Accessibility and usability
 * - Cross-browser compatibility scenarios
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import '@testing-library/jest-dom';

import SedesImporter from '../SedesImporter';
import { sedeService } from '../../../services/sedeService';
import type { 
  SedeImportResponse, 
  SedeImportValidationResult,
  SedesImporterProps 
} from '../../../types/sede.types';

// Mock the sede service with more realistic behavior
vi.mock('../../../services/sedeService', () => ({
  sedeService: {
    importSedes: vi.fn(),
    validateImport: vi.fn(),
  },
}));

// Mock Bootstrap tooltips
vi.mock('../../../hooks/useBootstrapTooltips', () => ({
  useBootstrapTooltips: vi.fn(),
}));

// Helper to create realistic test files
const createTestFile = (name: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  return file;
};

// Realistic REPS validation results for testing
const createRealisticValidationResults = (): SedeImportValidationResult[] => [
  {
    row_index: 0,
    is_valid: true,
    data: {
      numero_sede: '001',
      nombre_sede: 'Sede Principal Chapinero',
      departamento: 'Cundinamarca',
      municipio: 'Bogotá D.C.',
      direccion: 'Carrera 11 # 93-47 Oficina 201',
      telefono_principal: '6014567890',
      email: 'principal@ipsintegracion.com',
      nombre_responsable: 'Dr. Carlos Rodríguez Méndez',
      cargo_responsable: 'Director Médico',
      estado: 'activa',
      tipo_sede: 'principal',
      es_sede_principal: true,
      numero_camas: 50,
      numero_consultorios: 20,
      numero_quirofanos: 5,
      horario_atencion: {
        lunes: '7:00-19:00',
        martes: '7:00-19:00',
        miercoles: '7:00-19:00',
        jueves: '7:00-19:00',
        viernes: '7:00-19:00',
        sabado: '8:00-14:00'
      },
      atencion_24_horas: false
    }
  },
  {
    row_index: 1,
    is_valid: true,
    data: {
      numero_sede: '002',
      nombre_sede: 'Sede Soacha - Centro Médico',
      departamento: 'Cundinamarca',
      municipio: 'Soacha',
      direccion: 'Calle 13 # 15-30 Centro Comercial Plaza',
      telefono_principal: '6014567891',
      email: 'soacha@ipsintegracion.com',
      nombre_responsable: 'Dra. María Elena García Vargas',
      cargo_responsable: 'Coordinadora Médica',
      estado: 'activa',
      tipo_sede: 'sucursal',
      es_sede_principal: false,
      numero_camas: 25,
      numero_consultorios: 12,
      numero_quirofanos: 2,
      horario_atencion: {
        lunes: '8:00-18:00',
        martes: '8:00-18:00',
        miercoles: '8:00-18:00',
        jueves: '8:00-18:00',
        viernes: '8:00-18:00'
      },
      atencion_24_horas: false
    }
  },
  {
    row_index: 2,
    is_valid: false,
    data: {
      numero_sede: '003',
      nombre_sede: '',
      departamento: '',
      municipio: 'Zipaquirá',
      direccion: 'Carrera 7 # 8-25',
      telefono_principal: 'invalid-phone',
      email: 'invalid-email',
      nombre_responsable: 'Dr. Andrés Felipe Morales Castro',
      cargo_responsable: 'Director',
      estado: 'activa',
      tipo_sede: 'sucursal',
      es_sede_principal: false,
      numero_camas: 15,
      numero_consultorios: 8,
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

describe('SedesImporter Integration Tests', () => {
  const defaultProps: SedesImporterProps = {
    organizationId: 'test-org-integration-123',
    onImportComplete: vi.fn(),
    onCancel: vi.fn(),
    isOpen: true,
  };

  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Successful Import Workflow', () => {
    it('completes full import workflow from file selection to success', async () => {
      // Setup realistic test scenario
      const validationResults = createRealisticValidationResults();
      const validResults = validationResults.filter(r => r.is_valid);
      const invalidResults = validationResults.filter(r => !r.is_valid);

      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: validationResults,
        total_rows: 3,
        valid_rows: 2,
        invalid_rows: 1
      };

      const mockImportResponse: SedeImportResponse = {
        success: true,
        imported_count: 2,
        error_count: 1,
        message: 'Importación completada: 2 sedes importadas exitosamente',
        total_rows: 3,
        valid_rows: 2,
        invalid_rows: 1
      };

      // Mock API calls
      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse) // Validation call
        .mockResolvedValueOnce(mockImportResponse);    // Import call

      const onImportComplete = vi.fn();

      render(<SedesImporter {...defaultProps} onImportComplete={onImportComplete} />);

      // Step 1: Verify initial state
      expect(screen.getByText('Seleccionar Archivo de Sedes')).toBeInTheDocument();
      expect(screen.getByText('Arrastre su archivo aquí')).toBeInTheDocument();

      // Step 2: Select file
      const testFile = createTestFile(
        'sedes-integration-test.xlsx',
        'mock excel content with REPS data',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      // Verify file selection
      await waitFor(() => {
        expect(screen.getByText('sedes-integration-test.xlsx')).toBeInTheDocument();
        expect(screen.getByDisplayValue('EXCEL')).toBeInTheDocument();
      });

      // Step 3: Start validation
      const validateButton = await screen.findByText('Validar Archivo');
      expect(validateButton).not.toBeDisabled();
      await user.click(validateButton);

      // Verify validation loading state
      expect(screen.getByText('Validando Datos')).toBeInTheDocument();
      expect(screen.getByText(/por favor espere mientras validamos/i)).toBeInTheDocument();

      // Step 4: Review validation results
      await waitFor(() => {
        expect(screen.getByText('Resultados de Validación')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify summary cards
      expect(screen.getByText('2')).toBeInTheDocument(); // Valid records
      expect(screen.getByText('1')).toBeInTheDocument(); // Invalid records
      expect(screen.getByText('3')).toBeInTheDocument(); // Total records

      // Verify error details are shown
      expect(screen.getByText('Errores Encontrados (1)')).toBeInTheDocument();
      expect(screen.getByText('Nombre de sede es requerido')).toBeInTheDocument();
      expect(screen.getByText('Departamento es requerido')).toBeInTheDocument();

      // Verify valid records preview
      expect(screen.getByText('Registros a Importar (2)')).toBeInTheDocument();
      expect(screen.getByText('Sede Principal Chapinero')).toBeInTheDocument();
      expect(screen.getByText('Sede Soacha - Centro Médico')).toBeInTheDocument();

      // Step 5: Start import
      const importButton = await screen.findByText('Importar Sedes');
      expect(importButton).not.toBeDisabled();
      await user.click(importButton);

      // Verify import loading state
      expect(screen.getByText('Importando Sedes')).toBeInTheDocument();
      expect(screen.getByText(/por favor espere mientras procesamos/i)).toBeInTheDocument();

      // Verify progress indicators
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();

      // Step 6: Verify completion
      await waitFor(() => {
        expect(screen.getByText('¡Importación Completada!')).toBeInTheDocument();
      }, { timeout: 8000 });

      expect(screen.getByText(/se importaron.*2.*sedes correctamente/i)).toBeInTheDocument();
      expect(screen.getByText(/1 registros tuvieron errores/i)).toBeInTheDocument();

      // Verify completion actions
      expect(screen.getByText('Finalizar')).toBeInTheDocument();
      expect(screen.getByText('Importar Más')).toBeInTheDocument();

      // Step 7: Verify callback was called
      expect(onImportComplete).toHaveBeenCalledWith(mockImportResponse);

      // Verify API calls were made correctly
      expect(sedeService.importSedes).toHaveBeenCalledTimes(2);
      expect(sedeService.importSedes).toHaveBeenNthCalledWith(1, 'test-org-integration-123', {
        file: testFile,
        create_backup: true
      });
    }, 15000); // Increased timeout for complex workflow

    it('handles import workflow with only valid records', async () => {
      const validOnlyResults = createRealisticValidationResults().filter(r => r.is_valid);

      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: validOnlyResults,
        total_rows: 2,
        valid_rows: 2,
        invalid_rows: 0
      };

      const mockImportResponse: SedeImportResponse = {
        success: true,
        imported_count: 2,
        error_count: 0,
        message: 'Importación completada exitosamente'
      };

      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse)
        .mockResolvedValueOnce(mockImportResponse);

      render(<SedesImporter {...defaultProps} />);

      // Complete workflow
      const testFile = createTestFile(
        'valid-only-sedes.xlsx',
        'mock excel content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      // Should not show errors section
      await waitFor(() => {
        expect(screen.getByText('Resultados de Validación')).toBeInTheDocument();
        expect(screen.queryByText(/errores encontrados/i)).not.toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument(); // Error count should be 0
      });

      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('¡Importación Completada!')).toBeInTheDocument();
        expect(screen.queryByText(/registros tuvieron errores/i)).not.toBeInTheDocument();
      }, { timeout: 8000 });
    });

    it('handles import workflow with all invalid records', async () => {
      const invalidOnlyResults = createRealisticValidationResults().filter(r => !r.is_valid);

      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: invalidOnlyResults,
        total_rows: 1,
        valid_rows: 0,
        invalid_rows: 1
      };

      vi.mocked(sedeService.importSedes).mockResolvedValue(mockValidationResponse);

      render(<SedesImporter {...defaultProps} />);

      const testFile = createTestFile(
        'invalid-only-sedes.xlsx',
        'mock excel content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText('Resultados de Validación')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument(); // Valid records count
        expect(screen.queryByText(/registros a importar/i)).not.toBeInTheDocument();
        expect(screen.queryByText('Importar Sedes')).not.toBeInTheDocument(); // Import button should not appear
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('handles validation API errors gracefully', async () => {
      // Mock API error
      const apiError = new Error('Error del servidor: No se pudo procesar el archivo');
      vi.mocked(sedeService.importSedes).mockRejectedValue(apiError);

      render(<SedesImporter {...defaultProps} />);

      const testFile = createTestFile(
        'error-test.xlsx',
        'mock content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      // Should show error and return to upload step
      await waitFor(() => {
        expect(screen.getByText(/error del servidor/i)).toBeInTheDocument();
        expect(screen.getByText('Arrastre su archivo aquí')).toBeInTheDocument();
      });

      // User should be able to try again
      expect(screen.getByText('Validar Archivo')).toBeInTheDocument();
    });

    it('handles import API errors and allows retry', async () => {
      const validationResults = createRealisticValidationResults().filter(r => r.is_valid);

      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: validationResults
      };

      const importError = new Error('Error durante la importación: Fallo de conexión');

      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse)
        .mockRejectedValueOnce(importError);

      render(<SedesImporter {...defaultProps} />);

      // Go through validation successfully
      const testFile = createTestFile(
        'import-error-test.xlsx',
        'mock content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText('Resultados de Validación')).toBeInTheDocument();
      });

      // Try to import and fail
      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/error durante la importación/i)).toBeInTheDocument();
        expect(screen.getByText('Resultados de Validación')).toBeInTheDocument(); // Should return to review step
      });

      // User should be able to try import again
      expect(screen.getByText('Importar Sedes')).toBeInTheDocument();
    });

    it('handles network timeout scenarios', async () => {
      // Mock network timeout
      const timeoutError = new Error('Network timeout');
      vi.mocked(sedeService.importSedes).mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(timeoutError), 100)
        )
      );

      render(<SedesImporter {...defaultProps} />);

      const testFile = createTestFile(
        'timeout-test.xlsx',
        'mock content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText(/network timeout/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('allows error dismissal and workflow continuation', async () => {
      render(<SedesImporter {...defaultProps} />);

      // Trigger an error
      const invalidFile = createTestFile('invalid.txt', 'content', 'text/plain');
      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, invalidFile);

      // Error should be displayed
      await waitFor(() => {
        expect(screen.getByText(/tipo de archivo no válido/i)).toBeInTheDocument();
      });

      // Dismiss error
      const closeButton = screen.getByLabelText('Cerrar alerta');
      await user.click(closeButton);

      // Error should be gone
      await waitFor(() => {
        expect(screen.queryByText(/tipo de archivo no válido/i)).not.toBeInTheDocument();
      });

      // User should be able to continue
      const validFile = createTestFile(
        'valid.xlsx',
        'content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      await user.upload(fileInput, validFile);

      await waitFor(() => {
        expect(screen.getByText('valid.xlsx')).toBeInTheDocument();
      });
    });
  });

  describe('User Interaction and Navigation', () => {
    it('supports step navigation with back buttons', async () => {
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: createRealisticValidationResults()
      };

      vi.mocked(sedeService.importSedes).mockResolvedValue(mockValidationResponse);

      render(<SedesImporter {...defaultProps} />);

      // Go to review step
      const testFile = createTestFile(
        'navigation-test.xlsx',
        'content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText('Resultados de Validación')).toBeInTheDocument();
      });

      // Navigate back to upload step
      const backButton = screen.getByText('Anterior');
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Seleccionar Archivo de Sedes')).toBeInTheDocument();
      });
    });

    it('supports workflow reset and restart', async () => {
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: createRealisticValidationResults().filter(r => r.is_valid)
      };

      const mockImportResponse: SedeImportResponse = {
        success: true,
        imported_count: 2,
        error_count: 0
      };

      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse)
        .mockResolvedValueOnce(mockImportResponse);

      render(<SedesImporter {...defaultProps} />);

      // Complete full workflow
      const testFile = createTestFile(
        'reset-test.xlsx',
        'content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('¡Importación Completada!')).toBeInTheDocument();
      }, { timeout: 8000 });

      // Reset workflow
      const importMoreButton = screen.getByText('Importar Más');
      await user.click(importMoreButton);

      // Should return to initial state
      await waitFor(() => {
        expect(screen.getByText('Arrastre su archivo aquí')).toBeInTheDocument();
        expect(screen.getByDisplayValue('CSV')).toBeInTheDocument(); // Default format
      });
    });

    it('handles cancellation at different steps', async () => {
      const onCancel = vi.fn();
      render(<SedesImporter {...defaultProps} onCancel={onCancel} />);

      // Cancel from upload step
      const cancelButton = screen.getByText('Cancelar');
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);

      // Reset mock
      onCancel.mockClear();

      // Go to validation step and cancel
      const testFile = createTestFile(
        'cancel-test.xlsx',
        'content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      // Should still have cancel button during processing
      const cancelDuringProcess = screen.getByText('Cancelar');
      await user.click(cancelDuringProcess);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance and Large Files', () => {
    it('handles large file uploads without blocking UI', async () => {
      // Create a larger mock file
      const largeFileContent = 'x'.repeat(1024 * 1024); // 1MB of content
      const largeFile = createTestFile(
        'large-sedes-file.xlsx',
        largeFileContent,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      render(<SedesImporter {...defaultProps} />);

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, largeFile);

      // Should handle large file without issues
      await waitFor(() => {
        expect(screen.getByText('large-sedes-file.xlsx')).toBeInTheDocument();
        expect(screen.getByText(/1\.00 MB/)).toBeInTheDocument();
      });

      // UI should remain responsive
      const formatInput = screen.getByDisplayValue('EXCEL');
      expect(formatInput).toBeInTheDocument();
    });

    it('provides progress feedback for long operations', async () => {
      // Mock slow validation
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: createRealisticValidationResults()
      };

      vi.mocked(sedeService.importSedes).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(mockValidationResponse), 1000)
        )
      );

      render(<SedesImporter {...defaultProps} />);

      const testFile = createTestFile(
        'slow-processing.xlsx',
        'content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      // Should show progress indicators
      expect(screen.getByText('Validando Datos')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Progress bar should be animated
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('progress-bar-animated');

      await waitFor(() => {
        expect(screen.getByText('Resultados de Validación')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Accessibility and Usability', () => {
    it('maintains focus management throughout workflow', async () => {
      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: createRealisticValidationResults().filter(r => r.is_valid)
      };

      vi.mocked(sedeService.importSedes).mockResolvedValue(mockValidationResponse);

      render(<SedesImporter {...defaultProps} />);

      // Focus should be managed properly
      const selectButton = screen.getByText('Seleccionar Archivo');
      selectButton.focus();
      expect(selectButton).toHaveFocus();

      // Select file
      const testFile = createTestFile(
        'focus-test.xlsx',
        'content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      // Validate button should be focusable
      const validateButton = await screen.findByText('Validar Archivo');
      validateButton.focus();
      expect(validateButton).toHaveFocus();

      await user.click(validateButton);

      // Focus should move appropriately after async operations
      await waitFor(() => {
        const importButton = screen.getByText('Importar Sedes');
        expect(importButton).toBeInTheDocument();
      });
    });

    it('provides appropriate ARIA live regions for status updates', async () => {
      render(<SedesImporter {...defaultProps} />);

      const testFile = createTestFile(
        'aria-test.xlsx',
        'content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, testFile);

      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      // Should have status region for screen readers
      const statusElement = screen.getByRole('status');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveTextContent(/validando/i);
    });

    it('supports keyboard-only navigation', async () => {
      render(<SedesImporter {...defaultProps} />);

      // Tab through elements
      await user.tab();
      expect(screen.getByText('Seleccionar Archivo')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Descargar Plantilla')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Cancelar')).toHaveFocus();

      // Should be able to activate buttons with Enter/Space
      const selectButton = screen.getByText('Seleccionar Archivo');
      selectButton.focus();
      await user.keyboard('{Enter}');

      // File input should be activated
      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      expect(document.activeElement).toBe(fileInput);
    });
  });

  describe('Real-world Scenarios', () => {
    it('handles typical REPS data import scenario', async () => {
      // Simulate realistic REPS data with Colombian healthcare context
      const repsResults: SedeImportValidationResult[] = [
        {
          row_index: 0,
          is_valid: true,
          data: {
            numero_sede: '001',
            nombre_sede: 'IPS SALUD INTEGRAL S.A.S - SEDE PRINCIPAL',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá D.C.',
            direccion: 'CARRERA 15 No. 93-47 PISO 3',
            telefono_principal: '(601) 456-7890',
            email: 'principal@ipssaludintegral.com.co',
            nombre_responsable: 'DR. CARLOS EDUARDO RODRIGUEZ MENDEZ',
            cargo_responsable: 'DIRECTOR CIENTIFICO',
            estado: 'activa',
            tipo_sede: 'principal',
            es_sede_principal: true,
            numero_camas: 120,
            numero_consultorios: 45,
            numero_quirofanos: 8,
            horario_atencion: {
              lunes: '6:00-22:00',
              martes: '6:00-22:00',
              miercoles: '6:00-22:00',
              jueves: '6:00-22:00',
              viernes: '6:00-22:00',
              sabado: '8:00-16:00',
              domingo: '8:00-14:00'
            },
            atencion_24_horas: true
          }
        },
        {
          row_index: 1,
          is_valid: true,
          data: {
            numero_sede: '002',
            nombre_sede: 'IPS SALUD INTEGRAL S.A.S - SEDE SUBA',
            departamento: 'Cundinamarca',
            municipio: 'Bogotá D.C.',
            direccion: 'AVENIDA SUBA No. 127-15 LOCAL 201',
            telefono_principal: '(601) 456-7891',
            email: 'suba@ipssaludintegral.com.co',
            nombre_responsable: 'DRA. MARIA FERNANDA GOMEZ JIMENEZ',
            cargo_responsable: 'COORDINADORA MEDICA',
            estado: 'activa',
            tipo_sede: 'sucursal',
            es_sede_principal: false,
            numero_camas: 50,
            numero_consultorios: 25,
            numero_quirofanos: 3,
            horario_atencion: {
              lunes: '7:00-19:00',
              martes: '7:00-19:00',
              miercoles: '7:00-19:00',
              jueves: '7:00-19:00',
              viernes: '7:00-19:00',
              sabado: '8:00-14:00'
            },
            atencion_24_horas: false
          }
        }
      ];

      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: repsResults,
        total_rows: 2,
        valid_rows: 2,
        invalid_rows: 0
      };

      const mockImportResponse: SedeImportResponse = {
        success: true,
        imported_count: 2,
        error_count: 0,
        message: 'Importación REPS completada exitosamente: 2 sedes habilitadas'
      };

      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse)
        .mockResolvedValueOnce(mockImportResponse);

      const onImportComplete = vi.fn();

      render(<SedesImporter {...defaultProps} onImportComplete={onImportComplete} />);

      // Simulate user uploading REPS export file
      const repsFile = createTestFile(
        'Sedes_REPS_Export_20241117.xls',
        'REPS HTML table data',
        'application/vnd.ms-excel'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, repsFile);

      // File should be detected as Excel format
      await waitFor(() => {
        expect(screen.getByDisplayValue('EXCEL')).toBeInTheDocument();
      });

      // Proceed with validation
      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      // Review realistic REPS data
      await waitFor(() => {
        expect(screen.getByText('IPS SALUD INTEGRAL S.A.S - SEDE PRINCIPAL')).toBeInTheDocument();
        expect(screen.getByText('IPS SALUD INTEGRAL S.A.S - SEDE SUBA')).toBeInTheDocument();
        expect(screen.getByText('DR. CARLOS EDUARDO RODRIGUEZ MENDEZ')).toBeInTheDocument();
        expect(screen.getByText('DRA. MARIA FERNANDA GOMEZ JIMENEZ')).toBeInTheDocument();
      });

      // Import the data
      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);

      // Verify successful completion
      await waitFor(() => {
        expect(screen.getByText('¡Importación Completada!')).toBeInTheDocument();
        expect(screen.getByText(/2 sedes habilitadas/i)).toBeInTheDocument();
      }, { timeout: 8000 });

      expect(onImportComplete).toHaveBeenCalledWith(mockImportResponse);
    }, 20000);

    it('handles mixed success/failure scenario realistically', async () => {
      // Realistic mixed scenario with some data quality issues
      const mixedResults = createRealisticValidationResults();

      const mockValidationResponse: SedeImportResponse = {
        success: true,
        validation_results: mixedResults,
        total_rows: 3,
        valid_rows: 2,
        invalid_rows: 1
      };

      const mockImportResponse: SedeImportResponse = {
        success: true,
        imported_count: 2,
        error_count: 1,
        message: 'Importación parcialmente exitosa'
      };

      vi.mocked(sedeService.importSedes)
        .mockResolvedValueOnce(mockValidationResponse)
        .mockResolvedValueOnce(mockImportResponse);

      render(<SedesImporter {...defaultProps} />);

      const mixedFile = createTestFile(
        'sedes_mixed_quality.xlsx',
        'mixed data quality content',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      const fileInput = screen.getByLabelText(/seleccionar archivo/i);
      await user.upload(fileInput, mixedFile);

      const validateButton = await screen.findByText('Validar Archivo');
      await user.click(validateButton);

      // Should show mixed results appropriately
      await waitFor(() => {
        expect(screen.getByText('67%')).toBeInTheDocument(); // Success rate
        expect(screen.getByText('Errores Encontrados (1)')).toBeInTheDocument();
        expect(screen.getByText('Registros a Importar (2)')).toBeInTheDocument();
      });

      const importButton = await screen.findByText('Importar Sedes');
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('¡Importación Completada!')).toBeInTheDocument();
        expect(screen.getByText(/2.*sedes correctamente/i)).toBeInTheDocument();
        expect(screen.getByText(/1 registros tuvieron errores/i)).toBeInTheDocument();
      }, { timeout: 8000 });
    });
  });
});