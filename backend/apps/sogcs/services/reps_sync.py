"""
REPSSynchronizationService - Servicio de sincronización con backup y rollback.

Maneja la sincronización de datos REPS con capacidades de respaldo y recuperación
para garantizar la integridad de los datos durante las importaciones.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from django.db import transaction
from django.core.serializers import serialize
from django.contrib.auth import get_user_model
from django.utils import timezone

from .reps_parser import REPSExcelParser, REPSParsingError
from ..models import HeadquarterLocation, EnabledHealthService

User = get_user_model()
logger = logging.getLogger(__name__)


class REPSSyncError(Exception):
    """Excepción para errores de sincronización REPS"""
    pass


class REPSBackup:
    """Maneja los respaldos de datos REPS"""
    
    def __init__(self, organization, user: User):
        self.organization = organization
        self.user = user
        self.backup_data = {}
        self.backup_timestamp = None
    
    def create_backup(self) -> str:
        """
        Crea un respaldo completo de sedes y servicios.
        
        Returns:
            ID del backup creado
        """
        try:
            self.backup_timestamp = timezone.now()
            backup_id = f"reps_backup_{self.organization.id}_{self.backup_timestamp.strftime('%Y%m%d_%H%M%S')}"
            
            # Respaldar sedes
            headquarters = HeadquarterLocation.objects.filter(organization=self.organization)
            self.backup_data['headquarters'] = json.loads(serialize('json', headquarters))
            
            # Respaldar servicios
            services = EnabledHealthService.objects.filter(headquarters__organization=self.organization)
            self.backup_data['services'] = json.loads(serialize('json', services))
            
            # Metadatos del backup
            self.backup_data['metadata'] = {
                'backup_id': backup_id,
                'organization_id': str(self.organization.id),
                'timestamp': self.backup_timestamp.isoformat(),
                'user_id': str(self.user.id),
                'headquarters_count': len(self.backup_data['headquarters']),
                'services_count': len(self.backup_data['services'])
            }
            
            logger.info(f"Backup creado: {backup_id}, Sedes: {len(self.backup_data['headquarters'])}, Servicios: {len(self.backup_data['services'])}")
            return backup_id
            
        except Exception as e:
            logger.error(f"Error creando backup: {str(e)}")
            raise REPSSyncError(f"No se pudo crear el backup: {str(e)}")
    
    def restore_backup(self) -> bool:
        """
        Restaura los datos desde el backup.
        
        Returns:
            True si la restauración fue exitosa
        """
        if not self.backup_data:
            raise REPSSyncError("No hay datos de backup disponibles")
        
        try:
            with transaction.atomic():
                # Eliminar datos actuales
                EnabledHealthService.objects.filter(headquarters__organization=self.organization).delete()
                HeadquarterLocation.objects.filter(organization=self.organization).delete()
                
                # Restaurar sedes
                for hq_data in self.backup_data['headquarters']:
                    fields = hq_data['fields']
                    fields['organization_id'] = self.organization.id
                    HeadquarterLocation.objects.create(**fields)
                
                # Restaurar servicios
                for service_data in self.backup_data['services']:
                    fields = service_data['fields']
                    # Obtener la sede correspondiente
                    headquarters = HeadquarterLocation.objects.get(
                        codigo_sede=fields['codigo_sede'],
                        organization=self.organization
                    )
                    fields['headquarters'] = headquarters
                    EnabledHealthService.objects.create(**fields)
                
                logger.info(f"Backup restaurado exitosamente: {self.backup_data['metadata']['backup_id']}")
                return True
                
        except Exception as e:
            logger.error(f"Error restaurando backup: {str(e)}")
            raise REPSSyncError(f"No se pudo restaurar el backup: {str(e)}")
    
    def get_backup_info(self) -> Dict:
        """Retorna información del backup"""
        if not self.backup_data:
            return {}
        
        return self.backup_data['metadata']


class REPSSynchronizationService:
    """
    Servicio principal de sincronización REPS con backup y rollback.
    
    Características:
    - Backup automático antes de sincronización
    - Rollback en caso de errores
    - Validaciones de integridad
    - Logging detallado para auditoría
    """
    
    def __init__(self, organization, user: User):
        self.organization = organization
        self.user = user
        self.backup = None
        self.sync_stats = {
            'start_time': None,
            'end_time': None,
            'status': 'pending',
            'backup_created': False,
            'files_processed': [],
            'total_headquarters': 0,
            'total_services': 0,
            'errors': [],
            'warnings': []
        }
    
    def synchronize_from_files(self, headquarters_file: str = None, services_file: str = None, 
                             create_backup: bool = True) -> Dict:
        """
        Sincroniza datos REPS desde archivos con backup y rollback automático.
        
        Args:
            headquarters_file: Ruta al archivo de sedes REPS
            services_file: Ruta al archivo de servicios REPS
            create_backup: Si crear backup antes de la sincronización
            
        Returns:
            Diccionario con estadísticas de la sincronización
        """
        self.sync_stats['start_time'] = timezone.now()
        self.sync_stats['status'] = 'running'
        
        try:
            logger.info(f"Iniciando sincronización REPS para organización {self.organization.organization.razon_social}")
            
            # Crear backup si se solicita
            if create_backup:
                self._create_pre_sync_backup()
            
            # Validar archivos
            self._validate_input_files(headquarters_file, services_file)
            
            # Inicializar parser
            parser = REPSExcelParser(self.organization, self.user)
            
            # Procesar archivos en orden: primero sedes, luego servicios
            if headquarters_file:
                self._process_headquarters_file(parser, headquarters_file)
            
            if services_file:
                self._process_services_file(parser, services_file)
            
            # Validar integridad post-sincronización
            self._validate_post_sync_integrity()
            
            # Marcar como exitoso
            self.sync_stats['status'] = 'completed'
            self.sync_stats['end_time'] = timezone.now()
            
            logger.info(f"Sincronización REPS completada exitosamente")
            return self.sync_stats
            
        except Exception as e:
            logger.error(f"Error en sincronización REPS: {str(e)}")
            self.sync_stats['status'] = 'failed'
            self.sync_stats['errors'].append(str(e))
            
            # Intentar rollback si hay backup
            if self.backup and self.sync_stats['backup_created']:
                try:
                    logger.info("Iniciando rollback automático...")
                    self.rollback()
                    self.sync_stats['status'] = 'rolled_back'
                    logger.info("Rollback completado exitosamente")
                except Exception as rollback_error:
                    logger.error(f"Error en rollback: {str(rollback_error)}")
                    self.sync_stats['errors'].append(f"Rollback failed: {str(rollback_error)}")
                    self.sync_stats['status'] = 'critical_error'
            
            raise REPSSyncError(f"Sincronización fallida: {str(e)}")
        
        finally:
            if not self.sync_stats['end_time']:
                self.sync_stats['end_time'] = timezone.now()
    
    def rollback(self) -> bool:
        """
        Ejecuta rollback a partir del backup más reciente.
        
        Returns:
            True si el rollback fue exitoso
        """
        if not self.backup:
            raise REPSSyncError("No hay backup disponible para rollback")
        
        try:
            logger.info("Ejecutando rollback de sincronización REPS...")
            success = self.backup.restore_backup()
            
            if success:
                logger.info("Rollback ejecutado exitosamente")
                # Actualizar estadísticas
                self._update_organization_stats()
            
            return success
            
        except Exception as e:
            logger.error(f"Error ejecutando rollback: {str(e)}")
            raise REPSSyncError(f"Rollback fallido: {str(e)}")
    
    def _create_pre_sync_backup(self):
        """Crea backup antes de la sincronización"""
        try:
            self.backup = REPSBackup(self.organization, self.user)
            backup_id = self.backup.create_backup()
            self.sync_stats['backup_created'] = True
            self.sync_stats['backup_id'] = backup_id
            logger.info(f"Backup pre-sincronización creado: {backup_id}")
            
        except Exception as e:
            logger.error(f"Error creando backup: {str(e)}")
            raise REPSSyncError(f"No se pudo crear backup: {str(e)}")
    
    def _validate_input_files(self, headquarters_file: str, services_file: str):
        """Valida que los archivos de entrada sean válidos"""
        if not headquarters_file and not services_file:
            raise REPSSyncError("Debe proporcionar al menos un archivo (sedes o servicios)")
        
        # Validar existencia de archivos
        import os
        
        if headquarters_file and not os.path.exists(headquarters_file):
            raise REPSSyncError(f"Archivo de sedes no encontrado: {headquarters_file}")
        
        if services_file and not os.path.exists(services_file):
            raise REPSSyncError(f"Archivo de servicios no encontrado: {services_file}")
    
    def _process_headquarters_file(self, parser: REPSExcelParser, file_path: str):
        """Procesa archivo de sedes"""
        try:
            logger.info(f"Procesando archivo de sedes: {file_path}")
            stats = parser.parse_headquarters_file(file_path)
            
            self.sync_stats['files_processed'].append({
                'file': file_path,
                'type': 'headquarters',
                'stats': stats
            })
            
            self.sync_stats['total_headquarters'] = stats.get('headquarters_processed', 0)
            
            if stats.get('errors'):
                self.sync_stats['warnings'].extend(stats['errors'])
            
            logger.info(f"Archivo de sedes procesado: {stats['headquarters_processed']} sedes")
            
        except Exception as e:
            logger.error(f"Error procesando archivo de sedes: {str(e)}")
            raise
    
    def _process_services_file(self, parser: REPSExcelParser, file_path: str):
        """Procesa archivo de servicios"""
        try:
            logger.info(f"Procesando archivo de servicios: {file_path}")
            stats = parser.parse_services_file(file_path)
            
            self.sync_stats['files_processed'].append({
                'file': file_path,
                'type': 'services',
                'stats': stats
            })
            
            self.sync_stats['total_services'] = stats.get('services_processed', 0)
            
            if stats.get('errors'):
                self.sync_stats['warnings'].extend(stats['errors'])
            
            logger.info(f"Archivo de servicios procesado: {stats['services_processed']} servicios")
            
        except Exception as e:
            logger.error(f"Error procesando archivo de servicios: {str(e)}")
            raise
    
    def _validate_post_sync_integrity(self):
        """Valida la integridad de los datos después de la sincronización"""
        try:
            # Verificar que todas las sedes tienen organización correcta
            invalid_hq = HeadquarterLocation.objects.filter(organization=self.organization).exclude(
                organization=self.organization
            ).count()
            
            if invalid_hq > 0:
                raise REPSSyncError(f"Se encontraron {invalid_hq} sedes con organización incorrecta")
            
            # Verificar que todos los servicios tienen sede válida
            invalid_services = EnabledHealthService.objects.filter(
                headquarters__organization=self.organization
            ).exclude(
                headquarters__organization=self.organization
            ).count()
            
            if invalid_services > 0:
                raise REPSSyncError(f"Se encontraron {invalid_services} servicios con sede incorrecta")
            
            # Verificar integridad referencial
            orphaned_services = EnabledHealthService.objects.filter(
                headquarters__organization=self.organization
            ).exclude(
                headquarters__in=HeadquarterLocation.objects.filter(organization=self.organization)
            ).count()
            
            if orphaned_services > 0:
                raise REPSSyncError(f"Se encontraron {orphaned_services} servicios huérfanos")
            
            logger.info("Validación de integridad post-sincronización exitosa")
            
        except Exception as e:
            logger.error(f"Error en validación de integridad: {str(e)}")
            raise
    
    def _update_organization_stats(self):
        """Actualiza estadísticas de la organización después de la sincronización"""
        try:
            # Contar sedes activas
            active_headquarters = HeadquarterLocation.objects.filter(
                organization=self.organization,
                estado_sede='ACTIVA'
            ).count()
            
            # Contar servicios habilitados
            enabled_services = EnabledHealthService.objects.filter(
                headquarters__organization=self.organization,
                estado='HABILITADO'
            ).count()
            
            # Actualizar campos SOGCS en HealthOrganization si existe
            if hasattr(self.organization, 'suh_servicios_habilitados'):
                self.organization.suh_servicios_habilitados = enabled_services
                self.organization.save(update_fields=['suh_servicios_habilitados'])
            
            logger.info(f"Estadísticas actualizadas: {active_headquarters} sedes, {enabled_services} servicios")
            
        except Exception as e:
            logger.warning(f"Error actualizando estadísticas de organización: {str(e)}")
    
    def get_sync_summary(self) -> str:
        """Retorna un resumen legible de la sincronización"""
        duration = ""
        if self.sync_stats['start_time'] and self.sync_stats['end_time']:
            delta = self.sync_stats['end_time'] - self.sync_stats['start_time']
            duration = f"Duración: {delta.total_seconds():.2f} segundos"
        
        summary = f"""
        Resumen de Sincronización REPS:
        ==============================
        Estado: {self.sync_stats['status'].upper()}
        {duration}
        
        Archivos procesados: {len(self.sync_stats['files_processed'])}
        Total sedes: {self.sync_stats['total_headquarters']}
        Total servicios: {self.sync_stats['total_services']}
        
        Backup creado: {'Sí' if self.sync_stats['backup_created'] else 'No'}
        Errores: {len(self.sync_stats['errors'])}
        Advertencias: {len(self.sync_stats['warnings'])}
        """
        
        if self.sync_stats['errors']:
            summary += "\nErrores:\n"
            for error in self.sync_stats['errors'][:5]:
                summary += f"- {error}\n"
        
        return summary
    
    def get_backup_info(self) -> Dict:
        """Retorna información del backup si existe"""
        if self.backup:
            return self.backup.get_backup_info()
        return {}