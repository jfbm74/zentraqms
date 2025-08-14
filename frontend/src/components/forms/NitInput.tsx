/**
 * NitInput Component - Professional Colombian NIT Input
 *
 * Features:
 * - Automatic formatting (###.###.###-#)
 * - Real-time validation
 * - Automatic verification digit calculation
 * - Visual feedback (✓/✗)
 * - Integration with form libraries
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

interface NitInputProps {
  value?: string;
  onChange?: (nit: string, verificationDigit: string, isValid: boolean) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  label?: string;
  required?: boolean;
  id?: string;
}

interface NitState {
  nit: string;
  verificationDigit: string;
  formattedNit: string;
  isValid: boolean;
  isCalculating: boolean;
  showValidation: boolean;
}

const NitInput: React.FC<NitInputProps> = ({
  value = "",
  onChange,
  onBlur,
  placeholder = "Ingrese el NIT",
  disabled = false,
  className = "",
  error,
  label,
  required = false,
  id = "nit-input",
}) => {
  const [state, setState] = useState<NitState>({
    nit: "",
    verificationDigit: "",
    formattedNit: "",
    isValid: false,
    isCalculating: false,
    showValidation: false,
  });

  const nitInputRef = useRef<HTMLInputElement>(null);
  const dvInputRef = useRef<HTMLInputElement>(null);

  /**
   * Calculate Colombian NIT verification digit
   */
  const calculateVerificationDigit = (nit: string): string => {
    const cleanNit = nit.replace(/\D/g, "");

    if (cleanNit.length < 8 || cleanNit.length > 15) {
      return "";
    }

    const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    const nitArray = cleanNit.split("").map(Number).reverse();

    let sum = 0;
    for (let i = 0; i < nitArray.length; i++) {
      sum += nitArray[i] * weights[i];
    }

    const remainder = sum % 11;

    if (remainder < 2) {
      return remainder.toString();
    } else {
      return (11 - remainder).toString();
    }
  };

  /**
   * Format NIT with dots
   */
  const formatNit = (nit: string): string => {
    const cleanNit = nit.replace(/\D/g, "");

    if (cleanNit.length <= 3) {
      return cleanNit;
    } else if (cleanNit.length <= 6) {
      return `${cleanNit.slice(0, 3)}.${cleanNit.slice(3)}`;
    } else if (cleanNit.length <= 9) {
      return `${cleanNit.slice(0, 3)}.${cleanNit.slice(3, 6)}.${cleanNit.slice(6)}`;
    } else {
      return `${cleanNit.slice(0, 3)}.${cleanNit.slice(3, 6)}.${cleanNit.slice(6, 9)}`;
    }
  };

  /**
   * Validate NIT format
   */
  const validateNit = useCallback((nit: string, dv: string): boolean => {
    const cleanNit = nit.replace(/\D/g, "");

    // Basic length validation
    if (cleanNit.length < 8 || cleanNit.length > 15) {
      return false;
    }

    // DV validation
    if (!dv || dv.length !== 1 || !/^\d$/.test(dv)) {
      return false;
    }

    // Calculate and compare verification digit
    const calculatedDv = calculateVerificationDigit(cleanNit);
    return calculatedDv === dv;
  }, []);

  /**
   * Handle NIT input change
   */
  const handleNitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cleanValue = inputValue.replace(/\D/g, "");

    // Limit to 15 digits (Colombian NIT max length)
    if (cleanValue.length > 15) {
      return;
    }

    const formattedValue = formatNit(cleanValue);

    setState((prev) => ({
      ...prev,
      nit: cleanValue,
      formattedNit: formattedValue,
      isCalculating: cleanValue.length >= 8,
      showValidation: cleanValue.length >= 8,
    }));

    // Auto-calculate verification digit for valid length NITs
    if (cleanValue.length >= 8) {
      setTimeout(() => {
        const calculatedDv = calculateVerificationDigit(cleanValue);
        const isValid = validateNit(cleanValue, calculatedDv);

        setState((prev) => ({
          ...prev,
          verificationDigit: calculatedDv,
          isValid,
          isCalculating: false,
        }));

        // Call onChange callback
        if (onChange) {
          onChange(cleanValue, calculatedDv, isValid);
        }
      }, 100);
    } else {
      setState((prev) => ({
        ...prev,
        verificationDigit: "",
        isValid: false,
        isCalculating: false,
        showValidation: false,
      }));

      if (onChange) {
        onChange(cleanValue, "", false);
      }
    }
  };

  /**
   * Handle verification digit manual change
   */
  const handleDvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dvValue = e.target.value.replace(/\D/g, "").slice(0, 1);
    const isValid = validateNit(state.nit, dvValue);

    setState((prev) => ({
      ...prev,
      verificationDigit: dvValue,
      isValid,
      showValidation: dvValue.length > 0,
    }));

    if (onChange) {
      onChange(state.nit, dvValue, isValid);
    }
  };

  /**
   * Handle input blur
   */
  const handleBlur = () => {
    setState((prev) => ({
      ...prev,
      showValidation: prev.nit.length > 0,
    }));

    if (onBlur) {
      onBlur();
    }
  };

  /**
   * Handle key navigation between inputs
   */
  const handleNitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && !e.shiftKey && state.nit.length >= 8) {
      e.preventDefault();
      dvInputRef.current?.focus();
    }
  };

  const handleDvKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Backspace" &&
      state.verificationDigit === "" &&
      !e.shiftKey
    ) {
      e.preventDefault();
      nitInputRef.current?.focus();
    }
  };

  /**
   * Initialize from prop value
   */
  useEffect(() => {
    if (value && value !== state.nit) {
      const cleanValue = value.replace(/\D/g, "");
      const formattedValue = formatNit(cleanValue);

      setState((prev) => ({
        ...prev,
        nit: cleanValue,
        formattedNit: formattedValue,
        showValidation: cleanValue.length >= 8,
      }));

      if (cleanValue.length >= 8) {
        const calculatedDv = calculateVerificationDigit(cleanValue);
        const isValid = validateNit(cleanValue, calculatedDv);

        setState((prev) => ({
          ...prev,
          verificationDigit: calculatedDv,
          isValid,
        }));
      }
    }
  }, [value, state.nit, validateNit]);

  // Determine input state classes
  const getInputStateClass = () => {
    if (!state.showValidation) return "";
    if (error) return "is-invalid";
    if (state.isValid) return "is-valid";
    if (state.nit.length > 0) return "is-invalid";
    return "";
  };

  const getValidationIcon = () => {
    if (!state.showValidation) return null;
    if (state.isCalculating) {
      return (
        <div className="position-absolute end-0 top-50 translate-middle-y me-3">
          <div
            className="spinner-border spinner-border-sm text-primary"
            role="status"
          >
            <span className="visually-hidden">Calculando...</span>
          </div>
        </div>
      );
    }
    if (state.isValid) {
      return (
        <div className="position-absolute end-0 top-50 translate-middle-y me-3">
          <i className="ri-check-line text-success fs-16"></i>
        </div>
      );
    }
    if (state.nit.length > 0) {
      return (
        <div className="position-absolute end-0 top-50 translate-middle-y me-3">
          <i className="ri-close-line text-danger fs-16"></i>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`nit-input-container ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}

      <div className="row g-2">
        {/* NIT Input */}
        <div className="col-8">
          <div className="position-relative">
            <input
              ref={nitInputRef}
              type="text"
              id={id}
              className={`form-control ${getInputStateClass()}`}
              value={state.formattedNit}
              onChange={handleNitChange}
              onBlur={handleBlur}
              onKeyDown={handleNitKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={13} // ###.###.### format
            />
            {getValidationIcon()}
          </div>

          {/* NIT Helper Text */}
          <div className="form-text">
            <small className="text-muted">Formato: 123.456.789</small>
          </div>
        </div>

        {/* Verification Digit Input */}
        <div className="col-4">
          <div className="input-group">
            <span className="input-group-text">-</span>
            <input
              ref={dvInputRef}
              type="text"
              className={`form-control ${getInputStateClass()}`}
              value={state.verificationDigit}
              onChange={handleDvChange}
              onBlur={handleBlur}
              onKeyDown={handleDvKeyDown}
              placeholder="0"
              disabled={disabled}
              maxLength={1}
            />
          </div>

          {/* DV Helper Text */}
          <div className="form-text">
            <small className="text-muted">Dígito de verificación</small>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      {error && <div className="invalid-feedback d-block">{error}</div>}

      {state.showValidation && !error && (
        <div
          className={`mt-2 ${state.isValid ? "text-success" : "text-danger"}`}
        >
          <small>
            <i
              className={`ri-${state.isValid ? "check" : "close"}-line me-1`}
            ></i>
            {state.isValid
              ? `NIT válido: ${state.formattedNit}-${state.verificationDigit}`
              : "NIT inválido o dígito de verificación incorrecto"}
          </small>
        </div>
      )}

      {/* Auto-calculation Notice */}
      {state.nit.length >= 8 && !state.isCalculating && (
        <div className="mt-1">
          <small className="text-info">
            <i className="ri-information-line me-1"></i>
            Dígito de verificación calculado automáticamente
          </small>
        </div>
      )}
    </div>
  );
};

export default NitInput;
