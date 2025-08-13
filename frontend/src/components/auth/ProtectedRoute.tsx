/**
 * Protected Route Component for ZentraQMS Frontend
 * 
 * Adapted from Velzon's AuthProtected component to work with our AuthContext.
 * Protects routes from unauthorized access and handles authentication state.
 * Phase 5: Enhanced with RBAC support for roles and permissions.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  
  /** Single permission required to access route */
  permission?: string;
  
  /** Array of permissions - user needs ANY of these */
  permissions?: string[];
  
  /** Array of permissions - user needs ALL of these */
  requireAllPermissions?: string[];
  
  /** Single role required to access route */
  role?: string;
  
  /** Array of roles - user needs ANY of these */
  roles?: string[];
  
  /** Array of roles - user needs ALL of these */
  requireAllRoles?: string[];
  
  /** Custom permission check function */
  customCheck?: (userPermissions: string[], userRoles: string[]) => boolean;
  
  /** Redirect path when access is denied (default: /access-denied) */
  accessDeniedRedirect?: string;
  
  /** Whether to show loading during RBAC check */
  showRbacLoading?: boolean;
  
  /** Minimum user verification level required */
  requireVerified?: boolean;
  
  /** Whether user must be active */
  requireActive?: boolean;
}

/**
 * Protected Route Component
 * 
 * This component checks authentication and authorization before rendering children.
 * Phase 5: Enhanced with comprehensive RBAC support.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  permission,
  permissions = [],
  requireAllPermissions = [],
  role,
  roles = [],
  requireAllRoles = [],
  customCheck,
  accessDeniedRedirect = '/access-denied',
  showRbacLoading = true,
  requireVerified = false,
  requireActive = true,
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    rbacLoading,
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    permissions: userPermissions,
    roles: userRoles,
  } = useAuth();
  
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If not authenticated, redirect to login with return path
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Show loading while RBAC data is being fetched
  if (showRbacLoading && rbacLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-3 text-muted">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // User verification check
  if (requireVerified && user && !user.is_verified) {
    return (
      <Navigate 
        to="/verify-account" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // User active status check
  if (requireActive && user && !user.is_active) {
    return (
      <Navigate 
        to="/account-inactive" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Perform RBAC checks
  const performRBACCheck = (): boolean => {
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

    // If no RBAC checks specified, allow access (only auth required)
    if (checks.length === 0) {
      return true;
    }

    // All checks must pass (AND logic)
    return checks.every(check => check);
  };

  // Check RBAC permissions
  const hasAccess = performRBACCheck();

  // If access denied, redirect to access denied page
  if (!hasAccess) {
    return (
      <Navigate 
        to={accessDeniedRedirect}
        state={{ 
          from: location,
          reason: 'insufficient_permissions',
          requiredPermissions: [
            ...(permission ? [permission] : []),
            ...permissions,
            ...requireAllPermissions,
          ],
          requiredRoles: [
            ...(role ? [role] : []),
            ...roles,
            ...requireAllRoles,
          ],
        }} 
        replace 
      />
    );
  }

  // If authenticated and authorized, render children
  return <>{children}</>;
};

export default ProtectedRoute;