"""
DRF Serializers for SOGCS SEDES Models.

This module contains serializers for headquarters, enabled services,
and habilitation processes with REPS integration support.
"""

from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db import transaction
from decimal import Decimal

from apps.organization.models import (
    HeadquarterLocation,
    EnabledHealthService,
    ServiceHabilitationProcess,
    HealthOrganization
)


# ============================================================================
# HEADQUARTERS SERIALIZERS
# ============================================================================

class HeadquarterLocationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for headquarters listing.
    """
    organization_name = serializers.CharField(source='organization.organization.razon_social', read_only=True)
    days_until_renewal = serializers.IntegerField(read_only=True)
    is_operational = serializers.BooleanField(read_only=True)
    services_count = serializers.IntegerField(source='enabled_services.count', read_only=True)
    
    class Meta:
        model = HeadquarterLocation
        fields = [
            'id',
            'reps_code',
            'name',
            'sede_type',
            'organization_name',
            'department_name',
            'municipality_name',
            'operational_status',
            'habilitation_status',
            'next_renewal_date',
            'days_until_renewal',
            'is_operational',
            'services_count',
            'is_main_headquarters',
        ]


class HeadquarterLocationSerializer(serializers.ModelSerializer):
    """
    Full serializer for headquarters detail and update.
    """
    organization_name = serializers.CharField(source='organization.organization.razon_social', read_only=True)
    complete_address = serializers.CharField(read_only=True)
    days_until_renewal = serializers.IntegerField(read_only=True)
    is_operational = serializers.BooleanField(read_only=True)
    services_count = serializers.IntegerField(source='enabled_services.count', read_only=True)
    
    class Meta:
        model = HeadquarterLocation
        fields = '__all__'
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'deleted_at',
            'deleted_by',
            'last_reps_sync',
            'sync_status',
            'sync_errors',
        ]
    
    def validate(self, attrs):
        """Validate headquarters data."""
        # Validate suspension dates
        suspension_start = attrs.get('suspension_start')
        suspension_end = attrs.get('suspension_end')
        
        if suspension_start and suspension_end:
            if suspension_end <= suspension_start:
                raise serializers.ValidationError({
                    'suspension_end': _('La fecha de fin debe ser posterior a la fecha de inicio.')
                })
        
        # Validate capacity values
        icu_beds = attrs.get('icu_beds', 0)
        total_beds = attrs.get('total_beds', 0)
        
        if icu_beds > total_beds:
            raise serializers.ValidationError({
                'icu_beds': _('Las camas UCI no pueden exceder el total de camas.')
            })
        
        return attrs


class HeadquarterLocationCreateSerializer(HeadquarterLocationSerializer):
    """
    Serializer for creating new headquarters.
    """
    
    def create(self, validated_data):
        """Create headquarters with audit tracking."""
        user = self.context['request'].user
        validated_data['created_by'] = user
        validated_data['updated_by'] = user
        
        # If this is the first headquarters, make it main
        organization = validated_data.get('organization')
        if organization and not HeadquarterLocation.objects.filter(
            organization=organization,
            deleted_at__isnull=True
        ).exists():
            validated_data['is_main_headquarters'] = True
        
        return super().create(validated_data)


class HeadquarterLocationImportSerializer(serializers.Serializer):
    """
    Serializer for importing headquarters from REPS Excel file.
    """
    file = serializers.FileField(required=True)
    validate_only = serializers.BooleanField(default=True)
    organization_id = serializers.UUIDField(required=True)
    
    def validate_file(self, value):
        """Validate uploaded file."""
        # Check file extension
        if not value.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError(_('El archivo debe ser un Excel (.xlsx o .xls)'))
        
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(_('El archivo no debe superar los 10MB'))
        
        return value


class HeadquarterLocationSyncSerializer(serializers.Serializer):
    """
    Serializer for REPS synchronization request.
    """
    headquarters_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        allow_empty=True,
        help_text=_('Lista de IDs de sedes a sincronizar. Si está vacío, sincroniza todas.')
    )
    force_sync = serializers.BooleanField(
        default=False,
        help_text=_('Forzar sincronización incluso si fue sincronizado recientemente.')
    )


# ============================================================================
# ENABLED SERVICES SERIALIZERS
# ============================================================================

class EnabledHealthServiceListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for service listing.
    """
    headquarters_name = serializers.CharField(source='headquarters.name', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    overall_compliance = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = EnabledHealthService
        fields = [
            'id',
            'service_code',
            'service_name',
            'service_group',
            'complexity_level',
            'headquarters_name',
            'habilitation_status',
            'habilitation_expiry',
            'days_until_expiry',
            'is_valid',
            'overall_compliance',
            'distinctive_code',
        ]


class EnabledHealthServiceSerializer(serializers.ModelSerializer):
    """
    Full serializer for service detail and update.
    """
    headquarters_name = serializers.CharField(source='headquarters.name', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    overall_compliance = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    missing_dependencies = serializers.SerializerMethodField()
    
    class Meta:
        model = EnabledHealthService
        fields = '__all__'
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'deleted_at',
            'deleted_by',
        ]
    
    def get_missing_dependencies(self, obj):
        """Get list of missing service dependencies."""
        missing = obj.get_missing_dependencies()
        return [
            {
                'id': str(dep.id),
                'service_code': dep.service_code,
                'service_name': dep.service_name,
                'status': dep.habilitation_status
            }
            for dep in missing
        ]
    
    def validate(self, attrs):
        """Validate service data."""
        # Validate that at least one modality is selected
        modalities = ['intramural', 'extramural', 'domiciliary', 'telemedicine']
        has_modality = any(attrs.get(mod, False) for mod in modalities)
        
        if not has_modality:
            raise serializers.ValidationError({
                'intramural': _('Debe seleccionar al menos una modalidad de prestación.')
            })
        
        # Validate expiry date
        habilitation_date = attrs.get('habilitation_date')
        habilitation_expiry = attrs.get('habilitation_expiry')
        
        if habilitation_date and habilitation_expiry:
            if habilitation_expiry <= habilitation_date:
                raise serializers.ValidationError({
                    'habilitation_expiry': _('La fecha de vencimiento debe ser posterior a la fecha de habilitación.')
                })
        
        # Validate compliance percentages
        compliance_fields = ['infrastructure_compliance', 'equipment_compliance', 'medication_compliance']
        for field in compliance_fields:
            value = attrs.get(field)
            if value is not None and (value < 0 or value > 100):
                raise serializers.ValidationError({
                    field: _('El porcentaje debe estar entre 0 y 100.')
                })
        
        return attrs


class EnabledHealthServiceCreateSerializer(EnabledHealthServiceSerializer):
    """
    Serializer for creating new enabled services.
    """
    
    def create(self, validated_data):
        """Create service with audit tracking."""
        user = self.context['request'].user
        validated_data['created_by'] = user
        validated_data['updated_by'] = user
        
        # Handle interdependencies (many-to-many)
        interdependencies = validated_data.pop('interdependencies', [])
        
        service = super().create(validated_data)
        
        # Set interdependencies
        if interdependencies:
            service.interdependencies.set(interdependencies)
        
        return service


class ServiceComplianceUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating service compliance metrics.
    """
    
    class Meta:
        model = EnabledHealthService
        fields = [
            'infrastructure_compliance',
            'equipment_compliance',
            'medication_compliance',
            'self_evaluation_score',
            'external_audit_score',
            'last_self_evaluation',
            'last_external_audit',
            'quality_indicators',
            'patient_safety_events',
        ]
    
    def validate(self, attrs):
        """Validate compliance data."""
        # Validate percentage fields
        percentage_fields = [
            'infrastructure_compliance',
            'equipment_compliance',
            'medication_compliance',
            'self_evaluation_score',
            'external_audit_score'
        ]
        
        for field in percentage_fields:
            value = attrs.get(field)
            if value is not None and (value < 0 or value > 100):
                raise serializers.ValidationError({
                    field: _('El porcentaje debe estar entre 0 y 100.')
                })
        
        return attrs


class ServiceRenewalSerializer(serializers.Serializer):
    """
    Serializer for initiating service renewal process.
    """
    service_id = serializers.UUIDField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_service_id(self, value):
        """Validate service exists and needs renewal."""
        try:
            service = EnabledHealthService.objects.get(id=value)
        except EnabledHealthService.DoesNotExist:
            raise serializers.ValidationError(_('Servicio no encontrado.'))
        
        # Check if service needs renewal
        if service.days_until_expiry > 180:
            raise serializers.ValidationError(
                _('El servicio no requiere renovación aún (más de 180 días para vencer).')
            )
        
        return value


# ============================================================================
# HABILITATION PROCESS SERIALIZERS
# ============================================================================

class ServiceHabilitationProcessListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for process listing.
    """
    headquarters_name = serializers.CharField(source='headquarters.name', read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)
    days_since_submission = serializers.IntegerField(read_only=True)
    documentation_progress = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = ServiceHabilitationProcess
        fields = [
            'id',
            'service_code',
            'service_name',
            'process_type',
            'headquarters_name',
            'current_status',
            'current_phase',
            'submission_date',
            'resolution_date',
            'is_completed',
            'is_approved',
            'days_since_submission',
            'documentation_progress',
        ]


class ServiceHabilitationProcessSerializer(serializers.ModelSerializer):
    """
    Full serializer for process detail and update.
    """
    headquarters_name = serializers.CharField(source='headquarters.name', read_only=True)
    is_completed = serializers.BooleanField(read_only=True)
    is_approved = serializers.BooleanField(read_only=True)
    days_since_submission = serializers.IntegerField(read_only=True)
    documentation_progress = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = ServiceHabilitationProcess
        fields = '__all__'
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'deleted_at',
            'deleted_by',
            'process_duration_days',
        ]
    
    def validate(self, attrs):
        """Validate process data."""
        # Validate verification dates
        verification_scheduled = attrs.get('verification_scheduled')
        verification_completed = attrs.get('verification_completed')
        
        if verification_scheduled and verification_completed:
            if verification_completed < verification_scheduled:
                raise serializers.ValidationError({
                    'verification_completed': _('La fecha de realización no puede ser anterior a la fecha programada.')
                })
        
        # Validate resolution date
        submission_date = attrs.get('submission_date')
        resolution_date = attrs.get('resolution_date')
        
        if submission_date and resolution_date:
            if resolution_date < submission_date:
                raise serializers.ValidationError({
                    'resolution_date': _('La fecha de resolución no puede ser anterior a la fecha de radicación.')
                })
        
        return attrs


