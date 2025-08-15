"""
Models for Organization module in ZentraQMS.

This module handles all organization-related data including:
- Organization basic information and legal data
- Location management (headquarters and additional sites)
- Organization configuration and settings
"""

from django.db import models
from django.conf import settings
from django.core.validators import (
    RegexValidator,
    MinLengthValidator,
    MaxLengthValidator,
)
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.common.models import FullBaseModel
# from apps.common.utils.upload_handlers import get_logo_upload_path
# from apps.common.validators.file_validators import validate_logo

def get_logo_upload_path(instance, filename):
    """Temporary placeholder for logo upload path."""
    return f"logos/{filename}"

def validate_logo(value):
    """Temporary placeholder for logo validation."""
    pass


class Organization(FullBaseModel):
    """
    Model to store organization basic information and legal data.

    This is the main entity that represents the organization using ZentraQMS.
    Contains legal information, classification, and identity data.
    """

    # Tipo de Organización Choices
    TIPO_ORGANIZACION_CHOICES = [
        ("empresa_privada", _("Empresa Privada")),
        ("empresa_publica", _("Empresa Pública")),
        ("mixta", _("Mixta")),
        ("fundacion", _("Fundación")),
        ("ong", _("ONG")),
        ("cooperativa", _("Cooperativa")),
        ("ips", _("IPS")),
        ("eps", _("EPS")),
        ("hospital", _("Hospital")),
        ("clinica", _("Clínica")),
        ("centro_medico", _("Centro Médico")),
        ("laboratorio", _("Laboratorio")),
        ("institucion_educativa", _("Institución Educativa")),
        ("universidad", _("Universidad")),
        ("otra", _("Otra")),
    ]

    # Sector Económico Choices
    SECTOR_ECONOMICO_CHOICES = [
        ("salud", _("Salud")),
        ("educacion", _("Educación")),
        ("manufactura", _("Manufactura")),
        ("servicios", _("Servicios")),
        ("tecnologia", _("Tecnología")),
        ("financiero", _("Financiero")),
        ("comercio", _("Comercio")),
        ("construccion", _("Construcción")),
        ("transporte", _("Transporte")),
        ("agropecuario", _("Agropecuario")),
        ("mineria", _("Minería")),
        ("energia", _("Energía")),
        ("telecomunicaciones", _("Telecomunicaciones")),
        ("turismo", _("Turismo")),
        ("otro", _("Otro")),
    ]

    # Tamaño de Empresa Choices (según clasificación colombiana)
    TAMAÑO_EMPRESA_CHOICES = [
        ("microempresa", _("Microempresa (1-10 empleados)")),
        ("pequeña", _("Pequeña Empresa (11-50 empleados)")),
        ("mediana", _("Mediana Empresa (51-200 empleados)")),
        ("grande", _("Gran Empresa (200+ empleados)")),
    ]

    # Información Legal Básica
    razon_social = models.CharField(
        _("razón social"),
        max_length=200,
        help_text=_(
            "Razón social completa de la organización según documentos legales."
        ),
    )

    nombre_comercial = models.CharField(
        _("nombre comercial"),
        max_length=100,
        blank=True,
        help_text=_("Nombre comercial o marca bajo la cual opera la organización."),
    )

    nit = models.CharField(
        _("NIT"),
        max_length=15,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^[\d\-]{9,15}$",
                message=_("NIT debe tener formato válido: 123456789 o 123-456-789"),
            )
        ],
        help_text=_("Número de Identificación Tributaria sin dígito de verificación."),
    )

    digito_verificacion = models.CharField(
        _("dígito de verificación"),
        max_length=1,
        validators=[
            RegexValidator(
                regex=r"^[0-9]$",
                message=_("Dígito de verificación debe ser un número del 0 al 9"),
            )
        ],
        help_text=_("Dígito de verificación del NIT."),
    )

    # Clasificación Organizacional
    tipo_organizacion = models.CharField(
        _("tipo de organización"),
        max_length=30,
        choices=TIPO_ORGANIZACION_CHOICES,
        help_text=_("Tipo de organización según su naturaleza jurídica."),
    )

    sector_economico = models.CharField(
        _("sector económico"),
        max_length=30,
        choices=SECTOR_ECONOMICO_CHOICES,
        help_text=_("Sector económico principal al que pertenece la organización."),
    )

    tamaño_empresa = models.CharField(
        _("tamaño de empresa"),
        max_length=15,
        choices=TAMAÑO_EMPRESA_CHOICES,
        help_text=_("Clasificación por tamaño según número de empleados."),
    )

    # Información Adicional
    fecha_fundacion = models.DateField(
        _("fecha de fundación"),
        null=True,
        blank=True,
        help_text=_("Fecha de fundación o constitución de la organización."),
    )

    logo = models.ImageField(
        _("logo"),
        upload_to=get_logo_upload_path,
        null=True,
        blank=True,
        validators=[validate_logo],
        help_text=_("Logo oficial de la organización. Máximo 2MB, formatos: JPG, PNG, GIF, WebP."),
    )

    descripcion = models.TextField(
        _("descripción"),
        blank=True,
        max_length=1000,
        help_text=_("Descripción general de la organización y sus actividades."),
    )

    # Website y Redes Sociales
    website = models.URLField(
        _("sitio web"), blank=True, help_text=_("Sitio web oficial de la organización.")
    )

    email_contacto = models.EmailField(
        _("email de contacto"),
        blank=True,
        help_text=_("Email principal de contacto de la organización."),
    )

    telefono_principal = models.CharField(
        _("teléfono principal"),
        max_length=15,
        blank=True,
        validators=[
            RegexValidator(
                regex=r"^\+?[\d\s\-\(\)]{7,15}$",
                message=_("Número de teléfono debe tener un formato válido."),
            )
        ],
        help_text=_("Teléfono principal de contacto."),
    )

    class Meta:
        verbose_name = _("organización")
        verbose_name_plural = _("organizaciones")
        ordering = ["razon_social"]
        indexes = [
            models.Index(fields=["nit"]),
            models.Index(fields=["tipo_organizacion"]),
            models.Index(fields=["sector_economico"]),
        ]

    def __str__(self):
        """Return string representation of the organization."""
        return self.nombre_comercial or self.razon_social

    @property
    def nit_completo(self):
        """Return complete NIT with verification digit."""
        return f"{self.nit}-{self.digito_verificacion}"

    def clean(self):
        """Validate model data."""
        super().clean()
        
        # Basic validation - NIT and verification digit are required but we don't validate the calculation
        pass


