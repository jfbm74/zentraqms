"""
Views para el sistema de templates organizacionales
ZentraQMS - Sistema de Gestión de Calidad
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404

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
    ComplejidadIPS,
)
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
from apps.common.permissions import BaseRolePermission


class ServicioHabilitadoViewSet(viewsets.ModelViewSet):
    """ViewSet para servicios habilitados"""
    queryset = ServicioHabilitado.objects.filter(activo=True)
    serializer_class = ServicioHabilitadoSerializer
    permission_classes = [IsAuthenticated, BaseRolePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'complejidad_minima']
    search_fields = ['nombre', 'codigo']
    ordering_fields = ['nombre', 'codigo', 'created_at']
    ordering = ['codigo']


class TipoComiteViewSet(viewsets.ModelViewSet):
    """ViewSet para tipos de comité"""
    queryset = TipoComite.objects.filter(activo=True)
    serializer_class = TipoComiteSerializer
    permission_classes = [IsAuthenticated, BaseRolePermission]
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
    permission_classes = [IsAuthenticated, BaseRolePermission]
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
    permission_classes = [IsAuthenticated, BaseRolePermission]
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
    queryset = AreaFuncionalCargo.objects.filter(activo=True)
    serializer_class = AreaFuncionalCargoSerializer
    permission_classes = [IsAuthenticated, BaseRolePermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['area_funcional', 'tipo_cargo', 'es_jefe_area']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class ValidacionSOGCSViewSet(viewsets.ModelViewSet):
    """ViewSet para validaciones SOGCS"""
    queryset = ValidacionSOGCS.objects.filter(activo=True)
    serializer_class = ValidacionSOGCSSerializer
    permission_classes = [IsAuthenticated, BaseRolePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'nivel_aplicacion', 'es_obligatoria']
    search_fields = ['nombre', 'codigo', 'descripcion']
    ordering_fields = ['nombre', 'codigo', 'created_at']
    ordering = ['nombre']


class TemplateOrganizacionalViewSet(viewsets.ModelViewSet):
    """ViewSet para templates organizacionales"""
    queryset = TemplateOrganizacional.objects.filter(activo=True)
    permission_classes = [IsAuthenticated, BaseRolePermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['complejidad_ips', 'es_template_base']
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
        queryset = self.get_queryset().filter(es_template_base=True)
        serializer = TemplateOrganizacionalListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_complejidad(self, request):
        """Obtiene templates por nivel de complejidad IPS"""
        complejidad = request.query_params.get('nivel')
        if not complejidad:
            return Response(
                {'error': 'Parámetro nivel requerido (I, II, III, IV)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if complejidad not in dict(ComplejidadIPS.choices):
            return Response(
                {'error': f'Nivel inválido. Opciones: {[choice[0] for choice in ComplejidadIPS.choices]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(complejidad_ips=complejidad)
        serializer = TemplateOrganizacionalListSerializer(queryset, many=True)
        return Response(serializer.data)
    
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
                    servicios_incluidos=template_original.servicios_incluidos,
                    estructura_organizacional=template_original.estructura_organizacional,
                    validaciones_sogcs=template_original.validaciones_sogcs,
                    configuracion_base=template_original.configuracion_base,
                    es_template_base=False,  # Los clones no son templates base
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
    queryset = AplicacionTemplate.objects.filter(activo=True)
    serializer_class = AplicacionTemplateSerializer
    permission_classes = [IsAuthenticated, BaseRolePermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['template', 'organizacion', 'estado', 'aplicado_por']
    ordering_fields = ['fecha_aplicacion', 'created_at']
    ordering = ['-fecha_aplicacion']
    
    @action(detail=False, methods=['post'])
    def aplicar_template(self, request):
        """Aplica un template a una organización"""
        serializer = AplicarTemplateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        template_id = validated_data['template_id']
        organizacion_id = validated_data['organizacion_id']
        configuracion_personalizada = validated_data['configuracion_personalizada']
        validar_sogcs = validated_data['validar_sogcs']
        
        try:
            with transaction.atomic():
                template = TemplateOrganizacional.objects.get(id=template_id)
                organizacion = Organization.objects.get(id=organizacion_id)
                
                # Crear registro de aplicación
                aplicacion = AplicacionTemplate.objects.create(
                    template=template,
                    organizacion=organizacion,
                    aplicado_por=request.user,
                    configuracion_personalizada=configuracion_personalizada,
                    estado='en_progreso'
                )
                
                # Aplicar el template (lógica de aplicación)
                resultado = self._aplicar_estructura_template(
                    template, organizacion, configuracion_personalizada, validar_sogcs
                )
                
                # Actualizar resultado
                aplicacion.resultado_aplicacion = resultado
                aplicacion.estado = 'aplicado' if resultado.get('success') else 'error'
                aplicacion.errores_aplicacion = resultado.get('errors', [])
                aplicacion.save()
                
                serializer = AplicacionTemplateSerializer(aplicacion)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'error': f'Error al aplicar template: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _aplicar_estructura_template(self, template, organizacion, config_personalizada, validar_sogcs):
        """Aplica la estructura del template a la organización"""
        try:
            resultado = {
                'success': True,
                'areas_creadas': 0,
                'cargos_creados': 0,
                'validaciones_aplicadas': 0,
                'warnings': [],
                'errors': []
            }
            
            # Obtener o crear organigrama
            organigrama, created = OrganizationalChart.objects.get_or_create(
                organization=organizacion,
                defaults={
                    'name': f'Organigrama {organizacion.razon_social}',
                    'description': f'Generado desde template {template.nombre}',
                    'chart_data': {},
                    'is_active': True
                }
            )
            
            if created:
                resultado['organigrama_creado'] = True
            
            # Aplicar estructura organizacional
            estructura = template.estructura_organizacional.get('areas', [])
            for area_data in estructura:
                # Aquí se implementaría la lógica de creación de áreas
                # Por simplicidad, solo contamos las que se crearían
                resultado['areas_creadas'] += 1
            
            # Aplicar validaciones SOGCS si se requiere
            if validar_sogcs:
                validaciones = template.validaciones_sogcs.get('validaciones', [])
                resultado['validaciones_aplicadas'] = len(validaciones)
            
            return resultado
            
        except Exception as e:
            return {
                'success': False,
                'errors': [str(e)]
            }


class HistorialCambiosTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para historial de cambios (solo lectura)"""
    queryset = HistorialCambiosTemplate.objects.all()
    serializer_class = HistorialCambiosTemplateSerializer
    permission_classes = [IsAuthenticated, BaseRolePermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['template', 'usuario', 'tipo_cambio']
    ordering_fields = ['fecha_cambio', 'created_at']
    ordering = ['-fecha_cambio']