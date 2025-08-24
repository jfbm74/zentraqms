"""
Modelos para el Sistema de Templates Organizacionales
ZentraQMS - Sistema de Gestión de Calidad para Instituciones de Salud
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import json

from .organizational_chart import Sector

User = get_user_model()


class ComplejidadIPS(models.TextChoices):
    """Niveles de complejidad de IPS según normativa colombiana"""
    NIVEL_I = 'I', 'Nivel I - Baja Complejidad'
    NIVEL_II = 'II', 'Nivel II - Mediana Complejidad'  
    NIVEL_III = 'III', 'Nivel III - Alta Complejidad'
    NIVEL_IV = 'IV', 'Nivel IV - Alta Complejidad'


class ServicioHabilitado(models.Model):
    """
    Servicios que puede tener habilitada una IPS
    Basado en resolución 3100/2019
    """
    codigo = models.CharField(max_length=10, unique=True, help_text="Código del servicio según normativa")
    nombre = models.CharField(max_length=200)
    categoria = models.CharField(max_length=50, choices=[
        ('consulta_externa', 'Consulta Externa'),
        ('urgencias', 'Urgencias'),
        ('hospitalizacion', 'Hospitalización'),
        ('cirugia', 'Cirugía'),
        ('uci', 'Unidad de Cuidados Intensivos'),
        ('apoyo_diagnostico', 'Apoyo Diagnóstico'),
        ('apoyo_terapeutico', 'Apoyo Terapéutico'),
        ('transporte_asistencial', 'Transporte Asistencial'),
        ('otros', 'Otros')
    ])
    complejidad_minima = models.CharField(
        max_length=3,
        choices=ComplejidadIPS.choices,
        help_text="Complejidad mínima requerida para este servicio"
    )
    activo = models.BooleanField(default=True)
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'org_servicios_habilitados'
        verbose_name = 'Servicio Habilitado'
        verbose_name_plural = 'Servicios Habilitados'
        ordering = ['categoria', 'nombre']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class TipoComite(models.Model):
    """
    Comités requeridos por normativa según nivel de complejidad
    """
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField()
    base_normativa = models.CharField(max_length=200, help_text="Resolución o norma que lo requiere")
    periodicidad = models.CharField(max_length=50, choices=[
        ('semanal', 'Semanal'),
        ('quincenal', 'Quincenal'), 
        ('mensual', 'Mensual'),
        ('bimestral', 'Bimestral'),
        ('trimestral', 'Trimestral'),
        ('semestral', 'Semestral'),
        ('anual', 'Anual')
    ])
    obligatorio_nivel_i = models.BooleanField(default=False)
    obligatorio_nivel_ii = models.BooleanField(default=False)
    obligatorio_nivel_iii = models.BooleanField(default=False)
    obligatorio_nivel_iv = models.BooleanField(default=False)
    
    # Servicios que requieren este comité
    servicios_requeridos = models.ManyToManyField(
        ServicioHabilitado, 
        blank=True,
        help_text="Servicios que requieren este comité específicamente"
    )
    
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'org_tipos_comite'
        verbose_name = 'Tipo de Comité'
        verbose_name_plural = 'Tipos de Comité'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class TipoCargo(models.Model):
    """
    Cargos directivos y coordinaciones requeridas según nivel
    """
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField()
    perfil_requerido = models.TextField(help_text="Perfil profesional requerido según normativa")
    es_directivo = models.BooleanField(default=False)
    es_coordinacion = models.BooleanField(default=False)
    es_jefatura = models.BooleanField(default=False)
    
    # Requerimientos por nivel
    obligatorio_nivel_i = models.BooleanField(default=False)
    obligatorio_nivel_ii = models.BooleanField(default=False) 
    obligatorio_nivel_iii = models.BooleanField(default=False)
    obligatorio_nivel_iv = models.BooleanField(default=False)
    
    # Servicios que requieren este cargo
    servicios_requeridos = models.ManyToManyField(
        ServicioHabilitado,
        blank=True,
        help_text="Servicios que requieren este cargo específicamente"
    )
    
    # Parámetros para cálculo de dotación
    ratio_personal = models.CharField(
        max_length=200,
        blank=True,
        help_text="Ej: '1 por cada 10 camas', '1 por turno', etc."
    )
    
    sector = models.ForeignKey(
        Sector,
        on_delete=models.CASCADE,
        help_text="Sector al que pertenece este cargo"
    )
    
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'org_tipos_cargo'
        verbose_name = 'Tipo de Cargo'
        verbose_name_plural = 'Tipos de Cargo'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class AreaFuncional(models.Model):
    """
    Áreas funcionales requeridas según nivel de complejidad
    """
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField()
    categoria = models.CharField(max_length=50, choices=[
        ('asistencial', 'Asistencial'),
        ('administrativa', 'Administrativa'),
        ('apoyo', 'Apoyo'),
        ('calidad', 'Calidad y Seguridad'),
        ('estrategica', 'Estratégica')
    ])
    
    # Requerimientos por nivel
    obligatoria_nivel_i = models.BooleanField(default=False)
    obligatoria_nivel_ii = models.BooleanField(default=False)
    obligatoria_nivel_iii = models.BooleanField(default=False)
    obligatoria_nivel_iv = models.BooleanField(default=False)
    
    # Servicios relacionados
    servicios_relacionados = models.ManyToManyField(
        ServicioHabilitado,
        blank=True
    )
    
    # Cargos que debe tener esta área
    cargos_requeridos = models.ManyToManyField(
        TipoCargo,
        through='AreaFuncionalCargo',
        help_text="Cargos que debe tener esta área funcional"
    )
    
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'org_areas_funcionales'
        verbose_name = 'Área Funcional'
        verbose_name_plural = 'Áreas Funcionales'
        ordering = ['categoria', 'nombre']
    
    def __str__(self):
        return self.nombre


class AreaFuncionalCargo(models.Model):
    """
    Relación entre áreas funcionales y cargos con parámetros específicos
    """
    area_funcional = models.ForeignKey(AreaFuncional, on_delete=models.CASCADE)
    tipo_cargo = models.ForeignKey(TipoCargo, on_delete=models.CASCADE)
    
    es_obligatorio = models.BooleanField(default=True)
    cantidad_minima = models.PositiveIntegerField(default=1)
    cantidad_maxima = models.PositiveIntegerField(blank=True, null=True)
    
    # Turnos requeridos
    requiere_24_7 = models.BooleanField(default=False)
    turnos_requeridos = models.CharField(
        max_length=100,
        blank=True,
        help_text="Ej: 'Diurno', 'Nocturno', '24/7', etc."
    )
    
    class Meta:
        db_table = 'org_area_funcional_cargos'
        unique_together = ['area_funcional', 'tipo_cargo']


class TemplateOrganizacional(models.Model):
    """
    Template predefinido de estructura organizacional
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    sector = models.ForeignKey(
        Sector,
        on_delete=models.CASCADE,
        help_text="Sector al que aplica este template"
    )
    complejidad_ips = models.CharField(
        max_length=3,
        choices=ComplejidadIPS.choices,
        help_text="Nivel de complejidad de IPS para este template"
    )
    
    # Servicios incluidos en este template
    servicios_incluidos = models.ManyToManyField(
        ServicioHabilitado,
        help_text="Servicios habilitados cubiertos por este template"
    )
    
    # Metadatos del template
    es_oficial = models.BooleanField(
        default=False,
        help_text="Template oficial certificado por ZentraQMS"
    )
    es_base = models.BooleanField(
        default=False,
        help_text="Template base para creación de otros templates"
    )
    version = models.CharField(max_length=20, default='1.0')
    fecha_vigencia_desde = models.DateField()
    fecha_vigencia_hasta = models.DateField(blank=True, null=True)
    
    # Estructura del template (JSON)
    estructura_organizacional = models.JSONField(
        default=dict,
        help_text="Estructura organizacional completa en formato JSON"
    )
    
    # Configuración de validación
    validaciones_sogcs = models.JSONField(
        default=dict,
        help_text="Reglas de validación SOGCS específicas"
    )
    
    # Indicadores requeridos
    indicadores_minimos = models.JSONField(
        default=list,
        help_text="Lista de indicadores mínimos requeridos"
    )
    
    # Estadísticas de uso
    veces_aplicado = models.PositiveIntegerField(default=0)
    rating_promedio = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0.00), MaxValueValidator(5.00)]
    )
    
    # Autoría y gestión
    creado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='templates_creados'
    )
    aprobado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='templates_aprobados'
    )
    fecha_aprobacion = models.DateTimeField(blank=True, null=True)
    
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'org_templates_organizacionales'
        verbose_name = 'Template Organizacional'
        verbose_name_plural = 'Templates Organizacionales'
        ordering = ['-es_oficial', '-es_base', 'complejidad_ips', 'nombre']
        unique_together = ['nombre', 'sector', 'complejidad_ips', 'version']
    
    def __str__(self):
        return f"{self.nombre} - {self.get_complejidad_ips_display()}"
    
    def incrementar_uso(self):
        """Incrementa contador de veces aplicado"""
        self.veces_aplicado += 1
        self.save(update_fields=['veces_aplicado'])
    
    def calcular_cumplimiento_sogcs(self, organizacion_data):
        """Calcula % de cumplimiento SOGCS de una estructura vs este template"""
        # Implementar lógica de validación
        pass


