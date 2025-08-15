# 📁 Estructura Escalable de Uploads - ZentraQMS

## 🎯 Visión General

ZentraQMS implementa una estructura escalable y organizada para el manejo de archivos subidos por usuarios, diseñada para:

- **Escalabilidad**: Soporta millones de archivos sin degradación de rendimiento
- **Organización**: Estructura jerárquica clara y predecible  
- **Seguridad**: Validaciones robustas y permisos adecuados
- **Mantenimiento**: Limpieza automática y herramientas de gestión
- **Flexibilidad**: Fácil migración a almacenamiento en la nube

## 📂 Estructura de Directorios

```
media/
├── organizations/                          # Archivos por organización
│   ├── {org_id}/                          # ID único de organización
│   │   ├── {year}/                        # Año (2024, 2025, etc.)
│   │   │   ├── {month}/                   # Mes (01, 02, ..., 12)
│   │   │   │   ├── logos/                 # Logos de la organización
│   │   │   │   ├── documents/             # Documentos generales
│   │   │   │   ├── certificates/          # Certificados y docs legales
│   │   │   │   ├── audits/               # Documentos de auditoría
│   │   │   │   ├── evidence/             # Evidencias de procesos
│   │   │   │   ├── reports/              # Reportes generados
│   │   │   │   └── imports/              # Archivos de importación
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── users/                                 # Archivos por usuario (perfiles, etc.)
│   ├── {user_id}/
│   │   ├── {year}/{month}/
│   │   │   ├── avatars/
│   │   │   ├── documents/
│   │   │   └── temp/
│   │   └── ...
│   └── ...
└── temp/                                  # Archivos temporales del sistema
    ├── uploads/                          # Uploads en proceso
    ├── exports/                          # Exportaciones temporales
    └── cache/                            # Cache de archivos
```

## 🏗️ Componentes del Sistema

### 1. Upload Handlers (`apps/common/utils/upload_handlers.py`)

Funciones para generar rutas dinámicas y seguras:

```python
# Ejemplos de uso
logo_path = get_logo_upload_path(organization, "logo.png")
# → "organizations/123/2024/03/logos/company-logo_20240315_143022_a1b2c3d4.png"

doc_path = get_document_upload_path(organization, "manual.pdf")  
# → "organizations/123/2024/03/documents/manual-usuario_20240315_143022_e5f6g7h8.pdf"
```

**Características:**
- Nombres de archivo seguros con timestamp y UUID
- Organización automática por fecha
- Paths únicos para evitar colisiones
- Soporte para múltiples tipos de archivos

### 2. Validadores (`apps/common/validators/file_validators.py`)

Sistema robusto de validación por tipo de archivo:

```python
# Validadores especializados
validate_logo          # Imágenes de logos (2MB, 1024x1024)
validate_document      # Documentos generales (25MB, PDF/Office)
validate_certificate   # Certificados (15MB, PDF/imágenes)
validate_audit_document # Auditorías (50MB, incluye archives)
validate_process_evidence # Evidencias (30MB, multimedia)
validate_import_data   # Importaciones (10MB, CSV/Excel)
```

**Validaciones incluidas:**
- Tamaño de archivo por tipo
- Extensiones permitidas
- Tipos MIME verificados
- Dimensiones de imagen
- Contenido de archivo válido

### 3. Modelos de Documentos (`apps/common/models/document_models.py`)

Modelos especializados para diferentes tipos de documentos:

```python
# Modelos disponibles
OrganizationDocument   # Políticas, procedimientos, manuales
Certificate           # Certificados y documentos legales  
AuditDocument         # Documentos de auditoría
ProcessEvidence       # Evidencias de procesos
SystemReport          # Reportes del sistema
ImportFile            # Archivos de importación temporal
```

**Metadatos comunes:**
- Título y descripción
- Categoría y estado
- Versión y fechas de vigencia
- Tags para búsqueda
- Trazabilidad completa

## ⚙️ Configuración

### Configuración Base (`config/settings/base.py`)

```python
# Límites por tipo de archivo
UPLOAD_LIMITS = {
    'image': {
        'max_size_mb': 5,
        'allowed_extensions': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        'max_width': 2048,
        'max_height': 2048,
    },
    'document': {
        'max_size_mb': 25,
        'allowed_extensions': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    },
    # ... más configuraciones
}

# Limpieza automática
AUTO_CLEANUP_ENABLED = True
AUTO_CLEANUP_TEMP_FILES_DAYS = 7
AUTO_CLEANUP_IMPORT_FILES_DAYS = 30
```

### Configuración de Producción

```python
# Almacenamiento en la nube (AWS S3)
USE_S3_STORAGE = True
AWS_STORAGE_BUCKET_NAME = 'zentraqms-production-files'

# Límites más restrictivos
UPLOAD_LIMITS['image']['max_size_mb'] = 3
UPLOAD_LIMITS['document']['max_size_mb'] = 20

# Monitoreo de almacenamiento
STORAGE_MONITORING = {
    'enabled': True,
    'alert_threshold_gb': 80,
    'cleanup_threshold_gb': 100
}
```

