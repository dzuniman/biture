import { useMemo, useState } from 'react';
import { formatAmount } from '../../formatters';
import type { Quote } from '../types';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import TableHeader from './TableHeader';
import useTableSort from '../hooks/useTableSort';

interface Props {
  quotes: Quote[];
  onEdit: (quote: Quote) => void;
  onView: (quote: Quote) => void;
  onDelete: (quoteId: string) => void;
  onDuplicate: (quote: Quote) => void;
  onCreateNew: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function QuotesListPage({
  quotes,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  onCreateNew
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredQuotes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return quotes;

    return quotes.filter(
      (quote) =>
        (quote.reference?.toLowerCase() || '').includes(term) ||
        (quote.client?.name?.toLowerCase() || '').includes(term) ||
        (quote.quoteNumber?.toString() || '').includes(term) ||
        (quote.vendorNumber?.toLowerCase() || '').includes(term)
    );
  }, [quotes, searchTerm]);

  const { sortedData, sortKey, sortDirection, setSort } = useTableSort(filteredQuotes);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedQuotes = sortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalValue = filteredQuotes.reduce((sum, quote) => sum + quote.total, 0);

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Quotes</h2>
          <p>Manage and track quotations</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Quote
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">Total Quotes</span>
          <span className="stat-value">{filteredQuotes.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Value</span>
          <span className="stat-value">{formatAmount(totalValue)}</span>
        </div>
      </div>

      <SearchBar
        placeholder="Search quotes by reference, client, number, or vendor..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      {paginatedQuotes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>No quotes found</h3>
          <p>
            {filteredQuotes.length === 0 && searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first quote'}
          </p>
          {!searchTerm && <button type="button" onClick={onCreateNew} className="btn-primary">
            Create Quote
          </button>}
        </div>
      ) : (
        <>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <TableHeader columnKey="quoteNumber" label="Quote" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
                  <TableHeader columnKey="reference" label="Reference" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
                  <TableHeader columnKey="clientName" label="Client" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
                  <TableHeader columnKey="date" label="Date" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
                  <TableHeader columnKey="total" label="Total" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuotes.map((quote) => (
                  <tr key={quote.id} style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }} className="table-row-dark-hover">
                    <td>{quote.quoteNumber}</td>
                    <td>{quote.reference || '—'}</td>
                    <td>{quote.client?.name ?? '—'}</td>
                    <td>{new Date(quote.date).toLocaleDateString()}</td>
                    <td>{formatAmount(quote.total)}</td>
                    <td className="actions-row">
                      <button type="button" onClick={() => onView(quote)}>
                        View
                      </button>
                      <button type="button" onClick={() => onEdit(quote)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => onDuplicate(quote)}>
                        Duplicate
                      </button>
                      <button type="button" className="danger" onClick={() => onDelete(quote.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredQuotes.length}
          />
        </>
      )}
    </div>
  );
}
