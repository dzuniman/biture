import React, { useMemo } from 'react';
import type { Statement, Invoice } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';

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
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: '2-digit' });
  };

  const client = statement.client || (statement as any).Client;
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

  const uniqueInvoiceIds = useMemo(() => Array.from(new Set(items.map((i: any) => i.invoiceId || i.InvoiceId))), [items]);

  const totalOutstanding = useMemo(() => {
    return uniqueInvoiceIds.reduce((sum, id) => {
      const invAmount = invoiceMap[id]?.amount ?? 0;
      return sum + (invAmount - (paymentsByInvoice[id] || 0));
    }, 0);
  }, [uniqueInvoiceIds, invoiceMap, paymentsByInvoice]);

  return (
    <div className="page-section">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print { .no-print { display: none !important; } .view-card { border: none !important; box-shadow: none !important; width: 100% !important; } }
        .view-card { background: white; padding: 40px; border: 1px solid #e5e7eb; border-radius: 8px; color: #000; }
        .view-header-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 0.9rem; }
        .items-table th { background: #f9fafb; border-bottom: 2px solid #111827; padding: 12px 8px; text-align: left; }
        .items-table td { padding: 12px 8px; border-bottom: 1px solid #e5e7eb; }
      ` }} />

      <div className="section-header no-print">
        <h2>View Statement</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onBack} className="btn-secondary">← Back</button>
          <button onClick={() => window.print()} className="btn-primary">Print Statement</button>
        </div>
      </div>

      <div className="view-card">
        <div className="view-header-grid">
          <div>
            <img src={logo} alt="Company Logo" style={{ height: '80px', marginBottom: '15px' }} />
            <div style={{ lineHeight: '1.4', fontSize: '0.85rem' }}>
              <strong>EPEC SOLUTIONS (PTY) LTD</strong><br />
              259 Kent Avenue, Randburg, 2194<br />
              VAT No: 4470275886 | email: sales@epec.co.za
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>STATEMENT OF ACCOUNT</h1>
            <div style={{ fontSize: '0.9rem' }}>
              <strong>Statement No:</strong> {statement.statementNumber || (statement as any).StatementNumber}<br />
              <strong>Date:</strong> {formatDate(statement.createdAt || (statement as any).CreatedAt)}<br />
              <strong>Vendor No:</strong> {client?.vendorNumber || (client as any).VendorNumber || '—'}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '40px', border: '1px solid #000', padding: '15px', width: '320px' }}>
          <strong style={{ fontSize: '0.75rem', color: '#666' }}>BILL TO:</strong><br />
          <div style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '5px' }}>{client?.name || '—'}</div>
          <div style={{ fontSize: '0.85rem', marginTop: '5px', lineHeight: '1.5' }}>
            {client?.addressLine1}<br />
            {client?.addressLine2}<br />
            {client?.addressLine3}
          </div>
        </div>

        <table className="items-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Invoice Due Date</th>
              <th>Vendor #</th>
              <th style={{ textAlign: 'right' }}>Invoice Amount</th>
              <th style={{ textAlign: 'right' }}>Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {uniqueInvoiceIds.map(id => {
              const inv = invoiceMap[id];
              const paid = paymentsByInvoice[id] || 0;
              const outstanding = (inv?.amount ?? 0) - paid;
              return (
                <tr key={id}>
                  <td>{inv?.invoiceNumber || '—'}</td>
                  <td>{formatDate(inv?.dueDate)}</td>
                  <td>{client?.vendorNumber || '—'}</td>
                  <td style={{ textAlign: 'right' }}>{formatAmount(inv?.amount ?? 0)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: outstanding > 0 ? '#dc2626' : '#22c55e' }}>
                    {formatAmount(outstanding)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <div style={{ width: '300px', borderTop: '2px solid #000', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
              <strong>Total Outstanding:</strong>
              <strong style={{ color: totalOutstanding > 0 ? '#dc2626' : '#22c55e' }}>{formatAmount(totalOutstanding)}</strong>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '50px', fontSize: '0.8rem', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <strong>PAYMENT DETAILS:</strong><br />
          Bank: Nedbank | Account Name: EPEC SOLUTIONS (PTY) LTD<br />
          Account No: 1223326799 | Branch Code: 198765
        </div>
      </div>
    </div>
  );
};
