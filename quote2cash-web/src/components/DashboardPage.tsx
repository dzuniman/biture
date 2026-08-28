import React, { useState, useMemo } from 'react';
import { formatAmount } from '../../formatters';
import type {
  Client,
  Quote,
  Invoice,
  Statement,
  JobCard,
  DeliveryNote,
  CreditNote,
  Product,
  Tool,
  Cost
} from '../types';

export type DashboardEntityFilter =
  | 'all'
  | 'clients'
  | 'quotes'
  | 'invoices'
  | 'statements'
  | 'jobcards'
  | 'deliverynotes'
  | 'creditnotes';

interface Props {
  clients: Client[];
  quotes: Quote[];
  invoices: Invoice[];
  statements: Statement[];
  jobCards: JobCard[];
  deliveryNotes: DeliveryNote[];
  creditNotes: CreditNote[];
  products: Product[];
  tools: Tool[];
  costs: Cost[];
  onNavigate: (section: string, view?: string, item?: any) => void;
}

export default function DashboardPage({
  clients,
  quotes,
  invoices,
  statements,
  jobCards,
  deliveryNotes,
  creditNotes,
  products,
  tools,
  costs,
  onNavigate
}: Props) {
  const [selectedEntity, setSelectedEntity] = useState<DashboardEntityFilter>('all');

  // Compute Core Metrics
  const totalQuoteValue = useMemo(() => quotes.reduce((acc, q) => acc + (q.total || 0), 0), [quotes]);
  const totalInvoiceValue = useMemo(() => invoices.reduce((acc, i) => acc + (i.amount || 0), 0), [invoices]);

  const paidInvoices = useMemo(() => invoices.filter(i => (i.status || '').toLowerCase() === 'paid'), [invoices]);
  const overdueInvoices = useMemo(() => invoices.filter(i => (i.status || '').toLowerCase() === 'overdue' || i.isOverdue), [invoices]);
  const pendingInvoices = useMemo(() => invoices.filter(i => (i.status || '').toLowerCase() !== 'paid'), [invoices]);

  const totalPaymentsRecorded = useMemo(() => {
    return statements.reduce((acc, s) => {
      const items = (s as any).items || (s as any).Items || [];
      return acc + items.reduce((sum: number, item: any) => sum + (Number(item.paymentAmount || item.PaymentAmount) || 0), 0);
    }, 0);
  }, [statements]);

  const totalOutstanding = useMemo(() => {
    return pendingInvoices.reduce((acc, i) => acc + (i.amount || 0), 0);
  }, [pendingInvoices]);

  const collectionEfficiency = totalInvoiceValue > 0 ? (totalPaymentsRecorded / totalInvoiceValue) * 100 : 0;

  const totalCreditNotesValue = useMemo(() => creditNotes.reduce((acc, c) => acc + (c.amount || 0), 0), [creditNotes]);

  return (
    <div className="page-section" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#e6e6e6' }}>DASHBOARD</h2>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
            Operations, operational metrics, and financials
          </p>
        </div>

        {/* Entity Focus Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.9rem' }}>Entity:</span>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value as DashboardEntityFilter)}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: '2px solid #38bdf8',
              background: '#0f172a',
              color: 'white',
              fontWeight: 300,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(56,189,248,0.15)'
            }}
          >
            <option value="all">🌐 Overview (All Business Data)</option>
            <option value="clients">👥 Clients ({clients.length})</option>
            <option value="quotes">📄 Quotes ({quotes.length})</option>
            <option value="invoices">💳 Invoices ({invoices.length})</option>
            <option value="statements">📑 Statements ({statements.length})</option>
            <option value="jobcards">🛠 Job Cards ({jobCards.length})</option>
            <option value="deliverynotes">🚚 Delivery Notes ({deliveryNotes.length})</option>
            <option value="creditnotes">🏷 Credit Notes ({creditNotes.length})</option>
          </select>
        </div>
      </div>

      {/* Dynamic Metric Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}
      >
        {/* Card 1 */}
        <div
          style={{
            background: 'white',
            padding: '22px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            borderTop: '5px solid #3b82f6',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {selectedEntity === 'clients' ? 'Total Active Clients' : selectedEntity === 'quotes' ? 'Total Quoted Pipeline' : 'Total Quoted Pipeline'}
          </span>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            {selectedEntity === 'clients' ? clients.length : formatAmount(totalQuoteValue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
            {selectedEntity === 'clients' ? `${clients.filter(c => c.vatNumber).length} VAT registered clients` : `${quotes.length} total active quotations`}
          </div>
        </div>

        {/* Card 2 */}
        <div
          style={{
            background: 'white',
            padding: '22px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            borderTop: '5px solid #10b981',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {selectedEntity === 'jobcards' ? 'Active Job Cards' : selectedEntity === 'deliverynotes' ? 'Delivery Dispatches' : 'Billed Revenue'}
          </span>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            {selectedEntity === 'jobcards' ? jobCards.length : selectedEntity === 'deliverynotes' ? deliveryNotes.length : formatAmount(totalInvoiceValue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
            {selectedEntity === 'jobcards' ? 'Issued work & job orders' : selectedEntity === 'deliverynotes' ? 'Completed delivery notes' : `${invoices.length} total invoices created`}
          </div>
        </div>

        {/* Card 3 */}
        <div
          style={{
            background: 'white',
            padding: '22px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            borderTop: '5px solid #8b5cf6',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cash Collected
          </span>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>
            {formatAmount(totalPaymentsRecorded)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
            {collectionEfficiency.toFixed(1)}% collection efficiency rate
          </div>
        </div>

        {/* Card 4 */}
        <div
          style={{
            background: 'white',
            padding: '22px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            borderTop: '5px solid #ef4444',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {selectedEntity === 'creditnotes' ? 'Total Credit Notes' : 'Pending Receivables'}
          </span>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#ef4444', marginTop: '8px' }}>
            {selectedEntity === 'creditnotes' ? formatAmount(totalCreditNotesValue) : formatAmount(totalOutstanding)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
            {selectedEntity === 'creditnotes' ? `${creditNotes.length} issued credit adjustments` : `${overdueInvoices.length} overdue invoices pending`}
          </div>
        </div>
      </div>

      {/* Main Grid View Based on Selected Entity Focus */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Left Column Widget */}
        {(selectedEntity === 'all' || selectedEntity === 'invoices' || selectedEntity === 'statements') && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
                Recent Payment Collections ({statements.length})
              </h3>
              <button
                onClick={() => onNavigate('statements')}
                style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                View Statements
              </button>
            </div>
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {statements.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No payment statements recorded yet</div>
              ) : (
                statements.slice(0, 6).map(s => {
                  const items = (s as any).items || (s as any).Items || [];
                  const stTotal = items.reduce((sum: number, i: any) => sum + (Number(i.paymentAmount || i.PaymentAmount) || 0), 0);
                  const clientName = (s as any).client?.name || 'Client';
                  return (
                    <div
                      key={s.id}
                      onClick={() => onNavigate('statements', 'view', s)}
                      style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>Statement #{s.statementNumber}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{clientName}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>+{formatAmount(stTotal)}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(s.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Column Widget: Invoices */}
        {(selectedEntity === 'all' || selectedEntity === 'invoices') && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
                Latest Invoices ({invoices.length})
              </h3>
              <button
                onClick={() => onNavigate('invoices')}
                style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Manage Invoices
              </button>
            </div>
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {invoices.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No invoices found</div>
              ) : (
                invoices.slice(0, 6).map(inv => (
                  <div
                    key={inv.id}
                    onClick={() => onNavigate('invoices', 'view', inv)}
                    style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '3px 7px',
                          borderRadius: '4px',
                          marginRight: '8px',
                          textTransform: 'uppercase',
                          background: inv.status?.toLowerCase() === 'paid' ? '#dcfce7' : inv.status?.toLowerCase() === 'overdue' ? '#fee2e2' : '#f1f5f9',
                          color: inv.status?.toLowerCase() === 'paid' ? '#166534' : inv.status?.toLowerCase() === 'overdue' ? '#991b1b' : '#475569'
                        }}
                      >
                        {inv.status || 'Draft'}
                      </span>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>#{inv.invoiceNumber}</span>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{inv.client?.name || inv.quote?.client?.name || 'Client'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{formatAmount(inv.amount)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : ''}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Quotes Widget */}
        {(selectedEntity === 'all' || selectedEntity === 'quotes') && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
                Active Quotes ({quotes.length})
              </h3>
              <button
                onClick={() => onNavigate('quotes')}
                style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Manage Quotes
              </button>
            </div>
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {quotes.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No quotes available</div>
              ) : (
                quotes.slice(0, 6).map(q => (
                  <div
                    key={q.id}
                    onClick={() => onNavigate('quotes', 'view', q)}
                    style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>#{q.quoteNumber}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{q.client?.name || 'Client'} — {q.reference}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{formatAmount(q.total)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(q.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Clients Focus Widget */}
        {(selectedEntity === 'all' || selectedEntity === 'clients') && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
                Client Directory ({clients.length})
              </h3>
              <button
                onClick={() => onNavigate('clients')}
                style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Manage Clients
              </button>
            </div>
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {clients.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No clients recorded</div>
              ) : (
                clients.slice(0, 6).map(c => (
                  <div
                    key={c.id}
                    onClick={() => onNavigate('clients', 'view', c)}
                    style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Vendor #: {c.vendorNumber || 'N/A'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: c.vatNumber ? '#e0f2fe' : '#f1f5f9', color: c.vatNumber ? '#0369a1' : '#64748b', fontWeight: 700 }}>
                        {c.vatNumber ? `VAT: ${c.vatNumber}` : 'No VAT'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Job Cards Widget */}
        {(selectedEntity === 'all' || selectedEntity === 'jobcards') && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
                Job Cards Overview ({jobCards.length})
              </h3>
              <button
                onClick={() => onNavigate('jobcards')}
                style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Manage Job Cards
              </button>
            </div>
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {jobCards.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No job cards found</div>
              ) : (
                jobCards.slice(0, 6).map(jc => (
                  <div
                    key={jc.id}
                    onClick={() => onNavigate('jobcards', 'view', jc)}
                    style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>Job Card #{jc.jobCardNumber}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Quote #{jc.quoteNumber} - {jc.reference}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(jc.createdAt).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Delivery Notes Widget */}
        {(selectedEntity === 'all' || selectedEntity === 'deliverynotes') && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
                Delivery Notes ({deliveryNotes.length})
              </h3>
              <button
                onClick={() => onNavigate('deliverynotes')}
                style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Manage Delivery Notes
              </button>
            </div>
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {deliveryNotes.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No delivery notes found</div>
              ) : (
                deliveryNotes.slice(0, 6).map(dn => (
                  <div
                    key={dn.id}
                    onClick={() => onNavigate('deliverynotes', 'view', dn)}
                    style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>Delivery Note #{dn.deliveryNoteNumber}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Quote #{dn.quoteNumber} - {dn.reference}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(dn.createdAt).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Credit Notes Widget */}
        {(selectedEntity === 'all' || selectedEntity === 'creditnotes') && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
                Credit Notes ({creditNotes.length})
              </h3>
              <button
                onClick={() => onNavigate('creditnotes')}
                style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6', background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Manage Credit Notes
              </button>
            </div>
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {creditNotes.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>No credit notes found</div>
              ) : (
                creditNotes.slice(0, 6).map(cn => (
                  <div
                    key={cn.id}
                    onClick={() => onNavigate('creditnotes', 'view', cn)}
                    style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>Credit Note #{cn.creditNoteNumber}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{cn.client?.name || 'Client'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.95rem' }}>-{formatAmount(cn.amount)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(cn.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
