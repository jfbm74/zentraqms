"""
Capacity Serializers

Serializers for capacity management models including CapacidadInstalada,
CapacidadHistorial, and CapacidadImportLog.
"""

from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from apps.organization.models.capacity import (
    CapacidadInstalada,
    CapacidadHistorial,
    CapacidadImportLog,
    GRUPO_CAPACIDAD_CHOICES,
    MODALIDADES_AMBULANCIA,
    ESTADO_CAPACIDAD,
)
from apps.organization.models.sogcs_sedes import HeadquarterLocation
from apps.organization.models.health_services import SedeHealthService


class CapacidadInstaladaListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing capacity records.
    """
    sede_nombre = serializers.CharField(source='sede_prestadora.name', read_only=True)
    grupo_display = serializers.CharField(source='get_grupo_capacidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_capacidad_display', read_only=True)
    porcentaje_habilitacion = serializers.ReadOnlyField()
    porcentaje_funcionamiento = serializers.ReadOnlyField()
    necesita_actualizacion_reps = serializers.ReadOnlyField()
    
    class Meta:
        model = CapacidadInstalada
        fields = [
            'id', 'sede_prestadora', 'sede_nombre', 'grupo_capacidad', 'grupo_display',
            'codigo_concepto', 'nombre_concepto', 'cantidad', 'cantidad_habilitada',
            'cantidad_funcionando', 'estado_capacidad', 'estado_display',
            'porcentaje_ocupacion', 'porcentaje_habilitacion', 'porcentaje_funcionamiento',
            'sincronizado_reps', 'fecha_corte_reps', 'necesita_actualizacion_reps',
            'created_at', 'updated_at'
        ]


class CapacidadInstaladaDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed capacity records.
    """
    sede_nombre = serializers.CharField(source='sede_prestadora.name', read_only=True)
    sede_codigo = serializers.CharField(source='sede_prestadora.reps_code', read_only=True)
    servicio_nombre = serializers.CharField(source='health_service.service_name', read_only=True, allow_null=True)
    grupo_display = serializers.CharField(source='get_grupo_capacidad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_capacidad_display', read_only=True)
    modalidad_display = serializers.CharField(source='get_modalidad_ambulancia_display', read_only=True)
    
    # Computed fields
    porcentaje_habilitacion = serializers.ReadOnlyField()
    porcentaje_funcionamiento = serializers.ReadOnlyField()
    necesita_actualizacion_reps = serializers.ReadOnlyField()
    es_ambulancia = serializers.ReadOnlyField()
    es_equipo_biomedico = serializers.ReadOnlyField()
    requiere_placa = serializers.ReadOnlyField()
    concepto_display_complete = serializers.CharField(source='get_concepto_display_complete', read_only=True)
    
    class Meta:
        model = CapacidadInstalada
        fields = '__all__'


class CapacidadInstaladaCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating capacity records.
    """
    
    class Meta:
        model = CapacidadInstalada
        fields = [
            'sede_prestadora', 'health_service', 'grupo_capacidad', 'codigo_concepto',
            'nombre_concepto', 'cantidad', 'cantidad_habilitada', 'cantidad_funcionando',
            'estado_capacidad', 'numero_placa', 'modalidad_ambulancia', 'modelo_vehiculo',
            'numero_tarjeta_propiedad', 'marca', 'modelo_equipo', 'numero_serie',
            'porcentaje_ocupacion', 'horas_funcionamiento_dia', 'dias_funcionamiento_semana',
            'observaciones'
        ]
    
    def validate(self, attrs):
        """
        Custom validation for capacity data.
        """
        # Validate quantity consistency
        cantidad = attrs.get('cantidad', 0)
        cantidad_habilitada = attrs.get('cantidad_habilitada', 0)
        cantidad_funcionando = attrs.get('cantidad_funcionando', 0)
        
        if cantidad_habilitada > cantidad:
            raise serializers.ValidationError({
                'cantidad_habilitada': _('La cantidad habilitada no puede ser mayor que la cantidad total')
            })
        
        if cantidad_funcionando > cantidad:
            raise serializers.ValidationError({
                'cantidad_funcionando': _('La cantidad funcionando no puede ser mayor que la cantidad total')
            })
        
        # Validate ambulance-specific fields
        grupo_capacidad = attrs.get('grupo_capacidad')
        if grupo_capacidad == 'AMBULANCIAS':
            numero_placa = attrs.get('numero_placa', '').strip()
            modalidad_ambulancia = attrs.get('modalidad_ambulancia', '').strip()
            
            if not numero_placa:
                raise serializers.ValidationError({
                    'numero_placa': _('El número de placa es obligatorio para ambulancias')
                })
            
            if not modalidad_ambulancia:
                raise serializers.ValidationError({
                    'modalidad_ambulancia': _('La modalidad es obligatoria para ambulancias')
                })
        
        return attrs
    
    def create(self, validated_data):
        """
        Create capacity record with audit trail.
        """
        # Set created_by from context
        user = self.context.get('request').user if self.context.get('request') else None
        if user:
            validated_data['created_by'] = user
            validated_data['updated_by'] = user
        
        capacity = super().create(validated_data)
        
        # Create history record
        CapacidadHistorial.objects.create(
            capacidad=capacity,
            accion='creacion',
            valor_nuevo=str(validated_data),
            justificacion='Creación manual',
            origen_cambio='manual',
            created_by=user
        )
        
        return capacity
    
    def update(self, instance, validated_data):
        """
        Update capacity record with audit trail.
        """
        user = self.context.get('request').user if self.context.get('request') else None
        if user:
            validated_data['updated_by'] = user
        
        # Store old values for history
        old_values = {
            field: getattr(instance, field)
            for field in validated_data.keys()
        }
        
        capacity = super().update(instance, validated_data)
        
        # Create history record for each changed field
        for field, new_value in validated_data.items():
            old_value = old_values.get(field)
            if old_value != new_value:
                CapacidadHistorial.objects.create(
                    capacidad=capacity,
                    accion='modificacion',
                    campo_modificado=field,
                    valor_anterior=str(old_value),
                    valor_nuevo=str(new_value),
                    justificacion='Modificación manual',
                    origen_cambio='manual',
                    created_by=user
                )
        
        return capacity


class CapacidadHistorialSerializer(serializers.ModelSerializer):
    """
    Serializer for capacity history records.
    """
    usuario_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    accion_display = serializers.CharField(source='get_accion_display', read_only=True)
    origen_display = serializers.CharField(source='get_origen_cambio_display', read_only=True)
    
    class Meta:
        model = CapacidadHistorial
        fields = [
            'id', 'accion', 'accion_display', 'campo_modificado', 'valor_anterior',
            'valor_nuevo', 'justificacion', 'origen_cambio', 'origen_display',
            'usuario_nombre', 'created_at'
        ]


class CapacidadImportLogSerializer(serializers.ModelSerializer):
    """
    Serializer for capacity import logs.
    """
    sede_nombre = serializers.CharField(source='sede_prestadora.name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_importacion_display', read_only=True)
    formato_display = serializers.CharField(source='get_formato_archivo_display', read_only=True)
    usuario_nombre = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    # Computed fields
    porcentaje_exito = serializers.ReadOnlyField()
    tiene_errores = serializers.ReadOnlyField()
    tiempo_procesamiento = serializers.ReadOnlyField()
    
    class Meta:
        model = CapacidadImportLog
        fields = [
            'id', 'sede_prestadora', 'sede_nombre', 'nombre_archivo', 'tamaño_archivo',
            'formato_archivo', 'formato_display', 'total_registros', 'registros_importados',
            'registros_actualizados', 'registros_con_error', 'estado_importacion',
            'estado_display', 'errores', 'advertencias', 'estadisticas',
            'fecha_inicio', 'fecha_finalizacion', 'duracion_segundos',
            'porcentaje_exito', 'tiene_errores', 'tiempo_procesamiento',
            'usuario_nombre', 'created_at'
        ]


class CapacityImportSerializer(serializers.Serializer):
    """
    Serializer for capacity import requests.
    """
    file = serializers.FileField(
        help_text=_('Archivo de capacidad REPS (XLS, XLSX, CSV, HTML)')
    )
    sede_id = serializers.UUIDField(
        required=False,
        help_text=_('ID de la sede específica (opcional)')
    )
    validate_only = serializers.BooleanField(
        default=False,
        help_text=_('Solo validar sin importar')
    )
    update_existing = serializers.BooleanField(
        default=True,
        help_text=_('Actualizar registros existentes')
    )
    
    def validate_file(self, value):
        """
        Validate uploaded file.
        """
        # Check file size (max 50MB)
        max_size = 50 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(
                _('El archivo es demasiado grande. Máximo 50MB.')
            )
        
        # Check file extension
        allowed_extensions = ['.xls', '.xlsx', '.csv', '.html', '.htm']
        file_name = value.name.lower()
        
        if not any(file_name.endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(
                _('Formato de archivo no soportado. Use XLS, XLSX, CSV o HTML.')
            )
        
        return value
    
    def validate_sede_id(self, value):
        """
        Validate sede ID if provided.
        """
        if value:
            try:
                HeadquarterLocation.objects.get(pk=value, deleted_at__isnull=True)
            except HeadquarterLocation.DoesNotExist:
                raise serializers.ValidationError(_('Sede no encontrada'))
        
        return value


class CapacityBulkActionSerializer(serializers.Serializer):
    """
    Serializer for bulk capacity operations.
    """
    capacity_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text=_('Lista de IDs de capacidad')
    )
    action = serializers.ChoiceField(
        choices=[
            ('enable', _('Habilitar')),
            ('disable', _('Deshabilitar')),
            ('delete', _('Eliminar')),
            ('sync_reps', _('Sincronizar con REPS')),
            ('update_status', _('Actualizar Estado')),
        ],
        help_text=_('Acción a realizar')
    )
    additional_data = serializers.JSONField(
        required=False,
        help_text=_('Datos adicionales para la acción')
    )
    
    def validate_capacity_ids(self, value):
        """
        Validate that all capacity IDs exist.
        """
        existing_ids = CapacidadInstalada.objects.filter(
            id__in=value,
            deleted_at__isnull=True
        ).values_list('id', flat=True)
        
        missing_ids = set(value) - set(existing_ids)
        if missing_ids:
            raise serializers.ValidationError(
                _('Capacidades no encontradas: {}').format(list(missing_ids))
            )
        
        return value


class CapacityStatisticsSerializer(serializers.Serializer):
    """
    Serializer for capacity statistics.
    """
    total_capacity = serializers.IntegerField()
    by_group = serializers.DictField()
    by_sede = serializers.ListField()
    by_status = serializers.DictField()
    occupancy_rates = serializers.DictField()
    reps_sync_status = serializers.DictField()
    recent_imports = serializers.ListField()
    pending_updates = serializers.IntegerField()


class SedeCapacityOverviewSerializer(serializers.Serializer):
    """
    Serializer for sede capacity overview.
    """
    sede_id = serializers.UUIDField()
    sede_nombre = serializers.CharField()
    total_capacity = serializers.IntegerField()
    capacity_by_group = serializers.DictField()
    average_occupancy = serializers.FloatField(allow_null=True)
    last_update = serializers.DateTimeField(allow_null=True)
    needs_sync = serializers.BooleanField()


class CapacityGroupSerializer(serializers.Serializer):
    """
    Serializer for capacity grouped by type.
    """
    grupo_capacidad = serializers.CharField()
    grupo_display = serializers.CharField()
    capacidades = CapacidadInstaladaListSerializer(many=True)
    totales = serializers.DictField()


class CapacityValidationSerializer(serializers.Serializer):
    """
    Serializer for capacity validation results.
    """
    is_valid = serializers.BooleanField()
    errors = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    summary = serializers.DictField()
    suggestions = serializers.ListField(child=serializers.CharField(), required=False)