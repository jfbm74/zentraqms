# Technical Architecture: Servicios de Salud (REPS Integration)

## Executive Summary

This document defines the comprehensive technical architecture for the "Servicios de Salud" functionality, enabling healthcare organizations to manage their enabled health services according to Colombian REPS (Registro Especial de Prestadores de Servicios de Salud) standards and Resolution 3100/2019 requirements.

## 1. REPS Excel File Structure Analysis

### 1.1 File Characteristics
- **Format**: HTML table exported as .xls (not binary Excel)
- **Encoding**: UTF-8
- **Structure**: Single table with 93 columns and header row
- **Export Source**: MinSalud REPS Portal
- **Date Format**: YYYYMMDD (e.g., 20170726)

### 1.2 Complete Column Mapping (93 columns)

#### Identification Fields (Columns 1-11)
```
1. depa_nombre - Department name
2. muni_nombre - Municipality name  
3. habi_codigo_habilitacion - Habilitation code
4. codigo_habilitacion - Habilitation code (duplicate)
5. numero_sede - Headquarters number
6. sede_nombre - Headquarters name
7. direccion - Address
8. telefono - Phone
9. email - Email
10. nits_nit - NIT number
11. dv - Verification digit
```

#### Organization Classification (Columns 12-19)
```
12. clase_persona - Person class (JURIDICO/NATURAL)
13. naju_codigo - Legal nature code
14. naju_nombre - Legal nature name
15. clpr_codigo - Provider class code
16. clpr_nombre - Provider class name (IPS, ESE, etc.)
17. ese - ESE indicator
18. nivel - Care level
19. caracter - Character type
20. habilitado - Enabled status (SI/NO)
```

#### Service Information (Columns 21-39)
```
21. grse_codigo - Service group code
22. grse_nombre - Service group name
23. serv_codigo - Service code (3-4 digits)
24. serv_nombre - Service name
25. ambulatorio - Ambulatory (SI/NO/SD)
26. hospitalario - Hospital (SI/NO/SD)
27. unidad_movil - Mobile unit (SI/NO/SD)
28. domiciliario - Home care (SI/NO/SD)
29. otras_extramural - Other extramural (SI/NO/SD)
30. centro_referencia - Reference center (SI/NO/SD)
31. institucion_remisora - Referring institution (SI/NO/SD)
32. complejidad_baja - Low complexity (SI/NO/SD)
33. complejidad_media - Medium complexity (SI/NO/SD)
34. complejidad_alta - High complexity (SI/NO/SD)
35. fecha_apertura - Opening date (YYYYMMDD)
36. fecha_cierre - Closing date
37. numero_distintivo - Distinctive number
38. numero_sede_principal - Main headquarters number
39. observaciones_serv_Res3100_2019 - Service observations
```

#### Administrative Information (Columns 40-47)
```
40. fecha_corte_REPS - REPS cutoff date
41. nombre - Organization name
42. horario_lunes - Monday schedule
43. horario_martes - Tuesday schedule
44. horario_miercoles - Wednesday schedule
45. horario_jueves - Thursday schedule
46. horario_viernes - Friday schedule
47. horario_sabado - Saturday schedule
48. horario_domingo - Sunday schedule
```

#### Service Modalities (Columns 49-63)
```
49. modalidad_intramural - Intramural modality (SI/NO)
50. Modalidad Extramural Transporte Asistencial y APH
51. Modalidad Extramural Unidad Móvil
52. Modalidad Extramural Domiciliaria
53. Modalidad Extramural Jornadas de Salud
54. modalidad_telemedicina - Telemedicine modality
55. modalidad_prestador_referencia
56. modalidad_prestador_referencia_telemedicina_interactiva
57. modalidad_prestador_referencia_telemedicina_no_interactiva
58. modalidad_prestador_referencia_tele_experticia
59. modalidad_prestador_referencia_tele_monitoreo
60. modalidad_prestador_remisor
61. modalidad_prestador_remisor_tele_experticia
62. modalidad_prestador_remisor_tele_monitoreo
63. complejidades - Complexity levels (BAJA/MEDIANA/ALTA)
```

#### Service Specificities (Columns 64-83)
```
64. especificidad_oncologico - Oncological (SI/NO)
65. especificidad_trasplante_osteomuscular
66. especificidad_trasplante_piel
67. especificidad_trasplante_cardiovascular
68. especificidad_trasplante_tejido_ocular
69. especificidad_atencion_paciente_quemado
70. especificidad_salud_mental
71. especificidad_spa - Substance abuse
72. especificidad_otras_patologias
73. especificidad_trasplante_celulas_progenitoras_hematopoyeticas
74. especificidad_procedimientos_quirurgicos_ambulatorios
75. especificidad_organo_rinon
76. especificidad_organo_higado
77. especificidad_organo_pancreas
78. especificidad_organo_intestino
79. especificidad_organo_multivisceral
80. especificidad_organo_corazon
81. especificidad_organo_pulmon
82. especificidad_sustancias_psicoactivas
83. especificidad_trasplante_renal
```

#### Additional Fields (Columns 84-93)
```
84. version_norma - Norm version (RESOLUCION_3100)
85. email_adicional - Additional email
86. telefono_adicional - Additional phone
87. gerente - Manager name
88. Municipio PDET - PDET municipality (SI/NO)
89. Municipio ZOMAC - ZOMAC municipality (SI/NO)
90. Municipio PNIS - PNIS municipality (SI/NO)
91. Municipio PNSR antes 2023
92. Municipio PNSR 2023
93. Municipio PNSR 2024
```

## 2. Django Model Architecture

### 2.1 Enhanced Service Model

