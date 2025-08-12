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

### Puertos de Desarrollo
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- PostgreSQL: 5432
- Redis: 6379

**Recuerda: SIEMPRE usa Velzon primero, crea desde cero solo como último recurso.**