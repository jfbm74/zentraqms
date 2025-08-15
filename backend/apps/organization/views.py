"""
Views for Organization module in ZentraQMS.

This module contains ViewSets and API views for Organization and Location models,
providing REST API endpoints for organization management.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.authorization.drf_permissions import (
    CanViewOrganization,
    CanCreateOrganization,
    CanUpdateOrganization,
    CanDeleteOrganization,
)
from .models import Organization, Location, SectorTemplate, AuditLog, HealthOrganization, HealthService
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
)


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
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='validate-reps')
    def validate_reps(self, request):
        """
        Validate a provider code against REPS (mock implementation).
        
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
                    'providerData': None
                },
                status=status.HTTP_200_OK
            )
        
        # Mock validation - Simular consulta a REPS
        # En producción, aquí se haría la consulta real al API de REPS del MinSalud
        is_valid = self._mock_reps_validation(codigo_prestador)
        
        if is_valid:
            provider_data = self._get_mock_provider_data(codigo_prestador)
            
            return Response({
                'isValid': True,
                'message': _('Código válido en REPS'),
                'providerData': provider_data,
                'lastValidated': timezone.now().isoformat()
            })
        else:
            return Response({
                'isValid': False,
                'message': _('Código no encontrado en REPS'),
                'providerData': None
            })
    
    def _mock_reps_validation(self, codigo_prestador):
        """
        Mock REPS validation logic.
        
        Args:
            codigo_prestador (str): Provider code to validate
            
        Returns:
            bool: True if code is considered valid
        """
        # Simular validación - códigos que empiecen con ciertos números son válidos
        valid_prefixes = ['11', '25', '76', '05', '13', '17', '19', '20', '23', '27', '41', '47', '50', '52', '54', '63', '66', '68', '70', '73', '81', '85', '86', '88', '91', '94', '95', '97', '99']
        prefix = codigo_prestador[:2]
        
        # También validar que no sea una secuencia obvia como 111111111111
        is_sequence = len(set(codigo_prestador)) <= 2
        
        return prefix in valid_prefixes and not is_sequence
    
    def _get_mock_provider_data(self, codigo_prestador):
        """
        Get mock provider data for testing.
        
        Args:
            codigo_prestador (str): Provider code
            
        Returns:
            dict: Mock provider data
        """
        # Mapear códigos a datos mock
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
            '76': {
                'nombre': 'HOSPITAL DEMO VALLE',
                'departamento': 'Valle del Cauca',
                'municipio': 'Cali',
                'direccion': 'Avenida 6N #23-45'
            },
            '05': {
                'nombre': 'CENTRO MÉDICO DEMO ANTIOQUIA',
                'departamento': 'Antioquia',
                'municipio': 'Medellín',
                'direccion': 'Carrera 70 #52-21'
            }
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
            {
                'codigo': '338',
                'nombre': 'Fisiatría',
                'grupo': 'consulta_externa',
                'grupo_display': 'Consulta Externa',
                'complejidad_minima': 'II',
                'descripcion': 'Medicina física y rehabilitación'
            },
            {
                'codigo': '344',
                'nombre': 'Fisioterapia',
                'grupo': 'consulta_externa',
                'grupo_display': 'Consulta Externa',
                'complejidad_minima': 'I',
                'descripcion': 'Terapia física y rehabilitación'
            },
            
            # QUIRÚRGICOS
            {
                'codigo': '301',
                'nombre': 'Cirugía Ortopédica',
                'grupo': 'quirurgicos',
                'grupo_display': 'Quirúrgicos',
                'complejidad_minima': 'II',
                'descripcion': 'Cirugía especializada en sistema musculoesquelético'
            },
            {
                'codigo': '304',
                'nombre': 'Cirugía de la Mano',
                'grupo': 'quirurgicos',
                'grupo_display': 'Quirúrgicos',
                'complejidad_minima': 'III',
                'descripcion': 'Cirugía especializada de la mano'
            },
            {
                'codigo': '310',
                'nombre': 'Cirugía General',
                'grupo': 'quirurgicos',
                'grupo_display': 'Quirúrgicos',
                'complejidad_minima': 'II',
                'descripcion': 'Cirugía general básica'
            },
            
            # APOYO DIAGNÓSTICO
            {
                'codigo': '706',
                'nombre': 'Radiología e Imágenes Diagnósticas',
                'grupo': 'apoyo_diagnostico',
                'grupo_display': 'Apoyo Diagnóstico',
                'complejidad_minima': 'I',
                'descripcion': 'Servicios de radiología e imágenes diagnósticas'
            },
            {
                'codigo': '712',
                'nombre': 'Toma de Muestras de Laboratorio Clínico',
                'grupo': 'apoyo_diagnostico',
                'grupo_display': 'Apoyo Diagnóstico',
                'complejidad_minima': 'I',
                'descripcion': 'Toma de muestras para análisis de laboratorio'
            },
            {
                'codigo': '728',
                'nombre': 'Laboratorio Clínico',
                'grupo': 'apoyo_diagnostico',
                'grupo_display': 'Apoyo Diagnóstico',
                'complejidad_minima': 'I',
                'descripcion': 'Análisis de laboratorio clínico'
            },
            
            # INTERNACIÓN
            {
                'codigo': '101',
                'nombre': 'Hospitalización General Adultos',
                'grupo': 'internacion',
                'grupo_display': 'Internación',
                'complejidad_minima': 'I',
                'descripcion': 'Hospitalización general para adultos'
            },
            {
                'codigo': '102',
                'nombre': 'Hospitalización General Pediátrica',
                'grupo': 'internacion',
                'grupo_display': 'Internación',
                'complejidad_minima': 'II',
                'descripcion': 'Hospitalización general pediátrica'
            },
            {
                'codigo': '120',
                'nombre': 'Cuidado Intermedio Adultos',
                'grupo': 'internacion',
                'grupo_display': 'Internación',
                'complejidad_minima': 'II',
                'descripcion': 'Unidad de cuidado intermedio para adultos'
            },
            
            # URGENCIAS
            {
                'codigo': '501',
                'nombre': 'Urgencias',
                'grupo': 'urgencias',
                'grupo_display': 'Urgencias',
                'complejidad_minima': 'I',
                'descripcion': 'Atención de urgencias médicas'
            },
            {
                'codigo': '502',
                'nombre': 'Observación',
                'grupo': 'urgencias',
                'grupo_display': 'Urgencias',
                'complejidad_minima': 'I',
                'descripcion': 'Observación médica en urgencias'
            },
            
            # CUIDADOS INTENSIVOS
            {
                'codigo': '312',
                'nombre': 'UCI Adultos',
                'grupo': 'cuidados_intensivos',
                'grupo_display': 'Cuidados Intensivos',
                'complejidad_minima': 'III',
                'descripcion': 'Unidad de cuidados intensivos para adultos'
            },
            {
                'codigo': '314',
                'nombre': 'UCI Pediátrica',
                'grupo': 'cuidados_intensivos',
                'grupo_display': 'Cuidados Intensivos',
                'complejidad_minima': 'III',
                'descripcion': 'Unidad de cuidados intensivos pediátrica'
            }
        ]
        
        # Filtrar por grupo si se solicita
        grupo_filter = request.query_params.get('grupo')
        if grupo_filter:
            catalog = [s for s in catalog if s['grupo'] == grupo_filter]
        
        # Filtrar por nivel de complejidad si se solicita
        complejidad_filter = request.query_params.get('complejidad')
        if complejidad_filter:
            # Mapear niveles de complejidad a números para comparación
            complejidad_map = {'I': 1, 'II': 2, 'III': 3, 'IV': 4}
            nivel_solicitado = complejidad_map.get(complejidad_filter, 0)
            catalog = [
                s for s in catalog 
                if complejidad_map.get(s['complejidad_minima'], 0) <= nivel_solicitado
            ]
        
        # Obtener grupos únicos para metadata
        grupos = list(set([s['grupo'] for s in catalog]))
        grupos_display = list(set([(s['grupo'], s['grupo_display']) for s in catalog]))
        
        return Response({
            'services': catalog,
            'count': len(catalog),
            'grupos': grupos,
            'grupos_display': dict(grupos_display),
            'filters_applied': {
                'grupo': grupo_filter,
                'complejidad': complejidad_filter
            }
        })
    
    @action(detail=False, methods=['post'], url_path='validate-services')
    def validate_services(self, request):
        """
        Validate services coherence with complexity level.
        
        Args:
            request: HTTP request with services and nivel_complejidad
            
        Returns:
            Response: Validation result
        """
        services = request.data.get('services', [])
        nivel_complejidad = request.data.get('nivel_complejidad')
        
        if not services or not nivel_complejidad:
            return Response(
                {'error': _('Los servicios y nivel de complejidad son requeridos.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mapear niveles de complejidad
        complejidad_map = {'I': 1, 'II': 2, 'III': 3, 'IV': 4}
        nivel_organizacion = complejidad_map.get(nivel_complejidad, 0)
        
        if not nivel_organizacion:
            return Response(
                {'error': _('Nivel de complejidad inválido.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener catálogo de servicios
        catalog_response = self.services_catalog(request)
        catalog = catalog_response.data['services']
        
        # Crear diccionario de servicios por código
        services_dict = {s['codigo']: s for s in catalog}
        
        validation_results = []
        valid_count = 0
        invalid_count = 0
        
        for service in services:
            codigo_servicio = service.get('codigo_servicio')
            service_info = services_dict.get(codigo_servicio)
            
            if not service_info:
                validation_results.append({
                    'codigo_servicio': codigo_servicio,
                    'nombre_servicio': service.get('nombre_servicio', 'Desconocido'),
                    'is_valid': False,
                    'reason': _('Servicio no encontrado en catálogo')
                })
                invalid_count += 1
                continue
            
            # Validar nivel de complejidad
            complejidad_minima = complejidad_map.get(service_info['complejidad_minima'], 0)
            
            if nivel_organizacion >= complejidad_minima:
                validation_results.append({
                    'codigo_servicio': codigo_servicio,
                    'nombre_servicio': service_info['nombre'],
                    'is_valid': True,
                    'reason': _('Servicio compatible con nivel de complejidad')
                })
                valid_count += 1
            else:
                validation_results.append({
                    'codigo_servicio': codigo_servicio,
                    'nombre_servicio': service_info['nombre'],
                    'is_valid': False,
                    'reason': _(
                        'Servicio requiere nivel {} pero organización es nivel {}'
                    ).format(service_info['complejidad_minima'], nivel_complejidad)
                })
                invalid_count += 1
        
        return Response({
            'validation_results': validation_results,
            'summary': {
                'total_services': len(services),
                'valid_services': valid_count,
                'invalid_services': invalid_count,
                'organization_level': nivel_complejidad,
                'overall_valid': invalid_count == 0
            }
        })
    
    @action(detail=False, methods=['get'], url_path='complexity-levels')
    def complexity_levels(self, request):
        """
        Get available complexity levels with descriptions.
        
        Args:
            request: HTTP request
            
        Returns:
            Response: List of complexity levels
        """
        levels = [
            {
                'code': 'I',
                'name': 'Nivel I - Baja Complejidad',
                'description': 'Atención básica, consulta externa, urgencias de baja complejidad',
                'services_allowed': ['Medicina General', 'Urgencias', 'Hospitalización básica']
            },
            {
                'code': 'II',
                'name': 'Nivel II - Mediana Complejidad',
                'description': 'Especialidades básicas, cirugía ambulatoria, hospitalización',
                'services_allowed': ['Especialidades médicas', 'Cirugía general', 'UCI básica']
            },
            {
                'code': 'III',
                'name': 'Nivel III - Alta Complejidad',
                'description': 'Especialidades avanzadas, alta tecnología, UCI especializada',
                'services_allowed': ['Cirugías complejas', 'UCI especializada', 'Sub-especialidades']
            },
            {
                'code': 'IV',
                'name': 'Nivel IV - Máxima Complejidad',
                'description': 'Procedimientos de máxima complejidad, investigación, trasplantes',
                'services_allowed': ['Trasplantes', 'Cirugía cardiovascular', 'Neurocirugia compleja']
            }
        ]
        
        return Response({
            'complexity_levels': levels,
            'count': len(levels)
        })
