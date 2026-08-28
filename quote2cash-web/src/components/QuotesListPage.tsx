import React, { useMemo } from 'react';
import { formatAmount } from '../../formatters';
import type { Quote } from '../types';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

interface Props {
  quotes: Quote[];
  onEdit: (quote: Quote) => void;
  onView: (quote: Quote) => void;
  onDelete: (quoteId: string) => void;
  onDuplicate: (quote: Quote) => void;
  onCreateNew: () => void;
}

export default function QuotesListPage({
  quotes,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  onCreateNew
}: Props) {
  const totalValue = useMemo(() => {
    return quotes.reduce((sum, quote) => sum + (quote.total || 0), 0);
  }, [quotes]);

  const columns: ColumnDef<Quote>[] = useMemo(
    () => [
      { key: 'quoteNumber', label: 'Quote #', type: 'text' },
      { key: 'reference', label: 'Reference', type: 'text', getValue: r => r.reference || '—' },
      { key: 'clientName', label: 'Client', type: 'text', getValue: r => r.client?.name || '—' },
      { key: 'date', label: 'Date', type: 'date', format: v => (v ? new Date(v).toLocaleDateString() : '—') },
      { key: 'margin', label: 'Margin', type: 'number', getValue: r => r.margin, format: v => (v != null ? `${v}%` : '—') },
      { key: 'total', label: 'Total', type: 'currency', getValue: r => r.total, format: v => formatAmount(Number(v) || 0) }
    ],
    []
  );

  const statsSummary = (
    <div className="stats-row" style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
      <div className="stat-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Quotes</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{quotes.length}</div>
      </div>
      <div className="stat-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Value</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>{formatAmount(totalValue)}</div>
      </div>
    </div>
  );

  const renderActions = (quote: Quote) => (
    <ActionMenu
      items={[
        { label: 'View', icon: '👁️', onClick: () => onView(quote) },
        { label: 'Edit', icon: '✏️', onClick: () => onEdit(quote) },
        { label: 'Duplicate', icon: '📋', onClick: () => onDuplicate(quote), variant: 'primary' },
        { label: 'Delete', icon: '🗑️', onClick: () => onDelete(quote.id), variant: 'danger' }
      ]}
    />
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Quotes</h2>
          <p>Manage and track quotations</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Quote
        </button>
      </div>

      <DataGrid
        columns={columns}
        data={quotes}
        renderActions={renderActions}
        statsSummary={statsSummary}
        searchPlaceholder="Search quotes by reference, client, number, or vendor..."
        emptyMessage="No quotes found. Click '+ New Quote' to get started."
      />
    </div>
  );
}
