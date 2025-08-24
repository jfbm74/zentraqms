"""
Assignments and Service Integration Models for ZentraQMS

This module implements:
- Position assignments (who occupies which position)
- Service integration (multi-sector service management)
- Assignment history and tracking
- Service-position relationships

Supports both generic multi-sector services and backward compatibility
with existing health services.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
# from django.contrib.postgres.fields import JSONField  # Deprecated in Django 3.1+
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.conf import settings

from apps.common.models import FullBaseModel


class AsignacionCargo(FullBaseModel):
    """
    Position assignments tracking who occupies organizational positions.
    
    Supports historical tracking, temporary assignments, and multiple
    assignment types (titular, temporary, substitute, etc.).
    """
    
    ASSIGNMENT_TYPE_CHOICES = [
        ('TITULAR', 'Titular'),
        ('TEMPORARY', 'Temporal'),
        ('SUBSTITUTE', 'Encargo'),
        ('ACTING', 'Interino'),
        ('CONSULTANT', 'Consultor'),
        ('CONTRACTOR', 'Contratista'),
        ('VOLUNTEER', 'Voluntario'),
    ]
    
    ASSIGNMENT_STATUS_CHOICES = [
        ('ACTIVE', 'Activa'),
        ('SUSPENDED', 'Suspendida'),
        ('TERMINATED', 'Terminada'),
        ('ON_LEAVE', 'En licencia'),
        ('TRANSFERRED', 'Trasladada'),
    ]
    
    position = models.ForeignKey(
        'organization.Cargo',
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name=_("cargo")
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='position_assignments',
        verbose_name=_("usuario"),
        help_text=_("Usuario asignado al cargo")
    )
    
    assignment_type = models.CharField(
        _("tipo de asignación"),
        max_length=20,
        choices=ASSIGNMENT_TYPE_CHOICES,
        default='TITULAR',
        help_text=_("Tipo de asignación al cargo")
    )
    
    assignment_status = models.CharField(
        _("estado de la asignación"),
        max_length=20,
        choices=ASSIGNMENT_STATUS_CHOICES,
        default='ACTIVE',
        help_text=_("Estado actual de la asignación")
    )
    
    # Assignment period
    start_date = models.DateField(
        _("fecha de inicio"),
        help_text=_("Fecha de inicio en el cargo")
    )
    
    end_date = models.DateField(
        _("fecha de finalización"),
        null=True,
        blank=True,
        help_text=_("Fecha de finalización en el cargo (null = activa)")
    )
    
    planned_end_date = models.DateField(
        _("fecha prevista de finalización"),
        null=True,
        blank=True,
        help_text=_("Fecha prevista de finalización para asignaciones temporales")
    )
    
    # Assignment details
    assignment_percentage = models.DecimalField(
        _("porcentaje de dedicación"),
        max_digits=5,
        decimal_places=2,
        default=100.00,
        validators=[MinValueValidator(0.01), MaxValueValidator(100.00)],
        help_text=_("Porcentaje de tiempo dedicado al cargo")
    )
    
    salary = models.DecimalField(
        _("salario"),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Salario asignado para esta posición")
    )
    
    # Appointment documentation
    appointment_document = models.FileField(
        _("documento de nombramiento"),
        upload_to='assignments/appointments/%Y/%m/',
        null=True,
        blank=True,
        help_text=_("Documento oficial de nombramiento o asignación")
    )
    
    appointment_resolution = models.CharField(
        _("resolución de nombramiento"),
        max_length=100,
        blank=True,
        help_text=_("Número de resolución o acto administrativo de nombramiento")
    )
    
    # Assignment authority
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assignments_made',
        verbose_name=_("asignado por"),
        help_text=_("Usuario que realizó la asignación")
    )
    
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assignments_approved',
        verbose_name=_("aprobado por"),
        help_text=_("Usuario que aprobó la asignación")
    )
    
    # Performance and evaluation
    performance_goals = models.JSONField(
        default=list,
        blank=True,
        help_text=_("""Metas de desempeño para la asignación:
        [
            {
                "goal": "Reducir tiempo de atención promedio",
                "target": "< 15 minutos",
                "deadline": "2024-06-30",
                "measurement": "Promedio mensual"
            }
        ]""")
    )
    
    evaluation_scores = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("""Calificaciones de evaluación:
        {
            "last_evaluation_date": "2024-01-15",
            "overall_score": 4.2,
            "competency_scores": {
                "leadership": 4.0,
                "technical_skills": 4.5,
                "communication": 4.0
            }
        }""")
    )
    
    # Special conditions
    requires_supervision = models.BooleanField(
        _("requiere supervisión"),
        default=False,
        help_text=_("Indica si requiere supervisión especial")
    )
    
    supervisor = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='supervised_assignments',
        verbose_name=_("supervisor"),
        help_text=_("Asignación que supervisa esta asignación")
    )
    
    # Termination details
    termination_reason = models.CharField(
        _("motivo de terminación"),
        max_length=200,
        blank=True,
        help_text=_("Motivo de terminación de la asignación")
    )
    
    termination_document = models.FileField(
        _("documento de terminación"),
        upload_to='assignments/terminations/%Y/%m/',
        null=True,
        blank=True,
        help_text=_("Documento oficial de terminación")
    )
    
    # Notes and observations
    notes = models.TextField(
        _("observaciones"),
        blank=True,
        help_text=_("Observaciones adicionales sobre la asignación")
    )
    
    class Meta:
        db_table = 'org_position_assignment'
        ordering = ['-start_date', 'position']
        verbose_name = _("Asignación de Cargo")
        verbose_name_plural = _("Asignaciones de Cargo")
        indexes = [
            models.Index(fields=['position', 'assignment_status']),
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['assignment_type', 'assignment_status']),
        ]
        constraints = [
            # Only one active titular assignment per position
            models.UniqueConstraint(
                fields=['position', 'assignment_type'],
                condition=models.Q(
                    end_date__isnull=True,
                    assignment_type='TITULAR',
                    assignment_status='ACTIVE',
                    deleted_at__isnull=True
                ),
                name='unique_active_titular_per_position'
            ),
        ]

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.position.name}"

    def clean(self):
        """Validate assignment data."""
        super().clean()
        
        # Validate assignment period
        if self.end_date and self.start_date and self.end_date <= self.start_date:
            raise ValidationError({
                'end_date': _("La fecha de finalización debe ser posterior a la fecha de inicio")
            })
        
        # Validate planned end date for temporary assignments
        if self.assignment_type in ['TEMPORARY', 'SUBSTITUTE', 'ACTING']:
            if not self.planned_end_date:
                raise ValidationError({
                    'planned_end_date': _(
                        f"Las asignaciones de tipo {self.get_assignment_type_display()} "
                        "requieren una fecha prevista de finalización"
                    )
                })
        
        # Validate assignment percentage
        if self.assignment_percentage <= 0 or self.assignment_percentage > 100:
            raise ValidationError({
                'assignment_percentage': _("El porcentaje debe estar entre 0.01 y 100")
            })
        
        # Validate salary range if position has defined ranges
        if self.salary and self.position.salary_range_min and self.position.salary_range_max:
            if not (self.position.salary_range_min <= self.salary <= self.position.salary_range_max):
                raise ValidationError({
                    'salary': _(
                        f"El salario debe estar entre {self.position.salary_range_min} "
                        f"y {self.position.salary_range_max}"
                    )
                })

    def is_currently_active(self):
        """Check if assignment is currently active."""
        if not self.is_active or self.assignment_status != 'ACTIVE':
            return False
        
        today = timezone.now().date()
        if self.end_date and today > self.end_date:
            return False
        
        return today >= self.start_date

    def get_assignment_duration_days(self):
        """Get assignment duration in days."""
        end_date = self.end_date or timezone.now().date()
        return (end_date - self.start_date).days

    def is_overdue(self):
        """Check if temporary assignment is overdue."""
        if not self.planned_end_date:
            return False
        
        today = timezone.now().date()
        return today > self.planned_end_date and not self.end_date

    def extend_assignment(self, new_end_date, user=None, reason=None):
        """Extend assignment duration."""
        old_end_date = self.planned_end_date
        self.planned_end_date = new_end_date
        if user:
            self.updated_by = user
        
        self.save(update_fields=['planned_end_date', 'updated_by', 'updated_at'])
        
        # Log the extension
        from ..models.base import AuditLog
        AuditLog.log_change(
            instance=self,
            action=AuditLog.ACTION_UPDATE,
            user=user,
            old_values={'planned_end_date': str(old_end_date) if old_end_date else None},
            new_values={'planned_end_date': str(new_end_date)},
            changed_fields=['planned_end_date'],
            reason=f"Extensión de asignación: {reason or ''}"
        )

    def terminate_assignment(self, end_date=None, reason=None, user=None):
        """Terminate assignment."""
        self.end_date = end_date or timezone.now().date()
        self.assignment_status = 'TERMINATED'
        self.termination_reason = reason or ''
        if user:
            self.updated_by = user
        
        self.save(update_fields=[
            'end_date', 'assignment_status', 'termination_reason', 
            'updated_by', 'updated_at'
        ])
        
        # Log the termination
        from ..models.base import AuditLog
        AuditLog.log_change(
            instance=self,
            action=AuditLog.ACTION_UPDATE,
            user=user,
            old_values={'assignment_status': 'ACTIVE'},
            new_values={'assignment_status': 'TERMINATED'},
            changed_fields=['end_date', 'assignment_status', 'termination_reason'],
            reason=f"Terminación de asignación: {reason or ''}"
        )

    def get_performance_summary(self):
        """Get performance summary for the assignment."""
        if not self.evaluation_scores:
            return None
        
        return {
            'last_evaluation': self.evaluation_scores.get('last_evaluation_date'),
            'overall_score': self.evaluation_scores.get('overall_score'),
            'goals_completed': len([
                goal for goal in self.performance_goals 
                if goal.get('status') == 'completed'
            ]),
            'total_goals': len(self.performance_goals)
        }


class Service(FullBaseModel):
    """
    Generic services model for all sectors.
    
    Provides multi-sector service definitions with position requirements,
    regulatory compliance, and organizational integration capabilities.
    """
    
    SERVICE_CATEGORY_CHOICES = [
        ('CORE', 'Servicio Principal'),
        ('SUPPORT', 'Servicio de Apoyo'),
        ('ADMINISTRATIVE', 'Servicio Administrativo'),
        ('SPECIALIZED', 'Servicio Especializado'),
        ('REGULATORY', 'Servicio Regulatorio'),
        ('QUALITY', 'Servicio de Calidad'),
    ]
    
    # Basic service identification
    code = models.CharField(
        _("código del servicio"),
        max_length=50,
        help_text=_("Código único del servicio dentro del sector")
    )
    
    name = models.CharField(
        _("nombre del servicio"),
        max_length=200,
        help_text=_("Nombre completo del servicio")
    )
    
    sector = models.ForeignKey(
        'organization.Sector',
        on_delete=models.CASCADE,
        related_name='services',
        verbose_name=_("sector")
    )
    
    category = models.CharField(
        _("categoría del servicio"),
        max_length=20,
        choices=SERVICE_CATEGORY_CHOICES,
        default='CORE',
        help_text=_("Clasificación del tipo de servicio")
    )
    
    # Service configuration
    description = models.TextField(
        _("descripción"),
        help_text=_("Descripción detallada del servicio y su propósito")
    )
    
    is_mandatory = models.BooleanField(
        _("es obligatorio"),
        default=False,
        help_text=_("Indica si este servicio es obligatorio para organizaciones del sector")
    )
    
    # Position requirements
    required_positions = models.JSONField(
        default=list,
        help_text=_("""Cargos requeridos para el servicio:
        [
            {
                "position_type": "SERVICE_CHIEF",
                "name": "Jefe del Servicio",
                "is_critical": true,
                "min_quantity": 1,
                "required_qualifications": ["Título profesional", "Experiencia 3 años"]
            },
            {
                "position_type": "SPECIALIST",
                "name": "Especialista",
                "is_critical": false,
                "min_quantity": 2,
                "required_qualifications": ["Especialización"]
            }
        ]""")
    )
    
    # Regulatory requirements
    regulatory_requirements = models.JSONField(
        default=dict,
        help_text=_("""Requisitos regulatorios del servicio:
        {
            "standards": ["ISO_9001", "SECTOR_SPECIFIC"],
            "licenses": ["LICENSE_TYPE_1"],
            "certifications": ["CERT_1", "CERT_2"],
            "inspections": ["ANNUAL_INSPECTION"],
            "reporting": ["MONTHLY_REPORT"]
        }""")
    )
    
    # Service hierarchy
    parent_service = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='sub_services',
        verbose_name=_("servicio padre"),
        help_text=_("Servicio padre en la jerarquía (si aplica)")
    )
    
    # Service metrics and performance
    performance_indicators = models.JSONField(
        default=list,
        blank=True,
        help_text=_("""Indicadores de desempeño del servicio:
        [
            {
                "name": "Tiempo promedio de atención",
                "target": "< 30 minutos",
                "measurement": "monthly_average"
            }
        ]""")
    )
    
    # Operational requirements
    minimum_operating_hours = models.DecimalField(
        _("horas mínimas de operación"),
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Horas mínimas de operación por día")
    )
    
    requires_24_7_coverage = models.BooleanField(
        _("requiere cobertura 24/7"),
        default=False,
        help_text=_("Indica si requiere cobertura las 24 horas")
    )
    
    # Resource requirements
    minimum_space_m2 = models.DecimalField(
        _("espacio mínimo (m²)"),
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Espacio físico mínimo requerido en metros cuadrados")
    )
    
    required_equipment = models.JSONField(
        default=list,
        blank=True,
        help_text=_("""Equipos requeridos para el servicio:
        ["Computador", "Impresora", "Equipo especializado X"]""")
    )
    
    class Meta:
        db_table = 'org_service'
        unique_together = [['code', 'sector']]
        ordering = ['sector', 'category', 'name']
        verbose_name = _("Servicio")
        verbose_name_plural = _("Servicios")
        indexes = [
            models.Index(fields=['sector', 'is_active']),
            models.Index(fields=['category', 'is_mandatory']),
            models.Index(fields=['parent_service', 'is_active']),
        ]

    def __str__(self):
        return f"{self.sector.code} - {self.code}: {self.name}"

    def get_required_position_types(self):
        """Return list of required position types."""
        return [pos['position_type'] for pos in self.required_positions]

    def get_minimum_staff(self):
        """Calculate minimum staff required."""
        return sum(pos.get('min_quantity', 1) for pos in self.required_positions)

    def get_critical_positions(self):
        """Get list of critical positions for this service."""
        return [pos for pos in self.required_positions if pos.get('is_critical', False)]

    def get_all_sub_services(self):
        """Get all descendant services recursively."""
        sub_services = list(self.sub_services.filter(is_active=True))
        all_descendants = sub_services.copy()
        
        for sub_service in sub_services:
            all_descendants.extend(sub_service.get_all_sub_services())
        
        return all_descendants

    def validates_against_standards(self, standards_list):
        """Check if service meets specified standards."""
        service_standards = self.regulatory_requirements.get('standards', [])
        return all(standard in service_standards for standard in standards_list)


class ServiceIntegration(FullBaseModel):
    """
    Integration between organization services and organizational chart.
    
    Links services to organizational areas and positions, supporting both
    generic multi-sector services and health-specific services for backward
    compatibility.
    """
    
    organization = models.ForeignKey(
        'organization.Organization',
        on_delete=models.CASCADE,
        related_name='service_integrations',
        verbose_name=_("organización")
    )
    
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='integrations',
        verbose_name=_("servicio")
    )
    
    # Health service compatibility (for backward compatibility)
    health_service = models.ForeignKey(
        'organization.HealthService',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='generic_service_integrations',
        verbose_name=_("servicio de salud"),
        help_text=_("Vinculación con servicio de salud específico (si aplica)")
    )
    
    # Organizational assignment
    responsible_area = models.ForeignKey(
        'organization.Area',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_service_integrations',
        verbose_name=_("área responsable"),
        help_text=_("Área organizacional responsable del servicio")
    )
    
    responsible_position = models.ForeignKey(
        'organization.Cargo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_service_integrations',
        verbose_name=_("cargo responsable"),
        help_text=_("Cargo específico responsable del servicio")
    )
    
    # Service operation details
    start_date = models.DateField(
        _("fecha de inicio"),
        help_text=_("Fecha de inicio de operación del servicio")
    )
    
    end_date = models.DateField(
        _("fecha de finalización"),
        null=True,
        blank=True,
        help_text=_("Fecha de finalización del servicio (null = activo)")
    )
    
    # Service configuration specific to this organization
    service_config = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("""Configuración específica del servicio para esta organización:
        {
            "operating_hours": "08:00-17:00",
            "capacity": 50,
            "special_requirements": [],
            "customizations": {}
        }""")
    )
    
    # Compliance and performance
    compliance_status = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Estado de cumplimiento de requisitos del servicio")
    )
    
    last_compliance_check = models.DateTimeField(
        _("última verificación de cumplimiento"),
        null=True,
        blank=True,
        help_text=_("Fecha de la última verificación de cumplimiento")
    )
    
    performance_metrics = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Métricas de desempeño del servicio")
    )
    
    # Service status
    operational_status = models.CharField(
        _("estado operacional"),
        max_length=20,
        choices=[
            ('ACTIVE', 'Activo'),
            ('INACTIVE', 'Inactivo'),
            ('SUSPENDED', 'Suspendido'),
            ('MAINTENANCE', 'En mantenimiento'),
            ('PLANNING', 'En planeación'),
        ],
        default='ACTIVE',
        help_text=_("Estado operacional actual del servicio")
    )
    
    class Meta:
        db_table = 'org_service_integration'
        unique_together = [['organization', 'service']]
        ordering = ['organization', 'service']
        verbose_name = _("Integración de Servicio")
        verbose_name_plural = _("Integraciones de Servicio")
        indexes = [
            models.Index(fields=['organization', 'operational_status']),
            models.Index(fields=['service', 'responsible_area']),
            models.Index(fields=['responsible_position', 'is_active']),
        ]

    def __str__(self):
        org_name = getattr(self.organization, 'nombre_comercial', None) or \
                  getattr(self.organization, 'razon_social', 'Unknown')
        return f"{org_name} - {self.service.name}"

    def clean(self):
        """Validate service integration."""
        super().clean()
        
        # Check if service is valid for organization's sector
        if hasattr(self.organization, 'sector') and self.service.sector != self.organization.sector:
            raise ValidationError({
                'service': _("El servicio debe pertenecer al sector de la organización")
            })
        
        # Validate service period
        if self.end_date and self.start_date and self.end_date <= self.start_date:
            raise ValidationError({
                'end_date': _("La fecha de finalización debe ser posterior a la de inicio")
            })

    def is_currently_operational(self):
        """Check if service integration is currently operational."""
        if not self.is_active or self.operational_status not in ['ACTIVE']:
            return False
        
        today = timezone.now().date()
        if self.end_date and today > self.end_date:
            return False
        
        return today >= self.start_date

    def get_compliance_score(self):
        """Calculate overall compliance score."""
        compliance_data = self.compliance_status
        if not compliance_data:
            return 0
        
        total_requirements = compliance_data.get('total_requirements', 0)
        met_requirements = compliance_data.get('met_requirements', 0)
        
        if total_requirements == 0:
            return 100  # No requirements = 100% compliant
        
        return (met_requirements / total_requirements) * 100

    def validate_service_requirements(self):
        """Validate that organization meets service requirements."""
        results = {
            'compliant': True,
            'missing_requirements': [],
            'warnings': []
        }
        
        # Check position requirements
        for position_req in self.service.required_positions:
            if self.responsible_area:
                # Check if area has required positions
                position_type = position_req['position_type']
                required_quantity = position_req.get('min_quantity', 1)
                
                available_positions = self.responsible_area.positions.filter(
                    position_type=position_type,
                    is_active=True
                ).count()
                
                if available_positions < required_quantity:
                    results['compliant'] = False
                    results['missing_requirements'].append({
                        'type': 'position',
                        'requirement': f"{position_req['name']}",
                        'needed': required_quantity,
                        'available': available_positions
                    })
        
        # Update compliance status
        self.compliance_status = results
        self.last_compliance_check = timezone.now()
        self.save(update_fields=['compliance_status', 'last_compliance_check'])
        
        return results

    def suspend_service(self, reason=None, user=None):
        """Suspend service operation."""
        self.operational_status = 'SUSPENDED'
        if user:
            self.updated_by = user
        
        # Add suspension reason to config
        if not self.service_config:
            self.service_config = {}
        self.service_config['suspension_reason'] = reason or ''
        self.service_config['suspension_date'] = timezone.now().isoformat()
        
        self.save(update_fields=['operational_status', 'service_config', 'updated_by', 'updated_at'])

    def reactivate_service(self, user=None):
        """Reactivate suspended service."""
        self.operational_status = 'ACTIVE'
        if user:
            self.updated_by = user
        
        # Remove suspension info from config
        if self.service_config:
            self.service_config.pop('suspension_reason', None)
            self.service_config.pop('suspension_date', None)
            self.service_config['reactivation_date'] = timezone.now().isoformat()
        
        self.save(update_fields=['operational_status', 'service_config', 'updated_by', 'updated_at'])