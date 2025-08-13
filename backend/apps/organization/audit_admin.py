"""
Django Admin configuration for AuditLog model.
"""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Admin interface for AuditLog model.
    """
    
    list_display = [
        'created_at',
        'action',
        'table_name',
        'record_id_short',
        'user_display',
        'changed_fields_display',
        'ip_address',
    ]
    
    list_filter = [
        'action',
        'table_name',
        'created_at',
        'created_by',
    ]
    
    search_fields = [
        'table_name',
        'record_id',
        'changed_fields',
        'reason',
        'ip_address',
    ]
    
    readonly_fields = [
        'id',
        'table_name',
        'record_id',
        'action',
        'old_values',
        'new_values',
        'changed_fields',
        'ip_address',
        'user_agent',
        'session_key',
        'reason',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
    ]
    
    fieldsets = (
        (_('Información del Cambio'), {
            'fields': (
                'action',
                'table_name',
                'record_id',
                'created_at',
                'created_by',
            )
        }),
        (_('Detalles del Cambio'), {
            'fields': (
                'changed_fields',
                'old_values',
                'new_values',
                'reason',
            )
        }),
        (_('Contexto de la Sesión'), {
            'fields': (
                'ip_address',
                'user_agent',
                'session_key',
            ),
            'classes': ('collapse',)
        }),
        (_('Auditoría'), {
            'fields': (
                'id',
                'updated_at',
                'updated_by',
            ),
            'classes': ('collapse',)
        }),
    )
    
    # Disable add/change/delete permissions for audit logs
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
    
    def record_id_short(self, obj):
        """Display short version of record ID."""
        if obj.record_id:
            return obj.record_id[:8] + '...'
        return ''
    record_id_short.short_description = _('Record ID')
    
    def user_display(self, obj):
        """Display user information."""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return _('Sistema')
    user_display.short_description = _('Usuario')
    
    def changed_fields_display(self, obj):
        """Display changed fields as a comma-separated list."""
        if obj.changed_fields:
            return ', '.join(obj.changed_fields)
        return ''
    changed_fields_display.short_description = _('Campos Modificados')