class ServiceHabilitationProcessCreateSerializer(ServiceHabilitationProcessSerializer):
    """
    Serializer for creating new habilitation process.
    """
    
    def create(self, validated_data):
        """Create process with audit tracking and initial setup."""
        user = self.context['request'].user
        validated_data['created_by'] = user
        validated_data['updated_by'] = user
        
        # Set initial required documents based on process type
        process_type = validated_data.get('process_type')
        validated_data['required_documents'] = self._get_required_documents(process_type)
        
        return super().create(validated_data)
    
    def _get_required_documents(self, process_type):
        """Get list of required documents based on process type."""
        base_documents = {
            'formulario_inscripcion': 'Formulario de inscripción',
            'certificado_existencia': 'Certificado de existencia y representación legal',
            'autoevaluacion': 'Documento de autoevaluación',
            'planos_infraestructura': 'Planos de infraestructura',
            'manual_bioseguridad': 'Manual de bioseguridad',
            'programa_tecnovigilancia': 'Programa de tecnovigilancia',
        }
        
        if process_type == 'renovacion':
            base_documents['informe_indicadores'] = 'Informe de indicadores del último año'
            base_documents['plan_mejoramiento'] = 'Plan de mejoramiento continuo'
        
        elif process_type == 'ampliacion':
            base_documents['justificacion_ampliacion'] = 'Justificación técnica de la ampliación'
            base_documents['estudio_demanda'] = 'Estudio de demanda del servicio'
        
        return base_documents


