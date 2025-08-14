/**
 * useOrganization Hook for ZentraQMS Frontend
 *
 * Custom hook for organization management operations including
 * CRUD operations, validation, and state management.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useAuth } from "./useAuth";
import { apiClient } from "../api/endpoints";
import { toast } from "react-toastify";

// Types
export interface Organization {
  id: string;
  razon_social: string;
  nombre_comercial?: string;
  nit: string;
  digito_verificacion: string;
  tipo_organizacion: string;
  sector_economico: string;
  tamaño_empresa: string;
  fecha_fundacion?: string;
  descripcion?: string;
  website?: string;
  email_contacto?: string;
  telefono_principal?: string;
  logo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Location {
  id: string;
  organization: string;
  nombre: string;
  tipo_sede: string;
  es_principal: boolean;
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  codigo_postal?: string;
  telefono?: string;
  email?: string;
  area_m2?: number;
  capacidad_personas?: number;
  fecha_apertura?: string;
  horario_atencion?: string;
  responsable_nombre?: string;
  responsable_cargo?: string;
  responsable_telefono?: string;
  responsable_email?: string;
  observaciones?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationState {
  organization: Organization | null;
  locations: Location[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UseOrganizationReturn {
  // State
  organization: Organization | null;
  locations: Location[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Organization operations
  fetchOrganization: (id?: string) => Promise<Organization | null>;
  createOrganization: (data: Partial<Organization>) => Promise<Organization>;
  updateOrganization: (
    id: string,
    data: Partial<Organization>,
  ) => Promise<Organization>;
  deleteOrganization: (id: string) => Promise<void>;

  // Location operations
  fetchLocations: (organizationId?: string) => Promise<Location[]>;
  createLocation: (data: Partial<Location>) => Promise<Location>;
  updateLocation: (id: string, data: Partial<Location>) => Promise<Location>;
  deleteLocation: (id: string) => Promise<void>;

  // Validation operations
  validateNit: (nit: string, verificationDigit: string) => Promise<boolean>;
  calculateVerificationDigit: (nit: string) => number;
  checkNitAvailability: (nit: string) => Promise<boolean>;

  // Utility methods
  clearError: () => void;
  refresh: () => Promise<void>;
  resetState: () => void;

  // Computed properties
  isOrganizationComplete: boolean;
  hasLocations: boolean;
  mainLocation: Location | null;
  isCurrentUserOwner: boolean;
}

/**
 * Colombian NIT verification digit calculation
 */
export const calculateNitVerificationDigit = (nit: string): number => {
  const cleanNit = nit.replace(/\D/g, "");
  if (cleanNit.length < 8) return 0;

  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const nitArray = cleanNit.split("").map(Number).reverse();

  let sum = 0;
  for (let i = 0; i < nitArray.length; i++) {
    if (i < weights.length) {
      sum += nitArray[i] * weights[i];
    }
  }

  const remainder = sum % 11;
  return remainder < 2 ? remainder : 11 - remainder;
};

/**
 * Custom hook for organization management
 */
