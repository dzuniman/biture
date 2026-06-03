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
      setInvoiceNumber(initialData.invoiceNumber ?? '');
      setDescription(initialData.description ?? '');

      let dateStr = '';
      const rawDate = (initialData as any).date || initialData.createdAt;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().slice(0, 10);
        }
      }
      setDate(dateStr);
      setStatus(initialData.status ?? 'Draft');
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      setQuoteId('');
      setInvoiceNumber(`INV${year}${month}0001`);
      setDescription('');
      setDate(now.toISOString().slice(0, 10));
      setStatus('Draft');
    }
  }, [initialData]);

  useEffect(() => {
    const now = new Date();
    const prefix = `INV${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const defaultWithSequence = `${prefix}0001`;

    if (!initialData && (invoiceNumber === '' || invoiceNumber === prefix || invoiceNumber === defaultWithSequence)) {
      getInvoiceNextNumber().then((nextNumber) => {
        // Ensure the number matches the sequence pattern if the API returns a raw digit
        let formatted = nextNumber;
        if (nextNumber && !nextNumber.startsWith('INV')) {
          formatted = `${prefix}${nextNumber.padStart(4, '0')}`;
        }
        setInvoiceNumber(prev => (prev === '' || prev === prefix || prev === defaultWithSequence ? formatted : prev));
      }).catch(() => {
        // ignore next number failure and allow manual input
      });
    }
  }, [initialData, invoiceNumber]);

  const handleQuoteChange = (id: string) => {
    setQuoteId(id);
    const selectedQuote = quotes.find(q => q.id === id);
    // Inherit description from the client name if a quote is selected and description is currently empty
    if (selectedQuote && (!description || description === '')) {
      const clientName = selectedQuote.client?.name ?? '';
      setDescription(clientName ? `Invoice for ${clientName}` : '');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quoteId) {
      window.alert('Please select a quote before saving the invoice.');
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    const submissionDate = date ? new Date(date) : new Date();
    await onSubmit({
      quoteId,
      invoiceNumber: invoiceNumber.trim(),
      description: description.trim(),
      status,
      date: isNaN(submissionDate.getTime()) ? new Date().toISOString() : submissionDate.toISOString()
    });
    setIsSaving(false);
  };

  return (
    <div className="card">
      <h2>{initialData ? 'Edit Invoice' : 'Add Invoice'}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Quote
          <select value={quoteId} onChange={(event) => handleQuoteChange(event.target.value)} required>
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
            required
            placeholder={`e.g., INV${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}0001`}
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
