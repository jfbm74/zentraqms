# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Sin liberar]

### 🚀 Agregado

#### Fase 6: Gestión de Organizaciones y Testing (2025-08-14)

- **Módulo de Organizaciones Completo**:
  - Wizard de configuración inicial en 5 pasos
  - Validación automática de NIT colombiano con cálculo de dígito de verificación
  - Gestión de sedes principales y sucursales
  - Aplicación automática de plantillas por sector económico
  - Registro de auditoría completo (AuditLog)
  - Soft delete para registros eliminados

- **Sistema de Manejo de Errores**:
  - Interceptores HTTP con retry automático
  - Clasificación de errores por tipo y severidad
  - ErrorBoundary para captura de errores JavaScript
  - Mensajes de error amigables al usuario
  - Sistema de logging estructurado

- **Tests Comprehensivos**:
  - Backend: 34 tests de modelos pasando (100%)
  - Backend: Tests de APIs completos
  - Frontend: Tests de componentes wizard
  - Frontend: Tests de hooks personalizados (useOrganization, useAutoSave, useWizardNavigation)
  - E2E: Tests de flujo completo de creación de organización
  - Cobertura >80% en backend

- **Componentes UI Nuevos**:
  - NitInput: Componente especializado para NIT colombiano
  - OrganizationWizard: Wizard completo de configuración
  - Step1OrganizationData: Datos básicos de la institución
  - Step2LocationData: Información de ubicación
  - Step3SectorTemplate: Selección de plantilla por sector
  - Step5BranchOffices: Gestión de sucursales

- **Hooks Personalizados**:
  - useOrganization: Gestión completa de organizaciones
  - useAutoSave: Guardado automático con detección de conflictos
  - useWizardNavigation: Navegación de wizard con validación

#### Fase 5: Sistema RBAC Frontend (2025-08-13)

- **Control de Acceso Basado en Roles (RBAC)**:
  - Integración completa de roles y permisos en el contexto de autenticación
  - Sistema de cache de permisos en sessionStorage con TTL de 1 hora
  - Soporte para permisos con wildcards (ej: `documents.*`, `*.all`)
  - Jerarquía de roles: `super_admin` > `admin` > `coordinador` > `auditor` > `consulta` > `guest`

- **Componentes de Autorización**:
  - `PermissionGate`: Componente para renderizado condicional basado en permisos
  - `usePermissions`: Hook avanzado para verificación de permisos
  - `useResourcePermissions`: Hook especializado para permisos de recursos
  - `useRoleBasedUI`: Hook para adaptación de UI según roles
  - HOC `withPermissions` para envolver componentes con verificación de permisos

- **UI Adaptativa según Permisos**:
  - Botones que se muestran/ocultan según permisos del usuario
  - Menú dinámico que se adapta al rol del usuario
  - Dashboard diferenciado por rol (Admin, Coordinador, Auditor, Consulta)
  - Redirección post-login basada en el rol principal del usuario
  - Página de "Acceso Denegado" para intentos no autorizados

- **Componentes de Utilidad RBAC**:
  - `AdminOnly`, `SuperAdminOnly`, `StaffOnly`: Componentes de acceso restringido
  - `CanManageUsers`, `CanManageProcesses`, `CanViewReports`: Componentes basados en capacidades
  - `ProtectedRoute` actualizado con verificación de roles y permisos

- **Servicios y Tipos**:
  - `RBACService`: Servicio completo para operaciones RBAC
  - Tipos TypeScript completos para Permission, Role, UserRole
  - Utilidades para evaluación de permisos con wildcards

#### Otras Mejoras

- Pipeline CI/CD completo con GitHub Actions
- Configuración de branch protection rules
- Scripts de validación local pre-commit
- Documentación completa del proceso CI/CD
- **Funcionalidad de Logout**: Implementación completa en el menú del usuario
- **UI Dinámica**: Nombre de usuario dinámico en header y dropdown
- **Toast Notifications**: Feedback visual para operaciones de logout

### 🔧 Modificado

- **Modelos Django**: Actualizada lógica de guardado para primera sede principal automática
- **Validación NIT**: Corregido cálculo de dígito de verificación según algoritmo colombiano
- **Tests Backend**: Actualizados todos los valores de verificación de NIT
- **Wizard UI**: Mejorado contraste visual del título (texto blanco sobre fondo azul)
- **AuthContext mejorado**: Ahora incluye gestión completa de RBAC con métodos para verificación de permisos
- **useAuth hook**: Extendido con todas las funciones RBAC necesarias
- **LoginPage**: Actualizada con redirección basada en roles después del login
- **Tests actualizados**: Todos los tests del hook useAuth ahora incluyen mocks completos de RBAC
- Configuración de testing para frontend y backend
- Estructura de directorios para mejor organización
- **Unificación de Axios**: Consolidada una sola instancia de axios cliente
- **Interceptores mejorados**: Mejor manejo de errores 401 para endpoints de login/refresh
- **Rutas de autenticación**: Corregida redirección de logout de `/auth/login` a `/login`