```python
# apps/organization/models/health_services.py

from django.db import models
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
from apps.common.models import FullBaseModel

class HealthServiceCatalog(FullBaseModel):
    """
    Master catalog of health services according to Resolution 3100/2019.
    This is a reference table populated from REPS standards.
    """
    
    # Service Identification
    service_code = models.CharField(
        _('código del servicio'),
        max_length=10,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\d{3,4}$',
                message=_('El código debe tener 3 o 4 dígitos.')
            )
        ],
        help_text=_('Código REPS del servicio según Res. 3100/2019.')
    )
    
    service_name = models.CharField(
        _('nombre del servicio'),
        max_length=255,
        help_text=_('Nombre oficial del servicio de salud.')
    )
    
    # Service Group (from REPS column grse_nombre)
    GROUP_CHOICES = [
        ('7', _('Apoyo Diagnóstico y Complementación Terapéutica')),
        ('11', _('Atención Inmediata')),
        ('1', _('Consulta Externa')),
        ('2', _('Internación')),
        ('3', _('Quirúrgicos')),
        ('4', _('Urgencias')),
        ('5', _('Transporte Asistencial')),
        ('6', _('Otros Servicios')),
        ('8', _('Protección Específica y Detección Temprana')),
    ]
    
    service_group_code = models.CharField(
        _('código grupo'),
        max_length=2,
        choices=GROUP_CHOICES,
        help_text=_('Código del grupo de servicio.')
    )
    
    service_group_name = models.CharField(
        _('nombre grupo'),
        max_length=100,
        help_text=_('Nombre del grupo de servicio.')
    )
    
    # Service Requirements
    requires_infrastructure = models.BooleanField(
        _('requiere infraestructura especial'),
        default=False
    )
    
    requires_equipment = models.BooleanField(
        _('requiere equipamiento especial'),
        default=False
    )
    
    requires_human_talent = models.JSONField(
        _('talento humano requerido'),
        default=dict,
        help_text=_('Profesionales requeridos según normativa.')
    )
    
    # Modality Restrictions
    allows_ambulatory = models.BooleanField(default=True)
    allows_hospital = models.BooleanField(default=False)
    allows_mobile_unit = models.BooleanField(default=False)
    allows_domiciliary = models.BooleanField(default=False)
    allows_telemedicine = models.BooleanField(default=False)
    
    # Complexity Restrictions
    min_complexity = models.IntegerField(
        _('complejidad mínima'),
        choices=[(1, 'Baja'), (2, 'Media'), (3, 'Alta')],
        default=1
    )
    
    max_complexity = models.IntegerField(
        _('complejidad máxima'),
        choices=[(1, 'Baja'), (2, 'Media'), (3, 'Alta')],
        default=3
    )
    
    # Interdependencies
    dependent_services = models.ManyToManyField(
        'self',
        symmetrical=False,
        blank=True,
        related_name='required_by_services',
        help_text=_('Servicios requeridos para habilitar este servicio.')
    )
    
    # Metadata
    resolution_reference = models.CharField(
        _('referencia normativa'),
        max_length=50,
        default='RES_3100_2019',
        help_text=_('Resolución que define el servicio.')
    )
    
    is_active = models.BooleanField(
        _('activo'),
        default=True,
        help_text=_('Si el servicio está vigente en la normativa actual.')
    )
    
    class Meta:
        verbose_name = _('catálogo de servicios')
        verbose_name_plural = _('catálogo de servicios')
        ordering = ['service_group_code', 'service_code']
        indexes = [
            models.Index(fields=['service_code']),
            models.Index(fields=['service_group_code']),
        ]


class SedeHealthService(FullBaseModel):
    """
    Services enabled at a specific headquarters location.
    Maps REPS Excel data to headquarters-specific services.
    """
    
    # Relationships
    headquarters = models.ForeignKey(
        'HeadquarterLocation',
        on_delete=models.CASCADE,
        related_name='health_services',
        verbose_name=_('sede'),
        help_text=_('Sede donde se presta el servicio.')
    )
    
    service_catalog = models.ForeignKey(
        HealthServiceCatalog,
        on_delete=models.PROTECT,
        related_name='sede_instances',
        verbose_name=_('servicio del catálogo'),
        null=True,
        blank=True,
        help_text=_('Referencia al catálogo maestro de servicios.')
    )
    
    # Service Identification (from REPS)
    service_code = models.CharField(
        _('código del servicio'),
        max_length=10,
        help_text=_('Código REPS del servicio.')
    )
    
    service_name = models.CharField(
        _('nombre del servicio'),
        max_length=255,
        help_text=_('Nombre del servicio habilitado.')
    )
    
    service_group_code = models.CharField(
        _('código grupo'),
        max_length=2,
        help_text=_('Código del grupo de servicio.')
    )
    
    service_group_name = models.CharField(
        _('nombre grupo'),
        max_length=100,
        help_text=_('Nombre del grupo de servicio.')
    )
    
    # Modalities (from REPS columns)
    ambulatory = models.CharField(
        _('ambulatorio'),
        max_length=2,
        choices=[('SI', 'Sí'), ('NO', 'No'), ('SD', 'Sin Datos')],
        default='SD',
        help_text=_('Servicio ambulatorio.')
    )
    
    hospital = models.CharField(
        _('hospitalario'),
        max_length=2,
        choices=[('SI', 'Sí'), ('NO', 'No'), ('SD', 'Sin Datos')],
        default='SD',
        help_text=_('Servicio hospitalario.')
    )
    
    mobile_unit = models.CharField(
        _('unidad móvil'),
        max_length=2,
        choices=[('SI', 'Sí'), ('NO', 'No'), ('SD', 'Sin Datos')],
        default='SD',
        help_text=_('Servicio en unidad móvil.')
    )
    
    domiciliary = models.CharField(
        _('domiciliario'),
        max_length=2,
        choices=[('SI', 'Sí'), ('NO', 'No'), ('SD', 'Sin Datos')],
        default='SD',
        help_text=_('Servicio domiciliario.')
    )
    
    other_extramural = models.CharField(
        _('otras extramural'),
        max_length=2,
        choices=[('SI', 'Sí'), ('NO', 'No'), ('SD', 'Sin Datos')],
        default='SD',
        help_text=_('Otras modalidades extramurales.')
    )
    
    # Service Types
    is_reference_center = models.CharField(
        _('centro de referencia'),
        max_length=2,
        choices=[('SI', 'Sí'), ('NO', 'No'), ('SD', 'Sin Datos')],
        default='NO',
        help_text=_('Es centro de referencia.')
    )
    
    is_referring_institution = models.CharField(
        _('institución remisora'),
        max_length=2,
        choices=[('SI', 'Sí'), ('NO', 'No'), ('SD', 'Sin Datos')],
        default='NO',
        help_text=_('Es institución remisora.')
    )
    
    # Complexity (from REPS)
    low_complexity = models.CharField(
        _('complejidad baja'),
        max_length=2,
        choices=[('SI', 'Sí'), ('NO', 'No'), ('SD', 'Sin Datos')],
        default='SD'
    )
    
    medium_complexity = models.CharField(
        _('complejidad media'),
        max_length=2,
        choices=[('SI', 'Sí'), ('NO', 'No'), ('SD', 'Sin Datos')],
        default='SD'
    )
    
    high_complexity = models.CharField(
        _('complejidad alta'),
        max_length=2,
        choices=[('SI', 'Sí'), ('NO', 'No'), ('SD', 'Sin Datos')],
        default='SD'
    )
    
    complexity_level = models.CharField(
        _('nivel de complejidad'),
        max_length=10,
        choices=[
            ('BAJA', 'Baja'),
            ('MEDIANA', 'Mediana'),
            ('ALTA', 'Alta'),
            ('SD', 'Sin Datos')
        ],
        default='SD',
        help_text=_('Nivel de complejidad consolidado.')
    )
    
    # Dates
    opening_date = models.CharField(
        _('fecha apertura'),
        max_length=10,
        blank=True,
        help_text=_('Fecha de apertura del servicio (YYYYMMDD).')
    )
    
    closing_date = models.CharField(
        _('fecha cierre'),
        max_length=10,
        blank=True,
        help_text=_('Fecha de cierre del servicio.')
    )
    
    # Identification
    distinctive_number = models.CharField(
        _('número distintivo'),
        max_length=20,
        unique=True,
        help_text=_('Número distintivo único del servicio.')
    )
    
    # Schedule (JSON for flexibility)
    schedule = models.JSONField(
        _('horario de atención'),
        default=dict,
        blank=True,
        help_text=_('Horario por día de la semana.')
    )
    
    # Telemedicine modalities
    telemedicine_modality = models.JSONField(
        _('modalidades de telemedicina'),
        default=dict,
        blank=True,
        help_text=_('Modalidades de telemedicina habilitadas.')
    )
    
    # Service specificities (from REPS columns 64-83)
    specificities = models.JSONField(
        _('especificidades'),
        default=dict,
        blank=True,
        help_text=_('Especificidades del servicio (oncológico, trasplantes, etc.).')
    )
    
    # Administrative
    is_enabled = models.BooleanField(
        _('habilitado'),
        default=True,
        help_text=_('Si el servicio está actualmente habilitado.')
    )
    
    observations = models.TextField(
        _('observaciones'),
        blank=True,
        help_text=_('Observaciones del servicio.')
    )
    
    # REPS Import tracking
    reps_import_date = models.DateTimeField(
        _('fecha importación REPS'),
        null=True,
        blank=True,
        help_text=_('Última fecha de importación desde REPS.')
    )
    
    reps_raw_data = models.JSONField(
        _('datos crudos REPS'),
        default=dict,
        blank=True,
        help_text=_('Datos originales del archivo REPS.')
    )
    
    class Meta:
        verbose_name = _('servicio de salud habilitado')
        verbose_name_plural = _('servicios de salud habilitados')
        ordering = ['headquarters', 'service_group_code', 'service_code']
        unique_together = [['headquarters', 'service_code', 'distinctive_number']]
        indexes = [
            models.Index(fields=['headquarters', 'is_enabled']),
            models.Index(fields=['service_code']),
            models.Index(fields=['distinctive_number']),
            models.Index(fields=['service_group_code']),
        ]
    
    def __str__(self):
        return f"{self.service_code} - {self.service_name} ({self.headquarters.name})"
    
    def clean(self):
        """Validate service data."""
        super().clean()
        
        # At least one modality must be active
        modalities = [
            self.ambulatory,
            self.hospital,
            self.mobile_unit,
            self.domiciliary,
            self.other_extramural
        ]
        
        if all(m == 'NO' for m in modalities):
            raise ValidationError({
                'ambulatory': _('Al menos una modalidad debe estar activa.')
            })
    
    @property
    def active_modalities(self):
        """Return list of active modalities."""
        modalities = []
        if self.ambulatory == 'SI':
            modalities.append('Ambulatorio')
        if self.hospital == 'SI':
            modalities.append('Hospitalario')
        if self.mobile_unit == 'SI':
            modalities.append('Unidad Móvil')
        if self.domiciliary == 'SI':
            modalities.append('Domiciliario')
        if self.other_extramural == 'SI':
            modalities.append('Extramural')
        return modalities
    
    @property
    def complexity_display(self):
        """Return formatted complexity level."""
        levels = []
        if self.low_complexity == 'SI':
            levels.append('Baja')
        if self.medium_complexity == 'SI':
            levels.append('Media')
        if self.high_complexity == 'SI':
            levels.append('Alta')
        return ', '.join(levels) if levels else 'Sin Datos'


class ServiceImportLog(FullBaseModel):
    """
    Tracks REPS Excel import operations for audit and debugging.
    """
    
    organization = models.ForeignKey(
        'HealthOrganization',
        on_delete=models.CASCADE,
        related_name='service_import_logs'
    )
    
    import_type = models.CharField(
        _('tipo de importación'),
        max_length=20,
        choices=[
            ('manual', 'Manual'),
            ('scheduled', 'Programada'),
            ('api', 'API'),
        ]
    )
    
    file_name = models.CharField(
        _('nombre del archivo'),
        max_length=255
    )
    
    file_size = models.IntegerField(
        _('tamaño del archivo'),
        help_text=_('Tamaño en bytes')
    )
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('processing', 'Procesando'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
        ('partial', 'Parcial'),
    ]
    
    status = models.CharField(
        _('estado'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Statistics
    total_rows = models.IntegerField(default=0)
    processed_rows = models.IntegerField(default=0)
    successful_rows = models.IntegerField(default=0)
    failed_rows = models.IntegerField(default=0)
    
    services_created = models.IntegerField(default=0)
    services_updated = models.IntegerField(default=0)
    services_disabled = models.IntegerField(default=0)
    
    # Timing
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    processing_time = models.FloatField(
        null=True,
        blank=True,
        help_text=_('Tiempo de procesamiento en segundos')
    )
    
    # Error tracking
    errors = models.JSONField(
        default=list,
        blank=True,
        help_text=_('Lista de errores encontrados')
    )
    
    warnings = models.JSONField(
        default=list,
        blank=True,
        help_text=_('Lista de advertencias')
    )
    
    # Raw data for debugging
    raw_data_sample = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Muestra de datos crudos para debugging')
    )
    
    class Meta:
        verbose_name = _('log de importación de servicios')
        verbose_name_plural = _('logs de importación de servicios')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['status']),
        ]
```

