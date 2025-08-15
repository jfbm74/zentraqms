"""
URL configuration for Organization module in ZentraQMS.

This module defines the URL patterns for organization and location endpoints.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, LocationViewSet, SectorTemplateViewSet, HealthViewSet

# Create a router and register viewsets
router = DefaultRouter()
router.register(r"organizations", OrganizationViewSet, basename="organization")
router.register(r"locations", LocationViewSet, basename="location")
router.register(r"sector-templates", SectorTemplateViewSet, basename="sectortemplate")
router.register(r"health", HealthViewSet, basename="health")

app_name = "organization"

urlpatterns = [
    # Include router URLs
    path("", include(router.urls)),
    # Additional custom endpoints can be added here if needed
]
