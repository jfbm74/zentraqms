"""
Performance optimization service for Organizational Chart operations.

This module provides optimized database queries, caching strategies,
and performance monitoring for large organizational structures.
"""

import logging
from typing import Dict, List, Any, Optional
from django.db import models, connection
from django.db.models.query import QuerySet
from django.core.cache import cache
from django.db.models import Prefetch, Count, Q, F
from django.utils import timezone
from datetime import timedelta

from ..models.organizational_chart import (
    Sector, PlantillaOrganigrama, OrganizationalChart
)
from ..models.organizational_structure import (
    Area, Cargo, Responsabilidad, Autoridad
)

logger = logging.getLogger(__name__)


class OrganizationalChartPerformanceService:
    """
    Service for optimizing organizational chart query performance.
    
    Provides optimized QuerySets and caching strategies for large
    organizational structures.
    """
    
    # Cache timeout settings (in seconds)
    CACHE_TIMEOUT_SHORT = 300      # 5 minutes
    CACHE_TIMEOUT_MEDIUM = 1800    # 30 minutes
    CACHE_TIMEOUT_LONG = 3600      # 1 hour
    
    @classmethod
    def get_optimized_chart_queryset(cls, user=None, organization_id=None) -> QuerySet:
        """
        Get optimized queryset for organizational charts with all necessary relations.
        
        Args:
            user: User requesting the data (for permission filtering)
            organization_id: Optional organization filter
            
        Returns:
            Optimized QuerySet for OrganizationalChart
        """
        queryset = OrganizationalChart.objects.select_related(
            'organization',
            'sector', 
            'base_template',
            'approved_by'
        ).prefetch_related(
            'areas',
            'areas__positions',
            'areas__positions__responsibilities',
            'areas__positions__authorities'
        ).filter(is_active=True)
        
        if organization_id:
            queryset = queryset.filter(organization_id=organization_id)
        
        # Add performance annotations
        queryset = queryset.annotate(
            areas_count=Count('areas', filter=Q(areas__is_active=True)),
            total_positions=Count(
                'areas__positions',
                filter=Q(areas__positions__is_active=True)
            ),
            critical_positions=Count(
                'areas__positions',
                filter=Q(
                    areas__positions__is_active=True,
                    areas__positions__is_critical=True
                )
            )
        )
        
        return queryset.order_by('-effective_date', '-version')
    
    @classmethod
    def get_optimized_areas_queryset(cls, chart_id: str) -> QuerySet:
        """
        Get optimized queryset for areas with hierarchical structure.
        
        Args:
            chart_id: Organizational chart ID
            
        Returns:
            Optimized QuerySet for Area
        """
        return Area.objects.select_related(
            'parent_area',
            'sede',
            'area_manager'
        ).prefetch_related(
            'positions',
            'positions__responsibilities',
            'positions__authorities',
            'child_areas'
        ).filter(
            organizational_chart_id=chart_id,
            is_active=True
        ).annotate(
            positions_count=Count('positions', filter=Q(positions__is_active=True)),
            child_areas_count=Count('child_areas', filter=Q(child_areas__is_active=True)),
            critical_positions_count=Count(
                'positions',
                filter=Q(positions__is_active=True, positions__is_critical=True)
            )
        ).order_by('hierarchy_level', 'code')
    
    @classmethod
    def get_optimized_positions_queryset(cls, chart_id: str = None, area_id: str = None) -> QuerySet:
        """
        Get optimized queryset for positions.
        
        Args:
            chart_id: Optional chart filter
            area_id: Optional area filter
            
        Returns:
            Optimized QuerySet for Cargo
        """
        queryset = Cargo.objects.select_related(
            'area',
            'reports_to'
        ).prefetch_related(
            'responsibilities',
            'authorities',
            'subordinates'
        ).filter(is_active=True)
        
        if chart_id:
            queryset = queryset.filter(area__organizational_chart_id=chart_id)
        
        if area_id:
            queryset = queryset.filter(area_id=area_id)
        
        # Add performance annotations
        queryset = queryset.annotate(
            responsibilities_count=Count(
                'responsibilities',
                filter=Q(responsibilities__is_active=True)
            ),
            authorities_count=Count(
                'authorities',
                filter=Q(authorities__is_active=True)
            ),
            subordinates_count=Count(
                'subordinates',
                filter=Q(subordinates__is_active=True)
            )
        )
        
        return queryset.order_by('area__hierarchy_level', 'code')
    
    @classmethod
    def get_chart_hierarchy_tree(cls, chart_id: str, use_cache: bool = True) -> Dict[str, Any]:
        """
        Get complete hierarchy tree for a chart with optimized queries.
        
        Args:
            chart_id: Organizational chart ID
            use_cache: Whether to use cached results
            
        Returns:
            Hierarchical tree structure
        """
        cache_key = f"chart_hierarchy_{chart_id}"
        
        if use_cache:
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.debug(f"Using cached hierarchy for chart {chart_id}")
                return cached_result
        
        try:
            # Get chart with optimized query
            chart = OrganizationalChart.objects.select_related(
                'organization', 'sector'
            ).get(id=chart_id, is_active=True)
            
            # Get all areas with their positions in one query
            areas_with_positions = Area.objects.select_related(
                'parent_area'
            ).prefetch_related(
                Prefetch(
                    'positions',
                    queryset=Cargo.objects.filter(is_active=True).select_related(
                        'reports_to'
                    ).only(
                        'id', 'code', 'name', 'hierarchy_level', 'is_critical',
                        'reports_to_id', 'area_id'
                    )
                )
            ).filter(
                organizational_chart=chart,
                is_active=True
            ).only(
                'id', 'code', 'name', 'area_type', 'hierarchy_level',
                'parent_area_id', 'organizational_chart_id'
            ).order_by('hierarchy_level', 'code')
            
            # Build hierarchy tree
            areas_map = {}
            root_areas = []
            
            # First pass: create area objects
            for area in areas_with_positions:
                area_data = {
                    'id': str(area.id),
                    'code': area.code,
                    'name': area.name,
                    'type': area.area_type,
                    'level': area.hierarchy_level,
                    'parent_id': str(area.parent_area_id) if area.parent_area_id else None,
                    'children': [],
                    'positions': [
                        {
                            'id': str(pos.id),
                            'code': pos.code,
                            'name': pos.name,
                            'level': pos.hierarchy_level,
                            'is_critical': pos.is_critical,
                            'reports_to_id': str(pos.reports_to_id) if pos.reports_to_id else None
                        }
                        for pos in area.positions.all()
                    ]
                }
                areas_map[str(area.id)] = area_data
                
                if not area.parent_area_id:
                    root_areas.append(area_data)
            
            # Second pass: build parent-child relationships
            for area_data in areas_map.values():
                parent_id = area_data['parent_id']
                if parent_id and parent_id in areas_map:
                    areas_map[parent_id]['children'].append(area_data)
            
            result = {
                'chart': {
                    'id': str(chart.id),
                    'organization': chart.organization.nombre_comercial,
                    'version': chart.version,
                    'sector': chart.sector.name
                },
                'hierarchy': root_areas,
                'statistics': {
                    'total_areas': len(areas_map),
                    'total_positions': sum(len(area['positions']) for area in areas_map.values()),
                    'hierarchy_levels': chart.hierarchy_levels
                },
                'generated_at': timezone.now().isoformat()
            }
            
            # Cache result
            if use_cache:
                cache.set(cache_key, result, cls.CACHE_TIMEOUT_MEDIUM)
                logger.debug(f"Cached hierarchy for chart {chart_id}")
            
            return result
            
        except OrganizationalChart.DoesNotExist:
            logger.error(f"Chart {chart_id} not found")
            return {}
        except Exception as e:
            logger.error(f"Error building hierarchy tree for chart {chart_id}: {str(e)}")
            return {}
    
    @classmethod
    def get_chart_statistics(cls, chart_id: str, use_cache: bool = True) -> Dict[str, Any]:
        """
        Get comprehensive statistics for a chart with optimized queries.
        
        Args:
            chart_id: Organizational chart ID
            use_cache: Whether to use cached results
            
        Returns:
            Chart statistics
        """
        cache_key = f"chart_stats_{chart_id}"
        
        if use_cache:
            cached_result = cache.get(cache_key)
            if cached_result:
                return cached_result
        
        try:
            # Single query to get all statistics
            chart = OrganizationalChart.objects.filter(
                id=chart_id,
                is_active=True
            ).annotate(
                # Area statistics
                total_areas=Count('areas', filter=Q(areas__is_active=True)),
                areas_by_level=Count(
                    'areas',
                    filter=Q(areas__is_active=True),
                    distinct=True
                ),
                
                # Position statistics
                total_positions=Count(
                    'areas__positions',
                    filter=Q(areas__positions__is_active=True)
                ),
                critical_positions=Count(
                    'areas__positions',
                    filter=Q(
                        areas__positions__is_active=True,
                        areas__positions__is_critical=True
                    )
                ),
                executive_positions=Count(
                    'areas__positions',
                    filter=Q(
                        areas__positions__is_active=True,
                        areas__positions__hierarchy_level='EXECUTIVE'
                    )
                ),
                
                # Responsibility statistics
                total_responsibilities=Count(
                    'areas__positions__responsibilities',
                    filter=Q(areas__positions__responsibilities__is_active=True)
                ),
                normative_responsibilities=Count(
                    'areas__positions__responsibilities',
                    filter=Q(
                        areas__positions__responsibilities__is_active=True,
                        areas__positions__responsibilities__is_normative_requirement=True
                    )
                ),
                
                # Authority statistics
                total_authorities=Count(
                    'areas__positions__authorities',
                    filter=Q(areas__positions__authorities__is_active=True)
                ),
                financial_authorities=Count(
                    'areas__positions__authorities',
                    filter=Q(
                        areas__positions__authorities__is_active=True,
                        areas__positions__authorities__decision_type='FINANCIAL'
                    )
                )
            ).first()
            
            if not chart:
                return {}
            
            # Get additional statistics with separate queries (more efficient than joins)
            areas_by_type = dict(
                Area.objects.filter(
                    organizational_chart=chart,
                    is_active=True
                ).values_list('area_type').annotate(count=Count('id'))
            )
            
            positions_by_level = dict(
                Cargo.objects.filter(
                    area__organizational_chart=chart,
                    is_active=True
                ).values_list('hierarchy_level').annotate(count=Count('id'))
            )
            
            result = {
                'chart_id': str(chart.id),
                'organization': chart.organization.nombre_comercial,
                'version': chart.version,
                'effective_date': chart.effective_date.isoformat(),
                'is_current': chart.is_current,
                
                # Structure statistics
                'structure': {
                    'total_areas': chart.total_areas,
                    'total_positions': chart.total_positions,
                    'hierarchy_levels': chart.hierarchy_levels,
                    'areas_by_type': areas_by_type,
                    'positions_by_level': positions_by_level
                },
                
                # Performance indicators
                'performance': {
                    'critical_positions': chart.critical_positions,
                    'executive_positions': chart.executive_positions,
                    'critical_position_ratio': (
                        chart.critical_positions / chart.total_positions * 100
                        if chart.total_positions > 0 else 0
                    ),
                    'positions_per_area': (
                        chart.total_positions / chart.total_areas
                        if chart.total_areas > 0 else 0
                    )
                },
                
                # Governance statistics
                'governance': {
                    'total_responsibilities': chart.total_responsibilities,
                    'normative_responsibilities': chart.normative_responsibilities,
                    'total_authorities': chart.total_authorities,
                    'financial_authorities': chart.financial_authorities,
                    'responsibilities_per_position': (
                        chart.total_responsibilities / chart.total_positions
                        if chart.total_positions > 0 else 0
                    )
                },
                
                'generated_at': timezone.now().isoformat()
            }
            
            # Cache result
            if use_cache:
                cache.set(cache_key, result, cls.CACHE_TIMEOUT_SHORT)
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating statistics for chart {chart_id}: {str(e)}")
            return {}
    
    @classmethod
    def get_bulk_validation_data(cls, chart_ids: List[str]) -> Dict[str, Any]:
        """
        Get validation data for multiple charts efficiently.
        
        Args:
            chart_ids: List of chart IDs to validate
            
        Returns:
            Bulk validation data
        """
        try:
            # Get all charts with their sectors in one query
            charts = OrganizationalChart.objects.select_related(
                'sector', 'organization'
            ).filter(
                id__in=chart_ids,
                is_active=True
            ).only(
                'id', 'version', 'hierarchy_levels', 'sector_id',
                'organization_id', 'compliance_status', 'last_validation_date'
            )
            
            # Get all areas for these charts
            chart_areas = Area.objects.filter(
                organizational_chart_id__in=chart_ids,
                is_active=True
            ).values(
                'organizational_chart_id'
            ).annotate(
                count=Count('id'),
                max_level=models.Max('hierarchy_level')
            )
            
            # Get all positions for these charts
            chart_positions = Cargo.objects.filter(
                area__organizational_chart_id__in=chart_ids,
                is_active=True
            ).values(
                'area__organizational_chart_id'
            ).annotate(
                total_count=Count('id'),
                critical_count=Count('id', filter=Q(is_critical=True))
            )
            
            # Build result dictionary
            results = {}
            areas_map = {item['organizational_chart_id']: item for item in chart_areas}
            positions_map = {item['area__organizational_chart_id']: item for item in chart_positions}
            
            for chart in charts:
                chart_id = str(chart.id)
                areas_data = areas_map.get(chart.id, {})
                positions_data = positions_map.get(chart.id, {})
                
                results[chart_id] = {
                    'chart_info': {
                        'id': chart_id,
                        'version': chart.version,
                        'organization': chart.organization.nombre_comercial,
                        'sector': chart.sector.name
                    },
                    'structure': {
                        'areas_count': areas_data.get('count', 0),
                        'positions_count': positions_data.get('total_count', 0),
                        'critical_positions': positions_data.get('critical_count', 0),
                        'hierarchy_levels': chart.hierarchy_levels,
                        'max_area_level': areas_data.get('max_level', 0)
                    },
                    'validation': {
                        'last_validated': (
                            chart.last_validation_date.isoformat()
                            if chart.last_validation_date else None
                        ),
                        'has_compliance_data': bool(chart.compliance_status),
                        'needs_validation': (
                            not chart.last_validation_date or
                            chart.last_validation_date < timezone.now() - timedelta(days=30)
                        )
                    }
                }
            
            return {
                'charts': results,
                'summary': {
                    'total_charts': len(results),
                    'needs_validation': sum(
                        1 for data in results.values()
                        if data['validation']['needs_validation']
                    ),
                    'total_areas': sum(
                        data['structure']['areas_count']
                        for data in results.values()
                    ),
                    'total_positions': sum(
                        data['structure']['positions_count']
                        for data in results.values()
                    )
                },
                'generated_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in bulk validation data: {str(e)}")
            return {'charts': {}, 'summary': {}, 'error': str(e)}
    
    @classmethod
    def invalidate_chart_cache(cls, chart_id: str):
        """
        Invalidate all cached data for a specific chart.
        
        Args:
            chart_id: Chart ID to invalidate
        """
        cache_keys = [
            f"chart_hierarchy_{chart_id}",
            f"chart_stats_{chart_id}",
            f"chart_validation_{chart_id}"
        ]
        
        cache.delete_many(cache_keys)
        logger.info(f"Invalidated cache for chart {chart_id}")
    
    @classmethod
    def warm_chart_cache(cls, chart_id: str):
        """
        Pre-populate cache with commonly accessed chart data.
        
        Args:
            chart_id: Chart ID to cache
        """
        try:
            # Generate and cache hierarchy tree
            cls.get_chart_hierarchy_tree(chart_id, use_cache=True)
            
            # Generate and cache statistics
            cls.get_chart_statistics(chart_id, use_cache=True)
            
            logger.info(f"Warmed cache for chart {chart_id}")
            
        except Exception as e:
            logger.error(f"Error warming cache for chart {chart_id}: {str(e)}")
    
    @classmethod
    def get_query_performance_report(cls) -> Dict[str, Any]:
        """
        Generate a report on query performance and database usage.
        
        Returns:
            Performance report
        """
        try:
            # Get query statistics from Django connection
            queries = connection.queries if hasattr(connection, 'queries') else []
            
            # Analyze chart-related queries
            chart_queries = [
                q for q in queries
                if any(table in q['sql'].lower() for table in [
                    'org_chart', 'org_area', 'org_position', 'org_responsibility'
                ])
            ]
            
            if chart_queries:
                total_time = sum(float(q['time']) for q in chart_queries)
                avg_time = total_time / len(chart_queries)
                slowest_query = max(chart_queries, key=lambda x: float(x['time']))
            else:
                total_time = avg_time = 0
                slowest_query = None
            
            return {
                'query_statistics': {
                    'total_queries': len(queries),
                    'chart_related_queries': len(chart_queries),
                    'total_time': total_time,
                    'average_time': avg_time,
                    'slowest_query': {
                        'sql': slowest_query['sql'][:200] + '...' if slowest_query else None,
                        'time': slowest_query['time'] if slowest_query else None
                    }
                },
                'cache_statistics': {
                    'cache_backend': str(cache.__class__),
                    'cache_recommendations': cls._get_cache_recommendations()
                },
                'recommendations': cls._get_performance_recommendations(
                    len(chart_queries), total_time
                ),
                'generated_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating performance report: {str(e)}")
            return {'error': str(e)}
    
    @classmethod
    def _get_cache_recommendations(cls) -> List[str]:
        """Get cache optimization recommendations."""
        recommendations = []
        
        # Check if Redis is being used
        if 'redis' not in str(cache.__class__).lower():
            recommendations.append(
                "Consider using Redis for better cache performance"
            )
        
        recommendations.extend([
            "Use cache warming for frequently accessed charts",
            "Implement cache invalidation on chart updates",
            "Monitor cache hit rates and adjust timeouts accordingly"
        ])
        
        return recommendations
    
    @classmethod
    def _get_performance_recommendations(cls, query_count: int, total_time: float) -> List[str]:
        """Get performance optimization recommendations."""
        recommendations = []
        
        if query_count > 50:
            recommendations.append(
                "High number of database queries detected. Consider using select_related and prefetch_related."
            )
        
        if total_time > 1.0:
            recommendations.append(
                "Slow query performance detected. Consider adding database indexes."
            )
        
        recommendations.extend([
            "Use optimized querysets provided by OrganizationalChartPerformanceService",
            "Implement pagination for large result sets",
            "Consider database connection pooling for high-traffic scenarios",
            "Monitor and analyze slow queries regularly"
        ])
        
        return recommendations