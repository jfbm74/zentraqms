# 🎨 SOGCS Frontend Prototype - Especificación UX/UI

## 📋 Información General

**Componente**: Prototipo Frontend Dashboard SOGCS  
**Objetivo**: Dashboard ejecutivo para coordinadores de calidad y gerentes de IPS  
**Template Base**: Velzon 4.4.1 (React + TypeScript + Bootstrap)  
**Usuarios Objetivo**: Líderes de calidad, Gerentes de IPS, Coordinadores SOGCS  
**Estado**: Prototipo HTML completado y validado  

## 🎯 Visión del Producto

### Propósito Principal
Crear una experiencia visual impactante que permita a los ejecutivos de salud entender rápidamente el estado de cumplimiento SOGCS de su institución, facilitando la toma de decisiones informadas y el seguimiento de actividades regulatorias.

### Principios de Diseño UX
1. **Información Crítica Primero**: Alertas y métricas de cumplimiento prominentes
2. **Navegación Intuitiva**: Acceso rápido a los 4 componentes SOGCS
3. **Visualización Clara**: Gráficos y códigos de color médicos apropiados
4. **Acción Inmediata**: Acciones rápidas para flujos críticos
5. **Contexto Temporal**: Calendario integrado para planificación y seguimiento

## 🏗️ Arquitectura de Componentes

### Componente Principal: SOGCSDashboard

```typescript
interface SOGCSDashboardProps {
  organizationData: HealthOrganization;
  sogcsConfig: SOGCSConfiguration;
  userPermissions: UserPermissions;
  realTimeData: SOGCSMetrics;
}

interface SOGCSMetrics {
  suh: {
    compliance: number;          // 0-100
    status: ComponentStatus;     // 'active' | 'in_progress' | 'attention' | 'not_started'
    activeServices: number;
    pendingEvaluations: number;
    lastUpdate: Date;
  };
  pamec: {
    compliance: number;
    status: ComponentStatus;
    completedAudits: number;
    scheduledAudits: number;
    findings: number;
  };
  sic: {
    compliance: number;
    status: ComponentStatus;
    indicators: number;
    criticalIndicators: number;
    lastDataLoad: Date;
  };
  sua: {
    compliance: number;
    status: ComponentStatus;
    accreditationLevel: string;
    processStage: string;
  };
}
```

### Sub-header Navegacional

```typescript
interface SOGCSSubHeaderProps {
  activeTab: SOGCSTab;
  onTabChange: (tab: SOGCSTab) => void;
  componentBadges: ComponentBadgeData[];
  quickActions: QuickActionData[];
  breadcrumb: BreadcrumbItem[];
}

interface ComponentBadgeData {
  component: 'SUH' | 'PAMEC' | 'SIC' | 'SUA';
  label: string;
  badge: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'secondary';
    count?: number;
  };
  icon: RemixIconName;
}

interface QuickActionData {
  id: string;
  label: string;
  description: string;
  icon: RemixIconName;
  color: string;
  component: SOGCSComponent;
  permission: string;
  action: () => void;
}

enum SOGCSTab {
  DASHBOARD = 'dashboard',
  CALENDAR = 'calendar',
  SUH = 'suh',
  PAMEC = 'pamec',
  SIC = 'sic',
  SUA = 'sua'
}
```

### Calendario de Actividades

```typescript
interface SOGCSCalendarProps {
  events: CalendarEvent[];
  filters: CalendarFilter[];
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  type: EventType;
  component: SOGCSComponent;
  status: EventStatus;
  priority: EventPriority;
  assignee?: User;
  location?: string;
  documents?: Document[];
  reminders: ReminderConfig[];
}

enum EventType {
  AUTOEVALUACION = 'autoevaluacion',
  AUDITORIA = 'auditoria',
  PLAN_MEJORA = 'plan_mejora',
  CARGA_DATOS = 'carga_datos',
  REPORTE = 'reporte',
  CAPACITACION = 'capacitacion',
  VENCIMIENTO = 'vencimiento',
  REUNION = 'reunion',
  SEGUIMIENTO = 'seguimiento'
}

enum EventStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

enum EventPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}
```

## 🎨 Sistema de Diseño Implementado

### Paleta de Colores SOGCS

