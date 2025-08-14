/**
 * InfoTooltip Component - Custom tooltip with Bootstrap integration
 * 
 * A reliable tooltip component that works seamlessly with Bootstrap
 * and provides consistent behavior across the application.
 */

import React, { useState, useRef } from 'react';

interface InfoTooltipProps {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  placement = 'top',
  className = '',
  iconClassName = 'ri-question-line text-primary',
  ariaLabel = 'Información adicional',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = (event: React.MouseEvent) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      let x = 0;
      let y = 0;

      switch (placement) {
        case 'top':
          x = rect.left + scrollLeft + rect.width / 2;
          y = rect.top + scrollTop - 5;
          break;
        case 'bottom':
          x = rect.left + scrollLeft + rect.width / 2;
          y = rect.bottom + scrollTop + 5;
          break;
        case 'left':
          x = rect.left + scrollLeft - 5;
          y = rect.top + scrollTop + rect.height / 2;
          break;
        case 'right':
          x = rect.right + scrollLeft + 5;
          y = rect.top + scrollTop + rect.height / 2;
          break;
      }

      setPosition({ x, y });
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const getTooltipClasses = () => {
    const baseClasses = 'position-fixed bg-dark text-white px-2 py-1 rounded small';
    const placementClasses = {
      top: 'translate-middle-x mb-1',
      bottom: 'translate-middle-x mt-1', 
      left: 'translate-middle-y me-1',
      right: 'translate-middle-y ms-1'
    };
    
    return `${baseClasses} ${placementClasses[placement]} tooltip-custom`;
  };

  const getTooltipStyle = () => {
    const baseStyle = {
      zIndex: 1070,
      maxWidth: '200px',
      fontSize: '0.75rem',
      lineHeight: '1.2',
      opacity: isVisible ? 1 : 0,
      visibility: isVisible ? 'visible' : 'hidden' as const,
      transition: 'opacity 0.15s ease-in-out, visibility 0.15s ease-in-out',
      pointerEvents: 'none' as const,
    };

    switch (placement) {
      case 'top':
        return {
          ...baseStyle,
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translateX(-50%) translateY(-100%)',
        };
      case 'bottom':
        return {
          ...baseStyle,
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          ...baseStyle,
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translateX(-100%) translateY(-50%)',
        };
      case 'right':
        return {
          ...baseStyle,
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`btn btn-link btn-sm p-0 ms-1 ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        aria-label={ariaLabel}
        style={{ textDecoration: 'none' }}
      >
        <i className={iconClassName} aria-hidden="true"></i>
      </button>

      {/* Custom Tooltip */}
      <div
        className={getTooltipClasses()}
        style={getTooltipStyle()}
        role="tooltip"
      >
        {content}
        {/* Tooltip arrow */}
        <div
          className="position-absolute"
          style={{
            width: 0,
            height: 0,
            borderStyle: 'solid',
            ...(placement === 'top' && {
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '4px 4px 0 4px',
              borderColor: '#212529 transparent transparent transparent',
            }),
            ...(placement === 'bottom' && {
              top: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '0 4px 4px 4px',
              borderColor: 'transparent transparent #212529 transparent',
            }),
            ...(placement === 'left' && {
              right: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              borderWidth: '4px 0 4px 4px',
              borderColor: 'transparent transparent transparent #212529',
            }),
            ...(placement === 'right' && {
              left: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              borderWidth: '4px 4px 4px 0',
              borderColor: 'transparent #212529 transparent transparent',
            }),
          }}
        />
      </div>
    </>
  );
};

export default InfoTooltip;