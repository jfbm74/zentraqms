# ZentraQMS - Multi-Sector Quality Management System

![Version](https://img.shields.io/badge/version-2.0.0--dev-blue.svg)
![Django](https://img.shields.io/badge/Django-5.0-green.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![Architecture](https://img.shields.io/badge/Multi--Sector-Ready-orange.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

## 🎯 Overview

ZentraQMS is a **multi-sector Quality Management System** with intelligent auto-configuration. Built for scalability across healthcare, manufacturing, education and other industries with **sector-specific extensions** and **automatic module activation**.

## 🏗️ Core Architecture

### Multi-Sector Pattern
```
Organization (Master Table)
├── enabled_modules: JSONField     # Auto-activated modules
├── sector_config: JSONField       # Sector-specific config
└── Extensions (OneToOne):
    ├── HealthOrganization          # Healthcare sector ✅
    ├── ManufacturingOrganization   # Manufacturing 🔧  
    └── EducationOrganization       # Education 🔧
```

### Auto-Activation Engine
Organizations automatically get modules based on `sector + type`:
- **Healthcare IPS** → `['DASHBOARD', 'SUH', 'PAMEC', 'CLINICAL_SAFETY']`
- **Manufacturing** → `['DASHBOARD', 'PRODUCTION', 'QUALITY_CONTROL']`
- **Education** → `['DASHBOARD', 'ACADEMIC', 'RESEARCH']`

## ⚡ Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Backend** | Django + DRF | 5.0 |
| **Database** | PostgreSQL | 15 |
| **Frontend** | React + TypeScript | 19.0 + 5.6 |
| **UI Template** | Velzon | 4.4.1 |
| **Build** | Vite | 5.0 |
| **Auth** | JWT + RBAC | Custom |

## 🚀 Quick Start

### Development (Docker)
```bash
git clone <repo>
cd zentraqms
docker-compose up --build
```

### Development (Local)
```bash
# Backend (Port 8000)
cd backend && python manage.py runserver

# Frontend (Port 3000) 
cd frontend && npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

## 📊 Module Status

| Category | Module | Complete | Production |
|----------|--------|----------|------------|
| **Core** | Authentication | 100% | ✅ |
| **Core** | Multi-Sector | 100% | ✅ |
| **Core** | Organizations | 100% | ✅ |
| **Operations** | Non-Conformities | 25% | ❌ |
| **Operations** | Audits | 10% | ❌ |
| **Quality** | Processes | 15% | ❌ |
| **Quality** | Indicators | 25% | ❌ |
| **Health** | SUH Module | 60% | ❌ |
| **Health** | PAMEC | 45% | ❌ |

## 🔐 RBAC System

### Roles
- `super_admin` - Full system access
- `admin` - Organization management
- `coordinador` - Quality coordination
- `auditor` - Audit execution
- `consulta` - Read-only access
- `guest` - Limited access

### Permission Components
```tsx
// Conditional rendering
<PermissionGate permission="audits.create">
  <CreateButton />
</PermissionGate>

// Programmatic checks
const { hasPermission } = usePermissions();
if (hasPermission('documents.delete')) {
  // Show delete option
}
```

## 🧪 Testing

### Backend (Django)
```bash
# All tests
python manage.py test

# Specific module
python manage.py test apps.organization
```
**Status:** ✅ 57/57 tests passing

### Frontend (React)
```bash
npm run test
npm run test:coverage
```
**Status:** ⚠️ Test suite pending setup

## 📁 Project Structure

```
zentraqms/
├── backend/
│   ├── apps/
│   │   ├── authentication/     # JWT auth
│   │   ├── authorization/      # RBAC system
│   │   ├── organization/       # Multi-sector orgs
│   │   └── common/            # Shared models
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom hooks
│   │   └── pages/            # Route components
│   └── package.json
├── claude-modules/           # AI documentation
└── docker-compose.yml
```

## 🔧 For Developers

### Adding New Sector
1. **Create extension model** (OneToOne with Organization)
2. **Add auto-activation rules** in serializer
3. **Define sector modules** with compatibility
4. **Map UI components** for new sector

### Key APIs
```bash
# Organization wizard
POST /api/v1/organization/wizard/

# Authentication
POST /api/v1/auth/login/
POST /api/v1/auth/refresh/

# Permissions
GET /api/v1/authorization/user-permissions/my_permissions/
```

## 📋 Environment Setup

### Backend (.env)
```env
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=zentradb
DB_USER=zentrauser
DB_PASSWORD=zentrapass
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=ZentraQMS
```

## 🚦 Production Deployment

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Key Considerations
- Set `DEBUG=False`
- Configure HTTPS
- Setup PostgreSQL backup
- Configure log monitoring
- Use environment secrets

## 📈 Performance

### Current Metrics
- **Login:** < 500ms
- **Wizard Load:** < 1s
- **Auto-save:** < 300ms
- **Navigation:** Instant

### Optimizations
- Auto-save with 1s debounce
- JWT token auto-refresh
- Selective module loading
- Database query optimization

## 📚 Documentation

### For Development Team
- **Architecture:** `claude-modules/architecture/README.claude.md`
- **Multi-Sector:** `claude-modules/architecture/multi-sector-module-architecture.claude.md`
- **Organization Module:** `claude-modules/organization/README.claude.md`
- **Frontend Guide:** `claude-modules/frontend/README.claude.md`

### API Documentation
- Swagger: http://localhost:8000/api/swagger/
- ReDoc: http://localhost:8000/api/redoc/

## 🔄 Release Management

### Versioning
We use [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., 2.0.0)
- Current: **v2.0.0-dev** (Multi-Sector Development)

### Create Release
```bash
./scripts/create-release.sh minor
./scripts/create-release.sh patch --push
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow commit conventions (`feat:`, `fix:`, `docs:`)
4. Submit pull request

## 📞 Support

- **Issues:** GitHub Issues
- **Documentation:** `/claude-modules/`
- **Architecture Questions:** Consult AI agents in `.claude/agents/`

---

**Status:** Production-ready core with modular expansion capability
**Team:** Multi-disciplinary development team
**License:** Proprietary