"""
Unit tests for ServiceHabilitationProcess model.

Tests comprehensive functionality including habilitation workflow transitions,
Colombian health authority compliance, process validation, and business logic.
"""

import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta

from apps.organization.models import ServiceHabilitationProcess
from apps.organization.tests.factories import (
    ServiceHabilitationProcessFactory, NewHabilitationProcessFactory,
    RenewalProcessFactory, CompletedProcessFactory,
    HeadquarterLocationFactory, UserFactory
)

User = get_user_model()


class ServiceHabilitationProcessModelTestCase(TestCase):
    """Test case for ServiceHabilitationProcess model functionality."""
    
    def setUp(self):
        """Set up test data."""
        self.user = UserFactory.create()
        self.headquarters = HeadquarterLocationFactory.create()
    
    def test_create_process_with_valid_data(self):
        """Test creating habilitation process with valid data."""
        process = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            service_code='101',
            service_name='Medicina General',
            process_type='nueva',
            current_status='iniciado',
            current_phase='preparacion'
        )
        
        self.assertIsNotNone(process.id)
        self.assertEqual(process.headquarters, self.headquarters)
        self.assertEqual(process.service_code, '101')
        self.assertEqual(process.process_type, 'nueva')
        self.assertEqual(process.current_status, 'iniciado')
        self.assertTrue(process.created_at)
    
    def test_process_type_choices_validation(self):
        """Test all process type choices are valid."""
        valid_types = ['nueva', 'renovacion', 'modificacion', 'ampliacion']
        
        for process_type in valid_types:
            with self.subTest(process_type=process_type):
                process = ServiceHabilitationProcessFactory.build(
                    headquarters=self.headquarters,
                    process_type=process_type
                )
                process.full_clean()
    
    def test_current_status_choices_validation(self):
        """Test all current status choices are valid."""
        valid_statuses = [
            'iniciado', 'documentacion', 'autoevaluacion', 'radicado',
            'en_revision', 'visita_programada', 'visita_realizada',
            'concepto_emitido', 'aprobado', 'rechazado', 'desistido'
        ]
        
        for status in valid_statuses:
            with self.subTest(current_status=status):
                process = ServiceHabilitationProcessFactory.build(
                    headquarters=self.headquarters,
                    current_status=status
                )
                process.full_clean()
    
    def test_current_phase_choices_validation(self):
        """Test all current phase choices are valid."""
        valid_phases = [
            'preparacion', 'autoevaluacion', 'radicacion',
            'verificacion', 'resolucion', 'seguimiento'
        ]
        
        for phase in valid_phases:
            with self.subTest(current_phase=phase):
                process = ServiceHabilitationProcessFactory.build(
                    headquarters=self.headquarters,
                    current_phase=phase
                )
                process.full_clean()
    
    def test_resolution_result_choices_validation(self):
        """Test all resolution result choices are valid."""
        valid_results = ['aprobado', 'aprobado_condicionado', 'rechazado', 'desistido']
        
        for result in valid_results:
            with self.subTest(resolution_result=result):
                process = ServiceHabilitationProcessFactory.build(
                    headquarters=self.headquarters,
                    resolution_result=result
                )
                process.full_clean()
    
    def test_verification_dates_validation(self):
        """Test verification date validation logic."""
        # Valid: completed date after scheduled date
        process = ServiceHabilitationProcessFactory.build(
            headquarters=self.headquarters,
            verification_scheduled=date(2024, 6, 1),
            verification_completed=date(2024, 6, 5)
        )
        process.full_clean()
        
        # Invalid: completed date before scheduled date
        with self.assertRaises(ValidationError):
            process = ServiceHabilitationProcessFactory.build(
                headquarters=self.headquarters,
                verification_scheduled=date(2024, 6, 5),
                verification_completed=date(2024, 6, 1)
            )
            process.full_clean()
    
    def test_submission_resolution_dates_validation(self):
        """Test submission and resolution dates validation."""
        # Valid: resolution date after submission date
        process = ServiceHabilitationProcessFactory.build(
            headquarters=self.headquarters,
            submission_date=date(2024, 1, 1),
            resolution_date=date(2024, 3, 1)
        )
        process.full_clean()
        
        # Invalid: resolution date before submission date
        with self.assertRaises(ValidationError):
            process = ServiceHabilitationProcessFactory.build(
                headquarters=self.headquarters,
                submission_date=date(2024, 3, 1),
                resolution_date=date(2024, 1, 1)
            )
            process.full_clean()
    
    def test_is_completed_property(self):
        """Test is_completed property logic."""
        # Completed statuses
        completed_statuses = ['aprobado', 'rechazado', 'desistido']
        
        for status in completed_statuses:
            with self.subTest(status=status):
                process = ServiceHabilitationProcessFactory.create(
                    headquarters=self.headquarters,
                    current_status=status
                )
                self.assertTrue(process.is_completed)
        
        # Non-completed statuses
        non_completed_statuses = ['iniciado', 'documentacion', 'en_revision']
        
        for status in non_completed_statuses:
            with self.subTest(status=status):
                process = ServiceHabilitationProcessFactory.create(
                    headquarters=self.headquarters,
                    current_status=status
                )
                self.assertFalse(process.is_completed)
    
    def test_is_approved_property(self):
        """Test is_approved property logic."""
        # Approved results
        approved_results = ['aprobado', 'aprobado_condicionado']
        
        for result in approved_results:
            with self.subTest(resolution_result=result):
                process = ServiceHabilitationProcessFactory.create(
                    headquarters=self.headquarters,
                    resolution_result=result
                )
                self.assertTrue(process.is_approved)
        
        # Non-approved results
        non_approved_results = ['rechazado', 'desistido']
        
        for result in non_approved_results:
            with self.subTest(resolution_result=result):
                process = ServiceHabilitationProcessFactory.create(
                    headquarters=self.headquarters,
                    resolution_result=result
                )
                self.assertFalse(process.is_approved)
        
        # No resolution result
        no_result = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            resolution_result=''
        )
        self.assertFalse(no_result.is_approved)
    
    def test_days_since_submission_property(self):
        """Test days_since_submission property calculation."""
        today = date.today()
        
        # Process with resolution
        resolved_process = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            submission_date=today - timedelta(days=90),
            resolution_date=today - timedelta(days=30)
        )
        self.assertEqual(resolved_process.days_since_submission, 60)
        
        # Process without resolution (ongoing)
        ongoing_process = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            submission_date=today - timedelta(days=45),
            resolution_date=None
        )
        self.assertEqual(ongoing_process.days_since_submission, 45)
        
        # Process without submission date
        no_submission = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            submission_date=None
        )
        self.assertIsNone(no_submission.days_since_submission)
    
    def test_documentation_progress_property(self):
        """Test documentation_progress property calculation."""
        # Process with complete documentation
        complete_docs = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            required_documents={
                'doc1': 'Document 1',
                'doc2': 'Document 2', 
                'doc3': 'Document 3'
            },
            submitted_documents={
                'doc1': 'Submitted Doc 1',
                'doc2': 'Submitted Doc 2',
                'doc3': 'Submitted Doc 3'
            }
        )
        self.assertEqual(complete_docs.documentation_progress, 100.0)
        
        # Process with partial documentation
        partial_docs = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            required_documents={
                'doc1': 'Document 1',
                'doc2': 'Document 2',
                'doc3': 'Document 3',
                'doc4': 'Document 4'
            },
            submitted_documents={
                'doc1': 'Submitted Doc 1',
                'doc2': 'Submitted Doc 2'
            }
        )
        self.assertEqual(partial_docs.documentation_progress, 50.0)
        
        # Process with no required documents
        no_required = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            required_documents={},
            submitted_documents={}
        )
        self.assertEqual(no_required.documentation_progress, 100.0)
    
    def test_advance_to_next_phase_method(self):
        """Test advance_to_next_phase method functionality."""
        # Test valid phase transitions
        phase_transitions = {
            'preparacion': 'autoevaluacion',
            'autoevaluacion': 'radicacion',
            'radicacion': 'verificacion',
            'verificacion': 'resolucion',
            'resolucion': 'seguimiento',
        }
        
        for current_phase, next_phase in phase_transitions.items():
            with self.subTest(current_phase=current_phase):
                process = ServiceHabilitationProcessFactory.create(
                    headquarters=self.headquarters,
                    current_phase=current_phase
                )
                
                result = process.advance_to_next_phase()
                
                self.assertTrue(result)
                process.refresh_from_db()
                self.assertEqual(process.current_phase, next_phase)
        
        # Test invalid transition (final phase)
        final_process = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            current_phase='seguimiento'
        )
        
        result = final_process.advance_to_next_phase()
        self.assertFalse(result)
        
        final_process.refresh_from_db()
        self.assertEqual(final_process.current_phase, 'seguimiento')
    
    def test_calculate_process_duration_method(self):
        """Test calculate_process_duration method."""
        today = date.today()
        
        process = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            submission_date=today - timedelta(days=90),
            resolution_date=today - timedelta(days=30),
            process_duration_days=None
        )
        
        process.calculate_process_duration()
        process.refresh_from_db()
        
        self.assertEqual(process.process_duration_days, 60)
        
        # Test with no resolution date
        ongoing_process = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            submission_date=today - timedelta(days=30),
            resolution_date=None
        )
        
        ongoing_process.calculate_process_duration()
        ongoing_process.refresh_from_db()
        
        # Should not change if no resolution date
        self.assertIsNone(ongoing_process.process_duration_days)
    
    def test_str_representation(self):
        """Test string representation of process."""
        process = ServiceHabilitationProcessFactory.create(
            headquarters=self.headquarters,
            process_type='nueva',
            service_name='Medicina General',
            current_status='iniciado'
        )
        expected_str = 'nueva - Medicina General (iniciado)'
        self.assertEqual(str(process), expected_str)
    
    def test_json_fields_default_values(self):
        """Test JSON fields have correct default values."""
        process = ServiceHabilitationProcessFactory.create(headquarters=self.headquarters)
        
        self.assertEqual(process.required_documents, {})
        self.assertEqual(process.submitted_documents, {})
        self.assertEqual(process.pending_documents, [])
        self.assertEqual(process.self_evaluation_result, {})
        self.assertEqual(process.improvement_plan, {})
        self.assertEqual(process.verification_report, {})
        self.assertEqual(process.verification_findings, [])
        self.assertEqual(process.conditions_imposed, [])
        self.assertEqual(process.follow_up_actions, [])
    
    def test_self_evaluation_score_validation(self):
        """Test self-evaluation score validation (0-100)."""
        # Valid scores
        valid_scores = [0.0, 50.0, 100.0]
        
        for score in valid_scores:
            with self.subTest(score=score):
                process = ServiceHabilitationProcessFactory.build(
                    headquarters=self.headquarters,
                    self_evaluation_score=score
                )
                process.full_clean()
        
        # Invalid scores
        invalid_scores = [-1.0, 101.0, 150.0]
        
        for score in invalid_scores:
            with self.subTest(score=score):
                with self.assertRaises(ValidationError):
                    process = ServiceHabilitationProcessFactory.build(
                        headquarters=self.headquarters,
                        self_evaluation_score=score
                    )
                    process.full_clean()


