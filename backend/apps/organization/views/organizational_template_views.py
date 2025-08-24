"""
Views para el sistema de templates organizacionales
ZentraQMS - Sistema de Gestión de Calidad
"""

import logging
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)

from ..models import (
    ServicioHabilitado,
    TipoComite,
    TipoCargo,
    AreaFuncional,
    AreaFuncionalCargo,
    TemplateOrganizacional,
    AplicacionTemplate,
    ValidacionSOGCS,
    HistorialCambiosTemplate,
    Organization,
    OrganizationalChart,
    Area,
    Cargo,
)
from ..models.organizational_chart import Sector
from ..models.organizational_template import ComplejidadIPS
from ..serializers.organizational_template_serializers import (
    ServicioHabilitadoSerializer,
    TipoComiteSerializer,
    TipoCargoSerializer,
    AreaFuncionalSerializer,
    AreaFuncionalCargoSerializer,
    TemplateOrganizacionalListSerializer,
    TemplateOrganizacionalDetailSerializer,
    AplicacionTemplateSerializer,
    ValidacionSOGCSSerializer,
    HistorialCambiosTemplateSerializer,
    AplicarTemplateSerializer,
)
from apps.authorization.drf_permissions import HasPermission


class ServicioHabilitadoViewSet(viewsets.ModelViewSet):
    """ViewSet para servicios habilitados"""
    queryset = ServicioHabilitado.objects.filter(activo=True)
    serializer_class = ServicioHabilitadoSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'complejidad_minima']
    search_fields = ['nombre', 'codigo']
    ordering_fields = ['nombre', 'codigo', 'created_at']
    ordering = ['codigo']


class TipoComiteViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de comité"""
    queryset = TipoComite.objects.filter(activo=True)
    serializer_class = TipoComiteSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'obligatorio_nivel_i', 'obligatorio_nivel_ii',
        'obligatorio_nivel_iii', 'obligatorio_nivel_iv'
    ]
    search_fields = ['nombre', 'codigo', 'descripcion']
    ordering_fields = ['nombre', 'codigo', 'created_at']
    ordering = ['nombre']
    
    @action(detail=False, methods=['get'])
    def por_nivel_ips(self, request):
        """Obtiene comités obligatorios por nivel de IPS"""
        nivel = request.query_params.get('nivel')
        if not nivel:
            return Response(
                {'error': 'Parámetro nivel requerido (I, II, III, IV)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        filter_field = f'obligatorio_nivel_{nivel.lower()}'
        queryset = self.get_queryset().filter(**{filter_field: True})
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class TipoCargoViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de cargo"""
    queryset = TipoCargo.objects.filter(activo=True)
    serializer_class = TipoCargoSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'es_directivo', 'es_coordinacion', 'es_jefatura',
        'obligatorio_nivel_i', 'obligatorio_nivel_ii',
        'obligatorio_nivel_iii', 'obligatorio_nivel_iv', 'sector'
    ]
    search_fields = ['nombre', 'codigo', 'descripcion']
    ordering_fields = ['nombre', 'codigo', 'created_at']
    ordering = ['nombre']
    
    @action(detail=False, methods=['get'])
    def por_nivel_ips(self, request):
        """Obtiene cargos obligatorios por nivel de IPS"""
        nivel = request.query_params.get('nivel')
        if not nivel:
            return Response(
                {'error': 'Parámetro nivel requerido (I, II, III, IV)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        filter_field = f'obligatorio_nivel_{nivel.lower()}'
        queryset = self.get_queryset().filter(**{filter_field: True})
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def directivos(self, request):
        """Obtiene solo cargos directivos"""
        queryset = self.get_queryset().filter(es_directivo=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AreaFuncionalViewSet(viewsets.ModelViewSet):
    """ViewSet para áreas funcionales"""
    queryset = AreaFuncional.objects.filter(activo=True)
    serializer_class = AreaFuncionalSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'nivel_jerarquico', 'obligatorio_nivel_i', 'obligatorio_nivel_ii',
        'obligatorio_nivel_iii', 'obligatorio_nivel_iv'
    ]
    search_fields = ['nombre', 'codigo', 'descripcion']
    ordering_fields = ['nombre', 'codigo', 'nivel_jerarquico', 'created_at']
    ordering = ['nivel_jerarquico', 'nombre']


class AreaFuncionalCargoViewSet(viewsets.ModelViewSet):
    """ViewSet para relaciones área-cargo"""
    queryset = AreaFuncionalCargo.objects.all()
    serializer_class = AreaFuncionalCargoSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['area_funcional', 'tipo_cargo', 'es_obligatorio']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class ValidacionSOGCSViewSet(viewsets.ModelViewSet):
    """ViewSet para validaciones SOGCS"""
    queryset = ValidacionSOGCS.objects.filter(activo=True)
    serializer_class = ValidacionSOGCSSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'complejidad_aplicable', 'severidad']
    search_fields = ['nombre', 'codigo', 'descripcion']
    ordering_fields = ['nombre', 'codigo', 'created_at']
    ordering = ['nombre']


class TemplateOrganizacionalViewSet(viewsets.ModelViewSet):
    """ViewSet para templates organizacionales"""
    queryset = TemplateOrganizacional.objects.filter(activo=True)
    permission_classes = [IsAuthenticated, HasPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['complejidad_ips', 'es_base']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'created_at']
    ordering = ['nombre']
    
    def get_serializer_class(self):
        """Serializer diferente para list y detail"""
        if self.action in ['list']:
            return TemplateOrganizacionalListSerializer
        return TemplateOrganizacionalDetailSerializer
    
    @action(detail=False, methods=['get'])
    def templates_base(self, request):
        """Obtiene solo templates base del sistema"""
        queryset = self.get_queryset().filter(es_base=True)
        serializer = TemplateOrganizacionalListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[])
    def por_complejidad(self, request):
        """Obtiene templates por nivel de complejidad IPS"""
        complejidad = request.query_params.get('nivel')
        if not complejidad:
            return Response(
                {'error': 'Parámetro nivel requerido (I, II, III, IV)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_choices = ['I', 'II', 'III', 'IV']
        if complejidad not in valid_choices:
            return Response(
                {'error': f'Nivel inválido. Opciones: {valid_choices}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try direct queryset with simple filtering
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id, nombre, descripcion, complejidad_ips, es_base, activo, created_at, updated_at FROM org_templates_organizacionales WHERE activo = 1 AND complejidad_ips = %s",
                    [complejidad]
                )
                rows = cursor.fetchall()
                
            # Convert to simplified dict format for serializer
            templates_data = []
            for row in rows:
                templates_data.append({
                    'id': row[0],
                    'nombre': row[1], 
                    'descripcion': row[2],
                    'complejidad_ips': row[3],
                    'servicios_incluidos_count': 0,  # Placeholder
                    'areas_incluidas_count': 0,     # Placeholder
                    'validaciones_count': 0,        # Placeholder
                    'es_base': row[4],
                    'activo': row[5],
                    'created_at': row[6],
                    'updated_at': row[7]
                })
            
            return Response(templates_data)
        except Exception as e:
            # Debug: Return the actual error
            return Response({'error': str(e)})
    
    @action(detail=True, methods=['post'])
    def clonar(self, request, pk=None):
        """Clona un template existente"""
        template_original = self.get_object()
        nuevo_nombre = request.data.get('nombre')
        
        if not nuevo_nombre:
            return Response(
                {'error': 'Nombre para el nuevo template es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Crear copia del template
                template_clone = TemplateOrganizacional.objects.create(
                    nombre=nuevo_nombre,
                    descripcion=f"Clon de {template_original.nombre}",
                    complejidad_ips=template_original.complejidad_ips,
                    estructura_organizacional=template_original.estructura_organizacional,
                    validaciones_sogcs=template_original.validaciones_sogcs,
                    es_base=False,  # Los clones no son templates base
                    activo=True
                )
                
                # Registrar en historial
                HistorialCambiosTemplate.objects.create(
                    template=template_clone,
                    usuario=request.user,
                    tipo_cambio='creacion',
                    descripcion_cambio=f'Template clonado desde: {template_original.nombre}',
                    datos_nuevos={'template_original_id': str(template_original.id)}
                )
                
                serializer = TemplateOrganizacionalDetailSerializer(template_clone)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': f'Error al clonar template: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AplicacionTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet para aplicaciones de templates"""
    queryset = AplicacionTemplate.objects.all()
    serializer_class = AplicacionTemplateSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['template', 'organizacion', 'estado', 'aplicado_por']
    ordering_fields = ['fecha_aplicacion']
    ordering = ['-fecha_aplicacion']
    
    @action(detail=False, methods=['post'])
    def aplicar_template(self, request):
        """Aplica un template a una organización"""
        logger.info(f"Aplicar template request data: {request.data}")
        serializer = AplicarTemplateSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        template_id = validated_data['template_id']
        organizacion_id = validated_data['organizacion_id']
        configuracion_personalizada = validated_data['configuracion_personalizada']
        validar_sogcs = validated_data['validar_sogcs']
        
        try:
            with transaction.atomic():
                logger.info(f"Buscando template con ID: {template_id}")
                template = TemplateOrganizacional.objects.get(id=template_id)
                logger.info(f"Template encontrado: {template.nombre}")
                
                logger.info(f"Buscando organización con ID: {organizacion_id}")
                organizacion = Organization.objects.get(id=organizacion_id)
                logger.info(f"Organización encontrada: {organizacion.razon_social}")
                
                # Crear registro de aplicación
                logger.info("Creando registro de aplicación...")
                aplicacion = AplicacionTemplate.objects.create(
                    template=template,
                    organizacion=organizacion,
                    aplicado_por=request.user,
                    customizaciones=configuracion_personalizada,
                    estado='en_proceso'
                )
                logger.info(f"Aplicación creada con ID: {aplicacion.id}")
                
                # Aplicar el template (lógica de aplicación)
                logger.info("Iniciando aplicación de estructura template...")
                resultado = self._aplicar_estructura_template(
                    template, organizacion, configuracion_personalizada, validar_sogcs
                )
                logger.info(f"Resultado de aplicación: {resultado}")
                
                # Actualizar resultado
                logger.info("Actualizando registro de aplicación...")
                aplicacion.estructura_generada = resultado.get('estructura_generada', {})
                aplicacion.estado = 'completada' if resultado.get('success') else 'fallida'
                aplicacion.gaps_identificados = resultado.get('gaps', [])
                aplicacion.porcentaje_cumplimiento = resultado.get('cumplimiento', 0.0)
                if resultado.get('success'):
                    aplicacion.fecha_completado = timezone.now()
                aplicacion.save()
                logger.info("Aplicación actualizada correctamente")
                
                serializer = AplicacionTemplateSerializer(aplicacion)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Error completo en aplicar_template: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Error al aplicar template: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _aplicar_estructura_template(self, template, organizacion, config_personalizada, validar_sogcs):
        """Aplica la estructura del template a la organización"""
        try:
            logger.info("Iniciando _aplicar_estructura_template")
            resultado = {
                'success': True,
                'areas_creadas': 0,
                'cargos_creados': 0,
                'validaciones_aplicadas': 0,
                'warnings': [],
                'estructura_generada': {},
                'gaps': [],
                'cumplimiento': 100.0
            }
            
            # Obtener o crear organigrama (debe tener un sector, así que necesitamos uno por defecto)
            logger.info("Intentando obtener/crear sector por defecto")
            try:
                sector_default, created_sector = Sector.objects.get_or_create(
                    code='HEALTH',
                    defaults={
                        'name': 'Sector Salud',
                        'description': 'Sector de salud por defecto'
                    }
                )
                logger.info(f"Sector {'creado' if created_sector else 'obtenido'}: {sector_default}")
            except Exception as e:
                logger.error(f"Error al crear/obtener sector: {str(e)}")
                raise e
            
            logger.info("Intentando obtener/crear organigrama")
            try:
                organigrama, created = OrganizationalChart.objects.get_or_create(
                    organization=organizacion,
                    defaults={
                        'sector': sector_default,
                        'organization_type': 'IPS',
                        'version': '1.0',
                        'effective_date': timezone.now().date(),
                        'is_current': True
                    }
                )
                logger.info(f"Organigrama {'creado' if created else 'obtenido'}: {organigrama.id}")
            except Exception as e:
                logger.error(f"Error al crear/obtener organigrama: {str(e)}")
                raise e
            
            if created:
                resultado['organigrama_creado'] = True
            
            # Aplicar estructura organizacional real
            estructura = template.estructura_organizacional
            areas_creadas = 0
            cargos_creados = 0
            
            # Crear áreas y cargos según la estructura del template
            areas_creadas, cargos_creados = self._crear_estructura_real(organigrama, estructura)
            
            resultado['areas_creadas'] = areas_creadas
            resultado['cargos_creados'] = cargos_creados
            
            # Aplicar validaciones SOGCS si se requiere
            if validar_sogcs:
                validaciones = template.validaciones_sogcs.get('validaciones', [])
                resultado['validaciones_aplicadas'] = len(validaciones)
            
            # Establecer la estructura generada con información detallada
            resultado['estructura_generada'] = {
                'organigrama_id': str(organigrama.id),
                'areas_creadas': resultado['areas_creadas'],
                'cargos_creados': resultado['cargos_creados'],
                'template_aplicado': template.nombre,
                'fecha_aplicacion': timezone.now().isoformat(),
                'organigrama_creado': created
            }
            
            return resultado
            
        except Exception as e:
            return {
                'success': False,
                'estructura_generada': {},
                'gaps': [f'Error en aplicación: {str(e)}'],
                'cumplimiento': 0.0
            }

    def _crear_estructura_real(self, organigrama, estructura):
        """
        Crea la estructura organizacional real basada en el template.
        
        Args:
            organigrama: Instancia de OrganizationalChart
            estructura: Dict con la estructura del template
            
        Returns:
            tuple: (areas_creadas, cargos_creados)
        """
        areas_creadas = 0
        cargos_creados = 0
        
        # Mapeo de códigos de área a tipos
        area_type_mapping = {
            'direccion': 'DIRECTION',
            'coordinaciones': 'DEPARTMENT', 
            'areas_funcionales': 'UNIT',
            'consulta_externa_i': 'SERVICE',
            'calidad_i': 'UNIT',
            'administrativo_i': 'UNIT',
            'archivo_clinico': 'UNIT'
        }
        
        # Mapeo de códigos de cargo a niveles jerárquicos
        cargo_hierarchy_mapping = {
            'director_general_i': ('EXECUTIVE', 1),
            'coordinador_medico_i': ('SENIOR_MANAGEMENT', 2),
            'responsable_calidad': ('PROFESSIONAL', 3),
            'responsable_administrativo': ('PROFESSIONAL', 3),
        }
        
        try:
            # 1. Crear área de dirección
            if 'direccion' in estructura:
                area_direccion, created = Area.objects.get_or_create(
                    organizational_chart=organigrama,
                    code='DIR-001',
                    defaults={
                        'name': 'Dirección General',
                        'area_type': 'DIRECTION',
                        'hierarchy_level': 1,
                        'description': 'Dirección ejecutiva de la organización',
                        'main_purpose': 'Liderar la estrategia y operación general de la IPS'
                    }
                )
                if created:
                    areas_creadas += 1
                
                # Crear cargo de director general
                director_general_cargo = None
                if 'director_general' in estructura['direccion']:
                    director_data = estructura['direccion']['director_general']
                    hierarchy, level = cargo_hierarchy_mapping.get(director_data['cargo'], ('EXECUTIVE', 1))
                    
                    director_general_cargo, created = Cargo.objects.get_or_create(
                        area=area_direccion,
                        code='DIR-GEN-001',
                        defaults={
                            'name': 'Director General',
                            'hierarchy_level': level,
                            'main_purpose': 'Dirigir y representar la institución',
                            'requirements': director_data.get('perfil', ''),
                            'is_critical': True,
                            'is_process_owner': True,
                            'authorized_positions': 1,
                            'position_type': 'PERMANENT'
                        }
                    )
                    if created:
                        cargos_creados += 1
            
            # 2. Crear área de coordinaciones
            if 'coordinaciones' in estructura:
                area_coord, created = Area.objects.get_or_create(
                    organizational_chart=organigrama,
                    code='COORD-001',
                    defaults={
                        'name': 'Coordinaciones',
                        'area_type': 'DEPARTMENT',
                        'hierarchy_level': 2,
                        'parent_area': area_direccion if 'direccion' in estructura else None,
                        'description': 'Coordinaciones técnicas y administrativas',
                        'main_purpose': 'Coordinar las diferentes áreas funcionales'
                    }
                )
                if created:
                    areas_creadas += 1
                
                # Crear cargos de coordinadores y almacenar referencias
                coordinacion_cargos = {}
                for coord_key, coord_data in estructura['coordinaciones'].items():
                    if isinstance(coord_data, dict) and 'cargo' in coord_data:
                        hierarchy, level = cargo_hierarchy_mapping.get(coord_data['cargo'], ('PROFESSIONAL', 3))
                        
                        # Determinar nombre del cargo
                        cargo_names = {
                            'coordinador_medico': 'Coordinador Médico',
                            'responsable_calidad': 'Responsable de Calidad',
                            'responsable_administrativo': 'Responsable Administrativo'
                        }
                        cargo_name = cargo_names.get(coord_key, coord_key.replace('_', ' ').title())
                        
                        # Obtener el Director General para establecer jerarquía
                        director_general = director_general_cargo
                        
                        cargo, created = Cargo.objects.get_or_create(
                            area=area_coord,
                            code=f'COORD-{coord_key.upper()[:3]}-001',
                            defaults={
                                'name': cargo_name,
                                'hierarchy_level': level,
                                'reports_to': director_general,  # Reportar al Director General
                                'main_purpose': f'Coordinar {coord_key.replace("_", " ")}',
                                'requirements': coord_data.get('perfil', ''),
                                'is_critical': coord_data.get('obligatorio', False),
                                'is_process_owner': True,
                                'authorized_positions': 1,
                                'position_type': 'PERMANENT'
                            }
                        )
                        if created:
                            cargos_creados += 1
                        
                        # Almacenar referencia para usar en áreas funcionales
                        coordinacion_cargos[coord_key] = cargo
            
            # 3. Crear áreas funcionales
            if 'areas_funcionales' in estructura:
                parent_area = locals().get('area_coord') or locals().get('area_direccion')
                
                for i, area_funcional in enumerate(estructura['areas_funcionales']):
                    area_names = {
                        'consulta_externa_i': 'Consulta Externa',
                        'calidad_i': 'Gestión de Calidad',
                        'administrativo_i': 'Área Administrativa',
                        'archivo_clinico': 'Archivo Clínico'
                    }
                    
                    area_name = area_names.get(area_funcional, area_funcional.replace('_', ' ').title())
                    area_type = area_type_mapping.get(area_funcional, 'UNIT')
                    
                    area_funcional_obj, created = Area.objects.get_or_create(
                        organizational_chart=organigrama,
                        code=f'AF-{str(i+1).zfill(3)}',
                        defaults={
                            'name': area_name,
                            'area_type': area_type,
                            'hierarchy_level': 3,
                            'parent_area': parent_area,
                            'description': f'Área funcional de {area_name.lower()}',
                            'main_purpose': f'Gestionar operaciones de {area_name.lower()}'
                        }
                    )
                    if created:
                        areas_creadas += 1
                    
                    # Determinar a quién reporta este responsable de área funcional
                    reports_to_cargo = director_general_cargo  # Por defecto reportar al Director General
                    
                    # Buscar el coordinador más apropiado
                    if area_name == 'Gestión de Calidad' and 'responsable_calidad' in coordinacion_cargos:
                        reports_to_cargo = coordinacion_cargos['responsable_calidad']
                    elif area_name == 'Área Administrativa' and 'responsable_administrativo' in coordinacion_cargos:
                        reports_to_cargo = coordinacion_cargos['responsable_administrativo']
                    elif area_name == 'Consulta Externa' and 'coordinador_medico' in coordinacion_cargos:
                        reports_to_cargo = coordinacion_cargos['coordinador_medico']
                    
                    # Crear al menos un cargo básico por área funcional
                    cargo, created = Cargo.objects.get_or_create(
                        area=area_funcional_obj,  # Usar el objeto área creado
                        code=f'AF-{str(i+1).zfill(3)}-001',
                        defaults={
                            'name': f'Responsable de {area_name}',
                            'hierarchy_level': 4,
                            'reports_to': reports_to_cargo,  # Establecer jerarquía
                            'main_purpose': f'Responsable operativo de {area_name.lower()}',
                            'requirements': 'Profesional con experiencia en el área',
                            'is_critical': False,
                            'authorized_positions': 1,
                            'position_type': 'PERMANENT'
                        }
                    )
                    if created:
                        cargos_creados += 1
                    
        except Exception as e:
            # Si hay error, al menos crear estructura mínima
            if areas_creadas == 0:
                area_basic, created = Area.objects.get_or_create(
                    organizational_chart=organigrama,
                    code='BASIC-001',
                    defaults={
                        'name': 'Estructura Básica',
                        'area_type': 'DIRECTION',
                        'hierarchy_level': 1,
                        'description': 'Estructura básica generada automáticamente'
                    }
                )
                if created:
                    areas_creadas = 1
                
                cargo_basic, created = Cargo.objects.get_or_create(
                    area=area_basic,
                    code='BASIC-001',
                    defaults={
                        'name': 'Director General',
                        'hierarchy_level': 1,
                        'main_purpose': 'Dirigir la organización',
                        'is_critical': True,
                        'authorized_positions': 1,
                        'position_type': 'PERMANENT'
                    }
                )
                if created:
                    cargos_creados = 1
        
        return areas_creadas, cargos_creados


class HistorialCambiosTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para historial de cambios (solo lectura)"""
    queryset = HistorialCambiosTemplate.objects.all()
    serializer_class = HistorialCambiosTemplateSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['template', 'usuario', 'tipo_cambio']
    ordering_fields = ['fecha_cambio', 'created_at']
    ordering = ['-fecha_cambio']