/**
 * NitInput Component - Simple Colombian NIT Input
 *
 * Features:
 * - Manual NIT entry with formatting
 * - Manual verification digit entry
 * - Basic validation for format
 * - Professional styling with Velzon
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

interface NitInputProps {
  value?: string;
  verificationDigit?: string;
  onChange?: (nit: string, verificationDigit: string) => void;
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
  showValidation: boolean;
}

const NitInput: React.FC<NitInputProps> = ({
  value = "",
  verificationDigit = "",
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
    showValidation: false,
  });

  const nitInputRef = useRef<HTMLInputElement>(null);
  const dvInputRef = useRef<HTMLInputElement>(null);

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
    } else if (cleanNit.length <= 12) {
      return `${cleanNit.slice(0, 3)}.${cleanNit.slice(3, 6)}.${cleanNit.slice(6, 9)}.${cleanNit.slice(9)}`;
    } else {
      return `${cleanNit.slice(0, 3)}.${cleanNit.slice(3, 6)}.${cleanNit.slice(6, 9)}.${cleanNit.slice(9, 12)}.${cleanNit.slice(12)}`;
    }
  };

  /**
   * NIT colombiano validation (9-10 dígitos)
   */
  const isValidFormat = useCallback((nit: string, dv: string): boolean => {
    const cleanNit = nit.replace(/\D/g, "");
    return cleanNit.length >= 9 && cleanNit.length <= 10 && /^\d$/.test(dv);
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

    setState((prev) => {
      const newState = {
        ...prev,
        nit: cleanValue,
        formattedNit: formattedValue,
        showValidation: cleanValue.length > 0,
      };
      
      // Call onChange with current verification digit from previous state
      if (onChange) {
        onChange(cleanValue, prev.verificationDigit);
      }
      
      return newState;
    });
  };

  /**
   * Handle verification digit change
   */
  const handleDvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dvValue = e.target.value.replace(/\D/g, "").slice(0, 1);

    setState((prev) => {
      const newState = {
        ...prev,
        verificationDigit: dvValue,
        showValidation: prev.nit.length > 0 || dvValue.length > 0,
      };
      
      // Call onChange with the current NIT value from state
      if (onChange) {
        onChange(prev.nit, dvValue);
      }
      
      return newState;
    });
  };

  /**
   * Handle input blur
   */
  const handleBlur = () => {
    setState((prev) => ({
      ...prev,
      showValidation: prev.nit.length > 0 || prev.verificationDigit.length > 0,
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
   * Initialize from prop values
   */
  useEffect(() => {
    const cleanNitValue = value ? value.replace(/\D/g, "") : "";
    const cleanDvValue = verificationDigit ? verificationDigit.replace(/\D/g, "").slice(0, 1) : "";
    
    // Only update if the values are different from current state
    if (cleanNitValue !== state.nit || cleanDvValue !== state.verificationDigit) {
      const formattedValue = formatNit(cleanNitValue);

      setState((prev) => ({
        ...prev,
        nit: cleanNitValue,
        verificationDigit: cleanDvValue,
        formattedNit: formattedValue,
        showValidation: cleanNitValue.length > 0 || cleanDvValue.length > 0,
      }));
    }
  }, [value, verificationDigit, state.nit, state.verificationDigit]);

  // Determine input state classes
  const getInputStateClass = () => {
    if (error) return "is-invalid";
    if (!state.showValidation) return "";
    
    const hasValidFormat = isValidFormat(state.nit, state.verificationDigit);
    if (hasValidFormat && state.nit.length > 0 && state.verificationDigit.length > 0) {
      return "is-valid";
    }
    if (state.nit.length > 0 || state.verificationDigit.length > 0) {
      return "";
    }
    return "";
  };

  const getValidationIcon = () => {
    if (!state.showValidation || error) return null;
    
    const hasValidFormat = isValidFormat(state.nit, state.verificationDigit);
    if (hasValidFormat && state.nit.length > 0 && state.verificationDigit.length > 0) {
      return (
        <div className="position-absolute end-0 top-50 translate-middle-y me-3">
          <i className="ri-check-line text-success fs-16"></i>
        </div>
      );
    }
    return null;
  };

  const displayValue = state.formattedNit + (state.verificationDigit ? `-${state.verificationDigit}` : '');

  return (
    <div className={`nit-input-container ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}

      <div className="row">
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
              aria-describedby={`${id}-help`}
              aria-required={required}
              disabled={disabled}
              maxLength={17} // Allow for dots: ###.###.###.###
            />
          </div>
        </div>

        {/* Verification Digit Input */}
        <div className="col-4">
          <div className="position-relative">
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
                aria-label="Dígito de verificación"
                aria-describedby={`${id}-dv-help`}
                disabled={disabled}
                maxLength={1}
              />
              {getValidationIcon()}
            </div>
          </div>
        </div>
      </div>

      {/* NIT Helper Text */}
      <div id={`${id}-help`} className="form-text">
        <small className="text-muted d-flex align-items-center">
          <i className="ri-information-line me-1" aria-hidden="true"></i>
          Número de Identificación Tributaria - Ingrese el NIT y su dígito de verificación
          <button
            type="button"
            className="btn btn-link btn-sm p-0 ms-1"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="El NIT es un número único asignado por la DIAN. El dígito de verificación debe ser ingresado manualmente según aparece en sus documentos oficiales."
            aria-label="Información sobre el NIT"
          >
            <i className="ri-question-line text-primary" aria-hidden="true"></i>
          </button>
        </small>
      </div>

      {/* Validation Messages */}
      {error && (
        <div className="invalid-feedback d-block" role="alert">
          <i className="ri-error-warning-line me-1" aria-hidden="true"></i>
          {error}
        </div>
      )}

      {state.showValidation && !error && (
        <div className="mt-1" role="status" aria-live="polite">
          <small className="text-muted d-flex align-items-center">
            <i className="ri-file-text-line me-1" aria-hidden="true"></i>
            <span>
              {isValidFormat(state.nit, state.verificationDigit) && state.nit.length > 0 && state.verificationDigit.length > 0
                ? `NIT: ${displayValue}`
                : state.nit.length > 0 && state.nit.length < 9
                ? "El NIT colombiano debe tener entre 9 y 10 dígitos"
                : "Complete el NIT y dígito de verificación"}
            </span>
          </small>
        </div>
      )}
    </div>
  );
};

export default NitInput;