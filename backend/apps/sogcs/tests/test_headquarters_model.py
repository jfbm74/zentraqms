"""
Test Suite for HeadquarterLocation Model - SOGCS Sedes Database Model

This test suite comprehensively tests the HeadquarterLocation model,
including field validation, constraints, relationships, and business
logic for Colombian healthcare compliance.

Key test areas:
- Field validation and constraints
- Model relationships and foreign keys
- Custom model methods and properties
- Database constraints and unique keys
- Data integrity and business rules
- Colombian health regulatory compliance
- Audit trail functionality
"""

import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone
from freezegun import freeze_time

from apps.organization.models.sogcs_sedes import (
    HeadquarterLocation, 
    EnabledHealthService,
    SEDE_TYPES,
    HABILITATION_STATUS,
    OPERATIONAL_STATUS
)
from apps.organization.models.health import HealthOrganization
from apps.organization.models import Organization

User = get_user_model()


class TestHeadquarterLocationModelBasic(TestCase):
    """
    Basic tests for HeadquarterLocation model fields and validation
    """
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data for all test methods"""
        # Create test user
        cls.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        # Create base organization
        cls.organization = Organization.objects.create(
            razon_social='IPS Test Model S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips',
            email='admin@ipstest.com',
            telefono='3001234567',
            direccion='Carrera 15 # 20-30',
            ciudad='Bogotá',
            departamento='Cundinamarca'
        )
        
        # Create health organization
        cls.health_organization = HealthOrganization.objects.create(
            organization=cls.organization,
            reps_code='123456789012',
            health_services_enabled=True,
            sogcs_enabled=True
        )
    
    def test_create_headquarters_with_minimal_required_fields(self):
        """Test creating headquarters with minimal required fields"""
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='HQ001',
            name='Sede Test Mínima',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='test@ipstest.com',
            administrative_contact='Dr. Test',
            habilitation_status='habilitada',
            operational_status='activa',
            atencion_24_horas=False,
            barrio='Chapinero',
            cargo_responsable_administrativo='Director',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Verify basic attributes
        self.assertEqual(headquarters.organization, self.health_organization)
        self.assertEqual(headquarters.reps_code, 'HQ001')
        self.assertEqual(headquarters.name, 'Sede Test Mínima')
        self.assertEqual(headquarters.sede_type, 'principal')
        self.assertEqual(headquarters.department_code, '11')
        self.assertEqual(headquarters.department_name, 'Cundinamarca')
        self.assertEqual(headquarters.municipality_code, '11001')
        self.assertEqual(headquarters.municipality_name, 'Bogotá D.C.')
        self.assertEqual(headquarters.address, 'Carrera 15 # 93-47')
        self.assertEqual(headquarters.phone_primary, '6014567890')
        self.assertEqual(headquarters.email, 'test@ipstest.com')
        self.assertEqual(headquarters.administrative_contact, 'Dr. Test')
        self.assertEqual(headquarters.habilitation_status, 'habilitada')
        self.assertEqual(headquarters.operational_status, 'activa')
        self.assertFalse(headquarters.atencion_24_horas)
        self.assertEqual(headquarters.barrio, 'Chapinero')
        self.assertEqual(headquarters.cargo_responsable_administrativo, 'Director')
        self.assertEqual(headquarters.created_by, self.user)
        self.assertEqual(headquarters.updated_by, self.user)
        
        # Verify string representation
        self.assertEqual(str(headquarters), 'Sede Test Mínima (HQ001)')
    
    def test_create_headquarters_with_all_fields(self):
        """Test creating headquarters with all optional fields"""
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='HQ002',
            name='Sede Test Completa',
            sede_type='satelite',
            department_code='05',
            department_name='Antioquia',
            municipality_code='05001',
            municipality_name='Medellín',
            address='Carrera 70 # 50-23',
            postal_code='050001',
            latitude=Decimal('6.2442'),
            longitude=Decimal('-75.5812'),
            phone_primary='6044567890',
            phone_secondary='6044567891',
            email='completa@ipstest.com',
            administrative_contact='Dr. Completo Test',
            administrative_contact_phone='3001234567',
            administrative_contact_email='admin@ipstest.com',
            habilitation_status='habilitada',
            habilitation_date=date(2024, 1, 15),
            habilitation_resolution='RES-001-2024',
            next_renewal_date=date(2025, 1, 15),
            operational_status='activa',
            opening_date=date(2024, 1, 1),
            total_beds=50,
            icu_beds=10,
            emergency_beds=15,
            surgery_rooms=5,
            consultation_rooms=20,
            is_main_headquarters=False,
            working_hours={'monday': '8:00-18:00', 'tuesday': '8:00-18:00'},
            has_emergency_service=True,
            observations='Sede con servicios especializados',
            atencion_24_horas=True,
            barrio='El Poblado',
            cargo_responsable_administrativo='Director Médico',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Verify all fields are set correctly
        self.assertEqual(headquarters.postal_code, '050001')
        self.assertEqual(headquarters.latitude, Decimal('6.2442'))
        self.assertEqual(headquarters.longitude, Decimal('-75.5812'))
        self.assertEqual(headquarters.phone_secondary, '6044567891')
        self.assertEqual(headquarters.administrative_contact_phone, '3001234567')
        self.assertEqual(headquarters.administrative_contact_email, 'admin@ipstest.com')
        self.assertEqual(headquarters.habilitation_date, date(2024, 1, 15))
        self.assertEqual(headquarters.habilitation_resolution, 'RES-001-2024')
        self.assertEqual(headquarters.next_renewal_date, date(2025, 1, 15))
        self.assertEqual(headquarters.opening_date, date(2024, 1, 1))
        self.assertEqual(headquarters.total_beds, 50)
        self.assertEqual(headquarters.icu_beds, 10)
        self.assertEqual(headquarters.emergency_beds, 15)
        self.assertEqual(headquarters.surgery_rooms, 5)
        self.assertEqual(headquarters.consultation_rooms, 20)
        self.assertFalse(headquarters.is_main_headquarters)
        self.assertEqual(headquarters.working_hours, {'monday': '8:00-18:00', 'tuesday': '8:00-18:00'})
        self.assertTrue(headquarters.has_emergency_service)
        self.assertEqual(headquarters.observations, 'Sede con servicios especializados')
        self.assertTrue(headquarters.atencion_24_horas)
        self.assertEqual(headquarters.barrio, 'El Poblado')
        self.assertEqual(headquarters.cargo_responsable_administrativo, 'Director Médico')


class TestHeadquarterLocationModelValidation(TestCase):
    """
    Test field validation and constraints
    """
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data for validation tests"""
        cls.user = User.objects.create_user(
            email='validation@example.com',
            password='testpass123'
        )
        
        cls.organization = Organization.objects.create(
            razon_social='IPS Validation Test S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips'
        )
        
        cls.health_organization = HealthOrganization.objects.create(
            organization=cls.organization,
            reps_code='123456789012'
        )
    
    def test_reps_code_validation(self):
        """Test REPS code field validation"""
        # Valid REPS codes
        valid_codes = ['1234567890AB', 'ABCD1234', '123456789012']
        
        for i, code in enumerate(valid_codes):
            with self.subTest(code=code):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=code,
                    name=f'Test Sede {i}',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should not raise validation error
                headquarters.full_clean()
        
        # Invalid REPS codes
        invalid_codes = ['123', '123-456', 'abc def', '']
        
        for code in invalid_codes:
            with self.subTest(code=code):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=code,
                    name='Test Sede Invalid',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should raise validation error
                with self.assertRaises(ValidationError):
                    headquarters.full_clean()
    
    def test_department_code_validation(self):
        """Test department code validation (DIVIPOLA format)"""
        # Valid department codes (2 digits)
        valid_codes = ['11', '05', '08', '13']
        
        for code in valid_codes:
            with self.subTest(code=code):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TEST{code}',
                    name=f'Test Sede {code}',
                    sede_type='principal',
                    department_code=code,
                    department_name='Test Department',
                    municipality_code=f'{code}001',
                    municipality_name='Test Municipality',
                    address='Test Address',
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should not raise validation error
                headquarters.full_clean()
        
        # Invalid department codes
        invalid_codes = ['1', '111', 'AB', '']
        
        for code in invalid_codes:
            with self.subTest(code=code):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TESTINV{code}',
                    name=f'Test Sede Invalid {code}',
                    sede_type='principal',
                    department_code=code,
                    department_name='Test Department',
                    municipality_code='11001',
                    municipality_name='Test Municipality',
                    address='Test Address',
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should raise validation error
                with self.assertRaises(ValidationError):
                    headquarters.full_clean()
    
    def test_municipality_code_validation(self):
        """Test municipality code validation (DIVIPOLA format)"""
        # Valid municipality codes (5 digits)
        valid_codes = ['11001', '05001', '08001', '13001']
        
        for code in valid_codes:
            with self.subTest(code=code):
                dept_code = code[:2]
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TEST{code}',
                    name=f'Test Sede {code}',
                    sede_type='principal',
                    department_code=dept_code,
                    department_name='Test Department',
                    municipality_code=code,
                    municipality_name='Test Municipality',
                    address='Test Address',
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should not raise validation error
                headquarters.full_clean()
        
        # Invalid municipality codes
        invalid_codes = ['1100', '110011', 'ABCDE', '']
        
        for code in invalid_codes:
            with self.subTest(code=code):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TESTINV{code}',
                    name=f'Test Sede Invalid {code}',
                    sede_type='principal',
                    department_code='11',
                    department_name='Test Department',
                    municipality_code=code,
                    municipality_name='Test Municipality',
                    address='Test Address',
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should raise validation error
                with self.assertRaises(ValidationError):
                    headquarters.full_clean()
    
    def test_phone_validation(self):
        """Test phone number validation"""
        # Valid phone formats
        valid_phones = [
            '6014567890',
            '+57 1 4567890',
            '601 456 7890',
            '(601) 456-7890',
            '6014567890 ext. 123'
        ]
        
        for phone in valid_phones:
            with self.subTest(phone=phone):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TESTPH{phone[-4:]}',
                    name=f'Test Sede Phone',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    phone_primary=phone,
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should not raise validation error
                headquarters.full_clean()
        
        # Invalid phone formats
        invalid_phones = ['123', 'abc', '123abc', '']
        
        for phone in invalid_phones:
            with self.subTest(phone=phone):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TESTINV{len(phone)}',
                    name=f'Test Sede Invalid Phone',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    phone_primary=phone,
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should raise validation error
                with self.assertRaises(ValidationError):
                    headquarters.full_clean()
    
    def test_email_validation(self):
        """Test email field validation"""
        # Valid emails
        valid_emails = [
            'test@example.com',
            'admin@ipstest.com.co',
            'sede.principal@hospital.gov.co'
        ]
        
        for email in valid_emails:
            with self.subTest(email=email):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TESTEMAIL{len(email)}',
                    name='Test Sede Email',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    phone_primary='6014567890',
                    email=email,
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should not raise validation error
                headquarters.full_clean()
        
        # Invalid emails
        invalid_emails = ['invalid', 'test@', '@example.com', '']
        
        for email in invalid_emails:
            with self.subTest(email=email):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TESTINVEMAIL{len(email)}',
                    name='Test Sede Invalid Email',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    phone_primary='6014567890',
                    email=email,
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should raise validation error
                with self.assertRaises(ValidationError):
                    headquarters.full_clean()
    
    def test_latitude_longitude_validation(self):
        """Test latitude and longitude field validation"""
        # Valid coordinates
        valid_coordinates = [
            (Decimal('4.7110'), Decimal('-74.0721')),  # Bogotá
            (Decimal('6.2442'), Decimal('-75.5812')),  # Medellín
            (Decimal('3.4516'), Decimal('-76.5320')),  # Cali
        ]
        
        for lat, lng in valid_coordinates:
            with self.subTest(lat=lat, lng=lng):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TESTCOORD{abs(int(lat))}',
                    name='Test Sede Coordinates',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    latitude=lat,
                    longitude=lng,
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should not raise validation error
                headquarters.full_clean()
        
        # Invalid coordinates (out of range)
        invalid_coordinates = [
            (Decimal('95.0'), Decimal('-74.0721')),  # Latitude > 90
            (Decimal('-95.0'), Decimal('-74.0721')), # Latitude < -90
            (Decimal('4.7110'), Decimal('185.0')),   # Longitude > 180
            (Decimal('4.7110'), Decimal('-185.0')),  # Longitude < -180
        ]
        
        for lat, lng in invalid_coordinates:
            with self.subTest(lat=lat, lng=lng):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TESTINVCOORD{abs(int(lat))}',
                    name='Test Sede Invalid Coordinates',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    latitude=lat,
                    longitude=lng,
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should raise validation error
                with self.assertRaises(ValidationError):
                    headquarters.full_clean()
    
    def test_capacity_validation(self):
        """Test capacity field validation (non-negative integers)"""
        # Valid capacity values
        valid_capacities = [0, 1, 50, 100, 500]
        
        for capacity in valid_capacities:
            with self.subTest(capacity=capacity):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TESTCAP{capacity}',
                    name='Test Sede Capacity',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    total_beds=capacity,
                    icu_beds=capacity,
                    emergency_beds=capacity,
                    surgery_rooms=capacity,
                    consultation_rooms=capacity,
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should not raise validation error
                headquarters.full_clean()
        
        # Invalid capacity values (negative)
        invalid_capacities = [-1, -10, -100]
        
        for capacity in invalid_capacities:
            with self.subTest(capacity=capacity):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'TESTINVCAP{abs(capacity)}',
                    name='Test Sede Invalid Capacity',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    total_beds=capacity,
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should raise validation error
                with self.assertRaises(ValidationError):
                    headquarters.full_clean()


