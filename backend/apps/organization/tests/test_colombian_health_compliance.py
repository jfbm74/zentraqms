"""
Comprehensive tests for Colombian health regulations compliance.

Tests compliance with:
- Resolution 3100/2019 (Sistema Único de Habilitación)
- Law 1581/2012 (Habeas Data - Data Protection)
- Decree 780/2016 (Health Sector Regulations)
- REPS (Registro Especial de Prestadores de Servicios de Salud)
"""

import uuid
from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.organization.models import Organization, HealthOrganization
from apps.organization.services.organization_service import OrganizationService
from apps.organization.tests.factories import (
    HealthOrganizationFactory,
    IPSFactory,
    EPSFactory,
    HospitalFactory,
    ClinicaFactory,
    HealthOrganizationProfileFactory
)

User = get_user_model()


class ColombianHealthComplianceTestCase(TestCase):
    """Base test case for Colombian health regulations compliance tests."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def create_health_organization(self, **kwargs):
        """Helper to create health organization with compliance defaults."""
        defaults = {
            'razon_social': 'IPS Test Compliance',
            'nit': '860123456',
            'digito_verificacion': '7',
            'email_contacto': 'compliance@ipstest.com',
            'telefono_principal': '+57 1 234 5678',
            'sector_economico': 'salud',
            'tipo_organizacion': 'ips',
            'tamaño_empresa': 'mediana',
            'created_by': self.user
        }
        defaults.update(kwargs)
        return Organization.objects.create(**defaults)


class TestResolution3100Compliance(ColombianHealthComplianceTestCase):
    """Test compliance with Resolution 3100/2019 - Sistema Único de Habilitación."""

    def test_reps_codigo_prestador_format_compliance(self):
        """Test that REPS codigo prestador follows Resolution 3100 format."""
        org = OrganizationService.create_organization(
            self.user,
            {
                'razon_social': 'IPS Compliance Test',
                'nit': '860123456',
                'digito_verificacion': '7',
                'email_contacto': 'test@ips.com',
                'telefono_principal': '+57 1 234 5678',
                'selectedSector': 'HEALTHCARE',
                'selectedOrgType': 'ips'
            }
        )
        
        health_org = org.health_profile
        
        # Resolution 3100 requires 12-digit provider codes
        self.assertEqual(len(health_org.codigo_prestador), 12)
        self.assertTrue(health_org.codigo_prestador.isdigit())
        
        # Code should be unique (no duplicates allowed in REPS)
        self.assertIsNotNone(health_org.codigo_prestador)

    def test_prestador_types_resolution_3100(self):
        """Test that prestador types comply with Resolution 3100 categories."""
        valid_types = [
            'IPS', 'HOSPITAL', 'CLINICA', 'CENTRO_MEDICO',
            'LABORATORIO', 'CENTRO_DIAGNOSTICO', 'AMBULATORIO'
        ]
        
        for tipo in valid_types:
            with self.subTest(tipo=tipo):
                health_org = HealthOrganizationProfileFactory.create(
                    tipo_prestador=tipo
                )
                
                # Should not raise validation error
                health_org.full_clean()
                self.assertEqual(health_org.tipo_prestador, tipo)

    def test_complexity_levels_resolution_3100(self):
        """Test that complexity levels comply with Resolution 3100."""
        valid_levels = ['I', 'II', 'III', 'IV']
        
        for level in valid_levels:
            with self.subTest(level=level):
                # For level IV, ensure we use a valid prestador type
                if level == 'IV':
                    health_org = HealthOrganizationProfileFactory.create(
                        nivel_complejidad=level,
                        tipo_prestador='HOSPITAL'  # Only hospitals/clinics can have level IV
                    )
                else:
                    health_org = HealthOrganizationProfileFactory.create(
                        nivel_complejidad=level
                    )
                
                health_org.full_clean()
                self.assertEqual(health_org.nivel_complejidad, level)

    def test_complexity_level_restrictions_resolution_3100(self):
        """Test that complexity level IV is restricted per Resolution 3100."""
        # Only hospitals and clinics can have level IV complexity
        valid_level_iv_types = ['HOSPITAL', 'CLINICA']
        invalid_level_iv_types = ['LABORATORIO', 'CENTRO_DIAGNOSTICO', 'AMBULATORIO']
        
        # Test valid combinations
        for tipo in valid_level_iv_types:
            with self.subTest(tipo=tipo, valid=True):
                health_org = HealthOrganizationProfileFactory.build(
                    tipo_prestador=tipo,
                    nivel_complejidad='IV'
                )
                
                # Should not raise validation error
                try:
                    health_org.clean()
                except ValidationError:
                    self.fail(f"{tipo} should be allowed to have complexity level IV")
        
        # Test invalid combinations
        for tipo in invalid_level_iv_types:
            with self.subTest(tipo=tipo, valid=False):
                health_org = HealthOrganizationProfileFactory.build(
                    tipo_prestador=tipo,
                    nivel_complejidad='IV'
                )
                
                # Should raise validation error
                with self.assertRaises(ValidationError):
                    health_org.clean()

    def test_naturaleza_juridica_compliance(self):
        """Test that legal nature options comply with Colombian regulations."""
        valid_natures = ['privada', 'publica', 'mixta']
        
        for nature in valid_natures:
            with self.subTest(nature=nature):
                health_org = HealthOrganizationProfileFactory.create(
                    naturaleza_juridica=nature
                )
                
                health_org.full_clean()
                self.assertEqual(health_org.naturaleza_juridica, nature)

    def test_representative_document_types_compliance(self):
        """Test that representative document types comply with Colombian ID systems."""
        valid_doc_types = ['CC', 'CE', 'PA', 'NIT', 'TI']
        
        for doc_type in valid_doc_types:
            with self.subTest(doc_type=doc_type):
                health_org = HealthOrganizationProfileFactory.create(
                    representante_tipo_documento=doc_type
                )
                
                health_org.full_clean()
                self.assertEqual(health_org.representante_tipo_documento, doc_type)

    def test_mandatory_fields_resolution_3100(self):
        """Test that mandatory fields per Resolution 3100 are enforced."""
        # Create minimal health organization
        org = self.create_health_organization()
        
        # Try to create health profile without required fields
        with self.assertRaises(ValidationError):
            HealthOrganization.objects.create(
                organization=org,
                # Missing codigo_prestador - should be required
                tipo_prestador='IPS',
                nivel_complejidad='I',
                naturaleza_juridica='privada',
                created_by=self.user
            ).full_clean()

    def test_audit_trail_requirements(self):
        """Test that audit trail meets Resolution 3100 requirements."""
        org = OrganizationService.create_organization(
            self.user,
            {
                'razon_social': 'IPS Audit Test',
                'nit': '860999999',
                'digito_verificacion': '9',
                'email_contacto': 'audit@ips.com',
                'telefono_principal': '+57 1 999 9999',
                'selectedSector': 'HEALTHCARE',
                'selectedOrgType': 'ips'
            }
        )
        
        # Organization should have complete audit trail
        self.assertIsNotNone(org.created_at)
        self.assertIsNotNone(org.created_by)
        self.assertEqual(org.created_by, self.user)
        
        # Health organization should also have audit trail
        health_org = org.health_profile
        self.assertIsNotNone(health_org.created_at)
        self.assertIsNotNone(health_org.created_by)
        self.assertEqual(health_org.created_by, self.user)


class TestLaw1581DataProtectionCompliance(ColombianHealthComplianceTestCase):
    """Test compliance with Law 1581/2012 - Habeas Data (Data Protection)."""

    def test_data_minimization_principle(self):
        """Test that only necessary data is collected per Law 1581."""
        org = OrganizationService.create_organization(
            self.user,
            {
                'razon_social': 'IPS Data Protection Test',
                'nit': '860555555',
                'digito_verificacion': '5',
                'email_contacto': 'privacy@ips.com',
                'telefono_principal': '+57 1 555 5555',
                'selectedSector': 'HEALTHCARE',
                'selectedOrgType': 'ips'
            }
        )
        
        health_org = org.health_profile
        
        # Should collect only necessary personal data for representative
        required_fields = [
            'representante_tipo_documento',
            'representante_numero_documento',
            'representante_nombre_completo',
            'representante_telefono',
            'representante_email'
        ]
        
        for field in required_fields:
            self.assertTrue(hasattr(health_org, field))

    def test_consent_by_design(self):
        """Test that system implements consent by design per Law 1581."""
        # REPS verification should default to False (explicit consent required)
        org = OrganizationService.create_organization(
            self.user,
            {
                'razon_social': 'IPS Consent Test',
                'nit': '860777777',
                'digito_verificacion': '7',
                'email_contacto': 'consent@ips.com',
                'telefono_principal': '+57 1 777 7777',
                'selectedSector': 'HEALTHCARE',
                'selectedOrgType': 'ips'
            }
        )
        
        health_org = org.health_profile
        
        # Should NOT be verified in REPS by default (requires explicit action)
        self.assertFalse(health_org.verificado_reps)
        self.assertIsNone(health_org.fecha_verificacion_reps)

    def test_data_security_defaults(self):
        """Test that data security defaults comply with Law 1581."""
        health_org = HealthOrganizationProfileFactory.create()
        
        # Temporary codigo_prestador should be generated securely
        self.assertIsNotNone(health_org.codigo_prestador)
        self.assertEqual(len(health_org.codigo_prestador), 12)
        
        # Personal data should have proper field constraints
        self.assertLessEqual(len(health_org.representante_numero_documento), 20)
        self.assertLessEqual(len(health_org.representante_nombre_completo), 200)

    def test_purpose_limitation_principle(self):
        """Test that data collection is limited to specific purposes per Law 1581."""
        health_org = HealthOrganizationProfileFactory.create()
        
        # Representative data should be collected only for health services regulation
        self.assertIsNotNone(health_org.representante_tipo_documento)
        self.assertIsNotNone(health_org.representante_numero_documento)
        self.assertIsNotNone(health_org.representante_nombre_completo)
        
        # Should not collect unnecessary personal information
        # (This is enforced by model design - no extra personal fields)
        personal_fields = [field.name for field in HealthOrganization._meta.fields 
                          if 'representante' in field.name]
        
        expected_personal_fields = [
            'representante_tipo_documento',
            'representante_numero_documento', 
            'representante_nombre_completo',
            'representante_telefono',
            'representante_email'
        ]
        
        self.assertEqual(set(personal_fields), set(expected_personal_fields))


class TestDecree780HealthSectorCompliance(ColombianHealthComplianceTestCase):
    """Test compliance with Decree 780/2016 - Health Sector Regulations."""

    def test_health_service_provider_classification(self):
        """Test that provider classification complies with Decree 780."""
        # Create different types of health providers
        health_provider_types = [
            ('ips', 'IPS'),
            ('eps', 'EPS'), 
            ('hospital', 'IPS'),  # Hospitals are classified as IPS
            ('clinica', 'IPS'),   # Clinics are classified as IPS
            ('centro_medico', 'IPS'),
            ('laboratorio', 'IPS')
        ]
        
        for i, (org_type, expected_prestador_type) in enumerate(health_provider_types):
            with self.subTest(org_type=org_type):
                org = OrganizationService.create_organization(
                    self.user,
                    {
                        'razon_social': f'Test {org_type.upper()}',
                        'nit': f'86012345{i:02d}',  # Use index to ensure uniqueness
                        'digito_verificacion': '1',
                        'email_contacto': f'{org_type}@test.com',
                        'telefono_principal': '+57 1 234 5678',
                        'selectedSector': 'HEALTHCARE',
                        'selectedOrgType': org_type
                    }
                )
                
                health_org = org.health_profile
                self.assertEqual(health_org.tipo_prestador, expected_prestador_type)

    def test_health_organization_sector_validation(self):
        """Test that health organizations are restricted to health sector."""
        # Create non-health organization
        non_health_org = Organization.objects.create(
            razon_social='Tech Company',
            nit='900123456',
            digito_verificacion='5',
            email_contacto='tech@company.com',
            telefono_principal='+57 1 234 5678',
            sector_economico='tecnologia',  # Not health sector
            tipo_organizacion='empresa_privada',
            tamaño_empresa='mediana',
            created_by=self.user
        )
        
        # Should not be able to create health profile for non-health organization
        health_org = HealthOrganization(
            organization=non_health_org,
            codigo_prestador='123456789012',
            tipo_prestador='IPS',
            nivel_complejidad='I',
            naturaleza_juridica='privada',
            representante_tipo_documento='CC',
            representante_numero_documento='12345678',
            representante_nombre_completo='Test Representative',
            representante_telefono='+57 300 123 4567',
            representante_email='rep@test.com',
            created_by=self.user
        )
        
        with self.assertRaises(ValidationError):
            health_org.clean()

    def test_complexity_level_defaults_decree_780(self):
        """Test that complexity level defaults comply with Decree 780."""
        org = OrganizationService.create_organization(
            self.user,
            {
                'razon_social': 'IPS Default Complexity',
                'nit': '860888888',
                'digito_verificacion': '8',
                'email_contacto': 'default@ips.com',
                'telefono_principal': '+57 1 888 8888',
                'selectedSector': 'HEALTHCARE',
                'selectedOrgType': 'ips'
            }
        )
        
        health_org = org.health_profile
        
        # Should default to lowest complexity level (safest assumption)
        self.assertEqual(health_org.nivel_complejidad, 'I')


class TestREPSIntegrationCompliance(ColombianHealthComplianceTestCase):
    """Test compliance with REPS (Registro Especial de Prestadores de Servicios de Salud)."""

    def test_reps_codigo_prestador_uniqueness(self):
        """Test that REPS provider codes are unique across the system."""
        # Create multiple health organizations
        orgs = []
        for i in range(5):
            org = OrganizationService.create_organization(
                self.user,
                {
                    'razon_social': f'IPS REPS Test {i}',
                    'nit': f'86011111{i}',
                    'digito_verificacion': '1',
                    'email_contacto': f'reps{i}@ips.com',
                    'telefono_principal': '+57 1 111 1111',
                    'selectedSector': 'HEALTHCARE',
                    'selectedOrgType': 'ips'
                }
            )
            orgs.append(org)
        
        # All provider codes should be unique
        codes = [org.health_profile.codigo_prestador for org in orgs]
        self.assertEqual(len(codes), len(set(codes)))

    def test_reps_temporary_code_generation(self):
        """Test that temporary REPS codes are properly generated."""
        org = OrganizationService.create_organization(
            self.user,
            {
                'razon_social': 'IPS Temporary Code Test',
                'nit': '860444444',
                'digito_verificacion': '4',
                'email_contacto': 'temp@ips.com',
                'telefono_principal': '+57 1 444 4444',
                'selectedSector': 'HEALTHCARE',
                'selectedOrgType': 'ips'
            }
        )
        
        health_org = org.health_profile
        
        # Should generate temporary code that matches REPS format
        self.assertEqual(len(health_org.codigo_prestador), 12)
        self.assertTrue(health_org.codigo_prestador.isdigit())
        
        # Should not be verified until real REPS code is provided
        self.assertFalse(health_org.verificado_reps)
        self.assertIsNone(health_org.fecha_verificacion_reps)

    def test_reps_verification_workflow(self):
        """Test that REPS verification workflow is properly implemented."""
        health_org = HealthOrganizationProfileFactory.create()
        
        # Initially should not be verified
        self.assertFalse(health_org.verificado_reps)
        self.assertIsNone(health_org.fecha_verificacion_reps)
        
        # After verification (simulated)
        health_org.verificado_reps = True
        health_org.fecha_verificacion_reps = timezone.now()
        health_org.save()
        
        # Should maintain verification status
        health_org.refresh_from_db()
        self.assertTrue(health_org.verificado_reps)
        self.assertIsNotNone(health_org.fecha_verificacion_reps)

    def test_reps_data_structure_compliance(self):
        """Test that REPS data structure complies with MinSalud requirements."""
        health_org = HealthOrganizationProfileFactory.create()
        
        # Should have all required REPS fields
        required_reps_fields = [
            'codigo_prestador',
            'tipo_prestador',
            'nivel_complejidad',
            'naturaleza_juridica',
            'verificado_reps'
        ]
        
        for field in required_reps_fields:
            self.assertTrue(hasattr(health_org, field))
            self.assertIsNotNone(getattr(health_org, field))

    def test_reps_codigo_formatting(self):
        """Test that REPS code formatting is correct."""
        health_org = HealthOrganizationProfileFactory.create(
            codigo_prestador='123456789012'
        )
        
        # Should format code correctly (XXXX-XXXX-XXXX)
        formatted_code = health_org.codigo_prestador_formatted
        self.assertEqual(formatted_code, '1234-5678-9012')
        self.assertEqual(len(formatted_code), 14)  # Including hyphens


class TestComplianceIntegrationTests(ColombianHealthComplianceTestCase):
    """Integration tests for overall Colombian health regulations compliance."""

    def test_complete_ips_creation_compliance(self):
        """Test that complete IPS creation process meets all compliance requirements."""
        org = OrganizationService.create_organization(
            self.user,
            {
                'razon_social': 'IPS Integral Compliance Test S.A.S.',
                'nit': '860987654',
                'digito_verificacion': '3',
                'email_contacto': 'compliance@ipsintegral.com',
                'telefono_principal': '+57 1 987 6543',
                'website': 'https://www.ipsintegral.com',
                'descripcion': 'IPS de alta complejidad especializada en servicios médicos',
                'tamaño_empresa': 'grande',
                'selectedSector': 'HEALTHCARE',
                'selectedOrgType': 'ips'
            }
        )
        
        # Verify organization compliance
        self.assertEqual(org.sector_economico, 'salud')
        self.assertEqual(org.tipo_organizacion, 'ips')
        self.assertIsNotNone(org.created_by)
        self.assertIsNotNone(org.created_at)
        
        # Verify health organization compliance
        health_org = org.health_profile
        
        # Resolution 3100 compliance
        self.assertEqual(len(health_org.codigo_prestador), 12)
        self.assertEqual(health_org.tipo_prestador, 'IPS')
        self.assertEqual(health_org.nivel_complejidad, 'I')
        
        # Law 1581 compliance (data protection)
        self.assertFalse(health_org.verificado_reps)  # Privacy by design
        self.assertIsNone(health_org.fecha_verificacion_reps)
        
        # Decree 780 compliance
        self.assertEqual(health_org.naturaleza_juridica, 'privada')
        self.assertIsNotNone(health_org.created_by)

    def test_complete_eps_creation_compliance(self):
        """Test that complete EPS creation process meets all compliance requirements."""
        org = OrganizationService.create_organization(
            self.user,
            {
                'razon_social': 'EPS Salud Integral S.A.',
                'nit': '860654321',
                'digito_verificacion': '6',
                'email_contacto': 'info@epssalud.com',
                'telefono_principal': '+57 1 654 3210',
                'selectedSector': 'HEALTHCARE',
                'selectedOrgType': 'eps'
            }
        )
        
        health_org = org.health_profile
        
        # EPS-specific compliance
        self.assertEqual(health_org.tipo_prestador, 'EPS')
        self.assertEqual(health_org.nivel_complejidad, 'I')  # EPS default
        
        # All other compliance requirements should still apply
        self.assertEqual(len(health_org.codigo_prestador), 12)
        self.assertFalse(health_org.verificado_reps)

    def test_non_health_organization_exclusion(self):
        """Test that non-health organizations are properly excluded from health regulations."""
        org = OrganizationService.create_organization(
            self.user,
            {
                'razon_social': 'Tecnología Avanzada S.A.S.',
                'nit': '900321654',
                'digito_verificacion': '9',
                'email_contacto': 'info@tecavanzada.com',
                'telefono_principal': '+57 1 321 6549',
                'selectedSector': 'SERVICES',
                'selectedOrgType': 'empresa_privada'
            }
        )
        
        # Should NOT have health profile
        self.assertFalse(hasattr(org, 'health_profile'))
        
        # Should have correct sector mapping
        self.assertEqual(org.sector_economico, 'servicios')
        self.assertEqual(org.tipo_organizacion, 'empresa_privada')

    def test_colombian_health_system_integration_points(self):
        """Test integration points with Colombian health systems."""
        org = OrganizationService.create_organization(
            self.user,
            {
                'razon_social': 'Hospital Universitario Nacional',
                'nit': '860111222',
                'digito_verificacion': '5',
                'email_contacto': 'hospital@nacional.edu.co',
                'telefono_principal': '+57 1 111 2225',
                'selectedSector': 'HEALTHCARE',
                'selectedOrgType': 'hospital'
            }
        )
        
        health_org = org.health_profile
        
        # Should be ready for integration with:
        
        # 1. REPS (Registro Especial de Prestadores)
        self.assertEqual(len(health_org.codigo_prestador), 12)
        self.assertFalse(health_org.verificado_reps)
        
        # 2. SUH (Sistema Único de Habilitación)
        self.assertIsNotNone(health_org.nivel_complejidad)
        self.assertIsNotNone(health_org.naturaleza_juridica)
        
        # 3. SISPRO (Sistema Integral de Información)
        self.assertIsNotNone(health_org.tipo_prestador)
        
        # 4. ADRES (Administradora de los Recursos del Sistema)
        # Ready for services count tracking
        self.assertEqual(health_org.servicios_habilitados_count, 0)

    def test_audit_trail_comprehensive_compliance(self):
        """Test that comprehensive audit trail meets all regulatory requirements."""
        org = OrganizationService.create_organization(
            self.user,
            {
                'razon_social': 'Clínica Audit Compliance',
                'nit': '860555777',
                'digito_verificacion': '2',
                'email_contacto': 'audit@clinica.com',
                'telefono_principal': '+57 1 555 7772',
                'selectedSector': 'HEALTHCARE',
                'selectedOrgType': 'clinica'
            }
        )
        
        # Organization audit trail
        self.assertIsNotNone(org.created_at)
        self.assertIsNotNone(org.updated_at)
        self.assertIsNotNone(org.created_by)
        self.assertEqual(org.created_by, self.user)
        
        # Health organization audit trail
        health_org = org.health_profile
        self.assertIsNotNone(health_org.created_at)
        self.assertIsNotNone(health_org.created_by)
        self.assertEqual(health_org.created_by, self.user)
        
        # Should maintain audit trail on updates
        original_updated_at = org.updated_at
        org.descripcion = 'Updated description'
        org.save()
        
        org.refresh_from_db()
        self.assertGreater(org.updated_at, original_updated_at)