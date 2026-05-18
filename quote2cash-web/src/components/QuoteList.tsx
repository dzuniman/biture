import type { Quote } from '../types';

interface Props {
  quotes: Quote[];
}

export default function QuoteList({ quotes }: Props) {
  return (
    <div className="card">
      <h2>Quotes</h2>
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Customer</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Invoices</th>
            <th>Status</th>
            <th>Due</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.id}>
              <td>{quote.reference}</td>
              <td>{quote.customerName}</td>
              <td>{quote.client?.name ?? '—'}</td>
              <td>{quote.amount.toFixed(2)}</td>
              <td>
                {quote.invoiceCount ?? 0}
                {quote.invoiceTotal ? ` / ${quote.invoiceTotal.toFixed(2)}` : ''}
              </td>
              <td>{quote.status}</td>
              <td>{quote.dueDate ? new Date(quote.dueDate).toLocaleDateString() : '—'}</td>
              <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
