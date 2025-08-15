# 🔧 Backend Development Guide - ZentraQMS

## 📋 Índice
1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Configuración](#configuración)
4. [Modelos y ORM](#modelos-y-orm)
5. [APIs y Serializers](#apis-y-serializers)
6. [Autenticación y Autorización](#autenticación-y-autorización)
7. [Testing](#testing)
8. [Comandos Útiles](#comandos-útiles)

## 🛠️ Stack Tecnológico

- **Framework**: Django 5.0
- **API**: Django REST Framework 3.15
- **Database**: PostgreSQL 15 (prod) / SQLite (dev)
- **Auth**: JWT (SimpleJWT)
- **Testing**: pytest + Django TestCase
- **Logging**: Python logging + Audit trails

## 📁 Estructura del Proyecto

```
backend/
├── apps/                      # Aplicaciones Django
│   ├── authentication/        # JWT Auth
│   ├── authorization/         # RBAC System
│   ├── common/               # Shared models/utils
│   ├── organization/         # Organizations module
│   └── [module]/            # Other modules
├── config/                   # Django configuration
│   ├── settings/            # Environment settings
│   │   ├── base.py         # Base settings
│   │   ├── development.py  # Dev settings
│   │   ├── testing.py      # Test settings
│   │   └── production.py   # Prod settings
│   ├── urls.py             # URL configuration
│   └── wsgi.py             # WSGI config
├── requirements/            # Dependencies
│   ├── base.txt
│   ├── development.txt
│   ├── testing.txt
│   └── production.txt
├── scripts/                 # Utility scripts
├── media/                   # User uploads
├── static/                  # Static files
└── manage.py               # Django management
```

## ⚙️ Configuración

### Settings por Entorno

```python
# config/settings/development.py
from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Logging detallado
LOGGING['loggers']['django']['level'] = 'DEBUG'
```

### Variables de Entorno (.env)
```bash
# .env.example
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgres://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379/0
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password
```

## 💾 Modelos y ORM

### Base Model Obligatorio

```python
from apps.common.models import FullBaseModel

class YourModel(FullBaseModel):
    """
    SIEMPRE heredar de FullBaseModel para audit trails.
    Incluye: created_at, updated_at, created_by, updated_by, 
             deleted_at, deleted_by, is_active
    """
    # Campos del modelo
    name = models.CharField(max_length=200)
    
    class Meta:
        db_table = 'your_model'  # Nombre explícito de tabla
        verbose_name = 'Tu Modelo'
        verbose_name_plural = 'Tus Modelos'
        indexes = [
            models.Index(fields=['name']),  # Índices para búsquedas
        ]
```

### Managers Personalizados

```python
class ActiveManager(models.Manager):
    """Manager para objetos activos"""
    def get_queryset(self):
        return super().get_queryset().filter(
            is_active=True,
            deleted_at__isnull=True
        )

class YourModel(FullBaseModel):
    # Managers
    objects = models.Manager()  # Default
    active = ActiveManager()    # Solo activos
    
    # Uso:
    # YourModel.active.all()  # Solo registros activos
```

### Signals para Auditoría

```python
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
import logging

audit_logger = logging.getLogger('audit')

@receiver(post_save, sender=YourModel)
def log_model_save(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    audit_logger.info(
        f"Model {sender.__name__} {action}: {instance.id} by {instance.updated_by}"
    )

@receiver(pre_delete, sender=YourModel)
def prevent_hard_delete(sender, instance, **kwargs):
    """Prevenir eliminación física, usar soft delete"""
    raise PermissionDenied("Use soft delete instead")
```

## 🔌 APIs y Serializers

### ViewSet Estándar

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.authorization.drf_permissions import ModularPermission

class YourModelViewSet(viewsets.ModelViewSet):
    """
    ViewSet con RBAC y acciones personalizadas
    """
    serializer_class = YourModelSerializer
    permission_classes = [ModularPermission]
    filterset_fields = ['name', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    # Permisos modulares
    permission_module = 'your_module'
    permission_resource = 'your_model'
    
    def get_queryset(self):
        """Filtrar por organización del usuario"""
        return YourModel.active.filter(
            organization=self.request.user.organization
        )
    
    def perform_create(self, serializer):
        """Agregar usuario y organización al crear"""
        serializer.save(
            created_by=self.request.user,
            organization=self.request.user.organization
        )
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Acción personalizada para aprobar"""
        instance = self.get_object()
        instance.status = 'approved'
        instance.approved_by = request.user
        instance.approved_at = timezone.now()
        instance.save()
        
        return Response(
            {'message': 'Aprobado exitosamente'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def audit_trail(self, request, pk=None):
        """Obtener historial de cambios"""
        instance = self.get_object()
        audit_logs = AuditLog.objects.filter(
            model_name=self.queryset.model.__name__,
            object_id=instance.id
        ).order_by('-created_at')
        
        serializer = AuditLogSerializer(audit_logs, many=True)
        return Response(serializer.data)
```

### Serializers con Validación

```python
from rest_framework import serializers

class YourModelSerializer(serializers.ModelSerializer):
    # Campos relacionados
    created_by_name = serializers.CharField(
        source='created_by.get_full_name', 
        read_only=True
    )
    organization_name = serializers.CharField(
        source='organization.name',
        read_only=True
    )
    
    class Meta:
        model = YourModel
        fields = '__all__'
        read_only_fields = [
            'created_at', 'updated_at', 
            'created_by', 'updated_by',
            'deleted_at', 'deleted_by'
        ]
    
    def validate_name(self, value):
        """Validación personalizada de nombre"""
        if len(value) < 3:
            raise serializers.ValidationError(
                "El nombre debe tener al menos 3 caracteres"
            )
        
        # Verificar unicidad en la organización
        org = self.context['request'].user.organization
        if YourModel.active.filter(name=value, organization=org).exists():
            raise serializers.ValidationError(
                "Ya existe un registro con este nombre"
            )
        
        return value
    
    def validate(self, data):
        """Validación a nivel de objeto"""
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError(
                    "La fecha de inicio debe ser anterior a la fecha de fin"
                )
        return data
```

## 🔐 Autenticación y Autorización

### Decoradores de Permisos

```python
from apps.authorization.decorators import permission_required

@permission_required('module.action.resource')
def your_view(request):
    """Vista que requiere permiso específico"""
    pass

# En ViewSets
class YourViewSet(viewsets.ModelViewSet):
    permission_classes = [ModularPermission]
    permission_module = 'your_module'
    permission_resource = 'your_resource'
```

### Middleware Personalizado

```python
# apps/common/middleware.py
class OrganizationMiddleware:
    """Agregar organización al request"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        if request.user.is_authenticated:
            request.organization = request.user.organization
        else:
            request.organization = None
        
        response = self.get_response(request)
        return response
```

## 🧪 Testing

### Test Models

```python
from django.test import TestCase
from apps.authentication.models import User

class YourModelTestCase(TestCase):
    def setUp(self):
        """Preparar datos de prueba"""
        self.user = User.objects.create_user(
            username='test',
            email='test@test.com',
            password='Test123!'
        )
        self.org = Organization.objects.create(
            name='Test Org',
            nit='900123456',
            owner=self.user
        )
    
    def test_crear_modelo_datos_validos(self):
        """Debe crear modelo con datos válidos"""
        obj = YourModel.objects.create(
            name='Test',
            organization=self.org,
            created_by=self.user
        )
        self.assertEqual(obj.name, 'Test')
        self.assertTrue(obj.is_active)
    
    def test_soft_delete(self):
        """Debe hacer soft delete"""
        obj = YourModel.objects.create(
            name='Test',
            organization=self.org,
            created_by=self.user
        )
        obj.delete()
        
        self.assertIsNotNone(obj.deleted_at)
        self.assertFalse(obj.is_active)
        
        # Verificar que aún existe en DB
        self.assertTrue(
            YourModel.objects.filter(id=obj.id).exists()
        )
```

### Test APIs

```python
from rest_framework.test import APITestCase
from rest_framework import status

class YourModelAPITestCase(APITestCase):
    def setUp(self):
        """Setup con autenticación"""
        self.user = User.objects.create_user(
            username='test',
            password='Test123!'
        )
        
        # Obtener token JWT
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'test',
            'password': 'Test123!'
        })
        self.token = response.data['access']
        
        # Configurar cliente con token
        self.client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {self.token}'
        )
    
    def test_listar_modelos(self):
        """Debe listar modelos de la organización"""
        response = self.client.get('/api/v1/your-models/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_crear_sin_permiso(self):
        """No debe permitir crear sin permiso"""
        # Remover permisos del usuario
        self.user.role.permissions.clear()
        
        response = self.client.post('/api/v1/your-models/', {
            'name': 'Test'
        })
        self.assertEqual(
            response.status_code, 
            status.HTTP_403_FORBIDDEN
        )
```

## 📝 Comandos Útiles

### Comandos de Gestión

```bash
# Migraciones
python manage.py makemigrations --settings=config.settings.development
python manage.py migrate --settings=config.settings.development

# Crear superusuario
python manage.py createsuperuser --settings=config.settings.development

# Cargar datos iniciales
python manage.py loaddata fixtures/initial_data.json

# Comandos personalizados
python manage.py populate_rbac  # Crear roles y permisos
python manage.py create_test_users  # Usuarios de prueba
python manage.py setup_organization_permissions  # Permisos de org
```

### Django Shell

```python
# Acceder al shell
python manage.py shell --settings=config.settings.development

# Ejemplos útiles
from apps.organization.models import Organization
from apps.authentication.models import User

# Obtener todas las organizaciones activas
orgs = Organization.active.all()

# Buscar usuario por email
user = User.objects.get(email='user@example.com')

# Ver permisos de un usuario
user.get_all_permissions()

# Crear organización de prueba
org = Organization.objects.create(
    name='Hospital Test',
    nit='900123456',
    owner=user
)
```

## 🔍 Debugging

### Logging

```python
import logging

logger = logging.getLogger(__name__)

class YourView(View):
    def post(self, request):
        logger.debug(f"Request data: {request.data}")
        
        try:
            # Tu código
            result = process_data(request.data)
            logger.info(f"Process successful: {result.id}")
            
        except ValidationError as e:
            logger.warning(f"Validation error: {e}")
            raise
            
        except Exception as e:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            raise
```

### Django Debug Toolbar

```python
# settings/development.py
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    INTERNAL_IPS = ['127.0.0.1']
```

## 🚀 Optimización

### Query Optimization

```python
# Malo - N+1 queries
organizations = Organization.objects.all()
for org in organizations:
    print(org.owner.username)  # Query adicional por cada org

# Bueno - 1 query
organizations = Organization.objects.select_related('owner').all()
for org in organizations:
    print(org.owner.username)  # Sin queries adicionales

# Para relaciones many-to-many
organizations = Organization.objects.prefetch_related('locations').all()
```

### Caching

```python
from django.core.cache import cache

def get_organization_stats(org_id):
    cache_key = f'org_stats_{org_id}'
    stats = cache.get(cache_key)
    
    if stats is None:
        # Cálculo costoso
        stats = calculate_stats(org_id)
        cache.set(cache_key, stats, 3600)  # Cache por 1 hora
    
    return stats
```

---

💡 **Nota**: Siempre seguir las convenciones establecidas y mantener el código limpio y documentado.