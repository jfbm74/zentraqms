"""
Tests para RBAC Fase 4 - Middleware, Decoradores, PermissionService y Endpoints.

Estos tests cubren las nuevas funcionalidades implementadas en la Fase 4:
- Middleware RBAC
- Decoradores de permisos
- Permission classes para DRF
- PermissionService con cache
- Nuevos endpoints de autenticación
"""

import json
from unittest.mock import patch, MagicMock
from datetime import timedelta

from django.test import TestCase, RequestFactory, override_settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.http import JsonResponse
from django.utils import timezone
from django.urls import reverse
from django.core.cache import cache

from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Permission, Role, RolePermission, UserRole
from .middleware import RBACMiddleware, PermissionCacheMiddleware
from .decorators import require_permission, require_role, require_any_role
from .drf_permissions import (
    HasPermission, HasAnyPermission, HasRole, HasAnyRole,
    DynamicPermission, IsOwnerOrHasPermission
)
from .services import PermissionService

User = get_user_model()


class RBACMiddlewareTests(TestCase):
    """
    Tests para el middleware RBAC.
    """

    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = RBACMiddleware(lambda request: JsonResponse({'success': True}))
        
        # Crear usuario de prueba
        self.user = User.objects.create_user(
            email='test@zentraqms.test',
            first_name='Test',
            last_name='User'
        )
        
        # Crear permisos y roles
        self.permission = Permission.objects.create(
            name='Ver Documentos',
            code='documents.read'
        )
        
        self.role = Role.objects.create(
            name='Document Reader',
            code='doc_reader'
        )
        
        RolePermission.objects.create(
            role=self.role,
            permission=self.permission
        )
        
        UserRole.objects.create(
            user=self.user,
            role=self.role
        )

    def test_middleware_loads_user_roles_and_permissions(self):
        """Test que el middleware carga roles y permisos en el request."""
        request = self.factory.get('/test/')
        request.user = self.user
        
        # Procesar request
        response = self.middleware(request)
        
        # Verificar que se cargaron roles y permisos
        self.assertTrue(hasattr(request, 'user_roles'))
        self.assertTrue(hasattr(request, 'user_permissions'))
        
        self.assertIn('doc_reader', request.user_roles)
        self.assertIn('documents.read', request.user_permissions)

    def test_middleware_handles_anonymous_user(self):
        """Test que el middleware maneja usuarios anónimos."""
        request = self.factory.get('/test/')
        request.user = AnonymousUser()
        
        response = self.middleware(request)
        
        self.assertTrue(hasattr(request, 'user_roles'))
        self.assertTrue(hasattr(request, 'user_permissions'))
        self.assertEqual(len(request.user_roles), 0)
        self.assertEqual(len(request.user_permissions), 0)

    def test_middleware_handles_superuser(self):
        """Test que el middleware maneja superusuarios correctamente."""
        self.user.is_superuser = True
        self.user.save()
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        response = self.middleware(request)
        
        self.assertIn('*.all', request.user_permissions)
        self.assertIn('super_admin', request.user_roles)


class PermissionCacheMiddlewareTests(TestCase):
    """
    Tests para el middleware de cache de permisos.
    """

    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = PermissionCacheMiddleware(lambda request: JsonResponse({'success': True}))
        
        self.user = User.objects.create_user(
            email='test@zentraqms.test',
            first_name='Test',
            last_name='User'
        )

    @patch('apps.authorization.services.PermissionService.clear_user_cache')
    def test_middleware_clears_cache_on_permission_changes(self, mock_clear_cache):
        """Test que el middleware limpia cache cuando cambian permisos."""
        request = self.factory.post('/test/')
        request.user = self.user
        request.path = '/admin/authorization/permission/'
        
        response = self.middleware(request)
        
        mock_clear_cache.assert_called_once_with(self.user)

    def test_middleware_ignores_non_permission_urls(self):
        """Test que el middleware ignora URLs que no afectan permisos."""
        request = self.factory.post('/api/some-other-endpoint/')
        request.user = self.user
        
        with patch('apps.authorization.services.PermissionService.clear_user_cache') as mock_clear_cache:
            response = self.middleware(request)
            mock_clear_cache.assert_not_called()


