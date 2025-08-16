# 🎨 Guía Completa de UI/UX - Velzon 4.4.1 Design System

## 🎯 Principios Fundamentales de Diseño

### **Velzon First Policy**
- **NUNCA** crear componentes desde cero si existen en Velzon
- **SIEMPRE** buscar primero en `/Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/`
- **Copiar → Adaptar → Traducir** al español
- **EVITAR** CDNs externos (ui-avatars, flagcdn, etc.)

### **Design Philosophy**
- **Profesional y Moderno**: Interfaz limpia para aplicaciones empresariales
- **Healthcare-Focused**: Diseño optimizado para profesionales de la salud
- **Mobile-First**: Responsivo desde 320px hasta 1920px+
- **Accesibilidad**: Cumplir con WCAG 2.1 AA

---

## 🎨 Sistema de Colores

### **Paleta Principal**
```scss
// Colores Base
$blue:       #3577f1;    // Secondary
$indigo:     #405189;    // Primary
$purple:     #6559cc;
$pink:       #f672a7;
$red:        #f06548;    // Danger
$orange:     #f1963b;
$yellow:     #f7b84b;    // Warning
$green:      #0ab39c;    // Success
$teal:       #02a8b5;
$cyan:       #299cdb;    // Info

// Grises
$gray-100:   #f3f6f9;
$gray-200:   #eff2f7;
$gray-300:   #e9ebec;
$gray-400:   #ced4da;
$gray-500:   #adb5bd;
$gray-600:   #878a99;
$gray-700:   #495057;
$gray-800:   #343a40;
$gray-900:   #212529;
```

### **Colores Semánticos**
```scss
$primary:    $indigo;     // #405189 - Acciones principales
$secondary:  $blue;       // #3577f1 - Acciones secundarias
$success:    $green;      // #0ab39c - Estados exitosos
$info:       $cyan;       // #299cdb - Información
$warning:    $yellow;     // #f7b84b - Advertencias
$danger:     $red;        // #f06548 - Errores/peligro
$light:      $gray-100;   // #f3f6f9 - Fondos claros
$dark:       $gray-900;   // #212529 - Textos oscuros
```

### **Variaciones de Color (100-900)**
Cada color principal tiene 9 variaciones usando `tint-color()` y `shade-color()`:
- **100-400**: Versiones más claras (tint)
- **500**: Color base
- **600-900**: Versiones más oscuras (shade)

### **Healthcare Context Colors**
```scss
// Específicos para ZentraQMS
$health-primary:    #405189;  // Azul institucional
$health-secondary:  #0ab39c;  // Verde médico
$health-accent:     #f7b84b;  // Amarillo alertas
$health-neutral:    #878a99;  // Gris información
```

---

## 📝 Sistema Tipográfico

### **Fuentes Principales**
```scss
// Familia Principal: HKGrotesk (Premium)
font-family: "hkgrotesk", sans-serif;

// Pesos disponibles:
font-weight: 300;  // Light
font-weight: 400;  // Regular (base)
font-weight: 500;  // Medium
font-weight: 600;  // Semibold
font-weight: 700;  // Bold

// Familia Secundaria: Poppins (Google Fonts)
font-family: "Poppins", sans-serif;
font-weight: 300, 400, 500, 600, 700;
```

### **Jerarquía de Texto**
```scss
// Encabezados (usando HKGrotesk)
h1: 2.5rem (40px) - font-weight: 600
h2: 2rem (32px)   - font-weight: 600  
h3: 1.75rem (28px) - font-weight: 500
h4: 1.5rem (24px)  - font-weight: 500
h5: 1.25rem (20px) - font-weight: 500
h6: 1rem (16px)    - font-weight: 500

// Texto Base
body: 1rem (16px) - font-weight: 400 - line-height: 1.5
small: 0.875rem (14px)
```

### **Tamaños Personalizados**
```scss
$font-size-custom: (
  10: 10px,  11: 11px,  12: 12px,  13: 13px,
  14: 14px,  15: 15px,  16: 16px,  17: 17px,
  18: 18px,  19: 19px,  20: 20px,  21: 21px,
  22: 22px,  23: 23px,  24: 24px,  36: 36px,
  48: 48px
);
```

### **Uso en Healthcare**
- **Títulos de Sección**: H3 con font-weight 600
- **Etiquetas de Formulario**: 14px, font-weight 500
- **Texto de Ayuda**: 12px, color gris
- **Estados/Badges**: 12px, font-weight 600

