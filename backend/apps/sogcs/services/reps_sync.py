"""
REPS Synchronization Service
Servicio para sincronización con el Registro Especial de Prestadores de Servicios de Salud (REPS)
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from django.db import transaction, IntegrityError

logger = logging.getLogger(__name__)

# Import the HeadquarterLocation model
from apps.organization.models.sogcs_sedes import HeadquarterLocation


class REPSSyncError(Exception):
    """Excepción personalizada para errores de sincronización con REPS"""
    pass


class REPSSynchronizationService:
    """
    Servicio para sincronización con el sistema REPS
    """

    def __init__(self, organization=None, user=None):
        self.base_url = "https://reps.minsalud.gov.co/api"
        self.timeout = 30
        self.organization = organization
        self.user = user

    def sync_organization_data(self, organization_id: int, reps_code: str) -> Dict[str, Any]:
        """
        Sincroniza datos de organización con REPS
        """
        try:
            # Mock implementation - En producción se conectaría al API real de REPS
            mock_data = {
                'reps_code': reps_code,
                'organization_name': 'IPS Ejemplo',
                'nit': '123456789-1',
                'legal_representative': 'Juan Pérez',
                'address': 'Carrera 15 # 20-30',
                'city': 'Bogotá',
                'department': 'Cundinamarca',
                'phone': '3001234567',
                'enabled_services': [
                    {
                        'service_code': '101',
                        'service_name': 'Consulta Externa en Medicina General',
                        'complexity_level': 'BAJA',
                        'enabled_date': '2024-01-15',
                        'expiration_date': '2025-01-15',
                        'status': 'ACTIVE'
                    },
                    {
                        'service_code': '301',
                        'service_name': 'Urgencias',
                        'complexity_level': 'MEDIA',
                        'enabled_date': '2024-02-01',
                        'expiration_date': '2025-02-01',
                        'status': 'ACTIVE'
                    }
                ],
                'last_sync': datetime.now().isoformat(),
                'sync_status': 'SUCCESS'
            }
            
            logger.info(f"Sincronización REPS exitosa para organización {organization_id}")
            return mock_data
            
        except Exception as e:
            logger.error(f"Error en sincronización REPS: {str(e)}")
            raise REPSSyncError(f"No se pudo sincronizar con REPS: {str(e)}")

    def validate_reps_code(self, reps_code: str) -> bool:
        """
        Valida si un código REPS es válido
        """
        try:
            # Mock validation - En producción verificaría contra REPS real
            if not reps_code or len(reps_code) < 6:
                return False
            
            # Simulación de validación exitosa
            return True
            
        except Exception as e:
            logger.error(f"Error validando código REPS {reps_code}: {str(e)}")
            return False

    def get_enabled_services(self, reps_code: str) -> List[Dict[str, Any]]:
        """
        Obtiene servicios habilitados desde REPS
        """
        try:
            # Mock data - En producción consultaría REPS real
            services = [
                {
                    'service_code': '101',
                    'service_name': 'Consulta Externa en Medicina General',
                    'complexity_level': 'BAJA',
                    'enabled_date': '2024-01-15',
                    'expiration_date': '2025-01-15',
                    'status': 'ACTIVE',
                    'headquarters': 'Sede Principal'
                },
                {
                    'service_code': '301',
                    'service_name': 'Urgencias',
                    'complexity_level': 'MEDIA',
                    'enabled_date': '2024-02-01',
                    'expiration_date': '2025-02-01',
                    'status': 'ACTIVE',
                    'headquarters': 'Sede Principal'
                },
                {
                    'service_code': '205',
                    'service_name': 'Laboratorio Clínico',
                    'complexity_level': 'BAJA',
                    'enabled_date': '2024-03-01',
                    'expiration_date': '2025-03-01',
                    'status': 'PENDING_RENEWAL',
                    'headquarters': 'Sede Secundaria'
                }
            ]
            
            logger.info(f"Servicios REPS obtenidos para código {reps_code}: {len(services)} servicios")
            return services
            
        except Exception as e:
            logger.error(f"Error obteniendo servicios REPS: {str(e)}")
            raise REPSSyncError(f"No se pudieron obtener servicios de REPS: {str(e)}")

    def check_service_expiration_alerts(self, reps_code: str, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """
        Verifica servicios próximos a vencer
        """
        try:
            # Mock data - En producción consultaría fechas reales
            alerts = [
                {
                    'service_code': '205',
                    'service_name': 'Laboratorio Clínico',
                    'expiration_date': '2024-12-15',
                    'days_until_expiration': 28,
                    'priority': 'HIGH',
                    'action_required': 'RENEWAL_PROCESS'
                }
            ]
            
            logger.info(f"Alertas de vencimiento para {reps_code}: {len(alerts)} servicios")
            return alerts
            
        except Exception as e:
            logger.error(f"Error verificando vencimientos REPS: {str(e)}")
            raise REPSSyncError(f"No se pudieron verificar vencimientos: {str(e)}")

    def get_sync_status(self, organization_id: int) -> Dict[str, Any]:
        """
        Obtiene el estado de la última sincronización
        """
        try:
            # Mock status - En producción consultaría base de datos
            status = {
                'last_sync_date': datetime.now().isoformat(),
                'sync_status': 'SUCCESS',
                'services_synced': 3,
                'errors_count': 0,
                'warnings_count': 1,
                'next_sync_scheduled': '2024-11-18T02:00:00',
                'auto_sync_enabled': True
            }
            
            return status
            
        except Exception as e:
            logger.error(f"Error obteniendo estado de sincronización: {str(e)}")
            return {
                'sync_status': 'ERROR',
                'error_message': str(e)
            }

    def synchronize_from_files(self, headquarters_file=None, services_file=None, create_backup=True, force_recreate=False):
        """
        Sincroniza datos desde archivos de importación
        """
        try:
            logger.info(f"Iniciando sincronización desde archivos para organización {self.organization} (force_recreate={force_recreate})")
            
            # If force_recreate is True, perform complete cleanup first
            if force_recreate:
                logger.info("=== INICIANDO RECREACIÓN COMPLETA ===")
                
                # Import cleanup service
                from .reps_cleanup_service import REPSCleanupService
                cleanup_service = REPSCleanupService(organization=self.organization)
                
                # Step 1: Clean up any corrupted records first
                logger.info("Paso 1: Limpiando registros corruptos...")
                cleanup_stats = cleanup_service.cleanup_corrupted_reps_codes()
                logger.info(f"Limpieza completada: {cleanup_stats}")
                
                # Step 2: Perform hard delete of all headquarters
                logger.info("Paso 2: Eliminación completa de todas las sedes...")
                deleted_count = cleanup_service.hard_delete_all_headquarters()
                logger.info(f"Eliminadas {deleted_count} sedes completamente")
                
                # Step 3: Verify database is clean
                remaining = HeadquarterLocation.objects.filter(
                    organization=self.organization
                ).count()
                if remaining > 0:
                    logger.error(f"ADVERTENCIA: Aún quedan {remaining} sedes después de la limpieza")
                    # Force another cleanup attempt
                    from django.db import connection
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "DELETE FROM organization_headquarterlocation WHERE organization_id = %s",
                            [str(self.organization.id)]
                        )
                        logger.info(f"Forzada eliminación adicional de {cursor.rowcount} registros")
                
                logger.info("=== LIMPIEZA COMPLETA FINALIZADA ===")
            
            headquarters_processed = 0
            headquarters_created = 0
            headquarters_updated = 0
            validation_results = []
            
            if headquarters_file:
                logger.info(f"Procesando archivo de sedes: {headquarters_file}")
                # Parse the actual Excel file
                validation_results = self._parse_headquarters_file(headquarters_file)
                headquarters_processed = len(validation_results)
                
                # Actually save valid records to database
                valid_results = [r for r in validation_results if r['is_valid']]
                logger.info(f"Guardando {len(valid_results)} sedes válidas en la base de datos")
                
                # Determine which sede should be the main headquarters
                # Priority: 1) First sede in the file, 2) If force_recreate, first valid sede
                # If not force_recreate, check if main already exists before setting one
                main_headquarters_set = False
                if not force_recreate:
                    # Check if organization already has a main headquarters
                    existing_main = HeadquarterLocation.objects.filter(
                        organization=self.organization,
                        is_main_headquarters=True,
                        deleted_at__isnull=True
                    ).exists()
                    main_headquarters_set = existing_main
                    logger.info(f"Main headquarters already exists: {existing_main}")
                
                # Mark the first valid sede as main headquarters if none exists
                if valid_results and not main_headquarters_set:
                    valid_results[0]['data']['tipo_sede'] = 'principal'
                    logger.info(f"Marcando '{valid_results[0]['data']['nombre_sede']}' como sede principal")
                
                # Process all sedes in a single transaction for consistency
                sede_creation_errors = []
                
                # Use a single transaction for all creates when force_recreate is True
                if force_recreate:
                    try:
                        with transaction.atomic():
                            for result in valid_results:
                                try:
                                    created_count, is_main = self._create_headquarters_record(result['data'], force_recreate, main_headquarters_set)
                                    headquarters_created += created_count
                                    if is_main:
                                        main_headquarters_set = True
                                except Exception as e:
                                    # In force_recreate mode, fail the entire transaction on any error
                                    logger.error(f"Error crítico en recreación completa, sede fila {result['row_index']}: {str(e)}")
                                    raise e
                    except Exception as e:
                        logger.error(f"Fallo la transacción de recreación completa: {str(e)}")
                        # Mark all as invalid
                        for result in valid_results:
                            result['is_valid'] = False
                            result['errors'] = {'general': [f'Error en recreación completa: {str(e)}']}
                        sede_creation_errors.append(str(e))
                else:
                    # For non-force_recreate, use individual transactions
                    for result in valid_results:
                        try:
                            with transaction.atomic():
                                created_count, is_main = self._create_headquarters_record(result['data'], force_recreate, main_headquarters_set)
                                headquarters_created += created_count
                                if is_main:
                                    main_headquarters_set = True
                        except Exception as e:
                            logger.error(f"Error creando sede de fila {result['row_index']}: {str(e)}")
                            result['is_valid'] = False
                            result['errors'] = {'general': [f'Error guardando en BD: {str(e)}']}
                            sede_creation_errors.append(str(e))
                
            if services_file:
                logger.info(f"Procesando archivo de servicios: {services_file}")
            
            # Recalculate stats after saving
            valid_count = len([r for r in validation_results if r['is_valid']])
            invalid_count = len([r for r in validation_results if not r['is_valid']])
            
            stats = {
                'status': 'SUCCESS',
                'success': True,
                'message': f'Importación completada: {headquarters_created} sedes guardadas exitosamente' + (' (recreación forzada)' if force_recreate else ''),
                'validation_results': validation_results,
                'total_rows': headquarters_processed,
                'valid_rows': valid_count,
                'invalid_rows': invalid_count,
                'imported_count': headquarters_created + headquarters_updated,
                'error_count': invalid_count,
                'backup_created': create_backup
            }
            
            logger.info(f"Sincronización completada: {headquarters_created} sedes creadas")
            return stats
            
        except Exception as e:
            logger.error(f"Error en sincronización desde archivos: {str(e)}")
            raise REPSSyncError(f"Error procesando archivos: {str(e)}")

    def _parse_headquarters_file(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parse Excel file and extract headquarters data
        """
        try:
            import pandas as pd
            
            # Try different reading strategies with proper encoding handling
            df = None
            read_method = None
            
            # Strategy 1: Try Excel file with openpyxl (best for real Excel files)
            try:
                df = pd.read_excel(file_path, engine='openpyxl', header=0)
                read_method = "Excel con openpyxl"
                logger.info(f"Archivo leído como {read_method}")
            except Exception as e:
                logger.warning(f"Error leyendo como Excel: {str(e)}")
                
                # Strategy 2: Try as HTML with UTF-8 (for REPS HTML tables saved as .xls)
                try:
                    df = pd.read_html(file_path, encoding='utf-8', header=0)[0]
                    read_method = "HTML con UTF-8"
                    logger.info(f"Archivo leído como {read_method}")
                except Exception as e2:
                    logger.warning(f"Error leyendo como HTML UTF-8: {str(e2)}")
                    
                    # Strategy 3: Try as HTML with latin-1 (Windows encoding)
                    try:
                        df = pd.read_html(file_path, encoding='latin-1', header=0)[0]
                        read_method = "HTML con latin-1"
                        logger.info(f"Archivo leído como {read_method}")
                    except Exception as e3:
                        logger.warning(f"Error leyendo como HTML latin-1: {str(e3)}")
                        
                        # Strategy 4: Try as HTML with cp1252 (Windows Western European)
                        try:
                            df = pd.read_html(file_path, encoding='cp1252', header=0)[0]
                            read_method = "HTML con cp1252"
                            logger.info(f"Archivo leído como {read_method}")
                        except Exception as e4:
                            logger.warning(f"Error leyendo como HTML cp1252: {str(e4)}")
                            
                            # Strategy 5: Last resort - manual header detection
                            try:
                                df = pd.read_excel(file_path, engine='openpyxl', header=None)
                                read_method = "Excel sin headers"
                                # Use the first row as headers if it contains text
                                if len(df) > 0:
                                    first_row = df.iloc[0]
                                    if any(isinstance(val, str) and val.strip() for val in first_row):
                                        df.columns = [str(val).strip() if pd.notna(val) else f'col_{i}' for i, val in enumerate(first_row)]
                                        df = df.drop(df.index[0]).reset_index(drop=True)
                                        logger.info(f"Usó primera fila como headers: {list(df.columns)}")
                                    else:
                                        # No header row detected, assign generic names
                                        df.columns = [f'col_{i}' for i in range(len(df.columns))]
                                        logger.info(f"Sin headers detectados, usando nombres genéricos")
                            except Exception as e5:
                                logger.error(f"Error en estrategia final: {str(e5)}")
                                raise REPSSyncError(f"No se pudo leer el archivo con ningún método")
            
            if df is None:
                raise REPSSyncError("No se pudo leer el archivo")
            
            # Clean up encoding issues in string columns
            logger.info(f"Limpiando caracteres especiales...")
            for col in df.columns:
                if df[col].dtype == 'object':  # String columns
                    df[col] = df[col].astype(str).apply(self._fix_encoding)
            
            validation_results = []
            
            # Clean column names (remove extra spaces, normalize)
            # Convert columns to string first to avoid .str accessor error
            df.columns = [str(col).strip() if col is not None else f'col_{i}' for i, col in enumerate(df.columns)]
            
            logger.info(f"Columnas encontradas en el archivo: {list(df.columns)}")
            logger.info(f"Total de filas encontradas: {len(df)}")
            
            # Map column names from your Excel file to our expected format
            column_mapping = {
                'departamento': ['departamento', 'DEPARTAMENTO', 'Departamento'],
                'municipio': ['municipio', 'MUNICIPIO', 'Municipio'], 
                'codigo_prestador': ['codigo_prestador', 'CODIGO_PRESTADOR', 'codigo prestador', 'Código Prestador'],
                'nombre_prestador': ['nombre_prestador', 'NOMBRE_PRESTADOR', 'nombre prestador', 'Nombre Prestador'],
                'codigo_habilitacion': ['codigo_habilitacion', 'CODIGO_HABILITACION', 'codigo habilitacion', 'Código Habilitación'],
                'numero_sede': ['numero_sede', 'NUMERO_SEDE', 'numero sede', 'Número Sede'],
                'nombre_sede': ['nombre_sede', 'NOMBRE_SEDE', 'nombre sede', 'Nombre Sede', 'nombre'],  # Include 'nombre' for REPS HTML
                'direccion': ['direccion', 'DIRECCION', 'Dirección'],
                'telefono': ['telefono', 'TELEFONO', 'Teléfono'],
                'email': ['email', 'EMAIL', 'correo', 'Correo'],
                'gerente': ['gerente', 'GERENTE', 'Gerente'],
                'tipo_zona': ['tipo_zona', 'TIPO_ZONA', 'tipo zona', 'Tipo Zona'],
                'zona': ['zona', 'ZONA', 'Zona'],
                'barrio': ['barrio', 'BARRIO', 'Barrio'],
                'fax': ['fax', 'FAX', 'Fax'],
                'codigo_postal': ['codigo_postal', 'CODIGO_POSTAL', 'cod_postal', 'cp'],
                'poblacion': ['poblacion', 'POBLACION', 'pob'],
                'fecha_apertura': ['fecha_apertura', 'FECHA_APERTURA', 'apertura', 'fecha_inicio']
            }
            
            # Find actual column names in the DataFrame
            actual_columns = {}
            for key, possible_names in column_mapping.items():
                for name in possible_names:
                    if name in df.columns:
                        actual_columns[key] = name
                        break
            
            logger.info(f"Mapeo de columnas encontrado: {actual_columns}")
            
            # Process each row
            for idx, row in df.iterrows():
                try:
                    # Extract data using mapped columns
                    sede_data = {
                        'numero_sede': str(row.get(actual_columns.get('numero_sede', ''), f'sede-{idx+1:03d}')).strip(),
                        'nombre_sede': str(row.get(actual_columns.get('nombre_sede', ''), f'Sede {idx+1}')).strip(),
                        'tipo_sede': 'sucursal',  # Default all to sucursal, we'll determine main later
                        'departamento': str(row.get(actual_columns.get('departamento', ''), 'No especificado')).strip(),
                        'municipio': str(row.get(actual_columns.get('municipio', ''), 'No especificado')).strip(),
                        'direccion': str(row.get(actual_columns.get('direccion', ''), 'No especificada')).strip(),
                        'telefono': str(row.get(actual_columns.get('telefono', ''), '')).strip(),
                        'email': str(row.get(actual_columns.get('email', ''), '')).strip(),
                        'estado': 'activa',
                        'codigo_prestador': str(row.get(actual_columns.get('codigo_prestador', ''), f'PREST-{idx+1:03d}')).strip(),
                        'codigo_habilitacion': str(row.get(actual_columns.get('codigo_habilitacion', ''), '')).strip()
                    }
                    
                    # Basic validation
                    is_valid = True
                    errors = {}
                    
                    # Check required fields
                    if not sede_data['nombre_sede'] or sede_data['nombre_sede'] == 'nan':
                        is_valid = False
                        errors['nombre_sede'] = ['Nombre de sede es requerido']
                    
                    if not sede_data['departamento'] or sede_data['departamento'] == 'nan':
                        is_valid = False
                        errors['departamento'] = ['Departamento es requerido']
                    
                    if not sede_data['municipio'] or sede_data['municipio'] == 'nan':
                        is_valid = False
                        errors['municipio'] = ['Municipio es requerido']
                    
                    # Clean up 'nan' values
                    for key, value in sede_data.items():
                        if str(value) == 'nan' or str(value) == 'NaN':
                            sede_data[key] = ''
                    
                    validation_results.append({
                        'row_index': idx,
                        'is_valid': is_valid,
                        'data': sede_data,
                        'errors': errors if not is_valid else None
                    })
                    
                except Exception as row_error:
                    logger.error(f"Error procesando fila {idx}: {str(row_error)}")
                    validation_results.append({
                        'row_index': idx,
                        'is_valid': False,
                        'data': {},
                        'errors': {'general': [f'Error procesando fila: {str(row_error)}']}
                    })
            
            logger.info(f"Procesadas {len(validation_results)} filas del archivo de sedes")
            return validation_results
            
        except Exception as e:
            logger.error(f"Error parsing headquarters file: {str(e)}")
            raise REPSSyncError(f"Error leyendo archivo de sedes: {str(e)}")

    def _fix_encoding(self, text: str) -> str:
        """
        Fix common encoding issues in text fields
        """
        if not isinstance(text, str) or text == 'nan':
            return ''
        
        # Common encoding fixes for Spanish characters
        encoding_fixes = {
            'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
            'Ã': 'Á', 'Ã‰': 'É', 'Ã': 'Í', 'Ã"': 'Ó', 'Ãš': 'Ú',
            'Ã±': 'ñ', 'Ñ': 'Ñ',
            'Ã¼': 'ü', 'Ãœ': 'Ü',
            'â€œ': '"', 'â€': '"', 'â€™': "'", 'â€˜': "'",
            'â€"': '–', 'â€"': '—',
            'Â': '', # Often appears as unwanted character
            '�': 'Á',  # Common replacement for Á in REPS data - try this instead of removing
        }
        
        # Apply fixes
        fixed_text = text
        for bad_char, good_char in encoding_fixes.items():
            fixed_text = fixed_text.replace(bad_char, good_char)
        
        # Try to decode/encode if still has issues
        try:
            # If the text contains encoding artifacts, try to fix them
            if '�' in fixed_text or 'Ã' in fixed_text:
                # Try different encodings
                for encoding in ['utf-8', 'latin-1', 'cp1252']:
                    try:
                        # Try to encode as latin-1 then decode as utf-8 (common issue)
                        if encoding == 'latin-1':
                            fixed_text = fixed_text.encode('latin-1').decode('utf-8')
                            break
                    except (UnicodeDecodeError, UnicodeEncodeError):
                        continue
        except Exception:
            pass  # If all encoding attempts fail, use the fixed text as is
        
        return fixed_text.strip()

    def _create_headquarters_record(self, sede_data: Dict[str, Any], force_recreate: bool = False, main_headquarters_already_set: bool = False) -> tuple[int, bool]:
        """
        Create a HeadquarterLocation record from parsed sede data
        
        Args:
            sede_data: Dictionary with sede information
            force_recreate: Whether this is a force recreation
            main_headquarters_already_set: Whether a main headquarters has already been set
            
        Returns:
            tuple[int, bool]: (1 if created/0 if skipped, True if this sede became the main headquarters)
        """
        try:
            # Import cleanup service for sanitization
            from .reps_cleanup_service import REPSCleanupService
            cleanup_service = REPSCleanupService(organization=self.organization)
            
            # Sanitize inputs thoroughly
            base_code = str(sede_data.get('codigo_prestador', '')).strip()
            sede_number = str(sede_data.get('numero_sede', '1')).strip()
            sede_name = str(sede_data.get('nombre_sede', '')).strip()
            
            # Remove any whitespace or special characters from base_code
            base_code = cleanup_service._sanitize_reps_code(base_code)
            if not base_code:
                logger.error(f"Invalid base code for sede: {sede_name}")
                return 0, False
            
            # Sanitize sede_number - ensure it's numeric
            import re
            sede_number_clean = re.sub(r'[^0-9]', '', sede_number)
            if not sede_number_clean or sede_number.lower() == 'nan':
                sede_number_clean = '1'
            
            # Construct REPS code with sanitized values
            original_reps_code = f"{base_code}_{sede_number_clean}"
            
            # Validate uniqueness before attempting to create
            is_unique, error_msg = cleanup_service.validate_reps_code_uniqueness(original_reps_code)
            
            if not is_unique and not force_recreate:
                logger.warning(f"REPS code {original_reps_code} validation failed: {error_msg}")
                return 0, False
            
            logger.info(f"Procesando sede: '{sede_name}' - Base: '{base_code}' - Número: '{sede_number_clean}' - REPS: '{original_reps_code}'")
            
            # Handle soft-deleted records conflict (only if not force recreating)
            if not force_recreate:
                existing_deleted = HeadquarterLocation.objects.filter(
                    organization=self.organization,
                    reps_code=original_reps_code,
                    deleted_at__isnull=False  # Only soft-deleted records
                ).first()
                
                if existing_deleted:
                    # If not force recreating, skip this sede as it conflicts with soft-deleted record
                    logger.warning(f"Sede con REPS {original_reps_code} existe como eliminada. Use 'Recrear completamente' para importar.")
                    return 0, False
            
            # Skip duplicate check if force_recreate is True (all active sedes were already deleted)
            existing_active = None
            if not force_recreate:
                # Check if this specific sede already exists (active only)
                existing_active = HeadquarterLocation.objects.filter(
                    organization=self.organization,
                    reps_code=original_reps_code,
                    deleted_at__isnull=True  # Only active records
                ).first()
            else:
                # In force_recreate mode, we know all active sedes were deleted
                logger.debug(f"Forzando recreación: omitiendo verificación de duplicados para {original_reps_code}")
            
            if existing_active:
                # Update existing sede instead of skipping
                logger.info(f"Sede '{sede_data.get('nombre_sede')}' (REPS: {original_reps_code}) ya existe, actualizando...")
                
                # Preserve important existing values, update others
                old_name = existing_active.name
                old_type = existing_active.sede_type
                
                # Update key fields but preserve sede_type to avoid conflicts
                existing_active.name = sede_data.get('nombre_sede', existing_active.name)
                existing_active.address = sede_data.get('direccion', existing_active.address)
                existing_active.department_name = sede_data.get('departamento', existing_active.department_name)
                existing_active.municipality_name = sede_data.get('municipio', existing_active.municipality_name)
                existing_active.phone_primary = sede_data.get('telefono', existing_active.phone_primary)
                existing_active.email = sede_data.get('email', existing_active.email)
                existing_active.administrative_contact = sede_data.get('gerente', existing_active.administrative_contact)
                
                # Only update sede_type if it was originally 'satelite' (to allow promoting to principal)
                # Never demote a principal sede to satelite to avoid business rule conflicts
                new_type = self._map_sede_type(sede_data.get('tipo_sede', 'principal'))
                if existing_active.sede_type != 'principal' or new_type == 'principal':
                    existing_active.sede_type = new_type
                
                existing_active.updated_by = self.user
                
                existing_active.save()
                logger.info(f"Sede actualizada: '{old_name}' -> '{existing_active.name}', tipo: '{old_type}' -> '{existing_active.sede_type}' (ID: {existing_active.id})")
                return 1, existing_active.is_main_headquarters  # Count as processed, return if it's main
            
            # Determine if this should be the main headquarters
            # Only set as main if it's a 'principal' type AND no main headquarters has been set yet
            should_be_main = (sede_data.get('tipo_sede', 'principal') == 'principal' and 
                            not main_headquarters_already_set)
            
            # Use Django ORM with all fields now properly defined
            try:
                # CRITICAL FIX: Use objects.create() for proper validation and signal handling
                headquarters = HeadquarterLocation.objects.create(
                    organization=self.organization,
                    reps_code=original_reps_code,  # Use original REPS code
                    name=sede_data.get('nombre_sede', ''),
                    sede_type=self._map_sede_type(sede_data.get('tipo_sede', 'principal')),
                    department_code='00',
                    department_name=sede_data.get('departamento', ''),
                    municipality_code='00000',  
                    municipality_name=sede_data.get('municipio', ''),
                    address=sede_data.get('direccion', ''),
                    postal_code='',
                    phone_primary=sede_data.get('telefono', ''),
                    phone_secondary='',
                    email=sede_data.get('email', ''),
                    administrative_contact=sede_data.get('gerente', 'No especificado'),
                    administrative_contact_phone='',
                    administrative_contact_email=sede_data.get('email', ''),
                    habilitation_status='habilitada' if sede_data.get('estado') == 'activa' else 'en_proceso',
                    habilitation_resolution='',
                    operational_status=sede_data.get('estado', 'activa'),
                    suspension_reason='',
                    total_beds=0,
                    icu_beds=0,
                    emergency_beds=0,
                    surgery_rooms=0,
                    consultation_rooms=1,
                    sync_status='imported',
                    sync_errors='',
                    reps_data='',
                    is_main_headquarters=should_be_main,
                    working_hours='{}',
                    has_emergency_service=False,
                    observations='',
                    # Now we can include the previously missing fields
                    atencion_24_horas=False,
                    barrio=sede_data.get('barrio', 'No especificado'),
                    cargo_responsable_administrativo='Administrador',
                    created_by=self.user,
                    updated_by=self.user,
                )
                    
                logger.info(f"Sede creada exitosamente: {sede_data.get('nombre_sede', '')} (ID: {headquarters.id}) - Main: {should_be_main}")
                return 1, should_be_main
                
            except IntegrityError as e:
                # Log more detailed error information for UNIQUE constraint violations
                logger.error(f"IntegrityError al crear sede '{sede_name}' con REPS '{original_reps_code}': {str(e)}")
                
                # Check if a record with this REPS code already exists (including soft-deleted)
                existing = HeadquarterLocation.objects.filter(reps_code=original_reps_code).first()
                if existing:
                    logger.error(f"  -> Sede existente encontrada: ID={existing.id}, Name='{existing.name}', Deleted={existing.deleted_at is not None}")
                    logger.error(f"  -> Organization: {existing.organization_id} vs {self.organization.id}")
                
                logger.warning(f"Skipping sede due to IntegrityError: {sede_data.get('nombre_sede', 'Unknown')}")
                return 0, False
            except Exception as e:
                logger.error(f"Error creating sede: {str(e)}")
                logger.warning(f"Skipping sede due to error: {sede_data.get('nombre_sede', 'Unknown')}")
                return 0, False
            
        except Exception as e:
            logger.error(f"Error creando sede {sede_data.get('nombre_sede', 'Unknown')}: {str(e)}")
            raise e
    
    def _map_sede_type(self, tipo_sede: str) -> str:
        """
        Map Excel sede type to model choices
        """
        type_mapping = {
            'principal': 'principal',
            'sucursal': 'satelite',
            'ambulatoria': 'satelite',
            'hospitalaria': 'principal',
            'administrativa': 'satelite',
            'diagnostico': 'satelite',
            'urgencias': 'satelite',
        }
        return type_mapping.get(tipo_sede.lower(), 'satelite')
    
    def diagnose_reps_codes(self) -> Dict[str, Any]:
        """
        Diagnostic method to identify REPS code issues
        """
        from django.db import connection
        
        diagnosis = {
            'organization_id': self.organization.id if self.organization else None,
            'existing_codes': [],
            'duplicate_codes': [],
            'issues': []
        }
        
        try:
            # Get all existing REPS codes for this organization
            existing_sedes = HeadquarterLocation.objects.filter(
                organization=self.organization
            ).values('id', 'reps_code', 'name', 'deleted_at')
            
            diagnosis['existing_codes'] = list(existing_sedes)
            
            # Check for duplicates using raw SQL
            with connection.cursor() as cursor:
                table_name = HeadquarterLocation._meta.db_table
                # Convert UUID to string for SQLite compatibility (remove dashes)
                org_id_str = str(self.organization.id).replace('-', '')
                
                cursor.execute(f"""
                    SELECT reps_code, COUNT(*) as count
                    FROM {table_name}
                    WHERE organization_id = %s
                    GROUP BY reps_code
                    HAVING COUNT(*) > 1
                """, [org_id_str])
                
                duplicates = cursor.fetchall()
                if duplicates:
                    diagnosis['duplicate_codes'] = [
                        {'reps_code': code, 'count': count} 
                        for code, count in duplicates
                    ]
                    diagnosis['issues'].append('Found duplicate REPS codes in database')
                
                # Check for codes with spaces or special characters
                cursor.execute(f"""
                    SELECT id, reps_code 
                    FROM {table_name}
                    WHERE organization_id = %s
                    AND (reps_code LIKE '% %' OR reps_code LIKE '%\t%' OR reps_code LIKE '%\n%')
                """, [org_id_str])
                
                problematic = cursor.fetchall()
                if problematic:
                    diagnosis['issues'].append(f'Found {len(problematic)} REPS codes with whitespace')
                    diagnosis['problematic_codes'] = [
                        {'id': id, 'reps_code': repr(code)}  # Use repr to show hidden chars
                        for id, code in problematic
                    ]
            
            logger.info(f"Diagnosis completed: {diagnosis}")
            return diagnosis
            
        except Exception as e:
            logger.error(f"Error during diagnosis: {str(e)}")
            diagnosis['error'] = str(e)
            return diagnosis