/**
 * Step 3: Sector Template Selection Component
 * 
 * Handles sector template selection and preview
 */
import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../../contexts/AuthContext';
// Using standard HTML form elements with Bootstrap classes

// Types
interface SectorTemplate {
  id: string;
  sector: string;
  sector_display: string;
  nombre_template: string;
  descripcion: string;
  version: string;
  aplicaciones_exitosas: number;
  fecha_ultima_aplicacion?: string;
  elementos_template?: {
    total_procesos: number;
    total_indicadores: number;
    total_documentos: number;
  };
  data_json?: any;
  is_active: boolean;
}

interface Step3Props {
  selectedSector?: string;
  selectedTemplate?: string;
  onChange: (data: { selectedTemplate?: string; applyTemplate?: boolean }) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const Step3SectorTemplate: React.FC<Step3Props> = ({
  selectedSector,
  selectedTemplate,
  onChange,
  onValidationChange
}) => {
  const { getAccessToken } = useAuthContext();
  const [templates, setTemplates] = useState<SectorTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [previewModal, setPreviewModal] = useState<boolean>(false);
  const [previewTemplate, setPreviewTemplate] = useState<SectorTemplate | null>(null);
  const [applyTemplate, setApplyTemplate] = useState<boolean>(false);

  // Fetch templates for selected sector
  const fetchTemplates = async (sector: string) => {
    if (!sector) return;

    setLoading(true);
    setError('');

    try {
      const token = getAccessToken();
      const response = await fetch(`/api/organization/sector-templates/by-sector/?sector=${sector}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar plantillas del sector');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
      
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // Load templates when sector changes
  useEffect(() => {
    if (selectedSector) {
      fetchTemplates(selectedSector);
    } else {
      setTemplates([]);
    }
  }, [selectedSector]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    onChange({
      selectedTemplate: templateId,
      applyTemplate: applyTemplate
    });
  };

  // Handle template application toggle
  const handleApplyTemplateChange = (apply: boolean) => {
    setApplyTemplate(apply);
    onChange({
      selectedTemplate,
      applyTemplate: apply
    });
  };

  // Show template preview
  const showTemplatePreview = (template: SectorTemplate) => {
    setPreviewTemplate(template);
    setPreviewModal(true);
  };

  // Validate form
  const isFormValid = (): boolean => {
    // For now, template selection is optional
    // User can choose to start with empty organization or apply a template
    return true;
  };

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFormValid());
    }
  }, [selectedTemplate, applyTemplate, onValidationChange]);

  // Render template card
  const renderTemplateCard = (template: SectorTemplate) => (
    <div className="col-lg-6 mb-3" key={template.id}>
      <div className={`card template-card h-100 ${selectedTemplate === template.id ? 'border-primary' : ''}`}>
        <div className="card-header d-flex justify-content-between align-items-start">
          <div>
            <h6 className="card-title mb-1">{template.nombre_template}</h6>
            <div className="d-flex gap-2 mb-2">
              <span className="badge rounded-pill bg-info">v{template.version}</span>
              <span className="badge rounded-pill bg-success">
                {template.aplicaciones_exitosas} aplicaciones
              </span>
            </div>
          </div>
          <div className="form-check">
            <input
              type="radio"
              className="form-check-input"
              name="selectedTemplate"
              id={`template-${template.id}`}
              checked={selectedTemplate === template.id}
              onChange={() => handleTemplateSelect(template.id)}
            />
          </div>
        </div>
        
        <div className="card-body pt-0">
          <p className="text-muted mb-3">{template.descripcion}</p>
          
          {/* Template Statistics */}
          {template.elementos_template && (
            <div className="template-stats mb-3">
              <h6 className="fs-14 mb-2">Contenido incluido:</h6>
              <div className="row g-2">
                <div className="col-4">
                  <div className="text-center p-2 bg-light rounded">
                    <div className="fw-bold text-primary">{template.elementos_template.total_procesos}</div>
                    <small className="text-muted">Procesos</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center p-2 bg-light rounded">
                    <div className="fw-bold text-success">{template.elementos_template.total_indicadores}</div>
                    <small className="text-muted">Indicadores</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center p-2 bg-light rounded">
                    <div className="fw-bold text-warning">{template.elementos_template.total_documentos}</div>
                    <small className="text-muted">Documentos</small>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Last Application Date */}
          {template.fecha_ultima_aplicacion && (
            <small className="text-muted">
              <i className="ri-time-line me-1"></i>
              Última aplicación: {new Date(template.fecha_ultima_aplicacion).toLocaleDateString()}
            </small>
          )}
          
          {/* Preview Button */}
          <div className="mt-3">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm w-100"
              onClick={() => showTemplatePreview(template)}
            >
              <i className="ri-eye-line me-1"></i>
              Vista Previa
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="sector-template-selection">
      <div className="row">
        <div className="col-lg-12">
          {!selectedSector ? (
            <div className="alert alert-warning">
              <i className="ri-information-line me-2"></i>
              <strong>Sector no seleccionado:</strong> Debe completar los datos de organización en el paso anterior para ver las plantillas disponibles.
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-4">
                <h6 className="fs-15 mb-2">
                  <i className="ri-file-list-line me-2"></i>
                  Plantillas disponibles para {selectedSector}
                </h6>
                <p className="text-muted mb-0">
                  Seleccione una plantilla predefinida para acelerar la configuración de su sistema de gestión de calidad, 
                  o continúe sin plantilla para configurar manualmente.
                </p>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Cargando plantillas...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="alert alert-danger">
                  <i className="ri-error-warning-line me-2"></i>
                  {error}
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 ms-2"
                    onClick={() => fetchTemplates(selectedSector)}
                  >
                    Intentar nuevamente
                  </button>
                </div>
              )}

              {/* Templates List */}
              {!loading && !error && (
                <>
                  {templates.length > 0 ? (
                    <>
                      <div className="row">
                        {/* No Template Option */}
                        <div className="col-lg-6 mb-3">
                          <div className={`card template-card h-100 ${!selectedTemplate ? 'border-primary' : ''}`}>
                            <div className="card-header">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="card-title mb-1">Sin Plantilla</h6>
                                  <span className="badge rounded-pill bg-secondary">Personalizado</span>
                                </div>
                                <div className="form-check">
                                  <input
                                    type="radio"
                                    className="form-check-input"
                                    name="selectedTemplate"
                                    id="template-none"
                                    checked={!selectedTemplate}
                                    onChange={() => handleTemplateSelect('')}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="card-body pt-0">
                              <p className="text-muted mb-3">
                                Comenzar con una organización vacía y configurar manualmente todos los procesos, 
                                indicadores y documentos según sus necesidades específicas.
                              </p>
                              <div className="text-center p-3 bg-light rounded">
                                <i className="ri-settings-line display-6 text-muted"></i>
                                <p className="mb-0 mt-2 text-muted">Configuración manual</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Template Options */}
                        {templates.map(renderTemplateCard)}
                      </div>

                      {/* Apply Template Option */}
                      {selectedTemplate && (
                        <div className="row">
                          <div className="col-lg-12">
                            <div className="card border-success">
                              <div className="card-body">
                                <div className="form-check form-switch mb-0">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="applyTemplate"
                                    checked={applyTemplate}
                                    onChange={(e) => handleApplyTemplateChange(e.target.checked)}
                                  />
                                  <label className="form-check-label fw-medium" htmlFor="applyTemplate">
                                    Aplicar plantilla automáticamente
                                  </label>
                                </div>
                                <p className="text-muted mt-2 mb-0">
                                  {applyTemplate 
                                    ? 'La plantilla se aplicará inmediatamente después de completar la configuración inicial.'
                                    : 'Podrá aplicar la plantilla posteriormente desde el panel de administración.'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="alert alert-info">
                      <i className="ri-information-line me-2"></i>
                      <strong>No hay plantillas disponibles</strong> para el sector {selectedSector}. 
                      Puede continuar sin plantilla y configurar manualmente su sistema.
                      
                      <div className="mt-3">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleTemplateSelect('')}
                        >
                          Continuar sin Plantilla
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Info Alert */}
              <div className="alert alert-light border-primary d-flex align-items-start mt-4">
                <i className="ri-lightbulb-line text-primary me-2 mt-1"></i>
                <div>
                  <strong>Recomendación:</strong> Si es su primera vez configurando un sistema de gestión de calidad, 
                  recomendamos seleccionar una plantilla apropiada para su sector. Esto le proporcionará una base sólida 
                  que podrá personalizar posteriormente según sus necesidades específicas.
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Template Preview Modal */}
      <div className={`modal fade ${previewModal ? 'show' : ''}`} style={{ display: previewModal ? 'block' : 'none' }} tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Vista Previa: {previewTemplate?.nombre_template}</h5>
              <button type="button" className="btn-close" onClick={() => setPreviewModal(false)}></button>
            </div>
            <div className="modal-body">
          {previewTemplate && (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Sector:</strong> {previewTemplate.sector_display}
                </div>
                <div className="col-md-6">
                  <strong>Versión:</strong> {previewTemplate.version}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Aplicaciones exitosas:</strong> {previewTemplate.aplicaciones_exitosas}
                </div>
                <div className="col-md-6">
                  <strong>Estado:</strong>{' '}
                  <span className={`badge ${previewTemplate.is_active ? 'bg-success' : 'bg-secondary'}`}>
                    {previewTemplate.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <strong>Descripción:</strong>
                <p className="text-muted mt-1">{previewTemplate.descripcion}</p>
              </div>

              {previewTemplate.elementos_template && (
                <div className="mb-3">
                  <strong>Contenido incluido:</strong>
                  <div className="row mt-2">
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                        <div className="h4 text-primary mb-1">{previewTemplate.elementos_template.total_procesos}</div>
                        <div className="text-muted">Procesos</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                        <div className="h4 text-success mb-1">{previewTemplate.elementos_template.total_indicadores}</div>
                        <div className="text-muted">Indicadores</div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                        <div className="h4 text-warning mb-1">{previewTemplate.elementos_template.total_documentos}</div>
                        <div className="text-muted">Documentos</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {previewTemplate.fecha_ultima_aplicacion && (
                <div>
                  <strong>Última aplicación:</strong>{' '}
                  {new Date(previewTemplate.fecha_ultima_aplicacion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
            </div>
          )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (previewTemplate) {
                    handleTemplateSelect(previewTemplate.id);
                    setPreviewModal(false);
                  }
                }}
                disabled={selectedTemplate === previewTemplate?.id}
              >
                {selectedTemplate === previewTemplate?.id ? 'Ya Seleccionada' : 'Seleccionar Plantilla'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setPreviewModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      {previewModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default Step3SectorTemplate;