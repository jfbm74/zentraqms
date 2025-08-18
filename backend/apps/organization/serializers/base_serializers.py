"""
Serializers for Organization module in ZentraQMS.

This module contains DRF serializers for Organization and Location models,
providing API serialization and validation.
"""

from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from ..models import Organization, Location, SectorTemplate, AuditLog, HealthOrganization, HealthService, SedePrestadora, SedeServicio


class LocationSerializer(serializers.ModelSerializer):
    """
    Serializer for Location model.

    Handles serialization and validation of location/sede data,
    including address information and contact details.
    """

    direccion_completa = serializers.ReadOnlyField()

    class Meta:
        model = Location
        fields = [
            "id",
            "organization",
            "nombre",
            "tipo_sede",
            "es_principal",
            "direccion",
            "ciudad",
            "departamento",
            "pais",
            "codigo_postal",
            "direccion_completa",
            "telefono",
            "email",
            "area_m2",
            "capacidad_personas",
            "fecha_apertura",
            "horario_atencion",
            "responsable_nombre",
            "responsable_cargo",
            "responsable_telefono",
            "responsable_email",
            "observaciones",
            "is_active",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "direccion_completa",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def validate(self, attrs):
        """
        Validate location data.

        Args:
            attrs (dict): Attributes to validate

        Returns:
            dict: Validated attributes

        Raises:
            ValidationError: If validation fails
        """
        # Validar que solo haya una sede principal por organización
        if attrs.get("es_principal", False):
            organization = attrs.get("organization")
            if organization:
                existing_main = Location.objects.filter(
                    organization=organization, es_principal=True
                )

                # Si estamos actualizando, excluir la instancia actual
                if self.instance:
                    existing_main = existing_main.exclude(pk=self.instance.pk)

                if existing_main.exists():
                    raise serializers.ValidationError(
                        {
                            "es_principal": _(
                                "Ya existe una sede principal para esta organización."
                            )
                        }
                    )

        return attrs


class LocationCreateSerializer(LocationSerializer):
    """
    Serializer for creating new locations.

    Excludes the organization field since it will be set automatically
    based on the current user's organization context.
    """

    class Meta(LocationSerializer.Meta):
        fields = [
            field for field in LocationSerializer.Meta.fields if field != "organization"
        ]


class LocationListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for location listings.

    Provides only essential fields for list views and dropdowns.
    """

    direccion_completa = serializers.ReadOnlyField()
    organization = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = [
            "id",
            "organization",
            "nombre",
            "tipo_sede",
            "es_principal",
            "ciudad",
            "departamento",
            "direccion_completa",
            "telefono",
            "email",
            "is_active",
        ]

    def get_organization(self, obj):
        """Get organization data."""
        return {
            "id": obj.organization.id,
            "razon_social": obj.organization.razon_social,
            "nombre_comercial": obj.organization.nombre_comercial,
        }


class OrganizationSerializer(serializers.ModelSerializer):
    """
    Complete serializer for Organization model.

    Handles serialization and validation of organization data including
    legal information, classification, and contact details.
    """

    nit_completo = serializers.ReadOnlyField()
    locations = LocationListSerializer(many=True, read_only=True)
    sede_principal = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id",
            "razon_social",
            "nombre_comercial",
            "nit",
            "digito_verificacion",
            "nit_completo",
            "tipo_organizacion",
            "sector_economico",
            "tamaño_empresa",
            "fecha_fundacion",
            "logo",
            "descripcion",
            "website",
            "email_contacto",
            "telefono_principal",
            "locations",
            "sede_principal",
            "is_active",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "nit_completo",
            "locations",
            "sede_principal",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def get_sede_principal(self, obj):
        """
        Get the main location for the organization.

        Args:
            obj (Organization): Organization instance

        Returns:
            dict or None: Main location data or None if no main location
        """
        main_location = obj.locations.filter(es_principal=True).first()
        if main_location:
            return LocationListSerializer(main_location).data
        return None

    def validate_nit(self, value):
        """
        Validate NIT format and uniqueness.

        Args:
            value (str): NIT value to validate

        Returns:
            str: Validated NIT

        Raises:
            ValidationError: If NIT is invalid
        """
        # Limpiar el NIT de caracteres no numéricos excepto guión
        nit_limpio = "".join(filter(lambda x: x.isdigit() or x == "-", value))

        # Remover guión si existe para validación
        nit_solo_numeros = nit_limpio.replace("-", "")

        # Validar longitud
        if len(nit_solo_numeros) < 9 or len(nit_solo_numeros) > 10:
            raise serializers.ValidationError(_("NIT debe tener entre 9 y 10 dígitos."))

        # Retornar solo los números sin el dígito de verificación
        return nit_solo_numeros

    def validate_digito_verificacion(self, value):
        """
        Validate verification digit format.

        Args:
            value (str): Verification digit to validate

        Returns:
            str: Validated verification digit

        Raises:
            ValidationError: If digit is invalid
        """
        if not value.isdigit() or len(value) != 1:
            raise serializers.ValidationError(
                _("Dígito de verificación debe ser un solo número del 0 al 9.")
            )

        return value

    def validate(self, attrs):
        """
        Validate organization data with basic format validation.

        Args:
            attrs (dict): Attributes to validate

        Returns:
            dict: Validated attributes

        Raises:
            ValidationError: If validation fails
        """
        nit = attrs.get("nit")
        digito_verificacion = attrs.get("digito_verificacion")

        # Basic format validation only - removed auto-calculation
        if nit and digito_verificacion:
            # Simply ensure both fields are present and formatted correctly
            # Actual verification digit validation is now manual
            pass

        return attrs


class OrganizationCreateSerializer(OrganizationSerializer):
    """
    Serializer for creating new organizations.

    Includes additional validation for organization creation
    and excludes certain read-only fields.
    """

    class Meta(OrganizationSerializer.Meta):
        fields = [
            "razon_social",
            "nombre_comercial",
            "nit",
            "digito_verificacion",
            "tipo_organizacion",
            "sector_economico",
            "tamaño_empresa",
            "fecha_fundacion",
            "logo",
            "descripcion",
            "website",
            "email_contacto",
            "telefono_principal",
        ]

    def create(self, validated_data):
        """
        Create organization and set audit fields.

        Args:
            validated_data (dict): Validated data for organization

        Returns:
            Organization: Created organization instance
        """
        # Agregar usuario que crea la organización
        user = self.context["request"].user
        validated_data["created_by"] = user
        validated_data["updated_by"] = user

        return super().create(validated_data)


class OrganizationListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for organization listings.

    Provides only essential fields for list views and dropdowns.
    """

    nit_completo = serializers.ReadOnlyField()

    class Meta:
        model = Organization
        fields = [
            "id",
            "razon_social",
            "nombre_comercial",
            "nit",
            "digito_verificacion",
            "nit_completo",
            "tipo_organizacion",
            "sector_economico",
            "is_active",
        ]


class OrganizationWizardStep1Serializer(serializers.ModelSerializer):
    """
    Serializer specifically for Organization Wizard Step 1.

    Handles only the fields required for the first step of the
    organization configuration wizard.
    """

    nit_completo = serializers.ReadOnlyField()
    # Removed auto-calculation field as requested by user

    class Meta:
        model = Organization
        fields = [
            "id",
            "razon_social",
            "nombre_comercial",
            "nit",
            "digito_verificacion",
            "nit_completo",
            "tipo_organizacion",
            "sector_economico",
            "tamaño_empresa",
            "telefono_principal",
            "email_contacto",
        ]
        read_only_fields = [
            "id",
            "nit_completo",
        ]

    # Removed auto-calculation method as requested by user

    def validate(self, attrs):
        """
        Validate organization data for wizard step 1.

        Args:
            attrs (dict): Attributes to validate

        Returns:
            dict: Validated attributes
        """
        # Validar campos obligatorios para el paso 1
        required_fields = [
            "razon_social",
            "nit",
            "digito_verificacion",
            "tipo_organizacion",
            "sector_economico",
        ]

        for field in required_fields:
            if not attrs.get(field):
                raise serializers.ValidationError(
                    {field: _("Este campo es obligatorio para el paso 1.")}
                )

        # Basic validation only - removed auto-calculation as requested
        nit = attrs.get("nit")
        digito_verificacion = attrs.get("digito_verificacion")

        if nit and digito_verificacion:
            # Manual verification digit input - no auto-validation
            pass

        return attrs


class LocationWizardStep1Serializer(serializers.ModelSerializer):
    """
    Serializer specifically for Location in Organization Wizard Step 1.

    Handles only the fields required for creating the main location
    in the first step of the organization configuration wizard.
    """

    class Meta:
        model = Location
        fields = [
            "id",
            "nombre",
            "direccion",
            "ciudad",
            "departamento",
            "pais",
            "telefono",
            "email",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        """
        Validate location data for wizard step 1.

        Args:
            attrs (dict): Attributes to validate

        Returns:
            dict: Validated attributes
        """
        # Validar campos obligatorios para sede principal
        required_fields = ["nombre", "direccion", "municipio", "departamento"]

        for field in required_fields:
            if not attrs.get(field):
                raise serializers.ValidationError(
                    {field: _("Este campo es obligatorio para la sede principal.")}
                )

        return attrs


class SectorTemplateSerializer(serializers.ModelSerializer):
    """
    Complete serializer for SectorTemplate model.

    Handles serialization and validation of sector template data including
    JSON configuration and metadata.
    """

    sector_display = serializers.CharField(source="get_sector_display", read_only=True)
    elementos_template = serializers.SerializerMethodField()

    class Meta:
        model = SectorTemplate
        fields = [
            "id",
            "sector",
            "sector_display",
            "nombre_template",
            "descripcion",
            "data_json",
            "version",
            "aplicaciones_exitosas",
            "fecha_ultima_aplicacion",
            "elementos_template",
            "is_active",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "sector_display",
            "aplicaciones_exitosas",
            "fecha_ultima_aplicacion",
            "elementos_template",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]

    def get_elementos_template(self, obj):
        """
        Get summary of template elements.

        Args:
            obj (SectorTemplate): Template instance

        Returns:
            dict: Summary of template elements
        """
        data = obj.data_json or {}
        return {
            "total_procesos": len(data.get("procesos", [])),
            "total_indicadores": len(data.get("indicadores", [])),
            "total_documentos": len(data.get("documentos", [])),
        }

    def validate_data_json(self, value):
        """
        Validate JSON configuration structure.

        Args:
            value (dict): JSON data to validate

        Returns:
            dict: Validated JSON data

        Raises:
            ValidationError: If JSON structure is invalid
        """
        if not isinstance(value, dict):
            raise serializers.ValidationError(
                _("La configuración debe ser un objeto JSON válido.")
            )

        required_keys = ["procesos", "indicadores", "documentos"]
        missing_keys = [key for key in required_keys if key not in value]

        if missing_keys:
            raise serializers.ValidationError(
                _("El JSON debe contener las claves: {}. Faltan: {}").format(
                    ", ".join(required_keys), ", ".join(missing_keys)
                )
            )

        # Validar que cada sección sea una lista
        for key in required_keys:
            if not isinstance(value[key], list):
                raise serializers.ValidationError(
                    _('La clave "{}" debe contener una lista de elementos.').format(key)
                )

        return value


class SectorTemplateListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for sector template listings.

    Provides only essential fields for list views and dropdowns.
    """

    sector_display = serializers.CharField(source="get_sector_display", read_only=True)
    total_elementos = serializers.SerializerMethodField()

    class Meta:
        model = SectorTemplate
        fields = [
            "id",
            "sector",
            "sector_display",
            "nombre_template",
            "descripcion",
            "version",
            "aplicaciones_exitosas",
            "fecha_ultima_aplicacion",
            "total_elementos",
            "is_active",
        ]

    def get_total_elementos(self, obj):
        """
        Get total count of template elements.

        Args:
            obj (SectorTemplate): Template instance

        Returns:
            int: Total number of elements in template
        """
        data = obj.data_json or {}
        return (
            len(data.get("procesos", []))
            + len(data.get("indicadores", []))
            + len(data.get("documentos", []))
        )


class SectorTemplateCreateSerializer(SectorTemplateSerializer):
    """
    Serializer for creating new sector templates.

    Includes validation for template creation and excludes
    certain read-only fields.
    """

    class Meta(SectorTemplateSerializer.Meta):
        fields = [
            "sector",
            "nombre_template",
            "descripcion",
            "data_json",
            "version",
        ]

    def create(self, validated_data):
        """
        Create sector template and set audit fields.

        Args:
            validated_data (dict): Validated data for template

        Returns:
            SectorTemplate: Created template instance
        """
        # Agregar usuario que crea el template
        user = self.context["request"].user
        validated_data["created_by"] = user
        validated_data["updated_by"] = user

        return super().create(validated_data)


class SectorTemplateApplySerializer(serializers.Serializer):
    """
    Serializer for applying a sector template to an organization.

    Validates the application request and handles the template
    application process.
    """

    organization_id = serializers.UUIDField(
        help_text=_("ID de la organización a la que aplicar el template.")
    )

    def validate_organization_id(self, value):
        """
        Validate that organization exists and is active.

        Args:
            value (UUID): Organization ID to validate

        Returns:
            UUID: Validated organization ID

        Raises:
            ValidationError: If organization is invalid
        """
        try:
            organization = Organization.objects.get(id=value, is_active=True)
        except Organization.DoesNotExist:
            raise serializers.ValidationError(
                _("Organización no encontrada o inactiva.")
            )

        return value

    def validate(self, attrs):
        """
        Validate template application request.

        Args:
            attrs (dict): Attributes to validate

        Returns:
            dict: Validated attributes

        Raises:
            ValidationError: If validation fails
        """
        organization_id = attrs.get("organization_id")
        template = self.context["template"]

        # Obtener la organización
        try:
            organization = Organization.objects.get(id=organization_id, is_active=True)
        except Organization.DoesNotExist:
            raise serializers.ValidationError(_("Organización no encontrada."))

        # Validar que el sector coincida
        if organization.sector_economico != template.sector:
            raise serializers.ValidationError(
                _(
                    "Este template es para el sector {}, pero la organización es del sector {}."
                ).format(
                    template.get_sector_display(),
                    organization.get_sector_economico_display(),
                )
            )

        # Agregar la organización al contexto para usar en save()
        attrs["organization"] = organization

        return attrs

    def save(self):
        """
        Apply the template to the organization.

        Returns:
            dict: Result of the template application
        """
        template = self.context["template"]
        organization = self.validated_data["organization"]
        user = self.context["request"].user

        return template.aplicar_a_organizacion(organization, user)


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer for AuditLog model.

    Provides detailed audit log information including user details
    and formatted timestamps.
    """

    action_display = serializers.CharField(source="get_action_display", read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "table_name",
            "record_id",
            "action",
            "action_display",
            "old_values",
            "new_values",
            "changed_fields",
            "ip_address",
            "user_agent",
            "session_key",
            "reason",
            "user_name",
            "user_email",
            "created_at",
            "created_at_formatted",
        ]

    def get_user_name(self, obj):
        """Get user's full name or email."""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return _("Sistema")

    def get_user_email(self, obj):
        """Get user's email."""
        if obj.created_by:
            return obj.created_by.email
        return None

    def get_created_at_formatted(self, obj):
        """Get formatted timestamp."""
        from django.utils.dateformat import format

        return format(obj.created_at, "Y-m-d H:i:s")


class AuditLogListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for audit log listings.
    """

    action_display = serializers.CharField(source="get_action_display", read_only=True)
    user_name = serializers.SerializerMethodField()
    record_id_short = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "table_name",
            "record_id",
            "record_id_short",
            "action",
            "action_display",
            "changed_fields",
            "ip_address",
            "user_name",
            "created_at",
        ]

    def get_user_name(self, obj):
        """Get user's full name or email."""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return _("Sistema")

    def get_record_id_short(self, obj):
        """Get shortened record ID."""
        if obj.record_id:
            return obj.record_id[:8] + "..."
        return ""


class RollbackRequestSerializer(serializers.Serializer):
    """
    Serializer for rollback requests.
    """

    audit_log_id = serializers.UUIDField(
        help_text=_("ID del audit log al cual hacer rollback.")
    )

    reason = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text=_("Razón para el rollback."),
    )

    def validate_audit_log_id(self, value):
        """Validate that the audit log exists."""
        try:
            audit_log = AuditLog.objects.get(id=value)
            return value
        except AuditLog.DoesNotExist:
            raise serializers.ValidationError(_("Audit log no encontrado."))


class OrganizationHistorySerializer(serializers.Serializer):
    """
    Serializer for organization history requests.
    """

    organization_id = serializers.UUIDField(
        help_text=_("ID de la organización para obtener historial.")
    )

    limit = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=1000,
        default=50,
        help_text=_("Número máximo de entradas a retornar."),
    )

    def validate_organization_id(self, value):
        """Validate that the organization exists."""
        try:
            organization = Organization.objects.get(id=value)
            return value
        except Organization.DoesNotExist:
            raise serializers.ValidationError(_("Organización no encontrada."))


class HealthOrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer for HealthOrganization model.
    
    Handles serialization and validation of health organization data,
    including REPS validation and representative information.
    """
    
    # Read-only computed fields
    codigo_prestador_formatted = serializers.ReadOnlyField()
    representante_documento_completo = serializers.ReadOnlyField()
    servicios_activos = serializers.ReadOnlyField()
    
    # Organization relationship
    organization_name = serializers.CharField(source='organization.razon_social', read_only=True)
    organization_nit = serializers.CharField(source='organization.nit_completo', read_only=True)
    
    class Meta:
        model = HealthOrganization
        fields = [
            'id',
            'organization',
            'organization_name',
            'organization_nit',
            
            # REPS Information
            'codigo_prestador',
            'codigo_prestador_formatted',
            'verificado_reps',
            'fecha_verificacion_reps',
            'datos_reps',
            
            # Classification
            'naturaleza_juridica',
            'tipo_prestador',
            'nivel_complejidad',
            
            # Legal Representative
            'representante_tipo_documento',
            'representante_numero_documento',
            'representante_nombre_completo',
            'representante_telefono',
            'representante_email',
            'representante_documento_completo',
            
            # Qualification Information
            'fecha_habilitacion',
            'resolucion_habilitacion',
            'registro_especial',
            
            # Additional Information
            'servicios_habilitados_count',
            'servicios_activos',
            'observaciones_salud',
            
            # Audit fields
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'codigo_prestador_formatted',
            'representante_documento_completo',
            'servicios_activos',
            'organization_name',
            'organization_nit',
            'servicios_habilitados_count',
            'fecha_verificacion_reps',
            'created_at',
            'updated_at',
        ]
    
    def validate_codigo_prestador(self, value):
        """Validate provider code format and uniqueness."""
        if not value or len(value) != 12:
            raise serializers.ValidationError(
                _('El código prestador debe tener exactamente 12 dígitos.')
            )
        
        if not value.isdigit():
            raise serializers.ValidationError(
                _('El código prestador debe contener solo números.')
            )
        
        # Check uniqueness (excluding current instance in updates)
        queryset = HealthOrganization.objects.filter(codigo_prestador=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError(
                _('Ya existe una organización con este código prestador.')
            )
        
        return value
    
    def validate_representante_email(self, value):
        """Validate representative email format."""
        if value and '@' not in value:
            raise serializers.ValidationError(
                _('Ingrese una dirección de email válida.')
            )
        return value
    
    def validate(self, attrs):
        """Cross-field validation."""
        nivel_complejidad = attrs.get('nivel_complejidad')
        tipo_prestador = attrs.get('tipo_prestador')
        
        # Validate complexity level vs provider type
        if nivel_complejidad == 'IV' and tipo_prestador not in ['HOSPITAL', 'CLINICA']:
            raise serializers.ValidationError({
                'nivel_complejidad': _('Solo hospitales y clínicas pueden tener nivel de complejidad IV.')
            })
        
        return attrs


class HealthOrganizationCreateSerializer(HealthOrganizationSerializer):
    """
    Serializer for creating HealthOrganization instances.
    """
    
    organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
        help_text=_('Organización base para el perfil de salud.')
    )
    
    def validate_organization(self, value):
        """Validate that organization belongs to health sector."""
        if value.sector_economico != 'salud':
            raise serializers.ValidationError(
                _('La organización debe pertenecer al sector salud.')
            )
        
        # Check if health profile already exists
        if hasattr(value, 'health_profile'):
            raise serializers.ValidationError(
                _('Esta organización ya tiene un perfil de salud asociado.')
            )
        
        return value


class HealthOrganizationListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for HealthOrganization list views.
    """
    
    organization_name = serializers.CharField(source='organization.razon_social', read_only=True)
    codigo_prestador_formatted = serializers.ReadOnlyField()
    servicios_activos = serializers.ReadOnlyField()
    
    class Meta:
        model = HealthOrganization
        fields = [
            'id',
            'organization_name',
            'codigo_prestador',
            'codigo_prestador_formatted',
            'nivel_complejidad',
            'tipo_prestador',
            'verificado_reps',
            'servicios_activos',
            'servicios_habilitados_count',
            'created_at',
        ]


class HealthServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for HealthService model.
    
    Handles serialization and validation of health service data,
    including date validation and organization relationship.
    """
    
    # Read-only computed fields
    esta_vigente = serializers.ReadOnlyField()
    dias_para_vencimiento = serializers.ReadOnlyField()
    
    # Related fields
    health_organization_name = serializers.CharField(
        source='health_organization.organization.razon_social', 
        read_only=True
    )
    sede_nombre = serializers.CharField(source='sede_prestacion.nombre', read_only=True)
    sede_direccion = serializers.CharField(source='sede_prestacion.direccion_completa', read_only=True)
    
    class Meta:
        model = HealthService
        fields = [
            'id',
            'health_organization',
            'health_organization_name',
            
            # Service Information
            'codigo_servicio',
            'nombre_servicio',
            'grupo_servicio',
            'descripcion_servicio',
            
            # Dates and Validity
            'fecha_habilitacion',
            'fecha_vencimiento',
            'esta_vigente',
            'dias_para_vencimiento',
            
            # Status and Modality
            'estado',
            'modalidad',
            
            # Location and Capacity
            'sede_prestacion',
            'sede_nombre',
            'sede_direccion',
            'capacidad_instalada',
            
            # Regulatory Information
            'numero_resolucion',
            'entidad_autorizante',
            'fecha_ultima_visita',
            
            # Additional Information
            'observaciones',
            'requiere_autorizacion',
            'dias_atencion',
            'horario_atencion',
            
            # Audit fields
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'esta_vigente',
            'dias_para_vencimiento',
            'health_organization_name',
            'sede_nombre',
            'sede_direccion',
            'created_at',
            'updated_at',
        ]
    
    def validate_codigo_servicio(self, value):
        """Validate service code format."""
        if not value or not value.isdigit():
            raise serializers.ValidationError(
                _('El código del servicio debe ser numérico.')
            )
        
        if len(value) < 3 or len(value) > 4:
            raise serializers.ValidationError(
                _('El código del servicio debe tener 3 o 4 dígitos.')
            )
        
        return value
    
    def validate_sede_prestacion(self, value):
        """Validate that sede belongs to the same organization."""
        health_organization = self.initial_data.get('health_organization')
        
        if health_organization and hasattr(value, 'organization'):
            # Get HealthOrganization instance
            try:
                health_org = HealthOrganization.objects.get(pk=health_organization)
                if value.organization != health_org.organization:
                    raise serializers.ValidationError(
                        _('La sede debe pertenecer a la misma organización.')
                    )
            except HealthOrganization.DoesNotExist:
                raise serializers.ValidationError(
                    _('Organización de salud no encontrada.')
                )
        
        return value
    
    def validate(self, attrs):
        """Cross-field validation."""
        fecha_habilitacion = attrs.get('fecha_habilitacion')
        fecha_vencimiento = attrs.get('fecha_vencimiento')
        
        # Validate expiration date is after qualification date
        if fecha_vencimiento and fecha_habilitacion:
            if fecha_vencimiento <= fecha_habilitacion:
                raise serializers.ValidationError({
                    'fecha_vencimiento': _(
                        'La fecha de vencimiento debe ser posterior a la fecha de habilitación.'
                    )
                })
        
        return attrs


class HealthServiceCreateSerializer(HealthServiceSerializer):
    """
    Serializer for creating HealthService instances.
    """
    
    health_organization = serializers.PrimaryKeyRelatedField(
        queryset=HealthOrganization.objects.all(),
        help_text=_('Organización de salud que prestará el servicio.')
    )
    
    sede_prestacion = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(),
        help_text=_('Sede donde se prestará el servicio.')
    )


class HealthServiceListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for HealthService list views.
    """
    
    health_organization_name = serializers.CharField(
        source='health_organization.organization.razon_social', 
        read_only=True
    )
    sede_nombre = serializers.CharField(source='sede_prestacion.nombre', read_only=True)
    esta_vigente = serializers.ReadOnlyField()
    dias_para_vencimiento = serializers.ReadOnlyField()
    
    class Meta:
        model = HealthService
        fields = [
            'id',
            'health_organization_name',
            'codigo_servicio',
            'nombre_servicio',
            'grupo_servicio',
            'estado',
            'modalidad',
            'sede_nombre',
            'fecha_habilitacion',
            'fecha_vencimiento',
            'esta_vigente',
            'dias_para_vencimiento',
            'created_at',
        ]


