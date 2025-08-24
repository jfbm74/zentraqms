"""
Serializers for Organizational Chart models in ZentraQMS.

This module contains DRF serializers for organizational chart management,
including sectors, templates, organizational charts, areas, positions, 
responsibilities, and authorities.

Key Features:
- Nested serializers for complex structures
- Custom validations for business rules
- Dynamic fields based on sector requirements
- Bulk operations support
- Version management support
"""

from decimal import Decimal
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model

from ..models.organizational_chart import (
    Sector, SectorNormativa, PlantillaOrganigrama, OrganizationalChart
)
from ..models.organizational_structure import (
    Area, ServiceAreaAssignment, Cargo, Responsabilidad, Autoridad
)
from ..models import Organization

User = get_user_model()


# =============================================================================
# SECTOR SERIALIZERS
# =============================================================================

class SectorNormativaSerializer(serializers.ModelSerializer):
    """Serializer for SectorNormativa model."""
    
    class Meta:
        model = SectorNormativa
        fields = [
            'id', 'code', 'name', 'description', 'normative_type',
            'is_mandatory', 'is_current', 'requirements',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_requirements(self, value):
        """Validate requirements field structure."""
        if value and not isinstance(value, list):
            raise serializers.ValidationError(
                _("Los requisitos deben ser una lista de elementos")
            )
        return value


class SectorSerializer(serializers.ModelSerializer):
    """Complete serializer for Sector model."""
    
    normativas = SectorNormativaSerializer(many=True, read_only=True)
    normativas_count = serializers.SerializerMethodField()
    templates_count = serializers.SerializerMethodField()
    organizations_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Sector
        fields = [
            'id', 'code', 'name', 'description', 'default_config',
            'normative_requirements', 'has_templates', 'normativas',
            'normativas_count', 'templates_count', 'organizations_count',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'normativas', 'normativas_count', 'templates_count',
            'organizations_count', 'created_at', 'updated_at'
        ]

    def get_normativas_count(self, obj):
        """Get count of normatives for this sector."""
        return obj.normativas.filter(is_active=True).count()

    def get_templates_count(self, obj):
        """Get count of templates for this sector."""
        return obj.org_chart_templates.filter(is_active=True).count()

    def get_organizations_count(self, obj):
        """Get count of organizations using this sector."""
        return obj.organizational_charts.filter(is_active=True).count()

    def validate_default_config(self, value):
        """Validate default configuration structure."""
        if value:
            required_keys = ['hierarchy_levels_default', 'requires_mandatory_committees']
            missing_keys = [key for key in required_keys if key not in value]
            if missing_keys:
                raise serializers.ValidationError(
                    _(f'La configuración debe contener: {", ".join(required_keys)}. '
                      f'Faltan: {", ".join(missing_keys)}')
                )
        return value


class SectorListSerializer(serializers.ModelSerializer):
    """List serializer for Sector model."""
    
    normativas_count = serializers.SerializerMethodField()
    templates_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Sector
        fields = [
            'id', 'code', 'name', 'description', 'has_templates',
            'normativas_count', 'templates_count', 'is_active'
        ]

    def get_normativas_count(self, obj):
        return obj.normativas.filter(is_active=True).count()

    def get_templates_count(self, obj):
        return obj.org_chart_templates.filter(is_active=True).count()


class SectorCreateSerializer(serializers.ModelSerializer):
    """Create serializer for Sector model."""
    
    class Meta:
        model = Sector
        fields = [
            'code', 'name', 'description', 'default_config',
            'normative_requirements', 'has_templates'
        ]

    def validate_default_config(self, value):
        """Validate default configuration on creation."""
        if not value:
            # Set default configuration if not provided
            value = {
                'hierarchy_levels_default': 5,
                'requires_mandatory_committees': False,
                'normative_validations': [],
                'mandatory_positions': [],
                'mandatory_committees': [],
                'applicable_standards': []
            }
        return value


# =============================================================================
# TEMPLATE SERIALIZERS
# =============================================================================

class PlantillaOrganigramaSerializer(serializers.ModelSerializer):
    """Complete serializer for PlantillaOrganigrama model."""
    
    sector_name = serializers.CharField(source='sector.name', read_only=True)
    sector_code = serializers.CharField(source='sector.code', read_only=True)
    usage_statistics = serializers.SerializerMethodField()
    structure_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = PlantillaOrganigrama
        fields = [
            'id', 'sector', 'sector_name', 'sector_code', 'organization_type',
            'name', 'description', 'complexity', 'structure', 'times_used',
            'last_used_date', 'usage_statistics', 'structure_summary',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'sector_name', 'sector_code', 'times_used', 'last_used_date',
            'usage_statistics', 'structure_summary', 'created_at', 'updated_at'
        ]

    def get_usage_statistics(self, obj):
        """Get template usage statistics."""
        return {
            'times_used': obj.times_used,
            'last_used': obj.last_used_date,
            'is_popular': obj.times_used > 10
        }

    def get_structure_summary(self, obj):
        """Get summary of template structure."""
        if not obj.structure:
            return {}
        
        return {
            'areas_count': len(obj.structure.get('areas', [])),
            'positions_count': len(obj.structure.get('positions', [])),
            'committees_count': len(obj.structure.get('committees', [])),
            'hierarchy_levels': obj.structure.get('hierarchy_levels', 0)
        }

    def validate_structure(self, value):
        """Validate template structure."""
        if not value:
            raise serializers.ValidationError(
                _("La estructura del template no puede estar vacía")
            )
        
        required_sections = ['areas', 'positions', 'committees']
        missing_sections = [section for section in required_sections 
                          if section not in value]
        if missing_sections:
            raise serializers.ValidationError(
                _(f'La estructura debe contener: {", ".join(required_sections)}. '
                  f'Faltan: {", ".join(missing_sections)}')
            )
        
        return value


class PlantillaOrganigramaListSerializer(serializers.ModelSerializer):
    """List serializer for PlantillaOrganigrama model."""
    
    sector_name = serializers.CharField(source='sector.name', read_only=True)
    structure_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = PlantillaOrganigrama
        fields = [
            'id', 'sector', 'sector_name', 'organization_type', 'name',
            'complexity', 'times_used', 'structure_summary', 'is_active'
        ]

    def get_structure_summary(self, obj):
        """Get basic structure summary."""
        if not obj.structure:
            return {}
        
        return {
            'areas': len(obj.structure.get('areas', [])),
            'positions': len(obj.structure.get('positions', [])),
            'committees': len(obj.structure.get('committees', []))
        }


class PlantillaOrganigramaCreateSerializer(serializers.ModelSerializer):
    """Create serializer for PlantillaOrganigrama model."""
    
    class Meta:
        model = PlantillaOrganigrama
        fields = [
            'sector', 'organization_type', 'name', 'description',
            'complexity', 'structure'
        ]

    def validate(self, attrs):
        """Validate template creation data."""
        sector = attrs.get('sector')
        organization_type = attrs.get('organization_type')
        complexity = attrs.get('complexity')
        
        # Check for duplicate template
        if PlantillaOrganigrama.objects.filter(
            sector=sector,
            organization_type=organization_type,
            complexity=complexity,
            is_active=True
        ).exists():
            raise serializers.ValidationError(
                _("Ya existe una plantilla para este sector, tipo y complejidad")
            )
        
        return attrs


# =============================================================================
# ORGANIZATIONAL CHART SERIALIZERS
# =============================================================================

class OrganizationalChartSerializer(serializers.ModelSerializer):
    """Complete serializer for OrganizationalChart model."""
    
    organization_name = serializers.CharField(source='organization.nombre_comercial', read_only=True)
    sector_name = serializers.CharField(source='sector.name', read_only=True)
    template_name = serializers.CharField(source='base_template.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    statistics = serializers.SerializerMethodField()
    compliance_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = OrganizationalChart
        fields = [
            'id', 'organization', 'organization_name', 'sector', 'sector_name',
            'organization_type', 'base_template', 'template_name', 'version',
            'effective_date', 'end_date', 'is_current', 'approved_by',
            'approved_by_name', 'approval_date', 'approval_document',
            'hierarchy_levels', 'allows_temporary_positions', 'uses_raci_matrix',
            'sector_config', 'last_validation_date', 'compliance_status',
            'statistics', 'compliance_summary', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organization_name', 'sector_name', 'template_name',
            'approved_by_name', 'statistics', 'compliance_summary',
            'created_at', 'updated_at'
        ]

    def get_statistics(self, obj):
        """Get organizational chart statistics."""
        return {
            'total_positions': obj.get_total_positions(),
            'filled_positions': obj.get_filled_positions(),
            'vacancy_rate': round(obj.get_vacancy_rate(), 2),
            'areas_count': obj.areas.filter(is_active=True).count(),
            'critical_positions': obj.areas.filter(
                positions__is_critical=True, is_active=True
            ).count()
        }

    def get_compliance_summary(self, obj):
        """Get compliance status summary."""
        if not obj.compliance_status:
            return {'status': 'not_validated', 'message': 'Sin validar'}
        
        summary = obj.compliance_status.get('summary', {})
        return {
            'status': 'compliant' if obj.is_compliant else 'non_compliant',
            'critical_errors': summary.get('critical_errors', 0),
            'warnings': summary.get('warnings', 0),
            'last_validated': obj.last_validation_date
        }

    def validate_version(self, value):
        """Validate version format."""
        import re
        if not re.match(r'^\d+\.\d+(\.\d+)?$', value):
            raise serializers.ValidationError(
                _("La versión debe seguir el formato X.Y o X.Y.Z")
            )
        return value

    def validate(self, attrs):
        """Validate organizational chart data."""
        effective_date = attrs.get('effective_date')
        end_date = attrs.get('end_date')
        organization = attrs.get('organization')
        version = attrs.get('version')
        
        # Validate dates
        if effective_date and effective_date > timezone.now().date():
            raise serializers.ValidationError(
                {'effective_date': _("La fecha de vigencia no puede ser futura")}
            )
        
        if end_date and effective_date and end_date <= effective_date:
            raise serializers.ValidationError(
                {'end_date': _("La fecha de fin debe ser posterior a la fecha de vigencia")}
            )
        
        # Validate unique version per organization
        if organization and version:
            existing = OrganizationalChart.objects.filter(
                organization=organization,
                version=version,
                is_active=True
            )
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            
            if existing.exists():
                raise serializers.ValidationError(
                    {'version': _("Ya existe esta versión para la organización")}
                )
        
        return attrs


class OrganizationalChartListSerializer(serializers.ModelSerializer):
    """List serializer for OrganizationalChart model."""
    
    organization_name = serializers.CharField(source='organization.nombre_comercial', read_only=True)
    sector_name = serializers.CharField(source='sector.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    basic_stats = serializers.SerializerMethodField()
    
    class Meta:
        model = OrganizationalChart
        fields = [
            'id', 'organization', 'organization_name', 'sector', 'sector_name',
            'version', 'effective_date', 'is_current', 'approved_by_name',
            'approval_date', 'basic_stats', 'is_active'
        ]

    def get_basic_stats(self, obj):
        """Get basic statistics."""
        return {
            'areas': obj.areas.filter(is_active=True).count(),
            'positions': obj.get_total_positions(),
            'vacancy_rate': round(obj.get_vacancy_rate(), 2)
        }


class OrganizationalChartCreateSerializer(serializers.ModelSerializer):
    """Create serializer for OrganizationalChart model."""
    
    class Meta:
        model = OrganizationalChart
        fields = [
            'organization', 'sector', 'organization_type', 'base_template',
            'version', 'effective_date', 'hierarchy_levels',
            'allows_temporary_positions', 'uses_raci_matrix', 'sector_config'
        ]

    def create(self, validated_data):
        """Create organizational chart with proper version handling."""
        organization = validated_data.get('organization')
        
        # Auto-generate version if not provided
        if not validated_data.get('version'):
            last_chart = OrganizationalChart.objects.filter(
                organization=organization
            ).order_by('-version').first()
            
            if last_chart:
                try:
                    parts = last_chart.version.split('.')
                    major = int(parts[0])
                    minor = int(parts[1]) if len(parts) > 1 else 0
                    validated_data['version'] = f"{major}.{minor + 1}"
                except (ValueError, IndexError):
                    validated_data['version'] = "1.0"
            else:
                validated_data['version'] = "1.0"
        
        return super().create(validated_data)


# =============================================================================
# AREA SERIALIZERS
# =============================================================================

class AreaSerializer(serializers.ModelSerializer):
    """Complete serializer for Area model."""
    
    parent_area_name = serializers.CharField(source='parent_area.name', read_only=True)
    sede_name = serializers.CharField(source='sede.nombre', read_only=True)
    area_manager_name = serializers.CharField(source='area_manager.name', read_only=True)
    statistics = serializers.SerializerMethodField()
    hierarchy_path = serializers.SerializerMethodField()
    
    class Meta:
        model = Area
        fields = [
            'id', 'organizational_chart', 'code', 'name', 'area_type',
            'parent_area', 'parent_area_name', 'hierarchy_level',
            'description', 'main_purpose', 'sede', 'sede_name',
            'requires_license', 'is_revenue_generating', 'physical_location',
            'area_m2', 'capacity_persons', 'area_manager', 'area_manager_name',
            'statistics', 'hierarchy_path', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'parent_area_name', 'sede_name', 'area_manager_name',
            'statistics', 'hierarchy_path', 'created_at', 'updated_at'
        ]

    def get_statistics(self, obj):
        """Get area statistics."""
        return {
            'positions_count': obj.positions.filter(is_active=True).count(),
            'child_areas_count': obj.child_areas.filter(is_active=True).count(),
            'total_positions': obj.get_total_positions(),
            'services_count': obj.health_services.count() + obj.managed_services.count()
        }

    def get_hierarchy_path(self, obj):
        """Get full hierarchy path."""
        path = obj.get_full_hierarchy_path()
        return [{'id': area.id, 'name': area.name, 'level': area.hierarchy_level} 
                for area in path]

    def validate(self, attrs):
        """Validate area data."""
        parent_area = attrs.get('parent_area')
        hierarchy_level = attrs.get('hierarchy_level')
        organizational_chart = attrs.get('organizational_chart')
        code = attrs.get('code')
        
        # Validate hierarchy level consistency
        if parent_area and hierarchy_level:
            if hierarchy_level <= parent_area.hierarchy_level:
                raise serializers.ValidationError(
                    {'hierarchy_level': _("El nivel jerárquico debe ser mayor que el del área padre")}
                )
        
        # Validate unique code per chart
        if organizational_chart and code:
            existing = Area.objects.filter(
                organizational_chart=organizational_chart,
                code=code,
                is_active=True
            )
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            
            if existing.exists():
                raise serializers.ValidationError(
                    {'code': _("Ya existe un área con este código en el organigrama")}
                )
        
        return attrs


class AreaListSerializer(serializers.ModelSerializer):
    """List serializer for Area model."""
    
    parent_area_name = serializers.CharField(source='parent_area.name', read_only=True)
    positions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Area
        fields = [
            'id', 'code', 'name', 'area_type', 'parent_area', 'parent_area_name',
            'hierarchy_level', 'requires_license', 'positions_count', 'is_active'
        ]

    def get_positions_count(self, obj):
        return obj.positions.filter(is_active=True).count()


class AreaCreateSerializer(serializers.ModelSerializer):
    """Create serializer for Area model."""
    
    class Meta:
        model = Area
        fields = [
            'organizational_chart', 'code', 'name', 'area_type', 'parent_area',
            'hierarchy_level', 'description', 'main_purpose', 'sede',
            'requires_license', 'is_revenue_generating', 'physical_location',
            'area_m2', 'capacity_persons'
        ]


# =============================================================================
# POSITION SERIALIZERS
# =============================================================================

class ResponsabilidadSerializer(serializers.ModelSerializer):
    """Serializer for Responsabilidad model."""
    
    class Meta:
        model = Responsabilidad
        fields = [
            'id', 'description', 'responsibility_type', 'frequency',
            'is_normative_requirement', 'normative_reference',
            'performance_indicator', 'raci_role', 'priority_level',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AutoridadSerializer(serializers.ModelSerializer):
    """Serializer for Autoridad model."""
    
    approving_committee_name = serializers.CharField(
        source='approving_committee.nombre', read_only=True
    )
    
    class Meta:
        model = Autoridad
        fields = [
            'id', 'description', 'decision_type', 'financial_limit',
            'requires_superior_validation', 'requires_committee_approval',
            'approving_committee', 'approving_committee_name', 'scope',
            'can_delegate', 'delegation_conditions', 'is_temporary',
            'valid_from', 'valid_until', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'approving_committee_name', 'created_at', 'updated_at']


class CargoSerializer(serializers.ModelSerializer):
    """Complete serializer for Cargo model."""
    
    area_name = serializers.CharField(source='area.name', read_only=True)
    reports_to_name = serializers.CharField(source='reports_to.name', read_only=True)
    responsibilities = ResponsabilidadSerializer(many=True, read_only=True)
    authorities = AutoridadSerializer(many=True, read_only=True)
    statistics = serializers.SerializerMethodField()
    command_chain = serializers.SerializerMethodField()
    
    class Meta:
        model = Cargo
        fields = [
            'id', 'area', 'area_name', 'code', 'name', 'hierarchy_level',
            'reports_to', 'reports_to_name', 'main_purpose', 'requirements',
            'is_critical', 'is_process_owner', 'is_service_leader',
            'requires_professional_license', 'requires_sst_license',
            'authorized_positions', 'salary_range_min', 'salary_range_max',
            'position_type', 'responsibilities', 'authorities', 'statistics',
            'command_chain', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'area_name', 'reports_to_name', 'responsibilities',
            'authorities', 'statistics', 'command_chain',
            'created_at', 'updated_at'
        ]

    def get_statistics(self, obj):
        """Get position statistics."""
        current_assignments = obj.get_current_assignments()
        return {
            'current_assignments': current_assignments.count(),
            'vacancy_count': obj.get_vacancy_count(),
            'is_occupied': obj.is_occupied(),
            'span_of_control': obj.get_span_of_control(),
            'responsibilities_count': obj.responsibilities.filter(is_active=True).count(),
            'authorities_count': obj.authorities.filter(is_active=True).count()
        }

    def get_command_chain(self, obj):
        """Get command chain hierarchy."""
        chain = obj.get_command_chain()
        return [{'id': pos.id, 'name': pos.name, 'code': pos.code} for pos in chain]

    def validate_requirements(self, value):
        """Validate requirements structure."""
        if value and not isinstance(value, dict):
            raise serializers.ValidationError(
                _("Los requisitos deben ser un objeto con estructura específica")
            )
        return value

    def validate(self, attrs):
        """Validate position data."""
        area = attrs.get('area')
        code = attrs.get('code')
        salary_min = attrs.get('salary_range_min')
        salary_max = attrs.get('salary_range_max')
        
        # Validate unique code per area
        if area and code:
            existing = Cargo.objects.filter(
                area=area,
                code=code,
                is_active=True
            )
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            
            if existing.exists():
                raise serializers.ValidationError(
                    {'code': _("Ya existe un cargo con este código en el área")}
                )
        
        # Validate salary range
        if salary_min and salary_max and salary_min >= salary_max:
            raise serializers.ValidationError(
                {'salary_range_max': _("El salario máximo debe ser mayor que el mínimo")}
            )
        
        return attrs


class CargoListSerializer(serializers.ModelSerializer):
    """List serializer for Cargo model."""
    
    area_name = serializers.CharField(source='area.name', read_only=True)
    reports_to_name = serializers.CharField(source='reports_to.name', read_only=True)
    basic_stats = serializers.SerializerMethodField()
    
    class Meta:
        model = Cargo
        fields = [
            'id', 'area', 'area_name', 'code', 'name', 'hierarchy_level',
            'reports_to_name', 'is_critical', 'authorized_positions',
            'basic_stats', 'is_active'
        ]

    def get_basic_stats(self, obj):
        """Get basic statistics."""
        return {
            'occupied': obj.get_current_assignments().count(),
            'vacancy': obj.get_vacancy_count(),
            'subordinates': obj.get_span_of_control()
        }


class CargoCreateSerializer(serializers.ModelSerializer):
    """Create serializer for Cargo model."""
    
    class Meta:
        model = Cargo
        fields = [
            'area', 'code', 'name', 'hierarchy_level', 'reports_to',
            'main_purpose', 'requirements', 'is_critical', 'is_process_owner',
            'is_service_leader', 'requires_professional_license',
            'requires_sst_license', 'authorized_positions', 'salary_range_min',
            'salary_range_max', 'position_type'
        ]


# =============================================================================
# BULK OPERATION SERIALIZERS
# =============================================================================

class BulkAreaCreateSerializer(serializers.Serializer):
    """Serializer for bulk area creation."""
    
    areas = serializers.ListField(
        child=AreaCreateSerializer(),
        min_length=1,
        max_length=50
    )
    
    validate_only = serializers.BooleanField(default=False)
    
    def validate_areas(self, value):
        """Validate areas data for bulk creation."""
        codes = []
        for area_data in value:
            code = area_data.get('code')
            if code in codes:
                raise serializers.ValidationError(
                    _(f"Código duplicado encontrado: {code}")
                )
            codes.append(code)
        
        return value


class BulkPositionCreateSerializer(serializers.Serializer):
    """Serializer for bulk position creation."""
    
    positions = serializers.ListField(
        child=CargoCreateSerializer(),
        min_length=1,
        max_length=100
    )
    
    validate_only = serializers.BooleanField(default=False)
    
    def validate_positions(self, value):
        """Validate positions data for bulk creation."""
        codes_by_area = {}
        for position_data in value:
            area_id = position_data.get('area')
            code = position_data.get('code')
            
            if area_id not in codes_by_area:
                codes_by_area[area_id] = []
            
            if code in codes_by_area[area_id]:
                raise serializers.ValidationError(
                    _(f"Código duplicado en área {area_id}: {code}")
                )
            codes_by_area[area_id].append(code)
        
        return value


# =============================================================================
# VALIDATION SERIALIZERS
# =============================================================================

class ChartValidationSerializer(serializers.Serializer):
    """Serializer for organizational chart validation."""
    
    chart_id = serializers.UUIDField()
    validation_types = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            ('structure', 'Estructura'),
            ('compliance', 'Cumplimiento'),
            ('completeness', 'Completitud'),
            ('consistency', 'Consistencia')
        ]),
        default=['structure', 'compliance']
    )
    
    def validate_chart_id(self, value):
        """Validate chart exists."""
        try:
            OrganizationalChart.objects.get(id=value, is_active=True)
        except OrganizationalChart.DoesNotExist:
            raise serializers.ValidationError(
                _("Organigrama no encontrado")
            )
        return value


class TemplateApplicationSerializer(serializers.Serializer):
    """Serializer for applying organizational chart templates."""
    
    template_id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    customizations = serializers.JSONField(default=dict)
    version = serializers.CharField(max_length=10, required=False)
    effective_date = serializers.DateField(default=timezone.now().date)
    
    def validate_template_id(self, value):
        """Validate template exists and is active."""
        try:
            PlantillaOrganigrama.objects.get(id=value, is_active=True)
        except PlantillaOrganigrama.DoesNotExist:
            raise serializers.ValidationError(
                _("Plantilla no encontrada")
            )
        return value
    
    def validate_organization_id(self, value):
        """Validate organization exists."""
        try:
            Organization.objects.get(id=value, is_active=True)
        except Organization.DoesNotExist:
            raise serializers.ValidationError(
                _("Organización no encontrada")
            )
        return value