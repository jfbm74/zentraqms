import React from 'react';
import { SectorInfo, AUTO_ACTIVATION_RULES, TRANSVERSAL_MODULES, SECTOR_SPECIFIC_MODULES } from '../../../types/wizard.types';

interface ModulePreviewProps {
  selectedSector?: SectorInfo;
  selectedOrgType?: string;
  show: boolean;
}

interface ModuleInfo {
  name: string;
  description: string;
  icon: string;
}

// Mapeo de módulos con información detallada
const MODULE_INFO: Record<string, ModuleInfo> = {
  'DASHBOARD': {
    name: 'Dashboard',
    description: 'Panel principal de control',
    icon: 'ri-dashboard-line'
  },
  'PROCESSES': {
    name: 'Gestión de Procesos',
    description: 'Mapas y caracterizaciones',
    icon: 'ri-flow-chart'
  },
  'DOCUMENTS': {
    name: 'Gestión Documental',
    description: 'Control de documentos',
    icon: 'ri-file-list-line'
  },
  'SUH': {
    name: 'SUH',
    description: 'Sistema Único de Habilitación',
    icon: 'ri-hospital-line'
  },
  'PAMEC': {
    name: 'PAMEC',
    description: 'Programa de Auditoría',
    icon: 'ri-shield-check-line'
  },
  'CLINICAL_SAFETY': {
    name: 'Seguridad del Paciente',
    description: 'Eventos adversos y barreras',
    icon: 'ri-shield-user-line'
  },
  'CAPAS': {
    name: 'CAPAs',
    description: 'Acciones Correctivas y Preventivas',
    icon: 'ri-tools-line'
  },
  'ORGANIZATION': {
    name: 'Mi Organización',
    description: 'Perfil y configuración institucional',
    icon: 'ri-building-4-line'
  },
  'ANALYSIS': {
    name: 'Análisis',
    description: 'DOFA, riesgos e indicadores',
    icon: 'ri-pie-chart-line'
  },
  'DOCUMENTATION': {
    name: 'Documentación',
    description: 'Normograma y gestión documental',
    icon: 'ri-book-open-line'
  },
  'COMMITTEES': {
    name: 'Comités',
    description: 'Comités de calidad y seguridad',
    icon: 'ri-group-line'
  },
  'STRATEGIC_PLANNING': {
    name: 'Planeación Estratégica',
    description: 'Objetivos y configuración general',
    icon: 'ri-compass-3-line'
  },
  'ADMINISTRATION': {
    name: 'Administración',
    description: 'Configuración del sistema',
    icon: 'ri-settings-2-line'
  },
  'USERS': {
    name: 'Gestión de Usuarios',
    description: 'Control de usuarios y accesos',
    icon: 'ri-user-settings-line'
  },
  'ROLES': {
    name: 'Roles y Permisos',
    description: 'Control de acceso y permisos',
    icon: 'ri-shield-keyhole-line'
  },
  'PERMISSIONS': {
    name: 'Permisos',
    description: 'Gestión granular de permisos',
    icon: 'ri-key-2-line'
  },
  'MEMBER_MANAGEMENT': {
    name: 'Gestión de Afiliados',
    description: 'Control de membresías',
    icon: 'ri-group-line'
  },
  'PUBLIC_HEALTH': {
    name: 'Salud Pública',
    description: 'Programas comunitarios',
    icon: 'ri-community-line'
  },
  'PRODUCTION': {
    name: 'Control de Producción',
    description: 'Gestión de líneas productivas',
    icon: 'ri-settings-3-line'
  },
  'QUALITY_CONTROL': {
    name: 'Control de Calidad',
    description: 'Inspección y pruebas',
    icon: 'ri-checkbox-circle-line'
  },
  'FOOD_SAFETY': {
    name: 'Seguridad Alimentaria',
    description: 'HACCP y trazabilidad',
    icon: 'ri-leaf-line'
  },
  'GMP': {
    name: 'Buenas Prácticas',
    description: 'Normas de manufactura',
    icon: 'ri-award-line'
  },
  'PHARMACOVIGILANCE': {
    name: 'Farmacovigilancia',
    description: 'Monitoreo de medicamentos',
    icon: 'ri-medicine-bottle-line'
  },
  'PROJECTS': {
    name: 'Gestión de Proyectos',
    description: 'Planificación y seguimiento',
    icon: 'ri-project-line'
  },
  'SLA': {
    name: 'Acuerdos de Servicio',
    description: 'Niveles de servicio',
    icon: 'ri-contract-line'
  },
  'IT_SERVICE_MANAGEMENT': {
    name: 'Gestión de Servicios TI',
    description: 'ITIL y mesa de ayuda',
    icon: 'ri-computer-line'
  },
  'CLIENT_SATISFACTION': {
    name: 'Satisfacción del Cliente',
    description: 'Encuestas y feedback',
    icon: 'ri-star-line'
  },
  'ACADEMIC': {
    name: 'Gestión Académica',
    description: 'Programas y currículos',
    icon: 'ri-book-open-line'
  },
  'RESEARCH': {
    name: 'Investigación',
    description: 'Proyectos de investigación',
    icon: 'ri-search-eye-line'
  },
  'ACCREDITATION': {
    name: 'Acreditación',
    description: 'Estándares de calidad',
    icon: 'ri-medal-line'
  },
  'STUDENTS': {
    name: 'Gestión Estudiantil',
    description: 'Registro y seguimiento',
    icon: 'ri-graduation-cap-line'
  },
  'EVALUATION': {
    name: 'Evaluación',
    description: 'Calificaciones y competencias',
    icon: 'ri-file-edit-line'
  }
};

