# API Implementation for Health Services
# This file contains serializers, viewsets, and URL configurations

"""
RESTful API implementation for Health Services management.
Complies with REPS standards and Resolution 3100/2019.
"""

# ==============================================================================
# SERIALIZERS
# ==============================================================================
# File: apps/organization/serializers/health_services_serializers.py

from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from typing import Dict, Any

from apps.organization.models import (
    SedeHealthService,
    HealthServiceCatalog,
    ServiceImportLog,
    HeadquarterLocation
)


class HealthServiceCatalogSerializer(serializers.ModelSerializer):
    """
    Serializer for health service catalog (read-only reference).
    """
    dependent_services_count = serializers.SerializerMethodField()
    dependent_services = serializers.SerializerMethodField()
    
    class Meta:
        model = HealthServiceCatalog
        fields = [
            'id', 'service_code', 'service_name',
            'service_group_code', 'service_group_name',
            'requires_infrastructure', 'requires_equipment',
            'requires_human_talent', 'allows_ambulatory',
            'allows_hospital', 'allows_mobile_unit',
            'allows_domiciliary', 'allows_telemedicine',
            'min_complexity', 'max_complexity',
            'dependent_services', 'dependent_services_count',
            'standard_requirements', 'documentation_required',
            'resolution_reference', 'is_active', 'notes'
        ]
        read_only_fields = fields
    
    def get_dependent_services_count(self, obj):
        return obj.dependent_services.count()
    
    def get_dependent_services(self, obj):
        """Return basic info about dependent services."""
        return [
            {
                'code': service.service_code,
                'name': service.service_name
            }
            for service in obj.dependent_services.all()[:5]
        ]


class SedeHealthServiceListSerializer(serializers.ModelSerializer):
    """
    Light serializer for service lists with computed fields.
    """
    active_modalities = serializers.ReadOnlyField()
    complexity_display = serializers.ReadOnlyField()
    headquarters_name = serializers.CharField(source='headquarters.name', read_only=True)
    has_telemedicine = serializers.ReadOnlyField()
    is_specialized = serializers.ReadOnlyField()
    requires_renewal = serializers.ReadOnlyField()
    
    class Meta:
        model = SedeHealthService
        fields = [
            'id', 'service_code', 'service_name',
            'service_group_name', 'distinctive_number',
            'active_modalities', 'complexity_display',
            'is_enabled', 'opening_date', 'headquarters_name',
            'has_telemedicine', 'is_specialized', 'requires_renewal'
        ]


class SedeHealthServiceDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for individual service with all fields.
    """
    service_catalog = HealthServiceCatalogSerializer(read_only=True)
    active_modalities = serializers.ReadOnlyField()
    complexity_display = serializers.ReadOnlyField()
    headquarters_info = serializers.SerializerMethodField()
    has_telemedicine = serializers.ReadOnlyField()
    is_specialized = serializers.ReadOnlyField()
    requires_renewal = serializers.ReadOnlyField()
    
    class Meta:
        model = SedeHealthService
        fields = '__all__'
        read_only_fields = [
            'created_at', 'updated_at', 'deleted_at',
            'created_by', 'updated_by', 'deleted_by',
            'reps_import_date', 'reps_raw_data'
        ]
    
    def get_headquarters_info(self, obj):
        """Return headquarters basic information."""
        return {
            'id': obj.headquarters.id,
            'name': obj.headquarters.name,
            'reps_code': obj.headquarters.reps_code,
            'address': obj.headquarters.complete_address
        }


class SedeHealthServiceCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating services with validation.
    """
    class Meta:
        model = SedeHealthService
        fields = [
            'headquarters', 'service_code', 'service_name',
            'service_group_code', 'service_group_name',
            'ambulatory', 'hospital', 'mobile_unit',
            'domiciliary', 'other_extramural',
            'is_reference_center', 'is_referring_institution',
            'low_complexity', 'medium_complexity', 'high_complexity',
            'complexity_level', 'opening_date', 'closing_date',
            'distinctive_number', 'main_sede_number',
            'schedule', 'intramural_modality', 'telemedicine_modality',
            'specificities', 'installed_capacity', 'human_talent',
            'quality_score', 'last_audit_date', 'compliance_percentage',
            'is_enabled', 'observations', 'norm_version', 'manager_name',
            'is_pdet_municipality', 'is_zomac_municipality', 'is_pnis_municipality'
        ]
    
    def validate_distinctive_number(self, value):
        """Ensure distinctive number is unique."""
        instance = self.instance
        qs = SedeHealthService.objects.filter(distinctive_number=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "Ya existe un servicio con este número distintivo."
            )
        return value
    
    def validate(self, data):
        """Validate service data integrity."""
        # Ensure at least one modality is active
        modalities = [
            data.get('ambulatory', 'SD'),
            data.get('hospital', 'SD'),
            data.get('mobile_unit', 'SD'),
            data.get('domiciliary', 'SD'),
            data.get('other_extramural', 'SD')
        ]
        
        if all(m == 'NO' for m in modalities):
            raise serializers.ValidationError({
                'ambulatory': 'Al menos una modalidad debe estar activa (no puede ser todas NO).'
            })
        
        # Validate complexity consistency
        if data.get('complexity_level') == 'ALTA' and data.get('low_complexity') == 'SI':
            if data.get('high_complexity') != 'SI':
                raise serializers.ValidationError({
                    'complexity_level': 'Inconsistencia en niveles de complejidad.'
                })
        
        # Validate dates
        opening_date = data.get('opening_date')
        closing_date = data.get('closing_date')
        if opening_date and closing_date:
            if closing_date < opening_date:
                raise serializers.ValidationError({
                    'closing_date': 'La fecha de cierre no puede ser anterior a la fecha de apertura.'
                })
        
        # Link to catalog if available
        if 'service_code' in data:
            try:
                catalog = HealthServiceCatalog.objects.get(
                    service_code=data['service_code']
                )
                data['service_catalog'] = catalog
            except HealthServiceCatalog.DoesNotExist:
                pass
        
        return data
    
    def create(self, validated_data):
        """Create service with audit fields."""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update service with audit fields."""
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class ServiceImportSerializer(serializers.Serializer):
    """
    Serializer for service import via Excel with validation.
    """
    file = serializers.FileField(
        help_text="Archivo Excel (.xls) exportado desde REPS"
    )
    
    headquarters_id = serializers.IntegerField(
        required=False,
        help_text="ID de la sede para asociar servicios (opcional)"
    )
    
    update_existing = serializers.BooleanField(
        default=True,
        help_text="Actualizar servicios existentes"
    )
    
    def validate_file(self, value):
        """Validate uploaded file format and size."""
        # Check file extension
        if not value.name.lower().endswith(('.xls', '.xlsx', '.html')):
            raise serializers.ValidationError(
                "El archivo debe ser formato Excel (.xls/.xlsx) o HTML exportado desde REPS"
            )
        
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "El archivo no puede superar los 10MB"
            )
        
        # Check file is not empty
        if value.size == 0:
            raise serializers.ValidationError(
                "El archivo está vacío"
            )
        
        return value
    
    def validate_headquarters_id(self, value):
        """Validate headquarters exists and user has access."""
        if value:
            try:
                headquarters = HeadquarterLocation.objects.get(pk=value)
                # Check user has access (implement based on your permission system)
                user = self.context['request'].user
                # Add permission check here
                return value
            except HeadquarterLocation.DoesNotExist:
                raise serializers.ValidationError(
                    "La sede especificada no existe"
                )
        return value


class ServiceBulkActionSerializer(serializers.Serializer):
    """
    Serializer for bulk actions on multiple services.
    """
    service_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=100,
        help_text="Lista de IDs de servicios (máximo 100)"
    )
    
    action = serializers.ChoiceField(
        choices=[
            ('enable', 'Habilitar'),
            ('disable', 'Deshabilitar'),
            ('delete', 'Eliminar'),
            ('update_compliance', 'Actualizar cumplimiento'),
            ('schedule_audit', 'Programar auditoría')
        ],
        help_text="Acción a realizar"
    )
    
    additional_data = serializers.JSONField(
        required=False,
        help_text="Datos adicionales para la acción"
    )
    
    def validate_service_ids(self, value):
        """Validate services exist."""
        # Check for duplicates
        if len(value) != len(set(value)):
            raise serializers.ValidationError(
                "La lista contiene IDs duplicados"
            )
        
        # Check services exist
        existing_ids = SedeHealthService.objects.filter(
            id__in=value
        ).values_list('id', flat=True)
        
        missing_ids = set(value) - set(existing_ids)
        if missing_ids:
            raise serializers.ValidationError(
                f"Los siguientes IDs no existen: {list(missing_ids)}"
            )
        
        return value


class ServiceImportLogSerializer(serializers.ModelSerializer):
    """
    Serializer for import logs with computed fields.
    """
    duration = serializers.SerializerMethodField()
    success_rate = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    import_type_display = serializers.CharField(source='get_import_type_display', read_only=True)
    organization_name = serializers.CharField(source='organization.nombre_comercial', read_only=True)
    
    class Meta:
        model = ServiceImportLog
        fields = [
            'id', 'organization', 'organization_name',
            'import_type', 'import_type_display',
            'file_name', 'file_size', 'file_path',
            'status', 'status_display',
            'total_rows', 'processed_rows',
            'successful_rows', 'failed_rows',
            'services_created', 'services_updated',
            'services_disabled', 'headquarters_created',
            'started_at', 'completed_at',
            'processing_time', 'duration', 'success_rate',
            'errors', 'warnings', 'validation_errors',
            'created_at', 'created_by'
        ]
        read_only_fields = fields
    
    def get_duration(self, obj):
        """Format processing duration."""
        if obj.processing_time:
            if obj.processing_time < 60:
                return f"{obj.processing_time:.2f} segundos"
            else:
                minutes = int(obj.processing_time / 60)
                seconds = obj.processing_time % 60
                return f"{minutes}m {seconds:.0f}s"
        return None
    
    def get_success_rate(self, obj):
        """Calculate and format success rate."""
        if obj.processed_rows > 0:
            rate = (obj.successful_rows / obj.processed_rows) * 100
            return f"{rate:.1f}%"
        return "0%"


class ServiceStatisticsSerializer(serializers.Serializer):
    """
    Serializer for service statistics dashboard.
    """
    total_services = serializers.IntegerField()
    enabled_services = serializers.IntegerField()
    disabled_services = serializers.IntegerField()
    
    by_group = serializers.DictField(
        child=serializers.IntegerField()
    )
    
    by_complexity = serializers.DictField(
        child=serializers.IntegerField()
    )
    
    by_modality = serializers.DictField(
        child=serializers.IntegerField()
    )
    
    by_headquarters = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    
    telemedicine_enabled = serializers.IntegerField()
    specialized_services = serializers.IntegerField()
    requiring_renewal = serializers.IntegerField()
    
    recent_imports = serializers.ListField(
        child=ServiceImportLogSerializer(),
        required=False
    )
    
    compliance_overview = serializers.DictField(
        required=False
    )


# ==============================================================================
# VIEWSETS
# ==============================================================================
# File: apps/organization/views/health_services_views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, Prefetch
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
import tempfile
import os
import logging

from apps.authorization.drf_permissions import HasPermission
from apps.sogcs.services.reps_service_importer import REPSServiceImporter

logger = logging.getLogger(__name__)


class HealthServiceCatalogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for health service catalog (read-only reference).
    
    Endpoints:
    - GET /api/v1/health-service-catalog/ - List all services
    - GET /api/v1/health-service-catalog/{id}/ - Get service details
    - GET /api/v1/health-service-catalog/by-group/ - Services grouped by category
    - GET /api/v1/health-service-catalog/search/ - Search services
    """
    queryset = HealthServiceCatalog.objects.filter(is_active=True)
    serializer_class = HealthServiceCatalogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['service_group_code', 'min_complexity', 'max_complexity']
    search_fields = ['service_code', 'service_name', 'service_group_name']
    ordering_fields = ['service_code', 'service_name', 'service_group_code']
    ordering = ['service_group_code', 'service_code']
    
    @action(detail=False, methods=['GET'])
    def by_group(self, request):
        """Get services organized by group."""
        services_by_group = {}
        
        for service in self.get_queryset():
            group = service.service_group_name
            if group not in services_by_group:
                services_by_group[group] = []
            
            services_by_group[group].append({
                'id': service.id,
                'code': service.service_code,
                'name': service.service_name,
                'complexity_min': service.min_complexity,
                'complexity_max': service.max_complexity
            })
        
        return Response(services_by_group)
    
    @action(detail=False, methods=['GET'])
    def search(self, request):
        """Advanced search with multiple criteria."""
        query = request.query_params.get('q', '')
        group = request.query_params.get('group')
        complexity = request.query_params.get('complexity')
        modality = request.query_params.get('modality')
        
        queryset = self.get_queryset()
        
        if query:
            queryset = queryset.filter(
                Q(service_code__icontains=query) |
                Q(service_name__icontains=query) |
                Q(service_group_name__icontains=query)
            )
        
        if group:
            queryset = queryset.filter(service_group_code=group)
        
        if complexity:
            complexity = int(complexity)
            queryset = queryset.filter(
                min_complexity__lte=complexity,
                max_complexity__gte=complexity
            )
        
        if modality:
            modality_field = f'allows_{modality}'
            if hasattr(HealthServiceCatalog, modality_field):
                queryset = queryset.filter(**{modality_field: True})
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class SedeHealthServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for sede health services with import capabilities.
    
    Endpoints:
    - GET /api/v1/sede-health-services/ - List services
    - POST /api/v1/sede-health-services/ - Create service
    - GET /api/v1/sede-health-services/{id}/ - Get service
    - PUT /api/v1/sede-health-services/{id}/ - Update service
    - DELETE /api/v1/sede-health-services/{id}/ - Delete service
    - POST /api/v1/sede-health-services/import-excel/ - Import from Excel
    - POST /api/v1/sede-health-services/bulk-action/ - Bulk operations
    - GET /api/v1/sede-health-services/by-headquarters/{id}/ - Services by HQ
    - GET /api/v1/sede-health-services/statistics/ - Statistics
    - GET /api/v1/sede-health-services/import-logs/ - Import history
    """
    permission_classes = [IsAuthenticated, HasPermission('organization.manage_health_services')]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'headquarters', 'service_group_code', 'is_enabled',
        'ambulatory', 'hospital', 'mobile_unit', 'domiciliary',
        'complexity_level', 'is_reference_center'
    ]
    search_fields = [
        'service_code', 'service_name', 'distinctive_number',
        'service_group_name', 'observations', 'manager_name'
    ]
    ordering_fields = ['service_code', 'service_name', 'opening_date', 'created_at']
    ordering = ['service_group_code', 'service_code']
    pagination_class = None  # Can add custom pagination if needed
    
    def get_queryset(self):
        """Filter services by user's organization and permissions."""
        user = self.request.user
        queryset = SedeHealthService.objects.select_related(
            'headquarters',
            'headquarters__organization',
            'service_catalog'
        ).prefetch_related(
            'service_catalog__dependent_services'
        )
        
        # Filter by organization
        if hasattr(user, 'organization_users'):
            org_user = user.organization_users.first()
            if org_user and hasattr(org_user.organization, 'healthorganization'):
                queryset = queryset.filter(
                    headquarters__organization=org_user.organization.healthorganization
                )
        
        # Additional filters from query params
        headquarters_id = self.request.query_params.get('headquarters_id')
        if headquarters_id:
            queryset = queryset.filter(headquarters_id=headquarters_id)
        
        enabled_only = self.request.query_params.get('enabled_only', 'false').lower() == 'true'
        if enabled_only:
            queryset = queryset.filter(is_enabled=True)
        
        # Filter by complexity
        complexity = self.request.query_params.get('complexity')
        if complexity:
            queryset = queryset.filter(complexity_level=complexity.upper())
        
        # Filter by modality
        modality = self.request.query_params.get('modality')
        if modality:
            modality_field = modality.lower()
            if modality_field in ['ambulatory', 'hospital', 'mobile_unit', 'domiciliary']:
                queryset = queryset.filter(**{modality_field: 'SI'})
        
        # Filter services requiring renewal
        needs_renewal = self.request.query_params.get('needs_renewal', 'false').lower() == 'true'
        if needs_renewal:
            from datetime import timedelta
            cutoff_date = timezone.now().date() - timedelta(days=365)
            queryset = queryset.filter(
                Q(last_audit_date__lt=cutoff_date) | Q(last_audit_date__isnull=True)
            )
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return SedeHealthServiceListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return SedeHealthServiceCreateUpdateSerializer
        elif self.action == 'import_excel':
            return ServiceImportSerializer
        elif self.action == 'bulk_action':
            return ServiceBulkActionSerializer
        elif self.action == 'statistics':
            return ServiceStatisticsSerializer
        return SedeHealthServiceDetailSerializer
    
    @action(
        detail=False,
        methods=['POST'],
        parser_classes=[MultiPartParser, FormParser],
        url_path='import-excel'
    )
    def import_excel(self, request):
        """
        Import services from REPS Excel file.
        
        Accepts Excel file exported from REPS portal.
        Creates/updates services and optionally creates headquarters.
        """
        serializer = ServiceImportSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        file = serializer.validated_data['file']
        headquarters_id = serializer.validated_data.get('headquarters_id')
        update_existing = serializer.validated_data.get('update_existing', True)
        
        # Get user's organization
        org_user = request.user.organization_users.first()
        if not org_user:
            return Response(
                {'error': 'Usuario no asociado a ninguna organización'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # If headquarters specified, verify access
        headquarters = None
        if headquarters_id:
            try:
                headquarters = HeadquarterLocation.objects.get(
                    pk=headquarters_id,
                    organization=org_user.organization.healthorganization
                )
            except HeadquarterLocation.DoesNotExist:
                return Response(
                    {'error': 'No tiene acceso a la sede especificada'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        try:
            # Save file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xls') as tmp_file:
                for chunk in file.chunks():
                    tmp_file.write(chunk)
                tmp_file_path = tmp_file.name
            
            # Import services
            importer = REPSServiceImporter(
                organization=org_user.organization.healthorganization,
                user=request.user,
                headquarters=headquarters,
                update_existing=update_existing
            )
            
            import_log = importer.import_from_file(
                file_path=tmp_file_path,
                file_name=file.name,
                file_size=file.size
            )
            
            # Clean up temp file
            os.unlink(tmp_file_path)
            
            # Return import results
            return Response(
                ServiceImportLogSerializer(import_log).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            logger.error(f"Import error: {str(e)}", exc_info=True)
            
            # Clean up temp file if exists
            if 'tmp_file_path' in locals():
                try:
                    os.unlink(tmp_file_path)
                except:
                    pass
            
            return Response(
                {'error': f'Error al importar archivo: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['POST'], url_path='bulk-action')
    def bulk_action(self, request):
        """
        Perform bulk actions on multiple services.
        
        Actions: enable, disable, delete, update_compliance, schedule_audit
        """
        serializer = ServiceBulkActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service_ids = serializer.validated_data['service_ids']
        action = serializer.validated_data['action']
        additional_data = serializer.validated_data.get('additional_data', {})
        
        # Get services and verify permissions
        services = self.get_queryset().filter(id__in=service_ids)
        
        if not services.exists():
            return Response(
                {'error': 'No se encontraron servicios válidos'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Perform action
        result = {'message': '', 'affected': 0}
        
        with transaction.atomic():
            if action == 'enable':
                result['affected'] = services.update(
                    is_enabled=True,
                    updated_by=request.user,
                    updated_at=timezone.now()
                )
                result['message'] = f'{result["affected"]} servicios habilitados'
                
            elif action == 'disable':
                result['affected'] = services.update(
                    is_enabled=False,
                    updated_by=request.user,
                    updated_at=timezone.now()
                )
                result['message'] = f'{result["affected"]} servicios deshabilitados'
                
            elif action == 'delete':
                result['affected'] = services.count()
                services.update(
                    deleted_at=timezone.now(),
                    deleted_by=request.user
                )
                result['message'] = f'{result["affected"]} servicios eliminados'
                
            elif action == 'update_compliance':
                compliance = additional_data.get('compliance_percentage', 0)
                result['affected'] = services.update(
                    compliance_percentage=compliance,
                    updated_by=request.user,
                    updated_at=timezone.now()
                )
                result['message'] = f'Cumplimiento actualizado para {result["affected"]} servicios'
                
            elif action == 'schedule_audit':
                audit_date = additional_data.get('audit_date')
                if audit_date:
                    result['affected'] = services.update(
                        last_audit_date=audit_date,
                        updated_by=request.user,
                        updated_at=timezone.now()
                    )
                    result['message'] = f'Auditoría programada para {result["affected"]} servicios'
                else:
                    return Response(
                        {'error': 'Fecha de auditoría requerida'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        return Response(result, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['GET'], url_path='by-headquarters/(?P<headquarters_id>[^/.]+)')
    def by_headquarters(self, request, headquarters_id=None):
        """
        Get services for a specific headquarters grouped by category.
        """
        headquarters = get_object_or_404(HeadquarterLocation, pk=headquarters_id)
        
        # Verify user has access to this headquarters
        org_user = request.user.organization_users.first()
        if not org_user or headquarters.organization != org_user.organization.healthorganization:
            return Response(
                {'error': 'No tiene permisos para ver estos servicios'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        services = self.get_queryset().filter(headquarters=headquarters)
        
        # Group by service group
        grouped_services = {}
        for service in services:
            group = service.service_group_name
            if group not in grouped_services:
                grouped_services[group] = []
            grouped_services[group].append(
                SedeHealthServiceListSerializer(service).data
            )
        
        # Calculate statistics
        stats = {
            'total_services': services.count(),
            'enabled_services': services.filter(is_enabled=True).count(),
            'by_complexity': {
                'BAJA': services.filter(complexity_level='BAJA').count(),
                'MEDIANA': services.filter(complexity_level='MEDIANA').count(),
                'ALTA': services.filter(complexity_level='ALTA').count(),
            },
            'by_modality': {
                'ambulatory': services.filter(ambulatory='SI').count(),
                'hospital': services.filter(hospital='SI').count(),
                'mobile_unit': services.filter(mobile_unit='SI').count(),
                'domiciliary': services.filter(domiciliary='SI').count(),
            }
        }
        
        return Response({
            'headquarters': {
                'id': headquarters.id,
                'name': headquarters.name,
                'reps_code': headquarters.reps_code,
                'address': headquarters.complete_address,
                'operational_status': headquarters.operational_status
            },
            'statistics': stats,
            'services_by_group': grouped_services
        })
    
    @action(detail=False, methods=['GET'], url_path='import-logs')
    def import_logs(self, request):
        """
        Get import logs for the organization.
        """
        org_user = request.user.organization_users.first()
        if not org_user:
            return Response([], status=status.HTTP_200_OK)
        
        logs = ServiceImportLog.objects.filter(
            organization=org_user.organization.healthorganization
        ).order_by('-created_at')
        
        # Pagination
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 20)
        
        paginator = Paginator(logs, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = ServiceImportLogSerializer(page_obj, many=True)
        
        return Response({
            'count': paginator.count,
            'page': page,
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'results': serializer.data
        })
    
    @action(detail=False, methods=['GET'])
    def statistics(self, request):
        """
        Get comprehensive service statistics for the organization.
        """
        queryset = self.get_queryset()
        
        # Basic statistics
        stats = {
            'total_services': queryset.count(),
            'enabled_services': queryset.filter(is_enabled=True).count(),
            'disabled_services': queryset.filter(is_enabled=False).count(),
            'telemedicine_enabled': 0,
            'specialized_services': 0,
            'requiring_renewal': 0,
        }
        
        # Group statistics
        stats['by_group'] = {}
        groups = queryset.values('service_group_name').annotate(
            count=Count('id')
        ).order_by('-count')
        
        for group in groups:
            stats['by_group'][group['service_group_name']] = group['count']
        
        # Complexity statistics
        stats['by_complexity'] = {
            'BAJA': queryset.filter(complexity_level='BAJA').count(),
            'MEDIANA': queryset.filter(complexity_level='MEDIANA').count(),
            'ALTA': queryset.filter(complexity_level='ALTA').count(),
            'SD': queryset.filter(complexity_level='SD').count(),
        }
        
        # Modality statistics
        stats['by_modality'] = {
            'ambulatory': queryset.filter(ambulatory='SI').count(),
            'hospital': queryset.filter(hospital='SI').count(),
            'mobile_unit': queryset.filter(mobile_unit='SI').count(),
            'domiciliary': queryset.filter(domiciliary='SI').count(),
        }
        
        # Headquarters statistics
        hq_stats = queryset.values(
            'headquarters__name',
            'headquarters__id'
        ).annotate(
            total=Count('id'),
            enabled=Count('id', filter=Q(is_enabled=True))
        ).order_by('-total')[:10]
        
        stats['by_headquarters'] = [
            {
                'id': hq['headquarters__id'],
                'name': hq['headquarters__name'],
                'total': hq['total'],
                'enabled': hq['enabled']
            }
            for hq in hq_stats
        ]
        
        # Advanced statistics
        for service in queryset:
            if service.has_telemedicine:
                stats['telemedicine_enabled'] += 1
            if service.is_specialized:
                stats['specialized_services'] += 1
            if service.requires_renewal:
                stats['requiring_renewal'] += 1
        
        # Compliance overview
        compliance_data = queryset.aggregate(
            avg_compliance=Avg('compliance_percentage'),
            high_compliance=Count('id', filter=Q(compliance_percentage__gte=80)),
            medium_compliance=Count('id', filter=Q(
                compliance_percentage__gte=50,
                compliance_percentage__lt=80
            )),
            low_compliance=Count('id', filter=Q(compliance_percentage__lt=50))
        )
        
        stats['compliance_overview'] = {
            'average': float(compliance_data['avg_compliance'] or 0),
            'high': compliance_data['high_compliance'],
            'medium': compliance_data['medium_compliance'],
            'low': compliance_data['low_compliance']
        }
        
        # Recent imports
        if hasattr(request.user, 'organization_users'):
            org_user = request.user.organization_users.first()
            if org_user:
                recent_imports = ServiceImportLog.objects.filter(
                    organization=org_user.organization.healthorganization
                ).order_by('-created_at')[:5]
                
                stats['recent_imports'] = ServiceImportLogSerializer(
                    recent_imports,
                    many=True
                ).data
        
        return Response(stats)
    
    @action(detail=True, methods=['POST'])
    def duplicate(self, request, pk=None):
        """
        Duplicate a service to another headquarters.
        """
        service = self.get_object()
        target_hq_id = request.data.get('target_headquarters_id')
        
        if not target_hq_id:
            return Response(
                {'error': 'ID de sede destino requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_hq = HeadquarterLocation.objects.get(pk=target_hq_id)
            
            # Verify user has access
            org_user = request.user.organization_users.first()
            if not org_user or target_hq.organization != org_user.organization.healthorganization:
                return Response(
                    {'error': 'No tiene permisos para esta sede'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create duplicate
            new_service = SedeHealthService.objects.create(
                headquarters=target_hq,
                service_catalog=service.service_catalog,
                service_code=service.service_code,
                service_name=service.service_name,
                service_group_code=service.service_group_code,
                service_group_name=service.service_group_name,
                ambulatory=service.ambulatory,
                hospital=service.hospital,
                mobile_unit=service.mobile_unit,
                domiciliary=service.domiciliary,
                other_extramural=service.other_extramural,
                complexity_level=service.complexity_level,
                distinctive_number=f"{service.distinctive_number}_COPY_{timezone.now().timestamp()}",
                created_by=request.user
            )
            
            serializer = SedeHealthServiceDetailSerializer(new_service)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except HeadquarterLocation.DoesNotExist:
            return Response(
                {'error': 'Sede destino no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )


# ==============================================================================
# URL CONFIGURATION
# ==============================================================================
# File: apps/organization/urls.py (addition to existing file)

from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import viewsets
from .views.health_services_views import (
    HealthServiceCatalogViewSet,
    SedeHealthServiceViewSet
)

# Create router
router = DefaultRouter()

# Register health services routes
router.register(
    r'health-service-catalog',
    HealthServiceCatalogViewSet,
    basename='health-service-catalog'
)
router.register(
    r'sede-health-services',
    SedeHealthServiceViewSet,
    basename='sede-health-services'
)

# URL patterns
urlpatterns = [
    path('api/v1/', include(router.urls)),
]