# 🎯 Instrucciones para Claude - ZentraQMS

## 📋 Directiva Principal

**OBLIGATORIO**: Este proyecto utiliza la plantilla Velzon 4.4.1 que fue comprada. SIEMPRE debes usar los componentes, estilos y recursos de esta plantilla en lugar de crear nuevos desde cero o usar recursos externos.

## 📍 Ubicación de la Plantilla Velzon

```
/Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/
```

## ⚡ Flujo de Trabajo Obligatorio

### 1. ANTES DE CREAR CUALQUIER COMPONENTE

**SIEMPRE** verifica primero si existe en Velzon:

```bash
# Buscar componentes similares
ls /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/Components/
ls /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/pages/
ls /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/Layouts/
```

### 2. Proceso de Implementación

1. **BUSCAR** en Velzon si existe un componente similar
2. **COPIAR** el componente completo al proyecto ZentraQMS
3. **ADAPTAR** el componente a las necesidades específicas
4. **NUNCA** crear desde cero si existe en Velzon
5. **NUNCA** usar recursos externos (CDNs, APIs de imágenes) si están en Velzon

## 🗂️ Componentes Velzon Disponibles

### Layouts y Header
```
/Layouts/Header.tsx               # Header principal
/Layouts/Sidebar.tsx              # Sidebar de navegación
/Layouts/Footer.tsx               # Footer
/Components/Common/ProfileDropdown.tsx
/Components/Common/NotificationDropdown.tsx
```

### Dashboards (Usar para QMS)
```
/pages/DashboardAnalytics/        # Dashboard con métricas (perfecto para KPIs)
/pages/DashboardProject/          # Dashboard de proyectos (ideal para procesos)
/pages/DashboardCrm/             # Dashboard CRM (adaptable para auditorías)
```

### Tablas y Listados
```
/Components/Common/TableContainer.tsx
/pages/Tables/DataTables.tsx      # Tablas con búsqueda y filtros
/pages/Tables/BasicTables.tsx
```

### Formularios
```
/pages/Forms/FormLayouts.tsx      # Layouts de formularios
/pages/Forms/FormValidation.tsx   # Validación
/pages/Forms/FormWizards.tsx      # Formularios por pasos
```

### Gráficos para KPIs
```
/pages/Charts/ApexCharts/         # Gráficos interactivos
/pages/Charts/ChartsJs/           # Gráficos simples
```

### Componentes Comunes
```
/Components/Common/BreadCrumb.tsx
/Components/Common/DeleteModal.tsx
/Components/Common/Loader.tsx
/Components/Common/Pagination.tsx
```

### Assets Disponibles
```
/assets/images/users/             # 12 avatares profesionales
/assets/images/flags/             # Banderas de países
/assets/images/logo-*.png         # Logos de Velzon
/assets/scss/                     # Estilos SCSS completos
```

## 🚫 PROHIBIDO

1. **NO usar servicios externos**:
   - `ui-avatars.com` ❌ → Usar `/assets/images/users/`
   - `flagcdn.com` ❌ → Usar `/assets/images/flags/`
   - CDNs de imágenes ❌ → Copiar imágenes localmente

2. **NO crear componentes desde cero** si existen en Velzon

3. **NO hacer referencias directas** a la carpeta de Velzon en imports

## ✅ PROCESO CORRECTO

### Paso 1: Buscar en Velzon
```bash
# Ejemplo: Necesitas una tabla de procesos
find /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/ -name "*Table*"
```

### Paso 2: Copiar al Proyecto
```bash
# Copiar componente
cp -r /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/pages/Tables/DataTables.tsx \
      /Users/juan.bustamante/personal/zentraqms/frontend/src/components/procesos/ProcesosTable.tsx

# Copiar recursos necesarios
cp /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/assets/images/users/avatar-1.jpg \
   /Users/juan.bustamante/personal/zentraqms/frontend/src/assets/images/users/
```

