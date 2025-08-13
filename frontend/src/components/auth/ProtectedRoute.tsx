/**
 * Protected Route Component for ZentraQMS Frontend
 * 
 * Adapted from Velzon's AuthProtected component to work with our AuthContext.
 * Protects routes from unauthorized access and handles authentication state.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Component
 * 
 * This component checks if the user is authenticated before rendering children.
 * If not authenticated, redirects to login page with return path.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
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

  // If authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;