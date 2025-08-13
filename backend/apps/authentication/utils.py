"""
Utility functions for ZentraQMS authentication system.

This module contains helper functions for authentication-related operations
including IP handling, account locking, token management, and security utilities.
"""

import logging
from datetime import timedelta
from typing import Optional

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings

from apps.common.utils import get_client_ip

User = get_user_model()
logger = logging.getLogger('authentication')


# ================================
# Account Security Functions
# ================================

def is_account_locked(user) -> bool:
    """
    Check if a user account is currently locked.
    
    Args:
        user: User instance
        
    Returns:
        bool: True if account is locked, False otherwise
    """
    if not user.locked_until:
        return False
    
    return user.locked_until > timezone.now()


def lock_account(user, minutes: int = 30) -> None:
    """
    Lock a user account for a specified duration.
    
    Args:
        user: User instance to lock
        minutes (int): Duration to lock account in minutes (default: 30)
    """
    user.locked_until = timezone.now() + timedelta(minutes=minutes)
    user.save(update_fields=['locked_until'])
    
    logger.warning(
        f"Account locked for user: {user.email} for {minutes} minutes"
    )


def unlock_account(user) -> None:
    """
    Unlock a user account and reset failed login attempts.
    
    Args:
        user: User instance to unlock
    """
    user.locked_until = None
    user.failed_login_attempts = 0
    user.save(update_fields=['locked_until', 'failed_login_attempts'])
    
    logger.info(f"Account unlocked for user: {user.email}")


def increment_failed_attempts(user, max_attempts: int = 5) -> bool:
    """
    Increment failed login attempts and lock account if threshold is reached.
    
    Args:
        user: User instance
        max_attempts (int): Maximum allowed failed attempts before locking (default: 5)
        
    Returns:
        bool: True if account was locked, False otherwise
    """
    user.failed_login_attempts += 1
    
    if user.failed_login_attempts >= max_attempts:
        lock_account(user)
        user.save(update_fields=['failed_login_attempts'])
        return True
    else:
        user.save(update_fields=['failed_login_attempts'])
        return False


def reset_failed_attempts(user) -> None:
    """
    Reset failed login attempts counter for a user.
    
    Args:
        user: User instance
    """
    if user.failed_login_attempts > 0:
        user.failed_login_attempts = 0
        user.save(update_fields=['failed_login_attempts'])


def update_last_login_info(user, request=None, ip_address: Optional[str] = None) -> None:
    """
    Update user's last login information including IP address.
    
    Args:
        user: User instance
        request: Django request object (optional)
        ip_address (str): IP address (optional, will be extracted from request if not provided)
    """
    # Update last login timestamp
    user.last_login = timezone.now()
    
    # Get IP address
    if not ip_address and request:
        ip_address = get_client_ip(request)
    
    # Update IP if available
    if ip_address:
        user.last_login_ip = ip_address
        user.save(update_fields=['last_login', 'last_login_ip'])
    else:
        user.save(update_fields=['last_login'])


# ================================
# IP and Security Functions
# ================================

def is_suspicious_ip(ip_address: str) -> bool:
    """
    Check if an IP address is suspicious based on configured rules.
    
    This is a placeholder for future security enhancements.
    
    Args:
        ip_address (str): IP address to check
        
    Returns:
        bool: True if IP is suspicious, False otherwise
    """
    # TODO: Implement IP reputation checking, rate limiting, etc.
    # For now, always return False
    return False


def log_security_event(event_type: str, user_email: str, ip_address: str, details: dict = None) -> None:
    """
    Log security-related events for auditing purposes.
    
    Args:
        event_type (str): Type of security event (login, logout, failed_login, etc.)
        user_email (str): Email of the user involved
        ip_address (str): IP address where event originated
        details (dict): Additional event details (optional)
    """
    log_data = {
        'event_type': event_type,
        'user_email': user_email,
        'ip_address': ip_address,
        'timestamp': timezone.now().isoformat(),
        'details': details or {}
    }
    
    logger.info(f"Security event: {log_data}")


def validate_user_access(user, request=None) -> tuple[bool, str]:
    """
    Validate if a user should be allowed to access the system.
    
    Args:
        user: User instance
        request: Django request object (optional)
        
    Returns:
        tuple: (is_valid, error_message)
    """
    # Check if user is active
    if not user.is_active:
        return False, "Cuenta desactivada."
    
    # Check if account is locked
    if is_account_locked(user):
        remaining_time = user.locked_until - timezone.now()
        minutes = int(remaining_time.total_seconds() / 60)
        return False, f"Cuenta bloqueada. Intente nuevamente en {minutes} minutos."
    
    # Check if user can login (based on model method)
    if not user.can_login():
        return False, "No se puede acceder a esta cuenta en este momento."
    
    # Optional: Check IP reputation
    if request:
        ip_address = get_client_ip(request)
        if ip_address and is_suspicious_ip(ip_address):
            log_security_event('suspicious_ip', user.email, ip_address)
            return False, "Acceso denegado desde esta ubicación."
    
    return True, ""


# ================================
# Token Management Functions
# ================================

