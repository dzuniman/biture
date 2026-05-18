import type { Invoice } from '../types';

interface Props {
  invoices: Invoice[];
}

export default function InvoiceList({ invoices }: Props) {
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
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.client?.name ?? '—'}</td>
              <td>{invoice.quote?.reference ?? '—'}</td>
              <td>{invoice.amount.toFixed(2)}</td>
              <td>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '—'}</td>
              <td>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</td>
              <td>{invoice.status}</td>
              <td>{invoice.isOverdue ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
