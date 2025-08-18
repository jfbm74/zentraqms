"""
Tests for SOGCS serializers.

Tests comprehensive serializer functionality including validation logic,
field transformations, nested serializations, and Colombian health
compliance validation.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory
from rest_framework.exceptions import ValidationError
from decimal import Decimal
from datetime import date, timedelta
import uuid

from apps.organization.serializers.sogcs_sedes_serializers import (
    HeadquarterLocationListSerializer,
    HeadquarterLocationSerializer,
    HeadquarterLocationCreateSerializer,
    HeadquarterLocationImportSerializer,
    HeadquarterLocationSyncSerializer,
    EnabledHealthServiceListSerializer,
    EnabledHealthServiceSerializer,
    EnabledHealthServiceCreateSerializer,
    ServiceComplianceUpdateSerializer,
    ServiceRenewalSerializer,
    ServiceHabilitationProcessListSerializer,
    ServiceHabilitationProcessSerializer,
    ServiceHabilitationProcessCreateSerializer,
    ProcessDocumentUploadSerializer,
    ProcessPhaseAdvanceSerializer,
    HabilitationAlertSerializer,
    REPSValidationResultSerializer,
    BulkHeadquartersImportSerializer,
    BulkServicesUpdateSerializer
)
from apps.organization.tests.factories import (
    HeadquarterLocationFactory, EnabledHealthServiceFactory, 
    ServiceHabilitationProcessFactory, HealthOrganizationProfileFactory,
    UserFactory
)

User = get_user_model()


class HeadquarterLocationSerializerTestCase(TestCase):
    """Test cases for HeadquarterLocation serializers."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory.create()
        self.health_org = HealthOrganizationProfileFactory.create()
        self.headquarters = HeadquarterLocationFactory.create(
            organization=self.health_org,
            created_by=self.user
        )
        self.factory = APIRequestFactory()
    
    def test_headquarters_list_serializer(self):
        """Test HeadquarterLocationListSerializer."""
        serializer = HeadquarterLocationListSerializer(instance=self.headquarters)
        data = serializer.data
        
        # Verify required fields are present
        self.assertIn('id', data)
        self.assertIn('reps_code', data)
        self.assertIn('name', data)
        self.assertIn('sede_type', data)
        self.assertIn('organization_name', data)
        self.assertIn('department_name', data)
        self.assertIn('municipality_name', data)
        self.assertIn('operational_status', data)
        self.assertIn('habilitation_status', data)
        self.assertIn('is_operational', data)
        self.assertIn('services_count', data)
        
        # Verify computed fields
        self.assertEqual(data['id'], str(self.headquarters.id))
        self.assertEqual(data['reps_code'], self.headquarters.reps_code)
        self.assertIsInstance(data['is_operational'], bool)
        self.assertIsInstance(data['services_count'], int)
    
    def test_headquarters_detail_serializer(self):
        """Test HeadquarterLocationSerializer with all fields."""
        serializer = HeadquarterLocationSerializer(instance=self.headquarters)
        data = serializer.data
        
        # Verify all model fields are included
        self.assertIn('id', data)
        self.assertIn('reps_code', data)
        self.assertIn('name', data)
        self.assertIn('latitude', data)
        self.assertIn('longitude', data)
        self.assertIn('complete_address', data)
        self.assertIn('days_until_renewal', data)
        
        # Verify read-only fields are present
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)
        self.assertIn('is_operational', data)
    
    def test_headquarters_create_serializer_valid_data(self):
        """Test HeadquarterLocationCreateSerializer with valid data."""
        request = self.factory.post('/')
        request.user = self.user
        
        valid_data = {
            'organization': str(self.health_org.id),
            'reps_code': '11005678',
            'name': 'Nueva Sede Test',
            'sede_type': 'satelite',
            'department_code': '11',
            'department_name': 'Bogotá D.C.',
            'municipality_code': '11001',
            'municipality_name': 'Bogotá',
            'address': 'Calle 123 # 45-67',
            'phone_primary': '+57 1 234 5678',
            'email': 'nueva.sede@test.com',
            'administrative_contact': 'Juan Pérez',
            'habilitation_status': 'en_proceso',
            'operational_status': 'activa'
        }
        
        serializer = HeadquarterLocationCreateSerializer(
            data=valid_data,
            context={'request': request}
        )
        
        self.assertTrue(serializer.is_valid())
        
        # Create instance
        headquarters = serializer.save()
        
        self.assertEqual(headquarters.reps_code, '11005678')
        self.assertEqual(headquarters.created_by, self.user)
        self.assertEqual(headquarters.updated_by, self.user)
    
    def test_headquarters_create_serializer_auto_main_headquarters(self):
        """Test automatic main headquarters assignment for first headquarters."""
        request = self.factory.post('/')
        request.user = self.user
        
        # Create new organization without headquarters
        new_org = HealthOrganizationProfileFactory.create()
        
        valid_data = {
            'organization': str(new_org.id),
            'reps_code': '11999999',
            'name': 'Primera Sede',
            'sede_type': 'principal',
            'department_code': '11',
            'department_name': 'Bogotá D.C.',
            'municipality_code': '11001',
            'municipality_name': 'Bogotá',
            'address': 'Calle 123 # 45-67',
            'phone_primary': '+57 1 234 5678',
            'email': 'primera.sede@test.com',
            'administrative_contact': 'Juan Pérez'
        }
        
        serializer = HeadquarterLocationCreateSerializer(
            data=valid_data,
            context={'request': request}
        )
        
        self.assertTrue(serializer.is_valid())
        
        headquarters = serializer.save()
        
        # Should automatically be set as main headquarters
        self.assertTrue(headquarters.is_main_headquarters)
    
    def test_headquarters_serializer_validation_errors(self):
        """Test HeadquarterLocationSerializer validation errors."""
        request = self.factory.post('/')
        request.user = self.user
        
        # Test invalid REPS code
        invalid_data = {
            'organization': str(self.health_org.id),
            'reps_code': 'inv@lid',  # Invalid format - contains special characters
            'name': 'Test Sede',
            'department_code': '11',
            'department_name': 'Bogotá D.C.',
            'municipality_code': '11001',
            'municipality_name': 'Bogotá',
            'address': 'Calle 123 # 45-67',
            'phone_primary': '+57 1 234 5678',
            'email': 'test.sede@test.com',
            'administrative_contact': 'Juan Pérez'
        }
        
        serializer = HeadquarterLocationCreateSerializer(
            data=invalid_data,
            context={'request': request}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('reps_code', serializer.errors)
    
    def test_headquarters_serializer_suspension_date_validation(self):
        """Test suspension date validation in serializer."""
        request = self.factory.post('/')
        request.user = self.user
        
        # Invalid: end date before start date
        invalid_data = {
            'organization': str(self.health_org.id),
            'reps_code': '11888888',
            'name': 'Test Sede',
            'department_code': '11',
            'department_name': 'Bogotá D.C.',
            'municipality_code': '11001',
            'municipality_name': 'Bogotá',
            'address': 'Calle 123 # 45-67',
            'phone_primary': '+57 1 234 5678',
            'email': 'suspension.sede@test.com',
            'administrative_contact': 'Juan Pérez',
            'suspension_start': '2024-02-01',
            'suspension_end': '2024-01-01'  # Before start
        }
        
        serializer = HeadquarterLocationCreateSerializer(
            data=invalid_data,
            context={'request': request}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('suspension_end', serializer.errors)
    
    def test_headquarters_serializer_capacity_validation(self):
        """Test capacity validation in serializer."""
        request = self.factory.post('/')
        request.user = self.user
        
        # Invalid: ICU beds exceed total beds
        invalid_data = {
            'organization': str(self.health_org.id),
            'reps_code': '11777777',
            'name': 'Test Sede',
            'department_code': '11',
            'department_name': 'Bogotá D.C.',
            'municipality_code': '11001',
            'municipality_name': 'Bogotá',
            'address': 'Calle 123 # 45-67',
            'phone_primary': '+57 1 234 5678',
            'email': 'capacity.sede@test.com',
            'administrative_contact': 'Juan Pérez',
            'total_beds': 10,
            'icu_beds': 15  # Exceeds total
        }
        
        serializer = HeadquarterLocationCreateSerializer(
            data=invalid_data,
            context={'request': request}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('icu_beds', serializer.errors)
    
    def test_headquarters_import_serializer(self):
        """Test HeadquarterLocationImportSerializer."""
        # Create mock Excel file
        excel_content = b'mock excel content'
        excel_file = SimpleUploadedFile(
            "headquarters.xlsx",
            excel_content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
        valid_data = {
            'file': excel_file,
            'validate_only': True,
            'organization_id': str(self.health_org.id)
        }
        
        serializer = HeadquarterLocationImportSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
    
    def test_headquarters_import_serializer_invalid_file(self):
        """Test HeadquarterLocationImportSerializer with invalid file."""
        # Create invalid file type
        invalid_file = SimpleUploadedFile(
            "headquarters.txt",
            b'invalid content',
            content_type="text/plain"
        )
        
        invalid_data = {
            'file': invalid_file,
            'organization_id': str(self.health_org.id)
        }
        
        serializer = HeadquarterLocationImportSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('file', serializer.errors)
    
    def test_headquarters_sync_serializer(self):
        """Test HeadquarterLocationSyncSerializer."""
        valid_data = {
            'headquarters_ids': [str(self.headquarters.id)],
            'force_sync': True
        }
        
        serializer = HeadquarterLocationSyncSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        
        # Test empty list (sync all)
        valid_data_empty = {
            'headquarters_ids': [],
            'force_sync': False
        }
        
        serializer = HeadquarterLocationSyncSerializer(data=valid_data_empty)
        self.assertTrue(serializer.is_valid())


class EnabledHealthServiceSerializerTestCase(TestCase):
    """Test cases for EnabledHealthService serializers."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory.create()
        self.headquarters = HeadquarterLocationFactory.create()
        self.service = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            created_by=self.user
        )
        self.factory = APIRequestFactory()
    
    def test_service_list_serializer(self):
        """Test EnabledHealthServiceListSerializer."""
        serializer = EnabledHealthServiceListSerializer(instance=self.service)
        data = serializer.data
        
        # Verify required fields
        self.assertIn('id', data)
        self.assertIn('service_code', data)
        self.assertIn('service_name', data)
        self.assertIn('service_group', data)
        self.assertIn('complexity_level', data)
        self.assertIn('headquarters_name', data)
        self.assertIn('habilitation_status', data)
        self.assertIn('is_valid', data)
        self.assertIn('overall_compliance', data)
        
        # Verify computed fields
        self.assertIsInstance(data['is_valid'], bool)
        self.assertIsInstance(data['overall_compliance'], (int, float, str))
    
    def test_service_detail_serializer(self):
        """Test EnabledHealthServiceSerializer with all fields."""
        # Create service with interdependencies
        dependency = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters
        )
        self.service.interdependencies.add(dependency)
        
        serializer = EnabledHealthServiceSerializer(instance=self.service)
        data = serializer.data
        
        # Verify all fields
        self.assertIn('id', data)
        self.assertIn('service_code', data)
        self.assertIn('missing_dependencies', data)
        self.assertIn('installed_capacity', data)
        self.assertIn('quality_indicators', data)
        
        # Verify missing dependencies structure
        self.assertIsInstance(data['missing_dependencies'], list)
    
    def test_service_create_serializer_valid_data(self):
        """Test EnabledHealthServiceCreateSerializer with valid data."""
        request = self.factory.post('/')
        request.user = self.user
        
        valid_data = {
            'headquarters': str(self.headquarters.id),
            'service_code': '202',
            'service_name': 'Radiología',
            'service_group': 'apoyo_diagnostico',
            'complexity_level': 2,
            'intramural': True,
            'habilitation_date': '2024-01-01',
            'habilitation_expiry': '2026-01-01',
            'habilitation_act': 'Acto-123456',
            'distinctive_code': 'DC12345679',
            'infrastructure_compliance': 90.0,
            'equipment_compliance': 85.0,
            'medication_compliance': 88.0
        }
        
        serializer = EnabledHealthServiceCreateSerializer(
            data=valid_data,
            context={'request': request}
        )
        
        self.assertTrue(serializer.is_valid())
        
        service = serializer.save()
        
        self.assertEqual(service.service_code, '202')
        self.assertEqual(service.created_by, self.user)
    
    def test_service_serializer_modality_validation(self):
        """Test service modality validation in serializer."""
        request = self.factory.post('/')
        request.user = self.user
        
        # No modality selected (invalid)
        invalid_data = {
            'headquarters': str(self.headquarters.id),
            'service_code': '203',
            'service_name': 'Test Service',
            'service_group': 'consulta_externa',
            'complexity_level': 1,
            'habilitation_date': '2024-01-01',
            'habilitation_expiry': '2026-01-01',
            'habilitation_act': 'Acto-123456',
            'distinctive_code': 'DC12345679',
            'intramural': False,
            'extramural': False,
            'domiciliary': False,
            'telemedicine': False
        }
        
        serializer = EnabledHealthServiceCreateSerializer(
            data=invalid_data,
            context={'request': request}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('intramural', serializer.errors)
    
    def test_service_serializer_date_validation(self):
        """Test service date validation in serializer."""
        request = self.factory.post('/')
        request.user = self.user
        
        # Expiry before habilitation date
        invalid_data = {
            'headquarters': str(self.headquarters.id),
            'service_code': '204',
            'service_name': 'Test Service',
            'service_group': 'consulta_externa',
            'complexity_level': 1,
            'habilitation_act': 'Acto-123456',
            'distinctive_code': 'DC12345679',
            'intramural': True,
            'habilitation_date': '2024-01-01',
            'habilitation_expiry': '2023-01-01'  # Before habilitation
        }
        
        serializer = EnabledHealthServiceCreateSerializer(
            data=invalid_data,
            context={'request': request}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('habilitation_expiry', serializer.errors)
    
    def test_service_serializer_compliance_validation(self):
        """Test service compliance percentage validation."""
        request = self.factory.post('/')
        request.user = self.user
        
        # Invalid compliance percentage
        invalid_data = {
            'headquarters': str(self.headquarters.id),
            'service_code': '205',
            'service_name': 'Test Service',
            'service_group': 'consulta_externa',
            'complexity_level': 1,
            'habilitation_date': '2024-01-01',
            'habilitation_expiry': '2026-01-01',
            'habilitation_act': 'Acto-123456',
            'distinctive_code': 'DC12345679',
            'intramural': True,
            'infrastructure_compliance': 150.0  # Above 100%
        }
        
        serializer = EnabledHealthServiceCreateSerializer(
            data=invalid_data,
            context={'request': request}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('infrastructure_compliance', serializer.errors)
    
    def test_service_create_with_interdependencies(self):
        """Test creating service with interdependencies."""
        request = self.factory.post('/')
        request.user = self.user
        
        dependency = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters
        )
        
        valid_data = {
            'headquarters': str(self.headquarters.id),
            'service_code': '206',
            'service_name': 'Surgery Service',
            'service_group': 'quirurgicos',
            'complexity_level': 2,
            'habilitation_date': '2024-01-01',
            'habilitation_expiry': '2026-01-01',
            'habilitation_act': 'Acto-123456',
            'distinctive_code': 'DC12345679',
            'intramural': True,
            'interdependencies': [str(dependency.id)]
        }
        
        serializer = EnabledHealthServiceCreateSerializer(
            data=valid_data,
            context={'request': request}
        )
        
        self.assertTrue(serializer.is_valid())
        
        service = serializer.save()
        
        self.assertIn(dependency, service.interdependencies.all())
    
    def test_service_compliance_update_serializer(self):
        """Test ServiceComplianceUpdateSerializer."""
        valid_data = {
            'infrastructure_compliance': 95.0,
            'equipment_compliance': 90.0,
            'medication_compliance': 92.0,
            'self_evaluation_score': 88.0
        }
        
        serializer = ServiceComplianceUpdateSerializer(
            instance=self.service,
            data=valid_data,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        
        updated_service = serializer.save()
        
        self.assertEqual(updated_service.infrastructure_compliance, Decimal('95.0'))
    
    def test_service_renewal_serializer(self):
        """Test ServiceRenewalSerializer."""
        # Create service that needs renewal
        today = date.today()
        service_needing_renewal = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            habilitation_expiry=today + timedelta(days=60)
        )
        
        valid_data = {
            'service_id': str(service_needing_renewal.id),
            'notes': 'Service renewal required due to upcoming expiry'
        }
        
        serializer = ServiceRenewalSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
    
    def test_service_renewal_serializer_validation(self):
        """Test ServiceRenewalSerializer validation for non-renewal services."""
        # Service that doesn't need renewal
        today = date.today()
        service_not_needing_renewal = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            habilitation_expiry=today + timedelta(days=200)  # More than 180 days
        )
        
        invalid_data = {
            'service_id': str(service_not_needing_renewal.id)
        }
        
        serializer = ServiceRenewalSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('service_id', serializer.errors)


class ServiceHabilitationProcessSerializerTestCase(TestCase):
    """Test cases for ServiceHabilitationProcess serializers."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory.create()
        self.headquarters = HeadquarterLocationFactory.create()
        self.process = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            created_by=self.user
        )
        self.factory = APIRequestFactory()
    
    def test_process_list_serializer(self):
        """Test ServiceHabilitationProcessListSerializer."""
        serializer = ServiceHabilitationProcessListSerializer(instance=self.process)
        data = serializer.data
        
        # Verify required fields
        self.assertIn('id', data)
        self.assertIn('service_code', data)
        self.assertIn('service_name', data)
        self.assertIn('process_type', data)
        self.assertIn('headquarters_name', data)
        self.assertIn('current_status', data)
        self.assertIn('current_phase', data)
        self.assertIn('is_completed', data)
        self.assertIn('is_approved', data)
        self.assertIn('documentation_progress', data)
        
        # Verify computed fields
        self.assertIsInstance(data['is_completed'], bool)
        self.assertIsInstance(data['is_approved'], bool)
        self.assertIsInstance(data['documentation_progress'], (int, float, str))
    
    def test_process_detail_serializer(self):
        """Test ServiceHabilitationProcessSerializer with all fields."""
        serializer = ServiceHabilitationProcessSerializer(instance=self.process)
        data = serializer.data
        
        # Verify all fields
        self.assertIn('id', data)
        self.assertIn('required_documents', data)
        self.assertIn('submitted_documents', data)
        self.assertIn('self_evaluation_result', data)
        self.assertIn('improvement_plan', data)
        self.assertIn('verification_findings', data)
        
        # Verify read-only fields
        self.assertIn('is_completed', data)
        self.assertIn('days_since_submission', data)
        self.assertIn('documentation_progress', data)
    
    def test_process_create_serializer_valid_data(self):
        """Test ServiceHabilitationProcessCreateSerializer with valid data."""
        request = self.factory.post('/')
        request.user = self.user
        
        valid_data = {
            'headquarters': str(self.headquarters.id),
            'service_code': '202',
            'service_name': 'Laboratorio Clínico',
            'process_type': 'nueva',
            'current_status': 'iniciado',
            'current_phase': 'preparacion'
        }
        
        serializer = ServiceHabilitationProcessCreateSerializer(
            data=valid_data,
            context={'request': request}
        )
        
        self.assertTrue(serializer.is_valid())
        
        process = serializer.save()
        
        self.assertEqual(process.service_code, '202')
        self.assertEqual(process.created_by, self.user)
        self.assertIn('formulario_inscripcion', process.required_documents)
    
    def test_process_create_serializer_required_documents_setup(self):
        """Test that create serializer sets up required documents by process type."""
        request = self.factory.post('/')
        request.user = self.user
        
        # Test new process
        new_process_data = {
            'headquarters': str(self.headquarters.id),
            'service_code': '203',
            'service_name': 'Test Service',
            'process_type': 'nueva'
        }
        
        serializer = ServiceHabilitationProcessCreateSerializer(
            data=new_process_data,
            context={'request': request}
        )
        
        self.assertTrue(serializer.is_valid())
        process = serializer.save()
        
        # Should have basic required documents
        required_docs = process.required_documents
        self.assertIn('formulario_inscripcion', required_docs)
        self.assertIn('autoevaluacion', required_docs)
        
        # Test renewal process
        renewal_process_data = {
            'headquarters': str(self.headquarters.id),
            'service_code': '204',
            'service_name': 'Renewal Service',
            'process_type': 'renovacion'
        }
        
        serializer = ServiceHabilitationProcessCreateSerializer(
            data=renewal_process_data,
            context={'request': request}
        )
        
        self.assertTrue(serializer.is_valid())
        renewal_process = serializer.save()
        
        # Should have additional renewal documents
        renewal_docs = renewal_process.required_documents
        self.assertIn('informe_indicadores', renewal_docs)
        self.assertIn('plan_mejoramiento', renewal_docs)
    
    def test_process_serializer_date_validation(self):
        """Test process date validation in serializer."""
        request = self.factory.post('/')
        request.user = self.user
        
        # Invalid: resolution date before submission date
        invalid_data = {
            'headquarters': str(self.headquarters.id),
            'service_code': '205',
            'service_name': 'Test Service',
            'process_type': 'nueva',
            'submission_date': '2024-06-01',
            'resolution_date': '2024-05-01'  # Before submission
        }
        
        serializer = ServiceHabilitationProcessCreateSerializer(
            data=invalid_data,
            context={'request': request}
        )
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('resolution_date', serializer.errors)
    
    def test_process_document_upload_serializer(self):
        """Test ProcessDocumentUploadSerializer."""
        # Create mock PDF file
        pdf_content = b'%PDF-1.4 mock pdf content'
        pdf_file = SimpleUploadedFile(
            "document.pdf",
            pdf_content,
            content_type="application/pdf"
        )
        
        valid_data = {
            'process_id': str(self.process.id),
            'document_type': 'autoevaluacion',
            'document_file': pdf_file,
            'description': 'Self-evaluation document'
        }
        
        serializer = ProcessDocumentUploadSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
    
    def test_process_document_upload_invalid_file(self):
        """Test ProcessDocumentUploadSerializer with invalid file type."""
        # Create invalid file type
        invalid_file = SimpleUploadedFile(
            "document.exe",
            b'invalid content',
            content_type="application/exe"
        )
        
        invalid_data = {
            'process_id': str(self.process.id),
            'document_type': 'autoevaluacion',
            'document_file': invalid_file
        }
        
        serializer = ProcessDocumentUploadSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('document_file', serializer.errors)
    
    def test_process_phase_advance_serializer(self):
        """Test ProcessPhaseAdvanceSerializer."""
        valid_data = {
            'process_id': str(self.process.id),
            'notes': 'Advancing to next phase'
        }
        
        serializer = ProcessPhaseAdvanceSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
    
    def test_process_phase_advance_completed_process(self):
        """Test ProcessPhaseAdvanceSerializer with completed process."""
        completed_process = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            current_status='aprobado'
        )
        
        invalid_data = {
            'process_id': str(completed_process.id)
        }
        
        serializer = ProcessPhaseAdvanceSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('process_id', serializer.errors)


class SOGCSUtilitySerializerTestCase(TestCase):
    """Test cases for utility serializers."""
    
    def test_habilitation_alert_serializer(self):
        """Test HabilitationAlertSerializer."""
        alert_data = {
            'alert_type': 'renewal_required',
            'severity': 'high',
            'entity_type': 'service',
            'entity_id': str(uuid.uuid4()),
            'entity_name': 'Medicina General',
            'message': 'Service renewal required within 30 days',
            'days_remaining': 30,
            'action_required': 'Submit renewal documentation',
            'created_at': '2024-01-01T10:00:00Z'
        }
        
        serializer = HabilitationAlertSerializer(data=alert_data)
        self.assertTrue(serializer.is_valid())
        
        validated_data = serializer.validated_data
        self.assertEqual(validated_data['alert_type'], 'renewal_required')
        self.assertEqual(validated_data['severity'], 'high')
    
    def test_reps_validation_result_serializer(self):
        """Test REPSValidationResultSerializer."""
        validation_data = {
            'is_valid': True,
            'headquarters_count': 5,
            'services_count': 25,
            'errors': [],
            'warnings': ['Some services expire within 90 days'],
            'preview_data': {
                'sample_headquarters': 'Hospital Test',
                'sample_services': ['Medicina General', 'Laboratorio']
            }
        }
        
        serializer = REPSValidationResultSerializer(data=validation_data)
        self.assertTrue(serializer.is_valid())
        
        validated_data = serializer.validated_data
        self.assertTrue(validated_data['is_valid'])
        self.assertEqual(validated_data['headquarters_count'], 5)
    
    def test_bulk_headquarters_import_serializer(self):
        """Test BulkHeadquartersImportSerializer."""
        health_org = HealthOrganizationProfileFactory.create()
        
        bulk_data = {
            'headquarters_data': [
                {
                    'reps_code': '11001234',
                    'name': 'Sede 1',
                    'department_code': '11',
                    'municipality_code': '11001'
                },
                {
                    'reps_code': '11005678',
                    'name': 'Sede 2',
                    'department_code': '11',
                    'municipality_code': '11001'
                }
            ],
            'organization_id': str(health_org.organization.id),
            'skip_validation': False
        }
        
        serializer = BulkHeadquartersImportSerializer(data=bulk_data)
        self.assertTrue(serializer.is_valid())
    
    def test_bulk_headquarters_import_invalid_organization(self):
        """Test BulkHeadquartersImportSerializer with invalid organization."""
        bulk_data = {
            'headquarters_data': [{'reps_code': '11001234'}],
            'organization_id': '00000000-0000-0000-0000-000000000000'  # Non-existent
        }
        
        serializer = BulkHeadquartersImportSerializer(data=bulk_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('organization_id', serializer.errors)
    
    def test_bulk_services_update_serializer(self):
        """Test BulkServicesUpdateSerializer."""
        service1 = EnabledHealthServiceFactory.create()
        service2 = EnabledHealthServiceFactory.create()
        
        bulk_data = {
            'service_updates': [
                {
                    'service_id': str(service1.id),
                    'infrastructure_compliance': 95.0
                },
                {
                    'service_id': str(service2.id),
                    'equipment_compliance': 90.0
                }
            ],
            'update_type': 'compliance'
        }
        
        serializer = BulkServicesUpdateSerializer(data=bulk_data)
        self.assertTrue(serializer.is_valid())
        
        validated_data = serializer.validated_data
        self.assertEqual(validated_data['update_type'], 'compliance')
        self.assertEqual(len(validated_data['service_updates']), 2)


class SerializerFieldTransformationTestCase(TestCase):
    """Test cases for serializer field transformations and computed fields."""
    
    def setUp(self):
        """Set up test data."""
        self.headquarters = HeadquarterLocationFactory.create()
        self.service = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters
        )
        self.process = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters
        )
    
    def test_headquarters_computed_fields(self):
        """Test headquarters computed fields in serializers."""
        serializer = HeadquarterLocationListSerializer(instance=self.headquarters)
        data = serializer.data
        
        # Test computed fields
        self.assertIn('is_operational', data)
        self.assertIn('services_count', data)
        self.assertIn('days_until_renewal', data)
        
        # Verify types
        self.assertIsInstance(data['is_operational'], bool)
        self.assertIsInstance(data['services_count'], int)
    
    def test_service_computed_fields(self):
        """Test service computed fields in serializers."""
        serializer = EnabledHealthServiceListSerializer(instance=self.service)
        data = serializer.data
        
        # Test computed fields
        self.assertIn('is_valid', data)
        self.assertIn('days_until_expiry', data)
        self.assertIn('overall_compliance', data)
        
        # Verify types
        self.assertIsInstance(data['is_valid'], bool)
        if data['days_until_expiry'] is not None:
            self.assertIsInstance(data['days_until_expiry'], int)
        self.assertIsInstance(data['overall_compliance'], (int, float, str))
    
    def test_process_computed_fields(self):
        """Test process computed fields in serializers."""
        serializer = ServiceHabilitationProcessListSerializer(instance=self.process)
        data = serializer.data
        
        # Test computed fields
        self.assertIn('is_completed', data)
        self.assertIn('is_approved', data)
        self.assertIn('documentation_progress', data)
        
        # Verify types
        self.assertIsInstance(data['is_completed'], bool)
        self.assertIsInstance(data['is_approved'], bool)
        self.assertIsInstance(data['documentation_progress'], (int, float, str))
    
    def test_nested_serialization_relationships(self):
        """Test nested serialization of relationships."""
        # Service with dependencies
        dependency = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters
        )
        self.service.interdependencies.add(dependency)
        
        serializer = EnabledHealthServiceSerializer(instance=self.service)
        data = serializer.data
        
        # Test nested dependency serialization
        self.assertIn('missing_dependencies', data)
        self.assertIsInstance(data['missing_dependencies'], list)
        
        # Each dependency should have required fields
        for dep in data['missing_dependencies']:
            self.assertIn('id', dep)
            self.assertIn('service_code', dep)
            self.assertIn('service_name', dep)
            self.assertIn('status', dep)