"""
SOGCS Models - Sistema Obligatorio de Garantía de Calidad en Salud

Este módulo define los modelos para el sistema SOGCS que incluye:
- SUH (Sistema Único de Habilitación)
- PAMEC (Programa de Auditoría para el Mejoramiento de la Calidad)
- SIC (Sistema de Información para la Calidad)
- SUA (Sistema Único de Acreditación)
"""

from django.db import models
from django.contrib.auth import get_user_model
from apps.common.models import BaseModel
from apps.organization.models import Organization

User = get_user_model()


class HeadquarterLocation(BaseModel):
    """
    Ubicación de sedes para servicios habilitados
    """
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='headquarter_locations',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=200, verbose_name="Nombre de la sede")
    address = models.TextField(verbose_name="Dirección")
    city = models.CharField(max_length=100, verbose_name="Ciudad")
    department = models.CharField(max_length=100, verbose_name="Departamento")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Teléfono")
    
    class Meta:
        verbose_name = "Ubicación de Sede"
        verbose_name_plural = "Ubicaciones de Sedes"
        
    def __str__(self):
        return f"{self.name} - {self.city}"


class EnabledHealthService(BaseModel):
    """
    Servicios de salud habilitados por el SUH
    """
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='enabled_services',
        null=True,
        blank=True
    )
    headquarters = models.ForeignKey(
        HeadquarterLocation,
        on_delete=models.CASCADE,
        related_name='services'
    )
    service_code = models.CharField(max_length=10, verbose_name="Código del servicio")
    service_name = models.CharField(max_length=200, verbose_name="Nombre del servicio")
    complexity_level = models.CharField(
        max_length=20,
        choices=[
            ('BAJA', 'Baja complejidad'),
            ('MEDIA', 'Media complejidad'),
            ('ALTA', 'Alta complejidad'),
        ],
        default='BAJA',
        verbose_name="Nivel de complejidad"
    )
    enabled_date = models.DateField(null=True, blank=True, verbose_name="Fecha de habilitación")
    expiration_date = models.DateField(null=True, blank=True, verbose_name="Fecha de vencimiento")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    
    class Meta:
        verbose_name = "Servicio de Salud Habilitado"
        verbose_name_plural = "Servicios de Salud Habilitados"
        unique_together = ['organization', 'headquarters', 'service_code']
        
    def __str__(self):
        return f"{self.service_name} - {self.headquarters.name}"