class Location(FullBaseModel):
    """
    Model to store organization locations (headquarters and additional sites).

    Manages all physical locations where the organization operates,
    including headquarters and additional operational sites.
    """

    # Tipo de Sede Choices
    TIPO_SEDE_CHOICES = [
        ("principal", _("Sede Principal")),
        ("sucursal", _("Sucursal")),
        ("oficina", _("Oficina")),
        ("bodega", _("Bodega")),
        ("centro_operativo", _("Centro Operativo")),
        ("planta", _("Planta")),
        ("laboratorio", _("Laboratorio")),
        ("punto_atencion", _("Punto de Atención")),
        ("otro", _("Otro")),
    ]

    # Relación con Organization
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="locations",
        verbose_name=_("organización"),
        help_text=_("Organización a la que pertenece esta sede."),
    )

    # Información Básica de la Sede
    nombre = models.CharField(
        _("nombre de la sede"),
        max_length=100,
        help_text=_("Nombre identificativo de la sede."),
    )

    tipo_sede = models.CharField(
        _("tipo de sede"),
        max_length=20,
        choices=TIPO_SEDE_CHOICES,
        help_text=_("Tipo de sede según su función."),
    )

    es_principal = models.BooleanField(
        _("es sede principal"),
        default=False,
        help_text=_("Indica si esta es la sede principal de la organización."),
    )

    # Dirección
    direccion = models.CharField(
        _("dirección"), max_length=200, help_text=_("Dirección completa de la sede.")
    )

    ciudad = models.CharField(
        _("ciudad"), max_length=50, help_text=_("Ciudad donde se encuentra la sede.")
    )

    codigo_municipio = models.CharField(
        _("código municipio DIVIPOLA"),
        max_length=5,
        blank=True,
        help_text=_("Código DIVIPOLA del municipio (ej: 11001 para Bogotá)"),
    )

    departamento = models.CharField(
        _("departamento"),
        max_length=50,
        help_text=_("Departamento donde se encuentra la sede."),
    )

    codigo_departamento = models.CharField(
        _("código departamento DIVIPOLA"),
        max_length=2,
        blank=True,
        help_text=_("Código DIVIPOLA del departamento (ej: 11 para Bogotá D.C.)"),
    )

    pais = models.CharField(
        _("país"),
        max_length=50,
        default="Colombia",
        help_text=_("País donde se encuentra la sede."),
    )

    codigo_postal = models.CharField(
        _("código postal"),
        max_length=10,
        blank=True,
        help_text=_("Código postal de la dirección."),
    )

    # Información de Contacto
    telefono = models.CharField(
        _("teléfono"),
        max_length=15,
        blank=True,
        validators=[
            RegexValidator(
                regex=r"^\+?[\d\s\-\(\)]{7,15}$",
                message=_("Número de teléfono debe tener un formato válido."),
            )
        ],
        help_text=_("Teléfono de contacto de la sede."),
    )

    email = models.EmailField(
        _("email"), blank=True, help_text=_("Email de contacto de la sede.")
    )

    # Información Operativa
    area_m2 = models.DecimalField(
        _("área en m²"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_("Área total de la sede en metros cuadrados."),
    )

    capacidad_personas = models.PositiveIntegerField(
        _("capacidad de personas"),
        null=True,
        blank=True,
        help_text=_("Capacidad máxima de personas en la sede."),
    )

    fecha_apertura = models.DateField(
        _("fecha de apertura"),
        null=True,
        blank=True,
        help_text=_("Fecha de apertura o inicio de operaciones de la sede."),
    )

    horario_atencion = models.CharField(
        _("horario de atención"),
        max_length=100,
        blank=True,
        help_text=_("Horario de atención al público (ej: Lunes a Viernes 8:00-17:00)."),
    )

    # Responsable de la Sede
    responsable_nombre = models.CharField(
        _("nombre del responsable"),
        max_length=100,
        blank=True,
        help_text=_("Nombre completo del responsable de la sede."),
    )

    responsable_cargo = models.CharField(
        _("cargo del responsable"),
        max_length=100,
        blank=True,
        help_text=_("Cargo o posición del responsable de la sede."),
    )

    responsable_telefono = models.CharField(
        _("teléfono del responsable"),
        max_length=15,
        blank=True,
        validators=[
            RegexValidator(
                regex=r"^\+?[\d\s\-\(\)]{7,15}$",
                message=_("Número de teléfono debe tener un formato válido."),
            )
        ],
        help_text=_("Teléfono directo del responsable de la sede."),
    )

    responsable_email = models.EmailField(
        _("email del responsable"),
        blank=True,
        help_text=_("Email del responsable de la sede."),
    )

    # Observaciones
    observaciones = models.TextField(
        _("observaciones"),
        blank=True,
        max_length=500,
        help_text=_("Observaciones adicionales sobre la sede."),
    )

    class Meta:
        verbose_name = _("sede")
        verbose_name_plural = _("sedes")
        ordering = ["-es_principal", "nombre"]
        indexes = [
            models.Index(fields=["organization", "es_principal"]),
            models.Index(fields=["ciudad"]),
            models.Index(fields=["tipo_sede"]),
            models.Index(fields=["codigo_departamento"]),
            models.Index(fields=["codigo_municipio"]),
        ]
        constraints = [
            # Asegurar que solo hay una sede principal por organización activa
            models.UniqueConstraint(
                fields=["organization"],
                condition=models.Q(es_principal=True) & models.Q(deleted_at__isnull=True),
                name="unique_main_location_per_organization",
            ),
        ]

    def __str__(self):
        """Return string representation of the location."""
        principal_suffix = " (Principal)" if self.es_principal else ""
        return f"{self.nombre} - {self.ciudad}{principal_suffix}"

    def clean(self):
        """Validate model data."""
        super().clean()

        # Validar que hay al menos una sede principal por organización
        if self.es_principal:
            # Verificar si ya existe otra sede principal para esta organización (activa)
            existing_main = (
                Location.objects.filter(
                    organization=self.organization, es_principal=True
                )
                .exclude(pk=self.pk)
                .exists()
            )

            if existing_main:
                raise ValidationError(
                    {
                        "es_principal": _(
                            "Ya existe una sede principal para esta organización."
                        )
                    }
                )

    @property
    def direccion_completa(self):
        """Return complete address."""
        return f"{self.direccion}, {self.ciudad}, {self.departamento}, {self.pais}"

    def save(self, *args, **kwargs):
        """Override save method to handle business logic."""
        # Si es una nueva instancia y es la primera sede de la organización, marcarla como principal automáticamente
        is_new = self._state.adding
        if (
            is_new
            and not Location.objects.filter(organization=self.organization).exists()
        ):
            self.es_principal = True

        super().save(*args, **kwargs)


class SectorTemplate(FullBaseModel):
    """
    Model to store predefined templates for different economic sectors.

    These templates contain default configurations that can be applied
    to organizations based on their economic sector, enabling rapid
    parameterization.
    """

    # Usar los mismos sectores económicos que Organization
    SECTOR_CHOICES = Organization.SECTOR_ECONOMICO_CHOICES

    # Información Básica del Template
    sector = models.CharField(
        _("sector económico"),
        max_length=30,
        choices=SECTOR_CHOICES,
        help_text=_("Sector económico al que aplica este template."),
    )

    nombre_template = models.CharField(
        _("nombre del template"),
        max_length=100,
        help_text=_("Nombre descriptivo del template de configuración."),
    )

    descripcion = models.TextField(
        _("descripción"),
        max_length=500,
        help_text=_("Descripción detallada del template y sus características."),
    )

    # Configuración JSON
    data_json = models.JSONField(
        _("configuración JSON"),
        help_text=_(
            "Configuración predefinida en formato JSON para aplicar a la organización."
        ),
        default=dict,
    )

    # Versioning
    version = models.CharField(
        _("versión"),
        max_length=10,
        default="1.0",
        help_text=_("Versión del template para control de cambios."),
    )

    # Metadatos adicionales
    aplicaciones_exitosas = models.PositiveIntegerField(
        _("aplicaciones exitosas"),
        default=0,
        help_text=_("Número de veces que este template se ha aplicado exitosamente."),
    )

    fecha_ultima_aplicacion = models.DateTimeField(
        _("fecha última aplicación"),
        null=True,
        blank=True,
        help_text=_("Fecha y hora de la última aplicación exitosa del template."),
    )

    class Meta:
        verbose_name = _("template de sector")
        verbose_name_plural = _("templates de sector")
        ordering = ["sector", "nombre_template"]
        indexes = [
            models.Index(fields=["sector", "is_active"]),
            models.Index(fields=["version"]),
        ]
        constraints = [
            # Asegurar nombres únicos por sector y versión
            models.UniqueConstraint(
                fields=["sector", "nombre_template", "version"],
                condition=models.Q(is_active=True, deleted_at__isnull=True),
                name="unique_active_template_per_sector_version",
            ),
        ]

    def __str__(self):
        """Return string representation of the template."""
        return f"{self.get_sector_display()} - {self.nombre_template} v{self.version}"

    def clean(self):
        """Validate template data."""
        super().clean()

        # Validar estructura del JSON
        if self.data_json:
            required_keys = ["procesos", "indicadores", "documentos"]
            missing_keys = [key for key in required_keys if key not in self.data_json]

            if missing_keys:
                raise ValidationError(
                    {
                        "data_json": _(
                            f'El JSON debe contener las claves: {", ".join(required_keys)}. '
                            f'Faltan: {", ".join(missing_keys)}'
                        )
                    }
                )

    def aplicar_a_organizacion(self, organization, usuario=None):
        """
        Apply this template to an organization.

        Args:
            organization (Organization): Organization to apply template to
            usuario (User, optional): User performing the action

        Returns:
            dict: Result of the application with success status and details

        Raises:
            ValidationError: If template cannot be applied
        """
        from django.utils import timezone
        from django.db import transaction

        # Validar que el sector coincida
        if organization.sector_economico != self.sector:
            raise ValidationError(
                _(
                    "Este template es para el sector {}, pero la organización es del sector {}."
                ).format(
                    self.get_sector_display(),
                    organization.get_sector_economico_display(),
                )
            )

        resultado = {
            "success": False,
            "template_aplicado": self.nombre_template,
            "version": self.version,
            "elementos_creados": {},
            "errores": [],
            "timestamp": timezone.now(),
        }

        try:
            with transaction.atomic():
                # Aplicar configuración de procesos
                if "procesos" in self.data_json:
                    resultado["elementos_creados"]["procesos"] = self._aplicar_procesos(
                        organization, self.data_json["procesos"], usuario
                    )

                # Aplicar configuración de indicadores
                if "indicadores" in self.data_json:
                    resultado["elementos_creados"]["indicadores"] = (
                        self._aplicar_indicadores(
                            organization, self.data_json["indicadores"], usuario
                        )
                    )

                # Aplicar configuración de documentos
                if "documentos" in self.data_json:
                    resultado["elementos_creados"]["documentos"] = (
                        self._aplicar_documentos(
                            organization, self.data_json["documentos"], usuario
                        )
                    )

                # Actualizar estadísticas del template
                self.aplicaciones_exitosas += 1
                self.fecha_ultima_aplicacion = timezone.now()
                if usuario:
                    self.updated_by = usuario
                self.save(
                    update_fields=[
                        "aplicaciones_exitosas",
                        "fecha_ultima_aplicacion",
                        "updated_by",
                        "updated_at",
                    ]
                )

                resultado["success"] = True

        except Exception as e:
            resultado["errores"].append(str(e))
            raise ValidationError(_("Error aplicando template: {}").format(str(e)))

        return resultado

    def _aplicar_procesos(self, organization, config_procesos, usuario=None):
        """Apply process configuration from template."""
        # Placeholder para futura implementación con módulo de procesos
        procesos_creados = []

        for proceso_config in config_procesos:
            # Aquí se integrará con el módulo de procesos cuando esté disponible
            procesos_creados.append(
                {
                    "nombre": proceso_config.get("nombre"),
                    "tipo": proceso_config.get("tipo"),
                    "status": "pendiente_implementacion",
                }
            )

        return procesos_creados

    def _aplicar_indicadores(self, organization, config_indicadores, usuario=None):
        """Apply indicators configuration from template."""
        # Placeholder para futura implementación con módulo de indicadores
        indicadores_creados = []

        for indicador_config in config_indicadores:
            # Aquí se integrará con el módulo de indicadores cuando esté disponible
            indicadores_creados.append(
                {
                    "nombre": indicador_config.get("nombre"),
                    "formula": indicador_config.get("formula"),
                    "status": "pendiente_implementacion",
                }
            )

        return indicadores_creados

    def _aplicar_documentos(self, organization, config_documentos, usuario=None):
        """Apply documents configuration from template."""
        # Placeholder para futura implementación con módulo de documentos
        documentos_creados = []

        for documento_config in config_documentos:
            # Aquí se integrará con el módulo de documentos cuando esté disponible
            documentos_creados.append(
                {
                    "nombre": documento_config.get("nombre"),
                    "tipo": documento_config.get("tipo"),
                    "status": "pendiente_implementacion",
                }
            )

        return documentos_creados

    @classmethod
    def obtener_templates_por_sector(cls, sector):
        """
        Get all active templates for a specific sector.

        Args:
            sector (str): Sector code

        Returns:
            QuerySet: Active templates for the sector
        """
        return cls.active_objects.filter(sector=sector).order_by("nombre_template")

    @classmethod
    def crear_template_basico(cls, sector, nombre, descripcion, usuario=None):
        """
        Create a basic template for a sector with default configuration.

        Args:
            sector (str): Sector code
            nombre (str): Template name
            descripcion (str): Template description
            usuario (User, optional): User creating the template

        Returns:
            SectorTemplate: Created template
        """
        data_json_basica = {
            "procesos": [
                {
                    "nombre": "Planificación",
                    "tipo": "estrategico",
                    "descripcion": "Proceso de planificación estratégica",
                },
                {
                    "nombre": "Gestión de Recursos",
                    "tipo": "apoyo",
                    "descripcion": "Gestión de recursos humanos y materiales",
                },
                {
                    "nombre": "Operaciones Core",
                    "tipo": "operativo",
                    "descripcion": "Procesos operativos principales del sector",
                },
            ],
            "indicadores": [
                {
                    "nombre": "Satisfacción del Cliente",
                    "formula": "(Clientes satisfechos / Total clientes) * 100",
                    "tipo": "resultado",
                    "meta": 85,
                },
                {
                    "nombre": "Eficiencia Operacional",
                    "formula": "(Procesos completados exitosamente / Total procesos) * 100",
                    "tipo": "proceso",
                    "meta": 90,
                },
            ],
            "documentos": [
                {"nombre": "Manual de Calidad", "tipo": "manual", "obligatorio": True},
                {
                    "nombre": "Procedimientos Operativos",
                    "tipo": "procedimiento",
                    "obligatorio": True,
                },
            ],
        }

        template = cls.objects.create(
            sector=sector,
            nombre_template=nombre,
            descripcion=descripcion,
            data_json=data_json_basica,
            version="1.0",
            created_by=usuario,
            updated_by=usuario,
        )

        return template


class AuditLog(FullBaseModel):
    """
    Model to store audit log entries for tracking changes to Organization records.

    This model provides complete audit trail functionality including:
    - Who made the change (user)
    - What was changed (field-level changes)
    - When the change occurred (timestamp)
    - Ability to rollback to previous states
    """

    # Action Types
    ACTION_CREATE = "CREATE"
    ACTION_UPDATE = "UPDATE"
    ACTION_DELETE = "DELETE"
    ACTION_ROLLBACK = "ROLLBACK"

    ACTION_CHOICES = [
        (ACTION_CREATE, _("Crear")),
        (ACTION_UPDATE, _("Actualizar")),
        (ACTION_DELETE, _("Eliminar")),
        (ACTION_ROLLBACK, _("Rollback")),
    ]

    # Record Information
    table_name = models.CharField(
        _("nombre de tabla"),
        max_length=100,
        help_text=_("Nombre de la tabla afectada."),
    )

    record_id = models.CharField(
        _("ID del registro"),
        max_length=36,  # Para UUID
        help_text=_("ID del registro afectado."),
    )

    # Action Information
    action = models.CharField(
        _("acción"),
        max_length=10,
        choices=ACTION_CHOICES,
        help_text=_("Tipo de acción realizada."),
    )

    # Change Details
    old_values = models.JSONField(
        _("valores anteriores"),
        null=True,
        blank=True,
        help_text=_("Valores de los campos antes del cambio."),
    )

    new_values = models.JSONField(
        _("valores nuevos"),
        null=True,
        blank=True,
        help_text=_("Valores de los campos después del cambio."),
    )

    changed_fields = models.JSONField(
        _("campos modificados"),
        null=True,
        blank=True,
        help_text=_("Lista de campos que fueron modificados."),
    )

    # Context Information
    ip_address = models.GenericIPAddressField(
        _("dirección IP"),
        null=True,
        blank=True,
        help_text=_("Dirección IP desde donde se realizó el cambio."),
    )

    user_agent = models.TextField(
        _("user agent"),
        null=True,
        blank=True,
        help_text=_("User agent del navegador utilizado."),
    )

    session_key = models.CharField(
        _("clave de sesión"),
        max_length=40,
        null=True,
        blank=True,
        help_text=_("Clave de la sesión del usuario."),
    )

    # Additional Context
    reason = models.TextField(
        _("razón del cambio"),
        null=True,
        blank=True,
        help_text=_("Razón o comentario sobre el cambio realizado."),
    )

    class Meta:
        verbose_name = _("log de auditoría")
        verbose_name_plural = _("logs de auditoría")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["table_name", "record_id"]),
            models.Index(fields=["action"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["created_by"]),
        ]

    def __str__(self):
        """Return string representation of the audit log."""
        return f"{self.get_action_display()} - {self.table_name}:{self.record_id} - {self.created_at}"

    @classmethod
    def log_change(
        cls,
        instance,
        action,
        user=None,
        old_values=None,
        new_values=None,
        changed_fields=None,
        request=None,
        reason=None,
    ):
        """
        Create an audit log entry for a model instance change.

        Args:
            instance: The model instance that changed
            action: The action performed (CREATE, UPDATE, DELETE)
            user: User who made the change
            old_values: Dictionary of old field values
            new_values: Dictionary of new field values
            changed_fields: List of changed field names
            request: HTTP request object for context
            reason: Reason for the change

        Returns:
            AuditLog: Created audit log entry
        """
        # Get table name from model
        table_name = instance._meta.db_table

        # Get record ID
        record_id = str(instance.pk)

        # Extract request information if available
        ip_address = None
        user_agent = None
        session_key = None

        if request:
            # Get IP address
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(",")[0].strip()
            else:
                ip_address = request.META.get("REMOTE_ADDR")

            # Get user agent
            user_agent = request.META.get("HTTP_USER_AGENT", "")[
                :1000
            ]  # Truncate to avoid overflow

            # Get session key
            if hasattr(request, "session") and request.session.session_key:
                session_key = request.session.session_key

        # Create audit log entry
        audit_log = cls.objects.create(
            table_name=table_name,
            record_id=record_id,
            action=action,
            old_values=old_values or {},
            new_values=new_values or {},
            changed_fields=changed_fields or [],
            ip_address=ip_address,
            user_agent=user_agent,
            session_key=session_key,
            reason=reason,
            created_by=user,
        )

        return audit_log

    @classmethod
    def get_record_history(cls, instance, limit=None):
        """
        Get audit history for a specific record.

        Args:
            instance: Model instance to get history for
            limit: Maximum number of entries to return

        Returns:
            QuerySet: Audit log entries for the record
        """
        table_name = instance._meta.db_table
        record_id = str(instance.pk)

        queryset = cls.objects.filter(
            table_name=table_name, record_id=record_id
        ).order_by("-created_at")

        if limit:
            queryset = queryset[:limit]

        return queryset

    @classmethod
    def can_rollback(cls, instance, target_log_id):
        """
        Check if a record can be rolled back to a specific audit log state.

        Args:
            instance: Model instance to rollback
            target_log_id: ID of the audit log to rollback to

        Returns:
            tuple: (can_rollback: bool, reason: str)
        """
        table_name = instance._meta.db_table
        record_id = str(instance.pk)

        try:
            target_log = cls.objects.get(
                id=target_log_id, table_name=table_name, record_id=record_id
            )

            # Check if there are any conflicting changes after the target log
            newer_logs = cls.objects.filter(
                table_name=table_name,
                record_id=record_id,
                created_at__gt=target_log.created_at,
                action__in=[cls.ACTION_DELETE],
            )

            if newer_logs.exists():
                return False, _(
                    "No se puede hacer rollback porque el registro ha sido eliminado."
                )

            return True, _("Rollback disponible.")

        except cls.DoesNotExist:
            return False, _("Audit log no encontrado.")

    def perform_rollback(self, user=None, request=None, reason=None):
        """
        Perform rollback to the state represented by this audit log.

        Args:
            user: User performing the rollback
            request: HTTP request object
            reason: Reason for the rollback

        Returns:
            tuple: (success: bool, message: str, instance: Model or None)
        """
        try:
            # Get the model class
            from django.apps import apps

            # For organization table, map to Organization model
            if self.table_name == "organization_organization":
                model_class = Organization
            else:
                # For other tables, you can extend this mapping
                return (
                    False,
                    f"Rollback not supported for table {self.table_name}",
                    None,
                )

            # Get the instance
            try:
                instance = model_class.objects.get(pk=self.record_id)
            except model_class.DoesNotExist:
                return False, _("Registro no encontrado para rollback."), None

            # Check if rollback is possible
            can_rollback, rollback_reason = self.can_rollback(instance, self.id)
            if not can_rollback:
                return False, rollback_reason, None

            # Store current values before rollback
            current_values = {}
            changed_fields = []

            # Apply old values from this audit log
            for field_name, old_value in (self.old_values or {}).items():
                if hasattr(instance, field_name):
                    current_values[field_name] = getattr(instance, field_name)

                    # Only update if value is different
                    if current_values[field_name] != old_value:
                        setattr(instance, field_name, old_value)
                        changed_fields.append(field_name)

            # Save the instance if there are changes
            if changed_fields:
                instance.save()

                # Create rollback audit log
                AuditLog.log_change(
                    instance=instance,
                    action=AuditLog.ACTION_ROLLBACK,
                    user=user,
                    old_values=current_values,
                    new_values=self.old_values,
                    changed_fields=changed_fields,
                    request=request,
                    reason=f'Rollback to {self.created_at}: {reason or ""}',
                )

            return True, _("Rollback realizado exitosamente."), instance

        except Exception as e:
            return False, f"Error durante rollback: {str(e)}", None