### Paso 3: Adaptar Imports
```typescript
// ✅ CORRECTO - Usar recursos locales
import avatar1 from '../../assets/images/users/avatar-1.jpg';
import colombiaFlag from '../../assets/images/flags/co.svg';

// ❌ INCORRECTO - No usar recursos externos
import avatar from 'https://ui-avatars.com/api/?name=...';
import flag from 'https://flagcdn.com/w20/co.png';
```

### Paso 4: Personalizar para QMS
```typescript
// Cambiar textos a español y contexto QMS
const menuItems = [
  { label: 'Gestión de Procesos', icon: 'ri-file-list-3-line' },
  { label: 'Auditorías', icon: 'ri-search-eye-line' },
  { label: 'Normograma', icon: 'ri-book-open-line' },
  { label: 'Indicadores', icon: 'ri-line-chart-line' }
];
```

## 🎯 Mapeo QMS → Velzon

| Módulo QMS | Componente Velzon Recomendado |
|------------|------------------------------|
| **Dashboard QMS** | `/pages/DashboardAnalytics/` |
| **Gestión de Procesos** | `/pages/DashboardProject/` + `/pages/Tables/DataTables.tsx` |
| **Auditorías** | `/pages/DashboardCrm/` + `/pages/Tables/DataTables.tsx` |
| **Normograma** | `/pages/Tables/DataTables.tsx` + `/Components/Common/TableContainer.tsx` |
| **Indicadores KPI** | `/pages/Charts/ApexCharts/` + `/pages/DashboardAnalytics/Widget.tsx` |
| **Formularios** | `/pages/Forms/FormLayouts.tsx` |
| **Reportes** | `/pages/Charts/ApexCharts/` + `/pages/Tables/DataTables.tsx` |

## 📝 Checklist Obligatorio

Antes de implementar CUALQUIER funcionalidad:

- [ ] ¿Busqué en Velzon si existe algo similar?
- [ ] ¿Copié el componente de Velzon al proyecto?
- [ ] ¿Copié todos los assets necesarios (imágenes, estilos)?
- [ ] ¿Adapté los imports para usar recursos locales?
- [ ] ¿Traduje textos a español?
- [ ] ¿Adapté el contenido al contexto QMS?
- [ ] ¿Evité usar recursos externos?

## 🔧 Comandos Útiles

```bash
# Ver estructura completa de Velzon
tree /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/ -L 2

# Buscar componente específico
find /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/ -name "*Modal*"

# Buscar uso de un componente
grep -r "TableContainer" /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/

# Copiar múltiples assets
cp /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/assets/images/users/*.jpg \
   /Users/juan.bustamante/personal/zentraqms/frontend/src/assets/images/users/
```

## 💡 Ejemplos Prácticos

### ✅ Ejemplo Correcto: Dashboard de KPIs
```bash
# 1. Buscar dashboard en Velzon
ls /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/pages/DashboardAnalytics/

# 2. Copiar componentes de widgets
cp -r /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/pages/DashboardAnalytics/ \
      /Users/juan.bustamante/personal/zentraqms/frontend/src/components/indicadores/

# 3. Adaptar para mostrar KPIs de QMS (procesos activos, auditorías pendientes, etc.)
```

### ✅ Ejemplo Correcto: Tabla de Procesos
```bash
# 1. Copiar DataTables de Velzon
cp /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/pages/Tables/DataTables.tsx \
   /Users/juan.bustamante/personal/zentraqms/frontend/src/components/procesos/ProcesosTable.tsx

# 2. Adaptar columnas para procesos (Nombre, Estado, Responsable, Fecha)
# 3. Conectar con API de Django para obtener procesos
```

## 🚨 Recordatorio Final

**NUNCA OLVIDES**: Antes de crear CUALQUIER componente, pregúntate:

1. ¿Existe esto en Velzon?
2. ¿Puedo copiarlo y adaptarlo?
3. ¿Estoy usando recursos locales en lugar de externos?

**Esta plantilla costó dinero y debe ser aprovechada al máximo.**

---

## 📊 Proyecto Overview

