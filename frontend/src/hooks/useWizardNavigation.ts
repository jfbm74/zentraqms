/**
 * useWizardNavigation Hook for ZentraQMS Frontend
 *
 * Custom hook for wizard/multi-step form navigation with:
 * - Step validation and progression
 * - State persistence
 * - Progress tracking
 * - Conditional navigation
 */

import { useState, useCallback, useMemo, useEffect } from "react";

// Types
export interface WizardStep {
  id: string | number;
  title: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
  isAccessible: boolean;
  validationRules?: ValidationRule[];
  component?: React.ComponentType<Record<string, unknown>>;
}

export interface ValidationRule {
  field: string;
  validator: (value: unknown, allData: unknown) => boolean | string;
  message: string;
}

export interface WizardNavigationState {
  currentStep: number;
  steps: WizardStep[];
  completedSteps: number[];
  visitedSteps: number[];
  canGoNext: boolean;
  canGoPrevious: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
  progressPercentage: number;
}

export interface WizardNavigationConfig {
  allowSkipOptionalSteps: boolean;
  allowBackNavigation: boolean;
  validateOnStepChange: boolean;
  persistProgress: boolean;
  progressKey?: string;
}

export interface UseWizardNavigationReturn {
  // State
  currentStep: number;
  steps: WizardStep[];
  completedSteps: number[];
  visitedSteps: number[];
  canGoNext: boolean;
  canGoPrevious: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
  progressPercentage: number;

  // Navigation methods
  goToStep: (stepIndex: number) => boolean;
  goNext: () => boolean;
  goPrevious: () => boolean;
  goFirst: () => boolean;
  goLast: () => boolean;

  // Step management
  markStepAsCompleted: (stepIndex: number) => void;
  markStepAsIncomplete: (stepIndex: number) => void;
  updateStepAccessibility: (stepIndex: number, isAccessible: boolean) => void;
  validateCurrentStep: (data?: unknown) => {
    isValid: boolean;
    errors: Record<string, string>;
  };

  // Progress management
  resetProgress: () => void;
  loadProgress: () => void;
  saveProgress: () => void;

  // Utility methods
  getStepByIndex: (index: number) => WizardStep | null;
  getStepById: (id: string | number) => WizardStep | null;
  isStepCompleted: (stepIndex: number) => boolean;
  isStepAccessible: (stepIndex: number) => boolean;
  getNextIncompleteStep: () => number | null;
}

const DEFAULT_CONFIG: WizardNavigationConfig = {
  allowSkipOptionalSteps: true,
  allowBackNavigation: true,
  validateOnStepChange: true,
  persistProgress: false,
  progressKey: "wizard_progress",
};

/**
 * Custom hook for wizard navigation
 */
