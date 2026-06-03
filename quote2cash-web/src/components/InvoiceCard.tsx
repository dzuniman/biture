import type { Invoice } from '../types';
import { formatAmount } from '../../formatters';

interface Props {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
}

export default function InvoiceCard({ invoice, onView, onEdit, onDelete }: Props) {
  const formattedDate = invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '—';

  return (
    <div className="card-item">
      <div className="card-item-header">
        <div>
          <h3 className="card-item-ref">{invoice.invoiceNumber}</h3>
          <p>{invoice.status}</p>
        </div>
      </div>
      <div className="card-item-body">
        <div className="card-item-detail">
          <span className="label">Client:</span>
          <span>{invoice.client?.name || invoice.quote?.reference || '—'}</span>
        </div>
        <div className="card-item-detail">
          <span className="label">Quote:</span>
          <span>{invoice.quote?.reference ?? '—'}</span>
        </div>
        <div className="card-item-detail">
          <span className="label">Date:</span>
          <span>{formattedDate}</span>
        </div>
        <div className="card-item-detail card-item-price">
          <span className="label">Total:</span>
          <span className="price">{formatAmount(invoice.amount)}</span>
        </div>
      </div>
      <div className="card-item-footer">
        <button type="button" onClick={() => onView(invoice)} className="btn-secondary">
          View
        </button>
        <button type="button" onClick={() => onEdit(invoice)} className="btn-primary">
          Edit
        </button>
        <button type="button" onClick={() => onDelete(invoice.id)} className="btn-danger">
          Delete
        </button>
      </div>
    </div>
  );
}
