"""
Integration tests for Organizational Chart API endpoints.

This module tests all API endpoints related to organizational charts,
including authentication, authorization, validation, and business logic.
"""

import json
from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.authorization.models import Role, Permission, UserRole, RolePermission
from ..models import Organization
from ..models.organizational_chart import (
    Sector, SectorNormativa, PlantillaOrganigrama, OrganizationalChart
)
from ..models.organizational_structure import (
    Area, Cargo, Responsabilidad, Autoridad
)

User = get_user_model()


class BaseOrganizationalChartTestCase(APITestCase):
    """Base test case for organizational chart tests."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test users
        self.super_admin_user = User.objects.create_user(
            email='superadmin@test.com',
            password='testpass123',
            first_name='Super',
            last_name='Admin'
        )
        
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            first_name='Admin',
            last_name='User'
        )
        
        self.manager_user = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            first_name='Manager',
            last_name='User'
        )
        
        self.viewer_user = User.objects.create_user(
            email='viewer@test.com',
            password='testpass123',
            first_name='Viewer',
            last_name='User'
        )
        
        # Create test roles
        self.super_admin_role = Role.objects.create(
            code='super_admin',
            name='Super Administrador',
            description='Acceso completo al sistema'
        )
        
        self.admin_role = Role.objects.create(
            code='admin',
            name='Administrador',
            description='Administrador del sistema'
        )
        
        self.manager_role = Role.objects.create(
            code='manager',
            name='Gerente',
            description='Gerente de organización'
        )
        
        self.viewer_role = Role.objects.create(
            code='viewer',
            name='Consultor',
            description='Solo lectura'
        )
        
        # Create test permissions
        self.permissions = self._create_test_permissions()
        self._assign_permissions_to_roles()
        
        # Assign roles to users
        UserRole.objects.create(user=self.super_admin_user, role=self.super_admin_role)
        UserRole.objects.create(user=self.admin_user, role=self.admin_role)
        UserRole.objects.create(user=self.manager_user, role=self.manager_role)
        UserRole.objects.create(user=self.viewer_user, role=self.viewer_role)
        
        # Create test organization
        self.organization = Organization.objects.create(
            razon_social='Test Organization S.A.S.',
            nombre_comercial='TestOrg',
            nit='900123456-1',
            email_contacto='contact@testorg.com',
            telefono_principal='1234567890',
            sector='HEALTH',
            created_by=self.super_admin_user,
            updated_by=self.super_admin_user
        )
        
        # Create test sector
        self.health_sector = Sector.objects.create(
            code='HEALTH',
            name='Sector Salud',
            description='Sector de salud y servicios médicos',
            default_config={
                'hierarchy_levels_default': 5,
                'requires_mandatory_committees': True,
                'mandatory_positions': ['DIRECTOR_MEDICO', 'COORDINADOR_CALIDAD'],
                'mandatory_committees': ['COMITE_CALIDAD', 'COMITE_ETICA']
            },
            created_by=self.super_admin_user,
            updated_by=self.super_admin_user
        )
        
        # Create test template
        self.health_template = PlantillaOrganigrama.objects.create(
            sector=self.health_sector,
            organization_type='IPS',
            name='IPS Básica',
            description='Plantilla para IPS de baja complejidad',
            complexity='BASIC',
            structure={
                'areas': [
                    {
                        'code': 'DIR-GEN',
                        'name': 'Dirección General',
                        'type': 'DIRECTION',
                        'level': 1
                    },
                    {
                        'code': 'DIR-MED',
                        'name': 'Dirección Médica',
                        'type': 'DIRECTION',
                        'level': 2,
                        'parent_code': 'DIR-GEN'
                    }
                ],
                'positions': [
                    {
                        'code': 'DIR-001',
                        'name': 'Director General',
                        'area_code': 'DIR-GEN',
                        'level': 'EXECUTIVE',
                        'is_critical': True
                    },
                    {
                        'code': 'DIRMED-001',
                        'name': 'Director Médico',
                        'area_code': 'DIR-MED',
                        'level': 'EXECUTIVE',
                        'is_critical': True,
                        'reports_to_code': 'DIR-001'
                    }
                ],
                'committees': [],
                'hierarchy_levels': 5
            },
            created_by=self.super_admin_user,
            updated_by=self.super_admin_user
        )
        
    def _create_test_permissions(self):
        """Create test permissions."""
        permissions_data = [
            'organization.read_orgchart',
            'organization.create_orgchart',
            'organization.update_orgchart',
            'organization.delete_orgchart',
            'organization.approve_orgchart',
            'organization.validate_orgchart',
            'organization.manage_templates',
            'organization.apply_templates',
            'organization.manage_sectors'
        ]
        
        permissions = {}
        for perm_code in permissions_data:
            perm = Permission.objects.create(
                code=perm_code,
                name=perm_code.replace('_', ' ').replace('.', ' - ').title(),
                description=f'Permission for {perm_code}',
                module='organization'
            )
            permissions[perm_code] = perm
        
        return permissions
    
    def _assign_permissions_to_roles(self):
        """Assign permissions to roles."""
        # Super admin gets all permissions
        for permission in self.permissions.values():
            RolePermission.objects.create(
                role=self.super_admin_role,
                permission=permission
            )
        
        # Admin gets most permissions
        admin_permissions = [
            'organization.read_orgchart',
            'organization.create_orgchart',
            'organization.update_orgchart',
            'organization.delete_orgchart',
            'organization.validate_orgchart',
            'organization.apply_templates'
        ]
        for perm_code in admin_permissions:
            RolePermission.objects.create(
                role=self.admin_role,
                permission=self.permissions[perm_code]
            )
        
        # Manager gets basic permissions
        manager_permissions = [
            'organization.read_orgchart',
            'organization.create_orgchart',
            'organization.update_orgchart',
            'organization.validate_orgchart'
        ]
        for perm_code in manager_permissions:
            RolePermission.objects.create(
                role=self.manager_role,
                permission=self.permissions[perm_code]
            )
        
        # Viewer gets only read permission
        RolePermission.objects.create(
            role=self.viewer_role,
            permission=self.permissions['organization.read_orgchart']
        )


class SectorAPITestCase(BaseOrganizationalChartTestCase):
    """Test cases for Sector API endpoints."""
    
    def test_list_sectors_authenticated(self):
        """Test listing sectors with authentication."""
        self.client.force_authenticate(user=self.viewer_user)
        
        url = reverse('organization:sector-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['code'], 'HEALTH')
    
    def test_list_sectors_unauthenticated(self):
        """Test listing sectors without authentication."""
        url = reverse('organization:sector-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_sector_super_admin(self):
        """Test creating sector as super admin."""
        self.client.force_authenticate(user=self.super_admin_user)
        
        url = reverse('organization:sector-list')
        data = {
            'code': 'EDUCATION',
            'name': 'Sector Educación',
            'description': 'Sector educativo',
            'default_config': {
                'hierarchy_levels_default': 4,
                'requires_mandatory_committees': False
            }
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'EDUCATION')
        self.assertTrue(Sector.objects.filter(code='EDUCATION').exists())
    
    def test_create_sector_insufficient_permissions(self):
        """Test creating sector with insufficient permissions."""
        self.client.force_authenticate(user=self.viewer_user)
        
        url = reverse('organization:sector-list')
        data = {
            'code': 'EDUCATION',
            'name': 'Sector Educación',
            'description': 'Sector educativo'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_sector_normativas(self):
        """Test getting sector normatives."""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create test normative
        normativa = SectorNormativa.objects.create(
            sector=self.health_sector,
            code='RES-2003-2014',
            name='Resolución 2003 de 2014',
            description='Requisitos para habilitación de servicios de salud',
            normative_type='RESOLUTION',
            is_mandatory=True,
            created_by=self.super_admin_user,
            updated_by=self.super_admin_user
        )
        
        url = reverse('organization:sector-normativas', kwargs={'pk': self.health_sector.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['normativas']), 1)
        self.assertEqual(response.data['normativas'][0]['code'], 'RES-2003-2014')


class OrganizationalChartAPITestCase(BaseOrganizationalChartTestCase):
    """Test cases for Organizational Chart API endpoints."""
    
    def setUp(self):
        super().setUp()
        
        # Create test organizational chart
        self.org_chart = OrganizationalChart.objects.create(
            organization=self.organization,
            sector=self.health_sector,
            organization_type='IPS',
            version='1.0',
            effective_date=date.today(),
            hierarchy_levels=5,
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
    
    def test_list_organizational_charts(self):
        """Test listing organizational charts."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('organization:organizational-chart-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['version'], '1.0')
    
    def test_create_organizational_chart(self):
        """Test creating organizational chart."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('organization:organizational-chart-list')
        data = {
            'organization': self.organization.id,
            'sector': self.health_sector.id,
            'organization_type': 'HOSPITAL',
            'version': '2.0',
            'effective_date': date.today(),
            'hierarchy_levels': 6
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['version'], '2.0')
        self.assertTrue(
            OrganizationalChart.objects.filter(
                organization=self.organization,
                version='2.0'
            ).exists()
        )
    
    def test_validate_organizational_chart(self):
        """Test organizational chart validation."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse(
            'organization:organizational-chart-validate',
            kwargs={'chart_id': self.org_chart.id}
        )
        
        response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('validation_results', response.data)
    
    def test_approve_organizational_chart(self):
        """Test organizational chart approval."""
        self.client.force_authenticate(user=self.super_admin_user)
        
        url = reverse(
            'organization:organizational-chart-approve',
            kwargs={'chart_id': self.org_chart.id}
        )
        
        data = {
            'reason': 'Chart approved for implementation'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify chart was approved
        self.org_chart.refresh_from_db()
        self.assertIsNotNone(self.org_chart.approved_by)
        self.assertTrue(self.org_chart.is_current)
    
    def test_create_new_version(self):
        """Test creating new version of organizational chart."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse(
            'organization:organizational-chart-create-version',
            kwargs={'chart_id': self.org_chart.id}
        )
        
        data = {
            'hierarchy_levels': 6,
            'copy_structure': True
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['chart']['version'], '1.1')


class TemplateAPITestCase(BaseOrganizationalChartTestCase):
    """Test cases for Template API endpoints."""
    
    def test_list_templates(self):
        """Test listing templates."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('organization:orgchart-template-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'IPS Básica')
    
    def test_apply_template(self):
        """Test applying template to create organizational chart."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse(
            'organization:orgchart-template-apply',
            kwargs={'template_id': self.health_template.id}
        )
        
        data = {
            'organization_id': self.organization.id,
            'version': '1.0',
            'effective_date': date.today(),
            'customizations': {
                'additional_areas': ['ENFERMERIA']
            }
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('chart', response.data)
        
        # Verify chart was created with template structure
        chart = OrganizationalChart.objects.get(id=response.data['chart']['id'])
        self.assertEqual(chart.base_template, self.health_template)
        self.assertTrue(chart.areas.filter(code='DIR-GEN').exists())
        self.assertTrue(chart.areas.filter(code='DIR-MED').exists())
    
    def test_clone_template(self):
        """Test cloning existing template."""
        self.client.force_authenticate(user=self.super_admin_user)
        
        url = reverse(
            'organization:orgchart-template-clone',
            kwargs={'template_id': self.health_template.id}
        )
        
        data = {
            'name': 'IPS Básica - Copia',
            'complexity': 'MEDIUM',
            'organization_type': 'CLINICA'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['template']['name'], 'IPS Básica - Copia')
        
        # Verify new template has same structure
        new_template = PlantillaOrganigrama.objects.get(
            id=response.data['template']['id']
        )
        self.assertEqual(new_template.structure, self.health_template.structure)


class AreaAPITestCase(BaseOrganizationalChartTestCase):
    """Test cases for Area API endpoints."""
    
    def setUp(self):
        super().setUp()
        
        # Create test organizational chart
        self.org_chart = OrganizationalChart.objects.create(
            organization=self.organization,
            sector=self.health_sector,
            organization_type='IPS',
            version='1.0',
            effective_date=date.today(),
            hierarchy_levels=5,
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
        
        # Create test area
        self.test_area = Area.objects.create(
            organizational_chart=self.org_chart,
            code='DIR-GEN',
            name='Dirección General',
            area_type='DIRECTION',
            hierarchy_level=1,
            description='Dirección general de la organización',
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
    
    def test_create_area(self):
        """Test creating organizational area."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('organization:area-list')
        data = {
            'organizational_chart': self.org_chart.id,
            'code': 'ADM-FIN',
            'name': 'Administración y Finanzas',
            'area_type': 'DEPARTMENT',
            'parent_area': self.test_area.id,
            'hierarchy_level': 2,
            'description': 'Departamento de administración y finanzas'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'ADM-FIN')
        self.assertTrue(
            Area.objects.filter(
                organizational_chart=self.org_chart,
                code='ADM-FIN'
            ).exists()
        )
    
    def test_bulk_create_areas(self):
        """Test bulk creation of areas."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('organization:areas-bulk-create')
        data = {
            'areas': [
                {
                    'organizational_chart': self.org_chart.id,
                    'code': 'MED-INT',
                    'name': 'Medicina Interna',
                    'area_type': 'SERVICE',
                    'parent_area': self.test_area.id,
                    'hierarchy_level': 2
                },
                {
                    'organizational_chart': self.org_chart.id,
                    'code': 'ENFERM',
                    'name': 'Enfermería',
                    'area_type': 'SERVICE',
                    'parent_area': self.test_area.id,
                    'hierarchy_level': 2
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['count'], 2)
        
        # Verify areas were created
        self.assertTrue(Area.objects.filter(code='MED-INT').exists())
        self.assertTrue(Area.objects.filter(code='ENFERM').exists())


class ValidationAPITestCase(BaseOrganizationalChartTestCase):
    """Test cases for real-time validation API endpoints."""
    
    def setUp(self):
        super().setUp()
        
        self.org_chart = OrganizationalChart.objects.create(
            organization=self.organization,
            sector=self.health_sector,
            organization_type='IPS',
            version='1.0',
            effective_date=date.today(),
            hierarchy_levels=5,
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
        
        self.test_area = Area.objects.create(
            organizational_chart=self.org_chart,
            code='DIR-GEN',
            name='Dirección General',
            area_type='DIRECTION',
            hierarchy_level=1,
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
    
    def test_validate_area_code(self):
        """Test area code validation."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('organization:realtime-validation-validate-area-code')
        
        # Test valid code
        data = {
            'chart_id': self.org_chart.id,
            'code': 'NEW-AREA'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        
        # Test duplicate code
        data = {
            'chart_id': self.org_chart.id,
            'code': 'DIR-GEN'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['valid'])
    
    def test_validate_hierarchy_level(self):
        """Test hierarchy level validation."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('organization:realtime-validation-validate-hierarchy-level')
        
        # Test valid level
        data = {
            'parent_area_id': self.test_area.id,
            'hierarchy_level': 2,
            'chart_id': self.org_chart.id
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
        
        # Test invalid level (same as parent)
        data = {
            'parent_area_id': self.test_area.id,
            'hierarchy_level': 1,
            'chart_id': self.org_chart.id
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['valid'])
    
    def test_instant_compliance_check(self):
        """Test instant compliance checking."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('organization:instant-compliance-check')
        data = {
            'chart_id': self.org_chart.id,
            'check_types': ['mandatory_positions', 'hierarchy_levels']
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('results', response.data)
        self.assertIn('checks', response.data['results'])
    
    def test_live_feedback(self):
        """Test live feedback endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        
        url = reverse('organization:live-feedback')
        data = {
            'chart_id': self.org_chart.id,
            'context': 'chart_overview'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('feedback', response.data)
        self.assertIn('progress', response.data['feedback'])
        self.assertIn('suggestions', response.data['feedback'])


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class PerformanceTestCase(BaseOrganizationalChartTestCase):
    """Test cases for performance optimization in large organizational structures."""
    
    def test_large_structure_queries(self):
        """Test query performance with large organizational structures."""
        self.client.force_authenticate(user=self.admin_user)
        
        # Create large organizational chart
        org_chart = OrganizationalChart.objects.create(
            organization=self.organization,
            sector=self.health_sector,
            organization_type='HOSPITAL',
            version='1.0',
            effective_date=date.today(),
            hierarchy_levels=5,
            created_by=self.admin_user,
            updated_by=self.admin_user
        )
        
        # Create multiple areas and positions
        areas = []
        for i in range(50):  # Create 50 areas
            area = Area.objects.create(
                organizational_chart=org_chart,
                code=f'AREA-{i:03d}',
                name=f'Area {i}',
                area_type='DEPARTMENT',
                hierarchy_level=2,
                created_by=self.admin_user,
                updated_by=self.admin_user
            )
            areas.append(area)
        
        # Create positions for each area
        for area in areas:
            for j in range(5):  # 5 positions per area = 250 total
                Cargo.objects.create(
                    area=area,
                    code=f'{area.code}-POS-{j:02d}',
                    name=f'Cargo {j} - {area.name}',
                    hierarchy_level='PROFESSIONAL',
                    main_purpose=f'Propósito del cargo {j}',
                    authorized_positions=1,
                    created_by=self.admin_user,
                    updated_by=self.admin_user
                )
        
        # Test list performance
        import time
        start_time = time.time()
        
        url = reverse('organization:organizational-chart-list')
        response = self.client.get(url)
        
        end_time = time.time()
        query_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(query_time, 2.0)  # Should complete in less than 2 seconds
        
        # Test detailed view performance
        start_time = time.time()
        
        url = reverse('organization:organizational-chart-detail', kwargs={'pk': org_chart.id})
        response = self.client.get(url)
        
        end_time = time.time()
        query_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLess(query_time, 1.5)  # Should complete in less than 1.5 seconds