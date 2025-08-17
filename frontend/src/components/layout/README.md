# Arquitectura de Layout Modular - ZentraQMS

Esta documentación explica cómo usar la nueva arquitectura de layout consistente para todas las páginas de ZentraQMS.

## 🏗️ Componentes Principales

### 1. ModuleLayout
Componente principal que maneja el layout consistente con breadcrumb y subheader.

### 2. DashboardLayout
Wrapper que combina Layout principal con ModuleLayout.

### 3. Configuración de Módulos
Sistema centralizado para configurar breadcrumb y subheader por módulo.

## 📋 Uso Básico

### Opción 1: Usar DashboardLayout (Recomendado)
```typescript
import DashboardLayout from '../../components/layout/DashboardLayout';

const MyPage = () => {
  return (
    <DashboardLayout moduleName="sogcs">
      <div className="row">
        {/* Tu contenido aquí */}
      </div>
    </DashboardLayout>
  );
};
```

### Opción 2: Usar ModuleLayout directamente
```typescript
import ModuleLayout from '../../components/layout/ModuleLayout';
import { useModuleConfig } from '../../hooks/useModuleConfig';

const MyPage = () => {
  const moduleConfig = useModuleConfig('sogcs');
  
  return (
    <ModuleLayout module={moduleConfig}>
      <div className="row">
        {/* Tu contenido aquí */}
      </div>
    </ModuleLayout>
  );
};
```

## 🎨 Configuración por Módulo

### Módulos Predefinidos
- `sogcs` - Con subheader de navegación
- `dashboard` - Dashboard principal
- `organization` - Gestión organizacional
- `processes` - Gestión de procesos
- `audits` - Sistema de auditorías
- `indicators` - Métricas y KPIs
- `normogram` - Marco normativo
- `profile` - Perfil de usuario

### Configuración Personalizada
```typescript
const customConfig = useModuleConfig('sogcs', {
  breadcrumb: {
    title: 'Mi Título',
    pageTitle: 'Mi Subtítulo'
  },
  subheader: {
    component: MyCustomSubHeader,
    props: { activeTab: 'custom' }
  }
});
```

## 🔧 Hooks Especializados

### useSOGCSConfig
Hook específico para páginas SOGCS con configuración de tab activo:
```typescript
const moduleConfig = useSOGCSConfig('dashboard'); // activeTab = 'dashboard'
```

## 📝 Ejemplo Completo - Página SOGCS

```typescript
import React from 'react';
import { useSOGCSConfig } from '../../../hooks/useModuleConfig';
import ModuleLayout from '../../../components/layout/ModuleLayout';

const SOGCSPage = () => {
  const moduleConfig = useSOGCSConfig('suh'); // Tab activo: SUH
  
  return (
    <ModuleLayout module={moduleConfig}>
      {/* Contenido específico de SUH */}
      <div className="row">
        <div className="col-12">
          <h2>Sistema Único de Habilitación</h2>
        </div>
      </div>
    </ModuleLayout>
  );
};
```

## 🎯 Beneficios

1. **Consistencia**: Mismo layout y estilos en todas las páginas
2. **Mantenibilidad**: Configuración centralizada
3. **Flexibilidad**: Fácil personalización por módulo
4. **Escalabilidad**: Fácil agregar nuevos módulos
5. **Reutilización**: Componentes reutilizables

## 🔄 Migración de Páginas Existentes

### Antes
```typescript
const MyPage = () => (
  <div className="page-content">
    <div className="container-fluid">
      <BreadCrumb title="Mi Título" pageTitle="Mi Subtítulo" />
      {/* contenido */}
    </div>
  </div>
);
```

### Después
```typescript
const MyPage = () => {
  const moduleConfig = useModuleConfig('mymodule');
  return (
    <ModuleLayout module={moduleConfig}>
      {/* contenido */}
    </ModuleLayout>
  );
};
```

## 📚 Agregar Nuevo Módulo

1. Agregar configuración en `moduleConfigs.ts`:
```typescript
mymodule: {
  breadcrumb: {
    title: 'Mi Módulo',
    pageTitle: 'Gestión de Mi Módulo'
  },
  pageContentClass: 'page-content'
}
```

2. Agregar detección de ruta en `useModuleConfig.ts`:
```typescript
if (path.startsWith('/mymodule')) return 'mymodule';
```

3. Usar en las páginas:
```typescript
const moduleConfig = useModuleConfig('mymodule');
```