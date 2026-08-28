import React, { useMemo } from 'react';
import type { DeliveryNote } from '../types';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

interface Props {
  deliveryNotes: DeliveryNote[];
  onView: (deliveryNote: DeliveryNote) => void;
  onEdit: (deliveryNote: DeliveryNote) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export default function DeliveryNoteListPage({
  deliveryNotes,
  onView,
  onEdit,
  onDelete,
  onCreateNew
}: Props) {
  const columns: ColumnDef<DeliveryNote>[] = useMemo(
    () => [
      { key: 'deliveryNoteNumber', label: 'Delivery Note Number', type: 'text' },
      { key: 'quoteNumber', label: 'Quote Number', type: 'text' },
      { key: 'reference', label: 'Reference', type: 'text', getValue: r => r.reference || '—' },
      { key: 'description', label: 'Description', type: 'text', getValue: r => r.description || '—' },
      { key: 'client', label: 'Client', type: 'text', getValue: r => r.client?.name || '—' },
      { key: 'createdAt', label: 'Created', type: 'date', format: v => (v ? new Date(v).toLocaleDateString() : '—') }
    ],
    []
  );

  const statsSummary = (
    <div className="stats-row" style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
      <div className="stat-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Delivery Notes</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{deliveryNotes.length}</div>
      </div>
    </div>
  );

  const renderActions = (dn: DeliveryNote) => (
    <ActionMenu
      items={[
        { label: 'View', icon: '👁️', onClick: () => onView(dn) },
        { label: 'Edit', icon: '✏️', onClick: () => onEdit(dn) },
        { label: 'Delete', icon: '🗑️', onClick: () => onDelete(dn.id), variant: 'danger' }
      ]}
    />
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Delivery Notes</h2>
          <p>Manage and track delivery notes</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Delivery Note
        </button>
      </div>

      <DataGrid
        columns={columns}
        data={deliveryNotes}
        renderActions={renderActions}
        statsSummary={statsSummary}
        searchPlaceholder="Search delivery notes by number, quote, reference, description, or client..."
        emptyMessage="No delivery notes found. Click '+ New Delivery Note' to get started."
      />
    </div>
  );
}