class HealthServicesByOrganizationSerializer(serializers.Serializer):
    """
    Serializer for filtering services by health organization.
    """
    
    health_organization_id = serializers.UUIDField(
        help_text=_('ID de la organización de salud.')
    )
    
    grupo_servicio = serializers.ChoiceField(
        choices=HealthService.GRUPO_SERVICIO_CHOICES,
        required=False,
        help_text=_('Filtrar por grupo de servicio.')
    )
    
    estado = serializers.ChoiceField(
        choices=HealthService.ESTADO_CHOICES,
        required=False,
        default='activo',
        help_text=_('Filtrar por estado del servicio.')
    )
    
    def validate_health_organization_id(self, value):
        """Validate that the health organization exists."""
        try:
            health_org = HealthOrganization.objects.get(id=value)
            return value
        except HealthOrganization.DoesNotExist:
            raise serializers.ValidationError(_('Organización de salud no encontrada.'))


class REPSValidationSerializer(serializers.Serializer):
    """
    Serializer for REPS validation requests.
    """
    
    codigo_prestador = serializers.CharField(
        max_length=12,
        min_length=12,
        help_text=_('Código prestador de 12 dígitos para validar en REPS.')
    )
    
    def validate_codigo_prestador(self, value):
        """Validate provider code format."""
        if not value.isdigit():
            raise serializers.ValidationError(
                _('El código prestador debe contener solo números.')
            )
        
        return value


