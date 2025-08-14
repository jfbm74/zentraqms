/**
 * Permission-aware Button Components for ZentraQMS Frontend
 *
 * These components demonstrate how to create UI elements that adapt
 * based on user permissions and roles.
 */

import React from "react";
import { PermissionGate } from "../common/PermissionGate";
import { usePermissions } from "../../hooks/usePermissions";

/**
 * Props for action buttons
 */
interface ActionButtonProps {
  /** Button click handler */
  onClick?: () => void;
  /** Button variant */
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "light"
    | "dark"
    | "outline-primary"
    | "outline-secondary";
  /** Button size */
  size?: "sm" | "lg";
  /** Whether button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Button icon */
  icon?: string;
  /** Button text */
  children: React.ReactNode;
}

/**
 * Create Action Button - Only visible if user can create resources
 */
export const CreateActionButton: React.FC<
  ActionButtonProps & { resource: string }
> = ({
  resource,
  onClick,
  variant = "primary",
  size,
  disabled = false,
  className = "",
  icon = "ri-add-line",
  children,
}) => {
  const { canCreate } = usePermissions();

  if (!canCreate(resource)) {
    return null;
  }

  return (
    <button
      type="button"
      className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <i className={`${icon} me-1`}></i>
      {children}
    </button>
  );
};

/**
 * Edit Action Button - Only visible if user can update resources
 */
export const EditActionButton: React.FC<
  ActionButtonProps & { resource: string }
> = ({
  resource,
  onClick,
  variant = "outline-primary",
  size,
  disabled = false,
  className = "",
  icon = "ri-edit-line",
  children,
}) => {
  const { canUpdate } = usePermissions();

  if (!canUpdate(resource)) {
    return null;
  }

  return (
    <button
      type="button"
      className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <i className={`${icon} me-1`}></i>
      {children}
    </button>
  );
};

/**
 * Delete Action Button - Only visible if user can delete resources
 */
export const DeleteActionButton: React.FC<
  ActionButtonProps & { resource: string }
> = ({
  resource,
  onClick,
  variant = "outline-danger",
  size,
  disabled = false,
  className = "",
  icon = "ri-delete-bin-line",
  children,
}) => {
  const { canDelete } = usePermissions();

  if (!canDelete(resource)) {
    return null;
  }

  return (
    <button
      type="button"
      className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <i className={`${icon} me-1`}></i>
      {children}
    </button>
  );
};

/**
 * View Action Button - Only visible if user can read resources
 */
export const ViewActionButton: React.FC<
  ActionButtonProps & { resource: string }
> = ({
  resource,
  onClick,
  variant = "outline-info",
  size,
  disabled = false,
  className = "",
  icon = "ri-eye-line",
  children,
}) => {
  const { canRead } = usePermissions();

  if (!canRead(resource)) {
    return null;
  }

  return (
    <button
      type="button"
      className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <i className={`${icon} me-1`}></i>
      {children}
    </button>
  );
};

/**
 * Permission Button - Generic button that shows/hides based on permission
 */
export const PermissionButton: React.FC<
  ActionButtonProps & {
    permission?: string;
    permissions?: string[];
    role?: string;
    roles?: string[];
  }
> = ({
  permission,
  permissions,
  role,
  roles,
  onClick,
  variant = "primary",
  size,
  disabled = false,
  className = "",
  icon,
  children,
}) => {
  return (
    <PermissionGate
      permission={permission}
      permissions={permissions}
      role={role}
      roles={roles}
    >
      <button
        type="button"
        className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {icon && <i className={`${icon} me-1`}></i>}
        {children}
      </button>
    </PermissionGate>
  );
};

/**
 * Admin Action Button - Only visible to admin users
 */
export const AdminActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  variant = "warning",
  size,
  disabled = false,
  className = "",
  icon = "ri-admin-line",
  children,
}) => {
  return (
    <PermissionGate roles={["admin", "super_admin"]}>
      <button
        type="button"
        className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <i className={`${icon} me-1`}></i>
        {children}
      </button>
    </PermissionGate>
  );
};

/**
 * Export Action Button - Only visible if user can export
 */
export const ExportActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  variant = "outline-success",
  size,
  disabled = false,
  className = "",
  icon = "ri-download-line",
  children,
}) => {
  return (
    <PermissionGate permissions={["reports.export", "data.export"]}>
      <button
        type="button"
        className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <i className={`${icon} me-1`}></i>
        {children}
      </button>
    </PermissionGate>
  );
};

/**
 * Import Action Button - Only visible if user can import
 */
