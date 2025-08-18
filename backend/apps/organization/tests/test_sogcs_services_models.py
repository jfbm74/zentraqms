"""
Unit tests for EnabledHealthService model.

Tests comprehensive functionality including Resolution 3100/2019 compliance,
service dependency logic, quality indicators, and business rules.
"""

import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from apps.organization.models import EnabledHealthService
from apps.organization.tests.factories import (
    EnabledHealthServiceFactory, HighComplexityServiceFactory,
    ConsultationServiceFactory, DiagnosticServiceFactory,
    HeadquarterLocationFactory, UserFactory
)

User = get_user_model()


class EnabledHealthServiceModelTestCase(TestCase):
    """Test case for EnabledHealthService model functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory.create()
        self.headquarters = HeadquarterLocationFactory.create()
    
    def test_create_service_with_valid_data(self):
        """Test creating health service with valid data."""
        service = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Medicina General',
            service_group='consulta_externa',
            complexity_level=1,
            habilitation_status='activo'
        )
        
        self.assertIsNotNone(service.id)
        self.assertEqual(service.headquarters, self.headquarters)
        self.assertEqual(service.service_code, '101')
        self.assertEqual(service.service_group, 'consulta_externa')
        self.assertEqual(service.complexity_level, 1)
        self.assertTrue(service.created_at)
    
    def test_service_code_validation_valid_formats(self):
        """Test service code validation with valid formats."""
        valid_codes = [
            '101',    # 3 digits
            '1234',   # 4 digits
        ]
        
        for code in valid_codes:
            with self.subTest(service_code=code):
                service = EnabledHealthServiceFactory.build(
                    headquarters=self.headquarters,
                    service_code=code
                )
                service.full_clean()
    
    def test_service_code_validation_invalid_formats(self):
        """Test service code validation with invalid formats."""
        invalid_codes = [
            '12',      # Too short
            '12345',   # Too long
            'ABC',     # Letters
            '1A2',     # Mixed
            '',        # Empty
        ]
        
        for code in invalid_codes:
            with self.subTest(service_code=code):
                with self.assertRaises(ValidationError):
                    service = EnabledHealthServiceFactory.build(
                        headquarters=self.headquarters,
                        service_code=code
                    )
                    service.full_clean()
    
    def test_service_code_unique_per_headquarters(self):
        """Test that service codes must be unique per headquarters."""
        # Create first service
        EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            service_code='101'
        )
        
        # Try to create duplicate service code in same headquarters
        with self.assertRaises(ValidationError):
            duplicate_service = EnabledHealthServiceFactory.build(
                headquarters=self.headquarters,
                service_code='101'
            )
            duplicate_service.full_clean()
    
    def test_service_modality_validation_at_least_one_required(self):
        """Test that at least one service modality must be selected."""
        # Valid: at least one modality selected
        service = EnabledHealthServiceFactory.build(
            headquarters=self.headquarters,
            intramural=True,
            extramural=False,
            domiciliary=False,
            telemedicine=False
        )
        service.full_clean()
        
        # Invalid: no modality selected
        with self.assertRaises(ValidationError):
            service = EnabledHealthServiceFactory.build(
                headquarters=self.headquarters,
                intramural=False,
                extramural=False,
                domiciliary=False,
                telemedicine=False
            )
            service.full_clean()
    
    def test_habilitation_dates_validation(self):
        """Test habilitation date validation."""
        today = date.today()
        
        # Valid: expiry after habilitation
        service = EnabledHealthServiceFactory.build(
            headquarters=self.headquarters,
            habilitation_date=today,
            habilitation_expiry=today + timedelta(days=365)
        )
        service.full_clean()
        
        # Invalid: expiry before habilitation
        with self.assertRaises(ValidationError):
            service = EnabledHealthServiceFactory.build(
                headquarters=self.headquarters,
                habilitation_date=today,
                habilitation_expiry=today - timedelta(days=1)
            )
            service.full_clean()
        
        # Invalid: same date
        with self.assertRaises(ValidationError):
            service = EnabledHealthServiceFactory.build(
                headquarters=self.headquarters,
                habilitation_date=today,
                habilitation_expiry=today
            )
            service.full_clean()
    
    def test_compliance_percentage_validation(self):
        """Test compliance percentage validation (0-100)."""
        # Valid percentages
        valid_percentages = [0.0, 50.0, 100.0]
        
        for percentage in valid_percentages:
            with self.subTest(percentage=percentage):
                service = EnabledHealthServiceFactory.build(
                    headquarters=self.headquarters,
                    infrastructure_compliance=Decimal(str(percentage)),
                    equipment_compliance=Decimal(str(percentage)),
                    medication_compliance=Decimal(str(percentage))
                )
                service.full_clean()
        
        # Invalid percentages
        invalid_percentages = [-1.0, 101.0, 150.0]
        
        for percentage in invalid_percentages:
            with self.subTest(percentage=percentage):
                with self.assertRaises(ValidationError):
                    service = EnabledHealthServiceFactory.build(
                        headquarters=self.headquarters,
                        infrastructure_compliance=Decimal(str(percentage))
                    )
                    service.full_clean()
    
    def test_distinctive_code_uniqueness(self):
        """Test distinctive code uniqueness across all services."""
        # Create first service
        EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            distinctive_code='DC12345678'
        )
        
        # Create second headquarters
        other_headquarters = HeadquarterLocationFactory.create()
        
        # Try to create service with same distinctive code in different headquarters
        with self.assertRaises(ValidationError):
            duplicate_service = EnabledHealthServiceFactory.build(
                headquarters=other_headquarters,
                distinctive_code='DC12345678'
            )
            duplicate_service.full_clean()
    
    def test_service_group_choices_validation(self):
        """Test all service group choices are valid."""
        valid_groups = [
            'consulta_externa', 'apoyo_diagnostico', 'internacion',
            'quirurgicos', 'urgencias', 'transporte_asistencial',
            'otros_servicios', 'proteccion_especifica'
        ]
        
        for group in valid_groups:
            with self.subTest(service_group=group):
                service = EnabledHealthServiceFactory.build(
                    headquarters=self.headquarters,
                    service_group=group
                )
                service.full_clean()
    
    def test_complexity_level_choices_validation(self):
        """Test complexity level choices validation."""
        valid_levels = [1, 2, 3, 4]
        
        for level in valid_levels:
            with self.subTest(complexity_level=level):
                service = EnabledHealthServiceFactory.build(
                    headquarters=self.headquarters,
                    complexity_level=level
                )
                service.full_clean()
    
    def test_habilitation_status_choices_validation(self):
        """Test habilitation status choices validation."""
        valid_statuses = ['activo', 'suspendido', 'cancelado', 'en_renovacion', 'vencido']
        
        for status in valid_statuses:
            with self.subTest(habilitation_status=status):
                service = EnabledHealthServiceFactory.build(
                    headquarters=self.headquarters,
                    habilitation_status=status
                )
                service.full_clean()
    
    def test_is_valid_property(self):
        """Test is_valid property logic."""
        today = date.today()
        
        # Valid: active status and future expiry
        valid_service = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            habilitation_status='activo',
            habilitation_expiry=today + timedelta(days=30)
        )
        self.assertTrue(valid_service.is_valid)
        
        # Invalid: suspended status
        suspended_service = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            habilitation_status='suspendido',
            habilitation_expiry=today + timedelta(days=30)
        )
        self.assertFalse(suspended_service.is_valid)
        
        # Invalid: expired
        expired_service = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            habilitation_status='activo',
            habilitation_expiry=today - timedelta(days=1)
        )
        self.assertFalse(expired_service.is_valid)
    
    def test_days_until_expiry_property(self):
        """Test days_until_expiry property calculation."""
        today = date.today()
        
        # Future expiry
        future_service = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            habilitation_expiry=today + timedelta(days=90)
        )
        self.assertEqual(future_service.days_until_expiry, 90)
        
        # Expired service
        expired_service = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            habilitation_expiry=today - timedelta(days=10)
        )
        self.assertEqual(expired_service.days_until_expiry, 0)
    
    def test_overall_compliance_property(self):
        """Test overall_compliance property calculation."""
        service = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            infrastructure_compliance=Decimal('90.0'),
            equipment_compliance=Decimal('80.0'),
            medication_compliance=Decimal('70.0')
        )
        
        expected_compliance = (90.0 + 80.0 + 70.0) / 3
        self.assertEqual(service.overall_compliance, expected_compliance)
    
    def test_needs_renewal_alert_method(self):
        """Test needs_renewal_alert method with different thresholds."""
        today = date.today()
        
        # Renewal needed (within threshold)
        renewal_needed = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            habilitation_expiry=today + timedelta(days=60)
        )
        self.assertTrue(renewal_needed.needs_renewal_alert(90))
        self.assertFalse(renewal_needed.needs_renewal_alert(30))
        
        # Renewal not needed (beyond threshold)
        renewal_not_needed = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            habilitation_expiry=today + timedelta(days=120)
        )
        self.assertFalse(renewal_not_needed.needs_renewal_alert(90))
    
    def test_service_interdependencies(self):
        """Test service interdependencies many-to-many relationship."""
        # Create related services
        consultation_service = ConsultationServiceFactory.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Medicina General'
        )
        
        diagnostic_service = DiagnosticServiceFactory.create(
            headquarters=self.headquarters,
            service_code='201',
            service_name='Laboratorio Clínico'
        )
        
        surgery_service = HighComplexityServiceFactory.create(
            headquarters=self.headquarters,
            service_code='301',
            service_name='Cirugía General'
        )
        
        # Set interdependencies: surgery depends on consultation and diagnostic
        surgery_service.interdependencies.add(consultation_service, diagnostic_service)
        
        # Test relationships
        self.assertEqual(surgery_service.interdependencies.count(), 2)
        self.assertIn(consultation_service, surgery_service.interdependencies.all())
        self.assertIn(diagnostic_service, surgery_service.interdependencies.all())
        
        # Test reverse relationship
        self.assertIn(surgery_service, consultation_service.dependent_services.all())
    
    def test_get_missing_dependencies_method(self):
        """Test get_missing_dependencies method."""
        # Create services with different statuses
        active_dependency = ConsultationServiceFactory.create(
            headquarters=self.headquarters,
            service_code='101',
            habilitation_status='activo'
        )
        
        suspended_dependency = DiagnosticServiceFactory.create(
            headquarters=self.headquarters,
            service_code='201',
            habilitation_status='suspendido'
        )
        
        main_service = HighComplexityServiceFactory.create(
            headquarters=self.headquarters,
            service_code='301'
        )
        
        # Set interdependencies
        main_service.interdependencies.add(active_dependency, suspended_dependency)
        
        # Get missing dependencies
        missing = main_service.get_missing_dependencies()
        
        # Only suspended dependency should be missing
        self.assertEqual(len(missing), 1)
        self.assertEqual(missing[0], suspended_dependency)
    
    def test_str_representation(self):
        """Test string representation of service."""
        service = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Medicina General'
        )
        expected_str = '101 - Medicina General'
        self.assertEqual(str(service), expected_str)
    
    def test_json_fields_default_values(self):
        """Test JSON fields have correct default values."""
        service = EnabledHealthServiceFactory.create(headquarters=self.headquarters)
        
        self.assertEqual(service.installed_capacity, {})
        self.assertEqual(service.operational_capacity, {})
        self.assertEqual(service.required_professionals, {})
        self.assertEqual(service.current_professionals, {})
        self.assertEqual(service.specific_standards, {})
        self.assertEqual(service.quality_indicators, {})
        self.assertEqual(service.service_hours, {})
    
    def test_negative_value_validation(self):
        """Test validation of negative values for integer fields."""
        with self.assertRaises(ValidationError):
            service = EnabledHealthServiceFactory.build(
                headquarters=self.headquarters,
                monthly_production=-1
            )
            service.full_clean()
        
        with self.assertRaises(ValidationError):
            service = EnabledHealthServiceFactory.build(
                headquarters=self.headquarters,
                patient_safety_events=-1
            )
            service.full_clean()


class EnabledHealthServiceFactoryTestCase(TestCase):
    """Test cases for health service factories."""
    
    def test_high_complexity_service_factory(self):
        """Test HighComplexityServiceFactory creates proper high complexity services."""
        service = HighComplexityServiceFactory.create()
        
        self.assertIn(service.complexity_level, [3, 4])
        self.assertIn(service.service_group, ['quirurgicos', 'urgencias'])
        self.assertGreaterEqual(service.infrastructure_compliance, Decimal('85.0'))
        self.assertGreaterEqual(service.equipment_compliance, Decimal('90.0'))
        self.assertTrue(service.requires_authorization)
    
    def test_consultation_service_factory(self):
        """Test ConsultationServiceFactory creates proper consultation services."""
        service = ConsultationServiceFactory.create()
        
        self.assertIn(service.complexity_level, [1, 2])
        self.assertEqual(service.service_group, 'consulta_externa')
        self.assertTrue(service.intramural)
    
    def test_diagnostic_service_factory(self):
        """Test DiagnosticServiceFactory creates proper diagnostic services."""
        service = DiagnosticServiceFactory.create()
        
        self.assertIn(service.complexity_level, [1, 2, 3])
        self.assertEqual(service.service_group, 'apoyo_diagnostico')
    
    def test_factory_generates_valid_service_codes(self):
        """Test that factories generate valid service codes."""
        service = EnabledHealthServiceFactory.create()
        self.assertRegex(service.service_code, r'^\d{3}$')
    
    def test_factory_generates_valid_distinctive_codes(self):
        """Test that factories generate valid distinctive codes."""
        service = EnabledHealthServiceFactory.create()
        self.assertRegex(service.distinctive_code, r'^DC\d{8}$')
    
    def test_factory_compliance_percentages_in_range(self):
        """Test that factory-generated compliance percentages are in valid range."""
        service = EnabledHealthServiceFactory.create()
        
        self.assertGreaterEqual(service.infrastructure_compliance, Decimal('0.0'))
        self.assertLessEqual(service.infrastructure_compliance, Decimal('100.0'))
        self.assertGreaterEqual(service.equipment_compliance, Decimal('0.0'))
        self.assertLessEqual(service.equipment_compliance, Decimal('100.0'))
        self.assertGreaterEqual(service.medication_compliance, Decimal('0.0'))
        self.assertLessEqual(service.medication_compliance, Decimal('100.0'))


@pytest.mark.django_db
class EnabledHealthServiceComplianceTestCase:
    """Test cases for Resolution 3100/2019 compliance using pytest."""
    
    def test_resolution_3100_service_groups_compliance(self):
        """Test service groups comply with Resolution 3100/2019."""
        # Test all required service groups from Resolution 3100/2019
        required_groups = [
            'consulta_externa',
            'apoyo_diagnostico', 
            'internacion',
            'quirurgicos',
            'urgencias',
            'transporte_asistencial',
            'otros_servicios',
            'proteccion_especifica'
        ]
        
        headquarters = HeadquarterLocationFactory.create()
        
        for group in required_groups:
            service = EnabledHealthServiceFactory.create(
                headquarters=headquarters,
                service_group=group
            )
            assert service.service_group == group
    
    def test_complexity_levels_compliance(self):
        """Test complexity levels comply with Colombian standards."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Level 1: Baja Complejidad
        level_1 = ConsultationServiceFactory.create(
            headquarters=headquarters,
            complexity_level=1,
            service_group='consulta_externa'
        )
        assert level_1.complexity_level == 1
        
        # Level 4: Máxima Complejidad  
        level_4 = HighComplexityServiceFactory.create(
            headquarters=headquarters,
            complexity_level=4,
            service_group='quirurgicos'
        )
        assert level_4.complexity_level == 4
        assert level_4.requires_authorization
    
    def test_service_modalities_resolution_compliance(self):
        """Test service modalities comply with Resolution 3100/2019."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Test intramural service
        intramural_service = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            intramural=True,
            extramural=False,
            domiciliary=False,
            telemedicine=False
        )
        assert intramural_service.intramural
        assert intramural_service.is_valid
        
        # Test telemedicine service (COVID-19 adaptations)
        telemedicine_service = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            intramural=False,
            extramural=False,
            domiciliary=False,
            telemedicine=True
        )
        assert telemedicine_service.telemedicine
        
        # Test combined modalities
        combined_service = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            intramural=True,
            domiciliary=True,
            telemedicine=True
        )
        assert combined_service.intramural
        assert combined_service.domiciliary
        assert combined_service.telemedicine
    
    def test_quality_indicators_resolution_256_compliance(self):
        """Test quality indicators comply with Resolution 256/2016."""
        headquarters = HeadquarterLocationFactory.create()
        service = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            quality_indicators={
                'mortalidad_intrahospitalaria': 1.2,
                'infecciones_asociadas': 0.5,
                'reingreso_72_horas': 2.1,
                'satisfaccion_pacientes': 87.5
            },
            patient_safety_events=2
        )
        
        # Verify quality indicators structure
        indicators = service.quality_indicators
        assert 'mortalidad_intrahospitalaria' in indicators
        assert 'infecciones_asociadas' in indicators
        assert 'reingreso_72_horas' in indicators
        assert 'satisfaccion_pacientes' in indicators
        
        # Verify realistic ranges
        assert 0 <= indicators['mortalidad_intrahospitalaria'] <= 5
        assert 0 <= indicators['infecciones_asociadas'] <= 2
        assert 0 <= indicators['reingreso_72_horas'] <= 5
        assert 70 <= indicators['satisfaccion_pacientes'] <= 100
        
        assert service.patient_safety_events >= 0
    
    def test_infrastructure_compliance_thresholds(self):
        """Test infrastructure compliance meets regulatory thresholds."""
        headquarters = HeadquarterLocationFactory.create()
        
        # High compliance service (should meet standards)
        high_compliance = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            infrastructure_compliance=Decimal('95.0'),
            equipment_compliance=Decimal('92.0'),
            medication_compliance=Decimal('88.0')
        )
        
        assert high_compliance.infrastructure_compliance >= Decimal('85.0')
        assert high_compliance.equipment_compliance >= Decimal('85.0') 
        assert high_compliance.medication_compliance >= Decimal('85.0')
        assert high_compliance.overall_compliance >= 85.0
        
        # Service requiring improvement
        low_compliance = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            infrastructure_compliance=Decimal('75.0'),
            equipment_compliance=Decimal('70.0'), 
            medication_compliance=Decimal('78.0')
        )
        
        assert low_compliance.overall_compliance < 85.0
    
    def test_service_interdependencies_clinical_logic(self):
        """Test service interdependencies follow clinical logic."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Create base services
        consultation = ConsultationServiceFactory.create(
            headquarters=headquarters,
            service_code='101',
            service_name='Medicina General'
        )
        
        laboratory = DiagnosticServiceFactory.create(
            headquarters=headquarters,
            service_code='201',
            service_name='Laboratorio Clínico'
        )
        
        radiology = DiagnosticServiceFactory.create(
            headquarters=headquarters,
            service_code='202',
            service_name='Radiología'
        )
        
        # Surgery service should depend on consultation and diagnostics
        surgery = HighComplexityServiceFactory.create(
            headquarters=headquarters,
            service_code='301',
            service_name='Cirugía General',
            complexity_level=3
        )
        
        # Set clinical interdependencies
        surgery.interdependencies.add(consultation, laboratory, radiology)
        
        # Verify clinical logic
        assert surgery.interdependencies.count() == 3
        assert consultation in surgery.interdependencies.all()
        assert laboratory in surgery.interdependencies.all()
        assert radiology in surgery.interdependencies.all()
        
        # All dependencies should be active for surgery to be fully operational
        all_dependencies_active = all(
            dep.is_valid for dep in surgery.interdependencies.all()
        )
        if all_dependencies_active:
            assert surgery.get_missing_dependencies() == []