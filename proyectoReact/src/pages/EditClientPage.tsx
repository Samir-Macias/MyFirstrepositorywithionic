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
        return <div className="container mt-4">Cargando cliente...</div>;
    }

    return (
        <div className="container mt-4">
            <h2>Editar Cliente</h2>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            <input
                className="form-control mb-2"
                placeholder="Nombre"
                value={client.name}
                onChange={(e) =>
                    setClient({
                        ...client,
                        name: e.target.value
                    })
                }
            />
            <input
                className="form-control mb-2"
                placeholder="Email"
                value={client.email}
                onChange={(e) =>
                    setClient({
                        ...client,
                        email: e.target.value
                    })
                }
            />
            <input
                className="form-control mb-2"
                placeholder="Teléfono"
                value={client.phone}
                onChange={(e) =>
                    setClient({
                        ...client,
                        phone: e.target.value
                    })
                }
            />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                    className="btn btn-success"
                    onClick={save}
                >
                    Guardar
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/home')}
                >
                    Cancelar
                </button>
                <button
                    className="btn btn-danger"
                    onClick={remove}
                >
                    Eliminar
                </button>
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