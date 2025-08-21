// DEPRECATED: This file has been replaced by ServiceDetailModal.tsx
// This file remains for backward compatibility but should not be used
import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import type { ServicioDetailModalProps, SedeHealthService } from '../../../../../../types/servicios';
import { useServicioStore } from '../../../../../../stores/servicioStore';

const ServicioDetailModal: React.FC<ServicioDetailModalProps> = ({
  isOpen,
  onClose,
  servicioId,
  onEdit,
}) => {
  const [servicio, setServicio] = useState<SedeHealthService | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { fetchServicioDetail } = useServicioStore();

  // Load servicio details when modal opens
  useEffect(() => {
    if (isOpen && servicioId) {
      loadServicioDetail();
    }
  }, [isOpen, servicioId]);

  const loadServicioDetail = async () => {
    if (!servicioId) return;

    setLoading(true);
    setError(null);

    try {
      const servicioData = await fetchServicioDetail(servicioId);
      setServicio(servicioData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los detalles del servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (servicio && onEdit) {
      onEdit(servicio);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper functions for display
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'activo':
        return 'success';
      case 'inactivo':
        return 'secondary';
      case 'suspendido':
        return 'danger';
      case 'en_proceso':
        return 'warning';
      default:
        return 'light';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'activo':
        return 'Activo';
      case 'inactivo':
        return 'Inactivo';
      case 'suspendido':
        return 'Suspendido';
      case 'en_proceso':
        return 'En Proceso';
      default:
        return status || 'N/A';
    }
  };

  const getModalityLabel = (modality: string) => {
    switch (modality?.toLowerCase()) {
      case 'intramural':
        return 'Intramural';
      case 'extramural':
        return 'Extramural';
      case 'telemedicina':
        return 'Telemedicina';
      case 'atencion_domiciliaria':
        return 'Atención Domiciliaria';
      default:
        return modality || 'N/A';
    }
  };

  const getComplexityLabel = (complexity: string) => {
    switch (complexity?.toLowerCase()) {
      case 'baja':
        return 'Baja Complejidad';
      case 'media':
        return 'Mediana Complejidad';
      case 'alta':
        return 'Alta Complejidad';
      case 'no_aplica':
        return 'No Aplica';
      default:
        return complexity || 'N/A';
    }
  };

  const getComplexityBadge = (complexity: string) => {
    switch (complexity?.toLowerCase()) {
      case 'baja':
        return 'success';
      case 'media':
        return 'warning';
      case 'alta':
        return 'danger';
      default:
        return 'light';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderInfoCard = (
    title: string, 
    icon: string, 
    children: React.ReactNode, 
    headerColor: string = "primary"
  ) => (
    <div className="card border-0 shadow-sm mb-3">
      <div className={`card-header bg-${headerColor}-subtle`}>
        <h6 className={`card-title mb-0 text-${headerColor}`}>
          <i className={`${icon} me-2`}></i>
          {title}
        </h6>
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Modal show={isOpen} onHide={onClose} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Servicio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Cargando detalles del servicio...</p>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal show={isOpen} onHide={onClose} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Servicio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <i className="ri-error-warning-line me-2"></i>
            {error}
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={loadServicioDetail}>
            <i className="ri-refresh-line me-2"></i>
            Reintentar
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (!servicio) {
    return null;
  }

  return (
    <Modal show={isOpen} onHide={onClose} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="ri-service-line me-2"></i>
          Detalles del Servicio de Salud
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Row>
          {/* Información Básica */}
          <Col lg={6}>
            {renderInfoCard(
              "Información Básica",
              "ri-information-line",
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Código del Servicio:</label>
                  <p className="mb-1 text-primary fw-medium">{servicio.service_code}</p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nombre del Servicio:</label>
                  <p className="mb-1">{servicio.service_name}</p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Categoría:</label>
                  <p className="mb-1">{servicio.service_category}</p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Modalidad:</label>
                  <div>
                    <Badge bg="info" className="me-2">
                      {getModalityLabel(servicio.modality)}
                    </Badge>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Complejidad:</label>
                  <div>
                    <Badge bg={getComplexityBadge(servicio.complexity)}>
                      {getComplexityLabel(servicio.complexity)}
                    </Badge>
                  </div>
                </div>
                
                <div className="mb-0">
                  <label className="form-label fw-semibold">Estado:</label>
                  <div>
                    <Badge bg={getStatusBadge(servicio.status)}>
                      {getStatusLabel(servicio.status)}
                    </Badge>
                    {servicio.is_active && (
                      <Badge bg="success" className="ms-2">Activo</Badge>
                    )}
                  </div>
                </div>
              </>,
              "primary"
            )}
          </Col>
          
          {/* Información de la Sede */}
          <Col lg={6}>
            {renderInfoCard(
              "Información de la Sede",
              "ri-building-line",
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nombre de la Sede:</label>
                  <p className="mb-1">{servicio.sede_name}</p>
                </div>
                
                <div className="mb-0">
                  <label className="form-label fw-semibold">Código REPS:</label>
                  <p className="mb-1 text-primary fw-medium">{servicio.sede_reps_code}</p>
                </div>
              </>,
              "info"
            )}
          </Col>
        </Row>

        <Row>
          {/* Capacidad y Características */}
          <Col lg={6}>
            {renderInfoCard(
              "Capacidad y Características",
              "ri-settings-line",
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Capacidad Instalada:</label>
                  <p className="mb-1">
                    <Badge bg="primary" className="fs-6">{servicio.capacity}</Badge>
                  </p>
                </div>
                
                {servicio.distinctive_feature && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Distintivo:</label>
                    <p className="mb-1">{servicio.distinctive_feature}</p>
                  </div>
                )}
                
                <div className="mb-0">
                  <label className="form-label fw-semibold">Atención 24 Horas:</label>
                  <p className="mb-1">
                    <Badge bg={servicio.is_24_hours ? "success" : "secondary"}>
                      {servicio.is_24_hours ? "Sí" : "No"}
                    </Badge>
                  </p>
                </div>
              </>,
              "success"
            )}
          </Col>
          
          {/* Fechas y Autorización */}
          <Col lg={6}>
            {renderInfoCard(
              "Fechas y Autorización",
              "ri-calendar-line",
              <>
                {servicio.authorization_date && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Fecha de Autorización:</label>
                    <p className="mb-1">{formatDate(servicio.authorization_date)}</p>
                  </div>
                )}
                
                {servicio.expiration_date && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Fecha de Vencimiento:</label>
                    <p className="mb-1">{formatDate(servicio.expiration_date)}</p>
                  </div>
                )}
                
                {servicio.authorization_resolution && (
                  <div className="mb-0">
                    <label className="form-label fw-semibold">Resolución de Autorización:</label>
                    <p className="mb-1">{servicio.authorization_resolution}</p>
                  </div>
                )}
              </>,
              "warning"
            )}
          </Col>
        </Row>

        {/* Personal */}
        {(servicio.medical_staff_count || servicio.nursing_staff_count || servicio.technical_staff_count) && (
          <Row>
            <Col lg={12}>
              {renderInfoCard(
                "Información de Personal",
                "ri-team-line",
                <>
                  <Row>
                    {servicio.medical_staff_count && (
                      <Col md={4}>
                        <div className="text-center">
                          <div className="text-primary fs-4 fw-bold">{servicio.medical_staff_count}</div>
                          <div className="text-muted small">Personal Médico</div>
                        </div>
                      </Col>
                    )}
                    
                    {servicio.nursing_staff_count && (
                      <Col md={4}>
                        <div className="text-center">
                          <div className="text-success fs-4 fw-bold">{servicio.nursing_staff_count}</div>
                          <div className="text-muted small">Personal de Enfermería</div>
                        </div>
                      </Col>
                    )}
                    
                    {servicio.technical_staff_count && (
                      <Col md={4}>
                        <div className="text-center">
                          <div className="text-info fs-4 fw-bold">{servicio.technical_staff_count}</div>
                          <div className="text-muted small">Personal Técnico</div>
                        </div>
                      </Col>
                    )}
                  </Row>
                </>,
                "secondary"
              )}
            </Col>
          </Row>
        )}

        {/* Equipos y Observaciones */}
        <Row>
          {servicio.equipment_list && servicio.equipment_list.length > 0 && (
            <Col lg={6}>
              {renderInfoCard(
                "Equipos Disponibles",
                "ri-tools-line",
                <>
                  <div className="d-flex flex-wrap gap-1">
                    {servicio.equipment_list.map((equipment, index) => (
                      <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                        {equipment}
                      </Badge>
                    ))}
                  </div>
                </>,
                "dark"
              )}
            </Col>
          )}
          
          {(servicio.special_requirements || servicio.observation) && (
            <Col lg={servicio.equipment_list?.length ? 6 : 12}>
              {renderInfoCard(
                "Observaciones y Requisitos",
                "ri-file-text-line",
                <>
                  {servicio.special_requirements && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Requisitos Especiales:</label>
                      <p className="mb-1">{servicio.special_requirements}</p>
                    </div>
                  )}
                  
                  {servicio.observation && (
                    <div className="mb-0">
                      <label className="form-label fw-semibold">Observaciones:</label>
                      <p className="mb-1">{servicio.observation}</p>
                    </div>
                  )}
                </>,
                "dark"
              )}
            </Col>
          )}
        </Row>

        {/* Metadata */}
        <Row>
          <Col lg={12}>
            {renderInfoCard(
              "Información de Registro",
              "ri-information-line",
              <>
                <Row>
                  <Col md={6}>
                    <div className="mb-2">
                      <label className="form-label fw-semibold small">Fecha de Creación:</label>
                      <p className="mb-1 small text-muted">{formatDate(servicio.created_at)}</p>
                    </div>
                  </Col>
                  
                  <Col md={6}>
                    <div className="mb-2">
                      <label className="form-label fw-semibold small">Última Actualización:</label>
                      <p className="mb-1 small text-muted">{formatDate(servicio.updated_at)}</p>
                    </div>
                  </Col>
                </Row>
                
                {servicio.imported_from_file && (
                  <Row>
                    <Col md={12}>
                      <div className="mb-0">
                        <Badge bg="info" className="small">
                          <i className="ri-upload-line me-1"></i>
                          Importado desde archivo
                        </Badge>
                        {servicio.import_date && (
                          <small className="text-muted ms-2">
                            el {formatDate(servicio.import_date)}
                          </small>
                        )}
                      </div>
                    </Col>
                  </Row>
                )}
              </>,
              "light"
            )}
          </Col>
        </Row>
      </Modal.Body>
      
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div>
            <Button variant="outline-secondary" onClick={handlePrint}>
              <i className="ri-printer-line me-2"></i>
              Imprimir
            </Button>
          </div>
          
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            
            {onEdit && (
              <Button variant="success" onClick={handleEdit}>
                <i className="ri-pencil-line me-2"></i>
                Editar Servicio
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ServicioDetailModal;