/**
 * Step 2: Main Location Data Component
 * 
 * Handles main location/headquarters information input
 */
import React, { useState, useEffect } from 'react';
// Using standard HTML form elements with Bootstrap classes

// Types
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

interface Step2Props {
  data: LocationData;
  onChange: (data: Partial<LocationData>) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const Step2LocationData: React.FC<Step2Props> = ({
  data,
  onChange,
  onValidationChange
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Colombian departments
  const departmentOptions = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
    'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
    'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
    'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
    'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
    'Vaupés', 'Vichada'
  ];

  // Common Colombian cities by department
  const cityOptions: Record<string, string[]> = {
    'Cundinamarca': ['Bogotá', 'Soacha', 'Girardot', 'Zipaquirá', 'Facatativá', 'Chía', 'Mosquera', 'Madrid'],
    'Antioquia': ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Turbo', 'Rionegro', 'Sabaneta'],
    'Valle del Cauca': ['Cali', 'Palmira', 'Buenaventura', 'Tulua', 'Cartago', 'Buga', 'Jamundí'],
    'Atlántico': ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Galapa', 'Puerto Colombia'],
    'Santander': ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'San Gil'],
    'Bolívar': ['Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar'],
    // Add more as needed
  };

  // Country options (focusing on Colombia but allowing others)
  const countryOptions = [
    { value: 'Colombia', label: 'Colombia' },
    { value: 'Argentina', label: 'Argentina' },
    { value: 'Brasil', label: 'Brasil' },
    { value: 'Chile', label: 'Chile' },
    { value: 'Ecuador', label: 'Ecuador' },
    { value: 'México', label: 'México' },
    { value: 'Panamá', label: 'Panamá' },
    { value: 'Perú', label: 'Perú' },
    { value: 'Uruguay', label: 'Uruguay' },
    { value: 'Venezuela', label: 'Venezuela' },
    { value: 'Otros', label: 'Otros' },
  ];

  // Validation rules
  const validateField = (name: string, value: string | number): string => {
    switch (name) {
      case 'nombre':
        return !value ? 'El nombre de la sede es obligatorio' : '';
      case 'direccion':
        return !value ? 'La dirección es obligatoria' : '';
      case 'ciudad':
        return !value ? 'La ciudad es obligatoria' : '';
      case 'departamento':
        return !value ? 'El departamento es obligatorio' : '';
      case 'pais':
        return !value ? 'El país es obligatorio' : '';
      case 'telefono':
        return value && typeof value === 'string' && !/^[+\d\s()-]{10,}$/.test(value) ? 'Formato de teléfono inválido' : '';
      case 'email':
        return value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Formato de email inválido' : '';
      case 'responsable_telefono':
        return value && typeof value === 'string' && !/^[+\d\s()-]{10,}$/.test(value) ? 'Formato de teléfono inválido' : '';
      case 'responsable_email':
        return value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Formato de email inválido' : '';
      case 'area_m2':
        return value && (typeof value !== 'number' || value <= 0) ? 'El área debe ser un número positivo' : '';
      case 'capacidad_personas':
        return value && (typeof value !== 'number' || value <= 0) ? 'La capacidad debe ser un número positivo' : '';
      default:
        return '';
    }
  };

