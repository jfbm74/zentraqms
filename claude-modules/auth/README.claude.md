# Módulo de Autenticación y Autorización - ZentraQMS

## Resumen

El módulo de autenticación maneja el acceso seguro al sistema mediante JWT (JSON Web Tokens) y un sistema RBAC (Role-Based Access Control) personalizado con permisos granulares.

## Estado: ✅ Completado (100%)

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  LoginPage   │  │  AuthContext │  │  useAuth     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ JWT Token
┌────────────────────────┴────────────────────────────────┐
│                   Backend (Django)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  JWT Auth    │  │     RBAC     │  │  Middleware  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────┐
│                      PostgreSQL                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Users     │  │    Roles     │  │ Permissions  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Backend - Django

### Modelos

#### User (CustomUser)
```python
# apps/authentication/models.py
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    organization = models.ForeignKey('organization.Organization', null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### Role
```python
# apps/authorization/models.py
class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField()
    permissions = models.ManyToManyField(Permission)
    is_system = models.BooleanField(default=False)
```

#### Permission
```python
class Permission(models.Model):
    module = models.CharField(max_length=50)
    action = models.CharField(max_length=50)
    resource = models.CharField(max_length=100)
    description = models.TextField()
    
    class Meta:
        unique_together = ['module', 'action', 'resource']
```

### APIs Endpoints

#### Autenticación
```
POST   /api/v1/auth/login/           # Login con username/password
POST   /api/v1/auth/logout/          # Logout (invalida refresh token)
POST   /api/v1/auth/token/refresh/   # Renovar access token
GET    /api/v1/auth/me/              # Obtener usuario actual
PUT    /api/v1/auth/change-password/ # Cambiar contraseña
```

#### Autorización
```
GET    /api/v1/rbac/permissions/     # Listar permisos del usuario
GET    /api/v1/rbac/roles/           # Listar roles disponibles
POST   /api/v1/rbac/check-permission/ # Verificar permiso específico
GET    /api/v1/rbac/user-permissions/{user_id}/ # Permisos de un usuario
```

### Configuración JWT

```python
# config/settings/base.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}
```

### Middleware de Autenticación

```python
# apps/authentication/middleware.py
class JWTAuthenticationMiddleware:
    """
    Middleware que valida JWT en cada request.
    Extrae el usuario y lo añade al request.
    """
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        token = self.get_token_from_request(request)
        if token:
            try:
                payload = jwt.decode(token, settings.SECRET_KEY)
                request.user = User.objects.get(id=payload['user_id'])
            except:
                request.user = AnonymousUser()
        
        response = self.get_response(request)
        return response
```

### Permisos DRF

```python
# apps/authorization/drf_permissions.py
class ModularPermission(BasePermission):
    """
    Permiso personalizado que valida permisos modulares.
    Formato: module.action.resource
    """
    def has_permission(self, request, view):
        # Extraer módulo, acción y recurso del view
        module = getattr(view, 'permission_module', None)
        resource = getattr(view, 'permission_resource', None)
        action = self.get_action_from_method(request.method)
        
        # Verificar permiso
        return request.user.has_module_permission(module, action, resource)
```

## Frontend - React

### Contexto de Autenticación

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    setUser(response.user);
  };
  
  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) || false;
  };
  
  // ...resto de la implementación
};
```

### Hook useAuth

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};
```

### Componente ProtectedRoute

```typescript
// components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  permission,
  fallback = <Navigate to="/login" />
}) => {
  const { isAuthenticated, hasPermission } = useAuth();
  
  if (!isAuthenticated) {
    return fallback;
  }
  
  if (permission && !hasPermission(permission)) {
    return <AccessDeniedPage />;
  }
  
  return <>{children}</>;
};
```

### Servicio de Autenticación

```typescript
// services/auth.service.ts
class AuthService {
  private baseURL = '/api/v1/auth';
  
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post(`${this.baseURL}/login/`, credentials);
    return response.data;
  }
  
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    await axios.post(`${this.baseURL}/logout/`, { refresh: refreshToken });
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
  
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await axios.post(`${this.baseURL}/token/refresh/`, {
      refresh: refreshToken
    });
    localStorage.setItem('access_token', response.data.access);
    return response.data;
  }
  
  async getCurrentUser(): Promise<User> {
    const response = await axios.get(`${this.baseURL}/me/`);
    return response.data;
  }
}

