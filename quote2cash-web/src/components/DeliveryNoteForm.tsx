import { useEffect, useState, type FormEvent } from 'react';
import type { Quote, DeliveryNote, DeliveryNoteCreateRequest, Client } from '../types';
import { getDeliveryNoteNextNumber } from '../api';

interface Props {
  quotes: Quote[];
  clients?: Client[];
  initialData?: DeliveryNote;
  isNew: boolean;
  onSubmit: (payload: DeliveryNoteCreateRequest) => Promise<void>;
  onCancel: () => void;
}

export default function DeliveryNoteForm({ quotes, clients, initialData, isNew, onSubmit, onCancel }: Props) {
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDeliveryNoteNumber(initialData.deliveryNoteNumber);
      setQuoteNumber(initialData.quoteNumber);
      setReference(initialData.reference ?? '');
      setDescription(initialData.description ?? '');
    } else {
      getDeliveryNoteNextNumber().then(num => setDeliveryNoteNumber(num)).catch(() => setDeliveryNoteNumber(''));
      setQuoteNumber('');
      setReference('');
      setDescription('');
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit({
        deliveryNoteNumber: deliveryNoteNumber.trim(),
        quoteNumber: quoteNumber.trim(),
        reference: reference.trim(),
        description: description.trim()
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>{isNew ? 'Create Delivery Note' : 'Edit Delivery Note'}</h2>
          <p>{isNew ? 'Fill in the details to create a new delivery note' : `Editing ${initialData?.deliveryNoteNumber}`}</p>
        </div>
      </div>
      <div className="table-card" style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                Delivery Note Number <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <input
                value={deliveryNoteNumber}
                onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                required
                placeholder="e.g. DN202506001"
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Auto-generated — you may override if needed</span>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Quote <span style={{ color: '#ef4444' }}>*</span></span>
              <select
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                required
                disabled={!isNew}
                style={!isNew ? { cursor: 'not-allowed', opacity: 0.7 } : {}}
              >
                <option value="">Select a quote...</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.quoteNumber}>
                    {q.quoteNumber} — {q.reference} ({q.client?.name || 'No client'})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Reference</span>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Enter reference..."
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Remarks</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter remarks..."
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '24px' }}>
            <button type="submit" className="btn-primary-lg" disabled={isSaving}>
              {isSaving ? 'Saving…' : isNew ? 'Create Delivery Note' : 'Update Delivery Note'}
            </button>
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
