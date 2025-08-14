/**
 * Higher-order component for authentication protection
 *
 * This HOC wraps components that require authentication and handles
 * loading states and authentication checks automatically.
 */

import React from "react";
import { useAuth } from "../../hooks/useAuth";

/**
 * Higher-order component for auth protection
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> => {
  return function AuthProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login will be handled by route protection
      return null;
    }

    return <Component {...props} />;
  };
};

export default withAuth;
