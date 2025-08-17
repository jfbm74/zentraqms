"""
SOGCS (Sistema Obligatorio de Garantía de Calidad en Salud) models
Based on real REPS structure from MinSalud portal for Colombian health regulations compliance.
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


class HeadquarterLocation(models.Model):
    """
    Modelo para las sedes de prestadores basado en estructura real REPS MinSalud.
    Mapea exactamente los campos del portal oficial para cumplimiento normativo.
    """
    
    # Información básica de identificación
    organization = models.ForeignKey(
        'organization.HealthOrganization',
        on_delete=models.CASCADE,
        verbose_name=_("Organización"),
        help_text=_("Organización de salud propietaria de esta sede")
    )
    
    codigo_sede = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Código de Sede"),
        help_text=_("Código único de identificación de la sede en REPS")
    )
    
    nombre_sede = models.CharField(
        max_length=200,
        verbose_name=_("Nombre de la Sede"),
        help_text=_("Denominación oficial de la sede")
    )
    
    tipo_sede = models.CharField(
        max_length=50,
        verbose_name=_("Tipo de Sede"),
        help_text=_("Clasificación del tipo de sede según REPS")
    )
    
    estado_sede = models.CharField(
        max_length=20,
        choices=[
            ('ACTIVA', _('Activa')),
            ('SUSPENDIDA', _('Suspendida')),
            ('CANCELADA', _('Cancelada')),
            ('CERRADA', _('Cerrada')),
        ],
        default='ACTIVA',
        verbose_name=_("Estado de la Sede"),
        help_text=_("Estado actual de la sede en REPS")
    )
    
    # Información de ubicación geográfica
    departamento = models.CharField(
        max_length=100,
        verbose_name=_("Departamento"),
        help_text=_("Departamento donde está ubicada la sede")
    )
    
    codigo_departamento = models.CharField(
        max_length=5,
        verbose_name=_("Código Departamento"),
        help_text=_("Código DIVIPOLA del departamento")
    )
    
    municipio = models.CharField(
        max_length=100,
        verbose_name=_("Municipio"),
        help_text=_("Municipio donde está ubicada la sede")
    )
    
    codigo_municipio = models.CharField(
        max_length=10,
        verbose_name=_("Código Municipio"),
        help_text=_("Código DIVIPOLA del municipio")
    )
    
    direccion = models.TextField(
        verbose_name=_("Dirección"),
        help_text=_("Dirección completa de la sede")
    )
    
    telefono = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("Teléfono"),
        help_text=_("Número telefónico de la sede")
    )
    
    email = models.EmailField(
        blank=True,
        verbose_name=_("Email"),
        help_text=_("Correo electrónico de contacto")
    )
    
    # Información administrativa
    representante_legal = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Representante Legal"),
        help_text=_("Nombre del representante legal de la sede")
    )
    
    director_sede = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Director de Sede"),
        help_text=_("Nombre del director o responsable de la sede")
    )
    
    # Fechas importantes
    fecha_apertura = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Fecha de Apertura"),
        help_text=_("Fecha de apertura de la sede")
    )
    
    fecha_habilitacion = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Fecha de Habilitación"),
        help_text=_("Fecha de habilitación en REPS")
    )
    
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Fecha de Vencimiento"),
        help_text=_("Fecha de vencimiento de la habilitación")
    )
    
    # Información técnica
    nivel_atencion = models.CharField(
        max_length=20,
        choices=[
            ('NIVEL_I', _('Nivel I')),
            ('NIVEL_II', _('Nivel II')),
            ('NIVEL_III', _('Nivel III')),
            ('ESPECIALIZADO', _('Especializado')),
        ],
        verbose_name=_("Nivel de Atención"),
        help_text=_("Nivel de complejidad de atención")
    )
    
    categoria = models.CharField(
        max_length=50,
        verbose_name=_("Categoría"),
        help_text=_("Categoría de la sede según clasificación MinSalud")
    )
    
    numero_camas = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Número de Camas"),
        help_text=_("Cantidad total de camas disponibles")
    )
    
    # Metadatos REPS
    fecha_actualizacion_reps = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Fecha Actualización REPS"),
        help_text=_("Última fecha de actualización en el portal REPS")
    )
    
    version_reps = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_("Versión REPS"),
        help_text=_("Versión del registro en REPS")
    )
    
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Fecha de Creación"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Fecha de Actualización"))
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='headquarters_created',
        verbose_name=_("Creado por")
    )

    class Meta:
        verbose_name = _("Sede de Prestador")
        verbose_name_plural = _("Sedes de Prestadores")
        ordering = ['nombre_sede']
        indexes = [
            models.Index(fields=['codigo_sede']),
            models.Index(fields=['organization', 'estado_sede']),
            models.Index(fields=['departamento', 'municipio']),
            models.Index(fields=['fecha_vencimiento']),
        ]

    def __str__(self):
        return f"{self.nombre_sede} ({self.codigo_sede})"

    def clean(self):
        """Validaciones del modelo"""
        if self.fecha_vencimiento and self.fecha_habilitacion:
            if self.fecha_vencimiento < self.fecha_habilitacion:
                raise ValidationError(_("La fecha de vencimiento no puede ser anterior a la fecha de habilitación"))

    def is_active(self):
        """Verifica si la sede está activa"""
        return self.estado_sede == 'ACTIVA'

    def is_about_to_expire(self, days=30):
        """Verifica si la habilitación está próxima a vencer"""
        if not self.fecha_vencimiento:
            return False
        from django.utils import timezone
        from datetime import timedelta
        return self.fecha_vencimiento <= timezone.now().date() + timedelta(days=days)

    def get_services_count(self):
        """Retorna el número de servicios habilitados en esta sede"""
        return self.enabled_services.filter(estado='HABILITADO').count()


class EnabledHealthService(models.Model):
    """
    Modelo para servicios de salud habilitados basado en estructura real REPS MinSalud.
    Mapea exactamente los campos del portal oficial para cumplimiento normativo.
    """
    
    # Relación con sede
    headquarters = models.ForeignKey(
        HeadquarterLocation,
        on_delete=models.CASCADE,
        related_name='enabled_services',
        verbose_name=_("Sede"),
        help_text=_("Sede donde se presta el servicio")
    )
    
    # Información básica del servicio
    codigo_servicio = models.CharField(
        max_length=50,
        verbose_name=_("Código de Servicio"),
        help_text=_("Código único del servicio según REPS")
    )
    
    nombre_servicio = models.CharField(
        max_length=200,
        verbose_name=_("Nombre del Servicio"),
        help_text=_("Denominación oficial del servicio")
    )
    
    tipo_servicio = models.CharField(
        max_length=100,
        verbose_name=_("Tipo de Servicio"),
        help_text=_("Clasificación del tipo de servicio según REPS")
    )
    
    modalidad = models.CharField(
        max_length=50,
        verbose_name=_("Modalidad"),
        help_text=_("Modalidad de prestación del servicio")
    )
    
    estado = models.CharField(
        max_length=20,
        choices=[
            ('HABILITADO', _('Habilitado')),
            ('SUSPENDIDO', _('Suspendido')),
            ('CANCELADO', _('Cancelado')),
            ('VENCIDO', _('Vencido')),
        ],
        default='HABILITADO',
        verbose_name=_("Estado del Servicio"),
        help_text=_("Estado actual del servicio en REPS")
    )
    
    # Clasificación del servicio
    grupo_servicio = models.CharField(
        max_length=100,
        verbose_name=_("Grupo de Servicio"),
        help_text=_("Grupo al que pertenece el servicio")
    )
    
    subgrupo_servicio = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Subgrupo de Servicio"),
        help_text=_("Subgrupo específico del servicio")
    )
    
    especialidad = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Especialidad"),
        help_text=_("Especialidad médica asociada")
    )
    
    # Información de capacidad
    capacidad_instalada = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Capacidad Instalada"),
        help_text=_("Capacidad máxima de atención")
    )
    
    capacidad_utilizada = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Capacidad Utilizada"),
        help_text=_("Capacidad actualmente en uso")
    )
    
    numero_profesionales = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Número de Profesionales"),
        help_text=_("Cantidad de profesionales asignados")
    )
    
    # Información normativa
    complejidad = models.CharField(
        max_length=20,
        choices=[
            ('BAJA', _('Baja Complejidad')),
            ('MEDIA', _('Mediana Complejidad')),
            ('ALTA', _('Alta Complejidad')),
        ],
        verbose_name=_("Complejidad"),
        help_text=_("Nivel de complejidad del servicio")
    )
    
    ambito = models.CharField(
        max_length=50,
        choices=[
            ('AMBULATORIO', _('Ambulatorio')),
            ('HOSPITALARIO', _('Hospitalario')),
            ('DOMICILIARIO', _('Domiciliario')),
            ('URGENCIAS', _('Urgencias')),
        ],
        verbose_name=_("Ámbito"),
        help_text=_("Ámbito de prestación del servicio")
    )
    
    # Fechas importantes
    fecha_habilitacion = models.DateField(
        verbose_name=_("Fecha de Habilitación"),
        help_text=_("Fecha de habilitación del servicio")
    )
    
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Fecha de Vencimiento"),
        help_text=_("Fecha de vencimiento de la habilitación")
    )
    
    fecha_ultima_actualizacion = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Fecha Última Actualización"),
        help_text=_("Fecha de última actualización en REPS")
    )
    
    # Información de contacto específica
    responsable_servicio = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Responsable del Servicio"),
        help_text=_("Nombre del responsable del servicio")
    )
    
    telefono_servicio = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("Teléfono del Servicio"),
        help_text=_("Teléfono específico del servicio")
    )
    
    # Información técnica adicional
    requiere_autorizacion = models.BooleanField(
        default=False,
        verbose_name=_("Requiere Autorización"),
        help_text=_("Indica si el servicio requiere autorización previa")
    )
    
    atiende_urgencias = models.BooleanField(
        default=False,
        verbose_name=_("Atiende Urgencias"),
        help_text=_("Indica si el servicio atiende urgencias")
    )
    
    disponible_24h = models.BooleanField(
        default=False,
        verbose_name=_("Disponible 24 Horas"),
        help_text=_("Indica si el servicio está disponible 24 horas")
    )
    
    # Metadatos REPS
    numero_resolucion = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Número de Resolución"),
        help_text=_("Número de resolución de habilitación")
    )
    
    fecha_resolucion = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Fecha de Resolución"),
        help_text=_("Fecha de la resolución de habilitación")
    )
    
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Fecha de Creación"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Fecha de Actualización"))
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='services_created',
        verbose_name=_("Creado por")
    )

    class Meta:
        verbose_name = _("Servicio Habilitado")
        verbose_name_plural = _("Servicios Habilitados")
        ordering = ['nombre_servicio']
        unique_together = ['headquarters', 'codigo_servicio']
        indexes = [
            models.Index(fields=['codigo_servicio']),
            models.Index(fields=['headquarters', 'estado']),
            models.Index(fields=['tipo_servicio', 'complejidad']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['grupo_servicio']),
        ]

    def __str__(self):
        return f"{self.nombre_servicio} - {self.headquarters.nombre_sede}"

    def clean(self):
        """Validaciones del modelo"""
        if self.fecha_vencimiento and self.fecha_habilitacion:
            if self.fecha_vencimiento < self.fecha_habilitacion:
                raise ValidationError(_("La fecha de vencimiento no puede ser anterior a la fecha de habilitación"))
                
        if self.capacidad_utilizada > self.capacidad_instalada:
            raise ValidationError(_("La capacidad utilizada no puede ser mayor a la capacidad instalada"))

    def is_enabled(self):
        """Verifica si el servicio está habilitado"""
        return self.estado == 'HABILITADO'

    def is_about_to_expire(self, days=30):
        """Verifica si la habilitación está próxima a vencer"""
        if not self.fecha_vencimiento:
            return False
        from django.utils import timezone
        from datetime import timedelta
        return self.fecha_vencimiento <= timezone.now().date() + timedelta(days=days)

    def get_utilization_percentage(self):
        """Calcula el porcentaje de utilización de la capacidad"""
        if self.capacidad_instalada == 0:
            return 0
        return round((self.capacidad_utilizada / self.capacidad_instalada) * 100, 2)

    def requires_renewal_soon(self, days=90):
        """Verifica si el servicio requiere renovación pronto"""
        return self.is_about_to_expire(days)