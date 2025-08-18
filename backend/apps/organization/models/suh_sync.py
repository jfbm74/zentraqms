"""
  SUH synchronization models.

  Contains models for synchronizing health organization data with the
  Sistema Único de Habilitación (SUH) portal from the Ministry of Health.
  """

from django.db import models
from django.conf import settings
from django.core.validators import (
      RegexValidator,
      MinLengthValidator,
      MaxLengthValidator,
  )
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.common.models import FullBaseModel

  # Import the Organization model from base
from .base import Organization


# ================================
# SUH (Sistema Único de Habilitación) Models
# ================================

class SUHExtraction(FullBaseModel):
    """
    Model to manage SUH (Sistema Único de Habilitación) extractions.
    Tracks all automatic extractions from the Ministry of Health portal.
    """
    
    EXTRACTION_STATUS = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('failed', 'Fallida'),
        ('partial', 'Parcial'),
    ]
    
    SOURCE_CHOICES = [
        ('SUH_PORTAL', 'Portal SUH MinSalud'),
        ('MANUAL_ENTRY', 'Entrada Manual'),
        ('API_IMPORT', 'Importación API'),
    ]
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='suh_extractions',
        verbose_name=_('Organización')
    )
    
    # Extraction metadata
    extraction_id = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_('ID de Extracción'),
        help_text=_('Identificador único de la extracción')
    )
    
    status = models.CharField(
        max_length=20,
        choices=EXTRACTION_STATUS,
        default='pending',
        verbose_name=_('Estado')
    )
    
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default='SUH_PORTAL',
        verbose_name=_('Fuente')
    )
    
    # Portal information
    nit_consulta = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^\d{9,11}$')],
        verbose_name=_('NIT de Consulta'),
        help_text=_('NIT usado para la consulta en el portal SUH')
    )
    
    # Extraction timing
    started_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Iniciado')
    )
    
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Completado')
    )
    
    # Results
    extracted_data = models.JSONField(
        default=dict,
        verbose_name=_('Datos Extraídos'),
        help_text=_('Datos completos extraídos del portal SUH en formato JSON')
    )
    
    validation_results = models.JSONField(
        default=dict,
        verbose_name=_('Resultados de Validación'),
        help_text=_('Resultados de validación y discrepancias detectadas')
    )
    
    # Error handling
    error_message = models.TextField(
        blank=True,
        verbose_name=_('Mensaje de Error'),
        help_text=_('Descripción del error si la extracción falló')
    )
    
    extraction_logs = models.JSONField(
        default=list,
        verbose_name=_('Logs de Extracción'),
        help_text=_('Logs detallados del proceso de extracción')
    )
    
    # Statistics
    total_sedes_extracted = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Sedes Extraídas')
    )
    
    total_servicios_extracted = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Servicios Extraídos')
    )
    
    class Meta:
        verbose_name = _('Extracción SUH')
        verbose_name_plural = _('Extracciones SUH')
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['nit_consulta']),
            models.Index(fields=['started_at']),
        ]
    
    def __str__(self):
        return f"SUH-{self.extraction_id} - {self.organization.razon_social}"
    
    @property
    def duration(self):
        """Calculate extraction duration."""
        if self.completed_at:
            return self.completed_at - self.started_at
        return None
    
    @property
    def is_successful(self):
        """Check if extraction was successful."""
        return self.status == 'completed' and self.extracted_data
    
    def mark_as_completed(self):
        """Mark extraction as completed."""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])
    
    def mark_as_failed(self, error_message):
        """Mark extraction as failed with error message."""
        self.status = 'failed'
        self.error_message = error_message
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'error_message', 'completed_at'])


