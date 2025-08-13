#!/bin/bash

# 🚀 Script de Release para ZentraQMS
# Automatiza el proceso de crear una nueva versión

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
🚀 Script de Release - ZentraQMS

USAGE:
    ./scripts/create-release.sh [TIPO_VERSION] [OPCIONES]

TIPOS DE VERSION:
    patch     Incrementa la versión patch (ej: 0.1.0 → 0.1.1)
    minor     Incrementa la versión minor (ej: 0.1.0 → 0.2.0) 
    major     Incrementa la versión major (ej: 0.1.0 → 1.0.0)

OPCIONES:
    -h, --help        Muestra esta ayuda
    -d, --dry-run     Simula el proceso sin hacer cambios
    -s, --skip-tests  Omite la ejecución de tests
    -p, --push        Hace push automático a Git
    
EJEMPLOS:
    ./scripts/create-release.sh patch
    ./scripts/create-release.sh minor --push
    ./scripts/create-release.sh major --dry-run
    
PROCESO:
    1. Verifica que estés en la rama correcta
    2. Ejecuta todos los tests (opcional)
    3. Incrementa la versión en package.json
    4. Sincroniza versiones en todos los módulos
    5. Actualiza CHANGELOG.md
    6. Crea commit con cambios
    7. Crea tag de Git
    8. Push a remoto (opcional)

EOF
}

# Variables por defecto
VERSION_TYPE=""
DRY_RUN=false
SKIP_TESTS=false
AUTO_PUSH=false
CURRENT_BRANCH=$(git branch --show-current)
ALLOWED_BRANCHES=("main" "develop" "release/*")

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        patch|minor|major)
            VERSION_TYPE="$1"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -p|--push)
            AUTO_PUSH=true
            shift
            ;;
        *)
            print_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validar argumentos
if [[ -z "$VERSION_TYPE" ]]; then
    print_error "Tipo de versión requerido (patch|minor|major)"
    show_help
    exit 1
fi

