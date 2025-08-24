"""
Organization Serializers Package.

This package contains DRF serializers for organization-related models
including SOGCS SEDES functionality.
"""

# Import base serializers (existing functionality)
from .base_serializers import (
    # Location serializers
    LocationSerializer,
    LocationCreateSerializer,
    LocationListSerializer,
    LocationWizardStep1Serializer,
    
    # Organization serializers
    OrganizationSerializer,
    OrganizationCreateSerializer,
    OrganizationListSerializer,
    OrganizationWizardStep1Serializer,
    OrganizationWizardSerializer,
    OrganizationWizardCreateSerializer,
    OrganizationHistorySerializer,
    
    # Sector template serializers
    SectorTemplateSerializer,
    SectorTemplateListSerializer,
    SectorTemplateCreateSerializer,
    SectorTemplateApplySerializer,
    
    # Audit log serializers
    AuditLogSerializer,
    AuditLogListSerializer,
    RollbackRequestSerializer,
    
    # Health organization serializers
    HealthOrganizationSerializer,
    HealthOrganizationCreateSerializer,
    HealthOrganizationListSerializer,
    
    # Health service serializers
    HealthServiceSerializer,
    HealthServiceCreateSerializer,
    HealthServiceListSerializer,
    HealthServicesByOrganizationSerializer,
    REPSValidationSerializer,
    HealthServicesValidationSerializer,
    
    # Sede serializers (legacy)
    SedeServicioSerializer,
    SedeSerializer,
    SedeListSerializer,
    SedeCreateSerializer,
    SedeImportSerializer,
    SedeValidationSerializer,
    SedeBulkSerializer,
    
    # DIVIPOLA serializers
    DivipolaSerializer,
    DepartmentSerializer,
    MunicipalitySerializer,
)

# Import SOGCS SEDES serializers (new functionality)
from .sogcs_sedes_serializers import (
    # Headquarters serializers
    HeadquarterLocationListSerializer,
    HeadquarterLocationSerializer,
    HeadquarterLocationCreateSerializer,
    HeadquarterLocationImportSerializer,
    HeadquarterLocationSyncSerializer,
    
    # Service serializers
    EnabledHealthServiceListSerializer,
    EnabledHealthServiceSerializer,
    EnabledHealthServiceCreateSerializer,
    ServiceComplianceUpdateSerializer,
    ServiceRenewalSerializer,
    
    # Process serializers
    ServiceHabilitationProcessListSerializer,
    ServiceHabilitationProcessSerializer,
    ServiceHabilitationProcessCreateSerializer,
    ProcessDocumentUploadSerializer,
    ProcessPhaseAdvanceSerializer,
    
    # Alert and validation serializers
    HabilitationAlertSerializer,
    REPSValidationResultSerializer,
    
    # Bulk operation serializers
    BulkHeadquartersImportSerializer,
    BulkServicesUpdateSerializer,
)

# Import Health Services serializers
from .health_services_serializers import (
    HealthServiceCatalogSerializer,
    SedeHealthServiceListSerializer,
    SedeHealthServiceDetailSerializer,
    SedeHealthServiceCreateUpdateSerializer,
    ServiceImportSerializer,
    ServiceBulkActionSerializer,
    ServiceImportLogSerializer,
    ServiceStatisticsSerializer,
)

# Import Organizational Template serializers
from .organizational_template_serializers import (
    ServicioHabilitadoSerializer,
    TipoComiteSerializer,
    TipoCargoSerializer,
    AreaFuncionalSerializer,
    AreaFuncionalCargoSerializer,
    ValidacionSOGCSSerializer,
    TemplateOrganizacionalListSerializer,
    TemplateOrganizacionalDetailSerializer,
    AplicacionTemplateSerializer,
    AplicarTemplateSerializer,
    HistorialCambiosTemplateSerializer,
)

# Import Organizational Chart serializers
from .organizational_chart_serializers import (
    # Sector serializers
    SectorNormativaSerializer,
    SectorSerializer,
    SectorListSerializer,
    SectorCreateSerializer,
    
    # Template serializers
    PlantillaOrganigramaSerializer,
    PlantillaOrganigramaListSerializer,
    PlantillaOrganigramaCreateSerializer,
    
    # Organizational chart serializers
    OrganizationalChartSerializer,
    OrganizationalChartListSerializer,
    OrganizationalChartCreateSerializer,
    
    # Area serializers
    AreaSerializer,
    AreaListSerializer,
    AreaCreateSerializer,
    
    # Position serializers
    ResponsabilidadSerializer,
    AutoridadSerializer,
    CargoSerializer,
    CargoListSerializer,
    CargoCreateSerializer,
    
    # Bulk operation serializers
    BulkAreaCreateSerializer,
    BulkPositionCreateSerializer,
    
    # Validation serializers
    ChartValidationSerializer,
    TemplateApplicationSerializer,
)

