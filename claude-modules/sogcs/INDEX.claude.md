# 📚 ÍNDICE MÓDULO SOGCS - Navegación Eficiente

## 🎯 Propósito del Índice

Este índice permite a Claude navegar eficientemente por toda la documentación del módulo SOGCS sin procesar archivos completos, optimizando el uso de contexto y mejorando la velocidad de respuesta.

## 📂 Estructura de Archivos SOGCS

```
claude-modules/sogcs/
├── INDEX.claude.md                           ← Este archivo
├── README.claude.md                          ← Especificación principal
├── setup-wizard-requirements.claude.md       ← Wizard de configuración
├── technical-architecture.claude.md          ← Arquitectura técnica
├── organization-extension-plan.claude.md     ← Extensión Organization
├── suh-data-models.claude.md                 ← Modelos SUH + Autoevaluación
├── rbac-permissions-system.claude.md         ← Sistema de permisos
├── configuration-system-requirements.claude.md ← Sistema de configuración
├── frontend-prototype-specification.claude.md ← Prototipo UX/UI Frontend
├── sedes-servicios-management.claude.md      ← Gestión Sedes y Servicios
└── development-plan.claude.md                ← Plan de Desarrollo Completo
```

## 🗂️ CATÁLOGO DETALLADO

### 📄 README.claude.md
**Propósito**: Especificación principal del módulo SOGCS  
**Tamaño**: ~380 líneas  
**Última actualización**: Inicial

#### 🔍 Contenido Clave:
- **Marco Regulatorio**: Decree 1011/2006, Resolution 3100/2019, ISO 9001:2015
- **4 Componentes SOGCS**:
  - SUH: Sistema Único de Habilitación
  - PAMEC: Programa de Auditoría para Mejoramiento de Calidad
  - SUA: Sistema Único de Acreditación  
  - SIC: Sistema de Información para la Calidad
- **Dashboard Principal**: Interfaces TypeScript para dashboard SOGCS
- **Setup Wizard**: Overview del wizard de configuración inicial
- **Estados del Proyecto**: Tracking de completitud por componente

#### 🎯 Usar cuando necesites:
- Entender el marco regulatorio SOGCS completo
- Conocer los 4 componentes principales y sus objetivos
- Ver interfaces TypeScript para el dashboard
- Consultar el estado general del proyecto SOGCS

---

### 📄 setup-wizard-requirements.claude.md
**Propósito**: Especificación detallada del wizard de configuración inicial  
**Tamaño**: ~945 líneas  
**Última actualización**: Inicial

#### 🔍 Contenido Clave:
- **Barra de Progreso Inteligente**: 
  - TypeScript interfaces: `ProgressConfig`, `ProgressState`, `StepState`
  - Componente React: `SOGCSProgressBar`
  - Validaciones y bloqueadores en tiempo real
- **7 Pasos del Wizard**:
  1. Configuración Institucional (20%) - 15-20 min
  2. Asignación de Responsables (15%) - 10-15 min  
  3. Servicios a Habilitar (20%) - 20-25 min
  4. Configuración PAMEC (15%) - 15-20 min
  5. Selección Indicadores SIC (15%) - 10-15 min
  6. Documentos Fundamentales (10%) - 15-20 min
  7. Revisión y Activación (5%) - 5-10 min
- **Guardado Automático**: Sistema con localStorage/server
- **Recuperación de Progreso**: Modal para continuar configuración
- **Testing Suites**: Casos de prueba para wizard completo

#### 🎯 Usar cuando necesites:
- Implementar el wizard de configuración inicial paso a paso
- Diseñar la barra de progreso con TypeScript
- Entender el flujo de configuración institucional
- Implementar guardado automático y recuperación
- Crear validaciones específicas por paso

---

### 📄 technical-architecture.claude.md
**Propósito**: Arquitectura técnica completa del módulo SOGCS  
**Tamaño**: ~580 líneas  
**Última actualización**: Inicial

