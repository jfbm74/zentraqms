"""
Organizational Structure Models for ZentraQMS

This module implements the organizational structure components:
- Areas (organizational departments and units)
- Positions (cargo definitions within areas)
- Responsibilities (specific duties and obligations)
- Authorities (decision-making powers and limits)

These models work together to define the complete organizational hierarchy
and role definitions within an organizational chart.
"""

from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
# from django.contrib.postgres.fields import JSONField  # Deprecated in Django 3.1+
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.conf import settings

from apps.common.models import FullBaseModel


class Area(FullBaseModel):
    """
    Organizational area or department within an organizational chart.
    Can be hierarchical (areas within areas) and supports multi-location operations.
    """
    
    AREA_TYPE_CHOICES = [
        ('DIRECTION', 'Dirección'),
        ('SUBDIRECTION', 'Subdirección'),
        ('DEPARTMENT', 'Departamento'),
        ('UNIT', 'Unidad'),
        ('SERVICE', 'Servicio'),
        ('SECTION', 'Sección'),
        ('OFFICE', 'Oficina'),
        ('COMMITTEE', 'Comité'),
        ('WORKGROUP', 'Grupo de Trabajo'),
    ]
    
    organizational_chart = models.ForeignKey(
        'organization.OrganizationalChart',
        on_delete=models.CASCADE,
        related_name='areas',
        verbose_name=_("organigrama")
    )
    
    code = models.CharField(
        _("código del área"),
        max_length=20,
        help_text=_("Código único del área (ej: DIR-MED, SUB-ADM)")
    )
    
    name = models.CharField(
        _("nombre del área"),
        max_length=200,
        help_text=_("Nombre completo del área")
    )
    
    area_type = models.CharField(
        _("tipo de área"),
        max_length=20,
        choices=AREA_TYPE_CHOICES,
        help_text=_("Tipo de área organizacional")
    )
    
    # Hierarchical structure
    parent_area = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='child_areas',
        verbose_name=_("área padre"),
        help_text=_("Área superior en la jerarquía")
    )
    
    hierarchy_level = models.IntegerField(
        _("nivel jerárquico"),
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text=_("Nivel en la jerarquía organizacional")
    )
    
    # Area description and purpose
    description = models.TextField(
        _("descripción"),
        blank=True,
        help_text=_("Descripción del propósito y funciones del área")
    )
    
    main_purpose = models.TextField(
        _("propósito principal"),
        blank=True,
        help_text=_("Propósito principal y misión del área")
    )
    
    # Location information
    sede = models.ForeignKey(
        'organization.Location',  # Reference to existing Location model
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='organizational_areas',
        verbose_name=_("sede"),
        help_text=_("Sede donde opera principalmente esta área")
    )
    
    # Multi-sector service relationships
    # Health services (for backward compatibility)
    health_services = models.ManyToManyField(
        'organization.HealthService',
        blank=True,
        related_name='responsible_areas',
        help_text=_("Servicios de salud bajo responsabilidad del área")
    )
    
    # Generic services (for multi-sector support)
    managed_services = models.ManyToManyField(
        'organization.Service',
        blank=True,
        related_name='responsible_areas',
        through='ServiceAreaAssignment',
        help_text=_("Servicios genéricos administrados por el área")
    )
    
    # Area configuration
    requires_license = models.BooleanField(
        _("requiere licencia específica"),
        default=False,
        help_text=_("Indica si el área requiere licencias específicas para operar")
    )
    
    is_revenue_generating = models.BooleanField(
        _("genera ingresos"),
        default=False,
        help_text=_("Indica si el área genera ingresos directos")
    )
    
    # Operational information
    physical_location = models.CharField(
        _("ubicación física"),
        max_length=200,
        blank=True,
        help_text=_("Ubicación física específica dentro de la sede")
    )
    
    area_m2 = models.DecimalField(
        _("área en m²"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Área física en metros cuadrados")
    )
    
    capacity_persons = models.PositiveIntegerField(
        _("capacidad de personas"),
        null=True,
        blank=True,
        help_text=_("Capacidad máxima de personas en el área")
    )
    
    # Area manager/responsible
    area_manager = models.ForeignKey(
        'organization.Cargo',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='managed_areas',
        verbose_name=_("responsable del área"),
        help_text=_("Cargo responsable de la gestión del área")
    )
    
    class Meta:
        db_table = 'org_area'
        ordering = ['hierarchy_level', 'code']
        verbose_name = _("Área Organizacional")
        verbose_name_plural = _("Áreas Organizacionales")
        indexes = [
            models.Index(fields=['organizational_chart', 'hierarchy_level']),
            models.Index(fields=['parent_area', 'is_active']),
            models.Index(fields=['area_type', 'sede']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['organizational_chart', 'code'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_area_code_per_chart'
            ),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def clean(self):
        """Validate area data."""
        super().clean()
        
        # Prevent circular references in hierarchy
        if self.parent_area:
            parent = self.parent_area
            visited = set()
            while parent:
                if parent.id == self.id:
                    raise ValidationError({
                        'parent_area': _("No se puede crear una referencia circular en la jerarquía")
                    })
                if parent.id in visited:
                    break  # Already checked this path
                visited.add(parent.id)
                parent = parent.parent_area
        
        # Validate hierarchy level is consistent with parent
        if self.parent_area and self.hierarchy_level:
            if self.hierarchy_level <= self.parent_area.hierarchy_level:
                raise ValidationError({
                    'hierarchy_level': _("El nivel jerárquico debe ser mayor que el del área padre")
                })

    def get_full_hierarchy_path(self):
        """Get complete hierarchy path from root to this area."""
        path = []
        current = self
        while current:
            path.insert(0, current)
            current = current.parent_area
        return path

    def get_all_child_areas(self):
        """Get all descendant areas recursively."""
        children = list(self.child_areas.filter(is_active=True))
        all_descendants = children.copy()
        
        for child in children:
            all_descendants.extend(child.get_all_child_areas())
        
        return all_descendants

    def get_total_positions(self):
        """Get total number of positions in this area and child areas."""
        total = self.positions.filter(is_active=True).count()
        for child_area in self.child_areas.filter(is_active=True):
            total += child_area.get_total_positions()
        return total

    def get_position_by_type(self, position_type):
        """Get position of specific type within this area."""
        return self.positions.filter(
            position_type=position_type,
            is_active=True
        ).first()


class ServiceAreaAssignment(FullBaseModel):
    """
    Through model for assigning services to areas with specific roles.
    """
    
    ASSIGNMENT_TYPE_CHOICES = [
        ('PRIMARY', 'Responsabilidad Primaria'),
        ('SECONDARY', 'Responsabilidad Secundaria'),
        ('SUPPORT', 'Apoyo'),
        ('COORDINATION', 'Coordinación'),
    ]
    
    area = models.ForeignKey(Area, on_delete=models.CASCADE)
    service = models.ForeignKey('organization.Service', on_delete=models.CASCADE)
    
    assignment_type = models.CharField(
        max_length=20,
        choices=ASSIGNMENT_TYPE_CHOICES,
        default='PRIMARY'
    )
    
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'org_service_area_assignment'
        unique_together = [['area', 'service', 'assignment_type']]


class Cargo(FullBaseModel):
    """
    Position within organizational structure.
    Defines roles, responsibilities, authorities, and requirements.
    """
    
    HIERARCHY_LEVEL_CHOICES = [
        ('BOARD', 'Junta Directiva'),
        ('EXECUTIVE', 'Alta Dirección'),
        ('SENIOR_MANAGEMENT', 'Nivel Directivo'),
        ('MIDDLE_MANAGEMENT', 'Nivel Ejecutivo'),
        ('PROFESSIONAL', 'Nivel Profesional'),
        ('TECHNICAL', 'Nivel Técnico'),
        ('AUXILIARY', 'Nivel Auxiliar'),
        ('OPERATIONAL', 'Nivel Operativo'),
    ]
    
    area = models.ForeignKey(
        Area,
        on_delete=models.CASCADE,
        related_name='positions',
        verbose_name=_("área")
    )
    
    code = models.CharField(
        _("código del cargo"),
        max_length=30,
        help_text=_("Código único del cargo (ej: GER-001, COORD-MED-001)")
    )
    
    name = models.CharField(
        _("nombre del cargo"),
        max_length=200,
        help_text=_("Nombre oficial del cargo")
    )
    
    hierarchy_level = models.CharField(
        _("nivel jerárquico"),
        max_length=20,
        choices=HIERARCHY_LEVEL_CHOICES,
        help_text=_("Nivel jerárquico del cargo")
    )
    
    # Reporting structure
    reports_to = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='subordinates',
        verbose_name=_("reporta a"),
        help_text=_("Cargo al cual reporta directamente")
    )
    
    # Position purpose and responsibilities
    main_purpose = models.TextField(
        _("propósito principal"),
        help_text=_("Propósito o misión principal del cargo")
    )
    
    # Position requirements
    requirements = models.JSONField(
        default=dict,
        help_text=_("""Requisitos del cargo:
        {
            'education': {
                'level': 'university',
                'title': 'Medicina',
                'additional': 'Especialización preferible'
            },
            'experience': {
                'years': 5,
                'specific_area': 'Gestión hospitalaria',
                'leadership_experience': true
            },
            'competencies': [
                'Liderazgo',
                'Trabajo en equipo',
                'Comunicación efectiva'
            ],
            'licenses': [
                'Tarjeta profesional médica',
                'Registro de especialista'
            ],
            'languages': ['Español', 'Inglés básico'],
            'technical_skills': [],
            'others': []
        }""")
    )
    
    # Position classification
    is_critical = models.BooleanField(
        _("cargo crítico"),
        default=False,
        help_text=_("Indica si es un cargo crítico para la operación")
    )
    
    is_process_owner = models.BooleanField(
        _("dueño de proceso"),
        default=False,
        help_text=_("Indica si es responsable de algún proceso institucional")
    )
    
    is_service_leader = models.BooleanField(
        _("líder de servicio"),
        default=False,
        help_text=_("Indica si es líder de algún servicio específico")
    )
    
    requires_professional_license = models.BooleanField(
        _("requiere tarjeta profesional"),
        default=False,
        help_text=_("Requiere tarjeta o licencia profesional para ejercer")
    )
    
    requires_sst_license = models.BooleanField(
        _("requiere licencia SST"),
        default=False,
        help_text=_("Requiere licencia en Seguridad y Salud en el Trabajo")
    )
    
    # Position capacity
    authorized_positions = models.IntegerField(
        _("plazas autorizadas"),
        default=1,
        validators=[MinValueValidator(1)],
        help_text=_("Número de plazas autorizadas para este cargo")
    )
    
    # Salary information (optional)
    salary_range_min = models.DecimalField(
        _("salario mínimo"),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Rango salarial mínimo para el cargo")
    )
    
    salary_range_max = models.DecimalField(
        _("salario máximo"),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Rango salarial máximo para el cargo")
    )
    
    # Position type for sector-specific logic
    position_type = models.CharField(
        _("tipo de cargo"),
        max_length=50,
        blank=True,
        help_text=_("Tipo específico para validaciones sectoriales")
    )
    
    # Service relationships (multi-sector support)
    managed_services = models.ManyToManyField(
        'organization.Service',
        blank=True,
        related_name='responsible_positions',
        help_text=_("Servicios bajo responsabilidad del cargo")
    )
    
    # Health services (backward compatibility)
    health_services = models.ManyToManyField(
        'organization.HealthService',
        blank=True,
        related_name='responsible_positions',
        help_text=_("Servicios de salud bajo responsabilidad del cargo")
    )
    
    class Meta:
        db_table = 'org_position'
        ordering = ['area__hierarchy_level', 'code']
        verbose_name = _("Cargo")
        verbose_name_plural = _("Cargos")
        indexes = [
            models.Index(fields=['area', 'is_active']),
            models.Index(fields=['reports_to', 'hierarchy_level']),
            models.Index(fields=['position_type', 'is_service_leader']),
            models.Index(fields=['is_critical', 'is_active']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['area', 'code'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_position_code_per_area'
            ),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def clean(self):
        """Validate position data."""
        super().clean()
        
        # Prevent circular references in reporting structure
        if self.reports_to:
            supervisor = self.reports_to
            visited = set()
            while supervisor:
                if supervisor.id == self.id:
                    raise ValidationError({
                        'reports_to': _("No se puede crear una referencia circular en la estructura de reporte")
                    })
                if supervisor.id in visited:
                    break  # Already checked this path
                visited.add(supervisor.id)
                supervisor = supervisor.reports_to
        
        # Validate salary range
        if (self.salary_range_min and self.salary_range_max and 
            self.salary_range_min >= self.salary_range_max):
            raise ValidationError({
                'salary_range_max': _("El salario máximo debe ser mayor que el mínimo")
            })

    def get_command_chain(self):
        """Get complete command chain up to top management."""
        chain = []
        current = self.reports_to
        while current:
            chain.append(current)
            current = current.reports_to
        return chain

    def get_all_subordinates(self):
        """Get all subordinate positions recursively."""
        direct_reports = list(self.subordinates.filter(is_active=True))
        all_subordinates = direct_reports.copy()
        
        for subordinate in direct_reports:
            all_subordinates.extend(subordinate.get_all_subordinates())
        
        return all_subordinates

    def get_span_of_control(self):
        """Get direct span of control (number of direct reports)."""
        return self.subordinates.filter(is_active=True).count()

    def get_current_assignments(self):
        """Get current active assignments for this position."""
        return self.assignments.filter(
            end_date__isnull=True,
            is_active=True
        )

    def is_occupied(self):
        """Check if position has current occupants."""
        return self.get_current_assignments().exists()

    def get_vacancy_count(self):
        """Get number of vacant positions."""
        occupied = self.get_current_assignments().count()
        return max(0, self.authorized_positions - occupied)

    @property
    def has_subordinates(self):
        """Check if position has subordinates."""
        return self.subordinates.filter(is_active=True).exists()

    def get_required_competencies(self):
        """Get list of required competencies."""
        return self.requirements.get('competencies', [])

    def get_required_licenses(self):
        """Get list of required licenses."""
        return self.requirements.get('licenses', [])


class Responsabilidad(FullBaseModel):
    """
    Specific responsibilities assigned to positions.
    Supports ISO 9001 responsibility matrix requirements.
    """
    
    RESPONSIBILITY_TYPE_CHOICES = [
        ('NORMATIVE', 'Normativa/Legal'),
        ('OPERATIONAL', 'Operativa'),
        ('ADMINISTRATIVE', 'Administrativa'),
        ('QUALITY', 'Calidad'),
        ('SAFETY', 'Seguridad del Paciente'),
        ('FINANCIAL', 'Financiera'),
        ('HUMAN_RESOURCES', 'Talento Humano'),
        ('TECHNOLOGICAL', 'Tecnológica'),
        ('ENVIRONMENTAL', 'Ambiental'),
        ('STRATEGIC', 'Estratégica'),
    ]
    
    FREQUENCY_CHOICES = [
        ('DAILY', 'Diaria'),
        ('WEEKLY', 'Semanal'),
        ('BIWEEKLY', 'Quincenal'),
        ('MONTHLY', 'Mensual'),
        ('QUARTERLY', 'Trimestral'),
        ('SEMIANNUAL', 'Semestral'),
        ('ANNUAL', 'Anual'),
        ('OCCASIONAL', 'Ocasional'),
        ('PERMANENT', 'Permanente'),
    ]
    
    position = models.ForeignKey(
        Cargo,
        on_delete=models.CASCADE,
        related_name='responsibilities',
        verbose_name=_("cargo")
    )
    
    description = models.TextField(
        _("descripción"),
        help_text=_("Descripción detallada de la responsabilidad")
    )
    
    responsibility_type = models.CharField(
        _("tipo de responsabilidad"),
        max_length=20,
        choices=RESPONSIBILITY_TYPE_CHOICES,
        help_text=_("Clasificación del tipo de responsabilidad")
    )
    
    frequency = models.CharField(
        _("frecuencia"),
        max_length=20,
        choices=FREQUENCY_CHOICES,
        help_text=_("Frecuencia de ejecución de la responsabilidad")
    )
    
    # Normative requirements
    is_normative_requirement = models.BooleanField(
        _("es requisito normativo"),
        default=False,
        help_text=_("Indica si es requerida por normativa específica")
    )
    
    normative_reference = models.CharField(
        _("referencia normativa"),
        max_length=200,
        blank=True,
        help_text=_("Normativa que exige esta responsabilidad")
    )
    
    # Process and performance linkage
    # related_process = models.ForeignKey(
    #     'processes.Process',  # Will be available when processes module exists
    #     null=True,
    #     blank=True,
    #     on_delete=models.SET_NULL,
    #     related_name='position_responsibilities',
    #     verbose_name=_("proceso relacionado"),
    #     help_text=_("Proceso al cual está asociada esta responsabilidad")
    # )
    
    performance_indicator = models.CharField(
        _("indicador asociado"),
        max_length=200,
        blank=True,
        help_text=_("Indicador para medir cumplimiento de la responsabilidad")
    )
    
    # RACI matrix support
    raci_role = models.CharField(
        _("rol RACI"),
        max_length=20,
        choices=[
            ('RESPONSIBLE', 'Responsable (R)'),
            ('ACCOUNTABLE', 'Aprobador (A)'),
            ('CONSULTED', 'Consultado (C)'),
            ('INFORMED', 'Informado (I)'),
        ],
        blank=True,
        help_text=_("Rol en la matriz RACI para esta responsabilidad")
    )
    
    # Priority and criticality
    priority_level = models.CharField(
        _("nivel de prioridad"),
        max_length=10,
        choices=[
            ('LOW', 'Baja'),
            ('MEDIUM', 'Media'),
            ('HIGH', 'Alta'),
            ('CRITICAL', 'Crítica'),
        ],
        default='MEDIUM',
        help_text=_("Nivel de prioridad de la responsabilidad")
    )
    
    class Meta:
        db_table = 'org_responsibility'
        ordering = ['position', 'responsibility_type', 'priority_level']
        verbose_name = _("Responsabilidad")
        verbose_name_plural = _("Responsabilidades")
        indexes = [
            models.Index(fields=['position', 'responsibility_type']),
            models.Index(fields=['is_normative_requirement', 'is_active']),
            models.Index(fields=['priority_level', 'frequency']),
        ]

    def __str__(self):
        return f"{self.position.name} - {self.get_responsibility_type_display()}"


class Autoridad(FullBaseModel):
    """
    Authorities and decision-making powers assigned to positions.
    Defines limits and delegation capabilities.
    """
    
    DECISION_TYPE_CHOICES = [
        ('FINANCIAL', 'Decisión Financiera'),
        ('OPERATIONAL', 'Decisión Operativa'),
        ('PERSONNEL', 'Decisión de Personal'),
        ('CLINICAL', 'Decisión Clínica'),
        ('ADMINISTRATIVE', 'Decisión Administrativa'),
        ('STRATEGIC', 'Decisión Estratégica'),
        ('PROCUREMENT', 'Decisión de Compras'),
        ('LEGAL', 'Decisión Legal'),
    ]
    
    position = models.ForeignKey(
        Cargo,
        on_delete=models.CASCADE,
        related_name='authorities',
        verbose_name=_("cargo")
    )
    
    description = models.TextField(
        _("descripción de la autoridad"),
        help_text=_("Descripción detallada de la autoridad conferida")
    )
    
    decision_type = models.CharField(
        _("tipo de decisión"),
        max_length=20,
        choices=DECISION_TYPE_CHOICES,
        help_text=_("Tipo de decisión que puede tomar")
    )
    
    # Financial limits
    financial_limit = models.DecimalField(
        _("límite de aprobación financiera"),
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Límite monetario de aprobación (si aplica)")
    )
    
    # Approval requirements
    requires_superior_validation = models.BooleanField(
        _("requiere validación del superior"),
        default=False,
        help_text=_("Indica si requiere aprobación del superior jerárquico")
    )
    
    requires_committee_approval = models.BooleanField(
        _("requiere aprobación de comité"),
        default=False,
        help_text=_("Indica si requiere aprobación de comité específico")
    )
    
    approving_committee = models.ForeignKey(
        'organization.Comite',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='authorities_requiring_approval',
        verbose_name=_("comité aprobador"),
        help_text=_("Comité que debe aprobar estas decisiones")
    )
    
    # Authority scope and limitations
    scope = models.TextField(
        _("alcance de la autoridad"),
        blank=True,
        help_text=_("Descripción específica del alcance y limitaciones")
    )
    
    can_delegate = models.BooleanField(
        _("puede delegar"),
        default=False,
        help_text=_("Indica si esta autoridad puede ser delegada")
    )
    
    delegation_conditions = models.TextField(
        _("condiciones de delegación"),
        blank=True,
        help_text=_("Condiciones bajo las cuales se puede delegar")
    )
    
    # Temporal limitations
    is_temporary = models.BooleanField(
        _("autoridad temporal"),
        default=False,
        help_text=_("Indica si es una autoridad temporal")
    )
    
    valid_from = models.DateField(
        _("válida desde"),
        null=True,
        blank=True,
        help_text=_("Fecha desde la cual es válida la autoridad")
    )
    
    valid_until = models.DateField(
        _("válida hasta"),
        null=True,
        blank=True,
        help_text=_("Fecha hasta la cual es válida la autoridad")
    )
    
    class Meta:
        db_table = 'org_authority'
        verbose_name = _("Autoridad")
        verbose_name_plural = _("Autoridades")
        ordering = ['position', 'decision_type']
        indexes = [
            models.Index(fields=['position', 'decision_type']),
            models.Index(fields=['decision_type', 'is_active']),
            models.Index(fields=['is_temporary', 'valid_until']),
        ]

    def __str__(self):
        return f"{self.position.name} - {self.get_decision_type_display()}"

    def clean(self):
        """Validate authority data."""
        super().clean()
        
        # Validate temporal authority dates
        if self.is_temporary:
            if not self.valid_from or not self.valid_until:
                raise ValidationError({
                    'valid_until': _("Las autoridades temporales requieren fechas de inicio y fin")
                })
            
            if self.valid_from >= self.valid_until:
                raise ValidationError({
                    'valid_until': _("La fecha de fin debe ser posterior a la de inicio")
                })

    def is_currently_valid(self):
        """Check if authority is currently valid."""
        if not self.is_active:
            return False
        
        if self.is_temporary:
            today = timezone.now().date()
            return (
                self.valid_from <= today <= self.valid_until if 
                self.valid_from and self.valid_until else False
            )
        
        return True

    def can_approve_amount(self, amount):
        """Check if position can approve specific amount."""
        if not self.financial_limit:
            return False
        return amount <= self.financial_limit

    def get_approval_process(self):
        """Get required approval process for this authority."""
        process = {'steps': []}
        
        if self.requires_superior_validation:
            process['steps'].append({
                'type': 'superior_approval',
                'required': True
            })
        
        if self.requires_committee_approval and self.approving_committee:
            process['steps'].append({
                'type': 'committee_approval',
                'committee': self.approving_committee.name,
                'required': True
            })
        
        return process