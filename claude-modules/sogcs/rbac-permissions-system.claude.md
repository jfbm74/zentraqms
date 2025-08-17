# 🔐 Sistema RBAC para SOGCS - Especificación de Permisos

## 📋 Información General

**Componente**: Sistema de Permisos y Roles para SOGCS  
**Objetivo**: Definir matriz completa de permisos granulares para el módulo SOGCS  
**Cumplimiento**: Resolution 3100/2019, Decree 780/2016, ISO 9001:2015  
**Integración**: Sistema RBAC existente de ZentraQMS  

## 🎯 Principios Fundamentales

### Principios de Seguridad
1. **Principio de Menor Privilegio**: Usuarios solo acceden a funciones necesarias para su rol
2. **Separación de Responsabilidades**: Funciones críticas requieren múltiples personas
3. **Trazabilidad Completa**: Todas las acciones quedan registradas en audit trail
4. **Delegación Controlada**: Responsables pueden delegar con límites temporales
5. **Validación Jerárquica**: Acciones críticas requieren aprobación superior

### Principios Regulatorios
1. **Responsabilidad Nominal**: Cada acción tiene un responsable identificado
2. **Cadena de Custodia**: Documentos tienen propietario y custodio definidos
3. **Revisión Independiente**: Auditores no pueden auditar procesos que gestionan
4. **Escalamiento Obligatorio**: Incumplimientos críticos se escalan automáticamente

## 🏗️ Arquitectura de Permisos

### Estructura Jerárquica

```typescript
interface SOGCSPermissionStructure {
  // Módulo padre
  sogcs: {
    // Configuración general
    configuration: {
      view: Permission;
      edit: Permission;
      approve: Permission;
      activate: Permission;
    };
    
    // Dashboard y reportes
    dashboard: {
      view_general: Permission;
      view_detailed: Permission;
      export: Permission;
    };
    
    // Gestión de responsables
    responsables: {
      view: Permission;
      assign: Permission;
      modify: Permission;
      delegate: Permission;
    };
  };
  
  // Submódulos SOGCS
  suh: SUHPermissions;
  pamec: PAMECPermissions;
  sic: SICPermissions;
  sua: SUAPermissions;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: PermissionAction;
  scope: PermissionScope;
  conditions: PermissionCondition[];
  delegation: DelegationConfig;
  audit: AuditConfig;
}

enum PermissionAction {
  CREATE = 'create',
  READ = 'read', 
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUBMIT = 'submit',
  REVIEW = 'review',
  EXPORT = 'export',
  IMPORT = 'import',
  CONFIGURE = 'configure',
  EXECUTE = 'execute'
}

enum PermissionScope {
  GLOBAL = 'global',           // Toda la organización
  ORGANIZATION = 'organization', // Organización específica
  SERVICE = 'service',         // Servicio específico
  PROCESS = 'process',         // Proceso específico
  DOCUMENT = 'document',       // Documento específico
  PERSONAL = 'personal'        // Solo recursos propios
}
```

## 👥 Roles SOGCS Específicos

### Roles Principales

```typescript
interface SOGCSRoles {
  // Roles estratégicos
  SOGCS_DIRECTOR: SOGCSRole;
  QUALITY_MANAGER: SOGCSRole;
  
  // Roles por componente
  SUH_COORDINATOR: SOGCSRole;
  PAMEC_COORDINATOR: SOGCSRole;
  SIC_COORDINATOR: SOGCSRole;
  SUA_COORDINATOR: SOGCSRole;
  
  // Roles operativos
  QUALITY_AUDITOR: SOGCSRole;
  PROCESS_OWNER: SOGCSRole;
  SERVICE_COORDINATOR: SOGCSRole;
  
  // Roles de apoyo
  DOCUMENTATION_SPECIALIST: SOGCSRole;
  DATA_ANALYST: SOGCSRole;
  COMPLIANCE_OFFICER: SOGCSRole;
}

interface SOGCSRole {
  id: string;
  name: string;
  description: string;
  level: RoleLevel;
  permissions: string[];
  requiredCertifications: string[];
  delegationLimits: DelegationLimits;
  reportingStructure: ReportingConfig;
}

enum RoleLevel {
  STRATEGIC = 1,    // Director SOGCS, Gerente Calidad
  TACTICAL = 2,     // Coordinadores de componentes
  OPERATIONAL = 3,  // Auditores, especialistas
  SUPPORT = 4       // Analistas, documentalistas
}
```

