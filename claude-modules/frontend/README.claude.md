# 🚀 ZentraQMS Frontend Development Guide

## 📋 Overview

Este directorio contiene la documentación completa para el desarrollo del frontend de ZentraQMS, una aplicación de gestión de calidad para instituciones de salud que utiliza React 19 + TypeScript 5.3 con el sistema de diseño Velzon 4.4.1.

## 📚 Documentación Principal

### 🎯 Guías de Implementación

1. **[Frontend Design Patterns](../common/frontend-design-patterns.claude.md)** 🏗️
   - **Análisis completo de la interfaz SOGCS sedes**
   - Patrones arquitectónicos de componentes
   - Gestión de estado con Zustand
   - Plantillas y checklist de implementación
   - **CONSULTAR PRIMERO** para nuevas páginas/rutas

2. **[Velzon UI/UX Guide](./velzon-ui-ux-guide.claude.md)** 🎨
   - Sistema de diseño Velzon 4.4.1 completo
   - Colores, tipografía y espaciado
   - Componentes y patrones específicos de healthcare
   - Responsive design y accesibilidad
   - **REFERENCIA PRINCIPAL** para diseño y UI

3. **[Velzon Integration Guide](./velzon-guide.claude.md)** 🔧
   - Integración técnica de Velzon
   - Configuración y setup
   - Adaptación de componentes
   - Troubleshooting común

## 🏗️ Arquitectura Frontend

### Tecnologías Principales
- **React 19** con Hooks y Context
- **TypeScript 5.3** con tipado estricto
- **Vite 5.0** como bundler
- **Zustand** para gestión de estado
- **Velzon 4.4.1** como design system

### Estructura de Componentes Establecida

```
Page Component (ej: SedesPage)
├── LayoutWithBreadcrumb (Layout principal)
├── Modals (Estado persistente)
│   ├── FormModal (Crear/Editar)
│   ├── DetailModal (Vista detallada)
│   ├── DeleteModal (Confirmación)
│   └── ImportModal (Importación masiva)
├── SimpleTable (Tabla de datos)
├── Navigation Tabs (Filtros)
└── Action Buttons (CRUD + Bulk)
```

## 🎯 Patrones de Diseño Identificados

### 1. Layout y Navegación
- **LayoutWithBreadcrumb**: Layout responsivo con sidebar dinámico
- **Configuración de Módulos**: Sistema centralizado de breadcrumbs
- **Sistema de Pestañas**: Filtros de estado integrados

### 2. Formularios
- **Modal Multi-Paso**: Wizard con validación por etapas
- **Validación en Tiempo Real**: Error handling granular
- **Estado Unificado**: Gestión consistente de formularios

### 3. Gestión de Estado
- **Zustand Stores**: Patrón establecido para CRUD operations
- **Estado Local vs Global**: Separación clara de responsabilidades
- **Hooks Customizados**: useModuleConfig, useCurrentOrganization

### 4. Interacciones y UX
- **Estados de Carga**: Spinners y skeleton loading
- **Estados de Error**: Error boundaries con retry
- **Estados Vacíos**: Empty states con call-to-action
- **Toast Notifications**: Feedback consistente

## 📋 Quick Start para Nuevas Páginas

### Checklist de Implementación

**📂 Layout y Navegación**
- [ ] Usar `LayoutWithBreadcrumb`
- [ ] Configurar módulo en `moduleConfigs.ts`
- [ ] Implementar breadcrumb personalizado

**🔄 Estado y Datos**
- [ ] Crear/usar Zustand store siguiendo el patrón establecido
- [ ] Implementar estado local de página con interface tipada
- [ ] Configurar hooks de organización

**📝 Formularios y Modales**
- [ ] Modal de creación/edición con validación
- [ ] Modal de detalles si es necesario
- [ ] Modal de confirmación para eliminación

**📊 Tabla de Datos**
- [ ] Usar `SimpleTable` con columnas tipadas
- [ ] Implementar acciones por fila (Ver/Editar/Eliminar)
- [ ] Sistema de tabs para filtros
- [ ] Bulk actions con checkboxes

**✨ UX y Feedback**
- [ ] Estados de carga con spinners
- [ ] Estados de error con retry
- [ ] Estados vacíos con call-to-action
- [ ] Toast notifications para feedback

**📱 Responsive y Accesibilidad**
- [ ] Pruebas en móvil (320px+)
- [ ] Atributos ARIA
- [ ] Navegación por teclado
- [ ] Contraste WCAG 2.1 AA

