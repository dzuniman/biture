import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import { formatAmount } from '../../formatters';
import * as XLSX from 'xlsx';
import type { Client, Quote, QuoteCreateRequest, QuoteItemCreateRequest, QuoteDescription } from '../types';
import { getQuoteNextNumber, uploadQuoteItemImage, getQuoteItemImageUrl } from '../api';

// Define the expected API response structure for next numbers
interface NextNumberApiResponse {
  nextQuoteNumber?: string;
  NextQuoteNumber?: string;
  nextInvoiceNumber?: string;
  NextInvoiceNumber?: string;
  nextNumber?: string;
  NextNumber?: string;
}

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

type QuoteFormItem = QuoteItemCreateRequest & { unitPricePreview: number; imagePreview?: string; };

interface SuggestionInputProps {
  options: SuggestionOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

// Utility: fetch image securely and return blob URL
async function fetchSecureImage(imagePath: string): Promise<string | undefined> {
  if (!imagePath) return undefined;

  const token = localStorage.getItem("token");
  const url = getQuoteItemImageUrl(imagePath);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Unauthorized");

    const blob = await res.blob();
    return URL.createObjectURL(blob); // 👈 returns a string blob URL
  } catch (err) {
    console.error("Failed to load image", err);
    return undefined;
  }
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

const blankItem: QuoteFormItem = {
  itemNumber: 1,
  quantity: 1,
  code: '',
  uom: '',
  description: '',
  unitPrice: 0,
  unitPricePreview: 0,
  totalPrice: 0,
  imagePath: null,
  imagePreview: ''
};

const getActualUnitPrice = (previewPrice: number, marginPercent: number) =>
  parseFloat((previewPrice * (1 + marginPercent / 100)).toFixed(2));

const getBaseUnitPrice = (actualPrice: number, marginPercent: number) =>
  parseFloat((marginPercent > 0 ? actualPrice / (1 + marginPercent / 100) : actualPrice).toFixed(2));

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
  const [isFetchingQuoteNumber, setIsFetchingQuoteNumber] = useState(false); // NEW: Loading state
  const [quoteNumberError, setQuoteNumberError] = useState<string | null>(null); // NEW: Error state