### Matriz de Roles y Responsabilidades

```typescript
const ROLE_PERMISSION_MATRIX: Record<string, string[]> = {
  SOGCS_DIRECTOR: [
    'sogcs.configuration.approve',
    'sogcs.configuration.activate',
    'sogcs.dashboard.view_detailed',
    'sogcs.responsables.assign',
    'suh.autoevaluacion.approve',
    'pamec.programa.approve',
    'sic.indicadores.approve',
    'sua.proceso.approve'
  ],
  
  QUALITY_MANAGER: [
    'sogcs.configuration.edit',
    'sogcs.dashboard.view_general',
    'sogcs.responsables.modify',
    'suh.configuracion.edit',
    'pamec.configuracion.edit',
    'sic.configuracion.edit'
  ],
  
  SUH_COORDINATOR: [
    'suh.autoevaluacion.create',
    'suh.autoevaluacion.edit',
    'suh.autoevaluacion.submit',
    'suh.evidencias.manage',
    'suh.planes_mejora.create',
    'suh.seguimiento.execute'
  ],
  
  PAMEC_COORDINATOR: [
    'pamec.programa.create',
    'pamec.programa.edit',
    'pamec.auditorias.schedule',
    'pamec.hallazgos.manage',
    'pamec.planes_mejora.review'
  ],
  
  QUALITY_AUDITOR: [
    'pamec.auditorias.execute',
    'pamec.hallazgos.register',
    'pamec.evidencias.collect',
    'suh.verificacion.execute'
  ],
  
  PROCESS_OWNER: [
    'pamec.proceso.view',
    'pamec.proceso.update',
    'pamec.evidencias.provide',
    'suh.autoevaluacion.participate'
  ]
};
```

## 🔍 Permisos Detallados por Submódulo

### SUH (Sistema Único de Habilitación)

```typescript
interface SUHPermissions {
  // Configuración SUH
  configuracion: {
    'suh.config.view': Permission;
    'suh.config.edit': Permission;
    'suh.config.approve': Permission;
  };
  
  // Estándares SUH
  estandares: {
    'suh.estandares.view': Permission;
    'suh.estandares.customize': Permission;
    'suh.estandares.activate': Permission;
  };
  
  // Autoevaluación
  autoevaluacion: {
    'suh.autoevaluacion.create': Permission;
    'suh.autoevaluacion.edit': Permission;
    'suh.autoevaluacion.submit': Permission;
    'suh.autoevaluacion.review': Permission;
    'suh.autoevaluacion.approve': Permission;
    'suh.autoevaluacion.reject': Permission;
    'suh.autoevaluacion.reopen': Permission;
  };
  
  // Evidencias
  evidencias: {
    'suh.evidencias.upload': Permission;
    'suh.evidencias.view': Permission;
    'suh.evidencias.download': Permission;
    'suh.evidencias.delete': Permission;
    'suh.evidencias.approve': Permission;
  };
  
  // Planes de mejoramiento
  planes_mejora: {
    'suh.planes.create': Permission;
    'suh.planes.edit': Permission;
    'suh.planes.submit': Permission;
    'suh.planes.approve': Permission;
    'suh.planes.execute': Permission;
    'suh.planes.close': Permission;
  };
  
  // Seguimiento
  seguimiento: {
    'suh.seguimiento.view': Permission;
    'suh.seguimiento.execute': Permission;
    'suh.seguimiento.report': Permission;
  };
  
  // Reportes SUH
  reportes: {
    'suh.reportes.generate': Permission;
    'suh.reportes.export': Permission;
    'suh.reportes.share': Permission;
  };
}
```

### PAMEC (Programa de Auditoría)

