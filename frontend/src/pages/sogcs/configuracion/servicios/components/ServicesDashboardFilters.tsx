import React, { useState, useCallback, useEffect } from 'react';
import { useCurrentOrganization } from '../../../../../hooks/useCurrentOrganization';
import type { ServicioFilters } from '../../../../../types/servicios';

// ====================================
// INTERFACES
// ====================================

interface ServicesDashboardFiltersProps {
  filters: ServicioFilters;
  onFiltersChange: (filters: ServicioFilters) => void;
  onApply: () => void;
  onReset: () => void;
  loading?: boolean;
  className?: string;
}

interface FilterPreset {
  id: string;
  name: string;
  icon: string;
  filters: Partial<ServicioFilters>;
  description: string;
}

interface DateRangeOption {
  value: string;
  label: string;
  days?: number;
}

// ====================================
// CONSTANTS
// ====================================

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { value: '7d', label: 'Últimos 7 días', days: 7 },
  { value: '30d', label: 'Últimos 30 días', days: 30 },
  { value: '90d', label: 'Últimos 90 días', days: 90 },
  { value: '1y', label: 'Último año', days: 365 },
  { value: 'custom', label: 'Personalizado' }
];

const STATUS_OPTIONS = [
  { value: 'activo', label: 'Activo', color: 'success' },
  { value: 'inactivo', label: 'Inactivo', color: 'secondary' },
  { value: 'suspendido', label: 'Suspendido', color: 'danger' },
  { value: 'en_proceso', label: 'En Proceso', color: 'warning' }
];

const COMPLEXITY_OPTIONS = [
  { value: 'baja', label: 'Baja', color: 'success' },
  { value: 'media', label: 'Media', color: 'warning' },
  { value: 'alta', label: 'Alta', color: 'danger' },
  { value: 'no_aplica', label: 'No Aplica', color: 'secondary' }
];

const MODALITY_OPTIONS = [
  { value: 'intramural', label: 'Intramural', color: 'primary' },
  { value: 'extramural', label: 'Extramural', color: 'info' },
  { value: 'telemedicina', label: 'Telemedicina', color: 'success' },
  { value: 'atencion_domiciliaria', label: 'Atención Domiciliaria', color: 'warning' }
];

const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'all',
    name: 'Todos los Servicios',
    icon: 'ri-service-line',
    description: 'Mostrar todos los servicios sin filtros',
    filters: {}
  },
  {
    id: 'active_only',
    name: 'Solo Activos',
    icon: 'ri-checkbox-circle-line',
    description: 'Servicios actualmente habilitados',
    filters: { status: 'activo' }
  },
  {
    id: 'high_complexity',
    name: 'Alta Complejidad',
    icon: 'ri-alert-line',
    description: 'Servicios de alta complejidad',
    filters: { complexity: 'alta' }
  },
  {
    id: 'telemedicine',
    name: 'Telemedicina',
    icon: 'ri-smartphone-line',
    description: 'Servicios de telemedicina',
    filters: { modality: 'telemedicina' }
  },
  {
    id: 'authorization_issues',
    name: 'Problemas de Autorización',
    icon: 'ri-shield-cross-line',
    description: 'Servicios con autorizaciones vencidas o por vencer',
    filters: { authorization_expired: true }
  },
  {
    id: '24h_services',
    name: 'Servicios 24h',
    icon: 'ri-time-line',
    description: 'Servicios con atención 24 horas',
    filters: { is_24_hours: true }
  }
];

// ====================================
// UTILITY FUNCTIONS
// ====================================

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getDateFromRange = (range: string): { start?: string; end?: string } => {
  const today = new Date();
  const option = DATE_RANGE_OPTIONS.find(opt => opt.value === range);
  
  if (!option || !option.days) return {};
  
  const start = new Date(today);
  start.setDate(start.getDate() - option.days);
  
  return {
    start: formatDate(start),
    end: formatDate(today)
  };
};

// ====================================
// COMPONENT
// ====================================

