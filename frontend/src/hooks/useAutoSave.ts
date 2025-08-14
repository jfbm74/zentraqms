/**
 * useAutoSave Hook for ZentraQMS Frontend
 *
 * Custom hook for automatic saving functionality with:
 * - Configurable auto-save intervals
 * - Conflict detection and resolution
 * - Draft management
 * - Network failure handling
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { apiClient } from "../api/endpoints";
import { toast } from "react-toastify";

// Types
export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  maxRetries: number;
  conflictResolution: "overwrite" | "merge" | "prompt";
  showNotifications: boolean;
}

export interface AutoSaveState {
  isAutoSaving: boolean;
  lastSaved: Date | null;
  lastError: string | null;
  hasUnsavedChanges: boolean;
  retryCount: number;
  isDraftMode: boolean;
  conflictDetected: boolean;
}

export interface SaveData {
  [key: string]: any;
}

export interface AutoSaveHookReturn {
  // State
  isAutoSaving: boolean;
  lastSaved: Date | null;
  lastError: string | null;
  hasUnsavedChanges: boolean;
  isDraftMode: boolean;
  conflictDetected: boolean;

  // Methods
  enableAutoSave: (config?: Partial<AutoSaveConfig>) => void;
  disableAutoSave: () => void;
  saveNow: () => Promise<void>;
  loadDraft: () => Promise<SaveData | null>;
  clearDraft: () => Promise<void>;
  updateData: (data: Partial<SaveData>) => void;
  markAsChanged: () => void;
  markAsSaved: () => void;
  resolveConflict: (
    resolution: "keep_local" | "keep_remote" | "merge",
  ) => Promise<void>;

  // Configuration
  setConfig: (config: Partial<AutoSaveConfig>) => void;
  getConfig: () => AutoSaveConfig;
}

const DEFAULT_CONFIG: AutoSaveConfig = {
  enabled: true,
  interval: 30000, // 30 seconds
  maxRetries: 3,
  conflictResolution: "prompt",
  showNotifications: false,
};

/**
 * Custom hook for auto-save functionality
 */
