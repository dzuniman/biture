import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import { formatAmount } from '../../formatters';
import * as XLSX from 'xlsx';
import type { Client, Quote, QuoteCreateRequest, QuoteItemCreateRequest, QuoteDescription } from '../types';
import { getQuoteNextNumber } from '../api';

interface Props {
  clients: Client[];
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
  code: '',
  uom: '',
  description: '',
  unitPrice: 0,
  totalPrice: 0
};

export default function QuoteForm({
  clients,
  descriptionOptions,
  initialData,
  selectedClientId,
  onSelectClientId,
  onSubmit,
  onCancel,
  onRequestNewClient,
  isDuplicate = false
}: Props) {
  // Use local date string to avoid UTC day-shift errors
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);
  const [clientId, setClientId] = useState(initialData?.clientId ?? selectedClientId ?? '');
  const [quoteNumber, setQuoteNumber] = useState(initialData?.quoteNumber ?? '');
  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [date, setDate] = useState(initialData?.date ? initialData.date.slice(0, 10) : today);
  const [validityDays, setValidityDays] = useState(initialData?.validityDays.toString() ?? '30');
  const [items, setItems] = useState<QuoteItemCreateRequest[]>(initialData?.items?.length ? initialData.items : [blankItem]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setClientId(initialData.clientId ?? '');
      setQuoteNumber(initialData.quoteNumber);
      setReference(initialData.reference);
      setDate(initialData.date ? initialData.date.slice(0, 10) : today);
      setValidityDays(initialData.validityDays.toString());
      const sorted = [...initialData.items].sort((a, b) => a.itemNumber - b.itemNumber);
      setItems(sorted.length ? sorted : [blankItem]);
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

  const findDescriptionByCode = (value: string) => {
    if (!value.trim()) return undefined;
    const lookup = value.trim().toLowerCase();
    return descriptionOptions.find((option) => option.code.trim().toLowerCase() === lookup);
  };

  const reindexItems = (currentItems: QuoteItemCreateRequest[]) => {
    return [...currentItems]
      .sort((a, b) => a.itemNumber - b.itemNumber)
      .map((item, index) => ({ ...item, itemNumber: index + 1 }));
  };


  const handleUpdateItem = (index: number, field: keyof QuoteItemCreateRequest, value: string) => {
    setItems((current) => {
      const next = [...current];
      const item = { ...next[index] };

      if (field === 'itemNumber') {
        item.itemNumber = Number(value);
      } else if (field === 'quantity') {
        item.quantity = Math.max(0, Number(value));
      } else if (field === 'unitPrice') {
        item.unitPrice = Number(value);
      } else if (field === 'code') {
        item.code = value;
        const matched = findDescriptionByCode(value);
        if (matched) {
          item.uom = matched.uom;
          item.description = matched.description;
        }
      } else if (field === 'uom') {
        item.uom = value;
      } else if (field === 'description') {
        item.description = value;
      }

      item.totalPrice = parseFloat((item.quantity * item.unitPrice).toFixed(2));
      next[index] = item;

      if (field === 'itemNumber') {
        next.sort((a, b) => a.itemNumber - b.itemNumber);
      }

      return next;
    });
  };

  const handleAddItem = () => {
    setItems((current) => reindexItems([...current, {
      itemNumber: current.length + 1,
      quantity: 1,
      code: '',
      uom: '',
      description: '',
      unitPrice: 0,
      totalPrice: 0,
    }]));
  };

  const handleDownloadTemplate = () => {
    const headers = ['Code', 'Quantity', 'UOM', 'Description', 'Unit Price'];
    const data = [headers];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quote Items');
    XLSX.writeFile(wb, 'quote_items_template.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (json.length < 2) {
        alert('Excel file is empty or missing headers.');
        return;
      }

      const headers = json[0].map((h: any) => String(h || '').trim().toLowerCase());
      const expectedHeaders = ['Code', 'Quantity', 'UOM', 'Description', 'Unit Price'];
      const expectedHeadersLower = expectedHeaders.map(h => h.toLowerCase());

      if (!expectedHeadersLower.every(h => headers.includes(h))) {
        alert(`Missing expected headers. Please ensure the file contains: ${expectedHeaders.join(', ')}`);
        return;
      }

      const newItems: QuoteItemCreateRequest[] = [];
      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        const item: QuoteItemCreateRequest = {
          itemNumber: 0, // Will be re-indexed later
          code: row[headers.indexOf('code')] || '',
          quantity: parseFloat(row[headers.indexOf('quantity')] || 0),
          uom: row[headers.indexOf('uom')] || '',
          description: row[headers.indexOf('description')] || '',
          unitPrice: parseFloat(row[headers.indexOf('unit price')] || 0),
          totalPrice: 0, // Calculated below
        };
        item.totalPrice = parseFloat((item.quantity * item.unitPrice).toFixed(2));
        newItems.push(item);
      }

      setItems((current) => {
        const combinedItems = [...current, ...newItems];
        return reindexItems(combinedItems);
      });

      // Clear the file input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRemoveItem = (index: number) => {
    setItems((current) => {
      const filtered = current.filter((_, itemIndex) => itemIndex !== index);
      return reindexItems(filtered);
    });
  };

  const uomSuggestionOptions = useMemo(() => {
    const seen = new Set<string>();
    return descriptionOptions.reduce<{ id: string; value: string }[]>((list, option) => {
      const value = option.uom?.trim();
      if (!value || seen.has(value.toLowerCase())) return list;
      seen.add(value.toLowerCase());
      return [...list, { id: option.id, value }];
    }, []);
  }, [descriptionOptions]);

  const codeSuggestionOptions = useMemo(() => {
    return descriptionOptions.map((option) => ({ id: option.id, value: option.code }));
  }, [descriptionOptions]);

  const lineCount = useMemo(() => items.length, [items]);

  const subTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items]
  );

  const vat = useMemo(() => parseFloat((subTotal * 0.15).toFixed(2)), [subTotal]);

  const total = useMemo(() => parseFloat((subTotal + vat).toFixed(2)), [subTotal, vat]);

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
        code: item.code?.trim() || '',
        uom: item.uom.trim(),
        description: item.description.trim(),
        unitPrice: parseFloat(item.unitPrice.toFixed(2)),
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="secondary" onClick={handleDownloadTemplate}>
                Download Template
              </button>
              <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
                Upload Items
              </button>
              <button type="button" className="secondary" onClick={handleAddItem}>
                Add line
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              style={{ display: 'none' }}
            />
          </div>
          <div className="items-grid">
            <div className="item-row header">
              <span>Item</span>
              <span>Qty</span>
              <span>Code</span>
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
                  options={codeSuggestionOptions}
                  value={item.code ?? ''}
                  onChange={(value) => handleUpdateItem(index, 'code', value)}
                  placeholder="Select or type code"
                />
                <SuggestionInput
                  options={uomSuggestionOptions}
                  value={item.uom}
                  onChange={(value) => handleUpdateItem(index, 'uom', value)}
                  placeholder="Select or type UOM"
                  required
                />
                <SuggestionInput
                  options={descriptionOptions.map((option) => ({ id: option.id, value: option.description }))}
                  value={item.description}
                  onChange={(value) => handleUpdateItem(index, 'description', value)}
                  placeholder="Select or type description"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) => handleUpdateItem(index, 'unitPrice', event.target.value)}
                  required
                />
                <input value={formatAmount(item.totalPrice)} disabled />
                <button
                  type="button"
                  className="danger small remove-line-button"
                  title="Remove line"
                  aria-label="Remove line"
                  onClick={() => handleRemoveItem(index)}
                >
                  −
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="quote-summary" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <div style={{ width: '280px' }}>
            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="summary-label">Subtotal</span>
              <span className="summary-value">{formatAmount(subTotal)}</span>
            </div>
            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="summary-label">VAT (15%)</span>
              <span className="summary-value">{formatAmount(vat)}</span>
            </div>
            <div className="summary-row summary-total" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #334155', paddingTop: '8px', marginTop: '4px' }}>
              <span className="summary-label">Total</span>
              <span className="summary-value">{formatAmount(total)}</span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSaving || items.length === 0}>
            {isSaving ? 'Saving…' : submitLabel}
          </button>
          <button type="button" className="secondary" onClick={handleAddItem}>
            Add line
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
