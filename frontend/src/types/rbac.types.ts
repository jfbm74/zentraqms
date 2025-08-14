/**
 * RBAC Types for ZentraQMS Frontend
 *
 * This module defines all TypeScript types and interfaces related to
 * Role-Based Access Control (RBAC), including roles, permissions, and authorization.
 */

/**
 * Permission interface matching backend model
 */
export interface Permission {
  id: string;
  name: string;
  code: string; // e.g., "documents.create", "users.read"
  description: string;
  resource: string; // e.g., "documents", "users"
  action: string; // e.g., "create", "read", "update", "delete"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Role interface matching backend model
 */
export interface Role {
  id: string;
  name: string;
  code: string; // e.g., "admin", "coordinador", "auditor"
  description: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * User role assignment interface
 */
export interface UserRole {
  id: string;
  role: Role;
  assigned_at: string;
  expires_at?: string;
  is_active: boolean;
  assigned_by?: string;
}

/**
 * User permissions response from backend
 */
export interface UserPermissionsResponse {
  success: boolean;
  message: string;
  data: {
    user_id: string;
    user_email: string;
    permissions_by_resource: Record<string, string[]>; // { "documents": ["create", "read"], "users": ["read"] }
    permissions_list: string[]; // ["documents.create", "documents.read", "users.read"]
    total_permissions: number;
  };
}

/**
 * User roles response from backend
 */
export interface UserRolesResponse {
  success: boolean;
  message: string;
  data: {
    user_id: string;
    user_email: string;
    roles: UserRole[];
    total_roles: number;
    role_codes: string[]; // ["admin", "coordinador"]
  };
}

/**
 * Permission check interface for frontend use
 */
export interface PermissionCheck {
  permission: string;
  hasPermission: boolean;
  reason?: string; // For debugging
}

/**
 * Role check interface for frontend use
 */
export interface RoleCheck {
  role: string;
  hasRole: boolean;
  reason?: string; // For debugging
}

/**
 * RBAC context state interface
 */
export interface RBACState {
  permissions: string[]; // ["documents.create", "users.read"]
  permissionsByResource: Record<string, string[]>; // {"documents": ["create", "read"]}
  roles: string[]; // ["admin", "coordinador"]
  roleDetails: UserRole[]; // Full role objects
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

/**
 * RBAC context interface
 */
export interface RBACContextType extends RBACState {
  // Permission methods
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  getResourcePermissions: (resource: string) => string[];

  // Role methods
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;

  // Utility methods
  refreshPermissions: () => Promise<void>;
  clearRBAC: () => void;

  // Check methods (for debugging)
  checkPermission: (permission: string) => PermissionCheck;
  checkRole: (role: string) => RoleCheck;
}

/**
 * Permission gate props interface
 */
export interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean; // If true, requires ALL permissions/roles, if false requires ANY
  fallback?: React.ReactNode; // What to show when access is denied
  children: React.ReactNode;
  showFallback?: boolean; // Whether to show fallback or just hide content
}

/**
 * Protected route props interface
 */
export interface ProtectedRouteProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean;
  fallbackPath?: string; // Where to redirect if access is denied
  children: React.ReactNode;
}

/**
 * Navigation item interface with RBAC
 */
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;

  // RBAC fields
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAll?: boolean;

  // Nesting
  children?: NavigationItem[];

  // UI properties
  isActive?: boolean;
  isDisabled?: boolean;
  badge?: string | number;
  external?: boolean;
}

/**
 * Dashboard configuration interface
 */
export interface DashboardConfig {
  defaultRoute: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
}

/**
 * Dashboard widget interface
 */
export interface DashboardWidget {
  id: string;
  type: string;
  title: string;

  // RBAC fields
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];

  // Layout properties
  position: WidgetPosition;
  size: WidgetSize;
  isVisible: boolean;
  isCollapsible?: boolean;

  // Configuration
  config?: Record<string, unknown>;
}

/**
 * Widget position interface
 */
export interface WidgetPosition {
  row: number;
  column: number;
  rowSpan?: number;
  columnSpan?: number;
}

/**
 * Widget size interface
 */
export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Dashboard layout types
 */
export type DashboardLayout = "grid" | "masonry" | "flex";

/**
 * Permission operation types
 */
