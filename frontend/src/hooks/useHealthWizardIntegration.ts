/**
 * Hook for Health Wizard Integration
 * 
 * Manages health-specific wizard logic and data flow
 */
import { useState, useEffect, useCallback } from 'react';
import { detectHealthSector, suggestHealthClassification } from '../utils/healthSectorDetection';

// Types
interface HealthOrganizationData {
  codigo_prestador: string;
  verificado_reps: boolean;
  fecha_verificacion_reps?: string;
  datos_reps?: Record<string, unknown>;
  naturaleza_juridica: string;
  tipo_prestador: string;
  nivel_complejidad: string;
  representante_tipo_documento: string;
  representante_numero_documento: string;
  representante_nombre_completo: string;
  representante_telefono: string;
  representante_email: string;
  fecha_habilitacion?: string;
  resolucion_habilitacion?: string;
  registro_especial?: string;
  observaciones_salud?: string;
}

interface SelectedService {
  codigo_servicio: string;
  nombre_servicio: string;
  grupo_servicio: string;
  fecha_habilitacion?: string;
  fecha_vencimiento?: string;
  modalidad?: string;
  observaciones?: string;
}

interface OrganizationWizardData {
  name?: string;
  razon_social?: string;
  sector_template?: string;
  tipo_organizacion?: string;
  descripcion?: string;
  email?: string;
  website?: string;
}

interface UseHealthWizardIntegrationReturn {
  // Health detection
  isHealthSector: boolean;
  healthDetectionResult: ReturnType<typeof detectHealthSector> | null;
  
  // Health data management
  healthData: Partial<HealthOrganizationData>;
  healthErrors: Partial<HealthOrganizationData>;
  updateHealthData: (data: Partial<HealthOrganizationData>) => void;
  resetHealthData: () => void;
  
  // Services management
  selectedServices: SelectedService[];
  updateSelectedServices: (services: SelectedService[]) => void;
  addService: (service: SelectedService) => void;
  removeService: (codigo: string) => void;
  clearServices: () => void;
  
  // Validation
  validateHealthData: () => Partial<HealthOrganizationData>;
  validateServices: () => string[];
  isHealthDataComplete: boolean;
  isServicesComplete: boolean;
  
  // Auto-suggestions
  applySuggestions: () => void;
  getSuggestions: () => Partial<HealthOrganizationData>;
  
  // Integration utilities
  shouldShowHealthSteps: (currentStep: number, sector?: string) => boolean;
  getHealthStepIndex: (baseSteps: number) => number;
  
  // Persistence
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  clearLocalStorage: () => void;
}

