"""
Simple tests for SOGCS models without factories to verify basic functionality.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import date, timedelta

from apps.organization.models import (
    HeadquarterLocation, EnabledHealthService, ServiceHabilitationProcess,
    HealthOrganization, Organization
)

User = get_user_model()


class SimpleSOGCSModelTestCase(TestCase):
    """Simple test case for SOGCS models without factory dependencies."""
    
    def setUp(self):
        """Set up test data manually."""
        # Create user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create base organization
        self.organization = Organization.objects.create(
            razon_social='Test Hospital',
            nit='900123456',
            digito_verificacion='7',
            tipo_organizacion='hospital',
            sector_economico='salud',
            tamaño_empresa='grande',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Create health organization
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='110012345678',
            naturaleza_juridica='privada',
            tipo_prestador='HOSPITAL',
            nivel_complejidad='III',
            representante_tipo_documento='CC',
            representante_numero_documento='12345678',
            representante_nombre_completo='Dr. Test Director',
            created_by=self.user,
            updated_by=self.user
        )
    
    def test_headquarters_creation_and_validation(self):
        """Test HeadquarterLocation creation and validation."""
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='11001234',
            name='Sede Principal Test',
            sede_type='principal',
            department_code='11',
            department_name='Bogotá D.C.',
            municipality_code='11001',
            municipality_name='Bogotá',
            address='Calle 123 # 45-67',
            phone_primary='+57 1 234 5678',
            email='sede@test.com',
            administrative_contact='Admin Test',
            habilitation_status='habilitada',
            operational_status='activa',
            total_beds=100,
            icu_beds=10,
            consultation_rooms=15,
            created_by=self.user,
            updated_by=self.user
        )
        
        # Test basic functionality
        self.assertEqual(headquarters.reps_code, '11001234')
        self.assertEqual(headquarters.name, 'Sede Principal Test')
        self.assertTrue(headquarters.is_operational)
        
        # Test validation
        headquarters.full_clean()
        
        # Test properties
        expected_address = "Calle 123 # 45-67, Bogotá, Bogotá D.C."
        self.assertEqual(headquarters.complete_address, expected_address)
    
    def test_headquarters_reps_code_validation(self):
        """Test REPS code validation."""
        # Valid REPS code
        headquarters = HeadquarterLocation(
            organization=self.health_org,
            reps_code='11001234',  # Valid format
            name='Test Sede',
            department_code='11',
            municipality_code='11001',
            created_by=self.user,
            updated_by=self.user
        )
        headquarters.full_clean()  # Should not raise
        
        # Invalid REPS code
        with self.assertRaises(ValidationError):
            invalid_hq = HeadquarterLocation(
                organization=self.health_org,
                reps_code='invalid',  # Invalid format
                name='Test Sede',
                department_code='11',
                municipality_code='11001',
                created_by=self.user,
                updated_by=self.user
            )
            invalid_hq.full_clean()
    
    def test_headquarters_capacity_validation(self):
        """Test headquarters capacity validation."""
        # Valid: ICU beds less than total beds
        valid_hq = HeadquarterLocation(
            organization=self.health_org,
            reps_code='11001235',
            name='Valid Capacity Sede',
            department_code='11',
            municipality_code='11001',
            total_beds=100,
            icu_beds=10,
            created_by=self.user,
            updated_by=self.user
        )
        valid_hq.full_clean()  # Should not raise
        
        # Invalid: ICU beds exceed total beds
        with self.assertRaises(ValidationError):
            invalid_hq = HeadquarterLocation(
                organization=self.health_org,
                reps_code='11001236',
                name='Invalid Capacity Sede',
                department_code='11',
                municipality_code='11001',
                total_beds=10,
                icu_beds=15,  # Exceeds total
                created_by=self.user,
                updated_by=self.user
            )
            invalid_hq.full_clean()
    
    def test_enabled_health_service_creation(self):
        """Test EnabledHealthService creation and validation."""
        # Create headquarters first
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='11001237',
            name='Service Test Sede',
            department_code='11',
            municipality_code='11001',
            created_by=self.user,
            updated_by=self.user
        )
        
        service = EnabledHealthService.objects.create(
            headquarters=headquarters,
            service_code='101',
            service_name='Medicina General',
            service_group='consulta_externa',
            complexity_level=1,
            intramural=True,
            habilitation_date=date.today(),
            habilitation_expiry=date.today() + timedelta(days=365),
            habilitation_act='Acto-123456',
            distinctive_code='DC12345678',
            infrastructure_compliance=Decimal('90.0'),
            equipment_compliance=Decimal('85.0'),
            medication_compliance=Decimal('88.0'),
            created_by=self.user,
            updated_by=self.user
        )
        
        # Test basic functionality
        self.assertEqual(service.service_code, '101')
        self.assertEqual(service.service_name, 'Medicina General')
        self.assertTrue(service.is_valid)
        
        # Test overall compliance calculation
        expected_compliance = (90.0 + 85.0 + 88.0) / 3
        self.assertEqual(service.overall_compliance, expected_compliance)
        
        # Test validation
        service.full_clean()
    
    def test_service_modality_validation(self):
        """Test service modality validation."""
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='11001238',
            name='Modality Test Sede',
            department_code='11',
            municipality_code='11001',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Valid: at least one modality selected
        valid_service = EnabledHealthService(
            headquarters=headquarters,
            service_code='102',
            service_name='Test Service',
            service_group='consulta_externa',
            complexity_level=1,
            intramural=True,  # At least one modality
            habilitation_date=date.today(),
            habilitation_expiry=date.today() + timedelta(days=365),
            habilitation_act='Acto-123457',
            distinctive_code='DC12345679',
            created_by=self.user,
            updated_by=self.user
        )
        valid_service.full_clean()  # Should not raise
        
        # Invalid: no modality selected
        with self.assertRaises(ValidationError):
            invalid_service = EnabledHealthService(
                headquarters=headquarters,
                service_code='103',
                service_name='Invalid Service',
                service_group='consulta_externa',
                complexity_level=1,
                intramural=False,  # No modalities
                extramural=False,
                domiciliary=False,
                telemedicine=False,
                habilitation_date=date.today(),
                habilitation_expiry=date.today() + timedelta(days=365),
                habilitation_act='Acto-123458',
                distinctive_code='DC12345680',
                created_by=self.user,
                updated_by=self.user
            )
            invalid_service.full_clean()
    
    def test_service_habilitation_process_creation(self):
        """Test ServiceHabilitationProcess creation and workflow."""
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='11001239',
            name='Process Test Sede',
            department_code='11',
            municipality_code='11001',
            created_by=self.user,
            updated_by=self.user
        )
        
        process = ServiceHabilitationProcess.objects.create(
            headquarters=headquarters,
            service_code='201',
            service_name='Laboratorio Clínico',
            process_type='nueva',
            current_status='iniciado',
            current_phase='preparacion',
            required_documents={
                'formulario_inscripcion': 'Formulario de inscripción',
                'autoevaluacion': 'Documento de autoevaluación'
            },
            submitted_documents={
                'formulario_inscripcion': 'Formulario completado'
            },
            created_by=self.user,
            updated_by=self.user
        )
        
        # Test basic functionality
        self.assertEqual(process.service_code, '201')
        self.assertEqual(process.process_type, 'nueva')
        self.assertFalse(process.is_completed)
        
        # Test documentation progress
        self.assertEqual(process.documentation_progress, 50.0)  # 1 of 2 docs submitted
        
        # Test phase advancement
        success = process.advance_to_next_phase()
        self.assertTrue(success)
        process.refresh_from_db()
        self.assertEqual(process.current_phase, 'autoevaluacion')
        
        # Test validation
        process.full_clean()
    
    def test_colombian_geographic_codes(self):
        """Test Colombian DIVIPOLA codes validation."""
        # Valid Colombian department and municipality codes
        valid_combinations = [
            ('11', '11001'),  # Bogotá
            ('05', '05001'),  # Medellín
            ('76', '76001'),  # Cali
        ]
        
        for dept_code, mun_code in valid_combinations:
            headquarters = HeadquarterLocation(
                organization=self.health_org,
                reps_code=f'{dept_code}001234',
                name=f'Sede {dept_code}',
                department_code=dept_code,
                municipality_code=mun_code,
                created_by=self.user,
                updated_by=self.user
            )
            
            # Should validate without errors
            headquarters.full_clean()
            
            # Municipality should start with department code
            self.assertTrue(mun_code.startswith(dept_code))
    
    def test_colombian_health_compliance_basic(self):
        """Test basic Colombian health regulations compliance."""
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='11001240',
            name='Compliance Test Sede',
            department_code='11',  # Bogotá
            municipality_code='11001',  # Bogotá municipality
            habilitation_status='habilitada',  # Proper habilitation status
            operational_status='activa',  # Operational
            created_by=self.user,
            updated_by=self.user
        )
        
        # Test REPS compliance
        self.assertEqual(headquarters.reps_code, '11001240')
        self.assertEqual(headquarters.habilitation_status, 'habilitada')
        self.assertTrue(headquarters.is_operational)
        
        # Create compliant service
        service = EnabledHealthService.objects.create(
            headquarters=headquarters,
            service_code='101',  # Valid 3-digit code
            service_name='Medicina General',
            service_group='consulta_externa',  # Valid Resolution 3100/2019 group
            complexity_level=1,  # Baja complejidad
            intramural=True,
            habilitation_date=date.today(),
            habilitation_expiry=date.today() + timedelta(days=1095),  # 3 years
            habilitation_act='Acto-123459',
            distinctive_code='DC12345681',
            infrastructure_compliance=Decimal('95.0'),  # High compliance
            equipment_compliance=Decimal('90.0'),
            medication_compliance=Decimal('88.0'),
            created_by=self.user,
            updated_by=self.user
        )
        
        # Test Resolution 3100/2019 compliance
        valid_service_groups = [
            'consulta_externa', 'apoyo_diagnostico', 'internacion',
            'quirurgicos', 'urgencias', 'transporte_asistencial'
        ]
        self.assertIn(service.service_group, valid_service_groups)
        self.assertIn(service.complexity_level, [1, 2, 3, 4])
        self.assertTrue(service.is_valid)
        
        # Test quality compliance thresholds
        self.assertGreaterEqual(service.infrastructure_compliance, Decimal('85.0'))
        self.assertGreaterEqual(service.equipment_compliance, Decimal('85.0'))
        self.assertGreaterEqual(service.medication_compliance, Decimal('85.0'))


class SOGCSModelPropertiesTestCase(TestCase):
    """Test SOGCS model properties and computed fields."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='properties@test.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='Properties Test Hospital',
            nit='900123457',
            digito_verificacion='5',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='110012345679',
            created_by=self.user,
            updated_by=self.user
        )
    
    def test_headquarters_renewal_alerts(self):
        """Test headquarters renewal alert functionality."""
        today = date.today()
        
        # Headquarters needing renewal soon
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='11001241',
            name='Renewal Alert Test',
            next_renewal_date=today + timedelta(days=60),
            created_by=self.user,
            updated_by=self.user
        )
        
        # Should need renewal alert (within 90 days)
        self.assertTrue(headquarters.needs_renewal_alert(90))
        self.assertFalse(headquarters.needs_renewal_alert(30))
        
        # Test days until renewal
        self.assertEqual(headquarters.days_until_renewal, 60)
    
    def test_service_expiry_calculations(self):
        """Test service expiry and validity calculations."""
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='11001242',
            name='Expiry Test Sede',
            created_by=self.user,
            updated_by=self.user
        )
        
        today = date.today()
        
        # Service expiring soon
        service = EnabledHealthService.objects.create(
            headquarters=headquarters,
            service_code='301',
            service_name='Surgery Service',
            service_group='quirurgicos',
            complexity_level=3,
            intramural=True,
            habilitation_status='activo',
            habilitation_date=today - timedelta(days=300),
            habilitation_expiry=today + timedelta(days=45),  # Expires in 45 days
            distinctive_code='DC12345682',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Should be valid but need renewal
        self.assertTrue(service.is_valid)
        self.assertEqual(service.days_until_expiry, 45)
        self.assertTrue(service.needs_renewal_alert(90))


# This ensures the test can be run with pytest or Django test runner
if __name__ == '__main__':
    import django
    from django.test.utils import get_runner
    from django.conf import settings
    
    django.setup()
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(['__main__'])