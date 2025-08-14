"""
Authentication views for ZentraQMS.

This module contains API views for JWT authentication, including login,
logout, token refresh, and user profile endpoints.
"""

import logging
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    CustomTokenObtainPairSerializer,
    LoginSerializer,
    LogoutSerializer,
    UserSerializer,
)
from apps.common.utils import (
    create_success_response,
    create_error_response,
    get_client_ip,
)

User = get_user_model()
logger = logging.getLogger("authentication")


class LoginView(APIView):
    """
    Login view that returns JWT tokens.

    This view handles user authentication and returns access and refresh tokens
    along with user information. It also manages failed login attempts and
    account locking.
    """

    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request):
        """
        Authenticate user and return JWT tokens.

        Args:
            request: HTTP request with email and password

        Returns:
            Response: JWT tokens and user data or error message
        """
        try:
            serializer = self.serializer_class(
                data=request.data, context={"request": request}
            )

            if serializer.is_valid():
                validated_data = serializer.validated_data

                # Log successful login
                logger.info(
                    f"Successful login for user: {validated_data['user']['email']} "
                    f"from IP: {get_client_ip(request)}"
                )

                return create_success_response(
                    data={
                        "access": validated_data["access"],
                        "refresh": validated_data["refresh"],
                        "user": validated_data["user"],
                    },
                    message="Login exitoso.",
                )
            else:
                # Log failed login attempt
                email = request.data.get("email", "Unknown")
                logger.warning(
                    f"Failed login attempt for email: {email} "
                    f"from IP: {get_client_ip(request)}"
                )

                return create_error_response(
                    message="Credenciales inválidas.",
                    errors=serializer.errors,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return create_error_response(
                message="Error interno del servidor.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TokenRefreshView(BaseTokenRefreshView):
    """
    Custom token refresh view.

    Extends the default SimpleJWT TokenRefreshView to add custom logging
    and response formatting.
    """

    def post(self, request, *args, **kwargs):
        """
        Refresh JWT access token.

        Args:
            request: HTTP request with refresh token

        Returns:
            Response: New access token (and refresh token if rotation is enabled)
        """
        try:
            response = super().post(request, *args, **kwargs)

            if response.status_code == 200:
                logger.info(f"Token refreshed for IP: {get_client_ip(request)}")

                return create_success_response(
                    data=response.data, message="Token actualizado exitosamente."
                )
            else:
                logger.warning(
                    f"Failed token refresh from IP: {get_client_ip(request)}"
                )
                return response

        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            return create_error_response(
                message="Error al actualizar el token.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )


class LogoutView(APIView):
    """
    Logout view that validates refresh token.

    In Phase 2, this will be extended to blacklist the token.
    For now, it just validates the token and returns a success message.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Logout user by validating refresh token.

        Args:
            request: HTTP request with refresh token

        Returns:
            Response: Success message or error
        """
        try:
            serializer = LogoutSerializer(data=request.data)

            if serializer.is_valid():
                result = serializer.save()

                # Log successful logout
                logger.info(
                    f"User logged out: {request.user.email} "
                    f"from IP: {get_client_ip(request)}"
                )

                return create_success_response(
                    data=result, message="Sesión cerrada exitosamente."
                )
            else:
                return create_error_response(
                    message="Token de actualización inválido.",
                    errors=serializer.errors,
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            logger.error(f"Logout error for user {request.user.email}: {str(e)}")
            return create_error_response(
                message="Error al cerrar sesión.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CurrentUserView(APIView):
    """
    View to get current authenticated user information.

    Returns detailed user information for the authenticated user,
    including roles and permissions (empty for now).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get current authenticated user data.

        Args:
            request: HTTP request with authentication header

        Returns:
            Response: User data including roles and permissions
        """
        try:
            user = request.user
            serializer = UserSerializer(user)

            # Add additional data for frontend
            user_data = serializer.data
            user_data["roles"] = []  # Empty for now, will be populated in RBAC phase
            user_data["permissions"] = (
                []
            )  # Empty for now, will be populated in RBAC phase

            return create_success_response(
                data=user_data, message="Datos del usuario obtenidos exitosamente."
            )

        except Exception as e:
            logger.error(f"Error getting user data for {request.user.email}: {str(e)}")
            return create_error_response(
                message="Error al obtener datos del usuario.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChangePasswordView(APIView):
    """
    View for changing user password.

    This view will be fully implemented in Phase 2.
    For now, it's just a placeholder structure.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Change user password.

        Args:
            request: HTTP request with current and new password

        Returns:
            Response: Success message or validation errors
        """
        # TODO: Implement in Phase 2
        return create_error_response(
            message="Esta funcionalidad estará disponible en la siguiente fase.",
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
        )


# ================================
# Function-based views (alternatives)
# ================================


@api_view(["POST"])
@permission_classes([AllowAny])
def login_function_view(request):
    """
    Function-based login view (alternative implementation).

    This is an alternative to the class-based LoginView.
    It uses the LoginSerializer instead of CustomTokenObtainPairSerializer.
    """
    try:
        serializer = LoginSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            user = serializer.validated_data["user"]

            # Generate tokens
            refresh = RefreshToken.for_user(user)

            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

            # Update IP if available
            ip_address = get_client_ip(request)
            if ip_address:
                user.update_last_login_ip(ip_address)

            response_data = {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            }

            logger.info(
                f"Successful login for user: {user.email} from IP: {ip_address}"
            )

            return create_success_response(data=response_data, message="Login exitoso.")

        else:
            email = request.data.get("email", "Unknown")
            logger.warning(
                f"Failed login attempt for email: {email} from IP: {get_client_ip(request)}"
            )

            return create_error_response(
                message="Credenciales inválidas.",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return create_error_response(
            message="Error interno del servidor.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Function-based user profile view (alternative implementation).

    Returns current user profile information.
    """
    try:
        serializer = UserSerializer(request.user)
        return create_success_response(
            data=serializer.data, message="Perfil obtenido exitosamente."
        )

    except Exception as e:
        logger.error(f"Error getting profile for {request.user.email}: {str(e)}")
        return create_error_response(
            message="Error al obtener el perfil.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# ================================
# Health check and status views
# ================================


@api_view(["GET"])
@permission_classes([AllowAny])
def auth_health_check(request):
    """
    Health check endpoint for authentication service.

    Returns the status of the authentication service.
    """
    return create_success_response(
        data={
            "service": "authentication",
            "status": "healthy",
            "timestamp": timezone.now().isoformat(),
            "version": "1.2.0",
        },
        message="Servicio de autenticación funcionando correctamente.",
    )


# ================================
# RBAC Authentication Views
# ================================


class UserPermissionsView(APIView):
    """
    View for getting current user's permissions.

    GET /api/auth/permissions/ - Returns user's permissions
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get current user's permissions.

        Returns:
            Response: User permissions organized by resource
        """
        try:
            user = request.user

            # Get user permissions using enhanced helper method
            permission_tree = user.get_permission_tree()
            permissions_list = user.get_all_permissions()

            response_data = {
                "user_id": str(user.id),
                "user_email": user.email,
                "permissions_by_resource": permission_tree,
                "permissions_list": list(permissions_list),
                "total_permissions": len(permissions_list),
            }

            return create_success_response(
                data=response_data,
                message="Permisos del usuario obtenidos exitosamente.",
            )

        except Exception as e:
            logger.error(
                f"Error getting user permissions for {request.user.email}: {e}"
            )
            return create_error_response(
                message="Error al obtener permisos del usuario.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserRolesView(APIView):
    """
    View for getting current user's roles.

    GET /api/auth/roles/ - Returns user's roles
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get current user's roles.

        Returns:
            Response: User roles with details
        """
        try:
            user = request.user

            # Get user roles using RBAC system
            from apps.authorization.models import UserRole
            from django.utils import timezone

            user_roles = (
                UserRole.objects.filter(user=user, is_active=True, role__is_active=True)
                .exclude(expires_at__lt=timezone.now())
                .select_related("role")
            )

            roles_data = []
            for user_role in user_roles:
                roles_data.append(
                    {
                        "id": str(user_role.role.id),
                        "code": user_role.role.code,
                        "name": user_role.role.name,
                        "description": user_role.role.description,
                        "is_system": user_role.role.is_system,
                        "assigned_at": user_role.assigned_at,
                        "expires_at": user_role.expires_at,
                        "assigned_by": (
                            user_role.assigned_by.email
                            if user_role.assigned_by
                            else None
                        ),
                    }
                )

            response_data = {
                "user_id": str(user.id),
                "user_email": user.email,
                "roles": roles_data,
                "total_roles": len(roles_data),
                "role_codes": [role["code"] for role in roles_data],
            }

            return create_success_response(
                data=response_data, message="Roles del usuario obtenidos exitosamente."
            )

        except Exception as e:
            logger.error(f"Error getting user roles for {request.user.email}: {e}")
            return create_error_response(
                message="Error al obtener roles del usuario.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
