#!/usr/bin/env python
"""
Script to create example sector templates for Technology and Health sectors.
"""
import os
import sys
import django
from datetime import datetime

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.organization.models import SectorTemplate


def create_technology_templates():
    """Create technology sector templates."""
    
    # Template 1: Software Development
    tech_basic_data = {
        "procesos": [
            {
                "nombre": "Desarrollo de Software",
                "codigo": "DEV-001",
                "descripcion": "Proceso de desarrollo de aplicaciones y sistemas",
                "owner": "CTO",
                "tipo": "core"
            },
            {
                "nombre": "Control de Versiones",
                "codigo": "DEV-002", 
                "descripcion": "Gestión de versiones de código fuente",
                "owner": "Líder Técnico",
                "tipo": "support"
            },
            {
                "nombre": "Testing y QA",
                "codigo": "QA-001",
                "descripcion": "Proceso de pruebas y aseguramiento de calidad",
                "owner": "QA Manager",
                "tipo": "core"
            },
            {
                "nombre": "DevOps y Deployment",
                "codigo": "OPS-001",
                "descripcion": "Proceso de integración continua y despliegue",
                "owner": "DevOps Engineer",
                "tipo": "support"
            },
            {
                "nombre": "Gestión de Proyectos TI",
                "codigo": "PM-001",
                "descripcion": "Metodología ágil para proyectos de software",
                "owner": "Project Manager",
                "tipo": "management"
            }
        ],
        "indicadores": [
            {
                "nombre": "Velocidad de Desarrollo",
                "codigo": "KPI-DEV-001",
                "descripcion": "Story points completados por sprint",
                "formula": "Story Points Completados / Sprint",
                "frecuencia": "semanal",
                "meta": "≥ 20 story points",
                "responsable": "Scrum Master"
            },
            {
                "nombre": "Cobertura de Testing",
                "codigo": "KPI-QA-001",
                "descripcion": "Porcentaje de código cubierto por pruebas",
                "formula": "(Líneas Probadas / Total Líneas) * 100",
                "frecuencia": "diaria",
                "meta": "≥ 80%",
                "responsable": "QA Lead"
            },
            {
                "nombre": "Tiempo de Despliegue",
                "codigo": "KPI-OPS-001",
                "descripcion": "Tiempo promedio de deployment a producción",
                "formula": "Promedio tiempo deploy",
                "frecuencia": "mensual",
                "meta": "≤ 15 minutos",
                "responsable": "DevOps Team"
            },
            {
                "nombre": "Disponibilidad del Sistema",
                "codigo": "KPI-OPS-002",
                "descripcion": "Uptime del sistema en producción",
                "formula": "(Tiempo Activo / Tiempo Total) * 100",
                "frecuencia": "mensual",
                "meta": "≥ 99.9%",
                "responsable": "Infrastructure Team"
            }
        ],
        "documentos": [
            {
                "tipo": "procedimiento",
                "nombre": "Procedimiento de Desarrollo Ágil",
                "codigo": "PROC-DEV-001",
                "version": "1.0",
                "aplicable_a": ["Desarrollo de Software"]
            },
            {
                "tipo": "instructivo",
                "nombre": "Guía de Código Limpio",
                "codigo": "INST-DEV-001", 
                "version": "1.0",
                "aplicable_a": ["Desarrollo de Software"]
            },
            {
                "tipo": "procedimiento",
                "nombre": "Proceso de Testing",
                "codigo": "PROC-QA-001",
                "version": "1.0",
                "aplicable_a": ["Testing y QA"]
            },
            {
                "tipo": "manual",
                "nombre": "Manual de Deployment",
                "codigo": "MAN-OPS-001",
                "version": "1.0",
                "aplicable_a": ["DevOps y Deployment"]
            }
        ],
        "roles": [
            {
                "nombre": "Desarrollador Senior",
                "codigo": "DEV-SR",
                "responsabilidades": ["Desarrollo de features", "Code review", "Mentoring"],
                "procesos": ["DEV-001", "DEV-002"]
            },
            {
                "nombre": "QA Engineer", 
                "codigo": "QA-ENG",
                "responsabilidades": ["Testing automatizado", "Testing manual", "Reporte de bugs"],
                "procesos": ["QA-001"]
            },
            {
                "nombre": "DevOps Engineer",
                "codigo": "DEVOPS",
                "responsabilidades": ["CI/CD", "Infrastructure", "Monitoring"],
                "procesos": ["OPS-001"]
            }
        ]
    }
    
    # Create Technology Basic Template
    tech_basic, created = SectorTemplate.objects.get_or_create(
        sector='tecnologia',
        nombre_template='Template Básico Tecnología',
        version='1.0',
        defaults={
            'descripcion': 'Template básico para empresas de desarrollo de software. Incluye procesos esenciales de desarrollo ágil, testing, DevOps y gestión de proyectos TI.',
            'data_json': tech_basic_data,
        }
    )
    
    if created:
        print(f"✅ Creado: {tech_basic.nombre_template}")
    else:
        print(f"ℹ️  Ya existe: {tech_basic.nombre_template}")
    
    # Template 2: Software Enterprise
    tech_enterprise_data = {
        **tech_basic_data,  # Include all basic elements
        "procesos": tech_basic_data["procesos"] + [
            {
                "nombre": "Arquitectura de Software",
                "codigo": "ARCH-001",
                "descripcion": "Diseño y definición de arquitectura de sistemas",
                "owner": "Arquitecto de Software",
                "tipo": "core"
            },
            {
                "nombre": "Seguridad de Aplicaciones",
                "codigo": "SEC-001",
                "descripcion": "Implementación de seguridad en desarrollo",
                "owner": "Security Officer",
                "tipo": "core"
            },
            {
                "nombre": "Gestión de Incidentes TI",
                "codigo": "INC-001",
                "descripcion": "Respuesta y resolución de incidentes",
                "owner": "Operations Manager",
                "tipo": "support"
            }
        ],
        "indicadores": tech_basic_data["indicadores"] + [
            {
                "nombre": "MTTR (Mean Time to Recovery)",
                "codigo": "KPI-INC-001",
                "descripcion": "Tiempo promedio de recuperación de incidentes",
                "formula": "Suma tiempo resolución / Número incidentes",
                "frecuencia": "mensual",
                "meta": "≤ 4 horas",
                "responsable": "Incident Manager"
            },
            {
                "nombre": "Vulnerabilidades Críticas",
                "codigo": "KPI-SEC-001",
                "descripcion": "Número de vulnerabilidades críticas abiertas",
                "formula": "Count vulnerabilidades críticas",
                "frecuencia": "semanal",
                "meta": "= 0",
                "responsable": "Security Team"
            }
        ]
    }
    
    tech_enterprise, created = SectorTemplate.objects.get_or_create(
        sector='tecnologia',
        nombre_template='Template Enterprise Tecnología',
        version='1.0',
        defaults={
            'descripcion': 'Template avanzado para empresas de tecnología de gran escala. Incluye arquitectura, seguridad, gestión de incidentes y procesos empresariales.',
            'data_json': tech_enterprise_data,
        }
    )
    
    if created:
        print(f"✅ Creado: {tech_enterprise.nombre_template}")
    else:
        print(f"ℹ️  Ya existe: {tech_enterprise.nombre_template}")


