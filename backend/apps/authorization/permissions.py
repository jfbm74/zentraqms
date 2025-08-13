"""
Utilidades para verificación de permisos RBAC.
"""
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.utils import timezone
from typing import List, Set, Optional
from .models import UserRole, Permission

User = get_user_model()


class PermissionChecker:
    """
    Clase para verificar permisos de usuarios.
    Incluye caché para mejorar el rendimiento.
    """
    
    CACHE_TIMEOUT = 300  # 5 minutos
    CACHE_PREFIX = 'user_permissions'
    
    @classmethod
    def get_cache_key(cls, user_id: str, permission_code: str = None) -> str:
        """Generar clave de caché para permisos de usuario."""
        if permission_code:
            return f"{cls.CACHE_PREFIX}:{user_id}:{permission_code}"
        return f"{cls.CACHE_PREFIX}:{user_id}:all"
    
    @classmethod
    def clear_user_cache(cls, user_id: str):
        """Limpiar caché de permisos de un usuario."""
        # Intentar limpiar con delete_pattern si está disponible (Redis)
        try:
            cache_pattern = f"{cls.CACHE_PREFIX}:{user_id}:*"
            cache.delete_pattern(cache_pattern)
        except AttributeError:
            # Si no tiene delete_pattern, limpiar manualmente algunas claves comunes
            cache.delete(f"{cls.CACHE_PREFIX}:{user_id}:all")
            # Limpiar algunos permisos comunes
            common_permissions = [
                'users.create', 'users.read', 'users.update', 'users.delete',
                'roles.create', 'roles.read', 'roles.update', 'roles.delete',
                'reports.create', 'reports.read', 'dashboard.view', '*.all'
            ]
            for perm in common_permissions:
                cache.delete(f"{cls.CACHE_PREFIX}:{user_id}:{perm}")
    
    @classmethod
    def user_has_permission(cls, user: User, permission_code: str) -> bool:
        """
        Verificar si un usuario tiene un permiso específico.
        
        Args:
            user: Usuario a verificar
            permission_code: Código del permiso (ej: 'users.create')
            
        Returns:
            bool: True si el usuario tiene el permiso
        """
        if not user or not user.is_authenticated:
            return False
        
        # Los superusuarios tienen todos los permisos
        if user.is_superuser:
            return True
        
        # Verificar en caché
        cache_key = cls.get_cache_key(str(user.id), permission_code)
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Verificar permisos del usuario
        result = cls._check_user_permission(user, permission_code)
        
        # Guardar en caché
        cache.set(cache_key, result, cls.CACHE_TIMEOUT)
        
        return result
    
    @classmethod
    def _check_user_permission(cls, user: User, permission_code: str) -> bool:
        """
        Verificación interna de permisos sin caché.
        """
        # Obtener roles activos del usuario
        user_roles = UserRole.objects.filter(
            user=user,
            is_active=True,
            role__is_active=True
        ).exclude(
            expires_at__lt=timezone.now()
        ).select_related('role')
        
        for user_role in user_roles:
            # Verificar si el rol tiene el permiso
            if user_role.role.has_permission(permission_code):
                return True
        
        return False
    
    @classmethod
    def get_user_permissions(cls, user: User) -> Set[str]:
        """
        Obtener todos los códigos de permisos de un usuario.
        
        Args:
            user: Usuario
            
        Returns:
            Set de códigos de permisos
        """
        if not user or not user.is_authenticated:
            return set()
        
        # Los superusuarios tienen todos los permisos
        if user.is_superuser:
            return {'*.all'}
        
        # Verificar en caché
        cache_key = cls.get_cache_key(str(user.id))
        cached_permissions = cache.get(cache_key)
        if cached_permissions is not None:
            return set(cached_permissions)
        
        permissions = set()
        
        # Obtener roles activos del usuario
        user_roles = UserRole.objects.filter(
            user=user,
            is_active=True,
            role__is_active=True
        ).exclude(
            expires_at__lt=timezone.now()
        ).select_related('role').prefetch_related('role__permissions')
        
        for user_role in user_roles:
            # Obtener permisos del rol
            role_permissions = user_role.role.get_all_permissions()
            permissions.update(role_permissions)
        
        # Guardar en caché
        cache.set(cache_key, list(permissions), cls.CACHE_TIMEOUT)
        
        return permissions
    
    @classmethod
    def user_has_any_permission(cls, user: User, permission_codes: List[str]) -> bool:
        """
        Verificar si el usuario tiene al menos uno de los permisos especificados.
        
        Args:
            user: Usuario
            permission_codes: Lista de códigos de permisos
            
        Returns:
            bool: True si tiene al menos un permiso
        """
        for permission_code in permission_codes:
            if cls.user_has_permission(user, permission_code):
                return True
        return False
    
    @classmethod
    def user_has_all_permissions(cls, user: User, permission_codes: List[str]) -> bool:
        """
        Verificar si el usuario tiene todos los permisos especificados.
        
        Args:
            user: Usuario
            permission_codes: Lista de códigos de permisos
            
        Returns:
            bool: True si tiene todos los permisos
        """
        for permission_code in permission_codes:
            if not cls.user_has_permission(user, permission_code):
                return False
        return True
    
    @classmethod
    def get_users_with_permission(cls, permission_code: str) -> List[User]:
        """
        Obtener todos los usuarios que tienen un permiso específico.
        
        Args:
            permission_code: Código del permiso
            
        Returns:
            Lista de usuarios con el permiso
        """
        # Buscar el permiso
        try:
            permission = Permission.objects.get(code=permission_code, is_active=True)
        except Permission.DoesNotExist:
            return []
        
        # Obtener usuarios con roles que tienen este permiso
        user_ids = UserRole.objects.filter(
            role__permissions=permission,
            role__is_active=True,
            is_active=True,
            user__is_active=True
        ).exclude(
            expires_at__lt=timezone.now()
        ).values_list('user_id', flat=True).distinct()
        
        return list(User.objects.filter(id__in=user_ids))
    
    @classmethod
    def get_resource_permissions(cls, user: User, resource: str) -> List[str]:
        """
        Obtener todas las acciones permitidas de un usuario sobre un recurso.
        
        Args:
            user: Usuario
            resource: Nombre del recurso (ej: 'users', 'reports')
            
        Returns:
            Lista de acciones permitidas
        """
        all_permissions = cls.get_user_permissions(user)
        
        # Si tiene permiso super admin, tiene todas las acciones
        if '*.all' in all_permissions:
            return ['*']
        
        # Si tiene wildcard del recurso, tiene todas las acciones
        if f'{resource}.*' in all_permissions:
            return ['*']
        
        # Filtrar permisos del recurso
        actions = []
        for perm in all_permissions:
            if perm.startswith(f'{resource}.'):
                action = perm.split('.')[1]
                actions.append(action)
        
        return actions


