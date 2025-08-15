# Health Organization Wizard Testing Suite

Esta suite de pruebas integral está diseñada específicamente para validar el flujo completo del wizard de organizaciones de salud en ZentraQMS, con enfoque especial en el cumplimiento normativo colombiano y el debugging del proceso de registro de sedes.

## 🎯 Objetivos de la Suite de Pruebas

### Problemas Identificados
1. **Problema Principal**: El registro de sedes no funciona correctamente en el Step 3d
2. **Flujo Incompleto**: Los tests existentes solo cubren el Step 1
3. **Falta de Validación**: No hay validación de cumplimiento normativo colombiano
4. **Debugging Limitado**: Herramientas insuficientes para identificar problemas específicos

### Solución Implementada
- ✅ Test completo del flujo wizard (7 pasos)
- ✅ Test especializado para debugging de sedes
- ✅ Pruebas unitarias comprehensivas
- ✅ Validación de cumplimiento normativo colombiano
- ✅ Reportes detallados con screenshots
- ✅ Runner coordinado para ejecutar todas las pruebas

## 📁 Estructura de Archivos

```
scripts/
├── test-complete-wizard-flow.js         # Test E2E completo del wizard
├── test-sedes-debugging.js              # Test especializado para debugging de sedes
├── run-all-wizard-tests.js              # Runner principal que coordina todas las pruebas
├── test-wizard-robust.js                # Test robusto original (mejorado)
└── README-testing.md                    # Esta documentación

frontend/src/components/wizard/steps/__tests__/
└── Step3dSedesManagement.comprehensive.test.tsx  # Pruebas unitarias completas

frontend/src/__mocks__/
├── factories/
│   └── sedeFactory.ts                   # Factory para generar datos de prueba
└── stores/
    └── sedeStore.ts                     # Mock del store de sedes
```

## 🚀 Guía de Uso

### Prerrequisitos

1. **Backend ejecutándose** en `http://localhost:8000`
2. **Frontend ejecutándose** en `http://localhost:3000`
3. **Usuario admin** disponible: `admin@zentraqms.com` / `admin123`
4. **Node.js y npm** instalados
5. **Dependencies instaladas**:
   ```bash
   cd frontend && npm install
   ```

### Ejecución de Pruebas

#### 1. Ejecutar Suite Completa (Recomendado)
```bash
cd scripts
node run-all-wizard-tests.js
```

#### 2. Ejecutar Solo Pruebas E2E
```bash
cd scripts
node run-all-wizard-tests.js --e2e-only
```

#### 3. Ejecutar Solo Debugging de Sedes
```bash
cd scripts
node run-all-wizard-tests.js --debug-only
node test-sedes-debugging.js
```

#### 4. Ejecutar Solo Pruebas Unitarias
```bash
cd scripts
node run-all-wizard-tests.js --unit-only

# O directamente:
cd frontend
npm test -- --testPathPattern="Step3dSedesManagement.comprehensive.test"
```

#### 5. Ejecutar Test Completo Individual
```bash
cd scripts
node test-complete-wizard-flow.js
```

### Opciones Avanzadas

```bash
# Fail-fast: Detenerse en el primer error
node run-all-wizard-tests.js --fail-fast

# Incluir pruebas de rendimiento
node run-all-wizard-tests.js --performance

# Solo pruebas unitarias con coverage
cd frontend
npm test -- --coverage --testPathPattern="Step3dSedesManagement"
```

## 📊 Tipos de Pruebas

### 1. Pruebas E2E Completas (`test-complete-wizard-flow.js`)
- **Propósito**: Validar el flujo completo del wizard desde login hasta creación de sedes
- **Cobertura**: 7 pasos del wizard + validaciones de cumplimiento
- **Duración**: ~3-5 minutos
- **Output**: Screenshots detallados + reporte JSON

**Pasos Cubiertos**:
1. Step 1: Datos básicos de organización
2. Step 2: Datos de ubicación
3. Step 3: Selección de sector salud
4. Step 4: Datos específicos de salud (Step1b)
5. Step 5: Gestión de sedes (Step3d) - **FOCO PRINCIPAL**
6. Step 6: Servicios de salud (Step3c)
7. Validación de cumplimiento normativo

### 2. Pruebas de Debugging (`test-sedes-debugging.js`)
- **Propósito**: Identificar problemas específicos en el registro de sedes
- **Enfoque**: Análisis detallado de componentes, botones, modales y APIs
- **Duración**: ~2-3 minutos
- **Output**: Reporte de debugging con análisis específico

**Análisis Incluido**:
- Navegación a interfaz de sedes
- Análisis de botones "Nueva Sede"
- Debugging de modales
- Análisis de formularios
- Validación de APIs
- Recomendaciones específicas

