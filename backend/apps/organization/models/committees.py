"""
Committees Models for ZentraQMS

This module implements the institutional committee management system:
- Committee definitions (mandatory and voluntary)
- Committee members and their roles
- Meeting schedules and attendance tracking
- Committee decision records and follow-up

Supports sector-specific mandatory committees as per:
- SOGCS for health sector (Patient Safety, Quality, etc.)
- Education sector (Academic Council, Curriculum, etc.)
- Manufacturing sector (COPASST, Environmental, etc.)
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
# from django.contrib.postgres.fields import JSONField  # Deprecated in Django 3.1+
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.conf import settings

from apps.common.models import FullBaseModel


class Comite(FullBaseModel):
    """
    Institutional committees (mandatory and voluntary).
    
    Manages committee structure, governance, and operational requirements
    based on sector-specific normative requirements.
    """
    
    COMMITTEE_TYPE_CHOICES = [
        ('MANDATORY', 'Obligatorio por Normativa'),
        ('VOLUNTARY', 'Voluntario'),
        ('SECTORAL', 'Requerido por Sector'),
        ('TEMPORARY', 'Temporal'),
        ('AD_HOC', 'Ad Hoc'),
    ]
    
    MEETING_FREQUENCY_CHOICES = [
        ('WEEKLY', 'Semanal'),
        ('BIWEEKLY', 'Quincenal'),
        ('MONTHLY', 'Mensual'),
        ('BIMONTHLY', 'Bimestral'),
        ('QUARTERLY', 'Trimestral'),
        ('SEMIANNUAL', 'Semestral'),
        ('ANNUAL', 'Anual'),
        ('AS_NEEDED', 'Según necesidad'),
        ('EXTRAORDINARY', 'Extraordinaria'),
    ]
    
    organizational_chart = models.ForeignKey(
        'organization.OrganizationalChart',
        on_delete=models.CASCADE,
        related_name='committees',
        verbose_name=_("organigrama")
    )
    
    code = models.CharField(
        _("código del comité"),
        max_length=30,
        help_text=_("Código único del comité (ej: COM-CAL, COM-SEG-PAC)")
    )
    
    name = models.CharField(
        _("nombre del comité"),
        max_length=200,
        help_text=_("Nombre completo del comité")
    )
    
    committee_type = models.CharField(
        _("tipo de comité"),
        max_length=20,
        choices=COMMITTEE_TYPE_CHOICES,
        help_text=_("Clasificación del tipo de comité")
    )
    
    # Normative requirements
    normative_requirement = models.CharField(
        _("normativa que lo exige"),
        max_length=200,
        blank=True,
        help_text=_("Normativa específica que exige este comité")
    )
    
    sector_specific = models.BooleanField(
        _("específico del sector"),
        default=False,
        help_text=_("Indica si es específico para el sector de la organización")
    )
    
    # Committee leadership
    chairperson = models.ForeignKey(
        'organization.Cargo',
        on_delete=models.PROTECT,
        related_name='committees_chaired',
        verbose_name=_("presidente"),
        help_text=_("Cargo que preside el comité")
    )
    
    secretary = models.ForeignKey(
        'organization.Cargo',
        on_delete=models.PROTECT,
        related_name='committees_as_secretary',
        verbose_name=_("secretario"),
        help_text=_("Cargo que ejerce como secretario del comité")
    )
    
    # Meeting configuration
    meeting_frequency = models.CharField(
        _("frecuencia de reuniones"),
        max_length=20,
        choices=MEETING_FREQUENCY_CHOICES,
        help_text=_("Frecuencia de reuniones ordinarias")
    )
    
    minimum_quorum = models.IntegerField(
        _("quórum mínimo"),
        validators=[MinValueValidator(2), MaxValueValidator(50)],
        help_text=_("Número mínimo de miembros para sesionar")
    )
    
    # Committee functions and responsibilities
    functions = models.JSONField(
        default=list,
        help_text=_("""Lista de funciones del comité:
        [
            "Evaluar el cumplimiento de políticas de calidad",
            "Proponer mejoras en procesos asistenciales",
            "Revisar indicadores de gestión"
        ]""")
    )
    
    decision_powers = models.JSONField(
        default=list,
        help_text=_("""Tipos de decisiones que puede tomar:
        [
            "Aprobar protocolos",
            "Recomendar acciones correctivas",
            "Evaluar casos específicos"
        ]""")
    )
    
    # Operational configuration
    generates_minutes = models.BooleanField(
        _("genera actas"),
        default=True,
        help_text=_("Indica si debe generar actas de reunión")
    )
    
    reports_to_board = models.BooleanField(
        _("reporta a junta directiva"),
        default=False,
        help_text=_("Indica si reporta directamente a junta directiva")
    )
    
    has_decision_authority = models.BooleanField(
        _("tiene autoridad de decisión"),
        default=True,
        help_text=_("Indica si puede tomar decisiones vinculantes")
    )
    
    # Committee scope and areas of influence
    scope_areas = models.ManyToManyField(
        'organization.Area',
        blank=True,
        related_name='oversight_committees',
        verbose_name=_("áreas bajo su alcance"),
        help_text=_("Áreas organizacionales bajo el alcance del comité")
    )
    
    # related_processes = models.ManyToManyField(
    #     'processes.Process',  # Will be available when processes module exists
    #     blank=True,
    #     related_name='oversight_committees',
    #     verbose_name=_("procesos relacionados"),
    #     help_text=_("Procesos institucionales relacionados con el comité")
    # )
    
    # Meeting logistics
    usual_meeting_location = models.CharField(
        _("lugar habitual de reunión"),
        max_length=200,
        blank=True,
        help_text=_("Ubicación típica para las reuniones")
    )
    
    usual_meeting_time = models.TimeField(
        _("hora habitual de reunión"),
        null=True,
        blank=True,
        help_text=_("Hora típica para las reuniones")
    )
    
    meeting_duration_hours = models.DecimalField(
        _("duración típica (horas)"),
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0.5), MaxValueValidator(12.0)],
        help_text=_("Duración típica de las reuniones en horas")
    )
    
    # Temporary committee configuration
    start_date = models.DateField(
        _("fecha de inicio"),
        null=True,
        blank=True,
        help_text=_("Fecha de inicio para comités temporales")
    )
    
    end_date = models.DateField(
        _("fecha de finalización"),
        null=True,
        blank=True,
        help_text=_("Fecha de finalización para comités temporales")
    )
    
    class Meta:
        db_table = 'org_committee'
        ordering = ['committee_type', 'code']
        verbose_name = _("Comité Institucional")
        verbose_name_plural = _("Comités Institucionales")
        indexes = [
            models.Index(fields=['organizational_chart', 'committee_type']),
            models.Index(fields=['committee_type', 'is_active']),
            models.Index(fields=['sector_specific', 'normative_requirement']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['organizational_chart', 'code'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_committee_code_per_chart'
            ),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def clean(self):
        """Validate committee data."""
        super().clean()
        
        # Validate temporary committee dates
        if self.committee_type == 'TEMPORARY':
            if not self.start_date or not self.end_date:
                raise ValidationError({
                    'end_date': _("Los comités temporales requieren fechas de inicio y fin")
                })
            
            if self.start_date >= self.end_date:
                raise ValidationError({
                    'end_date': _("La fecha de fin debe ser posterior a la de inicio")
                })
        
        # Validate quorum doesn't exceed total possible members
        current_members = self.members.filter(
            end_date__isnull=True,
            is_active=True
        ).count()
        
        if current_members > 0 and self.minimum_quorum > current_members:
            raise ValidationError({
                'minimum_quorum': _(
                    f"El quórum mínimo ({self.minimum_quorum}) no puede ser mayor "
                    f"que el número de miembros actuales ({current_members})"
                )
            })

    def get_active_members(self):
        """Get current active members of the committee."""
        return self.members.filter(
            end_date__isnull=True,
            is_active=True
        ).select_related('position', 'position__area')

    def get_voting_members(self):
        """Get members with voting rights."""
        return self.get_active_members().filter(has_voting_rights=True)

    def has_quorum(self, present_members_count=None):
        """Check if committee has quorum for meetings."""
        if present_members_count is None:
            present_members_count = self.get_active_members().count()
        return present_members_count >= self.minimum_quorum

    def get_next_meeting_date(self):
        """Calculate next meeting date based on frequency."""
        from datetime import timedelta
        
        last_meeting = self.meetings.filter(
            meeting_date__lte=timezone.now().date()
        ).order_by('-meeting_date').first()
        
        if not last_meeting:
            return timezone.now().date()
        
        frequency_days = {
            'WEEKLY': 7,
            'BIWEEKLY': 14,
            'MONTHLY': 30,
            'BIMONTHLY': 60,
            'QUARTERLY': 90,
            'SEMIANNUAL': 180,
            'ANNUAL': 365,
        }
        
        days_to_add = frequency_days.get(self.meeting_frequency, 30)
        return last_meeting.meeting_date + timedelta(days=days_to_add)

    def is_currently_active(self):
        """Check if committee is currently active."""
        if not self.is_active:
            return False
        
        if self.committee_type == 'TEMPORARY':
            today = timezone.now().date()
            return (
                self.start_date <= today <= self.end_date if 
                self.start_date and self.end_date else False
            )
        
        return True

    def get_required_reports(self):
        """Get list of required reports for this committee."""
        reports = []
        
        if self.reports_to_board:
            reports.append('board_report')
        
        if self.committee_type == 'MANDATORY':
            reports.append('compliance_report')
        
        if self.normative_requirement:
            reports.append('normative_compliance_report')
        
        return reports


class MiembroComite(FullBaseModel):
    """
    Committee members and their participation details.
    
    Tracks member roles, participation periods, and voting rights
    within institutional committees.
    """
    
    PARTICIPATION_TYPE_CHOICES = [
        ('PERMANENT', 'Miembro Permanente'),
        ('INVITED', 'Invitado'),
        ('ADVISOR', 'Asesor'),
        ('OBSERVER', 'Observador'),
        ('SUBSTITUTE', 'Suplente'),
        ('EX_OFFICIO', 'Miembro Ex Officio'),
    ]
    
    committee = models.ForeignKey(
        Comite,
        on_delete=models.CASCADE,
        related_name='members',
        verbose_name=_("comité")
    )
    
    position = models.ForeignKey(
        'organization.Cargo',
        on_delete=models.CASCADE,
        related_name='committee_memberships',
        verbose_name=_("cargo")
    )
    
    participation_type = models.CharField(
        _("tipo de participación"),
        max_length=20,
        choices=PARTICIPATION_TYPE_CHOICES,
        default='PERMANENT',
        help_text=_("Tipo de participación en el comité")
    )
    
    # Membership period
    start_date = models.DateField(
        _("fecha de vinculación"),
        help_text=_("Fecha de vinculación al comité")
    )
    
    end_date = models.DateField(
        _("fecha de desvinculación"),
        null=True,
        blank=True,
        help_text=_("Fecha de desvinculación del comité")
    )
    
    # Member rights and responsibilities
    has_voting_rights = models.BooleanField(
        _("tiene derecho a voto"),
        default=True,
        help_text=_("Indica si tiene derecho a voto en decisiones")
    )
    
    can_convene_meetings = models.BooleanField(
        _("puede convocar reuniones"),
        default=False,
        help_text=_("Indica si puede convocar reuniones del comité")
    )
    
    is_substitute_for = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='substitutes',
        verbose_name=_("suplente de"),
        help_text=_("Miembro al cual suple cuando sea necesario")
    )
    
    # Specific roles within committee
    committee_role = models.CharField(
        _("rol en el comité"),
        max_length=100,
        blank=True,
        help_text=_("Rol específico dentro del comité (ej: Coordinador de subcomisión)")
    )
    
    areas_of_expertise = models.JSONField(
        default=list,
        blank=True,
        help_text=_("""Áreas de expertise que aporta al comité:
        ["Gestión clínica", "Sistemas de información", "Auditoría médica"]""")
    )
    
    # Appointment details
    appointed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='committee_appointments',
        verbose_name=_("nombrado por"),
        help_text=_("Usuario que realizó el nombramiento")
    )
    
    appointment_document = models.FileField(
        _("documento de nombramiento"),
        upload_to='committees/appointments/%Y/%m/',
        null=True,
        blank=True,
        help_text=_("Documento oficial de nombramiento")
    )
    
    # Performance tracking
    meetings_attended = models.IntegerField(
        _("reuniones asistidas"),
        default=0,
        help_text=_("Número de reuniones a las que ha asistido")
    )
    
    meetings_missed = models.IntegerField(
        _("reuniones no asistidas"),
        default=0,
        help_text=_("Número de reuniones perdidas")
    )
    
    last_attendance_date = models.DateField(
        _("última asistencia"),
        null=True,
        blank=True,
        help_text=_("Fecha de la última reunión a la que asistió")
    )
    
    class Meta:
        db_table = 'org_committee_member'
        ordering = ['committee', 'participation_type', 'start_date']
        verbose_name = _("Miembro de Comité")
        verbose_name_plural = _("Miembros de Comité")
        indexes = [
            models.Index(fields=['committee', 'participation_type']),
            models.Index(fields=['position', 'is_active']),
            models.Index(fields=['start_date', 'end_date']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['committee', 'position'],
                condition=models.Q(end_date__isnull=True) & models.Q(deleted_at__isnull=True),
                name='unique_active_member_per_committee'
            ),
        ]

    def __str__(self):
        return f"{self.committee.name} - {self.position.name}"

    def clean(self):
        """Validate member data."""
        super().clean()
        
        # Validate membership period
        if self.end_date and self.start_date and self.end_date <= self.start_date:
            raise ValidationError({
                'end_date': _("La fecha de desvinculación debe ser posterior a la de vinculación")
            })
        
        # Observers can't have voting rights
        if self.participation_type == 'OBSERVER' and self.has_voting_rights:
            raise ValidationError({
                'has_voting_rights': _("Los observadores no pueden tener derecho a voto")
            })
        
        # Validate substitute relationship
        if self.is_substitute_for:
            if self.is_substitute_for.committee != self.committee:
                raise ValidationError({
                    'is_substitute_for': _("El suplente debe pertenecer al mismo comité")
                })
            
            if self.is_substitute_for == self:
                raise ValidationError({
                    'is_substitute_for': _("Un miembro no puede ser suplente de sí mismo")
                })

    def is_currently_active(self):
        """Check if membership is currently active."""
        if not self.is_active:
            return False
        
        today = timezone.now().date()
        if self.end_date and today > self.end_date:
            return False
        
        return today >= self.start_date

    def get_attendance_rate(self):
        """Calculate attendance rate as percentage."""
        total_meetings = self.meetings_attended + self.meetings_missed
        if total_meetings == 0:
            return 0
        return (self.meetings_attended / total_meetings) * 100

    def record_attendance(self, meeting_date, attended=True):
        """Record attendance to a meeting."""
        if attended:
            self.meetings_attended += 1
            self.last_attendance_date = meeting_date
        else:
            self.meetings_missed += 1
        
        self.save(update_fields=['meetings_attended', 'meetings_missed', 'last_attendance_date'])

    def terminate_membership(self, end_date=None, reason=None, user=None):
        """Terminate committee membership."""
        self.end_date = end_date or timezone.now().date()
        if user:
            self.updated_by = user
        
        self.save(update_fields=['end_date', 'updated_by', 'updated_at'])
        
        # Log the termination
        from ..models.base import AuditLog
        AuditLog.log_change(
            instance=self,
            action=AuditLog.ACTION_UPDATE,
            user=user,
            old_values={'end_date': None},
            new_values={'end_date': str(self.end_date)},
            changed_fields=['end_date'],
            reason=f"Terminación de membresía: {reason or ''}"
        )

    def get_membership_duration_days(self):
        """Get membership duration in days."""
        end_date = self.end_date or timezone.now().date()
        return (end_date - self.start_date).days

    def extend_membership(self, new_end_date=None, user=None):
        """Extend or make membership permanent."""
        old_end_date = self.end_date
        self.end_date = new_end_date  # None for permanent
        if user:
            self.updated_by = user
        
        self.save(update_fields=['end_date', 'updated_by', 'updated_at'])
        
        # Log the extension
        from ..models.base import AuditLog
        AuditLog.log_change(
            instance=self,
            action=AuditLog.ACTION_UPDATE,
            user=user,
            old_values={'end_date': str(old_end_date) if old_end_date else None},
            new_values={'end_date': str(new_end_date) if new_end_date else None},
            changed_fields=['end_date'],
            reason="Extensión de membresía"
        )


class CommitteeMeeting(FullBaseModel):
    """
    Committee meeting records and documentation.
    
    Tracks meeting details, attendance, decisions, and follow-up actions.
    """
    
    MEETING_TYPE_CHOICES = [
        ('ORDINARY', 'Ordinaria'),
        ('EXTRAORDINARY', 'Extraordinaria'),
        ('EMERGENCY', 'Emergencia'),
        ('SPECIAL', 'Especial'),
    ]
    
    MEETING_STATUS_CHOICES = [
        ('SCHEDULED', 'Programada'),
        ('IN_PROGRESS', 'En Curso'),
        ('COMPLETED', 'Completada'),
        ('CANCELLED', 'Cancelada'),
        ('POSTPONED', 'Pospuesta'),
    ]
    
    committee = models.ForeignKey(
        Comite,
        on_delete=models.CASCADE,
        related_name='meetings',
        verbose_name=_("comité")
    )
    
    meeting_number = models.IntegerField(
        _("número de reunión"),
        help_text=_("Número consecutivo de la reunión")
    )
    
    meeting_type = models.CharField(
        _("tipo de reunión"),
        max_length=20,
        choices=MEETING_TYPE_CHOICES,
        default='ORDINARY'
    )
    
    meeting_date = models.DateField(
        _("fecha de reunión"),
        help_text=_("Fecha programada para la reunión")
    )
    
    start_time = models.TimeField(
        _("hora de inicio"),
        help_text=_("Hora de inicio de la reunión")
    )
    
    end_time = models.TimeField(
        _("hora de finalización"),
        null=True,
        blank=True,
        help_text=_("Hora de finalización de la reunión")
    )
    
    location = models.CharField(
        _("ubicación"),
        max_length=200,
        help_text=_("Lugar donde se realizó la reunión")
    )
    
    status = models.CharField(
        _("estado"),
        max_length=20,
        choices=MEETING_STATUS_CHOICES,
        default='SCHEDULED'
    )
    
    # Attendance tracking
    attendees = models.ManyToManyField(
        MiembroComite,
        through='MeetingAttendance',
        related_name='attended_meetings',
        verbose_name=_("asistentes")
    )
    
    quorum_achieved = models.BooleanField(
        _("quórum alcanzado"),
        default=False,
        help_text=_("Indica si se logró el quórum para la reunión")
    )
    
    # Meeting documentation
    agenda = models.TextField(
        _("agenda"),
        blank=True,
        help_text=_("Agenda de temas a tratar en la reunión")
    )
    
    minutes = models.TextField(
        _("acta de reunión"),
        blank=True,
        help_text=_("Acta detallada de la reunión")
    )
    
    decisions_made = models.JSONField(
        default=list,
        blank=True,
        help_text=_("""Decisiones tomadas en la reunión:
        [
            {
                "decision": "Aprobar nuevo protocolo",
                "vote_result": "unanimous",
                "implementation_date": "2024-03-01"
            }
        ]""")
    )
    
    action_items = models.JSONField(
        default=list,
        blank=True,
        help_text=_("""Tareas y compromisos asignados:
        [
            {
                "task": "Revisar protocolo",
                "assigned_to": "Director Médico",
                "due_date": "2024-02-15",
                "status": "pending"
            }
        ]""")
    )
    
    # Meeting files
    supporting_documents = models.FileField(
        _("documentos de apoyo"),
        upload_to='committees/meetings/%Y/%m/',
        null=True,
        blank=True,
        help_text=_("Documentos presentados en la reunión")
    )
    
    signed_minutes = models.FileField(
        _("acta firmada"),
        upload_to='committees/signed_minutes/%Y/%m/',
        null=True,
        blank=True,
        help_text=_("Acta firmada por el presidente y secretario")
    )
    
    class Meta:
        db_table = 'org_committee_meeting'
        ordering = ['-meeting_date', '-meeting_number']
        verbose_name = _("Reunión de Comité")
        verbose_name_plural = _("Reuniones de Comité")
        indexes = [
            models.Index(fields=['committee', 'meeting_date']),
            models.Index(fields=['meeting_date', 'status']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['committee', 'meeting_number'],
                name='unique_meeting_number_per_committee'
            ),
        ]

    def __str__(self):
        return f"{self.committee.name} - Reunión #{self.meeting_number}"


class MeetingAttendance(FullBaseModel):
    """
    Meeting attendance tracking for committee members.
    """
    
    ATTENDANCE_STATUS_CHOICES = [
        ('PRESENT', 'Presente'),
        ('ABSENT', 'Ausente'),
        ('EXCUSED', 'Excusado'),
        ('LATE', 'Llegada tardía'),
        ('LEFT_EARLY', 'Salida temprana'),
    ]
    
    meeting = models.ForeignKey(
        CommitteeMeeting,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    
    member = models.ForeignKey(
        MiembroComite,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    
    attendance_status = models.CharField(
        max_length=20,
        choices=ATTENDANCE_STATUS_CHOICES,
        default='PRESENT'
    )
    
    arrival_time = models.TimeField(null=True, blank=True)
    departure_time = models.TimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'org_meeting_attendance'
        unique_together = [['meeting', 'member']]