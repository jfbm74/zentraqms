# 🏥 Sector Extensions Reference Guide

## Overview

This document provides specific implementation patterns for sector extensions in ZentraQMS. Use this as a reference when the `qms-software-architect` agent needs to create new sector-specific functionality.

## 🏗️ Health Sector Extension (IMPLEMENTED)

### HealthOrganization Model

```python
class HealthOrganization(FullBaseModel):
    """Extension model for healthcare organizations (IPS, EPS, ESE, etc.)"""
    
    # OneToOne relationship with master Organization
    organization = models.OneToOneField(
        Organization, 
        on_delete=models.CASCADE,
        related_name='healthorganization'
    )
    
    # REPS Integration Fields
    codigo_prestador = models.CharField(
        max_length=20,
        blank=True,
        unique=True,
        null=True,
        help_text="Código único del prestador en REPS"
    )
    
    verificado_reps = models.BooleanField(
        default=False,
        help_text="Indica si los datos han sido verificados con REPS"
    )
    
    fecha_verificacion_reps = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Última fecha de verificación con REPS"
    )
    
    datos_reps = models.JSONField(
        default=dict,
        blank=True,
        help_text="Datos sincronizados desde REPS"
    )
    
    # Healthcare Classification
    naturaleza_juridica = models.CharField(
        max_length=20,
        choices=[
            ('privada', 'Privada'),
            ('publica', 'Pública'),
            ('mixta', 'Mixta'),
        ],
        default='privada'
    )
    
    tipo_prestador = models.CharField(
        max_length=30,
        choices=[
            ('IPS', 'Institución Prestadora de Servicios de Salud'),
            ('HOSPITAL', 'Hospital'),
            ('CLINICA', 'Clínica'),
            ('CENTRO_MEDICO', 'Centro Médico'),
            ('LABORATORIO', 'Laboratorio Clínico'),
            ('FARMACIA', 'Farmacia'),
        ],
        default='IPS'
    )
    
    nivel_complejidad = models.CharField(
        max_length=10,
        choices=[
            ('I', 'Nivel I - Baja Complejidad'),
            ('II', 'Nivel II - Mediana Complejidad'),
            ('III', 'Nivel III - Alta Complejidad'),
            ('IV', 'Nivel IV - Máxima Complejidad'),
        ],
        default='II'
    )
    
    # Legal Representative
    representante_tipo_documento = models.CharField(
        max_length=10,
        choices=[
            ('CC', 'Cédula de Ciudadanía'),
            ('CE', 'Cédula de Extranjería'),
            ('PA', 'Pasaporte'),
        ],
        blank=True
    )
    
    representante_numero_documento = models.CharField(
        max_length=20,
        blank=True
    )
    
    representante_nombre_completo = models.CharField(
        max_length=200,
        blank=True
    )
    
    representante_telefono = models.CharField(
        max_length=15,
        blank=True
    )
    
    representante_email = models.EmailField(
        blank=True
    )
    
    # Healthcare Specific Info
    fecha_habilitacion = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de habilitación inicial"
    )
    
    resolucion_habilitacion = models.CharField(
        max_length=50,
        blank=True,
        help_text="Número de resolución de habilitación"
    )
    
    registro_especial = models.CharField(
        max_length=100,
        blank=True,
        help_text="Registro especial si aplica"
    )
    
    observaciones_salud = models.TextField(
        blank=True,
        help_text="Observaciones específicas del sector salud"
    )
    
    class Meta:
        verbose_name = "Organización de Salud"
        verbose_name_plural = "Organizaciones de Salud"
        indexes = [
            models.Index(fields=['codigo_prestador']),
            models.Index(fields=['naturaleza_juridica']),
            models.Index(fields=['tipo_prestador']),
            models.Index(fields=['nivel_complejidad']),
            models.Index(fields=['verificado_reps']),
        ]
    
    # Properties for computed fields
    @property
    def codigo_prestador_formatted(self):
        """Return formatted REPS code."""
        if self.codigo_prestador:
            return f"REPS-{self.codigo_prestador}"
        return "Sin código REPS"
    
    @property
    def representante_documento_completo(self):
        """Return complete representative document."""
        if self.representante_tipo_documento and self.representante_numero_documento:
            return f"{self.representante_tipo_documento}-{self.representante_numero_documento}"
        return ""
    
    @property
    def servicios_habilitados_count(self):
        """Return count of enabled health services."""
        return self.healthservice_set.filter(estado='HABILITADO').count()
    
    @property
    def servicios_activos(self):
        """Return active services as formatted string."""
        services = self.healthservice_set.filter(estado='HABILITADO')[:5]
        names = [s.nombre_servicio for s in services]
        if self.healthservice_set.filter(estado='HABILITADO').count() > 5:
            names.append("...")
        return ", ".join(names) if names else "Sin servicios activos"

    def clean(self):
        """Validate model data."""
        super().clean()
        
        # Validate REPS code format if provided
        if self.codigo_prestador:
            if not self.codigo_prestador.isdigit() or len(self.codigo_prestador) != 12:
                raise ValidationError({
                    'codigo_prestador': 'El código REPS debe tener exactamente 12 dígitos'
                })
        
        # Validate representative document
        if self.representante_tipo_documento and not self.representante_numero_documento:
            raise ValidationError({
                'representante_numero_documento': 'Requerido cuando se especifica tipo de documento'
            })
```

