import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  ResponsiveContainer, DonutChart
} from 'recharts';
import { useServicioStore } from '../../../../../stores/servicioStore';
import { useCurrentOrganization } from '../../../../../hooks/useCurrentOrganization';
import type { ServicioStatistics, ServicioFilters } from '../../../../../types/servicios';

// ====================================
// INTERFACES
// ====================================

interface ServicesDashboardProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
  label?: string;
}

interface FilterOptions {
  dateRange: '7d' | '30d' | '90d' | '1y' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  sedes: string[];
  complexity: string[];
  status: string[];
  modality: string[];
}

// ====================================
// CONSTANTS
// ====================================

const VELZON_COLORS = {
  primary: '#405189',
  secondary: '#3577f1', 
  success: '#0ab39c',
  warning: '#f7b84b',
  danger: '#f06548',
  info: '#299cdb',
  light: '#f3f6f9',
  dark: '#212529',
  muted: '#878a99'
} as const;

const HEALTHCARE_COLORS = {
  intramural: '#405189',
  extramural: '#299cdb',
  telemedicina: '#0ab39c',
  atencion_domiciliaria: '#f7b84b',
  baja: '#0ab39c',
  media: '#f7b84b', 
  alta: '#f06548',
  activo: '#0ab39c',
  inactivo: '#878a99',
  suspendido: '#f06548',
  en_proceso: '#f7b84b'
} as const;

const CHART_CONFIGS = {
  responsive: {
    width: '100%',
    height: 300
  },
  margin: {
    top: 20,
    right: 30,
    left: 20,
    bottom: 5
  }
};

// ====================================
// UTILITY FUNCTIONS
// ====================================

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-CO').format(num);
};

const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

const getHealthcareColor = (key: string): string => {
  return HEALTHCARE_COLORS[key as keyof typeof HEALTHCARE_COLORS] || VELZON_COLORS.primary;
};

const transformDataForChart = (
  data: Record<string, number>, 
  colorMap?: Record<string, string>
): ChartDataPoint[] => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  return Object.entries(data).map(([key, value]) => ({
    name: key,
    value,
    percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    color: colorMap?.[key] || getHealthcareColor(key),
    label: getDisplayLabel(key)
  }));
};

const getDisplayLabel = (key: string): string => {
  const labelMap: Record<string, string> = {
    // Status
    activo: 'Activo',
    inactivo: 'Inactivo', 
    suspendido: 'Suspendido',
    en_proceso: 'En Proceso',
    
    // Complexity
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    no_aplica: 'No Aplica',
    
    // Modality
    intramural: 'Intramural',
    extramural: 'Extramural',
    telemedicina: 'Telemedicina',
    atencion_domiciliaria: 'Atención Domiciliaria',
    
    // Categories
    apoyo_diagnostico: 'Apoyo Diagnóstico',
    consulta_externa: 'Consulta Externa',
    hospitalizacion: 'Hospitalización',
    urgencias: 'Urgencias',
    quirurgicos: 'Quirúrgicos',
    promocion_prevencion: 'Promoción y Prevención'
  };
  
  return labelMap[key] || key;
};

// ====================================
// DASHBOARD COMPONENTS
// ====================================

/**
 * KPI Cards Component
 */
