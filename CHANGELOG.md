# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Sin liberar]

### 🚀 Agregado
- Pipeline CI/CD completo con GitHub Actions
- Configuración de branch protection rules
- Scripts de validación local pre-commit
- Documentación completa del proceso CI/CD
- **Funcionalidad de Logout**: Implementación completa en el menú del usuario
- **UI Dinámica**: Nombre de usuario dinámico en header y dropdown
- **Toast Notifications**: Feedback visual para operaciones de logout

### 🔧 Modificado
- Configuración de testing para frontend y backend
- Estructura de directorios para mejor organización
- **Unificación de Axios**: Consolidada una sola instancia de axios cliente
- **Interceptores mejorados**: Mejor manejo de errores 401 para endpoints de login/refresh
- **Rutas de autenticación**: Corregida redirección de logout de `/auth/login` a `/login`

### 🐛 Corregido
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