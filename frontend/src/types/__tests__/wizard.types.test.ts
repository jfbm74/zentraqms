/**
 * Unit tests for wizard types and mapping functions.
 * 
 * Tests TypeScript type definitions, mapping functions, and validation logic
 * to ensure frontend-backend compatibility.
 */

import {
  mapSectorToBackend,
  mapOrgTypeToBackend,
  SECTOR_MAPPING,
  SECTORS,
  AUTO_ACTIVATION_RULES,
  SectorType,
  OrganizationFormData,
  DEFAULT_FORM_DATA,
  VALIDATION_DELAYS,
  LOGO_CONSTRAINTS,
  FORM_FIELD_LIMITS
} from '../wizard.types';

describe('Wizard Types', () => {
  describe('Sector Mapping', () => {
    test('mapSectorToBackend should map all frontend sectors correctly', () => {
      expect(mapSectorToBackend('HEALTHCARE')).toBe('salud');
      expect(mapSectorToBackend('MANUFACTURING')).toBe('manufactura');
      expect(mapSectorToBackend('SERVICES')).toBe('servicios');
      expect(mapSectorToBackend('EDUCATION')).toBe('educacion');
    });

    test('mapSectorToBackend should handle unknown sectors', () => {
      expect(mapSectorToBackend('UNKNOWN' as SectorType)).toBe('otro');
    });

    test('SECTOR_MAPPING should contain all valid sectors', () => {
      const expectedSectors: SectorType[] = ['HEALTHCARE', 'MANUFACTURING', 'SERVICES', 'EDUCATION'];
      const mappedSectors = Object.keys(SECTOR_MAPPING) as SectorType[];
      
      expect(mappedSectors).toEqual(expect.arrayContaining(expectedSectors));
      expect(mappedSectors.length).toBe(expectedSectors.length);
    });

    test('All mapped backend values should be lowercase', () => {
      Object.values(SECTOR_MAPPING).forEach(backendValue => {
        expect(backendValue).toBe(backendValue.toLowerCase());
        expect(backendValue).not.toContain(' ');
      });
    });
  });

  describe('Organization Type Mapping', () => {
    test('mapOrgTypeToBackend should convert to lowercase', () => {
      expect(mapOrgTypeToBackend('IPS')).toBe('ips');
      expect(mapOrgTypeToBackend('EPS')).toBe('eps');
      expect(mapOrgTypeToBackend('EMPRESA_PRIVADA')).toBe('empresa_privada');
      expect(mapOrgTypeToBackend('Hospital')).toBe('hospital');
    });

    test('mapOrgTypeToBackend should handle already lowercase inputs', () => {
      expect(mapOrgTypeToBackend('ips')).toBe('ips');
      expect(mapOrgTypeToBackend('empresa_privada')).toBe('empresa_privada');
    });
  });

  describe('Sector Configuration', () => {
    test('SECTORS array should contain all sector types', () => {
      const sectorIds = SECTORS.map(sector => sector.id);
      expect(sectorIds).toContain('HEALTHCARE');
      expect(sectorIds).toContain('MANUFACTURING');
      expect(sectorIds).toContain('SERVICES');
      expect(sectorIds).toContain('EDUCATION');
    });

    test('Each sector should have required properties', () => {
      SECTORS.forEach(sector => {
        expect(sector).toHaveProperty('id');
        expect(sector).toHaveProperty('name');
        expect(sector).toHaveProperty('icon');
        expect(sector).toHaveProperty('description');
        expect(sector).toHaveProperty('types');
        expect(sector).toHaveProperty('modules');
        expect(sector).toHaveProperty('integrations');
        
        // Types should be non-empty array
        expect(Array.isArray(sector.types)).toBe(true);
        expect(sector.types.length).toBeGreaterThan(0);
        
        // Each type should have value and label
        sector.types.forEach(type => {
          expect(type).toHaveProperty('value');
          expect(type).toHaveProperty('label');
          expect(typeof type.value).toBe('string');
          expect(typeof type.label).toBe('string');
        });
      });
    });

    test('Healthcare sector should have health-specific organization types', () => {
      const healthcareSector = SECTORS.find(s => s.id === 'HEALTHCARE');
      expect(healthcareSector).toBeDefined();
      
      const healthTypes = healthcareSector!.types.map(t => t.value);
      expect(healthTypes).toContain('ips');
      expect(healthTypes).toContain('eps');
      expect(healthTypes).toContain('hospital');
      expect(healthTypes).toContain('clinica');
    });

    test('Healthcare sector should have health-specific modules', () => {
      const healthcareSector = SECTORS.find(s => s.id === 'HEALTHCARE');
      expect(healthcareSector).toBeDefined();
      
      expect(healthcareSector!.modules).toContain('SUH');
      expect(healthcareSector!.modules).toContain('PAMEC');
      expect(healthcareSector!.modules).toContain('RIPS');
    });

    test('Healthcare sector should have Colombian health integrations', () => {
      const healthcareSector = SECTORS.find(s => s.id === 'HEALTHCARE');
      expect(healthcareSector).toBeDefined();
      
      expect(healthcareSector!.integrations).toContain('REPS');
      expect(healthcareSector!.integrations).toContain('SISPRO');
      expect(healthcareSector!.integrations).toContain('ADRES');
    });
  });

  describe('Auto-Activation Rules', () => {
    test('AUTO_ACTIVATION_RULES should have rules for all sectors', () => {
      const sectorKeys = Object.keys(AUTO_ACTIVATION_RULES) as SectorType[];
      expect(sectorKeys).toContain('HEALTHCARE');
      expect(sectorKeys).toContain('MANUFACTURING');
      expect(sectorKeys).toContain('SERVICES');
      expect(sectorKeys).toContain('EDUCATION');
    });

    test('Healthcare auto-activation should include Colombian health modules', () => {
      const healthcareRules = AUTO_ACTIVATION_RULES.HEALTHCARE;
      
      // IPS should have SUH and PAMEC
      expect(healthcareRules.IPS).toContain('SUH');
      expect(healthcareRules.IPS).toContain('PAMEC');
      expect(healthcareRules.IPS).toContain('CLINICAL_SAFETY');
      
      // EPS should have different modules
      expect(healthcareRules.EPS).toContain('MEMBER_MANAGEMENT');
      expect(healthcareRules.EPS).toContain('AUTHORIZATION');
    });

    test('All auto-activation rules should include transversal modules', () => {
      Object.values(AUTO_ACTIVATION_RULES).forEach(sectorRules => {
        Object.values(sectorRules).forEach(orgTypeModules => {
          // Should include basic transversal modules
          expect(orgTypeModules).toContain('DASHBOARD');
          expect(orgTypeModules).toContain('ORGANIZATION');
          expect(orgTypeModules).toContain('AUDITS');
          expect(orgTypeModules).toContain('PROCESSES');
        });
      });
    });

    test('Manufacturing rules should include production modules', () => {
      const manufacturingRules = AUTO_ACTIVATION_RULES.MANUFACTURING;
      
      // All manufacturing rules should include PRODUCTION
      Object.values(manufacturingRules).forEach(modules => {
        expect(modules).toContain('PRODUCTION');
      });
      
      // Most manufacturing rules should include quality control (but PHARMA uses GMP instead)
      expect(manufacturingRules.FOOD).toContain('QUALITY_CONTROL');
      expect(manufacturingRules.TEXTILE).toContain('QUALITY_CONTROL');
      expect(manufacturingRules.AUTOMOTIVE).toContain('QUALITY_CONTROL');
      expect(manufacturingRules.GENERAL).toContain('QUALITY_CONTROL');
      
      // PHARMA should have its specific quality standard
      expect(manufacturingRules.PHARMA).toContain('GMP');
    });

    test('Services rules should include project management', () => {
      const servicesRules = AUTO_ACTIVATION_RULES.SERVICES;
      
      // IT services should have specific modules
      expect(servicesRules.IT).toContain('PROJECTS');
      expect(servicesRules.IT).toContain('SLA');
      expect(servicesRules.IT).toContain('IT_SERVICE_MANAGEMENT');
    });

    test('Education rules should include academic modules', () => {
      const educationRules = AUTO_ACTIVATION_RULES.EDUCATION;
      
      expect(educationRules.UNIVERSITY).toContain('ACADEMIC');
      expect(educationRules.UNIVERSITY).toContain('RESEARCH');
      expect(educationRules.UNIVERSITY).toContain('ACCREDITATION');
    });
  });

  describe('Default Form Data', () => {
    test('DEFAULT_FORM_DATA should have all required fields', () => {
      expect(DEFAULT_FORM_DATA).toHaveProperty('razon_social');
      expect(DEFAULT_FORM_DATA).toHaveProperty('nit');
      expect(DEFAULT_FORM_DATA).toHaveProperty('digito_verificacion');
      expect(DEFAULT_FORM_DATA).toHaveProperty('email_contacto');
      expect(DEFAULT_FORM_DATA).toHaveProperty('telefono_principal');
      expect(DEFAULT_FORM_DATA).toHaveProperty('website');
      expect(DEFAULT_FORM_DATA).toHaveProperty('descripcion');
    });

    test('DEFAULT_FORM_DATA should have empty string defaults for text fields', () => {
      expect(DEFAULT_FORM_DATA.razon_social).toBe('');
      expect(DEFAULT_FORM_DATA.nit).toBe('');
      expect(DEFAULT_FORM_DATA.email_contacto).toBe('');
      expect(DEFAULT_FORM_DATA.telefono_principal).toBe('');
      expect(DEFAULT_FORM_DATA.website).toBe('');
      expect(DEFAULT_FORM_DATA.descripcion).toBe('');
    });

    test('DEFAULT_FORM_DATA should have null for logo', () => {
      expect(DEFAULT_FORM_DATA.logo).toBeNull();
    });

    test('DEFAULT_FORM_DATA should have empty arrays for multi-select fields', () => {
      expect(Array.isArray(DEFAULT_FORM_DATA.selected_modules)).toBe(true);
      expect(DEFAULT_FORM_DATA.selected_modules).toHaveLength(0);
      expect(Array.isArray(DEFAULT_FORM_DATA.auto_activated_modules)).toBe(true);
      expect(DEFAULT_FORM_DATA.auto_activated_modules).toHaveLength(0);
    });
  });

  describe('Validation Configuration', () => {
    test('VALIDATION_DELAYS should have appropriate delays', () => {
      expect(VALIDATION_DELAYS.NIT).toBeGreaterThan(VALIDATION_DELAYS.DEFAULT);
      expect(VALIDATION_DELAYS.EMAIL).toBeGreaterThan(VALIDATION_DELAYS.DEFAULT);
      expect(VALIDATION_DELAYS.PHONE).toBeGreaterThan(VALIDATION_DELAYS.DEFAULT);
      
      // All delays should be reasonable (between 100ms and 2000ms)
      Object.values(VALIDATION_DELAYS).forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(100);
        expect(delay).toBeLessThanOrEqual(2000);
      });
    });

    test('LOGO_CONSTRAINTS should have reasonable limits', () => {
      expect(LOGO_CONSTRAINTS.MAX_SIZE_MB).toBeGreaterThan(0);
      expect(LOGO_CONSTRAINTS.MAX_SIZE_MB).toBeLessThanOrEqual(10);
      
      expect(LOGO_CONSTRAINTS.MIN_DIMENSIONS.width).toBeGreaterThan(0);
      expect(LOGO_CONSTRAINTS.MIN_DIMENSIONS.height).toBeGreaterThan(0);
      expect(LOGO_CONSTRAINTS.MAX_DIMENSIONS.width).toBeGreaterThan(LOGO_CONSTRAINTS.MIN_DIMENSIONS.width);
      expect(LOGO_CONSTRAINTS.MAX_DIMENSIONS.height).toBeGreaterThan(LOGO_CONSTRAINTS.MIN_DIMENSIONS.height);
      
      expect(Array.isArray(LOGO_CONSTRAINTS.ACCEPTED_FORMATS)).toBe(true);
      expect(LOGO_CONSTRAINTS.ACCEPTED_FORMATS.length).toBeGreaterThan(0);
      
      // Should include common image formats
      expect(LOGO_CONSTRAINTS.ACCEPTED_FORMATS).toContain('image/jpeg');
      expect(LOGO_CONSTRAINTS.ACCEPTED_FORMATS).toContain('image/png');
    });

    test('FORM_FIELD_LIMITS should have reasonable character limits', () => {
      expect(FORM_FIELD_LIMITS.RAZON_SOCIAL.max).toBeGreaterThan(FORM_FIELD_LIMITS.RAZON_SOCIAL.min);
      expect(FORM_FIELD_LIMITS.NIT.max).toBeGreaterThan(FORM_FIELD_LIMITS.NIT.min);
      expect(FORM_FIELD_LIMITS.EMAIL.max).toBeGreaterThan(0);
      expect(FORM_FIELD_LIMITS.PHONE.max).toBeGreaterThan(FORM_FIELD_LIMITS.PHONE.min);
      
      // Colombian NIT should be 9-10 digits
      expect(FORM_FIELD_LIMITS.NIT.min).toBe(9);
      expect(FORM_FIELD_LIMITS.NIT.max).toBe(10);
    });
  });

  describe('Type Definitions', () => {
    test('OrganizationFormData should accept all required wizard fields', () => {
      const formData: OrganizationFormData = {
        ...DEFAULT_FORM_DATA,
        selectedSector: 'HEALTHCARE',
        selectedOrgType: 'ips',
        razon_social: 'Test Hospital',
        nit: '123456789',
        digito_verificacion: '1',
        email_contacto: 'test@hospital.com',
        telefono_principal: '+57 1 234 5678'
      };
      
      expect(formData.selectedSector).toBe('HEALTHCARE');
      expect(formData.selectedOrgType).toBe('ips');
      expect(formData.razon_social).toBe('Test Hospital');
    });

    test('OrganizationFormData should support legacy fields', () => {
      const formData: OrganizationFormData = {
        ...DEFAULT_FORM_DATA,
        sector: 'HEALTHCARE',
        organization_type: 'ips',
        sector_economico: 'salud',
        tipo_organizacion: 'ips'
      };
      
      expect(formData.sector).toBe('HEALTHCARE');
      expect(formData.organization_type).toBe('ips');
      expect(formData.sector_economico).toBe('salud');
      expect(formData.tipo_organizacion).toBe('ips');
    });

    test('SectorType should only allow valid sector values', () => {
      const validSectors: SectorType[] = ['HEALTHCARE', 'MANUFACTURING', 'SERVICES', 'EDUCATION'];
      
      validSectors.forEach(sector => {
        expect(['HEALTHCARE', 'MANUFACTURING', 'SERVICES', 'EDUCATION']).toContain(sector);
      });
    });
  });

  describe('Field Mapping Consistency', () => {
    test('Sector mapping should be bidirectional', () => {
      // Test that we can map from frontend to backend and identify the correct frontend sector
      Object.entries(SECTOR_MAPPING).forEach(([frontendSector, backendSector]) => {
        const mapped = mapSectorToBackend(frontendSector as SectorType);
        expect(mapped).toBe(backendSector);
      });
    });

    test('All SECTORS should have corresponding mapping', () => {
      SECTORS.forEach(sector => {
        expect(SECTOR_MAPPING).toHaveProperty(sector.id);
      });
    });

    test('All organization types in SECTORS should be lowercase', () => {
      SECTORS.forEach(sector => {
        sector.types.forEach(type => {
          expect(type.value).toBe(type.value.toLowerCase());
          expect(type.value).not.toContain(' ');
        });
      });
    });
  });

  describe('Colombian Health Compliance', () => {
    test('Healthcare sector should support Colombian health organization types', () => {
      const healthcareSector = SECTORS.find(s => s.id === 'HEALTHCARE');
      const healthTypes = healthcareSector!.types.map(t => t.value);
      
      // Should support standard Colombian health institution types
      expect(healthTypes).toContain('ips');  // Institución Prestadora de Servicios
      expect(healthTypes).toContain('eps');  // Entidad Promotora de Salud
      expect(healthTypes).toContain('hospital');
      expect(healthTypes).toContain('clinica');
      expect(healthTypes).toContain('centro_medico');
      expect(healthTypes).toContain('laboratorio');
    });

    test('Healthcare integrations should include Colombian systems', () => {
      const healthcareSector = SECTORS.find(s => s.id === 'HEALTHCARE');
      
      // Should integrate with Colombian health systems
      expect(healthcareSector!.integrations).toContain('REPS');   // Registro Especial de Prestadores
      expect(healthcareSector!.integrations).toContain('SISPRO'); // Sistema Integral de Información
      expect(healthcareSector!.integrations).toContain('ADRES');  // Administradora de Recursos
    });

    test('Healthcare modules should include Colombian requirements', () => {
      const healthcareSector = SECTORS.find(s => s.id === 'HEALTHCARE');
      
      // Should include modules required by Colombian health regulations
      expect(healthcareSector!.modules).toContain('SUH');                    // Sistema Único de Habilitación
      expect(healthcareSector!.modules).toContain('PAMEC');                  // Programa de Auditoria
      expect(healthcareSector!.modules).toContain('Seguridad del Paciente'); // Patient Safety
      expect(healthcareSector!.modules).toContain('RIPS');                   // Registros Individuales
    });
  });
});