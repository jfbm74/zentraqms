"""
URL configuration for ZentraQMS project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.utils import timezone


def health_check(request):
    """
    Simple health check endpoint.

    Returns:
        JsonResponse: Health status
    """
    return JsonResponse({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0',
        'environment': getattr(settings, 'DJANGO_ENVIRONMENT', 'unknown'),
    })


urlpatterns = [
    # Admin
    path(getattr(settings, 'ADMIN_URL', 'admin/'), admin.site.urls),

    # Health check
    path(getattr(settings, 'HEALTH_CHECK_PATH', 'health/'), health_check, name='health_check'),

    # API endpoints
    path('api/auth/', include('apps.authentication.urls')),
    path('api/authorization/', include('apps.authorization.urls')),
    path('api/v1/', include('apps.organization.urls')),

    # SOGCS module
    path('api/sogcs/', include('apps.sogcs.urls')),

    # Future API endpoints
    # path('api/v1/procesos/', include('procesos.urls')),
    # path('api/v1/auditorias/', include('auditorias.urls')),
    # path('api/v1/normograma/', include('normograma.urls')),
    # path('api/v1/indicadores/', include('indicadores.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    # Add debug toolbar if installed
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
