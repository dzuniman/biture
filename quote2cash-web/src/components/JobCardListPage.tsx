import React, { useMemo } from 'react';
import type { JobCard } from '../types';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

interface Props {
  jobCards: JobCard[];
  onView: (jobCard: JobCard) => void;
  onEdit: (jobCard: JobCard) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export default function JobCardListPage({
  jobCards,
  onView,
  onEdit,
  onDelete,
  onCreateNew
}: Props) {
  const columns: ColumnDef<JobCard>[] = useMemo(
    () => [
      { key: 'jobCardNumber', label: 'Job Card Number', type: 'text' },
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
        <span className="stat-label" style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Job Cards</span>
        <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{jobCards.length}</div>
      </div>
    </div>
  );

  const renderActions = (jc: JobCard) => (
    <ActionMenu
      items={[
        { label: 'View', icon: '👁️', onClick: () => onView(jc) },
        { label: 'Edit', icon: '✏️', onClick: () => onEdit(jc) },
        { label: 'Delete', icon: '🗑️', onClick: () => onDelete(jc.id), variant: 'danger' }
      ]}
    />
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Job Cards</h2>
          <p>Manage and track job cards</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Job Card
        </button>
      </div>

      <DataGrid
        columns={columns}
        data={jobCards}
        renderActions={renderActions}
        statsSummary={statsSummary}
        searchPlaceholder="Search job cards by number, quote, reference, description, or client..."
        emptyMessage="No job cards found. Click '+ New Job Card' to get started."
      />
    </div>
  );
}
