# ZentraQMS Backend

Sistema de Gestión de Calidad - Backend API construido con Django REST Framework.

## 🚀 Instalación y Configuración

### Pre-requisitos

- Python 3.11+
- PostgreSQL 12+ (para producción)
- Redis (para cache y tareas en segundo plano)

### Configuración Inicial

1. **Clonar y activar entorno virtual:**
```bash
cd backend
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. **Instalar dependencias:**
```bash
# Para desarrollo
pip install -r requirements/development.txt

# Para producción
pip install -r requirements/production.txt
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Aplicar migraciones:**
```bash
python manage.py migrate
```

5. **Crear superusuario:**
```bash
python manage.py createsuperuser
```

6. **Ejecutar servidor de desarrollo:**
```bash
python manage.py runserver
```

## 🛠️ Comandos Útiles

### Usando Makefile

```bash
# Ver todos los comandos disponibles
make help

# Configurar entorno de desarrollo
make setup-dev

# Ejecutar tests
make test

# Ejecutar servidor
make runserver

# Aplicar migraciones
make migrate

# Formatear código
make format

# Linting
make lint
```

### Comandos Django

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Ejecutar tests
python manage.py test

# Shell de Django
python manage.py shell

# Crear superusuario
python manage.py createsuperuser
```

## 📊 Estructura del Proyecto

```
backend/
├── config/                 # Configuración principal
│   ├── settings/          # Settings por entorno
│   │   ├── base.py       # Configuración base
│   │   ├── development.py # Desarrollo
│   │   ├── production.py  # Producción
│   │   └── testing.py     # Testing
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/                   # Aplicaciones Django
│   ├── authentication/    # Sistema de autenticación personalizado
│   │   ├── models.py      # Modelo User personalizado
│   │   ├── managers.py    # UserManager personalizado
│   │   ├── serializers.py # Serializers DRF
│   │   ├── validators.py  # Validadores personalizados
│   │   ├── admin.py       # Configuración Django Admin
│   │   └── tests.py       # Tests unitarios
│   └── common/            # Utilidades compartidas
│       ├── models.py      # Modelos base abstractos
│       └── utils.py       # Utilidades comunes
├── requirements/          # Dependencias por entorno
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── logs/                  # Archivos de log
├── static/                # Archivos estáticos
├── media/                 # Archivos de media
└── manage.py
```

## 🔧 Características Implementadas

### Autenticación Personalizada

- **Modelo User personalizado** con UUID como primary key
- **Email como campo de login** en lugar de username
- **Campos de seguridad**: intentos fallidos, bloqueo de cuenta
- **Campos organizacionales**: departamento, posición
- **Validaciones robustas**: contraseñas fuertes, teléfonos colombianos
- **Django Admin personalizado** con acciones y filtros

### Configuración

- **Settings por entorno**: desarrollo, producción, testing
- **CORS configurado** para frontend React
- **Logging estructurado** para auditoría
- **Django REST Framework** configurado con paginación y filtros
- **Validaciones de seguridad** implementadas

### Testing

- **Tests unitarios completos** para modelos y validadores
- **Cobertura de tests** para funcionalidades críticas
- **Configuración de testing** optimizada para CI/CD

## 🚦 API Endpoints

> **Nota**: Los endpoints de API se implementarán en la siguiente fase. Esta fase se enfoca en los modelos base y configuración.

Endpoints planeados:
- `/api/v1/auth/` - Autenticación JWT
- `/api/v1/users/` - Gestión de usuarios
- `/health/` - Health check (ya disponible)

## 🔒 Seguridad

### Características de Seguridad Implementadas

- UUID como primary key (previene enumeración)
- Validación de contraseñas fuertes
- Bloqueo automático por intentos fallidos
- Normalización de emails case-insensitive
- Validaciones de entrada robustas
- Configuración CORS restrictiva

### Para Producción

- Variables de entorno para secrets
- HTTPS obligatorio
- Headers de seguridad configurados
- Session cookies seguras
- Logging de eventos de seguridad

## 📝 Variables de Entorno

Principales variables en `.env`:

```bash
# Django
SECRET_KEY=tu-secret-key-super-segura
DEBUG=False
DJANGO_ENVIRONMENT=production

# Base de datos
DB_NAME=zentraqms_db
DB_USER=postgres
DB_PASSWORD=password-segura
DB_HOST=localhost
DB_PORT=5432

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password

# CORS
CORS_ALLOWED_ORIGINS=https://tu-dominio.com
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
python manage.py test

# Tests específicos
python manage.py test apps.authentication

# Con cobertura
make coverage

# Tests rápidos (para desarrollo)
make test-fast
```

## 📈 Siguientes Fases

1. **Fase 1.2**: Implementación JWT básico
2. **Fase 1.3**: Setup inicial del frontend React
3. **Fase 1.4**: Integración básica frontend-backend

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de migraciones**: Verificar configuración de base de datos
2. **Tests fallando**: Asegurar que DJANGO_ENVIRONMENT=testing
3. **CORS errors**: Verificar CORS_ALLOWED_ORIGINS
4. **Import errors**: Verificar PYTHONPATH y estructura de apps

### Logs

```bash
# Ver logs en desarrollo
tail -f logs/django.log

# Ver logs de errores
tail -f logs/errors.log
```

## 📞 Soporte

Para soporte técnico o reportar bugs, crear un issue en el repositorio del proyecto.

---

**Versión**: 1.0.0 - Fase 1.1 (Modelos Base y Configuración Inicial)  
**Última actualización**: Agosto 2025