class HealthServicesValidationSerializer(serializers.Serializer):
    """
    Serializer for validating services coherence with complexity level.
    """
    
    services = serializers.ListField(
        child=serializers.DictField(),
        help_text=_('Lista de servicios a validar.')
    )
    
    nivel_complejidad = serializers.ChoiceField(
        choices=HealthOrganization.NIVEL_COMPLEJIDAD_CHOICES,
        help_text=_('Nivel de complejidad de la organización.')
    )
    
    def validate_services(self, value):
        """Validate services list format."""
        if not value:
            raise serializers.ValidationError(
                _('La lista de servicios no puede estar vacía.')
            )
        
        for service in value:
            if 'codigo_servicio' not in service:
                raise serializers.ValidationError(
                    _('Cada servicio debe incluir codigo_servicio.')
                )
        
        return value


# ===========================================
# SERIALIZERS PARA SEDES PRESTADORAS
# ===========================================

class SedeServicioSerializer(serializers.ModelSerializer):
    """Serializer para servicios en una sede"""
    
    nombre_servicio = serializers.CharField(source='servicio.nombre_servicio', read_only=True)
    codigo_servicio = serializers.CharField(source='servicio.codigo_servicio', read_only=True)
    grupo_servicio = serializers.CharField(source='servicio.grupo_servicio', read_only=True)
    
    class Meta:
        model = SedeServicio
        fields = [
            'id',
            'servicio',
            'codigo_servicio',
            'nombre_servicio', 
            'grupo_servicio',
            'distintivo',
            'capacidad_instalada',
            'fecha_habilitacion',
            'estado_servicio',
            'observaciones',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_distintivo(self, value):
        """Validate that distintivo is unique within the sede."""
        sede = self.context.get('sede')
        if sede:
            existing = SedeServicio.objects.filter(
                sede=sede, 
                distintivo=value
            ).exclude(pk=self.instance.pk if self.instance else None)
            
            if existing.exists():
                raise serializers.ValidationError(
                    _('Ya existe un servicio con este código distintivo en la sede.')
                )
        return value


class SedeSerializer(serializers.ModelSerializer):
    """Serializer principal para sedes prestadoras"""
    
    servicios_habilitados = SedeServicioSerializer(
        source='sede_servicios',
        many=True,
        read_only=True
    )
    total_servicios = serializers.SerializerMethodField()
    direccion_completa = serializers.ReadOnlyField()
    
    # Campos para mostrar información de la organización de salud
    organization_name = serializers.CharField(
        source='health_organization.organization.razon_social', 
        read_only=True
    )
    codigo_prestador_organizacion = serializers.CharField(
        source='health_organization.codigo_prestador', 
        read_only=True
    )
    
    class Meta:
        model = SedePrestadora
        fields = [
            'id',
            'health_organization',
            'organization_name',
            'codigo_prestador_organizacion',
            'numero_sede',
            'codigo_prestador',
            'nombre_sede',
            'tipo_sede',
            'es_sede_principal',
            'direccion',
            'departamento',
            'municipio',
            'barrio',
            'codigo_postal',
            'direccion_completa',
            'latitud',
            'longitud',
            'telefono_principal',
            'telefono_secundario',
            'email',
            'nombre_responsable',
            'cargo_responsable',
            'telefono_responsable',
            'email_responsable',
            'estado',
            'fecha_habilitacion',
            'fecha_renovacion',
            'numero_camas',
            'numero_consultorios',
            'numero_quirofanos',
            'horario_atencion',
            'atencion_24_horas',
            'servicios_habilitados',
            'total_servicios',
            'observaciones',
            'imported_from_file',
            'import_date',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'direccion_completa', 'total_servicios', 'organization_name',
            'codigo_prestador_organizacion', 'created_at', 'updated_at'
        ]
    
    def get_total_servicios(self, obj):
        """Get total count of active services in the sede."""
        return obj.total_servicios
    
    def validate_numero_sede(self, value):
        """Validar formato de número de sede"""
        if not value.isdigit() or len(value) > 3:
            raise serializers.ValidationError(
                _("El número de sede debe ser numérico y máximo 3 dígitos")
            )
        return value.zfill(2)  # Formatear con ceros a la izquierda
    
    def validate_codigo_prestador(self, value):
        """Validar formato de código prestador"""
        if not value or len(value) < 9:
            raise serializers.ValidationError(
                _("El código de prestador debe tener al menos 9 caracteres")
            )
        return value
    
    def validate_email(self, value):
        """Validar formato de email"""
        if value:
            try:
                from django.core.validators import validate_email
                validate_email(value)
            except ValidationError:
                raise serializers.ValidationError(_("Email inválido"))
        return value
    
    def validate(self, data):
        """Validaciones cruzadas"""
        # Validar sede principal única por organización
        if data.get('es_sede_principal'):
            health_org = data.get('health_organization') or (
                self.instance.health_organization if self.instance else None
            )
            
            if health_org:
                existing = SedePrestadora.objects.filter(
                    health_organization=health_org,
                    es_sede_principal=True,
                    deleted_at__isnull=True
                ).exclude(pk=self.instance.pk if self.instance else None)
                
                if existing.exists():
                    raise serializers.ValidationError({
                        'es_sede_principal': _('Ya existe una sede principal para esta organización')
                    })
        
        # Validar unicidad de número de sede por organización
        if data.get('numero_sede'):
            health_org = data.get('health_organization') or (
                self.instance.health_organization if self.instance else None
            )
            
            if health_org:
                existing = SedePrestadora.objects.filter(
                    health_organization=health_org,
                    numero_sede=data['numero_sede'],
                    deleted_at__isnull=True
                ).exclude(pk=self.instance.pk if self.instance else None)
                
                if existing.exists():
                    raise serializers.ValidationError({
                        'numero_sede': _('Ya existe una sede con este número para esta organización')
                    })
        
        # Validar unicidad de código prestador por organización
        if data.get('codigo_prestador'):
            health_org = data.get('health_organization') or (
                self.instance.health_organization if self.instance else None
            )
            
            if health_org:
                existing = SedePrestadora.objects.filter(
                    health_organization=health_org,
                    codigo_prestador=data['codigo_prestador'],
                    deleted_at__isnull=True
                ).exclude(pk=self.instance.pk if self.instance else None)
                
                if existing.exists():
                    raise serializers.ValidationError({
                        'codigo_prestador': _('Ya existe una sede con este código prestador para esta organización')
                    })
        
        return data


class SedeListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de sedes"""
    
    total_servicios = serializers.SerializerMethodField()
    direccion_completa = serializers.ReadOnlyField()
    organization_name = serializers.CharField(
        source='health_organization.organization.razon_social', 
        read_only=True
    )
    
    class Meta:
        model = SedePrestadora
        fields = [
            'id',
            'numero_sede',
            'nombre_sede',
            'tipo_sede',
            'es_sede_principal',
            'direccion_completa',
            'departamento',
            'municipio',
            'telefono_principal',
            'email',
            'estado',
            'total_servicios',
            'atencion_24_horas',
            'organization_name',
            'created_at',
        ]
    
    def get_total_servicios(self, obj):
        return obj.total_servicios


class SedeCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de sedes con validaciones estrictas"""
    
    class Meta:
        model = SedePrestadora
        fields = [
            'health_organization',
            'numero_sede',
            'codigo_prestador',
            'nombre_sede',
            'tipo_sede',
            'es_sede_principal',
            'direccion',
            'departamento',
            'municipio',
            'barrio',
            'codigo_postal',
            'latitud',
            'longitud',
            'telefono_principal',
            'telefono_secundario',
            'email',
            'nombre_responsable',
            'cargo_responsable',
            'telefono_responsable',
            'email_responsable',
            'estado',
            'fecha_habilitacion',
            'fecha_renovacion',
            'numero_camas',
            'numero_consultorios',
            'numero_quirofanos',
            'horario_atencion',
            'atencion_24_horas',
            'observaciones',
        ]
    
    def validate(self, data):
        """Validaciones específicas para creación"""
        # Validar campos requeridos
        required_fields = [
            'numero_sede', 'codigo_prestador', 'nombre_sede',
            'direccion', 'departamento', 'municipio',
            'telefono_principal', 'email', 'nombre_responsable',
            'cargo_responsable'
        ]
        
        for field in required_fields:
            if not data.get(field):
                raise serializers.ValidationError({
                    field: _('Este campo es obligatorio')
                })
        
        # Si es la primera sede, debe ser principal
        health_org = data.get('health_organization')
        if health_org:
            existing_sedes = SedePrestadora.objects.filter(
                health_organization=health_org,
                deleted_at__isnull=True
            ).exists()
            
            if not existing_sedes and not data.get('es_sede_principal'):
                data['es_sede_principal'] = True
        
        return super().validate(data)


class SedeImportSerializer(serializers.Serializer):
    """Serializer para importación de sedes desde archivo"""
    
    file = serializers.FileField(
        help_text=_('Archivo CSV o Excel con datos de sedes')
    )
    format = serializers.ChoiceField(
        choices=['csv', 'excel'],
        default='csv',
        help_text=_('Formato del archivo')
    )
    mapping = serializers.JSONField(
        required=False,
        help_text=_('Mapeo de columnas del archivo a campos del modelo')
    )
    validate_only = serializers.BooleanField(
        default=False,
        help_text=_('Solo validar sin importar')
    )
    overwrite_existing = serializers.BooleanField(
        default=False,
        help_text=_('Sobrescribir sedes existentes con mismo número')
    )
    
    def validate_file(self, value):
        """Validar archivo de importación"""
        # Validar tamaño máximo (10 MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                _("El archivo no debe superar los 10 MB")
            )
        
        # Validar extensión según formato
        ext = value.name.split('.')[-1].lower()
        format_type = self.initial_data.get('format', 'csv')
        
        valid_extensions = {
            'csv': ['csv'],
            'excel': ['xlsx', 'xls']
        }
        
        if ext not in valid_extensions.get(format_type, []):
            raise serializers.ValidationError(
                _("Extensión de archivo inválida para el formato seleccionado")
            )
        
        return value
    
    def validate_mapping(self, value):
        """Validar mapeo de columnas"""
        if value:
            required_fields = [
                'numero_sede', 'nombre_sede', 'direccion',
                'departamento', 'municipio', 'telefono_principal',
                'email', 'nombre_responsable', 'cargo_responsable'
            ]
            
            mapped_fields = list(value.values())
            missing_fields = [field for field in required_fields if field not in mapped_fields]
            
            if missing_fields:
                raise serializers.ValidationError(
                    _("Faltan mapeos para campos obligatorios: {}").format(
                        ', '.join(missing_fields)
                    )
                )
        
        return value


