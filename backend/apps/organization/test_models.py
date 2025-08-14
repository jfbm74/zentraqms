"""
Tests for Organization Models - TASK-024

Comprehensive test suite for Organization app models including:
- NIT validation tests
- Unique main location constraint tests
- Template application tests
- Audit logging tests

Author: Claude
Date: 2025-08-14
Coverage Target: >80%
"""

import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.organization.models import Organization, Location, SectorTemplate, AuditLog


User = get_user_model()


class OrganizationModelTests(TestCase):
    """Test suite for Organization model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.valid_organization_data = {
            "razon_social": "Empresa de Prueba S.A.S.",
            "nombre_comercial": "Prueba Corp",
            "nit": "900123456",
            "digito_verificacion": "8",
            "tipo_organizacion": "empresa_privada",
            "sector_economico": "tecnologia",
            "tamaño_empresa": "mediana",
            "fecha_fundacion": date(2020, 1, 15),
            "descripcion": "Empresa de prueba para testing",
            "website": "https://www.prueba.com",
            "email_contacto": "contacto@prueba.com",
            "telefono_principal": "+57 1 234-5678",
        }

    def test_create_organization_valid_data(self):
        """Test creating organization with valid data."""
        org = Organization.objects.create(**self.valid_organization_data)

        self.assertEqual(org.razon_social, "Empresa de Prueba S.A.S.")
        self.assertEqual(org.nit, "900123456")
        self.assertEqual(org.digito_verificacion, "8")
        self.assertEqual(str(org), "Prueba Corp")
        self.assertTrue(org.is_active)

    def test_organization_str_representation(self):
        """Test string representation uses commercial name first, then legal name."""
        org = Organization.objects.create(**self.valid_organization_data)
        self.assertEqual(str(org), "Prueba Corp")

        # Test with no commercial name
        org.nombre_comercial = ""
        org.save()
        self.assertEqual(str(org), "Empresa de Prueba S.A.S.")

    def test_nit_completo_property(self):
        """Test NIT completo property formatting."""
        org = Organization.objects.create(**self.valid_organization_data)
        self.assertEqual(org.nit_completo, "900123456-8")

    def test_nit_validation_format(self):
        """Test NIT format validation."""
        # Valid formats with correct verification digits
        valid_nits = [
            ("900123456", "8"),
            ("12345678901", "2"),
            ("900-123-456", "8"),  # Same as 900123456 after cleaning
        ]

        for nit, dv in valid_nits:
            data = self.valid_organization_data.copy()
            data["nit"] = nit
            data["digito_verificacion"] = dv
            try:
                org = Organization(**data)
                org.full_clean()  # This triggers validation
            except ValidationError:
                self.fail(f"NIT {nit} with DV {dv} should be valid")

        # Invalid formats
        invalid_nits = ["12345", "12345678901234567890", "ABC123456", ""]

        for nit in invalid_nits:
            data = self.valid_organization_data.copy()
            data["nit"] = nit
            org = Organization(**data)
            with self.assertRaises(ValidationError):
                org.full_clean()

    def test_nit_unique_constraint(self):
        """Test NIT uniqueness constraint."""
        Organization.objects.create(**self.valid_organization_data)

        # Try to create another organization with same NIT
        duplicate_data = self.valid_organization_data.copy()
        duplicate_data["razon_social"] = "Otra Empresa"

        with self.assertRaises(IntegrityError):
            Organization.objects.create(**duplicate_data)

    def test_digito_verificacion_validation(self):
        """Test verification digit validation."""
        # Test valid verification digit for the NIT
        data = self.valid_organization_data.copy()
        org = Organization(**data)
        try:
            org.full_clean()
        except ValidationError:
            self.fail(f"Verification digit should be valid")

        # Test invalid verification digits
        invalid_dvs = ["A", "10", "X", ""]

        for dv in invalid_dvs:
            data = self.valid_organization_data.copy()
            data["digito_verificacion"] = dv
            org = Organization(**data)
            with self.assertRaises(ValidationError):
                org.full_clean()

    def test_calcular_digito_verificacion(self):
        """Test NIT verification digit calculation algorithm."""
        # Test known NIT and verification digit pairs
        test_cases = [
            ("900123456", 8),
            ("830020154", 2),
            ("860518614", 7),
            ("900359991", 0),
            ("123456789", 6),
        ]

        for nit, expected_dv in test_cases:
            calculated_dv = Organization.calcular_digito_verificacion(nit)
            self.assertEqual(
                calculated_dv,
                expected_dv,
                f"NIT {nit} should have verification digit {expected_dv}, got {calculated_dv}",
            )

    def test_nit_verification_digit_consistency_validation(self):
        """Test that clean() validates NIT and verification digit consistency."""
        # Test with correct verification digit
        data = self.valid_organization_data.copy()
        data["nit"] = "900123456"
        data["digito_verificacion"] = "8"  # Correct for this NIT

        org = Organization(**data)
        try:
            org.clean()  # Should not raise ValidationError
        except ValidationError:
            self.fail("Should not raise ValidationError for correct NIT and DV")

        # Test with incorrect verification digit
        data["digito_verificacion"] = "5"  # Incorrect for this NIT
        org = Organization(**data)

        with self.assertRaises(ValidationError) as context:
            org.clean()

        self.assertIn("digito_verificacion", context.exception.message_dict)

    def test_organization_choices_validation(self):
        """Test that choice fields only accept valid choices."""
        # Test tipo_organizacion
        data = self.valid_organization_data.copy()
        data["tipo_organizacion"] = "invalid_choice"

        org = Organization(**data)
        with self.assertRaises(ValidationError):
            org.full_clean()

        # Test sector_economico
        data = self.valid_organization_data.copy()
        data["sector_economico"] = "invalid_sector"

        org = Organization(**data)
        with self.assertRaises(ValidationError):
            org.full_clean()

        # Test tamaño_empresa
        data = self.valid_organization_data.copy()
        data["tamaño_empresa"] = "invalid_size"

        org = Organization(**data)
        with self.assertRaises(ValidationError):
            org.full_clean()

    def test_phone_validation(self):
        """Test phone number format validation."""
        valid_phones = ["+57 1 234-5678", "3001234567", "+1 555 123456", "601 234 5678"]

        for phone in valid_phones:
            data = self.valid_organization_data.copy()
            data["telefono_principal"] = phone
            org = Organization(**data)
            try:
                org.full_clean()
            except ValidationError:
                self.fail(f"Phone {phone} should be valid")

        # Test invalid phones
        invalid_phones = ["123", "12345678901234567890", "invalid-phone"]

        for phone in invalid_phones:
            data = self.valid_organization_data.copy()
            data["telefono_principal"] = phone
            org = Organization(**data)
            with self.assertRaises(ValidationError):
                org.full_clean()


class LocationModelTests(TestCase):
    """Test suite for Location model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.organization = Organization.objects.create(
            razon_social="Test Organization",
            nit="900123456",
            digito_verificacion="8",
            tipo_organizacion="empresa_privada",
            sector_economico="tecnologia",
            tamaño_empresa="mediana",
        )

        self.valid_location_data = {
            "organization": self.organization,
            "nombre": "Sede Principal Bogotá",
            "tipo_sede": "principal",
            "es_principal": True,
            "direccion": "Carrera 7 # 45-67",
            "ciudad": "Bogotá",
            "departamento": "Cundinamarca",
            "pais": "Colombia",
            "codigo_postal": "110111",
            "telefono": "+57 1 234-5678",
            "email": "bogota@test.com",
            "area_m2": Decimal("500.50"),
            "capacidad_personas": 50,
            "responsable_nombre": "Juan Pérez",
            "responsable_cargo": "Gerente General",
            "responsable_telefono": "+57 300 123-4567",
            "responsable_email": "juan.perez@test.com",
        }

    def test_create_location_valid_data(self):
        """Test creating location with valid data."""
        location = Location.objects.create(**self.valid_location_data)

        self.assertEqual(location.nombre, "Sede Principal Bogotá")
        self.assertEqual(location.organization, self.organization)
        self.assertTrue(location.es_principal)
        self.assertEqual(str(location), "Sede Principal Bogotá - Bogotá (Principal)")

    def test_location_str_representation(self):
        """Test location string representation."""
        location = Location.objects.create(**self.valid_location_data)
        expected = "Sede Principal Bogotá - Bogotá (Principal)"
        self.assertEqual(str(location), expected)

        # Test non-principal location
        location.es_principal = False
        location.save()
        expected = "Sede Principal Bogotá - Bogotá"
        self.assertEqual(str(location), expected)

    def test_direccion_completa_property(self):
        """Test complete address property."""
        location = Location.objects.create(**self.valid_location_data)
        expected = "Carrera 7 # 45-67, Bogotá, Cundinamarca, Colombia"
        self.assertEqual(location.direccion_completa, expected)

    def test_unique_main_location_constraint(self):
        """Test that only one main location is allowed per organization."""
        # Create first main location
        Location.objects.create(**self.valid_location_data)

        # Try to create another main location for same organization
        duplicate_data = self.valid_location_data.copy()
        duplicate_data["nombre"] = "Otra Sede Principal"

        with self.assertRaises(IntegrityError):
            Location.objects.create(**duplicate_data)

    def test_unique_main_location_validation_clean(self):
        """Test main location uniqueness validation in clean method."""
        # Create first main location
        Location.objects.create(**self.valid_location_data)

        # Try to create another main location
        duplicate_data = self.valid_location_data.copy()
        duplicate_data["nombre"] = "Otra Sede Principal"

        location = Location(**duplicate_data)
        with self.assertRaises(ValidationError) as context:
            location.clean()

        self.assertIn("es_principal", context.exception.message_dict)

    def test_multiple_non_main_locations_allowed(self):
        """Test that multiple non-main locations are allowed."""
        # Create main location
        Location.objects.create(**self.valid_location_data)

        # Create multiple non-main locations
        for i in range(3):
            data = self.valid_location_data.copy()
            data["nombre"] = f"Sucursal {i+1}"
            data["tipo_sede"] = "sucursal"
            data["es_principal"] = False

            try:
                Location.objects.create(**data)
            except IntegrityError:
                self.fail(f"Should allow multiple non-main locations")

    def test_first_location_automatically_main(self):
        """Test that first location is automatically marked as principal."""
        # Create a new organization to ensure it has no locations
        new_org = Organization.objects.create(
            razon_social="Nueva Organización",
            nit="830020154",
            digito_verificacion="2",
            tipo_organizacion="empresa_privada",
            sector_economico="tecnologia",
            tamaño_empresa="mediana",
        )

        data = self.valid_location_data.copy()
        data["organization"] = new_org
        data["es_principal"] = (
            False  # Even if set to False, first location should be main
        )

        location = Location.objects.create(**data)

        # Should be automatically set to True since it's the first location
        self.assertTrue(location.es_principal)

    def test_subsequent_locations_not_automatically_main(self):
        """Test that subsequent locations are not automatically marked as main."""
        # Create first location (will be automatically main)
        Location.objects.create(**self.valid_location_data)

        # Create second location explicitly non-main
        data = self.valid_location_data.copy()
        data["nombre"] = "Segunda Sede"
        data["es_principal"] = False

        location = Location.objects.create(**data)

        # Should remain False
        self.assertFalse(location.es_principal)

    def test_location_phone_validation(self):
        """Test location phone validation."""
        valid_phones = ["+57 1 234-5678", "3001234567", "601 234 5678"]

        for phone in valid_phones:
            data = self.valid_location_data.copy()
            data["telefono"] = phone
            data["responsable_telefono"] = phone
            data["nombre"] = f"Test {phone}"
            data["es_principal"] = False

            location = Location(**data)
            try:
                location.full_clean()
            except ValidationError:
                self.fail(f"Phone {phone} should be valid")

    def test_location_ordering(self):
        """Test location ordering (main first, then by name)."""
        # Create main location
        main_location = Location.objects.create(**self.valid_location_data)

        # Create non-main locations
        sucursal_data = self.valid_location_data.copy()
        sucursal_data["nombre"] = "B Sucursal"
        sucursal_data["es_principal"] = False
        sucursal_b = Location.objects.create(**sucursal_data)

        sucursal_data["nombre"] = "A Sucursal"
        sucursal_a = Location.objects.create(**sucursal_data)

        # Check ordering
        locations = list(Location.objects.all())
        self.assertEqual(locations[0], main_location)  # Main first
        self.assertEqual(locations[1], sucursal_a)  # Then alphabetical
        self.assertEqual(locations[2], sucursal_b)