export enum PermissionOperation {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  EXPORT = "export",
  IMPORT = "import",
  APPROVE = "approve",
  REJECT = "reject",
  PUBLISH = "publish",
  ARCHIVE = "archive",
}

/**
 * Resource types enum
 */
export enum ResourceType {
  USERS = "users",
  PROCESSES = "processes",
  AUDITS = "audits",
  DOCUMENTS = "documents",
  INDICATORS = "indicators",
  NORMOGRAM = "normogram",
  REPORTS = "reports",
  SETTINGS = "settings",
  DASHBOARD = "dashboard",
}

/**
 * System role codes enum
 */
export enum SystemRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  COORDINADOR = "coordinador",
  AUDITOR = "auditor",
  CONSULTA = "consulta",
  GUEST = "guest",
}

/**
 * Permission patterns for wildcard matching
 */
export interface PermissionPattern {
  pattern: string; // e.g., "documents.*", "*.read"
  matches: (permission: string) => boolean;
}

/**
 * RBAC cache interface
 */
export interface RBACCache {
  permissions: string[];
  roles: string[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string; // For cache invalidation
}

/**
 * RBAC storage keys
 */
export enum RBACStorageKeys {
  PERMISSIONS = "rbac_permissions",
  ROLES = "rbac_roles",
  PERMISSIONS_BY_RESOURCE = "rbac_permissions_by_resource",
  CACHE_TIMESTAMP = "rbac_cache_timestamp",
  CACHE_VERSION = "rbac_cache_version",
}

/**
 * RBAC error types
 */
export enum RBACErrorType {
  PERMISSION_DENIED = "PERMISSION_DENIED",
  ROLE_REQUIRED = "ROLE_REQUIRED",
  INSUFFICIENT_PRIVILEGES = "INSUFFICIENT_PRIVILEGES",
  RBAC_DATA_LOAD_ERROR = "RBAC_DATA_LOAD_ERROR",
  CACHE_ERROR = "CACHE_ERROR",
}

/**
 * RBAC error interface
 */
export interface RBACError {
  type: RBACErrorType;
  message: string;
  requiredPermission?: string;
  requiredRole?: string;
  userPermissions?: string[];
  userRoles?: string[];
}

/**
 * Utility functions for permission checking
 */
export class PermissionUtils {
  /**
   * Check if a permission matches a pattern (supports wildcards)
   */
  static matchesPattern(permission: string, pattern: string): boolean {
    // Convert pattern to regex
    const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(permission);
  }

  /**
   * Get resource from permission code
   */
  static getResource(permission: string): string {
    return permission.split(".")[0];
  }

  /**
   * Get action from permission code
   */
  static getAction(permission: string): string {
    return permission.split(".")[1] || "";
  }

  /**
   * Build permission code from resource and action
   */
  static buildPermission(resource: string, action: string): string {
    return `${resource}.${action}`;
  }

  /**
   * Check if user has super admin permission
   */
  static hasSuperAdminPermission(permissions: string[]): boolean {
    return permissions.includes("*.all");
  }

  /**
   * Get all permissions for a resource
   */
  static getResourcePermissions(
    permissions: string[],
    resource: string,
  ): string[] {
    return permissions.filter(
      (permission) => this.getResource(permission) === resource,
    );
  }

  /**
   * Check if permission list includes wildcard for resource
   */
  static hasWildcardPermission(
    permissions: string[],
    resource: string,
  ): boolean {
    return permissions.some(
      (permission) => permission === `${resource}.*` || permission === "*.all",
    );
  }
}

/**
 * Type guards
 */
export const isPermission = (obj: unknown): obj is Permission => {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.code === "string" &&
    typeof obj.resource === "string" &&
    typeof obj.action === "string"
  );
};

export const isRole = (obj: unknown): obj is Role => {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.code === "string" &&
    typeof obj.is_system === "boolean" &&
    typeof obj.is_active === "boolean"
  );
};

export const isUserPermissionsResponse = (
  response: unknown,
): response is UserPermissionsResponse => {
  return (
    response &&
    response.success === true &&
    response.data &&
    Array.isArray(response.data.permissions_list) &&
    typeof response.data.permissions_by_resource === "object"
  );
};

export const isUserRolesResponse = (
  response: unknown,
): response is UserRolesResponse => {
  return (
    response &&
    response.success === true &&
    response.data &&
    Array.isArray(response.data.roles) &&
    Array.isArray(response.data.role_codes)
  );
};
