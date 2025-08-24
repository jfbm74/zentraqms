/**
 * Modal para asignar usuario a un cargo
 * Permite seleccionar usuario y configurar tipo de asignación
 * ZentraQMS - Sistema de Gestión de Calidad
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

import {
  Cargo,
  Assignment
} from '../../../types/organizationalChart';

interface User {
  id: string;
  full_name: string;
  email: string;
  photo_url?: string;
  is_active: boolean;
}

interface AssignUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (assignment: Assignment) => void;
  position: Cargo;
  currentAssignment?: Assignment; // Para editar asignación existente
}

const AssignUserModal: React.FC<AssignUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  position,
  currentAssignment
}) => {

  // ============================================================================
  // ESTADO
  // ============================================================================

  const [formData, setFormData] = useState({
    user: currentAssignment?.user || '',
    start_date: currentAssignment?.start_date || new Date().toISOString().split('T')[0],
    end_date: currentAssignment?.end_date || '',
    assignment_type: currentAssignment?.assignment_type || 'PERMANENT',
    appointment_document: null as File | null
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setErrors({});
    }
  }, [isOpen]);

  // ============================================================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================================================

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // TODO: Implementar endpoint para obtener usuarios disponibles
      const response = await fetch('/api/auth/users/?is_active=true');
      const data = await response.json();
      
      if (data.results) {
        setUsers(data.results);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar lista de usuarios');
    } finally {
      setLoadingUsers(false);
    }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleInputChange('appointment_document', file);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones requeridas
    if (!formData.user) {
      newErrors.user = 'Debe seleccionar un usuario';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es requerida';
    }

    // Validar que la fecha de inicio no sea futura
    const startDate = new Date(formData.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate > today) {
      newErrors.start_date = 'La fecha de inicio no puede ser futura';
    }

    // Validar fecha de fin
    if (formData.end_date) {
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'La fecha de fin debe ser posterior a la de inicio';
      }
    }

    // Para asignaciones temporales, la fecha de fin es requerida
    if (formData.assignment_type === 'TEMPORARY' && !formData.end_date) {
      newErrors.end_date = 'Las asignaciones temporales requieren fecha de fin';
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
      const submitData = new FormData();
      submitData.append('cargo', position.id);
      submitData.append('user', formData.user);
      submitData.append('start_date', formData.start_date);
      submitData.append('assignment_type', formData.assignment_type);
      
      if (formData.end_date) {
        submitData.append('end_date', formData.end_date);
      }
      
      if (formData.appointment_document) {
        submitData.append('appointment_document', formData.appointment_document);
      }

      let url = '/api/organization/assignments/';
      let method = 'POST';
      
      if (currentAssignment) {
        url = `/api/organization/assignments/${currentAssignment.id}/`;
        method = 'PATCH';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: submitData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar asignación');
      }

      const result = await response.json();
      
      toast.success(
        currentAssignment 
          ? 'Asignación actualizada exitosamente' 
          : 'Usuario asignado exitosamente'
      );

      if (onSuccess) {
        onSuccess(result);
      }
      
      onClose();
      
    } catch (error: any) {
      console.error('Error al guardar asignación:', error);
      toast.error(error.message || 'Error al guardar la asignación');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    if (!currentAssignment) return;

    if (!confirm('¿Estás seguro de que deseas desasignar este usuario del cargo?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/organization/assignments/${currentAssignment.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al desasignar usuario');
      }

      toast.success('Usuario desasignado exitosamente');
      
      if (onSuccess) {
        // Pasar assignment con end_date actualizada
        onSuccess({
          ...currentAssignment,
          end_date: new Date().toISOString().split('T')[0],
          is_current: false
        });
      }
      
      onClose();
      
    } catch (error: any) {
      console.error('Error al desasignar usuario:', error);
      toast.error(error.message || 'Error al desasignar usuario');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // DATOS COMPUTADOS
  // ============================================================================

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUser = users.find(user => user.id === formData.user);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          
          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="ri-user-add-line me-2"></i>
              {currentAssignment ? 'Editar Asignación' : 'Asignar Usuario'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              
              {/* Información del cargo */}
              <div className="alert alert-info mb-3">
                <div className="d-flex align-items-center">
                  <i className="ri-briefcase-line me-2"></i>
                  <div>
                    <strong>{position.name}</strong>
                    <br />
                    <small className="text-muted">{position.code}</small>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                
                {/* Búsqueda y selección de usuario */}
                <div className="col-12">
                  <label className="form-label">
                    Usuario <span className="text-danger">*</span>
                  </label>
                  
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar usuario por nombre o email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={loading || loadingUsers}
                    />
                  </div>

                  <div className="user-selection-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {loadingUsers ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm" role="status"></div>
                        <span className="ms-2">Cargando usuarios...</span>
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className={`user-option p-2 border rounded mb-1 ${
                            formData.user === user.id ? 'border-primary bg-primary-subtle' : 'border-light'
                          }`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleInputChange('user', user.id)}
                        >
                          <div className="d-flex align-items-center">
                            <div className="user-avatar me-2">
                              {user.photo_url ? (
                                <img
                                  src={user.photo_url}
                                  alt={user.full_name}
                                  className="rounded-circle"
                                  style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                                  style={{ width: '32px', height: '32px', fontSize: '14px' }}
                                >
                                  {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </div>
                              )}
                            </div>
                            <div className="user-info">
                              <div className="user-name">{user.full_name}</div>
                              <div className="user-email text-muted small">{user.email}</div>
                            </div>
                            {formData.user === user.id && (
                              <div className="ms-auto">
                                <i className="ri-check-line text-primary"></i>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-3 text-muted">
                        {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
                      </div>
                    )}
                  </div>

                  {errors.user && <div className="text-danger small mt-1">{errors.user}</div>}
                </div>

                {/* Tipo de asignación */}
                <div className="col-12">
                  <label className="form-label">Tipo de Asignación</label>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="assignment_type"
                          id="permanent"
                          value="PERMANENT"
                          checked={formData.assignment_type === 'PERMANENT'}
                          onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="permanent">
                          Permanente
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="assignment_type"
                          id="temporary"
                          value="TEMPORARY"
                          checked={formData.assignment_type === 'TEMPORARY'}
                          onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="temporary">
                          Temporal
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="assignment_type"
                          id="interim"
                          value="INTERIM"
                          checked={formData.assignment_type === 'INTERIM'}
                          onChange={(e) => handleInputChange('assignment_type', e.target.value)}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="interim">
                          Encargo
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="col-md-6">
                  <label className="form-label">
                    Fecha de Inicio <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    disabled={loading}
                  />
                  {errors.start_date && <div className="invalid-feedback">{errors.start_date}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Fecha de Fin
                    {formData.assignment_type === 'TEMPORARY' && <span className="text-danger"> *</span>}
                  </label>
                  <input
                    type="date"
                    className={`form-control ${errors.end_date ? 'is-invalid' : ''}`}
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    disabled={loading}
                  />
                  {errors.end_date && <div className="invalid-feedback">{errors.end_date}</div>}
                </div>

                {/* Documento de nombramiento */}
                <div className="col-12">
                  <label className="form-label">Documento de Nombramiento (Opcional)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  <div className="form-text">
                    Formatos permitidos: PDF, DOC, DOCX. Tamaño máximo: 5MB
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              {currentAssignment && (
                <button
                  type="button"
                  className="btn btn-outline-danger me-auto"
                  onClick={handleUnassign}
                  disabled={loading}
                >
                  <i className="ri-user-unfollow-line me-1"></i>
                  Desasignar
                </button>
              )}
              
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !formData.user}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line me-1"></i>
                    {currentAssignment ? 'Actualizar' : 'Asignar'}
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

export default AssignUserModal;