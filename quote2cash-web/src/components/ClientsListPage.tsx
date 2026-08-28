import React, { useMemo } from 'react';
import type { Client } from '../types';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

interface Props {
  clients: Client[];
  onEdit: (client: Client) => void;
  onView: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onCreateNew: () => void;
}

export default function ClientsListPage({
  clients,
  onEdit,
  onView,
  onDelete,
  onCreateNew
}: Props) {
  const columns: ColumnDef<Client>[] = useMemo(
    () => [
      { key: 'name', label: 'Client Name', type: 'text' },
      { key: 'vatNumber', label: 'VAT Number', type: 'text', getValue: r => r.vatNumber || '—' },
      { key: 'vendorNumber', label: 'Vendor #', type: 'text', getValue: r => r.vendorNumber || '—' },
      { key: 'representativeName', label: 'Representative', type: 'text', getValue: r => r.representativeName || '—' },
      { key: 'representativeNumber', label: 'Phone', type: 'text', getValue: r => r.representativeNumber || '—' }
    ],
    []
  );

  const renderActions = (client: Client) => (
    <ActionMenu
      items={[
        { label: 'View', icon: '👁️', onClick: () => onView(client) },
        { label: 'Edit', icon: '✏️', onClick: () => onEdit(client) },
        { label: 'Delete', icon: '🗑️', onClick: () => onDelete(client.id), variant: 'danger' }
      ]}
    />
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Clients</h2>
          <p>Client profiles and information</p>
        </div>
        <button onClick={onCreateNew} className="btn-primary-lg">
          + New Client
        </button>
      </div>

      <DataGrid
        columns={columns}
        data={clients}
        renderActions={renderActions}
        searchPlaceholder="Search clients by name, representative, or phone..."
        emptyMessage="No clients found. Click '+ New Client' to add one."
      />
    </div>
  );
}
