"""
Validator Factory for Multi-Sector Organizational Chart Validation

This module implements the factory pattern for selecting and creating
appropriate validators based on organization sector and specific requirements.

The factory supports:
- Automatic validator selection based on sector
- Validator chaining for complex validations
- Custom validator registration
- Fallback to universal validator when sector-specific validator not available
"""

from typing import Dict, List, Any, Optional, Type, Union
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError

from .base import BaseValidator, ValidationResult
from .universal import UniversalValidator
from .health import HealthValidator


class ValidatorFactory:
    """
    Factory class for creating sector-specific organizational chart validators.
    
    Implements the factory pattern to provide appropriate validators based on
    organization sector while maintaining extensibility for new sectors.
    """
    
    # Registry of available validators by sector code
    _validators: Dict[str, Type[BaseValidator]] = {
        'UNIVERSAL': UniversalValidator,
        'HEALTH': HealthValidator,
        'SALUD': HealthValidator,  # Spanish alias
    }
    
    # Sector aliases mapping
    _sector_aliases: Dict[str, str] = {
        'SALUD': 'HEALTH',
        'HEALTHCARE': 'HEALTH',
        'EDUCACION': 'EDUCATION',
        'MANUFACTURING': 'MANUFACTURING',
        'MANUFACTURA': 'MANUFACTURING',
        'SERVICIOS': 'SERVICES',
        'PUBLICO': 'PUBLIC',
        'PUBLIC_SECTOR': 'PUBLIC',
    }
    
    @classmethod
    def register_validator(cls, sector_code: str, validator_class: Type[BaseValidator]):
        """
        Register a new validator for a specific sector.
        
        Args:
            sector_code: Sector code (e.g., 'EDUCATION', 'MANUFACTURING')
            validator_class: Validator class implementing BaseValidator
        """
        if not issubclass(validator_class, BaseValidator):
            raise ValidationError(
                f"Validator class must inherit from BaseValidator: {validator_class.__name__}"
            )
        
        cls._validators[sector_code.upper()] = validator_class
    
    @classmethod
    def register_sector_alias(cls, alias: str, sector_code: str):
        """
        Register a sector alias for more flexible sector matching.
        
        Args:
            alias: Alias name
            sector_code: Target sector code
        """
        cls._sector_aliases[alias.upper()] = sector_code.upper()
    
    @classmethod
    def get_validator(cls, 
                     sector_code: str = None, 
                     organization_type: str = None,
                     fallback_to_universal: bool = True) -> BaseValidator:
        """
        Get appropriate validator for the given sector and organization type.
        
        Args:
            sector_code: Primary sector code
            organization_type: Specific organization type within sector
            fallback_to_universal: Whether to fallback to universal validator if specific not found
            
        Returns:
            BaseValidator: Appropriate validator instance
            
        Raises:
            ValidationError: If validator cannot be found and fallback is disabled
        """
        if not sector_code:
            return UniversalValidator()
        
        # Normalize sector code
        normalized_sector = cls._normalize_sector_code(sector_code)
        
        # Try to get sector-specific validator
        validator_class = cls._validators.get(normalized_sector)
        
        if validator_class:
            return validator_class()
        
        # Try aliases
        if normalized_sector in cls._sector_aliases:
            target_sector = cls._sector_aliases[normalized_sector]
            validator_class = cls._validators.get(target_sector)
            if validator_class:
                return validator_class()
        
        # Fallback to universal validator if allowed
        if fallback_to_universal:
            return UniversalValidator()
        
        # No validator found and fallback disabled
        raise ValidationError(
            f"No validator found for sector '{sector_code}' and fallback is disabled"
        )
    
    @classmethod
    def get_validator_for_organization(cls, organization) -> BaseValidator:
        """
        Get appropriate validator for a specific organization instance.
        
        Args:
            organization: Organization model instance
            
        Returns:
            BaseValidator: Appropriate validator for the organization
        """
        # Get sector from organization
        sector_code = getattr(organization, 'sector_economico', None)
        organization_type = getattr(organization, 'tipo_organizacion', None)
        
        # For health organizations, we might have more specific sector info
        if hasattr(organization, 'health_organization'):
            # Health sector has priority
            sector_code = 'HEALTH'
        
        return cls.get_validator(
            sector_code=sector_code,
            organization_type=organization_type,
            fallback_to_universal=True
        )
    
    @classmethod
    def validate_organizational_chart(cls, 
                                    organizational_chart,
                                    validator: BaseValidator = None) -> ValidationResult:
        """
        Validate organizational chart with appropriate validator.
        
        Args:
            organizational_chart: OrganizationalChart instance
            validator: Specific validator to use (optional)
            
        Returns:
            ValidationResult: Complete validation results
        """
        if not validator:
            validator = cls.get_validator_for_organization(organizational_chart.organization)
        
        return validator.validate(organizational_chart)
    
    @classmethod
    def get_available_sectors(cls) -> List[str]:
        """Get list of sectors with available validators."""
        return list(cls._validators.keys())
    
    @classmethod
    def get_sector_aliases(cls) -> Dict[str, str]:
        """Get mapping of sector aliases."""
        return cls._sector_aliases.copy()
    
    @classmethod
    def supports_sector(cls, sector_code: str) -> bool:
        """
        Check if factory supports validation for given sector.
        
        Args:
            sector_code: Sector to check
            
        Returns:
            bool: True if sector is supported
        """
        normalized_sector = cls._normalize_sector_code(sector_code)
        
        return (
            normalized_sector in cls._validators or
            normalized_sector in cls._sector_aliases
        )
    
    @classmethod
    def get_validator_info(cls, sector_code: str) -> Dict[str, Any]:
        """
        Get information about validator for given sector.
        
        Args:
            sector_code: Sector code
            
        Returns:
            Dict containing validator information
        """
        try:
            validator = cls.get_validator(sector_code, fallback_to_universal=False)
            
            return {
                'sector_code': sector_code,
                'validator_class': validator.__class__.__name__,
                'supported_sectors': getattr(validator, 'supported_sectors', [sector_code]),
                'mandatory_committees': validator.get_mandatory_committees(),
                'mandatory_positions': validator.get_mandatory_positions(),
                'validation_rules': validator.get_validation_rules(),
                'has_sector_specific_rules': hasattr(validator, '_validate_sector_specific')
            }
            
        except ValidationError:
            return {
                'sector_code': sector_code,
                'validator_class': 'UniversalValidator',
                'supported_sectors': ['UNIVERSAL'],
                'note': 'Falls back to universal validator'
            }
    
    @classmethod
    def _normalize_sector_code(cls, sector_code: str) -> str:
        """Normalize sector code to uppercase."""
        return sector_code.upper().strip() if sector_code else ''
    
    @classmethod
    def get_validation_checklist(cls, sector_code: str = None) -> List[Dict[str, Any]]:
        """
        Get validation checklist for sector.
        
        Args:
            sector_code: Sector code (optional)
            
        Returns:
            List of validation checklist items
        """
        validator = cls.get_validator(sector_code)
        return validator.get_validation_checklist()


