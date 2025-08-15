/**
 * Basic SedeStore Tests
 * Tests for the Zustand store managing sede state
 */

import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSedeStore } from "../sedeStore";
import type { SedePrestadora, SedeFormData } from "@/types/sede.types";

// Mock the sedeService
const mockSedeService = {
  getSedes: vi.fn(),
  getSedeById: vi.fn(),
  createSede: vi.fn(),
  updateSede: vi.fn(),
  deleteSede: vi.fn(),
  validateSedeData: vi.fn(),
  importSedes: vi.fn(),
  exportSedes: vi.fn(),
};

vi.mock("@/services/sedeService", () => ({
  sedeService: mockSedeService,
}));

describe("SedeStore - Basic Tests", () => {
  const mockSede: SedePrestadora = {
    id: "sede-1",
    numero_sede: "01",
    codigo_prestador: "123456789-01",
    nombre_sede: "Sede Test",
    tipo_sede: "principal",
    es_sede_principal: true,
    direccion: "Test Address",
    departamento: "Cundinamarca",
    municipio: "Bogotá",
    telefono_principal: "+57 1 234 5678",
    email: "test@sede.com",
    nombre_responsable: "Dr. Test",
    cargo_responsable: "Director",
    estado: "activa",
    numero_camas: 50,
    numero_consultorios: 10,
    numero_quirofanos: 3,
    atencion_24_horas: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    created_by: "user-123",
  };

  const mockSedeFormData: SedeFormData = {
    numero_sede: "02",
    codigo_prestador: "123456789-02",
    nombre_sede: "New Sede",
    tipo_sede: "sucursal",
    es_sede_principal: false,
    direccion: "New Address",
    departamento: "Antioquia",
    municipio: "Medellín",
    telefono_principal: "+57 4 567 8901",
    email: "new@sede.com",
    nombre_responsable: "Dr. New",
    cargo_responsable: "Director",
    estado: "activa",
    numero_camas: 30,
    numero_consultorios: 8,
    numero_quirofanos: 2,
    atencion_24_horas: false,
    observaciones: "New sede",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useSedeStore.getState().resetStore();
  });

  describe("initial state", () => {
    it("has correct initial state", () => {
      const { result } = renderHook(() => useSedeStore());

      expect(result.current.sedes).toEqual([]);
      expect(result.current.currentSede).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.totalItems).toBe(0);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.filters).toEqual({});
    });
  });

  describe("fetchSedes", () => {
    it("fetches sedes successfully", async () => {
      const mockResponse = {
        results: [mockSede],
        count: 1,
        next: null,
        previous: null,
      };

      mockSedeService.getSedes.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSedeStore());

      await act(async () => {
        await result.current.fetchSedes("org-123");
      });

      expect(mockSedeService.getSedes).toHaveBeenCalledWith("org-123", {
        page: 1,
        page_size: 10,
      });
      expect(result.current.sedes).toEqual([mockSede]);
      expect(result.current.totalItems).toBe(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("handles fetch errors", async () => {
      const errorMessage = "Failed to fetch sedes";
      mockSedeService.getSedes.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useSedeStore());

      await act(async () => {
        await result.current.fetchSedes("org-123");
      });

      expect(result.current.sedes).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it("sets loading state during fetch", async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockSedeService.getSedes.mockReturnValue(promise);

      const { result } = renderHook(() => useSedeStore());

      // Start the fetch
      act(() => {
        result.current.fetchSedes("org-123");
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise({ results: [], count: 0 });
        await promise;
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });

    it("includes filters in request", async () => {
      mockSedeService.getSedes.mockResolvedValue({
        results: [],
        count: 0,
      });

      const { result } = renderHook(() => useSedeStore());

      // Set filters
      act(() => {
        result.current.setFilters({
          search: "test",
          tipo_sede: "principal",
        });
      });

      await act(async () => {
        await result.current.fetchSedes("org-123");
      });

      expect(mockSedeService.getSedes).toHaveBeenCalledWith("org-123", {
        page: 1,
        page_size: 10,
        search: "test",
        tipo_sede: "principal",
      });
    });
  });

  describe("createSede", () => {
    it("creates sede successfully", async () => {
      const newSede = { ...mockSede, id: "new-sede" };
      mockSedeService.createSede.mockResolvedValue(newSede);

      const { result } = renderHook(() => useSedeStore());

      await act(async () => {
        const created = await result.current.createSede("org-123", mockSedeFormData);
        expect(created).toEqual(newSede);
      });

      expect(mockSedeService.createSede).toHaveBeenCalledWith("org-123", mockSedeFormData);
      expect(result.current.sedes).toContain(newSede);
      expect(result.current.error).toBeNull();
    });

    it("handles create errors", async () => {
      const errorMessage = "Failed to create sede";
      mockSedeService.createSede.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useSedeStore());

      await act(async () => {
        await expect(result.current.createSede("org-123", mockSedeFormData))
          .rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("updateSede", () => {
    it("updates sede successfully", async () => {
      const updatedSede = { ...mockSede, nombre_sede: "Updated Sede" };
      mockSedeService.updateSede.mockResolvedValue(updatedSede);

      const { result } = renderHook(() => useSedeStore());

      // Set initial sedes
      act(() => {
        result.current.sedes = [mockSede];
      });

      await act(async () => {
        const updated = await result.current.updateSede("sede-1", mockSedeFormData);
        expect(updated).toEqual(updatedSede);
      });

      expect(mockSedeService.updateSede).toHaveBeenCalledWith("sede-1", mockSedeFormData);
      expect(result.current.sedes[0]).toEqual(updatedSede);
      expect(result.current.error).toBeNull();
    });

    it("handles update errors", async () => {
      const errorMessage = "Failed to update sede";
      mockSedeService.updateSede.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useSedeStore());

      await act(async () => {
        await expect(result.current.updateSede("sede-1", mockSedeFormData))
          .rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("deleteSede", () => {
    it("deletes sede successfully", async () => {
      mockSedeService.deleteSede.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSedeStore());

      // Set initial sedes
      act(() => {
        result.current.sedes = [mockSede];
      });

      await act(async () => {
        await result.current.deleteSede("sede-1");
      });

      expect(mockSedeService.deleteSede).toHaveBeenCalledWith("sede-1");
      expect(result.current.sedes).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("handles delete errors", async () => {
      const errorMessage = "Failed to delete sede";
      mockSedeService.deleteSede.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useSedeStore());

      await act(async () => {
        await expect(result.current.deleteSede("sede-1"))
          .rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe("setCurrentPage", () => {
    it("updates current page", () => {
      const { result } = renderHook(() => useSedeStore());

      act(() => {
        result.current.setCurrentPage(3);
      });

      expect(result.current.currentPage).toBe(3);
    });
  });

  describe("setPageSize", () => {
    it("updates page size and resets page", () => {
      const { result } = renderHook(() => useSedeStore());

      // Set initial page
      act(() => {
        result.current.setCurrentPage(5);
      });

      act(() => {
        result.current.setPageSize(25);
      });

      expect(result.current.pageSize).toBe(25);
      expect(result.current.currentPage).toBe(1); // Should reset to 1
    });
  });

  describe("setFilters", () => {
    it("updates filters and resets page", () => {
      const { result } = renderHook(() => useSedeStore());

      // Set initial page
      act(() => {
        result.current.setCurrentPage(3);
      });

      const newFilters = {
        search: "test search",
        tipo_sede: "principal",
        estado: "activa",
      };

      act(() => {
        result.current.setFilters(newFilters);
      });

      expect(result.current.filters).toEqual(newFilters);
      expect(result.current.currentPage).toBe(1); // Should reset to 1
    });
  });

  describe("clearFilters", () => {
    it("clears all filters and resets page", () => {
      const { result } = renderHook(() => useSedeStore());

      // Set initial state
      act(() => {
        result.current.setFilters({ search: "test", tipo_sede: "principal" });
        result.current.setCurrentPage(3);
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({});
      expect(result.current.currentPage).toBe(1);
    });
  });

  describe("setCurrentSede", () => {
    it("sets current sede", () => {
      const { result } = renderHook(() => useSedeStore());

      act(() => {
        result.current.setCurrentSede(mockSede);
      });

      expect(result.current.currentSede).toEqual(mockSede);
    });

    it("clears current sede", () => {
      const { result } = renderHook(() => useSedeStore());

      // Set initial sede
      act(() => {
        result.current.setCurrentSede(mockSede);
      });

      act(() => {
        result.current.setCurrentSede(null);
      });

      expect(result.current.currentSede).toBeNull();
    });
  });

  describe("clearError", () => {
    it("clears error state", () => {
      const { result } = renderHook(() => useSedeStore());

      // Set initial error
      act(() => {
        result.current.error = "Test error";
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("resetStore", () => {
    it("resets store to initial state", () => {
      const { result } = renderHook(() => useSedeStore());

      // Set some state
      act(() => {
        result.current.sedes = [mockSede];
        result.current.currentSede = mockSede;
        result.current.error = "Test error";
        result.current.totalItems = 10;
        result.current.currentPage = 5;
        result.current.pageSize = 25;
        result.current.setFilters({ search: "test" });
      });

      act(() => {
        result.current.resetStore();
      });

      expect(result.current.sedes).toEqual([]);
      expect(result.current.currentSede).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.totalItems).toBe(0);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.filters).toEqual({});
    });
  });

  describe("importSedes", () => {
    it("imports sedes successfully", async () => {
      const mockImportConfig = {
        file: new File(["test"], "test.csv"),
        format: "csv" as const,
        validate_only: false,
        overwrite_existing: false,
      };

      const mockImportResponse = {
        success: true,
        imported_count: 5,
        total_rows: 5,
        valid_rows: 5,
        invalid_rows: 0,
      };

      mockSedeService.importSedes.mockResolvedValue(mockImportResponse);

      const { result } = renderHook(() => useSedeStore());

      await act(async () => {
        const response = await result.current.importSedes("org-123", mockImportConfig);
        expect(response).toEqual(mockImportResponse);
      });

      expect(mockSedeService.importSedes).toHaveBeenCalledWith("org-123", mockImportConfig);
    });
  });

  describe("exportSedes", () => {
    it("exports sedes successfully", async () => {
      mockSedeService.exportSedes.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSedeStore());

      await act(async () => {
        await result.current.exportSedes("org-123");
      });

      expect(mockSedeService.exportSedes).toHaveBeenCalledWith("org-123", {});
    });

    it("exports sedes with filters", async () => {
      mockSedeService.exportSedes.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSedeStore());

      // Set filters
      act(() => {
        result.current.setFilters({ tipo_sede: "principal" });
      });

      await act(async () => {
        await result.current.exportSedes("org-123");
      });

      expect(mockSedeService.exportSedes).toHaveBeenCalledWith("org-123", {
        tipo_sede: "principal",
      });
    });
  });
});