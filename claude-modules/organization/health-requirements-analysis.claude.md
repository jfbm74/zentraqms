# 🏥 Análisis de Requisitos Regulatorios - Módulo Organizaciones

**Cliente Piloto**: Bonsana IPS - Clínica de Fracturas, Tuluá, Valle del Cauca  
**Fecha**: 2025-08-15  
**Analista**: health-requirements-analyst  
**Scope**: Registro institucional y servicios habilitados (Fase 1)

## 📊 DIAGNÓSTICO INSTITUCIONAL

### Perfil de Bonsana IPS - Clínica de Fracturas
- **Tipo de institución**: IPS privada especializada
- **Servicios probables**: Ortopedia, traumatología, cirugía ortopédica, fisioterapia
- **Nivel de complejidad esperado**: Nivel II (mediana complejidad)
- **Ubicación regulatoria**: Secretaría de Salud del Valle del Cauca
- **Marco normativo aplicable**: SUH + PAMEC obligatorio + ISO 9001:2015 voluntario

## 🎯 ALCANCE DEL MÓDULO ORGANIZACIONES

Este módulo se enfoca en la **configuración inicial básica** de la institución. Los componentes avanzados de calidad se implementarán en módulos especializados:

- **✅ Módulo Organizaciones**: Registro institucional + Servicios habilitados
- **🔜 Módulo SUH**: Sistema Único de Habilitación (7 dominios)
- **🔜 Módulo PAMEC**: Programa de Auditoría para el Mejoramiento de la Calidad  
- **🔜 Módulo SOGCS**: Sistema Obligatorio de Garantía de Calidad en Salud

## 🔧 ESPECIFICACIONES TÉCNICAS - FASE 1

### 1. CAMPOS OBLIGATORIOS PARA REGISTRO INSTITUCIONAL IPS

#### A. Identificación Básica (Res. 3100/2019)
```
- Razón social completa
- NIT con dígito de verificación
- Naturaleza jurídica (privada/pública/mixta)
- Tipo de documento del representante legal
- Número documento representante legal
- Nombre completo representante legal
- Código de prestador (12 dígitos)
- Clase de prestador (IPS/Profesional independiente/Transporte especial/Objeto social diferente)
- Tipo de prestador (Institucional/Profesional)
- Carácter territorial (Nacional/Departamental/Distrital/Municipal)
```

#### B. Código de Habilitación - Estructura
El código de habilitación tiene 12 dígitos:
```
DDMMCCCCCCVV
DD = Código departamento (76 para Valle del Cauca)
MM = Código municipio (834 para Tuluá)
CCCCCC = Consecutivo asignado por la Secretaría
VV = Dígitos de verificación
```

#### C. Sede Principal y Sucursales
```
- Dirección completa sede principal
- Barrio/Vereda
- Teléfono fijo (indicativo + número)
- Teléfono celular
- Correo electrónico notificaciones judiciales
- Correo electrónico institucional
- Página web (si aplica)
- Horario de atención por sede
- Georreferenciación (latitud/longitud)
```

### 2. SERVICIOS HABILITADOS - FORMULARIO DINÁMICO

#### Estructura del Formulario de Servicios:
```javascript
const servicioHabilitado = {
  codigo_servicio: "string", // Código según Resolución 3100/2019
  nombre_servicio: "string", // Descripción del servicio
  fecha_habilitacion: "date", // Fecha inicial de habilitación
  fecha_vencimiento: "date", // Fecha de vencimiento
  estado: "enum", // VIGENTE, VENCIDO, SUSPENDIDO, EN_TRAMITE
  nivel_complejidad: "enum", // I, II, III, IV
  modalidad: "enum", // AMBULATORIO, HOSPITALARIO, DOMICILIARIO
  sede_principal: "boolean", // Si se presta en sede principal
  sedes_autorizadas: "array", // IDs de sedes donde se presta
  observaciones: "text", // Notas adicionales
  numero_resolucion: "string", // Resolución que autoriza
  entidad_autorizante: "string" // Secretaría que autoriza
}
```

