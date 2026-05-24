import type { Quote } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../../resource/Logo.png';

interface Props {
  quote: Quote;
  onEdit: () => void;
  onDuplicate: () => void;
  onBack: () => void;
}

export default function QuoteViewPage({ quote, onEdit, onDuplicate, onBack }: Props) {
  const formattedDate = new Date(quote.date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const validUntil = new Date(quote.date);
  validUntil.setDate(validUntil.getDate() + quote.validityDays);
  const formattedValidUntil = validUntil.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="page-section">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .view-card { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .items-table-header { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          @page { margin: 1.5cm; }
        }
      ` }} />
      <div className="section-header">
        <div>
          <h2>{quote.reference}</h2>
          <p>Quote #{quote.quoteNumber}</p>
        </div>
        <button onClick={onBack} className="btn-secondary no-print">
          ← Back to Quotes
        </button>
      </div>

      <div className="view-container">
        <div className="view-card">
          <div className="quote-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div className="quote-view-left">
              <div className="company-block">
                <div className="company-lines" style={{ fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '8px' }}>
                  <strong>EPEC SOLUTIONS (PTY) LTD &nbsp;&nbsp; Reg: 2012/118990/07 &nbsp;&nbsp; VAT No: 4470275886</strong>
                  <div>259 Kent Avenue, Randburg, Johannesburg, Gauteng, 2194</div>
                  <div>email: sales@epec.co.za &nbsp;&nbsp; Phone: 065 835 4371</div>
                </div>
                <img src={logo} alt="Epec Solutions" className="company-logo" style={{ maxHeight: '150px', width: 'auto' }} />
              </div>
            </div>

            <div className="quote-view-right" style={{ textAlign: 'right', fontSize: '0.75rem', lineHeight: '1.3' }}>
              <div className="view-section">
                <h3 style={{ margin: '0 0 1px 0', fontSize: '0.8rem' }}>Quote Information</h3>
                <div className="view-row" style={{ marginBottom: '0', lineHeight: '0' }}>
                  <span className="view-label">Quote Number:</span>
                  <span className="view-value">#{quote.quoteNumber}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '0', lineHeight: '0' }}>
                  <span className="view-label">Reference:</span>
                  <span className="view-value">{quote.reference}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '0', lineHeight: '0' }}>
                  <span className="view-label">Vendor Number:</span>
                  <span className="view-value">{quote.vendorNumber}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '0', lineHeight: '0' }}>
                  <span className="view-label">Date:</span>
                  <span className="view-value">{formattedDate}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '0', lineHeight: '0' }}>
                  <span className="view-label">Valid Until:</span>
                  <span className="view-value">{formattedValidUntil}</span>
                </div>
              </div>

              {quote.client && (
                <div className="view-section" style={{ marginTop: '2px' }}>
                  <h3 style={{ margin: '0 0 1px 0', fontSize: '0.8rem' }}>Client Information</h3>
                  <div className="view-row" style={{ marginBottom: '0', lineHeight: '0' }}>
                    <span className="view-label">Name:</span>
                    <span className="view-value">{quote.client.name}</span>
                  </div>
                  <div className="view-row" style={{ marginBottom: '0', lineHeight: '1.3' }}>
                    <span className="view-label">Address:</span>
                    <span className="view-value">
                      {quote.client.addressLine1 || ''}
                      {quote.client.addressLine2 ? <><br />{quote.client.addressLine2}</> : null}
                      {quote.client.addressLine3 ? <><br />{quote.client.addressLine3}</> : null}
                      {quote.client.addressLine4 ? <><br />{quote.client.addressLine4}</> : null}
                    </span>
                  </div>
                  <div className="view-row" style={{ marginBottom: '0', lineHeight: '0' }}>
                    <span className="view-label">Representative:</span>
                    <span className="view-value">{quote.client.representativeName || '—'}</span>
                  </div>
                  <div className="view-row" style={{ marginBottom: '0', lineHeight: '0' }}>
                    <span className="view-label">Contact Number:</span>
                    <span className="view-value">{quote.client.representativeNumber || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="quote-view-main">
            <div className="view-section">
              <div className="items-table">
                <div className="items-table-header">
                  <div>#</div>
                  <div>Qty</div>
                  <div>UOM</div>
                  <div>Description</div>
                  <div>Unit Price</div>
                  <div>Total</div>
                </div>
                {quote.items.map((item) => (
                  <div key={item.id} className="items-table-row">
                    <div>{item.itemNumber}</div>
                    <div>{item.quantity}</div>
                    <div>{item.uom}</div>
                    <div>{item.description}</div>
                    <div>{formatAmount(item.unitPrice)}</div>
                    <div>{formatAmount(item.totalPrice)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="view-section">
              <div className="summary-row">
                <span className="summary-label">Subtotal:</span>
                <span className="summary-value">{formatAmount(quote.subTotal)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">VAT (15%):</span>
                <span className="summary-value">{formatAmount(quote.vat)}</span>
              </div>
              <div className="summary-row summary-total">
                <span className="summary-label">Total:</span>
                <span className="summary-value">{formatAmount(quote.total)}</span>
              </div>
            </div>

            <div className="view-section" style={{ marginTop: '20px', lineHeight: '2.0', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <div style={{ marginBottom: '8px', fontSize: '0.8rem' }}>
                Received and Approved by: __________________________________________________________
              </div>
              <div style={{ marginBottom: '15px', fontSize: '0.8rem' }}>
                Signature: _________________________________________________________________________
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem',marginBottom: '10px' }}>
                <span>A written order is required should the quote be accepted</span>
                <span>A soft copy of a purchase order should be forwarded to sales@epec.co.za</span>
              </div>

              <div style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>
                <div>THIS QUOTE IS SUBJECT TO THE FOLLOWING:</div>
                <div style={{ marginTop: '4px' }}>
                  <div>1) This quote automatically expires after thirty (30) days irrespective of the valid date above.</div>
                  <div>2) The standard terms and conditions of sale of EPEC (Pty) Ltd shall apply (such terms and conditions available on request)</div>
                  <div>3) Foreign Exchange: The price quoted is subject of an ROE of ZAR 19.10 to the USD. In the event that the Rand devalues against the US Dollar from date of this quotation, until the goods are received by EPEC (Pty) Ltd. EPEC (Pty) Ltd reserves the right to increase the amount payable by the customer in respect of such goods by the percentage of such change.</div>
                  <div>5) Errors and omissions are excluded</div>
                  <div>6) Upon placing of order, please quote this quote number</div>
                  <div>7) Payment terms must be adhered to - Upon default, customer will be re-invoiced at standard pricing.</div>
                  <div>8) This quotation is conditional upon your signed acceptance thereof, including the terms and conditions referred above and that it is returned to EPEC (Pty) Ltd within thirty (30) working days.</div>
                </div>
              </div>
            </div>

            <div className="view-actions no-print">
              <button onClick={onEdit} className="btn-primary" type="button">
                Edit Quote
              </button>
              <button onClick={onDuplicate} className="btn-secondary" type="button">
                Duplicate Quote
              </button>
              <button onClick={() => window.print()} className="btn-secondary" type="button">
                Print to PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
