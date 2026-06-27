import { useMemo, useState } from 'react';
import type { Client } from '../types';
import SearchBox from './SearchBox';
import Pagination from './Pagination';
import TableHeader from './TableHeader';
import useTableSort from '../hooks/useTableSort';

interface Props {
  clients: Client[];
  onEdit: (client: Client) => void;
  onView: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onCreateNew: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function ClientsListPage({
  clients,
  onEdit,
  onView,
  onDelete,
  onCreateNew
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return clients;

    return clients.filter((client) =>
      (client.name?.toLowerCase() || '').includes(term) ||
      client.vendorNumber?.toLowerCase().includes(term) ||
      client.representativeName?.toLowerCase().includes(term) ||
      (client.representativeNumber || '').includes(term)
    );
  }, [clients, searchTerm]);

  const { sortedData, sortKey, sortDirection, setSort } = useTableSort(filteredClients);
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedClients = sortedData.slice(
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
          <h2>Clients</h2>
          <p>Manage your client profiles and information</p>
        </div>
        <button onClick={onCreateNew} className="btn-primary-lg">
          + New Client
        </button>
      </div>

      <SearchBox
        placeholder="Search clients by name, representative, or phone..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th><TableHeader columnKey="name" label="Name" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="vatNumber" label="VAT Number" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="vendorNumber" label="Vendor #" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="representativeName" label="Representative" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th><TableHeader columnKey="representativeNumber" label="Phone" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} /></th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.length === 0 ? (
              <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
                <td colSpan={6} className="empty-row" style={{ textAlign: 'center' }}>
                  {searchTerm ? 'No clients match your search.' : 'No clients found. Click "+ New Client" to add one.'}
                </td>
              </tr>
            ) : (
              paginatedClients.map((client) => (
                <tr
                  key={client.id}
                  style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}
                  className="table-row-dark-hover"
                >
                  <td>{client.name}</td>
                  <td>{client.vatNumber || '—'}</td>
                  <td>{client.vendorNumber || '—'}</td>
                  <td>{client.representativeName || '—'}</td>
                  <td>{client.representativeNumber || '—'}</td>
                  <td className="actions-row">
                    <button type="button" onClick={() => onView(client)}>
                      View
                    </button>
                    <button type="button" onClick={() => onEdit(client)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => onDelete(client.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredClients.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredClients.length}
          />
      )}
    </div>
  );
}
