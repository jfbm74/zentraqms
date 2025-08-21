"""
Tests for Health Services functionality.

This module provides comprehensive tests for health services models,
serializers, views, and import functionality according to REPS standards.
"""

import tempfile
import json
from decimal import Decimal
from datetime import date, datetime
from unittest.mock import patch, MagicMock
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.organization.models import (
    Organization,
    HealthOrganization,
    HeadquarterLocation,
    HealthServiceCatalog,
    SedeHealthService,
    ServiceImportLog
)
from apps.organization.serializers.health_services_serializers import (
    HealthServiceCatalogSerializer,
    SedeHealthServiceListSerializer,
    SedeHealthServiceDetailSerializer,
    SedeHealthServiceCreateUpdateSerializer,
    ServiceImportSerializer,
    ServiceImportLogSerializer
)
from apps.sogcs.services.reps_service_importer import REPSServiceImporter

User = get_user_model()


class HealthServiceCatalogModelTest(TestCase):
    """Test cases for HealthServiceCatalog model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_health_service_catalog(self):
        """Test creating a health service catalog entry."""
        catalog = HealthServiceCatalog.objects.create(
            service_code='101',
            service_name='Medicina General',
            service_group_code='1',
            service_group_name='Consulta Externa',
            min_complexity=1,
            max_complexity=3,
            allows_ambulatory=True,
            allows_hospital=False,
            created_by=self.user
        )
        
        self.assertEqual(catalog.service_code, '101')
        self.assertEqual(catalog.service_name, 'Medicina General')
        self.assertTrue(catalog.allows_ambulatory)
        self.assertFalse(catalog.allows_hospital)
        self.assertEqual(str(catalog), "101 - Medicina General")
    
    def test_catalog_validation(self):
        """Test catalog model validation."""
        # Test invalid complexity range
        catalog = HealthServiceCatalog(
            service_code='101',
            service_name='Test Service',
            service_group_code='1',
            service_group_name='Test Group',
            min_complexity=3,
            max_complexity=1,  # Invalid: min > max
            created_by=self.user
        )
        
        with self.assertRaises(Exception):
            catalog.clean()
    
    def test_service_code_uniqueness(self):
        """Test that service codes must be unique."""
        HealthServiceCatalog.objects.create(
            service_code='101',
            service_name='Service 1',
            service_group_code='1',
            service_group_name='Group 1',
            created_by=self.user
        )
        
        # Try to create another with same code
        with self.assertRaises(Exception):
            HealthServiceCatalog.objects.create(
                service_code='101',
                service_name='Service 2',
                service_group_code='1',
                service_group_name='Group 1',
                created_by=self.user
            )


class SedeHealthServiceModelTest(TestCase):
    """Test cases for SedeHealthService model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create organization and headquarters
        self.organization = Organization.objects.create(
            razon_social='Test IPS',
            nombre_comercial='Test IPS',
            nit='123456789',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='123456789012',
            naturaleza_juridica='privada',
            tipo_prestador='ips',
            nivel_complejidad='II',
            created_by=self.user
        )
        
        self.headquarters = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='123456789012-01',
            name='Sede Principal',
            sede_type='principal',
            department_code='11',
            department_name='Bogotá D.C.',
            municipality_code='11001',
            municipality_name='Bogotá',
            address='Calle 100 #15-20',
            phone_primary='3001234567',
            email='info@testips.com',
            administrative_contact='Test Admin',
            administrative_contact_phone='3007654321',
            administrative_contact_email='admin@testips.com',
            habilitation_status='habilitada',
            operational_status='activa',
            created_by=self.user
        )
        
        self.catalog = HealthServiceCatalog.objects.create(
            service_code='101',
            service_name='Medicina General',
            service_group_code='1',
            service_group_name='Consulta Externa',
            created_by=self.user
        )
    
    def test_create_sede_health_service(self):
        """Test creating a sede health service."""
        service = SedeHealthService.objects.create(
            headquarters=self.headquarters,
            service_catalog=self.catalog,
            service_code='101',
            service_name='Medicina General',
            service_group_code='1',
            service_group_name='Consulta Externa',
            ambulatory='SI',
            hospital='NO',
            distinctive_number='123456789012-01-101',
            complexity_level='BAJA',
            is_enabled=True,
            created_by=self.user
        )
        
        self.assertEqual(service.service_code, '101')
        self.assertEqual(service.ambulatory, 'SI')
        self.assertEqual(service.hospital, 'NO')
        self.assertEqual(service.complexity_level, 'BAJA')
        self.assertTrue(service.is_enabled)
        self.assertEqual(
            str(service),
            "101 - Medicina General (Sede Principal)"
        )
    
    def test_active_modalities_property(self):
        """Test active_modalities property."""
        service = SedeHealthService.objects.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Test Service',
            service_group_code='1',
            service_group_name='Test Group',
            ambulatory='SI',
            hospital='SI',
            mobile_unit='NO',
            domiciliary='SI',
            distinctive_number='123456789012-01-101',
            created_by=self.user
        )
        
        modalities = service.active_modalities
        expected = ['Ambulatorio', 'Hospitalario', 'Domiciliario']
        self.assertEqual(modalities, expected)
    
    def test_has_telemedicine_property(self):
        """Test has_telemedicine property."""
        service = SedeHealthService.objects.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Test Service',
            service_group_code='1',
            service_group_name='Test Group',
            distinctive_number='123456789012-01-101',
            telemedicine_modality={'modalidad_telemedicina': True},
            created_by=self.user
        )
        
        self.assertTrue(service.has_telemedicine)
    
    def test_requires_renewal_property(self):
        """Test requires_renewal property."""
        from datetime import timedelta
        from django.utils import timezone
        
        # Service with old audit date
        service = SedeHealthService.objects.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Test Service',
            service_group_code='1',
            service_group_name='Test Group',
            distinctive_number='123456789012-01-101',
            last_audit_date=timezone.now().date() - timedelta(days=400),
            created_by=self.user
        )
        
        self.assertTrue(service.requires_renewal)
    
    def test_service_validation(self):
        """Test service model validation."""
        # Test that at least one modality must be active
        service = SedeHealthService(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Test Service',
            service_group_code='1',
            service_group_name='Test Group',
            ambulatory='NO',
            hospital='NO',
            mobile_unit='NO',
            domiciliary='NO',
            other_extramural='NO',
            distinctive_number='123456789012-01-101',
            created_by=self.user
        )
        
        with self.assertRaises(Exception):
            service.clean()


