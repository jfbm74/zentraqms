"""
Serializers para el sistema RBAC.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Permission, Role, RolePermission, UserRole

User = get_user_model()


class PermissionSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Permission.
    """
    
    class Meta:
        model = Permission
        fields = [
            'id', 'name', 'code', 'description', 
            'resource', 'action', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'code': {'validators': []},  # Manejamos validación en el modelo
        }

    def validate_code(self, value):
        """Validar formato del código del permiso."""
        if '.' not in value and value != '*.all':
            raise serializers.ValidationError(
                'El código debe seguir el formato recurso.accion o ser *.all'
            )
        
        # Verificar unicidad en creación
        if self.instance is None:
            if Permission.objects.filter(code=value).exists():
                raise serializers.ValidationError(
                    'Ya existe un permiso con este código'
                )
        
        return value


class PermissionListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados de permisos.
    """
    
    class Meta:
        model = Permission
        fields = ['id', 'name', 'code', 'resource', 'action', 'is_active']


class RolePermissionSerializer(serializers.ModelSerializer):
    """
    Serializer para la relación Role-Permission.
    """
    permission = PermissionListSerializer(read_only=True)
    permission_id = serializers.UUIDField(write_only=True)
    granted_by_email = serializers.EmailField(source='granted_by.email', read_only=True)
    
    class Meta:
        model = RolePermission
        fields = [
            'id', 'permission', 'permission_id',
            'granted_at', 'granted_by', 'granted_by_email'
        ]
        read_only_fields = ['id', 'granted_at', 'granted_by']


class RoleSerializer(serializers.ModelSerializer):
    """
    Serializer completo para el modelo Role.
    """
    permissions = PermissionListSerializer(many=True, read_only=True)
    permission_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    total_permissions = serializers.SerializerMethodField()
    active_users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'code', 'description',
            'is_system', 'is_active', 'permissions',
            'permission_ids', 'total_permissions',
            'active_users_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_system', 'created_at', 'updated_at']
        extra_kwargs = {
            'code': {'validators': []},
        }

    def get_total_permissions(self, obj):
        """Obtener cantidad total de permisos del rol."""
        return obj.permissions.filter(is_active=True).count()

    def get_active_users_count(self, obj):
        """Obtener cantidad de usuarios activos con este rol."""
        return UserRole.objects.filter(
            role=obj,
            is_active=True,
            user__is_active=True
        ).exclude(
            expires_at__lt=timezone.now()
        ).count()

    def validate_code(self, value):
        """Validar unicidad del código del rol."""
        if self.instance is None:
            if Role.objects.filter(code=value).exists():
                raise serializers.ValidationError(
                    'Ya existe un rol con este código'
                )
        return value

    def create(self, validated_data):
        """Crear rol con permisos."""
        permission_ids = validated_data.pop('permission_ids', [])
        role = Role.objects.create(**validated_data)
        
        # Asignar permisos si se proporcionaron
        if permission_ids:
            user = self.context['request'].user if 'request' in self.context else None
            for perm_id in permission_ids:
                try:
                    permission = Permission.objects.get(id=perm_id, is_active=True)
                    RolePermission.objects.create(
                        role=role,
                        permission=permission,
                        granted_by=user
                    )
                except Permission.DoesNotExist:
                    continue
        
        return role

    def update(self, instance, validated_data):
        """Actualizar rol y sus permisos."""
        permission_ids = validated_data.pop('permission_ids', None)
        
        # Actualizar campos del rol
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar permisos si se proporcionaron
        if permission_ids is not None:
            user = self.context['request'].user if 'request' in self.context else None
            
            # Eliminar permisos existentes
            instance.role_permissions.all().delete()
            
            # Agregar nuevos permisos
            for perm_id in permission_ids:
                try:
                    permission = Permission.objects.get(id=perm_id, is_active=True)
                    RolePermission.objects.create(
                        role=instance,
                        permission=permission,
                        granted_by=user
                    )
                except Permission.DoesNotExist:
                    continue
        
        return instance


class RoleListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados de roles.
    """
    total_permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'code', 'is_system',
            'is_active', 'total_permissions'
        ]

    def get_total_permissions(self, obj):
        return obj.permissions.filter(is_active=True).count()


class UserRoleSerializer(serializers.ModelSerializer):
    """
    Serializer para asignación de roles a usuarios.
    """
    role = RoleListSerializer(read_only=True)
    role_id = serializers.UUIDField(write_only=True)
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        required=False
    )
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    assigned_by_email = serializers.EmailField(
        source='assigned_by.email',
        read_only=True
    )
    is_expired = serializers.BooleanField(read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = UserRole
        fields = [
            'id', 'user', 'user_email', 'user_name',
            'role', 'role_id', 'assigned_at', 'assigned_by',
            'assigned_by_email', 'is_active', 'expires_at',
            'is_expired', 'is_valid'
        ]
        read_only_fields = ['id', 'assigned_at', 'assigned_by']

    def get_user_name(self, obj):
        """Obtener nombre completo del usuario."""
        return f"{obj.user.first_name} {obj.user.last_name}".strip()

    def validate(self, data):
        """Validaciones personalizadas."""
        # Validar que el rol exista y esté activo
        role_id = data.get('role_id')
        if role_id:
            try:
                role = Role.objects.get(id=role_id)
                if not role.is_active:
                    raise serializers.ValidationError({
                        'role_id': 'El rol seleccionado no está activo'
                    })
                data['role'] = role
            except Role.DoesNotExist:
                raise serializers.ValidationError({
                    'role_id': 'El rol no existe'
                })
        
        # Validar fecha de expiración
        expires_at = data.get('expires_at')
        if expires_at and expires_at <= timezone.now():
            raise serializers.ValidationError({
                'expires_at': 'La fecha de expiración debe ser futura'
            })
        
        # Validar que no se duplique la asignación
        if self.instance is None:  # Solo en creación
            user = data.get('user')
            role = data.get('role')
            if user and role:
                if UserRole.objects.filter(user=user, role=role).exists():
                    raise serializers.ValidationError(
                        'El usuario ya tiene asignado este rol'
                    )
        
        return data

    def create(self, validated_data):
        """Crear asignación de rol."""
        validated_data.pop('role_id', None)
        
        # Asignar el usuario que hace la asignación
        if 'request' in self.context:
            validated_data['assigned_by'] = self.context['request'].user
        
        return super().create(validated_data)


class UserPermissionsSerializer(serializers.Serializer):
    """
    Serializer para mostrar todos los permisos de un usuario.
    """
    user_id = serializers.UUIDField()
    user_email = serializers.EmailField()
    roles = RoleListSerializer(many=True)
    permissions = serializers.ListField(child=serializers.CharField())
    effective_permissions = serializers.ListField(child=serializers.CharField())
    
    class Meta:
        fields = [
            'user_id', 'user_email', 'roles',
            'permissions', 'effective_permissions'
        ]