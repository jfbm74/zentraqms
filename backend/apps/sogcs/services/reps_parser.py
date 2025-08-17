"""
REPSExcelParser - Parser para archivos REPS del portal MinSalud.

Este parser maneja la estructura específica de los archivos exportados desde el portal REPS
que son en realidad tablas HTML exportadas como .xls, no archivos Excel binarios.
"""

import pandas as pd
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
from django.core.exceptions import ValidationError
from django.db import transaction
from django.contrib.auth import get_user_model

from ..models import HeadquarterLocation, EnabledHealthService

User = get_user_model()
logger = logging.getLogger(__name__)


class REPSParsingError(Exception):
    """Excepción personalizada para errores de parsing REPS"""
    pass


class REPSExcelParser:
    """
    Parser especializado para archivos REPS exportados desde el portal MinSalud.
    
    Características:
    - Maneja archivos .xls que son en realidad HTML tables
    - Parsea estructura específica de sedes y servicios REPS
    - Valida datos según normativa colombiana
    - Proporciona logging detallado para auditoría
    """
    
    def __init__(self, organization, user: User):
        self.organization = organization
        self.user = user
        self.parsing_stats = {
            'headquarters_processed': 0,
            'headquarters_created': 0,
            'headquarters_updated': 0,
            'services_processed': 0,
            'services_created': 0,
            'services_updated': 0,
            'errors': []
        }
    
    def parse_headquarters_file(self, file_path: str) -> Dict:
        """
        Parsea archivo de sedes REPS.
        
        Args:
            file_path: Ruta al archivo de sedes (.xls del portal REPS)
            
        Returns:
            Diccionario con estadísticas del procesamiento
            
        Raises:
            REPSParsingError: Si hay errores en el parsing
        """
        try:
            logger.info(f"Iniciando parsing de sedes REPS: {file_path}")
            
            # Leer archivo HTML como DataFrame
            df = self._read_reps_file(file_path)
            
            if df.empty:
                raise REPSParsingError("El archivo de sedes está vacío o no tiene el formato esperado")
            
            # Validar estructura esperada para sedes
            required_columns = self._get_required_headquarters_columns()
            self._validate_dataframe_structure(df, required_columns, 'sedes')
            
            # Procesar cada sede
            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        self._process_headquarters_row(row)
                        self.parsing_stats['headquarters_processed'] += 1
                        
                    except Exception as e:
                        error_msg = f"Error procesando sede en fila {index + 1}: {str(e)}"
                        logger.error(error_msg)
                        self.parsing_stats['errors'].append(error_msg)
                        continue
            
            logger.info(f"Parsing de sedes completado. Procesadas: {self.parsing_stats['headquarters_processed']}")
            return self.parsing_stats
            
        except Exception as e:
            logger.error(f"Error crítico en parsing de sedes: {str(e)}")
            raise REPSParsingError(f"Error al procesar archivo de sedes: {str(e)}")
    
    def parse_services_file(self, file_path: str) -> Dict:
        """
        Parsea archivo de servicios REPS.
        
        Args:
            file_path: Ruta al archivo de servicios (.xls del portal REPS)
            
        Returns:
            Diccionario con estadísticas del procesamiento
            
        Raises:
            REPSParsingError: Si hay errores en el parsing
        """
        try:
            logger.info(f"Iniciando parsing de servicios REPS: {file_path}")
            
            # Leer archivo HTML como DataFrame
            df = self._read_reps_file(file_path)
            
            if df.empty:
                raise REPSParsingError("El archivo de servicios está vacío o no tiene el formato esperado")
            
            # Validar estructura esperada para servicios
            required_columns = self._get_required_services_columns()
            self._validate_dataframe_structure(df, required_columns, 'servicios')
            
            # Procesar cada servicio
            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        self._process_service_row(row)
                        self.parsing_stats['services_processed'] += 1
                        
                    except Exception as e:
                        error_msg = f"Error procesando servicio en fila {index + 1}: {str(e)}"
                        logger.error(error_msg)
                        self.parsing_stats['errors'].append(error_msg)
                        continue
            
            logger.info(f"Parsing de servicios completado. Procesados: {self.parsing_stats['services_processed']}")
            return self.parsing_stats
            
        except Exception as e:
            logger.error(f"Error crítico en parsing de servicios: {str(e)}")
            raise REPSParsingError(f"Error al procesar archivo de servicios: {str(e)}")
    
    def _read_reps_file(self, file_path: str) -> pd.DataFrame:
        """
        Lee archivo REPS que es HTML table exportado como .xls.
        La primera fila contiene los nombres reales de las columnas.
        """
        try:
            # Los archivos REPS son HTML tables, no Excel binario
            # Usamos pandas.read_html para parsear el contenido HTML
            dfs = pd.read_html(file_path, encoding='utf-8')
            
            if not dfs:
                raise REPSParsingError("No se encontraron tablas en el archivo")
            
            # Tomar la primera tabla (normalmente la única)
            df = dfs[0]
            
            # Los archivos REPS tienen las columnas reales en la primera fila
            if len(df) > 0:
                # Usar la primera fila como nombres de columnas
                df.columns = df.iloc[0].astype(str).str.strip()
                # Eliminar la primera fila que ahora son los headers
                df = df.drop(df.index[0])
                # Reset index
                df = df.reset_index(drop=True)
            
            # Eliminar filas completamente vacías
            df = df.dropna(how='all')
            
            logger.info(f"Archivo REPS leído: {len(df)} filas, {len(df.columns)} columnas")
            logger.info(f"Columnas encontradas: {list(df.columns)[:10]}...")
            return df
            
        except Exception as e:
            logger.error(f"Error leyendo archivo REPS: {str(e)}")
            raise REPSParsingError(f"No se pudo leer el archivo REPS: {str(e)}")
    
    def _get_required_headquarters_columns(self) -> List[str]:
        """Retorna las columnas requeridas para el archivo de sedes"""
        return [
            'numero_sede',
            'nombre', 
            'departamento',
            'municipio',
            'direccion',
            'habilitado',
            'clase_prestador'
        ]
    
    def _get_required_services_columns(self) -> List[str]:
        """Retorna las columnas requeridas para el archivo de servicios"""
        return [
            'numero_sede',
            'codigo_servicio',
            'nombre_servicio',
            'grupo_servicio',
            'estado_servicio',
            'complejidad'
        ]
    
    def _validate_dataframe_structure(self, df: pd.DataFrame, required_columns: List[str], file_type: str):
        """
        Valida que el DataFrame tenga la estructura esperada
        """
        missing_columns = []
        
        for col in required_columns:
            # Buscar columna con nombre exacto o similar
            found = False
            for df_col in df.columns:
                if col.lower() in str(df_col).lower():
                    found = True
                    break
            
            if not found:
                missing_columns.append(col)
        
        if missing_columns:
            raise REPSParsingError(
                f"Archivo de {file_type} no tiene la estructura esperada. "
                f"Columnas faltantes: {', '.join(missing_columns)}"
            )
    
    def _process_headquarters_row(self, row: pd.Series):
        """
        Procesa una fila del archivo de sedes
        """
        try:
            # Extraer y limpiar datos usando los nombres reales de REPS
            codigo_sede = self._clean_string(row.get('numero_sede'))
            nombre_sede = self._clean_string(row.get('nombre'))
            
            if not codigo_sede or not nombre_sede:
                raise ValueError("Código de sede y nombre son requeridos")
            
            # Buscar o crear sede
            headquarters, created = HeadquarterLocation.objects.get_or_create(
                codigo_sede=codigo_sede,
                organization=self.organization,
                defaults={
                    'nombre_sede': nombre_sede,
                    'tipo_sede': self._clean_string(row.get('clase_prestador', 'NO_ESPECIFICADO')),
                    'estado_sede': self._map_estado_sede(row.get('habilitado')),
                    'departamento': self._clean_string(row.get('departamento', '')),
                    'municipio': self._clean_string(row.get('municipio', '')),
                    'direccion': self._clean_string(row.get('direccion', '')),
                    'telefono': self._clean_string(row.get('telefono', '')),
                    'email': self._clean_string(row.get('email', '')),
                    'representante_legal': self._clean_string(row.get('gerente', '')),
                    'nivel_atencion': self._map_nivel_atencion(row.get('nivel')),
                    'categoria': self._clean_string(row.get('caracter', '')),
                    'fecha_apertura': self._parse_date(row.get('fecha_apertura')),
                    'codigo_departamento': self._clean_string(row.get('departamento', ''))[:5],
                    'codigo_municipio': self._clean_string(row.get('municipio', ''))[:10],
                    'fecha_actualizacion_reps': datetime.now(),
                    'created_by': self.user
                }
            )
            
            if created:
                self.parsing_stats['headquarters_created'] += 1
                logger.info(f"Sede creada: {codigo_sede} - {nombre_sede}")
            else:
                # Actualizar sede existente
                self._update_headquarters(headquarters, row)
                self.parsing_stats['headquarters_updated'] += 1
                logger.info(f"Sede actualizada: {codigo_sede} - {nombre_sede}")
                
        except Exception as e:
            logger.error(f"Error procesando sede: {str(e)}")
            raise
    
    def _process_service_row(self, row: pd.Series):
        """
        Procesa una fila del archivo de servicios
        """
        try:
            # Extraer y limpiar datos
            codigo_sede = self._clean_string(row.get('Código Sede') or row.get('CODIGO_SEDE'))
            codigo_servicio = self._clean_string(row.get('Código Servicio') or row.get('CODIGO_SERVICIO'))
            nombre_servicio = self._clean_string(row.get('Nombre Servicio') or row.get('NOMBRE_SERVICIO'))
            
            if not codigo_sede or not codigo_servicio or not nombre_servicio:
                raise ValueError("Código de sede, código de servicio y nombre son requeridos")
            
            # Buscar sede asociada
            try:
                headquarters = HeadquarterLocation.objects.get(
                    codigo_sede=codigo_sede,
                    organization=self.organization
                )
            except HeadquarterLocation.DoesNotExist:
                raise ValueError(f"No se encontró la sede {codigo_sede}. Procese primero el archivo de sedes.")
            
            # Buscar o crear servicio
            service, created = EnabledHealthService.objects.get_or_create(
                codigo_servicio=codigo_servicio,
                headquarters=headquarters,
                defaults={
                    'nombre_servicio': nombre_servicio,
                    'tipo_servicio': self._clean_string(row.get('Tipo Servicio') or row.get('TIPO_SERVICIO', '')),
                    'modalidad': self._clean_string(row.get('Modalidad') or row.get('MODALIDAD', 'NO_ESPECIFICADA')),
                    'estado': self._map_estado_servicio(row.get('Estado') or row.get('ESTADO')),
                    'grupo_servicio': self._clean_string(row.get('Grupo') or row.get('GRUPO', '')),
                    'complejidad': self._map_complejidad(row.get('Complejidad') or row.get('COMPLEJIDAD')),
                    'ambito': self._map_ambito(row.get('Ámbito') or row.get('AMBITO')),
                    'fecha_habilitacion': self._parse_date(row.get('Fecha Habilitación') or row.get('FECHA_HABILITACION')),
                    'fecha_vencimiento': self._parse_date(row.get('Fecha Vencimiento') or row.get('FECHA_VENCIMIENTO')),
                    'capacidad_instalada': self._parse_int(row.get('Capacidad') or row.get('CAPACIDAD', 0)),
                    'fecha_ultima_actualizacion': date.today(),
                    'created_by': self.user
                }
            )
            
            if created:
                self.parsing_stats['services_created'] += 1
                logger.info(f"Servicio creado: {codigo_servicio} - {nombre_servicio}")
            else:
                # Actualizar servicio existente
                self._update_service(service, row)
                self.parsing_stats['services_updated'] += 1
                logger.info(f"Servicio actualizado: {codigo_servicio} - {nombre_servicio}")
                
        except Exception as e:
            logger.error(f"Error procesando servicio: {str(e)}")
            raise
    
    def _clean_string(self, value) -> str:
        """Limpia y normaliza strings"""
        if pd.isna(value) or value is None:
            return ''
        return str(value).strip()
    
    def _parse_date(self, value) -> Optional[date]:
        """Parsea fechas en múltiples formatos"""
        if pd.isna(value) or value is None or value == '':
            return None
        
        try:
            # Intentar varios formatos de fecha
            formats = ['%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d']
            for fmt in formats:
                try:
                    return datetime.strptime(str(value), fmt).date()
                except ValueError:
                    continue
            
            # Si no funciona ningún formato, intentar pandas
            return pd.to_datetime(value).date()
            
        except Exception:
            logger.warning(f"No se pudo parsear la fecha: {value}")
            return None
    
    def _parse_int(self, value, default=0) -> int:
        """Parsea enteros con valor por defecto"""
        if pd.isna(value) or value is None or value == '':
            return default
        
        try:
            return int(float(str(value)))
        except (ValueError, TypeError):
            return default
    
    def _map_estado_sede(self, value) -> str:
        """Mapea estados de sede REPS a estados del modelo"""
        if pd.isna(value):
            return 'ACTIVA'
        
        estado = str(value).upper().strip()
        mapping = {
            'ACTIVA': 'ACTIVA',
            'ACTIVO': 'ACTIVA',
            'HABILITADA': 'ACTIVA',
            'SUSPENDIDA': 'SUSPENDIDA',
            'SUSPENDIDO': 'SUSPENDIDA',
            'CANCELADA': 'CANCELADA',
            'CANCELADO': 'CANCELADA',
            'CERRADA': 'CERRADA',
            'CERRADO': 'CERRADA'
        }
        
        return mapping.get(estado, 'ACTIVA')
    
    def _map_estado_servicio(self, value) -> str:
        """Mapea estados de servicio REPS a estados del modelo"""
        if pd.isna(value):
            return 'HABILITADO'
        
        estado = str(value).upper().strip()
        mapping = {
            'HABILITADO': 'HABILITADO',
            'ACTIVO': 'HABILITADO',
            'SUSPENDIDO': 'SUSPENDIDO',
            'CANCELADO': 'CANCELADO',
            'VENCIDO': 'VENCIDO'
        }
        
        return mapping.get(estado, 'HABILITADO')
    
    def _map_nivel_atencion(self, value) -> str:
        """Mapea nivel de atención REPS al modelo"""
        if pd.isna(value):
            return 'NIVEL_I'
        
        nivel = str(value).upper().strip()
        if 'I' in nivel and 'II' not in nivel and 'III' not in nivel:
            return 'NIVEL_I'
        elif 'II' in nivel and 'III' not in nivel:
            return 'NIVEL_II'
        elif 'III' in nivel:
            return 'NIVEL_III'
        elif 'ESPECIALIZ' in nivel:
            return 'ESPECIALIZADO'
        else:
            return 'NIVEL_I'
    
    def _map_complejidad(self, value) -> str:
        """Mapea complejidad REPS al modelo"""
        if pd.isna(value):
            return 'BAJA'
        
        complejidad = str(value).upper().strip()
        if 'BAJA' in complejidad or 'BAJO' in complejidad:
            return 'BAJA'
        elif 'MEDIA' in complejidad or 'MEDIAN' in complejidad:
            return 'MEDIA'
        elif 'ALTA' in complejidad or 'ALTO' in complejidad:
            return 'ALTA'
        else:
            return 'BAJA'
    
    def _map_ambito(self, value) -> str:
        """Mapea ámbito REPS al modelo"""
        if pd.isna(value):
            return 'AMBULATORIO'
        
        ambito = str(value).upper().strip()
        if 'AMBULATORIO' in ambito:
            return 'AMBULATORIO'
        elif 'HOSPITALARIO' in ambito or 'HOSPITAL' in ambito:
            return 'HOSPITALARIO'
        elif 'DOMICILIARIO' in ambito or 'DOMICILIO' in ambito:
            return 'DOMICILIARIO'
        elif 'URGENCIA' in ambito:
            return 'URGENCIAS'
        else:
            return 'AMBULATORIO'
    
    def _update_headquarters(self, headquarters: HeadquarterLocation, row: pd.Series):
        """Actualiza sede existente con datos del REPS"""
        updated = False
        
        # Actualizar campos que pueden cambiar
        new_estado = self._map_estado_sede(row.get('Estado') or row.get('ESTADO'))
        if headquarters.estado_sede != new_estado:
            headquarters.estado_sede = new_estado
            updated = True
        
        new_telefono = self._clean_string(row.get('Teléfono') or row.get('TELEFONO', ''))
        if headquarters.telefono != new_telefono:
            headquarters.telefono = new_telefono
            updated = True
        
        if updated:
            headquarters.fecha_actualizacion_reps = datetime.now()
            headquarters.save()
    
    def _update_service(self, service: EnabledHealthService, row: pd.Series):
        """Actualiza servicio existente con datos del REPS"""
        updated = False
        
        # Actualizar campos que pueden cambiar
        new_estado = self._map_estado_servicio(row.get('Estado') or row.get('ESTADO'))
        if service.estado != new_estado:
            service.estado = new_estado
            updated = True
        
        new_capacidad = self._parse_int(row.get('Capacidad') or row.get('CAPACIDAD', 0))
        if service.capacidad_instalada != new_capacidad:
            service.capacidad_instalada = new_capacidad
            updated = True
        
        if updated:
            service.fecha_ultima_actualizacion = date.today()
            service.save()
    
    def get_parsing_summary(self) -> str:
        """Retorna un resumen legible del procesamiento"""
        summary = f"""
        Resumen de Importación REPS:
        ============================
        Sedes:
        - Procesadas: {self.parsing_stats['headquarters_processed']}
        - Creadas: {self.parsing_stats['headquarters_created']}
        - Actualizadas: {self.parsing_stats['headquarters_updated']}
        
        Servicios:
        - Procesados: {self.parsing_stats['services_processed']}
        - Creados: {self.parsing_stats['services_created']}
        - Actualizados: {self.parsing_stats['services_updated']}
        
        Errores: {len(self.parsing_stats['errors'])}
        """
        
        if self.parsing_stats['errors']:
            summary += "\nErrores encontrados:\n"
            for error in self.parsing_stats['errors'][:10]:  # Mostrar solo primeros 10
                summary += f"- {error}\n"
        
        return summary