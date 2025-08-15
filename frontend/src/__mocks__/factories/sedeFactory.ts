/**
 * Sede Factory for Test Data Generation
 * 
 * Provides factory functions to create mock sede objects with realistic
 * data that complies with Colombian healthcare regulations.
 */

import type { 
  SedeListItem, 
  SedeFormData, 
  SedePrestadora,
  SedeEstado,
  TipoSede
} from '../../types/sede.types';

// Colombian departments for realistic test data
const COLOMBIAN_DEPARTMENTS = [
  'Bogotá D.C.',
  'Antioquia',
  'Valle del Cauca',
  'Cundinamarca',
  'Santander',
  'Atlántico',
  'Bolívar',
  'Caldas',
  'Tolima',
  'Huila'
];

// Colombian municipalities mapped to departments
const COLOMBIAN_MUNICIPALITIES = {
  'Bogotá D.C.': ['Bogotá'],
  'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado'],
  'Valle del Cauca': ['Cali', 'Buenaventura', 'Palmira', 'Tuluá'],
  'Cundinamarca': ['Soacha', 'Zipaquirá', 'Chía', 'Facatativá'],
  'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta']
};

// Realistic REPS codes (12 digits)
const SAMPLE_REPS_CODES = [
  '123456789012',
  '234567890123',
  '345678901234',
  '456789012345',
  '567890123456'
];

// Common sede types in Colombian healthcare
const SEDE_TYPES: TipoSede[] = [
  'principal',
  'sucursal',
  'ambulatoria',
  'hospitalaria',
  'administrativa',
  'diagnostico',
  'urgencias'
];

// Realistic healthcare professional names
const PROFESSIONAL_NAMES = [
  'Dr. Juan Carlos Pérez Médez',
  'Dra. María Elena Rodríguez Silva',
  'Dr. Luis Fernando García Torres',
  'Dra. Ana Patricia López Vargas',
  'Dr. Carlos Eduardo Martínez Ruiz',
  'Dra. Isabel Cristina Hernández Gómez'
];

// Healthcare professional positions
const PROFESSIONAL_POSITIONS = [
  'Director Médico',
  'Directora Médica',
  'Coordinador Asistencial',
  'Coordinadora Asistencial',
  'Jefe de Servicios Médicos',
  'Jefa de Servicios Médicos',
  'Gerente de Operaciones',
  'Director Científico'
];

/**
 * Generate a random Colombian phone number
 */