const KPICards: React.FC<{ statistics: ServicioStatistics; loading: boolean }> = ({ 
  statistics, 
  loading 
}) => {
  if (loading) {
    return (
      <div className="row mb-4">
        {[...Array(4)].map((_, index) => (
          <div className="col-lg-3 col-md-6" key={index}>
            <div className="card card-height-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80px' }}>
                  <div className="spinner-border spinner-border-sm"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Servicios',
      value: statistics.total_services,
      icon: 'ri-service-line',
      color: 'primary',
      bgColor: 'primary-subtle',
      growth: null
    },
    {
      title: 'Servicios Activos',
      value: statistics.services_by_status?.activo || 0,
      icon: 'ri-checkbox-circle-line',
      color: 'success',
      bgColor: 'success-subtle',
      growth: null
    },
    {
      title: 'Capacidad Total',
      value: statistics.total_capacity,
      icon: 'ri-bar-chart-line',
      color: 'info',
      bgColor: 'info-subtle',
      growth: null
    },
    {
      title: 'Promedio Capacidad',
      value: statistics.average_capacity_per_service?.toFixed(1) || '0',
      icon: 'ri-calculator-line',
      color: 'warning',
      bgColor: 'warning-subtle',
      growth: null
    }
  ];

  return (
    <div className="row mb-4">
      {kpis.map((kpi, index) => (
        <div className="col-lg-3 col-md-6" key={index}>
          <div className="card card-height-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className={`avatar-sm bg-${kpi.bgColor} rounded`}>
                    <div className={`avatar-title text-${kpi.color}`}>
                      <i className={`${kpi.icon} fs-4`}></i>
                    </div>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted mb-1 fs-13">{kpi.title}</p>
                      <h4 className={`mb-0 text-${kpi.color}`}>
                        {typeof kpi.value === 'number' ? formatNumber(kpi.value) : kpi.value}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Services by Status Donut Chart
 */
const ServicesByStatusChart: React.FC<{ statistics: ServicioStatistics }> = ({ statistics }) => {
  const data = transformDataForChart(statistics.services_by_status || {});
  
  const renderCustomLabel = (entry: ChartDataPoint) => {
    return `${entry.label}: ${entry.value} (${entry.percentage}%)`;
  };

  return (
    <div className="card card-height-100 border-0 shadow-sm">
      <div className="card-header">
        <h6 className="card-title mb-0">
          <i className="ri-pie-chart-line me-2"></i>
          Servicios por Estado
        </h6>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%" 
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
              label={renderCustomLabel}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [formatNumber(value), getDisplayLabel(name)]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Services by Complexity Bar Chart
 */
const ServicesByComplexityChart: React.FC<{ statistics: ServicioStatistics }> = ({ statistics }) => {
  const data = transformDataForChart(statistics.services_by_complexity || {});

  return (
    <div className="card card-height-100 border-0 shadow-sm">
      <div className="card-header">
        <h6 className="card-title mb-0">
          <i className="ri-bar-chart-box-line me-2"></i>
          Servicios por Complejidad
        </h6>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={CHART_CONFIGS.margin}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="label"
              fontSize={12}
              tick={{ fill: VELZON_COLORS.muted }}
            />
            <YAxis 
              fontSize={12}
              tick={{ fill: VELZON_COLORS.muted }}
            />
            <Tooltip 
              formatter={(value: number) => [formatNumber(value), 'Servicios']}
              labelFormatter={(label) => `Complejidad: ${label}`}
            />
            <Bar 
              dataKey="value" 
              fill={VELZON_COLORS.primary}
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Services by Modality Horizontal Bar Chart
 */
const ServicesByModalityChart: React.FC<{ statistics: ServicioStatistics }> = ({ statistics }) => {
  const data = transformDataForChart(statistics.services_by_modality || {});

  return (
    <div className="card card-height-100 border-0 shadow-sm">
      <div className="card-header">
        <h6 className="card-title mb-0">
          <i className="ri-stack-line me-2"></i>
          Servicios por Modalidad
        </h6>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="horizontal"
            margin={CHART_CONFIGS.margin}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number"
              fontSize={12}
              tick={{ fill: VELZON_COLORS.muted }}
            />
            <YAxis 
              dataKey="label"
              type="category"
              fontSize={12}
              tick={{ fill: VELZON_COLORS.muted }}
              width={120}
            />
            <Tooltip 
              formatter={(value: number) => [formatNumber(value), 'Servicios']}
              labelFormatter={(label) => `Modalidad: ${label}`}
            />
            <Bar 
              dataKey="value" 
              fill={VELZON_COLORS.info}
              radius={[0, 4, 4, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Services by Sede Chart
 */
const ServicesBySedeChart: React.FC<{ statistics: ServicioStatistics }> = ({ statistics }) => {
  const data = statistics.services_by_sede
    ?.sort((a, b) => b.service_count - a.service_count)
    ?.slice(0, 10) // Top 10 sedes
    ?.map(sede => ({
      name: sede.sede_name,
      value: sede.service_count,
      label: sede.sede_name
    })) || [];

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header">
        <h6 className="card-title mb-0">
          <i className="ri-building-line me-2"></i>
          Top 10 Sedes por Número de Servicios
        </h6>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={CHART_CONFIGS.margin}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="label"
              fontSize={12}
              tick={{ fill: VELZON_COLORS.muted }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              fontSize={12}
              tick={{ fill: VELZON_COLORS.muted }}
            />
            <Tooltip 
              formatter={(value: number) => [formatNumber(value), 'Servicios']}
              labelFormatter={(label) => `Sede: ${label}`}
            />
            <Bar 
              dataKey="value" 
              fill={VELZON_COLORS.primary}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Authorization Status Component
 */
const AuthorizationStatusCard: React.FC<{ statistics: ServicioStatistics }> = ({ statistics }) => {
  const authData = [
    {
      label: 'Con Autorización',
      value: statistics.services_with_authorization || 0,
      color: 'success',
      icon: 'ri-shield-check-line'
    },
    {
      label: 'Autorizaciones Vencidas', 
      value: statistics.expired_authorizations || 0,
      color: 'danger',
      icon: 'ri-shield-cross-line'
    },
    {
      label: 'Por Vencer (30 días)',
      value: statistics.expiring_soon || 0,
      color: 'warning',
      icon: 'ri-time-line'
    }
  ];

  const total = statistics.total_services || 1;

  return (
    <div className="card card-height-100 border-0 shadow-sm">
      <div className="card-header">
        <h6 className="card-title mb-0">
          <i className="ri-shield-check-line me-2"></i>
          Estado de Autorizaciones
        </h6>
      </div>
      <div className="card-body">
        {authData.map((item, index) => (
          <div key={index} className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <div className={`avatar-xs bg-${item.color}-subtle rounded me-2`}>
                <div className={`avatar-title text-${item.color}`}>
                  <i className={`${item.icon} fs-6`}></i>
                </div>
              </div>
              <div>
                <div className="fw-medium">{item.label}</div>
                <small className="text-muted">{formatPercentage(item.value, total)}</small>
              </div>
            </div>
            <div className="text-end">
              <h5 className={`mb-0 text-${item.color}`}>{formatNumber(item.value)}</h5>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ====================================
// MAIN DASHBOARD COMPONENT
// ====================================

const ServicesDashboard: React.FC<ServicesDashboardProps> = ({
  isOpen = true,
  onClose,
  className
}) => {
  const { organization, hasOrganization } = useCurrentOrganization();
  const { statistics, fetchStatistics, loading } = useServicioStore();
  
  // State
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: '30d',
    sedes: [],
    complexity: [],
    status: [],
    modality: []
  });

  // Load statistics on component mount and when filters change
  useEffect(() => {
    if (hasOrganization) {
      loadStatistics();
    }
  }, [hasOrganization, filters]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval) {
      const interval = setInterval(() => {
        loadStatistics();
        setLastRefresh(new Date());
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Load statistics function
  const loadStatistics = useCallback(async () => {
    if (!hasOrganization) return;

    try {
      // Convert filters to API format
      const apiFilters: ServicioFilters = {
        page: 1,
        page_size: 50
      };

      await fetchStatistics(apiFilters);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, [hasOrganization, fetchStatistics, filters]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    loadStatistics();
    setLastRefresh(new Date());
  }, [loadStatistics]);

  // Auto-refresh toggle
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      setRefreshInterval(30); // Default to 30 seconds
    }
  }, [autoRefresh]);

  // Export functionality (placeholder)
  const handleExport = useCallback((format: 'pdf' | 'excel' | 'csv' | 'png') => {
    // TODO: Implement export functionality
    console.log(`Export format: ${format}`);
  }, []);

  if (!hasOrganization) {
    return (
      <div className="text-center py-4">
        <i className="ri-building-line display-4 text-muted mb-3"></i>
        <h5 className="text-muted">Organización requerida</h5>
        <p className="text-muted">Se requiere una organización activa para mostrar las estadísticas.</p>
      </div>
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className={className}>
      {/* Dashboard Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Dashboard de Servicios de Salud</h4>
          <p className="text-muted mb-0">
            Análisis completo y métricas interactivas
          </p>
        </div>
        <div className="d-flex gap-2">
          {/* Auto-refresh toggle */}
          <button
            className={`btn ${autoRefresh ? "btn-success" : "btn-outline-secondary"} btn-sm`}
            onClick={toggleAutoRefresh}
            title={autoRefresh ? "Desactivar actualización automática" : "Activar actualización automática"}
          >
            <i className="ri-refresh-line me-1"></i>
            {autoRefresh ? "Auto" : "Manual"}
          </button>

          {/* Manual refresh */}
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleRefresh}
            disabled={loading}
            title="Actualizar datos"
          >
            <i className={`ri-refresh-line me-1 ${loading ? 'fa-spin' : ''}`}></i>
            Actualizar
          </button>

          {/* Export dropdown */}
          <div className="dropdown">
            <button className="btn btn-outline-info btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
              <i className="ri-download-line me-1"></i>
              Exportar
            </button>
            <ul className="dropdown-menu">
              <li><a className="dropdown-item" href="#" onClick={() => handleExport('pdf')}>
                <i className="ri-file-pdf-line me-2"></i>
                Exportar PDF
              </a></li>
              <li><a className="dropdown-item" href="#" onClick={() => handleExport('excel')}>
                <i className="ri-file-excel-line me-2"></i>
                Exportar Excel
              </a></li>
              <li><a className="dropdown-item" href="#" onClick={() => handleExport('csv')}>
                <i className="ri-file-text-line me-2"></i>
                Exportar CSV
              </a></li>
              <li><hr className="dropdown-divider" /></li>
              <li><a className="dropdown-item" href="#" onClick={() => handleExport('png')}>
                <i className="ri-image-line me-2"></i>
                Exportar Gráficos (PNG)
              </a></li>
            </ul>
          </div>

          {/* Close button */}
          {onClose && (
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>
      </div>

      {/* Last refresh indicator */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <small className="text-muted">
          <i className="ri-time-line me-1"></i>
          Última actualización: {lastRefresh.toLocaleTimeString('es-CO')}
        </small>
        {autoRefresh && (
          <span className="badge bg-success-subtle text-success">
            <i className="ri-refresh-line me-1"></i>
            Actualización automática cada {refreshInterval}s
          </span>
        )}
      </div>

      {/* Dashboard Content */}
      {statistics ? (
        <>
          {/* KPI Cards */}
          <KPICards statistics={statistics} loading={loading} />

          {/* Charts Row 1 */}
          <div className="row mb-4">
            <div className="col-lg-6">
              <ServicesByStatusChart statistics={statistics} />
            </div>
            <div className="col-lg-6">
              <ServicesByComplexityChart statistics={statistics} />
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="row mb-4">
            <div className="col-lg-8">
              <ServicesByModalityChart statistics={statistics} />
            </div>
            <div className="col-lg-4">
              <AuthorizationStatusCard statistics={statistics} />
            </div>
          </div>

          {/* Charts Row 3 */}
          <div className="row mb-4">
            <div className="col-lg-12">
              <ServicesBySedeChart statistics={statistics} />
            </div>
          </div>

          {/* Summary Footer */}
          <div className="card bg-light border-0">
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3">
                  <div className="fw-bold text-primary fs-4">
                    {formatNumber(statistics.total_services)}
                  </div>
                  <div className="text-muted small">Total Servicios</div>
                </div>
                <div className="col-md-3">
                  <div className="fw-bold text-success fs-4">
                    {formatNumber(statistics.services_24_hours || 0)}
                  </div>
                  <div className="text-muted small">Servicios 24h</div>
                </div>
                <div className="col-md-3">
                  <div className="fw-bold text-info fs-4">
                    {formatNumber(statistics.total_capacity)}
                  </div>
                  <div className="text-muted small">Capacidad Total</div>
                </div>
                <div className="col-md-3">
                  <div className="fw-bold text-warning fs-4">
                    {statistics.services_by_sede?.length || 0}
                  </div>
                  <div className="text-muted small">Sedes con Servicios</div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-5">
          <div className="spinner-border mb-3"></div>
          <h5 className="text-muted">Cargando estadísticas...</h5>
          <p className="text-muted">Obteniendo datos del sistema...</p>
        </div>
      )}
    </div>
  );
};

export default ServicesDashboard;