class HealthOrganization(FullBaseModel):
    """
    Extension for health sector organizations (IPS - Instituciones Prestadoras de Servicios de Salud).
    
    This model stores additional fields required for Colombian health institutions
    to comply with Sistema Único de Habilitación (SUH) and REPS requirements.
    """
    
    # Naturaleza Jurídica Choices (específicos para salud)
    NATURALEZA_JURIDICA_CHOICES = [
        ('privada', _('Privada')),
        ('publica', _('Pública')),
        ('mixta', _('Mixta')),
    ]
    
    # Nivel de Complejidad Choices (según resolución 3100/2019)
    NIVEL_COMPLEJIDAD_CHOICES = [
        ('I', _('Nivel I - Baja Complejidad')),
        ('II', _('Nivel II - Mediana Complejidad')),
        ('III', _('Nivel III - Alta Complejidad')),
        ('IV', _('Nivel IV - Máxima Complejidad')),
    ]
    
    # Tipo de Prestador Choices
    TIPO_PRESTADOR_CHOICES = [
        ('IPS', _('IPS - Institución Prestadora de Servicios')),
        ('HOSPITAL', _('Hospital')),
        ('CLINICA', _('Clínica')),
        ('CENTRO_MEDICO', _('Centro Médico')),
        ('LABORATORIO', _('Laboratorio Clínico')),
        ('CENTRO_DIAGNOSTICO', _('Centro de Diagnóstico')),
        ('AMBULATORIO', _('Centro Ambulatorio')),
        ('OTRO', _('Otro')),
    ]
    
    # Tipo de Documento Choices para representante legal
    TIPO_DOCUMENTO_CHOICES = [
        ('CC', _('Cédula de Ciudadanía')),
        ('CE', _('Cédula de Extranjería')),
        ('PA', _('Pasaporte')),
        ('NIT', _('NIT')),
        ('TI', _('Tarjeta de Identidad')),
    ]
    
    # Relación con Organization (OneToOne)
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='health_profile',
        verbose_name=_('organización'),
        help_text=_('Organización base a la que pertenece este perfil de salud.')
    )
    
    # === INFORMACIÓN REPS ===
    codigo_prestador = models.CharField(
        _('código prestador REPS'),
        max_length=12,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\d{12}$',
                message=_('El código prestador debe tener exactamente 12 dígitos.')
            )
        ],
        help_text=_('Código de 12 dígitos asignado por el Ministerio de Salud en REPS.')
    )
    
    verificado_reps = models.BooleanField(
        _('verificado en REPS'),
        default=False,
        help_text=_('Indica si el código prestador ha sido verificado contra REPS.')
    )
    
    fecha_verificacion_reps = models.DateTimeField(
        _('fecha verificación REPS'),
        null=True,
        blank=True,
        help_text=_('Fecha y hora de la última verificación contra REPS.')
    )
    
    datos_reps = models.JSONField(
        _('datos REPS'),
        null=True,
        blank=True,
        help_text=_('Datos adicionales obtenidos de REPS (nombre, dirección, etc.).')
    )
    
    # === CLASIFICACIÓN INSTITUCIONAL ===
    naturaleza_juridica = models.CharField(
        _('naturaleza jurídica'),
        max_length=10,
        choices=NATURALEZA_JURIDICA_CHOICES,
        help_text=_('Naturaleza jurídica de la institución de salud.')
    )
    
    tipo_prestador = models.CharField(
        _('tipo de prestador'),
        max_length=20,
        choices=TIPO_PRESTADOR_CHOICES,
        default='IPS',
        help_text=_('Tipo de prestador de servicios de salud.')
    )
    
    nivel_complejidad = models.CharField(
        _('nivel de complejidad'),
        max_length=3,
        choices=NIVEL_COMPLEJIDAD_CHOICES,
        help_text=_('Nivel de complejidad según capacidad resolutiva.')
    )
    
    # === REPRESENTANTE LEGAL ===
    representante_tipo_documento = models.CharField(
        _('tipo documento representante'),
        max_length=3,
        choices=TIPO_DOCUMENTO_CHOICES,
        help_text=_('Tipo de documento del representante legal.')
    )
    
    representante_numero_documento = models.CharField(
        _('número documento representante'),
        max_length=20,
        help_text=_('Número de documento del representante legal.')
    )
    
    representante_nombre_completo = models.CharField(
        _('nombre completo representante'),
        max_length=200,
        help_text=_('Nombre completo del representante legal.')
    )
    
    representante_telefono = models.CharField(
        _('teléfono representante'),
        max_length=15,
        validators=[
            RegexValidator(
                regex=r'^\+?[\d\s\-\(\)]{7,15}$',
                message=_('Número de teléfono debe tener un formato válido.')
            )
        ],
        help_text=_('Teléfono de contacto del representante legal.')
    )
    
    representante_email = models.EmailField(
        _('email representante'),
        help_text=_('Correo electrónico del representante legal.')
    )
    
    # === INFORMACIÓN DE HABILITACIÓN ===
    fecha_habilitacion = models.DateField(
        _('fecha de habilitación'),
        null=True,
        blank=True,
        help_text=_('Fecha de habilitación inicial de la institución.')
    )
    
    resolucion_habilitacion = models.CharField(
        _('resolución de habilitación'),
        max_length=50,
        blank=True,
        help_text=_('Número de resolución que otorga la habilitación.')
    )
    
    registro_especial = models.CharField(
        _('registro especial'),
        max_length=50,
        blank=True,
        help_text=_('Número de registro especial si aplica.')
    )
    
    # === INFORMACIÓN ADICIONAL ===
    servicios_habilitados_count = models.PositiveIntegerField(
        _('cantidad servicios habilitados'),
        default=0,
        help_text=_('Contador de servicios habilitados (se actualiza automáticamente).')
    )
    
    observaciones_salud = models.TextField(
        _('observaciones de salud'),
        blank=True,
        max_length=1000,
        help_text=_('Observaciones específicas del perfil de salud.')
    )
    
    class Meta:
        verbose_name = _('organización de salud')
        verbose_name_plural = _('organizaciones de salud')
        ordering = ['organization__razon_social']
        indexes = [
            models.Index(fields=['codigo_prestador']),
            models.Index(fields=['nivel_complejidad']),
            models.Index(fields=['tipo_prestador']),
            models.Index(fields=['naturaleza_juridica']),
            models.Index(fields=['verificado_reps']),
        ]
        constraints = [
            # Asegurar que el código prestador sea único entre registros activos
            models.UniqueConstraint(
                fields=['codigo_prestador'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_active_codigo_prestador'
            ),
        ]
    
    def __str__(self):
        """Return string representation of the health organization."""
        return f"{self.organization.razon_social} - {self.codigo_prestador}"
    
    @property
    def codigo_prestador_formatted(self):
        """Return formatted provider code (XXXX-XXXX-XXXX)."""
        if len(self.codigo_prestador) == 12:
            return f"{self.codigo_prestador[:4]}-{self.codigo_prestador[4:8]}-{self.codigo_prestador[8:]}"
        return self.codigo_prestador
    
    @property
    def representante_documento_completo(self):
        """Return complete legal representative document."""
        return f"{self.representante_tipo_documento} {self.representante_numero_documento}"
    
    @property
    def servicios_activos(self):
        """Return count of active health services."""
        return self.services.filter(estado='activo').count()
    
    def clean(self):
        """Validate health organization data."""
        super().clean()
        
        # Validar que la organización base sea del sector salud
        if hasattr(self, 'organization') and self.organization:
            if self.organization.sector_economico != 'salud':
                raise ValidationError({
                    'organization': _('La organización debe pertenecer al sector salud.')
                })
        
        # Validar formato del código prestador
        if self.codigo_prestador and len(self.codigo_prestador) != 12:
            raise ValidationError({
                'codigo_prestador': _('El código prestador debe tener exactamente 12 dígitos.')
            })
        
        # Validar coherencia de nivel de complejidad con tipo de prestador
        if self.nivel_complejidad == 'IV' and self.tipo_prestador not in ['HOSPITAL', 'CLINICA']:
            raise ValidationError({
                'nivel_complejidad': _('Solo hospitales y clínicas pueden tener nivel de complejidad IV.')
            })
    
    def actualizar_contador_servicios(self):
        """Update the services counter."""
        self.servicios_habilitados_count = self.services.filter(estado='activo').count()
        self.save(update_fields=['servicios_habilitados_count'])
    
    @classmethod
    def get_by_codigo_prestador(cls, codigo):
        """Get health organization by provider code."""
        try:
            return cls.objects.get(codigo_prestador=codigo, deleted_at__isnull=True)
        except cls.DoesNotExist:
            return None


class HealthService(FullBaseModel):
    """
    Health services enabled for the organization according to REPS.
    
    This model stores all health services that the organization is authorized
    to provide according to Resolución 3100/2019 and REPS registration.
    """
    
    # Estado del Servicio Choices
    ESTADO_CHOICES = [
        ('activo', _('Activo')),
        ('suspendido', _('Suspendido')),
        ('cancelado', _('Cancelado')),
        ('en_tramite', _('En Trámite')),
    ]
    
    # Modalidad del Servicio Choices
    MODALIDAD_CHOICES = [
        ('intramural', _('Intramural')),
        ('extramural', _('Extramural')),
        ('telemedicina', _('Telemedicina')),
        ('domiciliaria', _('Domiciliaria')),
    ]
    
    # Grupo de Servicios Choices (según Res. 3100/2019)
    GRUPO_SERVICIO_CHOICES = [
        ('consulta_externa', _('Consulta Externa')),
        ('apoyo_diagnostico', _('Apoyo Diagnóstico')),
        ('quirurgicos', _('Quirúrgicos')),
        ('internacion', _('Internación')),
        ('cuidados_intensivos', _('Cuidados Intensivos')),
        ('urgencias', _('Urgencias')),
        ('otros', _('Otros')),
    ]
    
    # Relación con HealthOrganization
    health_organization = models.ForeignKey(
        HealthOrganization,
        on_delete=models.CASCADE,
        related_name='services',
        verbose_name=_('organización de salud'),
        help_text=_('Organización de salud que presta este servicio.')
    )
    
    # === INFORMACIÓN DEL SERVICIO ===
    codigo_servicio = models.CharField(
        _('código del servicio'),
        max_length=10,
        validators=[
            RegexValidator(
                regex=r'^\d{3,4}$',
                message=_('El código del servicio debe tener 3 o 4 dígitos.')
            )
        ],
        help_text=_('Código del servicio según Resolución 3100/2019.')
    )
    
    nombre_servicio = models.CharField(
        _('nombre del servicio'),
        max_length=200,
        help_text=_('Nombre completo del servicio de salud.')
    )
    
    grupo_servicio = models.CharField(
        _('grupo del servicio'),
        max_length=25,
        choices=GRUPO_SERVICIO_CHOICES,
        help_text=_('Grupo al que pertenece el servicio.')
    )
    
    descripcion_servicio = models.TextField(
        _('descripción del servicio'),
        blank=True,
        max_length=500,
        help_text=_('Descripción detallada del servicio.')
    )
    
    # === FECHAS Y VIGENCIA ===
    fecha_habilitacion = models.DateField(
        _('fecha de habilitación'),
        help_text=_('Fecha en que se habilitó el servicio.')
    )
    
    fecha_vencimiento = models.DateField(
        _('fecha de vencimiento'),
        null=True,
        blank=True,
        help_text=_('Fecha de vencimiento de la habilitación (si aplica).')
    )
    
    # === ESTADO Y MODALIDAD ===
    estado = models.CharField(
        _('estado'),
        max_length=15,
        choices=ESTADO_CHOICES,
        default='activo',
        help_text=_('Estado actual del servicio.')
    )
    
    modalidad = models.CharField(
        _('modalidad'),
        max_length=15,
        choices=MODALIDAD_CHOICES,
        default='intramural',
        help_text=_('Modalidad de prestación del servicio.')
    )
    
    # === UBICACIÓN Y CAPACIDAD ===
    sede_prestacion = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name='health_services',
        verbose_name=_('sede de prestación'),
        help_text=_('Sede donde se presta el servicio.')
    )
    
    capacidad_instalada = models.PositiveIntegerField(
        _('capacidad instalada'),
        null=True,
        blank=True,
        help_text=_('Capacidad instalada para el servicio (camas, consultorios, etc.).')
    )
    
    # === INFORMACIÓN REGULATORIA ===
    numero_resolucion = models.CharField(
        _('número de resolución'),
        max_length=50,
        blank=True,
        help_text=_('Número de resolución que autoriza el servicio.')
    )
    
    entidad_autorizante = models.CharField(
        _('entidad autorizante'),
        max_length=100,
        blank=True,
        help_text=_('Entidad que autorizó el servicio (Secretaría de Salud, etc.).')
    )
    
    fecha_ultima_visita = models.DateField(
        _('fecha última visita'),
        null=True,
        blank=True,
        help_text=_('Fecha de la última visita de habilitación o seguimiento.')
    )
    
    # === INFORMACIÓN ADICIONAL ===
    observaciones = models.TextField(
        _('observaciones'),
        blank=True,
        max_length=500,
        help_text=_('Observaciones adicionales sobre el servicio.')
    )
    
    requiere_autorizacion = models.BooleanField(
        _('requiere autorización'),
        default=False,
        help_text=_('Indica si el servicio requiere autorización previa.')
    )
    
    dias_atencion = models.CharField(
        _('días de atención'),
        max_length=50,
        blank=True,
        help_text=_('Días de la semana en que se presta el servicio.')
    )
    
    horario_atencion = models.CharField(
        _('horario de atención'),
        max_length=100,
        blank=True,
        help_text=_('Horario de atención del servicio.')
    )
    
    class Meta:
        verbose_name = _('servicio de salud')
        verbose_name_plural = _('servicios de salud')
        ordering = ['grupo_servicio', 'nombre_servicio']
        indexes = [
            models.Index(fields=['codigo_servicio']),
            models.Index(fields=['estado']),
            models.Index(fields=['grupo_servicio']),
            models.Index(fields=['modalidad']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['health_organization', 'estado']),
        ]
        constraints = [
            # Un servicio por código por organización por sede
            models.UniqueConstraint(
                fields=['health_organization', 'codigo_servicio', 'sede_prestacion'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_service_per_organization_location'
            ),
        ]
    
    def __str__(self):
        """Return string representation of the health service."""
        return f"{self.codigo_servicio} - {self.nombre_servicio}"
    
    @property
    def esta_vigente(self):
        """Check if service is currently valid."""
        from django.utils import timezone
        
        if self.estado != 'activo':
            return False
        
        if self.fecha_vencimiento:
            return timezone.now().date() <= self.fecha_vencimiento
        
        return True
    
    @property
    def dias_para_vencimiento(self):
        """Get days until expiration."""
        from django.utils import timezone
        
        if not self.fecha_vencimiento:
            return None
        
        today = timezone.now().date()
        if self.fecha_vencimiento > today:
            return (self.fecha_vencimiento - today).days
        else:
            return 0  # Already expired
    
    def clean(self):
        """Validate health service data."""
        super().clean()
        
        # Validar que la fecha de vencimiento sea posterior a la habilitación
        if self.fecha_vencimiento and self.fecha_habilitacion:
            if self.fecha_vencimiento <= self.fecha_habilitacion:
                raise ValidationError({
                    'fecha_vencimiento': _('La fecha de vencimiento debe ser posterior a la fecha de habilitación.')
                })
        
        # Validar que la sede pertenezca a la misma organización
        if hasattr(self, 'sede_prestacion') and hasattr(self, 'health_organization'):
            if self.sede_prestacion.organization != self.health_organization.organization:
                raise ValidationError({
                    'sede_prestacion': _('La sede debe pertenecer a la misma organización.')
                })
    
    def save(self, *args, **kwargs):
        """Override save to update organization service counter."""
        super().save(*args, **kwargs)
        
        # Actualizar contador de servicios en la organización
        if hasattr(self, 'health_organization'):
            self.health_organization.actualizar_contador_servicios()
    
    def delete(self, *args, **kwargs):
        """Override delete to update organization service counter."""
        health_org = self.health_organization
        super().delete(*args, **kwargs)
        
        # Actualizar contador de servicios en la organización
        if health_org:
            health_org.actualizar_contador_servicios()
    
    @classmethod
    def get_servicios_por_grupo(cls, health_organization, grupo):
        """Get services by group for a health organization."""
        return cls.objects.filter(
            health_organization=health_organization,
            grupo_servicio=grupo,
            estado='activo'
        ).order_by('nombre_servicio')
    
    @classmethod
    def get_servicios_proximos_vencer(cls, health_organization, dias=60):
        """Get services expiring within specified days."""
        from django.utils import timezone
        from datetime import timedelta
        
        fecha_limite = timezone.now().date() + timedelta(days=dias)
        
        return cls.objects.filter(
            health_organization=health_organization,
            estado='activo',
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=timezone.now().date()
        ).order_by('fecha_vencimiento')
    
    def marcar_como_vencido(self):
        """Mark service as expired."""
        self.estado = 'suspendido'
        self.observaciones += f"\nServicio marcado como vencido automáticamente el {timezone.now().date()}"
        self.save(update_fields=['estado', 'observaciones'])


# ================================
# SUH (Sistema Único de Habilitación) Models
# ================================

class SUHExtraction(FullBaseModel):
    """
    Model to manage SUH (Sistema Único de Habilitación) extractions.
    Tracks all automatic extractions from the Ministry of Health portal.
    """
    
    EXTRACTION_STATUS = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('failed', 'Fallida'),
        ('partial', 'Parcial'),
    ]
    
    SOURCE_CHOICES = [
        ('SUH_PORTAL', 'Portal SUH MinSalud'),
        ('MANUAL_ENTRY', 'Entrada Manual'),
        ('API_IMPORT', 'Importación API'),
    ]
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='suh_extractions',
        verbose_name=_('Organización')
    )
    
    # Extraction metadata
    extraction_id = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_('ID de Extracción'),
        help_text=_('Identificador único de la extracción')
    )
    
    status = models.CharField(
        max_length=20,
        choices=EXTRACTION_STATUS,
        default='pending',
        verbose_name=_('Estado')
    )
    
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default='SUH_PORTAL',
        verbose_name=_('Fuente')
    )
    
    # Portal information
    nit_consulta = models.CharField(
        max_length=15,
        validators=[RegexValidator(r'^\d{9,11}$')],
        verbose_name=_('NIT de Consulta'),
        help_text=_('NIT usado para la consulta en el portal SUH')
    )
    
    # Extraction timing
    started_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Iniciado')
    )
    
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Completado')
    )
    
    # Results
    extracted_data = models.JSONField(
        default=dict,
        verbose_name=_('Datos Extraídos'),
        help_text=_('Datos completos extraídos del portal SUH en formato JSON')
    )
    
    validation_results = models.JSONField(
        default=dict,
        verbose_name=_('Resultados de Validación'),
        help_text=_('Resultados de validación y discrepancias detectadas')
    )
    
    # Error handling
    error_message = models.TextField(
        blank=True,
        verbose_name=_('Mensaje de Error'),
        help_text=_('Descripción del error si la extracción falló')
    )
    
    extraction_logs = models.JSONField(
        default=list,
        verbose_name=_('Logs de Extracción'),
        help_text=_('Logs detallados del proceso de extracción')
    )
    
    # Statistics
    total_sedes_extracted = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Sedes Extraídas')
    )
    
    total_servicios_extracted = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Servicios Extraídos')
    )
    
    class Meta:
        verbose_name = _('Extracción SUH')
        verbose_name_plural = _('Extracciones SUH')
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['nit_consulta']),
            models.Index(fields=['started_at']),
        ]
    
    def __str__(self):
        return f"SUH-{self.extraction_id} - {self.organization.razon_social}"
    
    @property
    def duration(self):
        """Calculate extraction duration."""
        if self.completed_at:
            return self.completed_at - self.started_at
        return None
    
    @property
    def is_successful(self):
        """Check if extraction was successful."""
        return self.status == 'completed' and self.extracted_data
    
    def mark_as_completed(self):
        """Mark extraction as completed."""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])
    
    def mark_as_failed(self, error_message):
        """Mark extraction as failed with error message."""
        self.status = 'failed'
        self.error_message = error_message
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'error_message', 'completed_at'])