class PermissionValidator:
    """
    Validador de permisos para usar en validaciones de formularios y serializers.
    """
    
    @staticmethod
    def validate_permission_code(code: str) -> bool:
        """
        Validar formato del código de permiso.
        
        Args:
            code: Código del permiso
            
        Returns:
            bool: True si el formato es válido
        """
        if code == '*.all':
            return True
        
        if '.' not in code:
            return False
        
        parts = code.split('.')
        if len(parts) != 2:
            return False
        
        resource, action = parts
        
        # Validar que no estén vacíos
        if not resource or not action:
            return False
        
        # Validar caracteres permitidos (alfanuméricos, guiones y asterisco)
        import re
        pattern = r'^[a-z0-9_\-\*]+$'
        
        if not re.match(pattern, resource) or not re.match(pattern, action):
            return False
        
        return True
    
    @staticmethod
    def normalize_permission_code(code: str) -> str:
        """
        Normalizar código de permiso a minúsculas.
        
        Args:
            code: Código del permiso
            
        Returns:
            str: Código normalizado
        """
        return code.lower().strip()


def has_permission(permission_code: str):
    """
    Función helper para verificar permisos rápidamente.
    
    Uso:
        if has_permission('users.create'):
            # El usuario tiene permiso
    """
    from django.contrib.auth import get_user
    user = get_user()
    return PermissionChecker.user_has_permission(user, permission_code)