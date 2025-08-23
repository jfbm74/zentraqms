"""
ViewSets for Health Services management.

This module provides comprehensive API endpoints for health services
according to REPS standards and Colombian healthcare regulations.
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, Prefetch
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from django.db import transaction
from django.utils import timezone
import tempfile
import os
import logging

from apps.authorization.drf_permissions import HasPermission
from apps.sogcs.services.reps_service_importer import REPSServiceImporter
from apps.organization.models.health_services import (
    SedeHealthService,
    HealthServiceCatalog,
    ServiceImportLog
)
from apps.organization.models.sogcs_sedes import HeadquarterLocation
from apps.organization.serializers.health_services_serializers import (
    SedeHealthServiceListSerializer,
    SedeHealthServiceDetailSerializer,
    SedeHealthServiceCreateUpdateSerializer,
    ServiceImportSerializer,
    ServiceImportLogSerializer,
    ServiceBulkActionSerializer,
    HealthServiceCatalogSerializer,
    ServiceStatisticsSerializer
)

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
    permission_classes = [IsAuthenticated]
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
    # Enable default pagination for consistent API responses
    
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
        
        # Filter by organization (temporary fix: skip for admin users)
        if user.is_superuser:
            # Superuser sees all services
            pass
        elif hasattr(user, 'organization_users'):
            org_user = user.organization_users.first()
            if org_user and hasattr(org_user.organization, 'healthorganization'):
                queryset = queryset.filter(
                    headquarters__organization=org_user.organization.healthorganization
                )
        else:
            # If no organization relationship exists, return empty queryset for non-superusers
            queryset = queryset.none()
        
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
            from django.utils import timezone
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
    
    def create(self, request, *args, **kwargs):
        """Create a new service and return detailed response."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        # Use detail serializer for response
        response_serializer = SedeHealthServiceDetailSerializer(instance)
        
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
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
            
            # Initialize REPS importer
            importer = REPSServiceImporter(
                organization=org_user.organization.healthorganization,
                user=request.user,
                headquarters=headquarters,
                update_existing=update_existing
            )
            
            # Process import
            import_log = importer.import_from_file(
                file_path=tmp_file_path,
                file_name=file.name,
                file_size=file.size
            )
            
            # Clean up temp file
            os.unlink(tmp_file_path)
            
            # Prepare response data
            response_data = {
                'success': import_log.status in ['completed', 'partial'],
                'message': import_log.message or f'Importación {import_log.status}',
                'total_rows': import_log.total_rows,
                'imported_count': import_log.services_created,
                'updated_count': import_log.services_updated,
                'error_count': import_log.failed_rows,
                'valid_rows': import_log.successful_rows,
                'invalid_rows': import_log.failed_rows,
                'warning_count': len(import_log.warnings) if import_log.warnings else 0,
                'errors': [{'row': i+1, 'error': error} for i, error in enumerate(import_log.errors[:10])] if import_log.errors else [],
                'warnings': [{'row': i+1, 'warning': warning} for i, warning in enumerate(import_log.warnings[:5])] if import_log.warnings else [],
                'import_log_id': import_log.id,
            }
            
            # Return import results
            return Response(
                response_data,
                status=status.HTTP_201_CREATED if import_log.status == 'completed' else status.HTTP_206_PARTIAL_CONTENT
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
        # For now, allow access to any headquarters - in future versions,
        # this will be restricted based on user's organization context
        try:
            health_org = headquarters.organization
        except AttributeError:
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
        
        # Calculate basic statistics
        total_count = queryset.count()
        
        # Basic statistics - using actual fields from model
        stats = {
            'total_services': total_count,
            'enabled_services': queryset.filter(is_enabled=True).count(),
            'disabled_services': queryset.filter(is_enabled=False).count(),
        }
        
        # Services by group (category)
        category_stats = queryset.values('service_group_name').annotate(
            count=Count('id')
        ).order_by('-count')
        
        stats['by_group'] = {
            group['service_group_name']: group['count']
            for group in category_stats
        }
        
        # Services by complexity
        stats['by_complexity'] = {
            'BAJA': queryset.filter(complexity_level='BAJA').count(),
            'MEDIANA': queryset.filter(complexity_level='MEDIANA').count(),
            'ALTA': queryset.filter(complexity_level='ALTA').count(),
        }
        
        # Services by modality
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
            service_count=Count('id')
        ).order_by('-service_count')[:10]
        
        stats['by_headquarters'] = [
            {
                'name': hq['headquarters__name'] or 'Sin nombre',
                'id': str(hq['headquarters__id']),
                'count': hq['service_count']
            }
            for hq in hq_stats if hq['headquarters__name']
        ]
        
        # Additional statistics
        stats['telemedicine_enabled'] = queryset.filter(telemedicine_modality='SI').count()
        stats['specialized_services'] = queryset.filter(complexity_level__in=['MEDIANA', 'ALTA']).count()
        stats['requiring_renewal'] = 0  # Placeholder for now
        
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
            # For now, allow access to any headquarters - in future versions,
            # this will be restricted based on user's organization context
            try:
                health_org = target_hq.organization
            except AttributeError:
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