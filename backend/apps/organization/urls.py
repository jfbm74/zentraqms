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
]
