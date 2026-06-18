import { useMemo, useState } from 'react';
import { formatAmount } from '../../formatters';
import type { Invoice } from '../types';
import SearchBar from './SearchBar';
import Pagination from './Pagination';

interface Props {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onCreateNew: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function InvoiceListPage({
  invoices,
  onEdit,
  onView,
  onDelete,
  onCreateNew
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return invoices;

    return invoices.filter(
      (invoice) =>
        (invoice.invoiceNumber?.toLowerCase() || '').includes(term) ||
        (invoice.client?.name?.toLowerCase() || '').includes(term) ||
        (invoice.quote?.reference?.toLowerCase() || '').includes(term) ||
        (invoice.status?.toLowerCase() || '').includes(term)
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
          <p>Manage and track invoices</p>
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
        placeholder="Search invoices by number, client, reference, or status..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Client</th>
              <th>Reference</th>
              <th>Amount</th>
              <th>Created</th>
              <th>Due</th>
              <th>Status</th>
              <th>Overdue</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInvoices.length === 0 ? (
              <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
                <td colSpan={9} className="empty-row" style={{ textAlign: 'center' }}>
                  {searchTerm ? 'No invoices match your search.' : 'No invoices found. Click "+ New Invoice" to get started.'}
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}
                  className="table-row-dark-hover"
                >
                    <td>{invoice.invoiceNumber}</td>
                    <td>{(invoice.client?.name || invoice.quote?.client?.name) ?? '—'}</td>
                    <td>{invoice.quote?.reference ?? '—'}</td>
                    <td>{formatAmount(invoice.amount)}</td>
                  <td>
                    {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
                  </td>
                    <td>{invoice.status}</td>
                    <td>{invoice.isOverdue ? 'Yes' : 'No'}</td>
                  <td className="actions-row">
                      <button type="button" onClick={() => onView(invoice)}>
                        View
                      </button>
                      <button type="button" onClick={() => onEdit(invoice)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => onDelete(invoice.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredInvoices.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredInvoices.length}
        />
      )}
    </div>
  );
}
