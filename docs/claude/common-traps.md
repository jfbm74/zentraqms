# 🚨 TRAMPAS COMUNES - ZentraQMS

## 📋 Errores Más Frecuentes y Sus Soluciones

### 1. Error: `no such table: auth_user`

**Error**: `sqlite3.OperationalError: no such table: auth_user`

**Causa**: Base de datos SQLite no migrada en desarrollo/producción

**Contexto**: 
- Ocurre al hacer requests de autenticación JWT
- El sistema intenta verificar tokens pero no encuentra las tablas de Django
- Es el error #1 más frecuente en logs de desarrollo

**Solución**:
```bash
# SIEMPRE ejecutar migraciones antes de iniciar el servidor
cd backend
python manage.py migrate --settings=config.settings.development
python manage.py runserver --settings=config.settings.development
```

**Prevención**:
```bash
# Crear script de inicio para desarrollo
echo '#!/bin/bash
cd backend
python manage.py migrate --settings=config.settings.development
python manage.py runserver --settings=config.settings.development' > start_dev.sh
chmod +x start_dev.sh
```

---

### 2. Error: Credenciales de autenticación no proveyeron

**Error**: `Las credenciales de autenticación no se proveyeron.`

**Causa**: Requests al backend sin token JWT o token expirado

**Contexto**:
- Muy frecuente en development cuando el frontend hace requests sin autenticación
- Ocurre especialmente en `/api/v1/organizations/exists_check/`
- El sistema tiene `AllowAny` en testing pero requiere auth en development

**Solución**:
```typescript
// Frontend: SIEMPRE verificar token antes de requests protegidos
const token = localStorage.getItem('access_token');
if (!token) {
  // Redirect to login
  navigate('/auth/login');
  return;
}

// Incluir token en headers
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

**Prevención**:
```typescript
// Usar interceptors de axios para manejo automático
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### 3. Error: `No tienes permiso para realizar esta acción`

**Error**: `No tienes permiso para realizar esta acción: roles.list`

**Causa**: Usuario sin permisos RBAC para la acción solicitada

**Contexto**:
- Sistema RBAC granular implementado
- Usuarios con rol "consulta" intentando acceder a endpoints de administración
- Permisos definidos con wildcards (`auth.*`, `organization.*`)

**Solución**:
```python
# Backend: Verificar permisos del usuario en Django shell
python manage.py shell --settings=config.settings.development
>>> from apps.authentication.models import User
>>> user = User.objects.get(email='consulta@zentraqms.test')
>>> user.get_all_permissions()
```

**Prevención**:
```typescript
// Frontend: Verificar permisos antes de mostrar UI
const { permissions } = useAuth();
const canViewRoles = permissions.includes('roles.list') || permissions.includes('auth.*');

{canViewRoles && (
  <button onClick={viewRoles}>Ver Roles</button>
)}
```

---

### 4. Error: Failed login attempts repetidos

**Error**: `Failed login attempt for email: admin@zentraqms.com`

**Causa**: Credenciales incorrectas o cuentas bloqueadas temporalmente

**Contexto**:
- Patrón de 3-4 intentos fallidos consecutivos
- Principalmente con cuenta admin en desarrollo
- Sistema de seguridad registra IP y timestamp

**Solución**:
```bash
# Verificar/resetear contraseña de admin
cd backend
python manage.py shell --settings=config.settings.development
>>> from apps.authentication.models import User
>>> admin = User.objects.get(email='admin@zentraqms.com')
>>> admin.set_password('admin123')  # Solo para desarrollo
>>> admin.save()
```

**Prevención**:
```bash
# Usar credenciales consistentes en desarrollo
# .env.development
ADMIN_EMAIL=admin@zentraqms.com
ADMIN_PASSWORD=admin123

# Documentar credenciales en README
```

---

### 5. Error: Import/Export de recursos Velzon

**Error**: `Module not found` o `404 Not Found` para assets de Velzon

**Causa**: Referencias directas a la carpeta de Velzon o URLs externas

**Contexto**:
- Imports que apuntan a `/Users/juan.bustamante/personal/Velzon_4.4.1/`
- Uso de CDNs externos en lugar de assets locales
- **CRÍTICO**: Violación de directiva principal del proyecto

**Solución**:
```bash
# OBLIGATORIO: Copiar assets de Velzon al proyecto
cp /Users/juan.bustamante/personal/Velzon_4.4.1/React-TS/Master/src/assets/images/users/*.jpg \
   /Users/juan.bustamante/personal/zentraqms/frontend/src/assets/images/users/

# CORRECTO: Import local
import avatar1 from '../../assets/images/users/avatar-1.jpg';
```

**Prevención**:
```typescript
// ❌ PROHIBIDO - Referencias externas
import avatar from 'https://ui-avatars.com/api/?name=...';
import flag from 'https://flagcdn.com/w20/co.png';

// ✅ OBLIGATORIO - Assets locales
import avatar1 from '@/assets/images/users/avatar-1.jpg';
import colombiaFlag from '@/assets/images/flags/co.svg';
```

---

### 6. Error: Tests fallando por dependencias mock