const ModulePreview: React.FC<ModulePreviewProps> = ({
  selectedSector,
  selectedOrgType,
  show
}) => {
  if (!show || !selectedSector) {
    return null;
  }

  // Obtener módulos transversales (siempre se muestran)
  const transversalModules = [
    ...TRANSVERSAL_MODULES.DAILY_OPERATIONS,
    ...TRANSVERSAL_MODULES.QUALITY_MANAGEMENT,
    ...TRANSVERSAL_MODULES.CONFIGURATION
  ];

  // Obtener módulos específicos del sector
  let sectorSpecificModules: string[] = [];
  
  if (selectedOrgType && AUTO_ACTIVATION_RULES[selectedSector.id]?.[selectedOrgType]) {
    const allModules = AUTO_ACTIVATION_RULES[selectedSector.id][selectedOrgType];
    // Filtrar solo los módulos específicos del sector (no transversales)
    sectorSpecificModules = allModules.filter(module => !transversalModules.includes(module));
  } else {
    // Si no hay tipo específico seleccionado, mostrar módulos generales del sector
    sectorSpecificModules = SECTOR_SPECIFIC_MODULES[selectedSector.id] || [];
  }

  // Combinar y obtener detalles
  const transversalDetails = transversalModules.map(moduleCode => ({
    code: moduleCode,
    isTransversal: true,
    ...MODULE_INFO[moduleCode] || {
      name: moduleCode,
      description: 'Módulo transversal',
      icon: 'ri-apps-line'
    }
  }));

  const sectorDetails = sectorSpecificModules.map(moduleCode => ({
    code: moduleCode,
    isTransversal: false,
    ...MODULE_INFO[moduleCode] || {
      name: moduleCode,
      description: 'Módulo especializado',
      icon: 'ri-puzzle-line'
    }
  }));

  return (
    <div className="card module-preview">
      <div className="card-header border-bottom">
        <h4 className="card-title mb-0 d-flex align-items-center">
          <i className="ri-eye-line me-2 text-primary"></i>
          Vista Previa de Módulos
        </h4>
        <small className="text-muted">
          {selectedOrgType 
            ? `${selectedSector.name} - ${selectedOrgType}`
            : `Sector ${selectedSector.name}`
          }
        </small>
      </div>
      
      <div className="card-body">
        <div className="mb-3">
          <p className="text-muted mb-2">
            <i className="ri-information-line me-1"></i>
            Al seleccionar este {selectedOrgType ? 'tipo de organización' : 'sector'} se activarán automáticamente:
          </p>
        </div>

        {/* Sistema de Gestión de Calidad (Transversal) */}
        <div className="mb-4">
          <h6 className="text-primary mb-3">
            <i className="ri-apps-line me-1"></i>
            Sistema Transversal (Todos los sectores)
          </h6>
          <div className="row g-2">
            <div className="col-12">
              <div 
                className="module-item d-flex align-items-center p-3 rounded border"
                style={{
                  backgroundColor: 'var(--vz-primary-subtle)',
                  borderColor: 'var(--vz-primary)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(5px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div className="flex-shrink-0 me-3">
                  <div className="avatar-xs">
                    <div className="avatar-title rounded-circle bg-primary text-white">
                      <i className="ri-settings-2-line" style={{ fontSize: '12px' }}></i>
                    </div>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-1 fw-semibold text-dark">Sistema de Gestión de Calidad</h6>
                  <small className="text-primary">Módulos completos de calidad aplicables a todos los sectores</small>
                </div>
                <div className="flex-shrink-0">
                  <span className="badge bg-primary">
                    <i className="ri-check-line me-1"></i>
                    Transversal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Módulos Específicos del Sector */}
        {sectorDetails.length > 0 && (
          <div className="mb-3">
            <h6 className="text-success mb-3">
              <i className="ri-puzzle-line me-1"></i>
              Módulos Especializados - {selectedSector.name}
              {selectedOrgType && <span className="text-muted"> ({selectedOrgType})</span>}
            </h6>
            <div className="row g-2">
              {sectorDetails.map((module, index) => (
                <div key={module.code} className="col-12">
                  <div 
                    className="module-item d-flex align-items-center p-3 rounded border"
                    style={{
                      backgroundColor: 'var(--vz-success-subtle)',
                      borderColor: 'var(--vz-success)',
                      transition: 'all 0.2s ease',
                      animationDelay: `${(transversalDetails.length + index) * 100}ms`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div className="flex-shrink-0 me-3">
                      <div className="avatar-xs">
                        <div className="avatar-title rounded-circle bg-success text-white">
                          <i className={module.icon} style={{ fontSize: '12px' }}></i>
                        </div>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-semibold text-dark">{module.name}</h6>
                      <small className="text-success">{module.description}</small>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="badge bg-success">
                        <i className="ri-check-line me-1"></i>
                        Especializado
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integraciones disponibles */}
        {selectedSector.integrations && selectedSector.integrations.length > 0 && (
          <div className="mt-4 pt-3 border-top">
            <h6 className="mb-2 text-dark">
              <i className="ri-link me-1 text-info"></i>
              Integraciones Disponibles:
            </h6>
            <div className="d-flex flex-wrap gap-1">
              {selectedSector.integrations.map((integration, index) => (
                <span 
                  key={index}
                  className="badge bg-info-subtle text-info"
                  style={{ fontSize: '0.7rem' }}
                >
                  {integration}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Resumen y mensaje informativo */}
        <div className="mt-3 p-3 bg-info-subtle rounded">
          <div className="d-flex align-items-center mb-2">
            <i className="ri-information-line me-2 text-info"></i>
            <strong className="text-info">Resumen de Activación:</strong>
          </div>
          <div className="row text-center">
            <div className="col-6">
              <div className="text-primary">
                <h6 className="mb-0">1</h6>
                <small>Sistema Transversal</small>
              </div>
            </div>
            <div className="col-6">
              <div className="text-success">
                <h6 className="mb-0">{sectorDetails.length}</h6>
                <small>Módulos Especializados</small>
              </div>
            </div>
          </div>
          <hr className="my-2" />
          <small className="text-info d-flex align-items-center">
            <i className="ri-lightbulb-line me-1"></i>
            <strong>Sistema de Gestión de Calidad completo</strong> con módulos especializados para {selectedSector.name}. Podrá personalizar desde la configuración.
          </small>
        </div>
      </div>
    </div>
  );
};

export default ModulePreview;