import React, { useEffect, useCallback, useMemo } from 'react';
import { useLocation } from "../../utils/SimpleRouter";
import { usePermissions } from "../../hooks/usePermissions";
import { PermissionGate } from "../common/PermissionGate";

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  link?: string;
  isHeader?: boolean;
  subItems?: MenuItem[];
  stateVariables?: boolean;
  click?: (e: any) => void;
  badgeName?: string;
  badgeColor?: string;
  // RBAC fields
  permission?: string;
  permissions?: string[];
  role?: string;
  roles?: string[];
  requireAllPermissions?: string[];
  requireAllRoles?: string[];
  isChildItem?: boolean;
  childItems?: MenuItem[];
}

interface VerticalLayoutProps {
  layoutType?: string;
}

const VerticalLayout: React.FC<VerticalLayoutProps> = ({ layoutType }) => {
  const location = useLocation();
  const path = location.pathname;
  const { getUserCapabilities } = usePermissions();

  // Estado para controlar los menús expandidos - Estructura optimizada
  const [isDashboard, setIsDashboard] = React.useState<boolean>(false);
  const [isOrganizacion, setIsOrganizacion] = React.useState<boolean>(false);
  const [isProcesos, setIsProcesos] = React.useState<boolean>(false);
  const [isAnalisis, setIsAnalisis] = React.useState<boolean>(false);
  const [isDocumentacion, setIsDocumentacion] = React.useState<boolean>(false);
  const [isComites, setIsComites] = React.useState<boolean>(false);
  const [isPlaneacionEstrategica, setIsPlaneacionEstrategica] = React.useState<boolean>(false);
  const [isModulosEspecializados, setIsModulosEspecializados] = React.useState<boolean>(false);
  const [isConfiguracion, setIsConfiguracion] = React.useState<boolean>(false);

  // Get user capabilities for dynamic menu generation
  const capabilities = getUserCapabilities();

  /**
   * Define optimized menu structure with UX improvements for healthcare professionals
   */
  const menuItems: MenuItem[] = useMemo(() => [
    {
      label: "🎯 OPERACIONES DIARIAS",
      isHeader: true,
      id: "daily-operations-header"
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "ri-dashboard-2-line",
      link: "/",
      stateVariables: isDashboard,
      click: function (e: any) {
        e.preventDefault();
        setIsDashboard(!isDashboard);
      },
      subItems: [
        {
          id: "analytics",
          label: "Analíticas",
          link: "/dashboard-analytics",
          parentId: "dashboard",
        },
        {
          id: "quality",
          label: "Calidad",
          link: "/dashboard-quality",
          parentId: "dashboard",
        },
      ],
    },
    {
      id: "no-conformidades",
      label: "No Conformidades",
      icon: "ri-error-warning-line",
      link: "/qms/no-conformidades",
      permissions: ["nonconformities.read", "nonconformities.*"],
      badgeName: "100",
      badgeColor: "danger",
    },
    {
      id: "auditorias",
      label: "Auditorías",
      icon: "ri-search-eye-line",
      link: "/qms/auditorias",
      permissions: ["audits.read", "audits.*"],
    },
    {
      id: "planes-mejora",
      label: "Planes de Mejora",
      icon: "ri-arrow-up-circle-line",
      link: "/qms/planes-mejora",
      permissions: ["improvement.read", "improvement.*"],
    },
    {
      id: "capas",
      label: "CAPAs",
      icon: "ri-tools-line",
      link: "/qms/capas",
      permissions: ["capas.read", "capas.*"],
      badgeName: "Nuevo",
      badgeColor: "success",
    },
    {
      id: "organizacion",
      label: "Mi Organización",
      icon: "ri-building-4-line",
      link: "/#",
      permissions: ["organization.read", "organization.*"],
      stateVariables: isOrganizacion,
      click: function (e: any) {
        e.preventDefault();
        setIsOrganizacion(!isOrganizacion);
      },
      subItems: [
        {
          id: "organizacion-perfil",
          label: "Perfil Institucional",
          link: "/organizacion/perfil",
          permissions: ["organization.read", "organization.*"],
        },
        {
          id: "organizacion-sedes",
          label: "Sedes y Servicios", 
          link: "/organizacion/sedes",
          permissions: ["organization.read", "organization.*"],
        },
        {
          id: "organizacion-configuracion",
          label: "Configuración",
          link: "/organizacion/configuracion",
          permissions: ["organization.update", "organization.*"],
          roles: ["admin", "super_admin", "coordinador"],
        },
      ],
    },
    {
      label: "📋 GESTIÓN DE CALIDAD",
      isHeader: true,
      id: "quality-management-header"
    },
    {
      id: "procesos",
      label: "Procesos",
      icon: "ri-flow-chart",
      link: "/#",
      permissions: ["processes.read", "processes.*"],
      stateVariables: isProcesos,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsProcesos(!isProcesos);
        return false;
      },
      subItems: [
        {
          id: "mapa-procesos",
          label: "Mapa de Procesos",
          link: "/qms/mapa-procesos",
          permissions: ["processes.read", "processes.*"],
        },
        {
          id: "caracterizaciones",
          label: "Caracterizaciones",
          link: "/qms/caracterizaciones",
          permissions: ["processes.read", "processes.*"],
          badgeName: "Vista Proceso",
          badgeColor: "success",
        },
        {
          id: "plan-seguimiento",
          label: "Plan de Seguimiento",
          link: "/qms/plan-seguimiento",
          permissions: ["monitoring.read", "monitoring.*"],
        },
      ],
    },
    {
      id: "analisis",
      label: "Análisis",
      icon: "ri-pie-chart-line",
      link: "/#",
      permissions: ["strategic.read", "strategic.*"],
      stateVariables: isAnalisis,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsAnalisis(!isAnalisis);
        return false;
      },
      subItems: [
        {
          id: "analisis-dofa",
          label: "Análisis DOFA",
          link: "/planeacion/analisis-dofa",
          permissions: ["strategic.read", "strategic.*"],
        },
        {
          id: "riesgos-oportunidades",
          label: "Riesgos y Oportunidades",
          link: "/qms/riesgos-oportunidades",
          permissions: ["risks.read", "risks.*"],
        },
        {
          id: "indicadores-metas",
          label: "Indicadores y Metas",
          link: "/planeacion/indicadores-metas",
          permissions: ["strategic.read", "strategic.*"],
        },
      ],
    },
    {
      id: "documentacion",
      label: "Documentación",
      icon: "ri-book-open-line",
      link: "/#",
      permissions: ["documents.read", "documents.*"],
      stateVariables: isDocumentacion,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsDocumentacion(!isDocumentacion);
        return false;
      },
      subItems: [
        {
          id: "normograma",
          label: "Normograma",
          link: "/qms/normograma",
          permissions: ["normogram.read", "normogram.*"],
        },
        {
          id: "actas",
          label: "Actas",
          link: "/qms/actas",
          permissions: ["minutes.read", "minutes.*"],
        },
        {
          id: "gestion-documental",
          label: "Gestión Documental",
          link: "/qms/gestion-documental",
          permissions: ["documents.read", "documents.*"],
        },
      ],
    },
    {
      id: "comites",
      label: "Comités",
      icon: "ri-group-line",
      link: "/#",
      permissions: ["committees.read", "committees.*"],
      stateVariables: isComites,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsComites(!isComites);
        return false;
      },
      subItems: [
        {
          id: "comite-calidad",
          label: "Comité de Calidad",
          link: "/qms/comites/calidad",
          permissions: ["committees.read", "committees.*"],
        },
        {
          id: "comite-seguridad",
          label: "Comité de Seguridad del Paciente",
          link: "/qms/comites/seguridad-paciente",
          permissions: ["committees.read", "committees.*"],
        },
        {
          id: "comite-etica",
          label: "Comité de Ética",
          link: "/qms/comites/etica",
          permissions: ["committees.read", "committees.*"],
        },
        {
          id: "comite-farmacia",
          label: "Comité de Farmacia",
          link: "/qms/comites/farmacia",
          permissions: ["committees.read", "committees.*"],
        },
      ],
    },
    {
      label: "⚙️ CONFIGURACIÓN & MÓDULOS",
      isHeader: true,
      id: "config-modules-header"
    },
    {
      id: "planeacion-estrategica",
      label: "Planeación Estratégica",
      icon: "ri-compass-3-line",
      link: "/#",
      permissions: ["strategic.read", "strategic.*"],
      stateVariables: isPlaneacionEstrategica,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsPlaneacionEstrategica(!isPlaneacionEstrategica);
        return false;
      },
      subItems: [
        {
          id: "configuracion-general",
          label: "Configuración General",
          link: "/planeacion/configuracion-general",
          permissions: ["strategic.read", "strategic.*"],
        },
        {
          id: "objetivos-estrategicos",
          label: "Objetivos Estratégicos",
          link: "/planeacion/objetivos-estrategicos",
          permissions: ["strategic.read", "strategic.*"],
        },
      ],
    },
    {
      id: "modulos-especializados",
      label: "Módulos Especializados",
      icon: "ri-puzzle-line",
      link: "/#",
      permissions: ["modules.read", "modules.*"],
      stateVariables: isModulosEspecializados,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsModulosEspecializados(!isModulosEspecializados);
        return false;
      },
      subItems: [
        {
          id: "salud-suh",
          label: "Salud - SUH",
          link: "/modulos/salud-suh",
          permissions: ["health.read", "health.*"],
        },
        {
          id: "pamec",
          label: "PAMEC",
          link: "/modulos/pamec",
          permissions: ["pamec.read", "pamec.*"],
        },
        {
          id: "acreditacion",
          label: "Acreditación",
          link: "/modulos/acreditacion",
          permissions: ["accreditation.read", "accreditation.*"],
        },
        {
          id: "gestion-riesgo-clinico",
          label: "Gestión del Riesgo Clínico",
          link: "/modulos/gestion-riesgo-clinico",
          permissions: ["clinical_risk.read", "clinical_risk.*"],
        },
      ],
    },
    {
      id: "configuracion",
      label: "Administración",
      icon: "ri-settings-2-line",
      link: "/#",
      roles: ["admin", "super_admin"],
      stateVariables: isConfiguracion,
      click: function (e: any) {
        e.preventDefault();
        setIsConfiguracion(!isConfiguracion);
      },
      subItems: [
        {
          id: "configuracion-usuarios",
          label: "Gestión de Usuarios",
          link: "/configuracion/usuarios",
          permissions: ["users.read", "users.*"],
          roles: ["admin", "super_admin"],
        },
        {
          id: "configuracion-roles",
          label: "Roles y Permisos",
          link: "/configuracion/roles",
          permissions: ["roles.read", "roles.*", "permissions.*"],
          roles: ["super_admin"],
        },
        {
          id: "configuracion-organizacion",
          label: "Asistente de Configuración",
          link: "/organization/wizard",
          permissions: ["organization.create", "organization.*"],
          roles: ["admin", "super_admin"],
        },
      ],
    },
  ], [isDashboard, isOrganizacion, isProcesos, isAnalisis, isDocumentacion, isComites, isPlaneacionEstrategica, isModulosEspecializados, isConfiguracion]);

  const resizeSidebarMenu = useCallback(() => {
    var windowSize = document.documentElement.clientWidth;
    const hamburgerIcon = document.querySelector(".hamburger-icon") as HTMLElement;
    
    if (windowSize >= 1025) {
      if (document.documentElement.getAttribute("data-layout") === "vertical") {
        document.documentElement.setAttribute("data-sidebar-size", "lg");
      }
      if (hamburgerIcon !== null) {
        hamburgerIcon.classList.remove("open");
      }
    } else if (windowSize < 1025 && windowSize > 767) {
      document.body.classList.remove("twocolumn-panel");
      if (document.documentElement.getAttribute("data-layout") === "vertical") {
        document.documentElement.setAttribute("data-sidebar-size", "sm");
      }
      if (hamburgerIcon) {
        hamburgerIcon.classList.add("open");
      }
    } else if (windowSize <= 767) {
      document.body.classList.remove("vertical-sidebar-enable");
      if (document.documentElement.getAttribute("data-layout") !== "horizontal") {
        document.documentElement.setAttribute("data-sidebar-size", "lg");
      }
      if (hamburgerIcon) {
        hamburgerIcon.classList.add("open");
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("resize", resizeSidebarMenu, true);
    return () => window.removeEventListener("resize", resizeSidebarMenu, true);
  }, [resizeSidebarMenu]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const initMenu = () => {
      const pathName = path;
      const ul = document.getElementById("navbar-nav") as HTMLElement;
      if (!ul) return;
      
      const items: any = ul.getElementsByTagName("a");
      let itemsArray = [...items];
      removeActivation(itemsArray);
      let matchingMenuItem = itemsArray.find((x) => {
        return x.pathname === pathName;
      });
      if (matchingMenuItem) {
        activateParentDropdown(matchingMenuItem);
      }
    };
    
    if (layoutType === "vertical") {
      initMenu();
    }
  }, [path, layoutType]);

  function activateParentDropdown(item: any) {
    item.classList.add("active");
    let parentCollapseDiv = item.closest(".collapse.menu-dropdown");

    if (parentCollapseDiv) {
      parentCollapseDiv.classList.add("show");
      parentCollapseDiv.parentElement.children[0].classList.add("active");
      parentCollapseDiv.parentElement.children[0].setAttribute("aria-expanded", "true");
      if (parentCollapseDiv.parentElement.closest(".collapse.menu-dropdown")) {
        parentCollapseDiv.parentElement.closest(".collapse").classList.add("show");
        if (parentCollapseDiv.parentElement.closest(".collapse").previousElementSibling)
          parentCollapseDiv.parentElement.closest(".collapse").previousElementSibling.classList.add("active");
      }
      return false;
    }
    return false;
  }

  const removeActivation = (items: any) => {
    let actiItems = items.filter((x: any) => x.classList.contains("active"));

    actiItems.forEach((item: any) => {
      if (item.classList.contains("menu-link")) {
        if (!item.classList.contains("active")) {
          item.setAttribute("aria-expanded", false);
        }
        if (item.nextElementSibling) {
          item.nextElementSibling.classList.remove("show");
        }
      }
      if (item.classList.contains("nav-link")) {
        if (item.nextElementSibling) {
          item.nextElementSibling.classList.remove("show");
        }
        item.setAttribute("aria-expanded", false);
      }
      item.classList.remove("active");
    });
  };

  /**
   * Filter menu items based on user permissions and roles
   */
  const filteredMenuItems = useMemo(() => {
    // Por ahora, mostrar todos los elementos del menú
    // TODO: Implementar filtrado completo de permisos más adelante
    return menuItems;
  }, [menuItems]);

  return (
    <React.Fragment>
      {/* menu Items */}
      {(filteredMenuItems || []).map((item: MenuItem, key: number) => {
        return (
          <React.Fragment key={key}>
            {/* Main Header */}
            {item.isHeader ? (
              <li className="menu-title">
                <span data-key="t-menu">{item.label}</span>
              </li>
            ) : (
              <PermissionGate
                permission={item.permission}
                permissions={item.permissions}
                role={item.role}
                roles={item.roles}
                requireAllPermissions={item.requireAllPermissions}
                requireAllRoles={item.requireAllRoles}
              >
                {item.subItems ? (
                  <li className="nav-item">
                    <div
                      onClick={item.click}
                      className="nav-link menu-link"
                      style={{ cursor: 'pointer' }}
                    >
                      {item.icon && <i className={item.icon}></i>}
                      <span data-key="t-apps">{item.label}</span>
                      {item.badgeName ? (
                        <span className={`badge badge-pill bg-${item.badgeColor}`} data-key="t-new">
                          {item.badgeName}
                        </span>
                      ) : null}
                      <span style={{ 
                        marginLeft: 'auto', 
                        fontSize: '0.9rem',
                        transform: item.stateVariables ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}>
                        ▶
                      </span>
                    </div>
                    <div
                      className={`menu-dropdown collapse ${item.stateVariables ? 'show' : ''}`}
                      id="sidebarApps"
                      style={{ display: item.stateVariables ? 'block' : 'none' }}
                    >
                      <ul className="nav nav-sm flex-column" style={{ 
                        paddingLeft: '1.75rem',
                        display: 'block',
                        visibility: 'visible'
                      }}>
                        {/* subItems */}
                        {item.subItems && (
                          console.log('Menu state for', item.label, ':', item.stateVariables),
                          item.subItems.map((subItem: MenuItem, key: number) => {
                            console.log('Rendering subItem:', subItem.label, 'for parent:', item.label);
                            return (
                            <React.Fragment key={key}>
                                <li className="nav-item" style={{ display: 'block', visibility: 'visible' }}>
                                  <div
                                    onClick={(e) => {
                                      e.preventDefault();
                                      // Para subItems, navegar a la ruta
                                      console.log('Navigating to:', subItem.link);
                                      // TODO: Implementar navegación con router
                                    }}
                                    className="nav-link"
                                    style={{ 
                                      cursor: 'pointer',
                                      display: 'block',
                                      padding: '0.55rem 1.5rem',
                                      color: 'rgba(255, 255, 255, 0.5)',
                                      fontSize: '0.8125rem',
                                      textDecoration: 'none'
                                    }}
                                  >
                                    {subItem.label}
                                    {subItem.badgeName ? (
                                      <span className={`badge badge-pill bg-${subItem.badgeColor}`} data-key="t-new">
                                        {subItem.badgeName}
                                      </span>
                                    ) : null}
                                  </div>
                                </li>
                            </React.Fragment>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  </li>
                ) : (
                  <li className="nav-item">
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        // Para elementos sin subItems, navegar directamente
                        console.log('Navigating to:', item.link);
                        // TODO: Implementar navegación con router
                      }}
                      className="nav-link menu-link"
                      style={{ cursor: 'pointer' }}
                    >
                      {item.icon && <i className={item.icon}></i>} <span>{item.label}</span>
                      {item.badgeName ? (
                        <span className={`badge badge-pill bg-${item.badgeColor}`} data-key="t-new">
                          {item.badgeName}
                        </span>
                      ) : null}
                    </div>
                  </li>
                )}
              </PermissionGate>
            )}
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
};

export default VerticalLayout;