```typescript
interface PAMECPermissions {
  // Programa PAMEC
  programa: {
    'pamec.programa.create': Permission;
    'pamec.programa.edit': Permission;
    'pamec.programa.approve': Permission;
    'pamec.programa.activate': Permission;
  };
  
  // Planificación de auditorías
  planificacion: {
    'pamec.plan.create': Permission;
    'pamec.plan.edit': Permission;
    'pamec.plan.approve': Permission;
    'pamec.cronograma.manage': Permission;
  };
  
  // Ejecución de auditorías
  auditorias: {
    'pamec.auditoria.create': Permission;
    'pamec.auditoria.assign': Permission;
    'pamec.auditoria.execute': Permission;
    'pamec.auditoria.suspend': Permission;
    'pamec.auditoria.close': Permission;
  };
  
  // Equipo auditor
  equipo: {
    'pamec.equipo.manage': Permission;
    'pamec.auditor.assign': Permission;
    'pamec.auditor.certify': Permission;
  };
  
  // Hallazgos
  hallazgos: {
    'pamec.hallazgo.register': Permission;
    'pamec.hallazgo.classify': Permission;
    'pamec.hallazgo.approve': Permission;
    'pamec.hallazgo.close': Permission;
  };
  
  // Planes de mejoramiento
  planes_mejora: {
    'pamec.plan_mejora.create': Permission;
    'pamec.plan_mejora.review': Permission;
    'pamec.plan_mejora.approve': Permission;
    'pamec.plan_mejora.follow': Permission;
  };
  
  // Reportes PAMEC
  reportes: {
    'pamec.reportes.generate': Permission;
    'pamec.reportes.directivo': Permission;
    'pamec.reportes.regulador': Permission;
  };
}
```

### SIC (Sistema de Información para la Calidad)

```typescript
interface SICPermissions {
  // Configuración indicadores
  configuracion: {
    'sic.config.view': Permission;
    'sic.config.edit': Permission;
    'sic.indicadores.select': Permission;
  };
  
  // Captura de datos
  datos: {
    'sic.datos.capture': Permission;
    'sic.datos.validate': Permission;
    'sic.datos.approve': Permission;
    'sic.datos.import': Permission;
  };
  
  // Análisis y reportes
  analisis: {
    'sic.analisis.execute': Permission;
    'sic.tendencias.view': Permission;
    'sic.comparativos.generate': Permission;
  };
  
  // Reportes SIC
  reportes: {
    'sic.reportes.generate': Permission;
    'sic.reportes.automating': Permission;
    'sic.reportes.supersalud': Permission;
  };
}
```

### SUA (Sistema Único de Acreditación)

```typescript
interface SUAPermissions {
  // Proceso de acreditación
  proceso: {
    'sua.proceso.initiate': Permission;
    'sua.proceso.manage': Permission;
    'sua.proceso.submit': Permission;
  };
  
  // Estándares de acreditación
  estandares: {
    'sua.estandares.view': Permission;
    'sua.estandares.evaluate': Permission;
    'sua.evidencias.manage': Permission;
  };
  
  // Visita de verificación
  verificacion: {
    'sua.visita.prepare': Permission;
    'sua.visita.coordinate': Permission;
    'sua.respuesta.manage': Permission;
  };
}
```

## ⚙️ Condiciones y Restricciones

### Condiciones de Acceso

```typescript
interface PermissionCondition {
  type: ConditionType;
  parameter: string;
  operator: ConditionOperator;
  value: any;
  errorMessage: string;
}

enum ConditionType {
  TIME_BASED = 'time_based',           // Horarios específicos
  LOCATION_BASED = 'location_based',   // IP/ubicación
  WORKFLOW_STATE = 'workflow_state',   // Estado del proceso
  APPROVAL_REQUIRED = 'approval_required', // Requiere aprobación
  DUAL_CONTROL = 'dual_control',       // Requiere dos personas
  CERTIFICATION = 'certification',     // Requiere certificación
  EXPERIENCE = 'experience',           // Años de experiencia
  ORGANIZATION = 'organization',       // Organización específica
  SERVICE = 'service',                 // Servicio específico
  TEMPORAL = 'temporal'                // Vigencia temporal
}

enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  BETWEEN = 'between'
}
```

### Ejemplos de Condiciones

```typescript
const PERMISSION_CONDITIONS: Record<string, PermissionCondition[]> = {
  'suh.autoevaluacion.approve': [
    {
      type: ConditionType.CERTIFICATION,
      parameter: 'quality_management',
      operator: ConditionOperator.EQUALS,
      value: true,
      errorMessage: 'Requiere certificación en gestión de calidad'
    },
    {
      type: ConditionType.WORKFLOW_STATE,
      parameter: 'autoevaluacion.estado',
      operator: ConditionOperator.EQUALS,
      value: 'SUBMITTED',
      errorMessage: 'Solo se pueden aprobar autoevaluaciones enviadas'
    }
  ],
  
  'pamec.auditoria.execute': [
    {
      type: ConditionType.DUAL_CONTROL,
      parameter: 'second_auditor',
      operator: ConditionOperator.NOT_EQUALS,
      value: 'self',
      errorMessage: 'Requiere segundo auditor diferente'
    },
    {
      type: ConditionType.EXPERIENCE,
      parameter: 'audit_experience_years',
      operator: ConditionOperator.GREATER_THAN,
      value: 2,
      errorMessage: 'Requiere mínimo 2 años de experiencia en auditoría'
    }
  ],
  
  'sogcs.configuration.activate': [
    {
      type: ConditionType.APPROVAL_REQUIRED,
      parameter: 'quality_manager_approval',
      operator: ConditionOperator.EQUALS,
      value: true,
      errorMessage: 'Requiere aprobación del Gerente de Calidad'
    },
    {
      type: ConditionType.WORKFLOW_STATE,
      parameter: 'setup_wizard.completion',
      operator: ConditionOperator.EQUALS,
      value: 100,
      errorMessage: 'Wizard de configuración debe estar 100% completo'
    }
  ]
};
```

## 🔄 Delegación de Permisos

### Configuración de Delegación

```typescript
interface DelegationConfig {
  allowed: boolean;
  maxDuration: number;           // días
  requiresApproval: boolean;
  approvers: string[];          // roles que pueden aprobar
  restrictions: DelegationRestriction[];
  auditRequired: boolean;
  notificationRequired: boolean;
}

interface DelegationRestriction {
  type: 'temporal' | 'scope' | 'condition';
  description: string;
  parameters: Record<string, any>;
}

interface PermissionDelegation {
  id: string;
  delegator: User;
  delegate: User;
  permissions: string[];
  startDate: Date;
  endDate: Date;
  reason: string;
  approver?: User;
  status: DelegationStatus;
  conditions: DelegationCondition[];
  auditTrail: DelegationAudit[];
}

enum DelegationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  REJECTED = 'rejected'
}
```

### Matriz de Delegación

```typescript
const DELEGATION_MATRIX: Record<string, DelegationConfig> = {
  'suh.autoevaluacion.create': {
    allowed: true,
    maxDuration: 30,
    requiresApproval: false,
    approvers: [],
    restrictions: [
      {
        type: 'scope',
        description: 'Solo servicios asignados al delegador',
        parameters: { scope: 'assigned_services' }
      }
    ],
    auditRequired: true,
    notificationRequired: true
  },
  
  'pamec.auditoria.execute': {
    allowed: true,
    maxDuration: 15,
    requiresApproval: true,
    approvers: ['PAMEC_COORDINATOR', 'QUALITY_MANAGER'],
    restrictions: [
      {
        type: 'condition',
        description: 'Delegado debe tener certificación de auditor',
        parameters: { required_certification: 'auditor_interno' }
      }
    ],
    auditRequired: true,
    notificationRequired: true
  },
  
  'sogcs.configuration.approve': {
    allowed: false,
    maxDuration: 0,
    requiresApproval: false,
    approvers: [],
    restrictions: [],
    auditRequired: false,
    notificationRequired: false
  }
};
```

## 📊 Audit Trail y Trazabilidad

### Registro de Acciones

```typescript
interface SOGCSAuditEntry {
  id: string;
  timestamp: Date;
  user: User;
  action: string;
  resource: AuditResource;
  permission: string;
  result: AuditResult;
  details: AuditDetails;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  organizationId: string;
}

interface AuditResource {
  type: string;              // 'autoevaluacion', 'auditoria', etc.
  id: string;               // ID del recurso
  name: string;             // Nombre descriptivo
  previousState?: any;      // Estado anterior (para updates)
  newState?: any;          // Estado nuevo (para updates)
}

interface AuditResult {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  warningMessages: string[];
  affectedRecords: number;
}

interface AuditDetails {
  module: string;           // 'SUH', 'PAMEC', etc.
  subModule?: string;       // Submódulo específico
  workflow?: string;        // Flujo de trabajo
  approvals?: ApprovalDetail[];
  delegations?: DelegationDetail[];
  notifications?: NotificationDetail[];
}
```

