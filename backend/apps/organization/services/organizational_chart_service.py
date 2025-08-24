"""
Business Logic Services for Organizational Chart management in ZentraQMS.

This module contains services for:
- Organizational chart validation
- Template generation and management
- Compliance verification
- Version management
- Performance optimization
"""

import logging
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta
from django.db import transaction, models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from ..models.organizational_chart import (
    Sector, SectorNormativa, PlantillaOrganigrama, OrganizationalChart
)
from ..models.organizational_structure import (
    Area, ServiceAreaAssignment, Cargo, Responsabilidad, Autoridad
)
from ..models import Organization

User = get_user_model()
logger = logging.getLogger(__name__)


class OrganizationalChartValidationService:
    """
    Service for validating organizational charts against sector requirements.
    
    Provides comprehensive validation including:
    - Structural validation
    - Compliance with sector requirements
    - Completeness validation
    - Consistency checks
    """
    
    @staticmethod
    def validate_chart(chart: OrganizationalChart, validation_types: List[str] = None) -> Dict[str, Any]:
        """
        Perform comprehensive validation of an organizational chart.
        
        Args:
            chart: The organizational chart to validate
            validation_types: List of validation types to perform
            
        Returns:
            Dict containing validation results
        """
        if validation_types is None:
            validation_types = ['structure', 'compliance', 'completeness', 'consistency']
        
        results = {
            'chart_id': str(chart.id),
            'validation_date': timezone.now(),
            'validation_types': validation_types,
            'summary': {
                'is_valid': True,
                'critical_errors': 0,
                'warnings': 0,
                'complies_with_regulations': True
            },
            'details': {}
        }
        
        # Perform each validation type
        if 'structure' in validation_types:
            structure_results = OrganizationalChartValidationService._validate_structure(chart)
            results['details']['structure'] = structure_results
            
        if 'compliance' in validation_types:
            compliance_results = OrganizationalChartValidationService._validate_compliance(chart)
            results['details']['compliance'] = compliance_results
            
        if 'completeness' in validation_types:
            completeness_results = OrganizationalChartValidationService._validate_completeness(chart)
            results['details']['completeness'] = completeness_results
            
        if 'consistency' in validation_types:
            consistency_results = OrganizationalChartValidationService._validate_consistency(chart)
            results['details']['consistency'] = consistency_results
        
        # Aggregate results
        total_errors = 0
        total_warnings = 0
        has_critical_errors = False
        
        for validation_result in results['details'].values():
            total_errors += validation_result.get('errors', 0)
            total_warnings += validation_result.get('warnings', 0)
            if validation_result.get('critical_errors', 0) > 0:
                has_critical_errors = True
        
        results['summary']['critical_errors'] = total_errors
        results['summary']['warnings'] = total_warnings
        results['summary']['is_valid'] = not has_critical_errors
        results['summary']['complies_with_regulations'] = not has_critical_errors
        
        return results
    
    @staticmethod
    def _validate_structure(chart: OrganizationalChart) -> Dict[str, Any]:
        """Validate organizational structure integrity."""
        errors = []
        warnings = []
        
        # Get all areas and positions
        areas = chart.areas.filter(is_active=True)
        positions = Cargo.objects.filter(area__organizational_chart=chart, is_active=True)
        
        # Validate hierarchy consistency
        for area in areas:
            if area.parent_area:
                if area.hierarchy_level <= area.parent_area.hierarchy_level:
                    errors.append(f"Área '{area.name}' tiene nivel jerárquico inconsistente")
        
        # Validate position reporting structure
        for position in positions:
            if position.reports_to:
                # Check for circular references
                visited = set()
                current = position.reports_to
                while current and current.id not in visited:
                    if current.id == position.id:
                        errors.append(f"Referencia circular detectada en cargo '{position.name}'")
                        break
                    visited.add(current.id)
                    current = current.reports_to
        
        # Validate hierarchy levels
        max_level = chart.hierarchy_levels
        areas_exceeding_level = areas.filter(hierarchy_level__gt=max_level)
        if areas_exceeding_level.exists():
            errors.append(f"Áreas exceden el nivel jerárquico máximo ({max_level})")
        
        # Check for orphaned areas (no parent and not root level)
        orphaned_areas = areas.filter(parent_area__isnull=True, hierarchy_level__gt=1)
        if orphaned_areas.exists():
            warnings.append(f"{orphaned_areas.count()} área(s) huérfana(s) detectada(s)")
        
        return {
            'validation_type': 'structure',
            'status': 'passed' if not errors else 'failed',
            'errors': len(errors),
            'warnings': len(warnings),
            'critical_errors': len(errors),
            'details': {
                'error_messages': errors,
                'warning_messages': warnings,
                'areas_validated': areas.count(),
                'positions_validated': positions.count()
            }
        }
    
    @staticmethod
    def _validate_compliance(chart: OrganizationalChart) -> Dict[str, Any]:
        """Validate compliance with sector requirements."""
        errors = []
        warnings = []
        
        sector = chart.sector
        sector_config = chart.sector_config or {}
        
        # Get sector normatives
        mandatory_normatives = sector.normativas.filter(
            is_mandatory=True, 
            is_current=True, 
            is_active=True
        )
        
        # Validate mandatory positions
        mandatory_positions = sector.get_mandatory_positions()
        existing_positions = set(
            Cargo.objects.filter(
                area__organizational_chart=chart,
                is_active=True
            ).values_list('position_type', flat=True)
        )
        
        missing_positions = [pos for pos in mandatory_positions if pos not in existing_positions]
        if missing_positions:
            errors.extend([f"Cargo obligatorio faltante: {pos}" for pos in missing_positions])
        
        # Validate mandatory committees
        mandatory_committees = sector.get_mandatory_committees()
        # This would need to be implemented based on committee model
        
        # Validate minimum hierarchy levels
        min_levels = sector.default_config.get('hierarchy_levels_default', 3)
        if chart.hierarchy_levels < min_levels:
            errors.append(f"Niveles jerárquicos insuficientes (mínimo: {min_levels})")
        
        # Validate professional license requirements
        licensed_positions = Cargo.objects.filter(
            area__organizational_chart=chart,
            requires_professional_license=True,
            is_active=True
        )
        
        # Check for positions without license when required
        for position in licensed_positions:
            # This would need implementation of license tracking
            pass
        
        return {
            'validation_type': 'compliance',
            'status': 'passed' if not errors else 'failed',
            'errors': len(errors),
            'warnings': len(warnings),
            'critical_errors': len(errors),
            'details': {
                'error_messages': errors,
                'warning_messages': warnings,
                'sector': sector.name,
                'normatives_checked': mandatory_normatives.count(),
                'mandatory_positions_missing': len(missing_positions)
            }
        }
    
    @staticmethod
    def _validate_completeness(chart: OrganizationalChart) -> Dict[str, Any]:
        """Validate chart completeness."""
        warnings = []
        
        areas = chart.areas.filter(is_active=True)
        positions = Cargo.objects.filter(area__organizational_chart=chart, is_active=True)
        
        # Check for areas without positions
        areas_without_positions = areas.filter(positions__isnull=True)
        if areas_without_positions.exists():
            warnings.append(f"{areas_without_positions.count()} área(s) sin cargos definidos")
        
        # Check for positions without descriptions
        positions_without_purpose = positions.filter(main_purpose__isnull=True)
        if positions_without_purpose.exists():
            warnings.append(f"{positions_without_purpose.count()} cargo(s) sin propósito definido")
        
        # Check for positions without requirements
        positions_without_requirements = positions.filter(requirements__isnull=True)
        if positions_without_requirements.exists():
            warnings.append(f"{positions_without_requirements.count()} cargo(s) sin requisitos definidos")
        
        # Check for critical positions
        critical_positions = positions.filter(is_critical=True)
        if not critical_positions.exists():
            warnings.append("No se han identificado cargos críticos")
        
        return {
            'validation_type': 'completeness',
            'status': 'passed',  # Completeness issues are usually warnings
            'errors': 0,
            'warnings': len(warnings),
            'critical_errors': 0,
            'details': {
                'warning_messages': warnings,
                'areas_count': areas.count(),
                'positions_count': positions.count(),
                'critical_positions_count': critical_positions.count()
            }
        }
    
    @staticmethod
    def _validate_consistency(chart: OrganizationalChart) -> Dict[str, Any]:
        """Validate internal consistency."""
        errors = []
        warnings = []
        
        areas = chart.areas.filter(is_active=True)
        positions = Cargo.objects.filter(area__organizational_chart=chart, is_active=True)
        
        # Check for duplicate codes
        area_codes = areas.values_list('code', flat=True)
        duplicate_area_codes = [code for code in area_codes if area_codes.count(code) > 1]
        if duplicate_area_codes:
            errors.extend([f"Código de área duplicado: {code}" for code in set(duplicate_area_codes)])
        
        # Check position codes within areas
        for area in areas:
            position_codes = area.positions.filter(is_active=True).values_list('code', flat=True)
            duplicate_position_codes = [code for code in position_codes if position_codes.count(code) > 1]
            if duplicate_position_codes:
                errors.extend([f"Código de cargo duplicado en área {area.name}: {code}" 
                              for code in set(duplicate_position_codes)])
        
        # Check salary ranges
        positions_with_invalid_salary = positions.filter(
            salary_range_min__gt=models.F('salary_range_max')
        )
        if positions_with_invalid_salary.exists():
            errors.append(f"{positions_with_invalid_salary.count()} cargo(s) con rango salarial inválido")
        
        return {
            'validation_type': 'consistency',
            'status': 'passed' if not errors else 'failed',
            'errors': len(errors),
            'warnings': len(warnings),
            'critical_errors': len(errors),
            'details': {
                'error_messages': errors,
                'warning_messages': warnings,
                'duplicate_area_codes': len(set(duplicate_area_codes)) if duplicate_area_codes else 0,
                'invalid_salary_ranges': positions_with_invalid_salary.count() if positions_with_invalid_salary.exists() else 0
            }
        }


