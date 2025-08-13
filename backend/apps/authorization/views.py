"""
ViewSets para la API RBAC.
"""
from django.contrib.auth import get_user_model
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Permission, Role, UserRole
from .serializers import (
    PermissionSerializer, PermissionListSerializer,
    RoleSerializer, RoleListSerializer,
    UserRoleSerializer, UserPermissionsSerializer
)
from .mixins import PermissionRequiredMixin
from .permissions import PermissionChecker

User = get_user_model()


class PermissionViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de permisos.
    """
    queryset = Permission.objects.all().order_by('resource', 'action')
    permission_classes = [IsAuthenticated]
    permission_required = 'roles'  # Base resource
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['resource', 'action', 'is_active']
    search_fields = ['name', 'code', 'description', 'resource', 'action']
    ordering_fields = ['name', 'code', 'resource', 'action', 'created_at']
    
    def get_serializer_class(self):
        """Usar serializer simplificado para lista."""
        if self.action == 'list':
            return PermissionListSerializer
        return PermissionSerializer
    
    @action(detail=False, methods=['get'])
    def resources(self, request):
        """Obtener lista de recursos únicos."""
        resources = Permission.objects.filter(is_active=True)\
            .values_list('resource', flat=True)\
            .distinct()\
            .order_by('resource')
        return Response(list(resources))
    
    @action(detail=False, methods=['get'])
    def actions(self, request):
        """Obtener lista de acciones únicas."""
        resource = request.query_params.get('resource')
        queryset = Permission.objects.filter(is_active=True)
        
        if resource:
            queryset = queryset.filter(resource=resource)
        
        actions = queryset.values_list('action', flat=True)\
            .distinct()\
            .order_by('action')
        return Response(list(actions))


class RoleViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de roles.
    """
    queryset = Role.objects.all().order_by('name')
    permission_classes = [IsAuthenticated]
    permission_required = 'roles'  # Base resource
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_system', 'is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'created_at']
    
    def get_serializer_class(self):
        """Usar serializer simplificado para lista."""
        if self.action == 'list':
            return RoleListSerializer
        return RoleSerializer
    
    def destroy(self, request, *args, **kwargs):
        """Prevenir eliminación de roles del sistema."""
        role = self.get_object()
        if role.is_system:
            return Response(
                {'error': 'No se pueden eliminar roles del sistema'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def permissions(self, request, pk=None):
        """Obtener permisos del rol."""
        role = self.get_object()
        permissions = role.get_all_permissions()
        return Response({'permissions': list(permissions)})
    
    @action(detail=True, methods=['get'])
    def users(self, request, pk=None):
        """Obtener usuarios con este rol."""
        role = self.get_object()
        user_roles = UserRole.objects.filter(
            role=role,
            is_active=True,
            user__is_active=True
        ).select_related('user')
        
        users = []
        for ur in user_roles:
            users.append({
                'id': ur.user.id,
                'email': ur.user.email,
                'full_name': ur.user.get_full_name(),
                'assigned_at': ur.assigned_at,
                'expires_at': ur.expires_at,
                'is_expired': ur.is_expired
            })
        
        return Response({'users': users})
    
    @action(detail=False, methods=['get'])
    def system_roles(self, request):
        """Obtener solo roles del sistema."""
        roles = Role.objects.filter(is_system=True, is_active=True)
        serializer = RoleListSerializer(roles, many=True)
        return Response(serializer.data)


class UserRoleViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    """
    ViewSet para gestión de asignaciones de roles a usuarios.
    """
    queryset = UserRole.objects.all().select_related('user', 'role', 'assigned_by')
    permission_classes = [IsAuthenticated]
    permission_required = 'roles'  # Base resource
    serializer_class = UserRoleSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['user', 'role', 'is_active']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'role__name']
    ordering_fields = ['assigned_at', 'expires_at']
    ordering = ['-assigned_at']
    
    @action(detail=False, methods=['post'])
    def assign_role(self, request):
        """Asignar rol a usuario."""
        user_id = request.data.get('user_id')
        role_code = request.data.get('role_code')
        expires_at = request.data.get('expires_at')
        
        if not user_id or not role_code:
            return Response(
                {'error': 'user_id y role_code son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id, is_active=True)
            user_role = user.add_role(
                role_code=role_code,
                assigned_by=request.user,
                expires_at=expires_at
            )
            
            serializer = UserRoleSerializer(user_role)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def remove_role(self, request):
        """Remover rol de usuario."""
        user_id = request.data.get('user_id')
        role_code = request.data.get('role_code')
        
        if not user_id or not role_code:
            return Response(
                {'error': 'user_id y role_code son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
            user.remove_role(role_code)
            return Response({'message': 'Rol removido exitosamente'})
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='by-user/(?P<user_id>[^/.]+)')
    def by_user(self, request, user_id=None):
        """Obtener roles de un usuario específico."""
        try:
            user = User.objects.get(id=user_id)
            user_roles = self.queryset.filter(user=user)
            serializer = self.get_serializer(user_roles, many=True)
            return Response(serializer.data)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )


class UserPermissionsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar permisos efectivos de usuarios.
    """
    queryset = User.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    serializer_class = UserPermissionsSerializer
    
    def get_permissions(self):
        """Solo usuarios con permisos de ver usuarios pueden acceder."""
        self.permission_classes = [IsAuthenticated]
        permissions = super().get_permissions()
        
        # Verificar permiso específico
        def has_permission(request, view):
            return PermissionChecker.user_has_permission(request.user, 'users.read')
        
        permissions[0].has_permission = has_permission
        return permissions
    
    def retrieve(self, request, pk=None):
        """Obtener permisos de un usuario específico."""
        try:
            user = User.objects.get(id=pk, is_active=True)
            
            # Obtener roles activos
            roles = []
            for user_role in user.roles.all():
                roles.append({
                    'id': user_role.role.id,
                    'name': user_role.role.name,
                    'code': user_role.role.code,
                    'assigned_at': user_role.assigned_at,
                    'expires_at': user_role.expires_at
                })
            
            # Obtener permisos
            permissions = list(user.get_all_permissions())
            
            # Separar permisos por tipo
            effective_permissions = []
            if user.is_superuser:
                effective_permissions = ['*.all (Superusuario)']
            else:
                effective_permissions = permissions
            
            data = {
                'user_id': user.id,
                'user_email': user.email,
                'roles': roles,
                'permissions': permissions,
                'effective_permissions': effective_permissions
            }
            
            return Response(data)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def my_permissions(self, request):
        """Obtener permisos del usuario actual."""
        return self.retrieve(request, pk=request.user.id)
    
    @action(detail=False, methods=['post'])
    def check_permission(self, request):
        """Verificar si el usuario actual tiene un permiso específico."""
        permission_code = request.data.get('permission_code')
        if not permission_code:
            return Response(
                {'error': 'permission_code es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        has_permission = PermissionChecker.user_has_permission(
            request.user, permission_code
        )
        
        return Response({
            'user_id': request.user.id,
            'permission_code': permission_code,
            'has_permission': has_permission
        })
    
    @action(detail=False, methods=['post'])
    def check_permissions(self, request):
        """Verificar múltiples permisos del usuario actual."""
        permission_codes = request.data.get('permission_codes', [])
        if not permission_codes:
            return Response(
                {'error': 'permission_codes es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = {}
        for permission_code in permission_codes:
            results[permission_code] = PermissionChecker.user_has_permission(
                request.user, permission_code
            )
        
        return Response({
            'user_id': request.user.id,
            'permissions': results
        })
