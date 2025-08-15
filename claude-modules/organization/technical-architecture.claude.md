# 🏥 Arquitectura Técnica: Extensión Wizard IPS para ZentraQMS

## 📋 Resumen Ejecutivo

Diseño de extensión del wizard existente de organizaciones para incluir funcionalidades específicas del sector salud (IPS - Instituciones Prestadoras de Servicios de Salud), basado en la plantilla Velzon 4.4.1 y siguiendo los patrones establecidos en el sistema.

## 🎯 Objetivos de la Arquitectura

1. **Detección automática** del sector salud y activación de campos específicos
2. **Extensión condicional** del wizard sin afectar otros sectores
3. **Validaciones específicas** contra REPS y normativa colombiana
4. **Configuración guiada** en máximo 45 minutos
5. **Reutilización máxima** de componentes Velzon existentes

## 🏗️ Arquitectura de Componentes

### 1. Diagrama de Flujo del Wizard Extendido

```
┌─────────────────────────────────────────────────────────────┐
│                    OrganizationWizard.tsx                   │
│                         (Principal)                         │
└─────────────────┬──────────────────────────┬───────────────┘
                  │                          │
                  ▼                          ▼
     ┌────────────────────────┐   ┌──────────────────────────┐
     │   Step1OrganizationData │   │   Step3SectorTemplate    │
     │      (Modificado)       │   │    (Sector Detector)     │
     └────────────┬────────────┘   └────────────┬────────────┘
                  │                              │
                  ▼                              ▼
     ┌────────────────────────┐     ┌───────────────────────┐
     │   Step1HealthFields     │     │ Step4HealthServices   │
     │  (Nuevo - Condicional)  │     │  (Nuevo - Opcional)   │
     └─────────────────────────┘     └───────────────────────┘
```

### 2. Estructura de Componentes React

```typescript
// 📁 frontend/src/components/wizard/steps/health/
├── Step1HealthFields.tsx        // Campos específicos IPS
├── Step4HealthServices.tsx      // Servicios habilitados
├── ProviderCodeInput.tsx        // Input con validación REPS
├── HealthServiceSelector.tsx    // Selector de servicios
├── LegalRepresentative.tsx      // Representante legal
└── ComplexityLevelSelector.tsx  // Nivel de complejidad
```

## 💾 Modelos de Datos

### 1. Interfaces TypeScript Extendidas

```typescript
// frontend/src/types/organization.types.ts

export interface OrganizationData {
  // Campos existentes...
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  nit?: string;
  digito_verificacion?: string;
  
  // Campos específicos de salud (condicionales)
  health_fields?: HealthOrganizationFields;
  health_services?: HealthService[];
}

export interface HealthOrganizationFields {
  // Identificación REPS
  codigo_prestador: string;           // 12 dígitos
  verificado_reps: boolean;
  fecha_verificacion_reps?: Date;
  
  // Naturaleza jurídica
  naturaleza_juridica: 'privada' | 'publica' | 'mixta';
  
  // Representante legal
  representante_legal: {
    tipo_documento: 'CC' | 'CE' | 'PA' | 'NIT';
    numero_documento: string;
    nombre_completo: string;
    telefono: string;
    email: string;
  };
  
  // Clasificación
  nivel_complejidad: 'I' | 'II' | 'III' | 'IV';
  tipo_prestador: 'IPS' | 'HOSPITAL' | 'CLINICA' | 'CENTRO_MEDICO';
  
  // Habilitación
  registro_especial?: string;
  fecha_habilitacion?: Date;
  resolucion_habilitacion?: string;
}

export interface HealthService {
  id: string;
  codigo_servicio: string;      // Según Res. 3100/2019
  nombre_servicio: string;
  grupo_servicio: string;
  fecha_habilitacion: Date;
  fecha_vencimiento?: Date;
  estado: 'activo' | 'suspendido' | 'cancelado';
  modalidad: 'intramural' | 'extramural' | 'telemedicina';
  sede_prestacion: string;
  capacidad_instalada?: number;
  observaciones?: string;
}
```

### 2. Esquema de Validación