class OrganizationalChartTemplateService:
    """
    Service for managing organizational chart templates.
    
    Provides functionality for:
    - Template generation
    - Template application
    - Template optimization
    - Template analytics
    """
    
    @staticmethod
    def create_template_from_chart(
        chart: OrganizationalChart,
        name: str,
        description: str,
        complexity: str,
        user: User
    ) -> PlantillaOrganigrama:
        """
        Create a template from an existing organizational chart.
        
        Args:
            chart: Source organizational chart
            name: Template name
            description: Template description
            complexity: Template complexity level
            user: User creating the template
            
        Returns:
            Created template instance
        """
        # Extract structure from chart
        structure = OrganizationalChartTemplateService._extract_chart_structure(chart)
        
        # Create template
        template = PlantillaOrganigrama.objects.create(
            sector=chart.sector,
            organization_type=chart.organization_type,
            name=name,
            description=description,
            complexity=complexity,
            structure=structure,
            created_by=user,
            updated_by=user
        )
        
        logger.info(f"Template '{name}' created from chart {chart.id} by user {user.id}")
        return template
    
    @staticmethod
    def _extract_chart_structure(chart: OrganizationalChart) -> Dict[str, Any]:
        """Extract structure data from organizational chart."""
        areas = chart.areas.filter(is_active=True).order_by('hierarchy_level', 'code')
        positions = Cargo.objects.filter(
            area__organizational_chart=chart, 
            is_active=True
        ).select_related('area')
        
        # Extract areas
        areas_data = []
        for area in areas:
            area_data = {
                'code': area.code,
                'name': area.name,
                'type': area.area_type,
                'level': area.hierarchy_level,
                'description': area.description,
                'purpose': area.main_purpose,
                'parent_code': area.parent_area.code if area.parent_area else None
            }
            areas_data.append(area_data)
        
        # Extract positions
        positions_data = []
        for position in positions:
            position_data = {
                'code': position.code,
                'name': position.name,
                'area_code': position.area.code,
                'level': position.hierarchy_level,
                'purpose': position.main_purpose,
                'is_critical': position.is_critical,
                'authorized_positions': position.authorized_positions,
                'requirements': position.requirements,
                'reports_to_code': position.reports_to.code if position.reports_to else None
            }
            positions_data.append(position_data)
        
        # Extract committees (placeholder for when committee model exists)
        committees_data = []
        
        return {
            'areas': areas_data,
            'positions': positions_data,
            'committees': committees_data,
            'hierarchy_levels': chart.hierarchy_levels,
            'metadata': {
                'source_chart_id': str(chart.id),
                'extraction_date': timezone.now().isoformat(),
                'areas_count': len(areas_data),
                'positions_count': len(positions_data)
            }
        }
    
    @staticmethod
    def generate_basic_template(
        sector: Sector,
        organization_type: str,
        complexity: str = 'BASIC'
    ) -> Dict[str, Any]:
        """Generate a basic template structure based on sector requirements."""
        
        # Basic areas structure based on complexity
        if complexity == 'BASIC':
            areas_data = [
                {
                    'code': 'DIR-GEN',
                    'name': 'Dirección General',
                    'type': 'DIRECTION',
                    'level': 1,
                    'description': 'Dirección general de la organización',
                    'purpose': 'Liderar y dirigir la organización'
                },
                {
                    'code': 'ADMIN',
                    'name': 'Administración',
                    'type': 'DEPARTMENT',
                    'level': 2,
                    'description': 'Departamento administrativo',
                    'purpose': 'Gestionar los procesos administrativos',
                    'parent_code': 'DIR-GEN'
                },
                {
                    'code': 'OPER',
                    'name': 'Operaciones',
                    'type': 'DEPARTMENT',
                    'level': 2,
                    'description': 'Departamento operativo',
                    'purpose': 'Ejecutar las operaciones principales',
                    'parent_code': 'DIR-GEN'
                }
            ]
            
            positions_data = [
                {
                    'code': 'DIR-001',
                    'name': 'Director General',
                    'area_code': 'DIR-GEN',
                    'level': 'EXECUTIVE',
                    'purpose': 'Dirigir y liderar la organización',
                    'is_critical': True,
                    'authorized_positions': 1,
                    'requirements': {
                        'education': {'level': 'university'},
                        'experience': {'years': 5},
                        'competencies': ['Liderazgo', 'Gestión estratégica']
                    }
                },
                {
                    'code': 'ADM-001',
                    'name': 'Administrador',
                    'area_code': 'ADMIN',
                    'level': 'PROFESSIONAL',
                    'purpose': 'Gestionar procesos administrativos',
                    'is_critical': False,
                    'authorized_positions': 1,
                    'reports_to_code': 'DIR-001',
                    'requirements': {
                        'education': {'level': 'university'},
                        'experience': {'years': 2}
                    }
                }
            ]
        
        elif complexity == 'MEDIUM':
            # More complex structure
            areas_data = [
                # Add more areas for medium complexity
            ]
            positions_data = [
                # Add more positions for medium complexity
            ]
        
        else:  # HIGH complexity
            # Most complex structure
            areas_data = []
            positions_data = []
        
        # Add sector-specific requirements
        mandatory_positions = sector.get_mandatory_positions()
        for pos_type in mandatory_positions:
            if not any(p.get('position_type') == pos_type for p in positions_data):
                # Add mandatory position if not present
                pass
        
        return {
            'areas': areas_data,
            'positions': positions_data,
            'committees': [],  # Will be populated based on sector requirements
            'hierarchy_levels': len(set(a['level'] for a in areas_data)) if areas_data else 3,
            'metadata': {
                'generation_date': timezone.now().isoformat(),
                'complexity': complexity,
                'sector': sector.code,
                'organization_type': organization_type
            }
        }
    
    @staticmethod
    def analyze_template_usage(template: PlantillaOrganigrama) -> Dict[str, Any]:
        """Analyze template usage statistics and effectiveness."""
        
        # Get all charts created from this template
        charts = template.charts_created.filter(is_active=True)
        
        # Calculate usage statistics
        total_uses = charts.count()
        current_uses = charts.filter(is_current=True).count()
        approved_uses = charts.filter(approved_by__isnull=False).count()
        
        # Calculate success rate
        success_rate = (approved_uses / total_uses * 100) if total_uses > 0 else 0
        
        # Get organizations using this template
        organizations = list(set(chart.organization for chart in charts))
        
        # Analyze validation results
        compliant_charts = 0
        for chart in charts:
            if chart.compliance_status and chart.is_compliant:
                compliant_charts += 1
        
        compliance_rate = (compliant_charts / total_uses * 100) if total_uses > 0 else 0
        
        return {
            'template_id': str(template.id),
            'template_name': template.name,
            'usage_statistics': {
                'total_applications': total_uses,
                'current_active': current_uses,
                'approved_charts': approved_uses,
                'unique_organizations': len(organizations),
                'success_rate': round(success_rate, 2),
                'compliance_rate': round(compliance_rate, 2)
            },
            'template_metadata': {
                'sector': template.sector.name,
                'organization_type': template.organization_type,
                'complexity': template.complexity,
                'created_date': template.created_at,
                'last_used': template.last_used_date
            },
            'organizations_using': [
                {
                    'id': str(org.id),
                    'name': org.nombre_comercial,
                    'nit': org.nit
                } for org in organizations
            ]
        }