class SUHDataMapping(FullBaseModel):
    """
    Model to store field mappings between SUH portal data and QMS data structures.
    Allows for configurable data transformation and mapping.
    """
    
    FIELD_TYPES = [
        ('string', 'Texto'),
        ('integer', 'Número Entero'),
        ('decimal', 'Número Decimal'),
        ('date', 'Fecha'),
        ('boolean', 'Booleano'),
        ('json', 'JSON'),
    ]
    
    extraction = models.ForeignKey(
        SUHExtraction,
        on_delete=models.CASCADE,
        related_name='data_mappings',
        verbose_name=_('Extracción SUH')
    )
    
    # Field mapping
    suh_field_name = models.CharField(
        max_length=100,
        verbose_name=_('Campo SUH'),
        help_text=_('Nombre del campo en el portal SUH')
    )
    
    qms_field_name = models.CharField(
        max_length=100,
        verbose_name=_('Campo QMS'),
        help_text=_('Nombre del campo correspondiente en QMS')
    )
    
    field_type = models.CharField(
        max_length=20,
        choices=FIELD_TYPES,
        verbose_name=_('Tipo de Campo')
    )
    
    # Values
    suh_value = models.TextField(
        blank=True,
        verbose_name=_('Valor SUH'),
        help_text=_('Valor extraído del portal SUH')
    )
    
    qms_value = models.TextField(
        blank=True,
        verbose_name=_('Valor QMS'),
        help_text=_('Valor transformado para QMS')
    )
    
    # Validation
    is_valid = models.BooleanField(
        default=True,
        verbose_name=_('Es Válido')
    )
    
    validation_notes = models.TextField(
        blank=True,
        verbose_name=_('Notas de Validación')
    )
    
    # Mapping configuration
    transformation_rule = models.JSONField(
        default=dict,
        verbose_name=_('Regla de Transformación'),
        help_text=_('Reglas para transformar el valor de SUH a QMS')
    )
    
    class Meta:
        verbose_name = _('Mapeo de Datos SUH')
        verbose_name_plural = _('Mapeos de Datos SUH')
        unique_together = ['extraction', 'suh_field_name', 'qms_field_name']
        indexes = [
            models.Index(fields=['extraction', 'is_valid']),
            models.Index(fields=['suh_field_name']),
        ]
    
    def __str__(self):
        return f"{self.suh_field_name} → {self.qms_field_name}"


class SUHDiscrepancy(FullBaseModel):
    """
    Model to track discrepancies between SUH extracted data and existing QMS data.
    Supports the tripartite resolution strategy (Critical/Important/Minor).
    """
    
    DISCREPANCY_LEVELS = [
        ('CRITICAL', 'Crítica'),
        ('IMPORTANT', 'Importante'),
        ('MINOR', 'Menor'),
    ]
    
    RESOLUTION_STATUS = [
        ('pending', 'Pendiente'),
        ('suh_accepted', 'SUH Aceptado'),
        ('qms_kept', 'QMS Mantenido'),
        ('manual_resolved', 'Resuelto Manualmente'),
        ('ignored', 'Ignorado'),
    ]
    
    extraction = models.ForeignKey(
        SUHExtraction,
        on_delete=models.CASCADE,
        related_name='discrepancies',
        verbose_name=_('Extracción SUH')
    )
    
    # Discrepancy details
    field_name = models.CharField(
        max_length=100,
        verbose_name=_('Campo'),
        help_text=_('Nombre del campo con discrepancia')
    )
    
    level = models.CharField(
        max_length=20,
        choices=DISCREPANCY_LEVELS,
        verbose_name=_('Nivel de Criticidad')
    )
    
    # Values
    suh_value = models.TextField(
        verbose_name=_('Valor SUH'),
        help_text=_('Valor del portal SUH')
    )
    
    qms_value = models.TextField(
        verbose_name=_('Valor QMS'),
        help_text=_('Valor actual en QMS')
    )
    
    # Resolution
    resolution_status = models.CharField(
        max_length=20,
        choices=RESOLUTION_STATUS,
        default='pending',
        verbose_name=_('Estado de Resolución')
    )
    
    final_value = models.TextField(
        blank=True,
        verbose_name=_('Valor Final'),
        help_text=_('Valor final después de resolución')
    )
    
    resolution_notes = models.TextField(
        blank=True,
        verbose_name=_('Notas de Resolución'),
        help_text=_('Justificación para la resolución')
    )
    
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_('Resuelto por')
    )
    
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Resuelto el')
    )
    
    # Impact assessment
    regulatory_impact = models.TextField(
        blank=True,
        verbose_name=_('Impacto Regulatorio'),
        help_text=_('Descripción del impacto regulatorio de la discrepancia')
    )
    
    auto_resolution_suggested = models.BooleanField(
        default=False,
        verbose_name=_('Resolución Automática Sugerida')
    )
    
    class Meta:
        verbose_name = _('Discrepancia SUH')
        verbose_name_plural = _('Discrepancias SUH')
        ordering = ['level', '-created_at']
        indexes = [
            models.Index(fields=['extraction', 'resolution_status']),
            models.Index(fields=['level', 'resolution_status']),
        ]
    
    def __str__(self):
        return f"{self.field_name} - {self.get_level_display()}"
    
    @property
    def requires_manual_resolution(self):
        """Check if discrepancy requires manual resolution."""
        return self.level == 'CRITICAL' and self.resolution_status == 'pending'
    
    def resolve_with_suh(self, user, notes=""):
        """Resolve discrepancy accepting SUH value."""
        self.resolution_status = 'suh_accepted'
        self.final_value = self.suh_value
        self.resolution_notes = notes
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.save()
    
    def resolve_with_qms(self, user, notes=""):
        """Resolve discrepancy keeping QMS value."""
        self.resolution_status = 'qms_kept'
        self.final_value = self.qms_value
        self.resolution_notes = notes
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.save()


