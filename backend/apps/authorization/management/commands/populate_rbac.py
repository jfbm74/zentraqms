"""
Comando para poblar datos iniciales del sistema RBAC.
Crea roles predefinidos y permisos base.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from apps.authorization.models import Permission, Role, RolePermission

User = get_user_model()


class Command(BaseCommand):
    help = "Poblar datos iniciales del sistema RBAC"

    def handle(self, *args, **options):
        self.stdout.write("Iniciando población de datos RBAC...")

        with transaction.atomic():
            # Crear permisos
            permissions = self.create_permissions()
            self.stdout.write(f"✓ Creados {len(permissions)} permisos")

            # Crear roles
            roles = self.create_roles()
            self.stdout.write(f"✓ Creados {len(roles)} roles")

            # Asignar permisos a roles
            self.assign_permissions_to_roles(permissions, roles)
            self.stdout.write("✓ Permisos asignados a roles")

        self.stdout.write(self.style.SUCCESS("✅ Datos RBAC poblados exitosamente"))

    def create_permissions(self):
        """Crear permisos base del sistema."""
        permissions_data = [
            # Super Admin
            {
                "name": "Acceso Total",
                "code": "*.all",
                "resource": "*",
                "action": "all",
                "description": "Acceso completo a todo el sistema",
            },
            # Usuarios
            {
                "name": "Crear Usuarios",
                "code": "users.create",
                "resource": "users",
                "action": "create",
                "description": "Permite crear nuevos usuarios",
            },
            {
                "name": "Ver Usuarios",
                "code": "users.read",
                "resource": "users",
                "action": "read",
                "description": "Permite ver información de usuarios",
            },
            {
                "name": "Actualizar Usuarios",
                "code": "users.update",
                "resource": "users",
                "action": "update",
                "description": "Permite actualizar información de usuarios",
            },
            {
                "name": "Eliminar Usuarios",
                "code": "users.delete",
                "resource": "users",
                "action": "delete",
                "description": "Permite eliminar usuarios",
            },
            {
                "name": "Listar Usuarios",
                "code": "users.list",
                "resource": "users",
                "action": "list",
                "description": "Permite listar todos los usuarios",
            },
            {
                "name": "Desactivar Usuarios",
                "code": "users.deactivate",
                "resource": "users",
                "action": "deactivate",
                "description": "Permite desactivar usuarios",
            },
            # Roles
            {
                "name": "Crear Roles",
                "code": "roles.create",
                "resource": "roles",
                "action": "create",
                "description": "Permite crear nuevos roles",
            },
            {
                "name": "Ver Roles",
                "code": "roles.read",
                "resource": "roles",
                "action": "read",
                "description": "Permite ver información de roles",
            },
            {
                "name": "Actualizar Roles",
                "code": "roles.update",
                "resource": "roles",
                "action": "update",
                "description": "Permite actualizar información de roles",
            },
            {
                "name": "Eliminar Roles",
                "code": "roles.delete",
                "resource": "roles",
                "action": "delete",
                "description": "Permite eliminar roles",
            },
            {
                "name": "Listar Roles",
                "code": "roles.list",
                "resource": "roles",
                "action": "list",
                "description": "Permite listar todos los roles",
            },
            {
                "name": "Asignar Roles",
                "code": "roles.assign",
                "resource": "roles",
                "action": "assign",
                "description": "Permite asignar roles a usuarios",
            },
            # Reportes
            {
                "name": "Crear Reportes",
                "code": "reports.create",
                "resource": "reports",
                "action": "create",
                "description": "Permite crear nuevos reportes",
            },
            {
                "name": "Ver Reportes",
                "code": "reports.read",
                "resource": "reports",
                "action": "read",
                "description": "Permite ver reportes",
            },
            {
                "name": "Actualizar Reportes",
                "code": "reports.update",
                "resource": "reports",
                "action": "update",
                "description": "Permite actualizar reportes",
            },
            {
                "name": "Eliminar Reportes",
                "code": "reports.delete",
                "resource": "reports",
                "action": "delete",
                "description": "Permite eliminar reportes",
            },
            {
                "name": "Listar Reportes",
                "code": "reports.list",
                "resource": "reports",
                "action": "list",
                "description": "Permite listar todos los reportes",
            },
            {
                "name": "Exportar Reportes",
                "code": "reports.export",
                "resource": "reports",
                "action": "export",
                "description": "Permite exportar reportes",
            },
            {
                "name": "Aprobar Reportes",
                "code": "reports.approve",
                "resource": "reports",
                "action": "approve",
                "description": "Permite aprobar reportes",
            },
            # Auditorías
            {
                "name": "Crear Auditorías",
                "code": "audits.create",
                "resource": "audits",
                "action": "create",
                "description": "Permite crear nuevas auditorías",
            },
            {
                "name": "Ver Auditorías",
                "code": "audits.read",
                "resource": "audits",
                "action": "read",
                "description": "Permite ver auditorías",
            },
            {
                "name": "Actualizar Auditorías",
                "code": "audits.update",
                "resource": "audits",
                "action": "update",
                "description": "Permite actualizar auditorías",
            },
            {
                "name": "Eliminar Auditorías",
                "code": "audits.delete",
                "resource": "audits",
                "action": "delete",
                "description": "Permite eliminar auditorías",
            },
            {
                "name": "Listar Auditorías",
                "code": "audits.list",
                "resource": "audits",
                "action": "list",
                "description": "Permite listar todas las auditorías",
            },
            {
                "name": "Programar Auditorías",
                "code": "audits.schedule",
                "resource": "audits",
                "action": "schedule",
                "description": "Permite programar auditorías",
            },
            {
                "name": "Ejecutar Auditorías",
                "code": "audits.execute",
                "resource": "audits",
                "action": "execute",
                "description": "Permite ejecutar auditorías",
            },
            # Documentos
            {
                "name": "Crear Documentos",
                "code": "documents.create",
                "resource": "documents",
                "action": "create",
                "description": "Permite crear nuevos documentos",
            },
            {
                "name": "Ver Documentos",
                "code": "documents.read",
                "resource": "documents",
                "action": "read",
                "description": "Permite ver documentos",
            },
            {
                "name": "Actualizar Documentos",
                "code": "documents.update",
                "resource": "documents",
                "action": "update",
                "description": "Permite actualizar documentos",
            },
            {
                "name": "Eliminar Documentos",
                "code": "documents.delete",
                "resource": "documents",
                "action": "delete",
                "description": "Permite eliminar documentos",
            },
            {
                "name": "Listar Documentos",
                "code": "documents.list",
                "resource": "documents",
                "action": "list",
                "description": "Permite listar todos los documentos",
            },
            {
                "name": "Aprobar Documentos",
                "code": "documents.approve",
                "resource": "documents",
                "action": "approve",
                "description": "Permite aprobar documentos",
            },
            {
                "name": "Versionar Documentos",
                "code": "documents.version",
                "resource": "documents",
                "action": "version",
                "description": "Permite crear versiones de documentos",
            },
            # Procesos
            {
                "name": "Crear Procesos",
                "code": "processes.create",
                "resource": "processes",
                "action": "create",
                "description": "Permite crear nuevos procesos",
            },
            {
                "name": "Ver Procesos",
                "code": "processes.read",
                "resource": "processes",
                "action": "read",
                "description": "Permite ver procesos",
            },
            {
                "name": "Actualizar Procesos",
                "code": "processes.update",
                "resource": "processes",
                "action": "update",
                "description": "Permite actualizar procesos",
            },
            {
                "name": "Eliminar Procesos",
                "code": "processes.delete",
                "resource": "processes",
                "action": "delete",
                "description": "Permite eliminar procesos",
            },
            {
                "name": "Listar Procesos",
                "code": "processes.list",
                "resource": "processes",
                "action": "list",
                "description": "Permite listar todos los procesos",
            },
            {
                "name": "Aprobar Procesos",
                "code": "processes.approve",
                "resource": "processes",
                "action": "approve",
                "description": "Permite aprobar procesos",
            },
            # Dashboard
            {
                "name": "Ver Dashboard",
                "code": "dashboard.view",
                "resource": "dashboard",
                "action": "view",
                "description": "Permite ver el dashboard",
            },
            {
                "name": "Exportar Dashboard",
                "code": "dashboard.export",
                "resource": "dashboard",
                "action": "export",
                "description": "Permite exportar datos del dashboard",
            },
        ]

        permissions = {}
        for perm_data in permissions_data:
            permission, created = Permission.objects.update_or_create(
                code=perm_data["code"], defaults=perm_data
            )
            permissions[permission.code] = permission
            if created:
                self.stdout.write(f"  + Permiso creado: {permission.code}")

        return permissions

    def create_roles(self):
        """Crear roles predefinidos del sistema."""
        roles_data = [
            {
                "code": "super_admin",
                "name": "Administrador del Sistema",
                "description": "Acceso completo a todas las funcionalidades del sistema",
                "is_system": True,
            },
            {
                "code": "quality_coordinator",
                "name": "Coordinador de Calidad",
                "description": "Gestiona el sistema de calidad, auditorías y mejora continua",
                "is_system": True,
            },
            {
                "code": "internal_auditor",
                "name": "Auditor Interno",
                "description": "Realiza auditorías internas y gestiona hallazgos",
                "is_system": True,
            },
            {
                "code": "department_head",
                "name": "Jefe de Área",
                "description": "Gestiona procesos y documentos de su área",
                "is_system": True,
            },
            {
                "code": "process_owner",
                "name": "Responsable de Proceso",
                "description": "Gestiona y actualiza procesos específicos",
                "is_system": True,
            },
            {
                "code": "operative_user",
                "name": "Usuario Operativo",
                "description": "Acceso básico para consulta y operaciones rutinarias",
                "is_system": True,
            },
            {
                "code": "read_only_user",
                "name": "Usuario de Consulta",
                "description": "Solo puede visualizar información, sin capacidad de modificación",
                "is_system": True,
            },
        ]

        roles = {}
        for role_data in roles_data:
            role, created = Role.objects.update_or_create(
                code=role_data["code"], defaults=role_data
            )
            roles[role.code] = role
            if created:
                self.stdout.write(f"  + Rol creado: {role.code}")

        return roles

    def assign_permissions_to_roles(self, permissions, roles):
        """Asignar permisos a los roles predefinidos."""
        role_permissions = {
            "super_admin": ["*.all"],
            "quality_coordinator": [
                "users.read",
                "users.list",
                "users.update",
                "roles.read",
                "roles.list",
                "roles.assign",
                "reports.*",
                "audits.*",
                "documents.*",
                "processes.*",
                "dashboard.view",
                "dashboard.export",
            ],
            "internal_auditor": [
                "audits.*",
                "reports.create",
                "reports.read",
                "reports.list",
                "reports.update",
                "documents.read",
                "documents.list",
                "processes.read",
                "processes.list",
                "dashboard.view",
            ],
            "department_head": [
                "users.read",
                "users.list",
                "reports.create",
                "reports.read",
                "reports.list",
                "reports.update",
                "reports.export",
                "documents.create",
                "documents.read",
                "documents.list",
                "documents.update",
                "documents.approve",
                "processes.read",
                "processes.list",
                "processes.update",
                "dashboard.view",
                "dashboard.export",
            ],
            "process_owner": [
                "processes.read",
                "processes.list",
                "processes.update",
                "documents.create",
                "documents.read",
                "documents.list",
                "documents.update",
                "reports.create",
                "reports.read",
                "reports.list",
                "dashboard.view",
            ],
            "operative_user": [
                "reports.create",
                "reports.read",
                "reports.list",
                "documents.read",
                "documents.list",
                "processes.read",
                "processes.list",
                "dashboard.view",
            ],
            "read_only_user": [
                "users.read",
                "users.list",
                "reports.read",
                "reports.list",
                "documents.read",
                "documents.list",
                "processes.read",
                "processes.list",
                "audits.read",
                "audits.list",
                "dashboard.view",
            ],
        }

        for role_code, permission_codes in role_permissions.items():
            role = roles.get(role_code)
            if not role:
                continue

            # Limpiar permisos existentes
            RolePermission.objects.filter(role=role).delete()

            # Asignar nuevos permisos
            for perm_code in permission_codes:
                if perm_code.endswith(".*"):
                    # Wildcard: asignar todos los permisos del recurso
                    resource = perm_code.replace(".*", "")
                    resource_permissions = [
                        p
                        for code, p in permissions.items()
                        if code.startswith(f"{resource}.")
                    ]
                    for permission in resource_permissions:
                        RolePermission.objects.create(role=role, permission=permission)
                else:
                    # Permiso específico
                    permission = permissions.get(perm_code)
                    if permission:
                        RolePermission.objects.create(role=role, permission=permission)

            self.stdout.write(f"  ✓ Permisos asignados a: {role.name}")
