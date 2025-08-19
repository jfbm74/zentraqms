"""
Test suite for REPS pre-processing fix for normal imports.

This test validates the solution for preventing UNIQUE constraint errors
when importing REPS headquarters that have been previously soft-deleted.
"""

import tempfile
import pandas as pd
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.organization.models import (
    Organization, HealthOrganization, HeadquarterLocation
)
from apps.sogcs.services.reps_sync import REPSSynchronizationService

User = get_user_model()


class REPSPreprocessingFixTestCase(TestCase):
    """Test cases for REPS pre-processing fix during normal imports."""
    
    def setUp(self):
        """Set up test data."""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test organization
        self.organization = Organization.objects.create(
            razon_social='Test Health Organization',
            nit='7600103066',
            digito_verificacion='1',
            tipo_organizacion='ips',
            sector_economico='salud',
            tamaño_empresa='mediana'
        )
        
        # Create health organization profile
        self.health_org = HealthOrganization.objects.create(
            organization=self.organization,
            codigo_prestador='7600103066',
            naturaleza_juridica='privada',
            tipo_prestador='IPS',
            nivel_complejidad='II',
            representante_tipo_documento='CC',
            representante_numero_documento='123456789',
            representante_nombre_completo='Dr. Test',
            representante_telefono='6011234567',
            representante_email='representante@test.com'
        )
        
        # Create sync service
        self.sync_service = REPSSynchronizationService(
            organization=self.health_org,
            user=self.user
        )
    
    def test_normal_import_with_soft_deleted_records_succeeds(self):
        """Test that normal import succeeds when soft-deleted records exist with same REPS codes."""
        # Create a headquarters record
        sede = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='7600103066_1',
            name='Sede Original',
            sede_type='principal',
            department_code='76',
            department_name='Valle del Cauca',
            municipality_code='76001',
            municipality_name='Cali',
            address='Calle Original',
            created_by=self.user
        )
        
        # Soft delete the record
        sede.delete(user=self.user)
        
        # Refresh from DB to get updated deleted_at
        sede.refresh_from_db()
        
        # Verify it's soft deleted
        self.assertIsNotNone(sede.deleted_at)
        active_count = HeadquarterLocation.objects.filter(
            organization=self.health_org
        ).count()  # SoftDeleteManager filters out deleted records by default
        total_count = HeadquarterLocation.objects.all_with_deleted().filter(
            organization=self.health_org
        ).count()  # Include soft-deleted records
        self.assertEqual(active_count, 0)
        self.assertEqual(total_count, 1)
        
        # Create test Excel file with same REPS code
        df = pd.DataFrame([
            {
                'codigo_prestador': '7600103066',
                'numero_sede': '1',
                'nombre_sede': 'CLINICA PRINCIPAL',
                'departamento': 'VALLE DEL CAUCA',
                'municipio': 'CALI',
                'direccion': 'CALLE 18 NORTE # 5-34',
                'telefono': '6023955000',
                'email': 'info@clinica.com'
            }
        ])
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df.to_excel(tmp.name, index=False, engine='openpyxl')
            temp_file = tmp.name
        
        # Run synchronization WITHOUT force_recreate (normal import)
        result = self.sync_service.synchronize_from_files(
            headquarters_file=temp_file,
            force_recreate=False
        )
        
        # Verify success
        self.assertTrue(result['success'], f"Import failed: {result}")
        self.assertEqual(result['imported_count'], 1, f"Expected 1 import, got: {result}")
        
        # Verify the soft-deleted record was hard-deleted during pre-processing
        total_after = HeadquarterLocation.objects.all_with_deleted().filter(
            organization=self.health_org
        ).count()
        active_after = HeadquarterLocation.objects.filter(
            organization=self.health_org
        ).count()  # Active records only (default manager behavior)
        
        # Should have only the new record
        self.assertEqual(total_after, 1)
        self.assertEqual(active_after, 1)
        
        # Verify it's the new record with correct data
        new_sede = HeadquarterLocation.objects.get(
            organization=self.health_org
        )
        self.assertEqual(new_sede.name, 'CLINICA PRINCIPAL')
        self.assertEqual(new_sede.reps_code, '7600103066_1')
        self.assertIsNone(new_sede.deleted_at)
    
    def test_normal_import_with_multiple_soft_deleted_records(self):
        """Test normal import with multiple soft-deleted records with conflicting REPS codes."""
        # Create multiple headquarters and soft delete them
        for i in range(3):
            sede = HeadquarterLocation.objects.create(
                organization=self.health_org,
                reps_code=f'7600103066_{i+1}',
                name=f'Sede Original {i+1}',
                sede_type='principal' if i == 0 else 'satelite',
                department_code='76',
                department_name='Valle del Cauca',
                municipality_code='76001',
                municipality_name='Cali',
                address=f'Calle Original {i+1}',
                created_by=self.user
            )
            sede.delete(user=self.user)
        
        # Verify initial state
        total_initial = HeadquarterLocation.objects.all_with_deleted().filter(
            organization=self.health_org
        ).count()
        active_initial = HeadquarterLocation.objects.filter(
            organization=self.health_org
        ).count()  # Default manager excludes soft-deleted
        self.assertEqual(total_initial, 3)
        self.assertEqual(active_initial, 0)
        
        # Create test Excel file with overlapping REPS codes
        df = pd.DataFrame([
            {
                'codigo_prestador': '7600103066',
                'numero_sede': '1',  # Conflicts with soft-deleted record
                'nombre_sede': 'NUEVA CLINICA 1',
                'departamento': 'VALLE DEL CAUCA',
                'municipio': 'CALI',
                'direccion': 'NUEVA CALLE 1',
                'telefono': '6023955001',
                'email': 'nueva1@clinica.com'
            },
            {
                'codigo_prestador': '7600103066',
                'numero_sede': '2',  # Conflicts with soft-deleted record
                'nombre_sede': 'NUEVA CLINICA 2',
                'departamento': 'VALLE DEL CAUCA',
                'municipio': 'CALI',
                'direccion': 'NUEVA CALLE 2',
                'telefono': '6023955002',
                'email': 'nueva2@clinica.com'
            },
            {
                'codigo_prestador': '7600103066',
                'numero_sede': '4',  # New record, no conflict
                'nombre_sede': 'NUEVA CLINICA 4',
                'departamento': 'VALLE DEL CAUCA',
                'municipio': 'CALI',
                'direccion': 'NUEVA CALLE 4',
                'telefono': '6023955004',
                'email': 'nueva4@clinica.com'
            }
        ])
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df.to_excel(tmp.name, index=False, engine='openpyxl')
            temp_file = tmp.name
        
        # Run synchronization WITHOUT force_recreate
        result = self.sync_service.synchronize_from_files(
            headquarters_file=temp_file,
            force_recreate=False
        )
        
        # Verify success
        self.assertTrue(result['success'])
        self.assertEqual(result['imported_count'], 3)
        
        # Verify final state
        final_total = HeadquarterLocation.objects.all_with_deleted().filter(
            organization=self.health_org
        ).count()
        final_active = HeadquarterLocation.objects.filter(
            organization=self.health_org
        ).count()  # Default manager excludes soft-deleted
        
        # Should have 3 active records (conflicting soft-deleted records were hard-deleted)
        self.assertEqual(final_active, 3)  # 3 new active records
        
        # Verify REPS codes are correct
        reps_codes = set(HeadquarterLocation.objects.filter(
            organization=self.health_org
        ).values_list('reps_code', flat=True))
        expected_codes = {'7600103066_1', '7600103066_2', '7600103066_4'}
        self.assertEqual(reps_codes, expected_codes)
    
    def test_normal_import_preserves_non_conflicting_soft_deleted_records(self):
        """Test that non-conflicting soft-deleted records are preserved during normal import."""
        # Create a soft-deleted record that won't conflict
        non_conflicting_sede = HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='7600103066_99',
            name='Sede No Conflicto',
            sede_type='satelite',
            department_code='76',
            department_name='Valle del Cauca',
            municipality_code='76001',
            municipality_name='Cali',
            address='Calle No Conflicto',
            created_by=self.user
        )
        non_conflicting_sede.delete(user=self.user)
        
        # Create test Excel file with different REPS code
        df = pd.DataFrame([
            {
                'codigo_prestador': '7600103066',
                'numero_sede': '1',
                'nombre_sede': 'NUEVA CLINICA',
                'departamento': 'VALLE DEL CAUCA',
                'municipio': 'CALI',
                'direccion': 'NUEVA CALLE',
                'telefono': '6023955000',
                'email': 'nueva@clinica.com'
            }
        ])
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df.to_excel(tmp.name, index=False, engine='openpyxl')
            temp_file = tmp.name
        
        # Run synchronization WITHOUT force_recreate
        result = self.sync_service.synchronize_from_files(
            headquarters_file=temp_file,
            force_recreate=False
        )
        
        # Verify success
        self.assertTrue(result['success'])
        self.assertEqual(result['imported_count'], 1)
        
        # Verify the non-conflicting soft-deleted record still exists
        non_conflicting_exists = HeadquarterLocation.objects.all_with_deleted().filter(
            id=non_conflicting_sede.id
        ).exists()
        self.assertTrue(non_conflicting_exists)
        
        # Verify new record was created
        new_record_exists = HeadquarterLocation.objects.filter(
            organization=self.health_org,
            reps_code='7600103066_1'
        ).exists()
        self.assertTrue(new_record_exists)
    
    def test_error_handling_during_preprocessing(self):
        """Test error handling during the pre-processing phase."""
        # Create test Excel file with invalid data
        df = pd.DataFrame([
            {
                'codigo_prestador': '',  # Invalid - empty
                'numero_sede': '1',
                'nombre_sede': 'CLINICA INVALIDA',
                'departamento': 'VALLE DEL CAUCA',
                'municipio': 'CALI',
                'direccion': 'CALLE INVALIDA'
            }
        ])
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df.to_excel(tmp.name, index=False, engine='openpyxl')
            temp_file = tmp.name
        
        # Run synchronization WITHOUT force_recreate
        result = self.sync_service.synchronize_from_files(
            headquarters_file=temp_file,
            force_recreate=False
        )
        
        # Should handle errors gracefully
        # The exact behavior depends on validation logic, but shouldn't crash
        self.assertIsNotNone(result)
        self.assertIn('success', result)
    
    def tearDown(self):
        """Clean up test data."""
        # Clean up is handled automatically by Django test framework
        pass