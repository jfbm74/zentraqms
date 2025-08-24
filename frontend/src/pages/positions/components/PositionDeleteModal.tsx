import React from 'react';
import { Cargo } from '../../../types/organizationalChart';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

interface PositionDeleteModalProps {
  show: boolean;
  onHide: () => void;
  position: Cargo | null;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

const PositionDeleteModal: React.FC<PositionDeleteModalProps> = ({
  show,
  onHide,
  position,
  onConfirm,
  loading
}) => {
  if (!position || !show) return null;

  const hasAssignedUser = !!position.assigned_user;
  const hasCriticalRole = position.is_critical || position.is_process_owner || position.is_service_leader;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error in delete confirmation:', error);
    }
  };

  return (
    <>
      {/* Modal */}
      <div 
        className="modal fade show"
        style={{ display: 'block' }}
        tabIndex={-1}
        aria-hidden={false}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ri-delete-bin-line text-danger me-2"></i>
                Eliminar Puesto
              </h5>
              {!loading && (
                <button
                  type="button"
                  className="btn-close"
                  onClick={onHide}
                  aria-label="Close"
                ></button>
              )}
            </div>
            
            <div className="modal-body">
              <div className="text-center mb-4">
                <div className="avatar-lg mx-auto mb-3">
                  <div className="avatar-title bg-danger-subtle text-danger rounded-circle fs-2">
                    <i className="ri-delete-bin-line"></i>
                  </div>
                </div>
                <h5 className="mb-2">¿Estás seguro?</h5>
                <p className="text-muted mb-0">
                  Esta acción eliminará permanentemente el puesto y no se puede deshacer.
                </p>
              </div>

              {/* Position information */}
              <div className="bg-light p-3 rounded mb-3">
                <div className="row">
                  <div className="col-12">
                    <h6 className="mb-2">{position.name}</h6>
                    <div className="text-muted">
                      <small>
                        <strong>Código:</strong> {position.code} | 
                        <strong className="ms-2">Área:</strong> {position.area_name}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {hasAssignedUser && (
                <div className="alert alert-warning d-flex align-items-start">
                  <i className="ri-alert-line me-2 mt-1"></i>
                  <div>
                    <strong>Usuario Asignado:</strong>
                    <br />
                    Este puesto tiene asignado a <strong>{position.assigned_user?.full_name}</strong>. 
                    Al eliminar el puesto, la asignación también será removida.
                  </div>
                </div>
              )}

              {hasCriticalRole && (
                <div className="alert alert-danger d-flex align-items-start">
                  <i className="ri-error-warning-line me-2 mt-1"></i>
                  <div>
                    <strong>Puesto con Roles Críticos:</strong>
                    <br />
                    Este puesto tiene características críticas:
                    <ul className="mb-0 mt-1">
                      {position.is_critical && <li>Marcado como crítico</li>}
                      {position.is_process_owner && <li>Dueño de proceso</li>}
                      {position.is_service_leader && <li>Líder de servicio</li>}
                    </ul>
                    Asegúrate de que estas responsabilidades sean reasignadas antes de eliminar.
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer justify-content-center">
              <button 
                className="btn btn-light me-2"
                onClick={onHide}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading && <LoadingSpinner />}
                {loading ? 'Eliminando...' : 'Eliminar Puesto'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal backdrop */}
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default PositionDeleteModal;