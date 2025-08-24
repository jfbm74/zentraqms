# Módulo de Organigramas Organizacionales

## 📋 Resumen

Implementación completa del frontend para el módulo de organigramas organizacionales de ZentraQMS, utilizando React 19 + TypeScript 5.3 + d3-org-chart, siguiendo los patrones de diseño establecidos y usando componentes del sistema Velzon 4.4.1.

## 🏗️ Arquitectura

### Estructura de Archivos

```
frontend/src/
├── components/OrganizationalChart/
│   ├── OrganizationalChart.tsx           # Componente principal con d3-org-chart
│   ├── EmployeeCard.tsx                  # Tarjeta individual de empleado/cargo
│   ├── DepartmentNavigation.tsx          # Navegación lateral por departamentos
│   ├── ChartControls.tsx                 # Controles de zoom, vista y exportación
│   ├── ComplianceIndicator.tsx           # Indicadores de cumplimiento SOGCS
│   ├── modals/
│   │   ├── PositionFormModal.tsx         # Modal para crear/editar cargos
│   │   └── AssignUserModal.tsx           # Modal para asignar usuarios
│   ├── wizard/
│   │   └── OrganizationalChartWizard.tsx # Wizard de configuración inicial
│   ├── index.ts                          # Exportaciones del módulo
│   └── README.md                         # Este archivo
├── pages/OrganizationalChart/
│   ├── OrganizationalChartView.tsx       # Vista principal del organigrama
│   └── index.tsx                         # Wrapper con LayoutWithBreadcrumb
├── services/organizationalChart/
│   └── organizationalChartService.ts     # Servicios API
├── stores/organizationalChart/
│   └── organizationalChartStore.ts       # Store Zustand
└── types/organizationalChart/
    └── index.ts                          # Tipos TypeScript
```

## 🚀 Funcionalidades Implementadas

### ✅ Completado (Fase 3)

1. **Dependencias y Configuración**
   - ✅ Instalación de d3-org-chart v3.1.1
   - ✅ Configuración con React 19 y TypeScript 5.3
   - ✅ Integración con sistema de diseño Velzon

2. **Servicios API**
   - ✅ Cliente HTTP con interceptores de autenticación
   - ✅ Servicios para sectores, plantillas, organigramas, áreas y cargos
   - ✅ Transformación de datos para d3-org-chart
   - ✅ Manejo de errores y estados de carga

3. **Tipos TypeScript**
   - ✅ Interfaces completas para todos los modelos
   - ✅ Tipos para d3-org-chart y visualización
   - ✅ Tipos para formularios y estados
   - ✅ Enums y constantes del dominio

4. **Store de Estado (Zustand)**
   - ✅ Gestión centralizada de estado
   - ✅ Acciones CRUD completas
   - ✅ Estados de carga y error
   - ✅ Configuración de vista y filtros
   - ✅ Hooks especializados

5. **Componentes Base**
   - ✅ `OrganizationalChart`: Visualización interactiva con d3-org-chart
   - ✅ `EmployeeCard`: Nodos individuales personalizables
   - ✅ `DepartmentNavigation`: Navegación jerárquica con estadísticas
   - ✅ `ChartControls`: Controles completos de zoom, vista y filtros
   - ✅ `ComplianceIndicator`: Indicadores SOGCS para sector salud

6. **Vistas y Layouts**
   - ✅ `OrganizationalChartView`: Vista principal integrada
   - ✅ Integración con `LayoutWithBreadcrumb`
   - ✅ Configuración de módulo en `moduleConfigs.ts`
   - ✅ Responsive design completo (320px - desktop)

7. **Modales**
   - ✅ `PositionFormModal`: Crear/editar cargos
   - ✅ `AssignUserModal`: Asignar usuarios a cargos
   - ✅ Validaciones completas y manejo de errores

8. **Wizard de Configuración**
   - ✅ Proceso paso a paso para creación de organigramas
   - ✅ Selección de plantillas vs. creación desde cero
   - ✅ Configuración por sector
   - ✅ Integración con backend

9. **Routing**
   - ✅ Rutas integradas en App.tsx
   - ✅ Protección con permisos RBAC
   - ✅ Navegación entre vistas

10. **Responsive Design**
    - ✅ Mobile-first approach
    - ✅ Breakpoints desde 320px hasta desktop
    - ✅ Sidebars colapsables
    - ✅ Controles adaptables

