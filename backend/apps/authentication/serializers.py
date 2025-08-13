"""
Serializers for ZentraQMS authentication system.

This module contains serializers for user authentication, registration,
and profile management functionality.
"""

from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .validators import validate_password_confirmation, validate_colombian_phone
from apps.common.utils import get_client_ip

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Basic user serializer for read operations.

    Used for displaying user information in API responses.
    Excludes sensitive fields like password.
    """

    full_name = serializers.ReadOnlyField()
    short_name = serializers.ReadOnlyField()
    display_name = serializers.ReadOnlyField(source='get_display_name')
    can_login = serializers.ReadOnlyField()
    is_account_locked = serializers.ReadOnlyField()
    has_organizational_info = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'short_name',
            'display_name',
            'is_active',
            'is_verified',
            'is_staff',
            'phone_number',
            'department',
            'position',
            'last_login',
            'date_joined',
            'updated_at',
            'can_login',
            'is_account_locked',
            'has_organizational_info',
        ]
        read_only_fields = [
            'id',
            'last_login',
            'date_joined',
            'updated_at',
            'is_staff',
            'is_verified',
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.

    Used when creating new user accounts, includes password validation
    and confirmation.
    """

    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Password must be at least 8 characters with uppercase, lowercase, number, and special character.'
    )

    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Must match the password field.'
    )

    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="Ya existe un usuario con esta dirección de email."
            )
        ]
    )

    phone_number = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[validate_colombian_phone],
        help_text='Colombian phone number format (e.g., 3001234567 or +573001234567)'
    )

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'phone_number',
            'department',
            'position',
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_email(self, value):
        """
        Validate email field.

        Args:
            value (str): Email value to validate

        Returns:
            str: Normalized email
        """
        # Normalize email to lowercase
        return value.lower().strip()

    def validate_password(self, value):
        """
        Validate password using Django's password validators.

        Args:
            value (str): Password to validate

        Returns:
            str: Validated password

        Raises:
            serializers.ValidationError: If password is invalid
        """
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))

        return value

    def validate(self, attrs):
        """
        Validate the entire serializer data.

        Args:
            attrs (dict): Serializer data

        Returns:
            dict: Validated data

        Raises:
            serializers.ValidationError: If validation fails
        """
        # Validate password confirmation
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')

        try:
            validate_password_confirmation(password, password_confirm)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password_confirm': list(e.messages)})

        # Remove password_confirm from validated data
        attrs.pop('password_confirm', None)

        return attrs

    def create(self, validated_data):
        """
        Create a new user instance.

        Args:
            validated_data (dict): Validated serializer data

        Returns:
            User: Created user instance
        """
        # Extract password
        password = validated_data.pop('password')

        # Create user instance
        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile.

    Used for updating user information, excluding sensitive fields
    that require special handling.
    """

    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="Ya existe un usuario con esta dirección de email."
            )
        ]
    )

    phone_number = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[validate_colombian_phone],
        help_text='Colombian phone number format (e.g., 3001234567 or +573001234567)'
    )

    class Meta:
        model = User
        fields = [
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'department',
            'position',
        ]

    def validate_email(self, value):
        """
        Validate email field for updates.

        Args:
            value (str): Email value to validate

        Returns:
            str: Normalized email
        """
        # Normalize email
        normalized_email = value.lower().strip()

        # Check if email is being changed
        if self.instance and self.instance.email != normalized_email:
            # Ensure new email is unique (case insensitive)
            if User.objects.filter(email__iexact=normalized_email).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError(
                    "Ya existe un usuario con esta dirección de email."
                )

        return normalized_email


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for changing user password.

    Used when a user wants to change their password (requires current password).
    """

    current_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Current password for verification.'
    )

    new_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='New password must be at least 8 characters with uppercase, lowercase, number, and special character.'
    )

    new_password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text='Must match the new password field.'
    )

    def validate_current_password(self, value):
        """
        Validate current password.

        Args:
            value (str): Current password

        Returns:
            str: Validated current password

        Raises:
            serializers.ValidationError: If current password is incorrect
        """
        user = self.context['request'].user

        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")

        return value

    def validate_new_password(self, value):
        """
        Validate new password using Django's password validators.

        Args:
            value (str): New password to validate

        Returns:
            str: Validated new password

        Raises:
            serializers.ValidationError: If password is invalid
        """
        user = self.context['request'].user

        try:
            validate_password(value, user)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))

        return value

    def validate(self, attrs):
        """
        Validate the entire serializer data.

        Args:
            attrs (dict): Serializer data

        Returns:
            dict: Validated data

        Raises:
            serializers.ValidationError: If validation fails
        """
        # Validate new password confirmation
        new_password = attrs.get('new_password')
        new_password_confirm = attrs.get('new_password_confirm')

        try:
            validate_password_confirmation(new_password, new_password_confirm)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'new_password_confirm': list(e.messages)})

        # Check that new password is different from current
        current_password = attrs.get('current_password')
        if new_password == current_password:
            raise serializers.ValidationError({
                'new_password': 'La nueva contraseña debe ser diferente a la actual.'
            })

        return attrs

    def save(self):
        """
        Change the user's password.

        Returns:
            User: Updated user instance
        """
        user = self.context['request'].user
        new_password = self.validated_data['new_password']

        user.set_password(new_password)
        user.save(update_fields=['password'])

        return user


class UserListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for user lists.

    Used for displaying user lists with minimal information.
    """

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'is_active',
            'is_verified',
            'department',
            'position',
        ]


class UserDetailSerializer(UserSerializer):
    """
    Detailed user serializer with additional information.

    Used for displaying complete user profile information.
    """

    created_by_name = serializers.CharField(
        source='created_by.get_display_name',
        read_only=True
    )

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + [
            'created_by',
            'created_by_name',
            'failed_login_attempts',
            'last_login_ip',
        ]
        read_only_fields = UserSerializer.Meta.read_only_fields + [
            'created_by',
            'created_by_name',
            'failed_login_attempts',
            'last_login_ip',
        ]


# ================================
# JWT Authentication Serializers
# ================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that adds user information to the token claims.

    This serializer extends the default TokenObtainPairSerializer to include
    additional user information in the JWT token and validates account status.
    """

    username_field = 'email'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Use email field instead of username
        self.fields[self.username_field] = serializers.EmailField()
        self.fields['password'] = serializers.CharField(write_only=True)

    @classmethod
    def get_token(cls, user):
        """
        Generate token with custom claims.

        Args:
            user: User instance

        Returns:
            RefreshToken: Token with custom claims
        """
        token = super().get_token(user)

        # Add custom claims
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['is_verified'] = user.is_verified
        token['roles'] = []  # Empty for now, will be populated in RBAC phase
        token['permissions'] = []  # Empty for now, will be populated in RBAC phase

        return token

    def validate(self, attrs):
        """
        Validate credentials and account status.

        Args:
            attrs (dict): Serializer data with email and password

        Returns:
            dict: Validated data with tokens

        Raises:
            serializers.ValidationError: If credentials are invalid or account is locked
        """
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError({
                'detail': 'Debe proporcionar email y contraseña.'
            })

        # Normalize email
        email = email.lower().strip()

        # Try to get user
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Don't reveal if email exists or not
            raise serializers.ValidationError({
                'detail': 'Las credenciales proporcionadas no son válidas.'
            })

        # Check if account is locked
        if user.is_account_locked():
            remaining_time = user.locked_until - timezone.now()
            minutes = int(remaining_time.total_seconds() / 60)
            raise serializers.ValidationError({
                'detail': f'Cuenta bloqueada. Intente nuevamente en {minutes} minutos.'
            })

        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError({
                'detail': 'Esta cuenta está desactivada.'
            })

        # Check if user can login
        if not user.can_login():
            raise serializers.ValidationError({
                'detail': 'No se puede acceder a esta cuenta en este momento.'
            })

        # Authenticate user
        if not user.check_password(password):
            # Increment failed attempts
            user.increment_failed_login()
            raise serializers.ValidationError({
                'detail': 'Las credenciales proporcionadas no son válidas.'
            })

        # Authentication successful - reset failed attempts
        user.reset_failed_login_attempts()

        # Update last login IP if request is available
        request = self.context.get('request')
        if request:
            ip_address = get_client_ip(request)
            if ip_address:
                user.update_last_login_ip(ip_address)

        # Generate tokens
        refresh = self.get_token(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.

    This is an alternative to the CustomTokenObtainPairSerializer for cases
    where we want more control over the login process.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        """
        Normalize email address.

        Args:
            value (str): Email address

        Returns:
            str: Normalized email
        """
        return value.lower().strip()

    def validate(self, attrs):
        """
        Validate login credentials.

        Args:
            attrs (dict): Serializer data

        Returns:
            dict: Validated data with user information

        Raises:
            serializers.ValidationError: If credentials are invalid
        """
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError(
                'Debe proporcionar email y contraseña.'
            )

        # Try to authenticate
        user = authenticate(
            request=self.context.get('request'),
            email=email,
            password=password
        )

        if not user:
            raise serializers.ValidationError(
                'Las credenciales proporcionadas no son válidas.'
            )

        if not user.is_active:
            raise serializers.ValidationError(
                'Esta cuenta está desactivada.'
            )

        if user.is_account_locked():
            remaining_time = user.locked_until - timezone.now()
            minutes = int(remaining_time.total_seconds() / 60)
            raise serializers.ValidationError(
                f'Cuenta bloqueada. Intente nuevamente en {minutes} minutos.'
            )

        attrs['user'] = user
        return attrs


class LogoutSerializer(serializers.Serializer):
    """
    Serializer for user logout.

    This serializer validates the refresh token provided during logout.
    In Phase 2, this will be extended to blacklist the token.
    """

    refresh_token = serializers.CharField(required=True)

    def validate_refresh_token(self, value):
        """
        Validate the refresh token.

        Args:
            value (str): Refresh token

        Returns:
            str: Validated refresh token

        Raises:
            serializers.ValidationError: If token is invalid
        """
        try:
            # Try to create RefreshToken object to validate it
            RefreshToken(value)
        except Exception:
            raise serializers.ValidationError('Token de actualización inválido.')

        return value

    def save(self):
        """
        Process logout.

        For now, this just validates the token. In Phase 2, we'll add
        the token to the blacklist.

        Returns:
            dict: Success message
        """
        # TODO: Add token to blacklist in Phase 2
        # token = RefreshToken(self.validated_data['refresh_token'])
        # token.blacklist()

        return {'detail': 'Sesión cerrada exitosamente.'}


class TokenRefreshSerializer(serializers.Serializer):
    """
    Custom token refresh serializer.

    This can be used if we need custom validation during token refresh.
    For now, we use the default SimpleJWT serializer.
    """

    refresh = serializers.CharField()

    def validate(self, attrs):
        """
        Validate refresh token and return new access token.

        Args:
            attrs (dict): Serializer data with refresh token

        Returns:
            dict: New access and refresh tokens
        """
        refresh = RefreshToken(attrs['refresh'])

        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh) if hasattr(refresh, 'set_jti') else attrs['refresh']
        }