---

## 📏 Sistema de Espaciado

### **Espaciado Base**
```scss
$spacer: 1rem (16px);

$spacers: (
  0: 0,
  1: 0.25rem (4px),
  2: 0.5rem (8px),
  3: 1rem (16px),
  4: 1.5rem (24px),
  5: 3rem (48px)
);
```

### **Espaciado de Componentes Healthcare**
```scss
// Formularios médicos
$form-spacing: 1.5rem;        // Entre grupos de campos
$field-spacing: 1rem;         // Entre campos individuales
$section-spacing: 2rem;       // Entre secciones

// Cards y contenedores
$card-padding: 1.25rem;       // Padding interno de cards
$card-margin: 1rem;          // Margen entre cards
$container-padding: 1.5rem;   // Padding de contenedores principales
```

### **Breakpoints Responsivos**
```scss
$grid-breakpoints: (
  xs: 0,
  sm: 576px,    // Tablets pequeñas
  md: 768px,    // Tablets
  lg: 992px,    // Laptops
  xl: 1200px,   // Desktops
  xxl: 1400px   // Monitores grandes
);
```

---

## 🎯 Patrones de Componentes

### **1. Sidebar Navigation**
```tsx
// Estructura de menú principal
interface MenuItem {
  id: string;
  label: string;
  icon: string;          // RemixIcon class
  path?: string;
  children?: MenuItem[];
  permissions?: string[];
  badge?: {
    text: string;
    color: 'primary' | 'success' | 'warning' | 'danger';
  };
}

// Clases CSS principales
.app-menu.navbar-menu       // Contenedor principal
.navbar-brand-box           // Área del logo
.nav-link.menu-link         // Enlaces principales
.nav nav-sm flex-column     // Submenús
.menu-title                 // Títulos de sección
```

### **2. Cards y Contenedores**
```tsx
// Card básica de Velzon
<div className="card">
  <div className="card-header">
    <h4 className="card-title mb-0">Título</h4>
  </div>
  <div className="card-body">
    {/* Contenido */}
  </div>
</div>

// Card con acciones
<div className="card">
  <div className="card-header d-flex align-items-center">
    <h4 className="card-title mb-0">Título</h4>
    <div className="flex-shrink-0 ms-auto">
      <button className="btn btn-primary">Acción</button>
    </div>
  </div>
</div>
```

### **3. Formularios Healthcare**
```tsx
// Grupo de campo estándar
<div className="mb-3">
  <label className="form-label" htmlFor="campo">
    Etiqueta <span className="text-danger">*</span>
  </label>
  <input 
    type="text" 
    className="form-control" 
    id="campo"
    placeholder="Ingrese información..."
  />
  <div className="form-text">Texto de ayuda opcional</div>
</div>

// Select con opciones
<div className="mb-3">
  <label className="form-label">Seleccione una opción</label>
  <select className="form-select">
    <option value="">Seleccionar...</option>
    <option value="1">Opción 1</option>
  </select>
</div>
```

### **4. Botones y Acciones**
```tsx
// Botones primarios
<button className="btn btn-primary">Guardar</button>
<button className="btn btn-secondary">Cancelar</button>
<button className="btn btn-success">Aprobar</button>
<button className="btn btn-warning">Advertencia</button>
<button className="btn btn-danger">Eliminar</button>

// Botones de tamaño
<button className="btn btn-primary btn-sm">Pequeño</button>
<button className="btn btn-primary">Normal</button>
<button className="btn btn-primary btn-lg">Grande</button>

// Botones outline
<button className="btn btn-outline-primary">Secundario</button>
```

### **5. Tablas de Datos**
```tsx
// Tabla responsiva estándar
<div className="table-responsive">
  <table className="table table-nowrap">
    <thead className="table-light">
      <tr>
        <th scope="col">ID</th>
        <th scope="col">Nombre</th>
        <th scope="col">Estado</th>
        <th scope="col">Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>001</td>
        <td>Paciente Ejemplo</td>
        <td>
          <span className="badge bg-success">Activo</span>
        </td>
        <td>
          <button className="btn btn-sm btn-primary">Ver</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### **6. Badges y Estados**
```tsx
// Estados de procesos médicos
<span className="badge bg-success">Completado</span>
<span className="badge bg-warning">En Proceso</span>
<span className="badge bg-danger">Crítico</span>
<span className="badge bg-primary">Pendiente</span>
<span className="badge bg-secondary">Inactivo</span>

