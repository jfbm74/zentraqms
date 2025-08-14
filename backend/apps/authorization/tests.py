"""
Tests para el sistema RBAC.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta

from .models import Permission, Role, RolePermission, UserRole
from .permissions import PermissionChecker

User = get_user_model()


class PermissionModelTests(TestCase):
    """
    Tests para el modelo Permission.
    """

    def test_permission_creation(self):
        """Test crear permiso básico."""
        permission = Permission.objects.create(
            name="Crear Usuarios",
            code="users.create",
            description="Permite crear nuevos usuarios",
        )

        self.assertEqual(permission.resource, "users")
        self.assertEqual(permission.action, "create")
        self.assertTrue(permission.is_active)
        self.assertEqual(str(permission), "Crear Usuarios (users.create)")

    def test_permission_code_validation(self):
        """Test validación del formato del código."""
        # Código válido
        permission = Permission(name="Test", code="users.create")
        permission.clean()  # No debe lanzar excepción

        # Código inválido (sin punto)
        permission = Permission(name="Test", code="invalid")
        with self.assertRaises(ValidationError):
            permission.clean()

        # Super admin es válido
        permission = Permission(name="Super Admin", code="*.all")
        permission.clean()  # No debe lanzar excepción

    def test_permission_auto_sync_resource_action(self):
        """Test que resource y action se sincronizan con el code."""
        permission = Permission.objects.create(name="Test", code="documents.approve")

        self.assertEqual(permission.resource, "documents")
        self.assertEqual(permission.action, "approve")


class RoleModelTests(TestCase):
    """
    Tests para el modelo Role.
    """

    def setUp(self):
        self.permission1 = Permission.objects.create(
            name="Ver Usuarios", code="users.read"
        )
        self.permission2 = Permission.objects.create(
            name="Crear Usuarios", code="users.create"
        )
        self.super_permission = Permission.objects.create(
            name="Super Admin", code="*.all"
        )

    def test_role_creation(self):
        """Test crear rol básico."""
        role = Role.objects.create(
            name="Administrador", code="admin", description="Rol de administrador"
        )

        self.assertEqual(str(role), "Administrador (admin)")
        self.assertFalse(role.is_system)
        self.assertTrue(role.is_active)

    def test_role_system_protection(self):
        """Test que no se pueden eliminar roles del sistema."""
        role = Role.objects.create(
            name="Super Admin", code="super_admin", is_system=True
        )

        with self.assertRaises(ValidationError):
            role.delete()

    def test_role_has_permission(self):
        """Test verificación de permisos en rol."""
        role = Role.objects.create(name="Test Role", code="test_role")

        # Asignar permiso
        RolePermission.objects.create(role=role, permission=self.permission1)

        self.assertTrue(role.has_permission("users.read"))
        self.assertFalse(role.has_permission("users.create"))

    def test_role_super_admin_permission(self):
        """Test que el permiso *.all funciona como super admin."""
        role = Role.objects.create(name="Super Admin", code="super_admin")

        RolePermission.objects.create(role=role, permission=self.super_permission)

        self.assertTrue(role.has_permission("users.create"))
        self.assertTrue(role.has_permission("documents.delete"))
        self.assertTrue(role.has_permission("any.thing"))

    def test_role_wildcard_permission(self):
        """Test permisos wildcard por recurso."""
        wildcard_perm = Permission.objects.create(
            name="Todos los usuarios", code="users.*"
        )

        role = Role.objects.create(name="User Manager", code="user_manager")

        RolePermission.objects.create(role=role, permission=wildcard_perm)

        self.assertTrue(role.has_permission("users.create"))
        self.assertTrue(role.has_permission("users.delete"))
        self.assertFalse(role.has_permission("documents.read"))


class UserRoleModelTests(TestCase):
    """
    Tests para el modelo UserRole.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", first_name="Test", last_name="User"
        )
        self.role = Role.objects.create(name="Test Role", code="test_role")
        self.inactive_role = Role.objects.create(
            name="Inactive Role", code="inactive_role", is_active=False
        )

    def test_user_role_creation(self):
        """Test asignación básica de rol a usuario."""
        user_role = UserRole.objects.create(user=self.user, role=self.role)

        self.assertTrue(user_role.is_active)
        self.assertIsNone(user_role.expires_at)
        self.assertTrue(user_role.is_valid)
        self.assertFalse(user_role.is_expired)

    def test_user_role_expiration(self):
        """Test expiración de roles."""
        past_date = timezone.now() - timedelta(days=1)
        future_date = timezone.now() + timedelta(days=1)

        # Crear segundo rol para evitar unique constraint
        role2 = Role.objects.create(name="Test Role 2", code="test_role_2")

        # Rol expirado
        expired_role = UserRole.objects.create(
            user=self.user, role=self.role, expires_at=past_date
        )

        self.assertTrue(expired_role.is_expired)
        self.assertFalse(expired_role.is_valid)

        # Rol vigente
        valid_role = UserRole.objects.create(
            user=self.user, role=role2, expires_at=future_date
        )

        self.assertFalse(valid_role.is_expired)
        self.assertTrue(valid_role.is_valid)

    def test_inactive_role_validation(self):
        """Test que no se pueden asignar roles inactivos."""
        user_role = UserRole(user=self.user, role=self.inactive_role)

        with self.assertRaises(ValidationError):
            user_role.clean()


