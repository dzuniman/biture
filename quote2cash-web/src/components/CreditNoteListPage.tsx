import { useMemo, useState } from 'react';
import type { CreditNote } from '../types';
import SearchBox from './SearchBox';
import Pagination from './Pagination';
import { formatAmount } from '../../formatters';
import TableHeader from './TableHeader';
import useTableSort from '../hooks/useTableSort';

interface Props {
  creditNotes: CreditNote[];
  onView: (creditNote: CreditNote) => void;
  onEdit: (creditNote: CreditNote) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function CreditNoteListPage({
  creditNotes,
  onView,
  onEdit,
  onDelete,
  onCreateNew
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCreditNotes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return creditNotes;

    return creditNotes.filter(
      (cn) =>
        (cn.creditNoteNumber?.toLowerCase() || '').includes(term) ||
        (cn.description?.toLowerCase() || '').includes(term) ||
        (cn.client?.name?.toLowerCase() || '').includes(term) ||
        cn.amount.toString().includes(term)
    );
  }, [creditNotes, searchTerm]);

  const { sortedData, sortKey, sortDirection, setSort } = useTableSort(filteredCreditNotes);
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedCreditNotes = sortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCreditAmount = useMemo(() => {
    return filteredCreditNotes.reduce((sum, cn) => sum + cn.amount, 0);
  }, [filteredCreditNotes]);

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Credit Notes</h2>
          <p>Manage and track client credit notes</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Credit Note
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">Total Credit Notes</span>
          <span className="stat-value">{filteredCreditNotes.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Credited Value</span>
          <span className="stat-value" style={{ color: '#10b981' }}>{formatAmount(totalCreditAmount)}</span>
        </div>
      </div>

      <SearchBox
        placeholder="Search credit notes by number, description, or client..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th><TableHeader columnKey="creditNoteNumber" label="Credit Note Number" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="client" label="Client" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="description" label="Description" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th style={{ textAlign: 'right' }}><TableHeader columnKey="amount" label="Amount" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="createdAt" label="Created" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCreditNotes.length === 0 ? (
              <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
                <td colSpan={6} className="empty-row" style={{ textAlign: 'center' }}>
                  {searchTerm ? 'No credit notes match your search.' : 'No credit notes found. Click "+ New Credit Note" to get started.'}
                </td>
              </tr>
            ) : (
              paginatedCreditNotes.map((cn) => (
                <tr
                  key={cn.id}
                  style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}
                  className="table-row-dark-hover"
                >
                  <td>{cn.creditNoteNumber}</td>
                  <td>{cn.client?.name || '—'}</td>
                  <td>{cn.description || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatAmount(cn.amount)}</td>
                  <td>
                    {cn.createdAt ? new Date(cn.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="actions-row">
                    <button type="button" onClick={() => onView(cn)}>
                      View
                    </button>
                    <button type="button" onClick={() => onEdit(cn)}>
                      Edit
                    </button>
                    <button type="button" className="danger" onClick={() => onDelete(cn.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredCreditNotes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredCreditNotes.length}
        />
      )}
    </div>
  );
}
