"""
Serializers para el sistema de templates organizacionales
ZentraQMS - Sistema de Gestión de Calidad
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction

from ..models import (
    ServicioHabilitado,
    TipoComite,
    TipoCargo,
    AreaFuncional,
    AreaFuncionalCargo,
    TemplateOrganizacional,
    AplicacionTemplate,
    ValidacionSOGCS,
    HistorialCambiosTemplate,
    ComplejidadIPS,
    Organization,
    OrganizationalChart,
)

User = get_user_model()


class ServicioHabilitadoSerializer(serializers.ModelSerializer):
    """Serializer para servicios habilitados"""
    
    class Meta:
        model = ServicioHabilitado
        fields = [
            'id', 'codigo', 'nombre', 'categoria', 'complejidad_minima',
            'activo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TipoComiteSerializer(serializers.ModelSerializer):
    """Serializer para tipos de comité"""
    
    class Meta:
        model = TipoComite
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'base_normativa',
            'periodicidad', 'obligatorio_nivel_i', 'obligatorio_nivel_ii',
            'obligatorio_nivel_iii', 'obligatorio_nivel_iv', 'activo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TipoCargoSerializer(serializers.ModelSerializer):
    """Serializer para tipos de cargo"""
    sector_name = serializers.CharField(source='sector.name', read_only=True)
    
    class Meta:
        model = TipoCargo
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'perfil_requerido',
            'es_directivo', 'es_coordinacion', 'es_jefatura',
            'obligatorio_nivel_i', 'obligatorio_nivel_ii',
            'obligatorio_nivel_iii', 'obligatorio_nivel_iv',
            'ratio_personal', 'sector', 'sector_name', 'activo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sector_name']


class AreaFuncionalSerializer(serializers.ModelSerializer):
    """Serializer para áreas funcionales"""
    
    class Meta:
        model = AreaFuncional
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'nivel_jerarquico',
            'obligatorio_nivel_i', 'obligatorio_nivel_ii',
            'obligatorio_nivel_iii', 'obligatorio_nivel_iv',
            'activo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AreaFuncionalCargoSerializer(serializers.ModelSerializer):
    """Serializer para relación área-cargo"""
    area_funcional_nombre = serializers.CharField(source='area_funcional.nombre', read_only=True)
    tipo_cargo_nombre = serializers.CharField(source='tipo_cargo.nombre', read_only=True)
    
    class Meta:
        model = AreaFuncionalCargo
        fields = [
            'id', 'area_funcional', 'area_funcional_nombre',
            'tipo_cargo', 'tipo_cargo_nombre', 'es_jefe_area',
            'cantidad_recomendada', 'activo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'area_funcional_nombre', 'tipo_cargo_nombre']


class ValidacionSOGCSSerializer(serializers.ModelSerializer):
    """Serializer para validaciones SOGCS"""
    
    class Meta:
        model = ValidacionSOGCS
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 'categoria',
            'nivel_aplicacion', 'parametros_validacion', 'es_obligatoria',
            'activo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TemplateOrganizacionalListSerializer(serializers.ModelSerializer):
    """Serializer para listado de templates"""
    servicios_incluidos_count = serializers.SerializerMethodField()
    areas_incluidas_count = serializers.SerializerMethodField()
    validaciones_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TemplateOrganizacional
        fields = [
            'id', 'nombre', 'descripcion', 'complejidad_ips',
            'servicios_incluidos_count', 'areas_incluidas_count',
            'validaciones_count', 'es_template_base', 'activo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_servicios_incluidos_count(self, obj):
        """Cuenta servicios incluidos en el template"""
        servicios = obj.servicios_incluidos.get('servicios', [])
        return len(servicios) if servicios else 0
    
    def get_areas_incluidas_count(self, obj):
        """Cuenta áreas incluidas en el template"""
        estructura = obj.estructura_organizacional.get('areas', [])
        return len(estructura) if estructura else 0
    
    def get_validaciones_count(self, obj):
        """Cuenta validaciones SOGCS incluidas"""
        validaciones = obj.validaciones_sogcs.get('validaciones', [])
        return len(validaciones) if validaciones else 0


class TemplateOrganizacionalDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para templates"""
    servicios_incluidos_detail = serializers.SerializerMethodField()
    validaciones_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = TemplateOrganizacional
        fields = [
            'id', 'nombre', 'descripcion', 'complejidad_ips',
            'servicios_incluidos', 'servicios_incluidos_detail',
            'estructura_organizacional', 'validaciones_sogcs',
            'validaciones_detail', 'configuracion_base',
            'es_template_base', 'activo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_servicios_incluidos_detail(self, obj):
        """Obtiene detalle de servicios incluidos"""
        servicios_codes = obj.servicios_incluidos.get('servicios', [])
        if not servicios_codes:
            return []
        
        servicios = ServicioHabilitado.objects.filter(
            codigo__in=servicios_codes,
            activo=True
        )
        return ServicioHabilitadoSerializer(servicios, many=True).data
    
    def get_validaciones_detail(self, obj):
        """Obtiene detalle de validaciones SOGCS"""
        validaciones_codes = obj.validaciones_sogcs.get('validaciones', [])
        if not validaciones_codes:
            return []
        
        validaciones = ValidacionSOGCS.objects.filter(
            codigo__in=validaciones_codes,
            activo=True
        )
        return ValidacionSOGCSSerializer(validaciones, many=True).data


class AplicacionTemplateSerializer(serializers.ModelSerializer):
    """Serializer para aplicación de templates"""
    template_nombre = serializers.CharField(source='template.nombre', read_only=True)
    organizacion_nombre = serializers.CharField(source='organizacion.razon_social', read_only=True)
    aplicado_por_nombre = serializers.CharField(source='aplicado_por.get_full_name', read_only=True)
    
    class Meta:
        model = AplicacionTemplate
        fields = [
            'id', 'template', 'template_nombre', 'organizacion',
            'organizacion_nombre', 'aplicado_por', 'aplicado_por_nombre',
            'fecha_aplicacion', 'configuracion_personalizada',
            'resultado_aplicacion', 'errores_aplicacion',
            'estado', 'activo', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'fecha_aplicacion', 'resultado_aplicacion',
            'errores_aplicacion', 'created_at', 'updated_at',
            'template_nombre', 'organizacion_nombre', 'aplicado_por_nombre'
        ]


class AplicarTemplateSerializer(serializers.Serializer):
    """Serializer para aplicar template a organización"""
    template_id = serializers.UUIDField()
    organizacion_id = serializers.UUIDField()
    configuracion_personalizada = serializers.JSONField(required=False, default=dict)
    validar_sogcs = serializers.BooleanField(default=True)
    
    def validate_template_id(self, value):
        """Valida que el template exista y esté activo"""
        try:
            template = TemplateOrganizacional.objects.get(id=value, activo=True)
            return value
        except TemplateOrganizacional.DoesNotExist:
            raise serializers.ValidationError("Template no encontrado o inactivo")
    
    def validate_organizacion_id(self, value):
        """Valida que la organización exista y esté activa"""
        try:
            organizacion = Organization.objects.get(id=value, is_active=True)
            return value
        except Organization.DoesNotExist:
            raise serializers.ValidationError("Organización no encontrada o inactiva")
    
    def validate(self, attrs):
        """Validaciones cruzadas"""
        template_id = attrs['template_id']
        organizacion_id = attrs['organizacion_id']
        
        # Verificar que no haya una aplicación previa activa
        aplicacion_existente = AplicacionTemplate.objects.filter(
            template_id=template_id,
            organizacion_id=organizacion_id,
            estado__in=['aplicado', 'en_progreso'],
            activo=True
        ).exists()
        
        if aplicacion_existente:
            raise serializers.ValidationError(
                "Ya existe una aplicación activa de este template para esta organización"
            )
        
        return attrs


class HistorialCambiosTemplateSerializer(serializers.ModelSerializer):
    """Serializer para historial de cambios"""
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)
    template_nombre = serializers.CharField(source='template.nombre', read_only=True)
    
    class Meta:
        model = HistorialCambiosTemplate
        fields = [
            'id', 'template', 'template_nombre', 'usuario',
            'usuario_nombre', 'tipo_cambio', 'descripcion_cambio',
            'datos_anteriores', 'datos_nuevos', 'fecha_cambio',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'fecha_cambio', 'created_at', 'updated_at',
            'template_nombre', 'usuario_nombre'
        ]