import { useState, type FormEvent } from 'react';
import type { ClientCreateRequest } from '../types';

interface Props {
  onSubmit: (payload: ClientCreateRequest) => Promise<void>;
}

export default function ClientForm({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    await onSubmit({
      name: name.trim(),
      accountNumber: accountNumber.trim() || undefined,
      industry: industry.trim() || undefined,
      contactName: contactName.trim() || undefined,
      email: email.trim() || undefined
    });

    setName('');
    setAccountNumber('');
    setIndustry('');
    setContactName('');
    setEmail('');
    setIsSaving(false);
  };

  return (
    <div className="card">
      <h2>Add Client</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Client name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Account number
          <input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} />
        </label>
        <label>
          Industry
          <input value={industry} onChange={(event) => setIndustry(event.target.value)} />
        </label>
        <label>
          Contact name
          <input value={contactName} onChange={(event) => setContactName(event.target.value)} />
        </label>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save Client'}
        </button>
      </form>
    </div>
  );
}
