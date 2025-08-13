"""
Custom validators for ZentraQMS authentication system.
"""

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class StrongPasswordValidator:
    """
    Validator for strong passwords.
    
    Ensures that passwords meet security requirements:
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character
    """
    
    def __init__(self, min_length=8):
        self.min_length = min_length
    
    def validate(self, password, user=None):
        """
        Validate that the password meets strength requirements.
        
        Args:
            password (str): The password to validate
            user: The user instance (if available)
            
        Raises:
            ValidationError: If password doesn't meet requirements
        """
        errors = []
        
        # Check minimum length
        if len(password) < self.min_length:
            errors.append(
                _('La contraseña debe tener al menos %(min_length)d caracteres.') % {
                    'min_length': self.min_length
                }
            )
        
        # Check for uppercase letter
        if not re.search(r'[A-Z]', password):
            errors.append(_('La contraseña debe contener al menos una letra mayúscula.'))
        
        # Check for lowercase letter
        if not re.search(r'[a-z]', password):
            errors.append(_('La contraseña debe contener al menos una letra minúscula.'))
        
        # Check for digit
        if not re.search(r'\d', password):
            errors.append(_('La contraseña debe contener al menos un número.'))
        
        # Check for special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append(_('La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>).'))
        
        # Check if password contains user information (if user is provided)
        if user:
            user_info = []
            if hasattr(user, 'email') and user.email:
                user_info.append(user.email.split('@')[0].lower())
            if hasattr(user, 'first_name') and user.first_name:
                user_info.append(user.first_name.lower())
            if hasattr(user, 'last_name') and user.last_name:
                user_info.append(user.last_name.lower())
            
            for info in user_info:
                if len(info) >= 3 and info in password.lower():
                    errors.append(_('La contraseña no debe contener información personal.'))
                    break
        
        if errors:
            raise ValidationError(errors)
    
    def get_help_text(self):
        """
        Return help text for the password requirements.
        
        Returns:
            str: Help text describing password requirements
        """
        return _(
            'Tu contraseña debe contener al menos %(min_length)d caracteres, '
            'incluyendo al menos una letra mayúscula, una minúscula, un número '
            'y un carácter especial.'
        ) % {'min_length': self.min_length}


def validate_colombian_phone(value):
    """
    Validate Colombian phone number format.
    
    Args:
        value (str): Phone number to validate
        
    Raises:
        ValidationError: If phone number format is invalid
    """
    if not value:
        return
    
    # Check for invalid characters (only allow digits, spaces, +, -, (, ))
    if not re.match(r'^[+\d\s\-()]+$', value):
        raise ValidationError(
            _('Número de teléfono debe ser un número colombiano válido. '
              'Ejemplo: 3001234567 o +573001234567')
        )
    
    # Remove allowed formatting characters but keep digits
    digits_only = re.sub(r'[\s\-()]', '', value)
    
    # Remove country code prefix if present
    if digits_only.startswith('+57'):
        digits_only = digits_only[3:]
    elif digits_only.startswith('57'):
        digits_only = digits_only[2:]
    elif digits_only.startswith('+'):
        # If it starts with + but not +57, it's invalid
        raise ValidationError(
            _('Número de teléfono debe ser un número colombiano válido. '
              'Ejemplo: 3001234567 o +573001234567')
        )
    
    # Colombian mobile format (10 digits starting with 3)
    if re.match(r'^3[0-9]{9}$', digits_only):
        return  # Valid mobile number
    
    # Colombian landline format including special cases
    if re.match(r'^[1-8][0-9]{6,8}$', digits_only):
        return  # Valid landline
    
    # Special case: landline with leading 0 (like 016041234)
    if re.match(r'^0[1-8][0-9]{6,7}$', digits_only):
        return  # Valid landline with leading 0
    
    # If none of the patterns match, it's invalid
    raise ValidationError(
        _('Número de teléfono debe ser un número colombiano válido. '
          'Ejemplo: 3001234567 o +573001234567')
    )


def validate_unique_email_case_insensitive(email):
    """
    Validate that email is unique (case insensitive).
    
    Args:
        email (str): Email to validate
        
    Raises:
        ValidationError: If email already exists (case insensitive)
    """
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    if User.objects.filter(email__iexact=email).exists():
        raise ValidationError(
            _('Ya existe un usuario con esta dirección de email.')
        )


def validate_department_name(value):
    """
    Validate department name format.
    
    Args:
        value (str): Department name to validate
        
    Raises:
        ValidationError: If department name format is invalid
    """
    if not value:
        return
    
    # Check minimum length
    if len(value.strip()) < 2:
        raise ValidationError(
            _('El nombre del departamento debe tener al menos 2 caracteres.')
        )
    
    # Check for valid characters (letters, spaces, hyphens, apostrophes)
    if not re.match(r"^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-']+$", value):
        raise ValidationError(
            _('El nombre del departamento solo puede contener letras, espacios, guiones y apostrofes.')
        )


def validate_position_name(value):
    """
    Validate position/job title format.
    
    Args:
        value (str): Position name to validate
        
    Raises:
        ValidationError: If position name format is invalid
    """
    if not value:
        return
    
    # Check minimum length
    if len(value.strip()) < 2:
        raise ValidationError(
            _('El nombre del cargo debe tener al menos 2 caracteres.')
        )
    
    # Check for valid characters (letters, spaces, hyphens, apostrophes, parentheses)
    if not re.match(r"^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-'()]+$", value):
        raise ValidationError(
            _('El nombre del cargo solo puede contener letras, espacios, guiones, apostrofes y paréntesis.')
        )


def validate_password_confirmation(password1, password2):
    """
    Validate that password and password confirmation match.
    
    Args:
        password1 (str): Original password
        password2 (str): Password confirmation
        
    Raises:
        ValidationError: If passwords don't match
    """
    if password1 != password2:
        raise ValidationError(
            _('Las contraseñas no coinciden.')
        )