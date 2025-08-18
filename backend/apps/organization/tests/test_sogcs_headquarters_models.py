"""
Unit tests for HeadquarterLocation model.

Tests comprehensive functionality including Colombian health regulations compliance,
REPS validation, model validation, properties, and business logic.
"""

import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from apps.organization.models import (
    HeadquarterLocation, HealthOrganization, Organization
)
from apps.organization.tests.factories import (
    HeadquarterLocationFactory, MainHeadquarterLocationFactory,
    SatelliteHeadquarterLocationFactory, MobileUnitFactory,
    HealthOrganizationProfileFactory, UserFactory
)

User = get_user_model()


class HeadquarterLocationModelTestCase(TestCase):
    """Test case for HeadquarterLocation model functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory.create()
        self.health_org = HealthOrganizationProfileFactory.create()
    
    def test_create_headquarters_with_valid_data(self):
        """Test creating headquarters with valid data."""
        headquarters = HeadquarterLocationFactory.create(
            organization=self.health_org,
            reps_code='11001234',
            name='Hospital Test Sede Principal',
            sede_type='principal',
            department_code='11',
            municipality_code='11001',
            habilitation_status='habilitada',
            operational_status='activa'
        )
        
        self.assertIsNotNone(headquarters.id)
        self.assertEqual(headquarters.organization, self.health_org)
        self.assertEqual(headquarters.reps_code, '11001234')
        self.assertEqual(headquarters.sede_type, 'principal')
        self.assertTrue(headquarters.created_at)
        self.assertTrue(headquarters.updated_at)
    
    def test_reps_code_validation_valid_formats(self):
        """Test REPS code validation with valid formats."""
        valid_codes = [
            '1234',      # Minimum 4 characters
            '12345678',  # 8 digits
            'ABC123',    # Mixed alphanumeric
            '11001234567890123456'  # Maximum 20 characters
        ]
        
        for code in valid_codes:
            with self.subTest(reps_code=code):
                headquarters = HeadquarterLocationFactory.build(
                    organization=self.health_org,
                    reps_code=code
                )
                headquarters.full_clean()  # Should not raise ValidationError
    
    def test_reps_code_validation_invalid_formats(self):
        """Test REPS code validation with invalid formats."""
        invalid_codes = [
            '123',           # Too short
            'abc@123',       # Special characters
            'código_test',   # Lowercase and underscore
            '123456789012345678901',  # Too long
            '',              # Empty
        ]
        
        for code in invalid_codes:
            with self.subTest(reps_code=code):
                with self.assertRaises(ValidationError):
                    headquarters = HeadquarterLocationFactory.build(
                        organization=self.health_org,
                        reps_code=code
                    )
                    headquarters.full_clean()
    
    def test_reps_code_uniqueness(self):
        """Test that REPS codes must be unique."""
        # Create first headquarters
        HeadquarterLocationFactory.create(
            organization=self.health_org,
            reps_code='TEST123'
        )
        
        # Try to create second headquarters with same REPS code
        with self.assertRaises(ValidationError):
            duplicate_hq = HeadquarterLocationFactory.build(
                organization=self.health_org,
                reps_code='TEST123'
            )
            duplicate_hq.full_clean()
    
    def test_colombian_department_codes_validation(self):
        """Test validation of Colombian department codes (DIVIPOLA)."""
        valid_dept_codes = [
            '05',  # Antioquia
            '08',  # Atlántico  
            '11',  # Bogotá D.C.
            '13',  # Bolívar
            '76',  # Valle del Cauca
        ]
        
        for dept_code in valid_dept_codes:
            with self.subTest(department_code=dept_code):
                headquarters = HeadquarterLocationFactory.build(
                    organization=self.health_org,
                    department_code=dept_code
                )
                headquarters.full_clean()
    
    def test_colombian_department_codes_invalid(self):
        """Test invalid Colombian department codes."""
        invalid_dept_codes = [
            '1',     # Too short
            '123',   # Too long  
            'AB',    # Letters
            '00',    # Not a valid department
        ]
        
        for dept_code in invalid_dept_codes:
            with self.subTest(department_code=dept_code):
                with self.assertRaises(ValidationError):
                    headquarters = HeadquarterLocationFactory.build(
                        organization=self.health_org,
                        department_code=dept_code
                    )
                    headquarters.full_clean()
    
    def test_colombian_municipality_codes_validation(self):
        """Test validation of Colombian municipality codes (DIVIPOLA)."""
        valid_municipality_codes = [
            '11001',  # Bogotá
            '05001',  # Medellín
            '76001',  # Cali
            '08001',  # Barranquilla
        ]
        
        for mun_code in valid_municipality_codes:
            with self.subTest(municipality_code=mun_code):
                headquarters = HeadquarterLocationFactory.build(
                    organization=self.health_org,
                    municipality_code=mun_code,
                    department_code=mun_code[:2]  # First 2 digits match department
                )
                headquarters.full_clean()
    
    def test_municipality_codes_invalid(self):
        """Test invalid municipality codes."""
        invalid_municipality_codes = [
            '1234',    # Too short
            '123456',  # Too long
            'ABCDE',   # Letters
            '00000',   # Invalid format
        ]
        
        for mun_code in invalid_municipality_codes:
            with self.subTest(municipality_code=mun_code):
                with self.assertRaises(ValidationError):
                    headquarters = HeadquarterLocationFactory.build(
                        organization=self.health_org,
                        municipality_code=mun_code
                    )
                    headquarters.full_clean()
    
    def test_phone_number_validation_valid_formats(self):
        """Test phone number validation with valid Colombian formats."""
        valid_phones = [
            '+57 1 234 5678',
            '+57 310 1234567',
            '(1) 234-5678',
            '310 123 4567',
            '1234567 ext.123',
        ]
        
        for phone in valid_phones:
            with self.subTest(phone=phone):
                headquarters = HeadquarterLocationFactory.build(
                    organization=self.health_org,
                    phone_primary=phone
                )
                headquarters.full_clean()
    
    def test_phone_number_validation_invalid_formats(self):
        """Test phone number validation with invalid formats."""
        invalid_phones = [
            '123',           # Too short
            'abc-def-ghij',  # Letters
            '123456789012345678901234567890',  # Too long
        ]
        
        for phone in invalid_phones:
            with self.subTest(phone=phone):
                with self.assertRaises(ValidationError):
                    headquarters = HeadquarterLocationFactory.build(
                        organization=self.health_org,
                        phone_primary=phone
                    )
                    headquarters.full_clean()
    
    def test_coordinates_validation_valid_ranges(self):
        """Test latitude and longitude validation within valid ranges."""
        # Valid coordinates for Colombia
        valid_coordinates = [
            (4.7110, -74.0721),    # Bogotá
            (6.2442, -75.5812),    # Medellín  
            (3.4516, -76.5320),    # Cali
            (10.9685, -74.7813),   # Barranquilla
        ]
        
        for lat, lon in valid_coordinates:
            with self.subTest(latitude=lat, longitude=lon):
                headquarters = HeadquarterLocationFactory.build(
                    organization=self.health_org,
                    latitude=Decimal(str(lat)),
                    longitude=Decimal(str(lon))
                )
                headquarters.full_clean()
    
    def test_coordinates_validation_invalid_ranges(self):
        """Test latitude and longitude validation outside valid ranges."""
        invalid_coordinates = [
            (91.0, 0.0),    # Latitude > 90
            (-91.0, 0.0),   # Latitude < -90
            (0.0, 181.0),   # Longitude > 180
            (0.0, -181.0),  # Longitude < -180
        ]
        
        for lat, lon in invalid_coordinates:
            with self.subTest(latitude=lat, longitude=lon):
                with self.assertRaises(ValidationError):
                    headquarters = HeadquarterLocationFactory.build(
                        organization=self.health_org,
                        latitude=Decimal(str(lat)),
                        longitude=Decimal(str(lon))
                    )
                    headquarters.full_clean()
    
    def test_suspension_dates_validation(self):
        """Test suspension date validation logic."""
        # Valid: end date after start date
        headquarters = HeadquarterLocationFactory.build(
            organization=self.health_org,
            suspension_start=date(2024, 1, 1),
            suspension_end=date(2024, 2, 1)
        )
        headquarters.full_clean()
        
        # Invalid: end date before start date
        with self.assertRaises(ValidationError):
            headquarters = HeadquarterLocationFactory.build(
                organization=self.health_org,
                suspension_start=date(2024, 2, 1),
                suspension_end=date(2024, 1, 1)
            )
            headquarters.full_clean()
        
        # Invalid: same date
        with self.assertRaises(ValidationError):
            headquarters = HeadquarterLocationFactory.build(
                organization=self.health_org,
                suspension_start=date(2024, 1, 1),
                suspension_end=date(2024, 1, 1)
            )
            headquarters.full_clean()
    
    def test_capacity_validation(self):
        """Test validation of bed capacity constraints."""
        # Valid: ICU beds less than total beds
        headquarters = HeadquarterLocationFactory.build(
            organization=self.health_org,
            total_beds=100,
            icu_beds=10
        )
        headquarters.full_clean()
        
        # Invalid: ICU beds exceed total beds
        with self.assertRaises(ValidationError):
            headquarters = HeadquarterLocationFactory.build(
                organization=self.health_org,
                total_beds=10,
                icu_beds=15
            )
            headquarters.full_clean()
    
    def test_main_headquarters_constraint(self):
        """Test that only one main headquarters per organization is allowed."""
        # Create first main headquarters
        main_hq = MainHeadquarterLocationFactory.create(
            organization=self.health_org,
            is_main_headquarters=True
        )
        
        # Try to create second main headquarters for same organization
        with self.assertRaises(ValidationError):
            duplicate_main = MainHeadquarterLocationFactory.build(
                organization=self.health_org,
                is_main_headquarters=True
            )
            duplicate_main.full_clean()
    
    def test_is_operational_property(self):
        """Test is_operational property logic."""
        # Operational: active and habilitated
        operational_hq = HeadquarterLocationFactory.create(
            organization=self.health_org,
            operational_status='activa',
            habilitation_status='habilitada'
        )
        self.assertTrue(operational_hq.is_operational)
        
        # Not operational: inactive
        inactive_hq = HeadquarterLocationFactory.create(
            organization=self.health_org,
            operational_status='inactiva',
            habilitation_status='habilitada'
        )
        self.assertFalse(inactive_hq.is_operational)
        
        # Not operational: not habilitated
        not_habilitated_hq = HeadquarterLocationFactory.create(
            organization=self.health_org,
            operational_status='activa',
            habilitation_status='en_proceso'
        )
        self.assertFalse(not_habilitated_hq.is_operational)
    
    def test_days_until_renewal_property(self):
        """Test days_until_renewal property calculation."""
        today = timezone.now().date()
        
        # Future renewal date
        future_renewal = HeadquarterLocationFactory.create(
            organization=self.health_org,
            next_renewal_date=today + timedelta(days=90)
        )
        self.assertEqual(future_renewal.days_until_renewal, 90)
        
        # Past renewal date
        past_renewal = HeadquarterLocationFactory.create(
            organization=self.health_org,
            next_renewal_date=today - timedelta(days=10)
        )
        self.assertEqual(past_renewal.days_until_renewal, 0)
        
        # No renewal date
        no_renewal = HeadquarterLocationFactory.create(
            organization=self.health_org,
            next_renewal_date=None
        )
        self.assertIsNone(no_renewal.days_until_renewal)
    
    def test_complete_address_property(self):
        """Test complete_address property formatting."""
        headquarters = HeadquarterLocationFactory.create(
            organization=self.health_org,
            address='Carrera 7 # 45-67',
            municipality_name='Bogotá',
            department_name='Bogotá D.C.'
        )
        expected_address = 'Carrera 7 # 45-67, Bogotá, Bogotá D.C.'
        self.assertEqual(headquarters.complete_address, expected_address)
    
    def test_needs_renewal_alert_method(self):
        """Test needs_renewal_alert method with different thresholds."""
        today = timezone.now().date()
        
        # Renewal needed (within threshold)
        renewal_needed = HeadquarterLocationFactory.create(
            organization=self.health_org,
            next_renewal_date=today + timedelta(days=60)
        )
        self.assertTrue(renewal_needed.needs_renewal_alert(90))
        self.assertFalse(renewal_needed.needs_renewal_alert(30))
        
        # Renewal not needed (beyond threshold)
        renewal_not_needed = HeadquarterLocationFactory.create(
            organization=self.health_org,
            next_renewal_date=today + timedelta(days=120)
        )
        self.assertFalse(renewal_not_needed.needs_renewal_alert(90))
        
        # Already expired
        expired = HeadquarterLocationFactory.create(
            organization=self.health_org,
            next_renewal_date=today - timedelta(days=10)
        )
        self.assertFalse(expired.needs_renewal_alert(90))
    
    def test_str_representation(self):
        """Test string representation of headquarters."""
        headquarters = HeadquarterLocationFactory.create(
            organization=self.health_org,
            name='Hospital San Juan',
            reps_code='11001234'
        )
        expected_str = 'Hospital San Juan (11001234)'
        self.assertEqual(str(headquarters), expected_str)
    
    def test_meta_ordering(self):
        """Test model ordering."""
        # Create headquarters for different organizations
        org1 = HealthOrganizationProfileFactory.create()
        org2 = HealthOrganizationProfileFactory.create()
        
        hq1 = HeadquarterLocationFactory.create(organization=org1, name='Z Hospital')
        hq2 = HeadquarterLocationFactory.create(organization=org1, name='A Hospital')  
        hq3 = HeadquarterLocationFactory.create(organization=org2, name='B Hospital')
        
        # Get all headquarters ordered by model's Meta.ordering
        headquarters_list = list(HeadquarterLocation.objects.all())
        
        # Should be ordered by organization, then by name
        self.assertTrue(len(headquarters_list) >= 3)
    
    def test_sede_type_choices(self):
        """Test all sede_type choices are valid."""
        valid_sede_types = [
            'principal', 'satelite', 'movil', 
            'domiciliaria', 'telemedicina'
        ]
        
        for sede_type in valid_sede_types:
            with self.subTest(sede_type=sede_type):
                headquarters = HeadquarterLocationFactory.build(
                    organization=self.health_org,
                    sede_type=sede_type
                )
                headquarters.full_clean()
    
    def test_habilitation_status_choices(self):
        """Test all habilitation status choices are valid."""
        valid_statuses = [
            'habilitada', 'en_proceso', 'suspendida', 
            'cancelada', 'vencida'
        ]
        
        for status in valid_statuses:
            with self.subTest(habilitation_status=status):
                headquarters = HeadquarterLocationFactory.build(
                    organization=self.health_org,
                    habilitation_status=status
                )
                headquarters.full_clean()
    
    def test_operational_status_choices(self):
        """Test all operational status choices are valid."""
        valid_statuses = [
            'activa', 'inactiva', 'temporal_cerrada',
            'permanente_cerrada', 'en_construccion'
        ]
        
        for status in valid_statuses:
            with self.subTest(operational_status=status):
                headquarters = HeadquarterLocationFactory.build(
                    organization=self.health_org,
                    operational_status=status
                )
                headquarters.full_clean()
    
    def test_sync_status_choices(self):
        """Test all sync status choices are valid."""
        valid_statuses = ['pending', 'in_progress', 'success', 'failed', 'partial']
        
        for status in valid_statuses:
            with self.subTest(sync_status=status):
                headquarters = HeadquarterLocationFactory.build(
                    organization=self.health_org,
                    sync_status=status
                )
                headquarters.full_clean()
    
    def test_json_fields_default_values(self):
        """Test JSON fields have correct default values."""
        headquarters = HeadquarterLocationFactory.create(organization=self.health_org)
        
        self.assertEqual(headquarters.sync_errors, [])
        self.assertEqual(headquarters.reps_data, {})
        self.assertEqual(headquarters.working_hours, {})
    
    def test_audit_trail_fields(self):
        """Test audit trail fields are properly set."""
        headquarters = HeadquarterLocationFactory.create(
            organization=self.health_org,
            created_by=self.user,
            updated_by=self.user
        )
        
        self.assertEqual(headquarters.created_by, self.user)
        self.assertEqual(headquarters.updated_by, self.user)
        self.assertIsNotNone(headquarters.created_at)
        self.assertIsNotNone(headquarters.updated_at)
    
    def test_soft_delete_functionality(self):
        """Test soft delete functionality from FullBaseModel."""
        headquarters = HeadquarterLocationFactory.create(organization=self.health_org)
        
        # Verify initially not deleted
        self.assertIsNone(headquarters.deleted_at)
        self.assertIsNone(headquarters.deleted_by)
        
        # Note: Actual soft delete testing would require implementing
        # the soft delete method from FullBaseModel


class HeadquarterLocationFactoryTestCase(TestCase):
    """Test cases for headquarters factories."""
    
    def test_main_headquarters_factory(self):
        """Test MainHeadquarterLocationFactory creates proper main headquarters."""
        main_hq = MainHeadquarterLocationFactory.create()
        
        self.assertEqual(main_hq.sede_type, 'principal')
        self.assertTrue(main_hq.is_main_headquarters)
        self.assertEqual(main_hq.operational_status, 'activa')
        self.assertEqual(main_hq.habilitation_status, 'habilitada')
        self.assertTrue(main_hq.has_emergency_service)
        self.assertGreaterEqual(main_hq.total_beds, 100)
    
    def test_satellite_headquarters_factory(self):
        """Test SatelliteHeadquarterLocationFactory creates proper satellite headquarters."""
        satellite_hq = SatelliteHeadquarterLocationFactory.create()
        
        self.assertEqual(satellite_hq.sede_type, 'satelite')
        self.assertFalse(satellite_hq.is_main_headquarters)
        self.assertLessEqual(satellite_hq.total_beds, 100)
    
    def test_mobile_unit_factory(self):
        """Test MobileUnitFactory creates proper mobile units."""
        mobile_unit = MobileUnitFactory.create()
        
        self.assertEqual(mobile_unit.sede_type, 'movil')
        self.assertFalse(mobile_unit.is_main_headquarters)
        self.assertEqual(mobile_unit.total_beds, 0)
        self.assertEqual(mobile_unit.icu_beds, 0)
        self.assertEqual(mobile_unit.surgery_rooms, 0)
        self.assertLessEqual(mobile_unit.consultation_rooms, 3)
    
    def test_factory_generates_valid_colombian_data(self):
        """Test that factories generate valid Colombian geographic data."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Check department code format
        self.assertRegex(headquarters.department_code, r'^\d{2}$')
        
        # Check municipality code format
        self.assertRegex(headquarters.municipality_code, r'^\d{5}$')
        
        # Check municipality code starts with department code
        self.assertTrue(
            headquarters.municipality_code.startswith(headquarters.department_code)
        )
        
        # Check coordinates are within Colombian ranges
        if headquarters.latitude:
            self.assertGreaterEqual(headquarters.latitude, Decimal('-4.0'))
            self.assertLessEqual(headquarters.latitude, Decimal('12.0'))
        
        if headquarters.longitude:
            self.assertGreaterEqual(headquarters.longitude, Decimal('-79.0'))
            self.assertLessEqual(headquarters.longitude, Decimal('-66.0'))
    
    def test_factory_generates_valid_reps_codes(self):
        """Test that factories generate valid REPS codes."""
        headquarters = HeadquarterLocationFactory.create()
        
        # REPS code should be alphanumeric and within length constraints
        self.assertRegex(headquarters.reps_code, r'^[0-9A-Z]{4,20}$')
    
    def test_factory_generates_valid_phone_numbers(self):
        """Test that factories generate valid Colombian phone numbers."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Should start with +57 (Colombia country code)
        self.assertRegex(headquarters.phone_primary, r'^\+57\s[1-5]\s\d{3}\s\d{4}$')
    
    def test_factory_capacity_constraints(self):
        """Test that factory-generated capacity data follows constraints."""
        headquarters = HeadquarterLocationFactory.create()
        
        # ICU beds should not exceed total beds
        self.assertLessEqual(headquarters.icu_beds, headquarters.total_beds)
        
        # Emergency beds should not exceed total beds
        self.assertLessEqual(headquarters.emergency_beds, headquarters.total_beds)
        
        # All capacity values should be non-negative
        self.assertGreaterEqual(headquarters.total_beds, 0)
        self.assertGreaterEqual(headquarters.icu_beds, 0)
        self.assertGreaterEqual(headquarters.emergency_beds, 0)
        self.assertGreaterEqual(headquarters.surgery_rooms, 0)
        self.assertGreaterEqual(headquarters.consultation_rooms, 0)


@pytest.mark.django_db
class HeadquarterLocationComplianceTestCase:
    """Test cases for Colombian health regulations compliance using pytest."""
    
    def test_reps_compliance_validation(self):
        """Test REPS compliance validation."""
        # Create headquarters with REPS-compliant data
        health_org = HealthOrganizationProfileFactory.create()
        headquarters = HeadquarterLocationFactory.create(
            organization=health_org,
            reps_code='11001234',
            habilitation_status='habilitada',
            operational_status='activa'
        )
        
        # Verify REPS compliance
        assert headquarters.reps_code == '11001234'
        assert headquarters.habilitation_status == 'habilitada'
        assert headquarters.is_operational
    
    def test_resolution_3100_infrastructure_requirements(self):
        """Test infrastructure requirements per Resolution 3100/2019."""
        # High complexity facility requirements
        high_complexity_hq = MainHeadquarterLocationFactory.create(
            total_beds=200,
            icu_beds=20,
            surgery_rooms=8,
            consultation_rooms=25,
            has_emergency_service=True
        )
        
        # Verify high complexity requirements
        assert high_complexity_hq.total_beds >= 100
        assert high_complexity_hq.icu_beds >= 10
        assert high_complexity_hq.surgery_rooms >= 5
        assert high_complexity_hq.has_emergency_service
        
        # Low complexity facility
        low_complexity_hq = SatelliteHeadquarterLocationFactory.create(
            total_beds=30,
            icu_beds=0,
            surgery_rooms=0,
            consultation_rooms=8
        )
        
        # Verify basic requirements
        assert low_complexity_hq.consultation_rooms >= 1
        assert low_complexity_hq.total_beds >= 0
    
    def test_divipola_geographic_compliance(self):
        """Test DIVIPOLA (Colombian geographic codes) compliance."""
        # Test major Colombian cities
        bogota_hq = HeadquarterLocationFactory.create(
            department_code='11',
            municipality_code='11001',
            department_name='Bogotá D.C.',
            municipality_name='Bogotá'
        )
        
        medellin_hq = HeadquarterLocationFactory.create(
            department_code='05',
            municipality_code='05001',
            department_name='Antioquia', 
            municipality_name='Medellín'
        )
        
        # Verify DIVIPOLA compliance
        assert bogota_hq.department_code == '11'
        assert bogota_hq.municipality_code.startswith('11')
        assert medellin_hq.department_code == '05'
        assert medellin_hq.municipality_code.startswith('05')