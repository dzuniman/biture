import { useEffect, useState, type FormEvent } from 'react';
import type { Invoice, InvoiceCreateRequest, Quote } from '../types';
import { getInvoiceNextNumber } from '../api';

interface Props {
  quotes: Quote[];
  initialData?: Invoice;
  onSubmit: (payload: InvoiceCreateRequest) => Promise<void>;
  onCancel?: () => void;
}

export default function InvoiceForm({ quotes, initialData, onSubmit, onCancel }: Props) {
  const [quoteId, setQuoteId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setQuoteId(initialData.quote?.id ?? '');
      setInvoiceNumber(initialData.invoiceNumber);
      setDescription(initialData.description ?? '');
      setDate(initialData.createdAt ? initialData.createdAt.slice(0, 10) : '');
      setStatus(initialData.status);
    } else {
      setQuoteId('');
      setInvoiceNumber('');
      setDescription('');
      setDate(new Date().toISOString().slice(0, 10));
      setStatus('Draft');
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData && !invoiceNumber) {
      getInvoiceNextNumber().then((nextNumber) => {
        setInvoiceNumber(nextNumber);
      }).catch(() => {
        // ignore next number failure and allow manual input
      });
    }
  }, [initialData, invoiceNumber]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quoteId) {
      window.alert('Please select a quote before saving the invoice.');
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    await onSubmit({
      quoteId,
      invoiceNumber: invoiceNumber.trim(),
      description: description.trim(),
      status,
      date: new Date(date).toISOString()
    });
    setIsSaving(false);
  };

  return (
    <div className="card">
      <h2>{initialData ? 'Edit Invoice' : 'Add Invoice'}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Quote
          <select value={quoteId} onChange={(event) => setQuoteId(event.target.value)} required>
            <option value="">Select a quote</option>
            {quotes.map((quote) => (
              <option key={quote.id} value={quote.id}>
                {quote.reference} — {quote.quoteNumber}
              </option>
            ))}
          </select>
        </label>
        <label>
          Invoice number
          <input
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
            required={Boolean(initialData)}
            readOnly={!initialData}
            placeholder="Auto-generated when creating a new invoice"
          />
        </label>
        <label>
          Description
          <input value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
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
          {onCancel && (
            <button type="button" className="secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
