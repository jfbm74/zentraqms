# 🎯 Patrones de Desarrollo - ZentraQMS

## 📋 Índice
1. [Patrones Backend](#patrones-backend)
2. [Patrones Frontend](#patrones-frontend)
3. [Patrones de Integración](#patrones-de-integración)
4. [Anti-Patrones a Evitar](#anti-patrones-a-evitar)

## 🔧 Patrones Backend

### 1. Repository Pattern

**Propósito**: Encapsular lógica de acceso a datos.

```python
# apps/common/repositories.py
class BaseRepository:
    """Repositorio base para operaciones CRUD"""
    model = None
    
    @classmethod
    def get_by_id(cls, id: int):
        return cls.model.objects.get(id=id)
    
    @classmethod
    def get_all_active(cls):
        return cls.model.active.all()
    
    @classmethod
    def create(cls, **kwargs):
        return cls.model.objects.create(**kwargs)

# apps/organization/repositories.py
class OrganizationRepository(BaseRepository):
    model = Organization
    
    @classmethod
    def get_by_nit(cls, nit: str):
        return cls.model.objects.get(nit=nit)
    
    @classmethod
    def get_configured(cls):
        return cls.model.active.filter(is_configured=True)
```

### 2. Service Layer Pattern

**Propósito**: Lógica de negocio compleja fuera de views.

```python
# apps/organization/services.py
class OrganizationService:
    """Servicios de lógica de negocio para organizaciones"""
    
    @staticmethod
    def create_with_template(data: dict, template_id: int, user: User):
        """Crear organización con plantilla predefinida"""
        with transaction.atomic():
            # Crear organización
            org = Organization.objects.create(
                **data,
                owner=user,
                created_by=user
            )
            
            # Aplicar plantilla
            template = SectorTemplate.objects.get(id=template_id)
            OrganizationService._apply_template(org, template)
            
            # Crear ubicación principal
            Location.objects.create(
                organization=org,
                is_main=True,
                **data['main_location']
            )
            
            # Marcar como configurada
            org.is_configured = True
            org.configuration_completed_at = timezone.now()
            org.save()
            
            # Enviar notificación
            NotificationService.send_welcome_email(org)
            
            return org
    
    @staticmethod
    def _apply_template(org: Organization, template: SectorTemplate):
        """Aplicar plantilla a organización"""
        # Crear procesos predefinidos
        for process_data in template.processes:
            Process.objects.create(
                organization=org,
                **process_data
            )
```

### 3. Factory Pattern

**Propósito**: Creación de objetos complejos.

```python
# apps/common/factories.py
class UserFactory:
    """Factory para crear usuarios con roles"""
    
    @staticmethod
    def create_admin(organization: Organization, **kwargs):
        user = User.objects.create(**kwargs)
        admin_role = Role.objects.get(name='ADMIN')
        user.roles.add(admin_role)
        user.organization = organization
        user.save()
        return user
    
    @staticmethod
    def create_operator(organization: Organization, **kwargs):
        user = User.objects.create(**kwargs)
        operator_role = Role.objects.get(name='OPERATOR')
        user.roles.add(operator_role)
        user.organization = organization
        user.save()
        return user
```

### 4. Strategy Pattern para Validaciones

**Propósito**: Diferentes estrategias de validación según contexto.

```python
# apps/common/validators.py
from abc import ABC, abstractmethod

class ValidationStrategy(ABC):
    @abstractmethod
    def validate(self, value):
        pass

class NITValidator(ValidationStrategy):
    def validate(self, value):
        # Validación específica de NIT colombiano
        if not re.match(r'^\d{9}$', value):
            raise ValidationError("NIT debe tener 9 dígitos")
        return True

class EmailValidator(ValidationStrategy):
    def validate(self, value):
        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', value):
            raise ValidationError("Email inválido")
        return True

class ValidatorContext:
    def __init__(self, strategy: ValidationStrategy):
        self._strategy = strategy
    
    def validate(self, value):
        return self._strategy.validate(value)
```

## 🎨 Patrones Frontend

### 1. Container/Presentational Components

**Propósito**: Separar lógica de presentación.

```typescript
// Container Component (Smart)
const OrganizationListContainer: React.FC = () => {
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();
  
  useEffect(() => {
    fetchOrganizations().then(data => {
      setOrganizations(data);
      setLoading(false);
    });
  }, []);
  
  const handleDelete = async (id: string) => {
    await deleteOrganization(id);
    setOrganizations(prev => prev.filter(org => org.id !== id));
  };
  
  return (
    <OrganizationList
      organizations={organizations}
      loading={loading}
      onDelete={handleDelete}
      canDelete={hasPermission('organization.delete')}
    />
  );
};

// Presentational Component (Dumb)
interface OrganizationListProps {
  organizations: IOrganization[];
  loading: boolean;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

const OrganizationList: React.FC<OrganizationListProps> = ({
  organizations,
  loading,
  onDelete,
  canDelete
}) => {
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="organization-list">
      {organizations.map(org => (
        <OrganizationCard
          key={org.id}
          organization={org}
          onDelete={canDelete ? onDelete : undefined}
        />
      ))}
    </div>
  );
};
```

### 2. Custom Hooks Pattern

**Propósito**: Reutilizar lógica stateful.

```typescript
// hooks/useApi.ts
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(url);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [url]);
  
  const refetch = () => {
    setLoading(true);
    fetchData();
  };
  
  return { data, loading, error, refetch };
}

// Uso
const OrganizationDetail: React.FC<{ id: string }> = ({ id }) => {
  const { data: organization, loading, error } = useApi<IOrganization>(
    `/api/v1/organizations/${id}/`
  );
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!organization) return <NotFound />;
  
  return <OrganizationView organization={organization} />;
};
```

### 3. Compound Components Pattern

**Propósito**: Componentes flexibles y componibles.

```typescript
// Compound Card Component
interface CardCompound {
  Header: React.FC<{ children: React.ReactNode }>;
  Body: React.FC<{ children: React.ReactNode }>;
  Footer: React.FC<{ children: React.ReactNode }>;
}

const Card: React.FC<{ children: React.ReactNode }> & CardCompound = ({ children }) => {
  return <div className="card">{children}</div>;
};

Card.Header = ({ children }) => (
  <div className="card-header">{children}</div>
);

Card.Body = ({ children }) => (
  <div className="card-body">{children}</div>
);

Card.Footer = ({ children }) => (
  <div className="card-footer">{children}</div>
);

// Uso
<Card>
  <Card.Header>
    <h3>Título</h3>
  </Card.Header>
  <Card.Body>
    <p>Contenido</p>
  </Card.Body>
  <Card.Footer>
    <Button>Acción</Button>
  </Card.Footer>
</Card>
```

### 4. Render Props Pattern

**Propósito**: Compartir lógica entre componentes.

```typescript
interface DataFetcherProps<T> {
  url: string;
  render: (data: T | null, loading: boolean) => React.ReactNode;
}

function DataFetcher<T>({ url, render }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    api.get(url)
      .then(response => {
        setData(response.data);
        setLoading(false);
      });
  }, [url]);
  
  return <>{render(data, loading)}</>;
}

// Uso
<DataFetcher<IOrganization[]>
  url="/api/v1/organizations/"
  render={(organizations, loading) => {
    if (loading) return <LoadingSpinner />;
    return <OrganizationList organizations={organizations} />;
  }}
/>
```

## 🔌 Patrones de Integración

### 1. API Client Singleton

**Propósito**: Cliente API centralizado.

```typescript
// services/api.client.ts
class ApiClient {
  private static instance: ApiClient;
  private axiosInstance: AxiosInstance;
  
  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 10000,
    });
    
    this.setupInterceptors();
  }
  
  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }
  
  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      config => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );
    
    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Try refresh token
          await this.refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }
  
  get(url: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.get(url, config);
  }
  
  post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.axiosInstance.post(url, data, config);
  }
}

export const api = ApiClient.getInstance();
```

### 2. Error Boundary Pattern

**Propósito**: Manejo global de errores.

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      errorReportingService.log(error, errorInfo);
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}
```

## ❌ Anti-Patrones a Evitar

### 1. God Component (Evitar)

```typescript
// ❌ MAL - Componente hace demasiado
const OrganizationPage = () => {
  // Estado para todo
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [filters, setFilters] = useState({});
  // ... más estado
  
  // Lógica de negocio mezclada
  const validateNIT = (nit) => { /* ... */ };
  const calculateStats = () => { /* ... */ };
  const sendEmail = () => { /* ... */ };
  
  // Render gigante
  return (
    <div>
      {/* 500 líneas de JSX */}
    </div>
  );
};
```

### 2. Prop Drilling (Evitar)

```typescript
// ❌ MAL - Pasando props por múltiples niveles
<App user={user}>
  <Dashboard user={user}>
    <OrganizationList user={user}>
      <OrganizationCard user={user}>
        <ActionButtons user={user} />
      </OrganizationCard>
    </OrganizationList>
  </Dashboard>
</App>

// ✅ BIEN - Usar Context o Estado Global
const UserContext = React.createContext();

<UserContext.Provider value={user}>
  <App>
    <Dashboard>
      <OrganizationList />
    </Dashboard>
  </App>
</UserContext.Provider>
```

### 3. Mutación Directa del Estado (Evitar)

```typescript
// ❌ MAL - Mutación directa
const handleAddItem = (item) => {
  state.items.push(item); // Mutación!
  setState(state);
};

// ✅ BIEN - Crear nuevo estado
const handleAddItem = (item) => {
  setState(prevState => ({
    ...prevState,
    items: [...prevState.items, item]
  }));
};
```

### 4. useEffect Sin Dependencias (Evitar)

```typescript
// ❌ MAL - Effect sin dependencias correctas
useEffect(() => {
  fetchData(userId);
}, []); // userId no está en dependencias!

// ✅ BIEN - Dependencias correctas
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

---

💡 **Nota**: Estos patrones deben aplicarse cuando aporten valor real, no por obligación. La simplicidad es también un patrón valioso.