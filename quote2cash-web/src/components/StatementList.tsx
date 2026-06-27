import { useMemo, useState } from 'react';
import type { Statement, StatementItem, Invoice } from '../types';
import { formatAmount } from '../../formatters';
import SearchBox from './SearchBox';
import TableHeader from './TableHeader';
import useTableSort from '../hooks/useTableSort';

interface Props {
  statements: Statement[];
  invoices: Invoice[];
  onEdit: (statement: Statement) => void;
  onView: (statement: Statement) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function StatementList({ statements, invoices, onEdit, onView, onDelete }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter based on search term
  const filteredStatements = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return statements;
    return statements.filter((stmt) => {
      const stmtNum = stmt.statementNumber?.toString() || '';
      const clientName = stmt.client?.name || (stmt as any).Client?.Name || '';
      return (
        stmtNum.toLowerCase().includes(term) ||
        clientName.toLowerCase().includes(term)
      );
    });
  }, [statements, searchTerm]);

  // Enrich data with derived fields needed for sorting (clientName)
  const enrichedData = useMemo(() =>
    filteredStatements.map((stmt) => ({
      ...stmt,
      clientName: stmt.client?.name || (stmt as any).Client?.Name || '',
    })),
    [filteredStatements]
  );

  const { sortedData, sortKey, sortDirection, setSort } = useTableSort(enrichedData);

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

  return (
    <div className="table-card">
      <SearchBox placeholder="Search statements by number or client..." value={searchTerm} onChange={setSearchTerm} />
      <table>
        <thead>
          <tr>
            <TableHeader columnKey="statementNumber" label="Statement" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
            <TableHeader columnKey="clientName" label="Client" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
            <TableHeader columnKey="totalPayments" label="Total Payments" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
            <TableHeader columnKey="totalOutstanding" label="Total Outstanding" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
            <th className="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
              <td colSpan={5} className="empty-row" style={{ textAlign: 'center' }}>
                No statements found. Click "+ New Statement" to get started.
              </td>
            </tr>
          ) : (
            sortedData.map((statement: any) => {
              const items = statement.items || statement.Items || [];
              const { totalPayments, totalOutstanding } = getTotals(items);
              const clientName = statement.clientName || '—';

              return (
                <tr
                  key={statement.id}
                  style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}
                  className="table-row-dark-hover"
                >
                  <td>{statement.statementNumber || statement.StatementNumber}</td>
                  <td>{clientName}</td>
                  <td>{formatAmount(totalPayments)}</td>
                  <td style={{ color: totalOutstanding > 0 ? '#dc2626' : '#22c55e', fontWeight: 'bold' }}>
                    {formatAmount(totalOutstanding)}
                  </td>
                  <td className="actions-row">
                    <button type="button" onClick={() => onView(statement)}>
                      View
                    </button>
                    <button type="button" onClick={() => onEdit(statement)}>
                      Edit
                    </button>
                    <button type="button" className="danger" onClick={() => onDelete(statement.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
