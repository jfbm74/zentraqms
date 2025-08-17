"""
Comprehensive tests for Organization and HealthOrganization models.

Tests model validation, constraints, relationships, and business logic.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.organization.models import Organization, HealthOrganization, Location

User = get_user_model()


class OrganizationModelTestCase(TestCase):
    """Test Organization model functionality."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def create_organization(self, **kwargs):
        """Helper to create test organization."""
        defaults = {
            'razon_social': 'Test Organization',
            'nit': '123456789',
            'digito_verificacion': '1',
            'email_contacto': 'test@example.com',
            'telefono_principal': '+57 1 234 5678',
            'sector_economico': 'salud',
            'tipo_organizacion': 'ips',
            'tamaño_empresa': 'mediana',
            'created_by': self.user
        }
        defaults.update(kwargs)
        return Organization.objects.create(**defaults)

    def test_organization_creation_success(self):
        """Test successful organization creation."""
        org = self.create_organization()
        
        self.assertEqual(org.razon_social, 'Test Organization')
        self.assertEqual(org.nit, '123456789')
        self.assertEqual(org.digito_verificacion, '1')
        self.assertEqual(org.sector_economico, 'salud')
        self.assertEqual(org.tipo_organizacion, 'ips')
        self.assertEqual(org.created_by, self.user)

    def test_nit_completo_property(self):
        """Test nit_completo property returns formatted NIT."""
        org = self.create_organization(nit='123456789', digito_verificacion='7')
        
        self.assertEqual(org.nit_completo, '123456789-7')

    def test_string_representation(self):
        """Test __str__ method."""
        # With nombre_comercial
        org = self.create_organization(
            razon_social='Razón Social Test',
            nombre_comercial='Comercial Test'
        )
        self.assertEqual(str(org), 'Comercial Test')
        
        # Without nombre_comercial
        org2 = self.create_organization(razon_social='Solo Razón Social')
        self.assertEqual(str(org2), 'Solo Razón Social')

    def test_unique_nit_constraint(self):
        """Test that NIT must be unique."""
        self.create_organization(nit='123456789')
        
        with self.assertRaises(IntegrityError):
            self.create_organization(nit='123456789')

    def test_nit_format_validation(self):
        """Test NIT format validation."""
        # Valid NITs
        valid_nits = ['123456789', '12345678901', '123-456-789']
        for nit in valid_nits:
            with self.subTest(nit=nit):
                try:
                    org = self.create_organization(nit=nit)
                    org.full_clean()
                except ValidationError:
                    self.fail(f"Valid NIT {nit} should not raise ValidationError")

        # Invalid NITs
        invalid_nits = ['12345678', '123456789012345678', 'abc123456', '']
        for nit in invalid_nits:
            with self.subTest(nit=nit):
                with self.assertRaises(ValidationError):
                    org = self.create_organization(nit=nit)
                    org.full_clean()

    def test_digito_verificacion_validation(self):
        """Test verification digit validation."""
        # Valid digits
        for digit in '0123456789':
            with self.subTest(digit=digit):
                org = self.create_organization(digito_verificacion=digit)
                org.full_clean()  # Should not raise

        # Invalid digits
        invalid_digits = ['10', 'a', '', ' ']
        for digit in invalid_digits:
            with self.subTest(digit=digit):
                with self.assertRaises(ValidationError):
                    org = self.create_organization(digito_verificacion=digit)
                    org.full_clean()

    def test_email_format_validation(self):
        """Test email format validation."""
        # Valid emails
        valid_emails = [
            'test@example.com',
            'admin@organization.co',
            'info@hospital.edu.co'
        ]
        for email in valid_emails:
            with self.subTest(email=email):
                org = self.create_organization(email_contacto=email)
                org.full_clean()

        # Invalid emails
        invalid_emails = ['invalid-email', '@example.com', 'test@']
        for email in invalid_emails:
            with self.subTest(email=email):
                with self.assertRaises(ValidationError):
                    org = self.create_organization(email_contacto=email)
                    org.full_clean()

    def test_telefono_format_validation(self):
        """Test phone number format validation."""
        # Valid phones
        valid_phones = [
            '+57 1 234 5678',
            '(1) 234-5678',
            '3001234567',
            '+57 300 123 4567'
        ]
        for phone in valid_phones:
            with self.subTest(phone=phone):
                org = self.create_organization(telefono_principal=phone)
                org.full_clean()

        # Invalid phones
        invalid_phones = ['123', '12345678901234567890', 'abc-def-ghij']
        for phone in invalid_phones:
            with self.subTest(phone=phone):
                with self.assertRaises(ValidationError):
                    org = self.create_organization(telefono_principal=phone)
                    org.full_clean()

    def test_sector_economico_choices(self):
        """Test valid sector económico choices."""
        valid_sectors = [
            'salud', 'educacion', 'manufactura', 'servicios',
            'tecnologia', 'financiero', 'comercio'
        ]
        
        for sector in valid_sectors:
            with self.subTest(sector=sector):
                org = self.create_organization(sector_economico=sector)
                self.assertEqual(org.sector_economico, sector)

    def test_tipo_organizacion_choices(self):
        """Test valid organization type choices."""
        valid_types = [
            'empresa_privada', 'empresa_publica', 'mixta', 'fundacion',
            'ong', 'cooperativa', 'ips', 'eps', 'hospital'
        ]
        
        for tipo in valid_types:
            with self.subTest(tipo=tipo):
                org = self.create_organization(
                    tipo_organizacion=tipo,
                    nit=f'12345678{len(tipo)}'  # Unique NIT
                )
                self.assertEqual(org.tipo_organizacion, tipo)

    def test_tamaño_empresa_choices(self):
        """Test valid company size choices."""
        valid_sizes = ['microempresa', 'pequeña', 'mediana', 'grande']
        
        for size in valid_sizes:
            with self.subTest(size=size):
                org = self.create_organization(
                    tamaño_empresa=size,
                    nit=f'98765432{len(size)}'  # Unique NIT
                )
                self.assertEqual(org.tamaño_empresa, size)

    def test_meta_options(self):
        """Test model meta options."""
        # Test ordering
        org1 = self.create_organization(razon_social='Z Organization')
        org2 = self.create_organization(razon_social='A Organization', nit='987654321')
        
        orgs = list(Organization.objects.all())
        self.assertEqual(orgs[0], org2)  # A comes first
        self.assertEqual(orgs[1], org1)  # Z comes second

    def test_clean_method(self):
        """Test model clean method validation."""
        org = self.create_organization()
        
        # Should not raise any validation errors
        try:
            org.clean()
        except ValidationError:
            self.fail("clean() should not raise ValidationError for valid data")


