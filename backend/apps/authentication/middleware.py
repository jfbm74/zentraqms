"""
Custom middleware for ZentraQMS authentication system.

This module contains middleware classes for security, JWT authentication,
and request logging.
"""

import logging
import time
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from apps.common.utils import get_client_ip
from .utils import log_security_event, is_suspicious_ip

User = get_user_model()
logger = logging.getLogger('authentication')


class SecurityHeadersMiddleware:
    """
    Middleware to add security headers to all responses.

    This middleware adds various security headers to help protect
    against common web vulnerabilities.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Add HSTS header for HTTPS (only in production)
        if request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        # Content Security Policy (basic)
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'"
        )

        return response


class JWTAuthenticationMiddleware:
    """
    Custom JWT authentication middleware.

    This middleware handles JWT token validation and user authentication
    for API requests. It also logs authentication events.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()

    def __call__(self, request):
        # Skip authentication for certain paths
        skip_paths = [
            '/admin/',
            '/health/',
            '/api/auth/login/',
            '/api/auth/refresh/',
            '/api/auth/health/',
        ]

        if any(request.path.startswith(path) for path in skip_paths):
            return self.get_response(request)

        # Try to authenticate with JWT
        try:
            auth_result = self.jwt_auth.authenticate(request)
            if auth_result:
                user, token = auth_result
                request.user = user
                request.auth = token

                # Log successful authentication
                ip_address = get_client_ip(request)
                log_security_event(
                    'jwt_auth_success',
                    user.email,
                    ip_address,
                    {'path': request.path, 'method': request.method}
                )

        except (InvalidToken, TokenError) as e:
            # Log failed authentication attempt
            ip_address = get_client_ip(request)
            log_security_event(
                'jwt_auth_failed',
                'unknown',
                ip_address,
                {'error': str(e), 'path': request.path}
            )

            # For API endpoints, return JSON error
            if request.path.startswith('/api/'):
                return JsonResponse({
                    'success': False,
                    'error': {
                        'message': 'Token de autenticación inválido o expirado.',
                        'code': 'INVALID_TOKEN'
                    }
                }, status=401)

        response = self.get_response(request)
        return response


class RequestLoggingMiddleware:
    """
    Middleware to log API requests for auditing purposes.

    This middleware logs all API requests with relevant information
    for security auditing and debugging.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Record start time
        start_time = time.time()

        # Get client IP
        ip_address = get_client_ip(request)

        # Log request start
        if request.path.startswith('/api/'):
            logger.info(
                f"API Request: {request.method} {request.path} "
                f"from {ip_address} "
                f"User: {getattr(request.user, 'email', 'Anonymous')}"
            )

        # Process request
        response = self.get_response(request)

        # Calculate response time
        response_time = time.time() - start_time

        # Log response
        if request.path.startswith('/api/'):
            logger.info(
                f"API Response: {response.status_code} "
                f"for {request.method} {request.path} "
                f"in {response_time:.3f}s"
            )

        # Add response time header
        response['X-Response-Time'] = f"{response_time:.3f}s"

        return response


class IPSecurityMiddleware:
    """
    Middleware for IP-based security checks.

    This middleware performs IP reputation checks and rate limiting
    based on IP addresses.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.blocked_ips = set()  # In production, use Redis or database
        self.rate_limit_cache = {}  # In production, use Redis

    def __call__(self, request):
        ip_address = get_client_ip(request)

        # Check if IP is blocked
        if ip_address in self.blocked_ips:
            log_security_event(
                'blocked_ip_attempt',
                'unknown',
                ip_address,
                {'path': request.path}
            )

            return JsonResponse({
                'success': False,
                'error': {
                    'message': 'Acceso denegado desde esta dirección IP.',
                    'code': 'IP_BLOCKED'
                }
            }, status=403)

        # Check for suspicious IP
        if is_suspicious_ip(ip_address):
            log_security_event(
                'suspicious_ip_detected',
                getattr(request.user, 'email', 'unknown'),
                ip_address,
                {'path': request.path}
            )

        # Basic rate limiting (simplified implementation)
        if self._is_rate_limited(ip_address, request):
            log_security_event(
                'rate_limit_exceeded',
                getattr(request.user, 'email', 'unknown'),
                ip_address,
                {'path': request.path}
            )

            return JsonResponse({
                'success': False,
                'error': {
                    'message': 'Demasiadas peticiones. Intente más tarde.',
                    'code': 'RATE_LIMITED'
                }
            }, status=429)

        return self.get_response(request)

    def _is_rate_limited(self, ip_address, request):
        """
        Check if IP should be rate limited.

        This is a simplified implementation. In production,
        use Redis with sliding window or token bucket algorithm.
        """
        if not request.path.startswith('/api/'):
            return False

        current_time = timezone.now()
        window_minutes = 15
        max_requests = 100

        # Clean old entries
        cutoff_time = current_time - timezone.timedelta(minutes=window_minutes)

        if ip_address not in self.rate_limit_cache:
            self.rate_limit_cache[ip_address] = []

        # Remove old requests
        self.rate_limit_cache[ip_address] = [
            req_time for req_time in self.rate_limit_cache[ip_address]
            if req_time > cutoff_time
        ]

        # Check if over limit
        if len(self.rate_limit_cache[ip_address]) >= max_requests:
            return True

        # Record this request
        self.rate_limit_cache[ip_address].append(current_time)

        return False


