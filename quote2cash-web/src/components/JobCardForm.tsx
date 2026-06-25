import { useEffect, useState, type FormEvent } from 'react';
import type { Quote, JobCard, JobCardCreateRequest } from '../types';
import { getJobCardNextNumber } from '../api';

interface Props {
  quotes: Quote[];
  initialData?: JobCard;
  isNew: boolean;
  onSubmit: (payload: JobCardCreateRequest) => Promise<void>;
  onCancel: () => void;
}

export default function JobCardForm({ quotes, initialData, isNew, onSubmit, onCancel }: Props) {
  const [jobCardNumber, setJobCardNumber] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setJobCardNumber(initialData.jobCardNumber);
      setQuoteNumber(initialData.quoteNumber);
      setReference(initialData.reference ?? '');
      setDescription(initialData.description ?? '');
    } else {
      // Auto-populate next job card number for new records (user can still edit)
      getJobCardNextNumber().then(num => setJobCardNumber(num)).catch(() => setJobCardNumber(''));
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
        jobCardNumber: jobCardNumber.trim(),
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
          <h2>{isNew ? 'Create Job Card' : 'Edit Job Card'}</h2>
          <p>{isNew ? 'Fill in the details to create a new job card' : `Editing ${initialData?.jobCardNumber}`}</p>
        </div>
      </div>
      <div className="table-card" style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                Job Card Number <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <input
                value={jobCardNumber}
                onChange={(e) => setJobCardNumber(e.target.value)}
                required
                placeholder="e.g. JC202506001"
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
              {isSaving ? 'Saving…' : isNew ? 'Create Job Card' : 'Update Job Card'}
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