class SUHDataMapping(FullBaseModel):
    """
    Model to store field mappings between SUH portal data and QMS data structures.
    Allows for configurable data transformation and mapping.
    """
    
    FIELD_TYPES = [
        ('string', 'Texto'),
        ('integer', 'Número Entero'),
        ('decimal', 'Número Decimal'),
        ('date', 'Fecha'),
        ('boolean', 'Booleano'),
        ('json', 'JSON'),
    ]
    
    extraction = models.ForeignKey(
        SUHExtraction,
        on_delete=models.CASCADE,
        related_name='data_mappings',
        verbose_name=_('Extracción SUH')
    )
    
    # Field mapping
    suh_field_name = models.CharField(
        max_length=100,
        verbose_name=_('Campo SUH'),
        help_text=_('Nombre del campo en el portal SUH')
    )
    
    qms_field_name = models.CharField(
        max_length=100,
        verbose_name=_('Campo QMS'),
        help_text=_('Nombre del campo correspondiente en QMS')
    )
    
    field_type = models.CharField(
        max_length=20,
        choices=FIELD_TYPES,
        verbose_name=_('Tipo de Campo')
    )
    
    # Values
    suh_value = models.TextField(
        blank=True,
        verbose_name=_('Valor SUH'),
        help_text=_('Valor extraído del portal SUH')
    )
    
    qms_value = models.TextField(
        blank=True,
        verbose_name=_('Valor QMS'),
        help_text=_('Valor transformado para QMS')
    )
    
    # Validation
    is_valid = models.BooleanField(
        default=True,
        verbose_name=_('Es Válido')
    )
    
    validation_notes = models.TextField(
        blank=True,
        verbose_name=_('Notas de Validación')
    )
    
    # Mapping configuration
    transformation_rule = models.JSONField(
        default=dict,
        verbose_name=_('Regla de Transformación'),
        help_text=_('Reglas para transformar el valor de SUH a QMS')
    )
    
    class Meta:
        verbose_name = _('Mapeo de Datos SUH')
        verbose_name_plural = _('Mapeos de Datos SUH')
        unique_together = ['extraction', 'suh_field_name', 'qms_field_name']
        indexes = [
            models.Index(fields=['extraction', 'is_valid']),
            models.Index(fields=['suh_field_name']),
        ]
    
    def __str__(self):
        return f"{self.suh_field_name} → {self.qms_field_name}"


