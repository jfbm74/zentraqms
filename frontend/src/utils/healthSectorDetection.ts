/**
 * Health Sector Detection Utilities
 * 
 * Automatically detects if an organization belongs to the health sector
 * based on organization type, name, and other indicators
 */

// Health-related organization types
const HEALTH_ORGANIZATION_TYPES = [
  'ips',
  'eps', 
  'hospital',
  'clinica',
  'centro_medico',
  'laboratorio'
];

// Health-related keywords in organization names
const HEALTH_KEYWORDS = [
  // Spanish terms
  'hospital', 'clínica', 'clinic', 'centro médico', 'centro medico',
  'laboratorio', 'lab', 'medicina', 'salud', 'health',
  'consultorio', 'policlínico', 'policlinico', 'dispensario',
  'sanatorio', 'instituto médico', 'instituto medico',
  'centro de salud', 'centro salud', 'unidad médica', 'unidad medica',
  
  // Medical specialties
  'cardiología', 'cardiologia', 'neurología', 'neurologia',
  'ginecología', 'ginecologia', 'pediatría', 'pediatria',
  'ortopedia', 'radiología', 'radiologia', 'patología', 'patologia',
  'odontología', 'odontologia', 'oftalmología', 'oftalmologia',
  'dermatología', 'dermatologia', 'psiquiatría', 'psiquiatria',
  'oncología', 'oncologia', 'urología', 'urologia',
  
  // Medical services
  'diagnóstico', 'diagnostico', 'terapia', 'rehabilitación', 'rehabilitacion',
  'cirugía', 'cirugia', 'consulta externa', 'urgencias', 'emergencias',
  'cuidados intensivos', 'uci', 'maternidad', 'neonatal',
  
  // Health institutions
  'ips', 'eps', 'esi', 'eapb', 'arl', 'crue', 'red hospitalaria',
  'fundación médica', 'fundacion medica', 'corporación médica', 'corporacion medica',
  
  // Colombian specific
  'prestador', 'habilitado', 'reps', 'supersalud', 'invima'
];

// Common health institution abbreviations/suffixes
const HEALTH_ABBREVIATIONS = [
  'ips', 'eps', 'esi', 'sa', 'sas', 'ltda', 'fundación', 'fundacion',
  'corporación', 'corporacion', 'asociación', 'asociacion'
];

interface OrganizationData {
  name?: string;
  razon_social?: string;
  tipo_organizacion?: string;
  sector_economico?: string;
  descripcion?: string;
  email?: string;
  website?: string;
}

interface HealthDetectionResult {
  isHealthSector: boolean;
  confidence: number; // 0-1 scale
  reasons: string[];
  suggestions?: {
    sector_economico?: string;
    tipo_organizacion?: string;
    nivel_complejidad?: string;
  };
}

/**
 * Detects if an organization belongs to the health sector
 */
export const detectHealthSector = (data: OrganizationData): HealthDetectionResult => {
  const reasons: string[] = [];
  let confidence = 0;
  
  // Check explicit sector
  if (data.sector_economico === 'salud') {
    confidence += 0.9;
    reasons.push('Sector económico explícitamente marcado como "salud"');
    return {
      isHealthSector: true,
      confidence,
      reasons,
      suggestions: {
        tipo_organizacion: data.tipo_organizacion || 'ips'
      }
    };
  }
  
  // Check organization type
  if (data.tipo_organizacion && HEALTH_ORGANIZATION_TYPES.includes(data.tipo_organizacion)) {
    confidence += 0.8;
    reasons.push(`Tipo de organización: ${data.tipo_organizacion.toUpperCase()}`);
  }
  
  // Check organization name/razón social
  const organizationName = (data.name || data.razon_social || '').toLowerCase();
  if (organizationName) {
    const foundKeywords = HEALTH_KEYWORDS.filter(keyword => 
      organizationName.includes(keyword.toLowerCase())
    );
    
    if (foundKeywords.length > 0) {
      confidence += Math.min(0.6, foundKeywords.length * 0.2);
      reasons.push(`Nombre contiene términos de salud: ${foundKeywords.slice(0, 3).join(', ')}`);
    }
    
    // Check for health abbreviations
    const foundAbbreviations = HEALTH_ABBREVIATIONS.filter(abbr => 
      organizationName.includes(abbr.toLowerCase())
    );
    
    if (foundAbbreviations.length > 0) {
      confidence += 0.3;
      reasons.push(`Contiene abreviaciones del sector salud: ${foundAbbreviations.join(', ')}`);
    }
  }
  
  // Check description
  if (data.descripcion) {
    const description = data.descripcion.toLowerCase();
    const foundKeywords = HEALTH_KEYWORDS.filter(keyword => 
      description.includes(keyword.toLowerCase())
    );
    
    if (foundKeywords.length > 0) {
      confidence += Math.min(0.4, foundKeywords.length * 0.1);
      reasons.push(`Descripción menciona servicios de salud`);
    }
  }
  
  // Check email domain
  if (data.email) {
    const emailDomain = data.email.split('@')[1]?.toLowerCase() || '';
    const healthDomains = ['salud', 'hospital', 'clinica', 'ips', 'eps', 'medico'];
    
    if (healthDomains.some(domain => emailDomain.includes(domain))) {
      confidence += 0.2;
      reasons.push(`Dominio de email sugiere sector salud`);
    }
  }
  
  // Check website
  if (data.website) {
    const website = data.website.toLowerCase();
    const healthDomains = ['salud', 'hospital', 'clinica', 'ips', 'eps', 'medico'];
    
    if (healthDomains.some(domain => website.includes(domain))) {
      confidence += 0.2;
      reasons.push(`Sitio web sugiere sector salud`);
    }
  }
  
  // Determine suggestions based on detected patterns
  const suggestions: HealthDetectionResult['suggestions'] = {};
  
  if (confidence > 0.6) {
    suggestions.sector_economico = 'salud';
    
    if (organizationName.includes('hospital')) {
      suggestions.tipo_organizacion = 'hospital';
      suggestions.nivel_complejidad = 'III';
    } else if (organizationName.includes('clínica') || organizationName.includes('clinica')) {
      suggestions.tipo_organizacion = 'clinica';
      suggestions.nivel_complejidad = 'II';
    } else if (organizationName.includes('laboratorio')) {
      suggestions.tipo_organizacion = 'laboratorio';
      suggestions.nivel_complejidad = 'I';
    } else if (organizationName.includes('centro')) {
      suggestions.tipo_organizacion = 'centro_medico';
      suggestions.nivel_complejidad = 'I';
    } else {
      suggestions.tipo_organizacion = 'ips';
      suggestions.nivel_complejidad = 'II';
    }
  }
  
  return {
    isHealthSector: confidence > 0.6,
    confidence: Math.min(confidence, 1),
    reasons,
    suggestions: Object.keys(suggestions).length > 0 ? suggestions : undefined
  };
};

