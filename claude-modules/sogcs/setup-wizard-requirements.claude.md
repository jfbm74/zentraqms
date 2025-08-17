# 🧙‍♂️ SETUP WIZARD SOGCS - Especificación Detallada

## 📋 Información General

**Componente**: Setup Wizard para Parametrización Inicial SOGCS  
**Objetivo**: Guiar al usuario paso a paso en la configuración inicial completa del módulo SOGCS  
**Tiempo Estimado Total**: 90-120 minutos  
**Pasos Obligatorios**: 7  
**Pasos Opcionales**: 2  

## 🎯 Objetivos del Wizard

### Principales
1. **Simplificar la configuración inicial** reduciendo la complejidad técnica
2. **Asegurar configuración completa** validando todos los requisitos obligatorios
3. **Educar al usuario** sobre cada componente SOGCS durante la configuración
4. **Minimizar errores** con validaciones en tiempo real
5. **Proporcionar feedback visual** del progreso y completitud

### Secundarios
1. **Estimar tiempos** de configuración restante
2. **Permitir configuración parcial** con guardado automático
3. **Facilitar retomar configuración** desde donde se dejó
4. **Generar documentación** de la configuración realizada

## 📊 Barra de Progreso Inteligente

### Especificaciones Técnicas

```typescript
interface ProgressConfig {
  // Configuración visual
  height: number;              // 8px por defecto
  borderRadius: number;        // 4px por defecto
  backgroundColor: string;     // #f0f0f0
  fillColor: string;          // gradient: #10b981 -> #059669
  animationDuration: number;   // 300ms para transiciones
  
  // Configuración funcional
  showPercentage: boolean;     // true
  showStepCounter: boolean;    // true
  showTimeEstimate: boolean;   // true
  showDetailedSteps: boolean;  // false por defecto, expandible
  
  // Configuración de alertas
  highlightBlockers: boolean;  // true
  showTooltips: boolean;      // true
  enableStepNavigation: boolean; // true para pasos completados
}

interface ProgressState {
  currentStep: number;         // Paso actual (0-based)
  totalSteps: number;         // Total de pasos (7 obligatorios + opcionales)
  completedSteps: number;     // Pasos completados
  globalPercentage: number;   // % global calculado con pesos
  stepPercentages: number[];  // % individual por paso
  
  // Estados de pasos
  stepStates: StepState[];    // Estado detallado de cada paso
  blockers: Blocker[];        // Bloqueadores activos
  warnings: Warning[];       // Advertencias no críticas
  
  // Estimaciones
  timeSpentMinutes: number;   // Tiempo ya invertido
  estimatedRemainingMinutes: number; // Tiempo estimado restante
  averageTimePerStep: number; // Promedio histórico
  
  // Navegación
  canNavigateBack: boolean;   // Puede ir a pasos anteriores
  canNavigateForward: boolean; // Puede avanzar (validaciones ok)
  canSkipCurrentStep: boolean; // Paso actual es opcional
}

interface StepState {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  percentage: number;         // 0-100
  isOptional: boolean;
  dependencies: string[];     // IDs de pasos dependientes
  validationErrors: ValidationError[];
  warningMessages: string[];
  estimatedMinutes: number;   // Tiempo estimado para este paso
  actualMinutes?: number;     // Tiempo real tomado (si completado)
}

interface Blocker {
  stepId: string;
  type: 'validation' | 'dependency' | 'permission' | 'data';
  severity: 'critical' | 'high' | 'medium';
  message: string;
  actionRequired: string;
  canAutoResolve: boolean;
  helpUrl?: string;
}
```

### Componente Visual de Progreso

