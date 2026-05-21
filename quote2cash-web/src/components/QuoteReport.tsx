import type { Quote } from '../types';

interface Props {
  quote: Quote;
  onClose: () => void;
}

export default function QuoteReport({ quote, onClose }: Props) {
  const clientAddress = [
    quote.client?.addressLine1,
    quote.client?.addressLine2,
    quote.client?.addressLine3,
    quote.client?.addressLine4
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="card report-card">
      <div className="report-header">
        <div>
          <p className="eyebrow">Quote report</p>
          <h2>{quote.reference}</h2>
          <p>Quote number {quote.quoteNumber}</p>
        </div>
        <button className="secondary" type="button" onClick={onClose}>
          Close report
        </button>
      </div>

      <div className="report-grid">
        <div>
          <h3>Client</h3>
          <p>{quote.client?.name ?? 'Unknown client'}</p>
          {clientAddress && <p>{clientAddress}</p>}
          {quote.client?.representativeName && <p>{quote.client.representativeName}</p>}
          {quote.client?.representativeNumber && <p>{quote.client.representativeNumber}</p>}
        </div>
        <div>
          <h3>Quote details</h3>
          <p><strong>Date:</strong> {new Date(quote.date).toLocaleDateString()}</p>
          <p><strong>Validity:</strong> {quote.validityDays} days</p>
          <p><strong>Vendor number:</strong> {quote.vendorNumber}</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Qty</th>
              <th>UOM</th>
              <th>Unit price</th>
              <th>Total price</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id}>
                <td>{item.itemNumber}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.uom}</td>
                <td>{item.unitPrice.toFixed(2)}</td>
                <td>{item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="report-summary">
        <div />
        <div>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{quote.subTotal.toFixed(2)}</strong>
          </div>
          <div className="summary-row">
            <span>VAT (15%)</span>
            <strong>{quote.vat.toFixed(2)}</strong>
          </div>
          <div className="summary-row total-row">
            <span>Total</span>
            <strong>{quote.total.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
