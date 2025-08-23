"""
Capacity ViewSets

API endpoints for managing installed capacity according to REPS standards
and Colombian healthcare regulations.
"""

import os
import tempfile
import logging
from typing import Dict, Any
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

from apps.authorization.drf_permissions import HasPermission
from apps.organization.models.capacity import (
    CapacidadInstalada,
    CapacidadHistorial,
    CapacidadImportLog,
    GRUPO_CAPACIDAD_CHOICES,
)
from apps.organization.models.sogcs_sedes import HeadquarterLocation
from apps.organization.serializers.capacity_serializers import (
    CapacidadInstaladaListSerializer,
    CapacidadInstaladaDetailSerializer,
    CapacidadInstaladaCreateUpdateSerializer,
    CapacidadHistorialSerializer,
    CapacidadImportLogSerializer,
    CapacityImportSerializer,
    CapacityBulkActionSerializer,
    CapacityStatisticsSerializer,
    SedeCapacityOverviewSerializer,
    CapacityGroupSerializer,
    CapacityValidationSerializer,
)
from apps.sogcs.services.reps_capacity_importer import REPSCapacityImporter

logger = logging.getLogger(__name__)


class CapacidadInstaladaViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing installed capacity.
    
    Endpoints:
    - GET /api/v1/capacidad/ - List capacity records
    - POST /api/v1/capacidad/ - Create capacity record
    - GET /api/v1/capacidad/{id}/ - Get capacity details
    - PUT /api/v1/capacidad/{id}/ - Update capacity record
    - DELETE /api/v1/capacidad/{id}/ - Delete capacity record
    - POST /api/v1/capacidad/import-reps/ - Import from REPS file
    - POST /api/v1/capacidad/bulk-action/ - Bulk operations
    - GET /api/v1/capacidad/statistics/ - Capacity statistics
    - GET /api/v1/capacidad/by-sede/{sede_id}/ - Capacity by sede
    """
    
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = 'sogcs.view_capacity'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'sede_prestadora', 'grupo_capacidad', 'estado_capacidad',
        'sincronizado_reps', 'health_service'
    ]
    search_fields = [
        'nombre_concepto', 'codigo_concepto', 'numero_placa',
        'marca', 'modelo_equipo', 'observaciones'
    ]
    ordering_fields = [
        'grupo_capacidad', 'nombre_concepto', 'cantidad', 'created_at'
    ]
    ordering = ['grupo_capacidad', 'codigo_concepto']
    
    def get_queryset(self):
        """
        Filter capacity records by user's organization and permissions.
        """
        user = self.request.user
        queryset = CapacidadInstalada.objects.select_related(
            'sede_prestadora',
            'sede_prestadora__organization',
            'health_service'
        ).filter(deleted_at__isnull=True)
        
        # Filter by organization
        if user.is_superuser:
            # Superuser sees all capacity records
            pass
        elif hasattr(user, 'organization_users'):
            org_user = user.organization_users.first()
            if org_user and hasattr(org_user.organization, 'health_profile'):
                queryset = queryset.filter(
                    sede_prestadora__organization=org_user.organization.health_profile
                )
        else:
            queryset = queryset.none()
        
        # Additional filters
        sede_id = self.request.query_params.get('sede')
        if sede_id:
            queryset = queryset.filter(sede_prestadora_id=sede_id)
        
        grupo = self.request.query_params.get('grupo')
        if grupo:
            queryset = queryset.filter(grupo_capacidad=grupo.upper())
        
        needs_sync = self.request.query_params.get('needs_sync', '').lower() == 'true'
        if needs_sync:
            # Filter capacity that needs REPS synchronization
            cutoff_date = timezone.now() - timezone.timedelta(days=30)
            queryset = queryset.filter(
                Q(fecha_corte_reps__lt=cutoff_date) | Q(fecha_corte_reps__isnull=True)
            )
        
        return queryset
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        """
        if self.action == 'list':
            return CapacidadInstaladaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CapacidadInstaladaCreateUpdateSerializer
        elif self.action == 'import_reps':
            return CapacityImportSerializer
        elif self.action == 'bulk_action':
            return CapacityBulkActionSerializer
        elif self.action == 'statistics':
            return CapacityStatisticsSerializer
        return CapacidadInstaladaDetailSerializer
    
    @action(
        detail=False,
        methods=['POST'],
        parser_classes=[MultiPartParser, FormParser],
        url_path='import-reps',
        permission_classes=[IsAuthenticated]
    )
    def import_reps(self, request):
        """
        Import capacity data from REPS file.
        
        Accepts XLS, XLSX, CSV, or HTML files exported from REPS portal.
        """
        serializer = CapacityImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file = serializer.validated_data['file']
        sede_id = serializer.validated_data.get('sede_id')
        validate_only = serializer.validated_data.get('validate_only', False)
        
        # Get user's organization
        org_user = self._get_organization_user(request.user)
        if not org_user:
            return Response(
                {'error': 'Usuario no asociado a ninguna organización'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Save file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xls') as tmp_file:
                for chunk in file.chunks():
                    tmp_file.write(chunk)
                tmp_file_path = tmp_file.name
            
            # Initialize importer
            health_org = self._get_health_organization(org_user)
            importer = REPSCapacityImporter(
                organization=health_org,
                user=request.user,
                validation_only=validate_only
            )
            
            # Process import
            import_log = importer.import_from_file(
                file_path=tmp_file_path,
                file_name=file.name,
                file_size=file.size
            )
            
            # Clean up temp file
            os.unlink(tmp_file_path)
            
            # Prepare response based on whether it's validation-only or actual import
            if validate_only:
                # Return validation result format for frontend
                response_data = {
                    'is_valid': import_log.estado_importacion == 'completada' and len(import_log.errores) == 0,
                    'errors': import_log.errores[:10],  # Limit errors in response
                    'warnings': import_log.advertencias[:5],  # Limit warnings
                    'summary': {
                        'total_records': import_log.total_registros or 0,
                        'valid_records': (import_log.total_registros or 0) - (import_log.registros_con_error or 0),
                        'invalid_records': import_log.registros_con_error or 0,
                        'warnings_count': len(import_log.advertencias) if import_log.advertencias else 0,
                    },
                    'suggestions': []  # Could add suggestions based on errors/warnings
                }
                
                # Add suggestions based on common issues
                if import_log.advertencias:
                    response_data['suggestions'].append(
                        "Revise las advertencias antes de proceder con la importación"
                    )
                if import_log.errores:
                    response_data['suggestions'].extend([
                        "Corrija los errores en el archivo antes de importar",
                        "Verifique que el archivo tenga el formato correcto de REPS"
                    ])
                
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                # Return import response format for actual import
                response_data = {
                    'success': import_log.estado_importacion in ['completada', 'completada_con_errores'],
                    'message': f'Importación {import_log.estado_importacion}',
                    'import_log_id': import_log.id,
                    'total_rows': import_log.total_registros,
                    'imported_count': import_log.registros_importados,
                    'updated_count': import_log.registros_actualizados,
                    'error_count': import_log.registros_con_error,
                    'errors': import_log.errores[:10],  # Limit errors in response
                    'warnings': import_log.advertencias[:5],  # Limit warnings
                    'statistics': import_log.estadisticas,
                }
                
                # Determine response status based on import state
                if import_log.estado_importacion == 'completada':
                    response_status = status.HTTP_201_CREATED
                elif import_log.estado_importacion == 'fallida':
                    # Import failed completely - return error status
                    return Response(
                        {'error': f'Error al procesar archivo: {import_log.errores[-1] if import_log.errores else "Error desconocido"}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    response_status = status.HTTP_206_PARTIAL_CONTENT
                    
                return Response(response_data, status=response_status)
            
        except Exception as e:
            logger.error(f"Capacity import error: {str(e)}", exc_info=True)
            
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
    
    @action(
        detail=False,
        methods=['POST'],
        url_path='bulk-action',
        permission_classes=[IsAuthenticated]
    )
    def bulk_action(self, request):
        """
        Perform bulk actions on multiple capacity records.
        
        Actions: enable, disable, delete, sync_reps, update_status
        """
        serializer = CapacityBulkActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        capacity_ids = serializer.validated_data['capacity_ids']
        action = serializer.validated_data['action']
        additional_data = serializer.validated_data.get('additional_data', {})
        
        # Get capacity records and verify permissions
        capacities = self.get_queryset().filter(id__in=capacity_ids)
        
        if not capacities.exists():
            return Response(
                {'error': 'No se encontraron registros de capacidad válidos'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Perform action
        result = {'message': '', 'affected': 0}
        
        with transaction.atomic():
            if action == 'enable':
                result['affected'] = capacities.update(
                    estado_capacidad='activa',
                    updated_by=request.user,
                    updated_at=timezone.now()
                )
                result['message'] = f'{result["affected"]} capacidades habilitadas'
                
            elif action == 'disable':
                result['affected'] = capacities.update(
                    estado_capacidad='inactiva',
                    updated_by=request.user,
                    updated_at=timezone.now()
                )
                result['message'] = f'{result["affected"]} capacidades deshabilitadas'
                
            elif action == 'delete':
                result['affected'] = capacities.count()
                capacities.update(
                    deleted_at=timezone.now(),
                    deleted_by=request.user
                )
                result['message'] = f'{result["affected"]} capacidades eliminadas'
                
            elif action == 'sync_reps':
                result['affected'] = capacities.update(
                    fecha_corte_reps=timezone.now(),
                    sincronizado_reps=True,
                    updated_by=request.user,
                    updated_at=timezone.now()
                )
                result['message'] = f'{result["affected"]} capacidades sincronizadas'
                
            elif action == 'update_status':
                nuevo_estado = additional_data.get('estado', 'activa')
                result['affected'] = capacities.update(
                    estado_capacidad=nuevo_estado,
                    updated_by=request.user,
                    updated_at=timezone.now()
                )
                result['message'] = f'Estado actualizado para {result["affected"]} capacidades'
            
            # Create history records for bulk actions
            for capacity in capacities:
                CapacidadHistorial.objects.create(
                    capacidad=capacity,
                    accion='modificacion',
                    campo_modificado='bulk_action',
                    valor_nuevo=action,
                    justificacion=f'Acción masiva: {action}',
                    origen_cambio='manual',
                    created_by=request.user
                )
        
        return Response(result, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['GET'], url_path='statistics')
    def statistics(self, request):
        """
        Get comprehensive capacity statistics.
        """
        queryset = self.get_queryset()
        
        # Basic statistics
        total_capacity = queryset.count()
        
        # Statistics by group
        by_group = {}
        group_stats = queryset.values('grupo_capacidad').annotate(
            count=Count('id'),
            total_cantidad=Sum('cantidad'),
            total_habilitada=Sum('cantidad_habilitada'),
            total_funcionando=Sum('cantidad_funcionando')
        )
        
        for stat in group_stats:
            grupo = stat['grupo_capacidad']
            by_group[grupo] = {
                'count': stat['count'],
                'total_cantidad': stat['total_cantidad'] or 0,
                'total_habilitada': stat['total_habilitada'] or 0,
                'total_funcionando': stat['total_funcionando'] or 0,
            }
        
        # Statistics by sede
        by_sede = []
        sede_stats = queryset.values(
            'sede_prestadora__id',
            'sede_prestadora__name'
        ).annotate(
            count=Count('id'),
            total_cantidad=Sum('cantidad')
        ).order_by('-total_cantidad')[:10]
        
        for stat in sede_stats:
            by_sede.append({
                'sede_id': stat['sede_prestadora__id'],
                'sede_name': stat['sede_prestadora__name'],
                'count': stat['count'],
                'total_cantidad': stat['total_cantidad'] or 0
            })
        
        # Statistics by status
        status_stats = queryset.values('estado_capacidad').annotate(count=Count('id'))
        by_status = {stat['estado_capacidad']: stat['count'] for stat in status_stats}
        
        # Occupancy rates (only for records with occupancy data)
        occupancy_queryset = queryset.filter(porcentaje_ocupacion__isnull=False)
        occupancy_rates = {}
        
        if occupancy_queryset.exists():
            occupancy_stats = occupancy_queryset.values('grupo_capacidad').annotate(
                avg_occupancy=Avg('porcentaje_ocupacion')
            )
            occupancy_rates = {
                stat['grupo_capacidad']: round(stat['avg_occupancy'], 2)
                for stat in occupancy_stats
            }
        
        # REPS sync status
        reps_sync_status = {
            'synchronized': queryset.filter(sincronizado_reps=True).count(),
            'needs_sync': queryset.filter(sincronizado_reps=False).count(),
            'outdated': queryset.filter(
                fecha_corte_reps__lt=timezone.now() - timezone.timedelta(days=30)
            ).count()
        }
        
        # Recent imports
        recent_imports = CapacidadImportLog.objects.filter(
            sede_prestadora__organization=self._get_user_organization()
        ).order_by('-created_at')[:5]
        
        recent_imports_data = []
        for import_log in recent_imports:
            recent_imports_data.append({
                'id': import_log.id,
                'filename': import_log.nombre_archivo,
                'status': import_log.estado_importacion,
                'imported_count': import_log.registros_importados,
                'created_at': import_log.created_at
            })
        
        statistics = {
            'total_capacity': total_capacity,
            'by_group': by_group,
            'by_sede': by_sede,
            'by_status': by_status,
            'occupancy_rates': occupancy_rates,
            'reps_sync_status': reps_sync_status,
            'recent_imports': recent_imports_data,
            'pending_updates': queryset.filter(sincronizado_reps=False).count()
        }
        
        return Response(statistics)
    
    @action(
        detail=False,
        methods=['GET'],
        url_path='by-sede/(?P<sede_id>[^/.]+)'
    )
    def by_sede(self, request, sede_id=None):
        """
        Get capacity records grouped by type for a specific sede.
        """
        sede = get_object_or_404(HeadquarterLocation, pk=sede_id)
        
        # Verify user has access to this sede
        if not self._user_has_sede_access(request.user, sede):
            return Response(
                {'error': 'No tiene permisos para ver esta sede'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get capacity records for this sede
        capacities = self.get_queryset().filter(sede_prestadora=sede)
        
        # Group by capacity type
        grouped_capacities = {}
        for capacity in capacities:
            group = capacity.grupo_capacidad
            if group not in grouped_capacities:
                grouped_capacities[group] = {
                    'grupo_capacidad': group,
                    'grupo_display': capacity.get_grupo_capacidad_display(),
                    'capacidades': [],
                    'totales': {
                        'count': 0,
                        'total_cantidad': 0,
                        'total_habilitada': 0,
                        'total_funcionando': 0
                    }
                }
            
            serializer = CapacidadInstaladaListSerializer(capacity)
            grouped_capacities[group]['capacidades'].append(serializer.data)
            grouped_capacities[group]['totales']['count'] += 1
            grouped_capacities[group]['totales']['total_cantidad'] += capacity.cantidad
            grouped_capacities[group]['totales']['total_habilitada'] += capacity.cantidad_habilitada
            grouped_capacities[group]['totales']['total_funcionando'] += capacity.cantidad_funcionando
        
        # Calculate overall statistics
        total_capacity = capacities.count()
        total_cantidad = capacities.aggregate(Sum('cantidad'))['cantidad__sum'] or 0
        avg_occupancy = capacities.filter(
            porcentaje_ocupacion__isnull=False
        ).aggregate(Avg('porcentaje_ocupacion'))['porcentaje_ocupacion__avg']
        
        last_update = capacities.order_by('-updated_at').first()
        needs_sync = capacities.filter(sincronizado_reps=False).exists()
        
        response_data = {
            'sede': {
                'id': sede.id,
                'name': sede.name,
                'reps_code': sede.reps_code,
                'address': getattr(sede, 'complete_address', ''),
            },
            'summary': {
                'total_capacity': total_capacity,
                'total_cantidad': total_cantidad,
                'average_occupancy': round(avg_occupancy, 2) if avg_occupancy else None,
                'last_update': last_update.updated_at if last_update else None,
                'needs_sync': needs_sync
            },
            'capacity_by_group': list(grouped_capacities.values())
        }
        
        return Response(response_data)
    
    def _get_organization_user(self, user):
        """Get organization user, handling both regular users and superusers."""
        try:
            return user.organization_users.first()
        except AttributeError:
            if user.is_superuser:
                # Create mock org user for superuser
                from apps.organization.models import Organization
                base_org = Organization.objects.filter(is_active=True).first()
                if base_org and hasattr(base_org, 'health_profile'):
                    class MockOrgUser:
                        def __init__(self, organization):
                            self.organization = organization
                    return MockOrgUser(base_org.health_profile)
            return None
    
    def _get_health_organization(self, org_user):
        """Get health organization from org user."""
        if hasattr(org_user.organization, 'health_profile'):
            return org_user.organization.health_profile
        else:
            return org_user.organization
    
    def _get_user_organization(self):
        """Get current user's organization."""
        org_user = self._get_organization_user(self.request.user)
        if org_user:
            return self._get_health_organization(org_user)
        return None
    
    def _user_has_sede_access(self, user, sede):
        """Check if user has access to the specified sede."""
        if user.is_superuser:
            return True
        
        org_user = self._get_organization_user(user)
        if org_user:
            health_org = self._get_health_organization(org_user)
            return sede.organization == health_org
        
        return False


class CapacidadHistorialViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for capacity history records.
    
    Endpoints:
    - GET /api/v1/capacidad-historial/ - List history records
    - GET /api/v1/capacidad-historial/{id}/ - Get history details
    """
    
    queryset = CapacidadHistorial.objects.all()
    serializer_class = CapacidadHistorialSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = 'sogcs.view_capacity'
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['capacidad', 'accion', 'origen_cambio', 'created_by']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter history records by user's organization."""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Filter by organization through capacity relationship
        if not user.is_superuser:
            org_user = user.organization_users.first()
            if org_user and hasattr(org_user.organization, 'health_profile'):
                queryset = queryset.filter(
                    capacidad__sede_prestadora__organization=org_user.organization.health_profile
                )
            else:
                queryset = queryset.none()
        
        return queryset


class CapacidadImportLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for capacity import logs.
    
    Endpoints:
    - GET /api/v1/capacidad-import-logs/ - List import logs
    - GET /api/v1/capacidad-import-logs/{id}/ - Get import log details
    """
    
    queryset = CapacidadImportLog.objects.all()
    serializer_class = CapacidadImportLogSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = 'sogcs.view_capacity'
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['sede_prestadora', 'estado_importacion', 'formato_archivo']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter import logs by user's organization."""
        user = self.request.user
        queryset = super().get_queryset()
        
        if not user.is_superuser:
            org_user = user.organization_users.first()
            if org_user and hasattr(org_user.organization, 'health_profile'):
                queryset = queryset.filter(
                    sede_prestadora__organization=org_user.organization.health_profile
                )
            else:
                queryset = queryset.none()
        
        return queryset