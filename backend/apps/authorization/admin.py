"""
Configuración del panel de administración para el sistema RBAC.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Permission, Role, RolePermission, UserRole


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    """
    Admin para gestión de permisos.
    """
    list_display = ['code', 'name', 'resource', 'action', 'is_active', 'created_at']
    list_filter = ['is_active', 'resource', 'action', 'created_at']
    search_fields = ['code', 'name', 'description', 'resource', 'action']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['resource', 'action']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'code', 'description')
        }),
        ('Detalles del Permiso', {
            'fields': ('resource', 'action', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Hacer el código readonly después de la creación."""
        if obj:  # Editando un objeto existente
            return self.readonly_fields + ['code']
        return self.readonly_fields


class RolePermissionInline(admin.TabularInline):
    """
    Inline para gestionar permisos de un rol.
    """
    model = RolePermission
    extra = 1
    autocomplete_fields = ['permission']
    readonly_fields = ['granted_at', 'granted_by']
    
    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields
        return []
    
    def save_model(self, request, obj, form, change):
        if not change:  # Solo en creación
            obj.granted_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """
    Admin para gestión de roles.
    """
    list_display = ['code', 'name', 'is_system', 'is_active', 'permissions_count', 'users_count', 'created_at']
    list_filter = ['is_system', 'is_active', 'created_at']
    search_fields = ['code', 'name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [RolePermissionInline]
    ordering = ['name']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'code', 'description')
        }),
        ('Configuración', {
            'fields': ('is_system', 'is_active')
        }),
        ('Auditoría', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Hacer ciertos campos readonly según el contexto."""
        readonly = list(self.readonly_fields)
        if obj:  # Editando
            readonly.append('code')
            if obj.is_system:
                readonly.extend(['is_system', 'name'])
        return readonly
    
    def has_delete_permission(self, request, obj=None):
        """No permitir eliminar roles del sistema."""
        if obj and obj.is_system:
            return False
        return super().has_delete_permission(request, obj)
    
    def permissions_count(self, obj):
        """Mostrar cantidad de permisos del rol."""
        count = obj.permissions.filter(is_active=True).count()
        return format_html('<span style="color: green;">{}</span>', count)
    permissions_count.short_description = 'Permisos'
    
    def users_count(self, obj):
        """Mostrar cantidad de usuarios con este rol."""
        count = UserRole.objects.filter(
            role=obj,
            is_active=True,
            user__is_active=True
        ).exclude(
            expires_at__lt=timezone.now()
        ).count()
        url = reverse('admin:authorization_userrole_changelist') + f'?role__id__exact={obj.id}'
        return format_html('<a href="{}">{} usuarios</a>', url, count)
    users_count.short_description = 'Usuarios'


class UserRoleInline(admin.TabularInline):
    """
    Inline para gestionar roles de un usuario.
    """
    model = UserRole
    fk_name = 'user'
    extra = 0
    autocomplete_fields = ['role']
    readonly_fields = ['assigned_at', 'assigned_by']
    fields = ['role', 'is_active', 'expires_at', 'assigned_at', 'assigned_by']
    
    def save_model(self, request, obj, form, change):
        if not change:  # Solo en creación
            obj.assigned_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    """
    Admin para gestión de asignaciones de roles a usuarios.
    """
    list_display = ['user_email', 'role_name', 'is_active', 'status_display', 'assigned_at', 'expires_at', 'assigned_by_email']
    list_filter = ['is_active', 'role', 'assigned_at', 'expires_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'role__name', 'role__code']
    autocomplete_fields = ['user', 'role']
    readonly_fields = ['id', 'assigned_at', 'assigned_by']
    date_hierarchy = 'assigned_at'
    ordering = ['-assigned_at']
    
    fieldsets = (
        ('Asignación', {
            'fields': ('user', 'role')
        }),
        ('Estado', {
            'fields': ('is_active', 'expires_at')
        }),
        ('Auditoría', {
            'fields': ('id', 'assigned_at', 'assigned_by'),
            'classes': ('collapse',)
        })
    )
    
    def user_email(self, obj):
        """Mostrar email del usuario."""
        return obj.user.email
    user_email.short_description = 'Usuario'
    user_email.admin_order_field = 'user__email'
    
    def role_name(self, obj):
        """Mostrar nombre del rol."""
        return obj.role.name
    role_name.short_description = 'Rol'
    role_name.admin_order_field = 'role__name'
    
    def assigned_by_email(self, obj):
        """Mostrar quién asignó el rol."""
        if obj.assigned_by:
            return obj.assigned_by.email
        return '-'
    assigned_by_email.short_description = 'Asignado por'
    
    def status_display(self, obj):
        """Mostrar estado visual del rol."""
        if not obj.is_active:
            return format_html('<span style="color: red;">✗ Inactivo</span>')
        elif obj.is_expired:
            return format_html('<span style="color: orange;">⚠ Expirado</span>')
        else:
            return format_html('<span style="color: green;">✓ Activo</span>')
    status_display.short_description = 'Estado'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Solo en creación
            obj.assigned_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """Optimizar queries."""
        return super().get_queryset(request).select_related('user', 'role', 'assigned_by')


# Extender el UserAdmin existente para incluir roles
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

User = get_user_model()

# Desregistrar el admin existente si está registrado
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

@admin.register(User)
class ExtendedUserAdmin(BaseUserAdmin):
    """
    Extender UserAdmin para incluir gestión de roles.
    """
    inlines = BaseUserAdmin.inlines + (UserRoleInline,)
    
    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if obj:  # Solo mostrar en edición
            fieldsets += (
                ('Sistema de Permisos', {
                    'fields': ('display_roles', 'display_permissions'),
                    'classes': ('collapse',)
                }),
            )
        return fieldsets
    
    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if obj:
            readonly.extend(['display_roles', 'display_permissions'])
        return readonly
    
    def display_roles(self, obj):
        """Mostrar roles del usuario."""
        roles = obj.roles.values_list('role__name', flat=True)
        if roles:
            return format_html('<ul>{}</ul>', ''.join([f'<li>{role}</li>' for role in roles]))
        return 'Sin roles asignados'
    display_roles.short_description = 'Roles Activos'
    
    def display_permissions(self, obj):
        """Mostrar permisos efectivos del usuario."""
        if obj.is_superuser:
            return format_html('<span style="color: red;">✓ Superusuario (todos los permisos)</span>')
        
        permissions = obj.get_all_permissions()
        if permissions:
            # Mostrar solo los primeros 10 para no saturar la interfaz
            perm_list = list(permissions)[:10]
            html = '<ul>{}</ul>'.format(''.join([f'<li><code>{perm}</code></li>' for perm in perm_list]))
            if len(permissions) > 10:
                html += f'<p>... y {len(permissions) - 10} permisos más</p>'
            return format_html(html)
        return 'Sin permisos'
    display_permissions.short_description = 'Permisos Efectivos'
