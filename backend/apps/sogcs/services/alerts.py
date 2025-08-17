"""
SOGCSAlertsService - Sistema de alertas para vencimientos y validaciones normativas.

Maneja alertas automáticas para:
- Vencimientos de habilitaciones de sedes y servicios
- Validaciones normativas según resoluciones MinSalud
- Notificaciones escaladas según configuración
"""

import logging
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Tuple
from django.db.models import Q, Count
from django.utils import timezone
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings

from ..models import HeadquarterLocation, EnabledHealthService

logger = logging.getLogger(__name__)


class SOGCSAlert:
    """Representación de una alerta SOGCS"""
    
    def __init__(self, alert_type: str, severity: str, title: str, message: str, 
                 entity_type: str, entity_id: int, due_date: date = None, 
                 days_until_due: int = None, **kwargs):
        self.alert_type = alert_type
        self.severity = severity  # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        self.title = title
        self.message = message
        self.entity_type = entity_type  # 'headquarters', 'service'
        self.entity_id = entity_id
        self.due_date = due_date
        self.days_until_due = days_until_due
        self.metadata = kwargs
        self.created_at = timezone.now()
    
    def to_dict(self) -> Dict:
        """Convierte la alerta a diccionario"""
        return {
            'alert_type': self.alert_type,
            'severity': self.severity,
            'title': self.title,
            'message': self.message,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'days_until_due': self.days_until_due,
            'created_at': self.created_at.isoformat(),
            'metadata': self.metadata
        }


