"""
Comando de gestión para importar datos REPS desde archivos del portal MinSalud.

Uso:
    python manage.py import_reps_data --org-id <organization_id> --headquarters /path/to/sedes.xls --services /path/to/servicios.xls
"""

import os
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from apps.organization.models import HealthOrganization
from apps.sogcs.services.reps_sync import REPSSynchronizationService, REPSSyncError

User = get_user_model()


class Command(BaseCommand):
    help = 'Importa datos REPS desde archivos del portal MinSalud'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id',
            type=str,
            required=True,
            help='ID de la organización de salud'
        )
        
        parser.add_argument(
            '--headquarters',
            type=str,
            help='Ruta al archivo de sedes REPS (.xls)'
        )
        
        parser.add_argument(
            '--services',
            type=str,
            help='Ruta al archivo de servicios REPS (.xls)'
        )
        
        parser.add_argument(
            '--user-email',
            type=str,
            help='Email del usuario que ejecuta la importación (opcional)'
        )
        
        parser.add_argument(
            '--no-backup',
            action='store_true',
            help='No crear backup antes de la importación'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Ejecutar sin hacer cambios reales (solo validación)'
        )

    def handle(self, *args, **options):
        try:
            # Validar argumentos
            org_id = options['org_id']
            headquarters_file = options.get('headquarters')
            services_file = options.get('services')
            user_email = options.get('user_email')
            create_backup = not options.get('no_backup', False)
            dry_run = options.get('dry_run', False)
            
            if not headquarters_file and not services_file:
                raise CommandError("Debe especificar al menos un archivo (--headquarters o --services)")
            
            # Validar existencia de archivos
            if headquarters_file and not os.path.exists(headquarters_file):
                raise CommandError(f"Archivo de sedes no encontrado: {headquarters_file}")
            
            if services_file and not os.path.exists(services_file):
                raise CommandError(f"Archivo de servicios no encontrado: {services_file}")
            
            # Obtener organización
            try:
                organization = HealthOrganization.objects.get(id=org_id)
                self.stdout.write(f"Organización encontrada: {organization.organization.razon_social}")
            except HealthOrganization.DoesNotExist:
                raise CommandError(f"Organización con ID {org_id} no encontrada")
            
            # Obtener usuario
            user = None
            if user_email:
                try:
                    user = User.objects.get(email=user_email)
                    self.stdout.write(f"Usuario encontrado: {user.get_full_name()}")
                except User.DoesNotExist:
                    raise CommandError(f"Usuario con email {user_email} no encontrado")
            else:
                # Usar el primer superusuario disponible
                user = User.objects.filter(is_superuser=True).first()
                if not user:
                    raise CommandError("No se encontró un usuario válido. Especifique --user-email")
                self.stdout.write(f"Usando usuario por defecto: {user.get_full_name()}")
            
            if dry_run:
                self.stdout.write(
                    self.style.WARNING("MODO DRY-RUN: No se realizarán cambios reales")
                )
                # En modo dry-run, solo validamos los archivos
                self._validate_files(headquarters_file, services_file)
                return
            
            # Verificar si SOGCS está habilitado
            if not getattr(organization, 'sogcs_enabled', False):
                self.stdout.write(
                    self.style.WARNING("SOGCS no está habilitado para esta organización. Habilitando...")
                )
                organization.activate_sogcs(user)
                organization.save()
            
            # Inicializar servicio de sincronización
            sync_service = REPSSynchronizationService(organization, user)
            
            self.stdout.write("Iniciando importación REPS...")
            
            # Ejecutar sincronización
            stats = sync_service.synchronize_from_files(
                headquarters_file=headquarters_file,
                services_file=services_file,
                create_backup=create_backup
            )
            
            # Mostrar resultados
            self._display_results(stats, sync_service)
            
            # Verificar alertas
            self._check_alerts(organization)
            
            self.stdout.write(
                self.style.SUCCESS("Importación REPS completada exitosamente")
            )
            
        except REPSSyncError as e:
            raise CommandError(f"Error en sincronización REPS: {str(e)}")
        except Exception as e:
            raise CommandError(f"Error inesperado: {str(e)}")
    
    def _validate_files(self, headquarters_file, services_file):
        """Valida archivos en modo dry-run"""
        import pandas as pd
        
        self.stdout.write("Validando archivos REPS...")
        
        if headquarters_file:
            try:
                dfs = pd.read_html(headquarters_file, encoding='utf-8')
                if dfs:
                    df = dfs[0]
                    self.stdout.write(f"✓ Archivo de sedes válido: {len(df)} filas, {len(df.columns)} columnas")
                    self.stdout.write(f"  Columnas: {', '.join(df.columns.astype(str))}")
                else:
                    self.stdout.write(self.style.ERROR("✗ Archivo de sedes no contiene tablas válidas"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"✗ Error leyendo archivo de sedes: {str(e)}"))
        
        if services_file:
            try:
                dfs = pd.read_html(services_file, encoding='utf-8')
                if dfs:
                    df = dfs[0]
                    self.stdout.write(f"✓ Archivo de servicios válido: {len(df)} filas, {len(df.columns)} columnas")
                    self.stdout.write(f"  Columnas: {', '.join(df.columns.astype(str))}")
                else:
                    self.stdout.write(self.style.ERROR("✗ Archivo de servicios no contiene tablas válidas"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"✗ Error leyendo archivo de servicios: {str(e)}"))
    
    def _display_results(self, stats, sync_service):
        """Muestra resultados de la importación"""
        self.stdout.write("\n" + "="*50)
        self.stdout.write("RESULTADOS DE IMPORTACIÓN")
        self.stdout.write("="*50)
        
        self.stdout.write(f"Estado: {stats['status'].upper()}")
        
        if stats['start_time'] and stats['end_time']:
            duration = stats['end_time'] - stats['start_time']
            self.stdout.write(f"Duración: {duration.total_seconds():.2f} segundos")
        
        if stats.get('backup_created'):
            self.stdout.write(f"Backup creado: {stats.get('backup_id', 'N/A')}")
        
        self.stdout.write(f"\nArchivos procesados: {len(stats['files_processed'])}")
        for file_info in stats['files_processed']:
            self.stdout.write(f"  - {file_info['type']}: {file_info['file']}")
            file_stats = file_info['stats']
            if file_info['type'] == 'headquarters':
                self.stdout.write(f"    Sedes procesadas: {file_stats.get('headquarters_processed', 0)}")
                self.stdout.write(f"    Sedes creadas: {file_stats.get('headquarters_created', 0)}")
                self.stdout.write(f"    Sedes actualizadas: {file_stats.get('headquarters_updated', 0)}")
            elif file_info['type'] == 'services':
                self.stdout.write(f"    Servicios procesados: {file_stats.get('services_processed', 0)}")
                self.stdout.write(f"    Servicios creados: {file_stats.get('services_created', 0)}")
                self.stdout.write(f"    Servicios actualizados: {file_stats.get('services_updated', 0)}")
        
        self.stdout.write(f"\nTotales:")
        self.stdout.write(f"  Sedes: {stats['total_headquarters']}")
        self.stdout.write(f"  Servicios: {stats['total_services']}")
        
        if stats['errors']:
            self.stdout.write(f"\nErrores ({len(stats['errors'])}):")
            for error in stats['errors'][:10]:  # Mostrar solo primeros 10
                self.stdout.write(f"  - {error}")
        
        if stats['warnings']:
            self.stdout.write(f"\nAdvertencias ({len(stats['warnings'])}):")
            for warning in stats['warnings'][:10]:  # Mostrar solo primeras 10
                self.stdout.write(f"  - {warning}")
        
        # Mostrar resumen del servicio
        summary = sync_service.get_sync_summary()
        self.stdout.write(f"\n{summary}")
    
    def _check_alerts(self, organization):
        """Verifica alertas después de la importación"""
        try:
            from apps.sogcs.services.alerts import SOGCSAlertsService
            
            self.stdout.write("\nVerificando alertas SOGCS...")
            
            alerts_service = SOGCSAlertsService(organization)
            alerts = alerts_service.generate_all_alerts()
            
            if alerts:
                summary = alerts_service.get_alerts_summary()
                self.stdout.write(f"Se encontraron {len(alerts)} alertas:")
                for severity, count in summary.items():
                    if count > 0:
                        color = self.style.ERROR if severity == 'CRITICAL' else \
                               self.style.WARNING if severity == 'HIGH' else \
                               self.style.NOTICE
                        self.stdout.write(f"  {color(f'{severity}: {count}')}")
                
                # Mostrar alertas críticas
                critical_alerts = alerts_service.get_critical_alerts()
                if critical_alerts:
                    self.stdout.write(f"\nAlertas críticas:")
                    for alert in critical_alerts[:5]:  # Mostrar solo primeras 5
                        self.stdout.write(f"  - {alert.title}")
            else:
                self.stdout.write("✓ No se encontraron alertas")
                
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"No se pudieron verificar alertas: {str(e)}"))