```tsx
interface ProgressBarProps {
  progress: ProgressState;
  config: ProgressConfig;
  onStepClick: (stepId: string) => void;
  onExpandDetails: () => void;
}

const SOGCSProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  config,
  onStepClick,
  onExpandDetails
}) => {
  return (
    <div className="sogcs-progress-wrapper">
      {/* Barra principal con gradiente */}
      <div className="progress-main-bar">
        <div 
          className="progress-fill"
          style={{
            width: `${progress.globalPercentage}%`,
            background: `linear-gradient(90deg, ${config.fillColor})`,
            transition: `width ${config.animationDuration}ms ease-in-out`
          }}
        />
        
        {/* Marcadores de pasos importantes */}
        <div className="progress-markers">
          {progress.stepStates.map((step, index) => (
            <div
              key={step.id}
              className={`step-marker ${step.status}`}
              style={{ left: `${(index / progress.totalSteps) * 100}%` }}
              onClick={() => step.status === 'completed' && onStepClick(step.id)}
            >
              {getStepIcon(step.status)}
            </div>
          ))}
        </div>
      </div>

      {/* Información del progreso */}
      <div className="progress-info">
        <div className="progress-stats">
          <span className="percentage">{progress.globalPercentage}%</span>
          <span className="step-counter">
            {progress.completedSteps}/{progress.totalSteps} pasos
          </span>
          <span className="time-estimate">
            ⏱️ {progress.estimatedRemainingMinutes} min restantes
          </span>
        </div>
        
        <button 
          className="expand-details"
          onClick={onExpandDetails}
        >
          Ver detalles {config.showDetailedSteps ? '▼' : '▶'}
        </button>
      </div>

      {/* Alertas de bloqueadores */}
      {progress.blockers.length > 0 && (
        <div className="progress-blockers">
          <div className="blocker-header">
            ⚠️ {progress.blockers.length} acción(es) requerida(s)
          </div>
          {progress.blockers.map((blocker, index) => (
            <div key={index} className={`blocker-item ${blocker.severity}`}>
              <div className="blocker-message">{blocker.message}</div>
              <button 
                className="blocker-action"
                onClick={() => onStepClick(blocker.stepId)}
              >
                {blocker.actionRequired}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Vista detallada expandible */}
      {config.showDetailedSteps && (
        <div className="progress-detailed-steps">
          {progress.stepStates.map((step, index) => (
            <div 
              key={step.id}
              className={`detailed-step ${step.status}`}
              onClick={() => canNavigateToStep(step) && onStepClick(step.id)}
            >
              <div className="step-indicator">
                <div className="step-number">{index + 1}</div>
                <div className="step-icon">{getStepIcon(step.status)}</div>
              </div>
              
              <div className="step-content">
                <h4 className="step-title">{step.title}</h4>
                <div className="step-progress">
                  <div 
                    className="step-progress-fill"
                    style={{ width: `${step.percentage}%` }}
                  />
                  <span className="step-percentage">{step.percentage}%</span>
                </div>
                
                {step.validationErrors.length > 0 && (
                  <div className="step-errors">
                    {step.validationErrors.map((error, idx) => (
                      <div key={idx} className="error-message">
                        ❌ {error.message}
                      </div>
                    ))}
                  </div>
                )}
                
                {step.warningMessages.length > 0 && (
                  <div className="step-warnings">
                    {step.warningMessages.map((warning, idx) => (
                      <div key={idx} className="warning-message">
                        ⚠️ {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="step-meta">
                {step.actualMinutes ? (
                  <span className="time-taken">✓ {step.actualMinutes} min</span>
                ) : (
                  <span className="time-estimated">~ {step.estimatedMinutes} min</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 🎯 Pasos Detallados del Wizard

### Paso 1: Configuración Institucional SOGCS (20%)
**Tiempo Estimado**: 15-20 minutos  
**Estado**: Obligatorio  
**Dependencias**: Ninguna  

#### Formularios y Campos

```typescript
interface ConfiguracionInstitucional {
  // Identificación básica
  tipoInstitucion: 'IPS_PUBLICA' | 'IPS_PRIVADA' | 'IPS_MIXTA' | 'PROFESIONAL_INDEPENDIENTE';
  nivelComplejidad: 'I' | 'II' | 'III' | 'IV';
  
