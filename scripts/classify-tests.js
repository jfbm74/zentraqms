#!/usr/bin/env node

/**
 * 🎯 Test Classification Helper - ZentraQMS
 * 
 * Script para ayudar a clasificar tests como críticos o no críticos
 * de forma sistemática siguiendo el framework establecido.
 */

const fs = require('fs');
const path = require('path');

// 🎯 Patrones para identificar tests críticos automáticamente
const CRITICAL_PATTERNS = {
  // Funcionalidad Core
  hooks: /use[A-Z]\w*(Auth|Save|Navigation|Organization|Validation|Form|Api)/,
  services: /\.(service|api)\.test\./,
  e2e: /e2e.*\.(test|spec)\./,
  backend: /(test_models|test_apis|test_views|test_serializers)\.py$/,
  
  // Flujos principales
  mainFlows: /(login|auth|organization|wizard|creation|crud).*test/i,
  validation: /(validation|validator|schema).*test/i,
  security: /(permission|rbac|security|auth).*test/i,
};

// ⚠️ Patrones para identificar tests no críticos
const NON_CRITICAL_PATTERNS = {
  // Limitaciones JSdom
  jsdomLimitations: /(routing|file.*upload|dom.*api|browser.*api).*test/i,
  uiTests: /(responsive|animation|css|style|theme).*test/i,
  
  // Mocking complejo
  complexMocking: /(websocket|timer|external.*api|notification).*test/i,
  
  // Features cosmetics
  cosmetic: /(tooltip|modal|dropdown|sidebar).*test/i,
};

