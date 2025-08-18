"""
SOGCS SEDES Models - Enhanced Healthcare Facility Management.

This module contains comprehensive models for managing healthcare facilities (SEDES)
and their enabled services according to Colombian health regulations (REPS/SUH).
Complies with Resolution 3100/2019 and SOGCS requirements.
"""

from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal

from apps.common.models import FullBaseModel
from .health import HealthOrganization

# ============================================================================
# CHOICES DEFINITIONS
# ============================================================================

# Headquarters Types (Tipos de Sede)
SEDE_TYPES = [
    ('principal', _('Sede Principal')),
    ('satelite', _('Sede Satélite')),
    ('movil', _('Unidad Móvil')),
    ('domiciliaria', _('Atención Domiciliaria')),
    ('telemedicina', _('Centro de Telemedicina')),
]

# Habilitation Status
HABILITATION_STATUS = [
    ('habilitada', _('Habilitada')),
    ('en_proceso', _('En Proceso')),
    ('suspendida', _('Suspendida')),
    ('cancelada', _('Cancelada')),
    ('vencida', _('Vencida')),
]

# Operational Status
OPERATIONAL_STATUS = [
    ('activa', _('Activa')),
    ('inactiva', _('Inactiva')),
    ('temporal_cerrada', _('Cerrada Temporalmente')),
    ('permanente_cerrada', _('Cerrada Permanentemente')),
    ('en_construccion', _('En Construcción')),
]

# Sync Status
SYNC_STATUS = [
    ('pending', _('Pendiente')),
    ('in_progress', _('En Proceso')),
    ('success', _('Exitoso')),
    ('failed', _('Fallido')),
    ('partial', _('Parcial')),
]

# Service Groups (según Res. 3100/2019)
SERVICE_GROUPS = [
    ('consulta_externa', _('Consulta Externa')),
    ('apoyo_diagnostico', _('Apoyo Diagnóstico y Complementación Terapéutica')),
    ('internacion', _('Internación')),
    ('quirurgicos', _('Quirúrgicos')),
    ('urgencias', _('Urgencias')),
    ('transporte_asistencial', _('Transporte Asistencial')),
    ('otros_servicios', _('Otros Servicios')),
    ('proteccion_especifica', _('Protección Específica y Detección Temprana')),
]

# Complexity Levels
COMPLEXITY_LEVELS = [
    (1, _('Baja Complejidad')),
    (2, _('Media Complejidad')),
    (3, _('Alta Complejidad')),
    (4, _('Máxima Complejidad')),
]

# Service Habilitation Status
SERVICE_HABILITATION_STATUS = [
    ('activo', _('Activo')),
    ('suspendido', _('Suspendido')),
    ('cancelado', _('Cancelado')),
    ('en_renovacion', _('En Renovación')),
    ('vencido', _('Vencido')),
]

# Habilitation Process Types
PROCESS_TYPES = [
    ('nueva', _('Nueva Habilitación')),
    ('renovacion', _('Renovación')),
    ('modificacion', _('Modificación')),
    ('ampliacion', _('Ampliación')),
]

# Process Status
HABILITATION_PROCESS_STATUS = [
    ('iniciado', _('Iniciado')),
    ('documentacion', _('Recopilación de Documentos')),
    ('autoevaluacion', _('Autoevaluación')),
    ('radicado', _('Radicado')),
    ('en_revision', _('En Revisión')),
    ('visita_programada', _('Visita Programada')),
    ('visita_realizada', _('Visita Realizada')),
    ('concepto_emitido', _('Concepto Emitido')),
    ('aprobado', _('Aprobado')),
    ('rechazado', _('Rechazado')),
    ('desistido', _('Desistido')),
]

# Process Phases
PROCESS_PHASES = [
    ('preparacion', _('Preparación')),
    ('autoevaluacion', _('Autoevaluación')),
    ('radicacion', _('Radicación')),
    ('verificacion', _('Verificación')),
    ('resolucion', _('Resolución')),
    ('seguimiento', _('Seguimiento')),
]

# Resolution Results
RESOLUTION_RESULTS = [
    ('aprobado', _('Aprobado')),
    ('aprobado_condicionado', _('Aprobado con Condiciones')),
    ('rechazado', _('Rechazado')),
    ('desistido', _('Desistido')),
]


