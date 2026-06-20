import { useMemo, useState } from 'react';
import type { JobCard } from '../types';
import SearchBar from './SearchBar';
import Pagination from './Pagination';

interface Props {
  jobCards: JobCard[];
  onView: (jobCard: JobCard) => void;
  onEdit: (jobCard: JobCard) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function JobCardListPage({
  jobCards,
  onView,
  onEdit,
  onDelete,
  onCreateNew
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredJobCards = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return jobCards;

    return jobCards.filter(
      (jc) =>
        (jc.jobCardNumber?.toLowerCase() || '').includes(term) ||
        (jc.quoteNumber?.toLowerCase() || '').includes(term) ||
        (jc.reference?.toLowerCase() || '').includes(term) ||
        (jc.description?.toLowerCase() || '').includes(term) ||
        (jc.client?.name?.toLowerCase() || '').includes(term)
    );
  }, [jobCards, searchTerm]);

  const totalPages = Math.ceil(filteredJobCards.length / ITEMS_PER_PAGE);
  const paginatedJobCards = filteredJobCards.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Job Cards</h2>
          <p>Manage and track job cards</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Job Card
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">Total Job Cards</span>
          <span className="stat-value">{filteredJobCards.length}</span>
        </div>
      </div>

      <SearchBar
        placeholder="Search job cards by number, quote, reference, description, or client..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Job Card Number</th>
              <th>Quote Number</th>
              <th>Reference</th>
              <th>Description</th>
              <th>Client</th>
              <th>Created</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedJobCards.length === 0 ? (
              <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
                <td colSpan={7} className="empty-row" style={{ textAlign: 'center' }}>
                  {searchTerm ? 'No job cards match your search.' : 'No job cards found. Click "+ New Job Card" to get started.'}
                </td>
              </tr>
            ) : (
              paginatedJobCards.map((jc) => (
                <tr
                  key={jc.id}
                  style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}
                  className="table-row-dark-hover"
                >
                  <td>{jc.jobCardNumber}</td>
                  <td>{jc.quoteNumber}</td>
                  <td>{jc.reference || '—'}</td>
                  <td>{jc.description || '—'}</td>
                  <td>{jc.client?.name || '—'}</td>
                  <td>
                    {jc.createdAt ? new Date(jc.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="actions-row">
                    <button type="button" onClick={() => onView(jc)}>
                      View
                    </button>
                    <button type="button" onClick={() => onEdit(jc)}>
                      Edit
                    </button>
                    <button type="button" className="danger" onClick={() => onDelete(jc.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredJobCards.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredJobCards.length}
        />
      )}
    </div>
  );
}
