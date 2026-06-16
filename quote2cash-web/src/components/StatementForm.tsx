import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import type { Invoice, Client } from '../types';
import { formatAmount } from '../../formatters';
import { getStatementNextNumber } from '../api';

interface StatementItem {
  id?: string;
  invoiceId: string;
  invoiceNumber: string;
  paymentAmount: number;
  description: string;
  paymentDate: string;
}

interface Props {
  invoices: Invoice[];
  clients: Client[];
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const StatementForm: React.FC<Props> = ({ invoices, clients, initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    statementNumber: initialData?.statementNumber || initialData?.StatementNumber || '',
    clientId: initialData?.clientId || initialData?.ClientId || '',
  });

  const [items, setItems] = useState<StatementItem[]>(() => {
    const rawItems = initialData?.items || initialData?.Items;
    if (rawItems) {
      return rawItems.map((item: any) => ({
        id: item.id || item.Id,
        invoiceId: item.invoiceId || item.InvoiceId || '',
        invoiceNumber: item.invoiceNumber || item.InvoiceNumber || '',
        paymentAmount: item.paymentAmount || item.PaymentAmount || 0,
        description: item.description || item.Description || '',
        paymentDate: (item.paymentDate || item.PaymentDate) 
          ? (item.paymentDate || item.PaymentDate).slice(0, 10) 
          : new Date().toISOString().split('T')[0]
      }));
    }
    return [{ invoiceId: '', invoiceNumber: '', paymentAmount: 0, description: '', paymentDate: new Date().toISOString().split('T')[0] }];
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

  const invoiceMap = useMemo(() => {
    const map: Record<string, Invoice> = {};
    invoices.forEach(inv => { map[inv.id] = inv; });
    return map;
  }, [invoices]);

  const paymentsByInvoice = useMemo(() => {
    const totals: Record<string, number> = {};
    items.forEach(item => {
      if (item.invoiceId) {
        totals[item.invoiceId] = (totals[item.invoiceId] || 0) + Number(item.paymentAmount);
      }
    });
    return totals;
  }, [items]);

  const totalOutstanding = useMemo(() => {
    const uniqueInvoiceIds = Array.from(new Set(items.map(i => i.invoiceId).filter(id => !!id)));
    return uniqueInvoiceIds.reduce((sum, id) => {
      const invAmount = invoiceMap[id]?.amount ?? 0;
      const totalPaid = paymentsByInvoice[id] || 0;
      return sum + (invAmount - totalPaid);
    }, 0);
  }, [items, invoiceMap, paymentsByInvoice]);

  const handleAddItem = () => {
    setItems([...items, { invoiceId: '', invoiceNumber: '', paymentAmount: 0, description: '', paymentDate: new Date().toISOString().split('T')[0] }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof StatementItem, value: any) => {
    const newItems = [...items];
    let updatedItem = { ...newItems[index], [field]: value };
    if (field === 'invoiceId') {
      const inv = invoices.find(i => i.id === value);
      updatedItem.invoiceNumber = inv?.invoiceNumber ?? '';
      updatedItem.paymentAmount = Number(inv?.amount ?? 0);
    }
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) return alert("Please select a client.");
    if (items.some(i => !i.invoiceId)) return alert("Please select an invoice for all rows.");

    try {
      const payload = {
        statementNumber: formData.statementNumber,
        clientId: formData.clientId,
        items: items.map(item => ({
          invoiceId: item.invoiceId,
          description: item.description,
          paymentDate: item.paymentDate,
          paymentAmount: Number(item.paymentAmount)
        }))
      };

      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const id = initialData?.id || initialData?.Id;
      if (id) {
        await axios.put(`/api/statements/${id}`, payload, config);
      } else {
        await axios.post('/api/statements', payload, config);
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

        <div className="line-items" style={{ marginTop: '20px' }}>
          <div className="section-title">
            <h3>Payment Items</h3>
            <button type="button" className="secondary" onClick={handleAddItem}>+ Add Item</button>
          </div>
          <div className="items-grid">
            <div className="item-row header" style={{ gridTemplateColumns: '150px 160px 110px 1fr 100px 110px 40px' }}>
              <span>Date</span>
              <span>Invoice</span>
              <span style={{ textAlign: 'right' }}>Inv. Total</span>
              <span>Description</span>
              <span style={{ textAlign: 'right' }}>Payment</span>
              <span style={{ textAlign: 'right' }}>Outstanding</span>
              <span />
            </div>
            {items.map((item, index) => {
              const invAmount = invoiceMap[item.invoiceId]?.amount ?? 0;
              const currentOutstanding = invAmount - (paymentsByInvoice[item.invoiceId] || 0);
              
              return (
                <div key={index} className="item-row" style={{ gridTemplateColumns: '150px 160px 110px 1fr 100px 110px 40px' }}>
                  <input type="date" required value={item.paymentDate} onChange={e => updateItem(index, 'paymentDate', e.target.value)} />
                  <select required value={item.invoiceId} onChange={e => updateItem(index, 'invoiceId', e.target.value)}>
                    <option value="">-- Invoice --</option>
                    {filteredInvoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoiceNumber}</option>)}
                  </select>
                  <span style={{ textAlign: 'right' }}>{formatAmount(invAmount)}</span>
                  <input type="text" required value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} />
                  <input type="number" step="0.01" value={item.paymentAmount} onChange={e => updateItem(index, 'paymentAmount', e.target.value)} />
                  <span style={{ textAlign: 'right', fontWeight: 'bold', color: currentOutstanding > 0 ? '#dc2626' : '#22c55e' }}>
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
