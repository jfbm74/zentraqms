"""
Views for Organization module in ZentraQMS.

This module contains ViewSets and API views for Organization and Location models,
providing REST API endpoints for organization management.
"""

import logging
import json
from datetime import timedelta
from rest_framework import viewsets, status, permissions, serializers, filters

logger = logging.getLogger(__name__)
from rest_framework.decorators import action
from django.core.exceptions import ValidationError, ValidationError as DjangoValidationError
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.http import HttpResponse

from apps.authorization.drf_permissions import (
    CanViewOrganization,
    CanCreateOrganization,
    CanUpdateOrganization,
    CanDeleteOrganization,
)
from .models import (
    Organization, Location, SectorTemplate, AuditLog, HealthOrganization, HealthService, 
    SedePrestadora, SedeServicio, HeadquarterLocation, EnabledHealthService, ServiceHabilitationProcess
)
from .signals import set_audit_context
from .serializers import (
    OrganizationSerializer,
    OrganizationCreateSerializer,
    OrganizationListSerializer,
    OrganizationWizardStep1Serializer,
    LocationSerializer,
    LocationCreateSerializer,
    LocationListSerializer,
    LocationWizardStep1Serializer,
    SectorTemplateSerializer,
    SectorTemplateCreateSerializer,
    SectorTemplateListSerializer,
    SectorTemplateApplySerializer,
    AuditLogSerializer,
    AuditLogListSerializer,
    RollbackRequestSerializer,
    OrganizationHistorySerializer,
    # Serializers para sedes
    SedeSerializer,
    SedeListSerializer,
    SedeCreateSerializer,
    SedeImportSerializer,
    SedeValidationSerializer,
    SedeBulkSerializer,
    SedeServicioSerializer,
    # Simplified wizard serializers
    OrganizationWizardSerializer,
    OrganizationWizardCreateSerializer,
    DepartmentSerializer,
    MunicipalitySerializer,
)