  // Handle input change
  const handleInputChange = (name: string, value: string | number) => {
    onChange({ [name]: value });

    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Handle department change (reset city when department changes)
  const handleDepartmentChange = (department: string) => {
    handleInputChange('departamento', department);
    if (data.ciudad && cityOptions[department] && !cityOptions[department].includes(data.ciudad)) {
      onChange({ ciudad: '' });
    }
  };

  // Validate form
  const isFormValid = (): boolean => {
    const requiredFields = ['nombre', 'direccion', 'ciudad', 'departamento', 'pais'];
    
    const hasRequiredFields = requiredFields.every(field => {
      const value = data[field as keyof LocationData];
      return value && value.toString().trim();
    });
    
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
    <div className="location-data-form">
      <div className="row">
        {/* Nombre de la Sede */}
        <div className="col-lg-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="nombre">
              Nombre de la Sede Principal <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
              id="nombre"
              placeholder="Ej: Sede Principal, Oficina Central, Casa Matriz"
              value={data.nombre || ''}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
            />
            {errors.nombre && (
              <div className="invalid-feedback">{errors.nombre}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {/* Dirección */}
        <div className="col-lg-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="direccion">
              Dirección <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.direccion ? 'is-invalid' : ''}`}
              id="direccion"
              placeholder="Ej: Calle 123 # 45-67, Avenida Principal 890"
              value={data.direccion || ''}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
            />
            {errors.direccion && (
              <div className="invalid-feedback">{errors.direccion}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {/* País */}
        <div className="col-lg-4">
          <div className="mb-3">
            <label className="form-label" htmlFor="pais">
              País <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.pais ? 'is-invalid' : ''}`}
              id="pais"
              value={data.pais || ''}
              onChange={(e) => handleInputChange('pais', e.target.value)}
            >
              <option value="">Seleccione el país</option>
              {countryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.pais && (
              <div className="invalid-feedback">{errors.pais}</div>
            )}
          </div>
        </div>

        {/* Departamento */}
        <div className="col-lg-4">
          <div className="mb-3">
            <label className="form-label" htmlFor="departamento">
              Departamento <span className="text-danger">*</span>
            </label>
            <select
              className={`form-select ${errors.departamento ? 'is-invalid' : ''}`}
              id="departamento"
              value={data.departamento || ''}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              disabled={data.pais !== 'Colombia'}
            >
              <option value="">Seleccione el departamento</option>
              {data.pais === 'Colombia' ? (
                departmentOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))
              ) : (
                <option value="Otro">Otro</option>
              )}
            </select>
            {errors.departamento && (
              <div className="invalid-feedback">{errors.departamento}</div>
            )}
          </div>
        </div>

