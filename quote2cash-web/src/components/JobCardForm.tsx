import { useState, type FormEvent } from 'react';
import type { Client, JobCardCreateRequest } from '../types';

interface Props {
  clients: Client[];
  onSubmit: (payload: JobCardCreateRequest) => Promise<void>;
}

const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected'];

export default function JobCardForm({ clients, onSubmit }: Props) {
  const [clientId, setClientId] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(statuses[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

    setClientId('');
    setJobNumber('');
    setDescription('');
    setStatus(statuses[0]);
    setStartDate('');
    setEndDate('');
    setTotalCost('');
    setIsSaving(false);
  };

  return (
    <div className="card">
      <h2>Add Job Card</h2>
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
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Job Card'}
        </button>
      </form>
    </div>
  );
}