## 3. Database Schema Design

### 3.1 Tables Structure

```sql
-- Health Service Catalog (Master Table)
CREATE TABLE organization_healthservicecatalog (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by_id BIGINT REFERENCES auth_user(id),
    updated_by_id BIGINT REFERENCES auth_user(id),
    deleted_by_id BIGINT REFERENCES auth_user(id),
    
    service_code VARCHAR(10) UNIQUE NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_group_code VARCHAR(2) NOT NULL,
    service_group_name VARCHAR(100) NOT NULL,
    
    requires_infrastructure BOOLEAN DEFAULT FALSE,
    requires_equipment BOOLEAN DEFAULT FALSE,
    requires_human_talent JSONB DEFAULT '{}',
    
    allows_ambulatory BOOLEAN DEFAULT TRUE,
    allows_hospital BOOLEAN DEFAULT FALSE,
    allows_mobile_unit BOOLEAN DEFAULT FALSE,
    allows_domiciliary BOOLEAN DEFAULT FALSE,
    allows_telemedicine BOOLEAN DEFAULT FALSE,
    
    min_complexity INTEGER DEFAULT 1,
    max_complexity INTEGER DEFAULT 3,
    
    resolution_reference VARCHAR(50) DEFAULT 'RES_3100_2019',
    is_active BOOLEAN DEFAULT TRUE
);

-- Sede Health Services
CREATE TABLE organization_sedehealthservice (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by_id BIGINT REFERENCES auth_user(id),
    updated_by_id BIGINT REFERENCES auth_user(id),
    deleted_by_id BIGINT REFERENCES auth_user(id),
    
    headquarters_id BIGINT NOT NULL REFERENCES organization_headquarterlocation(id) ON DELETE CASCADE,
    service_catalog_id BIGINT REFERENCES organization_healthservicecatalog(id) ON DELETE PROTECT,
    
    service_code VARCHAR(10) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_group_code VARCHAR(2) NOT NULL,
    service_group_name VARCHAR(100) NOT NULL,
    
    ambulatory VARCHAR(2) DEFAULT 'SD',
    hospital VARCHAR(2) DEFAULT 'SD',
    mobile_unit VARCHAR(2) DEFAULT 'SD',
    domiciliary VARCHAR(2) DEFAULT 'SD',
    other_extramural VARCHAR(2) DEFAULT 'SD',
    
    is_reference_center VARCHAR(2) DEFAULT 'NO',
    is_referring_institution VARCHAR(2) DEFAULT 'NO',
    
    low_complexity VARCHAR(2) DEFAULT 'SD',
    medium_complexity VARCHAR(2) DEFAULT 'SD',
    high_complexity VARCHAR(2) DEFAULT 'SD',
    complexity_level VARCHAR(10) DEFAULT 'SD',
    
    opening_date VARCHAR(10),
    closing_date VARCHAR(10),
    distinctive_number VARCHAR(20) UNIQUE NOT NULL,
    
    schedule JSONB DEFAULT '{}',
    telemedicine_modality JSONB DEFAULT '{}',
    specificities JSONB DEFAULT '{}',
    
    is_enabled BOOLEAN DEFAULT TRUE,
    observations TEXT,
    
    reps_import_date TIMESTAMP WITH TIME ZONE,
    reps_raw_data JSONB DEFAULT '{}',
    
    UNIQUE(headquarters_id, service_code, distinctive_number)
);

-- Service Import Log
CREATE TABLE organization_serviceimportlog (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    organization_id BIGINT NOT NULL REFERENCES organization_healthorganization(id) ON DELETE CASCADE,
    created_by_id BIGINT REFERENCES auth_user(id),
    
    import_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    
    services_created INTEGER DEFAULT 0,
    services_updated INTEGER DEFAULT 0,
    services_disabled INTEGER DEFAULT 0,
    
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_time FLOAT,
    
    errors JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    raw_data_sample JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_service_catalog_code ON organization_healthservicecatalog(service_code);
CREATE INDEX idx_service_catalog_group ON organization_healthservicecatalog(service_group_code);

CREATE INDEX idx_sede_service_headquarters ON organization_sedehealthservice(headquarters_id, is_enabled);
CREATE INDEX idx_sede_service_code ON organization_sedehealthservice(service_code);
CREATE INDEX idx_sede_service_distinctive ON organization_sedehealthservice(distinctive_number);
CREATE INDEX idx_sede_service_group ON organization_sedehealthservice(service_group_code);

CREATE INDEX idx_import_log_org ON organization_serviceimportlog(organization_id, created_at DESC);
CREATE INDEX idx_import_log_status ON organization_serviceimportlog(status);
```

## 4. Import System Architecture

### 4.1 Import Service Enhancement

```python
# apps/sogcs/services/reps_service_importer.py

import pandas as pd
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from decimal import Decimal
from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.organization.models import (
    HeadquarterLocation,
    HealthOrganization,
    SedeHealthService,
    ServiceImportLog,
    HealthServiceCatalog
)

logger = logging.getLogger(__name__)


class REPSServiceImporter:
    """
    Enhanced REPS Excel importer for health services.
    Handles the 93-column REPS export format.
    """
    
    # Column mappings for REPS Excel structure
    COLUMN_MAPPING = {
        # Basic identification
        'depa_nombre': 'department_name',
        'muni_nombre': 'municipality_name',
        'habi_codigo_habilitacion': 'habilitation_code',
        'numero_sede': 'sede_number',
        'sede_nombre': 'sede_name',
        'direccion': 'address',
        'telefono': 'phone',
        'email': 'email',
        'nits_nit': 'nit',
        'dv': 'verification_digit',
        
        # Service information
        'grse_codigo': 'service_group_code',
        'grse_nombre': 'service_group_name',
        'serv_codigo': 'service_code',
        'serv_nombre': 'service_name',
        
        # Modalities
        'ambulatorio': 'ambulatory',
        'hospitalario': 'hospital',
        'unidad_movil': 'mobile_unit',
        'domiciliario': 'domiciliary',
        'otras_extramural': 'other_extramural',
        'centro_referencia': 'is_reference_center',
        'institucion_remisora': 'is_referring_institution',
        
        # Complexity
        'complejidad_baja': 'low_complexity',
        'complejidad_media': 'medium_complexity',
        'complejidad_alta': 'high_complexity',
        'complejidades': 'complexity_level',
        
        # Dates and identifiers
        'fecha_apertura': 'opening_date',
        'fecha_cierre': 'closing_date',
        'numero_distintivo': 'distinctive_number',
        
        # Schedule
        'horario_lunes': 'schedule_monday',
        'horario_martes': 'schedule_tuesday',
        'horario_miercoles': 'schedule_wednesday',
        'horario_jueves': 'schedule_thursday',
        'horario_viernes': 'schedule_friday',
        'horario_sabado': 'schedule_saturday',
        'horario_domingo': 'schedule_sunday',
        
        # Administrative
        'gerente': 'manager_name',
        'habilitado': 'is_enabled',
        'observaciones_serv_Res3100_2019': 'observations',
    }
    
    def __init__(self, organization: HealthOrganization, user):
        self.organization = organization
        self.user = user
        self.import_log = None
        self.errors = []
        self.warnings = []
        self.stats = {
            'total_rows': 0,
            'processed_rows': 0,
            'successful_rows': 0,
            'failed_rows': 0,
            'services_created': 0,
            'services_updated': 0,
            'services_disabled': 0,
        }
    
    def import_from_file(self, file_path: str, file_name: str = None) -> ServiceImportLog:
        """
        Main import method for REPS Excel files.
        """
        self.import_log = ServiceImportLog.objects.create(
            organization=self.organization,
            import_type='manual',
            file_name=file_name or 'servicios_reps.xls',
            file_size=0,  # Will be updated
            status='processing',
            created_by=self.user,
            started_at=timezone.now()
        )
        
        try:
            # Read and parse the file
            df = self._read_reps_file(file_path)
            self.stats['total_rows'] = len(df)
            
            # Process each row
            with transaction.atomic():
                for index, row in df.iterrows():
                    # Skip header row if present
                    if index == 0 and str(row.get('depa_nombre', '')).lower() == 'depa_nombre':
                        continue
                    
                    self._process_service_row(row, index + 1)
                    self.stats['processed_rows'] += 1
            
            # Update import log
            self._finalize_import()
            
        except Exception as e:
            logger.error(f"Import failed: {str(e)}")
            self.errors.append(f"Critical error: {str(e)}")
            self.import_log.status = 'failed'
            self.import_log.errors = self.errors
            self.import_log.save()
            raise
        
        return self.import_log
    
    def _read_reps_file(self, file_path: str) -> pd.DataFrame:
        """
        Read REPS HTML-as-Excel file.
        """
        try:
            # Read as HTML table
            tables = pd.read_html(file_path, encoding='utf-8')
            
            if not tables:
                raise ValueError("No tables found in file")
            
            df = tables[0]
            
            # Use first row as column names if needed
            if len(df) > 0 and df.iloc[0, 0] == 'depa_nombre':
                df.columns = df.iloc[0].astype(str).str.strip()
                df = df.drop(df.index[0]).reset_index(drop=True)
            
            # Clean column names
            df.columns = [str(col).strip() for col in df.columns]
            
            return df
            
        except Exception as e:
            logger.error(f"Error reading REPS file: {str(e)}")
            raise ValueError(f"Cannot read REPS file: {str(e)}")
    
    def _process_service_row(self, row: pd.Series, row_number: int):
        """
        Process a single service row from REPS.
        """
        try:
            # Extract sede information
            sede_number = self._clean_value(row.get('numero_sede'))
            sede_name = self._clean_value(row.get('sede_nombre'))
            
            if not sede_number:
                self.warnings.append(f"Row {row_number}: Missing sede number")
                return
            
            # Find or create headquarters
            headquarters = self._get_or_create_headquarters(row, sede_number, sede_name)
            
            # Extract service information
            service_data = self._extract_service_data(row)
            
            if not service_data.get('service_code') or not service_data.get('distinctive_number'):
                self.warnings.append(f"Row {row_number}: Missing service code or distinctive number")
                return
            
            # Create or update service
            self._create_or_update_service(headquarters, service_data, row)
            self.stats['successful_rows'] += 1
            
        except Exception as e:
            self.stats['failed_rows'] += 1
            error_msg = f"Row {row_number}: {str(e)}"
            self.errors.append(error_msg)
            logger.error(error_msg)
    
    def _get_or_create_headquarters(self, row: pd.Series, sede_number: str, sede_name: str) -> HeadquarterLocation:
        """
        Get existing headquarters or create basic one for service association.
        """
        try:
            # Try to find existing headquarters
            headquarters = HeadquarterLocation.objects.filter(
                organization=self.organization.healthorganization,
                reps_code__endswith=sede_number
            ).first()
            
            if not headquarters:
                # Create minimal headquarters entry
                reps_code = f"{self.organization.nit}-{sede_number}"
                
                headquarters = HeadquarterLocation.objects.create(
                    organization=self.organization.healthorganization,
                    reps_code=reps_code,
                    name=sede_name or f"Sede {sede_number}",
                    sede_type='principal' if sede_number == '01' else 'satelite',
                    department_code='00',  # Will be updated
                    department_name=self._clean_value(row.get('depa_nombre', '')),
                    municipality_code='00000',  # Will be updated
                    municipality_name=self._clean_value(row.get('muni_nombre', '')),
                    address=self._clean_value(row.get('direccion', 'Por definir')),
                    phone_primary=self._clean_value(row.get('telefono', '')),
                    email=self._clean_value(row.get('email', 'info@example.com')),
                    administrative_contact=self._clean_value(row.get('gerente', '')),
                    habilitation_status='en_proceso',
                    operational_status='activa',
                    created_by=self.user
                )
                
                logger.info(f"Created headquarters: {reps_code}")
            
            return headquarters
            
        except Exception as e:
            raise ValueError(f"Cannot get/create headquarters: {str(e)}")
    
    def _extract_service_data(self, row: pd.Series) -> Dict[str, Any]:
        """
        Extract and clean service data from REPS row.
        """
        data = {}
        
        # Basic service information
        data['service_code'] = self._clean_value(row.get('serv_codigo'))
        data['service_name'] = self._clean_value(row.get('serv_nombre'))
        data['service_group_code'] = self._clean_value(row.get('grse_codigo'))
        data['service_group_name'] = self._clean_value(row.get('grse_nombre'))
        
        # Modalities
        data['ambulatory'] = self._normalize_si_no(row.get('ambulatorio'))
        data['hospital'] = self._normalize_si_no(row.get('hospitalario'))
        data['mobile_unit'] = self._normalize_si_no(row.get('unidad_movil'))
        data['domiciliary'] = self._normalize_si_no(row.get('domiciliario'))
        data['other_extramural'] = self._normalize_si_no(row.get('otras_extramural'))
        
        # Service types
        data['is_reference_center'] = self._normalize_si_no(row.get('centro_referencia'))
        data['is_referring_institution'] = self._normalize_si_no(row.get('institucion_remisora'))
        
        # Complexity
        data['low_complexity'] = self._normalize_si_no(row.get('complejidad_baja'))
        data['medium_complexity'] = self._normalize_si_no(row.get('complejidad_media'))
        data['high_complexity'] = self._normalize_si_no(row.get('complejidad_alta'))
        data['complexity_level'] = self._clean_value(row.get('complejidades', 'SD'))
        
        # Dates and identifiers
        data['opening_date'] = self._clean_value(row.get('fecha_apertura'))
        data['closing_date'] = self._clean_value(row.get('fecha_cierre'))
        data['distinctive_number'] = self._clean_value(row.get('numero_distintivo'))
        
        # Schedule
        schedule = {}
        for day in ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']:
            schedule_value = self._clean_value(row.get(f'horario_{day}'))
            if schedule_value:
                schedule[day] = schedule_value
        data['schedule'] = schedule
        
        # Telemedicine modalities
        telemedicine = {}
        telemedicine_fields = [
            'modalidad_intramural',
            'modalidad_telemedicina',
            'modalidad_prestador_referencia',
            'modalidad_prestador_remisor'
        ]
        for field in telemedicine_fields:
            value = self._normalize_si_no(row.get(field))
            if value == 'SI':
                telemedicine[field] = True
        data['telemedicine_modality'] = telemedicine
        
        # Service specificities
        specificities = {}
        for col in row.index:
            if col.startswith('especificidad_'):
                value = self._normalize_si_no(row.get(col))
                if value == 'SI':
                    specificities[col] = True
        data['specificities'] = specificities
        
        # Administrative
        data['is_enabled'] = self._normalize_si_no(row.get('habilitado')) == 'SI'
        data['observations'] = self._clean_value(row.get('observaciones_serv_Res3100_2019'))
        
        return data
    
    def _create_or_update_service(self, headquarters: HeadquarterLocation, 
                                  service_data: Dict[str, Any], 
                                  raw_row: pd.Series):
        """
        Create or update a health service.
        """
        try:
            # Try to find existing service
            service = SedeHealthService.objects.filter(
                headquarters=headquarters,
                distinctive_number=service_data['distinctive_number']
            ).first()
            
            if service:
                # Update existing service
                for key, value in service_data.items():
                    setattr(service, key, value)
                service.reps_import_date = timezone.now()
                service.updated_by = self.user
                service.save()
                self.stats['services_updated'] += 1
                logger.info(f"Updated service: {service_data['distinctive_number']}")
            else:
                # Create new service
                service = SedeHealthService.objects.create(
                    headquarters=headquarters,
                    **service_data,
                    reps_import_date=timezone.now(),
                    reps_raw_data=raw_row.to_dict(),
                    created_by=self.user
                )
                self.stats['services_created'] += 1
                logger.info(f"Created service: {service_data['distinctive_number']}")
            
            # Link to catalog if available
            self._link_to_catalog(service)
            
        except IntegrityError as e:
            raise ValueError(f"Integrity error creating service: {str(e)}")
    
    def _link_to_catalog(self, service: SedeHealthService):
        """
        Link service to master catalog if available.
        """
        try:
            catalog_entry = HealthServiceCatalog.objects.filter(
                service_code=service.service_code
            ).first()
            
            if catalog_entry:
                service.service_catalog = catalog_entry
                service.save(update_fields=['service_catalog'])
        except Exception as e:
            logger.warning(f"Could not link to catalog: {str(e)}")
    
    def _clean_value(self, value) -> str:
        """Clean and normalize string values."""
        if pd.isna(value) or value is None:
            return ''
        return str(value).strip()
    
    def _normalize_si_no(self, value) -> str:
        """Normalize SI/NO/SD values."""
        if pd.isna(value) or value is None:
            return 'SD'
        
        value = str(value).upper().strip()
        if value in ['SI', 'SÍ', 'YES', 'S', '1', 'TRUE']:
            return 'SI'
        elif value in ['NO', 'N', '0', 'FALSE']:
            return 'NO'
        else:
            return 'SD'
    
    def _finalize_import(self):
        """
        Finalize the import process and update log.
        """
        self.import_log.completed_at = timezone.now()
        self.import_log.status = 'completed' if not self.errors else 'partial'
        
        # Calculate processing time
        if self.import_log.started_at:
            delta = self.import_log.completed_at - self.import_log.started_at
            self.import_log.processing_time = delta.total_seconds()
        
        # Update statistics
        for key, value in self.stats.items():
            setattr(self.import_log, key, value)
        
        self.import_log.errors = self.errors
        self.import_log.warnings = self.warnings
        self.import_log.save()
        
        logger.info(f"Import completed: {self.stats}")
```

## 5. API Design

### 5.1 RESTful Endpoints

```python
# apps/organization/serializers/health_services_serializers.py

from rest_framework import serializers
from django.db import transaction
from ..models import SedeHealthService, HealthServiceCatalog, ServiceImportLog


class HealthServiceCatalogSerializer(serializers.ModelSerializer):
    """
    Serializer for health service catalog (read-only reference).
    """
    dependent_services_count = serializers.SerializerMethodField()
    
    class Meta:
        model = HealthServiceCatalog
        fields = [
            'id', 'service_code', 'service_name',
            'service_group_code', 'service_group_name',
            'requires_infrastructure', 'requires_equipment',
            'requires_human_talent', 'allows_ambulatory',
            'allows_hospital', 'allows_mobile_unit',
            'allows_domiciliary', 'allows_telemedicine',
            'min_complexity', 'max_complexity',
            'dependent_services_count', 'is_active'
        ]
        read_only_fields = fields
    
    def get_dependent_services_count(self, obj):
        return obj.dependent_services.count()


class SedeHealthServiceListSerializer(serializers.ModelSerializer):
    """
    Light serializer for service lists.
    """
    active_modalities = serializers.ReadOnlyField()
    complexity_display = serializers.ReadOnlyField()
    
    class Meta:
        model = SedeHealthService
        fields = [
            'id', 'service_code', 'service_name',
            'service_group_name', 'distinctive_number',
            'active_modalities', 'complexity_display',
            'is_enabled', 'opening_date'
        ]


class SedeHealthServiceDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for individual service.
    """
    service_catalog = HealthServiceCatalogSerializer(read_only=True)
    active_modalities = serializers.ReadOnlyField()
    complexity_display = serializers.ReadOnlyField()
    headquarters_name = serializers.CharField(source='headquarters.name', read_only=True)
    
    class Meta:
        model = SedeHealthService
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


class SedeHealthServiceCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating services.
    """
    class Meta:
        model = SedeHealthService
        fields = [
            'headquarters', 'service_code', 'service_name',
            'service_group_code', 'service_group_name',
            'ambulatory', 'hospital', 'mobile_unit',
            'domiciliary', 'other_extramural',
            'is_reference_center', 'is_referring_institution',
            'low_complexity', 'medium_complexity', 'high_complexity',
            'complexity_level', 'opening_date', 'closing_date',
            'distinctive_number', 'schedule', 'telemedicine_modality',
            'specificities', 'is_enabled', 'observations'
        ]
    
    def validate_distinctive_number(self, value):
        """Ensure distinctive number is unique."""
        instance = self.instance
        if SedeHealthService.objects.filter(
            distinctive_number=value
        ).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError(
                "Ya existe un servicio con este número distintivo."
            )
        return value
    
    def validate(self, data):
        """Validate service data."""
        # Ensure at least one modality is active
        modalities = [
            data.get('ambulatory', 'SD'),
            data.get('hospital', 'SD'),
            data.get('mobile_unit', 'SD'),
            data.get('domiciliary', 'SD'),
            data.get('other_extramural', 'SD')
        ]
        
        if all(m == 'NO' for m in modalities):
            raise serializers.ValidationError(
                "Al menos una modalidad debe estar activa (no puede ser todas NO)."
            )
        
        return data


class ServiceImportSerializer(serializers.Serializer):
    """
    Serializer for service import via Excel.
    """
    file = serializers.FileField(
        help_text="Archivo Excel (.xls) exportado desde REPS"
    )
    
    def validate_file(self, value):
        """Validate uploaded file."""
        # Check file extension
        if not value.name.endswith(('.xls', '.xlsx')):
            raise serializers.ValidationError(
                "El archivo debe ser formato Excel (.xls o .xlsx)"
            )
        
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                "El archivo no puede superar los 10MB"
            )
        
        return value


class ServiceImportLogSerializer(serializers.ModelSerializer):
    """
    Serializer for import logs.
    """
    duration = serializers.SerializerMethodField()
    success_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceImportLog
        fields = [
            'id', 'import_type', 'file_name', 'file_size',
            'status', 'total_rows', 'processed_rows',
            'successful_rows', 'failed_rows',
            'services_created', 'services_updated',
            'services_disabled', 'started_at', 'completed_at',
            'duration', 'success_rate', 'errors', 'warnings',
            'created_at', 'created_by'
        ]
    
    def get_duration(self, obj):
        """Calculate import duration."""
        if obj.processing_time:
            return f"{obj.processing_time:.2f} segundos"
        return None
    
    def get_success_rate(self, obj):
        """Calculate success rate."""
        if obj.processed_rows > 0:
            rate = (obj.successful_rows / obj.processed_rows) * 100
            return f"{rate:.1f}%"
        return "0%"


class ServiceBulkActionSerializer(serializers.Serializer):
    """
    Serializer for bulk actions on services.
    """
    service_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="Lista de IDs de servicios"
    )
    action = serializers.ChoiceField(
        choices=[
            ('enable', 'Habilitar'),
            ('disable', 'Deshabilitar'),
            ('delete', 'Eliminar')
        ]
    )
    
    def validate_service_ids(self, value):
        """Validate that services exist and belong to organization."""
        # This will be validated in the view with proper permissions
        return value
```

