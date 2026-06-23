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
                <strong>EPEC SOLUTIONS (PTY) LTD</strong>
                <div>Reg: 2012/118990/07 | VAT No: 4470275886</div>
                <div>259 Kent Avenue, Randburg, Johannesburg, Gauteng, 2194</div>
                <div>email: sales@epec.co.za | Phone: 065 835 4371</div>
              </div>
              <img src={logo} alt="Epec Solutions" style={{ display: 'block', maxHeight: '130px', width: 'auto' }} />
            </div>

            {/* Right: JOB CARD details + client box */}
            <div style={{ textAlign: 'right', fontSize: '0.75rem', lineHeight: '1.4' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '1px' }}>JOB CARD</div>

              <div style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600 }}>JOB CARD: </span>{jobCard.jobCardNumber}
              </div>
              <div style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600 }}>DATE: </span>{createdDate}
              </div>
              <div style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600 }}>QUOTE NUMBER: </span>{jobCard.quoteNumber}
              </div>
              <div style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600 }}>REFERENCE: </span>{jobCard.reference || '—'}
              </div>

              {/* Client box */}
              {displayClient ? (
                <div style={{ border: '1px solid #000', padding: '8px', marginTop: '10px', fontSize: '0.75rem', lineHeight: '1.4', textAlign: 'left', minWidth: '200px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>CLIENT:</div>
                  {displayClient.name && <div>{displayClient.name}</div>}
                  {displayClient.addressLine1 && <div>{displayClient.addressLine1}</div>}
                  {displayClient.addressLine2 && <div>{displayClient.addressLine2}</div>}
                  {displayClient.addressLine3 && <div>{displayClient.addressLine3}</div>}
                  {displayClient.addressLine4 && <div>{displayClient.addressLine4}</div>}
                  {displayClient.vatNumber && <div>VAT No: {displayClient.vatNumber}</div>}
                  {displayClient.email && <div>Email: {displayClient.email}</div>}
                  <div>Rep: {displayClient.representativeName || '—'}</div>
                  <div>Tel: {displayClient.representativeNumber || '—'}</div>
                </div>
              ) : (
                <div style={{ border: '1px solid #000', padding: '6px', marginTop: '10px', fontSize: '0.75rem', textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold' }}>CLIENT:</div>
                  <div>No client information available.</div>
                </div>
              )}
            </div>
          </div>

          {/* ── ITEMS TABLE ── Qty + Description only */}
          <div style={{ marginTop: '20px', border: '1px solid #000', borderRadius: '2px', overflow: 'hidden' }}>
            {/* Header */}
            <div className="jc-items-table-header" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', background: '#f3f4f6', borderBottom: '1px solid #000' }}>
              <div style={{ padding: '8px 10px', fontWeight: 'bold', fontSize: '0.8rem' }}>Qty</div>
              <div style={{ padding: '8px 10px', fontWeight: 'bold', fontSize: '0.8rem', borderLeft: '1px solid #ccc' }}>Description</div>
            </div>
            {/* Rows */}
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="jc-items-table-row" style={{ display: 'grid', gridTemplateColumns: '80px 1fr', borderTop: '1px solid #eee' }}>
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
              <strong>Description:</strong> {jobCard.description}
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

          {/* ── APPROVAL / SIGNATURE ── */}
          <div style={{ marginTop: '36px', fontSize: '0.8rem', lineHeight: '2.8' }}>
            <div style={{ borderBottom: '1px solid #000', marginBottom: '12px', paddingBottom: '4px' }}>
              Received and Approved by: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
            <div style={{ borderBottom: '1px solid #000', paddingBottom: '4px' }}>
              Signature &amp; Date: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </div>
          </div>

          {/* ── PAYMENT DETAILS ── */}
          <div style={{ marginTop: '28px', border: '0px solid #000', borderRadius: '2px', padding: '0', fontSize: '0.75rem', lineHeight: '1.6' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.8rem', letterSpacing: '0.5px' }}>PAYMENT DETAILS</div>
            <div>Bank: Nedbank</div>
            <div>Account Name: EPEC SOLUTIONS (PTY) LTD</div>
            <div>Account No: 1223326799</div>
            <div>Account Type: Cheque</div>
            <div>Branch Code: 198765</div>
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
