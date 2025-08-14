"""
Mixins para ViewSets con verificación de permisos RBAC.
"""

from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from django.core.exceptions import ImproperlyConfigured
from .permissions import PermissionChecker


class PermissionRequiredMixin:
    """
    Mixin para ViewSets que requieren permisos específicos.

    Uso:
        class UserViewSet(PermissionRequiredMixin, ModelViewSet):
            permission_required = 'users'  # Recurso base
            # O definir permisos específicos por acción:
            permission_required = {
                'list': 'users.list',
                'create': 'users.create',
                'retrieve': 'users.read',
                'update': 'users.update',
                'partial_update': 'users.update',
                'destroy': 'users.delete',
            }
    """

    permission_required = None
    permission_required_any = None  # El usuario debe tener al menos uno
    permission_required_all = None  # El usuario debe tener todos

    def get_permission_required(self):
        """
        Obtener el permiso requerido para la acción actual.
        """
        if self.permission_required is None:
            raise ImproperlyConfigured(
                f"{self.__class__.__name__} debe definir el atributo permission_required"
            )

        # Si es un string, es el recurso base
        if isinstance(self.permission_required, str):
            action_map = {
                "list": "list",
                "create": "create",
                "retrieve": "read",
                "update": "update",
                "partial_update": "update",
                "destroy": "delete",
            }
            action = action_map.get(self.action, self.action)
            return f"{self.permission_required}.{action}"

        # Si es un diccionario, buscar la acción específica
        if isinstance(self.permission_required, dict):
            return self.permission_required.get(self.action)

        return None

    def check_permissions(self, request):
        """
        Verificar permisos antes de ejecutar la acción.
        """
        super().check_permissions(request)

        # Verificar permiso específico de la acción
        permission_code = self.get_permission_required()
        if permission_code:
            if not PermissionChecker.user_has_permission(request.user, permission_code):
                raise PermissionDenied(
                    f"No tienes permiso para realizar esta acción: {permission_code}"
                )

        # Verificar permisos "any" (al menos uno)
        if self.permission_required_any:
            permissions = self.permission_required_any
            if isinstance(permissions, str):
                permissions = [permissions]

            if not PermissionChecker.user_has_any_permission(request.user, permissions):
                raise PermissionDenied(
                    f'Necesitas al menos uno de estos permisos: {", ".join(permissions)}'
                )

        # Verificar permisos "all" (todos)
        if self.permission_required_all:
            permissions = self.permission_required_all
            if isinstance(permissions, str):
                permissions = [permissions]

            if not PermissionChecker.user_has_all_permissions(
                request.user, permissions
            ):
                raise PermissionDenied(
                    f'Necesitas todos estos permisos: {", ".join(permissions)}'
                )


class RBACPermission(permissions.BasePermission):
    """
    Clase de permiso para usar con DRF permission_classes.

    Uso:
        class UserViewSet(ModelViewSet):
            permission_classes = [IsAuthenticated, RBACPermission]
            rbac_permissions = {
                'list': 'users.list',
                'create': 'users.create',
                # ...
            }
    """

    def has_permission(self, request, view):
        """
        Verificar si el usuario tiene permiso para la vista.
        """
        # Verificar autenticación
        if not request.user or not request.user.is_authenticated:
            return False

        # Los superusuarios siempre tienen permiso
        if request.user.is_superuser:
            return True

        # Obtener permiso requerido
        permission_code = self._get_required_permission(view)
        if not permission_code:
            return True  # Si no hay permiso definido, permitir

        # Verificar permiso
        return PermissionChecker.user_has_permission(request.user, permission_code)

    def has_object_permission(self, request, view, obj):
        """
        Verificar permisos a nivel de objeto.
        Puede ser sobrescrito para lógica específica.
        """
        return self.has_permission(request, view)

    def _get_required_permission(self, view):
        """
        Obtener el permiso requerido de la vista.
        """
        # Buscar en rbac_permissions
        if hasattr(view, "rbac_permissions"):
            permissions = view.rbac_permissions
            if isinstance(permissions, dict):
                return permissions.get(view.action)
            elif isinstance(permissions, str):
                # Si es string, construir permiso basado en la acción
                action_map = {
                    "list": "list",
                    "create": "create",
                    "retrieve": "read",
                    "update": "update",
                    "partial_update": "update",
                    "destroy": "delete",
                }
                action = action_map.get(view.action, view.action)
                return f"{permissions}.{action}"

        # Buscar en get_rbac_permission método
        if hasattr(view, "get_rbac_permission"):
            return view.get_rbac_permission()

        return None


class ResourcePermissionMixin:
    """
    Mixin para filtrar querysets basado en permisos del usuario.

    Uso:
        class DocumentViewSet(ResourcePermissionMixin, ModelViewSet):
            resource_permission = 'documents'

            def get_queryset(self):
                queryset = super().get_queryset()
                # El mixin filtrará basado en permisos
                return self.filter_queryset_by_permissions(queryset)
    """

    resource_permission = None

    def filter_queryset_by_permissions(self, queryset):
        """
        Filtrar queryset basado en permisos del usuario.
        """
        if not self.resource_permission:
            return queryset

        user = self.request.user

        # Superusuarios ven todo
        if user.is_superuser:
            return queryset

        # Verificar si tiene permiso de ver todo
        if PermissionChecker.user_has_permission(user, f"{self.resource_permission}.*"):
            return queryset

        if PermissionChecker.user_has_permission(
            user, f"{self.resource_permission}.list"
        ):
            return queryset

        # Si no tiene permiso de lista, filtrar por propietario si aplica
        if hasattr(queryset.model, "created_by"):
            return queryset.filter(created_by=user)
        elif hasattr(queryset.model, "user"):
            return queryset.filter(user=user)
        elif hasattr(queryset.model, "owner"):
            return queryset.filter(owner=user)

        # Si no hay campo de propietario, retornar queryset vacío
        return queryset.none()

    def get_queryset(self):
        """
        Sobrescribir para aplicar filtros de permisos automáticamente.
        """
        queryset = super().get_queryset()
        return self.filter_queryset_by_permissions(queryset)


class OwnerOrPermissionMixin:
    """
    Mixin que permite acceso al propietario del objeto o usuarios con permiso.

    Uso:
        class ProfileViewSet(OwnerOrPermissionMixin, ModelViewSet):
            owner_field = 'user'  # Campo que identifica al propietario
            owner_permission = 'profiles'  # Permiso base para no-propietarios
    """

    owner_field = "user"
    owner_permission = None

    def check_object_permissions(self, request, obj):
        """
        Verificar permisos sobre el objeto.
        """
        super().check_object_permissions(request, obj)

        user = request.user

        # Superusuarios siempre tienen acceso
        if user.is_superuser:
            return

        # Verificar si es el propietario
        owner = getattr(obj, self.owner_field, None)
        if owner == user:
            return

        # Si no es propietario, verificar permiso específico
        if self.owner_permission:
            action_map = {
                "retrieve": "read",
                "update": "update",
                "partial_update": "update",
                "destroy": "delete",
            }
            action = action_map.get(self.action, self.action)
            permission_code = f"{self.owner_permission}.{action}"

            if PermissionChecker.user_has_permission(user, permission_code):
                return

        raise PermissionDenied("No tienes permiso para acceder a este objeto")
