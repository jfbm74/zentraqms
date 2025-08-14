"""
Serializers for Organization module in ZentraQMS.

This module contains DRF serializers for Organization and Location models,
providing API serialization and validation.
"""

from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Organization, Location, SectorTemplate, AuditLog


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

    class Meta:
        model = Location
        fields = [
            "id",
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
        Validate organization data including NIT verification digit.

        Args:
            attrs (dict): Attributes to validate

        Returns:
            dict: Validated attributes

        Raises:
            ValidationError: If validation fails
        """
        nit = attrs.get("nit")
        digito_verificacion = attrs.get("digito_verificacion")

        # Validar correspondencia entre NIT y dígito de verificación
        if nit and digito_verificacion:
            digito_calculado = Organization.calcular_digito_verificacion(nit)
            if str(digito_calculado) != str(digito_verificacion):
                raise serializers.ValidationError(
                    {
                        "digito_verificacion": _(
                            "El dígito de verificación no corresponde al NIT ingresado. "
                            f"El dígito correcto es: {digito_calculado}"
                        )
                    }
                )

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
    digito_verificacion_calculado = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id",
            "razon_social",
            "nombre_comercial",
            "nit",
            "digito_verificacion",
            "nit_completo",
            "digito_verificacion_calculado",
            "tipo_organizacion",
            "sector_economico",
            "tamaño_empresa",
            "telefono_principal",
            "email_contacto",
        ]
        read_only_fields = [
            "id",
            "nit_completo",
            "digito_verificacion_calculado",
        ]

    def get_digito_verificacion_calculado(self, obj):
        """
        Calculate verification digit for the given NIT.

        Args:
            obj (Organization): Organization instance

        Returns:
            int or None: Calculated verification digit
        """
        if obj.nit:
            return Organization.calcular_digito_verificacion(obj.nit)
        return None

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

        # Validar correspondencia NIT-DV
        nit = attrs.get("nit")
        digito_verificacion = attrs.get("digito_verificacion")

        if nit and digito_verificacion:
            digito_calculado = Organization.calcular_digito_verificacion(nit)
            if str(digito_calculado) != str(digito_verificacion):
                raise serializers.ValidationError(
                    {
                        "digito_verificacion": _(
                            "El dígito de verificación no corresponde al NIT ingresado. "
                            f"El dígito correcto es: {digito_calculado}"
                        )
                    }
                )

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
        required_fields = ["nombre", "direccion", "ciudad", "departamento"]

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
