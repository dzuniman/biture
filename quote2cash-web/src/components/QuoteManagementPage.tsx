import type { Client, Quote, QuoteCreateRequest, QuoteUom, QuoteDescription } from '../types';
import QuoteForm from './QuoteForm';

interface Props {
  quote?: Quote;
  clients: Client[];
  selectedClientId?: string;
  onSelectClientId?: (clientId: string) => void;
  uomOptions: QuoteUom[];
  descriptionOptions: QuoteDescription[];
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
  uomOptions,
  descriptionOptions,
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
          uomOptions={uomOptions}
          descriptionOptions={descriptionOptions}
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