/**
 * Suggests health organization classification based on name and type
 */
export const suggestHealthClassification = (organizationName: string, organizationType?: string) => {
  const name = organizationName.toLowerCase();
  
  // Default classification
  let classification = {
    naturaleza_juridica: 'privada',
    tipo_prestador: 'IPS',
    nivel_complejidad: 'II'
  };
  
  // Determine naturaleza_juridica
  if (name.includes('público') || name.includes('publico') || 
      name.includes('municipal') || name.includes('departamental') ||
      name.includes('nacional') || name.includes('estatal')) {
    classification.naturaleza_juridica = 'publica';
  } else if (name.includes('mixta')) {
    classification.naturaleza_juridica = 'mixta';
  }
  
  // Determine tipo_prestador
  if (name.includes('hospital')) {
    classification.tipo_prestador = 'HOSPITAL';
    classification.nivel_complejidad = 'III';
  } else if (name.includes('clínica') || name.includes('clinica')) {
    classification.tipo_prestador = 'CLINICA';
    classification.nivel_complejidad = 'II';
  } else if (name.includes('laboratorio')) {
    classification.tipo_prestador = 'LABORATORIO';
    classification.nivel_complejidad = 'I';
  } else if (name.includes('centro diagnóstico') || name.includes('centro diagnostico')) {
    classification.tipo_prestador = 'CENTRO_DIAGNOSTICO';
    classification.nivel_complejidad = 'I';
  } else if (name.includes('ambulatorio')) {
    classification.tipo_prestador = 'AMBULATORIO';
    classification.nivel_complejidad = 'I';
  }
  
  // Adjust based on organization type
  if (organizationType) {
    switch (organizationType) {
      case 'hospital':
        classification.tipo_prestador = 'HOSPITAL';
        classification.nivel_complejidad = 'III';
        break;
      case 'clinica':
        classification.tipo_prestador = 'CLINICA';
        classification.nivel_complejidad = 'II';
        break;
      case 'laboratorio':
        classification.tipo_prestador = 'LABORATORIO';
        classification.nivel_complejidad = 'I';
        break;
      case 'centro_medico':
        classification.tipo_prestador = 'CENTRO_MEDICO';
        classification.nivel_complejidad = 'I';
        break;
    }
  }
  
  return classification;
};

/**
 * Validates if a REPS code format is correct
 */
export const validateRepsFormat = (codigo: string): { valid: boolean; message: string } => {
  if (!codigo) {
    return { valid: false, message: 'El código REPS es requerido' };
  }
  
  if (codigo.length !== 12) {
    return { valid: false, message: 'El código REPS debe tener exactamente 12 dígitos' };
  }
  
  if (!/^\d{12}$/.test(codigo)) {
    return { valid: false, message: 'El código REPS debe contener solo números' };
  }
  
  return { valid: true, message: 'Formato de código REPS válido' };
};

/**
 * Generates a suggested REPS code for testing (mock)
 */
export const generateMockRepsCode = (departamento?: string): string => {
  // Colombian department codes (first 2 digits)
  const departmentCodes: Record<string, string> = {
    'antioquia': '05',
    'atlántico': '08',
    'bogotá': '11',
    'bolívar': '13',
    'boyacá': '15',
    'caldas': '17',
    'caquetá': '18',
    'cauca': '19',
    'césar': '20',
    'córdoba': '23',
    'cundinamarca': '25',
    'chocó': '27',
    'huila': '41',
    'la guajira': '44',
    'magdalena': '47',
    'meta': '50',
    'nariño': '52',
    'norte de santander': '54',
    'quindío': '63',
    'risaralda': '66',
    'santander': '68',
    'sucre': '70',
    'tolima': '73',
    'valle del cauca': '76',
    'arauca': '81',
    'casanare': '85',
    'putumayo': '86',
    'san andrés': '88',
    'amazonas': '91',
    'guainía': '94',
    'guaviare': '95',
    'vaupés': '97',
    'vichada': '99'
  };
  
  const deptCode = departmentCodes[departamento?.toLowerCase() || 'bogotá'] || '11';
  const randomDigits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const checkDigit = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `${deptCode}${randomDigits}${checkDigit}`;
};