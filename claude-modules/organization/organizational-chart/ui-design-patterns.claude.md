# 🎨 Patrones de Diseño UI - Módulo de Organigramas Organizacionales

## 📋 Resumen Ejecutivo

Este documento define los patrones de diseño UI específicos para el módulo de organigramas organizacionales de ZentraQMS, siguiendo los principios del sistema de diseño Velzon 4.4.1 y las convenciones establecidas en el proyecto. Se enfoca en crear interfaces intuitivas y accesibles para profesionales de salud colombianos.

### 🎯 Objetivos del Documento
- Establecer patrones de diseño consistentes para organigramas
- Definir componentes React reutilizables
- Asegurar cumplimiento con estándares de accesibilidad WCAG 2.1 AA
- Mantener coherencia con el diseño existente de ZentraQMS
- Optimizar la experiencia para usuarios de salud

---

## 🏗️ 1. PATRONES DE DISEÑO UI ESPECÍFICOS

### 1.1 Vista Principal del Organigrama

#### **OrganizationalChartView**
```typescript
interface OrganizationalChartViewProps {
  organizationId: string;
  viewMode: 'view' | 'edit' | 'preview';
  showFilters?: boolean;
  showControls?: boolean;
  onNodeSelect?: (node: ChartNode) => void;
  onNodeEdit?: (node: ChartNode) => void;
}
```

**Características:**
- **Layout Principal**: Grid responsivo con sidebar lateral (departamentos) y vista central (organigrama)
- **Modo Vista**: Solo lectura con tooltips informativos
- **Modo Edición**: Drag & drop, edición inline, controles visuales
- **Modo Preview**: Vista previa antes de aprobar cambios

**Estados Visuales:**
```scss
// Estados de nodos
.org-node {
  &--active { border-color: $primary; }
  &--selected { background: rgba($primary, 0.1); }
  &--vacant { border-style: dashed; opacity: 0.7; }
  &--critical { border-left: 4px solid $danger; }
  &--temporary { border-style: dotted; }
}
```

### 1.2 Componente de Nodo (Cargo)

#### **EmployeeCard**
```typescript
interface EmployeeCardProps {
  cargo: Cargo;
  usuario?: Usuario;
  level: number;
  isEditable?: boolean;
  showPhoto?: boolean;
  showBadges?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onAssign?: () => void;
}
```

**Diseño Visual:**
```scss
.employee-card {
  background: white;
  border: 1px solid $gray-300;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
  
  &:hover {
    border-color: $primary;
    box-shadow: 0 4px 8px rgba($primary, 0.15);
  }
  
  &.is-vacant {
    border-style: dashed;
    background: rgba($gray-100, 0.5);
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: $gray-200;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: $gray-600;
    }
    
    .info {
      flex: 1;
      
      .name {
        font-weight: 600;
        color: $gray-900;
        margin-bottom: 2px;
      }
      
      .position {
        font-size: 0.875rem;
        color: $gray-600;
      }
    }
  }
  
  .card-badges {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    
    .badge {
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 12px;
      font-weight: 500;
      
      &.badge-critical { background: rgba($danger, 0.1); color: $danger; }
      &.badge-committee { background: rgba($info, 0.1); color: $info; }
      &.badge-process { background: rgba($success, 0.1); color: $success; }
    }
  }
  
  .card-actions {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid $gray-200;
    display: flex;
    gap: 8px;
    
    .btn-sm {
      padding: 4px 8px;
      font-size: 0.75rem;
    }
  }
}
```

### 1.3 Navegación Jerárquica

#### **DepartmentNavigation**
```typescript
interface DepartmentNavigationProps {
  areas: Area[];
  selectedAreaId?: string;
  onAreaSelect: (areaId: string) => void;
  showEmployeeCount?: boolean;
  collapsible?: boolean;
}
```

**Estructura Visual:**
```scss
.department-navigation {
  background: white;
  border-right: 1px solid $gray-300;
  height: 100%;
  overflow-y: auto;
  
  .nav-header {
    padding: 20px 16px;
    border-bottom: 1px solid $gray-200;
    background: $gray-50;
    
    .title {
      font-weight: 600;
      color: $gray-900;
      margin-bottom: 4px;
    }
    
    .subtitle {
      font-size: 0.875rem;
      color: $gray-600;
    }
  }
  
  .nav-tree {
    padding: 16px 0;
    
    .nav-item {
      position: relative;
      
      &.has-children {
        .nav-link::before {
          content: '\ea4e'; // ri-arrow-right-s-line
          font-family: 'remixicon';
          transition: transform 0.2s;
        }
        
        &.expanded .nav-link::before {
          transform: rotate(90deg);
        }
      }
      
      .nav-link {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        color: $gray-700;
        text-decoration: none;
        transition: all 0.2s;
        border-left: 3px solid transparent;
        
        &:hover {
          background: rgba($primary, 0.05);
          color: $primary;
        }
        
        &.active {
          background: rgba($primary, 0.1);
          color: $primary;
          border-left-color: $primary;
          font-weight: 500;
        }
        
        .icon {
          margin-right: 8px;
          font-size: 16px;
        }
        
        .text {
          flex: 1;
        }
        
        .count {
          font-size: 0.75rem;
          background: $gray-200;
          color: $gray-600;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }
      }
      
      .nav-children {
        padding-left: 20px;
        border-left: 1px solid $gray-200;
        margin-left: 16px;
      }
    }
  }
}
```

### 1.4 Controles de Visualización

#### **ChartControls**
```typescript
interface ChartControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onFullScreen?: () => void;
  onExport?: (format: 'pdf' | 'png' | 'svg') => void;
  onPrint?: () => void;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}
```

**Diseño de Toolbar:**
```scss
.chart-controls {
  background: white;
  border-bottom: 1px solid $gray-300;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  
  .controls-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .search-box {
      position: relative;
      width: 280px;
      
      .form-control {
        padding-left: 36px;
        border-radius: 20px;
        border: 1px solid $gray-300;
        
        &:focus {
          border-color: $primary;
          box-shadow: 0 0 0 2px rgba($primary, 0.1);
        }
      }
      
      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: $gray-500;
      }
    }
    
    .filter-tabs {
      display: flex;
      border: 1px solid $gray-300;
      border-radius: 6px;
      overflow: hidden;
      
      .tab-btn {
        padding: 6px 12px;
        border: none;
        background: white;
        color: $gray-600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        
        &:not(:last-child) {
          border-right: 1px solid $gray-300;
        }
        
        &:hover {
          background: $gray-50;
        }
        
        &.active {
          background: $primary;
          color: white;
        }
      }
    }
  }
  
  .controls-right {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      border: 1px solid $gray-300;
      border-radius: 6px;
      background: white;
      
      .zoom-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        
        &:hover {
          background: $gray-100;
        }
      }
      
      .zoom-level {
        padding: 0 8px;
        font-size: 0.875rem;
        color: $gray-700;
        min-width: 40px;
        text-align: center;
      }
    }
    
    .action-buttons {
      display: flex;
      gap: 8px;
      
      .btn {
        padding: 6px 12px;
        font-size: 0.875rem;
        
        &.btn-outline-primary {
          border-color: $primary;
          color: $primary;
          
          &:hover {
            background: $primary;
            color: white;
          }
        }
      }
    }
  }
}
```

### 1.5 Estados de Interacción

