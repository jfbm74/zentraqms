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
]