  const [reference, setReference] = useState(initialData?.reference ?? '');
  const [poNumber, setPoNumber] = useState(initialData?.poNumber ?? '');
  const [date, setDate] = useState(initialData?.date ? initialData.date.slice(0, 10) : today);
  const [validityDays, setValidityDays] = useState(initialData?.validityDays.toString() ?? '30');
  const [items, setItems] = useState<QuoteFormItem[]>(initialData?.items?.length ? initialData.items.map((item) => ({ ...item, unitPricePreview: getBaseUnitPrice(item.unitPrice, initialData?.margin ?? 0) })) : [blankItem]);
  const [margin, setMargin] = useState<number>(initialData?.margin ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('QuoteForm: Initializing form state. initialData:', initialData, 'isDuplicate:', isDuplicate, 'selectedClientId:', selectedClientId); // eslint-disable-line no-console
    if (initialData) {
      setClientId(initialData.clientId ?? '');
      setQuoteNumber(isDuplicate ? '' : (initialData.quoteNumber ?? ''));
      setReference(initialData.reference);
      setPoNumber(initialData.poNumber ?? '');
      setDate(initialData.date ? initialData.date.slice(0, 10) : today);
      setValidityDays(initialData.validityDays.toString());
      setMargin(initialData.margin ?? 0);
      const sorted = [...(initialData.items || [])].sort((a, b) => a.itemNumber - b.itemNumber);
      const baseItems = sorted.map((item) => ({ ...item, unitPricePreview: getBaseUnitPrice(item.unitPrice, initialData.margin ?? 0), imagePreview: undefined }));
      setItems(baseItems);
      // Then fetch previews asynchronously
      (async () => {
        const withPreviews = await Promise.all(
          baseItems.map(async (item) => {
            if (item.imagePath) {
              const previewUrl = await fetchSecureImage(item.imagePath);
              return { ...item, imagePreview: previewUrl };
            }
            return item;
          })
        );
        setItems(withPreviews);
      })();
    } else { // This block runs for a brand new quote or when duplicating
      setClientId(selectedClientId ?? '');
      setQuoteNumber('');
      setReference('');
      setPoNumber('');
      setDate(today);
      setValidityDays('30');
      setMargin(0);
      setItems([blankItem]);
    }
  }, [initialData, today, isDuplicate, selectedClientId]); // Re-added selectedClientId to dependencies

  useEffect(() => {
    console.log('QuoteForm: Autopopulation effect running. initialData:', initialData, 'isDuplicate:', isDuplicate, 'current quoteNumber:', quoteNumber); // eslint-disable-line no-console
    // Only fetch if creating new or duplicating, and quoteNumber is currently empty
    if ((!initialData || isDuplicate) && quoteNumber === '') {
      console.log('QuoteForm: Condition met for fetching next quote number.'); // eslint-disable-line no-console
      setIsFetchingQuoteNumber(true); // NEW: Set loading true
      setQuoteNumberError(null); // NEW: Clear previous errors

      // Generate prefix for quote number (e.g., QYYYYMM)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const quotePrefix = `Q${year}${month}`;

      getQuoteNextNumber(quotePrefix).then((res: NextNumberApiResponse | string) => { // Pass prefix
        console.log('QuoteForm: getQuoteNextNumber API response:', res); // eslint-disable-line no-console
        // Extract number from object response
        const next = typeof res === 'object' && res !== null
          ? (res.nextQuoteNumber || res.NextQuoteNumber || res.nextNumber || res.NextNumber || res.nextInvoiceNumber)
          : res;
        if (next) {
          const rawStr = String(next);
          const formatted = rawStr.startsWith('Q') ? rawStr : `${quotePrefix}${rawStr.padStart(4, '0')}`; // Ensure prefix is included
          console.log('QuoteForm: Successfully extracted next number:', formatted); // eslint-disable-line no-console
          setQuoteNumber(formatted);
        } else {
          console.warn('QuoteForm: API response for next number was empty or invalid:', res); // eslint-disable-line no-console
          setQuoteNumberError('Failed to generate number. Please enter manually.'); // NEW: Set error
        }
      }).catch((err) => { // eslint-disable-line no-console
        console.error('QuoteForm: Error fetching next quote number:', err); // eslint-disable-line no-console
        setQuoteNumberError('Failed to fetch next number. Please enter manually.'); // NEW: Set error
        // silenced, number will remain blank until available
      }).finally(() => {
        setIsFetchingQuoteNumber(false); // NEW: Set loading false
      });
    } else { // eslint-disable-line no-console
      console.log('QuoteForm: Autopopulation condition NOT met. Reason: initialData:', initialData, 'isDuplicate:', isDuplicate, 'quoteNumber:', quoteNumber); // eslint-disable-line no-console
    }
  }, [initialData, quoteNumber, isDuplicate, date]); // Added 'date' to dependencies for prefix

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

  const reindexItems = (currentItems: QuoteFormItem[]) => {
    return currentItems.map((item, index) => ({ ...item, itemNumber: index + 1 }));
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
        const basePrice = Number(value);
        item.unitPricePreview = basePrice;
        item.unitPrice = getActualUnitPrice(basePrice, margin);
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

  // Example: preload preview when setting image
  const handleSetItemImage = async (index: number, imagePath: string | null) => {
    const previewUrl = imagePath ? await fetchSecureImage(imagePath) : undefined;

    setItems((current) => {
      const next = [...current];
      next[index] = { ...next[index], imagePath, imagePreview: previewUrl };
      return next;
    });
  };


  const handleImageUpload = async (index: number, file: File) => {
    try {
      const path = await uploadQuoteItemImage(file);
      handleSetItemImage(index, path);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleRemoveImage = (index: number) => {
    handleSetItemImage(index, null);
  };

  const handleInsertItem = (index: number) => {
    setItems((current) => {
      const next = [...current];
      next.splice(index + 1, 0, {
        itemNumber: 0, // will be reassigned by reindexItems
        quantity: 1,
        code: '',
        uom: '',
        description: '',
        unitPrice: 0,
        unitPricePreview: 0,
        totalPrice: 0,
        imagePath: null,
        imagePreview: ''
      });
      return reindexItems(next);
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
      unitPricePreview: 0,
      totalPrice: 0,
      imagePath: null,
      imagePreview: ''
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

      const newItems: QuoteFormItem[] = [];
      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        const preview = parseFloat(row[headers.indexOf('unit price')] || 0);
        const item: QuoteFormItem = {
          itemNumber: 0, // Will be re-indexed later
          code: row[headers.indexOf('code')] || '',
          quantity: parseFloat(row[headers.indexOf('quantity')] || 0),
          uom: row[headers.indexOf('uom')] || '',
          description: row[headers.indexOf('description')] || '',
          unitPricePreview: preview,
          unitPrice: getActualUnitPrice(preview, margin),
          totalPrice: 0, // Calculated below
          imagePath: null,
          imagePreview: ''
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
    return descriptionOptions.reduce<{ id: string; value: string }[]>((list, option: QuoteDescription) => {
      const value = option.uom?.trim();
      if (!value || seen.has(value.toLowerCase())) return list;
      seen.add(value.toLowerCase());
      return [...list, { id: option.id, value }];
    }, []);
  }, [descriptionOptions]);

  const codeSuggestionOptions = useMemo(() => {
    return descriptionOptions.map((option: QuoteDescription) => ({ id: option.id, value: option.code }));
  }, [descriptionOptions]);

  const lineCount = useMemo(() => items.length, [items]);

  const subTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items]
  );

  const vat = useMemo(() => parseFloat((subTotal * 0.15).toFixed(2)), [subTotal]);

  const total = useMemo(() => parseFloat((subTotal + vat).toFixed(2)), [subTotal, vat]);

  const handleMarginChange = (value: string) => {
    const newMargin = Math.max(0, Number(value));
    setMargin(newMargin);
    // Reapply margin to all current items based on their stored totalPrice/quantity ratio
    setItems((current) =>
      current.map((item) => {
        const baseUnitPrice = getBaseUnitPrice(item.unitPrice, margin);
        const newActual = getActualUnitPrice(baseUnitPrice, newMargin);
        return {
          ...item,
          unitPricePreview: parseFloat(baseUnitPrice.toFixed(2)),
          unitPrice: newActual,
          totalPrice: parseFloat((item.quantity * newActual).toFixed(2))
        };
      })
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    await onSubmit({
      clientId: clientId || undefined,
      quoteNumber: quoteNumber.trim(),
      reference: reference.trim(),
      poNumber: poNumber.trim() || undefined,
      date: date || new Date().toISOString(),
      validityDays: Number(validityDays),
      margin,
      items: items.map((item) => ({
        itemNumber: item.itemNumber,
        quantity: item.quantity,
        code: item.code?.trim() || '',
        uom: item.uom.trim(),
        description: item.description.trim(),
        unitPrice: parseFloat(item.unitPrice.toFixed(2)),
        totalPrice: Number((item.quantity * item.unitPrice).toFixed(2)),
        imagePath: item.imagePath
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
              {clients.map((client: Client) => (
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
        <div className="grid-2">
          <label>
            Quote number
            <input
              type="text"
              value={isFetchingQuoteNumber ? 'Loading...' : quoteNumber} // NEW: Show loading state
              onChange={(event) => {
                setQuoteNumber(event.target.value);
                setQuoteNumberError(null); // NEW: Clear error on manual input
              }}
              placeholder="Qyyyymm0000"
              required
              disabled={isFetchingQuoteNumber} // NEW: Disable input while loading
            />
            {quoteNumberError && <p style={{ color: 'red', fontSize: '0.8em' }}>{quoteNumberError}</p>} {/* NEW: Display error */}
          </label>
          <label>
            Margin (%)
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={margin}
              onChange={(event) => handleMarginChange(event.target.value)}
              placeholder="0"
            />
          </label>
        </div>
        <label>
          Reference
          <input value={reference} onChange={(event) => setReference(event.target.value)} required />
        </label>
        <label>
          PO Number (Optional)
          <input value={poNumber} onChange={(event) => setPoNumber(event.target.value)} placeholder="Enter PO Number" />
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
            <div className="item-row header" style={{ gridTemplateColumns: '50px 60px 100px 100px 1fr 100px 100px 100px 80px 80px' }}>
              <span>Item</span>
              <span>Qty</span>
              <span>Code</span>
              <span>UOM</span>
              <span>Description</span>
              <span>Unit Price</span>
              <span>Unit Price M</span>
              <span>Total price</span>
              <span>Image</span>
              <span style={{ textAlign: 'center' }}>Actions</span>
            </div>
            {items.map((item, index) => (
              <div key={index} className="item-row" style={{ gridTemplateColumns: '50px 60px 100px 100px 1fr 100px 100px 100px 80px 80px' }}>
                <input
                  type="number"
                  min="1"
                  value={item.itemNumber}
                  onChange={(event) => handleUpdateItem(index, 'itemNumber', event.target.value)}
                  required
                  disabled
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
                  value={item.description ?? ''}
                  onChange={(value) => handleUpdateItem(index, 'description', value)}
                  placeholder="Select or type description"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  value={item.unitPricePreview}
                  onChange={(event) => handleUpdateItem(index, 'unitPrice', event.target.value)}
                  required
                />
                <input value={formatAmount(item.unitPrice)} disabled />
                <input value={formatAmount(item.totalPrice)} disabled />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  {item.imagePath ? (
                    <>
                      <a href={item.imagePreview} target="_blank" rel="noreferrer" title="Click to view full image">
                        <img src={item.imagePreview} alt="Item" style={{ width: '40px', height: '40px', objectFit: 'contain', cursor: 'pointer' }} />
                      </a>
                      <button type="button" onClick={() => handleRemoveImage(index)} style={{ padding: '2px 4px', fontSize: '10px' }} className="danger">Remove</button>
                    </>
                  ) : (
                    <>
                      <label htmlFor={`item-image-upload-${index}`} style={{ cursor: 'pointer', padding: '4px 8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}>
                        Upload
                      </label>
                      <input
                        id={`item-image-upload-${index}`}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleImageUpload(index, e.target.files[0]);
                        }}
                      />
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="secondary small"
                    title="Insert item below"
                    aria-label="Insert item below"
                    onClick={() => handleInsertItem(index)}
                    style={{
                      padding: 0,
                      width: '28px',
                      height: '28px',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: 0
                    }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="danger small remove-line-button"
                    title="Remove line"
                    aria-label="Remove line"
                    onClick={() => handleRemoveItem(index)}
                    style={{
                      padding: 0,
                      width: '28px',
                      height: '28px',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: 0
                    }}
                  >
                    −
                  </button>
                </div>
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
