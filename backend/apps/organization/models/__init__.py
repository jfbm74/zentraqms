"""
Organization models package.

This package provides backward compatibility for imports from the original models.py file.
All models are now organized into modular files but can still be imported from this package.
"""

# Base models and utility functions
from .base import (
    Organization,
    Location, 
    SectorTemplate,
    AuditLog,
    get_logo_upload_path,
    validate_logo,
)

# Health sector models
from .health import (
    HealthOrganization,
    HealthService,
    SedePrestadora,
    SedeServicio,
)

# SUH synchronization models
from .suh_sync import (
    SUHExtraction,
    SUHDataMapping,
    SUHDiscrepancy,
    SUHSyncSchedule,
)

# SOGCS SEDES models
from .sogcs_sedes import (
    HeadquarterLocation,
    EnabledHealthService,
    ServiceHabilitationProcess,
)

# Health Services models
from .health_services import (
    HealthServiceCatalog,
    SedeHealthService,
    ServiceImportLog,
)

# Capacity models
from .capacity import (
    CapacidadInstalada,
    CapacidadHistorial,
    CapacidadImportLog,
)

# Organizational Chart models
from .organizational_chart import (
    Sector,
    SectorNormativa,
    PlantillaOrganigrama,
    OrganizationalChart,
)

# Organizational Template models
from .organizational_template import (
    ComplejidadIPS,
    ServicioHabilitado,
    TipoComite,
    TipoCargo,
    AreaFuncional,
    AreaFuncionalCargo,
    TemplateOrganizacional,
    AplicacionTemplate,
    ValidacionSOGCS,
    HistorialCambiosTemplate,
)

# Organizational Structure models
from .organizational_structure import (
    Area,
    ServiceAreaAssignment,
    Cargo,
    Responsabilidad,
    Autoridad,
)

# Committee models
from .committees import (
    Comite,
    MiembroComite,
    CommitteeMeeting,
    MeetingAttendance,
)

# Assignment and Service models
from .assignments import (
    AsignacionCargo,
    Service,
    ServiceIntegration,
)

# Export all models and functions for backward compatibility
__all__ = [
    # Base models
    'Organization',
    'Location',
    'SectorTemplate', 
    'AuditLog',
    
    # Utility functions
    'get_logo_upload_path',
    'validate_logo',
    
    # Health models
    'HealthOrganization',
    'HealthService',
    'SedePrestadora',
    'SedeServicio',
    
    # SUH models
    'SUHExtraction',
    'SUHDataMapping',
    'SUHDiscrepancy',
    'SUHSyncSchedule',
    
    # SOGCS SEDES models
    'HeadquarterLocation',
    'EnabledHealthService',
    'ServiceHabilitationProcess',
    
    # Health Services models
    'HealthServiceCatalog',
    'SedeHealthService',
    'ServiceImportLog',
    
    # Capacity models
    'CapacidadInstalada',
    'CapacidadHistorial',
    'CapacidadImportLog',
    
    # Organizational Chart models
    'Sector',
    'SectorNormativa',
    'PlantillaOrganigrama',
    'OrganizationalChart',
    
    # Organizational Template models
    'ComplejidadIPS',
    'ServicioHabilitado',
    'TipoComite',
    'TipoCargo',
    'AreaFuncional',
    'AreaFuncionalCargo',
    'TemplateOrganizacional',
    'AplicacionTemplate',
    'ValidacionSOGCS',
    'HistorialCambiosTemplate',
    
    # Organizational Structure models
    'Area',
    'ServiceAreaAssignment',
    'Cargo',
    'Responsabilidad',
    'Autoridad',
    
    # Committee models
    'Comite',
    'MiembroComite',
    'CommitteeMeeting',
    'MeetingAttendance',
    
    # Assignment and Service models
    'AsignacionCargo',
    'Service',
    'ServiceIntegration',
]