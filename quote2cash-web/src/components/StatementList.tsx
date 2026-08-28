import React, { useMemo } from 'react';
import type { Statement, Invoice } from '../types';
import { formatAmount } from '../../formatters';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

interface Props {
  statements: Statement[];
  invoices: Invoice[];
  onEdit: (statement: Statement) => void;
  onView: (statement: Statement) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function StatementList({ statements, invoices, onEdit, onView, onDelete }: Props) {
  const getTotals = (rawItems: any[] = []) => {
    const totalPayments = rawItems.reduce((sum, item) => sum + (item.paymentAmount || item.PaymentAmount || 0), 0);
    const uniqueInvoiceIds = Array.from(new Set(rawItems.map(i => i.invoiceId || i.InvoiceId).filter(id => !!id)));
    const totalInvoiced = uniqueInvoiceIds.reduce((sum, id) => {
      const inv = invoices.find(i => i.id === id);
      return sum + (inv?.amount ?? 0);
    }, 0);

    return {
      totalPayments,
      totalOutstanding: Math.max(0, totalInvoiced - totalPayments)
    };
  };

  const enrichedStatements = useMemo(() => {
    return statements.map((stmt: any) => {
      const items = stmt.items || stmt.Items || [];
      const { totalPayments, totalOutstanding } = getTotals(items);
      return {
        ...stmt,
        clientName: stmt.client?.name || stmt.Client?.Name || '—',
        totalPayments,
        totalOutstanding
      };
    });
  }, [statements, invoices]);

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      { key: 'statementNumber', label: 'Statement #', type: 'text', getValue: r => r.statementNumber || r.StatementNumber },
      { key: 'clientName', label: 'Client', type: 'text' },
      { key: 'totalPayments', label: 'Total Payments', type: 'currency', getValue: r => r.totalPayments, format: v => formatAmount(Number(v) || 0) },
      {
        key: 'totalOutstanding',
        label: 'Total Outstanding',
        type: 'currency',
        getValue: r => r.totalOutstanding,
        render: (_, val) => (
          <span style={{ color: Number(val) > 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
            {formatAmount(Number(val) || 0)}
          </span>
        )
      }
    ],
    []
  );

  const renderActions = (statement: any) => (
    <ActionMenu
      items={[
        { label: 'View', icon: '👁️', onClick: () => onView(statement) },
        { label: 'Edit', icon: '✏️', onClick: () => onEdit(statement) },
        { label: 'Delete', icon: '🗑️', onClick: () => onDelete(statement.id), variant: 'danger' }
      ]}
    />
  );

  return (
    <DataGrid
      columns={columns}
      data={enrichedStatements}
      renderActions={renderActions}
      searchPlaceholder="Search statements by number or client..."
      emptyMessage="No statements found. Click '+ New Statement' to get started."
    />
  );
}
