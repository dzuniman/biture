import { useEffect, useState, type FormEvent } from 'react';
import type { Client, Statement, StatementCreateRequest } from '../types';

interface Props {
  clients: Client[];
  initialData?: Statement;
  onSubmit: (payload: StatementCreateRequest) => Promise<void>;
  onCancel?: () => void;
}

export default function StatementForm({ clients, initialData, onSubmit, onCancel }: Props) {
  const [clientId, setClientId] = useState('');
  const [period, setPeriod] = useState('');
  const [balance, setBalance] = useState('');
  const [status, setStatus] = useState('Draft');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.client?.id ?? '');
      setPeriod(initialData.period);
      setBalance(initialData.balance.toString());
      setStatus(initialData.status);
    } else {
      setClientId('');
      setPeriod('');
      setBalance('');
      setStatus('Draft');
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    await onSubmit({
      clientId: clientId || undefined,
      period: period.trim(),
      balance: Number(balance),
      status
    });

    setIsSaving(false);
  };

  return (
    <div className="card">
      <h2>{initialData ? 'Edit Statement' : 'Add Statement'}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Client
          <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
            <option value="">No client selected</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Period
          <input value={period} onChange={(event) => setPeriod(event.target.value)} required />
        </label>
        <label>
          Balance
          <input type="number" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} required />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Closed">Closed</option>
          </select>
        </label>
        <div className="form-actions">
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : initialData ? 'Update Statement' : 'Save Statement'}
          </button>
          {initialData && onCancel && (
            <button type="button" className="secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
