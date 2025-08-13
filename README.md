# ZentraQMS - Sistema de Gestión de Calidad

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Django](https://img.shields.io/badge/Django-5.0-green.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

## 📋 Descripción

ZentraQMS es un Sistema de Gestión de Calidad (QMS) completo y moderno diseñado para optimizar los procesos organizacionales. Construido con las últimas tecnologías, ofrece una solución integral para la gestión de procesos, auditorías, normogramas e indicadores de gestión.

## 🚀 Características Principales

### Módulos del Sistema

- **📊 Dashboard**: Vista general con métricas y KPIs en tiempo real
- **📋 Gestión de Procesos**: Documentación y control de procesos organizacionales
- **📚 Normograma**: Gestión de documentos normativos y regulatorios
- **🔍 Auditorías**: Planificación, ejecución y seguimiento de auditorías internas
- **📈 Indicadores KPI**: Monitoreo y análisis de indicadores de gestión
- **⚙️ Configuración**: Gestión de usuarios, roles y configuración del sistema

## 🛠️ Stack Tecnológico

### Backend
- **Django 5.0** - Framework web de Python
- **Django REST Framework** - API RESTful
- **PostgreSQL** - Base de datos principal
- **Redis** - Cache y broker de mensajes
- **Celery** - Procesamiento de tareas asíncronas

### Frontend
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Bootstrap 5.3** - Framework CSS
- **Remix Icons** - Biblioteca de iconos

### DevOps
- **Docker & Docker Compose** - Containerización
- **Nginx** - Servidor web (producción)
- **GitHub Actions** - CI/CD (opcional)

## 📦 Requisitos Previos

- Docker Desktop instalado
- Git
- Node.js 20+ (para desarrollo local sin Docker)
- Python 3.11+ (para desarrollo local sin Docker)

## 🔧 Instalación y Configuración

### Instalación con Docker (Recomendado)

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/zentraqms.git
cd zentraqms
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Construir y levantar los contenedores**
```bash
docker-compose up --build
```

4. **Ejecutar migraciones**
```bash
docker-compose exec django python manage.py migrate
```

5. **Crear superusuario**
```bash
docker-compose exec django python manage.py createsuperuser
```

6. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/

### Instalación Local (Desarrollo)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🐳 Comandos Docker Útiles

```bash
# Ver logs
docker-compose logs -f

# Detener contenedores
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir contenedores
docker-compose up --build

# Ejecutar comandos Django
docker-compose exec django python manage.py [comando]

# Ejecutar shell de Django
docker-compose exec django python manage.py shell

# Acceder a PostgreSQL
docker-compose exec db psql -U zentrauser -d zentradb
```

## 📁 Estructura del Proyecto

```
zentraqms/
├── backend/
│   ├── core/                  # Configuración principal Django
│   ├── authentication/        # App de autenticación
│   ├── procesos/             # App de gestión de procesos
│   ├── normograma/           # App de documentos normativos
│   ├── auditorias/           # App de auditorías
│   ├── indicadores/          # App de KPIs
│   ├── requirements.txt      # Dependencias Python
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   │   └── layout/      # Layout principal
│   │   ├── assets/          # Imágenes y recursos
│   │   ├── App.tsx          # Componente principal
│   │   └── main.tsx         # Punto de entrada
│   ├── package.json         # Dependencias Node
│   └── vite.config.ts       # Configuración Vite
├── docker-compose.yml       # Configuración Docker
├── Makefile                # Comandos de automatización
└── README.md               # Este archivo
```

## 🔑 Variables de Entorno

### Backend (.env)
```env
# Django
SECRET_KEY=tu-secret-key-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=zentradb
DB_USER=zentrauser
DB_PASSWORD=zentrapass
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

## 🧪 Testing

### Backend
```bash
docker-compose exec django python manage.py test
```

### Frontend
```bash
cd frontend
npm run test
```

## 📝 Makefile - Comandos Disponibles

```bash
make help        # Mostrar ayuda
make build       # Construir contenedores
make up          # Levantar servicios
make down        # Detener servicios
make migrate     # Ejecutar migraciones
make shell       # Shell de Django
make logs        # Ver logs
make clean       # Limpiar proyecto
```

## 🚀 Despliegue en Producción

### Consideraciones
1. Cambiar `DEBUG=False` en producción
2. Configurar un servidor web (Nginx/Apache)
3. Usar una base de datos robusta (PostgreSQL)
4. Configurar HTTPS con certificados SSL
5. Implementar backup automático
6. Configurar monitoreo y logs

### Ejemplo con Docker en Producción
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 API Documentation

La documentación de la API está disponible en:
- Swagger UI: http://localhost:8000/api/swagger/
- ReDoc: http://localhost:8000/api/redoc/

### Endpoints Principales
```
GET    /api/procesos/          # Listar procesos
POST   /api/procesos/          # Crear proceso
GET    /api/auditorias/        # Listar auditorías
POST   /api/auditorias/        # Crear auditoría
GET    /api/indicadores/       # Listar KPIs
POST   /api/indicadores/       # Crear KPI
```

## 👥 Equipo de Desarrollo

- **Desarrollador Principal**: [Tu Nombre]
- **Contacto**: [tu-email@ejemplo.com]

## 📄 Licencia

Este proyecto es software propietario. Todos los derechos reservados.

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte y consultas:
- Email: soporte@zentraqms.com
- Issues: [GitHub Issues](https://github.com/tu-usuario/zentraqms/issues)

## 🔄 Versionado y Releases

### Sistema de Versionado

Este proyecto usa [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR.MINOR.PATCH** (ej: 1.2.3)
- **MAJOR**: Cambios incompatibles en la API
- **MINOR**: Nuevas funcionalidades compatibles hacia atrás  
- **PATCH**: Correcciones compatibles hacia atrás

### Crear una Nueva Versión

```bash
# Versión patch (0.1.0 → 0.1.1)
./scripts/create-release.sh patch

# Versión minor (0.1.0 → 0.2.0)  
./scripts/create-release.sh minor

# Versión major (0.1.0 → 1.0.0)
./scripts/create-release.sh major

# Con push automático
./scripts/create-release.sh minor --push

# Simulación sin cambios
./scripts/create-release.sh patch --dry-run
```

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva funcionalidad
fix: corrección de bug  
docs: solo cambios en documentación
style: cambios que no afectan el código (espacios, formato, etc)
refactor: código que no corrige bug ni agrega funcionalidad
test: agregar o corregir tests
chore: cambios en el build, dependencias, etc
```

### Scripts de Versionado

- `npm run version:patch` - Incrementa versión patch
- `npm run version:minor` - Incrementa versión minor
- `npm run version:major` - Incrementa versión major
- `npm run version:sync` - Sincroniza versiones entre módulos
- `./scripts/create-release.sh` - Script completo de release

### Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para el historial completo de cambios.

---

Desarrollado con ❤️ para la Excelencia Organizacional