logger = logging.getLogger(__name__)


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Organization model.

    Provides CRUD operations for organizations and special endpoints
    for the configuration wizard.

    Permissions:
    - List/Read: CanViewOrganization
    - Create: CanCreateOrganization
    - Update: CanUpdateOrganization
    - Delete: CanDeleteOrganization
    """

    queryset = Organization.objects.all()
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["razon_social", "nombre_comercial", "nit"]
    ordering_fields = ["razon_social", "nombre_comercial", "created_at", "updated_at"]
    ordering = ["razon_social"]

    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action.

        Returns:
            class: Serializer class for the current action
        """
        if self.action == "list":
            return OrganizationListSerializer
        elif self.action == "create":
            return OrganizationCreateSerializer
        elif self.action == "wizard_step1":
            return OrganizationWizardStep1Serializer
        else:
            return OrganizationSerializer

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Returns:
            list: Permission classes for the current action
        """
        if self.action in ["list", "retrieve", "wizard_step1"]:
            permission_classes = [permissions.IsAuthenticated, CanViewOrganization]
        elif self.action == "create":
            permission_classes = [permissions.IsAuthenticated, CanCreateOrganization]
        elif self.action in ["update", "partial_update"]:
            permission_classes = [permissions.IsAuthenticated, CanUpdateOrganization]
        elif self.action == "destroy":
            permission_classes = [permissions.IsAuthenticated, CanDeleteOrganization]
        else:
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        Set audit fields when creating organization.

        Args:
            serializer: Serializer instance with validated data
        """
        instance = serializer.save(
            created_by=self.request.user, updated_by=self.request.user
        )

        # Set audit context for signal handlers
        set_audit_context(
            instance=instance,
            user=self.request.user,
            request=self.request,
            reason=self.request.data.get("_audit_reason"),
        )

    def perform_update(self, serializer):
        """
        Set audit fields when updating organization.

        Args:
            serializer: Serializer instance with validated data
        """
        instance = serializer.save(updated_by=self.request.user)

        # Set audit context for signal handlers
        set_audit_context(
            instance=instance,
            user=self.request.user,
            request=self.request,
            reason=self.request.data.get("_audit_reason"),
        )

    @action(detail=False, methods=["get"])
    def exists_check(self, request):
        """
        Check if any organizations exist in the system.

        This is a lightweight endpoint to check organization existence
        without fetching all data - useful for dashboard checks.

        Returns:
            dict: Status indicating if organizations exist
        """
        try:
            exists = Organization.objects.exists()
            count = Organization.objects.count() if exists else 0

            return Response(
                {
                    "exists": exists,
                    "count": count,
                    "message": (
                        "Organizations found"
                        if exists
                        else "No organizations configured"
                    ),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "exists": False,
                    "count": 0,
                    "error": str(e),
                    "message": "Error checking organization existence",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get", "post"], url_path="wizard/step1")
    def wizard_step1(self, request):
        """
        Handle Organization Wizard Step 1.

        GET: Return current organization data or empty form
        POST: Create or update organization with step 1 data

        Args:
            request: HTTP request object

        Returns:
            Response: Organization data or validation errors
        """
        if request.method == "GET":
            # Verificar si ya existe una organización para el usuario
            # En el futuro, esto se basará en el contexto del usuario
            organization = (
                Organization.objects.first()
            )  # Temporal: obtener primera organización

            if organization:
                serializer = self.get_serializer(organization)
                return Response(
                    {
                        "organization": serializer.data,
                        "step_completed": True,
                        "message": _(
                            "Organización ya configurada. Puede editarla si es necesario."
                        ),
                    }
                )
            else:
                # Retornar formulario vacío
                return Response(
                    {
                        "organization": None,
                        "step_completed": False,
                        "message": _("Configure los datos básicos de su organización."),
                    }
                )

        elif request.method == "POST":
            # Verificar si ya existe organización
            organization = Organization.objects.first()  # Temporal

            if organization:
                # Actualizar organización existente
                serializer = self.get_serializer(
                    organization, data=request.data, partial=True
                )
            else:
                # Crear nueva organización
                serializer = self.get_serializer(data=request.data)

            if serializer.is_valid():
                if organization:
                    serializer.save(updated_by=request.user)
                    message = _("Datos de organización actualizados correctamente.")
                else:
                    serializer.save(created_by=request.user, updated_by=request.user)
                    message = _("Organización creada correctamente.")

                return Response(
                    {
                        "organization": serializer.data,
                        "organization_id": serializer.instance.id,
                        "step_completed": True,
                        "next_step": "step2",
                        "message": message,
                    },
                    status=(
                        status.HTTP_200_OK if organization else status.HTTP_201_CREATED
                    ),
                )
            else:
                return Response(
                    {
                        "errors": serializer.errors,
                        "message": _("Por favor corrija los errores en el formulario."),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

    @action(detail=True, methods=["get"])
    def locations(self, request, pk=None):
        """
        Get all locations for an organization.

        Args:
            request: HTTP request object
            pk: Organization primary key

        Returns:
            Response: List of locations for the organization
        """
        organization = self.get_object()
        locations = organization.locations.all()
        serializer = LocationListSerializer(locations, many=True)

        return Response({"locations": serializer.data, "count": locations.count()})


    @action(detail=True, methods=["get"], url_path="audit-history")
    def audit_history(self, request, pk=None):
        """
        Get audit history for a specific organization.

        Args:
            request: HTTP request object
            pk: Organization primary key

        Returns:
            Response: Audit history for the organization
        """
        organization = self.get_object()

        # Get query parameters
        limit = request.query_params.get("limit", 50)
        try:
            limit = int(limit)
            limit = min(max(limit, 1), 1000)  # Clamp between 1 and 1000
        except (ValueError, TypeError):
            limit = 50

        # Get audit history
        audit_logs = AuditLog.get_record_history(organization, limit=limit)
        serializer = AuditLogListSerializer(audit_logs, many=True)

        return Response(
            {
                "organization_id": str(organization.id),
                "organization_name": str(organization),
                "audit_logs": serializer.data,
                "count": audit_logs.count(),
                "limit": limit,
            }
        )

    @action(detail=True, methods=["post"], url_path="rollback")
    def rollback(self, request, pk=None):
        """
        Rollback organization to a previous state.

        Args:
            request: HTTP request with rollback data
            pk: Organization primary key

        Returns:
            Response: Result of rollback operation
        """
        organization = self.get_object()

        # Validate rollback request
        serializer = RollbackRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "error": _("Datos de rollback inválidos."),
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        audit_log_id = serializer.validated_data["audit_log_id"]
        reason = serializer.validated_data.get("reason", "")

        try:
            # Get the audit log
            audit_log = AuditLog.objects.get(id=audit_log_id)

            # Verify it belongs to this organization
            if audit_log.record_id != str(organization.id):
                return Response(
                    {"error": _("El audit log no pertenece a esta organización.")},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if rollback is possible
            can_rollback, rollback_reason = AuditLog.can_rollback(
                organization, audit_log_id
            )
            if not can_rollback:
                return Response(
                    {"error": rollback_reason}, status=status.HTTP_400_BAD_REQUEST
                )

            # Perform rollback
            success, message, rolled_back_instance = audit_log.perform_rollback(
                user=request.user, request=request, reason=reason
            )

            if success:
                # Return updated organization data
                org_serializer = OrganizationSerializer(rolled_back_instance)
                return Response(
                    {
                        "success": True,
                        "message": message,
                        "organization": org_serializer.data,
                        "rollback_to": audit_log.created_at,
                        "reason": reason,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

        except AuditLog.DoesNotExist:
            return Response(
                {"error": _("Audit log no encontrado.")},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"error": _("Error durante rollback: {}").format(str(e))},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete an organization.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: Empty response with 204 status
        """
        instance = self.get_object()
        instance.deleted_at = timezone.now()
        instance.deleted_by = request.user
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Location model.

    Provides CRUD operations for organization locations/sedes.

    Permissions:
    - List/Read: CanViewOrganization
    - Create: CanCreateOrganization
    - Update: CanUpdateOrganization
    - Delete: CanDeleteOrganization
    """

    queryset = Location.objects.all()
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["nombre", "direccion", "ciudad", "departamento"]
    ordering_fields = ["nombre", "ciudad", "created_at", "updated_at"]
    ordering = ["-es_principal", "nombre"]

    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action.

        Returns:
            class: Serializer class for the current action
        """
        if self.action == "list":
            return LocationListSerializer
        elif self.action == "create":
            return LocationCreateSerializer
        elif self.action == "wizard_step1":
            return LocationWizardStep1Serializer
        else:
            return LocationSerializer

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Returns:
            list: Permission classes for the current action
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = [permissions.IsAuthenticated, CanViewOrganization]
        elif self.action == "create":
            permission_classes = [permissions.IsAuthenticated, CanCreateOrganization]
        elif self.action in ["update", "partial_update"]:
            permission_classes = [permissions.IsAuthenticated, CanUpdateOrganization]
        elif self.action == "destroy":
            permission_classes = [permissions.IsAuthenticated, CanDeleteOrganization]
        else:
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filter queryset based on organization context.

        Returns:
            QuerySet: Filtered locations
        """
        queryset = super().get_queryset()

        # Filtrar por organización si se proporciona el parámetro
        organization_id = self.request.query_params.get("organization")
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)

        return queryset

    def perform_create(self, serializer):
        """
        Set audit fields and organization when creating location.

        Args:
            serializer: Serializer instance with validated data
        """
        from django.db import IntegrityError
        from rest_framework.exceptions import ValidationError
        
        # En el futuro, obtener organización del contexto del usuario
        # Por ahora, usar la organización del request o la primera disponible
        organization_id = self.request.data.get("organization")
        if organization_id:
            try:
                organization = Organization.objects.get(id=organization_id)
            except Organization.DoesNotExist:
                raise ValidationError({
                    "organization": [_("Organización no encontrada.")]
                })
        else:
            organization = Organization.objects.first()

        try:
            serializer.save(
                organization=organization,
                created_by=self.request.user,
                updated_by=self.request.user,
            )
        except IntegrityError as e:
            # Check for unique constraint violation on organization_id
            if "organization_location.organization_id" in str(e) and "UNIQUE constraint failed" in str(e):
                raise ValidationError({
                    "es_principal": [_("Ya existe una sede principal para esta organización.")]
                })
            raise

    def perform_update(self, serializer):
        """
        Set audit fields when updating location.

        Args:
            serializer: Serializer instance with validated data
        """
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=["get", "post"], url_path="wizard/step1")
    def wizard_step1(self, request):
        """
        Handle Location creation in Organization Wizard Step 1.

        GET: Return main location data or empty form
        POST: Create or update main location for organization

        Args:
            request: HTTP request object

        Returns:
            Response: Location data or validation errors
        """
        # Obtener organización (temporal - primera disponible)
        organization = Organization.objects.first()

        if not organization:
            return Response(
                {"error": _("Debe crear primero la organización.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if request.method == "GET":
            # Buscar sede principal existente
            main_location = Location.objects.filter(
                organization=organization, es_principal=True
            ).first()

            if main_location:
                serializer = self.get_serializer(main_location)
                return Response(
                    {
                        "location": serializer.data,
                        "step_completed": True,
                        "message": _("Sede principal ya configurada."),
                    }
                )
            else:
                return Response(
                    {
                        "location": None,
                        "step_completed": False,
                        "message": _("Configure la sede principal de su organización."),
                    }
                )

        elif request.method == "POST":
            # Buscar sede principal existente
            main_location = Location.objects.filter(
                organization=organization, es_principal=True
            ).first()

            if main_location:
                # Actualizar sede principal existente
                serializer = self.get_serializer(
                    main_location, data=request.data, partial=True
                )
            else:
                # Crear nueva sede principal
                serializer = self.get_serializer(data=request.data)

            if serializer.is_valid():
                if main_location:
                    serializer.save(updated_by=request.user)
                    message = _("Sede principal actualizada correctamente.")
                else:
                    serializer.save(
                        organization=organization,
                        es_principal=True,
                        tipo_sede="principal",
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    message = _("Sede principal creada correctamente.")

                return Response(
                    {
                        "location": serializer.data,
                        "step_completed": True,
                        "message": message,
                    },
                    status=(
                        status.HTTP_200_OK if main_location else status.HTTP_201_CREATED
                    ),
                )
            else:
                return Response(
                    {
                        "errors": serializer.errors,
                        "message": _("Por favor corrija los errores en el formulario."),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

    @action(detail=False, methods=["get"])
    def by_organization(self, request):
        """
        Get locations by organization ID.

        Args:
            request: HTTP request with organization_id parameter

        Returns:
            Response: List of locations for the organization
        """
        organization_id = request.query_params.get("organization_id")

        if not organization_id:
            return Response(
                {"error": _("organization_id es requerido.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            organization = Organization.objects.get(id=organization_id)
            locations = self.get_queryset().filter(organization=organization)
            serializer = LocationListSerializer(locations, many=True)

            return Response(
                {
                    "organization": OrganizationListSerializer(organization).data,
                    "locations": serializer.data,
                    "count": locations.count(),
                }
            )
        except Organization.DoesNotExist:
            return Response(
                {"error": _("Organización no encontrada.")},
                status=status.HTTP_404_NOT_FOUND,
            )

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete a location.
        
        Args:
            request: HTTP request object
            
        Returns:
            Response: Empty response with 204 status
        """
        instance = self.get_object()
        instance.deleted_at = timezone.now()
        instance.deleted_by = request.user
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SectorTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SectorTemplate model.

    Provides CRUD operations for sector templates and special endpoints
    for template application and sector filtering.

    Permissions:
    - List/Read: CanViewOrganization
    - Create: CanCreateOrganization (super admin only)
    - Update: CanUpdateOrganization (super admin only)
    - Delete: CanDeleteOrganization (super admin only)
    """

    queryset = SectorTemplate.objects.all()
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["nombre_template", "descripcion", "sector"]
    ordering_fields = [
        "nombre_template",
        "sector",
        "aplicaciones_exitosas",
        "created_at",
    ]
    ordering = ["sector", "nombre_template"]

    def get_serializer_class(self):
        """
        Return appropriate serializer class based on action.

        Returns:
            class: Serializer class for the current action
        """
        if self.action == "list":
            return SectorTemplateListSerializer
        elif self.action == "create":
            return SectorTemplateCreateSerializer
        elif self.action == "apply_template":
            return SectorTemplateApplySerializer
        else:
            return SectorTemplateSerializer

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Returns:
            list: Permission classes for the current action
        """
        if self.action in ["list", "retrieve", "by_sector"]:
            permission_classes = [permissions.IsAuthenticated, CanViewOrganization]
        elif self.action in ["create", "update", "partial_update", "destroy"]:
            # Solo super admins pueden modificar templates
            permission_classes = [permissions.IsAuthenticated, CanCreateOrganization]
        elif self.action == "apply_template":
            permission_classes = [permissions.IsAuthenticated, CanUpdateOrganization]
        else:
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """
        Set audit fields when creating sector template.

        Args:
            serializer: Serializer instance with validated data
        """
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        """
        Set audit fields when updating sector template.

        Args:
            serializer: Serializer instance with validated data
        """
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="by-sector")
    def by_sector(self, request):
        """
        Get templates filtered by sector.

        Args:
            request: HTTP request with sector parameter

        Returns:
            Response: List of templates for the sector
        """
        sector = request.query_params.get("sector")

        if not sector:
            return Response(
                {"error": _("Parámetro sector es requerido.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar que el sector exista en las opciones
        valid_sectors = dict(SectorTemplate.SECTOR_CHOICES)
        if sector not in valid_sectors:
            return Response(
                {
                    "error": _("Sector inválido. Opciones válidas: {}").format(
                        ", ".join(valid_sectors.keys())
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        templates = SectorTemplate.obtener_templates_por_sector(sector)
        serializer = SectorTemplateListSerializer(templates, many=True)

        return Response(
            {
                "sector": sector,
                "sector_display": valid_sectors[sector],
                "templates": serializer.data,
                "count": templates.count(),
            }
        )

    @action(detail=True, methods=["post"], url_path="apply")
    def apply_template(self, request, pk=None):
        """
        Apply a sector template to an organization.

        Args:
            request: HTTP request with organization_id in body
            pk: Template primary key

        Returns:
            Response: Result of template application
        """
        template = self.get_object()

        # Usar serializer para validar la aplicación
        serializer = self.get_serializer(
            data=request.data, context={"template": template, "request": request}
        )

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # Aplicar el template
                    resultado = serializer.save()

                    return Response(
                        {
                            "success": True,
                            "message": _("Template aplicado exitosamente."),
                            "resultado": resultado,
                        },
                        status=status.HTTP_200_OK,
                    )

            except Exception as e:
                return Response(
                    {"error": _("Error aplicando template: {}").format(str(e))},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            return Response(
                {
                    "errors": serializer.errors,
                    "message": _("Por favor corrija los errores en la solicitud."),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["post"], url_path="create-basic")
    def create_basic_template(self, request):
        """
        Create a basic template for a sector with default configuration.

        Args:
            request: HTTP request with sector, nombre, descripcion

        Returns:
            Response: Created template data
        """
        sector = request.data.get("sector")
        nombre = request.data.get("nombre")
        descripcion = request.data.get("descripcion")

        if not all([sector, nombre, descripcion]):
            return Response(
                {"error": _("Los campos sector, nombre y descripcion son requeridos.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar sector
        valid_sectors = dict(SectorTemplate.SECTOR_CHOICES)
        if sector not in valid_sectors:
            return Response(
                {
                    "error": _("Sector inválido. Opciones válidas: {}").format(
                        ", ".join(valid_sectors.keys())
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                template = SectorTemplate.crear_template_basico(
                    sector=sector,
                    nombre=nombre,
                    descripcion=descripcion,
                    usuario=request.user,
                )

                serializer = SectorTemplateSerializer(template)

                return Response(
                    {
                        "message": _("Template básico creado exitosamente."),
                        "template": serializer.data,
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            return Response(
                {"error": _("Error creando template básico: {}").format(str(e))},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"], url_path="sectors")
    def available_sectors(self, request):
        """
        Get all available sectors with their display names.

        Args:
            request: HTTP request

        Returns:
            Response: List of available sectors
        """
        sectors = [
            {"code": code, "display": display}
            for code, display in SectorTemplate.SECTOR_CHOICES
        ]

        return Response({"sectors": sectors, "count": len(sectors)})


class HealthViewSet(viewsets.ViewSet):
    """
    ViewSet for Health-related operations.
    
    Provides endpoints for REPS validation, health services catalog,
    and health organization management.
    
    Note: SUH portal integration has been removed due to access limitations.
    Manual data entry is now the recommended approach for health organizations.
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='validate-reps')
    def validate_reps(self, request):
        """
        Validate a provider code against REPS (mock implementation).
        
        Note: This is a mock implementation. Real REPS validation would require
        official API access from the Ministry of Health.
        
        Args:
            request: HTTP request with codigo_prestador in body
            
        Returns:
            Response: Validation result with provider data if valid
        """
        codigo_prestador = request.data.get('codigo_prestador')
        
        if not codigo_prestador:
            return Response(
                {'error': _('El código prestador es requerido.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar formato básico
        if len(codigo_prestador) != 12 or not codigo_prestador.isdigit():
            return Response(
                {
                    'isValid': False,
                    'message': _('El código prestador debe tener exactamente 12 dígitos.'),
                    'providerData': None,
                    'note': _('Validación de formato únicamente - se requiere verificación manual con REPS.')
                },
                status=status.HTTP_200_OK
            )
        
        # Mock validation - Simular consulta a REPS
        is_valid = self._mock_reps_validation(codigo_prestador)
        
        if is_valid:
            provider_data = self._get_mock_provider_data(codigo_prestador)
            
            return Response({
                'isValid': True,
                'message': _('Formato válido - Requiere verificación manual con REPS'),
                'providerData': provider_data,
                'lastValidated': timezone.now().isoformat(),
                'note': _('Datos simulados - Verificar manualmente en portal SUH del MinSalud')
            })
        else:
            return Response({
                'isValid': False,
                'message': _('Formato válido pero no encontrado en simulación'),
                'providerData': None,
                'note': _('Verificar manualmente en portal SUH del MinSalud')
            })
    
    def _mock_reps_validation(self, codigo_prestador):
        """Mock REPS validation logic for testing purposes."""
        valid_prefixes = ['11', '25', '76', '05', '13', '17', '19', '20', '23', '27', '41', '47', '50', '52', '54', '63', '66', '68', '70', '73', '81', '85', '86', '88', '91', '94', '95', '97', '99']
        prefix = codigo_prestador[:2]
        is_sequence = len(set(codigo_prestador)) <= 2
        return prefix in valid_prefixes and not is_sequence
    
    def _get_mock_provider_data(self, codigo_prestador):
        """Get mock provider data for testing."""
        prefix = codigo_prestador[:2]
        mock_data = {
            '11': {
                'nombre': 'IPS DEMO BOGOTÁ',
                'departamento': 'Bogotá D.C.',
                'municipio': 'Bogotá',
                'direccion': 'Calle 100 #15-20'
            },
            '25': {
                'nombre': 'CLÍNICA DEMO CUNDINAMARCA',
                'departamento': 'Cundinamarca',
                'municipio': 'Soacha',
                'direccion': 'Carrera 50 #25-30'
            },
        }
        return mock_data.get(prefix, {
            'nombre': f'IPS DEMO {prefix}',
            'departamento': 'Colombia',
            'municipio': 'Ciudad Demo',
            'direccion': 'Dirección Demo'
        })
    
    @action(detail=False, methods=['get'], url_path='services-catalog')
    def services_catalog(self, request):
        """
        Get health services catalog according to Resolución 3100/2019.
        
        Args:
            request: HTTP request
            
        Returns:
            Response: List of available health services
        """
        # Catálogo simplificado de servicios de salud según Res. 3100/2019
        catalog = [
            # CONSULTA EXTERNA
            {
                'codigo': '101',
                'nombre': 'Medicina General',
                'grupo': 'consulta_externa',
                'grupo_display': 'Consulta Externa',
                'complejidad_minima': 'I',
                'descripcion': 'Atención en medicina general'
            },
            {
                'codigo': '201',
                'nombre': 'Medicina Interna',
                'grupo': 'consulta_externa',
                'grupo_display': 'Consulta Externa',
                'complejidad_minima': 'II',
                'descripcion': 'Atención especializada en medicina interna'
            },
            {
                'codigo': '329',
                'nombre': 'Ortopedia y Traumatología',
                'grupo': 'consulta_externa',
                'grupo_display': 'Consulta Externa',
                'complejidad_minima': 'II',
                'descripcion': 'Atención especializada en ortopedia y traumatología'
            },
            # Additional services...
            {
                'codigo': '501',
                'nombre': 'Urgencias',
                'grupo': 'urgencias',
                'grupo_display': 'Urgencias',
                'complejidad_minima': 'I',
                'descripcion': 'Atención de urgencias médicas'
            },
        ]
        
        # Filter by group if requested
        grupo_filter = request.query_params.get('grupo')
        if grupo_filter:
            catalog = [s for s in catalog if s['grupo'] == grupo_filter]
        
        return Response({
            'services': catalog,
            'count': len(catalog),
            'note': _('Catálogo simplificado - Consultar Resolución 3100/2019 para lista completa')
        })
    
    @action(detail=False, methods=['get'], url_path='complexity-levels')
    def complexity_levels(self, request):
        """Get available complexity levels with descriptions."""
        levels = [
            {
                'code': 'I',
                'name': 'Nivel I - Baja Complejidad',
                'description': 'Atención básica, consulta externa, urgencias de baja complejidad',
            },
            {
                'code': 'II',
                'name': 'Nivel II - Mediana Complejidad',
                'description': 'Especialidades básicas, cirugía ambulatoria, hospitalización',
            },
            {
                'code': 'III',
                'name': 'Nivel III - Alta Complejidad',
                'description': 'Especialidades avanzadas, alta tecnología, UCI especializada',
            },
            {
                'code': 'IV',
                'name': 'Nivel IV - Máxima Complejidad',
                'description': 'Procedimientos de máxima complejidad, investigación, trasplantes',
            }
        ]
        
        return Response({
            'complexity_levels': levels,
            'count': len(levels)
        })


# =============================================================================
# Manual Health Organization Management
# =============================================================================

@action(detail=False, methods=['post'], url_path='manual-reps-entry')
def manual_reps_entry(request):
    """
    Manual entry of REPS data for health organizations.
    
    This endpoint allows manual entry of health organization data
    when automatic extraction from SUH portal is not available.
    
    Args:
        request: HTTP request with organization and REPS data
        
    Returns:
        Response: Result of manual data entry
    """
    return Response({
        'message': _('Entrada manual de datos REPS habilitada'),
        'instructions': _(
            'Complete los datos manualmente consultando el portal SUH: '
            'https://prestadores.minsalud.gov.co/habilitacion/'
        ),
        'required_data': [
            'codigo_prestador',
            'naturaleza_juridica', 
            'tipo_prestador',
            'nivel_complejidad',
            'representante_legal',
            'fecha_habilitacion'
        ]
    })


# ===========================================
# VIEWSETS PARA SEDES PRESTADORAS
# ===========================================

class SedeViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de sedes prestadoras.
    Incluye CRUD completo, importación, exportación y validación.
    """
    
    serializer_class = SedeSerializer
    permission_classes = [IsAuthenticated, CanViewOrganization]
    lookup_field = 'id'
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        'numero_sede', 'nombre_sede', 'direccion', 
        'departamento', 'municipio', 'email',
        'nombre_responsable'
    ]
    ordering_fields = [
        'numero_sede', 'nombre_sede', 'departamento', 
        'municipio', 'estado', 'created_at'
    ]
    ordering = ['numero_sede']
    
    def get_queryset(self):
        """Filtrar sedes por organización del usuario"""
        # Obtener org_id de la URL o del query params
        org_id = self.kwargs.get('org_id') or self.request.query_params.get('organization_id')
        
        if org_id:
            return SedePrestadora.objects.filter(
                health_organization__organization_id=org_id,
                deleted_at__isnull=True
            ).select_related(
                'health_organization__organization'
            ).prefetch_related(
                'sede_servicios__servicio'
            )
        
        # Si no hay org_id, filtrar por organizaciones accesibles al usuario
        return SedePrestadora.objects.filter(
            deleted_at__isnull=True
        ).select_related(
            'health_organization__organization'
        ).prefetch_related(
            'sede_servicios__servicio'
        )
    
    def get_serializer_class(self):
        """Choose serializer based on action"""
        if self.action == 'list':
            return SedeListSerializer
        elif self.action == 'create':
            return SedeCreateSerializer
        elif self.action in ['import_sedes', 'validate_import']:
            return SedeImportSerializer
        elif self.action == 'validate_sede':
            return SedeValidationSerializer
        elif self.action == 'bulk_create':
            return SedeBulkSerializer
        return SedeSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, CanUpdateOrganization]
        elif self.action in ['import_sedes', 'bulk_create', 'bulk_update', 'bulk_delete']:
            permission_classes = [IsAuthenticated, CanUpdateOrganization]
        else:
            permission_classes = [IsAuthenticated, CanViewOrganization]
        
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """Custom create method with debug logging"""
        logger.info(f"SedeViewSet.create called with data: {request.data}")
        try:
            response = super().create(request, *args, **kwargs)
            logger.info(f"SedeViewSet.create successful: {response.data}")
            return response
        except Exception as e:
            logger.error(f"SedeViewSet.create error: {str(e)}")
            logger.error(f"Request data: {request.data}")
            raise

    def perform_create(self, serializer):
        """Override create to set audit context"""
        set_audit_context(user=self.request.user, request=self.request)
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Override update to set audit context"""
        set_audit_context(user=self.request.user, request=self.request)
        serializer.save(updated_by=self.request.user)
    
    def perform_destroy(self, instance):
        """Override delete to implement soft delete"""
        set_audit_context(user=self.request.user, request=self.request)
        instance.delete(deleted_by=self.request.user)
    
    @action(detail=False, methods=['post'], url_path='import')
    @transaction.atomic
    def import_sedes(self, request, org_id=None):
        """
        Importar sedes desde archivo CSV/Excel.
        Soporta validación previa y mapeo de campos.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file = serializer.validated_data['file']
        format_type = serializer.validated_data['format']
        validate_only = serializer.validated_data.get('validate_only', False)
        mapping = serializer.validated_data.get('mapping')
        overwrite_existing = serializer.validated_data.get('overwrite_existing', False)
        
        try:
            # Por ahora retornar respuesta básica hasta implementar los servicios
            return Response({
                'message': _('Funcionalidad de importación será implementada próximamente'),
                'file_received': True,
                'format': format_type,
                'validate_only': validate_only
            })
            
        except Exception as e:
            logger.error(f"Error importing sedes: {str(e)}")
            return Response({
                'success': False,
                'message': _('Error en la importación'),
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='export')
    def export_sedes(self, request, org_id=None):
        """
        Exportar sedes a CSV/Excel.
        """
        format_type = request.query_params.get('format', 'csv')
        include_services = request.query_params.get('include_services', 'false') == 'true'
        
        if format_type not in ['csv', 'excel']:
            return Response({
                'error': _('Formato no válido. Use "csv" o "excel"')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            import csv
            import io
            
            # Obtener la organización
            organization = get_object_or_404(Organization, id=org_id)
            
            # Obtener todas las sedes de la organización
            sedes = SedePrestadora.objects.filter(
                organization=organization
            ).order_by('numero_sede')
            
            if format_type == 'csv':
                # Crear respuesta CSV
                response = HttpResponse(content_type='text/csv; charset=utf-8')
                response['Content-Disposition'] = f'attachment; filename="sedes_{organization.name}_{timezone.now().strftime("%Y%m%d")}.csv"'
                
                writer = csv.writer(response)
                
                # Headers
                headers = [
                    'Número de Sede',
                    'Código Prestador', 
                    'Nombre de la Sede',
                    'Tipo de Sede',
                    'Es Sede Principal',
                    'Estado',
                    'Departamento',
                    'Municipio', 
                    'Dirección',
                    'Barrio',
                    'Tipo de Zona',
                    'Teléfono',
                    'Email',
                    'Responsable',
                    'Cargo Responsable',
                    'Teléfono Responsable',
                    'Capacidad Camas',
                    'Capacidad Consultorios', 
                    'Capacidad Quirófanos',
                    'Atención 24 Horas',
                    'Fecha de Creación'
                ]
                writer.writerow(headers)
                
                # Datos
                for sede in sedes:
                    row = [
                        sede.numero_sede,
                        sede.codigo_prestador,
                        sede.nombre_sede,
                        sede.get_tipo_sede_display() if hasattr(sede, 'get_tipo_sede_display') else sede.tipo_sede,
                        'Sí' if sede.es_sede_principal else 'No',
                        sede.get_estado_display() if hasattr(sede, 'get_estado_display') else sede.estado,
                        sede.departamento,
                        sede.municipio,
                        sede.direccion,
                        sede.barrio or '',
                        sede.tipo_zona,
                        sede.telefono or '',
                        sede.email or '',
                        sede.nombre_responsable or '',
                        sede.cargo_responsable or '',
                        sede.telefono_responsable or '',
                        sede.capacidad_camas or 0,
                        sede.capacidad_consultorios or 0,
                        sede.capacidad_quirofanos or 0,
                        'Sí' if sede.atencion_24_horas else 'No',
                        sede.created_at.strftime('%Y-%m-%d %H:%M:%S') if sede.created_at else ''
                    ]
                    writer.writerow(row)
                
                return response
                
            else:  # format_type == 'excel'
                # Para Excel necesitaríamos openpyxl, por ahora retornar mensaje
                return Response({
                    'message': _('La exportación a Excel requiere instalación adicional. Use CSV por ahora.'),
                    'format': format_type,
                    'available_formats': ['csv']
                }, status=status.HTTP_501_NOT_IMPLEMENTED)
            
        except Exception as e:
            logger.error(f"Error exporting sedes: {str(e)}")
            return Response({
                'error': _('Error en la exportación'),
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='validate')
    def validate_sede(self, request, org_id=None):
        """
        Validar datos de una sede sin guardarla.
        """
        # Agregar organization context
        data = request.data.copy()
        if org_id:
            try:
                health_org = HealthOrganization.objects.get(organization_id=org_id)
                data['health_organization'] = health_org.id
            except HealthOrganization.DoesNotExist:
                return Response({
                    'error': _('Organización de salud no encontrada')
                }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SedeValidationSerializer(
            data=data, 
            context={'request': request, 'org_id': org_id}
        )
        
        try:
            serializer.is_valid(raise_exception=True)
            return Response({
                'is_valid': True,
                'data': serializer.validated_data,
                'message': _('Datos válidos')
            })
        except serializers.ValidationError as e:
            return Response({
                'is_valid': False,
                'errors': e.detail,
                'message': _('Datos inválidos')
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='bulk-create')
    @transaction.atomic
    def bulk_create(self, request, org_id=None):
        """
        Crear múltiples sedes en una sola operación.
        """
        serializer = SedeBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        sedes_data = serializer.validated_data['sedes']
        
        # Agregar health_organization a cada sede
        if org_id:
            try:
                health_org = HealthOrganization.objects.get(organization_id=org_id)
                for sede_data in sedes_data:
                    sede_data['health_organization'] = health_org.id
            except HealthOrganization.DoesNotExist:
                return Response({
                    'error': _('Organización de salud no encontrada')
                }, status=status.HTTP_404_NOT_FOUND)
        
        created_sedes = []
        errors = []
        
        for idx, sede_data in enumerate(sedes_data):
            try:
                sede_serializer = SedeCreateSerializer(data=sede_data)
                if sede_serializer.is_valid():
                    sede = sede_serializer.save(created_by=request.user)
                    created_sedes.append(sede)
                else:
                    errors.append({
                        'index': idx,
                        'numero_sede': sede_data.get('numero_sede'),
                        'errors': sede_serializer.errors
                    })
            except Exception as e:
                errors.append({
                    'index': idx,
                    'numero_sede': sede_data.get('numero_sede'),
                    'errors': {'general': [str(e)]}
                })
        
        if errors:
            # Si hay errores, hacer rollback
            transaction.set_rollback(True)
            return Response({
                'success': False,
                'message': _('Error en la creación masiva'),
                'errors': errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'created_count': len(created_sedes),
            'sedes': SedeListSerializer(created_sedes, many=True).data
        }, status=status.HTTP_201_CREATED)


# Simplified Wizard ViewSets
class OrganizationWizardViewSet(viewsets.ModelViewSet):
    """
    Simplified ViewSet for organization wizard operations.
    
    This ViewSet handles the simplified wizard flow with only basic
    organization creation, excluding health-specific functionality.
    """
    
    queryset = Organization.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer for action."""
        if self.action == 'create':
            return OrganizationWizardCreateSerializer
        return OrganizationWizardSerializer
    
    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action == 'create':
            permission_classes = [IsAuthenticated, CanCreateOrganization]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, CanUpdateOrganization]
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated, CanDeleteOrganization]
        else:
            permission_classes = [IsAuthenticated, CanViewOrganization]
        
        return [permission() for permission in permission_classes]
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create organization through simplified wizard."""
        try:
            # Import service
            from .services.organization_service import OrganizationService
            
            # Extract logo file if present
            logo_file = request.FILES.get('logo')
            
            # Create organization using service
            organization = OrganizationService.create_organization(
                user=request.user,
                form_data=request.data,
                logo_file=logo_file
            )
            
            # Set audit context
            set_audit_context(request.user, request)
            
            # Return serialized organization
            serializer = self.get_serializer(organization)
            return Response(
                {
                    'success': True,
                    'message': _('Organización creada exitosamente'),
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
            
        except ValidationError as e:
            logger.error(f'Validation error creating organization: {e}')
            return Response(
                {
                    'success': False,
                    'message': _('Error de validación'),
                    'errors': e.message_dict if hasattr(e, 'message_dict') else {'detail': str(e)}
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f'Error creating organization: {str(e)}')
            return Response(
                {
                    'success': False,
                    'message': _('Error interno del servidor'),
                    'errors': {'detail': str(e)}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """Update organization through simplified wizard."""
        try:
            # Import service
            from .services.organization_service import OrganizationService
            
            # Get organization instance
            organization = self.get_object()
            
            # Extract logo file if present
            logo_file = request.FILES.get('logo')
            
            # Update organization using service
            updated_organization = OrganizationService.update_organization(
                organization=organization,
                user=request.user,
                form_data=request.data,
                logo_file=logo_file
            )
            
            # Set audit context
            set_audit_context(request.user, request)
            
            # Return serialized organization
            serializer = self.get_serializer(updated_organization)
            return Response(
                {
                    'success': True,
                    'message': _('Organización actualizada exitosamente'),
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except ValidationError as e:
            logger.error(f'Validation error updating organization: {e}')
            return Response(
                {
                    'success': False,
                    'message': _('Error de validación'),
                    'errors': e.message_dict if hasattr(e, 'message_dict') else {'detail': str(e)}
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f'Error updating organization: {str(e)}')
            return Response(
                {
                    'success': False,
                    'message': _('Error interno del servidor'),
                    'errors': {'detail': str(e)}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def validate_nit(self, request):
        """Validate NIT availability and format."""
        try:
            nit = request.data.get('nit')
            if not nit:
                return Response(
                    {
                        'success': False,
                        'message': _('NIT es requerido'),
                        'errors': {'nit': 'NIT es requerido'}
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Import service
            from .services.organization_service import OrganizationService
            
            # Validate NIT availability using service
            validation_result = OrganizationService.validate_nit(nit)
            
            return Response(
                {
                    'success': True,
                    'data': {
                        'nit': nit,
                        'is_available': validation_result['is_available'],
                        'message': validation_result['message']
                    }
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f'Error validating NIT: {str(e)}')
            return Response(
                {
                    'success': False,
                    'message': _('Error interno del servidor'),
                    'errors': {'detail': str(e)}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get organization summary for display purposes."""
        try:
            organization = self.get_object()
            
            # Import service
            from .services.organization_service import OrganizationService
            
            # Get summary
            summary_data = OrganizationService.get_organization_summary(organization)
            
            return Response(
                {
                    'success': True,
                    'data': summary_data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f'Error getting organization summary: {str(e)}')
            return Response(
                {
                    'success': False,
                    'message': _('Error interno del servidor'),
                    'errors': {'detail': str(e)}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DivipolaViewSet(viewsets.ViewSet):
    """
    ViewSet for DIVIPOLA data (Colombian administrative divisions).
    
    Provides read-only access to departments and municipalities data
    for use in location forms and wizards.
    """
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def departments(self, request):
        """Get list of all Colombian departments."""
        try:
            from .services.divipola_service import DivipolaService
            from .serializers import DepartmentSerializer
            
            departments = DivipolaService.get_departments()
            serializer = DepartmentSerializer(departments, many=True)
            
            return Response(
                {
                    'success': True,
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f'Error getting departments: {str(e)}')
            return Response(
                {
                    'success': False,
                    'message': _('Error interno del servidor'),
                    'errors': {'detail': str(e)}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='municipalities/(?P<department_code>[^/.]+)')
    def municipalities_by_department(self, request, department_code=None):
        """Get municipalities for a specific department."""
        try:
            from .services.divipola_service import DivipolaService
            from .serializers import MunicipalitySerializer
            
            municipalities = DivipolaService.get_municipalities(department_code)
            serializer = MunicipalitySerializer(municipalities, many=True)
            
            return Response(
                {
                    'success': True,
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f'Error getting municipalities: {str(e)}')
            return Response(
                {
                    'success': False,
                    'message': _('Error interno del servidor'),
                    'errors': {'detail': str(e)}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def search_municipalities(self, request):
        """Search municipalities by name."""
        try:
            from .services.divipola_service import DivipolaService
            from .serializers import MunicipalitySerializer
            
            query = request.query_params.get('q', '')
            department_code = request.query_params.get('department', None)
            
            if not query:
                return Response(
                    {
                        'success': False,
                        'message': _('Parámetro de búsqueda requerido'),
                        'errors': {'q': 'Parámetro q es requerido'}
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            municipalities = DivipolaService.search_municipalities(query, department_code)
            serializer = MunicipalitySerializer(municipalities, many=True)
            
            return Response(
                {
                    'success': True,
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f'Error searching municipalities: {str(e)}')
            return Response(
                {
                    'success': False,
                    'message': _('Error interno del servidor'),
                    'errors': {'detail': str(e)}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def major_cities(self, request):
        """Get list of major Colombian cities."""
        try:
            from .services.divipola_service import DivipolaService
            from .serializers import MunicipalitySerializer
            
            cities = DivipolaService.get_major_cities()
            serializer = MunicipalitySerializer(cities, many=True)
            
            return Response(
                {
                    'success': True,
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f'Error getting major cities: {str(e)}')
            return Response(
                {
                    'success': False,
                    'message': _('Error interno del servidor'),
                    'errors': {'detail': str(e)}
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================================================
# SOGCS VIEWS SECTION
# ============================================================================

class HeadquarterLocationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing healthcare facility headquarters."""
    
    queryset = HeadquarterLocation.objects.all()
    permission_classes = [IsAuthenticated, CanViewOrganization]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    def get_serializer_class(self):
        """Return basic serializer."""
        from rest_framework import serializers
        
        class BasicHeadquarterLocationSerializer(serializers.ModelSerializer):
            class Meta:
                model = HeadquarterLocation
                fields = '__all__'
        
        return BasicHeadquarterLocationSerializer
    
    def get_queryset(self):
        """Filter queryset."""
        queryset = super().get_queryset()
        queryset = queryset.filter(deleted_at__isnull=True)
        return queryset


class EnabledHealthServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing enabled health services."""
    
    queryset = EnabledHealthService.objects.all()
    permission_classes = [IsAuthenticated, CanViewOrganization]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    def get_serializer_class(self):
        """Return basic serializer."""
        from rest_framework import serializers
        
        class BasicEnabledHealthServiceSerializer(serializers.ModelSerializer):
            class Meta:
                model = EnabledHealthService
                fields = '__all__'
        
        return BasicEnabledHealthServiceSerializer
    
    def get_queryset(self):
        """Filter queryset."""
        queryset = super().get_queryset()
        queryset = queryset.filter(deleted_at__isnull=True)
        return queryset


class ServiceHabilitationProcessViewSet(viewsets.ModelViewSet):
    """ViewSet for managing service habilitation processes."""
    
    queryset = ServiceHabilitationProcess.objects.all()
    permission_classes = [IsAuthenticated, CanViewOrganization]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    def get_serializer_class(self):
        """Return basic serializer."""
        from rest_framework import serializers
        
        class BasicServiceHabilitationProcessSerializer(serializers.ModelSerializer):
            class Meta:
                model = ServiceHabilitationProcess
                fields = '__all__'
        
        return BasicServiceHabilitationProcessSerializer
    
    def get_queryset(self):
        """Filter queryset."""
        queryset = super().get_queryset()
        queryset = queryset.filter(deleted_at__isnull=True)
        return queryset