class SectorTemplateModelTests(TestCase):
    """Test suite for SectorTemplate model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.organization = Organization.objects.create(
            razon_social="Test Health Organization",
            nit="900123456",
            digito_verificacion="8",
            tipo_organizacion="hospital",
            sector_economico="salud",
            tamaño_empresa="mediana",
        )

        self.valid_template_data = {
            "sector": "salud",
            "nombre_template": "Template Básico Salud",
            "descripcion": "Template básico para instituciones de salud",
            "version": "1.0",
            "data_json": {
                "procesos": [
                    {
                        "nombre": "Atención al Paciente",
                        "tipo": "operativo",
                        "descripcion": "Proceso de atención médica",
                    }
                ],
                "indicadores": [
                    {
                        "nombre": "Satisfacción del Paciente",
                        "formula": "(Pacientes satisfechos / Total pacientes) * 100",
                        "tipo": "resultado",
                        "meta": 90,
                    }
                ],
                "documentos": [
                    {
                        "nombre": "Manual de Procedimientos Médicos",
                        "tipo": "manual",
                        "obligatorio": True,
                    }
                ],
            },
        }

    def test_create_template_valid_data(self):
        """Test creating template with valid data."""
        template = SectorTemplate.objects.create(**self.valid_template_data)

        self.assertEqual(template.sector, "salud")
        self.assertEqual(template.nombre_template, "Template Básico Salud")
        self.assertEqual(template.version, "1.0")
        self.assertEqual(template.aplicaciones_exitosas, 0)
        self.assertIsNone(template.fecha_ultima_aplicacion)

    def test_template_str_representation(self):
        """Test template string representation."""
        template = SectorTemplate.objects.create(**self.valid_template_data)
        expected = "Salud - Template Básico Salud v1.0"
        self.assertEqual(str(template), expected)

    def test_template_unique_constraint(self):
        """Test unique constraint for sector, name, and version."""
        SectorTemplate.objects.create(**self.valid_template_data)

        # Try to create duplicate
        with self.assertRaises(IntegrityError):
            SectorTemplate.objects.create(**self.valid_template_data)

    def test_template_json_structure_validation(self):
        """Test JSON structure validation in clean method."""
        # Test valid JSON structure
        template = SectorTemplate(**self.valid_template_data)
        try:
            template.clean()
        except ValidationError:
            self.fail("Valid JSON structure should not raise ValidationError")

        # Test missing required keys
        invalid_data = self.valid_template_data.copy()
        invalid_data["data_json"] = {
            "procesos": []
        }  # Missing 'indicadores' and 'documentos'

        template = SectorTemplate(**invalid_data)
        with self.assertRaises(ValidationError) as context:
            template.clean()

        self.assertIn("data_json", context.exception.message_dict)

    def test_aplicar_a_organizacion_matching_sector(self):
        """Test applying template to organization with matching sector."""
        template = SectorTemplate.objects.create(**self.valid_template_data)

        resultado = template.aplicar_a_organizacion(self.organization, self.user)

        self.assertTrue(resultado["success"])
        self.assertEqual(resultado["template_aplicado"], "Template Básico Salud")
        self.assertEqual(resultado["version"], "1.0")
        self.assertIn("procesos", resultado["elementos_creados"])
        self.assertIn("indicadores", resultado["elementos_creados"])
        self.assertIn("documentos", resultado["elementos_creados"])

        # Check template statistics were updated
        template.refresh_from_db()
        self.assertEqual(template.aplicaciones_exitosas, 1)
        self.assertIsNotNone(template.fecha_ultima_aplicacion)

    def test_aplicar_a_organizacion_mismatched_sector(self):
        """Test applying template to organization with different sector."""
        # Create template for technology sector
        tech_data = self.valid_template_data.copy()
        tech_data["sector"] = "tecnologia"
        template = SectorTemplate.objects.create(**tech_data)

        # Try to apply to health organization
        with self.assertRaises(ValidationError):
            template.aplicar_a_organizacion(self.organization, self.user)

    def test_obtener_templates_por_sector(self):
        """Test getting templates by sector."""
        # Create templates for different sectors
        salud_template = SectorTemplate.objects.create(**self.valid_template_data)

        tech_data = self.valid_template_data.copy()
        tech_data["sector"] = "tecnologia"
        tech_data["nombre_template"] = "Template Tech"
        tech_template = SectorTemplate.objects.create(**tech_data)

        # Get templates for health sector
        salud_templates = SectorTemplate.obtener_templates_por_sector("salud")
        self.assertIn(salud_template, salud_templates)
        self.assertNotIn(tech_template, salud_templates)

        # Get templates for technology sector
        tech_templates = SectorTemplate.obtener_templates_por_sector("tecnologia")
        self.assertIn(tech_template, tech_templates)
        self.assertNotIn(salud_template, tech_templates)

    def test_crear_template_basico(self):
        """Test creating basic template with default configuration."""
        template = SectorTemplate.crear_template_basico(
            sector="educacion",
            nombre="Template Educación Básico",
            descripcion="Template básico para instituciones educativas",
            usuario=self.user,
        )

        self.assertEqual(template.sector, "educacion")
        self.assertEqual(template.nombre_template, "Template Educación Básico")
        self.assertEqual(template.version, "1.0")
        self.assertEqual(template.created_by, self.user)

        # Check default JSON structure
        self.assertIn("procesos", template.data_json)
        self.assertIn("indicadores", template.data_json)
        self.assertIn("documentos", template.data_json)

        # Validate the template
        try:
            template.clean()
        except ValidationError:
            self.fail("Basic template should have valid JSON structure")


class AuditLogModelTests(TestCase):
    """Test suite for AuditLog model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

        self.organization = Organization.objects.create(
            razon_social="Test Organization",
            nit="900123456",
            digito_verificacion="8",
            tipo_organizacion="empresa_privada",
            sector_economico="tecnologia",
            tamaño_empresa="mediana",
        )

    def test_log_change_create_action(self):
        """Test logging create action."""
        new_values = {
            "razon_social": "New Organization",
            "nit": "900123457",
            "digito_verificacion": "8",
        }

        audit_log = AuditLog.log_change(
            instance=self.organization,
            action=AuditLog.ACTION_CREATE,
            user=self.user,
            new_values=new_values,
            reason="Testing create log",
        )

        self.assertEqual(audit_log.table_name, "organization_organization")
        self.assertEqual(audit_log.record_id, str(self.organization.pk))
        self.assertEqual(audit_log.action, AuditLog.ACTION_CREATE)
        self.assertEqual(audit_log.new_values, new_values)
        self.assertEqual(audit_log.created_by, self.user)
        self.assertEqual(audit_log.reason, "Testing create log")

    def test_log_change_update_action(self):
        """Test logging update action."""
        old_values = {"razon_social": "Old Name"}
        new_values = {"razon_social": "New Name"}
        changed_fields = ["razon_social"]

        audit_log = AuditLog.log_change(
            instance=self.organization,
            action=AuditLog.ACTION_UPDATE,
            user=self.user,
            old_values=old_values,
            new_values=new_values,
            changed_fields=changed_fields,
        )

        self.assertEqual(audit_log.action, AuditLog.ACTION_UPDATE)
        self.assertEqual(audit_log.old_values, old_values)
        self.assertEqual(audit_log.new_values, new_values)
        self.assertEqual(audit_log.changed_fields, changed_fields)

    def test_get_record_history(self):
        """Test getting audit history for a record."""
        # Check initial count (may include creation audit)
        initial_count = AuditLog.get_record_history(self.organization).count()

        # Create multiple audit logs
        for i in range(5):
            AuditLog.log_change(
                instance=self.organization,
                action=AuditLog.ACTION_UPDATE,
                user=self.user,
                reason=f"Update {i}",
            )

        # Get all history
        history = AuditLog.get_record_history(self.organization)
        self.assertEqual(history.count(), initial_count + 5)

        # Get limited history
        limited_history = AuditLog.get_record_history(self.organization, limit=3)
        self.assertEqual(limited_history.count(), 3)

        # Check ordering (newest first)
        timestamps = [log.created_at for log in history]
        self.assertEqual(timestamps, sorted(timestamps, reverse=True))

    def test_can_rollback_validation(self):
        """Test rollback validation."""
        # Create an audit log
        audit_log = AuditLog.log_change(
            instance=self.organization,
            action=AuditLog.ACTION_UPDATE,
            user=self.user,
            old_values={"razon_social": "Old Name"},
            new_values={"razon_social": "New Name"},
        )

        # Test can rollback
        can_rollback, reason = AuditLog.can_rollback(self.organization, audit_log.id)
        self.assertTrue(can_rollback)

        # Create a DELETE log
        delete_log = AuditLog.log_change(
            instance=self.organization, action=AuditLog.ACTION_DELETE, user=self.user
        )

        # Now rollback should not be possible
        can_rollback, reason = AuditLog.can_rollback(self.organization, audit_log.id)
        self.assertFalse(can_rollback)
        self.assertIn("eliminado", reason)

    def test_perform_rollback(self):
        """Test performing rollback operation."""
        # Store original values
        original_razon_social = self.organization.razon_social

        # Create audit log with old values
        audit_log = AuditLog.log_change(
            instance=self.organization,
            action=AuditLog.ACTION_UPDATE,
            user=self.user,
            old_values={"razon_social": original_razon_social},
            new_values={"razon_social": "Changed Name"},
        )

        # Change the organization
        self.organization.razon_social = "Changed Name"
        self.organization.save()

        # Perform rollback
        success, message, instance = audit_log.perform_rollback(
            user=self.user, reason="Testing rollback"
        )

        self.assertTrue(success)
        self.assertIsNotNone(instance)

        # Check that value was rolled back
        instance.refresh_from_db()
        self.assertEqual(instance.razon_social, original_razon_social)

        # Check that rollback audit log was created
        rollback_logs = AuditLog.objects.filter(
            action=AuditLog.ACTION_ROLLBACK,
            table_name="organization_organization",
            record_id=str(self.organization.pk),
        )
        self.assertTrue(rollback_logs.exists())

    def test_audit_log_str_representation(self):
        """Test audit log string representation."""
        audit_log = AuditLog.log_change(
            instance=self.organization, action=AuditLog.ACTION_CREATE, user=self.user
        )

        expected_start = "Crear - organization_organization:"
        self.assertTrue(str(audit_log).startswith(expected_start))