function generateColombianPhone(): string {
  const prefixes = ['300', '301', '302', '310', '311', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `+57 ${prefix} ${number.toString().slice(0, 3)} ${number.toString().slice(3)}`;
}

/**
 * Generate a random Colombian email address
 */
function generateColombianEmail(sedeName: string): string {
  const domain = ['com.co', 'org.co', 'edu.co', 'gov.co'][Math.floor(Math.random() * 4)];
  const cleanName = sedeName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  return `${cleanName}@ips${Math.floor(Math.random() * 999) + 1}.${domain}`;
}

/**
 * Generate realistic sede address
 */
function generateSedeAddress(): string {
  const streetTypes = ['Carrera', 'Calle', 'Avenida', 'Diagonal', 'Transversal'];
  const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
  const number1 = Math.floor(Math.random() * 200) + 1;
  const number2 = Math.floor(Math.random() * 200) + 1;
  const number3 = Math.floor(Math.random() * 99) + 1;
  
  return `${streetType} ${number1} # ${number2}-${number3.toString().padStart(2, '0')}`;
}

/**
 * Create a mock SedeListItem with realistic data
 */
export function createMockSede(overrides: Partial<SedeListItem> = {}): SedeListItem {
  const departamento = COLOMBIAN_DEPARTMENTS[Math.floor(Math.random() * COLOMBIAN_DEPARTMENTS.length)];
  const municipios = COLOMBIAN_MUNICIPALITIES[departamento as keyof typeof COLOMBIAN_MUNICIPALITIES] || [departamento];
  const municipio = municipios[Math.floor(Math.random() * municipios.length)];
  
  const nombreSede = `IPS ${['Santa María', 'San José', 'La Esperanza', 'El Salvador', 'Nuestra Señora'][Math.floor(Math.random() * 5)]} - ${municipio}`;
  
  return {
    id: `sede-${Math.random().toString(36).substr(2, 9)}`,
    numero_sede: (Math.floor(Math.random() * 99) + 1).toString().padStart(2, '0'),
    codigo_prestador: SAMPLE_REPS_CODES[Math.floor(Math.random() * SAMPLE_REPS_CODES.length)],
    nombre_sede: nombreSede,
    tipo_sede: SEDE_TYPES[Math.floor(Math.random() * SEDE_TYPES.length)],
    es_sede_principal: Math.random() < 0.2, // 20% chance of being principal
    direccion: generateSedeAddress(),
    departamento,
    municipio,
    telefono_principal: generateColombianPhone(),
    email: generateColombianEmail(nombreSede),
    nombre_responsable: PROFESSIONAL_NAMES[Math.floor(Math.random() * PROFESSIONAL_NAMES.length)],
    cargo_responsable: PROFESSIONAL_POSITIONS[Math.floor(Math.random() * PROFESSIONAL_POSITIONS.length)],
    estado: ['activa', 'inactiva', 'suspendida', 'en_proceso'][Math.floor(Math.random() * 4)] as SedeEstado,
    atencion_24_horas: Math.random() < 0.3, // 30% chance of 24-hour service
    fecha_creacion: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    fecha_actualizacion: new Date().toISOString(),
    servicios_count: Math.floor(Math.random() * 20) + 1,
    ...overrides
  };
}

/**
 * Create a mock SedeFormData for form testing
 */
export function createMockSedeFormData(overrides: Partial<SedeFormData> = {}): SedeFormData {
  const departamento = COLOMBIAN_DEPARTMENTS[Math.floor(Math.random() * COLOMBIAN_DEPARTMENTS.length)];
  const municipios = COLOMBIAN_MUNICIPALITIES[departamento as keyof typeof COLOMBIAN_MUNICIPALITIES] || [departamento];
  const municipio = municipios[Math.floor(Math.random() * municipios.length)];
  
  const nombreSede = `Sede ${['Norte', 'Sur', 'Este', 'Oeste', 'Central'][Math.floor(Math.random() * 5)]}`;
  
  return {
    numero_sede: (Math.floor(Math.random() * 99) + 1).toString().padStart(2, '0'),
    codigo_prestador: SAMPLE_REPS_CODES[Math.floor(Math.random() * SAMPLE_REPS_CODES.length)],
    nombre_sede: nombreSede,
    tipo_sede: SEDE_TYPES[Math.floor(Math.random() * SEDE_TYPES.length)],
    es_sede_principal: false,
    direccion: generateSedeAddress(),
    departamento,
    municipio,
    codigo_postal: (Math.floor(Math.random() * 900000) + 100000).toString(),
    telefono_principal: generateColombianPhone(),
    telefono_secundario: Math.random() < 0.5 ? generateColombianPhone() : undefined,
    email: generateColombianEmail(nombreSede),
    nombre_responsable: PROFESSIONAL_NAMES[Math.floor(Math.random() * PROFESSIONAL_NAMES.length)],
    cargo_responsable: PROFESSIONAL_POSITIONS[Math.floor(Math.random() * PROFESSIONAL_POSITIONS.length)],
    telefono_responsable: generateColombianPhone(),
    email_responsable: `responsable${Math.floor(Math.random() * 999)}@ips.com.co`,
    atencion_24_horas: Math.random() < 0.3,
    fecha_habilitacion: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    resolucion_habilitacion: `Resolución ${Math.floor(Math.random() * 90000) + 10000} de 2024`,
    nivel_complejidad: ['bajo', 'medio', 'alto'][Math.floor(Math.random() * 3)],
    capacidad_instalada: Math.floor(Math.random() * 200) + 10,
    observaciones: Math.random() < 0.5 ? 'Observaciones de ejemplo para la sede' : undefined,
    ...overrides
  };
}

/**
 * Create a complete mock SedePrestadora with all relationships
 */
export function createMockSedePrestadora(overrides: Partial<SedePrestadora> = {}): SedePrestadora {
  const baseData = createMockSede(overrides);
  
  return {
    ...baseData,
    organizacion: `org-${Math.random().toString(36).substr(2, 9)}`,
    servicios: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, i) => ({
      id: `servicio-${i}`,
      codigo: `${Math.floor(Math.random() * 900) + 100}`,
      nombre: `Servicio ${i + 1}`,
      habilitado: Math.random() < 0.8
    })),
    profesionales: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
      id: `prof-${i}`,
      nombre: PROFESSIONAL_NAMES[Math.floor(Math.random() * PROFESSIONAL_NAMES.length)],
      cargo: PROFESSIONAL_POSITIONS[Math.floor(Math.random() * PROFESSIONAL_POSITIONS.length)],
      activo: Math.random() < 0.9
    })),
    fecha_habilitacion: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    resolucion_habilitacion: `Resolución ${Math.floor(Math.random() * 90000) + 10000} de 2024`,
    nivel_complejidad: ['bajo', 'medio', 'alto'][Math.floor(Math.random() * 3)],
    capacidad_instalada: Math.floor(Math.random() * 200) + 10,
    ...overrides
  } as SedePrestadora;
}

