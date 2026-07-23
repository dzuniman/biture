import React, { useState, useEffect, useMemo } from 'react';
import { getTools, createTool, updateTool, deleteTool, uploadToolImage, getToolImageUrl } from '../api';
import type { Tool, ToolCreateRequest } from '../types';
import { formatAmount } from '../../formatters';

interface Props {
  onBack: () => void;
  onRefreshApp?: () => Promise<void>;
  onView?: (row: EditableToolRow) => void;
}

type EditableToolRow = {
  id?: string;
  tempId: string;
  code: string;
  description: string;
  quantity: number;
  location: string;
  imagePath: string | null;
  value: number;
  inspectionDate: string;
  isDirty?: boolean;
  isNew?: boolean;
  isSaving?: boolean;
  imagePreviewUrl?: string;
};

async function fetchSecureToolImage(imagePath: string): Promise<string | undefined> {
  if (!imagePath) return undefined;
  const token = localStorage.getItem('token');
  const url = getToolImageUrl(imagePath);
  console.log('Image Path: ', imagePath);
  console.log('Image Url: ', url);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Unauthorized');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to load tool image', err);
    return undefined;
  }
}

export default function ToolManagementPage({ onBack, onRefreshApp, onView }: Props) {
  const [rows, setRows] = useState<EditableToolRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTools();
      const loadedRows: EditableToolRow[] = await Promise.all(
        data.map(async (tool) => {
          let imagePreviewUrl: string | undefined;
          if (tool.imagePath) {
            imagePreviewUrl = await fetchSecureToolImage(tool.imagePath);
          }
          return {
            id: tool.id,
            tempId: tool.id,
            code: tool.code || '',
            description: tool.description || '',
            quantity: tool.quantity || 0,
            location: tool.location || '',
            imagePath: tool.imagePath || null,
            value: tool.value || 0,
            inspectionDate: tool.inspectionDate ? tool.inspectionDate.split('T')[0] : '',
            isDirty: false,
            isNew: false,
            imagePreviewUrl
          };
        })
      );
      setRows(loadedRows);
    } catch (err: any) {
      setError('Failed to load tools: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLine = () => {
    const newTempId = 'new_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newRow: EditableToolRow = {
      tempId: newTempId,
      code: '',
      description: '',
      quantity: 1,
      location: '',
      imagePath: null,
      value: 0,
      inspectionDate: new Date().toISOString().split('T')[0],
      isDirty: true,
      isNew: true
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleFieldChange = (tempId: string, field: keyof EditableToolRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, [field]: value, isDirty: true } : r))
    );
  };

  const handleImageUpload = async (tempId: string, file: File) => {
    try {
      const uploadedPath = await uploadToolImage(file);
      const previewUrl = URL.createObjectURL(file);
      setRows((prev) =>
        prev.map((r) =>
          r.tempId === tempId
            ? { ...r, imagePath: uploadedPath, imagePreviewUrl: previewUrl, isDirty: true }
            : r
        )
      );
    } catch (err: any) {
      alert('Failed to upload image: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSaveRow = async (row: EditableToolRow) => {
    if (!row.code.trim()) {
      alert('Code is required.');
      return;
    }
    if (!row.description.trim()) {
      alert('Description is required.');
      return;
    }

    setRows((prev) => prev.map((r) => (r.tempId === row.tempId ? { ...r, isSaving: true } : r)));

    try {
      const payload: ToolCreateRequest = {
        code: row.code.trim(),
        description: row.description.trim(),
        quantity: Number(row.quantity) || 0,
        location: row.location.trim() || null,
        imagePath: row.imagePath || null,
        value: Number(row.value) || 0,
        inspectionDate: row.inspectionDate ? new Date(row.inspectionDate).toISOString() : null
      };

      if (row.id && !row.isNew) {
        const updated = await updateTool(row.id, payload);
        setRows((prev) =>
          prev.map((r) =>
            r.tempId === row.tempId
              ? {
                ...r,
                code: updated.code,
                description: updated.description,
                quantity: updated.quantity,
                location: updated.location || '',
                imagePath: updated.imagePath || null,
                value: updated.value,
                inspectionDate: updated.inspectionDate ? updated.inspectionDate.split('T')[0] : '',
                isDirty: false,
                isSaving: false
              }
              : r
          )
        );
      } else {
        const created = await createTool(payload);
        setRows((prev) =>
          prev.map((r) =>
            r.tempId === row.tempId
              ? {
                ...r,
                id: created.id,
                tempId: created.id,
                code: created.code,
                description: created.description,
                quantity: created.quantity,
                location: created.location || '',
                imagePath: created.imagePath || null,
                value: created.value,
                inspectionDate: created.inspectionDate ? created.inspectionDate.split('T')[0] : '',
                isDirty: false,
                isNew: false,
                isSaving: false
              }
              : r
          )
        );
      }

      if (onRefreshApp) {
        await onRefreshApp();
      }
    } catch (err: any) {
      alert('Error saving tool: ' + (err.response?.data?.message || err.message || 'Unknown error'));
      setRows((prev) => prev.map((r) => (r.tempId === row.tempId ? { ...r, isSaving: false } : r)));
    }
  };

  const handleMoveRow = (tempId: string, direction: 'up' | 'down') => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.tempId === tempId);
      if (idx === -1) return prev;
      const newRows = [...prev];
      if (direction === 'up' && idx > 0) {
        [newRows[idx - 1], newRows[idx]] = [newRows[idx], newRows[idx - 1]];
      } else if (direction === 'down' && idx < newRows.length - 1) {
        [newRows[idx], newRows[idx + 1]] = [newRows[idx + 1], newRows[idx]];
      }
      return newRows;
    });
  };

  const handleDeleteRow = async (row: EditableToolRow) => {
    if (row.id && !row.isNew) {
      if (!window.confirm('Are you sure you want to delete this tool from inventory?')) return;
      try {
        await deleteTool(row.id);
        setRows((prev) => prev.filter((r) => r.tempId !== row.tempId));
        if (onRefreshApp) await onRefreshApp();
      } catch (err: any) {
        alert('Failed to delete tool: ' + (err.message || 'Unknown error'));
      }
    } else {
      setRows((prev) => prev.filter((r) => r.tempId !== row.tempId));
    }
  };

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.code.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term) ||
        (r.id && r.id.toLowerCase().includes(term))
    );
  }, [rows, search]);

  const totalValue = useMemo(() => {
    return rows.reduce((sum, r) => sum + (Number(r.value) * Number(r.quantity) || 0), 0);
  }, [rows]);

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Tools Inventory Management</h2>
          <p>Manage inventory tools, locations, images, and inspection schedules.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
          <button onClick={handleAddLine} className="btn-primary">
            + Add Tool Line
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #fecaca'
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '12px',
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Code, Description, Location, ID..."
          className="search-input"
          style={{ width: '320px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
        />
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', fontWeight: 600 }}>
          <span style={{ background: '#f3f4f6', padding: '6px 14px', borderRadius: '20px', color: '#374151' }}>
            Total Tools: <strong>{rows.length}</strong>
          </span>
          <span style={{ background: '#ecfdf5', padding: '6px 14px', borderRadius: '20px', color: '#065f46' }}>
            Total Stock Value: <strong>{formatAmount(totalValue)}</strong>
          </span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading tool inventory…</div>
      ) : (
        <div className="table-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e293b', color: '#f8fafc' }}>
                {/*<th style={{ padding: '12px 10px', textAlign: 'left', width: '90px' }}>Id</th>*/}
                <th style={{ padding: '12px 10px', textAlign: 'left', width: '120px' }}>Code</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', minWidth: '200px' }}>Description</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', width: '90px' }}>Quantity</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', width: '130px' }}>Location</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', width: '110px' }}>Image</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', width: '120px' }}>Value</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', width: '150px' }}>Inspection Date</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', width: '195px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No tools in inventory. Click <strong>"+ Add Tool Line"</strong> to add your first line item.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.tempId}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: row.isDirty ? '#fffbe6' : 'white',
                      transition: 'background 0.2s'
                    }}
                  >
                    {/* 1. ID */}
                    {/*<td style={{ padding: '8px 10px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                      {row.id ? row.id.substring(0, 8) + '...' : <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>New</span>}
                    </td>*/}

                    {/* 2. Code */}
                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="text"
                        value={row.code}
                        onChange={(e) => handleFieldChange(row.tempId, 'code', e.target.value)}
                        placeholder="Code"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </td>

                    {/* 3. Description */}
                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => handleFieldChange(row.tempId, 'description', e.target.value)}
                        placeholder="Description"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </td>

                    {/* 4. Quantity */}
                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={row.quantity}
                        onChange={(e) => handleFieldChange(row.tempId, 'quantity', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                      />
                    </td>

                    {/* 5. Location */}
                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="text"
                        value={row.location}
                        onChange={(e) => handleFieldChange(row.tempId, 'location', e.target.value)}
                        placeholder=""
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </td>

                    {/* 6. Image */}
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        {row.imagePreviewUrl ? (
                          <img
                            src={row.imagePreviewUrl}
                            alt="Tool"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No Image</span>
                        )}
                        <label className="btn-secondary small" style={{ fontSize: '0.65rem', color: 'black', padding: '2px 6px', cursor: 'pointer', margin: 0 }}>
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleImageUpload(row.tempId, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </td>

                    {/* 7. Value */}
                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.value}
                        onChange={(e) => handleFieldChange(row.tempId, 'value', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}
                      />
                    </td>

                    {/* 8. Inspection Date */}
                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="date"
                        value={row.inspectionDate}
                        onChange={(e) => handleFieldChange(row.tempId, 'inspectionDate', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* Up / Down */}
                        <button
                          type="button"
                          title="Move Up"
                          onClick={() => handleMoveRow(row.tempId, 'up')}
                          style={{ padding: '4px 7px', fontSize: '0.75rem', background: '#081d31', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', lineHeight: 1 }}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          title="Move Down"
                          onClick={() => handleMoveRow(row.tempId, 'down')}
                          style={{ padding: '4px 7px', fontSize: '0.75rem', background: '#081d31', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', lineHeight: 1 }}
                        >
                          ▼
                        </button>
                        {/* View */}
                        {onView && (
                          <button
                            type="button"
                            className="btn-secondary small"
                            onClick={() => onView(row)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#081d31' }}
                          >
                            View
                          </button>
                        )}
                        {/* Save */}
                        <button
                          type="button"
                          className="btn-primary small"
                          onClick={() => handleSaveRow(row)}
                          disabled={row.isSaving || (!row.isDirty && !row.isNew)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            opacity: !row.isDirty && !row.isNew ? 0.6 : 1
                          }}
                        >
                          {row.isSaving ? '...' : row.isDirty || row.isNew ? 'Save' : 'Saved'}
                        </button>
                        {/* Delete */}
                        <button
                          type="button"
                          className="btn-danger small"
                          onClick={() => handleDeleteRow(row)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
