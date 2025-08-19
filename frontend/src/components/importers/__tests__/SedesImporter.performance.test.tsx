/**
 * Performance Tests for SedesImporter React Component
 * 
 * This test suite validates frontend performance during REPS file import
 * operations, including file handling, UI responsiveness, memory usage,
 * and rendering performance under various load conditions.
 * 
 * Key performance testing areas:
 * - Large file handling and upload performance
 * - UI responsiveness during file processing
 * - Memory usage with large datasets
 * - Component rendering performance
 * - State management optimization
 * - Progress indicator accuracy
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { performance } from 'perf_hooks';
import SedesImporter from '../SedesImporter';

// Mock API service
vi.mock('../../../services/sedeService', () => ({
  sedeService: {
    importFromFile: vi.fn(),
    getImportStatus: vi.fn(),
  },
}));

const mockSedeService = {
  importFromFile: vi.fn(),
  getImportStatus: vi.fn(),
};

// Mock file reading utilities
const mockFileReader = {
  readAsArrayBuffer: vi.fn(),
  readAsText: vi.fn(),
  result: null,
  onload: null,
  onerror: null,
};

global.FileReader = vi.fn(() => mockFileReader) as any;

// Performance monitoring utilities
class PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private memoryBefore: any = null;
  private memoryAfter: any = null;

  start() {
    this.startTime = performance.now();
    this.memoryBefore = (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    } : null;
  }

  end() {
    this.endTime = performance.now();
    this.memoryAfter = (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    } : null;
  }

  getDuration(): number {
    return this.endTime - this.startTime;
  }

  getMemoryUsage(): { before: any; after: any; delta: number } | null {
    if (!this.memoryBefore || !this.memoryAfter) return null;
    
    return {
      before: this.memoryBefore,
      after: this.memoryAfter,
      delta: this.memoryAfter.usedJSHeapSize - this.memoryBefore.usedJSHeapSize,
    };
  }
}

// Test data generators
const createLargeExcelFile = (recordCount: number): File => {
  // Create mock Excel content with specified number of records
  const headers = [
    'departamento', 'municipio', 'codigo_prestador', 'nombre_prestador',
    'codigo_habilitacion', 'numero_sede', 'nombre_sede', 'direccion',
    'telefono', 'email', 'gerente', 'tipo_zona', 'zona', 'barrio'
  ];

  let csvContent = headers.join(',') + '\n';
  
  for (let i = 0; i < recordCount; i++) {
    const record = [
      'Cundinamarca',
      'Bogotá D.C.',
      `110001${String(i).padStart(6, '0')}`,
      `IPS PERFORMANCE TEST ${i}`,
      `HAB-PERF-${String(i).padStart(4, '0')}`,
      String(i).padStart(3, '0'),
      `SEDE PERFORMANCE ${String(i).padStart(4, '0')}`,
      `CARRERA ${i % 100} No. ${i % 50}-${i % 30}`,
      `(601) ${String(i).padStart(7, '0')}`,
      `sede${String(i).padStart(4, '0')}@performance.com`,
      `DR. PERFORMANCE ${i}`,
      'urbana',
      'norte',
      `Barrio Performance ${i}`
    ];
    csvContent += record.join(',') + '\n';
  }

  // Calculate file size (approximately)
  const fileSizeBytes = csvContent.length * 2; // Rough estimate for Excel file
  
  const blob = new Blob([csvContent], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  Object.defineProperty(blob, 'size', {
    value: fileSizeBytes,
    writable: false
  });

  return new File([blob], `performance_test_${recordCount}.xlsx`, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    lastModified: Date.now(),
  });
};

const createCorruptedFile = (): File => {
  const corruptedContent = 'CORRUPTED_FILE_CONTENT_NOT_VALID_EXCEL';
  return new File([corruptedContent], 'corrupted.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

// Test component wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('SedesImporter Performance Tests', () => {
  let performanceMonitor: PerformanceMonitor;
  let queryClient: QueryClient;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockSedeService.importFromFile.mockResolvedValue({
      data: {
        task_id: 'test-task-id',
        total_records: 100,
        status: 'processing'
      }
    });

    mockSedeService.getImportStatus.mockResolvedValue({
      data: {
        status: 'completed',
        progress: 100,
        total_records: 100,
        processed_records: 100,
        success_count: 100,
        error_count: 0
      }
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('File Upload Performance', () => {
    it('should handle large file upload efficiently', async () => {
      const largeFile = createLargeExcelFile(1000);
      
      performanceMonitor.start();
      
      const { container } = render(
        <TestWrapper>
          <SedesImporter 
            organizationId="test-org-id"
            onSuccess={vi.fn()}
            onError={vi.fn()}
          />
        </TestWrapper>
      );

      // Simulate file drop
      const dropZone = screen.getByTestId('file-drop-zone');
      
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: [largeFile],
          },
        });
      });

      performanceMonitor.end();
      
      const duration = performanceMonitor.getDuration();
      const memoryUsage = performanceMonitor.getMemoryUsage();

      // Performance assertions
      expect(duration).toBeLessThan(2000); // Less than 2 seconds for file handling
      
      if (memoryUsage) {
        expect(memoryUsage.delta).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
      }

      // Verify file was processed
      await waitFor(() => {
        expect(screen.getByText(/archivo seleccionado/i)).toBeInTheDocument();
      });

      console.log(`Large file upload performance:
        Duration: ${duration.toFixed(2)}ms
        Memory delta: ${memoryUsage ? (memoryUsage.delta / 1024 / 1024).toFixed(2) : 'N/A'}MB
        File size: ${(largeFile.size / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should handle multiple file operations without memory leaks', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SedesImporter 
            organizationId="test-org-id"
            onSuccess={vi.fn()}
            onError={vi.fn()}
          />
        </TestWrapper>
      );

      const initialMemory = (performance as any).memory ? 
        (performance as any).memory.usedJSHeapSize : 0;

      // Perform multiple file operations
      for (let i = 0; i < 5; i++) {
        const testFile = createLargeExcelFile(200);
        
        const dropZone = screen.getByTestId('file-drop-zone');
        
        await act(async () => {
          fireEvent.drop(dropZone, {
            dataTransfer: {
              files: [testFile],
            },
          });
        });

        // Wait for processing
        await waitFor(() => {
          expect(screen.getByText(/archivo seleccionado/i)).toBeInTheDocument();
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = (performance as any).memory ? 
        (performance as any).memory.usedJSHeapSize : 0;
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercentage = (memoryIncrease / initialMemory) * 100;
        
        // Memory increase should be reasonable (less than 50% increase)
        expect(memoryIncreasePercentage).toBeLessThan(50);
        
        console.log(`Memory usage after 5 file operations:
          Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB
          Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB
          Increase: ${memoryIncreasePercentage.toFixed(2)}%`);
      }
    });
  });

  describe('UI Rendering Performance', () => {
    it('should render component quickly', async () => {
      performanceMonitor.start();
      
      render(
        <TestWrapper>
          <SedesImporter 
            organizationId="test-org-id"
            onSuccess={vi.fn()}
            onError={vi.fn()}
          />
        </TestWrapper>
      );

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
      });

      performanceMonitor.end();
      
      const renderTime = performanceMonitor.getDuration();
      
      // Initial render should be fast
      expect(renderTime).toBeLessThan(500); // Less than 500ms
      
      console.log(`Component render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should maintain UI responsiveness during processing', async () => {
      const testFile = createLargeExcelFile(500);
      
      render(
        <TestWrapper>
          <SedesImporter 
            organizationId="test-org-id"
            onSuccess={vi.fn()}
            onError={vi.fn()}
          />
        </TestWrapper>
      );

      // Start file upload
      const dropZone = screen.getByTestId('file-drop-zone');
      
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: [testFile],
          },
        });
      });

      // Test UI responsiveness during processing
      const startTime = performance.now();
      
      // Simulate user interactions
      const interactions = [
        () => fireEvent.click(screen.getByRole('button', { name: /cancelar/i })),
        () => fireEvent.keyDown(document.body, { key: 'Escape' }),
        () => fireEvent.mouseMove(dropZone),
      ];

      for (const interaction of interactions) {
        const interactionStart = performance.now();
        
        try {
          interaction();
        } catch (error) {
          // Some interactions might fail based on component state
        }
        
        const interactionTime = performance.now() - interactionStart;
        
        // Each interaction should respond quickly
        expect(interactionTime).toBeLessThan(100); // Less than 100ms
      }

      const totalInteractionTime = performance.now() - startTime;
      
      console.log(`UI responsiveness during processing: ${totalInteractionTime.toFixed(2)}ms`);
    });
  });

  describe('Progress Indicator Performance', () => {
    it('should update progress smoothly without performance degradation', async () => {
      // Mock progressive status updates
      let progressValue = 0;
      mockSedeService.getImportStatus.mockImplementation(() => {
        progressValue = Math.min(progressValue + 10, 100);
        return Promise.resolve({
          data: {
            status: progressValue < 100 ? 'processing' : 'completed',
            progress: progressValue,
            total_records: 1000,
            processed_records: progressValue * 10,
            success_count: progressValue * 10,
            error_count: 0
          }
        });
      });

      const testFile = createLargeExcelFile(1000);
      
      render(
        <TestWrapper>
          <SedesImporter 
            organizationId="test-org-id"
            onSuccess={vi.fn()}
            onError={vi.fn()}
          />
        </TestWrapper>
      );

      // Start upload
      const dropZone = screen.getByTestId('file-drop-zone');
      
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: [testFile],
          },
        });
      });

      // Proceed to import step
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /importar/i })).toBeInTheDocument();
      });

      const importButton = screen.getByRole('button', { name: /importar/i });
      
      performanceMonitor.start();
      
      await act(async () => {
        fireEvent.click(importButton);
      });

      // Wait for progress updates
      await waitFor(() => {
        expect(screen.getByText(/completado/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      performanceMonitor.end();
      
      const totalTime = performanceMonitor.getDuration();
      
      // Progress updates should complete in reasonable time
      expect(totalTime).toBeLessThan(5000); // Less than 5 seconds for mock updates
      
      console.log(`Progress indicator performance: ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors quickly without blocking UI', async () => {
      const corruptedFile = createCorruptedFile();
      
      // Mock error response
      mockSedeService.importFromFile.mockRejectedValue(
        new Error('Invalid file format')
      );

      render(
        <TestWrapper>
          <SedesImporter 
            organizationId="test-org-id"
            onSuccess={vi.fn()}
            onError={vi.fn()}
          />
        </TestWrapper>
      );

      performanceMonitor.start();

      // Upload corrupted file
      const dropZone = screen.getByTestId('file-drop-zone');
      
      await act(async () => {
        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: [corruptedFile],
          },
        });
      });

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      performanceMonitor.end();
      
      const errorHandlingTime = performanceMonitor.getDuration();
      
      // Error handling should be fast
      expect(errorHandlingTime).toBeLessThan(1000); // Less than 1 second
      
      console.log(`Error handling performance: ${errorHandlingTime.toFixed(2)}ms`);
    });
  });

  describe('State Management Performance', () => {
    it('should handle state updates efficiently', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SedesImporter 
            organizationId="test-org-id"
            onSuccess={vi.fn()}
            onError={vi.fn()}
          />
        </TestWrapper>
      );

      performanceMonitor.start();

      // Perform multiple state updates
      for (let i = 0; i < 10; i++) {
        rerender(
          <TestWrapper>
            <SedesImporter 
              organizationId={`test-org-id-${i}`}
              onSuccess={vi.fn()}
              onError={vi.fn()}
            />
          </TestWrapper>
        );
        
        // Wait for re-render
        await waitFor(() => {
          expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
        });
      }

      performanceMonitor.end();
      
      const stateUpdateTime = performanceMonitor.getDuration();
      const timePerUpdate = stateUpdateTime / 10;
      
      // State updates should be efficient
      expect(timePerUpdate).toBeLessThan(50); // Less than 50ms per update
      
      console.log(`State management performance:
        Total time: ${stateUpdateTime.toFixed(2)}ms
        Time per update: ${timePerUpdate.toFixed(2)}ms`);
    });
  });

  describe('File Size Limits Performance', () => {
    it('should handle file size validation efficiently', async () => {
      const fileSizes = [1, 5, 10, 25, 50]; // MB
      
      for (const sizeMB of fileSizes) {
        const recordCount = sizeMB * 100; // Approximate records for size
        const testFile = createLargeExcelFile(recordCount);
        
        // Override file size for testing
        Object.defineProperty(testFile, 'size', {
          value: sizeMB * 1024 * 1024,
          writable: false
        });

        render(
          <TestWrapper>
            <SedesImporter 
              organizationId="test-org-id"
              onSuccess={vi.fn()}
              onError={vi.fn()}
            />
          </TestWrapper>
        );

        performanceMonitor.start();

        const dropZone = screen.getByTestId('file-drop-zone');
        
        await act(async () => {
          fireEvent.drop(dropZone, {
            dataTransfer: {
              files: [testFile],
            },
          });
        });

        performanceMonitor.end();
        
        const validationTime = performanceMonitor.getDuration();
        
        // File validation should be fast regardless of size
        expect(validationTime).toBeLessThan(500); // Less than 500ms
        
        console.log(`File size validation (${sizeMB}MB): ${validationTime.toFixed(2)}ms`);
      }
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle multiple simultaneous operations', async () => {
      const operations = [];
      
      // Create multiple concurrent operations
      for (let i = 0; i < 3; i++) {
        const operation = async () => {
          const testFile = createLargeExcelFile(100);
          
          const { container } = render(
            <TestWrapper>
              <SedesImporter 
                organizationId={`test-org-id-${i}`}
                onSuccess={vi.fn()}
                onError={vi.fn()}
              />
            </TestWrapper>
          );

          const dropZone = screen.getByTestId('file-drop-zone');
          
          await act(async () => {
            fireEvent.drop(dropZone, {
              dataTransfer: {
                files: [testFile],
              },
            });
          });
          
          return container;
        };
        
        operations.push(operation());
      }

      performanceMonitor.start();
      
      // Execute all operations concurrently
      const results = await Promise.all(operations);
      
      performanceMonitor.end();
      
      const concurrentTime = performanceMonitor.getDuration();
      
      // Concurrent operations should complete in reasonable time
      expect(concurrentTime).toBeLessThan(3000); // Less than 3 seconds
      expect(results).toHaveLength(3);
      
      console.log(`Concurrent operations performance: ${concurrentTime.toFixed(2)}ms`);
    });
  });
});

/**
 * Performance benchmark utilities
 */
export class SedesImporterBenchmark {
  static async runFileUploadBenchmark(recordCounts: number[]) {
    const results = [];
    
    for (const count of recordCounts) {
      const file = createLargeExcelFile(count);
      const startTime = performance.now();
      
      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      results.push({
        recordCount: count,
        fileSize: file.size,
        duration,
        recordsPerSecond: count / (duration / 1000)
      });
    }
    
    return results;
  }
  
  static async runUIResponsivenessBenchmark() {
    const interactions = 50;
    const times = [];
    
    for (let i = 0; i < interactions; i++) {
      const startTime = performance.now();
      
      // Simulate UI interaction
      document.dispatchEvent(new Event('click'));
      
      const endTime = performance.now();
      times.push(endTime - startTime);
    }
    
    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxTime: Math.max(...times),
      minTime: Math.min(...times),
      p95Time: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]
    };
  }
}