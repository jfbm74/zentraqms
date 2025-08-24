"""
URL configuration for Organization module in ZentraQMS.

This module defines the URL patterns for organization and location endpoints.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationViewSet, 
    LocationViewSet, 
    SectorTemplateViewSet, 
    HealthViewSet,
    SedeViewSet,
    OrganizationWizardViewSet,
    DivipolaViewSet,
    # SOGCS views
    HeadquarterLocationViewSet,
    EnabledHealthServiceViewSet,
    ServiceHabilitationProcessViewSet
)
# Import health services views directly from the module file
from apps.organization.views.health_services_views import (
    HealthServiceCatalogViewSet,
    SedeHealthServiceViewSet
)
# Import capacity views
from apps.organization.views.capacity_views import (
    CapacidadInstaladaViewSet,
    CapacidadHistorialViewSet,
    CapacidadImportLogViewSet
)

# Import organizational chart views
from apps.organization.views.organizational_chart_views import (
    SectorViewSet,
    SectorNormativaViewSet,
    PlantillaOrganigramaViewSet,
    OrganizationalChartViewSet,
    AreaViewSet,
    CargoViewSet,
    ResponsabilidadViewSet,
    AutoridadViewSet
)

# Import validation views
from apps.organization.views.validation_views import (
    RealTimeValidationViewSet,
    InstantComplianceCheckView,
    LiveFeedbackView
)

# Create a router and register viewsets
router = DefaultRouter()
router.register(r"organizations", OrganizationViewSet, basename="organization")
router.register(r"locations", LocationViewSet, basename="location")
router.register(r"sector-templates", SectorTemplateViewSet, basename="sectortemplate")
router.register(r"health", HealthViewSet, basename="health")
router.register(r"sedes", SedeViewSet, basename="sede")
# Simplified wizard endpoints
router.register(r"wizard", OrganizationWizardViewSet, basename="organization-wizard")
router.register(r"divipola", DivipolaViewSet, basename="divipola")

# SOGCS Sedes endpoints
router.register(r"headquarters", HeadquarterLocationViewSet, basename="headquarters")
router.register(r"enabled-services", EnabledHealthServiceViewSet, basename="enabled-services")
router.register(r"habilitation-processes", ServiceHabilitationProcessViewSet, basename="habilitation-processes")

# Health Services endpoints
router.register(r"health-service-catalog", HealthServiceCatalogViewSet, basename="health-service-catalog")
router.register(r"sede-health-services", SedeHealthServiceViewSet, basename="sede-health-services")

# Capacity endpoints
router.register(r"capacidad", CapacidadInstaladaViewSet, basename="capacidad")
router.register(r"capacidad-historial", CapacidadHistorialViewSet, basename="capacidad-historial")
router.register(r"capacidad-import-logs", CapacidadImportLogViewSet, basename="capacidad-import-logs")

# Organizational Chart endpoints
router.register(r"sectors", SectorViewSet, basename="sector")
router.register(r"sector-normativas", SectorNormativaViewSet, basename="sector-normativa")
router.register(r"orgchart-templates", PlantillaOrganigramaViewSet, basename="orgchart-template")
router.register(r"organizational-charts", OrganizationalChartViewSet, basename="organizational-chart")
router.register(r"areas", AreaViewSet, basename="area")
router.register(r"positions", CargoViewSet, basename="position")
router.register(r"responsibilities", ResponsabilidadViewSet, basename="responsibility")
router.register(r"authorities", AutoridadViewSet, basename="authority")

# Validation endpoints
router.register(r"realtime-validation", RealTimeValidationViewSet, basename="realtime-validation")

app_name = "organization"

urlpatterns = [
    # Include router URLs
    path("", include(router.urls)),
    
    # URLs específicas para sedes por organización
    path("organizations/<uuid:org_id>/sedes/", 
         SedeViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='organization-sedes-list'),
    path("organizations/<uuid:org_id>/sedes/<uuid:id>/", 
         SedeViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), 
         name='organization-sedes-detail'),
    path("organizations/<uuid:org_id>/sedes/import/", 
         SedeViewSet.as_view({'post': 'import_sedes'}), 
         name='organization-sedes-import'),
    path("organizations/<uuid:org_id>/sedes/export/", 
         SedeViewSet.as_view({'get': 'export_sedes'}), 
         name='organization-sedes-export'),
    path("organizations/<uuid:org_id>/sedes/validate/", 
         SedeViewSet.as_view({'post': 'validate_sede'}), 
         name='organization-sedes-validate'),
    path("organizations/<uuid:org_id>/sedes/bulk-create/", 
         SedeViewSet.as_view({'post': 'bulk_create'}), 
         name='organization-sedes-bulk-create'),
    
    # Organizational Chart specific URLs
    path("organizational-charts/<uuid:chart_id>/validate/",
         OrganizationalChartViewSet.as_view({'post': 'validate_chart'}),
         name='organizational-chart-validate'),
    path("organizational-charts/<uuid:chart_id>/approve/",
         OrganizationalChartViewSet.as_view({'post': 'approve_chart'}),
         name='organizational-chart-approve'),
    path("organizational-charts/<uuid:chart_id>/create-version/",
         OrganizationalChartViewSet.as_view({'post': 'create_new_version'}),
         name='organizational-chart-create-version'),
    
    # Template specific URLs
    path("orgchart-templates/<uuid:template_id>/apply/",
         PlantillaOrganigramaViewSet.as_view({'post': 'apply_template'}),
         name='orgchart-template-apply'),
    path("orgchart-templates/<uuid:template_id>/clone/",
         PlantillaOrganigramaViewSet.as_view({'post': 'clone_template'}),
         name='orgchart-template-clone'),
    
    # Bulk operations URLs
    path("areas/bulk-create/",
         AreaViewSet.as_view({'post': 'bulk_create'}),
         name='areas-bulk-create'),
    path("positions/bulk-create/",
         CargoViewSet.as_view({'post': 'bulk_create'}),
         name='positions-bulk-create'),
    
    # Real-time validation URLs
    path("validation/instant-compliance/",
         InstantComplianceCheckView.as_view(),
         name='instant-compliance-check'),
    path("validation/live-feedback/",
         LiveFeedbackView.as_view(),
         name='live-feedback'),
]
