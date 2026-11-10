import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClientsService } from '../services/ClientsService';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ id: number; name: string } | null>(null);

    const loadClients = async () => {
        try {
            setLoading(true);
            const data = await ClientsService.getClients();
            setClients(data);
            setError(null);
        } catch (err) {
            console.error('Error loading clients:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    const handleDelete = async (id: number, name: string) => {
        setDeleteModal({ id, name });
    };

    const confirmDelete = async () => {
        if (!deleteModal) return;

        try {
            await ClientsService.deleteClient(deleteModal.id);
            setClients(clients.filter(client => client.id !== deleteModal.id));
            setDeleteModal(null);
        } catch (err) {
            console.error('Error deleting client:', err);
            setError(err instanceof Error ? err.message : 'Error al eliminar');
            setDeleteModal(null);
        }
    };

    if (loading) {
        return (
            <div className="container mt-5">
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '20px 40px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '12px',
                        border: '2px solid #3b82f6'
                    }}>
                        <div style={{ fontSize: '18px', color: '#3b82f6', fontWeight: '500' }}>
                            ⏳ Cargando clientes...
                        </div>
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
            <div className="container">
                {/* Header Section */}
                <div style={{
                    marginBottom: '40px',
                    backgroundColor: 'white',
                    borderRadius: '15px',
                    padding: '30px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <h1 style={{
                                margin: '0',
                                color: '#1f2937',
                                fontSize: '32px',
                                fontWeight: '700'
                            }}>
                                👥 Gestión de Clientes
                            </h1>
                            <p style={{
                                margin: '8px 0 0 0',
                                color: '#6b7280',
                                fontSize: '14px'
                            }}>
                                Total: <strong>{clients.length}</strong> cliente{clients.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <Link
                            to="/new-client"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '15px',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#059669';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#10b981';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                            }}>
                            ➕ Nuevo Cliente
                        </Link>
                    </div>
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

                {/* Table Section */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                    {clients.length === 0 ? (
                        <div style={{
                            padding: '60px 20px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                            <p style={{
                                color: '#6b7280',
                                fontSize: '16px',
                                margin: '0'
                            }}>
                                No hay clientes registrados
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '14px'
                            }}>
                                <thead style={{
                                    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white'
                                }}>
                                    <tr>
                                        <th style={{
                                            padding: '18px',
                                            textAlign: 'left',
                                            fontWeight: '600',
                                            borderBottom: '3px solid #764ba2'
                                        }}>ID</th>
                                        <th style={{
                                            padding: '18px',
                                            textAlign: 'left',
                                            fontWeight: '600',
                                            borderBottom: '3px solid #764ba2'
                                        }}>Nombre</th>
                                        <th style={{
                                            padding: '18px',
                                            textAlign: 'left',
                                            fontWeight: '600',
                                            borderBottom: '3px solid #764ba2'
                                        }}>Email</th>
                                        <th style={{
                                            padding: '18px',
                                            textAlign: 'left',
                                            fontWeight: '600',
                                            borderBottom: '3px solid #764ba2'
                                        }}>Teléfono</th>
                                        <th style={{
                                            padding: '18px',
                                            textAlign: 'center',
                                            fontWeight: '600',
                                            borderBottom: '3px solid #764ba2'
                                        }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map((client, index) => (
                                        <tr
                                            key={client.id}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafafa';
                                            }}
                                            style={{
                                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                                                transition: 'background-color 0.2s ease',
                                                borderBottom: '1px solid #e5e7eb'
                                            }}>
                                            <td style={{
                                                padding: '16px 18px',
                                                color: '#667eea',
                                                fontWeight: '600'
                                            }}>#{client.id}</td>
                                            <td style={{
                                                padding: '16px 18px',
                                                color: '#1f2937',
                                                fontWeight: '500'
                                            }}>{client.name}</td>
                                            <td style={{
                                                padding: '16px 18px',
                                                color: '#6b7280',
                                                fontSize: '13px'
                                            }}>{client.email}</td>
                                            <td style={{
                                                padding: '16px 18px',
                                                color: '#6b7280'
                                            }}>{client.phone}</td>
                                            <td style={{
                                                padding: '16px 18px',
                                                textAlign: 'center'
                                            }}>
                                                <Link
                                                    to={`/edit-client/${client.id}`}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '8px 14px',
                                                        backgroundColor: '#f59e0b',
                                                        color: 'white',
                                                        textDecoration: 'none',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        fontSize: '12px',
                                                        marginRight: '8px',
                                                        transition: 'all 0.2s ease',
                                                        transform: 'scale(1)',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#d97706';
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#f59e0b';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}>
                                                    ✏️ Editar
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(client.id, client.name)}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '8px 14px',
                                                        backgroundColor: '#ef4444',
                                                        color: 'white',
                                                        textDecoration: 'none',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        fontSize: '12px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        transform: 'scale(1)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#dc2626';
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#ef4444';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}>
                                                    🗑️ Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {deleteModal && (
                <ConfirmDeleteModal
                    clientName={deleteModal.name}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteModal(null)}
                />
            )}
        </div>
    );
}