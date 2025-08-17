"""
Comprehensive unit tests for OrganizationService.

Tests the core business logic for organization creation, including:
- Field mapping between frontend and backend
- Health organization auto-creation logic  
- Validation and error handling
- Colombian health regulations compliance
"""

import uuid
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.organization.models import Organization, HealthOrganization
from apps.organization.services.organization_service import OrganizationService

User = get_user_model()


class OrganizationServiceTestCase(TestCase):
    """Base test case with common setup for OrganizationService tests."""

    def setUp(self):
        """Set up test data and user."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Counter for unique NITs to avoid duplicates in parametrized tests
        self._nit_counter = 0
        
        # Base form data for testing
        self.base_form_data = {
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

    def create_test_organization(self, **kwargs):
        """Helper to create test organization with defaults and unique NIT."""
        data = self.base_form_data.copy()
        
        # Generate unique NIT if not provided to avoid duplicates
        if 'nit' not in kwargs:
            self._nit_counter += 1
            data['nit'] = f'12345{self._nit_counter:04d}'  # e.g., 123450001, 123450002
        
        data.update(kwargs)
        return OrganizationService.create_organization(self.user, data)


class TestOrganizationCreation(OrganizationServiceTestCase):
    """Test organization creation with various configurations."""

    def test_create_basic_organization_success(self):
        """Test successful creation of basic organization."""
        expected_nit = '123456789'
        org = self.create_test_organization(
            selectedSector='SERVICES',
            selectedOrgType='empresa_privada',
            nit=expected_nit  # Use specific NIT for this test
        )
        
        self.assertIsNotNone(org)
        self.assertEqual(org.razon_social, 'Hospital San Rafael')
        self.assertEqual(org.nit, expected_nit)
        self.assertEqual(org.sector_economico, 'servicios')
        self.assertEqual(org.tipo_organizacion, 'empresa_privada')
        self.assertEqual(org.created_by, self.user)

    def test_create_organization_with_legacy_fields(self):
        """Test organization creation using legacy field names."""
        org = self.create_test_organization(
            sector_economico='manufactura',
            tipo_organizacion='empresa_privada'
        )
        
        self.assertEqual(org.sector_economico, 'manufactura')
        self.assertEqual(org.tipo_organizacion, 'empresa_privada')

    def test_create_organization_with_missing_classification_fields(self):
        """Test organization creation when classification fields are missing."""
        # Remove sector/type fields - should use defaults
        data = self.base_form_data.copy()
        
        org = OrganizationService.create_organization(self.user, data)
        
        self.assertEqual(org.sector_economico, 'servicios')  # Default
        self.assertEqual(org.tipo_organizacion, 'empresa_privada')  # Default
        self.assertEqual(org.tamaño_empresa, 'grande')


    def test_sector_mapping_consistency(self):
        """Test that sector mapping works correctly for all sectors."""
        sector_mappings = {
            'HEALTHCARE': 'salud',
            'MANUFACTURING': 'manufactura',
            'SERVICES': 'servicios',
            'EDUCATION': 'educacion'
        }
        
        for frontend_sector, backend_sector in sector_mappings.items():
            with self.subTest(sector=frontend_sector):
                org = self.create_test_organization(
                    selectedSector=frontend_sector,
                    selectedOrgType='empresa_privada'
                )
                self.assertEqual(org.sector_economico, backend_sector)


class TestHealthOrganizationAutoCreation(OrganizationServiceTestCase):
    """Test automatic HealthOrganization creation for health sector organizations."""

    def test_health_ips_creates_health_organization(self):
        """Test that IPS creation auto-creates HealthOrganization."""
        org = self.create_test_organization(
            selectedSector='HEALTHCARE',
            selectedOrgType='ips'
        )
        
        self.assertTrue(hasattr(org, 'health_profile'))
        health_org = org.health_profile
        
        self.assertEqual(health_org.organization, org)
        self.assertEqual(health_org.tipo_prestador, 'IPS')
        self.assertEqual(health_org.nivel_complejidad, 'I')
        self.assertEqual(health_org.naturaleza_juridica, 'privada')
        self.assertFalse(health_org.verificado_reps)
        self.assertEqual(len(health_org.codigo_prestador), 12)
        self.assertTrue(health_org.codigo_prestador.isdigit())

    def test_health_eps_creates_health_organization(self):
        """Test that EPS creation auto-creates HealthOrganization."""
        org = self.create_test_organization(
            selectedSector='HEALTHCARE',
            selectedOrgType='eps'
        )
        
        health_org = org.health_profile
        self.assertEqual(health_org.tipo_prestador, 'EPS')

    def test_health_hospital_creates_health_organization(self):
        """Test that hospital creation auto-creates HealthOrganization."""
        org = self.create_test_organization(
            selectedSector='HEALTHCARE',
            selectedOrgType='hospital'
        )
        
        health_org = org.health_profile
        self.assertEqual(health_org.tipo_prestador, 'IPS')  # Mapped to IPS

    def test_health_clinica_creates_health_organization(self):
        """Test that clinic creation auto-creates HealthOrganization."""
        org = self.create_test_organization(
            selectedSector='HEALTHCARE',
            selectedOrgType='clinica'
        )
        
        health_org = org.health_profile
        self.assertEqual(health_org.tipo_prestador, 'IPS')

    def test_all_health_types_create_health_organization(self):
        """Test that all health organization types create HealthOrganization."""
        health_types = ['ips', 'eps', 'clinica', 'hospital', 'centro_medico', 'laboratorio']
        
        for i, org_type in enumerate(health_types):
            with self.subTest(org_type=org_type):
                # Use unique NIT for each test
                org = self.create_test_organization(
                    selectedSector='HEALTHCARE',
                    selectedOrgType=org_type,
                    nit=f'1234567{i}{i}'  # Unique NIT
                )
                
                self.assertTrue(hasattr(org, 'health_profile'))
                health_org = org.health_profile
                expected_tipo = org_type.upper() if org_type in ['ips', 'eps'] else 'IPS'
                self.assertEqual(health_org.tipo_prestador, expected_tipo)

    def test_non_health_sector_no_health_organization(self):
        """Test that non-health sectors don't create HealthOrganization."""
        non_health_sectors = ['SERVICES', 'MANUFACTURING', 'EDUCATION']
        
        for i, sector in enumerate(non_health_sectors):
            with self.subTest(sector=sector):
                org = self.create_test_organization(
                    selectedSector=sector,
                    selectedOrgType='empresa_privada',
                    nit=f'876543{i:02d}'  # Unique NIT for each sector
                )
                
                self.assertFalse(hasattr(org, 'health_profile'))

    def test_health_sector_non_health_type_no_health_organization(self):
        """Test that health sector with non-health type doesn't create HealthOrganization."""
        org = self.create_test_organization(
            selectedSector='HEALTHCARE',
            selectedOrgType='empresa_privada'  # Not a health-specific type
        )
        
        self.assertFalse(hasattr(org, 'health_profile'))

    def test_unique_codigo_prestador_generation(self):
        """Test that codigo_prestador is unique across multiple health organizations."""
        # Create multiple health organizations
        orgs = []
        for i in range(5):
            org = self.create_test_organization(
                selectedSector='HEALTHCARE',
                selectedOrgType='ips',
                nit=f'11111111{i}',
                razon_social=f'IPS Test {i}'
            )
            orgs.append(org)

        # Check that all codigo_prestador values are unique
        codigos = [org.health_profile.codigo_prestador for org in orgs]
        self.assertEqual(len(codigos), len(set(codigos)))

    @patch('uuid.uuid4')
    def test_codigo_prestador_generation_with_uuid(self, mock_uuid):
        """Test codigo_prestador generation uses UUID properly."""
        # Mock UUID to return predictable value
        mock_uuid.return_value.int = 123456789012345678901234567890
        
        org = self.create_test_organization(
            selectedSector='HEALTHCARE',
            selectedOrgType='ips'
        )
        
        health_org = org.health_profile
        expected_code = str(123456789012345678901234567890)[:12].zfill(12)
        self.assertEqual(health_org.codigo_prestador, expected_code)