// 📊 Analizador de archivos de test
class TestClassifier {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.frontendPath = path.join(projectRoot, 'frontend');
    this.backendPath = path.join(projectRoot, 'backend');
  }

  /**
   * 🔍 Analizar todos los tests del proyecto
   */
  analyzeAllTests() {
    console.log('🎯 Analizando tests del proyecto ZentraQMS...\n');
    
    const frontendTests = this.findTestFiles(this.frontendPath);
    const backendTests = this.findTestFiles(this.backendPath);
    
    const analysis = {
      frontend: this.classifyTests(frontendTests, 'frontend'),
      backend: this.classifyTests(backendTests, 'backend'),
    };
    
    this.generateReport(analysis);
    return analysis;
  }

  /**
   * 📁 Encontrar archivos de test
   */
  findTestFiles(dir) {
    const tests = [];
    
    const scanDir = (currentDir) => {
      if (!fs.existsSync(currentDir)) return;
      
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules')) {
          scanDir(fullPath);
        } else if (this.isTestFile(item)) {
          tests.push({
            path: fullPath,
            relativePath: path.relative(this.projectRoot, fullPath),
            name: item,
            directory: path.dirname(fullPath),
          });
        }
      }
    };
    
    scanDir(dir);
    return tests;
  }

  /**
   * 🧪 Determinar si es archivo de test
   */
  isTestFile(filename) {
    return /\.(test|spec)\.(ts|tsx|js|jsx|py)$/.test(filename) ||
           /test_.*\.py$/.test(filename);
  }

  /**
   * 🎯 Clasificar tests como críticos o no críticos
   */
  classifyTests(testFiles, type) {
    const critical = [];
    const nonCritical = [];
    const uncertain = [];

    for (const test of testFiles) {
      const classification = this.classifyIndividualTest(test, type);
      
      switch (classification.level) {
        case 'critical':
          critical.push({ ...test, ...classification });
          break;
        case 'non-critical':
          nonCritical.push({ ...test, ...classification });
          break;
        default:
          uncertain.push({ ...test, ...classification });
      }
    }

    return {
      critical,
      nonCritical,
      uncertain,
      total: testFiles.length,
    };
  }

  /**
   * 🔍 Clasificar test individual
   */
  classifyIndividualTest(test, type) {
    const { relativePath, name } = test;
    
    // 🎯 Verificar patrones críticos
    for (const [category, pattern] of Object.entries(CRITICAL_PATTERNS)) {
      if (pattern.test(relativePath) || pattern.test(name)) {
        return {
          level: 'critical',
          reason: `Matches critical pattern: ${category}`,
          category: category,
          confidence: 'high',
        };
      }
    }
    
    // ⚠️ Verificar patrones no críticos
    for (const [category, pattern] of Object.entries(NON_CRITICAL_PATTERNS)) {
      if (pattern.test(relativePath) || pattern.test(name)) {
        return {
          level: 'non-critical',
          reason: `Matches non-critical pattern: ${category}`,
          category: category,
          confidence: 'high',
        };
      }
    }
    
    // 🤔 Tests inciertos - necesitan revisión manual
    return {
      level: 'uncertain',
      reason: 'No clear pattern match - needs manual review',
      category: 'unknown',
      confidence: 'low',
    };
  }

  /**
   * 📊 Generar reporte de clasificación
   */
  generateReport(analysis) {
    console.log('📊 REPORTE DE CLASIFICACIÓN DE TESTS\n');
    console.log('='.repeat(50));
    
    // Frontend
    this.printSection('FRONTEND', analysis.frontend);
    
    // Backend
    this.printSection('BACKEND', analysis.backend);
    
    // Resumen
    this.printSummary(analysis);
    
    // Generar archivos
    this.generateConfigFiles(analysis);
  }

  /**
   * 📝 Imprimir sección del reporte
   */
  printSection(title, data) {
    console.log(`\n🎯 ${title} TESTS:`);
    console.log(`Total: ${data.total}`);
    console.log(`✅ Críticos: ${data.critical.length}`);
    console.log(`⚠️ No críticos: ${data.nonCritical.length}`);
    console.log(`🤔 Inciertos: ${data.uncertain.length}`);
    
    if (data.critical.length > 0) {
      console.log('\n✅ TESTS CRÍTICOS:');
      data.critical.forEach(test => {
        console.log(`   - ${test.relativePath} (${test.category})`);
      });
    }
    
    if (data.nonCritical.length > 0) {
      console.log('\n⚠️ TESTS NO CRÍTICOS:');
      data.nonCritical.forEach(test => {
        console.log(`   - ${test.relativePath} (${test.category})`);
      });
    }
    
    if (data.uncertain.length > 0) {
      console.log('\n🤔 TESTS INCIERTOS (Revisar manualmente):');
      data.uncertain.forEach(test => {
        console.log(`   - ${test.relativePath}`);
      });
    }
  }

  /**
   * 📈 Imprimir resumen
   */
  printSummary(analysis) {
    const totalTests = analysis.frontend.total + analysis.backend.total;
    const totalCritical = analysis.frontend.critical.length + analysis.backend.critical.length;
    const totalNonCritical = analysis.frontend.nonCritical.length + analysis.backend.nonCritical.length;
    const totalUncertain = analysis.frontend.uncertain.length + analysis.backend.uncertain.length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📈 RESUMEN GENERAL:');
    console.log(`📊 Total tests: ${totalTests}`);
    console.log(`✅ Críticos: ${totalCritical} (${((totalCritical/totalTests)*100).toFixed(1)}%)`);
    console.log(`⚠️ No críticos: ${totalNonCritical} (${((totalNonCritical/totalTests)*100).toFixed(1)}%)`);
    console.log(`🤔 Inciertos: ${totalUncertain} (${((totalUncertain/totalTests)*100).toFixed(1)}%)`);
    
    if (totalUncertain > 0) {
      console.log('\n💡 ACCIÓN REQUERIDA:');
      console.log(`   Revisar ${totalUncertain} tests inciertos manualmente`);
      console.log('   Usar el framework en .github/TEST_CLASSIFICATION_FRAMEWORK.md');
    }
  }

  /**
   * 📄 Generar archivos de configuración
   */
  generateConfigFiles(analysis) {
    console.log('\n📄 Generando archivos de configuración...');
    
    // package.json scripts
    this.generatePackageScripts(analysis.frontend.critical);
    
    // Workflow suggestions
    this.generateWorkflowSuggestions(analysis);
    
    // Classification documentation
    this.generateClassificationDocs(analysis);
    
    console.log('✅ Archivos generados en /tmp/zentraqms-test-config/');
  }

  /**
   * 📦 Generar scripts para package.json
   */
  generatePackageScripts(criticalTests) {
    const criticalPaths = criticalTests.map(test => test.relativePath.replace('frontend/', ''));
    
    const scripts = {
      "test:critical": `vitest run ${criticalPaths.join(' ')}`,
      "test:critical-only": "npm run test:critical",
    };
    
    const configDir = '/tmp/zentraqms-test-config';
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(configDir, 'package-scripts.json'),
      JSON.stringify(scripts, null, 2)
    );
  }

  /**
   * ⚙️ Generar sugerencias para workflow
   */
  generateWorkflowSuggestions(analysis) {
    const suggestions = {
      critical_tests_frontend: analysis.frontend.critical.map(t => t.relativePath),
      critical_tests_backend: analysis.backend.critical.map(t => t.relativePath),
      non_critical_tests: [
        ...analysis.frontend.nonCritical.map(t => t.relativePath),
        ...analysis.backend.nonCritical.map(t => t.relativePath),
      ],
      uncertain_tests: [
        ...analysis.frontend.uncertain.map(t => t.relativePath),
        ...analysis.backend.uncertain.map(t => t.relativePath),
      ],
    };
    
    fs.writeFileSync(
      '/tmp/zentraqms-test-config/workflow-suggestions.json',
      JSON.stringify(suggestions, null, 2)
    );
  }

  /**
   * 📚 Generar documentación de clasificación
   */
  generateClassificationDocs(analysis) {
    const markdown = `# 🎯 Clasificación Automática de Tests - ${new Date().toISOString().split('T')[0]}

## 📊 Resumen
- **Total tests**: ${analysis.frontend.total + analysis.backend.total}
- **Críticos**: ${analysis.frontend.critical.length + analysis.backend.critical.length}
- **No críticos**: ${analysis.frontend.nonCritical.length + analysis.backend.nonCritical.length}
- **Inciertos**: ${analysis.frontend.uncertain.length + analysis.backend.uncertain.length}

## ✅ Tests Críticos Identificados

### Frontend
${analysis.frontend.critical.map(t => `- \`${t.relativePath}\` - ${t.reason}`).join('\n')}