## 🛠️ Herramientas de Desarrollo

### Comandos Principales
```bash
# Desarrollo
cd frontend && npm run dev

# Testing
cd frontend && npm run test

# Build
cd frontend && npm run build

# Lint y format
cd frontend && npm run lint
cd frontend && npm run format
```

### VS Code Extensions Recomendadas
- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Hero**
- **Auto Rename Tag**
- **Bracket Pair Colorizer 2**
- **GitLens**
- **Prettier - Code formatter**
- **ESLint**

## 🎨 Design System Quick Reference

### Colores Principales
```scss
$primary: #405189 (Indigo)    // Acciones principales
$secondary: #3577f1 (Blue)    // Acciones secundarias
$success: #0ab39c (Green)     // Estados exitosos
$warning: #f7b84b (Yellow)    // Advertencias
$danger: #f06548 (Red)        // Errores/críticos
```

### Iconografía RemixIcon
```scss
// Acciones CRUD
ri-add-line              // Crear
ri-edit-2-fill           // Editar
ri-eye-fill              // Ver
ri-delete-bin-5-fill     // Eliminar

// Estados
ri-check-line            // Éxito
ri-time-line             // En proceso
ri-close-line            // Error
```

## 🚨 Reglas Críticas

### 1. Velzon First Policy
- **NUNCA** crear componentes desde cero si existen en Velzon
- **SIEMPRE** buscar primero en `/Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/`
- **Proceso**: Copiar → Adaptar → Traducir al español

### 2. Layout Architecture Compliance
- **SIEMPRE** usar `LayoutWithBreadcrumb` o `ModuleLayout`
- **SIEMPRE** seguir el patrón de configuración de módulos
- **NUNCA** crear layouts custom sin consultar los existentes

### 3. TypeScript First
- **Todas** las interfaces deben estar tipadas
- **Todos** los componentes deben tener props tipadas
- **Todo** el estado debe usar interfaces específicas

### 4. Healthcare Context
- **Siempre** considerar el contexto médico en el diseño
- **Siempre** usar terminología de salud apropiada
- **Siempre** cumplir con estándares de accesibilidad médica

## 📚 Recursos Adicionales

### Documentación Interna
- **[Common Patterns](../common/patterns.claude.md)** - Patrones generales del sistema
- **[Architecture](../architecture/README.claude.md)** - Decisiones arquitectónicas
- **[Conventions](../conventions.claude.md)** - Estándares de código

### Documentación Externa
- **[React 19 Docs](https://react.dev/)** - Documentación oficial
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - Guía completa
- **[Zustand](https://github.com/pmndrs/zustand)** - State management
- **[Vite](https://vitejs.dev/)** - Build tool
- **[RemixIcon](https://remixicon.com/)** - Iconografía

### Herramientas de Diseño
- **[Bootstrap 5](https://getbootstrap.com/docs/5.3/)** - Framework CSS
- **[Velzon Documentation](https://velzon.stackbros.in/)** - Sistema de diseño
- **[Color Oracle](https://colororacle.org/)** - Simulación daltonismo
- **[Axe DevTools](https://www.deque.com/axe/devtools/)** - Testing accesibilidad

---

## 🎯 Para Desarrolladores

### Si eres nuevo en el proyecto:
1. Lee **[Frontend Design Patterns](../common/frontend-design-patterns.claude.md)** para entender la arquitectura
2. Revisa **[Velzon UI/UX Guide](./velzon-ui-ux-guide.claude.md)** para el sistema de diseño
3. Examina la interfaz SOGCS sedes como referencia
4. Sigue el checklist de implementación para nuevas páginas

### Si vas a crear una nueva página:
1. **Analiza** la interfaz SOGCS sedes como patrón base
2. **Busca** componentes existentes en Velzon antes de crear nuevos
3. **Sigue** el patrón de estado unificado establecido
4. **Usa** SimpleTable para listados de datos
5. **Implementa** todos los estados (loading, error, empty)

### Si vas a modificar componentes existentes:
1. **Mantén** consistencia con patrones establecidos
2. **Actualiza** interfaces TypeScript si es necesario
3. **Prueba** en móvil y desktop
4. **Verifica** accesibilidad con herramientas

---

*Documentación actualizada: 2025-08-21*
*Basada en análisis de la interfaz SOGCS sedes y patrones establecidos*