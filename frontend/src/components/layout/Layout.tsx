import React, { useEffect, useState } from 'react';

// Import Components
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [headerClass, setHeaderClass] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(true);

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
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <React.Fragment>
      <div id="layout-wrapper" className={`${!sidebarVisible ? 'sidebar-collapsed' : ''}`}>
        <Header
          headerClass={headerClass}
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar
          isVisible={sidebarVisible}
        />
        <div className="main-content">
          <div className="page-content">
            <div className="container-fluid">
              {children}
            </div>
          </div>
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