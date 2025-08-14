/**
 * Test directo de mejoras implementadas en OrganizationWizard
 * Sin necesidad de autenticación - analiza el código directamente
 */

const fs = require('fs').promises;
const path = require('path');

class WizardImprovementTester {
  constructor() {
    this.results = {
      nitInputMask: false,
      accessibilityLabels: false,
      autoSave: false,
      tooltips: false,
      inputMasks: false,
      ariaLabels: false,
      validationFeedback: false
    };
  }

  async testNitInputMask() {
    console.log('🔍 Verificando mejoras en NitInput...');
    
    try {
      const nitInputPath = '/Users/juan.bustamante/personal/zentraqms/frontend/src/components/forms/NitInput.tsx';
      const content = await fs.readFile(nitInputPath, 'utf8');
      
      // Verificar import de react-input-mask
      const hasInputMaskImport = content.includes('import InputMask from "react-input-mask"');
      
      // Verificar uso de InputMask
      const hasInputMaskUsage = content.includes('<InputMask');
      
      // Verificar máscara de NIT
      const hasNitMask = content.includes('mask="999.999.999-9"');
      
      // Verificar aria labels
      const hasAriaLabels = content.includes('aria-describedby') && 
                           content.includes('aria-required') && 
                           content.includes('aria-invalid');
      
      // Verificar role="alert"
      const hasAlertRoles = content.includes('role="alert"');
      
      this.results.nitInputMask = hasInputMaskImport && hasInputMaskUsage && hasNitMask;
      this.results.ariaLabels = hasAriaLabels && hasAlertRoles;
      
      console.log(`  ✅ Input Mask: ${this.results.nitInputMask ? 'IMPLEMENTADO' : 'FALTANTE'}`);
      console.log(`  ✅ ARIA Labels: ${this.results.ariaLabels ? 'IMPLEMENTADO' : 'FALTANTE'}`);
      
    } catch (error) {
      console.log(`  ❌ Error verificando NitInput: ${error.message}`);
    }
  }

  async testStep1Improvements() {
    console.log('🔍 Verificando mejoras en Step1OrganizationData...');
    
    try {
      const step1Path = '/Users/juan.bustamante/personal/zentraqms/frontend/src/components/wizard/steps/Step1OrganizationData.tsx';
      const content = await fs.readFile(step1Path, 'utf8');
      
      // Verificar tooltips con data-bs-toggle
      const hasTooltips = content.includes('data-bs-toggle="tooltip"') && 
                         content.includes('ri-question-line');
      
      // Verificar input groups con iconos
      const hasInputGroups = content.includes('input-group-text') && 
                            content.includes('ri-mail-line') && 
                            content.includes('ri-phone-line');
      
      // Verificar máscaras de teléfono
      const hasPhoneMask = content.includes('mask="+57 (999) 999-9999"');
      
      // Verificar aria-describedby
      const hasAriaDescribed = content.includes('aria-describedby');
      
      // Verificar contador de caracteres
      const hasCharCounter = content.includes('.length}/500');
      
      this.results.tooltips = hasTooltips;
      this.results.inputMasks = hasPhoneMask;
      this.results.accessibilityLabels = hasAriaDescribed;
      this.results.validationFeedback = hasInputGroups && hasCharCounter;
      
      console.log(`  ✅ Tooltips informativos: ${this.results.tooltips ? 'IMPLEMENTADO' : 'FALTANTE'}`);
      console.log(`  ✅ Máscaras de input: ${this.results.inputMasks ? 'IMPLEMENTADO' : 'FALTANTE'}`);
      console.log(`  ✅ Labels accesibilidad: ${this.results.accessibilityLabels ? 'IMPLEMENTADO' : 'FALTANTE'}`);
      console.log(`  ✅ Feedback visual: ${this.results.validationFeedback ? 'IMPLEMENTADO' : 'FALTANTE'}`);
      
    } catch (error) {
      console.log(`  ❌ Error verificando Step1: ${error.message}`);
    }
  }

