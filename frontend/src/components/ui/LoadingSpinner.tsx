/**
 * Loading Spinner Component for ZentraQMS Frontend
 *
 * Adapted from Velzon's Loader and Spinner components.
 * Provides consistent loading indicators across the application.
 */

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?:
    | "primary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "light"
    | "dark";
  text?: string;
  className?: string;
}

/**
 * Loading Spinner Component
 *
 * Provides consistent loading indicators with different sizes and colors.
 * Based on Bootstrap spinner classes for consistency with Velzon theme.
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "primary",
  text = "Cargando...",
  className = "",
}) => {
  // Determine spinner classes based on size
  const getSpinnerClasses = () => {
    let classes = "spinner-border";

    switch (size) {
      case "sm":
        classes += " spinner-border-sm";
        break;
      case "lg":
        classes += " spinner-border-lg";
        break;
      default:
        // md is default size, no additional class needed
        break;
    }

    classes += ` text-${color}`;

    if (className) {
      classes += ` ${className}`;
    }

    return classes;
  };

  // Determine text size based on spinner size
  const getTextClasses = () => {
    switch (size) {
      case "sm":
        return "small";
      case "lg":
        return "fs-6";
      default:
        return "fs-6";
    }
  };

  return (
    <div className="d-flex flex-column align-items-center">
      <div className={getSpinnerClasses()} role="status" aria-hidden="true" />
      {text && (
        <span className={`mt-2 text-muted ${getTextClasses()}`}>{text}</span>
      )}
      <span className="visually-hidden">{text}</span>
    </div>
  );
};

export default LoadingSpinner;
