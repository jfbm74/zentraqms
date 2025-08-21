"""
Serializers for Health Services management.

This module provides comprehensive serializers for health services
according to REPS standards and Colombian healthcare regulations.
"""

from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from typing import Dict, Any

from apps.organization.models.health_services import (
    SedeHealthService,
    HealthServiceCatalog,
    ServiceImportLog
)
from apps.organization.models.sogcs_sedes import HeadquarterLocation


class HealthServiceCatalogSerializer(serializers.ModelSerializer):
    """
    Serializer for health service catalog (read-only reference).
    """
    dependent_services_count = serializers.SerializerMethodField()
    dependent_services = serializers.SerializerMethodField()
    
    class Meta:
        model = HealthServiceCatalog
        fields = [
            'id', 'service_code', 'service_name',
            'service_group_code', 'service_group_name',
            'requires_infrastructure', 'requires_equipment',
            'requires_human_talent', 'allows_ambulatory',
            'allows_hospital', 'allows_mobile_unit',
            'allows_domiciliary', 'allows_telemedicine',
            'min_complexity', 'max_complexity',
            'dependent_services', 'dependent_services_count',
            'standard_requirements', 'documentation_required',
            'resolution_reference', 'is_active', 'notes'
        ]
        read_only_fields = fields
    
    def get_dependent_services_count(self, obj):
        return obj.dependent_services.count()
    
    def get_dependent_services(self, obj):
        """Return basic info about dependent services."""
        return [
            {
                'code': service.service_code,
                'name': service.service_name
            }
            for service in obj.dependent_services.all()[:5]
        ]


class SedeHealthServiceListSerializer(serializers.ModelSerializer):
    """
    Light serializer for service lists with computed fields.
    """
    active_modalities = serializers.ReadOnlyField()
    complexity_display = serializers.ReadOnlyField()
    headquarters_name = serializers.CharField(source='headquarters.name', read_only=True)
    has_telemedicine = serializers.ReadOnlyField()
    is_specialized = serializers.ReadOnlyField()
    requires_renewal = serializers.ReadOnlyField()
    
    class Meta:
        model = SedeHealthService
        fields = [
            'id', 'service_code', 'service_name',
            'service_group_name', 'distinctive_number',
            'active_modalities', 'complexity_display',
            'is_enabled', 'opening_date', 'headquarters_name',
            'has_telemedicine', 'is_specialized', 'requires_renewal'
        ]


class SedeHealthServiceDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for individual service with all fields.
    """
    service_catalog = HealthServiceCatalogSerializer(read_only=True)
    active_modalities = serializers.ReadOnlyField()
    complexity_display = serializers.ReadOnlyField()
    headquarters_info = serializers.SerializerMethodField()
    has_telemedicine = serializers.ReadOnlyField()
    is_specialized = serializers.ReadOnlyField()
    requires_renewal = serializers.ReadOnlyField()
    
    class Meta:
        model = SedeHealthService
        fields = '__all__'
        read_only_fields = [
            'created_at', 'updated_at', 'deleted_at',
            'created_by', 'updated_by', 'deleted_by',
            'reps_import_date', 'reps_raw_data'
        ]
    
    def get_headquarters_info(self, obj):
        """Return headquarters basic information."""
        return {
            'id': obj.headquarters.id,
            'name': obj.headquarters.name,
            'reps_code': obj.headquarters.reps_code,
            'address': obj.headquarters.complete_address
        }


class SedeHealthServiceCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating services with validation.
    """
    class Meta:
        model = SedeHealthService
        fields = [
            'headquarters', 'service_code', 'service_name',
            'service_group_code', 'service_group_name',
            'ambulatory', 'hospital', 'mobile_unit',
            'domiciliary', 'other_extramural',
            'is_reference_center', 'is_referring_institution',
            'low_complexity', 'medium_complexity', 'high_complexity',
            'complexity_level', 'opening_date', 'closing_date',
            'distinctive_number', 'main_sede_number',
            'schedule', 'intramural_modality', 'telemedicine_modality',
            'specificities', 'installed_capacity', 'human_talent',
            'quality_score', 'last_audit_date', 'compliance_percentage',
            'is_enabled', 'observations', 'norm_version', 'manager_name',
            'is_pdet_municipality', 'is_zomac_municipality', 'is_pnis_municipality'
        ]
    
    def validate_distinctive_number(self, value):
        """Ensure distinctive number is unique."""
        instance = self.instance
        qs = SedeHealthService.objects.filter(distinctive_number=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "Ya existe un servicio con este número distintivo."
            )
        return value
    
    def validate(self, data):
        """Validate service data integrity."""
        # Ensure at least one modality is active
        modalities = [
            data.get('ambulatory', 'SD'),
            data.get('hospital', 'SD'),
            data.get('mobile_unit', 'SD'),
            data.get('domiciliary', 'SD'),
            data.get('other_extramural', 'SD')
        ]
        
        if all(m == 'NO' for m in modalities):
            raise serializers.ValidationError({
                'ambulatory': 'Al menos una modalidad debe estar activa (no puede ser todas NO).'
            })
        
        # Validate complexity consistency
        if data.get('complexity_level') == 'ALTA' and data.get('low_complexity') == 'SI':
            if data.get('high_complexity') != 'SI':
                raise serializers.ValidationError({
                    'complexity_level': 'Inconsistencia en niveles de complejidad.'
                })
        
        # Validate dates
        opening_date = data.get('opening_date')
        closing_date = data.get('closing_date')
        if opening_date and closing_date:
            if closing_date < opening_date:
                raise serializers.ValidationError({
                    'closing_date': 'La fecha de cierre no puede ser anterior a la fecha de apertura.'
                })
        
        # Link to catalog if available
        if 'service_code' in data:
            try:
                catalog = HealthServiceCatalog.objects.get(
                    service_code=data['service_code']
                )
                data['service_catalog'] = catalog
            except HealthServiceCatalog.DoesNotExist:
                pass
        
        return data
    
    def create(self, validated_data):
        """Create service with audit fields."""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update service with audit fields."""
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class ServiceImportSerializer(serializers.Serializer):
    """
    Serializer for service import via Excel with validation.
    """
    file = serializers.FileField(
        help_text="Archivo Excel (.xls) exportado desde REPS"
    )
    
    headquarters_id = serializers.IntegerField(
        required=False,
        help_text="ID de la sede para asociar servicios (opcional)"
    )
    
    update_existing = serializers.BooleanField(
        default=True,
        help_text="Actualizar servicios existentes"
    )
    
    def validate_file(self, value):
        """Validate uploaded file format and size."""
        # Check file extension
        if not value.name.lower().endswith(('.xls', '.xlsx', '.html')):
            raise serializers.ValidationError(
                "El archivo debe ser formato Excel (.xls/.xlsx) o HTML exportado desde REPS"
            )
        
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "El archivo no puede superar los 10MB"
            )
        
        # Check file is not empty
        if value.size == 0:
            raise serializers.ValidationError(
                "El archivo está vacío"
            )
        
        return value
    
    def validate_headquarters_id(self, value):
        """Validate headquarters exists and user has access."""
        if value:
            try:
                headquarters = HeadquarterLocation.objects.get(pk=value)
                # Check user has access (implement based on your permission system)
                user = self.context['request'].user
                # Add permission check here
                return value
            except HeadquarterLocation.DoesNotExist:
                raise serializers.ValidationError(
                    "La sede especificada no existe"
                )
        return value


class ServiceBulkActionSerializer(serializers.Serializer):
    """
    Serializer for bulk actions on multiple services.
    """
    service_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=100,
        help_text="Lista de IDs de servicios (máximo 100)"
    )
    
    action = serializers.ChoiceField(
        choices=[
            ('enable', 'Habilitar'),
            ('disable', 'Deshabilitar'),
            ('delete', 'Eliminar'),
            ('update_compliance', 'Actualizar cumplimiento'),
            ('schedule_audit', 'Programar auditoría')
        ],
        help_text="Acción a realizar"
    )
    
    additional_data = serializers.JSONField(
        required=False,
        help_text="Datos adicionales para la acción"
    )
    
    def validate_service_ids(self, value):
        """Validate services exist."""
        # Check for duplicates
        if len(value) != len(set(value)):
            raise serializers.ValidationError(
                "La lista contiene IDs duplicados"
            )
        
        # Check services exist
        existing_ids = SedeHealthService.objects.filter(
            id__in=value
        ).values_list('id', flat=True)
        
        missing_ids = set(value) - set(existing_ids)
        if missing_ids:
            raise serializers.ValidationError(
                f"Los siguientes IDs no existen: {list(missing_ids)}"
            )
        
        return value


class ServiceImportLogSerializer(serializers.ModelSerializer):
    """
    Serializer for import logs with computed fields.
    """
    duration = serializers.SerializerMethodField()
    success_rate = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    import_type_display = serializers.CharField(source='get_import_type_display', read_only=True)
    organization_name = serializers.CharField(source='organization.nombre_comercial', read_only=True)
    
    class Meta:
        model = ServiceImportLog
        fields = [
            'id', 'organization', 'organization_name',
            'import_type', 'import_type_display',
            'file_name', 'file_size', 'file_path',
            'status', 'status_display',
            'total_rows', 'processed_rows',
            'successful_rows', 'failed_rows',
            'services_created', 'services_updated',
            'services_disabled', 'headquarters_created',
            'started_at', 'completed_at',
            'processing_time', 'duration', 'success_rate',
            'errors', 'warnings', 'validation_errors',
            'created_at', 'created_by'
        ]
        read_only_fields = fields
    
    def get_duration(self, obj):
        """Format processing duration."""
        if obj.processing_time:
            if obj.processing_time < 60:
                return f"{obj.processing_time:.2f} segundos"
            else:
                minutes = int(obj.processing_time / 60)
                seconds = obj.processing_time % 60
                return f"{minutes}m {seconds:.0f}s"
        return None
    
    def get_success_rate(self, obj):
        """Calculate and format success rate."""
        if obj.processed_rows > 0:
            rate = (obj.successful_rows / obj.processed_rows) * 100
            return f"{rate:.1f}%"
        return "0%"


class ServiceStatisticsSerializer(serializers.Serializer):
    """
    Serializer for service statistics dashboard.
    """
    total_services = serializers.IntegerField()
    enabled_services = serializers.IntegerField()
    disabled_services = serializers.IntegerField()
    
    by_group = serializers.DictField(
        child=serializers.IntegerField()
    )
    
    by_complexity = serializers.DictField(
        child=serializers.IntegerField()
    )
    
    by_modality = serializers.DictField(
        child=serializers.IntegerField()
    )
    
    by_headquarters = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    
    telemedicine_enabled = serializers.IntegerField()
    specialized_services = serializers.IntegerField()
    requiring_renewal = serializers.IntegerField()
    
    recent_imports = serializers.ListField(
        child=ServiceImportLogSerializer(),
        required=False
    )
    
    compliance_overview = serializers.DictField(
        required=False
    )