class ServiceImportLogModelTest(TestCase):
    """Test cases for ServiceImportLog model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='Test IPS',
            nombre_comercial='Test IPS',
            nit='123456789',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='123456789012',
            naturaleza_juridica='privada',
            tipo_prestador='ips',
            nivel_complejidad='II',
            created_by=self.user
        )
    
    def test_create_import_log(self):
        """Test creating an import log."""
        log = ServiceImportLog.objects.create(
            organization=self.health_org,
            import_type='manual',
            file_name='servicios_reps.xls',
            file_size=1024000,
            status='pending',
            total_rows=100,
            created_by=self.user
        )
        
        self.assertEqual(log.import_type, 'manual')
        self.assertEqual(log.file_name, 'servicios_reps.xls')
        self.assertEqual(log.status, 'pending')
        self.assertEqual(log.total_rows, 100)
    
    def test_import_log_methods(self):
        """Test import log utility methods."""
        from django.utils import timezone
        
        log = ServiceImportLog.objects.create(
            organization=self.health_org,
            import_type='manual',
            file_name='test.xls',
            file_size=1000,
            created_by=self.user
        )
        
        # Test mark_as_processing
        log.mark_as_processing()
        self.assertEqual(log.status, 'processing')
        self.assertIsNotNone(log.started_at)
        
        # Test mark_as_completed
        log.mark_as_completed()
        self.assertEqual(log.status, 'completed')
        self.assertIsNotNone(log.completed_at)
        
        # Test success_rate property
        log.processed_rows = 100
        log.successful_rows = 90
        self.assertEqual(log.success_rate, 90.0)


class HealthServicesAPITest(APITestCase):
    """Test cases for Health Services API endpoints."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='Test IPS',
            nombre_comercial='Test IPS',
            nit='123456789',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='123456789012',
            naturaleza_juridica='privada',
            tipo_prestador='ips',
            nivel_complejidad='II',
            created_by=self.user
        )
        
        self.headquarters = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='123456789012-01',
            name='Sede Principal',
            sede_type='principal',
            department_code='11',
            department_name='Bogotá D.C.',
            municipality_code='11001',
            municipality_name='Bogotá',
            address='Calle 100 #15-20',
            phone_primary='3001234567',
            email='info@testips.com',
            administrative_contact='Test Admin',
            administrative_contact_phone='3007654321',
            administrative_contact_email='admin@testips.com',
            habilitation_status='habilitada',
            operational_status='activa',
            created_by=self.user
        )
        
        self.catalog = HealthServiceCatalog.objects.create(
            service_code='101',
            service_name='Medicina General',
            service_group_code='1',
            service_group_name='Consulta Externa',
            created_by=self.user
        )
        
        self.client.force_authenticate(user=self.user)
    
    def test_health_service_catalog_list(self):
        """Test listing health service catalog."""
        url = reverse('organization:health-service-catalog-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(
            response.data['results'][0]['service_code'],
            '101'
        )
    
    def test_sede_health_service_creation(self):
        """Test creating a sede health service via API."""
        url = reverse('organization:sede-health-services-list')
        data = {
            'headquarters': self.headquarters.id,
            'service_code': '101',
            'service_name': 'Medicina General',
            'service_group_code': '1',
            'service_group_name': 'Consulta Externa',
            'ambulatory': 'SI',
            'hospital': 'NO',
            'mobile_unit': 'NO',
            'domiciliary': 'NO',
            'other_extramural': 'NO',
            'complexity_level': 'BAJA',
            'distinctive_number': '123456789012-01-101',
            'is_enabled': True
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['service_code'], '101')
        self.assertEqual(response.data['ambulatory'], 'SI')
        
        # Verify service was created in database
        service = SedeHealthService.objects.get(
            distinctive_number='123456789012-01-101'
        )
        self.assertEqual(service.service_code, '101')
    
    def test_sede_health_service_list_filtering(self):
        """Test filtering sede health services."""
        # Create test services
        SedeHealthService.objects.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Medicina General',
            service_group_code='1',
            service_group_name='Consulta Externa',
            ambulatory='SI',
            complexity_level='BAJA',
            distinctive_number='123456789012-01-101',
            is_enabled=True,
            created_by=self.user
        )
        
        SedeHealthService.objects.create(
            headquarters=self.headquarters,
            service_code='201',
            service_name='Medicina Interna',
            service_group_code='1',
            service_group_name='Consulta Externa',
            ambulatory='SI',
            complexity_level='MEDIANA',
            distinctive_number='123456789012-01-201',
            is_enabled=False,
            created_by=self.user
        )
        
        url = reverse('organization:sede-health-services-list')
        
        # Mock organization user relationship for permission filtering
        from unittest.mock import Mock
        org_user_mock = Mock()
        org_user_mock.organization.healthorganization = self.health_org
        self.user.organization_users = Mock()
        self.user.organization_users.first.return_value = org_user_mock
        
        # Test filtering by enabled status
        response = self.client.get(url, {'enabled_only': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle both paginated and non-paginated responses
        if isinstance(response.data, dict):
            results = response.data.get('results', response.data)
        else:
            results = response.data
        self.assertEqual(len(results), 1)
        
        # Test filtering by complexity
        response = self.client.get(url, {'complexity': 'BAJA'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if isinstance(response.data, dict):
            results = response.data.get('results', response.data)
        else:
            results = response.data
        self.assertEqual(len(results), 1)
        
        # Test filtering by modality
        response = self.client.get(url, {'modality': 'ambulatory'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if isinstance(response.data, dict):
            results = response.data.get('results', response.data)
        else:
            results = response.data
        self.assertEqual(len(results), 2)
    
    def test_sede_health_service_statistics(self):
        """Test getting service statistics."""
        # Create test services
        SedeHealthService.objects.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Medicina General',
            service_group_code='1',
            service_group_name='Consulta Externa',
            ambulatory='SI',
            complexity_level='BAJA',
            distinctive_number='123456789012-01-101',
            is_enabled=True,
            created_by=self.user
        )
        
        url = reverse('organization:sede-health-services-statistics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_services'], 1)
        self.assertEqual(response.data['enabled_services'], 1)
        self.assertIn('by_group', response.data)
        self.assertIn('by_complexity', response.data)
    
    def test_bulk_service_operations(self):
        """Test bulk operations on services."""
        # Mock organization user relationship
        from unittest.mock import Mock
        org_user_mock = Mock()
        org_user_mock.organization.healthorganization = self.health_org
        self.user.organization_users = Mock()
        self.user.organization_users.first.return_value = org_user_mock
        
        # Create test services
        service1 = SedeHealthService.objects.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Service 1',
            service_group_code='1',
            service_group_name='Group 1',
            distinctive_number='123456789012-01-101',
            is_enabled=True,
            created_by=self.user
        )
        
        service2 = SedeHealthService.objects.create(
            headquarters=self.headquarters,
            service_code='102',
            service_name='Service 2',
            service_group_code='1',
            service_group_name='Group 1',
            distinctive_number='123456789012-01-102',
            is_enabled=True,
            created_by=self.user
        )
        
        url = reverse('organization:sede-health-services-bulk-action')
        data = {
            'service_ids': [service1.id, service2.id],
            'action': 'disable'
        }
        
        # Patch the view to return our test services
        with patch('apps.organization.views.health_services_views.SedeHealthServiceViewSet.get_queryset') as mock_queryset:
            mock_queryset.return_value = SedeHealthService.objects.filter(
                id__in=[service1.id, service2.id]
            )
            response = self.client.post(url, data, format='json')
        
        # Debug response if test fails
        if response.status_code != status.HTTP_200_OK:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['affected'], 2)
        
        # Verify services were disabled
        service1.refresh_from_db()
        service2.refresh_from_db()
        self.assertFalse(service1.is_enabled)
        self.assertFalse(service2.is_enabled)


class REPSServiceImporterTest(TransactionTestCase):
    """Test cases for REPS service importer."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='Test IPS',
            nombre_comercial='Test IPS',
            nit='123456789',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='123456789012',
            naturaleza_juridica='privada',
            tipo_prestador='ips',
            nivel_complejidad='II',
            created_by=self.user
        )
    
    def test_importer_initialization(self):
        """Test REPS importer initialization."""
        importer = REPSServiceImporter(
            organization=self.health_org,
            user=self.user
        )
        
        self.assertEqual(importer.organization, self.health_org)
        self.assertEqual(importer.user, self.user)
        self.assertTrue(importer.update_existing)
        self.assertEqual(importer.stats['total_rows'], 0)
    
    def test_clean_value_method(self):
        """Test value cleaning method."""
        importer = REPSServiceImporter(
            organization=self.health_org,
            user=self.user
        )
        
        # Test cleaning various values
        self.assertEqual(importer._clean_value('  test  '), 'test')
        self.assertEqual(importer._clean_value(None), '')
        self.assertEqual(importer._clean_value(''), '')
        self.assertEqual(importer._clean_value(123), '123')
    
    def test_normalize_si_no_method(self):
        """Test SI/NO normalization method."""
        importer = REPSServiceImporter(
            organization=self.health_org,
            user=self.user
        )
        
        # Test various SI values
        self.assertEqual(importer._normalize_si_no('SI'), 'SI')
        self.assertEqual(importer._normalize_si_no('Sí'), 'SI')
        self.assertEqual(importer._normalize_si_no('YES'), 'SI')
        self.assertEqual(importer._normalize_si_no('1'), 'SI')
        
        # Test various NO values
        self.assertEqual(importer._normalize_si_no('NO'), 'NO')
        self.assertEqual(importer._normalize_si_no('N'), 'NO')
        self.assertEqual(importer._normalize_si_no('0'), 'NO')
        
        # Test unknown values
        self.assertEqual(importer._normalize_si_no('UNKNOWN'), 'SD')
        self.assertEqual(importer._normalize_si_no(None), 'SD')
    
    def test_normalize_complexity_method(self):
        """Test complexity normalization method."""
        importer = REPSServiceImporter(
            organization=self.health_org,
            user=self.user
        )
        
        self.assertEqual(importer._normalize_complexity('BAJA'), 'BAJA')
        self.assertEqual(importer._normalize_complexity('LOW'), 'BAJA')
        self.assertEqual(importer._normalize_complexity('MEDIANA'), 'MEDIANA')
        self.assertEqual(importer._normalize_complexity('MEDIUM'), 'MEDIANA')
        self.assertEqual(importer._normalize_complexity('ALTA'), 'ALTA')
        self.assertEqual(importer._normalize_complexity('HIGH'), 'ALTA')
        self.assertEqual(importer._normalize_complexity('UNKNOWN'), 'SD')
    
    @patch('pandas.read_html')
    def test_read_reps_file_html(self, mock_read_html):
        """Test reading REPS HTML file."""
        import pandas as pd
        
        # Mock HTML table data
        mock_df = pd.DataFrame({
            'depa_nombre': ['Bogotá D.C.'],
            'muni_nombre': ['Bogotá'],
            'numero_sede': ['01'],
            'sede_nombre': ['Sede Principal'],
            'serv_codigo': ['101'],
            'serv_nombre': ['Medicina General']
        })
        mock_read_html.return_value = [mock_df]
        
        importer = REPSServiceImporter(
            organization=self.health_org,
            user=self.user
        )
        
        with tempfile.NamedTemporaryFile(suffix='.html') as tmp_file:
            tmp_file.write(b'<table><tr><td>test</td></tr></table>')
            tmp_file.flush()
            
            df = importer._read_reps_file(tmp_file.name)
            
            self.assertEqual(len(df), 1)
            self.assertIn('depa_nombre', df.columns)
            self.assertEqual(df.iloc[0]['serv_codigo'], '101')
    
    def test_extract_service_data(self):
        """Test service data extraction from REPS row."""
        import pandas as pd
        
        importer = REPSServiceImporter(
            organization=self.health_org,
            user=self.user
        )
        
        # Create mock REPS row
        row_data = {
            'serv_codigo': '101',
            'serv_nombre': 'Medicina General',
            'grse_codigo': '1',
            'grse_nombre': 'Consulta Externa',
            'ambulatorio': 'SI',
            'hospitalario': 'NO',
            'unidad_movil': 'NO',
            'domiciliario': 'NO',
            'otras_extramural': 'NO',
            'complejidad_baja': 'SI',
            'complejidad_media': 'NO',
            'complejidad_alta': 'NO',
            'complejidades': 'BAJA',
            'numero_distintivo': '123456789012-01-101',
            'fecha_apertura': '20230101',
            'observaciones_serv_Res3100_2019': 'Observaciones test',
            'gerente': 'Test Manager'
        }
        
        row = pd.Series(row_data)
        service_data = importer._extract_service_data(row)
        
        self.assertEqual(service_data['service_code'], '101')
        self.assertEqual(service_data['service_name'], 'Medicina General')
        self.assertEqual(service_data['ambulatory'], 'SI')
        self.assertEqual(service_data['hospital'], 'NO')
        self.assertEqual(service_data['complexity_level'], 'BAJA')
        self.assertEqual(service_data['distinctive_number'], '123456789012-01-101')
        self.assertEqual(service_data['observations'], 'Observaciones test')
        self.assertEqual(service_data['manager_name'], 'Test Manager')


class HealthServicesSerializerTest(TestCase):
    """Test cases for Health Services serializers."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='Test IPS',
            nombre_comercial='Test IPS',
            nit='123456789',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='123456789012',
            naturaleza_juridica='privada',
            tipo_prestador='ips',
            nivel_complejidad='II',
            created_by=self.user
        )
        
        self.headquarters = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='123456789012-01',
            name='Sede Principal',
            sede_type='principal',
            department_code='11',
            department_name='Bogotá D.C.',
            municipality_code='11001',
            municipality_name='Bogotá',
            address='Calle 100 #15-20',
            phone_primary='3001234567',
            email='info@testips.com',
            administrative_contact='Test Admin',
            administrative_contact_phone='3007654321',
            administrative_contact_email='admin@testips.com',
            habilitation_status='habilitada',
            operational_status='activa',
            created_by=self.user
        )
    
    def test_sede_health_service_create_serializer(self):
        """Test SedeHealthServiceCreateUpdateSerializer."""
        data = {
            'headquarters': self.headquarters.id,
            'service_code': '101',
            'service_name': 'Medicina General',
            'service_group_code': '1',
            'service_group_name': 'Consulta Externa',
            'ambulatory': 'SI',
            'hospital': 'NO',
            'mobile_unit': 'NO',
            'domiciliary': 'NO',
            'other_extramural': 'NO',
            'complexity_level': 'BAJA',
            'distinctive_number': '123456789012-01-101',
            'is_enabled': True
        }
        
        serializer = SedeHealthServiceCreateUpdateSerializer(
            data=data,
            context={'request': MagicMock(user=self.user)}
        )
        
        self.assertTrue(serializer.is_valid())
        service = serializer.save()
        
        self.assertEqual(service.service_code, '101')
        self.assertEqual(service.headquarters, self.headquarters)
        self.assertEqual(service.created_by, self.user)
    
    def test_sede_health_service_validation(self):
        """Test SedeHealthService validation."""
        # Test validation with all modalities set to NO
        data = {
            'headquarters': self.headquarters.id,
            'service_code': '101',
            'service_name': 'Test Service',
            'service_group_code': '1',
            'service_group_name': 'Test Group',
            'ambulatory': 'NO',
            'hospital': 'NO',
            'mobile_unit': 'NO',
            'domiciliary': 'NO',
            'other_extramural': 'NO',
            'distinctive_number': '123456789012-01-101'
        }
        
        serializer = SedeHealthServiceCreateUpdateSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('ambulatory', serializer.errors)
    
    def test_service_import_serializer(self):
        """Test ServiceImportSerializer."""
        # Create mock Excel file
        file_content = b'mock excel content'
        uploaded_file = SimpleUploadedFile(
            'servicios_reps.xls',
            file_content,
            content_type='application/vnd.ms-excel'
        )
        
        data = {
            'file': uploaded_file,
            'update_existing': True
        }
        
        serializer = ServiceImportSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['update_existing'], True)
    
    def test_service_import_file_validation(self):
        """Test ServiceImportSerializer file validation."""
        # Test invalid file extension
        uploaded_file = SimpleUploadedFile(
            'invalid.txt',
            b'test content',
            content_type='text/plain'
        )
        
        data = {'file': uploaded_file}
        serializer = ServiceImportSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('file', serializer.errors)
        
        # Test empty file
        empty_file = SimpleUploadedFile(
            'empty.xls',
            b'',
            content_type='application/vnd.ms-excel'
        )
        
        data = {'file': empty_file}
        serializer = ServiceImportSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('file', serializer.errors)