  // Datos regulatorios
  codigoHabilitacion: string;        // Código REPS (12 dígitos)
  nitPrestador: string;             // NIT institucional
  registroEspecialPrestadores: string; // Número REPS
  
  // Caracterización específica
  eseMunicipalDepartamental?: boolean; // Solo para públicas
  nivelESE?: 1 | 2 | 3;             // Solo para ESE
  tieneServiciosEspecializados: boolean;
  atiendePoblacionEspecial: boolean;
  
  // Ubicación y cobertura
  departamento: string;
  municipio: string;
  zona: 'URBANA' | 'RURAL';
  poblacionAsignada?: number;       // Para entidades públicas
  
  // Infraestructura básica
  numeroSedes: number;
  sedePrincipal: DireccionSede;
  sedesAdicionales: DireccionSede[];
  
  // Configuración tecnológica
  usaHistoriaClinicaElectronica: boolean;
  sistemaInformacionHospitalario?: string;
  proveedorSoftware?: string;
}

interface DireccionSede {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  responsable: string;
  serviciosDisponibles: string[];
}
```

#### Validaciones Paso 1

```typescript
const validacionesPaso1: ValidationRule[] = [
  {
    field: 'codigoHabilitacion',
    rules: [
      { type: 'required', message: 'Código de habilitación es obligatorio' },
      { type: 'pattern', pattern: /^\d{12}$/, message: 'Debe tener 12 dígitos' },
      { type: 'unique', message: 'Este código ya está registrado' }
    ]
  },
  {
    field: 'nivelComplejidad',
    rules: [
      { type: 'required', message: 'Nivel de complejidad es obligatorio' },
      { 
        type: 'custom', 
        validator: validateComplejidadConServicios,
        message: 'Nivel incompatible con servicios seleccionados'
      }
    ]
  },
  {
    field: 'numeroSedes',
    rules: [
      { type: 'min', value: 1, message: 'Debe tener al menos una sede' },
      { type: 'max', value: 50, message: 'Máximo 50 sedes permitidas' }
    ]
  }
];
```

#### UI Específica Paso 1

```tsx
const ConfiguracionInstitucionalStep: React.FC = () => {
  return (
    <div className="setup-step institutional-config">
      <div className="step-header">
        <h2>🏥 Configuración Institucional SOGCS</h2>
        <p>Configure los datos básicos de su institución según normativa SOGCS</p>
      </div>

      <div className="config-sections">
        {/* Sección: Identificación */}
        <div className="config-section">
          <h3>📋 Identificación Básica</h3>
          <div className="form-grid">
            <SelectField
              name="tipoInstitucion"
              label="Tipo de Institución"
              options={TIPOS_INSTITUCION}
              required
              helpText="Según clasificación REPS"
            />
            <SelectField
              name="nivelComplejidad"
              label="Nivel de Complejidad"
              options={NIVELES_COMPLEJIDAD}
              required
              helpText="Nivel autorizado por Secretaría de Salud"
            />
          </div>
        </div>

        {/* Sección: Datos Regulatorios */}
        <div className="config-section">
          <h3>📜 Datos Regulatorios</h3>
          <div className="form-grid">
            <InputField
              name="codigoHabilitacion"
              label="Código de Habilitación"
              placeholder="123456789012"
              required
              helpText="Código REPS de 12 dígitos"
              validation="codigo-habilitacion"
            />
            <InputField
              name="nitPrestador"
              label="NIT del Prestador"
              required
              helpText="NIT institucional registrado"
            />
          </div>
        </div>

        {/* Sección: Infraestructura */}
        <div className="config-section">
          <h3>🏢 Infraestructura</h3>
          <div className="sedes-config">
            <div className="sede-principal">
              <h4>Sede Principal</h4>
              <SedeConfigForm type="principal" />
            </div>
            
            <div className="sedes-adicionales">
              <h4>Sedes Adicionales</h4>
              <SedesAdicionalesManager />
            </div>
          </div>
        </div>
      </div>

      {/* Vista previa de configuración */}
      <div className="config-preview">
        <h4>📄 Resumen de Configuración</h4>
        <ConfigPreview data={formData} />
      </div>
    </div>
  );
};
```

### Paso 2: Asignación de Responsables (15%)
**Tiempo Estimado**: 10-15 minutos  
**Estado**: Obligatorio  
**Dependencias**: Paso 1 completado  

#### Responsables Requeridos

```typescript
interface ResponsablesSOGCS {
  // Responsables principales
  representanteLegal: UsuarioResponsable;
  responsableCalidad: UsuarioResponsable;
  responsableHabilitacion: UsuarioResponsable;
  
