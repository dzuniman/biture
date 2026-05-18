import { useState, type FormEvent } from 'react';
import type { Client, InvoiceCreateRequest } from '../types';

interface Props {
  clients: Client[];
  onSubmit: (payload: InvoiceCreateRequest) => Promise<void>;
}

export default function InvoiceForm({ clients, onSubmit }: Props) {
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    await onSubmit({
      clientId: clientId || undefined,
      invoiceNumber: invoiceNumber.trim(),
      description: description.trim(),
      amount: Number(amount),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      status
    });

    setClientId('');
    setInvoiceNumber('');
    setDescription('');
    setAmount('');
    setDueDate('');
    setStatus('Draft');
    setIsSaving(false);
  };

  return (
    <div className="card">
      <h2>Add Invoice</h2>
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
          Invoice number
          <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} required />
        </label>
        <label>
          Description
          <input value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Amount
          <input type="number" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
        </label>
        <label>
          Due date
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </label>
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Invoice'}
        </button>
      </form>
    </div>
  );
}
