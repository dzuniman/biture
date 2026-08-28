import React, { useMemo } from 'react';
import { formatAmount } from '../../formatters';
import type { Invoice } from '../types';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

interface Props {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onCreateNew: () => void;
}

export default function InvoiceListPage({
  invoices,
  onEdit,
  onView,
  onDelete,
  onCreateNew
}: Props) {
  const totalValue = useMemo(() => {
    return invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
  }, [invoices]);

  const columns: ColumnDef<Invoice>[] = useMemo(
    () => [
      { key: 'invoiceNumber', label: 'Invoice Number', type: 'text' },
      { key: 'clientName', label: 'Client', type: 'text', getValue: r => r.client?.name || r.quote?.client?.name || '—' },
      { key: 'reference', label: 'Reference', type: 'text', getValue: r => r.quote?.reference || '—' },
      { key: 'amount', label: 'Amount', type: 'currency', getValue: r => r.amount, format: v => formatAmount(Number(v) || 0) },
      { key: 'createdAt', label: 'Created Date', type: 'date', format: v => (v ? new Date(v).toLocaleDateString() : '—') },
      { key: 'dueDate', label: 'Due Date', type: 'date', format: v => (v ? new Date(v).toLocaleDateString() : '—') },
      { key: 'status', label: 'Status', type: 'select', selectOptions: ['Paid', 'Pending', 'Overdue', 'Draft', 'Sent'] },
      { key: 'isOverdue', label: 'Overdue', type: 'select', selectOptions: ['Yes', 'No'], getValue: r => (r.isOverdue ? 'Yes' : 'No') }
    ],
    []
  );

  const statsSummary = (
    <div className="stats-row" style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
      <div className="stat-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Invoices</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{invoices.length}</div>
      </div>
      <div className="stat-box" style={{ background: 'white', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid #e2e8f0' }}>
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Value</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>{formatAmount(totalValue)}</div>
      </div>
    </div>
  );

  const renderActions = (invoice: Invoice) => (
    <ActionMenu
      items={[
        { label: 'View', icon: '👁️', onClick: () => onView(invoice) },
        { label: 'Edit', icon: '✏️', onClick: () => onEdit(invoice) },
        { label: 'Delete', icon: '🗑️', onClick: () => onDelete(invoice.id), variant: 'danger' }
      ]}
    />
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Invoices</h2>
          <p>Manage and track invoices</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Invoice
        </button>
      </div>

      <DataGrid
        columns={columns}
        data={invoices}
        renderActions={renderActions}
        statsSummary={statsSummary}
        searchPlaceholder="Search invoices by number, client, reference, or status..."
        emptyMessage="No invoices found. Click '+ New Invoice' to get started."
      />
    </div>
  );
}
