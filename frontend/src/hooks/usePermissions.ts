/**
 * usePermissions Hook for ZentraQMS Frontend
 * 
 * This custom hook provides advanced permission checking utilities
 * and convenience methods for RBAC operations.
 */

import { useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { RBACService } from '../services/rbac.service';
import { PermissionUtils } from '../types/rbac.types';

/**
 * Permission check options interface
 */
interface PermissionCheckOptions {
  /** Whether to require all permissions (AND logic) instead of any (OR logic) */
  requireAll?: boolean;
  /** Whether to include inherited permissions from roles */
  includeInherited?: boolean;
  /** Custom validation function */
  customValidator?: (permissions: string[], roles: string[]) => boolean;
}

/**
 * Role check options interface
 */
interface RoleCheckOptions {
  /** Whether to require all roles (AND logic) instead of any (OR logic) */
  requireAll?: boolean;
  /** Whether to check role hierarchy (admin includes coordinador permissions) */
  includeHierarchy?: boolean;
}

/**
 * Permission analysis result interface
 */
interface PermissionAnalysis {
  /** Whether user has the permission */
  hasPermission: boolean;
  /** Reason for the result */
  reason: string;
  /** Type of match found */
  matchType?: 'exact' | 'wildcard' | 'superuser' | 'inherited';
  /** Matched permission pattern */
  matchedPattern?: string;
}

/**
 * Resource permissions interface
 */
interface ResourcePermissions {
  /** Resource name */
  resource: string;
  /** Available actions for this resource */
  actions: string[];
  /** Whether user has wildcard access */
  hasWildcardAccess: boolean;
  /** Whether user is superuser */
  isSuperUser: boolean;
}

/**
 * User capabilities summary interface
 */
interface UserCapabilities {
  /** Whether user is super admin */
  isSuperAdmin: boolean;
  /** Whether user can manage users */
  canManageUsers: boolean;
  /** Whether user can manage processes */
  canManageProcesses: boolean;
  /** Whether user can manage audits */
  canManageAudits: boolean;
  /** Whether user can view reports */
  canViewReports: boolean;
  /** Whether user can manage system settings */
  canManageSystem: boolean;
  /** Whether user can manage documents */
  canManageDocuments: boolean;
  /** Whether user can manage indicators */
  canManageIndicators: boolean;
  /** Custom capabilities */
  custom: Record<string, boolean>;
}

/**
 * usePermissions hook return interface
 */
interface UsePermissionsReturn {
  // Basic permission checks
  hasPermission: (permission: string, options?: PermissionCheckOptions) => boolean;
  hasAnyPermission: (permissions: string[], options?: PermissionCheckOptions) => boolean;
  hasAllPermissions: (permissions: string[], options?: PermissionCheckOptions) => boolean;
  
  // Basic role checks
  hasRole: (role: string, options?: RoleCheckOptions) => boolean;
  hasAnyRole: (roles: string[], options?: RoleCheckOptions) => boolean;
  hasAllRoles: (roles: string[], options?: RoleCheckOptions) => boolean;
  
  // Advanced permission analysis
  analyzePermission: (permission: string) => PermissionAnalysis;
  getResourcePermissions: (resource: string) => ResourcePermissions;
  getUserCapabilities: () => UserCapabilities;
  
  // Permission utilities
  canCreate: (resource: string) => boolean;
  canRead: (resource: string) => boolean;
  canUpdate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canManage: (resource: string) => boolean; // All CRUD operations
  
  // Role utilities
  getPrimaryRole: () => string;
  getRoleHierarchy: () => string[];
  isHigherRoleThan: (role: string) => boolean;
  
  // State
  permissions: string[];
  roles: string[];
  permissionsByResource: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
  
  // Refresh
  refreshPermissions: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for advanced permission management
 */
export const usePermissions = (): UsePermissionsReturn => {
  const {
    permissions,
    roles,
    permissionsByResource,
    rbacLoading,
    rbacError,
    hasPermission: authHasPermission,
    hasAnyPermission: authHasAnyPermission,
    hasAllPermissions: authHasAllPermissions,
    hasRole: authHasRole,
    hasAnyRole: authHasAnyRole,
    hasAllRoles: authHasAllRoles,
    refreshPermissions,
    clearRbacError,
  } = useAuth();

  /**
   * Enhanced permission check with options
   */
  const hasPermission = useCallback(
    (permission: string, options: PermissionCheckOptions = {}): boolean => {
      const { customValidator } = options;

      if (customValidator) {
        return customValidator(permissions, roles);
      }

      return authHasPermission(permission);
    },
    [permissions, roles, authHasPermission]
  );

  /**
   * Enhanced any permission check with options
   */
  const hasAnyPermission = useCallback(
    (checkPermissions: string[], options: PermissionCheckOptions = {}): boolean => {
      const { requireAll = false, customValidator } = options;

      if (customValidator) {
        return customValidator(permissions, roles);
      }

      return requireAll 
        ? authHasAllPermissions(checkPermissions)
        : authHasAnyPermission(checkPermissions);
    },
    [permissions, roles, authHasAllPermissions, authHasAnyPermission]
  );

  /**
   * Enhanced all permissions check with options
   */
  const hasAllPermissions = useCallback(
    (checkPermissions: string[], options: PermissionCheckOptions = {}): boolean => {
      const { customValidator } = options;

      if (customValidator) {
        return customValidator(permissions, roles);
      }

      return authHasAllPermissions(checkPermissions);
    },
    [permissions, roles, authHasAllPermissions]
  );

  /**
   * Enhanced role check with options
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      return authHasRole(role);
    },
    [authHasRole]
  );

  /**
   * Enhanced any role check with options
   */
  const hasAnyRole = useCallback(
    (checkRoles: string[], options: RoleCheckOptions = {}): boolean => {
      const { requireAll = false } = options;

      return requireAll 
        ? authHasAllRoles(checkRoles)
        : authHasAnyRole(checkRoles);
    },
    [authHasAllRoles, authHasAnyRole]
  );

  /**
   * Enhanced all roles check with options
   */
  const hasAllRoles = useCallback(
    (checkRoles: string[]): boolean => {
      return authHasAllRoles(checkRoles);
    },
    [authHasAllRoles]
  );

  /**
   * Analyze a specific permission
   */
  const analyzePermission = useCallback(
    (permission: string): PermissionAnalysis => {
      return RBACService.checkPermissionDetailed(permissions, permission);
    },
    [permissions]
  );

  /**
   * Get permissions for a specific resource
   */
  const getResourcePermissions = useCallback(
    (resource: string): ResourcePermissions => {
      const resourcePerms = permissionsByResource[resource] || [];
      const actions = resourcePerms.map(perm => PermissionUtils.getAction(perm));
      
      return {
        resource,
        actions,
        hasWildcardAccess: permissions.includes(`${resource}.*`),
        isSuperUser: permissions.includes('*.all'),
      };
    },
    [permissions, permissionsByResource]
  );

  /**
   * Get user capabilities summary
   */
  const getUserCapabilities = useCallback((): UserCapabilities => {
    const capabilities = RBACService.getUserCapabilities(permissions, roles, permissionsByResource);
    
    return {
      isSuperAdmin: capabilities.isSuperAdmin,
      canManageUsers: capabilities.capabilities.canManageUsers,
      canManageProcesses: capabilities.capabilities.canManageProcesses,
      canManageAudits: capabilities.capabilities.canManageAudits,
      canViewReports: capabilities.capabilities.canViewReports,
      canManageSystem: capabilities.capabilities.canManageSystem,
      canManageDocuments: hasAnyPermission(['documents.create', 'documents.update', 'documents.delete']),
      canManageIndicators: hasAnyPermission(['indicators.create', 'indicators.update', 'indicators.delete']),
      custom: {
        canExportData: hasAnyPermission(['reports.export', 'data.export']),
        canImportData: hasAnyPermission(['data.import']),
        canManageSettings: hasAnyPermission(['settings.update', 'system.admin']),
        canViewAuditLogs: hasAnyPermission(['audit_logs.read', 'system.admin']),
        canManageRoles: hasAnyPermission(['roles.create', 'roles.update', 'roles.delete']),
        canAssignPermissions: hasAnyPermission(['permissions.assign', 'users.update']),
      },
    };
  }, [permissions, roles, permissionsByResource, hasAnyPermission]);

  /**
   * Check if user can create resources of a type
   */
  const canCreate = useCallback(
    (resource: string): boolean => {
      return hasPermission(`${resource}.create`);
    },
    [hasPermission]
  );

  /**
   * Check if user can read resources of a type
   */
  const canRead = useCallback(
    (resource: string): boolean => {
      return hasPermission(`${resource}.read`) || hasPermission(`${resource}.view`);
    },
    [hasPermission]
  );

  /**
   * Check if user can update resources of a type
   */
  const canUpdate = useCallback(
    (resource: string): boolean => {
      return hasPermission(`${resource}.update`) || hasPermission(`${resource}.edit`);
    },
    [hasPermission]
  );

  /**
   * Check if user can delete resources of a type
   */
  const canDelete = useCallback(
    (resource: string): boolean => {
      return hasPermission(`${resource}.delete`);
    },
    [hasPermission]
  );

  /**
   * Check if user can manage (all CRUD) resources of a type
   */
  const canManage = useCallback(
    (resource: string): boolean => {
      return hasPermission(`${resource}.*`) || 
             (canCreate(resource) && canRead(resource) && canUpdate(resource) && canDelete(resource));
    },
    [hasPermission, canCreate, canRead, canUpdate, canDelete]
  );

  /**
   * Get user's primary role (highest in hierarchy)
   */
  const getPrimaryRole = useCallback((): string => {
    return RBACService.getPrimaryRole(roles);
  }, [roles]);

  /**
   * Get role hierarchy ordered by priority
   */
  const getRoleHierarchy = useCallback((): string[] => {
    const hierarchy = [
      'guest',
      'consulta',
      'auditor', 
      'coordinador',
      'admin',
      'super_admin',
    ];
    
    // Return only roles the user has, ordered by hierarchy
    return hierarchy.filter(role => roles.includes(role));
  }, [roles]);

  /**
   * Check if user has a higher role than the specified one
   */
  const isHigherRoleThan = useCallback(
    (role: string): boolean => {
      const hierarchy = getRoleHierarchy();
      const userHighestRoleIndex = hierarchy.length - 1;
      const compareRoleIndex = hierarchy.indexOf(role);
      
      return compareRoleIndex !== -1 && userHighestRoleIndex > compareRoleIndex;
    },
    [getRoleHierarchy]
  );

  /**
   * Memoized return value
   */
  const hookValue = useMemo((): UsePermissionsReturn => ({
    // Basic permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Basic role checks
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Advanced permission analysis
    analyzePermission,
    getResourcePermissions,
    getUserCapabilities,
    
    // Permission utilities
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
    
    // Role utilities
    getPrimaryRole,
    getRoleHierarchy,
    isHigherRoleThan,
    
    // State
    permissions,
    roles,
    permissionsByResource,
    isLoading: rbacLoading,
    error: rbacError,
    
    // Refresh
    refreshPermissions,
    clearError: clearRbacError,
  }), [
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    analyzePermission,
    getResourcePermissions,
    getUserCapabilities,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
    getPrimaryRole,
    getRoleHierarchy,
    isHigherRoleThan,
    permissions,
    roles,
    permissionsByResource,
    rbacLoading,
    rbacError,
    refreshPermissions,
    clearRbacError,
  ]);

  return hookValue;
};

/**
 * Hook for specific resource permissions
 */
export const useResourcePermissions = (resource: string) => {
  const { getResourcePermissions, canCreate, canRead, canUpdate, canDelete, canManage } = usePermissions();

  const resourcePermissions = useMemo(() => 
    getResourcePermissions(resource), 
    [getResourcePermissions, resource]
  );

  const actions = useMemo(() => ({
    canCreate: canCreate(resource),
    canRead: canRead(resource),
    canUpdate: canUpdate(resource),
    canDelete: canDelete(resource),
    canManage: canManage(resource),
  }), [canCreate, canRead, canUpdate, canDelete, canManage, resource]);

  return {
    ...resourcePermissions,
    actions,
  };
};

/**
 * Hook for role-based UI decisions
 */
export const useRoleBasedUI = () => {
  const { getPrimaryRole, getRoleHierarchy, getUserCapabilities } = usePermissions();

  const primaryRole = getPrimaryRole();
  const roleHierarchy = getRoleHierarchy();
  const capabilities = getUserCapabilities();

  const uiConfig = useMemo(() => {
    const config = {
      showAdminMenu: capabilities.isSuperAdmin || capabilities.canManageUsers,
      showProcessMenu: capabilities.canManageProcesses,
      showAuditMenu: capabilities.canManageAudits,
      showReportsMenu: capabilities.canViewReports,
      showSettingsMenu: capabilities.canManageSystem,
      showDocumentsMenu: capabilities.canManageDocuments,
      showIndicatorsMenu: capabilities.canManageIndicators,
      
      // Dashboard variations
      dashboardType: primaryRole === 'super_admin' ? 'admin' :
                    primaryRole === 'admin' ? 'admin' :
                    primaryRole === 'coordinador' ? 'coordinator' :
                    primaryRole === 'auditor' ? 'auditor' :
                    primaryRole === 'consulta' ? 'readonly' : 'guest',
    };

    return config;
  }, [capabilities, primaryRole]);

  return {
    primaryRole,
    roleHierarchy,
    capabilities,
    uiConfig,
  };
};

export default usePermissions;