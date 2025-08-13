"""
Custom exceptions for ZentraQMS authentication system.

This module defines custom exception classes for authentication-related
errors and provides a centralized exception handler for consistent
error responses.
"""

import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from apps.common.utils import get_client_ip
from .utils import log_security_event

logger = logging.getLogger('authentication')


# ================================
# Custom Exception Classes
# ================================

class AuthenticationException(Exception):
    """Base exception class for authentication errors."""
    
    def __init__(self, message: str, error_code: str = None, details: dict = None):
        self.message = message
        self.error_code = error_code or 'AUTH_ERROR'
        self.details = details or {}
        super().__init__(self.message)


class AccountLockedException(AuthenticationException):
    """Exception raised when trying to access a locked account."""
    
    def __init__(self, message: str = None, locked_until: timezone.datetime = None):
        self.locked_until = locked_until
        default_message = "Cuenta bloqueada por múltiples intentos fallidos."
        super().__init__(
            message=message or default_message,
            error_code='ACCOUNT_LOCKED',
            details={'locked_until': locked_until.isoformat() if locked_until else None}
        )


class AccountInactiveException(AuthenticationException):
    """Exception raised when trying to access an inactive account."""
    
    def __init__(self, message: str = None):
        default_message = "Cuenta desactivada. Contacte al administrador."
        super().__init__(
            message=message or default_message,
            error_code='ACCOUNT_INACTIVE'
        )


class InvalidCredentialsException(AuthenticationException):
    """Exception raised for invalid login credentials."""
    
    def __init__(self, message: str = None, attempts_remaining: int = None):
        default_message = "Credenciales inválidas."
        super().__init__(
            message=message or default_message,
            error_code='INVALID_CREDENTIALS',
            details={'attempts_remaining': attempts_remaining}
        )


class TokenExpiredException(AuthenticationException):
    """Exception raised when a token has expired."""
    
    def __init__(self, message: str = None, token_type: str = 'access'):
        default_message = f"Token {token_type} expirado."
        super().__init__(
            message=message or default_message,
            error_code='TOKEN_EXPIRED',
            details={'token_type': token_type}
        )


class TokenInvalidException(AuthenticationException):
    """Exception raised when a token is invalid or malformed."""
    
    def __init__(self, message: str = None, token_type: str = 'access'):
        default_message = f"Token {token_type} inválido."
        super().__init__(
            message=message or default_message,
            error_code='TOKEN_INVALID',
            details={'token_type': token_type}
        )


class RateLimitExceededException(AuthenticationException):
    """Exception raised when rate limit is exceeded."""
    
    def __init__(self, message: str = None, retry_after: int = None):
        default_message = "Demasiadas peticiones. Intente más tarde."
        super().__init__(
            message=message or default_message,
            error_code='RATE_LIMITED',
            details={'retry_after': retry_after}
        )


class SuspiciousActivityException(AuthenticationException):
    """Exception raised when suspicious activity is detected."""
    
    def __init__(self, message: str = None, activity_type: str = None):
        default_message = "Actividad sospechosa detectada."
        super().__init__(
            message=message or default_message,
            error_code='SUSPICIOUS_ACTIVITY',
            details={'activity_type': activity_type}
        )


class PermissionDeniedException(AuthenticationException):
    """Exception raised when user lacks required permissions."""
    
    def __init__(self, message: str = None, required_permission: str = None):
        default_message = "Permisos insuficientes para esta acción."
        super().__init__(
            message=message or default_message,
            error_code='PERMISSION_DENIED',
            details={'required_permission': required_permission}
        )


# ================================
# Exception Handler Functions
# ================================

