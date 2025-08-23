"""
Django Admin configuration for Capacity models.
"""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models.capacity import CapacidadInstalada, CapacidadHistorial, CapacidadImportLog


@admin.register(CapacidadInstalada)
class CapacidadInstaladaAdmin(admin.ModelAdmin):
    """
    Admin interface for CapacidadInstalada model.
    """

    list_display = [
        "sede_prestadora",
        "nombre_concepto",
        "grupo_capacidad", 
        "cantidad",
        "cantidad_habilitada",
        "cantidad_funcionando",
        "estado_capacidad",
        "sincronizado_reps",
        "created_at",
    ]

    list_filter = [
        "grupo_capacidad",
        "estado_capacidad", 
        "sincronizado_reps",
        "sede_prestadora__organization",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "nombre_concepto",
        "codigo_concepto",
        "sede_prestadora__name",
        "sede_prestadora__organization__organization__razon_social",
        "observaciones",
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
            _("Información Básica"),
            {
                "fields": (
                    "sede_prestadora",
                    "health_service",
                    "grupo_capacidad",
                    "codigo_concepto", 
                    "nombre_concepto",
                )
            },
        ),
        (
            _("Capacidad"),
            {
                "fields": (
                    "cantidad",
                    "cantidad_habilitada",
                    "cantidad_funcionando",
                    "estado_capacidad",
                )
            },
        ),
        (
            _("Información Adicional"),
            {
                "fields": (
                    "numero_placa",
                    "modalidad_ambulancia", 
                    "modelo_vehiculo",
                    "numero_tarjeta_propiedad",
                    "marca",
                    "modelo_equipo",
                    "numero_serie",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            _("REPS Sync"),
            {
                "fields": (
                    "fecha_corte_reps",
                    "sincronizado_reps", 
                    "fecha_ultimo_reporte",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            _("Observaciones"),
            {
                "fields": ("observaciones",),
                "classes": ("collapse",),
            },
        ),
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


@admin.register(CapacidadImportLog)
class CapacidadImportLogAdmin(admin.ModelAdmin):
    """
    Admin interface for CapacidadImportLog model.
    """

    list_display = [
        "nombre_archivo",
        "estado_importacion",
        "total_registros", 
        "registros_importados",
        "registros_con_error",
        "fecha_inicio",
        "duracion_segundos",
        "created_by",
    ]

    list_filter = [
        "estado_importacion",
        "formato_archivo",
        "fecha_inicio",
        "created_at",
    ]

    search_fields = [
        "nombre_archivo",
        "sede_prestadora__name",
        "created_by__username",
    ]

    readonly_fields = [
        "id",
        "created_at",
        "updated_at", 
        "created_by",
        "updated_by",
        "duracion_segundos",
    ]

    fieldsets = (
        (
            _("Información del Archivo"),
            {
                "fields": (
                    "sede_prestadora",
                    "nombre_archivo",
                    "formato_archivo",
                    "tamaño_archivo",
                )
            },
        ),
        (
            _("Estado de Importación"),
            {
                "fields": (
                    "estado_importacion",
                    "fecha_inicio",
                    "fecha_finalizacion", 
                    "duracion_segundos",
                )
            },
        ),
        (
            _("Estadísticas"),
            {
                "fields": (
                    "total_registros",
                    "registros_importados",
                    "registros_actualizados",
                    "registros_con_error",
                )
            },
        ),
        (
            _("Detalles"),
            {
                "fields": (
                    "errores",
                    "advertencias", 
                    "estadisticas",
                ),
                "classes": ("collapse",),
            },
        ),
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