# ZentraQMS Authentication System - Phase 1.2 Documentation

## 🚀 Implementación Completa de JWT Authentication

Esta documentación describe la implementación completa del sistema de autenticación JWT para ZentraQMS, incluyendo configuración, endpoints, y ejemplos de uso.

## 📋 Resumen de la Implementación

### ✅ Componentes Implementados

1. **Custom User Model** con UUID, seguridad de cuentas y campos organizacionales
2. **JWT Authentication** usando djangorestframework-simplejwt
3. **Endpoints de Autenticación** completos (login, refresh, logout, profile)
4. **Serializers Personalizados** con claims adicionales
5. **Middleware de Seguridad** para headers, logging, y rate limiting
6. **Sistema de Logging** para auditoría y eventos de seguridad
7. **Manejo de Excepciones** personalizado y consistente
8. **Tests Comprehensivos** para todos los endpoints

### 🔧 Configuración del Proyecto

#### 1. Instalar Dependencias

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

#### 2. Variables de Entorno (.env)

```bash
# Database
DATABASE_URL=sqlite:///db.sqlite3
# Para PostgreSQL:
# DATABASE_URL=postgres://user:password@localhost:5432/zentraqms

# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT Configuration
JWT_ACCESS_TOKEN_LIFETIME=30  # minutes
JWT_REFRESH_TOKEN_LIFETIME=7  # days

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### 3. Configurar Base de Datos

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser
```

#### 4. Crear Directorios Necesarios

```bash
mkdir -p logs
mkdir -p media
mkdir -p static
```

## 🔐 Endpoints de Autenticación

### Base URL: `/api/auth/`

### 1. Login - `POST /api/auth/login/`

**Request:**
```json
{
    "email": "usuario@zentraqms.com",
    "password": "MiPassword123!"
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Inicio de sesión exitoso.",
    "data": {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "user": {
            "id": "uuid-here",
            "email": "usuario@zentraqms.com",
            "first_name": "Usuario",
            "last_name": "Ejemplo",
            "is_verified": true,
            "department": "Calidad",
            "position": "Analista",
            "roles": [],
            "permissions": []
        }
    }
}
```

**Error Response (400):**
```json
{
    "success": false,
    "error": {
        "message": "Credenciales inválidas.",
        "code": "INVALID_CREDENTIALS",
        "details": {
            "attempts_remaining": 4
        },
        "timestamp": "2024-01-15T10:30:00Z"
    }
}
```

### 2. Token Refresh - `POST /api/auth/refresh/`

**Request:**
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Token renovado exitosamente.",
    "data": {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."  // Si ROTATE_REFRESH_TOKENS=True
    }
}
```

### 3. Current User - `GET /api/auth/user/`

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Información del usuario obtenida exitosamente.",
    "data": {
        "id": "uuid-here",
        "email": "usuario@zentraqms.com",
        "first_name": "Usuario",
        "last_name": "Ejemplo",
        "is_verified": true,
        "is_active": true,
        "is_staff": false,
        "department": "Calidad",
        "position": "Analista",
        "phone": "+57 300 123 4567",
        "identification": "12345678",
        "roles": [],
        "permissions": [],
        "last_login": "2024-01-15T09:15:00Z",
        "date_joined": "2024-01-10T08:00:00Z"
    }
}
```

### 4. Logout - `POST /api/auth/logout/`

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Request:**
```json
{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Success Response (200):**
```json
{
    "success": true,
    "message": "Sesión cerrada exitosamente.",
    "data": {}
}
```

### 5. Token Verification - `POST /api/auth/verify/`

**Request:**
```json
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Success Response (200):**
```json
{}
```

## 🧪 Ejemplos de Uso con cURL

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zentraqms.com",
    "password": "admin123!"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/auth/user/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### Logout
