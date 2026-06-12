import type { Quote, Client } from '../types'; // Ensure Client type is imported
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';
import { generateQuotePDF } from './QuotePdfGenerator'; // Import the Quote generator

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

  const handleDownloadQuotePdf = async () => {
    try {
      // Correctly call the generateQuotePDF function with the 'quote' prop
      await generateQuotePDF(quote);
    } catch (err) {
      console.error("Quote PDF Generation failed:", err);
      alert("Could not generate Quote PDF. Please check the console for errors.");
    }
  };

  return (
    <div className="page-section">
      <style dangerouslySetInnerHTML={{ __html: `
        .print-only { display: none !important; }
        @media print {
          .no-print, .section-header { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .page-section, .view-container, .view-card, .view-section, .items-table, .items-table-header, .items-table-row, .summary-row, .summary-total {
            border: none !important;
            box-shadow: none !important;
            background: none !important;
          }
          .page-section { padding: 0 !important; margin: 0 !important; }
          .view-container { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          .view-card { 
            padding: 20px !important; /* Maintain internal padding for content */
            width: 100% !important;
            margin: 0 !important;
            font-size: 9pt !important;
          }
          .company-lines { font-size: 7.5pt !important; line-height: 1.1 !important; }
          .company-logo { max-height: 60px !important; }
          .quote-view-header { border-bottom: 0.5pt solid #ccc !important; padding-bottom: 12px !important; margin-bottom: 15px !important; }
          .quote-view-right { font-size: 6.5pt !important; line-height: 1.1 !important; }
          .quote-view-right h3 { font-size: 7.5pt !important; margin-bottom: 1px !important; }
          .view-row .view-label, .view-row .view-value { font-size: 6.5pt !important; }
          .view-section h3 { font-size: 8pt !important; margin-bottom: 4px !important; }
          .view-row, .company-lines, .view-section div, .summary-row, .items-table-row div { 
            line-height: 1.2 !important; 
            margin-bottom: 0 !important; 
            padding-top: 1px !important;
            padding-bottom: 1px !important;
          }
          .items-table div { font-size: 7.5pt !important; }
          .summary-row span, .summary-row strong { font-size: 8.5pt !important; }
          .summary-total { 
            font-size: 10pt !important; 
            margin-top: 8px !important; 
            border-top: 1.5pt solid #333 !important; 
            padding-top: 4px !important; 
          }
          .quote-view-main > .view-section:nth-of-type(2) {
            border-bottom: 0.5pt solid #ccc !important;
            padding-bottom: 10px !important;
            margin-bottom: 10px !important;
          }
          .items-table-header, .items-table-row {
            display: grid !important;
            grid-template-columns: 25px 40px 55px 45px 1fr 100px 100px !important;
            gap: 8px !important;
            align-items: start !important;
            border-bottom: 0.5pt solid #ccc !important;
            padding-bottom: 4px !important;
            margin-bottom: 4px !important;
          }
          .items-table-header { 
            background-color: #f3f4f6 !important; 
            border-bottom: 1.5pt solid #333 !important;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .items-table-header div { font-weight: bold !important; }
          .summary-section {
            margin-left: auto !important; /* Push to the right */
            width: fit-content !important; /* Shrink to content width */
          }
          .quote-details-block .view-row {
            line-height: 1.2 !important;
            margin-bottom: 2px !important;
          }
          .items-table {
            border-left: none !important; /* Managed by cell borders */
            border-right: none !important; /* Managed by cell borders */
            border-radius: 0 !important;
            overflow: visible !important; /* Ensure content is not clipped */
          }
          .items-table-header {
            background-color: #f3f4f6 !important;
          }
          .items-table-header div,
          .items-table-row div {
            border-left: 1px solid #000 !important;
            padding: 8px 6px !important;
          }
          .items-table-header div:last-child,
          .items-table-row div:last-child {
            border-right: 1px solid #000 !important;
            /* Ensure right border is drawn for the last column */
            border-right: 0.5pt solid #ccc !important;
          }
          .items-table-row {
            border-bottom: none !important;
          }
          .view-section[style*="border-top"] { 
            border-top: none !important; /* Explicitly remove the UI border */
            margin-top: 10px !important; 
            line-height: 1.1 !important; 
            font-size: 6.5pt !important; 
          }
          .view-section[style*="border-top"] div { font-size: 6.5pt !important; }
          @page { size: A4; margin: 1.5cm 1cm; }
          .items-table-header, .items-table-row {
            grid-template-columns: 0.5fr 0.5fr 0.7fr 0.7fr 3fr 1fr 1fr !important; /* More flexible widths */
            gap: 4px !important; /* Reduce gap for tighter fit */
          }
          .items-table-header div, .items-table-row div {
            border-left: 0.5pt solid #ccc !important; /* Consistent border style */
          }
        }
      ` }} />
      <div className="section-header no-print">
        <div>
          <h2>{quote.reference}</h2>
          <p>Quote #{quote.quoteNumber}</p>
        </div>
        <button onClick={onBack} className="btn-secondary no-print">
          ← Back to Quotes
        </button>
      </div>

      <div className="view-container">
        <div className="view-card" style={{ color: '#000' }}>
          <div className="quote-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div className="quote-view-left">
              <div className="company-block">
                <div className="company-lines" style={{ fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '8px' }}>
                  <strong>EPEC SOLUTIONS (PTY) LTD &nbsp;&nbsp; Reg: 2012/118990/07 &nbsp;&nbsp; VAT No: 4470275886</strong>
                  <div>259 Kent Avenue, Randburg, Johannesburg, Gauteng, 2194</div>
                  <div>email: sales@epec.co.za &nbsp;&nbsp; Phone: 065 835 4371</div>
                </div>
                <img src={logo} alt="Epec Solutions" className="company-logo" style={{ display: 'block', maxHeight: '150px', width: 'auto', minHeight: '30px' }} />
              </div>
            </div>

            <div className="quote-view-right" style={{ textAlign: 'right', fontSize: '0.75rem', lineHeight: '1' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1px', lineHeight: '1' }}>SALES QUOTATION</div>

              <div className="quote-details-block" style={{ fontSize: '0.75rem', lineHeight: '1', marginBottom: '2px' }}>
                <div className="view-row" style={{ marginBottom: '1px', lineHeight: '0' }}>
                  <span className="view-label">QUOTE NUMBER:</span>
                  <span className="view-value">{quote.quoteNumber}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '1px', lineHeight: '0' }}>
                  <span className="view-label">REFERENCE:</span>
                  <span className="view-value">{quote.reference}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '1px', lineHeight: '0' }}>
                  <span className="view-label">DATE:</span>
                  <span className="view-value">{formattedDate}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '1px', lineHeight: '0' }}>
                  <span className="view-label">VALIDITY:</span>
                  <span className="view-value">{quote.validityDays} Days</span>
                </div>
                <div className="view-row" style={{ marginBottom: '1px', lineHeight: '0' }}>
                  <span className="view-label">VENDOR NUMBER:</span>
                  <span className="view-value">{quote.vendorNumber}</span>
                </div>
              </div>

              {quote.client && (
                <div className="customer-box" style={{ border: '1px solid #000', padding: '6px', marginTop: '8px', fontSize: '0.75rem', lineHeight: '1.2' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>BILL TO:</div>
                  {quote.client.name && <div style={{ marginBottom: '2px' }}>{quote.client.name}</div>}
                  {quote.client.addressLine1 && <div style={{ marginBottom: '2px' }}>{quote.client.addressLine1}</div>}
                  {quote.client.addressLine2 && <div style={{ marginBottom: '2px' }}>{quote.client.addressLine2}</div>}
                  {quote.client.addressLine3 && <div style={{ marginBottom: '2px' }}>{quote.client.addressLine3}</div>}
                  {quote.client.addressLine4 && <div style={{ marginBottom: '2px' }}>{quote.client.addressLine4}</div>}
                  {quote.client.vatNumber && <div style={{ marginBottom: '2px' }}>VAT No: {quote.client.vatNumber}</div>}
                  <div style={{ marginBottom: '2px' }}>{quote.client.representativeName || '—'}</div>
                  <div style={{ marginBottom: '2px' }}>{quote.client.representativeNumber || '—'}</div>
                </div>
              )}
            </div>
          </div>

          <div className="quote-view-main">
            <div className="view-section">
              <div className="items-table" style={{ border: '1px solid #000', borderRadius: '2px', overflow: 'hidden' }}>
                <div className="items-table-header" style={{ display: 'grid', gridTemplateColumns: '50px 40px 55px 45px 1fr 100px 100px', gap: '0', background: '#f3f4f6', borderBottom: '1px solid #000' }}>
                  <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>ITEM</div>
                  <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>QTY</div>
                  <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>CODE</div>
                  <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>UOM</div>
                  <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>DESCRIPTION</div>
                  <div style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'right' }}>UNIT PRICE</div>
                  <div style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'right' }}>TOTAL</div>
                </div>
                {quote.items.slice().sort((a, b) => {
                  const aNum = Number(a.itemNumber);
                  const bNum = Number(b.itemNumber);
                  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
                  return a.itemNumber.toString().localeCompare(b.itemNumber.toString(), undefined, { numeric: true });
                }).map((item) => (
                  <div key={item.id} className="items-table-row" style={{ display: 'grid', gridTemplateColumns: '50px 40px 55px 45px 1fr 100px 100px', gap: '0' }}>
                    <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{item.itemNumber}</div>
                    <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{item.quantity}</div>
                    <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{item.code || '—'}</div>
                    <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{item.uom}</div>
                    <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{item.description}</div>
                    <div style={{ padding: '8px 6px', textAlign: 'right', lineHeight: '1.2' }}>{formatAmount(item.unitPrice)}</div>
                    <div style={{ padding: '8px 6px', textAlign: 'right', lineHeight: '1.2' }}>{formatAmount(item.totalPrice)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="view-section" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <div style={{ width: '220px' }}>
                <div className="summary-row" style={{ justifyContent: 'space-between', lineHeight: '0', marginBottom: '0px' }}>
                  <span className="summary-label">Sub Total</span>
                  <span className="summary-value">{formatAmount(quote.subTotal)}</span>
                </div>
                <div className="summary-row" style={{ justifyContent: 'space-between', lineHeight: '0', marginBottom: '0px' }}>
                  <span className="summary-label">VAT (15%)</span>
                  <span className="summary-value">{formatAmount(quote.vat)}</span>
                </div>
                <div className="summary-row summary-total" style={{ justifyContent: 'space-between', lineHeight: '0', marginBottom: '0px' }}>
                  <span className="summary-label">Total</span>
                  <span className="summary-value">{formatAmount(quote.total)}</span>
                </div>
              </div>
            </div>

            <div className="view-section" style={{ marginTop: '20px', lineHeight: '2.0', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <div style={{ marginBottom: '8px', fontSize: '0.8rem' }}>
                Received and Approved by: __________________________________________________________
              </div>
              <div className="print-only" style={{ height: '20px' }}></div>
              <div style={{ marginBottom: '15px', fontSize: '0.8rem' }}>
                Signature: _________________________________________________________________________
              </div>
              <div className="print-only" style={{ height: '20px' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem',marginBottom: '10px' }}>
                <span>A written order is required should the quote be accepted</span>
                <span>A soft copy of a purchase order should be forwarded to sales@epec.co.za</span>
              </div>
              <div className="print-only" style={{ height: '20px' }}></div>

              <div style={{ fontSize: '0.65rem', lineHeight: '1.2' }}>
                <div>THIS QUOTE IS SUBJECT TO THE FOLLOWING:</div>
                <div style={{ marginTop: '4px' }}>
                  <div>1) This quote automatically expires after thirty (30) days irrespective of the valid date above.</div>
                  <div>2) The standard terms and conditions of sale of EPEC (Pty) Ltd shall apply (such terms and conditions available on request)</div>
                  <div>3) Foreign Exchange: The price quoted is subject of an ROE of ZAR 19.10 to the USD. In the event that the Rand devalues against the US Dollar from date of this quotation, until the goods are received by EPEC (Pty) Ltd. EPEC (Pty) Ltd reserves the right to increase the amount payable by the customer in respect of such goods by the percentage of such change.</div>
                  <div>4) Delivery will be confirmed upon receipt of a purchase order.</div>
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
              <button 
                onClick={handleDownloadQuotePdf} // Call the corrected handler
                className="btn-secondary"
                type="button"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


