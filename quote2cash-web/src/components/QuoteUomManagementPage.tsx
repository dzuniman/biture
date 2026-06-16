import { useMemo, useState, type FormEvent } from 'react';
import { createQuoteUom, deleteQuoteUom, updateQuoteUom } from '../api';
import type { QuoteUom } from '../types';

interface Props {
  uoms: QuoteUom[];
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

export default function QuoteUomManagementPage({ uoms, onBack, onRefresh }: Props) {
  const [mode, setMode] = useState<'list' | 'manage'>('list');
  const [current, setCurrent] = useState<QuoteUom | null>(null);
  const [value, setValue] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return uoms;
    return uoms.filter((item) => item.value.toLowerCase().includes(term));
  }, [uoms, search]);

  const startCreate = () => {
    setMode('manage');
    setCurrent(null);
    setValue('');
    setError(null);
  };

  const startEdit = (uom: QuoteUom) => {
    setMode('manage');
    setCurrent(uom);
    setValue(uom.value);
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
      setError('Please enter a value.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (current) {
        await updateQuoteUom(current.id, { value: value.trim() });
      } else {
        await createQuoteUom({ value: value.trim() } as any);
      }
      await onRefresh();
      cancel();
    } catch (err: any) {
      const data = err?.response?.data;
      const detail = data?.message || (data?.errors ? Object.values(data.errors).flat().join(' ') : null);
      setError(detail ?? 'Unable to save UOM.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this UOM? This cannot be undone.')) return;
    try {
      await deleteQuoteUom(id);
      await onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to delete UOM.');
    }
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Quote UOM Management</h2>
          <p>Add, edit, or remove units of measure used in quote line items.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
          {mode === 'list' && (
            <button onClick={startCreate} className="btn-primary">
              + New UOM
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
              placeholder="Search UOMs..."
              className="search-input"
            />
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>UOM</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
                    <td colSpan={2} className="empty-row">
                      No UOMs found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((uom) => (
                    <tr key={uom.id} style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }} className="table-row-dark-hover">
                      <td>{uom.value}</td>
                      <td className="actions-column">
                        <button className="btn-secondary small" onClick={() => startEdit(uom)}>
                          Edit
                        </button>
                        <button className="btn-danger small" onClick={() => handleDelete(uom.id)}>
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
              UOM value
              <input
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="e.g. pcs, m, hour"
                autoFocus
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving…' : current ? 'Update UOM' : 'Create UOM'}
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
