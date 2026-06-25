import React, { useMemo } from 'react';
import type { Statement, Invoice, Client } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';
import { generateStatementPDF } from './StatementPdfGenerator';

interface Props {
  statement: Statement;
  invoices: Invoice[];
  onEdit: () => void;
  onBack: () => void;
}

export const StatementViewPage: React.FC<Props> = ({ statement, invoices, onEdit, onBack }) => {
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

  const client: Client | null = statement.client || (statement as any).Client;
  const items = statement.items || (statement as any).Items || [];

  const invoiceMap = useMemo(() => {
    const map: Record<string, Invoice> = {};
    invoices.forEach(inv => { map[inv.id] = inv; });
    return map;
  }, [invoices]);

  const paymentsByInvoice = useMemo(() => {
    const totals: Record<string, number> = {};
    items.forEach((item: any) => {
      const id = item.invoiceId || item.InvoiceId;
      totals[id] = (totals[id] || 0) + (item.paymentAmount || item.PaymentAmount || 0);
    });
    return totals;
  }, [items]);

  const uniqueInvoiceIds = useMemo(() => Array.from(new Set(items.map((i: any) => i.invoiceId || i.InvoiceId))) as string[], [items]);

  const totalOutstanding = useMemo(() => {
    return uniqueInvoiceIds.reduce((sum, id) => {
      const invAmount = invoiceMap[id]?.amount ?? 0;
      return sum + (invAmount - (paymentsByInvoice[id] || 0));
    }, 0);
  }, [uniqueInvoiceIds, invoiceMap, paymentsByInvoice]);

  // Aging Analysis Calculations
  const agingBuckets = useMemo(() => {
    let current = 0;
    let overdue30 = 0;
    let overdue60 = 0;
    let overdue90 = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    uniqueInvoiceIds.forEach(id => {
      const inv = invoiceMap[id];
      if (!inv) return;

      const paid = paymentsByInvoice[id] || 0;
      const outstanding = (inv?.amount ?? 0) - paid;
      if (outstanding <= 0) return;

      const dueDate = new Date(inv.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        current += outstanding;
      } else if (diffDays >= 30 && diffDays < 60) {
        overdue30 += outstanding;
      } else if (diffDays >= 60 && diffDays < 90) {
        overdue60 += outstanding;
      } else {
        overdue90 += outstanding;
      }
    });

    return { current, overdue30, overdue60, overdue90 };
  }, [uniqueInvoiceIds, invoiceMap, paymentsByInvoice]);

  const handleDownloadPdf = async () => {
    try {
      await generateStatementPDF(statement, invoices);
    } catch (error) {
      console.error("Error generating Statement PDF:", error);
      alert("Failed to generate PDF. Please try again.");
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
          .view-container, .view-card, .view-section, .items-table, .items-table-header, .items-table-row, .summary-row { border: none !important; box-shadow: none !important; background: none !important; }
          .view-card { padding: 20px !important; width: 100% !important; margin: 0 !important; font-size: 9pt !important; display: flex !important; flex-direction: column !important; min-height: 26.7cm !important; box-sizing: border-box !important; }
          .items-table-header, .items-table-row { display: grid !important; grid-template-columns: 120px 140px 100px 1fr 120px !important; gap: 4px !important; }
          .items-table-header div, .items-table-row div { border-left: 0.5pt solid #ccc !important; padding: 6px !important; }
          .items-table-header div:last-child, .items-table-row div:last-child { border-right: 0.5pt solid #ccc !important; }
          .aging-table-header, .aging-table-row { display: grid !important; grid-template-columns: 1fr 1fr 1fr 1fr !important; gap: 4px !important; }
          .aging-table-header div, .aging-table-row div { border-left: 0.5pt solid #ccc !important; padding: 6px !important; }
          .aging-table-header div:last-child, .aging-table-row div:last-child { border-right: 0.5pt solid #ccc !important; }
          @page { size: A4; margin: 1.5cm 1cm; }
        }
      ` }} />
      <div className="section-header no-print">
        <div>
          <h2>{statement.statementNumber || (statement as any).StatementNumber}</h2>
          <p>Statement details for {client?.name ?? 'selected client'}</p>
        </div>
        <div>
          <button onClick={onBack} className="btn-secondary no-print">
            ← Back to Statements
          </button>
        </div>
      </div>
      <div className="view-container">
        <div className="view-card" style={{ color: '#000', display: 'flex', flexDirection: 'column', minHeight: '29.7cm', boxSizing: 'border-box' }}>
          <div className="quote-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', marginBottom: '18px' }}>
            <div className="quote-view-left" style={{ minWidth: '280px' }}>
              <div className="company-block">
                <div className="company-lines" style={{ fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong>EPEC SOLUTIONS (PTY) LTD</strong>
                  <div>Reg: 2012/118990/07 | VAT No: 4470275886</div>
                  <div>259 Kent Avenue, Randburg, Johannesburg, Gauteng, 2194</div>
                  <div>email: sales@epec.co.za | Phone: 065 835 4371</div>
                </div>
                <img src={logo} alt="Epec Solutions" className="company-logo" style={{ display: 'block', maxHeight: '130px', width: 'auto', minHeight: '30px' }} />
              </div>
            </div>
            <div className="quote-view-right" style={{ textAlign: 'right', fontSize: '0.75rem', lineHeight: '1' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1px', lineHeight: '1' }}>STATEMENT OF ACCOUNT</div>
              <div className="quote-details-block" style={{ fontSize: '0.75rem', lineHeight: '0', marginBottom: '2px' }}>
                <div className="view-row" style={{ marginBottom: '1px' }}>
                  <span className="view-label">STATEMENT NO:</span>
                  <span className="view-value">{statement.statementNumber || (statement as any).StatementNumber}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '1px' }}>
                  <span className="view-label">STATEMENT DATE:</span>
                  <span className="view-value">{formatDate(statement.createdAt || (statement as any).CreatedAt)}</span>
                </div>
                <div className="view-row" style={{ marginBottom: '1px' }}>
                  <span className="view-label">VENDOR NUMBER:</span>
                  <span className="view-value">{uniqueInvoiceIds.map(id => invoiceMap[id]?.client?.vendorNumber).find(p => !!p) || '—'}</span>
                </div>
                {client ? (
                  <div className="customer-box" style={{ border: '1px solid #000', padding: '8px', marginTop: '8px', fontSize: '0.75rem', lineHeight: '1.4', minHeight: '80px', textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>BILL TO:</div>
                    {client.name && <div style={{ marginBottom: '2px' }}>{client.name}</div>}
                    {client.addressLine1 && <div style={{ marginBottom: '2px' }}>{client.addressLine1}</div>}
                    {client.addressLine2 && <div style={{ marginBottom: '2px' }}>{client.addressLine2}</div>}
                    {client.addressLine3 && <div style={{ marginBottom: '2px' }}>{client.addressLine3}</div>}
                    {client.addressLine4 && <div style={{ marginBottom: '2px' }}>{client.addressLine4}</div>}
                    {client.vatNumber && <div style={{ marginBottom: '2px' }}>VAT No: {client.vatNumber}</div>}
                    {client.email && <div style={{ marginBottom: '2px' }}>Email: {client.email}</div>}
                    <div style={{ marginBottom: '2px' }}>{client.representativeName || '—'}</div>
                    <div style={{ marginBottom: '2px' }}>{client.representativeNumber || '—'}</div>
                  </div>
                ) : (
                  <div className="customer-box" style={{ border: '1px solid #000', padding: '6px', marginTop: '8px', fontSize: '0.75rem', textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold' }}>BILL TO:</div>
                    <div>No client information available.</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="view-section" style={{ marginTop: '24px' }}>
            <div className="items-table" style={{ border: '1px solid #000', borderRadius: '2px', overflow: 'hidden' }}>
              <div className="items-table-header" style={{ display: 'grid', gridTemplateColumns: '120px 140px 140px 100px 1fr 120px', gap: '0', background: '#f3f4f6', borderBottom: '1px solid #000', padding: '0' }}>
                <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>Document No</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>Due Date</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>Account Type</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>PO Number</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'right' }}>Invoice Amount</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold', textAlign: 'right' }}>Outstanding</div>
              </div>
              {uniqueInvoiceIds.length > 0 ? (
                uniqueInvoiceIds.map(id => {
                  const inv = invoiceMap[id];
                  const paid = paymentsByInvoice[id] || 0;
                  const outstanding = (inv?.amount ?? 0) - paid;
                  return (
                    <div key={id} className="items-table-row" style={{ display: 'grid', gridTemplateColumns: '120px 140px 140px 100px 1fr 120px', gap: '0', borderTop: '1px solid #eee' }}>
                      <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{inv?.invoiceNumber || '—'}</div>
                      <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{formatDate(inv?.dueDate)}</div>
                      <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{inv?.description || '—'}</div>
                      <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{inv?.quote?.poNumber || '—'}</div>
                      <div style={{ padding: '8px 6px', textAlign: 'right', lineHeight: '1.2' }}>{formatAmount(inv?.amount ?? 0)}</div>
                      <div style={{ padding: '8px 6px', textAlign: 'right', lineHeight: '1.2', fontWeight: 'bold', color: outstanding > 0 ? '#dc2626' : '#22c55e' }}>{formatAmount(outstanding)}</div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '16px' }}>No items available.</div>
              )}
            </div>
          </div>

          <div className="view-section" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '20px' }}>
            <div style={{ width: '250px' }}>
              <div className="summary-row" style={{ lineHeight: '0', display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem' }}>
                <span>Total Outstanding</span>
                <strong style={{ color: totalOutstanding > 0 ? '#dc2626' : '#22c55e' }}>{formatAmount(totalOutstanding)}</strong>
              </div>
            </div>
          </div>

          {/* Aging Analysis section */}
          <div className="view-section" style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #000', paddingBottom: '4px' }}>PAYMENT ANALYSIS</h3>
            <div style={{ border: '1px solid #000', borderRadius: '2px', overflow: 'hidden' }}>
              <div className="aging-table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: '#f3f4f6', borderBottom: '1px solid #000', padding: '0', textAlign: 'right' }}>
                <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>Current</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>30 Days Overdue</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>60 Days Overdue</div>
                <div style={{ padding: '8px 6px', fontWeight: 'bold' }}>90+ Days Overdue</div>
              </div>
              <div className="aging-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0', textAlign: 'right' }}>
                <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{formatAmount(agingBuckets.current)}</div>
                <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{formatAmount(agingBuckets.overdue30)}</div>
                <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{formatAmount(agingBuckets.overdue60)}</div>
                <div style={{ padding: '8px 6px', lineHeight: '1.2' }}>{formatAmount(agingBuckets.overdue90)}</div>
              </div>
            </div>
          </div>

          <div className="view-section" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ border: '0px solid #000', borderRadius: '2px', padding: '12px', fontSize: '0.75rem', lineHeight: '1.4' }}>
              <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>PAYMENT DETAILS</div>
              <div>Bank: Nedbank</div>
              <div>Account Name: EPEC SOLUTIONS (PTY) LTD</div>
              <div>Account No: 1223326799</div>
              <div>Account Type: Cheque</div>
              <div>Branch Code: 198765</div>
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '20px' }}>
            <button type="button" onClick={onEdit} className="btn-primary">
              Edit Statement
            </button>
            <button type="button" onClick={handleDownloadPdf} className="btn-secondary">
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
