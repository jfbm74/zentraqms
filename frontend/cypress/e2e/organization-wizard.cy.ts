/**
 * End-to-end tests for the organization wizard.
 * 
 * Tests complete user workflows from sector selection through organization creation,
 * including health organization auto-creation and field mapping validation.
 */

describe('Organization Wizard', () => {
  beforeEach(() => {
    // Login and navigate to wizard
    cy.login('testuser', 'testpass123');
    cy.visit('/wizard/organization');
  });

  describe('Complete Wizard Flow - Health Organization IPS', () => {
    it('should create a complete IPS health organization', () => {
      // Step 1: Sector Selection
      cy.get('[data-testid="sector-selection"]').should('be.visible');
      cy.get('[data-testid="sector-healthcare"]').click();
      cy.get('[data-testid="org-type-ips"]').click();
      
      // Verify health-specific modules are shown
      cy.contains('SUH').should('be.visible');
      cy.contains('PAMEC').should('be.visible');
      cy.contains('REPS').should('be.visible');
      
      cy.get('[data-testid="btn-next"]').click();

      // Step 2: Organization Information
      cy.get('[data-testid="organization-form"]').should('be.visible');
      
      // Fill basic information
      cy.get('[data-testid="input-razon-social"]')
        .type('Hospital San Rafael de Bogotá S.A.S.');
      
      cy.get('[data-testid="input-nit"]')
        .type('860123456');
      
      cy.get('[data-testid="input-digito-verificacion"]')
        .type('7');
      
      // Verify NIT validation
      cy.get('[data-testid="nit-validation-status"]')
        .should('contain', 'NIT disponible')
        .and('have.class', 'success');
      
      // Fill contact information
      cy.get('[data-testid="input-email-contacto"]')
        .type('info@hospitalsanrafael.com');
      
      cy.get('[data-testid="input-telefono-principal"]')
        .type('+57 1 456 7890');
      
      cy.get('[data-testid="input-website"]')
        .type('https://www.hospitalsanrafael.com');
      
      // Fill additional information
      cy.get('[data-testid="input-descripcion"]')
        .type('Hospital universitario de alta complejidad especializado en servicios médicos y quirúrgicos de nivel IV.');
      
      cy.get('[data-testid="select-tamaño-empresa"]')
        .select('grande');
      
      cy.get('[data-testid="input-fecha-fundacion"]')
        .type('1985-03-15');
      
      // Upload logo
      cy.get('[data-testid="logo-upload"]')
        .selectFile('cypress/fixtures/test-logo.png');
      
      cy.get('[data-testid="logo-preview"]').should('be.visible');
      
      cy.get('[data-testid="btn-create-organization"]').click();

      // Verify creation success
      cy.get('[data-testid="success-modal"]').should('be.visible');
      cy.contains('Organización creada exitosamente').should('be.visible');
      
      // Verify health organization was auto-created
      cy.contains('Código prestador REPS').should('be.visible');
      cy.get('[data-testid="health-org-codigo"]')
        .should('have.length.greaterThan', 0)
        .and('match', /^\d{12}$/); // 12-digit code
      
      // Verify organization details
      cy.get('[data-testid="org-summary"]').within(() => {
        cy.contains('Hospital San Rafael de Bogotá S.A.S.').should('be.visible');
        cy.contains('860123456-7').should('be.visible');
        cy.contains('info@hospitalsanrafael.com').should('be.visible');
        cy.contains('IPS').should('be.visible');
        cy.contains('Salud').should('be.visible');
      });
    });
  });

  describe('Complete Wizard Flow - Health Organization EPS', () => {
    it('should create a complete EPS health organization', () => {
      // Step 1: Sector Selection
      cy.get('[data-testid="sector-healthcare"]').click();
      cy.get('[data-testid="org-type-eps"]').click();
      cy.get('[data-testid="btn-next"]').click();

      // Step 2: Organization Information
      cy.get('[data-testid="input-razon-social"]')
        .type('EPS Salud Total S.A.');
      
      cy.get('[data-testid="input-nit"]')
        .type('860456789');
      
      cy.get('[data-testid="input-digito-verificacion"]')
        .type('2');
      
      cy.get('[data-testid="input-email-contacto"]')
        .type('contacto@saludtotal.com');
      
      cy.get('[data-testid="input-telefono-principal"]')
        .type('+57 1 789 4561');
      
      cy.get('[data-testid="input-descripcion"]')
        .type('Entidad Promotora de Salud comprometida con el bienestar de nuestros afiliados.');
      
      cy.get('[data-testid="btn-create-organization"]').click();

      // Verify EPS-specific health organization creation
      cy.get('[data-testid="success-modal"]').should('be.visible');
      cy.get('[data-testid="org-summary"]').within(() => {
        cy.contains('EPS').should('be.visible');
        cy.contains('Salud').should('be.visible');
      });
    });
  });

  describe('Complete Wizard Flow - Non-Health Organization', () => {
    it('should create a services organization without health profile', () => {
      // Step 1: Sector Selection
      cy.get('[data-testid="sector-services"]').click();
      cy.get('[data-testid="org-type-empresa-privada"]').click();
      cy.get('[data-testid="btn-next"]').click();

      // Step 2: Organization Information
      cy.get('[data-testid="input-razon-social"]')
        .type('Consultoría Empresarial ABC S.A.S.');
      
      cy.get('[data-testid="input-nit"]')
        .type('900123456');
      
      cy.get('[data-testid="input-digito-verificacion"]')
        .type('5');
      
      cy.get('[data-testid="input-email-contacto"]')
        .type('info@consultoriabc.com');
      
      cy.get('[data-testid="input-telefono-principal"]')
        .type('+57 1 321 4567');
      
      cy.get('[data-testid="input-descripcion"]')
        .type('Empresa de consultoría especializada en gestión empresarial y optimización de procesos.');
      
      cy.get('[data-testid="btn-create-organization"]').click();

      // Verify creation success without health profile
      cy.get('[data-testid="success-modal"]').should('be.visible');
      cy.get('[data-testid="org-summary"]').within(() => {
        cy.contains('Consultoría Empresarial ABC S.A.S.').should('be.visible');
        cy.contains('Servicios').should('be.visible');
        cy.contains('Empresa Privada').should('be.visible');
      });
      
      // Should NOT have health organization info
      cy.contains('Código prestador REPS').should('not.exist');
    });
  });

  describe('Sector and Organization Type Mapping', () => {
    it('should correctly map all healthcare organization types', () => {
      const healthcareTypes = [
        { type: 'ips', label: 'IPS' },
        { type: 'eps', label: 'EPS' },
        { type: 'hospital', label: 'Hospital' },
        { type: 'clinica', label: 'Clínica' },
        { type: 'centro-medico', label: 'Centro Médico' },
        { type: 'laboratorio', label: 'Laboratorio' }
      ];

      healthcareTypes.forEach((orgType, index) => {
        cy.visit('/wizard/organization');
        
        // Select healthcare sector
        cy.get('[data-testid="sector-healthcare"]').click();
        cy.get(`[data-testid="org-type-${orgType.type}"]`).click();
        cy.get('[data-testid="btn-next"]').click();

        // Fill minimal required information
        cy.get('[data-testid="input-razon-social"]')
          .type(`Test ${orgType.label} ${index}`);
        
        cy.get('[data-testid="input-nit"]')
          .type(`86012345${index}`);
        
        cy.get('[data-testid="input-digito-verificacion"]')
          .type('1');
        
        cy.get('[data-testid="input-email-contacto"]')
          .type(`test${index}@example.com`);
        
        cy.get('[data-testid="input-telefono-principal"]')
          .type(`+57 1 123 456${index}`);
        
        cy.get('[data-testid="btn-create-organization"]').click();

        // Verify health organization was created
        cy.get('[data-testid="success-modal"]').should('be.visible');
        cy.contains('Código prestador REPS').should('be.visible');
      });
    });

    it('should correctly map all sector types', () => {
      const sectors = [
        { id: 'healthcare', backend: 'salud' },
        { id: 'manufacturing', backend: 'manufactura' },
        { id: 'services', backend: 'servicios' },
        { id: 'education', backend: 'educacion' }
      ];

      sectors.forEach((sector, index) => {
        cy.visit('/wizard/organization');
        
        // Select sector and basic organization type
        cy.get(`[data-testid="sector-${sector.id}"]`).click();
        cy.get('[data-testid="org-type-empresa-privada"]').click();
        cy.get('[data-testid="btn-next"]').click();

        // Fill minimal information
        cy.get('[data-testid="input-razon-social"]')
          .type(`Test Organization ${sector.id}`);
        
        cy.get('[data-testid="input-nit"]')
          .type(`90012345${index}`);
        
        cy.get('[data-testid="input-digito-verificacion"]')
          .type('1');
        
        cy.get('[data-testid="input-email-contacto"]')
          .type(`test-${sector.id}@example.com`);
        
        cy.get('[data-testid="input-telefono-principal"]')
          .type(`+57 1 987 654${index}`);
        
        cy.get('[data-testid="btn-create-organization"]').click();

        // Verify sector mapping in API call
        cy.intercept('POST', '/api/v1/wizard/').as('createOrganization');
        cy.wait('@createOrganization').then((interception) => {
          expect(interception.request.body).to.have.property('selectedSector', sector.id.toUpperCase());
        });
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      // Navigate to organization form
      cy.get('[data-testid="sector-healthcare"]').click();
      cy.get('[data-testid="org-type-ips"]').click();
      cy.get('[data-testid="btn-next"]').click();
    });

    it('should validate required fields', () => {
      // Try to submit without filling required fields
      cy.get('[data-testid="btn-create-organization"]').click();
      
      // Should show validation errors
      cy.get('[data-testid="error-razon-social"]')
        .should('be.visible')
        .and('contain', 'requerido');
      
      cy.get('[data-testid="error-nit"]')
        .should('be.visible')
        .and('contain', 'requerido');
      
      cy.get('[data-testid="error-email-contacto"]')
        .should('be.visible')
        .and('contain', 'requerido');
      
      cy.get('[data-testid="error-telefono-principal"]')
        .should('be.visible')
        .and('contain', 'requerido');
    });

    it('should validate NIT format', () => {
      // Test invalid NIT formats
      const invalidNits = ['123', '12345678901234567890', 'abc123456'];
      
      invalidNits.forEach(invalidNit => {
        cy.get('[data-testid="input-nit"]')
          .clear()
          .type(invalidNit);
        
        cy.get('[data-testid="input-digito-verificacion"]').click(); // Trigger validation
        
        cy.get('[data-testid="error-nit"]')
          .should('be.visible')
          .and('contain', 'formato válido');
      });
    });

    it('should validate email format', () => {
      const invalidEmails = ['invalid-email', '@example.com', 'test@'];
      
      invalidEmails.forEach(invalidEmail => {
        cy.get('[data-testid="input-email-contacto"]')
          .clear()
          .type(invalidEmail);
        
        cy.get('[data-testid="input-telefono-principal"]').click(); // Trigger validation
        
        cy.get('[data-testid="error-email-contacto"]')
          .should('be.visible')
          .and('contain', 'formato válido');
      });
    });

    it('should validate phone format', () => {
      const invalidPhones = ['123', '12345678901234567890'];
      
      invalidPhones.forEach(invalidPhone => {
        cy.get('[data-testid="input-telefono-principal"]')
          .clear()
          .type(invalidPhone);
        
        cy.get('[data-testid="input-email-contacto"]').click(); // Trigger validation
        
        cy.get('[data-testid="error-telefono-principal"]')
          .should('be.visible')
          .and('contain', 'formato válido');
      });
    });

    it('should validate duplicate NIT', () => {
      // First, create an organization
      cy.get('[data-testid="input-razon-social"]')
        .type('First Organization');
      
      cy.get('[data-testid="input-nit"]')
        .type('123456789');
      
      cy.get('[data-testid="input-digito-verificacion"]')
        .type('1');
      
      cy.get('[data-testid="input-email-contacto"]')
        .type('first@example.com');
      
      cy.get('[data-testid="input-telefono-principal"]')
        .type('+57 1 123 4567');
      
      cy.get('[data-testid="btn-create-organization"]').click();
      cy.get('[data-testid="success-modal"]').should('be.visible');
      cy.get('[data-testid="btn-close-modal"]').click();

      // Try to create another with same NIT
      cy.visit('/wizard/organization');
      cy.get('[data-testid="sector-services"]').click();
      cy.get('[data-testid="org-type-empresa-privada"]').click();
      cy.get('[data-testid="btn-next"]').click();
      
      cy.get('[data-testid="input-nit"]')
        .type('123456789');
      
      cy.get('[data-testid="input-digito-verificacion"]').click(); // Trigger validation
      
      cy.get('[data-testid="nit-validation-status"]')
        .should('contain', 'ya está registrado')
        .and('have.class', 'error');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network error
      cy.intercept('POST', '/api/v1/wizard/', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('createOrganizationError');

      // Complete form and submit
      cy.get('[data-testid="sector-healthcare"]').click();
      cy.get('[data-testid="org-type-ips"]').click();
      cy.get('[data-testid="btn-next"]').click();

      cy.get('[data-testid="input-razon-social"]')
        .type('Test Hospital');
      
      cy.get('[data-testid="input-nit"]')
        .type('123456789');
      
      cy.get('[data-testid="input-digito-verificacion"]')
        .type('1');
      
      cy.get('[data-testid="input-email-contacto"]')
        .type('test@example.com');
      
      cy.get('[data-testid="input-telefono-principal"]')
        .type('+57 1 123 4567');
      
      cy.get('[data-testid="btn-create-organization"]').click();

      // Should show error message
      cy.get('[data-testid="error-modal"]').should('be.visible');
      cy.contains('Error del servidor').should('be.visible');
      cy.get('[data-testid="btn-retry"]').should('be.visible');
    });

    it('should handle validation errors from backend', () => {
      // Simulate validation error response
      cy.intercept('POST', '/api/v1/wizard/', {
        statusCode: 400,
        body: {
          errors: {
            nit: ['Este NIT ya está registrado'],
            email_contacto: ['Formato de email inválido']
          }
        }
      }).as('createOrganizationValidationError');

      // Complete and submit form
      cy.get('[data-testid="sector-healthcare"]').click();
      cy.get('[data-testid="org-type-ips"]').click();
      cy.get('[data-testid="btn-next"]').click();

      cy.get('[data-testid="input-razon-social"]')
        .type('Test Hospital');
      
      cy.get('[data-testid="input-nit"]')
        .type('123456789');
      
      cy.get('[data-testid="input-digito-verificacion"]')
        .type('1');
      
      cy.get('[data-testid="input-email-contacto"]')
        .type('invalid-email');
      
      cy.get('[data-testid="input-telefono-principal"]')
        .type('+57 1 123 4567');
      
      cy.get('[data-testid="btn-create-organization"]').click();

      // Should show backend validation errors
      cy.get('[data-testid="error-nit"]')
        .should('contain', 'ya está registrado');
      
      cy.get('[data-testid="error-email-contacto"]')
        .should('contain', 'Formato de email inválido');
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should auto-save form data as user types', () => {
      cy.get('[data-testid="sector-healthcare"]').click();
      cy.get('[data-testid="org-type-ips"]').click();
      cy.get('[data-testid="btn-next"]').click();

      // Start typing - should trigger auto-save
      cy.get('[data-testid="input-razon-social"]')
        .type('Hospital Test Auto Save');
      
      // Should show auto-save indicator
      cy.get('[data-testid="auto-save-status"]')
        .should('contain', 'Guardando...')
        .then(() => {
          cy.get('[data-testid="auto-save-status"]')
            .should('contain', 'Guardado');
        });

      // Refresh page and verify data is restored
      cy.reload();
      
      cy.get('[data-testid="input-razon-social"]')
        .should('have.value', 'Hospital Test Auto Save');
    });
  });

  describe('Colombian Health Regulations Compliance', () => {
    it('should generate valid REPS codigo prestador for health organizations', () => {
      // Create health organization
      cy.get('[data-testid="sector-healthcare"]').click();
      cy.get('[data-testid="org-type-ips"]').click();
      cy.get('[data-testid="btn-next"]').click();

      cy.get('[data-testid="input-razon-social"]')
        .type('IPS Prueba REPS');
      
      cy.get('[data-testid="input-nit"]')
        .type('860999999');
      
      cy.get('[data-testid="input-digito-verificacion"]')
        .type('9');
      
      cy.get('[data-testid="input-email-contacto"]')
        .type('ips@prueba.com');
      
      cy.get('[data-testid="input-telefono-principal"]')
        .type('+57 1 999 9999');
      
      cy.get('[data-testid="btn-create-organization"]').click();

      // Verify REPS compliance
      cy.get('[data-testid="health-org-codigo"]')
        .should('match', /^\d{12}$/) // Exactly 12 digits
        .and('not.be.empty');
      
      cy.get('[data-testid="health-org-tipo"]')
        .should('contain', 'IPS');
      
      cy.get('[data-testid="health-org-complejidad"]')
        .should('contain', 'I'); // Default complexity level
      
      cy.get('[data-testid="health-org-verificado"]')
        .should('contain', 'No verificado'); // Should start unverified
    });

    it('should show appropriate complexity levels for different organization types', () => {
      const orgTypes = [
        { type: 'ips', expectedComplexity: 'I' },
        { type: 'hospital', expectedComplexity: 'I' },
        { type: 'clinica', expectedComplexity: 'I' }
      ];

      orgTypes.forEach((orgType) => {
        cy.visit('/wizard/organization');
        cy.get('[data-testid="sector-healthcare"]').click();
        cy.get(`[data-testid="org-type-${orgType.type}"]`).click();
        cy.get('[data-testid="btn-next"]').click();

        // Fill form and create
        cy.get('[data-testid="input-razon-social"]')
          .type(`Test ${orgType.type} Complejidad`);
        
        cy.get('[data-testid="input-nit"]')
          .type(`86099999${orgType.type.length}`);
        
        cy.get('[data-testid="input-digito-verificacion"]')
          .type('8');
        
        cy.get('[data-testid="input-email-contacto"]')
          .type(`${orgType.type}@test.com`);
        
        cy.get('[data-testid="input-telefono-principal"]')
          .type('+57 1 888 8888');
        
        cy.get('[data-testid="btn-create-organization"]').click();

        // Verify complexity level
        cy.get('[data-testid="health-org-complejidad"]')
          .should('contain', orgType.expectedComplexity);
      });
    });
  });
});