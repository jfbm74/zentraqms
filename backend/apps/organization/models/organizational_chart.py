"""
Organizational Chart Models for ZentraQMS

This module implements the multi-sector organizational chart system as defined in:
- claude-modules/organization/organizational-chart/organizational-chart-requirements.claude.md
- claude-modules/organization/organizational-chart/architecture.claude.md

Key Features:
- Multi-sector support with configurable validations
- Versioned organizational charts with approval workflow
- ISO 9001:2015 compliance as universal base
- Sector-specific extensions (SOGCS for health, etc.)
- Complete audit trail and change tracking
"""

import json
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
# from django.contrib.postgres.fields import JSONField  # Deprecated in Django 3.1+
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.conf import settings

from apps.common.models import FullBaseModel


class Sector(FullBaseModel):
    """
    Define available sectors and their base configuration.
    Supports multi-sector architecture with factory pattern for validation.
    """
    
    SECTOR_CHOICES = [
        ('HEALTH', 'Sector Salud'),
        ('EDUCATION', 'Sector Educación'),
        ('MANUFACTURING', 'Sector Manufactura'),
        ('SERVICES', 'Sector Servicios'),
        ('PUBLIC', 'Sector Público'),
        ('OTHER', 'Otro Sector'),
    ]
    
    code = models.CharField(
        _("código del sector"),
        max_length=20,
        choices=SECTOR_CHOICES,
        unique=True,
        help_text=_("Código único del sector")
    )
    
    name = models.CharField(
        _("nombre del sector"),
        max_length=100,
        help_text=_("Nombre completo del sector")
    )
    
    description = models.TextField(
        _("descripción"),
        help_text=_("Descripción detallada del sector y sus características")
    )
    
    # Sector configuration
    default_config = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("""Configuración por defecto del sector:
        {
            'hierarchy_levels_default': 5,
            'requires_mandatory_committees': true,
            'normative_validations': [],
            'mandatory_positions': [],
            'mandatory_committees': [],
            'applicable_standards': []
        }""")
    )
    
    # Sector-specific normative requirements
    normative_requirements = models.JSONField(
        default=list,
        blank=True,
        help_text=_("Lista de requisitos normativos específicos del sector")
    )
    
    # Template support
    has_templates = models.BooleanField(
        default=True,
        help_text=_("Indica si el sector tiene plantillas predefinidas")
    )
    
    class Meta:
        db_table = 'org_sector'
        verbose_name = _("Sector")
        verbose_name_plural = _("Sectores")
        ordering = ['code']
        indexes = [
            models.Index(fields=['code', 'is_active']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def get_mandatory_committees(self):
        """Get list of mandatory committees for this sector."""
        return self.default_config.get('mandatory_committees', [])

    def get_mandatory_positions(self):
        """Get list of mandatory positions for this sector."""
        return self.default_config.get('mandatory_positions', [])

    def clean(self):
        """Validate sector configuration."""
        super().clean()
        
        # Validate default_config structure
        if self.default_config:
            required_keys = ['hierarchy_levels_default', 'requires_mandatory_committees']
            missing_keys = [key for key in required_keys if key not in self.default_config]
            if missing_keys:
                raise ValidationError({
                    'default_config': _(
                        f'La configuración debe contener: {", ".join(required_keys)}. '
                        f'Faltan: {", ".join(missing_keys)}'
                    )
                })


class SectorNormativa(FullBaseModel):
    """
    Specific normative requirements by sector.
    Links sectors to their regulatory frameworks.
    """
    
    sector = models.ForeignKey(
        Sector,
        on_delete=models.CASCADE,
        related_name='normativas',
        verbose_name=_("sector")
    )
    
    code = models.CharField(
        _("código de la normativa"),
        max_length=50,
        help_text=_("Código único de la normativa (ej: RES-2003-2014)")
    )
    
    name = models.CharField(
        _("nombre de la normativa"),
        max_length=200,
        help_text=_("Nombre completo de la normativa")
    )
    
    description = models.TextField(
        _("descripción"),
        help_text=_("Descripción detallada de la normativa y su aplicación")
    )
    
    normative_type = models.CharField(
        _("tipo de normativa"),
        max_length=30,
        choices=[
            ('LAW', 'Ley'),
            ('DECREE', 'Decreto'),
            ('RESOLUTION', 'Resolución'),
            ('CIRCULAR', 'Circular'),
            ('ISO_STANDARD', 'Norma ISO'),
            ('STANDARD', 'Estándar'),
            ('OTHER', 'Otro'),
        ],
        help_text=_("Tipo de normativa")
    )
    
    is_mandatory = models.BooleanField(
        default=True,
        help_text=_("Indica si la normativa es obligatoria para el sector")
    )
    
    is_current = models.BooleanField(
        default=True,
        help_text=_("Indica si la normativa está vigente")
    )
    
    # Specific requirements from this normative
    requirements = models.JSONField(
        default=list,
        blank=True,
        help_text=_("Lista de requisitos específicos de esta normativa")
    )
    
    class Meta:
        db_table = 'org_sector_normativa'
        unique_together = [['sector', 'code']]
        verbose_name = _("Normativa del Sector")
        verbose_name_plural = _("Normativas del Sector")
        ordering = ['sector', 'normative_type', 'name']

    def __str__(self):
        return f"{self.sector.code} - {self.code}: {self.name}"


class PlantillaOrganigrama(FullBaseModel):
    """
    Pre-defined organizational chart templates by sector and type.
    Enables rapid deployment of sector-compliant organizational structures.
    """
    
    sector = models.ForeignKey(
        Sector,
        on_delete=models.CASCADE,
        related_name='org_chart_templates',
        verbose_name=_("sector")
    )
    
    organization_type = models.CharField(
        _("tipo de organización"),
        max_length=50,
        help_text=_("Tipo específico dentro del sector (ej: IPS, Hospital, Clínica)")
    )
    
    name = models.CharField(
        _("nombre de la plantilla"),
        max_length=200,
        help_text=_("Nombre descriptivo de la plantilla")
    )
    
    description = models.TextField(
        _("descripción"),
        help_text=_("Descripción detallada de la plantilla y su aplicación")
    )
    
    # Template complexity level
    complexity = models.CharField(
        _("nivel de complejidad"),
        max_length=20,
        choices=[
            ('BASIC', 'Básica'),
            ('MEDIUM', 'Media'),
            ('HIGH', 'Alta'),
        ],
        default='MEDIUM',
        help_text=_("Nivel de complejidad de la estructura organizacional")
    )
    
    # Pre-defined organizational structure
    structure = models.JSONField(
        help_text=_("""Estructura organizacional predefinida:
        {
            'areas': [
                {
                    'code': 'DIR-GEN',
                    'name': 'Dirección General',
                    'type': 'DIRECTION',
                    'level': 1
                }
            ],
            'positions': [
                {
                    'code': 'DIR-001',
                    'name': 'Director General',
                    'area_code': 'DIR-GEN',
                    'level': 'EXECUTIVE',
                    'is_critical': true
                }
            ],
            'committees': [
                {
                    'code': 'COM-CAL',
                    'name': 'Comité de Calidad',
                    'type': 'MANDATORY'
                }
            ],
            'hierarchy_levels': 5
        }""")
    )
    
    # Usage statistics
    times_used = models.PositiveIntegerField(
        _("veces utilizada"),
        default=0,
        help_text=_("Número de veces que se ha utilizado esta plantilla")
    )
    
    last_used_date = models.DateTimeField(
        _("última utilización"),
        null=True,
        blank=True,
        help_text=_("Fecha y hora de la última utilización")
    )
    
    class Meta:
        db_table = 'org_chart_template'
        unique_together = [['sector', 'organization_type', 'complexity']]
        verbose_name = _("Plantilla de Organigrama")
        verbose_name_plural = _("Plantillas de Organigrama")
        ordering = ['sector', 'organization_type', 'complexity']
        indexes = [
            models.Index(fields=['sector', 'organization_type']),
            models.Index(fields=['complexity', 'is_active']),
        ]

    def __str__(self):
        return f"{self.sector.name} - {self.organization_type} ({self.get_complexity_display()})"

    def clean(self):
        """Validate template structure."""
        super().clean()
        
        if self.structure:
            required_sections = ['areas', 'positions', 'committees']
            missing_sections = [section for section in required_sections 
                              if section not in self.structure]
            if missing_sections:
                raise ValidationError({
                    'structure': _(
                        f'La estructura debe contener: {", ".join(required_sections)}. '
                        f'Faltan: {", ".join(missing_sections)}'
                    )
                })

    def increment_usage(self):
        """Increment usage statistics when template is used."""
        self.times_used += 1
        self.last_used_date = timezone.now()
        self.save(update_fields=['times_used', 'last_used_date'])


class OrganizationalChart(FullBaseModel):
    """
    Versioned multi-sector organizational chart.
    
    Implements ISO 9001:2015 Clause 5.3 as universal base with sector specializations.
    Supports complete versioning, approval workflow, and compliance validation.
    """
    
    # Core relationships
    organization = models.OneToOneField(
        'organization.Organization',
        on_delete=models.CASCADE,
        related_name='organizational_chart',
        verbose_name=_("organización")
    )
    
    sector = models.ForeignKey(
        Sector,
        on_delete=models.PROTECT,
        related_name='organizational_charts',
        verbose_name=_("sector"),
        help_text=_("Sector de la organización para validaciones especializadas")
    )
    
    # Organization type within sector
    organization_type = models.CharField(
        _("tipo específico de organización"),
        max_length=50,
        help_text=_("Tipo específico dentro del sector (ej: IPS, Universidad, Fábrica)")
    )
    
    # Template used as base (optional)
    base_template = models.ForeignKey(
        PlantillaOrganigrama,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='charts_created',
        verbose_name=_("plantilla base"),
        help_text=_("Plantilla utilizada como base para este organigrama")
    )
    
    # Versioning system
    version = models.CharField(
        _("versión"),
        max_length=10,
        help_text=_("Versión del organigrama (ej: 1.0, 2.1)")
    )
    
    effective_date = models.DateField(
        _("fecha de vigencia"),
        help_text=_("Fecha desde la cual este organigrama está vigente")
    )
    
    end_date = models.DateField(
        _("fecha de fin de vigencia"),
        null=True,
        blank=True,
        help_text=_("Fecha hasta la cual estuvo vigente (null = vigente actual)")
    )
    
    is_current = models.BooleanField(
        default=True,
        help_text=_("Indica si este es el organigrama vigente actual")
    )
    
    # Approval workflow
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='approved_org_charts',
        null=True,
        blank=True,
        verbose_name=_("aprobado por")
    )
    
    approval_date = models.DateTimeField(
        _("fecha de aprobación"),
        null=True,
        blank=True
    )
    
    approval_document = models.FileField(
        _("documento de aprobación"),
        upload_to='orgcharts/approvals/%Y/%m/',
        null=True,
        blank=True,
        help_text=_("Acta o resolución de aprobación")
    )
    
    # Chart configuration
    hierarchy_levels = models.IntegerField(
        _("niveles jerárquicos"),
        validators=[MinValueValidator(3), MaxValueValidator(10)],
        default=5,
        help_text=_("Número de niveles jerárquicos en la estructura")
    )
    
    allows_temporary_positions = models.BooleanField(
        _("permite cargos temporales"),
        default=True,
        help_text=_("Permite definir cargos temporales o encargos")
    )
    
    uses_raci_matrix = models.BooleanField(
        _("utiliza matriz RACI"),
        default=True,
        help_text=_("Utiliza matriz RACI para responsabilidades de procesos")
    )
    
    # Sector-specific configuration
    sector_config = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("""Configuración específica por sector:
        {
            'validations_active': [],      # Validaciones activas del sector
            'additional_committees': [],   # Comités adicionales a los obligatorios
            'special_positions': [],       # Cargos específicos del sector
            'applied_standards': [],       # Normativas que cumple
            'customizations': {}           # Configuración específica
        }""")
    )
    
    # Compliance and validation
    last_validation_date = models.DateTimeField(
        _("última validación"),
        null=True,
        blank=True,
        help_text=_("Fecha de la última validación de cumplimiento")
    )
    
    compliance_status = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Estado del cumplimiento normativo")
    )
    
    class Meta:
        db_table = 'org_chart'
        ordering = ['-effective_date', '-version']
        verbose_name = _("Organigrama")
        verbose_name_plural = _("Organigramas")
        indexes = [
            models.Index(fields=['organization', 'is_current']),
            models.Index(fields=['sector', 'effective_date']),
            models.Index(fields=['organization_type', 'is_current']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'version'],
                name='unique_org_version'
            ),
            models.CheckConstraint(
                check=models.Q(hierarchy_levels__gte=3) & 
                      models.Q(hierarchy_levels__lte=10),
                name='valid_hierarchy_levels'
            ),
            # Only one current chart per organization
            models.UniqueConstraint(
                fields=['organization'],
                condition=models.Q(is_current=True) & models.Q(deleted_at__isnull=True),
                name='unique_current_chart_per_org'
            )
        ]

    def __str__(self):
        org_name = getattr(self.organization, 'nombre_comercial', None) or \
                  getattr(self.organization, 'razon_social', 'Unknown')
        return f"{org_name} - v{self.version}"

    def clean(self):
        """Validate organizational chart data."""
        super().clean()
        
        # Validate version format (semantic versioning)
        if self.version:
            import re
            if not re.match(r'^\d+\.\d+(\.\d+)?$', self.version):
                raise ValidationError({
                    'version': _("La versión debe seguir el formato X.Y o X.Y.Z")
                })
        
        # Validate effective_date is not in the future
        if self.effective_date and self.effective_date > timezone.now().date():
            raise ValidationError({
                'effective_date': _("La fecha de vigencia no puede ser futura")
            })
        
        # Validate end_date is after effective_date
        if self.end_date and self.effective_date and self.end_date <= self.effective_date:
            raise ValidationError({
                'end_date': _("La fecha de fin debe ser posterior a la fecha de vigencia")
            })

    def save(self, *args, **kwargs):
        """Override save to handle versioning logic."""
        # Mark previous versions as non-current when setting a new current chart
        if self.is_current and self.effective_date:
            OrganizationalChart.objects.filter(
                organization=self.organization,
                is_current=True
            ).exclude(id=self.id).update(
                is_current=False,
                end_date=self.effective_date
            )
        
        super().save(*args, **kwargs)

    def get_next_version(self):
        """Generate next version number for this organization."""
        last_chart = OrganizationalChart.objects.filter(
            organization=self.organization
        ).order_by('-version').first()
        
        if not last_chart:
            return "1.0"
        
        # Parse current version
        try:
            parts = last_chart.version.split('.')
            major = int(parts[0])
            minor = int(parts[1]) if len(parts) > 1 else 0
            return f"{major}.{minor + 1}"
        except (ValueError, IndexError):
            return "1.0"

    def approve(self, user, approval_document=None, reason=None):
        """Approve the organizational chart."""
        if self.approved_by:
            raise ValidationError(_("Este organigrama ya ha sido aprobado"))
        
        self.approved_by = user
        self.approval_date = timezone.now()
        if approval_document:
            self.approval_document = approval_document
        
        # Make this the current chart
        self.is_current = True
        
        self.save()
        
        # Log the approval
        from .base import AuditLog
        AuditLog.log_change(
            instance=self,
            action=AuditLog.ACTION_UPDATE,
            user=user,
            old_values={'approved_by': None, 'is_current': False},
            new_values={'approved_by': user.id, 'is_current': True},
            changed_fields=['approved_by', 'approval_date', 'is_current'],
            reason=f"Organigrama aprobado: {reason or ''}"
        )

    def get_total_positions(self):
        """Get total number of positions in this chart."""
        return self.areas.aggregate(
            total=models.Count('positions')
        )['total'] or 0

    def get_filled_positions(self):
        """Get number of positions with current assignments."""
        return self.areas.aggregate(
            filled=models.Count(
                'positions__assignments',
                filter=models.Q(positions__assignments__end_date__isnull=True)
            )
        )['filled'] or 0

    def get_vacancy_rate(self):
        """Calculate vacancy rate as percentage."""
        total = self.get_total_positions()
        if total == 0:
            return 0
        filled = self.get_filled_positions()
        return ((total - filled) / total) * 100

    def validate_compliance(self):
        """Validate chart against sector requirements."""
        from ..validators import OrganizationalChartValidator
        
        validator = OrganizationalChartValidator()
        results = validator.validate(self)
        
        # Update compliance status
        self.compliance_status = results
        self.last_validation_date = timezone.now()
        self.save(update_fields=['compliance_status', 'last_validation_date'])
        
        return results

    @property
    def is_compliant(self):
        """Check if chart is compliant with sector requirements."""
        return self.compliance_status.get('summary', {}).get('complies_with_regulations', False)

    @property
    def has_critical_issues(self):
        """Check if chart has critical compliance issues."""
        return self.compliance_status.get('summary', {}).get('critical_errors', 0) > 0