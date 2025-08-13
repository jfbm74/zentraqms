"""
Custom User model for ZentraQMS authentication system.

This module contains the custom User model that extends Django's AbstractUser
to provide additional fields and functionality required for the QMS system.
"""

import uuid
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


class User(AbstractUser):
    """
    Custom User model for ZentraQMS.
    
    This model extends Django's AbstractUser to provide additional fields
    needed for the Quality Management System, including email-based authentication,
    user verification, security features, and organizational information.
    
    Key Features:
    - UUID primary key for better security
    - Email as the primary authentication field
    - User verification system
    - Security features (failed login attempts, account locking)
    - Organizational fields (department, position)
    - Audit fields (created_by, updated_at)
    """
    
    # Override primary key to use UUID
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_('Unique identifier for the user')
    )
    
    # Override email field to make it unique and required
    email = models.EmailField(
        _('email address'),
        unique=True,
        help_text=_('Required. Used for login and communication.')
    )
    
    # Remove username requirement (we'll use email for login)
    username = models.CharField(
        _('username'),
        max_length=150,
        blank=True,
        null=True,
        help_text=_('Optional. 150 characters or fewer. Letters, digits and @/./+/-/_ only.'),
        validators=[AbstractUser.username_validator],
    )
    
    # Security and verification fields
    is_verified = models.BooleanField(
        _('verified'),
        default=False,
        help_text=_('Designates whether this user has verified their email address.')
    )
    
    last_login_ip = models.GenericIPAddressField(
        _('last login IP'),
        blank=True,
        null=True,
        help_text=_('IP address of the last login attempt.')
    )
    
    failed_login_attempts = models.PositiveIntegerField(
        _('failed login attempts'),
        default=0,
        help_text=_('Number of consecutive failed login attempts.')
    )
    
    locked_until = models.DateTimeField(
        _('locked until'),
        blank=True,
        null=True,
        help_text=_('Account is locked until this date and time.')
    )
    
    # Audit fields
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name=_('created by'),
        help_text=_('User who created this account.')
    )
    
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True,
        help_text=_('Date and time when the user was last updated.')
    )
    
    # Contact information
    phone_regex = RegexValidator(
        regex=r'^\+?57?[0-9]{10}$',
        message=_('Número de teléfono debe estar en formato: "+573001234567" o "3001234567".')
    )
    phone_number = models.CharField(
        _('phone number'),
        validators=[phone_regex],
        max_length=15,
        blank=True,
        help_text=_('Phone number in Colombian format.')
    )
    
    # Organizational fields (for future RBAC implementation)
    department = models.CharField(
        _('department'),
        max_length=100,
        blank=True,
        help_text=_('Department or area within the organization.')
    )
    
    position = models.CharField(
        _('position'),
        max_length=100,
        blank=True,
        help_text=_('Job title or position within the organization.')
    )
    
    # Manager
    objects = UserManager()
    
    # Authentication configuration
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')
        ordering = ['email']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_active', 'is_verified']),
            models.Index(fields=['department']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        """
        String representation of the user.
        
        Returns:
            str: User's email address
        """
        return self.email
    
    @property
    def full_name(self):
        """
        Get the user's full name.
        
        Returns:
            str: User's full name (first_name + last_name)
        """
        return f'{self.first_name} {self.last_name}'.strip() or self.email
    
    @property
    def short_name(self):
        """
        Get the user's short name.
        
        Returns:
            str: User's first name or email if first name is not available
        """
        return self.first_name or self.email
    
    def can_login(self):
        """
        Check if the user can login.
        
        Verifies that the user is active and not currently locked.
        
        Returns:
            bool: True if user can login, False otherwise
        """
        if not self.is_active:
            return False
            
        if self.locked_until and self.locked_until > timezone.now():
            return False
            
        return True
    
    def is_account_locked(self):
        """
        Check if the account is currently locked.
        
        Returns:
            bool: True if account is locked, False otherwise
        """
        return self.locked_until and self.locked_until > timezone.now()
    
    def lock_account(self, duration_minutes=30):
        """
        Lock the user account for a specified duration.
        
        Args:
            duration_minutes (int): Number of minutes to lock the account
        """
        from datetime import timedelta
        self.locked_until = timezone.now() + timedelta(minutes=duration_minutes)
        self.save(update_fields=['locked_until'])
    
    def unlock_account(self):
        """
        Unlock the user account and reset failed login attempts.
        """
        self.locked_until = None
        self.failed_login_attempts = 0
        self.save(update_fields=['locked_until', 'failed_login_attempts'])
    
    def increment_failed_login(self, max_attempts=5):
        """
        Increment failed login attempts and lock account if threshold is reached.
        
        Args:
            max_attempts (int): Maximum allowed failed attempts before locking
        """
        self.failed_login_attempts += 1
        
        if self.failed_login_attempts >= max_attempts:
            self.lock_account()
        
        self.save(update_fields=['failed_login_attempts'])
    
    def reset_failed_login_attempts(self):
        """
        Reset failed login attempts counter (called on successful login).
        """
        if self.failed_login_attempts > 0:
            self.failed_login_attempts = 0
            self.save(update_fields=['failed_login_attempts'])
    
    def update_last_login_ip(self, ip_address):
        """
        Update the last login IP address.
        
        Args:
            ip_address (str): IP address of the login attempt
        """
        self.last_login_ip = ip_address
        self.save(update_fields=['last_login_ip'])
    
    def verify_email(self):
        """
        Mark the user's email as verified.
        """
        self.is_verified = True
        self.save(update_fields=['is_verified'])
    
    def get_display_name(self):
        """
        Get the best display name for the user.
        
        Returns:
            str: Full name if available, otherwise email
        """
        if self.first_name and self.last_name:
            return self.full_name
        elif self.first_name:
            return self.first_name
        else:
            return self.email
    
    def has_organizational_info(self):
        """
        Check if user has organizational information filled out.
        
        Returns:
            bool: True if department and position are set
        """
        return bool(self.department and self.position)
    
    def clean(self):
        """
        Custom model validation.
        """
        super().clean()
        
        # Normalize email to lowercase
        if self.email:
            self.email = self.email.lower()
    
    def save(self, *args, **kwargs):
        """
        Override save method to ensure email is normalized.
        """
        # Normalize email before saving
        if self.email:
            self.email = self.email.lower()
            
        super().save(*args, **kwargs)