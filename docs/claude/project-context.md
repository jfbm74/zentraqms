# 🎯 Contexto Principal - ZentraQMS

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

## 📋 Checklist Obligatorio

Antes de implementar CUALQUIER funcionalidad:

- [ ] ¿Busqué en Velzon si existe algo similar?
- [ ] ¿Copié el componente de Velzon al proyecto?
- [ ] ¿Copié todos los assets necesarios (imágenes, estilos)?
- [ ] ¿Adapté los imports para usar recursos locales?
- [ ] ¿Traduje textos a español?
- [ ] ¿Adapté el contenido al contexto QMS?
- [ ] ¿Evité usar recursos externos?

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
- **Frontend**: ✅ 113/113 tests pasando (100%)
- **Cobertura**: >80% en backend

### Puertos de Desarrollo
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- PostgreSQL: 5432
- Redis: 6379

**Recuerda: SIEMPRE usa Velzon primero, crea desde cero solo como último recurso.**

---

## 🗂️ RUTAS DE API - ZentraQMS Backend

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

---

## 📚 Documentación Modular

Para información detallada, consultar la documentación modular en `docs/claude/`:

### 🚨 PRIMER PASO OBLIGATORIO
- **[common-traps.md](./common-traps.md)** - Errores más frecuentes y cómo evitarlos

### 📖 Guías de Desarrollo
- **[velzon-components.md](./velzon-components.md)** - Mapeo completo Velzon → QMS
- **[development-patterns.md](./development-patterns.md)** - 10 patrones de código clave
- **[api-endpoints.md](./api-endpoints.md)** - Documentación completa de APIs

### 🏗️ Arquitectura
- **[frontend-structure.md](./frontend-structure.md)** - Estructura React/TypeScript
- **[backend-structure.md](./backend-structure.md)** - Estructura Django/DRF
- **[rbac-system.md](./rbac-system.md)** - Sistema de permisos RBAC

### 🧪 Testing y Calidad
- **[testing-guidelines.md](./testing-guidelines.md)** - Estrategias de testing
- **[development-workflow.md](./development-workflow.md)** - Git flow y CI/CD

---

## 🎯 Comandos Esenciales

```bash
# Desarrollo Backend
cd backend && python manage.py runserver --settings=config.settings.development

# Desarrollo Frontend  
cd frontend && npm run dev

# Testing
cd backend && python manage.py test --settings=config.settings.testing
cd frontend && npm run test

# Lint
cd frontend && npm run lint
cd backend && flake8
```

**💡 RECORDATORIO**: Antes de cualquier desarrollo, revisar [common-traps.md](./common-traps.md) para evitar errores frecuentes.