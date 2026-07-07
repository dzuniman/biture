import { getInvoice } from '../api';
import type { Invoice, Client, Quote, InvoiceQuote } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';
import { generateInvoicePDF } from './InvoicePdfGenerator'; // Import the new generator

interface Props {
  invoice: Invoice;
  onEdit: () => void;
  onBack: () => void;
}

export default function InvoiceViewPage({ invoice, onEdit, onBack }: Props) {
  const formatDate = (dateValue?: string | null) => {
    if (!dateValue) return '—';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const invoiceDate = formatDate(invoice.createdAt);
  const dueDate = formatDate(invoice.dueDate);

  console.log("Invoice object:", invoice);

  const quote = invoice.quote;
  console.log("Quote object:", quote);
  // Sort items by itemNumber to ensure consistent display
  const items = (quote?.items ?? []).slice().sort((a, b) => {
    const aNum = Number(a.itemNumber);
    const bNum = Number(b.itemNumber);
    return aNum - bNum;
  });
  console.log("Invoice items:", items);
  // Prioritize pulling full address from quote client, fallback to invoice client
  // Added more explicit checks for nested properties
  const displayClient: Client | null | undefined =
    (quote?.client && quote.client.addressLine1) ? quote.client :
    (invoice.client && invoice.client.addressLine1) ? invoice.client :
    quote?.client || invoice.client;
  console.log("Display Client object:", displayClient);

  const vat = Number(quote?.vat ?? 0);
  const subTotal = Number(quote?.subTotal ?? 0);
  const total = quote ? (subTotal + vat) : Number(invoice.amount ?? 0);

  const handleDownloadPdf = async () => {
    try {
      const fullInvoiceData = await getInvoice(invoice.id);
      generateInvoicePDF(fullInvoiceData);
    } catch (error) {
      console.error("Error fetching invoice data for PDF:", error);
      alert("Failed to fetch invoice data for PDF generation. Please try again.");
    }
  };

  return (
    <div className="page-section">
      <style dangerouslySetInnerHTML={{ __html: `
        .print-only { display: none !important; }
        @media print {
          .no-print, .section-header { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .view-container, .view-card, .view-section, .items-table, .items-table-header, .items-table-row, .summary-row { border: none !important; box-shadow: none !important; background: none !important; }
          .view-card { padding: 20px !important; width: 100% !important; margin: 0 !important; font-size: 9pt !important; display: flex !important; flex-direction: column !important; min-height: 26.7cm !important; box-sizing: border-box !important; }
          .items-table-header, .items-table-row { display: grid !important; grid-template-columns: 60px 1fr 120px 120px !important; gap: 4px !important; }
          .items-table-header div, .items-table-row div { border-left: 0.5pt solid #ccc !important; padding: 6px !important; }
          .items-table-header div:last-child, .items-table-row div:last-child { border-right: 0.5pt solid #ccc !important; }
          @page { size: A4; margin: 1.5cm 1cm; }
        }
      ` }} />
      <div className="section-header no-print">
        <div>
          <h2>{invoice.invoiceNumber}</h2>
          <p>Invoice details for {quote?.reference ?? 'selected quote'}</p>
        </div>
        <div>
          <button onClick={onBack} className="btn-secondary no-print">
            ← Back to Invoices
          </button>
        </div>
      </div>
      <div className="view-container">
        <div className="view-card" style={{ color: '#000', display: 'flex', flexDirection: 'column', minHeight: '29.7cm', boxSizing: 'border-box' }}>
          <div className="quote-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', marginBottom: '18px' }}>
            <div className="quote-view-left" style={{ minWidth: '280px' }}>
              <div className="company-block">
                <div className="company-lines" style={{ fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '8px' }}>
                  <strong>BITURE (PTY) LTD &nbsp;&nbsp; Reg: K2013/194395/07 &nbsp;&nbsp; VAT No: 4480272220</strong>
                  <div>Cnr Fred Versepute and Asparagus Road Midrand 1685</div>
                  <div>Email: BetrothM@biture.co.za &nbsp;&nbsp; Tel: +2765 835 4371 | +2783 249 8510</div>
                </div>
                <img src={logo} alt="BITURE" className="company-logo" style={{ display: 'block', maxHeight: '150px', width: 'auto', minHeight: '30px' }} />
              </div>
            </div>
            <div className="quote-view-right" style={{ textAlign: 'right', fontSize: '0.75rem', lineHeight: '1' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1px', lineHeight: '1' }}>TAX INVOICE</div>
              <div className="quote-details-block" style={{ fontSize: '0.75rem', lineHeight: '0', marginBottom: '2px' }}>
                <div className="view-row" style={{ marginBottom: '1px' }}>
                  <span className="view-label">INVOICE NUMBER:</span>
                  <span className="view-value">{invoice.invoiceNumber}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '1px' }}>
                  <span className="view-label">INVOICE DATE:</span>
                  <span className="view-value">{invoiceDate}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '1px' }}>
                  <span className="view-label">DUE DATE:</span>
                  <span className="view-value">{dueDate}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '1px' }}>
                  <span className="view-label">VENDOR NUMBER:</span>
                  <span className="view-value">{invoice.client?.vendorNumber || '—'}</span>
                </div>
                {quote?.poNumber && (
                  <div className="view-row" style={{ marginBottom: '1px' }}>
                    <span className="view-label">PO NUMBER:</span>
                    <span className="view-value">{quote.poNumber}</span>
                  </div>
                )}
              {displayClient ? (
                <div className="customer-box" style={{ border: '1px solid #000', padding: '8px', marginTop: '8px', fontSize: '0.75rem', lineHeight: '1.4', minHeight: '80px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>BILL TO:</div>
                  {displayClient.name && <div style={{ marginBottom: '2px' }}>{displayClient.name}</div>}
                  {displayClient.addressLine1 && <div style={{ marginBottom: '2px' }}>{displayClient.addressLine1}</div>}
                  {displayClient.addressLine2 && <div style={{ marginBottom: '2px' }}>{displayClient.addressLine2}</div>}
                  {displayClient.addressLine3 && <div style={{ marginBottom: '2px' }}>{displayClient.addressLine3}</div>}
                  {displayClient.addressLine4 && <div style={{ marginBottom: '2px' }}>{displayClient.addressLine4}</div>}
                  {displayClient.vatNumber && <div style={{ marginBottom: '2px' }}>VAT No: {displayClient.vatNumber}</div>}
                  {displayClient.email && <div style={{ marginBottom: '2px' }}>{displayClient.email}</div>}
                  <div style={{ marginBottom: '2px' }}>{displayClient.representativeName || '—'}</div>
                  <div style={{ marginBottom: '2px' }}>{displayClient.representativeNumber || '—'}</div>
                </div>
              ) : (
                <div className="customer-box" style={{ border: '1px solid #000', padding: '6px', marginTop: '8px', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold' }}>BILL TO:</div>
                  <div>No client information available.</div>
                </div>
              )}
              </div>
            </div>
          </div>

          <div className="view-section" style={{ marginTop: '24px' }}>
            <div className="items-table" style={{ border: '1px solid #000', borderRadius: '2px', overflow: 'hidden' }}>
              <div className="items-table-header" style={{ display: 'grid', gridTemplateColumns: '60px 60px 1fr 120px 120px', gap: '0', background: '#f3f4f6', borderBottom: '1px solid #000', padding: '0' }}>
                <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>ITEM</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>Qty</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>Description</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'right' }}>Unit Price</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'right' }}>Total</div>
              </div>
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="items-table-row" style={{ display: 'grid', gridTemplateColumns: '60px 60px 1fr 120px 120px', gap: '0', borderTop: '1px solid #eee' }}>
                    <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{item.itemNumber}</div>
                    <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{item.quantity}</div>
                    <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{item.description}</div>
                    <div style={{ padding: '8px 6px', textAlign: 'right', lineHeight: '1.2' }}>{formatAmount(item.unitPrice)}</div>
                    <div style={{ padding: '8px 6px', textAlign: 'right', lineHeight: '1.2' }}>{formatAmount(item.totalPrice)}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px' }}>No invoice items available.</div>
              )}
            </div>
          </div>
          <div className="view-section" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '24px' }}>
            <div style={{ width: '220px' }}>
              <div className="summary-row" style={{ lineHeight: '0', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Sub total</span>
                <strong>{formatAmount(subTotal)}</strong>
              </div>
              <div className="summary-row" style={{ lineHeight: '0', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>VAT</span>
                <strong>{formatAmount(vat)}</strong>
              </div>
              <div className="summary-row" style={{ lineHeight: '0', display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '1.05rem', borderTop: '1px solid #000', paddingTop: '10px' }}>
                <span>Total</span>
                <strong>{formatAmount(total)}</strong>
              </div>
            </div>
          </div>

          <div className="view-section" style={{ marginTop: '20px', lineHeight: '2.0', borderTop: '1px solid #eee', paddingTop: '10px' }}>
             
              <div style={{ fontSize: '0.65rem', lineHeight: '1.2' }}>
                <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>OUR BANKING DETAILS ARE AS FOLLOWS:</div>
                <div style={{ marginTop: '4px' }}>
                  <div>Account Name: BITURE (PTY) LTD</div>
                  <div>Bank: Standard Bank</div>
                  <div>Account Number: 10142678536</div>
                  <div>Branch Code: 051001</div>
                  <div>Thank you for your Purchase Order. For product or services related purchases, the invoice will only be due once the goods have been delivered or the services rendered. Please confirm your payment by e-mailing your proof of payment or remittance advise to</div>
                  <div>BetrothM@biture.co.za</div>
                </div>
              </div>
            </div>

          <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '20px' }}>
            <button type="button" onClick={onEdit} className="btn-primary">
              Edit Invoice
            </button>
            <button type="button" onClick={handleDownloadPdf} className="btn-secondary">
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
