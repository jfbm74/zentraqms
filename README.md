# ZentraQMS - Sistema de Gestión de Calidad

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Django](https://img.shields.io/badge/Django-5.0-green.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

## 📋 Descripción

ZentraQMS es un Sistema de Gestión de Calidad (QMS) completo y moderno diseñado para optimizar los procesos organizacionales. Construido con las últimas tecnologías, ofrece una solución integral para la gestión de procesos, auditorías, normogramas e indicadores de gestión.

## 🚀 Características Principales

### Módulos del Sistema

- **📊 Dashboard**: Vista general con métricas y KPIs en tiempo real
- **📋 Gestión de Procesos**: Documentación y control de procesos organizacionales
- **📚 Normograma**: Gestión de documentos normativos y regulatorios
- **🔍 Auditorías**: Planificación, ejecución y seguimiento de auditorías internas
- **📈 Indicadores KPI**: Monitoreo y análisis de indicadores de gestión
- **⚙️ Configuración**: Gestión de usuarios, roles y configuración del sistema

### 🔐 Sistema de Control de Acceso (RBAC)

- **Roles Jerárquicos**: Sistema completo de roles con jerarquía definida
  - `super_admin`: Acceso total al sistema
  - `admin`: Administración general
  - `coordinador`: Gestión de procesos y auditorías
  - `auditor`: Ejecución de auditorías
  - `consulta`: Solo lectura
  - `guest`: Acceso limitado

- **Permisos Granulares**: Control detallado de acceso a recursos
  - Permisos por recurso (ej: `documents.create`, `users.read`)
  - Soporte para wildcards (ej: `documents.*`, `*.all`)
  - Permisos heredados según jerarquía de roles

- **UI Adaptativa**: Interfaz que se adapta según permisos
  - Componentes que se muestran/ocultan automáticamente
  - Menús dinámicos según rol del usuario
  - Dashboards personalizados por tipo de usuario
  - Redirección automática post-login según rol principal

## 🛠️ Stack Tecnológico

### Backend
- **Django 5.0** - Framework web de Python
- **Django REST Framework** - API RESTful
- **PostgreSQL** - Base de datos principal
- **Redis** - Cache y broker de mensajes
- **Celery** - Procesamiento de tareas asíncronas

### Frontend
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Bootstrap 5.3** - Framework CSS
- **Remix Icons** - Biblioteca de iconos

### DevOps
- **Docker & Docker Compose** - Containerización
- **Nginx** - Servidor web (producción)
- **GitHub Actions** - CI/CD (opcional)

## 📦 Requisitos Previos

- Docker Desktop instalado
- Git
- Node.js 20+ (para desarrollo local sin Docker)
- Python 3.11+ (para desarrollo local sin Docker)

## 🔧 Instalación y Configuración

### Instalación con Docker (Recomendado)

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/zentraqms.git
cd zentraqms
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Construir y levantar los contenedores**
```bash
docker-compose up --build
```

4. **Ejecutar migraciones**
```bash
docker-compose exec django python manage.py migrate
```

5. **Crear superusuario**
```bash
docker-compose exec django python manage.py createsuperuser
```

6. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/

### Instalación Local (Desarrollo)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🐳 Comandos Docker Útiles

```bash
# Ver logs
docker-compose logs -f

# Detener contenedores
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir contenedores
docker-compose up --build

# Ejecutar comandos Django
docker-compose exec django python manage.py [comando]

# Ejecutar shell de Django
docker-compose exec django python manage.py shell

# Acceder a PostgreSQL
docker-compose exec db psql -U zentrauser -d zentradb
```

## 📁 Estructura del Proyecto

```
zentraqms/
├── backend/
│   ├── core/                  # Configuración principal Django
│   ├── authentication/        # App de autenticación
│   ├── procesos/             # App de gestión de procesos
│   ├── normograma/           # App de documentos normativos
│   ├── auditorias/           # App de auditorías
│   ├── indicadores/          # App de KPIs
│   ├── requirements.txt      # Dependencias Python
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   │   └── layout/      # Layout principal
│   │   ├── assets/          # Imágenes y recursos
│   │   ├── App.tsx          # Componente principal
│   │   └── main.tsx         # Punto de entrada
│   ├── package.json         # Dependencias Node
│   └── vite.config.ts       # Configuración Vite
├── docker-compose.yml       # Configuración Docker
├── Makefile                # Comandos de automatización
└── README.md               # Este archivo
```

## 🔑 Variables de Entorno

### Backend (.env)
```env
# Django
SECRET_KEY=tu-secret-key-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=zentradb
DB_USER=zentrauser
DB_PASSWORD=zentrapass
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

## 🧪 Testing

### Backend
```bash
docker-compose exec django python manage.py test
```

### Frontend
```bash
cd frontend
npm run test              # Ejecutar tests
npm run test:coverage      # Ejecutar tests con cobertura
npm run test:ui           # UI interactiva de tests
```

## 🔒 Uso del Sistema RBAC (Para Desarrolladores)

### Componentes de Autorización

#### PermissionGate
Componente para renderizado condicional basado en permisos:

```tsx
import { PermissionGate } from '@/components/common/PermissionGate';

// Verificar un permiso específico
<PermissionGate permission="documents.create">
  <button>Crear Documento</button>
</PermissionGate>

// Verificar múltiples permisos (OR)
<PermissionGate permissions={['documents.create', 'documents.update']}>
  <button>Gestionar Documentos</button>
</PermissionGate>

// Verificar rol específico
<PermissionGate role="admin">
  <AdminPanel />
</PermissionGate>

// Con fallback personalizado
<PermissionGate 
  permission="reports.export" 
  fallback={<p>No tienes permisos para exportar</p>}
>
  <ExportButton />
</PermissionGate>
```

#### usePermissions Hook
Hook avanzado para verificación de permisos:

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { 
    hasPermission, 
    hasRole, 
    canCreate, 
    canUpdate,
    getUserCapabilities 
  } = usePermissions();

  // Verificar permisos individuales
  if (hasPermission('documents.delete')) {
    // Mostrar botón de eliminar
  }

  // Verificar capacidades de recurso
  const canManageDocs = canCreate('documents') && canUpdate('documents');

  // Obtener todas las capacidades del usuario
  const capabilities = getUserCapabilities();
  if (capabilities.canManageUsers) {
    // Mostrar gestión de usuarios
  }
}
```

#### Componentes de Utilidad
```tsx
import { AdminOnly, CanManageProcesses } from '@/utils/rbac.utils';

// Solo para administradores
<AdminOnly>
  <AdminSettings />
</AdminOnly>

// Para usuarios que pueden gestionar procesos
<CanManageProcesses>
  <ProcessManager />
</CanManageProcesses>
```

### Rutas Protegidas

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Ruta que requiere autenticación y rol específico
<ProtectedRoute 
  requiredRoles={['admin', 'coordinador']}
  requiredPermissions={['processes.manage']}
>
  <ProcessManagementPage />
</ProtectedRoute>
```

### Cache de Permisos

El sistema implementa cache automático de permisos en sessionStorage con TTL de 1 hora. Los permisos se actualizan automáticamente en:
- Login inicial
- Refresh de token
- Cambios de permisos en el backend

Para refrescar manualmente los permisos:
```tsx
const { refreshPermissions } = useAuth();
await refreshPermissions();
```

## 📝 Makefile - Comandos Disponibles

```bash
make help        # Mostrar ayuda
make build       # Construir contenedores
make up          # Levantar servicios
make down        # Detener servicios
make migrate     # Ejecutar migraciones
make shell       # Shell de Django
make logs        # Ver logs
make clean       # Limpiar proyecto
```

## 🚀 Despliegue en Producción

### Consideraciones
1. Cambiar `DEBUG=False` en producción
2. Configurar un servidor web (Nginx/Apache)
3. Usar una base de datos robusta (PostgreSQL)
4. Configurar HTTPS con certificados SSL
5. Implementar backup automático
6. Configurar monitoreo y logs

### Ejemplo con Docker en Producción
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 API Documentation

La documentación de la API está disponible en:
- Swagger UI: http://localhost:8000/api/swagger/
- ReDoc: http://localhost:8000/api/redoc/

### Endpoints Principales
```
GET    /api/procesos/          # Listar procesos
POST   /api/procesos/          # Crear proceso
GET    /api/auditorias/        # Listar auditorías
POST   /api/auditorias/        # Crear auditoría
GET    /api/indicadores/       # Listar KPIs
POST   /api/indicadores/       # Crear KPI
```

## 🔐 Credenciales de Prueba RBAC

El sistema incluye usuarios de prueba con diferentes roles y permisos para testing y demostración:

### Usuarios de Prueba

| Usuario | Email | Contraseña | Rol | Permisos |
|---------|-------|------------|-----|----------|
| **Admin** | `admin@zentraqms.com` | `[password del admin]` | Super Admin | Acceso total al sistema |
| **Coordinador** | `` | `test123456` | Coordinador de Calidad | 35 permisos - Gestión completa de calidad |
| **Auditor** | `auditor@zentraqms.test` | `test123456` | Auditor Interno | 16 permisos - Ejecución y gestión de auditorías |
| **Jefe de Área** | `jefe@zentraqms.test` | `test123456` | Jefe de Área | 17 permisos - Gestión de área y procesos |
| **Responsable** | `responsable@zentraqms.test` | `test123456` | Responsable de Proceso | 11 permisos - Gestión de procesos específicos |
| **Operativo** | `operativo@zentraqms.test` | `test123456` | Usuario Operativo | 8 permisos - Operaciones básicas |
| **Consulta** | `consulta@zentraqms.test` | `test123456` | Usuario de Consulta | 11 permisos - Solo lectura y consulta |

### Endpoints RBAC Disponibles

```bash
# Gestión de roles
GET    /api/authorization/roles/                    # Listar roles
GET    /api/authorization/permissions/              # Listar permisos

# Gestión de permisos de usuario
GET    /api/authorization/user-permissions/my_permissions/     # Mis permisos
POST   /api/authorization/user-permissions/check_permission/   # Verificar permiso específico
```

### Ejemplo de Uso

```bash
# Login con usuario coordinador
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "coordinador@zentraqms.test", "password": "test123456"}'

