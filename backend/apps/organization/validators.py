"""
Custom validators for Organization module.

This module contains specialized validators for Colombian regulatory compliance,
including NIT validation, DIVIPOLA codes, and other Colombian-specific formats.
"""

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_nit_format(value):
    """
    Validate Colombian NIT format.
    
    Validates that NIT contains only digits and has the correct length (9-10 digits).
    Does not validate the verification digit calculation.
    
    Args:
        value (str): NIT to validate
        
    Raises:
        ValidationError: If NIT format is invalid
    """
    if not value:
        return
        
    # Remove any non-digit characters for validation
    clean_nit = re.sub(r'[^\d]', '', value)
    
    # Check length (9-10 digits for Colombian NITs)
    if len(clean_nit) < 9 or len(clean_nit) > 10:
        raise ValidationError(
            _('NIT debe tener entre 9 y 10 dígitos.'),
            code='invalid_nit_length'
        )
    
    # Check that it contains only digits
    if not clean_nit.isdigit():
        raise ValidationError(
            _('NIT debe contener únicamente números.'),
            code='invalid_nit_format'
        )


def validate_verification_digit(value):
    """
    Validate verification digit format.
    
    Args:
        value (str): Verification digit to validate
        
    Raises:
        ValidationError: If verification digit is invalid
    """
    if not value:
        return
    
    if not re.match(r'^[0-9]$', value):
        raise ValidationError(
            _('Dígito de verificación debe ser un número del 0 al 9.'),
            code='invalid_verification_digit'
        )


def validate_colombian_phone(value):
    """
    Validate Colombian phone number format.
    
    Accepts formats like:
    - +57 301 234 5678
    - +57 3012345678
    - 301 234 5678
    - 3012345678
    - (1) 234 5678 (for landlines)
    
    Args:
        value (str): Phone number to validate
        
    Raises:
        ValidationError: If phone number format is invalid
    """
    if not value:
        return
    
    # Remove spaces, parentheses, and dashes for validation
    clean_phone = re.sub(r'[\s\-\(\)]', '', value)
    
    # Colombian mobile patterns
    mobile_patterns = [
        r'^\+57[3][0-9]{9}$',  # +57 3XX XXX XXXX
        r'^[3][0-9]{9}$',      # 3XX XXX XXXX
    ]
    
    # Colombian landline patterns
    landline_patterns = [
        r'^\+57[1-8][0-9]{6,7}$',  # +57 (1-8)XXX XXXX
        r'^[1-8][0-9]{6,7}$',      # (1-8)XXX XXXX
    ]
    
    # Check if it matches any valid pattern
    all_patterns = mobile_patterns + landline_patterns
    
    if not any(re.match(pattern, clean_phone) for pattern in all_patterns):
        raise ValidationError(
            _('Número de teléfono debe tener un formato colombiano válido. '
              'Ejemplos: +57 301 234 5678, 301 234 5678, (1) 234 5678'),
            code='invalid_phone_format'
        )


def validate_email_domain(value):
    """
    Validate email domain for Colombian organizations.
    
    Basic email validation with recommendations for Colombian domains.
    
    Args:
        value (str): Email to validate
        
    Raises:
        ValidationError: If email format is invalid
    """
    if not value:
        return
    
    # Basic email format validation
    email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    
    if not re.match(email_pattern, value):
        raise ValidationError(
            _('Dirección de email no tiene un formato válido.'),
            code='invalid_email_format'
        )


def validate_website_url(value):
    """
    Validate website URL format.
    
    Args:
        value (str): URL to validate
        
    Raises:
        ValidationError: If URL format is invalid
    """
    if not value:
        return
    
    # Basic URL validation
    url_pattern = r'^https?://(www\.)?[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*/?'
    
    if not re.match(url_pattern, value, re.IGNORECASE):
        raise ValidationError(
            _('URL del sitio web no tiene un formato válido. '
              'Debe comenzar con http:// o https://'),
            code='invalid_url_format'
        )


