# 🎨 ZentraQMS Frontend Design Patterns

## 📋 Tabla de Contenidos

1. [Arquitectura de Componentes](#arquitectura-de-componentes)
2. [Patrones de Layout y Navegación](#patrones-de-layout-y-navegación)
3. [Patrones de Formularios](#patrones-de-formularios)
4. [Patrones de Modales e Interacciones](#patrones-de-modales-e-interacciones)
5. [Gestión de Estado](#gestión-de-estado)
6. [Integración de APIs y Fetching](#integración-de-apis-y-fetching)
7. [Manejo de Errores y Estados de Carga](#manejo-de-errores-y-estados-de-carga)
8. [Diseño Responsive](#diseño-responsive)
9. [Integración con Velzon](#integración-con-velzon)
10. [Plantillas y Guías de Implementación](#plantillas-y-guías-de-implementación)

---

## 🏗️ Arquitectura de Componentes

### Jerarquía de Componentes Establecida

Basado en el análisis de la interfaz SOGCS sedes, se ha identificado la siguiente arquitectura:

```
Page Component (SedesPage)
├── LayoutWithBreadcrumb (Layout principal)
├── Modals (Estado persistente)
│   ├── SedeFormModal (Crear/Editar)
│   ├── SedeDetailModal (Vista detallada)
│   ├── DeleteModal (Confirmación eliminación)
│   └── SedesImporter (Importación masiva)
├── SimpleTable (Tabla de datos)
├── Navigation Tabs (Filtros de estado)
└── Action Buttons (Crear, Importar, Acciones bulk)
```

### Principios de Diseño de Componentes

1. **Componentes Funcionales con Hooks**: Todos los componentes utilizan React Hooks
2. **Separación de Responsabilidades**: Cada componente tiene una responsabilidad específica
3. **Props Tipadas**: TypeScript estricto para todas las interfaces
4. **Estado Local vs Global**: Estado local para UI, estado global para datos
5. **Reutilización**: Componentes genéricos como SimpleTable, DeleteModal

---

## 🎯 Patrones de Layout y Navegación

### 1. Layout Principal: LayoutWithBreadcrumb

**Ubicación**: `/frontend/src/components/layout/LayoutWithBreadcrumb.tsx`

**Características**:
- Posicionamiento fijo de breadcrumb y subheader
- Responsive con sidebar colapsible
- MutationObserver para cambios dinámicos de sidebar
- Cálculo automático de padding del contenido

**Uso Estándar**:
```typescript
<LayoutWithBreadcrumb moduleConfig={customModuleConfig}>
  {/* Contenido de la página */}
</LayoutWithBreadcrumb>
```

### 2. Configuración de Módulos

**Ubicación**: `/frontend/src/config/moduleConfigs.ts`

**Patrón de Configuración**:
```typescript
const customModuleConfig = {
  ...moduleConfig,
  breadcrumb: {
    title: 'SOGCS',
    pageTitle: 'Gestión de Sedes',
    links: [
      { name: 'SOGCS', url: '/sogcs/dashboard' },
      { name: 'Configuración', url: '#' },
      { name: 'Sedes' }
    ]
  }
};
```

### 3. Sistema de Pestañas (Tabs)

**Patrón Implementado**:
```typescript
// Estado de tab activo
const [activeTab, setActiveTab] = useState("1");

// Toggle de tabs
const toggleTab = (tab: string) => {
  if (activeTab !== tab) {
    setActiveTab(tab);
  }
};

// Filtrado de datos basado en tab
const filteredData = useMemo(() => {
  switch (activeTab) {
    case "2": return data.filter(item => item.status === 'habilitada');
    case "3": return data.filter(item => item.status === 'suspendida');
    default: return data;
  }
}, [data, activeTab]);
```

---

## 📝 Patrones de Formularios

### 1. Modal de Formulario Multi-Paso

**Basado en**: `SedeFormModal.tsx`

**Características**:
- Wizard de 4 pasos con validación por paso
- Estado unificado del formulario
- Validación en tiempo real
- Progress indicator visual

**Estructura del Estado**:
```typescript
interface FormPageState {
  showCreateModal: boolean;
  showImportModal: boolean;
  showDetailModal: boolean;
  selectedItem: ItemType | null;
  isEditMode: boolean;
}

const [state, setState] = useState<FormPageState>({
  showCreateModal: false,
  showImportModal: false,
  showDetailModal: false,
  selectedItem: null,
  isEditMode: false,
});
```

### 2. Patrón de Validación

**Validación por Pasos**:
```typescript
const validateCurrentStep = (): boolean => {
  const errors: Record<string, string> = {};
  
  switch (currentStep) {
    case 1: // Información básica
      if (!formData.requiredField?.trim()) {
        errors.requiredField = 'Campo obligatorio';
      }
      break;
    // ... más casos
  }
  
  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};
```

### 3. Manejo de Cambios de Input

```typescript
const handleInputChange = (field: keyof FormData, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  
  // Limpiar error de validación
  if (validationErrors[field]) {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }
};
```

---

## 🖼️ Patrones de Modales e Interacciones

### 1. Modal de Confirmación (DeleteModal)

**Patrón Estándar**:
```typescript
<DeleteModal
  show={deleteModal}
  onDeleteClick={handleDeleteItem}
  onCloseClick={() => setDeleteModal(false)}
/>
```

### 2. Modal de Detalles (SedeDetailModal)

**Características**:
- Carga lazy de datos detallados
- Diseño en tarjetas informativas
- Acciones integradas (Editar, Imprimir)
- Estado de carga y error

**Patrón de Renderizado de Tarjetas**:
```typescript
const renderInfoCard = (
  title: string, 
  icon: string, 
  children: React.ReactNode, 
  headerColor: string = "primary"
) => (
  <div className="card border-0 shadow-lg mb-3">
    <div className={`card-header bg-${headerColor}`}>
      <h6 className="card-title">
        <i className={icon}></i>
        {title}
      </h6>
    </div>
    <div className="card-body">
      {children}
    </div>
  </div>
);
```

### 3. Modal de Importación

**Patrón de Modal Personalizado**:
```typescript
{state.showImportModal && (
  <div className="modal fade show" 
       style={{ display: 'block', zIndex: 1055 }}>
    <div className="modal-dialog modal-xl">
      <div className="modal-content">
        {/* Header, Body, Footer */}
      </div>
    </div>
  </div>
)}
```

---

## 🔄 Gestión de Estado

### 1. Zustand Store Pattern

**Basado en**: `sedeStore.ts`

**Estructura del Store**:
```typescript
interface StoreState {
  // Datos
  items: ItemType[];
  currentItem: ItemType | null;
  
  // Estados de UI
  loading: boolean;
  error: string | null;
  filters: FilterType;
  pagination: PaginationType;
  
  // Acciones CRUD
  fetchItems: (filters?) => Promise<void>;
  createItem: (data) => Promise<ItemType>;
  updateItem: (id, data) => Promise<ItemType>;
  deleteItem: (id) => Promise<void>;
  
  // Acciones Bulk
  bulkDeleteItems: (ids) => Promise<void>;
  importItems: (config) => Promise<void>;
  
  // Utilidades
  clearError: () => void;
  reset: () => void;
}
```

### 2. Estado Local de Página

**Patrón de Estado Unificado**:
```typescript
interface PageState {
  showCreateModal: boolean;
  showDetailModal: boolean;
  selectedItem: ItemType | null;
  isEditMode: boolean;
}

const [state, setState] = useState<PageState>({
  showCreateModal: false,
  showDetailModal: false,
  selectedItem: null,
  isEditMode: false,
});
```

### 3. Hooks Customizados

**useModuleConfig Hook**:
```typescript
export const useModuleConfig = (
  moduleName?: string,
  overrides?: Partial<ModuleConfig>
): ModuleConfig => {
  const location = useLocation();
  
  const detectedModule = useMemo(() => {
    if (moduleName) return moduleName;
    // Auto-detección basada en ruta
    return detectModuleFromPath(location.pathname);
  }, [location.pathname, moduleName]);
  
  return useMemo(() => {
    if (overrides) {
      return createModuleConfig(detectedModule, overrides);
    }
    return getModuleConfig(detectedModule);
  }, [detectedModule, overrides]);
};
```

---

## 🌐 Integración de APIs y Fetching

### 1. Patrón de Carga Inicial

```typescript
useEffect(() => {
  if (organization?.id) {
    fetchItems();
  }
}, [organization?.id, fetchItems]);
```

### 2. Manejo de Errores con Toast

```typescript
useEffect(() => {
  if (error) {
    toast.error(error);
    clearError();
  }
}, [error, clearError]);
```

### 3. Operaciones CRUD Optimistas

```typescript
const handleSaveItem = useCallback(async (formData: FormData) => {
  try {
    if (state.isEditMode && state.selectedItem) {
      await updateItem(state.selectedItem.id, formData);
      toast.success('Item actualizado exitosamente');
    } else {
      await createItem(formData);
      toast.success('Item creado exitosamente');
    }
    handleCloseModal();
  } catch (error) {
    toast.error('Error al guardar el item');
  }
}, [state.isEditMode, state.selectedItem, updateItem, createItem]);
```

---

## ⚠️ Manejo de Errores y Estados de Carga

### 1. Estados de Carga

**Loading Spinner Estándar**:
```typescript
if (organizationLoading || (loading && !items.length)) {
  return (
    <LayoutWithBreadcrumb moduleConfig={moduleConfig}>
      <div className="d-flex justify-content-center align-items-center" 
           style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2 text-muted">Cargando datos...</p>
        </div>
      </div>
    </LayoutWithBreadcrumb>
  );
}
```

### 2. Estados de Error

**Error Boundary Pattern**:
```typescript
if (organizationError && !hasOrganization) {
  return (
    <LayoutWithBreadcrumb moduleConfig={moduleConfig}>
      <div className="d-flex justify-content-center align-items-center">
        <div className="text-center">
          <i className="ri-building-line display-4 text-warning mb-3"></i>
          <h5 className="text-warning">Problema con la Organización</h5>
          <p className="text-muted mb-3">{organizationError}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            <i className="ri-refresh-line me-1"></i>
            Intentar de Nuevo
          </button>
        </div>
      </div>
    </LayoutWithBreadcrumb>
  );
}
```

### 3. Estados Vacíos

**Empty State Pattern**:
```typescript
{filteredItems.length === 0 ? (
  <div className="mt-4 text-center py-4">
    <i className="ri-building-line display-4 text-muted mb-3"></i>
    <h5 className="text-muted">No hay items registrados</h5>
    <p className="text-muted mb-3">
      {activeTab === "1" 
        ? "No se han registrado items para esta organización."
        : "No hay items con el estado seleccionado."}
    </p>
    {activeTab === "1" && hasOrganization && (
      <button className="btn btn-primary" onClick={handleCreateItem}>
        <i className="ri-add-line me-1"></i>
        Crear Primer Item
      </button>
    )}
  </div>
) : (
  <SimpleTable columns={columns} data={filteredItems} />
)}
```

---

## 📱 Diseño Responsive

### 1. Breakpoints de Velzon

```scss
// Breakpoints utilizados
xs: 0px
sm: 576px
md: 768px
lg: 992px
xl: 1200px
xxl: 1400px
```

### 2. Layout Responsive

**Grid System**:
```typescript
<div className="row">
  <div className="col-lg-6">
    {/* Campos de formulario */}
  </div>
  <div className="col-lg-6">
    {/* Más campos */}
  </div>
</div>
```

### 3. Componentes Adaptativos

**Sidebar Responsive**:
```typescript
const getLeftPosition = () => {
  if (window.innerWidth < 992) {
    return '0'; // Mobile: desde el borde izquierdo
  }
  return sidebarCollapsed 
    ? 'var(--vz-vertical-menu-width-sm)' 
    : 'var(--vz-vertical-menu-width)';
};
```

---

## 🎨 Integración con Velzon

### 1. Sistema de Colores

```scss
// Colores principales de Velzon
$primary: #405189 (Indigo)
$secondary: #3577f1 (Blue)
$success: #0ab39c (Green)
$warning: #f7b84b (Yellow)
$danger: #f06548 (Red)
```

### 2. Componentes de Velzon Utilizados

**SimpleTable**: Tabla con paginación, filtros y ordenamiento
**DeleteModal**: Modal de confirmación estándar
**Toast Notifications**: Sistema de notificaciones
**Bootstrap Classes**: Grid, utilidades, componentes

### 3. Iconografía RemixIcon

**Patrones de Iconos**:
```typescript
// Acciones CRUD
<i className="ri-add-line"></i>      // Crear
<i className="ri-edit-2-fill"></i>   // Editar
<i className="ri-eye-fill"></i>      // Ver
<i className="ri-delete-bin-5-fill"></i> // Eliminar

// Estados
<i className="ri-check-line"></i>    // Éxito/Habilitado
<i className="ri-time-line"></i>     // En proceso
<i className="ri-close-line"></i>    // Error/Suspendido
```

---

## 📋 Plantillas y Guías de Implementación

### 1. Plantilla de Página CRUD

```typescript
const ItemsPage = () => {
  document.title = "Items - Module | ZentraQMS";
  
  // Hooks principales
  const { organization, hasOrganization } = useCurrentOrganization();
  const { items, loading, error, fetchItems, createItem, updateItem, deleteItem } = useItemStore();
  
  // Estado local
  const [activeTab, setActiveTab] = useState("1");
  const [state, setState] = useState<PageState>({
    showCreateModal: false,
    showDetailModal: false,
    selectedItem: null,
    isEditMode: false,
  });
  
  // Configuración del módulo
  const moduleConfig = useModuleConfig('module-name');
  
  // Efectos
  useEffect(() => {
    if (organization?.id) {
      fetchItems();
    }
  }, [organization?.id, fetchItems]);
  
  // Handlers...
  
  // Estados de loading y error...
  
  return (
    <LayoutWithBreadcrumb moduleConfig={moduleConfig}>
      {/* Modales */}
      {/* Contenido principal */}
    </LayoutWithBreadcrumb>
  );
};
```

### 2. Checklist de Implementación

**Para una nueva página CRUD**:

- [ ] **Layout y Navegación**
  - [ ] Usar `LayoutWithBreadcrumb`
  - [ ] Configurar módulo en `moduleConfigs.ts`
  - [ ] Implementar breadcrumb personalizado si es necesario
  
- [ ] **Estado y Datos**
  - [ ] Crear/usar Zustand store
  - [ ] Implementar estado local de página
  - [ ] Configurar hooks de organización
  
- [ ] **Formularios**
  - [ ] Modal de creación/edición
  - [ ] Validación por pasos si es complejo
  - [ ] Manejo de errores de validación
  
- [ ] **Tabla de Datos**
  - [ ] Usar `SimpleTable`
  - [ ] Configurar columnas con tipos
  - [ ] Implementar acciones por fila
  - [ ] Sistema de tabs para filtros
  
- [ ] **Interacciones**
  - [ ] Modal de confirmación para eliminación
  - [ ] Modal de detalles si es necesario
  - [ ] Sistema de bulk actions
  - [ ] Importación/exportación si aplica
  
- [ ] **UX y Feedback**
  - [ ] Estados de carga
  - [ ] Estados de error
  - [ ] Estados vacíos
  - [ ] Toast notifications
  - [ ] Confirmaciones de acciones
  
- [ ] **Responsive y Accesibilidad**
  - [ ] Pruebas en móvil
  - [ ] Atributos ARIA
  - [ ] Navegación por teclado
  - [ ] Contraste de colores

### 3. Patrón de Columnas de Tabla

```typescript
const columns = useMemo(() => [
  {
    header: (
      <input 
        type="checkbox" 
        id="checkBoxAll" 
        className="form-check-input" 
        onClick={checkedAll} 
      />
    ),
    accessorKey: '#',
    enableSorting: false,
    cell: (value: any, row: ItemType) => (
      <input 
        type="checkbox" 
        className="itemCheckBox form-check-input" 
        value={row.id} 
        onChange={(e) => handleCheckboxChange(row.id, e.target.checked)} 
      />
    ),
  },
  {
    header: "Nombre",
    accessorKey: "name",
    cell: (value: any, row: ItemType) => (
      <div>
        <span className="fw-medium">{value}</span>
        {row.isMain && (
          <span className="badge bg-success-subtle text-success ms-2 small">
            Principal
          </span>
        )}
      </div>
    ),
  },
  {
    header: "Estado",
    accessorKey: "status",
    cell: (value: any) => (
      <span className={`badge ${getStatusBadgeClass(value)}`}>
        {getStatusLabel(value)}
      </span>
    ),
  },
  {
    header: "Acciones",
    accessorKey: "acciones",
    enableSorting: false,
    cell: (value: any, row: ItemType) => (
      <ul className="list-inline hstack gap-2 mb-0">
        <li className="list-inline-item">
          <button
            className="btn btn-primary btn-sm btn-icon"
            onClick={() => handleViewItem(row)}
            title="Ver detalles"
          >
            <i className="ri-eye-fill"></i>
          </button>
        </li>
        <li className="list-inline-item edit">
          <button
            className="btn btn-success btn-sm btn-icon"
            onClick={() => handleEditItem(row)}
            title="Editar"
          >
            <i className="ri-pencil-fill"></i>
          </button>
        </li>
        <li className="list-inline-item">
          <button
            className="btn btn-danger btn-sm btn-icon"
            onClick={() => onClickDelete(row)}
            title="Eliminar"
          >
            <i className="ri-delete-bin-5-fill"></i>
          </button>
        </li>
      </ul>
    ),
  },
], [/* dependencias */]);
```

---

## 🚀 Mejores Prácticas

### 1. Convenciones de Naming

- **Componentes**: PascalCase (`SedeFormModal`)
- **Hooks**: camelCase con prefijo `use` (`useSedeStore`)
- **Interfaces**: PascalCase con sufijo (`SedeFormData`)
- **Constants**: UPPER_SNAKE_CASE (`TIPO_SEDE_OPTIONS`)

### 2. Organización de Archivos

```
/src
  /components
    /common       # Componentes reutilizables
    /forms        # Formularios específicos
    /layout       # Layouts y navegación
    /modals       # Modales específicos
  /hooks          # Custom hooks
  /stores         # Zustand stores
  /types          # Interfaces TypeScript
  /config         # Configuraciones
  /pages          # Páginas principales
```

### 3. Performance

- **useMemo** para cálculos costosos
- **useCallback** para funciones que se pasan como props
- **Lazy loading** para modales pesados
- **Debounce** para búsquedas en tiempo real

### 4. Accesibilidad

- **ARIA labels** en botones de acción
- **Role attributes** en alertas y estados
- **Keyboard navigation** en formularios
- **Focus management** en modales

---

## 📚 Referencias

- **Velzon Template**: `/Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/`
- **Documentación Velzon**: Consultar guía específica de componentes
- **RemixIcon**: [https://remixicon.com/](https://remixicon.com/)
- **Bootstrap 5**: [https://getbootstrap.com/docs/5.3/](https://getbootstrap.com/docs/5.3/)
- **React Hook Form**: Para formularios complejos (futuro)
- **React Query**: Para gestión de estado servidor (consideración futura)

---

*Documento creado basado en el análisis de la interfaz SOGCS sedes (`/frontend/src/pages/sogcs/configuracion/sedes/index.tsx`) y componentes relacionados.*

*Última actualización: 2025-08-21*