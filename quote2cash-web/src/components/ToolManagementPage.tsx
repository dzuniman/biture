import React, { useState, useEffect, useMemo } from 'react';
import { getTools, createTool, updateTool, deleteTool, uploadToolImage, getToolImageUrl } from '../api';
import type { Tool, ToolCreateRequest } from '../types';
import { formatAmount } from '../../formatters';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

interface Props {
  onBack: () => void;
  onRefreshApp?: () => Promise<void>;
  onView?: (row: EditableToolRow) => void;
}

export type EditableToolRow = {
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
    setRows((prev) => [newRow, ...prev]);
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
        let previewUrl = row.imagePreviewUrl;
        if (updated.imagePath && updated.imagePath !== row.imagePath) {
          previewUrl = await fetchSecureToolImage(updated.imagePath);
        }
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
                  value: updated.value || 0,
                  inspectionDate: updated.inspectionDate ? updated.inspectionDate.split('T')[0] : '',
                  imagePreviewUrl: previewUrl,
                  isDirty: false,
                  isSaving: false
                }
              : r
          )
        );
      } else {
        const created = await createTool(payload);
        let previewUrl = row.imagePreviewUrl;
        if (created.imagePath) {
          previewUrl = await fetchSecureToolImage(created.imagePath);
        }
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
                  value: created.value || 0,
                  inspectionDate: created.inspectionDate ? created.inspectionDate.split('T')[0] : '',
                  imagePreviewUrl: previewUrl,
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

  const handleDeleteRow = async (row: EditableToolRow) => {
    if (row.id && !row.isNew) {
      if (!window.confirm('Are you sure you want to delete this tool?')) return;
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

  const totalValue = useMemo(() => {
    return rows.reduce((sum, r) => sum + (Number(r.value) || 0) * (Number(r.quantity) || 1), 0);
  }, [rows]);

  const columns: ColumnDef<EditableToolRow>[] = useMemo(
    () => [
      {
        key: 'code',
        label: 'Code',
        type: 'text',
        getValue: r => r.code,
        render: (row) => (
          <input
            type="text"
            value={row.code}
            onChange={(e) => handleFieldChange(row.tempId, 'code', e.target.value)}
            placeholder="Code"
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        )
      },
      {
        key: 'description',
        label: 'Description',
        type: 'text',
        getValue: r => r.description,
        render: (row) => (
          <input
            type="text"
            value={row.description}
            onChange={(e) => handleFieldChange(row.tempId, 'description', e.target.value)}
            placeholder="Description"
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        )
      },
      {
        key: 'quantity',
        label: 'Quantity',
        type: 'number',
        getValue: r => r.quantity,
        align: 'center',
        render: (row) => (
          <input
            type="number"
            step="1"
            min="0"
            value={row.quantity}
            onChange={(e) => handleFieldChange(row.tempId, 'quantity', parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
          />
        )
      },
      {
        key: 'location',
        label: 'Location',
        type: 'text',
        getValue: r => r.location,
        render: (row) => (
          <input
            type="text"
            value={row.location}
            onChange={(e) => handleFieldChange(row.tempId, 'location', e.target.value)}
            placeholder="Location"
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        )
      },
      {
        key: 'imagePath',
        label: 'Image',
        type: 'custom',
        align: 'center',
        render: (row) => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            {row.imagePreviewUrl ? (
              <img
                src={row.imagePreviewUrl}
                alt="Tool"
                style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            ) : (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No Image</span>
            )}
            <label className="btn-secondary small" style={{ fontSize: '0.65rem', color: '#0f172a', padding: '2px 6px', cursor: 'pointer', margin: 0 }}>
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
        )
      },
      {
        key: 'value',
        label: 'Value',
        type: 'currency',
        getValue: r => r.value,
        format: v => formatAmount(Number(v) || 0),
        render: (row) => (
          <input
            type="number"
            step="0.01"
            min="0"
            value={row.value}
            onChange={(e) => handleFieldChange(row.tempId, 'value', parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}
          />
        )
      },
      {
        key: 'inspectionDate',
        label: 'Inspection Date',
        type: 'date',
        getValue: r => r.inspectionDate,
        render: (row) => (
          <input
            type="date"
            value={row.inspectionDate}
            onChange={(e) => handleFieldChange(row.tempId, 'inspectionDate', e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        )
      }
    ],
    []
  );

  const statsSummary = (
    <div className="stats-row" style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
      <div className="stat-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Tools</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{rows.length}</div>
      </div>
      <div className="stat-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Stock Value</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{formatAmount(totalValue)}</div>
      </div>
    </div>
  );

  const renderActions = (row: EditableToolRow) => (
    <ActionMenu
      items={[
        ...(onView ? [{ label: 'View', icon: '👁️', onClick: () => onView(row) }] : []),
        {
          label: row.isSaving ? 'Saving...' : row.isDirty || row.isNew ? 'Save' : 'Saved',
          icon: '💾',
          onClick: () => handleSaveRow(row),
          variant: row.isDirty || row.isNew ? ('success' as const) : ('normal' as const),
          disabled: row.isSaving || (!row.isDirty && !row.isNew)
        },
        { label: 'Delete', icon: '🗑️', onClick: () => handleDeleteRow(row), variant: 'danger' }
      ]}
    />
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Tools Management</h2>
          <p>Track tools, locations, and inspection schedules</p>
        </div>
        <button onClick={handleAddLine} className="btn-primary-lg">
          + Add Tool
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
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

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading tools…</div>
      ) : (
        <DataGrid
          columns={columns}
          data={rows}
          keyField="tempId"
          renderActions={renderActions}
          statsSummary={statsSummary}
          searchPlaceholder="Search tools by code, description, or location..."
          emptyMessage="No tools found. Click '+ Add Tool' to add your first tool."
        />
      )}
    </div>
  );
}
