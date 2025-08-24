import React, { useState, useEffect } from 'react';
import { Cargo } from '../../../types/organizationalChart';
import { PositionAssignment } from '../../../services/positionService';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface User {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  current_position?: string;
}

interface UserAssignmentModalProps {
  show: boolean;
  onHide: () => void;
  position: Cargo | null;
  onAssign: (assignmentData: PositionAssignment) => Promise<void>;
  loading: boolean;
}

interface FormData extends PositionAssignment {
  // Campos adicionales para el formulario
}

interface FormErrors {
  [key: string]: string;
}

const UserAssignmentModal: React.FC<UserAssignmentModalProps> = ({
  show,
  onHide,
  position,
  onAssign,
  loading
}) => {
  const [formData, setFormData] = useState<FormData>({
    user: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    assignment_type: 'PERMANENT' as const,
    appointment_document: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      setFormData({
        user: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        assignment_type: 'PERMANENT',
        appointment_document: ''
      });
      setErrors({});
      setSelectedUser(null);
      loadAvailableUsers();
    }
  }, [show]);

  // Simulate loading available users
  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      // In a real implementation, this would come from a user service
      const mockUsers: User[] = [
        {
          id: '1',
          full_name: 'Juan Pérez',
          email: 'juan.perez@example.com',
          is_active: true
        },
        {
          id: '2',
          full_name: 'María García',
          email: 'maria.garcia@example.com',
          is_active: true,
          current_position: 'Gerente de Calidad'
        },
        {
          id: '3',
          full_name: 'Carlos Rodríguez',
          email: 'carlos.rodriguez@example.com',
          is_active: true
        }
      ];
      
      setAvailableUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update selected user when user changes
    if (name === 'user') {
      const user = availableUsers.find(u => u.id === value);
      setSelectedUser(user || null);
    }

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

    if (!formData.user) {
      newErrors.user = 'Debe seleccionar un usuario';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es requerida';
    } else {
      const startDate = new Date(formData.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.start_date = 'La fecha de inicio no puede ser anterior a hoy';
      }
    }

    if (formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate <= startDate) {
        newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    if (formData.assignment_type === 'TEMPORARY' && !formData.end_date) {
      newErrors.end_date = 'La fecha de fin es requerida para asignaciones temporales';
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
      
      // Clean empty optional fields
      if (!cleanedData.end_date) {
        cleanedData.end_date = undefined;
      }
      
      if (!cleanedData.appointment_document?.trim()) {
        cleanedData.appointment_document = undefined;
      }

      await onAssign(cleanedData);
    } catch (error: any) {
      console.error('Error assigning user:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  // Get assignment type label
  const getAssignmentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'PERMANENT': 'Permanente',
      'TEMPORARY': 'Temporal',
      'INTERIM': 'Interino'
    };
    return labels[type] || type;
  };

  if (!position || !show) return null;

  const isReassignment = !!position.assigned_user;

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
                <div>
                  <h5 className="modal-title">
                    {isReassignment ? 'Reasignar Usuario' : 'Asignar Usuario al Puesto'}
                  </h5>
                  <div className="text-muted small">
                    {position.code} - {position.name}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onHide}
                  aria-label="Close"
                ></button>
              </div>
              
              <div className="modal-body">
                {/* Current Assignment Alert */}
                {isReassignment && (
                  <div className="alert alert-info d-flex align-items-start mb-4">
                    <i className="ri-information-line me-2 mt-1"></i>
                    <div>
                      <strong>Asignación Actual:</strong>
                      <br />
                      <strong>{position.assigned_user?.full_name}</strong> ({position.assigned_user?.email})
                      <br />
                      <small className="text-muted">
                        Esta asignación será reemplazada por la nueva asignación.
                      </small>
                    </div>
                  </div>
                )}

                <div className="row">
                  {/* User Selection */}
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label htmlFor="user" className="form-label">
                        Usuario <span className="text-danger">*</span>
                      </label>
                      {loadingUsers ? (
                        <div className="text-center py-3">
                          <LoadingSpinner />
                          <span className="ms-2">Cargando usuarios...</span>
                        </div>
                      ) : (
                        <select
                          className={`form-select ${errors.user ? 'is-invalid' : ''}`}
                          name="user"
                          id="user"
                          value={formData.user}
                          onChange={handleChange}
                        >
                          <option value="">Seleccionar usuario...</option>
                          {availableUsers.map(user => (
                            <option key={user.id} value={user.id} disabled={!user.is_active}>
                              {user.full_name} ({user.email})
                              {user.current_position && ` - ${user.current_position}`}
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.user && <div className="invalid-feedback">{errors.user}</div>}
                    </div>
                  </div>

                  {/* Selected User Info */}
                  {selectedUser && (
                    <div className="col-md-12">
                      <div className="card border-light bg-light mb-3">
                        <div className="card-body py-2">
                          <div className="d-flex align-items-center">
                            <div className="avatar-sm me-3">
                              <div className="avatar-title bg-primary-subtle text-primary rounded-circle">
                                <i className="ri-user-line"></i>
                              </div>
                            </div>
                            <div>
                              <h6 className="mb-1">{selectedUser.full_name}</h6>
                              <p className="text-muted mb-0 small">
                                {selectedUser.email}
                                {selectedUser.current_position && (
                                  <span className="ms-2">
                                    • Posición actual: {selectedUser.current_position}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="ms-auto">
                              <span className={`badge bg-${selectedUser.is_active ? 'success' : 'secondary'}`}>
                                {selectedUser.is_active ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assignment Dates */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="start_date" className="form-label">
                        Fecha de Inicio <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}
                        name="start_date"
                        id="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.start_date && <div className="invalid-feedback">{errors.start_date}</div>}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="end_date" className="form-label">
                        Fecha de Fin 
                        {formData.assignment_type === 'TEMPORARY' && (
                          <span className="text-danger"> *</span>
                        )}
                      </label>
                      <input
                        type="date"
                        className={`form-control ${errors.end_date ? 'is-invalid' : ''}`}
                        name="end_date"
                        id="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        min={formData.start_date}
                      />
                      {errors.end_date && <div className="invalid-feedback">{errors.end_date}</div>}
                      <small className="text-muted">
                        Dejar vacío para asignaciones permanentes
                      </small>
                    </div>
                  </div>

                  {/* Assignment Type */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="assignment_type" className="form-label">Tipo de Asignación</label>
                      <select
                        className="form-select"
                        name="assignment_type"
                        id="assignment_type"
                        value={formData.assignment_type}
                        onChange={handleChange}
                      >
                        <option value="PERMANENT">Permanente</option>
                        <option value="TEMPORARY">Temporal</option>
                        <option value="INTERIM">Interino</option>
                      </select>
                    </div>
                  </div>

                  {/* Assignment Summary */}
                  <div className="col-md-12">
                    <div className="card border-primary bg-primary-subtle mt-3">
                      <div className="card-body py-3">
                        <h6 className="text-primary mb-2">
                          <i className="ri-clipboard-line me-2"></i>
                          Resumen de la Asignación
                        </h6>
                        <div className="small">
                          <div><strong>Usuario:</strong> {selectedUser?.full_name || 'No seleccionado'}</div>
                          <div><strong>Puesto:</strong> {position.name} ({position.code})</div>
                          <div><strong>Área:</strong> {position.area_name}</div>
                          <div><strong>Tipo:</strong> {getAssignmentTypeLabel(formData.assignment_type)}</div>
                          <div><strong>Vigencia:</strong> 
                            {formData.start_date} 
                            {formData.end_date ? ` - ${formData.end_date}` : ' (Indefinido)'}
                          </div>
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
                <button type="submit" className="btn btn-primary" disabled={loading || !selectedUser}>
                  {loading && <LoadingSpinner />}
                  {loading ? 'Asignando...' : (isReassignment ? 'Reasignar' : 'Asignar')} Usuario
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

export default UserAssignmentModal;