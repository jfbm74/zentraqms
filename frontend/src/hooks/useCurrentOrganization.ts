/**
 * useCurrentOrganization Hook for ZentraQMS Frontend
 *
 * Custom hook for getting the current user's organization, similar to
 * the backend SOGCS _get_user_organization() logic.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { apiClient } from "../api/endpoints";

export interface CurrentOrganization {
  id: string;
  razon_social: string;
  nombre_comercial?: string;
  nit: string;
  digito_verificacion: string;
  tipo_organizacion: string;
  sector_economico: string;
  email_contacto?: string;
  telefono_principal?: string;
  is_active: boolean;
  // Health organization fields (if applicable)
  health_profile?: {
    id: string;
    codigo_prestador: string;
    tipo_prestador: string;
    nivel_complejidad: string;
    naturaleza_juridica: string;
    verificado_reps: boolean;
  };
}

interface CurrentOrganizationState {
  organization: CurrentOrganization | null;
  isLoading: boolean;
  error: string | null;
}

export const useCurrentOrganization = () => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<CurrentOrganizationState>({
    organization: null,
    isLoading: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<CurrentOrganizationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const fetchCurrentOrganization = useCallback(async () => {
    if (!isAuthenticated || !user) {
      updateState({ 
        organization: null, 
        error: "User not authenticated" 
      });
      return null;
    }

    updateState({ isLoading: true, error: null });

    try {
      // Try to get organizations for the current user
      // First attempt: Get user's organizations
      const response = await apiClient.get("/api/v1/organizations/");
      
      let organization = null;
      
      if (response.data?.results && response.data.results.length > 0) {
        // Get the first organization (user's primary organization)
        organization = response.data.results[0];
        
        // Try to get health profile if it's a health organization
        if (organization.sector_economico === 'salud') {
          try {
            const healthResponse = await apiClient.get(`/api/v1/organizations/${organization.id}/health-profile/`);
            if (healthResponse.data) {
              organization.health_profile = healthResponse.data;
            }
          } catch (healthError) {
            // Health profile doesn't exist or user doesn't have access
            console.debug("No health profile found for organization:", organization.id);
          }
        }
      } else {
        // No organizations found for this user
        updateState({
          organization: null,
          isLoading: false,
          error: "No se encontró una organización asociada al usuario",
        });
        return null;
      }

      updateState({
        organization,
        isLoading: false,
        error: null,
      });

      return organization;
    } catch (error: any) {
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.detail ||
        "Error al obtener la organización del usuario";
      
      updateState({
        isLoading: false,
        error: errorMessage,
      });
      
      console.error("Error fetching current organization:", error);
      return null;
    }
  }, [isAuthenticated, user, updateState]);

  // Fetch organization when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCurrentOrganization();
    } else {
      setState({
        organization: null,
        isLoading: false,
        error: null,
      });
    }
  }, [isAuthenticated, user, fetchCurrentOrganization]);

  return {
    organization: state.organization,
    isLoading: state.isLoading,
    error: state.error,
    fetchCurrentOrganization,
    clearError,
    // Convenience properties
    hasOrganization: !!state.organization,
    isHealthOrganization: state.organization?.sector_economico === 'salud',
    hasHealthProfile: !!state.organization?.health_profile,
  };
};

export default useCurrentOrganization;