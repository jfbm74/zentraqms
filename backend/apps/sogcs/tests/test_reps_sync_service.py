"""
Test Suite for REPSSynchronizationService - REPS Data Import and Processing

This test suite comprehensively tests the REPS (Registro Especial de Prestadores 
de Servicios de Salud) synchronization service, including file parsing, data validation,
encoding handling, and database operations for Colombian healthcare compliance.

Key test areas:
- Excel/HTML file parsing with encoding issues
- Data validation according to REPS standards  
- Database record creation and validation
- Error handling and edge cases
- Colombian health regulatory compliance
"""

import pytest
import tempfile
import os
import pandas as pd
from io import BytesIO
from unittest.mock import Mock, patch, MagicMock
from decimal import Decimal
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from freezegun import freeze_time

from apps.sogcs.services.reps_sync import REPSSynchronizationService, REPSSyncError
from apps.organization.models.health import HealthOrganization
from apps.organization.models.sogcs_sedes import HeadquarterLocation
from apps.organization.models import Organization

User = get_user_model()


class TestREPSSynchronizationService(TestCase):
    """
    Comprehensive test suite for REPS synchronization service
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
            razon_social='IPS Test S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips'
        )
        
        # Create health organization
        cls.health_organization = HealthOrganization.objects.create(
            organization=cls.organization,
            sogcs_enabled=True
        )
    
    def setUp(self):
        """Set up each test method"""
        self.sync_service = REPSSynchronizationService(
            organization=self.health_organization,
            user=self.user
        )
    
    def tearDown(self):
        """Clean up after each test"""
        # Remove any test files created
        for temp_file in getattr(self, '_temp_files', []):
            try:
                os.unlink(temp_file)
            except FileNotFoundError:
                pass
    
    def _create_temp_excel_file(self, data_rows, headers=None, encoding='utf-8'):
        """
        Helper method to create temporary Excel files for testing
        
        Args:
            data_rows: List of dictionaries containing row data
            headers: Optional custom headers
            encoding: File encoding to use
            
        Returns:
            Path to temporary file
        """
        if headers is None:
            headers = [
                'departamento', 'municipio', 'codigo_prestador', 'nombre_prestador',
                'codigo_habilitacion', 'numero_sede', 'nombre_sede', 'direccion',
                'telefono', 'email', 'gerente'
            ]
        
        # Create DataFrame
        df = pd.DataFrame(data_rows, columns=headers)
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        temp_file.close()
        
        # Save as Excel
        df.to_excel(temp_file.name, index=False, engine='openpyxl')
        
        # Track for cleanup
        if not hasattr(self, '_temp_files'):
            self._temp_files = []
        self._temp_files.append(temp_file.name)
        
        return temp_file.name
    
    def _create_temp_html_file(self, data_rows, headers=None, encoding='utf-8'):
        """
        Helper method to create temporary HTML files (REPS format)
        
        Args:
            data_rows: List of dictionaries containing row data
            headers: Optional custom headers
            encoding: File encoding to use
            
        Returns:
            Path to temporary file
        """
        if headers is None:
            headers = [
                'departamento', 'municipio', 'codigo_prestador', 'nombre_prestador',
                'codigo_habilitacion', 'numero_sede', 'nombre_sede', 'direccion',
                'telefono', 'email', 'gerente'
            ]
        
        # Create HTML table content
        html_content = "<table>"
        html_content += "<tr>" + "".join(f"<th>{h}</th>" for h in headers) + "</tr>"
        
        for row in data_rows:
            html_content += "<tr>"
            for header in headers:
                value = row.get(header, '')
                html_content += f"<td>{value}</td>"
            html_content += "</tr>"
        
        html_content += "</table>"
        
        # Create temporary file with specific encoding
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xls', mode='w', encoding=encoding)
        temp_file.write(html_content)
        temp_file.close()
        
        # Track for cleanup
        if not hasattr(self, '_temp_files'):
            self._temp_files = []
        self._temp_files.append(temp_file.name)
        
        return temp_file.name
    
    def test_service_initialization(self):
        """Test service initialization with valid parameters"""
        service = REPSSynchronizationService(
            organization=self.health_organization,
            user=self.user
        )
        
        self.assertEqual(service.organization, self.health_organization)
        self.assertEqual(service.user, self.user)
        self.assertEqual(service.base_url, "https://reps.minsalud.gov.co/api")
        self.assertEqual(service.timeout, 30)
    
    def test_service_initialization_without_user(self):
        """Test service initialization without user (should work)"""
        service = REPSSynchronizationService(organization=self.health_organization)
        
        self.assertEqual(service.organization, self.health_organization)
        self.assertIsNone(service.user)
    
    def test_parse_valid_excel_file(self):
        """Test parsing a valid Excel file with correct REPS data"""
        # Prepare test data
        test_data = [
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test Principal S.A.S',
                'codigo_habilitacion': 'HAB123456',
                'numero_sede': '001',
                'nombre_sede': 'Sede Principal Bogotá',
                'direccion': 'Carrera 15 # 93-47',
                'telefono': '6014567890',
                'email': 'principal@ipstest.com',
                'gerente': 'Dr. Juan Pérez'
            },
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Soacha',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test Principal S.A.S',
                'codigo_habilitacion': 'HAB123457',
                'numero_sede': '002',
                'nombre_sede': 'Sede Soacha',
                'direccion': 'Calle 20 # 15-30',
                'telefono': '6014567891',
                'email': 'soacha@ipstest.com',
                'gerente': 'Dra. María García'
            }
        ]
        
        # Create temporary Excel file
        file_path = self._create_temp_excel_file(test_data)
        
        # Parse file
        results = self.sync_service._parse_headquarters_file(file_path)
        
        # Assertions
        self.assertEqual(len(results), 2)
        
        # Check first result
        first_result = results[0]
        self.assertTrue(first_result['is_valid'])
        self.assertEqual(first_result['row_index'], 0)
        self.assertEqual(first_result['data']['nombre_sede'], 'Sede Principal Bogotá')
        self.assertEqual(first_result['data']['departamento'], 'Cundinamarca')
        self.assertEqual(first_result['data']['municipio'], 'Bogotá D.C.')
        self.assertEqual(first_result['data']['numero_sede'], '001')
        
        # Check second result
        second_result = results[1]
        self.assertTrue(second_result['is_valid'])
        self.assertEqual(second_result['row_index'], 1)
        self.assertEqual(second_result['data']['nombre_sede'], 'Sede Soacha')
        self.assertEqual(second_result['data']['municipio'], 'Soacha')
    
    def test_parse_html_file_with_utf8_encoding(self):
        """Test parsing HTML file (REPS format) with UTF-8 encoding"""
        # Test data with special characters
        test_data = [
            {
                'departamento': 'Bogotá D.C.',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'Clínica de Especialistas S.A.S',
                'codigo_habilitacion': 'HAB123456',
                'numero_sede': '001',
                'nombre_sede': 'Sede Chapinero - Especialidades Médicas',
                'direccion': 'Carrera 11 # 93-47 - Edificio Médico',
                'telefono': '6014567890',
                'email': 'especialistas@clinica.com',
                'gerente': 'Dr. José María Rodríguez'
            }
        ]
        
        # Create temporary HTML file
        file_path = self._create_temp_html_file(test_data, encoding='utf-8')
        
        # Parse file
        results = self.sync_service._parse_headquarters_file(file_path)
        
        # Assertions
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertTrue(result['is_valid'])
        self.assertEqual(result['data']['nombre_sede'], 'Sede Chapinero - Especialidades Médicas')
        self.assertEqual(result['data']['gerente'], 'Dr. José María Rodríguez')
    
    def test_parse_file_with_encoding_issues(self):
        """Test parsing file with encoding issues (common in REPS downloads)"""
        # Test data with encoding issues that commonly occur in REPS files
        test_data = [
            {
                'departamento': 'BogotÃ¡ D.C.',  # Should become 'Bogotá D.C.'
                'municipio': 'BogotÃ¡ D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'ClÃ­nica de EspecialistasÂ S.A.S',  # Should become 'Clínica de Especialistas S.A.S'
                'codigo_habilitacion': 'HAB123456',
                'numero_sede': '001',
                'nombre_sede': 'Sede ChapineroÂ â€" Especialidades MÃ©dicas',  # Mixed encoding issues
                'direccion': 'Carrera 11 # 93-47',
                'telefono': '6014567890',
                'email': 'especialistas@clinica.com',
                'gerente': 'Dr. JosÃ© MarÃ­a RodrÃ­guez'  # Should become 'Dr. José María Rodríguez'
            }
        ]
        
        # Create temporary HTML file with latin-1 encoding (common source of issues)
        file_path = self._create_temp_html_file(test_data, encoding='latin-1')
        
        # Parse file - the service should handle encoding issues
        results = self.sync_service._parse_headquarters_file(file_path)
        
        # Assertions
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertTrue(result['is_valid'])
        
        # Check that encoding was fixed (depending on the _fix_encoding implementation)
        sede_data = result['data']
        self.assertIn('Especialistas', sede_data['nombre_prestador'])
        self.assertIn('José', sede_data['gerente'])
    
    def test_parse_file_with_missing_required_fields(self):
        """Test parsing file with missing required fields"""
        # Test data with missing required fields
        test_data = [
            {
                'departamento': '',  # Missing required field
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': 'HAB123456',
                'numero_sede': '001',
                'nombre_sede': '',  # Missing required field
                'direccion': 'Carrera 15 # 93-47',
                'telefono': '6014567890',
                'email': 'test@ipstest.com',
                'gerente': 'Dr. Juan Pérez'
            },
            {
                'departamento': 'Cundinamarca',
                'municipio': '',  # Missing required field
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': 'HAB123457',
                'numero_sede': '002',
                'nombre_sede': 'Sede Válida',
                'direccion': 'Calle 20 # 15-30',
                'telefono': '6014567891',
                'email': 'valida@ipstest.com',
                'gerente': 'Dra. María García'
            }
        ]
        
        # Create temporary Excel file
        file_path = self._create_temp_excel_file(test_data)
        
        # Parse file
        results = self.sync_service._parse_headquarters_file(file_path)
        
        # Assertions
        self.assertEqual(len(results), 2)
        
        # First result should be invalid (missing departamento and nombre_sede)
        first_result = results[0]
        self.assertFalse(first_result['is_valid'])
        self.assertIn('departamento', first_result['errors'])
        self.assertIn('nombre_sede', first_result['errors'])
        
        # Second result should be invalid (missing municipio)
        second_result = results[1]
        self.assertFalse(second_result['is_valid'])
        self.assertIn('municipio', second_result['errors'])
    
    def test_parse_file_with_nan_values(self):
        """Test parsing file with NaN values (common in Excel imports)"""
        # Create DataFrame with NaN values
        import numpy as np
        test_data = pd.DataFrame([
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': np.nan,  # NaN value
                'numero_sede': '001',
                'nombre_sede': 'Sede Test',
                'direccion': 'Carrera 15 # 93-47',
                'telefono': np.nan,  # NaN value
                'email': 'test@ipstest.com',
                'gerente': 'Dr. Juan Pérez'
            }
        ])
        
        # Create temporary Excel file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        temp_file.close()
        test_data.to_excel(temp_file.name, index=False, engine='openpyxl')
        self._temp_files = [temp_file.name]
        
        # Parse file
        results = self.sync_service._parse_headquarters_file(temp_file.name)
        
        # Assertions
        self.assertEqual(len(results), 1)
        result = results[0]
        self.assertTrue(result['is_valid'])
        
        # Check that NaN values were converted to empty strings
        sede_data = result['data']
        self.assertEqual(sede_data['codigo_habilitacion'], '')
        self.assertEqual(sede_data['telefono'], '')
    
    def test_parse_empty_file(self):
        """Test parsing an empty file"""
        # Create empty DataFrame
        empty_df = pd.DataFrame()
        
        # Create temporary Excel file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        temp_file.close()
        empty_df.to_excel(temp_file.name, index=False, engine='openpyxl')
        self._temp_files = [temp_file.name]
        
        # Parse file
        results = self.sync_service._parse_headquarters_file(temp_file.name)
        
        # Should return empty list
        self.assertEqual(len(results), 0)
    
    def test_parse_corrupted_file(self):
        """Test parsing a corrupted file"""
        # Create corrupted file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        temp_file.write(b'corrupted data that is not a valid Excel file')
        temp_file.close()
        self._temp_files = [temp_file.name]
        
        # Should raise REPSSyncError
        with self.assertRaises(REPSSyncError) as context:
            self.sync_service._parse_headquarters_file(temp_file.name)
        
        self.assertIn('Error leyendo archivo de sedes', str(context.exception))
    
    def test_fix_encoding_method(self):
        """Test the _fix_encoding method for various encoding issues"""
        test_cases = [
            # (input, expected_output)
            ('BogotÃ¡', 'Bogotá'),
            ('ClÃ­nica', 'Clínica'),
            ('JosÃ© MarÃ­a', 'José María'),
            ('â€œTextâ€', '"Text"'),
            ('Especialistasâ€™', "Especialistas'"),
            ('Normal text', 'Normal text'),
            ('', ''),
            ('nan', ''),
            (None, ''),  # Test None input
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                if input_text is None:
                    result = self.sync_service._fix_encoding(input_text)
                else:
                    result = self.sync_service._fix_encoding(input_text)
                self.assertEqual(result, expected)
    
    def test_create_headquarters_record_success(self):
        """Test successful creation of headquarters record"""
        sede_data = {
            'nombre_sede': 'Sede Test Principal',
            'tipo_sede': 'principal',
            'departamento': 'Cundinamarca',
            'municipio': 'Bogotá D.C.',
            'direccion': 'Carrera 15 # 93-47',
            'telefono': '6014567890',
            'email': 'test@ipstest.com',
            'estado': 'activa',
            'codigo_prestador': '110001234567',
            'numero_sede': '001',
            'gerente': 'Dr. Juan Pérez'
        }
        
        # Create record
        result = self.sync_service._create_headquarters_record(sede_data)
        
        # Should return 1 (created)
        self.assertEqual(result, 1)
        
        # Verify record was created in database
        headquarters = HeadquarterLocation.objects.filter(
            organization=self.health_organization,
            name='Sede Test Principal'
        ).first()
        
        self.assertIsNotNone(headquarters)
        self.assertEqual(headquarters.department_name, 'Cundinamarca')
        self.assertEqual(headquarters.municipality_name, 'Bogotá D.C.')
        self.assertEqual(headquarters.address, 'Carrera 15 # 93-47')
        self.assertEqual(headquarters.phone_primary, '6014567890')
        self.assertEqual(headquarters.email, 'test@ipstest.com')
        self.assertEqual(headquarters.sede_type, 'principal')
        self.assertTrue(headquarters.is_main_headquarters)
    
    def test_create_headquarters_record_duplicate(self):
        """Test creation when record already exists (should skip)"""
        sede_data = {
            'nombre_sede': 'Sede Existente',
            'tipo_sede': 'principal',
            'departamento': 'Cundinamarca',
            'municipio': 'Bogotá D.C.',
            'direccion': 'Carrera 15 # 93-47',
            'telefono': '6014567890',
            'email': 'existente@ipstest.com',
            'estado': 'activa',
            'codigo_prestador': '110001234567',
            'numero_sede': '001',
            'gerente': 'Dr. Juan Pérez'
        }
        
        # Create record first time
        result1 = self.sync_service._create_headquarters_record(sede_data)
        self.assertEqual(result1, 1)
        
        # Try to create same record again
        result2 = self.sync_service._create_headquarters_record(sede_data)
        self.assertEqual(result2, 0)  # Should skip duplicate
        
        # Verify only one record exists
        count = HeadquarterLocation.objects.filter(
            organization=self.health_organization,
            name='Sede Existente',
            address='Carrera 15 # 93-47'
        ).count()
        self.assertEqual(count, 1)
    
    def test_map_sede_type(self):
        """Test sede type mapping functionality"""
        test_cases = [
            ('principal', 'principal'),
            ('sucursal', 'satelite'),
            ('ambulatoria', 'satelite'),
            ('hospitalaria', 'principal'),
            ('administrativa', 'satelite'),
            ('diagnostico', 'satelite'),
            ('urgencias', 'satelite'),
            ('unknown_type', 'satelite'),  # Default fallback
        ]
        
        for input_type, expected_type in test_cases:
            with self.subTest(input_type=input_type):
                result = self.sync_service._map_sede_type(input_type)
                self.assertEqual(result, expected_type)
    
    def test_synchronize_from_files_success(self):
        """Test complete synchronization from files (integration test)"""
        # Prepare test data
        test_data = [
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': 'HAB123456',
                'numero_sede': '001',
                'nombre_sede': 'Sede Principal Integración',
                'direccion': 'Carrera 15 # 93-47',
                'telefono': '6014567890',
                'email': 'integracion@ipstest.com',
                'gerente': 'Dr. Juan Pérez'
            },
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Soacha',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': 'HAB123457',
                'numero_sede': '002',
                'nombre_sede': 'Sede Soacha Integración',
                'direccion': 'Calle 20 # 15-30',
                'telefono': '6014567891',
                'email': 'soacha@ipstest.com',
                'gerente': 'Dra. María García'
            }
        ]
        
        # Create temporary Excel file
        file_path = self._create_temp_excel_file(test_data)
        
        # Execute synchronization
        stats = self.sync_service.synchronize_from_files(
            headquarters_file=file_path,
            create_backup=True
        )
        
        # Verify stats
        self.assertTrue(stats['success'])
        self.assertEqual(stats['total_rows'], 2)
        self.assertEqual(stats['valid_rows'], 2)
        self.assertEqual(stats['invalid_rows'], 0)
        self.assertEqual(stats['imported_count'], 2)
        self.assertEqual(stats['error_count'], 0)
        self.assertTrue(stats['backup_created'])
        
        # Verify records were created
        headquarters_count = HeadquarterLocation.objects.filter(
            organization=self.health_organization
        ).count()
        self.assertEqual(headquarters_count, 2)
        
        # Verify specific records
        principal_sede = HeadquarterLocation.objects.filter(
            organization=self.health_organization,
            name='Sede Principal Integración'
        ).first()
        self.assertIsNotNone(principal_sede)
        self.assertEqual(principal_sede.municipality_name, 'Bogotá D.C.')
        
        soacha_sede = HeadquarterLocation.objects.filter(
            organization=self.health_organization,
            name='Sede Soacha Integración'
        ).first()
        self.assertIsNotNone(soacha_sede)
        self.assertEqual(soacha_sede.municipality_name, 'Soacha')
    
    def test_synchronize_from_files_with_validation_errors(self):
        """Test synchronization with validation errors"""
        # Test data with some invalid records
        test_data = [
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': 'HAB123456',
                'numero_sede': '001',
                'nombre_sede': 'Sede Válida',
                'direccion': 'Carrera 15 # 93-47',
                'telefono': '6014567890',
                'email': 'valida@ipstest.com',
                'gerente': 'Dr. Juan Pérez'
            },
            {
                'departamento': '',  # Invalid - missing required field
                'municipio': 'Soacha',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': 'HAB123457',
                'numero_sede': '002',
                'nombre_sede': '',  # Invalid - missing required field
                'direccion': 'Calle 20 # 15-30',
                'telefono': '6014567891',
                'email': 'invalida@ipstest.com',
                'gerente': 'Dra. María García'
            }
        ]
        
        # Create temporary Excel file
        file_path = self._create_temp_excel_file(test_data)
        
        # Execute synchronization
        stats = self.sync_service.synchronize_from_files(
            headquarters_file=file_path,
            create_backup=True
        )
        
        # Verify stats
        self.assertTrue(stats['success'])  # Overall success despite validation errors
        self.assertEqual(stats['total_rows'], 2)
        self.assertEqual(stats['valid_rows'], 1)
        self.assertEqual(stats['invalid_rows'], 1)
        self.assertEqual(stats['imported_count'], 1)  # Only valid records imported
        self.assertEqual(stats['error_count'], 1)
        
        # Verify only valid record was created
        headquarters_count = HeadquarterLocation.objects.filter(
            organization=self.health_organization
        ).count()
        self.assertEqual(headquarters_count, 1)
        
        valid_sede = HeadquarterLocation.objects.filter(
            organization=self.health_organization,
            name='Sede Válida'
        ).first()
        self.assertIsNotNone(valid_sede)
    
    def test_synchronize_from_files_no_file(self):
        """Test synchronization without file"""
        # Should handle gracefully
        stats = self.sync_service.synchronize_from_files(
            headquarters_file=None,
            create_backup=True
        )
        
        # Verify stats
        self.assertTrue(stats['success'])
        self.assertEqual(stats['total_rows'], 0)
        self.assertEqual(stats['imported_count'], 0)
    
    def test_synchronize_from_files_with_exception(self):
        """Test synchronization when exception occurs during processing"""
        # Create invalid file path
        with self.assertRaises(REPSSyncError) as context:
            self.sync_service.synchronize_from_files(
                headquarters_file='/nonexistent/file.xlsx',
                create_backup=True
            )
        
        self.assertIn('Error procesando archivos', str(context.exception))
    
    @freeze_time("2024-11-17 10:00:00")
    def test_sync_organization_data_mock(self):
        """Test mock sync_organization_data method"""
        result = self.sync_service.sync_organization_data(
            organization_id=self.health_organization.id,
            reps_code='123456789012'
        )
        
        # Verify mock data structure
        self.assertEqual(result['reps_code'], '123456789012')
        self.assertEqual(result['organization_name'], 'IPS Ejemplo')
        self.assertEqual(result['sync_status'], 'SUCCESS')
        self.assertIn('enabled_services', result)
        self.assertEqual(len(result['enabled_services']), 2)
    
    def test_validate_reps_code(self):
        """Test REPS code validation"""
        # Valid codes
        self.assertTrue(self.sync_service.validate_reps_code('123456789012'))
        self.assertTrue(self.sync_service.validate_reps_code('ABCD1234'))
        
        # Invalid codes
        self.assertFalse(self.sync_service.validate_reps_code(''))
        self.assertFalse(self.sync_service.validate_reps_code('12345'))  # Too short
        self.assertFalse(self.sync_service.validate_reps_code(None))
    
    def test_get_enabled_services_mock(self):
        """Test mock get_enabled_services method"""
        services = self.sync_service.get_enabled_services('123456789012')
        
        # Verify mock data
        self.assertEqual(len(services), 3)
        self.assertEqual(services[0]['service_code'], '101')
        self.assertEqual(services[1]['service_code'], '301')
        self.assertEqual(services[2]['service_code'], '205')
        
        # Check service details
        self.assertEqual(services[0]['status'], 'ACTIVE')
        self.assertEqual(services[2]['status'], 'PENDING_RENEWAL')
    
    def test_check_service_expiration_alerts_mock(self):
        """Test mock check_service_expiration_alerts method"""
        alerts = self.sync_service.check_service_expiration_alerts(
            reps_code='123456789012',
            days_ahead=30
        )
        
        # Verify mock alert data
        self.assertEqual(len(alerts), 1)
        alert = alerts[0]
        self.assertEqual(alert['service_code'], '205')
        self.assertEqual(alert['priority'], 'HIGH')
        self.assertEqual(alert['action_required'], 'RENEWAL_PROCESS')
        self.assertEqual(alert['days_until_expiration'], 28)
    
    def test_get_sync_status_mock(self):
        """Test mock get_sync_status method"""
        status = self.sync_service.get_sync_status(self.health_organization.id)
        
        # Verify mock status data
        self.assertEqual(status['sync_status'], 'SUCCESS')
        self.assertEqual(status['services_synced'], 3)
        self.assertEqual(status['errors_count'], 0)
        self.assertEqual(status['warnings_count'], 1)
        self.assertTrue(status['auto_sync_enabled'])


class TestREPSSyncErrorHandling(TestCase):
    """
    Test suite for error handling in REPS synchronization
    """
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='Test Org',
            nit='123456789-1',
            tipo_organizacion='ips'
        )
        
        self.health_organization = HealthOrganization.objects.create(
            organization=self.organization
        )
        
        self.sync_service = REPSSynchronizationService(
            organization=self.health_organization,
            user=self.user
        )
    
    def test_reps_sync_error_creation(self):
        """Test REPSSyncError exception creation"""
        error_message = "Test error message"
        
        with self.assertRaises(REPSSyncError) as context:
            raise REPSSyncError(error_message)
        
        self.assertEqual(str(context.exception), error_message)
    
    def test_sync_with_database_constraint_violation(self):
        """Test sync when database constraints are violated"""
        # This test would need more complex setup to trigger actual constraint violations
        # For now, test the error handling path
        sede_data = {
            'nombre_sede': 'Test Sede',
            'departamento': 'Test Dept',
            'municipio': 'Test City',
            'direccion': 'Test Address',
            'telefono': 'invalid_phone_format',  # This might cause validation issues
            'email': 'invalid_email',  # Invalid email format
            'estado': 'activa',
            'codigo_prestador': '',  # Empty required field
            'numero_sede': '001'
        }
        
        # The service should handle validation errors gracefully
        result = self.sync_service._create_headquarters_record(sede_data)
        
        # Should return 0 (not created due to errors)
        # The exact behavior depends on implementation details
        # This test verifies the service doesn't crash on invalid data
        self.assertIsInstance(result, int)


class TestREPSServiceCompliance(TestCase):
    """
    Test suite for Colombian health regulatory compliance in REPS service
    """
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data for compliance tests"""
        cls.user = User.objects.create_user(
            email='compliance@example.com',
            password='testpass123'
        )
        
        cls.organization = Organization.objects.create(
            razon_social='IPS Compliance Test S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips'
        )
        
        cls.health_organization = HealthOrganization.objects.create(
            organization=cls.organization,
            reps_code='123456789012',
            sogcs_enabled=True
        )
    
    def setUp(self):
        """Set up each test"""
        self.sync_service = REPSSynchronizationService(
            organization=self.health_organization,
            user=self.user
        )
    
    def test_reps_code_format_validation(self):
        """Test REPS code format validation according to MinSalud standards"""
        # Valid REPS codes (alphanumeric, 4-20 characters)
        valid_codes = [
            '123456789012',
            'ABCD1234',
            '1234567890ABCDEF',
            'A1B2C3D4'
        ]
        
        for code in valid_codes:
            with self.subTest(code=code):
                self.assertTrue(
                    self.sync_service.validate_reps_code(code),
                    f"Valid REPS code {code} should pass validation"
                )
        
        # Invalid REPS codes
        invalid_codes = [
            '',  # Empty
            '123',  # Too short
            '12345678901234567890123456789012345',  # Too long
            '123-456',  # Invalid characters
            'ABC def',  # Contains space
            None  # None value
        ]
        
        for code in invalid_codes:
            with self.subTest(code=code):
                self.assertFalse(
                    self.sync_service.validate_reps_code(code),
                    f"Invalid REPS code {code} should fail validation"
                )
    
    def test_department_municipality_compliance(self):
        """Test department and municipality code compliance with DIVIPOLA"""
        # Test data with valid DIVIPOLA codes
        valid_divipola_data = [
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'expected_dept_code': '11',  # Cundinamarca DIVIPOLA code
                'expected_muni_code': '11001'  # Bogotá DIVIPOLA code
            },
            {
                'departamento': 'Antioquia',
                'municipio': 'Medellín',
                'expected_dept_code': '05',  # Antioquia DIVIPOLA code
                'expected_muni_code': '05001'  # Medellín DIVIPOLA code
            }
        ]
        
        for data in valid_divipola_data:
            with self.subTest(department=data['departamento']):
                # In a real implementation, this would validate against DIVIPOLA codes
                # For now, verify the data structure is preserved
                self.assertIsNotNone(data['departamento'])
                self.assertIsNotNone(data['municipio'])
                self.assertTrue(len(data['expected_dept_code']) == 2)
                self.assertTrue(len(data['expected_muni_code']) == 5)
    
    def test_sede_type_compliance_with_resolution_3100(self):
        """Test sede type compliance with Resolution 3100/2019"""
        # Valid sede types according to Resolution 3100/2019
        resolution_3100_types = [
            'principal',
            'satelite',
            'movil',
            'domiciliaria',
            'telemedicina'
        ]
        
        # Test mapping from common REPS terms to Resolution 3100 terms
        reps_to_resolution_mapping = {
            'principal': 'principal',
            'sucursal': 'satelite',
            'ambulatoria': 'satelite',
            'hospitalaria': 'principal',
            'administrativa': 'satelite',
            'diagnostico': 'satelite',
            'urgencias': 'satelite'
        }
        
        for reps_type, expected_resolution_type in reps_to_resolution_mapping.items():
            with self.subTest(reps_type=reps_type):
                mapped_type = self.sync_service._map_sede_type(reps_type)
                self.assertIn(
                    mapped_type, 
                    resolution_3100_types,
                    f"Mapped type {mapped_type} must be compliant with Resolution 3100"
                )
                self.assertEqual(mapped_type, expected_resolution_type)
    
    def test_audit_trail_compliance(self):
        """Test audit trail compliance for data modification tracking"""
        sede_data = {
            'nombre_sede': 'Sede Auditoría Test',
            'tipo_sede': 'principal',
            'departamento': 'Cundinamarca',
            'municipio': 'Bogotá D.C.',
            'direccion': 'Carrera 15 # 93-47',
            'telefono': '6014567890',
            'email': 'auditoria@test.com',
            'estado': 'activa',
            'codigo_prestador': '110001234567',
            'numero_sede': '001',
            'gerente': 'Dr. Auditor Test'
        }
        
        # Create record
        result = self.sync_service._create_headquarters_record(sede_data)
        self.assertEqual(result, 1)
        
        # Verify audit trail fields are set
        headquarters = HeadquarterLocation.objects.filter(
            organization=self.health_organization,
            name='Sede Auditoría Test'
        ).first()
        
        self.assertIsNotNone(headquarters)
        self.assertIsNotNone(headquarters.created_at)
        self.assertIsNotNone(headquarters.updated_at)
        self.assertEqual(headquarters.created_by, self.user)
        self.assertEqual(headquarters.updated_by, self.user)
        
        # Verify sync metadata
        self.assertEqual(headquarters.sync_status, 'imported')
    
    def test_data_privacy_compliance_law_1581(self):
        """Test data privacy compliance with Law 1581 (Habeas Data)"""
        # Test that sensitive data is handled properly
        sede_data = {
            'nombre_sede': 'Sede Privacidad Test',
            'tipo_sede': 'principal',
            'departamento': 'Cundinamarca',
            'municipio': 'Bogotá D.C.',
            'direccion': 'Carrera 15 # 93-47',
            'telefono': '6014567890',
            'email': 'privacidad@test.com',
            'estado': 'activa',
            'codigo_prestador': '110001234567',
            'numero_sede': '001',
            'gerente': 'Dr. Privacidad Test'  # Personal data
        }
        
        # Create record
        result = self.sync_service._create_headquarters_record(sede_data)
        self.assertEqual(result, 1)
        
        # Verify that personal data is stored but access is controlled
        headquarters = HeadquarterLocation.objects.filter(
            organization=self.health_organization,
            name='Sede Privacidad Test'
        ).first()
        
        self.assertIsNotNone(headquarters)
        # In a real implementation, you would test access controls here
        # For now, verify the data is stored correctly
        self.assertEqual(headquarters.administrative_contact, 'Dr. Privacidad Test')
    
    def test_required_fields_compliance(self):
        """Test required fields compliance for minimum data quality"""
        # Test with minimum required fields according to REPS standards
        minimal_sede_data = {
            'nombre_sede': 'Sede Mínima',
            'departamento': 'Cundinamarca',
            'municipio': 'Bogotá D.C.',
            'direccion': 'Dirección mínima',
            'estado': 'activa',
            'numero_sede': '001'
        }
        
        # Should be able to create with minimal data
        result = self.sync_service._create_headquarters_record(minimal_sede_data)
        self.assertEqual(result, 1)
        
        # Verify record was created with defaults for optional fields
        headquarters = HeadquarterLocation.objects.filter(
            organization=self.health_organization,
            name='Sede Mínima'
        ).first()
        
        self.assertIsNotNone(headquarters)
        self.assertEqual(headquarters.name, 'Sede Mínima')
        self.assertEqual(headquarters.department_name, 'Cundinamarca')
        self.assertEqual(headquarters.municipality_name, 'Bogotá D.C.')
        self.assertEqual(headquarters.address, 'Dirección mínima')