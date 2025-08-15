"""
Tests for SedePrestadora and SedeServicio models.

This module contains basic tests for the sede models to ensure
they work correctly with the existing organization structure.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from apps.organization.models import (
    Organization, 
    HealthOrganization, 
    HealthService, 
    SedePrestadora, 
    SedeServicio
)

User = get_user_model()


class SedePrestaDoraModelTest(TestCase):
    """Test cases for SedePrestadora model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        # Create organization
        self.organization = Organization.objects.create(
            razon_social='Hospital Test',
            nit='123456789',
            digito_verificacion='1',
            email='hospital@test.com',
            telefono='1234567890',
            direccion='Calle Test 123',
            ciudad='Bogotá',
            departamento='Cundinamarca',
            pais='Colombia',
            created_by=self.user
        )
        
        # Create health organization
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='123456789',
            naturaleza_juridica='publica',
            tipo_prestador='ips',
            nivel_complejidad='alta',
            representante_legal='Dr. Test',
            fecha_habilitacion='2023-01-01',
            created_by=self.user
        )
        
        # Create health service
        self.health_service = HealthService.objects.create(
            health_organization=self.health_org,
            codigo_servicio='901',
            nombre_servicio='Consulta Externa',
            grupo_servicio='consulta_externa',
            complejidad='baja',
            created_by=self.user
        )
    
    def test_sede_creation(self):
        """Test basic sede creation"""
        sede = SedePrestadora.objects.create(
            health_organization=self.health_org,
            numero_sede='01',
            codigo_prestador='123456789-01',
            nombre_sede='Sede Principal',
            tipo_sede='principal',
            es_sede_principal=True,
            direccion='Calle Principal 123',
            departamento='Cundinamarca',
            municipio='Bogotá',
            telefono_principal='+57 1 234 5678',
            email='sede@hospital.com',
            nombre_responsable='Dr. Juan Pérez',
            cargo_responsable='Director Médico',
            estado='activa',
            numero_camas=50,
            numero_consultorios=10,
            numero_quirofanos=3,
            atencion_24_horas=True,
            created_by=self.user
        )
        
        self.assertEqual(sede.numero_sede, '01')
        self.assertEqual(sede.nombre_sede, 'Sede Principal')
        self.assertTrue(sede.es_sede_principal)
        self.assertEqual(sede.estado, 'activa')
        self.assertEqual(str(sede), 'Sede Principal - Sede 01')
    
    def test_sede_direccion_completa_property(self):
        """Test direccion_completa property"""
        sede = SedePrestadora.objects.create(
            health_organization=self.health_org,
            numero_sede='02',
            codigo_prestador='123456789-02',
            nombre_sede='Sede Norte',
            direccion='Carrera 15 #20-30',
            departamento='Antioquia',
            municipio='Medellín',
            telefono_principal='+57 4 234 5678',
            email='norte@hospital.com',
            nombre_responsable='Dra. María García',
            cargo_responsable='Coordinadora',
            created_by=self.user
        )
        
        expected_direccion = 'Carrera 15 #20-30, Medellín, Antioquia'
        self.assertEqual(sede.direccion_completa, expected_direccion)
    
    def test_sede_auto_format_numero(self):
        """Test automatic formatting of numero_sede with leading zeros"""
        sede = SedePrestadora.objects.create(
            health_organization=self.health_org,
            numero_sede='3',  # Will be formatted to '03'
            codigo_prestador='123456789-03',
            nombre_sede='Sede Sur',
            direccion='Calle Sur 456',
            departamento='Valle del Cauca',
            municipio='Cali',
            telefono_principal='+57 2 234 5678',
            email='sur@hospital.com',
            nombre_responsable='Dr. Carlos López',
            cargo_responsable='Director',
            created_by=self.user
        )
        
        self.assertEqual(sede.numero_sede, '03')
    
    def test_sede_principal_unique_constraint(self):
        """Test that only one sede principal is allowed per organization"""
        # Create first sede principal
        SedePrestadora.objects.create(
            health_organization=self.health_org,
            numero_sede='01',
            codigo_prestador='123456789-01',
            nombre_sede='Sede Principal 1',
            es_sede_principal=True,
            direccion='Calle Principal 123',
            departamento='Cundinamarca',
            municipio='Bogotá',
            telefono_principal='+57 1 234 5678',
            email='sede1@hospital.com',
            nombre_responsable='Dr. Juan Pérez',
            cargo_responsable='Director',
            created_by=self.user
        )
        
        # Try to create another sede principal - should raise ValidationError
        sede2 = SedePrestadora(
            health_organization=self.health_org,
            numero_sede='02',
            codigo_prestador='123456789-02',
            nombre_sede='Sede Principal 2',
            es_sede_principal=True,
            direccion='Calle Principal 456',
            departamento='Cundinamarca',
            municipio='Bogotá',
            telefono_principal='+57 1 234 5679',
            email='sede2@hospital.com',
            nombre_responsable='Dr. Pedro García',
            cargo_responsable='Director',
            created_by=self.user
        )
        
        with self.assertRaises(ValidationError):
            sede2.clean()
    
    def test_sede_numero_validation(self):
        """Test numero_sede validation"""
        sede = SedePrestadora(
            health_organization=self.health_org,
            numero_sede='invalid',  # Should be numeric
            codigo_prestador='123456789-04',
            nombre_sede='Sede Test',
            direccion='Calle Test 789',
            departamento='Cundinamarca',
            municipio='Bogotá',
            telefono_principal='+57 1 234 5678',
            email='test@hospital.com',
            nombre_responsable='Dr. Test',
            cargo_responsable='Director',
            created_by=self.user
        )
        
        with self.assertRaises(ValidationError):
            sede.clean()
    
    def test_first_sede_auto_principal(self):
        """Test that first sede is automatically marked as principal"""
        sede = SedePrestadora.objects.create(
            health_organization=self.health_org,
            numero_sede='01',
            codigo_prestador='123456789-01',
            nombre_sede='Primera Sede',
            direccion='Calle Primera 123',
            departamento='Cundinamarca',
            municipio='Bogotá',
            telefono_principal='+57 1 234 5678',
            email='primera@hospital.com',
            nombre_responsable='Dr. Primero',
            cargo_responsable='Director',
            created_by=self.user
        )
        
        # Refresh from database
        sede.refresh_from_db()
        self.assertTrue(sede.es_sede_principal)


