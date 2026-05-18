import { useState, type FormEvent } from 'react';
import type { Client, QuoteCreateRequest } from '../types';

interface Props {
  clients: Client[];
  onSubmit: (payload: QuoteCreateRequest) => Promise<void>;
}

const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected'];

export default function QuoteForm({ clients, onSubmit }: Props) {
  const [clientId, setClientId] = useState('');
  const [reference, setReference] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState(statuses[0]);
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    await onSubmit({
      clientId: clientId || undefined,
      reference: reference.trim(),
      customerName: customerName.trim(),
      description: description.trim(),
      amount: Number(amount),
      status,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
    });

    setClientId('');
    setReference('');
    setCustomerName('');
    setDescription('');
    setAmount('');
    setStatus(statuses[0]);
    setDueDate('');
    setIsSaving(false);
  };

  return (
    <div className="card">
      <h2>Add Quote</h2>
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
          Reference
          <input value={reference} onChange={(event) => setReference(event.target.value)} />
        </label>
        <label>
          Customer name
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            required
          />
        </label>
        <label>
          Description
          <input value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Amount
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </label>
        <label>
          Due date
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Quote'}
        </button>
      </form>
    </div>
  );
}
