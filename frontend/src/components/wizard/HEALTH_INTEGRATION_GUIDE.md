# Health Wizard Integration Guide

Esta guía explica cómo integrar los componentes de salud con el wizard existente de organización.

## Componentes Creados

### 1. **Formularios Base**
- `HealthOrganizationForm.tsx` - Formulario principal para información de salud
- `HealthServicesSelector.tsx` - Selector de servicios de salud

### 2. **Steps del Wizard**
- `Step3bHealthOrganization.tsx` - Step para información básica de salud (después de Step 3)
- `Step3cHealthServices.tsx` - Step para selección de servicios (después de Step 3b)

### 3. **Hooks**
- `useRepsValidation.ts` - Validación de códigos REPS
- `useHealthServices.ts` - Gestión de servicios de salud
- `useHealthWizardIntegration.ts` - Lógica completa de integración

### 4. **Utilities**
- `healthSectorDetection.ts` - Detección automática del sector salud
- `HealthWizardIntegration.tsx` - Componente wrapper para manejo condicional

## Integración con el Wizard Existente

### Paso 1: Modificar el OrganizationWizard.tsx

```tsx
import { useHealthWizardIntegration } from '../../../hooks/useHealthWizardIntegration';
import HealthWizardIntegration from '../HealthWizardIntegration';

// En el componente OrganizationWizard:
const {
  isHealthSector,
  healthData,
  healthErrors,
  updateHealthData,
  selectedServices,
  updateSelectedServices,
  shouldShowHealthSteps,
  validateHealthData,
  validateServices
} = useHealthWizardIntegration(formData);

// Modificar la lógica de steps:
const totalSteps = isHealthSector ? 7 : 5; // Steps adicionales para salud

// En el render, después del Step 3:
{isHealthSector && (currentStep === 4 || currentStep === 5) && (
  <HealthWizardIntegration
    currentStep={currentStep}
    selectedSector={formData.sector_template}
    organizationName={formData.name}
    healthData={healthData}
    healthErrors={healthErrors}
    onHealthDataChange={updateHealthData}
    selectedServices={selectedServices}
    onServicesChange={updateSelectedServices}
    onNext={() => setActiveTab(currentStep + 1)}
    onPrevious={() => setActiveTab(currentStep - 1)}
  />
)}
```

### Paso 2: Actualizar la Navegación del Wizard

```tsx
// Modificar la función toggleTab para manejar steps de salud:
function toggleTab(tab: number, value: number) {
  // Si es sector salud y estamos en step 3, ir a 3b (health info)
  if (isHealthSector && tab === 4) {
    // Validar que Step 3 esté completo
    if (formData.sector_template === 'salud') {
      setActiveTab(4); // Step 3b - Health Organization
    }
  }
  // Lógica existente...
}
```

### Paso 3: Incluir Validación en el Submit

```tsx
// En la función de submit final:
const handleFinalSubmit = async () => {
  let allData = { ...formData };
  
  if (isHealthSector) {
    // Validar datos de salud
    const healthValidationErrors = validateHealthData();
    const servicesValidationErrors = validateServices();
    
    if (Object.keys(healthValidationErrors).length > 0 || servicesValidationErrors.length > 0) {
      toast.error('Complete la información de salud antes de continuar');
      return;
    }
    
    // Agregar datos de salud al payload
    allData.healthProfile = healthData;
    allData.healthServices = selectedServices;
  }
  
  // Enviar datos al backend...
};
```

### Paso 4: Actualizar el Progress Indicator

```tsx
// Modificar el indicador de progreso para incluir steps de salud:
const getProgressSteps = () => {
  const baseSteps = [
    { key: 1, title: 'Información Básica' },
    { key: 2, title: 'Ubicación' },
    { key: 3, title: 'Sector' },
    { key: 4, title: 'Sedes' },
    { key: 5, title: 'Finalizar' }
  ];
  
  if (isHealthSector) {
    return [
      ...baseSteps.slice(0, 3),
      { key: 4, title: 'Info. Salud' },
      { key: 5, title: 'Servicios' },
      ...baseSteps.slice(3)
    ];
  }
  
  return baseSteps;
};
```

## Flujo de Datos

### 1. **Detección del Sector Salud**
- Automática: basada en nombre/tipo de organización
- Manual: cuando el usuario selecciona "salud" en Step 3

### 2. **Steps Condicionales**
- **Step 3**: Selección de sector (existente)
- **Step 3b**: Información de salud (condicional)
- **Step 3c**: Servicios de salud (condicional)
- **Steps siguientes**: Continúan normalmente

### 3. **Validaciones**
- REPS en tiempo real
- Coherencia servicios vs complejidad
- Campos obligatorios específicos de salud

### 4. **Persistencia**
- Auto-guardado en localStorage
- Integración con el sistema de draft existente

## API Integration

### Endpoints Requeridos

Los componentes están diseñados para usar los endpoints ya implementados:

```
POST /organization/health/validate-reps/
GET  /organization/health/services-catalog/
POST /organization/health/validate-services/
GET  /organization/health/complexity-levels/
```

### Payload Final

```json
{
  // Datos existentes del wizard...
  "sector_template": "salud",
  
  // Nuevos datos de salud:
  "healthProfile": {
    "codigo_prestador": "110012345678",
    "naturaleza_juridica": "privada",
    "tipo_prestador": "IPS",
    "nivel_complejidad": "II",
    // ... resto de campos
  },
  
  "healthServices": [
    {
      "codigo_servicio": "329",
      "nombre_servicio": "Ortopedia y Traumatología",
      "grupo_servicio": "consulta_externa",
      "modalidad": "intramural"
    }
    // ... más servicios
  ]
}
```

## Consideraciones de UX

### 1. **Progresividad**
- Los steps de salud solo aparecen cuando son relevantes
- Opción de "saltar por ahora" para configuración posterior

### 2. **Validación en Tiempo Real**
- REPS se valida automáticamente
- Servicios se verifican contra nivel de complejidad

### 3. **Ayuda Contextual**
- Enlaces a normatividad colombiana
- Tooltips explicativos
- Ejemplos de códigos REPS

### 4. **Feedback Visual**
- Indicadores de progreso específicos
- Validación visual (verde/rojo)
- Resúmenes de configuración

## Testing

Para probar la integración:

1. **Crear organización con sector salud**
2. **Verificar aparición de steps adicionales**
3. **Validar integración con backend**
4. **Probar navegación condicional**
5. **Verificar persistencia de datos**

## Próximos Pasos

1. Integrar con wizard principal
2. Probar flujo completo
3. Ajustar validaciones según feedback
4. Documentar para otros sectores específicos