class ServiceHabilitationProcessFactoryTestCase(TestCase):
    """Test cases for habilitation process factories."""
    
    def test_new_habilitation_process_factory(self):
        """Test NewHabilitationProcessFactory creates proper new processes."""
        process = NewHabilitationProcessFactory.create()
        
        self.assertEqual(process.process_type, 'nueva')
        self.assertIn(process.current_status, ['iniciado', 'documentacion', 'autoevaluacion'])
        self.assertIn(process.current_phase, ['preparacion', 'autoevaluacion'])
    
    def test_renewal_process_factory(self):
        """Test RenewalProcessFactory creates proper renewal processes."""
        process = RenewalProcessFactory.create()
        
        self.assertEqual(process.process_type, 'renovacion')
        self.assertIn(process.current_status, ['radicado', 'en_revision', 'visita_programada'])
        self.assertIn(process.current_phase, ['radicacion', 'verificacion'])
    
    def test_completed_process_factory(self):
        """Test CompletedProcessFactory creates proper completed processes."""
        process = CompletedProcessFactory.create()
        
        self.assertIn(process.current_status, ['aprobado', 'rechazado'])
        self.assertEqual(process.current_phase, 'seguimiento')
        self.assertIsNotNone(process.resolution_date)
        self.assertIsNotNone(process.resolution_number)
        self.assertIsNotNone(process.resolution_result)
        
        if process.resolution_date and process.submission_date:
            self.assertIsNotNone(process.process_duration_days)
    
    def test_factory_generates_valid_submission_numbers(self):
        """Test that factories generate valid submission numbers."""
        process = ServiceHabilitationProcessFactory.create()
        if process.submission_number:
            self.assertRegex(process.submission_number, r'^RAD-\d{4}-\d{6}$')
    
    def test_factory_generates_valid_resolution_numbers(self):
        """Test that factories generate valid resolution numbers."""
        process = CompletedProcessFactory.create()
        if process.resolution_number:
            self.assertRegex(process.resolution_number, r'^RES-\d{4}-\d{4}$')
    
    def test_factory_generates_valid_colombian_health_secretaries(self):
        """Test that factories generate valid Colombian health secretaries."""
        process = ServiceHabilitationProcessFactory.create()
        
        valid_secretaries = [
            'Secretaría de Salud de Bogotá',
            'Secretaría de Salud de Antioquia',
            'Secretaría de Salud del Atlántico',
            'Secretaría de Salud de Valle del Cauca'
        ]
        
        if process.health_secretary:
            self.assertIn(process.health_secretary, valid_secretaries)