# Verificar permisos del usuario
curl -X GET http://localhost:8000/api/authorization/user-permissions/my_permissions/ \
  -H "Authorization: Bearer [access_token]"

# Verificar permiso específico
curl -X POST http://localhost:8000/api/authorization/user-permissions/check_permission/ \
  -H "Authorization: Bearer [access_token]" \
  -H "Content-Type: application/json" \
  -d '{"permission_code": "audits.create"}'
```

### Sistema de Permisos

El sistema implementa un RBAC completo con:
- **42 permisos base** distribuidos en 6 recursos (audits, documents, processes, reports, users, dashboard)
- **7 roles predefinidos** con diferentes niveles de acceso
- **Wildcards** para permisos (`*.all` para super admin, `resource.*` para acceso completo a un recurso)
- **Cache de permisos** para optimizar rendimiento
- **JWT tokens** que incluyen roles y permisos del usuario

## 👥 Equipo de Desarrollo

- **Desarrollador Principal**: [Tu Nombre]
- **Contacto**: [tu-email@ejemplo.com]

## 📄 Licencia

Este proyecto es software propietario. Todos los derechos reservados.

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte y consultas:
- Email: soporte@zentraqms.com
- Issues: [GitHub Issues](https://github.com/tu-usuario/zentraqms/issues)

## 🔄 Versionado y Releases

### Sistema de Versionado

Este proyecto usa [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR.MINOR.PATCH** (ej: 1.2.3)
- **MAJOR**: Cambios incompatibles en la API
- **MINOR**: Nuevas funcionalidades compatibles hacia atrás  
- **PATCH**: Correcciones compatibles hacia atrás

### Crear una Nueva Versión

```bash
# Versión patch (0.1.0 → 0.1.1)
./scripts/create-release.sh patch

# Versión minor (0.1.0 → 0.2.0)  
./scripts/create-release.sh minor

# Versión major (0.1.0 → 1.0.0)
./scripts/create-release.sh major

# Con push automático
./scripts/create-release.sh minor --push

# Simulación sin cambios
./scripts/create-release.sh patch --dry-run
```

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

### Scripts de Versionado

- `npm run version:patch` - Incrementa versión patch
- `npm run version:minor` - Incrementa versión minor
- `npm run version:major` - Incrementa versión major
- `npm run version:sync` - Sincroniza versiones entre módulos
- `./scripts/create-release.sh` - Script completo de release

### Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para el historial completo de cambios.

---

Desarrollado con ❤️ para la Excelencia Organizacional