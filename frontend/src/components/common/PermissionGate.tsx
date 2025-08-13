/**
 * Permission Gate Component for ZentraQMS Frontend
 * 
 * This component provides declarative permission-based access control
 * for conditionally rendering UI elements based on user permissions and roles.
 */

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { RBACService } from '../../services/rbac.service';

/**
 * Props for PermissionGate component
 */
interface PermissionGateProps {
  /** Children to render if permission check passes */
  children: React.ReactNode;
  
  /** Single permission to check */
  permission?: string;
  
  /** Array of permissions - user needs ANY of these */
  permissions?: string[];
  
  /** Array of permissions - user needs ALL of these */
  requireAllPermissions?: string[];
  
  /** Single role to check */
  role?: string;
  
  /** Array of roles - user needs ANY of these */
  roles?: string[];
  
  /** Array of roles - user needs ALL of these */
  requireAllRoles?: string[];
  
  /** Custom permission check function */
  customCheck?: (userPermissions: string[], userRoles: string[]) => boolean;
  
  /** Fallback component to render when permission is denied */
  fallback?: React.ReactNode;
  
  /** Whether to show nothing when permission is denied (default: true) */
  hideOnDeny?: boolean;
  
  /** Whether to show loading state while RBAC data is being fetched */
  showLoading?: boolean;
  
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  
  /** Whether to use strict mode (requires authentication) */
  requireAuth?: boolean;
}

/**
 * Default loading component
 */
const DefaultLoadingComponent: React.FC = () => (
  <div className="d-flex justify-content-center align-items-center p-2">
    <div className="spinner-border spinner-border-sm text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

/**
 * PermissionGate component for conditional rendering based on RBAC
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  permissions = [],
  requireAllPermissions = [],
  role,
  roles = [],
  requireAllRoles = [],
  customCheck,
  fallback = null,
  hideOnDeny = true,
  showLoading = false,
  loadingComponent,
  requireAuth = true,
}) => {
  const {
    isAuthenticated,
    permissions: userPermissions,
    roles: userRoles,
    rbacLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  } = useAuth();

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return hideOnDeny ? null : <>{fallback}</>;
  }

  // Show loading state if RBAC data is being fetched
  if (showLoading && rbacLoading) {
    return loadingComponent ? <>{loadingComponent}</> : <DefaultLoadingComponent />;
  }

  // Perform permission checks
  const performPermissionChecks = (): boolean => {
    // Custom check has highest priority
    if (customCheck) {
      return customCheck(userPermissions, userRoles);
    }

    const checks: boolean[] = [];

    // Single permission check
    if (permission) {
      checks.push(hasPermission(permission));
    }

    // Any permission check
    if (permissions.length > 0) {
      checks.push(hasAnyPermission(permissions));
    }

    // All permissions check
    if (requireAllPermissions.length > 0) {
      checks.push(hasAllPermissions(requireAllPermissions));
    }

    // Single role check
    if (role) {
      checks.push(hasRole(role));
    }

    // Any role check
    if (roles.length > 0) {
      checks.push(hasAnyRole(roles));
    }

    // All roles check
    if (requireAllRoles.length > 0) {
      checks.push(hasAllRoles(requireAllRoles));
    }

    // If no checks specified, default to true (allow access)
    if (checks.length === 0) {
      return true;
    }

    // All checks must pass (AND logic)
    return checks.every(check => check);
  };

  // Perform the permission check
  const hasAccess = performPermissionChecks();

  // Render based on access result
  if (hasAccess) {
    return <>{children}</>;
  } else {
    return hideOnDeny ? null : <>{fallback}</>;
  }
};

/**
 * Higher-order component wrapper for PermissionGate
 */
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  permissionProps: Omit<PermissionGateProps, 'children'>
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <PermissionGate {...permissionProps}>
      <Component {...props} ref={ref} />
    </PermissionGate>
  ));
};

/**
 * Hook for imperative permission checking
 */
export const usePermissionGate = () => {
  const {
    permissions: userPermissions,
    roles: userRoles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  } = useAuth();

  const checkPermission = React.useCallback(
    (options: Omit<PermissionGateProps, 'children' | 'fallback' | 'hideOnDeny' | 'showLoading' | 'loadingComponent' | 'requireAuth'>): boolean => {
      const {
        permission,
        permissions = [],
        requireAllPermissions = [],
        role,
        roles = [],
        requireAllRoles = [],
        customCheck,
      } = options;

      // Custom check has highest priority
      if (customCheck) {
        return customCheck(userPermissions, userRoles);
      }

      const checks: boolean[] = [];

      // Single permission check
      if (permission) {
        checks.push(hasPermission(permission));
      }

      // Any permission check
      if (permissions.length > 0) {
        checks.push(hasAnyPermission(permissions));
      }

      // All permissions check
      if (requireAllPermissions.length > 0) {
        checks.push(hasAllPermissions(requireAllPermissions));
      }

      // Single role check
      if (role) {
        checks.push(hasRole(role));
      }

      // Any role check
      if (roles.length > 0) {
        checks.push(hasAnyRole(roles));
      }

      // All roles check
      if (requireAllRoles.length > 0) {
        checks.push(hasAllRoles(requireAllRoles));
      }

      // If no checks specified, default to true
      if (checks.length === 0) {
        return true;
      }

      // All checks must pass (AND logic)
      return checks.every(check => check);
    },
    [
      userPermissions,
      userRoles,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      hasAnyRole,
      hasAllRoles,
    ]
  );

  return {
    checkPermission,
    userPermissions,
    userRoles,
  };
};

/**
 * Utility components for common permission scenarios
 */

// Admin only component
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <PermissionGate roles={['admin', 'super_admin']} fallback={fallback}>
    {children}
  </PermissionGate>
);

// Super admin only component
export const SuperAdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <PermissionGate role="super_admin" fallback={fallback}>
    {children}
  </PermissionGate>
);

// Staff only component
export const StaffOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <PermissionGate roles={['admin', 'super_admin', 'coordinador']} fallback={fallback}>
    {children}
  </PermissionGate>
);

// Can manage users component
export const CanManageUsers: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <PermissionGate permissions={['users.*', 'users.create', 'users.update', 'users.delete']} fallback={fallback}>
    {children}
  </PermissionGate>
);

// Can manage processes component
export const CanManageProcesses: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <PermissionGate permissions={['processes.*', 'processes.create', 'processes.update', 'processes.delete']} fallback={fallback}>
    {children}
  </PermissionGate>
);

// Can view reports component
export const CanViewReports: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <PermissionGate permissions={['reports.*', 'reports.read', 'reports.export']} fallback={fallback}>
    {children}
  </PermissionGate>
);

export default PermissionGate;