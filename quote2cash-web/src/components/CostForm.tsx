import { useEffect, useState, type FormEvent } from 'react';
import { formatAmount } from '../../formatters';
import type { Cost, CostCreateRequest, CostQuoteItem } from '../types';

interface Props {
  initialData?: Cost;
  onSubmit: (payload: CostCreateRequest) => Promise<void>;
  onCancel?: () => void;
}

// Store all numeric fields as strings so controlled inputs work correctly while typing decimals
interface ItemRow {
  _id: string;
  itemNumber: string;
  quantity: string;
  uom: string;
  description: string;
  unitPrice: string;
  supplierName: string;
  supplierDescription: string;
  supplierCost: string;
  otherName: string;
  otherDescription: string;
  otherCost: string;
}

const n = (v: string | number) => parseFloat(String(v)) || 0;

const newRow = (index: number): ItemRow => ({
  _id: `${Date.now()}-${index}`,
  itemNumber: String(index + 1),
  quantity: '1',
  uom: '',
  description: '',
  unitPrice: '0',
  supplierName: '',
  supplierDescription: '',
  supplierCost: '0',
  otherName: '',
  otherDescription: '',
  otherCost: '0',
});

function calcRow(item: ItemRow, margin: number) {
  const qty = n(item.quantity);
  const unitPrice = n(item.unitPrice);
  const supplierCost = n(item.supplierCost);
  const otherCost = n(item.otherCost);
  const m = n(margin);

  const totalPrice = unitPrice * qty;
  const unitRev = unitPrice * (m / 100) + unitPrice;
  const totalRev = unitRev * qty;
  const supplierCostExc = qty > 0 ? supplierCost / qty : 0;
  const totalSupplierCostExc = supplierCostExc * qty;
  const totalSupplierCostInc = totalSupplierCostExc * 1.15;
  const gp = totalRev - totalSupplierCostExc;

  return { totalPrice, unitRev, totalRev, supplierCostExc, totalSupplierCostExc, totalSupplierCostInc, gp, otherCost };
}

const VAT_RATE = 0.15;

