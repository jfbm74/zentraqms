"""
Django signals for authentication app.

This module contains signal handlers for user-related events
such as user creation, login attempts, etc.
"""

import logging
from django.contrib.auth.signals import user_logged_in, user_login_failed
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from apps.common.utils import get_client_ip

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """
    Handle user post-save events.

    Args:
        sender: The User model class
        instance: The User instance that was saved
        created (bool): True if this is a new user
        **kwargs: Additional keyword arguments
    """
    if created:
        logger.info(f"New user created: {instance.email}")

        # TODO: Send welcome email in future phases
        # TODO: Create user profile or related objects

    else:
        logger.info(f"User updated: {instance.email}")


@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    """
    Handle successful user login events.

    Args:
        sender: The User model class
        request: The HTTP request
        user: The User instance that logged in
        **kwargs: Additional keyword arguments
    """
    # Get client IP address
    ip_address = get_client_ip(request)

    # Update user's last login IP
    if ip_address:
        user.update_last_login_ip(ip_address)

    # Reset failed login attempts on successful login
    user.reset_failed_login_attempts()

    logger.info(f"User logged in: {user.email} from IP: {ip_address}")


@receiver(user_login_failed)
def user_login_failed_handler(sender, credentials, request, **kwargs):
    """
    Handle failed user login attempts.

    Args:
        sender: The authentication backend class
        credentials: The credentials that were used
        request: The HTTP request
        **kwargs: Additional keyword arguments
    """
    email = credentials.get('username') or credentials.get('email')
    ip_address = get_client_ip(request)

    if email:
        try:
            # Try to find the user (case insensitive)
            user = User.objects.get(email__iexact=email)

            # Increment failed login attempts
            user.increment_failed_login()

            logger.warning(
                f"Failed login attempt for user: {email} from IP: {ip_address}. "
                f"Failed attempts: {user.failed_login_attempts}"
            )

            if user.is_account_locked():
                logger.warning(f"Account locked due to too many failed attempts: {email}")

        except User.DoesNotExist:
            # Log failed attempt for non-existent user
            logger.warning(f"Failed login attempt for non-existent user: {email} from IP: {ip_address}")

    else:
        logger.warning(f"Failed login attempt with missing credentials from IP: {ip_address}")


# TODO: Add more signals in future phases
# - Password change signals
# - Account verification signals  
# - Permission change signals
# - Profile update signals
