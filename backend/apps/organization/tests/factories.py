"""
Factory classes for generating test data for organization models.

Provides realistic test data that reflects Colombian healthcare scenarios
and supports comprehensive testing of all organization types.
"""

import factory
import random
from factory import fuzzy
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta

from apps.organization.models import (
    Organization, HealthOrganization, HeadquarterLocation, 
    EnabledHealthService, ServiceHabilitationProcess
)

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for creating test users."""
    
    class Meta:
        model = User
        django_get_or_create = ('username',)
    
    username = factory.Sequence(lambda n: f'testuser{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    first_name = factory.Faker('first_name', locale='es_ES')
    last_name = factory.Faker('last_name', locale='es_ES')
    is_active = True


class OrganizationFactory(factory.django.DjangoModelFactory):
    """Factory for creating test organizations."""
    
    class Meta:
        model = Organization
    
    razon_social = factory.Faker('company', locale='es_ES')
    nombre_comercial = factory.LazyAttribute(lambda obj: f"{obj.razon_social} S.A.S.")
    nit = factory.Sequence(lambda n: f'{900000000 + n}')
    digito_verificacion = factory.LazyFunction(lambda: str(random.randint(0, 9)))
    
    # Contact information
    email_contacto = factory.Faker('company_email', locale='es_ES')
    telefono_principal = factory.Faker('phone_number', locale='es_CO')
    website = factory.Faker('url')
    
    # Classification
    sector_economico = fuzzy.FuzzyChoice([
        'salud', 'educacion', 'manufactura', 'servicios',
        'tecnologia', 'financiero', 'comercio'
    ])
    tipo_organizacion = fuzzy.FuzzyChoice([
        'empresa_privada', 'empresa_publica', 'mixta',
        'fundacion', 'ong', 'cooperativa'
    ])
    tamaño_empresa = fuzzy.FuzzyChoice([
        'microempresa', 'pequeña', 'mediana', 'grande'
    ])
    
    # Additional info
    descripcion = factory.Faker('text', max_nb_chars=500, locale='es_ES')
    fecha_fundacion = factory.Faker(
        'date_between',
        start_date=date(1950, 1, 1),
        end_date=date.today() - timedelta(days=365)
    )
    
    # Audit fields
    created_by = factory.SubFactory(UserFactory)
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)


class HealthOrganizationFactory(OrganizationFactory):
    """Factory for creating health sector organizations with health profiles."""
    
    # Override to ensure health sector
    sector_economico = 'salud'
    tipo_organizacion = fuzzy.FuzzyChoice(['ips', 'eps', 'hospital', 'clinica'])
    
    # Add health-specific naming
    razon_social = factory.Faker('company', locale='es_ES')
    
    @factory.lazy_attribute
    def razon_social(self):
        """Generate health-specific organization names."""
        health_prefixes = [
            'Hospital', 'Clínica', 'IPS', 'Centro Médico',
            'Fundación Hospitalaria', 'ESE Hospital'
        ]
        from faker import Faker
        fake = Faker('es_ES')
        return f"{random.choice(health_prefixes)} {fake.last_name()}"


class IPSFactory(HealthOrganizationFactory):
    """Factory for IPS organizations."""
    
    tipo_organizacion = 'ips'
    
    @factory.lazy_attribute
    def razon_social(self):
        from faker import Faker
        fake = Faker('es_ES')
        return f"IPS {fake.last_name()}"


class EPSFactory(HealthOrganizationFactory):
    """Factory for EPS organizations."""
    
    tipo_organizacion = 'eps'
    
    @factory.lazy_attribute
    def razon_social(self):
        from faker import Faker
        fake = Faker('es_ES')
        return f"EPS {fake.company()}"


class HospitalFactory(HealthOrganizationFactory):
    """Factory for hospital organizations."""
    
    tipo_organizacion = 'hospital'
    tamaño_empresa = fuzzy.FuzzyChoice(['mediana', 'grande'])
    
    @factory.lazy_attribute
    def razon_social(self):
        saints = [
            'San Rafael', 'San José', 'Santa Clara', 'San Juan de Dios',
            'Sagrado Corazón', 'La Victoria', 'San Vicente'
        ]
        return f"Hospital {random.choice(saints)}"


class ClinicaFactory(HealthOrganizationFactory):
    """Factory for clinic organizations."""
    
    tipo_organizacion = 'clinica'
    tamaño_empresa = fuzzy.FuzzyChoice(['pequeña', 'mediana'])
    
    @factory.lazy_attribute
    def razon_social(self):
        specialties = [
            'Oftalmológica', 'Cardiovascular', 'Neurológica',
            'Dental', 'Dermatológica', 'Pediátrica'
        ]
        from faker import Faker
        fake = Faker('es_ES')
        return f"Clínica {random.choice(specialties)} {fake.last_name()}"


class HealthOrganizationProfileFactory(factory.django.DjangoModelFactory):
    """Factory for HealthOrganization profiles."""
    
    class Meta:
        model = HealthOrganization
    
    organization = factory.SubFactory(HealthOrganizationFactory)
    
    # REPS information
    codigo_prestador = factory.Sequence(lambda n: f'{str(n).zfill(12)}')
    verificado_reps = False
    
    # Classification
    naturaleza_juridica = fuzzy.FuzzyChoice(['privada', 'publica', 'mixta'])
    tipo_prestador = fuzzy.FuzzyChoice([
        'IPS', 'HOSPITAL', 'CLINICA', 'CENTRO_MEDICO',
        'LABORATORIO', 'CENTRO_DIAGNOSTICO'
    ])
    nivel_complejidad = fuzzy.FuzzyChoice(['I', 'II', 'III', 'IV'])
    
    # Legal representative
    representante_tipo_documento = fuzzy.FuzzyChoice(['CC', 'CE', 'PA'])
    representante_numero_documento = factory.Faker('random_number', digits=8)
    representante_nombre_completo = factory.Faker('name', locale='es_ES')
    representante_telefono = factory.Faker('phone_number', locale='es_CO')
    representante_email = factory.Faker('email', locale='es_ES')
    
    # Dates
    fecha_habilitacion = factory.Faker(
        'date_between',
        start_date=date(2010, 1, 1),
        end_date=date.today()
    )
    
    # Additional info
    observaciones_salud = factory.Faker('text', max_nb_chars=200, locale='es_ES')
    servicios_habilitados_count = fuzzy.FuzzyInteger(1, 50)
    
    # Audit fields
    created_by = factory.SubFactory(UserFactory)


class IPSProfileFactory(HealthOrganizationProfileFactory):
    """Factory for IPS health profiles."""
    
    organization = factory.SubFactory(IPSFactory)
    tipo_prestador = 'IPS'
    nivel_complejidad = fuzzy.FuzzyChoice(['I', 'II', 'III'])
    naturaleza_juridica = fuzzy.FuzzyChoice(['privada', 'mixta'])


class EPSProfileFactory(HealthOrganizationProfileFactory):
    """Factory for EPS health profiles."""
    
    organization = factory.SubFactory(EPSFactory)
    tipo_prestador = 'EPS'
    nivel_complejidad = 'I'  # EPS typically don't have high complexity
    naturaleza_juridica = fuzzy.FuzzyChoice(['privada', 'mixta'])


class HospitalProfileFactory(HealthOrganizationProfileFactory):
    """Factory for hospital health profiles."""
    
    organization = factory.SubFactory(HospitalFactory)
    tipo_prestador = 'HOSPITAL'
    nivel_complejidad = fuzzy.FuzzyChoice(['II', 'III', 'IV'])
    naturaleza_juridica = fuzzy.FuzzyChoice(['publica', 'privada', 'mixta'])


class ClinicaProfileFactory(HealthOrganizationProfileFactory):
    """Factory for clinic health profiles."""
    
    organization = factory.SubFactory(ClinicaFactory)
    tipo_prestador = 'CLINICA'
    nivel_complejidad = fuzzy.FuzzyChoice(['I', 'II', 'III'])
    naturaleza_juridica = 'privada'


# Specialized factories for different Colombian regions
class BogotaHealthOrganizationFactory(HealthOrganizationProfileFactory):
    """Factory for Bogotá health organizations."""
    
    @factory.lazy_attribute
    def representante_telefono(self):
        return f"+57 1 {random.randint(200, 799)} {random.randint(1000, 9999)}"
    
    @factory.post_generation
    def bogota_specific(self, create, extracted, **kwargs):
        """Add Bogotá-specific configuration."""
        if create:
            # Bogotá organizations tend to be larger
            if self.organization.tamaño_empresa == 'microempresa':
                self.organization.tamaño_empresa = 'pequeña'
                self.organization.save()


class MedellinHealthOrganizationFactory(HealthOrganizationProfileFactory):
    """Factory for Medellín health organizations."""
    
    @factory.lazy_attribute
    def representante_telefono(self):
        return f"+57 4 {random.randint(200, 799)} {random.randint(1000, 9999)}"


class CaliHealthOrganizationFactory(HealthOrganizationProfileFactory):
    """Factory for Cali health organizations."""
    
    @factory.lazy_attribute
    def representante_telefono(self):
        return f"+57 2 {random.randint(300, 699)} {random.randint(1000, 9999)}"


# Manufacturing sector factories
class ManufacturingOrganizationFactory(OrganizationFactory):
    """Factory for manufacturing sector organizations."""
    
    sector_economico = 'manufactura'
    tipo_organizacion = fuzzy.FuzzyChoice([
        'empresa_privada', 'empresa_publica', 'cooperativa'
    ])
    
    @factory.lazy_attribute
    def razon_social(self):
        manufacturing_types = [
            'Industrias', 'Manufacturas', 'Fábrica', 'Textiles',
            'Alimentos', 'Farmacéutica', 'Automotriz'
        ]
        return f"{random.choice(manufacturing_types)} {factory.Faker('company', locale='es_ES').generate()}"


class FoodManufacturingFactory(ManufacturingOrganizationFactory):
    """Factory for food manufacturing organizations."""
    
    @factory.lazy_attribute
    def razon_social(self):
        return f"Alimentos {factory.Faker('company', locale='es_ES').generate()}"
    
    @factory.lazy_attribute
    def descripcion(self):
        return "Empresa dedicada a la producción y procesamiento de alimentos para consumo humano."


class PharmaManufacturingFactory(ManufacturingOrganizationFactory):
    """Factory for pharmaceutical manufacturing organizations."""
    
    @factory.lazy_attribute
    def razon_social(self):
        return f"Laboratorios {factory.Faker('company', locale='es_ES').generate()}"
    
    @factory.lazy_attribute
    def descripcion(self):
        return "Empresa farmacéutica dedicada a la investigación, desarrollo y producción de medicamentos."


# Services sector factories
class ServicesOrganizationFactory(OrganizationFactory):
    """Factory for services sector organizations."""
    
    sector_economico = 'servicios'
    tipo_organizacion = fuzzy.FuzzyChoice([
        'empresa_privada', 'fundacion', 'ong', 'cooperativa'
    ])
    
    @factory.lazy_attribute
    def razon_social(self):
        service_types = [
            'Consultoría', 'Servicios', 'Soluciones', 'Grupo',
            'Corporación', 'Asociados'
        ]
        return f"{random.choice(service_types)} {factory.Faker('company', locale='es_ES').generate()}"


class ITServicesFactory(ServicesOrganizationFactory):
    """Factory for IT services organizations."""
    
    @factory.lazy_attribute
    def razon_social(self):
        return f"Tecnologías {factory.Faker('company', locale='es_ES').generate()}"
    
    @factory.lazy_attribute
    def descripcion(self):
        return "Empresa de tecnología especializada en desarrollo de software y consultoría IT."


class ConsultingServicesFactory(ServicesOrganizationFactory):
    """Factory for consulting services organizations."""
    
    @factory.lazy_attribute
    def razon_social(self):
        return f"Consultoría {factory.Faker('company', locale='es_ES').generate()}"
    
    @factory.lazy_attribute
    def descripcion(self):
        return "Empresa de consultoría especializada en gestión empresarial y optimización de procesos."


# Education sector factories
class EducationOrganizationFactory(OrganizationFactory):
    """Factory for education sector organizations."""
    
    sector_economico = 'educacion'
    tipo_organizacion = fuzzy.FuzzyChoice([
        'universidad', 'institucion_educativa', 'fundacion'
    ])
    
    @factory.lazy_attribute
    def razon_social(self):
        education_types = [
            'Universidad', 'Instituto', 'Colegio', 'Fundación Educativa',
            'Centro de Estudios', 'Academia'
        ]
        return f"{random.choice(education_types)} {factory.Faker('last_name', locale='es_ES').generate()}"


class UniversityFactory(EducationOrganizationFactory):
    """Factory for university organizations."""
    
    tipo_organizacion = 'universidad'
    tamaño_empresa = fuzzy.FuzzyChoice(['mediana', 'grande'])
    
    @factory.lazy_attribute
    def razon_social(self):
        university_types = [
            'Universidad', 'Universidad Nacional', 'Universidad Católica',
            'Universidad Pontificia', 'Fundación Universitaria'
        ]
        return f"{random.choice(university_types)} {factory.Faker('last_name', locale='es_ES').generate()}"


class SchoolFactory(EducationOrganizationFactory):
    """Factory for school organizations."""
    
    tipo_organizacion = 'institucion_educativa'
    tamaño_empresa = fuzzy.FuzzyChoice(['pequeña', 'mediana'])
    
    @factory.lazy_attribute
    def razon_social(self):
        return f"Colegio {factory.Faker('last_name', locale='es_ES').generate()}"


# Utility functions for creating test scenarios
def create_health_organization_with_profile(**kwargs):
    """Create a complete health organization with profile."""
    health_org = HealthOrganizationFactory.create(**kwargs)
    profile = HealthOrganizationProfileFactory.create(
        organization=health_org,
        **kwargs.get('profile_kwargs', {})
    )
    return health_org, profile


def create_wizard_test_data():
    """Create realistic test data for wizard testing."""
    return {
        'razon_social': 'Hospital San Rafael de Bogotá',
        'nit': '860123456',
        'digito_verificacion': '7',
        'email_contacto': 'info@hospitalsan rafael.com',
        'telefono_principal': '+57 1 456 7890',
        'website': 'https://www.hospitalsanrafael.com',
        'descripcion': 'Hospital universitario de alta complejidad especializado en servicios médicos y quirúrgicos.',
        'tamaño_empresa': 'grande',
        'fecha_fundacion': '1985-03-15',
        'selectedSector': 'HEALTHCARE',
        'selectedOrgType': 'hospital'
    }


def create_batch_organizations(count=10, sector=None):
    """Create a batch of organizations for testing."""
    if sector == 'health':
        return HealthOrganizationFactory.create_batch(count)
    elif sector == 'manufacturing':
        return ManufacturingOrganizationFactory.create_batch(count)
    elif sector == 'services':
        return ServicesOrganizationFactory.create_batch(count)
    elif sector == 'education':
        return EducationOrganizationFactory.create_batch(count)
    else:
        return OrganizationFactory.create_batch(count)


def create_health_organizations_by_type():
    """Create one of each health organization type."""
    return {
        'ips': IPSFactory.create(),
        'eps': EPSFactory.create(),
        'hospital': HospitalFactory.create(),
        'clinica': ClinicaFactory.create()
    }


def create_colombian_health_network():
    """Create a realistic Colombian health network."""
    # Create main hospital
    main_hospital = HospitalFactory.create(
        razon_social="Hospital Universitario San Ignacio",
        nit="860123456",
        tamaño_empresa="grande"
    )
    main_profile = HospitalProfileFactory.create(
        organization=main_hospital,
        nivel_complejidad="IV",
        naturaleza_juridica="privada"
    )
    
    # Create affiliated IPS
    affiliated_ips = []
    for i in range(3):
        ips = IPSFactory.create(
            razon_social=f"IPS Especializada {i+1}",
            nit=f"90012345{i}",
            tamaño_empresa="mediana"
        )
        profile = IPSProfileFactory.create(
            organization=ips,
            nivel_complejidad=random.choice(['II', 'III'])
        )
        affiliated_ips.append((ips, profile))
    
    # Create clinics
    clinics = []
    for i in range(2):
        clinic = ClinicaFactory.create(
            razon_social=f"Clínica Especializada {i+1}",
            nit=f"80012345{i}",
            tamaño_empresa="pequeña"
        )
        profile = ClinicaProfileFactory.create(
            organization=clinic,
            nivel_complejidad=random.choice(['I', 'II'])
        )
        clinics.append((clinic, profile))
    
    return {
        'main_hospital': (main_hospital, main_profile),
        'affiliated_ips': affiliated_ips,
        'clinics': clinics
    }


# ============================================================================
# SOGCS SEDES FACTORIES - Healthcare Facility Management
# ============================================================================

class HeadquarterLocationFactory(factory.django.DjangoModelFactory):
    """Factory for creating healthcare facility headquarters (SEDES)."""
    
    class Meta:
        model = HeadquarterLocation
    
    # Link to health organization
    organization = factory.SubFactory(HealthOrganizationProfileFactory)
    
    # REPS identification
    reps_code = factory.Sequence(lambda n: f'{str(n).zfill(8)}')
    name = factory.Faker('company', locale='es_ES')
    sede_type = fuzzy.FuzzyChoice(['principal', 'satelite', 'movil', 'domiciliaria', 'telemedicina'])
    
    # Geographic location (Colombian departments and municipalities)
    department_code = fuzzy.FuzzyChoice(['05', '08', '11', '13', '15', '17', '19', '20', '23', '25', '27'])
    municipality_code = factory.LazyAttribute(
        lambda obj: f"{obj.department_code}{str(random.randint(1, 999)).zfill(3)}"
    )
    
    @factory.lazy_attribute
    def department_name(self):
        dept_mapping = {
            '05': 'Antioquia', '08': 'Atlántico', '11': 'Bogotá D.C.',
            '13': 'Bolívar', '15': 'Boyacá', '17': 'Caldas',
            '19': 'Cauca', '20': 'Cesar', '23': 'Córdoba',
            '25': 'Cundinamarca', '27': 'Chocó'
        }
        return dept_mapping.get(self.department_code, 'Departamento Test')
    
    @factory.lazy_attribute
    def municipality_name(self):
        return factory.Faker('city', locale='es_ES').generate()
    
    # Address and location
    address = factory.Faker('address', locale='es_ES')
    postal_code = factory.Faker('postcode', locale='es_CO')
    latitude = fuzzy.FuzzyDecimal(-4.0, 12.0, 7)  # Colombian latitude range
    longitude = fuzzy.FuzzyDecimal(-79.0, -66.0, 7)  # Colombian longitude range
    
    # Contact information
    phone_primary = factory.LazyAttribute(
        lambda obj: f"+57 {random.choice([1, 2, 4, 5])} {random.randint(200, 799)} {random.randint(1000, 9999)}"
    )
    phone_secondary = factory.LazyAttribute(
        lambda obj: f"+57 {random.choice([1, 2, 4, 5])} {random.randint(200, 799)} {random.randint(1000, 9999)}"
    )
    email = factory.Faker('email', locale='es_ES')
    
    # Administrative contact
    administrative_contact = factory.Faker('name', locale='es_ES')
    administrative_contact_phone = factory.LazyAttribute(lambda obj: obj.phone_primary)
    administrative_contact_email = factory.Faker('email', locale='es_ES')
    
    # Habilitation status
    habilitation_status = fuzzy.FuzzyChoice(['habilitada', 'en_proceso', 'suspendida'])
    habilitation_date = factory.Faker(
        'date_between', 
        start_date=date(2010, 1, 1), 
        end_date=date.today()
    )
    habilitation_resolution = factory.Sequence(lambda n: f'Res-{n:06d}-2023')
    next_renewal_date = factory.LazyAttribute(
        lambda obj: obj.habilitation_date + timedelta(days=random.randint(1095, 1825)) if obj.habilitation_date else None
    )
    
    # Operational status
    operational_status = fuzzy.FuzzyChoice(['activa', 'inactiva', 'temporal_cerrada'])
    opening_date = factory.Faker(
        'date_between', 
        start_date=date(2000, 1, 1), 
        end_date=date.today()
    )
    
    # Capacity data
    total_beds = fuzzy.FuzzyInteger(0, 500)
    icu_beds = factory.LazyAttribute(lambda obj: random.randint(0, obj.total_beds // 10))
    emergency_beds = factory.LazyAttribute(lambda obj: random.randint(0, obj.total_beds // 5))
    surgery_rooms = fuzzy.FuzzyInteger(0, 20)
    consultation_rooms = fuzzy.FuzzyInteger(1, 50)
    
    # REPS sync status
    sync_status = fuzzy.FuzzyChoice(['pending', 'success', 'failed'])
    sync_errors = factory.LazyFunction(lambda: [])
    reps_data = factory.LazyFunction(dict)
    
    # Additional fields
    is_main_headquarters = False
    working_hours = factory.LazyFunction(
        lambda: {
            'monday': {'start': '07:00', 'end': '18:00'},
            'tuesday': {'start': '07:00', 'end': '18:00'},
            'wednesday': {'start': '07:00', 'end': '18:00'},
            'thursday': {'start': '07:00', 'end': '18:00'},
            'friday': {'start': '07:00', 'end': '18:00'},
            'saturday': {'start': '08:00', 'end': '14:00'},
            'sunday': {'start': '', 'end': ''}
        }
    )
    has_emergency_service = fuzzy.FuzzyChoice([True, False])
    observations = factory.Faker('text', max_nb_chars=200, locale='es_ES')
    
    # Audit fields
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.SubFactory(UserFactory)


class MainHeadquarterLocationFactory(HeadquarterLocationFactory):
    """Factory for main headquarters."""
    
    sede_type = 'principal'
    is_main_headquarters = True
    operational_status = 'activa'
    habilitation_status = 'habilitada'
    has_emergency_service = True
    total_beds = fuzzy.FuzzyInteger(100, 500)


class SatelliteHeadquarterLocationFactory(HeadquarterLocationFactory):
    """Factory for satellite headquarters."""
    
    sede_type = 'satelite'
    is_main_headquarters = False
    total_beds = fuzzy.FuzzyInteger(20, 100)


class MobileUnitFactory(HeadquarterLocationFactory):
    """Factory for mobile healthcare units."""
    
    sede_type = 'movil'
    is_main_headquarters = False
    total_beds = 0
    icu_beds = 0
    surgery_rooms = 0
    consultation_rooms = fuzzy.FuzzyInteger(1, 3)


class EnabledHealthServiceFactory(factory.django.DjangoModelFactory):
    """Factory for enabled health services at headquarters."""
    
    class Meta:
        model = EnabledHealthService
    
    # Link to headquarters
    headquarters = factory.SubFactory(HeadquarterLocationFactory)
    
    # Service identification
    service_code = factory.Sequence(lambda n: f'{str(n).zfill(3)}')
    cups_code = factory.Sequence(lambda n: f'{str(n).zfill(6)}')
    service_name = factory.Faker('word', locale='es_ES')
    service_group = fuzzy.FuzzyChoice([
        'consulta_externa', 'apoyo_diagnostico', 'internacion',
        'quirurgicos', 'urgencias', 'transporte_asistencial'
    ])
    complexity_level = fuzzy.FuzzyChoice([1, 2, 3, 4])
    
    # Service modalities
    intramural = True
    extramural = False
    domiciliary = False
    telemedicine = False
    reference_center = False
    
    # Habilitation data
    habilitation_status = fuzzy.FuzzyChoice(['activo', 'suspendido', 'en_renovacion'])
    habilitation_date = factory.Faker(
        'date_between',
        start_date=date(2015, 1, 1),
        end_date=date.today()
    )
    habilitation_expiry = factory.LazyAttribute(
        lambda obj: obj.habilitation_date + timedelta(days=random.randint(1095, 1825))
    )
    habilitation_act = factory.Sequence(lambda n: f'Acto-{n:06d}')
    distinctive_code = factory.Sequence(lambda n: f'DC{str(n).zfill(8)}')
    
    # Capacity data
    installed_capacity = factory.LazyFunction(
        lambda: {
            'beds': random.randint(5, 50),
            'equipment': random.randint(1, 10),
            'professionals': random.randint(2, 20)
        }
    )
    operational_capacity = factory.LazyAttribute(
        lambda obj: {k: int(v * 0.8) for k, v in obj.installed_capacity.items()}
    )
    monthly_production = fuzzy.FuzzyInteger(50, 1000)
    
    # Human resources
    required_professionals = factory.LazyFunction(
        lambda: {
            'medicos_generales': random.randint(1, 5),
            'medicos_especialistas': random.randint(0, 3),
            'enfermeras': random.randint(1, 8),
            'auxiliares_enfermeria': random.randint(2, 10)
        }
    )
    current_professionals = factory.LazyAttribute(
        lambda obj: {k: random.randint(1, v) for k, v in obj.required_professionals.items()}
    )
    
    # Compliance metrics (Resolution 3100/2019)
    infrastructure_compliance = fuzzy.FuzzyDecimal(70.0, 100.0, 2)
    equipment_compliance = fuzzy.FuzzyDecimal(75.0, 100.0, 2)
    medication_compliance = fuzzy.FuzzyDecimal(80.0, 100.0, 2)
    
    # Standards compliance
    specific_standards = factory.LazyFunction(
        lambda: {
            'bioseguridad': random.choice([True, False]),
            'gestion_calidad': random.choice([True, False]),
            'gestion_riesgo': random.choice([True, False]),
            'historia_clinica': random.choice([True, False])
        }
    )
    
    # Quality control
    last_self_evaluation = factory.Faker('date_this_year')
    self_evaluation_score = fuzzy.FuzzyDecimal(75.0, 95.0, 2)
    external_audit_score = fuzzy.FuzzyDecimal(70.0, 90.0, 2)
    
    # Quality indicators (Resolution 256/2016)
    quality_indicators = factory.LazyFunction(
        lambda: {
            'mortalidad_intrahospitalaria': round(random.uniform(0.5, 2.0), 2),
            'infecciones_asociadas': round(random.uniform(0.1, 1.0), 2),
            'reingreso_72_horas': round(random.uniform(0.5, 3.0), 2),
            'satisfaccion_pacientes': round(random.uniform(80.0, 95.0), 2)
        }
    )
    patient_safety_events = fuzzy.FuzzyInteger(0, 10)
    
    # Service configuration
    service_hours = factory.LazyFunction(
        lambda: {
            'monday': {'start': '06:00', 'end': '18:00'},
            'tuesday': {'start': '06:00', 'end': '18:00'},
            'wednesday': {'start': '06:00', 'end': '18:00'},
            'thursday': {'start': '06:00', 'end': '18:00'},
            'friday': {'start': '06:00', 'end': '18:00'},
            'saturday': {'start': '08:00', 'end': '14:00'},
        }
    )
    requires_authorization = fuzzy.FuzzyChoice([True, False])
    observations = factory.Faker('text', max_nb_chars=150, locale='es_ES')
    
    # Audit fields
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.SubFactory(UserFactory)


class HighComplexityServiceFactory(EnabledHealthServiceFactory):
    """Factory for high complexity services."""
    
    complexity_level = fuzzy.FuzzyChoice([3, 4])
    service_group = fuzzy.FuzzyChoice(['quirurgicos', 'urgencias'])
    infrastructure_compliance = fuzzy.FuzzyDecimal(85.0, 100.0, 2)
    equipment_compliance = fuzzy.FuzzyDecimal(90.0, 100.0, 2)
    medication_compliance = fuzzy.FuzzyDecimal(85.0, 100.0, 2)
    requires_authorization = True


class ConsultationServiceFactory(EnabledHealthServiceFactory):
    """Factory for consultation services."""
    
    complexity_level = fuzzy.FuzzyChoice([1, 2])
    service_group = 'consulta_externa'
    intramural = True
    telemedicine = fuzzy.FuzzyChoice([True, False])


class DiagnosticServiceFactory(EnabledHealthServiceFactory):
    """Factory for diagnostic support services."""
    
    complexity_level = fuzzy.FuzzyChoice([1, 2, 3])
    service_group = 'apoyo_diagnostico'
    reference_center = fuzzy.FuzzyChoice([True, False])


class ServiceHabilitationProcessFactory(factory.django.DjangoModelFactory):
    """Factory for service habilitation processes."""
    
    class Meta:
        model = ServiceHabilitationProcess
    
    # Process identification
    headquarters = factory.SubFactory(HeadquarterLocationFactory)
    service_code = factory.Sequence(lambda n: f'{str(n).zfill(3)}')
    service_name = factory.Faker('word', locale='es_ES')
    process_type = fuzzy.FuzzyChoice(['nueva', 'renovacion', 'modificacion', 'ampliacion'])
    
    # Process status
    current_status = fuzzy.FuzzyChoice([
        'iniciado', 'documentacion', 'autoevaluacion', 'radicado',
        'en_revision', 'visita_programada', 'concepto_emitido'
    ])
    current_phase = fuzzy.FuzzyChoice([
        'preparacion', 'autoevaluacion', 'radicacion', 
        'verificacion', 'resolucion'
    ])
    
    # Documentation
    required_documents = factory.LazyFunction(
        lambda: {
            'formulario_inscripcion': 'Formulario de inscripción',
            'certificado_existencia': 'Certificado de existencia y representación legal',
            'autoevaluacion': 'Documento de autoevaluación',
            'planos_infraestructura': 'Planos de infraestructura',
            'manual_bioseguridad': 'Manual de bioseguridad'
        }
    )
    submitted_documents = factory.LazyFunction(
        lambda: {
            'formulario_inscripcion': 'Formulario completado',
            'certificado_existencia': 'Certificado vigente'
        }
    )
    pending_documents = factory.LazyFunction(
        lambda: ['autoevaluacion', 'planos_infraestructura', 'manual_bioseguridad']
    )
    
    # Self-evaluation
    self_evaluation_date = factory.Faker('date_between', start_date=date(2023, 1, 1), end_date=date.today())
    self_evaluation_result = factory.LazyFunction(
        lambda: {
            'puntaje_total': random.randint(70, 95),
            'areas_evaluadas': ['infraestructura', 'dotacion', 'medicamentos', 'talento_humano'],
            'fortalezas': ['Personal calificado', 'Infraestructura adecuada'],
            'oportunidades_mejora': ['Actualización de equipos', 'Capacitación continua']
        }
    )
    self_evaluation_score = fuzzy.FuzzyDecimal(70.0, 95.0, 2)
    
    # Improvement plan
    improvement_plan = factory.LazyFunction(
        lambda: {
            'acciones': [
                {'accion': 'Actualizar equipos médicos', 'plazo': '90 días', 'responsable': 'Jefe Técnico'},
                {'accion': 'Capacitación en bioseguridad', 'plazo': '60 días', 'responsable': 'Coordinador de Calidad'}
            ],
            'recursos_requeridos': 'Personal, presupuesto para equipos',
            'indicadores': 'Cumplimiento de estándares de infraestructura y dotación'
        }
    )
    
    # Submission
    submission_date = factory.Faker('date_between', start_date=date(2023, 6, 1), end_date=date.today())
    submission_number = factory.Sequence(lambda n: f'RAD-2024-{str(n).zfill(6)}')
    health_secretary = fuzzy.FuzzyChoice([
        'Secretaría de Salud de Bogotá',
        'Secretaría de Salud de Antioquia',
        'Secretaría de Salud del Atlántico',
        'Secretaría de Salud de Valle del Cauca'
    ])
    
    # Verification visit
    verification_scheduled = factory.LazyAttribute(
        lambda obj: obj.submission_date + timedelta(days=random.randint(30, 90)) if obj.submission_date else None
    )
    verification_findings = factory.LazyFunction(
        lambda: [
            'Cumplimiento de estándares de infraestructura',
            'Documentación técnica completa',
            'Personal idóneo y capacitado'
        ]
    )
    
    # Process metadata
    assigned_inspector = factory.Faker('name', locale='es_ES')
    notes = factory.Faker('text', max_nb_chars=300, locale='es_ES')
    
    # Audit fields
    created_by = factory.SubFactory(UserFactory)
    updated_by = factory.SubFactory(UserFactory)


class NewHabilitationProcessFactory(ServiceHabilitationProcessFactory):
    """Factory for new habilitation processes."""
    
    process_type = 'nueva'
    current_status = fuzzy.FuzzyChoice(['iniciado', 'documentacion', 'autoevaluacion'])
    current_phase = fuzzy.FuzzyChoice(['preparacion', 'autoevaluacion'])


class RenewalProcessFactory(ServiceHabilitationProcessFactory):
    """Factory for renewal processes."""
    
    process_type = 'renovacion'
    current_status = fuzzy.FuzzyChoice(['radicado', 'en_revision', 'visita_programada'])
    current_phase = fuzzy.FuzzyChoice(['radicacion', 'verificacion'])


class CompletedProcessFactory(ServiceHabilitationProcessFactory):
    """Factory for completed processes."""
    
    current_status = fuzzy.FuzzyChoice(['aprobado', 'rechazado'])
    current_phase = 'seguimiento'
    resolution_date = factory.LazyAttribute(
        lambda obj: obj.submission_date + timedelta(days=random.randint(90, 180)) if obj.submission_date else None
    )
    resolution_number = factory.Sequence(lambda n: f'RES-2024-{str(n).zfill(4)}')
    resolution_result = fuzzy.FuzzyChoice(['aprobado', 'aprobado_condicionado', 'rechazado'])
    process_duration_days = factory.LazyAttribute(
        lambda obj: (obj.resolution_date - obj.submission_date).days if obj.resolution_date and obj.submission_date else None
    )


# ============================================================================
# SOGCS UTILITY FUNCTIONS
# ============================================================================

def create_complete_headquarters_with_services(service_count=5, **kwargs):
    """Create a headquarters with enabled services and processes."""
    headquarters = HeadquarterLocationFactory.create(**kwargs)
    
    # Create enabled services
    services = []
    for i in range(service_count):
        service = EnabledHealthServiceFactory.create(
            headquarters=headquarters,
            service_code=f'{str(100 + i).zfill(3)}'
        )
        services.append(service)
    
    # Create some habilitation processes
    processes = []
    for i in range(2):
        process = ServiceHabilitationProcessFactory.create(
            headquarters=headquarters,
            service_code=services[i].service_code if i < len(services) else f'{str(200 + i).zfill(3)}'
        )
        processes.append(process)
    
    return {
        'headquarters': headquarters,
        'services': services,
        'processes': processes
    }


def create_colombian_health_network_with_sedes():
    """Create a complete Colombian health network with SOGCS sedes."""
    # Create main hospital with headquarters
    main_hospital = HospitalProfileFactory.create(
        organization__razon_social="Hospital Universitario Nacional",
        nivel_complejidad="IV"
    )
    
    # Create main headquarters
    main_sede = MainHeadquarterLocationFactory.create(
        organization=main_hospital,
        name="Sede Principal - Hospital Nacional",
        department_code="11",
        department_name="Bogotá D.C.",
        municipality_code="11001",
        municipality_name="Bogotá",
        total_beds=300,
        icu_beds=30,
        surgery_rooms=12
    )
    
    # Create satellite headquarters
    satellite_sedes = []
    for i in range(2):
        satellite = SatelliteHeadquarterLocationFactory.create(
            organization=main_hospital,
            name=f"Sede Satelital {i+1}",
            department_code="11",
            department_name="Bogotá D.C.",
            total_beds=80
        )
        satellite_sedes.append(satellite)
    
    # Create services for main headquarters
    main_services = []
    service_codes = ['101', '201', '301', '401', '501']  # Different service types
    service_groups = ['consulta_externa', 'apoyo_diagnostico', 'internacion', 'quirurgicos', 'urgencias']
    
    for code, group in zip(service_codes, service_groups):
        service = EnabledHealthServiceFactory.create(
            headquarters=main_sede,
            service_code=code,
            service_group=group,
            complexity_level=4 if group in ['quirurgicos', 'urgencias'] else 2
        )
        main_services.append(service)
    
    # Create habilitation processes
    processes = []
    for i in range(3):
        process = ServiceHabilitationProcessFactory.create(
            headquarters=main_sede,
            service_code=main_services[i].service_code,
            service_name=main_services[i].service_name
        )
        processes.append(process)
    
    return {
        'health_organization': main_hospital,
        'main_headquarters': main_sede,
        'satellite_headquarters': satellite_sedes,
        'services': main_services,
        'processes': processes
    }


def create_reps_compliance_test_data():
    """Create test data that validates Colombian REPS compliance."""
    # Create headquarters with valid Colombian data
    bogota_headquarters = HeadquarterLocationFactory.create(
        reps_code='11001234',  # Valid format
        department_code='11',  # Bogotá
        department_name='Bogotá D.C.',
        municipality_code='11001',  # Bogotá municipality
        municipality_name='Bogotá',
        habilitation_status='habilitada',
        operational_status='activa'
    )
    
    # Create services with Resolution 3100/2019 compliance
    consultation_service = ConsultationServiceFactory.create(
        headquarters=bogota_headquarters,
        service_code='101',  # Medicina General
        service_name='Medicina General',
        complexity_level=1,
        infrastructure_compliance=95.0,
        equipment_compliance=90.0,
        medication_compliance=88.0
    )
    
    diagnostic_service = DiagnosticServiceFactory.create(
        headquarters=bogota_headquarters,
        service_code='201',  # Laboratorio Clínico
        service_name='Laboratorio Clínico',
        complexity_level=2,
        infrastructure_compliance=92.0,
        equipment_compliance=95.0,
        medication_compliance=85.0
    )
    
    # Create habilitation process
    renewal_process = RenewalProcessFactory.create(
        headquarters=bogota_headquarters,
        service_code='101',
        service_name='Medicina General',
        health_secretary='Secretaría de Salud de Bogotá'
    )
    
    return {
        'headquarters': bogota_headquarters,
        'services': [consultation_service, diagnostic_service],
        'process': renewal_process
    }