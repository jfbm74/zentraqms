import React, { useState, useEffect, useRef } from 'react';
import { Link } from '../../utils/SimpleRouter';

interface SubHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

interface SOGCSTabChild {
  id: string;
  label: string;
  href: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'secondary';
  };
}

interface SOGCSTab {
  id: string;
  label: string;
  icon: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'secondary';
    count?: number;
  };
  href?: string;
  children?: SOGCSTabChild[];
}

const SubHeader: React.FC<SubHeaderProps> = ({ 
  activeTab = 'dashboard'
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);
  const currentTab = activeTab;

  // Configuración específica para módulo SOGCS con estructura padre/hijo
  const sogcsTabs: SOGCSTab[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'ri-dashboard-3-line',
      href: '/sogcs/dashboard'
    },
    {
      id: 'calendar',
      label: 'Calendario',
      icon: 'ri-calendar-line',
      badge: { text: '3', variant: 'warning', count: 3 },
      href: '/sogcs/calendar'
    },
    {
      id: 'suh',
      label: 'SUH',
      icon: 'ri-hospital-line',
      badge: { text: '92.5%', variant: 'success' },
      children: [
        { id: 'suh-habilitacion', label: 'Habilitación', href: '/sogcs/suh/habilitacion' },
        { id: 'suh-infraestructura', label: 'Infraestructura', href: '/sogcs/suh/infraestructura' },
        { id: 'suh-dotacion', label: 'Dotación', href: '/sogcs/suh/dotacion' },
        { id: 'suh-talento-humano', label: 'Talento Humano', href: '/sogcs/suh/talento-humano' }
      ]
    },
    {
      id: 'pamec',
      label: 'PAMEC',
      icon: 'ri-shield-check-line',
      badge: { text: '78.3%', variant: 'warning' },
      children: [
        { id: 'pamec-programa', label: 'Programa', href: '/sogcs/pamec/programa' },
        { id: 'pamec-eventos', label: 'Eventos Adversos', href: '/sogcs/pamec/eventos', badge: { text: '5', variant: 'danger' } },
        { id: 'pamec-mejoramiento', label: 'Mejoramiento', href: '/sogcs/pamec/mejoramiento' },
        { id: 'pamec-seguridad', label: 'Seguridad del Paciente', href: '/sogcs/pamec/seguridad' }
      ]
    },
    {
      id: 'sic',
      label: 'SIC',
      icon: 'ri-bar-chart-line',
      badge: { text: '95.1%', variant: 'success' },
      children: [
        { id: 'sic-indicadores', label: 'Indicadores', href: '/sogcs/sic/indicadores' },
        { id: 'sic-reportes', label: 'Reportes', href: '/sogcs/sic/reportes' },
        { id: 'sic-tableros', label: 'Tableros', href: '/sogcs/sic/tableros' }
      ]
    },
    {
      id: 'sua',
      label: 'SUA',
      icon: 'ri-award-line',
      badge: { text: '45.7%', variant: 'danger' },
      children: [
        { id: 'sua-atencion', label: 'Atención al Usuario', href: '/sogcs/sua/atencion' },
        { id: 'sua-participacion', label: 'Participación Social', href: '/sogcs/sua/participacion' },
        { id: 'sua-satisfaccion', label: 'Satisfacción', href: '/sogcs/sua/satisfaccion', badge: { text: '2', variant: 'warning' } }
      ]
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: 'ri-settings-3-line',
      children: [
        { id: 'configuracion-sedes', label: 'Sedes', href: '/sogcs/configuracion/sedes' },
        { id: 'configuracion-servicios', label: 'Servicios', href: '/sogcs/configuracion/servicios' }
      ]
    }
  ];

  // Función para recalcular posición del dropdown
  const recalculatePosition = () => {
    if (activeButtonRef.current) {
      const rect = activeButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
  };

  // Efecto para recalcular posición cuando cambia el layout y cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (openDropdown) {
      const handleResize = () => {
        setTimeout(recalculatePosition, 300); // Delay más largo para la animación del sidebar
      };

      const handleClickOutside = (event: MouseEvent) => {
        if (activeButtonRef.current && !activeButtonRef.current.contains(event.target as Node)) {
          const dropdownElement = document.querySelector('.dropdown-menu.show');
          if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
            setOpenDropdown(null);
          }
        }
      };

      // Listeners para cambios de layout
      window.addEventListener('resize', handleResize);
      document.addEventListener('click', handleClickOutside);
      
      // Observer más específico para detectar cambios en el sidebar
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const target = mutation.target as Element;
            // Detectar cambios en clases relacionadas con sidebar
            if (target.classList.contains('vertical-collpsed') || 
                target.classList.contains('sidebar-enable') ||
                target.id === 'layout-wrapper' ||
                target.classList.contains('navbar-menu')) {
              setTimeout(recalculatePosition, 300);
            }
          }
        });
      });
      
      observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['class'],
        subtree: true 
      });

      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('click', handleClickOutside);
        observer.disconnect();
      };
    }
  }, [openDropdown]);

  const toggleDropdown = (tabId: string, event?: React.MouseEvent) => {
    if (event && event.currentTarget) {
      activeButtonRef.current = event.currentTarget as HTMLButtonElement;
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
    setOpenDropdown(openDropdown === tabId ? null : tabId);
  };

  const handleItemClick = (tab: SOGCSTab, event?: React.MouseEvent) => {
    if (tab.children) {
      toggleDropdown(tab.id, event);
    } else if (tab.href) {
      // Navigate to simple link
      setOpenDropdown(null);
    }
  };

  return (
    <div className="navbar-menu">
      <div className="container-fluid">
        <div className="navbar-nav-scroll">
          <ul className="navbar-nav" id="navbar-nav">
            {/* Tabs de navegación principales */}
            {sogcsTabs.map((tab) => (
              <li key={tab.id} className={`nav-item ${tab.children ? 'dropdown' : ''}`} style={{position: 'relative'}}>
                {tab.children ? (
                  // Item padre con hijos (dropdown)
                  <>
                    <button
                      type="button"
                      className={`nav-link ${currentTab === tab.id ? 'active' : ''} ${openDropdown === tab.id ? 'show' : ''}`}
                      onClick={(e) => handleItemClick(tab, e)}
                    >
                      <i className={tab.icon}></i>
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className={`badge bg-${tab.badge.variant}-subtle`}>
                          {tab.badge.text}
                        </span>
                      )}
                      <i className="dropdown-arrow ri-arrow-down-s-line"></i>
                    </button>
                    <ul className={`dropdown-menu ${openDropdown === tab.id ? 'show' : ''}`} style={{
                      backgroundColor: 'white', 
                      border: '1px solid #dee2e6', 
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      display: openDropdown === tab.id ? 'block' : 'none',
                      position: 'fixed',
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      zIndex: 9999,
                      minWidth: '180px',
                      padding: '8px 0',
                      borderRadius: '4px'
                    }}>
                      {tab.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            to={child.href}
                            className="dropdown-item"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {child.label}
                            {child.badge && (
                              <span className={`badge bg-${child.badge.variant}-subtle ms-2`}>
                                {child.badge.text}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  // Item simple (sin hijos)
                  <Link
                    to={tab.href!}
                    className={`nav-link ${currentTab === tab.id ? 'active' : ''}`}
                  >
                    <i className={tab.icon}></i>
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`badge bg-${tab.badge.variant}-subtle`}>
                        {tab.badge.text}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubHeader;