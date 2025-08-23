"""
Serializers for SOGCS (Sistema Obligatorio de Garantía de Calidad en Salud) API endpoints.

Handles serialization/deserialization for:
- HeadquarterLocation (REPS headquarters)
- EnabledHealthService (REPS services)
- SOGCS configuration and alerts
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.organization.models import HealthOrganization
from apps.organization.models import HeadquarterLocation, EnabledHealthService

User = get_user_model()


class HeadquarterLocationSerializer(serializers.ModelSerializer):
    """
    Serializer for HeadquarterLocation model.
    Handles REPS headquarters data with comprehensive validation.
    """
    
    # Computed fields
    is_active = serializers.SerializerMethodField()
    is_about_to_expire = serializers.SerializerMethodField()
    services_count = serializers.SerializerMethodField()
    
    # Related organization info
    organization_name = serializers.CharField(source='organization.organization.razon_social', read_only=True)
    organization_nit = serializers.CharField(source='organization.organization.nit', read_only=True)
    
    # Created by info
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    class Meta:
        model = HeadquarterLocation
        fields = [
            # Basic identification
            'id', 'reps_code', 'name', 'sede_type', 'habilitation_status',
            
            # Location
            'department_name', 'department_code', 'municipality_name', 'municipality_code',
            'address', 'phone_primary', 'email',
            
            # Administrative
            'administrative_contact',
            
            # Dates
            'opening_date', 'habilitation_date', 'next_renewal_date',
            
            # Technical info
            'total_beds', 'icu_beds', 'emergency_beds', 'surgery_rooms', 'consultation_rooms',
            
            # REPS metadata
            'last_reps_sync', 'sync_status',
            
            # Computed fields
            'is_active', 'is_about_to_expire', 'services_count',
            
            # Related info
            'organization', 'organization_name', 'organization_nit',
            'created_by_name', 'created_by_email',
            
            # Timestamps
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organization_name', 'organization_nit', 'created_by_name', 
            'created_by_email', 'is_active', 'is_about_to_expire', 
            'services_count', 'created_at', 'updated_at'
        ]

    def get_is_active(self, obj):
        """Check if headquarters is currently active"""
        return obj.is_operational

    def get_is_about_to_expire(self, obj):
        """Check if headquarters habilitación is about to expire (30 days)"""
        return obj.needs_renewal_alert(days_threshold=30)

    def get_services_count(self, obj):
        """Get count of all services in this headquarters (REPS + manual)"""
        reps_count = obj.enabled_services.count()
        manual_count = obj.health_services.count()
        return reps_count + manual_count

    def validate_reps_code(self, value):
        """Validate that reps_code is unique within organization"""
        if self.instance:
            # Update case
            existing = HeadquarterLocation.objects.filter(
                reps_code=value,
                organization=self.instance.organization
            ).exclude(id=self.instance.id)
        else:
            # Create case - need organization from context
            organization = self.context.get('organization')
            if not organization:
                raise serializers.ValidationError("Organization context required for validation")
            existing = HeadquarterLocation.objects.filter(
                reps_code=value,
                organization=organization
            )
        
        if existing.exists():
            raise serializers.ValidationError("Ya existe una sede con este código en la organización")
        
        return value

    def validate(self, attrs):
        """Cross-field validation"""
        fecha_habilitacion = attrs.get('fecha_habilitacion')
        fecha_vencimiento = attrs.get('fecha_vencimiento')
        
        if fecha_habilitacion and fecha_vencimiento:
            if fecha_vencimiento < fecha_habilitacion:
                raise serializers.ValidationError({
                    'fecha_vencimiento': 'La fecha de vencimiento no puede ser anterior a la fecha de habilitación'
                })
        
        return attrs


class EnabledHealthServiceSerializer(serializers.ModelSerializer):
    """
    Serializer for EnabledHealthService model.
    Handles REPS health services data with comprehensive validation.
    """
    
    # Computed fields
    is_enabled = serializers.SerializerMethodField()
    is_about_to_expire = serializers.SerializerMethodField()
    
    # Related headquarters info
    headquarters_name = serializers.CharField(source='headquarters.name', read_only=True)
    organization_name = serializers.CharField(source='headquarters.organization.organization.razon_social', read_only=True)
    
    # Created by info
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = EnabledHealthService
        fields = [
            # Basic identification
            'id', 'service_code', 'service_name', 'cups_code', 
            'habilitation_status',
            
            # Classification
            'service_group', 'complexity_level',
            
            # Capacity
            'installed_capacity', 'operational_capacity', 'monthly_production',
            
            # Modalities
            'intramural', 'extramural', 'domiciliary', 'telemedicine',
            
            # Dates
            'habilitation_date', 'habilitation_expiry',
            
            # Characteristics
            'requires_authorization', 'reference_center',
            
            # Legal
            'habilitation_act', 'distinctive_code',
            
            # Computed fields
            'is_enabled', 'is_about_to_expire',
            
            # Related info
            'headquarters', 'headquarters_name', 'organization_name',
            'created_by_name',
            
            # Timestamps
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'headquarters_name', 'organization_name',
            'created_by_name', 'is_enabled', 'is_about_to_expire', 
            'created_at', 'updated_at'
        ]

    def get_is_enabled(self, obj):
        """Check if service is currently enabled"""
        return obj.is_valid

    def get_is_about_to_expire(self, obj):
        """Check if service habilitación is about to expire (30 days)"""
        return obj.needs_renewal_alert(days_threshold=30)

    def validate(self, attrs):
        """Cross-field validation"""
        # Date validation
        habilitation_date = attrs.get('habilitation_date')
        habilitation_expiry = attrs.get('habilitation_expiry')
        
        if habilitation_date and habilitation_expiry:
            if habilitation_expiry < habilitation_date:
                raise serializers.ValidationError({
                    'habilitation_expiry': 'La fecha de vencimiento no puede ser anterior a la fecha de habilitación'
                })
        
        return attrs


class HeadquarterLocationSummarySerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for headquarters summaries and dropdowns.
    """
    services_count = serializers.SerializerMethodField()
    
    class Meta:
        model = HeadquarterLocation
        fields = [
            'id', 'reps_code', 'name', 'habilitation_status',
            'department_name', 'municipality_name', 'services_count'
        ]

    def get_services_count(self, obj):
        """Get count of all services in this headquarters (REPS + manual)"""
        reps_count = obj.enabled_services.count()
        manual_count = obj.health_services.count()
        return reps_count + manual_count


class EnabledHealthServiceSummarySerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for services summaries and dropdowns.
    """
    headquarters_name = serializers.CharField(source='headquarters.name', read_only=True)
    
    class Meta:
        model = EnabledHealthService
        fields = [
            'id', 'service_code', 'service_name', 'habilitation_status',
            'complexity_level', 'service_group', 'headquarters_name'
        ]


class SOGCSOverviewSerializer(serializers.Serializer):
    """
    Serializer for SOGCS overview/dashboard data.
    Provides high-level metrics and summary information.
    """
    
    # Organization info
    organization_id = serializers.UUIDField(read_only=True)
    organization_name = serializers.CharField(read_only=True)
    sogcs_enabled = serializers.BooleanField(read_only=True)
    fecha_activacion_sogcs = serializers.DateTimeField(read_only=True)
    
    # Component states
    estado_suh = serializers.CharField(read_only=True)
    estado_pamec = serializers.CharField(read_only=True)
    estado_sic = serializers.CharField(read_only=True)
    estado_sua = serializers.CharField(read_only=True)
    
    # Metrics
    total_headquarters = serializers.IntegerField(read_only=True)
    active_headquarters = serializers.IntegerField(read_only=True)
    total_services = serializers.IntegerField(read_only=True)
    enabled_services = serializers.IntegerField(read_only=True)
    
    # Compliance percentages
    porcentaje_cumplimiento_suh = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    porcentaje_cumplimiento_pamec = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    porcentaje_cumplimiento_sic = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    # Alert counts
    alertas_activas = serializers.IntegerField(read_only=True)
    alertas_criticas = serializers.IntegerField(read_only=True)
    
    # Dates
    fecha_ultima_autoevaluacion = serializers.DateField(read_only=True)
    fecha_proxima_auditoria = serializers.DateField(read_only=True)
    
    # Responsible users
    coordinador_calidad_name = serializers.CharField(read_only=True)
    responsable_habilitacion_name = serializers.CharField(read_only=True)


class SOGCSConfigurationSerializer(serializers.Serializer):
    """
    Serializer for SOGCS configuration management.
    Handles the complex JSON configuration structure.
    """
    
    # SUH Configuration
    suh_enabled = serializers.BooleanField(default=True)
    suh_auto_evaluation_frequency = serializers.ChoiceField(
        choices=[('yearly', 'Anual'), ('biennial', 'Bianual')],
        default='yearly'
    )
    
    # PAMEC Configuration
    pamec_enabled = serializers.BooleanField(default=True)
    pamec_audit_frequency = serializers.ChoiceField(
        choices=[('quarterly', 'Trimestral'), ('semiannual', 'Semestral'), ('annual', 'Anual')],
        default='quarterly'
    )
    
    # SIC Configuration
    sic_enabled = serializers.BooleanField(default=True)
    sic_indicators_enabled = serializers.BooleanField(default=True)
    
    # SUA Configuration
    sua_enabled = serializers.BooleanField(default=False)
    sua_interested = serializers.BooleanField(default=False)
    
    # Notifications Configuration
    notifications_email = serializers.BooleanField(default=True)
    notifications_sms = serializers.BooleanField(default=False)
    notifications_in_app = serializers.BooleanField(default=True)
    
    # Alert Configuration
    alert_expiration_days = serializers.ListField(
        child=serializers.IntegerField(min_value=1, max_value=365),
        default=[7, 15, 30, 60]
    )
    alert_business_hours_only = serializers.BooleanField(default=False)
    
    def to_internal_value(self, data):
        """Convert flat structure to nested SOGCS configuration"""
        validated_data = super().to_internal_value(data)
        
        # Build nested structure
        sogcs_config = {
            'suh': {
                'enabled': validated_data.get('suh_enabled', True),
                'auto_evaluation_frequency': validated_data.get('suh_auto_evaluation_frequency', 'yearly')
            },
            'pamec': {
                'enabled': validated_data.get('pamec_enabled', True),
                'audit_frequency': validated_data.get('pamec_audit_frequency', 'quarterly')
            },
            'sic': {
                'enabled': validated_data.get('sic_enabled', True),
                'indicators_enabled': validated_data.get('sic_indicators_enabled', True)
            },
            'sua': {
                'enabled': validated_data.get('sua_enabled', False),
                'interested': validated_data.get('sua_interested', False)
            },
            'notifications': {
                'email': validated_data.get('notifications_email', True),
                'sms': validated_data.get('notifications_sms', False),
                'in_app': validated_data.get('notifications_in_app', True)
            },
            'alerts': {
                'expiration_days': validated_data.get('alert_expiration_days', [7, 15, 30, 60]),
                'business_hours_only': validated_data.get('alert_business_hours_only', False)
            }
        }
        
        return sogcs_config

    def to_representation(self, instance):
        """Convert nested SOGCS configuration to flat structure"""
        if not instance:
            instance = {}
        
        return {
            # SUH
            'suh_enabled': instance.get('suh', {}).get('enabled', True),
            'suh_auto_evaluation_frequency': instance.get('suh', {}).get('auto_evaluation_frequency', 'yearly'),
            
            # PAMEC
            'pamec_enabled': instance.get('pamec', {}).get('enabled', True),
            'pamec_audit_frequency': instance.get('pamec', {}).get('audit_frequency', 'quarterly'),
            
            # SIC
            'sic_enabled': instance.get('sic', {}).get('enabled', True),
            'sic_indicators_enabled': instance.get('sic', {}).get('indicators_enabled', True),
            
            # SUA
            'sua_enabled': instance.get('sua', {}).get('enabled', False),
            'sua_interested': instance.get('sua', {}).get('interested', False),
            
            # Notifications
            'notifications_email': instance.get('notifications', {}).get('email', True),
            'notifications_sms': instance.get('notifications', {}).get('sms', False),
            'notifications_in_app': instance.get('notifications', {}).get('in_app', True),
            
            # Alerts
            'alert_expiration_days': instance.get('alerts', {}).get('expiration_days', [7, 15, 30, 60]),
            'alert_business_hours_only': instance.get('alerts', {}).get('business_hours_only', False),
        }


class SOGCSAlertSerializer(serializers.Serializer):
    """
    Serializer for SOGCS alerts data.
    """
    
    alert_type = serializers.CharField(read_only=True)
    severity = serializers.ChoiceField(
        choices=[('LOW', 'Baja'), ('MEDIUM', 'Media'), ('HIGH', 'Alta'), ('CRITICAL', 'Crítica')],
        read_only=True
    )
    title = serializers.CharField(read_only=True)
    message = serializers.CharField(read_only=True)
    entity_type = serializers.ChoiceField(
        choices=[('headquarters', 'Sede'), ('service', 'Servicio')],
        read_only=True
    )
    entity_id = serializers.IntegerField(read_only=True)
    due_date = serializers.DateField(read_only=True)
    days_until_due = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    metadata = serializers.DictField(read_only=True)


class REPSImportSerializer(serializers.Serializer):
    """
    Serializer for REPS import operations.
    """
    
    headquarters_file = serializers.FileField(required=False, help_text="Archivo de sedes REPS (.xls)")
    services_file = serializers.FileField(required=False, help_text="Archivo de servicios REPS (.xls)")
    create_backup = serializers.BooleanField(default=True, help_text="Crear backup antes de importar")
    force_recreate = serializers.BooleanField(default=False, help_text="Eliminar todas las sedes existentes antes de importar (recreación completa)")
    
    def validate(self, attrs):
        """Validate that at least one file is provided"""
        if not attrs.get('headquarters_file') and not attrs.get('services_file'):
            raise serializers.ValidationError("Debe proporcionar al menos un archivo (sedes o servicios)")
        
        return attrs