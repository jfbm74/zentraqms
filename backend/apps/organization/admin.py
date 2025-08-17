"""
Django Admin configuration for Organization module.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import Organization, Location, SectorTemplate, AuditLog, SedePrestadora, SedeServicio, HealthOrganization, HealthService


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """
    Admin interface for Organization model.
    """

    list_display = [
        "razon_social",
        "nombre_comercial",
        "nit_completo",
        "tipo_organizacion",
        "sector_economico",
        "tamaño_empresa",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "tipo_organizacion",
        "sector_economico",
        "tamaño_empresa",
        "is_active",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "razon_social",
        "nombre_comercial",
        "nit",
        "email_contacto",
    ]

    readonly_fields = [
        "id",
        "nit_completo",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
    ]

    fieldsets = (
        (
            _("Información Legal"),
            {
                "fields": (
                    "razon_social",
                    "nombre_comercial",
                    "nit",
                    "digito_verificacion",
                    "nit_completo",
                )
            },
        ),
        (
            _("Clasificación"),
            {
                "fields": (
                    "tipo_organizacion",
                    "sector_economico",
                    "tamaño_empresa",
                )
            },
        ),
        (
            _("Información Adicional"),
            {
                "fields": (
                    "fecha_fundacion",
                    "logo",
                    "descripcion",
                )
            },
        ),
        (
            _("Contacto"),
            {
                "fields": (
                    "website",
                    "email_contacto",
                    "telefono_principal",
                )
            },
        ),
        (_("Estado"), {"fields": ("is_active",)}),
        (
            _("Auditoría"),
            {
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                    "created_by",
                    "updated_by",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def save_model(self, request, obj, form, change):
        """Override save to set audit fields."""
        if not change:  # Creating new object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    """
    Admin interface for Location model.
    """

    list_display = [
        "nombre",
        "organization",
        "tipo_sede",
        "es_principal_badge",
        "ciudad",
        "departamento",
        "telefono",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "organization",
        "tipo_sede",
        "es_principal",
        "ciudad",
        "departamento",
        "pais",
        "is_active",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "nombre",
        "direccion",
        "ciudad",
        "departamento",
        "organization__razon_social",
        "organization__nombre_comercial",
    ]

    readonly_fields = [
        "id",
        "direccion_completa",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
    ]

    fieldsets = (
        (
            _("Información Básica"),
            {
                "fields": (
                    "organization",
                    "nombre",
                    "tipo_sede",
                    "es_principal",
                )
            },
        ),
        (
            _("Dirección"),
            {
                "fields": (
                    "direccion",
                    "ciudad",
                    "departamento",
                    "pais",
                    "codigo_postal",
                    "direccion_completa",
                )
            },
        ),
        (
            _("Contacto"),
            {
                "fields": (
                    "telefono",
                    "email",
                )
            },
        ),
        (
            _("Información Operativa"),
            {
                "fields": (
                    "area_m2",
                    "capacidad_personas",
                    "fecha_apertura",
                    "horario_atencion",
                )
            },
        ),
        (
            _("Responsable"),
            {
                "fields": (
                    "responsable_nombre",
                    "responsable_cargo",
                    "responsable_telefono",
                    "responsable_email",
                )
            },
        ),
        (_("Observaciones"), {"fields": ("observaciones",)}),
        (_("Estado"), {"fields": ("is_active",)}),
        (
            _("Auditoría"),
            {
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                    "created_by",
                    "updated_by",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def es_principal_badge(self, obj):
        """Display badge for main location."""
        if obj.es_principal:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Principal</span>'
            )
        return format_html('<span style="color: gray;">○ Adicional</span>')

    es_principal_badge.short_description = _("Es Principal")
    es_principal_badge.admin_order_field = "es_principal"

    def save_model(self, request, obj, form, change):
        """Override save to set audit fields."""
        if not change:  # Creating new object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(SectorTemplate)
class SectorTemplateAdmin(admin.ModelAdmin):
    """
    Admin interface for SectorTemplate model.
    """

    list_display = [
        "nombre_template",
        "sector",
        "version",
        "aplicaciones_exitosas",
        "fecha_ultima_aplicacion",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "sector",
        "is_active",
        "version",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "nombre_template",
        "descripcion",
        "sector",
    ]

    readonly_fields = [
        "id",
        "aplicaciones_exitosas",
        "fecha_ultima_aplicacion",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
    ]

    fieldsets = (
        (
            _("Información del Template"),
            {
                "fields": (
                    "sector",
                    "nombre_template",
                    "version",
                    "descripcion",
                )
            },
        ),
        (
            _("Configuración JSON"),
            {
                "fields": ("data_json",),
                "description": "Configuración predefinida que se aplicará a las organizaciones.",
            },
        ),
        (
            _("Estadísticas"),
            {
                "fields": (
                    "aplicaciones_exitosas",
                    "fecha_ultima_aplicacion",
                )
            },
        ),
        (_("Estado"), {"fields": ("is_active",)}),
        (
            _("Auditoría"),
            {
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                    "created_by",
                    "updated_by",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def save_model(self, request, obj, form, change):
        """Override save to set audit fields."""
        if not change:  # Creating new object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(SedePrestadora)
class SedePrestadoraAdmin(admin.ModelAdmin):
    """
    Admin interface for SedePrestadora model.
    """

    list_display = [
        "numero_sede",
        "nombre_sede",
        "health_organization",
        "es_principal_badge",
        "departamento",
        "municipio",
        "estado",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "health_organization",
        "es_sede_principal",
        "departamento",
        "municipio",
        "estado",
        "tipo_sede",
        "is_active",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "numero_sede",
        "nombre_sede",
        "direccion",
        "departamento",
        "municipio",
        "health_organization__nombre_organizacion",
        "codigo_prestador",
    ]

    readonly_fields = [
        "id",
        "direccion_completa",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
    ]

    fieldsets = (
        (
            _("Información Básica"),
            {
                "fields": (
                    "health_organization",
                    "numero_sede",
                    "nombre_sede",
                    "es_sede_principal",
                    "tipo_sede",
                    "estado",
                )
            },
        ),
        (
            _("Dirección"),
            {
                "fields": (
                    "direccion",
                    "departamento",
                    "municipio",
                    "barrio",
                    "codigo_postal",
                )
            },
        ),
        (
            _("Contacto"),
            {
                "fields": (
                    "telefono_principal",
                    "telefono_secundario",
                    "email",
                )
            },
        ),
        (
            _("Responsable de la Sede"),
            {
                "fields": (
                    "nombre_responsable",
                    "cargo_responsable",
                    "telefono_responsable",
                    "email_responsable",
                )
            },
        ),
        (
            _("Información Operativa"),
            {
                "fields": (
                    "numero_camas",
                    "numero_consultorios",
                    "numero_quirofanos",
                    "atencion_24_horas",
                    "fecha_habilitacion",
                    "fecha_renovacion",
                )
            },
        ),
        (_("Estado"), {"fields": ("is_active",)}),
        (
            _("Auditoría"),
            {
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                    "created_by",
                    "updated_by",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def es_principal_badge(self, obj):
        """Display badge for main sede."""
        if obj.es_sede_principal:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Principal</span>'
            )
        return format_html('<span style="color: gray;">○ Adicional</span>')

    es_principal_badge.short_description = _("Es Principal")
    es_principal_badge.admin_order_field = "es_sede_principal"

    def save_model(self, request, obj, form, change):
        """Override save to set audit fields."""
        if not change:  # Creating new object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(SedeServicio)
class SedeServicioAdmin(admin.ModelAdmin):
    """
    Admin interface for SedeServicio model.
    """

    list_display = [
        "sede",
        "servicio",
        "distintivo",
        "fecha_habilitacion",
        "estado_servicio",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "servicio",
        "estado_servicio",
        "fecha_habilitacion",
        "is_active",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "sede__numero_sede",
        "sede__nombre_sede",
        "servicio__nombre",
        "distintivo",
    ]

    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
    ]

    fieldsets = (
        (
            _("Información del Servicio"),
            {
                "fields": (
                    "sede",
                    "servicio",
                    "distintivo",
                    "fecha_habilitacion",
                    "estado_servicio",
                )
            },
        ),
        (
            _("Detalles Adicionales"),
            {
                "fields": (
                    "observaciones",
                )
            },
        ),
        (_("Estado"), {"fields": ("is_active",)}),
        (
            _("Auditoría"),
            {
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                    "created_by",
                    "updated_by",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def save_model(self, request, obj, form, change):
        """Override save to set audit fields."""
        if not change:  # Creating new object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(HealthOrganization)
class HealthOrganizationAdmin(admin.ModelAdmin):
    """
    Admin interface for HealthOrganization model.
    """

    list_display = [
        "organization",
        "codigo_prestador",
        "tipo_prestador",
        "nivel_complejidad",
        "naturaleza_juridica",
        "verificado_reps",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "tipo_prestador",
        "nivel_complejidad",
        "naturaleza_juridica",
        "verificado_reps",
        "is_active",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "organization__razon_social",
        "codigo_prestador",
        "representante_numero_documento",
        "resolucion_habilitacion",
        "representante_nombre_completo",
    ]

    readonly_fields = [
        "id",
        "created_at",
        "updated_at", 
        "created_by",
        "updated_by",
    ]

    def save_model(self, request, obj, form, change):
        """Override save to set audit fields."""
        if not change:  # Creating new object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(HealthService)
class HealthServiceAdmin(admin.ModelAdmin):
    """
    Admin interface for HealthService model.
    """

    list_display = [
        "codigo_servicio",
        "nombre_servicio",
        "grupo_servicio",
        "estado",
        "modalidad",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "grupo_servicio",
        "estado", 
        "modalidad",
        "is_active",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "codigo_servicio",
        "nombre_servicio",
        "descripcion_servicio",
        "grupo_servicio",
    ]

    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by", 
    ]

    def save_model(self, request, obj, form, change):
        """Override save to set audit fields."""
        if not change:  # Creating new object
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