#### 🔍 Contenido Clave:
- **Modelos Django Base**:
  - `SOGCSConfiguration`: Configuración principal
  - `SUHService`: Servicios de habilitación
  - `QualityStandard`: Estándares de calidad
  - `AuditProgram`: Programas de auditoría
- **APIs REST**: Endpoints completos con DRF
- **Componentes React**: Basados en Velzon 4.4.1
- **Seguridad**: JWT + RBAC + audit trail
- **Performance**: Redis cache + índices optimizados
- **Deployment**: Docker + CI/CD pipeline

#### 🎯 Usar cuando necesites:
- Implementar los modelos Django base
- Crear APIs REST para SOGCS
- Desarrollar componentes React con Velzon
- Configurar seguridad y performance
- Establecer pipeline de deployment

---

### 📄 organization-extension-plan.claude.md
**Propósito**: Plan de extensión no invasiva del modelo Organization  
**Tamaño**: ~280 líneas  
**Última actualización**: Inicial

#### 🔍 Contenido Clave:
- **Estrategia No Invasiva**: Extensión mediante `HealthOrganization`
- **20+ Nuevos Campos**:
  - `sogcs_enabled`: Boolean para activar SOGCS
  - `sogcs_configuration`: JSONField con configuración
  - `coordinador_calidad`: ForeignKey para responsable
  - `fecha_activacion_sogcs`: Timestamp de activación
- **8 Nuevos Métodos**:
  - `activate_sogcs()`: Activar módulo
  - `get_sogcs_status()`: Estado actual
  - `get_responsables_sogcs()`: Responsables asignados
- **Migración Django**: Scripts de migración segura
- **Validaciones**: Reglas de negocio específicas

#### 🎯 Usar cuando necesites:
- Extender el modelo Organization para SOGCS
- Implementar la migración Django
- Agregar métodos específicos SOGCS
- Mantener compatibilidad con sistema existente

---

### 📄 suh-data-models.claude.md
**Propósito**: Modelos de datos específicos para SUH con autoevaluación  
**Tamaño**: ~340 líneas  
**Última actualización**: Incluye autoevaluación como proceso central

#### 🔍 Contenido Clave:
- **Modelos Django SUH**:
  - `SUHEstandar`: Estándares según Resolution 3100/2019
  - `SUHAutoevaluacion`: Proceso central de autoevaluación
  - `AutoevaluacionEstandar`: Evaluación por estándar
  - `EvidenciaAutoevaluacion`: Gestión de evidencias
  - `PlanMejoramiento`: Planes de mejora derivados
  - `AccionMejora`: Acciones específicas de mejora
- **Flujo de Autoevaluación**: Proceso completo desde inicio hasta seguimiento
- **Estados y Transiciones**: Workflow definido para autoevaluación
- **Validaciones**: Reglas de negocio específicas para SUH

#### 🎯 Usar cuando necesites:
- Implementar el submódulo SUH completo
- Desarrollar el proceso de autoevaluación
- Crear gestión de evidencias y planes de mejora
- Entender el workflow de habilitación

---

### 📄 rbac-permissions-system.claude.md
**Propósito**: Sistema completo de permisos y roles para SOGCS  
**Tamaño**: ~940 líneas  
**Última actualización**: Inicial

#### 🔍 Contenido Clave:
- **14+ Roles SOGCS**:
  - `SOGCS_DIRECTOR`: Rol estratégico principal
  - `SUH_COORDINATOR`: Coordinador de habilitación
  - `PAMEC_COORDINATOR`: Coordinador de auditoría
  - `QUALITY_AUDITOR`: Auditor de calidad
- **50+ Permisos Granulares**:
  - SUH: `suh.autoevaluacion.create`, `suh.evidencias.manage`
  - PAMEC: `pamec.auditoria.execute`, `pamec.hallazgos.register`
  - SIC: `sic.datos.capture`, `sic.reportes.generate`
  - SUA: `sua.proceso.initiate`, `sua.verificacion.coordinate`
