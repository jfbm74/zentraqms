"""
API Views for SOGCS (Sistema Obligatorio de Garantía de Calidad en Salud).

Provides REST endpoints for:
- HeadquarterLocation management
- EnabledHealthService management  
- SOGCS configuration and overview
- Alerts and notifications
- REPS data import
"""

import logging
import tempfile
import os
from django.db.models import Q, Count, Avg, Max
from django.utils import timezone
from django.http import HttpResponse
from django.core.files.storage import default_storage
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.organization.models import HealthOrganization
from apps.authorization.drf_permissions import HasPermission
from apps.organization.models import HeadquarterLocation, EnabledHealthService
from .serializers import (
    HeadquarterLocationSerializer,
    HeadquarterLocationSummarySerializer,
    EnabledHealthServiceSerializer,
    EnabledHealthServiceSummarySerializer,
    SOGCSOverviewSerializer,
    SOGCSConfigurationSerializer,
    SOGCSAlertSerializer,
    REPSImportSerializer
)
from .services.alerts import SOGCSAlertsService
from .services.reps_sync import REPSSynchronizationService, REPSSyncError

logger = logging.getLogger(__name__)


class HeadquarterLocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing REPS headquarters data.
    
    Provides CRUD operations for health organization headquarters
    with filtering, search, and specialized actions.
    """
    
    serializer_class = HeadquarterLocationSerializer
    permission_classes = [permissions.IsAuthenticated, HasPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Filtering
    filterset_fields = {
        'habilitation_status': ['exact', 'in'],
        'department_name': ['exact', 'icontains'],
        'municipality_name': ['exact', 'icontains'],
        'sede_type': ['exact', 'icontains'],
        'habilitation_date': ['gte', 'lte', 'exact'],
        'next_renewal_date': ['gte', 'lte', 'exact'],
        'created_at': ['gte', 'lte']
    }
    
    # Search
    search_fields = [
        'reps_code', 'name', 'address', 
        'administrative_contact'
    ]
    
    # Ordering
    ordering_fields = [
        'reps_code', 'name', 'habilitation_date', 
        'next_renewal_date', 'created_at'
    ]
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filter queryset to organization's headquarters only.
        """
        user = self.request.user
        
        # Check if user has organization context
        if hasattr(user, 'current_organization'):
            organization = user.current_organization
        else:
            # Get organization through HealthOrganization model
            try:
                from apps.organization.models import Organization
                # For now, get the first available organization for the user
                # TODO: Implement proper user-organization relationship
                organization_query = Organization.objects.filter(is_active=True)
                organization = organization_query.first()
                
                if not organization:
                    return HeadquarterLocation.objects.none()
                    
                # Try to get HealthOrganization profile
                try:
                    health_org = HealthOrganization.objects.get(organization=organization)
                    organization = health_org
                except HealthOrganization.DoesNotExist:
                    # If no health profile, return empty queryset
                    return HeadquarterLocation.objects.none()
            except Exception as e:
                logger.error(f"Error getting user organization: {str(e)}")
                return HeadquarterLocation.objects.none()
        
        queryset = HeadquarterLocation.objects.filter(
            organization=organization
        ).select_related(
            'organization__organization', 'created_by'
        ).prefetch_related(
            'enabled_services'
        )
        
        return queryset

    def get_serializer_context(self):
        """Add organization to serializer context"""
        context = super().get_serializer_context()
        
        # Get organization from current user
        if hasattr(self.request.user, 'current_organization'):
            context['organization'] = self.request.user.current_organization
        
        return context

    def perform_create(self, serializer):
        """Set organization and created_by on create"""
        # Get user's organization
        user = self.request.user
        if hasattr(user, 'current_organization'):
            organization = user.current_organization
        else:
            # Get organization through HealthOrganization model
            try:
                from apps.organization.models import Organization
                organization_query = Organization.objects.filter(is_active=True)
                base_organization = organization_query.first()
                
                if not base_organization:
                    raise ValueError("Usuario no tiene organización asociada")
                    
                # Try to get HealthOrganization profile
                try:
                    organization = HealthOrganization.objects.get(organization=base_organization)
                except HealthOrganization.DoesNotExist:
                    raise ValueError("La organización no tiene perfil de salud configurado")
            except Exception as e:
                logger.error(f"Error getting user organization for create: {str(e)}")
                raise ValueError("Usuario no tiene organización asociada")
        
        serializer.save(
            organization=organization,
            created_by=user
        )

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get summary statistics for headquarters.
        """
        queryset = self.get_queryset()
        
        # Basic counts
        total = queryset.count()
        active = queryset.filter(habilitation_status='habilitada').count()
        suspended = queryset.filter(habilitation_status='suspendida').count()
        
        # About to expire (30 days)
        from datetime import date, timedelta
        expiry_threshold = date.today() + timedelta(days=30)
        about_to_expire = queryset.filter(
            next_renewal_date__lte=expiry_threshold,
            next_renewal_date__gte=date.today()
        ).count()
        
        # By sede_type
        by_type = queryset.values('sede_type').annotate(
            count=Count('id')
        ).order_by('sede_type')
        
        # By department
        by_department = queryset.values('department_name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]  # Top 10
        
        return Response({
            'total': total,
            'active': active,
            'suspended': suspended,
            'about_to_expire': about_to_expire,
            'by_type': list(by_type),
            'by_department': list(by_department)
        })

    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """
        Get simplified list for dropdowns.
        """
        queryset = self.get_queryset().filter(habilitation_status='habilitada')
        serializer = HeadquarterLocationSummarySerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def services(self, request, pk=None):
        """
        Get all services for a specific headquarters.
        """
        headquarters = self.get_object()
        services = headquarters.enabled_services.all()
        serializer = EnabledHealthServiceSummarySerializer(services, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def check_expiration(self, request, pk=None):
        """
        Check if headquarters is about to expire and generate alerts.
        """
        headquarters = self.get_object()
        
        # Check different thresholds
        alerts = []
        for days in [7, 15, 30, 60]:
            if headquarters.is_about_to_expire(days=days):
                alerts.append({
                    'days': days,
                    'expires_on': headquarters.next_renewal_date,
                    'message': f'La habilitación vence en {days} días o menos'
                })
        
        return Response({
            'headquarters': headquarters.name,
            'current_status': headquarters.habilitation_status,
            'expiration_date': headquarters.next_renewal_date,
            'alerts': alerts
        })


class EnabledHealthServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing REPS health services data.
    
    Provides CRUD operations for enabled health services
    with filtering, search, and specialized actions.
    """
    
    serializer_class = EnabledHealthServiceSerializer
    permission_classes = [permissions.IsAuthenticated, HasPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Filtering
    filterset_fields = {
        'habilitation_status': ['exact', 'in'],
        'service_group': ['exact', 'icontains'],
        'complexity_level': ['exact', 'in'],
        'intramural': ['exact'],
        'extramural': ['exact'],
        'domiciliary': ['exact'],
        'telemedicine': ['exact'],
        'habilitation_date': ['gte', 'lte', 'exact'],
        'habilitation_expiry': ['gte', 'lte', 'exact'],
        'requires_authorization': ['exact'],
        'reference_center': ['exact'],
        'headquarters': ['exact'],
        'headquarters__department_name': ['exact', 'icontains'],
        'headquarters__municipality_name': ['exact', 'icontains']
    }
    
    # Search
    search_fields = [
        'service_code', 'service_name', 'service_group',
        'cups_code'
    ]
    
    # Ordering
    ordering_fields = [
        'service_code', 'service_name', 'habilitation_date',
        'habilitation_expiry', 'monthly_production', 'created_at'
    ]
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filter queryset to organization's services only.
        """
        user = self.request.user
        
        # Get organization (same logic as headquarters)
        if hasattr(user, 'current_organization'):
            organization = user.current_organization
        else:
            # Get organization through HealthOrganization model
            try:
                from apps.organization.models import Organization
                organization_query = Organization.objects.filter(is_active=True)
                base_organization = organization_query.first()
                
                if not base_organization:
                    return EnabledHealthService.objects.none()
                    
                # Try to get HealthOrganization profile
                try:
                    organization = HealthOrganization.objects.get(organization=base_organization)
                except HealthOrganization.DoesNotExist:
                    return EnabledHealthService.objects.none()
            except Exception as e:
                logger.error(f"Error getting user organization for services: {str(e)}")
                return EnabledHealthService.objects.none()
        
        queryset = EnabledHealthService.objects.filter(
            headquarters__organization=organization
        ).select_related(
            'headquarters',
            'headquarters__organization__organization',
            'created_by'
        )
        
        return queryset

    def perform_create(self, serializer):
        """Set created_by on create"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get summary statistics for services.
        """
        queryset = self.get_queryset()
        
        # Basic counts
        total = queryset.count()
        enabled = queryset.filter(habilitation_status='activo').count()
        suspended = queryset.filter(habilitation_status='suspendido').count()
        
        # About to expire (30 days)
        from datetime import date, timedelta
        expiry_threshold = date.today() + timedelta(days=30)
        about_to_expire = queryset.filter(
            habilitation_expiry__lte=expiry_threshold,
            habilitation_expiry__gte=date.today()
        ).count()
        
        # By service_group
        by_group = queryset.values('service_group').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # By complexity_level
        by_complexity = queryset.values('complexity_level').annotate(
            count=Count('id')
        ).order_by('complexity_level')
        
        # Capacity utilization
        capacity_stats = queryset.filter(
            monthly_production__gt=0
        ).aggregate(
            avg_utilization=Avg('monthly_production')
        )
        
        return Response({
            'total': total,
            'enabled': enabled,
            'suspended': suspended,
            'about_to_expire': about_to_expire,
            'by_group': list(by_group),
            'by_complexity': list(by_complexity),
            'average_utilization': capacity_stats['avg_utilization']
        })

    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """
        Get simplified list for dropdowns.
        """
        queryset = self.get_queryset().filter(habilitation_status='activo')
        serializer = EnabledHealthServiceSummarySerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_headquarters(self, request):
        """
        Get services grouped by headquarters.
        """
        queryset = self.get_queryset()
        
        # Group by headquarters
        by_hq = queryset.values(
            'headquarters__reps_code',
            'headquarters__name'
        ).annotate(
            total_services=Count('id'),
            enabled_services=Count('id', filter=Q(habilitation_status='activo'))
        ).order_by('headquarters__name')
        
        return Response(list(by_hq))

    @action(detail=True, methods=['post'])
    def check_utilization(self, request, pk=None):
        """
        Check service capacity utilization and generate recommendations.
        """
        service = self.get_object()
        
        utilization = service.get_utilization_percentage()
        
        recommendations = []
        if utilization > 100:
            recommendations.append('Servicio sobreutilizado - revisar capacidad instalada')
        elif utilization > 90:
            recommendations.append('Servicio cerca del límite - considerar expansión')
        elif utilization < 30:
            recommendations.append('Baja utilización - revisar eficiencia')
        
        return Response({
            'service': service.service_name,
            'monthly_production': service.monthly_production,
            'utilization_percentage': utilization,
            'recommendations': recommendations
        })


class SOGCSOverviewViewSet(viewsets.ViewSet):
    """
    ViewSet for SOGCS overview and dashboard data.
    
    Provides high-level metrics and summary information
    for SOGCS module dashboard.
    """
    
    permission_classes = [permissions.IsAuthenticated, HasPermission]

    def _get_user_organization(self):
        """Get current user's organization"""
        user = self.request.user
        
        if hasattr(user, 'current_organization'):
            return user.current_organization
        
        try:
            from apps.organization.models import Organization
            organization_query = Organization.objects.filter(is_active=True)
            base_organization = organization_query.first()
            
            if not base_organization:
                return None
                
            # Try to get HealthOrganization profile
            try:
                return HealthOrganization.objects.get(organization=base_organization)
            except HealthOrganization.DoesNotExist:
                return None
        except Exception as e:
            logger.error(f"Error getting user organization: {str(e)}")
            return None

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get complete dashboard overview data.
        """
        organization = self._get_user_organization()
        if not organization:
            return Response(
                {'error': 'Usuario no tiene organización asociada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Basic organization info
        data = {
            'organization_id': organization.id,
            'organization_name': organization.organization.razon_social,
            'sogcs_enabled': getattr(organization, 'sogcs_enabled', False),
            'fecha_activacion_sogcs': getattr(organization, 'fecha_activacion_sogcs', None),
        }
        
        # Component states
        data.update({
            'estado_suh': getattr(organization, 'estado_suh', 'no_iniciado'),
            'estado_pamec': getattr(organization, 'estado_pamec', 'no_iniciado'),
            'estado_sic': getattr(organization, 'estado_sic', 'no_iniciado'),
            'estado_sua': getattr(organization, 'estado_sua', 'no_aplica'),
        })
        
        # Headquarters metrics
        headquarters = HeadquarterLocation.objects.filter(organization=organization)
        data.update({
            'total_headquarters': headquarters.count(),
            'active_headquarters': headquarters.filter(habilitation_status='habilitada').count(),
        })
        
        # Services metrics
        services = EnabledHealthService.objects.filter(headquarters__organization=organization)
        data.update({
            'total_services': services.count(),
            'enabled_services': services.filter(habilitation_status='activo').count(),
        })
        
        # Compliance percentages
        data.update({
            'porcentaje_cumplimiento_suh': getattr(organization, 'porcentaje_cumplimiento_suh', None),
            'porcentaje_cumplimiento_pamec': getattr(organization, 'porcentaje_cumplimiento_pamec', None),
            'porcentaje_cumplimiento_sic': getattr(organization, 'porcentaje_cumplimiento_sic', None),
        })
        
        # Generate and count alerts
        try:
            alerts_service = SOGCSAlertsService(organization)
            alerts = alerts_service.generate_all_alerts()
            critical_alerts = alerts_service.get_critical_alerts()
            
            data.update({
                'alertas_activas': len(alerts),
                'alertas_criticas': len(critical_alerts),
            })
        except Exception as e:
            logger.warning(f"Error generating alerts: {str(e)}")
            data.update({
                'alertas_activas': 0,
                'alertas_criticas': 0,
            })
        
        # Dates
        data.update({
            'fecha_ultima_autoevaluacion': getattr(organization, 'fecha_ultima_autoevaluacion', None),
            'fecha_proxima_auditoria': getattr(organization, 'fecha_proxima_auditoria', None),
        })
        
        # Responsible users
        coordinador = getattr(organization, 'coordinador_calidad', None)
        responsable = getattr(organization, 'responsable_habilitacion', None)
        
        data.update({
            'coordinador_calidad_name': coordinador.get_full_name() if coordinador else None,
            'responsable_habilitacion_name': responsable.get_full_name() if responsable else None,
        })
        
        serializer = SOGCSOverviewSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """
        Get current SOGCS alerts.
        """
        organization = self._get_user_organization()
        if not organization:
            return Response(
                {'error': 'Usuario no tiene organización asociada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            alerts_service = SOGCSAlertsService(organization)
            alerts = alerts_service.generate_all_alerts()
            
            # Convert alerts to serializable format
            alerts_data = [alert.to_dict() for alert in alerts]
            
            # Apply filters
            severity_filter = request.query_params.get('severity')
            if severity_filter:
                alerts_data = [a for a in alerts_data if a['severity'] == severity_filter]
            
            alert_type_filter = request.query_params.get('type')
            if alert_type_filter:
                alerts_data = [a for a in alerts_data if a['alert_type'] == alert_type_filter]
            
            # Get summary
            summary = alerts_service.get_alerts_summary()
            
            return Response({
                'alerts': alerts_data,
                'summary': summary,
                'total': len(alerts_data)
            })
            
        except Exception as e:
            logger.error(f"Error getting alerts: {str(e)}")
            return Response(
                {'error': f'Error generando alertas: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get', 'put'])
    def configuration(self, request):
        """
        Get or update SOGCS configuration.
        """
        organization = self._get_user_organization()
        if not organization:
            return Response(
                {'error': 'Usuario no tiene organización asociada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if request.method == 'GET':
            # Get current configuration
            config = getattr(organization, 'sogcs_configuration', {}) or {}
            serializer = SOGCSConfigurationSerializer(config)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            # Update configuration
            serializer = SOGCSConfigurationSerializer(data=request.data)
            if serializer.is_valid():
                # Update organization configuration
                organization.sogcs_configuration = serializer.validated_data
                organization.save(update_fields=['sogcs_configuration'])
                
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def activate(self, request):
        """
        Activate SOGCS module for the organization.
        """
        organization = self._get_user_organization()
        if not organization:
            return Response(
                {'error': 'Usuario no tiene organización asociada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if organization.sogcs_enabled:
            return Response({
                'message': 'SOGCS ya está activado para esta organización',
                'activated_at': organization.fecha_activacion_sogcs
            })
        
        try:
            success = organization.activate_sogcs(user=request.user)
            if success:
                return Response({
                    'message': 'SOGCS activado exitosamente',
                    'activated_at': organization.fecha_activacion_sogcs
                })
            else:
                return Response(
                    {'error': 'No se pudo activar SOGCS'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            logger.error(f"Error activating SOGCS: {str(e)}")
            return Response(
                {'error': f'Error activando SOGCS: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class REPSImportViewSet(viewsets.ViewSet):
    """
    ViewSet for REPS data import operations.
    
    Handles import of headquarters and services data
    from MinSalud REPS portal files.
    """
    
    permission_classes = [permissions.IsAuthenticated, HasPermission]
    parser_classes = [MultiPartParser, FormParser]

    def _get_user_organization(self):
        """Get current user's organization"""
        user = self.request.user
        
        if hasattr(user, 'current_organization'):
            return user.current_organization
        
        try:
            from apps.organization.models import Organization
            organization_query = Organization.objects.filter(is_active=True)
            base_organization = organization_query.first()
            
            if not base_organization:
                return None
                
            # Try to get HealthOrganization profile
            try:
                return HealthOrganization.objects.get(organization=base_organization)
            except HealthOrganization.DoesNotExist:
                return None
        except Exception as e:
            logger.error(f"Error getting user organization: {str(e)}")
            return None

    @action(detail=False, methods=['post'])
    def upload(self, request):
        """
        Import REPS data from uploaded files.
        """
        organization = self._get_user_organization()
        if not organization:
            return Response(
                {'error': 'Usuario no tiene organización asociada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = REPSImportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Save uploaded files temporarily
        headquarters_file_path = None
        services_file_path = None
        
        try:
            # Save headquarters file
            headquarters_file = serializer.validated_data.get('headquarters_file')
            if headquarters_file:
                with tempfile.NamedTemporaryFile(delete=False, suffix='.xls') as tmp_file:
                    for chunk in headquarters_file.chunks():
                        tmp_file.write(chunk)
                    headquarters_file_path = tmp_file.name
            
            # Save services file
            services_file = serializer.validated_data.get('services_file')
            if services_file:
                with tempfile.NamedTemporaryFile(delete=False, suffix='.xls') as tmp_file:
                    for chunk in services_file.chunks():
                        tmp_file.write(chunk)
                    services_file_path = tmp_file.name
            
            # Initialize synchronization service
            create_backup = serializer.validated_data.get('create_backup', True)
            sync_service = REPSSynchronizationService(organization, request.user)
            
            # Execute synchronization
            stats = sync_service.synchronize_from_files(
                headquarters_file=headquarters_file_path,
                services_file=services_file_path,
                create_backup=create_backup
            )
            
            # Prepare response
            response_data = {
                'status': stats['status'],
                'message': 'Importación completada exitosamente',
                'summary': {
                    'total_headquarters': stats.get('total_headquarters', 0),
                    'total_services': stats.get('total_services', 0),
                    'backup_created': stats.get('backup_created', False),
                    'errors_count': len(stats.get('errors', [])),
                    'warnings_count': len(stats.get('warnings', []))
                },
                'details': {
                    'files_processed': stats.get('files_processed', []),
                    'duration': str(stats.get('end_time', timezone.now()) - stats.get('start_time', timezone.now())),
                    'backup_id': stats.get('backup_id')
                }
            }
            
            if stats.get('errors'):
                response_data['errors'] = stats['errors'][:10]  # Limit errors shown
            
            if stats.get('warnings'):
                response_data['warnings'] = stats['warnings'][:10]  # Limit warnings shown
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except REPSSyncError as e:
            logger.error(f"REPS sync error: {str(e)}")
            return Response(
                {'error': f'Error en sincronización REPS: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in REPS import: {str(e)}")
            return Response(
                {'error': f'Error inesperado: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            # Clean up temporary files
            if headquarters_file_path and os.path.exists(headquarters_file_path):
                os.unlink(headquarters_file_path)
            if services_file_path and os.path.exists(services_file_path):
                os.unlink(services_file_path)

    @action(detail=False, methods=['get'])
    def status(self, request):
        """
        Get import status and history.
        """
        organization = self._get_user_organization()
        if not organization:
            return Response(
                {'error': 'Usuario no tiene organización asociada'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get current REPS data status
        headquarters_count = HeadquarterLocation.objects.filter(organization=organization).count()
        services_count = EnabledHealthService.objects.filter(headquarters__organization=organization).count()
        
        last_import = None
        headquarters_qs = HeadquarterLocation.objects.filter(organization=organization)
        if headquarters_qs.exists():
            last_import = headquarters_qs.aggregate(
                last_updated=Max('fecha_actualizacion_reps')
            )['last_updated']
        
        return Response({
            'organization': organization.organization.razon_social,
            'sogcs_enabled': organization.sogcs_enabled,
            'reps_data': {
                'headquarters_count': headquarters_count,
                'services_count': services_count,
                'last_import': last_import
            },
            'import_capability': {
                'can_import': True,
                'supported_formats': ['.xls (HTML table from REPS portal)']
            }
        })