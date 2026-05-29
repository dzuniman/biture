import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { formatAmount } from '../../formatters';
import type { Client, Quote, QuoteCreateRequest, QuoteItemCreateRequest, QuoteUom, QuoteDescription } from '../types';
import { getQuoteNextNumber } from '../api';

interface Props {
  clients: Client[];
  uomOptions: QuoteUom[];
  descriptionOptions: QuoteDescription[];
  initialData?: Quote;
  selectedClientId?: string;
  onSelectClientId?: (clientId: string) => void;
  onSubmit: (payload: QuoteCreateRequest) => Promise<void>;
  onCancel?: () => void;
  onRequestNewClient: () => void;
  isDuplicate?: boolean;
}

type SuggestionOption = { id: string; value: string };

interface SuggestionInputProps {
  options: SuggestionOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

function SuggestionInput({
  options,
  value,
  onChange,
  placeholder,
  required = false
}: SuggestionInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    const list = query
      ? options.filter((option) => option.value.toLowerCase().includes(query))
      : options;
    return list.slice(0, 10);
  }, [options, value]);

  return (
    <div className="suggestion-input" style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {isOpen && filteredOptions.length > 0 && (
        <div
          className="suggestion-list"
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '240px',
            overflowY: 'auto',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            boxShadow: '0 14px 50px rgba(15, 23, 42, 0.12)',
            marginTop: '8px'
          }}
        >
          {filteredOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(option.value);
              }}
              className="suggestion-item"
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                background: 'white',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              {option.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const blankItem: QuoteItemCreateRequest = {
  itemNumber: 1,
  quantity: 1,
  uom: '',
  description: '',
  unitPrice: 0,
  totalPrice: 0
};

export default function QuoteForm({
  clients,
  uomOptions,
  descriptionOptions,
  initialData,
  selectedClientId,
  onSelectClientId,
  onSubmit,
  onCancel,
  onRequestNewClient,
  isDuplicate = false
}: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [clientId, setClientId] = useState(initialData?.clientId ?? selectedClientId ?? '');
  const [quoteNumber, setQuoteNumber] = useState(initialData?.quoteNumber ?? '');
  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [date, setDate] = useState(initialData ? initialData.date.slice(0, 10) : today);
  const [validityDays, setValidityDays] = useState(initialData?.validityDays.toString() ?? '30');
  const [items, setItems] = useState<QuoteItemCreateRequest[]>(initialData?.items.length ? initialData.items : [blankItem]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.clientId ?? '');
      setQuoteNumber(initialData.quoteNumber);
      setReference(initialData.reference);
      setDate(initialData.date.slice(0, 10));
      setValidityDays(initialData.validityDays.toString());
      setItems(initialData.items.length ? initialData.items : [blankItem]);
    } else {
      setClientId(selectedClientId ?? '');
      setQuoteNumber('');
      setReference('');
      setDate(today);
      setValidityDays('30');
      setItems([blankItem]);
    }
  }, [initialData, selectedClientId, today]);

  useEffect(() => {
    if (!initialData && !quoteNumber) {
      getQuoteNextNumber().then(setQuoteNumber).catch(() => {
        // silenced, number will remain blank until available
      });
    }
  }, [initialData, quoteNumber]);

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
        uom: '',
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
      quoteNumber: quoteNumber.trim(),
      reference: reference.trim(),
      date: date || new Date().toISOString(),
      validityDays: Number(validityDays),
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
            type="text"
            value={quoteNumber}
            onChange={(event) => setQuoteNumber(event.target.value)}
            placeholder="Qyyyymm0000"
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
        <div className="line-items">
          <div className="section-title">
            <h3>Quote items</h3>
            <button type="button" className="secondary" onClick={handleAddItem}>
              Add line
            </button>
          </div>
          <div className="items-grid">
            <div className="item-row header">
              <span>Item</span>
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
                <SuggestionInput
                  options={uomOptions.map((option) => ({ id: option.id, value: option.value }))}
                  value={item.uom}
                  onChange={(value) => handleUpdateItem(index, 'uom', value)}
                  placeholder="Select or type UOM"
                  required
                />
                <SuggestionInput
                  options={descriptionOptions.map((option) => ({ id: option.id, value: option.value }))}
                  value={item.description}
                  onChange={(value) => handleUpdateItem(index, 'description', value)}
                  placeholder="Select or type description"
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
