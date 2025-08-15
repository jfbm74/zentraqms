/**
 * SUH Integration Service
 * 
 * Service for integrating with the Colombian Ministry of Health's
 * Sistema Único de Habilitación (SUH) portal through our backend.
 */

import { apiClient } from '../api/endpoints';

export interface SUHValidationResult {
  is_valid: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface SUHExtractionStats {
  total_sedes: number;
  total_servicios: number;
  extraction_time: number;
}

export interface SUHPrestadorInfo {
  razon_social: string;
  tipo_prestador: string;
  naturaleza_juridica: string;
}

export interface SUHNitValidationResponse {
  valid: boolean;
  exists: boolean;
  prestador_info?: SUHPrestadorInfo;
  message: string;
}

export interface SUHExtractionResponse {
  success: boolean;
  extraction_id: string;
  data: Record<string, any>;
  raw_suh_data: Record<string, any>;
  validation: SUHValidationResult;
  stats: SUHExtractionStats;
  message: string;
}

export interface SUHExtractionStatus {
  extraction_id: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  progress: {
    sedes_extracted: number;
    servicios_extracted: number;
  };
}

export interface SUHSyncSchedule {
  schedule_id: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  next_sync_date: string;
  auto_resolve_minor: boolean;
  message: string;
}

export interface SUHExtractionRecord {
  extraction_id: string;
  status: string;
  nit_consulta: string;
  started_at: string;
  completed_at?: string;
  total_sedes_extracted: number;
  total_servicios_extracted: number;
  error_message?: string;
  created_by?: string;
}

export interface SUHExtractionsListResponse {
  extractions: SUHExtractionRecord[];
  total_count: number;
}

class SUHService {
  private baseURL = '/api/v1';

  /**
   * Validate if a NIT exists in the SUH portal (quick check)
   */
  async validateNIT(nit: string, dv?: string): Promise<SUHNitValidationResponse> {
    try {
      const params: Record<string, string> = { nit };
      if (dv) {
        params.dv = dv;
      }
      
      const response = await apiClient.get(`${this.baseURL}/suh/validate-nit/`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error validating NIT:', error);
      throw new Error('Error validando NIT en portal SUH');
    }
  }

  /**
   * Extract organization data from SUH portal using new scraper
   */
  async extractSUHData(nit: string, organizationId: string, dv?: string): Promise<SUHExtractionResponse> {
    try {
      // Parse NIT and dv if provided in nit parameter
      let cleanNit = nit;
      let digitoVerificacion = dv;
      
      if (nit.includes('-') && !dv) {
        const parts = nit.split('-');
        cleanNit = parts[0];
        digitoVerificacion = parts[1];
      }
      
      if (!digitoVerificacion) {
        throw new Error('Dígito de verificación es requerido');
      }
      
      const response = await apiClient.post(`${this.baseURL}/suh/extract/`, {
        nit: cleanNit,
        digito_verificacion: digitoVerificacion,
        organization_id: organizationId
      });
      return response.data;
    } catch (error: any) {
      console.error('Error extracting SUH data:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Error en los datos proporcionados');
      } else if (error.response?.status === 404) {
        throw new Error('NIT no encontrado en el portal SUH');
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor al extraer datos SUH');
      }
      
      throw new Error('Error extrayendo datos del portal SUH');
    }
  }

  /**
   * Get status of an SUH extraction process
   */
  async getExtractionStatus(extractionId: string): Promise<SUHExtractionStatus> {
    try {
      const response = await apiClient.get(`${this.baseURL}/suh/status/${extractionId}/`);
      return response.data;
    } catch (error) {
      console.error('Error getting extraction status:', error);
      throw new Error('Error obteniendo estado de extracción');
    }
  }

  /**
   * Schedule automatic synchronization with SUH portal
   */
  async scheduleSync(
    organizationId: string,
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'WEEKLY',
    autoResolveMinor: boolean = true,
    notificationEmails: string[] = []
  ): Promise<SUHSyncSchedule> {
    try {
      const response = await apiClient.post(`${this.baseURL}/suh/schedule/`, {
        organization_id: organizationId,
        frequency,
        auto_resolve_minor: autoResolveMinor,
        notification_emails: notificationEmails
      });
      return response.data;
    } catch (error) {
      console.error('Error scheduling sync:', error);
      throw new Error('Error programando sincronización automática');
    }
  }

