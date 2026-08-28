import React, { useMemo } from 'react';
import type { CreditNote } from '../types';
import { formatAmount } from '../../formatters';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

interface Props {
  creditNotes: CreditNote[];
  onView: (creditNote: CreditNote) => void;
  onEdit: (creditNote: CreditNote) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export default function CreditNoteListPage({
  creditNotes,
  onView,
  onEdit,
  onDelete,
  onCreateNew
}: Props) {
  const totalCreditAmount = useMemo(() => {
    return creditNotes.reduce((sum, cn) => sum + (cn.amount || 0), 0);
  }, [creditNotes]);

  const columns: ColumnDef<CreditNote>[] = useMemo(
    () => [
      { key: 'creditNoteNumber', label: 'Credit Note Number', type: 'text' },
      { key: 'client', label: 'Client', type: 'text', getValue: r => r.client?.name || '—' },
      { key: 'description', label: 'Description', type: 'text', getValue: r => r.description || '—' },
      { key: 'amount', label: 'Amount', type: 'currency', getValue: r => r.amount, format: v => formatAmount(Number(v) || 0) },
      { key: 'createdAt', label: 'Created', type: 'date', format: v => (v ? new Date(v).toLocaleDateString() : '—') }
    ],
    []
  );

  const statsSummary = (
    <div className="stats-row" style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
      <div className="stat-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Credit Notes</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{creditNotes.length}</div>
      </div>
      <div className="stat-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Credited Value</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{formatAmount(totalCreditAmount)}</div>
      </div>
    </div>
  );

  const renderActions = (cn: CreditNote) => (
    <ActionMenu
      items={[
        { label: 'View', icon: '👁️', onClick: () => onView(cn) },
        { label: 'Edit', icon: '✏️', onClick: () => onEdit(cn) },
        { label: 'Delete', icon: '🗑️', onClick: () => onDelete(cn.id), variant: 'danger' }
      ]}
    />
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Credit Notes</h2>
          <p>Manage and track client credit notes</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Credit Note
        </button>
      </div>

      <DataGrid
        columns={columns}
        data={creditNotes}
        renderActions={renderActions}
        statsSummary={statsSummary}
        searchPlaceholder="Search credit notes by number, description, or client..."
        emptyMessage="No credit notes found. Click '+ New Credit Note' to get started."
      />
    </div>
  );
}
