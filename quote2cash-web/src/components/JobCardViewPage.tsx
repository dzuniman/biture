import { formatAmount } from '../../formatters';
import type { JobCard, Client } from '../types';
import logo from '../assets/logo.png';
import { generateJobCardPDF } from './JobCardPdfGenerator';
import { getJobCard } from '../api';

interface Props {
  jobCard: JobCard;
  onEdit: () => void;
  onBack: () => void;
}

export default function JobCardViewPage({ jobCard, onEdit, onBack }: Props) {
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

  const createdDate = formatDate(jobCard.createdAt);
  const quote = jobCard.quote;
  const items = (quote?.items ?? []).slice().sort((a, b) => {
    const aNum = Number(a.itemNumber);
    const bNum = Number(b.itemNumber);
    return aNum - bNum;
  });

  const displayClient: Client | null | undefined = quote?.client || null;
  const vat = Number(quote?.vat ?? 0);
  const subTotal = Number(quote?.subTotal ?? 0);
  const total = subTotal + vat;

  const handleDownloadPdf = async () => {
    try {
      const fullJobCard = await getJobCard(jobCard.id);
      generateJobCardPDF(fullJobCard);
    } catch (error) {
      console.error('Error fetching job card data for PDF:', error);
      alert('Failed to fetch job card data for PDF generation. Please try again.');
    }
  };

  return (
    <div className="page-section">
      <style dangerouslySetInnerHTML={{
        __html: `
        .print-only { display: none !important; }
        @media print {
          .no-print, .section-header { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .view-container, .view-card, .view-section { border: none !important; box-shadow: none !important; background: none !important; }
          .view-card { padding: 20px !important; width: 100% !important; margin: 0 !important; font-size: 9pt !important; }
          .jc-items-table-header, .jc-items-table-row { display: grid !important; grid-template-columns: 80px 1fr !important; }
          @page { size: A4; margin: 1.5cm 1cm; }
        }
      ` }} />

      {/* Page header (screen only) */}
      <div className="section-header no-print">
        <div>
          <h2>{jobCard.jobCardNumber}</h2>
          <p>Job Card for {jobCard.reference || quote?.reference || 'selected quote'}</p>
        </div>
        <button onClick={onBack} className="btn-secondary no-print">
          ← Back to Job Cards
        </button>
      </div>

      <div className="view-container">
        <div className="view-card" style={{ color: '#000' }}>

          {/* ── HEADER ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', marginBottom: '18px' }}>

            {/* Left: Company info + logo */}
            <div style={{ minWidth: '280px' }}>
              <div style={{ fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '10px' }}>
                <strong>BITURE (PTY) LTD &nbsp;&nbsp; Reg: K2013/194395/07 &nbsp;&nbsp; VAT No: 4480272220</strong>
                  <div>Cnr Fred Versepute and Asparagus Road Midrand 1685</div>
                  <div>Email: BetrothM@biture.co.za &nbsp;&nbsp; Tel: +2765 835 4371 | +2783 249 8510</div>
                </div>
                <img src={logo} alt="BITURE" className="company-logo" style={{ display: 'block', maxHeight: '150px', width: 'auto', minHeight: '30px' }} />
              </div>

            {/* Right: JOB CARD details + client box */}
            <div style={{ textAlign: 'right', fontSize: '0.75rem', lineHeight: '1.4' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '1px' }}>JOB CARD</div>

              <div style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600 }}>JOB CARD NUMBER: </span>{jobCard.jobCardNumber}
              </div>
              <div style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600 }}>DATE: </span>{createdDate}
              </div>
              <div style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600 }}>REFERENCE: </span>{jobCard.reference || '—'}
              </div>
              <div style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600 }}>PO NUMBER: </span>{quote?.poNumber || '—'}
              </div>

              {/* Client box */}
              {displayClient ? (
                <div style={{ border: '1px solid #000', padding: '8px', marginTop: '10px', fontSize: '0.75rem', lineHeight: '1.4', minWidth: '200px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>SITE DETAILS:</div>
                  {displayClient.name && <div>{displayClient.name}</div>}
                  {displayClient.addressLine1 && <div>{displayClient.addressLine1}</div>}
                  {displayClient.addressLine2 && <div>{displayClient.addressLine2}</div>}
                  {displayClient.addressLine3 && <div>{displayClient.addressLine3}</div>}
                  {displayClient.addressLine4 && <div>{displayClient.addressLine4}</div>}
                  {displayClient.vatNumber && <div>VAT No: {displayClient.vatNumber}</div>}
                  {displayClient.email && <div>Email: {displayClient.email}</div>}
                  <div>{displayClient.representativeName || '—'}</div>
                  <div>{displayClient.representativeNumber || '—'}</div>
                </div>
              ) : (
                <div style={{ border: '1px solid #000', padding: '6px', marginTop: '10px', fontSize: '0.75rem', textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold' }}>CLIENT:</div>
                  <div>No client information available.</div>
                </div>
              )}
            </div>
          </div>

          {/* ── ITEMS TABLE ── Item + Qty + Description only */}
          <div style={{ marginTop: '20px', border: '1px solid #000', borderRadius: '2px', overflow: 'hidden' }}>
            {/* Header */}
            <div className="jc-items-table-header" style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr', background: '#f3f4f6', borderBottom: '1px solid #000' }}>
              <div style={{ padding: '8px 10px', fontWeight: 'bold', fontSize: '0.8rem' }}>Item</div>
              <div style={{ padding: '8px 10px', fontWeight: 'bold', fontSize: '0.8rem' }}>Qty</div>
              <div style={{ padding: '8px 10px', fontWeight: 'bold', fontSize: '0.8rem', borderLeft: '1px solid #ccc' }}>Description</div>
            </div>
            {/* Rows */}
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="jc-items-table-row" style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr', borderTop: '1px solid #eee' }}>
                  <div style={{ padding: '8px 10px', fontSize: '0.8rem', lineHeight: '1.3' }}>{item.itemNumber}</div>
                  <div style={{ padding: '8px 10px', fontSize: '0.8rem', lineHeight: '1.3' }}>{item.quantity}</div>
                  <div style={{ padding: '8px 10px', fontSize: '0.8rem', lineHeight: '1.3', borderLeft: '1px solid #eee' }}>{item.description}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '16px', fontSize: '0.8rem', color: '#555' }}>No items available from the linked quote.</div>
            )}
          </div>

          {/* ── DESCRIPTION ── */}
          {jobCard.description && (
            <div style={{ marginTop: '16px', fontSize: '0.8rem', lineHeight: '1.5' }}>
              <strong>REMARKS:</strong> {jobCard.description}
            </div>
          )}

          {/* ── SUMMARY (Sub-total / VAT / Total) ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <div style={{ width: '240px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span></span>
                <strong></strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span></span>
                <strong></strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '8px', fontSize: '0.9rem' }}>
                <span></span>
                <strong></strong>
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

          {/* ── ACTION BUTTONS (screen only) ── */}
          <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '28px' }}>
            <button type="button" onClick={onEdit} className="btn-primary">
              Edit Job Card
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