class TestHeadquarterLocationModelConstraints(TestCase):
    """
    Test model constraints and business rules
    """
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data for constraint tests"""
        cls.user = User.objects.create_user(
            email='constraints@example.com',
            password='testpass123'
        )
        
        cls.organization = Organization.objects.create(
            razon_social='IPS Constraints Test S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips'
        )
        
        cls.health_organization = HealthOrganization.objects.create(
            organization=cls.organization,
            reps_code='123456789012'
        )
    
    def test_unique_reps_code_constraint(self):
        """Test that REPS code must be unique"""
        # Create first headquarters
        HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='UNIQUE001',
            name='Sede Primera',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='primera@test.com',
            administrative_contact='Dr. Primero',
            habilitation_status='habilitada',
            operational_status='activa',
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Try to create second headquarters with same REPS code
        with self.assertRaises(IntegrityError):
            HeadquarterLocation.objects.create(
                organization=self.health_organization,
                reps_code='UNIQUE001',  # Duplicate REPS code
                name='Sede Segunda',
                sede_type='satelite',
                department_code='05',
                department_name='Antioquia',
                municipality_code='05001',
                municipality_name='Medellín',
                address='Carrera 70 # 50-23',
                phone_primary='6044567890',
                email='segunda@test.com',
                administrative_contact='Dr. Segundo',
                habilitation_status='habilitada',
                operational_status='activa',
                atencion_24_horas=False,
                barrio='Test',
                cargo_responsable_administrativo='Test',
                created_by=self.user,
                updated_by=self.user
            )
    
    def test_unique_main_headquarters_per_organization_constraint(self):
        """Test that only one main headquarters can exist per organization"""
        # Create first main headquarters
        main_hq1 = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='MAIN001',
            name='Sede Principal Primera',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='principal1@test.com',
            administrative_contact='Dr. Principal 1',
            habilitation_status='habilitada',
            operational_status='activa',
            is_main_headquarters=True,
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Try to create second main headquarters for same organization
        with self.assertRaises((IntegrityError, ValidationError)):
            main_hq2 = HeadquarterLocation(
                organization=self.health_organization,
                reps_code='MAIN002',
                name='Sede Principal Segunda',
                sede_type='principal',
                department_code='05',
                department_name='Antioquia',
                municipality_code='05001',
                municipality_name='Medellín',
                address='Carrera 70 # 50-23',
                phone_primary='6044567890',
                email='principal2@test.com',
                administrative_contact='Dr. Principal 2',
                habilitation_status='habilitada',
                operational_status='activa',
                is_main_headquarters=True,
                atencion_24_horas=False,
                barrio='Test',
                cargo_responsable_administrativo='Test',
                created_by=self.user,
                updated_by=self.user
            )
            main_hq2.save()
    
    def test_municipality_department_code_validation(self):
        """Test that municipality code must correspond to department code"""
        # Valid combination (Bogotá - Cundinamarca)
        valid_hq = HeadquarterLocation(
            organization=self.health_organization,
            reps_code='VALIDMUNI001',
            name='Sede Válida',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',  # Matches department
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='valida@test.com',
            administrative_contact='Dr. Válido',
            habilitation_status='habilitada',
            operational_status='activa',
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Should not raise validation error
        valid_hq.full_clean()
        
        # Invalid combination (municipality doesn't match department)
        invalid_hq = HeadquarterLocation(
            organization=self.health_organization,
            reps_code='INVALIDMUNI001',
            name='Sede Inválida',
            sede_type='principal',
            department_code='11',  # Cundinamarca
            department_name='Cundinamarca',
            municipality_code='05001',  # Medellín (belongs to Antioquia - 05)
            municipality_name='Medellín',
            address='Carrera 70 # 50-23',
            phone_primary='6044567890',
            email='invalida@test.com',
            administrative_contact='Dr. Inválido',
            habilitation_status='habilitada',
            operational_status='activa',
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Should raise validation error
        with self.assertRaises(ValidationError) as context:
            invalid_hq.full_clean()
        
        self.assertIn('municipality_code', context.exception.message_dict)
    
    def test_suspension_date_validation(self):
        """Test that suspension end date must be after start date"""
        # Valid suspension dates
        valid_hq = HeadquarterLocation(
            organization=self.health_organization,
            reps_code='VALIDSUSPENSION',
            name='Sede Suspensión Válida',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='suspension@test.com',
            administrative_contact='Dr. Suspensión',
            habilitation_status='suspendida',
            operational_status='temporal_cerrada',
            suspension_start=date(2024, 1, 1),
            suspension_end=date(2024, 2, 1),  # After start date
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Should not raise validation error
        valid_hq.full_clean()
        
        # Invalid suspension dates (end before start)
        invalid_hq = HeadquarterLocation(
            organization=self.health_organization,
            reps_code='INVALIDSUSPENSION',
            name='Sede Suspensión Inválida',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='invalidsuspension@test.com',
            administrative_contact='Dr. Suspensión Inválida',
            habilitation_status='suspendida',
            operational_status='temporal_cerrada',
            suspension_start=date(2024, 2, 1),
            suspension_end=date(2024, 1, 1),  # Before start date
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Should raise validation error
        with self.assertRaises(ValidationError) as context:
            invalid_hq.full_clean()
        
        self.assertIn('suspension_end', context.exception.message_dict)
    
    def test_icu_beds_not_exceed_total_beds(self):
        """Test that ICU beds cannot exceed total beds"""
        # Valid bed configuration
        valid_hq = HeadquarterLocation(
            organization=self.health_organization,
            reps_code='VALIDBEDS',
            name='Sede Camas Válidas',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='validbeds@test.com',
            administrative_contact='Dr. Camas',
            habilitation_status='habilitada',
            operational_status='activa',
            total_beds=50,
            icu_beds=10,  # Less than total
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Should not raise validation error
        valid_hq.full_clean()
        
        # Invalid bed configuration (ICU > total)
        invalid_hq = HeadquarterLocation(
            organization=self.health_organization,
            reps_code='INVALIDBEDS',
            name='Sede Camas Inválidas',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='invalidbeds@test.com',
            administrative_contact='Dr. Camas Inválidas',
            habilitation_status='habilitada',
            operational_status='activa',
            total_beds=10,
            icu_beds=20,  # More than total
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Should raise validation error
        with self.assertRaises(ValidationError) as context:
            invalid_hq.full_clean()
        
        self.assertIn('icu_beds', context.exception.message_dict)


class TestHeadquarterLocationModelProperties(TestCase):
    """
    Test model properties and computed fields
    """
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data for property tests"""
        cls.user = User.objects.create_user(
            email='properties@example.com',
            password='testpass123'
        )
        
        cls.organization = Organization.objects.create(
            razon_social='IPS Properties Test S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips'
        )
        
        cls.health_organization = HealthOrganization.objects.create(
            organization=cls.organization,
            reps_code='123456789012'
        )
    
    def test_is_operational_property(self):
        """Test is_operational property"""
        # Operational headquarters (active + habilitada)
        operational_hq = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='OPERATIONAL001',
            name='Sede Operativa',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='operativa@test.com',
            administrative_contact='Dr. Operativo',
            habilitation_status='habilitada',
            operational_status='activa',
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.assertTrue(operational_hq.is_operational)
        
        # Non-operational headquarters (inactive)
        non_operational_hq = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='NONOPERATIONAL001',
            name='Sede No Operativa',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-48',
            phone_primary='6014567891',
            email='nooperativa@test.com',
            administrative_contact='Dr. No Operativo',
            habilitation_status='habilitada',
            operational_status='inactiva',
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.assertFalse(non_operational_hq.is_operational)
        
        # Non-habilitated headquarters
        non_habilitated_hq = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='NONHABILITATED001',
            name='Sede No Habilitada',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-49',
            phone_primary='6014567892',
            email='nohabilitada@test.com',
            administrative_contact='Dr. No Habilitado',
            habilitation_status='en_proceso',
            operational_status='activa',
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.assertFalse(non_habilitated_hq.is_operational)
    
    @freeze_time("2024-11-17")
    def test_days_until_renewal_property(self):
        """Test days_until_renewal property"""
        # Headquarters with future renewal date
        future_renewal_hq = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='FUTURERENEW001',
            name='Sede Renovación Futura',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='futuro@test.com',
            administrative_contact='Dr. Futuro',
            habilitation_status='habilitada',
            operational_status='activa',
            next_renewal_date=date(2024, 12, 17),  # 30 days from frozen time
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.assertEqual(future_renewal_hq.days_until_renewal, 30)
        
        # Headquarters with past renewal date
        past_renewal_hq = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='PASTRENEW001',
            name='Sede Renovación Pasada',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-48',
            phone_primary='6014567891',
            email='pasado@test.com',
            administrative_contact='Dr. Pasado',
            habilitation_status='vencida',
            operational_status='inactiva',
            next_renewal_date=date(2024, 10, 17),  # 31 days ago
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.assertEqual(past_renewal_hq.days_until_renewal, 0)
        
        # Headquarters without renewal date
        no_renewal_hq = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='NORENEW001',
            name='Sede Sin Renovación',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-49',
            phone_primary='6014567892',
            email='sinrenovacion@test.com',
            administrative_contact='Dr. Sin Renovación',
            habilitation_status='habilitada',
            operational_status='activa',
            next_renewal_date=None,
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.assertIsNone(no_renewal_hq.days_until_renewal)
    
    def test_complete_address_property(self):
        """Test complete_address property"""
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='ADDRESS001',
            name='Sede Dirección Completa',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='direccion@test.com',
            administrative_contact='Dr. Dirección',
            habilitation_status='habilitada',
            operational_status='activa',
            atencion_24_horas=False,
            barrio='Chapinero',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        expected_address = 'Carrera 15 # 93-47, Bogotá D.C., Cundinamarca'
        self.assertEqual(headquarters.complete_address, expected_address)
    
    @freeze_time("2024-11-17")
    def test_needs_renewal_alert_method(self):
        """Test needs_renewal_alert method"""
        # Headquarters needing renewal within threshold
        needs_alert_hq = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='NEEDSALERT001',
            name='Sede Necesita Alerta',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='alerta@test.com',
            administrative_contact='Dr. Alerta',
            habilitation_status='habilitada',
            operational_status='activa',
            next_renewal_date=date(2024, 12, 1),  # 14 days from frozen time
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Should need alert with 30-day threshold
        self.assertTrue(needs_alert_hq.needs_renewal_alert(days_threshold=30))
        
        # Should not need alert with 10-day threshold
        self.assertFalse(needs_alert_hq.needs_renewal_alert(days_threshold=10))
        
        # Headquarters not needing renewal
        no_alert_hq = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='NOALERT001',
            name='Sede No Necesita Alerta',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-48',
            phone_primary='6014567891',
            email='noalerta@test.com',
            administrative_contact='Dr. No Alerta',
            habilitation_status='habilitada',
            operational_status='activa',
            next_renewal_date=date(2025, 6, 17),  # 6 months from frozen time
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Should not need alert
        self.assertFalse(no_alert_hq.needs_renewal_alert(days_threshold=90))


