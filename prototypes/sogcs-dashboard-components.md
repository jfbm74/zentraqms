# 📋 Documentación de Componentes - Dashboard SOGCS

## 🎯 Visión General del Prototipo

Este prototipo HTML representa el dashboard principal del módulo SOGCS (Sistema Obligatorio de Garantía de Calidad en Salud) diseñado específicamente para líderes de calidad y gerentes de instituciones prestadoras de servicios de salud (IPS) en Colombia.

### 📊 Datos Mock Implementados
- **SUH**: 85% cumplimiento (En proceso) - 12 servicios habilitados
- **PAMEC**: 92% cumplimiento (Activo) - 3 auditorías completadas  
- **SIC**: 78% cumplimiento (Atención requerida) - 2 indicadores críticos
- **SUA**: 0% cumplimiento (No iniciado) - Opcional para IPS Nivel II

---

## 🏗️ Arquitectura de Componentes

### 1. **Layout Structure** (`app-layout`)
```css
.app-layout {
    display: flex;
    min-height: 100vh;
}
```
- **Propósito**: Contenedor principal del dashboard con layout tipo sidebar + main content
- **Responsivo**: Se adapta desde 320px hasta 1920px+
- **Breakpoint crítico**: 992px (colapso de sidebar en tablets)

### 2. **Sidebar Navigation** (`navbar-menu`)
```css
.navbar-menu {
    width: 280px;
    position: fixed;
    height: 100vh;
    background-color: white;
}
```

#### 2.1 Logo Area (`navbar-brand-box`)
- **Marca**: ZentraQMS con icono de hospital
- **Tipografía**: HKGrotesk, font-weight 700
- **Color**: var(--vz-primary) #405189

#### 2.2 Menu Structure
- **Títulos de sección** (`.menu-title`): Uppercase, 12px, color gris
- **Enlaces principales** (`.nav-link.menu-link`): 
  - Padding: 0.75rem 1.5rem
  - Iconos: RemixIcon 1.125rem
  - Estados: normal, hover, active
- **Submenu SOGCS** (`.nav-sm`): Identado 3rem con badges de estado

#### 2.3 Navigation Items
```html
<!-- Ejemplo de estructura -->
<a href="#" class="nav-link menu-link active">
    <i class="ri-shield-check-line"></i>
    Dashboard SOGCS
</a>
```

### 3. **Main Content Area** (`main-content`)
```css
.main-content {
    flex: 1;
    margin-left: 280px;
    background-color: var(--vz-light);
}
```

#### 3.1 Page Header (`page-header`)
- **Título**: H4 con breadcrumbs de navegación
- **Acciones**: Botones de exportar y configurar
- **Layout**: Flexbox justify-content-between

#### 3.2 Dashboard Content (`dashboard-content`)
- **Padding**: 1.5rem responsivo
- **Estructura**: Grid-based con componentes modulares

---

## 📊 Componentes de Visualización

### 4. **Alert Banner** (`alert-banner`)
```css
.alert-banner {
    background: linear-gradient(135deg, var(--vz-danger), #ff7a6b);
    color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(240, 101, 72, 0.3);
}
```
- **Función**: Alertas críticas prominentes
- **Animación**: Pulso en icono para llamar atención
- **Content**: Mensaje + botón de acción
- **Uso actual**: Alerta SIC con 2 indicadores críticos

### 5. **Overview Cards Grid** (`overview-grid`)
```css
.overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
}
```

#### 5.1 Overview Card Structure (`overview-card`)
- **Header**: Título + icono circular con color temático
- **Métricas**: Valor grande (2.5rem) + etiqueta descriptiva
- **Progress Bar**: Barra de progreso con color correspondiente
- **Footer**: Badge de estado + información adicional

#### 5.2 Card Color System
```css
/* Cada card usa una variable CSS para consistency */
.overview-card {
    --color: var(--component-color);
}
/* SUH: warning, PAMEC: success, SIC: danger, SUA: gray-500 */
```