- **Sistema de Delegación**: Delegación temporal con aprobaciones
- **Condiciones de Acceso**: Horarios, ubicación, certificaciones
- **Audit Trail**: Trazabilidad completa de acciones
- **Modelos Django**: Implementación completa RBAC

#### 🎯 Usar cuando necesites:
- Implementar el sistema de permisos SOGCS
- Crear roles específicos para el módulo
- Desarrollar delegación de permisos
- Implementar audit trail y trazabilidad
- Configurar condiciones de acceso específicas

---

### 📄 configuration-system-requirements.claude.md
**Propósito**: Sistema de configuración centralizado para parámetros SOGCS  
**Tamaño**: ~1200+ líneas  
**Última actualización**: Completo con plan de implementación

#### 🔍 Contenido Clave:
- **6 Dominios de Configuración**:
  1. **Notificaciones**: Email, SMS, WhatsApp, in-app
  2. **Escalamientos**: 5 niveles de severidad, cadena jerárquica
  3. **Alertas**: Umbrales, vencimientos, rendimiento
  4. **Reportes**: Automáticos, regulatorios, personalizados
  5. **Workflows**: Aprobaciones, timeouts, validaciones
  6. **Integración**: APIs REPS, SISPRO, SIVIGILA
- **Plan de Implementación**: 8 semanas, 5 fases, 35+ actividades
- **Cumplimiento Regulatorio**: 15+ normativas colombianas
- **Modelos de Datos**: Python con auditoría completa
- **Testing**: 4 tipos de validación con casos específicos

#### 🎯 Usar cuando necesites:
- Configurar notificaciones y escalamientos
- Implementar alertas inteligentes
- Crear reportes automáticos regulatorios
- Integrar con sistemas gubernamentales
- Seguir el plan de implementación estructurado

---

### 📄 frontend-prototype-specification.claude.md
**Propósito**: Prototipo UX/UI Frontend del dashboard SOGCS  
**Tamaño**: ~540 líneas  
**Última actualización**: Prototipo HTML completado y validado

#### 🔍 Contenido Clave:
- **Dashboard Ejecutivo**: Vista principal con métricas de cumplimiento SOGCS
- **Sub-header Navegacional**: Pestañas por componente con badges informativos
- **Acciones Rápidas**: 6 funciones principales (autoevaluación, auditoría, etc.)
- **Calendario de Actividades**: Vista mensual con eventos codificados por colores
- **Sistema de Diseño Velzon 4.4.1**: Colores, tipografía, componentes healthcare
- **Datos Mock Realistas**: IPS Nivel II con eventos Noviembre 2024
- **Componentes Reutilizables**: SOGCSOverviewCard, StatusBadge, CalendarEvent
- **Plan de Implementación React**: 4 fases con interfaces TypeScript
- **Testing y Validación**: Checklist WCAG 2.1 AA, performance, healthcare UX

#### 🎯 Usar cuando necesites:
- Implementar el dashboard SOGCS en React + TypeScript
- Crear componentes frontend siguiendo Velzon 4.4.1
- Diseñar UX específico para coordinadores de calidad
- Desarrollar calendario de actividades SOGCS
- Aplicar sistema de colores healthcare
- Seguir patrones de diseño ejecutivo para IPS

---

### 📄 sedes-servicios-management.claude.md
**Propósito**: Sistema de gestión de sedes y servicios habilitados con sincronización MinSalud  
**Tamaño**: ~680 líneas  
**Última actualización**: Sistema completo con importación REPS

