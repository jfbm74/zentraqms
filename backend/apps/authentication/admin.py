"""
Django Admin configuration for ZentraQMS authentication models.

This module configures the Django admin interface for user management
with custom forms, filters, and actions.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.core.exceptions import ValidationError
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import User


class CustomUserCreationForm(UserCreationForm):
    """
    Custom user creation form for Django admin.

    Extends the default UserCreationForm to work with our custom User model
    that uses email as the username field.
    """

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name")

    def clean_email(self):
        """
        Validate and normalize email.

        Returns:
            str: Normalized email

        Raises:
            ValidationError: If email already exists
        """
        email = self.cleaned_data.get("email")
        if email:
            email = email.lower().strip()
            if User.objects.filter(email__iexact=email).exists():
                raise ValidationError(_("Ya existe un usuario con este email."))
        return email


class CustomUserChangeForm(UserChangeForm):
    """
    Custom user change form for Django admin.

    Extends the default UserChangeForm to work with our custom User model.
    """

    class Meta:
        model = User
        fields = "__all__"

    def clean_email(self):
        """
        Validate and normalize email for updates.

        Returns:
            str: Normalized email

        Raises:
            ValidationError: If email already exists for another user
        """
        email = self.cleaned_data.get("email")
        if email:
            email = email.lower().strip()
            # Check if email exists for another user
            existing_user = (
                User.objects.filter(email__iexact=email)
                .exclude(pk=self.instance.pk)
                .first()
            )
            if existing_user:
                raise ValidationError(_("Ya existe otro usuario con este email."))
        return email


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User admin configuration.

    Provides comprehensive user management interface with custom fields,
    filters, search capabilities, and administrative actions.
    """

    # Use custom forms
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User

    # List display configuration
    list_display = [
        "email",
        "full_name",
        "department",
        "position",
        "is_active",
        "is_verified",
        "is_staff",
        "date_joined",
        "last_login",
        "account_status",
    ]

    list_display_links = ["email", "full_name"]

    # List filters
    list_filter = [
        "is_active",
        "is_verified",
        "is_staff",
        "is_superuser",
        "date_joined",
        "last_login",
        "department",
    ]

    # Search fields
    search_fields = [
        "email",
        "first_name",
        "last_name",
        "department",
        "position",
    ]

    # Ordering
    ordering = ["email"]

    # Fields for add form
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
        (
            _("Personal Info"),
            {
                "fields": ("first_name", "last_name", "phone_number"),
            },
        ),
        (
            _("Organizational Info"),
            {
                "fields": ("department", "position"),
            },
        ),
        (
            _("Permissions"),
            {
                "fields": ("is_active", "is_verified"),
            },
        ),
    )

    # Fields for change form
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            _("Personal Info"),
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "phone_number",
                )
            },
        ),
        (
            _("Organizational Info"),
            {
                "fields": (
                    "department",
                    "position",
                )
            },
        ),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_verified",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (
            _("Important dates"),
            {
                "fields": (
                    "last_login",
                    "date_joined",
                    "updated_at",
                )
            },
        ),
        (
            _("Security Info"),
            {
                "fields": (
                    "failed_login_attempts",
                    "locked_until",
                    "last_login_ip",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            _("Audit Info"),
            {
                "fields": ("created_by",),
                "classes": ("collapse",),
            },
        ),
    )

    # Read-only fields
    readonly_fields = [
        "date_joined",
        "updated_at",
        "last_login",
        "last_login_ip",
        "failed_login_attempts",
    ]

    # Custom actions
    actions = [
        "verify_users",
        "unverify_users",
        "unlock_users",
        "activate_users",
        "deactivate_users",
    ]

    def account_status(self, obj):
        """
        Display account status with color coding.

        Args:
            obj (User): User instance

        Returns:
            str: HTML formatted status
        """
        if obj.is_account_locked():
            return format_html(
                '<span style="color: red; font-weight: bold;">' + "🔒 Bloqueado</span>"
            )
        elif not obj.is_active:
            return format_html(
                '<span style="color: orange; font-weight: bold;">' + "⏸️ Inactivo</span>"
            )
        elif not obj.is_verified:
            return format_html(
                '<span style="color: blue; font-weight: bold;">'
                + "📧 No verificado</span>"
            )
        else:
            return format_html(
                '<span style="color: green; font-weight: bold;">' + "✅ Activo</span>"
            )

    account_status.short_description = _("Estado de la cuenta")

    def get_queryset(self, request):
        """
        Optimize queryset for admin list view.

        Args:
            request: HTTP request

        Returns:
            QuerySet: Optimized queryset
        """
        return super().get_queryset(request).select_related("created_by")

    def save_model(self, request, obj, form, change):
        """
        Save model with audit information.

        Args:
            request: HTTP request
            obj (User): User instance
            form: Model form
            change (bool): True if this is a change (not creation)
        """
        if not change:  # If creating new user
            obj.created_by = request.user

        super().save_model(request, obj, form, change)

    # Custom admin actions
    def verify_users(self, request, queryset):
        """
        Mark selected users as verified.

        Args:
            request: HTTP request
            queryset: Selected users queryset
        """
        updated = queryset.update(is_verified=True)
        self.message_user(
            request, _("%(count)d usuarios han sido verificados.") % {"count": updated}
        )

    verify_users.short_description = _("Verificar usuarios seleccionados")

    def unverify_users(self, request, queryset):
        """
        Mark selected users as unverified.

        Args:
            request: HTTP request
            queryset: Selected users queryset
        """
        updated = queryset.update(is_verified=False)
        self.message_user(
            request,
            _("%(count)d usuarios han sido marcados como no " + "verificados.")
            % {"count": updated},
        )

    unverify_users.short_description = _("Marcar como no verificados")

    def unlock_users(self, request, queryset):
        """
        Unlock selected user accounts.

        Args:
            request: HTTP request
            queryset: Selected users queryset
        """
        count = 0
        for user in queryset:
            if user.is_account_locked():
                user.unlock_account()
                count += 1

        self.message_user(
            request, _("%(count)d cuentas han sido desbloqueadas.") % {"count": count}
        )

    unlock_users.short_description = _("Desbloquear cuentas seleccionadas")

    def activate_users(self, request, queryset):
        """
        Activate selected users.

        Args:
            request: HTTP request
            queryset: Selected users queryset
        """
        updated = queryset.update(is_active=True)
        self.message_user(
            request, _("%(count)d usuarios han sido activados.") % {"count": updated}
        )

    activate_users.short_description = _("Activar usuarios seleccionados")

    def deactivate_users(self, request, queryset):
        """
        Deactivate selected users.

        Args:
            request: HTTP request
            queryset: Selected users queryset
        """
        # Don't allow deactivating superusers
        superusers = queryset.filter(is_superuser=True)
        if superusers.exists():
            self.message_user(
                request, _("No se pueden desactivar superusuarios."), level="ERROR"
            )
            return

        updated = queryset.update(is_active=False)
        self.message_user(
            request, _("%(count)d usuarios han sido desactivados.") % {"count": updated}
        )

    deactivate_users.short_description = _("Desactivar usuarios seleccionados")

    def has_delete_permission(self, request, obj=None):
        """
        Control delete permissions.

        Args:
            request: HTTP request
            obj (User): User instance (if checking specific instance)

        Returns:
            bool: True if user can delete
        """
        # Only superusers can delete users
        return request.user.is_superuser

    def get_readonly_fields(self, request, obj=None):
        """
        Customize readonly fields based on user permissions.

        Args:
            request: HTTP request
            obj (User): User instance

        Returns:
            list: List of readonly field names
        """
        readonly_fields = list(self.readonly_fields)

        # If not superuser, make critical fields readonly
        if not request.user.is_superuser:
            readonly_fields.extend(
                [
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ]
            )

        # If editing existing user, make creation audit fields readonly
        if obj:
            readonly_fields.append("created_by")

        return readonly_fields


# Register admin configuration for User model
# (Already registered via decorator, but included for completeness)