export const useOrganization = (
  initialOrganizationId?: string,
): UseOrganizationReturn => {
  const { user, isAuthenticated } = useAuth();

  const [state, setState] = useState<OrganizationState>({
    organization: null,
    locations: [],
    isLoading: false,
    isSaving: false,
    error: null,
    lastUpdated: null,
  });

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<OrganizationState>) => {
    setState((prev) => ({
      ...prev,
      ...updates,
      lastUpdated: new Date(),
    }));
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Reset entire state
   */
  const resetState = useCallback(() => {
    setState({
      organization: null,
      locations: [],
      isLoading: false,
      isSaving: false,
      error: null,
      lastUpdated: null,
    });
  }, []);

  /**
   * Fetch organization by ID
   */
  const fetchOrganization = useCallback(
    async (id?: string): Promise<Organization | null> => {
      if (!isAuthenticated) {
        throw new Error("User must be authenticated to fetch organization");
      }

      const organizationId = id || initialOrganizationId;
      if (!organizationId) {
        updateState({ error: "Organization ID is required" });
        return null;
      }

      updateState({ isLoading: true, error: null });

      try {
        const response = await apiClient.get(
          `/api/v1/organizations/${organizationId}/`,
        );
        const organization = response.data;

        updateState({
          organization,
          isLoading: false,
          error: null,
        });

        return organization;
      } catch (error: unknown) {
        const errorMessage =
          error.response?.data?.message || "Failed to fetch organization";
        updateState({
          isLoading: false,
          error: errorMessage,
        });
        throw error;
      }
    },
    [isAuthenticated, initialOrganizationId, updateState],
  );

  /**
   * Create new organization
   */
  const createOrganization = useCallback(
    async (data: Partial<Organization>): Promise<Organization> => {
      if (!isAuthenticated) {
        throw new Error("User must be authenticated to create organization");
      }

      updateState({ isSaving: true, error: null });

      try {
        const response = await apiClient.post("/api/v1/organizations/", data);
        const organization = response.data;

        updateState({
          organization,
          isSaving: false,
          error: null,
        });

        toast.success("Organización creada exitosamente");
        return organization;
      } catch (error: unknown) {
        const errorMessage =
          error.response?.data?.message || "Failed to create organization";
        updateState({
          isSaving: false,
          error: errorMessage,
        });
        toast.error(errorMessage);
        throw error;
      }
    },
    [isAuthenticated, updateState],
  );

  /**
   * Update organization
   */
  const updateOrganization = useCallback(
    async (id: string, data: Partial<Organization>): Promise<Organization> => {
      if (!isAuthenticated) {
        throw new Error("User must be authenticated to update organization");
      }

      updateState({ isSaving: true, error: null });

      try {
        const response = await apiClient.patch(
          `/api/v1/organizations/${id}/`,
          data,
        );
        const organization = response.data;

        updateState({
          organization,
          isSaving: false,
          error: null,
        });

        toast.success("Organización actualizada exitosamente");
        return organization;
      } catch (error: unknown) {
        const errorMessage =
          error.response?.data?.message || "Failed to update organization";
        updateState({
          isSaving: false,
          error: errorMessage,
        });
        toast.error(errorMessage);
        throw error;
      }
    },
    [isAuthenticated, updateState],
  );

  /**
   * Delete organization
   */
  const deleteOrganization = useCallback(
    async (id: string): Promise<void> => {
      if (!isAuthenticated) {
        throw new Error("User must be authenticated to delete organization");
      }

      updateState({ isSaving: true, error: null });

      try {
        await apiClient.delete(`/api/v1/organizations/${id}/`);

        updateState({
          organization: null,
          locations: [],
          isSaving: false,
          error: null,
        });

        toast.success("Organización eliminada exitosamente");
      } catch (error: unknown) {
        const errorMessage =
          error.response?.data?.message || "Failed to delete organization";
        updateState({
          isSaving: false,
          error: errorMessage,
        });
        toast.error(errorMessage);
        throw error;
      }
    },
    [isAuthenticated, updateState],
  );

  /**
   * Fetch locations for organization
   */
  const fetchLocations = useCallback(
    async (organizationId?: string): Promise<Location[]> => {
      if (!isAuthenticated) {
        throw new Error("User must be authenticated to fetch locations");
      }

      const orgId = organizationId || state.organization?.id;
      if (!orgId) {
        updateState({
          error: "Organization ID is required to fetch locations",
        });
        return [];
      }

      updateState({ isLoading: true, error: null });

      try {
        const response = await apiClient.get(
          `/api/v1/organizations/${orgId}/locations/`,
        );
        const locations = response.data.results || response.data;

        updateState({
          locations,
          isLoading: false,
          error: null,
        });

        return locations;
      } catch (error: unknown) {
        const errorMessage =
          error.response?.data?.message || "Failed to fetch locations";
        updateState({
          isLoading: false,
          error: errorMessage,
        });
        throw error;
      }
    },
    [isAuthenticated, state.organization?.id, updateState],
  );

  /**
   * Create new location
   */
  const createLocation = useCallback(
    async (data: Partial<Location>): Promise<Location> => {
      if (!isAuthenticated) {
        throw new Error("User must be authenticated to create location");
      }

      updateState({ isSaving: true, error: null });

      try {
        const response = await apiClient.post("/api/v1/locations/", data);
        const location = response.data;

        updateState({
          locations: [...state.locations, location],
          isSaving: false,
          error: null,
        });

        toast.success("Sede creada exitosamente");
        return location;
      } catch (error: unknown) {
        const errorMessage =
          error.response?.data?.message || "Failed to create location";
        updateState({
          isSaving: false,
          error: errorMessage,
        });
        toast.error(errorMessage);
        throw error;
      }
    },
    [isAuthenticated, state.locations, updateState],
  );

  /**
   * Update location
   */
  const updateLocation = useCallback(
    async (id: string, data: Partial<Location>): Promise<Location> => {
      if (!isAuthenticated) {
        throw new Error("User must be authenticated to update location");
      }

      updateState({ isSaving: true, error: null });

      try {
        const response = await apiClient.patch(
          `/api/v1/locations/${id}/`,
          data,
        );
        const location = response.data;

        updateState({
          locations: state.locations.map((loc) =>
            loc.id === id ? location : loc,
          ),
          isSaving: false,
          error: null,
        });

        toast.success("Sede actualizada exitosamente");
        return location;
      } catch (error: unknown) {
        const errorMessage =
          error.response?.data?.message || "Failed to update location";
        updateState({
          isSaving: false,
          error: errorMessage,
        });
        toast.error(errorMessage);
        throw error;
      }
    },
    [isAuthenticated, state.locations, updateState],
  );

  /**
   * Delete location
   */
  const deleteLocation = useCallback(
    async (id: string): Promise<void> => {
      if (!isAuthenticated) {
        throw new Error("User must be authenticated to delete location");
      }

      updateState({ isSaving: true, error: null });

      try {
        await apiClient.delete(`/api/v1/locations/${id}/`);

        updateState({
          locations: state.locations.filter((loc) => loc.id !== id),
          isSaving: false,
          error: null,
        });

        toast.success("Sede eliminada exitosamente");
      } catch (error: unknown) {
        const errorMessage =
          error.response?.data?.message || "Failed to delete location";
        updateState({
          isSaving: false,
          error: errorMessage,
        });
        toast.error(errorMessage);
        throw error;
      }
    },
    [isAuthenticated, state.locations, updateState],
  );

  /**
   * Validate NIT and verification digit
   */
  const validateNit = useCallback(
    async (nit: string, verificationDigit: string): Promise<boolean> => {
      try {
        const response = await apiClient.post(
          "/api/v1/organizations/validate-nit/",
          {
            nit,
            digito_verificacion: verificationDigit,
          },
        );
        return response.data.valid;
      } catch {
        return false;
      }
    },
    [],
  );

  /**
   * Calculate verification digit for NIT
   */
  const calculateVerificationDigit = useCallback((nit: string): number => {
    return calculateNitVerificationDigit(nit);
  }, []);

  /**
   * Check if NIT is available (not used by another organization)
   */
  const checkNitAvailability = useCallback(
    async (nit: string): Promise<boolean> => {
      try {
        const response = await apiClient.post(
          "/api/v1/organizations/check-nit-availability/",
          { nit },
        );
        return response.data.available;
      } catch {
        return false;
      }
    },
    [],
  );

  /**
   * Refresh all data
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (state.organization?.id) {
      await Promise.all([
        fetchOrganization(state.organization.id),
        fetchLocations(state.organization.id),
      ]);
    }
  }, [state.organization?.id, fetchOrganization, fetchLocations]);

  /**
   * Computed properties
   */
  const isOrganizationComplete = useMemo(() => {
    if (!state.organization) return false;
    return !!(
      state.organization.razon_social &&
      state.organization.nit &&
      state.organization.digito_verificacion &&
      state.organization.email_contacto &&
      state.organization.telefono_principal
    );
  }, [state.organization]);

  const hasLocations = useMemo(() => {
    return state.locations.length > 0;
  }, [state.locations]);

  const mainLocation = useMemo(() => {
    return state.locations.find((loc) => loc.es_principal) || null;
  }, [state.locations]);

  const isCurrentUserOwner = useMemo(() => {
    if (!user || !state.organization) return false;
    return state.organization.created_by === user.id;
  }, [user, state.organization]);

  /**
   * Load initial data
   */
  useEffect(() => {
    if (initialOrganizationId && isAuthenticated) {
      fetchOrganization(initialOrganizationId);
      fetchLocations(initialOrganizationId);
    }
  }, [
    initialOrganizationId,
    isAuthenticated,
    fetchOrganization,
    fetchLocations,
  ]);

  return {
    // State
    organization: state.organization,
    locations: state.locations,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    lastUpdated: state.lastUpdated,

    // Organization operations
    fetchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,

    // Location operations
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,

    // Validation operations
    validateNit,
    calculateVerificationDigit,
    checkNitAvailability,

    // Utility methods
    clearError,
    refresh,
    resetState,

    // Computed properties
    isOrganizationComplete,
    hasLocations,
    mainLocation,
    isCurrentUserOwner,
  };
};

export default useOrganization;
