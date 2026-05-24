import type { Quote } from '../types';
import { formatAmount } from '../../formatters';

interface Props {
  quotes: Quote[];
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => Promise<void>;
  onView: (quoteId: string) => Promise<void>;
}

export default function QuoteList({ quotes, onEdit, onDelete, onView }: Props) {
  return (
    <div className="card">
      <h2>Quotes</h2>
      <table>
        <thead>
          <tr>
            <th>Quote #</th>
            <th>Reference</th>
            <th>Client</th>
            <th>Date</th>
            <th>Validity</th>
            <th>Vendor</th>
            <th>Subtotal</th>
            <th>VAT</th>
            <th>Total</th>
            <th>Items</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.id}>
              <td>{quote.quoteNumber}</td>
              <td>{quote.reference}</td>
              <td>{quote.client?.name ?? '—'}</td>
              <td>{new Date(quote.date).toLocaleDateString()}</td>
              <td>{quote.validityDays} days</td>
              <td>{quote.vendorNumber}</td>
              <td>{formatAmount(quote.subTotal)}</td>
              <td>{formatAmount(quote.vat)}</td>
              <td>{formatAmount(quote.total)}</td>
              <td>{quote.items.length}</td>
              <td className="actions-row">
                <button type="button" onClick={() => onView(quote.id)}>
                  View report
                </button>
                <button type="button" onClick={() => onEdit(quote)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDelete(quote.id)}>
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