ZentraQMS es un Sistema de Gestión de Calidad completo construido con:

### Backend
- Django 5.0 + DRF
- PostgreSQL + Redis
- Celery para tareas asíncronas

### Frontend  
- React 19 + TypeScript
- Vite + Bootstrap 5.3
- **Velzon 4.4.1 como base de UI**

### 🏢 Módulos Implementados
- **✅ Autenticación JWT**: Sistema completo con RBAC
- **✅ Gestión de Organizaciones**: Wizard de configuración inicial
  - Validación de NIT colombiano con cálculo automático de dígito
  - Gestión de sedes principales y sucursales
  - Templates por sector económico
  - Sistema completo de auditoría con rollback
- **🔧 Gestión de Procesos**: En desarrollo
- **🔧 Auditorías**: En desarrollo  
- **🔧 Normograma**: En desarrollo
- **🔧 Indicadores KPI**: En desarrollo

### 🧪 Estado de Testing
- **Backend**: ✅ 34/34 tests pasando (100%)
- **Frontend**: ⚠️ 97/253 tests pasando (necesita dependencias)
- **Cobertura**: >80% en backend

### Puertos de Desarrollo
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- PostgreSQL: 5432
- Redis: 6379

**Recuerda: SIEMPRE usa Velzon primero, crea desde cero solo como último recurso.**

---

## 🔗 RUTAS DE API - ZentraQMS Backend

### 📍 Base URLs
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000

### 🗂️ Estructura de APIs

#### Autenticación
```
/api/auth/
├── login/                     # POST - Iniciar sesión
├── logout/                    # POST - Cerrar sesión
├── refresh/                   # POST - Renovar token
├── permissions/               # GET - Obtener permisos del usuario
├── roles/                     # GET - Obtener roles del usuario
└── profile/                   # GET/PUT - Perfil del usuario
```

#### Autorización (RBAC)
```
/api/authorization/
├── permissions/               # GET/POST - Gestión de permisos
├── roles/                     # GET/POST - Gestión de roles
└── user-roles/               # GET/POST - Asignación de roles
```

#### Organizaciones
```
/api/v1/organizations/
├── ''                        # GET/POST - Lista/Crear organizaciones
├── {id}/                     # GET/PUT/DELETE - CRUD individual
├── exists_check/             # GET - Verificar si existen organizaciones
├── wizard/step1/             # GET/POST - Wizard paso 1 (datos básicos)
├── {id}/locations/           # GET - Sedes de una organización
├── calculate_verification_digit/  # POST - Calcular dígito NIT
├── {id}/audit-history/       # GET - Historial de auditoría
└── {id}/rollback/            # POST - Rollback a estado anterior
```

#### Ubicaciones/Sedes
```
/api/v1/locations/
├── ''                        # GET/POST - Lista/Crear ubicaciones
├── {id}/                     # GET/PUT/DELETE - CRUD individual
├── wizard/step1/             # GET/POST - Wizard sede principal
└── by_organization/          # GET - Ubicaciones por organización
```

#### Templates de Sector
```
/api/v1/sector-templates/
├── ''                        # GET/POST - Lista/Crear templates
├── {id}/                     # GET/PUT/DELETE - CRUD individual
├── by-sector/                # GET - Templates por sector
├── {id}/apply/               # POST - Aplicar template
├── create-basic/             # POST - Crear template básico
└── sectors/                  # GET - Sectores disponibles
```

### ⚠️ IMPORTANTE: Usar Siempre las Rutas Correctas

1. **Autenticación**: `/api/auth/`
2. **Organizaciones**: `/api/v1/` (NO `/api/organization/`)
3. **Wizard de Configuración**: `/api/v1/organizations/wizard/step1/`

### 📝 Ejemplos de Uso

```typescript
// ✅ CORRECTO
const response = await apiClient.post('/api/v1/organizations/wizard/step1/', data);
const exists = await apiClient.get('/api/v1/organizations/exists_check/');
const login = await apiClient.post('/api/auth/login/', credentials);

// ❌ INCORRECTO
const response = await apiClient.post('/api/organization/organizations/wizard/step1/', data);
const response = await apiClient.post('/api/v1/organizations/setup/', data);
```

