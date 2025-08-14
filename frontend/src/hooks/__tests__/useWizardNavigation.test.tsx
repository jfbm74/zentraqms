/**
 * Tests for useWizardNavigation Hook - TASK-027
 *
 * Comprehensive test suite for wizard navigation including:
 * - Step navigation and validation
 * - Progress tracking and persistence
 * - Conditional navigation rules
 * - Step accessibility management
 *
 * Author: Claude
 * Date: 2025-08-14
 * Coverage Target: >80%
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useWizardNavigation } from "../useWizardNavigation";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useWizardNavigation", () => {
  const sampleSteps = [
    {
      id: "step1",
      title: "Organization Info",
      description: "Enter organization details",
      isRequired: true,
      validationRules: [
        {
          field: "name",
          validator: (value: unknown) => !!value && value.length > 0,
          message: "Name is required",
        },
      ],
    },
    {
      id: "step2",
      title: "Location Info",
      description: "Enter location details",
      isRequired: true,
      validationRules: [
        {
          field: "address",
          validator: (value: unknown) => !!value && value.length > 0,
          message: "Address is required",
        },
      ],
    },
    {
      id: "step3",
      title: "Configuration",
      description: "Configure settings",
      isRequired: false,
    },
    {
      id: "step4",
      title: "Review",
      description: "Review and submit",
      isRequired: true,
    },
  ];

  // const _defaultConfig = {
  //   allowSkipOptionalSteps: true,
  //   allowBackNavigation: true,
  //   validateOnStepChange: true,
  //   persistProgress: false,
  // };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with correct default state", () => {
      const { result } = renderHook(() => useWizardNavigation(sampleSteps));

      expect(result.current.currentStep).toBe(0);
      expect(result.current.totalSteps).toBe(4);
      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);
      expect(result.current.canGoNext).toBe(false); // Step 1 not accessible initially
      expect(result.current.canGoPrevious).toBe(false);
      expect(result.current.completedSteps).toEqual([]);
      expect(result.current.visitedSteps).toEqual([0]);
      expect(result.current.progressPercentage).toBe(0);
    });

    it("should initialize steps with correct accessibility", () => {
      const { result } = renderHook(() => useWizardNavigation(sampleSteps));

      expect(result.current.steps[0].isAccessible).toBe(true);
      expect(result.current.steps[1].isAccessible).toBe(false);
      expect(result.current.steps[2].isAccessible).toBe(false);
      expect(result.current.steps[3].isAccessible).toBe(false);
    });

    it("should apply custom configuration", () => {
      const customConfig = {
        allowBackNavigation: false,
        validateOnStepChange: false,
      };

      const { result } = renderHook(() =>
        useWizardNavigation(sampleSteps, customConfig),
      );

      expect(result.current.canGoPrevious).toBe(false);
    });
  });

  describe("Step Navigation", () => {
    describe("goToStep", () => {
      it("should navigate to accessible step", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Make step 1 accessible first
        act(() => {
          result.current.updateStepAccessibility(1, true);
        });

        const success = act(() => {
          return result.current.goToStep(1);
        });

        expect(success).toBe(true);
        expect(result.current.currentStep).toBe(1);
        expect(result.current.visitedSteps).toContain(1);
      });

      it("should not navigate to inaccessible step", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        const success = act(() => {
          return result.current.goToStep(2);
        });

        expect(success).toBe(false);
        expect(result.current.currentStep).toBe(0);
      });

      it("should not navigate to invalid step index", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        const successNegative = act(() => {
          return result.current.goToStep(-1);
        });

        const successTooHigh = act(() => {
          return result.current.goToStep(10);
        });

        expect(successNegative).toBe(false);
        expect(successTooHigh).toBe(false);
        expect(result.current.currentStep).toBe(0);
      });

      it("should prevent forward navigation if current step incomplete", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Make steps accessible
        act(() => {
          result.current.updateStepAccessibility(1, true);
          result.current.updateStepAccessibility(2, true);
        });

        // Try to skip step 1 without completing it
        const success = act(() => {
          return result.current.goToStep(2);
        });

        expect(success).toBe(false);
        expect(result.current.currentStep).toBe(0);
      });

      it("should allow backward navigation when enabled", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Complete and navigate to step 1
        act(() => {
          result.current.markStepAsCompleted(0);
          result.current.updateStepAccessibility(1, true);
          result.current.goToStep(1);
        });

        // Go back to step 0
        const success = act(() => {
          return result.current.goToStep(0);
        });

        expect(success).toBe(true);
        expect(result.current.currentStep).toBe(0);
      });

      it("should prevent backward navigation when disabled", () => {
        const { result } = renderHook(() =>
          useWizardNavigation(sampleSteps, {
            allowBackNavigation: false,
          }),
        );

        // Complete and navigate to step 1
        act(() => {
          result.current.markStepAsCompleted(0);
          result.current.updateStepAccessibility(1, true);
          result.current.goToStep(1);
        });

        // Try to go back to step 0
        const success = act(() => {
          return result.current.goToStep(0);
        });

        expect(success).toBe(false);
        expect(result.current.currentStep).toBe(1);
      });
    });

    describe("goNext", () => {
      it("should go to next step when current step is completed", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Complete current step and make next accessible
        act(() => {
          result.current.markStepAsCompleted(0);
          result.current.updateStepAccessibility(1, true);
        });

        const success = act(() => {
          return result.current.goNext();
        });

        expect(success).toBe(true);
        expect(result.current.currentStep).toBe(1);
      });

      it("should not go to next step when current step is incomplete and required", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Make next step accessible but don't complete current
        act(() => {
          result.current.updateStepAccessibility(1, true);
        });

        const success = act(() => {
          return result.current.goNext();
        });

        expect(success).toBe(false);
        expect(result.current.currentStep).toBe(0);
      });

      it("should not go beyond last step", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Navigate to last step
        act(() => {
          result.current.goToStep(3);
        });

        const success = act(() => {
          return result.current.goNext();
        });

        expect(success).toBe(false);
      });

      it("should skip validation when disabled", () => {
        const { result } = renderHook(() =>
          useWizardNavigation(sampleSteps, {
            validateOnStepChange: false,
          }),
        );

        // Make next step accessible without completing current
        act(() => {
          result.current.updateStepAccessibility(1, true);
        });

        const success = act(() => {
          return result.current.goNext();
        });

        expect(success).toBe(true);
        expect(result.current.currentStep).toBe(1);
      });
    });

    describe("goPrevious", () => {
      it("should go to previous step when navigation allowed", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Navigate to step 1 first
        act(() => {
          result.current.markStepAsCompleted(0);
          result.current.updateStepAccessibility(1, true);
          result.current.goToStep(1);
        });

        const success = act(() => {
          return result.current.goPrevious();
        });

        expect(success).toBe(true);
        expect(result.current.currentStep).toBe(0);
      });

      it("should not go to previous step when navigation disabled", () => {
        const { result } = renderHook(() =>
          useWizardNavigation(sampleSteps, {
            allowBackNavigation: false,
          }),
        );

        // Navigate to step 1 first
        act(() => {
          result.current.markStepAsCompleted(0);
          result.current.updateStepAccessibility(1, true);
          result.current.goToStep(1);
        });

        const success = act(() => {
          return result.current.goPrevious();
        });

        expect(success).toBe(false);
        expect(result.current.currentStep).toBe(1);
      });

      it("should not go before first step", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        const success = act(() => {
          return result.current.goPrevious();
        });

        expect(success).toBe(false);
        expect(result.current.currentStep).toBe(0);
      });
    });

    describe("goFirst and goLast", () => {
      it("should go to first step", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Navigate to middle step first
        act(() => {
          result.current.markStepAsCompleted(0);
          result.current.updateStepAccessibility(1, true);
          result.current.goToStep(1);
        });

        const success = act(() => {
          return result.current.goFirst();
        });

        expect(success).toBe(true);
        expect(result.current.currentStep).toBe(0);
      });

      it("should go to last accessible step", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Make some steps accessible
        act(() => {
          result.current.updateStepAccessibility(1, true);
          result.current.updateStepAccessibility(2, true);
        });

        const success = act(() => {
          return result.current.goLast();
        });

        expect(success).toBe(true);
        expect(result.current.currentStep).toBe(2);
      });
    });
  });

  describe("Step Management", () => {
    describe("markStepAsCompleted", () => {
      it("should mark step as completed and update next step accessibility", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        act(() => {
          result.current.markStepAsCompleted(0);
        });

        expect(result.current.steps[0].isCompleted).toBe(true);
        expect(result.current.steps[1].isAccessible).toBe(true);
        expect(result.current.completedSteps).toContain(0);
        expect(result.current.progressPercentage).toBe(25); // 1 of 4 steps completed
      });

      it("should not duplicate completed steps", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        act(() => {
          result.current.markStepAsCompleted(0);
          result.current.markStepAsCompleted(0);
        });

        expect(result.current.completedSteps).toEqual([0]);
      });
    });

    describe("markStepAsIncomplete", () => {
      it("should mark step as incomplete", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Complete step first
        act(() => {
          result.current.markStepAsCompleted(0);
        });

        // Then mark as incomplete
        act(() => {
          result.current.markStepAsIncomplete(0);
        });

        expect(result.current.steps[0].isCompleted).toBe(false);
        expect(result.current.completedSteps).not.toContain(0);
      });
    });

    describe("updateStepAccessibility", () => {
      it("should update step accessibility", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        act(() => {
          result.current.updateStepAccessibility(2, true);
        });

        expect(result.current.steps[2].isAccessible).toBe(true);
      });
    });
  });

  describe("Validation", () => {
    describe("validateCurrentStep", () => {
      it("should validate step with rules successfully", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        const validationResult = result.current.validateCurrentStep({
          name: "Test Organization",
        });

        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toEqual({});
      });

      it("should return validation errors for invalid data", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        const validationResult = result.current.validateCurrentStep({
          name: "",
        });

        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors.name).toBe("Name is required");
      });

      it("should validate successfully when no validation rules exist", () => {
        const stepsWithoutValidation = sampleSteps.map((step) => ({
          ...step,
          validationRules: undefined,
        }));
        const { result } = renderHook(() =>
          useWizardNavigation(stepsWithoutValidation),
        );

        const validationResult = result.current.validateCurrentStep({});

        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toEqual({});
      });

      it("should handle custom validation messages", () => {
        const stepsWithCustomValidation = [
          {
            ...sampleSteps[0],
            validationRules: [
              {
                field: "name",
                validator: (value: unknown) =>
                  value === "invalid" ? "Custom error message" : true,
                message: "Default message",
              },
            ],
          },
        ];

        const { result } = renderHook(() =>
          useWizardNavigation(stepsWithCustomValidation),
        );

        const validationResult = result.current.validateCurrentStep({
          name: "invalid",
        });

        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors.name).toBe("Custom error message");
      });
    });
  });

  describe("Utility Methods", () => {
    describe("getStepByIndex and getStepById", () => {
      it("should get step by index", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        const step = result.current.getStepByIndex(1);

        expect(step?.id).toBe("step2");
        expect(step?.title).toBe("Location Info");
      });

      it("should return null for invalid index", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        const step = result.current.getStepByIndex(10);

        expect(step).toBeNull();
      });

      it("should get step by ID", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        const step = result.current.getStepById("step3");

        expect(step?.title).toBe("Configuration");
      });

      it("should return null for invalid ID", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        const step = result.current.getStepById("invalid");

        expect(step).toBeNull();
      });
    });

    describe("isStepCompleted and isStepAccessible", () => {
      it("should check if step is completed", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        act(() => {
          result.current.markStepAsCompleted(0);
        });

        expect(result.current.isStepCompleted(0)).toBe(true);
        expect(result.current.isStepCompleted(1)).toBe(false);
      });

      it("should check if step is accessible", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        expect(result.current.isStepAccessible(0)).toBe(true);
        expect(result.current.isStepAccessible(1)).toBe(false);

        act(() => {
          result.current.updateStepAccessibility(1, true);
        });

        expect(result.current.isStepAccessible(1)).toBe(true);
      });
    });

    describe("getNextIncompleteStep", () => {
      it("should find next incomplete required step", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Make all steps accessible
        act(() => {
          result.current.updateStepAccessibility(1, true);
          result.current.updateStepAccessibility(2, true);
          result.current.updateStepAccessibility(3, true);
        });

        const nextStep = result.current.getNextIncompleteStep();

        expect(nextStep).toBe(0); // First required step that's not completed
      });

      it("should return null when all required steps are completed", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Complete all required steps
        act(() => {
          result.current.markStepAsCompleted(0);
          result.current.markStepAsCompleted(1);
          result.current.markStepAsCompleted(3);
        });

        const nextStep = result.current.getNextIncompleteStep();

        expect(nextStep).toBeNull();
      });

      it("should skip inaccessible steps", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Complete first step but keep others inaccessible
        act(() => {
          result.current.markStepAsCompleted(0);
        });

        const nextStep = result.current.getNextIncompleteStep();

        expect(nextStep).toBe(1); // Step 1 becomes accessible when step 0 is completed
      });
    });
  });

  describe("Progress Management", () => {
    describe("resetProgress", () => {
      it("should reset all progress to initial state", () => {
        const { result } = renderHook(() => useWizardNavigation(sampleSteps));

        // Make some progress
        act(() => {
          result.current.markStepAsCompleted(0);
          result.current.updateStepAccessibility(1, true);
          result.current.goToStep(1);
        });

        // Reset progress
        act(() => {
          result.current.resetProgress();
        });

        expect(result.current.currentStep).toBe(0);
        expect(result.current.completedSteps).toEqual([]);
        expect(result.current.visitedSteps).toEqual([0]);
        expect(result.current.steps[0].isAccessible).toBe(true);
        expect(result.current.steps[1].isAccessible).toBe(false);
      });

      it("should clear localStorage when persistence is enabled", () => {
        const { result } = renderHook(() =>
          useWizardNavigation(sampleSteps, {
            persistProgress: true,
            progressKey: "test_progress",
          }),
        );

        act(() => {
          result.current.resetProgress();
        });

        expect(localStorageMock.removeItem).toHaveBeenCalledWith(
          "test_progress",
        );
      });
    });

    describe("saveProgress and loadProgress", () => {
      it("should save progress to localStorage when enabled", () => {
        const { result } = renderHook(() =>
          useWizardNavigation(sampleSteps, {
            persistProgress: true,
            progressKey: "test_progress",
          }),
        );

        // Make some progress
        act(() => {
          result.current.markStepAsCompleted(0);
        });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          "test_progress",
          expect.stringContaining('"currentStep":0'),
        );
      });

      it("should load progress from localStorage", () => {
        const savedProgress = {
          currentStep: 1,
          completedSteps: [0],
          visitedSteps: [0, 1],
          stepsState: [
            { id: "step1", isCompleted: true, isAccessible: true },
            { id: "step2", isCompleted: false, isAccessible: true },
            { id: "step3", isCompleted: false, isAccessible: false },
            { id: "step4", isCompleted: false, isAccessible: false },
          ],
        };

        localStorageMock.getItem.mockReturnValue(JSON.stringify(savedProgress));

        const { result } = renderHook(() =>
          useWizardNavigation(sampleSteps, {
            persistProgress: true,
            progressKey: "test_progress",
          }),
        );

        expect(result.current.currentStep).toBe(1);
        expect(result.current.completedSteps).toEqual([0]);
        expect(result.current.visitedSteps).toEqual([0, 1]);
        expect(result.current.steps[0].isCompleted).toBe(true);
        expect(result.current.steps[1].isAccessible).toBe(true);
      });

      it("should handle corrupted localStorage data gracefully", () => {
        localStorageMock.getItem.mockReturnValue("invalid json");

        const { result } = renderHook(() =>
          useWizardNavigation(sampleSteps, {
            persistProgress: true,
            progressKey: "test_progress",
          }),
        );

        // Should fall back to initial state
        expect(result.current.currentStep).toBe(0);
        expect(result.current.completedSteps).toEqual([]);
      });

      it("should not persist when disabled", () => {
        const { result } = renderHook(() =>
          useWizardNavigation(sampleSteps, {
            persistProgress: false,
          }),
        );

        act(() => {
          result.current.markStepAsCompleted(0);
        });

        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });
    });
  });

  describe("Computed Properties", () => {
    it("should calculate progress percentage correctly", () => {
      const { result } = renderHook(() => useWizardNavigation(sampleSteps));

      expect(result.current.progressPercentage).toBe(0);

      act(() => {
        result.current.markStepAsCompleted(0);
      });

      expect(result.current.progressPercentage).toBe(25);

      act(() => {
        result.current.markStepAsCompleted(1);
      });

      expect(result.current.progressPercentage).toBe(50);
    });

    it("should update navigation state correctly", () => {
      const { result } = renderHook(() => useWizardNavigation(sampleSteps));

      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrevious).toBe(false);

      // Complete step and make next accessible
      act(() => {
        result.current.markStepAsCompleted(0);
        result.current.updateStepAccessibility(1, true);
      });

      expect(result.current.canGoNext).toBe(true);

      // Navigate to next step
      act(() => {
        result.current.goToStep(1);
      });

      expect(result.current.isFirstStep).toBe(false);
      expect(result.current.canGoPrevious).toBe(true);

      // Navigate to last step
      act(() => {
        result.current.updateStepAccessibility(3, true);
        result.current.goToStep(3);
      });

      expect(result.current.isLastStep).toBe(true);
      expect(result.current.canGoNext).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty steps array", () => {
      const { result } = renderHook(() => useWizardNavigation([]));

      expect(result.current.totalSteps).toBe(0);
      expect(result.current.currentStep).toBe(0);
      expect(result.current.progressPercentage).toBe(0);
    });

    it("should handle single step", () => {
      const singleStep = [sampleSteps[0]];
      const { result } = renderHook(() => useWizardNavigation(singleStep));

      expect(result.current.totalSteps).toBe(1);
      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(true);
      expect(result.current.canGoNext).toBe(false);
      expect(result.current.canGoPrevious).toBe(false);
    });

    it("should handle steps with duplicate IDs", () => {
      const duplicateSteps = [
        { ...sampleSteps[0], id: "duplicate" },
        { ...sampleSteps[1], id: "duplicate" },
      ];

      const { result } = renderHook(() => useWizardNavigation(duplicateSteps));

      const foundStep = result.current.getStepById("duplicate");
      expect(foundStep).toBe(result.current.steps[0]); // Should return first match
    });

    it("should handle complex validation scenarios", () => {
      const complexValidationSteps = [
        {
          id: "complex",
          title: "Complex Validation",
          isRequired: true,
          validationRules: [
            {
              field: "email",
              validator: (value: unknown, allData: unknown) => {
                if (!value) return "Email is required";
                if (!value.includes("@")) return "Invalid email format";
                if (allData.confirmEmail !== value)
                  return "Emails do not match";
                return true;
              },
              message: "Email validation failed",
            },
          ],
        },
      ];

      const { result } = renderHook(() =>
        useWizardNavigation(complexValidationSteps),
      );

      const validationResult = result.current.validateCurrentStep({
        email: "test@example.com",
        confirmEmail: "different@example.com",
      });

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.email).toBe("Emails do not match");
    });
  });
});