class SUHDiscrepancy(FullBaseModel):
    """
    Model to track discrepancies between SUH extracted data and existing QMS data.
    Supports the tripartite resolution strategy (Critical/Important/Minor).
    """
    
    DISCREPANCY_LEVELS = [
        ('CRITICAL', 'Crítica'),
        ('IMPORTANT', 'Importante'),
        ('MINOR', 'Menor'),
    ]
    
    RESOLUTION_STATUS = [
        ('pending', 'Pendiente'),
        ('suh_accepted', 'SUH Aceptado'),
        ('qms_kept', 'QMS Mantenido'),
        ('manual_resolved', 'Resuelto Manualmente'),
        ('ignored', 'Ignorado'),
    ]
    
    extraction = models.ForeignKey(
        SUHExtraction,
        on_delete=models.CASCADE,
        related_name='discrepancies',
        verbose_name=_('Extracción SUH')
    )
    
    # Discrepancy details
    field_name = models.CharField(
        max_length=100,
        verbose_name=_('Campo'),
        help_text=_('Nombre del campo con discrepancia')
    )
    
    level = models.CharField(
        max_length=20,
        choices=DISCREPANCY_LEVELS,
        verbose_name=_('Nivel de Criticidad')
    )
    
    # Values
    suh_value = models.TextField(
        verbose_name=_('Valor SUH'),
        help_text=_('Valor del portal SUH')
    )
    
    qms_value = models.TextField(
        verbose_name=_('Valor QMS'),
        help_text=_('Valor actual en QMS')
    )
    
    # Resolution
    resolution_status = models.CharField(
        max_length=20,
        choices=RESOLUTION_STATUS,
        default='pending',
        verbose_name=_('Estado de Resolución')
    )
    
    final_value = models.TextField(
        blank=True,
        verbose_name=_('Valor Final'),
        help_text=_('Valor final después de resolución')
    )
    
    resolution_notes = models.TextField(
        blank=True,
        verbose_name=_('Notas de Resolución'),
        help_text=_('Justificación para la resolución')
    )
    
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_('Resuelto por')
    )
    
    resolved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Resuelto el')
    )
    
    # Impact assessment
    regulatory_impact = models.TextField(
        blank=True,
        verbose_name=_('Impacto Regulatorio'),
        help_text=_('Descripción del impacto regulatorio de la discrepancia')
    )
    
    auto_resolution_suggested = models.BooleanField(
        default=False,
        verbose_name=_('Resolución Automática Sugerida')
    )
    
    class Meta:
        verbose_name = _('Discrepancia SUH')
        verbose_name_plural = _('Discrepancias SUH')
        ordering = ['level', '-created_at']
        indexes = [
            models.Index(fields=['extraction', 'resolution_status']),
            models.Index(fields=['level', 'resolution_status']),
        ]
    
    def __str__(self):
        return f"{self.field_name} - {self.get_level_display()}"
    
    @property
    def requires_manual_resolution(self):
        """Check if discrepancy requires manual resolution."""
        return self.level == 'CRITICAL' and self.resolution_status == 'pending'
    
    def resolve_with_suh(self, user, notes=""):
        """Resolve discrepancy accepting SUH value."""
        self.resolution_status = 'suh_accepted'
        self.final_value = self.suh_value
        self.resolution_notes = notes
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.save()
    
    def resolve_with_qms(self, user, notes=""):
        """Resolve discrepancy keeping QMS value."""
        self.resolution_status = 'qms_kept'
        self.final_value = self.qms_value
        self.resolution_notes = notes
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.save()


