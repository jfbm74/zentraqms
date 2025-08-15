# 🏥 Módulo de Organizaciones - ZentraQMS

## 📋 Índice
1. [Resumen](#resumen)
2. [Arquitectura del Módulo](#arquitectura-del-módulo)
3. [Modelos de Datos](#modelos-de-datos)
4. [API Endpoints](#api-endpoints)
5. [Wizard de Configuración](#wizard-de-configuración)
6. [Componentes Frontend](#componentes-frontend)
7. [Flujos de Negocio](#flujos-de-negocio)
8. [Testing](#testing)

## 📊 Resumen

**Estado**: ✅ 95% Completado

El módulo de Organizaciones gestiona toda la información institucional de las entidades de salud, incluyendo:
- Datos básicos de la institución
- Ubicaciones y sedes
- Plantillas sectoriales
- Configuración inicial mediante wizard

## 🏗️ Arquitectura del Módulo

```
┌──────────────────────────────────────────────────┐
│                   Frontend                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │   Wizard   │  │  Org List  │  │ Org Detail ││
│  └────────────┘  └────────────┘  └────────────┘│
└──────────────────────┬───────────────────────────┘
                       │ API REST
┌──────────────────────┴───────────────────────────┐
│                    Backend                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │  ViewSets  │  │Serializers │  │ Validators ││
│  └────────────┘  └────────────┘  └────────────┘│
└──────────────────────┬───────────────────────────┘
                       │ ORM
┌──────────────────────┴───────────────────────────┐
│                   Database                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │Organization│  │  Location  │  │  Template  ││
│  └────────────┘  └────────────┘  └────────────┘│
└──────────────────────────────────────────────────┘
```

## 💾 Modelos de Datos

### Organization
```python
class Organization(FullBaseModel):
    """Entidad principal de salud"""
    
    # Información básica
    name = models.CharField(max_length=200)
    nit = models.CharField(max_length=20, unique=True)
    legal_name = models.CharField(max_length=200)
    
    # Clasificación
    organization_type = models.CharField(max_length=50, choices=ORG_TYPES)
    sector = models.CharField(max_length=50, choices=SECTORS)
    complexity_level = models.CharField(max_length=20, choices=COMPLEXITY)
    
    # Contacto
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    website = models.URLField(blank=True)
    
    # Ubicación principal
    main_location = models.OneToOneField('Location', null=True)
    
    # Configuración
    is_configured = models.BooleanField(default=False)
    configuration_completed_at = models.DateTimeField(null=True)
    
    # Relaciones
    owner = models.ForeignKey(User, on_delete=models.PROTECT)
    template = models.ForeignKey('SectorTemplate', null=True)
    
    class Meta:
        db_table = 'organization'
        indexes = [
            models.Index(fields=['nit']),
            models.Index(fields=['is_active']),
        ]
```

### Location
```python
class Location(FullBaseModel):
    """Ubicación física de la organización"""
    
    # Identificación
    name = models.CharField(max_length=200)
    location_type = models.CharField(max_length=50, choices=LOCATION_TYPES)
    is_main = models.BooleanField(default=False)
    
    # Dirección
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='Colombia')
    postal_code = models.CharField(max_length=20)
    
    # Georeferenciación
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True)
    
    # Contacto
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    
    # Relación
    organization = models.ForeignKey(Organization, related_name='locations')
    
    class Meta:
        db_table = 'location'
        unique_together = [['organization', 'is_main']]  # Solo una sede principal
```

### SectorTemplate
```python
class SectorTemplate(FullBaseModel):
    """Plantilla predefinida por sector de salud"""
    
    # Identificación
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    sector = models.CharField(max_length=50)
    
    # Contenido
    description = models.TextField()
    processes = models.JSONField(default=list)  # Procesos predefinidos
    documents = models.JSONField(default=list)  # Documentos requeridos
    indicators = models.JSONField(default=list) # KPIs sugeridos
    
    # Configuración
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'sector_template'
```

## 🔌 API Endpoints

### Endpoints Principales
```
# Organizaciones
GET    /api/v1/organizations/                 # Listar organizaciones
POST   /api/v1/organizations/                 # Crear organización
GET    /api/v1/organizations/{id}/           # Detalle de organización
PUT    /api/v1/organizations/{id}/           # Actualizar organización
DELETE /api/v1/organizations/{id}/           # Eliminar (soft) organización

# Acciones personalizadas
POST   /api/v1/organizations/check-nit/       # Verificar NIT único
GET    /api/v1/organizations/{id}/locations/ # Obtener sedes
POST   /api/v1/organizations/{id}/complete-setup/ # Completar configuración
GET    /api/v1/organizations/{id}/audit-trail/ # Historial de cambios

# Ubicaciones
GET    /api/v1/locations/                     # Listar ubicaciones
POST   /api/v1/locations/                     # Crear ubicación
PUT    /api/v1/locations/{id}/               # Actualizar ubicación
DELETE /api/v1/locations/{id}/               # Eliminar ubicación

# Plantillas
GET    /api/v1/sector-templates/             # Listar plantillas
GET    /api/v1/sector-templates/{id}/        # Detalle de plantilla
POST   /api/v1/sector-templates/{id}/apply/  # Aplicar plantilla
```

### Serializers
```python
class OrganizationSerializer(serializers.ModelSerializer):
    main_location = LocationSerializer(read_only=True)
    locations = LocationSerializer(many=True, read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = Organization
        fields = '__all__'
        read_only_fields = ['is_configured', 'configuration_completed_at']
    
    def validate_nit(self, value):
        """Validación de NIT colombiano"""
        # Limpiar formato
        nit = re.sub(r'[^0-9]', '', value)
        
        # Validar longitud
        if len(nit) != 9:
            raise ValidationError("NIT debe tener 9 dígitos")
        
        # Validar dígito de verificación
        if not self.validate_nit_dv(nit):
            raise ValidationError("Dígito de verificación inválido")
        
        return nit
```

## 🧙 Wizard de Configuración

### Estructura del Wizard
```typescript
interface WizardStep {
  id: number;
  name: string;
  component: React.FC;
  validation: () => boolean;
  canSkip: boolean;
}

const wizardSteps: WizardStep[] = [
  {
    id: 1,
    name: "Datos de la Organización",
    component: Step1OrganizationData,
    validation: validateOrganizationData,
    canSkip: false
  },
  {
    id: 2,
    name: "Ubicación Principal",
    component: Step2LocationData,
    validation: validateLocationData,
    canSkip: false
  },
  {
    id: 3,
    name: "Plantilla Sectorial",
    component: Step3SectorTemplate,
    validation: () => true,
    canSkip: true
  },
  {
    id: 4,
    name: "Sedes Adicionales",
    component: Step4BranchOffices,
    validation: () => true,
    canSkip: true
  },
  {
    id: 5,
    name: "Revisión y Confirmación",
    component: Step5Review,
    validation: validateAllData,
    canSkip: false
  }
];
```

### Estado del Wizard
```typescript
interface WizardState {
  currentStep: number;
  completedSteps: number[];
  data: {
    organization: Partial<IOrganization>;
    mainLocation: Partial<ILocation>;
    template: string | null;
    branches: ILocation[];
  };
  errors: Record<string, string>;
  isSubmitting: boolean;
}
```

## 🎨 Componentes Frontend

### Componentes Principales

#### OrganizationWizard
```typescript
const OrganizationWizard: React.FC = () => {
  const [wizardState, setWizardState] = useState<WizardState>(initialState);
  const { hasPermission } = usePermissions();
  
  // Navegación
  const handleNext = async () => {
    if (await validateCurrentStep()) {
      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        completedSteps: [...prev.completedSteps, prev.currentStep]
      }));
    }
  };
  
  // Guardado automático
  useAutoSave(wizardState.data, 30000); // Cada 30 segundos
  
  // Render del paso actual
  const CurrentStepComponent = wizardSteps[wizardState.currentStep - 1].component;
  
  return (
    <WizardContainer>
      <WizardProgress 
        steps={wizardSteps} 
        current={wizardState.currentStep}
        completed={wizardState.completedSteps}
      />
      <CurrentStepComponent 
        data={wizardState.data}
        onChange={handleDataChange}
        errors={wizardState.errors}
      />
      <WizardNavigation
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSave={handleSave}
        canGoBack={wizardState.currentStep > 1}
        canGoNext={!wizardState.isSubmitting}
      />
    </WizardContainer>
  );
};
```

#### OrganizationList
```typescript
const OrganizationList: React.FC = () => {
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [filters, setFilters] = useState<IFilters>({});
  const { hasPermission } = usePermissions();
  
  // Columnas de la tabla
  const columns = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'nit', label: 'NIT', sortable: true },
    { key: 'sector', label: 'Sector', sortable: true },
    { key: 'is_configured', label: 'Estado', render: renderStatus },
    { key: 'actions', label: 'Acciones', render: renderActions }
  ];
  
  return (
    <Card>
      <Card.Header>
        <h4>Organizaciones</h4>
        {hasPermission('organization.create') && (
          <Button onClick={handleCreate}>Nueva Organización</Button>
        )}
      </Card.Header>
      <Card.Body>
        <DataTable
          columns={columns}
          data={organizations}
          filters={filters}
          onFilter={setFilters}
          pagination
        />
      </Card.Body>
    </Card>
  );
};
```

## 🔄 Flujos de Negocio

### Flujo de Creación de Organización
```
1. Usuario inicia wizard
2. Completa datos básicos (Paso 1)
   - Validación de NIT único
   - Validación de campos requeridos
3. Define ubicación principal (Paso 2)
   - Geocodificación de dirección
   - Validación de formato
4. Selecciona plantilla sectorial (Paso 3)
   - Carga de plantillas según sector
   - Preview de contenido
5. Agrega sedes adicionales (Paso 4) [Opcional]
   - Múltiples ubicaciones
   - Designación de sede principal
6. Revisa y confirma (Paso 5)
   - Resumen de información
   - Confirmación final
7. Backend procesa creación
   - Creación transaccional
   - Aplicación de plantilla
   - Generación de estructura inicial
8. Redirección a dashboard
```

### Flujo de Actualización
```
1. Usuario accede a detalle de organización
2. Habilita modo edición
3. Modifica campos permitidos
4. Validación en tiempo real
5. Guardado con confirmación
6. Registro en audit trail
7. Notificación de éxito
```

## 🧪 Testing

### Tests Backend
```python
class OrganizationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='test',
            password='test123'
        )
        self.org_data = {
            'name': 'Hospital Test',
            'nit': '900123456',
            'organization_type': 'hospital',
            'sector': 'public'
        }
    
    def test_crear_organizacion_datos_validos(self):
        """Debe crear organización con datos válidos"""
        org = Organization.objects.create(**self.org_data, owner=self.user)
        self.assertEqual(org.name, 'Hospital Test')
        self.assertFalse(org.is_configured)
    
    def test_validacion_nit_unico(self):
        """NIT debe ser único en el sistema"""
        Organization.objects.create(**self.org_data, owner=self.user)
        with self.assertRaises(IntegrityError):
            Organization.objects.create(**self.org_data, owner=self.user)
    
    def test_soft_delete(self):
        """Eliminación debe ser soft delete"""
        org = Organization.objects.create(**self.org_data, owner=self.user)
        org.delete()
        self.assertIsNotNone(org.deleted_at)
        self.assertTrue(Organization.all_objects.filter(id=org.id).exists())
```

### Tests Frontend
```typescript
describe('OrganizationWizard', () => {
  it('debe navegar entre pasos correctamente', async () => {
    render(<OrganizationWizard />);
    
    // Paso 1 visible
    expect(screen.getByText('Datos de la Organización')).toBeInTheDocument();
    
    // Llenar datos mínimos
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Hospital Test' }
    });
    
    // Navegar al siguiente paso
    fireEvent.click(screen.getByText('Siguiente'));
    
    await waitFor(() => {
      expect(screen.getByText('Ubicación Principal')).toBeInTheDocument();
    });
  });
  
  it('debe validar NIT correctamente', async () => {
    render(<Step1OrganizationData />);
    
    const nitInput = screen.getByLabelText('NIT');
    
    // NIT inválido
    fireEvent.change(nitInput, { target: { value: '123' } });
    fireEvent.blur(nitInput);
    
    expect(await screen.findByText('NIT debe tener 9 dígitos')).toBeInTheDocument();
    
    // NIT válido
    fireEvent.change(nitInput, { target: { value: '900123456' } });
    fireEvent.blur(nitInput);
    
    await waitFor(() => {
      expect(screen.queryByText('NIT debe tener 9 dígitos')).not.toBeInTheDocument();
    });
  });
});
```

## 📈 Métricas y KPIs

### Métricas del Módulo
- Organizaciones creadas por mes
- Tasa de completitud del wizard
- Tiempo promedio de configuración
- Plantillas más utilizadas
- Sedes por organización

### Queries Optimizadas
```python
# Organizaciones con datos relacionados
Organization.objects.select_related(
    'owner',
    'template',
    'main_location'
).prefetch_related(
    'locations'
).filter(is_active=True)

# Estadísticas
from django.db.models import Count, Avg

stats = Organization.objects.aggregate(
    total=Count('id'),
    avg_locations=Avg('locations__count'),
    configured=Count('id', filter=Q(is_configured=True))
)
```

## 🔧 Configuración y Personalización

### Settings
```python
# settings.py
ORGANIZATION_SETTINGS = {
    'MAX_LOCATIONS_PER_ORG': 50,
    'REQUIRE_NIT_VALIDATION': True,
    'DEFAULT_COUNTRY': 'Colombia',
    'WIZARD_AUTO_SAVE_INTERVAL': 30000,  # ms
    'ALLOW_DUPLICATE_NAMES': False,
}
```

### Permisos Requeridos
```python
ORGANIZATION_PERMISSIONS = {
    'organization.view': 'Ver organizaciones',
    'organization.create': 'Crear organizaciones',
    'organization.edit': 'Editar organizaciones',
    'organization.delete': 'Eliminar organizaciones',
    'organization.configure': 'Configurar wizard',
    'location.manage': 'Gestionar ubicaciones',
    'template.apply': 'Aplicar plantillas',
}
```

---

💡 **Nota**: Este módulo es fundamental para el sistema ya que todas las demás entidades se relacionan con la organización.