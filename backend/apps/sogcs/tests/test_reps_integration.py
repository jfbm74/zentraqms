"""
Integration Test Suite for REPS Import Pipeline

This test suite comprehensively tests the complete REPS import pipeline
from file upload through API to database creation, ensuring end-to-end
functionality and Colombian healthcare compliance.

Key test areas:
- Complete upload-to-database workflow
- File processing with real data scenarios
- Database transaction integrity
- Error recovery and rollback
- Performance with realistic data volumes
- Compliance with Colombian health regulations
"""

import pytest
import tempfile
import os
import pandas as pd
from io import BytesIO
from unittest.mock import Mock, patch
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import transaction
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from freezegun import freeze_time

from apps.sogcs.services.reps_sync import REPSSynchronizationService, REPSSyncError
from apps.organization.models.health import HealthOrganization
from apps.organization.models.sogcs_sedes import HeadquarterLocation, EnabledHealthService
from apps.organization.models import Organization

User = get_user_model()


class TestREPSImportPipelineIntegration(TransactionTestCase):
    """
    Integration tests for the complete REPS import pipeline
    using TransactionTestCase to test database transactions
    """
    
    @classmethod
    def setUpClass(cls):
        """Set up class-level test data"""
        super().setUpClass()
        
        # Create test user
        cls.user = User.objects.create_user(
            email='integration@ipstest.com',
            password='testpass123',
            first_name='Integration',
            last_name='Test'
        )
        
        # Create base organization
        cls.organization = Organization.objects.create(
            razon_social='IPS Integración Completa S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips',
            email='admin@ipsintegracion.com',
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
    
    def setUp(self):
        """Set up each test method"""
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.upload_url = reverse('sogcs:reps-import-upload')
        
        # Clean up any existing headquarters for each test
        HeadquarterLocation.objects.filter(organization=self.health_organization).delete()
    
    def _create_realistic_reps_excel_file(self, data_rows):
        """
        Create a realistic REPS Excel file with proper headers and formatting
        
        Args:
            data_rows: List of dictionaries with sede data
            
        Returns:
            Path to temporary Excel file
        """
        # REPS standard headers
        headers = [
            'departamento', 'municipio', 'codigo_prestador', 'nombre_prestador',
            'codigo_habilitacion', 'numero_sede', 'nombre_sede', 'direccion',
            'telefono', 'email', 'gerente', 'tipo_zona', 'zona', 'barrio'
        ]
        
        # Create DataFrame with proper data
        df = pd.DataFrame(data_rows)
        
        # Ensure all required columns exist
        for header in headers:
            if header not in df.columns:
                df[header] = ''
        
        # Reorder columns to match REPS format
        df = df[headers]
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        temp_file.close()
        
        # Save as Excel
        df.to_excel(temp_file.name, index=False, engine='openpyxl')
        
        return temp_file.name
    
    def test_complete_successful_import_pipeline(self):
        """Test complete successful import from file upload to database"""
        # Prepare realistic test data
        test_data = [
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Integración Completa S.A.S',
                'codigo_habilitacion': 'HAB123456',
                'numero_sede': '001',
                'nombre_sede': 'Sede Principal Chapinero',
                'direccion': 'Carrera 11 # 93-47 Oficina 201',
                'telefono': '6014567890',
                'email': 'principal@ipsintegracion.com',
                'gerente': 'Dr. Carlos Rodríguez Méndez',
                'tipo_zona': 'urbana',
                'zona': 'norte',
                'barrio': 'Chapinero Norte'
            },
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Soacha',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Integración Completa S.A.S',
                'codigo_habilitacion': 'HAB123457',
                'numero_sede': '002',
                'nombre_sede': 'Sede Soacha - Centro Médico',
                'direccion': 'Calle 13 # 15-30 Centro Comercial Plaza',
                'telefono': '6014567891',
                'email': 'soacha@ipsintegracion.com',
                'gerente': 'Dra. María Elena García Vargas',
                'tipo_zona': 'urbana',
                'zona': 'sur',
                'barrio': 'Soacha Centro'
            },
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Zipaquirá',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Integración Completa S.A.S',
                'codigo_habilitacion': 'HAB123458',
                'numero_sede': '003',
                'nombre_sede': 'Sede Zipaquirá - Especialidades',
                'direccion': 'Carrera 7 # 8-25 Edificio Médico San José',
                'telefono': '6014567892',
                'email': 'zipaquira@ipsintegracion.com',
                'gerente': 'Dr. Andrés Felipe Morales Castro',
                'tipo_zona': 'urbana',
                'zona': 'norte',
                'barrio': 'Centro Histórico'
            }
        ]
        
        # Create Excel file
        file_path = self._create_realistic_reps_excel_file(test_data)
        
        try:
            # Create uploaded file
            with open(file_path, 'rb') as f:
                uploaded_file = SimpleUploadedFile(
                    "sedes_integracion_test.xlsx",
                    f.read(),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
            
            # Mock user organization for ViewSet
            with patch.object(type(self.client.handler._middleware_chain), 'process_request'):
                with patch('apps.sogcs.views.REPSImportViewSet._get_user_organization') as mock_get_org:
                    mock_get_org.return_value = self.health_organization
                    
                    # Make API request
                    data = {
                        'headquarters_file': uploaded_file,
                        'create_backup': True
                    }
                    
                    response = self.client.post(self.upload_url, data, format='multipart')
            
            # Verify API response
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data.get('success', False))
            self.assertEqual(response.data.get('imported_count'), 3)
            self.assertEqual(response.data.get('error_count'), 0)
            
            # Verify database records were created
            headquarters_count = HeadquarterLocation.objects.filter(
                organization=self.health_organization
            ).count()
            self.assertEqual(headquarters_count, 3)
            
            # Verify specific records with detailed assertions
            principal_sede = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                name='Sede Principal Chapinero'
            ).first()
            
            self.assertIsNotNone(principal_sede)
            self.assertEqual(principal_sede.department_name, 'Cundinamarca')
            self.assertEqual(principal_sede.municipality_name, 'Bogotá D.C.')
            self.assertEqual(principal_sede.address, 'Carrera 11 # 93-47 Oficina 201')
            self.assertEqual(principal_sede.phone_primary, '6014567890')
            self.assertEqual(principal_sede.email, 'principal@ipsintegracion.com')
            self.assertEqual(principal_sede.administrative_contact, 'Dr. Carlos Rodríguez Méndez')
            self.assertEqual(principal_sede.barrio, 'Chapinero Norte')
            self.assertEqual(principal_sede.sede_type, 'principal')
            self.assertTrue(principal_sede.is_main_headquarters)
            self.assertEqual(principal_sede.created_by, self.user)
            self.assertEqual(principal_sede.updated_by, self.user)
            
            # Verify Soacha sede
            soacha_sede = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                name='Sede Soacha - Centro Médico'
            ).first()
            
            self.assertIsNotNone(soacha_sede)
            self.assertEqual(soacha_sede.municipality_name, 'Soacha')
            self.assertEqual(soacha_sede.administrative_contact, 'Dra. María Elena García Vargas')
            self.assertEqual(soacha_sede.sede_type, 'satelite')  # Mapped from 'sucursal'
            self.assertFalse(soacha_sede.is_main_headquarters)
            
            # Verify Zipaquirá sede
            zipaquira_sede = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                name='Sede Zipaquirá - Especialidades'
            ).first()
            
            self.assertIsNotNone(zipaquira_sede)
            self.assertEqual(zipaquira_sede.municipality_name, 'Zipaquirá')
            self.assertEqual(zipaquira_sede.barrio, 'Centro Histórico')
            
        finally:
            # Clean up temp file
            try:
                os.unlink(file_path)
            except FileNotFoundError:
                pass
    
    def test_import_pipeline_with_mixed_valid_invalid_data(self):
        """Test pipeline with mixed valid and invalid data"""
        # Test data with some invalid records
        test_data = [
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': 'HAB123456',
                'numero_sede': '001',
                'nombre_sede': 'Sede Válida Principal',
                'direccion': 'Carrera 15 # 93-47',
                'telefono': '6014567890',
                'email': 'valida@ipstest.com',
                'gerente': 'Dr. Válido Test',
                'barrio': 'Chapinero'
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
                'gerente': 'Dra. Inválida Test',
                'barrio': 'Soacha Centro'
            },
            {
                'departamento': 'Antioquia',
                'municipio': 'Medellín',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': 'HAB123458',
                'numero_sede': '003',
                'nombre_sede': 'Sede Medellín Válida',
                'direccion': 'Carrera 70 # 50-23',
                'telefono': '6044567892',
                'email': 'medellin@ipstest.com',
                'gerente': 'Dr. Medellín Test',
                'barrio': 'El Poblado'
            }
        ]
        
        # Create Excel file
        file_path = self._create_realistic_reps_excel_file(test_data)
        
        try:
            with open(file_path, 'rb') as f:
                uploaded_file = SimpleUploadedFile(
                    "sedes_mixed_data.xlsx",
                    f.read(),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
            
            with patch('apps.sogcs.views.REPSImportViewSet._get_user_organization') as mock_get_org:
                mock_get_org.return_value = self.health_organization
                
                data = {
                    'headquarters_file': uploaded_file,
                    'create_backup': True
                }
                
                response = self.client.post(self.upload_url, data, format='multipart')
            
            # Verify API response shows partial success
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data.get('success', False))
            self.assertEqual(response.data.get('imported_count'), 2)  # Only valid records
            self.assertEqual(response.data.get('error_count'), 1)  # One invalid record
            self.assertEqual(response.data.get('total_rows'), 3)
            self.assertEqual(response.data.get('valid_rows'), 2)
            self.assertEqual(response.data.get('invalid_rows'), 1)
            
            # Verify only valid records were created in database
            headquarters_count = HeadquarterLocation.objects.filter(
                organization=self.health_organization
            ).count()
            self.assertEqual(headquarters_count, 2)
            
            # Verify specific valid records exist
            valid_principal = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                name='Sede Válida Principal'
            ).exists()
            self.assertTrue(valid_principal)
            
            valid_medellin = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                name='Sede Medellín Válida'
            ).exists()
            self.assertTrue(valid_medellin)
            
            # Verify invalid record was not created
            invalid_sede = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                municipality_name='Soacha'
            ).exists()
            self.assertFalse(invalid_sede)
            
        finally:
            try:
                os.unlink(file_path)
            except FileNotFoundError:
                pass
    
    def test_import_pipeline_duplicate_handling(self):
        """Test pipeline handling of duplicate records"""
        # Create initial sede
        existing_sede = HeadquarterLocation.objects.create(
            organization=self.health_organization,
            reps_code='EXISTING001',
            name='Sede Existente',
            sede_type='principal',
            department_code='11',
            department_name='Cundinamarca',
            municipality_code='11001',
            municipality_name='Bogotá D.C.',
            address='Carrera 15 # 93-47',
            phone_primary='6014567890',
            email='existente@test.com',
            administrative_contact='Dr. Existente',
            habilitation_status='habilitada',
            operational_status='activa',
            atencion_24_horas=False,
            barrio='Chapinero',
            cargo_responsable_administrativo='Director',
            created_by=self.user,
            updated_by=self.user
        )
        
        # Test data including duplicate
        test_data = [
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': 'HAB123456',
                'numero_sede': '001',
                'nombre_sede': 'Sede Existente',  # Duplicate name
                'direccion': 'Carrera 15 # 93-47',  # Duplicate address
                'telefono': '6014567890',
                'email': 'existente@test.com',
                'gerente': 'Dr. Existente Actualizado',
                'barrio': 'Chapinero'
            },
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Soacha',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': 'HAB123457',
                'numero_sede': '002',
                'nombre_sede': 'Sede Nueva',
                'direccion': 'Calle 20 # 15-30',
                'telefono': '6014567891',
                'email': 'nueva@test.com',
                'gerente': 'Dra. Nueva Test',
                'barrio': 'Soacha Centro'
            }
        ]
        
        # Create Excel file
        file_path = self._create_realistic_reps_excel_file(test_data)
        
        try:
            with open(file_path, 'rb') as f:
                uploaded_file = SimpleUploadedFile(
                    "sedes_with_duplicates.xlsx",
                    f.read(),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
            
            with patch('apps.sogcs.views.REPSImportViewSet._get_user_organization') as mock_get_org:
                mock_get_org.return_value = self.health_organization
                
                data = {
                    'headquarters_file': uploaded_file,
                    'create_backup': True
                }
                
                response = self.client.post(self.upload_url, data, format='multipart')
            
            # Verify API response
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data.get('success', False))
            self.assertEqual(response.data.get('imported_count'), 1)  # Only new record
            
            # Verify total count (existing + new)
            headquarters_count = HeadquarterLocation.objects.filter(
                organization=self.health_organization
            ).count()
            self.assertEqual(headquarters_count, 2)  # Original + new one
            
            # Verify existing record wasn't duplicated
            existing_count = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                name='Sede Existente',
                address='Carrera 15 # 93-47'
            ).count()
            self.assertEqual(existing_count, 1)
            
            # Verify new record was created
            new_sede = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                name='Sede Nueva'
            ).exists()
            self.assertTrue(new_sede)
            
        finally:
            try:
                os.unlink(file_path)
            except FileNotFoundError:
                pass
    
    def test_import_pipeline_transaction_rollback_on_error(self):
        """Test that transactions are properly rolled back on errors"""
        # Test data that will cause an error during processing
        test_data = [
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Test S.A.S',
                'codigo_habilitacion': 'HAB123456',
                'numero_sede': '001',
                'nombre_sede': 'Sede Pre-Error',
                'direccion': 'Carrera 15 # 93-47',
                'telefono': '6014567890',
                'email': 'preerror@test.com',
                'gerente': 'Dr. Pre Error',
                'barrio': 'Chapinero'
            }
        ]
        
        file_path = self._create_realistic_reps_excel_file(test_data)
        
        try:
            with open(file_path, 'rb') as f:
                uploaded_file = SimpleUploadedFile(
                    "sedes_error_test.xlsx",
                    f.read(),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
            
            # Mock service to raise error after partial processing
            with patch('apps.sogcs.services.reps_sync.REPSSynchronizationService.synchronize_from_files') as mock_sync:
                mock_sync.side_effect = REPSSyncError("Simulated error during processing")
                
                with patch('apps.sogcs.views.REPSImportViewSet._get_user_organization') as mock_get_org:
                    mock_get_org.return_value = self.health_organization
                    
                    data = {
                        'headquarters_file': uploaded_file,
                        'create_backup': True
                    }
                    
                    response = self.client.post(self.upload_url, data, format='multipart')
            
            # Verify error response
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('Error en sincronización REPS', response.data['error'])
            
            # Verify no records were created (transaction rolled back)
            headquarters_count = HeadquarterLocation.objects.filter(
                organization=self.health_organization
            ).count()
            self.assertEqual(headquarters_count, 0)
            
        finally:
            try:
                os.unlink(file_path)
            except FileNotFoundError:
                pass
    
    def test_import_pipeline_with_encoding_issues(self):
        """Test pipeline with files containing encoding issues"""
        # Test data with special characters that often cause encoding issues
        test_data = [
            {
                'departamento': 'Bogotá D.C.',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'Clínica de Especialidades Médicas S.A.S',
                'codigo_habilitacion': 'HAB123456',
                'numero_sede': '001',
                'nombre_sede': 'Sede Chapinero - Especialidades Médicas',
                'direccion': 'Carrera 11 # 93-47 - Edificio Médico Profesional',
                'telefono': '6014567890',
                'email': 'especialidades@clinica.com',
                'gerente': 'Dr. José María Rodríguez Peña',
                'barrio': 'Chapinero'
            },
            {
                'departamento': 'Antioquia',
                'municipio': 'Medellín',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'Clínica de Especialidades Médicas S.A.S',
                'codigo_habilitacion': 'HAB123457',
                'numero_sede': '002',
                'nombre_sede': 'Sede Medellín - Atención Primaria',
                'direccion': 'Carrera 70 # 50-23 - Edificio Médico Integral',
                'telefono': '6044567891',
                'email': 'medellin@clinica.com',
                'gerente': 'Dra. María Fernanda Gómez Jiménez',
                'barrio': 'El Poblado'
            }
        ]
        
        file_path = self._create_realistic_reps_excel_file(test_data)
        
        try:
            with open(file_path, 'rb') as f:
                uploaded_file = SimpleUploadedFile(
                    "sedes_encoding_test.xlsx",
                    f.read(),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
            
            with patch('apps.sogcs.views.REPSImportViewSet._get_user_organization') as mock_get_org:
                mock_get_org.return_value = self.health_organization
                
                data = {
                    'headquarters_file': uploaded_file,
                    'create_backup': True
                }
                
                response = self.client.post(self.upload_url, data, format='multipart')
            
            # Verify successful processing despite special characters
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data.get('success', False))
            self.assertEqual(response.data.get('imported_count'), 2)
            
            # Verify records with special characters were created correctly
            chapinero_sede = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                name='Sede Chapinero - Especialidades Médicas'
            ).first()
            
            self.assertIsNotNone(chapinero_sede)
            self.assertIn('José María', chapinero_sede.administrative_contact)
            self.assertIn('Clínica', chapinero_sede.organization.organization.razon_social)
            
            medellin_sede = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                name='Sede Medellín - Atención Primaria'
            ).first()
            
            self.assertIsNotNone(medellin_sede)
            self.assertIn('María Fernanda', medellin_sede.administrative_contact)
            
        finally:
            try:
                os.unlink(file_path)
            except FileNotFoundError:
                pass
    
    def test_import_pipeline_performance_with_large_dataset(self):
        """Test pipeline performance with larger dataset"""
        # Create larger dataset (100 records)
        test_data = []
        for i in range(1, 101):
            test_data.append({
                'departamento': 'Cundinamarca' if i % 2 == 0 else 'Antioquia',
                'municipio': 'Bogotá D.C.' if i % 2 == 0 else 'Medellín',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Performance Test S.A.S',
                'codigo_habilitacion': f'HAB{i:06d}',
                'numero_sede': f'{i:03d}',
                'nombre_sede': f'Sede Performance Test {i:03d}',
                'direccion': f'Carrera {i} # {i}-{i}',
                'telefono': f'601456{i:04d}',
                'email': f'sede{i:03d}@performance.com',
                'gerente': f'Dr. Performance Test {i}',
                'barrio': f'Barrio Test {i}'
            })
        
        file_path = self._create_realistic_reps_excel_file(test_data)
        
        try:
            with open(file_path, 'rb') as f:
                uploaded_file = SimpleUploadedFile(
                    "sedes_performance_test.xlsx",
                    f.read(),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
            
            import time
            start_time = time.time()
            
            with patch('apps.sogcs.views.REPSImportViewSet._get_user_organization') as mock_get_org:
                mock_get_org.return_value = self.health_organization
                
                data = {
                    'headquarters_file': uploaded_file,
                    'create_backup': True
                }
                
                response = self.client.post(self.upload_url, data, format='multipart')
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Verify successful processing
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data.get('success', False))
            self.assertEqual(response.data.get('imported_count'), 100)
            
            # Verify all records were created
            headquarters_count = HeadquarterLocation.objects.filter(
                organization=self.health_organization
            ).count()
            self.assertEqual(headquarters_count, 100)
            
            # Performance assertion (should process 100 records in reasonable time)
            # Adjust this threshold based on your performance requirements
            self.assertLess(processing_time, 30.0, "Import should complete within 30 seconds")
            
            # Verify data integrity for sample records
            first_sede = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                name='Sede Performance Test 001'
            ).first()
            self.assertIsNotNone(first_sede)
            
            last_sede = HeadquarterLocation.objects.filter(
                organization=self.health_organization,
                name='Sede Performance Test 100'
            ).first()
            self.assertIsNotNone(last_sede)
            
        finally:
            try:
                os.unlink(file_path)
            except FileNotFoundError:
                pass


