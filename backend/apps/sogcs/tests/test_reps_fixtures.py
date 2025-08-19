"""
Test Data Fixtures for REPS XLS File Import Testing

This module provides comprehensive test data fixtures for various REPS
XLS file scenarios including valid data, invalid data, corrupted files,
encoding issues, and edge cases commonly found in Colombian healthcare
data imports.

Key fixture categories:
- Valid REPS data with realistic Colombian healthcare scenarios
- Invalid data with common validation errors
- Corrupted and malformed file structures
- Encoding issues (UTF-8, Latin-1, CP1252)
- Large datasets for performance testing
- Edge cases and boundary conditions
"""

import os
import tempfile
import pandas as pd
from io import BytesIO
from typing import Dict, List, Any, Tuple
from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.organization.models import Organization
from apps.organization.models.health import HealthOrganization

User = get_user_model()


class REPSTestDataFixtures:
    """
    Comprehensive test data fixtures for REPS import testing
    """
    
    @staticmethod
    def get_valid_reps_data() -> List[Dict[str, Any]]:
        """
        Returns valid REPS data representing typical Colombian healthcare facilities
        """
        return [
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS SALUD INTEGRAL S.A.S',
                'codigo_habilitacion': 'HAB-2024-001',
                'numero_sede': '001',
                'nombre_sede': 'SEDE PRINCIPAL CHAPINERO',
                'direccion': 'CARRERA 15 No. 93-47 PISO 3',
                'telefono': '(601) 456-7890',
                'email': 'principal@ipssaludintegral.com.co',
                'gerente': 'DR. CARLOS EDUARDO RODRIGUEZ MENDEZ',
                'tipo_zona': 'urbana',
                'zona': 'norte',
                'barrio': 'Chapinero Norte',
                'fax': '(601) 456-7891',
                'codigo_postal': '110111',
                'poblacion': '50000',
                'fecha_apertura': '2024-01-15'
            },
            {
                'departamento': 'Cundinamarca',
                'municipio': 'Soacha',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS SALUD INTEGRAL S.A.S',
                'codigo_habilitacion': 'HAB-2024-002',
                'numero_sede': '002',
                'nombre_sede': 'SEDE SOACHA CENTRO MEDICO',
                'direccion': 'CALLE 13 No. 15-30 CENTRO COMERCIAL PLAZA',
                'telefono': '(601) 456-7892',
                'email': 'soacha@ipssaludintegral.com.co',
                'gerente': 'DRA. MARIA FERNANDA GOMEZ JIMENEZ',
                'tipo_zona': 'urbana',
                'zona': 'sur',
                'barrio': 'Soacha Centro',
                'fax': '(601) 456-7893',
                'codigo_postal': '250001',
                'poblacion': '25000',
                'fecha_apertura': '2024-02-01'
            },
            {
                'departamento': 'Antioquia',
                'municipio': 'Medellín',
                'codigo_prestador': '050001234567',
                'nombre_prestador': 'CLINICA ESPECIALIZADA DEL VALLE S.A.S',
                'codigo_habilitacion': 'HAB-2024-003',
                'numero_sede': '001',
                'nombre_sede': 'SEDE PRINCIPAL EL POBLADO',
                'direccion': 'CARRERA 70 No. 50-23 EDIFICIO MEDICO',
                'telefono': '(604) 456-7890',
                'email': 'principal@clinicavalle.com.co',
                'gerente': 'DR. ANDRES FELIPE MORALES CASTRO',
                'tipo_zona': 'urbana',
                'zona': 'centro',
                'barrio': 'El Poblado',
                'fax': '(604) 456-7891',
                'codigo_postal': '050021',
                'poblacion': '75000',
                'fecha_apertura': '2024-03-01'
            },
            {
                'departamento': 'Valle del Cauca',
                'municipio': 'Cali',
                'codigo_prestador': '760001234567',
                'nombre_prestador': 'HOSPITAL UNIVERSITARIO PACIFICO E.S.E',
                'codigo_habilitacion': 'HAB-2024-004',
                'numero_sede': '001',
                'nombre_sede': 'SEDE PRINCIPAL UNIVERSITARIA',
                'direccion': 'AVENIDA 5N No. 23-55 ZONA UNIVERSITARIA',
                'telefono': '(602) 456-7890',
                'email': 'principal@hospitalpacifico.gov.co',
                'gerente': 'DR. LUIS CARLOS MARTINEZ VALENCIA',
                'tipo_zona': 'urbana',
                'zona': 'norte',
                'barrio': 'Universitario',
                'fax': '(602) 456-7891',
                'codigo_postal': '760001',
                'poblacion': '100000',
                'fecha_apertura': '2024-01-01'
            },
            {
                'departamento': 'Santander',
                'municipio': 'Bucaramanga',
                'codigo_prestador': '680001234567',
                'nombre_prestador': 'CENTRO MEDICO CHICAMOCHA LTDA',
                'codigo_habilitacion': 'HAB-2024-005',
                'numero_sede': '001',
                'nombre_sede': 'SEDE PRINCIPAL CABECERA',
                'direccion': 'CARRERA 33 No. 45-12 SECTOR CABECERA',
                'telefono': '(607) 456-7890',
                'email': 'principal@medicochicamocha.com',
                'gerente': 'DRA. SANDRA PATRICIA HERNANDEZ RUIZ',
                'tipo_zona': 'urbana',
                'zona': 'centro',
                'barrio': 'Cabecera del Llano',
                'fax': '(607) 456-7891',
                'codigo_postal': '680001',
                'poblacion': '30000',
                'fecha_apertura': '2024-04-01'
            }
        ]
    
    @staticmethod
    def get_invalid_reps_data() -> List[Dict[str, Any]]:
        """
        Returns invalid REPS data with common validation errors
        """
        return [
            {
                # Missing required fields
                'departamento': '',
                'municipio': 'Bogotá D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'IPS DATOS INVALIDOS S.A.S',
                'codigo_habilitacion': 'HAB-INVALID-001',
                'numero_sede': '001',
                'nombre_sede': '',  # Missing required field
                'direccion': 'CARRERA 15 No. 93-47',
                'telefono': 'invalid-phone',  # Invalid phone format
                'email': 'invalid-email',  # Invalid email format
                'gerente': 'DR. DATOS INVALIDOS',
                'tipo_zona': 'urbana',
                'zona': 'norte',
                'barrio': 'Test'
            },
            {
                # More validation errors
                'departamento': 'Cundinamarca',
                'municipio': '',  # Missing required field
                'codigo_prestador': '123',  # Too short
                'nombre_prestador': 'IPS MAS ERRORES S.A.S',
                'codigo_habilitacion': 'HAB-INVALID-002',
                'numero_sede': '',  # Missing required field
                'nombre_sede': 'SEDE CON ERRORES',
                'direccion': '',  # Missing required field
                'telefono': '123',  # Too short
                'email': '@invalid.com',  # Invalid email
                'gerente': '',  # Missing required field
                'tipo_zona': 'urbana',
                'zona': 'sur',
                'barrio': 'Test'
            },
            {
                # Special characters and encoding issues
                'departamento': 'BogotÃ¡ D.C.',  # Encoding issue
                'municipio': 'BogotÃ¡ D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'ClÃ­nica EspecialistasÂ S.A.S',  # Encoding issue
                'codigo_habilitacion': 'HAB-ENCODING-001',
                'numero_sede': '003',
                'nombre_sede': 'SEDE CON CARACTERES ESPECIALES âœ"',
                'direccion': 'CARRERA 15 # 93-47 â€" EDIFICIO',
                'telefono': '6014567890',
                'email': 'encoding@test.com',
                'gerente': 'DR. JosÃ© MarÃ­a RodrÃ­guez',  # Encoding issue
                'tipo_zona': 'urbana',
                'zona': 'centro',
                'barrio': 'ChapineroÂ'
            }
        ]
    
    @staticmethod
    def get_large_dataset() -> List[Dict[str, Any]]:
        """
        Returns a large dataset for performance testing (100 records)
        """
        base_data = REPSTestDataFixtures.get_valid_reps_data()[0]
        large_dataset = []
        
        departments = [
            ('Cundinamarca', 'Bogotá D.C.', '11'),
            ('Antioquia', 'Medellín', '05'),
            ('Valle del Cauca', 'Cali', '76'),
            ('Santander', 'Bucaramanga', '68'),
            ('Atlántico', 'Barranquilla', '08')
        ]
        
        for i in range(1, 101):
            dept, city, code = departments[i % len(departments)]
            
            record = base_data.copy()
            record.update({
                'departamento': dept,
                'municipio': city,
                'codigo_prestador': f'{code}001234{i:03d}',
                'numero_sede': f'{i:03d}',
                'nombre_sede': f'SEDE PERFORMANCE TEST {i:03d}',
                'direccion': f'CARRERA {i} No. {i}-{i}',
                'telefono': f'({code}1) 456-{i:04d}',
                'email': f'sede{i:03d}@performance.com',
                'gerente': f'DR. PERFORMANCE TEST {i}',
                'barrio': f'Barrio Test {i}'
            })
            
            large_dataset.append(record)
        
        return large_dataset
    
    @staticmethod
    def get_mixed_quality_data() -> List[Dict[str, Any]]:
        """
        Returns mixed quality data (some valid, some invalid)
        """
        valid_data = REPSTestDataFixtures.get_valid_reps_data()[:3]
        invalid_data = REPSTestDataFixtures.get_invalid_reps_data()[:2]
        
        # Mix valid and invalid data
        mixed_data = []
        mixed_data.extend(valid_data)
        mixed_data.extend(invalid_data)
        
        return mixed_data
    
    @staticmethod
    def get_encoding_test_data() -> List[Dict[str, Any]]:
        """
        Returns data with various encoding issues common in REPS files
        """
        return [
            {
                'departamento': 'BogotÃ¡ D.C.',  # UTF-8 encoded as Latin-1
                'municipio': 'BogotÃ¡ D.C.',
                'codigo_prestador': '110001234567',
                'nombre_prestador': 'ClÃ­nica de EspecialistasÂ MÃ©dicos S.A.S',
                'codigo_habilitacion': 'ENC-001',
                'numero_sede': '001',
                'nombre_sede': 'SEDE PRINCIPAL â€" ESPECIALIDADES MÃ©DICAS',
                'direccion': 'CARRERA 11 # 93-47 â€" EDIFICIO MÃ‰DICO',
                'telefono': '6014567890',
                'email': 'especialidades@clinica.com',
                'gerente': 'DR. JosÃ© MarÃ­a RodrÃ­guez PeÃ±a',
                'tipo_zona': 'urbana',
                'zona': 'norte',
                'barrio': 'Chapinero Norte'
            },
            {
                'departamento': 'Antioquia',
                'municipio': 'MedellÃ­n',
                'codigo_prestador': '050001234567',
                'nombre_prestador': 'HOSPITAL UNIVERSITARIO SAN VICENTE FUNDACIÃ"N',
                'codigo_habilitacion': 'ENC-002',
                'numero_sede': '001',
                'nombre_sede': 'SEDE PRINCIPAL â€" ATENCIÃ"N PRIMARIA',
                'direccion': 'CARRERA 70 # 50-23 â€" SECTOR SALUD',
                'telefono': '6044567890',
                'email': 'atencion@hospital.org.co',
                'gerente': 'DRA. MarÃ­a Fernanda GÃ³mez JimÃ©nez',
                'tipo_zona': 'urbana',
                'zona': 'centro',
                'barrio': 'El Poblado'
            }
        ]
    
    @staticmethod
    def create_excel_file(data: List[Dict[str, Any]], file_name: str = None) -> str:
        """
        Creates an Excel file with the provided data
        
        Args:
            data: List of dictionaries containing REPS data
            file_name: Optional file name (will generate temp file if not provided)
            
        Returns:
            Path to created Excel file
        """
        # Standard REPS headers
        headers = [
            'departamento', 'municipio', 'codigo_prestador', 'nombre_prestador',
            'codigo_habilitacion', 'numero_sede', 'nombre_sede', 'direccion',
            'telefono', 'email', 'gerente', 'tipo_zona', 'zona', 'barrio',
            'fax', 'codigo_postal', 'poblacion', 'fecha_apertura'
        ]
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Ensure all headers exist
        for header in headers:
            if header not in df.columns:
                df[header] = ''
        
        # Reorder columns
        df = df[headers]
        
        # Create file
        if file_name:
            file_path = file_name
        else:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
            temp_file.close()
            file_path = temp_file.name
        
        # Save as Excel
        df.to_excel(file_path, index=False, engine='openpyxl')
        
        return file_path
    
    @staticmethod
    def create_html_file(data: List[Dict[str, Any]], encoding: str = 'utf-8', file_name: str = None) -> str:
        """
        Creates an HTML file (REPS format) with the provided data
        
        Args:
            data: List of dictionaries containing REPS data
            encoding: File encoding to use
            file_name: Optional file name
            
        Returns:
            Path to created HTML file
        """
        headers = [
            'departamento', 'municipio', 'codigo_prestador', 'nombre_prestador',
            'codigo_habilitacion', 'numero_sede', 'nombre_sede', 'direccion',
            'telefono', 'email', 'gerente', 'tipo_zona', 'zona', 'barrio'
        ]
        
        # Build HTML table
        html_content = """
        <html>
        <head>
            <meta charset="{encoding}">
            <title>Reporte REPS - Sedes Habilitadas</title>
        </head>
        <body>
            <table border="1">
                <tr>
        """.format(encoding=encoding)
        
        # Add headers
        for header in headers:
            html_content += f"<th>{header.upper()}</th>"
        html_content += "</tr>\n"
        
        # Add data rows
        for row in data:
            html_content += "<tr>"
            for header in headers:
                value = row.get(header, '')
                html_content += f"<td>{value}</td>"
            html_content += "</tr>\n"
        
        html_content += """
            </table>
        </body>
        </html>
        """
        
        # Create file
        if file_name:
            file_path = file_name
        else:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xls', mode='w', encoding=encoding)
            temp_file.close()
            file_path = temp_file.name
        
        # Write HTML content
        with open(file_path, 'w', encoding=encoding) as f:
            f.write(html_content)
        
        return file_path
    
    @staticmethod
    def create_corrupted_file(file_name: str = None) -> str:
        """
        Creates a corrupted file for testing error handling
        
        Args:
            file_name: Optional file name
            
        Returns:
            Path to corrupted file
        """
        if file_name:
            file_path = file_name
        else:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
            temp_file.close()
            file_path = temp_file.name
        
        # Write corrupted data
        with open(file_path, 'wb') as f:
            f.write(b'CORRUPTED_DATA_NOT_VALID_EXCEL_OR_HTML_CONTENT_12345')
        
        return file_path
    
    @staticmethod
    def create_empty_file(file_name: str = None) -> str:
        """
        Creates an empty file for testing edge cases
        
        Args:
            file_name: Optional file name
            
        Returns:
            Path to empty file
        """
        if file_name:
            file_path = file_name
        else:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
            temp_file.close()
            file_path = temp_file.name
        
        # Create empty Excel file
        empty_df = pd.DataFrame()
        empty_df.to_excel(file_path, index=False, engine='openpyxl')
        
        return file_path
    
    @staticmethod
    def create_csv_file(data: List[Dict[str, Any]], file_name: str = None, encoding: str = 'utf-8') -> str:
        """
        Creates a CSV file with the provided data
        
        Args:
            data: List of dictionaries containing REPS data
            file_name: Optional file name
            encoding: File encoding to use
            
        Returns:
            Path to created CSV file
        """
        headers = [
            'departamento', 'municipio', 'codigo_prestador', 'nombre_prestador',
            'codigo_habilitacion', 'numero_sede', 'nombre_sede', 'direccion',
            'telefono', 'email', 'gerente', 'tipo_zona', 'zona', 'barrio'
        ]
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Ensure all headers exist
        for header in headers:
            if header not in df.columns:
                df[header] = ''
        
        # Reorder columns
        df = df[headers]
        
        # Create file
        if file_name:
            file_path = file_name
        else:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.csv')
            temp_file.close()
            file_path = temp_file.name
        
        # Save as CSV
        df.to_csv(file_path, index=False, encoding=encoding)
        
        return file_path


