# 🔗 Integración Frontend-Backend - Guía de Validación

## ✅ Estado Actual de la Integración

### Backend ✅
- **Puerto**: 8000
- **Estado**: ✅ Funcionando
- **Health Endpoint**: ✅ http://localhost:8000/api/auth/health/
- **Usuario Admin**: ✅ admin@zentraqms.com / 123456
- **Login Endpoint**: ✅ http://localhost:8000/api/auth/login/
- **Protected Endpoint**: ✅ http://localhost:8000/api/auth/user/

### Frontend ✅
- **Puerto**: 5173 (Vite dev server)
- **Estado**: ✅ Funcionando
- **Hot Reload**: ✅ Activo
- **Routing**: ✅ /login, /dashboard
- **Toast Notifications**: ✅ Configurado
- **Axios Interceptors**: ✅ Implementados

## 🧪 Tests de Validación Manual

### 1. Test de Backend (usando curl)

```bash
# 1. Health Check
curl -s http://localhost:8000/api/auth/health/

# 2. Login Test
curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@zentraqms.com", "password": "123456"}'

# 3. Protected Endpoint (usar el token del paso anterior)
curl -s -H "Authorization: Bearer [ACCESS_TOKEN]" \
  http://localhost:8000/api/auth/user/
```

### 2. Test de Frontend (navegador)

1. **Ir a**: http://localhost:5173
2. **Verificar redirección** a /login (si no autenticado)
3. **Probar credenciales incorrectas**:
   - Email: wrong@email.com
   - Password: wrongpass
   - Verificar toast de error
4. **Probar login exitoso**:
   - Email: admin@zentraqms.com
   - Password: 123456
   - Verificar redirección a /dashboard
   - Verificar toast de éxito
5. **Verificar dashboard**:
   - Información del usuario
   - Botones de testing (en desarrollo)
6. **Probar logout**:
   - Click en "Cerrar Sesión"
   - Verificar redirección a /login

### 3. Test de Interceptores (consola del navegador)

```javascript
// Ejecutar en la consola del navegador después del login

// Test endpoint protegido
fetch('/api/auth/user/')
  .then(r => r.json())
  .then(console.log)

// Simular token expirado
localStorage.removeItem('access_token')
fetch('/api/auth/user/')
  .then(r => r.json())
  .then(console.log)

// Suite completa de tests
window.testAuth.runAllTests()
```

## 📊 Checklist de Integración Completa

### ✅ Configuración Base
- [x] Backend Django corriendo en puerto 8000
- [x] Frontend React corriendo en puerto 5173
- [x] CORS configurado correctamente
- [x] Variables de entorno configuradas

### ✅ Autenticación
- [x] Login endpoint funcional
- [x] JWT tokens generándose correctamente
- [x] Refresh token implementado
- [x] Logout endpoint funcional
- [x] Protected endpoints funcionando

### ✅ Frontend Integration
- [x] Axios interceptors configurados
- [x] Auto-refresh de tokens
- [x] Manejo de errores
- [x] Toast notifications
- [x] Protected routes
- [x] Login form funcional
- [x] Dashboard básico implementado

### ✅ Desarrollo y Testing
- [x] Hot reload funcional
- [x] Credenciales pre-llenadas en desarrollo
- [x] Utilidades de testing manual
- [x] Logging detallado en desarrollo

## 🚀 Próximos Pasos (Fase 2)

1. **Roles y Permisos**: Implementar sistema granular
2. **Módulos QMS**: Procesos, Auditorías, Normograma
3. **Dashboard Avanzado**: Métricas reales, gráficos
4. **Gestión de Usuarios**: CRUD, roles, permisos
5. **API Documentation**: Swagger/OpenAPI
6. **Testing Automatizado**: E2E tests
7. **Optimización**: Caching, lazy loading

## 🔧 Comandos de Desarrollo

```bash
# Backend
cd backend
source venv/bin/activate
python manage.py runserver

# Frontend
cd frontend
npm run dev

# Testing
npm run test
npm run test:coverage

# Linting
npm run lint
```

## 📝 Notas Importantes

1. **Credenciales de Desarrollo**:
   - Email: admin@zentraqms.com
   - Password: 123456

2. **Tokens JWT**:
   - Access token: 30 minutos
   - Refresh token: 7 días
   - Auto-refresh: 60 segundos antes de expiración

3. **Error Handling**:
   - 401: Credenciales inválidas
   - 403: Cuenta desactivada
   - Network errors: Timeout, conexión

4. **Security Features**:
   - CORS configurado
   - CSRF protection
   - Rate limiting
   - Token blacklisting

## 🐛 Troubleshooting

### Frontend no se conecta al backend
```bash
# Verificar que el backend esté corriendo
curl http://localhost:8000/api/auth/health/

# Verificar variables de entorno
echo $VITE_API_BASE_URL
```

### Problemas de CORS
- Verificar configuración en Django settings
- Limpiar cache del navegador
- Verificar headers en Network tab

### Token no se actualiza automáticamente
- Verificar interceptor de Axios
- Revisar localStorage para refresh_token
- Verificar logs en consola

---

**✅ Integración Completada Exitosamente**
- Fecha: 2025-08-13
- Frontend-Backend: ✅ Conectados
- Autenticación: ✅ Funcional
- Rutas Protegidas: ✅ Funcionando
- Testing Manual: ✅ Disponible