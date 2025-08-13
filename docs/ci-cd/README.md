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
