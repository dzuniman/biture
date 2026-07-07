import { formatAmount } from '../../formatters';
import type { CreditNote, Client } from '../types';
import logo from '../assets/logo.png';
import { generateCreditNotePDF } from './CreditNotePdfGenerator';
import { getCreditNote } from '../api';

interface Props {
  creditNote: CreditNote;
  onEdit: () => void;
  onBack: () => void;
}

export default function CreditNoteViewPage({ creditNote, onEdit, onBack }: Props) {
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

  const createdDate = formatDate(creditNote.createdAt);
  const displayClient: Client | null | undefined = creditNote.client;

  const handleDownloadPdf = async () => {
    try {
      const fullCreditNote = await getCreditNote(creditNote.id);
      generateCreditNotePDF(fullCreditNote);
    } catch (error) {
      console.error('Error fetching credit note data for PDF:', error);
      alert('Failed to fetch credit note data for PDF generation. Please try again.');
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
          @page { size: A4; margin: 1.5cm 1cm; }
        }
      ` }} />

      {/* Page header (screen only) */}
      <div className="section-header no-print">
        <div>
          <h2>{creditNote.creditNoteNumber}</h2>
          <p>Credit Note for {displayClient?.name || 'selected client'}</p>
        </div>
        <button onClick={onBack} className="btn-secondary no-print">
          ← Back to Credit Notes
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

            {/* Right: CREDIT NOTE details + client box */}
            <div style={{ textAlign: 'right', fontSize: '0.75rem', lineHeight: '1.4' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '1px' }}>CREDIT NOTE</div>

              <div style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600 }}>CREDIT NOTE NUMBER: </span>{creditNote.creditNoteNumber}
              </div>
              <div style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600 }}>DATE: </span>{createdDate}
              </div>

              {/* Client box */}
              {displayClient ? (
                <div style={{ border: '1px solid #000', padding: '8px', marginTop: '10px', fontSize: '0.75rem', lineHeight: '1.4', minWidth: '200px', textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>BILL TO:</div>
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

          {/* ── CREDIT NOTE SUMMARY TABLE ── */}
          <div style={{ marginTop: '20px', border: '1px solid #000', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', background: '#f3f4f6', borderBottom: '1px solid #000' }}>
              <div style={{ padding: '8px 10px', fontWeight: 'bold', fontSize: '0.8rem' }}>Description</div>
              <div style={{ padding: '8px 10px', fontWeight: 'bold', fontSize: '0.8rem', borderLeft: '1px solid #ccc', textAlign: 'right' }}>Amount</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', borderTop: '1px solid #eee' }}>
              <div style={{ padding: '12px 10px', fontSize: '0.8rem', lineHeight: '1.4' }}>
                {creditNote.description || 'Client Credit Note Adjustment'}
              </div>
              <div style={{ padding: '12px 10px', fontSize: '0.8rem', borderLeft: '1px solid #eee', textAlign: 'right', fontWeight: 'bold' }}>
                {formatAmount(creditNote.amount)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', marginBottom: '40px' }}>
            <div style={{ width: '250px', fontSize: '0.85rem', borderTop: '1.5px solid #000', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Total Credited:</span>
                <span>{formatAmount(creditNote.amount)}</span>
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
          <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '40px' }}>
            <button type="button" onClick={onEdit} className="btn-primary">
              Edit Credit Note
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