### Reportes de Auditoría

```typescript
interface AuditReport {
  id: string;
  type: AuditReportType;
  period: DateRange;
  scope: AuditScope;
  filters: AuditFilter[];
  data: AuditReportData;
  generatedBy: User;
  generatedAt: Date;
  format: 'PDF' | 'EXCEL' | 'JSON';
}

enum AuditReportType {
  ACCESS_LOG = 'access_log',
  PERMISSION_USAGE = 'permission_usage',
  DELEGATION_REPORT = 'delegation_report',
  COMPLIANCE_REPORT = 'compliance_report',
  SECURITY_INCIDENTS = 'security_incidents'
}

interface AuditScope {
  users?: string[];
  roles?: string[];
  permissions?: string[];
  modules?: string[];
  organizations?: string[];
  services?: string[];
}
```

## 🚨 Alertas y Notificaciones

### Sistema de Alertas

```typescript
interface SOGCSAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: AlertSource;
  affectedUsers: string[];
  triggers: AlertTrigger[];
  actions: AlertAction[];
  status: AlertStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: User;
}

enum AlertType {
  PERMISSION_VIOLATION = 'permission_violation',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DELEGATION_EXPIRED = 'delegation_expired',
  APPROVAL_PENDING = 'approval_pending',
  COMPLIANCE_BREACH = 'compliance_breach',
  SYSTEM_CONFIGURATION = 'system_configuration'
}

enum AlertSeverity {
  CRITICAL = 'critical',    // Requiere acción inmediata
  HIGH = 'high',           // Requiere acción en 4 horas
  MEDIUM = 'medium',       // Requiere acción en 24 horas
  LOW = 'low',            // Requiere acción en 72 horas
  INFO = 'info'           // Solo informativo
}
```

### Configuración de Notificaciones

```typescript
const NOTIFICATION_RULES: Record<string, NotificationRule> = {
  'permission_violation': {
    severity: AlertSeverity.CRITICAL,
    immediate: true,
    channels: ['email', 'sms', 'in_app'],
    recipients: ['security_officer', 'quality_manager', 'affected_user'],
    escalation: {
      enabled: true,
      timeoutMinutes: 30,
      escalateTo: ['sogcs_director']
    }
  },
  
  'delegation_expired': {
    severity: AlertSeverity.MEDIUM,
    immediate: false,
    channels: ['email', 'in_app'],
    recipients: ['delegator', 'delegate', 'approver'],
    escalation: {
      enabled: false
    }
  },
  
  'approval_pending': {
    severity: AlertSeverity.LOW,
    immediate: false,
    channels: ['in_app'],
    recipients: ['approvers'],
    escalation: {
      enabled: true,
      timeoutMinutes: 1440, // 24 horas
      escalateTo: ['quality_manager']
    }
  }
};
```

## 🔧 Implementación Django

### Modelos Django

