"""
URLs para la API RBAC.
"""
from rest_framework.routers import DefaultRouter
from .views import (
    PermissionViewSet,
    RoleViewSet,
    UserRoleViewSet,
    UserPermissionsViewSet
)

router = DefaultRouter()
router.register(r'permissions', PermissionViewSet, basename='permissions')
router.register(r'roles', RoleViewSet, basename='roles')
router.register(r'user-roles', UserRoleViewSet, basename='user-roles')
router.register(r'user-permissions', UserPermissionsViewSet, basename='user-permissions')

urlpatterns = router.urls