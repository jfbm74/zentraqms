import React from 'react';
import { Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';
import type { ServicioStatsProps } from '../../../../../types/servicios';

const ServicioStats: React.FC<ServicioStatsProps> = ({
  statistics,
  loading = false,
  filters,
  onFilterChange,
}) => {
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3"></div>
          <p className="text-muted">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-4">
        <i className="ri-bar-chart-line display-4 text-muted mb-3"></i>
        <h5 className="text-muted">No hay estadísticas disponibles</h5>
      </div>
    );
  }

  // Helper function to get percentage
  const getPercentage = (value: number, total: number): number => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  // Helper function to get status badge variant
  const getStatusBadgeVariant = (status: string) => {
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

  // Helper function to get complexity badge variant
  const getComplexityBadgeVariant = (complexity: string) => {
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

  // Helper function to get modality badge variant
  const getModalityBadgeVariant = (modality: string) => {
    switch (modality?.toLowerCase()) {
      case 'intramural':
        return 'primary';
      case 'extramural':
        return 'info';
      case 'telemedicina':
        return 'success';
      case 'atencion_domiciliaria':
        return 'warning';
      default:
        return 'light';
    }
  };

  return (
    <div>
      {/* Resumen General */}
      <Row className="mb-4">
        <Col lg={3} md={6}>
          <Card className="card-height-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="avatar-sm bg-primary-subtle rounded">
                    <div className="avatar-title text-primary">
                      <i className="ri-service-line fs-4"></i>
                    </div>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1">Total Servicios</p>
                      <h4 className="mb-0 text-primary">{statistics.total_services.toLocaleString()}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="card-height-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="avatar-sm bg-success-subtle rounded">
                    <div className="avatar-title text-success">
                      <i className="ri-bar-chart-line fs-4"></i>
                    </div>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1">Capacidad Total</p>
                      <h4 className="mb-0 text-success">{statistics.total_capacity.toLocaleString()}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="card-height-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="avatar-sm bg-info-subtle rounded">
                    <div className="avatar-title text-info">
                      <i className="ri-time-line fs-4"></i>
                    </div>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1">Atención 24h</p>
                      <h4 className="mb-0 text-info">{statistics.services_24_hours}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="card-height-100 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="avatar-sm bg-warning-subtle rounded">
                    <div className="avatar-title text-warning">
                      <i className="ri-calculator-line fs-4"></i>
                    </div>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1">Capacidad Promedio</p>
                      <h4 className="mb-0 text-warning">{statistics.average_capacity_per_service.toFixed(1)}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Distribución por Estado */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card className="card-height-100 border-0 shadow-sm">
            <Card.Header>
              <h6 className="card-title mb-0">
                <i className="ri-pie-chart-line me-2"></i>
                Servicios por Estado
              </h6>
            </Card.Header>
            <Card.Body>
              {Object.entries(statistics.services_by_status).map(([status, count]) => {
                const percentage = getPercentage(count, statistics.total_services);
                return (
                  <div key={status} className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Badge 
                        bg={getStatusBadgeVariant(status)} 
                        className="me-2"
                        style={{ minWidth: '70px' }}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                      <span className="text-muted small">{count} servicios</span>
                    </div>
                    <div className="flex-grow-1 mx-3">
                      <ProgressBar 
                        now={percentage} 
                        variant={getStatusBadgeVariant(status)}
                        style={{ height: '6px' }}
                      />
                    </div>
                    <span className="text-muted small fw-medium">{percentage}%</span>
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="card-height-100 border-0 shadow-sm">
            <Card.Header>
              <h6 className="card-title mb-0">
                <i className="ri-bar-chart-box-line me-2"></i>
                Servicios por Complejidad
              </h6>
            </Card.Header>
            <Card.Body>
              {Object.entries(statistics.services_by_complexity).map(([complexity, count]) => {
                const percentage = getPercentage(count, statistics.total_services);
                const complexityLabel = complexity === 'baja' ? 'Baja' : 
                                      complexity === 'media' ? 'Media' : 
                                      complexity === 'alta' ? 'Alta' : complexity;
                return (
                  <div key={complexity} className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Badge 
                        bg={getComplexityBadgeVariant(complexity)} 
                        className="me-2"
                        style={{ minWidth: '70px' }}
                      >
                        {complexityLabel}
                      </Badge>
                      <span className="text-muted small">{count} servicios</span>
                    </div>
                    <div className="flex-grow-1 mx-3">
                      <ProgressBar 
                        now={percentage} 
                        variant={getComplexityBadgeVariant(complexity)}
                        style={{ height: '6px' }}
                      />
                    </div>
                    <span className="text-muted small fw-medium">{percentage}%</span>
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modalidad y Categorías */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card className="card-height-100 border-0 shadow-sm">
            <Card.Header>
              <h6 className="card-title mb-0">
                <i className="ri-stack-line me-2"></i>
                Servicios por Modalidad
              </h6>
            </Card.Header>
            <Card.Body>
              {Object.entries(statistics.services_by_modality).map(([modality, count]) => {
                const percentage = getPercentage(count, statistics.total_services);
                const modalityLabel = modality === 'intramural' ? 'Intramural' :
                                    modality === 'extramural' ? 'Extramural' :
                                    modality === 'telemedicina' ? 'Telemedicina' :
                                    modality === 'atencion_domiciliaria' ? 'Atención Domiciliaria' : modality;
                return (
                  <div key={modality} className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <Badge 
                        bg={getModalityBadgeVariant(modality)} 
                        className="me-2"
                        style={{ minWidth: '100px' }}
                      >
                        {modalityLabel}
                      </Badge>
                      <span className="text-muted small">{count} servicios</span>
                    </div>
                    <div className="flex-grow-1 mx-3">
                      <ProgressBar 
                        now={percentage} 
                        variant={getModalityBadgeVariant(modality)}
                        style={{ height: '6px' }}
                      />
                    </div>
                    <span className="text-muted small fw-medium">{percentage}%</span>
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="card-height-100 border-0 shadow-sm">
            <Card.Header>
              <h6 className="card-title mb-0">
                <i className="ri-folder-line me-2"></i>
                Top 5 Categorías de Servicios
              </h6>
            </Card.Header>
            <Card.Body>
              {Object.entries(statistics.services_by_category)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([category, count]) => {
                  const percentage = getPercentage(count, statistics.total_services);
                  return (
                    <div key={category} className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        <div className="text-truncate" style={{ maxWidth: '150px' }}>
                          <span className="fw-medium small">{category}</span>
                        </div>
                        <span className="text-muted small ms-2">({count})</span>
                      </div>
                      <div className="flex-grow-1 mx-3">
                        <ProgressBar 
                          now={percentage} 
                          variant="info"
                          style={{ height: '6px' }}
                        />
                      </div>
                      <span className="text-muted small fw-medium">{percentage}%</span>
                    </div>
                  );
                })}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Servicios por Sede */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <h6 className="card-title mb-0">
                <i className="ri-building-line me-2"></i>
                Distribución de Servicios por Sede
              </h6>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {statistics.services_by_sede
                  .sort((a, b) => b.service_count - a.service_count)
                  .map((sede, index) => {
                    const percentage = getPercentage(sede.service_count, statistics.total_services);
                    return (
                      <div key={sede.sede_id} className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                          <Badge bg="primary" className="me-2">
                            #{index + 1}
                          </Badge>
                          <div>
                            <div className="fw-medium">{sede.sede_name}</div>
                            <small className="text-muted">{sede.service_count} servicios</small>
                          </div>
                        </div>
                        <div className="flex-grow-1 mx-3">
                          <ProgressBar 
                            now={percentage} 
                            variant="primary"
                            style={{ height: '8px' }}
                          />
                        </div>
                        <span className="text-muted fw-medium">{percentage}%</span>
                      </div>
                    );
                  })}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Indicadores de Autorización */}
      <Row>
        <Col lg={6}>
          <Card className="card-height-100 border-0 shadow-sm">
            <Card.Header>
              <h6 className="card-title mb-0">
                <i className="ri-shield-check-line me-2"></i>
                Estado de Autorizaciones
              </h6>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col md={4}>
                  <div className="border-end">
                    <div className="fs-4 fw-bold text-success">{statistics.services_with_authorization}</div>
                    <div className="text-muted small">Con Autorización</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="border-end">
                    <div className="fs-4 fw-bold text-danger">{statistics.expired_authorizations}</div>
                    <div className="text-muted small">Autorizaciones Vencidas</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="fs-4 fw-bold text-warning">{statistics.expiring_soon}</div>
                  <div className="text-muted small">Por Vencer (30 días)</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="card-height-100 border-0 shadow-sm">
            <Card.Header>
              <h6 className="card-title mb-0">
                <i className="ri-information-line me-2"></i>
                Resumen de Autorización
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Servicios Autorizados</span>
                  <span className="fw-medium">
                    {getPercentage(statistics.services_with_authorization, statistics.total_services)}%
                  </span>
                </div>
                <ProgressBar 
                  now={getPercentage(statistics.services_with_authorization, statistics.total_services)} 
                  variant="success"
                  style={{ height: '8px' }}
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Autorizaciones Vencidas</span>
                  <span className="fw-medium">
                    {getPercentage(statistics.expired_authorizations, statistics.total_services)}%
                  </span>
                </div>
                <ProgressBar 
                  now={getPercentage(statistics.expired_authorizations, statistics.total_services)} 
                  variant="danger"
                  style={{ height: '8px' }}
                />
              </div>

              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Por Vencer</span>
                  <span className="fw-medium">
                    {getPercentage(statistics.expiring_soon, statistics.total_services)}%
                  </span>
                </div>
                <ProgressBar 
                  now={getPercentage(statistics.expiring_soon, statistics.total_services)} 
                  variant="warning"
                  style={{ height: '8px' }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ServicioStats;