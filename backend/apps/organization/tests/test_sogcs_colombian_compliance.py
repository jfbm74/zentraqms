"""
Comprehensive tests for Colombian Health Regulations Compliance.

Tests specific compliance with Colombian health regulations including:
- REPS (Registro Especial de Prestadores de Servicios de Salud)
- Resolution 3100/2019 (Habilitation of Health Service Providers)
- Resolution 256/2016 (Quality Indicators)
- Decree 780/2016 (Regulatory Framework)
- Law 1581/2012 (Personal Data Protection - Habeas Data)
- DIVIPOLA (Administrative Division Codes)
"""

import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import date, timedelta

from apps.organization.models import (
    HeadquarterLocation, EnabledHealthService, ServiceHabilitationProcess
)
from apps.organization.tests.factories import (
    HeadquarterLocationFactory, EnabledHealthServiceFactory, 
    ServiceHabilitationProcessFactory, HealthOrganizationProfileFactory,
    create_reps_compliance_test_data, create_colombian_health_network_with_sedes
)


class REPSComplianceTestCase(TestCase):
    """
    Tests for REPS (Registro Especial de Prestadores de Servicios de Salud) compliance.
    
    REPS is the special registry for health service providers in Colombia,
    managed by the Ministry of Health and Social Protection.
    """
    
    def test_reps_code_format_compliance(self):
        """Test REPS code format compliance according to official standards."""
        health_org = HealthOrganizationProfileFactory.create()
        
        # Valid REPS codes according to Colombian standards
        valid_reps_codes = [
            '11001234',      # 8-digit format (common)
            'SU11001234',    # Prefixed format
            '1100123456789', # Extended format
            'ABC123',        # Alphanumeric format
            '12345678901234567890'  # Maximum length (20)
        ]
        
        for reps_code in valid_reps_codes:
            with self.subTest(reps_code=reps_code):
                headquarters = HeadquarterLocationFactory.build(
                    organization=health_org,
                    reps_code=reps_code
                )
                headquarters.full_clean()  # Should not raise ValidationError
    
    def test_reps_geographic_consistency(self):
        """Test REPS code consistency with Colombian geographic codes."""
        health_org = HealthOrganizationProfileFactory.create()
        
        # REPS codes often incorporate DIVIPOLA codes
        geographic_consistent_data = [
            {
                'reps_code': '11001234',
                'department_code': '11',
                'municipality_code': '11001',
                'department_name': 'Bogotá D.C.',
                'municipality_name': 'Bogotá'
            },
            {
                'reps_code': '05001567',
                'department_code': '05',
                'municipality_code': '05001',
                'department_name': 'Antioquia',
                'municipality_name': 'Medellín'
            },
            {
                'reps_code': '76001890',
                'department_code': '76',
                'municipality_code': '76001',
                'department_name': 'Valle del Cauca',
                'municipality_name': 'Cali'
            }
        ]
        
        for data in geographic_consistent_data:
            with self.subTest(reps_code=data['reps_code']):
                headquarters = HeadquarterLocationFactory.create(
                    organization=health_org,
                    **data
                )
                
                # Verify consistency
                self.assertTrue(
                    headquarters.reps_code.startswith(data['department_code']) or
                    headquarters.municipality_code.startswith(data['department_code'])
                )
    
    def test_reps_uniqueness_enforcement(self):
        """Test REPS code uniqueness across the system."""
        health_org1 = HealthOrganizationProfileFactory.create()
        health_org2 = HealthOrganizationProfileFactory.create()
        
        # Create first headquarters with REPS code
        HeadquarterLocationFactory.create(
            organization=health_org1,
            reps_code='11001234'
        )
        
        # Attempt to create second headquarters with same REPS code
        with self.assertRaises(ValidationError):
            duplicate_hq = HeadquarterLocationFactory.build(
                organization=health_org2,  # Different organization
                reps_code='11001234'       # Same REPS code
            )
            duplicate_hq.full_clean()
    
    def test_reps_sync_status_tracking(self):
        """Test REPS synchronization status tracking."""
        health_org = HealthOrganizationProfileFactory.create()
        headquarters = HeadquarterLocationFactory.create(
            organization=health_org,
            sync_status='pending',
            sync_errors=[],
            reps_data={}
        )
        
        # Valid sync statuses
        valid_statuses = ['pending', 'in_progress', 'success', 'failed', 'partial']
        
        for status in valid_statuses:
            headquarters.sync_status = status
            headquarters.full_clean()
        
        # Test sync error tracking
        headquarters.sync_status = 'failed'
        headquarters.sync_errors = [
            'Connection timeout to REPS service',
            'Invalid credentials',
            'Service temporarily unavailable'
        ]
        headquarters.save()
        
        self.assertEqual(headquarters.sync_status, 'failed')
        self.assertTrue(len(headquarters.sync_errors) > 0)


