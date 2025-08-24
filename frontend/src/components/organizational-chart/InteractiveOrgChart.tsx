/**
 * Componente Interactivo de Organigrama usando d3-org-chart
 * ZentraQMS - Sistema de Gestión de Calidad
 */

import React, { useEffect, useRef, useState } from 'react';
import { OrgChart } from 'd3-org-chart';
import * as d3 from 'd3';
import './InteractiveOrgChart.css';

// Tipos para el organigrama
interface OrgNode {
  id: string;
  parentId: string | null;
  name: string;
  title: string;
  department: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
  level: number;
  sogcsCompliance?: {
    required: boolean;
    fulfilled: boolean;
    criticality: 'high' | 'medium' | 'low';
  };
  children?: OrgNode[];
}

interface InteractiveOrgChartProps {
  data?: OrgNode[];
  editable?: boolean;
  showSOGCSValidation?: boolean;
  onNodeUpdate?: (node: OrgNode) => void;
  onStructureChange?: (nodes: OrgNode[]) => void;
  className?: string;
}

// Datos de ejemplo con cumplimiento SOGCS
const defaultOrgData: OrgNode[] = [
  {
    id: '1',
    parentId: null,
    name: 'Dr. Juan Pérez Martínez',
    title: 'Director General',
    department: 'Dirección General',
    email: 'director@zentraqms.com',
    phone: '+57 300 123 4567',
    level: 1,
    sogcsCompliance: {
      required: true,
      fulfilled: true,
      criticality: 'high'
    }
  },
  {
    id: '2',
    parentId: '1',
    name: 'Dra. Ana García López',
    title: 'Directora Médica',
    department: 'Dirección Médica',
    email: 'medica@zentraqms.com',
    phone: '+57 300 234 5678',
    level: 2,
    sogcsCompliance: {
      required: true,
      fulfilled: true,
      criticality: 'high'
    }
  },
  {
    id: '3',
    parentId: '1',
    name: 'Ing. Carlos López Rivera',
    title: 'Coordinador de Calidad',
    department: 'Área de Calidad',
    email: 'calidad@zentraqms.com',
    phone: '+57 300 345 6789',
    level: 2,
    sogcsCompliance: {
      required: true,
      fulfilled: true,
      criticality: 'high'
    }
  },
  {
    id: '4',
    parentId: '1',
    name: 'Lic. María Rodríguez',
    title: 'Gerente Administrativa',
    department: 'Área Administrativa',
    email: 'admin@zentraqms.com',
    phone: '+57 300 456 7890',
    level: 2,
    sogcsCompliance: {
      required: false,
      fulfilled: true,
      criticality: 'medium'
    }
  },
  {
    id: '5',
    parentId: '2',
    name: 'Dr. Roberto Silva',
    title: 'Jefe de Urgencias',
    department: 'Urgencias',
    email: 'urgencias@zentraqms.com',
    phone: '+57 300 567 8901',
    level: 3,
    sogcsCompliance: {
      required: true,
      fulfilled: true,
      criticality: 'high'
    }
  },
  {
    id: '6',
    parentId: '2',
    name: 'Dra. Patricia Moreno',
    title: 'Jefa de Consulta Externa',
    department: 'Consulta Externa',
    email: 'consulta@zentraqms.com',
    phone: '+57 300 678 9012',
    level: 3,
    sogcsCompliance: {
      required: true,
      fulfilled: false,
      criticality: 'high'
    }
  },
  {
    id: '7',
    parentId: '3',
    name: 'Esp. Laura Fernández',
    title: 'Especialista en Procesos',
    department: 'Área de Calidad',
    email: 'procesos@zentraqms.com',
    phone: '+57 300 789 0123',
    level: 3,
    sogcsCompliance: {
      required: true,
      fulfilled: true,
      criticality: 'medium'
    }
  },
  {
    id: '8',
    parentId: '3',
    name: 'Aud. Diego Vargas',
    title: 'Auditor Interno',
    department: 'Área de Calidad',
    email: 'auditoria@zentraqms.com',
    phone: '+57 300 890 1234',
    level: 3,
    sogcsCompliance: {
      required: true,
      fulfilled: true,
      criticality: 'medium'
    }
  }
];

