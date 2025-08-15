/**
 * Basic SedeService Tests
 * Tests for the sede API service functions
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { sedeService } from "../sedeService";
import type { SedeFormData, SedeImportConfig } from "@/types/sede.types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

describe("SedeService - Basic Tests", () => {
  const mockSedeData: SedeFormData = {
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
    observaciones: "Test observations",
  };

  const mockAuthToken = "test-auth-token";

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(mockAuthToken);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getSedes", () => {
    it("fetches sedes successfully", async () => {
      const mockResponse = {
        results: [
          {
            id: "sede-1",
            numero_sede: "01",
            nombre_sede: "Sede Test",
          },
        ],
        count: 1,
        next: null,
        previous: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sedeService.getSedes("org-123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org-123/sedes/"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Authorization": `Bearer ${mockAuthToken}`,
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it("includes query parameters when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], count: 0 }),
      });

      await sedeService.getSedes("org-123", {
        search: "test",
        tipo_sede: "principal",
        page: 2,
        page_size: 25,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search=test&tipo_sede=principal&page=2&page_size=25"),
        expect.any(Object)
      );
    });

    it("handles fetch errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Server Error",
      });

      await expect(sedeService.getSedes("org-123")).rejects.toThrow();
    });
  });

  describe("getSedeById", () => {
    it("fetches single sede successfully", async () => {
      const mockSede = {
        id: "sede-1",
        numero_sede: "01",
        nombre_sede: "Sede Test",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSede,
      });

      const result = await sedeService.getSedeById("sede-1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sedes/sede-1/"),
        expect.objectContaining({
          method: "GET",
        })
      );

      expect(result).toEqual(mockSede);
    });
  });

  describe("createSede", () => {
    it("creates sede successfully", async () => {
      const mockCreatedSede = {
        id: "new-sede-id",
        ...mockSedeData,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockCreatedSede,
      });

      const result = await sedeService.createSede("org-123", mockSedeData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org-123/sedes/"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "Authorization": `Bearer ${mockAuthToken}`,
          }),
          body: JSON.stringify(mockSedeData),
        })
      );

      expect(result).toEqual(mockCreatedSede);
    });

    it("handles validation errors", async () => {
      const mockErrors = {
        numero_sede: ["Este campo es requerido"],
        email: ["Formato de email inválido"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrors,
      });

      await expect(sedeService.createSede("org-123", mockSedeData)).rejects.toThrow();
    });
  });

  describe("updateSede", () => {
    it("updates sede successfully", async () => {
      const mockUpdatedSede = {
        id: "sede-1",
        ...mockSedeData,
        nombre_sede: "Sede Updated",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedSede,
      });

      const result = await sedeService.updateSede("sede-1", mockSedeData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sedes/sede-1/"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(mockSedeData),
        })
      );

      expect(result).toEqual(mockUpdatedSede);
    });
  });

  describe("deleteSede", () => {
    it("deletes sede successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await sedeService.deleteSede("sede-1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/sedes/sede-1/"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    it("handles delete errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Not Found",
      });

      await expect(sedeService.deleteSede("nonexistent-id")).rejects.toThrow();
    });
  });

  describe("validateSedeData", () => {
    it("validates sede data successfully", async () => {
      const mockValidationResult = {
        is_valid: true,
        errors: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationResult,
      });

      const result = await sedeService.validateSedeData("org-123", mockSedeData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/validate/"),
        expect.objectContaining({
          method: "POST",
        })
      );

      expect(result).toEqual(mockValidationResult);
    });

    it("returns validation errors", async () => {
      const mockValidationResult = {
        is_valid: false,
        errors: {
          numero_sede: ["Ya existe una sede con este número"],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationResult,
      });

      const result = await sedeService.validateSedeData("org-123", mockSedeData);

      expect(result.is_valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("importSedes", () => {
    it("imports sedes successfully", async () => {
      const mockFile = new File(["test,data"], "sedes.csv", { type: "text/csv" });
      const importConfig: SedeImportConfig = {
        file: mockFile,
        format: "csv",
        validate_only: false,
        overwrite_existing: false,
      };

      const mockImportResult = {
        success: true,
        imported_count: 5,
        total_rows: 5,
        valid_rows: 5,
        invalid_rows: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockImportResult,
      });

      const result = await sedeService.importSedes("org-123", importConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/import/"),
        expect.objectContaining({
          method: "POST",
        })
      );

      expect(result).toEqual(mockImportResult);
    });

    it("handles import validation errors", async () => {
      const mockFile = new File(["invalid,data"], "sedes.csv", { type: "text/csv" });
      const importConfig: SedeImportConfig = {
        file: mockFile,
        format: "csv",
        validate_only: true,
        overwrite_existing: false,
      };

      const mockImportResult = {
        success: false,
        total_rows: 1,
        valid_rows: 0,
        invalid_rows: 1,
        validation_results: [
          {
            row_index: 1,
            is_valid: false,
            errors: { numero_sede: ["Campo requerido"] },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockImportResult,
      });

      const result = await sedeService.importSedes("org-123", importConfig);

      expect(result.success).toBe(false);
      expect(result.validation_results).toBeDefined();
    });
  });

  describe("exportSedes", () => {
    it("exports sedes successfully", async () => {
      const mockBlob = new Blob(["csv,data"], { type: "text/csv" });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
        headers: new Headers({
          "Content-Disposition": "attachment; filename=sedes.csv"
        }),
      });

      // Mock URL methods
      global.URL.createObjectURL = vi.fn(() => "mock-url");
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock document methods
      const mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {},
      };
      const mockCreateElement = vi.fn(() => mockLink);
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      
      Object.defineProperty(document, "createElement", { value: mockCreateElement });
      Object.defineProperty(document.body, "appendChild", { value: mockAppendChild });
      Object.defineProperty(document.body, "removeChild", { value: mockRemoveChild });

      await sedeService.exportSedes("org-123");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/export/"),
        expect.objectContaining({
          method: "GET",
        })
      );

      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("handles network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network Error"));

      await expect(sedeService.getSedes("org-123")).rejects.toThrow("Network Error");
    });

    it("handles authentication errors", async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      await expect(sedeService.getSedes("org-123")).rejects.toThrow();
    });

    it("handles malformed JSON responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(sedeService.getSedes("org-123")).rejects.toThrow();
    });
  });
});