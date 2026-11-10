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
            <div className="container mt-4">
                <h2>Clientes</h2>
                <div className="alert alert-info">
                    Cargando clientes...
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h2>Clientes</h2>

            {error && <div className="alert alert-danger">{error}</div>}

            <Link
                to="/new-client"
                className="btn btn-primary mb-3">
                ➕ Nuevo Cliente
            </Link>

            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center text-muted">
                                No hay clientes registrados
                            </td>
                        </tr>
                    ) : (
                        clients.map(client => (
                            <tr key={client.id}>
                                <td>{client.id}</td>
                                <td>{client.name}</td>
                                <td>{client.email}</td>
                                <td>{client.phone}</td>
                                <td>
                                    <Link
                                        to={`/edit-client/${client.id}`}
                                        className="btn btn-sm btn-warning me-2">
                                        ✏️ Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(client.id, client.name)}
                                        className="btn btn-sm btn-danger">
                                        🗑️ Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

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