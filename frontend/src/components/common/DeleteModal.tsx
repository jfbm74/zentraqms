/**
 * DeleteModal Component
 * 
 * Reusable confirmation modal for delete operations
 * Based on Velzon's DeleteModal pattern.
 */

import React from 'react';

interface DeleteModalProps {
  show?: boolean;
  onDeleteClick?: () => void;
  onCloseClick?: () => void;
  recordId?: string;
  title?: string;
  message?: string;
  isLoading?: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ 
  show = false, 
  onDeleteClick, 
  onCloseClick, 
  recordId,
  title = '¿Está seguro?',
  message,
  isLoading = false,
}) => {
  const defaultMessage = recordId 
    ? `¿Está seguro de que desea eliminar el registro ${recordId}?`
    : '¿Está seguro de que desea eliminar este registro?';

  return (
    <>
      {/* Native Bootstrap Modal */}
      <div 
        className={`modal fade ${show ? 'show' : ''}`}
        style={{ display: show ? 'block' : 'none' }}
        tabIndex={-1}
        aria-hidden={!show}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body py-3 px-5">
              <div className="mt-2 text-center">
                <i className="ri-delete-bin-6-line display-5 text-danger"></i>
                <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                  <h4>{title}</h4>
                  <p className="text-muted mx-4 mb-0">
                    {message || defaultMessage}
                  </p>
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                <button
                  type="button"
                  className="btn btn-light w-sm"
                  onClick={onCloseClick}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger w-sm"
                  onClick={onDeleteClick}
                  disabled={isLoading}
                >
                  {isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal backdrop */}
      {show && (
        <div 
          className="modal-backdrop fade show"
          onClick={onCloseClick}
        ></div>
      )}
    </>
  );
};

export default DeleteModal;