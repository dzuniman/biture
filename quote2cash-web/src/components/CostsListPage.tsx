import { useMemo, useState } from 'react';
import { formatAmount } from '../../formatters';
import type { Cost } from '../types';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import TableHeader from './TableHeader';
import useTableSort from '../hooks/useTableSort';

interface Props {
  costs: Cost[];
  onEdit: (cost: Cost) => void;
  onDelete: (costId: string) => void;
  onDuplicate: (cost: Cost) => void;
  onCreateNew: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function CostsListPage({ costs, onEdit, onDelete, onDuplicate, onCreateNew }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCosts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return costs;
    return costs.filter(
      (c) =>
        (c.description?.toLowerCase() || '').includes(term) ||
        (c.date ? new Date(c.date).toLocaleDateString() : '').includes(term)
    );
  }, [costs, searchTerm]);

  const { sortedData, sortKey, sortDirection, setSort } = useTableSort(filteredCosts);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedCosts = sortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalQuoteValue = filteredCosts.reduce((sum, c) => sum + (c.totalQuoteAmount ?? 0), 0);

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Cost Sheets</h2>
          <p>Manage pricing analysis and cost breakdowns</p>
        </div>
        <button type="button" onClick={onCreateNew} className="btn-primary-lg">
          + New Cost Sheet
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-label">Total Cost Sheets</span>
          <span className="stat-value">{filteredCosts.length}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Total Quote Value</span>
          <span className="stat-value">{formatAmount(totalQuoteValue)}</span>
        </div>
      </div>

      <SearchBar
        placeholder="Search cost sheets by description or date..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      {paginatedCosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <h3>No cost sheets found</h3>
          <p>
            {filteredCosts.length === 0 && searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by creating your first cost sheet'}
          </p>
          {!searchTerm && (
            <button type="button" onClick={onCreateNew} className="btn-primary">
              Create Cost Sheet
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <TableHeader columnKey="description" label="Description" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
                  <TableHeader columnKey="date" label="Date" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
                  <TableHeader columnKey="margin" label="Margin" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
                  <TableHeader columnKey="itemCount" label="Items" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
                  <TableHeader columnKey="totalQuoteAmount" label="Quote Value" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCosts.map((cost) => (
                  <tr key={cost.id} style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }} className="table-row-dark-hover">
                    <td>{cost.description || '—'}</td>
                    <td>{cost.date ? new Date(cost.date).toLocaleDateString() : '—'}</td>
                    <td>{cost.margin != null ? `${cost.margin}%` : '—'}</td>
                    <td>{cost.itemCount ?? (cost.items?.length ?? 0)}</td>
                    <td>{formatAmount(cost.totalQuoteAmount ?? 0)}</td>
                    <td className="actions-row">
                      <button type="button" onClick={() => onEdit(cost)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => onDuplicate(cost)}>
                        Duplicate
                      </button>
                      <button type="button" className="danger" onClick={() => onDelete(cost.id)}>
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
            totalItems={filteredCosts.length}
          />
        </>
      )}
    </div>
  );
}
