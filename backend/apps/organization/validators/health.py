"""
Health Validator for SOGCS and Colombian Health Sector Compliance

This validator implements specific requirements for Colombian health institutions
based on SOGCS (Sistema Obligatorio de Garantía de Calidad en Salud) and other
health sector regulations including:

- Resolution 2003 of 2014 (Quality procedures)
- Resolution 429 of 2016 (PAMEC)
- Decree 1011 of 2006 (Quality system)
- Law 1164 of 2007 (Human talent in health)

Inherits from UniversalValidator to maintain ISO 9001:2015 compliance while
adding health-specific requirements.
"""

from typing import Dict, List, Any
from .universal import UniversalValidator
from .base import ValidationResult


class HealthValidator(UniversalValidator):
    """
    Health sector validator implementing SOGCS requirements.
    
    This validator ensures compliance with Colombian health regulations
    while maintaining ISO 9001:2015 universal requirements.
    """
    
    def __init__(self):
        # Initialize with health sector code
        super().__init__()
        self.sector_code = 'HEALTH'
        self.supported_sectors = ['HEALTH', 'SALUD']
        
        # Add health-specific rules to existing universal rules
        self.initialize_health_rules()
    
    def initialize_health_rules(self):
        """Initialize SOGCS and health-specific validation rules."""
        # Add to existing universal rules
        self.validation_rules.update({
            'sogcs_pamec': {
                'title': 'Programa de Auditoría para el Mejoramiento de la Calidad (PAMEC)',
                'requirement': 'Resolución 429 de 2016',
                'mandatory_committees': [
                    'QUALITY_COMMITTEE',
                    'PATIENT_SAFETY_COMMITTEE',
                    'MEDICAL_HISTORY_COMMITTEE',
                    'INFECTION_CONTROL_COMMITTEE'
                ]
            },
            'patient_safety': {
                'title': 'Política de Seguridad del Paciente',
                'requirement': 'Resolución 2003 de 2014',
                'mandatory_positions': [
                    'PATIENT_SAFETY_OFFICER',
                    'MEDICAL_DIRECTOR',
                    'NURSING_DIRECTOR'
                ]
            },
            'medical_staff': {
                'title': 'Talento Humano en Salud',
                'requirement': 'Ley 1164 de 2007',
                'professional_requirements': [
                    'professional_license',
                    'registry_rethus',
                    'continuing_education'
                ]
            },
            'clinical_governance': {
                'title': 'Gobierno Clínico',
                'requirement': 'Decreto 1011 de 2006',
                'mandatory_structures': [
                    'MEDICAL_COMMITTEE',
                    'NURSING_COMMITTEE',
                    'ETHICS_COMMITTEE'
                ]
            },
            'health_services': {
                'title': 'Servicios de Salud Habilitados',
                'requirement': 'Resolución 3100 de 2019',
                'validation_requirements': [
                    'service_habilitation',
                    'responsible_professional',
                    'service_protocols'
                ]
            }
        })
    
    def _validate_structure(self, organizational_chart, result: ValidationResult):
        """Validate health sector organizational structure."""
        # First run universal structure validation
        super()._validate_structure(organizational_chart, result)
        
        # Then add health-specific validations
        self._validate_health_governance_structure(organizational_chart, result)
        self._validate_clinical_areas(organizational_chart, result)
        
    def _validate_health_governance_structure(self, organizational_chart, result: ValidationResult):
        """Validate clinical governance structure per SOGCS."""
        areas = organizational_chart.areas.filter(is_active=True)
        
        # Check for mandatory clinical governance areas
        required_clinical_areas = ['MEDICAL_DIRECTION', 'NURSING_DIRECTION', 'QUALITY_DIRECTION']
        existing_area_types = set(area.area_type for area in areas)
        
        has_medical_direction = any(
            'MED' in area.name.upper() or 'MÉDIC' in area.name.upper() 
            for area in areas.filter(area_type__in=['DIRECTION', 'SUBDIRECTION'])
        )
        
        if not has_medical_direction:
            result.add_error(
                'SOGCS_NO_MEDICAL_DIRECTION',
                'No se encontró dirección médica o área médica directiva',
                component='structure',
                details={
                    'sogcs_reference': 'Decreto 1011 de 2006',
                    'is_critical': True
                }
            )
        
        # Check for quality management area
        has_quality_area = any(
            'CALIDAD' in area.name.upper() or 'QUALITY' in area.name.upper()
            for area in areas
        )
        
        if not has_quality_area:
            result.add_error(
                'SOGCS_NO_QUALITY_AREA',
                'No se encontró área de gestión de calidad',
                component='structure',
                details={
                    'sogcs_reference': 'Resolución 429 de 2016 - PAMEC',
                    'is_critical': True
                }
            )
    
    def _validate_clinical_areas(self, organizational_chart, result: ValidationResult):
        """Validate clinical service areas and their requirements."""
        # Get health services through service integration
        service_integrations = getattr(organizational_chart.organization, 'service_integrations', None)
        
        if service_integrations:
            active_integrations = service_integrations.filter(
                operational_status='ACTIVE',
                is_active=True
            )
            
            for integration in active_integrations:
                if integration.health_service:  # Has health service mapping
                    self._validate_health_service_integration(integration, result)
    
    def _validate_health_service_integration(self, integration, result: ValidationResult):
        """Validate individual health service integration."""
        health_service = integration.health_service
        
        # Check if service has responsible area
        if not integration.responsible_area:
            result.add_error(
                'SOGCS_SERVICE_NO_RESPONSIBLE_AREA',
                f'El servicio {health_service.nombre} no tiene área responsable asignada',
                component='health_services',
                details={
                    'service': health_service.nombre,
                    'sogcs_reference': 'Resolución 3100 de 2019',
                    'is_critical': True
                }
            )
        
        # Check if service has responsible position
        if not integration.responsible_position:
            result.add_warning(
                'SOGCS_SERVICE_NO_RESPONSIBLE_POSITION',
                f'El servicio {health_service.nombre} no tiene cargo responsable específico',
                component='health_services',
                details={
                    'service': health_service.nombre,
                    'sogcs_reference': 'Resolución 3100 de 2019'
                }
            )
        elif integration.responsible_position:
            # Validate professional requirements for health service leader
            position = integration.responsible_position
            if not position.requires_professional_license:
                result.add_error(
                    'SOGCS_SERVICE_LEADER_NO_LICENSE',
                    f'El responsable del servicio {health_service.nombre} debe requerir tarjeta profesional',
                    component='health_services',
                    details={
                        'service': health_service.nombre,
                        'position': position.name,
                        'sogcs_reference': 'Ley 1164 de 2007',
                        'is_critical': True
                    }
                )
    
    def _validate_positions(self, organizational_chart, result: ValidationResult):
        """Validate health sector position requirements."""
        # First run universal position validation
        super()._validate_positions(organizational_chart, result)
        
        # Then add health-specific validations
        self._validate_health_professional_positions(organizational_chart, result)
        self._validate_mandatory_health_positions(organizational_chart, result)
    
    def _validate_health_professional_positions(self, organizational_chart, result: ValidationResult):
        """Validate health professional position requirements."""
        areas = organizational_chart.areas.filter(is_active=True)
        
        for area in areas:
            positions = area.positions.filter(is_active=True)
            
            for position in positions:
                # Check if health-related positions require professional license
                if self._is_health_professional_position(position):
                    if not position.requires_professional_license:
                        result.add_error(
                            'SOGCS_HEALTH_POSITION_NO_LICENSE_REQ',
                            f'El cargo de salud {position.name} debe requerir tarjeta profesional',
                            component='positions',
                            details={
                                'position': position.name,
                                'area': area.name,
                                'sogcs_reference': 'Ley 1164 de 2007',
                                'is_critical': True
                            }
                        )
                    
                    # Validate professional requirements are defined
                    if position.requirements:
                        licenses = position.requirements.get('licenses', [])
                        if not any('profesional' in lic.lower() or 'rethus' in lic.lower() for lic in licenses):
                            result.add_warning(
                                'SOGCS_MISSING_PROFESSIONAL_REQUIREMENTS',
                                f'El cargo {position.name} no especifica tarjeta profesional en requisitos',
                                component='positions',
                                details={
                                    'position': position.name,
                                    'sogcs_reference': 'Ley 1164 de 2007'
                                }
                            )
    
    def _is_health_professional_position(self, position):
        """Check if position is a health professional role."""
        health_keywords = [
            'médico', 'doctor', 'enfermera', 'enfermero', 'odontólogo', 'dentista',
            'psicólogo', 'fisioterapeuta', 'nutricionista', 'farmaceuta', 'laboratorista',
            'radiologist', 'anestesiólogo', 'cirujano', 'especialista', 'residente',
            'interno', 'bacteriólogo', 'terapia', 'medicina'
        ]
        
        position_name_lower = position.name.lower()
        position_type_lower = (position.position_type or '').lower()
        
        return any(keyword in position_name_lower or keyword in position_type_lower 
                  for keyword in health_keywords)
    
    def _validate_mandatory_health_positions(self, organizational_chart, result: ValidationResult):
        """Validate mandatory positions for health institutions."""
        mandatory_positions = self.get_mandatory_positions()
        areas = organizational_chart.areas.filter(is_active=True)
        all_positions = []
        
        for area in areas:
            all_positions.extend(area.positions.filter(is_active=True))
        
        # Check for Medical Director
        has_medical_director = any(
            self._is_medical_director_position(pos) for pos in all_positions
        )
        
        if not has_medical_director:
            result.add_error(
                'SOGCS_NO_MEDICAL_DIRECTOR',
                'No se encontró Director Médico o cargo equivalente',
                component='positions',
                details={
                    'sogcs_reference': 'Decreto 1011 de 2006',
                    'is_critical': True
                }
            )
        
        # Check for Patient Safety Officer
        has_patient_safety_officer = any(
            'seguridad' in pos.name.lower() and 'paciente' in pos.name.lower()
            for pos in all_positions
        )
        
        if not has_patient_safety_officer:
            result.add_error(
                'SOGCS_NO_PATIENT_SAFETY_OFFICER',
                'No se encontró responsable de seguridad del paciente',
                component='positions',
                details={
                    'sogcs_reference': 'Resolución 2003 de 2014',
                    'is_critical': True
                }
            )
        
        # Check for Quality Manager (specific to health)
        has_health_quality_manager = any(
            'calidad' in pos.name.lower() and any(
                health_word in pos.name.lower() 
                for health_word in ['salud', 'médica', 'clínica', 'asistencial']
            )
            for pos in all_positions
        )
        
        if not has_health_quality_manager:
            result.add_warning(
                'SOGCS_NO_HEALTH_QUALITY_MANAGER',
                'No se encontró responsable específico de calidad en salud',
                component='positions',
                details={'sogcs_reference': 'Resolución 429 de 2016 - PAMEC'}
            )
    
    def _is_medical_director_position(self, position):
        """Check if position is a Medical Director role."""
        name_lower = position.name.lower()
        return (
            ('director' in name_lower or 'jefe' in name_lower) and 
            ('médico' in name_lower or 'clínico' in name_lower or 'asistencial' in name_lower)
        )
    
    def _validate_committees(self, organizational_chart, result: ValidationResult):
        """Validate health sector committee requirements."""
        # First run universal committee validation
        super()._validate_committees(organizational_chart, result)
        
        # Then add health-specific committee validations
        committees = organizational_chart.committees.filter(is_active=True)
        committee_codes = set(committee.code for committee in committees)
        committee_names_lower = set(committee.name.lower() for committee in committees)
        
        # Check for SOGCS mandatory committees
        mandatory_health_committees = self.get_mandatory_committees()
        
        # Patient Safety Committee
        if not any('seguridad' in name and 'paciente' in name for name in committee_names_lower):
            result.add_error(
                'SOGCS_NO_PATIENT_SAFETY_COMMITTEE',
                'Falta el Comité de Seguridad del Paciente',
                component='committees',
                details={
                    'sogcs_reference': 'Resolución 2003 de 2014',
                    'is_critical': True
                }
            )
        
        # Quality Committee (PAMEC)
        if not any('calidad' in name for name in committee_names_lower):
            result.add_error(
                'SOGCS_NO_QUALITY_COMMITTEE',
                'Falta el Comité de Calidad (requerido por PAMEC)',
                component='committees',
                details={
                    'sogcs_reference': 'Resolución 429 de 2016',
                    'is_critical': True
                }
            )
        
        # Medical History Committee
        if not any('historia' in name and 'clínica' in name for name in committee_names_lower):
            result.add_warning(
                'SOGCS_NO_MEDICAL_HISTORY_COMMITTEE',
                'Se recomienda Comité de Historias Clínicas',
                component='committees',
                details={'sogcs_reference': 'Resolución 1995 de 1999'}
            )
        
        # Infection Control Committee (for hospitals)
        organization_type = organizational_chart.organization_type.lower()
        if 'hospital' in organization_type or 'clínica' in organization_type:
            if not any('infección' in name or 'infeccion' in name for name in committee_names_lower):
                result.add_warning(
                    'SOGCS_NO_INFECTION_CONTROL_COMMITTEE',
                    'Se recomienda Comité de Infecciones para hospitales y clínicas',
                    component='committees',
                    details={'sogcs_reference': 'Decreto 1011 de 2006'}
                )
    
    def _validate_sector_specific(self, organizational_chart, result: ValidationResult):
        """Validate SOGCS-specific requirements."""
        
        # Validate PAMEC implementation
        self._validate_pamec_implementation(organizational_chart, result)
        
        # Validate patient safety policy implementation
        self._validate_patient_safety_implementation(organizational_chart, result)
        
        # Validate health service habilitation requirements
        self._validate_health_service_habilitation(organizational_chart, result)
    
    def _validate_pamec_implementation(self, organizational_chart, result: ValidationResult):
        """Validate PAMEC (Quality Audit Program) implementation."""
        # Check if quality area exists and has appropriate structure
        areas = organizational_chart.areas.filter(is_active=True)
        quality_area = None
        
        for area in areas:
            if 'calidad' in area.name.lower():
                quality_area = area
                break
        
        if quality_area:
            # Check if quality area has internal audit function
            quality_positions = quality_area.positions.filter(is_active=True)
            has_internal_auditor = any(
                'audit' in pos.name.lower() or 'auditor' in pos.name.lower()
                for pos in quality_positions
            )
            
            if not has_internal_auditor:
                result.add_warning(
                    'PAMEC_NO_INTERNAL_AUDITOR',
                    'El área de calidad no tiene auditor interno definido',
                    component='pamec',
                    details={
                        'sogcs_reference': 'Resolución 429 de 2016',
                        'recommendation': 'Definir responsable de auditoría interna'
                    }
                )
        else:
            result.add_error(
                'PAMEC_NO_QUALITY_AREA',
                'No se encontró área de calidad para implementación de PAMEC',
                component='pamec',
                details={
                    'sogcs_reference': 'Resolución 429 de 2016',
                    'is_critical': True
                }
            )
    
    def _validate_patient_safety_implementation(self, organizational_chart, result: ValidationResult):
        """Validate patient safety policy implementation."""
        # Check if there are positions with patient safety responsibilities
        areas = organizational_chart.areas.filter(is_active=True)
        has_patient_safety_responsibilities = False
        
        for area in areas:
            positions = area.positions.filter(is_active=True)
            for position in positions:
                responsibilities = position.responsibilities.filter(is_active=True)
                if any('seguridad' in resp.description.lower() and 'paciente' in resp.description.lower()
                       for resp in responsibilities):
                    has_patient_safety_responsibilities = True
                    break
            if has_patient_safety_responsibilities:
                break
        
        if not has_patient_safety_responsibilities:
            result.add_warning(
                'PATIENT_SAFETY_NO_RESPONSIBILITIES',
                'No se encontraron responsabilidades específicas de seguridad del paciente',
                component='patient_safety',
                details={
                    'sogcs_reference': 'Resolución 2003 de 2014',
                    'recommendation': 'Definir responsabilidades específicas de seguridad del paciente'
                }
            )
    
    def _validate_health_service_habilitation(self, organizational_chart, result: ValidationResult):
        """Validate health service habilitation requirements."""
        # This would integrate with the health services model
        # For now, we validate basic structure requirements
        
        organization = organizational_chart.organization
        if hasattr(organization, 'health_organization'):
            health_org = organization.health_organization
            
            # Check if services have responsible professionals
            if hasattr(health_org, 'health_services'):
                services = health_org.health_services.filter(is_active=True)
                for service in services:
                    # Check if service has assigned responsible positions
                    responsible_positions = service.responsible_positions.filter(is_active=True)
                    if not responsible_positions.exists():
                        result.add_warning(
                            'HEALTH_SERVICE_NO_RESPONSIBLE',
                            f'El servicio {service.nombre} no tiene profesional responsable asignado',
                            component='health_services',
                            details={
                                'service': service.nombre,
                                'sogcs_reference': 'Resolución 3100 de 2019'
                            }
                        )
    
    def get_mandatory_committees(self) -> List[str]:
        """Return mandatory committees for health sector per SOGCS."""
        universal_committees = super().get_mandatory_committees()
        
        health_committees = [
            'PATIENT_SAFETY_COMMITTEE',     # Resolución 2003 de 2014
            'QUALITY_COMMITTEE',            # Resolución 429 de 2016 (PAMEC)
            'MEDICAL_HISTORY_COMMITTEE',    # Resolución 1995 de 1999
            'INFECTION_CONTROL_COMMITTEE',  # Decree 1011 de 2006
            'MEDICAL_COMMITTEE',            # Clinical governance
            'NURSING_COMMITTEE',            # Nursing governance
            'ETHICS_COMMITTEE',             # Clinical ethics
            'TRANSFUSION_COMMITTEE',        # Blood transfusion (if applicable)
            'PHARMACY_COMMITTEE',           # Medication management
        ]
        
        return universal_committees + health_committees
    
    def get_mandatory_positions(self) -> List[Dict[str, Any]]:
        """Return mandatory positions for health sector per SOGCS."""
        universal_positions = super().get_mandatory_positions()
        
        health_positions = [
            {
                'position_type': 'MEDICAL_DIRECTOR',
                'name': 'Director Médico',
                'description': 'Director médico o científico de la institución',
                'sogcs_reference': 'Decreto 1011 de 2006',
                'hierarchy_level': 'SENIOR_MANAGEMENT',
                'is_critical': True,
                'required_qualifications': [
                    'Título profesional en Medicina',
                    'Tarjeta profesional médica vigente',
                    'Experiencia en gestión de servicios de salud'
                ],
                'required_licenses': ['Tarjeta profesional médica', 'Registro RETHUS'],
                'min_quantity': 1
            },
            {
                'position_type': 'PATIENT_SAFETY_OFFICER',
                'name': 'Responsable de Seguridad del Paciente',
                'description': 'Responsable de la política de seguridad del paciente',
                'sogcs_reference': 'Resolución 2003 de 2014',
                'hierarchy_level': 'PROFESSIONAL',
                'is_critical': True,
                'required_qualifications': [
                    'Profesional de la salud',
                    'Capacitación en seguridad del paciente'
                ],
                'min_quantity': 1
            },
            {
                'position_type': 'NURSING_DIRECTOR',
                'name': 'Director de Enfermería',
                'description': 'Director del departamento de enfermería',
                'sogcs_reference': 'Ley 266 de 1996',
                'hierarchy_level': 'SENIOR_MANAGEMENT',
                'is_critical': True,
                'required_qualifications': [
                    'Título profesional en Enfermería',
                    'Tarjeta profesional de enfermería vigente'
                ],
                'required_licenses': ['Tarjeta profesional enfermería', 'Registro RETHUS'],
                'min_quantity': 1
            },
            {
                'position_type': 'QUALITY_COORDINATOR',
                'name': 'Coordinador de Calidad',
                'description': 'Coordinador del sistema de gestión de calidad en salud',
                'sogcs_reference': 'Resolución 429 de 2016',
                'hierarchy_level': 'PROFESSIONAL',
                'is_critical': True,
                'required_qualifications': [
                    'Profesional en salud o administración',
                    'Capacitación en sistemas de calidad'
                ],
                'min_quantity': 1
            }
        ]
        
        return universal_positions + health_positions
    
    def get_sogcs_compliance_checklist(self) -> List[Dict[str, Any]]:
        """
        Get SOGCS-specific compliance checklist.
        """
        return [
            {
                'regulation': 'Decreto 1011 de 2006',
                'title': 'Sistema Obligatorio de Garantía de Calidad',
                'requirements': [
                    'Sistema de habilitación implementado',
                    'Auditoría para mejoramiento implementada',
                    'Sistema de acreditación (opcional)',
                    'Sistema de información para la calidad'
                ]
            },
            {
                'regulation': 'Resolución 2003 de 2014',
                'title': 'Procedimientos de Seguridad del Paciente',
                'requirements': [
                    'Política de seguridad del paciente',
                    'Programa de seguridad del paciente',
                    'Comité de seguridad del paciente',
                    'Responsable de seguridad del paciente'
                ]
            },
            {
                'regulation': 'Resolución 429 de 2016',
                'title': 'PAMEC - Programa de Auditoría',
                'requirements': [
                    'Programa de auditoría definido',
                    'Comité de calidad funcionando',
                    'Plan de mejoramiento implementado',
                    'Seguimiento a indicadores de calidad'
                ]
            },
            {
                'regulation': 'Ley 1164 de 2007',
                'title': 'Talento Humano en Salud',
                'requirements': [
                    'Profesionales con tarjeta profesional vigente',
                    'Registro en RETHUS actualizado',
                    'Educación continuada documentada',
                    'Evaluación de competencias'
                ]
            }
        ]