class AplicacionTemplate(models.Model):
    """
    Registro de aplicación de un template a una organización
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        TemplateOrganizacional,
        on_delete=models.CASCADE,
        related_name='aplicaciones'
    )
    organizacion = models.ForeignKey(
        'organization.Organization',
        on_delete=models.CASCADE,
        related_name='templates_aplicados'
    )
    
    # Parámetros de aplicación
    servicios_seleccionados = models.JSONField(
        default=list,
        help_text="Servicios específicos seleccionados para aplicar"
    )
    customizaciones = models.JSONField(
        default=dict,
        help_text="Customizaciones realizadas al template base"
    )
    
    # Estado de la aplicación
    estado = models.CharField(max_length=20, choices=[
        ('iniciada', 'Iniciada'),
        ('en_proceso', 'En Proceso'),
        ('completada', 'Completada'),
        ('fallida', 'Fallida'),
        ('revertida', 'Revertida')
    ], default='iniciada')
    
    # Resultados de aplicación
    estructura_generada = models.JSONField(
        default=dict,
        help_text="Estructura organizacional final generada"
    )
    porcentaje_cumplimiento = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="% de cumplimiento SOGCS logrado"
    )
    gaps_identificados = models.JSONField(
        default=list,
        help_text="Gaps de cumplimiento identificados"
    )
    
    # Feedback del usuario
    rating = models.PositiveIntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comentarios = models.TextField(blank=True)
    
    # Gestión
    aplicado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    fecha_aplicacion = models.DateTimeField(auto_now_add=True)
    fecha_completado = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'org_aplicaciones_template'
        verbose_name = 'Aplicación de Template'
        verbose_name_plural = 'Aplicaciones de Template'
        ordering = ['-fecha_aplicacion']
    
    def __str__(self):
        return f"{self.template.nombre} → {self.organizacion.name}"


class ValidacionSOGCS(models.Model):
    """
    Reglas de validación SOGCS parametrizables
    """
    codigo = models.CharField(max_length=50, unique=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    categoria = models.CharField(max_length=50, choices=[
        ('estructura', 'Estructura Organizacional'),
        ('cargos', 'Cargos y Personal'),
        ('comites', 'Comités'),
        ('documentos', 'Documentación'),
        ('indicadores', 'Indicadores'),
        ('procesos', 'Procesos')
    ])
    
    # Regla de validación
    regla_validacion = models.JSONField(
        help_text="Regla de validación en formato JSON"
    )
    
    # Aplicabilidad
    complejidad_aplicable = models.JSONField(
        default=list,
        help_text="Niveles de complejidad donde aplica ['I', 'II', 'III', 'IV']"
    )
    servicios_aplicables = models.ManyToManyField(
        ServicioHabilitado,
        blank=True,
        help_text="Servicios específicos donde aplica"
    )
    
    # Severidad del incumplimiento
    severidad = models.CharField(max_length=20, choices=[
        ('critica', 'Crítica - Impide habilitación'),
        ('alta', 'Alta - Requiere corrección inmediata'),
        ('media', 'Media - Requiere plan de mejora'),
        ('baja', 'Baja - Recomendación')
    ])
    
    # Normativa que la sustenta
    base_normativa = models.CharField(max_length=200)
    articulo_norma = models.CharField(max_length=100, blank=True)
    
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'org_validaciones_sogcs'
        verbose_name = 'Validación SOGCS'
        verbose_name_plural = 'Validaciones SOGCS'
        ordering = ['categoria', 'severidad', 'nombre']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class HistorialCambiosTemplate(models.Model):
    """
    Auditoría de cambios en templates
    """
    template = models.ForeignKey(
        TemplateOrganizacional,
        on_delete=models.CASCADE,
        related_name='historial_cambios'
    )
    accion = models.CharField(max_length=50, choices=[
        ('creacion', 'Creación'),
        ('modificacion', 'Modificación'),
        ('aprobacion', 'Aprobación'),
        ('desactivacion', 'Desactivación'),
        ('reactivacion', 'Reactivación')
    ])
    campo_modificado = models.CharField(max_length=100, blank=True)
    valor_anterior = models.JSONField(blank=True, null=True)
    valor_nuevo = models.JSONField(blank=True, null=True)
    justificacion = models.TextField(blank=True)
    
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    fecha = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'org_historial_cambios_template'
        verbose_name = 'Historial de Cambios Template'
        verbose_name_plural = 'Historiales de Cambios Template'
        ordering = ['-fecha']