class OrganizationalChartComplianceService:
    """
    Service for managing organizational chart compliance.
    
    Provides functionality for:
    - Compliance monitoring
    - Automated compliance checks
    - Compliance reporting
    - Remediation recommendations
    """
    
    @staticmethod
    def check_compliance_status(organization: Organization) -> Dict[str, Any]:
        """Check compliance status for an organization's current chart."""
        
        current_chart = organization.organizational_chart
        if not current_chart or not current_chart.is_current:
            return {
                'status': 'no_chart',
                'message': 'No hay organigrama vigente',
                'compliance_score': 0
            }
        
        # Get latest validation results
        if current_chart.compliance_status:
            validation_results = current_chart.compliance_status
        else:
            # Perform validation if not done recently
            validation_results = OrganizationalChartValidationService.validate_chart(current_chart)
            current_chart.compliance_status = validation_results
            current_chart.last_validation_date = timezone.now()
            current_chart.save(update_fields=['compliance_status', 'last_validation_date'])
        
        # Calculate compliance score
        summary = validation_results.get('summary', {})
        critical_errors = summary.get('critical_errors', 0)
        warnings = summary.get('warnings', 0)
        
        # Score calculation (100 - penalties)
        score = 100
        score -= critical_errors * 10  # 10 points per critical error
        score -= warnings * 2  # 2 points per warning
        score = max(0, score)  # Don't go below 0
        
        # Determine status
        if critical_errors > 0:
            status = 'non_compliant'
        elif warnings > 0:
            status = 'partially_compliant'
        else:
            status = 'compliant'
        
        return {
            'status': status,
            'compliance_score': score,
            'critical_errors': critical_errors,
            'warnings': warnings,
            'last_validated': current_chart.last_validation_date,
            'validation_details': validation_results,
            'recommendations': OrganizationalChartComplianceService._generate_recommendations(
                validation_results
            )
        }
    
    @staticmethod
    def _generate_recommendations(validation_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate remediation recommendations based on validation results."""
        recommendations = []
        
        details = validation_results.get('details', {})
        
        # Structure recommendations
        structure_details = details.get('structure', {})
        if structure_details.get('errors', 0) > 0:
            recommendations.append({
                'type': 'structure',
                'priority': 'high',
                'title': 'Corregir problemas estructurales',
                'description': 'Revisar y corregir la estructura jerárquica del organigrama',
                'specific_issues': structure_details.get('details', {}).get('error_messages', [])
            })
        
        # Compliance recommendations
        compliance_details = details.get('compliance', {})
        if compliance_details.get('errors', 0) > 0:
            recommendations.append({
                'type': 'compliance',
                'priority': 'high',
                'title': 'Cumplir requisitos normativos',
                'description': 'Agregar cargos o comités obligatorios según la normativa sectorial',
                'specific_issues': compliance_details.get('details', {}).get('error_messages', [])
            })
        
        # Completeness recommendations
        completeness_details = details.get('completeness', {})
        if completeness_details.get('warnings', 0) > 0:
            recommendations.append({
                'type': 'completeness',
                'priority': 'medium',
                'title': 'Completar información faltante',
                'description': 'Agregar descripciones, requisitos y propósitos faltantes',
                'specific_issues': completeness_details.get('details', {}).get('warning_messages', [])
            })
        
        return recommendations
    
    @staticmethod
    def schedule_compliance_review(chart: OrganizationalChart, review_date: datetime):
        """Schedule a compliance review for a chart."""
        # This would integrate with a task scheduler like Celery
        # For now, just update the chart with next review date
        chart.sector_config = chart.sector_config or {}
        chart.sector_config['next_compliance_review'] = review_date.isoformat()
        chart.save(update_fields=['sector_config'])
        
        logger.info(f"Compliance review scheduled for chart {chart.id} on {review_date}")


class OrganizationalChartVersionService:
    """
    Service for managing organizational chart versions.
    
    Provides functionality for:
    - Version creation and management
    - Version comparison
    - Version rollback
    - Change tracking
    """
    
    @staticmethod
    def create_new_version(
        current_chart: OrganizationalChart,
        changes_description: str,
        effective_date: datetime,
        user: User
    ) -> OrganizationalChart:
        """Create a new version of an organizational chart."""
        
        with transaction.atomic():
            # Generate next version number
            next_version = current_chart.get_next_version()
            
            # Create new chart version
            new_chart = OrganizationalChart.objects.create(
                organization=current_chart.organization,
                sector=current_chart.sector,
                organization_type=current_chart.organization_type,
                base_template=current_chart.base_template,
                version=next_version,
                effective_date=effective_date,
                is_current=False,  # Will be set when approved
                hierarchy_levels=current_chart.hierarchy_levels,
                allows_temporary_positions=current_chart.allows_temporary_positions,
                uses_raci_matrix=current_chart.uses_raci_matrix,
                sector_config=current_chart.sector_config.copy() if current_chart.sector_config else {},
                created_by=user,
                updated_by=user
            )
            
            # Add change description to sector config
            new_chart.sector_config = new_chart.sector_config or {}
            new_chart.sector_config['version_changes'] = changes_description
            new_chart.sector_config['previous_version'] = current_chart.version
            new_chart.save(update_fields=['sector_config'])
            
            logger.info(f"New chart version {next_version} created for organization {current_chart.organization.id}")
            return new_chart
    
    @staticmethod
    def compare_versions(
        version1: OrganizationalChart, 
        version2: OrganizationalChart
    ) -> Dict[str, Any]:
        """Compare two versions of an organizational chart."""
        
        comparison = {
            'version1': {
                'version': version1.version,
                'effective_date': version1.effective_date,
                'is_current': version1.is_current
            },
            'version2': {
                'version': version2.version,
                'effective_date': version2.effective_date,
                'is_current': version2.is_current
            },
            'changes': {
                'areas': [],
                'positions': [],
                'metadata': []
            }
        }
        
        # Compare areas
        v1_areas = set(version1.areas.filter(is_active=True).values_list('code', 'name'))
        v2_areas = set(version2.areas.filter(is_active=True).values_list('code', 'name'))
        
        added_areas = v2_areas - v1_areas
        removed_areas = v1_areas - v2_areas
        
        if added_areas:
            comparison['changes']['areas'].append({
                'type': 'added',
                'items': list(added_areas)
            })
        
        if removed_areas:
            comparison['changes']['areas'].append({
                'type': 'removed',
                'items': list(removed_areas)
            })
        
        # Compare positions
        v1_positions = set(
            Cargo.objects.filter(
                area__organizational_chart=version1, is_active=True
            ).values_list('code', 'name')
        )
        v2_positions = set(
            Cargo.objects.filter(
                area__organizational_chart=version2, is_active=True
            ).values_list('code', 'name')
        )
        
        added_positions = v2_positions - v1_positions
        removed_positions = v1_positions - v2_positions
        
        if added_positions:
            comparison['changes']['positions'].append({
                'type': 'added',
                'items': list(added_positions)
            })
        
        if removed_positions:
            comparison['changes']['positions'].append({
                'type': 'removed',
                'items': list(removed_positions)
            })
        
        # Compare metadata
        metadata_changes = []
        if version1.hierarchy_levels != version2.hierarchy_levels:
            metadata_changes.append(f"Niveles jerárquicos: {version1.hierarchy_levels} → {version2.hierarchy_levels}")
        
        if version1.allows_temporary_positions != version2.allows_temporary_positions:
            metadata_changes.append(f"Permite cargos temporales: {version1.allows_temporary_positions} → {version2.allows_temporary_positions}")
        
        comparison['changes']['metadata'] = metadata_changes
        
        return comparison
    
    @staticmethod
    def get_version_history(organization: Organization) -> List[Dict[str, Any]]:
        """Get version history for an organization's charts."""
        
        charts = OrganizationalChart.objects.filter(
            organization=organization,
            is_active=True
        ).order_by('-effective_date', '-version')
        
        history = []
        for chart in charts:
            version_info = {
                'id': str(chart.id),
                'version': chart.version,
                'effective_date': chart.effective_date,
                'end_date': chart.end_date,
                'is_current': chart.is_current,
                'approved_by': chart.approved_by.get_full_name() if chart.approved_by else None,
                'approval_date': chart.approval_date,
                'changes_description': chart.sector_config.get('version_changes') if chart.sector_config else None,
                'statistics': {
                    'areas_count': chart.areas.filter(is_active=True).count(),
                    'positions_count': chart.get_total_positions()
                }
            }
            history.append(version_info)
        
        return history