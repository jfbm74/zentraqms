import React, { useState, useEffect } from 'react';
import { 
  Cargo, 
  Area, 
  HierarchyLevel, 
  PositionType, 
  HIERARCHY_LEVEL_CHOICES, 
  POSITION_TYPE_CHOICES 
} from '../../../types/organizationalChart';
import { CreatePositionRequest, UpdatePositionRequest } from '../../../services/positionService';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface PositionFormModalProps {
  show: boolean;
  onHide: () => void;
  position?: Cargo | null;
  isEditMode: boolean;
  areas: Area[];
  positions: Cargo[];
  onSave: (data: CreatePositionRequest | UpdatePositionRequest) => Promise<void>;
  loading: boolean;
}

interface FormData extends CreatePositionRequest {
  // Campos adicionales para el formulario
}

interface FormErrors {
  [key: string]: string;
}

const PositionFormModal: React.FC<PositionFormModalProps> = ({
  show,
  onHide,
  position,
  isEditMode,
  areas,
  positions,
  onSave,
  loading
}) => {
  const [formData, setFormData] = useState<FormData>({
    area: '',
    code: '',
    name: '',
    hierarchy_level: 'PROFESSIONAL' as HierarchyLevel,
    reports_to: '',
    main_purpose: '',
    requirements: {},
    is_critical: false,
    is_process_owner: false,
    is_service_leader: false,
    requires_professional_license: false,
    requires_sst_license: false,
    authorized_positions: 1,
    salary_range_min: 0,
    salary_range_max: 0,
    position_type: 'PERMANENT' as PositionType
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [availableReportsTo, setAvailableReportsTo] = useState<Cargo[]>([]);

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      if (isEditMode && position) {
        setFormData({
          area: position.area || '',
          code: position.code || '',
          name: position.name || '',
          hierarchy_level: position.hierarchy_level || 'PROFESSIONAL',
          reports_to: position.reports_to || '',
          main_purpose: position.main_purpose || '',
          requirements: position.requirements || {},
          is_critical: position.is_critical || false,
          is_process_owner: position.is_process_owner || false,
          is_service_leader: position.is_service_leader || false,
          requires_professional_license: position.requires_professional_license || false,
          requires_sst_license: position.requires_sst_license || false,
          authorized_positions: position.authorized_positions || 1,
          salary_range_min: position.salary_range_min || 0,
          salary_range_max: position.salary_range_max || 0,
          position_type: position.position_type || 'PERMANENT'
        });
      } else {
        // Reset to default values for new position
        setFormData({
          area: areas.length === 1 ? areas[0].id : '',
          code: '',
          name: '',
          hierarchy_level: 'PROFESSIONAL',
          reports_to: '',
          main_purpose: '',
          requirements: {},
          is_critical: false,
          is_process_owner: false,
          is_service_leader: false,
          requires_professional_license: false,
          requires_sst_license: false,
          authorized_positions: 1,
          salary_range_min: 0,
          salary_range_max: 0,
          position_type: 'PERMANENT'
        });
      }
      setErrors({});
    }
  }, [show, isEditMode, position, areas]);

  // Update available reports to when area changes
  useEffect(() => {
    if (formData.area) {
      const areaPositions = positions.filter(p => 
        p.area === formData.area && 
        (!isEditMode || p.id !== position?.id)
      );
      setAvailableReportsTo(areaPositions);
    } else {
      setAvailableReportsTo([]);
    }
  }, [formData.area, positions, isEditMode, position]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? Number(value) || 0 : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.area) {
      newErrors.area = 'El área es requerida';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    } else if (formData.code.trim().length < 2) {
      newErrors.code = 'El código debe tener al menos 2 caracteres';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del puesto es requerido';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!formData.main_purpose.trim()) {
      newErrors.main_purpose = 'El propósito principal es requerido';
    }
    
    if (formData.authorized_positions < 1) {
      newErrors.authorized_positions = 'Debe haber al menos 1 posición autorizada';
    }
    
    if (formData.salary_range_min && formData.salary_range_max) {
      if (formData.salary_range_min >= formData.salary_range_max) {
        newErrors.salary_range_max = 'El salario máximo debe ser mayor que el mínimo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const cleanedData = { ...formData };
      
      if (!cleanedData.reports_to) {
        cleanedData.reports_to = undefined;
      }
      
      if (!cleanedData.salary_range_min) {
        cleanedData.salary_range_min = undefined;
      }
      
      if (!cleanedData.salary_range_max) {
        cleanedData.salary_range_max = undefined;
      }

      await onSave(cleanedData);
      
    } catch (error: any) {
      console.error('Error saving position:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  // Get labels
  const getHierarchyLevelLabel = (level: HierarchyLevel): string => {
    const labels: Record<HierarchyLevel, string> = {
      'BOARD': 'Junta Directiva',
      'EXECUTIVE': 'Ejecutivo',
      'SENIOR_MANAGEMENT': 'Alta Gerencia',
      'MIDDLE_MANAGEMENT': 'Gerencia Media',
      'PROFESSIONAL': 'Profesional',
      'TECHNICAL': 'Técnico',
      'AUXILIARY': 'Auxiliar',
      'OPERATIONAL': 'Operacional'
    };
    return labels[level] || level;
  };

  const getPositionTypeLabel = (type: PositionType): string => {
    const labels: Record<PositionType, string> = {
      'PERMANENT': 'Permanente',
      'TEMPORARY': 'Temporal',
      'CONTRACT': 'Contrato',
      'CONSULTANT': 'Consultor',
      'VOLUNTEER': 'Voluntario',
      'INTERN': 'Interno'
    };
    return labels[type] || type;
  };

  if (!show) return null;

  return (
    <>
      {/* Modal */}
      <div 
        className="modal fade show"
        style={{ display: 'block' }}
        tabIndex={-1}
        aria-hidden={false}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEditMode ? 'Editar Puesto' : 'Crear Nuevo Puesto'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onHide}
                  disabled={loading}
                  aria-label="Close"
                ></button>
              </div>
              
              <div className="modal-body">
                <div className="row">
                  {/* Basic Information */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="area" className="form-label">
                        Área <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${errors.area ? 'is-invalid' : ''}`}
                        name="area"
                        id="area"
                        value={formData.area}
                        onChange={handleChange}
                      >
                        <option value="">Seleccionar área...</option>
                        {areas.map(area => (
                          <option key={area.id} value={area.id}>
                            {area.code} - {area.name}
                          </option>
                        ))}
                      </select>
                      {errors.area && <div className="invalid-feedback">{errors.area}</div>}
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="code" className="form-label">
                        Código <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                        name="code"
                        id="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="Ej: DIR-001"
                      />
                      {errors.code && <div className="invalid-feedback">{errors.code}</div>}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">
                        Nombre del Puesto <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ej: Director General"
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="mb-3">
                      <label htmlFor="main_purpose" className="form-label">
                        Propósito Principal <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={`form-control ${errors.main_purpose ? 'is-invalid' : ''}`}
                        name="main_purpose"
                        id="main_purpose"
                        value={formData.main_purpose}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Describe el propósito principal de este puesto..."
                      />
                      {errors.main_purpose && <div className="invalid-feedback">{errors.main_purpose}</div>}
                    </div>
                  </div>

                  {/* Hierarchy */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="hierarchy_level" className="form-label">Nivel Jerárquico</label>
                      <select
                        className="form-select"
                        name="hierarchy_level"
                        id="hierarchy_level"
                        value={formData.hierarchy_level}
                        onChange={handleChange}
                      >
                        {HIERARCHY_LEVEL_CHOICES.map(level => (
                          <option key={level} value={level}>
                            {getHierarchyLevelLabel(level)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="reports_to" className="form-label">Reporta a</label>
                      <select
                        className="form-select"
                        name="reports_to"
                        id="reports_to"
                        value={formData.reports_to}
                        onChange={handleChange}
                        disabled={!formData.area}
                      >
                        <option value="">Sin jefe directo (Posición raíz)</option>
                        {availableReportsTo.map(position => (
                          <option key={position.id} value={position.id}>
                            {position.code} - {position.name}
                          </option>
                        ))}
                      </select>
                      {!formData.area && (
                        <small className="text-muted">Selecciona un área primero</small>
                      )}
                    </div>
                  </div>

                  {/* Position Configuration */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="position_type" className="form-label">Tipo de Posición</label>
                      <select
                        className="form-select"
                        name="position_type"
                        id="position_type"
                        value={formData.position_type}
                        onChange={handleChange}
                      >
                        {POSITION_TYPE_CHOICES.map(type => (
                          <option key={type} value={type}>
                            {getPositionTypeLabel(type)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="authorized_positions" className="form-label">Posiciones Autorizadas</label>
                      <input
                        type="number"
                        className={`form-control ${errors.authorized_positions ? 'is-invalid' : ''}`}
                        name="authorized_positions"
                        id="authorized_positions"
                        value={formData.authorized_positions}
                        onChange={handleChange}
                        min="1"
                      />
                      {errors.authorized_positions && <div className="invalid-feedback">{errors.authorized_positions}</div>}
                    </div>
                  </div>

                  {/* Position Characteristics */}
                  <div className="col-md-12">
                    <h6 className="mb-3">Características del Puesto</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            name="is_critical"
                            id="is_critical"
                            checked={formData.is_critical}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="is_critical">
                            Puesto Crítico
                          </label>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            name="is_process_owner"
                            id="is_process_owner"
                            checked={formData.is_process_owner}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="is_process_owner">
                            Dueño de Proceso
                          </label>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            name="requires_professional_license"
                            id="requires_professional_license"
                            checked={formData.requires_professional_license}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="requires_professional_license">
                            Requiere Licencia Profesional
                          </label>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            name="requires_sst_license"
                            id="requires_sst_license"
                            checked={formData.requires_sst_license}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="requires_sst_license">
                            Requiere Licencia SST
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onHide} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading && <LoadingSpinner />}
                  {isEditMode ? 'Actualizar' : 'Crear'} Puesto
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal backdrop */}
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default PositionFormModal;