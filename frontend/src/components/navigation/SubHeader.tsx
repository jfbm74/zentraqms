import React, { useState, useEffect, useRef } from 'react';
import { Link } from '../../utils/SimpleRouter';
import './SubHeader.css';

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

  // Efecto para manejar clic fuera y cerrar dropdown
  useEffect(() => {
    if (openDropdown) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        
        // Buscar el contenedor del SubHeader y los dropdowns
        const subheaderContainer = document.querySelector('.sogcs-subheader');
        const dropdownMenu = document.querySelector('.sogcs-dropdown-menu');
        
        // Verificar si el clic fue dentro del SubHeader o dentro de un dropdown
        const clickedInSubheader = subheaderContainer && subheaderContainer.contains(target);
        const clickedInDropdown = dropdownMenu && dropdownMenu.contains(target);
        
        // Si el clic fue fuera del SubHeader y fuera de cualquier dropdown, cerrar
        if (!clickedInSubheader && !clickedInDropdown) {
          setOpenDropdown(null);
        }
      };

      const handleResize = () => {
        setTimeout(recalculatePosition, 300); // Delay más largo para la animación del sidebar
      };

      // Agregar listeners
      document.addEventListener('mousedown', handleClickOutside); // mousedown es mejor que click
      window.addEventListener('resize', handleResize);
      
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
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
      };
    }
  }, [openDropdown]);

  // Efecto separado para manejar la visibilidad del componente cuando cambia el sidebar
  useEffect(() => {
    const handleSidebarChange = () => {
      // Forzar re-render del componente cuando cambia el sidebar
      const subheaderElement = document.querySelector('.navbar-menu');
      if (subheaderElement) {
        // Trigger reflow para asegurar que el componente se renderice correctamente
        subheaderElement.style.display = 'none';
        subheaderElement.offsetHeight; // Force reflow
        subheaderElement.style.display = '';
      }
    };

    // Observer para cambios en el sidebar que afectan la visibilidad del subheader
    const sidebarObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as Element;
          if (target.classList.contains('vertical-collpsed') || 
              target.classList.contains('sidebar-enable') ||
              target.id === 'layout-wrapper') {
            setTimeout(handleSidebarChange, 350); // Después de la animación del sidebar
          }
        }
      });
    });
    
    sidebarObserver.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'],
      subtree: true 
    });

    return () => {
      sidebarObserver.disconnect();
    };
  }, []); // Solo se ejecuta una vez al montar el componente

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

  // Debug: verificar que llegamos al render
  console.log('🔍 SubHeader rendering with', sogcsTabs.length, 'tabs');
  console.log('🔍 All tabs:', sogcsTabs.map(t => `${t.id}: ${t.label}`));

  return (
    <div style={{ 
      width: '100%', 
      backgroundColor: '#f8f9fa',
      padding: '8px 16px',
      borderBottom: '1px solid #dee2e6'
    }}>
      <div style={{ 
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch'
      }}>
        {sogcsTabs.map((tab) => (
          tab.children ? (
            // Tab con dropdown
            <div key={tab.id} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={(e) => handleItemClick(tab, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  backgroundColor: currentTab === tab.id ? '#0d6efd' : '#ffffff',
                  color: currentTab === tab.id ? '#ffffff' : '#495057',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content'
                }}
                onMouseOver={(e) => {
                  if (currentTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#e9ecef';
                  }
                }}
                onMouseOut={(e) => {
                  if (currentTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                <i className={tab.icon} style={{ fontSize: '16px' }}></i>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    backgroundColor: tab.badge.variant === 'success' ? '#198754' : 
                                   tab.badge.variant === 'warning' ? '#fd7e14' : 
                                   tab.badge.variant === 'danger' ? '#dc3545' : '#6c757d',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {tab.badge.text}
                  </span>
                )}
                <i className="ri-arrow-down-s-line" style={{ fontSize: '16px' }}></i>
              </button>
              
              {/* Dropdown menu */}
              {openDropdown === tab.id && (
                <ul 
                  className="sogcs-dropdown-menu"
                  style={{
                    position: 'fixed',
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    backgroundColor: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    zIndex: 9999,
                    minWidth: '200px',
                    padding: '8px 0',
                    margin: 0,
                    listStyle: 'none'
                  }}>
                  {tab.children.map((child) => (
                    <li key={child.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          window.location.href = child.href;
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '10px 16px',
                          backgroundColor: 'transparent',
                          color: '#495057',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'left'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f1f3f4';
                          e.currentTarget.style.color = '#1f2937';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#495057';
                        }}
                      >
                        {child.label}
                        {child.badge && (
                          <span style={{
                            backgroundColor: child.badge.variant === 'success' ? '#198754' : 
                                           child.badge.variant === 'warning' ? '#fd7e14' : 
                                           child.badge.variant === 'danger' ? '#dc3545' : '#6c757d',
                            color: '#ffffff',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '600',
                            marginLeft: 'auto'
                          }}>
                            {child.badge.text}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            // Tab simple
            <div key={tab.id} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => {
                  // Navigate manually using window.location
                  window.location.href = tab.href!;
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  backgroundColor: currentTab === tab.id ? '#0d6efd' : '#ffffff',
                  color: currentTab === tab.id ? '#ffffff' : '#495057',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  minWidth: 'fit-content'
                }}
                onMouseOver={(e) => {
                  if (currentTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#e9ecef';
                  }
                }}
                onMouseOut={(e) => {
                  if (currentTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }
                }}
              >
              <i className={tab.icon} style={{ fontSize: '16px' }}></i>
              <span>{tab.label}</span>
              {tab.badge && (
                <span style={{
                  backgroundColor: tab.badge.variant === 'success' ? '#198754' : 
                                 tab.badge.variant === 'warning' ? '#fd7e14' : 
                                 tab.badge.variant === 'danger' ? '#dc3545' : '#6c757d',
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {tab.badge.text}
                </span>
              )}
              </button>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default SubHeader;