export const useAutoSave = (
  resourceId: string,
  resourceType: string,
  saveEndpoint: string,
  initialData: SaveData = {},
  initialConfig: Partial<AutoSaveConfig> = {},
): AutoSaveHookReturn => {
  const { user, isAuthenticated } = useAuth();

  const [config, setConfig] = useState<AutoSaveConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const [state, setState] = useState<AutoSaveState>({
    isAutoSaving: false,
    lastSaved: null,
    lastError: null,
    hasUnsavedChanges: false,
    retryCount: 0,
    isDraftMode: false,
    conflictDetected: false,
  });

  const [currentData, setCurrentData] = useState<SaveData>(initialData);
  const [lastSavedData, setLastSavedData] = useState<SaveData>(initialData);

  // Refs to persist values across re-renders
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const lastModifiedRef = useRef<string | null>(null);

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<AutoSaveState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<AutoSaveConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Check if data has changed
   */
  const hasDataChanged = useCallback((): boolean => {
    return JSON.stringify(currentData) !== JSON.stringify(lastSavedData);
  }, [currentData, lastSavedData]);

  /**
   * Update current data and mark as changed
   */
  const updateData = useCallback(
    (data: Partial<SaveData>) => {
      setCurrentData((prev) => ({ ...prev, ...data }));
      if (!state.hasUnsavedChanges && hasDataChanged()) {
        updateState({ hasUnsavedChanges: true });
      }
    },
    [state.hasUnsavedChanges, hasDataChanged, updateState],
  );

  /**
   * Mark data as changed
   */
  const markAsChanged = useCallback(() => {
    updateState({ hasUnsavedChanges: true });
  }, [updateState]);

  /**
   * Mark data as saved
   */
  const markAsSaved = useCallback(() => {
    setLastSavedData(currentData);
    updateState({
      hasUnsavedChanges: false,
      lastSaved: new Date(),
      lastError: null,
      retryCount: 0,
    });
  }, [currentData, updateState]);

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      throw new Error("User must be authenticated to save");
    }

    if (!hasDataChanged()) {
      return; // No changes to save
    }

    updateState({ isAutoSaving: true, lastError: null });

    try {
      const payload = {
        resource_id: resourceId,
        resource_type: resourceType,
        draft_data: currentData,
        last_modified: lastModifiedRef.current,
      };

      const response = await apiClient.post(saveEndpoint, payload);

      // Check for conflicts
      if (response.status === 409) {
        updateState({
          conflictDetected: true,
          isAutoSaving: false,
        });

        if (config.showNotifications) {
          toast.warning(
            "Se detectaron cambios conflictivos. Revisa los datos antes de continuar.",
          );
        }
        return;
      }

      // Update last modified timestamp
      lastModifiedRef.current = response.data.last_modified;

      markAsSaved();

      if (config.showNotifications) {
        toast.success("Cambios guardados automáticamente", {
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Error al guardar automáticamente";

      updateState({
        isAutoSaving: false,
        lastError: errorMessage,
        retryCount: state.retryCount + 1,
      });

      if (state.retryCount >= config.maxRetries) {
        updateState({ isDraftMode: true });

        if (config.showNotifications) {
          toast.error(
            "No se pudo guardar automáticamente. Los cambios se mantendrán como borrador.",
          );
        }
      }

      throw error;
    } finally {
      updateState({ isAutoSaving: false });
    }
  }, [
    isAuthenticated,
    user,
    hasDataChanged,
    resourceId,
    resourceType,
    currentData,
    saveEndpoint,
    config.showNotifications,
    config.maxRetries,
    state.retryCount,
    markAsSaved,
    updateState,
  ]);

  /**
   * Save now (manual save)
   */
  const saveNow = useCallback(async (): Promise<void> => {
    if (savePromiseRef.current) {
      return savePromiseRef.current;
    }

    savePromiseRef.current = performSave();

    try {
      await savePromiseRef.current;
    } finally {
      savePromiseRef.current = null;
    }
  }, [performSave]);

  /**
   * Load draft data
   */
  const loadDraft = useCallback(async (): Promise<SaveData | null> => {
    if (!isAuthenticated) {
      return null;
    }

    try {
      const response = await apiClient.get(
        `${saveEndpoint}/${resourceId}/draft/`,
      );
      const draftData = response.data.draft_data;

      if (draftData) {
        setCurrentData(draftData);
        lastModifiedRef.current = response.data.last_modified;
        updateState({ isDraftMode: true });

        if (config.showNotifications) {
          toast.info("Se cargó un borrador guardado anteriormente");
        }
      }

      return draftData;
    } catch (error) {
      // Draft not found is not an error
      return null;
    }
  }, [
    isAuthenticated,
    saveEndpoint,
    resourceId,
    config.showNotifications,
    updateState,
  ]);

  /**
   * Clear draft data
   */
  const clearDraft = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await apiClient.delete(`${saveEndpoint}/${resourceId}/draft/`);
      updateState({ isDraftMode: false });

      if (config.showNotifications) {
        toast.success("Borrador eliminado");
      }
    } catch (error) {
      // Ignore errors when clearing draft
    }
  }, [
    isAuthenticated,
    saveEndpoint,
    resourceId,
    config.showNotifications,
    updateState,
  ]);

  /**
   * Resolve conflict
   */
  const resolveConflict = useCallback(
    async (
      resolution: "keep_local" | "keep_remote" | "merge",
    ): Promise<void> => {
      if (!state.conflictDetected) {
        return;
      }

      try {
        updateState({ isAutoSaving: true });

        const response = await apiClient.post(
          `${saveEndpoint}/resolve-conflict/`,
          {
            resource_id: resourceId,
            resolution,
            local_data: currentData,
            last_modified: lastModifiedRef.current,
          },
        );

        if (resolution === "keep_remote") {
          setCurrentData(response.data.data);
        }

        lastModifiedRef.current = response.data.last_modified;
        markAsSaved();
        updateState({ conflictDetected: false });

        if (config.showNotifications) {
          toast.success("Conflicto resuelto exitosamente");
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Error al resolver conflicto";
        updateState({ lastError: errorMessage });

        if (config.showNotifications) {
          toast.error(errorMessage);
        }
        throw error;
      } finally {
        updateState({ isAutoSaving: false });
      }
    },
    [
      state.conflictDetected,
      saveEndpoint,
      resourceId,
      currentData,
      markAsSaved,
      config.showNotifications,
      updateState,
    ],
  );

  /**
   * Enable auto-save
   */
  const enableAutoSave = useCallback(
    (newConfig: Partial<AutoSaveConfig> = {}) => {
      updateConfig({ ...newConfig, enabled: true });
    },
    [updateConfig],
  );

  /**
   * Disable auto-save
   */
  const disableAutoSave = useCallback(() => {
    updateConfig({ enabled: false });
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [updateConfig]);

  /**
   * Auto-save interval effect
   */
  useEffect(() => {
    if (!config.enabled || !isAuthenticated) {
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      if (hasDataChanged() && !state.isAutoSaving && !state.conflictDetected) {
        try {
          await performSave();
        } catch (error) {
          // Error is already handled in performSave
        }
      }
    }, config.interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    config.enabled,
    config.interval,
    isAuthenticated,
    hasDataChanged,
    state.isAutoSaving,
    state.conflictDetected,
    performSave,
  ]);

  /**
   * Load draft on mount
   */
  useEffect(() => {
    if (isAuthenticated && resourceId) {
      loadDraft();
    }
  }, [isAuthenticated, resourceId, loadDraft]);

  /**
   * Update unsaved changes status
   */
  useEffect(() => {
    const hasChanges = hasDataChanged();
    if (hasChanges !== state.hasUnsavedChanges) {
      updateState({ hasUnsavedChanges: hasChanges });
    }
  }, [hasDataChanged, state.hasUnsavedChanges, updateState]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    isAutoSaving: state.isAutoSaving,
    lastSaved: state.lastSaved,
    lastError: state.lastError,
    hasUnsavedChanges: state.hasUnsavedChanges,
    isDraftMode: state.isDraftMode,
    conflictDetected: state.conflictDetected,

    // Methods
    enableAutoSave,
    disableAutoSave,
    saveNow,
    loadDraft,
    clearDraft,
    updateData,
    markAsChanged,
    markAsSaved,
    resolveConflict,

    // Configuration
    setConfig: updateConfig,
    getConfig: () => config,
  };
};

export default useAutoSave;
