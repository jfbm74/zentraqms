/**
 * Step 1: Organization Basic Data Component
 * 
 * Handles basic organization information input
 */
import React, { useState, useEffect } from 'react';
// Using standard HTML form elements with Bootstrap classes

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

interface Step1Props {
  data: OrganizationData;
  onChange: (data: Partial<OrganizationData>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const Step1OrganizationData: React.FC<Step1Props> = ({
  data,
  onChange,
  onValidationChange
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatingDV, setCalculatingDV] = useState<boolean>(false);

  // Organization type options
  const tipoOrganizacionOptions = [
    { value: 'publica', label: 'Pública' },
    { value: 'privada', label: 'Privada' },
    { value: 'mixta', label: 'Mixta' },
    { value: 'ong', label: 'ONG' },
    { value: 'fundacion', label: 'Fundación' },
    { value: 'cooperativa', label: 'Cooperativa' },
  ];

  // Economic sector options
  const sectorEconomicoOptions = [
    { value: 'tecnologia', label: 'Tecnología' },
    { value: 'salud', label: 'Salud' },
    { value: 'educacion', label: 'Educación' },
    { value: 'manufactura', label: 'Manufactura' },
    { value: 'comercio', label: 'Comercio' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'construccion', label: 'Construcción' },
    { value: 'agricultura', label: 'Agricultura' },
    { value: 'mineria', label: 'Minería' },
    { value: 'turismo', label: 'Turismo' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'financiero', label: 'Financiero' },
    { value: 'otros', label: 'Otros' },
  ];

  // Company size options
  const tamañoEmpresaOptions = [
    { value: 'microempresa', label: 'Microempresa (1-10 empleados)' },
    { value: 'pequeña', label: 'Pequeña empresa (11-50 empleados)' },
    { value: 'mediana', label: 'Mediana empresa (51-200 empleados)' },
    { value: 'grande', label: 'Grande empresa (200+ empleados)' },
  ];

  // Validation rules
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'razon_social':
        return value.trim().length < 3 ? 'La razón social debe tener al menos 3 caracteres' : '';
      case 'nombre_comercial':
        return value.trim().length < 2 ? 'El nombre comercial debe tener al menos 2 caracteres' : '';
      case 'nit':
        return !/^\d{9,10}$/.test(value.replace(/\D/g, '')) ? 'El NIT debe tener entre 9 y 10 dígitos' : '';
      case 'digito_verificacion':
        return !/^\d$/.test(value) ? 'El dígito de verificación debe ser un número del 0 al 9' : '';
      case 'telefono_principal':
        return value && !/^[+\d\s()-]{10,}$/.test(value) ? 'Formato de teléfono inválido' : '';
      case 'email_contacto':
        return value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Formato de email inválido' : '';
      case 'website':
        return value && !/^https?:\/\//.test(value) ? 'El sitio web debe comenzar con http:// o https://' : '';
      default:
        return '';
    }
  };

  // Calculate verification digit (simplified Colombian NIT algorithm)
  const calculateVerificationDigit = (nit: string): string => {
    const cleanNit = nit.replace(/\D/g, '');
    if (cleanNit.length < 9) return '';

    const primes = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
    const nitDigits = cleanNit.split('').reverse().map(Number);
    
    let sum = 0;
    for (let i = 0; i < nitDigits.length; i++) {
      sum += nitDigits[i] * primes[i];
    }
    
    const remainder = sum % 11;
    return remainder < 2 ? remainder.toString() : (11 - remainder).toString();
  };

