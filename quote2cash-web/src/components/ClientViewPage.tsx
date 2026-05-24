import type { Client } from '../types';

interface Props {
  client: Client;
  onEdit: () => void;
  onDuplicate: () => void;
  onBack: () => void;
}

export default function ClientViewPage({ client, onEdit, onDuplicate, onBack }: Props) {
  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>{client.name}</h2>
          <p>Client details and information</p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          ← Back to Clients
        </button>
      </div>

      <div className="view-container">
        <div className="view-card">
          <div className="view-section">
            <h3>Contact Information</h3>
            <div className="view-row">
              <span className="view-label">Name:</span>
              <span className="view-value">{client.name}</span>
            </div>
            <div className="view-row">
              <span className="view-label">Representative:</span>
              <span className="view-value">{client.representativeName || '—'}</span>
            </div>
            <div className="view-row">
              <span className="view-label">Phone Number:</span>
              <span className="view-value">{client.representativeNumber || '—'}</span>
            </div>
          </div>

          <div className="view-section">
            <h3>Address</h3>
            <div className="view-row">
              <span className="view-label">Line 1:</span>
              <span className="view-value">{client.addressLine1 || '—'}</span>
            </div>
            <div className="view-row">
              <span className="view-label">Line 2:</span>
              <span className="view-value">{client.addressLine2 || '—'}</span>
            </div>
            <div className="view-row">
              <span className="view-label">Line 3:</span>
              <span className="view-value">{client.addressLine3 || '—'}</span>
            </div>
            <div className="view-row">
              <span className="view-label">Line 4:</span>
              <span className="view-value">{client.addressLine4 || '—'}</span>
            </div>
          </div>

          <div className="view-actions">
            <button onClick={onEdit} className="btn-primary">
              Edit Client
            </button>
            <button onClick={onDuplicate} className="btn-secondary">
              Duplicate Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