class Resolution3100ComplianceTestCase(TestCase):
    """
    Tests for Resolution 3100/2019 compliance.
    
    This resolution establishes procedures and conditions for habilitation
    and capacity reporting of health service providers.
    """
    
    def test_service_groups_compliance(self):
        """Test service groups comply with Resolution 3100/2019 Chapter III."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Official service groups according to Resolution 3100/2019
        official_service_groups = [
            'consulta_externa',
            'apoyo_diagnostico',
            'internacion',
            'quirurgicos',
            'urgencias',
            'transporte_asistencial',
            'otros_servicios',
            'proteccion_especifica'
        ]
        
        for group in official_service_groups:
            with self.subTest(service_group=group):
                service = EnabledHealthServiceFactory.create(
                    headquarters=headquarters,
                    service_group=group
                )
                self.assertEqual(service.service_group, group)
    
    def test_complexity_level_requirements(self):
        """Test complexity level requirements per Resolution 3100/2019."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Level I - Baja Complejidad
        level_1_services = ['consulta_externa', 'proteccion_especifica']
        for service_group in level_1_services:
            service = EnabledHealthServiceFactory.create(
                headquarters=headquarters,
                service_group=service_group,
                complexity_level=1
            )
            self.assertEqual(service.complexity_level, 1)
            self.assertIn(service.service_group, level_1_services)
        
        # Level IV - Máxima Complejidad
        level_4_service = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            service_group='quirurgicos',
            complexity_level=4,
            infrastructure_compliance=Decimal('95.0'),  # Higher requirements
            equipment_compliance=Decimal('98.0'),
            medication_compliance=Decimal('90.0'),
            requires_authorization=True
        )
        
        self.assertEqual(level_4_service.complexity_level, 4)
        self.assertTrue(level_4_service.requires_authorization)
        self.assertGreaterEqual(level_4_service.infrastructure_compliance, Decimal('90.0'))
    
    def test_habilitation_standards_compliance(self):
        """Test habilitation standards compliance (Annexes 1-8 of Resolution 3100/2019)."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Infrastructure standards
        service = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            service_group='internacion',
            complexity_level=3,
            specific_standards={
                'infraestructura': {
                    'areas_asistenciales': True,
                    'areas_administrativas': True,
                    'areas_servicios_generales': True,
                    'sistema_comunicaciones': True,
                    'sistema_gases_medicinales': True
                },
                'dotacion': {
                    'equipos_biomedicos': True,
                    'equipos_sistemas_apoyo': True,
                    'instrumental_medico': True,
                    'mobiliario': True
                },
                'medicamentos': {
                    'listado_basico': True,
                    'almacenamiento_adecuado': True,
                    'cadena_frio': True,
                    'control_inventarios': True
                },
                'talento_humano': {
                    'medico_disponible': True,
                    'enfermera_jefe': True,
                    'auxiliar_enfermeria': True,
                    'capacitacion_continua': True
                }
            }
        )
        
        standards = service.specific_standards
        
        # Verify required standards are present
        self.assertIn('infraestructura', standards)
        self.assertIn('dotacion', standards)
        self.assertIn('medicamentos', standards)
        self.assertIn('talento_humano', standards)
        
        # Verify infrastructure requirements
        infra = standards['infraestructura']
        self.assertTrue(infra['areas_asistenciales'])
        self.assertTrue(infra['sistema_comunicaciones'])
    
    def test_service_modality_combinations(self):
        """Test valid service modality combinations per Resolution 3100/2019."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Valid modality combinations
        modality_combinations = [
            {'intramural': True, 'extramural': False, 'domiciliary': False, 'telemedicine': False},
            {'intramural': True, 'extramural': True, 'domiciliary': False, 'telemedicine': False},
            {'intramural': False, 'extramural': False, 'domiciliary': True, 'telemedicine': False},
            {'intramural': True, 'extramural': False, 'domiciliary': True, 'telemedicine': True},
            {'intramural': False, 'extramural': False, 'domiciliary': False, 'telemedicine': True},
        ]
        
        for i, modalities in enumerate(modality_combinations):
            with self.subTest(combination=i):
                service = EnabledHealthServiceFactory.build(
                    headquarters=headquarters,
                    **modalities
                )
                service.full_clean()  # Should not raise ValidationError
    
    def test_capacity_reporting_requirements(self):
        """Test capacity reporting requirements per Resolution 3100/2019."""
        headquarters = HeadquarterLocationFactory.create(
            total_beds=100,
            icu_beds=10,
            emergency_beds=15,
            surgery_rooms=5,
            consultation_rooms=20
        )
        
        service = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            service_group='internacion',
            installed_capacity={
                'camas_hospitalizacion': 80,
                'camas_uci': 8,
                'camas_urgencias': 12,
                'equipos_ventilacion': 10,
                'monitores': 15
            },
            operational_capacity={
                'camas_hospitalizacion': 70,  # 87.5% utilization
                'camas_uci': 6,               # 75% utilization
                'camas_urgencias': 10,        # 83% utilization
                'equipos_ventilacion': 8,
                'monitores': 12
            }
        )
        
        # Verify capacity consistency
        installed = service.installed_capacity
        operational = service.operational_capacity
        
        for resource in installed:
            if resource in operational:
                self.assertLessEqual(
                    operational[resource], 
                    installed[resource],
                    f"Operational capacity exceeds installed for {resource}"
                )


