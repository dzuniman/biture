import { useMemo, useState } from 'react';
import type { Invoice } from '../types';
import InvoiceCard from './InvoiceCard';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import { formatAmount } from '../../formatters';

interface Props {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onCreateNew: () => void;
}

const ITEMS_PER_PAGE = 6;

export default function InvoiceListPage({ invoices, onView, onEdit, onDelete, onCreateNew }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return invoices;

    return invoices.filter((invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(term) ||
      invoice.status.toLowerCase().includes(term) ||
      invoice.quote?.reference.toLowerCase().includes(term) ||
      invoice.client?.name.toLowerCase().includes(term)
    );
  }, [invoices, searchTerm]);

  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalValue = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Invoices</h2>
          <p>Manage and track invoice records</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Invoice
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">Total Invoices</span>
          <span className="stat-value">{filteredInvoices.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Value</span>
          <span className="stat-value">{formatAmount(totalValue)}</span>
        </div>
      </div>

      <SearchBar
        placeholder="Search invoices by number, client, quote, or status..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      {paginatedInvoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧾</div>
          <h3>No invoices found</h3>
          <p>
            {filteredInvoices.length === 0 && searchTerm
              ? 'Try a different invoice number, quote, or status.'
              : 'Create your first invoice to get started.'}
          </p>
          {!searchTerm && (
            <button type="button" onClick={onCreateNew} className="btn-primary">
              Create Invoice
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="cards-grid cards-grid-2col">
            {paginatedInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredInvoices.length}
          />
        </>
      )}
    </div>
  );
}