def create_health_templates():
    """Create health sector templates."""
    
    # Template 1: Health Basic
    health_basic_data = {
        "procesos": [
            {
                "nombre": "Atención al Paciente",
                "codigo": "MED-001",
                "descripcion": "Proceso de atención médica y cuidado del paciente",
                "owner": "Director Médico",
                "tipo": "core"
            },
            {
                "nombre": "Gestión de Historia Clínica",
                "codigo": "MED-002",
                "descripcion": "Manejo y custodia de historias clínicas",
                "owner": "Jefe de Archivo",
                "tipo": "core"
            },
            {
                "nombre": "Control de Infecciones",
                "codigo": "INF-001",
                "descripcion": "Prevención y control de infecciones nosocomiales",
                "owner": "Comité de Infecciones",
                "tipo": "core"
            },
            {
                "nombre": "Gestión Farmacológica",
                "codigo": "FARM-001",
                "descripcion": "Administración y control de medicamentos",
                "owner": "Jefe de Farmacia",
                "tipo": "support"
            },
            {
                "nombre": "Seguridad del Paciente",
                "codigo": "SEG-001",
                "descripcion": "Identificación y prevención de eventos adversos",
                "owner": "Coordinador Seguridad",
                "tipo": "core"
            },
            {
                "nombre": "Gestión de Residuos Hospitalarios",
                "codigo": "RES-001",
                "descripcion": "Manejo seguro de residuos biológicos y peligrosos",
                "owner": "Responsable Ambiental",
                "tipo": "support"
            }
        ],
        "indicadores": [
            {
                "nombre": "Tiempo de Espera Consulta",
                "codigo": "KPI-MED-001",
                "descripcion": "Tiempo promedio de espera para consulta médica",
                "formula": "Promedio tiempo espera",
                "frecuencia": "mensual",
                "meta": "≤ 30 minutos",
                "responsable": "Coordinador Consulta Externa"
            },
            {
                "nombre": "Satisfacción del Paciente",
                "codigo": "KPI-PAC-001",
                "descripcion": "Nivel de satisfacción de pacientes atendidos",
                "formula": "(Pacientes Satisfechos / Total Pacientes) * 100",
                "frecuencia": "mensual",
                "meta": "≥ 85%",
                "responsable": "Coordinador Calidad"
            },
            {
                "nombre": "Tasa de Infección Nosocomial",
                "codigo": "KPI-INF-001",
                "descripcion": "Porcentaje de infecciones adquiridas en el hospital",
                "formula": "(Infecciones Nosocomiales / Total Ingresos) * 100",
                "frecuencia": "mensual",
                "meta": "≤ 2%",
                "responsable": "Comité de Infecciones"
            },
            {
                "nombre": "Disponibilidad de Medicamentos",
                "codigo": "KPI-FARM-001",
                "descripcion": "Porcentaje de disponibilidad de medicamentos esenciales",
                "formula": "(Medicamentos Disponibles / Total Requeridos) * 100",
                "frecuencia": "semanal",
                "meta": "≥ 95%",
                "responsable": "Jefe de Farmacia"
            },
            {
                "nombre": "Eventos Adversos",
                "codigo": "KPI-SEG-001",
                "descripcion": "Número de eventos adversos reportados por mes",
                "formula": "Count eventos adversos",
                "frecuencia": "mensual",
                "meta": "Tendencia decreciente",
                "responsable": "Coordinador Seguridad"
            }
        ],
        "documentos": [
            {
                "tipo": "protocolo",
                "nombre": "Protocolo de Atención al Paciente",
                "codigo": "PROT-MED-001",
                "version": "2.0",
                "aplicable_a": ["Atención al Paciente"]
            },
            {
                "tipo": "procedimiento", 
                "nombre": "Manejo de Historia Clínica",
                "codigo": "PROC-HC-001",
                "version": "1.0",
                "aplicable_a": ["Gestión de Historia Clínica"]
            },
            {
                "tipo": "protocolo",
                "nombre": "Protocolo de Bioseguridad",
                "codigo": "PROT-BIO-001",
                "version": "3.0",
                "aplicable_a": ["Control de Infecciones", "Seguridad del Paciente"]
            },
            {
                "tipo": "manual",
                "nombre": "Manual de Farmacia Hospitalaria",
                "codigo": "MAN-FARM-001",
                "version": "1.0",
                "aplicable_a": ["Gestión Farmacológica"]
            },
            {
                "tipo": "guía",
                "nombre": "Guía de Manejo de Residuos",
                "codigo": "GUIA-RES-001",
                "version": "2.0",
                "aplicable_a": ["Gestión de Residuos Hospitalarios"]
            }
        ],
        "roles": [
            {
                "nombre": "Médico Especialista",
                "codigo": "MED-ESP",
                "responsabilidades": ["Diagnóstico", "Tratamiento", "Seguimiento"],
                "procesos": ["MED-001", "MED-002", "SEG-001"]
            },
            {
                "nombre": "Enfermera Jefe",
                "codigo": "ENF-JEFE",
                "responsabilidades": ["Coordinación enfermería", "Cuidado paciente", "Supervisión"],
                "procesos": ["MED-001", "INF-001", "SEG-001"]
            },
            {
                "nombre": "Farmacéutico Clínico",
                "codigo": "FARM-CLI",
                "responsabilidades": ["Dispensación", "Farmacovigilancia", "Asesoría terapéutica"],
                "procesos": ["FARM-001"]
            },
            {
                "nombre": "Coordinador de Calidad",
                "codigo": "CAL-COORD",
                "responsabilidades": ["Auditorías internas", "Mejora continua", "Indicadores"],
                "procesos": ["SEG-001", "INF-001"]
            }
        ]
    }
    
    # Create Health Basic Template
    health_basic, created = SectorTemplate.objects.get_or_create(
        sector='salud',
        nombre_template='Template Básico Salud',
        version='1.0',
        defaults={
            'descripcion': 'Template básico para instituciones de salud. Incluye procesos esenciales de atención al paciente, control de infecciones, seguridad y gestión farmacológica.',
            'data_json': health_basic_data,
        }
    )
    
    if created:
        print(f"✅ Creado: {health_basic.nombre_template}")
    else:
        print(f"ℹ️  Ya existe: {health_basic.nombre_template}")
    
    # Template 2: Hospital Avanzado
    health_advanced_data = {
        **health_basic_data,  # Include all basic elements
        "procesos": health_basic_data["procesos"] + [
            {
                "nombre": "Cirugía Ambulatoria",
                "codigo": "CIR-001",
                "descripcion": "Proceso de cirugías de corta estancia",
                "owner": "Jefe de Cirugía",
                "tipo": "core"
            },
            {
                "nombre": "Medicina Crítica",
                "codigo": "UCI-001",
                "descripcion": "Atención de pacientes en estado crítico",
                "owner": "Jefe UCI",
                "tipo": "core"
            },
            {
                "nombre": "Investigación Clínica",
                "codigo": "INV-001",
                "descripcion": "Desarrollo de investigación en salud",
                "owner": "Director Investigación",
                "tipo": "support"
            },
            {
                "nombre": "Telemedicina",
                "codigo": "TEL-001",
                "descripcion": "Atención médica remota",
                "owner": "Coordinador Telemedicina",
                "tipo": "support"
            }
        ],
        "indicadores": health_basic_data["indicadores"] + [
            {
                "nombre": "Mortalidad Hospitalaria",
                "codigo": "KPI-MORT-001",
                "descripcion": "Tasa de mortalidad intrahospitalaria",
                "formula": "(Muertes / Total Egresos) * 1000",
                "frecuencia": "mensual",
                "meta": "≤ 5‰",
                "responsable": "Director Médico"
            },
            {
                "nombre": "Ocupación UCI",
                "codigo": "KPI-UCI-001",
                "descripcion": "Porcentaje de ocupación de camas UCI",
                "formula": "(Días Cama Ocupada / Días Cama Disponible) * 100",
                "frecuencia": "diaria",
                "meta": "75-85%",
                "responsable": "Jefe UCI"
            }
        ]
    }
    
    health_advanced, created = SectorTemplate.objects.get_or_create(
        sector='salud',
        nombre_template='Template Hospital Avanzado',
        version='1.0',
        defaults={
            'descripcion': 'Template avanzado para hospitales de alta complejidad. Incluye cirugía, medicina crítica, investigación clínica y telemedicina.',
            'data_json': health_advanced_data,
        }
    )
    
    if created:
        print(f"✅ Creado: {health_advanced.nombre_template}")
    else:
        print(f"ℹ️  Ya existe: {health_advanced.nombre_template}")


def main():
    """Main execution function."""
    print("🏥 Creando plantillas de sector para ZentraQMS...")
    print("=" * 50)
    
    print("\n💻 Creando templates para Tecnología...")
    create_technology_templates()
    
    print("\n🏥 Creando templates para Salud...")
    create_health_templates()
    
    print("\n" + "=" * 50)
    
    # Show summary
    total_templates = SectorTemplate.objects.filter(is_active=True).count()
    tech_templates = SectorTemplate.objects.filter(sector='tecnologia', is_active=True).count()
    health_templates = SectorTemplate.objects.filter(sector='salud', is_active=True).count()
    
    print(f"📊 Resumen de templates creados:")
    print(f"   🔹 Total templates activos: {total_templates}")
    print(f"   💻 Templates Tecnología: {tech_templates}")
    print(f"   🏥 Templates Salud: {health_templates}")
    
    print("\n✅ Script completado exitosamente!")
    print("\nPuedes verificar los templates en:")
    print("   - Admin: http://localhost:8000/admin/organization/sectortemplate/")
    print("   - API: http://localhost:8000/api/v1/sector-templates/")


if __name__ == '__main__':
    main()