class SedeServicioModelTest(TestCase):
    """Test cases for SedeServicio model"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        # Create organization
        self.organization = Organization.objects.create(
            razon_social='Hospital Test',
            nit='123456789',
            digito_verificacion='1',
            email='hospital@test.com',
            telefono='1234567890',
            direccion='Calle Test 123',
            ciudad='Bogotá',
            departamento='Cundinamarca',
            pais='Colombia',
            created_by=self.user
        )
        
        # Create health organization
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='123456789',
            naturaleza_juridica='publica',
            tipo_prestador='ips',
            nivel_complejidad='alta',
            representante_legal='Dr. Test',
            fecha_habilitacion='2023-01-01',
            created_by=self.user
        )
        
        # Create sede
        self.sede = SedePrestadora.objects.create(
            health_organization=self.health_org,
            numero_sede='01',
            codigo_prestador='123456789-01',
            nombre_sede='Sede Principal',
            direccion='Calle Principal 123',
            departamento='Cundinamarca',
            municipio='Bogotá',
            telefono_principal='+57 1 234 5678',
            email='sede@hospital.com',
            nombre_responsable='Dr. Juan Pérez',
            cargo_responsable='Director',
            created_by=self.user
        )
        
        # Create health service
        self.health_service = HealthService.objects.create(
            health_organization=self.health_org,
            codigo_servicio='901',
            nombre_servicio='Consulta Externa',
            grupo_servicio='consulta_externa',
            complejidad='baja',
            created_by=self.user
        )
    
    def test_sede_servicio_creation(self):
        """Test basic sede servicio creation"""
        sede_servicio = SedeServicio.objects.create(
            sede=self.sede,
            servicio=self.health_service,
            distintivo='01-901',
            capacidad_instalada=20,
            fecha_habilitacion='2023-01-01',
            estado_servicio='activo',
            observaciones='Servicio de consulta externa',
            created_by=self.user
        )
        
        self.assertEqual(sede_servicio.distintivo, '01-901')
        self.assertEqual(sede_servicio.capacidad_instalada, 20)
        self.assertEqual(sede_servicio.estado_servicio, 'activo')
        expected_str = f"{self.sede.nombre_sede} - {self.health_service.nombre_servicio}"
        self.assertEqual(str(sede_servicio), expected_str)
    
    def test_sede_servicio_organization_validation(self):
        """Test that sede and servicio must belong to same organization"""
        # Create another organization
        other_org = Organization.objects.create(
            razon_social='Hospital Otro',
            nit='987654321',
            digito_verificacion='9',
            email='otro@test.com',
            telefono='0987654321',
            direccion='Calle Otro 456',
            ciudad='Medellín',
            departamento='Antioquia',
            pais='Colombia',
            created_by=self.user
        )
        
        other_health_org = HealthOrganization.objects.create(
            organization=other_org,
            codigo_prestador='987654321',
            naturaleza_juridica='privada',
            tipo_prestador='ips',
            nivel_complejidad='media',
            representante_legal='Dr. Otro',
            fecha_habilitacion='2023-01-01',
            created_by=self.user
        )
        
        other_service = HealthService.objects.create(
            health_organization=other_health_org,
            codigo_servicio='902',
            nombre_servicio='Urgencias',
            grupo_servicio='urgencias',
            complejidad='alta',
            created_by=self.user
        )
        
        # Try to create sede_servicio with service from different organization
        sede_servicio = SedeServicio(
            sede=self.sede,
            servicio=other_service,  # Different organization
            distintivo='01-902',
            capacidad_instalada=10,
            created_by=self.user
        )
        
        with self.assertRaises(ValidationError):
            sede_servicio.clean()
    
    def test_distinctive_unique_per_sede(self):
        """Test that distintivo is unique per sede"""
        # Create first sede servicio
        SedeServicio.objects.create(
            sede=self.sede,
            servicio=self.health_service,
            distintivo='01-TEST',
            capacidad_instalada=10,
            created_by=self.user
        )
        
        # Create another service
        other_service = HealthService.objects.create(
            health_organization=self.health_org,
            codigo_servicio='902',
            nombre_servicio='Urgencias',
            grupo_servicio='urgencias',
            complejidad='alta',
            created_by=self.user
        )
        
        # Try to create another sede servicio with same distintivo
        with self.assertRaises(Exception):  # Should raise IntegrityError
            SedeServicio.objects.create(
                sede=self.sede,
                servicio=other_service,
                distintivo='01-TEST',  # Same distintivo
                capacidad_instalada=5,
                created_by=self.user
            )