```typescript
// frontend/src/validators/health.validators.ts

import * as yup from 'yup';

export const healthFieldsSchema = yup.object({
  codigo_prestador: yup
    .string()
    .required('Código del prestador es requerido')
    .matches(/^\d{12}$/, 'Debe ser exactamente 12 dígitos')
    .test('reps-valid', 'Código no válido en REPS', async (value) => {
      return await validateREPS(value);
    }),
    
  naturaleza_juridica: yup
    .string()
    .required('Naturaleza jurídica es requerida')
    .oneOf(['privada', 'publica', 'mixta']),
    
  representante_legal: yup.object({
    tipo_documento: yup.string().required(),
    numero_documento: yup.string().required()
      .when('tipo_documento', {
        is: 'CC',
        then: yup.string().matches(/^\d{6,10}$/),
        otherwise: yup.string().min(5)
      }),
    nombre_completo: yup.string().required().min(5),
    telefono: yup.string().required(),
    email: yup.string().email().required()
  }),
  
  nivel_complejidad: yup
    .string()
    .required('Nivel de complejidad es requerido')
    .oneOf(['I', 'II', 'III', 'IV'])
});
```

## 🔧 Componente Principal: Step1HealthFields

```typescript
// frontend/src/components/wizard/steps/health/Step1HealthFields.tsx

import React, { useState, useEffect } from 'react';
import { Row, Col, FormGroup, Label, Alert } from 'reactstrap';
import ProviderCodeInput from './ProviderCodeInput';
import LegalRepresentative from './LegalRepresentative';
import ComplexityLevelSelector from './ComplexityLevelSelector';

interface Step1HealthFieldsProps {
  data: Partial<HealthOrganizationFields>;
  errors: Record<string, string>;
  onChange: (fields: Partial<HealthOrganizationFields>) => void;
  isActive: boolean;
}

const Step1HealthFields: React.FC<Step1HealthFieldsProps> = ({
  data, errors, onChange, isActive
}) => {
  const [validatingREPS, setValidatingREPS] = useState(false);
  
  if (!isActive) return null;
  
  return (
    <div className="health-fields-section mt-4">
      {/* Alert informativo */}
      <Alert color="info" className="d-flex align-items-center">
        <i className="ri-hospital-line me-2 fs-16"></i>
        <div>
          <strong>Configuración IPS:</strong> Complete los campos 
          adicionales requeridos para instituciones de salud.
        </div>
      </Alert>
      
      <Row>
        {/* Código Prestador con validación REPS */}
        <Col lg={6}>
          <ProviderCodeInput
            value={data.codigo_prestador || ''}
            error={errors.codigo_prestador}
            onChange={(value, isValid) => {
              onChange({ 
                codigo_prestador: value,
                verificado_reps: isValid 
              });
            }}
            onValidating={setValidatingREPS}
          />
        </Col>
        
        {/* Naturaleza Jurídica */}
        <Col lg={6}>
          <FormGroup>
            <Label htmlFor="naturaleza-juridica">
              Naturaleza Jurídica <span className="text-danger">*</span>
            </Label>
            <select
              id="naturaleza-juridica"
              className={`form-select ${errors.naturaleza_juridica ? 'is-invalid' : ''}`}
              value={data.naturaleza_juridica || ''}
              onChange={(e) => onChange({ naturaleza_juridica: e.target.value })}
            >
              <option value="">Seleccione...</option>
              <option value="privada">Privada</option>
              <option value="publica">Pública</option>
              <option value="mixta">Mixta</option>
            </select>
            {errors.naturaleza_juridica && (
              <div className="invalid-feedback">{errors.naturaleza_juridica}</div>
            )}
          </FormGroup>
        </Col>
      </Row>
      
      {/* Nivel de Complejidad */}
      <Row>
        <Col lg={12}>
          <ComplexityLevelSelector
            value={data.nivel_complejidad}
            onChange={(nivel) => onChange({ nivel_complejidad: nivel })}
            error={errors.nivel_complejidad}
          />
        </Col>
      </Row>
      
      {/* Representante Legal */}
      <Row>
        <Col lg={12}>
          <h6 className="mb-3 mt-4">
            <i className="ri-user-settings-line me-2"></i>
            Representante Legal
          </h6>
          <LegalRepresentative
            data={data.representante_legal}
            errors={errors}
            onChange={(rep) => onChange({ representante_legal: rep })}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Step1HealthFields;
```

## 🔌 API Integration

### 1. Health API Service

```typescript
// frontend/src/api/health.ts

import { apiClient } from './endpoints';

export const healthAPI = {
  // Validación código prestador REPS
  validateProviderCode: async (code: string) => {
    try {
      const response = await apiClient.post('/api/v1/health/validate-reps/', {
        codigo_prestador: code
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtener catálogo de servicios
  getServicesCatalog: async () => {
    const response = await apiClient.get('/api/v1/health/services-catalog/');
    return response.data;
  },
  
  // Validar coherencia de servicios
  validateServices: async (services: HealthService[], complexity: string) => {
    const response = await apiClient.post('/api/v1/health/validate-services/', {
      services,
      nivel_complejidad: complexity
    });
    return response.data;
  }
};
```

## 🗄️ Backend Extensions

