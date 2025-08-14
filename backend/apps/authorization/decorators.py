"""
Decoradores para control de acceso RBAC.
"""

from functools import wraps
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status
from .permissions import PermissionChecker


def require_permission(permission_code):
    """
    Decorador que requiere un permiso específico.

    Args:
        permission_code (str): Código del permiso requerido

    Usage:
        @require_permission('users.create')
        def create_user(request):
            ...
    """

    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def _wrapped_view(request, *args, **kwargs):
            # Verificar permiso
            if not PermissionChecker.user_has_permission(request.user, permission_code):
                if (
                    request.content_type == "application/json"
                    or "/api/" in request.path
                ):
                    return JsonResponse(
                        {
                            "success": False,
                            "error": {
                                "message": "No tienes permisos suficientes para realizar esta acción.",
                                "code": "PERMISSION_DENIED",
                                "required_permission": permission_code,
                                "timestamp": str(timezone.now()),
                            },
                        },
                        status=403,
                    )
                else:
                    return JsonResponse(
                        {
                            "error": "Permiso denegado",
                            "required_permission": permission_code,
                        },
                        status=403,
                    )

            return view_func(request, *args, **kwargs)

        return _wrapped_view

    return decorator


def require_role(role_code):
    """
    Decorador que requiere un rol específico.

    Args:
        role_code (str): Código del rol requerido

    Usage:
        @require_role('admin')
        def admin_view(request):
            ...
    """

    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def _wrapped_view(request, *args, **kwargs):
            # Verificar si el usuario tiene el rol
            from .models import UserRole

            has_role = (
                UserRole.objects.filter(
                    user=request.user,
                    role__code=role_code,
                    role__is_active=True,
                    is_active=True,
                )
                .exclude(expires_at__lt=timezone.now())
                .exists()
            )

            if not has_role:
                if (
                    request.content_type == "application/json"
                    or "/api/" in request.path
                ):
                    return JsonResponse(
                        {
                            "success": False,
                            "error": {
                                "message": "No tienes el rol requerido para acceder a este recurso.",
                                "code": "ROLE_REQUIRED",
                                "required_role": role_code,
                                "timestamp": str(timezone.now()),
                            },
                        },
                        status=403,
                    )
                else:
                    return JsonResponse(
                        {"error": "Rol requerido", "required_role": role_code},
                        status=403,
                    )

            return view_func(request, *args, **kwargs)

        return _wrapped_view

    return decorator


def require_any_role(*role_codes):
    """
    Decorador que requiere cualquiera de los roles especificados.

    Args:
        *role_codes: Códigos de roles aceptados

    Usage:
        @require_any_role('admin', 'manager', 'supervisor')
        def management_view(request):
            ...
    """

    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def _wrapped_view(request, *args, **kwargs):
            # Verificar si el usuario tiene alguno de los roles
            from .models import UserRole

            has_any_role = (
                UserRole.objects.filter(
                    user=request.user,
                    role__code__in=role_codes,
                    role__is_active=True,
                    is_active=True,
                )
                .exclude(expires_at__lt=timezone.now())
                .exists()
            )

            if not has_any_role:
                if (
                    request.content_type == "application/json"
                    or "/api/" in request.path
                ):
                    return JsonResponse(
                        {
                            "success": False,
                            "error": {
                                "message": "No tienes ninguno de los roles requeridos para acceder a este recurso.",
                                "code": "ANY_ROLE_REQUIRED",
                                "required_roles": list(role_codes),
                                "timestamp": str(timezone.now()),
                            },
                        },
                        status=403,
                    )
                else:
                    return JsonResponse(
                        {
                            "error": "Roles requeridos",
                            "required_roles": list(role_codes),
                        },
                        status=403,
                    )

            return view_func(request, *args, **kwargs)

        return _wrapped_view

    return decorator


def require_any_permission(*permission_codes):
    """
    Decorador que requiere cualquiera de los permisos especificados.

    Args:
        *permission_codes: Códigos de permisos aceptados

    Usage:
        @require_any_permission('users.read', 'users.list')
        def user_view(request):
            ...
    """

    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def _wrapped_view(request, *args, **kwargs):
            # Verificar si el usuario tiene alguno de los permisos
            has_permission = any(
                PermissionChecker.user_has_permission(request.user, code)
                for code in permission_codes
            )

            if not has_permission:
                if (
                    request.content_type == "application/json"
                    or "/api/" in request.path
                ):
                    return JsonResponse(
                        {
                            "success": False,
                            "error": {
                                "message": "No tienes ninguno de los permisos requeridos para realizar esta acción.",
                                "code": "ANY_PERMISSION_REQUIRED",
                                "required_permissions": list(permission_codes),
                                "timestamp": str(timezone.now()),
                            },
                        },
                        status=403,
                    )
                else:
                    return JsonResponse(
                        {
                            "error": "Permisos requeridos",
                            "required_permissions": list(permission_codes),
                        },
                        status=403,
                    )

            return view_func(request, *args, **kwargs)

        return _wrapped_view

    return decorator


# Decoradores para DRF (Django REST Framework)
def require_permission_drf(permission_code):
    """
    Decorador DRF que requiere un permiso específico.

    Args:
        permission_code (str): Código del permiso requerido

    Usage:
        @require_permission_drf('users.create')
        def create(self, request):
            ...
    """

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(self, request, *args, **kwargs):
            # Verificar autenticación
            if not request.user.is_authenticated:
                return Response(
                    {
                        "success": False,
                        "error": {
                            "message": "Debes estar autenticado para acceder a este recurso.",
                            "code": "AUTHENTICATION_REQUIRED",
                        },
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Verificar permiso
            if not PermissionChecker.user_has_permission(request.user, permission_code):
                return Response(
                    {
                        "success": False,
                        "error": {
                            "message": "No tienes permisos suficientes para realizar esta acción.",
                            "code": "PERMISSION_DENIED",
                            "required_permission": permission_code,
                        },
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            return view_func(self, request, *args, **kwargs)

        return _wrapped_view

    return decorator


def require_role_drf(role_code):
    """
    Decorador DRF que requiere un rol específico.

    Args:
        role_code (str): Código del rol requerido

    Usage:
        @require_role_drf('admin')
        def admin_action(self, request):
            ...
    """

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(self, request, *args, **kwargs):
            # Verificar autenticación
            if not request.user.is_authenticated:
                return Response(
                    {
                        "success": False,
                        "error": {
                            "message": "Debes estar autenticado para acceder a este recurso.",
                            "code": "AUTHENTICATION_REQUIRED",
                        },
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Verificar rol
            from .models import UserRole

            has_role = (
                UserRole.objects.filter(
                    user=request.user,
                    role__code=role_code,
                    role__is_active=True,
                    is_active=True,
                )
                .exclude(expires_at__lt=timezone.now())
                .exists()
            )

            if not has_role:
                return Response(
                    {
                        "success": False,
                        "error": {
                            "message": "No tienes el rol requerido para acceder a este recurso.",
                            "code": "ROLE_REQUIRED",
                            "required_role": role_code,
                        },
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            return view_func(self, request, *args, **kwargs)

        return _wrapped_view

    return decorator
