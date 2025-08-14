/**
 * TemplateSelector Component - Professional Template Selection
 *
 * Features:
 * - Dropdown with available templates for sector
 * - Preview modal with template details
 * - Confirmation dialog before applying
 * - Indicator of fields that will be overwritten
 * - Integration with organization wizard
 */

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { apiClient } from "../../api/endpoints";

interface SectorTemplate {
  id: string;
  sector: string;
  sector_display: string;
  nombre_template: string;
  descripcion: string;
  version: string;
  aplicaciones_exitosas: number;
  fecha_ultima_aplicacion: string | null;
  total_elementos: number;
  is_active: boolean;
  data_json?: {
    procesos: any[];
    indicadores: any[];
    documentos: any[];
  };
}

interface TemplateSelectorProps {
  sector: string;
  onTemplateSelect?: (template: SectorTemplate | null) => void;
  onTemplateApply?: (template: SectorTemplate) => void;
  className?: string;
  disabled?: boolean;
  currentData?: any; // Current organization data to show overwrite warnings
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  sector,
  onTemplateSelect,
  onTemplateApply,
  className = "",
  disabled = false,
  currentData,
}) => {
  const [templates, setTemplates] = useState<SectorTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<SectorTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<SectorTemplate | null>(
    null,
  );

  /**
   * Load templates for the selected sector
   */
  const loadTemplates = async () => {
    if (!sector) return;

    setIsLoadingTemplates(true);
    try {
      const response = await apiClient.get(
        `/api/v1/sector-templates/by-sector/?sector=${sector}`,
      );
      setTemplates(response.data.templates || []);
    } catch (error: any) {
      console.error("[TemplateSelector] Error loading templates:", error);
      toast.error("Error al cargar las plantillas disponibles");
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  /**
   * Handle template selection from dropdown
   */
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId) || null;
    setSelectedTemplate(template);

    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  /**
   * Show template preview modal
   */
  const handlePreviewTemplate = async (template: SectorTemplate) => {
    setIsLoading(true);
    try {
      // Load full template details
      const response = await apiClient.get(
        `/api/v1/sector-templates/${template.id}/`,
      );
      setPreviewTemplate(response.data);
      setShowPreviewModal(true);
    } catch (error: any) {
      console.error(
        "[TemplateSelector] Error loading template details:",
        error,
      );
      toast.error("Error al cargar los detalles de la plantilla");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle template application
   */
  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    setShowConfirmModal(true);
  };

  /**
   * Confirm template application
   */
  const confirmApplyTemplate = async () => {
    if (!selectedTemplate || !currentData?.organizationId) {
      toast.error("No se puede aplicar la plantilla en este momento");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post(
        `/api/v1/sector-templates/${selectedTemplate.id}/apply/`,
        {
          organization_id: currentData.organizationId,
        },
      );

      toast.success("Plantilla aplicada exitosamente");
      setShowConfirmModal(false);

      if (onTemplateApply) {
        onTemplateApply(selectedTemplate);
      }
    } catch (error: any) {
      console.error("[TemplateSelector] Error applying template:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Error al aplicar la plantilla";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get fields that will be overwritten
   */
  const getOverwriteWarnings = (): string[] => {
    if (!previewTemplate || !currentData) return [];

    const warnings: string[] = [];
    const templateData = previewTemplate.data_json;

    if (templateData?.procesos?.length > 0) {
      warnings.push(`${templateData.procesos.length} procesos`);
    }
    if (templateData?.indicadores?.length > 0) {
      warnings.push(`${templateData.indicadores.length} indicadores`);
    }
    if (templateData?.documentos?.length > 0) {
      warnings.push(`${templateData.documentos.length} documentos`);
    }

    return warnings;
  };

  /**
   * Load templates when sector changes
   */
  useEffect(() => {
    loadTemplates();
  }, [sector]);

  return (
    <div className={`template-selector ${className}`}>
      {/* Template Selection Dropdown */}
      <div className="mb-3">
        <label className="form-label">
          <i className="ri-file-list-3-line me-2"></i>
          Plantillas Disponibles para {sector}
        </label>

        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={selectedTemplate?.id || ""}
            onChange={(e) => handleTemplateChange(e.target.value)}
            disabled={disabled || isLoadingTemplates}
          >
            <option value="">
              {isLoadingTemplates
                ? "Cargando plantillas..."
                : "Seleccione una plantilla"}
            </option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.nombre_template} - {template.total_elementos}{" "}
                elementos
                {template.aplicaciones_exitosas > 0 &&
                  ` (${template.aplicaciones_exitosas} usos)`}
              </option>
            ))}
          </select>

          {selectedTemplate && (
            <>
              <button
                type="button"
                className="btn btn-outline-info btn-sm"
                onClick={() => handlePreviewTemplate(selectedTemplate)}
                disabled={isLoading}
                title="Ver preview de la plantilla"
              >
                <i className="ri-eye-line"></i>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleApplyTemplate}
                disabled={isLoading || !currentData?.organizationId}
                title="Aplicar plantilla"
              >
                <i className="ri-download-line me-1"></i>
                Aplicar
              </button>
            </>
          )}
        </div>

        {templates.length === 0 && !isLoadingTemplates && sector && (
          <div className="form-text text-muted">
            <i className="ri-information-line me-1"></i>
            No hay plantillas disponibles para el sector {sector}
          </div>
        )}
      </div>

      {/* Selected Template Info */}
      {selectedTemplate && (
        <div className="alert alert-info">
          <div className="d-flex align-items-start">
            <i className="ri-information-line me-2 mt-1"></i>
            <div>
              <strong>{selectedTemplate.nombre_template}</strong>
              <p className="mb-2 mt-1">{selectedTemplate.descripcion}</p>
              <div className="row g-2">
                <div className="col-auto">
                  <span className="badge bg-primary">
                    {selectedTemplate.total_elementos} elementos
                  </span>
                </div>
                <div className="col-auto">
                  <span className="badge bg-success">
                    v{selectedTemplate.version}
                  </span>
                </div>
                {selectedTemplate.aplicaciones_exitosas > 0 && (
                  <div className="col-auto">
                    <span className="badge bg-info">
                      {selectedTemplate.aplicaciones_exitosas} aplicaciones
                      exitosas
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-eye-line me-2"></i>
                  Preview: {previewTemplate.nombre_template}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPreviewModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <div className="mb-4">
                  <h6 className="text-muted">Información General</h6>
                  <p>{previewTemplate.descripcion}</p>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <strong>Sector:</strong> {previewTemplate.sector_display}
                    </div>
                    <div className="col-md-6">
                      <strong>Versión:</strong> {previewTemplate.version}
                    </div>
                    <div className="col-md-6">
                      <strong>Total Elementos:</strong>{" "}
                      {previewTemplate.total_elementos}
                    </div>
                    <div className="col-md-6">
                      <strong>Aplicaciones Exitosas:</strong>{" "}
                      {previewTemplate.aplicaciones_exitosas}
                    </div>
                  </div>
                </div>

                {/* Template Content Preview */}
                {previewTemplate.data_json && (
                  <>
                    {/* Procesos */}
                    {previewTemplate.data_json.procesos?.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-primary">
                          <i className="ri-file-list-3-line me-2"></i>
                          Procesos ({previewTemplate.data_json.procesos.length})
                        </h6>
                        <div className="list-group list-group-flush">
                          {previewTemplate.data_json.procesos
                            .slice(0, 5)
                            .map((proceso: any, index: number) => (
                              <div key={index} className="list-group-item px-0">
                                <div className="d-flex align-items-center">
                                  <i className="ri-file-text-line me-2 text-muted"></i>
                                  <div>
                                    <strong>
                                      {proceso.nombre || `Proceso ${index + 1}`}
                                    </strong>
                                    {proceso.descripcion && (
                                      <p className="mb-0 text-muted small">
                                        {proceso.descripcion}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          {previewTemplate.data_json.procesos.length > 5 && (
                            <div className="list-group-item px-0 text-muted">
                              <i className="ri-more-line me-1"></i>Y{" "}
                              {previewTemplate.data_json.procesos.length - 5}{" "}
                              procesos más...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Indicadores */}
                    {previewTemplate.data_json.indicadores?.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-success">
                          <i className="ri-line-chart-line me-2"></i>
                          Indicadores (
                          {previewTemplate.data_json.indicadores.length})
                        </h6>
                        <div className="list-group list-group-flush">
                          {previewTemplate.data_json.indicadores
                            .slice(0, 5)
                            .map((indicador: any, index: number) => (
                              <div key={index} className="list-group-item px-0">
                                <div className="d-flex align-items-center">
                                  <i className="ri-bar-chart-line me-2 text-muted"></i>
                                  <div>
                                    <strong>
                                      {indicador.nombre ||
                                        `Indicador ${index + 1}`}
                                    </strong>
                                    {indicador.descripcion && (
                                      <p className="mb-0 text-muted small">
                                        {indicador.descripcion}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          {previewTemplate.data_json.indicadores.length > 5 && (
                            <div className="list-group-item px-0 text-muted">
                              <i className="ri-more-line me-1"></i>Y{" "}
                              {previewTemplate.data_json.indicadores.length - 5}{" "}
                              indicadores más...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Documentos */}
                    {previewTemplate.data_json.documentos?.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-warning">
                          <i className="ri-file-list-line me-2"></i>
                          Documentos (
                          {previewTemplate.data_json.documentos.length})
                        </h6>
                        <div className="list-group list-group-flush">
                          {previewTemplate.data_json.documentos
                            .slice(0, 5)
                            .map((documento: any, index: number) => (
                              <div key={index} className="list-group-item px-0">
                                <div className="d-flex align-items-center">
                                  <i className="ri-file-line me-2 text-muted"></i>
                                  <div>
                                    <strong>
                                      {documento.nombre ||
                                        `Documento ${index + 1}`}
                                    </strong>
                                    {documento.tipo && (
                                      <span className="badge bg-light text-dark ms-2">
                                        {documento.tipo}
                                      </span>
                                    )}
                                    {documento.descripcion && (
                                      <p className="mb-0 text-muted small">
                                        {documento.descripcion}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          {previewTemplate.data_json.documentos.length > 5 && (
                            <div className="list-group-item px-0 text-muted">
                              <i className="ri-more-line me-1"></i>Y{" "}
                              {previewTemplate.data_json.documentos.length - 5}{" "}
                              documentos más...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Overwrite Warning */}
                {getOverwriteWarnings().length > 0 && (
                  <div className="alert alert-warning">
                    <h6 className="alert-heading">
                      <i className="ri-alert-line me-2"></i>
                      Campos que se sobrescribirán
                    </h6>
                    <p className="mb-0">
                      Al aplicar esta plantilla se agregarán:{" "}
                      {getOverwriteWarnings().join(", ")}
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleApplyTemplate();
                  }}
                  disabled={!currentData?.organizationId}
                >
                  <i className="ri-download-line me-1"></i>
                  Aplicar Plantilla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedTemplate && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="ri-question-line me-2"></i>
                  Confirmar Aplicación de Plantilla
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <div className="text-center mb-3">
                  <div className="avatar-md mx-auto mb-3">
                    <div className="avatar-title bg-warning bg-soft text-warning rounded-circle">
                      <i className="ri-alert-line display-6"></i>
                    </div>
                  </div>

                  <h6>¿Está seguro de aplicar esta plantilla?</h6>
                  <p className="text-muted mb-3">
                    Se aplicará la plantilla{" "}
                    <strong>{selectedTemplate.nombre_template}</strong>a su
                    organización.
                  </p>
                </div>

                <div className="alert alert-info">
                  <h6 className="alert-heading">Lo que sucederá:</h6>
                  <ul className="mb-0">
                    <li>
                      Se agregarán {selectedTemplate.total_elementos} elementos
                      predefinidos
                    </li>
                    <li>La configuración actual se mantendrá intacta</li>
                    <li>Podrá modificar o eliminar elementos posteriormente</li>
                    <li>Esta acción no se puede deshacer automáticamente</li>
                  </ul>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmApplyTemplate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Aplicando...</span>
                      </div>
                      Aplicando...
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line me-1"></i>
                      Sí, Aplicar Plantilla
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