def validate_razon_social(value):
    """
    Validate organization legal name (razón social).
    
    Args:
        value (str): Legal name to validate
        
    Raises:
        ValidationError: If legal name is invalid
    """
    if not value:
        return
    
    # Check minimum length
    if len(value.strip()) < 3:
        raise ValidationError(
            _('Razón social debe tener al menos 3 caracteres.'),
            code='razon_social_too_short'
        )
    
    # Check maximum length
    if len(value) > 200:
        raise ValidationError(
            _('Razón social no puede exceder 200 caracteres.'),
            code='razon_social_too_long'
        )
    
    # Check for valid characters (letters, numbers, spaces, and common business symbols)
    if not re.match(r'^[a-zA-ZÀ-ÿ0-9\s\.\-\_\&\(\)]+$', value):
        raise ValidationError(
            _('Razón social contiene caracteres no válidos. '
              'Solo se permiten letras, números, espacios y símbolos comunes (.-_&()).'),
            code='invalid_razon_social_characters'
        )


def validate_description_length(value):
    """
    Validate organization description length.
    
    Args:
        value (str): Description to validate
        
    Raises:
        ValidationError: If description is too long
    """
    if not value:
        return
    
    if len(value) > 1000:
        raise ValidationError(
            _('Descripción no puede exceder 1000 caracteres.'),
            code='description_too_long'
        )


# DIVIPOLA validation (Colombian administrative division codes)
DIVIPOLA_DEPARTMENTS = {
    '05': 'Antioquia',
    '08': 'Atlántico', 
    '11': 'Bogotá D.C.',
    '13': 'Bolívar',
    '15': 'Boyacá',
    '17': 'Caldas',
    '18': 'Caquetá',
    '19': 'Cauca',
    '20': 'Cesar',
    '23': 'Córdoba',
    '25': 'Cundinamarca',
    '27': 'Chocó',
    '41': 'Huila',
    '44': 'La Guajira',
    '47': 'Magdalena',
    '50': 'Meta',
    '52': 'Nariño',
    '54': 'Norte de Santander',
    '63': 'Quindío',
    '66': 'Risaralda',
    '68': 'Santander',
    '70': 'Sucre',
    '73': 'Tolima',
    '76': 'Valle del Cauca',
    '81': 'Arauca',
    '85': 'Casanare',
    '86': 'Putumayo',
    '88': 'Archipiélago de San Andrés',
    '91': 'Amazonas',
    '94': 'Guainía',
    '95': 'Guaviare',
    '97': 'Vaichada',
    '99': 'Vichada',
}


def validate_divipola_department(value):
    """
    Validate DIVIPOLA department code.
    
    Args:
        value (str): Department code to validate
        
    Raises:
        ValidationError: If department code is invalid
    """
    if not value:
        return
    
    if value not in DIVIPOLA_DEPARTMENTS:
        raise ValidationError(
            _('Código de departamento DIVIPOLA no válido.'),
            code='invalid_divipola_department'
        )


def validate_divipola_municipality(department_code, municipality_code):
    """
    Validate DIVIPOLA municipality code for a given department.
    
    Args:
        department_code (str): Department code
        municipality_code (str): Municipality code to validate
        
    Raises:
        ValidationError: If municipality code is invalid
    """
    if not municipality_code:
        return
    
    # Basic format validation - municipality codes are 3 digits
    if not re.match(r'^\d{3}$', municipality_code):
        raise ValidationError(
            _('Código de municipio DIVIPOLA debe tener 3 dígitos.'),
            code='invalid_divipola_municipality_format'
        )
    
    # Full code should be department + municipality (5 digits total)
    full_code = f"{department_code}{municipality_code}"
    
    if len(full_code) != 5:
        raise ValidationError(
            _('Código DIVIPOLA completo debe tener 5 dígitos.'),
            code='invalid_divipola_code_length'
        )