/**
 * Componente simplificado para organigramas organizacionales
 * Versión funcional para ZentraQMS con integración d3-org-chart
 */

import React, { useState } from 'react';
import InteractiveOrgChart from '../../components/organizational-chart/InteractiveOrgChart';

const SimpleOrganizationalChart: React.FC = () => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'interactive'>('dashboard');
  const [showSOGCSValidation, setShowSOGCSValidation] = useState(true);
  const [orgData, setOrgData] = useState<any[]>([]);

  // Función para manejar cambios en la estructura
  const handleStructureChange = (newData: any[]) => {
    setOrgData(newData);
    console.log('Estructura actualizada:', newData);
  };

  // Función para manejar actualización de nodos individuales
  const handleNodeUpdate = (node: any) => {
    console.log('Nodo actualizado:', node);
  };

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
                          <a href="#" className="list-group-item list-group-item-action active">
                            <div className="d-flex w-100 justify-content-between">
                              <h6 className="mb-1">Dirección General</h6>
                              <small className="text-muted">Nivel 1</small>
                            </div>
                            <p className="mb-1">Máximo nivel jerárquico</p>
                            <small>1 cargo</small>
                          </a>
                          <a href="#" className="list-group-item list-group-item-action">
                            <div className="d-flex w-100 justify-content-between">
                              <h6 className="mb-1">Dirección Médica</h6>
                              <small className="text-muted">Nivel 2</small>
                            </div>
                            <p className="mb-1">Área asistencial principal</p>
                            <small>3 cargos</small>
                          </a>
                          <a href="#" className="list-group-item list-group-item-action">
                            <div className="d-flex w-100 justify-content-between">
                              <h6 className="mb-1">Área de Calidad</h6>
                              <small className="text-muted">Nivel 2</small>
                            </div>
                            <p className="mb-1">Gestión de calidad y SOGCS</p>
                            <small>2 cargos</small>
                          </a>
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
                                <div className="font-size-24 text-success">95%</div>
                                <p className="text-muted mb-0 font-size-12">Estructura</p>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center">
                                <div className="font-size-24 text-warning">75%</div>
                                <p className="text-muted mb-0 font-size-12">Comités</p>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center">
                                <div className="font-size-24 text-success">100%</div>
                                <p className="text-muted mb-0 font-size-12">Cargos Críticos</p>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center">
                                <div className="font-size-24 text-info">88%</div>
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
                    <b className="font-size-24 mb-0">8</b>
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
                    <b className="font-size-24 mb-0">24</b>
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
                    <h6 className="mb-1">Comités Activos</h6>
                    <b className="font-size-24 mb-0">6</b>
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
                    <b className="font-size-24 mb-0">88%</b>
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