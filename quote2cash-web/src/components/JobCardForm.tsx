import { useEffect, useState, type FormEvent } from 'react';
import type { Client, JobCard, JobCardCreateRequest } from '../types';

interface Props {
  clients: Client[];
  initialData?: JobCard;
  onSubmit: (payload: JobCardCreateRequest) => Promise<void>;
  onCancel?: () => void;
}

const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected'];

export default function JobCardForm({ clients, initialData, onSubmit, onCancel }: Props) {
  const [clientId, setClientId] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(statuses[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.client?.id ?? '');
      setJobNumber(initialData.jobNumber);
      setDescription(initialData.description);
      setStatus(initialData.status);
      setStartDate(initialData.startDate ? initialData.startDate.slice(0, 10) : '');
      setEndDate(initialData.endDate ? initialData.endDate.slice(0, 10) : '');
      setTotalCost(initialData.totalCost.toString());
    } else {
      setClientId('');
      setJobNumber('');
      setDescription('');
      setStatus(statuses[0]);
      setStartDate('');
      setEndDate('');
      setTotalCost('');
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    await onSubmit({
      clientId: clientId || undefined,
      jobNumber: jobNumber.trim(),
      description: description.trim(),
      status,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      totalCost: Number(totalCost)
    });

    setIsSaving(false);
  };

  return (
    <div className="card">
      <h2>{initialData ? 'Edit Job Card' : 'Add Job Card'}</h2>
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
          Job number
          <input value={jobNumber} onChange={(event) => setJobNumber(event.target.value)} required />
        </label>
        <label>
          Description
          <input value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Start date
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label>
          End date
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <label>
          Total cost
          <input
            type="number"
            step="0.01"
            value={totalCost}
            onChange={(event) => setTotalCost(event.target.value)}
          />
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
        <div className="form-actions">
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : initialData ? 'Update Job Card' : 'Save Job Card'}
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
