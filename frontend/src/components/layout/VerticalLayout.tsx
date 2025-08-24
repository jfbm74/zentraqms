import React, { useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from "../../utils/SimpleRouter";
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
  const navigate = useNavigate();
  const path = location.pathname;
  const { getUserCapabilities } = usePermissions();

  // Estado para controlar los menús expandidos - Nueva estructura ISO 9001
  const [isPlaneacionEstrategica, setIsPlaneacionEstrategica] = React.useState<boolean>(false);
  const [isISO9001, setIsISO9001] = React.useState<boolean>(false);
  const [isContexto, setIsContexto] = React.useState<boolean>(false);
  const [isPlanificacion, setIsPlanificacion] = React.useState<boolean>(false);
  const [isApoyo, setIsApoyo] = React.useState<boolean>(false);
  const [isOperacion, setIsOperacion] = React.useState<boolean>(false);
  const [isEvaluacion, setIsEvaluacion] = React.useState<boolean>(false);
  const [isMejora, setIsMejora] = React.useState<boolean>(false);
  const [isComites, setIsComites] = React.useState<boolean>(false);

  // Get user capabilities for dynamic menu generation
  const capabilities = getUserCapabilities();

  /**
   * Nueva estructura del menú organizada según ISO 9001:2015
   */
  const menuItems: MenuItem[] = useMemo(() => [
    // Dashboard principal
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "ri-dashboard-3-line",
      link: "/",
    },
    
    // Planeación Estratégica
    {
      id: "planeacion-estrategica",
      label: "Planeación Estratégica",
      icon: "ri-roadmap-line",
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
          id: "plataforma",
          label: "Plataforma",
          link: "/planeacion/plataforma",
          permissions: ["strategic.read", "strategic.*"],
        },
        {
          id: "objetivos-metas",
          label: "Objetivos y Metas",
          link: "/planeacion/objetivos-metas",
          permissions: ["strategic.read", "strategic.*"],
        },
        {
          id: "periodo",
          label: "Periodo",
          link: "/planeacion/periodo",
          permissions: ["strategic.read", "strategic.*"],
        },
        {
          id: "plan-operativo-anual",
          label: "Plan Operativo Anual",
          link: "/planeacion/plan-operativo-anual",
          permissions: ["strategic.read", "strategic.*"],
        },
        {
          id: "informacion-institucional",
          label: "Información Institucional",
          link: "/organizacion/informacion",
          permissions: ["organization.read", "organization.*"],
        },
      ],
    },

    // ISO 9001:2015 - SGC
    {
      label: "🏅 ISO 9001:2015 - SGC",
      isHeader: true,
      id: "iso9001-header"
    },
    
    // Contexto de la Organización
    {
      id: "contexto-organizacion",
      label: "Organización",
      icon: "ri-compass-3-line",
      link: "/#",
      permissions: ["strategic.read", "strategic.*"],
      stateVariables: isContexto,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsContexto(!isContexto);
        return false;
      },
      subItems: [
        {
          id: "organigrama",
          label: "Organigrama",
          link: "/organigramas",
          permissions: ["organization.read_orgchart", "organization.*"],
        },
        {
          id: "analisis-dofa",
          label: "Análisis DOFA",
          link: "/qms/analisis-dofa",
          permissions: ["strategic.read", "strategic.*"],
        },
        {
          id: "riesgos-oportunidades",
          label: "Riesgos y Oportunidades",
          link: "/qms/riesgos-oportunidades",
          permissions: ["risks.read", "risks.*"],
        },
      ],
    },

    // Planificación
    {
      id: "planificacion",
      label: "Planificación",
      icon: "ri-calendar-check-line",
      link: "/#",
      permissions: ["processes.read", "processes.*"],
      stateVariables: isPlanificacion,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsPlanificacion(!isPlanificacion);
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
        },
        {
          id: "plan-seguimiento",
          label: "Plan de Seguimiento",
          link: "/qms/plan-seguimiento",
          permissions: ["monitoring.read", "monitoring.*"],
        },
      ],
    },

    // Apoyo
    {
      id: "apoyo",
      label: "Apoyo",
      icon: "ri-tools-line",
      link: "/#",
      permissions: ["documents.read", "documents.*"],
      stateVariables: isApoyo,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsApoyo(!isApoyo);
        return false;
      },
      subItems: [
        {
          id: "gestion-documental",
          label: "Gestión Documental",
          link: "/qms/gestion-documental",
          permissions: ["documents.read", "documents.*"],
        },
        {
          id: "normograma",
          label: "Normograma",
          link: "/qms/normograma",
          permissions: ["normogram.read", "normogram.*"],
        },
      ],
    },

    // Operación
    {
      id: "operacion",
      label: "Operación",
      icon: "ri-settings-3-line",
      link: "/#",
      permissions: ["operations.read", "operations.*"],
      stateVariables: isOperacion,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsOperacion(!isOperacion);
        return false;
      },
      subItems: [
        {
          id: "indicadores-metas",
          label: "Indicadores y Metas",
          link: "/qms/indicadores-metas",
          permissions: ["indicators.read", "indicators.*"],
        },
        {
          id: "no-conformidades",
          label: "No Conformidades",
          link: "/qms/no-conformidades",
          permissions: ["nonconformities.read", "nonconformities.*"],
        },
      ],
    },

    // Evaluación
    {
      id: "evaluacion",
      label: "Evaluación",
      icon: "ri-line-chart-line",
      link: "/#",
      permissions: ["audits.read", "audits.*"],
      stateVariables: isEvaluacion,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsEvaluacion(!isEvaluacion);
        return false;
      },
      subItems: [
        {
          id: "auditorias",
          label: "Auditorías",
          link: "/qms/auditorias",
          permissions: ["audits.read", "audits.*"],
        },
      ],
    },

    // Mejora
    {
      id: "mejora",
      label: "Mejora",
      icon: "ri-arrow-up-circle-line",
      link: "/#",
      permissions: ["improvement.read", "improvement.*"],
      stateVariables: isMejora,
      click: function (e: any) {
        e.preventDefault();
        e.stopPropagation();
        setIsMejora(!isMejora);
        return false;
      },
      subItems: [
        {
          id: "planes-mejora",
          label: "Planes de Mejora",
          link: "/qms/planes-mejora",
          permissions: ["improvement.read", "improvement.*"],
        },
        {
          id: "capas",
          label: "CAPAs",
          link: "/qms/capas",
          permissions: ["capas.read", "capas.*"],
        },
      ],
    },

    // SOGCS
    {
      id: "sogcs",
      label: "SOGCS",
      icon: "ri-shield-check-line",
      link: "/sogcs/dashboard",
      permissions: ["sogcs.read", "sogcs.*"],
    },

    // Comités Institucionales
    {
      id: "comites",
      label: "Comités Institucionales",
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
          id: "comite-gerencia",
          label: "Gerencia",
          link: "/qms/comites/gerencia",
          permissions: ["committees.read", "committees.*"],
        },
        {
          id: "comite-calidad",
          label: "Calidad",
          link: "/qms/comites/calidad",
          permissions: ["committees.read", "committees.*"],
        },
        {
          id: "comite-seguridad",
          label: "Seguridad Paciente",
          link: "/qms/comites/seguridad-paciente",
          permissions: ["committees.read", "committees.*"],
        },
        {
          id: "actas",
          label: "Actas",
          link: "/qms/actas",
          permissions: ["minutes.read", "minutes.*"],
        },
      ],
    },
  ], [isPlaneacionEstrategica, isISO9001, isContexto, isPlanificacion, isApoyo, isOperacion, isEvaluacion, isMejora, isComites]);

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
                          item.subItems.map((subItem: MenuItem, key: number) => {
                            return (
                            <React.Fragment key={key}>
                                <li className="nav-item" style={{ display: 'block', visibility: 'visible' }}>
                                  <div
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (subItem.link && subItem.link !== "/#") {
                                        navigate(subItem.link);
                                      }
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
                                      <span className={`badge badge-pill bg-${subItem.badgeColor} ms-2`} data-key="t-new">
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
                        if (item.link && item.link !== "/#") {
                          navigate(item.link);
                        }
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