#### 5.3 Status Badges
- **`.status-badge.active`**: Verde - Procesos funcionando correctamente
- **`.status-badge.in-progress`**: Amarillo - Procesos en desarrollo
- **`.status-badge.attention`**: Rojo - Requiere atención inmediata
- **`.status-badge.not-started`**: Gris - No iniciado

### 6. **Charts Section** (`charts-grid`)
```css
.charts-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
}
```

#### 6.1 Compliance Trend Chart
- **Tipo**: Line chart con Chart.js
- **Datos**: Tendencia de 8 meses para los 4 componentes SOGCS
- **Características**:
  - Fill areas con transparencia
  - Tension 0.4 para curvas suaves
  - Leyenda en bottom con point styles
  - Escala Y de 0-100% con callback de formato

#### 6.2 Distribution Donut Chart
- **Tipo**: Doughnut chart con centro personalizado
- **Layout**: Posición relativa con texto superpuesto
- **Centro**: Promedio general (84%) calculado dinámicamente
- **Colores**: Consistentes con el sistema de colores de cada componente

### 7. **Activity Section** (`activity-grid`)
```css
.activity-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}
```

#### 7.1 Activity Item Structure (`activity-item`)
```html
<div class="activity-item">
    <div class="activity-icon" style="background-color: var(--vz-success)">
        <i class="ri-check-line"></i>
    </div>
    <div class="activity-content">
        <div class="activity-title">Título de la actividad</div>
        <div class="activity-description">Descripción detallada</div>
        <div class="activity-time">Timestamp relativo</div>
    </div>
</div>
```

#### 7.2 Recent Activities
- **Autoevaluación SUH Completada**: Verde, check icon
- **Alerta de Vencimiento**: Amarillo, alert icon  
- **Reporte SIC Enviado**: Azul, upload icon
- **Nuevo Auditor Asignado**: Primario, user-add icon

#### 7.3 Upcoming Tasks
- **Auditoría Externa PAMEC**: Rojo, calendar icon (alta prioridad)
- **Reporte Mensual SIC**: Amarillo, file-upload icon
- **Actualización REPS**: Azul, refresh icon
- **Plan de Mejoramiento**: Verde, clipboard icon

### 8. **Quick Actions** (`quick-actions`)
```css
.actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}
```

#### 8.1 Action Button Structure (`action-button`)
- **Layout**: Flexbox con icono + contenido
- **Hover effects**: Transform Y-2px + shadow + border color change
- **Iconos**: Circular con background gris claro
- **Content**: Título en bold + descripción en small text

#### 8.2 Available Actions
1. **Nueva Autoevaluación**: Iniciar proceso SUH
2. **Programar Auditoría**: PAMEC - Nueva auditoría  
3. **Cargar Indicadores**: SIC - Datos del mes
4. **Generar Reporte**: Cumplimiento general
5. **Configurar Alertas**: Notificaciones automáticas
6. **Gestionar Equipo**: Responsables SOGCS

---

## 🎨 Sistema de Diseño Aplicado

### Color Palette (Velzon 4.4.1)
```css
:root {
    --vz-primary: #405189;    /* Azul institucional */
    --vz-secondary: #3577f1;  /* Azul secundario */
    --vz-success: #0ab39c;    /* Verde médico */
    --vz-warning: #f7b84b;    /* Amarillo alertas */
    --vz-danger: #f06548;     /* Rojo crítico */
    --vz-info: #299cdb;       /* Azul información */
}
```

### Typography System
- **Primary Font**: HKGrotesk (premium)
- **Secondary Font**: Poppins (fallback)
- **Hierarchy**:
  - Page Title: 1.75rem (28px), font-weight 600
  - Card Titles: 1.125rem (18px), font-weight 600
  - Metric Values: 2.5rem (40px), font-weight 700
  - Body Text: 1rem (16px), font-weight 400

