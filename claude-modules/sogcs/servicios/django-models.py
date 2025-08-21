# Django Models for Health Services (Servicios de Salud)
# File: apps/organization/models/health_services.py

"""
Health Services Models for REPS Integration.

This module implements comprehensive models for managing health services
according to Colombian REPS standards and Resolution 3100/2019.
"""

from django.db import models
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal

from apps.common.models import FullBaseModel


class HealthServiceCatalog(FullBaseModel):
    """
    Master catalog of health services according to Resolution 3100/2019.
    This is a reference table populated from REPS standards.
    """
    
    # Service Identification
    service_code = models.CharField(
        _('código del servicio'),
        max_length=10,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\d{3,4}$',
                message=_('El código debe tener 3 o 4 dígitos.')
            )
        ],
        help_text=_('Código REPS del servicio según Res. 3100/2019.')
    )
    
    service_name = models.CharField(
        _('nombre del servicio'),
        max_length=255,
        help_text=_('Nombre oficial del servicio de salud.')
    )
    
    # Service Group (from REPS column grse_nombre)
    GROUP_CHOICES = [
        ('7', _('Apoyo Diagnóstico y Complementación Terapéutica')),
        ('11', _('Atención Inmediata')),
        ('1', _('Consulta Externa')),
        ('2', _('Internación')),
        ('3', _('Quirúrgicos')),
        ('4', _('Urgencias')),
        ('5', _('Transporte Asistencial')),
        ('6', _('Otros Servicios')),
        ('8', _('Protección Específica y Detección Temprana')),
        ('9', _('Procesos')),
        ('10', _('Telemedicina')),
    ]
    
    service_group_code = models.CharField(
        _('código grupo'),
        max_length=2,
        choices=GROUP_CHOICES,
        help_text=_('Código del grupo de servicio.')
    )
    
    service_group_name = models.CharField(
        _('nombre grupo'),
        max_length=100,
        help_text=_('Nombre del grupo de servicio.')
    )
    
    # Service Requirements
    requires_infrastructure = models.BooleanField(
        _('requiere infraestructura especial'),
        default=False,
        help_text=_('Indica si el servicio requiere infraestructura especial.')
    )
    
    requires_equipment = models.BooleanField(
        _('requiere equipamiento especial'),
        default=False,
        help_text=_('Indica si el servicio requiere equipamiento especial.')
    )
    
    requires_human_talent = models.JSONField(
        _('talento humano requerido'),
        default=dict,
        help_text=_('Profesionales requeridos según normativa.')
    )
    
    # Modality Restrictions
    allows_ambulatory = models.BooleanField(
        _('permite ambulatorio'),
        default=True,
        help_text=_('Servicio puede prestarse en modalidad ambulatoria.')
    )
    
    allows_hospital = models.BooleanField(
        _('permite hospitalario'),
        default=False,
        help_text=_('Servicio puede prestarse en modalidad hospitalaria.')
    )
    
    allows_mobile_unit = models.BooleanField(
        _('permite unidad móvil'),
        default=False,
        help_text=_('Servicio puede prestarse en unidad móvil.')
    )
    
    allows_domiciliary = models.BooleanField(
        _('permite domiciliario'),
        default=False,
        help_text=_('Servicio puede prestarse a domicilio.')
    )
    
    allows_telemedicine = models.BooleanField(
        _('permite telemedicina'),
        default=False,
        help_text=_('Servicio puede prestarse por telemedicina.')
    )
    
    # Complexity Restrictions
    min_complexity = models.IntegerField(
        _('complejidad mínima'),
        choices=[(1, 'Baja'), (2, 'Media'), (3, 'Alta')],
        default=1,
        help_text=_('Nivel mínimo de complejidad requerido.')
    )
    
    max_complexity = models.IntegerField(
        _('complejidad máxima'),
        choices=[(1, 'Baja'), (2, 'Media'), (3, 'Alta')],
        default=3,
        help_text=_('Nivel máximo de complejidad permitido.')
    )
    
    # Interdependencies
    dependent_services = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='required_by_services',
        help_text=_('Servicios requeridos para habilitar este servicio.')
    )
    
    # Standards and Documentation
    standard_requirements = models.JSONField(
        _('requisitos estándar'),
        default=dict,
        blank=True,
        help_text=_('Requisitos según estándares de habilitación.')
    )
    
    documentation_required = models.JSONField(
        _('documentación requerida'),
        default=list,
        blank=True,
        help_text=_('Lista de documentos requeridos para habilitación.')
    )
    
    # Metadata
    resolution_reference = models.CharField(
        _('referencia normativa'),
        max_length=50,
        default='RES_3100_2019',
        help_text=_('Resolución que define el servicio.')
    )
    
    is_active = models.BooleanField(
        _('activo'),
        default=True,
        help_text=_('Si el servicio está vigente en la normativa actual.')
    )
    
    notes = models.TextField(
        _('notas'),
        blank=True,
        help_text=_('Notas adicionales sobre el servicio.')
    )
    
    class Meta:
        verbose_name = _('catálogo de servicios')
        verbose_name_plural = _('catálogo de servicios')
        ordering = ['service_group_code', 'service_code']
        indexes = [
            models.Index(fields=['service_code']),
            models.Index(fields=['service_group_code']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.service_code} - {self.service_name}"
    
    def clean(self):
        """Validate catalog data."""
        super().clean()
        
        if self.min_complexity > self.max_complexity:
            raise ValidationError({
                'min_complexity': _('La complejidad mínima no puede ser mayor que la máxima.')
            })


class SedeHealthService(FullBaseModel):
    """
    Services enabled at a specific headquarters location.
    Maps REPS Excel data to headquarters-specific services.
    """
    
    # Relationships
    headquarters = models.ForeignKey(
        'HeadquarterLocation',
        on_delete=models.CASCADE,
        related_name='health_services',
        verbose_name=_('sede'),
        help_text=_('Sede donde se presta el servicio.')
    )
    
    service_catalog = models.ForeignKey(
        HealthServiceCatalog,
        on_delete=models.PROTECT,
        related_name='sede_instances',
        verbose_name=_('servicio del catálogo'),
        null=True,
        blank=True,
        help_text=_('Referencia al catálogo maestro de servicios.')
    )
    
    # Service Identification (from REPS)
    service_code = models.CharField(
        _('código del servicio'),
        max_length=10,
        help_text=_('Código REPS del servicio.')
    )
    
    service_name = models.CharField(
        _('nombre del servicio'),
        max_length=255,
        help_text=_('Nombre del servicio habilitado.')
    )
    
    service_group_code = models.CharField(
        _('código grupo'),
        max_length=2,
        help_text=_('Código del grupo de servicio.')
    )
    
    service_group_name = models.CharField(
        _('nombre grupo'),
        max_length=100,
        help_text=_('Nombre del grupo de servicio.')
    )
    
    # Modalities (from REPS columns)
    MODALITY_CHOICES = [
        ('SI', 'Sí'),
        ('NO', 'No'),
        ('SD', 'Sin Datos')
    ]
    
    ambulatory = models.CharField(
        _('ambulatorio'),
        max_length=2,
        choices=MODALITY_CHOICES,
        default='SD',
        help_text=_('Servicio ambulatorio.')
    )
    
    hospital = models.CharField(
        _('hospitalario'),
        max_length=2,
        choices=MODALITY_CHOICES,
        default='SD',
        help_text=_('Servicio hospitalario.')
    )
    
    mobile_unit = models.CharField(
        _('unidad móvil'),
        max_length=2,
        choices=MODALITY_CHOICES,
        default='SD',
        help_text=_('Servicio en unidad móvil.')
    )
    
    domiciliary = models.CharField(
        _('domiciliario'),
        max_length=2,
        choices=MODALITY_CHOICES,
        default='SD',
        help_text=_('Servicio domiciliario.')
    )
    
    other_extramural = models.CharField(
        _('otras extramural'),
        max_length=2,
        choices=MODALITY_CHOICES,
        default='SD',
        help_text=_('Otras modalidades extramurales.')
    )
    
    # Service Types
    is_reference_center = models.CharField(
        _('centro de referencia'),
        max_length=2,
        choices=MODALITY_CHOICES,
        default='NO',
        help_text=_('Es centro de referencia.')
    )
    
    is_referring_institution = models.CharField(
        _('institución remisora'),
        max_length=2,
        choices=MODALITY_CHOICES,
        default='NO',
        help_text=_('Es institución remisora.')
    )
    
    # Complexity (from REPS)
    low_complexity = models.CharField(
        _('complejidad baja'),
        max_length=2,
        choices=MODALITY_CHOICES,
        default='SD'
    )
    
    medium_complexity = models.CharField(
        _('complejidad media'),
        max_length=2,
        choices=MODALITY_CHOICES,
        default='SD'
    )
    
    high_complexity = models.CharField(
        _('complejidad alta'),
        max_length=2,
        choices=MODALITY_CHOICES,
        default='SD'
    )
    
    COMPLEXITY_CHOICES = [
        ('BAJA', 'Baja'),
        ('MEDIANA', 'Mediana'),
        ('ALTA', 'Alta'),
        ('SD', 'Sin Datos')
    ]
    
    complexity_level = models.CharField(
        _('nivel de complejidad'),
        max_length=10,
        choices=COMPLEXITY_CHOICES,
        default='SD',
        help_text=_('Nivel de complejidad consolidado.')
    )
    
    # Dates
    opening_date = models.CharField(
        _('fecha apertura'),
        max_length=10,
        blank=True,
        help_text=_('Fecha de apertura del servicio (YYYYMMDD).')
    )
    
    closing_date = models.CharField(
        _('fecha cierre'),
        max_length=10,
        blank=True,
        help_text=_('Fecha de cierre del servicio.')
    )
    
    # Identification
    distinctive_number = models.CharField(
        _('número distintivo'),
        max_length=20,
        unique=True,
        help_text=_('Número distintivo único del servicio.')
    )
    
    main_sede_number = models.CharField(
        _('número sede principal'),
        max_length=5,
        blank=True,
        help_text=_('Número de la sede principal.')
    )
    
    # Schedule (JSON for flexibility)
    schedule = models.JSONField(
        _('horario de atención'),
        default=dict,
        blank=True,
        help_text=_('Horario por día de la semana.')
    )
    
    # Telemedicine modalities
    intramural_modality = models.BooleanField(
        _('modalidad intramural'),
        default=True,
        help_text=_('Servicio con modalidad intramural.')
    )
    
    telemedicine_modality = models.JSONField(
        _('modalidades de telemedicina'),
        default=dict,
        blank=True,
        help_text=_('Modalidades de telemedicina habilitadas.')
    )
    
    # Service specificities (from REPS columns 64-83)
    specificities = models.JSONField(
        _('especificidades'),
        default=dict,
        blank=True,
        help_text=_('Especificidades del servicio (oncológico, trasplantes, etc.).')
    )
    
    # Capacity and Resources
    installed_capacity = models.IntegerField(
        _('capacidad instalada'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Capacidad instalada del servicio.')
    )
    
    human_talent = models.JSONField(
        _('talento humano'),
        default=dict,
        blank=True,
        help_text=_('Personal asignado al servicio.')
    )
    
    # Quality and Compliance
    quality_score = models.DecimalField(
        _('puntaje de calidad'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text=_('Puntaje de calidad del servicio (0-100).')
    )
    
    last_audit_date = models.DateField(
        _('fecha última auditoría'),
        null=True,
        blank=True,
        help_text=_('Fecha de la última auditoría del servicio.')
    )
    
    compliance_percentage = models.DecimalField(
        _('porcentaje de cumplimiento'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text=_('Porcentaje de cumplimiento normativo (0-100).')
    )
    
    # Administrative
    is_enabled = models.BooleanField(
        _('habilitado'),
        default=True,
        help_text=_('Si el servicio está actualmente habilitado.')
    )
    
    observations = models.TextField(
        _('observaciones'),
        blank=True,
        help_text=_('Observaciones del servicio.')
    )
    
    norm_version = models.CharField(
        _('versión de norma'),
        max_length=50,
        default='RESOLUCION_3100',
        help_text=_('Versión de la norma aplicable.')
    )
    
    # Manager Information
    manager_name = models.CharField(
        _('nombre del gerente'),
        max_length=255,
        blank=True,
        help_text=_('Nombre del gerente o responsable.')
    )
    
    # REPS Import tracking
    reps_import_date = models.DateTimeField(
        _('fecha importación REPS'),
        null=True,
        blank=True,
        help_text=_('Última fecha de importación desde REPS.')
    )
    
    reps_raw_data = models.JSONField(
        _('datos crudos REPS'),
        default=dict,
        blank=True,
        help_text=_('Datos originales del archivo REPS.')
    )
    
    # Municipality classifications
    is_pdet_municipality = models.BooleanField(
        _('municipio PDET'),
        default=False,
        help_text=_('Municipio con Programas de Desarrollo con Enfoque Territorial.')
    )
    
    is_zomac_municipality = models.BooleanField(
        _('municipio ZOMAC'),
        default=False,
        help_text=_('Zona más afectada por el conflicto armado.')
    )
    
    is_pnis_municipality = models.BooleanField(
        _('municipio PNIS'),
        default=False,
        help_text=_('Programa Nacional Integral de Sustitución.')
    )
    
    class Meta:
        verbose_name = _('servicio de salud habilitado')
        verbose_name_plural = _('servicios de salud habilitados')
        ordering = ['headquarters', 'service_group_code', 'service_code']
        unique_together = [['headquarters', 'service_code', 'distinctive_number']]
        indexes = [
            models.Index(fields=['headquarters', 'is_enabled']),
            models.Index(fields=['service_code']),
            models.Index(fields=['distinctive_number']),
            models.Index(fields=['service_group_code']),
            models.Index(fields=['complexity_level']),
            models.Index(fields=['opening_date']),
        ]
    
    def __str__(self):
        return f"{self.service_code} - {self.service_name} ({self.headquarters.name})"
    
    def clean(self):
        """Validate service data."""
        super().clean()
        
        # At least one modality must be active
        modalities = [
            self.ambulatory,
            self.hospital,
            self.mobile_unit,
            self.domiciliary,
            self.other_extramural
        ]
        
        if all(m == 'NO' for m in modalities):
            raise ValidationError({
                'ambulatory': _('Al menos una modalidad debe estar activa.')
            })
        
        # Validate complexity consistency
        complexity_flags = []
        if self.low_complexity == 'SI':
            complexity_flags.append('BAJA')
        if self.medium_complexity == 'SI':
            complexity_flags.append('MEDIANA')
        if self.high_complexity == 'SI':
            complexity_flags.append('ALTA')
        
        # Update complexity_level if not set
        if complexity_flags and self.complexity_level == 'SD':
            self.complexity_level = complexity_flags[-1]  # Use highest complexity
    
    @property
    def active_modalities(self):
        """Return list of active modalities."""
        modalities = []
        if self.ambulatory == 'SI':
            modalities.append('Ambulatorio')
        if self.hospital == 'SI':
            modalities.append('Hospitalario')
        if self.mobile_unit == 'SI':
            modalities.append('Unidad Móvil')
        if self.domiciliary == 'SI':
            modalities.append('Domiciliario')
        if self.other_extramural == 'SI':
            modalities.append('Extramural')
        return modalities
    
    @property
    def complexity_display(self):
        """Return formatted complexity level."""
        levels = []
        if self.low_complexity == 'SI':
            levels.append('Baja')
        if self.medium_complexity == 'SI':
            levels.append('Media')
        if self.high_complexity == 'SI':
            levels.append('Alta')
        return ', '.join(levels) if levels else 'Sin Datos'
    
    @property
    def has_telemedicine(self):
        """Check if service has telemedicine capabilities."""
        return bool(self.telemedicine_modality)
    
    @property
    def is_specialized(self):
        """Check if service has any specialization."""
        return bool(self.specificities)
    
    @property
    def requires_renewal(self):
        """Check if service needs renewal based on audit date."""
        if not self.last_audit_date:
            return True
        
        days_since_audit = (timezone.now().date() - self.last_audit_date).days
        return days_since_audit > 365  # Needs renewal after 1 year
    
    def get_schedule_for_day(self, day: str) -> str:
        """Get schedule for a specific day."""
        return self.schedule.get(day, 'No disponible')
    
    def update_from_reps(self, reps_data: dict):
        """Update service from REPS data."""
        # Map REPS fields to model fields
        field_mapping = {
            'serv_codigo': 'service_code',
            'serv_nombre': 'service_name',
            'grse_codigo': 'service_group_code',
            'grse_nombre': 'service_group_name',
            'ambulatorio': 'ambulatory',
            'hospitalario': 'hospital',
            'unidad_movil': 'mobile_unit',
            'domiciliario': 'domiciliary',
            'complejidades': 'complexity_level',
            # ... more mappings ...
        }
        
        for reps_field, model_field in field_mapping.items():
            if reps_field in reps_data:
                setattr(self, model_field, reps_data[reps_field])
        
        self.reps_import_date = timezone.now()
        self.reps_raw_data = reps_data


class ServiceImportLog(FullBaseModel):
    """
    Tracks REPS Excel import operations for audit and debugging.
    """
    
    organization = models.ForeignKey(
        'HealthOrganization',
        on_delete=models.CASCADE,
        related_name='service_import_logs',
        verbose_name=_('organización'),
        help_text=_('Organización que realizó la importación.')
    )
    
    IMPORT_TYPE_CHOICES = [
        ('manual', 'Manual'),
        ('scheduled', 'Programada'),
        ('api', 'API'),
    ]
    
    import_type = models.CharField(
        _('tipo de importación'),
        max_length=20,
        choices=IMPORT_TYPE_CHOICES,
        help_text=_('Método de importación utilizado.')
    )
    
    file_name = models.CharField(
        _('nombre del archivo'),
        max_length=255,
        help_text=_('Nombre del archivo importado.')
    )
    
    file_size = models.IntegerField(
        _('tamaño del archivo'),
        help_text=_('Tamaño en bytes')
    )
    
    file_path = models.CharField(
        _('ruta del archivo'),
        max_length=500,
        blank=True,
        help_text=_('Ruta donde se almacenó el archivo.')
    )
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('processing', 'Procesando'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
        ('partial', 'Parcial'),
    ]
    
    status = models.CharField(
        _('estado'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text=_('Estado actual de la importación.')
    )
    
    # Statistics
    total_rows = models.IntegerField(
        _('total de filas'),
        default=0,
        help_text=_('Total de filas en el archivo.')
    )
    
    processed_rows = models.IntegerField(
        _('filas procesadas'),
        default=0,
        help_text=_('Número de filas procesadas.')
    )
    
    successful_rows = models.IntegerField(
        _('filas exitosas'),
        default=0,
        help_text=_('Número de filas importadas exitosamente.')
    )
    
    failed_rows = models.IntegerField(
        _('filas fallidas'),
        default=0,
        help_text=_('Número de filas que fallaron.')
    )
    
    services_created = models.IntegerField(
        _('servicios creados'),
        default=0,
        help_text=_('Número de servicios nuevos creados.')
    )
    
    services_updated = models.IntegerField(
        _('servicios actualizados'),
        default=0,
        help_text=_('Número de servicios actualizados.')
    )
    
    services_disabled = models.IntegerField(
        _('servicios deshabilitados'),
        default=0,
        help_text=_('Número de servicios deshabilitados.')
    )
    
    headquarters_created = models.IntegerField(
        _('sedes creadas'),
        default=0,
        help_text=_('Número de sedes creadas durante la importación.')
    )
    
    # Timing
    started_at = models.DateTimeField(
        _('iniciado en'),
        null=True,
        blank=True,
        help_text=_('Fecha y hora de inicio.')
    )
    
    completed_at = models.DateTimeField(
        _('completado en'),
        null=True,
        blank=True,
        help_text=_('Fecha y hora de finalización.')
    )
    
    processing_time = models.FloatField(
        _('tiempo de procesamiento'),
        null=True,
        blank=True,
        help_text=_('Tiempo de procesamiento en segundos')
    )
    
    # Error tracking
    errors = models.JSONField(
        _('errores'),
        default=list,
        blank=True,
        help_text=_('Lista de errores encontrados')
    )
    
    warnings = models.JSONField(
        _('advertencias'),
        default=list,
        blank=True,
        help_text=_('Lista de advertencias')
    )
    
    # Validation Results
    validation_errors = models.JSONField(
        _('errores de validación'),
        default=dict,
        blank=True,
        help_text=_('Errores de validación por fila')
    )
    
    # Raw data for debugging
    raw_data_sample = models.JSONField(
        _('muestra de datos'),
        default=dict,
        blank=True,
        help_text=_('Muestra de datos crudos para debugging')
    )
    
    # Processing details
    processing_details = models.JSONField(
        _('detalles de procesamiento'),
        default=dict,
        blank=True,
        help_text=_('Detalles adicionales del procesamiento')
    )
    
    class Meta:
        verbose_name = _('log de importación de servicios')
        verbose_name_plural = _('logs de importación de servicios')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['import_type']),
        ]
    
    def __str__(self):
        return f"{self.file_name} - {self.get_status_display()} ({self.created_at})"
    
    @property
    def duration(self):
        """Calculate import duration."""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return delta.total_seconds()
        return None
    
    @property
    def success_rate(self):
        """Calculate success rate percentage."""
        if self.processed_rows > 0:
            return (self.successful_rows / self.processed_rows) * 100
        return 0
    
    @property
    def is_complete(self):
        """Check if import is complete."""
        return self.status in ['completed', 'failed']
    
    def mark_as_processing(self):
        """Mark import as processing."""
        self.status = 'processing'
        self.started_at = timezone.now()
        self.save(update_fields=['status', 'started_at'])
    
    def mark_as_completed(self):
        """Mark import as completed."""
        self.status = 'completed'
        self.completed_at = timezone.now()
        if self.started_at:
            self.processing_time = (self.completed_at - self.started_at).total_seconds()
        self.save(update_fields=['status', 'completed_at', 'processing_time'])
    
    def mark_as_failed(self, error_message: str):
        """Mark import as failed."""
        self.status = 'failed'
        self.completed_at = timezone.now()
        if self.started_at:
            self.processing_time = (self.completed_at - self.started_at).total_seconds()
        self.errors.append(error_message)
        self.save(update_fields=['status', 'completed_at', 'processing_time', 'errors'])
    
    def add_error(self, error: str, row_number: int = None):
        """Add an error to the log."""
        if row_number:
            error = f"Fila {row_number}: {error}"
        self.errors.append(error)
        self.failed_rows += 1
        
    def add_warning(self, warning: str, row_number: int = None):
        """Add a warning to the log."""
        if row_number:
            warning = f"Fila {row_number}: {warning}"
        self.warnings.append(warning)
    
    def update_statistics(self, **kwargs):
        """Update import statistics."""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.save()