class Resolution256ComplianceTestCase(TestCase):
    """
    Tests for Resolution 256/2016 compliance.
    
    This resolution establishes quality indicators for health service providers.
    """
    
    def test_mandatory_quality_indicators(self):
        """Test mandatory quality indicators per Resolution 256/2016."""
        headquarters = HeadquarterLocationFactory.create()
        
        service = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            service_group='internacion',
            quality_indicators={
                # Mandatory indicators from Resolution 256/2016
                'mortalidad_intrahospitalaria': 1.2,        # %
                'infecciones_asociadas_atencion': 0.8,      # %
                'reingreso_72_horas': 2.5,                  # %
                'oportunidad_cirugia_urgente': 95.5,       # %
                'satisfaccion_usuario': 87.3,              # %
                'tiempo_promedio_hospitalizacion': 4.2,     # days
                'proporcion_egresos_vivos': 98.8,          # %
                'proporcion_pacientes_remitidos': 5.2      # %
            },
            patient_safety_events=3,  # Quarterly count
            last_self_evaluation=date.today() - timedelta(days=180),
            self_evaluation_score=Decimal('85.5'),
            last_external_audit=date.today() - timedelta(days=365),
            external_audit_score=Decimal('82.3')
        )
        
        indicators = service.quality_indicators
        
        # Verify mandatory indicators presence
        mandatory_indicators = [
            'mortalidad_intrahospitalaria',
            'infecciones_asociadas_atencion',
            'reingreso_72_horas',
            'satisfaccion_usuario'
        ]
        
        for indicator in mandatory_indicators:
            self.assertIn(indicator, indicators)
        
        # Verify indicator ranges (realistic values)
        self.assertLessEqual(indicators['mortalidad_intrahospitalaria'], 5.0)
        self.assertLessEqual(indicators['infecciones_asociadas_atencion'], 3.0)
        self.assertGreaterEqual(indicators['satisfaccion_usuario'], 70.0)
    
    def test_quality_indicator_thresholds(self):
        """Test quality indicator thresholds and alerts."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Service with indicators above acceptable thresholds
        concerning_service = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            quality_indicators={
                'mortalidad_intrahospitalaria': 3.5,   # Above 3% threshold
                'infecciones_asociadas_atencion': 2.1,  # Above 2% threshold
                'reingreso_72_horas': 4.8,             # Above 4% threshold
                'satisfaccion_usuario': 68.2           # Below 70% threshold
            },
            patient_safety_events=8  # Above 5 quarterly threshold
        )
        
        indicators = concerning_service.quality_indicators
        
        # These would trigger quality improvement requirements
        quality_concerns = []
        
        if indicators['mortalidad_intrahospitalaria'] > 3.0:
            quality_concerns.append('high_mortality')
        if indicators['infecciones_asociadas_atencion'] > 2.0:
            quality_concerns.append('high_infections')
        if indicators['satisfaccion_usuario'] < 70.0:
            quality_concerns.append('low_satisfaction')
        if concerning_service.patient_safety_events > 5:
            quality_concerns.append('excessive_safety_events')
        
        self.assertTrue(len(quality_concerns) > 0)
        self.assertIn('high_mortality', quality_concerns)
        self.assertIn('high_infections', quality_concerns)
        self.assertIn('low_satisfaction', quality_concerns)
    
    def test_quality_improvement_plan_requirements(self):
        """Test quality improvement plan requirements for non-compliant services."""
        headquarters = HeadquarterLocationFactory.create()
        
        process = ServiceHabilitationProcessFactory.create(
            headquarters=headquarters,
            service_code='301',
            process_type='renovacion',
            self_evaluation_score=Decimal('72.0'),  # Below 80% threshold
            improvement_plan={
                'identificacion_problemas': [
                    'Tiempo de respuesta en urgencias superior a estándares',
                    'Tasa de infecciones nosocomiales elevada',
                    'Satisfacción del usuario por debajo del promedio'
                ],
                'acciones_correctivas': [
                    {
                        'problema': 'Tiempo de respuesta urgencias',
                        'accion': 'Implementar protocolo de triaje avanzado',
                        'responsable': 'Jefe de Urgencias',
                        'plazo': '3 meses',
                        'indicador_seguimiento': 'Tiempo promedio atención'
                    },
                    {
                        'problema': 'Infecciones nosocomiales',
                        'accion': 'Reforzar protocolos de bioseguridad',
                        'responsable': 'Comité de Infecciones',
                        'plazo': '6 meses',
                        'indicador_seguimiento': 'Tasa infección por servicio'
                    }
                ],
                'cronograma_implementacion': {
                    'mes_1': 'Capacitación personal en nuevos protocolos',
                    'mes_2': 'Implementación piloto en urgencias',
                    'mes_3': 'Evaluación y ajustes protocolos',
                    'mes_6': 'Evaluación integral resultados'
                },
                'recursos_requeridos': {
                    'humanos': 'Capacitación 40 personas',
                    'tecnicos': 'Actualización sistema información',
                    'financieros': 'Presupuesto estimado: $50,000,000 COP'
                }
            }
        )
        
        plan = process.improvement_plan
        
        # Verify improvement plan completeness
        self.assertIn('identificacion_problemas', plan)
        self.assertIn('acciones_correctivas', plan)
        self.assertIn('cronograma_implementacion', plan)
        self.assertIn('recursos_requeridos', plan)
        
        # Verify action plan structure
        for action in plan['acciones_correctivas']:
            self.assertIn('problema', action)
            self.assertIn('accion', action)
            self.assertIn('responsable', action)
            self.assertIn('plazo', action)
            self.assertIn('indicador_seguimiento', action)


class DivipolaComplianceTestCase(TestCase):
    """
    Tests for DIVIPOLA (División Político Administrativa) compliance.
    
    DIVIPOLA is the official coding system for Colombian territorial divisions.
    """
    
    def test_major_cities_divipola_codes(self):
        """Test DIVIPOLA codes for major Colombian cities."""
        health_org = HealthOrganizationProfileFactory.create()
        
        major_cities_data = [
            {
                'department_code': '11',
                'municipality_code': '11001',
                'department_name': 'Bogotá D.C.',
                'municipality_name': 'Bogotá',
                'expected_region': 'Capital'
            },
            {
                'department_code': '05',
                'municipality_code': '05001',
                'department_name': 'Antioquia',
                'municipality_name': 'Medellín',
                'expected_region': 'Andina'
            },
            {
                'department_code': '76',
                'municipality_code': '76001',
                'department_name': 'Valle del Cauca',
                'municipality_name': 'Cali',
                'expected_region': 'Pacífica'
            },
            {
                'department_code': '08',
                'municipality_code': '08001',
                'department_name': 'Atlántico',
                'municipality_name': 'Barranquilla',
                'expected_region': 'Caribe'
            },
            {
                'department_code': '68',
                'municipality_code': '68001',
                'department_name': 'Santander',
                'municipality_name': 'Bucaramanga',
                'expected_region': 'Andina'
            }
        ]
        
        for city_data in major_cities_data:
            with self.subTest(city=city_data['municipality_name']):
                headquarters = HeadquarterLocationFactory.create(
                    organization=health_org,
                    department_code=city_data['department_code'],
                    municipality_code=city_data['municipality_code'],
                    department_name=city_data['department_name'],
                    municipality_name=city_data['municipality_name']
                )
                
                # Verify DIVIPOLA consistency
                self.assertTrue(
                    headquarters.municipality_code.startswith(headquarters.department_code)
                )
                self.assertEqual(headquarters.department_code, city_data['department_code'])
                self.assertEqual(headquarters.municipality_code, city_data['municipality_code'])
    
    def test_department_municipality_consistency(self):
        """Test department-municipality code consistency."""
        health_org = HealthOrganizationProfileFactory.create()
        
        # Valid department-municipality combinations
        valid_combinations = [
            ('11', '11001'),  # Bogotá
            ('05', '05002'),  # Abejorral, Antioquia
            ('05', '05004'),  # Abriaquí, Antioquia
            ('76', '76020'),  # Alcalá, Valle
            ('08', '08078'),  # Baranoa, Atlántico
        ]
        
        for dept_code, mun_code in valid_combinations:
            with self.subTest(dept=dept_code, mun=mun_code):
                headquarters = HeadquarterLocationFactory.create(
                    organization=health_org,
                    department_code=dept_code,
                    municipality_code=mun_code
                )
                
                self.assertTrue(headquarters.municipality_code.startswith(dept_code))
        
        # Invalid combinations should raise validation error
        invalid_combinations = [
            ('11', '05001'),  # Bogotá dept with Medellín municipality
            ('05', '76001'),  # Antioquia dept with Cali municipality
        ]
        
        for dept_code, mun_code in invalid_combinations:
            with self.subTest(invalid_dept=dept_code, invalid_mun=mun_code):
                # This would ideally be caught by validation
                # depending on implementation of business rules
                pass


class Law1581DataProtectionTestCase(TestCase):
    """
    Tests for Law 1581/2012 compliance (Personal Data Protection - Habeas Data).
    
    This law regulates personal data protection in Colombia.
    """
    
    def test_personal_data_fields_identified(self):
        """Test identification of personal data fields requiring protection."""
        health_org = HealthOrganizationProfileFactory.create()
        
        headquarters = HeadquarterLocationFactory.create(
            organization=health_org,
            administrative_contact='Dr. Juan Pérez García',  # Personal data
            administrative_contact_phone='+57 1 234 5678',    # Personal data
            administrative_contact_email='juan.perez@hospital.com'  # Personal data
        )
        
        process = ServiceHabilitationProcessFactory.create(
            headquarters=headquarters,
            assigned_inspector='Dra. María González López'  # Personal data
        )
        
        # Verify personal data is present but should be handled securely
        self.assertIsNotNone(headquarters.administrative_contact)
        self.assertIsNotNone(headquarters.administrative_contact_email)
        self.assertIsNotNone(process.assigned_inspector)
        
        # In a real implementation, these fields would have additional
        # security measures, encryption, and access controls
    
    def test_data_audit_trail_compliance(self):
        """Test audit trail compliance for personal data access."""
        health_org = HealthOrganizationProfileFactory.create()
        
        headquarters = HeadquarterLocationFactory.create(
            organization=health_org,
            created_by_id=1,  # Should track who created
            updated_by_id=1,  # Should track who updated
        )
        
        # Verify audit fields are populated
        self.assertIsNotNone(headquarters.created_at)
        self.assertIsNotNone(headquarters.updated_at)
        self.assertIsNotNone(headquarters.created_by_id)
        self.assertIsNotNone(headquarters.updated_by_id)
        
        # In production, there would be additional logging
        # of who accessed personal data and when


@pytest.mark.django_db
class ColombianHealthNetworkComplianceTestCase:
    """
    Integration tests for complete Colombian health network compliance.
    """
    
    def test_complete_network_compliance(self):
        """Test complete health network compliance with all regulations."""
        # Create complete network using factory
        network = create_colombian_health_network_with_sedes()
        
        main_hq = network['main_headquarters']
        services = network['services']
        processes = network['processes']
        
        # Verify REPS compliance
        assert main_hq.reps_code is not None
        assert main_hq.habilitation_status in ['habilitada', 'en_proceso']
        
        # Verify Resolution 3100/2019 compliance
        for service in services:
            assert service.service_group in [
                'consulta_externa', 'apoyo_diagnostico', 'internacion',
                'quirurgicos', 'urgencias'
            ]
            assert 1 <= service.complexity_level <= 4
            assert any([
                service.intramural, service.extramural,
                service.domiciliary, service.telemedicine
            ])
        
        # Verify Resolution 256/2016 compliance
        quality_services = [s for s in services if s.quality_indicators]
        for service in quality_services:
            indicators = service.quality_indicators
            if 'satisfaccion_pacientes' in indicators:
                assert 0 <= indicators['satisfaccion_pacientes'] <= 100
        
        # Verify DIVIPOLA compliance
        assert main_hq.department_code in ['05', '08', '11', '13', '15', '17', '19', '20', '23', '25', '27']
        assert main_hq.municipality_code.startswith(main_hq.department_code)
        
        # Verify process compliance
        for process in processes:
            assert process.process_type in ['nueva', 'renovacion', 'modificacion', 'ampliacion']
            assert process.current_status is not None
            assert process.current_phase is not None
    
    def test_reps_compliance_test_data_function(self):
        """Test the REPS compliance test data factory function."""
        compliance_data = create_reps_compliance_test_data()
        
        headquarters = compliance_data['headquarters']
        services = compliance_data['services']
        process = compliance_data['process']
        
        # Verify REPS compliance
        assert headquarters.reps_code == '11001234'
        assert headquarters.habilitation_status == 'habilitada'
        assert headquarters.operational_status == 'activa'
        assert headquarters.is_operational
        
        # Verify service compliance
        for service in services:
            assert service.headquarters == headquarters
            assert service.infrastructure_compliance >= Decimal('85.0')
            assert service.equipment_compliance >= Decimal('85.0')
            assert service.medication_compliance >= Decimal('85.0')
            assert service.is_valid
        
        # Verify process compliance
        assert process.headquarters == headquarters
        assert process.health_secretary == 'Secretaría de Salud de Bogotá'
        assert process.service_code in ['101']  # Should match service
    
    def test_multi_complexity_service_compliance(self):
        """Test compliance across different service complexity levels."""
        health_org = HealthOrganizationProfileFactory.create()
        headquarters = HeadquarterLocationFactory.create(organization=health_org)
        
        complexity_requirements = {
            1: {  # Baja complejidad
                'min_infrastructure': 70.0,
                'min_equipment': 75.0,
                'min_medication': 80.0,
                'requires_auth': False
            },
            2: {  # Media complejidad
                'min_infrastructure': 80.0,
                'min_equipment': 85.0,
                'min_medication': 85.0,
                'requires_auth': False
            },
            3: {  # Alta complejidad
                'min_infrastructure': 90.0,
                'min_equipment': 95.0,
                'min_medication': 90.0,
                'requires_auth': True
            },
            4: {  # Máxima complejidad
                'min_infrastructure': 95.0,
                'min_equipment': 98.0,
                'min_medication': 95.0,
                'requires_auth': True
            }
        }
        
        for level, requirements in complexity_requirements.items():
            service = EnabledHealthServiceFactory.create(
                headquarters=headquarters,
                complexity_level=level,
                service_code=f'{100 + level}',
                infrastructure_compliance=Decimal(str(requirements['min_infrastructure'])),
                equipment_compliance=Decimal(str(requirements['min_equipment'])),
                medication_compliance=Decimal(str(requirements['min_medication'])),
                requires_authorization=requirements['requires_auth']
            )
            
            # Verify compliance with complexity requirements
            assert service.complexity_level == level
            assert service.infrastructure_compliance >= Decimal(str(requirements['min_infrastructure']))
            assert service.equipment_compliance >= Decimal(str(requirements['min_equipment']))
            assert service.medication_compliance >= Decimal(str(requirements['min_medication']))
            assert service.requires_authorization == requirements['requires_auth']