import { useMemo, useState } from 'react';
import type { DocumentResponse } from '../types';
import SearchBar from './SearchBar';
import Pagination from './Pagination';

interface Props {
  documents: DocumentResponse[];
  onEdit: (document: DocumentResponse) => void;
  onDelete: (documentId: string) => void;
  onCreateNew: () => void;
  onDownload: (document: DocumentResponse) => void;
  onBack: () => void; // Added onBack prop
}

const ITEMS_PER_PAGE = 10;

export default function DocumentListPage({
  documents,
  onEdit,
  onDelete,
  onCreateNew,
  onDownload,
  onBack // Destructure onBack
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredDocuments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return documents;

    return documents.filter(
      (doc) =>
        (doc.documentName?.toLowerCase() || '').includes(term) ||
        (doc.description?.toLowerCase() || '').includes(term)
    );
  }, [documents, searchTerm]);

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const paginatedDocuments = filteredDocuments.slice(
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
          <h2>Documents</h2>
          <p>Manage your business documents and templates.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}> {/* Added div for buttons */}
          <button onClick={onBack} className="btn-secondary"> {/* Back button */}
            ← Back
          </button>
          <button onClick={onCreateNew} className="btn-primary-lg">
            + New Document
          </button>
        </div>
      </div>

      <SearchBar
        placeholder="Search documents by name or description..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Description</th>
              <th>Uploaded At</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDocuments.length === 0 ? (
              <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
                <td colSpan={4} className="empty-row" style={{ textAlign: 'center' }}>
                  {searchTerm ? 'No documents match your search.' : 'No documents found. Click "+ New Document" to add one.'}
                </td>
              </tr>
            ) : (
              paginatedDocuments.map((document) => (
                <tr
                  key={document.id}
                  style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}
                  className="table-row-dark-hover"
                >
                  <td>{document.documentName}</td>
                  <td>{document.description}</td>
                  <td>
                    {(document as any).uploadedAt ? new Date((document as any).uploadedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="actions-row">
                    <button type="button" onClick={() => onDownload(document)}>
                      Download
                    </button>
                    <button type="button" onClick={() => onEdit(document)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => onDelete(document.id)}
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

      {filteredDocuments.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredDocuments.length}
          />
      )}
    </div>
  );
}