#### **Estados de Loading**
```scss
.org-chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: $gray-600;
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid $gray-200;
    border-top: 3px solid $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .message {
    margin-top: 16px;
    font-size: 0.875rem;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

#### **Estados Vacíos**
```scss
.org-chart-empty {
  text-align: center;
  padding: 60px 20px;
  color: $gray-600;
  
  .empty-icon {
    font-size: 64px;
    color: $gray-400;
    margin-bottom: 16px;
  }
  
  .empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: $gray-700;
    margin-bottom: 8px;
  }
  
  .empty-message {
    font-size: 0.875rem;
    margin-bottom: 24px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .empty-action {
    .btn-primary {
      padding: 12px 24px;
      font-weight: 500;
    }
  }
}
```

#### **Estados de Error**
```scss
.org-chart-error {
  background: rgba($danger, 0.05);
  border: 1px solid rgba($danger, 0.2);
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
  
  .error-icon {
    font-size: 48px;
    color: $danger;
    margin-bottom: 12px;
  }
  
  .error-title {
    font-weight: 600;
    color: $danger;
    margin-bottom: 8px;
  }
  
  .error-message {
    color: $gray-700;
    font-size: 0.875rem;
    margin-bottom: 16px;
  }
  
  .error-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    
    .btn-outline-danger {
      font-size: 0.875rem;
      padding: 6px 16px;
    }
  }
}
```

---

## 🎨 2. LAYOUT TEMPLATE DE LA ORGANIZACIÓN

### 2.1 Estructura Principal

#### **OrganizationalChartLayout**
```typescript
const OrganizationalChartLayout: React.FC<OrganizationalChartLayoutProps> = ({
  children,
  organization,
  currentChart,
  showVersions = true,
  showValidation = true
}) => {
  const moduleConfig = useMemo(() => ({
    ...baseModuleConfig,
    breadcrumb: {
      title: 'Organización',
      pageTitle: 'Organigrama',
      links: [
        { name: 'Organización', url: '/organizacion' },
        { name: 'Estructura', url: '#' },
        { name: 'Organigrama' }
      ]
    },
    subheader: {
      show: true,
      component: <OrganizationSubheader 
        organization={organization}
        currentChart={currentChart}
        showVersions={showVersions}
        showValidation={showValidation}
      />
    }
  }), [organization, currentChart, showVersions, showValidation]);

  return (
    <LayoutWithBreadcrumb moduleConfig={moduleConfig}>
      <div className="org-chart-container">
        {children}
      </div>
    </LayoutWithBreadcrumb>
  );
};
```

### 2.2 Subheader de Organización

#### **OrganizationSubheader**
```scss
.organization-subheader {
  background: white;
  border-bottom: 1px solid $gray-300;
  padding: 16px 24px;
  
  .subheader-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    
    .org-info {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .org-logo {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background: $gray-200;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .logo-placeholder {
          font-size: 20px;
          color: $gray-500;
        }
      }
      
      .org-details {
        .org-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: $gray-900;
          margin-bottom: 2px;
        }
        
        .org-type {
          font-size: 0.875rem;
          color: $gray-600;
          display: flex;
          align-items: center;
          gap: 8px;
          
          .type-badge {
            background: rgba($info, 0.1);
            color: $info;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
          }
        }
      }
    }
    
    .version-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .version-selector {
        .dropdown-toggle {
          background: rgba($primary, 0.1);
          border-color: $primary;
          color: $primary;
          font-size: 0.875rem;
          padding: 6px 12px;
          
          &:hover {
            background: $primary;
            color: white;
          }
        }
      }
      
      .validation-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.875rem;
        
        &.status-valid {
          color: $success;
        }
        
        &.status-invalid {
          color: $danger;
        }
        
        &.status-warning {
          color: $warning;
        }
        
        .status-icon {
          font-size: 16px;
        }
        
        .status-text {
          font-weight: 500;
        }
      }
    }
    
    .actions {
      display: flex;
      gap: 8px;
      
      .btn {
        font-size: 0.875rem;
        padding: 8px 16px;
        
        &.btn-outline-primary {
          border-color: $primary;
          color: $primary;
          
          &:hover {
            background: $primary;
            color: white;
          }
        }
        
        &.btn-primary {
          background: $primary;
          border-color: $primary;
          
          &:hover {
            background: darken($primary, 10%);
          }
        }
      }
    }
  }
  
  // Responsive
  @media (max-width: 768px) {
    .subheader-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      
      .version-info {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
      }
      
      .actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  }
}
```

### 2.3 Layout de Grid Principal

#### **Estructura de Grid**
```scss
.org-chart-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "sidebar toolbar"
    "sidebar content";
  height: calc(100vh - var(--breadcrumb-height) - var(--subheader-height));
  background: $gray-50;
  
  .department-sidebar {
    grid-area: sidebar;
    background: white;
    border-right: 1px solid $gray-300;
  }
  
  .chart-toolbar {
    grid-area: toolbar;
    background: white;
    border-bottom: 1px solid $gray-300;
  }
  
  .chart-content {
    grid-area: content;
    overflow: hidden;
    position: relative;
  }
  
  // Responsive
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "toolbar"
      "content";
    
    .department-sidebar {
      position: fixed;
      left: -280px;
      top: 0;
      height: 100vh;
      z-index: 1040;
      transition: left 0.3s ease;
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
      
      &.show {
        left: 0;
      }
    }
    
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.5);
      z-index: 1030;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      
      &.show {
        opacity: 1;
        visibility: visible;
      }
    }
  }
  
  @media (max-width: 576px) {
    height: calc(100vh - var(--mobile-header-height));
    
    .chart-toolbar {
      padding: 8px 12px;
      
      .controls-left .search-box {
        width: 200px;
      }
      
      .controls-right {
        .action-buttons {
          .btn {
            padding: 6px 8px;
            font-size: 0.75rem;
            
            .btn-text {
              display: none;
            }
          }
        }
      }
    }
  }
}
```

### 2.4 Panel Lateral de Propiedades

#### **PropertiesPanel**
```scss
.properties-panel {
  position: absolute;
  right: 0;
  top: 0;
  width: 320px;
  height: 100%;
  background: white;
  border-left: 1px solid $gray-300;
  box-shadow: -2px 0 10px rgba(0,0,0,0.1);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 100;
  
  &.show {
    transform: translateX(0);
  }
  
  .panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid $gray-200;
    background: $gray-50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .panel-title {
      font-weight: 600;
      color: $gray-900;
    }
    
    .panel-close {
      background: none;
      border: none;
      font-size: 18px;
      color: $gray-500;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      
      &:hover {
        background: $gray-200;
        color: $gray-700;
      }
    }
  }
  
  .panel-content {
    padding: 20px;
    height: calc(100% - 65px);
    overflow-y: auto;
    
    .property-group {
      margin-bottom: 24px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .group-title {
        font-weight: 600;
        color: $gray-900;
        margin-bottom: 12px;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .property-item {
        margin-bottom: 16px;
        
        .property-label {
          font-weight: 500;
          color: $gray-700;
          margin-bottom: 4px;
          font-size: 0.875rem;
        }
        
        .property-value {
          color: $gray-600;
          font-size: 0.875rem;
          
          &.empty {
            font-style: italic;
            color: $gray-400;
          }
        }
        
        .property-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          
          .badge {
            font-size: 0.75rem;
            padding: 2px 8px;
            border-radius: 12px;
          }
        }
        
        .property-list {
          list-style: none;
          margin: 0;
          padding: 0;
          
          li {
            padding: 4px 0;
            color: $gray-600;
            font-size: 0.875rem;
            
            &::before {
              content: '•';
              color: $primary;
              margin-right: 8px;
            }
          }
        }
      }
    }
    
    .panel-actions {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid $gray-200;
      display: flex;
      gap: 8px;
      
      .btn {
        flex: 1;
        font-size: 0.875rem;
        padding: 8px 16px;
      }
    }
  }
  
  // Responsive
  @media (max-width: 992px) {
    width: 280px;
  }
  
  @media (max-width: 576px) {
    width: 100%;
    right: 0;
  }
}
```

---

## 🎨 3. INTEGRACIÓN CON VELZON TEMPLATE

### 3.1 Componentes Base Reutilizables

#### **Card Component** (Velzon Base)
```tsx
// Basado en: /Velzon_4.4.1/React-TS/Master/src/Components/Common/Card.tsx
import { Card as VelzonCard } from '../../../Velzon/Components/Common/Card';

interface OrgChartCardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
}

const OrgChartCard: React.FC<OrgChartCardProps> = ({
  title,
  subtitle,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  children,
  actions,
  loading,
  error
}) => {
  return (
    <VelzonCard className={`org-chart-card ${className}`}>
      {(title || subtitle || actions) && (
        <VelzonCard.Header className={`d-flex justify-content-between align-items-center ${headerClassName}`}>
          <div>
            {title && <VelzonCard.Title tag="h5" className="mb-0">{title}</VelzonCard.Title>}
            {subtitle && <p className="text-muted mb-0 fs-13">{subtitle}</p>}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </VelzonCard.Header>
      )}
      <VelzonCard.Body className={bodyClassName}>
        {loading && (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="ri-error-warning-line me-2"></i>
            {error}
          </div>
        )}
        {!loading && !error && children}
      </VelzonCard.Body>
    </VelzonCard>
  );
};
```

#### **Modal Component** (Velzon Base)
```tsx
// Basado en: /Velzon_4.4.1/React-TS/Master/src/Components/Common/Modal.tsx
import { Modal as BootstrapModal } from 'reactstrap';

interface OrgModal extends BootstrapModal {
  title: string;
  size?: 'sm' | 'lg' | 'xl';
  centered?: boolean;
  backdrop?: boolean | 'static';
  scrollable?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  saveDisabled?: boolean;
}