class SOGCSAlertsService:
    """
    Servicio principal de alertas SOGCS.
    
    Características:
    - Detección automática de vencimientos próximos
    - Validaciones normativas según configuración
    - Generación de reportes de alertas
    - Notificaciones escaladas
    """
    
    def __init__(self, organization):
        self.organization = organization
        self.alerts = []
        self.config = self._get_alert_configuration()
    
    def generate_all_alerts(self) -> List[SOGCSAlert]:
        """
        Genera todas las alertas para la organización.
        
        Returns:
            Lista de alertas generadas
        """
        logger.info(f"Generando alertas SOGCS para {self.organization.organization.razon_social}")
        
        # Limpiar alertas existentes
        self.alerts = []
        
        # Generar alertas por tipo
        self._generate_expiration_alerts()
        self._generate_regulatory_alerts()
        self._generate_capacity_alerts()
        self._generate_status_alerts()
        
        # Ordenar por severidad y fecha
        self.alerts.sort(key=lambda x: (
            self._severity_order(x.severity),
            x.days_until_due if x.days_until_due is not None else 999
        ))
        
        logger.info(f"Generadas {len(self.alerts)} alertas SOGCS")
        return self.alerts
    
    def get_critical_alerts(self) -> List[SOGCSAlert]:
        """Retorna solo alertas críticas"""
        return [alert for alert in self.alerts if alert.severity == 'CRITICAL']
    
    def get_alerts_by_type(self, alert_type: str) -> List[SOGCSAlert]:
        """Retorna alertas filtradas por tipo"""
        return [alert for alert in self.alerts if alert.alert_type == alert_type]
    
    def get_alerts_summary(self) -> Dict:
        """Retorna resumen de alertas por severidad"""
        summary = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
        
        for alert in self.alerts:
            summary[alert.severity] += 1
        
        return summary
    
    def _generate_expiration_alerts(self):
        """Genera alertas de vencimientos próximos"""
        logger.debug("Generando alertas de vencimientos")
        
        # Alertas de sedes próximas a vencer
        headquarters_alerts = self._check_headquarters_expiration()
        self.alerts.extend(headquarters_alerts)
        
        # Alertas de servicios próximos a vencer
        services_alerts = self._check_services_expiration()
        self.alerts.extend(services_alerts)
    
    def _check_headquarters_expiration(self) -> List[SOGCSAlert]:
        """Verifica vencimientos de sedes"""
        alerts = []
        today = date.today()
        
        # Definir umbrales de alerta
        thresholds = [
            (7, 'CRITICAL', 'vence en 7 días o menos'),
            (15, 'HIGH', 'vence en 15 días o menos'),
            (30, 'MEDIUM', 'vence en 30 días o menos'),
            (60, 'LOW', 'vence en 60 días o menos')
        ]
        
        for days, severity, description in thresholds:
            expiry_date = today + timedelta(days=days)
            
            headquarters = HeadquarterLocation.objects.filter(
                organization=self.organization,
                estado_sede='ACTIVA',
                fecha_vencimiento__lte=expiry_date,
                fecha_vencimiento__gte=today
            ).exclude(
                # Excluir las que ya tienen alertas más críticas
                fecha_vencimiento__lt=today + timedelta(
                    days=min([t[0] for t in thresholds if t[1] in ['CRITICAL', 'HIGH'] and t[0] < days], default=days)
                )
            )
            
            for hq in headquarters:
                days_until = (hq.fecha_vencimiento - today).days
                
                alert = SOGCSAlert(
                    alert_type='EXPIRATION_HEADQUARTERS',
                    severity=severity,
                    title=f'Sede {hq.nombre_sede} próxima a vencer',
                    message=f'La habilitación de la sede {hq.nombre_sede} ({hq.codigo_sede}) {description}. '
                           f'Fecha de vencimiento: {hq.fecha_vencimiento.strftime("%d/%m/%Y")}',
                    entity_type='headquarters',
                    entity_id=hq.id,
                    due_date=hq.fecha_vencimiento,
                    days_until_due=days_until,
                    codigo_sede=hq.codigo_sede,
                    nombre_sede=hq.nombre_sede,
                    ubicacion=f"{hq.municipio}, {hq.departamento}"
                )
                alerts.append(alert)
        
        return alerts
    
    def _check_services_expiration(self) -> List[SOGCSAlert]:
        """Verifica vencimientos de servicios"""
        alerts = []
        today = date.today()
        
        # Definir umbrales de alerta
        thresholds = [
            (7, 'CRITICAL', 'vence en 7 días o menos'),
            (15, 'HIGH', 'vence en 15 días o menos'),
            (30, 'MEDIUM', 'vence en 30 días o menos'),
            (60, 'LOW', 'vence en 60 días o menos')
        ]
        
        for days, severity, description in thresholds:
            expiry_date = today + timedelta(days=days)
            
            services = EnabledHealthService.objects.filter(
                headquarters__organization=self.organization,
                estado='HABILITADO',
                fecha_vencimiento__lte=expiry_date,
                fecha_vencimiento__gte=today
            ).exclude(
                # Excluir los que ya tienen alertas más críticas
                fecha_vencimiento__lt=today + timedelta(
                    days=min([t[0] for t in thresholds if t[1] in ['CRITICAL', 'HIGH'] and t[0] < days], default=days)
                )
            ).select_related('headquarters')
            
            for service in services:
                days_until = (service.fecha_vencimiento - today).days
                
                alert = SOGCSAlert(
                    alert_type='EXPIRATION_SERVICE',
                    severity=severity,
                    title=f'Servicio {service.nombre_servicio} próximo a vencer',
                    message=f'La habilitación del servicio {service.nombre_servicio} '
                           f'en {service.headquarters.nombre_sede} {description}. '
                           f'Fecha de vencimiento: {service.fecha_vencimiento.strftime("%d/%m/%Y")}',
                    entity_type='service',
                    entity_id=service.id,
                    due_date=service.fecha_vencimiento,
                    days_until_due=days_until,
                    codigo_servicio=service.codigo_servicio,
                    nombre_servicio=service.nombre_servicio,
                    sede=service.headquarters.nombre_sede,
                    complejidad=service.complejidad
                )
                alerts.append(alert)
        
        return alerts
    
    def _generate_regulatory_alerts(self):
        """Genera alertas de cumplimiento normativo"""
        logger.debug("Generando alertas de cumplimiento normativo")
        
        # Verificar sedes sin habilitación válida
        invalid_headquarters = HeadquarterLocation.objects.filter(
            organization=self.organization,
            estado_sede='ACTIVA'
        ).filter(
            Q(fecha_habilitacion__isnull=True) | 
            Q(fecha_vencimiento__lt=date.today())
        )
        
        for hq in invalid_headquarters:
            if hq.fecha_vencimiento and hq.fecha_vencimiento < date.today():
                # Habilitación vencida
                days_expired = (date.today() - hq.fecha_vencimiento).days
                alert = SOGCSAlert(
                    alert_type='REGULATORY_VIOLATION',
                    severity='CRITICAL',
                    title=f'Sede {hq.nombre_sede} con habilitación vencida',
                    message=f'La sede {hq.nombre_sede} ({hq.codigo_sede}) tiene habilitación vencida '
                           f'desde {hq.fecha_vencimiento.strftime("%d/%m/%Y")} ({days_expired} días). '
                           f'Se requiere renovación inmediata.',
                    entity_type='headquarters',
                    entity_id=hq.id,
                    days_expired=days_expired,
                    regulation='Resolución 3100/2019 - SUH'
                )
                self.alerts.append(alert)
            else:
                # Sin fecha de habilitación
                alert = SOGCSAlert(
                    alert_type='REGULATORY_VIOLATION',
                    severity='HIGH',
                    title=f'Sede {hq.nombre_sede} sin fecha de habilitación',
                    message=f'La sede {hq.nombre_sede} ({hq.codigo_sede}) no tiene fecha de habilitación registrada. '
                           f'Verificar cumplimiento normativo.',
                    entity_type='headquarters',
                    entity_id=hq.id,
                    regulation='Resolución 3100/2019 - SUH'
                )
                self.alerts.append(alert)
        
        # Verificar servicios sin habilitación válida
        invalid_services = EnabledHealthService.objects.filter(
            headquarters__organization=self.organization,
            estado='HABILITADO'
        ).filter(
            Q(fecha_habilitacion__isnull=True) |
            Q(fecha_vencimiento__lt=date.today())
        ).select_related('headquarters')
        
        for service in invalid_services:
            if service.fecha_vencimiento and service.fecha_vencimiento < date.today():
                # Habilitación vencida
                days_expired = (date.today() - service.fecha_vencimiento).days
                alert = SOGCSAlert(
                    alert_type='REGULATORY_VIOLATION',
                    severity='CRITICAL',
                    title=f'Servicio {service.nombre_servicio} con habilitación vencida',
                    message=f'El servicio {service.nombre_servicio} en {service.headquarters.nombre_sede} '
                           f'tiene habilitación vencida desde {service.fecha_vencimiento.strftime("%d/%m/%Y")} '
                           f'({days_expired} días). Se requiere renovación inmediata.',
                    entity_type='service',
                    entity_id=service.id,
                    days_expired=days_expired,
                    regulation='Resolución 3100/2019 - SUH'
                )
                self.alerts.append(alert)
    
    def _generate_capacity_alerts(self):
        """Genera alertas de capacidad y utilización"""
        logger.debug("Generando alertas de capacidad")
        
        # Servicios con sobreutilización
        from django.db import models
        overused_services = EnabledHealthService.objects.filter(
            headquarters__organization=self.organization,
            estado='HABILITADO',
            capacidad_instalada__gt=0
        ).filter(
            capacidad_utilizada__gt=models.F('capacidad_instalada')
        ).select_related('headquarters')
        
        for service in overused_services:
            utilization = service.get_utilization_percentage()
            alert = SOGCSAlert(
                alert_type='CAPACITY_OVERUSE',
                severity='HIGH',
                title=f'Sobreutilización en {service.nombre_servicio}',
                message=f'El servicio {service.nombre_servicio} en {service.headquarters.nombre_sede} '
                       f'tiene utilización del {utilization}% (capacidad excedida). '
                       f'Revisar capacidad instalada vs utilizada.',
                entity_type='service',
                entity_id=service.id,
                utilization_percentage=utilization,
                capacidad_instalada=service.capacidad_instalada,
                capacidad_utilizada=service.capacidad_utilizada
            )
            self.alerts.append(alert)
    
    def _generate_status_alerts(self):
        """Genera alertas de estado anómalos"""
        logger.debug("Generando alertas de estado")
        
        # Sedes suspendidas
        suspended_headquarters = HeadquarterLocation.objects.filter(
            organization=self.organization,
            estado_sede='SUSPENDIDA'
        )
        
        for hq in suspended_headquarters:
            alert = SOGCSAlert(
                alert_type='STATUS_SUSPENDED',
                severity='HIGH',
                title=f'Sede {hq.nombre_sede} suspendida',
                message=f'La sede {hq.nombre_sede} ({hq.codigo_sede}) se encuentra en estado SUSPENDIDA. '
                       f'Se requiere gestión para normalizar el estado.',
                entity_type='headquarters',
                entity_id=hq.id
            )
            self.alerts.append(alert)
        
        # Servicios suspendidos
        suspended_services = EnabledHealthService.objects.filter(
            headquarters__organization=self.organization,
            estado='SUSPENDIDO'
        ).select_related('headquarters')
        
        for service in suspended_services:
            alert = SOGCSAlert(
                alert_type='STATUS_SUSPENDED',
                severity='MEDIUM',
                title=f'Servicio {service.nombre_servicio} suspendido',
                message=f'El servicio {service.nombre_servicio} en {service.headquarters.nombre_sede} '
                       f'se encuentra SUSPENDIDO. Verificar causas y gestionar normalización.',
                entity_type='service',
                entity_id=service.id
            )
            self.alerts.append(alert)
    
    def _get_alert_configuration(self) -> Dict:
        """Obtiene configuración de alertas de la organización"""
        default_config = {
            'expiration_thresholds': [7, 15, 30, 60],
            'enable_email_notifications': True,
            'notification_recipients': [],
            'escalation_enabled': True,
            'escalation_days': [1, 3, 7],
            'business_hours_only': False
        }
        
        # Intentar obtener configuración específica de SOGCS
        if hasattr(self.organization, 'sogcs_configuration') and self.organization.sogcs_configuration:
            alert_config = self.organization.sogcs_configuration.get('alert_config', {})
            default_config.update(alert_config)
        
        return default_config
    
    def _severity_order(self, severity: str) -> int:
        """Retorna orden numérico para ordenar por severidad"""
        order = {'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4}
        return order.get(severity, 5)
    
    def send_alert_notifications(self, alerts: List[SOGCSAlert] = None) -> bool:
        """
        Envía notificaciones por email para alertas críticas.
        
        Args:
            alerts: Lista de alertas a notificar. Si None, usa alertas críticas
            
        Returns:
            True si las notificaciones se enviaron exitosamente
        """
        if not self.config.get('enable_email_notifications', False):
            logger.info("Notificaciones por email deshabilitadas")
            return True
        
        if alerts is None:
            alerts = self.get_critical_alerts()
        
        if not alerts:
            logger.info("No hay alertas críticas para notificar")
            return True
        
        try:
            # Obtener destinatarios
            recipients = self._get_notification_recipients()
            
            if not recipients:
                logger.warning("No hay destinatarios configurados para notificaciones")
                return False
            
            # Preparar contexto para template
            context = {
                'organization': self.organization,
                'alerts': alerts,
                'alerts_count': len(alerts),
                'timestamp': timezone.now()
            }
            
            # Renderizar email
            subject = f'[SOGCS] Alertas Críticas - {self.organization.name}'
            html_message = render_to_string('sogcs/emails/critical_alerts.html', context)
            text_message = render_to_string('sogcs/emails/critical_alerts.txt', context)
            
            # Enviar email
            send_mail(
                subject=subject,
                message=text_message,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipients,
                fail_silently=False
            )
            
            logger.info(f"Notificaciones enviadas a {len(recipients)} destinatarios")
            return True
            
        except Exception as e:
            logger.error(f"Error enviando notificaciones: {str(e)}")
            return False
    
    def _get_notification_recipients(self) -> List[str]:
        """Obtiene lista de emails para notificaciones"""
        recipients = []
        
        # Emails configurados manualmente
        config_emails = self.config.get('notification_recipients', [])
        recipients.extend(config_emails)
        
        # Agregar coordinador de calidad si existe
        if hasattr(self.organization, 'coordinador_calidad') and self.organization.coordinador_calidad:
            if self.organization.coordinador_calidad.email:
                recipients.append(self.organization.coordinador_calidad.email)
        
        # Agregar responsable de habilitación si existe
        if hasattr(self.organization, 'responsable_habilitacion') and self.organization.responsable_habilitacion:
            if self.organization.responsable_habilitacion.email:
                recipients.append(self.organization.responsable_habilitacion.email)
        
        # Eliminar duplicados y emails vacíos
        recipients = list(set([email for email in recipients if email and '@' in email]))
        
        return recipients
    
    def get_alerts_report(self) -> Dict:
        """Genera reporte completo de alertas"""
        return {
            'organization': {
                'id': self.organization.id,
                'name': self.organization.organization.razon_social,
                'sogcs_enabled': getattr(self.organization, 'sogcs_enabled', False)
            },
            'timestamp': timezone.now().isoformat(),
            'summary': self.get_alerts_summary(),
            'alerts': [alert.to_dict() for alert in self.alerts],
            'configuration': self.config
        }