"""
Upload handlers y utilidades para gestión escalable de archivos.

Este módulo proporciona funciones para manejar uploads de archivos
de manera escalable y organizada en ZentraQMS.
"""

import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


def get_organization_upload_path(instance, filename: str, subfolder: str = '') -> str:
    """
    Genera path escalable para uploads relacionados con organizaciones.
    
    Estructura: organizations/{org_id}/{year}/{month}/{subfolder}/{safe_filename}
    
    Args:
        instance: Instancia del modelo con organización
        filename: Nombre original del archivo
        subfolder: Subcarpeta específica (logos, documents, etc.)
        
    Returns:
        str: Path relativo para el archivo
    """
    # Obtener organización
    organization = getattr(instance, 'organization', None)
    if not organization:
        organization = instance
    
    # Fecha actual para organización temporal
    now = datetime.now()
    year = now.year
    month = f"{now.month:02d}"
    
    # Generar nombre seguro
    safe_filename = generate_safe_filename(filename)
    
    # Construir path
    path_parts = ['organizations', str(organization.id), str(year), month]
    
    if subfolder:
        path_parts.append(subfolder)
    
    path_parts.append(safe_filename)
    
    return '/'.join(path_parts)


def get_user_upload_path(instance, filename: str, subfolder: str = '') -> str:
    """
    Genera path escalable para uploads relacionados con usuarios.
    
    Estructura: users/{user_id}/{year}/{month}/{subfolder}/{safe_filename}
    """
    user = getattr(instance, 'user', None) or getattr(instance, 'created_by', None)
    if not user:
        user = instance
    
    now = datetime.now()
    year = now.year
    month = f"{now.month:02d}"
    
    safe_filename = generate_safe_filename(filename)
    
    path_parts = ['users', str(user.id), str(year), month]
    
    if subfolder:
        path_parts.append(subfolder)
    
    path_parts.append(safe_filename)
    
    return '/'.join(path_parts)


def get_document_upload_path(instance, filename: str) -> str:
    """Path para documentos del sistema (políticas, procedimientos, etc.)"""
    return get_organization_upload_path(instance, filename, 'documents')


def get_logo_upload_path(instance, filename: str) -> str:
    """Path específico para logos de organizaciones"""
    return get_organization_upload_path(instance, filename, 'logos')


def get_certificate_upload_path(instance, filename: str) -> str:
    """Path para certificados y documentos legales"""
    return get_organization_upload_path(instance, filename, 'certificates')


def get_audit_upload_path(instance, filename: str) -> str:
    """Path para documentos de auditoría"""
    return get_organization_upload_path(instance, filename, 'audits')


def get_evidence_upload_path(instance, filename: str) -> str:
    """Path para evidencias de procesos"""
    return get_organization_upload_path(instance, filename, 'evidence')


def get_report_upload_path(instance, filename: str) -> str:
    """Path para reportes generados"""
    return get_organization_upload_path(instance, filename, 'reports')


def get_import_upload_path(instance, filename: str) -> str:
    """Path para archivos de importación temporal"""
    return get_organization_upload_path(instance, filename, 'imports')


def generate_safe_filename(filename: str) -> str:
    """
    Genera un nombre de archivo seguro y único.
    
    Args:
        filename: Nombre original del archivo
        
    Returns:
        str: Nombre seguro con timestamp y UUID
    """
    # Obtener extensión
    name, ext = os.path.splitext(filename)
    
    # Limpiar nombre
    safe_name = slugify(name)[:50]  # Limitar longitud
    
    # Generar timestamp y UUID corto
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_id = str(uuid.uuid4())[:8]
    
    # Combinar todo
    safe_filename = f"{safe_name}_{timestamp}_{unique_id}{ext.lower()}"
    
    return safe_filename