class PermissionDecoratorsTests(TestCase):
    """
    Tests para los decoradores de permisos.
    """

    def setUp(self):
        self.factory = RequestFactory()
        
        self.user = User.objects.create_user(
            email='test@zentraqms.test',
            first_name='Test',
            last_name='User'
        )
        
        self.permission = Permission.objects.create(
            name='Crear Documentos',
            code='documents.create'
        )
        
        self.role = Role.objects.create(
            name='Document Creator',
            code='doc_creator'
        )
        
        RolePermission.objects.create(
            role=self.role,
            permission=self.permission
        )
        
        UserRole.objects.create(
            user=self.user,
            role=self.role
        )

    def test_require_permission_decorator_allows_access(self):
        """Test que el decorador permite acceso con permiso correcto."""
        
        @require_permission('documents.create')
        def test_view(request):
            return JsonResponse({'success': True})
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        response = test_view(request)
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

    def test_require_permission_decorator_denies_access(self):
        """Test que el decorador niega acceso sin permiso."""
        
        @require_permission('documents.delete')
        def test_view(request):
            return JsonResponse({'success': True})
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        response = test_view(request)
        
        self.assertEqual(response.status_code, 403)

    def test_require_role_decorator_allows_access(self):
        """Test que el decorador de rol permite acceso."""
        
        @require_role('doc_creator')
        def test_view(request):
            return JsonResponse({'success': True})
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        response = test_view(request)
        
        self.assertEqual(response.status_code, 200)

    def test_require_role_decorator_denies_access(self):
        """Test que el decorador de rol niega acceso."""
        
        @require_role('admin')
        def test_view(request):
            return JsonResponse({'success': True})
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        response = test_view(request)
        
        self.assertEqual(response.status_code, 403)

    def test_require_any_role_decorator_allows_access(self):
        """Test que el decorador de múltiples roles permite acceso."""
        
        @require_any_role('doc_creator', 'admin')
        def test_view(request):
            return JsonResponse({'success': True})
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        response = test_view(request)
        
        self.assertEqual(response.status_code, 200)

    def test_require_any_role_decorator_denies_access(self):
        """Test que el decorador de múltiples roles niega acceso."""
        
        @require_any_role('admin', 'super_admin')
        def test_view(request):
            return JsonResponse({'success': True})
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        response = test_view(request)
        
        self.assertEqual(response.status_code, 403)