### 1. Django Models Extension

```python
# backend/apps/organization/models.py

class HealthOrganization(FullBaseModel):
    """Extension for health sector organizations (IPS)."""
    
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='health_profile'
    )
    
    # REPS Information
    codigo_prestador = models.CharField(
        max_length=12,
        unique=True,
        validators=[RegexValidator(r'^\d{12}$')]
    )
    verificado_reps = models.BooleanField(default=False)
    fecha_verificacion_reps = models.DateTimeField(null=True, blank=True)
    
    # Legal Nature
    naturaleza_juridica = models.CharField(
        max_length=10,
        choices=[
            ('privada', 'Privada'),
            ('publica', 'Pública'),
            ('mixta', 'Mixta')
        ]
    )
    
    # Complexity Level
    nivel_complejidad = models.CharField(
        max_length=3,
        choices=[
            ('I', 'Nivel I - Baja Complejidad'),
            ('II', 'Nivel II - Mediana Complejidad'),
            ('III', 'Nivel III - Alta Complejidad'),
            ('IV', 'Nivel IV - Máxima Complejidad')
        ]
    )
    
    # Legal Representative
    representante_tipo_documento = models.CharField(max_length=10)
    representante_numero_documento = models.CharField(max_length=20)
    representante_nombre = models.CharField(max_length=200)
    representante_telefono = models.CharField(max_length=15)
    representante_email = models.EmailField()
    
    class Meta:
        verbose_name = "Organización de Salud"
        verbose_name_plural = "Organizaciones de Salud"
        indexes = [
            models.Index(fields=['codigo_prestador']),
            models.Index(fields=['nivel_complejidad'])
        ]


class HealthService(FullBaseModel):
    """Health services enabled for the organization."""
    
    health_organization = models.ForeignKey(
        HealthOrganization,
        on_delete=models.CASCADE,
        related_name='services'
    )
    
    codigo_servicio = models.CharField(max_length=10)
    nombre_servicio = models.CharField(max_length=200)
    grupo_servicio = models.CharField(max_length=100)
    
    fecha_habilitacion = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    
    estado = models.CharField(
        max_length=20,
        choices=[
            ('activo', 'Activo'),
            ('suspendido', 'Suspendido'),
            ('cancelado', 'Cancelado')
        ],
        default='activo'
    )
    
    modalidad = models.CharField(
        max_length=20,
        choices=[
            ('intramural', 'Intramural'),
            ('extramural', 'Extramural'),
            ('telemedicina', 'Telemedicina')
        ]
    )
    
    sede_prestacion = models.ForeignKey(
        'Location',
        on_delete=models.CASCADE,
        related_name='health_services'
    )
    
    capacidad_instalada = models.PositiveIntegerField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Servicio de Salud"
        verbose_name_plural = "Servicios de Salud"
        unique_together = [['health_organization', 'codigo_servicio', 'sede_prestacion']]
```

### 2. API Endpoints

```python
# backend/apps/organization/api/health_views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_reps(request):
    """Validate provider code against REPS."""
    codigo = request.data.get('codigo_prestador')
    
    # Integración con servicio REPS del MinSalud
    # Por ahora, validación mock
    if codigo and len(codigo) == 12:
        # Simular búsqueda en REPS
        is_valid = codigo.startswith('11') or codigo.startswith('25')
        
        if is_valid:
            provider_data = {
                'nombre': 'IPS DEMO',
                'departamento': 'Bogotá D.C.',
                'municipio': 'Bogotá',
                'direccion': 'Calle 123 #45-67'
            }
        else:
            provider_data = None
            
        return Response({
            'isValid': is_valid,
            'providerData': provider_data,
            'message': 'Código válido en REPS' if is_valid else 'Código no encontrado'
        })
    
    return Response(
        {'error': 'Código inválido'},
        status=status.HTTP_400_BAD_REQUEST
    )
```

## 🔄 Modificaciones al Wizard Principal

### OrganizationWizard.tsx Modificado