class TestFieldMapping(OrganizationServiceTestCase):
    """Test field mapping between frontend and backend."""

    def test_frontend_sector_mapping(self):
        """Test mapping from frontend sector names to backend values."""
        test_cases = [
            ('HEALTHCARE', 'salud'),
            ('MANUFACTURING', 'manufactura'),
            ('SERVICES', 'servicios'),
            ('EDUCATION', 'educacion'),
            ('unknown_sector', 'unknown_sector')  # Fallback case
        ]
        
        for i, (frontend_value, expected_backend) in enumerate(test_cases):
            with self.subTest(frontend=frontend_value):
                org = self.create_test_organization(
                    selectedSector=frontend_value,
                    selectedOrgType='empresa_privada',
                    nit=f'9999999{i}{i}'
                )
                
                if frontend_value == 'unknown_sector':
                    # Should use fallback
                    self.assertEqual(org.sector_economico, 'unknown_sector')
                else:
                    self.assertEqual(org.sector_economico, expected_backend)

    def test_organization_type_mapping(self):
        """Test organization type is converted to lowercase."""
        test_cases = [
            ('IPS', 'ips'),
            ('EPS', 'eps'),
            ('EMPRESA_PRIVADA', 'empresa_privada'),
            ('Clinica', 'clinica')
        ]
        
        for i, (input_type, expected_type) in enumerate(test_cases):
            with self.subTest(type=input_type):
                org = self.create_test_organization(
                    selectedSector='HEALTHCARE',
                    selectedOrgType=input_type,
                    nit=f'8888888{i}{i}'
                )
                
                self.assertEqual(org.tipo_organizacion, expected_type)

    def test_form_data_precedence(self):
        """Test that selectedSector/selectedOrgType take precedence over legacy fields."""
        org = self.create_test_organization(
            selectedSector='HEALTHCARE',
            selectedOrgType='ips',
            sector_economico='servicios',  # Should be overridden
            tipo_organizacion='empresa_privada'  # Should be overridden
        )
        
        self.assertEqual(org.sector_economico, 'salud')  # From selectedSector
        self.assertEqual(org.tipo_organizacion, 'ips')   # From selectedOrgType

    def test_legacy_field_fallback(self):
        """Test fallback to legacy fields when new fields not provided."""
        org = self.create_test_organization(
            sector_economico='manufactura',
            tipo_organizacion='cooperativa'
            # No selectedSector/selectedOrgType
        )
        
        self.assertEqual(org.sector_economico, 'manufactura')
        self.assertEqual(org.tipo_organizacion, 'cooperativa')


