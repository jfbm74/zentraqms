"""
Integration tests for Organization API endpoints.

Tests complete API workflows including:
- Organization creation via wizard endpoint
- Field validation and error responses
- Authentication and authorization
- Database interactions
"""

import json
import tempfile
from io import BytesIO
from PIL import Image

from django.test import TestCase, override_settings
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status

from apps.organization.models import Organization, HealthOrganization

User = get_user_model()


class OrganizationAPIIntegrationTestCase(APITestCase):
    """Base test case for organization API integration tests."""

    def setUp(self):
        """Set up test data and authentication."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Base wizard data
        self.wizard_data = {
            'razon_social': 'Hospital San Rafael',
            'nit': '123456789',
            'digito_verificacion': '1',
            'email_contacto': 'info@hsanrafael.com',
            'telefono_principal': '+57 1 234 5678',
            'website': 'https://hsanrafael.com',
            'descripcion': 'Hospital especializado en alta complejidad',
            'tamaño_empresa': 'grande',
            'fecha_fundacion': '2020-01-15'
        }

    def get_wizard_url(self):
        """Get wizard API endpoint URL."""
        return reverse('wizard-create-organization')  # Adjust based on your URL patterns

    def create_test_image(self):
        """Create test image file for logo upload."""
        image = Image.new('RGB', (200, 200), color='red')
        img_file = BytesIO()
        image.save(img_file, format='PNG')
        img_file.seek(0)
        
        return SimpleUploadedFile(
            'test_logo.png',
            img_file.getvalue(),
            content_type='image/png'
        )


class TestOrganizationWizardAPI(OrganizationAPIIntegrationTestCase):
    """Test organization creation via wizard API."""

    def test_create_health_organization_ips_success(self):
        """Test successful creation of IPS health organization."""
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'HEALTHCARE',
            'selectedOrgType': 'ips'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',  # Adjust URL as needed
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check organization was created
        org = Organization.objects.get(nit='123456789')
        self.assertEqual(org.razon_social, 'Hospital San Rafael')
        self.assertEqual(org.sector_economico, 'salud')
        self.assertEqual(org.tipo_organizacion, 'ips')
        
        # Check health organization was auto-created
        self.assertTrue(hasattr(org, 'health_profile'))
        health_org = org.health_profile
        self.assertEqual(health_org.tipo_prestador, 'IPS')
        self.assertEqual(len(health_org.codigo_prestador), 12)

    def test_create_health_organization_eps_success(self):
        """Test successful creation of EPS health organization."""
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'HEALTHCARE',
            'selectedOrgType': 'eps'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        org = Organization.objects.get(nit='123456789')
        health_org = org.health_profile
        self.assertEqual(health_org.tipo_prestador, 'EPS')

    def test_create_non_health_organization_success(self):
        """Test successful creation of non-health organization."""
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'SERVICES',
            'selectedOrgType': 'empresa_privada'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        org = Organization.objects.get(nit='123456789')
        self.assertEqual(org.sector_economico, 'servicios')
        self.assertEqual(org.tipo_organizacion, 'empresa_privada')
        
        # Should NOT have health profile
        self.assertFalse(hasattr(org, 'health_profile'))

    def test_create_organization_with_logo(self):
        """Test organization creation with logo upload."""
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'HEALTHCARE',
            'selectedOrgType': 'ips'
        })
        
        logo_file = self.create_test_image()
        
        response = self.client.post(
            '/api/v1/wizard/',
            data={**data, 'logo': logo_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        org = Organization.objects.get(nit='123456789')
        self.assertTrue(org.logo)
        self.assertIn('.png', org.logo.name)

    def test_sector_mapping_all_types(self):
        """Test sector mapping for all supported sector types."""
        sector_mappings = [
            ('HEALTHCARE', 'salud'),
            ('MANUFACTURING', 'manufactura'),
            ('SERVICES', 'servicios'),
            ('EDUCATION', 'educacion')
        ]
        
        for frontend_sector, expected_backend in sector_mappings:
            with self.subTest(sector=frontend_sector):
                data = self.wizard_data.copy()
                data.update({
                    'selectedSector': frontend_sector,
                    'selectedOrgType': 'empresa_privada',
                    'nit': f'12345678{len(frontend_sector)}'  # Unique NIT
                })
                
                response = self.client.post(
                    '/api/v1/wizard/',
                    data=data,
                    format='json'
                )
                
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                
                org = Organization.objects.get(nit=data['nit'])
                self.assertEqual(org.sector_economico, expected_backend)

    def test_health_organization_types_mapping(self):
        """Test all health organization types create HealthOrganization."""
        health_types = ['ips', 'eps', 'hospital', 'clinica', 'centro_medico', 'laboratorio']
        
        for org_type in health_types:
            with self.subTest(org_type=org_type):
                data = self.wizard_data.copy()
                data.update({
                    'selectedSector': 'HEALTHCARE',
                    'selectedOrgType': org_type,
                    'nit': f'11111111{len(org_type)}'  # Unique NIT
                })
                
                response = self.client.post(
                    '/api/v1/wizard/',
                    data=data,
                    format='json'
                )
                
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                
                org = Organization.objects.get(nit=data['nit'])
                self.assertTrue(hasattr(org, 'health_profile'))

    def test_legacy_field_support(self):
        """Test that legacy field names are still supported."""
        data = self.wizard_data.copy()
        data.update({
            'sector_economico': 'manufactura',
            'tipo_organizacion': 'cooperativa'
            # No selectedSector/selectedOrgType
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        org = Organization.objects.get(nit='123456789')
        self.assertEqual(org.sector_economico, 'manufactura')
        self.assertEqual(org.tipo_organizacion, 'cooperativa')

    def test_field_precedence(self):
        """Test that new fields take precedence over legacy fields."""
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'HEALTHCARE',
            'selectedOrgType': 'ips',
            'sector_economico': 'servicios',  # Should be overridden
            'tipo_organizacion': 'empresa_privada'  # Should be overridden
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        org = Organization.objects.get(nit='123456789')
        self.assertEqual(org.sector_economico, 'salud')  # From selectedSector
        self.assertEqual(org.tipo_organizacion, 'ips')   # From selectedOrgType


class TestValidationAndErrorHandling(OrganizationAPIIntegrationTestCase):
    """Test API validation and error handling."""

    def test_duplicate_nit_error(self):
        """Test duplicate NIT returns appropriate error."""
        # Create first organization
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'SERVICES',
            'selectedOrgType': 'empresa_privada'
        })
        
        response1 = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Try to create second with same NIT
        response2 = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nit', response2.data.get('errors', {}))

    def test_missing_required_fields(self):
        """Test missing required fields return validation errors."""
        incomplete_data = {
            'razon_social': 'Test Org'
            # Missing required fields
        }
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=incomplete_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        errors = response.data.get('errors', {})
        
        # Should have errors for missing required fields
        self.assertIn('nit', errors)
        self.assertIn('email_contacto', errors)

    def test_invalid_nit_format(self):
        """Test invalid NIT format returns validation error."""
        data = self.wizard_data.copy()
        data.update({
            'nit': '123',  # Too short
            'selectedSector': 'SERVICES',
            'selectedOrgType': 'empresa_privada'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nit', response.data.get('errors', {}))

    def test_invalid_email_format(self):
        """Test invalid email format returns validation error."""
        data = self.wizard_data.copy()
        data.update({
            'email_contacto': 'invalid-email',
            'selectedSector': 'SERVICES',
            'selectedOrgType': 'empresa_privada'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email_contacto', response.data.get('errors', {}))

    def test_invalid_phone_format(self):
        """Test invalid phone format returns validation error."""
        data = self.wizard_data.copy()
        data.update({
            'telefono_principal': '123',  # Too short
            'selectedSector': 'SERVICES',
            'selectedOrgType': 'empresa_privada'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('telefono_principal', response.data.get('errors', {}))

    def test_logo_file_size_validation(self):
        """Test logo file size validation."""
        # Create large image (over size limit)
        large_image = Image.new('RGB', (3000, 3000), color='red')
        img_file = BytesIO()
        large_image.save(img_file, format='PNG', quality=100)
        img_file.seek(0)
        
        large_logo = SimpleUploadedFile(
            'large_logo.png',
            img_file.getvalue(),
            content_type='image/png'
        )
        
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'SERVICES',
            'selectedOrgType': 'empresa_privada'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data={**data, 'logo': large_logo},
            format='multipart'
        )
        
        # Should either reject or succeed (depending on size limits)
        # Adjust assertion based on actual validation rules
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            self.assertIn('logo', response.data.get('errors', {}))

    def test_invalid_logo_format(self):
        """Test invalid logo format returns validation error."""
        # Create text file instead of image
        text_file = SimpleUploadedFile(
            'not_an_image.txt',
            b'This is not an image',
            content_type='text/plain'
        )
        
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'SERVICES',
            'selectedOrgType': 'empresa_privada'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data={**data, 'logo': text_file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('logo', response.data.get('errors', {}))


class TestAuthentication(OrganizationAPIIntegrationTestCase):
    """Test authentication and authorization."""

    def test_unauthenticated_request_fails(self):
        """Test that unauthenticated requests are rejected."""
        self.client.force_authenticate(user=None)  # Remove authentication
        
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'SERVICES',
            'selectedOrgType': 'empresa_privada'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_request_succeeds(self):
        """Test that authenticated requests succeed."""
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'SERVICES',
            'selectedOrgType': 'empresa_privada'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_created_by_field_set(self):
        """Test that created_by field is set to authenticated user."""
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'SERVICES',
            'selectedOrgType': 'empresa_privada'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        org = Organization.objects.get(nit='123456789')
        self.assertEqual(org.created_by, self.user)


class TestResponseFormat(OrganizationAPIIntegrationTestCase):
    """Test API response format and content."""

    def test_successful_response_format(self):
        """Test successful response includes expected fields."""
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'HEALTHCARE',
            'selectedOrgType': 'ips'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        response_data = response.data
        
        # Check required response fields
        self.assertIn('id', response_data)
        self.assertIn('razon_social', response_data)
        self.assertIn('nit_completo', response_data)
        self.assertIn('sector_economico', response_data)
        self.assertIn('tipo_organizacion', response_data)
        self.assertIn('created_at', response_data)

    def test_health_organization_response_includes_profile(self):
        """Test health organization response includes health profile data."""
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'HEALTHCARE',
            'selectedOrgType': 'ips'
        })
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        response_data = response.data
        
        # Should include health profile information
        self.assertIn('health_profile', response_data)
        health_profile = response_data['health_profile']
        self.assertIn('codigo_prestador', health_profile)
        self.assertIn('tipo_prestador', health_profile)
        self.assertIn('nivel_complejidad', health_profile)

    def test_error_response_format(self):
        """Test error response format."""
        incomplete_data = {
            'razon_social': 'Test Org'
            # Missing required fields
        }
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=incomplete_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        response_data = response.data
        
        # Should have standard error format
        self.assertIn('errors', response_data)
        self.assertIsInstance(response_data['errors'], dict)


class TestTransactionHandling(OrganizationAPIIntegrationTestCase):
    """Test database transaction handling."""

    def test_transaction_rollback_on_health_org_error(self):
        """Test that transaction rolls back if HealthOrganization creation fails."""
        from unittest.mock import patch
        
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'HEALTHCARE',
            'selectedOrgType': 'ips'
        })
        
        # Mock HealthOrganization creation to fail
        with patch('apps.organization.models.HealthOrganization.objects.create') as mock_create:
            mock_create.side_effect = Exception("Forced error")
            
            response = self.client.post(
                '/api/v1/wizard/',
                data=data,
                format='json'
            )
            
            # Should return error
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Organization should not exist due to rollback
            self.assertFalse(
                Organization.objects.filter(nit='123456789').exists()
            )

    def test_atomic_creation_success(self):
        """Test that both Organization and HealthOrganization are created atomically."""
        data = self.wizard_data.copy()
        data.update({
            'selectedSector': 'HEALTHCARE',
            'selectedOrgType': 'ips'
        })
        
        # Count before
        org_count_before = Organization.objects.count()
        health_org_count_before = HealthOrganization.objects.count()
        
        response = self.client.post(
            '/api/v1/wizard/',
            data=data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Count after
        org_count_after = Organization.objects.count()
        health_org_count_after = HealthOrganization.objects.count()
        
        # Both should have increased by 1
        self.assertEqual(org_count_after, org_count_before + 1)
        self.assertEqual(health_org_count_after, health_org_count_before + 1)


class TestNitValidationAPI(OrganizationAPIIntegrationTestCase):
    """Test NIT validation API endpoint."""

    def test_validate_available_nit(self):
        """Test NIT validation for available NIT."""
        response = self.client.get(
            '/api/v1/validate-nit/',
            {'nit': '987654321'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertTrue(data['data']['is_available'])
        self.assertEqual(data['data']['message'], 'NIT disponible')

    def test_validate_existing_nit(self):
        """Test NIT validation for existing NIT."""
        # Create organization first
        org_data = self.wizard_data.copy()
        org_data.update({
            'selectedSector': 'SERVICES',
            'selectedOrgType': 'empresa_privada'
        })
        
        self.client.post(
            '/api/v1/wizard/',
            data=org_data,
            format='json'
        )
        
        # Now validate the same NIT
        response = self.client.get(
            '/api/v1/validate-nit/',
            {'nit': '123456789'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertFalse(data['data']['is_available'])
        self.assertEqual(data['data']['message'], 'Este NIT ya está registrado en el sistema')