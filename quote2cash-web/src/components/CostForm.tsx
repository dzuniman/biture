import { useEffect, useState, type FormEvent } from 'react';
import { formatAmount } from '../../formatters';
import type { Cost, CostCreateRequest, CostQuoteItem, CostQuoteItemCreateRequest } from '../types';

interface Props {
  initialData?: Cost;
  onSubmit: (payload: CostCreateRequest) => Promise<void>;
  onCancel?: () => void;
}

interface ItemRow extends CostQuoteItemCreateRequest {
  _id: string; // local key
}

const newRow = (index: number): ItemRow => ({
  _id: `${Date.now()}-${index}`,
  itemNumber: index + 1,
  quantity: 1,
  uom: '',
  description: '',
  unitPrice: 0,
  supplierName: '',
  supplierDescription: '',
  supplierCost: 0,
  otherName: '',
  otherDescription: '',
  otherCost: 0,
});

function calcRow(item: ItemRow, margin: number) {
  const qty = Number(item.quantity) || 0;
  const unitPrice = Number(item.unitPrice) || 0;
  const supplierCost = Number(item.supplierCost) || 0;
  const otherCost = Number(item.otherCost) || 0;

  const totalPrice = unitPrice * qty;
  const unitRev = unitPrice * (margin / 100) + unitPrice;
  const totalRev = unitRev * qty;
  const supplierCostExc = qty > 0 ? supplierCost / qty : 0;
  const totalSupplierCostExc = supplierCostExc * qty;
  const totalSupplierCostInc = totalSupplierCostExc * 1.15;
  const gp = totalRev - totalSupplierCostExc;

  return { totalPrice, unitRev, totalRev, supplierCostExc, totalSupplierCostExc, totalSupplierCostInc, gp };
}

const VAT_RATE = 0.15;

