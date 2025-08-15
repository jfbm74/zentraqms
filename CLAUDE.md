# 🎯 ZentraQMS - Arquitectura Modular Claude

## 🏥 Contexto del Proyecto

**ZentraQMS** es un Sistema de Gestión de Calidad (QMS) integral diseñado específicamente para instituciones de salud en Colombia, cumpliendo con normativas nacionales y estándares ISO 9001:2015.

### Stack Tecnológico Principal
- **Backend**: Django 5.0 + DRF 3.15 + PostgreSQL 15
- **Frontend**: React 19 + TypeScript 5.3 + Vite 5.0
- **UI Template**: Velzon 4.4.1 (Licencia comercial)
- **DevOps**: Docker + GitHub Actions
- **Testing**: pytest (Backend) + Vitest (Frontend)

## 📚 DOCUMENTACIÓN MODULAR

### 🎯 Documentos Principales
- **[Contexto General](./claude.md)** - Visión general del sistema
- **[Convenciones](./claude-modules/conventions.claude.md)** - Estándares de código obligatorios
- **[Arquitectura](./claude-modules/architecture/README.claude.md)** - Decisiones arquitectónicas

### 🚀 Guías de Desarrollo
- **[Backend Guide](./claude-modules/backend/README.claude.md)** - Django + DRF
- **[Frontend Guide](./claude-modules/frontend/README.claude.md)** - React + TypeScript
- **[Velzon Integration](./claude-modules/frontend/velzon-guide.claude.md)** - Uso de la plantilla
- **[Testing Strategy](./claude-modules/testing/README.claude.md)** - Estrategias de pruebas

### 📦 Módulos del Sistema
- **[Autenticación](./claude-modules/auth/README.claude.md)** - JWT + RBAC ✅
- **[Organizaciones](./claude-modules/organization/README.claude.md)** - Gestión institucional ✅
- **[Procesos](./claude-modules/processes/README.claude.md)** - Mapeo de procesos 🔧
- **[Auditorías](./claude-modules/audits/README.claude.md)** - Sistema de auditorías 🔧
- **[Indicadores](./claude-modules/indicators/README.claude.md)** - KPIs y métricas 🔧
- **[Normograma](./claude-modules/normogram/README.claude.md)** - Gestión normativa 🔧

### 🔧 Configuración y Despliegue
- **[Deployment](./claude-modules/deployment/README.claude.md)** - Docker + CI/CD
- **[Security](./claude-modules/security/README.claude.md)** - Políticas de seguridad
- **[Performance](./claude-modules/performance/README.claude.md)** - Optimización

## 🚨 DIRECTIVAS CRÍTICAS

### Velzon Template - USO OBLIGATORIO
```
⚠️ NUNCA crear componentes desde cero si existen en Velzon
✅ SIEMPRE buscar primero en: /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/
✅ Copiar → Adaptar → Traducir al español
❌ NO usar CDNs externos (ui-avatars, flagcdn, etc.)
```

### Flujo de Desarrollo Obligatorio
1. **Consultar** documentación modular específica
2. **Verificar** componentes existentes en Velzon
3. **Seguir** convenciones establecidas
4. **Testear** toda funcionalidad nueva
5. **Documentar** cambios significativos

## 📊 Estado del Sistema

| Módulo | Completado | Tests | Documentación |
|--------|------------|-------|---------------|
| Autenticación | 100% | ✅ 15/15 | ✅ Completa |
| Organizaciones | 95% | ✅ 22/22 | ✅ Completa |
| Procesos | 15% | 🔧 3/20 | 📝 En progreso |
| Auditorías | 10% | 🔧 2/15 | 📝 En progreso |
| Indicadores | 5% | 🔧 1/10 | 📝 Pendiente |
| Normograma | 5% | 🔧 0/10 | 📝 Pendiente |

## 🎯 Comandos Rápidos

```bash
# Desarrollo
make dev              # Inicia backend y frontend
make test             # Ejecuta todos los tests
make docs             # Genera documentación

# Backend específico
cd backend && python manage.py runserver --settings=config.settings.development
cd backend && python manage.py test --settings=config.settings.testing

# Frontend específico  
cd frontend && npm run dev
cd frontend && npm run test
cd frontend && npm run build
```

## 🧭 Navegación Rápida por Contexto

### Para implementar una nueva feature:
1. Revisar **[Convenciones](./claude-modules/conventions.claude.md)**
2. Consultar módulo específico en **[claude-modules/](./claude-modules/)**
3. Verificar componentes en **[Velzon Guide](./claude-modules/frontend/velzon-guide.claude.md)**

### Para resolver problemas:
1. Consultar **[Common Traps](./docs/claude/common-traps.md)**
2. Revisar **[Troubleshooting](./claude-modules/troubleshooting/README.claude.md)**

### Para optimizar rendimiento:
1. Ver **[Performance Guide](./claude-modules/performance/README.claude.md)**
2. Aplicar **[Best Practices](./claude-modules/common/patterns.claude.md)**

## 🔐 Principios Fundamentales

1. **Velzon First**: Usar componentes existentes de la plantilla
2. **Test Driven**: Escribir tests antes del código
3. **RBAC Everywhere**: Validar permisos en cada endpoint
4. **Audit Everything**: Registrar todas las operaciones
5. **Colombian Context**: Cumplir normativa de salud colombiana

---

💡 **Nota para Claude**: Este es tu punto de entrada principal. Para tareas específicas, navega a la documentación modular correspondiente en `./claude-modules/`