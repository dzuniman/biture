import React, { useState, useMemo } from 'react';
import Pagination from './Pagination';

export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'select' | 'custom';

export interface ColumnDef<T = any> {
  key: string;
  label: string;
  type?: ColumnType;
  selectOptions?: string[];
  getValue?: (row: T) => any;
  format?: (val: any) => string;
  render?: (row: T, val: any) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataGridProps<T = any> {
  columns: ColumnDef<T>[];
  data: T[];
  renderActions?: (row: T) => React.ReactNode;
  actionsHeader?: string;
  keyField?: keyof T | string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  defaultPageSize?: number;
  statsSummary?: React.ReactNode;
}

export default function DataGrid<T extends Record<string, any>>({
  columns,
  data,
  renderActions,
  actionsHeader = 'Actions',
  keyField = 'id',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No records found.',
  defaultPageSize = 10,
  statsSummary
}: DataGridProps<T>) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [filters, setFilters] = useState<Record<string, { value?: string; valueTo?: string; matchType?: string }>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [pageSize, setPageSize] = useState<number>(defaultPageSize);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const visibleColumns = useMemo(() => {
    return columns.filter(col => columnVisibility[col.key] !== false);
  }, [columns, columnVisibility]);

  const toggleColumnVisibility = (key: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [key]: prev[key] === false ? true : false
    }));
  };

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      // Global search check
      if (globalSearch.trim()) {
        const query = globalSearch.toLowerCase();
        const matchesGlobal = columns.some(col => {
          const rawVal = col.getValue ? col.getValue(row) : row[col.key];
          if (rawVal == null) return false;
          const formatted = col.format ? col.format(rawVal) : String(rawVal);
          return String(rawVal).toLowerCase().includes(query) || formatted.toLowerCase().includes(query);
        });
        if (!matchesGlobal) return false;
      }

      // Per-column filter check
      for (const col of columns) {
        const filter = filters[col.key];
        if (!filter) continue;
        const rawVal = col.getValue ? col.getValue(row) : row[col.key];
        const colType = col.type || 'text';

        if (colType === 'text' || colType === 'custom') {
          if (filter.value && filter.value.trim()) {
            const valStr = String(rawVal ?? '').toLowerCase();
            const searchVal = filter.value.toLowerCase();
            const matchType = filter.matchType || 'contains';

            if (matchType === 'contains' && !valStr.includes(searchVal)) return false;
            if (matchType === 'startswith' && !valStr.startsWith(searchVal)) return false;
            if (matchType === 'equals' && valStr !== searchVal) return false;
          }
        } else if (colType === 'select') {
          if (filter.value && filter.value !== '') {
            if (String(rawVal ?? '').toLowerCase() !== filter.value.toLowerCase()) return false;
          }
        } else if (colType === 'number' || colType === 'currency') {
          const numVal = Number(rawVal);
          if (filter.value !== undefined && filter.value !== '') {
            if (isNaN(numVal) || numVal < Number(filter.value)) return false;
          }
          if (filter.valueTo !== undefined && filter.valueTo !== '') {
            if (isNaN(numVal) || numVal > Number(filter.valueTo)) return false;
          }
        } else if (colType === 'date') {
          if (rawVal) {
            const rowDate = new Date(rawVal).getTime();
            if (filter.value) {
              const fromDate = new Date(filter.value).getTime();
              if (rowDate < fromDate) return false;
            }
            if (filter.valueTo) {
              const toDate = new Date(filter.valueTo).setHours(23, 59, 59, 999);
              if (rowDate > toDate) return false;
            }
          } else if (filter.value || filter.valueTo) {
            return false;
          }
        }
      }
      return true;
    });
  }, [data, columns, globalSearch, filters]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    const { key, direction } = sortConfig;
    const colDef = columns.find(c => c.key === key);

    return [...filteredData].sort((a, b) => {
      const valA = colDef?.getValue ? colDef.getValue(a) : a[key];
      const valB = colDef?.getValue ? colDef.getValue(b) : b[key];

      if (valA == null && valB == null) return 0;
      if (valA == null) return direction === 'asc' ? 1 : -1;
      if (valB == null) return direction === 'asc' ? -1 : 1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction === 'asc' ? valA - valB : valB - valA;
      }

      const dateA = Date.parse(valA);
      const dateB = Date.parse(valB);
      if (!isNaN(dateA) && !isNaN(dateB) && typeof valA !== 'number') {
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return direction === 'asc' ? -1 : 1;
      if (strA > strB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // Paginated Data
  const totalPages = pageSize > 0 ? Math.ceil(sortedData.length / pageSize) : 1;
  const paginatedData = useMemo(() => {
    if (pageSize === 0) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const hasActiveFilters = Object.keys(filters).some(k => filters[k]?.value || filters[k]?.valueTo) || globalSearch.trim() !== '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {statsSummary}

      {/* Toolbar controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>🔍</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Column Selector */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowColumnSelector(prev => !prev)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              ⚙️ Columns ({visibleColumns.length}/{columns.length})
            </button>

            {showColumnSelector && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  padding: '12px',
                  zIndex: 50,
                  minWidth: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Toggle Columns</div>
                {columns.map(col => (
                  <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: '#1e293b' }}>
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

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFilters({});
                setGlobalSearch('');
                setCurrentPage(1);
              }}
              style={{ color: '#ef4444', borderColor: '#fca5a5', fontSize: '0.85rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
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
          <thead>
            {/* Header Titles Row */}
            <tr style={{ background: '#081d31', color: '#f8fafc' }}>
              {visibleColumns.map(col => {
                const align = col.align || (col.type === 'currency' || col.type === 'number' ? 'right' : 'left');
                return (
                  <th
                    key={col.key}
                    style={{
                      padding: '12px 14px',
                      textAlign: align,
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
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
                        gap: '6px'
                      }}
                    >
                      <span>{col.label}</span>
                      {sortConfig?.key === col.key && (
                        <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {renderActions && (
                <th
                  style={{
                    padding: '12px 14px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    width: '1%'
                  }}
                >
                  {actionsHeader}
                </th>
              )}
            </tr>

            {/* Per-Column Filter Row - Stacked layout to save horizontal space */}
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {visibleColumns.map(col => {
                const colType = col.type || 'text';
                return (
                  <td key={col.key} style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                    {(colType === 'text' || colType === 'custom') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <select
                          style={{ width: '100%', padding: '2px 4px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff' }}
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
                          style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}

                    {colType === 'select' && (
                      <select
                        value={filters[col.key]?.value || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          [col.key]: { ...prev[col.key], value: e.target.value }
                        }))}
                        style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                      >
                        <option value="">All</option>
                        {(col.selectOptions || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {(colType === 'number' || colType === 'currency') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters[col.key]?.value || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            [col.key]: { ...prev[col.key], value: e.target.value }
                          }))}
                          style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters[col.key]?.valueTo || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            [col.key]: { ...prev[col.key], valueTo: e.target.value }
                          }))}
                          style={{ width: '100%', padding: '4px 6px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}

                    {colType === 'date' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input
                          type="date"
                          title="From Date"
                          value={filters[col.key]?.value || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            [col.key]: { ...prev[col.key], value: e.target.value }
                          }))}
                          style={{ width: '100%', padding: '4px 2px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                        <input
                          type="date"
                          title="To Date"
                          value={filters[col.key]?.valueTo || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            [col.key]: { ...prev[col.key], valueTo: e.target.value }
                          }))}
                          style={{ width: '100%', padding: '4px 2px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                        />
                      </div>
                    )}
                  </td>
                );
              })}
              {renderActions && <td style={{ padding: '6px 8px' }} />}
            </tr>
          </thead>

          {/* Rows */}
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (renderActions ? 1 : 0)}
                  style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const rowKey = row[keyField as string] || idx;
                return (
                  <tr
                    key={rowKey}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      transition: 'background 0.15s'
                    }}
                  >
                    {visibleColumns.map(col => {
                      const rawVal = col.getValue ? col.getValue(row) : row[col.key];
                      const formattedVal = col.format ? col.format(rawVal) : String(rawVal ?? '');
                      const align = col.align || (col.type === 'currency' || col.type === 'number' ? 'right' : 'left');

                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: '10px 14px',
                            textAlign: align,
                            color: col.type === 'currency' ? '#0f172a' : '#334155',
                            fontWeight: col.type === 'currency' ? 600 : 400
                          }}
                        >
                          {col.render ? (
                            col.render(row, rawVal)
                          ) : col.type === 'select' ? (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background:
                                  String(rawVal).toLowerCase() === 'paid' || String(rawVal).toLowerCase() === 'accepted'
                                    ? '#dcfce7'
                                    : String(rawVal).toLowerCase() === 'overdue' || String(rawVal).toLowerCase() === 'rejected'
                                    ? '#fee2e2'
                                    : '#f1f5f9',
                                color:
                                  String(rawVal).toLowerCase() === 'paid' || String(rawVal).toLowerCase() === 'accepted'
                                    ? '#166534'
                                    : String(rawVal).toLowerCase() === 'overdue' || String(rawVal).toLowerCase() === 'rejected'
                                    ? '#991b1b'
                                    : '#475569'
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
                    {renderActions && (
                      <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {renderActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={pageSize}
        totalItems={filteredData.length}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
