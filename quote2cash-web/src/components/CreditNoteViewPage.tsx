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
                <strong>EPEC SOLUTIONS (PTY) LTD</strong>
                <div>Reg: 2012/118990/07 | VAT No: 4470275886</div>
                <div>259 Kent Avenue, Randburg, Johannesburg, Gauteng, 2194</div>
                <div>email: sales@epec.co.za | Phone: 065 835 4371</div>
              </div>
              <img src={logo} alt="Epec Solutions" style={{ display: 'block', maxHeight: '130px', width: 'auto' }} />
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

          {/* ── APPROVAL / SIGNATURE ── */}
          <div style={{ marginBottom: '8px', fontSize: '0.8rem', marginTop: '40px' }}>
            Issued and Approved by: __________________________________________________________
          </div>
          <div className="print-only" style={{ height: '20px' }}></div>
          <div style={{ marginBottom: '15px', fontSize: '0.8rem' }}>
            Signature: ____________________________________________________________________________
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
