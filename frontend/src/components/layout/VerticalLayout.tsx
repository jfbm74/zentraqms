import React, { useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from "../../utils/SimpleRouter";
import { usePermissions } from "../../hooks/usePermissions";
import { PermissionGate } from "../common/PermissionGate";

interface MenuItem {
  id: string;
  label: string;
  icon: string;
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

  // Estado para controlar los menús expandidos
  const [isDashboard, setIsDashboard] = React.useState<boolean>(false);
  const [isOrganizacion, setIsOrganizacion] = React.useState<boolean>(false);
  const [isConfiguracion, setIsConfiguracion] = React.useState<boolean>(false);

  // Get user capabilities for dynamic menu generation
  const capabilities = getUserCapabilities();

  /**
   * Define menu structure with RBAC permissions adapted for healthcare
   */
  const menuItems: MenuItem[] = useMemo(() => [
    {
      label: "MENÚ PRINCIPAL",
      isHeader: true,
      id: "menu-header"
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
      label: "ORGANIZACIÓN",
      isHeader: true,
      id: "organization-header"
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
      label: "ADMINISTRACIÓN",
      isHeader: true,
      id: "admin-header"
    },
    {
      id: "configuracion",
      label: "Configuración",
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
  ], [isDashboard, isOrganizacion, isConfiguracion]);

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
    const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
      return items
        .map((item) => {
          // Always show headers
          if (item.isHeader) {
            return item;
          }

          // Filter children first
          const filteredChildren = item.subItems
            ? filterMenuItems(item.subItems)
            : undefined;

          // If item has children, include it only if it has visible children
          if (item.subItems) {
            return filteredChildren && filteredChildren.length > 0
              ? { ...item, subItems: filteredChildren }
              : null;
          }

          // For leaf items, check permissions/roles
          return item;
        })
        .filter((item): item is MenuItem => item !== null);
    };

    return filterMenuItems(menuItems);
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
                    <Link
                      onClick={item.click}
                      className="nav-link menu-link"
                      to={item.link ? item.link : "/#"}
                      data-bs-toggle="collapse"
                    >
                      <i className={item.icon}></i>
                      <span data-key="t-apps">{item.label}</span>
                      {item.badgeName ? (
                        <span className={`badge badge-pill bg-${item.badgeColor}`} data-key="t-new">
                          {item.badgeName}
                        </span>
                      ) : null}
                    </Link>
                    <div
                      className={`menu-dropdown collapse ${item.stateVariables ? 'show' : ''}`}
                      id="sidebarApps"
                    >
                      <ul className="nav nav-sm flex-column">
                        {/* subItems */}
                        {item.subItems &&
                          item.subItems.map((subItem: MenuItem, key: number) => (
                            <React.Fragment key={key}>
                              <PermissionGate
                                permission={subItem.permission}
                                permissions={subItem.permissions}
                                role={subItem.role}
                                roles={subItem.roles}
                                requireAllPermissions={subItem.requireAllPermissions}
                                requireAllRoles={subItem.requireAllRoles}
                              >
                                <li className="nav-item">
                                  <Link
                                    to={subItem.link ? subItem.link : "/#"}
                                    className="nav-link"
                                  >
                                    {subItem.label}
                                    {subItem.badgeName ? (
                                      <span className={`badge badge-pill bg-${subItem.badgeColor}`} data-key="t-new">
                                        {subItem.badgeName}
                                      </span>
                                    ) : null}
                                  </Link>
                                </li>
                              </PermissionGate>
                            </React.Fragment>
                          ))}
                      </ul>
                    </div>
                  </li>
                ) : (
                  <li className="nav-item">
                    <Link
                      className="nav-link menu-link"
                      to={item.link ? item.link : "/#"}
                    >
                      <i className={item.icon}></i> <span>{item.label}</span>
                      {item.badgeName ? (
                        <span className={`badge badge-pill bg-${item.badgeColor}`} data-key="t-new">
                          {item.badgeName}
                        </span>
                      ) : null}
                    </Link>
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