class SUHSyncSchedule(FullBaseModel):
    """
    Model to manage automatic synchronization schedules with SUH portal.
    Supports periodic updates to keep QMS data in sync with official registry.
    """
    
    SYNC_FREQUENCIES = [
        ('daily', 'Diario'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
        ('quarterly', 'Trimestral'),
        ('manual', 'Manual'),
    ]
    
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='suh_sync_schedule',
        verbose_name=_('Organización')
    )
    
    # Schedule configuration
    is_active = models.BooleanField(
        default=True,
        verbose_name=_('Activo')
    )
    
    frequency = models.CharField(
        max_length=20,
        choices=SYNC_FREQUENCIES,
        default='monthly',
        verbose_name=_('Frecuencia')
    )
    
    # Timing
    next_sync_date = models.DateTimeField(
        verbose_name=_('Próxima Sincronización')
    )
    
    last_sync_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Última Sincronización')
    )
    
    # Settings
    auto_resolve_minor = models.BooleanField(
        default=False,
        verbose_name=_('Auto-resolver Discrepancias Menores'),
        help_text=_('Resolver automáticamente discrepancias de nivel menor')
    )
    
    notify_on_discrepancies = models.BooleanField(
        default=True,
        verbose_name=_('Notificar Discrepancias'),
        help_text=_('Enviar notificaciones cuando se detecten discrepancias')
    )
    
    # Notification settings
    notification_emails = models.JSONField(
        default=list,
        verbose_name=_('Emails de Notificación'),
        help_text=_('Lista de emails para notificaciones de sincronización')
    )
    
    # Statistics
    total_syncs_completed = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Sincronizaciones Completadas')
    )
    
    total_discrepancies_found = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Discrepancias Encontradas')
    )
    
    class Meta:
        verbose_name = _('Programación Sincronización SUH')
        verbose_name_plural = _('Programaciones Sincronización SUH')
        indexes = [
            models.Index(fields=['is_active', 'next_sync_date']),
            models.Index(fields=['organization']),
        ]
    
    def __str__(self):
        return f"Sync {self.organization.razon_social} - {self.get_frequency_display()}"
    
    def calculate_next_sync(self):
        """Calculate next synchronization date based on frequency."""
        from datetime import timedelta
        
        base_date = self.last_sync_date or timezone.now()
        
        if self.frequency == 'daily':
            self.next_sync_date = base_date + timedelta(days=1)
        elif self.frequency == 'weekly':
            self.next_sync_date = base_date + timedelta(weeks=1)
        elif self.frequency == 'monthly':
            self.next_sync_date = base_date + timedelta(days=30)
        elif self.frequency == 'quarterly':
            self.next_sync_date = base_date + timedelta(days=90)
        else:  # manual
            self.next_sync_date = None
        
        self.save(update_fields=['next_sync_date'])
    
    def is_due_for_sync(self):
        """Check if sync is due."""
        if not self.is_active or not self.next_sync_date:
            return False
        return timezone.now() >= self.next_sync_date
    
    def record_sync_completion(self, discrepancies_count=0):
        """Record completion of a sync operation."""
        self.last_sync_date = timezone.now()
        self.total_syncs_completed += 1
        self.total_discrepancies_found += discrepancies_count
        self.calculate_next_sync()
        self.save(update_fields=[
            'last_sync_date', 
            'total_syncs_completed', 
            'total_discrepancies_found'
        ])

