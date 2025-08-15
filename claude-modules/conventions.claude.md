# 📐 Convenciones y Estándares - ZentraQMS

## 🎯 Propósito

Este documento define los estándares de código obligatorios para mantener consistencia, calidad y mantenibilidad en todo el proyecto ZentraQMS. **TODOS los desarrolladores deben seguir estas convenciones sin excepción**.

## 🗂️ Estructura del Proyecto

```
zentraqms/
├── backend/                     # Django Backend
│   ├── apps/                   # Aplicaciones Django
│   │   ├── authentication/     # Módulo de autenticación JWT
│   │   ├── authorization/      # Sistema RBAC
│   │   ├── organization/       # Gestión de organizaciones
│   │   ├── common/             # Modelos y utilidades compartidas
│   │   └── [módulo]/          # Otros módulos del sistema
│   ├── config/                 # Configuración Django
│   │   └── settings/          # Settings por entorno
│   ├── media/                  # Archivos subidos
│   ├── static/                 # Archivos estáticos
│   └── requirements/           # Dependencias por entorno
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── api/               # Cliente API
│   │   ├── assets/            # Imágenes y recursos
│   │   ├── components/        # Componentes reutilizables
│   │   ├── contexts/          # React Context providers
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Páginas/vistas
│   │   ├── services/          # Servicios de negocio
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utilidades
│   └── public/                # Recursos públicos
├── claude-modules/             # Documentación modular para Claude
├── docs/                       # Documentación general
└── deploy/                     # Scripts de despliegue
```

## 💻 Convenciones de Código

### Backend (Django/Python)

#### Nomenclatura
- **Modelos**: PascalCase singular (`Organization`, `User`, `AuditLog`)
- **Vistas**: PascalCase con sufijo View/ViewSet (`OrganizationViewSet`, `LoginView`)
- **Serializers**: PascalCase con sufijo Serializer (`OrganizationSerializer`)
- **URLs**: snake_case con guiones (`/api/v1/organizations/exists-check/`)
- **Funciones**: snake_case (`get_user_permissions`, `validate_nit`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_LOGIN_ATTEMPTS`, `TOKEN_LIFETIME`)

#### Modelos Django
```python
from apps.common.models import FullBaseModel

class Organization(FullBaseModel):
    """
    SIEMPRE heredar de FullBaseModel para audit trails.
    Incluir docstrings descriptivos.
    """
    # Constantes primero
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
    ]
    
    # Campos obligatorios
    name = models.CharField(max_length=200)
    
    # Campos opcionales
    description = models.TextField(blank=True)
    
    # Relaciones
    owner = models.ForeignKey(User, on_delete=models.PROTECT)
    
    # Meta y métodos
    class Meta:
        db_table = 'organization'
        verbose_name = 'Organización'
        verbose_name_plural = 'Organizaciones'
    
    def __str__(self):
        return self.name
```

#### ViewSets y Permisos
```python
from rest_framework import viewsets
from apps.authorization.drf_permissions import ModularPermission

class OrganizationViewSet(viewsets.ModelViewSet):
    """
    SIEMPRE incluir permisos RBAC.
    """
    permission_classes = [ModularPermission]
    serializer_class = OrganizationSerializer
    queryset = Organization.objects.all()
    
    def get_queryset(self):
        # Filtrar por permisos del usuario
        return super().get_queryset().filter(
            organization=self.request.user.organization
        )
```

### Frontend (React/TypeScript)

#### Nomenclatura
- **Componentes**: PascalCase (`OrganizationList`, `LoginForm`)
- **Hooks**: camelCase con prefijo use (`useAuth`, `usePermissions`)
- **Archivos**: PascalCase para componentes, camelCase para utils
- **Interfaces**: PascalCase con prefijo I (`IOrganization`, `IUser`)
- **Types**: PascalCase (`UserRole`, `PermissionType`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_FILE_SIZE`)

