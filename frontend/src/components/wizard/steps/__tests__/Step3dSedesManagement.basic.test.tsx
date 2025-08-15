/**
 * Basic Tests for Step3dSedesManagement Component
 * 
 * Tests basic rendering and functionality of the sedes management step
 * using native HTML with Bootstrap classes.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Step3dSedesManagement from '../Step3dSedesManagement';
import type { SedeListItem, SedePrestadora } from '../../../../types/sede.types';

// Mock dependencies
vi.mock('../../../../stores/sedeStore', () => ({
  useSedeStore: () => ({
    sedes: mockSedes,
    loading: false,
    error: null,
    filters: {},
    pagination: {
      page: 1,
      pageSize: 20,
      total: 2,
      hasNext: false,
      hasPrevious: false,
    },
    fetchSedes: vi.fn(),
    createSede: vi.fn(),
    updateSede: vi.fn(),
    deleteSede: vi.fn(),
    setFilters: vi.fn(),
    clearError: vi.fn(),
    exportSedes: vi.fn(),
  }),
}));

vi.mock('../../../../hooks/useBootstrapTooltips', () => ({
  useBootstrapTooltips: vi.fn(),
}));

vi.mock('../../../common/InfoTooltip', () => {
  return {
    default: ({ content, ariaLabel }: { content: string; ariaLabel: string }) => (
      <span data-testid="info-tooltip" aria-label={ariaLabel}>
        {content}
      </span>
    ),
  };
});

vi.mock('../../../forms/SedeFormModal', () => {
  return {
    default: ({ isOpen, onClose, onSave, sede }: any) => (
      isOpen ? (
        <div data-testid="sede-form-modal">
          <h5>{sede ? 'Editar Sede' : 'Nueva Sede'}</h5>
          <button onClick={() => onSave({ numero_sede: '001', nombre_sede: 'Test Sede' })}>
            Save
          </button>
          <button onClick={onClose}>Close</button>
        </div>
      ) : null
    ),
  };
});

vi.mock('../../../tables/SedesTable', () => {
  return {
    default: ({ sedes, loading, onEdit, onDelete, onViewServices, onSelectionChange }: any) => (
      <div data-testid="sedes-table">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div>
            <h6>Sedes Table ({sedes.length})</h6>
            {sedes.map((sede: SedeListItem) => (
              <div key={sede.id} data-testid={`sede-${sede.id}`}>
                <span>{sede.nombre_sede}</span>
                <button onClick={() => onEdit(sede)}>Edit</button>
                <button onClick={() => onDelete(sede)}>Delete</button>
                <button onClick={() => onViewServices(sede)}>View Services</button>
                {onSelectionChange && (
                  <input
                    type="checkbox"
                    onChange={(e) => onSelectionChange(e.target.checked ? [sede.id] : [])}
                    aria-label={`Select ${sede.nombre_sede}`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  };
});

vi.mock('../../../importers/SedesImporter', () => {
  return {
    default: ({ isOpen, onImportComplete, onCancel }: any) => (
      isOpen ? (
        <div data-testid="sedes-importer">
          <h5>Sedes Importer</h5>
          <button onClick={() => onImportComplete({ success: true, imported_count: 5 })}>
            Complete Import
          </button>
          <button onClick={onCancel}>Cancel Import</button>
        </div>
      ) : null
    ),
  };
});

// Mock data
const mockSedes: SedeListItem[] = [
  {
    id: 'sede-1',
    numero_sede: '001',
    nombre_sede: 'Sede Principal',
    tipo_sede: 'principal',
    es_sede_principal: true,
    direccion_completa: 'Calle 123 # 45-67, Centro, Bogotá',
    departamento: 'Cundinamarca',
    municipio: 'Bogotá',
    telefono_principal: '+57 300 123 4567',
    email: 'sede1@example.com',
    estado: 'activa',
    total_servicios: 25,
    atencion_24_horas: true,
    organization_name: 'Hospital Central',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'sede-2',
    numero_sede: '002',
    nombre_sede: 'Sede Norte',
    tipo_sede: 'sucursal',
    es_sede_principal: false,
    direccion_completa: 'Carrera 456 # 78-90, Norte, Medellín',
    departamento: 'Antioquia',
    municipio: 'Medellín',
    telefono_principal: '+57 301 234 5678',
    email: 'sede2@example.com',
    estado: 'activa',
    total_servicios: 15,
    atencion_24_horas: false,
    organization_name: 'Hospital Central',
    created_at: '2024-02-20T14:15:00Z',
  },
];

describe('Step3dSedesManagement', () => {
  const defaultProps = {
    organizationId: 'org-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window methods
    window.confirm = vi.fn(() => true);
    
    // Mock alert container for notifications
    const alertContainer = document.createElement('div');
    alertContainer.id = 'alert-container';
    document.body.appendChild(alertContainer);
  });

  afterEach(() => {
    // Clean up alert container
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
      document.body.removeChild(alertContainer);
    }
  });

  it('renders management interface correctly', () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    expect(screen.getByText('Gestión de Sedes Prestadoras')).toBeInTheDocument();
    expect(screen.getByText('Configure y administre las sedes donde se prestan los servicios de salud')).toBeInTheDocument();
  });

  it('displays sede statistics', () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    expect(screen.getByText('2 Sedes')).toBeInTheDocument();
    expect(screen.getByText('2 Activas')).toBeInTheDocument();
  });

  it('shows navigation tabs', () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    expect(screen.getByText('Lista de Sedes')).toBeInTheDocument();
    expect(screen.getByText('Importar Sedes')).toBeInTheDocument();
  });

  it('renders sedes table by default', () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    expect(screen.getByTestId('sedes-table')).toBeInTheDocument();
    expect(screen.getByText('Sedes Table (2)')).toBeInTheDocument();
  });

  it('shows create button when not readonly', () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    expect(screen.getByText('Nueva Sede')).toBeInTheDocument();
  });

  it('hides create button when readonly', () => {
    render(<Step3dSedesManagement {...defaultProps} readonly={true} />);
    
    expect(screen.queryByText('Nueva Sede')).not.toBeInTheDocument();
  });

  it('displays search box', () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Buscar sedes...')).toBeInTheDocument();
  });

  it('shows export buttons', () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
  });

  it('displays filter controls', () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    // Estado filter
    const estadoSelect = screen.getByLabelText('Filtrar por estado');
    expect(estadoSelect).toBeInTheDocument();
    
    // Tipo filter
    const tipoSelect = screen.getByLabelText('Filtrar por tipo');
    expect(tipoSelect).toBeInTheDocument();
    
    // Departamento filter
    const departamentoSelect = screen.getByLabelText('Filtrar por departamento');
    expect(departamentoSelect).toBeInTheDocument();
    
    // Checkboxes
    expect(screen.getByLabelText('Solo principales')).toBeInTheDocument();
    expect(screen.getByLabelText('24 horas')).toBeInTheDocument();
  });

  it('opens create modal when create button clicked', async () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Nueva Sede'));
    
    await waitFor(() => {
      expect(screen.getByTestId('sede-form-modal')).toBeInTheDocument();
      expect(screen.getByText('Nueva Sede')).toBeInTheDocument();
    });
  });

  it('opens edit modal when edit button clicked', async () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    const editButton = screen.getAllByText('Edit')[0];
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('sede-form-modal')).toBeInTheDocument();
      expect(screen.getByText('Editar Sede')).toBeInTheDocument();
    });
  });

  it('handles sede creation', async () => {
    const onSedeCreate = vi.fn();
    render(
      <Step3dSedesManagement 
        {...defaultProps} 
        onSedeCreate={onSedeCreate}
      />
    );
    
    // Open create modal
    fireEvent.click(screen.getByText('Nueva Sede'));
    
    await waitFor(() => {
      // Save sede
      fireEvent.click(screen.getByText('Save'));
    });
    
    await waitFor(() => {
      expect(onSedeCreate).toHaveBeenCalled();
    });
  });

  it('handles sede deletion with confirmation', async () => {
    const onSedeDelete = vi.fn();
    render(
      <Step3dSedesManagement 
        {...defaultProps} 
        onSedeDelete={onSedeDelete}
      />
    );
    
    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        '¿Está seguro de eliminar la sede "Sede Principal"?'
      );
      expect(onSedeDelete).toHaveBeenCalledWith('sede-1');
    });
  });

  it('switches to import tab', async () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Importar Sedes'));
    
    await waitFor(() => {
      expect(screen.getByTestId('sedes-importer')).toBeInTheDocument();
    });
  });

  it('disables import tab when readonly', () => {
    render(<Step3dSedesManagement {...defaultProps} readonly={true} />);
    
    const importTab = screen.getByText('Importar Sedes').closest('button');
    expect(importTab).toBeDisabled();
  });

  it('handles search with debouncing', async () => {
    const mockSetFilters = vi.fn();
    
    // We need to mock the store to return our mock function
    vi.mocked(require('../../../../stores/sedeStore').useSedeStore).mockReturnValue({
      sedes: mockSedes,
      loading: false,
      error: null,
      filters: {},
      pagination: {
        page: 1,
        pageSize: 20,
        total: 2,
        hasNext: false,
        hasPrevious: false,
      },
      fetchSedes: vi.fn(),
      createSede: vi.fn(),
      updateSede: vi.fn(),
      deleteSede: vi.fn(),
      setFilters: mockSetFilters,
      clearError: vi.fn(),
      exportSedes: vi.fn(),
    });
    
    render(<Step3dSedesManagement {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar sedes...');
    
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    // Wait for debounce
    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalledWith({ search: 'test search', page: 1 });
    }, { timeout: 1000 });
  });

  it('handles filter changes', async () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    const estadoSelect = screen.getByLabelText('Filtrar por estado');
    
    fireEvent.change(estadoSelect, { target: { value: 'activa' } });
    
    // The store's setFilters should be called
    // This would be tested through integration with the actual store
  });

  it('handles export CSV', async () => {
    const mockExportSedes = vi.fn().mockResolvedValue(new Blob());
    
    vi.mocked(require('../../../../stores/sedeStore').useSedeStore).mockReturnValue({
      sedes: mockSedes,
      loading: false,
      error: null,
      filters: {},
      pagination: {
        page: 1,
        pageSize: 20,
        total: 2,
        hasNext: false,
        hasPrevious: false,
      },
      fetchSedes: vi.fn(),
      createSede: vi.fn(),
      updateSede: vi.fn(),
      deleteSede: vi.fn(),
      setFilters: vi.fn(),
      clearError: vi.fn(),
      exportSedes: mockExportSedes,
    });
    
    // Mock URL.createObjectURL and other DOM methods
    global.URL.createObjectURL = vi.fn();
    global.URL.revokeObjectURL = vi.fn();
    
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());
    
    render(<Step3dSedesManagement {...defaultProps} />);
    
    fireEvent.click(screen.getByText('CSV'));
    
    await waitFor(() => {
      expect(mockExportSedes).toHaveBeenCalledWith('org-123', 'csv', true);
    });
  });

  it('handles bulk selection', async () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    // Select a sede through the table
    const checkbox = screen.getByLabelText('Select Sede Principal');
    fireEvent.change(checkbox, { target: { checked: true } });
    
    await waitFor(() => {
      expect(screen.getByText('1 seleccionadas')).toBeInTheDocument();
    });
  });

  it('handles bulk delete', async () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    // First select a sede
    const checkbox = screen.getByLabelText('Select Sede Principal');
    fireEvent.change(checkbox, { target: { checked: true } });
    
    await waitFor(() => {
      const deleteButton = screen.getByText('Eliminar');
      fireEvent.click(deleteButton);
    });
    
    expect(window.confirm).toHaveBeenCalledWith(
      '¿Está seguro de eliminar 1 sedes seleccionadas?'
    );
  });

  it('handles import completion', async () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    // Switch to import tab
    fireEvent.click(screen.getByText('Importar Sedes'));
    
    await waitFor(() => {
      // Complete import
      fireEvent.click(screen.getByText('Complete Import'));
    });
    
    // Should show success message and switch back to list
    await waitFor(() => {
      expect(screen.getByTestId('sedes-table')).toBeInTheDocument();
    });
  });

  it('displays error state correctly', () => {
    vi.mocked(require('../../../../stores/sedeStore').useSedeStore).mockReturnValue({
      sedes: [],
      loading: false,
      error: 'Error loading sedes',
      filters: {},
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        hasNext: false,
        hasPrevious: false,
      },
      fetchSedes: vi.fn(),
      createSede: vi.fn(),
      updateSede: vi.fn(),
      deleteSede: vi.fn(),
      setFilters: vi.fn(),
      clearError: vi.fn(),
      exportSedes: vi.fn(),
    });
    
    render(<Step3dSedesManagement {...defaultProps} />);
    
    expect(screen.getByText('Error loading sedes')).toBeInTheDocument();
    
    // Should have close button for error
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();
  });

  it('handles services view', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    render(<Step3dSedesManagement {...defaultProps} />);
    
    const viewServicesButton = screen.getAllByText('View Services')[0];
    fireEvent.click(viewServicesButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('View services for:', mockSedes[0]);
  });

  it('shows loading state', () => {
    vi.mocked(require('../../../../stores/sedeStore').useSedeStore).mockReturnValue({
      sedes: [],
      loading: true,
      error: null,
      filters: {},
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        hasNext: false,
        hasPrevious: false,
      },
      fetchSedes: vi.fn(),
      createSede: vi.fn(),
      updateSede: vi.fn(),
      deleteSede: vi.fn(),
      setFilters: vi.fn(),
      clearError: vi.fn(),
      exportSedes: vi.fn(),
    });
    
    render(<Step3dSedesManagement {...defaultProps} />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('calls callbacks when provided', async () => {
    const onSedeCreate = vi.fn();
    const onSedeUpdate = vi.fn();
    const onSedeDelete = vi.fn();
    
    render(
      <Step3dSedesManagement 
        {...defaultProps}
        onSedeCreate={onSedeCreate}
        onSedeUpdate={onSedeUpdate}
        onSedeDelete={onSedeDelete}
      />
    );
    
    // Test create
    fireEvent.click(screen.getByText('Nueva Sede'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Save'));
    });
    
    expect(onSedeCreate).toHaveBeenCalled();
    
    // Test delete
    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);
    
    expect(onSedeDelete).toHaveBeenCalledWith('sede-1');
  });

  it('closes modal correctly', async () => {
    render(<Step3dSedesManagement {...defaultProps} />);
    
    // Open modal
    fireEvent.click(screen.getByText('Nueva Sede'));
    
    await waitFor(() => {
      expect(screen.getByTestId('sede-form-modal')).toBeInTheDocument();
    });
    
    // Close modal
    fireEvent.click(screen.getByText('Close'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('sede-form-modal')).not.toBeInTheDocument();
    });
  });
});