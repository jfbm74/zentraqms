import React, { useState, useMemo } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionGate } from '../common/PermissionGate';
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
  // RBAC fields (Phase 5)
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAllPermissions?: string[];
  requireAllRoles?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const { getUserCapabilities } = usePermissions();

  // Get user capabilities for dynamic menu generation
  const capabilities = getUserCapabilities();

  /**
   * Define menu structure with RBAC permissions
   */
  const allMenuItems: MenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'ri-dashboard-2-line',
      path: '/'
      // Dashboard is accessible to all authenticated users
    },
    {
      id: 'procesos',
      label: 'Gestión de Procesos',
      icon: 'ri-file-list-3-line',
      permissions: ['processes.read', 'processes.*'],
      children: [
        { 
          id: 'procesos-lista', 
          label: 'Lista de Procesos', 
          icon: 'ri-file-list-line', 
          path: '/procesos',
          permissions: ['processes.read', 'processes.*']
        },
        { 
          id: 'procesos-nuevo', 
          label: 'Nuevo Proceso', 
          icon: 'ri-file-add-line', 
          path: '/procesos/nuevo',
          permissions: ['processes.create', 'processes.*']
        },
        { 
          id: 'procesos-mapa', 
          label: 'Mapa de Procesos', 
          icon: 'ri-flow-chart', 
          path: '/procesos/mapa',
          permissions: ['processes.read', 'processes.*']
        }
      ]
    },
    {
      id: 'normograma',
      label: 'Normograma',
      icon: 'ri-book-open-line',
      permissions: ['documents.read', 'documents.*'],
      children: [
        { 
          id: 'normograma-documentos', 
          label: 'Documentos', 
          icon: 'ri-folder-line', 
          path: '/normograma',
          permissions: ['documents.read', 'documents.*']
        },
        { 
          id: 'normograma-buscar', 
          label: 'Búsqueda Avanzada', 
          icon: 'ri-search-line', 
          path: '/normograma/buscar',
          permissions: ['documents.read', 'documents.*']
        },
        { 
          id: 'normograma-categorias', 
          label: 'Categorías', 
          icon: 'ri-folder-2-line', 
          path: '/normograma/categorias',
          permissions: ['documents.update', 'documents.*'],
          roles: ['admin', 'super_admin', 'coordinador']
        }
      ]
    },
    {
      id: 'auditorias',
      label: 'Auditorías',
      icon: 'ri-search-eye-line',
      permissions: ['audits.read', 'audits.*'],
      children: [
        { 
          id: 'auditorias-lista', 
          label: 'Lista de Auditorías', 
          icon: 'ri-file-list-2-line', 
          path: '/auditorias',
          permissions: ['audits.read', 'audits.*']
        },
        { 
          id: 'auditorias-nueva', 
          label: 'Nueva Auditoría', 
          icon: 'ri-add-circle-line', 
          path: '/auditorias/nueva',
          permissions: ['audits.create', 'audits.*'],
          roles: ['admin', 'super_admin', 'coordinador', 'auditor']
        },
        { 
          id: 'auditorias-calendario', 
          label: 'Calendario', 
          icon: 'ri-calendar-line', 
          path: '/auditorias/calendario',
          permissions: ['audits.read', 'audits.*']
        },
        { 
          id: 'auditorias-hallazgos', 
          label: 'Hallazgos', 
          icon: 'ri-error-warning-line', 
          path: '/auditorias/hallazgos',
          permissions: ['audits.read', 'audits.*']
        }
      ]
    },
    {
      id: 'indicadores',
      label: 'Indicadores de Gestión',
      icon: 'ri-line-chart-line',
      permissions: ['indicators.read', 'indicators.*', 'reports.read', 'reports.*'],
      children: [
        { 
          id: 'indicadores-dashboard', 
          label: 'Dashboard KPIs', 
          icon: 'ri-dashboard-line', 
          path: '/indicadores',
          permissions: ['indicators.read', 'indicators.*', 'reports.read', 'reports.*']
        },
        { 
          id: 'indicadores-lista', 
          label: 'Lista de Indicadores', 
          icon: 'ri-bar-chart-line', 
          path: '/indicadores/lista',
          permissions: ['indicators.read', 'indicators.*']
        },
        { 
          id: 'indicadores-reportes', 
          label: 'Reportes', 
          icon: 'ri-file-chart-line', 
          path: '/indicadores/reportes',
          permissions: ['reports.read', 'reports.*', 'reports.export']
        }
      ]
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: 'ri-settings-2-line',
      roles: ['admin', 'super_admin'],
      children: [
        { 
          id: 'configuracion-usuarios', 
          label: 'Usuarios', 
          icon: 'ri-user-line', 
          path: '/configuracion/usuarios',
          permissions: ['users.read', 'users.*'],
          roles: ['admin', 'super_admin']
        },
        { 
          id: 'configuracion-roles', 
          label: 'Roles y Permisos', 
          icon: 'ri-shield-user-line', 
          path: '/configuracion/roles',
          permissions: ['roles.read', 'roles.*', 'permissions.*'],
          roles: ['super_admin']
        },
        { 
          id: 'configuracion-sistema', 
          label: 'Sistema', 
          icon: 'ri-computer-line', 
          path: '/configuracion/sistema',
          permissions: ['settings.update', 'system.admin'],
          roles: ['super_admin']
        }
      ]
    }
  ], []);

  /**
   * Filter menu items based on user permissions and roles
   */
  const menuItems = useMemo(() => {
    const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
      return items
        .map(item => {
          // Filter children first
          const filteredChildren = item.children ? filterMenuItems(item.children) : undefined;
          
          // If item has children, include it only if it has visible children
          if (item.children) {
            return filteredChildren && filteredChildren.length > 0 
              ? { ...item, children: filteredChildren }
              : null;
          }
          
          // For leaf items, check permissions/roles
          return item;
        })
        .filter((item): item is MenuItem => item !== null);
    };

    return filterMenuItems(allMenuItems);
  }, [allMenuItems]);

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
      <PermissionGate
        key={item.id}
        permission={item.permission}
        permissions={item.permissions}
        role={item.role}
        roles={item.roles}
        requireAllPermissions={item.requireAllPermissions}
        requireAllRoles={item.requireAllRoles}
      >
        <li className={`nav-item ${level > 0 ? 'sub-menu-item' : ''}`}>
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
      </PermissionGate>
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
            {/* Main Menu */}
            <li className="menu-title">
              <span>MENU PRINCIPAL</span>
            </li>
            {menuItems
              .filter(item => ['dashboard'].includes(item.id))
              .map(item => renderMenuItem(item))
            }
            
            {/* Management Section - Show if user can manage processes, documents, or audits */}
            {(capabilities.canManageProcesses || capabilities.canManageDocuments || capabilities.canManageAudits) && (
              <>
                <li className="menu-title">
                  <span>GESTIÓN</span>
                </li>
                {menuItems
                  .filter(item => ['procesos', 'normograma', 'auditorias'].includes(item.id))
                  .map(item => renderMenuItem(item))
                }
              </>
            )}
            
            {/* Reports & Analysis - Show if user can view reports */}
            {capabilities.canViewReports && (
              <>
                <li className="menu-title">
                  <span>REPORTES & ANÁLISIS</span>
                </li>
                {menuItems
                  .filter(item => ['indicadores'].includes(item.id))
                  .map(item => renderMenuItem(item))
                }
              </>
            )}
            
            {/* Administration - Show only to admin users */}
            {(capabilities.canManageUsers || capabilities.canManageSystem) && (
              <>
                <li className="menu-title">
                  <span>ADMINISTRACIÓN</span>
                </li>
                {menuItems
                  .filter(item => ['configuracion'].includes(item.id))
                  .map(item => renderMenuItem(item))
                }
              </>
            )}

            {/* Role-specific sections */}
            {capabilities.isSuperAdmin && (
              <>
                <li className="menu-title">
                  <span>SUPER ADMIN</span>
                </li>
                {/* Add super admin specific menu items here */}
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Sidebar Background */}
      <div className="sidebar-background"></div>
    </div>
  );
};

export default Sidebar;