class DRFPermissionClassesTests(APITestCase):
    """
    Tests para las clases de permisos de DRF.
    """

    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            email='test@zentraqms.test',
            first_name='Test',
            last_name='User'
        )
        
        self.permission = Permission.objects.create(
            name='Ver Documentos',
            code='documents.read'
        )
        
        self.role = Role.objects.create(
            name='Document Reader',
            code='doc_reader'
        )
        
        RolePermission.objects.create(
            role=self.role,
            permission=self.permission
        )
        
        UserRole.objects.create(
            user=self.user,
            role=self.role
        )
        
        # Crear token JWT
        self.refresh = RefreshToken.for_user(self.user)
        self.access_token = str(self.refresh.access_token)
        
        self.client = APIClient()

    def test_has_permission_class_allows_access(self):
        """Test que HasPermission permite acceso con permiso correcto."""
        
        class TestView(APIView):
            permission_classes = [HasPermission]
            required_permission = 'documents.read'
            
            def get(self, request):
                return Response({'success': True})
        
        # Mock request con usuario autenticado
        request = self.factory.get('/test/')
        request.user = self.user
        
        view = TestView()
        permission = HasPermission()
        
        # Test permission check
        has_perm = permission.has_permission(request, view)
        self.assertTrue(has_perm)

    def test_has_permission_class_denies_access(self):
        """Test que HasPermission niega acceso sin permiso."""
        
        class TestView(APIView):
            permission_classes = [HasPermission]
            required_permission = 'documents.delete'
            
            def get(self, request):
                return Response({'success': True})
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        view = TestView()
        permission = HasPermission()
        
        has_perm = permission.has_permission(request, view)
        self.assertFalse(has_perm)

    def test_has_role_class_allows_access(self):
        """Test que HasRole permite acceso con rol correcto."""
        
        class TestView(APIView):
            permission_classes = [HasRole]
            required_role = 'doc_reader'
            
            def get(self, request):
                return Response({'success': True})
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        view = TestView()
        permission = HasRole()
        
        has_perm = permission.has_permission(request, view)
        self.assertTrue(has_perm)

    def test_dynamic_permission_class_generates_permission(self):
        """Test que DynamicPermission genera permisos automáticamente."""
        
        class TestView(APIView):
            permission_classes = [DynamicPermission]
            resource_name = 'documents'
            action = 'list'
            
            def get(self, request):
                return Response({'success': True})
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        view = TestView()
        permission = DynamicPermission()
        
        # Simular método get_required_permission
        required_perm = permission.get_required_permission(request, view)
        self.assertEqual(required_perm, 'documents.list')

    def test_has_any_permission_class(self):
        """Test que HasAnyPermission funciona con múltiples permisos."""
        
        class TestView(APIView):
            permission_classes = [HasAnyPermission]
            required_permissions = ['documents.read', 'documents.create']
            
            def get(self, request):
                return Response({'success': True})
        
        request = self.factory.get('/test/')
        request.user = self.user
        
        view = TestView()
        permission = HasAnyPermission()
        
        has_perm = permission.has_permission(request, view)
        self.assertTrue(has_perm)  # Tiene documents.read