class TestREPSFixtures(TestCase):
    """
    Test class demonstrating usage of REPS test fixtures
    """
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data"""
        cls.user = User.objects.create_user(
            email='fixtures@example.com',
            password='testpass123'
        )
        
        cls.organization = Organization.objects.create(
            razon_social='IPS Fixtures Test S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips'
        )
        
        cls.health_organization = HealthOrganization.objects.create(
            organization=cls.organization,
            reps_code='123456789012'
        )
    
    def setUp(self):
        """Set up each test method"""
        self.fixtures = REPSTestDataFixtures()
        self.temp_files = []
    
    def tearDown(self):
        """Clean up temporary files"""
        for file_path in self.temp_files:
            try:
                os.unlink(file_path)
            except FileNotFoundError:
                pass
    
    def test_valid_reps_data_fixture(self):
        """Test valid REPS data fixture"""
        valid_data = self.fixtures.get_valid_reps_data()
        
        self.assertEqual(len(valid_data), 5)
        
        # Check first record
        first_record = valid_data[0]
        self.assertEqual(first_record['departamento'], 'Cundinamarca')
        self.assertEqual(first_record['municipio'], 'Bogotá D.C.')
        self.assertEqual(first_record['numero_sede'], '001')
        self.assertIn('IPS SALUD INTEGRAL', first_record['nombre_prestador'])
        
        # Check data quality
        for record in valid_data:
            self.assertIsNotNone(record.get('nombre_sede'))
            self.assertIsNotNone(record.get('departamento'))
            self.assertIsNotNone(record.get('municipio'))
            self.assertIn('@', record.get('email', ''))
    
    def test_invalid_reps_data_fixture(self):
        """Test invalid REPS data fixture"""
        invalid_data = self.fixtures.get_invalid_reps_data()
        
        self.assertEqual(len(invalid_data), 3)
        
        # Check for expected validation issues
        first_invalid = invalid_data[0]
        self.assertEqual(first_invalid['departamento'], '')  # Missing
        self.assertEqual(first_invalid['nombre_sede'], '')   # Missing
        self.assertEqual(first_invalid['telefono'], 'invalid-phone')  # Invalid format
        self.assertEqual(first_invalid['email'], 'invalid-email')     # Invalid format
    
    def test_large_dataset_fixture(self):
        """Test large dataset fixture for performance testing"""
        large_data = self.fixtures.get_large_dataset()
        
        self.assertEqual(len(large_data), 100)
        
        # Check data variety
        departments = set(record['departamento'] for record in large_data)
        self.assertGreater(len(departments), 1)
        
        # Check sequential numbering
        sede_numbers = [record['numero_sede'] for record in large_data]
        expected_numbers = [f'{i:03d}' for i in range(1, 101)]
        self.assertEqual(sede_numbers, expected_numbers)
    
    def test_encoding_test_data_fixture(self):
        """Test encoding issues data fixture"""
        encoding_data = self.fixtures.get_encoding_test_data()
        
        self.assertEqual(len(encoding_data), 2)
        
        # Check for encoding artifacts
        first_record = encoding_data[0]
        self.assertIn('Ã¡', first_record['departamento'])  # Should contain encoding issues
        self.assertIn('Ã­', first_record['nombre_prestador'])
        self.assertIn('â€', first_record['nombre_sede'])
    
    def test_create_excel_file_fixture(self):
        """Test Excel file creation"""
        test_data = self.fixtures.get_valid_reps_data()[:2]
        
        file_path = self.fixtures.create_excel_file(test_data)
        self.temp_files.append(file_path)
        
        # Verify file was created
        self.assertTrue(os.path.exists(file_path))
        self.assertTrue(file_path.endswith('.xlsx'))
        
        # Verify file can be read
        df = pd.read_excel(file_path)
        self.assertEqual(len(df), 2)
        self.assertIn('departamento', df.columns)
        self.assertIn('nombre_sede', df.columns)
    
    def test_create_html_file_fixture(self):
        """Test HTML file creation (REPS format)"""
        test_data = self.fixtures.get_valid_reps_data()[:1]
        
        file_path = self.fixtures.create_html_file(test_data, encoding='utf-8')
        self.temp_files.append(file_path)
        
        # Verify file was created
        self.assertTrue(os.path.exists(file_path))
        self.assertTrue(file_path.endswith('.xls'))
        
        # Verify HTML content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn('<table', content)
            self.assertIn('departamento', content)
            self.assertIn('Cundinamarca', content)
    
    def test_create_corrupted_file_fixture(self):
        """Test corrupted file creation"""
        file_path = self.fixtures.create_corrupted_file()
        self.temp_files.append(file_path)
        
        # Verify file was created
        self.assertTrue(os.path.exists(file_path))
        
        # Verify it contains corrupted data
        with open(file_path, 'rb') as f:
            content = f.read()
            self.assertIn(b'CORRUPTED_DATA', content)
    
    def test_create_empty_file_fixture(self):
        """Test empty file creation"""
        file_path = self.fixtures.create_empty_file()
        self.temp_files.append(file_path)
        
        # Verify file was created
        self.assertTrue(os.path.exists(file_path))
        
        # Verify file is empty
        df = pd.read_excel(file_path)
        self.assertEqual(len(df), 0)
        self.assertEqual(len(df.columns), 0)
    
    def test_create_csv_file_fixture(self):
        """Test CSV file creation"""
        test_data = self.fixtures.get_valid_reps_data()[:2]
        
        file_path = self.fixtures.create_csv_file(test_data)
        self.temp_files.append(file_path)
        
        # Verify file was created
        self.assertTrue(os.path.exists(file_path))
        self.assertTrue(file_path.endswith('.csv'))
        
        # Verify file can be read
        df = pd.read_csv(file_path)
        self.assertEqual(len(df), 2)
        self.assertIn('departamento', df.columns)
    
    def test_mixed_quality_data_fixture(self):
        """Test mixed quality data fixture"""
        mixed_data = self.fixtures.get_mixed_quality_data()
        
        self.assertEqual(len(mixed_data), 5)  # 3 valid + 2 invalid
        
        # Should contain both valid and invalid records
        valid_count = sum(1 for record in mixed_data 
                         if record.get('departamento') and record.get('nombre_sede'))
        self.assertGreater(valid_count, 0)
        self.assertLess(valid_count, len(mixed_data))


class REPSTestScenarios:
    """
    Pre-configured test scenarios using fixtures
    """
    
    @staticmethod
    def get_successful_import_scenario() -> Tuple[str, List[Dict[str, Any]]]:
        """
        Returns file path and expected data for successful import scenario
        """
        fixtures = REPSTestDataFixtures()
        data = fixtures.get_valid_reps_data()
        file_path = fixtures.create_excel_file(data)
        return file_path, data
    
    @staticmethod
    def get_validation_errors_scenario() -> Tuple[str, List[Dict[str, Any]]]:
        """
        Returns file path and expected data for validation errors scenario
        """
        fixtures = REPSTestDataFixtures()
        data = fixtures.get_invalid_reps_data()
        file_path = fixtures.create_excel_file(data)
        return file_path, data
    
    @staticmethod
    def get_encoding_issues_scenario() -> Tuple[str, List[Dict[str, Any]]]:
        """
        Returns file path and expected data for encoding issues scenario
        """
        fixtures = REPSTestDataFixtures()
        data = fixtures.get_encoding_test_data()
        file_path = fixtures.create_html_file(data, encoding='latin-1')
        return file_path, data
    
    @staticmethod
    def get_performance_test_scenario() -> Tuple[str, List[Dict[str, Any]]]:
        """
        Returns file path and expected data for performance testing scenario
        """
        fixtures = REPSTestDataFixtures()
        data = fixtures.get_large_dataset()
        file_path = fixtures.create_excel_file(data)
        return file_path, data
    
    @staticmethod
    def get_mixed_results_scenario() -> Tuple[str, List[Dict[str, Any]]]:
        """
        Returns file path and expected data for mixed results scenario
        """
        fixtures = REPSTestDataFixtures()
        data = fixtures.get_mixed_quality_data()
        file_path = fixtures.create_excel_file(data)
        return file_path, data
    
    @staticmethod
    def get_corrupted_file_scenario() -> str:
        """
        Returns file path for corrupted file scenario
        """
        fixtures = REPSTestDataFixtures()
        return fixtures.create_corrupted_file()
    
    @staticmethod
    def get_empty_file_scenario() -> str:
        """
        Returns file path for empty file scenario
        """
        fixtures = REPSTestDataFixtures()
        return fixtures.create_empty_file()


class TestREPSScenarios(TestCase):
    """
    Test class demonstrating usage of pre-configured test scenarios
    """
    
    def setUp(self):
        """Set up each test method"""
        self.temp_files = []
    
    def tearDown(self):
        """Clean up temporary files"""
        for file_path in self.temp_files:
            try:
                os.unlink(file_path)
            except FileNotFoundError:
                pass
    
    def test_successful_import_scenario(self):
        """Test successful import scenario"""
        file_path, expected_data = REPSTestScenarios.get_successful_import_scenario()
        self.temp_files.append(file_path)
        
        self.assertTrue(os.path.exists(file_path))
        self.assertEqual(len(expected_data), 5)
        
        # All records should be valid
        for record in expected_data:
            self.assertIsNotNone(record.get('nombre_sede'))
            self.assertIsNotNone(record.get('departamento'))
            self.assertIsNotNone(record.get('municipio'))
    
    def test_validation_errors_scenario(self):
        """Test validation errors scenario"""
        file_path, expected_data = REPSTestScenarios.get_validation_errors_scenario()
        self.temp_files.append(file_path)
        
        self.assertTrue(os.path.exists(file_path))
        self.assertEqual(len(expected_data), 3)
        
        # All records should have validation issues
        issues_found = 0
        for record in expected_data:
            if (not record.get('nombre_sede') or 
                not record.get('departamento') or
                'invalid' in record.get('telefono', '') or
                'invalid' in record.get('email', '')):
                issues_found += 1
        
        self.assertGreater(issues_found, 0)
    
    def test_corrupted_file_scenario(self):
        """Test corrupted file scenario"""
        file_path = REPSTestScenarios.get_corrupted_file_scenario()
        self.temp_files.append(file_path)
        
        self.assertTrue(os.path.exists(file_path))
        
        # Should not be readable as Excel
        with self.assertRaises(Exception):
            pd.read_excel(file_path)
    
    def test_empty_file_scenario(self):
        """Test empty file scenario"""
        file_path = REPSTestScenarios.get_empty_file_scenario()
        self.temp_files.append(file_path)
        
        self.assertTrue(os.path.exists(file_path))
        
        # Should be readable but empty
        df = pd.read_excel(file_path)
        self.assertEqual(len(df), 0)