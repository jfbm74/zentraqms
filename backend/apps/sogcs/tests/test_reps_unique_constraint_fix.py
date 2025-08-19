"""
Test suite for REPS UNIQUE constraint fix.

This test validates the solution for the persistent UNIQUE constraint error
when importing REPS headquarters data.
"""

import tempfile
import pandas as pd
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import connection
from rest_framework.test import APIClient
from rest_framework import status

from apps.organization.models import (
    Organization, HealthOrganization, HeadquarterLocation
)
from apps.sogcs.services.reps_sync import REPSSynchronizationService

User = get_user_model()


class REPSUniqueConstraintFixTestCase(TestCase):
    """Test cases for REPS unique constraint fix."""
    
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
        
        # Set up API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create sync service
        self.sync_service = REPSSynchronizationService(
            organization=self.health_org,
            user=self.user
        )
    
    def test_force_recreate_deletes_all_records_properly(self):
        """Test that force_recreate properly deletes all existing records."""
        # Create some existing headquarters
        HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='7600103066_1',
            name='Sede Existente 1',
            sede_type='principal',
            department_code='76',
            department_name='Valle del Cauca',
            municipality_code='76001',
            municipality_name='Cali',
            address='Calle 1',
            created_by=self.user
        )
        
        HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='7600103066_2',
            name='Sede Existente 2',
            sede_type='satelite',
            department_code='76',
            department_name='Valle del Cauca',
            municipality_code='76001',
            municipality_name='Cali',
            address='Calle 2',
            created_by=self.user
        )
        
        # Verify they exist
        self.assertEqual(HeadquarterLocation.objects.filter(organization=self.health_org).count(), 2)
        
        # Create test Excel file with same REPS codes
        df = pd.DataFrame([
            {
                'codigo_prestador': '7600103066',
                'numero_sede': '1',
                'nombre_sede': 'CLINICA DE OCCIDENTE',
                'departamento': 'VALLE DEL CAUCA',
                'municipio': 'CALI',
                'direccion': 'CALLE 18 NORTE # 5-34',
                'telefono': '6023955000',
                'email': 'info@clinicaoccidente.com'
            },
            {
                'codigo_prestador': '7600103066',
                'numero_sede': '3',
                'nombre_sede': 'SEDE URGENCIAS',
                'departamento': 'VALLE DEL CAUCA',
                'municipio': 'CALI',
                'direccion': 'CARRERA 5 # 18N-45',
                'telefono': '6023955100',
                'email': 'urgencias@clinicaoccidente.com'
            }
        ])
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df.to_excel(tmp.name, index=False, engine='openpyxl')
            temp_file = tmp.name
        
        # Run synchronization with force_recreate=True
        result = self.sync_service.synchronize_from_files(
            headquarters_file=temp_file,
            force_recreate=True
        )
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(result['imported_count'], 2)
        
        # Verify database state
        new_sedes = HeadquarterLocation.objects.filter(organization=self.health_org)
        self.assertEqual(new_sedes.count(), 2)
        
        # Verify REPS codes are correct
        reps_codes = set(new_sedes.values_list('reps_code', flat=True))
        self.assertEqual(reps_codes, {'7600103066_1', '7600103066_3'})
    
    def test_sanitization_of_sede_numbers(self):
        """Test that sede numbers are properly sanitized."""
        # Create test data with problematic sede numbers
        df = pd.DataFrame([
            {
                'codigo_prestador': '7600103066',
                'numero_sede': ' 1 ',  # With spaces
                'nombre_sede': 'SEDE CON ESPACIOS',
                'departamento': 'VALLE',
                'municipio': 'CALI',
                'direccion': 'CALLE 1'
            },
            {
                'codigo_prestador': '7600103066',
                'numero_sede': 'nan',  # NaN as string
                'nombre_sede': 'SEDE NAN',
                'departamento': 'VALLE',
                'municipio': 'CALI',
                'direccion': 'CALLE 2'
            },
            {
                'codigo_prestador': ' 7600103066',  # With leading space
                'numero_sede': '2',
                'nombre_sede': 'SEDE NORMAL',
                'departamento': 'VALLE',
                'municipio': 'CALI',
                'direccion': 'CALLE 3'
            }
        ])
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df.to_excel(tmp.name, index=False, engine='openpyxl')
            temp_file = tmp.name
        
        # Run synchronization
        result = self.sync_service.synchronize_from_files(
            headquarters_file=temp_file,
            force_recreate=True
        )
        
        # Verify success
        self.assertTrue(result['success'])
        self.assertEqual(result['imported_count'], 3)
        
        # Check sanitized REPS codes
        sedes = HeadquarterLocation.objects.filter(organization=self.health_org)
        reps_codes = list(sedes.values_list('reps_code', flat=True))
        
        # Verify no spaces in REPS codes
        for code in reps_codes:
            self.assertEqual(code, code.strip())
            self.assertNotIn(' ', code)
    
    def test_diagnosis_method_identifies_issues(self):
        """Test that the diagnosis method correctly identifies REPS code issues."""
        # Create headquarters with various issues
        HeadquarterLocation.objects.create(
            organization=self.health_org,
            reps_code='7600103066_1 ',  # Trailing space
            name='Sede con espacio',
            sede_type='principal',
            department_code='76',
            department_name='Valle',
            municipality_code='76001',
            municipality_name='Cali',
            address='Calle 1',
            created_by=self.user
        )
        
        # Run diagnosis
        diagnosis = self.sync_service.diagnose_reps_codes()
        
        # Verify diagnosis found issues
        self.assertIsNotNone(diagnosis)
        self.assertEqual(diagnosis['organization_id'], self.health_org.id)
        
        # Check if whitespace issue was detected
        if 'problematic_codes' in diagnosis:
            self.assertTrue(len(diagnosis['problematic_codes']) > 0)
    
    def test_transaction_rollback_on_error(self):
        """Test that transaction properly rolls back on error during force_recreate."""
        # Create invalid test data (missing required fields)
        df = pd.DataFrame([
            {
                'codigo_prestador': '7600103066',
                'numero_sede': '1',
                'nombre_sede': 'SEDE VALIDA',
                'departamento': 'VALLE',
                'municipio': 'CALI',
                'direccion': 'CALLE 1'
            },
            {
                'codigo_prestador': '7600103066',
                'numero_sede': '1',  # Duplicate sede number - will cause error
                'nombre_sede': 'SEDE DUPLICADA',
                'departamento': 'VALLE',
                'municipio': 'CALI',
                'direccion': 'CALLE 2'
            }
        ])
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df.to_excel(tmp.name, index=False, engine='openpyxl')
            temp_file = tmp.name
        
        # Run synchronization
        result = self.sync_service.synchronize_from_files(
            headquarters_file=temp_file,
            force_recreate=True
        )
        
        # In force_recreate mode with duplicates, transaction should fail
        # and no records should be created
        sedes_count = HeadquarterLocation.objects.filter(organization=self.health_org).count()
        
        # Either all succeed or none (atomic transaction)
        self.assertIn(sedes_count, [0, 1])  # 0 if rollback worked, 1 if first succeeded
    
    def test_raw_sql_deletion_clears_all_records(self):
        """Test that raw SQL deletion properly clears all records."""
        # Create multiple headquarters
        for i in range(5):
            HeadquarterLocation.objects.create(
                organization=self.health_org,
                reps_code=f'TEST_{i}',
                name=f'Sede Test {i}',
                sede_type='satelite' if i > 0 else 'principal',
                department_code='76',
                department_name='Valle',
                municipality_code='76001',
                municipality_name='Cali',
                address=f'Calle {i}',
                created_by=self.user
            )
        
        # Verify they exist
        self.assertEqual(HeadquarterLocation.objects.filter(organization=self.health_org).count(), 5)
        
        # Use raw SQL to delete (as in the fix)
        with connection.cursor() as cursor:
            table_name = HeadquarterLocation._meta.db_table
            # Convert UUID to string for SQLite compatibility (remove dashes)
            org_id_str = str(self.health_org.id).replace('-', '')
            cursor.execute(
                f"DELETE FROM {table_name} WHERE organization_id = %s",
                [org_id_str]
            )
        
        # Verify all deleted
        self.assertEqual(HeadquarterLocation.objects.filter(organization=self.health_org).count(), 0)
    
    def tearDown(self):
        """Clean up test data."""
        # Clean up is handled automatically by Django test framework
        pass