# ===============================================
# 🔍 Verificaciones previas
# ===============================================
check_prerequisites() {
    print_status "Verificando prerequisitos..."
    
    # Verificar que estamos en un repositorio Git
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "No estás en un repositorio Git"
        exit 1
    fi
    
    # Verificar rama actual
    branch_allowed=false
    for allowed in "${ALLOWED_BRANCHES[@]}"; do
        if [[ "$CURRENT_BRANCH" == $allowed || "$CURRENT_BRANCH" == release/* ]]; then
            branch_allowed=true
            break
        fi
    done
    
    if [[ "$branch_allowed" == false ]]; then
        print_warning "Estás en la rama '$CURRENT_BRANCH'"
        print_warning "Se recomienda crear releases desde: main, develop, o release/*"
        read -p "¿Continuar de todas formas? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Verificar que no hay cambios sin commit
    if ! git diff-index --quiet HEAD --; then
        print_error "Hay cambios sin commit. Haz commit primero."
        git status --porcelain
        exit 1
    fi
    
    # Verificar herramientas necesarias
    if ! command -v node &> /dev/null; then
        print_error "Node.js no encontrado"
        exit 1
    fi
    
    print_success "Prerequisitos verificados ✓"
}

# ===============================================
# 🧪 Ejecutar tests
# ===============================================
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        print_warning "Tests omitidos (--skip-tests)"
        return
    fi
    
    print_status "Ejecutando tests..."
    
    # Frontend tests
    print_status "Tests frontend..."
    cd frontend
    if [[ "$DRY_RUN" == false ]]; then
        npm run test:run || {
            print_error "Tests de frontend fallaron"
            exit 1
        }
    else
        print_status "[DRY RUN] npm run test:run"
    fi
    cd ..
    
    # Backend tests
    print_status "Tests backend..."
    cd backend
    if [[ "$DRY_RUN" == false ]]; then
        if [[ -f "venv/bin/activate" ]]; then
            source venv/bin/activate
            python manage.py test || {
                print_error "Tests de backend fallaron"
                exit 1
            }
        else
            print_warning "Virtual environment no encontrado, omitiendo tests de backend"
        fi
    else
        print_status "[DRY RUN] python manage.py test"
    fi
    cd ..
    
    print_success "Todos los tests pasaron ✓"
}

# ===============================================
# 📝 Crear release
# ===============================================
create_release() {
    print_status "Creando release $VERSION_TYPE..."
    
    # Obtener versión actual
    OLD_VERSION=$(node -p "require('./package.json').version")
    print_status "Versión actual: $OLD_VERSION"
    
    if [[ "$DRY_RUN" == false ]]; then
        # Incrementar versión
        npm version $VERSION_TYPE --no-git-tag-version
        
        # Sincronizar versiones
        node scripts/sync-versions.js
        
        # Obtener nueva versión
        NEW_VERSION=$(node -p "require('./package.json').version")
        print_success "Nueva versión: $NEW_VERSION"
        
        # Crear commit
        git add .
        git commit -m "chore(release): bump version to $NEW_VERSION

- Update version in all package.json files
- Update CHANGELOG.md with release notes
- Prepare for release $NEW_VERSION

🤖 Generated with Claude Code"
        
        # Crear tag
        git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
        
        print_success "Release v$NEW_VERSION creado ✓"
        
        # Push automático si se solicita
        if [[ "$AUTO_PUSH" == true ]]; then
            print_status "Haciendo push a remoto..."
            git push origin $CURRENT_BRANCH
            git push origin "v$NEW_VERSION"
            print_success "Push completado ✓"
        else
            print_warning "Para hacer push ejecuta:"
            echo "  git push origin $CURRENT_BRANCH"
            echo "  git push origin v$NEW_VERSION"
        fi
        
    else
        print_status "[DRY RUN] npm version $VERSION_TYPE"
        print_status "[DRY RUN] node scripts/sync-versions.js"
        print_status "[DRY RUN] git add . && git commit"
        print_status "[DRY RUN] git tag v[NEW_VERSION]"
        
        if [[ "$AUTO_PUSH" == true ]]; then
            print_status "[DRY RUN] git push origin $CURRENT_BRANCH"
            print_status "[DRY RUN] git push origin v[NEW_VERSION]"
        fi
    fi
}

# ===============================================
# 📋 Mostrar resumen
# ===============================================
show_summary() {
    echo ""
    echo "🎉 ¡Release completado!"
    echo "========================"
    echo "📋 Resumen:"
    echo "  - Tipo: $VERSION_TYPE"
    echo "  - Rama: $CURRENT_BRANCH"
    echo "  - Tests: $([ "$SKIP_TESTS" == true ] && echo "omitidos" || echo "ejecutados")"
    echo "  - Push: $([ "$AUTO_PUSH" == true ] && echo "automático" || echo "manual")"
    echo "  - Modo: $([ "$DRY_RUN" == true ] && echo "simulación" || echo "real")"
    echo ""
    
    if [[ "$DRY_RUN" == false ]]; then
        NEW_VERSION=$(node -p "require('./package.json').version")
        echo "🚀 Nueva versión: v$NEW_VERSION"
        echo ""
        echo "📋 Próximos pasos:"
        echo "  1. Verificar que todo está correcto"
        if [[ "$AUTO_PUSH" == false ]]; then
            echo "  2. Hacer push: git push origin $CURRENT_BRANCH && git push origin v$NEW_VERSION"
        fi
        echo "  3. Crear release en GitHub (opcional)"
        echo "  4. Deploy a staging/producción"
    fi
}

# ===============================================
# 📋 Ejecución principal
# ===============================================
main() {
    echo "🚀 ZentraQMS Release Creator"
    echo "============================"
    echo ""
    
    check_prerequisites
    run_tests
    create_release
    show_summary
}

# Ejecutar función principal
main "$@"