class CORSMiddleware:
    """
    Custom CORS middleware for handling cross-origin requests.

    This middleware handles CORS headers for API requests,
    providing more control than django-cors-headers.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Handle preflight requests
        if request.method == 'OPTIONS':
            response = JsonResponse({})
            self._add_cors_headers(response, request)
            return response

        response = self.get_response(request)

        # Add CORS headers to API responses
        if request.path.startswith('/api/'):
            self._add_cors_headers(response, request)

        return response

    def _add_cors_headers(self, response, request):
        """Add CORS headers to the response."""
        from django.conf import settings

        # Get allowed origins from settings
        allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        origin = request.META.get('HTTP_ORIGIN')

        if origin in allowed_origins or settings.DEBUG:
            response['Access-Control-Allow-Origin'] = origin

        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = (
            'Accept, Accept-Language, Content-Language, Content-Type, '
            'Authorization, X-Requested-With, X-CSRFToken'
        )
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'  # 24 hours


class AuthenticationEventMiddleware(MiddlewareMixin):
    """
    Middleware to track authentication events.

    This middleware tracks login/logout events and user session activities
    for auditing and security monitoring.
    """

    def process_request(self, request):
        """Process the request and track user activity."""
        # Skip for non-API requests
        if not request.path.startswith('/api/'):
            return None

        # Track user activity for authenticated users
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Update last activity (implement if needed)
            pass

        return None

    def process_response(self, request, response):
        """Process the response and log authentication events."""
        # Log successful login
        if (request.path == '/api/auth/login/' and
            request.method == 'POST' and
            response.status_code == 200):

            ip_address = get_client_ip(request)
            try:
                response_data = response.data if hasattr(response, 'data') else {}
                user_email = response_data.get('data', {}).get('user', {}).get('email', 'unknown')

                log_security_event(
                    'user_login',
                    user_email,
                    ip_address,
                    {'method': 'jwt', 'success': True}
                )
            except Exception as e:
                logger.error(f"Error logging login event: {e}")

        # Log logout
        elif (request.path == '/api/auth/logout/' and
              request.method == 'POST' and
              response.status_code == 200):

            ip_address = get_client_ip(request)
            user_email = getattr(request.user, 'email', 'unknown')

            log_security_event(
                'user_logout',
                user_email,
                ip_address,
                {'method': 'jwt', 'success': True}
            )

        return response


# ================================
# Middleware Configuration Helper
# ================================

def get_authentication_middleware():
    """
    Get list of authentication middleware classes.

    Returns:
        list: List of middleware classes to add to MIDDLEWARE setting
    """
    return [
        'apps.authentication.middleware.SecurityHeadersMiddleware',
        'apps.authentication.middleware.RequestLoggingMiddleware',
        'apps.authentication.middleware.IPSecurityMiddleware',
        'apps.authentication.middleware.AuthenticationEventMiddleware',
    ]