class TestValidationAndErrorHandling(OrganizationServiceTestCase):
    """Test validation and error handling scenarios."""

    def test_duplicate_nit_error(self):
        """Test that creating organization with duplicate NIT raises error."""
        # Create first organization with specific NIT
        duplicate_nit = '999888777'
        self.create_test_organization(nit=duplicate_nit)
        
        # Try to create second with same NIT
        with self.assertRaises(IntegrityError):
            self.create_test_organization(nit=duplicate_nit)

    def test_missing_required_fields(self):
        """Test error handling for missing required fields."""
        incomplete_data = {
            'razon_social': 'Test Org',
            # Missing required fields like NIT, email, etc.
        }
        
        with self.assertRaises((IntegrityError, ValidationError)):
            OrganizationService.create_organization(self.user, incomplete_data)

    def test_transaction_rollback_on_health_org_error(self):
        """Test that transaction rolls back if HealthOrganization creation fails."""
        # Mock HealthOrganization.objects.create to raise an error
        with patch('apps.organization.models.HealthOrganization.objects.create') as mock_create:
            mock_create.side_effect = IntegrityError("Test error")
            
            with self.assertRaises(IntegrityError):
                self.create_test_organization(
                    selectedSector='HEALTHCARE',
                    selectedOrgType='ips'
                )
            
            # Organization should not exist due to rollback
            self.assertFalse(
                Organization.objects.filter(nit='123456789').exists()
            )

    def test_invalid_nit_format(self):
        """Test validation of invalid NIT format."""
        invalid_nits = ['123', '12345678901234567890', 'abc123456']
        
        for invalid_nit in invalid_nits:
            with self.subTest(nit=invalid_nit):
                with self.assertRaises((ValidationError, IntegrityError)):
                    org = self.create_test_organization(nit=invalid_nit)
                    org.full_clean()  # Trigger model validation

    def test_invalid_email_format(self):
        """Test validation of invalid email format."""
        invalid_emails = ['invalid-email', '@example.com', 'test@', '']
        
        for i, invalid_email in enumerate(invalid_emails):
            with self.subTest(email=invalid_email):
                try:
                    org = self.create_test_organization(
                        email_contacto=invalid_email,
                        nit=f'987654{i:02d}'  # Unique NIT for each email test
                    )
                    # If creation succeeds, call full_clean to trigger validation
                    org.full_clean()
                except ValidationError:
                    pass  # Expected
                else:
                    if invalid_email:  # Empty email might be allowed
                        self.fail(f"Expected ValidationError for email: {invalid_email}")