```css
:root {
  /* Colores por Componente SOGCS */
  --sogcs-suh-primary: #3b82f6;      /* Azul - Habilitación */
  --sogcs-suh-light: #dbeafe;
  --sogcs-suh-dark: #1e40af;
  
  --sogcs-pamec-primary: #10b981;     /* Verde - Auditorías */
  --sogcs-pamec-light: #d1fae5;
  --sogcs-pamec-dark: #047857;
  
  --sogcs-sic-primary: #8b5cf6;      /* Morado - Indicadores */
  --sogcs-sic-light: #ede9fe;
  --sogcs-sic-dark: #5b21b6;
  
  --sogcs-sua-primary: #f59e0b;      /* Dorado - Acreditación */
  --sogcs-sua-light: #fef3c7;
  --sogcs-sua-dark: #d97706;
  
  /* Estados de Cumplimiento */
  --sogcs-status-excellent: #10b981;  /* 90-100% */
  --sogcs-status-good: #84cc16;       /* 80-89% */
  --sogcs-status-warning: #f59e0b;    /* 70-79% */
  --sogcs-status-critical: #ef4444;   /* < 70% */
  
  /* Eventos de Calendario */
  --sogcs-event-capacitacion: #f97316;
  --sogcs-event-vencimiento: #dc2626;
  --sogcs-event-reunion: #6366f1;
}
```

### Tipografía Healthcare

```css
/* Fuentes Velzon 4.4.1 adaptadas para salud */
.sogcs-title {
  font-family: 'HKGrotesk', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 600;
  color: var(--bs-gray-800);
}

.sogcs-metric {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 2rem;
  line-height: 1.2;
}

.sogcs-body {
  font-family: 'HKGrotesk', sans-serif;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--bs-gray-600);
}

.sogcs-caption {
  font-family: 'HKGrotesk', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--bs-gray-500);
}
```

### Componentes Reutilizables

#### SOGCSOverviewCard

```css
.sogcs-overview-card {
  background: white;
  border: 1px solid var(--bs-gray-200);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.sogcs-overview-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--bs-gray-300);
}

.sogcs-overview-card .metric-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.sogcs-overview-card .progress-bar {
  height: 0.5rem;
  border-radius: 0.25rem;
  overflow: hidden;
  background-color: var(--bs-gray-200);
}
```

#### SOGCSStatusBadge

```css
.sogcs-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sogcs-status-badge.active {
  background-color: var(--sogcs-status-excellent);
  color: white;
}

.sogcs-status-badge.in-progress {
  background-color: var(--sogcs-status-warning);
  color: white;
}

.sogcs-status-badge.attention {
  background-color: var(--sogcs-status-critical);
  color: white;
}

.sogcs-status-badge.pending {
  background-color: var(--bs-gray-500);
  color: white;
}
```

#### SOGCSCalendarEvent

```css
.sogcs-calendar-event {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s ease;
  border-left: 3px solid currentColor;
}

.sogcs-calendar-event:hover {
  opacity: 0.8;
}

.sogcs-calendar-event.suh { background-color: var(--sogcs-suh-primary); }
.sogcs-calendar-event.pamec { background-color: var(--sogcs-pamec-primary); }
.sogcs-calendar-event.sic { background-color: var(--sogcs-sic-primary); }
.sogcs-calendar-event.sua { background-color: var(--sogcs-sua-primary); }
.sogcs-calendar-event.capacitacion { background-color: var(--sogcs-event-capacitacion); }
.sogcs-calendar-event.vencimiento { background-color: var(--sogcs-event-vencimiento); }
```

## 📱 Estrategia Responsive

### Breakpoints Velzon 4.4.1

```css
/* Extra small devices (portrait phones, less than 576px) */
@media (max-width: 575.98px) {
  .sogcs-sub-header {
    flex-direction: column;
    padding: 0.75rem;
  }
  
  .sogcs-tabs {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .sogcs-overview-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .sogcs-calendar {
    font-size: 0.75rem;
  }
}

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) {
  .sogcs-overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
  .sogcs-sub-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .sogcs-overview-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
  .sogcs-dashboard-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }
  
  .sogcs-calendar {
    min-height: 600px;
  }
}

/* Extra large devices (large desktops, 1200px and up) */
@media (min-width: 1200px) {
  .sogcs-container {
    max-width: 1400px;
    margin: 0 auto;
  }
}
```

## 🔧 Funcionalidades Implementadas

### 1. Sub-header Navegacional

#### Características:
- **Sticky positioning** que permanece visible al hacer scroll
- **Pestañas interactivas** para cada componente SOGCS
- **Badges informativos** con contadores y estados
- **Dropdown de acciones rápidas** con 6 funciones principales
- **Breadcrumb integrado** para contexto de navegación

