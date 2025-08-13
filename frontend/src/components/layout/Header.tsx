import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

// Import images from Velzon template
import avatar1 from '../../assets/images/users/avatar-1.jpg';
import colombiaFlag from '../../assets/images/flags/co.svg';
import logoSm from '../../assets/images/logo-sm.png';

interface HeaderProps {
  headerClass: string;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ headerClass, onToggleSidebar }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  
  // Authentication hook
  const { user, logout, getUserDisplayName } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Handle logout functionality
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setActiveDropdown(null); // Close dropdown
      await logout();
      toast.success('Sesión cerrada correctamente. ¡Hasta luego!');
    } catch (error) {
      console.error('Error durante logout:', error);
      toast.error('Error al cerrar sesión. Intenta nuevamente.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header id="page-topbar" className={headerClass} ref={headerRef}>
      <div className="navbar-header">
        {/* Hamburger Menu */}
        <div className="d-flex align-items-center">
          <button 
            className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
            onClick={onToggleSidebar}
          >
            <i className="ri-menu-2-line hamburger-icon"></i>
          </button>

          {/* Company Logo - Replace src with actual company logo */}
          <div className="navbar-brand-box d-lg-none d-md-block">
            <a href="/" className="logo logo-dark d-flex align-items-center text-decoration-none">
              <img 
                src={logoSm} 
                alt="Logo" 
                height="34"
                className="ms-3 company-logo"
              />
              <span className="ms-2 fw-semibold text-primary d-none d-sm-inline-block company-name">ZentraQMS</span>
            </a>
          </div>

          {/* Search Form */}
          <form className="app-search d-none d-md-block ms-3">
            <div className="position-relative">
              <input
                id="header-search"
                name="search"
                type="text"
                className="form-control"
                placeholder="Buscar..."
                autoComplete="off"
              />
              <span className="ri-search-line search-widget-icon"></span>
            </div>
          </form>
        </div>

        <div className="d-flex align-items-center">
          {/* Language Selector */}
          <div className="dropdown ms-1 topbar-head-dropdown header-item">
            <button
              type="button"
              className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
              data-bs-toggle="dropdown"
            >
              <img
                src={colombiaFlag}
                alt="Colombia"
                height="16"
                className="rounded"
              />
            </button>
          </div>

          {/* Apps Grid */}
          <div className="dropdown ms-1 topbar-head-dropdown header-item position-relative">
            <button
              type="button"
              className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
              onClick={() => toggleDropdown('apps')}
            >
              <i className="ri-apps-2-line"></i>
            </button>
            {activeDropdown === 'apps' && (
              <div className="dropdown-menu dropdown-menu-lg dropdown-menu-end show">
                <div className="p-3 border-bottom">
                  <h6 className="m-0">Acceso Rápido</h6>
                </div>
                <div className="p-2">
                  <div className="row g-0">
                    <div className="col">
                      <a className="dropdown-icon-item" href="#">
                        <i className="ri-file-list-3-line"></i>
                        <span>Procesos</span>
                      </a>
                    </div>
                    <div className="col">
                      <a className="dropdown-icon-item" href="#">
                        <i className="ri-search-eye-line"></i>
                        <span>Auditorías</span>
                      </a>
                    </div>
                    <div className="col">
                      <a className="dropdown-icon-item" href="#">
                        <i className="ri-line-chart-line"></i>
                        <span>KPIs</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <div className="ms-1 header-item d-none d-sm-flex">
            <button
              type="button"
              className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
              }}
            >
              <i className="ri-fullscreen-line"></i>
            </button>
          </div>

          {/* Dark Mode */}
          <div className="ms-1 header-item d-none d-sm-flex">
            <button
              type="button"
              className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
              onClick={() => setDarkMode(!darkMode)}
            >
              <i className={darkMode ? "ri-sun-line" : "ri-moon-line"}></i>
            </button>
          </div>

          {/* Notifications */}
          <div className="dropdown ms-1 topbar-head-dropdown header-item position-relative">
            <button
              type="button"
              className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle position-relative"
              onClick={() => toggleDropdown('notifications')}
            >
              <i className="ri-notification-2-line"></i>
              <span className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">
                3
                <span className="visually-hidden">unread messages</span>
              </span>
            </button>
            
            {activeDropdown === 'notifications' && (
              <div className="dropdown-menu dropdown-menu-lg dropdown-menu-end p-0 show notification-dropdown">
                <div className="dropdown-head bg-primary bg-pattern rounded-top">
                  <div className="p-3">
                    <div className="row align-items-center">
                      <div className="col">
                        <h6 className="m-0 fs-16 fw-semibold text-white">Notificaciones</h6>
                      </div>
                      <div className="col-auto">
                        <span className="badge bg-light-subtle text-body fs-13">3 nuevas</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tab-content">
                  <div className="w-100 pt-3 px-3">
                    <a href="#" className="text-reset notification-item d-block">
                      <div className="d-flex">
                        <div className="avatar-xs me-3">
                          <span className="avatar-title bg-info-subtle text-info rounded-circle fs-16">
                            <i className="ri-checkbox-circle-line"></i>
                          </span>
                        </div>
                        <div className="flex-1">
                          <h6 className="mb-1">Auditoría Completada</h6>
                          <div className="fs-12 text-muted">
                            <p className="mb-1">Se completó la auditoría del proceso de compras</p>
                            <p className="mb-0"><i className="ri-time-line align-middle"></i> Hace 30 min</p>
                          </div>
                        </div>
                      </div>
                    </a>
                    <a href="#" className="text-reset notification-item d-block">
                      <div className="d-flex">
                        <div className="avatar-xs me-3">
                          <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-16">
                            <i className="ri-error-warning-line"></i>
                          </span>
                        </div>
                        <div className="flex-1">
                          <h6 className="mb-1">KPI Fuera de Rango</h6>
                          <div className="fs-12 text-muted">
                            <p className="mb-1">El indicador de satisfacción bajó a 75%</p>
                            <p className="mb-0"><i className="ri-time-line align-middle"></i> Hace 2 horas</p>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                  <div className="p-2 border-top">
                    <a className="btn btn-sm btn-link font-size-14 text-center w-100" href="#">
                      Ver todas las notificaciones
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="dropdown ms-sm-3 header-item topbar-user">
            <button
              type="button"
              className="btn d-flex align-items-center"
              onClick={() => toggleDropdown('user')}
            >
              <img
                className="rounded-circle header-profile-user"
                src={avatar1}
                alt="Header Avatar"
              />
              <span className="d-none d-xl-inline-block ms-2 fw-medium">
                {user ? getUserDisplayName() : 'Usuario'}
              </span>
              <i className="ri-arrow-down-s-line d-none d-xl-inline-block ms-1"></i>
            </button>
            
            {activeDropdown === 'user' && (
              <div className="dropdown-menu dropdown-menu-end show">
                <h6 className="dropdown-header">
                  ¡Bienvenido, {user ? getUserDisplayName() : 'Usuario'}!
                </h6>
                <a className="dropdown-item" href="#profile">
                  <i className="ri-user-line text-muted fs-16 align-middle me-2"></i>
                  <span className="align-middle">Mi Perfil</span>
                </a>
                <a className="dropdown-item" href="#messages">
                  <i className="ri-message-2-line text-muted fs-16 align-middle me-2"></i>
                  <span className="align-middle">Mensajes</span>
                  <span className="badge bg-success-subtle text-success ms-auto">3</span>
                </a>
                <a className="dropdown-item" href="#settings">
                  <i className="ri-settings-2-line text-muted fs-16 align-middle me-2"></i>
                  <span className="align-middle">Configuración</span>
                </a>
                <a className="dropdown-item" href="#lock">
                  <i className="ri-lock-password-line text-muted fs-16 align-middle me-2"></i>
                  <span className="align-middle">Bloquear Pantalla</span>
                </a>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item border-0 bg-transparent w-100 text-start"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <div className="d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm text-muted me-2" role="status">
                        <span className="visually-hidden">Cerrando sesión...</span>
                      </div>
                      <span className="align-middle">Cerrando Sesión...</span>
                    </div>
                  ) : (
                    <>
                      <i className="ri-logout-circle-line text-muted fs-16 align-middle me-2"></i>
                      <span className="align-middle">Cerrar Sesión</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;