**Error**: `Server logout failed: Error: Server logout failed`

**Causa**: Mocks de API incompletos en tests frontend

**Contexto**:
- Tests pasan (113/113) pero con stderr warnings
- Mocks de axios no cubren todos los endpoints
- Tests de logout fallan gracefully

**Solución**:
```typescript
// Mejorar mocks en tests
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockImplementation((url) => {
      if (url.includes('/logout/')) {
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.reject(new Error('Mock not implemented'));
    }),
    // ... otros métodos
  }
}));
```

**Prevención**:
```typescript
// Setup global para tests con mocks completos
// src/test/setup.ts
import { vi } from 'vitest';

global.fetch = vi.fn();
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
```

---

### 7. Error: Settings de desarrollo vs testing

**Error**: Configuración incorrecta de Django settings

**Causa**: Usar settings de testing en desarrollo o viceversa

**Contexto**:
- `config.settings.testing` vs `config.settings.development`
- SQLite vs PostgreSQL databases
- Permisos `AllowAny` vs autenticación real

**Solución**:
```bash
# DESARROLLO - SIEMPRE usar development settings
python manage.py runserver --settings=config.settings.development

# TESTING - SIEMPRE usar testing settings
export DJANGO_SETTINGS_MODULE=config.settings.testing
python manage.py test
```

**Prevención**:
```bash
# Crear alias para evitar confusión
alias rundev='cd backend && python manage.py runserver --settings=config.settings.development'
alias runtests='cd backend && export DJANGO_SETTINGS_MODULE=config.settings.testing && python manage.py test'
```

---

### 8. Error: CORS y CSRF en desarrollo

**Error**: `CSRF token missing or incorrect`

**Causa**: Configuración de seguridad Django vs React

**Contexto**:
- Frontend React en puerto 3000
- Backend Django en puerto 8000
- CORS configurado pero CSRF causando problemas

**Solución**:
```python
# development.py - CORS permisivo para desarrollo
CORS_ALLOW_ALL_ORIGINS = True
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
```

**Prevención**:
```typescript
// Frontend: Configurar axios para CSRF
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;
```

---

## 🔧 Scripts de Diagnóstico Rápido

### Verificar Estado Completo del Sistema
```bash
#!/bin/bash
echo "=== DIAGNÓSTICO ZENTRAQMS ==="

# 1. Verificar migraciones
echo "1. Verificando migraciones..."
cd backend && python manage.py showmigrations --settings=config.settings.development

# 2. Verificar logs recientes
echo "2. Últimos errores en logs..."
tail -10 backend/logs/django.log | grep ERROR

# 3. Verificar tests
echo "3. Estado de tests..."
cd frontend && npm run test --run
cd ../backend && python manage.py test --settings=config.settings.testing

# 4. Verificar lint
echo "4. Verificando lint..."
cd frontend && npm run lint

echo "=== FIN DIAGNÓSTICO ==="
```

### Reset Completo de Desarrollo
```bash
#!/bin/bash
echo "=== RESET DESARROLLO ==="

# 1. Limpiar base de datos
cd backend
rm -f db.sqlite3
python manage.py migrate --settings=config.settings.development

# 2. Crear superuser
echo "from apps.authentication.models import User; User.objects.create_superuser('admin@zentraqms.com', 'admin123')" | python manage.py shell --settings=config.settings.development

# 3. Limpiar logs
rm -f logs/*.log

# 4. Reinstalar frontend dependencies
cd ../frontend
rm -rf node_modules package-lock.json
npm install

echo "=== RESET COMPLETO ==="
```

---

## 📋 Checklist de Prevención

Antes de empezar cualquier desarrollo:

### Backend ✅
- [ ] ¿Ejecuté `python manage.py migrate --settings=config.settings.development`?
- [ ] ¿Estoy usando `--settings=config.settings.development` para desarrollo?
- [ ] ¿Verificé que existe un superuser para testing?
- [ ] ¿Los logs están limpios de errores de migración?

### Frontend ✅
- [ ] ¿Verifiqué que `npm run lint` pasa sin errores?
- [ ] ¿Estoy usando assets locales en lugar de CDNs externos?
- [ ] ¿Los mocks de tests están completos?
- [ ] ¿El token JWT se incluye en todas las requests autenticadas?

### Velzon Integration ✅
- [ ] ¿Busqué en Velzon antes de crear componentes nuevos?
- [ ] ¿Copié assets necesarios a la carpeta local del proyecto?
- [ ] ¿Evité referencias directas a `/Users/juan.bustamante/personal/Velzon_4.4.1/`?
- [ ] ¿Adapté textos a español y contexto QMS?

### Seguridad y Permisos ✅
- [ ] ¿Verifiqué los permisos RBAC del usuario?
- [ ] ¿Implementé manejo de errores 401/403 en frontend?
- [ ] ¿Los endpoints sensibles requieren autenticación?
- [ ] ¿Documenté las credenciales de desarrollo?

---

**💡 RECORDATORIO**: Estos errores se repiten porque violan los principios fundamentales del proyecto. Seguir las directivas de CLAUDE.md evita el 90% de estos problemas.