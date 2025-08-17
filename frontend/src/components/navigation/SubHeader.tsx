import React, { useState } from 'react';
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
    }
  ];

  const toggleDropdown = (tabId: string) => {
    setOpenDropdown(openDropdown === tabId ? null : tabId);
  };

  const handleItemClick = (tab: SOGCSTab) => {
    if (tab.children) {
      toggleDropdown(tab.id);
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
              <li key={tab.id} className={`nav-item ${tab.children ? 'dropdown' : ''}`}>
                {tab.children ? (
                  // Item padre con hijos (dropdown)
                  <>
                    <button
                      type="button"
                      className={`nav-link ${currentTab === tab.id ? 'active' : ''} ${openDropdown === tab.id ? 'show' : ''}`}
                      onClick={() => handleItemClick(tab)}
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
                    <ul className={`dropdown-menu ${openDropdown === tab.id ? 'show' : ''}`}>
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