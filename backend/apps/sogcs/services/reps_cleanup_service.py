"""
Servicio de limpieza de datos REPS para resolver problemas de constraint UNIQUE.

Este servicio proporciona herramientas para limpiar y normalizar datos de sedes
corruptos que causan violaciones de constraint UNIQUE en el campo reps_code.
"""

import re
import logging
import uuid
from typing import Dict, List, Tuple, Optional
from django.db import connection, transaction
from django.contrib.auth import get_user_model

from apps.organization.models import HealthOrganization, HeadquarterLocation

User = get_user_model()
logger = logging.getLogger(__name__)


class REPSCleanupService:
    """Servicio para limpiar y normalizar datos REPS corruptos."""
    
    def __init__(self, organization: HealthOrganization, user: User = None):
        self.organization = organization
        self.user = user
        self.stats = {
            'corrupted_cleaned': 0,
            'whitespace_fixed': 0,
            'duplicates_resolved': 0,
            'hard_deleted': 0,
            'validation_errors': []
        }
    
    def diagnose_reps_codes(self) -> Dict:
        """
        Diagnostica problemas en los códigos REPS de la organización.
        
        Returns:
            Dict con estadísticas de problemas encontrados
        """
        diagnosis = {
            'organization_id': self.organization.id,
            'organization_name': self.organization.organization.razon_social,
            'total_sedes': 0,
            'corrupted_codes': [],
            'whitespace_issues': [],
            'duplicates': [],
            'invalid_formats': [],
            'recommendations': []
        }
        
        # Obtener todas las sedes (activas y eliminadas)
        all_sedes = HeadquarterLocation.objects.filter(
            organization=self.organization
        ).values('id', 'reps_code', 'name', 'deleted_at')
        
        diagnosis['total_sedes'] = len(all_sedes)
        
        reps_codes_seen = {}
        
        for sede in all_sedes:
            reps_code = sede['reps_code']
            
            # Verificar códigos con sufijos UUID
            if self._has_uuid_suffix(reps_code):
                diagnosis['corrupted_codes'].append({
                    'sede_id': sede['id'],
                    'sede_name': sede['name'],
                    'reps_code': reps_code,
                    'is_deleted': sede['deleted_at'] is not None
                })
            
            # Verificar problemas de espacios en blanco
            if reps_code != reps_code.strip() or '  ' in reps_code:
                diagnosis['whitespace_issues'].append({
                    'sede_id': sede['id'],
                    'sede_name': sede['name'],
                    'reps_code': repr(reps_code),  # Muestra espacios
                    'sanitized': self._sanitize_reps_code(reps_code)
                })
            
            # Verificar duplicados
            if reps_code in reps_codes_seen:
                if reps_code not in [d['reps_code'] for d in diagnosis['duplicates']]:
                    diagnosis['duplicates'].append({
                        'reps_code': reps_code,
                        'count': 0,
                        'sedes': []
                    })
                
                # Encontrar el duplicate entry y actualizar
                for dup in diagnosis['duplicates']:
                    if dup['reps_code'] == reps_code:
                        dup['count'] += 1
                        dup['sedes'].append({
                            'sede_id': sede['id'],
                            'sede_name': sede['name'],
                            'is_deleted': sede['deleted_at'] is not None
                        })
                        break
            else:
                reps_codes_seen[reps_code] = sede
            
            # Verificar formato inválido
            if not self._is_valid_reps_format(reps_code):
                diagnosis['invalid_formats'].append({
                    'sede_id': sede['id'],
                    'sede_name': sede['name'],
                    'reps_code': reps_code,
                    'issue': self._get_format_issue(reps_code)
                })
        
        # Generar recomendaciones
        if diagnosis['corrupted_codes']:
            diagnosis['recommendations'].append(
                f"Limpiar {len(diagnosis['corrupted_codes'])} códigos REPS corruptos con sufijos UUID"
            )
        
        if diagnosis['whitespace_issues']:
            diagnosis['recommendations'].append(
                f"Normalizar {len(diagnosis['whitespace_issues'])} códigos con problemas de espacios"
            )
        
        if diagnosis['duplicates']:
            diagnosis['recommendations'].append(
                f"Resolver {len(diagnosis['duplicates'])} códigos REPS duplicados"
            )
        
        if diagnosis['invalid_formats']:
            diagnosis['recommendations'].append(
                f"Corregir {len(diagnosis['invalid_formats'])} códigos con formato inválido"
            )
        
        return diagnosis
    
    def cleanup_corrupted_reps_codes(self) -> Dict:
        """
        Limpia códigos REPS corruptos (con sufijos UUID).
        
        Returns:
            Dict con estadísticas de limpieza
        """
        logger.info("Iniciando limpieza de códigos REPS corruptos...")
        
        # Buscar sedes con códigos corruptos
        corrupted_sedes = []
        for sede in HeadquarterLocation.objects.filter(organization=self.organization):
            if self._has_uuid_suffix(sede.reps_code):
                corrupted_sedes.append(sede)
        
        logger.info(f"Encontradas {len(corrupted_sedes)} sedes con códigos corruptos")
        
        fixed_count = 0
        for sede in corrupted_sedes:
            original_code = sede.reps_code
            # Intentar extraer el código original
            clean_code = self._extract_original_reps_code(original_code)
            
            if clean_code and clean_code != original_code:
                # Verificar que el código limpio no exista ya
                if not HeadquarterLocation.objects.filter(
                    organization=self.organization,
                    reps_code=clean_code
                ).exclude(id=sede.id).exists():
                    
                    sede.reps_code = clean_code
                    sede.save(update_fields=['reps_code', 'updated_at'])
                    fixed_count += 1
                    logger.info(f"Código corregido: {original_code} → {clean_code}")
                else:
                    logger.warning(f"No se pudo limpiar {original_code}: código {clean_code} ya existe")
        
        self.stats['corrupted_cleaned'] = fixed_count
        logger.info(f"Limpieza completada: {fixed_count} códigos corregidos")
        
        return {
            'fixed_count': fixed_count,
            'total_corrupted': len(corrupted_sedes)
        }
    
    def sanitize_all_reps_codes(self) -> Dict:
        """
        Sanitiza todos los códigos REPS removiendo espacios y caracteres inválidos.
        
        Returns:
            Dict con estadísticas de sanitización
        """
        logger.info("Iniciando sanitización de códigos REPS...")
        
        sanitized_count = 0
        sedes = HeadquarterLocation.objects.filter(organization=self.organization)
        
        for sede in sedes:
            original_code = sede.reps_code
            sanitized_code = self._sanitize_reps_code(original_code)
            
            if sanitized_code != original_code:
                # Verificar que el código sanitizado no exista ya
                if not HeadquarterLocation.objects.filter(
                    organization=self.organization,
                    reps_code=sanitized_code
                ).exclude(id=sede.id).exists():
                    
                    sede.reps_code = sanitized_code
                    sede.save(update_fields=['reps_code', 'updated_at'])
                    sanitized_count += 1
                    logger.info(f"Código sanitizado: {repr(original_code)} → {repr(sanitized_code)}")
        
        self.stats['whitespace_fixed'] = sanitized_count
        logger.info(f"Sanitización completada: {sanitized_count} códigos corregidos")
        
        return {
            'sanitized_count': sanitized_count,
            'total_processed': len(sedes)
        }
    
    def hard_delete_all_headquarters(self) -> Dict:
        """
        Elimina completamente todas las sedes de la organización usando SQL raw.
        Esto bypasea el soft delete y elimina físicamente los registros.
        
        Returns:
            Dict con estadísticas de eliminación
        """
        logger.info("Iniciando eliminación completa de todas las sedes...")
        
        # Contar registros antes de eliminar
        total_count = HeadquarterLocation.objects.filter(organization=self.organization).count()
        
        # Usar SQL raw para eliminación completa
        with connection.cursor() as cursor:
            table_name = HeadquarterLocation._meta.db_table
            
            # Convertir UUID a string compatible con SQLite
            org_id_str = str(self.organization.id).replace('-', '')
            
            # Ejecutar eliminación raw
            cursor.execute(
                f"DELETE FROM {table_name} WHERE organization_id = %s",
                [org_id_str]
            )
            
            deleted_count = cursor.rowcount
        
        self.stats['hard_deleted'] = deleted_count
        logger.info(f"Eliminación completada: {deleted_count} registros eliminados físicamente")
        
        # Verificar que no queden registros
        remaining_count = HeadquarterLocation.objects.filter(organization=self.organization).count()
        if remaining_count > 0:
            logger.warning(f"Atención: {remaining_count} registros aún presentes después de eliminación")
        
        return {
            'deleted_count': deleted_count,
            'total_before': total_count,
            'remaining_count': remaining_count
        }
    
    def validate_reps_code_uniqueness(self, reps_code: str) -> Tuple[bool, str]:
        """
        Valida que un código REPS sea único antes de crear un registro.
        
        Args:
            reps_code: Código REPS a validar
            
        Returns:
            Tuple (is_unique, error_message)
        """
        sanitized_code = self._sanitize_reps_code(reps_code)
        
        # Verificar formato
        if not self._is_valid_reps_format(sanitized_code):
            return False, f"Formato de código REPS inválido: {sanitized_code}"
        
        # Verificar unicidad
        existing = HeadquarterLocation.objects.filter(
            organization=self.organization,
            reps_code=sanitized_code
        ).first()
        
        if existing:
            status = "eliminada" if existing.deleted_at else "activa"
            return False, f"Código REPS {sanitized_code} ya existe en sede {status}: {existing.name}"
        
        return True, ""
    
    def get_cleanup_stats(self) -> Dict:
        """Retorna estadísticas de todas las operaciones de limpieza."""
        return self.stats.copy()
    
    # Métodos privados de utilidad
    
    def _has_uuid_suffix(self, reps_code: str) -> bool:
        """Verifica si un código REPS tiene sufijo UUID."""
        if not reps_code:
            return False
        
        # Buscar patrón UUID al final: 8-4-4-4-12 caracteres hexadecimales
        uuid_pattern = r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        return bool(re.search(uuid_pattern, reps_code))
    
    def _extract_original_reps_code(self, corrupted_code: str) -> str:
        """Extrae el código REPS original de un código corrompido."""
        if not corrupted_code:
            return ""
        
        # Remover sufijo UUID si existe
        uuid_pattern = r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        clean_code = re.sub(uuid_pattern, '', corrupted_code)
        
        # Remover caracteres de separación que pueden haber quedado
        clean_code = clean_code.rstrip('_-. ')
        
        return self._sanitize_reps_code(clean_code)
    
    def _sanitize_reps_code(self, reps_code: str) -> str:
        """Sanitiza un código REPS removiendo espacios y caracteres inválidos."""
        if not reps_code or reps_code.lower() in ('nan', 'null', 'none'):
            return ""
        
        # Convertir a string y strip
        clean_code = str(reps_code).strip()
        
        # Remover espacios internos
        clean_code = re.sub(r'\s+', '', clean_code)
        
        # Mantener solo caracteres alfanuméricos y guiones bajos
        clean_code = re.sub(r'[^a-zA-Z0-9_]', '', clean_code)
        
        # Limitar longitud
        if len(clean_code) > 20:
            clean_code = clean_code[:20]
        
        return clean_code
    
    def _is_valid_reps_format(self, reps_code: str) -> bool:
        """Verifica que un código REPS tenga formato válido."""
        if not reps_code:
            return False
        
        # Debe tener entre 1 y 20 caracteres
        if len(reps_code) > 20:
            return False
        
        # Solo caracteres alfanuméricos y guiones bajos
        if not re.match(r'^[a-zA-Z0-9_]+$', reps_code):
            return False
        
        return True
    
    def _get_format_issue(self, reps_code: str) -> str:
        """Identifica el problema específico de formato en un código REPS."""
        if not reps_code:
            return "Código vacío"
        
        if len(reps_code) > 20:
            return f"Demasiado largo ({len(reps_code)} caracteres, máximo 20)"
        
        if not re.match(r'^[a-zA-Z0-9_]+$', reps_code):
            invalid_chars = re.findall(r'[^a-zA-Z0-9_]', reps_code)
            return f"Caracteres inválidos: {set(invalid_chars)}"
        
        return "Formato válido"