@pytest.mark.django_db
class OrganizationModelPytestTests:
    """Additional pytest-style tests for Organization model."""

    def test_nit_verification_digit_edge_cases(self):
        """Test NIT verification digit calculation edge cases."""
        # Test edge cases that might cause division issues
        edge_cases = [
            ("0", 0),
            ("1", 8),
            ("11", 1),
            ("111111111", 3),
        ]

        for nit, expected_dv in edge_cases:
            calculated_dv = Organization.calcular_digito_verificacion(nit)
            assert calculated_dv == expected_dv, f"NIT {nit} failed verification"

    def test_organization_model_indexes(self):
        """Test that database indexes are properly created."""
        # This is more of an integration test to ensure indexes exist
        from django.db import connection

        indexes = connection.introspection.get_indexes(
            connection.cursor(), "organization_organization"
        )

        # Check that NIT index exists
        nit_indexed = any("nit" in idx_info["columns"] for idx_info in indexes.values())
        assert nit_indexed, "NIT field should be indexed"

    def test_concurrent_location_creation(self):
        """Test concurrent creation of main locations (race condition)."""
        from django.db import transaction
        import threading

        # Create organization
        org = Organization.objects.create(
            razon_social="Test Concurrent Org",
            nit="900999999",
            digito_verificacion="9",
            tipo_organizacion="empresa_privada",
            sector_economico="tecnologia",
            tamaño_empresa="mediana",
        )

        errors = []

        def create_main_location(name):
            try:
                with transaction.atomic():
                    Location.objects.create(
                        organization=org,
                        nombre=name,
                        tipo_sede="principal",
                        es_principal=True,
                        direccion="Test Address",
                        ciudad="Test City",
                        departamento="Test Department",
                    )
            except Exception as e:
                errors.append(e)

        # Create two threads trying to create main locations simultaneously
        thread1 = threading.Thread(target=create_main_location, args=("Main 1",))
        thread2 = threading.Thread(target=create_main_location, args=("Main 2",))

        thread1.start()
        thread2.start()

        thread1.join()
        thread2.join()

        # Only one should succeed, one should fail
        main_locations = Location.objects.filter(organization=org, es_principal=True)
        assert main_locations.count() == 1, "Only one main location should exist"
        assert len(errors) == 1, "One creation should fail"
        assert isinstance(errors[0], IntegrityError), "Should fail with IntegrityError"