export const useWizardNavigation = (
  initialSteps: Omit<WizardStep, "isCompleted" | "isAccessible">[],
  initialConfig: Partial<WizardNavigationConfig> = {},
): UseWizardNavigationReturn => {
  const config = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...initialConfig,
    }),
    [initialConfig],
  );

  // Initialize steps with default completion and accessibility states
  const [steps, setSteps] = useState<WizardStep[]>(() => {
    return initialSteps.map((step, index) => ({
      ...step,
      isCompleted: false,
      isAccessible: index === 0, // Only first step is initially accessible
    }));
  });

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [visitedSteps, setVisitedSteps] = useState<number[]>([0]);

  /**
   * Update step in steps array
   */
  const updateStep = useCallback(
    (stepIndex: number, updates: Partial<WizardStep>) => {
      setSteps((prev) =>
        prev.map((step, index) =>
          index === stepIndex ? { ...step, ...updates } : step,
        ),
      );
    },
    [],
  );

  /**
   * Mark step as completed
   */
  const markStepAsCompleted = useCallback(
    (stepIndex: number) => {
      updateStep(stepIndex, { isCompleted: true });
      setCompletedSteps((prev) => {
        if (!prev.includes(stepIndex)) {
          const newCompleted = [...prev, stepIndex].sort();

          // Make next step accessible if it exists
          if (stepIndex + 1 < steps.length) {
            updateStep(stepIndex + 1, { isAccessible: true });
          }

          return newCompleted;
        }
        return prev;
      });
    },
    [steps.length, updateStep],
  );

  /**
   * Mark step as incomplete
   */
  const markStepAsIncomplete = useCallback(
    (stepIndex: number) => {
      updateStep(stepIndex, { isCompleted: false });
      setCompletedSteps((prev) => prev.filter((step) => step !== stepIndex));
    },
    [updateStep],
  );

  /**
   * Update step accessibility
   */
  const updateStepAccessibility = useCallback(
    (stepIndex: number, isAccessible: boolean) => {
      updateStep(stepIndex, { isAccessible });
    },
    [updateStep],
  );

  /**
   * Validate current step
   */
  const validateCurrentStep = useCallback(
    (data?: unknown): { isValid: boolean; errors: Record<string, string> } => {
      const step = steps[currentStep];
      if (!step || !step.validationRules) {
        return { isValid: true, errors: {} };
      }

      const errors: Record<string, string> = {};

      for (const rule of step.validationRules) {
        const fieldValue = data?.[rule.field];
        const validationResult = rule.validator(fieldValue, data);

        if (validationResult !== true) {
          errors[rule.field] =
            typeof validationResult === "string"
              ? validationResult
              : rule.message;
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
    [steps, currentStep],
  );

  /**
   * Go to specific step
   */
  const goToStep = useCallback(
    (stepIndex: number): boolean => {
      if (stepIndex < 0 || stepIndex >= steps.length) {
        return false;
      }

      const targetStep = steps[stepIndex];
      if (!targetStep.isAccessible) {
        return false;
      }

      // If going backwards, always allow (if back navigation is enabled)
      if (stepIndex < currentStep && !config.allowBackNavigation) {
        return false;
      }

      // If going forwards, check if current step is completed (if required and validation is enabled)
      if (stepIndex > currentStep && config.validateOnStepChange) {
        const currentStepObj = steps[currentStep];
        if (currentStepObj.isRequired && !currentStepObj.isCompleted) {
          return false;
        }
      }

      setCurrentStep(stepIndex);
      setVisitedSteps((prev) => {
        if (!prev.includes(stepIndex)) {
          return [...prev, stepIndex].sort();
        }
        return prev;
      });

      return true;
    },
    [steps, currentStep, config.allowBackNavigation, config.validateOnStepChange],
  );

  /**
   * Go to next step
   */
  const goNext = useCallback((): boolean => {
    const nextStepIndex = currentStep + 1;

    if (nextStepIndex >= steps.length) {
      return false;
    }

    // Validate current step if validation is enabled
    if (config.validateOnStepChange) {
      // This would need data passed in a real implementation
      // For now, we just check if the step is marked as completed for required steps
      const currentStepObj = steps[currentStep];
      if (currentStepObj.isRequired && !currentStepObj.isCompleted) {
        return false;
      }
    }

    return goToStep(nextStepIndex);
  }, [currentStep, steps, config.validateOnStepChange, goToStep]);

  /**
   * Go to previous step
   */
  const goPrevious = useCallback((): boolean => {
    if (!config.allowBackNavigation || currentStep <= 0) {
      return false;
    }

    return goToStep(currentStep - 1);
  }, [config.allowBackNavigation, currentStep, goToStep]);

  /**
   * Go to first step
   */
  const goFirst = useCallback((): boolean => {
    return goToStep(0);
  }, [goToStep]);

  /**
   * Go to last accessible step
   */
  const goLast = useCallback((): boolean => {
    const lastAccessibleStep = steps.findLastIndex((step) => step.isAccessible);
    return lastAccessibleStep >= 0 ? goToStep(lastAccessibleStep) : false;
  }, [steps, goToStep]);

  /**
   * Get step by index
   */
  const getStepByIndex = useCallback(
    (index: number): WizardStep | null => {
      return steps[index] || null;
    },
    [steps],
  );

  /**
   * Get step by ID
   */
  const getStepById = useCallback(
    (id: string | number): WizardStep | null => {
      return steps.find((step) => step.id === id) || null;
    },
    [steps],
  );

  /**
   * Check if step is completed
   */
  const isStepCompleted = useCallback(
    (stepIndex: number): boolean => {
      return completedSteps.includes(stepIndex);
    },
    [completedSteps],
  );

  /**
   * Check if step is accessible
   */
  const isStepAccessible = useCallback(
    (stepIndex: number): boolean => {
      const step = steps[stepIndex];
      return step ? step.isAccessible : false;
    },
    [steps],
  );

  /**
   * Get next incomplete step
   */
  const getNextIncompleteStep = useCallback((): number | null => {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.isRequired && !step.isCompleted && step.isAccessible) {
        return i;
      }
    }
    return null;
  }, [steps]);

  /**
   * Save progress to localStorage
   */
  const saveProgress = useCallback(() => {
    if (!config.persistProgress || !config.progressKey) {
      return;
    }

    const progressData = {
      currentStep,
      completedSteps,
      visitedSteps,
      stepsState: steps.map((step) => ({
        id: step.id,
        isCompleted: step.isCompleted,
        isAccessible: step.isAccessible,
      })),
    };

    try {
      localStorage.setItem(config.progressKey, JSON.stringify(progressData));
    } catch (error) {
      console.warn("Failed to save wizard progress to localStorage:", error);
    }
  }, [
    config.persistProgress,
    config.progressKey,
    currentStep,
    completedSteps,
    visitedSteps,
    steps,
  ]);

  /**
   * Load progress from localStorage
   */
  const loadProgress = useCallback(() => {
    if (!config.persistProgress || !config.progressKey) {
      return;
    }

    try {
      const savedProgress = localStorage.getItem(config.progressKey);
      if (!savedProgress) {
        return;
      }

      const progressData = JSON.parse(savedProgress);

      // Restore step states
      setSteps((prev) =>
        prev.map((step) => {
          const savedStepState = progressData.stepsState.find(
            (s: unknown) => s.id === step.id,
          );
          if (savedStepState) {
            return {
              ...step,
              isCompleted: savedStepState.isCompleted,
              isAccessible: savedStepState.isAccessible,
            };
          }
          return step;
        }),
      );

      setCurrentStep(progressData.currentStep);
      setCompletedSteps(progressData.completedSteps);
      setVisitedSteps(progressData.visitedSteps);
    } catch (error) {
      console.warn("Failed to load wizard progress from localStorage:", error);
    }
  }, [config.persistProgress, config.progressKey]);

  /**
   * Reset progress
   */
  const resetProgress = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setVisitedSteps([0]);
    setSteps((prev) =>
      prev.map((step, index) => ({
        ...step,
        isCompleted: false,
        isAccessible: index === 0,
      })),
    );

    if (config.persistProgress && config.progressKey) {
      try {
        localStorage.removeItem(config.progressKey);
      } catch (error) {
        console.warn(
          "Failed to clear wizard progress from localStorage:",
          error,
        );
      }
    }
  }, [config.persistProgress, config.progressKey]);

  /**
   * Computed values
   */
  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const canGoNext = !isLastStep && steps[currentStep + 1]?.isAccessible;
  const canGoPrevious = !isFirstStep && config.allowBackNavigation;
  const progressPercentage =
    totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;

  /**
   * Auto-save progress when it changes
   */
  useEffect(() => {
    if (config.persistProgress) {
      saveProgress();
    }
  }, [
    config.persistProgress,
    saveProgress,
    currentStep,
    completedSteps,
    visitedSteps,
  ]);

  /**
   * Load progress on mount
   */
  useEffect(() => {
    if (config.persistProgress) {
      loadProgress();
    }
  }, [config.persistProgress, loadProgress]);

  return {
    // State
    currentStep,
    steps,
    completedSteps,
    visitedSteps,
    canGoNext,
    canGoPrevious,
    isFirstStep,
    isLastStep,
    totalSteps,
    progressPercentage,

    // Navigation methods
    goToStep,
    goNext,
    goPrevious,
    goFirst,
    goLast,

    // Step management
    markStepAsCompleted,
    markStepAsIncomplete,
    updateStepAccessibility,
    validateCurrentStep,

    // Progress management
    resetProgress,
    loadProgress,
    saveProgress,

    // Utility methods
    getStepByIndex,
    getStepById,
    isStepCompleted,
    isStepAccessible,
    getNextIncompleteStep,
  };
};

export default useWizardNavigation;
