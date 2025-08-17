"""
URL configuration for SOGCS (Sistema Obligatorio de Garantía de Calidad en Salud) module.

Provides REST API endpoints for:
- HeadquarterLocation management (REPS headquarters)
- EnabledHealthService management (REPS services)
- SOGCS overview and dashboard
- Configuration management
- REPS data import
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HeadquarterLocationViewSet,
    EnabledHealthServiceViewSet,
    SOGCSOverviewViewSet,
    REPSImportViewSet
)

# Create router and register viewsets
router = DefaultRouter()

# Register REPS data management endpoints
router.register(
    'headquarters', 
    HeadquarterLocationViewSet, 
    basename='headquarters'
)

router.register(
    'services', 
    EnabledHealthServiceViewSet, 
    basename='services'
)

# Register overview and dashboard endpoints
router.register(
    'overview', 
    SOGCSOverviewViewSet, 
    basename='overview'
)

# Register import functionality
router.register(
    'import', 
    REPSImportViewSet, 
    basename='import'
)

app_name = 'sogcs'

urlpatterns = [
    # API v1 endpoints
    path('api/v1/', include(router.urls)),
    
    # Additional specific endpoints can be added here if needed
    # path('api/v1/reports/', ReportsView.as_view(), name='reports'),
]

"""
Available API Endpoints:
========================

## Headquarters Management
- GET    /api/v1/headquarters/           - List all headquarters
- POST   /api/v1/headquarters/           - Create new headquarters
- GET    /api/v1/headquarters/{id}/      - Get specific headquarters
- PUT    /api/v1/headquarters/{id}/      - Update headquarters
- DELETE /api/v1/headquarters/{id}/      - Delete headquarters
- GET    /api/v1/headquarters/summary/   - Get headquarters summary stats
- GET    /api/v1/headquarters/dropdown/  - Get simplified list for dropdowns
- GET    /api/v1/headquarters/{id}/services/ - Get services for headquarters
- POST   /api/v1/headquarters/{id}/check_expiration/ - Check expiration alerts

## Health Services Management
- GET    /api/v1/services/               - List all services
- POST   /api/v1/services/               - Create new service
- GET    /api/v1/services/{id}/          - Get specific service
- PUT    /api/v1/services/{id}/          - Update service
- DELETE /api/v1/services/{id}/          - Delete service
- GET    /api/v1/services/summary/       - Get services summary stats
- GET    /api/v1/services/dropdown/      - Get simplified list for dropdowns
- GET    /api/v1/services/by_headquarters/ - Get services grouped by headquarters
- POST   /api/v1/services/{id}/check_utilization/ - Check capacity utilization

## SOGCS Overview & Dashboard
- GET    /api/v1/overview/dashboard/     - Get complete dashboard data
- GET    /api/v1/overview/alerts/        - Get current SOGCS alerts
- GET    /api/v1/overview/configuration/ - Get SOGCS configuration
- PUT    /api/v1/overview/configuration/ - Update SOGCS configuration
- POST   /api/v1/overview/activate/      - Activate SOGCS module

## REPS Import Management
- POST   /api/v1/import/upload/          - Import REPS data from files
- GET    /api/v1/import/status/          - Get import status and history

## Common Query Parameters
- ?page=N                   - Pagination
- ?page_size=N              - Items per page
- ?search=term              - Text search
- ?ordering=field           - Sort results
- ?estado_sede=ACTIVA       - Filter by status
- ?departamento=BOGOTA      - Filter by department
- ?fecha_habilitacion__gte=2024-01-01 - Date filters

## Authentication
All endpoints require authentication via JWT token:
Authorization: Bearer <your-jwt-token>

## Permissions
Endpoints respect organization-level permissions and RBAC policies.
Users can only access data from their assigned organization.
"""