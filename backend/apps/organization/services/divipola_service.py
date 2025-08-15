"""
DIVIPOLA Service

Service for handling Colombian administrative division data (departments and municipalities).
"""

from typing import List, Dict, Any, Optional
from django.core.cache import cache


class DivipolaService:
    """
    Service class for handling DIVIPOLA (Colombian administrative divisions) data.
    """
    
    CACHE_TIMEOUT = 60 * 60 * 24  # 24 hours
    
    @staticmethod
    def get_departments() -> List[Dict[str, Any]]:
        """
        Get all Colombian departments.
        
        Returns:
            List[Dict]: List of departments with code and name
        """
        cache_key = 'divipola_departments'
        departments = cache.get(cache_key)
        
        if departments is None:
            # Basic Colombian departments data
            departments = [
                {'code': '05', 'name': 'Antioquia'},
                {'code': '08', 'name': 'Atlántico'},
                {'code': '11', 'name': 'Bogotá D.C.'},
                {'code': '13', 'name': 'Bolívar'},
                {'code': '15', 'name': 'Boyacá'},
                {'code': '17', 'name': 'Caldas'},
                {'code': '18', 'name': 'Caquetá'},
                {'code': '19', 'name': 'Cauca'},
                {'code': '20', 'name': 'Cesar'},
                {'code': '23', 'name': 'Córdoba'},
                {'code': '25', 'name': 'Cundinamarca'},
                {'code': '27', 'name': 'Chocó'},
                {'code': '41', 'name': 'Huila'},
                {'code': '44', 'name': 'La Guajira'},
                {'code': '47', 'name': 'Magdalena'},
                {'code': '50', 'name': 'Meta'},
                {'code': '52', 'name': 'Nariño'},
                {'code': '54', 'name': 'Norte de Santander'},
                {'code': '63', 'name': 'Quindío'},
                {'code': '66', 'name': 'Risaralda'},
                {'code': '68', 'name': 'Santander'},
                {'code': '70', 'name': 'Sucre'},
                {'code': '73', 'name': 'Tolima'},
                {'code': '76', 'name': 'Valle del Cauca'},
                {'code': '81', 'name': 'Arauca'},
                {'code': '85', 'name': 'Casanare'},
                {'code': '86', 'name': 'Putumayo'},
                {'code': '88', 'name': 'Archipiélago de San Andrés, Providencia y Santa Catalina'},
                {'code': '91', 'name': 'Amazonas'},
                {'code': '94', 'name': 'Guainía'},
                {'code': '95', 'name': 'Guaviare'},
                {'code': '97', 'name': 'Vaupés'},
                {'code': '99', 'name': 'Vichada'},
            ]
            
            cache.set(cache_key, departments, DivipolaService.CACHE_TIMEOUT)
        
        return departments
    
    @staticmethod
    def get_municipalities(department_code: str) -> List[Dict[str, Any]]:
        """
        Get municipalities for a specific department.
        
        Args:
            department_code: Department code (e.g., '05' for Antioquia)
            
        Returns:
            List[Dict]: List of municipalities with code and name
        """
        cache_key = f'divipola_municipalities_{department_code}'
        municipalities = cache.get(cache_key)
        
        if municipalities is None:
            # Sample municipalities for major departments
            municipalities_data = {
                '05': [  # Antioquia
                    {'code': '05001', 'name': 'Medellín'},
                    {'code': '05088', 'name': 'Bello'},
                    {'code': '05360', 'name': 'Itagüí'},
                    {'code': '05631', 'name': 'La Estrella'},
                    {'code': '05659', 'name': 'Sabaneta'},
                    {'code': '05266', 'name': 'Envigado'},
                ],
                '11': [  # Bogotá D.C.
                    {'code': '11001', 'name': 'Bogotá D.C.'},
                ],
                '76': [  # Valle del Cauca
                    {'code': '76001', 'name': 'Cali'},
                    {'code': '76834', 'name': 'Yumbo'},
                    {'code': '76364', 'name': 'Jamundí'},
                    {'code': '76520', 'name': 'Palmira'},
                ],
                '68': [  # Santander
                    {'code': '68001', 'name': 'Bucaramanga'},
                    {'code': '68276', 'name': 'Floridablanca'},
                    {'code': '68307', 'name': 'Girón'},
                    {'code': '68547', 'name': 'Piedecuesta'},
                ],
                '08': [  # Atlántico
                    {'code': '08001', 'name': 'Barranquilla'},
                    {'code': '08758', 'name': 'Soledad'},
                    {'code': '08520', 'name': 'Malambo'},
                    {'code': '08549', 'name': 'Puerto Colombia'},
                ],
            }
            
            municipalities = municipalities_data.get(department_code, [])
            cache.set(cache_key, municipalities, DivipolaService.CACHE_TIMEOUT)
        
        return municipalities
    
    @staticmethod
    def search_municipalities(
        query: str, 
        department_code: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search municipalities by name.
        
        Args:
            query: Search query
            department_code: Optional department filter
            
        Returns:
            List[Dict]: Matching municipalities
        """
        all_municipalities = []
        
        if department_code:
            # Search within specific department
            municipalities = DivipolaService.get_municipalities(department_code)
            all_municipalities.extend(municipalities)
        else:
            # Search across all departments
            departments = DivipolaService.get_departments()
            for dept in departments:
                municipalities = DivipolaService.get_municipalities(dept['code'])
                all_municipalities.extend(municipalities)
        
        # Filter by query
        query_lower = query.lower()
        matching = [
            muni for muni in all_municipalities
            if query_lower in muni['name'].lower()
        ]
        
        return matching[:20]  # Limit results
    
    @staticmethod
    def get_major_cities() -> List[Dict[str, Any]]:
        """
        Get major Colombian cities.
        
        Returns:
            List[Dict]: Major cities data
        """
        return [
            {'code': '11001', 'name': 'Bogotá D.C.', 'department': 'Bogotá D.C.'},
            {'code': '05001', 'name': 'Medellín', 'department': 'Antioquia'},
            {'code': '76001', 'name': 'Cali', 'department': 'Valle del Cauca'},
            {'code': '08001', 'name': 'Barranquilla', 'department': 'Atlántico'},
            {'code': '68001', 'name': 'Bucaramanga', 'department': 'Santander'},
            {'code': '54001', 'name': 'Cúcuta', 'department': 'Norte de Santander'},
            {'code': '17001', 'name': 'Manizales', 'department': 'Caldas'},
            {'code': '66001', 'name': 'Pereira', 'department': 'Risaralda'},
            {'code': '73001', 'name': 'Ibagué', 'department': 'Tolima'},
            {'code': '20001', 'name': 'Valledupar', 'department': 'Cesar'},
        ]