### 5.2 ViewSets and Endpoints

```python
# apps/organization/views/health_services_views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Prefetch
from django.shortcuts import get_object_or_404
import tempfile
import os

from ..models import (
    SedeHealthService,
    HealthServiceCatalog,
    ServiceImportLog,
    HeadquarterLocation
)
from ..serializers import (
    SedeHealthServiceListSerializer,
    SedeHealthServiceDetailSerializer,
    SedeHealthServiceCreateUpdateSerializer,
    ServiceImportSerializer,
    ServiceImportLogSerializer,
    ServiceBulkActionSerializer,
    HealthServiceCatalogSerializer
)
from apps.sogcs.services import REPSServiceImporter


class HealthServiceCatalogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for health service catalog (read-only reference).
    """
    queryset = HealthServiceCatalog.objects.filter(is_active=True)
    serializer_class = HealthServiceCatalogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['service_group_code', 'min_complexity', 'max_complexity']
    search_fields = ['service_code', 'service_name', 'service_group_name']
    ordering_fields = ['service_code', 'service_name', 'service_group_code']
    ordering = ['service_group_code', 'service_code']


class SedeHealthServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for sede health services with import capabilities.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'headquarters', 'service_group_code', 'is_enabled',
        'ambulatory', 'hospital', 'mobile_unit', 'domiciliary',
        'complexity_level'
    ]
    search_fields = [
        'service_code', 'service_name', 'distinctive_number',
        'service_group_name', 'observations'
    ]
    ordering_fields = ['service_code', 'service_name', 'opening_date', 'created_at']
    ordering = ['service_group_code', 'service_code']
    
    def get_queryset(self):
        """Filter services by user's organization."""
        user = self.request.user
        queryset = SedeHealthService.objects.select_related(
            'headquarters',
            'service_catalog'
        )
        
        # Filter by organization
        if hasattr(user, 'organization_users'):
            org_user = user.organization_users.first()
            if org_user:
                queryset = queryset.filter(
                    headquarters__organization=org_user.organization.healthorganization
                )
        
        # Additional filters from query params
        headquarters_id = self.request.query_params.get('headquarters_id')
        if headquarters_id:
            queryset = queryset.filter(headquarters_id=headquarters_id)
        
        enabled_only = self.request.query_params.get('enabled_only', 'false').lower() == 'true'
        if enabled_only:
            queryset = queryset.filter(is_enabled=True)
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return SedeHealthServiceListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return SedeHealthServiceCreateUpdateSerializer
        elif self.action == 'import_excel':
            return ServiceImportSerializer
        elif self.action == 'bulk_action':
            return ServiceBulkActionSerializer
        return SedeHealthServiceDetailSerializer
    
    @action(
        detail=False,
        methods=['POST'],
        parser_classes=[MultiPartParser, FormParser],
        url_path='import-excel'
    )
    def import_excel(self, request):
        """
        Import services from REPS Excel file.
        
        POST /api/v1/sede-health-services/import-excel/
        """
        serializer = ServiceImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file = serializer.validated_data['file']
        
        # Get user's organization
        org_user = request.user.organization_users.first()
        if not org_user:
            return Response(
                {'error': 'Usuario no asociado a ninguna organización'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Save file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xls') as tmp_file:
                for chunk in file.chunks():
                    tmp_file.write(chunk)
                tmp_file_path = tmp_file.name
            
            # Import services
            importer = REPSServiceImporter(
                organization=org_user.organization,
                user=request.user
            )
            import_log = importer.import_from_file(
                file_path=tmp_file_path,
                file_name=file.name
            )
            
            # Clean up temp file
            os.unlink(tmp_file_path)
            
            # Return import results
            return Response(
                ServiceImportLogSerializer(import_log).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            # Clean up temp file if exists
            if 'tmp_file_path' in locals():
                try:
                    os.unlink(tmp_file_path)
                except:
                    pass
            
            return Response(
                {'error': f'Error al importar archivo: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['POST'], url_path='bulk-action')
    def bulk_action(self, request):
        """
        Perform bulk actions on multiple services.
        
        POST /api/v1/sede-health-services/bulk-action/
        """
        serializer = ServiceBulkActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service_ids = serializer.validated_data['service_ids']
        action = serializer.validated_data['action']
        
        # Get services and verify permissions
        services = self.get_queryset().filter(id__in=service_ids)
        
        if not services.exists():
            return Response(
                {'error': 'No se encontraron servicios válidos'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Perform action
        if action == 'enable':
            updated = services.update(is_enabled=True, updated_by=request.user)
            message = f'{updated} servicios habilitados'
        elif action == 'disable':
            updated = services.update(is_enabled=False, updated_by=request.user)
            message = f'{updated} servicios deshabilitados'
        elif action == 'delete':
            count = services.count()
            services.update(deleted_at=timezone.now(), deleted_by=request.user)
            message = f'{count} servicios eliminados'
        
        return Response({'message': message}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['GET'], url_path='by-headquarters/(?P<headquarters_id>[^/.]+)')
    def by_headquarters(self, request, headquarters_id=None):
        """
        Get services for a specific headquarters.
        
        GET /api/v1/sede-health-services/by-headquarters/{headquarters_id}/
        """
        headquarters = get_object_or_404(HeadquarterLocation, pk=headquarters_id)
        
        # Verify user has access to this headquarters
        org_user = request.user.organization_users.first()
        if not org_user or headquarters.organization != org_user.organization.healthorganization:
            return Response(
                {'error': 'No tiene permisos para ver estos servicios'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        services = self.get_queryset().filter(headquarters=headquarters)
        
        # Group by service group
        grouped_services = {}
        for service in services:
            group = service.service_group_name
            if group not in grouped_services:
                grouped_services[group] = []
            grouped_services[group].append(
                SedeHealthServiceListSerializer(service).data
            )
        
        return Response({
            'headquarters': {
                'id': headquarters.id,
                'name': headquarters.name,
                'reps_code': headquarters.reps_code
            },
            'total_services': services.count(),
            'enabled_services': services.filter(is_enabled=True).count(),
            'services_by_group': grouped_services
        })
    
    @action(detail=False, methods=['GET'], url_path='import-logs')
    def import_logs(self, request):
        """
        Get import logs for the organization.
        
        GET /api/v1/sede-health-services/import-logs/
        """
        org_user = request.user.organization_users.first()
        if not org_user:
            return Response([], status=status.HTTP_200_OK)
        
        logs = ServiceImportLog.objects.filter(
            organization=org_user.organization
        ).order_by('-created_at')[:20]
        
        return Response(
            ServiceImportLogSerializer(logs, many=True).data
        )
    
    @action(detail=False, methods=['GET'], url_path='statistics')
    def statistics(self, request):
        """
        Get service statistics for the organization.
        
        GET /api/v1/sede-health-services/statistics/
        """
        queryset = self.get_queryset()
        
        # Calculate statistics
        stats = {
            'total_services': queryset.count(),
            'enabled_services': queryset.filter(is_enabled=True).count(),
            'disabled_services': queryset.filter(is_enabled=False).count(),
            'by_group': {},
            'by_complexity': {
                'BAJA': queryset.filter(complexity_level='BAJA').count(),
                'MEDIANA': queryset.filter(complexity_level='MEDIANA').count(),
                'ALTA': queryset.filter(complexity_level='ALTA').count(),
                'SD': queryset.filter(complexity_level='SD').count(),
            },
            'by_modality': {
                'ambulatory': queryset.filter(ambulatory='SI').count(),
                'hospital': queryset.filter(hospital='SI').count(),
                'mobile_unit': queryset.filter(mobile_unit='SI').count(),
                'domiciliary': queryset.filter(domiciliary='SI').count(),
                'telemedicine': queryset.filter(
                    telemedicine_modality__has_key='modalidad_telemedicina'
                ).count(),
            }
        }
        
        # Group statistics
        groups = queryset.values('service_group_name').annotate(
            count=Count('id')
        ).order_by('-count')
        
        for group in groups:
            stats['by_group'][group['service_group_name']] = group['count']
        
        return Response(stats)


# URL Configuration
# apps/organization/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # ... existing views ...
    HealthServiceCatalogViewSet,
    SedeHealthServiceViewSet
)

router = DefaultRouter()
# ... existing routes ...
router.register(r'health-service-catalog', HealthServiceCatalogViewSet, basename='health-service-catalog')
router.register(r'sede-health-services', SedeHealthServiceViewSet, basename='sede-health-services')

urlpatterns = [
    path('api/v1/', include(router.urls)),
]
```

