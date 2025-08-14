"""
Custom user managers for ZentraQMS authentication.
"""

from django.contrib.auth.models import BaseUserManager
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """
    Custom user manager for the User model.

    This manager provides methods to create regular users and superusers
    using email as the unique identifier instead of username.
    """

    def _create_user(self, email, password, **extra_fields):
        """
        Create and save a user with the given email and password.

        Args:
            email (str): User's email address
            password (str): User's password
            **extra_fields: Additional fields for the user

        Returns:
            User: The created user instance

        Raises:
            ValueError: If email is not provided
            ValidationError: If email format is invalid
        """
        if not email:
            raise ValueError(_("El email es obligatorio"))

        # Normalize the email address
        email = self.normalize_email(email)

        # Validate email format (basic validation)
        if "@" not in email:
            raise ValidationError(_("El formato del email no es válido"))

        # Create the user instance
        user = self.model(email=email, **extra_fields)

        # Set the password (this will hash it)
        user.set_password(password)

        # Save the user to the database
        user.save(using=self._db)

        return user

    def create_user(self, email=None, password=None, **extra_fields):
        """
        Create and return a regular user with the given email and password.

        Args:
            email (str): User's email address
            password (str): User's password
            **extra_fields: Additional fields for the user

        Returns:
            User: The created user instance
        """
        # Set default values for regular users
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", False)

        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email=None, password=None, **extra_fields):
        """
        Create and return a superuser with the given email and password.

        Args:
            email (str): Superuser's email address
            password (str): Superuser's password
            **extra_fields: Additional fields for the user

        Returns:
            User: The created superuser instance

        Raises:
            ValueError: If is_staff or is_superuser is not True
        """
        # Set required values for superusers
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", True)

        # Validate that superuser flags are properly set
        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("El superusuario debe tener is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("El superusuario debe tener is_superuser=True."))

        return self._create_user(email, password, **extra_fields)

    def get_by_natural_key(self, email):
        """
        Retrieve a user by their email (case insensitive).

        Args:
            email (str): User's email address

        Returns:
            User: The user with the given email
        """
        return self.get(email__iexact=email)

    def active_users(self):
        """
        Return a queryset of active users.

        Returns:
            QuerySet: All active users
        """
        return self.filter(is_active=True)

    def verified_users(self):
        """
        Return a queryset of verified users.

        Returns:
            QuerySet: All verified users
        """
        return self.filter(is_verified=True)

    def staff_users(self):
        """
        Return a queryset of staff users.

        Returns:
            QuerySet: All staff users
        """
        return self.filter(is_staff=True)

    def create_user_with_profile(
        self, email, password, first_name, last_name, **extra_fields
    ):
        """
        Create a user with basic profile information.

        Args:
            email (str): User's email address
            password (str): User's password
            first_name (str): User's first name
            last_name (str): User's last name
            **extra_fields: Additional fields for the user

        Returns:
            User: The created user instance
        """
        extra_fields.update(
            {
                "first_name": first_name,
                "last_name": last_name,
            }
        )

        return self.create_user(email=email, password=password, **extra_fields)