/**
 * Create multiple mock sedes for list testing
 */
export function createMockSedesList(count: number = 10, overrides: Partial<SedeListItem> = {}): SedeListItem[] {
  return Array.from({ length: count }, (_, i) => 
    createMockSede({
      numero_sede: (i + 1).toString().padStart(2, '0'),
      ...overrides
    })
  );
}

/**
 * Create a mock sede with Colombian healthcare compliance
 */
export function createMockCompliantSede(overrides: Partial<SedeListItem> = {}): SedeListItem {
  return createMockSede({
    codigo_prestador: '123456789012', // Valid 12-digit REPS
    telefono_principal: '+57 301 234 5678', // Valid Colombian phone
    email: 'sede@ips-compliant.com.co', // Valid Colombian healthcare email
    tipo_sede: 'principal',
    es_sede_principal: true,
    estado: 'activa',
    fecha_habilitacion: '2024-01-15',
    resolucion_habilitacion: 'Resolución 12345 de 2024',
    nivel_complejidad: 'medio',
    atencion_24_horas: false,
    ...overrides
  });
}

/**
 * Create a mock sede with validation errors for testing
 */
export function createMockInvalidSede(overrides: Partial<SedeListItem> = {}): SedeListItem {
  return createMockSede({
    numero_sede: '', // Empty required field
    codigo_prestador: '12345', // Invalid REPS format
    nombre_sede: 'A', // Too short
    telefono_principal: '123456789', // Invalid Colombian phone
    email: 'invalid-email', // Invalid email format
    direccion: '', // Empty required field
    departamento: '',
    municipio: '',
    nombre_responsable: '',
    cargo_responsable: '',
    ...overrides
  });
}

/**
 * Create sede data for specific test scenarios
 */
export const sedeTestScenarios = {
  /**
   * Principal sede - must meet all requirements
   */
  principal: () => createMockSede({
    tipo_sede: 'principal',
    es_sede_principal: true,
    numero_sede: '01',
    estado: 'activa',
    atencion_24_horas: true,
    nivel_complejidad: 'alto',
    capacidad_instalada: 100
  }),

  /**
   * Ambulatory sede - specific for outpatient services
   */
  ambulatoria: () => createMockSede({
    tipo_sede: 'ambulatoria',
    es_sede_principal: false,
    atencion_24_horas: false,
    nivel_complejidad: 'bajo',
    capacidad_instalada: 20
  }),

  /**
   * Hospital sede - full service facility
   */
  hospitalaria: () => createMockSede({
    tipo_sede: 'hospitalaria',
    es_sede_principal: false,
    atencion_24_horas: true,
    nivel_complejidad: 'alto',
    capacidad_instalada: 200
  }),

  /**
   * Emergency sede - urgent care
   */
  urgencias: () => createMockSede({
    tipo_sede: 'urgencias',
    es_sede_principal: false,
    atencion_24_horas: true,
    nivel_complejidad: 'medio',
    capacidad_instalada: 50
  }),

  /**
   * Inactive sede for testing filters
   */
  inactiva: () => createMockSede({
    estado: 'inactiva',
    fecha_actualizacion: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  }),

  /**
   * Sede with all optional fields filled
   */
  completa: () => createMockSede({
    telefono_secundario: generateColombianPhone(),
    codigo_postal: '110111',
    observaciones: 'Sede con todos los campos opcionales completados para testing integral',
    fecha_habilitacion: '2024-01-15',
    resolucion_habilitacion: 'Resolución 12345 de 2024'
  })
};

export default {
  createMockSede,
  createMockSedeFormData,
  createMockSedePrestadora,
  createMockSedesList,
  createMockCompliantSede,
  createMockInvalidSede,
  sedeTestScenarios
};