## 6. Frontend Integration Plan

### 6.1 Component Architecture

```typescript
// types/healthServices.types.ts

export interface HealthService {
  id: number;
  serviceCode: string;
  serviceName: string;
  serviceGroupCode: string;
  serviceGroupName: string;
  distinctiveNumber: string;
  
  // Modalities
  ambulatory: 'SI' | 'NO' | 'SD';
  hospital: 'SI' | 'NO' | 'SD';
  mobileUnit: 'SI' | 'NO' | 'SD';
  domiciliary: 'SI' | 'NO' | 'SD';
  otherExtramural: 'SI' | 'NO' | 'SD';
  
  // Complexity
  lowComplexity: 'SI' | 'NO' | 'SD';
  mediumComplexity: 'SI' | 'NO' | 'SD';
  highComplexity: 'SI' | 'NO' | 'SD';
  complexityLevel: 'BAJA' | 'MEDIANA' | 'ALTA' | 'SD';
  
  // Dates
  openingDate: string;
  closingDate?: string;
  
  // Status
  isEnabled: boolean;
  observations?: string;
  
  // Metadata
  activeModalities: string[];
  complexityDisplay: string;
  schedule?: Record<string, string>;
  telemedicineModality?: Record<string, boolean>;
  specificities?: Record<string, boolean>;
}

export interface ServiceImportLog {
  id: number;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  servicesCreated: number;
  servicesUpdated: number;
  duration?: string;
  successRate?: string;
  errors: string[];
  warnings: string[];
  createdAt: string;
}

export interface ServiceStatistics {
  totalServices: number;
  enabledServices: number;
  disabledServices: number;
  byGroup: Record<string, number>;
  byComplexity: Record<string, number>;
  byModality: Record<string, number>;
}
```

### 6.2 React Components Structure

```
components/
  healthServices/
    ServicesList/
      ServicesList.tsx
      ServicesTable.tsx
      ServiceFilters.tsx
      ServiceCard.tsx
    
    ServiceDetail/
      ServiceDetailModal.tsx
      ServiceInfo.tsx
      ServiceSchedule.tsx
      ServiceSpecificities.tsx
    
    ServiceImport/
      ServiceImportModal.tsx
      ImportProgress.tsx
      ImportResults.tsx
      ImportHistory.tsx
    
    ServiceManagement/
      ServiceForm.tsx
      ServiceBulkActions.tsx
      ServiceStatistics.tsx
    
    shared/
      ComplexityBadge.tsx
      ModalityTags.tsx
      ServiceGroupIcon.tsx
```

