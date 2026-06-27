import { useEffect, useState, type FormEvent } from 'react';
import type { Client, CreditNote, CreditNoteCreateRequest } from '../types';
import { getCreditNoteNextNumber } from '../api';

interface Props {
  clients: Client[];
  initialData?: CreditNote;
  isNew: boolean;
  onSubmit: (payload: CreditNoteCreateRequest) => Promise<void>;
  onCancel: () => void;
}

export default function CreditNoteForm({ clients, initialData, isNew, onSubmit, onCancel }: Props) {
  const [clientId, setClientId] = useState('');
  const [creditNoteNumber, setCreditNoteNumber] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.clientId);
      setCreditNoteNumber(initialData.creditNoteNumber);
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
    } else {
      setClientId('');
      getCreditNoteNextNumber().then(num => setCreditNoteNumber(num)).catch(() => setCreditNoteNumber(''));
      setDescription('');
      setAmount('');
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientId) {
      alert('Please select a client.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        clientId,
        creditNoteNumber: creditNoteNumber.trim(),
        description: description.trim(),
        amount: parsedAmount
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>{isNew ? 'Create Credit Note' : 'Edit Credit Note'}</h2>
          <p>{isNew ? 'Fill in the details to issue a new credit note' : `Editing ${initialData?.creditNoteNumber}`}</p>
        </div>
      </div>
      <div className="table-card" style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                Credit Note Number <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <input
                value={creditNoteNumber}
                onChange={(e) => setCreditNoteNumber(e.target.value)}
                required
                placeholder="e.g. CRN2026060001"
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Auto-generated — you may override if needed</span>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Client <span style={{ color: '#ef4444' }}>*</span></span>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                disabled={!isNew}
                style={!isNew ? { cursor: 'not-allowed', opacity: 0.7 } : {}}
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Description / Remarks <span style={{ color: '#ef4444' }}>*</span></span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Enter description..."
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Amount (ZAR) <span style={{ color: '#ef4444' }}>*</span></span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="e.g. 500.00"
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '24px' }}>
            <button type="submit" className="btn-primary-lg" disabled={isSaving}>
              {isSaving ? 'Saving…' : isNew ? 'Create Credit Note' : 'Update Credit Note'}
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
