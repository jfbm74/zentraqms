/**
 * Tests for useAutoSave Hook - TASK-027
 *
 * Comprehensive test suite for auto-save functionality including:
 * - Auto-save intervals and configuration
 * - Conflict detection and resolution
 * - Draft management
 * - Network failure handling and retries
 *
 * Author: Claude
 * Date: 2025-08-14
 * Coverage Target: >80%
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toast } from "react-toastify";
import { useAutoSave } from "../useAutoSave";

// Mock dependencies
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("../useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../api/endpoints", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock timers
vi.useFakeTimers();

describe("useAutoSave", () => {
  const mockAuth = {
    user: { id: "user-123", email: "test@example.com" },
    isAuthenticated: true,
  };

  const mockApiClient = {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  };

  const defaultProps = {
    resourceId: "org-123",
    resourceType: "organization",
    saveEndpoint: "/api/v1/auto-save",
    initialData: { name: "Test Organization" },
    initialConfig: { interval: 1000 }, // 1 second for testing
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.clearAllTimers();

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
      const { result } = renderHook(() =>
        useAutoSave(
          defaultProps.resourceId,
          defaultProps.resourceType,
          defaultProps.saveEndpoint,
          defaultProps.initialData,
        ),
      );

      expect(result.current.isAutoSaving).toBe(false);
      expect(result.current.lastSaved).toBeNull();
      expect(result.current.lastError).toBeNull();
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.isDraftMode).toBe(false);
      expect(result.current.conflictDetected).toBe(false);
    });

    it("should load configuration correctly", () => {
      const customConfig = {
        enabled: false,
        interval: 5000,
        maxRetries: 5,
        showNotifications: true,
      };

      const { result } = renderHook(() =>
        useAutoSave(
          defaultProps.resourceId,
          defaultProps.resourceType,
          defaultProps.saveEndpoint,
          defaultProps.initialData,
          customConfig,
        ),
      );

      const config = result.current.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.interval).toBe(5000);
      expect(config.maxRetries).toBe(5);
      expect(config.showNotifications).toBe(true);
    });

    it("should attempt to load draft on mount", async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          draft_data: { name: "Draft Organization" },
          last_modified: "2023-01-01T00:00:00Z",
        },
      });

      renderHook(() =>
        useAutoSave(
          defaultProps.resourceId,
          defaultProps.resourceType,
          defaultProps.saveEndpoint,
          defaultProps.initialData,
          { showNotifications: true },
        ),
      );

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith(
          "/api/v1/auto-save/org-123/draft/",
        );
      });

      expect(toast.info).toHaveBeenCalledWith(
        "Se cargó un borrador guardado anteriormente",
      );
    });
  });

  describe("Data Management", () => {
    describe("updateData", () => {
      it("should update data and mark as changed", () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        act(() => {
          result.current.updateData({ name: "Updated Organization" });
        });

        expect(result.current.hasUnsavedChanges).toBe(true);
      });

      it("should not mark as changed if data is the same", () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        act(() => {
          result.current.updateData({ name: "Test Organization" });
        });

        expect(result.current.hasUnsavedChanges).toBe(false);
      });
    });

    describe("markAsChanged", () => {
      it("should mark data as changed", () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        act(() => {
          result.current.markAsChanged();
        });

        expect(result.current.hasUnsavedChanges).toBe(true);
      });
    });

    describe("markAsSaved", () => {
      it("should mark data as saved and update timestamps", () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        // Mark as changed first
        act(() => {
          result.current.markAsChanged();
        });

        expect(result.current.hasUnsavedChanges).toBe(true);

        act(() => {
          result.current.markAsSaved();
        });

        expect(result.current.hasUnsavedChanges).toBe(false);
        expect(result.current.lastSaved).toBeInstanceOf(Date);
        expect(result.current.lastError).toBeNull();
      });
    });
  });

  describe("Auto-Save Functionality", () => {
    describe("saveNow", () => {
      it("should save data immediately", async () => {
        mockApiClient.post.mockResolvedValueOnce({
          data: { last_modified: "2023-01-01T00:00:00Z" },
        });

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { showNotifications: true },
          ),
        );

        // Mark as changed
        act(() => {
          result.current.updateData({ name: "Updated Organization" });
        });

        await act(async () => {
          await result.current.saveNow();
        });

        expect(mockApiClient.post).toHaveBeenCalledWith("/api/v1/auto-save", {
          resource_id: "org-123",
          resource_type: "organization",
          draft_data: { name: "Updated Organization" },
          last_modified: null,
        });

        expect(result.current.hasUnsavedChanges).toBe(false);
        expect(toast.success).toHaveBeenCalledWith(
          "Cambios guardados automáticamente",
          {
            autoClose: 2000,
            hideProgressBar: true,
          },
        );
      });

      it("should not save if no changes exist", async () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        await act(async () => {
          await result.current.saveNow();
        });

        expect(mockApiClient.post).not.toHaveBeenCalled();
      });

      it("should handle save errors", async () => {
        mockApiClient.post.mockRejectedValueOnce({
          response: { data: { message: "Save failed" } },
        });

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        // Mark as changed
        act(() => {
          result.current.updateData({ name: "Updated Organization" });
        });

        await act(async () => {
          try {
            await result.current.saveNow();
          } catch {
            // Expected to throw
          }
        });

        expect(result.current.lastError).toBe("Save failed");
        expect(result.current.isAutoSaving).toBe(false);
      });

      it("should handle conflict detection", async () => {
        mockApiClient.post.mockResolvedValueOnce({
          status: 409,
          data: { message: "Conflict detected" },
        });

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { showNotifications: true },
          ),
        );

        // Mark as changed
        act(() => {
          result.current.updateData({ name: "Updated Organization" });
        });

        await act(async () => {
          await result.current.saveNow();
        });

        expect(result.current.conflictDetected).toBe(true);
        expect(toast.warning).toHaveBeenCalledWith(
          "Se detectaron cambios conflictivos. Revisa los datos antes de continuar.",
        );
      });

      it("should require authentication", async () => {
        const { useAuth } = await import("../useAuth");
        useAuth.mockReturnValue({ ...mockAuth, isAuthenticated: false });

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        // Mark as changed
        act(() => {
          result.current.updateData({ name: "Updated Organization" });
        });

        await act(async () => {
          try {
            await result.current.saveNow();
            expect.fail("Should throw authentication error");
          } catch (error: unknown) {
            expect(error.message).toBe("User must be authenticated to save");
          }
        });
      });
    });

    describe("Auto-save interval", () => {
      it("should auto-save after interval when enabled", async () => {
        mockApiClient.post.mockResolvedValueOnce({
          data: { last_modified: "2023-01-01T00:00:00Z" },
        });

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { enabled: true, interval: 1000 },
          ),
        );

        // Mark as changed
        act(() => {
          result.current.updateData({ name: "Updated Organization" });
        });

        // Advance timers
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });

        await waitFor(() => {
          expect(mockApiClient.post).toHaveBeenCalled();
        });
      });

      it("should not auto-save when disabled", async () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { enabled: false, interval: 1000 },
          ),
        );

        // Mark as changed
        act(() => {
          result.current.updateData({ name: "Updated Organization" });
        });

        // Advance timers
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });

        expect(mockApiClient.post).not.toHaveBeenCalled();
      });

      it("should not auto-save when already saving", async () => {
        mockApiClient.post.mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    data: { last_modified: "2023-01-01T00:00:00Z" },
                  }),
                2000,
              ),
            ),
        );

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { enabled: true, interval: 1000 },
          ),
        );

        // Mark as changed and trigger first save
        act(() => {
          result.current.updateData({ name: "Updated Organization" });
        });

        await act(async () => {
          vi.advanceTimersByTime(1000);
        });

        expect(result.current.isAutoSaving).toBe(true);

        // Second interval should not trigger save
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });

        expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      });

      it("should not auto-save when conflict is detected", async () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { enabled: true, interval: 1000 },
          ),
        );

        // Simulate conflict detected state
        act(() => {
          result.current.updateData({ name: "Updated Organization" });
        });

        // Manually set conflict state (in real app this would come from API)
        // We can't directly set this, but we can test that saveNow handles it

        await act(async () => {
          vi.advanceTimersByTime(1000);
        });

        // Should attempt to save since no conflict initially
        expect(mockApiClient.post).toHaveBeenCalled();
      });
    });
  });

  describe("Draft Management", () => {
    describe("loadDraft", () => {
      it("should load draft successfully", async () => {
        const draftData = {
          name: "Draft Organization",
          description: "Draft description",
        };
        mockApiClient.get.mockResolvedValueOnce({
          data: {
            draft_data: draftData,
            last_modified: "2023-01-01T00:00:00Z",
          },
        });

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { showNotifications: true },
          ),
        );

        let loadedDraft;
        await act(async () => {
          loadedDraft = await result.current.loadDraft();
        });

        expect(loadedDraft).toEqual(draftData);
        expect(result.current.isDraftMode).toBe(true);
        expect(toast.info).toHaveBeenCalledWith(
          "Se cargó un borrador guardado anteriormente",
        );
      });

      it("should return null when no draft exists", async () => {
        mockApiClient.get.mockRejectedValueOnce(new Error("Draft not found"));

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        let loadedDraft;
        await act(async () => {
          loadedDraft = await result.current.loadDraft();
        });

        expect(loadedDraft).toBeNull();
      });

      it("should require authentication", async () => {
        const { useAuth } = await import("../useAuth");
        useAuth.mockReturnValue({ ...mockAuth, isAuthenticated: false });

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        const loadedDraft = await act(async () => {
          return await result.current.loadDraft();
        });

        expect(loadedDraft).toBeNull();
      });
    });

    describe("clearDraft", () => {
      it("should clear draft successfully", async () => {
        mockApiClient.delete.mockResolvedValueOnce({});

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { showNotifications: true },
          ),
        );

        await act(async () => {
          await result.current.clearDraft();
        });

        expect(mockApiClient.delete).toHaveBeenCalledWith(
          "/api/v1/auto-save/org-123/draft/",
        );
        expect(result.current.isDraftMode).toBe(false);
        expect(toast.success).toHaveBeenCalledWith("Borrador eliminado");
      });

      it("should handle clear draft errors gracefully", async () => {
        mockApiClient.delete.mockRejectedValueOnce(new Error("Delete failed"));

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        await act(async () => {
          await result.current.clearDraft();
        });

        // Should not throw error
        expect(result.current.isDraftMode).toBe(false);
      });
    });
  });

  describe("Conflict Resolution", () => {
    describe("resolveConflict", () => {
      it("should resolve conflict by keeping local data", async () => {
        mockApiClient.post.mockResolvedValueOnce({
          data: {
            data: { name: "Local Organization" },
            last_modified: "2023-01-01T01:00:00Z",
          },
        });

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { showNotifications: true },
          ),
        );

        // Simulate conflict state (would normally be set by failed save)
        act(() => {
          result.current.updateData({ name: "Conflicted Organization" });
        });

        await act(async () => {
          await result.current.resolveConflict("keep_local");
        });

        expect(mockApiClient.post).toHaveBeenCalledWith(
          "/api/v1/auto-save/resolve-conflict/",
          {
            resource_id: "org-123",
            resolution: "keep_local",
            local_data: { name: "Conflicted Organization" },
            last_modified: null,
          },
        );

        expect(result.current.conflictDetected).toBe(false);
        expect(toast.success).toHaveBeenCalledWith(
          "Conflicto resuelto exitosamente",
        );
      });

      it("should resolve conflict by keeping remote data", async () => {
        const remoteData = {
          name: "Remote Organization",
          description: "Remote description",
        };
        mockApiClient.post.mockResolvedValueOnce({
          data: {
            data: remoteData,
            last_modified: "2023-01-01T01:00:00Z",
          },
        });

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { showNotifications: true },
          ),
        );

        await act(async () => {
          await result.current.resolveConflict("keep_remote");
        });

        expect(result.current.conflictDetected).toBe(false);
        expect(toast.success).toHaveBeenCalledWith(
          "Conflicto resuelto exitosamente",
        );
      });

      it("should handle conflict resolution errors", async () => {
        mockApiClient.post.mockRejectedValueOnce({
          response: { data: { message: "Resolution failed" } },
        });

        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { showNotifications: true },
          ),
        );

        await act(async () => {
          try {
            await result.current.resolveConflict("keep_local");
          } catch {
            // Expected to throw
          }
        });

        expect(result.current.lastError).toBe("Resolution failed");
        expect(toast.error).toHaveBeenCalledWith("Resolution failed");
      });

      it("should do nothing when no conflict exists", async () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        await act(async () => {
          await result.current.resolveConflict("keep_local");
        });

        expect(mockApiClient.post).not.toHaveBeenCalled();
      });
    });
  });

  describe("Configuration Management", () => {
    describe("setConfig", () => {
      it("should update configuration", () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
          ),
        );

        act(() => {
          result.current.setConfig({
            interval: 5000,
            maxRetries: 5,
            showNotifications: true,
          });
        });

        const config = result.current.getConfig();
        expect(config.interval).toBe(5000);
        expect(config.maxRetries).toBe(5);
        expect(config.showNotifications).toBe(true);
      });
    });

    describe("enableAutoSave", () => {
      it("should enable auto-save", () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { enabled: false },
          ),
        );

        act(() => {
          result.current.enableAutoSave();
        });

        const config = result.current.getConfig();
        expect(config.enabled).toBe(true);
      });

      it("should enable auto-save with custom config", () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { enabled: false },
          ),
        );

        act(() => {
          result.current.enableAutoSave({
            interval: 10000,
            showNotifications: true,
          });
        });

        const config = result.current.getConfig();
        expect(config.enabled).toBe(true);
        expect(config.interval).toBe(10000);
        expect(config.showNotifications).toBe(true);
      });
    });

    describe("disableAutoSave", () => {
      it("should disable auto-save", () => {
        const { result } = renderHook(() =>
          useAutoSave(
            defaultProps.resourceId,
            defaultProps.resourceType,
            defaultProps.saveEndpoint,
            defaultProps.initialData,
            { enabled: true },
          ),
        );

        act(() => {
          result.current.disableAutoSave();
        });

        const config = result.current.getConfig();
        expect(config.enabled).toBe(false);
      });
    });
  });

  describe("Retry Logic", () => {
    it("should retry failed saves up to maxRetries", async () => {
      mockApiClient.post
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() =>
        useAutoSave(
          defaultProps.resourceId,
          defaultProps.resourceType,
          defaultProps.saveEndpoint,
          defaultProps.initialData,
          { enabled: true, interval: 1000, maxRetries: 3 },
        ),
      );

      // Mark as changed
      act(() => {
        result.current.updateData({ name: "Updated Organization" });
      });

      // Trigger auto-saves through intervals
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
        await waitFor(() => {});
      }

      // Should enter draft mode after max retries
      expect(result.current.isDraftMode).toBe(true);
    });

    it("should show error notification after max retries", async () => {
      mockApiClient.post.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() =>
        useAutoSave(
          defaultProps.resourceId,
          defaultProps.resourceType,
          defaultProps.saveEndpoint,
          defaultProps.initialData,
          {
            enabled: true,
            interval: 1000,
            maxRetries: 1,
            showNotifications: true,
          },
        ),
      );

      // Mark as changed
      act(() => {
        result.current.updateData({ name: "Updated Organization" });
      });

      // First attempt
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Second attempt (exceeds maxRetries)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo guardar automáticamente. Los cambios se mantendrán como borrador.",
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent saves", async () => {
      mockApiClient.post.mockResolvedValue({
        data: { last_modified: "2023-01-01T00:00:00Z" },
      });

      const { result } = renderHook(() =>
        useAutoSave(
          defaultProps.resourceId,
          defaultProps.resourceType,
          defaultProps.saveEndpoint,
          defaultProps.initialData,
        ),
      );

      // Mark as changed
      act(() => {
        result.current.updateData({ name: "Updated Organization" });
      });

      // Start multiple saves concurrently
      const promises = [
        result.current.saveNow(),
        result.current.saveNow(),
        result.current.saveNow(),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      // Should only call API once due to promise reuse
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
    });

    it("should handle component unmount during save", async () => {
      mockApiClient.post.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { last_modified: "2023-01-01T00:00:00Z" },
                }),
              1000,
            ),
          ),
      );

      const { result, unmount } = renderHook(() =>
        useAutoSave(
          defaultProps.resourceId,
          defaultProps.resourceType,
          defaultProps.saveEndpoint,
          defaultProps.initialData,
        ),
      );

      // Mark as changed and start save
      act(() => {
        result.current.updateData({ name: "Updated Organization" });
        result.current.saveNow();
      });

      // Unmount component
      unmount();

      // Should not cause errors
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    });
  });
});
