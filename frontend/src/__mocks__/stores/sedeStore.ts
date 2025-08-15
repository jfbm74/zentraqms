/**
 * Mock Sede Store for Testing
 * 
 * Provides mock implementation of the sede store for unit testing
 */

import type { 
  SedeListItem, 
  SedeFormData, 
  SedePrestadora,
  SedeFilters,
  SedePagination,
  SedeImportResponse 
} from '../../types/sede.types';

export interface MockSedeStore {
  // State
  sedes: SedeListItem[];
  loading: boolean;
  error: string | null;
  filters: SedeFilters;
  pagination: SedePagination;
  
  // Actions
  fetchSedes: jest.MockedFunction<(organizationId: string, filters?: SedeFilters) => Promise<void>>;
  createSede: jest.MockedFunction<(organizationId: string, data: SedeFormData) => Promise<SedePrestadora>>;
  updateSede: jest.MockedFunction<(sedeId: string, data: Partial<SedeFormData>) => Promise<SedePrestadora>>;
  deleteSede: jest.MockedFunction<(sedeId: string) => Promise<void>>;
  setFilters: jest.MockedFunction<(filters: SedeFilters) => void>;
  clearError: jest.MockedFunction<() => void>;
  exportSedes: jest.MockedFunction<(organizationId: string, format: 'csv' | 'excel', includeServices?: boolean) => Promise<Blob>>;
  importSedes: jest.MockedFunction<(organizationId: string, file: File) => Promise<SedeImportResponse>>;
  validateSedeData: jest.MockedFunction<(data: SedeFormData) => { valid: boolean; errors: Record<string, string[]> }>;
}

export const mockSedeStore = jest.fn((): MockSedeStore => ({
  // Default state
  sedes: [],
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  
  // Mock actions
  fetchSedes: jest.fn().mockResolvedValue(undefined),
  createSede: jest.fn().mockResolvedValue({
    id: 'new-sede-id',
    numero_sede: '01',
    nombre_sede: 'Nueva Sede Test'
  } as SedePrestadora),
  updateSede: jest.fn().mockResolvedValue({
    id: 'updated-sede-id',
    numero_sede: '01',
    nombre_sede: 'Sede Actualizada'
  } as SedePrestadora),
  deleteSede: jest.fn().mockResolvedValue(undefined),
  setFilters: jest.fn(),
  clearError: jest.fn(),
  exportSedes: jest.fn().mockResolvedValue(new Blob(['test data'], { type: 'text/csv' })),
  importSedes: jest.fn().mockResolvedValue({
    success: true,
    imported_count: 5,
    error_count: 0,
    errors: []
  }),
  validateSedeData: jest.fn().mockReturnValue({
    valid: true,
    errors: {}
  })
}));