// Badges con iconos
<span className="badge bg-success">
  <i className="ri-check-line me-1"></i>Aprobado
</span>
```

### **7. Alertas y Notificaciones**
```tsx
// Alert básica
<div className="alert alert-primary" role="alert">
  <strong>Información:</strong> Mensaje informativo
</div>

// Alert con icono
<div className="alert alert-warning" role="alert">
  <i className="ri-alert-line me-2"></i>
  <strong>Advertencia:</strong> Revisar datos médicos
</div>

// Alert dismissible
<div className="alert alert-success alert-dismissible" role="alert">
  <strong>Éxito:</strong> Datos guardados correctamente
  <button type="button" className="btn-close" 
          aria-label="Close"></button>
</div>
```

---

## 🚨 Patrones Específicos Healthcare

### **1. Wizard de Configuración**
```tsx
// Stepper horizontal
<div className="form-wizard-wrapper">
  <div className="d-flex align-items-center mb-4">
    <div className="step-item current">
      <div className="step-number">1</div>
      <div className="step-title">Información Básica</div>
    </div>
    <div className="step-item">
      <div className="step-number">2</div>
      <div className="step-title">Servicios</div>
    </div>
  </div>
</div>
```

### **2. Indicadores de Estado Médico**
```tsx
// Semáforo de riesgo
<div className="risk-indicator">
  <span className="status-dot bg-danger"></span>
  <span className="ms-2">Alto Riesgo</span>
</div>

// Progreso de auditoría
<div className="progress mb-2">
  <div className="progress-bar bg-success" 
       style={{width: '75%'}}>75%</div>
</div>
```

### **3. Cards de KPIs**
```tsx
<div className="card card-animate">
  <div className="card-body">
    <div className="d-flex align-items-center">
      <div className="flex-grow-1">
        <span className="text-muted">Auditorías Completadas</span>
        <h4 className="mb-0">
          <span className="counter-value">24</span>
        </h4>
      </div>
      <div className="flex-shrink-0">
        <div className="avatar-sm rounded-circle bg-success-subtle">
          <span className="avatar-title">
            <i className="ri-check-line text-success"></i>
          </span>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🛠️ Iconografía

### **RemixIcon (Principal)**
```scss
// Iconos más utilizados en healthcare
ri-hospital-line          // Hospitales/Centros
ri-user-line             // Usuarios
ri-settings-3-line       // Configuración
ri-file-list-3-line      // Procesos
ri-bar-chart-line        // Indicadores
ri-shield-check-line     // Auditorías
ri-book-open-line        // Normograma
ri-dashboard-2-line      // Dashboard
ri-check-line            // Confirmación
ri-alert-line            // Alertas
ri-close-line            // Cerrar/Cancelar
```

### **Tamaños de Iconos**
```scss
.ri-xs { font-size: 0.75rem; }    // 12px
.ri-sm { font-size: 0.875rem; }   // 14px
.ri-base { font-size: 1rem; }     // 16px (default)
.ri-lg { font-size: 1.25rem; }    // 20px
.ri-xl { font-size: 1.5rem; }     // 24px
.ri-2xl { font-size: 2rem; }      // 32px
```

---

## 🌙 Modo Oscuro y Temas

### **CSS Variables para Dark Mode**
```scss
// Light mode (default)
:root {
  --vz-body-bg: #f3f3f9;
  --vz-body-color: #212529;
  --vz-primary: #405189;
  --vz-secondary-bg: #ffffff;
}

// Dark mode
[data-bs-theme="dark"] {
  --vz-body-bg: #212529;
  --vz-body-color: #dee2e6;
  --vz-secondary-bg: #2a2f34;
}
```

### **Implementación Responsive**
```tsx
// Toggle de tema
const toggleDarkMode = () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-bs-theme');
  html.setAttribute('data-bs-theme', 
    currentTheme === 'dark' ? 'light' : 'dark'
  );
};
```

---

## 📱 Responsive Design Patterns

### **Mobile-First Approach**
```scss
// Base styles (mobile)
.healthcare-card {
  padding: 1rem;
  margin-bottom: 1rem;
}

// Tablet and up
@media (min-width: 768px) {
  .healthcare-card {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
}

// Desktop and up
@media (min-width: 992px) {
  .healthcare-card {
    padding: 2rem;
  }
}
```

### **Sidebar Responsivo**
```scss
// Mobile: Sidebar oculto por defecto
@media (max-width: 991.98px) {
  .app-menu {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .vertical-sidebar-enable .app-menu {
    transform: translateX(0);
  }
}
```

---

## ♿ Accesibilidad (WCAG 2.1)

### **Contraste de Colores**
```scss
// Asegurar contraste mínimo 4.5:1
$text-on-primary: #ffffff;    // Blanco sobre #405189
$text-on-secondary: #ffffff;  // Blanco sobre #3577f1
$text-on-success: #ffffff;    // Blanco sobre #0ab39c
$text-on-warning: #000000;    // Negro sobre #f7b84b
```

### **Atributos ARIA Requeridos**
```tsx
// Navegación
<nav role="navigation" aria-label="Navegación principal">
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" aria-expanded="false">
        Menú
      </a>
    </li>
  </ul>
</nav>

// Formularios
<label htmlFor="campo" className="form-label">
  Nombre <span aria-label="requerido">*</span>
</label>
<input 
  id="campo"
  aria-describedby="campo-help"
  aria-required="true"
/>
<div id="campo-help" className="form-text">
  Texto de ayuda
</div>
```

### **Focus Management**
```scss
// Estados de focus visibles
.btn:focus,
.form-control:focus,
.nav-link:focus {
  outline: 2px solid var(--vz-primary);
  outline-offset: 2px;
}
```

---

## 🎨 Animaciones y Transiciones

### **Transiciones Estándar**
```scss
// Transiciones base
$transition-base: all 0.2s ease-in-out;
$transition-fade: opacity 0.15s linear;
$transition-collapse: height 0.35s ease;

// Hover effects
.btn {
  transition: $transition-base;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
}

// Card animations
.card-animate {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
}
```

### **Loading States**
```tsx
// Spinner de carga
<div className="d-flex justify-content-center">
  <div className="spinner-border text-primary" role="status">
    <span className="visually-hidden">Cargando...</span>
  </div>
</div>

// Skeleton loading
<div className="placeholder-glow">
  <span className="placeholder col-7"></span>
  <span className="placeholder col-4"></span>
</div>
```

---

## 📋 Checklist de Implementación

### **✅ Antes de Crear un Componente**
- [ ] ¿Existe en Velzon? Buscar en `/Velzon_4.4.1/React-TS/Master/`
- [ ] ¿Es específico para healthcare? Adaptar con contexto médico
- [ ] ¿Cumple con accesibilidad? WCAG 2.1 AA
- [ ] ¿Es responsive? Mobile-first design
- [ ] ¿Soporta dark mode? CSS variables

### **✅ Componente Terminado**
- [ ] Tipografía correcta (HKGrotesk/Poppins)
- [ ] Colores del design system
- [ ] Espaciado consistente
- [ ] Estados hover/focus/active
- [ ] Iconos RemixIcon
- [ ] Traducción al español
- [ ] Props TypeScript tipadas
- [ ] Documentación de uso

### **✅ Testing UX**
- [ ] Funciona en móvil (320px+)
- [ ] Navegación por teclado
- [ ] Lectores de pantalla
- [ ] Contraste de colores
- [ ] Performance (< 100ms interactions)

---

## 🔗 Referencias y Recursos

### **Documentación Velzon**
- Path local: `/Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/`
- Componentes: `src/Components/Common/`
- Estilos: `src/assets/scss/`
- Layouts: `src/Layouts/`

### **Librerías y Dependencies**
```json
{
  "reactstrap": "^9.x",          // Bootstrap components
  "react-router-dom": "^6.x",    // Routing
  "simplebar-react": "^3.x",     // Custom scrollbars
  "classnames": "^2.x"           // Conditional classes
}
```

### **Herramientas de Desarrollo**
- **Storybook**: Para documentar componentes
- **Axe DevTools**: Para testing de accesibilidad
- **React DevTools**: Para debugging
- **Color Oracle**: Para simulación de daltonismo

---

## 🚀 Próximos Pasos

1. **Crear Component Library**: Documentar todos los componentes adaptados
2. **Setup Storybook**: Para visualización y testing
3. **Accessibility Audit**: Revisión completa WCAG 2.1
4. **Performance Monitoring**: Core Web Vitals
5. **Design Tokens**: Sistema de tokens de diseño
6. **User Testing**: Con profesionales de la salud

---

*Esta guía debe ser actualizada conforme evolucionan los patrones de diseño y se recibe feedback de usuarios del sistema de salud.*