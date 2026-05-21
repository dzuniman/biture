import type { Client } from '../types';

interface Props {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function ClientList({ clients, onEdit, onDelete }: Props) {
  const formatAddress = (client: Client) => {
    return [client.addressLine1, client.addressLine2, client.addressLine3, client.addressLine4]
      .filter(Boolean)
      .join(', ') || '—';
  };

  return (
    <div className="card">
      <h2>Clients</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Representative</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.name}</td>
              <td>{client.representativeName ?? '—'}</td>
              <td>{client.representativeNumber ?? '—'}</td>
              <td>{formatAddress(client)}</td>
              <td className="actions-row">
                <button type="button" onClick={() => onEdit(client)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDelete(client.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
