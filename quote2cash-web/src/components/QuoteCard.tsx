import type { Quote } from '../types';
import { formatAmount } from '../../formatters';

interface Props {
  quote: Quote;
  onEdit: (quote: Quote) => void;
  onView: (quote: Quote) => void;
  onDelete: (quoteId: string) => void;
  onDuplicate: (quote: Quote) => void;
}

export default function QuoteCard({ quote, onEdit, onView, onDelete, onDuplicate }: Props) {
  const formattedDate = new Date(quote.date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="card-item">
      <div className="card-item-header">
        <div>
          <h3 className="card-item-ref">{quote.reference}</h3>
          <p>Quote #{quote.quoteNumber}</p>
        </div>
      </div>
      <div className="card-item-body">
        <div className="card-item-detail">
          <span className="label">Client:</span>
          <span>{quote.client?.name || '—'}</span>
        </div>
        <div className="card-item-detail">
          <span className="label">Date:</span>
          <span>{formattedDate}</span>
        </div>
        <div className="card-item-detail">
          <span className="label">Vendor:</span>
          <span>{quote.vendorNumber}</span>
        </div>
        <div className="card-item-detail card-item-price">
          <span className="label">Total:</span>
          <span className="price">{formatAmount(quote.total)}</span>
        </div>
      </div>
      <div className="card-item-footer">
        <button type="button" onClick={() => onView(quote)} className="btn-secondary">
          View
        </button>
        <button type="button" onClick={() => onEdit(quote)} className="btn-primary">
          Edit
        </button>
        <button type="button" onClick={() => onDuplicate(quote)} className="btn-secondary">
          Duplicate
        </button>
        <button type="button" onClick={() => onDelete(quote.id)} className="btn-danger">
          Delete
        </button>
      </div>
    </div>
  );
}
