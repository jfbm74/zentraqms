"""
  Health-specific organization models.

  Contains models for health sector organizations including HealthOrganization
  and HealthService for compliance with Colombian health regulations.
  """

from django.db import models
from django.conf import settings
from django.core.validators import (
      RegexValidator,
      MinLengthValidator,
      MaxLengthValidator,
  )
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.common.models import FullBaseModel

  # Import the Organization and Location models from base

from .base import Organization, Location


class HealthOrganization(FullBaseModel):
    """
    Extension for health sector organizations (IPS - Instituciones Prestadoras de Servicios de Salud).
    
    This model stores additional fields required for Colombian health institutions
    to comply with Sistema Único de Habilitación (SUH) and REPS requirements.
    """
    
    # Naturaleza Jurídica Choices (específicos para salud)
    NATURALEZA_JURIDICA_CHOICES = [
        ('privada', _('Privada')),
        ('publica', _('Pública')),
        ('mixta', _('Mixta')),
    ]
    
    # Nivel de Complejidad Choices (según resolución 3100/2019)
    NIVEL_COMPLEJIDAD_CHOICES = [
        ('I', _('Nivel I - Baja Complejidad')),
        ('II', _('Nivel II - Mediana Complejidad')),
        ('III', _('Nivel III - Alta Complejidad')),
        ('IV', _('Nivel IV - Máxima Complejidad')),
    ]
    
    # Tipo de Prestador Choices
    TIPO_PRESTADOR_CHOICES = [
        ('IPS', _('IPS - Institución Prestadora de Servicios')),
        ('HOSPITAL', _('Hospital')),
        ('CLINICA', _('Clínica')),
        ('CENTRO_MEDICO', _('Centro Médico')),
        ('LABORATORIO', _('Laboratorio Clínico')),
        ('CENTRO_DIAGNOSTICO', _('Centro de Diagnóstico')),
        ('AMBULATORIO', _('Centro Ambulatorio')),
        ('OTRO', _('Otro')),
    ]
    
    # Tipo de Documento Choices para representante legal
    TIPO_DOCUMENTO_CHOICES = [
        ('CC', _('Cédula de Ciudadanía')),
        ('CE', _('Cédula de Extranjería')),
        ('PA', _('Pasaporte')),
        ('NIT', _('NIT')),
        ('TI', _('Tarjeta de Identidad')),
    ]
    
    # Relación con Organization (OneToOne)
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='health_profile',
        verbose_name=_('organización'),
        help_text=_('Organización base a la que pertenece este perfil de salud.')
    )
    
    # === INFORMACIÓN REPS ===
    codigo_prestador = models.CharField(
        _('código prestador REPS'),
        max_length=12,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\d{12}$',
                message=_('El código prestador debe tener exactamente 12 dígitos.')
            )
        ],
        help_text=_('Código de 12 dígitos asignado por el Ministerio de Salud en REPS.')
    )
    
    verificado_reps = models.BooleanField(
        _('verificado en REPS'),
        default=False,
        help_text=_('Indica si el código prestador ha sido verificado contra REPS.')
    )
    
    fecha_verificacion_reps = models.DateTimeField(
        _('fecha verificación REPS'),
        null=True,
        blank=True,
        help_text=_('Fecha y hora de la última verificación contra REPS.')
    )
    
    datos_reps = models.JSONField(
        _('datos REPS'),
        null=True,
        blank=True,
        help_text=_('Datos adicionales obtenidos de REPS (nombre, dirección, etc.).')
    )
    
    # === CLASIFICACIÓN INSTITUCIONAL ===
    naturaleza_juridica = models.CharField(
        _('naturaleza jurídica'),
        max_length=10,
        choices=NATURALEZA_JURIDICA_CHOICES,
        help_text=_('Naturaleza jurídica de la institución de salud.')
    )
    
    tipo_prestador = models.CharField(
        _('tipo de prestador'),
        max_length=20,
        choices=TIPO_PRESTADOR_CHOICES,
        default='IPS',
        help_text=_('Tipo de prestador de servicios de salud.')
    )
    
    nivel_complejidad = models.CharField(
        _('nivel de complejidad'),
        max_length=3,
        choices=NIVEL_COMPLEJIDAD_CHOICES,
        help_text=_('Nivel de complejidad según capacidad resolutiva.')
    )
    
    # === REPRESENTANTE LEGAL ===
    representante_tipo_documento = models.CharField(
        _('tipo documento representante'),
        max_length=3,
        choices=TIPO_DOCUMENTO_CHOICES,
        help_text=_('Tipo de documento del representante legal.')
    )
    
    representante_numero_documento = models.CharField(
        _('número documento representante'),
        max_length=20,
        help_text=_('Número de documento del representante legal.')
    )
    
    representante_nombre_completo = models.CharField(
        _('nombre completo representante'),
        max_length=200,
        help_text=_('Nombre completo del representante legal.')
    )
    
    representante_telefono = models.CharField(
        _('teléfono representante'),
        max_length=15,
        validators=[
            RegexValidator(
                regex=r'^\+?[\d\s\-\(\)]{7,15}$',
                message=_('Número de teléfono debe tener un formato válido.')
            )
        ],
        help_text=_('Teléfono de contacto del representante legal.')
    )
    
    representante_email = models.EmailField(
        _('email representante'),
        help_text=_('Correo electrónico del representante legal.')
    )
    
    # === INFORMACIÓN DE HABILITACIÓN ===
    fecha_habilitacion = models.DateField(
        _('fecha de habilitación'),
        null=True,
        blank=True,
        help_text=_('Fecha de habilitación inicial de la institución.')
    )
    
    resolucion_habilitacion = models.CharField(
        _('resolución de habilitación'),
        max_length=50,
        blank=True,
        help_text=_('Número de resolución que otorga la habilitación.')
    )
    
    registro_especial = models.CharField(
        _('registro especial'),
        max_length=50,
        blank=True,
        help_text=_('Número de registro especial si aplica.')
    )
    
    # === INFORMACIÓN ADICIONAL ===
    servicios_habilitados_count = models.PositiveIntegerField(
        _('cantidad servicios habilitados'),
        default=0,
        help_text=_('Contador de servicios habilitados (se actualiza automáticamente).')
    )
    
    observaciones_salud = models.TextField(
        _('observaciones de salud'),
        blank=True,
        max_length=1000,
        help_text=_('Observaciones específicas del perfil de salud.')
    )
    
    # === CAMPOS SOGCS ===
    # Activación y configuración del módulo SOGCS
    sogcs_enabled = models.BooleanField(
        _('SOGCS habilitado'),
        default=False,
        help_text=_('Indica si el módulo SOGCS está habilitado para esta institución.')
    )
    
    sogcs_configuration = models.JSONField(
        _('configuración SOGCS'),
        null=True,
        blank=True,
        help_text=_('Configuración JSON del Sistema Obligatorio de Garantía de Calidad en Salud.')
    )
    
    fecha_activacion_sogcs = models.DateTimeField(
        _('fecha activación SOGCS'),
        null=True,
        blank=True,
        help_text=_('Fecha y hora de activación del módulo SOGCS.')
    )
    
    # Responsables SOGCS
    coordinador_calidad = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='health_orgs_as_quality_coordinator',
        verbose_name=_('coordinador de calidad'),
        help_text=_('Usuario designado como coordinador de calidad SOGCS.')
    )
    
    responsable_habilitacion = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='health_orgs_as_habilitation_responsible',
        verbose_name=_('responsable de habilitación'),
        help_text=_('Usuario responsable del proceso de habilitación SUH.')
    )
    
    # Estados y seguimiento SOGCS
    estado_suh = models.CharField(
        _('estado SUH'),
        max_length=20,
        choices=[
            ('no_iniciado', _('No Iniciado')),
            ('en_configuracion', _('En Configuración')),
            ('autoevaluacion', _('En Autoevaluación')),
            ('mejoramiento', _('Plan de Mejoramiento')),
            ('habilitado', _('Habilitado')),
            ('suspendido', _('Suspendido')),
        ],
        default='no_iniciado',
        help_text=_('Estado actual del Sistema Único de Habilitación.')
    )
    
    estado_pamec = models.CharField(
        _('estado PAMEC'),
        max_length=20,
        choices=[
            ('no_iniciado', _('No Iniciado')),
            ('en_configuracion', _('En Configuración')),
            ('activo', _('Activo')),
            ('suspendido', _('Suspendido')),
        ],
        default='no_iniciado',
        help_text=_('Estado del Programa de Auditoría para el Mejoramiento de la Calidad.')
    )
    
    estado_sic = models.CharField(
        _('estado SIC'),
        max_length=20,
        choices=[
            ('no_iniciado', _('No Iniciado')),
            ('en_configuracion', _('En Configuración')),
            ('activo', _('Activo')),
            ('atrasado', _('Atrasado')),
        ],
        default='no_iniciado',
        help_text=_('Estado del Sistema de Información para la Calidad.')
    )
    
    estado_sua = models.CharField(
        _('estado SUA'),
        max_length=20,
        choices=[
            ('no_aplica', _('No Aplica')),
            ('interesado', _('Interesado')),
            ('en_proceso', _('En Proceso')),
            ('acreditado', _('Acreditado')),
            ('vencido', _('Vencido')),
        ],
        default='no_aplica',
        help_text=_('Estado del Sistema Único de Acreditación.')
    )
    
    # Fechas importantes SOGCS
    fecha_ultima_autoevaluacion = models.DateField(
        _('fecha última autoevaluación'),
        null=True,
        blank=True,
        help_text=_('Fecha de la última autoevaluación SUH realizada.')
    )
    
    fecha_proxima_auditoria = models.DateField(
        _('fecha próxima auditoría'),
        null=True,
        blank=True,
        help_text=_('Fecha programada para la próxima auditoría PAMEC.')
    )
    
    # Métricas y cumplimiento
    porcentaje_cumplimiento_suh = models.DecimalField(
        _('porcentaje cumplimiento SUH'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Porcentaje de cumplimiento actual del SUH (0.00-100.00).')
    )
    
    porcentaje_cumplimiento_pamec = models.DecimalField(
        _('porcentaje cumplimiento PAMEC'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Porcentaje de cumplimiento actual del PAMEC (0.00-100.00).')
    )
    
    porcentaje_cumplimiento_sic = models.DecimalField(
        _('porcentaje cumplimiento SIC'),
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Porcentaje de cumplimiento actual del SIC (0.00-100.00).')
    )
    
    # Configuración específica de componentes
    suh_servicios_habilitados = models.PositiveIntegerField(
        _('servicios habilitados SUH'),
        default=0,
        help_text=_('Número total de servicios habilitados bajo SUH.')
    )
    
    pamec_procesos_auditoria = models.PositiveIntegerField(
        _('procesos en auditoría PAMEC'),
        default=0,
        help_text=_('Número de procesos incluidos en el programa PAMEC.')
    )
    
    sic_indicadores_activos = models.PositiveIntegerField(
        _('indicadores activos SIC'),
        default=0,
        help_text=_('Número de indicadores de calidad activos en SIC.')
    )
    
    # Alertas y notificaciones
    alertas_activas = models.PositiveIntegerField(
        _('alertas SOGCS activas'),
        default=0,
        help_text=_('Número de alertas SOGCS activas pendientes de atención.')
    )
    
    notificaciones_habilitadas = models.BooleanField(
        _('notificaciones habilitadas'),
        default=True,
        help_text=_('Indica si las notificaciones SOGCS están habilitadas.')
    )
    
    class Meta:
        verbose_name = _('organización de salud')
        verbose_name_plural = _('organizaciones de salud')
        ordering = ['organization__razon_social']
        indexes = [
            models.Index(fields=['codigo_prestador']),
            models.Index(fields=['nivel_complejidad']),
            models.Index(fields=['tipo_prestador']),
            models.Index(fields=['naturaleza_juridica']),
            models.Index(fields=['verificado_reps']),
            # Índices SOGCS para optimizar consultas
            models.Index(fields=['sogcs_enabled']),
            models.Index(fields=['estado_suh']),
            models.Index(fields=['estado_pamec']),
            models.Index(fields=['estado_sic']),
            models.Index(fields=['estado_sua']),
            models.Index(fields=['coordinador_calidad']),
            models.Index(fields=['responsable_habilitacion']),
            models.Index(fields=['fecha_activacion_sogcs']),
            models.Index(fields=['fecha_ultima_autoevaluacion']),
            models.Index(fields=['fecha_proxima_auditoria']),
            # Índices compuestos para consultas frecuentes SOGCS
            models.Index(fields=['sogcs_enabled', 'estado_suh']),
            models.Index(fields=['sogcs_enabled', 'estado_pamec']),
            models.Index(fields=['sogcs_enabled', 'alertas_activas']),
        ]
        constraints = [
            # Asegurar que el código prestador sea único entre registros activos
            models.UniqueConstraint(
                fields=['codigo_prestador'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_active_codigo_prestador'
            ),
        ]
    
    def __str__(self):
        """Return string representation of the health organization."""
        return f"{self.organization.razon_social} - {self.codigo_prestador}"
    
    @property
    def codigo_prestador_formatted(self):
        """Return formatted provider code (XXXX-XXXX-XXXX)."""
        if len(self.codigo_prestador) == 12:
            return f"{self.codigo_prestador[:4]}-{self.codigo_prestador[4:8]}-{self.codigo_prestador[8:]}"
        return self.codigo_prestador
    
    @property
    def representante_documento_completo(self):
        """Return complete legal representative document."""
        return f"{self.representante_tipo_documento} {self.representante_numero_documento}"
    
    @property
    def servicios_activos(self):
        """Return count of active health services."""
        return self.services.filter(estado='activo').count()
    
    def clean(self):
        """Validate health organization data."""
        super().clean()
        
        # Validar que la organización base sea del sector salud
        if hasattr(self, 'organization') and self.organization:
            if self.organization.sector_economico != 'salud':
                raise ValidationError({
                    'organization': _('La organización debe pertenecer al sector salud.')
                })
        
        # Validar formato del código prestador
        if self.codigo_prestador and len(self.codigo_prestador) != 12:
            raise ValidationError({
                'codigo_prestador': _('El código prestador debe tener exactamente 12 dígitos.')
            })
        
        # Validar coherencia de nivel de complejidad con tipo de prestador
        if self.nivel_complejidad == 'IV' and self.tipo_prestador not in ['HOSPITAL', 'CLINICA']:
            raise ValidationError({
                'nivel_complejidad': _('Solo hospitales y clínicas pueden tener nivel de complejidad IV.')
            })
    
    def actualizar_contador_servicios(self):
        """Update the services counter."""
        self.servicios_habilitados_count = self.services.filter(estado='activo').count()
        self.save(update_fields=['servicios_habilitados_count'])
    
    @classmethod
    def get_by_codigo_prestador(cls, codigo):
        """Get health organization by provider code."""
        try:
            return cls.objects.get(codigo_prestador=codigo, deleted_at__isnull=True)
        except cls.DoesNotExist:
            return None
    
    # === MÉTODOS SOGCS ===
    
    def activate_sogcs(self, user=None):
        """
        Activate SOGCS module for this health organization.
        
        Args:
            user: User activating SOGCS (for audit trail)
            
        Returns:
            bool: True if activation was successful
        """
        if not self.sogcs_enabled:
            from django.utils import timezone
            
            self.sogcs_enabled = True
            self.fecha_activacion_sogcs = timezone.now()
            
            # Initialize default SOGCS configuration
            if not self.sogcs_configuration:
                self.sogcs_configuration = {
                    'suh': {'enabled': True, 'auto_evaluation_frequency': 'yearly'},
                    'pamec': {'enabled': True, 'audit_frequency': 'quarterly'},
                    'sic': {'enabled': True, 'indicators_enabled': True},
                    'sua': {'enabled': False, 'interested': False},
                    'notifications': {'email': True, 'sms': False, 'in_app': True},
                    'activated_by': str(user.id) if user else None,
                    'activation_date': timezone.now().isoformat()
                }
            
            self.save(update_fields=['sogcs_enabled', 'fecha_activacion_sogcs', 'sogcs_configuration'])
            return True
        return False
    
    def deactivate_sogcs(self, reason="", user=None):
        """
        Deactivate SOGCS module for this health organization.
        
        Args:
            reason: Reason for deactivation
            user: User deactivating SOGCS
            
        Returns:
            bool: True if deactivation was successful
        """
        if self.sogcs_enabled:
            from django.utils import timezone
            
            self.sogcs_enabled = False
            
            # Add deactivation info to configuration
            if self.sogcs_configuration:
                self.sogcs_configuration['deactivation'] = {
                    'date': timezone.now().isoformat(),
                    'reason': reason,
                    'deactivated_by': user.id if user else None
                }
            
            self.save(update_fields=['sogcs_enabled', 'sogcs_configuration'])
            return True
        return False
    
    def get_sogcs_status(self):
        """
        Get comprehensive SOGCS status for this organization.
        
        Returns:
            dict: Complete SOGCS status information
        """
        if not self.sogcs_enabled:
            return {
                'enabled': False,
                'activation_date': None,
                'components': {},
                'overall_compliance': 0,
                'alerts': 0
            }
        
        return {
            'enabled': True,
            'activation_date': self.fecha_activacion_sogcs,
            'components': {
                'suh': {
                    'status': self.estado_suh,
                    'compliance': float(self.porcentaje_cumplimiento_suh or 0),
                    'services_count': self.suh_servicios_habilitados,
                    'last_evaluation': self.fecha_ultima_autoevaluacion
                },
                'pamec': {
                    'status': self.estado_pamec,
                    'compliance': float(self.porcentaje_cumplimiento_pamec or 0),
                    'processes_count': self.pamec_procesos_auditoria,
                    'next_audit': self.fecha_proxima_auditoria
                },
                'sic': {
                    'status': self.estado_sic,
                    'compliance': float(self.porcentaje_cumplimiento_sic or 0),
                    'indicators_count': self.sic_indicadores_activos
                },
                'sua': {
                    'status': self.estado_sua,
                    'compliance': 100 if self.estado_sua == 'acreditado' else 0
                }
            },
            'overall_compliance': self.calculate_overall_compliance(),
            'alerts': self.alertas_activas,
            'coordinators': {
                'quality': self.coordinador_calidad.get_full_name() if self.coordinador_calidad else None,
                'habilitation': self.responsable_habilitacion.get_full_name() if self.responsable_habilitacion else None
            }
        }
    
    def calculate_overall_compliance(self):
        """
        Calculate overall SOGCS compliance percentage.
        
        Returns:
            float: Overall compliance percentage (0-100)
        """
        if not self.sogcs_enabled:
            return 0.0
        
        # Weight by component importance
        weights = {
            'suh': 0.4,    # 40% - Most critical for health institutions
            'pamec': 0.3,  # 30% - Important for continuous improvement
            'sic': 0.3,    # 30% - Important for information and metrics
            'sua': 0.0     # 0% - Optional for most institutions
        }
        
        # Adjust weights if SUA is active
        if self.estado_sua != 'no_aplica':
            weights = {'suh': 0.3, 'pamec': 0.25, 'sic': 0.25, 'sua': 0.2}
        
        total_compliance = 0.0
        
        # Calculate weighted compliance
        if self.porcentaje_cumplimiento_suh:
            total_compliance += float(self.porcentaje_cumplimiento_suh) * weights['suh']
        
        if self.porcentaje_cumplimiento_pamec:
            total_compliance += float(self.porcentaje_cumplimiento_pamec) * weights['pamec']
        
        if self.porcentaje_cumplimiento_sic:
            total_compliance += float(self.porcentaje_cumplimiento_sic) * weights['sic']
        
        if self.estado_sua == 'acreditado':
            total_compliance += 100 * weights['sua']
        
        return round(total_compliance, 2)
    
    def get_responsables_sogcs(self):
        """
        Get all SOGCS responsible users for this organization.
        
        Returns:
            dict: Dictionary with all responsible users
        """
        return {
            'coordinador_calidad': {
                'user': self.coordinador_calidad,
                'name': self.coordinador_calidad.get_full_name() if self.coordinador_calidad else None,
                'email': self.coordinador_calidad.email if self.coordinador_calidad else None
            },
            'responsable_habilitacion': {
                'user': self.responsable_habilitacion,
                'name': self.responsable_habilitacion.get_full_name() if self.responsable_habilitacion else None,
                'email': self.responsable_habilitacion.email if self.responsable_habilitacion else None
            }
        }
    
    def update_sogcs_metrics(self):
        """
        Update SOGCS metrics counters from related models.
        This method will be called periodically to sync metrics.
        """
        # These will be implemented when the related models are created
        # For now, we keep the current values
        fields_to_update = []
        
        # Update services count (using existing relationship)
        new_services_count = self.services.filter(estado='activo').count()
        if new_services_count != self.suh_servicios_habilitados:
            self.suh_servicios_habilitados = new_services_count
            fields_to_update.append('suh_servicios_habilitados')
        
        # Update other counters when models are implemented
        # self.pamec_procesos_auditoria = count from PAMEC models
        # self.sic_indicadores_activos = count from SIC models
        # self.alertas_activas = count from alerts models
        
        if fields_to_update:
            self.save(update_fields=fields_to_update)
    
    def check_sogcs_alerts(self):
        """
        Check for SOGCS alerts and update alert counter.
        
        Returns:
            list: List of active alerts
        """
        alerts = []
        
        # Check SUH alerts
        if self.sogcs_enabled and self.estado_suh == 'mejoramiento':
            alerts.append({
                'type': 'suh_improvement_required',
                'message': 'Plan de mejoramiento SUH pendiente',
                'severity': 'high',
                'component': 'SUH'
            })
        
        # Check PAMEC alerts
        if self.fecha_proxima_auditoria:
            from django.utils import timezone
            from datetime import timedelta
            
            days_until_audit = (self.fecha_proxima_auditoria - timezone.now().date()).days
            if days_until_audit <= 30:
                alerts.append({
                    'type': 'pamec_audit_approaching',
                    'message': f'Auditoría PAMEC en {days_until_audit} días',
                    'severity': 'medium',
                    'component': 'PAMEC'
                })
        
        # Check SIC alerts
        if self.estado_sic == 'atrasado':
            alerts.append({
                'type': 'sic_data_delayed',
                'message': 'Carga de datos SIC atrasada',
                'severity': 'high',
                'component': 'SIC'
            })
        
        # Update alert counter
        if len(alerts) != self.alertas_activas:
            self.alertas_activas = len(alerts)
            self.save(update_fields=['alertas_activas'])
        
        return alerts
    
    def requires_sogcs_setup(self):
        """
        Check if organization requires SOGCS setup wizard.
        
        Returns:
            bool: True if setup wizard is required
        """
        if not self.sogcs_enabled:
            return False
        
        # Check if basic configuration is missing
        if not self.sogcs_configuration:
            return True
        
        # Check if any required responsibles are missing
        if not self.coordinador_calidad or not self.responsable_habilitacion:
            return True
        
        # Check if all components are still in initial state
        all_not_started = (
            self.estado_suh == 'no_iniciado' and
            self.estado_pamec == 'no_iniciado' and
            self.estado_sic == 'no_iniciado'
        )
        
        return all_not_started
    
    def get_sogcs_dashboard_data(self):
        """
        Get data formatted for SOGCS dashboard display.
        
        Returns:
            dict: Dashboard-ready data
        """
        if not self.sogcs_enabled:
            return None
        
        return {
            'organization_name': self.organization.razon_social,
            'codigo_prestador': self.codigo_prestador,
            'nivel_complejidad': self.nivel_complejidad,
            'components_status': {
                'suh': {
                    'status': self.estado_suh,
                    'percentage': float(self.porcentaje_cumplimiento_suh or 0),
                    'services': self.suh_servicios_habilitados,
                    'last_activity': self.fecha_ultima_autoevaluacion
                },
                'pamec': {
                    'status': self.estado_pamec,
                    'percentage': float(self.porcentaje_cumplimiento_pamec or 0),
                    'processes': self.pamec_procesos_auditoria,
                    'next_audit': self.fecha_proxima_auditoria
                },
                'sic': {
                    'status': self.estado_sic,
                    'percentage': float(self.porcentaje_cumplimiento_sic or 0),
                    'indicators': self.sic_indicadores_activos
                },
                'sua': {
                    'status': self.estado_sua,
                    'applicable': self.estado_sua != 'no_aplica'
                }
            },
            'overall_compliance': self.calculate_overall_compliance(),
            'alerts_count': self.alertas_activas,
            'activation_date': self.fecha_activacion_sogcs,
            'coordinators': self.get_responsables_sogcs()
        }


class HealthService(FullBaseModel):
    """
    Health services enabled for the organization according to REPS.
    
    This model stores all health services that the organization is authorized
    to provide according to Resolución 3100/2019 and REPS registration.
    """
    
    # Estado del Servicio Choices
    ESTADO_CHOICES = [
        ('activo', _('Activo')),
        ('suspendido', _('Suspendido')),
        ('cancelado', _('Cancelado')),
        ('en_tramite', _('En Trámite')),
    ]
    
    # Modalidad del Servicio Choices
    MODALIDAD_CHOICES = [
        ('intramural', _('Intramural')),
        ('extramural', _('Extramural')),
        ('telemedicina', _('Telemedicina')),
        ('domiciliaria', _('Domiciliaria')),
    ]
    
    # Grupo de Servicios Choices (según Res. 3100/2019)
    GRUPO_SERVICIO_CHOICES = [
        ('consulta_externa', _('Consulta Externa')),
        ('apoyo_diagnostico', _('Apoyo Diagnóstico')),
        ('quirurgicos', _('Quirúrgicos')),
        ('internacion', _('Internación')),
        ('cuidados_intensivos', _('Cuidados Intensivos')),
        ('urgencias', _('Urgencias')),
        ('otros', _('Otros')),
    ]
    
    # Relación con HealthOrganization
    health_organization = models.ForeignKey(
        HealthOrganization,
        on_delete=models.CASCADE,
        related_name='services',
        verbose_name=_('organización de salud'),
        help_text=_('Organización de salud que presta este servicio.')
    )
    
    # === INFORMACIÓN DEL SERVICIO ===
    codigo_servicio = models.CharField(
        _('código del servicio'),
        max_length=10,
        validators=[
            RegexValidator(
                regex=r'^\d{3,4}$',
                message=_('El código del servicio debe tener 3 o 4 dígitos.')
            )
        ],
        help_text=_('Código del servicio según Resolución 3100/2019.')
    )
    
    nombre_servicio = models.CharField(
        _('nombre del servicio'),
        max_length=200,
        help_text=_('Nombre completo del servicio de salud.')
    )
    
    grupo_servicio = models.CharField(
        _('grupo del servicio'),
        max_length=25,
        choices=GRUPO_SERVICIO_CHOICES,
        help_text=_('Grupo al que pertenece el servicio.')
    )
    
    descripcion_servicio = models.TextField(
        _('descripción del servicio'),
        blank=True,
        max_length=500,
        help_text=_('Descripción detallada del servicio.')
    )
    
    # === FECHAS Y VIGENCIA ===
    fecha_habilitacion = models.DateField(
        _('fecha de habilitación'),
        help_text=_('Fecha en que se habilitó el servicio.')
    )
    
    fecha_vencimiento = models.DateField(
        _('fecha de vencimiento'),
        null=True,
        blank=True,
        help_text=_('Fecha de vencimiento de la habilitación (si aplica).')
    )
    
    # === ESTADO Y MODALIDAD ===
    estado = models.CharField(
        _('estado'),
        max_length=15,
        choices=ESTADO_CHOICES,
        default='activo',
        help_text=_('Estado actual del servicio.')
    )
    
    modalidad = models.CharField(
        _('modalidad'),
        max_length=15,
        choices=MODALIDAD_CHOICES,
        default='intramural',
        help_text=_('Modalidad de prestación del servicio.')
    )
    
    # === UBICACIÓN Y CAPACIDAD ===
    sede_prestacion = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name='health_services',
        verbose_name=_('sede de prestación'),
        help_text=_('Sede donde se presta el servicio.')
    )
    
    capacidad_instalada = models.PositiveIntegerField(
        _('capacidad instalada'),
        null=True,
        blank=True,
        help_text=_('Capacidad instalada para el servicio (camas, consultorios, etc.).')
    )
    
    # === INFORMACIÓN REGULATORIA ===
    numero_resolucion = models.CharField(
        _('número de resolución'),
        max_length=50,
        blank=True,
        help_text=_('Número de resolución que autoriza el servicio.')
    )
    
    entidad_autorizante = models.CharField(
        _('entidad autorizante'),
        max_length=100,
        blank=True,
        help_text=_('Entidad que autorizó el servicio (Secretaría de Salud, etc.).')
    )
    
    fecha_ultima_visita = models.DateField(
        _('fecha última visita'),
        null=True,
        blank=True,
        help_text=_('Fecha de la última visita de habilitación o seguimiento.')
    )
    
    # === INFORMACIÓN ADICIONAL ===
    observaciones = models.TextField(
        _('observaciones'),
        blank=True,
        max_length=500,
        help_text=_('Observaciones adicionales sobre el servicio.')
    )
    
    requiere_autorizacion = models.BooleanField(
        _('requiere autorización'),
        default=False,
        help_text=_('Indica si el servicio requiere autorización previa.')
    )
    
    dias_atencion = models.CharField(
        _('días de atención'),
        max_length=50,
        blank=True,
        help_text=_('Días de la semana en que se presta el servicio.')
    )
    
    horario_atencion = models.CharField(
        _('horario de atención'),
        max_length=100,
        blank=True,
        help_text=_('Horario de atención del servicio.')
    )
    
    class Meta:
        verbose_name = _('servicio de salud')
        verbose_name_plural = _('servicios de salud')
        ordering = ['grupo_servicio', 'nombre_servicio']
        indexes = [
            models.Index(fields=['codigo_servicio']),
            models.Index(fields=['estado']),
            models.Index(fields=['grupo_servicio']),
            models.Index(fields=['modalidad']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['health_organization', 'estado']),
        ]
        constraints = [
            # Un servicio por código por organización por sede
            models.UniqueConstraint(
                fields=['health_organization', 'codigo_servicio', 'sede_prestacion'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_service_per_organization_location'
            ),
        ]
    
    def __str__(self):
        """Return string representation of the health service."""
        return f"{self.codigo_servicio} - {self.nombre_servicio}"
    
    @property
    def esta_vigente(self):
        """Check if service is currently valid."""
        from django.utils import timezone
        
        if self.estado != 'activo':
            return False
        
        if self.fecha_vencimiento:
            return timezone.now().date() <= self.fecha_vencimiento
        
        return True
    
    @property
    def dias_para_vencimiento(self):
        """Get days until expiration."""
        from django.utils import timezone
        
        if not self.fecha_vencimiento:
            return None
        
        today = timezone.now().date()
        if self.fecha_vencimiento > today:
            return (self.fecha_vencimiento - today).days
        else:
            return 0  # Already expired
    
    def clean(self):
        """Validate health service data."""
        super().clean()
        
        # Validar que la fecha de vencimiento sea posterior a la habilitación
        if self.fecha_vencimiento and self.fecha_habilitacion:
            if self.fecha_vencimiento <= self.fecha_habilitacion:
                raise ValidationError({
                    'fecha_vencimiento': _('La fecha de vencimiento debe ser posterior a la fecha de habilitación.')
                })
        
        # Validar que la sede pertenezca a la misma organización
        if hasattr(self, 'sede_prestacion') and hasattr(self, 'health_organization'):
            if self.sede_prestacion.organization != self.health_organization.organization:
                raise ValidationError({
                    'sede_prestacion': _('La sede debe pertenecer a la misma organización.')
                })
    
    def save(self, *args, **kwargs):
        """Override save to update organization service counter."""
        super().save(*args, **kwargs)
        
        # Actualizar contador de servicios en la organización
        if hasattr(self, 'health_organization'):
            self.health_organization.actualizar_contador_servicios()
    
    def delete(self, *args, **kwargs):
        """Override delete to update organization service counter."""
        health_org = self.health_organization
        super().delete(*args, **kwargs)
        
        # Actualizar contador de servicios en la organización
        if health_org:
            health_org.actualizar_contador_servicios()
    
    @classmethod
    def get_servicios_por_grupo(cls, health_organization, grupo):
        """Get services by group for a health organization."""
        return cls.objects.filter(
            health_organization=health_organization,
            grupo_servicio=grupo,
            estado='activo'
        ).order_by('nombre_servicio')
    
    @classmethod
    def get_servicios_proximos_vencer(cls, health_organization, dias=60):
        """Get services expiring within specified days."""
        from django.utils import timezone
        from datetime import timedelta
        
        fecha_limite = timezone.now().date() + timedelta(days=dias)
        
        return cls.objects.filter(
            health_organization=health_organization,
            estado='activo',
            fecha_vencimiento__lte=fecha_limite,
            fecha_vencimiento__gte=timezone.now().date()
        ).order_by('fecha_vencimiento')
    
    def marcar_como_vencido(self):
        """Mark service as expired."""
        self.estado = 'suspendido'
        self.observaciones += f"\nServicio marcado como vencido automáticamente el {timezone.now().date()}"
        self.save(update_fields=['estado', 'observaciones'])

class SedePrestadora(FullBaseModel):
    """
    Modelo para gestionar las sedes prestadoras de servicios de salud.
    Cada organización de salud puede tener múltiples sedes.
    """
    
    # Estados de la sede
    ESTADO_SEDE_CHOICES = [
        ('activa', _('Activa')),
        ('inactiva', _('Inactiva')),
        ('suspendida', _('Suspendida')),
        ('en_proceso', _('En Proceso de Habilitación')),
        ('cerrada', _('Cerrada Permanentemente')),
    ]
    
    # Tipos de sede
    TIPO_SEDE_CHOICES = [
        ('principal', _('Sede Principal')),
        ('sucursal', _('Sucursal')),
        ('ambulatoria', _('Sede Ambulatoria')),
        ('hospitalaria', _('Sede Hospitalaria')),
        ('administrativa', _('Sede Administrativa')),
        ('diagnostico', _('Centro de Diagnóstico')),
        ('urgencias', _('Centro de Urgencias')),
    ]
    
    # Relación con organización de salud
    health_organization = models.ForeignKey(
        'HealthOrganization',
        on_delete=models.CASCADE,
        related_name='sedes',
        verbose_name=_('Organización de Salud'),
        help_text=_('Organización de salud a la que pertenece esta sede.')
    )
    
    # Identificación de la sede
    numero_sede = models.CharField(
        _('número de sede'),
        max_length=10,
        help_text=_('Número único de identificación de la sede (ej: 01, 02, 03)')
    )
    
    codigo_prestador = models.CharField(
        _('código de prestador'),
        max_length=20,
        help_text=_('Código de habilitación del prestador para esta sede')
    )
    
    # Información básica
    nombre_sede = models.CharField(
        _('nombre de la sede'),
        max_length=200,
        help_text=_('Nombre descriptivo de la sede.')
    )
    
    tipo_sede = models.CharField(
        _('tipo de sede'),
        max_length=20,
        choices=TIPO_SEDE_CHOICES,
        default='sucursal',
        help_text=_('Tipo o clasificación de la sede.')
    )
    
    es_sede_principal = models.BooleanField(
        _('es sede principal'),
        default=False,
        help_text=_('Indica si es la sede principal de la organización')
    )
    
    # Ubicación
    direccion = models.CharField(
        _('dirección'),
        max_length=255,
        help_text=_('Dirección completa de la sede.')
    )
    
    departamento = models.CharField(
        _('departamento'),
        max_length=100,
        help_text=_('Departamento donde se encuentra la sede.')
    )
    
    municipio = models.CharField(
        _('municipio'),
        max_length=100,
        help_text=_('Municipio donde se encuentra la sede.')
    )
    
    barrio = models.CharField(
        _('barrio'),
        max_length=100,
        blank=True,
        help_text=_('Barrio donde se encuentra la sede.')
    )
    
    codigo_postal = models.CharField(
        _('código postal'),
        max_length=10,
        blank=True,
        help_text=_('Código postal de la dirección.')
    )
    
    # Georeferenciación
    latitud = models.DecimalField(
        _('latitud'),
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text=_('Coordenada latitud de la sede.')
    )
    
    longitud = models.DecimalField(
        _('longitud'),
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text=_('Coordenada longitud de la sede.')
    )
    
    # Contacto
    telefono_principal = models.CharField(
        _('teléfono principal'),
        max_length=20,
        validators=[
            RegexValidator(
                regex=r'^\+?[\d\s\-\(\)]{7,20}$',
                message=_('Número de teléfono debe tener un formato válido.')
            )
        ],
        help_text=_('Teléfono principal de contacto de la sede.')
    )
    
    telefono_secundario = models.CharField(
        _('teléfono secundario'),
        max_length=20,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?[\d\s\-\(\)]{7,20}$',
                message=_('Número de teléfono debe tener un formato válido.')
            )
        ],
        help_text=_('Teléfono secundario de contacto de la sede.')
    )
    
    email = models.EmailField(
        _('email de contacto'),
        help_text=_('Correo electrónico de contacto de la sede.')
    )
    
    # Responsable de la sede
    nombre_responsable = models.CharField(
        _('nombre del responsable'),
        max_length=200,
        help_text=_('Nombre completo del responsable de la sede.')
    )
    
    cargo_responsable = models.CharField(
        _('cargo del responsable'),
        max_length=100,
        help_text=_('Cargo o posición del responsable de la sede.')
    )
    
    telefono_responsable = models.CharField(
        _('teléfono del responsable'),
        max_length=20,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?[\d\s\-\(\)]{7,20}$',
                message=_('Número de teléfono debe tener un formato válido.')
            )
        ],
        help_text=_('Teléfono del responsable de la sede.')
    )
    
    email_responsable = models.EmailField(
        _('email del responsable'),
        blank=True,
        help_text=_('Correo electrónico del responsable de la sede.')
    )
    
    # Estado y habilitación
    estado = models.CharField(
        _('estado'),
        max_length=20,
        choices=ESTADO_SEDE_CHOICES,
        default='activa',
        help_text=_('Estado actual de la sede.')
    )
    
    fecha_habilitacion = models.DateField(
        _('fecha de habilitación'),
        null=True,
        blank=True,
        help_text=_('Fecha en que se habilitó la sede.')
    )
    
    fecha_renovacion = models.DateField(
        _('fecha de renovación'),
        null=True,
        blank=True,
        help_text=_('Fecha de renovación de la habilitación.')
    )
    
    # Capacidad instalada
    numero_camas = models.IntegerField(
        _('número de camas'),
        default=0,
        help_text=_('Número total de camas disponibles.')
    )
    
    numero_consultorios = models.IntegerField(
        _('número de consultorios'),
        default=0,
        help_text=_('Número total de consultorios disponibles.')
    )
    
    numero_quirofanos = models.IntegerField(
        _('número de quirófanos'),
        default=0,
        help_text=_('Número total de quirófanos disponibles.')
    )
    
    # Horarios de atención
    horario_atencion = models.JSONField(
        _('horario de atención'),
        default=dict,
        help_text=_('Horarios de atención por día de la semana en formato JSON.')
    )
    
    atencion_24_horas = models.BooleanField(
        _('atención 24 horas'),
        default=False,
        help_text=_('Indica si la sede ofrece atención las 24 horas.')
    )
    
    # Servicios habilitados (relación con servicios)
    servicios_habilitados = models.ManyToManyField(
        'HealthService',
        through='SedeServicio',
        related_name='sedes_prestadoras',
        verbose_name=_('servicios habilitados'),
        blank=True
    )
    
    # Metadata
    observaciones = models.TextField(
        _('observaciones'),
        blank=True,
        help_text=_('Observaciones adicionales sobre la sede.')
    )
    
    # Datos de importación
    imported_from_file = models.BooleanField(
        _('importado desde archivo'),
        default=False,
        help_text=_('Indica si la sede fue importada desde un archivo.')
    )
    
    import_date = models.DateTimeField(
        _('fecha de importación'),
        null=True,
        blank=True,
        help_text=_('Fecha y hora en que se importó la sede.')
    )
    
    class Meta:
        verbose_name = _('sede prestadora')
        verbose_name_plural = _('sedes prestadoras')
        unique_together = [
            ['health_organization', 'numero_sede'],
            ['health_organization', 'codigo_prestador']
        ]
        ordering = ['numero_sede']
        indexes = [
            models.Index(fields=['health_organization', 'estado']),
            models.Index(fields=['departamento', 'municipio']),
            models.Index(fields=['codigo_prestador']),
            models.Index(fields=['tipo_sede']),
        ]
        constraints = [
            # Asegurar que solo hay una sede principal por organización activa
            models.UniqueConstraint(
                fields=['health_organization'],
                condition=models.Q(es_sede_principal=True) & models.Q(deleted_at__isnull=True),
                name='unique_main_sede_per_health_organization'
            ),
        ]
    
    def clean(self):
        """Validaciones del modelo"""
        super().clean()
        
        # Solo puede haber una sede principal por organización
        if self.es_sede_principal:
            existing_principal = SedePrestadora.objects.filter(
                health_organization=self.health_organization,
                es_sede_principal=True,
                deleted_at__isnull=True
            ).exclude(pk=self.pk)
            
            if existing_principal.exists():
                raise ValidationError({
                    'es_sede_principal': _('Ya existe una sede principal para esta organización')
                })
        
        # Validar formato de número de sede
        if self.numero_sede and (not self.numero_sede.isdigit() or len(self.numero_sede) > 3):
            raise ValidationError({
                'numero_sede': _('El número de sede debe ser numérico y máximo 3 dígitos')
            })
    
    def __str__(self):
        return f"{self.nombre_sede} - Sede {self.numero_sede}"
    
    @property
    def direccion_completa(self):
        """Return complete address."""
        return f"{self.direccion}, {self.municipio}, {self.departamento}"
    
    @property
    def total_servicios(self):
        """Return total count of enabled services."""
        return self.sede_servicios.filter(estado_servicio='activo').count()
    
    def save(self, *args, **kwargs):
        """Override save method to handle business logic."""
        # Si es una nueva instancia y es la primera sede de la organización, marcarla como principal automáticamente
        is_new = self._state.adding
        if (
            is_new
            and self.health_organization
            and not SedePrestadora.objects.filter(health_organization=self.health_organization, deleted_at__isnull=True).exists()
        ):
            self.es_sede_principal = True
        
        # Formatear número de sede con ceros a la izquierda
        if self.numero_sede and self.numero_sede.isdigit():
            self.numero_sede = self.numero_sede.zfill(2)

        super().save(*args, **kwargs)