#### Componentes React
```typescript
import React from 'react';
import { Card, Button } from 'react-bootstrap';

interface IOrganizationCardProps {
  organization: IOrganization;
  onEdit?: (id: string) => void;
}

const OrganizationCard: React.FC<IOrganizationCardProps> = ({ 
  organization, 
  onEdit 
}) => {
  // Hooks primero
  const { hasPermission } = usePermissions();
  
  // Estado local
  const [isLoading, setIsLoading] = useState(false);
  
  // Efectos
  useEffect(() => {
    // Lógica del efecto
  }, []);
  
  // Handlers
  const handleEdit = () => {
    if (onEdit) onEdit(organization.id);
  };
  
  // Render
  return (
    <Card>
      <Card.Body>
        <h5>{organization.name}</h5>
        {hasPermission('organization.edit') && (
          <Button onClick={handleEdit}>Editar</Button>
        )}
      </Card.Body>
    </Card>
  );
};

export default OrganizationCard;
```

#### Custom Hooks
```typescript
export const useOrganization = (id: string) => {
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        const data = await organizationService.getById(id);
        setOrganization(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganization();
  }, [id]);
  
  return { organization, loading, error };
};
```

## 🏗️ Patrones de Diseño

### 1. Repository Pattern (Backend)
```python
class OrganizationRepository:
    """Encapsula lógica de acceso a datos."""
    
    @staticmethod
    def get_by_nit(nit: str) -> Organization:
        return Organization.objects.get(nit=nit)
    
    @staticmethod
    def get_active() -> QuerySet:
        return Organization.objects.filter(is_active=True)
```

### 2. Service Layer (Backend)
```python
class OrganizationService:
    """Lógica de negocio."""
    
    @staticmethod
    def create_with_template(data: dict, template_id: str) -> Organization:
        # Lógica compleja de creación
        pass
```

### 3. Context Pattern (Frontend)
```typescript
const OrganizationContext = React.createContext<IOrganizationContext | null>(null);

export const OrganizationProvider: React.FC = ({ children }) => {
  const [organization, setOrganization] = useState<IOrganization | null>(null);
  
  return (
    <OrganizationContext.Provider value={{ organization, setOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
};
```

### 4. HOC para Permisos (Frontend)
```typescript
export const withPermission = (permission: string) => {
  return <P extends object>(Component: React.ComponentType<P>) => {
    return (props: P) => {
      const { hasPermission } = usePermissions();
      
      if (!hasPermission(permission)) {
        return <AccessDenied />;
      }
      
      return <Component {...props} />;
    };
  };
};
```

## 🧪 Testing

### Backend Testing
```python
from django.test import TestCase
from rest_framework.test import APITestCase

class OrganizationModelTest(TestCase):
    """Test nombres descriptivos y en español."""
    
    def setUp(self):
        """Preparar datos de prueba."""
        self.org = Organization.objects.create(
            name="Test Org",
            nit="123456789"
        )
    
    def test_crear_organizacion_con_datos_validos(self):
        """Verificar creación exitosa."""
        self.assertEqual(self.org.name, "Test Org")
    
    def test_validacion_nit_duplicado(self):
        """NIT debe ser único."""
        with self.assertRaises(ValidationError):
            Organization.objects.create(
                name="Otra Org",
                nit="123456789"  # Duplicado
            )
```

### Frontend Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

describe('OrganizationForm', () => {
  it('debe mostrar errores de validación', async () => {
    render(<OrganizationForm />);
    
    const submitButton = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/El nombre es requerido/i)).toBeInTheDocument();
  });
  
  it('debe llamar onSubmit con datos válidos', async () => {
    const handleSubmit = vi.fn();
    render(<OrganizationForm onSubmit={handleSubmit} />);
    
    // Llenar formulario
    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Test Org' }
    });
    
    // Enviar
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'Test Org'
      });
    });
  });
});
```

## ⚠️ Manejo de Errores

### Backend
```python
from rest_framework import status
from rest_framework.response import Response

