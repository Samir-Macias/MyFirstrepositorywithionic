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
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '15px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    maxWidth: '420px',
                    width: '90%',
                    animation: 'slideIn 0.3s ease'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: 'white',
                    padding: '24px 28px',
                    borderRadius: '15px 15px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>⚠️</span>
                        <h5 style={{ margin: '0', fontWeight: '700', fontSize: '18px' }}>
                            Confirmar eliminación
                        </h5>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            fontSize: '24px',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            padding: '0',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isDeleting) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '28px' }}>
                    <p style={{
                        margin: '0 0 16px 0',
                        color: '#1f2937',
                        fontSize: '16px',
                        lineHeight: '1.6'
                    }}>
                        ¿Está seguro de que desea eliminar a <strong style={{ color: '#dc2626' }}>{clientName}</strong>?
                    </p>
                    <div style={{
                        backgroundColor: '#fef2f2',
                        border: '2px solid #fee2e2',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        color: '#991b1b',
                        fontSize: '13px',
                        fontWeight: '500'
                    }}>
                        🔒 Esta acción no se puede deshacer.
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 28px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#e5e7eb',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            opacity: isDeleting ? '0.6' : '1',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isDeleting) {
                                e.currentTarget.style.backgroundColor = '#d1d5db';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: isDeleting ? '#ef4444' : '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            minWidth: '120px',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            if (!isDeleting) {
                                e.currentTarget.style.backgroundColor = '#b91c1c';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#dc2626';
                        }}
                    >
                        {isDeleting ? (
                            <>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: '12px',
                                        height: '12px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTop: '2px solid white',
                                        borderRadius: '50%',
                                        animation: 'spin 0.6s linear infinite'
                                    }}
                                />
                                Eliminando...
                            </>
                        ) : (
                            <>🗑️ Sí, eliminar</>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