# ============================================================================
# MAIN MODELS
# ============================================================================

class HeadquarterLocation(FullBaseModel):
    """
    Enhanced model for healthcare facility headquarters (SEDES).
    
    This model represents physical locations where health services are provided,
    fully integrated with REPS (Registro Especial de Prestadores de Servicios de Salud)
    and compliant with Resolution 3100/2019 requirements.
    
    Attributes:
        organization: Link to HealthOrganization
        reps_code: Unique REPS identifier for the headquarters
        name: Official name of the headquarters
        sede_type: Type of facility (principal, satellite, mobile, etc.)
        ... (comprehensive location, contact, habilitation, and capacity fields)
    """
    
    # === IDENTIFICATION ===
    organization = models.ForeignKey(
        HealthOrganization,
        on_delete=models.CASCADE,
        related_name='headquarters_locations',
        verbose_name=_('organización de salud'),
        help_text=_('Organización de salud a la que pertenece esta sede.')
    )
    
    reps_code = models.CharField(
        _('código REPS sede'),
        max_length=20,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[0-9A-Z]{4,20}$',
                message=_('Código REPS debe contener solo números y letras mayúsculas.')
            )
        ],
        help_text=_('Código único REPS asignado a esta sede.')
    )
    
    # === BASIC INFORMATION ===
    name = models.CharField(
        _('nombre de la sede'),
        max_length=255,
        help_text=_('Nombre oficial de la sede según REPS.')
    )
    
    sede_type = models.CharField(
        _('tipo de sede'),
        max_length=20,
        choices=SEDE_TYPES,
        default='principal',
        help_text=_('Clasificación de la sede según modalidad de atención.')
    )
    
    # === GEOGRAPHIC LOCATION ===
    department_code = models.CharField(
        _('código departamento'),
        max_length=2,
        validators=[
            RegexValidator(
                regex=r'^\d{2}$',
                message=_('Código de departamento debe tener 2 dígitos.')
            )
        ],
        help_text=_('Código DIVIPOLA del departamento.')
    )
    
    department_name = models.CharField(
        _('nombre departamento'),
        max_length=100,
        help_text=_('Nombre del departamento.')
    )
    
    municipality_code = models.CharField(
        _('código municipio'),
        max_length=5,
        validators=[
            RegexValidator(
                regex=r'^\d{5}$',
                message=_('Código de municipio debe tener 5 dígitos.')
            )
        ],
        help_text=_('Código DIVIPOLA del municipio.')
    )
    
    municipality_name = models.CharField(
        _('nombre municipio'),
        max_length=100,
        help_text=_('Nombre del municipio.')
    )
    
    address = models.TextField(
        _('dirección'),
        help_text=_('Dirección completa de la sede.')
    )
    
    postal_code = models.CharField(
        _('código postal'),
        max_length=10,
        blank=True,
        help_text=_('Código postal de la ubicación.')
    )
    
    latitude = models.DecimalField(
        _('latitud'),
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal('-90.0')),
            MaxValueValidator(Decimal('90.0'))
        ],
        help_text=_('Coordenada de latitud.')
    )
    
    longitude = models.DecimalField(
        _('longitud'),
        max_digits=11,
        decimal_places=7,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal('-180.0')),
            MaxValueValidator(Decimal('180.0'))
        ],
        help_text=_('Coordenada de longitud.')
    )
    
    # === CONTACT INFORMATION ===
    phone_primary = models.CharField(
        _('teléfono principal'),
        max_length=20,
        validators=[
            RegexValidator(
                regex=r'^\+?[\d\s\-\(\)ext.]{7,25}$',
                message=_('Formato de teléfono inválido.')
            )
        ],
        help_text=_('Teléfono principal de contacto.')
    )
    
    phone_secondary = models.CharField(
        _('teléfono secundario'),
        max_length=20,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?[\d\s\-\(\)ext.]{7,25}$',
                message=_('Formato de teléfono inválido.')
            )
        ],
        help_text=_('Teléfono secundario de contacto.')
    )
    
    email = models.EmailField(
        _('correo electrónico'),
        help_text=_('Correo electrónico institucional de la sede.')
    )
    
    administrative_contact = models.CharField(
        _('contacto administrativo'),
        max_length=255,
        help_text=_('Nombre del responsable administrativo de la sede.')
    )
    
    administrative_contact_phone = models.CharField(
        _('teléfono contacto administrativo'),
        max_length=20,
        blank=True,
        help_text=_('Teléfono del contacto administrativo.')
    )
    
    administrative_contact_email = models.EmailField(
        _('email contacto administrativo'),
        blank=True,
        help_text=_('Email del contacto administrativo.')
    )
    
    # === HABILITATION STATUS ===
    habilitation_status = models.CharField(
        _('estado de habilitación'),
        max_length=20,
        choices=HABILITATION_STATUS,
        default='en_proceso',
        help_text=_('Estado actual de habilitación según REPS.')
    )
    
    habilitation_date = models.DateField(
        _('fecha de habilitación'),
        null=True,
        blank=True,
        help_text=_('Fecha de habilitación inicial.')
    )
    
    habilitation_resolution = models.CharField(
        _('resolución de habilitación'),
        max_length=50,
        blank=True,
        help_text=_('Número de resolución que otorga la habilitación.')
    )
    
    next_renewal_date = models.DateField(
        _('fecha próxima renovación'),
        null=True,
        blank=True,
        help_text=_('Fecha programada para renovación de habilitación.')
    )
    
    # === OPERATIONAL CONTROL ===
    operational_status = models.CharField(
        _('estado operacional'),
        max_length=25,
        choices=OPERATIONAL_STATUS,
        default='activa',
        help_text=_('Estado operativo actual de la sede.')
    )
    
    opening_date = models.DateField(
        _('fecha de apertura'),
        null=True,
        blank=True,
        help_text=_('Fecha de inicio de operaciones.')
    )
    
    closing_date = models.DateField(
        _('fecha de cierre'),
        null=True,
        blank=True,
        help_text=_('Fecha de cierre (si aplica).')
    )
    
    suspension_start = models.DateField(
        _('inicio de suspensión'),
        null=True,
        blank=True,
        help_text=_('Fecha de inicio de suspensión temporal.')
    )
    
    suspension_end = models.DateField(
        _('fin de suspensión'),
        null=True,
        blank=True,
        help_text=_('Fecha de fin de suspensión temporal.')
    )
    
    suspension_reason = models.TextField(
        _('razón de suspensión'),
        blank=True,
        help_text=_('Motivo de la suspensión temporal.')
    )
    
    # === INSTALLED CAPACITY ===
    total_beds = models.IntegerField(
        _('total de camas'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Número total de camas instaladas.')
    )
    
    icu_beds = models.IntegerField(
        _('camas UCI'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Número de camas de UCI.')
    )
    
    emergency_beds = models.IntegerField(
        _('camas de urgencias'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Número de camas de urgencias.')
    )
    
    surgery_rooms = models.IntegerField(
        _('quirófanos'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Número de quirófanos.')
    )
    
    consultation_rooms = models.IntegerField(
        _('consultorios'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Número de consultorios.')
    )
    
    # === REPS SYNCHRONIZATION METADATA ===
    last_reps_sync = models.DateTimeField(
        _('última sincronización REPS'),
        null=True,
        blank=True,
        help_text=_('Fecha y hora de la última sincronización con REPS.')
    )
    
    sync_status = models.CharField(
        _('estado de sincronización'),
        max_length=15,
        choices=SYNC_STATUS,
        default='pending',
        help_text=_('Estado actual de sincronización con REPS.')
    )
    
    sync_errors = models.JSONField(
        _('errores de sincronización'),
        default=list,
        blank=True,
        help_text=_('Lista de errores encontrados en la última sincronización.')
    )
    
    reps_data = models.JSONField(
        _('datos REPS'),
        default=dict,
        blank=True,
        help_text=_('Datos adicionales obtenidos de REPS.')
    )
    
    # === ADDITIONAL FIELDS ===
    is_main_headquarters = models.BooleanField(
        _('es sede principal'),
        default=False,
        help_text=_('Indica si es la sede principal de la organización.')
    )
    
    working_hours = models.JSONField(
        _('horario de atención'),
        default=dict,
        blank=True,
        help_text=_('Horario de atención por día de la semana.')
    )
    
    has_emergency_service = models.BooleanField(
        _('tiene servicio de urgencias'),
        default=False,
        help_text=_('Indica si la sede cuenta con servicio de urgencias.')
    )
    
    observations = models.TextField(
        _('observaciones'),
        blank=True,
        help_text=_('Observaciones adicionales sobre la sede.')
    )
    
    class Meta:
        verbose_name = _('sede prestadora SOGCS')
        verbose_name_plural = _('sedes prestadoras SOGCS')
        ordering = ['organization', 'name']
        indexes = [
            models.Index(fields=['organization', 'operational_status']),
            models.Index(fields=['reps_code']),
            models.Index(fields=['habilitation_status']),
            models.Index(fields=['department_code', 'municipality_code']),
            models.Index(fields=['sync_status']),
            models.Index(fields=['next_renewal_date']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['organization'],
                condition=models.Q(is_main_headquarters=True, deleted_at__isnull=True),
                name='unique_main_headquarters_per_org'
            ),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.reps_code})"
    
    def clean(self):
        """Validate headquarters data."""
        super().clean()
        
        # Validate that only one main headquarters exists per organization
        if self.is_main_headquarters:
            existing_main = HeadquarterLocation.objects.filter(
                organization=self.organization,
                is_main_headquarters=True,
                deleted_at__isnull=True
            ).exclude(pk=self.pk)
            
            if existing_main.exists():
                raise ValidationError({
                    'is_main_headquarters': _('Ya existe una sede principal para esta organización.')
                })
        
        # Validate suspension dates
        if self.suspension_start and self.suspension_end:
            if self.suspension_end <= self.suspension_start:
                raise ValidationError({
                    'suspension_end': _('La fecha de fin debe ser posterior a la fecha de inicio.')
                })
        
        # Validate capacity values
        if self.icu_beds > self.total_beds:
            raise ValidationError({
                'icu_beds': _('Las camas UCI no pueden exceder el total de camas.')
            })
    
    @property
    def is_operational(self):
        """Check if headquarters is currently operational."""
        return self.operational_status == 'activa' and self.habilitation_status == 'habilitada'
    
    @property
    def days_until_renewal(self):
        """Calculate days until habilitation renewal."""
        if not self.next_renewal_date:
            return None
        
        today = timezone.now().date()
        if self.next_renewal_date > today:
            return (self.next_renewal_date - today).days
        return 0
    
    @property
    def complete_address(self):
        """Return formatted complete address."""
        return f"{self.address}, {self.municipality_name}, {self.department_name}"
    
    def needs_renewal_alert(self, days_threshold=90):
        """Check if renewal alert is needed."""
        days = self.days_until_renewal
        if days is None:
            return False
        return 0 < days <= days_threshold


class EnabledHealthService(FullBaseModel):
    """
    Model for health services enabled at each headquarters.
    
    Represents specific health services that are authorized and enabled
    at a headquarters location, with full compliance tracking for
    Resolution 3100/2019 requirements.
    
    Attributes:
        headquarters: Link to HeadquarterLocation
        service_code: REPS service code
        service_name: Official name of the service
        ... (comprehensive service configuration and compliance fields)
    """
    
    # === IDENTIFICATION ===
    headquarters = models.ForeignKey(
        HeadquarterLocation,
        on_delete=models.CASCADE,
        related_name='enabled_services',
        verbose_name=_('sede'),
        help_text=_('Sede donde se presta el servicio.')
    )
    
    service_code = models.CharField(
        _('código del servicio'),
        max_length=10,
        validators=[
            RegexValidator(
                regex=r'^\d{3,4}$',
                message=_('El código del servicio debe tener 3 o 4 dígitos.')
            )
        ],
        help_text=_('Código REPS del servicio según Res. 3100/2019.')
    )
    
    cups_code = models.CharField(
        _('código CUPS'),
        max_length=10,
        blank=True,
        help_text=_('Código CUPS asociado al servicio.')
    )
    
    # === SERVICE DESCRIPTION ===
    service_name = models.CharField(
        _('nombre del servicio'),
        max_length=255,
        help_text=_('Nombre oficial del servicio de salud.')
    )
    
    service_group = models.CharField(
        _('grupo del servicio'),
        max_length=30,
        choices=SERVICE_GROUPS,
        help_text=_('Grupo al que pertenece el servicio según Res. 3100/2019.')
    )
    
    complexity_level = models.IntegerField(
        _('nivel de complejidad'),
        choices=COMPLEXITY_LEVELS,
        help_text=_('Nivel de complejidad del servicio.')
    )
    
    # === SERVICE MODALITIES ===
    intramural = models.BooleanField(
        _('intramural'),
        default=False,
        help_text=_('Servicio prestado dentro de las instalaciones.')
    )
    
    extramural = models.BooleanField(
        _('extramural'),
        default=False,
        help_text=_('Servicio prestado fuera de las instalaciones.')
    )
    
    domiciliary = models.BooleanField(
        _('domiciliario'),
        default=False,
        help_text=_('Servicio prestado en domicilio.')
    )
    
    telemedicine = models.BooleanField(
        _('telemedicina'),
        default=False,
        help_text=_('Servicio prestado por telemedicina.')
    )
    
    reference_center = models.BooleanField(
        _('centro de referencia'),
        default=False,
        help_text=_('Es centro de referencia para este servicio.')
    )
    
    # === HABILITATION ===
    habilitation_status = models.CharField(
        _('estado de habilitación'),
        max_length=20,
        choices=SERVICE_HABILITATION_STATUS,
        default='activo',
        help_text=_('Estado actual de habilitación del servicio.')
    )
    
    habilitation_date = models.DateField(
        _('fecha de habilitación'),
        help_text=_('Fecha de habilitación del servicio.')
    )
    
    habilitation_expiry = models.DateField(
        _('fecha de vencimiento'),
        help_text=_('Fecha de vencimiento de la habilitación.')
    )
    
    habilitation_act = models.CharField(
        _('acto administrativo'),
        max_length=50,
        help_text=_('Número del acto administrativo de habilitación.')
    )
    
    distinctive_code = models.CharField(
        _('código distintivo'),
        max_length=20,
        unique=True,
        help_text=_('Código distintivo único del servicio.')
    )
    
    # === OPERATIONAL CAPACITY ===
    installed_capacity = models.JSONField(
        _('capacidad instalada'),
        default=dict,
        help_text=_('Capacidad instalada por tipo de recurso.')
    )
    
    operational_capacity = models.JSONField(
        _('capacidad operativa'),
        default=dict,
        help_text=_('Capacidad operativa efectiva.')
    )
    
    monthly_production = models.IntegerField(
        _('producción mensual'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Producción mensual promedio del servicio.')
    )
    
    # === HUMAN RESOURCES ===
    required_professionals = models.JSONField(
        _('profesionales requeridos'),
        default=dict,
        help_text=_('Profesionales requeridos por tipo según normativa.')
    )
    
    current_professionals = models.JSONField(
        _('profesionales actuales'),
        default=dict,
        help_text=_('Profesionales actualmente asignados.')
    )
    
    # === INFRASTRUCTURE AND EQUIPMENT ===
    infrastructure_compliance = models.DecimalField(
        _('cumplimiento infraestructura'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text=_('Porcentaje de cumplimiento de infraestructura (0-100).')
    )
    
    equipment_compliance = models.DecimalField(
        _('cumplimiento dotación'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text=_('Porcentaje de cumplimiento de dotación (0-100).')
    )
    
    medication_compliance = models.DecimalField(
        _('cumplimiento medicamentos'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text=_('Porcentaje de cumplimiento de medicamentos (0-100).')
    )
    
    # === SPECIFIC STANDARDS ===
    specific_standards = models.JSONField(
        _('estándares específicos'),
        default=dict,
        help_text=_('Estándares específicos según Res. 3100/2019.')
    )
    
    interdependencies = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='dependent_services',
        verbose_name=_('interdependencias'),
        help_text=_('Servicios de los que depende este servicio.')
    )
    
    # === QUALITY CONTROL ===
    last_self_evaluation = models.DateField(
        _('última autoevaluación'),
        null=True,
        blank=True,
        help_text=_('Fecha de la última autoevaluación.')
    )
    
    self_evaluation_score = models.DecimalField(
        _('puntaje autoevaluación'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text=_('Puntaje de la última autoevaluación (0-100).')
    )
    
    last_external_audit = models.DateField(
        _('última auditoría externa'),
        null=True,
        blank=True,
        help_text=_('Fecha de la última auditoría externa.')
    )
    
    external_audit_score = models.DecimalField(
        _('puntaje auditoría externa'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text=_('Puntaje de la última auditoría externa (0-100).')
    )
    
    # === QUALITY INDICATORS (Res. 256/2016) ===
    quality_indicators = models.JSONField(
        _('indicadores de calidad'),
        default=dict,
        help_text=_('Indicadores de calidad según Res. 256/2016.')
    )
    
    patient_safety_events = models.IntegerField(
        _('eventos de seguridad del paciente'),
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_('Número de eventos adversos de seguridad del paciente.')
    )
    
    # === ADDITIONAL FIELDS ===
    service_hours = models.JSONField(
        _('horario del servicio'),
        default=dict,
        blank=True,
        help_text=_('Horario de atención del servicio.')
    )
    
    requires_authorization = models.BooleanField(
        _('requiere autorización'),
        default=False,
        help_text=_('Indica si el servicio requiere autorización previa.')
    )
    
    observations = models.TextField(
        _('observaciones'),
        blank=True,
        help_text=_('Observaciones adicionales sobre el servicio.')
    )
    
    class Meta:
        verbose_name = _('servicio habilitado')
        verbose_name_plural = _('servicios habilitados')
        ordering = ['headquarters', 'service_group', 'service_name']
        unique_together = [['headquarters', 'service_code']]
        indexes = [
            models.Index(fields=['service_code', 'habilitation_status']),
            models.Index(fields=['headquarters', 'complexity_level']),
            models.Index(fields=['habilitation_expiry']),
            models.Index(fields=['service_group']),
            models.Index(fields=['distinctive_code']),
        ]
    
    def __str__(self):
        return f"{self.service_code} - {self.service_name}"
    
    def clean(self):
        """Validate service data."""
        super().clean()
        
        # Validate that at least one modality is selected
        if not any([self.intramural, self.extramural, self.domiciliary, self.telemedicine]):
            raise ValidationError({
                'intramural': _('Debe seleccionar al menos una modalidad de prestación.')
            })
        
        # Validate expiry date is after habilitation date
        if self.habilitation_expiry and self.habilitation_date:
            if self.habilitation_expiry <= self.habilitation_date:
                raise ValidationError({
                    'habilitation_expiry': _('La fecha de vencimiento debe ser posterior a la fecha de habilitación.')
                })
        
        # Validate compliance percentages
        compliance_fields = ['infrastructure_compliance', 'equipment_compliance', 'medication_compliance']
        for field in compliance_fields:
            value = getattr(self, field)
            if value and (value < 0 or value > 100):
                raise ValidationError({
                    field: _('El porcentaje debe estar entre 0 y 100.')
                })
    
    @property
    def is_valid(self):
        """Check if service habilitation is currently valid."""
        if self.habilitation_status != 'activo':
            return False
        
        today = timezone.now().date()
        return self.habilitation_expiry >= today
    
    @property
    def days_until_expiry(self):
        """Calculate days until habilitation expires."""
        today = timezone.now().date()
        if self.habilitation_expiry > today:
            return (self.habilitation_expiry - today).days
        return 0
    
    @property
    def overall_compliance(self):
        """Calculate overall compliance percentage."""
        compliance_values = [
            float(self.infrastructure_compliance),
            float(self.equipment_compliance),
            float(self.medication_compliance)
        ]
        return sum(compliance_values) / len(compliance_values)
    
    def needs_renewal_alert(self, days_threshold=90):
        """Check if service needs renewal alert."""
        days = self.days_until_expiry
        return 0 < days <= days_threshold
    
    def get_missing_dependencies(self):
        """Get list of missing service dependencies."""
        missing = []
        for dependency in self.interdependencies.all():
            if not dependency.is_valid:
                missing.append(dependency)
        return missing


class ServiceHabilitationProcess(FullBaseModel):
    """
    Model for tracking habilitation processes for new or renewed services.
    
    Manages the complete workflow of service habilitation according to
    Resolution 3100/2019 Chapter II requirements.
    
    Attributes:
        headquarters: Link to HeadquarterLocation
        service_code: Service code being habilitated
        process_type: Type of process (new, renewal, modification)
        ... (comprehensive process tracking fields)
    """
    
    # === PROCESS IDENTIFICATION ===
    headquarters = models.ForeignKey(
        HeadquarterLocation,
        on_delete=models.CASCADE,
        related_name='habilitation_processes',
        verbose_name=_('sede'),
        help_text=_('Sede donde se habilitará el servicio.')
    )
    
    service_code = models.CharField(
        _('código del servicio'),
        max_length=10,
        help_text=_('Código del servicio a habilitar.')
    )
    
    service_name = models.CharField(
        _('nombre del servicio'),
        max_length=255,
        help_text=_('Nombre del servicio a habilitar.')
    )
    
    process_type = models.CharField(
        _('tipo de proceso'),
        max_length=20,
        choices=PROCESS_TYPES,
        help_text=_('Tipo de proceso de habilitación.')
    )
    
    # === PROCESS STATUS ===
    current_status = models.CharField(
        _('estado actual'),
        max_length=20,
        choices=HABILITATION_PROCESS_STATUS,
        default='iniciado',
        help_text=_('Estado actual del proceso.')
    )
    
    current_phase = models.CharField(
        _('fase actual'),
        max_length=20,
        choices=PROCESS_PHASES,
        default='preparacion',
        help_text=_('Fase actual del proceso.')
    )
    
    # === DOCUMENTATION ===
    required_documents = models.JSONField(
        _('documentos requeridos'),
        default=dict,
        help_text=_('Lista de documentos requeridos para el proceso.')
    )
    
    submitted_documents = models.JSONField(
        _('documentos presentados'),
        default=dict,
        help_text=_('Documentos ya presentados.')
    )
    
    pending_documents = models.JSONField(
        _('documentos pendientes'),
        default=list,
        help_text=_('Lista de documentos pendientes.')
    )
    
    # === SELF-EVALUATION ===
    self_evaluation_date = models.DateField(
        _('fecha de autoevaluación'),
        null=True,
        blank=True,
        help_text=_('Fecha de realización de la autoevaluación.')
    )
    
    self_evaluation_result = models.JSONField(
        _('resultado autoevaluación'),
        default=dict,
        blank=True,
        help_text=_('Resultados de la autoevaluación.')
    )
    
    self_evaluation_score = models.DecimalField(
        _('puntaje autoevaluación'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text=_('Puntaje obtenido en la autoevaluación (0-100).')
    )
    
    improvement_plan = models.JSONField(
        _('plan de mejoramiento'),
        default=dict,
        blank=True,
        help_text=_('Plan de mejoramiento derivado de la autoevaluación.')
    )
    
    # === SUBMISSION TO AUTHORITY ===
    submission_date = models.DateField(
        _('fecha de radicación'),
        null=True,
        blank=True,
        help_text=_('Fecha de radicación ante la autoridad.')
    )
    
    submission_number = models.CharField(
        _('número de radicación'),
        max_length=50,
        blank=True,
        help_text=_('Número de radicación asignado.')
    )
    
    health_secretary = models.CharField(
        _('secretaría de salud'),
        max_length=100,
        blank=True,
        help_text=_('Secretaría de salud donde se radicó.')
    )
    
    # === VERIFICATION VISIT ===
    verification_scheduled = models.DateField(
        _('visita programada'),
        null=True,
        blank=True,
        help_text=_('Fecha programada para la visita de verificación.')
    )
    
    verification_completed = models.DateField(
        _('visita realizada'),
        null=True,
        blank=True,
        help_text=_('Fecha de realización de la visita.')
    )
    
    verification_report = models.JSONField(
        _('informe de verificación'),
        default=dict,
        blank=True,
        help_text=_('Informe de la visita de verificación.')
    )
    
    verification_findings = models.JSONField(
        _('hallazgos de verificación'),
        default=list,
        blank=True,
        help_text=_('Hallazgos encontrados durante la verificación.')
    )
    
    # === RESOLUTION ===
    resolution_date = models.DateField(
        _('fecha de resolución'),
        null=True,
        blank=True,
        help_text=_('Fecha de emisión de la resolución.')
    )
    
    resolution_number = models.CharField(
        _('número de resolución'),
        max_length=50,
        blank=True,
        help_text=_('Número de la resolución emitida.')
    )
    
    resolution_result = models.CharField(
        _('resultado de resolución'),
        max_length=25,
        choices=RESOLUTION_RESULTS,
        blank=True,
        help_text=_('Resultado de la resolución.')
    )
    
    conditions_imposed = models.JSONField(
        _('condiciones impuestas'),
        default=list,
        blank=True,
        help_text=_('Condiciones impuestas en la resolución.')
    )
    
    # === FOLLOW-UP ===
    follow_up_actions = models.JSONField(
        _('acciones de seguimiento'),
        default=list,
        blank=True,
        help_text=_('Acciones de seguimiento requeridas.')
    )
    
    compliance_deadline = models.DateField(
        _('fecha límite de cumplimiento'),
        null=True,
        blank=True,
        help_text=_('Fecha límite para cumplir con las condiciones.')
    )
    
    # === PROCESS METADATA ===
    process_duration_days = models.IntegerField(
        _('duración del proceso (días)'),
        null=True,
        blank=True,
        help_text=_('Duración total del proceso en días.')
    )
    
    assigned_inspector = models.CharField(
        _('inspector asignado'),
        max_length=255,
        blank=True,
        help_text=_('Inspector asignado al proceso.')
    )
    
    notes = models.TextField(
        _('notas'),
        blank=True,
        help_text=_('Notas adicionales sobre el proceso.')
    )
    
    class Meta:
        verbose_name = _('proceso de habilitación')
        verbose_name_plural = _('procesos de habilitación')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['headquarters', 'current_status']),
            models.Index(fields=['service_code']),
            models.Index(fields=['current_status', 'current_phase']),
            models.Index(fields=['submission_date']),
            models.Index(fields=['compliance_deadline']),
        ]
    
    def __str__(self):
        return f"{self.process_type} - {self.service_name} ({self.current_status})"
    
    def clean(self):
        """Validate process data."""
        super().clean()
        
        # Validate verification dates
        if self.verification_completed and self.verification_scheduled:
            if self.verification_completed < self.verification_scheduled:
                raise ValidationError({
                    'verification_completed': _('La fecha de realización no puede ser anterior a la fecha programada.')
                })
        
        # Validate resolution date
        if self.resolution_date and self.submission_date:
            if self.resolution_date < self.submission_date:
                raise ValidationError({
                    'resolution_date': _('La fecha de resolución no puede ser anterior a la fecha de radicación.')
                })
    
    @property
    def is_completed(self):
        """Check if process is completed."""
        return self.current_status in ['aprobado', 'rechazado', 'desistido']
    
    @property
    def is_approved(self):
        """Check if process was approved."""
        return self.resolution_result in ['aprobado', 'aprobado_condicionado']
    
    @property
    def days_since_submission(self):
        """Calculate days since submission."""
        if not self.submission_date:
            return None
        
        end_date = self.resolution_date or timezone.now().date()
        return (end_date - self.submission_date).days
    
    @property
    def documentation_progress(self):
        """Calculate documentation progress percentage."""
        if not self.required_documents:
            return 100.0
        
        total_required = len(self.required_documents)
        total_submitted = len(self.submitted_documents)
        
        if total_required == 0:
            return 100.0
        
        return (total_submitted / total_required) * 100
    
    def advance_to_next_phase(self):
        """Advance process to next phase."""
        phase_transitions = {
            'preparacion': 'autoevaluacion',
            'autoevaluacion': 'radicacion',
            'radicacion': 'verificacion',
            'verificacion': 'resolucion',
            'resolucion': 'seguimiento',
        }
        
        if self.current_phase in phase_transitions:
            self.current_phase = phase_transitions[self.current_phase]
            self.save(update_fields=['current_phase', 'updated_at'])
            return True
        return False
    
    def calculate_process_duration(self):
        """Calculate and update process duration."""
        if self.submission_date and self.resolution_date:
            self.process_duration_days = (self.resolution_date - self.submission_date).days
            self.save(update_fields=['process_duration_days', 'updated_at'])