class OrganizationViewSet(viewsets.ModelViewSet):
    def create(self, request):
        try:
            # Lógica de creación
            return Response(data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating organization: {e}")
            return Response(
                {'error': 'Error interno del servidor'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

### Frontend
```typescript
try {
  const response = await api.post('/organizations/', data);
  toast.success('Organización creada exitosamente');
  return response.data;
} catch (error) {
  if (error.response?.status === 400) {
    toast.error(error.response.data.error || 'Datos inválidos');
  } else if (error.response?.status === 403) {
    toast.error('No tiene permisos para realizar esta acción');
  } else {
    toast.error('Error al crear la organización');
  }
  throw error;
}
```

## 🔐 Seguridad

### Principios
1. **Nunca confiar en el cliente**: Validar todo en el backend
2. **Principio de menor privilegio**: Otorgar solo permisos necesarios
3. **Sanitización de datos**: Limpiar todas las entradas
4. **Auditoría completa**: Registrar todas las operaciones críticas

### Implementación
```python
# Backend - Validación
def validate_nit(nit: str) -> str:
    """Validar y sanitizar NIT."""
    nit = nit.strip().replace('-', '')
    if not nit.isdigit() or len(nit) != 9:
        raise ValidationError("NIT inválido")
    return nit

# Frontend - Sanitización
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input.trim());
};
```

## 📦 Git Workflow

### Branches
- `main`: Producción
- `develop`: Desarrollo activo
- `feature/*`: Nuevas características
- `bugfix/*`: Corrección de bugs
- `hotfix/*`: Fixes urgentes en producción

### Commits
```bash
# Formato
<tipo>: <descripción corta>

# Tipos
feat: Nueva característica
fix: Corrección de bug
docs: Documentación
style: Formato (no afecta lógica)
refactor: Refactorización
test: Añadir tests
chore: Tareas de mantenimiento

# Ejemplos
feat: Agregar wizard de configuración inicial
fix: Corregir validación de NIT en organizaciones
docs: Actualizar README con instrucciones de instalación
```

## 📚 Importaciones

### Orden de Importaciones (Python)
```python
# 1. Standard library
import os
import sys
from datetime import datetime

# 2. Third party
from django.db import models
from rest_framework import viewsets

# 3. Local apps
from apps.common.models import FullBaseModel
from apps.organization.serializers import OrganizationSerializer
```

### Orden de Importaciones (TypeScript)
```typescript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. Third party
import { Card, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

// 3. Local - tipos
import { IOrganization } from '@/types';

// 4. Local - hooks
import { useAuth, usePermissions } from '@/hooks';

// 5. Local - componentes
import { LoadingSpinner } from '@/components/common';

// 6. Local - estilos
import './Organization.css';
```

## ⚡ Performance

### Backend
- Usar `select_related()` y `prefetch_related()` para optimizar queries
- Implementar paginación en listas grandes
- Cachear datos frecuentemente consultados
- Usar índices en campos de búsqueda

### Frontend
- Lazy loading de componentes pesados
- Memoización con `React.memo` y `useMemo`
- Virtualización para listas largas
- Optimización de imágenes (WebP, lazy loading)

## 📝 Documentación

### Docstrings (Python)
```python
def create_organization(data: dict) -> Organization:
    """
    Crear una nueva organización con validaciones.
    
    Args:
        data: Diccionario con datos de la organización.
              Debe incluir: name, nit, tipo_organizacion
    
    Returns:
        Organization: Instancia creada
    
    Raises:
        ValidationError: Si los datos son inválidos
        PermissionDenied: Si el usuario no tiene permisos
    """
    pass
```

### JSDoc (TypeScript)
```typescript
/**
 * Hook para gestionar el estado de una organización
 * @param {string} id - ID de la organización
 * @returns {Object} Estado de la organización y funciones de gestión
 * @example
 * const { organization, loading, error } = useOrganization('123');
 */
export const useOrganization = (id: string) => {
  // Implementación
};
```

---

## 🚨 Compliance

### Checklist Pre-Commit
- [ ] ¿El código sigue las convenciones de nomenclatura?
- [ ] ¿Los modelos heredan de FullBaseModel?
- [ ] ¿Los endpoints tienen permisos RBAC?
- [ ] ¿Se incluyen tests unitarios?
- [ ] ¿La documentación está actualizada?
- [ ] ¿Se usaron componentes de Velzon cuando era posible?

### Excepciones
Cualquier excepción a estas convenciones debe:
1. Ser documentada en el código con un comentario explicativo
2. Ser aprobada en el code review
3. Incluir justificación técnica válida

---

**⚠️ IMPORTANTE**: Estas convenciones son OBLIGATORIAS. El incumplimiento resultará en rechazo del PR.