export default new AuthService();
```

## Sistema RBAC

### Roles Predefinidos

1. **SUPER_ADMIN** (Sistema)
   - Acceso total al sistema
   - Gestión de organizaciones
   - Configuración global

2. **ADMIN** (Organización)
   - Gestión completa de su organización
   - Gestión de usuarios y roles
   - Configuración de módulos

3. **MANAGER** (Gestor)
   - Gestión de procesos y documentos
   - Aprobación de cambios
   - Visualización de reportes

4. **OPERATOR** (Operador)
   - Creación y edición de documentos
   - Registro de datos
   - Acceso limitado a reportes

5. **VIEWER** (Consulta)
   - Solo lectura
   - Visualización de documentos aprobados
   - Reportes básicos

### Formato de Permisos

```
<module>.<action>.<resource>

Ejemplos:
- organization.create.branch
- organization.edit.info
- organization.view.all
- process.approve.document
- audit.create.finding
```

### Verificación de Permisos

#### Backend
```python
# En views
@permission_required('organization.edit.info')
def update_organization(request, pk):
    # Lógica de actualización
    pass

# En código
if request.user.has_module_permission('organization', 'edit', 'info'):
    # Permitir acción
    pass
```

#### Frontend
```typescript
// En componentes
const { hasPermission } = useAuth();

{hasPermission('organization.edit.info') && (
  <Button onClick={handleEdit}>Editar</Button>
)}

// En rutas
<ProtectedRoute permission="organization.view.all">
  <OrganizationListPage />
</ProtectedRoute>
```

## Flujo de Autenticación

1. **Login**
   ```
   Cliente → POST /api/v1/auth/login/ → Backend
   Backend valida credenciales
   Backend genera JWT (access + refresh)
   Cliente almacena tokens en localStorage
   ```

2. **Request Autenticado**
   ```
   Cliente añade header: Authorization: Bearer <access_token>
   Backend valida token con middleware
   Backend extrae usuario del token
   Backend verifica permisos RBAC
   ```

3. **Refresh Token**
   ```
   Access token expira (60 min)
   Cliente detecta 401
   Cliente → POST /api/v1/auth/token/refresh/ con refresh_token
   Backend genera nuevo access_token
   Cliente actualiza token y reintenta request
   ```

4. **Logout**
   ```
   Cliente → POST /api/v1/auth/logout/ con refresh_token
   Backend añade refresh_token a blacklist
   Cliente elimina tokens de localStorage
   Redirección a login
   ```

## Seguridad

### Medidas Implementadas

1. **Tokens JWT**
   - Access token: 60 minutos
   - Refresh token: 7 días
   - Rotación de refresh tokens
   - Blacklist de tokens revocados

2. **Validaciones**
   - Contraseñas fuertes (min 8 caracteres, mayúsculas, números)
   - Límite de intentos de login (5 intentos, bloqueo 30 min)
   - Validación de email único
   - CORS configurado

3. **Auditoría**
   - Log de todos los logins
   - Log de cambios de permisos
   - Log de accesos denegados
   - Tracking de IPs

### Headers de Seguridad

```python
# middleware.py
response['X-Content-Type-Options'] = 'nosniff'
response['X-Frame-Options'] = 'DENY'
response['X-XSS-Protection'] = '1; mode=block'
response['Strict-Transport-Security'] = 'max-age=31536000'
```

## Testing

### Backend Tests
```python
# tests/test_authentication.py
class AuthenticationTestCase(APITestCase):
    def test_login_exitoso(self):
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'testuser',
            'password': 'TestPass123!'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_acceso_sin_autenticacion(self):
        response = self.client.get('/api/v1/organizations/')
        self.assertEqual(response.status_code, 401)
```

### Frontend Tests
```typescript
// __tests__/auth.test.tsx
describe('Authentication', () => {
  it('debe hacer login exitosamente', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.login({
        username: 'test',
        password: 'password'
      });
    });
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeDefined();
  });
});
```

## Troubleshooting

### Problemas Comunes

1. **Token Expirado**
   - Síntoma: 401 Unauthorized
   - Solución: Implementar auto-refresh en interceptor

2. **CORS Error**
   - Síntoma: Blocked by CORS policy
   - Solución: Verificar CORS_ALLOWED_ORIGINS en settings

3. **Usuario sin permisos**
   - Síntoma: 403 Forbidden
   - Solución: Verificar roles y permisos asignados

4. **Token no válido**
   - Síntoma: "Invalid token"
   - Solución: Verificar SECRET_KEY consistency

## Comandos Útiles

```bash
# Crear superusuario
python manage.py createsuperuser --settings=config.settings.development

# Poblar permisos RBAC
python manage.py populate_rbac --settings=config.settings.development

# Crear usuarios de prueba
python manage.py create_test_users --settings=config.settings.development

# Verificar permisos de usuario
python manage.py shell --settings=config.settings.development
>>> from apps.authentication.models import User
>>> user = User.objects.get(username='test')
>>> user.get_all_permissions()
```

---

**Nota**: Este módulo es crítico para la seguridad del sistema. Cualquier cambio debe ser cuidadosamente revisado y testeado.