```python
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class SOGCSPermission(models.Model):
    """Permisos específicos del módulo SOGCS"""
    
    permission = models.OneToOneField(
        Permission,
        on_delete=models.CASCADE,
        related_name='sogcs_permission'
    )
    
    module = models.CharField(
        max_length=50,
        choices=[
            ('SOGCS', 'SOGCS General'),
            ('SUH', 'Sistema Único de Habilitación'),
            ('PAMEC', 'Programa de Auditoría'),
            ('SIC', 'Sistema de Información'),
            ('SUA', 'Sistema Único de Acreditación')
        ]
    )
    
    scope = models.CharField(
        max_length=20,
        choices=[
            ('GLOBAL', 'Global'),
            ('ORGANIZATION', 'Organización'),
            ('SERVICE', 'Servicio'),
            ('PROCESS', 'Proceso'),
            ('DOCUMENT', 'Documento'),
            ('PERSONAL', 'Personal')
        ]
    )
    
    delegation_allowed = models.BooleanField(default=False)
    max_delegation_days = models.IntegerField(default=0)
    requires_approval = models.BooleanField(default=False)
    
    conditions = models.JSONField(default=dict)
    audit_required = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'sogcs_permissions'

class SOGCSRole(models.Model):
    """Roles específicos del módulo SOGCS"""
    
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=150)
    description = models.TextField()
    
    level = models.IntegerField(
        choices=[
            (1, 'Estratégico'),
            (2, 'Táctico'),
            (3, 'Operativo'),
            (4, 'Apoyo')
        ]
    )
    
    permissions = models.ManyToManyField(
        SOGCSPermission,
        through='SOGCSRolePermission'
    )
    
    required_certifications = models.JSONField(default=list)
    min_experience_years = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sogcs_roles'

class SOGCSRolePermission(models.Model):
    """Relación entre roles y permisos con condiciones específicas"""
    
    role = models.ForeignKey(SOGCSRole, on_delete=models.CASCADE)
    permission = models.ForeignKey(SOGCSPermission, on_delete=models.CASCADE)
    
    conditions = models.JSONField(default=dict)
    restrictions = models.JSONField(default=dict)
    
    granted_at = models.DateTimeField(auto_now_add=True)
    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='granted_permissions'
    )
    
    class Meta:
        db_table = 'sogcs_role_permissions'
        unique_together = ['role', 'permission']

class SOGCSUserRole(models.Model):
    """Asignación de roles SOGCS a usuarios"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.ForeignKey(SOGCSRole, on_delete=models.CASCADE)
    organization = models.ForeignKey(
        'organization.HealthOrganization',
        on_delete=models.CASCADE
    )
    
    # Scope específico (servicios, procesos, etc.)
    scope = models.JSONField(default=dict)
    
    # Vigencia del rol
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    
    # Designación formal
    designation_document = models.FileField(
        upload_to='sogcs/designations/',
        null=True,
        blank=True
    )
    
    # Control
    is_active = models.BooleanField(default=True)
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_roles'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sogcs_user_roles'
        unique_together = ['user', 'role', 'organization']

class SOGCSPermissionDelegation(models.Model):
    """Delegación temporal de permisos"""
    
    delegator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='delegated_permissions'
    )
    delegate = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_delegations'
    )
    
    permissions = models.ManyToManyField(SOGCSPermission)
    
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    reason = models.TextField()
    
    # Aprobación
    requires_approval = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_delegations'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Estado
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pendiente'),
            ('APPROVED', 'Aprobado'),
            ('ACTIVE', 'Activo'),
            ('EXPIRED', 'Expirado'),
            ('REVOKED', 'Revocado'),
            ('REJECTED', 'Rechazado')
        ],
        default='PENDING'
    )
    
    # Restricciones
    restrictions = models.JSONField(default=dict)
    
    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sogcs_permission_delegations'

class SOGCSAuditLog(models.Model):
    """Registro de auditoría para acciones SOGCS"""
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    permission = models.CharField(max_length=200)
    
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=100)
    resource_name = models.CharField(max_length=200)
    
    # Estados
    previous_state = models.JSONField(null=True, blank=True)
    new_state = models.JSONField(null=True, blank=True)
    
    # Resultado
    success = models.BooleanField()
    error_code = models.CharField(max_length=50, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    # Contexto
    module = models.CharField(max_length=50)
    sub_module = models.CharField(max_length=50, null=True, blank=True)
    organization = models.ForeignKey(
        'organization.HealthOrganization',
        on_delete=models.SET_NULL,
        null=True
    )
    
    # Metadatos técnicos
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    session_id = models.CharField(max_length=100)
    
    # Timing
    timestamp = models.DateTimeField(auto_now_add=True)
    duration_ms = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'sogcs_audit_logs'
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['module', 'timestamp']),
            models.Index(fields=['organization', 'timestamp']),
        ]
```

### Decorador de Permisos