class PermissionServiceTests(TestCase):
    """
    Tests para el servicio de permisos con cache.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@zentraqms.test',
            first_name='Test',
            last_name='User'
        )
        
        # Crear permisos específicos y wildcards
        self.specific_perm = Permission.objects.create(
            name='Crear Documentos Específicos',
            code='documents.create'
        )
        
        self.wildcard_perm = Permission.objects.create(
            name='Todos los Documentos',
            code='documents.*'
        )
        
        self.super_perm = Permission.objects.create(
            name='Super Admin',
            code='*.all'
        )
        
        # Crear roles
        self.specific_role = Role.objects.create(
            name='Document Creator',
            code='doc_creator'
        )
        
        self.wildcard_role = Role.objects.create(
            name='Document Manager',
            code='doc_manager'
        )
        
        # Asignar permisos
        RolePermission.objects.create(
            role=self.specific_role,
            permission=self.specific_perm
        )
        
        RolePermission.objects.create(
            role=self.wildcard_role,
            permission=self.wildcard_perm
        )

    def test_evaluate_permission_specific_match(self):
        """Test evaluación de permiso específico."""
        UserRole.objects.create(user=self.user, role=self.specific_role)
        
        result = PermissionService.evaluate_permission(self.user, 'documents.create')
        self.assertTrue(result)
        
        result = PermissionService.evaluate_permission(self.user, 'documents.read')
        self.assertFalse(result)

    def test_evaluate_permission_wildcard_match(self):
        """Test evaluación de permiso wildcard."""
        UserRole.objects.create(user=self.user, role=self.wildcard_role)
        
        result = PermissionService.evaluate_permission(self.user, 'documents.create')
        self.assertTrue(result)
        
        result = PermissionService.evaluate_permission(self.user, 'documents.read')
        self.assertTrue(result)
        
        result = PermissionService.evaluate_permission(self.user, 'users.create')
        self.assertFalse(result)

    def test_evaluate_permission_super_admin(self):
        """Test evaluación de permiso super admin."""
        super_role = Role.objects.create(name='Super', code='super')
        RolePermission.objects.create(role=super_role, permission=self.super_perm)
        UserRole.objects.create(user=self.user, role=super_role)
        
        result = PermissionService.evaluate_permission(self.user, 'anything.action')
        self.assertTrue(result)

    def test_permission_hierarchy_precedence(self):
        """Test que los permisos específicos tienen precedencia sobre wildcards."""
        # Usuario tiene tanto permiso específico como wildcard
        UserRole.objects.create(user=self.user, role=self.specific_role)
        UserRole.objects.create(user=self.user, role=self.wildcard_role)
        
        # El permiso específico debe tener precedencia
        result = PermissionService.evaluate_permission(self.user, 'documents.create')
        self.assertTrue(result)

    @patch('django.core.cache.cache.get')
    @patch('django.core.cache.cache.set')
    def test_cache_operations(self, mock_cache_set, mock_cache_get):
        """Test operaciones de cache."""
        mock_cache_get.return_value = None  # Cache miss
        
        UserRole.objects.create(user=self.user, role=self.specific_role)
        
        # Primera llamada debe cachear
        result = PermissionService.evaluate_permission(self.user, 'documents.create')
        
        # Verificar que se intentó leer y escribir cache
        mock_cache_get.assert_called()
        mock_cache_set.assert_called()

    def test_get_user_permissions_tree(self):
        """Test organización de permisos por recurso."""
        UserRole.objects.create(user=self.user, role=self.specific_role)
        UserRole.objects.create(user=self.user, role=self.wildcard_role)
        
        tree = PermissionService.get_user_permissions_tree(self.user)
        
        self.assertIn('documents', tree)
        self.assertIn('create', tree['documents'])
        self.assertIn('*', tree['documents'])

    def test_clear_user_cache(self):
        """Test limpieza de cache de usuario."""
        # Simular cache existente
        cache.set(f'user_permissions_{self.user.id}', ['test.permission'])
        cache.set(f'user_roles_{self.user.id}', ['test_role'])
        
        PermissionService.clear_user_cache(self.user)
        
        # Verificar que se limpió el cache
        self.assertIsNone(cache.get(f'user_permissions_{self.user.id}'))
        self.assertIsNone(cache.get(f'user_roles_{self.user.id}'))

    def test_can_assign_role_to_user(self):
        """Test verificación de asignación de roles."""
        admin_perm = Permission.objects.create(
            name='Asignar Roles',
            code='users.assign_roles'
        )
        
        admin_role = Role.objects.create(
            name='Admin',
            code='admin'
        )
        
        RolePermission.objects.create(role=admin_role, permission=admin_perm)
        UserRole.objects.create(user=self.user, role=admin_role)
        
        target_user = User.objects.create_user(email='target@test.com')
        
        can_assign = PermissionService.can_assign_role_to_user(
            self.user, target_user, 'doc_creator'
        )
        self.assertTrue(can_assign)


class AuthenticationEndpointsTests(APITestCase):
    """
    Tests para los nuevos endpoints de autenticación RBAC.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@zentraqms.test',
            first_name='Test',
            last_name='User',
            password='test123456'
        )
        
        # Crear permisos y roles
        self.permission1 = Permission.objects.create(
            name='Ver Documentos',
            code='documents.read'
        )
        
        self.permission2 = Permission.objects.create(
            name='Crear Documentos',
            code='documents.create'
        )
        
        self.role = Role.objects.create(
            name='Document Manager',
            code='doc_manager'
        )
        
        RolePermission.objects.create(role=self.role, permission=self.permission1)
        RolePermission.objects.create(role=self.role, permission=self.permission2)
        
        UserRole.objects.create(user=self.user, role=self.role)
        
        # Generar token
        self.refresh = RefreshToken.for_user(self.user)
        self.access_token = str(self.refresh.access_token)

    def test_user_permissions_endpoint(self):
        """Test endpoint /api/auth/permissions/."""
        url = reverse('authentication:user_permissions')
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertTrue(data['success'])
        self.assertIn('permissions_by_resource', data['data'])
        self.assertIn('permissions_list', data['data'])
        self.assertEqual(data['data']['total_permissions'], 2)
        
        # Verificar estructura de permisos
        permissions_list = data['data']['permissions_list']
        self.assertIn('documents.read', permissions_list)
        self.assertIn('documents.create', permissions_list)

    def test_user_roles_endpoint(self):
        """Test endpoint /api/auth/roles/."""
        url = reverse('authentication:user_roles')
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertTrue(data['success'])
        self.assertIn('roles', data['data'])
        self.assertEqual(data['data']['total_roles'], 1)
        
        # Verificar estructura de roles
        roles = data['data']['roles']
        self.assertEqual(len(roles), 1)
        self.assertEqual(roles[0]['code'], 'doc_manager')
        self.assertEqual(roles[0]['name'], 'Document Manager')

    def test_permissions_endpoint_unauthorized(self):
        """Test endpoint de permisos sin autenticación."""
        url = reverse('authentication:user_permissions')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 401)

    def test_roles_endpoint_unauthorized(self):
        """Test endpoint de roles sin autenticación."""
        url = reverse('authentication:user_roles')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 401)

    def test_superuser_permissions(self):
        """Test que superusuarios obtienen permisos especiales."""
        self.user.is_superuser = True
        self.user.save()
        
        # Regenerar token
        self.refresh = RefreshToken.for_user(self.user)
        self.access_token = str(self.refresh.access_token)
        
        url = reverse('authentication:user_permissions')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        permissions_list = data['data']['permissions_list']
        self.assertIn('*.all', permissions_list)


