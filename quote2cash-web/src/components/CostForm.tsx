import { useState, type FormEvent } from 'react';
import type { Client, JobCard, CostCreateRequest } from '../types';

interface Props {
  clients: Client[];
  jobCards: JobCard[];
  onSubmit: (payload: CostCreateRequest) => Promise<void>;
}

export default function CostForm({ clients, jobCards, onSubmit }: Props) {
  const [clientId, setClientId] = useState('');
  const [jobCardId, setJobCardId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [dateIncurred, setDateIncurred] = useState('');
  const [status, setStatus] = useState('Draft');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    await onSubmit({
      clientId: clientId || undefined,
      jobCardId: jobCardId || undefined,
      category: expenseCategory.trim() || 'Uncategorized',
      description: description.trim(),
      amount: Number(amount),
      status,
      incurredAt: dateIncurred ? new Date(dateIncurred).toISOString() : new Date().toISOString()
    });

    setClientId('');
    setJobCardId('');
    setDescription('');
    setAmount('');
    setExpenseCategory('');
    setDateIncurred('');
    setIsSaving(false);
  };

  return (
    <div className="card">
      <h2>Add Cost</h2>
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
          Job card
          <select value={jobCardId} onChange={(event) => setJobCardId(event.target.value)}>
            <option value="">No job selected</option>
            {jobCards.map((job) => (
              <option key={job.id} value={job.id}>
                {job.jobNumber}
              </option>
            ))}
          </select>
        </label>
        <label>
          Description
          <input value={description} onChange={(event) => setDescription(event.target.value)} required />
        </label>
        <label>
          Amount
          <input type="number" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
        </label>
        <label>
          Expense category
          <input value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)} />
        </label>
        <label>
          Date incurred
          <input type="date" value={dateIncurred} onChange={(event) => setDateIncurred(event.target.value)} />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
            <option value="Rejected">Rejected</option>
          </select>
        </label>
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Cost'}
        </button>
      </form>
    </div>
  );
}