const OrgModal: React.FC<OrgModalProps> = ({
  isOpen,
  toggle,
  title,
  size = 'lg',
  centered = true,
  backdrop = true,
  scrollable = true,
  children,
  onSave,
  onCancel,
  saveLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  loading = false,
  saveDisabled = false,
  ...props
}) => {
  return (
    <BootstrapModal
      isOpen={isOpen}
      toggle={toggle}
      size={size}
      centered={centered}
      backdrop={backdrop}
      scrollable={scrollable}
      className="org-modal"
      {...props}
    >
      <div className="modal-header">
        <h5 className="modal-title">{title}</h5>
        <button
          type="button"
          className="btn-close"
          aria-label="Cerrar"
          onClick={toggle}
        />
      </div>
      <div className="modal-body">
        {children}
      </div>
      {(onSave || onCancel) && (
        <div className="modal-footer">
          <div className="hstack gap-2 justify-content-end">
            {onCancel && (
              <button
                type="button"
                className="btn btn-light"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelLabel}
              </button>
            )}
            {onSave && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSave}
                disabled={loading || saveDisabled}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                )}
                {saveLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </BootstrapModal>
  );
};
```

### 3.2 Paleta de Colores Específica

```scss
// Variables específicas para organigramas
$org-colors: (
  // Colores de niveles jerárquicos
  'nivel-alta-direccion': #405189,      // Primary (Indigo)
  'nivel-directivo': #3577f1,           // Secondary (Blue)
  'nivel-ejecutivo': #0ab39c,           // Success (Green)
  'nivel-profesional': #299cdb,         // Info (Cyan)
  'nivel-tecnico': #f7b84b,             // Warning (Yellow)
  'nivel-auxiliar': #878a99,            // Muted (Gray)
  'nivel-operativo': #6559cc,           // Purple
  
  // Estados de cargos
  'cargo-ocupado': #0ab39c,             // Success
  'cargo-vacante': #f7b84b,             // Warning
  'cargo-temporal': #299cdb,            // Info
  'cargo-critico': #f06548,             // Danger
  
  // Tipos de relaciones
  'relacion-directa': #405189,          // Primary
  'relacion-funcional': #6559cc,        // Purple
  'relacion-coordinacion': #02a8b5,     // Teal
  'relacion-asesoria': #f1963b,         // Orange
  
  // Estados de cumplimiento
  'cumple-normativa': #0ab39c,          // Success
  'incumple-normativa': #f06548,        // Danger
  'cumple-parcial': #f7b84b,            // Warning
  'sin-validar': #878a99,               // Muted
);
```

### 3.3 Iconografía Healthcare

```scss
// Iconos específicos para organigramas de salud
.org-icons {
  // Niveles jerárquicos
  &.nivel-alta-direccion::before { content: '\eb13'; } // ri-user-crown-line
  &.nivel-directivo::before { content: '\ec7e'; }      // ri-user-star-line
  &.nivel-ejecutivo::before { content: '\ec68'; }      // ri-user-settings-line
  &.nivel-profesional::before { content: '\ec58'; }    // ri-user-heart-line
  &.nivel-tecnico::before { content: '\ec87'; }        // ri-user-gear-line
  &.nivel-auxiliar::before { content: '\ec80'; }       // ri-user-smile-line
  &.nivel-operativo::before { content: '\ec7d'; }      // ri-user-line
  
  // Tipos de cargo específicos de salud
  &.director-medico::before { content: '\eec5'; }      // ri-stethoscope-line
  &.enfermeria::before { content: '\ee4c'; }           // ri-heart-pulse-line
  &.farmacia::before { content: '\eed7'; }             // ri-capsule-line
  &.laboratorio::before { content: '\ee91'; }          // ri-test-tube-line
  &.administracion::before { content: '\eb2f'; }       // ri-building-line
  &.calidad::before { content: '\eef5'; }              // ri-award-line
  &.sistemas::before { content: '\ecd0'; }             // ri-computer-line
  &.financiero::before { content: '\ecb7'; }           // ri-money-dollar-circle-line
  
  // Estados y badges
  &.comite::before { content: '\ed40'; }               // ri-group-line
  &.proceso::before { content: '\ed4f'; }              // ri-flow-chart
  &.indicador::before { content: '\edbd'; }            // ri-dashboard-line
  &.normativo::before { content: '\edf8'; }            // ri-file-shield-line
  &.temporal::before { content: '\ee14'; }             // ri-time-line
  &.critico::before { content: '\ee4a'; }              // ri-alarm-warning-line
}
```

### 3.4 Formularios (Velzon Forms)

```scss
// Estilos específicos para formularios de organigrama
.org-form {
  .form-group {
    margin-bottom: 1.5rem;
    
    .form-label {
      font-weight: 500;
      color: $gray-700;
      margin-bottom: 0.5rem;
      
      &.required::after {
        content: ' *';
        color: $danger;
      }
    }
    
    .form-control {
      border-radius: 6px;
      border: 1px solid $gray-300;
      padding: 0.75rem 1rem;
      transition: all 0.15s ease-in-out;
      
      &:focus {
        border-color: $primary;
        box-shadow: 0 0 0 0.2rem rgba($primary, 0.15);
      }
      
      &.is-invalid {
        border-color: $danger;
        
        &:focus {
          border-color: $danger;
          box-shadow: 0 0 0 0.2rem rgba($danger, 0.15);
        }
      }
      
      &.is-valid {
        border-color: $success;
        
        &:focus {
          border-color: $success;
          box-shadow: 0 0 0 0.2rem rgba($success, 0.15);
        }
      }
    }
    
    .form-select {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m1 6 7 7 7-7'/%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 16px 12px;
      padding-right: 2.5rem;
      
      &:focus {
        border-color: $primary;
        box-shadow: 0 0 0 0.2rem rgba($primary, 0.15);
      }
    }
    
    .invalid-feedback {
      display: block;
      font-size: 0.875rem;
      color: $danger;
      margin-top: 0.25rem;
    }
    
    .valid-feedback {
      display: block;
      font-size: 0.875rem;
      color: $success;
      margin-top: 0.25rem;
    }
    
    .form-text {
      font-size: 0.875rem;
      color: $gray-600;
      margin-top: 0.25rem;
    }
  }
  
  // Grupos de campos relacionados
  .field-group {
    background: $gray-50;
    border: 1px solid $gray-200;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    
    .group-title {
      font-weight: 600;
      color: $gray-900;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid $gray-300;
    }
  }
  
  // Controles de array dinámico
  .dynamic-array {
    .array-item {
      background: white;
      border: 1px solid $gray-200;
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 0.75rem;
      position: relative;
      
      .item-remove {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: $danger;
        font-size: 16px;
        padding: 4px;
        cursor: pointer;
        border-radius: 4px;
        
        &:hover {
          background: rgba($danger, 0.1);
        }
      }
    }
    
    .add-item {
      width: 100%;
      border: 2px dashed $gray-300;
      background: transparent;
      color: $gray-600;
      padding: 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        border-color: $primary;
        color: $primary;
        background: rgba($primary, 0.05);
      }
    }
  }
}
```

---

## 🎯 4. UX PATTERNS ESPECÍFICOS PARA ORGANIGRAMAS

### 4.1 Flujo de Creación de Organigrama

#### **Wizard de Configuración**
```typescript
interface OrgChartWizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  validation?: (data: any) => boolean;
  optional?: boolean;
}

const orgChartWizardSteps: OrgChartWizardStep[] = [
  {
    id: 'basic-info',
    title: 'Información Básica',
    description: 'Configuración general del organigrama',
    component: BasicInfoStep,
    validation: (data) => data.version && data.fechaVigencia
  },
  {
    id: 'structure',
    title: 'Estructura Organizacional',
    description: 'Definición de áreas y niveles jerárquicos',
    component: StructureStep,
    validation: (data) => data.areas && data.areas.length > 0
  },
  {
    id: 'positions',
    title: 'Cargos y Responsabilidades',
    description: 'Definición de cargos por área',
    component: PositionsStep,
    validation: (data) => data.cargos && data.cargos.length > 0
  },
  {
    id: 'committees',
    title: 'Comités Institucionales',
    description: 'Configuración de comités obligatorios',
    component: CommitteesStep,
    validation: (data) => validateMandatoryCommittees(data)
  },
  {
    id: 'validation',
    title: 'Validación Normativa',
    description: 'Verificación de cumplimiento',
    component: ValidationStep,
    optional: true
  },
  {
    id: 'review',
    title: 'Revisión y Confirmación',
    description: 'Vista previa antes de crear',
    component: ReviewStep
  }
];
```

#### **Componente Wizard**
```scss
.org-wizard {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .wizard-header {
    background: white;
    border-bottom: 1px solid $gray-300;
    padding: 20px 24px;
    
    .wizard-progress {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      
      .progress-step {
        display: flex;
        align-items: center;
        color: $gray-500;
        font-size: 0.875rem;
        
        &:not(:last-child)::after {
          content: '';
          width: 60px;
          height: 1px;
          background: $gray-300;
          margin: 0 16px;
        }
        
        &.completed {
          color: $success;
          
          .step-number {
            background: $success;
            color: white;
          }
          
          &::after {
            background: $success;
          }
        }
        
        &.current {
          color: $primary;
          font-weight: 500;
          
          .step-number {
            background: $primary;
            color: white;
          }
        }
        
        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: $gray-300;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: 8px;
          flex-shrink: 0;
        }
      }
    }
    
    .wizard-title {
      text-align: center;
      
      .title {
        font-size: 1.25rem;
        font-weight: 600;
        color: $gray-900;
        margin-bottom: 4px;
      }
      
      .description {
        color: $gray-600;
        font-size: 0.875rem;
      }
    }
  }
  
  .wizard-body {
    flex: 1;
    overflow: hidden;
    padding: 24px;
    
    .step-content {
      height: 100%;
      overflow-y: auto;
      
      .step-form {
        max-width: 600px;
        margin: 0 auto;
      }
    }
  }
  
  .wizard-footer {
    background: white;
    border-top: 1px solid $gray-300;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .footer-info {
      font-size: 0.875rem;
      color: $gray-600;
    }
    
    .footer-actions {
      display: flex;
      gap: 12px;
      
      .btn {
        padding: 8px 20px;
        font-size: 0.875rem;
      }
    }
  }
  
  // Responsive
  @media (max-width: 768px) {
    .wizard-header {
      padding: 16px;
      
      .wizard-progress {
        .progress-step {
          .step-text {
            display: none;
          }
          
          &:not(:last-child)::after {
            width: 40px;
            margin: 0 8px;
          }
        }
      }
    }
    
    .wizard-body {
      padding: 16px;
    }
    
    .wizard-footer {
      padding: 12px 16px;
      
      .footer-info {
        display: none;
      }
    }
  }
}
```

### 4.2 Edición In-Place vs Modal

#### **Edición In-Place**
```typescript
interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  onCancel?: () => void;
  type?: 'text' | 'textarea' | 'select';
  options?: { label: string; value: string }[];
  validation?: (value: string) => string | null;
  placeholder?: string;
  disabled?: boolean;
}