### HealthService Model

```python
class HealthService(FullBaseModel):
    """Health services enabled for a healthcare organization."""
    
    health_organization = models.ForeignKey(
        HealthOrganization,
        on_delete=models.CASCADE,
        related_name='healthservice_set'
    )
    
    # Service Identification
    codigo_servicio = models.CharField(
        max_length=20,
        help_text="Código del servicio según REPS"
    )
    
    nombre_servicio = models.CharField(
        max_length=200,
        help_text="Nombre completo del servicio"
    )
    
    grupo_servicio = models.CharField(
        max_length=100,
        blank=True,
        help_text="Grupo al que pertenece el servicio"
    )
    
    descripcion_servicio = models.TextField(
        blank=True,
        help_text="Descripción detallada del servicio"
    )
    
    # Service Status and Dates
    estado = models.CharField(
        max_length=20,
        choices=[
            ('HABILITADO', 'Habilitado'),
            ('SUSPENDIDO', 'Suspendido'),
            ('CANCELADO', 'Cancelado'),
            ('EN_TRAMITE', 'En Trámite'),
        ],
        default='EN_TRAMITE'
    )
    
    fecha_habilitacion = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de habilitación del servicio"
    )
    
    fecha_vencimiento = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de vencimiento de la habilitación"
    )
    
    # Service Configuration
    modalidad = models.CharField(
        max_length=30,
        choices=[
            ('INTRAMURAL', 'Intramural'),
            ('EXTRAMURAL', 'Extramural'),
            ('TELEMEDICINA', 'Telemedicina'),
        ],
        default='INTRAMURAL'
    )
    
    capacidad_instalada = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Capacidad instalada para el servicio"
    )
    
    requiere_autorizacion = models.BooleanField(
        default=False,
        help_text="Indica si el servicio requiere autorización previa"
    )
    
    # Location and Schedule
    sede_prestacion = models.ForeignKey(
        'SedePrestadora',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Sede donde se presta el servicio"
    )
    
    dias_atencion = models.JSONField(
        default=list,
        help_text="Días de atención del servicio"
    )
    
    horario_atencion = models.CharField(
        max_length=100,
        blank=True,
        help_text="Horario de atención del servicio"
    )
    
    # Regulatory Information
    numero_resolucion = models.CharField(
        max_length=50,
        blank=True,
        help_text="Número de resolución de habilitación"
    )
    
    entidad_autorizante = models.CharField(
        max_length=100,
        blank=True,
        help_text="Entidad que otorgó la habilitación"
    )
    
    fecha_ultima_visita = models.DateField(
        null=True,
        blank=True,
        help_text="Fecha de la última visita de verificación"
    )
    
    observaciones = models.TextField(
        blank=True,
        help_text="Observaciones adicionales del servicio"
    )
    
    class Meta:
        verbose_name = "Servicio de Salud"
        verbose_name_plural = "Servicios de Salud"
        unique_together = ['health_organization', 'codigo_servicio']
        indexes = [
            models.Index(fields=['codigo_servicio']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha_habilitacion']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['modalidad']),
        ]
    
    # Properties for computed fields
    @property
    def esta_vigente(self):
        """Check if service is currently valid."""
        if not self.fecha_vencimiento:
            return True
        return timezone.now().date() <= self.fecha_vencimiento
    
    @property
    def dias_para_vencimiento(self):
        """Calculate days until expiration."""
        if not self.fecha_vencimiento:
            return None
        delta = self.fecha_vencimiento - timezone.now().date()
        return delta.days if delta.days >= 0 else 0
    
    def clean(self):
        """Validate model data."""
        super().clean()
        
        # Validate dates
        if self.fecha_habilitacion and self.fecha_vencimiento:
            if self.fecha_habilitacion > self.fecha_vencimiento:
                raise ValidationError({
                    'fecha_vencimiento': 'La fecha de vencimiento debe ser posterior a la habilitación'
                })
```

