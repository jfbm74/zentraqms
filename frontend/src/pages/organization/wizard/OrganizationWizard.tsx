/**
 * Organization Configuration Wizard
 * 
 * Main page that combines all wizard steps for organization setup
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthContext } from '../../../contexts/AuthContext';
import WizardContainer from '../../../components/wizard/WizardContainer';
import Step1OrganizationData from '../../../components/wizard/steps/Step1OrganizationData';
import Step2LocationData from '../../../components/wizard/steps/Step2LocationData';
import Step3SectorTemplate from '../../../components/wizard/steps/Step3SectorTemplate';

// Types
interface OrganizationData {
  razon_social: string;
  nombre_comercial: string;
  nit: string;
  digito_verificacion: string;
  tipo_organizacion: string;
  sector_economico: string;
  tamaño_empresa: string;
  telefono_principal: string;
  email_contacto: string;
  website?: string;
  descripcion?: string;
}

interface LocationData {
  nombre: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  codigo_postal?: string;
  telefono?: string;
  email?: string;
  area_m2?: number;
  capacidad_personas?: number;
  horario_atencion?: string;
  responsable_nombre?: string;
  responsable_cargo?: string;
  responsable_telefono?: string;
  responsable_email?: string;
  observaciones?: string;
}

interface TemplateData {
  selectedTemplate?: string;
  applyTemplate?: boolean;
}

const OrganizationWizard: React.FC = () => {
  const navigate = useNavigate();
  const { getAccessToken } = useAuthContext();
  
  // Form data state
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    razon_social: '',
    nombre_comercial: '',
    nit: '',
    digito_verificacion: '',
    tipo_organizacion: '',
    sector_economico: '',
    tamaño_empresa: '',
    telefono_principal: '',
    email_contacto: '',
    website: '',
    descripcion: '',
  });

  const [locationData, setLocationData] = useState<LocationData>({
    nombre: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    pais: 'Colombia',
    codigo_postal: '',
    telefono: '',
    email: '',
    area_m2: undefined,
    capacidad_personas: undefined,
    horario_atencion: '',
    responsable_nombre: '',
    responsable_cargo: '',
    responsable_telefono: '',
    responsable_email: '',
    observaciones: '',
  });

  const [templateData, setTemplateData] = useState<TemplateData>({
    selectedTemplate: '',
    applyTemplate: false,
  });

  // Validation states
  const [step1Valid, setStep1Valid] = useState<boolean>(false);
  const [step2Valid, setStep2Valid] = useState<boolean>(false);
  const [step3Valid, setStep3Valid] = useState<boolean>(true); // Template selection is optional

  // Handle data updates
  const handleOrganizationDataChange = useCallback((data: Partial<OrganizationData>) => {
    setOrganizationData(prev => ({ ...prev, ...data }));
  }, []);

  const handleLocationDataChange = useCallback((data: Partial<LocationData>) => {
    setLocationData(prev => ({ ...prev, ...data }));
  }, []);

  const handleTemplateDataChange = useCallback((data: Partial<TemplateData>) => {
    setTemplateData(prev => ({ ...prev, ...data }));
  }, []);

  // API calls
  const createOrganization = async (): Promise<string> => {
    const token = getAccessToken();
    const response = await fetch('/api/organization/organizations/wizard/step1/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(organizationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error creando organización');
    }

    const data = await response.json();
    return data.organization.id;
  };

  const createLocation = async (organizationId: string): Promise<string> => {
    const token = getAccessToken();
    const response = await fetch('/api/organization/locations/wizard/step1/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...locationData,
        organization: organizationId,
        es_principal: true,
        tipo_sede: 'principal',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error creando sede principal');
    }

    const data = await response.json();
    return data.location.id;
  };

  const applyTemplate = async (organizationId: string): Promise<void> => {
    if (!templateData.selectedTemplate || !templateData.applyTemplate) {
      return;
    }

    const token = getAccessToken();
    const response = await fetch(`/api/organization/sector-templates/${templateData.selectedTemplate}/apply/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        organization_id: organizationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error aplicando plantilla');
    }
  };

  // Handle wizard completion
  const handleWizardComplete = async () => {
    try {
      // Step 1: Create Organization
      toast.info('Creando organización...', { autoClose: 2000 });
      const organizationId = await createOrganization();
      
      // Step 2: Create Main Location
      toast.info('Configurando sede principal...', { autoClose: 2000 });
      await createLocation(organizationId);
      
      // Step 3: Apply Template (if selected)
      if (templateData.selectedTemplate && templateData.applyTemplate) {
        toast.info('Aplicando plantilla del sector...', { autoClose: 2000 });
        await applyTemplate(organizationId);
      }
      
      // Success
      toast.success('¡Configuración completada exitosamente!', { autoClose: 3000 });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error completing wizard:', error);
      toast.error(error instanceof Error ? error.message : 'Error completando la configuración');
    }
  };

  // Define wizard steps
  const wizardSteps = [
    {
      id: 1,
      title: "Datos de la Organización",
      subtitle: "Información legal y básica de su empresa",
      component: (
        <Step1OrganizationData
          data={organizationData}
          onChange={handleOrganizationDataChange}
          onValidationChange={setStep1Valid}
        />
      ),
      validation: () => step1Valid,
    },
    {
      id: 2,
      title: "Sede Principal",
      subtitle: "Ubicación y detalles de su sede principal",
      component: (
        <Step2LocationData
          data={locationData}
          onChange={handleLocationDataChange}
          onValidationChange={setStep2Valid}
        />
      ),
      validation: () => step2Valid,
    },
    {
      id: 3,
      title: "Plantilla del Sector",
      subtitle: "Seleccione una plantilla predefinida (opcional)",
      component: (
        <Step3SectorTemplate
          selectedSector={organizationData.sector_economico}
          selectedTemplate={templateData.selectedTemplate}
          onChange={handleTemplateDataChange}
          onValidationChange={setStep3Valid}
        />
      ),
      validation: () => step3Valid,
    },
  ];

  return (
    <div className="organization-wizard">
      <WizardContainer
        title="Configuración Inicial de Organización"
        subtitle="Configure los datos básicos de su organización en ZentraQMS"
        steps={wizardSteps}
        onComplete={handleWizardComplete}
        showProgress={true}
        allowSkipSteps={false}
        className="wizard-container"
      />

      {/* Custom styles for wizard */}
      <style>{`
        .organization-wizard {
          min-height: 100vh;
          background-color: #f8f9fa;
        }

        .wizard-container {
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }

        .template-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .template-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
        }

        .template-card.border-primary {
          border-width: 2px !important;
        }

        .step-content {
          min-height: 400px;
        }

        .nav-pills .nav-link {
          min-width: 40px;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .nav-pills .nav-link.active {
          background-color: var(--vz-primary);
          color: white;
        }

        .nav-pills .nav-link.done {
          background-color: var(--vz-success);
          color: white;
        }

        .nav-pills .nav-link.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .progress {
          background-color: #e9ecef;
        }

        .progress-bar {
          background-color: var(--vz-primary);
        }
      `}</style>
    </div>
  );
};

export default OrganizationWizard;