export const ImportActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  variant = "outline-info",
  size,
  disabled = false,
  className = "",
  icon = "ri-upload-line",
  children,
}) => {
  return (
    <PermissionGate permissions={["data.import"]}>
      <button
        type="button"
        className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <i className={`${icon} me-1`}></i>
        {children}
      </button>
    </PermissionGate>
  );
};

/**
 * Settings Action Button - Only visible if user can manage settings
 */
export const SettingsActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  variant = "outline-secondary",
  size,
  disabled = false,
  className = "",
  icon = "ri-settings-line",
  children,
}) => {
  return (
    <PermissionGate permissions={["settings.update", "system.admin"]}>
      <button
        type="button"
        className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <i className={`${icon} me-1`}></i>
        {children}
      </button>
    </PermissionGate>
  );
};

/**
 * Action Button Group - Container for related action buttons
 */
interface ActionButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`btn-group ${className}`} role="group">
      {children}
    </div>
  );
};

/**
 * Permission-aware Dropdown Menu
 */
interface PermissionDropdownProps {
  /** Dropdown button text */
  buttonText: React.ReactNode;
  /** Button variant */
  variant?: string;
  /** Button size */
  size?: string;
  /** Dropdown items */
  items: Array<{
    label: string;
    icon?: string;
    onClick: () => void;
    permission?: string;
    permissions?: string[];
    role?: string;
    roles?: string[];
    divider?: boolean;
  }>;
}

export const PermissionDropdown: React.FC<PermissionDropdownProps> = ({
  buttonText,
  variant = "primary",
  size,
  items,
}) => {
  // Filter visible items based on permissions
  const visibleItems = items.filter((item) => {
    if (item.divider) return true;

    // If no permissions specified, item is always visible
    if (!item.permission && !item.permissions && !item.role && !item.roles) {
      return true;
    }

    // This would need to be implemented with useAuth hook
    // For now, show all items (placeholder)
    return true;
  });

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="dropdown">
      <button
        className={`btn btn-${variant} ${size ? `btn-${size}` : ""} dropdown-toggle`}
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        {buttonText}
      </button>
      <ul className="dropdown-menu">
        {visibleItems.map((item, index) => {
          if (item.divider) {
            return (
              <li key={index}>
                <hr className="dropdown-divider" />
              </li>
            );
          }

          return (
            <li key={index}>
              <PermissionGate
                permission={item.permission}
                permissions={item.permissions}
                role={item.role}
                roles={item.roles}
              >
                <button
                  className="dropdown-item"
                  type="button"
                  onClick={item.onClick}
                >
                  {item.icon && <i className={`${item.icon} me-2`}></i>}
                  {item.label}
                </button>
              </PermissionGate>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/**
 * Bulk Actions Bar - Shows different bulk actions based on permissions
 */
interface BulkActionsBarProps {
  /** Resource type for permissions */
  resource: string;
  /** Number of selected items */
  selectedCount: number;
  /** Bulk action handlers */
  onBulkEdit?: () => void;
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
  /** Additional custom actions */
  customActions?: Array<{
    label: string;
    icon: string;
    onClick: () => void;
    permission?: string;
    permissions?: string[];
    variant?: string;
  }>;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  resource,
  selectedCount,
  onBulkEdit,
  onBulkDelete,
  onBulkExport,
  customActions = [],
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-light p-3 border rounded mb-3">
      <div className="d-flex justify-content-between align-items-center">
        <span className="text-muted">
          <i className="ri-checkbox-circle-line me-1"></i>
          {selectedCount} elemento{selectedCount !== 1 ? "s" : ""} seleccionado
          {selectedCount !== 1 ? "s" : ""}
        </span>

        <div className="d-flex gap-2">
          {onBulkEdit && (
            <EditActionButton
              resource={resource}
              onClick={onBulkEdit}
              size="sm"
              variant="outline-primary"
            >
              Editar Selección
            </EditActionButton>
          )}

          {onBulkExport && (
            <ExportActionButton onClick={onBulkExport} size="sm">
              Exportar Selección
            </ExportActionButton>
          )}

          {customActions.map((action, index) => (
            <PermissionButton
              key={index}
              permission={action.permission}
              permissions={action.permissions}
              onClick={action.onClick}
              size="sm"
              variant={action.variant || "outline-secondary"}
              icon={action.icon}
            >
              {action.label}
            </PermissionButton>
          ))}

          {onBulkDelete && (
            <DeleteActionButton
              resource={resource}
              onClick={onBulkDelete}
              size="sm"
            >
              Eliminar Selección
            </DeleteActionButton>
          )}
        </div>
      </div>
    </div>
  );
};
