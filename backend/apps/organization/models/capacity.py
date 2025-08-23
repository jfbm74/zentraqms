"""
SOGCS Capacity Models - Healthcare Facility Installed Capacity Management.

This module contains comprehensive models for managing installed capacity
according to REPS standards and Colombian healthcare regulations.
Complies with Resolution 3100/2019 and SOGCS requirements.
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal

from apps.common.models import FullBaseModel
from .sogcs_sedes import HeadquarterLocation
from .health_services import SedeHealthService


# ============================================================================
# CHOICES DEFINITIONS - REPS CAPACITY GROUPS
# ============================================================================

# Grupos de capacidad según REPS
GRUPO_CAPACIDAD_CHOICES = [
    ('CAMAS', _('Camas')),
    ('CAMILLAS', _('Camillas')),
    ('CONSULTORIOS', _('Consultorios')),
    ('SALAS', _('Salas')),
    ('AMBULANCIAS', _('Ambulancias')),
    ('SILLAS', _('Sillas')),
    ('MESAS', _('Mesas')),
    ('EQUIPOS', _('Equipos Biomédicos')),
    ('OTROS', _('Otros')),
]

# Conceptos de capacidad por grupo - Catálogo REPS oficial
CONCEPTOS_CAMAS = [
    ('1', _('Pediátrica')),
    ('2', _('Adultos')),
    ('29', _('Cuidado Intensivo Pediátrico')),
    ('31', _('Cuidado Intensivo Adultos')),
    ('46', _('Cuidado Intensivo Neonatal')),
    ('61', _('Cuidado Intermedio Pediátrico')),
    ('62', _('Cuidado Intermedio Adultos')),
    ('87', _('Cuidado Intermedio Neonatal')),
    ('103', _('Hospitalización Salud Mental')),
    ('104', _('Hospitalización Psiquiátrica')),
    ('128', _('Quemados Críticos')),
]

CONCEPTOS_CAMILLAS = [
    ('3', _('Observación Adultos Hombres')),
    ('4', _('Observación Adultos Mujeres')),
    ('5', _('Observación Pediátrica')),
    ('30', _('Procedimientos')),
    ('63', _('Sala de Reanimación')),
]

CONCEPTOS_CONSULTORIOS = [
    ('6', _('Urgencias')),
    ('7', _('Consulta Externa')),
    ('8', _('Odontología')),
    ('32', _('Triage')),
    ('47', _('Salud Mental')),
    ('64', _('Terapias')),
    ('88', _('Optometría')),
    ('129', _('Psicología')),
]

CONCEPTOS_SALAS = [
    ('9', _('Cirugía General')),
    ('10', _('Cirugía Especializada')),
    ('33', _('Partos')),
    ('48', _('Expulsivo')),
    ('65', _('Legrados')),
    ('89', _('Endoscopia')),
    ('105', _('Hemodiálisis')),
    ('130', _('Radiología')),
    ('131', _('Laboratorio')),
]

# Modalidades de ambulancia
MODALIDADES_AMBULANCIA = [
    ('TAB', _('Transporte Asistencial Básico')),
    ('TAM', _('Transporte Asistencial Medicalizado')),
    ('TAAV', _('Transporte Asistencial de Alta Velocidad')),
    ('UAT', _('Unidad de Atención de Trauma')),
]

# Estado de capacidad
ESTADO_CAPACIDAD = [
    ('activa', _('Activa')),
    ('inactiva', _('Inactiva')),
    ('mantenimiento', _('En Mantenimiento')),
    ('reparacion', _('En Reparación')),
    ('fuera_servicio', _('Fuera de Servicio')),
]


# ============================================================================
# CAPACITY MODELS
# ============================================================================

class CapacidadInstalada(FullBaseModel):
    """
    Gestión de capacidad instalada según REPS y Resolución 3100/2019.
    
    This model manages the installed capacity of healthcare facilities
    according to REPS standards and Colombian health regulations.
    
    Attributes:
        sede_prestadora: Foreign key to HeadquarterLocation
        health_service: Optional foreign key to related health service
        grupo_capacidad: Capacity group (CAMAS, CONSULTORIOS, etc.)
        codigo_concepto: REPS concept code
        nombre_concepto: REPS concept name/description
        cantidad: Total quantity of this capacity type
        cantidad_habilitada: Quantity enabled according to REPS
        cantidad_funcionando: Quantity currently functioning
    """
    
    # Relaciones
    sede_prestadora = models.ForeignKey(
        HeadquarterLocation,
        on_delete=models.CASCADE,
        related_name='capacidades_instaladas',
        verbose_name=_('Sede Prestadora'),
        help_text=_('Sede donde está instalada esta capacidad')
    )
    
    health_service = models.ForeignKey(
        SedeHealthService,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='capacidades_asociadas',
        verbose_name=_('Servicio Asociado'),
        help_text=_('Servicio de salud asociado a esta capacidad (opcional)')
    )
    
    # Identificación según REPS
    grupo_capacidad = models.CharField(
        max_length=20,
        choices=GRUPO_CAPACIDAD_CHOICES,
        verbose_name=_('Grupo de Capacidad'),
        help_text=_('Grupo de capacidad según clasificación REPS')
    )
    
    codigo_concepto = models.CharField(
        max_length=10,
        verbose_name=_('Código Concepto REPS'),
        help_text=_('Código del concepto según catálogo REPS (ej: 1, 2, 29, 31)')
    )
    
    nombre_concepto = models.CharField(
        max_length=200,
        verbose_name=_('Nombre del Concepto'),
        help_text=_('Descripción del concepto (ej: Pediátrica, Adultos, Urgencias)')
    )
    
    # Cantidades
    cantidad = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(9999)],
        verbose_name=_('Cantidad Total'),
        help_text=_('Cantidad total de elementos de esta capacidad')
    )
    
    cantidad_habilitada = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(9999)],
        verbose_name=_('Cantidad Habilitada'),
        help_text=_('Cantidad habilitada según REPS')
    )
    
    cantidad_funcionando = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(9999)],
        verbose_name=_('Cantidad Funcionando'),
        help_text=_('Cantidad actualmente en funcionamiento')
    )
    
    # Estado
    estado_capacidad = models.CharField(
        max_length=20,
        choices=ESTADO_CAPACIDAD,
        default='activa',
        verbose_name=_('Estado'),
        help_text=_('Estado actual de la capacidad')
    )
    
    # Detalles adicionales para ambulancias y equipos
    numero_placa = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_('Número de Placa'),
        help_text=_('Placa del vehículo (solo para ambulancias)')
    )
    
    modalidad_ambulancia = models.CharField(
        max_length=20,
        choices=MODALIDADES_AMBULANCIA,
        blank=True,
        verbose_name=_('Modalidad de Ambulancia'),
        help_text=_('Tipo de ambulancia (TAB, TAM, etc.)')
    )
    
    modelo_vehiculo = models.CharField(
        max_length=4,
        blank=True,
        verbose_name=_('Modelo del Vehículo'),
        help_text=_('Año modelo del vehículo')
    )
    
    numero_tarjeta_propiedad = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Número Tarjeta de Propiedad'),
        help_text=_('Número de tarjeta de propiedad del vehículo')
    )
    
    # Especificaciones técnicas (para equipos)
    marca = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Marca'),
        help_text=_('Marca del equipo o elemento')
    )
    
    modelo_equipo = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Modelo del Equipo'),
        help_text=_('Modelo específico del equipo')
    )
    
    numero_serie = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Número de Serie'),
        help_text=_('Número de serie del equipo')
    )
    
    # Indicadores de desempeño
    porcentaje_ocupacion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name=_('Porcentaje de Ocupación'),
        help_text=_('Porcentaje promedio de ocupación (%)')
    )
    
    horas_funcionamiento_dia = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(24)],
        verbose_name=_('Horas de Funcionamiento/Día'),
        help_text=_('Horas de funcionamiento promedio por día')
    )
    
    dias_funcionamiento_semana = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(7)],
        verbose_name=_('Días de Funcionamiento/Semana'),
        help_text=_('Días de funcionamiento por semana')
    )
    
    # Metadata REPS
    fecha_corte_reps = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Fecha de Corte REPS'),
        help_text=_('Fecha de corte de los datos REPS')
    )
    
    sincronizado_reps = models.BooleanField(
        default=False,
        verbose_name=_('Sincronizado con REPS'),
        help_text=_('Indica si está sincronizado con portal REPS')
    )
    
    fecha_ultimo_reporte = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Fecha Último Reporte'),
        help_text=_('Fecha del último reporte enviado a SuperSalud')
    )
    
    # Observaciones y notas
    observaciones = models.TextField(
        blank=True,
        verbose_name=_('Observaciones'),
        help_text=_('Observaciones adicionales sobre esta capacidad')
    )
    
    class Meta:
        db_table = 'sogcs_capacidad_instalada'
        verbose_name = _('Capacidad Instalada')
        verbose_name_plural = _('Capacidades Instaladas')
        unique_together = [
            ('sede_prestadora', 'codigo_concepto', 'numero_placa'),
        ]
        indexes = [
            models.Index(fields=['grupo_capacidad'], name='idx_capacidad_grupo'),
            models.Index(fields=['sede_prestadora', 'grupo_capacidad'], name='idx_capacidad_sede_grupo'),
            models.Index(fields=['codigo_concepto'], name='idx_capacidad_concepto'),
            models.Index(fields=['estado_capacidad'], name='idx_capacidad_estado'),
            models.Index(fields=['sincronizado_reps'], name='idx_capacidad_sync'),
        ]
        ordering = ['grupo_capacidad', 'codigo_concepto', 'nombre_concepto']
    
    def __str__(self):
        return f"{self.sede_prestadora.name} - {self.nombre_concepto} ({self.cantidad})"
    
    def clean(self):
        """
        Custom validation for capacity consistency.
        """
        super().clean()
        
        # Validar que cantidad_funcionando <= cantidad
        if self.cantidad_funcionando > self.cantidad:
            raise ValidationError({
                'cantidad_funcionando': _('La cantidad funcionando no puede ser mayor que la cantidad total')
            })
        
        # Validar que cantidad_habilitada <= cantidad
        if self.cantidad_habilitada > self.cantidad:
            raise ValidationError({
                'cantidad_habilitada': _('La cantidad habilitada no puede ser mayor que la cantidad total')
            })
        
        # Validar campos obligatorios para ambulancias
        if self.grupo_capacidad == 'AMBULANCIAS':
            if not self.numero_placa:
                raise ValidationError({
                    'numero_placa': _('El número de placa es obligatorio para ambulancias')
                })
            if not self.modalidad_ambulancia:
                raise ValidationError({
                    'modalidad_ambulancia': _('La modalidad es obligatoria para ambulancias')
                })
        
        # Validar coherencia de porcentaje de ocupación
        if self.porcentaje_ocupacion is not None:
            if self.porcentaje_ocupacion < 0 or self.porcentaje_ocupacion > 100:
                raise ValidationError({
                    'porcentaje_ocupacion': _('El porcentaje de ocupación debe estar entre 0 y 100')
                })
    
    def save(self, *args, **kwargs):
        """
        Override save to perform additional validations and calculations.
        """
        self.clean()
        
        # Auto-calculate cantidad_funcionando if not set for active capacity
        if self.estado_capacidad == 'activa' and self.cantidad_funcionando == 0:
            self.cantidad_funcionando = self.cantidad_habilitada or self.cantidad
        
        super().save(*args, **kwargs)
    
    @property
    def porcentaje_habilitacion(self):
        """
        Calculate the percentage of enabled capacity.
        """
        if self.cantidad == 0:
            return 0
        return (self.cantidad_habilitada / self.cantidad) * 100
    
    @property
    def porcentaje_funcionamiento(self):
        """
        Calculate the percentage of functioning capacity.
        """
        if self.cantidad == 0:
            return 0
        return (self.cantidad_funcionando / self.cantidad) * 100
    
    @property
    def necesita_actualizacion_reps(self):
        """
        Determine if this capacity needs REPS synchronization.
        """
        if not self.fecha_corte_reps:
            return True
        
        # Consider outdated if older than 30 days
        return (timezone.now() - self.fecha_corte_reps).days > 30
    
    @property
    def es_ambulancia(self):
        """Check if this capacity is an ambulance."""
        return self.grupo_capacidad == 'AMBULANCIAS'
    
    @property
    def es_equipo_biomedico(self):
        """Check if this capacity is biomedical equipment."""
        return self.grupo_capacidad == 'EQUIPOS'
    
    @property
    def requiere_placa(self):
        """Check if this capacity requires license plate."""
        return self.grupo_capacidad in ['AMBULANCIAS']
    
    def get_concepto_display_complete(self):
        """
        Get complete display name including group and concept.
        """
        grupo_display = dict(GRUPO_CAPACIDAD_CHOICES).get(self.grupo_capacidad, self.grupo_capacidad)
        return f"{grupo_display} - {self.nombre_concepto}"


# ============================================================================
# CAPACITY HISTORY AND AUDIT
# ============================================================================

class CapacidadHistorial(FullBaseModel):
    """
    Historical tracking of capacity changes for audit and compliance.
    """
    
    capacidad = models.ForeignKey(
        CapacidadInstalada,
        on_delete=models.CASCADE,
        related_name='historial',
        verbose_name=_('Capacidad')
    )
    
    accion = models.CharField(
        max_length=20,
        choices=[
            ('creacion', _('Creación')),
            ('modificacion', _('Modificación')),
            ('eliminacion', _('Eliminación')),
            ('importacion', _('Importación REPS')),
            ('sincronizacion', _('Sincronización')),
        ],
        verbose_name=_('Acción')
    )
    
    campo_modificado = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Campo Modificado'),
        help_text=_('Campo que fue modificado (solo para modificaciones)')
    )
    
    valor_anterior = models.TextField(
        blank=True,
        verbose_name=_('Valor Anterior'),
        help_text=_('Valor antes de la modificación')
    )
    
    valor_nuevo = models.TextField(
        blank=True,
        verbose_name=_('Valor Nuevo'),
        help_text=_('Valor después de la modificación')
    )
    
    justificacion = models.TextField(
        blank=True,
        verbose_name=_('Justificación'),
        help_text=_('Justificación del cambio')
    )
    
    origen_cambio = models.CharField(
        max_length=20,
        choices=[
            ('manual', _('Manual')),
            ('importacion', _('Importación')),
            ('sincronizacion', _('Sincronización')),
            ('automatico', _('Automático')),
        ],
        default='manual',
        verbose_name=_('Origen del Cambio')
    )
    
    class Meta:
        db_table = 'sogcs_capacidad_historial'
        verbose_name = _('Historial de Capacidad')
        verbose_name_plural = _('Historiales de Capacidad')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['capacidad', '-created_at'], name='idx_historial_capacidad_fecha'),
            models.Index(fields=['accion'], name='idx_historial_accion'),
        ]
    
    def __str__(self):
        return f"{self.capacidad} - {self.accion} - {self.created_at}"


# ============================================================================
# CAPACITY IMPORT LOG
# ============================================================================

class CapacidadImportLog(FullBaseModel):
    """
    Log of capacity import operations from REPS files.
    """
    
    sede_prestadora = models.ForeignKey(
        HeadquarterLocation,
        on_delete=models.CASCADE,
        related_name='import_logs_capacidad',
        verbose_name=_('Sede Prestadora')
    )
    
    nombre_archivo = models.CharField(
        max_length=255,
        verbose_name=_('Nombre del Archivo'),
        help_text=_('Nombre del archivo importado')
    )
    
    tamaño_archivo = models.PositiveBigIntegerField(
        verbose_name=_('Tamaño del Archivo'),
        help_text=_('Tamaño del archivo en bytes')
    )
    
    formato_archivo = models.CharField(
        max_length=10,
        choices=[
            ('xls', _('Excel (.xls)')),
            ('xlsx', _('Excel (.xlsx)')),
            ('csv', _('CSV')),
            ('html', _('HTML')),
        ],
        verbose_name=_('Formato del Archivo')
    )
    
    total_registros = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Total de Registros'),
        help_text=_('Total de registros en el archivo')
    )
    
    registros_importados = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Registros Importados'),
        help_text=_('Cantidad de registros importados exitosamente')
    )
    
    registros_actualizados = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Registros Actualizados'),
        help_text=_('Cantidad de registros actualizados')
    )
    
    registros_con_error = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Registros con Error'),
        help_text=_('Cantidad de registros que fallaron al importar')
    )
    
    estado_importacion = models.CharField(
        max_length=25,
        choices=[
            ('iniciada', _('Iniciada')),
            ('procesando', _('Procesando')),
            ('completada', _('Completada')),
            ('completada_con_errores', _('Completada con Errores')),
            ('fallida', _('Fallida')),
        ],
        default='iniciada',
        verbose_name=_('Estado de Importación')
    )
    
    errores = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_('Errores'),
        help_text=_('Lista de errores encontrados durante la importación')
    )
    
    advertencias = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_('Advertencias'),
        help_text=_('Lista de advertencias durante la importación')
    )
    
    estadisticas = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_('Estadísticas'),
        help_text=_('Estadísticas detalladas de la importación')
    )
    
    fecha_inicio = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Fecha de Inicio')
    )
    
    fecha_finalizacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Fecha de Finalización')
    )
    
    duracion_segundos = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name=_('Duración (segundos)')
    )
    
    class Meta:
        db_table = 'sogcs_capacidad_import_log'
        verbose_name = _('Log de Importación de Capacidad')
        verbose_name_plural = _('Logs de Importación de Capacidad')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sede_prestadora', '-created_at'], name='idx_import_log_sede_fecha'),
            models.Index(fields=['estado_importacion'], name='idx_import_log_estado'),
        ]
    
    def __str__(self):
        return f"{self.sede_prestadora.name} - {self.nombre_archivo} - {self.estado_importacion}"
    
    @property
    def porcentaje_exito(self):
        """Calculate success percentage."""
        if self.total_registros == 0:
            return 0
        return (self.registros_importados / self.total_registros) * 100
    
    @property
    def tiene_errores(self):
        """Check if import has errors."""
        return self.registros_con_error > 0 or len(self.errores) > 0
    
    @property
    def tiempo_procesamiento(self):
        """Get processing time as string."""
        if self.duracion_segundos is None:
            return 'N/A'
        
        hours = self.duracion_segundos // 3600
        minutes = (self.duracion_segundos % 3600) // 60
        seconds = self.duracion_segundos % 60
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"