## 🛠️ Herramientas de Gestión

### Comando de Limpieza

```bash
# Limpieza básica de archivos temporales
python manage.py cleanup_uploads --days=30

# Limpieza específica por organización  
python manage.py cleanup_uploads --organization=123 --subfolder=temp

# Simulación (no elimina archivos)
python manage.py cleanup_uploads --dry-run --show-stats

# Limpieza agresiva para liberar espacio
python manage.py cleanup_uploads --days=7 --subfolder=imports
```

### Estadísticas de Almacenamiento

```python
from apps.common.utils.upload_handlers import get_storage_stats

# Obtener estadísticas
stats = get_storage_stats(organization_id="123")
print(f"Espacio total: {stats['total_size_mb']} MB")
print(f"Archivos: {stats['file_count']}")

# Por carpeta
for folder, data in stats['folders'].items():
    print(f"{folder}: {data['size_mb']} MB ({data['file_count']} archivos)")
```

## 🔒 Seguridad

### Validaciones de Seguridad

1. **Tipos MIME verificados**: No solo extensión, también contenido real
2. **Nombres seguros**: Slugified + timestamp + UUID único
3. **Permisos de archivo**: 644 para archivos, 755 para directorios
4. **Límites estrictos**: Por tipo y contexto de uso
5. **Archivos privados**: No accesibles directamente via URL

### Ejemplo de Uso Seguro

```python
# En modelos
class Organization(models.Model):
    logo = models.ImageField(
        upload_to=get_logo_upload_path,
        validators=[validate_logo],
        help_text="Logo oficial. Máximo 2MB, formatos: JPG, PNG, WebP"
    )

# En vistas
@api_view(['POST'])
def upload_document(request):
    file = request.FILES.get('document')
    
    # Validación automática por el modelo
    document = OrganizationDocument.objects.create(
        title=request.data.get('title'),
        file=file,
        organization=request.user.organization
    )
    
    return Response({'id': document.id, 'url': document.file.url})
```

## 📊 Ejemplos de Rutas Generadas

```python
# Logo de organización
"organizations/123/2024/03/logos/acme-corp_20240315_143022_a1b2c3d4.png"

# Documento de política
"organizations/123/2024/03/documents/politica-calidad_20240315_143500_e5f6g7h8.pdf"

# Certificado ISO
"organizations/123/2024/03/certificates/iso9001-cert_20240315_144000_i9j0k1l2.pdf"

# Evidencia de auditoría
"organizations/123/2024/03/audits/auditoria-interna_20240315_145000_m3n4o5p6.zip"

# Evidencia de proceso
"organizations/123/2024/03/evidence/proceso-compras_20240315_150000_q7r8s9t0.jpg"

# Archivo de importación
"organizations/123/2024/03/imports/empleados_20240315_151000_u1v2w3x4.xlsx"
```

## 🚀 Escalabilidad

### Distribución por Fecha
- **Ventaja**: Evita directorios con miles de archivos
- **Búsqueda**: Rápida por año/mes
- **Backup**: Incremental por período

### Migración a la Nube
- **AWS S3**: Configuración lista para producción
- **CDN**: Distribución global de archivos
- **Backup**: Redundancia automática

### Optimizaciones
- **Lazy loading**: Carga bajo demanda
- **Compresión**: Automática para imágenes
- **Cache**: Headers apropiados para navegadores

## 📝 Mejores Prácticas

### Para Desarrolladores

```python
# ✅ Usar los handlers predefinidos
upload_to=get_document_upload_path

# ✅ Usar validadores apropiados  
validators=[validate_document]

# ✅ Incluir help_text descriptivo
help_text="Documento PDF. Máximo 25MB."

# ❌ Evitar rutas hardcodeadas
upload_to="documents/"  # No hacer esto

# ❌ Evitar validaciones manuales
# Usar los validadores predefinidos
```

### Para Administradores

1. **Monitoreo regular** de espacio en disco
2. **Backups periódicos** de la carpeta media
3. **Limpieza automática** configurada correctamente
4. **Alertas** cuando se alcancen umbrales de almacenamiento
5. **Migración a S3** para entornos de alta demanda

## 🔄 Mantenimiento

### Tareas Automáticas (via Celery/Cron)

```python
# Limpieza diaria de archivos temporales
@periodic_task(run_every=crontab(hour=2, minute=0))
def cleanup_temp_files():
    call_command('cleanup_uploads', '--subfolder=temp', '--days=7')

# Reporte semanal de almacenamiento  
@periodic_task(run_every=crontab(day_of_week=1, hour=9, minute=0))
def storage_report():
    # Generar reporte de uso de almacenamiento
    pass
```

### Monitoreo

1. **Alertas de espacio**: Cuando se supere el 80% de capacidad
2. **Reportes semanales**: Uso por organización
3. **Archivos huérfanos**: Detección y limpieza
4. **Performance**: Tiempo de upload por tipo de archivo

---

Esta estructura proporciona una base sólida y escalable para el manejo de uploads en ZentraQMS, con herramientas completas para administración, seguridad y mantenimiento.