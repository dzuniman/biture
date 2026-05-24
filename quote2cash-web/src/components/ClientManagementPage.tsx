import type { Client, ClientCreateRequest } from '../types';
import ClientForm from './ClientForm';

interface Props {
  client?: Client;
  isNew: boolean;
  onSubmit: (payload: ClientCreateRequest) => Promise<void>;
  onCancel: () => void;
  isDuplicate?: boolean;
}

export default function ClientManagementPage({
  client,
  isNew,
  onSubmit,
  onCancel,
  isDuplicate = false
}: Props) {
  const title = isDuplicate
    ? 'Duplicate Client'
    : isNew
      ? 'Create New Client'
      : 'Edit Client';

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          <p>
            {isDuplicate
              ? 'Create a copy of this client'
              : isNew
                ? 'Add a new client to your system'
                : 'Update client information'}
          </p>
        </div>
        <button onClick={onCancel} className="btn-secondary">
          ← Back
        </button>
      </div>

      <div className="management-container">
        <ClientForm
          initialData={client}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