  async testAutoSaveImplementation() {
    console.log('🔍 Verificando implementación de autoguardado...');
    
    try {
      const wizardPath = '/Users/juan.bustamante/personal/zentraqms/frontend/src/pages/organization/wizard/OrganizationWizard.tsx';
      const content = await fs.readFile(wizardPath, 'utf8');
      
      // Verificar localStorage keys
      const hasStorageKeys = content.includes('STORAGE_KEY = "organization-wizard-draft"') &&
                            content.includes('LAST_SAVED_KEY = "organization-wizard-last-saved"');
      
      // Verificar funciones de autoguardado
      const hasSaveFunctions = content.includes('saveDraft') && 
                              content.includes('loadSavedDraft') && 
                              content.includes('debouncedSave');
      
      // Verificar useEffect para autoguardado
      const hasAutoSaveEffect = content.includes('useEffect') && 
                               content.includes('debouncedSave(formData)');
      
      // Verificar indicador visual
      const hasVisualIndicator = content.includes('hasUnsavedChanges') && 
                                 content.includes('Guardando...');
      
      // Verificar warning de salida
      const hasUnloadWarning = content.includes('beforeunload') && 
                              content.includes('cambios sin guardar');
      
      this.results.autoSave = hasStorageKeys && hasSaveFunctions && hasAutoSaveEffect && 
                             hasVisualIndicator && hasUnloadWarning;
      
      console.log(`  ✅ Storage keys: ${hasStorageKeys ? 'IMPLEMENTADO' : 'FALTANTE'}`);
      console.log(`  ✅ Funciones guardado: ${hasSaveFunctions ? 'IMPLEMENTADO' : 'FALTANTE'}`);
      console.log(`  ✅ Auto-save effect: ${hasAutoSaveEffect ? 'IMPLEMENTADO' : 'FALTANTE'}`);
      console.log(`  ✅ Indicador visual: ${hasVisualIndicator ? 'IMPLEMENTADO' : 'FALTANTE'}`);
      console.log(`  ✅ Warning salida: ${hasUnloadWarning ? 'IMPLEMENTADO' : 'FALTANTE'}`);
      console.log(`  📊 Autoguardado: ${this.results.autoSave ? 'COMPLETAMENTE IMPLEMENTADO' : 'PARCIAL'}`);
      
    } catch (error) {
      console.log(`  ❌ Error verificando autoguardado: ${error.message}`);
    }
  }

  async checkPackageJsonDependencies() {
    console.log('🔍 Verificando dependencias instaladas...');
    
    try {
      const packagePath = '/Users/juan.bustamante/personal/zentraqms/frontend/package.json';
      const content = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(content);
      
      const hasInputMask = packageJson.dependencies && 
                          packageJson.dependencies['react-input-mask'];
      
      console.log(`  ✅ react-input-mask: ${hasInputMask ? `v${packageJson.dependencies['react-input-mask']}` : 'NO INSTALADO'}`);
      
      return hasInputMask;
    } catch (error) {
      console.log(`  ❌ Error verificando package.json: ${error.message}`);
      return false;
    }
  }

  async generateReport() {
    console.log('\n📝 Generando reporte de verificación...');
    
    const improvements = Object.entries(this.results);
    const implementedCount = improvements.filter(([_, implemented]) => implemented).length;
    const totalCount = improvements.length;
    const percentage = Math.round((implementedCount / totalCount) * 100);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        implemented: implementedCount,
        total: totalCount,
        percentage: `${percentage}%`
      },
      details: this.results,
      recommendations: this.generateRecommendations()
    };
    
    // Guardar reporte
    const reportPath = path.join(__dirname, 'wizard-analysis', 'improvements-verification.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Mostrar resumen
    console.log('\n🎯 RESUMEN DE MEJORAS IMPLEMENTADAS:');
    console.log(`   📊 Progreso: ${implementedCount}/${totalCount} (${percentage}%)`);
    console.log('\n   Detalle por categoría:');
    
    improvements.forEach(([improvement, implemented]) => {
      const status = implemented ? '✅ IMPLEMENTADO' : '❌ PENDIENTE';
      const name = improvement.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`   ${status} - ${name}`);
    });
    
    console.log(`\n✅ Reporte guardado en: ${reportPath}`);
    
    return report;
  }

  generateRecommendations() {
    const pending = Object.entries(this.results)
      .filter(([_, implemented]) => !implemented)
      .map(([improvement, _]) => improvement);
    
    if (pending.length === 0) {
      return ['🎉 ¡Todas las mejoras han sido implementadas exitosamente!'];
    }
    
    return pending.map(improvement => {
      switch (improvement) {
        case 'nitInputMask':
          return 'Completar implementación de máscara en NitInput component';
        case 'accessibilityLabels':
          return 'Agregar aria-describedby a todos los inputs en Step1';
        case 'autoSave':
          return 'Implementar sistema completo de autoguardado';
        case 'tooltips':
          return 'Agregar tooltips informativos con data-bs-toggle';
        case 'inputMasks':
          return 'Implementar máscaras para teléfono y otros campos';
        default:
          return `Completar implementación de: ${improvement}`;
      }
    });
  }

  async run() {
    console.log('🚀 Iniciando verificación de mejoras implementadas...\n');
    
    await this.checkPackageJsonDependencies();
    await this.testNitInputMask();
    await this.testStep1Improvements();
    await this.testAutoSaveImplementation();
    
    const report = await this.generateReport();
    
    console.log('\n🎉 Verificación completada!');
    return report;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const tester = new WizardImprovementTester();
  tester.run()
    .then(report => {
      if (report.summary.percentage === '100%') {
        console.log('\n🏆 ¡TODAS LAS MEJORAS IMPLEMENTADAS CORRECTAMENTE!');
        process.exit(0);
      } else {
        console.log(`\n⚠️  Progreso: ${report.summary.percentage} completado`);
        console.log('   Ver reporte para detalles de elementos pendientes');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('💥 Error durante la verificación:', error);
      process.exit(1);
    });
}

module.exports = WizardImprovementTester;