### Backend  
${analysis.backend.critical.map(t => `- \`${t.relativePath}\` - ${t.reason}`).join('\n')}

## ⚠️ Tests No Críticos Identificados

### Frontend
${analysis.frontend.nonCritical.map(t => `- \`${t.relativePath}\` - ${t.reason}`).join('\n')}

### Backend
${analysis.backend.nonCritical.map(t => `- \`${t.relativePath}\` - ${t.reason}`).join('\n')}

## 🤔 Tests Que Requieren Revisión Manual

${[...analysis.frontend.uncertain, ...analysis.backend.uncertain].map(t => `- \`${t.relativePath}\` - Revisar usando framework`).join('\n')}

## 📝 Próximos Pasos
1. Revisar tests inciertos manualmente
2. Actualizar package.json con scripts generados
3. Configurar workflow de GitHub Actions
4. Documentar decisiones en el framework
`;

    fs.writeFileSync(
      '/tmp/zentraqms-test-config/classification-report.md',
      markdown
    );
  }
}

// 🚀 Ejecutar si se llama directamente
if (require.main === module) {
  const projectRoot = process.argv[2] || process.cwd();
  const classifier = new TestClassifier(projectRoot);
  
  console.log('🎯 ZentraQMS Test Classification Tool');
  console.log(`📁 Proyecto: ${projectRoot}\n`);
  
  try {
    classifier.analyzeAllTests();
    console.log('\n🎉 Análisis completado exitosamente!');
    console.log('📁 Revisa los archivos generados en /tmp/zentraqms-test-config/');
  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
    process.exit(1);
  }
}

module.exports = TestClassifier;