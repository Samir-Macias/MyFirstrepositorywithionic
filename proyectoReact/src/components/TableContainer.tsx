import React, { useEffect, useState } from 'react';
import { ClientsService } from '../services/ClientsService';
import { Client } from '../interface/Clients';

function MiTabla(): React.JSX.Element {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await ClientsService.getClients();
      setClients(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    const ok = window.confirm('¿Está seguro de que desea eliminar este cliente?');
    if (!ok) return;
    
    try {
      await ClientsService.deleteClient(id);
      loadClients();
    } catch (err) {
      console.error('Error deleting client:', err);
      alert('Error al eliminar el cliente');
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Cargando clientes...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  if (clients.length === 0) {
    return <div style={{ padding: '20px' }}>No hay clientes disponibles. <a href="/new-client">Crear uno</a></div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Nombre</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Email</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Teléfono</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{client.id}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{client.name}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{client.email}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{client.phone}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                <a href={`/edit-client/${client.id}`} style={{ marginRight: '10px', color: '#007bff', textDecoration: 'none' }}>
                  ✏️ Editar
                </a>
                <button
                  onClick={() => handleDelete(client.id)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MiTabla;
