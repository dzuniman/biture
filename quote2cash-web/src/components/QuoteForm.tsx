import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { formatAmount } from '../../formatters';
import type { Client, Quote, QuoteCreateRequest, QuoteItemCreateRequest } from '../types';

interface Props {
  clients: Client[];
  initialData?: Quote;
  selectedClientId?: string;
  onSelectClientId?: (clientId: string) => void;
  onSubmit: (payload: QuoteCreateRequest) => Promise<void>;
  onCancel?: () => void;
  onRequestNewClient: () => void;
  isDuplicate?: boolean;
}

const blankItem: QuoteItemCreateRequest = {
  itemNumber: 1,
  quantity: 1,
  uom: 'pcs',
  description: '',
  unitPrice: 0,
  totalPrice: 0
};

export default function QuoteForm({
  clients,
  initialData,
  selectedClientId,
  onSelectClientId,
  onSubmit,
  onCancel,
  onRequestNewClient,
  isDuplicate = false
}: Props) {
  const [clientId, setClientId] = useState(initialData?.clientId ?? selectedClientId ?? '');
  const [quoteNumber, setQuoteNumber] = useState(initialData?.quoteNumber.toString() ?? '');
  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [date, setDate] = useState(initialData ? initialData.date.slice(0, 10) : '');
  const [validityDays, setValidityDays] = useState(initialData?.validityDays.toString() ?? '30');
  const [vendorNumber, setVendorNumber] = useState(initialData?.vendorNumber ?? '');
  const [items, setItems] = useState<QuoteItemCreateRequest[]>(initialData?.items.length ? initialData.items : [blankItem]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.clientId ?? '');
      setQuoteNumber(initialData.quoteNumber.toString());
      setReference(initialData.reference);
      setDate(initialData.date.slice(0, 10));
      setValidityDays(initialData.validityDays.toString());
      setVendorNumber(initialData.vendorNumber);
      setItems(initialData.items.length ? initialData.items : [blankItem]);
    } else {
      setClientId(selectedClientId ?? '');
      setQuoteNumber('');
      setReference('');
      setDate('');
      setValidityDays('30');
      setVendorNumber('');
      setItems([blankItem]);
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData && selectedClientId) {
      setClientId(selectedClientId);
    }
  }, [initialData, selectedClientId]);

  const handleUpdateItem = (index: number, field: keyof QuoteItemCreateRequest, value: string) => {
    setItems((current) => {
      const next = [...current];
      const item = { ...next[index] };

      if (field === 'itemNumber') {
        item.itemNumber = Number(value);
      } else if (field === 'quantity') {
        item.quantity = Number(value);
      } else if (field === 'unitPrice') {
        item.unitPrice = Number(value);
      } else if (field === 'uom') {
        item.uom = value;
      } else if (field === 'description') {
        item.description = value;
      }

      item.totalPrice = Number((item.quantity * item.unitPrice).toFixed(2));
      next[index] = item;
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((current) => [
      ...current,
      {
        itemNumber: current.length + 1,
        quantity: 1,
        uom: 'pcs',
        description: '',
        unitPrice: 0,
        totalPrice: 0
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const lineCount = useMemo(() => items.length, [items]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    await onSubmit({
      clientId: clientId || undefined,
      quoteNumber: Number(quoteNumber),
      reference: reference.trim(),
      date: date || new Date().toISOString(),
      validityDays: Number(validityDays),
      vendorNumber: vendorNumber.trim(),
      items: items.map((item) => ({
        itemNumber: item.itemNumber,
        quantity: item.quantity,
        uom: item.uom.trim(),
        description: item.description.trim(),
        unitPrice: item.unitPrice,
        totalPrice: Number((item.quantity * item.unitPrice).toFixed(2))
      }))
    });

    setIsSaving(false);
  };

  const title = isDuplicate ? 'Duplicate Quote' : initialData ? 'Edit Quote' : 'Add Quote';
  const submitLabel = isDuplicate ? 'Create Duplicate' : initialData ? 'Update Quote' : 'Save Quote';

  return (
    <div className="card">
      <h2>{title}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Client
          <div className="select-with-action">
            <select
              value={clientId}
              onChange={(event) => {
                const value = event.target.value;
                setClientId(value);
                onSelectClientId?.(value);
              }}
            >
              <option value="">Select existing client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <button type="button" className="secondary" onClick={onRequestNewClient}>
              New client
            </button>
          </div>
        </label>
        <label>
          Quote number
          <input
            type="number"
            value={quoteNumber}
            onChange={(event) => setQuoteNumber(event.target.value)}
            required
          />
        </label>
        <label>
          Reference
          <input value={reference} onChange={(event) => setReference(event.target.value)} required />
        </label>
        <div className="grid-2">
          <label>
            Date
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label>
            Valid for (days)
            <input
              type="number"
              value={validityDays}
              onChange={(event) => setValidityDays(event.target.value)}
              required
            />
          </label>
        </div>
        <label>
          Vendor number
          <input value={vendorNumber} onChange={(event) => setVendorNumber(event.target.value)} required />
        </label>

        <div className="line-items">
          <div className="section-title">
            <h3>Quote items</h3>
            <button type="button" className="secondary" onClick={handleAddItem}>
              Add line
            </button>
          </div>
          <div className="items-grid">
            <div className="item-row header">
              <span>#</span>
              <span>Qty</span>
              <span>UOM</span>
              <span>Description</span>
              <span>Unit price</span>
              <span>Total price</span>
              <span />
            </div>
            {items.map((item, index) => (
              <div key={index} className="item-row">
                <input
                  type="number"
                  min="1"
                  value={item.itemNumber}
                  onChange={(event) => handleUpdateItem(index, 'itemNumber', event.target.value)}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(event) => handleUpdateItem(index, 'quantity', event.target.value)}
                  required
                />
                <input
                  value={item.uom}
                  onChange={(event) => handleUpdateItem(index, 'uom', event.target.value)}
                  required
                />
                <input
                  value={item.description}
                  onChange={(event) => handleUpdateItem(index, 'description', event.target.value)}
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) => handleUpdateItem(index, 'unitPrice', event.target.value)}
                  required
                />
                <input value={formatAmount(item.totalPrice)} disabled />
                <button
                  type="button"
                  className="danger small"
                  onClick={() => setItems((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSaving || items.length === 0}>
            {isSaving ? 'Saving…' : submitLabel}
          </button>
          {onCancel && (
            <button type="button" className="secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