def get_token_info(token_string: str) -> dict:
    """
    Extract information from a JWT token without validation.
    
    Args:
        token_string (str): JWT token string
        
    Returns:
        dict: Token payload information
    """
    try:
        import jwt
        # Decode without verification (for debugging/info purposes only)
        payload = jwt.decode(token_string, options={"verify_signature": False})
        return payload
    except Exception as e:
        logger.error(f"Error extracting token info: {str(e)}")
        return {}


def is_token_expired(token_string: str) -> bool:
    """
    Check if a JWT token is expired.
    
    Args:
        token_string (str): JWT token string
        
    Returns:
        bool: True if token is expired, False otherwise
    """
    try:
        token_info = get_token_info(token_string)
        exp = token_info.get('exp')
        
        if exp:
            return timezone.now().timestamp() > exp
        
        return False
    except Exception:
        return True


def calculate_token_expiry(token_string: str) -> Optional[timezone.datetime]:
    """
    Calculate when a JWT token will expire.
    
    Args:
        token_string (str): JWT token string
        
    Returns:
        Optional[datetime]: Expiry datetime or None if invalid
    """
    try:
        token_info = get_token_info(token_string)
        exp = token_info.get('exp')
        
        if exp:
            return timezone.datetime.fromtimestamp(exp, tz=timezone.utc)
        
        return None
    except Exception:
        return None


# ================================
# Rate Limiting Functions
# ================================

def check_rate_limit(identifier: str, max_requests: int = 10, window_minutes: int = 15) -> tuple[bool, int]:
    """
    Check if a request should be rate limited.
    
    This is a basic implementation. In production, consider using Redis
    or a dedicated rate limiting service.
    
    Args:
        identifier (str): Unique identifier (IP, user ID, etc.)
        max_requests (int): Maximum requests allowed in window
        window_minutes (int): Time window in minutes
        
    Returns:
        tuple: (is_allowed, remaining_requests)
    """
    # TODO: Implement proper rate limiting with Redis or similar
    # For now, always allow requests
    return True, max_requests


def record_request(identifier: str) -> None:
    """
    Record a request for rate limiting purposes.
    
    Args:
        identifier (str): Unique identifier for the request source
    """
    # TODO: Implement request recording for rate limiting
    pass


# ================================
# Password Strength Functions
# ================================

def calculate_password_strength(password: str) -> dict:
    """
    Calculate password strength score and provide feedback.
    
    Args:
        password (str): Password to analyze
        
    Returns:
        dict: Password strength analysis
    """
    import re
    
    score = 0
    feedback = []
    
    # Length check
    if len(password) >= 8:
        score += 1
    else:
        feedback.append("Debe tener al menos 8 caracteres")
    
    if len(password) >= 12:
        score += 1
    
    # Character variety checks
    if re.search(r'[a-z]', password):
        score += 1
    else:
        feedback.append("Debe contener letras minúsculas")
    
    if re.search(r'[A-Z]', password):
        score += 1
    else:
        feedback.append("Debe contener letras mayúsculas")
    
    if re.search(r'\d', password):
        score += 1
    else:
        feedback.append("Debe contener números")
    
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1
    else:
        feedback.append("Debe contener caracteres especiales")
    
    # Common patterns check
    common_patterns = ['123', 'abc', 'password', 'admin']
    if any(pattern in password.lower() for pattern in common_patterns):
        score -= 1
        feedback.append("Evite patrones comunes")
    
    # Determine strength level
    if score >= 6:
        strength = "Muy fuerte"
    elif score >= 4:
        strength = "Fuerte"
    elif score >= 3:
        strength = "Moderada"
    elif score >= 2:
        strength = "Débil"
    else:
        strength = "Muy débil"
    
    return {
        'score': max(0, score),
        'max_score': 6,
        'strength': strength,
        'feedback': feedback
    }


# ================================
# Utility Helper Functions
# ================================

def get_user_by_email(email: str) -> Optional[User]:
    """
    Get user by email address (case insensitive).
    
    Args:
        email (str): Email address
        
    Returns:
        Optional[User]: User instance or None if not found
    """
    try:
        return User.objects.get(email__iexact=email.strip().lower())
    except User.DoesNotExist:
        return None


def format_time_remaining(time_delta: timedelta) -> str:
    """
    Format a time delta into a human-readable string.
    
    Args:
        time_delta (timedelta): Time difference
        
    Returns:
        str: Human-readable time string
    """
    total_seconds = int(time_delta.total_seconds())
    
    if total_seconds <= 0:
        return "0 segundos"
    
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    
    parts = []
    if hours > 0:
        parts.append(f"{hours} hora{'s' if hours != 1 else ''}")
    if minutes > 0:
        parts.append(f"{minutes} minuto{'s' if minutes != 1 else ''}")
    if seconds > 0 and hours == 0:  # Only show seconds if less than an hour
        parts.append(f"{seconds} segundo{'s' if seconds != 1 else ''}")
    
    return " y ".join(parts)


def clean_user_session_data(user) -> dict:
    """
    Prepare user data for session/token storage.
    
    Args:
        user: User instance
        
    Returns:
        dict: Clean user data for storage
    """
    return {
        'id': str(user.id),
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_verified': user.is_verified,
        'is_active': user.is_active,
        'is_staff': user.is_staff,
        'department': user.department,
        'position': user.position,
        'last_login': user.last_login.isoformat() if user.last_login else None,
    }