class UserRBACIntegrationTests(TestCase):
    """
    Tests para la integración RBAC con el modelo User.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", first_name="Test", last_name="User"
        )

        # Crear permisos
        self.read_perm = Permission.objects.create(
            name="Ver Usuarios", code="users.read"
        )
        self.create_perm = Permission.objects.create(
            name="Crear Usuarios", code="users.create"
        )

        # Crear rol
        self.role = Role.objects.create(name="User Viewer", code="user_viewer")

        RolePermission.objects.create(role=self.role, permission=self.read_perm)

    def test_user_roles_property(self):
        """Test property roles del usuario."""
        # Sin roles
        self.assertEqual(self.user.roles.count(), 0)

        # Asignar rol
        UserRole.objects.create(user=self.user, role=self.role)

        self.assertEqual(self.user.roles.count(), 1)
        self.assertEqual(self.user.roles.first().role, self.role)

    def test_user_has_permission(self):
        """Test verificación de permisos del usuario."""
        # Sin roles
        self.assertFalse(self.user.has_permission("users.read"))

        # Con rol
        UserRole.objects.create(user=self.user, role=self.role)

        self.assertTrue(self.user.has_permission("users.read"))
        self.assertFalse(self.user.has_permission("users.create"))

    def test_superuser_permissions(self):
        """Test que superusuarios tienen todos los permisos."""
        self.user.is_superuser = True
        self.user.save()

        self.assertTrue(self.user.has_permission("users.create"))
        self.assertTrue(self.user.has_permission("any.permission"))

        permissions = self.user.get_all_permissions()
        self.assertIn("*.all", permissions)

    def test_user_add_role(self):
        """Test agregar rol a usuario."""
        user_role = self.user.add_role("user_viewer")

        self.assertEqual(user_role.user, self.user)
        self.assertEqual(user_role.role, self.role)
        self.assertTrue(user_role.is_active)

    def test_user_add_invalid_role(self):
        """Test agregar rol inválido."""
        with self.assertRaises(ValueError):
            self.user.add_role("nonexistent_role")

    def test_user_remove_role(self):
        """Test remover rol de usuario."""
        UserRole.objects.create(user=self.user, role=self.role)

        self.assertTrue(self.user.has_permission("users.read"))

        self.user.remove_role("user_viewer")

        # El rol debe estar inactivo, no eliminado
        user_role = UserRole.objects.get(user=self.user, role=self.role)
        self.assertFalse(user_role.is_active)

        # Y el usuario no debe tener el permiso
        self.assertFalse(self.user.has_permission("users.read"))


class PermissionCheckerTests(TestCase):
    """
    Tests para la clase PermissionChecker.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", first_name="Test", last_name="User"
        )

        self.permission = Permission.objects.create(
            name="Ver Documentos", code="documents.read"
        )

        self.role = Role.objects.create(name="Document Reader", code="doc_reader")

        RolePermission.objects.create(role=self.role, permission=self.permission)

        UserRole.objects.create(user=self.user, role=self.role)

    def test_user_has_permission(self):
        """Test verificación básica de permisos."""
        self.assertTrue(
            PermissionChecker.user_has_permission(self.user, "documents.read")
        )
        self.assertFalse(
            PermissionChecker.user_has_permission(self.user, "documents.create")
        )

    def test_unauthenticated_user(self):
        """Test usuario no autenticado."""
        self.assertFalse(PermissionChecker.user_has_permission(None, "documents.read"))

    def test_get_user_permissions(self):
        """Test obtener todos los permisos del usuario."""
        permissions = PermissionChecker.get_user_permissions(self.user)
        self.assertIn("documents.read", permissions)
        self.assertEqual(len(permissions), 1)

    def test_user_has_any_permission(self):
        """Test verificar múltiples permisos (OR)."""
        self.assertTrue(
            PermissionChecker.user_has_any_permission(
                self.user, ["documents.read", "users.create"]
            )
        )
        self.assertFalse(
            PermissionChecker.user_has_any_permission(
                self.user, ["documents.create", "users.create"]
            )
        )

    def test_user_has_all_permissions(self):
        """Test verificar múltiples permisos (AND)."""
        self.assertFalse(
            PermissionChecker.user_has_all_permissions(
                self.user, ["documents.read", "users.create"]
            )
        )
        self.assertTrue(
            PermissionChecker.user_has_all_permissions(self.user, ["documents.read"])
        )

    def test_get_users_with_permission(self):
        """Test obtener usuarios con un permiso específico."""
        users = PermissionChecker.get_users_with_permission("documents.read")
        self.assertIn(self.user, users)

        users = PermissionChecker.get_users_with_permission("nonexistent.permission")
        self.assertEqual(len(users), 0)


class RBACManagementCommandTests(TestCase):
    """
    Tests para el comando de population de RBAC.
    """

    def test_populate_rbac_command(self):
        """Test que el comando populate_rbac funciona correctamente."""
        from django.core.management import call_command

        # Ejecutar comando
        call_command("populate_rbac")

        # Verificar que se crearon permisos
        self.assertTrue(Permission.objects.filter(code="*.all").exists())
        self.assertTrue(Permission.objects.filter(code="users.create").exists())

        # Verificar que se crearon roles
        self.assertTrue(Role.objects.filter(code="super_admin").exists())
        self.assertTrue(Role.objects.filter(code="quality_coordinator").exists())

        # Verificar que los roles tienen permisos asignados
        super_admin = Role.objects.get(code="super_admin")
        self.assertTrue(super_admin.has_permission("users.create"))
        self.assertTrue(super_admin.has_permission("*.all"))

        quality_coord = Role.objects.get(code="quality_coordinator")
        self.assertTrue(quality_coord.has_permission("reports.create"))
        self.assertFalse(quality_coord.has_permission("*.all"))
