"""
REPS Capacity Importer Service

This service handles the import of installed capacity data from REPS
(Registro Especial de Prestadores de Servicios de Salud) files.
Supports XLS, XLSX, CSV, and HTML formats from the REPS portal.

Complies with Resolution 3100/2019 and SOGCS requirements.
"""

import pandas as pd
import os
import logging
from typing import Dict, List, Optional, Tuple, Any, Union
from django.db import transaction, IntegrityError
from django.db.models import Q
from django.utils import timezone
from django.core.exceptions import ValidationError
from difflib import SequenceMatcher
import tempfile
import json

from apps.organization.models.sogcs_sedes import HeadquarterLocation
from apps.organization.models.capacity import (
    CapacidadInstalada, 
    CapacidadHistorial, 
    CapacidadImportLog,
    GRUPO_CAPACIDAD_CHOICES,
    MODALIDADES_AMBULANCIA,
)

logger = logging.getLogger(__name__)


class REPSCapacityParsingError(Exception):
    """Exception raised when REPS capacity file parsing fails."""
    pass


class REPSCapacityValidationError(Exception):
    """Exception raised when capacity data validation fails.""" 
    pass


class REPSCapacityImporter:
    """
    Service class for importing capacity data from REPS files.
    
    Handles multiple file formats and provides comprehensive validation,
    error handling, and audit logging capabilities.
    """
    
    # Expected columns in REPS capacity files
    EXPECTED_COLUMNS = {
        # Main identification columns
        'depa_nombre': 'str',
        'muni_nombre': 'str', 
        'codigo_habilitacion': 'str',
        'numero_sede': 'str',
        'sede_nombre': 'str',
        'grupo_capacidad': 'str',
        'codigo_concepto': 'str',
        'concepto': 'str',
        'cantidad': 'int',
        # Optional columns for vehicles
        'numero_placa': 'str',
        'modalidad': 'str',
        'modelo': 'str',
        'numero_tarjeta': 'str',
    }
    
    # Mapping of REPS groups to internal groups
    GRUPO_MAPPING = {
        'CAMAS': 'CAMAS',
        'CAMILLAS': 'CAMILLAS', 
        'CONSULTORIOS': 'CONSULTORIOS',
        'SALAS': 'SALAS',
        'AMBULANCIAS': 'AMBULANCIAS',
        'SILLAS': 'SILLAS',
        'MESAS': 'MESAS',
        'EQUIPOS': 'EQUIPOS',
        'OTROS': 'OTROS',
        # Alternative names that might appear in REPS
        'CAMA': 'CAMAS',
        'CAMILLA': 'CAMILLAS',
        'CONSULTORIO': 'CONSULTORIOS',
        'SALA': 'SALAS',
        'AMBULANCIA': 'AMBULANCIAS',
        'SILLA': 'SILLAS',
        'MESA': 'MESAS',
        'EQUIPO': 'EQUIPOS',
    }
    
    def __init__(self, organization, user=None, validation_only=False):
        """
        Initialize the importer.
        
        Args:
            organization: HealthOrganization instance
            user: User performing the import (optional)
            validation_only: If True, only validate without importing
        """
        self.organization = organization
        self.user = user
        self.validation_only = validation_only
        self.errors = []
        self.warnings = []
        self.imported_records = []
        self.updated_records = []
        self.skipped_records = []
        
        # Statistics
        self.total_rows = 0
        self.successful_rows = 0
        self.failed_rows = 0
        
    def import_from_file(self, file_path: str, file_name: str, file_size: int) -> CapacidadImportLog:
        """
        Main import method that orchestrates the entire import process.
        
        Args:
            file_path: Path to the file to import
            file_name: Original filename
            file_size: File size in bytes
            
        Returns:
            CapacidadImportLog: Import log with results and statistics
        """
        start_time = timezone.now()
        
        # Create import log
        import_log = CapacidadImportLog.objects.create(
            sede_prestadora=self.organization.headquarters_locations.first() if self.organization.headquarters_locations.exists() else None,
            nombre_archivo=file_name,
            tamaño_archivo=file_size,
            formato_archivo=self._get_file_format(file_name),
            estado_importacion='iniciada',
            fecha_inicio=start_time,
            created_by=self.user
        )
        
        try:
            # Parse the file
            logger.info(f"Starting capacity import from {file_name}")
            df = self._parse_file(file_path, file_name)
            
            if df.empty:
                raise REPSCapacityParsingError("El archivo no contiene datos válidos")
            
            self.total_rows = len(df)
            import_log.total_registros = self.total_rows
            import_log.estado_importacion = 'procesando'
            import_log.save()
            
            # Process each row
            if not self.validation_only:
                self._process_capacity_data(df, import_log)
            else:
                self._validate_capacity_data(df)
            
            # Finalize import log
            end_time = timezone.now()
            duration = (end_time - start_time).total_seconds()
            
            import_log.registros_importados = len(self.imported_records)
            import_log.registros_actualizados = len(self.updated_records)
            import_log.registros_con_error = self.failed_rows
            import_log.errores = self.errors
            import_log.advertencias = self.warnings
            import_log.fecha_finalizacion = end_time
            import_log.duracion_segundos = int(duration)
            
            # Determine final status
            if self.failed_rows == 0:
                import_log.estado_importacion = 'completada'
            elif self.successful_rows > 0:
                import_log.estado_importacion = 'completada_con_errores'
            else:
                import_log.estado_importacion = 'fallida'
            
            # Generate statistics
            import_log.estadisticas = self._generate_statistics()
            import_log.save()
            
            logger.info(f"Capacity import completed: {self.successful_rows}/{self.total_rows} records processed")
            
            return import_log
            
        except Exception as e:
            logger.error(f"Capacity import failed: {str(e)}", exc_info=True)
            
            # Update import log with error
            import_log.estado_importacion = 'fallida'
            import_log.errores = self.errors + [f"Error crítico: {str(e)}"]
            import_log.fecha_finalizacion = timezone.now()
            import_log.duracion_segundos = int((timezone.now() - start_time).total_seconds())
            import_log.save()
            
            return import_log
    
    def _detect_file_format(self, file_path: str) -> str:
        """
        Detect the actual file format by reading the file content.
        
        Args:
            file_path: Path to the file
            
        Returns:
            str: Detected format ('html', 'excel', 'csv', 'unknown')
        """
        try:
            with open(file_path, 'rb') as f:
                first_bytes = f.read(512)  # Read first 512 bytes
                
            # Check for HTML markers
            html_markers = [b'<html', b'<!DOCTYPE', b'<table', b'<HTML', b'<!doctype']
            if any(marker in first_bytes.lower() for marker in html_markers):
                return 'html'
            
            # Check for Excel markers (ZIP signature for .xlsx or OLE signature for .xls)
            if first_bytes.startswith(b'PK\x03\x04'):  # ZIP signature (.xlsx)
                return 'excel'
            elif first_bytes.startswith(b'\xd0\xcf\x11\xe0'):  # OLE signature (.xls)
                return 'excel'
            elif first_bytes.startswith(b'\x09\x08'):  # Alternative .xls signature
                return 'excel'
            
            # Check for CSV patterns
            try:
                text_content = first_bytes.decode('utf-8', errors='ignore')
                if ',' in text_content or ';' in text_content:
                    lines = text_content.split('\n')[:5]  # Check first 5 lines
                    csv_like = all(',' in line or ';' in line for line in lines if line.strip())
                    if csv_like:
                        return 'csv'
            except:
                pass
                
            return 'unknown'
            
        except Exception as e:
            logger.warning(f"Could not detect file format: {str(e)}")
            return 'unknown'
    
    def _parse_file(self, file_path: str, file_name: str) -> pd.DataFrame:
        """
        Parse the capacity file based on its format.
        
        Args:
            file_path: Path to the file
            file_name: Original filename
            
        Returns:
            pd.DataFrame: Parsed data
        """
        file_extension = os.path.splitext(file_name)[1].lower()
        
        try:
            # First, detect the actual file format by reading the first few bytes
            actual_format = self._detect_file_format(file_path)
            
            if actual_format == 'html':
                # File is actually HTML (even if extension says .xls)
                logger.info(f"Detected HTML content in file {file_name}, parsing as HTML")
                df = self._parse_html_file(file_path)
            elif file_extension in ['.xls', '.xlsx'] and actual_format == 'excel':
                df = self._parse_excel_file(file_path)
            elif file_extension == '.csv':
                df = self._parse_csv_file(file_path)
            elif file_extension in ['.html', '.htm']:
                df = self._parse_html_file(file_path)
            else:
                raise REPSCapacityParsingError(f"Formato de archivo no soportado: {file_extension}")
            
            # Normalize column names
            df = self._normalize_columns(df)
            
            # Validate required columns
            self._validate_required_columns(df)
            
            return df
            
        except Exception as e:
            raise REPSCapacityParsingError(f"Error parsing file: {str(e)}")
    
    def _parse_excel_file(self, file_path: str) -> pd.DataFrame:
        """Parse Excel file from REPS export."""
        try:
            # Try to read the Excel file, handling various formats
            df = pd.read_excel(file_path, engine='openpyxl')
            
            # Skip empty rows and reset index
            df = df.dropna(how='all').reset_index(drop=True)
            
            return df
            
        except Exception as e:
            # Try with xlrd engine for older .xls files
            try:
                df = pd.read_excel(file_path, engine='xlrd')
                df = df.dropna(how='all').reset_index(drop=True)
                return df
            except:
                raise REPSCapacityParsingError(f"No se pudo leer el archivo Excel: {str(e)}")
    
    def _parse_csv_file(self, file_path: str) -> pd.DataFrame:
        """Parse CSV file from REPS export."""
        try:
            # Try different encodings common in REPS exports
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(file_path, encoding=encoding, sep=';')
                    if not df.empty:
                        return df.dropna(how='all').reset_index(drop=True)
                except UnicodeDecodeError:
                    continue
            
            # If all encodings fail, try with default
            df = pd.read_csv(file_path)
            return df.dropna(how='all').reset_index(drop=True)
            
        except Exception as e:
            raise REPSCapacityParsingError(f"No se pudo leer el archivo CSV: {str(e)}")
    
    def _parse_html_file(self, file_path: str) -> pd.DataFrame:
        """Parse HTML file from REPS web export."""
        logger.info("Parsing HTML file from REPS")
        
        # Try different approaches to parse REPS HTML files
        parsing_strategies = [
            # Strategy 1: Standard pandas read_html with UTF-8
            lambda: pd.read_html(file_path, encoding='utf-8', header=0),
            # Strategy 2: Try with latin-1 encoding
            lambda: pd.read_html(file_path, encoding='latin-1', header=0), 
            # Strategy 3: Try without header assumption
            lambda: pd.read_html(file_path, encoding='utf-8'),
            # Strategy 4: Try with different table matching
            lambda: pd.read_html(file_path, encoding='utf-8', match='capacidad|CAPACIDAD|Capacidad'),
        ]
        
        df = None
        strategy_used = None
        
        for i, strategy in enumerate(parsing_strategies, 1):
            try:
                logger.info(f"Trying HTML parsing strategy {i}")
                tables = strategy()
                
                if not tables:
                    logger.warning(f"Strategy {i}: No tables found")
                    continue
                
                logger.info(f"Strategy {i}: Found {len(tables)} table(s)")
                
                # Find the table with capacity data
                for j, table in enumerate(tables):
                    logger.info(f"Table {j+1}: Shape {table.shape}, Columns: {list(table.columns)[:5]}")
                    
                    # Look for tables with more than 5 columns and at least 1 row of data
                    if table.shape[1] >= 5 and table.shape[0] > 0:
                        # Clean the table
                        table_clean = table.dropna(how='all').reset_index(drop=True)
                        if table_clean.shape[0] > 0:
                            df = table_clean
                            strategy_used = i
                            logger.info(f"Successfully parsed with strategy {i}, table {j+1}")
                            break
                
                if df is not None:
                    break
                    
            except Exception as e:
                logger.warning(f"Strategy {i} failed: {str(e)}")
                continue
        
        if df is None:
            raise REPSCapacityParsingError("No se pudieron encontrar tablas de capacidad válidas en el archivo HTML")
        
        logger.info(f"Final parsed table shape: {df.shape}")
        logger.info(f"Columns found: {list(df.columns)}")
        
        return df
    
    def _normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize column names to match expected format.
        """
        # Create a mapping of possible column names to standard names
        column_mapping = {
            'departamento': 'depa_nombre',
            'depa_nombre': 'depa_nombre',
            'municipio': 'muni_nombre', 
            'muni_nombre': 'muni_nombre',
            'código sede prestador': 'codigo_habilitacion',
            'codigo_habilitacion': 'codigo_habilitacion',
            'habi_codigo_habilitacion': 'codigo_habilitacion',  # REPS format
            'código de la sede': 'numero_sede',
            'numero_sede': 'numero_sede',
            'nombre sede prestador': 'sede_nombre',
            'sede_nombre': 'sede_nombre',
            'grupo': 'grupo_capacidad',
            'grupo_capacidad': 'grupo_capacidad',
            'concepto': 'concepto',
            'coca_nombre': 'concepto',  # REPS format
            'código concepto': 'codigo_concepto',
            'codigo_concepto': 'codigo_concepto',
            'coca_codigo': 'codigo_concepto',  # REPS format
            'cantidad': 'cantidad',
            'número de placa': 'numero_placa',
            'numero_placa': 'numero_placa',
            'modalidad': 'modalidad',
            'modelo': 'modelo',
            'tarjeta de propiedad': 'numero_tarjeta',
            'numero_tarjeta': 'numero_tarjeta',
        }
        
        # Normalize column names (lowercase, remove special chars)
        normalized_columns = {}
        for col in df.columns:
            normalized = col.lower().strip().replace('  ', ' ')
            if normalized in column_mapping:
                normalized_columns[col] = column_mapping[normalized]
        
        # Rename columns
        df = df.rename(columns=normalized_columns)
        
        return df
    
    def _validate_required_columns(self, df: pd.DataFrame):
        """
        Validate that required columns are present.
        """
        required = ['depa_nombre', 'muni_nombre', 'codigo_habilitacion', 
                   'numero_sede', 'sede_nombre', 'grupo_capacidad', 'concepto', 'cantidad']
        
        missing = [col for col in required if col not in df.columns]
        
        if missing:
            available_cols = list(df.columns)
            raise REPSCapacityParsingError(
                f"Columnas requeridas faltantes: {missing}. "
                f"Columnas disponibles: {available_cols}"
            )
    
    def _process_capacity_data(self, df: pd.DataFrame, import_log: CapacidadImportLog):
        """
        Process and import capacity data from DataFrame.
        """
        logger.info(f"Processing {len(df)} capacity records")
        
        for index, row in df.iterrows():
            try:
                # Use atomic transaction for each row to ensure isolation
                with transaction.atomic():
                    self._process_capacity_row(row, index, import_log)
                    self.successful_rows += 1
                    
            except Exception as e:
                error_msg = f"Fila {index + 2}: {str(e)}"
                self.errors.append(error_msg)
                self.failed_rows += 1
                logger.warning(f"Failed to process row {index}: {str(e)}")
                continue
    
    def _process_capacity_row(self, row: pd.Series, row_index: int, import_log: CapacidadImportLog):
        """
        Process a single capacity row.
        """
        # Extract and validate basic data
        depa_nombre = str(row.get('depa_nombre', '')).strip().upper()
        muni_nombre = str(row.get('muni_nombre', '')).strip().upper()
        codigo_habilitacion = str(row.get('codigo_habilitacion', '')).strip()
        numero_sede = str(row.get('numero_sede', '01')).strip()
        sede_nombre = str(row.get('sede_nombre', '')).strip()
        grupo_capacidad = str(row.get('grupo_capacidad', '')).strip().upper()
        concepto = str(row.get('concepto', '')).strip()
        cantidad = self._parse_int_value(row.get('cantidad', 0))
        
        # Optional fields
        numero_placa = str(row.get('numero_placa', '')).strip()
        modalidad = str(row.get('modalidad', '')).strip()
        modelo = str(row.get('modelo', '')).strip()
        numero_tarjeta = str(row.get('numero_tarjeta', '')).strip()
        
        # Validate required fields
        if not all([codigo_habilitacion, sede_nombre, grupo_capacidad, concepto]):
            raise REPSCapacityValidationError("Campos obligatorios faltantes")
        
        # Map grupo_capacidad to internal format
        mapped_group = self.GRUPO_MAPPING.get(grupo_capacidad)
        if not mapped_group:
            # Try fuzzy matching
            best_match = self._find_best_group_match(grupo_capacidad)
            if best_match:
                mapped_group = best_match
                self.warnings.append(
                    f"Fila {row_index + 2}: Grupo '{grupo_capacidad}' mapeado a '{mapped_group}'"
                )
            else:
                mapped_group = 'OTROS'
                self.warnings.append(
                    f"Fila {row_index + 2}: Grupo desconocido '{grupo_capacidad}', usando 'OTROS'"
                )
        
        # Find the matching headquarters
        sede = self._find_matching_headquarters(
            codigo_habilitacion, numero_sede, sede_nombre, 
            depa_nombre, muni_nombre
        )
        
        if not sede:
            raise REPSCapacityValidationError(
                f"No se encontró sede coincidente para {codigo_habilitacion}-{numero_sede}"
            )
        
        # Generate codigo_concepto from concepto if not provided
        codigo_concepto = str(row.get('codigo_concepto', '')).strip()
        if not codigo_concepto:
            codigo_concepto = self._generate_concepto_code(concepto, mapped_group)
        
        # Create or update capacity record
        capacity_data = {
            'sede_prestadora': sede,
            'grupo_capacidad': mapped_group,
            'codigo_concepto': codigo_concepto,
            'nombre_concepto': concepto,
            'cantidad': cantidad,
            'cantidad_habilitada': cantidad,  # Assume all capacity is enabled by default
            'cantidad_funcionando': cantidad,
            'estado_capacidad': 'activa',
            'numero_placa': numero_placa if numero_placa else '',
            'modalidad_ambulancia': modalidad if modalidad and mapped_group == 'AMBULANCIAS' else '',
            'modelo_vehiculo': modelo[:4] if modelo else '',  # Max 4 chars
            'numero_tarjeta_propiedad': numero_tarjeta,
            'fecha_corte_reps': timezone.now(),
            'sincronizado_reps': True,
            'observaciones': f'Importado desde REPS - {import_log.nombre_archivo}',
            'created_by': self.user,
            'updated_by': self.user,
        }
        
        # Handle unique constraint (sede + concepto + placa)
        unique_key = {
            'sede_prestadora': sede,
            'codigo_concepto': codigo_concepto,
            'numero_placa': numero_placa if numero_placa else '',
        }
        
        try:
            capacity, created = CapacidadInstalada.objects.update_or_create(
                **unique_key,
                defaults=capacity_data
            )
            
            if created:
                self.imported_records.append(capacity.id)
                # Create history record
                CapacidadHistorial.objects.create(
                    capacidad=capacity,
                    accion='importacion',
                    valor_nuevo=json.dumps(capacity_data, default=str, ensure_ascii=False),
                    justificacion=f'Importación inicial desde REPS - {import_log.nombre_archivo}',
                    origen_cambio='importacion',
                    created_by=self.user
                )
            else:
                self.updated_records.append(capacity.id)
                # Create history record for update
                CapacidadHistorial.objects.create(
                    capacidad=capacity,
                    accion='sincronizacion',
                    valor_nuevo=json.dumps(capacity_data, default=str, ensure_ascii=False),
                    justificacion=f'Actualización desde REPS - {import_log.nombre_archivo}',
                    origen_cambio='sincronizacion',
                    created_by=self.user
                )
            
        except IntegrityError as e:
            raise REPSCapacityValidationError(f"Error de integridad: {str(e)}")
    
    def _validate_capacity_data(self, df: pd.DataFrame):
        """
        Validate capacity data without importing.
        """
        logger.info(f"Validating {len(df)} capacity records")
        
        for index, row in df.iterrows():
            try:
                # Basic validation checks
                codigo_habilitacion = str(row.get('codigo_habilitacion', '')).strip()
                sede_nombre = str(row.get('sede_nombre', '')).strip()
                grupo_capacidad = str(row.get('grupo_capacidad', '')).strip().upper()
                concepto = str(row.get('concepto', '')).strip()
                cantidad = self._parse_int_value(row.get('cantidad', 0))
                
                # Check required fields
                if not all([codigo_habilitacion, sede_nombre, grupo_capacidad, concepto]):
                    raise REPSCapacityValidationError("Campos obligatorios faltantes")
                
                # Check valid group
                if not self.GRUPO_MAPPING.get(grupo_capacidad):
                    self.warnings.append(
                        f"Fila {index + 2}: Grupo desconocido '{grupo_capacidad}'"
                    )
                
                # Check valid quantity
                if cantidad < 0:
                    raise REPSCapacityValidationError("La cantidad no puede ser negativa")
                
                self.successful_rows += 1
                
            except Exception as e:
                error_msg = f"Fila {index + 2}: {str(e)}"
                self.errors.append(error_msg)
                self.failed_rows += 1
    
    def _find_matching_headquarters(self, codigo_habilitacion: str, numero_sede: str, 
                                   sede_nombre: str, depa_nombre: str, muni_nombre: str) -> Optional[HeadquarterLocation]:
        """
        Find the best matching headquarters using multiple strategies for reconciliation.
        """
        headquarters = HeadquarterLocation.objects.filter(
            organization=self.organization,
            deleted_at__isnull=True
        )
        
        # Strategy 1: Exact match by REPS code or similar identifiers
        if codigo_habilitacion:
            # Look for exact matches in various code fields
            exact_code_matches = headquarters.filter(
                Q(reps_code__iexact=codigo_habilitacion) |
                Q(reps_code__icontains=codigo_habilitacion[:10])  # Match first 10 chars
            )
            
            if exact_code_matches.count() == 1:
                return exact_code_matches.first()
            elif exact_code_matches.count() > 1:
                # Multiple matches, try to narrow down by sede number
                if numero_sede and numero_sede != '01':
                    sede_filtered = exact_code_matches.filter(numero_sede=numero_sede)
                    if sede_filtered.exists():
                        return sede_filtered.first()
                # If no sede number match, use first one
                return exact_code_matches.first()
        
        # Strategy 2: Fuzzy name matching with location context
        best_match = None
        best_score = 0.0
        
        for hq in headquarters:
            # Base name similarity
            name_similarity = SequenceMatcher(None, 
                sede_nombre.upper().strip(), 
                hq.name.upper().strip()
            ).ratio()
            
            # Location bonuses
            location_bonus = 0.0
            
            # Check department match
            if hasattr(hq, 'department') and depa_nombre:
                dept_similarity = SequenceMatcher(None,
                    depa_nombre.upper(), 
                    hq.department.upper() if hq.department else ''
                ).ratio()
                if dept_similarity > 0.8:
                    location_bonus += 0.15
            
            # Check municipality match  
            if hasattr(hq, 'municipality') and muni_nombre:
                muni_similarity = SequenceMatcher(None,
                    muni_nombre.upper(),
                    hq.municipality.upper() if hq.municipality else ''
                ).ratio()
                if muni_similarity > 0.8:
                    location_bonus += 0.15
            
            # Check if code partially matches (common scenario with different sede numbers)
            code_bonus = 0.0
            if codigo_habilitacion and hasattr(hq, 'reps_code') and hq.reps_code:
                # Check if the base code matches (ignoring last digit which might be sede number)
                base_reps_code = codigo_habilitacion[:-1] if len(codigo_habilitacion) > 1 else codigo_habilitacion
                base_hq_code = hq.reps_code[:-1] if len(hq.reps_code) > 1 else hq.reps_code
                
                if base_reps_code == base_hq_code:
                    code_bonus += 0.2
                elif codigo_habilitacion in hq.reps_code or hq.reps_code in codigo_habilitacion:
                    code_bonus += 0.1
            
            total_score = name_similarity + location_bonus + code_bonus
            
            # Lower threshold for acceptance, focus on best match
            if total_score > best_score and total_score > 0.6:  # 60% similarity threshold
                best_match = hq
                best_score = total_score
        
        # Strategy 3: If still no good match, try partial name matching
        if not best_match and sede_nombre:
            # Try matching on key words in the name
            name_words = sede_nombre.upper().split()
            key_words = [word for word in name_words if len(word) > 3]  # Words longer than 3 chars
            
            if key_words:
                for hq in headquarters:
                    hq_name_upper = hq.name.upper()
                    matches = sum(1 for word in key_words if word in hq_name_upper)
                    match_ratio = matches / len(key_words)
                    
                    if match_ratio >= 0.5:  # At least 50% of key words match
                        if not best_match or match_ratio > best_score:
                            best_match = hq
                            best_score = match_ratio
        
        # Strategy 4: Last resort - use any available headquarters for this organization
        if not best_match:
            # Log this scenario for manual review
            logger.warning(
                f"No good match found for sede: {codigo_habilitacion}-{numero_sede} '{sede_nombre}'. "
                f"Using first available headquarters for organization."
            )
            best_match = headquarters.first()
        
        if best_match:
            logger.info(
                f"Matched REPS sede '{sede_nombre}' ({codigo_habilitacion}) "
                f"to headquarters '{best_match.name}' (score: {best_score:.2f})"
            )
        
        return best_match
    
    def _find_best_group_match(self, grupo_capacidad: str) -> Optional[str]:
        """
        Find the best matching capacity group using fuzzy matching.
        """
        best_match = None
        best_score = 0.0
        
        for reps_group, internal_group in self.GRUPO_MAPPING.items():
            similarity = SequenceMatcher(None, 
                grupo_capacidad.upper(), 
                reps_group.upper()
            ).ratio()
            
            if similarity > best_score and similarity > 0.8:  # 80% similarity threshold
                best_match = internal_group
                best_score = similarity
        
        return best_match
    
    def _generate_concepto_code(self, concepto: str, grupo: str) -> str:
        """
        Generate a concept code based on concept name and group.
        """
        # This is a simplified implementation - in practice, you might want
        # to maintain a mapping table of concept names to official REPS codes
        concepto_clean = concepto.upper().replace(' ', '_')
        return f"{grupo[:3]}_{concepto_clean[:10]}"
    
    def _parse_int_value(self, value: Any) -> int:
        """
        Safely parse integer value from various formats.
        """
        if pd.isna(value) or value is None:
            return 0
        
        if isinstance(value, (int, float)):
            return int(value)
        
        # Handle string values
        str_value = str(value).strip().replace(',', '').replace('.', '')
        
        try:
            return int(float(str_value))
        except (ValueError, TypeError):
            return 0
    
    def _get_file_format(self, file_name: str) -> str:
        """
        Determine file format from filename.
        """
        extension = os.path.splitext(file_name)[1].lower()
        
        format_mapping = {
            '.xls': 'xls',
            '.xlsx': 'xlsx', 
            '.csv': 'csv',
            '.html': 'html',
            '.htm': 'html',
        }
        
        return format_mapping.get(extension, 'unknown')
    
    def _generate_statistics(self) -> Dict[str, Any]:
        """
        Generate detailed import statistics.
        """
        return {
            'total_rows': self.total_rows,
            'successful_rows': self.successful_rows,
            'failed_rows': self.failed_rows,
            'success_rate': (self.successful_rows / self.total_rows * 100) if self.total_rows > 0 else 0,
            'imported_count': len(self.imported_records),
            'updated_count': len(self.updated_records),
            'warning_count': len(self.warnings),
            'error_count': len(self.errors),
            'processed_groups': self._get_processed_groups_stats(),
        }
    
    def _get_processed_groups_stats(self) -> Dict[str, int]:
        """
        Get statistics by capacity group.
        """
        if not self.imported_records and not self.updated_records:
            return {}
        
        all_records = self.imported_records + self.updated_records
        
        if not all_records:
            return {}
        
        # Query capacity records to get group statistics
        from django.db.models import Count
        
        stats = CapacidadInstalada.objects.filter(
            id__in=all_records
        ).values('grupo_capacidad').annotate(
            count=Count('id')
        )
        
        return {item['grupo_capacidad']: item['count'] for item in stats}


def import_capacity_from_file(file_path: str, organization, user=None, 
                             validation_only: bool = False) -> CapacidadImportLog:
    """
    Utility function to import capacity from a file.
    
    Args:
        file_path: Path to the capacity file
        organization: HealthOrganization instance
        user: User performing the import
        validation_only: If True, only validate without importing
        
    Returns:
        CapacidadImportLog: Import results
    """
    file_name = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    
    importer = REPSCapacityImporter(
        organization=organization,
        user=user,
        validation_only=validation_only
    )
    
    return importer.import_from_file(file_path, file_name, file_size)