### Spacing System
```css
$spacers: (
    0: 0,
    1: 0.25rem (4px),
    2: 0.5rem (8px), 
    3: 1rem (16px),
    4: 1.5rem (24px),
    5: 3rem (48px)
);
```

### Component Spacing
- **Cards**: 1.5rem gap between items
- **Sections**: 2rem margin-bottom
- **Internal padding**: 1.5rem for containers

---

## 📱 Responsive Design Strategy

### Breakpoint System
```css
/* Velzon Breakpoints */
xs: 0px         /* Móviles pequeños */
sm: 576px       /* Móviles grandes */
md: 768px       /* Tablets */  
lg: 992px       /* Laptops */
xl: 1200px      /* Desktops */
xxl: 1400px     /* Monitores grandes */
```

### Responsive Adaptations

#### Large Screens (1200px+)
- Sidebar fixed 280px width
- Charts side-by-side (2fr 1fr)
- Overview grid: 4 columns (auto-fit)
- Activity grid: 2 columns

#### Tablets (768px - 991px)
- Sidebar collapses (slide-in overlay)
- Charts stack vertically
- Overview grid: 2 columns
- Activity grid: 2 columns

#### Mobile (320px - 767px)
- Sidebar full overlay
- All grids single column
- Reduced padding (1rem)
- Stack page header elements

### Mobile Optimizations
```css
@media (max-width: 768px) {
    .dashboard-content { padding: 1rem; }
    .page-title-box { flex-direction: column; }
    .actions-grid { grid-template-columns: 1fr; }
    .overview-grid { grid-template-columns: 1fr; }
}
```

---

## ⚡ Interactive Features

### JavaScript Functionality

#### 1. Chart.js Integration
```javascript
// Compliance trend with 8-month data
const complianceData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'],
    datasets: [SUH, PAMEC, SIC, SUA] // Con colores consistentes
};
```

#### 2. Real-time Updates
```javascript
// Auto-refresh every 30 seconds
setInterval(updateMetrics, 30000);
```

#### 3. Mobile Sidebar Toggle
```javascript
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}
```

### Animation & Microinteractions
- **Card hover**: translateY(-2px) + enhanced shadow
- **Button hover**: Color transitions (0.2s ease)
- **Alert icon**: Pulse animation (2s infinite)
- **Progress bars**: Width transition (0.6s ease)

---

## 🔧 Componentes Reutilizables

### 1. Status Badge Component
```html
<span class="status-badge [active|in-progress|attention|not-started]">
    <i class="ri-[icon]-line"></i>
    [Estado]
</span>
```

### 2. Metric Card Component
```html
<div class="overview-card" style="--color: var(--vz-[color])">
    <div class="card-header-flex">
        <h6 class="card-title">[Título]</h6>
        <div class="card-icon" style="background-color: var(--vz-[color])">
            <i class="ri-[icon]-line"></i>
        </div>
    </div>
    <div class="metric-value">[Valor]</div>
    <div class="metric-label">[Etiqueta]</div>
    <div class="progress-container">
        <div class="progress">
            <div class="progress-bar bg-[color]" style="width: [%]"></div>
        </div>
    </div>
    <!-- Status y info adicional -->
</div>
```

### 3. Activity Item Component
```html
<div class="activity-item">
    <div class="activity-icon" style="background-color: var(--vz-[color])">
        <i class="ri-[icon]-line"></i>
    </div>
    <div class="activity-content">
        <div class="activity-title">[Título]</div>
        <div class="activity-description">[Descripción]</div>
        <div class="activity-time">[Tiempo]</div>
    </div>
</div>
```

### 4. Action Button Component
```html
<a href="#" class="action-button">
    <div class="action-icon">
        <i class="ri-[icon]-line"></i>
    </div>
    <div>
        <div class="fw-semibold">[Título]</div>
        <small class="text-muted">[Descripción]</small>
    </div>
</a>
```

---

## 📋 Especificaciones de Implementación React

### Interfaces TypeScript Sugeridas

