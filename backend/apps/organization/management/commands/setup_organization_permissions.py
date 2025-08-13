"""
Management command to set up organization permissions in ZentraQMS.

This command creates the necessary permissions for organization management
if they don't exist and assigns them to appropriate roles.
"""

from django.core.management.base import BaseCommand
from apps.authorization.models import Permission, Role


class Command(BaseCommand):
    help = 'Set up organization permissions and assign them to roles'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up organization permissions...'))

        # Define organization permissions
        organization_permissions = [
            {
                'code': 'organization.create',
                'name': 'Crear Organizaciones',
                'description': 'Permite crear nuevas organizaciones en el sistema',
                'resource': 'organization',
                'action': 'create'
            },
            {
                'code': 'organization.read',
                'name': 'Ver Organizaciones', 
                'description': 'Permite ver información de organizaciones',
                'resource': 'organization',
                'action': 'read'
            },
            {
                'code': 'organization.update',
                'name': 'Actualizar Organizaciones',
                'description': 'Permite modificar información de organizaciones',
                'resource': 'organization', 
                'action': 'update'
            },
            {
                'code': 'organization.delete',
                'name': 'Eliminar Organizaciones',
                'description': 'Permite eliminar organizaciones del sistema',
                'resource': 'organization',
                'action': 'delete'
            },
            {
                'code': 'organization.list',
                'name': 'Listar Organizaciones',
                'description': 'Permite listar todas las organizaciones',
                'resource': 'organization',
                'action': 'list'
            },
        ]

        # Create permissions if they don't exist
        created_permissions = []
        for perm_data in organization_permissions:
            permission, created = Permission.objects.get_or_create(
                code=perm_data['code'],
                defaults={
                    'name': perm_data['name'],
                    'description': perm_data['description'],
                    'resource': perm_data['resource'],
                    'action': perm_data['action'],
                    'is_active': True
                }
            )
            
            if created:
                created_permissions.append(permission)
                self.stdout.write(
                    self.style.SUCCESS(f'Created permission: {permission.code} - {permission.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Permission already exists: {permission.code}')
                )

        # Assign permissions to roles
        role_permissions = {
            'Administrador del Sistema': [
                # Admin already has *.all so no need to add specific permissions
            ],
            'Coordinador de Calidad': [
                'organization.create', 
                'organization.read', 
                'organization.update', 
                'organization.list'
            ],
            'Jefe de Área': [
                'organization.read',
                'organization.list'
            ],
        }

        for role_name, permissions in role_permissions.items():
            try:
                role = Role.objects.get(name=role_name)
                
                for perm_code in permissions:
                    try:
                        permission = Permission.objects.get(code=perm_code)
                        role.permissions.add(permission)
                        self.stdout.write(
                            self.style.SUCCESS(f'Assigned {perm_code} to {role_name}')
                        )
                    except Permission.DoesNotExist:
                        self.stdout.write(
                            self.style.ERROR(f'Permission {perm_code} not found')
                        )
                        
            except Role.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Role {role_name} not found')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Organization permissions setup completed. '
                f'Created {len(created_permissions)} new permissions.'
            )
        )