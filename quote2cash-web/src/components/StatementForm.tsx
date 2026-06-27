import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import type { Invoice, Client, CreditNote } from '../types';
import { formatAmount } from '../../formatters';
import { getStatementNextNumber, createStatement, updateStatement } from '../api';

interface StatementItem {
  id?: string;
  invoiceId?: string | null;
  creditNoteId?: string | null;
  invoiceNumber: string;
  paymentAmount: number;
  description: string;
  paymentDate: string;
  itemType: 'invoice' | 'creditnote';
}

interface Props {
  invoices: Invoice[];
  clients: Client[];
  creditNotes: CreditNote[];
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const StatementForm: React.FC<Props> = ({ invoices, clients, creditNotes, initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    statementNumber: initialData?.statementNumber || initialData?.StatementNumber || '',
    dueDays: initialData?.dueDays || initialData?.dueDays || '',
    clientId: initialData?.clientId || initialData?.ClientId || '',
  });

  const [items, setItems] = useState<StatementItem[]>(() => {
    const rawItems = initialData?.items || initialData?.Items;
    if (rawItems) {
      return rawItems.map((item: any) => ({
        id: item.id || item.Id,
        invoiceId: item.invoiceId || item.InvoiceId || null,
        creditNoteId: item.creditNoteId || item.CreditNoteId || null,
        invoiceNumber: item.invoiceNumber || item.InvoiceNumber || '',
        paymentAmount: item.paymentAmount || item.PaymentAmount || 0,
        description: item.description || item.Description || '',
        paymentDate: (item.paymentDate || item.PaymentDate)
          ? (item.paymentDate || item.PaymentDate).slice(0, 10)
          : new Date().toISOString().split('T')[0],
        itemType: (item.creditNoteId || item.CreditNoteId) ? 'creditnote' : 'invoice'
      }));
    }
    return [{ invoiceId: '', creditNoteId: null, invoiceNumber: '', paymentAmount: 0, description: '', paymentDate: new Date().toISOString().split('T')[0], itemType: 'invoice' as const }];
  });

  useEffect(() => {
    if (!initialData && !formData.statementNumber) {
      getStatementNextNumber().then(num => setFormData(prev => ({ ...prev, statementNumber: num })));
    }
  }, [initialData]);

  const filteredInvoices = useMemo(() => {
    const cid = formData.clientId;
    if (!cid) return [];
    return invoices.filter(inv => (inv as any).clientId === cid || inv.client?.id === cid);
  }, [invoices, formData.clientId]);

  const filteredCreditNotes = useMemo(() => {
    const cid = formData.clientId;
    if (!cid) return [];
    return creditNotes.filter(cn => cn.clientId === cid);
  }, [creditNotes, formData.clientId]);

  const invoiceMap = useMemo(() => {
    const map: Record<string, Invoice> = {};
    invoices.forEach(inv => { map[inv.id] = inv; });
    return map;
  }, [invoices]);

  const creditNoteMap = useMemo(() => {
    const map: Record<string, CreditNote> = {};
    creditNotes.forEach(cn => { map[cn.id] = cn; });
    return map;
  }, [creditNotes]);

  const paymentsByInvoice = useMemo(() => {
    const totals: Record<string, number> = {};
    items.forEach(item => {
      if (item.itemType === 'invoice' && item.invoiceId) {
        totals[item.invoiceId] = (totals[item.invoiceId] || 0) + Number(item.paymentAmount);
      }
    });
    return totals;
  }, [items]);

  const totalOutstanding = useMemo(() => {
    let outstanding = 0;
    // Sum up invoice outstanding amounts
    const uniqueInvoiceIds = Array.from(new Set(items.filter(i => i.itemType === 'invoice' && i.invoiceId).map(i => i.invoiceId as string)));
    uniqueInvoiceIds.forEach(id => {
      const invAmount = invoiceMap[id]?.amount ?? 0;
      const totalPaid = paymentsByInvoice[id] || 0;
      outstanding += invAmount - totalPaid;
    });
    // Subtract credit note amounts
    items.filter(i => i.itemType === 'creditnote' && i.creditNoteId).forEach(item => {
      const cn = creditNoteMap[item.creditNoteId!];
      outstanding -= cn?.amount ?? 0;
    });
    return outstanding;
  }, [items, invoiceMap, paymentsByInvoice, creditNoteMap]);

