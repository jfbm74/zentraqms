import React, { useEffect, useState, useRef, useCallback } from "react";

// Import Components
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [headerClass, setHeaderClass] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isAutoCollapseActive, setIsAutoCollapseActive] = useState(false);
  const autoCollapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Auto-collapse logic
  const startAutoCollapseTimer = useCallback(() => {
    // Clear existing timer
    if (autoCollapseTimeoutRef.current) {
      clearTimeout(autoCollapseTimeoutRef.current);
    }

    setIsAutoCollapseActive(true);
    
    // Set new timer for 10 seconds
    autoCollapseTimeoutRef.current = setTimeout(() => {
      setSidebarVisible(false);
      setIsAutoCollapseActive(false);
    }, 10000); // 10 seconds
  }, []);

  const cancelAutoCollapseTimer = useCallback(() => {
    if (autoCollapseTimeoutRef.current) {
      clearTimeout(autoCollapseTimeoutRef.current);
      autoCollapseTimeoutRef.current = null;
    }
    setIsAutoCollapseActive(false);
  }, []);

  // Handle mouse events for sidebar
  const handleSidebarMouseEnter = useCallback(() => {
    // Always show on hover, regardless of current state
    setSidebarVisible(true);
    cancelAutoCollapseTimer(); // Cancel timer while hovering
  }, [cancelAutoCollapseTimer]);

  const handleSidebarMouseLeave = useCallback(() => {
    // Start timer when mouse leaves
    startAutoCollapseTimer();
  }, [startAutoCollapseTimer]);

  // Start initial auto-collapse timer
  useEffect(() => {
    startAutoCollapseTimer();
    
    return () => {
      cancelAutoCollapseTimer();
    };
  }, [startAutoCollapseTimer, cancelAutoCollapseTimer]);

  // Add scroll effect to header
  useEffect(() => {
    const scrollNavigation = () => {
      const scrollup = document.documentElement.scrollTop;
      if (scrollup > 50) {
        setHeaderClass("topbar-shadow");
      } else {
        setHeaderClass("");
      }
    };

    window.addEventListener("scroll", scrollNavigation, true);
    return () => window.removeEventListener("scroll", scrollNavigation, true);
  }, []);

  const toggleSidebar = () => {
    const newVisibility = !sidebarVisible;
    setSidebarVisible(newVisibility);
    
    // If manually expanded, restart the timer
    if (newVisibility) {
      startAutoCollapseTimer();
    } else {
      cancelAutoCollapseTimer();
    }
  };

  return (
    <React.Fragment>
      <div
        id="layout-wrapper"
        className={`${!sidebarVisible ? "sidebar-collapsed" : ""}`}
      >
        <Header headerClass={headerClass} onToggleSidebar={toggleSidebar} />
        <div
          ref={sidebarRef}
          style={{
            position: 'relative',
            width: sidebarVisible ? 'var(--vz-vertical-menu-width)' : 'var(--vz-vertical-menu-width-sm)',
            transition: 'all 0.3s ease',
            zIndex: 1002,
          }}
        >
          <Sidebar isVisible={sidebarVisible} />
          {/* Hover detection zone when collapsed */}
          {!sidebarVisible && (
            <div
              onMouseEnter={handleSidebarMouseEnter}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '80px', // Wider hover area
                height: '100vh',
                backgroundColor: 'transparent',
                zIndex: 1003,
                cursor: 'pointer'
              }}
            />
          )}
          {/* Main sidebar area */}
          <div
            onMouseEnter={handleSidebarMouseEnter}
            onMouseLeave={handleSidebarMouseLeave}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: sidebarVisible ? 1002 : 1001,
            }}
          />
        </div>
        <div className="main-content">
          {children}
          <Footer />
        </div>
        {/* Overlay for mobile */}
        {sidebarVisible && (
          <div
            className="vertical-overlay d-block d-lg-none"
            onClick={toggleSidebar}
          ></div>
        )}
      </div>
    </React.Fragment>
  );
};

export default Layout;