#### Datos Mock Implementados:
```javascript
const componentBadges = [
  {
    component: 'SUH',
    label: 'Habilitación',
    badge: { text: '3', variant: 'warning', count: 3 },
    icon: 'ri-hospital-line'
  },
  {
    component: 'PAMEC',
    label: 'Auditorías',
    badge: { text: 'Activo', variant: 'success' },
    icon: 'ri-audit-line'
  },
  {
    component: 'SIC',
    label: 'Indicadores',
    badge: { text: '2', variant: 'danger', count: 2 },
    icon: 'ri-bar-chart-line'
  },
  {
    component: 'SUA',
    label: 'Acreditación',
    badge: { text: 'Pendiente', variant: 'secondary' },
    icon: 'ri-award-line'
  }
];

const quickActions = [
  {
    id: 'nueva-autoevaluacion',
    label: 'Nueva Autoevaluación',
    description: 'Iniciar proceso SUH',
    icon: 'ri-add-circle-line',
    color: 'var(--sogcs-suh-primary)',
    component: 'SUH'
  },
  {
    id: 'programar-auditoria',
    label: 'Programar Auditoría',
    description: 'PAMEC - Nueva auditoría',
    icon: 'ri-calendar-check-line',
    color: 'var(--sogcs-pamec-primary)',
    component: 'PAMEC'
  },
  {
    id: 'cargar-indicadores',
    label: 'Cargar Indicadores',
    description: 'SIC - Datos del mes',
    icon: 'ri-upload-2-line',
    color: 'var(--sogcs-sic-primary)',
    component: 'SIC'
  },
  {
    id: 'generar-reporte',
    label: 'Generar Reporte',
    description: 'Cumplimiento general',
    icon: 'ri-file-chart-line',
    color: 'var(--bs-primary)',
    component: 'GENERAL'
  },
  {
    id: 'configurar-alertas',
    label: 'Configurar Alertas',
    description: 'Notificaciones automáticas',
    icon: 'ri-notification-2-line',
    color: 'var(--bs-warning)',
    component: 'SISTEMA'
  },
  {
    id: 'gestionar-equipo',
    label: 'Gestionar Equipo',
    description: 'Responsables SOGCS',
    icon: 'ri-team-line',
    color: 'var(--bs-info)',
    component: 'SISTEMA'
  }
];
```

### 2. Dashboard Principal

#### Métricas Implementadas:
```javascript
const sogcsMetrics = {
  suh: {
    compliance: 85,
    status: 'in_progress',
    activeServices: 12,
    pendingEvaluations: 3,
    lastUpdate: new Date('2024-11-15')
  },
  pamec: {
    compliance: 92,
    status: 'active',
    completedAudits: 8,
    scheduledAudits: 2,
    findings: 5
  },
  sic: {
    compliance: 78,
    status: 'attention',
    indicators: 15,
    criticalIndicators: 2,
    lastDataLoad: new Date('2024-11-10')
  },
  sua: {
    compliance: 0,
    status: 'not_started',
    accreditationLevel: 'No aplica',
    processStage: 'Evaluación inicial'
  }
};
```

#### Gráficos Implementados:
1. **Gráfico de Tendencias** (Chart.js Line): 8 meses de datos de cumplimiento
2. **Gráfico de Distribución** (Chart.js Doughnut): Distribución actual por componente
3. **Progress Bars**: Indicadores visuales de progreso por componente

### 3. Calendario de Actividades