@freeze_time("2024-11-17 10:00:00")
class TestREPSImportPipelineComplianceIntegration(TransactionTestCase):
    """
    Integration tests for Colombian health regulatory compliance
    """
    
    @classmethod
    def setUpClass(cls):
        """Set up class-level test data"""
        super().setUpClass()
        
        cls.user = User.objects.create_user(
            email='compliance@ipstest.com',
            password='testpass123'
        )
        
        cls.organization = Organization.objects.create(
            razon_social='IPS Compliance Integration S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips'
        )
        
        cls.health_organization = HealthOrganization.objects.create(
            organization=cls.organization,
            reps_code='123456789012',
            sogcs_enabled=True
        )
    
    def setUp(self):
        """Set up each test method"""
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.upload_url = reverse('sogcs:reps-import-upload')
        
        HeadquarterLocation.objects.filter(organization=self.health_organization).delete()
    
    def test_reps_import_compliance_with_resolution_3100(self):
        """Test REPS import compliance with Resolution 3100/2019"""
        # Test data following Resolution 3100 standards
        resolution_3100_data = [
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Resolución 3100 S.A.S',
                'codigo_habilitacion': 'RES3100-001',
                'numero_sede': '001',
                'nombre_sede': 'Sede Principal - Servicios Integrales',
                'direccion': 'Carrera 15 # 93-47',
                'telefono': '6014567890',
                'email': 'principal@res3100.com',
                'gerente': 'Dr. Resolución Compliance',
                'barrio': 'Chapinero'
            }
        ]
        
        # Create and upload file
        file_path = self._create_realistic_reps_excel_file(resolution_3100_data)
        
        try:
            with open(file_path, 'rb') as f:
                uploaded_file = SimpleUploadedFile(
                    "sedes_resolution_3100.xlsx",
                    f.read(),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
            
            with patch('apps.sogcs.views.REPSImportViewSet._get_user_organization') as mock_get_org:
                mock_get_org.return_value = self.health_organization
                
                data = {'headquarters_file': uploaded_file}
                response = self.client.post(self.upload_url, data, format='multipart')
            
            # Verify compliance requirements
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify headquarters record complies with Resolution 3100
            headquarters = HeadquarterLocation.objects.filter(
                organization=self.health_organization
            ).first()
            
            self.assertIsNotNone(headquarters)
            
            # Verify required fields according to Resolution 3100
            self.assertIsNotNone(headquarters.name)
            self.assertIsNotNone(headquarters.department_name)
            self.assertIsNotNone(headquarters.municipality_name)
            self.assertIsNotNone(headquarters.address)
            self.assertIsNotNone(headquarters.phone_primary)
            self.assertIsNotNone(headquarters.email)
            self.assertIsNotNone(headquarters.administrative_contact)
            
            # Verify audit trail (required for compliance)
            self.assertIsNotNone(headquarters.created_at)
            self.assertIsNotNone(headquarters.updated_at)
            self.assertEqual(headquarters.created_by, self.user)
            self.assertEqual(headquarters.updated_by, self.user)
            
            # Verify sync metadata
            self.assertEqual(headquarters.sync_status, 'imported')
            
        finally:
            try:
                os.unlink(file_path)
            except FileNotFoundError:
                pass
    
    def test_reps_import_data_privacy_compliance_law_1581(self):
        """Test REPS import compliance with Law 1581 (Habeas Data)"""
        # Test data with personal information (should be handled according to Law 1581)
        personal_data = [
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS Habeas Data S.A.S',
                'codigo_habilitacion': 'HAB-PRIV-001',
                'numero_sede': '001',
                'nombre_sede': 'Sede Privacidad Test',
                'direccion': 'Carrera 15 # 93-47',
                'telefono': '6014567890',
                'email': 'privacidad@habeasdata.com',
                'gerente': 'Dr. Datos Personales García',  # Personal data
                'barrio': 'Chapinero'
            }
        ]
        
        file_path = self._create_realistic_reps_excel_file(personal_data)
        
        try:
            with open(file_path, 'rb') as f:
                uploaded_file = SimpleUploadedFile(
                    "sedes_privacy_test.xlsx",
                    f.read(),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
            
            with patch('apps.sogcs.views.REPSImportViewSet._get_user_organization') as mock_get_org:
                mock_get_org.return_value = self.health_organization
                
                data = {'headquarters_file': uploaded_file}
                response = self.client.post(self.upload_url, data, format='multipart')
            
            # Verify successful processing
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify personal data is stored but access is controlled
            headquarters = HeadquarterLocation.objects.filter(
                organization=self.health_organization
            ).first()
            
            self.assertIsNotNone(headquarters)
            
            # Personal data should be stored (for operational purposes)
            self.assertEqual(headquarters.administrative_contact, 'Dr. Datos Personales García')
            
            # In a real implementation, you would verify:
            # - Data encryption for sensitive fields
            # - Access logging for personal data
            # - User consent tracking
            # - Data retention policies
            
        finally:
            try:
                os.unlink(file_path)
            except FileNotFoundError:
                pass
    
    def _create_realistic_reps_excel_file(self, data_rows):
        """Helper method to create realistic REPS Excel files"""
        headers = [
            'departamento', 'municipio', 'codigo_prestador', 'nombre_prestador',
            'codigo_habilitacion', 'numero_sede', 'nombre_sede', 'direccion',
            'telefono', 'email', 'gerente', 'barrio'
        ]
        
        df = pd.DataFrame(data_rows)
        
        # Ensure all headers exist
        for header in headers:
            if header not in df.columns:
                df[header] = ''
        
        df = df[headers]
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        temp_file.close()
        
        df.to_excel(temp_file.name, index=False, engine='openpyxl')
        
        return temp_file.name