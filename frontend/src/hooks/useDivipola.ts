/**
 * useDivipola Hook
 * 
 * Custom hook for managing Colombian administrative division data (DIVIPOLA).
 */

import { useState, useEffect } from 'react';
import { divipolaService, Department, Municipality } from '../services/divipolaService';

interface UseDivipolaState {
  departments: Department[];
  municipalities: Municipality[];
  loadingDepartments: boolean;
  loadingMunicipalities: boolean;
  error: string | null;
}

interface UseDivipolaActions {
  loadMunicipalities: (departmentCode: string) => Promise<void>;
  searchMunicipalities: (query: string, departmentCode?: string) => Promise<Municipality[]>;
  getDepartmentName: (code: string) => string | undefined;
  getMunicipalityName: (code: string) => string | undefined;
  clearMunicipalities: () => void;
}

interface UseDivipolaReturn extends UseDivipolaState, UseDivipolaActions {}

export const useDivipola = (): UseDivipolaReturn => {
  const [state, setState] = useState<UseDivipolaState>({
    departments: [],
    municipalities: [],
    loadingDepartments: true,
    loadingMunicipalities: false,
    error: null,
  });

  // Load departments on mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setState(prev => ({ ...prev, loadingDepartments: true, error: null }));
        const deps = await divipolaService.getDepartments();
        setState(prev => ({ ...prev, departments: deps, loadingDepartments: false }));
      } catch (error) {
        console.error('Error loading departments:', error);
        
        // Fallback to static departments data
        const fallbackDepartments: Department[] = [
          { code: "05", name: "Antioquia" },
          { code: "08", name: "Atlántico" },
          { code: "11", name: "Bogotá D.C." },
          { code: "13", name: "Bolívar" },
          { code: "15", name: "Boyacá" },
          { code: "17", name: "Caldas" },
          { code: "18", name: "Caquetá" },
          { code: "19", name: "Cauca" },
          { code: "20", name: "Cesar" },
          { code: "23", name: "Córdoba" },
          { code: "25", name: "Cundinamarca" },
          { code: "27", name: "Chocó" },
          { code: "41", name: "Huila" },
          { code: "44", name: "La Guajira" },
          { code: "47", name: "Magdalena" },
          { code: "50", name: "Meta" },
          { code: "52", name: "Nariño" },
          { code: "54", name: "Norte de Santander" },
          { code: "63", name: "Quindío" },
          { code: "66", name: "Risaralda" },
          { code: "68", name: "Santander" },
          { code: "70", name: "Sucre" },
          { code: "73", name: "Tolima" },
          { code: "76", name: "Valle del Cauca" },
          { code: "81", name: "Arauca" },
          { code: "85", name: "Casanare" },
          { code: "86", name: "Putumayo" },
          { code: "88", name: "Archipiélago de San Andrés, Providencia y Santa Catalina" },
          { code: "91", name: "Amazonas" },
          { code: "94", name: "Guainía" },
          { code: "95", name: "Guaviare" },
          { code: "97", name: "Vaupés" },
          { code: "99", name: "Vichada" },
        ];
        
        setState(prev => ({
          ...prev,
          departments: fallbackDepartments,
          loadingDepartments: false,
          error: 'Error al cargar departamentos desde el servidor. Usando datos estáticos.',
        }));
      }
    };

    loadDepartments();
  }, []);

  // Actions
  const loadMunicipalities = async (departmentCode: string): Promise<void> => {
    if (!departmentCode) {
      setState(prev => ({ ...prev, municipalities: [] }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loadingMunicipalities: true }));
      const munis = await divipolaService.getMunicipalities(departmentCode);
      setState(prev => ({ 
        ...prev, 
        municipalities: munis, 
        loadingMunicipalities: false 
      }));
    } catch (error) {
      console.error('Error loading municipalities:', error);
      setState(prev => ({ 
        ...prev, 
        municipalities: [], 
        loadingMunicipalities: false,
        error: `Error al cargar municipios para el departamento ${departmentCode}` 
      }));
    }
  };

  const searchMunicipalities = async (
    query: string, 
    departmentCode?: string
  ): Promise<Municipality[]> => {
    try {
      return await divipolaService.searchMunicipalities(query, departmentCode);
    } catch (error) {
      console.error('Error searching municipalities:', error);
      return [];
    }
  };

  const getDepartmentName = (code: string): string | undefined => {
    return state.departments.find(dept => dept.code === code)?.name;
  };

  const getMunicipalityName = (code: string): string | undefined => {
    return state.municipalities.find(muni => muni.code === code)?.name;
  };

  const clearMunicipalities = (): void => {
    setState(prev => ({ ...prev, municipalities: [] }));
  };

  return {
    ...state,
    loadMunicipalities,
    searchMunicipalities,
    getDepartmentName,
    getMunicipalityName,
    clearMunicipalities,
  };
};

export default useDivipola;