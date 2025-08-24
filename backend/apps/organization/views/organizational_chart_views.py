"""
ViewSets for Organizational Chart functionality in ZentraQMS.

This module contains ViewSets for managing organizational charts,
sectors, templates, areas, positions, and related entities.

Key Features:
- RBAC permission integration
- Bulk operations support
- Real-time validation
- Version management
- Template application
- Compliance validation
"""

import logging
from datetime import datetime, timedelta
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Count, Prefetch
from django.shortcuts import get_object_or_404

from apps.authorization.drf_permissions import (
    HasPermission,
    HasAnyRole,
    DynamicPermission,
    CanViewOrganizationalChart,
    CanCreateOrganizationalChart,
    CanUpdateOrganizationalChart,
    CanDeleteOrganizationalChart,
    CanApproveOrganizationalChart,
    CanValidateOrganizationalChart,
    CanManageTemplates,
    CanApplyTemplates,
    CanManageSectors
)

from ..models.organizational_chart import (
    Sector, SectorNormativa, PlantillaOrganigrama, OrganizationalChart
)
from ..models.organizational_structure import (
    Area, ServiceAreaAssignment, Cargo, Responsabilidad, Autoridad
)
from ..models import Organization

from ..serializers.organizational_chart_serializers import (
    # Sector serializers
    SectorNormativaSerializer,
    SectorSerializer,
    SectorListSerializer,
    SectorCreateSerializer,
    
    # Template serializers
    PlantillaOrganigramaSerializer,
    PlantillaOrganigramaListSerializer,
    PlantillaOrganigramaCreateSerializer,
    
    # Organizational chart serializers
    OrganizationalChartSerializer,
    OrganizationalChartListSerializer,
    OrganizationalChartCreateSerializer,
    
    # Area serializers
    AreaSerializer,
    AreaListSerializer,
    AreaCreateSerializer,
    
    # Position serializers
    ResponsabilidadSerializer,
    AutoridadSerializer,
    CargoSerializer,
    CargoListSerializer,
    CargoCreateSerializer,
    
    # Bulk operation serializers
    BulkAreaCreateSerializer,
    BulkPositionCreateSerializer,
    
    # Validation serializers
    ChartValidationSerializer,
    TemplateApplicationSerializer,
)

from ..services.organizational_chart_service import (
    OrganizationalChartValidationService,
    OrganizationalChartComplianceService
)
from ..services.performance_service import OrganizationalChartPerformanceService

logger = logging.getLogger(__name__)


# =============================================================================
# SECTOR VIEWSETS
# =============================================================================

class SectorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organizational sectors.
    
    Provides CRUD operations for sectors and their normative requirements.
    Only super admins can create/modify sectors.
    """
    
    queryset = Sector.objects.all().prefetch_related('normativas')
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['code']
    filterset_fields = ['code', 'has_templates', 'is_active']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return SectorListSerializer
        elif self.action == 'create':
            return SectorCreateSerializer
        return SectorSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [
                permissions.IsAuthenticated,
                HasAnyRole
            ]
            # Only super admins can modify sectors
            self.required_roles = ['super_admin', 'admin']
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on user permissions."""
        queryset = super().get_queryset()
        
        # Only show active sectors by default
        if not self.request.query_params.get('include_inactive'):
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def normativas(self, request, pk=None):
        """Get all normatives for a sector."""
        sector = self.get_object()
        normativas = sector.normativas.filter(is_active=True)
        serializer = SectorNormativaSerializer(normativas, many=True)
        
        return Response({
            'sector': sector.name,
            'normativas': serializer.data,
            'count': normativas.count()
        })
    
    @action(detail=True, methods=['post'])
    def add_normativa(self, request, pk=None):
        """Add a normative requirement to a sector."""
        sector = self.get_object()
        data = request.data.copy()
        data['sector'] = sector.id
        
        serializer = SectorNormativaSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def templates(self, request, pk=None):
        """Get all templates for a sector."""
        sector = self.get_object()
        templates = sector.org_chart_templates.filter(is_active=True)
        serializer = PlantillaOrganigramaListSerializer(templates, many=True)
        
        return Response({
            'sector': sector.name,
            'templates': serializer.data,
            'count': templates.count()
        })
    
    @action(detail=True, methods=['get'])
    def organizations(self, request, pk=None):
        """Get organizations using this sector."""
        sector = self.get_object()
        charts = sector.organizational_charts.filter(is_active=True, is_current=True)
        
        organizations_data = []
        for chart in charts:
            organizations_data.append({
                'id': chart.organization.id,
                'name': chart.organization.nombre_comercial,
                'chart_version': chart.version,
                'effective_date': chart.effective_date
            })
        
        return Response({
            'sector': sector.name,
            'organizations': organizations_data,
            'count': len(organizations_data)
        })


class SectorNormativaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing sector normative requirements.
    
    Provides CRUD operations for normative requirements within sectors.
    """
    
    queryset = SectorNormativa.objects.all().select_related('sector')
    serializer_class = SectorNormativaSerializer
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'normative_type', 'created_at']
    ordering = ['sector__name', 'normative_type', 'name']
    filterset_fields = ['sector', 'normative_type', 'is_mandatory', 'is_current']
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [
                permissions.IsAuthenticated,
                HasAnyRole
            ]
            self.required_roles = ['super_admin', 'admin']
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on sector if provided."""
        queryset = super().get_queryset()
        
        sector_id = self.request.query_params.get('sector')
        if sector_id:
            queryset = queryset.filter(sector_id=sector_id)
        
        return queryset.filter(is_active=True)


# =============================================================================
# TEMPLATE VIEWSETS
# =============================================================================

class PlantillaOrganigramaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organizational chart templates.
    
    Provides CRUD operations for templates and template application functionality.
    """
    
    queryset = PlantillaOrganigrama.objects.all().select_related('sector')
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'organization_type', 'description']
    ordering_fields = ['name', 'organization_type', 'complexity', 'times_used', 'created_at']
    ordering = ['sector__name', 'organization_type', 'complexity']
    filterset_fields = ['sector', 'organization_type', 'complexity', 'is_active']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return PlantillaOrganigramaListSerializer
        elif self.action == 'create':
            return PlantillaOrganigramaCreateSerializer
        elif self.action == 'apply_template':
            return TemplateApplicationSerializer
        return PlantillaOrganigramaSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        elif self.action == 'apply_template':
            permission_classes = [
                permissions.IsAuthenticated,
                HasPermission
            ]
            self.required_permission = 'organization.create_orgchart'
        else:
            permission_classes = [
                permissions.IsAuthenticated,
                HasAnyRole
            ]
            self.required_roles = ['super_admin', 'admin']
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on parameters."""
        queryset = super().get_queryset().filter(is_active=True)
        
        # Filter by sector if provided
        sector_code = self.request.query_params.get('sector')
        if sector_code:
            queryset = queryset.filter(sector__code=sector_code)
        
        # Filter by organization type
        org_type = self.request.query_params.get('organization_type')
        if org_type:
            queryset = queryset.filter(organization_type__icontains=org_type)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def apply_template(self, request, pk=None):
        """Apply template to create organizational chart."""
        template = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # Get validated data
                    organization_id = serializer.validated_data['organization_id']
                    customizations = serializer.validated_data.get('customizations', {})
                    version = serializer.validated_data.get('version')
                    effective_date = serializer.validated_data['effective_date']
                    
                    # Get organization
                    organization = get_object_or_404(Organization, id=organization_id)
                    
                    # Create organizational chart from template
                    chart = self._create_chart_from_template(
                        template, organization, customizations, version, effective_date, request.user
                    )
                    
                    # Update template usage statistics
                    template.increment_usage()
                    
                    # Return created chart
                    chart_serializer = OrganizationalChartSerializer(chart)
                    return Response({
                        'success': True,
                        'message': _('Plantilla aplicada exitosamente'),
                        'chart': chart_serializer.data
                    }, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                logger.error(f"Error applying template {template.id}: {str(e)}")
                return Response({
                    'success': False,
                    'message': _('Error aplicando la plantilla'),
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _create_chart_from_template(self, template, organization, customizations, version, effective_date, user):
        """Create organizational chart from template structure."""
        # Create the organizational chart
        chart_data = {
            'organization': organization,
            'sector': template.sector,
            'organization_type': template.organization_type,
            'base_template': template,
            'version': version or '1.0',
            'effective_date': effective_date,
            'hierarchy_levels': template.structure.get('hierarchy_levels', 5),
            'allows_temporary_positions': True,
            'uses_raci_matrix': True,
            'sector_config': customizations
        }
        
        chart = OrganizationalChart.objects.create(**chart_data)
        
        # Create areas from template
        areas_map = {}
        for area_data in template.structure.get('areas', []):
            area = Area.objects.create(
                organizational_chart=chart,
                code=area_data['code'],
                name=area_data['name'],
                area_type=area_data.get('type', 'DEPARTMENT'),
                hierarchy_level=area_data.get('level', 1),
                description=area_data.get('description', ''),
                main_purpose=area_data.get('purpose', ''),
                created_by=user,
                updated_by=user
            )
            areas_map[area_data['code']] = area
        
        # Set parent relationships for areas
        for area_data in template.structure.get('areas', []):
            parent_code = area_data.get('parent_code')
            if parent_code and parent_code in areas_map:
                area = areas_map[area_data['code']]
                area.parent_area = areas_map[parent_code]
                area.save()
        
        # Create positions from template
        for position_data in template.structure.get('positions', []):
            area_code = position_data.get('area_code')
            if area_code in areas_map:
                Cargo.objects.create(
                    area=areas_map[area_code],
                    code=position_data['code'],
                    name=position_data['name'],
                    hierarchy_level=position_data.get('level', 'PROFESSIONAL'),
                    main_purpose=position_data.get('purpose', ''),
                    is_critical=position_data.get('is_critical', False),
                    authorized_positions=position_data.get('authorized_positions', 1),
                    requirements=position_data.get('requirements', {}),
                    created_by=user,
                    updated_by=user
                )
        
        return chart
    
    @action(detail=False, methods=['get'])
    def by_sector(self, request):
        """Get templates filtered by sector."""
        sector_code = request.query_params.get('sector')
        if not sector_code:
            return Response({
                'error': _('Parámetro sector es requerido')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        templates = self.get_queryset().filter(sector__code=sector_code)
        serializer = self.get_serializer(templates, many=True)
        
        return Response({
            'sector': sector_code,
            'templates': serializer.data,
            'count': templates.count()
        })
    
    @action(detail=True, methods=['post'])
    def clone_template(self, request, pk=None):
        """Clone an existing template with modifications."""
        original_template = self.get_object()
        data = request.data.copy()
        
        # Remove fields that should be unique
        data.pop('id', None)
        data['name'] = data.get('name', f"{original_template.name} (Copia)")
        data['structure'] = original_template.structure
        data['times_used'] = 0
        data['last_used_date'] = None
        
        serializer = PlantillaOrganigramaCreateSerializer(data=data)
        if serializer.is_valid():
            new_template = serializer.save()
            response_serializer = PlantillaOrganigramaSerializer(new_template)
            
            return Response({
                'success': True,
                'message': _('Plantilla clonada exitosamente'),
                'template': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# ORGANIZATIONAL CHART VIEWSETS
# =============================================================================

class OrganizationalChartViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organizational charts.
    
    Provides CRUD operations, version management, approval workflow,
    and compliance validation for organizational charts.
    """
    
    queryset = OrganizationalChart.objects.all().select_related(
        'organization', 'sector', 'base_template', 'approved_by'
    ).prefetch_related('areas__positions')
    
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['organization__nombre_comercial', 'version', 'organization_type']
    ordering_fields = ['version', 'effective_date', 'approval_date', 'created_at']
    ordering = ['-effective_date', '-version']
    filterset_fields = ['organization', 'sector', 'is_current', 'is_active']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return OrganizationalChartListSerializer
        elif self.action == 'create':
            return OrganizationalChartCreateSerializer
        elif self.action == 'validate_chart':
            return ChartValidationSerializer
        return OrganizationalChartSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ['list', 'retrieve']:
            permission_classes = [
                permissions.IsAuthenticated,
                HasPermission
            ]
            self.required_permission = 'organization.read'
        elif self.action in ['create', 'update', 'partial_update']:
            permission_classes = [
                permissions.IsAuthenticated,
                HasPermission
            ]
            self.required_permission = 'organization.create_orgchart'
        elif self.action in ['destroy', 'approve_chart']:
            permission_classes = [
                permissions.IsAuthenticated,
                HasAnyRole
            ]
            self.required_roles = ['admin', 'super_admin']
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on user context and parameters."""
        # Use performance-optimized queryset
        org_id = self.request.query_params.get('organization')
        queryset = OrganizationalChartPerformanceService.get_optimized_chart_queryset(
            user=self.request.user,
            organization_id=org_id
        )
        
        # Filter by current charts only if requested
        current_only = self.request.query_params.get('current_only', 'false')
        if current_only.lower() == 'true':
            queryset = queryset.filter(is_current=True)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def areas(self, request, pk=None):
        """Get all areas for an organizational chart."""
        chart = self.get_object()
        areas = chart.areas.filter(is_active=True).order_by('hierarchy_level', 'code')
        serializer = AreaListSerializer(areas, many=True)
        
        return Response({
            'chart': f"{chart.organization.nombre_comercial} v{chart.version}",
            'areas': serializer.data,
            'count': areas.count()
        })
    
    @action(detail=True, methods=['get'])
    def positions(self, request, pk=None):
        """Get all positions for an organizational chart."""
        chart = self.get_object()
        positions = Cargo.objects.filter(
            area__organizational_chart=chart,
            is_active=True
        ).select_related('area').order_by('area__hierarchy_level', 'code')
        
        serializer = CargoListSerializer(positions, many=True)
        
        return Response({
            'chart': f"{chart.organization.nombre_comercial} v{chart.version}",
            'positions': serializer.data,
            'count': positions.count()
        })
    
    @action(detail=True, methods=['get'])
    def hierarchy(self, request, pk=None):
        """Get complete hierarchy tree for an organizational chart."""
        chart = self.get_object()
        
        use_cache = request.query_params.get('use_cache', 'true').lower() == 'true'
        hierarchy_data = OrganizationalChartPerformanceService.get_chart_hierarchy_tree(
            str(chart.id), use_cache=use_cache
        )
        
        if not hierarchy_data:
            return Response(
                {'error': _('No se pudo generar la jerarquía del organigrama')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(hierarchy_data)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get comprehensive statistics for an organizational chart."""
        chart = self.get_object()
        
        use_cache = request.query_params.get('use_cache', 'true').lower() == 'true'
        stats_data = OrganizationalChartPerformanceService.get_chart_statistics(
            str(chart.id), use_cache=use_cache
        )
        
        if not stats_data:
            return Response(
                {'error': _('No se pudieron generar las estadísticas del organigrama')},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(stats_data)
    
    @action(detail=True, methods=['post'])
    def validate_chart(self, request, pk=None):
        """Validate organizational chart against sector requirements."""
        chart = self.get_object()
        
        try:
            # Perform validation
            validation_results = chart.validate_compliance()
            
            return Response({
                'success': True,
                'chart_id': chart.id,
                'validation_results': validation_results,
                'last_validated': chart.last_validation_date,
                'is_compliant': chart.is_compliant,
                'has_critical_issues': chart.has_critical_issues
            })
        
        except Exception as e:
            logger.error(f"Error validating chart {chart.id}: {str(e)}")
            return Response({
                'success': False,
                'message': _('Error en la validación'),
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def approve_chart(self, request, pk=None):
        """Approve an organizational chart."""
        chart = self.get_object()
        
        if chart.approved_by:
            return Response({
                'success': False,
                'message': _('El organigrama ya está aprobado')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', '')
        approval_document = request.FILES.get('approval_document')
        
        try:
            chart.approve(
                user=request.user,
                approval_document=approval_document,
                reason=reason
            )
            
            serializer = OrganizationalChartSerializer(chart)
            return Response({
                'success': True,
                'message': _('Organigrama aprobado exitosamente'),
                'chart': serializer.data
            })
        
        except Exception as e:
            logger.error(f"Error approving chart {chart.id}: {str(e)}")
            return Response({
                'success': False,
                'message': _('Error en la aprobación'),
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def create_new_version(self, request, pk=None):
        """Create a new version of an organizational chart."""
        current_chart = self.get_object()
        
        # Create new version data
        new_version_data = request.data.copy()
        
        # Auto-increment version
        next_version = current_chart.get_next_version()
        new_version_data['version'] = next_version
        new_version_data['organization'] = current_chart.organization.id
        new_version_data['sector'] = current_chart.sector.id
        new_version_data['effective_date'] = timezone.now().date()
        new_version_data['is_current'] = False  # Will be set when approved
        
        serializer = OrganizationalChartCreateSerializer(data=new_version_data)
        if serializer.is_valid():
            new_chart = serializer.save()
            
            # Copy structure from current chart if requested
            if request.data.get('copy_structure', True):
                self._copy_chart_structure(current_chart, new_chart, request.user)
            
            response_serializer = OrganizationalChartSerializer(new_chart)
            return Response({
                'success': True,
                'message': _('Nueva versión creada exitosamente'),
                'chart': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _copy_chart_structure(self, source_chart, target_chart, user):
        """Copy areas and positions from source chart to target chart."""
        # Copy areas
        areas_map = {}
        source_areas = source_chart.areas.filter(is_active=True).order_by('hierarchy_level')
        
        for source_area in source_areas:
            new_area = Area.objects.create(
                organizational_chart=target_chart,
                code=source_area.code,
                name=source_area.name,
                area_type=source_area.area_type,
                hierarchy_level=source_area.hierarchy_level,
                description=source_area.description,
                main_purpose=source_area.main_purpose,
                sede=source_area.sede,
                requires_license=source_area.requires_license,
                is_revenue_generating=source_area.is_revenue_generating,
                physical_location=source_area.physical_location,
                area_m2=source_area.area_m2,
                capacity_persons=source_area.capacity_persons,
                created_by=user,
                updated_by=user
            )
            areas_map[source_area.id] = new_area
        
        # Set parent relationships
        for source_area in source_areas:
            if source_area.parent_area_id:
                new_area = areas_map[source_area.id]
                new_area.parent_area = areas_map[source_area.parent_area_id]
                new_area.save()
        
        # Copy positions
        positions_map = {}
        source_positions = Cargo.objects.filter(
            area__organizational_chart=source_chart,
            is_active=True
        ).select_related('area')
        
        for source_position in source_positions:
            new_position = Cargo.objects.create(
                area=areas_map[source_position.area.id],
                code=source_position.code,
                name=source_position.name,
                hierarchy_level=source_position.hierarchy_level,
                main_purpose=source_position.main_purpose,
                requirements=source_position.requirements,
                is_critical=source_position.is_critical,
                is_process_owner=source_position.is_process_owner,
                is_service_leader=source_position.is_service_leader,
                requires_professional_license=source_position.requires_professional_license,
                requires_sst_license=source_position.requires_sst_license,
                authorized_positions=source_position.authorized_positions,
                salary_range_min=source_position.salary_range_min,
                salary_range_max=source_position.salary_range_max,
                position_type=source_position.position_type,
                created_by=user,
                updated_by=user
            )
            positions_map[source_position.id] = new_position
        
        # Set reporting relationships
        for source_position in source_positions:
            if source_position.reports_to_id:
                new_position = positions_map[source_position.id]
                new_position.reports_to = positions_map[source_position.reports_to_id]
                new_position.save()


# =============================================================================
# AREA VIEWSETS
# =============================================================================

class AreaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organizational areas.
    
    Provides CRUD operations for areas within organizational charts.
    """
    
    queryset = Area.objects.all().select_related(
        'organizational_chart', 'parent_area', 'sede', 'area_manager'
    ).prefetch_related('positions', 'child_areas')
    
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'hierarchy_level', 'created_at']
    ordering = ['hierarchy_level', 'code']
    filterset_fields = ['organizational_chart', 'area_type', 'parent_area', 'hierarchy_level']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return AreaListSerializer
        elif self.action == 'create':
            return AreaCreateSerializer
        elif self.action == 'bulk_create':
            return BulkAreaCreateSerializer
        return AreaSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        permission_classes = [
            permissions.IsAuthenticated,
            HasPermission
        ]
        
        if self.action in ['list', 'retrieve']:
            self.required_permission = 'organization.read'
        else:
            self.required_permission = 'organization.create_orgchart'
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on organizational chart."""
        queryset = super().get_queryset().filter(is_active=True)
        
        chart_id = self.request.query_params.get('chart')
        if chart_id:
            queryset = queryset.filter(organizational_chart_id=chart_id)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple areas in one operation."""
        serializer = BulkAreaCreateSerializer(data=request.data)
        if serializer.is_valid():
            areas_data = serializer.validated_data['areas']
            validate_only = serializer.validated_data.get('validate_only', False)
            
            if validate_only:
                return Response({
                    'success': True,
                    'message': _('Validación exitosa'),
                    'areas_count': len(areas_data)
                })
            
            try:
                with transaction.atomic():
                    created_areas = []
                    
                    for area_data in areas_data:
                        area_serializer = AreaCreateSerializer(data=area_data)
                        if area_serializer.is_valid():
                            area = area_serializer.save(
                                created_by=request.user,
                                updated_by=request.user
                            )
                            created_areas.append(area)
                        else:
                            return Response({
                                'success': False,
                                'errors': area_serializer.errors
                            }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Return created areas
                    serializer = AreaListSerializer(created_areas, many=True)
                    return Response({
                        'success': True,
                        'message': _('Áreas creadas exitosamente'),
                        'areas': serializer.data,
                        'count': len(created_areas)
                    }, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                logger.error(f"Error in bulk create areas: {str(e)}")
                return Response({
                    'success': False,
                    'message': _('Error en la creación masiva'),
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def positions(self, request, pk=None):
        """Get all positions within this area."""
        area = self.get_object()
        positions = area.positions.filter(is_active=True)
        serializer = CargoListSerializer(positions, many=True)
        
        return Response({
            'area': area.name,
            'positions': serializer.data,
            'count': positions.count()
        })
    
    @action(detail=True, methods=['get'])
    def hierarchy(self, request, pk=None):
        """Get complete hierarchy for this area."""
        area = self.get_object()
        
        # Get hierarchy path
        hierarchy_path = area.get_full_hierarchy_path()
        path_data = [{'id': a.id, 'name': a.name, 'level': a.hierarchy_level} 
                     for a in hierarchy_path]
        
        # Get child areas
        child_areas = area.get_all_child_areas()
        children_data = [{'id': a.id, 'name': a.name, 'level': a.hierarchy_level} 
                        for a in child_areas]
        
        return Response({
            'area': area.name,
            'hierarchy_path': path_data,
            'child_areas': children_data,
            'total_descendants': len(child_areas)
        })


# =============================================================================
# POSITION VIEWSETS
# =============================================================================

class CargoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organizational positions.
    
    Provides CRUD operations for positions within areas.
    """
    
    queryset = Cargo.objects.all().select_related(
        'area__organizational_chart', 'reports_to'
    ).prefetch_related('responsibilities', 'authorities')
    
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'code', 'main_purpose']
    ordering_fields = ['name', 'code', 'hierarchy_level', 'created_at']
    ordering = ['area__hierarchy_level', 'code']
    filterset_fields = [
        'area', 'hierarchy_level', 'is_critical', 'is_process_owner', 
        'is_service_leader', 'requires_professional_license'
    ]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return CargoListSerializer
        elif self.action == 'create':
            return CargoCreateSerializer
        elif self.action == 'bulk_create':
            return BulkPositionCreateSerializer
        return CargoSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        permission_classes = [
            permissions.IsAuthenticated,
            HasPermission
        ]
        
        if self.action in ['list', 'retrieve']:
            self.required_permission = 'organization.read'
        else:
            self.required_permission = 'organization.create_orgchart'
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on area or chart."""
        queryset = super().get_queryset().filter(is_active=True)
        
        area_id = self.request.query_params.get('area')
        if area_id:
            queryset = queryset.filter(area_id=area_id)
        
        chart_id = self.request.query_params.get('chart')
        if chart_id:
            queryset = queryset.filter(area__organizational_chart_id=chart_id)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple positions in one operation."""
        serializer = BulkPositionCreateSerializer(data=request.data)
        if serializer.is_valid():
            positions_data = serializer.validated_data['positions']
            validate_only = serializer.validated_data.get('validate_only', False)
            
            if validate_only:
                return Response({
                    'success': True,
                    'message': _('Validación exitosa'),
                    'positions_count': len(positions_data)
                })
            
            try:
                with transaction.atomic():
                    created_positions = []
                    
                    for position_data in positions_data:
                        position_serializer = CargoCreateSerializer(data=position_data)
                        if position_serializer.is_valid():
                            position = position_serializer.save(
                                created_by=request.user,
                                updated_by=request.user
                            )
                            created_positions.append(position)
                        else:
                            return Response({
                                'success': False,
                                'errors': position_serializer.errors
                            }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Return created positions
                    serializer = CargoListSerializer(created_positions, many=True)
                    return Response({
                        'success': True,
                        'message': _('Cargos creados exitosamente'),
                        'positions': serializer.data,
                        'count': len(created_positions)
                    }, status=status.HTTP_201_CREATED)
            
            except Exception as e:
                logger.error(f"Error in bulk create positions: {str(e)}")
                return Response({
                    'success': False,
                    'message': _('Error en la creación masiva'),
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def responsibilities(self, request, pk=None):
        """Get all responsibilities for this position."""
        position = self.get_object()
        responsibilities = position.responsibilities.filter(is_active=True)
        serializer = ResponsabilidadSerializer(responsibilities, many=True)
        
        return Response({
            'position': position.name,
            'responsibilities': serializer.data,
            'count': responsibilities.count()
        })
    
    @action(detail=True, methods=['get'])
    def authorities(self, request, pk=None):
        """Get all authorities for this position."""
        position = self.get_object()
        authorities = position.authorities.filter(is_active=True)
        serializer = AutoridadSerializer(authorities, many=True)
        
        return Response({
            'position': position.name,
            'authorities': serializer.data,
            'count': authorities.count()
        })
    
    @action(detail=True, methods=['get'])
    def reporting_structure(self, request, pk=None):
        """Get complete reporting structure for this position."""
        position = self.get_object()
        
        # Get command chain (superiors)
        command_chain = position.get_command_chain()
        chain_data = [{'id': p.id, 'name': p.name, 'code': p.code} 
                     for p in command_chain]
        
        # Get subordinates
        subordinates = position.get_all_subordinates()
        subordinates_data = [{'id': p.id, 'name': p.name, 'code': p.code, 
                             'area': p.area.name} for p in subordinates]
        
        return Response({
            'position': position.name,
            'command_chain': chain_data,
            'subordinates': subordinates_data,
            'span_of_control': position.get_span_of_control(),
            'total_subordinates': len(subordinates)
        })


# =============================================================================
# RESPONSIBILITY AND AUTHORITY VIEWSETS
# =============================================================================

class ResponsabilidadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing position responsibilities.
    """
    
    queryset = Responsabilidad.objects.all().select_related('position')
    serializer_class = ResponsabilidadSerializer
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['description', 'normative_reference']
    ordering_fields = ['responsibility_type', 'priority_level', 'frequency']
    ordering = ['position__name', 'responsibility_type', 'priority_level']
    filterset_fields = [
        'position', 'responsibility_type', 'frequency', 
        'is_normative_requirement', 'priority_level', 'raci_role'
    ]
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        permission_classes = [
            permissions.IsAuthenticated,
            HasPermission
        ]
        
        if self.action in ['list', 'retrieve']:
            self.required_permission = 'organization.read'
        else:
            self.required_permission = 'organization.create_orgchart'
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on position."""
        queryset = super().get_queryset().filter(is_active=True)
        
        position_id = self.request.query_params.get('position')
        if position_id:
            queryset = queryset.filter(position_id=position_id)
        
        return queryset


class AutoridadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing position authorities.
    """
    
    queryset = Autoridad.objects.all().select_related('position', 'approving_committee')
    serializer_class = AutoridadSerializer
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['description', 'scope']
    ordering_fields = ['decision_type', 'financial_limit']
    ordering = ['position__name', 'decision_type']
    filterset_fields = [
        'position', 'decision_type', 'requires_superior_validation',
        'requires_committee_approval', 'can_delegate', 'is_temporary'
    ]
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        permission_classes = [
            permissions.IsAuthenticated,
            HasPermission
        ]
        
        if self.action in ['list', 'retrieve']:
            self.required_permission = 'organization.read'
        else:
            self.required_permission = 'organization.create_orgchart'
        
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter queryset based on position."""
        queryset = super().get_queryset().filter(is_active=True)
        
        position_id = self.request.query_params.get('position')
        if position_id:
            queryset = queryset.filter(position_id=position_id)
        
        return queryset