class ChainedValidator:
    """
    Validator that chains multiple validators for complex validation scenarios.
    
    Useful for organizations that need to comply with multiple standards or
    when combining universal requirements with sector-specific ones.
    """
    
    def __init__(self, validators: List[BaseValidator]):
        """
        Initialize chained validator.
        
        Args:
            validators: List of validators to chain
        """
        self.validators = validators
        self.results_cache = {}
    
    def validate(self, organizational_chart) -> ValidationResult:
        """
        Run all validators in chain and combine results.
        
        Args:
            organizational_chart: OrganizationalChart to validate
            
        Returns:
            ValidationResult: Combined results from all validators
        """
        combined_result = ValidationResult()
        individual_results = []
        
        for i, validator in enumerate(self.validators):
            try:
                result = validator.validate(organizational_chart)
                individual_results.append({
                    'validator': validator.__class__.__name__,
                    'result': result
                })
                
                # Combine results
                combined_result.errors.extend(result.errors)
                combined_result.warnings.extend(result.warnings)
                combined_result.recommendations.extend(result.recommendations)
                
                # If any validator fails, combined result fails
                if not result.is_valid:
                    combined_result.is_valid = False
                
            except Exception as e:
                combined_result.add_error(
                    'CHAINED_VALIDATOR_ERROR',
                    f"Error in validator {validator.__class__.__name__}: {str(e)}",
                    component='chained_validation',
                    details={
                        'validator_index': i,
                        'validator_class': validator.__class__.__name__,
                        'exception': str(e),
                        'is_critical': True
                    }
                )
        
        # Update summary with chained validation info
        combined_result.summary.update({
            'validation_type': 'chained',
            'total_validators': len(self.validators),
            'validator_classes': [v.__class__.__name__ for v in self.validators],
            'individual_results': len(individual_results)
        })
        
        return combined_result
    
    @classmethod
    def create_for_organization(cls, organization):
        """
        Create chained validator appropriate for organization.
        
        Args:
            organization: Organization instance
            
        Returns:
            ChainedValidator: Configured chained validator
        """
        validators = []
        
        # Always include universal validator
        validators.append(UniversalValidator())
        
        # Add sector-specific validator if different from universal
        sector_validator = ValidatorFactory.get_validator_for_organization(organization)
        if not isinstance(sector_validator, UniversalValidator):
            validators.append(sector_validator)
        
        return cls(validators)


