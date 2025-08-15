/**
 * Loading Spinner Component
 * 
 * Reusable loading spinner with different sizes and styles.
 * Supports Bootstrap spinner styles and custom messages.
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  message?: string;
  className?: string;
  fullscreen?: boolean;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  message,
  className = '',
  fullscreen = false,
  overlay = false
}) => {
  
  /**
   * Get spinner size class
   */
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'spinner-border-sm';
      case 'lg':
        return 'spinner-border-lg';
      default:
        return '';
    }
  };
  
  /**
   * Get spinner variant class
   */
  const getVariantClass = () => {
    return `text-${variant}`;
  };
  
  /**
   * Spinner element
   */
  const spinnerElement = (
    <div className="d-flex flex-column align-items-center justify-content-center">
      <div 
        className={`spinner-border ${getSizeClass()} ${getVariantClass()}`}
        role="status"
        aria-hidden="true"
      >
        <span className="visually-hidden">Cargando...</span>
      </div>
      {message && (
        <div className={`mt-3 text-${variant} ${size === 'sm' ? 'small' : ''}`}>
          {message}
        </div>
      )}
    </div>
  );
  
  /**
   * Fullscreen spinner
   */
  if (fullscreen) {
    return (
      <div 
        className={`position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center ${
          overlay ? 'bg-dark bg-opacity-50' : 'bg-white'
        } ${className}`}
        style={{ zIndex: 9999 }}
      >
        {spinnerElement}
      </div>
    );
  }
  
  /**
   * Regular spinner
   */
  return (
    <div className={`loading-spinner text-center ${className}`}>
      {spinnerElement}
    </div>
  );
};

/**
 * Page Loading Component
 */
export const PageLoading: React.FC<{ message?: string }> = ({ 
  message = "Cargando página..." 
}) => (
  <div className="page-loading">
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
            <LoadingSpinner size="lg" message={message} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Button Loading Component
 */
export const ButtonLoading: React.FC<{ 
  size?: 'sm' | 'md';
  variant?: string;
  className?: string;
}> = ({ 
  size = 'sm', 
  variant = 'light',
  className = ''
}) => (
  <div 
    className={`spinner-border ${size === 'sm' ? 'spinner-border-sm' : ''} text-${variant} ${className}`}
    role="status"
    aria-hidden="true"
  >
    <span className="visually-hidden">Cargando...</span>
  </div>
);

/**
 * Table Loading Component
 */
export const TableLoading: React.FC<{ 
  rows?: number;
  columns?: number;
  message?: string;
}> = ({ 
  rows = 5, 
  columns = 4,
  message = "Cargando datos..."
}) => (
  <div className="table-loading">
    <div className="text-center py-4 mb-3">
      <LoadingSpinner message={message} />
    </div>
    <div className="placeholder-glow">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="d-flex mb-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-fill me-2">
              <span className="placeholder col-12"></span>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Card Loading Component
 */
export const CardLoading: React.FC<{ 
  title?: boolean;
  lines?: number;
  className?: string;
}> = ({ 
  title = true, 
  lines = 3,
  className = ''
}) => (
  <div className={`card-loading ${className}`}>
    <div className="placeholder-glow">
      {title && (
        <div className="mb-3">
          <span className="placeholder col-6"></span>
        </div>
      )}
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="mb-2">
          <span className={`placeholder col-${Math.floor(Math.random() * 4) + 8}`}></span>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Inline Loading Component
 */
export const InlineLoading: React.FC<{ 
  message?: string;
  size?: 'sm' | 'md';
}> = ({ 
  message = "Cargando...", 
  size = 'sm'
}) => (
  <div className="d-inline-flex align-items-center">
    <div 
      className={`spinner-border ${size === 'sm' ? 'spinner-border-sm' : ''} me-2`}
      role="status"
      aria-hidden="true"
    >
      <span className="visually-hidden">Cargando...</span>
    </div>
    <span className={size === 'sm' ? 'small' : ''}>{message}</span>
  </div>
);

/**
 * Skeleton Loading Components
 */
export const SkeletonText: React.FC<{ 
  lines?: number;
  className?: string;
}> = ({ lines = 1, className = '' }) => (
  <div className={`placeholder-glow ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div key={index} className="mb-2">
        <span className={`placeholder col-${Math.floor(Math.random() * 4) + 7}`}></span>
      </div>
    ))}
  </div>
);

export const SkeletonAvatar: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClass = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg'
  }[size];
  
  return (
    <div className={`placeholder-glow ${className}`}>
      <div className={`${sizeClass} placeholder rounded-circle`}></div>
    </div>
  );
};

export const SkeletonCard: React.FC<{ 
  className?: string;
}> = ({ className = '' }) => (
  <div className={`card ${className}`}>
    <div className="card-body">
      <div className="placeholder-glow">
        <div className="d-flex align-items-center mb-3">
          <SkeletonAvatar size="sm" className="me-3" />
          <div className="flex-grow-1">
            <span className="placeholder col-6"></span>
          </div>
        </div>
        <SkeletonText lines={3} />
        <div className="mt-3">
          <span className="placeholder btn col-4"></span>
        </div>
      </div>
    </div>
  </div>
);

export default LoadingSpinner;