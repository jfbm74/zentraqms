"""
Permission classes para Django REST Framework con sistema RBAC.
"""

from rest_framework import permissions
from rest_framework.permissions import BasePermission
from .permissions import PermissionChecker


class HasPermission(BasePermission):
    """
    Permission class que requiere un permiso específico.

    Usage:
        class MyViewSet(ModelViewSet):
            permission_classes = [HasPermission]
            required_permission = 'users.create'
    """

    required_permission = None

    def has_permission(self, request, view):
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # Obtener permiso requerido
        permission = getattr(view, "required_permission", self.required_permission)
        if not permission:
            return True  # Si no se especifica permiso, permitir acceso

        # Verificar permiso
        return PermissionChecker.user_has_permission(request.user, permission)

    def has_object_permission(self, request, view, obj):
        # Por defecto, usar la misma lógica que has_permission
        return self.has_permission(request, view)


class HasAnyPermission(BasePermission):
    """
    Permission class que requiere cualquiera de los permisos especificados.

    Usage:
        class MyViewSet(ModelViewSet):
            permission_classes = [HasAnyPermission]
            required_permissions = ['users.read', 'users.list']
    """

    required_permissions = None

    def has_permission(self, request, view):
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # Obtener permisos requeridos
        permissions = getattr(view, "required_permissions", self.required_permissions)
        if not permissions:
            return True  # Si no se especifican permisos, permitir acceso

        # Verificar cualquier permiso
        return any(
            PermissionChecker.user_has_permission(request.user, perm)
            for perm in permissions
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class HasRole(BasePermission):
    """
    Permission class que requiere un rol específico.

    Usage:
        class MyViewSet(ModelViewSet):
            permission_classes = [HasRole]
            required_role = 'admin'
    """

    required_role = None

    def has_permission(self, request, view):
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # Obtener rol requerido
        role = getattr(view, "required_role", self.required_role)
        if not role:
            return True  # Si no se especifica rol, permitir acceso

        # Verificar rol
        from .models import UserRole
        from django.utils import timezone

        return (
            UserRole.objects.filter(
                user=request.user, role__code=role, role__is_active=True, is_active=True
            )
            .exclude(expires_at__lt=timezone.now())
            .exists()
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class HasAnyRole(BasePermission):
    """
    Permission class que requiere cualquiera de los roles especificados.

    Usage:
        class MyViewSet(ModelViewSet):
            permission_classes = [HasAnyRole]
            required_roles = ['admin', 'manager', 'supervisor']
    """

    required_roles = None

    def has_permission(self, request, view):
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # Obtener roles requeridos
        roles = getattr(view, "required_roles", self.required_roles)
        if not roles:
            return True  # Si no se especifican roles, permitir acceso

        # Verificar cualquier rol
        from .models import UserRole
        from django.utils import timezone

        return (
            UserRole.objects.filter(
                user=request.user,
                role__code__in=roles,
                role__is_active=True,
                is_active=True,
            )
            .exclude(expires_at__lt=timezone.now())
            .exists()
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class DynamicPermission(BasePermission):
    """
    Permission class que determina el permiso basado en la acción del ViewSet.

    Usage:
        class MyViewSet(ModelViewSet):
            permission_classes = [DynamicPermission]
            resource_name = 'users'  # users.create, users.read, etc.

            # O especificar manualmente:
            permission_map = {
                'list': 'users.list',
                'create': 'users.create',
                'retrieve': 'users.read',
                'update': 'users.update',
                'destroy': 'users.delete'
            }
    """

    def get_required_permission(self, request, view):
        """
        Determinar el permiso requerido basado en la acción.
        """
        action = getattr(view, "action", None)
        if not action:
            return None

        # Usar mapeo personalizado si está definido
        permission_map = getattr(view, "permission_map", None)
        if permission_map and action in permission_map:
            return permission_map[action]

        # Usar resource_name para generar permisos automáticamente
        resource_name = getattr(view, "resource_name", None)
        if resource_name:
            action_map = {
                "list": "list",
                "create": "create",
                "retrieve": "read",
                "update": "update",
                "partial_update": "update",
                "destroy": "delete",
            }
            if action in action_map:
                return f"{resource_name}.{action_map[action]}"

        return None

    def has_permission(self, request, view):
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # Obtener permiso requerido
        permission = self.get_required_permission(request, view)
        if not permission:
            return True  # Si no se puede determinar el permiso, permitir acceso

        # Verificar permiso
        return PermissionChecker.user_has_permission(request.user, permission)

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsOwnerOrHasPermission(BasePermission):
    """
    Permission class que permite acceso si el usuario es propietario del objeto
    o tiene el permiso requerido.

    Usage:
        class MyViewSet(ModelViewSet):
            permission_classes = [IsOwnerOrHasPermission]
            required_permission = 'users.update_others'
            owner_field = 'created_by'  # Campo que identifica al propietario
    """

    required_permission = None
    owner_field = "user"  # Campo por defecto para identificar propietario

    def has_permission(self, request, view):
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # Para acciones que no requieren un objeto específico, verificar permiso
        if getattr(view, "action", None) in ["list", "create"]:
            permission = getattr(view, "required_permission", self.required_permission)
            if permission:
                return PermissionChecker.user_has_permission(request.user, permission)

        return True  # Permitir acceso, la verificación real se hace en has_object_permission

    def has_object_permission(self, request, view, obj):
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # Verificar si es propietario
        owner_field = getattr(view, "owner_field", self.owner_field)
        try:
            owner = obj
            for field in owner_field.split("."):
                owner = getattr(owner, field)
            if owner == request.user:
                return True
        except AttributeError:
            pass

        # Si no es propietario, verificar permiso
        permission = getattr(view, "required_permission", self.required_permission)
        if permission:
            return PermissionChecker.user_has_permission(request.user, permission)

        return False


class ReadOnlyOrHasPermission(BasePermission):
    """
    Permission class que permite lectura a todos los usuarios autenticados,
    pero requiere permisos específicos para escritura.

    Usage:
        class MyViewSet(ModelViewSet):
            permission_classes = [ReadOnlyOrHasPermission]
            write_permission = 'users.write'
    """

    write_permission = None

    def has_permission(self, request, view):
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # Permitir lectura a todos los usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return True

        # Para escritura, verificar permiso
        permission = getattr(view, "write_permission", self.write_permission)
        if permission:
            return PermissionChecker.user_has_permission(request.user, permission)

        return False

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


# Organization-specific permissions
class CanViewOrganization(HasPermission):
    """Permission to view organization data."""

    required_permission = "organization.read"


class CanCreateOrganization(HasPermission):
    """Permission to create organization data."""

    required_permission = "organization.create"


class CanUpdateOrganization(HasPermission):
    """Permission to update organization data."""

    required_permission = "organization.update"


class CanDeleteOrganization(HasPermission):
    """Permission to delete organization data."""

    required_permission = "organization.delete"
