/**
 * DeleteModal Component
 * 
 * Reusable confirmation modal for delete operations
 * Based on Velzon's DeleteModal pattern.
 */

import React from 'react';
import { Modal, ModalBody, Button } from 'reactstrap';
import { RiDeleteBin6Line } from 'react-icons/ri';

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
    <Modal fade={true} isOpen={show} toggle={onCloseClick} centered={true}>
      <ModalBody className="py-3 px-5">
        <div className="mt-2 text-center">
          <RiDeleteBin6Line className="display-5 text-danger" />
          <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
            <h4>{title}</h4>
            <p className="text-muted mx-4 mb-0">
              {message || defaultMessage}
            </p>
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
          <Button
            type="button"
            color="light"
            className="w-sm"
            onClick={onCloseClick}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            color="danger"
            className="w-sm"
            onClick={onDeleteClick}
            disabled={isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default DeleteModal;