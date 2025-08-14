"""
Modelos para el sistema RBAC (Role-Based Access Control)
Sistema dinámico y flexible para gestión de permisos y roles.
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q

User = get_user_model()


class Permission(models.Model):
    """
    Modelo para permisos granulares del sistema.

    El código sigue el formato: recurso.accion
    Ejemplos: users.create, reports.view, *.all
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=255,
        verbose_name="Nombre del Permiso",
        help_text="Nombre descriptivo del permiso",
    )
    code = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Código del Permiso",
        help_text="Formato: recurso.accion (ej: users.create)",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Descripción",
        help_text="Descripción detallada del permiso",
    )
    resource = models.CharField(
        max_length=50,
        verbose_name="Recurso",
        help_text="Recurso al que aplica el permiso (users, reports, etc.)",
    )
    action = models.CharField(
        max_length=50,
        verbose_name="Acción",
        help_text="Acción permitida (create, read, update, delete, etc.)",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Activo",
        help_text="Si el permiso está activo en el sistema",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Fecha de Creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Última Actualización"
    )

    class Meta:
        db_table = "authorization_permissions"
        ordering = ["resource", "action"]
        verbose_name = "Permiso"
        verbose_name_plural = "Permisos"
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["resource", "action"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def clean(self):
        """Validación del formato del código del permiso."""
        if self.code and "." not in self.code and self.code != "*.all":
            raise ValidationError(
                {"code": "El código debe seguir el formato recurso.accion o ser *.all"}
            )

        # Sincronizar resource y action con el code
        if self.code and "." in self.code:
            parts = self.code.split(".")
            if len(parts) == 2:
                self.resource = parts[0]
                self.action = parts[1]

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class Role(models.Model):
    """
    Modelo para roles del sistema.
    Los roles agrupan permisos relacionados.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=255,
        verbose_name="Nombre del Rol",
        help_text="Nombre descriptivo del rol",
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Código del Rol",
        help_text="Código único del rol (ej: super_admin)",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Descripción",
        help_text="Descripción detallada del rol y sus responsabilidades",
    )
    is_system = models.BooleanField(
        default=False,
        verbose_name="Rol del Sistema",
        help_text="Los roles del sistema no pueden ser eliminados",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Activo",
        help_text="Si el rol está activo en el sistema",
    )
    permissions = models.ManyToManyField(
        Permission,
        through="RolePermission",
        related_name="roles",
        verbose_name="Permisos",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Fecha de Creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Última Actualización"
    )

    class Meta:
        db_table = "authorization_roles"
        ordering = ["name"]
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["is_system"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"

    def delete(self, *args, **kwargs):
        """Prevenir eliminación de roles del sistema."""
        if self.is_system:
            raise ValidationError("Los roles del sistema no pueden ser eliminados")
        super().delete(*args, **kwargs)

    def get_all_permissions(self):
        """Obtener todos los permisos activos del rol."""
        return self.permissions.filter(is_active=True).values_list("code", flat=True)

    def has_permission(self, permission_code):
        """Verificar si el rol tiene un permiso específico."""
        # Verificar permiso super admin
        if self.permissions.filter(code="*.all", is_active=True).exists():
            return True

        # Verificar permiso específico
        if self.permissions.filter(code=permission_code, is_active=True).exists():
            return True

        # Verificar wildcard de recurso
        if "." in permission_code:
            resource = permission_code.split(".")[0]
            if self.permissions.filter(code=f"{resource}.*", is_active=True).exists():
                return True

        return False


class RolePermission(models.Model):
    """
    Tabla intermedia para la relación Role-Permission.
    Incluye información de auditoría.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name="role_permissions",
        verbose_name="Rol",
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name="permission_roles",
        verbose_name="Permiso",
    )
    granted_at = models.DateTimeField(
        default=timezone.now, verbose_name="Fecha de Asignación"
    )
    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="granted_role_permissions",
        verbose_name="Asignado por",
    )

    class Meta:
        db_table = "authorization_role_permissions"
        unique_together = ["role", "permission"]
        verbose_name = "Permiso de Rol"
        verbose_name_plural = "Permisos de Roles"
        indexes = [
            models.Index(fields=["role", "permission"]),
        ]

    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"


class UserRole(models.Model):
    """
    Modelo para asignar roles a usuarios.
    Un usuario puede tener múltiples roles.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_roles",
        verbose_name="Usuario",
    )
    role = models.ForeignKey(
        Role, on_delete=models.CASCADE, related_name="role_users", verbose_name="Rol"
    )
    assigned_at = models.DateTimeField(
        default=timezone.now, verbose_name="Fecha de Asignación"
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_user_roles",
        verbose_name="Asignado por",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Activo",
        help_text="Si el rol está activo para este usuario",
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de Expiración",
        help_text="Fecha opcional de expiración del rol",
    )

    class Meta:
        db_table = "authorization_user_roles"
        unique_together = ["user", "role"]
        verbose_name = "Rol de Usuario"
        verbose_name_plural = "Roles de Usuarios"
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["role", "is_active"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.role.name}"

    def clean(self):
        """Validar que no se asigne un rol inactivo."""
        if self.role and not self.role.is_active:
            raise ValidationError({"role": "No se puede asignar un rol inactivo"})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        """Verificar si el rol ha expirado."""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

    @property
    def is_valid(self):
        """Verificar si el rol es válido (activo y no expirado)."""
        return self.is_active and not self.is_expired