#### Servicios Típicos para Clínica de Fracturas:

**Grupo Quirúrgico:**
- `301` - CIRUGÍA ORTOPÉDICA
- `304` - CIRUGÍA DE LA MANO  
- `329` - ORTOPEDIA Y TRAUMATOLOGÍA

**Apoyo Diagnóstico:**
- `706` - RADIOLOGÍA E IMÁGENES DIAGNÓSTICAS
- `712` - TOMA DE MUESTRAS DE LABORATORIO CLÍNICO

**Consulta Externa:**
- `329` - ORTOPEDIA Y TRAUMATOLOGÍA
- `338` - FISIATRÍA
- `344` - FISIOTERAPIA

**Internación:**
- `101` - GENERAL ADULTOS
- `102` - GENERAL PEDIÁTRICA
- `120` - CUIDADO INTERMEDIO ADULTOS

### 3. NIVEL DE COMPLEJIDAD

Para una clínica de fracturas como Bonsana IPS:
- **Nivel II - Mediana Complejidad** (más probable)
  - Cirugías ortopédicas programadas
  - Atención de fracturas complejas
  - Hospitalización corta estancia
  - Apoyo diagnóstico básico

## 🔗 INTEGRACIÓN CON MÓDULOS FUTUROS

Los siguientes componentes se implementarán en módulos especializados del sistema ZentraQMS:

### 📋 Módulo SUH (Sistema Único de Habilitación)
**Responsabilidad**: Gestión completa de los 7 dominios de habilitación
- Talento Humano (verificación ReTHUS, competencias)
- Infraestructura (planos, conceptos sanitarios)
- Dotación (equipos biomédicos, mantenimiento)
- Medicamentos (farmacovigilancia, inventarios)
- Procesos Prioritarios (protocolos clínicos)
- Historia Clínica (custodia, trazabilidad)
- Interdependencias (convenios, referenciación)

### 🔍 Módulo PAMEC (Programa de Auditoría para Mejoramiento)
**Responsabilidad**: Gestión del ciclo completo de mejoramiento continuo
- Autoevaluación institucional
- Selección y priorización de procesos
- Definición de calidad esperada
- Medición y seguimiento de indicadores
- Planes de mejoramiento y acciones correctivas
- Evaluación de efectividad
- Aprendizaje organizacional

### 🏆 Módulo SOGCS (Sistema Obligatorio de Garantía de Calidad)
**Responsabilidad**: Integración de todos los componentes regulatorios
- Articulación SUH + PAMEC + Acreditación
- Reportes regulatorios automatizados
- Indicadores de calidad (Res. 256/2016)
- Sistema de información y vigilancia
- Seguimiento normativo y alertas

## ⏱️ PLAN DE IMPLEMENTACIÓN - MÓDULO ORGANIZACIONES

### Objetivo: Configuración básica en 45 minutos

#### Paso 1: Datos Institucionales Básicos (15 minutos)
```javascript
const paso1_datosBasicos = {
  titulo: "Registro Institucional",
  campos: [
    'razon_social', 'nit', 'naturaleza_juridica',
    'codigo_prestador', 'representante_legal'
  ],
  validaciones: [
    'formato_nit', 'codigo_prestador_12_digitos',
    'verificacion_reps_api'
  ]
}
```

#### Paso 2: Configuración de Sedes (15 minutos)
```javascript
const paso2_sedes = {
  titulo: "Sedes y Ubicaciones",
  campos: [
    'direccion_principal', 'telefono', 'email_institucional',
    'horarios_atencion', 'geolocalizacion'
  ],
  funcionalidad: 'agregar_multiples_sedes'
}
```

