"""
REPS Service Importer.

Enhanced REPS Excel importer for health services.
Handles the 93-column REPS export format according to Resolution 3100/2019.
"""

import pandas as pd
import logging
import json
import numpy as np
import difflib
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from decimal import Decimal
from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.organization.models.sogcs_sedes import HeadquarterLocation
from apps.organization.models.health import HealthOrganization
from apps.organization.models.health_services import (
    SedeHealthService,
    ServiceImportLog,
    HealthServiceCatalog
)

logger = logging.getLogger(__name__)


class REPSServiceImporter:
    """
    Enhanced REPS Excel importer for health services.
    Handles the 93-column REPS export format.
    """
    
    # Column mappings for REPS Excel structure
    COLUMN_MAPPING = {
        # Basic identification
        'depa_nombre': 'department_name',
        'muni_nombre': 'municipality_name',
        'habi_codigo_habilitacion': 'habilitation_code',
        'numero_sede': 'sede_number',
        'sede_nombre': 'sede_name',
        'direccion': 'address',
        'telefono': 'phone',
        'email': 'email',
        'nits_nit': 'nit',
        'dv': 'verification_digit',
        
        # Service information
        'grse_codigo': 'service_group_code',
        'grse_nombre': 'service_group_name',
        'serv_codigo': 'service_code',
        'serv_nombre': 'service_name',
        
        # Modalities
        'ambulatorio': 'ambulatory',
        'hospitalario': 'hospital',
        'unidad_movil': 'mobile_unit',
        'domiciliario': 'domiciliary',
        'otras_extramural': 'other_extramural',
        'centro_referencia': 'is_reference_center',
        'institucion_remisora': 'is_referring_institution',
        
        # Complexity
        'complejidad_baja': 'low_complexity',
        'complejidad_media': 'medium_complexity',
        'complejidad_alta': 'high_complexity',
        'complejidades': 'complexity_level',
        
        # Dates and identifiers
        'fecha_apertura': 'opening_date',
        'fecha_cierre': 'closing_date',
        'numero_distintivo': 'distinctive_number',
        'numero_sede_principal': 'main_sede_number',
        
        # Schedule
        'horario_lunes': 'schedule_monday',
        'horario_martes': 'schedule_tuesday',
        'horario_miercoles': 'schedule_wednesday',
        'horario_jueves': 'schedule_thursday',
        'horario_viernes': 'schedule_friday',
        'horario_sabado': 'schedule_saturday',
        'horario_domingo': 'schedule_sunday',
        
        # Administrative
        'gerente': 'manager_name',
        'habilitado': 'is_enabled',
        'observaciones_serv_Res3100_2019': 'observations',
        'version_norma': 'norm_version',
        
        # Municipal classifications
        'Municipio PDET': 'is_pdet_municipality',
        'Municipio ZOMAC': 'is_zomac_municipality',
        'Municipio PNIS': 'is_pnis_municipality',
    }
    
    def __init__(self, organization: HealthOrganization, user, headquarters=None, update_existing=True):
        self.organization = organization
        self.user = user
        self.headquarters = headquarters
        self.update_existing = update_existing
        self.import_log = None
        self.errors = []
        self.warnings = []
        self.stats = {
            'total_rows': 0,
            'processed_rows': 0,
            'successful_rows': 0,
            'failed_rows': 0,
            'services_created': 0,
            'services_updated': 0,
            'services_disabled': 0,
            'headquarters_created': 0,
        }
    
    def _pandas_row_to_json_safe_dict(self, row: pd.Series) -> dict:
        """
        Convert pandas Series to JSON-safe dictionary.
        Handles NaN values, numpy types, and other pandas-specific data types.
        """
        safe_dict = {}
        for key, value in row.items():
            # Handle NaN and None values
            if pd.isna(value) or value is None:
                safe_dict[str(key)] = None
            # Handle numpy types
            elif isinstance(value, (np.integer, np.int64, np.int32)):
                safe_dict[str(key)] = int(value)
            elif isinstance(value, (np.floating, np.float64, np.float32)):
                safe_dict[str(key)] = float(value) if not np.isnan(value) else None
            elif isinstance(value, np.bool_):
                safe_dict[str(key)] = bool(value)
            elif isinstance(value, (np.ndarray,)):
                safe_dict[str(key)] = value.tolist()
            # Handle datetime types
            elif pd.api.types.is_datetime64_any_dtype(type(value)):
                safe_dict[str(key)] = value.isoformat() if pd.notna(value) else None
            # Handle strings and other types
            else:
                try:
                    # Test if the value is JSON serializable
                    json.dumps(value)
                    safe_dict[str(key)] = value
                except (TypeError, ValueError):
                    # Convert to string if not JSON serializable
                    safe_dict[str(key)] = str(value)
        
        return safe_dict
    
    def _find_existing_headquarters_by_similarity(self, sede_name: str) -> Optional[HeadquarterLocation]:
        """
        Find existing headquarters using intelligent matching:
        1. Exact name match (case insensitive)
        2. Fuzzy name match (>85% similarity)
        3. Same organization
        
        Returns existing headquarters if found, None otherwise.
        """
        if not sede_name or not sede_name.strip():
            return None
        
        cleaned_sede_name = sede_name.strip()
        
        # 1. Try exact match first (case insensitive)
        exact_match = HeadquarterLocation.objects.filter(
            organization=self.organization,
            name__iexact=cleaned_sede_name
        ).first()
        
        if exact_match:
            logger.debug(f"Found exact match for sede: {cleaned_sede_name} -> {exact_match.reps_code}")
            return exact_match
        
        # 2. Try fuzzy matching for similar names
        all_headquarters = HeadquarterLocation.objects.filter(
            organization=self.organization,
            deleted_at__isnull=True  # Only active headquarters
        )
        
        best_match = None
        best_similarity = 0.85  # Minimum 85% similarity threshold
        
        for hq in all_headquarters:
            # Compare normalized names (uppercase, no extra spaces)
            name1 = cleaned_sede_name.upper().replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U').replace('Ñ', 'N')
            name2 = hq.name.upper().replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U').replace('Ñ', 'N')
            
            similarity = difflib.SequenceMatcher(None, name1, name2).ratio()
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = hq
        
        if best_match:
            logger.info(f"Found fuzzy match for sede: {cleaned_sede_name} -> {best_match.name} "
                       f"(similarity: {best_similarity:.2%}, code: {best_match.reps_code})")
            return best_match
        
        logger.debug(f"No existing sede found for: {cleaned_sede_name}")
        return None
    
    def _merge_headquarters_data(self, existing_hq: HeadquarterLocation, row: pd.Series, sede_name: str) -> HeadquarterLocation:
        """
        Merge REPS data into existing headquarters while preserving critical local data.
        
        Strategy:
        - Keep existing reps_code (preserve referential integrity)
        - Update contact and location data from REPS
        - Preserve habilitation status (don't downgrade from 'habilitada' to 'en_proceso')
        - Add tracking of REPS update
        """
        # Update fields from REPS data while preserving key local data
        existing_hq.name = sede_name or existing_hq.name
        existing_hq.department_name = self._clean_value(row.get('depa_nombre', '')) or existing_hq.department_name
        existing_hq.municipality_name = self._clean_value(row.get('muni_nombre', '')) or existing_hq.municipality_name
        existing_hq.address = self._clean_value(row.get('direccion', '')) or existing_hq.address
        existing_hq.phone_primary = self._clean_value(row.get('telefono', '')) or existing_hq.phone_primary
        existing_hq.email = self._clean_value(row.get('email', '')) or existing_hq.email
        existing_hq.administrative_contact = self._clean_value(row.get('gerente', '')) or existing_hq.administrative_contact
        
        # Update department and municipality codes if available
        dept_code = self._extract_department_code(row)
        if dept_code:
            existing_hq.department_code = dept_code
            
        muni_code = self._extract_municipality_code(row)
        if muni_code:
            existing_hq.municipality_code = muni_code
        
        # Preserve habilitation status - don't downgrade
        if existing_hq.habilitation_status == 'habilitada':
            # Keep as 'habilitada', don't change to 'en_proceso'
            pass
        else:
            # If not already habilitada, update from REPS (could be improvement)
            existing_hq.habilitation_status = 'en_proceso'
        
        # Add REPS tracking
        existing_hq.last_reps_sync = timezone.now()
        existing_hq.sync_status = 'updated'
        
        # Preserve updated_by for audit trail
        existing_hq.updated_by = self.user
        
        existing_hq.save()
        
        logger.info(f"Merged REPS data into existing sede: {existing_hq.reps_code} - {existing_hq.name}")
        return existing_hq
    
    def import_from_file(self, file_path: str, file_name: str = None, file_size: int = 0) -> ServiceImportLog:
        """
        Main import method for REPS Excel files.
        """
        self.import_log = ServiceImportLog.objects.create(
            organization=self.organization,
            import_type='manual',
            file_name=file_name or 'servicios_reps.xls',
            file_size=file_size,
            status='processing',
            created_by=self.user,
            started_at=timezone.now()
        )
        
        try:
            # Read and parse the file
            df = self._read_reps_file(file_path)
            self.stats['total_rows'] = len(df)
            
            logger.info(f"Starting import of {self.stats['total_rows']} rows")
            
            # Process each row individually to avoid rollback cascade
            for index, row in df.iterrows():
                # Skip header row if present
                if index == 0 and str(row.get('depa_nombre', '')).lower() == 'depa_nombre':
                    continue
                
                try:
                    # Use savepoint for each row to allow recovery from errors
                    with transaction.atomic():
                        self._process_service_row(row, index + 1)
                        self.stats['processed_rows'] += 1
                except Exception as e:
                    self._handle_row_error(index + 1, str(e))
            
            # Update import log
            self._finalize_import()
            
        except Exception as e:
            logger.error(f"Import failed: {str(e)}", exc_info=True)
            self.errors.append(f"Critical error: {str(e)}")
            self.import_log.mark_as_failed(str(e))
            raise
        
        return self.import_log
    
    def _read_reps_file(self, file_path: str) -> pd.DataFrame:
        """
        Read REPS HTML-as-Excel file.
        """
        try:
            # Try reading as HTML table first
            try:
                tables = pd.read_html(file_path, encoding='utf-8')
                if tables:
                    df = tables[0]
                    logger.info("Successfully read file as HTML table")
                else:
                    raise ValueError("No tables found in HTML")
            except Exception:
                # Fall back to Excel reading
                df = pd.read_excel(file_path)
                logger.info("Successfully read file as Excel")
            
            # Use first row as column names if needed
            if len(df) > 0 and df.iloc[0, 0] == 'depa_nombre':
                df.columns = df.iloc[0].astype(str).str.strip()
                df = df.drop(df.index[0]).reset_index(drop=True)
            
            # Clean column names
            df.columns = [str(col).strip() for col in df.columns]
            
            logger.info(f"File contains {len(df)} rows and {len(df.columns)} columns")
            
            return df
            
        except Exception as e:
            logger.error(f"Error reading REPS file: {str(e)}")
            raise ValueError(f"Cannot read REPS file: {str(e)}")
    
    def _process_service_row(self, row: pd.Series, row_number: int):
        """
        Process a single service row from REPS.
        """
        try:
            # Extract sede information
            sede_number = self._clean_value(row.get('numero_sede'))
            sede_name = self._clean_value(row.get('sede_nombre'))
            
            if not sede_number:
                self.warnings.append(f"Row {row_number}: Missing sede number")
                return
            
            # Find or create headquarters
            headquarters = self._get_or_create_headquarters(row, sede_number, sede_name)
            
            # Extract service information
            service_data = self._extract_service_data(row)
            
            if not service_data.get('service_code') or not service_data.get('distinctive_number'):
                self.warnings.append(f"Row {row_number}: Missing service code or distinctive number")
                return
            
            # Create or update service
            self._create_or_update_service(headquarters, service_data, row)
            self.stats['successful_rows'] += 1
            
        except Exception as e:
            self._handle_row_error(row_number, str(e))
    
    def _get_or_create_headquarters(self, row: pd.Series, sede_number: str, sede_name: str) -> HeadquarterLocation:
        """
        Get existing headquarters using intelligent matching or create new one.
        
        Uses merge strategy:
        1. Try to find existing headquarters by name similarity
        2. If found, merge REPS data while preserving local data
        3. If not found, create new headquarters with REPS data
        """
        try:
            # Step 1: Try intelligent matching by name similarity
            existing_headquarters = self._find_existing_headquarters_by_similarity(sede_name)
            
            if existing_headquarters:
                # Step 2: Merge REPS data into existing headquarters
                merged_headquarters = self._merge_headquarters_data(existing_headquarters, row, sede_name)
                logger.info(f"Using existing headquarters (merged): {merged_headquarters.reps_code} - {merged_headquarters.name}")
                return merged_headquarters
            
            # Step 3: No match found, create new headquarters with REPS data
            reps_code = f"{self.organization.organization.nit}-{sede_number}"
            
            new_headquarters = HeadquarterLocation.objects.create(
                organization=self.organization,
                reps_code=reps_code,
                name=sede_name or f"Sede {sede_number}",
                sede_type='principal' if sede_number == '01' else 'satelite',
                department_code=self._extract_department_code(row),
                department_name=self._clean_value(row.get('depa_nombre', '')),
                municipality_code=self._extract_municipality_code(row),
                municipality_name=self._clean_value(row.get('muni_nombre', '')),
                address=self._clean_value(row.get('direccion', 'Por definir')),
                phone_primary=self._clean_value(row.get('telefono', '')),
                email=self._clean_value(row.get('email', 'info@example.com')),
                administrative_contact=self._clean_value(row.get('gerente', '')),
                habilitation_status='en_proceso',
                operational_status='activa',
                last_reps_sync=timezone.now(),
                sync_status='imported',
                created_by=self.user
            )
            
            self.stats['headquarters_created'] += 1
            logger.info(f"Created new headquarters from REPS: {reps_code} - {sede_name}")
            
            return new_headquarters
            
        except Exception as e:
            raise ValueError(f"Cannot get/create headquarters: {str(e)}")
    
    def _extract_service_data(self, row: pd.Series) -> Dict[str, Any]:
        """
        Extract and clean service data from REPS row.
        """
        data = {}
        
        # Basic service information
        data['service_code'] = self._clean_value(row.get('serv_codigo'))
        data['service_name'] = self._clean_value(row.get('serv_nombre'))
        data['service_group_code'] = self._clean_value(row.get('grse_codigo'))
        data['service_group_name'] = self._clean_value(row.get('grse_nombre'))
        
        # Modalities
        data['ambulatory'] = self._normalize_si_no(row.get('ambulatorio'))
        data['hospital'] = self._normalize_si_no(row.get('hospitalario'))
        data['mobile_unit'] = self._normalize_si_no(row.get('unidad_movil'))
        data['domiciliary'] = self._normalize_si_no(row.get('domiciliario'))
        data['other_extramural'] = self._normalize_si_no(row.get('otras_extramural'))
        
        # Service types
        data['is_reference_center'] = self._normalize_si_no(row.get('centro_referencia'))
        data['is_referring_institution'] = self._normalize_si_no(row.get('institucion_remisora'))
        
        # Complexity
        data['low_complexity'] = self._normalize_si_no(row.get('complejidad_baja'))
        data['medium_complexity'] = self._normalize_si_no(row.get('complejidad_media'))
        data['high_complexity'] = self._normalize_si_no(row.get('complejidad_alta'))
        data['complexity_level'] = self._normalize_complexity(row.get('complejidades', 'SD'))
        
        # Dates and identifiers
        data['opening_date'] = self._clean_value(row.get('fecha_apertura'))
        data['closing_date'] = self._clean_value(row.get('fecha_cierre'))
        data['distinctive_number'] = self._clean_value(row.get('numero_distintivo'))
        data['main_sede_number'] = self._clean_value(row.get('numero_sede_principal'))
        
        # Schedule
        schedule = {}
        for day in ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']:
            schedule_value = self._clean_value(row.get(f'horario_{day}'))
            if schedule_value:
                schedule[day] = schedule_value
        data['schedule'] = schedule
        
        # Telemedicine modalities
        telemedicine = {}
        telemedicine_fields = [
            'modalidad_intramural',
            'modalidad_telemedicina',
            'modalidad_prestador_referencia',
            'modalidad_prestador_remisor'
        ]
        for field in telemedicine_fields:
            value = self._normalize_si_no(row.get(field))
            if value == 'SI':
                telemedicine[field] = True
        data['telemedicine_modality'] = telemedicine
        
        # Service specificities
        specificities = {}
        for col in row.index:
            if col.startswith('especificidad_'):
                value = self._normalize_si_no(row.get(col))
                if value == 'SI':
                    specificities[col] = True
        data['specificities'] = specificities
        
        # Administrative
        data['is_enabled'] = self._normalize_si_no(row.get('habilitado')) == 'SI'
        data['observations'] = self._clean_value(row.get('observaciones_serv_Res3100_2019'))
        data['norm_version'] = self._clean_value(row.get('version_norma', 'RESOLUCION_3100'))
        data['manager_name'] = self._clean_value(row.get('gerente'))
        
        # Municipal classifications
        data['is_pdet_municipality'] = self._normalize_si_no(row.get('Municipio PDET')) == 'SI'
        data['is_zomac_municipality'] = self._normalize_si_no(row.get('Municipio ZOMAC')) == 'SI'
        data['is_pnis_municipality'] = self._normalize_si_no(row.get('Municipio PNIS')) == 'SI'
        
        return data
    
    def _create_or_update_service(self, headquarters: HeadquarterLocation, 
                                  service_data: Dict[str, Any], 
                                  raw_row: pd.Series):
        """
        Create or update a health service.
        """
        try:
            # Try to find existing service
            service = SedeHealthService.objects.filter(
                headquarters=headquarters,
                distinctive_number=service_data['distinctive_number']
            ).first()
            
            if service and self.update_existing:
                # Update existing service
                for key, value in service_data.items():
                    setattr(service, key, value)
                service.reps_import_date = timezone.now()
                service.updated_by = self.user
                service.save()
                self.stats['services_updated'] += 1
                logger.debug(f"Updated service: {service_data['distinctive_number']}")
            elif not service:
                # Create new service
                service = SedeHealthService.objects.create(
                    headquarters=headquarters,
                    **service_data,
                    reps_import_date=timezone.now(),
                    reps_raw_data=self._pandas_row_to_json_safe_dict(raw_row),
                    created_by=self.user
                )
                self.stats['services_created'] += 1
                logger.debug(f"Created service: {service_data['distinctive_number']}")
            
            # Link to catalog if available
            self._link_to_catalog(service)
            
        except IntegrityError as e:
            raise ValueError(f"Integrity error creating service: {str(e)}")
    
    def _link_to_catalog(self, service: SedeHealthService):
        """
        Link service to master catalog if available.
        """
        try:
            catalog_entry = HealthServiceCatalog.objects.filter(
                service_code=service.service_code
            ).first()
            
            if catalog_entry:
                service.service_catalog = catalog_entry
                service.save(update_fields=['service_catalog'])
        except Exception as e:
            logger.warning(f"Could not link to catalog: {str(e)}")
    
    def _clean_value(self, value) -> str:
        """Clean and normalize string values."""
        if pd.isna(value) or value is None:
            return ''
        return str(value).strip()
    
    def _normalize_si_no(self, value) -> str:
        """Normalize SI/NO/SD values."""
        if pd.isna(value) or value is None:
            return 'SD'
        
        value = str(value).upper().strip()
        if value in ['SI', 'SÍ', 'YES', 'S', '1', 'TRUE']:
            return 'SI'
        elif value in ['NO', 'N', '0', 'FALSE']:
            return 'NO'
        else:
            return 'SD'
    
    def _normalize_complexity(self, value) -> str:
        """Normalize complexity values."""
        if pd.isna(value) or value is None:
            return 'SD'
        
        value = str(value).upper().strip()
        if value in ['BAJA', 'LOW', 'BAJO']:
            return 'BAJA'
        elif value in ['MEDIANA', 'MEDIA', 'MEDIUM', 'MED']:
            return 'MEDIANA'
        elif value in ['ALTA', 'HIGH', 'ALTO']:
            return 'ALTA'
        else:
            return 'SD'
    
    def _extract_department_code(self, row: pd.Series) -> str:
        """Extract department code from DIVIPOLA data."""
        # Try to get from municipality code if available
        muni_code = self._clean_value(row.get('codigo_municipio'))
        if muni_code and len(muni_code) >= 5:
            return muni_code[:2]
        
        # Default values based on common departments
        dept_name = self._clean_value(row.get('depa_nombre')).upper()
        dept_mapping = {
            'ANTIOQUIA': '05',
            'ATLANTICO': '08',
            'BOGOTA': '11',
            'BOLIVAR': '13',
            'BOYACA': '15',
            'CALDAS': '17',
            'CAQUETA': '18',
            'CAUCA': '19',
            'CESAR': '20',
            'CUNDINAMARCA': '25',
            'HUILA': '41',
            'MAGDALENA': '47',
            'NARINO': '52',
            'NORTE DE SANTANDER': '54',
            'QUINDIO': '63',
            'RISARALDA': '66',
            'SANTANDER': '68',
            'TOLIMA': '73',
            'VALLE DEL CAUCA': '76',
        }
        return dept_mapping.get(dept_name, '00')
    
    def _extract_municipality_code(self, row: pd.Series) -> str:
        """Extract municipality code."""
        muni_code = self._clean_value(row.get('codigo_municipio'))
        if muni_code and len(muni_code) == 5:
            return muni_code
        
        # Generate a default based on department
        dept_code = self._extract_department_code(row)
        return f"{dept_code}001"  # Default to capital
    
    def _handle_row_error(self, row_number: int, error_message: str):
        """Handle errors during row processing."""
        self.stats['failed_rows'] += 1
        error_msg = f"Row {row_number}: {error_message}"
        self.errors.append(error_msg)
        logger.error(error_msg)
    
    def _finalize_import(self):
        """
        Finalize the import process and update log.
        """
        self.import_log.completed_at = timezone.now()
        self.import_log.status = 'completed' if not self.errors else 'partial'
        
        # Calculate processing time
        if self.import_log.started_at:
            delta = self.import_log.completed_at - self.import_log.started_at
            self.import_log.processing_time = delta.total_seconds()
        
        # Update statistics
        for key, value in self.stats.items():
            setattr(self.import_log, key, value)
        
        self.import_log.errors = self.errors
        self.import_log.warnings = self.warnings
        self.import_log.save()
        
        logger.info(f"Import completed: {self.stats}")