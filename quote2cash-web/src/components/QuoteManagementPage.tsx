import type { Client, Quote, QuoteCreateRequest } from '../types';
import QuoteForm from './QuoteForm';

interface Props {
  quote?: Quote;
  clients: Client[];
  selectedClientId?: string;
  onSelectClientId?: (clientId: string) => void;
  isNew: boolean;
  onSubmit: (payload: QuoteCreateRequest) => Promise<void>;
  onCancel: () => void;
  onRequestNewClient: () => void;
  isDuplicate?: boolean;
}

export default function QuoteManagementPage({
  quote,
  clients,
  selectedClientId,
  onSelectClientId,
  isNew,
  onSubmit,
  onCancel,
  onRequestNewClient,
  isDuplicate = false
}: Props) {
  const title = isDuplicate
    ? 'Duplicate Quote'
    : isNew
      ? 'Create New Quote'
      : 'Edit Quote';

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          <p>
            {isDuplicate
              ? 'Create a copy of this quote'
              : isNew
                ? 'Create a new quotation'
                : 'Update quote details'}
          </p>
        </div>
        <button onClick={onCancel} className="btn-secondary">
          ← Back
        </button>
      </div>

      <div className="management-container">
        <QuoteForm
          clients={clients}
          initialData={quote}
          selectedClientId={selectedClientId}
          onSelectClientId={onSelectClientId}
          onSubmit={onSubmit}
          onCancel={onCancel}
          onRequestNewClient={onRequestNewClient}
          isDuplicate={isDuplicate}
        />
      </div>
    </div>
  );
}
