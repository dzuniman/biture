import React from 'react';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100, 0] // 0 means 'All'
}: Props) {
  const isShowAll = itemsPerPage === 0;

  const startItem = totalItems === 0 ? 0 : isShowAll ? 1 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = isShowAll ? totalItems : Math.min(currentPage * itemsPerPage, totalItems);

  // Generate truncated page numbers range (e.g. 1 ... 4 5 6 ... 20)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '12px',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.85rem',
        color: '#64748b',
        background: '#ffffff',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <div>
        Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> items
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {onPageSizeChange && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569' }}>
            Rows:
            <select
              value={itemsPerPage}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                cursor: 'pointer',
                background: '#f8fafc'
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 0 ? 'All' : opt}
                </option>
              ))}
            </select>
          </label>
        )}

        {!isShowAll && totalPages > 1 && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                color: currentPage === 1 ? '#94a3b8' : '#334155',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
              title="First Page"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                color: currentPage === 1 ? '#94a3b8' : '#334155',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              Previous
            </button>

            {getPageNumbers().map((p, idx) => (
              <React.Fragment key={idx}>
                {typeof p === 'number' ? (
                  <button
                    type="button"
                    onClick={() => onPageChange(p)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: p === currentPage ? '1px solid #0284c7' : '1px solid #cbd5e1',
                      background: p === currentPage ? '#0284c7' : '#ffffff',
                      color: p === currentPage ? '#ffffff' : '#334155',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: p === currentPage ? 700 : 500
                    }}
                  >
                    {p}
                  </button>
                ) : (
                  <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
                )}
              </React.Fragment>
            ))}

            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                color: currentPage === totalPages ? '#94a3b8' : '#334155',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                color: currentPage === totalPages ? '#94a3b8' : '#334155',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
              title="Last Page"
            >
              »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
