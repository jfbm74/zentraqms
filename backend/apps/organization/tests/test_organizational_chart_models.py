"""
Tests for Organizational Chart Models

This module contains comprehensive tests for the organizational chart system models
including sectors, templates, charts, areas, positions, committees, and assignments.
"""

import json
from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.organization.models import (
    # Base organization models
    Organization,
    Location,
    
    # Organizational chart models
    Sector,
    SectorNormativa,
    PlantillaOrganigrama,
    OrganizationalChart,
    
    # Structure models
    Area,
    Cargo,
    Responsabilidad,
    Autoridad,
    
    # Committee models
    Comite,
    MiembroComite,
    
    # Assignment models
    AsignacionCargo,
    Service,
    ServiceIntegration,
)

User = get_user_model()


class SectorModelTests(TestCase):
    """Test cases for Sector model."""
    
    def setUp(self):
        """Set up test data."""
        self.sector_data = {
            'code': 'HEALTH',
            'name': 'Sector Salud',
            'description': 'Sector de salud colombiano',
            'default_config': {
                'hierarchy_levels_default': 5,
                'requires_mandatory_committees': True,
                'mandatory_committees': ['QUALITY_COMMITTEE', 'PATIENT_SAFETY_COMMITTEE']
            },
            'normative_requirements': ['RES-2003-2014', 'RES-429-2016'],
            'has_templates': True
        }
    
    def test_sector_creation(self):
        """Test creating a sector with valid data."""
        sector = Sector.objects.create(**self.sector_data)
        
        self.assertEqual(sector.code, 'HEALTH')
        self.assertEqual(sector.name, 'Sector Salud')
        self.assertTrue(sector.has_templates)
        self.assertTrue(sector.is_active)
        self.assertIn('hierarchy_levels_default', sector.default_config)
    
    def test_sector_str_representation(self):
        """Test string representation of Sector."""
        sector = Sector.objects.create(**self.sector_data)
        expected_str = f"{sector.code} - {sector.name}"
        self.assertEqual(str(sector), expected_str)
    
    def test_sector_unique_code(self):
        """Test that sector codes must be unique."""
        Sector.objects.create(**self.sector_data)
        
        # Try to create another sector with same code
        with self.assertRaises(IntegrityError):
            Sector.objects.create(**self.sector_data)
    
    def test_sector_get_mandatory_committees(self):
        """Test getting mandatory committees from sector config."""
        sector = Sector.objects.create(**self.sector_data)
        committees = sector.get_mandatory_committees()
        
        self.assertEqual(len(committees), 2)
        self.assertIn('QUALITY_COMMITTEE', committees)
        self.assertIn('PATIENT_SAFETY_COMMITTEE', committees)
    
    def test_sector_config_validation(self):
        """Test sector configuration validation."""
        # Missing required keys should raise ValidationError
        invalid_data = self.sector_data.copy()
        invalid_data['default_config'] = {'invalid_key': 'value'}
        
        sector = Sector(**invalid_data)
        with self.assertRaises(ValidationError):
            sector.clean()


