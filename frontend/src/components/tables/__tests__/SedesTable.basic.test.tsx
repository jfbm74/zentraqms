/**
 * Basic Tests for SedesTable Component
 * 
 * Tests basic rendering and functionality of the sedes table
 * using native HTML with Bootstrap classes.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import SedesTable from '../SedesTable';
import type { SedesTableProps, SedeListItem } from '../../../types/sede.types';

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
  {
    id: 'sede-3',
    numero_sede: '003',
    nombre_sede: 'Sede Sur',
    tipo_sede: 'ambulatoria',
    es_sede_principal: false,
    direccion_completa: 'Avenida 789 # 12-34, Sur, Cali',
    departamento: 'Valle del Cauca',
    municipio: 'Cali',
    telefono_principal: '+57 302 345 6789',
    email: 'sede3@example.com',
    estado: 'inactiva',
    total_servicios: 8,
    atencion_24_horas: false,
    organization_name: 'Hospital Central',
    created_at: '2024-03-10T16:45:00Z',
  },
];

describe('SedesTable', () => {
  const defaultProps: SedesTableProps = {
    sedes: mockSedes,
    loading: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewServices: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with sedes data', () => {
    render(<SedesTable {...defaultProps} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Sede Principal')).toBeInTheDocument();
    expect(screen.getByText('Sede Norte')).toBeInTheDocument();
    expect(screen.getByText('Sede Sur')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<SedesTable {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Cargando sedes...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no sedes', () => {
    render(<SedesTable {...defaultProps} sedes={[]} />);
    
    expect(screen.getByText('No se encontraron sedes')).toBeInTheDocument();
    expect(screen.getByText('No hay sedes registradas para esta organización.')).toBeInTheDocument();
  });

  it('shows search empty state', () => {
    render(<SedesTable {...defaultProps} sedes={[]} filters={{ search: 'test' }} />);
    
    expect(screen.getByText('No hay sedes que coincidan con los criterios de búsqueda.')).toBeInTheDocument();
  });

  it('renders table headers correctly', () => {
    render(<SedesTable {...defaultProps} />);
    
    expect(screen.getByText('# Sede')).toBeInTheDocument();
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Ubicación')).toBeInTheDocument();
    expect(screen.getByText('Contacto')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();
    expect(screen.getByText('Fecha Registro')).toBeInTheDocument();
    expect(screen.getByText('Acciones')).toBeInTheDocument();
  });

  it('displays sede information correctly', () => {
    render(<SedesTable {...defaultProps} />);
    
    // Check first sede details
    expect(screen.getByText('001')).toBeInTheDocument();
    expect(screen.getByText('Sede Principal')).toBeInTheDocument();
    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByText('Calle 123 # 45-67, Centro, Bogotá')).toBeInTheDocument();
    expect(screen.getByText('Bogotá, Cundinamarca')).toBeInTheDocument();
    expect(screen.getByText('+57 300 123 4567')).toBeInTheDocument();
    expect(screen.getByText('sede1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
  });

  it('shows principal sede indicator', () => {
    render(<SedesTable {...defaultProps} />);
    
    // Principal sede should have a star indicator
    const principalBadges = screen.getAllByTitle('Sede Principal');
    expect(principalBadges.length).toBeGreaterThan(0);
  });

  it('displays different estado badges', () => {
    render(<SedesTable {...defaultProps} />);
    
    expect(screen.getAllByText('Activa')).toHaveLength(2);
    expect(screen.getByText('Inactiva')).toBeInTheDocument();
  });

  it('shows 24h indicators correctly', () => {
    render(<SedesTable {...defaultProps} />);
    
    const timeIcons = screen.getAllByRole('img', { hidden: true }).filter(
      icon => icon.className.includes('ri-time-line')
    );
    expect(timeIcons.length).toBeGreaterThan(0);
  });

  it('handles sort functionality', () => {
    const onFiltersChange = vi.fn();
    render(
      <SedesTable 
        {...defaultProps} 
        onFiltersChange={onFiltersChange}
        filters={{}}
      />
    );
    
    const nameHeader = screen.getByText('Nombre').closest('button');
    fireEvent.click(nameHeader!);
    
    expect(onFiltersChange).toHaveBeenCalledWith({
      ordering: 'nombre_sede'
    });
  });

  it('handles sort direction changes', () => {
    const onFiltersChange = vi.fn();
    render(
      <SedesTable 
        {...defaultProps} 
        onFiltersChange={onFiltersChange}
        filters={{}}
      />
    );
    
    const nameHeader = screen.getByText('Nombre').closest('button');
    
    // First click - ascending
    fireEvent.click(nameHeader!);
    expect(onFiltersChange).toHaveBeenCalledWith({
      ordering: 'nombre_sede'
    });
    
    // Second click - descending
    fireEvent.click(nameHeader!);
    expect(onFiltersChange).toHaveBeenCalledWith({
      ordering: '-nombre_sede'
    });
  });

  it('shows checkbox selection when enabled', () => {
    const onSelectionChange = vi.fn();
    render(
      <SedesTable 
        {...defaultProps} 
        onSelectionChange={onSelectionChange}
        selectedSedes={[]}
      />
    );
    
    // Should show select all checkbox
    expect(screen.getByLabelText('Seleccionar todas las sedes')).toBeInTheDocument();
    
    // Should show individual checkboxes
    expect(screen.getByLabelText('Seleccionar sede Sede Principal')).toBeInTheDocument();
    expect(screen.getByLabelText('Seleccionar sede Sede Norte')).toBeInTheDocument();
  });

  it('handles individual selection', () => {
    const onSelectionChange = vi.fn();
    render(
      <SedesTable 
        {...defaultProps} 
        onSelectionChange={onSelectionChange}
        selectedSedes={[]}
      />
    );
    
    const checkbox = screen.getByLabelText('Seleccionar sede Sede Principal');
    fireEvent.click(checkbox);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['sede-1']);
  });

  it('handles select all functionality', () => {
    const onSelectionChange = vi.fn();
    render(
      <SedesTable 
        {...defaultProps} 
        onSelectionChange={onSelectionChange}
        selectedSedes={[]}
      />
    );
    
    const selectAllCheckbox = screen.getByLabelText('Seleccionar todas las sedes');
    fireEvent.click(selectAllCheckbox);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['sede-1', 'sede-2', 'sede-3']);
  });

  it('shows partially selected state', () => {
    render(
      <SedesTable 
        {...defaultProps} 
        onSelectionChange={vi.fn()}
        selectedSedes={['sede-1']}
      />
    );
    
    const selectAllCheckbox = screen.getByLabelText('Seleccionar todas las sedes') as HTMLInputElement;
    expect(selectAllCheckbox.indeterminate).toBe(true);
  });

  it('shows all selected state', () => {
    render(
      <SedesTable 
        {...defaultProps} 
        onSelectionChange={vi.fn()}
        selectedSedes={['sede-1', 'sede-2', 'sede-3']}
      />
    );
    
    const selectAllCheckbox = screen.getByLabelText('Seleccionar todas las sedes') as HTMLInputElement;
    expect(selectAllCheckbox.checked).toBe(true);
  });

  it('handles action button clicks', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onViewServices = vi.fn();
    
    render(
      <SedesTable 
        {...defaultProps}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewServices={onViewServices}
      />
    );
    
    // Click on first row's actions dropdown
    const actionButtons = screen.getAllByLabelText(/Acciones para sede/);
    fireEvent.click(actionButtons[0]);
    
    // Click edit option
    const editButton = screen.getByText('Editar');
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockSedes[0]);
  });

  it('handles services view button', () => {
    const onViewServices = vi.fn();
    
    render(
      <SedesTable 
        {...defaultProps}
        onViewServices={onViewServices}
      />
    );
    
    // Click on services button for first sede
    const servicesButtons = screen.getAllByTitle('Ver servicios habilitados');
    fireEvent.click(servicesButtons[0]);
    
    expect(onViewServices).toHaveBeenCalledWith(mockSedes[0]);
  });

  it('shows table footer with statistics', () => {
    render(<SedesTable {...defaultProps} />);
    
    expect(screen.getByText('3 sedes encontradas')).toBeInTheDocument();
    expect(screen.getByText('2 Activas')).toBeInTheDocument();
    expect(screen.getByText('1 Principales')).toBeInTheDocument();
    expect(screen.getByText('1 24h')).toBeInTheDocument();
  });

  it('shows selection count in footer', () => {
    render(
      <SedesTable 
        {...defaultProps} 
        onSelectionChange={vi.fn()}
        selectedSedes={['sede-1', 'sede-2']}
      />
    );
    
    expect(screen.getByText('(2 seleccionadas)')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<SedesTable {...defaultProps} />);
    
    // Should show formatted dates (checking for month abbreviations)
    expect(screen.getByText(/ene/i)).toBeInTheDocument();
    expect(screen.getByText(/feb/i)).toBeInTheDocument();
    expect(screen.getByText(/mar/i)).toBeInTheDocument();
  });

  it('displays tipo sede icons', () => {
    render(<SedesTable {...defaultProps} />);
    
    // Should display icons for different sede types
    const icons = screen.getAllByRole('img', { hidden: true });
    const buildingIcons = icons.filter(icon => 
      icon.className.includes('ri-building') ||
      icon.className.includes('ri-walk') ||
      icon.className.includes('ri-hospital')
    );
    expect(buildingIcons.length).toBeGreaterThan(0);
  });

  it('truncates long email addresses', () => {
    const longEmailSede = {
      ...mockSedes[0],
      email: 'very.long.email.address.that.should.be.truncated@verylongdomainname.com'
    };
    
    render(<SedesTable {...defaultProps} sedes={[longEmailSede]} />);
    
    const emailElement = screen.getByTitle(longEmailSede.email);
    expect(emailElement).toHaveClass('text-truncate');
  });

  it('handles delete confirmation', () => {
    const onDelete = vi.fn();
    
    render(
      <SedesTable 
        {...defaultProps}
        onDelete={onDelete}
      />
    );
    
    // Mock window.confirm
    window.confirm = vi.fn(() => true);
    
    // Click on first row's actions dropdown
    const actionButtons = screen.getAllByLabelText(/Acciones para sede/);
    fireEvent.click(actionButtons[0]);
    
    // Click delete option
    const deleteButton = screen.getByText('Eliminar');
    fireEvent.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledWith(mockSedes[0]);
  });

  it('shows correct contact information', () => {
    render(<SedesTable {...defaultProps} />);
    
    // Check that both phone and email are displayed for each sede
    expect(screen.getByText('+57 300 123 4567')).toBeInTheDocument();
    expect(screen.getByText('sede1@example.com')).toBeInTheDocument();
    expect(screen.getByText('+57 301 234 5678')).toBeInTheDocument();
    expect(screen.getByText('sede2@example.com')).toBeInTheDocument();
  });

  it('displays organization name correctly', () => {
    render(<SedesTable {...defaultProps} />);
    
    // All sedes should show the organization name
    const orgNames = screen.getAllByText('Hospital Central');
    expect(orgNames).toHaveLength(3);
  });

  it('shows appropriate estado colors', () => {
    render(<SedesTable {...defaultProps} />);
    
    // Active sedes should have success styling
    const activeBadges = screen.getAllByText('Activa');
    activeBadges.forEach(badge => {
      expect(badge).toHaveClass('bg-success-subtle', 'text-success');
    });
    
    // Inactive sede should have secondary styling
    const inactiveBadge = screen.getByText('Inactiva');
    expect(inactiveBadge).toHaveClass('bg-secondary-subtle', 'text-secondary');
  });

  it('handles empty selection correctly', () => {
    const onSelectionChange = vi.fn();
    render(
      <SedesTable 
        {...defaultProps} 
        onSelectionChange={onSelectionChange}
        selectedSedes={['sede-1']}
      />
    );
    
    // Uncheck the selected sede
    const checkbox = screen.getByLabelText('Seleccionar sede Sede Principal') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    
    fireEvent.click(checkbox);
    
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });
});