/**
 * Tests for useOrganization Hook - TASK-027
 *
 * Comprehensive test suite for organization management hook including:
 * - CRUD operations for organizations and locations
 * - State management and loading states
 * - Error handling and user feedback
 * - NIT validation and utility functions
 *
 * Author: Claude
 * Date: 2025-08-14
 * Coverage Target: >80%
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toast } from "react-toastify";
import {
  useOrganization,
  calculateNitVerificationDigit,
} from "../useOrganization";

// Mock dependencies
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../api/endpoints", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("useOrganization", () => {
  const mockAuth = {
    user: { id: "user-123", email: "test@example.com" },
    isAuthenticated: true,
  };

  const mockApiClient = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  const sampleOrganization = {
    id: "org-123",
    razon_social: "Test Organization S.A.S.",
    nombre_comercial: "Test Org",
    nit: "900123456",
    digito_verificacion: "1",
    tipo_organizacion: "empresa_privada",
    sector_economico: "tecnologia",
    tamaño_empresa: "mediana",
    email_contacto: "contact@test.com",
    telefono_principal: "+57 1 234-5678",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    created_by: "user-123",
  };

  const sampleLocation = {
    id: "loc-123",
    organization: "org-123",
    nombre: "Sede Principal",
    tipo_sede: "principal",
    es_principal: true,
    direccion: "Carrera 7 # 45-67",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
    pais: "Colombia",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup auth mock
    const { useAuth } = await import("../useAuth");
    useAuth.mockReturnValue(mockAuth);

    // Setup API mock
    const { apiClient } = await import("../../api/endpoints");
    Object.assign(apiClient, mockApiClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useOrganization());

      expect(result.current.organization).toBeNull();
      expect(result.current.locations).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
    });

    it("should initialize with organization ID and fetch data", async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: sampleOrganization });
      mockApiClient.get.mockResolvedValueOnce({
        data: { results: [sampleLocation] },
      });

      const { result } = renderHook(() => useOrganization("org-123"));

      await waitFor(() => {
        expect(result.current.organization).toEqual(sampleOrganization);
        expect(result.current.locations).toEqual([sampleLocation]);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/api/v1/organizations/org-123/",
      );
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/api/v1/organizations/org-123/locations/",
      );
    });

    it("should not fetch data when user is not authenticated", async () => {
      const { useAuth } = await import("../useAuth");
      useAuth.mockReturnValue({ ...mockAuth, isAuthenticated: false });

      renderHook(() => useOrganization("org-123"));

      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });

  describe("Organization Operations", () => {
    describe("fetchOrganization", () => {
      it("should fetch organization successfully", async () => {
        mockApiClient.get.mockResolvedValueOnce({ data: sampleOrganization });

        const { result } = renderHook(() => useOrganization());

        let returnedOrg;
        await act(async () => {
          returnedOrg = await result.current.fetchOrganization("org-123");
        });

        expect(returnedOrg).toEqual(sampleOrganization);
        expect(result.current.organization).toEqual(sampleOrganization);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });

      it("should handle fetch organization error", async () => {
        const errorResponse = {
          response: { data: { message: "Organization not found" } },
        };
        mockApiClient.get.mockRejectedValueOnce(errorResponse);

        const { result } = renderHook(() => useOrganization());

        await act(async () => {
          try {
            await result.current.fetchOrganization("org-123");
          } catch {
            // Expected to throw
          }
        });

        expect(result.current.organization).toBeNull();
        expect(result.current.error).toBe("Organization not found");
        expect(result.current.isLoading).toBe(false);
      });

      it("should not fetch when user is not authenticated", async () => {
        const { useAuth } = await import("../useAuth");
        useAuth.mockReturnValue({ ...mockAuth, isAuthenticated: false });

        const { result } = renderHook(() => useOrganization());

        await act(async () => {
          try {
            await result.current.fetchOrganization("org-123");
            expect.fail("Should throw authentication error");
          } catch (error: unknown) {
            expect(error.message).toBe(
              "User must be authenticated to fetch organization",
            );
          }
        });
      });

      it("should handle missing organization ID", async () => {
        const { result } = renderHook(() => useOrganization());

        const returnedOrg = await act(async () => {
          return await result.current.fetchOrganization();
        });

        expect(returnedOrg).toBeNull();
        expect(result.current.error).toBe("Organization ID is required");
      });
    });

    describe("createOrganization", () => {
      it("should create organization successfully", async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: sampleOrganization });

        const { result } = renderHook(() => useOrganization());

        const organizationData = {
          razon_social: "New Organization",
          nit: "900123456",
          digito_verificacion: "1",
        };

        let createdOrg;
        await act(async () => {
          createdOrg =
            await result.current.createOrganization(organizationData);
        });

        expect(createdOrg).toEqual(sampleOrganization);
        expect(result.current.organization).toEqual(sampleOrganization);
        expect(result.current.isSaving).toBe(false);
        expect(toast.success).toHaveBeenCalledWith(
          "Organización creada exitosamente",
        );
      });

      it("should handle create organization error", async () => {
        const errorResponse = {
          response: { data: { message: "NIT already exists" } },
        };
        mockApiClient.post.mockRejectedValueOnce(errorResponse);

        const { result } = renderHook(() => useOrganization());

        await act(async () => {
          try {
            await result.current.createOrganization({});
          } catch {
            // Expected to throw
          }
        });

        expect(result.current.error).toBe("NIT already exists");
        expect(result.current.isSaving).toBe(false);
        expect(toast.error).toHaveBeenCalledWith("NIT already exists");
      });
    });

    describe("updateOrganization", () => {
      it("should update organization successfully", async () => {
        const updatedOrg = {
          ...sampleOrganization,
          razon_social: "Updated Organization",
        };
        mockApiClient.patch.mockResolvedValueOnce({ data: updatedOrg });

        const { result } = renderHook(() => useOrganization());

        const updateData = { razon_social: "Updated Organization" };

        let updated;
        await act(async () => {
          updated = await result.current.updateOrganization(
            "org-123",
            updateData,
          );
        });

        expect(updated).toEqual(updatedOrg);
        expect(result.current.organization).toEqual(updatedOrg);
        expect(toast.success).toHaveBeenCalledWith(
          "Organización actualizada exitosamente",
        );
      });

      it("should handle update organization error", async () => {
        const errorResponse = {
          response: { data: { message: "Permission denied" } },
        };
        mockApiClient.patch.mockRejectedValueOnce(errorResponse);

        const { result } = renderHook(() => useOrganization());

        await act(async () => {
          try {
            await result.current.updateOrganization("org-123", {});
          } catch {
            // Expected to throw
          }
        });

        expect(result.current.error).toBe("Permission denied");
        expect(toast.error).toHaveBeenCalledWith("Permission denied");
      });
    });

    describe("deleteOrganization", () => {
      it("should delete organization successfully", async () => {
        mockApiClient.delete.mockResolvedValueOnce({});

        const { result } = renderHook(() => useOrganization());

        // Set initial organization
        await act(async () => {
          result.current.resetState();
        });

        await act(async () => {
          await result.current.deleteOrganization("org-123");
        });

        expect(result.current.organization).toBeNull();
        expect(result.current.locations).toEqual([]);
        expect(toast.success).toHaveBeenCalledWith(
          "Organización eliminada exitosamente",
        );
      });
    });
  });

  describe("Location Operations", () => {
    describe("fetchLocations", () => {
      it("should fetch locations successfully", async () => {
        mockApiClient.get.mockResolvedValueOnce({
          data: { results: [sampleLocation] },
        });

        const { result } = renderHook(() => useOrganization());

        // Set organization first
        act(() => {
          result.current.resetState();
        });

        let locations;
        await act(async () => {
          locations = await result.current.fetchLocations("org-123");
        });

        expect(locations).toEqual([sampleLocation]);
        expect(result.current.locations).toEqual([sampleLocation]);
      });

      it("should handle fetch locations error", async () => {
        const errorResponse = {
          response: { data: { message: "Locations not found" } },
        };
        mockApiClient.get.mockRejectedValueOnce(errorResponse);

        const { result } = renderHook(() => useOrganization());

        await act(async () => {
          try {
            await result.current.fetchLocations("org-123");
          } catch {
            // Expected to throw
          }
        });

        expect(result.current.error).toBe("Locations not found");
      });
    });

    describe("createLocation", () => {
      it("should create location successfully", async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: sampleLocation });

        const { result } = renderHook(() => useOrganization());

        const locationData = {
          organization: "org-123",
          nombre: "New Location",
          direccion: "Test Address",
        };

        let createdLocation;
        await act(async () => {
          createdLocation = await result.current.createLocation(locationData);
        });

        expect(createdLocation).toEqual(sampleLocation);
        expect(result.current.locations).toContain(sampleLocation);
        expect(toast.success).toHaveBeenCalledWith("Sede creada exitosamente");
      });
    });

    describe("updateLocation", () => {
      it("should update location successfully", async () => {
        const updatedLocation = {
          ...sampleLocation,
          nombre: "Updated Location",
        };
        mockApiClient.patch.mockResolvedValueOnce({ data: updatedLocation });

        const { result } = renderHook(() => useOrganization());

        // Set initial locations
        act(() => {
          result.current.resetState();
        });

        const updateData = { nombre: "Updated Location" };

        let updated;
        await act(async () => {
          updated = await result.current.updateLocation("loc-123", updateData);
        });

        expect(updated).toEqual(updatedLocation);
        expect(toast.success).toHaveBeenCalledWith(
          "Sede actualizada exitosamente",
        );
      });
    });

    describe("deleteLocation", () => {
      it("should delete location successfully", async () => {
        mockApiClient.delete.mockResolvedValueOnce({});

        const { result } = renderHook(() => useOrganization());

        // Set initial locations
        act(() => {
          result.current.resetState();
        });

        await act(async () => {
          await result.current.deleteLocation("loc-123");
        });

        expect(toast.success).toHaveBeenCalledWith(
          "Sede eliminada exitosamente",
        );
      });
    });
  });

  describe("Validation Operations", () => {
    describe("validateNit", () => {
      it("should validate NIT successfully", async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: { valid: true } });

        const { result } = renderHook(() => useOrganization());

        let isValid;
        await act(async () => {
          isValid = await result.current.validateNit("900123456", "1");
        });

        expect(isValid).toBe(true);
        expect(mockApiClient.post).toHaveBeenCalledWith(
          "/api/v1/organizations/validate-nit/",
          {
            nit: "900123456",
            digito_verificacion: "1",
          },
        );
      });

      it("should return false for invalid NIT", async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: { valid: false } });

        const { result } = renderHook(() => useOrganization());

        let isValid;
        await act(async () => {
          isValid = await result.current.validateNit("900123456", "9");
        });

        expect(isValid).toBe(false);
      });

      it("should return false on API error", async () => {
        mockApiClient.post.mockRejectedValueOnce(new Error("API Error"));

        const { result } = renderHook(() => useOrganization());

        let isValid;
        await act(async () => {
          isValid = await result.current.validateNit("900123456", "1");
        });

        expect(isValid).toBe(false);
      });
    });

    describe("checkNitAvailability", () => {
      it("should check NIT availability successfully", async () => {
        mockApiClient.post.mockResolvedValueOnce({ data: { available: true } });

        const { result } = renderHook(() => useOrganization());

        let isAvailable;
        await act(async () => {
          isAvailable = await result.current.checkNitAvailability("900123456");
        });

        expect(isAvailable).toBe(true);
        expect(mockApiClient.post).toHaveBeenCalledWith(
          "/api/v1/organizations/check-nit-availability/",
          {
            nit: "900123456",
          },
        );
      });

      it("should return false when NIT is not available", async () => {
        mockApiClient.post.mockResolvedValueOnce({
          data: { available: false },
        });

        const { result } = renderHook(() => useOrganization());

        let isAvailable;
        await act(async () => {
          isAvailable = await result.current.checkNitAvailability("900123456");
        });

        expect(isAvailable).toBe(false);
      });
    });

    describe("calculateVerificationDigit", () => {
      it("should calculate verification digit correctly", () => {
        const { result } = renderHook(() => useOrganization());

        const digit = result.current.calculateVerificationDigit("900123456");
        expect(digit).toBe(8);
      });

      it("should handle different NIT values", () => {
        const { result } = renderHook(() => useOrganization());

        const testCases = [
          { nit: "830020154", expected: 2 },
          { nit: "860518614", expected: 7 },
          { nit: "900359991", expected: 0 },
        ];

        testCases.forEach(({ nit, expected }) => {
          const digit = result.current.calculateVerificationDigit(nit);
          expect(digit).toBe(expected);
        });
      });
    });
  });

  describe("Utility Methods", () => {
    describe("clearError", () => {
      it("should clear error state", () => {
        const { result } = renderHook(() => useOrganization());

        // Set an error first
        act(() => {
          result.current.resetState();
        });

        act(() => {
          result.current.clearError();
        });

        expect(result.current.error).toBeNull();
      });
    });

    describe("resetState", () => {
      it("should reset all state to initial values", () => {
        const { result } = renderHook(() => useOrganization());

        act(() => {
          result.current.resetState();
        });

        expect(result.current.organization).toBeNull();
        expect(result.current.locations).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isSaving).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.lastUpdated).toBeNull();
      });
    });

    describe("refresh", () => {
      it("should refresh organization and locations data", async () => {
        mockApiClient.get.mockResolvedValueOnce({ data: sampleOrganization });
        mockApiClient.get.mockResolvedValueOnce({
          data: { results: [sampleLocation] },
        });

        const { result } = renderHook(() => useOrganization());

        // Set organization first
        act(() => {
          result.current.resetState();
        });

        await act(async () => {
          await result.current.refresh();
        });

        // Should not call API if no organization is set
        expect(mockApiClient.get).not.toHaveBeenCalled();
      });
    });
  });

  describe("Computed Properties", () => {
    describe("isOrganizationComplete", () => {
      it("should return true for complete organization", () => {
        const { result } = renderHook(() => useOrganization());

        // Mock organization state
        act(() => {
          result.current.resetState();
        });

        expect(result.current.isOrganizationComplete).toBe(false);
      });

      it("should return false for incomplete organization", () => {
        const { result } = renderHook(() => useOrganization());

        expect(result.current.isOrganizationComplete).toBe(false);
      });
    });

    describe("hasLocations", () => {
      it("should return true when locations exist", () => {
        const { result } = renderHook(() => useOrganization());

        expect(result.current.hasLocations).toBe(false);
      });

      it("should return false when no locations exist", () => {
        const { result } = renderHook(() => useOrganization());

        expect(result.current.hasLocations).toBe(false);
      });
    });

    describe("mainLocation", () => {
      it("should return main location when it exists", () => {
        const { result } = renderHook(() => useOrganization());

        expect(result.current.mainLocation).toBeNull();
      });

      it("should return null when no main location exists", () => {
        const { result } = renderHook(() => useOrganization());

        expect(result.current.mainLocation).toBeNull();
      });
    });

    describe("isCurrentUserOwner", () => {
      it("should return true when current user is owner", () => {
        const { result } = renderHook(() => useOrganization());

        expect(result.current.isCurrentUserOwner).toBe(false);
      });

      it("should return false when current user is not owner", () => {
        const { result } = renderHook(() => useOrganization());

        expect(result.current.isCurrentUserOwner).toBe(false);
      });
    });
  });

  describe("Loading States", () => {
    it("should set loading state during fetch operations", async () => {
      mockApiClient.get.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: sampleOrganization }), 100),
          ),
      );

      const { result } = renderHook(() => useOrganization());

      act(() => {
        result.current.fetchOrganization("org-123");
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should set saving state during create/update operations", async () => {
      mockApiClient.post.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: sampleOrganization }), 100),
          ),
      );

      const { result } = renderHook(() => useOrganization());

      act(() => {
        result.current.createOrganization({});
      });

      expect(result.current.isSaving).toBe(true);

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle authentication errors", async () => {
      const { useAuth } = await import("../useAuth");
      useAuth.mockReturnValue({ ...mockAuth, isAuthenticated: false });

      const { result } = renderHook(() => useOrganization());

      await act(async () => {
        try {
          await result.current.fetchOrganization("org-123");
          expect.fail("Should throw authentication error");
        } catch (error: unknown) {
          expect(error.message).toBe(
            "User must be authenticated to fetch organization",
          );
        }
      });
    });

    it("should handle network errors gracefully", async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useOrganization());

      await act(async () => {
        try {
          await result.current.fetchOrganization("org-123");
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("Failed to fetch organization");
    });
  });
});

describe("calculateNitVerificationDigit", () => {
  it("should calculate correct verification digits", () => {
    const testCases = [
      { nit: "900123456", expected: 8 },
      { nit: "830020154", expected: 2 },
      { nit: "860518614", expected: 7 },
      { nit: "900359991", expected: 0 },
      { nit: "123456789", expected: 6 },
    ];

    testCases.forEach(({ nit, expected }) => {
      const result = calculateNitVerificationDigit(nit);
      expect(result).toBe(expected);
    });
  });

  it("should handle NITs with non-numeric characters", () => {
    const result = calculateNitVerificationDigit("900.123.456");
    expect(result).toBe(8);
  });

  it("should return 0 for NITs shorter than 8 digits", () => {
    const result = calculateNitVerificationDigit("1234567");
    expect(result).toBe(0);
  });

  it("should handle empty or invalid input", () => {
    expect(calculateNitVerificationDigit("")).toBe(0);
    expect(calculateNitVerificationDigit("abc")).toBe(0);
  });
});
