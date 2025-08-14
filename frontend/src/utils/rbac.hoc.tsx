/**
 * Higher-Order Components for RBAC
 *
 * Separated to comply with React Fast Refresh requirements
 */

import React from "react";
import { PermissionGate } from "../components/common/PermissionGate";

/**
 * Higher-order component wrapper for PermissionGate
 */
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  permissionProps: Omit<
    React.ComponentProps<typeof PermissionGate>,
    "children"
  >,
) => {
  return React.forwardRef<HTMLElement, P>((props, ref) => (
    <PermissionGate {...permissionProps}>
      <Component {...props} ref={ref} />
    </PermissionGate>
  ));
};