  // Responsables por componente SOGCS
  responsableSUH: UsuarioResponsable;
  responsablePAMEC: UsuarioResponsable;
  responsableSIC: UsuarioResponsable;
  responsableSUA?: UsuarioResponsable; // Solo si aspira a acreditación
  
  // Responsables por servicio (dinámico)
  responsablesServicio: Map<string, UsuarioResponsable>; // servicio -> responsable
  
  // Configuración de notificaciones
  notificacionesEmail: boolean;
  notificacionesSMS: boolean;
  escalamientoAutomatico: boolean;
  diasEscalamiento: number;
}

interface UsuarioResponsable {
  usuario: User;
  cargo: string;
  fechaDesignacion: Date;
  vigenciaDesignacion?: Date;
  documentoDesignacion?: File;
  perfilProfesional: string;
  experienciaAños: number;
  certificacionesCalidad: Certificacion[];
  disponibilidadHoraria: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HORAS';
  horasSemanales: number;
}

interface Certificacion {
  nombre: string;
  entidadEmisora: string;
  fechaEmision: Date;
  fechaVencimiento?: Date;
  numeroCredencial: string;
  documento?: File;
}
```

#### Validaciones Paso 2

```typescript
const validacionesPaso2: ValidationRule[] = [
  {
    field: 'responsableCalidad',
    rules: [
      { type: 'required', message: 'Responsable de calidad es obligatorio' },
      { 
        type: 'custom',
        validator: validatePerfilCalidad,
        message: 'Debe tener formación en gestión de calidad'
      }
    ]
  },
  {
    field: 'responsableHabilitacion',
    rules: [
      { type: 'required', message: 'Responsable de habilitación es obligatorio' },
      {
        type: 'custom',
        validator: validateExperienciaMinima,
        message: 'Requiere mínimo 2 años de experiencia'
      }
    ]
  },
  {
    field: 'responsablesServicio',
    rules: [
      {
        type: 'custom',
        validator: validateResponsablePorServicio,
        message: 'Cada servicio debe tener un responsable asignado'
      }
    ]
  }
];
```

### Paso 3: Servicios a Habilitar (20%)
**Tiempo Estimado**: 20-25 minutos  
**Estado**: Obligatorio  
**Dependencias**: Paso 1 y 2 completados  

#### Selección de Servicios

```typescript
interface ServicioParaHabilitar {
  // Identificación del servicio
  codigoServicio: string;           // Código CUPS/REPS
  nombreServicio: string;
  grupoServicio: GrupoServicio;
  
  // Modalidades a habilitar
  modalidades: {
    intramural: boolean;
    extramural: boolean;
    telemedicina: boolean;
    domiciliaria: boolean;
  };
  
  // Configuración específica
  nivelComplejidad: 'BAJA' | 'MEDIA' | 'ALTA';
  capacidadEstimada: {
    consultasSemanales?: number;
    camasDisponibles?: number;
    procedimientosMes?: number;
  };
  
  // Personal requerido
  personalMinimo: RequisitoPersonal[];
  
  // Infraestructura requerida
  infraestructuraMinima: RequisitoInfraestructura[];
  