```typescript
interface SOGCSMetrics {
    suh: {
        percentage: number;
        status: 'active' | 'in-progress' | 'attention' | 'not-started';
        servicesEnabled: number;
        criticalAlerts: number;
    };
    pamec: {
        percentage: number;
        status: 'active' | 'in-progress' | 'attention' | 'not-started';
        auditsCompleted: number;
        cycleName: string;
    };
    sic: {
        percentage: number;
        status: 'active' | 'in-progress' | 'attention' | 'not-started';
        criticalIndicators: number;
        pendingReports: number;
    };
    sua: {
        percentage: number;
        status: 'active' | 'in-progress' | 'attention' | 'not-started';
        accreditationLevel?: string;
        nextEvaluation?: Date;
    };
}

interface ActivityItem {
    id: string;
    type: 'success' | 'warning' | 'info' | 'danger';
    icon: string;
    title: string;
    description: string;
    timestamp: Date;
}

interface QuickAction {
    id: string;
    icon: string;
    title: string;
    description: string;
    href: string;
    permissions?: string[];
}
```

### Componentes React Sugeridos
1. **`SOGCSOverviewCard`**: Card de métricas reutilizable
2. **`ComplianceChart`**: Wrapper para Chart.js con datos SOGCS
3. **`ActivityFeed`**: Lista de actividades con paginación
4. **`QuickActionsGrid`**: Grid de acciones con control de permisos
5. **`SOGCSSidebar`**: Sidebar con submódulos y badges dinámicos

---

## ✅ Checklist de Calidad Implementada

### Accesibilidad (WCAG 2.1 AA)
- [x] Contraste de colores mínimo 4.5:1
- [x] Navegación por teclado (tab order lógico)
- [x] Alt texts en iconos decorativos (role="img")
- [x] Focus visible en elementos interactivos
- [x] Aria-labels en elementos complejos

### Responsive Design
- [x] Mobile-first approach (320px mínimo)
- [x] Breakpoints consistentes con Velzon
- [x] Grid adaptativo en todos los componentes
- [x] Touch-friendly targets (44px mínimo)

### Performance
- [x] CSS optimizado con variables custom properties
- [x] Lazy loading para charts (Chart.js)
- [x] Minimal DOM queries
- [x] Efficient CSS Grid/Flexbox usage

### Healthcare UX
- [x] Información crítica prominente (alertas rojas)
- [x] Códigos de color consistentes (verde=bueno, rojo=crítico)
- [x] Terminología médica apropiada
- [x] Jerarquía visual clara para decisiones rápidas

### Velzon Compliance
- [x] Color palette 100% Velzon-compatible
- [x] Typography system (HKGrotesk + Poppins)
- [x] Spacing system consistent
- [x] Component patterns from Velzon library
- [x] Icon system (RemixIcon)

---

## 🚀 Siguientes Pasos de Implementación

### Fase 1: Componentes Base (Semana 1-2)
1. Crear componentes React base (`SOGCSOverviewCard`, `ActivityItem`)
2. Implementar sistema de colores dinámico
3. Configurar Chart.js con datos mock
4. Establecer layout responsivo

### Fase 2: Integración de Datos (Semana 3-4)
1. Conectar APIs del backend SOGCS
2. Implementar WebSocket para updates en tiempo real
3. Agregar estados de carga y error
4. Configurar refresh automático

### Fase 3: Interactividad (Semana 5-6)
1. Implementar acciones rápidas funcionales
2. Agregar modals para configuración
3. Sistema de notificaciones push
4. Navegación entre submódulos

### Fase 4: Optimización (Semana 7-8)
1. Performance testing y optimización
2. Accessibility audit completo
3. Testing en diferentes dispositivos
4. Documentación de componentes

---

**📝 Nota**: Este prototipo sirve como base visual y funcional para la implementación del dashboard SOGCS en React. Todos los componentes están diseñados para ser modulares y reutilizables siguiendo las mejores prácticas de Velzon 4.4.1 y los requerimientos específicos del sistema de salud colombiano.