  const handleAddItem = () => {
    setItems([...items, { invoiceId: '', creditNoteId: null, invoiceNumber: '', paymentAmount: 0, description: '', paymentDate: new Date().toISOString().split('T')[0], itemType: 'invoice' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    let updatedItem = { ...newItems[index], [field]: value };

    if (field === 'invoiceId') {
      // User selected an invoice
      const inv = invoices.find(i => i.id === value);
      updatedItem.invoiceNumber = inv?.invoiceNumber ?? '';
      updatedItem.paymentAmount = Number(inv?.amount ?? 0);
      updatedItem.creditNoteId = null;
      updatedItem.itemType = 'invoice';
    } else if (field === 'creditNoteId') {
      // User selected a credit note
      const cn = creditNotes.find(c => c.id === value);
      updatedItem.invoiceNumber = cn?.creditNoteNumber ?? '';
      updatedItem.paymentAmount = cn?.amount ?? 0;
      updatedItem.invoiceId = null;
      updatedItem.itemType = 'creditnote';
    }

    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const handleDocumentSelect = (index: number, value: string) => {
    if (value.startsWith('invoice:')) {
      updateItem(index, 'invoiceId', value.replace('invoice:', ''));
    } else if (value.startsWith('creditnote:')) {
      updateItem(index, 'creditNoteId', value.replace('creditnote:', ''));
    }
  };

  const getDocumentSelectValue = (item: StatementItem): string => {
    if (item.itemType === 'creditnote' && item.creditNoteId) return `creditnote:${item.creditNoteId}`;
    if (item.invoiceId) return `invoice:${item.invoiceId}`;
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) return alert("Please select a client.");
    if (items.some(i => !i.invoiceId && !i.creditNoteId)) return alert("Please select an invoice or credit note for all rows.");

    try {
      const payload = {
        statementNumber: formData.statementNumber,
        dueDays: formData.dueDays,
        clientId: formData.clientId,
        items: items.map(item => ({
          invoiceId: item.itemType === 'invoice' ? item.invoiceId : null,
          creditNoteId: item.itemType === 'creditnote' ? item.creditNoteId : null,
          description: item.description,
          paymentDate: item.paymentDate,
          paymentAmount: Number(item.paymentAmount)
        }))
      };

      const id = initialData?.id || initialData?.Id;
      if (id) {
        await updateStatement(id, payload);
      } else {
        await createStatement(payload);
      }
      onSuccess();
    } catch (err) {
      console.error('API Error details:', axios.isAxiosError(err) ? err.response?.data : err);
      alert(`Failed to save: ${axios.isAxiosError(err) ? (err.response?.data?.message || "Check console") : "Connection error"}`);
    }
  };

  return (
    <div className="card">
      <h2>{initialData ? 'Edit Statement' : 'New Payment Statement'}</h2>
      <form onSubmit={handleSubmit} className="simple-form">
        <div className="grid-2">
          <label>
            Statement Number
            <input type="text" required value={formData.statementNumber} onChange={e => setFormData({...formData, statementNumber: e.target.value})} />
          </label>
          <label>
            Client
            <select required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>
              <option value="">-- Select Client --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div className="grid-2">
          <label>
            Due (Days)
            <input type="number" required value={formData.dueDays} onChange={e => setFormData({...formData, dueDays: e.target.value})} />
          </label>
        </div>
        <div className="line-items" style={{ marginTop: '20px' }}>
          <div className="section-title">
            <h3>Statement Items</h3>
            <button type="button" className="secondary" onClick={handleAddItem}>+ Add Item</button>
          </div>
          <div className="items-grid">
            <div className="item-row header" style={{ gridTemplateColumns: '150px 200px 110px 1fr 100px 110px 40px' }}>
              <span>Date</span>
              <span>Invoice / Credit Note</span>
              <span style={{ textAlign: 'right' }}>Doc. Total</span>
              <span>Description</span>
              <span style={{ textAlign: 'right' }}>Payment</span>
              <span style={{ textAlign: 'right' }}>Outstanding</span>
              <span />
            </div>
            {items.map((item, index) => {
              let docAmount = 0;
              let currentOutstanding = 0;

              if (item.itemType === 'invoice' && item.invoiceId) {
                docAmount = invoiceMap[item.invoiceId]?.amount ?? 0;
                currentOutstanding = docAmount - (paymentsByInvoice[item.invoiceId] || 0);
              } else if (item.itemType === 'creditnote' && item.creditNoteId) {
                docAmount = creditNoteMap[item.creditNoteId]?.amount ?? 0;
                currentOutstanding = -docAmount; // Credit notes reduce outstanding
              }

              return (
                <div key={index} className="item-row" style={{ gridTemplateColumns: '150px 200px 110px 1fr 100px 110px 40px' }}>
                  <input type="date" required value={item.paymentDate} onChange={e => updateItem(index, 'paymentDate', e.target.value)} />
                  <select required value={getDocumentSelectValue(item)} onChange={e => handleDocumentSelect(index, e.target.value)}>
                    <option value="">-- Select --</option>
                    {filteredInvoices.length > 0 && (
                      <optgroup label="Invoices">
                        {filteredInvoices.map(inv => <option key={inv.id} value={`invoice:${inv.id}`}>{inv.invoiceNumber}</option>)}
                      </optgroup>
                    )}
                    {filteredCreditNotes.length > 0 && (
                      <optgroup label="Credit Notes">
                        {filteredCreditNotes.map(cn => <option key={cn.id} value={`creditnote:${cn.id}`}>{cn.creditNoteNumber}</option>)}
                      </optgroup>
                    )}
                  </select>
                  <span style={{ textAlign: 'right' }}>{formatAmount(docAmount)}</span>
                  <input type="text" required value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} />
                  <input
                    type="number"
                    step="0.01"
                    value={item.paymentAmount}
                    disabled={item.itemType === 'creditnote'}
                    style={item.itemType === 'creditnote' ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                    onChange={e => updateItem(index, 'paymentAmount', e.target.value)}
                  />
                  <span style={{ textAlign: 'right', fontWeight: 'bold', color: currentOutstanding > 0 ? '#dc2626' : currentOutstanding < 0 ? '#10b981' : '#22c55e' }}>
                    {formatAmount(currentOutstanding)}
                  </span>
                  <button type="button" className="danger small" onClick={() => handleRemoveItem(index)}>−</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-summary" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <div style={{ width: '300px', borderTop: '2px solid #334155', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
              <strong>Total Outstanding:</strong>
              <strong style={{ color: totalOutstanding > 0 ? '#dc2626' : '#22c55e' }}>{formatAmount(totalOutstanding)}</strong>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Save Statement</button>
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
};