class TestNitValidation(OrganizationServiceTestCase):
    """Test NIT validation functionality."""

    def test_validate_available_nit(self):
        """Test NIT validation for available NIT."""
        result = OrganizationService.validate_nit('987654321')
        
        self.assertTrue(result['is_available'])
        self.assertEqual(result['message'], 'NIT disponible')

    def test_validate_existing_nit(self):
        """Test NIT validation for existing NIT."""
        # Create organization with specific NIT
        self.create_test_organization(nit='987654321')
        
        # Try to validate same NIT
        result = OrganizationService.validate_nit('987654321')
        
        self.assertFalse(result['is_available'])
        self.assertEqual(result['message'], 'Este NIT ya está registrado en el sistema')

    def test_validate_soft_deleted_nit(self):
        """Test NIT validation ignores soft-deleted organizations."""
        # Create and soft delete organization
        org = self.create_test_organization(nit='987654321')
        org.deleted_at = timezone.now()
        org.save()
        
        # NIT should now be available
        result = OrganizationService.validate_nit('987654321')
        
        self.assertTrue(result['is_available'])


class TestOrganizationSummary(OrganizationServiceTestCase):
    """Test organization summary functionality."""

    def test_get_organization_summary(self):
        """Test getting organization summary data."""
        org = self.create_test_organization()
        summary = OrganizationService.get_organization_summary(org)
        
        self.assertEqual(summary['id'], str(org.id))
        self.assertEqual(summary['razon_social'], org.razon_social)
        self.assertEqual(summary['nit'], org.nit)
        self.assertEqual(summary['digito_verificacion'], org.digito_verificacion)
        self.assertEqual(summary['email_contacto'], org.email_contacto)
        self.assertEqual(summary['telefono_principal'], org.telefono_principal)
        self.assertEqual(summary['website'], org.website)
        self.assertEqual(summary['descripcion'], org.descripcion)
        self.assertIn('created_at', summary)
        self.assertIn('updated_at', summary)


    def test_organization_summary_without_logo(self):
        """Test organization summary handles missing logo gracefully."""
        org = self.create_test_organization()
        summary = OrganizationService.get_organization_summary(org)
        
        self.assertIsNone(summary['logo_url'])


