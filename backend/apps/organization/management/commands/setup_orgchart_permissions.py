"""
Management command to setup organizational chart permissions.

This command creates all necessary permissions for the organizational chart
functionality and assigns them to appropriate roles.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.authorization.models import Permission, Role, RolePermission


class Command(BaseCommand):
    help = 'Setup organizational chart permissions and role assignments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-role-assignment',
            action='store_true',
            help='Skip automatic role assignment of permissions',
        )

    def handle(self, *args, **options):
        self.stdout.write('Setting up organizational chart permissions...')
        
        try:
            with transaction.atomic():
                permissions_created = self._create_permissions()
                self.stdout.write(
                    self.style.SUCCESS(f'Created {permissions_created} permissions')
                )
                
                if not options['skip_role_assignment']:
                    role_assignments = self._assign_permissions_to_roles()
                    self.stdout.write(
                        self.style.SUCCESS(f'Assigned permissions to {role_assignments} roles')
                    )
                
                self.stdout.write(
                    self.style.SUCCESS('Organizational chart permissions setup completed successfully!')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error setting up permissions: {str(e)}')
            )
            raise

    def _create_permissions(self):
        """Create all organizational chart permissions."""
        permissions_data = [
            # Organizational Chart permissions
            {
                'code': 'organization.read_orgchart',
                'name': 'Ver Organigramas',
                'description': 'Permite ver organigramas organizacionales',
                'module': 'organization',
                'category': 'orgchart'
            },
            {
                'code': 'organization.create_orgchart',
                'name': 'Crear Organigramas',
                'description': 'Permite crear nuevos organigramas organizacionales',
                'module': 'organization',
                'category': 'orgchart'
            },
            {
                'code': 'organization.update_orgchart',
                'name': 'Actualizar Organigramas',
                'description': 'Permite actualizar organigramas existentes',
                'module': 'organization',
                'category': 'orgchart'
            },
            {
                'code': 'organization.delete_orgchart',
                'name': 'Eliminar Organigramas',
                'description': 'Permite eliminar organigramas organizacionales',
                'module': 'organization',
                'category': 'orgchart'
            },
            {
                'code': 'organization.approve_orgchart',
                'name': 'Aprobar Organigramas',
                'description': 'Permite aprobar organigramas organizacionales',
                'module': 'organization',
                'category': 'orgchart'
            },
            {
                'code': 'organization.validate_orgchart',
                'name': 'Validar Organigramas',
                'description': 'Permite ejecutar validaciones de cumplimiento en organigramas',
                'module': 'organization',
                'category': 'orgchart'
            },
            
            # Template permissions
            {
                'code': 'organization.manage_templates',
                'name': 'Gestionar Plantillas',
                'description': 'Permite crear, modificar y eliminar plantillas de organigramas',
                'module': 'organization',
                'category': 'templates'
            },
            {
                'code': 'organization.apply_templates',
                'name': 'Aplicar Plantillas',
                'description': 'Permite aplicar plantillas para crear organigramas',
                'module': 'organization',
                'category': 'templates'
            },
            
            # Sector permissions
            {
                'code': 'organization.manage_sectors',
                'name': 'Gestionar Sectores',
                'description': 'Permite gestionar sectores y sus requisitos normativos',
                'module': 'organization',
                'category': 'sectors'
            },
            
            # Area and position permissions
            {
                'code': 'organization.manage_areas',
                'name': 'Gestionar Áreas',
                'description': 'Permite crear, modificar y eliminar áreas organizacionales',
                'module': 'organization',
                'category': 'structure'
            },
            {
                'code': 'organization.manage_positions',
                'name': 'Gestionar Cargos',
                'description': 'Permite crear, modificar y eliminar cargos organizacionales',
                'module': 'organization',
                'category': 'structure'
            },
            
            # Bulk operations permissions
            {
                'code': 'organization.bulk_operations',
                'name': 'Operaciones Masivas',
                'description': 'Permite ejecutar operaciones masivas en organigramas',
                'module': 'organization',
                'category': 'bulk'
            },
            
            # Validation permissions
            {
                'code': 'organization.realtime_validation',
                'name': 'Validación en Tiempo Real',
                'description': 'Permite acceder a endpoints de validación en tiempo real',
                'module': 'organization',
                'category': 'validation'
            }
        ]
        
        created_count = 0
        for perm_data in permissions_data:
            permission, created = Permission.objects.get_or_create(
                code=perm_data['code'],
                defaults={
                    'name': perm_data['name'],
                    'description': perm_data['description'],
                    'module': perm_data['module'],
                    'category': perm_data.get('category', 'general')
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f'  Created permission: {perm_data["code"]}')
            else:
                self.stdout.write(f'  Permission already exists: {perm_data["code"]}')
        
        return created_count

    def _assign_permissions_to_roles(self):
        """Assign permissions to appropriate roles."""
        
        # Permission assignments by role
        role_permissions = {
            'super_admin': [
                'organization.read_orgchart',
                'organization.create_orgchart',
                'organization.update_orgchart',
                'organization.delete_orgchart',
                'organization.approve_orgchart',
                'organization.validate_orgchart',
                'organization.manage_templates',
                'organization.apply_templates',
                'organization.manage_sectors',
                'organization.manage_areas',
                'organization.manage_positions',
                'organization.bulk_operations',
                'organization.realtime_validation'
            ],
            'admin': [
                'organization.read_orgchart',
                'organization.create_orgchart',
                'organization.update_orgchart',
                'organization.delete_orgchart',
                'organization.approve_orgchart',
                'organization.validate_orgchart',
                'organization.manage_templates',
                'organization.apply_templates',
                'organization.manage_areas',
                'organization.manage_positions',
                'organization.bulk_operations',
                'organization.realtime_validation'
            ],
            'manager': [
                'organization.read_orgchart',
                'organization.create_orgchart',
                'organization.update_orgchart',
                'organization.validate_orgchart',
                'organization.apply_templates',
                'organization.manage_areas',
                'organization.manage_positions',
                'organization.realtime_validation'
            ],
            'coordinator': [
                'organization.read_orgchart',
                'organization.create_orgchart',
                'organization.update_orgchart',
                'organization.apply_templates',
                'organization.manage_areas',
                'organization.manage_positions',
                'organization.realtime_validation'
            ],
            'analyst': [
                'organization.read_orgchart',
                'organization.validate_orgchart',
                'organization.realtime_validation'
            ],
            'viewer': [
                'organization.read_orgchart'
            ]
        }
        
        roles_assigned = 0
        
        for role_code, permission_codes in role_permissions.items():
            try:
                role = Role.objects.get(code=role_code, is_active=True)
                
                for permission_code in permission_codes:
                    try:
                        permission = Permission.objects.get(code=permission_code, is_active=True)
                        
                        role_permission, created = RolePermission.objects.get_or_create(
                            role=role,
                            permission=permission,
                            defaults={
                                'granted_by': None,  # System assignment
                                'is_active': True
                            }
                        )
                        
                        if created:
                            self.stdout.write(
                                f'  Assigned {permission_code} to {role_code}'
                            )
                    
                    except Permission.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                f'Permission {permission_code} not found for role {role_code}'
                            )
                        )
                
                roles_assigned += 1
                
            except Role.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'Role {role_code} not found')
                )
        
        return roles_assigned

    def _display_permission_summary(self):
        """Display a summary of all organizational chart permissions."""
        self.stdout.write('\n--- Organizational Chart Permissions Summary ---')
        
        permissions = Permission.objects.filter(
            code__startswith='organization.',
            code__contains='orgchart'
        ).order_by('category', 'code')
        
        current_category = None
        for perm in permissions:
            if current_category != perm.category:
                current_category = perm.category
                self.stdout.write(f'\n{current_category.upper()}:')
            
            self.stdout.write(f'  {perm.code} - {perm.name}')
        
        self.stdout.write('')