export const useHealthWizardIntegration = (
  organizationData: OrganizationWizardData
): UseHealthWizardIntegrationReturn => {
  // Health sector detection
  const [isHealthSector, setIsHealthSector] = useState(false);
  const [healthDetectionResult, setHealthDetectionResult] = useState<ReturnType<typeof detectHealthSector> | null>(null);
  
  // Health organization data
  const [healthData, setHealthData] = useState<Partial<HealthOrganizationData>>({});
  const [healthErrors, setHealthErrors] = useState<Partial<HealthOrganizationData>>({});
  
  // Health services data
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  
  // Local storage keys
  const HEALTH_DATA_KEY = 'wizard-health-data';
  const HEALTH_SERVICES_KEY = 'wizard-health-services';
  
  // Detect health sector when organization data changes
  useEffect(() => {
    const detection = detectHealthSector(organizationData);
    setHealthDetectionResult(detection);
    setIsHealthSector(detection.isHealthSector || organizationData.sector_template === 'salud');
    
    // Auto-apply suggestions only if we haven't already set health data
    if (detection.isHealthSector && detection.confidence > 0.8 && detection.suggestions && 
        !healthData.naturaleza_juridica) {
      const suggestions = suggestHealthClassification(
        organizationData.name || organizationData.razon_social || '',
        organizationData.tipo_organizacion
      );
      
      setHealthData(prev => ({
        ...prev,
        naturaleza_juridica: suggestions.naturaleza_juridica,
        tipo_prestador: suggestions.tipo_prestador,
        nivel_complejidad: suggestions.nivel_complejidad,
        ...detection.suggestions
      }));
    }
  }, [organizationData.name, organizationData.razon_social, organizationData.sector_template, organizationData.tipo_organizacion, healthData.naturaleza_juridica]);
  
  // Health data management
  const updateHealthData = useCallback((data: Partial<HealthOrganizationData>) => {
    setHealthData(prev => ({ ...prev, ...data }));
    setHealthErrors(prev => {
      const newErrors = { ...prev };
      // Clear errors for updated fields
      Object.keys(data).forEach(key => {
        delete newErrors[key as keyof HealthOrganizationData];
      });
      return newErrors;
    });
  }, []);
  
  const resetHealthData = useCallback(() => {
    setHealthData({});
    setHealthErrors({});
  }, []);
  
  // Services management
  const updateSelectedServices = useCallback((services: SelectedService[]) => {
    setSelectedServices(services);
  }, []);
  
  const addService = useCallback((service: SelectedService) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.codigo_servicio === service.codigo_servicio);
      if (exists) return prev;
      return [...prev, service];
    });
  }, []);
  
  const removeService = useCallback((codigo: string) => {
    setSelectedServices(prev => prev.filter(s => s.codigo_servicio !== codigo));
  }, []);
  
  const clearServices = useCallback(() => {
    setSelectedServices([]);
  }, []);
  
  // Validation
  const validateHealthData = useCallback((): Partial<HealthOrganizationData> => {
    const errors: Partial<HealthOrganizationData> = {};
    
    if (!healthData.codigo_prestador) {
      errors.codigo_prestador = 'El código REPS es requerido';
    } else if (healthData.codigo_prestador.length !== 12) {
      errors.codigo_prestador = 'El código REPS debe tener 12 dígitos';
    }
    
    if (!healthData.naturaleza_juridica) {
      errors.naturaleza_juridica = 'La naturaleza jurídica es requerida';
    }
    
    if (!healthData.tipo_prestador) {
      errors.tipo_prestador = 'El tipo de prestador es requerido';
    }
    
    if (!healthData.nivel_complejidad) {
      errors.nivel_complejidad = 'El nivel de complejidad es requerido';
    }
    
    if (!healthData.representante_tipo_documento) {
      errors.representante_tipo_documento = 'El tipo de documento es requerido';
    }
    
    if (!healthData.representante_numero_documento) {
      errors.representante_numero_documento = 'El número de documento es requerido';
    }
    
    if (!healthData.representante_nombre_completo) {
      errors.representante_nombre_completo = 'El nombre del representante es requerido';
    }
    
    if (!healthData.representante_telefono) {
      errors.representante_telefono = 'El teléfono es requerido';
    }
    
    if (!healthData.representante_email) {
      errors.representante_email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(healthData.representante_email)) {
      errors.representante_email = 'El email no tiene un formato válido';
    }
    
    setHealthErrors(errors);
    return errors;
  }, [healthData]);
  
  const validateServices = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (selectedServices.length === 0) {
      errors.push('Debe seleccionar al menos un servicio de salud');
    }
    
    // Validate that services are compatible with complexity level
    if (healthData.nivel_complejidad && selectedServices.length > 0) {
      const complexityMap: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };
      const orgLevel = complexityMap[healthData.nivel_complejidad] || 0;
      
      const incompatibleServices = selectedServices.filter(service => {
        // This would require service complexity data from the backend
        // For now, we'll do basic validation
        return false;
      });
      
      if (incompatibleServices.length > 0) {
        errors.push(`Algunos servicios no son compatibles con el nivel de complejidad ${healthData.nivel_complejidad}`);
      }
    }
    
    return errors;
  }, [selectedServices, healthData.nivel_complejidad]);
  
  // Computed properties
  const isHealthDataComplete = Object.keys(validateHealthData()).length === 0;
  const isServicesComplete = validateServices().length === 0;
  
  // Auto-suggestions
  const getSuggestions = useCallback((): Partial<HealthOrganizationData> => {
    if (!healthDetectionResult?.suggestions) return {};
    
    const suggestions = suggestHealthClassification(
      organizationData.name || organizationData.razon_social || '',
      organizationData.tipo_organizacion
    );
    
    return {
      ...suggestions,
      ...healthDetectionResult.suggestions
    };
  }, [healthDetectionResult, organizationData]);
  
  const applySuggestions = useCallback(() => {
    const suggestions = getSuggestions();
    updateHealthData(suggestions);
  }, [getSuggestions, updateHealthData]);
  
  // Integration utilities
  const shouldShowHealthSteps = useCallback((currentStep: number, sector?: string) => {
    return isHealthSector || sector === 'salud';
  }, [isHealthSector]);
  
  const getHealthStepIndex = useCallback((baseSteps: number) => {
    // Insert health steps after step 3 (sector selection)
    return baseSteps + 1;
  }, []);
  
  // Persistence
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem(HEALTH_DATA_KEY, JSON.stringify(healthData));
      localStorage.setItem(HEALTH_SERVICES_KEY, JSON.stringify(selectedServices));
    } catch (error) {
      console.warn('Failed to save health data to localStorage:', error);
    }
  }, [healthData, selectedServices]);
  
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedHealthData = localStorage.getItem(HEALTH_DATA_KEY);
      const savedServices = localStorage.getItem(HEALTH_SERVICES_KEY);
      
      if (savedHealthData) {
        const parsedHealthData = JSON.parse(savedHealthData);
        setHealthData(parsedHealthData);
      }
      
      if (savedServices) {
        const parsedServices = JSON.parse(savedServices);
        setSelectedServices(parsedServices);
      }
    } catch (error) {
      console.warn('Failed to load health data from localStorage:', error);
    }
  }, []);
  
  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(HEALTH_DATA_KEY);
      localStorage.removeItem(HEALTH_SERVICES_KEY);
    } catch (error) {
      console.warn('Failed to clear health data from localStorage:', error);
    }
  }, []);
  
  // Auto-save to localStorage when data changes
  useEffect(() => {
    if (isHealthSector && (Object.keys(healthData).length > 0 || selectedServices.length > 0)) {
      try {
        localStorage.setItem(HEALTH_DATA_KEY, JSON.stringify(healthData));
        localStorage.setItem(HEALTH_SERVICES_KEY, JSON.stringify(selectedServices));
      } catch (error) {
        console.warn('Failed to save health data to localStorage:', error);
      }
    }
  }, [healthData, selectedServices, isHealthSector, HEALTH_DATA_KEY, HEALTH_SERVICES_KEY]);
  
  return {
    // Health detection
    isHealthSector,
    healthDetectionResult,
    
    // Health data management
    healthData,
    healthErrors,
    updateHealthData,
    resetHealthData,
    
    // Services management
    selectedServices,
    updateSelectedServices,
    addService,
    removeService,
    clearServices,
    
    // Validation
    validateHealthData,
    validateServices,
    isHealthDataComplete,
    isServicesComplete,
    
    // Auto-suggestions
    applySuggestions,
    getSuggestions,
    
    // Integration utilities
    shouldShowHealthSteps,
    getHealthStepIndex,
    
    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage
  };
};