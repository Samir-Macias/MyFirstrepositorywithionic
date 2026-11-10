import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientsService } from '../services/ClientsService';

export default function NewClientPage() {
    const navigate = useNavigate();
    const [client, setClient] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const save = async () => {
        await ClientsService.addClient(client);
        navigate('/home');
    };

    return (
        <div className="container mt-4">
            <h2>
                Nuevo Cliente
            </h2>
            <input
                className="form-control mb-2"
                placeholder="Nombre"
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
                onChange={(e) =>
                    setClient({
                        ...client,
                        phone: e.target.value
                    })
                }
            />
            <button
                className="btn btn-success"
                onClick={save}
            >
                Guardar
            </button>
        </div>
    );
}