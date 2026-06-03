import type { Invoice } from '../types';
import { formatAmount } from '../../formatters';

interface Props {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function InvoiceList({ invoices, onView, onEdit, onDelete }: Props) {
  return (
    <div className="card">
      <h2>Invoices</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice number</th>
            <th>Client</th>
            <th>Quote</th>
            <th>Amount</th>
            <th>Created</th>
            <th>Due</th>
            <th>Status</th>
            <th>Overdue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.client?.name ?? '—'}</td>
              <td>{invoice.quote?.reference ?? '—'}</td>
              <td>{formatAmount(invoice.amount)}</td>
              <td>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '—'}</td>
              <td>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</td>
              <td>{invoice.status}</td>
              <td>{invoice.isOverdue ? 'Yes' : 'No'}</td>
              <td className="actions-row">
                <button type="button" onClick={() => onView(invoice)}>
                  View
                </button>
                <button type="button" onClick={() => onEdit(invoice)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDelete(invoice.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
