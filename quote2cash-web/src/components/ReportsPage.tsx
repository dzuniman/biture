import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
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
  Cost,
  DocumentResponse
} from '../types';

export type ReportEntity =
  | 'clients'
  | 'quotes'
  | 'invoices'
  | 'statements'
  | 'jobcards'
  | 'deliverynotes'
  | 'creditnotes'
  | 'products'
  | 'tools'
  | 'costs'
  | 'documents';

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
  documents: DocumentResponse[];
  onBack?: () => void;
}

export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'select';

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  selectOptions?: string[];
  getValue?: (row: any) => any;
  format?: (val: any) => string;
}

export default function ReportsPage({
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
  documents,
  onBack
}: Props) {
  const [selectedEntity, setSelectedEntity] = useState<ReportEntity>('invoices');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<Record<string, { value?: string; valueTo?: string; matchType?: string }>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Define Column Schemas for each Entity
  const entityColumns: Record<ReportEntity, ColumnDef[]> = useMemo(() => ({
    invoices: [
      { key: 'invoiceNumber', label: 'Invoice #', type: 'text' },
      { key: 'clientName', label: 'Client Name', type: 'text', getValue: (r) => r.client?.name || r.quote?.client?.name || 'N/A' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'currency', format: (v) => formatAmount(Number(v) || 0) },
      { key: 'status', label: 'Status', type: 'select', selectOptions: ['Paid', 'Pending', 'Overdue', 'Draft', 'Sent'] },
      { key: 'createdAt', label: 'Created Date', type: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '' },
      { key: 'dueDate', label: 'Due Date', type: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '' }
    ],
    quotes: [
      { key: 'quoteNumber', label: 'Quote #', type: 'text' },
      { key: 'clientName', label: 'Client Name', type: 'text', getValue: (r) => r.client?.name || 'N/A' },
      { key: 'reference', label: 'Reference', type: 'text' },
      { key: 'poNumber', label: 'PO Number', type: 'text' },
      { key: 'subTotal', label: 'Subtotal', type: 'currency', format: (v) => formatAmount(Number(v) || 0) },
      { key: 'vat', label: 'VAT (15%)', type: 'currency', format: (v) => formatAmount(Number(v) || 0) },
      { key: 'total', label: 'Total', type: 'currency', format: (v) => formatAmount(Number(v) || 0) },
      { key: 'status', label: 'Status', type: 'select', selectOptions: ['Draft', 'Sent', 'Accepted', 'Rejected'] },
      { key: 'date', label: 'Quote Date', type: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '' },
      { key: 'validityDays', label: 'Validity (Days)', type: 'number' }
    ],
    clients: [
      { key: 'name', label: 'Client Name', type: 'text' },
      { key: 'vendorNumber', label: 'Vendor Number', type: 'text' },
      { key: 'vatNumber', label: 'VAT Number', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'representativeName', label: 'Rep Name', type: 'text' },
      { key: 'representativeNumber', label: 'Rep Phone', type: 'text' },
      { key: 'addressLine1', label: 'Address Line 1', type: 'text' },
      { key: 'createdAt', label: 'Registered Date', type: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '' }
    ],
    statements: [
      { key: 'statementNumber', label: 'Statement #', type: 'text' },
      { key: 'clientName', label: 'Client Name', type: 'text', getValue: (r) => r.client?.name || 'N/A' },
      { key: 'dueDays', label: 'Terms (Days)', type: 'number' },
      { key: 'totalPaid', label: 'Total Paid', type: 'currency', getValue: (r) => (r.items || []).reduce((s: number, i: any) => s + (Number(i.paymentAmount) || 0), 0), format: (v) => formatAmount(Number(v) || 0) },
      { key: 'createdAt', label: 'Statement Date', type: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '' }
    ],
    jobcards: [
      { key: 'jobCardNumber', label: 'Job Card #', type: 'text' },
      { key: 'quoteNumber', label: 'Quote Number', type: 'text' },
      { key: 'reference', label: 'Reference', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'createdAt', label: 'Created Date', type: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '' }
    ],
    deliverynotes: [
      { key: 'deliveryNoteNumber', label: 'Delivery Note #', type: 'text' },
      { key: 'quoteNumber', label: 'Quote Number', type: 'text' },
      { key: 'reference', label: 'Reference', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'createdAt', label: 'Created Date', type: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '' }
    ],
    creditnotes: [
      { key: 'creditNoteNumber', label: 'Credit Note #', type: 'text' },
      { key: 'clientName', label: 'Client Name', type: 'text', getValue: (r) => r.client?.name || 'N/A' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'currency', format: (v) => formatAmount(Number(v) || 0) },
      { key: 'createdAt', label: 'Created Date', type: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '' }
    ],
    products: [
      { key: 'code', label: 'Code', type: 'text' },
      { key: 'name', label: 'Product Name', type: 'text' },
      { key: 'uom', label: 'UOM', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'price', label: 'Unit Price', type: 'currency', format: (v) => formatAmount(Number(v) || 0) }
    ],
    tools: [
      { key: 'code', label: 'Tool Code', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'value', label: 'Unit Value', type: 'currency', format: (v) => formatAmount(Number(v) || 0) },
      { key: 'totalValue', label: 'Total Value', type: 'currency', getValue: (r) => (Number(r.quantity) || 0) * (Number(r.value) || 0), format: (v) => formatAmount(Number(v) || 0) },
      { key: 'inspectionDate', label: 'Last Inspection', type: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '' }
    ],
    costs: [
      { key: 'description', label: 'Cost Description', type: 'text' },
      { key: 'margin', label: 'Margin (%)', type: 'number', format: (v) => `${Number(v) || 0}%` },
      { key: 'totalQuoteAmount', label: 'Quoted Total', type: 'currency', format: (v) => formatAmount(Number(v) || 0) },
      { key: 'itemCount', label: 'Items Count', type: 'number' },
      { key: 'date', label: 'Cost Date', type: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '' }
    ],
    documents: [
      { key: 'documentName', label: 'Document Name', type: 'text' },
      { key: 'fileName', label: 'File Name', type: 'text' },
      { key: 'contentType', label: 'File Type', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'uploadedAt', label: 'Uploaded Date', type: 'date', format: (v) => v ? new Date(v).toLocaleDateString() : '' }
    ]
  }), []);

  // Raw dataset getter
  const rawData = useMemo(() => {
    switch (selectedEntity) {
      case 'clients': return clients;
      case 'quotes': return quotes;
      case 'invoices': return invoices;
      case 'statements': return statements;
      case 'jobcards': return jobCards;
      case 'deliverynotes': return deliveryNotes;
      case 'creditnotes': return creditNotes;
      case 'products': return products;
      case 'tools': return tools;
      case 'costs': return costs;
      case 'documents': return documents;
      default: return [];
    }
  }, [selectedEntity, clients, quotes, invoices, statements, jobCards, deliveryNotes, creditNotes, products, tools, costs, documents]);

  const currentColumns = entityColumns[selectedEntity];

  // Active columns based on visibility state
  const visibleColumns = useMemo(() => {
    return currentColumns.filter(col => columnVisibility[col.key] !== false);
  }, [currentColumns, columnVisibility]);

  // Reset filters when entity changes
  const handleEntityChange = (entity: ReportEntity) => {
    setSelectedEntity(entity);
    setFilters({});
    setColumnVisibility({});
    setSortConfig(null);
    setCurrentPage(1);
  };

  // Handle column visibility toggle
  const toggleColumnVisibility = (colKey: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [colKey]: prev[colKey] === false ? true : false
    }));
  };

  // Filter & Sort Logic
  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      // Global Search
      if (globalSearch.trim() !== '') {
        const searchLower = globalSearch.toLowerCase();
        const matchGlobal = currentColumns.some(col => {
          const rawVal = col.getValue ? col.getValue(row) : (row as any)[col.key];
          return String(rawVal ?? '').toLowerCase().includes(searchLower);
        });
        if (!matchGlobal) return false;
      }

      // Per Column Filters
      for (const col of currentColumns) {
        const filter = filters[col.key];
        if (!filter) continue;

        const rawVal = col.getValue ? col.getValue(row) : (row as any)[col.key];

        if (col.type === 'text') {
          if (!filter.value) continue;
          const valStr = String(rawVal ?? '').toLowerCase();
          const targetStr = filter.value.toLowerCase();
          const matchType = filter.matchType || 'contains';

          if (matchType === 'equals' && valStr !== targetStr) return false;
          if (matchType === 'startswith' && !valStr.startsWith(targetStr)) return false;
          if (matchType === 'contains' && !valStr.includes(targetStr)) return false;
        } else if (col.type === 'select') {
          if (filter.value && String(rawVal ?? '').toLowerCase() !== filter.value.toLowerCase()) {
            return false;
          }
        } else if (col.type === 'number' || col.type === 'currency') {
          const numVal = Number(rawVal) || 0;
          if (filter.value && numVal < Number(filter.value)) return false;
          if (filter.valueTo && numVal > Number(filter.valueTo)) return false;
        } else if (col.type === 'date') {
          if (!rawVal) return false;
          const dateVal = new Date(rawVal).getTime();
          if (filter.value && dateVal < new Date(filter.value).getTime()) return false;
          if (filter.valueTo) {
            const endOfDay = new Date(filter.valueTo);
            endOfDay.setHours(23, 59, 59, 999);
            if (dateVal > endOfDay.getTime()) return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      if (!sortConfig) return 0;
      const col = currentColumns.find(c => c.key === sortConfig.key);
      const valA = col?.getValue ? col.getValue(a) : (a as any)[sortConfig.key];
      const valB = col?.getValue ? col.getValue(b) : (b as any)[sortConfig.key];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const res = valA > valB ? 1 : -1;
      return sortConfig.direction === 'asc' ? res : -res;
    });
  }, [rawData, currentColumns, filters, sortConfig, globalSearch]);

  // Pagination slicing
  const paginatedData = useMemo(() => {
    if (pageSize === 0) return filteredData; // All
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredData.length / pageSize);

  // Financial Sum Totals for footer
  const columnSums = useMemo(() => {
    const sums: Record<string, number> = {};
    visibleColumns.forEach(col => {
      if (col.type === 'currency' || col.type === 'number') {
        sums[col.key] = filteredData.reduce((acc, row) => {
          const v = col.getValue ? col.getValue(row) : (row as any)[col.key];
          return acc + (Number(v) || 0);
        }, 0);
      }
    });
    return sums;
  }, [filteredData, visibleColumns]);

  // Export to Excel handler
  const handleExportExcel = () => {
    const exportRows = filteredData.map(row => {
      const rowData: Record<string, any> = {};
      visibleColumns.forEach(col => {
        const rawVal = col.getValue ? col.getValue(row) : (row as any)[col.key];
        if (col.type === 'currency') {
          rowData[col.label] = Number(rawVal) || 0;
        } else if (col.type === 'date' && rawVal) {
          rowData[col.label] = new Date(rawVal).toLocaleDateString();
        } else {
          rowData[col.label] = rawVal ?? '';
        }
      });
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    const sheetName = selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${selectedEntity}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="page-section" style={{ maxWidth: '100%', padding: '24px' }}>
      {/* Top Header */}
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#e6e6e6' }}>Reports & Analytics</h2>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Filter, format, hide/show columns export customized reports.
          </p>
        </div>
        {onBack && (
          <button onClick={onBack} className="btn-secondary">
            ← Back to Admin
          </button>
        )}
      </div>

      {/* Toolbar & Controls */}
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Entity Selector Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Select Report:</label>
          <select
            value={selectedEntity}
            onChange={(e) => handleEntityChange(e.target.value as ReportEntity)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontWeight: 700,
              color: '#0f172a',
              background: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <option value="invoices">Invoices Report</option>
            <option value="quotes">Quotes Report</option>
            <option value="clients">Clients Report</option>
            <option value="statements">Statements Report</option>
            <option value="jobcards">Job Cards Report</option>
            <option value="deliverynotes">Delivery Notes Report</option>
            <option value="creditnotes">Credit Notes Report</option>
            <option value="products">Products Inventory Report</option>
            <option value="tools">Tools Inventory Report</option>
            <option value="costs">Costing & Margins Report</option>
            <option value="documents">Document Audit Trail</option>
          </select>

          {/* Global Search Input */}
          <input
            type="search"
            placeholder="Search across all columns..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              minWidth: '240px',
              fontSize: '0.85rem'
            }}
          />
        </div>

        {/* Visibility & Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Column Visibility Selector Popover */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'black' }}
            >
              👁 Columns ({visibleColumns.length}/{currentColumns.length}) ▾
            </button>
            {showColumnSelector && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  zIndex: 100,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                  padding: '16px',
                  minWidth: '220px',
                  maxHeight: '320px',
                  overflowY: 'auto'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '10px' }}>
                  Toggle Visible Columns:
                </div>
                {currentColumns.map(col => (
                  <label
                    key={col.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 0',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      color: '#1e293b'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={columnVisibility[col.key] !== false}
                      onChange={() => toggleColumnVisibility(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setFilters({})}
              style={{ color: '#ef4444', borderColor: '#fca5a5' }}
            >
              Reset Filters
            </button>
          }

          {/* Export Button */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleExportExcel}
            style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📊 Export to Excel
          </button>
        </div>
      </div>

      {/* Main DataGrid Table Card */}
      <div
        className="table-card"
        style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          overflowX: 'auto'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          {/* Table Headers & Column Filters */}
          <thead>
            <tr style={{ background: '#081d31', color: '#f8fafc' }}>
              {visibleColumns.map(col => (
                <th
                  key={col.key}
                  style={{
                    padding: '12px 14px',
                    textAlign: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
                    userSelect: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <div
                    onClick={() => {
                      setSortConfig(prev => ({
                        key: col.key,
                        direction: prev?.key === col.key && prev.direction === 'asc' ? 'desc' : 'asc'
                      }));
                    }}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: col.type === 'currency' || col.type === 'number' ? 'flex-end' : 'flex-start', gap: '6px' }}
                  >
                    <span>{col.label}</span>
                    {sortConfig?.key === col.key && (
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>

            {/* Excel-style Column Filters Row */}
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {visibleColumns.map(col => (
                <td key={col.key} style={{ padding: '6px 8px' }}>
                  {col.type === 'text' && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select
                        style={{ padding: '2px 4px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        value={filters[col.key]?.matchType || 'contains'}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          [col.key]: { ...prev[col.key], matchType: e.target.value }
                        }))}
                      >
                        <option value="contains">Contains</option>
                        <option value="startswith">Starts</option>
                        <option value="equals">Exact</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={filters[col.key]?.value || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          [col.key]: { ...prev[col.key], value: e.target.value }
                        }))}
                        style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  )}

                  {col.type === 'select' && (
                    <select
                      value={filters[col.key]?.value || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        [col.key]: { ...prev[col.key], value: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">All</option>
                      {(col.selectOptions || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {(col.type === 'number' || col.type === 'currency') && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters[col.key]?.value || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          [col.key]: { ...prev[col.key], value: e.target.value }
                        }))}
                        style={{ width: '50%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters[col.key]?.valueTo || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          [col.key]: { ...prev[col.key], valueTo: e.target.value }
                        }))}
                        style={{ width: '50%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  )}

                  {col.type === 'date' && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="date"
                        title="From Date"
                        value={filters[col.key]?.value || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          [col.key]: { ...prev[col.key], value: e.target.value }
                        }))}
                        style={{ width: '50%', padding: '4px 2px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="date"
                        title="To Date"
                        value={filters[col.key]?.valueTo || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          [col.key]: { ...prev[col.key], valueTo: e.target.value }
                        }))}
                        style={{ width: '50%', padding: '4px 2px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </thead>

          {/* Rows */}
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}>
                  No matching records found for the applied filters.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    transition: 'background 0.15s'
                  }}
                >
                  {visibleColumns.map(col => {
                    const rawVal = col.getValue ? col.getValue(row) : (row as any)[col.key];
                    const formattedVal = col.format ? col.format(rawVal) : String(rawVal ?? '');

                    return (
                      <td
                        key={col.key}
                        style={{
                          padding: '10px 14px',
                          textAlign: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
                          color: col.type === 'currency' ? '#0f172a' : '#334155',
                          fontWeight: col.type === 'currency' ? 600 : 400
                        }}
                      >
                        {col.type === 'select' ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: String(rawVal).toLowerCase() === 'paid' ? '#dcfce7' : String(rawVal).toLowerCase() === 'overdue' ? '#fee2e2' : '#f1f5f9',
                              color: String(rawVal).toLowerCase() === 'paid' ? '#166534' : String(rawVal).toLowerCase() === 'overdue' ? '#991b1b' : '#475569'
                            }}
                          >
                            {formattedVal}
                          </span>
                        ) : (
                          formattedVal
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>

          {/* Footer Summary / Totals */}
          {filteredData.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f1f5f9', fontWeight: 800, borderTop: '2px solid #cbd5e1' }}>
                {visibleColumns.map((col, i) => (
                  <td
                    key={col.key}
                    style={{
                      padding: '12px 14px',
                      textAlign: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
                      color: '#0f172a'
                    }}
                  >
                    {i === 0 ? `Total (${filteredData.length} rows):` : columnSums[col.key] !== undefined ? (col.type === 'currency' ? formatAmount(columnSums[col.key]) : columnSums[col.key]) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.85rem',
          color: '#64748b'
        }}
      >
        <div>
          Showing <strong>{paginatedData.length}</strong> of <strong>{filteredData.length}</strong> records (Total dataset: {rawData.length})
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Rows per page:
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={0}>All</option>
            </select>
          </label>

          {pageSize > 0 && totalPages > 1 && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              >
                ◀ Prev
              </button>
              <span style={{ padding: '4px 8px', fontWeight: 700, color: '#0f172a' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              >
                Next ▶
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