  /**
   * List all SUH extractions for an organization
   */
  async listExtractions(organizationId: string): Promise<SUHExtractionsListResponse> {
    try {
      const response = await apiClient.get(`${this.baseURL}/suh/extractions/${organizationId}/`);
      return response.data;
    } catch (error) {
      console.error('Error listing extractions:', error);
      throw new Error('Error listando extracciones SUH');
    }
  }

  /**
   * Poll extraction status until completion
   */
  async pollExtractionStatus(
    extractionId: string,
    onProgress?: (status: SUHExtractionStatus) => void,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<SUHExtractionStatus> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const poll = async () => {
        try {
          attempts++;
          const status = await this.getExtractionStatus(extractionId);
          
          if (onProgress) {
            onProgress(status);
          }
          
          if (status.status === 'COMPLETED') {
            resolve(status);
          } else if (status.status === 'FAILED') {
            reject(new Error(status.error_message || 'Extracción falló'));
          } else if (attempts >= maxAttempts) {
            reject(new Error('Tiempo de espera agotado para la extracción'));
          } else {
            // Continue polling
            setTimeout(poll, intervalMs);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }

  /**
   * Format extracted data for health organization form
   */
  formatForHealthForm(extractedData: Record<string, any>): Record<string, any> {
    return {
      // Basic REPS info
      codigo_prestador: extractedData.codigo_prestador,
      verificado_reps: extractedData.verificado_reps,
      fecha_verificacion_reps: extractedData.fecha_verificacion_reps,
      datos_reps: extractedData.datos_reps,
      
      // Classification
      naturaleza_juridica: extractedData.naturaleza_juridica,
      tipo_prestador: extractedData.tipo_prestador,
      nivel_complejidad: extractedData.nivel_complejidad,
      
      // Legal representative
      representante_tipo_documento: extractedData.representante_tipo_documento,
      representante_numero_documento: extractedData.representante_numero_documento,
      representante_nombre_completo: extractedData.representante_nombre_completo,
      representante_telefono: extractedData.representante_telefono,
      representante_email: extractedData.representante_email,
      
      // Qualification information
      fecha_habilitacion: extractedData.fecha_habilitacion,
      resolucion_habilitacion: extractedData.resolucion_habilitacion,
      registro_especial: extractedData.registro_especial,
      
      // Additional information extracted from SUH
      observaciones_salud: `Datos extraídos automáticamente del portal SUH el ${new Date().toLocaleDateString('es-CO')}. Incluye ${extractedData.sedes_data?.length || 0} sedes y ${extractedData.servicios_data?.length || 0} servicios habilitados.`
    };
  }

  /**
   * Extract NIT from various formats
   */
  extractNIT(input: string): string {
    // Remove common formatting (spaces, dots, hyphens)
    const cleaned = input.replace(/[\s\.\-]/g, '');
    
    // Extract only numbers
    const numbers = cleaned.replace(/\D/g, '');
    
    // Colombian NITs are typically 9-10 digits
    if (numbers.length >= 9 && numbers.length <= 10) {
      return numbers;
    }
    
    throw new Error('Formato de NIT inválido. Debe contener 9-10 dígitos.');
  }

  /**
   * Calculate NIT verification digit (Colombian algorithm)
   */
  calculateVerificationDigit(nit: string): string {
    const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    let sum = 0;
    
    for (let i = 0; i < nit.length; i++) {
      sum += parseInt(nit[i]) * weights[i];
    }
    
    const remainder = sum % 11;
    const digit = remainder < 2 ? remainder : 11 - remainder;
    
    return digit.toString();
  }

  /**
   * Validate NIT format and check digit
   */
  validateNITFormat(nit: string): { valid: boolean; message: string; cleanNIT?: string } {
    try {
      const cleanNIT = this.extractNIT(nit);
      
      if (cleanNIT.length < 9) {
        return { valid: false, message: 'NIT debe tener al menos 9 dígitos' };
      }
      
      // For Colombian NITs, we could validate the check digit here
      // but for now we'll just validate format
      
      return { 
        valid: true, 
        message: 'Formato de NIT válido',
        cleanNIT 
      };
    } catch (error) {
      return { 
        valid: false, 
        message: error instanceof Error ? error.message : 'Formato de NIT inválido' 
      };
    }
  }
}

// Export singleton instance
export const suhService = new SUHService();
export default suhService;