## 🏭 Manufacturing Sector Extension (TEMPLATE)

### ManufacturingOrganization Model Template

```python
class ManufacturingOrganization(FullBaseModel):
    """Extension model for manufacturing organizations."""
    
    # OneToOne relationship with master Organization
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='manufacturingorganization'
    )
    
    # Manufacturing Classification
    industry_type = models.CharField(
        max_length=50,
        choices=[
            ('alimentaria', 'Industria Alimentaria'),
            ('farmaceutica', 'Industria Farmacéutica'),
            ('textil', 'Industria Textil'),
            ('automotriz', 'Industria Automotriz'),
            ('quimica', 'Industria Química'),
            ('metalurgica', 'Industria Metalúrgica'),
        ],
        default='alimentaria'
    )
    
    # Certifications and Standards
    iso_certifications = models.JSONField(
        default=list,
        help_text="Lista de certificaciones ISO"
    )
    
    haccp_certified = models.BooleanField(
        default=False,
        help_text="Certificación HACCP para industria alimentaria"
    )
    
    gmp_certified = models.BooleanField(
        default=False,
        help_text="Certificación GMP para industria farmacéutica"
    )
    
    # Production Information
    production_capacity = models.CharField(
        max_length=20,
        choices=[
            ('small', 'Pequeña (< 100 unidades/día)'),
            ('medium', 'Mediana (100-1000 unidades/día)'),
            ('large', 'Grande (> 1000 unidades/día)'),
        ],
        default='medium'
    )
    
    main_products = models.JSONField(
        default=list,
        help_text="Lista de productos principales"
    )
    
    # System Integrations
    erp_system = models.CharField(
        max_length=100,
        blank=True,
        help_text="Sistema ERP utilizado"
    )
    
    mrp_system = models.CharField(
        max_length=100,
        blank=True,
        help_text="Sistema MRP utilizado"
    )
    
    # Regulatory Information
    invima_registration = models.CharField(
        max_length=50,
        blank=True,
        help_text="Registro INVIMA (si aplica)"
    )
    
    environmental_license = models.CharField(
        max_length=50,
        blank=True,
        help_text="Licencia ambiental"
    )
    
    class Meta:
        verbose_name = "Organización Manufacturera"
        verbose_name_plural = "Organizaciones Manufactureras"
        indexes = [
            models.Index(fields=['industry_type']),
            models.Index(fields=['production_capacity']),
            models.Index(fields=['haccp_certified']),
            models.Index(fields=['gmp_certified']),
        ]
```

## 🎓 Education Sector Extension (TEMPLATE)

### EducationOrganization Model Template

```python
class EducationOrganization(FullBaseModel):
    """Extension model for educational organizations."""
    
    # OneToOne relationship with master Organization
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='educationorganization'
    )
    
    # Educational Classification
    education_type = models.CharField(
        max_length=50,
        choices=[
            ('universidad', 'Universidad'),
            ('instituto_tecnico', 'Instituto Técnico'),
            ('colegio', 'Colegio'),
            ('centro_formacion', 'Centro de Formación'),
        ],
        default='universidad'
    )
    
    education_level = models.CharField(
        max_length=30,
        choices=[
            ('pregrado', 'Pregrado'),
            ('posgrado', 'Posgrado'),
            ('tecnico', 'Técnico'),
            ('tecnologico', 'Tecnológico'),
            ('basica', 'Educación Básica'),
            ('media', 'Educación Media'),
        ],
        default='pregrado'
    )
    
    # Capacity and Programs
    student_capacity = models.PositiveIntegerField(
        default=0,
        help_text="Capacidad total de estudiantes"
    )
    
    active_programs = models.JSONField(
        default=list,
        help_text="Lista de programas académicos activos"
    )
    
    # Accreditation
    accreditation_status = models.CharField(
        max_length=30,
        choices=[
            ('acreditada', 'Acreditada'),
            ('registro_calificado', 'Registro Calificado'),
            ('en_proceso', 'En Proceso'),
            ('no_acreditada', 'No Acreditada'),
        ],
        default='registro_calificado'
    )
    
    cna_accreditation = models.BooleanField(
        default=False,
        help_text="Acreditación CNA"
    )
    
    # System Integrations
    snies_code = models.CharField(
        max_length=20,
        blank=True,
        help_text="Código SNIES"
    )
    
    academic_system = models.CharField(
        max_length=100,
        blank=True,
        help_text="Sistema académico utilizado"
    )
    
    class Meta:
        verbose_name = "Organización Educativa"
        verbose_name_plural = "Organizaciones Educativas"
        indexes = [
            models.Index(fields=['education_type']),
            models.Index(fields=['education_level']),
            models.Index(fields=['accreditation_status']),
            models.Index(fields=['snies_code']),
        ]
```

