import React, { useState } from 'react';
import logoSm from '../../assets/images/logo-sm.png';
import logoLight from '../../assets/images/logo-light.png';

interface SidebarProps {
  isVisible: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'ri-dashboard-2-line',
      path: '/'
    },
    {
      id: 'procesos',
      label: 'Gestión de Procesos',
      icon: 'ri-file-list-3-line',
      children: [
        { id: 'procesos-lista', label: 'Lista de Procesos', icon: 'ri-file-list-line', path: '/procesos' },
        { id: 'procesos-nuevo', label: 'Nuevo Proceso', icon: 'ri-file-add-line', path: '/procesos/nuevo' },
        { id: 'procesos-mapa', label: 'Mapa de Procesos', icon: 'ri-flow-chart', path: '/procesos/mapa' }
      ]
    },
    {
      id: 'normograma',
      label: 'Normograma',
      icon: 'ri-book-open-line',
      children: [
        { id: 'normograma-documentos', label: 'Documentos', icon: 'ri-folder-line', path: '/normograma' },
        { id: 'normograma-buscar', label: 'Búsqueda Avanzada', icon: 'ri-search-line', path: '/normograma/buscar' },
        { id: 'normograma-categorias', label: 'Categorías', icon: 'ri-folder-2-line', path: '/normograma/categorias' }
      ]
    },
    {
      id: 'auditorias',
      label: 'Auditorías',
      icon: 'ri-search-eye-line',
      children: [
        { id: 'auditorias-lista', label: 'Lista de Auditorías', icon: 'ri-file-list-2-line', path: '/auditorias' },
        { id: 'auditorias-nueva', label: 'Nueva Auditoría', icon: 'ri-add-circle-line', path: '/auditorias/nueva' },
        { id: 'auditorias-calendario', label: 'Calendario', icon: 'ri-calendar-line', path: '/auditorias/calendario' },
        { id: 'auditorias-hallazgos', label: 'Hallazgos', icon: 'ri-error-warning-line', path: '/auditorias/hallazgos' }
      ]
    },
    {
      id: 'indicadores',
      label: 'Indicadores de Gestión',
      icon: 'ri-line-chart-line',
      children: [
        { id: 'indicadores-dashboard', label: 'Dashboard KPIs', icon: 'ri-dashboard-line', path: '/indicadores' },
        { id: 'indicadores-lista', label: 'Lista de Indicadores', icon: 'ri-bar-chart-line', path: '/indicadores/lista' },
        { id: 'indicadores-reportes', label: 'Reportes', icon: 'ri-file-chart-line', path: '/indicadores/reportes' }
      ]
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: 'ri-settings-2-line',
      children: [
        { id: 'configuracion-usuarios', label: 'Usuarios', icon: 'ri-user-line', path: '/configuracion/usuarios' },
        { id: 'configuracion-roles', label: 'Roles y Permisos', icon: 'ri-shield-user-line', path: '/configuracion/roles' },
        { id: 'configuracion-sistema', label: 'Sistema', icon: 'ri-computer-line', path: '/configuracion/sistema' }
      ]
    }
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isExpanded = expandedMenus.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <li key={item.id} className={`nav-item ${level > 0 ? 'sub-menu-item' : ''}`}>
        <a
          className={`nav-link menu-link ${hasChildren ? 'collapsed' : ''} ${level > 0 ? 'sub-menu-link' : ''}`}
          href={item.path || '#'}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleMenu(item.id);
            }
          }}
        >
          <span className="nav-icon">
            <i className={item.icon}></i>
          </span>
          <span className="nav-text">{item.label}</span>
          {hasChildren && (
            <span className="menu-arrow">
              <i className={`ri-arrow-${isExpanded ? 'down' : 'right'}-s-line`}></i>
            </span>
          )}
        </a>

        {hasChildren && isExpanded && (
          <div className="collapse show">
            <ul className="nav nav-sm flex-column">
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </ul>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className={`app-menu navbar-menu ${isVisible ? 'show' : ''}`}>
      {/* Logo */}
      <div className="navbar-brand-box">
        <a href="/" className="logo logo-light">
          <span className="logo-sm">
            <img src={logoSm} alt="Logo" height="22" />
          </span>
          <span className="logo-lg">
            <img src={logoLight} alt="Logo" height="17" />
          </span>
        </a>
      </div>

      {/* Menu */}
      <div id="scrollbar">
        <div className="container-fluid">
          <div id="two-column-menu"></div>
          <ul className="navbar-nav" id="navbar-nav">
            <li className="menu-title">
              <span>MENU PRINCIPAL</span>
            </li>
            {menuItems.slice(0, 1).map(item => renderMenuItem(item))}
            
            <li className="menu-title">
              <span>GESTIÓN</span>
            </li>
            {menuItems.slice(1, 4).map(item => renderMenuItem(item))}
            
            <li className="menu-title">
              <span>REPORTES & ANÁLISIS</span>
            </li>
            {menuItems.slice(4, 5).map(item => renderMenuItem(item))}
            
            <li className="menu-title">
              <span>ADMINISTRACIÓN</span>
            </li>
            {menuItems.slice(5).map(item => renderMenuItem(item))}
          </ul>
        </div>
      </div>

      {/* Sidebar Background */}
      <div className="sidebar-background"></div>
    </div>
  );
};

export default Sidebar;