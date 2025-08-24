"""
Universal Validator for ISO 9001:2015 Compliance

This validator implements the universal base requirements from ISO 9001:2015
Clause 5.3 (Organizational roles, responsibilities and authorities) that apply
to all sectors and organizations regardless of their specific industry.

All sector-specific validators inherit from this universal base to ensure
consistent ISO 9001 compliance while adding their specialized requirements.
"""

from typing import Dict, List, Any
from .base import BaseValidator, ValidationResult


class UniversalValidator(BaseValidator):
    """
    Universal validator implementing ISO 9001:2015 Clause 5.3 requirements.
    
    This validator ensures compliance with:
    - Organizational roles and responsibilities are defined
    - Authorities are assigned and communicated
    - Responsibility and authority matrix (RACI) implementation
    - Top management involvement
    - Quality management system roles
    """
    
    def __init__(self):
        super().__init__(sector_code='UNIVERSAL')
    
    def initialize_rules(self):
        """Initialize ISO 9001:2015 validation rules."""
        self.validation_rules = {
            'iso_9001_5_3': {
                'title': 'Organizational roles, responsibilities and authorities',
                'requirement': 'ISO 9001:2015 Clause 5.3',
                'description': 'Top management shall ensure that responsibilities and authorities for relevant roles are assigned, communicated and understood throughout the organization.',
                'validation_points': [
                    'roles_defined',
                    'responsibilities_assigned',
                    'authorities_delegated',
                    'communication_established',
                    'understanding_verified'
                ]
            },
            'top_management': {
                'title': 'Top Management Requirements',
                'requirement': 'ISO 9001:2015 Clause 5.1',
                'mandatory_roles': [
                    'CEO_OR_GENERAL_DIRECTOR',
                    'QUALITY_MANAGER',
                    'TOP_MANAGEMENT_REPRESENTATIVE'
                ]
            },
            'quality_roles': {
                'title': 'Quality Management System Roles',
                'requirement': 'ISO 9001:2015 Clause 5.3',
                'mandatory_roles': [
                    'QUALITY_MANAGER',
                    'PROCESS_OWNERS',
                    'INTERNAL_AUDITORS'
                ]
            },
            'documentation': {
                'title': 'Documented Information',
                'requirement': 'ISO 9001:2015 Clause 7.5',
                'required_documents': [
                    'organization_chart',
                    'roles_responsibilities_matrix',
                    'authority_delegation_documents'
                ]
            }
        }
    
    def _validate_structure(self, organizational_chart, result: ValidationResult):
        """Validate organizational structure against ISO 9001:2015."""
        areas = organizational_chart.areas.filter(is_active=True)
        
        # Check hierarchy levels are appropriate (ISO 9001 doesn't specify, but best practice)
        if organizational_chart.hierarchy_levels < 3:
            result.add_warning(
                'ISO_MINIMAL_HIERARCHY',
                'La estructura organizacional tiene pocos niveles jerárquicos (recomendado: ≥3)',
                component='structure',
                details={
                    'current_levels': organizational_chart.hierarchy_levels,
                    'recommended_minimum': 3,
                    'iso_reference': '5.3'
                }
            )
        
        if organizational_chart.hierarchy_levels > 8:
            result.add_warning(
                'ISO_EXCESSIVE_HIERARCHY',
                'La estructura organizacional tiene demasiados niveles jerárquicos (recomendado: ≤8)',
                component='structure',
                details={
                    'current_levels': organizational_chart.hierarchy_levels,
                    'recommended_maximum': 8,
                    'iso_reference': '5.3'
                }
            )
        
        # Validate area purposes are defined (ISO 9001:2015 requires clear roles)
        for area in areas:
            if not area.main_purpose or not area.description:
                result.add_error(
                    'ISO_AREA_PURPOSE_UNDEFINED',
                    f'El área {area.name} no tiene propósito claramente definido',
                    component='structure',
                    details={
                        'area': area.name,
                        'iso_reference': '5.3',
                        'is_critical': True
                    }
                )
        
        # Check for top management representation
        self._validate_top_management_structure(organizational_chart, result)
    
    def _validate_top_management_structure(self, organizational_chart, result: ValidationResult):
        """Validate top management structure per ISO 9001."""
        areas = organizational_chart.areas.filter(is_active=True)
        top_level_areas = areas.filter(hierarchy_level=1)
        
        if not top_level_areas.exists():
            result.add_error(
                'ISO_NO_TOP_MANAGEMENT',
                'No se encontró estructura de alta dirección',
                component='structure',
                details={
                    'iso_reference': '5.1',
                    'is_critical': True
                }
            )
            return
        
        # Check for executive/board level
        has_executive_area = False
        for area in top_level_areas:
            if area.area_type in ['DIRECTION', 'BOARD']:
                has_executive_area = True
                break
        
        if not has_executive_area:
            result.add_warning(
                'ISO_NO_EXECUTIVE_AREA',
                'No se encontró área de dirección ejecutiva claramente definida',
                component='structure',
                details={'iso_reference': '5.1'}
            )
    
    def _validate_positions(self, organizational_chart, result: ValidationResult):
        """Validate position definitions against ISO 9001:2015."""
        mandatory_positions = self.get_mandatory_positions()
        
        # Check for mandatory quality roles
        self._validate_quality_roles(organizational_chart, result)
        
        # Validate position requirements are defined
        areas = organizational_chart.areas.filter(is_active=True)
        for area in areas:
            positions = area.positions.filter(is_active=True)
            
            for position in positions:
                # Check if position has clear main purpose (ISO 5.3 requirement)
                if not position.main_purpose:
                    result.add_error(
                        'ISO_POSITION_PURPOSE_UNDEFINED',
                        f'El cargo {position.name} no tiene propósito principal definido',
                        component='positions',
                        details={
                            'position': position.name,
                            'area': area.name,
                            'iso_reference': '5.3',
                            'is_critical': True
                        }
                    )
                
                # Check if position requirements are defined
                if not position.requirements or not isinstance(position.requirements, dict):
                    result.add_warning(
                        'ISO_POSITION_REQUIREMENTS_UNDEFINED',
                        f'El cargo {position.name} no tiene requisitos claramente definidos',
                        component='positions',
                        details={
                            'position': position.name,
                            'iso_reference': '5.3'
                        }
                    )
                else:
                    # Validate requirement completeness
                    required_requirement_keys = ['education', 'experience', 'competencies']
                    missing_keys = [key for key in required_requirement_keys 
                                   if key not in position.requirements]
                    
                    if missing_keys:
                        result.add_warning(
                            'ISO_INCOMPLETE_POSITION_REQUIREMENTS',
                            f'El cargo {position.name} tiene requisitos incompletos',
                            component='positions',
                            details={
                                'position': position.name,
                                'missing_requirements': missing_keys,
                                'iso_reference': '5.3'
                            }
                        )
    
    def _validate_quality_roles(self, organizational_chart, result: ValidationResult):
        """Validate mandatory quality management roles per ISO 9001."""
        areas = organizational_chart.areas.filter(is_active=True)
        all_positions = []
        
        for area in areas:
            all_positions.extend(area.positions.filter(is_active=True))
        
        # Check for Quality Manager or equivalent
        has_quality_manager = False
        for position in all_positions:
            position_type = position.position_type or ''
            if any(keyword in position_type.upper() for keyword in ['QUALITY', 'CALIDAD']):
                has_quality_manager = True
                break
            
            # Also check in position name
            if any(keyword in position.name.upper() for keyword in ['CALIDAD', 'QUALITY']):
                has_quality_manager = True
                break
        
        if not has_quality_manager:
            result.add_error(
                'ISO_NO_QUALITY_MANAGER',
                'No se encontró responsable de gestión de calidad',
                component='positions',
                details={
                    'iso_reference': '5.3',
                    'requirement': 'Designar responsable del sistema de gestión de calidad',
                    'is_critical': True
                }
            )
        
        # Check for Process Owners if organization uses process approach
        if organizational_chart.uses_raci_matrix:
            process_owners = [pos for pos in all_positions if pos.is_process_owner]
            if not process_owners:
                result.add_warning(
                    'ISO_NO_PROCESS_OWNERS',
                    'No se encontraron dueños de proceso definidos',
                    component='positions',
                    details={
                        'iso_reference': '4.4',
                        'recommendation': 'Definir dueños de proceso para enfoque por procesos'
                    }
                )
    
    def _validate_sector_specific(self, organizational_chart, result: ValidationResult):
        """
        Universal validator has no sector-specific requirements.
        This method is implemented as no-op for the base ISO 9001 validator.
        """
        pass
    
    def get_mandatory_committees(self) -> List[str]:
        """
        ISO 9001 doesn't mandate specific committees but recommends some.
        """
        return [
            'QUALITY_COMMITTEE',  # Recommended for quality management
        ]
    
    def get_mandatory_positions(self) -> List[Dict[str, Any]]:
        """Return mandatory positions per ISO 9001:2015."""
        return [
            {
                'position_type': 'CEO_OR_GENERAL_DIRECTOR',
                'name': 'Director General o CEO',
                'description': 'Máxima autoridad ejecutiva de la organización',
                'iso_reference': '5.1',
                'hierarchy_level': 'EXECUTIVE',
                'is_critical': True,
                'required_authorities': ['STRATEGIC_DECISIONS', 'QUALITY_POLICY_APPROVAL'],
                'min_quantity': 1,
                'max_quantity': 1
            },
            {
                'position_type': 'QUALITY_MANAGER',
                'name': 'Responsable de Calidad',
                'description': 'Responsable del sistema de gestión de calidad',
                'iso_reference': '5.3',
                'hierarchy_level': 'PROFESSIONAL',
                'is_critical': True,
                'required_responsibilities': [
                    'Asegurar conformidad del SGC con ISO 9001',
                    'Informar sobre desempeño del SGC',
                    'Promover enfoque al cliente'
                ],
                'min_quantity': 1
            },
            {
                'position_type': 'MANAGEMENT_REPRESENTATIVE',
                'name': 'Representante de la Dirección',
                'description': 'Representante de la dirección para el SGC',
                'iso_reference': '5.3',
                'hierarchy_level': 'SENIOR_MANAGEMENT',
                'is_critical': True,
                'required_authorities': ['QUALITY_SYSTEM_AUTHORITY'],
                'min_quantity': 1
            }
        ]
    
    def validate_raci_matrix(self, organizational_chart, result: ValidationResult):
        """
        Validate RACI matrix implementation for process responsibilities.
        Called separately if organization uses RACI matrix.
        """
        if not organizational_chart.uses_raci_matrix:
            return
        
        areas = organizational_chart.areas.filter(is_active=True)
        total_raci_responsibilities = 0
        
        for area in areas:
            positions = area.positions.filter(is_active=True)
            
            for position in positions:
                raci_responsibilities = position.responsibilities.filter(
                    is_active=True,
                    raci_role__isnull=False
                ).exclude(raci_role='')
                
                total_raci_responsibilities += raci_responsibilities.count()
                
                # Validate RACI role distribution
                raci_counts = {}
                for resp in raci_responsibilities:
                    raci_counts[resp.raci_role] = raci_counts.get(resp.raci_role, 0) + 1
                
                # Check for balanced RACI distribution
                if 'RESPONSIBLE' in raci_counts and raci_counts['RESPONSIBLE'] == 0:
                    result.add_warning(
                        'RACI_NO_RESPONSIBLE',
                        f'El cargo {position.name} no tiene responsabilidades tipo "Responsable"',
                        component='responsibilities',
                        details={
                            'position': position.name,
                            'iso_reference': '5.3'
                        }
                    )
        
        if total_raci_responsibilities == 0:
            result.add_error(
                'RACI_NOT_IMPLEMENTED',
                'El organigrama indica uso de matriz RACI pero no hay responsabilidades RACI definidas',
                component='responsibilities',
                details={
                    'iso_reference': '5.3',
                    'is_critical': False
                }
            )
    
    def validate_authority_delegation(self, organizational_chart, result: ValidationResult):
        """
        Validate authority delegation per ISO 9001:2015.
        """
        areas = organizational_chart.areas.filter(is_active=True)
        
        for area in areas:
            positions = area.positions.filter(is_active=True)
            
            for position in positions:
                authorities = position.authorities.filter(is_active=True)
                
                # Check if senior positions have defined authorities
                if position.hierarchy_level in ['EXECUTIVE', 'SENIOR_MANAGEMENT']:
                    if not authorities.exists():
                        result.add_error(
                            'ISO_SENIOR_NO_AUTHORITIES',
                            f'El cargo de nivel directivo {position.name} no tiene autoridades definidas',
                            component='authorities',
                            details={
                                'position': position.name,
                                'level': position.hierarchy_level,
                                'iso_reference': '5.3',
                                'is_critical': True
                            }
                        )
                
                # Validate authority scope and limitations
                for authority in authorities:
                    if not authority.scope:
                        result.add_warning(
                            'ISO_AUTHORITY_SCOPE_UNDEFINED',
                            f'La autoridad de {position.name} no tiene alcance definido',
                            component='authorities',
                            details={
                                'position': position.name,
                                'authority_type': authority.get_decision_type_display(),
                                'iso_reference': '5.3'
                            }
                        )
    
    def get_iso_compliance_checklist(self) -> List[Dict[str, Any]]:
        """
        Get ISO 9001:2015 specific compliance checklist.
        """
        return [
            {
                'clause': '5.1',
                'title': 'Liderazgo y compromiso',
                'requirements': [
                    'La alta dirección demuestra liderazgo y compromiso',
                    'Responsabilidad por la eficacia del SGC',
                    'Política y objetivos de calidad establecidos'
                ]
            },
            {
                'clause': '5.2',
                'title': 'Política de la calidad',
                'requirements': [
                    'Política de calidad apropiada al propósito',
                    'Compromiso de satisfacer requisitos',
                    'Compromiso de mejora continua'
                ]
            },
            {
                'clause': '5.3',
                'title': 'Roles, responsabilidades y autoridades',
                'requirements': [
                    'Responsabilidades y autoridades asignadas',
                    'Responsabilidades y autoridades comunicadas',
                    'Responsabilidades y autoridades entendidas',
                    'Designación de representante de la dirección'
                ]
            }
        ]