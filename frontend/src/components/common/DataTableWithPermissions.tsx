/**
 * Data Table with Permission-based Actions
 * 
 * Example component demonstrating how to integrate RBAC with UI elements.
 * Shows/hides table actions based on user permissions.
 */

import React, { useState } from 'react';
import {
  CreateActionButton,
  EditActionButton,
  DeleteActionButton,
  ViewActionButton,
  ExportActionButton,
  ImportActionButton,
  BulkActionsBar,
  ActionButtonGroup,
} from '../ui/PermissionButtons';
import { PermissionGate } from './PermissionGate';

/**
 * Generic data item interface
 */
interface DataItem {
  id: string;
  [key: string]: unknown;
}

/**
 * Table column interface
 */
interface TableColumn<T = DataItem> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T, index: number) => React.ReactNode;
}

/**
 * Props for DataTableWithPermissions
 */
interface DataTableWithPermissionsProps<T = DataItem> {
  /** Resource type for permission checking */
  resource: string;
  
  /** Table data */
  data: T[];
  
  /** Table columns */
  columns: TableColumn<T>[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Action handlers */
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onExport?: () => void;
  onImport?: () => void;
  onBulkEdit?: (items: T[]) => void;
  onBulkDelete?: (items: T[]) => void;
  onBulkExport?: (items: T[]) => void;
  
  /** Table configuration */
  title?: string;
  showSearch?: boolean;
  showPagination?: boolean;
  showBulkActions?: boolean;
  itemsPerPage?: number;
  
  /** Custom action buttons */
  customActions?: Array<{
    label: string;
    icon: string;
    onClick: (item?: T) => void;
    permission?: string;
    permissions?: string[];
    variant?: string;
    bulk?: boolean; // Whether this is a bulk action
  }>;
}

/**
 * Data Table with Permission-based Actions
 */
export const DataTableWithPermissions = <T extends DataItem>({
  resource,
  data,
  columns,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onExport,
  onImport,
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  title,
  showSearch = true,
  showPagination = true,
  showBulkActions = true,
  itemsPerPage = 10,
  customActions = [],
}: DataTableWithPermissionsProps<T>) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Handle individual item selection
   */
  const handleItemSelect = (itemId: string, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  /**
   * Handle select all toggle
   */
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(data.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  /**
   * Get filtered and paginated data
   */
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = showPagination 
    ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredData;

  const selectedCount = selectedItems.size;
  const allSelected = selectedCount === paginatedData.length && paginatedData.length > 0;
  const partialSelected = selectedCount > 0 && selectedCount < paginatedData.length;

  /**
   * Get selected items data
   */
  const getSelectedItems = (): T[] => {
    return data.filter(item => selectedItems.has(item.id));
  };

  /**
   * Render table header actions
   */
  const renderHeaderActions = () => (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div>
        {title && <h5 className="mb-0">{title}</h5>}
      </div>
      
      <div className="d-flex gap-2">
        {/* Search */}
        {showSearch && (
          <div className="input-group" style={{ width: '300px' }}>
            <span className="input-group-text">
              <i className="ri-search-line"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Import Action */}
        {onImport && (
          <ImportActionButton onClick={onImport}>
            Importar
          </ImportActionButton>
        )}

        {/* Export Action */}
        {onExport && (
          <ExportActionButton onClick={onExport}>
            Exportar
          </ExportActionButton>
        )}

        {/* Custom Header Actions */}
        {customActions
          .filter(action => !action.bulk)
          .map((action, index) => (
            <PermissionGate
              key={index}
              permission={action.permission}
              permissions={action.permissions}
            >
              <button
                className={`btn btn-${action.variant || 'outline-secondary'}`}
                onClick={() => action.onClick()}
              >
                <i className={`${action.icon} me-1`}></i>
                {action.label}
              </button>
            </PermissionGate>
          ))
        }

        {/* Add Action */}
        {onAdd && (
          <CreateActionButton resource={resource} onClick={onAdd}>
            Nuevo
          </CreateActionButton>
        )}
      </div>
    </div>
  );

  /**
   * Render bulk actions bar
   */
  const renderBulkActions = () => {
    if (!showBulkActions || selectedCount === 0) return null;

    const selectedItemsData = getSelectedItems();

    return (
      <BulkActionsBar
        resource={resource}
        selectedCount={selectedCount}
        onBulkEdit={onBulkEdit ? () => onBulkEdit(selectedItemsData) : undefined}
        onBulkDelete={onBulkDelete ? () => onBulkDelete(selectedItemsData) : undefined}
        onBulkExport={onBulkExport ? () => onBulkExport(selectedItemsData) : undefined}
        customActions={customActions
          .filter(action => action.bulk)
          .map(action => ({
            label: action.label,
            icon: action.icon,
            onClick: () => action.onClick(),
            permission: action.permission,
            permissions: action.permissions,
            variant: action.variant,
          }))
        }
      />
    );
  };

  /**
   * Render row actions
   */
  const renderRowActions = (item: T) => (
    <ActionButtonGroup>
      {onView && (
        <ViewActionButton
          resource={resource}
          onClick={() => onView(item)}
          size="sm"
        >
          Ver
        </ViewActionButton>
      )}
      
      {onEdit && (
        <EditActionButton
          resource={resource}
          onClick={() => onEdit(item)}
          size="sm"
        >
          Editar
        </EditActionButton>
      )}
      
      {onDelete && (
        <DeleteActionButton
          resource={resource}
          onClick={() => onDelete(item)}
          size="sm"
        >
          Eliminar
        </DeleteActionButton>
      )}
    </ActionButtonGroup>
  );

  /**
   * Render pagination
   */
  const renderPagination = () => {
    if (!showPagination || totalPages <= 1) return null;

    return (
      <nav>
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
          </li>
          
          {[...Array(totalPages)].map((_, index) => (
            <li
              key={index + 1}
              className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
            >
              <button
                className="page-link"
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            </li>
          ))}
          
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderHeaderActions()}
      {renderBulkActions()}
      
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              {showBulkActions && (
                <th style={{ width: '50px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = partialSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              
              {columns.map((column) => (
                <th key={String(column.key)}>
                  {column.label}
                  {column.sortable && (
                    <i className="ri-sort-asc ms-1 text-muted"></i>
                  )}
                </th>
              ))}
              
              <th style={{ width: '120px' }}>Acciones</th>
            </tr>
          </thead>
          
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showBulkActions ? 2 : 1)}
                  className="text-center py-4 text-muted"
                >
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr key={item.id}>
                  {showBulkActions && (
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                      />
                    </td>
                  )}
                  
                  {columns.map((column) => (
                    <td key={String(column.key)}>
                      {column.render 
                        ? column.render(item[column.key], item, index)
                        : String(item[column.key] || '')
                      }
                    </td>
                  ))}
                  
                  <td>
                    {renderRowActions(item)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {renderPagination()}
    </div>
  );
};

export default DataTableWithPermissions;