class SUHSyncSchedule(FullBaseModel):
    """
    Model to manage automatic synchronization schedules with SUH portal.
    Supports periodic updates to keep QMS data in sync with official registry.
    """
    
    SYNC_FREQUENCIES = [
        ('daily', 'Diario'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
        ('quarterly', 'Trimestral'),
        ('manual', 'Manual'),
    ]
    
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='suh_sync_schedule',
        verbose_name=_('Organización')
    )
    
    # Schedule configuration
    is_active = models.BooleanField(
        default=True,
        verbose_name=_('Activo')
    )
    
    frequency = models.CharField(
        max_length=20,
        choices=SYNC_FREQUENCIES,
        default='monthly',
        verbose_name=_('Frecuencia')
    )
    
    # Timing
    next_sync_date = models.DateTimeField(
        verbose_name=_('Próxima Sincronización')
    )
    
    last_sync_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Última Sincronización')
    )
    
    # Settings
    auto_resolve_minor = models.BooleanField(
        default=False,
        verbose_name=_('Auto-resolver Discrepancias Menores'),
        help_text=_('Resolver automáticamente discrepancias de nivel menor')
    )
    
    notify_on_discrepancies = models.BooleanField(
        default=True,
        verbose_name=_('Notificar Discrepancias'),
        help_text=_('Enviar notificaciones cuando se detecten discrepancias')
    )
    
    # Notification settings
    notification_emails = models.JSONField(
        default=list,
        verbose_name=_('Emails de Notificación'),
        help_text=_('Lista de emails para notificaciones de sincronización')
    )
    
    # Statistics
    total_syncs_completed = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Sincronizaciones Completadas')
    )
    
    total_discrepancies_found = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Discrepancias Encontradas')
    )
    
    class Meta:
        verbose_name = _('Programación Sincronización SUH')
        verbose_name_plural = _('Programaciones Sincronización SUH')
        indexes = [
            models.Index(fields=['is_active', 'next_sync_date']),
            models.Index(fields=['organization']),
        ]
    
    def __str__(self):
        return f"Sync {self.organization.razon_social} - {self.get_frequency_display()}"
    
    def calculate_next_sync(self):
        """Calculate next synchronization date based on frequency."""
        from datetime import timedelta
        
        base_date = self.last_sync_date or timezone.now()
        
        if self.frequency == 'daily':
            self.next_sync_date = base_date + timedelta(days=1)
        elif self.frequency == 'weekly':
            self.next_sync_date = base_date + timedelta(weeks=1)
        elif self.frequency == 'monthly':
            self.next_sync_date = base_date + timedelta(days=30)
        elif self.frequency == 'quarterly':
            self.next_sync_date = base_date + timedelta(days=90)
        else:  # manual
            self.next_sync_date = None
        
        self.save(update_fields=['next_sync_date'])
    
    def is_due_for_sync(self):
        """Check if sync is due."""
        if not self.is_active or not self.next_sync_date:
            return False
        return timezone.now() >= self.next_sync_date
    
    def record_sync_completion(self, discrepancies_count=0):
        """Record completion of a sync operation."""
        self.last_sync_date = timezone.now()
        self.total_syncs_completed += 1
        self.total_discrepancies_found += discrepancies_count
        self.calculate_next_sync()
        self.save(update_fields=[
            'last_sync_date', 
            'total_syncs_completed', 
            'total_discrepancies_found'
        ])