  // Handle input change
  const handleInputChange = (name: string, value: string) => {
    // Auto-calculate verification digit when NIT changes
    if (name === 'nit') {
      setCalculatingDV(true);
      const cleanNit = value.replace(/\D/g, '');
      const dv = calculateVerificationDigit(cleanNit);
      
      setTimeout(() => {
        onChange({ 
          [name]: cleanNit,
          digito_verificacion: dv 
        });
        setCalculatingDV(false);
      }, 300);
    } else {
      onChange({ [name]: value });
    }

    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Validate form
  const isFormValid = (): boolean => {
    const requiredFields = [
      'razon_social', 
      'nombre_comercial', 
      'nit', 
      'digito_verificacion',
      'tipo_organizacion', 
      'sector_economico', 
      'tamaño_empresa'
    ];
    
    const hasRequiredFields = requiredFields.every(field => 
      data[field as keyof OrganizationData]?.toString().trim()
    );
    
    const hasNoErrors = Object.values(errors).every(error => !error);
    
    return hasRequiredFields && hasNoErrors;
  };

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFormValid());
    }
  }, [data, errors, onValidationChange]);

  return (
    <div className="organization-data-form">
      <div className="row">
        {/* Razón Social */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="razon_social">
              Razón Social <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.razon_social ? 'is-invalid' : ''}`}
              id="razon_social"
              placeholder="Ingrese la razón social"
              value={data.razon_social || ''}
              onChange={(e) => handleInputChange('razon_social', e.target.value)}
            />
            {errors.razon_social && (
              <div className="invalid-feedback">{errors.razon_social}</div>
            )}
          </div>
        </div>

        {/* Nombre Comercial */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="nombre_comercial">
              Nombre Comercial <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.nombre_comercial ? 'is-invalid' : ''}`}
              id="nombre_comercial"
              placeholder="Ingrese el nombre comercial"
              value={data.nombre_comercial || ''}
              onChange={(e) => handleInputChange('nombre_comercial', e.target.value)}
            />
            {errors.nombre_comercial && (
              <div className="invalid-feedback">{errors.nombre_comercial}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {/* NIT */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="nit">
              NIT <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.nit ? 'is-invalid' : ''}`}
              id="nit"
              placeholder="Ingrese el NIT (solo números)"
              value={data.nit || ''}
              onChange={(e) => handleInputChange('nit', e.target.value)}
              maxLength={10}
            />
            {errors.nit && (
              <div className="invalid-feedback">{errors.nit}</div>
            )}
          </div>
        </div>

        {/* Dígito de Verificación */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="digito_verificacion">
              Dígito de Verificación <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <input
                type="text"
                className={`form-control ${errors.digito_verificacion ? 'is-invalid' : ''}`}
                id="digito_verificacion"
                placeholder="DV"
                value={data.digito_verificacion || ''}
                onChange={(e) => handleInputChange('digito_verificacion', e.target.value)}
                maxLength={1}
                disabled={calculatingDV}
              />
              {calculatingDV && (
                <span className="input-group-text">
                  <div className="spinner-border spinner-border-sm" />
                </span>
              )}
            </div>
            {errors.digito_verificacion && (
              <div className="invalid-feedback">{errors.digito_verificacion}</div>
            )}
            <div className="form-text">
              Se calcula automáticamente al ingresar el NIT
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Tipo de Organización */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="tipo_organizacion">
              Tipo de Organización <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.tipo_organizacion ? 'is-invalid' : ''}`}
              id="tipo_organizacion"
              value={data.tipo_organizacion || ''}
              onChange={(e) => handleInputChange('tipo_organizacion', e.target.value)}
            >
              <option value="">Seleccione el tipo</option>
              {tipoOrganizacionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.tipo_organizacion && (
              <div className="invalid-feedback">{errors.tipo_organizacion}</div>
            )}
          </div>
        </div>

        {/* Sector Económico */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="sector_economico">
              Sector Económico <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.sector_economico ? 'is-invalid' : ''}`}
              id="sector_economico"
              value={data.sector_economico || ''}
              onChange={(e) => handleInputChange('sector_economico', e.target.value)}
            >
              <option value="">Seleccione el sector</option>
              {sectorEconomicoOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.sector_economico && (
              <div className="invalid-feedback">{errors.sector_economico}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {/* Tamaño de Empresa */}
        <div className="col-lg-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="tamaño_empresa">
              Tamaño de Empresa <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.tamaño_empresa ? 'is-invalid' : ''}`}
              id="tamaño_empresa"
              value={data.tamaño_empresa || ''}
              onChange={(e) => handleInputChange('tamaño_empresa', e.target.value)}
            >
              <option value="">Seleccione el tamaño</option>
              {tamañoEmpresaOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.tamaño_empresa && (
              <div className="invalid-feedback">{errors.tamaño_empresa}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {/* Teléfono Principal */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="telefono_principal">
              Teléfono Principal
            </label>
            <input
              type="text"
              className={`form-control ${errors.telefono_principal ? 'is-invalid' : ''}`}
              id="telefono_principal"
              placeholder="Ej: +57 1 234 5678"
              value={data.telefono_principal || ''}
              onChange={(e) => handleInputChange('telefono_principal', e.target.value)}
            />
            {errors.telefono_principal && (
              <div className="invalid-feedback">{errors.telefono_principal}</div>
            )}
          </div>
        </div>

        {/* Email de Contacto */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="email_contacto">
              Email de Contacto
            </label>
            <input
              type="email"
              className={`form-control ${errors.email_contacto ? 'is-invalid' : ''}`}
              id="email_contacto"
              placeholder="contacto@empresa.com"
              value={data.email_contacto || ''}
              onChange={(e) => handleInputChange('email_contacto', e.target.value)}
            />
            {errors.email_contacto && (
              <div className="invalid-feedback">{errors.email_contacto}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {/* Sitio Web */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="website">
              Sitio Web
            </label>
            <input
              type="url"
              className={`form-control ${errors.website ? 'is-invalid' : ''}`}
              id="website"
              placeholder="https://www.empresa.com"
              value={data.website || ''}
              onChange={(e) => handleInputChange('website', e.target.value)}
            />
            {errors.website && (
              <div className="invalid-feedback">{errors.website}</div>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="descripcion">
              Descripción
            </label>
            <textarea
              className={`form-control ${errors.descripcion ? 'is-invalid' : ''}`}
              id="descripcion"
              placeholder="Breve descripción de la empresa"
              rows={3}
              value={data.descripcion || ''}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
            />
            {errors.descripcion && (
              <div className="invalid-feedback">{errors.descripcion}</div>
            )}
          </div>
        </div>
      </div>

      {/* Form Summary */}
      <div className="alert alert-info d-flex align-items-center">
        <i className="ri-information-line me-2"></i>
        <div>
          <strong>Información:</strong> Los campos marcados con (*) son obligatorios. 
          El dígito de verificación se calculará automáticamente basado en el NIT ingresado.
        </div>
      </div>
    </div>
  );
};

export default Step1OrganizationData;