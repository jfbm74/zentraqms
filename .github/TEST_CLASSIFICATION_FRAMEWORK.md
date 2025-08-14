# 🎯 Framework de Clasificación de Tests - ZentraQMS

## 📋 **PROCESO SISTEMÁTICO PARA NUEVOS MÓDULOS**

Cuando desarrolles un nuevo módulo, usa este proceso para determinar qué tests son críticos vs no críticos:

---

## 🔍 **PASO 1: MATRIZ DE CRITICIDAD**

### ✅ **TESTS CRÍTICOS** (Bloquean deployment)

#### **A. FUNCIONALIDAD CORE DEL NEGOCIO**
- [ ] **Autenticación y autorización**
- [ ] **Operaciones CRUD principales** del módulo
- [ ] **Validaciones de datos críticas** (NITs, emails, etc.)
- [ ] **Flujos de trabajo principales** del usuario
- [ ] **Integraciones con otros módulos** esenciales

#### **B. HOOKS Y SERVICIOS PRINCIPALES**
- [ ] **Custom hooks** que manejan estado crítico
- [ ] **API calls** para operaciones principales  
- [ ] **Estado management** (Redux, Zustand, Context)
- [ ] **Validaciones de formularios** principales
- [ ] **Lógica de navegación** entre pasos críticos

#### **C. FLUJOS END-TO-END CRÍTICOS**
- [ ] **Happy path** del módulo (caso de uso principal)
- [ ] **Manejo de errores** en operaciones críticas
- [ ] **Guardar y cargar datos** principales
- [ ] **Interacciones entre componentes** esenciales

#### **D. BACKEND CORE**
- [ ] **Modelos y validaciones** de Django
- [ ] **APIs y serializers** principales
- [ ] **Permisos y autenticación** del módulo
- [ ] **Operaciones de base de datos** críticas

---

### ⚠️ **TESTS NO CRÍTICOS** (Informativos)

#### **A. LIMITACIONES DE ENTORNO**
- [ ] **Routing en JSdom** (react-router problemas)
- [ ] **File uploads** (FormData, File API)
- [ ] **DOM APIs específicas** no implementadas en JSdom
- [ ] **Browser-specific APIs** (localStorage edge cases)
- [ ] **CSS-in-JS** rendering tests

#### **B. PROBLEMAS DE MOCKING COMPLEJO**
- [ ] **Third-party libraries** con estado interno
- [ ] **WebSocket connections** 
- [ ] **Timer/setTimeout** complejos
- [ ] **External API integrations** específicas
- [ ] **File system operations**

#### **C. TESTS DE UI/UX**
- [ ] **Responsive design** tests
- [ ] **Animation/transition** tests  
- [ ] **Accessibility** (si no afecta funcionalidad core)
- [ ] **Visual regression** tests
- [ ] **Performance** tests (no funcionales)

#### **D. EDGE CASES ESPECÍFICOS**
- [ ] **Browser compatibility** específico
- [ ] **Internationalization** edge cases
- [ ] **Error boundaries** complejos
- [ ] **Development-only** features

---

## 🧩 **PASO 2: APLICAR EL FRAMEWORK POR MÓDULO**

### **Template para Nuevo Módulo: [NOMBRE_MÓDULO]**

```markdown
## 🎯 Clasificación de Tests - Módulo: [NOMBRE_MÓDULO]

### ✅ TESTS CRÍTICOS
#### Funcionalidad Core:
- [ ] [Test específico 1] - [Razón]
- [ ] [Test específico 2] - [Razón]

#### Hooks/Servicios:
- [ ] [Hook test 1] - [Razón]
- [ ] [Service test 1] - [Razón]

#### E2E Críticos:
- [ ] [Flujo principal] - [Razón]
- [ ] [Manejo errores] - [Razón]

#### Backend:
- [ ] [Modelo test 1] - [Razón]
- [ ] [API test 1] - [Razón]

### ⚠️ TESTS NO CRÍTICOS  
#### Limitaciones JSdom:
- [ ] [Test específico] - [Limitación específica]

#### Mocking Complejo:
- [ ] [Test específico] - [Problema de mocking]

#### UI/UX:
- [ ] [Test específico] - [Razón por ser cosmético]
```

---

## 📊 **PASO 3: EJEMPLOS PRÁCTICOS POR MÓDULO**

### **Ejemplo: Módulo de Auditorías**

#### ✅ **CRÍTICOS**:
```typescript
// 🎯 Funcionalidad core
'src/hooks/__tests__/useAudit.test.tsx'              // Hook principal
'src/services/__tests__/audit.service.test.ts'      // Service core  
'src/__tests__/e2e/audit-creation-flow.test.tsx'    // Flujo principal
'src/components/audit/__tests__/AuditForm.test.tsx' // Formulario principal

// 🔧 Backend
'backend/apps/audit/test_models.py'                  // Modelos
'backend/apps/audit/test_apis.py'                    // APIs
```

#### ⚠️ **NO CRÍTICOS**:
```typescript
// 🔶 Limitaciones JSdom
'src/components/audit/__tests__/AuditFileUpload.test.tsx' // File API issues
'src/pages/audit/__tests__/AuditDashboard.test.tsx'      // Routing complexo

// 🔶 Mocking complejo  
'src/services/__tests__/audit-notifications.test.ts'     // WebSocket mocking
```

