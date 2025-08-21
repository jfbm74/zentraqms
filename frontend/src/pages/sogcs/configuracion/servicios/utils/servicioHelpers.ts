/**
 * Helper utilities for servicios
 */

import type { 
  EstadoServicio, 
  ModalidadServicio, 
  ComplejidadServicio, 
  CategoriaServicio 
} from '../../../../../types/servicios';

// Label mapping functions
export const getEstadoLabel = (estado: EstadoServicio): string => {
  switch (estado) {
    case 'activo':
      return 'Activo';
    case 'inactivo':
      return 'Inactivo';
    case 'suspendido':
      return 'Suspendido';
    case 'en_proceso':
      return 'En Proceso';
    default:
      return estado || 'N/A';
  }
};

export const getModalidadLabel = (modalidad: ModalidadServicio): string => {
  switch (modalidad) {
    case 'intramural':
      return 'Intramural';
    case 'extramural':
      return 'Extramural';
    case 'telemedicina':
      return 'Telemedicina';
    case 'atencion_domiciliaria':
      return 'Atención Domiciliaria';
    default:
      return modalidad || 'N/A';
  }
};

export const getComplejidadLabel = (complejidad: ComplejidadServicio): string => {
  switch (complejidad) {
    case 'baja':
      return 'Baja Complejidad';
    case 'media':
      return 'Mediana Complejidad';
    case 'alta':
      return 'Alta Complejidad';
    case 'no_aplica':
      return 'No Aplica';
    default:
      return complejidad || 'N/A';
  }
};

export const getCategoriaLabel = (categoria: CategoriaServicio): string => {
  switch (categoria) {
    case 'apoyo_diagnostico':
      return 'Apoyo Diagnóstico y Complementación Terapéutica';
    case 'consulta_externa':
      return 'Consulta Externa';
    case 'hospitalizacion':
      return 'Hospitalización';
    case 'urgencias':
      return 'Urgencias';
    case 'quirurgicos':
      return 'Quirúrgicos';
    case 'promocion_prevencion':
      return 'Promoción y Prevención';
    case 'medicina_especializada':
      return 'Medicina Especializada';
    case 'proteccion_especifica':
      return 'Protección Específica';
    case 'deteccion_temprana':
      return 'Detección Temprana';
    case 'atencion_parto':
      return 'Atención del Parto';
    case 'transporte_asistencial':
      return 'Transporte Asistencial';
    default:
      return categoria || 'N/A';
  }
};

// Badge variant functions for UI styling
export const getEstadoBadgeVariant = (estado: EstadoServicio): string => {
  switch (estado) {
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

export const getComplejidadBadgeVariant = (complejidad: ComplejidadServicio): string => {
  switch (complejidad) {
    case 'baja':
      return 'success';
    case 'media':
      return 'warning';
    case 'alta':
      return 'danger';
    case 'no_aplica':
      return 'light';
    default:
      return 'light';
  }
};

export const getModalidadBadgeVariant = (modalidad: ModalidadServicio): string => {
  switch (modalidad) {
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

// Date formatting
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Fecha inválida';
  }
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
};

// Utility functions
export const isAutorizacionExpired = (expirationDate?: string): boolean => {
  if (!expirationDate) return false;
  
  try {
    const expDate = new Date(expirationDate);
    const today = new Date();
    return expDate < today;
  } catch {
    return false;
  }
};

export const isAutorizacionExpiringSoon = (expirationDate?: string, days: number = 30): boolean => {
  if (!expirationDate) return false;
  
  try {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiration > 0 && daysUntilExpiration <= days;
  } catch {
    return false;
  }
};

export const getDaysUntilExpiration = (expirationDate?: string): number => {
  if (!expirationDate) return -1;
  
  try {
    const expDate = new Date(expirationDate);
    const today = new Date();
    return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return -1;
  }
};

// Export utilities
export const generateExportFilename = (format: 'csv' | 'excel', prefix: string = 'servicios'): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = format === 'excel' ? 'xlsx' : 'csv';
  return `${prefix}_${timestamp}.${extension}`;
};

// Search and filter utilities
export const searchServices = (services: any[], searchTerm: string): any[] => {
  if (!searchTerm.trim()) return services;
  
  const term = searchTerm.toLowerCase();
  return services.filter(service => 
    service.service_name?.toLowerCase().includes(term) ||
    service.service_code?.toLowerCase().includes(term) ||
    service.service_category?.toLowerCase().includes(term) ||
    service.sede_name?.toLowerCase().includes(term) ||
    service.sede_reps_code?.toLowerCase().includes(term)
  );
};

export const filterServicesByStatus = (services: any[], status: EstadoServicio): any[] => {
  return services.filter(service => service.status === status);
};

export const filterServicesByModality = (services: any[], modality: ModalidadServicio): any[] => {
  return services.filter(service => service.modality === modality);
};

export const filterServicesByComplexity = (services: any[], complexity: ComplejidadServicio): any[] => {
  return services.filter(service => service.complexity === complexity);
};

// Statistics utilities
export const calculateServiceStatistics = (services: any[]) => {
  const total = services.length;
  const activeServices = services.filter(s => s.status === 'activo').length;
  const services24Hours = services.filter(s => s.is_24_hours).length;
  const totalCapacity = services.reduce((sum, s) => sum + (s.capacity || 0), 0);
  const averageCapacity = total > 0 ? totalCapacity / total : 0;
  
  const byStatus = services.reduce((acc, service) => {
    acc[service.status] = (acc[service.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byModality = services.reduce((acc, service) => {
    acc[service.modality] = (acc[service.modality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byComplexity = services.reduce((acc, service) => {
    acc[service.complexity] = (acc[service.complexity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total,
    activeServices,
    services24Hours,
    totalCapacity,
    averageCapacity,
    byStatus,
    byModality,
    byComplexity,
  };
};