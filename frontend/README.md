# ZentraQMS Frontend

![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3.svg)
![Tests](https://img.shields.io/badge/Tests-113%20passing-green.svg)

## 📋 Descripción

Frontend de ZentraQMS - Sistema de Gestión de Calidad construido con React 19, TypeScript y Vite. Utiliza la plantilla Velzon 4.4.1 como base de UI.

## 🚀 Características Principales

### Sistema de Autenticación y Autorización (RBAC)

- ✅ **Autenticación JWT** con refresh tokens automático
- ✅ **Control de Acceso Basado en Roles (RBAC)** completo
- ✅ **Permisos granulares** con soporte para wildcards
- ✅ **UI adaptativa** según permisos del usuario
- ✅ **Cache de permisos** en sessionStorage con TTL
- ✅ **Componentes de autorización** reutilizables

### Módulos Implementados

- 📊 **Dashboard** - Dashboards diferenciados por rol
- 🔐 **Login/Logout** - Sistema completo de autenticación
- 👤 **Perfil de Usuario** - Gestión de perfil personal
- 🚫 **Acceso Denegado** - Página para intentos no autorizados
- 📋 **Gestión de Procesos** - (En desarrollo)
- 🔍 **Auditorías** - (En desarrollo)
- 📚 **Normograma** - (En desarrollo)
- 📈 **Indicadores** - (En desarrollo)

## 🛠️ Stack Tecnológico

- **React 19** - Biblioteca de UI
- **TypeScript 5.6** - Tipado estático
- **Vite 6.0** - Build tool y dev server
- **Bootstrap 5.3** - Framework CSS (Velzon template)
- **Axios** - Cliente HTTP con interceptores
- **React Router 7** - Enrutamiento
- **React Toastify** - Notificaciones
- **Remix Icons** - Iconos
- **Vitest** - Testing framework

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Preview de producción
npm run preview
```

## 🧪 Testing

```bash
# Ejecutar tests
npm run test

# Tests con cobertura
npm run test:coverage

# UI interactiva de tests
npm run test:ui

# Tests en modo CI
npm run test:ci
```

### Cobertura Actual
- ✅ 113 tests pasando
- ✅ 100% de los hooks de autenticación
- ✅ 100% del servicio de autenticación
- ✅ Componentes principales con tests básicos

## 🔐 Sistema RBAC - Guía de Uso

### Componentes de Autorización

#### PermissionGate
```tsx
import { PermissionGate } from '@/components/common/PermissionGate';

// Verificar un permiso específico
<PermissionGate permission="documents.create">
  <CreateButton />
</PermissionGate>

// Verificar múltiples permisos (necesita cualquiera)
<PermissionGate permissions={['documents.create', 'documents.update']}>
  <ManageDocuments />
</PermissionGate>

// Verificar todos los permisos (necesita todos)
<PermissionGate requireAllPermissions={['documents.read', 'documents.export']}>
  <ExportDocuments />
</PermissionGate>

// Verificar rol
<PermissionGate role="admin">
  <AdminPanel />
</PermissionGate>

// Con fallback personalizado
<PermissionGate 
  permission="reports.export" 
  fallback={<NoPermissionMessage />}
  hideOnDeny={false}
>
  <ExportButton />
</PermissionGate>

// Con loading state
<PermissionGate 
  permission="documents.delete"
  showLoading={true}
  loadingComponent={<CustomLoader />}
>
  <DeleteButton />
</PermissionGate>
```

#### usePermissions Hook
```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const {
    // Verificación de permisos
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Verificación de roles
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Utilidades de recursos
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
    
    // Información del usuario
    getUserCapabilities,
    getPrimaryRole,
    
    // Estado
    permissions,
    roles,
    isLoading,
    
    // Acciones
    refreshPermissions
  } = usePermissions();

  // Ejemplos de uso
  if (hasPermission('documents.delete')) {
    // Mostrar botón de eliminar
  }

  const canEditDocs = canUpdate('documents');
  
  const capabilities = getUserCapabilities();
  if (capabilities.canManageUsers) {
    // Mostrar gestión de usuarios
  }

  // Refrescar permisos manualmente
  const handleRefresh = async () => {
    await refreshPermissions();
  };
}
```

#### Componentes de Utilidad Predefinidos
```tsx
import { 
  AdminOnly, 
  SuperAdminOnly,
  StaffOnly,
  CanManageUsers,
  CanManageProcesses,
  CanViewReports 
} from '@/utils/rbac.utils';

// Solo administradores
<AdminOnly>
  <AdminSettings />
</AdminOnly>

// Solo super administradores
<SuperAdminOnly>
  <SystemConfiguration />
</SuperAdminOnly>

// Personal autorizado (admin, super_admin, coordinador)
<StaffOnly>
  <StaffDashboard />
