"""
Tests for Health models in Organization module.

This module contains tests for HealthOrganization and HealthService models,
testing validation, relationships, and business logic.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from datetime import date, timedelta

from apps.organization.models import Organization, Location, HealthOrganization, HealthService

User = get_user_model()


class HealthOrganizationModelTest(TestCase):
    """Test cases for HealthOrganization model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create base organization
        self.organization = Organization.objects.create(
            razon_social='Test IPS',
            nit='900123456',
            digito_verificacion='7',
            tipo_organizacion='ips',
            sector_economico='salud',
            tamaño_empresa='mediana',
            created_by=self.user,
            updated_by=self.user
        )
    
    def test_create_health_organization_valid(self):
        """Test creating a valid health organization."""
        health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='110012345678',
            naturaleza_juridica='privada',
            tipo_prestador='IPS',
            nivel_complejidad='II',
            representante_tipo_documento='CC',
            representante_numero_documento='12345678',
            representante_nombre_completo='Juan Pérez',
            representante_telefono='3001234567',
            representante_email='juan@test.com',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.assertEqual(str(health_org), 'Test IPS - 110012345678')
        self.assertEqual(health_org.codigo_prestador_formatted, '1100-1234-5678')
        self.assertEqual(health_org.representante_documento_completo, 'CC 12345678')
        self.assertEqual(health_org.servicios_activos, 0)
    
    def test_codigo_prestador_validation(self):
        """Test provider code validation."""
        # Test invalid length
        with self.assertRaises(ValidationError):
            health_org = HealthOrganization(
                organization=self.organization,
                codigo_prestador='12345',  # Too short
                naturaleza_juridica='privada',
                nivel_complejidad='II',
                representante_tipo_documento='CC',
                representante_numero_documento='12345678',
                representante_nombre_completo='Juan Pérez',
                representante_telefono='3001234567',
                representante_email='juan@test.com'
            )
            health_org.clean()
    
    def test_organization_sector_validation(self):
        """Test that organization must be health sector."""
        # Create non-health organization
        non_health_org = Organization.objects.create(
            razon_social='Tech Company',
            nit='900987654',
            digito_verificacion='3',
            tipo_organizacion='empresa_privada',
            sector_economico='tecnologia',  # Not health
            tamaño_empresa='mediana',
            created_by=self.user,
            updated_by=self.user
        )
        
        with self.assertRaises(ValidationError):
            health_org = HealthOrganization(
                organization=non_health_org,
                codigo_prestador='110012345678',
                naturaleza_juridica='privada',
                nivel_complejidad='II',
                representante_tipo_documento='CC',
                representante_numero_documento='12345678',
                representante_nombre_completo='Juan Pérez',
                representante_telefono='3001234567',
                representante_email='juan@test.com'
            )
            health_org.clean()
    
    def test_complexity_level_validation(self):
        """Test complexity level validation against provider type."""
        with self.assertRaises(ValidationError):
            health_org = HealthOrganization(
                organization=self.organization,
                codigo_prestador='110012345678',
                naturaleza_juridica='privada',
                tipo_prestador='LABORATORIO',  # Can't have level IV
                nivel_complejidad='IV',  # Invalid for laboratory
                representante_tipo_documento='CC',
                representante_numero_documento='12345678',
                representante_nombre_completo='Juan Pérez',
                representante_telefono='3001234567',
                representante_email='juan@test.com'
            )
            health_org.clean()
    
    def test_get_by_codigo_prestador(self):
        """Test getting health organization by provider code."""
        health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='110012345678',
            naturaleza_juridica='privada',
            nivel_complejidad='II',
            representante_tipo_documento='CC',
            representante_numero_documento='12345678',
            representante_nombre_completo='Juan Pérez',
            representante_telefono='3001234567',
            representante_email='juan@test.com',
            created_by=self.user,
            updated_by=self.user
        )
        
        found_org = HealthOrganization.get_by_codigo_prestador('110012345678')
        self.assertEqual(found_org, health_org)
        
        not_found = HealthOrganization.get_by_codigo_prestador('999999999999')
        self.assertIsNone(not_found)


