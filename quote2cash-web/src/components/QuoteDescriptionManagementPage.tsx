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
  const [code, setCode] = useState('');
  const [uom, setUom] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return descriptions;
    return descriptions.filter((item) =>
      item.code.toLowerCase().includes(term) ||
      item.uom.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    );
  }, [descriptions, search]);

  const startCreate = () => {
    setMode('manage');
    setCurrent(null);
    setCode('');
    setUom('');
    setDescription('');
    setError(null);
  };

  const startEdit = (descriptionItem: QuoteDescription) => {
    setMode('manage');
    setCurrent(descriptionItem);
    setCode(descriptionItem.code);
    setUom(descriptionItem.uom);
    setDescription(descriptionItem.description);
    setError(null);
  };

  const cancel = () => {
    setMode('list');
    setCurrent(null);
    setCode('');
    setUom('');
    setDescription('');
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) {
      setError('Please enter a code.');
      return;
    }
    if (!uom.trim()) {
      setError('Please enter a UOM.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (current) {
        await updateQuoteDescription(current.id, {
          id: current.id,
          code: code.trim(),
          uom: uom.trim(),
          description: description.trim()
        } as any);
      } else {
        await createQuoteDescription({
          code: code.trim(),
          uom: uom.trim(),
          description: description.trim()
        } as any);
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
                  <th>Code</th>
                  <th>UOM</th>
                  <th>Description</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
                    <td colSpan={4} className="empty-row">
                      No descriptions found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((descriptionItem) => (
                    <tr key={descriptionItem.id} style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }} className="table-row-dark-hover">
                      <td>{descriptionItem.code}</td>
                      <td>{descriptionItem.uom}</td>
                      <td>{descriptionItem.description}</td>
                      <td className="actions-column">
                        <button className="btn-secondary small" onClick={() => startEdit(descriptionItem)}>
                          Edit
                        </button>
                        <button className="btn-danger small" onClick={() => handleDelete(descriptionItem.id)}>
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
              Code
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Enter a lookup code"
                autoFocus
              />
            </label>
            <label>
              UOM
              <input
                type="text"
                value={uom}
                onChange={(event) => setUom(event.target.value)}
                placeholder="Enter a unit of measure"
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Enter a description"
                rows={3}
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
