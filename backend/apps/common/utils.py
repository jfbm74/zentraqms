"""
Common utilities for ZentraQMS.

This module contains utility functions and classes that are used
across multiple apps in the system.
"""

import logging
import secrets
import string
from typing import Optional, Dict, Any

from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework.
    
    This handler provides consistent error responses across the API
    and logs exceptions for debugging purposes.
    
    Args:
        exc: The exception instance
        context: The context in which the exception occurred
        
    Returns:
        Response: Formatted error response
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Log the exception
        logger.error(
            f"API Exception: {exc.__class__.__name__}: {str(exc)}",
            exc_info=True,
            extra={
                'request': context.get('request'),
                'view': context.get('view'),
            }
        )
        
        # Customize the response format
        custom_response_data = {
            'success': False,
            'error': {
                'type': exc.__class__.__name__,
                'message': _('Ha ocurrido un error en el servidor.'),
                'details': response.data,
                'timestamp': timezone.now().isoformat(),
            }
        }
        
        # Handle specific exception types
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            custom_response_data['error']['message'] = _('Los datos enviados no son válidos.')
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            custom_response_data['error']['message'] = _('No tienes autorización para acceder a este recurso.')
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            custom_response_data['error']['message'] = _('No tienes permisos para realizar esta acción.')
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            custom_response_data['error']['message'] = _('El recurso solicitado no existe.')
        elif response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            custom_response_data['error']['message'] = _('Método no permitido para este endpoint.')
        elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            custom_response_data['error']['message'] = _('Has excedido el límite de peticiones. Intenta más tarde.')
        elif response.status_code >= 500:
            custom_response_data['error']['message'] = _('Error interno del servidor.')
        
        response.data = custom_response_data
    
    return response


def normalize_email(email: str) -> str:
    """
    Normalize email address to lowercase.
    
    Args:
        email (str): Email address to normalize
        
    Returns:
        str: Normalized email address
    """
    if not email:
        return email
    
    return email.strip().lower()


def generate_secure_token(length: int = 32) -> str:
    """
    Generate a cryptographically secure random token.
    
    Args:
        length (int): Length of the token (default: 32)
        
    Returns:
        str: Secure random token
    """
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_verification_code(length: int = 6) -> str:
    """
    Generate a numeric verification code.
    
    Args:
        length (int): Length of the code (default: 6)
        
    Returns:
        str: Numeric verification code
    """
    return ''.join(secrets.choice(string.digits) for _ in range(length))


def get_client_ip(request) -> Optional[str]:
    """
    Get the client IP address from the request.
    
    Args:
        request: Django request object
        
    Returns:
        Optional[str]: Client IP address or None if not found
    """
    # Check for IP in forwarded headers (for proxy/load balancer setups)
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Take the first IP if there are multiple
        ip = x_forwarded_for.split(',')[0].strip()
        return ip
    
    # Check for real IP header
    x_real_ip = request.META.get('HTTP_X_REAL_IP')
    if x_real_ip:
        return x_real_ip.strip()
    
    # Fall back to REMOTE_ADDR
    return request.META.get('REMOTE_ADDR')


def send_notification_email(
    subject: str,
    message: str,
    recipient_list: list,
    from_email: Optional[str] = None,
    html_message: Optional[str] = None
) -> bool:
    """
    Send notification email to users.
    
    Args:
        subject (str): Email subject
        message (str): Email message (plain text)
        recipient_list (list): List of recipient email addresses
        from_email (Optional[str]): Sender email (uses default if None)
        html_message (Optional[str]): HTML version of the message
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email or settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Email sent successfully to {len(recipient_list)} recipients")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False


def create_success_response(
    data: Any = None,
    message: str = None,
    status_code: int = status.HTTP_200_OK
) -> Response:
    """
    Create a standardized success response.
    
    Args:
        data: Response data
        message (str): Success message
        status_code (int): HTTP status code
        
    Returns:
        Response: Standardized success response
    """
    response_data = {
        'success': True,
        'message': message or _('Operación completada exitosamente.'),
        'data': data,
        'timestamp': timezone.now().isoformat(),
    }
    
    return Response(response_data, status=status_code)


def create_error_response(
    message: str,
    errors: Optional[Dict] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> Response:
    """
    Create a standardized error response.
    
    Args:
        message (str): Error message
        errors (Optional[Dict]): Detailed error information
        status_code (int): HTTP status code
        
    Returns:
        Response: Standardized error response
    """
    response_data = {
        'success': False,
        'error': {
            'message': message,
            'details': errors or {},
            'timestamp': timezone.now().isoformat(),
        }
    }
    
    return Response(response_data, status=status_code)


def validate_file_size(file, max_size_mb: int = 5):
    """
    Validate uploaded file size.
    
    Args:
        file: Uploaded file object
        max_size_mb (int): Maximum allowed size in MB
        
    Raises:
        ValidationError: If file is too large
    """
    if file.size > max_size_mb * 1024 * 1024:
        raise ValidationError(
            _('El archivo es demasiado grande. El tamaño máximo permitido es %(size)sMB.') % {
                'size': max_size_mb
            }
        )


def validate_file_extension(file, allowed_extensions: list):
    """
    Validate uploaded file extension.
    
    Args:
        file: Uploaded file object
        allowed_extensions (list): List of allowed file extensions
        
    Raises:
        ValidationError: If file extension is not allowed
    """
    import os
    
    ext = os.path.splitext(file.name)[1].lower()
    
    if ext not in allowed_extensions:
        raise ValidationError(
            _('Tipo de archivo no permitido. Los tipos permitidos son: %(extensions)s') % {
                'extensions': ', '.join(allowed_extensions)
            }
        )


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human-readable format.
    
    Args:
        size_bytes (int): File size in bytes
        
    Returns:
        str: Formatted file size (e.g., "1.5 MB")
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    
    return f"{s} {size_names[i]}"


def slugify_spanish(text: str) -> str:
    """
    Create a URL-friendly slug from Spanish text.
    
    Args:
        text (str): Text to slugify
        
    Returns:
        str: URL-friendly slug
    """
    import unicodedata
    import re
    
    # Normalize unicode characters
    text = unicodedata.normalize('NFKD', text)
    
    # Remove accents
    text = ''.join([c for c in text if not unicodedata.combining(c)])
    
    # Convert to lowercase and replace spaces with hyphens
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    text = re.sub(r'[-\s]+', '-', text)
    
    return text


class APIResponseMixin:
    """
    Mixin to provide standardized API responses for views.
    """
    
    def success_response(self, data=None, message=None, status_code=status.HTTP_200_OK):
        """Create a success response."""
        return create_success_response(data, message, status_code)
    
    def error_response(self, message, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        """Create an error response."""
        return create_error_response(message, errors, status_code)