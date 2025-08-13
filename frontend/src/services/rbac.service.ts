/**
 * RBAC Service for ZentraQMS Frontend
 * 
 * This service handles all RBAC-related API calls to fetch user permissions
 * and roles from the backend.
 */

import { apiClient, AUTH_ENDPOINTS } from '../api/endpoints';
import type {
  UserPermissionsResponse,
  UserRolesResponse,
  PermissionUtils,
} from '../types/rbac.types';

/**
 * RBAC service class
 */
export class RBACService {
  /**
   * Fetch user permissions from backend
   */
  static async fetchUserPermissions(): Promise<UserPermissionsResponse> {
    try {
      const response = await apiClient.get(AUTH_ENDPOINTS.PERMISSIONS);
      return response.data;
    } catch (error) {
      console.error('[RBACService] Failed to fetch user permissions:', error);
      throw new Error('Failed to fetch user permissions');
    }
  }

  /**
   * Fetch user roles from backend
   */
  static async fetchUserRoles(): Promise<UserRolesResponse> {
    try {
      const response = await apiClient.get(AUTH_ENDPOINTS.ROLES);
      return response.data;
    } catch (error) {
      console.error('[RBACService] Failed to fetch user roles:', error);
      throw new Error('Failed to fetch user roles');
    }
  }

  /**
   * Fetch both permissions and roles in parallel
   */
  static async fetchUserRBACData(): Promise<{
    permissions: UserPermissionsResponse;
    roles: UserRolesResponse;
  }> {
    try {
      const [permissionsResponse, rolesResponse] = await Promise.all([
        this.fetchUserPermissions(),
        this.fetchUserRoles(),
      ]);

      return {
        permissions: permissionsResponse,
        roles: rolesResponse,
      };
    } catch (error) {
      console.error('[RBACService] Failed to fetch RBAC data:', error);
      throw new Error('Failed to fetch user permissions and roles');
    }
  }

