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

from apps.organization.models import Organization, HealthOrganization

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
        return f"{random.choice(health_prefixes)} {factory.Faker('last_name', locale='es_ES').generate()}"


class IPSFactory(HealthOrganizationFactory):
    """Factory for IPS organizations."""
    
    tipo_organizacion = 'ips'
    
    @factory.lazy_attribute
    def razon_social(self):
        return f"IPS {factory.Faker('last_name', locale='es_ES').generate()}"


class EPSFactory(HealthOrganizationFactory):
    """Factory for EPS organizations."""
    
    tipo_organizacion = 'eps'
    
    @factory.lazy_attribute
    def razon_social(self):
        return f"EPS {factory.Faker('company', locale='es_ES').generate()}"


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
        return f"Clínica {random.choice(specialties)} {factory.Faker('last_name', locale='es_ES').generate()}"


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