## 🔧 Module Implementation Patterns

### Base Module Class

```python
class BaseModule:
    """Base class for all QMS modules."""
    
    # Module identification
    name = ""
    code = ""
    description = ""
    version = "1.0.0"
    
    # Compatibility rules
    sector_compatibility = []
    org_type_compatibility = []
    dependencies = []
    
    # Status
    is_core = False
    is_enabled = True
    
    def is_compatible(self, organization):
        """Check if module is compatible with organization."""
        sector_compatible = (
            not self.sector_compatibility or 
            organization.sector_economico in self.sector_compatibility
        )
        
        type_compatible = (
            not self.org_type_compatibility or
            organization.tipo_organizacion in self.org_type_compatibility
        )
        
        return sector_compatible and type_compatible
    
    def check_dependencies(self, organization):
        """Check if all dependencies are enabled."""
        return all(
            dep in organization.enabled_modules 
            for dep in self.dependencies
        )
    
    def on_activate(self, organization):
        """Called when module is activated for an organization."""
        pass
    
    def on_deactivate(self, organization):
        """Called when module is deactivated for an organization."""
        pass
    
    def get_permissions(self):
        """Return permissions required by this module."""
        return []
    
    def get_urls(self):
        """Return URL patterns for this module."""
        return []
    
    def get_navigation_items(self, organization, user):
        """Return navigation items for this module."""
        return []
```

### Sector-Specific Module Examples

```python
# Healthcare Modules
class SUHModule(BaseModule):
    name = "Sistema Único de Habilitación"
    code = "SUH"
    sector_compatibility = ['salud']
    org_type_compatibility = ['ips', 'ese', 'hospital', 'clinica', 'laboratorio']
    dependencies = ['DASHBOARD', 'PROCESSES']
    
    def on_activate(self, organization):
        # Ensure HealthOrganization exists
        health_org, created = HealthOrganization.objects.get_or_create(
            organization=organization,
            defaults={'naturaleza_juridica': 'privada'}
        )
        
        # Sync with REPS if code exists
        if health_org.codigo_prestador:
            self.sync_reps_data(health_org)
    
    def get_navigation_items(self, organization, user):
        return [
            {
                'id': 'suh',
                'label': 'Sistema de Habilitación',
                'icon': 'ri-hospital-line',
                'url': '/suh/',
                'children': [
                    {'id': 'services', 'label': 'Servicios Habilitados', 'url': '/suh/services/'},
                    {'id': 'reps', 'label': 'Integración REPS', 'url': '/suh/reps/'},
                ]
            }
        ]

class PAMECModule(BaseModule):
    name = "PAMEC"
    code = "PAMEC"
    sector_compatibility = ['salud']
    org_type_compatibility = ['ips', 'ese', 'hospital', 'clinica']
    dependencies = ['DASHBOARD', 'PROCESSES']

# Manufacturing Modules
class ProductionModule(BaseModule):
    name = "Gestión de Producción"
    code = "PRODUCTION"
    sector_compatibility = ['manufactura']
    org_type_compatibility = ['industria_alimentaria', 'industria_farmaceutica', 'industria_textil']
    dependencies = ['DASHBOARD', 'PROCESSES']
    
    def on_activate(self, organization):
        # Ensure ManufacturingOrganization exists
        manufacturing_org, created = ManufacturingOrganization.objects.get_or_create(
            organization=organization,
            defaults={'industry_type': 'alimentaria'}
        )

# Education Modules
class AcademicModule(BaseModule):
    name = "Gestión Académica"
    code = "ACADEMIC"
    sector_compatibility = ['educacion']
    org_type_compatibility = ['universidad', 'instituto_tecnico']
    dependencies = ['DASHBOARD', 'PROCESSES']
```