@pytest.mark.django_db
class ServiceHabilitationProcessWorkflowTestCase:
    """Test cases for habilitation process workflow using pytest."""
    
    def test_new_habilitation_workflow(self):
        """Test complete new habilitation workflow."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Step 1: Initiate process
        process = NewHabilitationProcessFactory.create(
            headquarters=headquarters,
            service_code='101',
            service_name='Medicina General',
            current_status='iniciado',
            current_phase='preparacion'
        )
        
        assert process.process_type == 'nueva'
        assert process.current_phase == 'preparacion'
        assert not process.is_completed
        
        # Step 2: Advance to self-evaluation
        success = process.advance_to_next_phase()
        assert success
        assert process.current_phase == 'autoevaluacion'
        
        # Step 3: Complete self-evaluation
        process.self_evaluation_date = date.today()
        process.self_evaluation_score = 85.0
        process.current_status = 'autoevaluacion'
        process.save()
        
        assert process.self_evaluation_score >= 75.0  # Minimum passing score
        
        # Step 4: Advance to submission
        success = process.advance_to_next_phase()
        assert success
        assert process.current_phase == 'radicacion'
        
        # Step 5: Submit to health authority
        process.submission_date = date.today()
        process.submission_number = 'RAD-2024-123456'
        process.health_secretary = 'Secretaría de Salud de Bogotá'
        process.current_status = 'radicado'
        process.save()
        
        assert process.submission_date is not None
        assert process.days_since_submission >= 0
        
        # Step 6: Advance to verification
        success = process.advance_to_next_phase()
        assert success
        assert process.current_phase == 'verificacion'
        
        # Step 7: Schedule and complete verification visit
        process.verification_scheduled = date.today() + timedelta(days=30)
        process.verification_completed = date.today() + timedelta(days=35)
        process.current_status = 'visita_realizada'
        process.save()
        
        assert process.verification_completed > process.verification_scheduled
        
        # Step 8: Advance to resolution
        success = process.advance_to_next_phase()
        assert success
        assert process.current_phase == 'resolucion'
        
        # Step 9: Issue resolution
        process.resolution_date = date.today() + timedelta(days=60)
        process.resolution_number = 'RES-2024-1234'
        process.resolution_result = 'aprobado'
        process.current_status = 'aprobado'
        process.save()
        
        assert process.is_completed
        assert process.is_approved
        
        # Step 10: Calculate duration and advance to follow-up
        process.calculate_process_duration()
        success = process.advance_to_next_phase()
        
        assert success
        assert process.current_phase == 'seguimiento'
        assert process.process_duration_days > 0
    
    def test_renewal_workflow_with_conditions(self):
        """Test renewal workflow with conditional approval."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Renewal process
        process = RenewalProcessFactory.create(
            headquarters=headquarters,
            service_code='201',
            service_name='Laboratorio Clínico',
            process_type='renovacion',
            current_status='radicado',
            current_phase='radicacion'
        )
        
        # Set existing service data (renewal context)
        process.self_evaluation_score = 78.0  # Borderline score
        process.improvement_plan = {
            'acciones': [
                {
                    'accion': 'Actualizar equipos de laboratorio',
                    'plazo': '6 meses',
                    'responsable': 'Jefe de Laboratorio'
                }
            ]
        }
        process.save()
        
        # Process verification
        process.advance_to_next_phase()  # To verification
        process.verification_completed = date.today()
        process.verification_findings = [
            'Equipos requieren actualización',
            'Personal capacitado adecuadamente',
            'Procedimientos documentados correctamente'
        ]
        process.save()
        
        # Conditional approval
        process.advance_to_next_phase()  # To resolution
        process.resolution_result = 'aprobado_condicionado'
        process.conditions_imposed = [
            'Actualizar equipos de laboratorio en 6 meses',
            'Presentar informe de cumplimiento en 9 meses'
        ]
        process.compliance_deadline = date.today() + timedelta(days=180)
        process.current_status = 'aprobado'
        process.save()
        
        assert process.is_approved
        assert process.resolution_result == 'aprobado_condicionado'
        assert len(process.conditions_imposed) > 0
        assert process.compliance_deadline is not None
    
    def test_process_rejection_workflow(self):
        """Test process rejection and appeal workflow."""
        headquarters = HeadquarterLocationFactory.create()
        
        # Process that will be rejected
        process = ServiceHabilitationProcessFactory.create(
            headquarters=headquarters,
            current_phase='resolucion',
            self_evaluation_score=65.0  # Below minimum threshold
        )
        
        # Reject process
        process.resolution_date = date.today()
        process.resolution_result = 'rechazado'
        process.current_status = 'rechazado'
        process.conditions_imposed = [
            'Mejorar infraestructura física',
            'Completar capacitación del personal',
            'Implementar sistema de gestión de calidad'
        ]
        process.save()
        
        assert process.is_completed
        assert not process.is_approved
        assert process.resolution_result == 'rechazado'
    
    def test_documentation_requirements_by_process_type(self):
        """Test documentation requirements vary by process type."""
        headquarters = HeadquarterLocationFactory.create()
        
        # New habilitation - basic documents
        new_process = NewHabilitationProcessFactory.create(
            headquarters=headquarters,
            required_documents={
                'formulario_inscripcion': 'Formulario de inscripción',
                'certificado_existencia': 'Certificado de existencia',
                'autoevaluacion': 'Documento de autoevaluación',
                'planos_infraestructura': 'Planos de infraestructura',
                'manual_bioseguridad': 'Manual de bioseguridad'
            }
        )
        
        assert 'formulario_inscripcion' in new_process.required_documents
        assert 'autoevaluacion' in new_process.required_documents
        
        # Renewal - additional documents
        renewal_process = RenewalProcessFactory.create(
            headquarters=headquarters,
            required_documents={
                'formulario_inscripcion': 'Formulario de inscripción',
                'autoevaluacion': 'Documento de autoevaluación',
                'informe_indicadores': 'Informe de indicadores del último año',
                'plan_mejoramiento': 'Plan de mejoramiento continuo'
            }
        )
        
        assert 'informe_indicadores' in renewal_process.required_documents
        assert 'plan_mejoramiento' in renewal_process.required_documents
    
    def test_quality_metrics_tracking(self):
        """Test quality metrics tracking throughout process."""
        headquarters = HeadquarterLocationFactory.create()
        
        process = ServiceHabilitationProcessFactory.create(
            headquarters=headquarters,
            self_evaluation_result={
                'puntaje_total': 85,
                'areas_evaluadas': [
                    'infraestructura',
                    'dotacion', 
                    'medicamentos',
                    'talento_humano'
                ],
                'fortalezas': [
                    'Personal altamente calificado',
                    'Infraestructura moderna'
                ],
                'oportunidades_mejora': [
                    'Actualización de protocolos',
                    'Capacitación continua'
                ]
            }
        )
        
        # Verify quality metrics structure
        result = process.self_evaluation_result
        assert 'puntaje_total' in result
        assert 'areas_evaluadas' in result
        assert 'fortalezas' in result
        assert 'oportunidades_mejora' in result
        
        # Quality thresholds
        assert result['puntaje_total'] >= 70  # Minimum acceptable score
        assert len(result['areas_evaluadas']) >= 4  # All required areas evaluated