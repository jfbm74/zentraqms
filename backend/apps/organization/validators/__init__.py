"""
Organization Chart Validators Package

This package implements a factory pattern for multi-sector organizational chart validation.

Main components:
- BaseValidator: Abstract base for all validators
- UniversalValidator: ISO 9001:2015 compliance (universal base)
- HealthValidator: SOGCS and health sector specific validations
- EducationValidator: Education sector specific validations
- ManufacturingValidator: Manufacturing sector validations
- ValidatorFactory: Factory pattern for validator selection
"""

from .base import BaseValidator
from .universal import UniversalValidator
from .health import HealthValidator
from .factory import ValidatorFactory, OrganizationalChartValidator
from .dummy import validate_divipola_department, validate_divipola_municipality

__all__ = [
    'BaseValidator',
    'UniversalValidator', 
    'HealthValidator',
    'ValidatorFactory',
    'OrganizationalChartValidator',
    'validate_divipola_department',
    'validate_divipola_municipality'
]