```python
from functools import wraps
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from .services import SOGCSPermissionService

def sogcs_permission_required(permission_name, scope='ORGANIZATION'):
    """
    Decorador para validar permisos SOGCS
    
    Args:
        permission_name: Nombre del permiso (ej: 'suh.autoevaluacion.create')
        scope: Alcance del permiso ('GLOBAL', 'ORGANIZATION', etc.)
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user = request.user
            
            if not user.is_authenticated:
                raise PermissionDenied("Usuario no autenticado")
            
            # Obtener contexto
            organization_id = kwargs.get('organization_id') or request.GET.get('organization_id')
            service_id = kwargs.get('service_id') or request.GET.get('service_id')
            
            # Validar permiso
            permission_service = SOGCSPermissionService()
            has_permission = permission_service.check_permission(
                user=user,
                permission=permission_name,
                scope=scope,
                organization_id=organization_id,
                service_id=service_id,
                request=request
            )
            
            if not has_permission:
                # Registrar intento de acceso no autorizado
                permission_service.log_unauthorized_access(
                    user=user,
                    permission=permission_name,
                    request=request,
                    context={
                        'organization_id': organization_id,
                        'service_id': service_id
                    }
                )
                
                if request.content_type == 'application/json':
                    return JsonResponse({
                        'error': 'Acceso denegado',
                        'code': 'INSUFFICIENT_PERMISSIONS',
                        'required_permission': permission_name
                    }, status=403)
                else:
                    raise PermissionDenied(f"Permiso requerido: {permission_name}")
            
            # Registrar acceso exitoso
            permission_service.log_access(
                user=user,
                permission=permission_name,
                action=view_func.__name__,
                request=request
            )
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator
```

## 🧪 Testing del Sistema RBAC

### Casos de Prueba

```python
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import SOGCSRole, SOGCSPermission, SOGCSUserRole
from .services import SOGCSPermissionService

User = get_user_model()

class TestSOGCSPermissions(TestCase):
    
    def setUp(self):
        self.permission_service = SOGCSPermissionService()
        
        # Crear roles de prueba
        self.suh_coordinator_role = SOGCSRole.objects.create(
            name='SUH_COORDINATOR',
            display_name='Coordinador SUH',
            level=2
        )
        
        # Crear permisos de prueba
        self.autoevaluacion_create = SOGCSPermission.objects.create(
            permission=Permission.objects.create(
                name='Crear autoevaluación SUH',
                codename='suh_autoevaluacion_create',
                content_type=ContentType.objects.get_for_model(User)
            ),
            module='SUH',
            scope='ORGANIZATION'
        )
        
        # Crear usuario de prueba
        self.user = User.objects.create_user(
            email='test@example.com',
            password='test123'
        )
    
    def test_user_has_permission_through_role(self):
        """Test que usuario tenga permiso a través de rol asignado"""
        
        # Asignar permiso a rol
        self.suh_coordinator_role.permissions.add(self.autoevaluacion_create)
        
        # Asignar rol a usuario
        SOGCSUserRole.objects.create(
            user=self.user,
            role=self.suh_coordinator_role,
            organization_id=1,
            start_date=timezone.now()
        )
        
        # Verificar permiso
        has_permission = self.permission_service.check_permission(
            user=self.user,
            permission='suh.autoevaluacion.create',
            organization_id=1
        )
        
        self.assertTrue(has_permission)
    
    def test_delegation_permission(self):
        """Test delegación temporal de permisos"""
        
        # Crear delegación
        delegation = SOGCSPermissionDelegation.objects.create(
            delegator=self.user,
            delegate=self.delegate_user,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            status='ACTIVE'
        )
        delegation.permissions.add(self.autoevaluacion_create)
        
        # Verificar que delegado tiene permiso
        has_permission = self.permission_service.check_permission(
            user=self.delegate_user,
            permission='suh.autoevaluacion.create',
            organization_id=1
        )
        
        self.assertTrue(has_permission)
    
    def test_permission_conditions(self):
        """Test condiciones específicas de permisos"""
        
        # Agregar condición al permiso
        self.autoevaluacion_create.conditions = {
            'time_based': {
                'allowed_hours': [8, 18],  # Solo de 8 AM a 6 PM
                'timezone': 'America/Bogota'
            }
        }
        self.autoevaluacion_create.save()
        
        # Test en horario permitido
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = timezone.now().replace(hour=10)
            
            has_permission = self.permission_service.check_permission(
                user=self.user,
                permission='suh.autoevaluacion.create'
            )
            
            self.assertTrue(has_permission)
        
        # Test fuera de horario
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = timezone.now().replace(hour=20)
            
            has_permission = self.permission_service.check_permission(
                user=self.user,
                permission='suh.autoevaluacion.create'
            )
            
            self.assertFalse(has_permission)
```

---

**Estado**: Especificación completa  
**Próximo**: Implementación del sistema RBAC  
**Dependencias**: Modelos SOGCS base, Sistema de usuarios existente