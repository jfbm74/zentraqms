from django.apps import AppConfig


class OrganizationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.organization"
    verbose_name = "Organization Management"

    def ready(self):
        """Import signals and admin when the app is ready."""
        import apps.organization.signals
        import apps.organization.audit_admin