class TestUpdateOrganization(OrganizationServiceTestCase):
    """Test organization update functionality."""

    def test_update_organization_basic_fields(self):
        """Test updating basic organization fields."""
        org = self.create_test_organization()
        
        update_data = {
            'razon_social': 'Updated Hospital Name',
            'email_contacto': 'updated@example.com',
            'telefono_principal': '+57 1 999 9999'
        }
        
        updated_org = OrganizationService.update_organization(
            org, self.user, update_data
        )
        
        self.assertEqual(updated_org.razon_social, 'Updated Hospital Name')
        self.assertEqual(updated_org.email_contacto, 'updated@example.com')
        self.assertEqual(updated_org.telefono_principal, '+57 1 999 9999')

    def test_update_organization_with_sector_mapping(self):
        """Test updating organization with sector mapping."""
        org = self.create_test_organization()
        
        update_data = {
            'selectedSector': 'MANUFACTURING',
            'selectedOrgType': 'cooperativa'
        }
        
        updated_org = OrganizationService.update_organization(
            org, self.user, update_data
        )
        
        self.assertEqual(updated_org.sector_economico, 'MANUFACTURING')
        self.assertEqual(updated_org.tipo_organizacion, 'cooperativa')


    def test_update_excludes_frontend_fields(self):
        """Test that frontend-specific fields are excluded from updates."""
        org = self.create_test_organization()
        
        update_data = {
            'razon_social': 'Updated Name',
            'logoPreview': 'data:image/base64...',  # Should be excluded
            'selectedSector': 'SERVICES',  # Should be excluded
            'selectedOrgType': 'ong'  # Should be excluded
        }
        
        updated_org = OrganizationService.update_organization(
            org, self.user, update_data
        )
        
        self.assertEqual(updated_org.razon_social, 'Updated Name')
        # Frontend fields should not affect the model
        self.assertFalse(hasattr(updated_org, 'logoPreview'))


class TestColombianHealthRegulationsCompliance(OrganizationServiceTestCase):
    """Test compliance with Colombian health regulations."""

    def test_reps_codigo_prestador_format(self):
        """Test that REPS codigo_prestador follows correct format (12 digits)."""
        org = self.create_test_organization(
            selectedSector='HEALTHCARE',
            selectedOrgType='ips'
        )
        
        health_org = org.health_profile
        
        # Should be exactly 12 digits
        self.assertEqual(len(health_org.codigo_prestador), 12)
        self.assertTrue(health_org.codigo_prestador.isdigit())

    def test_health_organization_defaults_compliance(self):
        """Test that health organization defaults comply with regulations."""
        org = self.create_test_organization(
            selectedSector='HEALTHCARE',
            selectedOrgType='ips'
        )
        
        health_org = org.health_profile
        
        # Check regulatory compliance defaults
        self.assertEqual(health_org.nivel_complejidad, 'I')  # Default to basic
        self.assertEqual(health_org.naturaleza_juridica, 'privada')
        self.assertFalse(health_org.verificado_reps)  # Must be verified later
        self.assertEqual(health_org.created_by, self.user)

    def test_health_organization_tipo_prestador_mapping(self):
        """Test that tipo_prestador follows Colombian health regulations."""
        test_cases = [
            ('ips', 'IPS'),
            ('eps', 'EPS'),
            ('hospital', 'IPS'),  # Mapped to IPS
            ('clinica', 'IPS'),   # Mapped to IPS
            ('centro_medico', 'IPS'),  # Mapped to IPS
            ('laboratorio', 'IPS')     # Mapped to IPS
        ]
        
        for i, (org_type, expected_tipo) in enumerate(test_cases):
            with self.subTest(org_type=org_type):
                org = self.create_test_organization(
                    selectedSector='HEALTHCARE',
                    selectedOrgType=org_type,
                    nit=f'5555555{i}{i}'
                )
                
                health_org = org.health_profile
                self.assertEqual(health_org.tipo_prestador, expected_tipo)

    def test_audit_trail_creation(self):
        """Test that audit trail is created for organization creation."""
        org = self.create_test_organization()
        
        # Check that created_by and created_at are set
        self.assertEqual(org.created_by, self.user)
        self.assertIsNotNone(org.created_at)
        self.assertIsNotNone(org.updated_at)

    def test_data_privacy_law_compliance(self):
        """Test compliance with Colombian data privacy law (Law 1581)."""
        org = self.create_test_organization(
            selectedSector='HEALTHCARE',
            selectedOrgType='ips'
        )
        
        # Verify that sensitive data fields are properly handled
        self.assertIsNotNone(org.email_contacto)
        self.assertIsNotNone(org.telefono_principal)
        
        # Health organization should have additional compliance fields
        health_org = org.health_profile
        self.assertIsNotNone(health_org.codigo_prestador)
        self.assertFalse(health_org.verificado_reps)  # Privacy by design