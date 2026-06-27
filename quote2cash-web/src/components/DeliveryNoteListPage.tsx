import { useState, useMemo } from 'react';
import type { DeliveryNote } from '../types';
import SearchBox from './SearchBox';
import TableHeader from './TableHeader';
import Pagination from './Pagination';
import useTableSort from '../hooks/useTableSort';

interface Props {
  deliveryNotes: DeliveryNote[];
  onView: (deliveryNote: DeliveryNote) => void;
  onEdit: (deliveryNote: DeliveryNote) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function DeliveryNoteListPage({
  deliveryNotes,
  onView,
  onEdit,
  onDelete,
  onCreateNew
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredDeliveryNotes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return deliveryNotes;

    return deliveryNotes.filter(
      (dn) =>
        (dn.deliveryNoteNumber?.toLowerCase() || '').includes(term) ||
        (dn.quoteNumber?.toLowerCase() || '').includes(term) ||
        (dn.reference?.toLowerCase() || '').includes(term) ||
        (dn.description?.toLowerCase() || '').includes(term) ||
        (dn.client?.name?.toLowerCase() || '').includes(term)
    );
  }, [deliveryNotes, searchTerm]);

  const { sortedData, sortKey, sortDirection, setSort } = useTableSort(filteredDeliveryNotes);
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedDeliveryNotes = sortedData.slice(
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
          <h2>Delivery Notes</h2>
          <p>Manage and track delivery notes</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Delivery Note
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">Total Delivery Notes</span>
          <span className="stat-value">{filteredDeliveryNotes.length}</span>
        </div>
      </div>

      <SearchBox
        placeholder="Search delivery notes by number, quote, reference, description, or client..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th><TableHeader columnKey="deliveryNoteNumber" label="Delivery Note Number" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="quoteNumber" label="Quote Number" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="reference" label="Reference" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="description" label="Description" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="client" label="Client" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="createdAt" label="Created" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDeliveryNotes.length === 0 ? (
              <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
                <td colSpan={7} className="empty-row" style={{ textAlign: 'center' }}>
                  {searchTerm ? 'No delivery notes match your search.' : 'No delivery notes found. Click "+ New Delivery Note" to get started.'}
                </td>
              </tr>
            ) : (
              paginatedDeliveryNotes.map((dn) => (
                <tr
                  key={dn.id}
                  style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}
                  className="table-row-dark-hover"
                >
                  <td>{dn.deliveryNoteNumber}</td>
                  <td>{dn.quoteNumber}</td>
                  <td>{dn.reference || '—'}</td>
                  <td>{dn.description || '—'}</td>
                  <td>{dn.client?.name || '—'}</td>
                  <td>
                    {dn.createdAt ? new Date(dn.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="actions-row">
                    <button type="button" onClick={() => onView(dn)}>
                      View
                    </button>
                    <button type="button" onClick={() => onEdit(dn)}>
                      Edit
                    </button>
                    <button type="button" className="danger" onClick={() => onDelete(dn.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredDeliveryNotes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredDeliveryNotes.length}
        />
      )}
    </div>
  );
}