const InteractiveOrgChart: React.FC<InteractiveOrgChartProps> = ({
  data = defaultOrgData,
  editable = true,
  showSOGCSValidation = true,
  onNodeUpdate,
  onStructureChange,
  className = ''
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Función para obtener el color basado en cumplimiento SOGCS
  const getNodeColor = (node: OrgNode) => {
    if (!showSOGCSValidation || !node.sogcsCompliance) {
      return '#0d6efd'; // Azul por defecto
    }

    const { required, fulfilled, criticality } = node.sogcsCompliance;

    if (required && !fulfilled) {
      return criticality === 'high' ? '#dc3545' : '#fd7e14'; // Rojo o naranja
    }

    if (required && fulfilled) {
      return criticality === 'high' ? '#198754' : '#20c997'; // Verde
    }

    return '#6c757d'; // Gris para no requeridos
  };

  // Función para generar avatar SVG
  const generateAvatar = (name: string) => {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="30" fill="#e9ecef"/>
        <text x="30" y="36" text-anchor="middle" font-family="Inter, sans-serif" font-size="18" font-weight="600" fill="#495057">${initials}</text>
      </svg>
    `)}`;
  };

  // Inicializar el organigrama
  useEffect(() => {
    if (!chartRef.current || !data.length) return;

    // Configurar funciones globales para los botones de acción
    if (editable) {
      (window as any).orgChartAddNode = (parentId: string) => {
        const parentNode = data.find(node => node.id === parentId);
        if (parentNode) {
          handleAddNode(parentNode);
        }
      };

      (window as any).orgChartDeleteNode = (nodeId: string) => {
        const nodeToDelete = data.find(node => node.id === nodeId);
        if (nodeToDelete) {
          handleDeleteNode(nodeToDelete);
        }
      };
    }

    const chartInstance = new OrgChart();

    // Configuración del organigrama
    chartInstance
      .container(chartRef.current)
      .data(data)
      .nodeWidth(() => 280)
      .nodeHeight(() => 120)
      .childrenMargin(() => 80)
      .compactMarginBetween(() => 40)
      .compactMarginPair(() => 120)
      .nodeContent((d: any) => {
        const node = d.data as OrgNode;
        const nodeColor = getNodeColor(node);
        const avatar = generateAvatar(node.name);
        
        // Indicador de cumplimiento SOGCS
        const sogcsIndicator = showSOGCSValidation && node.sogcsCompliance ? `
          <div style="
            position: absolute; 
            top: -8px; 
            right: -8px; 
            width: 20px; 
            height: 20px; 
            background: ${node.sogcsCompliance.required && !node.sogcsCompliance.fulfilled ? '#dc3545' : '#198754'}; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border: 2px solid white;
            font-size: 10px;
            color: white;
          ">
            ${node.sogcsCompliance.required && !node.sogcsCompliance.fulfilled ? '!' : '✓'}
          </div>
        ` : '';

        return `
          <div style="
            background: white;
            border: 2px solid ${nodeColor};
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            font-family: 'Inter', sans-serif;
            position: relative;
            cursor: ${editable ? 'pointer' : 'default'};
            width: 280px;
            height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          " 
          >
            ${sogcsIndicator}
            
            <div style="flex: 1; display: flex; flex-direction: column;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <img src="${avatar}" 
                     style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; border: 2px solid ${nodeColor}; flex-shrink: 0;" 
                     alt="${node.name}" />
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 600; font-size: 13px; color: #1f2937; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${node.name}
                  </div>
                  <div style="font-size: 11px; color: ${nodeColor}; font-weight: 500; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${node.title}
                  </div>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <i class="ri-building-line" style="color: #6b7280; margin-right: 6px; font-size: 11px; flex-shrink: 0;"></i>
                <span style="font-size: 10px; color: #6b7280; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${node.department}</span>
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 2px;">
                ${node.email ? `
                <div style="display: flex; align-items: center;">
                  <i class="ri-mail-line" style="color: #6b7280; margin-right: 6px; font-size: 10px; flex-shrink: 0;"></i>
                  <span style="font-size: 9px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${node.email}</span>
                </div>
                ` : ''}
                
                ${node.phone ? `
                <div style="display: flex; align-items: center;">
                  <i class="ri-phone-line" style="color: #6b7280; margin-right: 6px; font-size: 10px; flex-shrink: 0;"></i>
                  <span style="font-size: 9px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${node.phone}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            ${editable ? `
            <div class="node-action-buttons" style="
              position: absolute; 
              top: 6px; 
              right: 6px; 
              display: flex; 
              gap: 3px; 
              opacity: 0;
              transition: opacity 0.2s ease;
              z-index: 10;
              pointer-events: none;
            ">
              <button onclick="event.stopPropagation(); window.orgChartAddNode('${node.id}')" 
                      style="
                        width: 22px; 
                        height: 22px; 
                        border: none; 
                        border-radius: 4px; 
                        background: #198754; 
                        color: white; 
                        cursor: pointer; 
                        font-size: 11px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                        pointer-events: auto;
                      " 
                      title="Agregar subordinado">
                +
              </button>
              ${node.parentId !== null ? `
              <button onclick="event.stopPropagation(); window.orgChartDeleteNode('${node.id}')" 
                      style="
                        width: 22px; 
                        height: 22px; 
                        border: none; 
                        border-radius: 4px; 
                        background: #dc3545; 
                        color: white; 
                        cursor: pointer; 
                        font-size: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                        pointer-events: auto;
                      " 
                      title="Eliminar cargo">
                ×
              </button>
              ` : ''}
            </div>
            ` : ''}
          </div>
        `;
      })
      .onNodeClick((d: any) => {
        const node = d.data as OrgNode;
        setSelectedNode(node);
        if (onNodeUpdate && editable) {
          console.log('Nodo seleccionado:', node);
        }
      });

    // Aplicar la configuración y renderizar
    chartInstance.render();

    setChart(chartInstance);

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current.innerHTML = '';
      }
    };
  }, [data, showSOGCSValidation, editable]);

  // Función para centrar el organigrama
  const centerChart = () => {
    if (chart) {
      chart.fit();
    }
  };

  // Función para hacer zoom
  const handleZoom = (factor: number) => {
    if (chart) {
      const currentZoom = chart.getChartState().scale;
      chart.setScale(currentZoom * factor);
    }
  };

  // Función para manejar cambios en la estructura del organigrama
  const handleNodeDrop = (draggedNode: OrgNode, targetNode: OrgNode) => {
    if (!editable || !onStructureChange) return;

    // Crear una copia de los datos actuales
    const updatedData = [...data];
    
    // Encontrar el nodo arrastrado y actualizar su parentId
    const draggedIndex = updatedData.findIndex(node => node.id === draggedNode.id);
    if (draggedIndex !== -1) {
      updatedData[draggedIndex] = {
        ...updatedData[draggedIndex],
        parentId: targetNode.id,
        level: targetNode.level + 1
      };
    }

    // Notificar el cambio
    onStructureChange(updatedData);
    
    console.log(`Nodo ${draggedNode.name} movido bajo ${targetNode.name}`);
  };

  // Función para agregar un nuevo nodo
  const handleAddNode = (parentNode: OrgNode) => {
    if (!editable || !onStructureChange) return;

    const newNode: OrgNode = {
      id: `new_${Date.now()}`,
      parentId: parentNode.id,
      name: 'Nuevo Cargo',
      title: 'Definir cargo',
      department: parentNode.department,
      level: parentNode.level + 1,
      sogcsCompliance: {
        required: false,
        fulfilled: false,
        criticality: 'low'
      }
    };

    const updatedData = [...data, newNode];
    onStructureChange(updatedData);
  };

  // Función para eliminar un nodo
  const handleDeleteNode = (nodeToDelete: OrgNode) => {
    if (!editable || !onStructureChange || nodeToDelete.parentId === null) return;

    const updatedData = data.filter(node => 
      node.id !== nodeToDelete.id && node.parentId !== nodeToDelete.id
    );
    
    onStructureChange(updatedData);
    setSelectedNode(null);
  };

  return (
    <div className={`interactive-org-chart ${className} ${isFullscreen ? 'org-chart-fullscreen' : ''}`}>
      {/* Controles de navegación */}
      <div className="chart-controls mb-3" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '12px 16px',
        background: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px'
      }}>
        <div>
          <h5 className="mb-0" style={{ color: '#495057', fontWeight: 600 }}>
            Organigrama Interactivo
          </h5>
          <small className="text-muted">
            {showSOGCSValidation ? 'Con validación SOGCS' : 'Vista básica'} • {data.length} posiciones
          </small>
        </div>
        
        <div className="btn-group" role="group">
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => handleZoom(1.2)}
            title="Acercar"
          >
            <i className="ri-zoom-in-line"></i>
          </button>
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => handleZoom(0.8)}
            title="Alejar"
          >
            <i className="ri-zoom-out-line"></i>
          </button>
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-sm"
            onClick={centerChart}
            title="Centrar"
          >
            <i className="ri-focus-3-line"></i>
          </button>
          <button 
            type="button" 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            <i className={`ri-${isFullscreen ? 'fullscreen-exit' : 'fullscreen'}-line`}></i>
          </button>
        </div>
      </div>

      {/* Leyenda SOGCS */}
      {showSOGCSValidation && (
        <div className="sogcs-legend mb-3" style={{
          display: 'flex',
          gap: '16px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
          border: '1px solid #bbdefb',
          borderRadius: '8px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: '#198754', borderRadius: '50%' }}></div>
            <span>SOGCS Cumplido</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: '#dc3545', borderRadius: '50%' }}></div>
            <span>Requiere Atención</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: '#6c757d', borderRadius: '50%' }}></div>
            <span>No Requerido</span>
          </div>
        </div>
      )}

      {/* Contenedor del organigrama */}
      <div 
        ref={chartRef}
        className="org-chart-container"
        style={{ 
          width: '100%', 
          height: isFullscreen ? 'calc(100vh - 120px)' : '600px', 
          background: '#fafbfc',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />

      {/* Panel de información del nodo seleccionado */}
      {selectedNode && editable && (
        <div className="selected-node-info mt-3" style={{
          padding: '16px',
          background: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h6 className="mb-0">Información del Cargo</h6>
            <button 
              type="button" 
              className="btn-close btn-sm"
              onClick={() => setSelectedNode(null)}
            ></button>
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div className="mb-2">
                <strong>Nombre:</strong> {selectedNode.name}
              </div>
              <div className="mb-2">
                <strong>Cargo:</strong> {selectedNode.title}
              </div>
              <div className="mb-2">
                <strong>Departamento:</strong> {selectedNode.department}
              </div>
            </div>
            <div className="col-md-6">
              {selectedNode.sogcsCompliance && (
                <div className="sogcs-compliance-info">
                  <strong>Cumplimiento SOGCS:</strong>
                  <div className={`badge ms-2 ${
                    selectedNode.sogcsCompliance.required && !selectedNode.sogcsCompliance.fulfilled 
                      ? 'bg-danger' 
                      : selectedNode.sogcsCompliance.required && selectedNode.sogcsCompliance.fulfilled
                        ? 'bg-success'
                        : 'bg-secondary'
                  }`}>
                    {selectedNode.sogcsCompliance.required 
                      ? (selectedNode.sogcsCompliance.fulfilled ? 'Cumplido' : 'Pendiente')
                      : 'No Requerido'
                    }
                  </div>
                  <div className="mt-1">
                    <small className="text-muted">
                      Criticidad: {selectedNode.sogcsCompliance.criticality === 'high' ? 'Alta' : 
                                   selectedNode.sogcsCompliance.criticality === 'medium' ? 'Media' : 'Baja'}
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {editable && (
            <div className="mt-3 text-end">
              <button className="btn btn-outline-primary btn-sm me-2">
                <i className="ri-edit-line me-1"></i>
                Editar
              </button>
              <button className="btn btn-outline-danger btn-sm">
                <i className="ri-delete-bin-line me-1"></i>
                Eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveOrgChart;