import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientsService } from '../services/ClientsService';
import { Client } from '../interface/Clients';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function EditClientPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [client, setClient] = useState<Client>({
        id: undefined,
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const loadClient = async () => {
            try {
                if (!id) {
                    setError('ID de cliente no proporcionado');
                    setLoading(false);
                    return;
                }
                setLoading(true);
                const data = await ClientsService.getClient(Number(id));
                setClient(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching client:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

        loadClient();
    }, [id]);

    const save = async () => {
        try {
            if (!id) return;
            await ClientsService.updateClient(Number(id), client);
            navigate('/home');
        } catch (err) {
            console.error('Error:', err);
            setError(err instanceof Error ? err.message : 'Error al guardar');
        }
    };

    const remove = async () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            if (!id) return;
            await ClientsService.deleteClient(Number(id));
            navigate('/home');
        } catch (err) {
            console.error('Error:', err);
            setError(err instanceof Error ? err.message : 'Error al eliminar');
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '40px',
                    borderRadius: '15px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '28px', marginBottom: '16px' }}>⏳</div>
                    <div style={{ color: '#667eea', fontWeight: '600', fontSize: '16px' }}>
                        Cargando cliente...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px 20px'
        }}>
            <div className="container" style={{ maxWidth: '500px' }}>
                {/* Header */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '15px',
                    padding: '30px',
                    marginBottom: '20px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                    <h1 style={{
                        margin: '0',
                        color: '#1f2937',
                        fontSize: '28px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        ✏️ Editar Cliente
                    </h1>
                </div>

                {/* Error Alert */}
                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        border: '2px solid #fca5a5',
                        borderRadius: '10px',
                        padding: '16px 20px',
                        marginBottom: '20px',
                        color: '#b91c1c',
                        fontWeight: '500'
                    }}>
                        ❌ {error}
                    </div>
                )}

                {/* Form Card */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '15px',
                    padding: '30px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                    {/* Name Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#374151',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}>
                            👤 Nombre
                        </label>
                        <input
                            type="text"
                            placeholder="Ingresa el nombre del cliente"
                            value={client.name}
                            onChange={(e) =>
                                setClient({
                                    ...client,
                                    name: e.target.value
                                })
                            }
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '2px solid #e5e7eb',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box',
                                backgroundColor: '#f9fafb'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#667eea';
                                e.currentTarget.style.backgroundColor = 'white';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                            }}
                        />
                    </div>

                    {/* Email Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#374151',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}>
                            📧 Email
                        </label>
                        <input
                            type="email"
                            placeholder="Ingresa el email del cliente"
                            value={client.email}
                            onChange={(e) =>
                                setClient({
                                    ...client,
                                    email: e.target.value
                                })
                            }
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '2px solid #e5e7eb',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box',
                                backgroundColor: '#f9fafb'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#667eea';
                                e.currentTarget.style.backgroundColor = 'white';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                            }}
                        />
                    </div>

                    {/* Phone Input */}
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#374151',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}>
                            📱 Teléfono
                        </label>
                        <input
                            type="tel"
                            placeholder="Ingresa el teléfono del cliente"
                            value={client.phone}
                            onChange={(e) =>
                                setClient({
                                    ...client,
                                    phone: e.target.value
                                })
                            }
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '2px solid #e5e7eb',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box',
                                backgroundColor: '#f9fafb'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#667eea';
                                e.currentTarget.style.backgroundColor = 'white';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                            }}
                        />
                    </div>

                    {/* Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        flexDirection: 'column'
                    }}>
                        <button
                            onClick={save}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#059669';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#10b981';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            ✅ Guardar Cambios
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#4b5563';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#6b7280';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            ↩️ Cancelar
                        </button>
                        <button
                            onClick={remove}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                borderRadius: '8px',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#dc2626';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ef4444';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            🗑️ Eliminar Cliente
                        </button>
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <ConfirmDeleteModal
                    clientName={client.name}
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}
        </div>
    );
}