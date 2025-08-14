/**
 * WizardContainer Component for ZentraQMS
 *
 * Based on Velzon React Admin Template
 * Adapted for Organization Configuration Wizard
 */
import React, { useState, useCallback, ReactNode } from "react";
// Removed classnames dependency - using template literals instead

// Types
interface WizardStep {
  id: number;
  title: string;
  subtitle?: string;
  component: ReactNode;
  validation?: () => boolean;
  onNext?: () => Promise<void> | void;
  onPrevious?: () => Promise<void> | void;
}

interface WizardContainerProps {
  title?: string;
  subtitle?: string;
  steps: WizardStep[];
  onComplete?: (data: any) => Promise<void>;
  showProgress?: boolean;
  allowSkipSteps?: boolean;
  className?: string;
}

const WizardContainer: React.FC<WizardContainerProps> = ({
  title = "Configuración de Organización",
  subtitle = "Complete la información básica de su organización",
  steps,
  onComplete,
  showProgress = true,
  allowSkipSteps = false,
  className = "",
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<number>(1);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [passedSteps, setPassedSteps] = useState<number[]>([1]);
  const [loading, setLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<number, string>
  >({});

  // Calculate progress percentage
  const calculateProgress = useCallback(
    (stepNumber: number): number => {
      return ((stepNumber - 1) / (steps.length - 1)) * 100;
    },
    [steps.length],
  );

  // Validate current step
  const validateStep = useCallback(
    (stepId: number): boolean => {
      const step = steps.find((s) => s.id === stepId);
      if (!step?.validation) return true;

      try {
        const isValid = step.validation();
        if (!isValid) {
          setValidationErrors((prev) => ({
            ...prev,
            [stepId]: "Por favor complete todos los campos requeridos",
          }));
        } else {
          setValidationErrors((prev) => {
            const { [stepId]: removed, ...rest } = prev;
            return rest;
          });
        }
        return isValid;
      } catch (error) {
        console.error("Validation error:", error);
        setValidationErrors((prev) => ({
          ...prev,
          [stepId]: "Error en la validación",
        }));
        return false;
      }
    },
    [steps],
  );

  // Handle step navigation
  const navigateToStep = useCallback(
    async (targetStep: number, skipValidation = false) => {
      // Prevent navigation if already loading
      if (loading) return;

      // Validate current step before moving forward (unless skipping validation)
      if (targetStep > activeTab && !skipValidation) {
        if (!validateStep(activeTab)) {
          return;
        }
      }

      // Check if step is allowed to be accessed
      if (!allowSkipSteps && targetStep > Math.max(...passedSteps) + 1) {
        return;
      }

      setLoading(true);

      try {
        const currentStep = steps.find((s) => s.id === activeTab);

        // Execute onNext or onPrevious callbacks if defined
        if (targetStep > activeTab && currentStep?.onNext) {
          await currentStep.onNext();
        } else if (targetStep < activeTab && currentStep?.onPrevious) {
          await currentStep.onPrevious();
        }

        // Update state
        setActiveTab(targetStep);
        setProgressValue(calculateProgress(targetStep));

        // Add step to passed steps if moving forward
        if (targetStep > activeTab) {
          setPassedSteps((prev) => [...new Set([...prev, targetStep])]);
        }
      } catch (error) {
        console.error("Navigation error:", error);
        setValidationErrors((prev) => ({
          ...prev,
          [activeTab]: "Error al procesar el paso",
        }));
      } finally {
        setLoading(false);
      }
    },
    [
      activeTab,
      allowSkipSteps,
      calculateProgress,
      loading,
      passedSteps,
      steps,
      validateStep,
    ],
  );

  // Handle next step
  const handleNext = useCallback(() => {
    const nextStep = activeTab + 1;
    if (nextStep <= steps.length) {
      navigateToStep(nextStep);
    }
  }, [activeTab, navigateToStep, steps.length]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    const prevStep = activeTab - 1;
    if (prevStep >= 1) {
      navigateToStep(prevStep, true); // Skip validation when going back
    }
  }, [activeTab, navigateToStep]);

  // Handle wizard completion
  const handleComplete = useCallback(async () => {
    if (!validateStep(activeTab)) return;

    setLoading(true);
    try {
      if (onComplete) {
        await onComplete({});
      }
    } catch (error) {
      console.error("Completion error:", error);
      setValidationErrors((prev) => ({
        ...prev,
        [activeTab]: "Error al completar la configuración",
      }));
    } finally {
      setLoading(false);
    }
  }, [activeTab, onComplete, validateStep]);

  // Get current step
  const currentStep = steps.find((s) => s.id === activeTab);

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-xl-10">
            <div className={`card ${className}`}>
              <div className="card-header">
                <div className="text-center pt-3 pb-4 mb-1">
                  <h4 className="card-title mb-2">{title}</h4>
                  {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
                </div>
              </div>

              <div className="card-body">
                <div className="form-steps">
                  {/* Progress Navigation */}
                  {showProgress && (
                    <div className="progress-nav mb-4">
                      <div className="progress mb-3" style={{ height: "2px" }}>
                        <div
                          className="progress-bar"
                          style={{ width: `${progressValue}%` }}
                        ></div>
                      </div>

                      <ul
                        className="nav nav-pills progress-bar-tab custom-nav"
                        role="tablist"
                      >
                        {steps.map((step) => (
                          <li key={step.id} className="nav-item">
                            <button
                              type="button"
                              className={`nav-link rounded-pill position-relative ${
                                activeTab === step.id ? "active" : ""
                              } ${
                                passedSteps.includes(step.id) &&
                                activeTab !== step.id
                                  ? "done"
                                  : ""
                              } ${
                                !allowSkipSteps &&
                                step.id > Math.max(...passedSteps) + 1
                                  ? "disabled"
                                  : ""
                              }`.trim()}
                              onClick={() => {
                                if (
                                  allowSkipSteps ||
                                  passedSteps.includes(step.id) ||
                                  step.id <= Math.max(...passedSteps) + 1
                                ) {
                                  navigateToStep(step.id, step.id < activeTab);
                                }
                              }}
                              style={{ cursor: "pointer" }}
                              disabled={loading}
                            >
                              {step.id}
                              {validationErrors[step.id] && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                  <i className="ri-error-warning-line"></i>
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Step Content */}
                  <div className="tab-content">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className={`tab-pane ${activeTab === step.id ? "active show" : ""}`}
                      >
                        <div className="step-content">
                          {/* Step Header */}
                          <div className="mb-4">
                            <h5 className="mb-1">{step.title}</h5>
                            {step.subtitle && (
                              <p className="text-muted mb-0">{step.subtitle}</p>
                            )}
                          </div>

                          {/* Validation Error */}
                          {validationErrors[step.id] && (
                            <div
                              className="alert alert-danger d-flex align-items-center"
                              role="alert"
                            >
                              <i className="ri-error-warning-line me-2"></i>
                              {validationErrors[step.id]}
                            </div>
                          )}

                          {/* Step Component */}
                          <div className="step-component">{step.component}</div>

                          {/* Navigation Buttons */}
                          <div className="d-flex align-items-center gap-3 mt-4">
                            {/* Previous Button */}
                            {step.id > 1 && (
                              <button
                                type="button"
                                className="btn btn-light btn-label"
                                onClick={handlePrevious}
                                disabled={loading}
                              >
                                <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>
                                Anterior
                              </button>
                            )}

                            {/* Next/Complete Button */}
                            <div className="ms-auto">
                              {step.id < steps.length ? (
                                <button
                                  type="button"
                                  className="btn btn-success btn-label right"
                                  onClick={handleNext}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <span className="spinner-border spinner-border-sm me-2" />
                                  ) : (
                                    <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                  )}
                                  Siguiente
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-success btn-label"
                                  onClick={handleComplete}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <span className="spinner-border spinner-border-sm me-2" />
                                  ) : (
                                    <i className="ri-check-line label-icon align-middle fs-16 me-2"></i>
                                  )}
                                  Completar Configuración
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardContainer;