class ProcessDocumentUploadSerializer(serializers.Serializer):
    """
    Serializer for uploading process documents.
    """
    process_id = serializers.UUIDField(required=True)
    document_type = serializers.CharField(required=True)
    document_file = serializers.FileField(required=True)
    description = serializers.CharField(required=False, allow_blank=True)
    
    def validate_document_file(self, value):
        """Validate uploaded document."""
        # Check file extension
        allowed_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
        file_ext = value.name.lower().split('.')[-1]
        
        if f'.{file_ext}' not in allowed_extensions:
            raise serializers.ValidationError(
                _('Formato de archivo no permitido. Use: PDF, DOC, DOCX, JPG, PNG')
            )
        
        # Check file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(_('El archivo no debe superar los 5MB'))
        
        return value


class ProcessPhaseAdvanceSerializer(serializers.Serializer):
    """
    Serializer for advancing process to next phase.
    """
    process_id = serializers.UUIDField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_process_id(self, value):
        """Validate process exists and can advance."""
        try:
            process = ServiceHabilitationProcess.objects.get(id=value)
        except ServiceHabilitationProcess.DoesNotExist:
            raise serializers.ValidationError(_('Proceso no encontrado.'))
        
        if process.is_completed:
            raise serializers.ValidationError(_('El proceso ya está completado.'))
        
        return value


# ============================================================================
# ALERT SERIALIZERS
# ============================================================================

class HabilitationAlertSerializer(serializers.Serializer):
    """
    Serializer for habilitation alerts and notifications.
    """
    alert_type = serializers.CharField()
    severity = serializers.ChoiceField(choices=['low', 'medium', 'high', 'critical'])
    entity_type = serializers.CharField()
    entity_id = serializers.UUIDField()
    entity_name = serializers.CharField()
    message = serializers.CharField()
    days_remaining = serializers.IntegerField(required=False)
    action_required = serializers.CharField()
    created_at = serializers.DateTimeField()


class REPSValidationResultSerializer(serializers.Serializer):
    """
    Serializer for REPS validation results.
    """
    is_valid = serializers.BooleanField()
    headquarters_count = serializers.IntegerField()
    services_count = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.CharField())
    warnings = serializers.ListField(child=serializers.CharField())
    preview_data = serializers.DictField()


# ============================================================================
# BULK OPERATION SERIALIZERS
# ============================================================================

class BulkHeadquartersImportSerializer(serializers.Serializer):
    """
    Serializer for bulk headquarters import.
    """
    headquarters_data = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        min_length=1
    )
    organization_id = serializers.UUIDField(required=True)
    skip_validation = serializers.BooleanField(default=False)
    
    def validate_organization_id(self, value):
        """Validate organization exists."""
        try:
            HealthOrganization.objects.get(organization_id=value)
        except HealthOrganization.DoesNotExist:
            raise serializers.ValidationError(_('Organización no encontrada.'))
        return value


class BulkServicesUpdateSerializer(serializers.Serializer):
    """
    Serializer for bulk service updates.
    """
    service_updates = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        min_length=1
    )
    update_type = serializers.ChoiceField(
        choices=['status', 'compliance', 'renewal'],
        required=True
    )