class OrganizationalChartModelTests(TestCase):
    """Test cases for OrganizationalChart model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='Test Organization',
            nombre_comercial='Test Org',
            nit='123456789',
            digito_verificacion='1',
            tipo_organizacion='ips',
            sector_economico='salud',
            tamaño_empresa='mediana'
        )
        
        self.sector = Sector.objects.create(
            code='HEALTH',
            name='Sector Salud',
            description='Test sector',
            default_config={'hierarchy_levels_default': 5, 'requires_mandatory_committees': True}
        )
        
        self.chart_data = {
            'organization': self.organization,
            'sector': self.sector,
            'organization_type': 'IPS',
            'version': '1.0',
            'effective_date': date.today(),
            'hierarchy_levels': 4,
            'created_by': self.user,
            'updated_by': self.user
        }
    
    def test_organizational_chart_creation(self):
        """Test creating an organizational chart."""
        chart = OrganizationalChart.objects.create(**self.chart_data)
        
        self.assertEqual(chart.version, '1.0')
        self.assertEqual(chart.hierarchy_levels, 4)
        self.assertTrue(chart.is_current)
        self.assertTrue(chart.allows_temporary_positions)
        self.assertTrue(chart.uses_raci_matrix)
    
    def test_organizational_chart_str_representation(self):
        """Test string representation of OrganizationalChart."""
        chart = OrganizationalChart.objects.create(**self.chart_data)
        expected_str = f"{self.organization.nombre_comercial} - v{chart.version}"
        self.assertEqual(str(chart), expected_str)
    
    def test_organizational_chart_versioning(self):
        """Test organizational chart versioning."""
        # Create first version
        chart1 = OrganizationalChart.objects.create(**self.chart_data)
        self.assertTrue(chart1.is_current)
        
        # Create second version
        chart_data_v2 = self.chart_data.copy()
        chart_data_v2['version'] = '2.0'
        chart_data_v2['effective_date'] = date.today() + timedelta(days=1)
        
        chart2 = OrganizationalChart.objects.create(**chart_data_v2)
        
        # Refresh from database
        chart1.refresh_from_db()
        
        # First version should no longer be current
        self.assertFalse(chart1.is_current)
        self.assertTrue(chart2.is_current)
    
    def test_organizational_chart_version_validation(self):
        """Test version format validation."""
        invalid_data = self.chart_data.copy()
        invalid_data['version'] = 'invalid-version'
        
        chart = OrganizationalChart(**invalid_data)
        with self.assertRaises(ValidationError):
            chart.clean()
    
    def test_get_next_version(self):
        """Test getting next version number."""
        chart1 = OrganizationalChart.objects.create(**self.chart_data)
        
        # Test next version generation
        next_version = chart1.get_next_version()
        self.assertEqual(next_version, '1.1')
    
    def test_chart_approval(self):
        """Test chart approval process."""
        chart = OrganizationalChart.objects.create(**self.chart_data)
        chart.is_current = False  # Reset for testing
        chart.save()
        
        # Approve the chart
        chart.approve(user=self.user, reason="Test approval")
        
        self.assertIsNotNone(chart.approved_by)
        self.assertIsNotNone(chart.approval_date)
        self.assertTrue(chart.is_current)
    
    def test_unique_current_chart_per_organization(self):
        """Test that only one chart can be current per organization."""
        # This is enforced by the model's save method, not a database constraint
        # when multiple charts have the same effective date
        chart1 = OrganizationalChart.objects.create(**self.chart_data)
        
        chart_data_2 = self.chart_data.copy()
        chart_data_2['version'] = '2.0'
        chart_data_2['effective_date'] = date.today() + timedelta(days=1)
        
        chart2 = OrganizationalChart.objects.create(**chart_data_2)
        
        # Refresh first chart
        chart1.refresh_from_db()
        
        # Only the newer chart should be current
        self.assertFalse(chart1.is_current)
        self.assertTrue(chart2.is_current)


class AreaModelTests(TestCase):
    """Test cases for Area model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='Test Organization',
            nombre_comercial='Test Org',
            nit='123456789',
            digito_verificacion='1',
            tipo_organizacion='ips',
            sector_economico='salud',
            tamaño_empresa='mediana'
        )
        
        self.sector = Sector.objects.create(
            code='HEALTH',
            name='Sector Salud',
            description='Test sector',
            default_config={'hierarchy_levels_default': 5, 'requires_mandatory_committees': True}
        )
        
        self.chart = OrganizationalChart.objects.create(
            organization=self.organization,
            sector=self.sector,
            organization_type='IPS',
            version='1.0',
            effective_date=date.today(),
            hierarchy_levels=4,
            created_by=self.user,
            updated_by=self.user
        )
        
        self.area_data = {
            'organizational_chart': self.chart,
            'code': 'DIR-GEN',
            'name': 'Dirección General',
            'area_type': 'DIRECTION',
            'hierarchy_level': 1,
            'description': 'Dirección general de la organización',
            'main_purpose': 'Dirigir y coordinar las actividades institucionales',
            'created_by': self.user,
            'updated_by': self.user
        }
    
    def test_area_creation(self):
        """Test creating an area."""
        area = Area.objects.create(**self.area_data)
        
        self.assertEqual(area.code, 'DIR-GEN')
        self.assertEqual(area.name, 'Dirección General')
        self.assertEqual(area.area_type, 'DIRECTION')
        self.assertEqual(area.hierarchy_level, 1)
        self.assertTrue(area.is_active)
    
    def test_area_str_representation(self):
        """Test string representation of Area."""
        area = Area.objects.create(**self.area_data)
        expected_str = f"{area.code} - {area.name}"
        self.assertEqual(str(area), expected_str)
    
    def test_area_hierarchical_structure(self):
        """Test hierarchical area structure."""
        parent_area = Area.objects.create(**self.area_data)
        
        # Create child area
        child_data = self.area_data.copy()
        child_data.update({
            'code': 'SUB-DIR',
            'name': 'Subdirección',
            'area_type': 'SUBDIRECTION',
            'hierarchy_level': 2,
            'parent_area': parent_area
        })
        child_area = Area.objects.create(**child_data)
        
        self.assertEqual(child_area.parent_area, parent_area)
        self.assertIn(child_area, parent_area.child_areas.all())
    
    def test_area_hierarchy_validation(self):
        """Test area hierarchy level validation."""
        parent_area = Area.objects.create(**self.area_data)
        
        # Try to create child with same or lower hierarchy level
        child_data = self.area_data.copy()
        child_data.update({
            'code': 'INVALID-CHILD',
            'name': 'Invalid Child',
            'hierarchy_level': 1,  # Same as parent
            'parent_area': parent_area
        })
        
        area = Area(**child_data)
        with self.assertRaises(ValidationError):
            area.clean()
    
    def test_area_circular_reference_prevention(self):
        """Test prevention of circular references in hierarchy."""
        area1 = Area.objects.create(**self.area_data)
        
        area2_data = self.area_data.copy()
        area2_data.update({
            'code': 'AREA-2',
            'name': 'Area 2',
            'hierarchy_level': 2,
            'parent_area': area1
        })
        area2 = Area.objects.create(**area2_data)
        
        # Try to make area1 child of area2 (circular reference)
        area1.parent_area = area2
        with self.assertRaises(ValidationError):
            area1.clean()
    
    def test_get_full_hierarchy_path(self):
        """Test getting complete hierarchy path."""
        # Create hierarchy: Root -> Parent -> Child
        root_area = Area.objects.create(**self.area_data)
        
        parent_data = self.area_data.copy()
        parent_data.update({
            'code': 'PARENT',
            'name': 'Parent Area',
            'hierarchy_level': 2,
            'parent_area': root_area
        })
        parent_area = Area.objects.create(**parent_data)
        
        child_data = self.area_data.copy()
        child_data.update({
            'code': 'CHILD',
            'name': 'Child Area',
            'hierarchy_level': 3,
            'parent_area': parent_area
        })
        child_area = Area.objects.create(**child_data)
        
        # Test hierarchy path
        path = child_area.get_full_hierarchy_path()
        self.assertEqual(len(path), 3)
        self.assertEqual(path[0], root_area)
        self.assertEqual(path[1], parent_area)
        self.assertEqual(path[2], child_area)