class HealthServicesIntegrationTest(APITestCase):
    """Integration tests for complete health services workflow."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='Test IPS',
            nombre_comercial='Test IPS',
            nit='123456789',
            created_by=self.user,
            updated_by=self.user
        )
        
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='123456789012',
            naturaleza_juridica='privada',
            tipo_prestador='ips',
            nivel_complejidad='II',
            created_by=self.user
        )
        
        self.headquarters = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='123456789012-01',
            name='Sede Principal',
            sede_type='principal',
            department_code='11',
            department_name='Bogotá D.C.',
            municipality_code='11001',
            municipality_name='Bogotá',
            address='Calle 100 #15-20',
            phone_primary='3001234567',
            email='info@testips.com',
            administrative_contact='Test Admin',
            administrative_contact_phone='3007654321',
            administrative_contact_email='admin@testips.com',
            habilitation_status='habilitada',
            operational_status='activa',
            created_by=self.user
        )
        
        self.client.force_authenticate(user=self.user)
    
    def test_complete_service_management_workflow(self):
        """Test complete workflow from catalog to service management."""
        # 1. Create catalog entry
        catalog = HealthServiceCatalog.objects.create(
            service_code='101',
            service_name='Medicina General',
            service_group_code='1',
            service_group_name='Consulta Externa',
            allows_ambulatory=True,
            min_complexity=1,
            max_complexity=3,
            created_by=self.user
        )
        
        # 2. Create service at headquarters
        service_url = reverse('organization:sede-health-services-list')
        service_data = {
            'headquarters': self.headquarters.id,
            'service_code': '101',
            'service_name': 'Medicina General',
            'service_group_code': '1',
            'service_group_name': 'Consulta Externa',
            'ambulatory': 'SI',
            'hospital': 'NO',
            'mobile_unit': 'NO',
            'domiciliary': 'NO',
            'other_extramural': 'NO',
            'complexity_level': 'BAJA',
            'distinctive_number': '123456789012-01-101',
            'is_enabled': True
        }
        
        response = self.client.post(service_url, service_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Get service_id from created service
        service = SedeHealthService.objects.get(distinctive_number='123456789012-01-101')
        service_id = service.id
        
        # 3. Retrieve service details
        detail_url = reverse(
            'organization:sede-health-services-detail',
            kwargs={'pk': service_id}
        )
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['service_code'], '101')
        
        # 4. Update service
        update_data = {
            'observations': 'Updated observations',
            'compliance_percentage': '85.5'
        }
        response = self.client.patch(detail_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['observations'], 'Updated observations')
        
        # 5. Test statistics endpoint
        stats_url = reverse('organization:sede-health-services-statistics')
        response = self.client.get(stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_services'], 1)
        self.assertEqual(response.data['enabled_services'], 1)
        
        # 6. Test headquarters services endpoint
        hq_services_url = reverse(
            'organization:sede-health-services-by-headquarters',
            kwargs={'headquarters_id': self.headquarters.id}
        )
        response = self.client.get(hq_services_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['statistics']['total_services'], 1)
        
        # 7. Test service duplication
        duplicate_url = reverse(
            'organization:sede-health-services-duplicate',
            kwargs={'pk': service_id}
        )
        duplicate_data = {
            'target_headquarters_id': self.headquarters.id
        }
        response = self.client.post(duplicate_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 8. Verify we now have 2 services
        response = self.client.get(stats_url)
        self.assertEqual(response.data['total_services'], 2)


# Test data fixtures for import testing
SAMPLE_REPS_DATA = {
    'depa_nombre': 'Bogotá D.C.',
    'muni_nombre': 'Bogotá',
    'numero_sede': '01',
    'sede_nombre': 'Sede Principal Test',
    'direccion': 'Calle 100 #15-20',
    'telefono': '3001234567',
    'email': 'info@testips.com',
    'nits_nit': '123456789',
    'serv_codigo': '101',
    'serv_nombre': 'Medicina General',
    'grse_codigo': '1',
    'grse_nombre': 'Consulta Externa',
    'ambulatorio': 'SI',
    'hospitalario': 'NO',
    'unidad_movil': 'NO',
    'domiciliario': 'NO',
    'complejidad_baja': 'SI',
    'complejidad_media': 'NO',
    'complejidad_alta': 'NO',
    'numero_distintivo': '123456789012-01-101',
    'fecha_apertura': '20230101',
    'gerente': 'Test Manager'
}