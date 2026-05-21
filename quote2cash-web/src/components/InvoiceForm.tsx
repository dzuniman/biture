import { useEffect, useState, type FormEvent } from 'react';
import type { Client, Invoice, InvoiceCreateRequest, Quote } from '../types';

interface Props {
  clients: Client[];
  quotes: Quote[];
  initialData?: Invoice;
  onSubmit: (payload: InvoiceCreateRequest) => Promise<void>;
  onCancel?: () => void;
}

export default function InvoiceForm({ clients, quotes, initialData, onSubmit, onCancel }: Props) {
  const [clientId, setClientId] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.client?.id ?? '');
      setQuoteId(initialData.quote?.id ?? '');
      setInvoiceNumber(initialData.invoiceNumber);
      setDescription(initialData.description ?? '');
      setAmount(initialData.amount.toString());
      setDueDate(initialData.dueDate ? initialData.dueDate.slice(0, 10) : '');
      setStatus(initialData.status);
    } else {
      setClientId('');
      setQuoteId('');
      setInvoiceNumber('');
      setAmount('');
      setDueDate('');
      setStatus('Draft');
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    await onSubmit({
      clientId: clientId || undefined,
      quoteId: quoteId || undefined,
      invoiceNumber: invoiceNumber.trim(),
      description: description.trim(),
      amount: Number(amount),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      status
    });

    setIsSaving(false);
  };

  return (
    <div className="card">
      <h2>{initialData ? 'Edit Invoice' : 'Add Invoice'}</h2>
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
          Quote
          <select value={quoteId} onChange={(event) => setQuoteId(event.target.value)}>
            <option value="">No quote selected</option>
            {quotes.map((quote) => (
              <option key={quote.id} value={quote.id}>
                {quote.reference}
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
        <div className="form-actions">
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : initialData ? 'Update Invoice' : 'Save Invoice'}
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