#### Paso 3: Servicios Habilitados (15 minutos)
```javascript
const paso3_servicios = {
  titulo: "Servicios Habilitados",
  interfaz: 'selector_servicios_reps',
  campos_por_servicio: [
    'codigo_servicio', 'nombre_servicio', 
    'fecha_habilitacion', 'fecha_vencimiento',
    'nivel_complejidad', 'modalidad', 'sede_autorizada'
  ],
  validaciones: [
    'servicio_existe_reps', 'fechas_coherentes',
    'complejidad_vs_servicio'
  ]
}
```

### 🔄 Integración Futura con Otros Módulos

Una vez completado el registro básico, el sistema habilitará automáticamente:

1. **Módulo SUH**: Para completar los 7 dominios de habilitación
2. **Módulo PAMEC**: Para iniciar el ciclo de mejoramiento continuo  
3. **Módulo SOGCS**: Para articular todos los componentes regulatorios
4. **Módulo Planeación Estratégica**: Para definir misión, visión y objetivos

## ✅ VALIDACIONES CRÍTICAS

### 1. Validación Código Prestador
```javascript
function validarCodigoPrestador(codigo) {
  // Formato: DDMMCCCCCCVV (12 dígitos)
  const regex = /^76834\d{6}$/;
  if (!regex.test(codigo)) return false;
  
  // Verificar con API de REPS
  const verificado = await consultarREPS(codigo);
  return verificado.activo && verificado.municipio === 'TULUA';
}
```

### 2. Validación Servicios por Complejidad
```javascript
function validarServiciosComplejidad(servicios, nivel) {
  const restricciones = {
    nivel_I: ['consulta_externa', 'urgencias_baja'],
    nivel_II: ['cirugia_mediana', 'hospitalizacion', 'uci_intermedio'],
    nivel_III: ['cirugia_alta', 'uci_adultos', 'especialidades'],
    nivel_IV: ['trasplantes', 'cirugia_cardiovascular']
  };
  
  return servicios.every(servicio => 
    restricciones[`nivel_${nivel}`].includes(servicio.categoria)
  );
}
```

## 💡 RECOMENDACIONES ESPECÍFICAS

### Para Bonsana IPS - Configuración Inicial:
1. **Servicios prioritarios** para registro:
   - 329 - ORTOPEDIA Y TRAUMATOLOGÍA (consulta y cirugía)
   - 301 - CIRUGÍA ORTOPÉDICA
   - 101 - HOSPITALIZACIÓN GENERAL ADULTOS
   - 706 - RADIOLOGÍA E IMÁGENES DIAGNÓSTICAS

2. **Datos críticos** a verificar:
   - Código prestador vigente en REPS
   - Fechas de vencimiento de servicios habilitados
   - Correspondencia entre servicios y nivel de complejidad

3. **Preparación** para módulos futuros:
   - Designar coordinador de calidad desde el inicio
   - Preparar documentación básica de constitución
   - Identificar procesos asistenciales críticos

## ⚠️ ALERTAS REGULATORIAS - MÓDULO ORGANIZACIONES

### Validaciones automáticas requeridas:
- **Código prestador**: Verificación en tiempo real con REPS
- **Servicios habilitados**: Coherencia con nivel de complejidad  
- **Fechas de vigencia**: Alertas 60 días antes del vencimiento
- **Actualización REPS**: Sincronización ante cambios

### Riesgos operativos:
- **Código prestador inválido**: Imposibilidad de facturar
- **Servicios vencidos**: Operación ilegal de la IPS
- **Datos inconsistentes**: Problemas en auditorías

---

## 📈 CONCLUSIÓN

Este análisis define el **alcance mínimo viable** para el módulo de Organizaciones, enfocado en:

✅ **Registro institucional básico** completo y conforme  
✅ **Servicios habilitados** con validaciones automáticas  
✅ **Integración preparada** para módulos SUH, PAMEC y SOGCS  

**Siguiente paso**: Diseñar la arquitectura técnica completa con el agente `qms-software-architect`

**Beneficio**: Configuración inicial en 45 minutos vs. días de trabajo manual