class SedePrestadora(FullBaseModel):
    """
    Modelo para gestionar las sedes prestadoras de servicios de salud.
    Cada organización de salud puede tener múltiples sedes.
    """
    
    # Estados de la sede
    ESTADO_SEDE_CHOICES = [
        ('activa', _('Activa')),
        ('inactiva', _('Inactiva')),
        ('suspendida', _('Suspendida')),
        ('en_proceso', _('En Proceso de Habilitación')),
        ('cerrada', _('Cerrada Permanentemente')),
    ]
    
    # Tipos de sede
    TIPO_SEDE_CHOICES = [
        ('principal', _('Sede Principal')),
        ('sucursal', _('Sucursal')),
        ('ambulatoria', _('Sede Ambulatoria')),
        ('hospitalaria', _('Sede Hospitalaria')),
        ('administrativa', _('Sede Administrativa')),
        ('diagnostico', _('Centro de Diagnóstico')),
        ('urgencias', _('Centro de Urgencias')),
    ]
    
    # Relación con organización de salud
    health_organization = models.ForeignKey(
        'HealthOrganization',
        on_delete=models.CASCADE,
        related_name='sedes',
        verbose_name=_('Organización de Salud'),
        help_text=_('Organización de salud a la que pertenece esta sede.')
    )
    
    # Identificación de la sede
    numero_sede = models.CharField(
        _('número de sede'),
        max_length=10,
        help_text=_('Número único de identificación de la sede (ej: 01, 02, 03)')
    )
    
    codigo_prestador = models.CharField(
        _('código de prestador'),
        max_length=20,
        help_text=_('Código de habilitación del prestador para esta sede')
    )
    
    # Información básica
    nombre_sede = models.CharField(
        _('nombre de la sede'),
        max_length=200,
        help_text=_('Nombre descriptivo de la sede.')
    )
    
    tipo_sede = models.CharField(
        _('tipo de sede'),
        max_length=20,
        choices=TIPO_SEDE_CHOICES,
        default='sucursal',
        help_text=_('Tipo o clasificación de la sede.')
    )
    
    es_sede_principal = models.BooleanField(
        _('es sede principal'),
        default=False,
        help_text=_('Indica si es la sede principal de la organización')
    )
    
    # Ubicación
    direccion = models.CharField(
        _('dirección'),
        max_length=255,
        help_text=_('Dirección completa de la sede.')
    )
    
    departamento = models.CharField(
        _('departamento'),
        max_length=100,
        help_text=_('Departamento donde se encuentra la sede.')
    )
    
    municipio = models.CharField(
        _('municipio'),
        max_length=100,
        help_text=_('Municipio donde se encuentra la sede.')
    )
    
    barrio = models.CharField(
        _('barrio'),
        max_length=100,
        blank=True,
        help_text=_('Barrio donde se encuentra la sede.')
    )
    
    codigo_postal = models.CharField(
        _('código postal'),
        max_length=10,
        blank=True,
        help_text=_('Código postal de la dirección.')
    )
    
    # Georeferenciación
    latitud = models.DecimalField(
        _('latitud'),
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text=_('Coordenada latitud de la sede.')
    )
    
    longitud = models.DecimalField(
        _('longitud'),
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text=_('Coordenada longitud de la sede.')
    )
    
    # Contacto
    telefono_principal = models.CharField(
        _('teléfono principal'),
        max_length=20,
        validators=[
            RegexValidator(
                regex=r'^\+?[\d\s\-\(\)]{7,20}$',
                message=_('Número de teléfono debe tener un formato válido.')
            )
        ],
        help_text=_('Teléfono principal de contacto de la sede.')
    )
    
    telefono_secundario = models.CharField(
        _('teléfono secundario'),
        max_length=20,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?[\d\s\-\(\)]{7,20}$',
                message=_('Número de teléfono debe tener un formato válido.')
            )
        ],
        help_text=_('Teléfono secundario de contacto de la sede.')
    )
    
    email = models.EmailField(
        _('email de contacto'),
        help_text=_('Correo electrónico de contacto de la sede.')
    )
    
    # Responsable de la sede
    nombre_responsable = models.CharField(
        _('nombre del responsable'),
        max_length=200,
        help_text=_('Nombre completo del responsable de la sede.')
    )
    
    cargo_responsable = models.CharField(
        _('cargo del responsable'),
        max_length=100,
        help_text=_('Cargo o posición del responsable de la sede.')
    )
    
    telefono_responsable = models.CharField(
        _('teléfono del responsable'),
        max_length=20,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?[\d\s\-\(\)]{7,20}$',
                message=_('Número de teléfono debe tener un formato válido.')
            )
        ],
        help_text=_('Teléfono del responsable de la sede.')
    )
    
    email_responsable = models.EmailField(
        _('email del responsable'),
        blank=True,
        help_text=_('Correo electrónico del responsable de la sede.')
    )
    
    # Estado y habilitación
    estado = models.CharField(
        _('estado'),
        max_length=20,
        choices=ESTADO_SEDE_CHOICES,
        default='activa',
        help_text=_('Estado actual de la sede.')
    )
    
    fecha_habilitacion = models.DateField(
        _('fecha de habilitación'),
        null=True,
        blank=True,
        help_text=_('Fecha en que se habilitó la sede.')
    )
    
    fecha_renovacion = models.DateField(
        _('fecha de renovación'),
        null=True,
        blank=True,
        help_text=_('Fecha de renovación de la habilitación.')
    )
    
    # Capacidad instalada
    numero_camas = models.IntegerField(
        _('número de camas'),
        default=0,
        help_text=_('Número total de camas disponibles.')
    )
    
    numero_consultorios = models.IntegerField(
        _('número de consultorios'),
        default=0,
        help_text=_('Número total de consultorios disponibles.')
    )
    
    numero_quirofanos = models.IntegerField(
        _('número de quirófanos'),
        default=0,
        help_text=_('Número total de quirófanos disponibles.')
    )
    
    # Horarios de atención
    horario_atencion = models.JSONField(
        _('horario de atención'),
        default=dict,
        help_text=_('Horarios de atención por día de la semana en formato JSON.')
    )
    
    atencion_24_horas = models.BooleanField(
        _('atención 24 horas'),
        default=False,
        help_text=_('Indica si la sede ofrece atención las 24 horas.')
    )
    
    # Servicios habilitados (relación con servicios)
    servicios_habilitados = models.ManyToManyField(
        'HealthService',
        through='SedeServicio',
        related_name='sedes_prestadoras',
        verbose_name=_('servicios habilitados'),
        blank=True
    )
    
    # Metadata
    observaciones = models.TextField(
        _('observaciones'),
        blank=True,
        help_text=_('Observaciones adicionales sobre la sede.')
    )
    
    # Datos de importación
    imported_from_file = models.BooleanField(
        _('importado desde archivo'),
        default=False,
        help_text=_('Indica si la sede fue importada desde un archivo.')
    )
    
    import_date = models.DateTimeField(
        _('fecha de importación'),
        null=True,
        blank=True,
        help_text=_('Fecha y hora en que se importó la sede.')
    )
    
    class Meta:
        verbose_name = _('sede prestadora')
        verbose_name_plural = _('sedes prestadoras')
        unique_together = [
            ['health_organization', 'numero_sede'],
            ['health_organization', 'codigo_prestador']
        ]
        ordering = ['numero_sede']
        indexes = [
            models.Index(fields=['health_organization', 'estado']),
            models.Index(fields=['departamento', 'municipio']),
            models.Index(fields=['codigo_prestador']),
            models.Index(fields=['tipo_sede']),
        ]
        constraints = [
            # Asegurar que solo hay una sede principal por organización activa
            models.UniqueConstraint(
                fields=['health_organization'],
                condition=models.Q(es_sede_principal=True) & models.Q(deleted_at__isnull=True),
                name='unique_main_sede_per_health_organization'
            ),
        ]
    
    def clean(self):
        """Validaciones del modelo"""
        super().clean()
        
        # Solo puede haber una sede principal por organización
        if self.es_sede_principal:
            existing_principal = SedePrestadora.objects.filter(
                health_organization=self.health_organization,
                es_sede_principal=True,
                deleted_at__isnull=True
            ).exclude(pk=self.pk)
            
            if existing_principal.exists():
                raise ValidationError({
                    'es_sede_principal': _('Ya existe una sede principal para esta organización')
                })
        
        # Validar formato de número de sede
        if self.numero_sede and (not self.numero_sede.isdigit() or len(self.numero_sede) > 3):
            raise ValidationError({
                'numero_sede': _('El número de sede debe ser numérico y máximo 3 dígitos')
            })
    
    def __str__(self):
        return f"{self.nombre_sede} - Sede {self.numero_sede}"
    
    @property
    def direccion_completa(self):
        """Return complete address."""
        return f"{self.direccion}, {self.municipio}, {self.departamento}"
    
    @property
    def total_servicios(self):
        """Return total count of enabled services."""
        return self.sede_servicios.filter(estado_servicio='activo').count()
    
    def save(self, *args, **kwargs):
        """Override save method to handle business logic."""
        # Si es una nueva instancia y es la primera sede de la organización, marcarla como principal automáticamente
        is_new = self._state.adding
        if (
            is_new
            and self.health_organization
            and not SedePrestadora.objects.filter(health_organization=self.health_organization, deleted_at__isnull=True).exists()
        ):
            self.es_sede_principal = True
        
        # Formatear número de sede con ceros a la izquierda
        if self.numero_sede and self.numero_sede.isdigit():
            self.numero_sede = self.numero_sede.zfill(2)

        super().save(*args, **kwargs)