  /**
   * Check if user has specific permission (local check)
   */
  static hasPermission(userPermissions: string[], permission: string): boolean {
    if (!userPermissions || userPermissions.length === 0) {
      return false;
    }

    // Check for super admin permission
    if (userPermissions.includes('*.all')) {
      return true;
    }

    // Check for exact match
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Check for wildcard permissions
    const resource = PermissionUtils.getResource(permission);
    const wildcardPermission = `${resource}.*`;
    
    return userPermissions.includes(wildcardPermission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(userPermissions: string[], permissions: string[]): boolean {
    return permissions.some(permission => 
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * Check if user has all of the specified permissions
   */
  static hasAllPermissions(userPermissions: string[], permissions: string[]): boolean {
    return permissions.every(permission => 
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * Check if user has specific role
   */
  static hasRole(userRoles: string[], role: string): boolean {
    if (!userRoles || userRoles.length === 0) {
      return false;
    }

    return userRoles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(userRoles: string[], roles: string[]): boolean {
    return roles.some(role => this.hasRole(userRoles, role));
  }

  /**
   * Check if user has all of the specified roles
   */
  static hasAllRoles(userRoles: string[], roles: string[]): boolean {
    return roles.every(role => this.hasRole(userRoles, role));
  }

  /**
   * Get permissions for a specific resource
   */
  static getResourcePermissions(
    permissionsByResource: Record<string, string[]>, 
    resource: string
  ): string[] {
    return permissionsByResource[resource] || [];
  }

  /**
   * Transform backend permissions response to frontend format
   */
  static transformPermissionsData(response: UserPermissionsResponse): {
    permissions: string[];
    permissionsByResource: Record<string, string[]>;
  } {
    return {
      permissions: response.data.permissions_list,
      permissionsByResource: response.data.permissions_by_resource,
    };
  }

  /**
   * Transform backend roles response to frontend format
   */
  static transformRolesData(response: UserRolesResponse): {
    roles: string[];
    roleDetails: unknown[];
  } {
    return {
      roles: response.data.role_codes,
      roleDetails: response.data.roles,
    };
  }

  /**
   * Check permission with detailed result (for debugging)
   */
  static checkPermissionDetailed(userPermissions: string[], permission: string): {
    hasPermission: boolean;
    reason: string;
    matchType?: 'exact' | 'wildcard' | 'superuser';
  } {
    if (!userPermissions || userPermissions.length === 0) {
      return {
        hasPermission: false,
        reason: 'User has no permissions',
      };
    }

    // Check for super admin permission
    if (userPermissions.includes('*.all')) {
      return {
        hasPermission: true,
        reason: 'Super admin permission grants access to all resources',
        matchType: 'superuser',
      };
    }

    // Check for exact match
    if (userPermissions.includes(permission)) {
      return {
        hasPermission: true,
        reason: `Exact permission match: ${permission}`,
        matchType: 'exact',
      };
    }

    // Check for wildcard permissions
    const resource = PermissionUtils.getResource(permission);
    const wildcardPermission = `${resource}.*`;
    
    if (userPermissions.includes(wildcardPermission)) {
      return {
        hasPermission: true,
        reason: `Wildcard permission match: ${wildcardPermission}`,
        matchType: 'wildcard',
      };
    }

    return {
      hasPermission: false,
      reason: `No matching permission found for: ${permission}`,
    };
  }

  /**
   * Check role with detailed result (for debugging)
   */
  static checkRoleDetailed(userRoles: string[], role: string): {
    hasRole: boolean;
    reason: string;
  } {
    if (!userRoles || userRoles.length === 0) {
      return {
        hasRole: false,
        reason: 'User has no roles assigned',
      };
    }

    if (userRoles.includes(role)) {
      return {
        hasRole: true,
        reason: `User has role: ${role}`,
      };
    }

    return {
      hasRole: false,
      reason: `User does not have role: ${role}`,
    };
  }

  /**
   * Get user capabilities summary
   */
  static getUserCapabilities(
    permissions: string[],
    roles: string[],
    permissionsByResource: Record<string, string[]>
  ): {
    isSuperAdmin: boolean;
    resourceAccess: Record<string, string[]>;
    roleCount: number;
    permissionCount: number;
    capabilities: {
      canManageUsers: boolean;
      canManageProcesses: boolean;
      canManageAudits: boolean;
      canViewReports: boolean;
      canManageSystem: boolean;
    };
  } {
    const isSuperAdmin = permissions.includes('*.all');
    
    const capabilities = {
      canManageUsers: this.hasAnyPermission(permissions, ['users.create', 'users.update', 'users.delete']),
      canManageProcesses: this.hasAnyPermission(permissions, ['processes.create', 'processes.update', 'processes.delete']),
      canManageAudits: this.hasAnyPermission(permissions, ['audits.create', 'audits.update', 'audits.delete']),
      canViewReports: this.hasAnyPermission(permissions, ['reports.read', 'reports.export']),
      canManageSystem: this.hasAnyPermission(permissions, ['settings.update', 'system.admin']),
    };

    return {
      isSuperAdmin,
      resourceAccess: permissionsByResource,
      roleCount: roles.length,
      permissionCount: permissions.length,
      capabilities,
    };
  }

  /**
   * Determine primary role for dashboard routing
   */
  static getPrimaryRole(roles: string[]): string {
    // Role hierarchy (higher index = higher priority)
    const roleHierarchy = [
      'guest',
      'consulta',
      'auditor', 
      'coordinador',
      'admin',
      'super_admin',
    ];

    // Find the highest priority role
    let primaryRole = 'guest';
    let highestPriority = -1;

    for (const role of roles) {
      const priority = roleHierarchy.indexOf(role);
      if (priority > highestPriority) {
        highestPriority = priority;
        primaryRole = role;
      }
    }

    return primaryRole;
  }

  /**
   * Get default route based on primary role
   */
  static getDefaultRouteForRole(role: string): string {
    const routeMap: Record<string, string> = {
      super_admin: '/dashboard',
      admin: '/dashboard',
      coordinador: '/dashboard', 
      auditor: '/auditorias',
      consulta: '/procesos',
      guest: '/dashboard',
    };

    return routeMap[role] || '/dashboard';
  }

  /**
   * Validate RBAC data integrity
   */
  static validateRBACData(data: {
    permissions: string[];
    roles: string[];
    permissionsByResource: Record<string, string[]>;
  }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if permissions array is valid
    if (!Array.isArray(data.permissions)) {
      errors.push('Permissions must be an array');
    }

    // Check if roles array is valid
    if (!Array.isArray(data.roles)) {
      errors.push('Roles must be an array');
    }

    // Check if permissionsByResource is an object
    if (typeof data.permissionsByResource !== 'object' || data.permissionsByResource === null) {
      errors.push('PermissionsByResource must be an object');
    }

    // Validate permission format
    if (Array.isArray(data.permissions)) {
      for (const permission of data.permissions) {
        if (typeof permission !== 'string') {
          errors.push(`Invalid permission format: ${permission}`);
          continue;
        }
        
        if (!permission.includes('.') && permission !== '*.all') {
          errors.push(`Invalid permission format: ${permission} (should be resource.action)`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default RBACService;