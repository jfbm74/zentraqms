"""
URL configuration for ZentraQMS authentication app.

This module defines the URL patterns for JWT authentication endpoints
including login, logout, token refresh, and user profile operations.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

from .views import (
    LoginView,
    TokenRefreshView,
    LogoutView,
    CurrentUserView,
    ChangePasswordView,
    login_function_view,
    user_profile_view,
    auth_health_check,
    UserPermissionsView,
    UserRolesView,
)

app_name = 'authentication'

urlpatterns = [
    # Main authentication endpoints
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('user/', CurrentUserView.as_view(), name='current_user'),

    # Token verification (useful for debugging)
    path('verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Password management (Phase 2)
    path('password/change/', ChangePasswordView.as_view(), name='change_password'),

    # Alternative function-based endpoints (for comparison/testing)
    path('alt/login/', login_function_view, name='alt_login'),
    path('alt/profile/', user_profile_view, name='alt_profile'),

    # Health check
    path('health/', auth_health_check, name='auth_health'),
    
    # RBAC endpoints
    path('permissions/', UserPermissionsView.as_view(), name='user_permissions'),
    path('roles/', UserRolesView.as_view(), name='user_roles'),

    # Future endpoints (to be implemented in subsequent phases)
    # path('register/', RegisterView.as_view(), name='register'),
    # path('password/reset/', PasswordResetView.as_view(), name='password_reset'),
    # path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    # path('email/verify/', EmailVerifyView.as_view(), name='email_verify'),
    # path('email/resend/', ResendVerificationView.as_view(), name='resend_verification'),
]