class SedeServicio(FullBaseModel):
    """
    Modelo intermedio para la relación entre Sede y Servicio.
    Permite agregar información adicional sobre el servicio en cada sede.
    """
    
    ESTADO_SERVICIO_CHOICES = [
        ('activo', _('Activo')),
        ('inactivo', _('Inactivo')),
        ('suspendido', _('Suspendido')),
    ]
    
    sede = models.ForeignKey(
        'SedePrestadora',
        on_delete=models.CASCADE,
        related_name='sede_servicios',
        verbose_name=_('sede prestadora')
    )
    
    servicio = models.ForeignKey(
        'HealthService',
        on_delete=models.CASCADE,
        related_name='servicio_sedes',
        verbose_name=_('servicio de salud')
    )
    
    # Información adicional del servicio en la sede
    distintivo = models.CharField(
        _('código distintivo'),
        max_length=50,
        help_text=_('Código distintivo del servicio en esta sede')
    )
    
    capacidad_instalada = models.IntegerField(
        _('capacidad instalada'),
        default=0,
        help_text=_('Capacidad instalada para este servicio en la sede.')
    )
    
    fecha_habilitacion = models.DateField(
        _('fecha de habilitación del servicio'),
        null=True,
        blank=True,
        help_text=_('Fecha en que se habilitó el servicio en esta sede.')
    )
    
    estado_servicio = models.CharField(
        _('estado del servicio'),
        max_length=20,
        choices=ESTADO_SERVICIO_CHOICES,
        default='activo',
        help_text=_('Estado del servicio en esta sede.')
    )
    
    observaciones = models.TextField(
        _('observaciones'),
        blank=True,
        help_text=_('Observaciones específicas del servicio en esta sede.')
    )
    
    class Meta:
        verbose_name = _('servicio por sede')
        verbose_name_plural = _('servicios por sede')
        unique_together = [
            ['sede', 'servicio'],
            ['sede', 'distintivo']
        ]
        ordering = ['sede', 'servicio']
        indexes = [
            models.Index(fields=['sede', 'estado_servicio']),
            models.Index(fields=['distintivo']),
        ]
    
    def __str__(self):
        return f"{self.sede.nombre_sede} - {self.servicio.nombre_servicio}"
    
    def clean(self):
        """Validate sede servicio data."""
        super().clean()
        
        # Validar que la sede y el servicio pertenezcan a la misma organización
        if hasattr(self, 'sede') and hasattr(self, 'servicio'):
            if self.sede.health_organization != self.servicio.health_organization:
                raise ValidationError({
                    'servicio': _('El servicio debe pertenecer a la misma organización de salud que la sede.')
                })
