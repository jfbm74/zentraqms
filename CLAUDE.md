# 🎯 Instrucciones para Claude - ZentraQMS

## 🚨 DIRECTIVA PRINCIPAL

**OBLIGATORIO**: Este proyecto utiliza la plantilla **Velzon 4.4.1** que fue comprada. SIEMPRE debes usar los componentes, estilos y recursos de esta plantilla en lugar de crear nuevos desde cero o usar recursos externos.

**Ubicación**: `/Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/`

## ⚡ FLUJO OBLIGATORIO

1. **BUSCAR** en Velzon si existe un componente similar
2. **COPIAR** el componente completo al proyecto ZentraQMS  
3. **ADAPTAR** el componente a las necesidades específicas
4. **NUNCA** crear desde cero si existe en Velzon
5. **NUNCA** usar recursos externos (CDNs, APIs de imágenes)

## 🚫 PROHIBIDO

- ❌ Usar `ui-avatars.com` → ✅ Usar `/assets/images/users/`
- ❌ Usar `flagcdn.com` → ✅ Usar `/assets/images/flags/`  
- ❌ Crear componentes desde cero si existen en Velzon
- ❌ Referencias directas a carpeta de Velzon en imports

## 📋 CHECKLIST OBLIGATORIO

Antes de implementar CUALQUIER funcionalidad:

- [ ] ¿Busqué en Velzon si existe algo similar?
- [ ] ¿Copié el componente de Velzon al proyecto?
- [ ] ¿Copié todos los assets necesarios?
- [ ] ¿Adapté los imports para usar recursos locales?
- [ ] ¿Traduje textos a español?
- [ ] ¿Adapté el contenido al contexto QMS?

## 🚨 PRIMER PASO OBLIGATORIO

**ANTES DE CUALQUIER DESARROLLO**: Revisar [docs/claude/common-traps.md](./docs/claude/common-traps.md) para evitar los 8 errores más frecuentes del proyecto.

## 📚 DOCUMENTACIÓN MODULAR

Para información detallada, consultar:

### 📖 Contexto Principal
- **[docs/claude/project-context.md](./docs/claude/project-context.md)** - Contexto completo del proyecto

### 🚨 Prevención de Errores  
- **[docs/claude/common-traps.md](./docs/claude/common-traps.md)** - 8 errores críticos + soluciones

### 🎨 Desarrollo UI
- **[docs/claude/velzon-components.md](./docs/claude/velzon-components.md)** - Mapeo Velzon → QMS (80+ componentes)
- **[docs/claude/development-patterns.md](./docs/claude/development-patterns.md)** - 10 patrones clave

### 🔧 APIs y Backend
- **[docs/claude/api-endpoints.md](./docs/claude/api-endpoints.md)** - Endpoints completos
- **[docs/claude/rbac-system.md](./docs/claude/rbac-system.md)** - Sistema de permisos

### 🧪 Testing y Calidad
- **[docs/claude/testing-guidelines.md](./docs/claude/testing-guidelines.md)** - Estrategias de testing

## 📊 ESTADO ACTUAL

- **Backend**: Django 5.0 + DRF (✅ 34/34 tests)
- **Frontend**: React 19 + TypeScript (✅ 113/113 tests) 
- **UI Base**: Velzon 4.4.1 template
- **Módulos**: ✅ Auth + Organizations | 🔧 Procesos, Auditorías, KPIs

## 🎯 COMANDOS ESENCIALES

```bash
# Desarrollo
cd backend && python manage.py runserver --settings=config.settings.development
cd frontend && npm run dev

# Testing  
cd backend && python manage.py test --settings=config.settings.testing
cd frontend && npm run test
```

## 🚨 RECORDATORIO FINAL

**NUNCA OLVIDES**: Antes de crear CUALQUIER componente:

1. ¿Existe esto en Velzon?
2. ¿Puedo copiarlo y adaptarlo?  
3. ¿Estoy usando recursos locales?

**Esta plantilla costó dinero y debe ser aprovechada al máximo.**

---

💡 **Para más detalles**: Consultar la documentación modular en `docs/claude/`