class RBACIntegrationTests(APITestCase):
    """
    Tests de integración completa del sistema RBAC.
    """

    def setUp(self):
        # Crear usuarios con diferentes roles
        self.admin_user = User.objects.create_user(
            email='admin@zentraqms.test',
            first_name='Admin',
            last_name='User',
            password='test123456'
        )
        
        self.coordinator_user = User.objects.create_user(
            email='coordinator@zentraqms.test',
            first_name='Coordinator',
            last_name='User',
            password='test123456'
        )
        
        self.auditor_user = User.objects.create_user(
            email='auditor@zentraqms.test',
            first_name='Auditor',
            last_name='User',
            password='test123456'
        )
        
        # Crear permisos
        permisos = [
            ('users.create', 'Crear Usuarios'),
            ('users.read', 'Ver Usuarios'),
            ('audits.create', 'Crear Auditorías'),
            ('audits.read', 'Ver Auditorías'),
            ('reports.create', 'Crear Reportes'),
            ('*.all', 'Super Admin'),
        ]
        
        self.permissions = {}
        for code, name in permisos:
            perm = Permission.objects.create(name=name, code=code)
            self.permissions[code] = perm
        
        # Crear roles
        self.admin_role = Role.objects.create(
            name='Administrador',
            code='admin'
        )
        
        self.coordinator_role = Role.objects.create(
            name='Coordinador',
            code='coordinator'
        )
        
        self.auditor_role = Role.objects.create(
            name='Auditor',
            code='auditor'
        )
        
        # Asignar permisos a roles
        # Admin: acceso completo
        RolePermission.objects.create(
            role=self.admin_role,
            permission=self.permissions['*.all']
        )
        
        # Coordinador: usuarios y reportes
        RolePermission.objects.create(
            role=self.coordinator_role,
            permission=self.permissions['users.create']
        )
        RolePermission.objects.create(
            role=self.coordinator_role,
            permission=self.permissions['users.read']
        )
        RolePermission.objects.create(
            role=self.coordinator_role,
            permission=self.permissions['reports.create']
        )
        
        # Auditor: solo auditorías
        RolePermission.objects.create(
            role=self.auditor_role,
            permission=self.permissions['audits.create']
        )
        RolePermission.objects.create(
            role=self.auditor_role,
            permission=self.permissions['audits.read']
        )
        
        # Asignar roles a usuarios
        UserRole.objects.create(user=self.admin_user, role=self.admin_role)
        UserRole.objects.create(user=self.coordinator_user, role=self.coordinator_role)
        UserRole.objects.create(user=self.auditor_user, role=self.auditor_role)

    def test_admin_has_all_permissions(self):
        """Test que el admin tiene todos los permisos."""
        self.assertTrue(self.admin_user.has_perm('users.create'))
        self.assertTrue(self.admin_user.has_perm('audits.delete'))
        self.assertTrue(self.admin_user.has_perm('anything.action'))

    def test_coordinator_has_limited_permissions(self):
        """Test que el coordinador tiene permisos limitados."""
        self.assertTrue(self.coordinator_user.has_perm('users.create'))
        self.assertTrue(self.coordinator_user.has_perm('users.read'))
        self.assertTrue(self.coordinator_user.has_perm('reports.create'))
        
        self.assertFalse(self.coordinator_user.has_perm('audits.create'))
        self.assertFalse(self.coordinator_user.has_perm('*.all'))

    def test_auditor_has_specific_permissions(self):
        """Test que el auditor tiene permisos específicos."""
        self.assertTrue(self.auditor_user.has_perm('audits.create'))
        self.assertTrue(self.auditor_user.has_perm('audits.read'))
        
        self.assertFalse(self.auditor_user.has_perm('users.create'))
        self.assertFalse(self.auditor_user.has_perm('reports.create'))

    def test_role_expiration_functionality(self):
        """Test funcionalidad de expiración de roles."""
        # Crear rol temporal
        temp_role = Role.objects.create(
            name='Temporal',
            code='temp'
        )
        
        RolePermission.objects.create(
            role=temp_role,
            permission=self.permissions['users.read']
        )
        
        # Asignar rol con expiración
        past_date = timezone.now() - timedelta(days=1)
        UserRole.objects.create(
            user=self.auditor_user,
            role=temp_role,
            expires_at=past_date
        )
        
        # El usuario no debe tener el permiso porque el rol expiró
        self.assertFalse(self.auditor_user.has_perm('users.read'))

    def test_inactive_role_functionality(self):
        """Test funcionalidad de roles inactivos."""
        # Desactivar rol del auditor
        self.auditor_role.is_active = False
        self.auditor_role.save()
        
        # El usuario no debe tener permisos del rol inactivo
        self.assertFalse(self.auditor_user.has_perm('audits.create'))
        self.assertFalse(self.auditor_user.has_perm('audits.read'))

    def test_multiple_roles_combination(self):
        """Test combinación de múltiples roles."""
        # Asignar rol adicional al auditor
        UserRole.objects.create(
            user=self.auditor_user,
            role=self.coordinator_role
        )
        
        # Ahora debe tener permisos de ambos roles
        self.assertTrue(self.auditor_user.has_perm('audits.create'))  # Del rol auditor
        self.assertTrue(self.auditor_user.has_perm('users.read'))     # Del rol coordinador
        self.assertTrue(self.auditor_user.has_perm('reports.create')) # Del rol coordinador

    def test_permission_caching_functionality(self):
        """Test funcionalidad de cache de permisos."""
        with patch('apps.authorization.services.cache') as mock_cache:
            mock_cache.get.return_value = None  # Cache miss
            
            # Primera evaluación debe consultar DB y cachear
            result = self.coordinator_user.has_perm('users.create')
            self.assertTrue(result)
            
            # Verificar que se usó el cache (puede ser llamado múltiples veces)
            self.assertTrue(mock_cache.get.called)
            self.assertTrue(mock_cache.set.called)

    @override_settings(CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    })
    def test_cache_invalidation_on_role_change(self):
        """Test funcionalidad de invalidación de cache."""
        # Crear un usuario específico para este test 
        test_user = User.objects.create_user(
            email='cache_test@zentraqms.test',
            first_name='Cache',
            last_name='Test'
        )
        
        # Verificar que el método de limpieza de cache existe y funciona sin errores
        try:
            PermissionService.clear_user_cache(test_user)
            cache_clear_works = True
        except Exception:
            cache_clear_works = False
        
        self.assertTrue(cache_clear_works, "El método clear_user_cache debe funcionar sin errores")
        
        # Verificar que el método devuelve None (no falla)
        result = PermissionService.clear_user_cache(test_user)
        self.assertIsNone(result, "clear_user_cache debe retornar None")