class SedeServicio(FullBaseModel):
    """
    Modelo intermedio para la relación entre Sede y Servicio.
    Permite agregar información adicional sobre el servicio en cada sede.
    """
    
    ESTADO_SERVICIO_CHOICES = [
        ('activo', _('Activo')),
        ('inactivo', _('Inactivo')),
        ('suspendido', _('Suspendido')),
    ]
    
    sede = models.ForeignKey(
        'SedePrestadora',
        on_delete=models.CASCADE,
        related_name='sede_servicios',
        verbose_name=_('sede prestadora')
    )
    
    servicio = models.ForeignKey(
        'HealthService',
        on_delete=models.CASCADE,
        related_name='servicio_sedes',
        verbose_name=_('servicio de salud')
    )
    
    # Información adicional del servicio en la sede
    distintivo = models.CharField(
        _('código distintivo'),
        max_length=50,
        help_text=_('Código distintivo del servicio en esta sede')
    )
    
    capacidad_instalada = models.IntegerField(
        _('capacidad instalada'),
        default=0,
        help_text=_('Capacidad instalada para este servicio en la sede.')
    )
    
    fecha_habilitacion = models.DateField(
        _('fecha de habilitación del servicio'),
        null=True,
        blank=True,
        help_text=_('Fecha en que se habilitó el servicio en esta sede.')
    )
    
    estado_servicio = models.CharField(
        _('estado del servicio'),
        max_length=20,
        choices=ESTADO_SERVICIO_CHOICES,
        default='activo',
        help_text=_('Estado del servicio en esta sede.')
    )
    
    observaciones = models.TextField(
        _('observaciones'),
        blank=True,
        help_text=_('Observaciones específicas del servicio en esta sede.')
    )
    
    class Meta:
        verbose_name = _('servicio por sede')
        verbose_name_plural = _('servicios por sede')
        unique_together = [
            ['sede', 'servicio'],
            ['sede', 'distintivo']
        ]
        ordering = ['sede', 'servicio']
        indexes = [
            models.Index(fields=['sede', 'estado_servicio']),
            models.Index(fields=['distintivo']),
        ]
    
    def __str__(self):
        return f"{self.sede.nombre_sede} - {self.servicio.nombre_servicio}"
    
    def clean(self):
        """Validate sede servicio data."""
        super().clean()
        
        # Validar que la sede y el servicio pertenezcan a la misma organización
        if hasattr(self, 'sede') and hasattr(self, 'servicio'):
            if self.sede.health_organization != self.servicio.health_organization:
                raise ValidationError({
                    'servicio': _('El servicio debe pertenecer a la misma organización de salud que la sede.')
                })