### ⏳ Pendiente (Fases Futuras)

11. **Drag & Drop** (Fase 4)
    - 🔄 Reorganización de nodos arrastrando
    - 🔄 Validaciones de jerarquía
    - 🔄 Persistencia de cambios

12. **Validación en Tiempo Real** (Fase 4)
    - 🔄 WebSocket para actualizaciones en vivo
    - 🔄 Validación de cumplimiento automática
    - 🔄 Notificaciones de cambios

13. **Exportación Avanzada** (Fase 5)
    - 🔄 Exportación PDF con metadatos
    - 🔄 Exportación PNG de alta calidad
    - 🔄 Configuración avanzada de exportación

## 🎨 Patrones de Diseño Aplicados

### Componentes Velzon Utilizados
- ✅ Cards y modales del sistema de diseño
- ✅ Formularios y controles Bootstrap 5
- ✅ Sistema de colores y tipografía HKGrotesk + Poppins
- ✅ Iconografía RemixIcon
- ✅ Patrones de espaciado y responsive

### Arquitectura Frontend
- ✅ Separación de responsabilidades (Services, Stores, Components)
- ✅ Composición de componentes reutilizables
- ✅ Hooks personalizados para lógica de negocio
- ✅ Estados de carga y error consistentes

### UX para Healthcare
- ✅ Indicadores de cumplimiento SOGCS
- ✅ Navegación intuitiva para profesionales de salud
- ✅ Información jerárquica clara
- ✅ Accesibilidad WCAG 2.1 AA

## 🔧 Uso del Módulo

### Navegación
- **Vista principal**: `/organization/chart`
- **Crear organigrama**: `/organization/charts/new`
- **Editar organigrama**: `/organization/charts/:id/edit`
- **Ver organigrama específico**: `/organization/charts/:id`

### Componentes Principales

```typescript
import {
  OrganizationalChart,
  EmployeeCard,
  DepartmentNavigation,
  ChartControls,
  ComplianceIndicator,
  useOrganizationalChartStore
} from '../components/OrganizationalChart';

// Uso básico
function MyComponent() {
  const { chartData } = useOrganizationalChartStore();
  
  return (
    <OrganizationalChart
      chartData={chartData}
      onNodeClick={handleNodeClick}
    />
  );
}
```

### Store de Estado

```typescript
import { useOrganizationalChartStore } from '../stores/organizationalChart/organizationalChartStore';

function MyComponent() {
  const {
    currentChart,
    loading,
    loadChart,
    createChart
  } = useOrganizationalChartStore();
  
  // Cargar organigrama
  useEffect(() => {
    loadChart('chart-id');
  }, []);
}
```

## 🛠️ Configuración del Desarrollo

### Dependencias Añadidas
```json
{
  "d3-org-chart": "^3.1.1",
  "d3": "^7.9.0",
  "@types/d3": "^7.4.3"
}
```

### Scripts de Desarrollo
```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Tests
npm run test
```

## 🎯 Próximos Pasos

### Fase 4: Interactividad Avanzada
1. Implementar drag & drop para reorganización
2. Agregar validación en tiempo real
3. Mejorar indicadores de cumplimiento

### Fase 5: Exportación y Reportes
1. Exportación PDF/PNG completa
2. Reportes de estructura organizacional
3. Análisis de cumplimiento automatizado

### Fase 6: Integración Avanzada
1. Integración con módulo de procesos
2. Matriz RACI interactiva
3. Dashboard ejecutivo de estructura

## 📚 Documentación Relacionada

- [Backend Implementation](../../../backend/apps/organization/models/organizational_chart.py)
- [UI Design Patterns](../../../claude-modules/organization/organizational-chart/ui-design-patterns.claude.md)
- [Technical Architecture](../../../claude-modules/organization/organizational-chart/architecture.claude.md)
- [Velzon Integration Guide](../../../claude-modules/frontend/velzon-guide.claude.md)

## 🤝 Contribución

Para contribuir al módulo de organigramas:

1. Seguir las convenciones establecidas en `/claude-modules/conventions.claude.md`
2. Usar componentes Velzon existentes antes de crear nuevos
3. Mantener consistencia con el diseño del sistema
4. Incluir tests para nuevas funcionalidades
5. Documentar cambios significativos

---

💡 **Nota**: Este módulo está diseñado específicamente para instituciones de salud colombianas, cumpliendo con normativas SOGCS y estándares ISO 9001:2015.