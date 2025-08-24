"""
URLs para el sistema de templates organizacionales
ZentraQMS - Sistema de Gestión de Calidad
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from ..views.organizational_template_views import (
    ServicioHabilitadoViewSet,
    TipoComiteViewSet,
    TipoCargoViewSet,
    AreaFuncionalViewSet,
    AreaFuncionalCargoViewSet,
    ValidacionSOGCSViewSet,
    TemplateOrganizacionalViewSet,
    AplicacionTemplateViewSet,
    HistorialCambiosTemplateViewSet,
)

# Router para endpoints RESTful
router = DefaultRouter()

# Registrar ViewSets para datos maestros
router.register(
    r'servicios-habilitados', 
    ServicioHabilitadoViewSet, 
    basename='servicios-habilitados'
)
router.register(
    r'tipos-comite', 
    TipoComiteViewSet, 
    basename='tipos-comite'
)
router.register(
    r'tipos-cargo', 
    TipoCargoViewSet, 
    basename='tipos-cargo'
)
router.register(
    r'areas-funcionales', 
    AreaFuncionalViewSet, 
    basename='areas-funcionales'
)
router.register(
    r'area-funcional-cargos', 
    AreaFuncionalCargoViewSet, 
    basename='area-funcional-cargos'
)
router.register(
    r'validaciones-sogcs', 
    ValidacionSOGCSViewSet, 
    basename='validaciones-sogcs'
)

# Registrar ViewSets para templates
router.register(
    r'templates', 
    TemplateOrganizacionalViewSet, 
    basename='templates'
)
router.register(
    r'aplicaciones-template', 
    AplicacionTemplateViewSet, 
    basename='aplicaciones-template'
)
router.register(
    r'historial-cambios', 
    HistorialCambiosTemplateViewSet, 
    basename='historial-cambios'
)

# URLs principales
urlpatterns = [
    # Incluir URLs del router
    path('', include(router.urls)),
]

# URLs con nombres para referencia
app_name = 'organizational_templates'