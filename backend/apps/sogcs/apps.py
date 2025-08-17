"""
SOGCS App Configuration
Sistema Obligatorio de Garantía de Calidad en Salud
"""

from django.apps import AppConfig


class SOGCSConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sogcs'
    verbose_name = 'SOGCS - Sistema Obligatorio de Garantía de Calidad en Salud'
    
    def ready(self):
        """
        Método llamado cuando la aplicación está lista.
        Aquí se pueden configurar señales y tareas de inicialización.
        """
        # Importar señales si las hay
        # import apps.sogcs.signals
        pass