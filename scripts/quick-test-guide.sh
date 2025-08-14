#!/bin/bash

# 🎯 Quick Test Classification Guide - ZentraQMS
# Script de ayuda rápida para clasificar tests

echo "🎯 ZentraQMS - Guía Rápida de Clasificación de Tests"
echo "=================================================="
echo ""

# Función para mostrar ayuda
show_help() {
    echo "📋 COMANDOS DISPONIBLES:"
    echo ""
    echo "🔍 ANÁLISIS:"
    echo "  ./scripts/quick-test-guide.sh analyze     - Analizar todos los tests"
    echo "  ./scripts/quick-test-guide.sh check       - Verificar tests críticos"
    echo "  ./scripts/quick-test-guide.sh status      - Estado actual del proyecto"
    echo ""
    echo "📝 DESARROLLO:"
    echo "  ./scripts/quick-test-guide.sh new-module  - Template para nuevo módulo"
    echo "  ./scripts/quick-test-guide.sh classify    - Clasificar test específico"
    echo ""
    echo "🧪 TESTING:"
    echo "  ./scripts/quick-test-guide.sh critical    - Ejecutar solo tests críticos"
    echo "  ./scripts/quick-test-guide.sh smart       - Ejecutar con lógica inteligente"
    echo "  ./scripts/quick-test-guide.sh report      - Generar reporte completo"
}

# Función para analizar tests
analyze_tests() {
    echo "🔍 Analizando tests del proyecto..."
    node scripts/classify-tests.js
    echo ""
    echo "📁 Archivos generados en /tmp/zentraqms-test-config/"
    echo "📋 Revisa classification-report.md para detalles"
}

# Función para verificar tests críticos
check_critical() {
    echo "🎯 Verificando tests críticos..."
    echo ""
    
    echo "🔧 Backend:"
    cd backend && python manage.py test --verbosity=1 | head -20
    
    echo ""
    echo "🎨 Frontend críticos:"
    cd ../frontend && npm run test:critical 2>/dev/null | tail -10
    
    echo ""
    echo "✅ Si ambos pasan al 100%, estás listo para deployment!"
}

# Función para mostrar estado
show_status() {
    echo "📊 Estado Actual del Proyecto:"
    echo ""
    
    # Contar tests
    frontend_tests=$(find frontend/src -name "*.test.*" -o -name "*.spec.*" | wc -l)
    backend_tests=$(find backend/apps -name "test_*.py" -o -name "*_test.py" | wc -l)
    
    echo "📁 Tests encontrados:"
    echo "   Frontend: $frontend_tests tests"
    echo "   Backend: $backend_tests tests"
    echo ""
    
    # Estado de scripts
    echo "⚙️ Scripts configurados:"
    if grep -q "test:critical" frontend/package.json; then
        echo "   ✅ test:critical configurado"
    else
        echo "   ❌ test:critical NO configurado"
    fi
    
    if grep -q "test:non-critical" frontend/package.json; then
        echo "   ✅ test:non-critical configurado"
    else
        echo "   ❌ test:non-critical NO configurado"
    fi
    
    # Estado de workflow
    echo ""
    echo "🔄 Workflow CI/CD:"
    if [ -f ".github/workflows/smart-testing.yml" ]; then
        echo "   ✅ Smart testing workflow configurado"
    else
        echo "   ❌ Smart testing workflow NO configurado"
    fi
}

