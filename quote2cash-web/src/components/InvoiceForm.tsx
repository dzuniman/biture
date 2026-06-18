import { useEffect, useState, useRef, type FormEvent } from 'react'; // Added useRef
import type { Invoice, InvoiceCreateRequest, Quote, InvoiceQuote } from '../types';
import { getInvoiceNextNumber } from '../api';

// Define the expected API response structure for next numbers
// Define the expected API response structure for next numbers
interface NextNumberApiResponse {
  nextQuoteNumber?: string;
  NextQuoteNumber?: string;
  nextInvoiceNumber?: string;
  NextInvoiceNumber?: string;
  nextNumber?: string;
  NextNumber?: string;
}

interface Props {
  quotes: Quote[];
  initialData?: Invoice;
  onSubmit: (payload: InvoiceCreateRequest) => Promise<void>;
  onCancel?: () => void;
}

export default function InvoiceForm({ quotes, initialData, onSubmit, onCancel }: Props) {
  const [quoteId, setQuoteId] = useState('');
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isFetchingInvoiceNumber, setIsFetchingInvoiceNumber] = useState(false); // NEW: Loading state
  const [invoiceNumberError, setInvoiceNumberError] = useState<string | null>(null); // NEW: Error state
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const isFirstRender = useRef(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setQuoteId(initialData.quote?.id ?? '');
      setClientId((initialData as any).clientId || initialData.client?.id || '');
      setInvoiceNumber(initialData.invoiceNumber ?? '');
      setDescription(initialData.description ?? '');

      let dateStr = '';
      const rawDate = initialData.createdAt;
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
      setQuoteId('');
      setClientId('');
      setInvoiceNumber('');
      setDescription('');
      setDate(now.toISOString().slice(0, 10));
      setStatus('Draft');
    }
    // Mark first render as complete after initial state setup
    isFirstRender.current = false;
  }, [initialData]);

  useEffect(() => {
    console.log('InvoiceForm: Autopopulation effect running. initialData:', initialData, 'current invoiceNumber:', invoiceNumber, 'current date:', date, 'isFirstRender:', isFirstRender.current);
    // Only fetch if creating new, invoiceNumber is empty, date is set, and it's not the very first render
    if (isFirstRender.current || initialData || invoiceNumber !== '' || !date) {
      console.log('InvoiceForm: Autopopulation condition NOT met. Reason: initialData:', initialData, 'invoiceNumber:', invoiceNumber, 'date:', date, 'isFirstRender:', isFirstRender.current);
      return;
    }

    console.log('InvoiceForm: Condition met for fetching next invoice number.');
    const [year, month] = date.split('-'); // Extract year and month directly from the YYYY-MM-DD string
    const prefix = `INV${year}${month}`;

    getInvoiceNextNumber(prefix).then((res: NextNumberApiResponse | string) => {
      console.log('InvoiceForm: getInvoiceNextNumber API response:', res);
      if (res) {
        const raw = typeof res === 'object' ? (res.nextInvoiceNumber || res.NextInvoiceNumber || res.nextNumber || res.NextNumber) : res;
        if (raw) {
          const rawStr = String(raw);
          const formatted = rawStr.startsWith('INV') ? rawStr : `${prefix}${rawStr.padStart(4, '0')}`;
          console.log('InvoiceForm: Successfully extracted next number:', formatted);
          setInvoiceNumber(formatted);
        } else {
          console.warn('InvoiceForm: API response for next number was empty or invalid:', res);
        }
      }
    }).catch((err) => {
      console.error('InvoiceForm: Error fetching next invoice number:', err);
      // ignore failure and allow manual input
    });
  }, [initialData, invoiceNumber, date]);

  const handleQuoteChange = (id: string) => {
    setQuoteId(id);
    const selectedQuote = quotes.find(q => q.id === id);
    // Inherit description from the client name if a quote is selected
    if (selectedQuote) {
      setClientId(selectedQuote.clientId || '');
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
      clientId,
      invoiceNumber: invoiceNumber.trim(),
      description: description.trim(),
      status,
      dueDate: isNaN(submissionDate.getTime()) ? new Date().toISOString() : submissionDate.toISOString()
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
            value={isFetchingInvoiceNumber ? 'Loading...' : invoiceNumber} // NEW: Show loading state
            onChange={(event) => {
              setInvoiceNumber(event.target.value);
              setInvoiceNumberError(null); // NEW: Clear error on manual input
            }}
            required
            placeholder={`e.g., INV${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}0000`}
            disabled={isFetchingInvoiceNumber} // NEW: Disable input while loading
          />
          {invoiceNumberError && <p style={{ color: 'red', fontSize: '0.8em' }}>{invoiceNumberError}</p>} {/* NEW: Display error */}
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
