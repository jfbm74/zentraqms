"""
Comando para poblar datos iniciales del sistema de templates organizacionales
ZentraQMS - Sistema de Gestión de Calidad
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from datetime import date, datetime
from apps.organization.models import (
    Sector,
    ServicioHabilitado, 
    TipoComite,
    TipoCargo,
    AreaFuncional,
    TemplateOrganizacional,
    ValidacionSOGCS
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Popula datos iniciales para el sistema de templates organizacionales'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Iniciando carga de datos de templates organizacionales...'))
        
        with transaction.atomic():
            # 1. Crear servicios habilitados
            self.crear_servicios_habilitados()
            
            # 2. Crear tipos de comité
            self.crear_tipos_comite()
            
            # 3. Crear tipos de cargo
            self.crear_tipos_cargo()
            
            # 4. Crear áreas funcionales
            self.crear_areas_funcionales()
            
            # 5. Crear validaciones SOGCS
            self.crear_validaciones_sogcs()
            
            # 6. Crear templates base
            self.crear_templates_base()

        self.stdout.write(self.style.SUCCESS('✅ Datos de templates organizacionales cargados exitosamente'))

    def crear_servicios_habilitados(self):
        """Crea catálogo de servicios habilitados según Res. 3100/2019"""
        self.stdout.write('📋 Creando servicios habilitados...')
        
        servicios_data = [
            # CONSULTA EXTERNA
            {'codigo': '301', 'nombre': 'Medicina General', 'categoria': 'consulta_externa', 'complejidad_minima': 'I'},
            {'codigo': '302', 'nombre': 'Medicina Especializada', 'categoria': 'consulta_externa', 'complejidad_minima': 'II'},
            {'codigo': '303', 'nombre': 'Odontología General', 'categoria': 'consulta_externa', 'complejidad_minima': 'I'},
            {'codigo': '304', 'nombre': 'Odontología Especializada', 'categoria': 'consulta_externa', 'complejidad_minima': 'II'},
            {'codigo': '305', 'nombre': 'Enfermería', 'categoria': 'consulta_externa', 'complejidad_minima': 'I'},
            {'codigo': '306', 'nombre': 'Nutrición y Dietética', 'categoria': 'consulta_externa', 'complejidad_minima': 'I'},
            {'codigo': '307', 'nombre': 'Psicología', 'categoria': 'consulta_externa', 'complejidad_minima': 'I'},
            {'codigo': '308', 'nombre': 'Trabajo Social', 'categoria': 'consulta_externa', 'complejidad_minima': 'I'},
            {'codigo': '309', 'nombre': 'Optometría', 'categoria': 'consulta_externa', 'complejidad_minima': 'I'},
            
            # URGENCIAS
            {'codigo': '501', 'nombre': 'Urgencias Nivel I', 'categoria': 'urgencias', 'complejidad_minima': 'I'},
            {'codigo': '502', 'nombre': 'Urgencias Nivel II', 'categoria': 'urgencias', 'complejidad_minima': 'II'},
            {'codigo': '503', 'nombre': 'Urgencias Nivel III', 'categoria': 'urgencias', 'complejidad_minima': 'III'},
            {'codigo': '504', 'nombre': 'Urgencias Nivel IV', 'categoria': 'urgencias', 'complejidad_minima': 'IV'},
            
            # HOSPITALIZACIÓN
            {'codigo': '601', 'nombre': 'Hospitalización General Adultos', 'categoria': 'hospitalizacion', 'complejidad_minima': 'II'},
            {'codigo': '602', 'nombre': 'Hospitalización General Pediátrica', 'categoria': 'hospitalizacion', 'complejidad_minima': 'II'},
            {'codigo': '603', 'nombre': 'Hospitalización Mental', 'categoria': 'hospitalizacion', 'complejidad_minima': 'II'},
            {'codigo': '604', 'nombre': 'Cuidado Intermedio Adultos', 'categoria': 'hospitalizacion', 'complejidad_minima': 'III'},
            {'codigo': '605', 'nombre': 'Cuidado Intermedio Pediátrico', 'categoria': 'hospitalizacion', 'complejidad_minima': 'III'},
            
            # CIRUGÍA
            {'codigo': '701', 'nombre': 'Cirugía General', 'categoria': 'cirugia', 'complejidad_minima': 'II'},
            {'codigo': '702', 'nombre': 'Cirugía Cardiovascular', 'categoria': 'cirugia', 'complejidad_minima': 'III'},
            {'codigo': '703', 'nombre': 'Cirugía de Tórax', 'categoria': 'cirugia', 'complejidad_minima': 'III'},
            {'codigo': '704', 'nombre': 'Cirugía Neurológica', 'categoria': 'cirugia', 'complejidad_minima': 'III'},
            {'codigo': '705', 'nombre': 'Cirugía Ortopédica', 'categoria': 'cirugia', 'complejidad_minima': 'II'},
            {'codigo': '706', 'nombre': 'Cirugía Plástica', 'categoria': 'cirugia', 'complejidad_minima': 'II'},
            {'codigo': '707', 'nombre': 'Cirugía Urológica', 'categoria': 'cirugia', 'complejidad_minima': 'II'},
            
            # UCI
            {'codigo': '801', 'nombre': 'Cuidado Intensivo Adultos', 'categoria': 'uci', 'complejidad_minima': 'III'},
            {'codigo': '802', 'nombre': 'Cuidado Intensivo Pediátrico', 'categoria': 'uci', 'complejidad_minima': 'III'},
            {'codigo': '803', 'nombre': 'Cuidado Intensivo Neonatal', 'categoria': 'uci', 'complejidad_minima': 'III'},
            {'codigo': '804', 'nombre': 'Cuidado Intensivo Coronario', 'categoria': 'uci', 'complejidad_minima': 'III'},
            
            # APOYO DIAGNÓSTICO
            {'codigo': '901', 'nombre': 'Laboratorio Clínico', 'categoria': 'apoyo_diagnostico', 'complejidad_minima': 'I'},
            {'codigo': '902', 'nombre': 'Patología', 'categoria': 'apoyo_diagnostico', 'complejidad_minima': 'III'},
            {'codigo': '903', 'nombre': 'Imágenes Diagnósticas', 'categoria': 'apoyo_diagnostico', 'complejidad_minima': 'I'},
            {'codigo': '904', 'nombre': 'Hemodinamia', 'categoria': 'apoyo_diagnostico', 'complejidad_minima': 'III'},
            {'codigo': '905', 'nombre': 'Medicina Nuclear', 'categoria': 'apoyo_diagnostico', 'complejidad_minima': 'III'},
            
            # APOYO TERAPÉUTICO
            {'codigo': '1001', 'nombre': 'Fisioterapia', 'categoria': 'apoyo_terapeutico', 'complejidad_minima': 'I'},
            {'codigo': '1002', 'nombre': 'Fonoaudiología', 'categoria': 'apoyo_terapeutico', 'complejidad_minima': 'I'},
            {'codigo': '1003', 'nombre': 'Terapia Ocupacional', 'categoria': 'apoyo_terapeutico', 'complejidad_minima': 'I'},
            {'codigo': '1004', 'nombre': 'Terapia Respiratoria', 'categoria': 'apoyo_terapeutico', 'complejidad_minima': 'II'},
            {'codigo': '1005', 'nombre': 'Radioterapia', 'categoria': 'apoyo_terapeutico', 'complejidad_minima': 'III'},
            {'codigo': '1006', 'nombre': 'Quimioterapia', 'categoria': 'apoyo_terapeutico', 'complejidad_minima': 'III'},
        ]
        
        for servicio_data in servicios_data:
            servicio, created = ServicioHabilitado.objects.get_or_create(
                codigo=servicio_data['codigo'],
                defaults=servicio_data
            )
            if created:
                self.stdout.write(f'  ✅ Creado: {servicio.nombre}')

    def crear_tipos_comite(self):
        """Crea tipos de comité según normativa SOGCS"""
        self.stdout.write('🏛️ Creando tipos de comité...')
        
        comites_data = [
            {
                'codigo': 'seguridad_paciente',
                'nombre': 'Comité de Seguridad del Paciente',
                'descripcion': 'Comité encargado de la gestión de riesgos y seguridad del paciente',
                'base_normativa': 'Resolución 0112 de 2012',
                'periodicidad': 'mensual',
                'obligatorio_nivel_i': True,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True
            },
            {
                'codigo': 'farmacia_terapeutica',
                'nombre': 'Comité de Farmacia y Terapéutica',
                'descripcion': 'Comité de evaluación y seguimiento de medicamentos',
                'base_normativa': 'Resolución 1403 de 2007',
                'periodicidad': 'mensual',
                'obligatorio_nivel_i': True,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True
            },
            {
                'codigo': 'historias_clinicas',
                'nombre': 'Comité de Historias Clínicas',
                'descripcion': 'Comité de evaluación y auditoría de historias clínicas',
                'base_normativa': 'Resolución 1995 de 1999',
                'periodicidad': 'mensual',
                'obligatorio_nivel_i': True,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True
            },
            {
                'codigo': 'tecnico_cientifico',
                'nombre': 'Comité Técnico Científico',
                'descripcion': 'Comité de evaluación técnico-científica y mejoramiento de calidad',
                'base_normativa': 'Resolución 3100 de 2019',
                'periodicidad': 'mensual',
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True
            },
            {
                'codigo': 'infecciones',
                'nombre': 'Comité de Infecciones Asociadas a Atención en Salud (IAAS)',
                'descripcion': 'Comité de prevención y control de infecciones hospitalarias',
                'base_normativa': 'Resolución 3100 de 2019',
                'periodicidad': 'mensual',
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True
            },
            {
                'codigo': 'etica_hospitalaria',
                'nombre': 'Comité de Ética Hospitalaria',
                'descripcion': 'Comité de evaluación ética de casos clínicos y decisiones médicas',
                'base_normativa': 'Resolución 13437 de 1991',
                'periodicidad': 'mensual',
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True
            },
            {
                'codigo': 'mortalidad',
                'nombre': 'Comité de Mortalidad',
                'descripcion': 'Comité de análisis de mortalidad intrahospitalaria',
                'base_normativa': 'Resolución 3100 de 2019',
                'periodicidad': 'mensual',
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': False,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True
            },
            {
                'codigo': 'trasplantes',
                'nombre': 'Comité de Trasplantes',
                'descripcion': 'Comité de coordinación y evaluación de trasplantes',
                'base_normativa': 'Resolución 2640 de 2005',
                'periodicidad': 'mensual',
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': False,
                'obligatorio_nivel_iii': False,
                'obligatorio_nivel_iv': False  # Solo para IPS con trasplantes
            },
            {
                'codigo': 'copasst',
                'nombre': 'COPASST',
                'descripcion': 'Comité Paritario de Seguridad y Salud en el Trabajo',
                'base_normativa': 'Resolución 2013 de 1986',
                'periodicidad': 'mensual',
                'obligatorio_nivel_i': True,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True
            },
            {
                'codigo': 'convivencia_laboral',
                'nombre': 'Comité de Convivencia Laboral',
                'descripcion': 'Comité de prevención, promoción y evaluación del acoso laboral',
                'base_normativa': 'Resolución 0652 de 2012',
                'periodicidad': 'trimestral',
                'obligatorio_nivel_i': True,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True
            }
        ]
        
        for comite_data in comites_data:
            comite, created = TipoComite.objects.get_or_create(
                codigo=comite_data['codigo'],
                defaults=comite_data
            )
            if created:
                self.stdout.write(f'  ✅ Creado: {comite.nombre}')

    def crear_tipos_cargo(self):
        """Crea tipos de cargo según normativa"""
        self.stdout.write('👔 Creando tipos de cargo...')
        
        # Obtener el sector de salud
        try:
            sector_salud = Sector.objects.get(code='HEALTH')
        except Sector.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Sector SALUD no encontrado. Ejecute primero la carga de organigramas.'))
            return
        
        cargos_data = [
            # NIVEL I - BAJA COMPLEJIDAD
            {
                'codigo': 'director_general_i',
                'nombre': 'Director/Gerente General',
                'descripcion': 'Máxima autoridad administrativa de la IPS',
                'perfil_requerido': 'Profesional de la salud con especialización en administración en salud o afines',
                'es_directivo': True,
                'obligatorio_nivel_i': True,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por institución',
                'sector': sector_salud
            },
            {
                'codigo': 'coordinador_medico_i',
                'nombre': 'Coordinador Médico',
                'descripcion': 'Responsable de la coordinación de servicios asistenciales',
                'perfil_requerido': 'Médico con mínimo 2 años de experiencia clínica',
                'es_coordinacion': True,
                'obligatorio_nivel_i': True,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por institución',
                'sector': sector_salud
            },
            {
                'codigo': 'responsable_calidad',
                'nombre': 'Responsable de Calidad',
                'descripcion': 'Responsable del sistema de gestión de calidad y PAMEC',
                'perfil_requerido': 'Profesional con formación en auditoría en salud o gestión de calidad',
                'es_jefatura': True,
                'obligatorio_nivel_i': True,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por institución',
                'sector': sector_salud
            },
            {
                'codigo': 'responsable_administrativo',
                'nombre': 'Responsable Administrativo y Financiero',
                'descripcion': 'Responsable de la gestión administrativa y financiera',
                'perfil_requerido': 'Profesional en administración, contaduría o carreras afines',
                'es_jefatura': True,
                'obligatorio_nivel_i': True,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por institución',
                'sector': sector_salud
            },
            
            # NIVEL II - MEDIANA COMPLEJIDAD (adicionales)
            {
                'codigo': 'subdirector_medico',
                'nombre': 'Subdirector Médico/Científico',
                'descripcion': 'Responsable del área científica y asistencial',
                'perfil_requerido': 'Médico especialista con experiencia administrativa',
                'es_directivo': True,
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por institución',
                'sector': sector_salud
            },
            {
                'codigo': 'jefe_enfermeria',
                'nombre': 'Jefe de Enfermería',
                'descripcion': 'Responsable del servicio de enfermería institucional',
                'perfil_requerido': 'Enfermero profesional con especialización en administración',
                'es_jefatura': True,
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por institución',
                'sector': sector_salud
            },
            {
                'codigo': 'coordinador_urgencias',
                'nombre': 'Coordinador de Urgencias',
                'descripcion': 'Responsable del servicio de urgencias',
                'perfil_requerido': 'Médico especialista en medicina de urgencias o medicina interna',
                'es_coordinacion': True,
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por servicio',
                'sector': sector_salud
            },
            {
                'codigo': 'coordinador_hospitalizacion',
                'nombre': 'Coordinador de Hospitalización',
                'descripcion': 'Responsable de servicios de hospitalización',
                'perfil_requerido': 'Médico especialista con experiencia en hospitalización',
                'es_coordinacion': True,
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por servicio',
                'sector': sector_salud
            },
            {
                'codigo': 'coordinador_cirugia',
                'nombre': 'Coordinador de Cirugía',
                'descripcion': 'Responsable de servicios quirúrgicos',
                'perfil_requerido': 'Médico especialista quirúrgico',
                'es_coordinacion': True,
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': True,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por servicio',
                'sector': sector_salud
            },
            
            # NIVEL III/IV - ALTA COMPLEJIDAD (adicionales)
            {
                'codigo': 'director_calidad_acreditacion',
                'nombre': 'Director de Calidad y Acreditación',
                'descripcion': 'Responsable del sistema integral de calidad y acreditación',
                'perfil_requerido': 'Profesional especialista en gestión de calidad con formación en acreditación',
                'es_directivo': True,
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': False,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por institución',
                'sector': sector_salud
            },
            {
                'codigo': 'coordinador_uci',
                'nombre': 'Coordinador de UCI',
                'descripcion': 'Intensivista coordinador de unidades de cuidado intensivo',
                'perfil_requerido': 'Médico especialista en medicina intensiva',
                'es_coordinacion': True,
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': False,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por unidad',
                'sector': sector_salud
            },
            {
                'codigo': 'coordinador_investigacion',
                'nombre': 'Coordinador de Investigación',
                'descripcion': 'Responsable de programas de investigación y desarrollo',
                'perfil_requerido': 'Profesional con formación en investigación científica',
                'es_coordinacion': True,
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': False,
                'obligatorio_nivel_iii': True,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por institución',
                'sector': sector_salud
            },
            {
                'codigo': 'coordinador_docencia',
                'nombre': 'Coordinador de Docencia-Servicio',
                'descripcion': 'Responsable de programas académicos y formación',
                'perfil_requerido': 'Profesional con formación docente y experiencia académica',
                'es_coordinacion': True,
                'obligatorio_nivel_i': False,
                'obligatorio_nivel_ii': False,
                'obligatorio_nivel_iii': False,
                'obligatorio_nivel_iv': True,
                'ratio_personal': '1 por institución',
                'sector': sector_salud
            }
        ]
        
        for cargo_data in cargos_data:
            cargo, created = TipoCargo.objects.get_or_create(
                codigo=cargo_data['codigo'],
                defaults=cargo_data
            )
            if created:
                self.stdout.write(f'  ✅ Creado: {cargo.nombre}')

    def crear_areas_funcionales(self):
        """Crea áreas funcionales según normativa"""
        self.stdout.write('🏢 Creando áreas funcionales...')
        
        areas_data = [
            # NIVEL I
            {
                'codigo': 'consulta_externa_i',
                'nombre': 'Consulta Externa',
                'descripcion': 'Área de atención ambulatoria y consulta médica',
                'categoria': 'asistencial',
                'obligatoria_nivel_i': True,
                'obligatoria_nivel_ii': True,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'calidad_i',
                'nombre': 'Gestión de Calidad y Seguridad del Paciente',
                'descripcion': 'Área encargada del PAMEC y seguridad del paciente',
                'categoria': 'calidad',
                'obligatoria_nivel_i': True,
                'obligatoria_nivel_ii': True,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'administrativo_i',
                'nombre': 'Área Administrativa',
                'descripcion': 'Gestión administrativa, talento humano y facturación',
                'categoria': 'administrativa',
                'obligatoria_nivel_i': True,
                'obligatoria_nivel_ii': True,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'archivo_clinico',
                'nombre': 'Archivo Clínico',
                'descripcion': 'Gestión y custodia de historias clínicas',
                'categoria': 'apoyo',
                'obligatoria_nivel_i': True,
                'obligatoria_nivel_ii': True,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            
            # NIVEL II (adicionales)
            {
                'codigo': 'urgencias_ii',
                'nombre': 'Urgencias',
                'descripcion': 'Servicio de atención de urgencias 24 horas',
                'categoria': 'asistencial',
                'obligatoria_nivel_i': False,
                'obligatoria_nivel_ii': True,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'hospitalizacion_ii',
                'nombre': 'Hospitalización General',
                'descripcion': 'Servicios de hospitalización médica y quirúrgica',
                'categoria': 'asistencial',
                'obligatoria_nivel_i': False,
                'obligatoria_nivel_ii': True,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'cirugia_ii',
                'nombre': 'Cirugía',
                'descripcion': 'Servicios quirúrgicos ambulatorios y programados',
                'categoria': 'asistencial',
                'obligatoria_nivel_i': False,
                'obligatoria_nivel_ii': True,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'apoyo_diagnostico_ii',
                'nombre': 'Apoyo Diagnóstico',
                'descripcion': 'Laboratorio clínico e imágenes diagnósticas',
                'categoria': 'apoyo',
                'obligatoria_nivel_i': False,
                'obligatoria_nivel_ii': True,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'epidemiologia',
                'nombre': 'Epidemiología',
                'descripcion': 'Vigilancia epidemiológica y análisis de datos de salud',
                'categoria': 'calidad',
                'obligatoria_nivel_i': False,
                'obligatoria_nivel_ii': True,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'auditoria_medica',
                'nombre': 'Auditoría Médica',
                'descripcion': 'Auditoría concurrente y revisión de cuentas médicas',
                'categoria': 'calidad',
                'obligatoria_nivel_i': False,
                'obligatoria_nivel_ii': True,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            
            # NIVEL III/IV (adicionales)
            {
                'codigo': 'uci_iii',
                'nombre': 'Unidad de Cuidados Intensivos',
                'descripcion': 'UCI adultos, pediátrica y neonatal',
                'categoria': 'asistencial',
                'obligatoria_nivel_i': False,
                'obligatoria_nivel_ii': False,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'cirugia_alta_iii',
                'nombre': 'Cirugía de Alta Complejidad',
                'descripcion': 'Servicios quirúrgicos especializados y subespecializados',
                'categoria': 'asistencial',
                'obligatoria_nivel_i': False,
                'obligatoria_nivel_ii': False,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'investigacion_iii',
                'nombre': 'Investigación y Desarrollo',
                'descripcion': 'Programas de investigación científica y desarrollo tecnológico',
                'categoria': 'estrategica',
                'obligatoria_nivel_i': False,
                'obligatoria_nivel_ii': False,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'docencia_iv',
                'nombre': 'Docencia y Educación Médica',
                'descripcion': 'Programas de formación académica y educación continuada',
                'categoria': 'estrategica',
                'obligatoria_nivel_i': False,
                'obligatoria_nivel_ii': False,
                'obligatoria_nivel_iii': False,
                'obligatoria_nivel_iv': True
            },
            {
                'codigo': 'acreditacion_iii',
                'nombre': 'Gestión de Calidad y Acreditación',
                'descripcion': 'Preparación y mantenimiento de procesos de acreditación',
                'categoria': 'calidad',
                'obligatoria_nivel_i': False,
                'obligatoria_nivel_ii': False,
                'obligatoria_nivel_iii': True,
                'obligatoria_nivel_iv': True
            }
        ]
        
        for area_data in areas_data:
            area, created = AreaFuncional.objects.get_or_create(
                codigo=area_data['codigo'],
                defaults=area_data
            )
            if created:
                self.stdout.write(f'  ✅ Creado: {area.nombre}')

    def crear_validaciones_sogcs(self):
        """Crea validaciones SOGCS parametrizables"""
        self.stdout.write('⚖️ Creando validaciones SOGCS...')
        
        validaciones_data = [
            {
                'codigo': 'VAL001',
                'nombre': 'Comité de Seguridad del Paciente Obligatorio',
                'descripcion': 'Toda IPS debe tener conformado el Comité de Seguridad del Paciente',
                'categoria': 'comites',
                'regla_validacion': {
                    'tipo': 'existencia_comite',
                    'comite_codigo': 'seguridad_paciente',
                    'frecuencia_minima': 'mensual'
                },
                'complejidad_aplicable': ['I', 'II', 'III', 'IV'],
                'severidad': 'critica',
                'base_normativa': 'Resolución 0112 de 2012',
                'articulo_norma': 'Artículo 4'
            },
            {
                'codigo': 'VAL002',
                'nombre': 'Director General Obligatorio',
                'descripcion': 'Toda IPS debe tener un Director o Gerente General designado',
                'categoria': 'cargos',
                'regla_validacion': {
                    'tipo': 'existencia_cargo',
                    'cargo_codigo': 'director_general_i',
                    'cantidad_minima': 1,
                    'cantidad_maxima': 1
                },
                'complejidad_aplicable': ['I', 'II', 'III', 'IV'],
                'severidad': 'critica',
                'base_normativa': 'Resolución 3100 de 2019',
                'articulo_norma': 'Artículo 15'
            },
            {
                'codigo': 'VAL003',
                'nombre': 'Área de Calidad Obligatoria',
                'descripcion': 'Toda IPS debe tener un área de gestión de calidad',
                'categoria': 'estructura',
                'regla_validacion': {
                    'tipo': 'existencia_area',
                    'area_codigo': 'calidad_i',
                    'con_responsable': True
                },
                'complejidad_aplicable': ['I', 'II', 'III', 'IV'],
                'severidad': 'critica',
                'base_normativa': 'Decreto 780 de 2016',
                'articulo_norma': 'Artículo 2.5.3.2.4.2'
            },
            {
                'codigo': 'VAL004',
                'nombre': 'PAMEC Documentado',
                'descripcion': 'La IPS debe tener documentado el Programa de Auditoria para el Mejoramiento de la Calidad',
                'categoria': 'documentos',
                'regla_validacion': {
                    'tipo': 'existencia_documento',
                    'documento_tipo': 'PAMEC',
                    'estado': 'vigente'
                },
                'complejidad_aplicable': ['I', 'II', 'III', 'IV'],
                'severidad': 'alta',
                'base_normativa': 'Decreto 780 de 2016',
                'articulo_norma': 'Artículo 2.5.3.2.4.1'
            },
            {
                'codigo': 'VAL005',
                'nombre': 'Comité Técnico Científico Nivel II+',
                'descripcion': 'IPS nivel II y superior deben tener Comité Técnico Científico',
                'categoria': 'comites',
                'regla_validacion': {
                    'tipo': 'existencia_comite',
                    'comite_codigo': 'tecnico_cientifico',
                    'frecuencia_minima': 'mensual'
                },
                'complejidad_aplicable': ['II', 'III', 'IV'],
                'severidad': 'critica',
                'base_normativa': 'Resolución 3100 de 2019',
                'articulo_norma': 'Artículo 18'
            },
            {
                'codigo': 'VAL006',
                'nombre': 'Ratio Enfermería Hospitalización',
                'descripcion': 'Relación mínima enfermera-paciente en hospitalización según nivel',
                'categoria': 'cargos',
                'regla_validacion': {
                    'tipo': 'ratio_personal',
                    'servicio': 'hospitalizacion',
                    'cargo': 'enfermera',
                    'ratio_nivel_ii': '1:15',
                    'ratio_nivel_iii': '1:10',
                    'ratio_nivel_iv': '1:8'
                },
                'complejidad_aplicable': ['II', 'III', 'IV'],
                'severidad': 'alta',
                'base_normativa': 'Resolución 3100 de 2019',
                'articulo_norma': 'Anexo Técnico 3'
            }
        ]
        
        for validacion_data in validaciones_data:
            validacion, created = ValidacionSOGCS.objects.get_or_create(
                codigo=validacion_data['codigo'],
                defaults=validacion_data
            )
            if created:
                self.stdout.write(f'  ✅ Creado: {validacion.nombre}')

    def crear_templates_base(self):
        """Crea templates base para cada nivel de complejidad"""
        self.stdout.write('📋 Creando templates base...')
        
        # Obtener el sector de salud
        try:
            sector_salud = Sector.objects.get(code='HEALTH')
        except Sector.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Sector SALUD no encontrado'))
            return
        
        # Obtener usuario admin para crear templates
        try:
            admin_user = User.objects.get(email='admin@zentraqms.com')
        except User.DoesNotExist:
            admin_user = None
        
        templates_data = [
            {
                'nombre': 'IPS Nivel I - Consulta Externa Básica',
                'descripcion': 'Template base para IPS de baja complejidad con servicios básicos de consulta externa',
                'complejidad_ips': 'I',
                'sector': sector_salud,
                'es_oficial': True,
                'es_base': True,
                'version': '1.0',
                'fecha_vigencia_desde': date.today(),
                'estructura_organizacional': {
                    'direccion': {
                        'director_general': {
                            'cargo': 'director_general_i',
                            'obligatorio': True,
                            'perfil': 'Profesional de salud con especialización administrativa'
                        }
                    },
                    'coordinaciones': {
                        'coordinador_medico': {
                            'cargo': 'coordinador_medico_i',
                            'obligatorio': True,
                            'perfil': 'Médico con mínimo 2 años experiencia'
                        },
                        'responsable_calidad': {
                            'cargo': 'responsable_calidad',
                            'obligatorio': True,
                            'perfil': 'Profesional con formación en auditoría'
                        },
                        'responsable_administrativo': {
                            'cargo': 'responsable_administrativo',
                            'obligatorio': True,
                            'perfil': 'Administrador o contador'
                        }
                    },
                    'areas_funcionales': [
                        'consulta_externa_i',
                        'calidad_i',
                        'administrativo_i',
                        'archivo_clinico'
                    ],
                    'comites_obligatorios': [
                        'seguridad_paciente',
                        'farmacia_terapeutica', 
                        'historias_clinicas',
                        'copasst',
                        'convivencia_laboral'
                    ]
                },
                'validaciones_sogcs': {
                    'validaciones_aplicables': ['VAL001', 'VAL002', 'VAL003', 'VAL004'],
                    'indicadores_minimos': [
                        'oportunidad_cita_especializada',
                        'satisfaccion_usuario',
                        'proporcion_cancelacion_cirugia',
                        'tasa_eventos_adversos',
                        'cumplimiento_guias_atencion'
                    ]
                },
                'indicadores_minimos': [
                    'oportunidad_cita_especializada',
                    'satisfaccion_usuario',
                    'proporcion_cancelacion_cirugia',
                    'tasa_eventos_adversos',
                    'cumplimiento_guias_atencion'
                ],
                'creado_por': admin_user,
                'aprobado_por': admin_user,
                'fecha_aprobacion': datetime.now()
            },
            {
                'nombre': 'IPS Nivel II - Hospital General',
                'descripcion': 'Template para IPS de mediana complejidad con servicios de hospitalización y urgencias',
                'complejidad_ips': 'II',
                'sector': sector_salud,
                'es_oficial': True,
                'es_base': True,
                'version': '1.0',
                'fecha_vigencia_desde': date.today(),
                'estructura_organizacional': {
                    'direccion': {
                        'director_general': {
                            'cargo': 'director_general_i',
                            'obligatorio': True
                        },
                        'subdirector_medico': {
                            'cargo': 'subdirector_medico',
                            'obligatorio': True
                        }
                    },
                    'coordinaciones': {
                        'jefe_enfermeria': {
                            'cargo': 'jefe_enfermeria',
                            'obligatorio': True
                        },
                        'coordinador_urgencias': {
                            'cargo': 'coordinador_urgencias',
                            'obligatorio': True
                        },
                        'coordinador_hospitalizacion': {
                            'cargo': 'coordinador_hospitalizacion',
                            'obligatorio': True
                        },
                        'coordinador_cirugia': {
                            'cargo': 'coordinador_cirugia',
                            'obligatorio': True
                        }
                    },
                    'areas_funcionales': [
                        'consulta_externa_i',
                        'urgencias_ii',
                        'hospitalizacion_ii',
                        'cirugia_ii',
                        'apoyo_diagnostico_ii',
                        'calidad_i',
                        'epidemiologia',
                        'auditoria_medica',
                        'administrativo_i',
                        'archivo_clinico'
                    ],
                    'comites_obligatorios': [
                        'tecnico_cientifico',
                        'seguridad_paciente',
                        'infecciones',
                        'farmacia_terapeutica',
                        'historias_clinicas',
                        'etica_hospitalaria',
                        'copasst',
                        'convivencia_laboral'
                    ]
                },
                'validaciones_sogcs': {
                    'validaciones_aplicables': ['VAL001', 'VAL002', 'VAL003', 'VAL004', 'VAL005', 'VAL006'],
                    'indicadores_minimos': [
                        'mortalidad_intrahospitalaria',
                        'tasa_infeccion_hospitalaria',
                        'tiempo_espera_triage_ii',
                        'proporcion_reingresos_72h',
                        'oportunidad_cirugia_programada',
                        'satisfaccion_usuario',
                        'tasa_eventos_adversos',
                        'proporcion_cesarea',
                        'oportunidad_consulta_especializada',
                        'adherencia_guias_manejo'
                    ]
                },
                'indicadores_minimos': [
                    'mortalidad_intrahospitalaria',
                    'tasa_infeccion_hospitalaria',
                    'tiempo_espera_triage_ii',
                    'proporcion_reingresos_72h',
                    'oportunidad_cirugia_programada',
                    'satisfaccion_usuario',
                    'tasa_eventos_adversos',
                    'proporcion_cesarea',
                    'oportunidad_consulta_especializada',
                    'adherencia_guias_manejo'
                ],
                'creado_por': admin_user,
                'aprobado_por': admin_user,
                'fecha_aprobacion': datetime.now()
            },
            {
                'nombre': 'IPS Nivel III - Hospital de Alta Complejidad',
                'descripcion': 'Template para IPS de alta complejidad con UCI y servicios especializados',
                'complejidad_ips': 'III',
                'sector': sector_salud,
                'es_oficial': True,
                'es_base': True,
                'version': '1.0',
                'fecha_vigencia_desde': date.today(),
                'estructura_organizacional': {
                    'direccion': {
                        'director_general': {
                            'cargo': 'director_general_i',
                            'obligatorio': True
                        },
                        'subdirector_medico': {
                            'cargo': 'subdirector_medico',
                            'obligatorio': True
                        },
                        'director_calidad_acreditacion': {
                            'cargo': 'director_calidad_acreditacion',
                            'obligatorio': True
                        }
                    },
                    'coordinaciones': {
                        'jefe_enfermeria': {
                            'cargo': 'jefe_enfermeria',
                            'obligatorio': True
                        },
                        'coordinador_urgencias': {
                            'cargo': 'coordinador_urgencias',
                            'obligatorio': True
                        },
                        'coordinador_hospitalizacion': {
                            'cargo': 'coordinador_hospitalizacion',
                            'obligatorio': True
                        },
                        'coordinador_cirugia': {
                            'cargo': 'coordinador_cirugia',
                            'obligatorio': True
                        },
                        'coordinador_uci': {
                            'cargo': 'coordinador_uci',
                            'obligatorio': True
                        },
                        'coordinador_investigacion': {
                            'cargo': 'coordinador_investigacion',
                            'obligatorio': True
                        }
                    },
                    'areas_funcionales': [
                        'consulta_externa_i',
                        'urgencias_ii',
                        'hospitalizacion_ii',
                        'cirugia_ii',
                        'uci_iii',
                        'cirugia_alta_iii',
                        'apoyo_diagnostico_ii',
                        'calidad_i',
                        'acreditacion_iii',
                        'investigacion_iii',
                        'epidemiologia',
                        'auditoria_medica',
                        'administrativo_i',
                        'archivo_clinico'
                    ],
                    'comites_obligatorios': [
                        'tecnico_cientifico',
                        'seguridad_paciente',
                        'infecciones',
                        'mortalidad',
                        'farmacia_terapeutica',
                        'historias_clinicas',
                        'etica_hospitalaria',
                        'copasst',
                        'convivencia_laboral'
                    ]
                },
                'validaciones_sogcs': {
                    'validaciones_aplicables': ['VAL001', 'VAL002', 'VAL003', 'VAL004', 'VAL005', 'VAL006'],
                    'preparacion_acreditacion': True,
                    'gestion_riesgo_avanzada': True,
                    'indicadores_internacionales': True
                },
                'indicadores_minimos': [
                    'mortalidad_ajustada_riesgo',
                    'mortalidad_uci',
                    'neumonia_asociada_ventilador',
                    'infeccion_torrente_sanguineo',
                    'tasa_infeccion_sitio_operatorio',
                    'tiempo_espera_triage_i',
                    'oportunidad_trombolisis',
                    'proporcion_reingresos_30_dias',
                    'oportunidad_intervencion_coronaria',
                    'satisfaccion_usuario_hospitalizado',
                    'tasa_eventos_centinela',
                    'adherencia_bundles_seguridad',
                    'oportunidad_cirugia_oncologica',
                    'tiempo_reporte_anatomia_patologica',
                    'indicadores_benchmarking_internacional'
                ],
                'creado_por': admin_user,
                'aprobado_por': admin_user,
                'fecha_aprobacion': datetime.now()
            }
        ]
        
        for template_data in templates_data:
            template, created = TemplateOrganizacional.objects.get_or_create(
                nombre=template_data['nombre'],
                complejidad_ips=template_data['complejidad_ips'],
                sector=template_data['sector'],
                version=template_data['version'],
                defaults=template_data
            )
            if created:
                self.stdout.write(f'  ✅ Creado: {template.nombre}')

        self.stdout.write('🎯 ¡Templates base creados exitosamente!')