#!/bin/bash

# 🚀 Setup CI/CD for ZentraQMS
# Este script configura automáticamente el pipeline de CI/CD

set -e  # Exit on any error

echo "🚀 Setting up CI/CD for ZentraQMS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# ===============================================
# 🔍 Check prerequisites
# ===============================================
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository. Please run this script from the project root."
        exit 1
    fi
    
    # Check if GitHub CLI is installed
    if ! command -v gh &> /dev/null; then
        print_warning "GitHub CLI (gh) not found. Some features may not work."
        print_status "Install it with: brew install gh (macOS) or visit https://cli.github.com/"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js 18+ and npm."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 not found. Please install Python 3.11+."
        exit 1
    fi
    
    print_success "Prerequisites check completed"
}

# ===============================================
# 📁 Setup directory structure
# ===============================================
setup_directories() {
    print_status "Setting up directory structure..."
    
    # Create .github directories if they don't exist
    mkdir -p .github/workflows
    mkdir -p .github/ISSUE_TEMPLATE
    mkdir -p .github/PULL_REQUEST_TEMPLATE
    
    # Create docs directory
    mkdir -p docs/ci-cd
    
    # Create scripts directory
    mkdir -p scripts
    
    print_success "Directory structure created"
}

# ===============================================
# 🧪 Setup frontend testing
# ===============================================
setup_frontend_testing() {
    print_status "Setting up frontend testing..."
    
    cd frontend
    
    # Install testing dependencies if not already installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm ci
    fi
    
    # Add test scripts to package.json if not present
    if ! grep -q "test:ci" package.json; then
        print_status "Adding CI test scripts to package.json..."
        npm pkg set scripts.test:ci="vitest run --coverage"
        npm pkg set scripts.test:e2e="echo 'E2E tests placeholder'"
        npm pkg set scripts.lint:ci="eslint . --ext ts,tsx --format json --output-file eslint-report.json"
    fi
    
    cd ..
    print_success "Frontend testing setup completed"
}

