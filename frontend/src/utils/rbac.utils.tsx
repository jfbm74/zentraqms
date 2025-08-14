/**
 * RBAC Utility Components
 *
 * Contains only React components to comply with React Fast Refresh
 */

import React from "react";
import { PermissionGate } from "../components/common/PermissionGate";

/**
 * Utility components for common permission scenarios
 */

// Admin only component
export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGate roles={["admin", "super_admin"]} fallback={fallback}>
    {children}
  </PermissionGate>
);

// Super admin only component
export const SuperAdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGate role="super_admin" fallback={fallback}>
    {children}
  </PermissionGate>
);

// Staff only component
export const StaffOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGate
    roles={["admin", "super_admin", "coordinador"]}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

// Can manage users component
export const CanManageUsers: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGate
    permissions={["users.*", "users.create", "users.update", "users.delete"]}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

// Can manage processes component
export const CanManageProcesses: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGate
    permissions={[
      "processes.*",
      "processes.create",
      "processes.update",
      "processes.delete",
    ]}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

// Can view reports component
export const CanViewReports: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGate
    permissions={["reports.*", "reports.read", "reports.export"]}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);