```typescript
// Modificaciones clave en OrganizationWizard.tsx

// 1. Importar nuevos componentes de salud
import Step1HealthFields from '../../../components/wizard/steps/health/Step1HealthFields';
import Step4HealthServices from '../../../components/wizard/steps/health/Step4HealthServices';

// 2. Extender la interface OrganizationData
interface OrganizationData {
  // ... campos existentes ...
  health_fields?: HealthOrganizationFields;
  health_services?: HealthService[];
  is_health_sector?: boolean;
}

// 3. Detectar sector salud y ajustar navegación
const isHealthSector = formData.sector_template === 'salud';

// 4. Modificar el Step 1 para incluir campos de salud condicionalmente
{activeTab === 1 && (
  <div className="tab-pane active">
    <Step1OrganizationData
      data={formData}
      errors={errors}
      onChange={updateFormData}
    />
    
    {/* Campos adicionales para sector salud */}
    {isHealthSector && (
      <Step1HealthFields
        data={formData.health_fields || {}}
        errors={errors}
        onChange={(healthFields) => 
          updateFormData({ health_fields: healthFields })
        }
        isActive={isHealthSector}
      />
    )}
    
    <div className="d-flex align-items-start gap-3 mt-4">
      <button
        type="button"
        className="btn btn-success btn-label right ms-auto"
        onClick={handleNext}
      >
        <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
        Siguiente: Ubicación
      </button>
    </div>
  </div>
)}
```

## 🎨 UI/UX Patterns (Velzon)

### Componentes Velzon Utilizados:
- **Form Wizard**: Arrow Nav Steps (página 4 steps)
- **Inputs**: Form validation patterns con feedback visual
- **Selects**: Custom select con search (Select2 pattern)
- **Alerts**: Info alerts para guía contextual
- **Cards**: Border dashed cards para secciones
- **Tables**: Bordered tables para listado de servicios
- **Badges**: Status badges para estados
- **Spinners**: Loading states durante validaciones

## 🚀 Plan de Implementación

### Fase 1: Preparación (1-2 días)
1. ✅ Análisis de requisitos completado
2. ✅ Arquitectura técnica diseñada
3. ⭕ Crear ramas de desarrollo
4. ⭕ Configurar estructura de componentes

### Fase 2: Backend Extensions (2-3 días)
1. ⭕ Crear modelos Django (HealthOrganization, HealthService)
2. ⭕ Implementar API endpoints de validación
3. ⭕ Crear catálogo de servicios mock
4. ⭕ Configurar migraciones de BD

### Fase 3: Frontend Components (3-4 días)
1. ⭕ Implementar Step1HealthFields
2. ⭕ Crear ProviderCodeInput con validación
3. ⭕ Desarrollar Step4HealthServices
4. ⭕ Integrar con wizard principal

### Fase 4: Testing & Validation (2-3 días)
1. ⭕ Tests unitarios componentes
2. ⭕ Tests integración API
3. ⭕ Validación con datos reales IPS
4. ⭕ Testing E2E flujo completo

### Fase 5: Documentation & Deployment (1-2 días)
1. ⭕ Documentación técnica
2. ⭕ Guía de usuario
3. ⭕ Deploy en ambiente de pruebas
4. ⭕ Validación con cliente piloto

## ✅ Checklist de Implementación

### Backend:
- [ ] Crear modelos HealthOrganization y HealthService
- [ ] Implementar API de validación REPS
- [ ] Configurar catálogo de servicios
- [ ] Crear migraciones de base de datos
- [ ] Implementar serializers DRF
- [ ] Tests unitarios backend

### Frontend:
- [ ] Crear Step1HealthFields component
- [ ] Implementar ProviderCodeInput con validación
- [ ] Desarrollar Step4HealthServices
- [ ] Integrar con OrganizationWizard principal
- [ ] Configurar validaciones Yup
- [ ] Tests unitarios componentes React

### Integration:
- [ ] Conectar validación REPS en tiempo real
- [ ] Implementar auto-save de borradores
- [ ] Configurar navegación condicional
- [ ] Validar flujo completo E2E
- [ ] Optimizar performance
- [ ] Tests de integración

### Documentation:
- [ ] Documentar API endpoints
- [ ] Crear guía de usuario
- [ ] Documentar patrones de desarrollo
- [ ] Manual de troubleshooting
- [ ] Video demostración

## 🔒 Consideraciones de Seguridad

1. **Validación REPS**: Rate limiting para evitar abuso
2. **Datos sensibles**: Encriptar información del representante legal
3. **Auditoría**: Registrar cambios en campos de salud
4. **RBAC**: Permisos específicos para gestión de servicios
5. **Compliance**: Protección de datos en salud (Ley 1581)

## 📊 Métricas de Éxito

1. **Tiempo de configuración**: < 45 minutos
2. **Tasa de error**: < 5% en validaciones REPS
3. **Adopción**: 100% instituciones de salud usan wizard extendido
4. **Satisfacción**: > 4.5/5 en usabilidad
5. **Performance**: < 2s carga de catálogo servicios

---

**Conclusión**: Esta arquitectura proporciona una extensión robusta y escalable del wizard existente, específicamente diseñada para el sector salud colombiano, manteniendo la compatibilidad con otros sectores y siguiendo los estándares de calidad del sistema ZentraQMS.