class SedeValidationSerializer(serializers.Serializer):
    """Serializer para validar datos de sede sin guardar"""
    
    numero_sede = serializers.CharField(max_length=10)
    codigo_prestador = serializers.CharField(max_length=20)
    nombre_sede = serializers.CharField(max_length=200)
    tipo_sede = serializers.ChoiceField(choices=SedePrestadora.TIPO_SEDE_CHOICES)
    es_sede_principal = serializers.BooleanField(default=False)
    direccion = serializers.CharField(max_length=255)
    departamento = serializers.CharField(max_length=100)
    municipio = serializers.CharField(max_length=100)
    telefono_principal = serializers.CharField(max_length=20)
    email = serializers.EmailField()
    nombre_responsable = serializers.CharField(max_length=200)
    cargo_responsable = serializers.CharField(max_length=100)
    
    def validate(self, data):
        """Validaciones completas sin persistir"""
        # Aplicar las mismas validaciones que SedeSerializer
        sede_serializer = SedeSerializer(data=data, context=self.context)
        
        try:
            sede_serializer.is_valid(raise_exception=True)
            return data
        except serializers.ValidationError as e:
            raise e


class SedeBulkSerializer(serializers.Serializer):
    """Serializer para operaciones en lote de sedes"""
    
    sedes = serializers.ListField(
        child=SedeCreateSerializer(),
        min_length=1,
        help_text=_('Lista de sedes para crear')
    )
    
    def validate_sedes(self, value):
        """Validar lista de sedes para operaciones en lote"""
        # Validar que no haya números de sede duplicados
        numeros_sede = [sede['numero_sede'] for sede in value if 'numero_sede' in sede]
        if len(numeros_sede) != len(set(numeros_sede)):
            raise serializers.ValidationError(
                _('Hay números de sede duplicados en la lista')
            )
        
        # Validar que solo haya una sede principal
        sedes_principales = [sede for sede in value if sede.get('es_sede_principal')]
        if len(sedes_principales) > 1:
            raise serializers.ValidationError(
                _('Solo puede haber una sede principal en la lista')
            )
        
        return value