# Convenience class for direct usage
class OrganizationalChartValidator:
    """
    High-level validator class for organizational charts.
    
    Provides simple interface for validation without needing to understand
    the factory pattern or validator selection logic.
    """
    
    @staticmethod
    def validate(organizational_chart, 
                sector_code: str = None,
                use_chained_validation: bool = False) -> ValidationResult:
        """
        Validate organizational chart with automatic validator selection.
        
        Args:
            organizational_chart: OrganizationalChart instance to validate
            sector_code: Override sector code (optional)
            use_chained_validation: Whether to use chained validation
            
        Returns:
            ValidationResult: Complete validation results
        """
        if use_chained_validation:
            validator = ChainedValidator.create_for_organization(
                organizational_chart.organization
            )
        else:
            if sector_code:
                validator = ValidatorFactory.get_validator(sector_code)
            else:
                validator = ValidatorFactory.get_validator_for_organization(
                    organizational_chart.organization
                )
        
        return validator.validate(organizational_chart)
    
    @staticmethod
    def get_compliance_summary(organizational_chart) -> Dict[str, Any]:
        """
        Get compliance summary for organizational chart.
        
        Args:
            organizational_chart: OrganizationalChart instance
            
        Returns:
            Dict with compliance summary information
        """
        result = OrganizationalChartValidator.validate(organizational_chart)
        
        return {
            'is_compliant': result.is_valid,
            'compliance_score': (
                100 - (len(result.errors) * 10 + len(result.warnings) * 2)
            ) if result.errors or result.warnings else 100,
            'total_errors': len(result.errors),
            'critical_errors': len(result.get_critical_errors()),
            'total_warnings': len(result.warnings),
            'total_recommendations': len(result.recommendations),
            'last_validation': result.validation_timestamp,
            'validator_used': result.summary.get('validator_type', 'Unknown'),
            'sector_code': result.summary.get('sector_code', 'Unknown')
        }
    
    @staticmethod
    def get_validation_checklist(sector_code: str = None) -> List[Dict[str, Any]]:
        """
        Get validation checklist for sector.
        
        Args:
            sector_code: Sector code
            
        Returns:
            Validation checklist
        """
        return ValidatorFactory.get_validation_checklist(sector_code)
    
    @staticmethod
    def supports_sector(sector_code: str) -> bool:
        """Check if sector is supported for validation."""
        return ValidatorFactory.supports_sector(sector_code)