const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  onCancel,
  type = 'text',
  options = [],
  validation,
  placeholder = '',
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (validation) {
      const validationError = validation(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setError(null);
    setIsEditing(false);
    onCancel?.();
  };

  if (!isEditing) {
    return (
      <div className="inline-edit-display" onClick={() => !disabled && setIsEditing(true)}>
        <span className={`edit-value ${!value ? 'empty' : ''}`}>
          {value || placeholder || 'Haga clic para editar'}
        </span>
        {!disabled && <i className="ri-edit-2-line edit-icon" />}
      </div>
    );
  }

  return (
    <div className="inline-edit-form">
      {type === 'text' && (
        <input
          type="text"
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          placeholder={placeholder}
          autoFocus
          disabled={loading}
        />
      )}
      
      {type === 'textarea' && (
        <textarea
          className={`form-control ${error ? 'is-invalid' : ''}`}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          placeholder={placeholder}
          autoFocus
          disabled={loading}
          rows={3}
        />
      )}
      
      {type === 'select' && (
        <select
          className={`form-select ${error ? 'is-invalid' : ''}`}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          autoFocus
          disabled={loading}
        >
          <option value="">Seleccionar...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      
      <div className="edit-actions">
        <button
          className="btn btn-sm btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading && <span className="spinner-border spinner-border-sm me-1" />}
          <i className="ri-check-line" />
        </button>
        <button
          className="btn btn-sm btn-light"
          onClick={handleCancel}
          disabled={loading}
        >
          <i className="ri-close-line" />
        </button>
      </div>
      
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};
```

#### **Estilos Inline Edit**
```scss
.inline-edit-display {
  position: relative;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 32px;
  display: flex;
  align-items: center;
  
  &:hover {
    background: rgba($primary, 0.05);
    
    .edit-icon {
      opacity: 1;
    }
  }
  
  .edit-value {
    flex: 1;
    
    &.empty {
      color: $gray-500;
      font-style: italic;
    }
  }
  
  .edit-icon {
    margin-left: 8px;
    color: $gray-400;
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 14px;
  }
}

.inline-edit-form {
  position: relative;
  
  .form-control,
  .form-select {
    padding: 4px 8px;
    font-size: 0.875rem;
  }
  
  .edit-actions {
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 4px;
    
    .btn {
      width: 24px;
      height: 24px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      
      i {
        font-size: 12px;
      }
    }
  }
  
  .invalid-feedback {
    font-size: 0.75rem;
    margin-top: 4px;
  }
}
```

### 4.3 Navegación por Niveles Jerárquicos

#### **Breadcrumb Jerárquico**
```typescript
interface HierarchicalBreadcrumbProps {
  currentPath: ChartNode[];
  onNavigate: (nodeId: string) => void;
  showHome?: boolean;
}

const HierarchicalBreadcrumb: React.FC<HierarchicalBreadcrumbProps> = ({
  currentPath,
  onNavigate,
  showHome = true
}) => {
  return (
    <nav className="hierarchical-breadcrumb" aria-label="Navegación jerárquica">
      <ol className="breadcrumb">
        {showHome && (
          <li className="breadcrumb-item">
            <button
              className="breadcrumb-link"
              onClick={() => onNavigate('root')}
              aria-label="Ir al nivel superior"
            >
              <i className="ri-home-4-line" />
              <span>Organización</span>
            </button>
          </li>
        )}
        
        {currentPath.map((node, index) => {
          const isLast = index === currentPath.length - 1;
          
          return (
            <li
              key={node.id}
              className={`breadcrumb-item ${isLast ? 'active' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {!isLast ? (
                <button
                  className="breadcrumb-link"
                  onClick={() => onNavigate(node.id)}
                >
                  <i className={`ri-${node.icon || 'building-line'}`} />
                  <span>{node.nombre}</span>
                </button>
              ) : (
                <span className="breadcrumb-current">
                  <i className={`ri-${node.icon || 'building-line'}`} />
                  <span>{node.nombre}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
```

### 4.4 Búsqueda y Filtrado

#### **Componente de Búsqueda Avanzada**
```typescript
interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  resultCount?: number;
}

interface SearchFilters {
  query?: string;
  nivel?: string;
  area?: string;
  estado?: 'ocupado' | 'vacante' | 'temporal';
  tipo?: string;
  comites?: string[];
  procesos?: string[];
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  loading,
  resultCount
}) => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = useDebouncedCallback((newFilters: SearchFilters) => {
    onSearch(newFilters);
  }, 300);

  return (
    <div className="advanced-search">
      <div className="search-main">
        <div className="search-input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, cargo o área..."
            value={filters.query || ''}
            onChange={(e) => {
              const newFilters = { ...filters, query: e.target.value };
              setFilters(newFilters);
              handleSearch(newFilters);
            }}
          />
          <button
            className="btn btn-outline-primary"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
          >
            <i className="ri-filter-3-line" />
            Filtros
          </button>
        </div>
        
        {resultCount !== undefined && (
          <div className="search-results-info">
            {loading ? (
              <span className="text-muted">
                <span className="spinner-border spinner-border-sm me-2" />
                Buscando...
              </span>
            ) : (
              <span className="text-muted">
                {resultCount} resultado{resultCount !== 1 ? 's' : ''} encontrado{resultCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>
      
      {showAdvanced && (
        <div className="search-advanced">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Nivel Jerárquico</label>
              <select
                className="form-select"
                value={filters.nivel || ''}
                onChange={(e) => {
                  const newFilters = { ...filters, nivel: e.target.value || undefined };
                  setFilters(newFilters);
                  handleSearch(newFilters);
                }}
              >
                <option value="">Todos los niveles</option>
                <option value="ALTA_DIRECCION">Alta Dirección</option>
                <option value="DIRECTIVO">Directivo</option>
                <option value="EJECUTIVO">Ejecutivo</option>
                <option value="PROFESIONAL">Profesional</option>
                <option value="TECNICO">Técnico</option>
                <option value="AUXILIAR">Auxiliar</option>
                <option value="OPERATIVO">Operativo</option>
              </select>
            </div>
            
            <div className="col-md-4">
              <label className="form-label">Estado del Cargo</label>
              <select
                className="form-select"
                value={filters.estado || ''}
                onChange={(e) => {
                  const newFilters = { ...filters, estado: e.target.value as any || undefined };
                  setFilters(newFilters);
                  handleSearch(newFilters);
                }}
              >
                <option value="">Todos los estados</option>
                <option value="ocupado">Ocupado</option>
                <option value="vacante">Vacante</option>
                <option value="temporal">Temporal</option>
              </select>
            </div>
            
            <div className="col-md-4">
              <label className="form-label">Área</label>
              <select
                className="form-select"
                value={filters.area || ''}
                onChange={(e) => {
                  const newFilters = { ...filters, area: e.target.value || undefined };
                  setFilters(newFilters);
                  handleSearch(newFilters);
                }}
              >
                <option value="">Todas las áreas</option>
                {/* Opciones dinámicas de áreas */}
              </select>
            </div>
          </div>
          
          <div className="search-actions">
            <button
              className="btn btn-light btn-sm"
              onClick={() => {
                setFilters({});
                handleSearch({});
              }}
            >
              <i className="ri-close-line me-1" />
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 4.5 Validación Visual en Tiempo Real

#### **Indicador de Cumplimiento**
```typescript
interface ComplianceIndicatorProps {
  validationResults: ValidationResult[];
  showDetails?: boolean;
  onClick?: () => void;
}

interface ValidationResult {
  codigo: string;
  mensaje: string;
  severidad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  normativa?: string;
  categoria: 'estructura' | 'comites' | 'cargos' | 'procesos';
}

const ComplianceIndicator: React.FC<ComplianceIndicatorProps> = ({
  validationResults,
  showDetails = false,
  onClick
}) => {
  const criticalErrors = validationResults.filter(r => r.severidad === 'CRITICA');
  const highErrors = validationResults.filter(r => r.severidad === 'ALTA');
  const mediumErrors = validationResults.filter(r => r.severidad === 'MEDIA');
  const lowErrors = validationResults.filter(r => r.severidad === 'BAJA');
  
  const totalErrors = validationResults.length;
  const isCompliant = criticalErrors.length === 0;
  
  const getStatusColor = () => {
    if (criticalErrors.length > 0) return 'danger';
    if (highErrors.length > 0) return 'warning';
    if (mediumErrors.length > 0) return 'info';
    return 'success';
  };
  
  const getStatusIcon = () => {
    if (criticalErrors.length > 0) return 'ri-error-warning-fill';
    if (highErrors.length > 0) return 'ri-alert-fill';
    if (mediumErrors.length > 0) return 'ri-information-fill';
    return 'ri-checkbox-circle-fill';
  };
  
  const getStatusText = () => {
    if (criticalErrors.length > 0) return 'Incumple Normativa';
    if (highErrors.length > 0) return 'Cumplimiento Parcial';
    if (mediumErrors.length > 0) return 'Revisar Configuración';
    return 'Cumple Normativa';
  };

  return (
    <div className={`compliance-indicator ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className={`indicator-status status-${getStatusColor()}`}>
        <i className={getStatusIcon()} />
        <span className="status-text">{getStatusText()}</span>
        {totalErrors > 0 && (
          <span className="error-count">
            ({totalErrors} problema{totalErrors !== 1 ? 's' : ''})
          </span>
        )}
      </div>
      
      {showDetails && totalErrors > 0 && (
        <div className="compliance-details">
          {criticalErrors.length > 0 && (
            <div className="error-group critical">
              <div className="group-header">
                <i className="ri-error-warning-fill" />
                <span>Errores Críticos ({criticalErrors.length})</span>
              </div>
              <ul className="error-list">
                {criticalErrors.map((error, index) => (
                  <li key={index} className="error-item">
                    <span className="error-message">{error.mensaje}</span>
                    {error.normativa && (
                      <span className="error-normativa">({error.normativa})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {highErrors.length > 0 && (
            <div className="error-group high">
              <div className="group-header">
                <i className="ri-alert-fill" />
                <span>Advertencias ({highErrors.length})</span>
              </div>
              <ul className="error-list">
                {highErrors.map((error, index) => (
                  <li key={index} className="error-item">
                    <span className="error-message">{error.mensaje}</span>
                    {error.normativa && (
                      <span className="error-normativa">({error.normativa})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {mediumErrors.length > 0 && (
            <div className="error-group medium">
              <div className="group-header">
                <i className="ri-information-fill" />
                <span>Recomendaciones ({mediumErrors.length})</span>
              </div>
              <ul className="error-list">
                {mediumErrors.map((error, index) => (
                  <li key={index} className="error-item">
                    <span className="error-message">{error.mensaje}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

#### **Estilos Compliance**
```scss
.compliance-indicator {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid $gray-300;
  
  &.clickable {
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      border-color: $primary;
      box-shadow: 0 2px 8px rgba($primary, 0.1);
    }
  }
  
  .indicator-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    
    i {
      font-size: 18px;
    }
    
    &.status-success {
      color: $success;
    }
    
    &.status-info {
      color: $info;
    }
    
    &.status-warning {
      color: $warning;
    }
    
    &.status-danger {
      color: $danger;
    }
    
    .error-count {
      font-weight: 400;
      font-size: 0.875rem;
      color: $gray-600;
    }
  }
  
  .compliance-details {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid $gray-200;
    
    .error-group {
      &:not(:last-child) {
        margin-bottom: 16px;
      }
      
      .group-header {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 8px;
        
        i {
          font-size: 14px;
        }
      }
      
      &.critical {
        .group-header {
          color: $danger;
        }
      }
      
      &.high {
        .group-header {
          color: $warning;
        }
      }
      
      &.medium {
        .group-header {
          color: $info;
        }
      }
      
      .error-list {
        list-style: none;
        margin: 0;
        padding: 0;
        
        .error-item {
          padding: 4px 0;
          font-size: 0.875rem;
          
          .error-message {
            color: $gray-700;
          }
          
          .error-normativa {
            color: $gray-500;
            font-size: 0.75rem;
            margin-left: 8px;
          }
        }
      }
    }
  }
}
```

---

## 📱 5. COMPONENTES REACT ESPECÍFICOS

### 5.1 OrganizationalChart (Vista Principal)

```typescript
interface OrganizationalChartProps {
  organizationId: string;
  chartId?: string;
  viewMode?: 'view' | 'edit' | 'preview';
  showControls?: boolean;
  onNodeSelect?: (node: ChartNode) => void;
  onNodeEdit?: (node: ChartNode) => void;
  onNodeCreate?: (parentId: string) => void;
  onNodeDelete?: (nodeId: string) => void;
  className?: string;
}

const OrganizationalChart: React.FC<OrganizationalChartProps> = ({
  organizationId,
  chartId,
  viewMode = 'view',
  showControls = true,
  onNodeSelect,
  onNodeEdit,
  onNodeCreate,
  onNodeDelete,
  className
}) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ChartNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});

  // Chart canvas ref
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Load chart data
  useEffect(() => {
    loadChartData();
  }, [organizationId, chartId]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      const response = await orgChartService.getChart(organizationId, chartId);
      setChartData(response.data);
    } catch (err) {
      setError('Error al cargar el organigrama');
    } finally {
      setLoading(false);
    }
  };

  // Handle node interactions
  const handleNodeClick = (node: ChartNode) => {
    setSelectedNode(node);
    onNodeSelect?.(node);
  };

  const handleNodeDoubleClick = (node: ChartNode) => {
    if (viewMode === 'edit') {
      onNodeEdit?.(node);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleFitToScreen = () => {
    // Calculate optimal zoom level
    if (canvasRef.current && chartData) {
      const containerRect = canvasRef.current.getBoundingClientRect();
      const chartBounds = calculateChartBounds(chartData);
      const optimalZoom = Math.min(
        (containerRect.width / chartBounds.width) * 100,
        (containerRect.height / chartBounds.height) * 100
      );
      setZoomLevel(Math.max(50, Math.min(200, optimalZoom - 10)));
    }
  };

  // Export functionality
  const handleExport = (format: 'pdf' | 'png' | 'svg') => {
    // Implementation for exporting chart
    exportChart(chartData, format);
  };

  if (loading) {
    return <ChartLoadingState />;
  }

  if (error) {
    return <ChartErrorState error={error} onRetry={loadChartData} />;
  }

  if (!chartData) {
    return <ChartEmptyState onCreateChart={() => onNodeCreate?.('root')} />;
  }

  return (
    <div className={`organizational-chart ${className || ''}`}>
      {showControls && (
        <ChartControls
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitToScreen={handleFitToScreen}
          onExport={handleExport}
          onSearch={setSearchQuery}
        />
      )}

      <div className="chart-workspace">
        <div 
          ref={canvasRef}
          className="chart-canvas"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          <ChartRenderer
            data={chartData}
            selectedNodeId={selectedNode?.id}
            viewMode={viewMode}
            searchQuery={searchQuery}
            filters={filters}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onNodeContextMenu={(node, event) => {
              // Show context menu for edit mode
              if (viewMode === 'edit') {
                showNodeContextMenu(node, event);
              }
            }}
          />
        </div>
      </div>

      {selectedNode && (
        <NodeDetailsPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onEdit={() => onNodeEdit?.(selectedNode)}
        />
      )}
    </div>
  );
};
```

### 5.2 EmployeeCard (Nodo Individual)

```typescript
interface EmployeeCardProps {
  cargo: Cargo;
  usuario?: Usuario;
  level: number;
  viewMode?: 'view' | 'edit' | 'preview';
  selected?: boolean;
  highlighted?: boolean;
  showPhoto?: boolean;
  showBadges?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  className?: string;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  cargo,
  usuario,
  level,
  viewMode = 'view',
  selected = false,
  highlighted = false,
  showPhoto = true,
  showBadges = true,
  onClick,
  onDoubleClick,
  onContextMenu,
  className
}) => {
  const [photoError, setPhotoError] = useState(false);

  // Generate avatar from name
  const getAvatarText = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  // Get level-specific styling
  const getLevelClass = () => {
    const levelMap: Record<string, string> = {
      'ALTA_DIRECCION': 'level-alta-direccion',
      'DIRECTIVO': 'level-directivo',
      'EJECUTIVO': 'level-ejecutivo',
      'PROFESIONAL': 'level-profesional',
      'TECNICO': 'level-tecnico',
      'AUXILIAR': 'level-auxiliar',
      'OPERATIVO': 'level-operativo'
    };
    return levelMap[cargo.nivelJerarquico] || 'level-default';
  };

  // Get status indicators
  const getStatusBadges = () => {
    const badges = [];

    if (!usuario) {
      badges.push({
        text: 'Vacante',
        type: 'warning',
        icon: 'ri-user-unfollow-line'
      });
    }

    if (cargo.esCargoCritico) {
      badges.push({
        text: 'Crítico',
        type: 'danger',
        icon: 'ri-alarm-warning-line'
      });
    }

    if (cargo.esResponsableProceso) {
      badges.push({
        text: 'Proceso',
        type: 'info',
        icon: 'ri-flow-chart'
      });
    }

    return badges;
  };

  return (
    <div
      className={`
        employee-card
        ${getLevelClass()}
        ${selected ? 'selected' : ''}
        ${highlighted ? 'highlighted' : ''}
        ${!usuario ? 'vacant' : ''}
        ${viewMode === 'edit' ? 'editable' : ''}
        ${className || ''}
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      style={{ '--level': level } as React.CSSProperties}
    >
      <div className="card-header">
        {showPhoto && (
          <div className="card-avatar">
            {usuario && usuario.foto && !photoError ? (
              <img
                src={usuario.foto}
                alt={usuario.nombreCompleto}
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div className="avatar-placeholder">
                {usuario ? getAvatarText(usuario.nombreCompleto) : '?'}
              </div>
            )}
          </div>
        )}

        <div className="card-info">
          <div className="employee-name">
            {usuario ? usuario.nombreCompleto : 'Sin asignar'}
          </div>
          <div className="position-title">
            {cargo.nombre}
          </div>
          {cargo.area && (
            <div className="area-name">
              {cargo.area.nombre}
            </div>
          )}
        </div>

        {viewMode === 'edit' && (
          <div className="card-actions">
            <button className="btn-icon" title="Editar">
              <i className="ri-edit-2-line" />
            </button>
          </div>
        )}
      </div>

      {showBadges && getStatusBadges().length > 0 && (
        <div className="card-badges">
          {getStatusBadges().map((badge, index) => (
            <span
              key={index}
              className={`badge badge-${badge.type}`}
              title={badge.text}
            >
              <i className={badge.icon} />
              <span>{badge.text}</span>
            </span>
          ))}
        </div>
      )}

      {cargo.responsabilidades.length > 0 && (
        <div className="card-footer">
          <div className="responsibility-count">
            {cargo.responsabilidades.length} responsabilidad{cargo.responsabilidades.length !== 1 ? 'es' : ''}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 5.3 DepartmentNavigation (Navegación Lateral)

```typescript
interface DepartmentNavigationProps {
  organizationId: string;
  areas: Area[];
  selectedAreaId?: string;
  onAreaSelect: (areaId: string | null) => void;
  showEmployeeCount?: boolean;
  collapsible?: boolean;
  onCreateArea?: (parentId?: string) => void;
  searchable?: boolean;
  className?: string;
}

const DepartmentNavigation: React.FC<DepartmentNavigationProps> = ({
  organizationId,
  areas,
  selectedAreaId,
  onAreaSelect,
  showEmployeeCount = true,
  collapsible = true,
  onCreateArea,
  searchable = true,
  className
}) => {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAreas, setFilteredAreas] = useState<Area[]>(areas);

  // Build hierarchical tree
  const buildAreaTree = (areas: Area[]): AreaTreeNode[] => {
    const areaMap = new Map<string, AreaTreeNode>();
    const roots: AreaTreeNode[] = [];

    // Create nodes
    areas.forEach(area => {
      areaMap.set(area.id, {
        ...area,
        children: [],
        employeeCount: 0 // Will be calculated
      });
    });

    // Build tree structure
    areas.forEach(area => {
      const node = areaMap.get(area.id)!;
      if (area.areaPadre) {
        const parent = areaMap.get(area.areaPadre);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Calculate employee counts
    const calculateEmployeeCount = (node: AreaTreeNode): number => {
      let count = node.cargos?.length || 0;
      node.children.forEach(child => {
        count += calculateEmployeeCount(child);
      });
      node.employeeCount = count;
      return count;
    };

    roots.forEach(calculateEmployeeCount);

    return roots;
  };

  const [areaTree, setAreaTree] = useState<AreaTreeNode[]>(() => buildAreaTree(areas));

  // Update tree when areas change
  useEffect(() => {
    setAreaTree(buildAreaTree(filteredAreas));
  }, [filteredAreas]);

  // Filter areas based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAreas(areas);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = areas.filter(area =>
        area.nombre.toLowerCase().includes(query) ||
        area.codigo.toLowerCase().includes(query)
      );
      setFilteredAreas(filtered);
    }
  }, [searchQuery, areas]);

  // Toggle area expansion
  const toggleAreaExpansion = (areaId: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  // Render area node
  const renderAreaNode = (node: AreaTreeNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedAreas.has(node.id);
    const isSelected = selectedAreaId === node.id;

    return (
      <div key={node.id} className="nav-item">
        <div
          className={`nav-link ${isSelected ? 'active' : ''}`}
          style={{ paddingLeft: `${16 + level * 20}px` }}
          onClick={() => onAreaSelect(node.id)}
        >
          {hasChildren && collapsible && (
            <button
              className="expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleAreaExpansion(node.id);
              }}
            >
              <i className={`ri-arrow-${isExpanded ? 'down' : 'right'}-s-line`} />
            </button>
          )}

          <div className="area-icon">
            <i className={getAreaIcon(node.tipoArea)} />
          </div>

          <div className="area-info">
            <div className="area-name">{node.nombre}</div>
            {node.codigo && (
              <div className="area-code">{node.codigo}</div>
            )}
          </div>

          {showEmployeeCount && (
            <div className="employee-count">
              {node.employeeCount}
            </div>
          )}
        </div>

        {hasChildren && (!collapsible || isExpanded) && (
          <div className="nav-children">
            {node.children.map(child => renderAreaNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getAreaIcon = (tipoArea: string) => {
    const iconMap: Record<string, string> = {
      'DIRECCION': 'ri-building-line',
      'SUBDIRECCION': 'ri-building-2-line',
      'DEPARTAMENTO': 'ri-community-line',
      'UNIDAD': 'ri-group-line',
      'SERVICIO': 'ri-service-line',
      'SECCION': 'ri-folder-line',
      'OFICINA': 'ri-home-office-line',
      'COMITE': 'ri-team-line',
      'GRUPO': 'ri-group-2-line'
    };
    return iconMap[tipoArea] || 'ri-folder-line';
  };

  return (
    <div className={`department-navigation ${className || ''}`}>
      <div className="nav-header">
        <div className="nav-title">
          <i className="ri-organization-chart" />
          <span>Estructura Organizacional</span>
        </div>

        {searchable && (
          <div className="nav-search">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Buscar área..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="ri-search-line search-icon" />
          </div>
        )}
      </div>

      <div className="nav-body">
        <div className="nav-item">
          <div
            className={`nav-link ${!selectedAreaId ? 'active' : ''}`}
            onClick={() => onAreaSelect(null)}
          >
            <div className="area-icon">
              <i className="ri-home-4-line" />
            </div>
            <div className="area-info">
              <div className="area-name">Toda la organización</div>
            </div>
            {showEmployeeCount && (
              <div className="employee-count">
                {areaTree.reduce((sum, node) => sum + node.employeeCount, 0)}
              </div>
            )}
          </div>
        </div>

        {areaTree.map(node => renderAreaNode(node))}
      </div>

      {onCreateArea && (
        <div className="nav-footer">
          <button
            className="btn btn-outline-primary btn-sm w-100"
            onClick={() => onCreateArea()}
          >
            <i className="ri-add-line me-1" />
            Crear Área
          </button>
        </div>
      )}
    </div>
  );
};
```

### 5.4 ChartControls (Controles de Vista)

```typescript
interface ChartControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onFullScreen?: () => void;
  onExport?: (format: 'pdf' | 'png' | 'svg') => void;
  onPrint?: () => void;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  viewMode?: 'view' | 'edit' | 'preview';
  onViewModeChange?: (mode: 'view' | 'edit' | 'preview') => void;
  loading?: boolean;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onFullScreen,
  onExport,
  onPrint,
  showSearch = true,
  onSearch,
  viewMode = 'view',
  onViewModeChange,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const exportOptions = [
    { value: 'pdf', label: 'PDF', icon: 'ri-file-pdf-line' },
    { value: 'png', label: 'PNG', icon: 'ri-image-line' },
    { value: 'svg', label: 'SVG', icon: 'ri-file-code-line' }
  ];

  return (
    <div className="chart-controls">
      <div className="controls-left">
        {showSearch && (
          <div className="search-box">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar cargo, persona o área..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <i className="ri-search-line search-icon" />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => handleSearchChange('')}
              >
                <i className="ri-close-line" />
              </button>
            )}
          </div>
        )}

        {onViewModeChange && (
          <div className="view-mode-tabs">
            <button
              className={`tab-btn ${viewMode === 'view' ? 'active' : ''}`}
              onClick={() => onViewModeChange('view')}
              disabled={loading}
            >
              <i className="ri-eye-line" />
              <span className="btn-text">Ver</span>
            </button>
            <button
              className={`tab-btn ${viewMode === 'edit' ? 'active' : ''}`}
              onClick={() => onViewModeChange('edit')}
              disabled={loading}
            >
              <i className="ri-edit-line" />
              <span className="btn-text">Editar</span>
            </button>
            <button
              className={`tab-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => onViewModeChange('preview')}
              disabled={loading}
            >
              <i className="ri-eye-off-line" />
              <span className="btn-text">Vista previa</span>
            </button>
          </div>
        )}
      </div>

      <div className="controls-right">
        <div className="zoom-controls">
          <button
            className="zoom-btn"
            onClick={onZoomOut}
            disabled={zoomLevel <= 50 || loading}
            title="Alejar"
          >
            <i className="ri-subtract-line" />
          </button>
          
          <div className="zoom-level">
            {zoomLevel}%
          </div>
          
          <button
            className="zoom-btn"
            onClick={onZoomIn}
            disabled={zoomLevel >= 200 || loading}
            title="Acercar"
          >
            <i className="ri-add-line" />
          </button>
          
          <button
            className="zoom-btn fit-btn"
            onClick={onFitToScreen}
            disabled={loading}
            title="Ajustar a pantalla"
          >
            <i className="ri-focus-3-line" />
          </button>
        </div>

        <div className="action-buttons">
          {onFullScreen && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={onFullScreen}
              disabled={loading}
              title="Pantalla completa"
            >
              <i className="ri-fullscreen-line" />
              <span className="btn-text">Pantalla completa</span>
            </button>
          )}

          {onPrint && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={onPrint}
              disabled={loading}
              title="Imprimir"
            >
              <i className="ri-printer-line" />
              <span className="btn-text">Imprimir</span>
            </button>
          )}

          {onExport && (
            <div className="dropdown">
              <button
                className="btn btn-outline-primary btn-sm dropdown-toggle"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={loading}
              >
                <i className="ri-download-line" />
                <span className="btn-text">Exportar</span>
              </button>
              
              {showExportMenu && (
                <div className="dropdown-menu show">
                  {exportOptions.map(option => (
                    <button
                      key={option.value}
                      className="dropdown-item"
                      onClick={() => {
                        onExport(option.value as any);
                        setShowExportMenu(false);
                      }}
                    >
                      <i className={option.icon} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 5.5 ComplianceIndicator (Indicadores de Cumplimiento)

Ya definido en la sección anterior, pero aquí está la implementación del hook personalizado:

```typescript
// hooks/useComplianceValidation.ts
interface UseComplianceValidationProps {
  organizationId: string;
  chartId?: string;
  autoValidate?: boolean;
}

export const useComplianceValidation = ({
  organizationId,
  chartId,
  autoValidate = true
}: UseComplianceValidationProps) => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  const validateCompliance = useCallback(async () => {
    if (!organizationId) return;

    try {
      setLoading(true);
      const response = await orgChartService.validateCompliance(organizationId, chartId);
      setValidationResults(response.data.results || []);
      setLastValidation(new Date());
    } catch (error) {
      console.error('Error validating compliance:', error);
      setValidationResults([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, chartId]);

  // Auto-validate on chart changes
  useEffect(() => {
    if (autoValidate) {
      validateCompliance();
    }
  }, [autoValidate, validateCompliance]);

  const summary = useMemo(() => {
    const critical = validationResults.filter(r => r.severidad === 'CRITICA').length;
    const high = validationResults.filter(r => r.severidad === 'ALTA').length;
    const medium = validationResults.filter(r => r.severidad === 'MEDIA').length;
    const low = validationResults.filter(r => r.severidad === 'BAJA').length;

    return {
      total: validationResults.length,
      critical,
      high,
      medium,
      low,
      isCompliant: critical === 0,
      hasIssues: validationResults.length > 0
    };
  }, [validationResults]);

  return {
    validationResults,
    summary,
    loading,
    lastValidation,
    validateCompliance,
    refresh: validateCompliance
  };
};
```

---

## 📱 6. RESPONSIVE DESIGN GUIDELINES

### 6.1 Breakpoints Específicos para Organigramas

```scss
// Breakpoints específicos
$org-breakpoints: (
  'mobile-portrait': 320px,    // Móviles verticales
  'mobile-landscape': 576px,   // Móviles horizontales
  'tablet-portrait': 768px,    // Tablets verticales
  'tablet-landscape': 992px,   // Tablets horizontales
  'desktop-small': 1200px,     // Escritorios pequeños
  'desktop-large': 1400px,     // Escritorios grandes
  'ultrawide': 1920px          // Pantallas ultra anchas
);

// Mixins para responsive
@mixin respond-to($breakpoint) {
  @if map-has-key($org-breakpoints, $breakpoint) {
    @media (min-width: map-get($org-breakpoints, $breakpoint)) {
      @content;
    }
  }
}

@mixin respond-below($breakpoint) {
  @if map-has-key($org-breakpoints, $breakpoint) {
    @media (max-width: map-get($org-breakpoints, $breakpoint) - 1px) {
      @content;
    }
  }
}
```

### 6.2 Adaptación Móvil con Vista de Lista

```scss
.org-chart-container {
  // Desktop layout (default)
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-areas: "sidebar content";

  @include respond-below('tablet-landscape') {
    // Tablet - hide sidebar by default
    grid-template-columns: 1fr;
    grid-template-areas: "content";

    .department-sidebar {
      position: fixed;
      left: -300px;
      top: 0;
      width: 280px;
      height: 100vh;
      z-index: 1050;
      background: white;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
      transition: left 0.3s ease;

      &.show {
        left: 0;
      }
    }

    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1040;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;

      &.show {
        opacity: 1;
        visibility: visible;
      }
    }

    .mobile-sidebar-toggle {
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 1060;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: $primary;
      color: white;
      border: none;
      box-shadow: 0 2px 8px rgba($primary, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  @include respond-below('mobile-landscape') {
    // Mobile - switch to list view
    .chart-content {
      .chart-canvas {
        display: none;
      }

      .chart-list-view {
        display: block;
      }
    }
  }
}
```

### 6.3 Vista de Lista para Móviles

```typescript
interface MobileListViewProps {
  areas: Area[];
  onItemClick: (item: Cargo | Area) => void;
  searchQuery?: string;
}

const MobileListView: React.FC<MobileListViewProps> = ({
  areas,
  onItemClick,
  searchQuery = ''
}) => {
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  const toggleArea = (areaId: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  const filterItems = (items: (Cargo | Area)[], query: string) => {
    if (!query.trim()) return items;
    const searchTerm = query.toLowerCase();
    return items.filter(item =>
      'nombre' in item && item.nombre.toLowerCase().includes(searchTerm)
    );
  };

  return (
    <div className="mobile-list-view">
      {areas.map(area => {
        const isExpanded = expandedAreas.has(area.id);
        const filteredCargos = filterItems(area.cargos || [], searchQuery);

        if (searchQuery && filteredCargos.length === 0 && !area.nombre.toLowerCase().includes(searchQuery.toLowerCase())) {
          return null;
        }

        return (
          <div key={area.id} className="list-area">
            <div
              className="area-header"
              onClick={() => toggleArea(area.id)}
            >
              <div className="area-info">
                <i className={getAreaIcon(area.tipoArea)} />
                <div>
                  <div className="area-name">{area.nombre}</div>
                  <div className="area-stats">
                    {area.cargos?.length || 0} cargo{(area.cargos?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <i className={`ri-arrow-${isExpanded ? 'down' : 'right'}-s-line expand-icon`} />
            </div>

            {isExpanded && (
              <div className="area-content">
                {filteredCargos.length > 0 ? (
                  <div className="cargos-list">
                    {filteredCargos.map((cargo: Cargo) => (
                      <div
                        key={cargo.id}
                        className="cargo-item"
                        onClick={() => onItemClick(cargo)}
                      >
                        <div className="cargo-avatar">
                          {cargo.usuario ? (
                            cargo.usuario.foto ? (
                              <img src={cargo.usuario.foto} alt={cargo.usuario.nombreCompleto} />
                            ) : (
                              <div className="avatar-text">
                                {getAvatarText(cargo.usuario.nombreCompleto)}
                              </div>
                            )
                          ) : (
                            <div className="avatar-empty">
                              <i className="ri-user-line" />
                            </div>
                          )}
                        </div>

                        <div className="cargo-info">
                          <div className="cargo-name">{cargo.nombre}</div>
                          <div className="cargo-person">
                            {cargo.usuario?.nombreCompleto || 'Sin asignar'}
                          </div>
                          <div className="cargo-level">
                            {getNivelJerarquicoLabel(cargo.nivelJerarquico)}
                          </div>
                        </div>

                        <div className="cargo-badges">
                          {!cargo.usuario && (
                            <span className="badge badge-warning">Vacante</span>
                          )}
                          {cargo.esCargoCritico && (
                            <span className="badge badge-danger">Crítico</span>
                          )}
                        </div>

                        <i className="ri-arrow-right-s-line" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-area">
                    <i className="ri-inbox-line" />
                    <span>No hay cargos en esta área</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

### 6.4 Estilos Responsive

```scss
.mobile-list-view {
  padding: 16px;

  .list-area {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 8px;
    margin-bottom: 12px;
    overflow: hidden;

    .area-header {
      padding: 16px;
      background: $gray-50;
      border-bottom: 1px solid $gray-200;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: rgba($primary, 0.05);
      }

      .area-info {
        display: flex;
        align-items: center;
        gap: 12px;

        i {
          font-size: 20px;
          color: $primary;
        }

        .area-name {
          font-weight: 600;
          color: $gray-900;
          margin-bottom: 2px;
        }

        .area-stats {
          font-size: 0.875rem;
          color: $gray-600;
        }
      }

      .expand-icon {
        color: $gray-500;
        transition: transform 0.2s;
      }
    }

    .area-content {
      .cargos-list {
        .cargo-item {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid $gray-100;
          cursor: pointer;
          transition: background-color 0.2s;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background: rgba($primary, 0.02);
          }

          .cargo-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
            background: $gray-200;
            display: flex;
            align-items: center;
            justify-content: center;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .avatar-text {
              font-weight: 600;
              color: $gray-700;
              font-size: 0.875rem;
            }

            .avatar-empty {
              color: $gray-500;
              font-size: 20px;
            }
          }

          .cargo-info {
            flex: 1;

            .cargo-name {
              font-weight: 600;
              color: $gray-900;
              margin-bottom: 2px;
            }

            .cargo-person {
              color: $gray-700;
              margin-bottom: 2px;
            }

            .cargo-level {
              font-size: 0.75rem;
              color: $gray-500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          }

          .cargo-badges {
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: flex-end;

            .badge {
              font-size: 0.75rem;
              padding: 2px 6px;
              border-radius: 10px;
              white-space: nowrap;
            }
          }

          > .ri-arrow-right-s-line {
            color: $gray-400;
            margin-left: 8px;
          }
        }
      }

      .empty-area {
        padding: 32px;
        text-align: center;
        color: $gray-500;

        i {
          font-size: 32px;
          margin-bottom: 8px;
          display: block;
        }

        span {
          font-size: 0.875rem;
        }
      }
    }
  }
}

// Touch gestures optimization
@media (hover: none) and (pointer: coarse) {
  .mobile-list-view {
    .list-area .area-header,
    .cargo-item {
      &:hover {
        background: transparent;
      }

      &:active {
        background: rgba($primary, 0.1);
      }
    }
  }

  .employee-card {
    &:hover {
      transform: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    &:active {
      transform: scale(0.98);
      background: rgba($primary, 0.05);
    }
  }
}
```

### 6.5 Optimizaciones de Performance para Móviles

```typescript
// hooks/useVirtualizedList.ts - Para listas grandes en móvil
import { FixedSizeList as List } from 'react-window';

interface VirtualizedOrgListProps {
  items: (Cargo | Area)[];
  height: number;
  itemHeight: number;
  onItemClick: (item: Cargo | Area) => void;
}

const VirtualizedOrgList: React.FC<VirtualizedOrgListProps> = ({
  items,
  height,
  itemHeight,
  onItemClick
}) => {
  const ItemRenderer = ({ index, style }: any) => {
    const item = items[index];
    
    return (
      <div style={style}>
        {/* Render item based on type */}
        {'nivelJerarquico' in item ? (
          <CargoListItem cargo={item} onClick={() => onItemClick(item)} />
        ) : (
          <AreaListItem area={item} onClick={() => onItemClick(item)} />
        )}
      </div>
    );
  };

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      className="virtualized-org-list"
    >
      {ItemRenderer}
    </List>
  );
};

// Performance optimizations
const MemoizedEmployeeCard = React.memo(EmployeeCard, (prevProps, nextProps) => {
  return (
    prevProps.cargo.id === nextProps.cargo.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.highlighted === nextProps.highlighted &&
    prevProps.viewMode === nextProps.viewMode
  );
});

const MemoizedDepartmentNavigation = React.memo(DepartmentNavigation, (prevProps, nextProps) => {
  return (
    prevProps.selectedAreaId === nextProps.selectedAreaId &&
    JSON.stringify(prevProps.areas) === JSON.stringify(nextProps.areas)
  );
});
```

---

## 🎯 GUÍA DE IMPLEMENTACIÓN

### Checklist de Implementación

**✅ Patrones UI Base**
- [ ] Implementar OrganizationalChartView con estados loading/error/empty
- [ ] Crear EmployeeCard con todos los estados visuales
- [ ] Desarrollar DepartmentNavigation jerárquico
- [ ] Implementar ChartControls con zoom y exportación
- [ ] Crear ComplianceIndicator con validación en tiempo real

**✅ Layout y Navegación**
- [ ] Configurar LayoutWithBreadcrumb para módulo organigrama
- [ ] Implementar grid responsivo con sidebar colapsible
- [ ] Crear subheader con información de organización
- [ ] Desarrollar panel lateral de propiedades
- [ ] Implementar navegación jerárquica con breadcrumbs

**✅ Integración Velzon**
- [ ] Adaptar componentes Card y Modal de Velzon
- [ ] Aplicar paleta de colores específica para niveles
- [ ] Implementar iconografía healthcare
- [ ] Configurar formularios con validación
- [ ] Aplicar sistema tipográfico y espaciado

**✅ UX Patterns**
- [ ] Implementar wizard de creación de organigrama
- [ ] Desarrollar edición in-place vs modal
- [ ] Crear navegación por niveles jerárquicos
- [ ] Implementar búsqueda y filtrado avanzado
- [ ] Configurar validación visual en tiempo real

**✅ Responsive Design**
- [ ] Configurar breakpoints específicos
- [ ] Implementar vista de lista para móviles
- [ ] Optimizar gestos touch
- [ ] Crear controles móviles
- [ ] Implementar virtualización para performance

**✅ Componentes React**
- [ ] Desarrollar hooks personalizados (useComplianceValidation, useOrgChart)
- [ ] Implementar memoización para performance
- [ ] Crear tipos TypeScript completos
- [ ] Configurar tests unitarios
- [ ] Documentar props y uso de componentes

**✅ Accesibilidad**
- [ ] Implementar navegación por teclado
- [ ] Configurar roles ARIA
- [ ] Asegurar contraste de colores WCAG 2.1 AA
- [ ] Crear textos alternativos
- [ ] Implementar focus management

### Orden de Implementación Recomendado

1. **Semana 1**: Componentes base (EmployeeCard, DepartmentNavigation)
2. **Semana 2**: Layout principal y controles (ChartControls, grid responsive)
3. **Semana 3**: Funcionalidades avanzadas (búsqueda, validación, wizard)
4. **Semana 4**: Responsive y móvil (lista móvil, optimizaciones touch)
5. **Semana 5**: Testing, accesibilidad y documentación

Este documento sirve como guía completa para el desarrollo frontend del módulo de organigramas, asegurando consistencia con el sistema de diseño ZentraQMS y las mejores prácticas de UX para aplicaciones de salud.

---

**Archivos de Referencia:**
- `/frontend/src/components/layout/LayoutWithBreadcrumb.tsx`
- `/frontend/src/config/moduleConfigs.ts`
- `/Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/Components/`
- `/claude-modules/frontend/velzon-ui-ux-guide.claude.md`
- `/claude-modules/common/frontend-design-patterns.claude.md`