# Simplified Wizard Serializers
class OrganizationWizardSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for organization wizard.
    
    This serializer handles only the basic organization data required
    for the simplified wizard flow, excluding health-specific fields.
    """
    
    logo = serializers.ImageField(required=False, allow_null=True)
    nit_completo = serializers.ReadOnlyField()
    
    class Meta:
        model = Organization
        fields = [
            'id',
            'razon_social',
            'nit',
            'digito_verificacion',
            'nit_completo',
            'email_contacto',
            'telefono_principal',
            'website',
            'descripcion',
            'logo',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'nit_completo', 'created_at', 'updated_at']
    
    def validate_razon_social(self, value):
        """Validate organization name."""
        from .validators import validate_razon_social
        validate_razon_social(value)
        return value
    
    def validate_nit(self, value):
        """Validate NIT format."""
        from .validators import validate_nit_format
        validate_nit_format(value)
        
        # Check uniqueness for new organizations
        if not self.instance:
            if Organization.objects.filter(nit=value).exists():
                raise serializers.ValidationError(
                    _('Ya existe una organización con este NIT.')
                )
        return value
    
    def validate_digito_verificacion(self, value):
        """Validate verification digit."""
        from .validators import validate_verification_digit
        validate_verification_digit(value)
        return value
    
    def validate_email_contacto(self, value):
        """Validate contact email."""
        if value:
            from .validators import validate_email_domain
            validate_email_domain(value)
        return value
    
    def validate_telefono_principal(self, value):
        """Validate phone number."""
        if value:
            from .validators import validate_colombian_phone
            validate_colombian_phone(value)
        return value
    
    def validate_website(self, value):
        """Validate website URL."""
        if value:
            from .validators import validate_website_url
            validate_website_url(value)
        return value
    
    def validate_descripcion(self, value):
        """Validate description length."""
        if value:
            from .validators import validate_description_length
            validate_description_length(value)
        return value
    
    def validate_logo(self, value):
        """Validate logo upload."""
        if value:
            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    _('Formato de imagen no válido. Use JPEG, PNG, GIF o WebP.')
                )
            
            # Validate file size (max 5MB)
            max_size = 5 * 1024 * 1024  # 5MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    _('La imagen es demasiado grande. Tamaño máximo: 5MB.')
                )
        
        return value
    
    def create(self, validated_data):
        """Create organization with default values for simplified wizard."""
        # Set default values for non-wizard fields
        validated_data.setdefault('tipo_organizacion', 'empresa_privada')
        validated_data.setdefault('sector_economico', 'servicios')
        validated_data.setdefault('tamaño_empresa', 'pequeña')
        
        return super().create(validated_data)


class OrganizationWizardCreateSerializer(OrganizationWizardSerializer):
    """Serializer for creating organizations through the wizard."""
    
    # Add fields for multi-sector support
    selectedSector = serializers.CharField(write_only=True, required=False, allow_blank=True)
    selectedOrgType = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Additional classification fields
    fecha_fundacion = serializers.DateField(required=False, allow_null=True)
    tamaño_empresa = serializers.CharField(required=False, allow_blank=True)
    
    class Meta(OrganizationWizardSerializer.Meta):
        fields = [
            # Basic information
            'razon_social',
            'nit',
            'digito_verificacion',
            'email_contacto',
            'telefono_principal',
            'website',
            'descripcion',
            'logo',
            
            # Multi-sector fields (frontend compatibility)
            'selectedSector',
            'selectedOrgType',
            
            # Classification fields  
            'tipo_organizacion',
            'sector_economico',
            'tamaño_empresa',
            'fecha_fundacion',
            
            # Configuration fields
            'enabled_modules',
            'sector_config',
        ]
    
    def create(self, validated_data):
        """Create organization with proper field mapping."""
        # Map frontend fields to model fields
        selected_sector = validated_data.pop('selectedSector', '')
        selected_org_type = validated_data.pop('selectedOrgType', '')
        
        if selected_sector:
            validated_data['sector_economico'] = selected_sector
        if selected_org_type:
            validated_data['tipo_organizacion'] = selected_org_type
        
        # Set default values for new fields
        if 'enabled_modules' not in validated_data:
            validated_data['enabled_modules'] = '[]'
        if 'sector_config' not in validated_data:
            validated_data['sector_config'] = '{}'
        
        # Create the organization
        organization = super().create(validated_data)
        
        # Create HealthOrganization if sector is health-related
        if (validated_data.get('sector_economico') == 'salud' or 
            selected_sector in ['HEALTHCARE', 'salud'] or
            validated_data.get('tipo_organizacion') in ['ips', 'eps', 'hospital', 'clinica', 'centro_medico', 'laboratorio']):
            
            self._create_health_organization(organization, validated_data, selected_org_type)
        
        return organization
    
    def _create_health_organization(self, organization, validated_data, selected_org_type):
        """Create HealthOrganization record for health sector organizations."""
        from .models import HealthOrganization
        
        # Map organization type to health-specific fields
        tipo_prestador_mapping = {
            'ips': 'IPS',
            'hospital': 'HOSPITAL', 
            'clinica': 'CLINICA',
            'centro_medico': 'CENTRO_MEDICO',
            'laboratorio': 'LABORATORIO',
            'eps': 'IPS',  # EPS también se maneja como IPS
        }
        
        tipo_prestador = tipo_prestador_mapping.get(
            validated_data.get('tipo_organizacion', '').lower(),
            'IPS'  # Default
        )
        
        # Create HealthOrganization record
        health_org = HealthOrganization.objects.create(
            organization=organization,
            codigo_prestador='',  # To be filled later
            naturaleza_juridica='privada',  # Default, can be updated later
            tipo_prestador=tipo_prestador,
            nivel_complejidad='I',  # Default to Level I
            verificado_reps=False,
            datos_reps={},
            representante_nombre_completo='',
            representante_numero_documento='',
            representante_tipo_documento='CC',
            representante_telefono='',
            representante_email='',
            fecha_habilitacion=None,
            resolucion_habilitacion='',
            registro_especial='',
            servicios_habilitados_count=0,
            observaciones_salud=f'Organización de salud creada automáticamente para {organization.razon_social}',
        )
        
        return health_org


class DivipolaSerializer(serializers.Serializer):
    """Serializer for DIVIPOLA data (departments and municipalities)."""
    
    code = serializers.CharField(max_length=5)
    name = serializers.CharField(max_length=100)


class DepartmentSerializer(DivipolaSerializer):
    """Serializer for department data."""
    
    capital = serializers.CharField(max_length=100)


class MunicipalitySerializer(DivipolaSerializer):
    """Serializer for municipality data."""
    
    department_code = serializers.CharField(max_length=2)
    department_name = serializers.CharField(max_length=100, required=False)

