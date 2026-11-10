import { useState } from 'react';

interface ConfirmDeleteModalProps {
    clientName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDeleteModal({
    clientName,
    onConfirm,
    onCancel
}: ConfirmDeleteModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal fade show"
                style={{
                    display: 'block',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }}
                tabIndex={-1}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header bg-danger text-white">
                            <h5 className="modal-title">
                                ⚠️ Confirmar eliminación
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onCancel}
                                disabled={isDeleting}
                            />
                        </div>
                        <div className="modal-body">
                            <p>
                                ¿Está seguro de que desea eliminar a <strong>{clientName}</strong>?
                            </p>
                            <p className="text-danger small">
                                Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onCancel}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                            aria-hidden="true"
                                        />
                                        Eliminando...
                                    </>
                                ) : (
                                    <>🗑️ Sí, eliminar</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
