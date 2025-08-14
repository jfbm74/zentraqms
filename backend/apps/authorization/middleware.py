"""
Middleware para el sistema RBAC.
"""

from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from .permissions import PermissionChecker

User = get_user_model()


class RBACMiddleware(MiddlewareMixin):
    """
    Middleware que carga roles y permisos del usuario autenticado en el request.

    Agrega al request:
    - request.user_roles: Set de códigos de roles del usuario
    - request.user_permissions: Set de códigos de permisos del usuario
    - request.has_permission(code): Método helper para verificar permisos
    - request.has_role(code): Método helper para verificar roles
    """

    def process_request(self, request):
        """
        Procesa cada request para cargar información RBAC.
        """
        # Inicializar valores por defecto
        request.user_roles = set()
        request.user_permissions = set()

        # Solo procesar usuarios autenticados
        if hasattr(request, "user") and request.user.is_authenticated:
            try:
                # Cargar roles del usuario
                from .models import UserRole
                from django.utils import timezone

                user_roles = (
                    UserRole.objects.filter(
                        user=request.user, is_active=True, role__is_active=True
                    )
                    .exclude(expires_at__lt=timezone.now())
                    .select_related("role")
                )

                request.user_roles = set(ur.role.code for ur in user_roles)

                # Cargar permisos del usuario
                request.user_permissions = PermissionChecker.get_user_permissions(
                    request.user
                )

                # Agregar permisos especiales para superusuarios
                if request.user.is_superuser:
                    request.user_permissions.add("*.all")
                    request.user_roles.add("super_admin")

            except Exception:
                # En caso de error, mantener valores vacíos
                request.user_roles = set()
                request.user_permissions = set()

        # Agregar métodos helper al request
        request.has_permission = lambda code: self._has_permission(request, code)
        request.has_role = lambda code: self._has_role(request, code)
        request.has_any_role = lambda codes: self._has_any_role(request, codes)

        return None

    def _has_permission(self, request, permission_code):
        """
        Verificar si el usuario tiene un permiso específico.
        """
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return False

        # Los superusuarios tienen todos los permisos
        if request.user.is_superuser:
            return True

        return permission_code in request.user_permissions

    def _has_role(self, request, role_code):
        """
        Verificar si el usuario tiene un rol específico.
        """
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return False

        return role_code in request.user_roles

    def _has_any_role(self, request, role_codes):
        """
        Verificar si el usuario tiene alguno de los roles especificados.
        """
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return False

        return bool(request.user_roles.intersection(set(role_codes)))


class PermissionCacheMiddleware(MiddlewareMixin):
    """
    Middleware para limpiar caché de permisos cuando sea necesario.
    """

    def process_response(self, request, response):
        """
        Procesar respuesta para limpiar caché si es necesario.
        """
        # Limpiar caché en operaciones que modifiquen roles/permisos
        if (
            hasattr(request, "user")
            and request.user.is_authenticated
            and request.method in ["POST", "PUT", "PATCH", "DELETE"]
            and any(
                path in request.path
                for path in ["/api/authorization/", "/admin/authorization/"]
            )
        ):

            try:
                from .services import PermissionService

                PermissionService.clear_user_cache(request.user)
            except Exception:
                pass  # Fallar silenciosamente si hay problemas con el caché

        return response
