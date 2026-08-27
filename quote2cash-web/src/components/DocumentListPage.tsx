import { useMemo, useState } from 'react';
import type { DocumentFolder, DocumentResponse } from '../types';
import SearchBox from './SearchBox';
import Pagination from './Pagination';
import TableHeader from './TableHeader';
import useTableSort from '../hooks/useTableSort';

interface Props {
  documents: DocumentResponse[];
  folders: DocumentFolder[];
  currentFolderId: string | null;
  onFolderChange: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onEditFolder: (folder: DocumentFolder) => void;
  onDeleteFolder: (folder: DocumentFolder) => void;
  onEdit: (document: DocumentResponse) => void;
  onDelete: (documentId: string) => void;
  onCreateNew: () => void;
  onDownload: (document: DocumentResponse) => void;
  onBack: () => void; // Added onBack prop
}

const ITEMS_PER_PAGE = 10;

export default function DocumentListPage({
  documents,
  folders,
  currentFolderId,
  onFolderChange,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onEdit,
  onDelete,
  onCreateNew,
  onDownload,
  onBack // Destructure onBack
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const visibleFolders = folders.filter(folder => (folder.parentId ?? null) === currentFolderId);
  const filteredDocuments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const inFolder = documents.filter(doc => (doc.folderId ?? null) === currentFolderId);
    if (!term) return inFolder;

    return inFolder.filter(
      (doc) =>
        (doc.documentName?.toLowerCase() || '').includes(term) ||
        (doc.description?.toLowerCase() || '').includes(term)
    );
  }, [documents, searchTerm, currentFolderId]);

  const { sortedData, sortKey, sortDirection, setSort } = useTableSort(filteredDocuments);
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedDocuments = sortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // pagination handled via sortedData above

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
          <button onClick={onCreateNew} className="btn-primary-lg">
            + New Document
          </button>
        </div>
      </div>

      <SearchBox
        placeholder="Search documents by name or description..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '16px 0' }}>
        <button type="button" className="btn-secondary small" onClick={() => onFolderChange(null)}>Root</button>
        {currentFolderId && <button type="button" className="btn-secondary small" onClick={() => onFolderChange(folders.find(f => f.id === currentFolderId)?.parentId ?? null)}>Up</button>}
        {visibleFolders.map(folder => (
          <span key={folder.id} style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
            <button type="button" className="btn-secondary small" onClick={() => onFolderChange(folder.id)}>Folder: {folder.name}</button>
            <button type="button" className="btn-secondary small" title="Rename folder" onClick={() => onEditFolder(folder)}>Edit</button>
            <button type="button" className="btn-secondary small" title="Delete empty folder" onClick={() => onDeleteFolder(folder)}>Delete</button>
          </span>
        ))}
        <button type="button" className="btn-secondary small" onClick={() => onCreateFolder(currentFolderId)}>+ Folder</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <TableHeader columnKey="documentName" label="Document Name" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
              <TableHeader columnKey="description" label="Description" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
              <TableHeader columnKey="uploadedAt" label="Uploaded At" sortKey={sortKey} sortDirection={sortDirection} onSort={setSort} />
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
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => onDownload(document)} className="btn-secondary small" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'black' }}>
                        Download
                      </button>
                      <button type="button" onClick={() => onEdit(document)} className="btn-secondary small" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'green' }}>
                        Edit
                      </button>
                      <button type="button" onClick={() => onDelete(document.id)} className="btn-secondary small" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'darkred' }}>
                        Delete
                      </button>
                    </div>
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