const ServicesDashboardFilters: React.FC<ServicesDashboardFiltersProps> = ({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  loading = false,
  className
}) => {
  const { organization } = useCurrentOrganization();
  
  // State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<ServicioFilters>(filters);
  const [selectedPreset, setSelectedPreset] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof ServicioFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  }, [localFilters]);

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: FilterPreset) => {
    setSelectedPreset(preset.id);
    const newFilters = { ...preset.filters };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  }, [onFiltersChange]);

  // Handle date range change
  const handleDateRangeChange = useCallback((range: string) => {
    if (range === 'custom') {
      setCustomDateRange({
        start: formatDate(new Date()),
        end: formatDate(new Date())
      });
    } else {
      const dateRange = getDateFromRange(range);
      handleFilterChange('created_at__gte', dateRange.start);
      handleFilterChange('created_at__lte', dateRange.end);
    }
  }, [handleFilterChange]);

  // Handle custom date range
  const handleCustomDateChange = useCallback((type: 'start' | 'end', value: string) => {
    const newRange = { ...customDateRange, [type]: value };
    setCustomDateRange(newRange);
    
    if (newRange.start && newRange.end) {
      handleFilterChange('created_at__gte', newRange.start);
      handleFilterChange('created_at__lte', newRange.end);
    }
  }, [customDateRange, handleFilterChange]);

  // Apply filters
  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    onApply();
  }, [localFilters, onFiltersChange, onApply]);

  // Reset filters
  const handleReset = useCallback(() => {
    const resetFilters: ServicioFilters = {};
    setLocalFilters(resetFilters);
    setSelectedPreset('all');
    setCustomDateRange({ start: '', end: '' });
    onFiltersChange(resetFilters);
    onReset();
  }, [onFiltersChange, onReset]);

  // Count active filters
  const activeFiltersCount = Object.entries(localFilters).filter(([key, value]) => 
    value !== undefined && value !== null && value !== ''
  ).length;

  return (
    <Card className={`border-0 shadow-sm mb-4 ${className}`}>
      <Card.Header className="bg-light border-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="card-title mb-0">
            <i className="ri-filter-3-line me-2"></i>
            Filtros de Dashboard
            {activeFiltersCount > 0 && (
              <Badge bg="primary-subtle" text="primary" className="ms-2">
                {activeFiltersCount}
              </Badge>
            )}
          </h6>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <i className={`ri-${showAdvancedFilters ? 'eye-off' : 'eye'}-line me-1`}></i>
              {showAdvancedFilters ? 'Ocultar' : 'Avanzados'}
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleReset}
              disabled={loading || activeFiltersCount === 0}
            >
              <i className="ri-refresh-line me-1"></i>
              Limpiar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
              disabled={loading}
            >
              <i className="ri-search-line me-1"></i>
              Aplicar
            </Button>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Quick Filter Presets */}
        <div className="mb-4">
          <label className="form-label small text-muted">FILTROS RÁPIDOS</label>
          <div className="d-flex flex-wrap gap-2">
            {FILTER_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant={selectedPreset === preset.id ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => handlePresetSelect(preset)}
                title={preset.description}
              >
                <i className={`${preset.icon} me-1`}></i>
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Basic Filters Row */}
        <Row className="g-3">
          {/* Search */}
          <Col md={4}>
            <Form.Label className="small text-muted">BÚSQUEDA</Form.Label>
            <InputGroup size="sm">
              <InputGroup.Text>
                <i className="ri-search-line"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Código, nombre, sede..."
                value={localFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </InputGroup>
          </Col>

          {/* Status */}
          <Col md={4}>
            <Form.Label className="small text-muted">ESTADO</Form.Label>
            <Form.Select
              size="sm"
              value={localFilters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            >
              <option value="">Todos los estados</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Date Range */}
          <Col md={4}>
            <Form.Label className="small text-muted">PERÍODO</Form.Label>
            <Form.Select
              size="sm"
              onChange={(e) => handleDateRangeChange(e.target.value)}
              defaultValue="30d"
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        {/* Advanced Filters */}
        <Collapse in={showAdvancedFilters}>
          <div className="mt-4">
            <hr className="my-4" />
            <Row className="g-3">
              {/* Complexity */}
              <Col md={3}>
                <Form.Label className="small text-muted">COMPLEJIDAD</Form.Label>
                <Form.Select
                  size="sm"
                  value={localFilters.complexity || ''}
                  onChange={(e) => handleFilterChange('complexity', e.target.value || undefined)}
                >
                  <option value="">Todas las complejidades</option>
                  {COMPLEXITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* Modality */}
              <Col md={3}>
                <Form.Label className="small text-muted">MODALIDAD</Form.Label>
                <Form.Select
                  size="sm"
                  value={localFilters.modality || ''}
                  onChange={(e) => handleFilterChange('modality', e.target.value || undefined)}
                >
                  <option value="">Todas las modalidades</option>
                  {MODALITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* Category */}
              <Col md={3}>
                <Form.Label className="small text-muted">CATEGORÍA</Form.Label>
                <Form.Select
                  size="sm"
                  value={localFilters.service_category || ''}
                  onChange={(e) => handleFilterChange('service_category', e.target.value || undefined)}
                >
                  <option value="">Todas las categorías</option>
                  <option value="apoyo_diagnostico">Apoyo Diagnóstico</option>
                  <option value="consulta_externa">Consulta Externa</option>
                  <option value="hospitalizacion">Hospitalización</option>
                  <option value="urgencias">Urgencias</option>
                  <option value="quirurgicos">Quirúrgicos</option>
                  <option value="promocion_prevencion">Promoción y Prevención</option>
                </Form.Select>
              </Col>

              {/* Sede */}
              <Col md={3}>
                <Form.Label className="small text-muted">SEDE</Form.Label>
                <Form.Select
                  size="sm"
                  value={localFilters.sede || ''}
                  onChange={(e) => handleFilterChange('sede', e.target.value || undefined)}
                >
                  <option value="">Todas las sedes</option>
                  {/* TODO: Populate with actual sede options from organization */}
                </Form.Select>
              </Col>
            </Row>

            {/* Boolean Filters */}
            <Row className="g-3 mt-3">
              <Col md={12}>
                <div className="d-flex flex-wrap gap-3">
                  <Form.Check
                    type="checkbox"
                    id="filter-24h"
                    label="Solo servicios 24 horas"
                    checked={localFilters.is_24_hours || false}
                    onChange={(e) => handleFilterChange('is_24_hours', e.target.checked || undefined)}
                  />
                  <Form.Check
                    type="checkbox"
                    id="filter-auth"
                    label="Con autorización vigente"
                    checked={localFilters.has_authorization || false}
                    onChange={(e) => handleFilterChange('has_authorization', e.target.checked || undefined)}
                  />
                  <Form.Check
                    type="checkbox"
                    id="filter-expired"
                    label="Autorizaciones vencidas"
                    checked={localFilters.authorization_expired || false}
                    onChange={(e) => handleFilterChange('authorization_expired', e.target.checked || undefined)}
                  />
                  <Form.Check
                    type="checkbox"
                    id="filter-expiring"
                    label="Por vencer pronto"
                    checked={localFilters.expiring_soon || false}
                    onChange={(e) => handleFilterChange('expiring_soon', e.target.checked || undefined)}
                  />
                </div>
              </Col>
            </Row>

            {/* Custom Date Range */}
            {customDateRange.start !== '' && (
              <Row className="g-3 mt-3">
                <Col md={6}>
                  <Form.Label className="small text-muted">FECHA INICIO</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={customDateRange.start}
                    onChange={(e) => handleCustomDateChange('start', e.target.value)}
                  />
                </Col>
                <Col md={6}>
                  <Form.Label className="small text-muted">FECHA FIN</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={customDateRange.end}
                    onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  />
                </Col>
              </Row>
            )}
          </div>
        </Collapse>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="mt-3 pt-3 border-top">
            <small className="text-muted">FILTROS ACTIVOS:</small>
            <div className="d-flex flex-wrap gap-1 mt-2">
              {Object.entries(localFilters).map(([key, value]) => {
                if (value === undefined || value === null || value === '') return null;
                
                let label = `${key}: ${value}`;
                
                // Format specific filter types
                if (key === 'status') label = `Estado: ${STATUS_OPTIONS.find(opt => opt.value === value)?.label || value}`;
                if (key === 'complexity') label = `Complejidad: ${COMPLEXITY_OPTIONS.find(opt => opt.value === value)?.label || value}`;
                if (key === 'modality') label = `Modalidad: ${MODALITY_OPTIONS.find(opt => opt.value === value)?.label || value}`;
                if (key === 'search') label = `Búsqueda: "${value}"`;
                
                return (
                  <Badge 
                    key={key}
                    bg="primary-subtle" 
                    text="primary"
                    className="d-flex align-items-center"
                  >
                    {label}
                    <button
                      type="button"
                      className="btn-close btn-close-sm ms-2"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => handleFilterChange(key as keyof ServicioFilters, undefined)}
                    ></button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ServicesDashboardFilters;