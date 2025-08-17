from django.apps import AppConfig


class SOGCSConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sogcs'
    verbose_name = 'Sistema Obligatorio de Garantía de Calidad en Salud'
    
    def ready(self):
        """
        Import signal handlers when the app is ready
        """
        try:
            import apps.sogcs.signals  # noqa F401
        except ImportError:
            pass