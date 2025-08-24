"""
Real-time validation views for Organizational Chart functionality.

This module provides endpoints for:
- Real-time validation of organizational structures
- Instant compliance checking
- Live feedback during chart creation/editing
- Performance optimized validation endpoints
"""

import logging
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404

from apps.authorization.drf_permissions import HasPermission
from ..models.organizational_chart import (
    Sector, OrganizationalChart
)
from ..models.organizational_structure import Area, Cargo
from ..models import Organization
from ..services.organizational_chart_service import (
    OrganizationalChartValidationService,
    OrganizationalChartComplianceService
)

logger = logging.getLogger(__name__)


class RealTimeValidationViewSet(viewsets.ViewSet):
    """
    ViewSet for real-time validation of organizational elements.
    
    Provides lightweight validation endpoints that can be called
    during form editing for instant feedback.
    """
    
    permission_classes = [permissions.IsAuthenticated, HasPermission]
    required_permission = 'organization.read'
    
    @action(detail=False, methods=['post'], url_path='validate-area-code')
    def validate_area_code(self, request):
        """
        Validate if an area code is unique within a chart.
        
        Expected payload:
        {
            "chart_id": "uuid",
            "code": "string",
            "exclude_id": "uuid" (optional, for updates)
        }
        """
        chart_id = request.data.get('chart_id')
        code = request.data.get('code')
        exclude_id = request.data.get('exclude_id')
        
        if not chart_id or not code:
            return Response({
                'valid': False,
                'message': _('chart_id y code son requeridos')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            chart = OrganizationalChart.objects.get(id=chart_id, is_active=True)
            
            # Check for duplicate code
            existing = Area.objects.filter(
                organizational_chart=chart,
                code=code,
                is_active=True
            )
            
            if exclude_id:
                existing = existing.exclude(id=exclude_id)
            
            is_valid = not existing.exists()
            
            return Response({
                'valid': is_valid,
                'message': _('Código disponible') if is_valid else _('Código ya existe'),
                'code': code,
                'chart_id': chart_id
            })
            
        except OrganizationalChart.DoesNotExist:
            return Response({
                'valid': False,
                'message': _('Organigrama no encontrado')
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error validating area code: {str(e)}")
            return Response({
                'valid': False,
                'message': _('Error en la validación')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='validate-position-code')
    def validate_position_code(self, request):
        """
        Validate if a position code is unique within an area.
        
        Expected payload:
        {
            "area_id": "uuid",
            "code": "string",
            "exclude_id": "uuid" (optional, for updates)
        }
        """
        area_id = request.data.get('area_id')
        code = request.data.get('code')
        exclude_id = request.data.get('exclude_id')
        
        if not area_id or not code:
            return Response({
                'valid': False,
                'message': _('area_id y code son requeridos')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            area = Area.objects.get(id=area_id, is_active=True)
            
            # Check for duplicate code within area
            existing = Cargo.objects.filter(
                area=area,
                code=code,
                is_active=True
            )
            
            if exclude_id:
                existing = existing.exclude(id=exclude_id)
            
            is_valid = not existing.exists()
            
            return Response({
                'valid': is_valid,
                'message': _('Código disponible') if is_valid else _('Código ya existe en esta área'),
                'code': code,
                'area_id': area_id
            })
            
        except Area.DoesNotExist:
            return Response({
                'valid': False,
                'message': _('Área no encontrada')
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error validating position code: {str(e)}")
            return Response({
                'valid': False,
                'message': _('Error en la validación')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='validate-hierarchy-level')
    def validate_hierarchy_level(self, request):
        """
        Validate if a hierarchy level is appropriate for parent-child relationship.
        
        Expected payload:
        {
            "parent_area_id": "uuid" (optional),
            "hierarchy_level": int,
            "chart_id": "uuid"
        }
        """
        parent_area_id = request.data.get('parent_area_id')
        hierarchy_level = request.data.get('hierarchy_level')
        chart_id = request.data.get('chart_id')
        
        if not hierarchy_level or not chart_id:
            return Response({
                'valid': False,
                'message': _('hierarchy_level y chart_id son requeridos')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            chart = OrganizationalChart.objects.get(id=chart_id, is_active=True)
            
            # Validate against parent area level
            if parent_area_id:
                try:
                    parent_area = Area.objects.get(id=parent_area_id, is_active=True)
                    if hierarchy_level <= parent_area.hierarchy_level:
                        return Response({
                            'valid': False,
                            'message': _('El nivel jerárquico debe ser mayor que el del área padre'),
                            'parent_level': parent_area.hierarchy_level,
                            'suggested_level': parent_area.hierarchy_level + 1
                        })
                except Area.DoesNotExist:
                    return Response({
                        'valid': False,
                        'message': _('Área padre no encontrada')
                    }, status=status.HTTP_404_NOT_FOUND)
            
            # Validate against chart maximum levels
            if hierarchy_level > chart.hierarchy_levels:
                return Response({
                    'valid': False,
                    'message': _('Nivel jerárquico excede el máximo permitido'),
                    'max_levels': chart.hierarchy_levels,
                    'requested_level': hierarchy_level
                })
            
            return Response({
                'valid': True,
                'message': _('Nivel jerárquico válido'),
                'hierarchy_level': hierarchy_level
            })
            
        except OrganizationalChart.DoesNotExist:
            return Response({
                'valid': False,
                'message': _('Organigrama no encontrado')
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error validating hierarchy level: {str(e)}")
            return Response({
                'valid': False,
                'message': _('Error en la validación')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='validate-reporting-structure')
    def validate_reporting_structure(self, request):
        """
        Validate if a reporting structure is valid (no circular references).
        
        Expected payload:
        {
            "position_id": "uuid",
            "reports_to_id": "uuid",
            "exclude_id": "uuid" (optional, for updates)
        }
        """
        position_id = request.data.get('position_id')
        reports_to_id = request.data.get('reports_to_id')
        exclude_id = request.data.get('exclude_id')
        
        if not position_id or not reports_to_id:
            return Response({
                'valid': False,
                'message': _('position_id y reports_to_id son requeridos')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            position = Cargo.objects.get(id=position_id, is_active=True)
            reports_to = Cargo.objects.get(id=reports_to_id, is_active=True)
            
            # Check for circular reference
            visited = set()
            current = reports_to
            
            # If we're updating, temporarily exclude the position being updated
            if exclude_id == position_id:
                current = reports_to.reports_to if reports_to.reports_to else None
            
            while current:
                if current.id == position.id:
                    return Response({
                        'valid': False,
                        'message': _('Se detectó una referencia circular en la estructura de reporte'),
                        'circular_path': list(visited) + [str(current.id)]
                    })
                
                if current.id in visited:
                    break  # Avoid infinite loop
                
                visited.add(current.id)
                current = current.reports_to
            
            return Response({
                'valid': True,
                'message': _('Estructura de reporte válida')
            })
            
        except Cargo.DoesNotExist:
            return Response({
                'valid': False,
                'message': _('Cargo no encontrado')
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error validating reporting structure: {str(e)}")
            return Response({
                'valid': False,
                'message': _('Error en la validación')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='validate-salary-range')
    def validate_salary_range(self, request):
        """
        Validate salary range for a position.
        
        Expected payload:
        {
            "salary_min": decimal,
            "salary_max": decimal,
            "position_type": string (optional),
            "area_id": "uuid" (optional, for context)
        }
        """
        salary_min = request.data.get('salary_min')
        salary_max = request.data.get('salary_max')
        position_type = request.data.get('position_type')
        area_id = request.data.get('area_id')
        
        if salary_min is None or salary_max is None:
            return Response({
                'valid': False,
                'message': _('salary_min y salary_max son requeridos')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            salary_min = float(salary_min)
            salary_max = float(salary_max)
            
            # Basic validation
            if salary_min < 0 or salary_max < 0:
                return Response({
                    'valid': False,
                    'message': _('Los salarios no pueden ser negativos')
                })
            
            if salary_min >= salary_max:
                return Response({
                    'valid': False,
                    'message': _('El salario máximo debe ser mayor que el mínimo')
                })
            
            # Additional validations based on context
            warnings = []
            
            # Check against minimum wage (this would need to be configured)
            MINIMUM_WAGE = 1160000  # 2024 Colombian minimum wage
            if salary_min < MINIMUM_WAGE:
                warnings.append(_('El salario mínimo está por debajo del salario mínimo legal'))
            
            # Check range spread
            range_ratio = salary_max / salary_min if salary_min > 0 else 0
            if range_ratio > 2.0:
                warnings.append(_('El rango salarial es muy amplio (>100% diferencia)'))
            
            return Response({
                'valid': True,
                'message': _('Rango salarial válido'),
                'warnings': warnings,
                'range_analysis': {
                    'min': salary_min,
                    'max': salary_max,
                    'range': salary_max - salary_min,
                    'range_percentage': ((salary_max - salary_min) / salary_min * 100) if salary_min > 0 else 0
                }
            })
            
        except (ValueError, TypeError):
            return Response({
                'valid': False,
                'message': _('Valores de salario inválidos')
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error validating salary range: {str(e)}")
            return Response({
                'valid': False,
                'message': _('Error en la validación')
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InstantComplianceCheckView(APIView):
    """
    View for instant compliance checking during chart editing.
    
    Provides lightweight compliance feedback without full validation.
    """
    
    permission_classes = [permissions.IsAuthenticated, HasPermission]
    required_permission = 'organization.read'
    
    def post(self, request, format=None):
        """
        Perform instant compliance check.
        
        Expected payload:
        {
            "chart_id": "uuid",
            "check_types": ["mandatory_positions", "mandatory_committees", "hierarchy_levels"]
        }
        """
        chart_id = request.data.get('chart_id')
        check_types = request.data.get('check_types', ['mandatory_positions'])
        
        if not chart_id:
            return Response({
                'success': False,
                'message': _('chart_id es requerido')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            chart = get_object_or_404(OrganizationalChart, id=chart_id, is_active=True)
            
            results = {
                'chart_id': chart_id,
                'organization': chart.organization.nombre_comercial,
                'sector': chart.sector.name,
                'checks': {},
                'overall_status': 'compliant'
            }
            
            # Check mandatory positions
            if 'mandatory_positions' in check_types:
                mandatory_check = self._check_mandatory_positions(chart)
                results['checks']['mandatory_positions'] = mandatory_check
                if not mandatory_check['compliant']:
                    results['overall_status'] = 'non_compliant'
            
            # Check mandatory committees
            if 'mandatory_committees' in check_types:
                committee_check = self._check_mandatory_committees(chart)
                results['checks']['mandatory_committees'] = committee_check
                if not committee_check['compliant']:
                    results['overall_status'] = 'non_compliant'
            
            # Check hierarchy levels
            if 'hierarchy_levels' in check_types:
                hierarchy_check = self._check_hierarchy_levels(chart)
                results['checks']['hierarchy_levels'] = hierarchy_check
                if not hierarchy_check['compliant']:
                    results['overall_status'] = 'non_compliant'
            
            return Response({
                'success': True,
                'results': results
            })
            
        except Exception as e:
            logger.error(f"Error in instant compliance check: {str(e)}")
            return Response({
                'success': False,
                'message': _('Error en la verificación de cumplimiento'),
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _check_mandatory_positions(self, chart: OrganizationalChart) -> dict:
        """Check if chart has all mandatory positions for its sector."""
        mandatory_positions = chart.sector.get_mandatory_positions()
        
        existing_positions = set(
            Cargo.objects.filter(
                area__organizational_chart=chart,
                is_active=True
            ).values_list('position_type', flat=True).distinct()
        )
        
        missing_positions = [pos for pos in mandatory_positions if pos not in existing_positions]
        
        return {
            'compliant': len(missing_positions) == 0,
            'required_positions': mandatory_positions,
            'existing_positions': list(existing_positions),
            'missing_positions': missing_positions,
            'message': _('Todos los cargos obligatorios están presentes') if len(missing_positions) == 0 
                      else _('Faltan cargos obligatorios'),
            'details': {
                'total_required': len(mandatory_positions),
                'total_missing': len(missing_positions)
            }
        }
    
    def _check_mandatory_committees(self, chart: OrganizationalChart) -> dict:
        """Check if chart has all mandatory committees for its sector."""
        mandatory_committees = chart.sector.get_mandatory_committees()
        
        # This would need to be implemented when committee model exists
        # For now, return a placeholder
        existing_committees = []
        missing_committees = mandatory_committees
        
        return {
            'compliant': len(missing_committees) == 0,
            'required_committees': mandatory_committees,
            'existing_committees': existing_committees,
            'missing_committees': missing_committees,
            'message': _('Todos los comités obligatorios están presentes') if len(missing_committees) == 0 
                      else _('Faltan comités obligatorios'),
            'details': {
                'total_required': len(mandatory_committees),
                'total_missing': len(missing_committees)
            }
        }
    
    def _check_hierarchy_levels(self, chart: OrganizationalChart) -> dict:
        """Check if chart has appropriate hierarchy levels."""
        min_levels = chart.sector.default_config.get('hierarchy_levels_default', 3)
        current_levels = chart.hierarchy_levels
        
        compliant = current_levels >= min_levels
        
        return {
            'compliant': compliant,
            'minimum_required': min_levels,
            'current_levels': current_levels,
            'message': _('Niveles jerárquicos apropiados') if compliant 
                      else _('Niveles jerárquicos insuficientes'),
            'details': {
                'difference': current_levels - min_levels,
                'sector_recommendation': min_levels
            }
        }


class LiveFeedbackView(APIView):
    """
    View for providing live feedback during chart creation/editing.
    
    Provides contextual suggestions and warnings as users build their charts.
    """
    
    permission_classes = [permissions.IsAuthenticated, HasPermission]
    required_permission = 'organization.read'
    
    def post(self, request, format=None):
        """
        Get live feedback for current chart state.
        
        Expected payload:
        {
            "chart_id": "uuid",
            "context": "area_creation" | "position_creation" | "chart_overview",
            "current_data": {} (optional, current form data)
        }
        """
        chart_id = request.data.get('chart_id')
        context = request.data.get('context', 'chart_overview')
        current_data = request.data.get('current_data', {})
        
        if not chart_id:
            return Response({
                'success': False,
                'message': _('chart_id es requerido')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            chart = get_object_or_404(OrganizationalChart, id=chart_id, is_active=True)
            
            feedback = {
                'chart_id': chart_id,
                'context': context,
                'timestamp': timezone.now(),
                'suggestions': [],
                'warnings': [],
                'tips': [],
                'progress': self._calculate_chart_progress(chart)
            }
            
            if context == 'area_creation':
                feedback.update(self._get_area_creation_feedback(chart, current_data))
            elif context == 'position_creation':
                feedback.update(self._get_position_creation_feedback(chart, current_data))
            elif context == 'chart_overview':
                feedback.update(self._get_chart_overview_feedback(chart))
            
            return Response({
                'success': True,
                'feedback': feedback
            })
            
        except Exception as e:
            logger.error(f"Error providing live feedback: {str(e)}")
            return Response({
                'success': False,
                'message': _('Error obteniendo retroalimentación'),
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _calculate_chart_progress(self, chart: OrganizationalChart) -> dict:
        """Calculate completion progress of the chart."""
        areas_count = chart.areas.filter(is_active=True).count()
        positions_count = Cargo.objects.filter(
            area__organizational_chart=chart, 
            is_active=True
        ).count()
        
        # Calculate basic completeness scores
        structure_score = min(100, (areas_count / 3) * 30)  # Expect at least 3 areas
        positions_score = min(100, (positions_count / 5) * 30)  # Expect at least 5 positions
        
        # Check for missing critical information
        areas_with_purpose = chart.areas.filter(
            is_active=True, 
            main_purpose__isnull=False
        ).exclude(main_purpose='').count()
        
        positions_with_purpose = Cargo.objects.filter(
            area__organizational_chart=chart,
            is_active=True,
            main_purpose__isnull=False
        ).exclude(main_purpose='').count()
        
        completeness_score = 0
        if areas_count > 0:
            completeness_score += (areas_with_purpose / areas_count) * 20
        if positions_count > 0:
            completeness_score += (positions_with_purpose / positions_count) * 20
        
        overall_progress = structure_score + positions_score + completeness_score
        
        return {
            'overall_percentage': min(100, overall_progress),
            'areas_count': areas_count,
            'positions_count': positions_count,
            'areas_with_purpose': areas_with_purpose,
            'positions_with_purpose': positions_with_purpose,
            'completion_status': {
                'structure': structure_score >= 30,
                'positions': positions_score >= 30,
                'completeness': completeness_score >= 30
            }
        }
    
    def _get_area_creation_feedback(self, chart: OrganizationalChart, current_data: dict) -> dict:
        """Get feedback specific to area creation."""
        suggestions = []
        warnings = []
        tips = []
        
        # Analyze current areas
        areas_count = chart.areas.filter(is_active=True).count()
        
        if areas_count == 0:
            suggestions.append({
                'type': 'structure',
                'message': _('Comience creando el área de Dirección General como área raíz'),
                'priority': 'high'
            })
        
        # Check current data if provided
        if current_data:
            area_type = current_data.get('area_type')
            hierarchy_level = current_data.get('hierarchy_level')
            
            if area_type == 'DIRECTION' and hierarchy_level and hierarchy_level > 2:
                warnings.append({
                    'type': 'hierarchy',
                    'message': _('Las direcciones generalmente están en niveles jerárquicos bajos (1-2)'),
                    'suggestion': _('Considere usar un nivel jerárquico menor')
                })
        
        tips.extend([
            _('Use códigos descriptivos para facilitar la identificación (ej: DIR-GEN, ADM-FIN)'),
            _('Defina claramente el propósito de cada área para facilitar la asignación de responsabilidades')
        ])
        
        return {
            'suggestions': suggestions,
            'warnings': warnings,
            'tips': tips
        }
    
    def _get_position_creation_feedback(self, chart: OrganizationalChart, current_data: dict) -> dict:
        """Get feedback specific to position creation."""
        suggestions = []
        warnings = []
        tips = []
        
        # Analyze current positions
        positions_count = Cargo.objects.filter(
            area__organizational_chart=chart, 
            is_active=True
        ).count()
        
        critical_positions_count = Cargo.objects.filter(
            area__organizational_chart=chart,
            is_critical=True,
            is_active=True
        ).count()
        
        if positions_count == 0:
            suggestions.append({
                'type': 'structure',
                'message': _('Comience creando el cargo de Director General o equivalente'),
                'priority': 'high'
            })
        
        if critical_positions_count == 0 and positions_count > 2:
            suggestions.append({
                'type': 'classification',
                'message': _('Identifique y marque los cargos críticos para la operación'),
                'priority': 'medium'
            })
        
        # Check current data if provided
        if current_data:
            hierarchy_level = current_data.get('hierarchy_level')
            requires_license = current_data.get('requires_professional_license')
            
            if hierarchy_level == 'EXECUTIVE' and not requires_license:
                tips.append(_('Los cargos ejecutivos frecuentemente requieren licencia profesional'))
        
        tips.extend([
            _('Defina claramente los requisitos de educación y experiencia'),
            _('Use la matriz RACI si está habilitada para definir responsabilidades')
        ])
        
        return {
            'suggestions': suggestions,
            'warnings': warnings,
            'tips': tips
        }
    
    def _get_chart_overview_feedback(self, chart: OrganizationalChart) -> dict:
        """Get general feedback for the chart overview."""
        suggestions = []
        warnings = []
        tips = []
        
        areas_count = chart.areas.filter(is_active=True).count()
        positions_count = Cargo.objects.filter(
            area__organizational_chart=chart, 
            is_active=True
        ).count()
        
        # Structure analysis
        if areas_count < 3:
            suggestions.append({
                'type': 'structure',
                'message': _('Considere agregar más áreas para una mejor organización'),
                'priority': 'medium'
            })
        
        if positions_count < areas_count * 1.5:
            suggestions.append({
                'type': 'staffing',
                'message': _('La relación cargos/áreas parece baja, revise la dotación'),
                'priority': 'low'
            })
        
        # Check approval status
        if not chart.approved_by:
            suggestions.append({
                'type': 'approval',
                'message': _('Solicite la aprobación del organigrama cuando esté completo'),
                'priority': 'high'
            })
        
        tips.extend([
            _('Valide regularmente el cumplimiento normativo'),
            _('Mantenga actualizada la información de contacto y responsabilidades'),
            _('Considere crear una nueva versión para cambios significativos')
        ])
        
        return {
            'suggestions': suggestions,
            'warnings': warnings,
            'tips': tips
        }