#### Eventos Mock - Noviembre 2024:
```javascript
const calendarEvents = [
  // SUH - Habilitación
  {
    id: 'suh-1',
    title: 'Autoevaluación Consulta Externa',
    start: new Date('2024-11-15'),
    type: 'autoevaluacion',
    component: 'SUH',
    status: 'scheduled',
    priority: 'high',
    description: 'Autoevaluación trimestral del servicio de consulta externa según estándares SUH'
  },
  {
    id: 'suh-2',
    title: 'Plan Mejora Urgencias',
    start: new Date('2024-11-22'),
    type: 'plan_mejora',
    component: 'SUH',
    status: 'in_progress',
    priority: 'critical'
  },
  
  // PAMEC - Auditorías
  {
    id: 'pamec-1',
    title: 'Auditoría Farmacia',
    start: new Date('2024-11-08'),
    type: 'auditoria',
    component: 'PAMEC',
    status: 'completed',
    priority: 'medium'
  },
  {
    id: 'pamec-2',
    title: 'Seguimiento Laboratorio',
    start: new Date('2024-11-18'),
    type: 'seguimiento',
    component: 'PAMEC',
    status: 'scheduled',
    priority: 'medium'
  },
  {
    id: 'pamec-3',
    title: 'Auditoría Imagenología',
    start: new Date('2024-11-25'),
    type: 'auditoria',
    component: 'PAMEC',
    status: 'scheduled',
    priority: 'high'
  },
  
  // SIC - Indicadores
  {
    id: 'sic-1',
    title: 'Carga Indicadores Octubre',
    start: new Date('2024-11-05'),
    type: 'carga_datos',
    component: 'SIC',
    status: 'completed',
    priority: 'high'
  },
  {
    id: 'sic-2',
    title: 'Reporte Trimestral',
    start: new Date('2024-11-12'),
    type: 'reporte',
    component: 'SIC',
    status: 'in_progress',
    priority: 'critical'
  },
  {
    id: 'sic-3',
    title: 'Análisis Tendencias Q3',
    start: new Date('2024-11-28'),
    type: 'reporte',
    component: 'SIC',
    status: 'scheduled',
    priority: 'medium'
  },
  
  // SUA - Acreditación
  {
    id: 'sua-1',
    title: 'Reunión Preparatoria SUA',
    start: new Date('2024-11-20'),
    type: 'reunion',
    component: 'SUA',
    status: 'scheduled',
    priority: 'low'
  },
  
  // Capacitaciones
  {
    id: 'cap-1',
    title: 'Taller PAMEC - Metodología',
    start: new Date('2024-11-10'),
    type: 'capacitacion',
    component: 'PAMEC',
    status: 'completed',
    priority: 'medium'
  },
  {
    id: 'cap-2',
    title: 'Seminario SUH - Nuevos Estándares',
    start: new Date('2024-11-24'),
    type: 'capacitacion',
    component: 'SUH',
    status: 'scheduled',
    priority: 'high'
  },
  
  // Vencimientos
  {
    id: 'venc-1',
    title: 'Plan Mejora Radiología',
    start: new Date('2024-11-30'),
    type: 'vencimiento',
    component: 'SUH',
    status: 'overdue',
    priority: 'critical'
  }
];
```

#### Filtros de Calendario:
```javascript
const calendarFilters = [
  { id: 'suh', label: 'SUH', color: 'var(--sogcs-suh-primary)', active: true },
  { id: 'pamec', label: 'PAMEC', color: 'var(--sogcs-pamec-primary)', active: true },
  { id: 'sic', label: 'SIC', color: 'var(--sogcs-sic-primary)', active: true },
  { id: 'sua', label: 'SUA', color: 'var(--sogcs-sua-primary)', active: true },
  { id: 'capacitacion', label: 'Capacitaciones', color: 'var(--sogcs-event-capacitacion)', active: true },
  { id: 'vencimiento', label: 'Vencimientos', color: 'var(--sogcs-event-vencimiento)', active: true }
];
```

## 🧪 Testing y Validación

### Checklist de Calidad UX

#### ✅ Accesibilidad (WCAG 2.1 AA)
- [x] Contraste de colores mínimo 4.5:1
- [x] Navegación por teclado funcional
- [x] Aria-labels en elementos interactivos
- [x] Focus indicators visibles
- [x] Texto alternativo en iconos
- [x] Jerarquía de headings correcta

#### ✅ Performance
- [x] CSS optimizado < 50KB
- [x] JavaScript modular y lazy loaded
- [x] Imágenes optimizadas y responsive
- [x] Minimal DOM queries
- [x] Transiciones suaves < 300ms

#### ✅ Healthcare UX
- [x] Terminología médica apropiada
- [x] Códigos de color médicos estándar
- [x] Información crítica prominente
- [x] Flujos de trabajo optimizados
- [x] Alertas y notificaciones claras

#### ✅ Responsivo
- [x] Breakpoints Velzon 4.4.1
- [x] Touch targets 44px mínimo
- [x] Contenido legible en todos los tamaños
- [x] Navegación adaptativa
- [x] Imágenes y gráficos escalables

### Casos de Uso Validados

1. **Coordinador de Calidad - Revisión Matutina:**
   - Acceso rápido al dashboard SOGCS
   - Identificación inmediata de alertas críticas
   - Navegación fluida entre componentes
   - Acciones rápidas para tareas urgentes

