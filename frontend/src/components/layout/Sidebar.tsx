import React, { useEffect, useState, useRef } from "react";
import { Link } from "../../utils/SimpleRouter";
import { useAuth } from "../../hooks/useAuth";
import VerticalLayout from "./VerticalLayout.tsx";
//import logo
import logoSm from "../../assets/images/logo-sm.png";
import logoDark from "../../assets/images/logo-dark.png";
import logoLight from "../../assets/images/logo-light.png";
import avatar1 from "../../assets/images/users/avatar-1.jpg";

interface SidebarProps {
  layoutType?: string;
  isVisible?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ layoutType = "vertical", isVisible = true }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const verticalOverlay = document.getElementsByClassName("vertical-overlay");
    if (verticalOverlay) {
      verticalOverlay[0]?.addEventListener("click", function () {
        document.body.classList.remove("vertical-sidebar-enable");
      });
    }
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleLogout = async () => {
    await logout();
  };

  return (
    <React.Fragment>
      <div className={`app-menu navbar-menu ${isVisible ? 'show' : ''}`}>
        <div className="navbar-brand-box">
          <Link to="/" className="logo logo-dark">
            <span className="logo-sm">
              <img src={logoSm} alt="" height="22" />
            </span>
            <span className="logo-lg">
              <img src={logoDark} alt="" height="17" />
            </span>
          </Link>

          <Link to="/" className="logo logo-light">
            <span className="logo-sm">
              <img src={logoSm} alt="" height="22" />
            </span>
            <span className="logo-lg">
              <img src={logoLight} alt="" height="17" />
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

        <div className="sidebar-user m-1 rounded" ref={dropdownRef}>
          <button 
            type="button" 
            className="btn material-shadow-none" 
            id="page-header-user-dropdown"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="d-flex align-items-center gap-2">
              <img 
                className="rounded header-profile-user" 
                src={avatar1} 
                alt="Header Avatar" 
              />
              <span className="text-start">
                <span className="d-block fw-medium sidebar-user-name-text">
                  {user?.first_name || user?.email || 'Usuario'}
                </span>
                <span className="d-block fs-14 sidebar-user-name-sub-text">
                  <i className="ri ri-circle-fill fs-10 text-success align-baseline"></i> 
                  <span className="align-middle">En línea</span>
                </span>
              </span>
            </span>
          </button>
          {dropdownOpen && (
            <div className="dropdown-menu dropdown-menu-end show">
              <h6 className="dropdown-header">¡Bienvenido {user?.first_name || 'Usuario'}!</h6>
              <Link className="dropdown-item" to="/perfil" onClick={() => setDropdownOpen(false)}>
                <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i> 
                <span className="align-middle">Perfil</span>
              </Link>
              <Link className="dropdown-item" to="/organizacion/perfil" onClick={() => setDropdownOpen(false)}>
                <i className="mdi mdi-building text-muted fs-16 align-middle me-1"></i> 
                <span className="align-middle">Mi Organización</span>
              </Link>
              <Link className="dropdown-item" to="/configuracion" onClick={() => setDropdownOpen(false)}>
                <i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i> 
                <span className="align-middle">Configuración</span>
              </Link>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item" 
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
              >
                <i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> 
                <span className="align-middle">Cerrar Sesión</span>
              </button>
            </div>
          )}
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
