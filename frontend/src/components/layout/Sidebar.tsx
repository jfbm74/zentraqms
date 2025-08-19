import React, { useEffect } from "react";
import { Link } from "../../utils/SimpleRouter";
import VerticalLayout from "./VerticalLayout.tsx";
//import logo
import zentraLogo from "../../assets/images/Logo-Texto-Horizontl-blanco-recortado.png";

interface SidebarProps {
  layoutType?: string;
  isVisible?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ layoutType = "vertical", isVisible = true }) => {

  useEffect(() => {
    const verticalOverlay = document.getElementsByClassName("vertical-overlay");
    if (verticalOverlay) {
      verticalOverlay[0]?.addEventListener("click", function () {
        document.body.classList.remove("vertical-sidebar-enable");
      });
    }
  });


  const addEventListenerOnSmHoverMenu = () => {
    // add listener Sidebar Hover icon on change layout from setting
    if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover-active');
    } else if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover-active') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    } else {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    }
  };


  return (
    <React.Fragment>
      <div className={`app-menu navbar-menu ${isVisible ? 'show' : ''}`}>
        <div className="navbar-brand-box">
          <Link to="/" className="logo">
            <span className="logo-lg">
              <img 
                src={zentraLogo} 
                alt="ZentraQMS" 
                style={{ 
                  height: '40px',
                  maxWidth: '200px',
                  objectFit: 'contain'
                }} 
              />
            </span>
            <span className="logo-sm">
              <img 
                src={zentraLogo} 
                alt="ZentraQMS" 
                style={{ 
                  height: '30px',
                  maxWidth: '60px',
                  objectFit: 'contain'
                }} 
              />
            </span>
          </Link>
          <button
            onClick={addEventListenerOnSmHoverMenu}
            type="button"
            className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover"
            id="vertical-hover"
          >
            <i className="ri-record-circle-line"></i>
          </button>
        </div>

        
        {layoutType === "horizontal" ? (
          <div id="scrollbar">
            <div className="container-fluid">
              <div id="two-column-menu"></div>
              <ul className="navbar-nav" id="navbar-nav">
                {/* HorizontalLayout would go here */}
              </ul>
            </div>
          </div>
        ) : (
          <React.Fragment>
            <div id="scrollbar" className="h-100" style={{ overflow: 'auto' }}>
              <div className="container-fluid">
                <div id="two-column-menu"></div>
                <ul className="navbar-nav" id="navbar-nav">
                  <VerticalLayout layoutType={layoutType} />
                </ul>
              </div>
            </div>
            <div className="sidebar-background"></div>
          </React.Fragment>
        )}
      </div>
      <div className="vertical-overlay"></div>
    </React.Fragment>
  );
};

export default Sidebar;
