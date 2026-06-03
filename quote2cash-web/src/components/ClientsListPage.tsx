import { useMemo, useState } from 'react';
import type { Client } from '../types';
import ClientCard from './ClientCard';
import SearchBar from './SearchBar';
import Pagination from './Pagination';

interface Props {
  clients: Client[];
  onEdit: (client: Client) => void;
  onView: (client: Client) => void;
  onDelete: (clientId: string) => void;
  onCreateNew: () => void;
}

const ITEMS_PER_PAGE = 9;

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

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
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

      <SearchBar
        placeholder="Search clients by name, representative, or phone..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      {paginatedClients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No clients found</h3>
          <p>
            {filteredClients.length === 0 && searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first client'}
          </p>
          {!searchTerm && <button onClick={onCreateNew} className="btn-primary">
            Create Client
          </button>}
        </div>
      ) : (
        <>
          <div className="cards-grid">
            {paginatedClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={onEdit}
                onView={onView}
                onDelete={onDelete}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredClients.length}
          />
        </>
      )}
    </div>
  );
}
