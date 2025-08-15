"""
Validadores para archivos subidos al sistema.

Contiene validadores específicos para diferentes tipos de archivos
utilizados en el sistema QMS.
"""

import magic
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from PIL import Image
import os


class FileValidator:
    """Validador base para archivos"""
    
    def __init__(self, max_size_mb=10, allowed_extensions=None, allowed_mime_types=None):
        self.max_size_mb = max_size_mb
        self.allowed_extensions = allowed_extensions or []
        self.allowed_mime_types = allowed_mime_types or []
    
    def __call__(self, file):
        self.validate_size(file)
        self.validate_extension(file)
        if self.allowed_mime_types:
            self.validate_mime_type(file)
    
    def validate_size(self, file):
        """Valida el tamaño del archivo"""
        max_size_bytes = self.max_size_mb * 1024 * 1024
        if file.size > max_size_bytes:
            raise ValidationError(
                _('El archivo es muy grande. Tamaño máximo: %(max_size)s MB. '
                  'Tamaño actual: %(current_size)s MB'),
                params={
                    'max_size': self.max_size_mb,
                    'current_size': round(file.size / (1024 * 1024), 2)
                }
            )
    
    def validate_extension(self, file):
        """Valida la extensión del archivo"""
        if not self.allowed_extensions:
            return
        
        name, ext = os.path.splitext(file.name)
        ext = ext.lower()
        
        if ext not in self.allowed_extensions:
            raise ValidationError(
                _('Tipo de archivo no permitido. Extensiones permitidas: %(extensions)s'),
                params={'extensions': ', '.join(self.allowed_extensions)}
            )
    
    def validate_mime_type(self, file):
        """Valida el tipo MIME del archivo"""
        file.seek(0)
        mime_type = magic.from_buffer(file.read(1024), mime=True)
        file.seek(0)
        
        if mime_type not in self.allowed_mime_types:
            raise ValidationError(
                _('Tipo de archivo no válido. Tipos permitidos: %(types)s'),
                params={'types': ', '.join(self.allowed_mime_types)}
            )


class ImageValidator(FileValidator):
    """Validador específico para imágenes"""
    
    def __init__(self, max_size_mb=5, max_width=2048, max_height=2048):
        super().__init__(
            max_size_mb=max_size_mb,
            allowed_extensions=['.jpg', '.jpeg', '.png', '.gif', '.webp'],
            allowed_mime_types=[
                'image/jpeg', 'image/png', 'image/gif', 
                'image/webp', 'image/svg+xml'
            ]
        )
        self.max_width = max_width
        self.max_height = max_height
    
    def __call__(self, file):
        super().__call__(file)
        self.validate_image_dimensions(file)
    
    def validate_image_dimensions(self, file):
        """Valida las dimensiones de la imagen"""
        try:
            file.seek(0)
            image = Image.open(file)
            width, height = image.size
            file.seek(0)
            
            if width > self.max_width or height > self.max_height:
                raise ValidationError(
                    _('La imagen es muy grande. Dimensiones máximas: '
                      '%(max_width)sx%(max_height)s pixels. '
                      'Dimensiones actuales: %(width)sx%(height)s pixels'),
                    params={
                        'max_width': self.max_width,
                        'max_height': self.max_height,
                        'width': width,
                        'height': height
                    }
                )
        except Exception:
            raise ValidationError(_('El archivo no es una imagen válida'))


class DocumentValidator(FileValidator):
    """Validador específico para documentos"""
    
    def __init__(self, max_size_mb=25):
        super().__init__(
            max_size_mb=max_size_mb,
            allowed_extensions=[
                '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
                '.ppt', '.pptx', '.txt', '.rtf'
            ],
            allowed_mime_types=[
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain',
                'application/rtf'
            ]
        )


class SpreadsheetValidator(FileValidator):
    """Validador específico para hojas de cálculo"""
    
    def __init__(self, max_size_mb=10):
        super().__init__(
            max_size_mb=max_size_mb,
            allowed_extensions=['.csv', '.xls', '.xlsx'],
            allowed_mime_types=[
                'text/csv',
                'application/csv',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ]
        )


class LogoValidator(ImageValidator):
    """Validador específico para logos de organizaciones"""
    
    def __init__(self):
        super().__init__(
            max_size_mb=2,  # Logos más pequeños
            max_width=1024,  # Dimensiones más conservadoras
            max_height=1024
        )


class CertificateValidator(FileValidator):
    """Validador para certificados y documentos legales"""
    
    def __init__(self):
        super().__init__(
            max_size_mb=15,
            allowed_extensions=['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
            allowed_mime_types=[
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png'
            ]
        )


class AuditDocumentValidator(FileValidator):
    """Validador para documentos de auditoría"""
    
    def __init__(self):
        super().__init__(
            max_size_mb=50,  # Auditorías pueden ser más grandes
            allowed_extensions=[
                '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
                '.zip', '.rar', '.7z'
            ],
            allowed_mime_types=[
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/zip',
                'application/x-rar-compressed',
                'application/x-7z-compressed'
            ]
        )


# Instancias predefinidas para uso común
validate_logo = LogoValidator()
validate_document = DocumentValidator()
validate_spreadsheet = SpreadsheetValidator()
validate_image = ImageValidator()
validate_certificate = CertificateValidator()
validate_audit_document = AuditDocumentValidator()


def validate_qms_document(file):
    """Validador específico para documentos del QMS"""
    # Usar el validador de documentos con restricciones adicionales
    validator = DocumentValidator(max_size_mb=20)
    validator(file)
    
    # Validaciones adicionales específicas para QMS
    if file.name.lower().endswith('.pdf'):
        # Los PDFs deben ser válidos para QMS
        file.seek(0)
        content = file.read(100)
        file.seek(0)
        
        if b'%PDF' not in content:
            raise ValidationError(_('El archivo PDF no es válido'))


def validate_process_evidence(file):
    """Validador para evidencias de procesos"""
    # Permite múltiples tipos de archivo como evidencia
    validator = FileValidator(
        max_size_mb=30,
        allowed_extensions=[
            '.pdf', '.doc', '.docx', '.xls', '.xlsx',
            '.jpg', '.jpeg', '.png', '.gif',
            '.mp4', '.avi', '.mov',
            '.zip', '.rar'
        ]
    )
    validator(file)


def validate_import_data(file):
    """Validador para archivos de importación de datos"""
    validator = SpreadsheetValidator()
    validator(file)
    
    # Validaciones adicionales para importación
    if file.name.lower().endswith('.csv'):
        file.seek(0)
        # Verificar que tenga contenido válido CSV
        first_line = file.readline()
        file.seek(0)
        
        if not first_line or len(first_line.decode('utf-8').split(',')) < 2:
            raise ValidationError(
                _('El archivo CSV debe tener al menos 2 columnas')
            )