"""
Views for DIVIPOLA data management.

Provides API endpoints for accessing Colombian administrative division data
including departments and municipalities.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from typing import List, Dict, Any

from apps.organization.services.divipola_service import DivipolaService


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_departments(request) -> Response:
    """
    Get all Colombian departments.
    
    Returns:
        Response: List of departments with code and name
    """
    try:
        departments = DivipolaService.get_departments()
        return Response({
            'success': True,
            'data': departments,
            'count': len(departments)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_municipalities(request, department_code: str) -> Response:
    """
    Get municipalities for a specific department.
    
    Args:
        department_code: Department code (e.g., '05' for Antioquia)
        
    Returns:
        Response: List of municipalities with code and name
    """
    try:
        municipalities = DivipolaService.get_municipalities(department_code)
        return Response({
            'success': True,
            'data': municipalities,
            'count': len(municipalities),
            'department_code': department_code
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_municipalities(request) -> Response:
    """
    Search municipalities by name.
    
    Query Parameters:
        q: Search query
        department: Optional department filter
        
    Returns:
        Response: Matching municipalities
    """
    try:
        query = request.GET.get('q', '').strip()
        department_code = request.GET.get('department', '').strip()
        
        if not query:
            return Response({
                'success': False,
                'error': 'Query parameter "q" is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(query) < 2:
            return Response({
                'success': False,
                'error': 'Query must be at least 2 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        municipalities = DivipolaService.search_municipalities(
            query=query,
            department_code=department_code if department_code else None
        )
        
        return Response({
            'success': True,
            'data': municipalities,
            'count': len(municipalities),
            'query': query,
            'department_filter': department_code if department_code else None
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_major_cities(request) -> Response:
    """
    Get major Colombian cities.
    
    Returns:
        Response: Major cities data
    """
    try:
        cities = DivipolaService.get_major_cities()
        return Response({
            'success': True,
            'data': cities,
            'count': len(cities)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)