def validate_file_size(file, max_size_mb: int = 10) -> None:
    """
    Valida el tamaño del archivo.
    
    Args:
        file: Archivo a validar
        max_size_mb: Tamaño máximo en MB
        
    Raises:
        ValidationError: Si el archivo es muy grande
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if file.size > max_size_bytes:
        raise ValidationError(
            _('El archivo es muy grande. Tamaño máximo permitido: %(max_size)s MB'),
            params={'max_size': max_size_mb}
        )


def validate_file_extension(file, allowed_extensions: list) -> None:
    """
    Valida la extensión del archivo.
    
    Args:
        file: Archivo a validar
        allowed_extensions: Lista de extensiones permitidas
        
    Raises:
        ValidationError: Si la extensión no está permitida
    """
    name, ext = os.path.splitext(file.name)
    ext = ext.lower()
    
    if ext not in allowed_extensions:
        raise ValidationError(
            _('Tipo de archivo no permitido. Extensiones permitidas: %(extensions)s'),
            params={'extensions': ', '.join(allowed_extensions)}
        )


def validate_image_file(file) -> None:
    """Validación específica para archivos de imagen"""
    validate_file_size(file, max_size_mb=5)
    validate_file_extension(file, ['.jpg', '.jpeg', '.png', '.gif', '.webp'])


def validate_document_file(file) -> None:
    """Validación específica para documentos"""
    validate_file_size(file, max_size_mb=25)
    validate_file_extension(file, ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'])


def validate_import_file(file) -> None:
    """Validación específica para archivos de importación"""
    validate_file_size(file, max_size_mb=10)
    validate_file_extension(file, ['.csv', '.xlsx', '.xls'])


def get_file_type_from_extension(filename: str) -> str:
    """
    Determina el tipo de archivo basado en la extensión.
    
    Args:
        filename: Nombre del archivo
        
    Returns:
        str: Tipo de archivo (image, document, spreadsheet, etc.)
    """
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    
    type_mapping = {
        # Imágenes
        '.jpg': 'image', '.jpeg': 'image', '.png': 'image', 
        '.gif': 'image', '.webp': 'image', '.svg': 'image',
        
        # Documentos
        '.pdf': 'document', '.doc': 'document', '.docx': 'document',
        '.txt': 'document', '.rtf': 'document',
        
        # Hojas de cálculo
        '.xls': 'spreadsheet', '.xlsx': 'spreadsheet', '.csv': 'spreadsheet',
        
        # Presentaciones
        '.ppt': 'presentation', '.pptx': 'presentation',
        
        # Archivos comprimidos
        '.zip': 'archive', '.rar': 'archive', '.7z': 'archive',
        
        # Videos
        '.mp4': 'video', '.avi': 'video', '.mov': 'video',
        
        # Audio
        '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio',
    }
    
    return type_mapping.get(ext, 'unknown')


def cleanup_old_files(organization_id: str, days_old: int = 30, subfolder: str = 'temp') -> int:
    """
    Limpia archivos antiguos para liberar espacio.
    
    Args:
        organization_id: ID de la organización
        days_old: Días de antigüedad para considerar archivos obsoletos
        subfolder: Subcarpeta específica a limpiar
        
    Returns:
        int: Número de archivos eliminados
    """
    media_root = Path(settings.MEDIA_ROOT)
    org_path = media_root / 'organizations' / str(organization_id)
    
    if not org_path.exists():
        return 0
    
    files_deleted = 0
    cutoff_date = datetime.now().timestamp() - (days_old * 24 * 60 * 60)
    
    # Buscar archivos en subcarpeta específica
    if subfolder:
        search_path = org_path / '**' / subfolder / '**'
    else:
        search_path = org_path / '**'
    
    for file_path in search_path.glob('*'):
        if file_path.is_file() and file_path.stat().st_mtime < cutoff_date:
            try:
                file_path.unlink()
                files_deleted += 1
            except OSError:
                continue
    
    return files_deleted


def get_storage_stats(organization_id: str) -> dict:
    """
    Obtiene estadísticas de almacenamiento para una organización.
    
    Args:
        organization_id: ID de la organización
        
    Returns:
        dict: Estadísticas de uso de almacenamiento
    """
    media_root = Path(settings.MEDIA_ROOT)
    org_path = media_root / 'organizations' / str(organization_id)
    
    if not org_path.exists():
        return {
            'total_size_bytes': 0,
            'total_size_mb': 0,
            'file_count': 0,
            'folders': {}
        }
    
    total_size = 0
    file_count = 0
    folder_stats = {}
    
    for subfolder in org_path.rglob('*'):
        if subfolder.is_dir():
            folder_size = 0
            folder_files = 0
            
            for file_path in subfolder.rglob('*'):
                if file_path.is_file():
                    file_size = file_path.stat().st_size
                    folder_size += file_size
                    folder_files += 1
            
            if folder_files > 0:
                folder_name = subfolder.name
                folder_stats[folder_name] = {
                    'size_bytes': folder_size,
                    'size_mb': round(folder_size / (1024 * 1024), 2),
                    'file_count': folder_files
                }
                
                total_size += folder_size
                file_count += folder_files
    
    return {
        'total_size_bytes': total_size,
        'total_size_mb': round(total_size / (1024 * 1024), 2),
        'file_count': file_count,
        'folders': folder_stats
    }