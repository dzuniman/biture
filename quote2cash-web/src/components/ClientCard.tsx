import type { Client } from '../types';

interface Props {
  client: Client;
  onEdit: (client: Client) => void;
  onView: (client: Client) => void;
  onDelete: (clientId: string) => void;
}

export default function ClientCard({ client, onEdit, onView, onDelete }: Props) {
  return (
    <div className="card-item">
      <div className="card-item-header">
        <h3>{client.name}</h3>
      </div>
      <div className="card-item-body">
        <div className="card-item-detail">
          <span className="label">Vendor:</span>
          <span>{client.vendorNumber || '—'}</span>
        </div>
        <div className="card-item-detail">
          <span className="label">Representative:</span>
          <span>{client.representativeName || '—'}</span>
        </div>
        <div className="card-item-detail">
          <span className="label">Phone:</span>
          <span>{client.representativeNumber || '—'}</span>
        </div>
        <div className="card-item-detail">
          <span className="label">Address:</span>
          <span>{client.addressLine1 || '—'}</span>
        </div>
      </div>
      <div className="card-item-footer">
        <button onClick={() => onView(client)} className="btn-secondary">
          View
        </button>
        <button onClick={() => onEdit(client)} className="btn-primary">
          Edit
        </button>
        <button onClick={() => onDelete(client.id)} className="btn-danger">
          Delete
        </button>
      </div>
    </div>
  );
}