class CargoModelTests(TestCase):
    """Test cases for Cargo (Position) model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='Test Organization',
            nombre_comercial='Test Org',
            nit='123456789',
            digito_verificacion='1',
            tipo_organizacion='ips',
            sector_economico='salud',
            tamaño_empresa='mediana'
        )
        
        self.sector = Sector.objects.create(
            code='HEALTH',
            name='Sector Salud',
            description='Test sector',
            default_config={'hierarchy_levels_default': 5, 'requires_mandatory_committees': True}
        )
        
        self.chart = OrganizationalChart.objects.create(
            organization=self.organization,
            sector=self.sector,
            organization_type='IPS',
            version='1.0',
            effective_date=date.today(),
            hierarchy_levels=4,
            created_by=self.user,
            updated_by=self.user
        )
        
        self.area = Area.objects.create(
            organizational_chart=self.chart,
            code='DIR-GEN',
            name='Dirección General',
            area_type='DIRECTION',
            hierarchy_level=1,
            created_by=self.user,
            updated_by=self.user
        )
        
        self.position_data = {
            'area': self.area,
            'code': 'DIR-001',
            'name': 'Director General',
            'hierarchy_level': 'EXECUTIVE',
            'main_purpose': 'Dirigir y coordinar la organización',
            'requirements': {
                'education': {
                    'level': 'university',
                    'title': 'Administración en Salud',
                    'additional': 'Especialización preferible'
                },
                'experience': {
                    'years': 5,
                    'specific_area': 'Gestión hospitalaria',
                    'leadership_experience': True
                },
                'competencies': ['Liderazgo', 'Trabajo en equipo'],
                'licenses': ['Tarjeta profesional'],
                'languages': ['Español']
            },
            'is_critical': True,
            'authorized_positions': 1,
            'salary_range_min': Decimal('5000000'),
            'salary_range_max': Decimal('8000000'),
            'created_by': self.user,
            'updated_by': self.user
        }
    
    def test_position_creation(self):
        """Test creating a position."""
        position = Cargo.objects.create(**self.position_data)
        
        self.assertEqual(position.code, 'DIR-001')
        self.assertEqual(position.name, 'Director General')
        self.assertEqual(position.hierarchy_level, 'EXECUTIVE')
        self.assertTrue(position.is_critical)
        self.assertEqual(position.authorized_positions, 1)
        self.assertIsInstance(position.requirements, dict)
    
    def test_position_str_representation(self):
        """Test string representation of Position."""
        position = Cargo.objects.create(**self.position_data)
        expected_str = f"{position.code} - {position.name}"
        self.assertEqual(str(position), expected_str)
    
    def test_position_reporting_structure(self):
        """Test position reporting structure."""
        supervisor = Cargo.objects.create(**self.position_data)
        
        # Create subordinate position
        subordinate_data = self.position_data.copy()
        subordinate_data.update({
            'code': 'SUB-001',
            'name': 'Subdirector',
            'hierarchy_level': 'SENIOR_MANAGEMENT',
            'reports_to': supervisor
        })
        subordinate = Cargo.objects.create(**subordinate_data)
        
        self.assertEqual(subordinate.reports_to, supervisor)
        self.assertIn(subordinate, supervisor.subordinates.all())
    
    def test_position_salary_validation(self):
        """Test position salary range validation."""
        invalid_data = self.position_data.copy()
        invalid_data.update({
            'salary_range_min': Decimal('8000000'),
            'salary_range_max': Decimal('5000000')  # Max lower than min
        })
        
        position = Cargo(**invalid_data)
        with self.assertRaises(ValidationError):
            position.clean()
    
    def test_position_requirements_access(self):
        """Test accessing position requirements."""
        position = Cargo.objects.create(**self.position_data)
        
        competencies = position.get_required_competencies()
        self.assertIn('Liderazgo', competencies)
        self.assertIn('Trabajo en equipo', competencies)
        
        licenses = position.get_required_licenses()
        self.assertIn('Tarjeta profesional', licenses)
    
    def test_get_span_of_control(self):
        """Test getting span of control for a position."""
        supervisor = Cargo.objects.create(**self.position_data)
        
        # Create multiple subordinates
        for i in range(3):
            subordinate_data = self.position_data.copy()
            subordinate_data.update({
                'code': f'SUB-00{i+1}',
                'name': f'Subordinate {i+1}',
                'hierarchy_level': 'PROFESSIONAL',
                'reports_to': supervisor
            })
            Cargo.objects.create(**subordinate_data)
        
        self.assertEqual(supervisor.get_span_of_control(), 3)


class ServiceModelTests(TestCase):
    """Test cases for Service model."""
    
    def setUp(self):
        """Set up test data."""
        self.sector = Sector.objects.create(
            code='HEALTH',
            name='Sector Salud',
            description='Test sector',
            default_config={'hierarchy_levels_default': 5, 'requires_mandatory_committees': True}
        )
        
        self.service_data = {
            'code': 'CONS-EXT-GEN',
            'name': 'Consulta Externa General',
            'sector': self.sector,
            'category': 'CORE',
            'description': 'Servicio de consulta externa de medicina general',
            'is_mandatory': True,
            'required_positions': [
                {
                    'position_type': 'MEDICAL_DOCTOR',
                    'name': 'Médico General',
                    'is_critical': True,
                    'min_quantity': 1,
                    'required_qualifications': ['Título de Medicina']
                }
            ],
            'regulatory_requirements': {
                'standards': ['SOGCS'],
                'licenses': ['HABILITACION_CONSULTORIO'],
                'certifications': ['RETHUS']
            },
            'minimum_operating_hours': Decimal('8.0'),
            'requires_24_7_coverage': False
        }
    
    def test_service_creation(self):
        """Test creating a service."""
        service = Service.objects.create(**self.service_data)
        
        self.assertEqual(service.code, 'CONS-EXT-GEN')
        self.assertEqual(service.name, 'Consulta Externa General')
        self.assertEqual(service.category, 'CORE')
        self.assertTrue(service.is_mandatory)
        self.assertEqual(service.minimum_operating_hours, Decimal('8.0'))
        self.assertFalse(service.requires_24_7_coverage)
    
    def test_service_str_representation(self):
        """Test string representation of Service."""
        service = Service.objects.create(**self.service_data)
        expected_str = f"{service.sector.code} - {service.code}: {service.name}"
        self.assertEqual(str(service), expected_str)
    
    def test_service_position_requirements(self):
        """Test service position requirements."""
        service = Service.objects.create(**self.service_data)
        
        required_types = service.get_required_position_types()
        self.assertIn('MEDICAL_DOCTOR', required_types)
        
        min_staff = service.get_minimum_staff()
        self.assertEqual(min_staff, 1)
        
        critical_positions = service.get_critical_positions()
        self.assertEqual(len(critical_positions), 1)
        self.assertTrue(critical_positions[0]['is_critical'])
    
    def test_service_hierarchical_structure(self):
        """Test hierarchical service structure."""
        parent_service = Service.objects.create(**self.service_data)
        
        # Create child service
        child_data = self.service_data.copy()
        child_data.update({
            'code': 'CONS-ESPECIALIZADA',
            'name': 'Consulta Especializada',
            'parent_service': parent_service
        })
        child_service = Service.objects.create(**child_data)
        
        self.assertEqual(child_service.parent_service, parent_service)
        self.assertIn(child_service, parent_service.sub_services.all())
    
    def test_service_standards_validation(self):
        """Test service standards validation."""
        service = Service.objects.create(**self.service_data)
        
        # Test validation against required standards
        self.assertTrue(service.validates_against_standards(['SOGCS']))
        self.assertFalse(service.validates_against_standards(['ISO_14001']))  # Not in requirements


class ValidatorTests(TestCase):
    """Test cases for organizational chart validators."""
    
    def setUp(self):
        """Set up test data."""
        from apps.organization.validators import ValidatorFactory, HealthValidator, UniversalValidator
        
        self.validator_factory = ValidatorFactory
        self.health_validator = HealthValidator()
        self.universal_validator = UniversalValidator()
    
    def test_validator_factory_registration(self):
        """Test validator factory registration."""
        available_sectors = self.validator_factory.get_available_sectors()
        self.assertIn('UNIVERSAL', available_sectors)
        self.assertIn('HEALTH', available_sectors)
    
    def test_health_validator_sector_support(self):
        """Test health validator sector support."""
        self.assertTrue(self.health_validator.supports_sector('HEALTH'))
        self.assertTrue(self.health_validator.supports_sector('SALUD'))
        self.assertFalse(self.health_validator.supports_sector('EDUCATION'))
    
    def test_validator_factory_get_validator(self):
        """Test getting validator from factory."""
        health_validator = self.validator_factory.get_validator('HEALTH')
        self.assertIsInstance(health_validator, type(self.health_validator))
        
        universal_validator = self.validator_factory.get_validator('UNKNOWN')
        self.assertIsInstance(universal_validator, type(self.universal_validator))
    
    def test_validator_mandatory_requirements(self):
        """Test validator mandatory requirements."""
        health_committees = self.health_validator.get_mandatory_committees()
        self.assertIn('PATIENT_SAFETY_COMMITTEE', health_committees)
        self.assertIn('QUALITY_COMMITTEE', health_committees)
        
        health_positions = self.health_validator.get_mandatory_positions()
        position_types = [pos['position_type'] for pos in health_positions]
        self.assertIn('MEDICAL_DIRECTOR', position_types)
        self.assertIn('PATIENT_SAFETY_OFFICER', position_types)
    
    def test_validation_checklist(self):
        """Test getting validation checklist."""
        checklist = self.health_validator.get_validation_checklist()
        
        self.assertIsInstance(checklist, list)
        self.assertGreater(len(checklist), 0)
        
        # Check that checklist has required structure
        for item in checklist:
            self.assertIn('category', item)
            self.assertIn('items', item)
            self.assertIsInstance(item['items'], list)