### 🐛 Corregido

- **UUID Primary Keys**: Corregida detección de nuevas instancias usando `_state.adding`
- **Tests de Location**: Ajustado test de primera sede principal automática
- **Cálculo de NIT**: Corregidos valores esperados en tests según algoritmo oficial
- **Regex NIT**: Actualizado para permitir formatos con guiones internos
- **Tests de Auditoría**: Ajustado conteo para incluir auditoría de creación
- **CORS**: Deshabilitado header X-Request-ID que causaba problemas de CORS
- **ESLint Fast Refresh**: Resueltos todos los warnings de React Fast Refresh
- **React Hooks Order**: Corregido el orden de llamada de hooks en PermissionGate
- **Test Mocks**: Agregados todos los métodos RBAC faltantes en los mocks de tests
- **Login 401 Error**: Solucionado conflicto entre interceptores de axios que causaba errores 401
- **Redirección de logout**: Corregida URL inexistente `/auth/login` por `/login` correcta
- **Duplicación de instancias axios**: Eliminado `axios.config.ts` y unificado en `endpoints.ts`

## [0.1.0] - 2025-08-13

### 🚀 Agregado

- **Autenticación JWT**: Sistema completo de login/logout
- **Frontend React**: Aplicación base con TypeScript y Vite
- **Backend Django**: API REST con Django REST Framework
- **Interceptores Axios**: Manejo automático de tokens con refresh
- **Rutas Protegidas**: Sistema de protección de rutas en frontend
- **Dashboard**: Panel principal con información de usuario
- **Context API**: Gestión global del estado de autenticación
- **Toast Notifications**: Sistema de notificaciones con react-toastify
- **Testing**: Configuración inicial de testing para ambos lados
- **Docker**: Configuración inicial con docker-compose
- **Base de Datos**: Modelos Django para usuarios y autenticación

### 🎨 Frontend

- React 19 con TypeScript
- Vite como bundler
- Bootstrap 5.3 para estilos
- React Router para navegación
- Axios para peticiones HTTP
- Context API para estado global
- Componentes reutilizables (Header, Sidebar, Footer)
- Páginas base para módulos QMS

### 🔧 Backend

- Django 5.0 con Python 3.11+
- Django REST Framework
- JWT Authentication con SimpleJWT
- PostgreSQL como base de datos
- Redis para caché y sesiones
- Celery para tareas asíncronas
- Sistema de logging configurado
- Middleware personalizado

### 🛡️ Seguridad

- Autenticación JWT con access/refresh tokens
- Configuración CORS
- Rate limiting básico
- Validaciones de entrada
- Headers de seguridad

### 📋 DevOps

- Docker y docker-compose
- Scripts de desarrollo
- Configuración de entornos
- Variables de entorno
- Makefile para comandos comunes

### 🧪 Testing

- Vitest para frontend
- pytest para backend
- Coverage reporting
- Testing utilities
- Configuración CI/CD

---

## Tipos de Cambios

- 🚀 **Agregado** para nuevas funcionalidades
- 🔧 **Modificado** para cambios en funcionalidades existentes
- 🗑️ **Obsoleto** para funcionalidades que serán removidas
- ❌ **Removido** para funcionalidades removidas
- 🐛 **Corregido** para corrección de bugs
- 🛡️ **Seguridad** para vulnerabilidades

## Versionado

Este proyecto usa [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR**: Cambios incompatibles en la API
- **MINOR**: Funcionalidades nuevas compatibles hacia atrás
- **PATCH**: Correcciones compatibles hacia atrás

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva funcionalidad
fix: corrección de bug
docs: solo cambios en documentación
style: cambios que no afectan el código (espacios, formato, etc)
refactor: código que no corrige bug ni agrega funcionalidad
test: agregar o corregir tests
chore: cambios en el build, dependencias, etc
```

### Roadmap

#### v0.2.0 - Gestión de Procesos

- [ ] CRUD completo de procesos
- [ ] Categorización de procesos
- [ ] Workflow de aprobación
- [ ] Versionado de procesos

#### v0.3.0 - Sistema de Auditorías

- [ ] Programación de auditorías
- [ ] Plantillas de auditoría
- [ ] Seguimiento de hallazgos
- [ ] Reportes de auditoría

#### v0.4.0 - Normograma

- [ ] Gestión de normativas
- [ ] Matriz de cumplimiento
- [ ] Alertas de vencimiento
- [ ] Trazabilidad normativa

#### v0.5.0 - Indicadores KPI

- [ ] Dashboard de métricas
- [ ] Configuración de KPIs
- [ ] Alertas automáticas
- [ ] Reportes ejecutivos

#### v1.0.0 - Release Estable

- [ ] Todas las funcionalidades core
- [ ] Performance optimizada
- [ ] Documentación completa
- [ ] Testing comprehensivo
- [ ] Deployment en producción
