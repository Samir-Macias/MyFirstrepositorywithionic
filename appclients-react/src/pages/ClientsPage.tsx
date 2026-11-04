import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ClientsService } from '../services/ClientsService';

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([]);

    const loadClients = async () => {
        const data = await ClientsService.getClients();
        setClients(data);
        console.log(clients)
    };

    useEffect(() => { loadClients(); }, []);
    return (
        <div className="container mt-4">
            <h2>
                Clientes
            </h2>
            <Link
                to="/new-client"
                className=
                "btn btn-primary mb-3">
                Nuevo Cliente
            </Link>
            <table
                className=
                "table table-bordered">
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
                    {clients.map(
                        client => (
                            <tr
                                key={client.id}>
                                <td>
                                    {client.id}
                                </td>
                                <td>
                                    {client.name}
                                </td>
                                <td>
                                    {client.email}
                                </td>
                                <td>
                                    {client.phone}
                                </td>
                                <td>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
}