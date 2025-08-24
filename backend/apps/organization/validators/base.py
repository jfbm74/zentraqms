"""
Base Validator for Organizational Chart Validation System

This module provides the abstract base validator that defines the interface
for all sector-specific organizational chart validators.

The validation system follows ISO 9001:2015 Clause 5.3 as the universal base,
with sector-specific extensions for healthcare (SOGCS), education, manufacturing, etc.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class ValidationResult:
    """
    Encapsulates validation results with detailed reporting.
    """
    
    def __init__(self):
        self.is_valid = True
        self.errors = []
        self.warnings = []
        self.recommendations = []
        self.summary = {}
        self.validation_timestamp = timezone.now()
    
    def add_error(self, code: str, message: str, component: str = None, details: Dict = None):
        """Add a validation error."""
        self.is_valid = False
        error = {
            'code': code,
            'message': message,
            'severity': 'ERROR',
            'component': component,
            'details': details or {},
            'timestamp': timezone.now()
        }
        self.errors.append(error)
    
    def add_warning(self, code: str, message: str, component: str = None, details: Dict = None):
        """Add a validation warning."""
        warning = {
            'code': code,
            'message': message,
            'severity': 'WARNING',
            'component': component,
            'details': details or {},
            'timestamp': timezone.now()
        }
        self.warnings.append(warning)
    
    def add_recommendation(self, code: str, message: str, component: str = None, details: Dict = None):
        """Add a validation recommendation."""
        recommendation = {
            'code': code,
            'message': message,
            'severity': 'RECOMMENDATION',
            'component': component,
            'details': details or {},
            'timestamp': timezone.now()
        }
        self.recommendations.append(recommendation)
    
    def get_critical_errors(self):
        """Get errors marked as critical."""
        return [error for error in self.errors if error.get('details', {}).get('is_critical', False)]
    
    def has_critical_errors(self):
        """Check if there are critical errors."""
        return len(self.get_critical_errors()) > 0
    
    def to_dict(self):
        """Convert validation results to dictionary."""
        return {
            'is_valid': self.is_valid,
            'validation_timestamp': self.validation_timestamp.isoformat(),
            'summary': {
                'total_errors': len(self.errors),
                'total_warnings': len(self.warnings),
                'total_recommendations': len(self.recommendations),
                'critical_errors': len(self.get_critical_errors()),
                'complies_with_regulations': self.is_valid and not self.has_critical_errors(),
                **self.summary
            },
            'errors': self.errors,
            'warnings': self.warnings,
            'recommendations': self.recommendations
        }


class BaseValidator(ABC):
    """
    Abstract base validator for organizational charts.
    
    All sector-specific validators must inherit from this class and implement
    the required validation methods.
    """
    
    def __init__(self, sector_code: str = None):
        self.sector_code = sector_code
        self.validation_rules = {}
        self.initialize_rules()
    
    @abstractmethod
    def initialize_rules(self):
        """
        Initialize validation rules specific to this validator.
        Must be implemented by subclasses.
        """
        pass
    
    def validate(self, organizational_chart) -> ValidationResult:
        """
        Main validation entry point.
        
        Args:
            organizational_chart: OrganizationalChart instance to validate
            
        Returns:
            ValidationResult: Complete validation results
        """
        result = ValidationResult()
        
        try:
            # Pre-validation checks
            if not self._pre_validate(organizational_chart, result):
                return result
            
            # Core validation components
            self._validate_structure(organizational_chart, result)
            self._validate_positions(organizational_chart, result)
            self._validate_committees(organizational_chart, result)
            self._validate_assignments(organizational_chart, result)
            self._validate_authorities(organizational_chart, result)
            self._validate_responsibilities(organizational_chart, result)
            self._validate_compliance(organizational_chart, result)
            
            # Sector-specific validations
            self._validate_sector_specific(organizational_chart, result)
            
            # Post-validation processing
            self._post_validate(organizational_chart, result)
            
        except Exception as e:
            result.add_error(
                'VALIDATION_ERROR',
                f"Error durante la validación: {str(e)}",
                component='validator',
                details={'is_critical': True, 'exception': str(e)}
            )
        
        return result
    
    def _pre_validate(self, organizational_chart, result: ValidationResult) -> bool:
        """
        Pre-validation checks to ensure the chart can be validated.
        
        Returns:
            bool: True if validation can continue, False otherwise
        """
        if not organizational_chart:
            result.add_error(
                'NULL_CHART',
                'El organigrama no puede ser nulo',
                component='chart',
                details={'is_critical': True}
            )
            return False
        
        if not organizational_chart.is_active:
            result.add_warning(
                'INACTIVE_CHART',
                'El organigrama no está activo',
                component='chart'
            )
        
        # Check if chart has areas
        if not organizational_chart.areas.filter(is_active=True).exists():
            result.add_error(
                'NO_AREAS',
                'El organigrama debe tener al menos un área',
                component='structure',
                details={'is_critical': True}
            )
            return False
        
        return True
    
    @abstractmethod
    def _validate_structure(self, organizational_chart, result: ValidationResult):
        """
        Validate organizational structure.
        Must be implemented by subclasses.
        """
        pass
    
    @abstractmethod
    def _validate_positions(self, organizational_chart, result: ValidationResult):
        """
        Validate position definitions.
        Must be implemented by subclasses.
        """
        pass
    
    def _validate_committees(self, organizational_chart, result: ValidationResult):
        """
        Validate committee structure.
        Base implementation - can be overridden by subclasses.
        """
        committees = organizational_chart.committees.filter(is_active=True)
        
        # Check for mandatory committees based on sector
        mandatory_committees = self.get_mandatory_committees()
        existing_committee_types = set(
            committee.code for committee in committees
        )
        
        for mandatory_committee in mandatory_committees:
            if mandatory_committee not in existing_committee_types:
                result.add_error(
                    'MISSING_MANDATORY_COMMITTEE',
                    f'Falta el comité obligatorio: {mandatory_committee}',
                    component='committees',
                    details={
                        'missing_committee': mandatory_committee,
                        'is_critical': True
                    }
                )
        
        # Validate committee composition
        for committee in committees:
            self._validate_committee_composition(committee, result)
    
    def _validate_committee_composition(self, committee, result: ValidationResult):
        """Validate individual committee composition."""
        active_members = committee.get_active_members()
        
        # Check minimum quorum
        if active_members.count() < committee.minimum_quorum:
            result.add_error(
                'INSUFFICIENT_COMMITTEE_MEMBERS',
                f'El comité {committee.name} no tiene suficientes miembros activos',
                component='committees',
                details={
                    'committee': committee.name,
                    'required': committee.minimum_quorum,
                    'current': active_members.count(),
                    'is_critical': committee.committee_type == 'MANDATORY'
                }
            )
        
        # Check if committee has chairperson and secretary
        if not committee.chairperson:
            result.add_error(
                'NO_COMMITTEE_CHAIR',
                f'El comité {committee.name} no tiene presidente asignado',
                component='committees',
                details={'committee': committee.name, 'is_critical': True}
            )
        
        if not committee.secretary:
            result.add_error(
                'NO_COMMITTEE_SECRETARY',
                f'El comité {committee.name} no tiene secretario asignado',
                component='committees',
                details={'committee': committee.name, 'is_critical': True}
            )
    
    def _validate_assignments(self, organizational_chart, result: ValidationResult):
        """
        Validate position assignments.
        Base implementation - can be overridden by subclasses.
        """
        areas = organizational_chart.areas.filter(is_active=True)
        
        for area in areas:
            positions = area.positions.filter(is_active=True)
            
            for position in positions:
                self._validate_position_assignment(position, result)
    
    def _validate_position_assignment(self, position, result: ValidationResult):
        """Validate individual position assignment."""
        active_assignments = position.get_current_assignments()
        
        # Check critical positions are filled
        if position.is_critical and not active_assignments.exists():
            result.add_error(
                'CRITICAL_POSITION_VACANT',
                f'El cargo crítico {position.name} está vacante',
                component='assignments',
                details={
                    'position': position.name,
                    'area': position.area.name,
                    'is_critical': True
                }
            )
        
        # Check for over-assignment
        if active_assignments.count() > position.authorized_positions:
            result.add_warning(
                'POSITION_OVER_ASSIGNED',
                f'El cargo {position.name} tiene más asignaciones que plazas autorizadas',
                component='assignments',
                details={
                    'position': position.name,
                    'authorized': position.authorized_positions,
                    'assigned': active_assignments.count()
                }
            )
    
    def _validate_authorities(self, organizational_chart, result: ValidationResult):
        """
        Validate authority definitions.
        Base implementation - can be overridden by subclasses.
        """
        areas = organizational_chart.areas.filter(is_active=True)
        
        for area in areas:
            positions = area.positions.filter(is_active=True)
            
            for position in positions:
                authorities = position.authorities.filter(is_active=True)
                
                # Check if senior positions have appropriate authorities
                if position.hierarchy_level in ['EXECUTIVE', 'SENIOR_MANAGEMENT'] and not authorities.exists():
                    result.add_warning(
                        'SENIOR_POSITION_NO_AUTHORITIES',
                        f'El cargo de nivel directivo {position.name} no tiene autoridades definidas',
                        component='authorities',
                        details={'position': position.name, 'level': position.hierarchy_level}
                    )
    
    def _validate_responsibilities(self, organizational_chart, result: ValidationResult):
        """
        Validate responsibility definitions.
        Base implementation - can be overridden by subclasses.
        """
        areas = organizational_chart.areas.filter(is_active=True)
        
        for area in areas:
            positions = area.positions.filter(is_active=True)
            
            for position in positions:
                responsibilities = position.responsibilities.filter(is_active=True)
                
                # Check if positions have defined responsibilities
                if not responsibilities.exists():
                    result.add_warning(
                        'POSITION_NO_RESPONSIBILITIES',
                        f'El cargo {position.name} no tiene responsabilidades definidas',
                        component='responsibilities',
                        details={'position': position.name}
                    )
                
                # Check for normative responsibilities
                normative_responsibilities = responsibilities.filter(is_normative_requirement=True)
                if normative_responsibilities.exists():
                    for resp in normative_responsibilities:
                        if not resp.normative_reference:
                            result.add_warning(
                                'NORMATIVE_RESPONSIBILITY_NO_REFERENCE',
                                f'La responsabilidad normativa de {position.name} no tiene referencia',
                                component='responsibilities',
                                details={'position': position.name, 'responsibility': resp.description[:100]}
                            )
    
    def _validate_compliance(self, organizational_chart, result: ValidationResult):
        """
        Validate regulatory compliance.
        Base implementation - can be overridden by subclasses.
        """
        # Check if chart has been validated recently
        if organizational_chart.last_validation_date:
            days_since_validation = (timezone.now().date() - organizational_chart.last_validation_date.date()).days
            if days_since_validation > 365:  # 1 year
                result.add_warning(
                    'OUTDATED_VALIDATION',
                    'El organigrama no ha sido validado en el último año',
                    component='compliance',
                    details={'days_since_validation': days_since_validation}
                )
        else:
            result.add_warning(
                'NO_PREVIOUS_VALIDATION',
                'El organigrama no tiene registro de validación previa',
                component='compliance'
            )
    
    @abstractmethod
    def _validate_sector_specific(self, organizational_chart, result: ValidationResult):
        """
        Validate sector-specific requirements.
        Must be implemented by subclasses.
        """
        pass
    
    def _post_validate(self, organizational_chart, result: ValidationResult):
        """
        Post-validation processing.
        Can be overridden by subclasses.
        """
        # Update summary statistics
        result.summary.update({
            'validator_type': self.__class__.__name__,
            'sector_code': self.sector_code,
            'total_areas': organizational_chart.areas.filter(is_active=True).count(),
            'total_positions': sum(
                area.positions.filter(is_active=True).count() 
                for area in organizational_chart.areas.filter(is_active=True)
            ),
            'total_committees': organizational_chart.committees.filter(is_active=True).count(),
            'validation_rules_applied': len(self.validation_rules)
        })
    
    # Abstract methods that must be implemented by subclasses
    
    @abstractmethod
    def get_mandatory_committees(self) -> List[str]:
        """
        Return list of mandatory committee codes for this sector.
        """
        pass
    
    @abstractmethod
    def get_mandatory_positions(self) -> List[Dict[str, Any]]:
        """
        Return list of mandatory position definitions for this sector.
        """
        pass
    
    def get_validation_rules(self) -> Dict[str, Any]:
        """
        Get all validation rules for this validator.
        """
        return self.validation_rules.copy()
    
    def supports_sector(self, sector_code: str) -> bool:
        """
        Check if this validator supports the given sector.
        """
        return self.sector_code == sector_code or sector_code in getattr(self, 'supported_sectors', [])
    
    def get_validation_checklist(self) -> List[Dict[str, Any]]:
        """
        Get checklist of validation items for this sector.
        """
        return [
            {
                'category': 'Estructura Organizacional',
                'items': [
                    'Jerarquía definida correctamente',
                    'Áreas con propósitos claros',
                    'Niveles jerárquicos apropiados'
                ]
            },
            {
                'category': 'Cargos y Posiciones',
                'items': [
                    'Cargos críticos identificados',
                    'Requisitos de cargos definidos',
                    'Autoridades asignadas apropiadamente'
                ]
            },
            {
                'category': 'Comités Institucionales',
                'items': [
                    'Comités obligatorios presentes',
                    'Composición adecuada',
                    'Presidentes y secretarios asignados'
                ]
            },
            {
                'category': 'Responsabilidades',
                'items': [
                    'Responsabilidades definidas por cargo',
                    'Referencias normativas incluidas',
                    'Matriz RACI implementada'
                ]
            },
            {
                'category': 'Cumplimiento Normativo',
                'items': [
                    'Requisitos sectoriales cumplidos',
                    'Validación periódica realizada',
                    'Documentación actualizada'
                ]
            }
        ]