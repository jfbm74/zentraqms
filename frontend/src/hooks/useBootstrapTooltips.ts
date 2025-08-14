/**
 * Custom hook for Bootstrap tooltip management
 * 
 * This hook initializes and manages Bootstrap tooltips for components
 * ensuring proper cleanup and re-initialization when needed.
 */

import { useEffect, useRef } from 'react';

// Declare Bootstrap types
declare global {
  interface Window {
    bootstrap: any;
  }
}

interface TooltipOptions {
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: string;
  delay?: { show: number; hide: number };
  html?: boolean;
  animation?: boolean;
}

export const useBootstrapTooltips = (
  dependencies: any[] = [],
  options: TooltipOptions = {}
) => {
  const tooltipInstancesRef = useRef<any[]>([]);

  const defaultOptions = {
    placement: 'top',
    trigger: 'hover focus',
    delay: { show: 300, hide: 100 },
    html: false,
    animation: true,
    ...options,
  };

  useEffect(() => {
    const initializeTooltips = () => {
      // Dispose existing tooltips first
      tooltipInstancesRef.current.forEach((instance) => {
        if (instance && instance.dispose) {
          instance.dispose();
        }
      });
      tooltipInstancesRef.current = [];

      // Check if Bootstrap is available
      if (
        typeof window !== 'undefined' &&
        window.bootstrap &&
        window.bootstrap.Tooltip
      ) {
        // Find all tooltip triggers
        const tooltipTriggerList = document.querySelectorAll(
          '[data-bs-toggle="tooltip"]'
        );

        // Initialize each tooltip
        tooltipTriggerList.forEach((tooltipTriggerEl) => {
          // Dispose existing tooltip if any
          const existingTooltip =
            window.bootstrap.Tooltip.getInstance(tooltipTriggerEl);
          if (existingTooltip) {
            existingTooltip.dispose();
          }

          // Create new tooltip
          const newTooltip = new window.bootstrap.Tooltip(
            tooltipTriggerEl,
            defaultOptions
          );

          // Store reference for cleanup
          tooltipInstancesRef.current.push(newTooltip);
        });

        console.log(
          `✅ Initialized ${tooltipInstancesRef.current.length} tooltips`
        );
      } else {
        console.warn(
          '⚠️ Bootstrap is not available. Tooltips will not work.'
        );
      }
    };

    // Initialize tooltips after a short delay to ensure DOM is ready
    const timer = setTimeout(initializeTooltips, 200);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      
      // Dispose all tooltip instances
      tooltipInstancesRef.current.forEach((instance) => {
        if (instance && instance.dispose) {
          try {
            instance.dispose();
          } catch (error) {
            console.warn('Error disposing tooltip:', error);
          }
        }
      });
      tooltipInstancesRef.current = [];
    };
  }, dependencies);

  // Return utility functions
  return {
    reinitialize: () => {
      // Force re-initialization of tooltips
      setTimeout(() => {
        const event = new CustomEvent('tooltip-reinit');
        window.dispatchEvent(event);
      }, 100);
    },
    dispose: () => {
      tooltipInstancesRef.current.forEach((instance) => {
        if (instance && instance.dispose) {
          instance.dispose();
        }
      });
      tooltipInstancesRef.current = [];
    },
  };
};

export default useBootstrapTooltips;