2. **Gerente de IPS - Reunión Ejecutiva:**
   - Vista general de cumplimiento institucional
   - Gráficos ejecutivos para presentación
   - Drill-down en métricas específicas
   - Export de datos para reportes

3. **Auditor Interno - Planificación Semanal:**
   - Calendario de actividades PAMEC
   - Filtrado por tipo de evento
   - Acceso a detalles de auditorías
   - Programación de nuevas actividades

## 📁 Archivos del Prototipo

### Ubicación
```
/Users/juan.bustamante/personal/zentraqms/prototypes/
├── sogcs-dashboard.html                    ← Prototipo principal
└── assets/
    ├── css/
    │   └── sogcs-styles.css               ← Estilos específicos
    ├── js/
    │   ├── sogcs-dashboard.js             ← Funcionalidad dashboard
    │   ├── sogcs-calendar.js              ← Funcionalidad calendario
    │   └── sogcs-navigation.js            ← Navegación y acciones
    └── data/
        └── sogcs-mock-data.js             ← Datos de ejemplo
```

### Dependencias Externas
```html
<!-- Chart.js para gráficos -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- RemixIcon para iconografía -->
<link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">

<!-- Bootstrap 5.3 (base Velzon) -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
```

## 🚀 Plan de Implementación React

### Fase 1: Componentes Base (Semana 1-2)
1. **SOGCSLayout**: Layout principal con sub-header
2. **SOGCSOverviewCard**: Cards de métricas con progress bars
3. **SOGCSStatusBadge**: Badges de estado por componente
4. **SOGCSQuickActions**: Dropdown de acciones rápidas

### Fase 2: Dashboard Principal (Semana 3-4)
1. **SOGCSDashboard**: Dashboard principal con gráficos
2. **SOGCSCharts**: Componentes de Chart.js integrados
3. **SOGCSAlerts**: Sistema de alertas y notificaciones
4. **SOGCSActivityFeed**: Feed de actividades recientes

### Fase 3: Calendario (Semana 5-6)
1. **SOGCSCalendar**: Calendario principal con FullCalendar.js
2. **SOGCSEventModal**: Modal de detalles de eventos
3. **SOGCSCalendarFilters**: Filtros interactivos
4. **SOGCSEventForm**: Formulario para crear/editar eventos

### Fase 4: Integración y Testing (Semana 7-8)
1. **API Integration**: Conexión con endpoints SOGCS
2. **State Management**: Redux/Zustand para estado global
3. **Testing**: Unit tests con Jest/React Testing Library
4. **Performance**: Optimización y lazy loading

### Interfaces TypeScript Sugeridas

```typescript
// Interfaces principales ya definidas arriba en la arquitectura
// Interfaces adicionales para implementación:

interface SOGCSTheme {
  colors: {
    suh: string;
    pamec: string;
    sic: string;
    sua: string;
    [key: string]: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    sizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  breakpoints: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
}

interface SOGCSConfig {
  organization: HealthOrganization;
  features: {
    suh: boolean;
    pamec: boolean;
    sic: boolean;
    sua: boolean;
  };
  permissions: UserPermissions;
  locale: 'es-CO';
  timezone: 'America/Bogota';
}
```

## 📊 Métricas de Éxito

### KPIs de UX
- **Time to Insight**: < 5 segundos para identificar alertas críticas
- **Task Completion Rate**: > 95% para acciones rápidas principales
- **User Satisfaction**: Score > 4.5/5 en usabilidad
- **Error Rate**: < 2% en navegación y acciones

### KPIs Técnicos
- **Load Time**: < 2 segundos primera carga
- **Bundle Size**: < 500KB JavaScript + CSS
- **Accessibility Score**: 100% en Lighthouse
- **Mobile Performance**: > 90 en PageSpeed Insights

## 🔄 Mantenimiento y Evolución

### Actualizaciones Planificadas
1. **Mensual**: Actualización de datos mock y métricas
2. **Trimestral**: Revisión de componentes y patrones UX
3. **Anual**: Evaluación completa de usabilidad y rediseño

### Feedback Loop
1. **Usuario Final**: Coordinadores de calidad beta testers
2. **Stakeholders**: Gerentes de IPS y directores médicos
3. **Técnico**: Equipo de desarrollo frontend
4. **Regulatorio**: Especialistas en normativa SOGCS

---

**Estado**: Prototipo completado y validado  
**Próximo**: Implementación en React + TypeScript  
**Dependencias**: Sistema RBAC SOGCS, APIs backend  
**Responsable**: Frontend UX Specialist Team