### 🔧 Headers Requeridos
- **Authorization**: `Bearer {token}` (para endpoints autenticados)
- **Content-Type**: `application/json`
- **X-CSRFToken**: `{csrf_token}` (para operaciones POST/PUT/DELETE)

---

## 🏢 Módulo de Gestión de Organizaciones

### ✅ Características Implementadas

#### 🗃️ Modelos Django
- **Organization**: Información legal y básica de la institución
  - Validación automática de NIT colombiano
  - Cálculo de dígito de verificación
  - Clasificación por tipo, sector y tamaño
- **Location**: Gestión de sedes principales y sucursales
  - Constraint único para sede principal por organización
  - Auto-asignación de primera sede como principal
- **SectorTemplate**: Plantillas de configuración por sector
  - Aplicación automática de procesos, indicadores y documentos
- **AuditLog**: Sistema completo de auditoría
  - Tracking de cambios con rollback capability

#### 🎨 Componentes Frontend (Velzon)
- **OrganizationWizard**: Wizard de 5 pasos para configuración inicial
- **Step1OrganizationData**: Datos básicos institucionales
- **Step2LocationData**: Información de sede principal
- **Step3SectorTemplate**: Selección y aplicación de plantilla
- **Step5BranchOffices**: Gestión de sucursales adicionales
- **NitInput**: Componente especializado para NIT con validación

#### 🔧 Hooks Personalizados
- **useOrganization**: Gestión completa de organizaciones
- **useAutoSave**: Guardado automático con detección de conflictos
- **useWizardNavigation**: Navegación de wizard con validación

### 📋 Guía de Implementación para Nuevos Módulos

#### 1. Usar Organization como Referencia
```typescript
// Al crear nuevos módulos, seguir el patrón de Organization:
// 1. Modelos Django con FullBaseModel (UUID + timestamps + audit + soft delete)
// 2. Tests comprehensivos (>80% cobertura)
// 3. Serializers DRF con validaciones
// 4. ViewSets con permisos RBAC
// 5. Frontend con hooks personalizados
// 6. Componentes basados en Velzon
```

#### 2. Validaciones Colombianas Implementadas
```python
# NIT con dígito de verificación
Organization.calcular_digito_verificacion(nit)

# Regex para teléfonos colombianos
r'^\\+?[\\d\\s\\-\\(\\)]{7,15}$'

# Campos de ubicación colombianos
departamento, ciudad, codigo_postal
```

#### 3. Sistema de Auditoría
```python
# Auto-logging en todos los modelos FullBaseModel
AuditLog.log_change(instance, action, user, old_values, new_values)

# Rollback capability
audit_log.perform_rollback(user, reason)
```

### 🧪 Tests del Módulo
- **34 tests pasando al 100%**
- Cobertura de validaciones de NIT
- Tests de constraints únicos
- Tests de aplicación de templates
- Tests de auditoría y rollback
- Tests de concurrencia para sedes principales

### 🔄 Próximos Pasos Recomendados
1. Implementar módulo de **Procesos** siguiendo el patrón de Organization
2. Conectar templates de sector con módulos de Procesos/Indicadores
3. Agregar notificaciones en tiempo real con WebSockets
4. Implementar reportes automáticos con base en auditorías

---

## 🚀 Comandos de Testing

### Backend
```bash
# Ejecutar todos los tests
cd backend && python manage.py test

# Tests específicos del módulo Organization
pytest apps/organization/test_models.py -v
pytest apps/organization/test_apis.py -v

# Con cobertura
coverage run --source='.' manage.py test
coverage report
```

### Frontend
```bash
# Tests del wizard y hooks
cd frontend && npm run test

# Tests específicos
npm run test -- organization
npm run test -- wizard

# Con cobertura
npm run test:coverage
```