#### 🔍 Contenido Clave:
- **Gestión de Sedes**: CRUD completo con validación REPS y geolocalización
- **Servicios Habilitados**: Catálogo oficial con 4 modalidades (intramural, extramural, domiciliaria, telemedicina)
- **Importación MinSalud**: Parser Excel del portal https://prestadores.minsalud.gov.co/habilitacion
- **Sincronización Automática**: Consulta periódica al REPS con backup y rollback
- **Modelos Django**: HeadquarterLocation, EnabledHealthService, ServiceHabilitationProcess
- **Servicios Especializados**: REPSExcelParser, REPSSynchronizationService, REPSDataValidator
- **Integración SOGCS**: Alimentación automática SUH, PAMEC, SIC, SUA
- **Cumplimiento Normativo**: Resolución 3100/2019, Circular 030/2018, Resolución 256/2016
- **Plan de Implementación**: 10 semanas con timeline detallado y métricas de éxito

#### 🎯 Usar cuando necesites:
- Implementar gestión de sedes y servicios de salud
- Conectar con portal oficial MinSalud REPS
- Sincronizar datos de habilitación automáticamente
- Crear workflow de nuevas habilitaciones
- Integrar servicios habilitados con módulos SOGCS
- Validar cumplimiento normativo de habilitación
- Gestionar alertas de vencimientos de servicios

---

### 📄 development-plan.claude.md
**Propósito**: Plan completo de desarrollo e implementación del módulo SOGCS  
**Tamaño**: ~800 líneas  
**Última actualización**: Plan de 12 fases con cronograma detallado

#### 🔍 Contenido Clave:
- **Cronograma de Desarrollo**: 20 semanas organizadas en 12 fases estructuradas
- **50+ Tareas Específicas**: Desde infraestructura base hasta deployment en producción
- **6 Hitos Principales**: Validaciones y criterios de aceptación por fase
- **KPIs de Éxito**: Métricas técnicas, de negocio e impacto organizacional
- **Gestión de Riesgos**: Identificación, mitigación y planes de contingencia
- **Recursos y Herramientas**: Stack tecnológico y equipo requerido por fase
- **Cronograma de Recursos**: Asignación de personal especializado por semanas
- **Documentación y Entregables**: Training materials y guías por fase
- **Prerequisites Checklist**: Preparación técnica, de equipo y de negocio
- **Métricas de Performance**: SLAs, coverage, uptime y quality gates

#### 🎯 Usar cuando necesites:
- Planificar implementación completa del módulo SOGCS
- Estimar recursos y timeline para desarrollo
- Establecer hitos y criterios de validación
- Gestionar riesgos técnicos y de negocio
- Coordinar equipo de desarrollo multidisciplinario
- Preparar deployment y go-live strategy
- Definir métricas de éxito y KPIs
- Crear documentation strategy y training materials

## 🔍 GUÍA DE NAVEGACIÓN RÁPIDA

### Por Tipo de Tarea:

#### 🏗️ **Implementación de Backend**
```
1. technical-architecture.claude.md      → Modelos Django base
2. suh-data-models.claude.md            → Modelos SUH específicos
3. sedes-servicios-management.claude.md → Gestión sedes y servicios
4. organization-extension-plan.claude.md → Extensión Organization
5. rbac-permissions-system.claude.md    → Sistema RBAC
```

#### 🎨 **Implementación de Frontend**
```
1. frontend-prototype-specification.claude.md → Prototipo UX/UI completo
2. setup-wizard-requirements.claude.md       → Wizard React + TypeScript
3. README.claude.md                          → Dashboard interfaces
4. technical-architecture.claude.md          → Componentes Velzon base
```

#### ⚙️ **Configuración del Sistema**
```
1. configuration-system-requirements.claude.md → Sistema completo
2. sedes-servicios-management.claude.md        → Sincronización MinSalud
3. rbac-permissions-system.claude.md          → Permisos y roles
```

#### 📋 **Análisis Regulatorio**
```
1. README.claude.md                           → Marco SOGCS general
2. sedes-servicios-management.claude.md       → Normativas habilitación
3. configuration-system-requirements.claude.md → Normativas específicas
4. suh-data-models.claude.md                  → Resolution 3100/2019
```

