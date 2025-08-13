#!/usr/bin/env node

/**
 * 🔄 Script para sincronizar versiones entre package.json
 * 
 * Este script lee la versión del package.json raíz y la propaga
 * a todos los package.json de los sub-proyectos.
 */

const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function updateVersion() {
  try {
    // Leer versión del package.json raíz
    const rootPackagePath = path.join(__dirname, '..', 'package.json');
    const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
    const version = rootPackage.version;

    log(`🔄 Sincronizando versión: ${version}`, 'blue');

    // Lista de archivos package.json a actualizar
    const packageFiles = [
      path.join(__dirname, '..', 'frontend', 'package.json')
    ];

    let updatedCount = 0;

    packageFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        try {
          const packageData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const oldVersion = packageData.version;
          
          if (oldVersion !== version) {
            packageData.version = version;
            fs.writeFileSync(filePath, JSON.stringify(packageData, null, 2) + '\n');
            
            const relativePath = path.relative(process.cwd(), filePath);
            log(`  ✅ ${relativePath}: ${oldVersion} → ${version}`, 'green');
            updatedCount++;
          } else {
            const relativePath = path.relative(process.cwd(), filePath);
            log(`  ⏭️  ${relativePath}: ya está en v${version}`, 'yellow');
          }
        } catch (error) {
          log(`  ❌ Error procesando ${filePath}: ${error.message}`, 'red');
        }
      } else {
        log(`  ⚠️  Archivo no encontrado: ${filePath}`, 'yellow');
      }
    });

    if (updatedCount > 0) {
      log(`\n🎉 ${updatedCount} archivo(s) actualizado(s) a versión ${version}`, 'green');
      
      // Actualizar también el CHANGELOG.md
      updateChangelog(version);
    } else {
      log('\n✨ Todas las versiones ya están sincronizadas', 'green');
    }

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

function updateChangelog(version) {
  try {
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
    
    if (!fs.existsSync(changelogPath)) {
      log('  ⚠️  CHANGELOG.md no encontrado', 'yellow');
      return;
    }

    let changelog = fs.readFileSync(changelogPath, 'utf8');
    const today = new Date().toISOString().split('T')[0];
    
    // Reemplazar [Sin liberar] con la nueva versión
    if (changelog.includes('## [Sin liberar]')) {
      changelog = changelog.replace(
        '## [Sin liberar]',
        `## [Sin liberar]\n\n### 🔄 En desarrollo\n- Trabajando en nuevas funcionalidades\n\n## [${version}] - ${today}`
      );
      
      fs.writeFileSync(changelogPath, changelog);
      log(`  ✅ CHANGELOG.md actualizado con v${version}`, 'green');
    }
    
  } catch (error) {
    log(`  ⚠️  Error actualizando CHANGELOG: ${error.message}`, 'yellow');
  }
}

// Ejecutar el script
if (require.main === module) {
  updateVersion();
}

module.exports = { updateVersion };