### 6.3 Integration with Existing Sedes Interface

```typescript
// Enhanced SedeDetailModal with Services Tab

import React, { useState, useEffect } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { ServicesList } from '../healthServices/ServicesList/ServicesList';
import { ServiceImportModal } from '../healthServices/ServiceImport/ServiceImportModal';

interface SedeDetailModalProps {
  sede: Sede;
  isOpen: boolean;
  onClose: () => void;
}

export const SedeDetailModal: React.FC<SedeDetailModalProps> = ({
  sede,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [showImportModal, setShowImportModal] = useState(false);
  
  return (
    <Modal isOpen={isOpen} toggle={onClose} size="xl">
      <ModalHeader toggle={onClose}>
        {sede.name}
      </ModalHeader>
      <ModalBody>
        <Nav tabs>
          <NavItem>
            <NavLink
              className={activeTab === 'info' ? 'active' : ''}
              onClick={() => setActiveTab('info')}
            >
              Información General
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={activeTab === 'services' ? 'active' : ''}
              onClick={() => setActiveTab('services')}
            >
              Servicios Habilitados
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={activeTab === 'compliance' ? 'active' : ''}
              onClick={() => setActiveTab('compliance')}
            >
              Cumplimiento
            </NavLink>
          </NavItem>
        </Nav>
        
        <TabContent activeTab={activeTab}>
          <TabPane tabId="info">
            {/* Existing sede info */}
          </TabPane>
          
          <TabPane tabId="services">
            <div className="d-flex justify-content-between mb-3">
              <h5>Servicios de Salud Habilitados</h5>
              <Button
                color="primary"
                size="sm"
                onClick={() => setShowImportModal(true)}
              >
                <i className="ri-upload-2-line me-1" />
                Importar desde REPS
              </Button>
            </div>
            
            <ServicesList headquartersId={sede.id} />
          </TabPane>
          
          <TabPane tabId="compliance">
            {/* Compliance information */}
          </TabPane>
        </TabContent>
      </ModalBody>
      
      {showImportModal && (
        <ServiceImportModal
          headquartersId={sede.id}
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            // Refresh services list
          }}
        />
      )}
    </Modal>
  );
};
```

## 7. Testing Strategy

### 7.1 Unit Tests

```python
# tests/test_health_services.py

import pytest
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.organization.models import SedeHealthService, HealthServiceCatalog
from apps.sogcs.services import REPSServiceImporter

@pytest.mark.django_db
class TestHealthServices(TestCase):
    
    def setUp(self):
        # Create test data
        pass
    
    def test_service_creation(self):
        """Test creating a health service."""
        pass
    
    def test_service_validation(self):
        """Test service validation rules."""
        pass
    
    def test_reps_import(self):
        """Test REPS Excel import."""
        pass
    
    def test_bulk_operations(self):
        """Test bulk enable/disable/delete."""
        pass
    
    def test_service_statistics(self):
        """Test statistics calculation."""
        pass
```

### 7.2 Integration Tests

```python
# tests/test_health_services_integration.py

@pytest.mark.django_db
class TestHealthServicesIntegration(TestCase):
    
    def test_complete_import_workflow(self):
        """Test complete import workflow from Excel to database."""
        pass
    
    def test_api_endpoints(self):
        """Test all API endpoints."""
        pass
    
    def test_permissions(self):
        """Test RBAC permissions."""
        pass
```

### 7.3 E2E Tests

```typescript
// e2e/healthServices.test.ts

describe('Health Services Management', () => {
  it('should import services from REPS Excel', () => {
    // Test import workflow
  });
  
  it('should display services by headquarters', () => {
    // Test service listing
  });
  
  it('should filter and search services', () => {
    // Test filtering capabilities
  });
  
  it('should perform bulk actions', () => {
    // Test bulk operations
  });
});
```

## 8. Migration Plan

### 8.1 Database Migrations

```python
# migrations/0001_add_health_services.py

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('organization', '0012_add_sogcs_sedes'),
    ]
    
    operations = [
        migrations.CreateModel(
            name='HealthServiceCatalog',
            fields=[
                # ... field definitions ...
            ],
        ),
        migrations.CreateModel(
            name='SedeHealthService',
            fields=[
                # ... field definitions ...
            ],
        ),
        migrations.CreateModel(
            name='ServiceImportLog',
            fields=[
                # ... field definitions ...
            ],
        ),
        # Add indexes
        migrations.AddIndex(
            # ... index definitions ...
        ),
    ]
```

### 8.2 Data Migration

```python
# migrations/0002_populate_service_catalog.py

from django.db import migrations

def populate_service_catalog(apps, schema_editor):
    """Populate health service catalog from REPS standards."""
    HealthServiceCatalog = apps.get_model('organization', 'HealthServiceCatalog')
    
    # Add standard services from Resolution 3100/2019
    services = [
        # ... service definitions ...
    ]
    
    for service_data in services:
        HealthServiceCatalog.objects.create(**service_data)

class Migration(migrations.Migration):
    dependencies = [
        ('organization', '0001_add_health_services'),
    ]
    
    operations = [
        migrations.RunPython(populate_service_catalog),
    ]
```

## 9. Performance Considerations

### 9.1 Query Optimization

- Use `select_related` for foreign keys
- Use `prefetch_related` for many-to-many
- Add database indexes on frequently queried fields
- Implement pagination for large datasets
- Cache service catalog data

### 9.2 Import Optimization

- Process Excel files in chunks
- Use bulk_create for batch inserts
- Implement progress tracking
- Add background task processing for large files
- Validate data before database operations

### 9.3 Frontend Optimization

- Implement virtual scrolling for large lists
- Use React.memo for service cards
- Lazy load service details
- Cache API responses
- Debounce search inputs

## 10. Security Considerations

### 10.1 Data Protection

- Validate all Excel input data
- Sanitize file uploads
- Implement file size limits
- Check file content types
- Audit all import operations

### 10.2 Access Control

- RBAC for service management
- Organization-level data isolation
- Audit trail for all changes
- Secure file storage
- Encrypted sensitive data

## 11. Deployment Plan

### Phase 1: Backend Implementation
1. Create Django models
2. Implement import service
3. Create API endpoints
4. Add unit tests
5. Run migrations

### Phase 2: Frontend Development
1. Create React components
2. Integrate with existing UI
3. Implement import interface
4. Add filtering and search
5. Test user workflows

### Phase 3: Testing & Validation
1. Complete test coverage
2. Performance testing
3. Security audit
4. User acceptance testing
5. Documentation

### Phase 4: Production Deployment
1. Deploy to staging
2. Data migration
3. User training
4. Production deployment
5. Monitoring setup

## 12. Documentation

### 12.1 API Documentation

All endpoints will be documented using:
- OpenAPI/Swagger specification
- Postman collection
- Code comments
- README files

### 12.2 User Documentation

- Import guide for REPS Excel files
- Service management manual
- Troubleshooting guide
- Video tutorials

### 12.3 Developer Documentation

- Architecture overview
- Model relationships
- Import process flowchart
- Testing guide
- Deployment guide

## Conclusion

This architecture provides a robust, scalable solution for managing health services according to REPS standards. The design ensures data integrity, performance, and compliance with Colombian health regulations while providing a user-friendly interface for healthcare organizations to manage their enabled services efficiently.