#### 📋 **Planificación y Gestión**
```
1. development-plan.claude.md                 → Plan completo 12 fases
2. INDEX.claude.md                            → Navegación y estado proyecto
```

### Por Submódulo SOGCS:

#### 🏥 **SUH (Sistema Único de Habilitación)**
- **Principal**: `suh-data-models.claude.md`
- **Gestión Servicios**: `sedes-servicios-management.claude.md`
- **Configuración**: `setup-wizard-requirements.claude.md` (Paso 3)
- **Permisos**: `rbac-permissions-system.claude.md` (SUHPermissions)

#### 📋 **PAMEC (Programa de Auditoría)**
- **Principal**: `technical-architecture.claude.md` (AuditProgram)
- **Configuración**: `setup-wizard-requirements.claude.md` (Paso 4)
- **Permisos**: `rbac-permissions-system.claude.md` (PAMECPermissions)

#### 📊 **SIC (Sistema de Información)**
- **Principal**: `configuration-system-requirements.claude.md` (Reportes)
- **Configuración**: `setup-wizard-requirements.claude.md` (Paso 5)
- **Permisos**: `rbac-permissions-system.claude.md` (SICPermissions)

#### 🎖️ **SUA (Sistema Único de Acreditación)**
- **Principal**: `technical-architecture.claude.md`
- **Permisos**: `rbac-permissions-system.claude.md` (SUAPermissions)

## 📊 MÉTRICAS DEL MÓDULO

### Estado de Completitud:
- ✅ **Análisis de Requerimientos**: 100% - Completo
- ✅ **Diseño de Arquitectura**: 100% - Completo  
- ✅ **Especificación de Datos**: 100% - Completo
- ✅ **Sistema RBAC**: 100% - Completo
- ✅ **Sistema de Configuración**: 100% - Completo
- ✅ **Gestión Sedes y Servicios**: 100% - Completo
- ✅ **Prototipo Frontend**: 100% - Completo
- ✅ **Plan de Desarrollo**: 100% - Completo
- ⏳ **Implementación**: 0% - Listo para iniciar
- ⏳ **Testing**: 0% - Pendiente

### Líneas de Documentación:
- **Total**: ~6,400+ líneas
- **Especificaciones**: ~4,700 líneas
- **Código Django**: ~1,200 líneas
- **Interfaces TypeScript**: ~500 líneas

### Cobertura Regulatoria:
- ✅ **Decree 1011/2006**: Cubierto
- ✅ **Resolution 3100/2019**: Cubierto
- ✅ **ISO 9001:2015**: Cubierto
- ✅ **Normas SOGCS**: 15+ normativas mapeadas

## 🎯 PRÓXIMOS PASOS

### Implementación Según Plan de Desarrollo:
1. **FASE 1-2 (Sem 1-4)**: Backend Foundation → `development-plan.claude.md`
2. **FASE 3-4 (Sem 5-8)**: Core Modules SUH + RBAC
3. **FASE 5-6 (Sem 9-11)**: APIs REST + Frontend Base
4. **FASE 7-8 (Sem 12-14)**: Dashboard + Calendario
5. **FASE 9-10 (Sem 15-17)**: Setup Wizard + Configuración
6. **FASE 11-12 (Sem 18-20)**: Testing + Deployment

Ver cronograma detallado en `development-plan.claude.md`

### Validación:
- Revisar cumplimiento normativo con especialista legal
- Validar modelos con usuario final (coordinadores de calidad)
- Probar wizard con diferentes tipos de instituciones
- Verificar integración con sistemas gubernamentales

---

**📝 Nota**: Este índice se actualiza automáticamente cuando se modifica cualquier archivo del módulo SOGCS. Para navegación eficiente, usa este índice antes de acceder a archivos específicos.