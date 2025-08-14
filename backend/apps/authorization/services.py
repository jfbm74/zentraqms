"""
Servicios para el sistema RBAC.
"""

import logging
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from typing import List, Set, Dict, Optional, Tuple
from .models import UserRole, Permission, Role
from .permissions import PermissionChecker

User = get_user_model()
logger = logging.getLogger(__name__)


class PermissionService:
    """
    Servicio principal para evaluación y gestión de permisos RBAC.

    Implementa lógica de evaluación de permisos con cache Redis y
    evaluación de wildcards (specific > wildcard).
    """

    CACHE_TIMEOUT = getattr(settings, "RBAC_CACHE_TIMEOUT", 300)  # 5 minutos
    CACHE_PREFIX = "rbac_permissions"

    @classmethod
    def evaluate_permission(cls, user: User, permission_code: str) -> bool:
        """
        Evaluar si un usuario tiene un permiso específico.

        Implementa lógica de evaluación: specific > wildcard

        Args:
            user: Usuario a evaluar
            permission_code: Código del permiso (ej: 'users.create')

        Returns:
            bool: True si el usuario tiene el permiso
        """
        if not user or not user.is_authenticated:
            return False

        # Superusuarios tienen todos los permisos
        if user.is_superuser:
            return True

        # Verificar en caché primero
        cache_key = f"{cls.CACHE_PREFIX}:{user.id}:{permission_code}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            logger.debug(
                f"Permission {permission_code} for user {user.id} found in cache: {cached_result}"
            )
            return cached_result

        # Evaluar permisos con lógica de precedencia
        result = cls._evaluate_permission_logic(user, permission_code)

        # Guardar en caché
        cache.set(cache_key, result, cls.CACHE_TIMEOUT)
        logger.debug(
            f"Permission {permission_code} for user {user.id} evaluated: {result}"
        )

        return result

    @classmethod
    def _evaluate_permission_logic(cls, user: User, permission_code: str) -> bool:
        """
        Lógica interna de evaluación de permisos.

        Orden de evaluación:
        1. Permiso específico exacto
        2. Wildcard de recurso (resource.*)
        3. Wildcard global (*.all)
        """
        user_permissions = cls.get_user_permissions_set(user)

        # 1. Verificar permiso específico exacto
        if permission_code in user_permissions:
            return True

        # 2. Verificar wildcard de recurso
        if "." in permission_code:
            resource, _ = permission_code.split(".", 1)
            resource_wildcard = f"{resource}.*"
            if resource_wildcard in user_permissions:
                return True

        # 3. Verificar wildcard global
        if "*.all" in user_permissions:
            return True

        return False

    @classmethod
    def get_user_permissions_set(cls, user: User) -> Set[str]:
        """
        Obtener set completo de permisos de un usuario desde caché o DB.
        """
        cache_key = f"{cls.CACHE_PREFIX}:{user.id}:all"
        cached_permissions = cache.get(cache_key)

        if cached_permissions is not None:
            return set(cached_permissions)

        # Obtener desde base de datos
        permissions = set()

        # Obtener roles activos del usuario
        user_roles = (
            UserRole.objects.filter(user=user, is_active=True, role__is_active=True)
            .exclude(expires_at__lt=timezone.now())
            .select_related("role")
            .prefetch_related("role__permissions")
        )

        for user_role in user_roles:
            role_permissions = user_role.role.get_all_permissions()
            permissions.update(role_permissions)

        # Guardar en caché
        cache.set(cache_key, list(permissions), cls.CACHE_TIMEOUT)

        return permissions

    @classmethod
    def get_user_roles_set(cls, user: User) -> Set[str]:
        """
        Obtener set de códigos de roles de un usuario.
        """
        cache_key = f"{cls.CACHE_PREFIX}:{user.id}:roles"
        cached_roles = cache.get(cache_key)

        if cached_roles is not None:
            return set(cached_roles)

        # Obtener desde base de datos
        user_roles = (
            UserRole.objects.filter(user=user, is_active=True, role__is_active=True)
            .exclude(expires_at__lt=timezone.now())
            .select_related("role")
        )

        roles = set(ur.role.code for ur in user_roles)

        # Guardar en caché
        cache.set(cache_key, list(roles), cls.CACHE_TIMEOUT)

        return roles

    @classmethod
    def check_multiple_permissions(
        cls, user: User, permission_codes: List[str], require_all: bool = False
    ) -> Dict[str, bool]:
        """
        Verificar múltiples permisos de una vez.

        Args:
            user: Usuario a verificar
            permission_codes: Lista de códigos de permisos
            require_all: Si True, retorna True solo si tiene todos los permisos

        Returns:
            Dict con resultado de cada permiso o bool si require_all=True
        """
        results = {}

        for permission_code in permission_codes:
            results[permission_code] = cls.evaluate_permission(user, permission_code)

        if require_all:
            return all(results.values())

        return results

    @classmethod
    def get_resource_permissions(cls, user: User, resource: str) -> List[str]:
        """
        Obtener todas las acciones permitidas de un usuario sobre un recurso.

        Args:
            user: Usuario
            resource: Nombre del recurso (ej: 'users', 'reports')

        Returns:
            Lista de acciones permitidas ['create', 'read', 'update'] o ['*'] para todas
        """
        user_permissions = cls.get_user_permissions_set(user)

        # Si tiene permiso super admin, tiene todas las acciones
        if "*.all" in user_permissions:
            return ["*"]

        # Si tiene wildcard del recurso, tiene todas las acciones
        if f"{resource}.*" in user_permissions:
            return ["*"]

        # Filtrar permisos específicos del recurso
        actions = []
        for perm in user_permissions:
            if perm.startswith(f"{resource}."):
                action = perm.split(".", 1)[1]
                if action != "*":  # Evitar duplicar el wildcard
                    actions.append(action)

        return actions

    @classmethod
    def can_assign_role(
        cls, assigner: User, target_user: User, role_code: str
    ) -> Tuple[bool, str]:
        """
        Verificar si un usuario puede asignar un rol a otro usuario.

        Args:
            assigner: Usuario que intenta asignar el rol
            target_user: Usuario al que se le asigna el rol
            role_code: Código del rol a asignar

        Returns:
            Tuple (puede_asignar, razon)
        """
        if not assigner.is_authenticated:
            return False, "Usuario no autenticado"

        # Superusuarios pueden asignar cualquier rol
        if assigner.is_superuser:
            return True, "Superusuario"

        # Verificar permiso general de asignación de roles
        if not cls.evaluate_permission(assigner, "roles.assign"):
            return False, "Sin permisos para asignar roles"

        # Verificar si puede asignar este rol específico
        try:
            role = Role.objects.get(code=role_code, is_active=True)
        except Role.DoesNotExist:
            return False, "Rol no existe o está inactivo"

        # Lógica adicional: no puede asignar roles superiores a los que tiene
        assigner_roles = cls.get_user_roles_set(assigner)

        # Definir jerarquía de roles (configurable)
        role_hierarchy = {
            "super_admin": 10,
            "quality_coordinator": 8,
            "department_head": 6,
            "internal_auditor": 5,
            "process_owner": 4,
            "operative_user": 2,
            "read_only_user": 1,
        }

        assigner_level = (
            max(role_hierarchy.get(role, 0) for role in assigner_roles)
            if assigner_roles
            else 0
        )

        target_role_level = role_hierarchy.get(role_code, 0)

        if target_role_level > assigner_level:
            return False, f"No puede asignar un rol superior ({role_code}) al suyo"

        return True, "Autorizado"

    @classmethod
    def clear_user_cache(cls, user: User) -> None:
        """
        Limpiar cache de permisos y roles de un usuario.

        Args:
            user: Usuario cuyo cache se va a limpiar
        """
        cache_keys = [
            f"user_permissions_{user.id}",
            f"user_roles_{user.id}",
            f"user_permissions_tree_{user.id}",
            f"{cls.CACHE_PREFIX}:{user.id}:all",
            f"{cls.CACHE_PREFIX}:{user.id}:roles",
        ]

        for key in cache_keys:
            cache.delete(key)

    @classmethod
    def invalidate_user_cache(cls, user_id: str):
        """
        Invalidar todo el caché de permisos de un usuario.

        Args:
            user_id: ID del usuario
        """
        try:
            # Intentar usar delete_pattern si está disponible (Redis)
            cache_pattern = f"{cls.CACHE_PREFIX}:{user_id}:*"
            cache.delete_pattern(cache_pattern)
            logger.info(f"Cache pattern deleted for user {user_id}: {cache_pattern}")
        except AttributeError:
            # Fallback para otros backends de caché
            keys_to_delete = [
                f"{cls.CACHE_PREFIX}:{user_id}:all",
                f"{cls.CACHE_PREFIX}:{user_id}:roles",
            ]

            # Limpiar algunos permisos comunes
            common_permissions = [
                "users.create",
                "users.read",
                "users.update",
                "users.delete",
                "roles.create",
                "roles.read",
                "roles.update",
                "roles.delete",
                "audits.create",
                "audits.read",
                "audits.update",
                "audits.delete",
                "documents.create",
                "documents.read",
                "documents.update",
                "documents.delete",
                "processes.create",
                "processes.read",
                "processes.update",
                "processes.delete",
                "reports.create",
                "reports.read",
                "reports.update",
                "reports.delete",
                "dashboard.view",
                "dashboard.export",
                "*.all",
            ]

            for perm in common_permissions:
                keys_to_delete.append(f"{cls.CACHE_PREFIX}:{user_id}:{perm}")

            cache.delete_many(keys_to_delete)
            logger.info(
                f"Cache keys deleted for user {user_id}: {len(keys_to_delete)} keys"
            )

    @classmethod
    def get_permission_tree(cls, user: User) -> Dict[str, List[str]]:
        """
        Obtener árbol de permisos organizados por recurso.

        Returns:
            Dict con recursos como claves y listas de acciones como valores
        """
        user_permissions = cls.get_user_permissions_set(user)
        permission_tree = {}

        for permission_code in user_permissions:
            if permission_code == "*.all":
                permission_tree["*"] = ["all"]
            elif "." in permission_code:
                resource, action = permission_code.split(".", 1)
                if resource not in permission_tree:
                    permission_tree[resource] = []
                permission_tree[resource].append(action)

        return permission_tree

    @classmethod
    def get_user_permissions_tree(cls, user: User) -> Dict[str, List[str]]:
        """
        Obtener árbol de permisos organizados por recurso.

        Returns:
            Dict con recursos como claves y listas de acciones como valores
        """
        return cls.get_permission_tree(user)

    @classmethod
    def can_assign_role_to_user(
        cls, assigner: User, target_user: User, role_code: str
    ) -> bool:
        """
        Verificar si un usuario puede asignar un rol específico a otro usuario.

        Args:
            assigner: Usuario que quiere asignar el rol
            target_user: Usuario al que se le asignará el rol
            role_code: Código del rol a asignar

        Returns:
            bool: True si puede asignar el rol
        """
        # Super admin puede asignar cualquier rol
        if cls.evaluate_permission(assigner, "*.all"):
            return True

        # Verificar permiso básico de asignación de roles
        if not cls.evaluate_permission(assigner, "users.assign_roles"):
            return False

        # Obtener el rol a asignar
        try:
            from .models import Role

            role = Role.objects.get(code=role_code, is_active=True)
        except Role.DoesNotExist:
            return False

        # No se pueden asignar roles del sistema a menos que seas super admin
        if role.is_system:
            return False

        return True

    @classmethod
    def audit_permission_check(
        cls,
        user: User,
        permission_code: str,
        granted: bool,
        context: Optional[Dict] = None,
    ):
        """
        Registrar auditoría de verificación de permisos.

        Args:
            user: Usuario que solicitó el permiso
            permission_code: Código del permiso verificado
            granted: Si el permiso fue concedido
            context: Contexto adicional (IP, endpoint, etc.)
        """
        # Implementación básica de auditoría
        # En producción, esto podría usar un sistema de logging más sofisticado
        audit_data = {
            "user_id": str(user.id),
            "user_email": user.email,
            "permission": permission_code,
            "granted": granted,
            "timestamp": timezone.now().isoformat(),
            "context": context or {},
        }

        logger.info(f"Permission audit: {audit_data}")

        # Aquí se podría integrar con sistemas de auditoría externos
        # como Elasticsearch, Splunk, etc.


# Alias para mantener compatibilidad con código existente
class PermissionEvaluator(PermissionService):
    """Alias para PermissionService para compatibilidad."""

    pass
