# 🎯 Template de Clasificación de Tests - Módulo: [NOMBRE_MÓDULO]

## 📋 **CHECKLIST DE CLASIFICACIÓN**

### ✅ **TESTS CRÍTICOS** (Deben pasar para deployment)

#### **🎯 Funcionalidad Core del Negocio**
- [ ] `src/hooks/__tests__/use[ModuleName].test.tsx` - Hook principal del módulo
- [ ] `src/services/__tests__/[module-name].service.test.ts` - Service core del módulo
- [ ] `src/__tests__/e2e/[module-name]-flow.test.tsx` - Flujo end-to-end principal
- [ ] `backend/apps/[module]/test_models.py` - Modelos Django
- [ ] `backend/apps/[module]/test_apis.py` - APIs DRF

#### **🔐 Seguridad y Validaciones**
- [ ] Tests de **validación de datos** críticos
- [ ] Tests de **permisos y autorización**
- [ ] Tests de **autenticación** específicos del módulo
- [ ] Tests de **integridad de datos**

#### **🔄 Integración con Otros Módulos**
- [ ] Tests de **dependencias** con módulos existentes
- [ ] Tests de **shared state** o contexto global
- [ ] Tests de **navegación** entre módulos

### ⚠️ **TESTS NO CRÍTICOS** (Informativos)

#### **🔶 Limitaciones de JSdom**
- [ ] Tests de **file upload** (FormData, File API)
- [ ] Tests de **routing complejo** (react-router edge cases)
- [ ] Tests de **DOM APIs específicas** no implementadas
- [ ] Tests de **browser-specific APIs**

#### **🔶 UI/UX y Presentación**
- [ ] Tests de **responsive design**
- [ ] Tests de **animaciones/transiciones**
- [ ] Tests de **theming/estilos**
- [ ] Tests de **tooltips/modals** simples

#### **🔶 Mocking Complejo**
- [ ] Tests de **WebSocket** connections
- [ ] Tests de **external APIs** específicas
- [ ] Tests de **notificaciones** push/toast complejas
- [ ] Tests de **timer/setTimeout** complejos

---

## 🎯 **APLICACIÓN PRÁCTICA**

### **Paso 1: Identificar Tests del Módulo**
```bash
# Ejecutar el script de clasificación automática
node scripts/classify-tests.js

# Revisar el reporte generado
cat /tmp/zentraqms-test-config/classification-report.md
```

### **Paso 2: Clasificación Manual**
Para cada test identificado como "incierto", pregúntate:

#### ✅ **¿Es CRÍTICO?**
- [ ] **¿Si falla, el usuario no puede completar la funcionalidad principal?**
- [ ] **¿Es parte del flujo "happy path" del módulo?**
- [ ] **¿Afecta la seguridad o integridad de datos?**
- [ ] **¿Otros módulos dependen de esta funcionalidad?**

#### ⚠️ **¿Es NO CRÍTICO?**
- [ ] **¿Funciona perfectamente en el browser real?**
- [ ] **¿Es un problema del entorno de testing (JSdom)?**
- [ ] **¿Es un edge case muy específico?**
- [ ] **¿Es principalmente cosmético/UX?**

### **Paso 3: Documentar Decisiones**
```markdown
## 📝 Decisiones de Clasificación - [MÓDULO]

### ✅ Tests Críticos Confirmados:
- `path/to/test.tsx` - **Razón**: [Explicación]
- `path/to/test.tsx` - **Razón**: [Explicación]

### ⚠️ Tests No Críticos Confirmados:
- `path/to/test.tsx` - **Razón**: [Explicación] 
- `path/to/test.tsx` - **Razón**: [Explicación]

### 🤔 Tests Bajo Revisión:
- `path/to/test.tsx` - **Estado**: Pendiente de decisión
```

### **Paso 4: Actualizar Configuración**

#### **A. Package.json**
```json
{
  "scripts": {
    "test:critical": "vitest run [tests críticos actuales] [nuevos tests críticos del módulo]",
    "test:critical:[modulo]": "vitest run [solo tests críticos del módulo nuevo]",
    "test:non-critical": "vitest run [tests no críticos actuales] [nuevos no críticos] || true"
  }
}
```

#### **B. GitHub Workflow**
```yaml
# Agregar a .github/workflows/smart-testing.yml
matrix:
  test-suite:
    # ... tests existentes ...
    
    # 🆕 Nuevo módulo
    - name: "Frontend use[ModuleName]"
      command: "npx vitest run src/hooks/__tests__/use[ModuleName].test.tsx"
      working-directory: "./frontend"
      
    - name: "Frontend E2E [ModuleName]"
      command: "npx vitest run src/__tests__/e2e/[module-name]-flow.test.tsx"
      working-directory: "./frontend"
```