```bash
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

## 🛡️ Seguridad Implementada

### 1. Bloqueo de Cuentas
- **5 intentos fallidos** → Cuenta bloqueada por 30 minutos
- Contador se resetea en login exitoso
- Logging de todos los intentos

### 2. Validaciones de Contraseña
- Mínimo 8 caracteres
- Al menos 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
- Validación contra patrones comunes

### 3. Headers de Seguridad
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (en HTTPS)
- Content Security Policy básico

### 4. Rate Limiting
- 100 requests por IP cada 15 minutos
- Configurable por endpoint

### 5. IP Monitoring
- Logging de IPs por request
- Detección de actividad sospechosa (preparado para implementar)

## 📊 Claims Personalizados en JWT

Los tokens incluyen información adicional del usuario:

```json
{
  "token_type": "access",
  "exp": 1705320600,
  "iat": 1705318800,
  "jti": "uuid-here",
  "user_id": "uuid-here",
  "email": "usuario@zentraqms.com",
  "first_name": "Usuario",
  "last_name": "Ejemplo",
  "is_verified": true,
  "department": "Calidad",
  "position": "Analista",
  "roles": [],
  "permissions": []
}
```

## 📝 Sistema de Logging

### Archivos de Log

1. **`logs/django.log`** - Logs generales del sistema
2. **`logs/authentication.log`** - Eventos de autenticación (JSON)
3. **`logs/security.log`** - Eventos de seguridad
4. **`logs/audit.log`** - Auditoría del sistema

### Eventos Registrados

- Login exitoso/fallido
- Bloqueo de cuentas
- Refresh de tokens
- Logout
- Actividad sospechosa
- Rate limiting
- Errores de autenticación

### Ejemplo de Log de Seguridad
```json
{
  "level": "INFO",
  "timestamp": "2024-01-15 10:30:45,123",
  "logger": "authentication",
  "message": "Security event: {'event_type': 'user_login', 'user_email': 'admin@zentraqms.com', 'ip_address': '127.0.0.1', 'timestamp': '2024-01-15T10:30:45.123456Z', 'details': {'method': 'jwt', 'success': True}}"
}
```

## ⚙️ Configuración de Middleware

El sistema incluye middleware personalizado que debe ser agregado a `MIDDLEWARE` en settings:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Custom Authentication Middleware
    'apps.authentication.middleware.SecurityHeadersMiddleware',
    'apps.authentication.middleware.RequestLoggingMiddleware',
    'apps.authentication.middleware.IPSecurityMiddleware',
    'apps.authentication.middleware.AuthenticationEventMiddleware',
]
```

## 🧪 Ejecutar Tests

```bash
# Ejecutar todos los tests de autenticación
python manage.py test apps.authentication

# Ejecutar tests específicos
python manage.py test apps.authentication.test_jwt_auth

# Con cobertura (si tienes coverage instalado)
coverage run --source='.' manage.py test apps.authentication
coverage report
coverage html
```

### Tests Incluidos

- ✅ Login exitoso/fallido
- ✅ Bloqueo de cuentas
- ✅ Refresh de tokens
- ✅ Logout
- ✅ Current user endpoint
- ✅ Verificación de tokens
- ✅ Claims personalizados
- ✅ Flujos completos de autenticación
- ✅ Validaciones de seguridad

## 🚀 Iniciar el Servidor

```bash
# Desarrollo
python manage.py runserver

# Producción (ejemplo)
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

## 📋 Próximos Pasos (Phase 2)

### Funcionalidades Pendientes

1. **Token Blacklisting** - Invalidar tokens al logout
2. **User Registration** - Registro de usuarios
3. **Password Reset** - Recuperación de contraseñas
4. **Email Verification** - Verificación de correo electrónico
5. **RBAC System** - Sistema completo de roles y permisos
6. **Two-Factor Authentication** - 2FA opcional
7. **OAuth Integration** - Login con Google/Microsoft

### Mejoras de Seguridad

1. **Redis Rate Limiting** - Rate limiting distribuido
2. **IP Reputation** - Validación contra listas negras
3. **Session Management** - Gestión avanzada de sesiones
4. **Audit Trail** - Sistema de auditoría completo

## 🔍 Health Check

Endpoint para verificar el estado del sistema de autenticación:

```bash
curl http://localhost:8000/api/auth/health/
```

**Response:**
```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "authentication": "enabled",
    "jwt": "configured"
}
```

---

## 📞 Soporte

Para problemas o preguntas sobre el sistema de autenticación:

1. **Logs** - Revisar archivos en `logs/`
2. **Tests** - Ejecutar suite completa de tests
3. **Debug** - Activar `DEBUG=True` en desarrollo
4. **Django Admin** - Revisar usuarios en `/admin/`

---

**Implementación completa de Phase 1.2 - JWT Authentication System** ✅

El sistema está listo para usar y todas las funcionalidades básicas de autenticación están implementadas y probadas.