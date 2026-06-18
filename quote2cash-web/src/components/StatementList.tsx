import type { Statement, StatementItem, Invoice } from '../types';
import { formatAmount } from '../../formatters';

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

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Statement #</th>
            <th>Client</th>
            <th>Total Payments</th>
            <th>Total Outstanding</th>
            <th className="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {statements.length === 0 ? (
            <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
              <td colSpan={5} className="empty-row" style={{ textAlign: 'center' }}>
                No statements found. Click "+ New Statement" to get started.
              </td>
            </tr>
          ) : (
            statements.map((statement: any) => {
              const items = statement.items || statement.Items || [];
              const { totalPayments, totalOutstanding } = getTotals(items);
              const clientName = statement.client?.name || statement.Client?.Name || '—';
              
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