# Función para nuevo módulo
new_module_template() {
    echo "📝 Creando template para nuevo módulo..."
    echo ""
    read -p "🎯 Nombre del módulo (ej: auditorias, procesos): " module_name
    
    if [ -z "$module_name" ]; then
        echo "❌ Nombre del módulo requerido"
        exit 1
    fi
    
    # Crear directorio de documentación si no existe
    mkdir -p docs/testing/
    
    # Crear archivo de clasificación del módulo
    cat > "docs/testing/${module_name}-test-classification.md" << EOF
# 🎯 Clasificación de Tests - Módulo: ${module_name}

## ✅ TESTS CRÍTICOS

### Funcionalidad Core:
- [ ] \`src/hooks/__tests__/use${module_name^}.test.tsx\` - Hook principal del módulo
- [ ] \`src/services/__tests__/${module_name}.service.test.ts\` - Service core
- [ ] \`src/__tests__/e2e/${module_name}-flow.test.tsx\` - Flujo end-to-end

### Backend:
- [ ] \`backend/apps/${module_name}/test_models.py\` - Modelos Django
- [ ] \`backend/apps/${module_name}/test_apis.py\` - APIs DRF

## ⚠️ TESTS NO CRÍTICOS

### Limitaciones JSdom:
- [ ] Tests de file upload específicos
- [ ] Tests de routing complejo

### UI/UX:
- [ ] Tests de componentes visuales
- [ ] Tests de animaciones

## 📝 DECISIONES TOMADAS

### Críticos confirmados:
- [Pendiente]

### No críticos confirmados:
- [Pendiente]

## 📊 SCRIPTS

\`\`\`json
{
  "test:critical:${module_name}": "vitest run [rutas de tests críticos]",
  "test:non-critical:${module_name}": "vitest run [rutas no críticas] || true"
}
\`\`\`

## 📅 FECHA DE CLASIFICACIÓN
$(date +"%Y-%m-%d")
EOF
    
    echo "✅ Template creado en: docs/testing/${module_name}-test-classification.md"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Desarrollar tests del módulo ${module_name}"
    echo "2. Ejecutar: ./scripts/quick-test-guide.sh analyze"
    echo "3. Clasificar tests usando el template creado"
    echo "4. Actualizar package.json con scripts específicos"
}

# Función para clasificar test específico
classify_test() {
    echo "🔍 Clasificador Interactivo de Tests"
    echo ""
    read -p "📁 Ruta del test a clasificar: " test_path
    
    if [ -z "$test_path" ]; then
        echo "❌ Ruta del test requerida"
        exit 1
    fi
    
    if [ ! -f "$test_path" ]; then
        echo "❌ Archivo no encontrado: $test_path"
        exit 1
    fi
    
    echo ""
    echo "🎯 Analizando: $test_path"
    echo ""
    
    # Preguntas de clasificación
    echo "📋 Responde las siguientes preguntas:"
    echo ""
    
    read -p "❓ ¿Si este test falla, los usuarios no pueden usar funcionalidad core? (s/n): " q1
    read -p "❓ ¿Es parte del flujo principal (happy path) del módulo? (s/n): " q2
    read -p "❓ ¿Afecta seguridad, autenticación o integridad de datos? (s/n): " q3
    read -p "❓ ¿Funciona correctamente en browser real cuando falla en tests? (s/n): " q4
    read -p "❓ ¿Es limitación de JSdom (routing, file API, DOM API)? (s/n): " q5
    
    echo ""
    echo "📊 RESULTADO:"
    
    critical_score=0
    non_critical_score=0
    
    # Calcular score
    [[ "$q1" == "s" ]] && ((critical_score++))
    [[ "$q2" == "s" ]] && ((critical_score++))
    [[ "$q3" == "s" ]] && ((critical_score++))
    [[ "$q4" == "s" ]] && ((non_critical_score++))
    [[ "$q5" == "s" ]] && ((non_critical_score++))
    
    if [ $critical_score -ge 2 ]; then
        echo "✅ RECOMENDACIÓN: TEST CRÍTICO"
        echo "   Debe incluirse en test:critical"
        echo "   Debe pasar al 100% para deployment"
    elif [ $non_critical_score -ge 1 ]; then
        echo "⚠️ RECOMENDACIÓN: TEST NO CRÍTICO"  
        echo "   Incluir en test:non-critical"
        echo "   Puede fallar sin bloquear deployment"
    else
        echo "🤔 RECOMENDACIÓN: REVISAR MANUALMENTE"
        echo "   Usar framework detallado en .github/TEST_CLASSIFICATION_FRAMEWORK.md"
    fi
    
    echo ""
    echo "💾 Documenta esta decisión en docs/testing/[module]-test-classification.md"
}

# Función para ejecutar tests críticos
run_critical() {
    echo "🎯 Ejecutando SOLO tests críticos..."
    echo ""
    
    echo "🔧 Backend:"
    cd backend && python manage.py test --verbosity=2
    backend_result=$?
    
    echo ""
    echo "🎨 Frontend:"
    cd ../frontend && npm run test:critical
    frontend_result=$?
    
    echo ""
    if [ $backend_result -eq 0 ] && [ $frontend_result -eq 0 ]; then
        echo "✅ TODOS LOS TESTS CRÍTICOS PASAN - LISTO PARA DEPLOYMENT! 🚀"
    else
        echo "❌ TESTS CRÍTICOS FALLANDO - DEPLOYMENT BLOQUEADO 🚫"
        echo "🔧 Debe corregir tests críticos antes de hacer merge"
    fi
}

# Función para smart testing
run_smart() {
    echo "🧠 Ejecutando testing inteligente..."
    echo ""
    
    cd frontend && npm run test:all-with-smart-exit
    result=$?
    
    echo ""
    if [ $result -eq 0 ]; then
        echo "✅ SMART TESTING COMPLETADO - LISTO PARA DEPLOYMENT! 🚀"
    else
        echo "❌ TESTS CRÍTICOS FALLANDO - REVISAR ERRORES 🔧"
    fi
}

# Función para generar reporte
generate_report() {
    echo "📊 Generando reporte completo..."
    echo ""
    
    # Ejecutar análisis
    node scripts/classify-tests.js > /tmp/analysis.log 2>&1
    
    # Ejecutar tests críticos
    echo "🎯 Ejecutando tests críticos..."
    cd frontend && npm run test:critical > /tmp/critical.log 2>&1
    critical_result=$?
    
    # Crear reporte
    cat > /tmp/zentraqms-test-report.md << EOF
# 📊 Reporte de Testing - ZentraQMS
**Fecha**: $(date +"%Y-%m-%d %H:%M:%S")

## 🎯 Tests Críticos
**Estado**: $([ $critical_result -eq 0 ] && echo "✅ PASANDO" || echo "❌ FALLANDO")

### Detalles:
\`\`\`
$(tail -20 /tmp/critical.log)
\`\`\`

## 🔍 Análisis de Clasificación
\`\`\`
$(cat /tmp/analysis.log)
\`\`\`

## 📋 Recomendaciones
$([ $critical_result -eq 0 ] && echo "✅ Listo para deployment" || echo "🔧 Corregir tests críticos antes de merge")

EOF
    
    echo "📁 Reporte generado en: /tmp/zentraqms-test-report.md"
    echo ""
    echo "📋 Vista previa:"
    head -20 /tmp/zentraqms-test-report.md
}

# Procesar argumentos
case "$1" in
    "analyze")
        analyze_tests
        ;;
    "check")
        check_critical
        ;;
    "status")
        show_status
        ;;
    "new-module")
        new_module_template
        ;;
    "classify")
        classify_test
        ;;
    "critical")
        run_critical
        ;;
    "smart")
        run_smart
        ;;
    "report")
        generate_report
        ;;
    "help"|"-h"|"--help"|"")
        show_help
        ;;
    *)
        echo "❌ Comando no reconocido: $1"
        echo ""
        show_help
        exit 1
        ;;
esac