---

## 📊 **MÉTRICAS DEL MÓDULO**

### **Objetivo por Módulo:**
- **Tests críticos**: 100% pasando ✅
- **Coverage crítico**: >90% ✅
- **Tests no críticos**: Información únicamente ⚠️

### **Tracking:**
```bash
# Verificar estado del módulo
npm run test:critical:[modulo]

# Coverage específico del módulo
npm run test:coverage -- src/[module-path]/
```

---

## 🎯 **EJEMPLO COMPLETO: Módulo de Auditorías**

### ✅ **Tests Críticos**:
```typescript
// Core functionality
'src/hooks/__tests__/useAudit.test.tsx'              // ✅ Hook principal
'src/services/__tests__/audit.service.test.ts'      // ✅ Service core
'src/__tests__/e2e/audit-creation-flow.test.tsx'    // ✅ Flujo principal

// Forms y validación
'src/components/audit/__tests__/AuditForm.test.tsx' // ✅ Formulario principal  
'src/utils/__tests__/audit-validation.test.ts'     // ✅ Validaciones críticas

// Backend
'backend/apps/audit/test_models.py'                 // ✅ Modelos
'backend/apps/audit/test_apis.py'                   // ✅ APIs
'backend/apps/audit/test_permissions.py'            // ✅ Permisos
```

### ⚠️ **Tests No Críticos**:
```typescript
// JSdom limitations
'src/components/audit/__tests__/AuditFileUpload.test.tsx'    // File API issues
'src/components/audit/__tests__/AuditCalendar.test.tsx'      // Date picker complex

// Mocking complejo
'src/services/__tests__/audit-notifications.test.ts'        // WebSocket/push
'src/hooks/__tests__/useAuditTimer.test.tsx'               // Timer complex

// UI/UX
'src/components/audit/__tests__/AuditStatusBadge.test.tsx'  // Visual component
'src/components/audit/__tests__/AuditTooltips.test.tsx'    // Tooltips
```

### **Scripts Resultantes**:
```json
{
  "test:critical:audit": "vitest run src/hooks/__tests__/useAudit.test.tsx src/__tests__/e2e/audit-creation-flow.test.tsx src/components/audit/__tests__/AuditForm.test.tsx",
  
  "test:non-critical:audit": "vitest run src/components/audit/__tests__/AuditFileUpload.test.tsx src/services/__tests__/audit-notifications.test.ts || true"
}
```

---

## 🚀 **PROCESO PARA NUEVOS DESARROLLADORES**

### **1. Al crear tests nuevos:**
```bash
# Ejecutar clasificación automática
node scripts/classify-tests.js

# Revisar reporte
cat /tmp/zentraqms-test-config/classification-report.md
```

### **2. Para tests "inciertos":**
- Usar el checklist de arriba
- Probar en browser real vs test environment
- Documentar la decisión con razón clara

### **3. Antes de PR:**
```bash
# Verificar que críticos pasan
npm run test:critical

# Estado general
npm run test:all-with-smart-exit
```

### **4. En el PR:**
- Documentar nuevos tests críticos añadidos
- Explicar tests clasificados como no críticos
- Actualizar documentación si es necesario

---

## 💡 **TIPS PARA CLASIFICACIÓN RÁPIDA**

### **🎯 SIEMPRE CRÍTICO**:
- Hooks que manejan estado del módulo
- APIs de CRUD principales
- Validaciones de seguridad/datos
- Flujos end-to-end del happy path
- Tests de integración con auth/RBAC

### **⚠️ PROBABLEMENTE NO CRÍTICO**:
- File upload/download
- Drag and drop
- Responsive design
- Animaciones/transiciones
- Tooltips/modals informativos
- External API integrations complejas

### **🤔 REVISAR CASO POR CASO**:
- Form validation (depende de criticidad)
- Navigation (depende de complejidad)
- Error handling (depende del error)
- Component interaction (depende del impacto)

---

## ✅ **RESULTADO ESPERADO**

Cada módulo nuevo tendrá:
- **Classification clara** crítico vs no crítico
- **Scripts específicos** para testing del módulo
- **Workflow actualizado** para CI/CD
- **Documentación** de decisiones tomadas
- **Métricas** de calidad del módulo

**¡El sistema escalará sistemáticamente con cada módulo nuevo! 🎯**