__all__ = [
    # Base serializers (existing functionality)
    'LocationSerializer',
    'LocationCreateSerializer',
    'LocationListSerializer',
    'LocationWizardStep1Serializer',
    'OrganizationSerializer',
    'OrganizationCreateSerializer',
    'OrganizationListSerializer',
    'OrganizationWizardStep1Serializer',
    'OrganizationWizardSerializer',
    'OrganizationWizardCreateSerializer',
    'OrganizationHistorySerializer',
    'SectorTemplateSerializer',
    'SectorTemplateListSerializer',
    'SectorTemplateCreateSerializer',
    'SectorTemplateApplySerializer',
    'AuditLogSerializer',
    'AuditLogListSerializer',
    'RollbackRequestSerializer',
    'HealthOrganizationSerializer',
    'HealthOrganizationCreateSerializer',
    'HealthOrganizationListSerializer',
    'HealthServiceSerializer',
    'HealthServiceCreateSerializer',
    'HealthServiceListSerializer',
    'HealthServicesByOrganizationSerializer',
    'REPSValidationSerializer',
    'HealthServicesValidationSerializer',
    'SedeServicioSerializer',
    'SedeSerializer',
    'SedeListSerializer',
    'SedeCreateSerializer',
    'SedeImportSerializer',
    'SedeValidationSerializer',
    'SedeBulkSerializer',
    'DivipolaSerializer',
    'DepartmentSerializer',
    'MunicipalitySerializer',
    
    # SOGCS SEDES serializers (new functionality)
    'HeadquarterLocationListSerializer',
    'HeadquarterLocationSerializer', 
    'HeadquarterLocationCreateSerializer',
    'HeadquarterLocationImportSerializer',
    'HeadquarterLocationSyncSerializer',
    'EnabledHealthServiceListSerializer',
    'EnabledHealthServiceSerializer',
    'EnabledHealthServiceCreateSerializer', 
    'ServiceComplianceUpdateSerializer',
    'ServiceRenewalSerializer',
    'ServiceHabilitationProcessListSerializer',
    'ServiceHabilitationProcessSerializer',
    'ServiceHabilitationProcessCreateSerializer',
    'ProcessDocumentUploadSerializer',
    'ProcessPhaseAdvanceSerializer',
    'HabilitationAlertSerializer',
    'REPSValidationResultSerializer',
    'BulkHeadquartersImportSerializer',
    'BulkServicesUpdateSerializer',
    
    # Health Services serializers
    'HealthServiceCatalogSerializer',
    'SedeHealthServiceListSerializer',
    'SedeHealthServiceDetailSerializer',
    'SedeHealthServiceCreateUpdateSerializer',
    'ServiceImportSerializer',
    'ServiceBulkActionSerializer',
    'ServiceImportLogSerializer',
    'ServiceStatisticsSerializer',
    
    # Organizational Template serializers
    'ServicioHabilitadoSerializer',
    'TipoComiteSerializer',
    'TipoCargoSerializer',
    'AreaFuncionalSerializer',
    'AreaFuncionalCargoSerializer',
    'ValidacionSOGCSSerializer',
    'TemplateOrganizacionalListSerializer',
    'TemplateOrganizacionalDetailSerializer',
    'AplicacionTemplateSerializer',
    'AplicarTemplateSerializer',
    'HistorialCambiosTemplateSerializer',
    
    # Organizational Chart serializers
    'SectorNormativaSerializer',
    'SectorSerializer',
    'SectorListSerializer',
    'SectorCreateSerializer',
    'PlantillaOrganigramaSerializer',
    'PlantillaOrganigramaListSerializer',
    'PlantillaOrganigramaCreateSerializer',
    'OrganizationalChartSerializer',
    'OrganizationalChartListSerializer',
    'OrganizationalChartCreateSerializer',
    'AreaSerializer',
    'AreaListSerializer',
    'AreaCreateSerializer',
    'ResponsabilidadSerializer',
    'AutoridadSerializer',
    'CargoSerializer',
    'CargoListSerializer',
    'CargoCreateSerializer',
    'BulkAreaCreateSerializer',
    'BulkPositionCreateSerializer',
    'ChartValidationSerializer',
    'TemplateApplicationSerializer',
]