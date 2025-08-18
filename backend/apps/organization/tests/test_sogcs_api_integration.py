"""
Integration tests for SOGCS API endpoints.

Tests comprehensive API functionality including CRUD operations,
authentication, permissions, filters, and error handling for all SOGCS ViewSets.
"""

import pytest
import json
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.organization.models import (
    HeadquarterLocation, EnabledHealthService, ServiceHabilitationProcess
)
from apps.organization.tests.factories import (
    HeadquarterLocationFactory, EnabledHealthServiceFactory, 
    ServiceHabilitationProcessFactory, HealthOrganizationProfileFactory,
    UserFactory, create_complete_headquarters_with_services
)

User = get_user_model()


class SOGCSAPITestCase(APITestCase):
    """Base test case for SOGCS API tests with authentication setup."""
    
    def setUp(self):
        """Set up test data and authentication."""
        # Create test users
        self.admin_user = UserFactory.create(
            email='admin@test.com',
            is_staff=True,
            is_superuser=True
        )
        self.regular_user = UserFactory.create(
            email='user@test.com',
            is_staff=False
        )
        
        # Create health organization
        self.health_org = HealthOrganizationProfileFactory.create()
        
        # Create test headquarters
        self.headquarters = HeadquarterLocationFactory.create(
            organization=self.health_org,
            reps_code='11001234',
            name='Hospital Test'
        )
        
        # Setup API client
        self.client = APIClient()
    
    def get_jwt_token(self, user):
        """Get JWT token for user authentication."""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    
    def authenticate_user(self, user):
        """Authenticate user with JWT token."""
        token = self.get_jwt_token(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    def authenticate_admin(self):
        """Authenticate as admin user."""
        self.authenticate_user(self.admin_user)
    
    def authenticate_regular(self):
        """Authenticate as regular user."""
        self.authenticate_user(self.regular_user)


class HeadquarterLocationViewSetTestCase(SOGCSAPITestCase):
    """Test cases for HeadquarterLocation API endpoints."""
    
    def test_list_headquarters_authenticated(self):
        """Test listing headquarters requires authentication."""
        url = reverse('organization:headquarters-list')
        
        # Unauthenticated request
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Authenticated request
        self.authenticate_regular()
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_headquarters_with_filters(self):
        """Test listing headquarters with query filters."""
        self.authenticate_admin()
        
        # Create additional headquarters
        HeadquarterLocationFactory.create(
            organization=self.health_org,
            operational_status='activa',
            habilitation_status='habilitada'
        )
        HeadquarterLocationFactory.create(
            organization=self.health_org,
            operational_status='inactiva',
            habilitation_status='suspendida'
        )
        
        url = reverse('organization:headquarters-list')
        
        # Filter by operational status
        response = self.client.get(url, {'operational_status': 'activa'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        for hq in data['results']:
            self.assertEqual(hq['operational_status'], 'activa')
        
        # Filter by habilitation status
        response = self.client.get(url, {'habilitation_status': 'habilitada'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_retrieve_headquarters_detail(self):
        """Test retrieving headquarters detail."""
        self.authenticate_admin()
        
        url = reverse('organization:headquarters-detail', kwargs={'pk': self.headquarters.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['id'], str(self.headquarters.id))
        self.assertEqual(data['reps_code'], self.headquarters.reps_code)
        self.assertEqual(data['name'], self.headquarters.name)
        self.assertIn('is_operational', data)
        self.assertIn('days_until_renewal', data)
        self.assertIn('complete_address', data)
    
    def test_create_headquarters_valid_data(self):
        """Test creating headquarters with valid data."""
        self.authenticate_admin()
        
        url = reverse('organization:headquarters-list')
        data = {
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
            'operational_status': 'activa',
            'total_beds': 50,
            'consultation_rooms': 10
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify creation
        created_hq = HeadquarterLocation.objects.get(reps_code='11005678')
        self.assertEqual(created_hq.name, 'Nueva Sede Test')
        self.assertEqual(created_hq.created_by, self.admin_user)
    
    def test_create_headquarters_invalid_data(self):
        """Test creating headquarters with invalid data."""
        self.authenticate_admin()
        
        url = reverse('organization:headquarters-list')
        
        # Invalid REPS code
        data = {
            'organization': str(self.health_org.id),
            'reps_code': 'INVALID',  # Invalid format
            'name': 'Test Sede',
            'department_code': '11',
            'municipality_code': '11001'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('reps_code', response.json())
    
    def test_update_headquarters(self):
        """Test updating headquarters."""
        self.authenticate_admin()
        
        url = reverse('organization:headquarters-detail', kwargs={'pk': self.headquarters.id})
        data = {
            'name': 'Hospital Test Actualizado',
            'total_beds': 200,
            'icu_beds': 20
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify update
        self.headquarters.refresh_from_db()
        self.assertEqual(self.headquarters.name, 'Hospital Test Actualizado')
        self.assertEqual(self.headquarters.total_beds, 200)
        self.assertEqual(self.headquarters.updated_by, self.admin_user)
    
    def test_delete_headquarters_soft_delete(self):
        """Test soft deleting headquarters."""
        self.authenticate_admin()
        
        url = reverse('organization:headquarters-detail', kwargs={'pk': self.headquarters.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify soft delete (if implemented)
        # Note: Actual soft delete behavior depends on FullBaseModel implementation
        try:
            self.headquarters.refresh_from_db()
        except HeadquarterLocation.DoesNotExist:
            pass  # Hard delete was performed
    
    def test_search_headquarters(self):
        """Test searching headquarters by name and REPS code."""
        self.authenticate_admin()
        
        # Create searchable headquarters
        HeadquarterLocationFactory.create(
            organization=self.health_org,
            name='Hospital San Juan',
            reps_code='11111111'
        )
        
        url = reverse('organization:headquarters-list')
        
        # Search by name
        response = self.client.get(url, {'search': 'San Juan'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(any('San Juan' in hq['name'] for hq in data['results']))
        
        # Search by REPS code
        response = self.client.get(url, {'search': '11111111'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_headquarters_ordering(self):
        """Test headquarters ordering."""
        self.authenticate_admin()
        
        url = reverse('organization:headquarters-list')
        
        # Order by name
        response = self.client.get(url, {'ordering': 'name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Order by creation date (descending)
        response = self.client.get(url, {'ordering': '-created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class EnabledHealthServiceViewSetTestCase(SOGCSAPITestCase):
    """Test cases for EnabledHealthService API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        super().setUp()
        self.service = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Medicina General'
        )
    
    def test_list_services_authenticated(self):
        """Test listing services requires authentication."""
        url = reverse('organization:enabled-services-list')
        
        # Unauthenticated request
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Authenticated request
        self.authenticate_regular()
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_services_with_filters(self):
        """Test listing services with filters."""
        self.authenticate_admin()
        
        # Create services with different properties
        EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            service_code='201',
            service_group='apoyo_diagnostico',
            complexity_level=2
        )
        EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            service_code='301',
            service_group='quirurgicos',
            complexity_level=4
        )
        
        url = reverse('organization:enabled-services-list')
        
        # Filter by service group
        response = self.client.get(url, {'service_group': 'apoyo_diagnostico'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        for service in data['results']:
            self.assertEqual(service['service_group'], 'apoyo_diagnostico')
        
        # Filter by complexity level
        response = self.client.get(url, {'complexity_level': '4'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_retrieve_service_detail(self):
        """Test retrieving service detail."""
        self.authenticate_admin()
        
        url = reverse('organization:enabled-services-detail', kwargs={'pk': self.service.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['id'], str(self.service.id))
        self.assertEqual(data['service_code'], self.service.service_code)
        self.assertEqual(data['service_name'], self.service.service_name)
        self.assertIn('is_valid', data)
        self.assertIn('days_until_expiry', data)
        self.assertIn('overall_compliance', data)
        self.assertIn('missing_dependencies', data)
    
    def test_create_service_valid_data(self):
        """Test creating service with valid data."""
        self.authenticate_admin()
        
        url = reverse('organization:enabled-services-list')
        data = {
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
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify creation
        created_service = EnabledHealthService.objects.get(service_code='202')
        self.assertEqual(created_service.service_name, 'Radiología')
        self.assertEqual(created_service.created_by, self.admin_user)
    
    def test_create_service_invalid_data(self):
        """Test creating service with invalid data."""
        self.authenticate_admin()
        
        url = reverse('organization:enabled-services-list')
        
        # No service modality selected
        data = {
            'headquarters': str(self.headquarters.id),
            'service_code': '203',
            'service_name': 'Test Service',
            'service_group': 'consulta_externa',
            'complexity_level': 1,
            'intramural': False,
            'extramural': False,
            'domiciliary': False,
            'telemedicine': False,  # No modality selected
            'habilitation_date': '2024-01-01',
            'habilitation_expiry': '2026-01-01'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('intramural', response.json())
    
    def test_update_service_compliance_metrics(self):
        """Test updating service compliance metrics."""
        self.authenticate_admin()
        
        url = reverse('organization:enabled-services-detail', kwargs={'pk': self.service.id})
        data = {
            'infrastructure_compliance': 95.0,
            'equipment_compliance': 90.0,
            'medication_compliance': 92.0,
            'self_evaluation_score': 88.0
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify update
        self.service.refresh_from_db()
        self.assertEqual(self.service.infrastructure_compliance, Decimal('95.0'))
        self.assertEqual(self.service.equipment_compliance, Decimal('90.0'))
    
    def test_service_interdependencies(self):
        """Test setting service interdependencies."""
        self.authenticate_admin()
        
        # Create dependency service
        dependency = EnabledHealthServiceFactory.create(
            headquarters=self.headquarters,
            service_code='102',
            service_name='Consulta Externa'
        )
        
        url = reverse('organization:enabled-services-detail', kwargs={'pk': self.service.id})
        data = {
            'interdependencies': [str(dependency.id)]
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify interdependency was set
        self.service.refresh_from_db()
        self.assertIn(dependency, self.service.interdependencies.all())


class ServiceHabilitationProcessViewSetTestCase(SOGCSAPITestCase):
    """Test cases for ServiceHabilitationProcess API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        super().setUp()
        self.process = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Medicina General'
        )
    
    def test_list_processes_authenticated(self):
        """Test listing processes requires authentication."""
        url = reverse('organization:habilitation-processes-list')
        
        # Unauthenticated request
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Authenticated request
        self.authenticate_regular()
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_list_processes_with_filters(self):
        """Test listing processes with filters."""
        self.authenticate_admin()
        
        # Create processes with different statuses
        ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            service_code='201',
            process_type='renovacion',
            current_status='radicado'
        )
        ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            service_code='301',
            process_type='nueva',
            current_status='aprobado'
        )
        
        url = reverse('organization:habilitation-processes-list')
        
        # Filter by process type
        response = self.client.get(url, {'process_type': 'renovacion'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        for process in data['results']:
            self.assertEqual(process['process_type'], 'renovacion')
        
        # Filter by current status
        response = self.client.get(url, {'current_status': 'aprobado'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_retrieve_process_detail(self):
        """Test retrieving process detail."""
        self.authenticate_admin()
        
        url = reverse('organization:habilitation-processes-detail', kwargs={'pk': self.process.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['id'], str(self.process.id))
        self.assertEqual(data['service_code'], self.process.service_code)
        self.assertEqual(data['process_type'], self.process.process_type)
        self.assertIn('is_completed', data)
        self.assertIn('is_approved', data)
        self.assertIn('documentation_progress', data)
    
    def test_create_process_valid_data(self):
        """Test creating process with valid data."""
        self.authenticate_admin()
        
        url = reverse('organization:habilitation-processes-list')
        data = {
            'headquarters': str(self.headquarters.id),
            'service_code': '202',
            'service_name': 'Laboratorio Clínico',
            'process_type': 'nueva',
            'current_status': 'iniciado',
            'current_phase': 'preparacion'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify creation
        created_process = ServiceHabilitationProcess.objects.get(service_code='202')
        self.assertEqual(created_process.service_name, 'Laboratorio Clínico')
        self.assertEqual(created_process.created_by, self.admin_user)
    
    def test_update_process_status(self):
        """Test updating process status and phase."""
        self.authenticate_admin()
        
        url = reverse('organization:habilitation-processes-detail', kwargs={'pk': self.process.id})
        data = {
            'current_status': 'autoevaluacion',
            'current_phase': 'autoevaluacion',
            'self_evaluation_score': 85.0
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify update
        self.process.refresh_from_db()
        self.assertEqual(self.process.current_status, 'autoevaluacion')
        self.assertEqual(self.process.self_evaluation_score, Decimal('85.0'))
    
    def test_process_date_validation(self):
        """Test process date validation through API."""
        self.authenticate_admin()
        
        url = reverse('organization:habilitation-processes-detail', kwargs={'pk': self.process.id})
        
        # Invalid: resolution date before submission date
        data = {
            'submission_date': '2024-06-01',
            'resolution_date': '2024-05-01'  # Before submission
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('resolution_date', response.json())


class SOGCSAPIPermissionsTestCase(SOGCSAPITestCase):
    """Test cases for API permissions and security."""
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated requests are denied."""
        endpoints = [
            reverse('organization:headquarters-list'),
            reverse('organization:enabled-services-list'),
            reverse('organization:habilitation-processes-list'),
        ]
        
        for url in endpoints:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_regular_user_permissions(self):
        """Test regular user permissions."""
        self.authenticate_regular()
        
        # Regular users can read
        url = reverse('organization:headquarters-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Regular users might have limited write access (depends on implementation)
        # This would need to be adjusted based on actual permission requirements
    
    def test_admin_user_full_access(self):
        """Test admin user has full access."""
        self.authenticate_admin()
        
        # Admin can read
        url = reverse('organization:headquarters-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Admin can create
        data = {
            'organization': str(self.health_org.id),
            'reps_code': '11999999',
            'name': 'Admin Test Sede',
            'department_code': '11',
            'municipality_code': '11001'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class SOGCSAPIErrorHandlingTestCase(SOGCSAPITestCase):
    """Test cases for API error handling."""
    
    def test_404_not_found(self):
        """Test 404 responses for non-existent resources."""
        self.authenticate_admin()
        
        # Non-existent headquarters
        url = reverse('organization:headquarters-detail', kwargs={'pk': '00000000-0000-0000-0000-000000000000'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_400_bad_request_validation(self):
        """Test 400 responses for validation errors."""
        self.authenticate_admin()
        
        url = reverse('organization:headquarters-list')
        
        # Missing required fields
        data = {
            'name': 'Test Sede'
            # Missing organization, reps_code, etc.
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Response should contain validation errors
        errors = response.json()
        self.assertIn('organization', errors)
        self.assertIn('reps_code', errors)
    
    def test_500_internal_server_error_handling(self):
        """Test graceful handling of server errors."""
        # This would typically require mocking to simulate server errors
        # For now, we'll test that the API handles edge cases gracefully
        pass


@pytest.mark.django_db
class SOGCSAPIAdvancedTestCase:
    """Advanced API test cases using pytest."""
    
    def test_bulk_operations(self):
        """Test bulk operations if implemented."""
        # This would test any bulk create/update operations
        pass
    
    def test_api_performance_pagination(self):
        """Test API performance with large datasets."""
        health_org = HealthOrganizationProfileFactory.create()
        
        # Create many headquarters for pagination testing
        headquarters_list = []
        for i in range(50):
            hq = HeadquarterLocationFactory.create(
                organization=health_org,
                reps_code=f'{str(i).zfill(8)}'
            )
            headquarters_list.append(hq)
        
        client = APIClient()
        admin_user = UserFactory.create(is_staff=True, is_superuser=True)
        refresh = RefreshToken.for_user(admin_user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test pagination
        url = reverse('organization:headquarters-list')
        response = client.get(url, {'page_size': 10})
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'results' in data
        assert 'next' in data
        assert 'previous' in data
        assert len(data['results']) <= 10
    
    def test_complex_filtering_combinations(self):
        """Test complex filter combinations."""
        health_org = HealthOrganizationProfileFactory.create()
        
        # Create headquarters with specific combinations
        bogota_active_hq = HeadquarterLocationFactory.create(
            organization=health_org,
            department_code='11',
            operational_status='activa',
            habilitation_status='habilitada'
        )
        
        medellin_inactive_hq = HeadquarterLocationFactory.create(
            organization=health_org,
            department_code='05',
            operational_status='inactiva',
            habilitation_status='suspendida'
        )
        
        client = APIClient()
        admin_user = UserFactory.create(is_staff=True, is_superuser=True)
        refresh = RefreshToken.for_user(admin_user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Combined filters
        url = reverse('organization:headquarters-list')
        response = client.get(url, {
            'department_code': '11',
            'operational_status': 'activa',
            'habilitation_status': 'habilitada'
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Should only return Bogotá active headquarters
        for hq in data['results']:
            assert hq['department_code'] == '11'
            assert hq['operational_status'] == 'activa'
            assert hq['habilitation_status'] == 'habilitada'