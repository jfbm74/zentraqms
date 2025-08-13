"""
Comando para crear usuarios de prueba con diferentes roles RBAC.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from apps.authorization.models import Role, UserRole

User = get_user_model()


class Command(BaseCommand):
    help = 'Crear usuarios de prueba con diferentes roles RBAC'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Eliminar usuarios existentes antes de crear nuevos',
        )

    def handle(self, *args, **options):
        self.stdout.write('Iniciando creación de usuarios de prueba RBAC...')
        
        if options['reset']:
            self.stdout.write('🗑️ Eliminando usuarios de prueba existentes...')
            User.objects.filter(email__contains='@zentraqms.test').delete()
        
        with transaction.atomic():
            # Asignar rol super_admin al usuario admin existente
            admin_user = self.assign_admin_role()
            if admin_user:
                self.stdout.write(f'✅ Usuario admin configurado: {admin_user.email}')
            
            # Crear usuarios de prueba
            test_users = self.create_test_users()
            self.stdout.write(f'✅ Creados {len(test_users)} usuarios de prueba')
            
            # Asignar roles a usuarios de prueba
            self.assign_roles_to_test_users(test_users)
            self.stdout.write('✅ Roles asignados a usuarios de prueba')
            
        self.stdout.write(self.style.SUCCESS('✨ Usuarios de prueba RBAC creados exitosamente'))
        self.show_user_summary()

    def assign_admin_role(self):
        """Asignar rol super_admin al usuario admin existente."""
        try:
            # Buscar usuario admin
            admin_user = User.objects.get(email='admin@zentraqms.com')
            
            # Asignar rol super_admin
            admin_user.add_role('super_admin')
            self.stdout.write(f'  ✓ Rol super_admin asignado a: {admin_user.email}')
            return admin_user
            
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('⚠️ Usuario admin no encontrado'))
            return None
        except ValueError as e:
            self.stdout.write(self.style.ERROR(f'❌ Error asignando rol a admin: {e}'))
            return None

    def create_test_users(self):
        """Crear usuarios de prueba para cada rol."""
        test_users_data = [
            {
                'email': 'coordinador@zentraqms.test',
                'first_name': 'María',
                'last_name': 'Coordinadora',
                'department': 'Gestión de Calidad',
                'position': 'Coordinador de Calidad',
                'role_code': 'quality_coordinator'
            },
            {
                'email': 'auditor@zentraqms.test',
                'first_name': 'Carlos',
                'last_name': 'Auditor',
                'department': 'Auditoría Interna',
                'position': 'Auditor Interno',
                'role_code': 'internal_auditor'
            },
            {
                'email': 'jefe@zentraqms.test',
                'first_name': 'Ana',
                'last_name': 'Jefatura',
                'department': 'Producción',
                'position': 'Jefe de Área',
                'role_code': 'department_head'
            },
            {
                'email': 'responsable@zentraqms.test',
                'first_name': 'Luis',
                'last_name': 'Responsable',
                'department': 'Operaciones',
                'position': 'Responsable de Proceso',
                'role_code': 'process_owner'
            },
            {
                'email': 'operativo@zentraqms.test',
                'first_name': 'Sofía',
                'last_name': 'Operativa',
                'department': 'Producción',
                'position': 'Operario Senior',
                'role_code': 'operative_user'
            },
            {
                'email': 'consulta@zentraqms.test',
                'first_name': 'Pedro',
                'last_name': 'Consultor',
                'department': 'Sistemas',
                'position': 'Analista Junior',
                'role_code': 'read_only_user'
            }
        ]
        
        created_users = []
        for user_data in test_users_data:
            role_code = user_data.pop('role_code')
            
            try:
                # Crear o actualizar usuario
                user, created = User.objects.update_or_create(
                    email=user_data['email'],
                    defaults={
                        **user_data,
                        'is_active': True,
                        'is_verified': True
                    }
                )
                
                if created:
                    # Establecer contraseña por defecto
                    user.set_password('test123456')
                    user.save()
                    self.stdout.write(f'  + Usuario creado: {user.email}')
                else:
                    self.stdout.write(f'  ~ Usuario actualizado: {user.email}')
                
                # Guardar código de rol para asignación posterior
                user._role_code = role_code
                created_users.append(user)
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error creando usuario {user_data["email"]}: {e}')
                )
        
        return created_users

    def assign_roles_to_test_users(self, test_users):
        """Asignar roles a usuarios de prueba."""
        for user in test_users:
            if hasattr(user, '_role_code'):
                try:
                    user.add_role(user._role_code)
                    self.stdout.write(f'  ✓ Rol {user._role_code} asignado a: {user.email}')
                except ValueError as e:
                    self.stdout.write(
                        self.style.ERROR(f'❌ Error asignando rol {user._role_code} a {user.email}: {e}')
                    )

    def show_user_summary(self):
        """Mostrar resumen de usuarios creados."""
        self.stdout.write('\n' + '='*60)
        self.stdout.write('📋 RESUMEN DE USUARIOS RBAC')
        self.stdout.write('='*60)
        
        # Obtener todos los usuarios con roles
        users_with_roles = User.objects.filter(
            user_roles__is_active=True
        ).distinct().select_related().prefetch_related('user_roles__role')
        
        for user in users_with_roles:
            roles = [ur.role.name for ur in user.user_roles.filter(is_active=True)]
            self.stdout.write(
                f'👤 {user.get_full_name()} ({user.email})'
            )
            self.stdout.write(f'   🏢 {user.department} - {user.position}')
            self.stdout.write(f'   🔐 Roles: {", ".join(roles)}')
            self.stdout.write('')
        
        self.stdout.write('🔑 CREDENCIALES DE ACCESO:')
        self.stdout.write('   • admin@zentraqms.com / [contraseña existente]')
        self.stdout.write('   • *@zentraqms.test / test123456')
        self.stdout.write('')
        self.stdout.write('📡 ENDPOINTS DISPONIBLES:')
        self.stdout.write('   • GET /api/authorization/roles/ - Listar roles')
        self.stdout.write('   • GET /api/authorization/permissions/ - Listar permisos')  
        self.stdout.write('   • GET /api/authorization/user-permissions/my_permissions/ - Mis permisos')
        self.stdout.write('   • POST /api/authorization/user-permissions/check_permission/ - Verificar permiso')
        self.stdout.write('='*60)