export default function CostForm({ initialData, onSubmit, onCancel }: Props) {
  const [description, setDescription] = useState('');
  const [margin, setMargin] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ItemRow[]>([newRow(0)]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || '');
      setMargin(Number(initialData.margin) || 0);
      setDate(initialData.date ? initialData.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      if (initialData.items && initialData.items.length > 0) {
        setItems(
          initialData.items.map((item: CostQuoteItem, i: number) => ({
            _id: `existing-${item.id ?? i}`,
            itemNumber: item.itemNumber,
            quantity: item.quantity,
            uom: item.uom,
            description: item.description,
            unitPrice: item.unitPrice,
            supplierName: item.supplierName,
            supplierDescription: item.supplierDescription,
            supplierCost: item.supplierCost,
            otherName: item.otherName,
            otherDescription: item.otherDescription,
            otherCost: item.otherCost,
          }))
        );
      } else {
        setItems([newRow(0)]);
      }
    } else {
      setDescription('');
      setMargin(0);
      setDate(new Date().toISOString().slice(0, 10));
      setItems([newRow(0)]);
    }
  }, [initialData]);

  const handleAddRow = () => {
    setItems((prev) => [...prev, newRow(prev.length)]);
  };

  const handleRemoveRow = (id: string) => {
    setItems((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((r) => r._id !== id);
    });
  };

  const handleUpdateItem = (id: string, field: keyof CostQuoteItemCreateRequest, value: string | number) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row._id !== id) return row;
        return { ...row, [field]: typeof value === 'string' && field !== 'uom' && field !== 'description' && field !== 'supplierName' && field !== 'supplierDescription' && field !== 'otherName' && field !== 'otherDescription' ? Number(value) : value };
      })
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit({
        description: description.trim(),
        margin: Number(margin),
        date: new Date(date).toISOString(),
        items: items.map(({ _id: _, ...rest }) => rest),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Aggregate summary
  const totals = items.reduce(
    (acc, item) => {
      const c = calcRow(item, margin);
      acc.quoteSubTotal += c.totalPrice;
      acc.totalRev += c.totalRev;
      acc.totalSupplierCostExc += c.totalSupplierCostExc;
      acc.totalSupplierCostInc += c.totalSupplierCostInc;
      acc.totalOther += (Number(item.otherCost) || 0);
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
        .cost-form-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .cost-form-header h2 { margin: 0; font-size: 1.6rem; color: #e6e6e6; }
        .cost-form-header p { margin: 4px 0 0; color: #9ca3af; }
        .cost-meta-grid { display: grid; grid-template-columns: 1fr 180px 180px; gap: 16px; margin-bottom: 24px; }
        .cost-meta-grid label { display: flex; flex-direction: column; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
        .cost-meta-grid input { padding: 10px 12px; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: #f3f4f6; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
        .cost-meta-grid input:focus { border-color: #3b82f6; }
        .cost-items-wrapper { background: #111827; border-radius: 12px; border: 1px solid #1f2937; overflow: hidden; margin-bottom: 24px; }
        .cost-items-scroll { overflow-x: auto; }
        .cost-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; min-width: 2200px; }
        .cost-table th { background: #1e2a3a; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 10px 8px; text-align: center; border-bottom: 1px solid #2d3748; white-space: nowrap; font-size: 0.72rem; }
        .cost-table th.input-col { background: #172030; }
        .cost-table th.calc-col { background: #1a2535; color: #60a5fa; }
        .cost-table td { padding: 6px 4px; border-bottom: 1px solid #1f2937; vertical-align: middle; text-align: center; }
        .cost-table td input { width: 100%; min-width: 70px; padding: 6px 8px; background: #1f2937; border: 1px solid #374151; border-radius: 6px; color: #f3f4f6; font-size: 0.8rem; text-align: right; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .cost-table td input[type="text"] { text-align: left; }
        .cost-table td input:focus { border-color: #3b82f6; background: #243447; }
        .cost-table .calc-val { color: #93c5fd; font-weight: 600; font-size: 0.78rem; }
        .cost-table .gp-pos { color: #4ade80; }
        .cost-table .gp-neg { color: #f87171; }
        .cost-table .btn-remove { background: transparent; border: 1px solid #ef4444; color: #ef4444; border-radius: 6px; padding: 4px 8px; cursor: pointer; font-size: 0.75rem; transition: all 0.2s; }
        .cost-table .btn-remove:hover { background: #ef4444; color: white; }
        .add-row-btn { margin: 12px; display: inline-flex; align-items: center; gap: 6px; background: #1f2937; border: 1px dashed #374151; color: #6b7280; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
        .add-row-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #1a2535; }
        .cost-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .summary-card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; }
        .summary-card-title { background: #1e2a3a; padding: 10px 16px; font-size: 0.8rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #2d3748; }
        .summary-table { width: 100%; border-collapse: collapse; }
        .summary-table td { padding: 8px 16px; font-size: 0.85rem; color: #e5e7eb; border-bottom: 1px solid #1f2937; }
        .summary-table td:last-child { text-align: right; font-weight: 600; }
        .summary-table tr.total-row td { color: #f9fafb; font-weight: 700; font-size: 0.9rem; background: #1a2535; }
        .summary-table tr.grand-row td { color: #60a5fa; font-weight: 800; font-size: 0.95rem; background: #1c2a3e; }
        .summary-table tr.gp-summary-row td { color: #4ade80; font-weight: 800; font-size: 0.95rem; }
        .cost-form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; }
        .cost-form-actions button { padding: 12px 28px; border-radius: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; }
        .btn-save { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; }
        .btn-save:hover:not(:disabled) { background: linear-gradient(135deg, #1d4ed8, #1e40af); transform: translateY(-1px); }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-cancel { background: #1f2937; color: #9ca3af; border: 1px solid #374151 !important; }
        .btn-cancel:hover { background: #374151; color: #f3f4f6; }
        .section-divider { font-size: 0.72rem; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.08em; padding: 6px 8px; background: #0f172a; border-bottom: 1px solid #1f2937; text-align: left; }
      `}</style>

      <form onSubmit={handleSubmit}>
        <div className="cost-form-header">
          <div>
            <h2>{initialData ? 'Edit Cost Sheet' : 'New Cost Sheet'}</h2>
            <p>{initialData ? 'Update your cost analysis' : 'Create a new pricing analysis'}</p>
          </div>
        </div>

        {/* Header fields */}
        <div className="cost-meta-grid">
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
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
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

        {/* Items table */}
        <div className="cost-items-wrapper">
          <div className="cost-items-scroll">
            <table className="cost-table">
              <thead>
                <tr>
                  <th colSpan={11} className="input-col section-divider" style={{ textAlign: 'left' }}>📝 Input Fields</th>
                  <th colSpan={7} className="calc-col section-divider" style={{ textAlign: 'left', color: '#60a5fa' }}>📊 Calculated Fields</th>
                  <th rowSpan={1} style={{ background: '#111827', borderBottom: '1px solid #2d3748' }}></th>
                </tr>
                <tr>
                  {/* Input columns */}
                  <th className="input-col">#</th>
                  <th className="input-col">Qty</th>
                  <th className="input-col">UOM</th>
                  <th className="input-col">Description</th>
                  <th className="input-col">Unit Price</th>
                  <th className="input-col">Supplier</th>
                  <th className="input-col">Supplier Desc.</th>
                  <th className="input-col">Supplier Cost</th>
                  <th className="input-col">Other</th>
                  <th className="input-col">Other Desc.</th>
                  <th className="input-col">Other Cost</th>
                  {/* Calculated columns */}
                  <th className="calc-col">Total Price</th>
                  <th className="calc-col">Unit Rev</th>
                  <th className="calc-col">Total Rev</th>
                  <th className="calc-col">Supplier Cost Exc</th>
                  <th className="calc-col">Total Sup. Exc</th>
                  <th className="calc-col">Total Sup. Inc</th>
                  <th className="calc-col">GP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const c = calcRow(item, margin);
                  return (
                    <tr key={item._id}>
                      <td>
                        <input
                          type="number"
                          value={item.itemNumber}
                          onChange={(e) => handleUpdateItem(item._id, 'itemNumber', e.target.value)}
                          style={{ minWidth: 40, width: 50 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item._id, 'quantity', e.target.value)}
                          style={{ minWidth: 60, width: 70 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.uom}
                          onChange={(e) => handleUpdateItem(item._id, 'uom', e.target.value)}
                          placeholder="e.g. EA"
                          style={{ minWidth: 50, width: 60 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item._id, 'description', e.target.value)}
                          placeholder="Item description"
                          style={{ minWidth: 160, width: 200 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item._id, 'unitPrice', e.target.value)}
                          style={{ minWidth: 80, width: 100 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.supplierName}
                          onChange={(e) => handleUpdateItem(item._id, 'supplierName', e.target.value)}
                          placeholder="Supplier"
                          style={{ minWidth: 100, width: 120 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.supplierDescription}
                          onChange={(e) => handleUpdateItem(item._id, 'supplierDescription', e.target.value)}
                          placeholder="Description"
                          style={{ minWidth: 120, width: 150 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.supplierCost}
                          onChange={(e) => handleUpdateItem(item._id, 'supplierCost', e.target.value)}
                          style={{ minWidth: 80, width: 100 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.otherName}
                          onChange={(e) => handleUpdateItem(item._id, 'otherName', e.target.value)}
                          placeholder="Other"
                          style={{ minWidth: 80, width: 100 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.otherDescription}
                          onChange={(e) => handleUpdateItem(item._id, 'otherDescription', e.target.value)}
                          placeholder="Description"
                          style={{ minWidth: 120, width: 150 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.otherCost}
                          onChange={(e) => handleUpdateItem(item._id, 'otherCost', e.target.value)}
                          style={{ minWidth: 80, width: 100 }}
                        />
                      </td>
                      {/* Calculated fields */}
                      <td className="calc-val">{formatAmount(c.totalPrice)}</td>
                      <td className="calc-val">{formatAmount(c.unitRev)}</td>
                      <td className="calc-val">{formatAmount(c.totalRev)}</td>
                      <td className="calc-val">{formatAmount(c.supplierCostExc)}</td>
                      <td className="calc-val">{formatAmount(c.totalSupplierCostExc)}</td>
                      <td className="calc-val">{formatAmount(c.totalSupplierCostInc)}</td>
                      <td className={`calc-val ${c.gp >= 0 ? 'gp-pos' : 'gp-neg'}`}>
                        {formatAmount(c.gp)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemoveRow(item._id)}
                          title="Remove row"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="add-row-btn" onClick={handleAddRow}>
            + Add Row
          </button>
        </div>

        {/* Summary tables */}
        <div className="cost-summary-grid">
          {/* Quote Summary */}
          <div className="summary-card">
            <div className="summary-card-title">📄 Quote Summary (excl. VAT)</div>
            <table className="summary-table">
              <tbody>
                <tr>
                  <td>Sub Total</td>
                  <td>{formatAmount(totals.quoteSubTotal)}</td>
                </tr>
                <tr>
                  <td>VAT (15%)</td>
                  <td>{formatAmount(quoteVat)}</td>
                </tr>
                <tr className="grand-row">
                  <td>Grand Total</td>
                  <td>{formatAmount(quoteGrandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Supplier Summary */}
          <div className="summary-card">
            <div className="summary-card-title">🏭 Supplier Cost Summary</div>
            <table className="summary-table">
              <tbody>
                <tr>
                  <td>Sub Total (Exc. VAT)</td>
                  <td>{formatAmount(totals.totalSupplierCostExc)}</td>
                </tr>
                <tr>
                  <td>VAT (15%)</td>
                  <td>{formatAmount(supplierVat)}</td>
                </tr>
                <tr className="grand-row">
                  <td>Grand Total (Inc. VAT)</td>
                  <td>{formatAmount(totals.totalSupplierCostInc)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Other Cost Summary */}
          <div className="summary-card">
            <div className="summary-card-title">📦 Other Cost Summary</div>
            <table className="summary-table">
              <tbody>
                <tr>
                  <td>Sub Total</td>
                  <td>{formatAmount(totals.totalOther)}</td>
                </tr>
                <tr>
                  <td>VAT (15%)</td>
                  <td>{formatAmount(otherVat)}</td>
                </tr>
                <tr className="grand-row">
                  <td>Grand Total</td>
                  <td>{formatAmount(otherGrandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Revenue Summary */}
          <div className="summary-card">
            <div className="summary-card-title">💹 Revenue Summary ({margin}% Margin)</div>
            <table className="summary-table">
              <tbody>
                <tr>
                  <td>Sub Total Revenue</td>
                  <td>{formatAmount(totals.totalRev)}</td>
                </tr>
                <tr>
                  <td>VAT (15%)</td>
                  <td>{formatAmount(revVat)}</td>
                </tr>
                <tr className="grand-row">
                  <td>Grand Total Revenue</td>
                  <td>{formatAmount(revGrandTotal)}</td>
                </tr>
                <tr className={totals.gp >= 0 ? 'gp-summary-row' : 'total-row'}>
                  <td>Gross Profit (GP)</td>
                  <td style={{ color: totals.gp >= 0 ? '#4ade80' : '#f87171' }}>
                    {formatAmount(totals.gp)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Form actions */}
        <div className="cost-form-actions">
          {onCancel && (
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-save" disabled={isSaving}>
            {isSaving ? 'Saving…' : initialData ? 'Update Cost Sheet' : 'Save Cost Sheet'}
          </button>
        </div>
      </form>
    </div>
  );
}