  // Dotación requerida
  dotacionMinima: RequisitoDotacion[];
  
  // Estado de preparación
  estadoPreparacion: 'NO_INICIADO' | 'EN_PREPARACION' | 'LISTO_HABILITAR';
  fechaObjetivoHabilitacion: Date;
  responsablePreparacion: UsuarioResponsable;
}

interface RequisitoPersonal {
  perfil: string;
  cantidad: number;
  dedicacion: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HORAS';
  requiereCertificacion: boolean;
  certificacionRequerida?: string;
}
```

#### Wizard de Selección de Servicios

```tsx
const ServiciosSelectionStep: React.FC = () => {
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([]);
  const [filtros, setFiltros] = useState<ServicioFilters>({});

  return (
    <div className="setup-step servicios-selection">
      <div className="step-header">
        <h2>🏥 Selección de Servicios a Habilitar</h2>
        <p>Seleccione los servicios de salud que prestará su institución</p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="servicios-filters">
        <SearchInput
          placeholder="Buscar servicio..."
          onSearch={handleServicioSearch}
        />
        <FilterGroup
          filters={[
            { key: 'grupo', label: 'Grupo', options: GRUPOS_SERVICIOS },
            { key: 'complejidad', label: 'Complejidad', options: NIVELES_COMPLEJIDAD },
            { key: 'modalidad', label: 'Modalidad', options: MODALIDADES }
          ]}
          onChange={setFiltros}
        />
      </div>

      {/* Lista de servicios por grupos */}
      <div className="servicios-catalog">
        {GRUPOS_SERVICIOS.map(grupo => (
          <div key={grupo.id} className="grupo-servicios">
            <h3>
              {grupo.icon} {grupo.nombre}
              <span className="servicios-count">
                {getServiciosCount(grupo.id, serviciosSeleccionados)}
              </span>
            </h3>
            
            <div className="servicios-grid">
              {getServiciosByGrupo(grupo.id).map(servicio => (
                <ServicioCard
                  key={servicio.codigo}
                  servicio={servicio}
                  isSelected={serviciosSeleccionados.includes(servicio.codigo)}
                  onToggle={handleServicioToggle}
                  validationResult={validateServicio(servicio)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de selección */}
      <div className="servicios-summary">
        <h4>📊 Resumen de Servicios Seleccionados</h4>
        <div className="summary-stats">
          <div className="stat">
            <span className="value">{serviciosSeleccionados.length}</span>
            <span className="label">Servicios</span>
          </div>
          <div className="stat">
            <span className="value">{getPersonalRequerido()}</span>
            <span className="label">Personal mínimo</span>
          </div>
          <div className="stat">
            <span className="value">{getEstandaresAplicables()}</span>
            <span className="label">Estándares aplicables</span>
          </div>
        </div>
        
        <ServiciosSelectedList
          servicios={serviciosSeleccionados}
          onRemove={handleRemoveServicio}
          onConfigure={handleConfigureServicio}
        />
      </div>
    </div>
  );
};
```

### Paso 4: Configuración PAMEC (15%)
**Tiempo Estimado**: 15-20 minutos  
**Estado**: Obligatorio  
**Dependencias**: Paso 3 completado  

#### Configuración del Programa PAMEC

```typescript
interface ConfiguracionPAMEC {
  // Configuración del programa
  nombrePrograma: string;
  fechaInicioPrograma: Date;
  duracionCicloMeses: number;         // Típicamente 12 meses
  responsablePrograma: UsuarioResponsable;
  
  // Metodología de priorización
  metodologiaPriorizacion: 'RIESGO' | 'VOLUMEN' | 'COSTO' | 'COMBINADA';
  criteriosPriorizacion: CriterioPriorizacion[];
  
  // Proceso de auditoría
  equipoAuditor: MiembroEquipoAuditor[];
  frecuenciaAuditorias: 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL';
  tipoAuditorias: ('INTERNA' | 'EXTERNA' | 'MIXTA')[];
  
  // Procesos a auditar (basado en servicios seleccionados)
  procesosObligatorios: ProcesoAuditoria[];
  procesosAdicionales: ProcesoAuditoria[];
  
  // Configuración de seguimiento
  frecuenciaSeguimiento: 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL';
  indicadoresEfectividad: IndicadorEfectividad[];
  
  // Reportes y comunicación
  frecuenciaReportes: 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL';
  destinatariosReportes: string[];
  formatoReportes: 'EJECUTIVO' | 'DETALLADO' | 'AMBOS';
}

interface ProcesoAuditoria {
  codigo: string;
  nombre: string;
  descripcion: string;
  esObligatorio: boolean;
  serviciosAplicables: string[];
  riesgoAsociado: 'ALTO' | 'MEDIO' | 'BAJO';
  frecuenciaAuditoria: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  responsableProcesoAuditado: UsuarioResponsable;
  
  // Criterios de evaluación
  criteriosCalidad: CriterioCalidad[];
  indicadoresProceso: IndicadorProceso[];
  estandaresReferencia: string[];
}

interface CriterioCalidad {
  id: string;
  descripcion: string;
  tipoEvaluacion: 'CUMPLE_NO_CUMPLE' | 'ESCALA_NUMERICA' | 'PORCENTUAL';
  pesoRelativo: number;           // 0-100
  esEliminatorio: boolean;
  requiereEvidencia: boolean;
  tipoEvidencia: 'DOCUMENTAL' | 'OBSERVACIONAL' | 'ENTREVISTA';
}
```

#### UI Configuración PAMEC

```tsx
const ConfiguracionPAMECStep: React.FC = () => {
  return (
    <div className="setup-step pamec-config">
      <div className="step-header">
        <h2>📋 Configuración del Programa PAMEC</h2>
        <p>Configure su Programa de Auditoría para el Mejoramiento de la Calidad</p>
      </div>

      <div className="pamec-sections">
        {/* Sección: Datos básicos del programa */}
        <div className="config-section">
          <h3>📊 Programa de Auditoría</h3>
          <div className="form-grid">
            <InputField
              name="nombrePrograma"
              label="Nombre del Programa"
              defaultValue="Programa PAMEC [Nombre Institución] 2024"
              required
            />
            <DateField
              name="fechaInicioPrograma"
              label="Fecha de Inicio"
              defaultValue={new Date()}
              required
            />
            <SelectField
              name="duracionCicloMeses"
              label="Duración del Ciclo"
              options={[
                { value: 6, label: '6 meses' },
                { value: 12, label: '12 meses (recomendado)' },
                { value: 24, label: '24 meses' }
              ]}
              defaultValue={12}
              required
            />
          </div>
        </div>

        {/* Sección: Equipo auditor */}
        <div className="config-section">
          <h3>👥 Equipo Auditor</h3>
          <EquipoAuditorManager />
        </div>

        {/* Sección: Procesos a auditar */}
        <div className="config-section">
          <h3>🔍 Procesos a Auditar</h3>
          <ProcesosAuditoriaSelector servicios={serviciosSeleccionados} />
        </div>

        {/* Sección: Metodología */}
        <div className="config-section">
          <h3>⚙️ Metodología de Priorización</h3>
          <MetodologiaPriorizacionConfig />
        </div>
      </div>

      {/* Vista previa del cronograma */}
      <div className="pamec-preview">
        <h4>📅 Cronograma de Auditorías (Próximos 12 meses)</h4>
        <CronogramaAuditoriasPreview config={pamecConfig} />
      </div>
    </div>
  );
};
```

### Paso 5: Selección de Indicadores SIC (15%)
**Tiempo Estimado**: 10-15 minutos  
**Estado**: Obligatorio  
**Dependencias**: Paso 3 completado  

### Paso 6: Documentos Fundamentales (10%)
**Tiempo Estimado**: 15-20 minutos  
**Estado**: Obligatorio  
**Dependencias**: Pasos 4 y 5 completados  

### Paso 7: Revisión y Activación (5%)
**Tiempo Estimado**: 5-10 minutos  
**Estado**: Obligatorio  
**Dependencias**: Todos los pasos anteriores completados  

## 🔄 Lógica de Guardado y Recuperación

### Guardado Automático

```typescript
interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;              // 30000ms (30 segundos)
  triggerOnChange: boolean;        // true
  saveOnStepChange: boolean;       // true
  maxHistoryVersions: number;      // 10
  
  // Estrategia de guardado
  strategy: 'localStorage' | 'sessionStorage' | 'server';
  encryptSensitiveData: boolean;   // true
  
  // Configuración de conflictos
  detectConflicts: boolean;        // true
  conflictResolution: 'server' | 'local' | 'prompt';
}

interface SavedProgress {
  userId: string;
  organizationId: string;
  timestamp: Date;
  version: number;
  
  // Estado del wizard
  currentStep: number;
  completedSteps: number[];
  stepData: Map<string, any>;      // Datos por paso
  
  // Metadatos
  totalTimeSpent: number;          // en minutos
  timePerStep: Map<string, number>;
  lastActivity: Date;
  
  // Validaciones
  validationResults: Map<string, ValidationResult>;
  blockers: Blocker[];
  
  // Hash para detectar cambios
  dataHash: string;
}
```

### Recuperación de Progreso

```tsx
const WizardProgressRecovery: React.FC = () => {
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  useEffect(() => {
    checkForSavedProgress();
  }, []);

  const checkForSavedProgress = async () => {
    const progress = await wizardService.getSavedProgress();
    if (progress && progress.completedSteps.length > 0) {
      setSavedProgress(progress);
      setShowRecoveryDialog(true);
    }
  };

  return (
    <>
      {showRecoveryDialog && (
        <Modal title="Configuración Incompleta Encontrada">
          <div className="recovery-dialog">
            <div className="recovery-info">
              <h4>Se encontró una configuración incompleta</h4>
              <div className="progress-summary">
                <p>Último guardado: {formatDate(savedProgress.timestamp)}</p>
                <p>Progreso: {savedProgress.completedSteps.length}/7 pasos</p>
                <p>Tiempo invertido: {savedProgress.totalTimeSpent} minutos</p>
              </div>
            </div>
            
            <div className="recovery-actions">
              <button 
                className="btn-primary"
                onClick={() => recoverProgress(savedProgress)}
              >
                Continuar Configuración
              </button>
              <button 
                className="btn-secondary"
                onClick={() => startFresh()}
              >
                Empezar de Nuevo
              </button>
              <button 
                className="btn-tertiary"
                onClick={() => exportProgress(savedProgress)}
              >
                Exportar Progreso
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
```

## 🧪 Testing del Setup Wizard

### Casos de Prueba Críticos

```typescript
describe('SOGCS Setup Wizard', () => {
  describe('Barra de Progreso', () => {
    test('debe mostrar progreso correcto tras completar cada paso', () => {
      // Implementar test
    });
    
    test('debe calcular tiempo estimado correctamente', () => {
      // Implementar test
    });
    
    test('debe detectar y mostrar bloqueadores', () => {
      // Implementar test
    });
  });

  describe('Guardado Automático', () => {
    test('debe guardar progreso cada 30 segundos', () => {
      // Implementar test
    });
    
    test('debe recuperar progreso al reiniciar', () => {
      // Implementar test
    });
  });

  describe('Validaciones', () => {
    test('debe validar campos obligatorios en cada paso', () => {
      // Implementar test
    });
    
    test('debe prevenir avanzar con validaciones fallidas', () => {
      // Implementar test
    });
  });
});
```

---

**Estado**: Especificación completa  
**Próximo**: Implementación del Setup Wizard  
**Dependencias**: Modelos SOGCS base, Sistema de permisos