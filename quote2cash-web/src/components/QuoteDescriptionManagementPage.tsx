import { useMemo, useState, type FormEvent } from 'react';
import { createQuoteDescription, deleteQuoteDescription, updateQuoteDescription } from '../api';
import type { QuoteDescription } from '../types';

interface Props {
  descriptions: QuoteDescription[];
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

export default function QuoteDescriptionManagementPage({ descriptions, onBack, onRefresh }: Props) {
  const [mode, setMode] = useState<'list' | 'manage'>('list');
  const [current, setCurrent] = useState<QuoteDescription | null>(null);
  const [value, setValue] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return descriptions;
    return descriptions.filter((item) => item.value.toLowerCase().includes(term));
  }, [descriptions, search]);

  const startCreate = () => {
    setMode('manage');
    setCurrent(null);
    setValue('');
    setError(null);
  };

  const startEdit = (description: QuoteDescription) => {
    setMode('manage');
    setCurrent(description);
    setValue(description.value);
    setError(null);
  };

  const cancel = () => {
    setMode('list');
    setCurrent(null);
    setValue('');
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) {
      setError('Please enter a description.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (current) {
        await updateQuoteDescription(current.id, { id: current.id, value: value.trim() });
      } else {
        await createQuoteDescription({ value: value.trim() } as any);
      }
      await onRefresh();
      cancel();
    } catch (err: any) {
      const data = err?.response?.data;
      const detail = data?.message || (data?.errors ? Object.values(data.errors).flat().join(' ') : null);
      setError(detail ?? 'Unable to save description.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this description? This cannot be undone.')) return;
    try {
      await deleteQuoteDescription(id);
      await onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to delete description.');
    }
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Quote Description Management</h2>
          <p>Manage descriptions available for quote line items.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
          {mode === 'list' && (
            <button onClick={startCreate} className="btn-primary">
              + New Description
            </button>
          )}
        </div>
      </div>

      {mode === 'list' ? (
        <>
          <div className="table-toolbar">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search descriptions..."
              className="search-input"
            />
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
                    <td colSpan={2} className="empty-row">
                      No descriptions found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((description) => (
                    <tr key={description.id} style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }} className="table-row-dark-hover">
                      <td>{description.value}</td>
                      <td className="actions-column">
                        <button className="btn-secondary small" onClick={() => startEdit(description)}>
                          Edit
                        </button>
                        <button className="btn-danger small" onClick={() => handleDelete(description.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="management-container">
          <form onSubmit={handleSubmit} className="simple-form">
            <label>
              Description
              <textarea
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Enter a description"
                rows={3}
                autoFocus
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving…' : current ? 'Update Description' : 'Create Description'}
              </button>
              <button type="button" className="btn-secondary" onClick={cancel} disabled={isSaving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