class HealthServiceModelTest(TestCase):
    """Test cases for HealthService model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create base organization and location
        self.organization = Organization.objects.create(
            razon_social='Test IPS',
            nit='900123456',
            digito_verificacion='7',
            tipo_organizacion='ips',
            sector_economico='salud',
            tamaño_empresa='mediana',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.location = Location.objects.create(
            organization=self.organization,
            nombre='Sede Principal',
            tipo_sede='principal',
            es_principal=True,
            direccion='Calle 123 #45-67',
            ciudad='Bogotá',
            departamento='Cundinamarca',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='110012345678',
            naturaleza_juridica='privada',
            nivel_complejidad='II',
            representante_tipo_documento='CC',
            representante_numero_documento='12345678',
            representante_nombre_completo='Juan Pérez',
            representante_telefono='3001234567',
            representante_email='juan@test.com',
            created_by=self.user,
            updated_by=self.user
        )
    
    def test_create_health_service_valid(self):
        """Test creating a valid health service."""
        service = HealthService.objects.create(
            health_organization=self.health_org,
            codigo_servicio='329',
            nombre_servicio='Ortopedia y Traumatología',
            grupo_servicio='consulta_externa',
            fecha_habilitacion=date.today(),
            fecha_vencimiento=date.today() + timedelta(days=365),
            estado='activo',
            modalidad='intramural',
            sede_prestacion=self.location,
            created_by=self.user,
            updated_by=self.user
        )
        
        self.assertEqual(str(service), '329 - Ortopedia y Traumatología')
        self.assertTrue(service.esta_vigente)
        self.assertIsNotNone(service.dias_para_vencimiento)
    
    def test_expiration_date_validation(self):
        """Test that expiration date must be after qualification date."""
        with self.assertRaises(ValidationError):
            service = HealthService(
                health_organization=self.health_org,
                codigo_servicio='329',
                nombre_servicio='Ortopedia y Traumatología',
                grupo_servicio='consulta_externa',
                fecha_habilitacion=date.today(),
                fecha_vencimiento=date.today() - timedelta(days=1),  # Invalid: before qualification
                estado='activo',
                modalidad='intramural',
                sede_prestacion=self.location
            )
            service.clean()
    
    def test_sede_organization_validation(self):
        """Test that sede must belong to same organization."""
        # Create different organization and location
        other_org = Organization.objects.create(
            razon_social='Other IPS',
            nit='900987654',
            digito_verificacion='3',
            tipo_organizacion='ips',
            sector_economico='salud',
            tamaño_empresa='pequeña',
            created_by=self.user,
            updated_by=self.user
        )
        
        other_location = Location.objects.create(
            organization=other_org,
            nombre='Other Sede',
            tipo_sede='principal',
            es_principal=True,
            direccion='Carrera 456 #78-90',
            ciudad='Medellín',
            departamento='Antioquia',
            created_by=self.user,
            updated_by=self.user
        )
        
        with self.assertRaises(ValidationError):
            service = HealthService(
                health_organization=self.health_org,
                codigo_servicio='329',
                nombre_servicio='Ortopedia y Traumatología',
                grupo_servicio='consulta_externa',
                fecha_habilitacion=date.today(),
                estado='activo',
                modalidad='intramural',
                sede_prestacion=other_location  # Different organization
            )
            service.clean()
    
    def test_service_counter_update(self):
        """Test that service counter is updated automatically."""
        initial_count = self.health_org.servicios_habilitados_count
        
        # Create service
        service = HealthService.objects.create(
            health_organization=self.health_org,
            codigo_servicio='329',
            nombre_servicio='Ortopedia y Traumatología',
            grupo_servicio='consulta_externa',
            fecha_habilitacion=date.today(),
            estado='activo',
            modalidad='intramural',
            sede_prestacion=self.location,
            created_by=self.user,
            updated_by=self.user
        )
        
        # Refresh from database
        self.health_org.refresh_from_db()
        self.assertEqual(self.health_org.servicios_habilitados_count, initial_count + 1)
        
        # Delete service
        service.delete()
        self.health_org.refresh_from_db()
        self.assertEqual(self.health_org.servicios_habilitados_count, initial_count)
    
    def test_get_servicios_por_grupo(self):
        """Test getting services by group."""
        # Create services in different groups
        HealthService.objects.create(
            health_organization=self.health_org,
            codigo_servicio='329',
            nombre_servicio='Ortopedia y Traumatología',
            grupo_servicio='consulta_externa',
            fecha_habilitacion=date.today(),
            estado='activo',
            modalidad='intramural',
            sede_prestacion=self.location,
            created_by=self.user,
            updated_by=self.user
        )
        
        HealthService.objects.create(
            health_organization=self.health_org,
            codigo_servicio='301',
            nombre_servicio='Cirugía Ortopédica',
            grupo_servicio='quirurgicos',
            fecha_habilitacion=date.today(),
            estado='activo',
            modalidad='intramural',
            sede_prestacion=self.location,
            created_by=self.user,
            updated_by=self.user
        )
        
        consulta_services = HealthService.get_servicios_por_grupo(
            self.health_org, 'consulta_externa'
        )
        self.assertEqual(consulta_services.count(), 1)
        
        quirurgicos_services = HealthService.get_servicios_por_grupo(
            self.health_org, 'quirurgicos'
        )
        self.assertEqual(quirurgicos_services.count(), 1)
    
    def test_get_servicios_proximos_vencer(self):
        """Test getting services expiring soon."""
        # Create service expiring in 30 days
        soon_expiring = HealthService.objects.create(
            health_organization=self.health_org,
            codigo_servicio='329',
            nombre_servicio='Ortopedia y Traumatología',
            grupo_servicio='consulta_externa',
            fecha_habilitacion=date.today(),
            fecha_vencimiento=date.today() + timedelta(days=30),
            estado='activo',
            modalidad='intramural',
            sede_prestacion=self.location,
            created_by=self.user,
            updated_by=self.user
        )
        
        # Create service expiring in 90 days
        later_expiring = HealthService.objects.create(
            health_organization=self.health_org,
            codigo_servicio='301',
            nombre_servicio='Cirugía Ortopédica',
            grupo_servicio='quirurgicos',
            fecha_habilitacion=date.today(),
            fecha_vencimiento=date.today() + timedelta(days=90),
            estado='activo',
            modalidad='intramural',
            sede_prestacion=self.location,
            created_by=self.user,
            updated_by=self.user
        )
        
        # Get services expiring in next 60 days
        expiring_services = HealthService.get_servicios_proximos_vencer(
            self.health_org, dias=60
        )
        
        self.assertEqual(expiring_services.count(), 1)
        self.assertEqual(expiring_services.first(), soon_expiring)
    
    def test_marcar_como_vencido(self):
        """Test marking service as expired."""
        service = HealthService.objects.create(
            health_organization=self.health_org,
            codigo_servicio='329',
            nombre_servicio='Ortopedia y Traumatología',
            grupo_servicio='consulta_externa',
            fecha_habilitacion=date.today(),
            estado='activo',
            modalidad='intramural',
            sede_prestacion=self.location,
            created_by=self.user,
            updated_by=self.user
        )
        
        service.marcar_como_vencido()
        self.assertEqual(service.estado, 'suspendido')
        self.assertIn('marcado como vencido automáticamente', service.observaciones)