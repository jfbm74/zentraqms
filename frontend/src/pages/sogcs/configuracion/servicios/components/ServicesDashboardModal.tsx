import React, { useState, useCallback } from 'react';
import { Modal, Button, Tabs, Tab, Row, Col } from 'react-bootstrap';
import ServicesDashboard from './ServicesDashboard';
import ServicesDashboardFilters from './ServicesDashboardFilters';
import { useServicioStore } from '../../../../../stores/servicioStore';
import type { ServicioFilters } from '../../../../../types/servicios';

// ====================================
// INTERFACES
// ====================================

interface ServicesDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'lg' | 'xl';
  fullscreen?: boolean;
}

// ====================================
// COMPONENT
// ====================================

const ServicesDashboardModal: React.FC<ServicesDashboardModalProps> = ({
  isOpen,
  onClose,
  title = 'Dashboard de Servicios de Salud',
  size = 'xl',
  fullscreen = false
}) => {
  const { fetchStatistics, loading } = useServicioStore();
  
  // State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [filters, setFilters] = useState<ServicioFilters>({});
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: ServicioFilters) => {
    setFilters(newFilters);
  }, []);

  // Apply filters
  const handleApplyFilters = useCallback(async () => {
    try {
      await fetchStatistics(filters);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }, [filters, fetchStatistics]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setFilters({});
    fetchStatistics({});
  }, [fetchStatistics]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Export functionality (placeholder)
  const handleExport = useCallback((format: 'pdf' | 'excel' | 'csv') => {
    // TODO: Implement export functionality
    console.log(`Exporting dashboard as ${format}`);
  }, []);

  return (
    <Modal 
      show={isOpen}
      onHide={onClose}
      size={size}
      fullscreen={isFullscreen}
      backdrop="static"
      keyboard={false}
      className="services-dashboard-modal"
    >
      <Modal.Header className="bg-light border-bottom">
        <Modal.Title className="d-flex align-items-center">
          <i className="ri-dashboard-3-line me-2 text-primary"></i>
          {title}
        </Modal.Title>
        <div className="d-flex gap-2 ms-auto me-3">
          {/* Fullscreen toggle */}
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            <i className={`ri-${isFullscreen ? 'fullscreen-exit' : 'fullscreen'}-line`}></i>
          </Button>
          
          {/* Export button */}
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleExport('pdf')}
            title="Exportar dashboard"
            disabled={loading}
          >
            <i className="ri-download-line"></i>
          </Button>
        </div>
        <Button 
          variant="outline-secondary"
          className="btn-close"
          onClick={onClose}
          aria-label="Close"
        />
      </Modal.Header>

      <Modal.Body className="p-0">
        <Tabs
          activeKey={activeTab}
          onSelect={(tab) => setActiveTab(tab || 'dashboard')}
          className="nav-tabs-custom border-bottom bg-light"
          fill
        >
          {/* Dashboard Tab */}
          <Tab 
            eventKey="dashboard" 
            title={
              <span>
                <i className="ri-bar-chart-line me-2"></i>
                Dashboard
              </span>
            }
          >
            <div className="p-4">
              {/* Dashboard Filters */}
              <ServicesDashboardFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                loading={loading}
                className="mb-4"
              />

              {/* Main Dashboard */}
              <ServicesDashboard
                isOpen={true}
                className="mt-0"
              />
            </div>
          </Tab>

          {/* Analytics Tab */}
          <Tab 
            eventKey="analytics" 
            title={
              <span>
                <i className="ri-line-chart-line me-2"></i>
                Análisis Avanzado
              </span>
            }
          >
            <div className="p-4">
              <div className="text-center py-5">
                <i className="ri-line-chart-line display-4 text-muted mb-3"></i>
                <h5 className="text-muted">Análisis Avanzado</h5>
                <p className="text-muted mb-3">
                  Funcionalidad de análisis avanzado próximamente disponible.
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <span className="badge bg-info-subtle text-info">
                    <i className="ri-time-line me-1"></i>
                    Tendencias temporales
                  </span>
                  <span className="badge bg-success-subtle text-success">
                    <i className="ri-focus-3-line me-1"></i>
                    Análisis predictivo
                  </span>
                  <span className="badge bg-warning-subtle text-warning">
                    <i className="ri-alert-line me-1"></i>
                    Alertas automáticas
                  </span>
                </div>
              </div>
            </div>
          </Tab>

          {/* Reports Tab */}
          <Tab 
            eventKey="reports" 
            title={
              <span>
                <i className="ri-file-text-line me-2"></i>
                Informes
              </span>
            }
          >
            <div className="p-4">
              <div className="text-center py-5">
                <i className="ri-file-text-line display-4 text-muted mb-3"></i>
                <h5 className="text-muted">Generador de Informes</h5>
                <p className="text-muted mb-4">
                  Genere informes personalizados y programados para sus servicios de salud.
                </p>
                
                <Row className="g-4">
                  <Col md={4}>
                    <div className="card border border-dashed h-100">
                      <div className="card-body text-center">
                        <i className="ri-file-pdf-line display-6 text-danger mb-3"></i>
                        <h6>Informe PDF</h6>
                        <p className="text-muted small">Informe completo con gráficos y tablas</p>
                        <Button variant="outline-danger" size="sm" disabled>
                          Generar PDF
                        </Button>
                      </div>
                    </div>
                  </Col>
                  
                  <Col md={4}>
                    <div className="card border border-dashed h-100">
                      <div className="card-body text-center">
                        <i className="ri-file-excel-line display-6 text-success mb-3"></i>
                        <h6>Datos Excel</h6>
                        <p className="text-muted small">Datos en formato Excel para análisis</p>
                        <Button variant="outline-success" size="sm" disabled>
                          Exportar Excel
                        </Button>
                      </div>
                    </div>
                  </Col>
                  
                  <Col md={4}>
                    <div className="card border border-dashed h-100">
                      <div className="card-body text-center">
                        <i className="ri-calendar-event-line display-6 text-primary mb-3"></i>
                        <h6>Informe Programado</h6>
                        <p className="text-muted small">Configure informes automáticos</p>
                        <Button variant="outline-primary" size="sm" disabled>
                          Programar
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>

                <div className="mt-4">
                  <span className="badge bg-info-subtle text-info">
                    <i className="ri-information-line me-1"></i>
                    Funcionalidad en desarrollo
                  </span>
                </div>
              </div>
            </div>
          </Tab>

          {/* Settings Tab */}
          <Tab 
            eventKey="settings" 
            title={
              <span>
                <i className="ri-settings-3-line me-2"></i>
                Configuración
              </span>
            }
          >
            <div className="p-4">
              <div className="text-center py-5">
                <i className="ri-settings-3-line display-4 text-muted mb-3"></i>
                <h5 className="text-muted">Configuración del Dashboard</h5>
                <p className="text-muted mb-4">
                  Personalice la apariencia y comportamiento del dashboard.
                </p>
                
                <Row className="g-4">
                  <Col md={6}>
                    <div className="card border border-dashed h-100">
                      <div className="card-body">
                        <h6 className="mb-3">
                          <i className="ri-palette-line me-2"></i>
                          Tema y Colores
                        </h6>
                        <div className="d-flex gap-2 mb-3">
                          <span className="badge bg-primary">Azul Healthcare</span>
                          <span className="badge bg-success">Verde Médico</span>
                          <span className="badge bg-info">Azul Claro</span>
                        </div>
                        <Button variant="outline-primary" size="sm" disabled>
                          Personalizar
                        </Button>
                      </div>
                    </div>
                  </Col>
                  
                  <Col md={6}>
                    <div className="card border border-dashed h-100">
                      <div className="card-body">
                        <h6 className="mb-3">
                          <i className="ri-refresh-line me-2"></i>
                          Actualización Automática
                        </h6>
                        <div className="mb-3">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="autoRefresh" />
                            <label className="form-check-label" htmlFor="autoRefresh">
                              Habilitar actualización automática
                            </label>
                          </div>
                        </div>
                        <Button variant="outline-info" size="sm" disabled>
                          Configurar
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>

                <div className="mt-4">
                  <span className="badge bg-warning-subtle text-warning">
                    <i className="ri-tools-line me-1"></i>
                    Configuraciones próximamente
                  </span>
                </div>
              </div>
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>

      <Modal.Footer className="bg-light border-top">
        <div className="d-flex justify-content-between w-100">
          <div className="d-flex gap-2">
            <span className="badge bg-success-subtle text-success">
              <i className="ri-check-line me-1"></i>
              Dashboard Activo
            </span>
            {loading && (
              <span className="badge bg-info-subtle text-info">
                <div className="spinner-border spinner-border-sm me-1"></div>
                Actualizando...
              </span>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={onClose}
            >
              <i className="ri-close-line me-1"></i>
              Cerrar
            </Button>
            <Button 
              variant="primary"
              onClick={handleApplyFilters}
              disabled={loading}
            >
              <i className="ri-refresh-line me-1"></i>
              Actualizar Dashboard
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ServicesDashboardModal;