</StaffOnly>

// Usuarios que pueden gestionar procesos
<CanManageProcesses>
  <ProcessManager />
</CanManageProcesses>
```

### Rutas Protegidas

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Ruta básica protegida (solo autenticación)
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// Ruta con roles requeridos
<ProtectedRoute requiredRoles={['admin', 'coordinador']}>
  <ProcessManagement />
</ProtectedRoute>

// Ruta con permisos requeridos
<ProtectedRoute requiredPermissions={['audits.create', 'audits.update']}>
  <AuditCreation />
</ProtectedRoute>

// Ruta con roles Y permisos (debe cumplir ambos)
<ProtectedRoute 
  requiredRoles={['auditor']}
  requiredPermissions={['audits.execute']}
>
  <AuditExecution />
</ProtectedRoute>
```

### Jerarquía de Roles

```
super_admin (nivel 6)
    ↓
  admin (nivel 5)
    ↓
coordinador (nivel 4)
    ↓
 auditor (nivel 3)
    ↓
consulta (nivel 2)
    ↓
  guest (nivel 1)
```

### Patrón de Permisos

Los permisos siguen el formato: `recurso.acción`

- `documents.create` - Crear documentos
- `documents.read` - Leer documentos
- `documents.update` - Actualizar documentos
- `documents.delete` - Eliminar documentos
- `documents.*` - Todos los permisos de documentos
- `*.all` - Super usuario con todos los permisos

### Cache de Permisos

El sistema implementa cache automático:
- **Ubicación**: sessionStorage
- **TTL**: 1 hora
- **Actualización automática**: En login y refresh token
- **Actualización manual**: `refreshPermissions()`

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/           # Componentes de autenticación
│   │   ├── common/         # Componentes reutilizables (PermissionGate, etc)
│   │   ├── dashboard/      # Dashboards por rol
│   │   ├── layout/         # Layout principal
│   │   └── ui/            # Componentes UI básicos
│   ├── contexts/
│   │   └── AuthContext.tsx # Contexto global con RBAC
│   ├── hooks/
│   │   ├── useAuth.ts     # Hook principal de autenticación
│   │   └── usePermissions.ts # Hook avanzado de permisos
│   ├── pages/             # Páginas de la aplicación
│   ├── services/
│   │   ├── auth.service.ts # Servicio de autenticación
│   │   └── rbac.service.ts # Servicio RBAC
│   ├── types/             # Tipos TypeScript
│   │   ├── auth.types.ts
│   │   ├── rbac.types.ts
│   │   └── user.types.ts
│   └── utils/
│       ├── rbac.utils.tsx # Componentes de utilidad RBAC
│       ├── rbac.hoc.tsx  # Higher-Order Components
│       └── storage.ts     # Gestión de storage
├── tests/                 # Tests unitarios y de integración
├── vite.config.ts        # Configuración de Vite
└── package.json          # Dependencias y scripts
```

## 🔧 Scripts Disponibles

```json
{
  "dev": "Servidor de desarrollo",
  "build": "Construir para producción",
  "preview": "Preview de producción",
  "test": "Ejecutar tests",
  "test:coverage": "Tests con cobertura",
  "test:ui": "UI interactiva de tests",
  "test:run": "Tests una sola vez",
  "test:ci": "Tests para CI/CD",
  "lint": "Verificar código con ESLint",
  "format": "Formatear código con Prettier"
}
```

## 🌐 Variables de Entorno

```env
# .env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=ZentraQMS
VITE_APP_VERSION=0.1.0
```

## 📝 Notas de Desarrollo

### Plantilla Velzon
Este proyecto utiliza la plantilla Velzon 4.4.1. **SIEMPRE** verificar si existe un componente en Velzon antes de crear uno nuevo.

### Convenciones de Código
- Usar TypeScript estricto
- Componentes funcionales con hooks
- Nombres de componentes en PascalCase
- Hooks personalizados empiezan con `use`
- Servicios como clases estáticas
- Tests junto a los componentes (`.test.tsx`)

## 🚀 Despliegue

```bash
# Construir para producción
npm run build

# El resultado estará en ./dist
# Servir con cualquier servidor estático (nginx, apache, etc)
```

## 📚 Documentación Adicional

- [Documentación de React](https://react.dev)
- [Documentación de TypeScript](https://www.typescriptlang.org)
- [Documentación de Vite](https://vitejs.dev)
- [Documentación de Bootstrap](https://getbootstrap.com)
- [Plantilla Velzon](https://themeforest.net/item/velzon)

## 🤝 Contribución

1. Crear rama desde `develop`
2. Implementar cambios
3. Ejecutar tests (`npm test`)
4. Verificar lint (`npm run lint`)
5. Crear Pull Request

## 📄 Licencia

Propiedad de Zentratek - Todos los derechos reservados