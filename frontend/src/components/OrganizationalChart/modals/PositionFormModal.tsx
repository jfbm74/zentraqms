/**
 * Modal para crear y editar cargos/posiciones
 * Permite definir información básica del cargo y sus características
 * ZentraQMS - Sistema de Gestión de Calidad
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

import {
  Cargo,
  Area,
  HIERARCHY_LEVEL_CHOICES,
  POSITION_TYPE_CHOICES,
  HierarchyLevel,
  PositionType
} from '../../../types/organizationalChart';
import { useOrganizationalChartStore } from '../../../stores/organizationalChart/organizationalChartStore';
import organizationalChartService from '../../../services/organizationalChart/organizationalChartService';

interface PositionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (position: Cargo) => void;
  position?: Cargo; // Para edición
  areas: Area[];
  parentPosition?: Cargo; // Para definir jerarquía
}

const PositionFormModal: React.FC<PositionFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  position,
  areas,
  parentPosition
}) => {

  // ============================================================================
  // ESTADO
  // ============================================================================

  const [formData, setFormData] = useState({
    area: '',
    code: '',
    name: '',
    hierarchy_level: 'PROFESSIONAL' as HierarchyLevel,
    position_type: 'PERMANENT' as PositionType,
    reports_to: parentPosition?.id || '',
    description: '',
    main_purpose: '',
    grade_level: 1,
    min_salary: '',
    max_salary: '',
    is_critical: false,
    is_management: false,
    allows_remote_work: false,
    travel_required: false,
    travel_percentage: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // EFECTOS
  // ============================================================================

  // Inicializar formulario cuando se abre
  useEffect(() => {
    if (isOpen) {
      if (position) {
        // Modo edición
        setFormData({
          area: position.area,
          code: position.code,
          name: position.name,
          hierarchy_level: position.hierarchy_level,
          position_type: position.position_type,
          reports_to: position.reports_to || '',
          description: position.description,
          main_purpose: position.main_purpose,
          grade_level: position.grade_level,
          min_salary: position.min_salary?.toString() || '',
          max_salary: position.max_salary?.toString() || '',
          is_critical: position.is_critical,
          is_management: position.is_management,
          allows_remote_work: position.allows_remote_work,
          travel_required: position.travel_required,
          travel_percentage: position.travel_percentage?.toString() || ''
        });
      } else {
        // Modo creación
        resetForm();
      }
      setErrors({});
    }
  }, [isOpen, position, parentPosition]);

  const resetForm = () => {
    setFormData({
      area: areas.length > 0 ? areas[0].id : '',
      code: '',
      name: '',
      hierarchy_level: 'PROFESSIONAL',
      position_type: 'PERMANENT',
      reports_to: parentPosition?.id || '',
      description: '',
      main_purpose: '',
      grade_level: 1,
      min_salary: '',
      max_salary: '',
      is_critical: false,
      is_management: false,
      allows_remote_work: false,
      travel_required: false,
      travel_percentage: ''
    });
  };

  // ============================================================================
  // MANEJADORES DE EVENTOS
  // ============================================================================

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones requeridas
    if (!formData.area) newErrors.area = 'El área es requerida';
    if (!formData.code.trim()) newErrors.code = 'El código es requerido';
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!formData.main_purpose.trim()) newErrors.main_purpose = 'El propósito principal es requerido';

    // Validación de código único (simple)
    if (formData.code.length < 3) {
      newErrors.code = 'El código debe tener al menos 3 caracteres';
    }

    // Validaciones de salario
    if (formData.min_salary && formData.max_salary) {
      const minSal = parseFloat(formData.min_salary);
      const maxSal = parseFloat(formData.max_salary);
      
      if (minSal >= maxSal) {
        newErrors.max_salary = 'El salario máximo debe ser mayor al mínimo';
      }
    }

    // Validación de porcentaje de viajes
    if (formData.travel_required && formData.travel_percentage) {
      const percentage = parseFloat(formData.travel_percentage);
      if (percentage < 0 || percentage > 100) {
        newErrors.travel_percentage = 'El porcentaje debe estar entre 0 y 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para enviar
      const submitData: Partial<Cargo> = {
        area: formData.area,
        code: formData.code.trim(),
        name: formData.name.trim(),
        hierarchy_level: formData.hierarchy_level,
        position_type: formData.position_type,
        reports_to: formData.reports_to || undefined,
        description: formData.description.trim(),
        main_purpose: formData.main_purpose.trim(),
        grade_level: formData.grade_level,
        min_salary: formData.min_salary ? parseFloat(formData.min_salary) : undefined,
        max_salary: formData.max_salary ? parseFloat(formData.max_salary) : undefined,
        is_critical: formData.is_critical,
        is_management: formData.is_management,
        allows_remote_work: formData.allows_remote_work,
        travel_required: formData.travel_required,
        travel_percentage: formData.travel_percentage ? parseFloat(formData.travel_percentage) : undefined
      };

      let result: Cargo;
      
      if (position) {
        // Actualizar cargo existente
        result = await organizationalChartService.position.update(position.id, submitData);
        toast.success('Cargo actualizado exitosamente');
      } else {
        // Crear nuevo cargo
        result = await organizationalChartService.position.create(submitData);
        toast.success('Cargo creado exitosamente');
      }

      if (onSuccess) {
        onSuccess(result);
      }
      
      onClose();
      
    } catch (error: any) {
      console.error('Error al guardar cargo:', error);
      const message = error.response?.data?.detail || error.message || 'Error al guardar el cargo';
      toast.error(message);
      
      // Manejar errores de validación del backend
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // ============================================================================
  // DATOS COMPUTADOS
  // ============================================================================

  const availableReportsTo = areas.flatMap(area => 
    area.positions?.filter(pos => 
      pos.id !== position?.id && // No puede reportar a sí mismo
      pos.area === formData.area // Solo cargos de la misma área (o se podría permitir otras áreas)
    ) || []
  );

  const selectedArea = areas.find(area => area.id === formData.area);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          
          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ri-user-add-line me-2"></i>
              {position ? 'Editar Cargo' : 'Crear Nuevo Cargo'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={loading}
            ></button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                
                {/* Información básica */}
                <div className="col-12">
                  <h6 className="text-primary border-bottom pb-2">Información Básica</h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Área <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.area ? 'is-invalid' : ''}`}
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Seleccionar área</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  {errors.area && <div className="invalid-feedback">{errors.area}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Código <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    disabled={loading}
                    placeholder="ej: DIR-001"
                  />
                  {errors.code && <div className="invalid-feedback">{errors.code}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Nombre del Cargo <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={loading}
                    placeholder="ej: Director General"
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Nivel Jerárquico</label>
                  <select
                    className="form-select"
                    value={formData.hierarchy_level}
                    onChange={(e) => handleInputChange('hierarchy_level', e.target.value)}
                    disabled={loading}
                  >
                    {HIERARCHY_LEVEL_CHOICES.map(level => (
                      <option key={level} value={level}>
                        {level.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Tipo de Posición</label>
                  <select
                    className="form-select"
                    value={formData.position_type}
                    onChange={(e) => handleInputChange('position_type', e.target.value)}
                    disabled={loading}
                  >
                    {POSITION_TYPE_CHOICES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {availableReportsTo.length > 0 && (
                  <div className="col-12">
                    <label className="form-label">Reporta a</label>
                    <select
                      className="form-select"
                      value={formData.reports_to}
                      onChange={(e) => handleInputChange('reports_to', e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Ninguno (cargo independiente)</option>
                      {availableReportsTo.map(pos => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Descripción */}
                <div className="col-12">
                  <h6 className="text-primary border-bottom pb-2 mt-3">Descripción y Propósito</h6>
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Descripción <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={loading}
                    placeholder="Descripción detallada del cargo y sus funciones"
                  />
                  {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Propósito Principal <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${errors.main_purpose ? 'is-invalid' : ''}`}
                    rows={2}
                    value={formData.main_purpose}
                    onChange={(e) => handleInputChange('main_purpose', e.target.value)}
                    disabled={loading}
                    placeholder="Propósito principal y misión del cargo"
                  />
                  {errors.main_purpose && <div className="invalid-feedback">{errors.main_purpose}</div>}
                </div>

                {/* Configuración adicional */}
                <div className="col-12">
                  <h6 className="text-primary border-bottom pb-2 mt-3">Configuración Adicional</h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Nivel de Grado</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="20"
                    value={formData.grade_level}
                    onChange={(e) => handleInputChange('grade_level', parseInt(e.target.value))}
                    disabled={loading}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Salario Mín.</label>
                  <input
                    type="number"
                    className={`form-control ${errors.min_salary ? 'is-invalid' : ''}`}
                    min="0"
                    step="0.01"
                    value={formData.min_salary}
                    onChange={(e) => handleInputChange('min_salary', e.target.value)}
                    disabled={loading}
                    placeholder="0.00"
                  />
                  {errors.min_salary && <div className="invalid-feedback">{errors.min_salary}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label">Salario Máx.</label>
                  <input
                    type="number"
                    className={`form-control ${errors.max_salary ? 'is-invalid' : ''}`}
                    min="0"
                    step="0.01"
                    value={formData.max_salary}
                    onChange={(e) => handleInputChange('max_salary', e.target.value)}
                    disabled={loading}
                    placeholder="0.00"
                  />
                  {errors.max_salary && <div className="invalid-feedback">{errors.max_salary}</div>}
                </div>

                {/* Características del cargo */}
                <div className="col-12">
                  <div className="row g-2">
                    <div className="col-md-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="is_critical"
                          checked={formData.is_critical}
                          onChange={(e) => handleInputChange('is_critical', e.target.checked)}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="is_critical">
                          Cargo Crítico
                        </label>
                      </div>
                    </div>
                    
                    <div className="col-md-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="is_management"
                          checked={formData.is_management}
                          onChange={(e) => handleInputChange('is_management', e.target.checked)}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="is_management">
                          Cargo Directivo
                        </label>
                      </div>
                    </div>
                    
                    <div className="col-md-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="allows_remote_work"
                          checked={formData.allows_remote_work}
                          onChange={(e) => handleInputChange('allows_remote_work', e.target.checked)}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="allows_remote_work">
                          Trabajo Remoto
                        </label>
                      </div>
                    </div>
                    
                    <div className="col-md-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="travel_required"
                          checked={formData.travel_required}
                          onChange={(e) => handleInputChange('travel_required', e.target.checked)}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="travel_required">
                          Requiere Viajes
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {formData.travel_required && (
                  <div className="col-md-6">
                    <label className="form-label">Porcentaje de Viajes (%)</label>
                    <input
                      type="number"
                      className={`form-control ${errors.travel_percentage ? 'is-invalid' : ''}`}
                      min="0"
                      max="100"
                      value={formData.travel_percentage}
                      onChange={(e) => handleInputChange('travel_percentage', e.target.value)}
                      disabled={loading}
                      placeholder="0-100"
                    />
                    {errors.travel_percentage && <div className="invalid-feedback">{errors.travel_percentage}</div>}
                  </div>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line me-1"></i>
                    {position ? 'Actualizar' : 'Crear'} Cargo
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default PositionFormModal;