class TestHeadquarterLocationModelRelationships(TestCase):
    """
    Test model relationships and foreign keys
    """
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data for relationship tests"""
        cls.user = User.objects.create_user(
            email='relationships@example.com',
            password='testpass123'
        )
        
        cls.organization = Organization.objects.create(
            razon_social='IPS Relationships Test S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips'
        )
        
        cls.health_organization = HealthOrganization.objects.create(
            organization=cls.organization,
            reps_code='123456789012'
        )
    
    def test_organization_relationship(self):
        """Test relationship with HealthOrganization"""
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='REL001',
            name='Sede Relaciones',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='relaciones@test.com',
            administrative_contact='Dr. Relaciones',
            habilitation_status='habilitada',
            operational_status='activa',
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Test forward relationship
        self.assertEqual(headquarters.organization, self.health_organization)
        self.assertEqual(headquarters.organization.organization, self.organization)
        
        # Test reverse relationship
        self.assertIn(headquarters, self.health_organization.headquarters_locations.all())
    
    def test_user_relationships(self):
        """Test relationships with User (created_by, updated_by)"""
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='USER001',
            name='Sede Usuario',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='usuario@test.com',
            administrative_contact='Dr. Usuario',
            habilitation_status='habilitada',
            operational_status='activa',
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Test user relationships
        self.assertEqual(headquarters.created_by, self.user)
        self.assertEqual(headquarters.updated_by, self.user)
    
    def test_cascade_delete_behavior(self):
        """Test cascade delete behavior when organization is deleted"""
        # Create headquarters
        headquarters = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='CASCADE001',
            name='Sede Cascade',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='cascade@test.com',
            administrative_contact='Dr. Cascade',
            habilitation_status='habilitada',
            operational_status='activa',
            atencion_24_horas=False,
            barrio='Test',
            cargo_responsable_administrativo='Test',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Verify headquarters exists
        self.assertTrue(HeadquarterLocation.objects.filter(id=headquarters.id).exists())
        
        # Delete health organization
        self.health_organization.delete()
        
        # Verify headquarters was also deleted (cascade)
        self.assertFalse(HeadquarterLocation.objects.filter(id=headquarters.id).exists())


class TestHeadquarterLocationModelChoices(TestCase):
    """
    Test model choice fields and their validation
    """
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data for choice tests"""
        cls.user = User.objects.create_user(
            email='choices@example.com',
            password='testpass123'
        )
        
        cls.organization = Organization.objects.create(
            razon_social='IPS Choices Test S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips'
        )
        
        cls.health_organization = HealthOrganization.objects.create(
            organization=cls.organization,
            reps_code='123456789012'
        )
    
    def test_sede_type_choices(self):
        """Test sede_type field choices"""
        valid_sede_types = [choice[0] for choice in SEDE_TYPES]
        
        for sede_type in valid_sede_types:
            with self.subTest(sede_type=sede_type):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'SEDETYPE{sede_type}',
                    name=f'Sede {sede_type}',
                    sede_type=sede_type,
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should not raise validation error
                headquarters.full_clean()
    
    def test_habilitation_status_choices(self):
        """Test habilitation_status field choices"""
        valid_statuses = [choice[0] for choice in HABILITATION_STATUS]
        
        for status in valid_statuses:
            with self.subTest(status=status):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'HABSTATUS{status}',
                    name=f'Sede {status}',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status=status,
                    operational_status='activa',
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should not raise validation error
                headquarters.full_clean()
    
    def test_operational_status_choices(self):
        """Test operational_status field choices"""
        valid_statuses = [choice[0] for choice in OPERATIONAL_STATUS]
        
        for status in valid_statuses:
            with self.subTest(status=status):
                headquarters = HeadquarterLocation(
                    organization=self.health_organization,
                    reps_code=f'OPSTATUS{status}',
                    name=f'Sede {status}',
                    sede_type='principal',
                    department_code='11',
                    department_name='Cundinamarca',
                    municipality_code='11001',
                    municipality_name='Bogotá D.C.',
                    address='Test Address',
                    phone_primary='6014567890',
                    email='test@example.com',
                    administrative_contact='Dr. Test',
                    habilitation_status='habilitada',
                    operational_status=status,
                    atencion_24_horas=False,
                    barrio='Test',
                    cargo_responsable_administrativo='Test',
                    created_by=self.user,
                    updated_by=self.user
                )
                
                # Should not raise validation error
                headquarters.full_clean()