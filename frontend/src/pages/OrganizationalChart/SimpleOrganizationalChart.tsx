/**
 * Componente simplificado para organigramas organizacionales
 * Versión funcional para ZentraQMS con integración d3-org-chart
 */

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCurrentOrganization } from '../../hooks/useCurrentOrganization';
import organizationalChartService from '../../services/organizationalChart/organizationalChartService';
import InteractiveOrgChart from '../../components/organizational-chart/InteractiveOrgChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { OrganizationalChart, ChartStatistics } from '../../types/organizationalChart';

const SimpleOrganizationalChart: React.FC = () => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'interactive'>('dashboard');
  const [showSOGCSValidation, setShowSOGCSValidation] = useState(true);
  const [orgData, setOrgData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentChart, setCurrentChart] = useState<OrganizationalChart | null>(null);
  const [chartStatistics, setChartStatistics] = useState<ChartStatistics | null>(null);
  const [organizationAreas, setOrganizationAreas] = useState<any[]>([]);
  
  const { user } = useAuthContext();
  const { organization, isLoading: organizationLoading, hasOrganization } = useCurrentOrganization();

  // Cargar datos del organigrama
  const loadOrganizationalData = async () => {
    try {
      if (!organization?.id) {
        setError('No se encontró la organización del usuario');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);

      // Obtener el organigrama actual de la organización
      const currentChart = await organizationalChartService.chart.getCurrent(organization.id);
      
      if (!currentChart) {
        setError('No se encontró un organigrama activo para esta organización');
        setCurrentChart(null);
        setChartStatistics(null);
        setOrganizationAreas([]);
        setOrgData([]);
      } else {
        setCurrentChart(currentChart);
        
        // Obtener estadísticas del organigrama
        const statistics = await organizationalChartService.chart.getStatistics(currentChart.id);
        setChartStatistics(statistics);
        
        // Obtener áreas del organigrama
        const areas = await organizationalChartService.area.getByChart(currentChart.id);
        const areasHierarchy = organizationalChartService.area.buildHierarchy(areas);
        setOrganizationAreas(areasHierarchy);
        
        // Construir datos para el gráfico interactivo
        try {
          const chartData = await organizationalChartService.visualization.buildChartData(currentChart.id);
          setOrgData(chartData.nodes);
        } catch (chartError) {
          console.warn('No se pudo construir el gráfico interactivo:', chartError);
          setOrgData([]);
        }
      }
    } catch (err) {
      console.error('Error loading organizational data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos organizacionales');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (hasOrganization && organization?.id) {
      loadOrganizationalData();
    }
  }, [hasOrganization, organization?.id]);

  // Función para manejar cambios en la estructura
  const handleStructureChange = (newData: any[]) => {
    setOrgData(newData);
    console.log('Estructura actualizada:', newData);
  };

  // Función para manejar actualización de nodos individuales
  const handleNodeUpdate = (node: any) => {
    console.log('Nodo actualizado:', node);
  };

  // Mostrar loading mientras se cargan los datos
  if (loading || organizationLoading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
              <LoadingSpinner size="lg" />
              <span className="ms-3">Cargando datos organizacionales...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay organización
  if (!organizationLoading && !hasOrganization) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
              <div>
                <h4 className="mb-sm-0 font-size-18">Organigrama Organizacional</h4>
                <p className="text-muted mt-2">No hay organización asociada al usuario</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si no hay organigrama
  if (error && !currentChart) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
              <div>
                <h4 className="mb-sm-0 font-size-18">Organigrama Organizacional</h4>
                <p className="text-muted mt-2">Gestión completa de organigramas organizacionales</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="avatar-lg mx-auto mb-4">
                  <div className="avatar-title bg-light text-primary rounded-circle font-size-24">
                    <i className="ri-organization-chart"></i>
                  </div>
                </div>
                <h5 className="mb-3">No hay organigrama disponible</h5>
                <p className="text-muted mb-4">{error}</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/organigramas/nuevo'}
                >
                  <i className="ri-add-line me-1"></i>
                  Crear Organigrama
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-sm-flex align-items-center justify-content-between">
            <div>
              <h4 className="mb-sm-0 font-size-18">Organigrama Organizacional</h4>
              <div className="mt-2">
                <div className="btn-group" role="group" aria-label="Modos de visualización">
                  <button
                    type="button"
                    className={`btn btn-sm ${viewMode === 'dashboard' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('dashboard')}
                  >
                    <i className="ri-dashboard-line me-1"></i>
                    Dashboard
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${viewMode === 'interactive' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('interactive')}
                  >
                    <i className="ri-node-tree me-1"></i>
                    Editor Interactivo
                  </button>
                </div>
              </div>
            </div>
            <div className="page-title-right">
              <div className="d-flex align-items-center gap-2">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="sogcsValidation"
                    checked={showSOGCSValidation}
                    onChange={(e) => setShowSOGCSValidation(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="sogcsValidation">
                    <small>Validación SOGCS</small>
                  </label>
                </div>
                <ol className="breadcrumb m-0">
                  <li className="breadcrumb-item">
                    <a href="/dashboard">Inicio</a>
                  </li>
                  <li className="breadcrumb-item">Organización</li>
                  <li className="breadcrumb-item active">Organigrama</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      {viewMode === 'interactive' ? (
        // Editor Interactivo
        <div className="row">
          <div className="col-12">
            <InteractiveOrgChart 
              data={orgData.length > 0 ? orgData : undefined}
              showSOGCSValidation={showSOGCSValidation}
              editable={true}
              onNodeUpdate={handleNodeUpdate}
              onStructureChange={handleStructureChange}
              className="w-100"
            />
          </div>
        </div>
      ) : (
        // Dashboard View
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="avatar-xs">
                      <div className="avatar-title bg-primary rounded-circle">
                        <i className="ri-organization-chart text-white font-size-16"></i>
                      </div>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="card-title mb-1">Sistema de Organigramas</h5>
                    <p className="text-muted mb-0">
                      Gestión completa de organigramas organizacionales con cumplimiento SOGCS
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm"
                      onClick={() => setViewMode('interactive')}
                    >
                      <i className="ri-add-line align-middle me-1"></i>
                      Crear Organigrama
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  {/* Panel Izquierdo - Navegación */}
                  <div className="col-xl-3 col-lg-4">
                    <div className="card bg-light border-0">
                      <div className="card-header bg-transparent">
                        <h6 className="mb-0">
                          <i className="ri-building-line me-2"></i>
                          Estructura Organizacional
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="list-group list-group-flush">
                          {organizationAreas.length > 0 ? (
                            organizationAreas.slice(0, 5).map((area, index) => (
                              <a href="#" key={area.id} className={`list-group-item list-group-item-action ${index === 0 ? 'active' : ''}`}>
                                <div className="d-flex w-100 justify-content-between">
                                  <h6 className="mb-1">{area.name}</h6>
                                  <small className="text-muted">Nivel {area.hierarchy_level || '1'}</small>
                                </div>
                                <p className="mb-1">{area.description || 'Sin descripción'}</p>
                                <small>{area.positions?.length || 0} cargos</small>
                              </a>
                            ))
                          ) : (
                            <div className="text-center py-3">
                              <small className="text-muted">No hay áreas configuradas</small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Indicadores SOGCS */}
                    {showSOGCSValidation && (
                      <div className="card mt-3">
                        <div className="card-header">
                          <h6 className="mb-0">
                            <i className="ri-shield-check-line me-2 text-success"></i>
                            Cumplimiento SOGCS
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-6">
                              <div className="text-center">
                                <div className={`font-size-24 ${currentChart?.compliance_status?.summary?.score >= 90 ? 'text-success' : currentChart?.compliance_status?.summary?.score >= 75 ? 'text-warning' : 'text-danger'}`}>
                                  {currentChart?.compliance_status?.summary?.score || 0}%
                                </div>
                                <p className="text-muted mb-0 font-size-12">Estructura</p>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center">
                                <div className={`font-size-24 ${chartStatistics && (100 - chartStatistics.vacancy_rate) >= 85 ? 'text-success' : 'text-warning'}`}>
                                  {chartStatistics ? Math.round(100 - chartStatistics.vacancy_rate) : 0}%
                                </div>
                                <p className="text-muted mb-0 font-size-12">Ocupación</p>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center">
                                <div className="font-size-24 text-info">
                                  {chartStatistics?.critical_positions || 0}
                                </div>
                                <p className="text-muted mb-0 font-size-12">Cargos Críticos</p>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center">
                                <div className={`font-size-24 ${currentChart?.compliance_status?.summary?.score >= 85 ? 'text-success' : currentChart?.compliance_status?.summary?.score >= 70 ? 'text-warning' : 'text-danger'}`}>
                                  {currentChart?.compliance_status?.summary?.score || 0}%
                                </div>
                                <p className="text-muted mb-0 font-size-12">Global</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Panel Principal - Vista Previa */}
                  <div className="col-xl-9 col-lg-8">
                    <div className="card">
                      <div className="card-header">
                        <div className="d-flex align-items-center justify-content-between">
                          <h5 className="card-title mb-0">Vista Previa del Organigrama</h5>
                          <button 
                            type="button" 
                            className="btn btn-primary btn-sm"
                            onClick={() => setViewMode('interactive')}
                          >
                            <i className="ri-eye-line me-1"></i>
                            Ver Editor Completo
                          </button>
                        </div>
                      </div>
                      <div className="card-body" style={{ minHeight: '400px' }}>
                        <InteractiveOrgChart 
                          data={orgData.length > 0 ? orgData : undefined}
                          showSOGCSValidation={showSOGCSValidation}
                          editable={false}
                          className="preview-mode"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas Rápidas - Solo en Dashboard */}
      {viewMode === 'dashboard' && (
        <div className="row">
          <div className="col-xl-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex">
                  <div className="flex-shrink-0">
                    <div className="avatar-sm rounded-circle bg-primary-subtle">
                      <span className="avatar-title text-primary rounded-circle font-size-16">
                        <i className="ri-building-line"></i>
                      </span>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="mb-1">Total Áreas</h6>
                    <b className="font-size-24 mb-0">{chartStatistics?.areas_count || 0}</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex">
                  <div className="flex-shrink-0">
                    <div className="avatar-sm rounded-circle bg-success-subtle">
                      <span className="avatar-title text-success rounded-circle font-size-16">
                        <i className="ri-user-3-line"></i>
                      </span>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="mb-1">Total Cargos</h6>
                    <b className="font-size-24 mb-0">{chartStatistics?.total_positions || 0}</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex">
                  <div className="flex-shrink-0">
                    <div className="avatar-sm rounded-circle bg-info-subtle">
                      <span className="avatar-title text-info rounded-circle font-size-16">
                        <i className="ri-team-line"></i>
                      </span>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="mb-1">Cargos Ocupados</h6>
                    <b className="font-size-24 mb-0">{chartStatistics?.filled_positions || 0}</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6">
            <div className="card">
              <div className="card-body">
                <div className="d-flex">
                  <div className="flex-shrink-0">
                    <div className="avatar-sm rounded-circle bg-warning-subtle">
                      <span className="avatar-title text-warning rounded-circle font-size-16">
                        <i className="ri-shield-check-line"></i>
                      </span>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h6 className="mb-1">Cumplimiento</h6>
                    <b className="font-size-24 mb-0">{chartStatistics?.compliance_score || 0}%</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleOrganizationalChart;