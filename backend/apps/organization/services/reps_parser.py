"""
REPS Excel Parser Service.

This service handles parsing of Excel files from the REPS portal
(Registro Especial de Prestadores de Servicios de Salud).
"""

import logging
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from django.utils import timezone
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


class REPSExcelParser:
    """
    Parser for Excel files from MinSalud REPS portal.
    
    Handles extraction and validation of headquarters and services data
    from official REPS Excel exports.
    """
    
    # Expected column mappings for headquarters sheet
    HEADQUARTERS_COLUMNS = {
        'codigo_habilitacion': 'reps_code',
        'nombre_prestador': 'name',
        'tipo_identificacion': 'id_type',
        'numero_identificacion': 'id_number',
        'codigo_sede': 'sede_code',
        'nombre_sede': 'sede_name',
        'direccion': 'address',
        'telefono': 'phone_primary',
        'email': 'email',
        'departamento': 'department_name',
        'municipio': 'municipality_name',
        'codigo_departamento': 'department_code',
        'codigo_municipio': 'municipality_code',
        'estado': 'habilitation_status',
        'fecha_habilitacion': 'habilitation_date',
        'resolucion': 'habilitation_resolution',
        'modalidad': 'sede_type',
        'gerente': 'administrative_contact',
        'celular': 'phone_secondary',
    }
    
    # Expected column mappings for services sheet
    SERVICES_COLUMNS = {
        'codigo_sede': 'sede_code',
        'codigo_servicio': 'service_code',
        'nombre_servicio': 'service_name',
        'grupo_servicio': 'service_group',
        'complejidad': 'complexity_level',
        'modalidad': 'modality',
        'fecha_habilitacion': 'habilitation_date',
        'fecha_vencimiento': 'habilitation_expiry',
        'estado': 'habilitation_status',
        'capacidad_instalada': 'installed_capacity',
        'distintivo': 'distinctive_code',
        'cups': 'cups_code',
        'intramural': 'intramural',
        'extramural': 'extramural',
        'domiciliaria': 'domiciliary',
        'telemedicina': 'telemedicine',
    }
    
    # Valid department codes (DIVIPOLA)
    VALID_DEPARTMENTS = {
        '05': 'Antioquia',
        '08': 'Atlántico',
        '11': 'Bogotá D.C.',
        '13': 'Bolívar',
        '15': 'Boyacá',
        '17': 'Caldas',
        '18': 'Caquetá',
        '19': 'Cauca',
        '20': 'Cesar',
        '23': 'Córdoba',
        '25': 'Cundinamarca',
        '27': 'Chocó',
        '41': 'Huila',
        '44': 'La Guajira',
        '47': 'Magdalena',
        '50': 'Meta',
        '52': 'Nariño',
        '54': 'Norte de Santander',
        '63': 'Quindío',
        '66': 'Risaralda',
        '68': 'Santander',
        '70': 'Sucre',
        '73': 'Tolima',
        '76': 'Valle del Cauca',
        '81': 'Arauca',
        '85': 'Casanare',
        '86': 'Putumayo',
        '88': 'San Andrés y Providencia',
        '91': 'Amazonas',
        '94': 'Guainía',
        '95': 'Guaviare',
        '97': 'Vaupés',
        '99': 'Vichada',
    }
    
    def __init__(self):
        """Initialize the parser."""
        self.errors = []
        self.warnings = []
        
    def parse_headquarters_file(self, file_path: str) -> Dict[str, Any]:
        """
        Parse headquarters data from REPS Excel file.
        
        Args:
            file_path: Path to the Excel file or file-like object
            
        Returns:
            Dictionary with parsed data and validation results
        """
        self.errors = []
        self.warnings = []
        
        try:
            # Read Excel file
            df_headquarters = self._read_headquarters_sheet(file_path)
            df_services = self._read_services_sheet(file_path)
            
            # Validate structure
            if not self._validate_headquarters_columns(df_headquarters):
                return {
                    'is_valid': False,
                    'errors': self.errors,
                    'warnings': self.warnings,
                    'headquarters': [],
                    'services': []
                }
            
            # Clean and normalize data
            df_headquarters = self._clean_headquarters_data(df_headquarters)
            df_services = self._clean_services_data(df_services) if df_services is not None else None
            
            # Validate DIVIPOLA codes
            df_headquarters = self._validate_divipola_codes(df_headquarters)
            
            # Map to internal format
            headquarters = self._map_headquarters_data(df_headquarters)
            services = self._map_services_data(df_services) if df_services is not None else []
            
            # Generate preview
            preview = self._generate_preview(headquarters, services)
            
            return {
                'is_valid': len(self.errors) == 0,
                'headquarters': headquarters,
                'services': services,
                'errors': self.errors,
                'warnings': self.warnings,
                'preview': preview
            }
            
        except Exception as e:
            logger.error(f"Error parsing REPS file: {str(e)}")
            self.errors.append(f"Error general al procesar archivo: {str(e)}")
            return {
                'is_valid': False,
                'errors': self.errors,
                'warnings': self.warnings,
                'headquarters': [],
                'services': []
            }
    
    def _read_headquarters_sheet(self, file_path) -> pd.DataFrame:
        """Read headquarters sheet from Excel file."""
        try:
            # Try different possible sheet names
            possible_sheets = ['SEDES', 'Sedes', 'sedes', 'SEDE', 'Sede', 'sede', 'Sheet1', 0]
            
            for sheet in possible_sheets:
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet)
                    if not df.empty:
                        return df
                except:
                    continue
            
            # If no valid sheet found, try first sheet
            df = pd.read_excel(file_path, sheet_name=0)
            return df
            
        except Exception as e:
            self.errors.append(f"Error al leer hoja de sedes: {str(e)}")
            return pd.DataFrame()
    
    def _read_services_sheet(self, file_path) -> Optional[pd.DataFrame]:
        """Read services sheet from Excel file."""
        try:
            # Try different possible sheet names
            possible_sheets = ['SERVICIOS', 'Servicios', 'servicios', 'SERVICIO', 'Servicio', 'servicio', 'Sheet2', 1]
            
            for sheet in possible_sheets:
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet)
                    if not df.empty:
                        return df
                except:
                    continue
            
            # Services sheet is optional
            self.warnings.append("No se encontró hoja de servicios en el archivo")
            return None
            
        except Exception as e:
            self.warnings.append(f"No se pudo leer hoja de servicios: {str(e)}")
            return None
    
    def _validate_headquarters_columns(self, df: pd.DataFrame) -> bool:
        """Validate that required columns exist in headquarters sheet."""
        if df.empty:
            self.errors.append("El archivo de sedes está vacío")
            return False
        
        # Normalize column names
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
        
        # Check for required columns
        required_columns = [
            'codigo_habilitacion',
            'nombre_sede',
            'direccion',
            'departamento',
            'municipio'
        ]
        
        missing_columns = []
        for col in required_columns:
            if col not in df.columns:
                # Try to find similar columns
                similar = [c for c in df.columns if col[:5] in c or c[:5] in col]
                if similar:
                    self.warnings.append(f"Columna '{col}' no encontrada, usando '{similar[0]}'")
                else:
                    missing_columns.append(col)
        
        if missing_columns:
            self.errors.append(f"Columnas requeridas faltantes: {', '.join(missing_columns)}")
            return False
        
        return True
    
    def _clean_headquarters_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize headquarters data."""
        # Remove empty rows
        df = df.dropna(how='all')
        
        # Normalize column names
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
        
        # Clean string columns
        string_columns = df.select_dtypes(include=['object']).columns
        for col in string_columns:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace('nan', '')
        
        # Parse dates
        date_columns = ['fecha_habilitacion', 'fecha_renovacion']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # Clean phone numbers
        if 'telefono' in df.columns:
            df['telefono'] = df['telefono'].str.replace(r'[^\d\s\-\(\)ext.]', '', regex=True)
        
        # Clean email addresses
        if 'email' in df.columns:
            df['email'] = df['email'].str.lower()
        
        return df
    
    def _clean_services_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and normalize services data."""
        if df is None or df.empty:
            return df
        
        # Remove empty rows
        df = df.dropna(how='all')
        
        # Normalize column names
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
        
        # Clean string columns
        string_columns = df.select_dtypes(include=['object']).columns
        for col in string_columns:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace('nan', '')
        
        # Parse dates
        date_columns = ['fecha_habilitacion', 'fecha_vencimiento']
        for col in date_columns:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # Parse complexity level
        if 'complejidad' in df.columns:
            df['complejidad'] = df['complejidad'].str.extract(r'(\d+)', expand=False).fillna(1).astype(int)
        
        # Parse boolean columns
        bool_columns = ['intramural', 'extramural', 'domiciliaria', 'telemedicina']
        for col in bool_columns:
            if col in df.columns:
                df[col] = df[col].str.lower().isin(['si', 'sí', 'yes', 'true', '1'])
        
        return df
    
    def _validate_divipola_codes(self, df: pd.DataFrame) -> pd.DataFrame:
        """Validate and fix DIVIPOLA codes for departments and municipalities."""
        if 'codigo_departamento' not in df.columns:
            # Try to infer from department name
            if 'departamento' in df.columns:
                df['codigo_departamento'] = df['departamento'].apply(self._get_department_code)
        
        # Validate department codes
        if 'codigo_departamento' in df.columns:
            invalid_codes = df[~df['codigo_departamento'].isin(self.VALID_DEPARTMENTS.keys())]
            if not invalid_codes.empty:
                self.warnings.append(f"Se encontraron {len(invalid_codes)} códigos de departamento inválidos")
        
        return df
    
    def _get_department_code(self, department_name: str) -> str:
        """Get department code from name."""
        department_name = department_name.upper().strip()
        
        for code, name in self.VALID_DEPARTMENTS.items():
            if name.upper() in department_name or department_name in name.upper():
                return code
        
        # Default to Bogotá if not found
        self.warnings.append(f"No se pudo identificar código para departamento: {department_name}")
        return '11'
    
    def _map_headquarters_data(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Map dataframe to headquarters model format."""
        headquarters = []
        
        for _, row in df.iterrows():
            try:
                hq_data = {}
                
                # Map columns using the mapping dictionary
                for excel_col, model_field in self.HEADQUARTERS_COLUMNS.items():
                    if excel_col in row.index:
                        value = row[excel_col]
                        if pd.notna(value):
                            if isinstance(value, pd.Timestamp):
                                value = value.date()
                            hq_data[model_field] = value
                
                # Set default values
                hq_data.setdefault('operational_status', 'activa')
                hq_data.setdefault('sede_type', 'principal')
                hq_data.setdefault('sync_status', 'success')
                hq_data.setdefault('sync_errors', [])
                
                # Parse capacity fields if present
                capacity_fields = ['total_beds', 'icu_beds', 'emergency_beds', 'surgery_rooms', 'consultation_rooms']
                for field in capacity_fields:
                    if field in row.index:
                        try:
                            hq_data[field] = int(row[field]) if pd.notna(row[field]) else 0
                        except:
                            hq_data[field] = 0
                
                headquarters.append(hq_data)
                
            except Exception as e:
                self.warnings.append(f"Error procesando sede {row.get('codigo_habilitacion', 'Unknown')}: {str(e)}")
        
        return headquarters
    
    def _map_services_data(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Map dataframe to services model format."""
        if df is None or df.empty:
            return []
        
        services = []
        
        for _, row in df.iterrows():
            try:
                service_data = {}
                
                # Map columns using the mapping dictionary
                for excel_col, model_field in self.SERVICES_COLUMNS.items():
                    if excel_col in row.index:
                        value = row[excel_col]
                        if pd.notna(value):
                            if isinstance(value, pd.Timestamp):
                                value = value.date()
                            service_data[model_field] = value
                
                # Set default values
                service_data.setdefault('habilitation_status', 'activo')
                service_data.setdefault('complexity_level', 1)
                service_data.setdefault('intramural', True)
                service_data.setdefault('extramural', False)
                service_data.setdefault('domiciliary', False)
                service_data.setdefault('telemedicine', False)
                
                # Parse capacity as JSON
                if 'installed_capacity' in service_data:
                    try:
                        if isinstance(service_data['installed_capacity'], str):
                            service_data['installed_capacity'] = {'value': int(service_data['installed_capacity'])}
                        elif isinstance(service_data['installed_capacity'], (int, float)):
                            service_data['installed_capacity'] = {'value': int(service_data['installed_capacity'])}
                    except:
                        service_data['installed_capacity'] = {}
                
                services.append(service_data)
                
            except Exception as e:
                self.warnings.append(f"Error procesando servicio {row.get('codigo_servicio', 'Unknown')}: {str(e)}")
        
        return services
    
    def _generate_preview(self, headquarters: List[Dict], services: List[Dict]) -> Dict[str, Any]:
        """Generate preview summary of parsed data."""
        preview = {
            'headquarters_count': len(headquarters),
            'services_count': len(services),
            'departments': [],
            'service_groups': [],
            'sample_headquarters': [],
            'sample_services': []
        }
        
        if headquarters:
            # Get unique departments
            departments = set()
            for hq in headquarters:
                if 'department_name' in hq:
                    departments.add(hq['department_name'])
            preview['departments'] = list(departments)[:10]
            
            # Sample headquarters
            preview['sample_headquarters'] = [
                {
                    'reps_code': hq.get('reps_code', ''),
                    'name': hq.get('name', ''),
                    'department': hq.get('department_name', ''),
                    'municipality': hq.get('municipality_name', '')
                }
                for hq in headquarters[:5]
            ]
        
        if services:
            # Get unique service groups
            service_groups = set()
            for service in services:
                if 'service_group' in service:
                    service_groups.add(service['service_group'])
            preview['service_groups'] = list(service_groups)
            
            # Sample services
            preview['sample_services'] = [
                {
                    'service_code': service.get('service_code', ''),
                    'service_name': service.get('service_name', ''),
                    'complexity_level': service.get('complexity_level', 1)
                }
                for service in services[:5]
            ]
        
        return preview
    
    def validate_service_codes(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Validate service codes against official catalog.
        
        This would typically check against an official service catalog
        from Resolution 3100/2019.
        """
        # Implementation would check against official service codes
        # For now, just validate format
        if 'codigo_servicio' in df.columns:
            invalid = df[~df['codigo_servicio'].str.match(r'^\d{3,4}$', na=False)]
            if not invalid.empty:
                self.warnings.append(f"Se encontraron {len(invalid)} códigos de servicio con formato inválido")
        
        return df
    
    def validate_service_modalities(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Validate that service modalities are allowed for each service type.
        
        Some services can only be provided in specific modalities.
        """
        # Implementation would check service-specific modality restrictions
        # based on Resolution 3100/2019 requirements
        return df
    
    def validate_complexity_levels(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Validate complexity levels by service type.
        
        Certain services require minimum complexity levels.
        """
        # Implementation would check service-specific complexity requirements
        # For example, ICU services require complexity level 3 or 4
        if 'service_group' in df.columns and 'complexity_level' in df.columns:
            icu_services = df[df['service_group'].str.contains('intensivos', case=False, na=False)]
            low_complexity_icu = icu_services[icu_services['complexity_level'] < 3]
            if not low_complexity_icu.empty:
                self.warnings.append(f"Se encontraron {len(low_complexity_icu)} servicios de UCI con complejidad menor a III")
        
        return df