        {/* Ciudad */}
        <div className="col-lg-4">
          <div className="mb-3">
            <label className="form-label" htmlFor="ciudad">
              Ciudad <span className="text-danger">*</span>
            </label>
            {data.departamento && cityOptions[data.departamento] ? (
              <select
                className={`form-select ${errors.ciudad ? 'is-invalid' : ''}`}
                id="ciudad"
                value={data.ciudad || ''}
                onChange={(e) => handleInputChange('ciudad', e.target.value)}
              >
                <option value="">Seleccione la ciudad</option>
                {cityOptions[data.departamento].map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
                <option value="Otra">Otra</option>
              </select>
            ) : (
              <input
                type="text"
                className={`form-control ${errors.ciudad ? 'is-invalid' : ''}`}
                id="ciudad"
                placeholder="Ingrese la ciudad"
                value={data.ciudad || ''}
                onChange={(e) => handleInputChange('ciudad', e.target.value)}
              />
            )}
            {errors.ciudad && (
              <div className="invalid-feedback">{errors.ciudad}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {/* Código Postal */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="codigo_postal">
              Código Postal
            </label>
            <input
              type="text"
              className={`form-control ${errors.codigo_postal ? 'is-invalid' : ''}`}
              id="codigo_postal"
              placeholder="Ej: 110111"
              value={data.codigo_postal || ''}
              onChange={(e) => handleInputChange('codigo_postal', e.target.value)}
            />
            {errors.codigo_postal && (
              <div className="invalid-feedback">{errors.codigo_postal}</div>
            )}
          </div>
        </div>

        {/* Teléfono */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="telefono">
              Teléfono de la Sede
            </label>
            <input
              type="text"
              className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
              id="telefono"
              placeholder="Ej: +57 1 234 5678"
              value={data.telefono || ''}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
            />
            {errors.telefono && (
              <div className="invalid-feedback">{errors.telefono}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {/* Email */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="email">
              Email de la Sede
            </label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              id="email"
              placeholder="sede@empresa.com"
              value={data.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>
        </div>

        {/* Horario de Atención */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="horario_atencion">
              Horario de Atención
            </label>
            <input
              type="text"
              className={`form-control ${errors.horario_atencion ? 'is-invalid' : ''}`}
              id="horario_atencion"
              placeholder="Ej: Lunes a Viernes 8:00 AM - 5:00 PM"
              value={data.horario_atencion || ''}
              onChange={(e) => handleInputChange('horario_atencion', e.target.value)}
            />
            {errors.horario_atencion && (
              <div className="invalid-feedback">{errors.horario_atencion}</div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        {/* Área en m² */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="area_m2">
              Área (m²)
            </label>
            <input
              type="number"
              className={`form-control ${errors.area_m2 ? 'is-invalid' : ''}`}
              id="area_m2"
              placeholder="Ej: 1500"
              value={data.area_m2 || ''}
              onChange={(e) => handleInputChange('area_m2', parseInt(e.target.value) || 0)}
              min="0"
            />
            {errors.area_m2 && (
              <div className="invalid-feedback">{errors.area_m2}</div>
            )}
          </div>
        </div>

        {/* Capacidad de Personas */}
        <div className="col-lg-6">
          <div className="mb-3">
            <label className="form-label" htmlFor="capacidad_personas">
              Capacidad (personas)
            </label>
            <input
              type="number"
              className={`form-control ${errors.capacidad_personas ? 'is-invalid' : ''}`}
              id="capacidad_personas"
              placeholder="Ej: 200"
              value={data.capacidad_personas || ''}
              onChange={(e) => handleInputChange('capacidad_personas', parseInt(e.target.value) || 0)}
              min="0"
            />
            {errors.capacidad_personas && (
              <div className="invalid-feedback">{errors.capacidad_personas}</div>
            )}
          </div>
        </div>
      </div>

      {/* Responsible Person Section */}
      <div className="border-top pt-4 mt-4">
        <h6 className="fs-15 mb-3">
          <i className="ri-user-line me-2"></i>
          Responsable de la Sede
        </h6>
        
        <div className="row">
          {/* Responsable Nombre */}
          <div className="col-lg-6">
            <div className="mb-3">
              <label className="form-label" htmlFor="responsable_nombre">
                Nombre del Responsable
              </label>
              <input
                type="text"
                className={`form-control ${errors.responsable_nombre ? 'is-invalid' : ''}`}
                id="responsable_nombre"
                placeholder="Nombre completo"
                value={data.responsable_nombre || ''}
                onChange={(e) => handleInputChange('responsable_nombre', e.target.value)}
              />
              {errors.responsable_nombre && (
                <div className="invalid-feedback">{errors.responsable_nombre}</div>
              )}
            </div>
          </div>

          {/* Responsable Cargo */}
          <div className="col-lg-6">
            <div className="mb-3">
              <label className="form-label" htmlFor="responsable_cargo">
                Cargo del Responsable
              </label>
              <input
                type="text"
                className={`form-control ${errors.responsable_cargo ? 'is-invalid' : ''}`}
                id="responsable_cargo"
                placeholder="Ej: Gerente de Sede, Administrador"
                value={data.responsable_cargo || ''}
                onChange={(e) => handleInputChange('responsable_cargo', e.target.value)}
              />
              {errors.responsable_cargo && (
                <div className="invalid-feedback">{errors.responsable_cargo}</div>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          {/* Responsable Teléfono */}
          <div className="col-lg-6">
            <div className="mb-3">
              <label className="form-label" htmlFor="responsable_telefono">
                Teléfono del Responsable
              </label>
              <input
                type="text"
                className={`form-control ${errors.responsable_telefono ? 'is-invalid' : ''}`}
                id="responsable_telefono"
                placeholder="Ej: +57 300 123 4567"
                value={data.responsable_telefono || ''}
                onChange={(e) => handleInputChange('responsable_telefono', e.target.value)}
              />
              {errors.responsable_telefono && (
                <div className="invalid-feedback">{errors.responsable_telefono}</div>
              )}
            </div>
          </div>

          {/* Responsable Email */}
          <div className="col-lg-6">
            <div className="mb-3">
              <label className="form-label" htmlFor="responsable_email">
                Email del Responsable
              </label>
              <input
                type="email"
                className={`form-control ${errors.responsable_email ? 'is-invalid' : ''}`}
                id="responsable_email"
                placeholder="responsable@empresa.com"
                value={data.responsable_email || ''}
                onChange={(e) => handleInputChange('responsable_email', e.target.value)}
              />
              {errors.responsable_email && (
                <div className="invalid-feedback">{errors.responsable_email}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div className="row">
        <div className="col-lg-12">
          <div className="mb-3">
            <label className="form-label" htmlFor="observaciones">
              Observaciones
            </label>
            <textarea
              className={`form-control ${errors.observaciones ? 'is-invalid' : ''}`}
              id="observaciones"
              placeholder="Información adicional sobre la sede principal"
              rows={3}
              value={data.observaciones || ''}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
            />
            {errors.observaciones && (
              <div className="invalid-feedback">{errors.observaciones}</div>
            )}
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info d-flex align-items-center">
        <i className="ri-information-line me-2"></i>
        <div>
          <strong>Sede Principal:</strong> Esta será configurada como la sede principal de su organización. 
          Podrá agregar sedes adicionales posteriormente desde el módulo de gestión de sedes.
        </div>
      </div>
    </div>
  );
};

export default Step2LocationData;