def custom_exception_handler(exc, context):
    """
    Custom exception handler for authentication-related errors.
    
    This handler provides consistent error responses and logging
    for all authentication exceptions.
    
    Args:
        exc: The exception instance
        context: Context dictionary containing request and view information
        
    Returns:
        Response: Formatted error response
    """
    # Get the standard response first
    response = exception_handler(exc, context)
    
    # Get request object for logging
    request = context.get('request')
    ip_address = get_client_ip(request) if request else 'unknown'
    user_email = getattr(request.user, 'email', 'anonymous') if request and hasattr(request, 'user') else 'anonymous'
    
    # Handle custom authentication exceptions
    if isinstance(exc, AuthenticationException):
        # Log the security event
        log_security_event(
            event_type='auth_exception',
            user_email=user_email,
            ip_address=ip_address,
            details={
                'exception_type': exc.__class__.__name__,
                'error_code': exc.error_code,
                'message': exc.message,
                'path': request.path if request else 'unknown',
                'method': request.method if request else 'unknown'
            }
        )
        
        # Determine HTTP status code based on exception type
        if isinstance(exc, AccountLockedException):
            status_code = status.HTTP_423_LOCKED
        elif isinstance(exc, (TokenExpiredException, TokenInvalidException)):
            status_code = status.HTTP_401_UNAUTHORIZED
        elif isinstance(exc, PermissionDeniedException):
            status_code = status.HTTP_403_FORBIDDEN
        elif isinstance(exc, RateLimitExceededException):
            status_code = status.HTTP_429_TOO_MANY_REQUESTS
        else:
            status_code = status.HTTP_400_BAD_REQUEST
        
        # Create custom response
        response = Response(
            data={
                'success': False,
                'error': {
                    'message': exc.message,
                    'code': exc.error_code,
                    'details': exc.details,
                    'timestamp': timezone.now().isoformat()
                }
            },
            status=status_code
        )
    
    # Handle JWT-specific exceptions
    elif isinstance(exc, (TokenError, InvalidToken)):
        log_security_event(
            event_type='jwt_token_error',
            user_email=user_email,
            ip_address=ip_address,
            details={
                'exception_type': exc.__class__.__name__,
                'error_message': str(exc),
                'path': request.path if request else 'unknown'
            }
        )
        
        response = Response(
            data={
                'success': False,
                'error': {
                    'message': 'Token de autenticación inválido o expirado.',
                    'code': 'TOKEN_ERROR',
                    'details': {'detail': str(exc)},
                    'timestamp': timezone.now().isoformat()
                }
            },
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Handle other authentication-related exceptions
    elif response is not None:
        # Log general authentication errors
        if response.status_code in [401, 403]:
            log_security_event(
                event_type='auth_error',
                user_email=user_email,
                ip_address=ip_address,
                details={
                    'status_code': response.status_code,
                    'exception_type': exc.__class__.__name__,
                    'path': request.path if request else 'unknown',
                    'original_data': response.data
                }
            )
        
        # Ensure consistent response format
        if not isinstance(response.data, dict) or 'success' not in response.data:
            response.data = {
                'success': False,
                'error': {
                    'message': 'Error de autenticación.',
                    'code': 'AUTH_ERROR',
                    'details': response.data,
                    'timestamp': timezone.now().isoformat()
                }
            }
    
    return response


def handle_authentication_error(error_type: str, request=None, user=None, **kwargs):
    """
    Helper function to handle and log authentication errors consistently.
    
    Args:
        error_type (str): Type of authentication error
        request: Django request object (optional)
        user: User instance (optional)
        **kwargs: Additional error details
        
    Returns:
        dict: Formatted error response data
    """
    ip_address = get_client_ip(request) if request else 'unknown'
    user_email = getattr(user, 'email', 'anonymous') if user else 'anonymous'
    
    # Define error messages and codes
    error_mappings = {
        'invalid_credentials': {
            'message': 'Credenciales inválidas.',
            'code': 'INVALID_CREDENTIALS'
        },
        'account_locked': {
            'message': 'Cuenta bloqueada por múltiples intentos fallidos.',
            'code': 'ACCOUNT_LOCKED'
        },
        'account_inactive': {
            'message': 'Cuenta desactivada. Contacte al administrador.',
            'code': 'ACCOUNT_INACTIVE'
        },
        'token_expired': {
            'message': 'Token de autenticación expirado.',
            'code': 'TOKEN_EXPIRED'
        },
        'token_invalid': {
            'message': 'Token de autenticación inválido.',
            'code': 'TOKEN_INVALID'
        },
        'rate_limited': {
            'message': 'Demasiadas peticiones. Intente más tarde.',
            'code': 'RATE_LIMITED'
        }
    }
    
    error_info = error_mappings.get(error_type, {
        'message': 'Error de autenticación.',
        'code': 'AUTH_ERROR'
    })
    
    # Log the error
    log_security_event(
        event_type=f'auth_{error_type}',
        user_email=user_email,
        ip_address=ip_address,
        details={
            'error_type': error_type,
            'path': request.path if request else 'unknown',
            'method': request.method if request else 'unknown',
            **kwargs
        }
    )
    
    return {
        'success': False,
        'error': {
            'message': error_info['message'],
            'code': error_info['code'],
            'details': kwargs,
            'timestamp': timezone.now().isoformat()
        }
    }


# ================================
# Decorator for Exception Handling
# ================================

def handle_auth_exceptions(view_func):
    """
    Decorator to handle authentication exceptions in view functions.
    
    Args:
        view_func: The view function to wrap
        
    Returns:
        Wrapped view function with exception handling
    """
    def wrapper(*args, **kwargs):
        try:
            return view_func(*args, **kwargs)
        except AuthenticationException as e:
            request = args[0] if args else None
            ip_address = get_client_ip(request) if request else 'unknown'
            user_email = getattr(request.user, 'email', 'anonymous') if hasattr(request, 'user') else 'anonymous'
            
            log_security_event(
                event_type='view_auth_exception',
                user_email=user_email,
                ip_address=ip_address,
                details={
                    'view_function': view_func.__name__,
                    'exception_type': e.__class__.__name__,
                    'error_code': e.error_code,
                    'message': e.message
                }
            )
            
            return Response(
                data={
                    'success': False,
                    'error': {
                        'message': e.message,
                        'code': e.error_code,
                        'details': e.details,
                        'timestamp': timezone.now().isoformat()
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in {view_func.__name__}: {str(e)}")
            return Response(
                data={
                    'success': False,
                    'error': {
                        'message': 'Error interno del servidor.',
                        'code': 'INTERNAL_ERROR',
                        'details': {},
                        'timestamp': timezone.now().isoformat()
                    }
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return wrapper


# ================================
# Validation Helper Functions
# ================================

def validate_and_raise(condition: bool, exception_class: AuthenticationException, *args, **kwargs):
    """
    Helper function to validate a condition and raise an exception if it fails.
    
    Args:
        condition (bool): Condition to validate
        exception_class: Exception class to raise if condition is False
        *args, **kwargs: Arguments to pass to the exception constructor
    """
    if not condition:
        raise exception_class(*args, **kwargs)


def safe_get_user_email(user) -> str:
    """
    Safely get user email for logging purposes.
    
    Args:
        user: User object or None
        
    Returns:
        str: User email or 'anonymous'
    """
    if hasattr(user, 'email'):
        return user.email
    elif hasattr(user, 'username'):
        return user.username
    else:
        return 'anonymous'