export default function CostForm({ initialData, onSubmit, onCancel }: Props) {
  const [description, setDescription] = useState('');
  const [marginStr, setMarginStr] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ItemRow[]>([newRow(0)]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || '');
      setMarginStr(String(initialData.margin ?? 0));
      setDate(initialData.date ? initialData.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      if (initialData.items && initialData.items.length > 0) {
        setItems(
          initialData.items.map((item: CostQuoteItem, i: number) => ({
            _id: `existing-${item.id ?? i}`,
            itemNumber: String(item.itemNumber),
            quantity: String(item.quantity),
            uom: item.uom,
            description: item.description,
            unitPrice: String(item.unitPrice),
            supplierName: item.supplierName,
            supplierDescription: item.supplierDescription,
            supplierCost: String(item.supplierCost),
            otherName: item.otherName,
            otherDescription: item.otherDescription,
            otherCost: String(item.otherCost),
          }))
        );
      } else {
        setItems([newRow(0)]);
      }
    } else {
      setDescription('');
      setMarginStr('0');
      setDate(new Date().toISOString().slice(0, 10));
      setItems([newRow(0)]);
    }
  }, [initialData]);

  const margin = n(marginStr);

  const handleAddRow = () => {
    setItems((prev) => [...prev, newRow(prev.length)]);
  };

  const handleRemoveRow = (id: string) => {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((r) => r._id !== id);
    });
  };

  const handleUpdateItem = (id: string, field: keyof Omit<ItemRow, '_id'>, value: string) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row._id !== id) return row;
        return { ...row, [field]: value };
      })
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit({
        description: description.trim(),
        margin: n(marginStr),
        date: new Date(date).toISOString(),
        items: items.map(({ _id: _ignored, ...row }) => ({
          itemNumber: n(row.itemNumber),
          quantity: n(row.quantity),
          uom: row.uom,
          description: row.description,
          unitPrice: n(row.unitPrice),
          supplierName: row.supplierName,
          supplierDescription: row.supplierDescription,
          supplierCost: n(row.supplierCost),
          otherName: row.otherName,
          otherDescription: row.otherDescription,
          otherCost: n(row.otherCost),
        })),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Live aggregate totals — recomputed on every render from current state
  const totals = items.reduce(
    (acc, item) => {
      const c = calcRow(item, margin);
      acc.quoteSubTotal += c.totalPrice;
      acc.totalRev += c.totalRev;
      acc.totalSupplierCostExc += c.totalSupplierCostExc;
      acc.totalSupplierCostInc += c.totalSupplierCostInc;
      acc.totalOther += c.otherCost;
      acc.gp += c.gp;
      return acc;
    },
    { quoteSubTotal: 0, totalRev: 0, totalSupplierCostExc: 0, totalSupplierCostInc: 0, totalOther: 0, gp: 0 }
  );

  const quoteVat = totals.quoteSubTotal * VAT_RATE;
  const quoteGrandTotal = totals.quoteSubTotal + quoteVat;
  const supplierVat = totals.totalSupplierCostInc - totals.totalSupplierCostExc;
  const otherVat = totals.totalOther * VAT_RATE;
  const otherGrandTotal = totals.totalOther + otherVat;
  const revVat = totals.totalRev * VAT_RATE;
  const revGrandTotal = totals.totalRev + revVat;

  return (
    <div className="page-section">
      <style>{`
        /* ── Header ── */
        .cf-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .cf-header h2 { margin: 0; font-size: 1.6rem; color: #e6e6e6; }
        .cf-header p  { margin: 4px 0 0; color: #9ca3af; }

        /* ── Meta row ── */
        .cf-meta { display: grid; grid-template-columns: 1fr 160px 160px; gap: 16px; margin-bottom: 28px; }
        .cf-meta label { display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .cf-meta input { padding: 10px 14px; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: #f3f4f6; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
        .cf-meta input:focus { border-color: #3b82f6; }

        /* ── Items area ── */
        .cf-items-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 28px; }

        /* ── Item card ── */
        .cf-item-card { background: #111827; border: 1px solid #1e2a3a; border-radius: 14px; overflow: hidden; }
        .cf-item-card-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #162032; border-bottom: 1px solid #1e2a3a; }
        .cf-item-label { font-size: 0.8rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; }
        .cf-item-num { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: #1d4ed8; color: white; font-size: 0.8rem; font-weight: 800; margin-right: 8px; }
        .cf-btn-remove { background: transparent; border: 1px solid #ef4444; color: #ef4444; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.2s; }
        .cf-btn-remove:hover { background: #ef4444; color: white; }

        /* ── 3-column section layout ── */
        .cf-item-sections { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; border-bottom: 1px solid #1e2a3a; }
        .cf-section { padding: 14px 16px; border-right: 1px solid #1e2a3a; }
        .cf-section:last-child { border-right: none; }
        .cf-section-title { font-size: 0.72rem; font-weight: 800; color: #4b5563; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #1f2937; }
        .cf-section-title.supplier { color: #7c3aed; }
        .cf-section-title.other { color: #0891b2; }
        .cf-section-title.item { color: #1d4ed8; }

        /* ── Field inside a section ── */
        .cf-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
        .cf-field:last-child { margin-bottom: 0; }
        .cf-field label { font-size: 0.73rem; font-weight: 600; color: #6b7280; }
        .cf-field input { padding: 7px 10px; border-radius: 6px; border: 1px solid #2d3748; background: #1a2535; color: #f3f4f6; font-size: 0.85rem; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.2s, background 0.2s; }
        .cf-field input:focus { border-color: #3b82f6; background: #1e2d42; }
        .cf-field input[type="number"] { text-align: right; }

        /* ── Calculated row at bottom of card ── */
        .cf-calc-strip { display: flex; flex-wrap: wrap; gap: 0; background: #0f172a; border-top: 1px solid #1e2a3a; }
        .cf-calc-cell { flex: 1; min-width: 120px; padding: 8px 14px; border-right: 1px solid #1e2a3a; }
        .cf-calc-cell:last-child { border-right: none; }
        .cf-calc-cell .c-label { font-size: 0.68rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.06em; }
        .cf-calc-cell .c-value { font-size: 0.85rem; font-weight: 700; color: #93c5fd; margin-top: 2px; }
        .cf-calc-cell .c-value.gp-pos { color: #4ade80; }
        .cf-calc-cell .c-value.gp-neg { color: #f87171; }

        /* ── Add row button ── */
        .cf-add-btn { display: inline-flex; align-items: center; gap: 8px; background: #1f2937; border: 1px dashed #374151; color: #6b7280; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.2s; margin-bottom: 8px; }
        .cf-add-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #1a2535; }

        /* ── Summary grid ── */
        .cf-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .cf-summary-card { background: #111827; border: 1px solid #1e2a3a; border-radius: 12px; overflow: hidden; }
        .cf-summary-title { background: #162032; padding: 10px 16px; font-size: 0.75rem; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1px solid #1e2a3a; }
        .cf-summary-table { width: 100%; border-collapse: collapse; }
        .cf-summary-table td { padding: 9px 16px; font-size: 0.85rem; color: #d1d5db; border-bottom: 1px solid #1a2535; }
        .cf-summary-table td:last-child { text-align: right; font-weight: 700; }
        .cf-summary-table tr.cf-grand td { background: #1c2a3e; color: #60a5fa; font-weight: 800; font-size: 0.9rem; }
        .cf-summary-table tr.cf-gp td { background: #0f2014; font-weight: 800; font-size: 0.9rem; }

        /* ── Actions ── */
        .cf-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 8px; }
        .cf-actions button { padding: 12px 28px; border-radius: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; }
        .cf-btn-save { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; }
        .cf-btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.4); }
        .cf-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .cf-btn-cancel { background: #1f2937; color: #9ca3af; border: 1px solid #374151 !important; }
        .cf-btn-cancel:hover { background: #374151; color: #f3f4f6; }
      `}</style>

      <form onSubmit={handleSubmit}>
        {/* ── Page header ── */}
        <div className="cf-header">
          <div>
            <h2>{initialData ? 'Edit Cost Sheet' : 'New Cost Sheet'}</h2>
            <p>{initialData ? 'Update your cost analysis' : 'Create a new pricing and cost analysis'}</p>
          </div>
        </div>

        {/* ── Cost meta ── */}
        <div className="cf-meta">
          <label>
            Description
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Project Alpha Cost Analysis"
              required
            />
          </label>
          <label>
            Margin (%)
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={marginStr}
              onChange={(e) => setMarginStr(e.target.value)}
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
        </div>

        {/* ── Item cards ── */}
        <div className="cf-items-list">
          {items.map((item, idx) => {
            const c = calcRow(item, margin);
            return (
              <div className="cf-item-card" key={item._id}>
                {/* Card header */}
                <div className="cf-item-card-header">
                  <span className="cf-item-label">
                    <span className="cf-item-num">{idx + 1}</span>
                    Item
                  </span>
                  <button
                    type="button"
                    className="cf-btn-remove"
                    onClick={() => handleRemoveRow(item._id)}
                  >
                    ✕ Remove
                  </button>
                </div>

                {/* 3-column sections */}
                <div className="cf-item-sections">
                  {/* Section 1: Item Info */}
                  <div className="cf-section">
                    <div className="cf-section-title item">📋 Item Info</div>
                    <div className="cf-field">
                      <label>Item #</label>
                      <input
                        type="number"
                        value={item.itemNumber}
                        onChange={(e) => handleUpdateItem(item._id, 'itemNumber', e.target.value)}
                      />
                    </div>
                    <div className="cf-field">
                      <label>Quantity</label>
                      <input
                        type="number"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item._id, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="cf-field">
                      <label>UOM</label>
                      <input
                        type="text"
                        value={item.uom}
                        onChange={(e) => handleUpdateItem(item._id, 'uom', e.target.value)}
                        placeholder="e.g. EA"
                      />
                    </div>
                    <div className="cf-field">
                      <label>Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item._id, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="cf-field">
                      <label>Unit Price</label>
                      <input
                        type="number"
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(item._id, 'unitPrice', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Section 2: Supplier */}
                  <div className="cf-section">
                    <div className="cf-section-title supplier">🏭 Supplier</div>
                    <div className="cf-field">
                      <label>Supplier Name</label>
                      <input
                        type="text"
                        value={item.supplierName}
                        onChange={(e) => handleUpdateItem(item._id, 'supplierName', e.target.value)}
                        placeholder="Supplier name"
                      />
                    </div>
                    <div className="cf-field">
                      <label>Supplier Description</label>
                      <input
                        type="text"
                        value={item.supplierDescription}
                        onChange={(e) => handleUpdateItem(item._id, 'supplierDescription', e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                    <div className="cf-field">
                      <label>Supplier Cost (Total)</label>
                      <input
                        type="number"
                        step="any"
                        value={item.supplierCost}
                        onChange={(e) => handleUpdateItem(item._id, 'supplierCost', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Section 3: Other */}
                  <div className="cf-section">
                    <div className="cf-section-title other">📦 Other</div>
                    <div className="cf-field">
                      <label>Other Name</label>
                      <input
                        type="text"
                        value={item.otherName}
                        onChange={(e) => handleUpdateItem(item._id, 'otherName', e.target.value)}
                        placeholder="Other name"
                      />
                    </div>
                    <div className="cf-field">
                      <label>Other Description</label>
                      <input
                        type="text"
                        value={item.otherDescription}
                        onChange={(e) => handleUpdateItem(item._id, 'otherDescription', e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                    <div className="cf-field">
                      <label>Other Cost</label>
                      <input
                        type="number"
                        step="any"
                        value={item.otherCost}
                        onChange={(e) => handleUpdateItem(item._id, 'otherCost', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Calculated values strip */}
                <div className="cf-calc-strip">
                  <div className="cf-calc-cell">
                    <div className="c-label">Total Price</div>
                    <div className="c-value">{formatAmount(c.totalPrice)}</div>
                  </div>
                  <div className="cf-calc-cell">
                    <div className="c-label">Unit Rev</div>
                    <div className="c-value">{formatAmount(c.unitRev)}</div>
                  </div>
                  <div className="cf-calc-cell">
                    <div className="c-label">Total Rev</div>
                    <div className="c-value">{formatAmount(c.totalRev)}</div>
                  </div>
                  <div className="cf-calc-cell">
                    <div className="c-label">Sup. Cost Exc</div>
                    <div className="c-value">{formatAmount(c.supplierCostExc)}</div>
                  </div>
                  <div className="cf-calc-cell">
                    <div className="c-label">Total Sup. Exc</div>
                    <div className="c-value">{formatAmount(c.totalSupplierCostExc)}</div>
                  </div>
                  <div className="cf-calc-cell">
                    <div className="c-label">Total Sup. Inc</div>
                    <div className="c-value">{formatAmount(c.totalSupplierCostInc)}</div>
                  </div>
                  <div className="cf-calc-cell">
                    <div className="c-label">GP</div>
                    <div className={`c-value ${c.gp >= 0 ? 'gp-pos' : 'gp-neg'}`}>
                      {formatAmount(c.gp)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" className="cf-add-btn" onClick={handleAddRow}>
          + Add Item
        </button>

        {/* ── Summary tables ── */}
        <div className="cf-summary-grid">
          {/* Quote Summary */}
          <div className="cf-summary-card">
            <div className="cf-summary-title">📄 Quote Summary</div>
            <table className="cf-summary-table">
              <tbody>
                <tr><td>Sub Total</td><td>{formatAmount(totals.quoteSubTotal)}</td></tr>
                <tr><td>VAT (15%)</td><td>{formatAmount(quoteVat)}</td></tr>
                <tr className="cf-grand"><td>Grand Total</td><td>{formatAmount(quoteGrandTotal)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Supplier Summary */}
          <div className="cf-summary-card">
            <div className="cf-summary-title">🏭 Supplier Summary</div>
            <table className="cf-summary-table">
              <tbody>
                <tr><td>Sub Total (Exc. VAT)</td><td>{formatAmount(totals.totalSupplierCostExc)}</td></tr>
                <tr><td>VAT (15%)</td><td>{formatAmount(supplierVat)}</td></tr>
                <tr className="cf-grand"><td>Grand Total (Inc. VAT)</td><td>{formatAmount(totals.totalSupplierCostInc)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Other Summary */}
          <div className="cf-summary-card">
            <div className="cf-summary-title">📦 Other Summary</div>
            <table className="cf-summary-table">
              <tbody>
                <tr><td>Sub Total</td><td>{formatAmount(totals.totalOther)}</td></tr>
                <tr><td>VAT (15%)</td><td>{formatAmount(otherVat)}</td></tr>
                <tr className="cf-grand"><td>Grand Total</td><td>{formatAmount(otherGrandTotal)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Revenue & GP Summary */}
          <div className="cf-summary-card">
            <div className="cf-summary-title">💹 Revenue Summary ({marginStr}% Margin)</div>
            <table className="cf-summary-table">
              <tbody>
                <tr><td>Sub Total Revenue</td><td>{formatAmount(totals.totalRev)}</td></tr>
                <tr><td>VAT (15%)</td><td>{formatAmount(revVat)}</td></tr>
                <tr className="cf-grand"><td>Grand Total Revenue</td><td>{formatAmount(revGrandTotal)}</td></tr>
                <tr className="cf-gp">
                  <td>Gross Profit (GP)</td>
                  <td style={{ color: totals.gp >= 0 ? '#4ade80' : '#f87171' }}>
                    {formatAmount(totals.gp)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="cf-actions">
          {onCancel && (
            <button type="button" className="cf-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="cf-btn-save" disabled={isSaving}>
            {isSaving ? 'Saving…' : initialData ? 'Update Cost Sheet' : 'Save Cost Sheet'}
          </button>
        </div>
      </form>
    </div>
  );
}