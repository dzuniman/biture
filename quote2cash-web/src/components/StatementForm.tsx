import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import type { Invoice, Client } from '../types';
import { formatAmount } from '../../formatters';
import { getStatementNextNumber } from '../api'; // Assuming this will be added to api.ts

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
    statementNumber: initialData?.statementNumber ?? '',
    clientId: initialData?.clientId || initialData?.ClientId || '',
  });

  const [items, setItems] = useState<StatementItem[]>(() => {
    if (initialData?.items) {
      return initialData.items.map((item: any) => ({
        ...item,
        invoiceId: item.invoiceId || item.InvoiceId || '',
        paymentDate: item.paymentDate ? item.paymentDate.slice(0, 10) : new Date().toISOString().split('T')[0]
      }));
    }
    return [{ invoiceId: '', invoiceNumber: '', paymentAmount: 0, description: '', paymentDate: new Date().toISOString().split('T')[0] }];
  });

  // Auto-populate statement number for new statements
  useEffect(() => {
    if (!initialData && !formData.statementNumber) {
      const fetchNextNumber = async () => {
        try {
          const nextNumber = await getStatementNextNumber(); // Call the new API function
          setFormData(prev => ({ ...prev, statementNumber: nextNumber }));
        } catch (error) {
          console.error("Failed to fetch next statement number:", error);
          // Optionally, set a default or alert the user
        }
      };
      fetchNextNumber();
    }
  }, [initialData, formData.statementNumber]);


  const filteredInvoices = useMemo(() => {
    if (!formData.clientId) return [];
    return invoices.filter(inv => 
      (inv as any).clientId === formData.clientId || 
      inv.client?.id === formData.clientId
    );
  }, [invoices, formData.clientId]);

  const invoiceMap = useMemo(() => {
    const map: Record<string, Invoice> = {};
    invoices.forEach(inv => {
      map[inv.id] = inv;
    });
    return map;
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return items.reduce((sum, item) => {
      const invAmount = invoiceMap[item.invoiceId]?.amount ?? 0;
      return sum + (invAmount - item.paymentAmount);
    }, 0);
  }, [items, invoiceMap]);

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
      // Default payment amount to invoice total
      updatedItem.paymentAmount = Number(inv?.amount ?? 0);
    }
    
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) return alert("Please select a client.");
    if (items.length === 0) return alert("Please add at least one payment item.");
    
    const hasInvalidItems = items.some(item => !item.invoiceId);
    if (hasInvalidItems) return alert("Please select an invoice for all payment items.");
    
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

      if (initialData?.id) {
        await axios.put(`/api/statements/${initialData.id}`, payload, config);
      } else {
        await axios.post('/api/statements', payload, config);
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save statement:', err);
      if (axios.isAxiosError(err) && err.response) console.error('API Error details:', err.response.data);
      let errorMsg = 'Failed to record payment. Please try again.';
      if (axios.isAxiosError(err)) {
        errorMsg += ' ' + (err.response?.data?.message || err.response?.data?.title || '');
        if (err.response?.data?.errors) {
            errorMsg += ' ' + Object.values(err.response.data.errors).flat().join(', ');
        }
      }
      alert(errorMsg);
    }
  };

  return (
    <div className="card">
      <h2>{initialData ? 'Edit Statement' : 'New Payment Statement'}</h2>
      <form onSubmit={handleSubmit} className="simple-form">
        <div className="grid-2">
          <label>
            Statement Number
            <input 
              type="text" 
              required 
              value={formData.statementNumber} 
              onChange={e => setFormData({...formData, statementNumber: e.target.value})} 
              placeholder="e.g. ST-202606-0001"
            />
          </label>
          <label>
            Client
            <select 
              required 
              value={formData.clientId} 
              onChange={e => {
                const newClientId = e.target.value;
                setFormData({ ...formData, clientId: newClientId });
                setItems([{ invoiceId: '', invoiceNumber: '', paymentAmount: 0, description: '', paymentDate: new Date().toISOString().split('T')[0] }]);
              }}
            >
              <option value="">-- Select Client --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="line-items" style={{ marginTop: '20px' }}>
          <div className="section-title">
            <h3>Payment Items</h3>
            <button type="button" className="secondary" onClick={handleAddItem}>+ Add Item</button>
          </div>
          <div className="items-grid">
            <div className="item-row header" style={{ gridTemplateColumns: '120px 1fr 100px 2fr 100px 100px 40px' }}>
              <span>Date</span>
              <span>Invoice</span>
              <span style={{ textAlign: 'right' }}>Inv. Amount</span>
              <span>Description</span>
              <span style={{ textAlign: 'right' }}>Payment</span>
              <span style={{ textAlign: 'right' }}>Outstanding</span>
              <span />
            </div>
            {items.map((item, index) => {
              const invAmount = invoiceMap[item.invoiceId]?.amount ?? 0;
              const rowOutstanding = invAmount - item.paymentAmount;
              
              return (
                <div key={index} className="item-row" style={{ gridTemplateColumns: '120px 1fr 100px 2fr 100px 100px 40px' }}>
                  <input
                    type="date"
                    required
                    value={item.paymentDate}
                    onChange={e => updateItem(index, 'paymentDate', e.target.value)}
                  />
                  <select
                    required
                    value={item.invoiceId}
                    onChange={e => updateItem(index, 'invoiceId', e.target.value)}
                    disabled={!formData.clientId}
                  >
                    <option value="">-- Invoice --</option>
                    {filteredInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber}
                      </option>
                    ))}
                  </select>
                  <span className="readonly-amount" style={{ textAlign: 'right', padding: '0 8px' }}>
                    {formatAmount(invAmount)}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Description"
                    value={item.description}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={item.paymentAmount}
                    onChange={e => updateItem(index, 'paymentAmount', parseFloat(e.target.value) || 0)}
                  />
                  <span 
                    className="readonly-amount" 
                    style={{ 
                      textAlign: 'right', 
                      padding: '0 8px',
                      color: rowOutstanding > 0 ? '#dc2626' : '#22c55e', // Red for > 0, Green otherwise
                      fontWeight: 'bold'
                    }}
                  >
                    {formatAmount(rowOutstanding)}
                  </span>
                  <button 
                    type="button" 
                    className="danger small" 
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >−</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-summary" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <div style={{ width: '280px', borderTop: '2px solid #334155', paddingTop: '12px' }}>
            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
              <span style={{ fontWeight: 'bold' }}>Total Outstanding:</span>
              <strong 
                style={{ 
                  color: totalOutstanding > 0 ? '#dc2626' : '#22c55e', // Red for > 0, Green otherwise
                  fontWeight: 'bold'
                }}
              >
                {formatAmount(totalOutstanding)}
              </strong>
            </div>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '24px' }}>
          <button type="submit" className="btn-primary">
            Save Payment
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