class HealthOrganizationModelTestCase(TestCase):
    """Test HealthOrganization model functionality."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='Hospital Test',
            nit='123456789',
            digito_verificacion='1',
            email_contacto='test@hospital.com',
            telefono_principal='+57 1 234 5678',
            sector_economico='salud',
            tipo_organizacion='ips',
            tamaño_empresa='mediana',
            created_by=self.user
        )

    def create_health_organization(self, **kwargs):
        """Helper to create test health organization."""
        defaults = {
            'organization': self.organization,
            'codigo_prestador': '123456789012',
            'tipo_prestador': 'IPS',
            'nivel_complejidad': 'I',
            'naturaleza_juridica': 'privada',
            'representante_tipo_documento': 'CC',
            'representante_numero_documento': '12345678',
            'representante_nombre_completo': 'Juan Pérez',
            'representante_telefono': '+57 300 123 4567',
            'representante_email': 'juan@hospital.com',
            'created_by': self.user
        }
        defaults.update(kwargs)
        return HealthOrganization.objects.create(**defaults)

    def test_health_organization_creation_success(self):
        """Test successful health organization creation."""
        health_org = self.create_health_organization()
        
        self.assertEqual(health_org.organization, self.organization)
        self.assertEqual(health_org.codigo_prestador, '123456789012')
        self.assertEqual(health_org.tipo_prestador, 'IPS')
        self.assertEqual(health_org.nivel_complejidad, 'I')
        self.assertEqual(health_org.naturaleza_juridica, 'privada')

    def test_one_to_one_relationship(self):
        """Test OneToOne relationship with Organization."""
        health_org = self.create_health_organization()
        
        # Access from organization
        self.assertEqual(self.organization.health_profile, health_org)
        
        # Access from health organization
        self.assertEqual(health_org.organization, self.organization)

    def test_unique_codigo_prestador(self):
        """Test that codigo_prestador must be unique."""
        self.create_health_organization(codigo_prestador='123456789012')
        
        # Create second organization
        org2 = Organization.objects.create(
            razon_social='Hospital Test 2',
            nit='987654321',
            digito_verificacion='2',
            email_contacto='test2@hospital.com',
            telefono_principal='+57 1 234 5679',
            sector_economico='salud',
            tipo_organizacion='ips',
            tamaño_empresa='mediana',
            created_by=self.user
        )
        
        with self.assertRaises(IntegrityError):
            self.create_health_organization(
                organization=org2,
                codigo_prestador='123456789012'  # Same code
            )

    def test_codigo_prestador_format_validation(self):
        """Test codigo_prestador format validation."""
        # Valid format (12 digits)
        valid_codes = ['123456789012', '000000000001', '999999999999']
        for code in valid_codes:
            with self.subTest(code=code):
                health_org = self.create_health_organization(
                    codigo_prestador=code,
                    organization=self.organization
                )
                health_org.full_clean()

        # Invalid formats
        invalid_codes = ['12345678901', '1234567890123', 'abc123456789', '']
        for code in invalid_codes:
            with self.subTest(code=code):
                with self.assertRaises(ValidationError):
                    health_org = self.create_health_organization(codigo_prestador=code)
                    health_org.full_clean()

    def test_tipo_prestador_choices(self):
        """Test valid tipo_prestador choices."""
        valid_types = [
            'IPS', 'HOSPITAL', 'CLINICA', 'CENTRO_MEDICO',
            'LABORATORIO', 'CENTRO_DIAGNOSTICO', 'AMBULATORIO'
        ]
        
        for tipo in valid_types:
            with self.subTest(tipo=tipo):
                # Create unique organization for each test
                org = Organization.objects.create(
                    razon_social=f'Hospital {tipo}',
                    nit=f'12345678{len(tipo)}',
                    digito_verificacion='1',
                    email_contacto=f'test{len(tipo)}@hospital.com',
                    telefono_principal='+57 1 234 5678',
                    sector_economico='salud',
                    tipo_organizacion='ips',
                    tamaño_empresa='mediana',
                    created_by=self.user
                )
                
                health_org = self.create_health_organization(
                    organization=org,
                    tipo_prestador=tipo,
                    codigo_prestador=f'12345678901{len(tipo)}'
                )
                self.assertEqual(health_org.tipo_prestador, tipo)

    def test_nivel_complejidad_choices(self):
        """Test valid nivel_complejidad choices."""
        valid_levels = ['I', 'II', 'III', 'IV']
        
        for level in valid_levels:
            with self.subTest(level=level):
                org = Organization.objects.create(
                    razon_social=f'Hospital Nivel {level}',
                    nit=f'87654321{len(level)}',
                    digito_verificacion='1',
                    email_contacto=f'nivel{level}@hospital.com',
                    telefono_principal='+57 1 234 5678',
                    sector_economico='salud',
                    tipo_organizacion='ips',
                    tamaño_empresa='mediana',
                    created_by=self.user
                )
                
                health_org = self.create_health_organization(
                    organization=org,
                    nivel_complejidad=level,
                    codigo_prestador=f'87654321012{len(level)}'
                )
                self.assertEqual(health_org.nivel_complejidad, level)

    def test_naturaleza_juridica_choices(self):
        """Test valid naturaleza_juridica choices."""
        valid_natures = ['privada', 'publica', 'mixta']
        
        for nature in valid_natures:
            with self.subTest(nature=nature):
                org = Organization.objects.create(
                    razon_social=f'Hospital {nature}',
                    nit=f'55555555{len(nature)}',
                    digito_verificacion='1',
                    email_contacto=f'{nature}@hospital.com',
                    telefono_principal='+57 1 234 5678',
                    sector_economico='salud',
                    tipo_organizacion='ips',
                    tamaño_empresa='mediana',
                    created_by=self.user
                )
                
                health_org = self.create_health_organization(
                    organization=org,
                    naturaleza_juridica=nature,
                    codigo_prestador=f'55555555012{len(nature)}'
                )
                self.assertEqual(health_org.naturaleza_juridica, nature)

    def test_codigo_prestador_formatted_property(self):
        """Test codigo_prestador_formatted property."""
        health_org = self.create_health_organization(codigo_prestador='123456789012')
        
        self.assertEqual(health_org.codigo_prestador_formatted, '1234-5678-9012')

    def test_representante_documento_completo_property(self):
        """Test representante_documento_completo property."""
        health_org = self.create_health_organization(
            representante_tipo_documento='CC',
            representante_numero_documento='12345678'
        )
        
        self.assertEqual(health_org.representante_documento_completo, 'CC 12345678')

    def test_string_representation(self):
        """Test __str__ method."""
        health_org = self.create_health_organization()
        expected = f"{self.organization.razon_social} - {health_org.codigo_prestador}"
        self.assertEqual(str(health_org), expected)

    def test_clean_method_sector_validation(self):
        """Test clean method validates organization sector."""
        # Create non-health organization
        non_health_org = Organization.objects.create(
            razon_social='Tech Company',
            nit='999999999',
            digito_verificacion='9',
            email_contacto='tech@company.com',
            telefono_principal='+57 1 234 5678',
            sector_economico='tecnologia',  # Not 'salud'
            tipo_organizacion='empresa_privada',
            tamaño_empresa='mediana',
            created_by=self.user
        )
        
        health_org = HealthOrganization(
            organization=non_health_org,
            codigo_prestador='999999999999',
            tipo_prestador='IPS',
            nivel_complejidad='I',
            naturaleza_juridica='privada',
            representante_tipo_documento='CC',
            representante_numero_documento='99999999',
            representante_nombre_completo='Test Rep',
            representante_telefono='+57 300 999 9999',
            representante_email='rep@test.com',
            created_by=self.user
        )
        
        with self.assertRaises(ValidationError):
            health_org.clean()

    def test_clean_method_codigo_prestador_length(self):
        """Test clean method validates codigo_prestador length."""
        health_org = self.create_health_organization(codigo_prestador='12345')  # Too short
        
        with self.assertRaises(ValidationError):
            health_org.clean()

    def test_clean_method_nivel_complejidad_validation(self):
        """Test clean method validates nivel_complejidad for certain prestador types."""
        # Level IV should only be allowed for HOSPITAL and CLINICA
        with self.assertRaises(ValidationError):
            health_org = self.create_health_organization(
                tipo_prestador='LABORATORIO',
                nivel_complejidad='IV'
            )
            health_org.clean()

        # Should work for HOSPITAL
        try:
            health_org = self.create_health_organization(
                tipo_prestador='HOSPITAL',
                nivel_complejidad='IV'
            )
            health_org.clean()
        except ValidationError:
            self.fail("HOSPITAL should be allowed to have nivel_complejidad IV")

    def test_actualizar_contador_servicios(self):
        """Test actualizar_contador_servicios method."""
        health_org = self.create_health_organization()
        
        # Initially should be 0
        self.assertEqual(health_org.servicios_habilitados_count, 0)
        
        # Call the method (even without actual services)
        health_org.actualizar_contador_servicios()
        
        # Should still be 0 since no services exist
        self.assertEqual(health_org.servicios_habilitados_count, 0)

    def test_get_by_codigo_prestador_class_method(self):
        """Test get_by_codigo_prestador class method."""
        health_org = self.create_health_organization()
        
        # Should find the organization
        found = HealthOrganization.get_by_codigo_prestador('123456789012')
        self.assertEqual(found, health_org)
        
        # Should return None for non-existing code
        not_found = HealthOrganization.get_by_codigo_prestador('999999999999')
        self.assertIsNone(not_found)

    def test_representante_document_types(self):
        """Test valid representante document types."""
        valid_doc_types = ['CC', 'CE', 'PA', 'NIT', 'TI']
        
        for doc_type in valid_doc_types:
            with self.subTest(doc_type=doc_type):
                org = Organization.objects.create(
                    razon_social=f'Hospital Doc {doc_type}',
                    nit=f'44444444{len(doc_type)}',
                    digito_verificacion='1',
                    email_contacto=f'doc{doc_type}@hospital.com',
                    telefono_principal='+57 1 234 5678',
                    sector_economico='salud',
                    tipo_organizacion='ips',
                    tamaño_empresa='mediana',
                    created_by=self.user
                )
                
                health_org = self.create_health_organization(
                    organization=org,
                    representante_tipo_documento=doc_type,
                    codigo_prestador=f'44444444012{len(doc_type)}'
                )
                self.assertEqual(health_org.representante_tipo_documento, doc_type)

    def test_meta_options(self):
        """Test model meta options."""
        health_org = self.create_health_organization()
        
        # Test verbose names
        meta = HealthOrganization._meta
        self.assertEqual(str(meta.verbose_name), 'organización de salud')
        self.assertEqual(str(meta.verbose_name_plural), 'organizaciones de salud')

    def test_unique_constraint_with_soft_delete(self):
        """Test unique constraint respects soft delete."""
        # Create and soft delete health organization
        health_org = self.create_health_organization()
        health_org.deleted_at = timezone.now()
        health_org.save()
        
        # Should be able to create new one with same codigo_prestador
        try:
            org2 = Organization.objects.create(
                razon_social='Hospital Test 2',
                nit='987654321',
                digito_verificacion='2',
                email_contacto='test2@hospital.com',
                telefono_principal='+57 1 234 5679',
                sector_economico='salud',
                tipo_organizacion='ips',
                tamaño_empresa='mediana',
                created_by=self.user
            )
            
            health_org2 = self.create_health_organization(
                organization=org2,
                codigo_prestador='123456789012'  # Same as soft-deleted one
            )
            
            # Should succeed
            self.assertIsNotNone(health_org2)
            
        except IntegrityError:
            self.fail("Should be able to reuse codigo_prestador from soft-deleted record")