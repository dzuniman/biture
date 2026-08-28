import React, { useMemo } from 'react';
import { formatAmount } from '../../formatters';
import type { Cost } from '../types';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

interface Props {
  costs: Cost[];
  onEdit: (cost: Cost) => void;
  onDelete: (costId: string) => void;
  onDuplicate: (cost: Cost) => void;
  onCreateNew: () => void;
}

export default function CostsListPage({ costs, onEdit, onDelete, onDuplicate, onCreateNew }: Props) {
  const totalQuoteValue = useMemo(() => {
    return costs.reduce((sum, c) => sum + (c.totalQuoteAmount ?? 0), 0);
  }, [costs]);

  const columns: ColumnDef<Cost>[] = useMemo(
    () => [
      { key: 'description', label: 'Description', type: 'text', getValue: r => r.description || '—' },
      { key: 'date', label: 'Date', type: 'date', format: v => (v ? new Date(v).toLocaleDateString() : '—') },
      { key: 'margin', label: 'Margin', type: 'number', getValue: r => r.margin, format: v => (v != null ? `${v}%` : '—') },
      { key: 'itemCount', label: 'Items', type: 'number', getValue: r => r.itemCount ?? (r.items?.length ?? 0) },
      { key: 'totalQuoteAmount', label: 'Quote Value', type: 'currency', getValue: r => r.totalQuoteAmount ?? 0, format: v => formatAmount(Number(v) || 0) }
    ],
    []
  );

  const statsSummary = (
    <div className="stats-row" style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
      <div className="stat-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Cost Sheets</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{costs.length}</div>
      </div>
      <div className="stat-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Quote Value</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>{formatAmount(totalQuoteValue)}</div>
      </div>
    </div>
  );

  const renderActions = (cost: Cost) => (
    <ActionMenu
      items={[
        { label: 'Edit', icon: '✏️', onClick: () => onEdit(cost) },
        { label: 'Duplicate', icon: '📋', onClick: () => onDuplicate(cost), variant: 'primary' },
        { label: 'Delete', icon: '🗑️', onClick: () => onDelete(cost.id), variant: 'danger' }
      ]}
    />
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Cost Sheets</h2>
          <p>Manage pricing analysis and cost breakdowns</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Cost Sheet
        </button>
      </div>

      <DataGrid
        columns={columns}
        data={costs}
        renderActions={renderActions}
        statsSummary={statsSummary}
        searchPlaceholder="Search cost sheets by description or date..."
        emptyMessage="No cost sheets found. Click '+ New Cost Sheet' to get started."
      />
    </div>
  );
}
