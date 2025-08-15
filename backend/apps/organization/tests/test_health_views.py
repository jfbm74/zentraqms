"""
Tests for Health API views in Organization module.

This module contains tests for HealthViewSet endpoints,
testing REPS validation, services catalog, and health-specific API functionality.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
import json

from apps.organization.models import Organization, Location, HealthOrganization, HealthService

User = get_user_model()


class HealthViewSetTest(TestCase):
    """Test cases for HealthViewSet API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client.force_authenticate(user=self.user)
        
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
        
        # Create location
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
        
        # Create health organization
        self.health_org = HealthOrganization.objects.create(
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
    
    def test_validate_reps_success(self):
        """Test successful REPS validation."""
        url = reverse('organization:health-validate-reps')
        data = {'codigo_prestador': '110012345678'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['isValid'])
        self.assertIn('providerData', response.data)
        provider_data = response.data['providerData']
        self.assertIn('nombre', provider_data)
        self.assertIn('departamento', provider_data)
        self.assertIn('municipio', provider_data)
    
    def test_validate_reps_invalid_format(self):
        """Test REPS validation with invalid format."""
        url = reverse('organization:health-validate-reps')
        data = {'codigo_prestador': '12345'}  # Too short
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['isValid'])
        self.assertIn('message', response.data)
    
    def test_validate_reps_not_found(self):
        """Test REPS validation for non-existent provider."""
        url = reverse('organization:health-validate-reps')
        data = {'codigo_prestador': '999999999999'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['isValid'])
        self.assertIn('message', response.data)
    
    def test_services_catalog(self):
        """Test health services catalog endpoint."""
        url = reverse('organization:health-services-catalog')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('services', response.data)
        self.assertIsInstance(response.data['services'], list)
        
        # Check that services have required fields
        if response.data['services']:
            service = response.data['services'][0]
            self.assertIn('codigo', service)
            self.assertIn('nombre', service)
            self.assertIn('grupo', service)
    
    def test_services_catalog_filter_by_group(self):
        """Test health services catalog filtered by group."""
        url = reverse('organization:health-services-catalog')
        params = {'grupo': 'consulta_externa'}
        
        response = self.client.get(url, params)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('services', response.data)
        
        # Check that all returned services belong to the requested group
        for service in response.data['services']:
            self.assertEqual(service['grupo'], 'consulta_externa')
    
    def test_validate_services_success(self):
        """Test successful services validation."""
        url = reverse('organization:health-validate-services')
        data = {
            'services': [
                {'codigo_servicio': '329'},  # Valid for level II
                {'codigo_servicio': '301'}
            ],
            'nivel_complejidad': 'II'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('validation_results', response.data)
        self.assertIn('summary', response.data)
        self.assertTrue(response.data['summary']['overall_valid'])
    
    def test_validate_services_invalid_complexity(self):
        """Test services validation with invalid complexity."""
        url = reverse('organization:health-validate-services')
        data = {
            'services': [
                {'codigo_servicio': '501'}  # High complexity service
            ],
            'nivel_complejidad': 'I'  # Low complexity level
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return validation result even if some services are invalid
        self.assertIn('validation_results', response.data)
        self.assertIn('summary', response.data)
    
    def test_validate_services_empty_list(self):
        """Test services validation with empty services list."""
        url = reverse('organization:health-validate-services')
        data = {
            'services': [],
            'nivel_complejidad': 'II'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_complexity_levels(self):
        """Test complexity levels endpoint."""
        url = reverse('organization:health-complexity-levels')
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('complexity_levels', response.data)
        self.assertIsInstance(response.data['complexity_levels'], list)
        
        # Check that levels have required fields
        for level in response.data['complexity_levels']:
            self.assertIn('code', level)
            self.assertIn('name', level)
            self.assertIn('description', level)
    
    def test_unauthorized_access(self):
        """Test that endpoints require authentication."""
        self.client.force_authenticate(user=None)
        
        endpoints = [
            'organization:health-validate-reps',
            'organization:health-services-catalog',
            'organization:health-validate-services',
            'organization:health-complexity-levels'
        ]
        
        for endpoint in endpoints:
            url = reverse(endpoint)
            
            if endpoint == 'organization:health-validate-reps':
                response = self.client.post(url, {'codigo_prestador': '110012345678'})
            elif endpoint == 'organization:health-validate-services':
                response = self.client.post(url, {
                    'services': [{'codigo_servicio': '329'}],
                    'nivel_complejidad': 'II'
                })
            else:
                response = self.client.get(url)
            
            self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])




class HealthServiceModelIntegrationTest(TestCase):
    """Test integration between HealthService model and API responses."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create base organization and health profile
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
    
    def test_health_service_model_integration(self):
        """Test creating a health service and verifying counter updates."""
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
        
        self.assertEqual(service.codigo_servicio, '329')
        self.assertEqual(service.grupo_servicio, 'consulta_externa')
        self.assertTrue(service.esta_vigente)
        
        # Check that counter was updated
        self.health_org.refresh_from_db()
        self.assertEqual(self.health_org.servicios_habilitados_count, 1)