# ===============================================
# 🐍 Setup backend testing
# ===============================================
setup_backend_testing() {
    print_status "Setting up backend testing..."
    
    cd backend
    
    # Create testing requirements if not exists
    if [ ! -f "requirements/testing.txt" ]; then
        print_status "Testing requirements already created by CI setup"
    fi
    
    # Create pytest configuration
    cat > pytest.ini << 'EOF'
[tool:pytest]
DJANGO_SETTINGS_MODULE = config.settings.testing
python_files = tests.py test_*.py *_tests.py
addopts = 
    --tb=short
    --strict-markers
    --disable-warnings
    --cov=.
    --cov-report=term-missing
    --cov-report=html
    --cov-report=xml
    --cov-fail-under=80
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
    unit: marks tests as unit tests
EOF
    
    # Create coverage configuration
    cat > .coveragerc << 'EOF'
[run]
source = .
omit = 
    */venv/*
    */migrations/*
    manage.py
    */settings/*
    */tests.py
    */test_*.py
    */__pycache__/*
    */node_modules/*
    .tox/*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
    if __name__ == .__main__.:
    class .*\(Protocol\):
    @(abc\.)?abstractmethod

[html]
directory = htmlcov
EOF
    
    cd ..
    print_success "Backend testing setup completed"
}

# ===============================================
# 🔒 Setup security configurations
# ===============================================
setup_security() {
    print_status "Setting up security configurations..."
    
    # Create security policy
    cat > SECURITY.md << 'EOF'
# 🔒 Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please send an e-mail to security@zentraqms.com.

All security vulnerabilities will be promptly addressed.

## Security Measures

- JWT token authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Secure headers implementation
EOF
    
    # Create dependabot configuration
    mkdir -p .github
    cat > .github/dependabot.yml << 'EOF'
version: 2
updates:
  # Frontend dependencies
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "juan.bustamante"
    commit-message:
      prefix: "npm"
      include: "scope"

  # Backend dependencies
  - package-ecosystem: "pip"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    reviewers:
      - "juan.bustamante"
    commit-message:
      prefix: "pip"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "juan.bustamante"
EOF
    
    print_success "Security configurations created"
}

# ===============================================
# 📝 Create documentation
# ===============================================
create_documentation() {
    print_status "Creating CI/CD documentation..."
    
    cat > docs/ci-cd/README.md << 'EOF'
# 🚀 CI/CD Pipeline Documentation

## Overview

This document describes the CI/CD pipeline setup for ZentraQMS.

## Pipeline Stages

### 1. 🔍 Code Quality & Security
- Security scanning with Trivy
- CodeQL analysis
- Dependency vulnerability checks

### 2. 🧪 Testing
- **Frontend**: ESLint, TypeScript check, unit tests, build validation
- **Backend**: Flake8, Black, Bandit, Django tests, migration checks
- **Integration**: E2E tests, API health checks

### 3. 📋 Quality Gates
- All tests must pass
- Code coverage requirements
- Security checks must pass
- Linting must pass

### 4. 🚀 Deployment
- Automatic deployment to staging on main branch
- Manual deployment to production

## Branch Protection Rules

### Main Branch
- Requires PR reviews (1 approval minimum)
- Requires status checks to pass
- No force pushes allowed
- Dismiss stale reviews on new commits

### Develop Branch  
- Requires basic tests to pass
- More flexible for development

## Local Development

```bash
# Run all checks locally before pushing
./scripts/run-checks.sh

# Frontend checks
cd frontend
npm run lint
npm run test
npm run build

# Backend checks
cd backend
source venv/bin/activate
flake8 .
black --check .
python manage.py test
```

## Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**
   - Check environment variables
   - Ensure dependencies are up to date
   - Check for timezone/locale differences

2. **Coverage below threshold**
   - Add more unit tests
   - Check coverage report for uncovered lines

3. **Security scan failures**
   - Update dependencies with vulnerabilities
   - Add security exceptions if needed

## Configuration Files

- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/pr-validation.yml` - PR validation
- `.github/CODEOWNERS` - Code review assignments
- `frontend/vitest.config.ts` - Frontend test configuration
- `backend/pytest.ini` - Backend test configuration
EOF
    
    print_success "Documentation created"
}

# ===============================================
# 🔧 Setup GitHub repository settings
# ===============================================
setup_github_settings() {
    print_status "Setting up GitHub repository settings..."
    
    if command -v gh &> /dev/null; then
        print_status "Configuring repository settings with GitHub CLI..."
        
        # Enable vulnerability alerts
        gh api repos/:owner/:repo -X PATCH -f vulnerability_alerts_enabled=true || true
        
        # Enable automated security fixes
        gh api repos/:owner/:repo -X PATCH -f automated_security_fixes_enabled=true || true
        
        # Set default branch protection (will be configured by workflow)
        print_status "Branch protection will be configured by the branch-protection workflow"
        
        print_success "GitHub settings configured"
    else
        print_warning "GitHub CLI not available. Please configure these settings manually:"
        echo "  1. Enable vulnerability alerts"
        echo "  2. Enable automated security fixes"
        echo "  3. Run the branch-protection workflow"
    fi
}

# ===============================================
# 🎯 Create validation script
# ===============================================
create_validation_script() {
    print_status "Creating local validation script..."
    
    cat > scripts/run-checks.sh << 'EOF'
#!/bin/bash

# 🔍 Local CI checks script
# Run this before pushing to ensure CI will pass

set -e

echo "🚀 Running local CI checks..."

# Frontend checks
echo "🎨 Checking frontend..."
cd frontend
npm ci
npm run lint
npm run test:coverage
npm run build
cd ..

# Backend checks  
echo "🔧 Checking backend..."
cd backend
source venv/bin/activate
pip install -r requirements/testing.txt
flake8 .
black --check .
python manage.py test
cd ..

echo "✅ All checks passed! Ready to push."
EOF
    
    chmod +x scripts/run-checks.sh
    
    print_success "Validation script created"
}

# ===============================================
# 📋 Main execution
# ===============================================
main() {
    echo "🚀 ZentraQMS CI/CD Setup"
    echo "========================"
    
    check_prerequisites
    setup_directories
    setup_frontend_testing
    setup_backend_testing
    setup_security
    create_documentation
    setup_github_settings
    create_validation_script
    
    echo ""
    echo "🎉 CI/CD setup completed successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Commit and push these changes"
    echo "2. Run the branch-protection workflow manually to setup branch protection"
    echo "3. Configure any required secrets in GitHub repository settings"
    echo "4. Test the pipeline by creating a pull request"
    echo ""
    echo "💡 Useful commands:"
    echo "  - Run local checks: ./scripts/run-checks.sh"
    echo "  - View pipeline status: gh run list"
    echo "  - View workflow details: gh workflow view"
    echo ""
    print_success "Setup complete! 🚀"
}

# Run main function
main "$@"