### **Ejemplo: Módulo de Procesos**

#### ✅ **CRÍTICOS**:
```typescript
// 🎯 Process management core
'src/hooks/__tests__/useProcess.test.tsx'
'src/hooks/__tests__/useProcessValidation.test.tsx'
'src/__tests__/e2e/process-lifecycle.test.tsx'
'backend/apps/processes/test_models.py'
'backend/apps/processes/test_workflows.py'
```

#### ⚠️ **NO CRÍTICOS**:
```typescript
// 🔶 Diagram rendering (canvas issues)
'src/components/process/__tests__/ProcessDiagram.test.tsx'

// 🔶 Complex drag-and-drop (jsdom limitations)
'src/components/process/__tests__/ProcessBuilder.test.tsx'
```

---

## 🔧 **PASO 4: CONFIGURACIÓN AUTOMÁTICA**

### **1. Actualizar package.json**
```json
{
  "scripts": {
    "test:critical": "vitest run src/hooks/__tests__/useAuth.test.tsx src/hooks/__tests__/useAutoSave.test.tsx src/hooks/__tests__/useWizardNavigation.test.tsx src/__tests__/e2e/organization-flow.test.tsx [NUEVOS_TESTS_CRÍTICOS]",
    
    "test:critical:audit": "vitest run src/hooks/__tests__/useAudit.test.tsx src/__tests__/e2e/audit-flow.test.tsx",
    
    "test:critical:processes": "vitest run src/hooks/__tests__/useProcess.test.tsx src/__tests__/e2e/process-flow.test.tsx",
    
    "test:non-critical": "vitest run [TESTS_NO_CRÍTICOS] || true"
  }
}
```

### **2. Actualizar GitHub Workflow**
```yaml
# En .github/workflows/smart-testing.yml
matrix:
  test-suite:
    # Tests críticos existentes...
    
    # 🆕 Nuevos módulos críticos
    - name: "Frontend useAudit"
      command: "npx vitest run src/hooks/__tests__/useAudit.test.tsx"
      working-directory: "./frontend"
      
    - name: "Frontend E2E Audit"
      command: "npx vitest run src/__tests__/e2e/audit-flow.test.tsx"
      working-directory: "./frontend"
```

---

## 🎯 **PASO 5: CHECKLIST DE REVISIÓN**

### **Al agregar nuevo test, pregúntate:**

#### ✅ **¿Es CRÍTICO si...?**
- [ ] **¿Rompe funcionalidad core del negocio?**
- [ ] **¿Afecta flujos principales del usuario?**  
- [ ] **¿Compromete seguridad o datos?**
- [ ] **¿Bloquea otros módulos dependientes?**
- [ ] **¿Es parte del happy path principal?**

#### ⚠️ **¿Es NO CRÍTICO si...?**
- [ ] **¿Es limitación del entorno de testing?**
- [ ] **¿Funciona bien en browser real?**
- [ ] **¿Es problema de mocking complejo?**
- [ ] **¿Es edge case muy específico?**
- [ ] **¿Es feature cosmética/UX?**

---

## 📈 **PASO 6: MÉTRICAS Y EVOLUCIÓN**

### **Medir mensualmente:**
```bash
# Ejecutar y medir
npm run test:critical     # Debe ser 100%
npm run test:non-critical # Puede fallar
npm run test              # Estado general
```

### **KPIs a trackear:**
- **Tests críticos passing %** (objetivo: 100%)
- **Deployments bloqueados** por tests críticos vs no críticos  
- **Tiempo promedio** de ejecución de tests críticos
- **Número de tests** migrados de crítico → no crítico (optimización)

### **Revisión trimestral:**
- ¿Hay tests no críticos que se volvieron críticos?
- ¿Se resolvieron limitaciones de JSdom?  
- ¿Nuevos patrones de criticidad identificados?

---

## 🎯 **REGLA DE ORO**

> **"Si un test falla y el usuario en un browser real NO puede ver el problema, entonces NO es crítico"**

### **Proceso de validación:**
1. **Test falla** → ¿Funciona en browser real?
2. **Sí funciona** → Clasificar como NO crítico
3. **No funciona** → Clasificar como CRÍTICO
4. **Documentar razón** en matriz de clasificación

---

## 📚 **DOCUMENTACIÓN POR MÓDULO**

Crear para cada módulo nuevo:
```
/docs/testing/
├── audit-module-test-classification.md
├── processes-module-test-classification.md  
├── indicators-module-test-classification.md
└── normogram-module-test-classification.md
```

Cada archivo sigue el template del **Paso 2**.

---

## 🚀 **RESULTADO ESPERADO**

Con este framework sistemático:

✅ **Consistency** - Clasificación consistente entre módulos  
✅ **Scalability** - Fácil agregar nuevos módulos  
✅ **Maintainability** - Proceso claro para todo el equipo  
✅ **Quality** - Foco en tests que realmente importan  
✅ **Velocity** - No bloqueos por problemas de entorno  

**¡Tu equipo tendrá un proceso systematic y reproducible para cualquier módulo nuevo! 🎯**