## 🔄 Auto-Activation Rules

### Implementation in Serializer

```python
def _get_modules_for_sector(self, sector, org_type):
    """Auto-assign modules based on sector and organization type."""
    base_modules = ['DASHBOARD', 'PROCESSES', 'DOCUMENTS']
    
    if sector == 'salud':
        if org_type in ['ips', 'ese', 'hospital', 'clinica']:
            return base_modules + ['SUH', 'PAMEC', 'CLINICAL_SAFETY', 'REPS_INTEGRATION']
        elif org_type == 'eps':
            return base_modules + ['MEMBER_MANAGEMENT', 'CLAIMS_PROCESSING']
        elif org_type in ['laboratorio', 'farmacia']:
            return base_modules + ['SUH', 'QUALITY_CONTROL']
        else:
            return base_modules + ['SUH', 'PAMEC']
            
    elif sector == 'manufactura':
        if org_type in ['industria_alimentaria']:
            return base_modules + ['PRODUCTION', 'QUALITY_CONTROL', 'FOOD_SAFETY', 'HACCP']
        elif org_type in ['industria_farmaceutica']:
            return base_modules + ['PRODUCTION', 'QUALITY_CONTROL', 'GMP', 'PHARMACOVIGILANCE']
        else:
            return base_modules + ['PRODUCTION', 'QUALITY_CONTROL', 'ISO_MANAGEMENT']
            
    elif sector == 'educacion':
        if org_type in ['universidad']:
            return base_modules + ['ACADEMIC', 'RESEARCH', 'ACCREDITATION', 'SNIES_INTEGRATION']
        elif org_type in ['instituto_tecnico']:
            return base_modules + ['ACADEMIC', 'TECHNICAL_PROGRAMS']
        else:
            return base_modules + ['ACADEMIC']
            
    else:
        return base_modules

def _get_sector_config(self, sector, org_type):
    """Generate sector-specific configuration."""
    config = {
        'auto_modules': True,
        'integrations': [],
        'compliance': ['ISO_9001'],
        'sector_features': {}
    }
    
    if sector == 'salud':
        config.update({
            'integrations': ['REPS', 'SISPRO', 'ADRES'],
            'compliance': ['SOGCS', 'ISO_9001', 'ISO_15189'],
            'sector_features': {
                'reps_validation': True,
                'health_services': True,
                'clinical_safety': True,
                'accreditation_tracking': True
            }
        })
        
    elif sector == 'manufactura':
        integrations = ['ERP']
        compliance = ['ISO_9001', 'ISO_14001']
        features = {
            'production_tracking': True,
            'quality_control': True,
            'inventory_management': True
        }
        
        if org_type == 'industria_alimentaria':
            compliance.append('HACCP')
            features['food_safety'] = True
        elif org_type == 'industria_farmaceutica':
            compliance.extend(['GMP', 'FDA'])
            features['pharmacovigilance'] = True
            
        config.update({
            'integrations': integrations,
            'compliance': compliance,
            'sector_features': features
        })
        
    elif sector == 'educacion':
        config.update({
            'integrations': ['SNIES', 'MEN'],
            'compliance': ['ISO_9001', 'CNA'],
            'sector_features': {
                'academic_programs': True,
                'research_tracking': True,
                'student_management': True,
                'accreditation_management': True
            }
        })
    
    return config
```

## 📝 Implementation Checklist

When creating new sector extensions, ensure:

### Model Requirements
- [ ] Extends FullBaseModel for audit trails
- [ ] OneToOne relationship with Organization
- [ ] Proper indexes for performance
- [ ] Validation in clean() method
- [ ] Computed properties for common operations
- [ ] Meta class with verbose names

### Module Requirements
- [ ] Inherits from BaseModule
- [ ] Defines sector_compatibility and org_type_compatibility
- [ ] Implements on_activate() and on_deactivate()
- [ ] Provides navigation items
- [ ] Defines required permissions

### Integration Requirements
- [ ] Auto-activation rules in serializer
- [ ] Sector configuration generation
- [ ] Frontend component mapping
- [ ] API endpoints with proper permissions
- [ ] Admin interface configuration

### Testing Requirements
- [ ] Model validation tests
- [ ] Module compatibility tests
- [ ] Auto-activation integration tests
- [ ] API endpoint tests
- [ ] Frontend component tests

This reference guide ensures consistent implementation patterns across all sector extensions in ZentraQMS.