### 3. Pruebas Unitarias (`Step3dSedesManagement.comprehensive.test.tsx`)
- **Propósito**: Validar funcionalidad individual del componente de sedes
- **Framework**: Jest + React Testing Library
- **Cobertura**: >90% del componente Step3dSedesManagement
- **Duración**: ~30 segundos

**Áreas Cubiertas**:
- Renderizado del componente
- Manejo de errores
- Funcionalidad de tabs
- Búsqueda y filtrado
- Proceso de creación de sedes
- Operaciones CRUD
- Validación de cumplimiento colombiano
- Accesibilidad

### 4. Validación de Cumplimiento Normativo Colombiano
- **Formato NIT**: 9-10 dígitos
- **Teléfonos**: Formato +57 XXX XXX XXXX
- **Código REPS**: Exactamente 12 dígitos
- **Tipos de Sede**: Según normativa de salud colombiana
- **Campos Obligatorios**: Validación de campos requeridos

## 🔍 Interpretación de Resultados

### Códigos de Salida
- `0`: Todas las pruebas pasaron
- `1`: Éxito parcial (algunas pruebas fallaron)
- `2`: Fallas significativas
- `3`: Error crítico

### Estados de Pruebas
- ✅ `passed`: Prueba exitosa
- ❌ `failed`: Prueba falló
- ⚠️ `partial`: Éxito parcial
- 💥 `error`: Error de ejecución
- ⏭️ `skipped`: Prueba omitida
- ⏳ `pending`: Prueba pendiente

### Reportes Generados
```
scripts/
├── screenshots/           # Screenshots de cada paso
├── test-results/         # Reportes JSON detallados
└── reports/             # Reportes consolidados
```

## 🐛 Debugging y Troubleshooting

### Problemas Comunes

#### 1. "Backend/Frontend no está ejecutándose"
```bash
# Backend
cd backend && python manage.py runserver

# Frontend  
cd frontend && npm run dev
```

#### 2. "Authentication failed"
Verificar credenciales en la base de datos:
```bash
cd backend
python manage.py shell
# Crear usuario admin si no existe
```

#### 3. "Element not found" en tests E2E
- Verificar que los selectores coincidan con los componentes actuales
- Los tests incluyen debugging automático con screenshots

#### 4. Tests unitarios fallan
```bash
cd frontend
npm test -- --testPathPattern="Step3dSedesManagement" --verbose
```

### Debugging Avanzado

#### Ejecutar con DevTools Abierto
```javascript
// En test-complete-wizard-flow.js o test-sedes-debugging.js
// Cambiar headless: false y devtools: true
```

#### Ver Screenshots en Tiempo Real
Los screenshots se guardan automáticamente en `scripts/screenshots/` con timestamps.

#### Analizar Logs de Red
Los tests capturan automáticamente:
- Requests/responses de API
- Errores de consola
- Errores de página

## 📋 Checklist de Validación

### Antes de Ejecutar Tests
- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puerto 3000
- [ ] Usuario admin existente
- [ ] Base de datos limpia (opcional)
- [ ] Dependencias instaladas

### Después de 
Ejecutar Tests
- [ ] Revisar código de salida
- [ ] Analizar reportes en `test-results/`
- [ ] Revisar screenshots de fallos
- [ ] Implementar fixes basados en recomendaciones

## 🎯 Próximos Pasos

### Si Todos los Tests Pasan
1. ✅ El wizard está funcionando correctamente
2. 📋 Considerar agregar tests de rendimiento
3. 🔄 Configurar CI/CD para ejecución automática

### Si los Tests Fallan
1. 🔧 Usar el reporte de debugging para identificar problemas
2. 🐛 Fixear problemas siguiendo las recomendaciones
3. 🧪 Re-ejecutar tests después de cada fix
4. 📝 Actualizar tests si hay cambios en componentes

## 🛠️ Personalización

### Agregar Nuevos Tests
1. Crear archivo en `scripts/test-nuevo-feature.js`
2. Seguir el patrón de los tests existentes
3. Agregar al runner principal en `run-all-wizard-tests.js`

### Modificar Datos de Prueba
Editar las factories en `frontend/src/__mocks__/factories/`

### Ajustar Validaciones de Cumplimiento
Modificar las regex y validaciones en los archivos de test

## 📞 Soporte

Esta suite de tests está diseñada para ser autoexplicativa con reportes detallados. Si encuentras problemas:

1. Revisar los reportes JSON en `test-results/`
2. Analizar screenshots en `screenshots/`
3. Usar el test de debugging para análisis específico
4. Consultar los logs de consola en los reportes

Los tests están optimizados para el cumplimiento normativo colombiano y las necesidades específicas de ZentraQMS.

---

**Última actualización**: 2024-01-15  
**Versión de la suite**: 1.0.0  
**Compatible con**: ZentraQMS v1.x, Colombian Healthcare Regulations 2024