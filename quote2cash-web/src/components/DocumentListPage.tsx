import React, { useMemo } from 'react';
import type { DocumentFolder, DocumentResponse } from '../types';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

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
  onBack: () => void;
}

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
  onBack
}: Props) {
  // Build breadcrumb folder trail
  const folderTrail = useMemo(() => {
    const trail: DocumentFolder[] = [];
    let curr = currentFolderId ? folders.find(f => f.id === currentFolderId) : null;
    while (curr) {
      trail.unshift(curr);
      curr = curr.parentId ? folders.find(f => f.id === curr!.parentId) : null;
    }
    return trail;
  }, [currentFolderId, folders]);

  // Direct child subfolders of current folder
  const visibleFolders = useMemo(() => {
    return folders.filter(f => (f.parentId ?? null) === currentFolderId);
  }, [folders, currentFolderId]);

  // Documents in current folder
  const currentDocuments = useMemo(() => {
    return documents.filter(d => (d.folderId ?? null) === currentFolderId);
  }, [documents, currentFolderId]);

  const columns: ColumnDef<DocumentResponse>[] = useMemo(
    () => [
      {
        key: 'documentName',
        label: 'Document Name',
        type: 'text',
        render: (doc) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <span>📄</span>
            <span>{doc.documentName}</span>
          </div>
        )
      },
      { key: 'description', label: 'Description', type: 'text', getValue: r => r.description || '—' },
      {
        key: 'uploadedAt',
        label: 'Uploaded At',
        type: 'date',
        getValue: r => (r as any).uploadedAt,
        format: v => (v ? new Date(v).toLocaleDateString() : '—')
      }
    ],
    []
  );

  const renderActions = (doc: DocumentResponse) => (
    <ActionMenu
      items={[
        { label: 'Download', icon: '⬇️', onClick: () => onDownload(doc) },
        { label: 'Edit', icon: '✏️', onClick: () => onEdit(doc) },
        { label: 'Delete', icon: '🗑️', onClick: () => onDelete(doc.id), variant: 'danger' }
      ]}
    />
  );

  const parentFolder = currentFolderId ? folders.find(f => f.id === currentFolderId)?.parentId ?? null : null;

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Documents</h2>
          <p>Organize company files.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={() => onCreateFolder(currentFolderId)} className="btn-secondary">
            📁 + New Folder
          </button>
          <button type="button" onClick={onCreateNew} className="btn-primary-lg">
            📄 + New Document
          </button>
        </div>
      </div>

      {/* Google Drive Breadcrumb Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#ffffff',
          padding: '10px 16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '16px',
          fontSize: '0.9rem',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        {currentFolderId && (
          <button
            type="button"
            className="btn-secondary small"
            onClick={() => onFolderChange(parentFolder)}
            style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            ← Back
          </button>
        )}

        <span
          onClick={() => onFolderChange(null)}
          style={{
            cursor: 'pointer',
            fontWeight: currentFolderId === null ? 700 : 500,
            color: currentFolderId === null ? '#0284c7' : '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          📁 Drive Root
        </span>

        {folderTrail.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span
              onClick={() => onFolderChange(folder.id)}
              style={{
                cursor: 'pointer',
                fontWeight: index === folderTrail.length - 1 ? 700 : 500,
                color: index === folderTrail.length - 1 ? '#0284c7' : '#475569'
              }}
            >
              📁 {folder.name}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Google Drive Subfolder Cards Section */}
      {visibleFolders.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>
            FOLDERS ({visibleFolders.length})
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '12px'
            }}
          >
            {visibleFolders.map((folder) => {
              const fileCount = documents.filter(d => d.folderId === folder.id).length;
              return (
                <div
                  key={folder.id}
                  onClick={() => onFolderChange(folder.id)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.6rem' }}>📁</span>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {folder.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {fileCount} {fileCount === 1 ? 'file' : 'files'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditFolder(folder);
                      }}
                      className="btn-secondary small"
                      style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder);
                      }}
                      className="btn-secondary small"
                      style={{ fontSize: '0.7rem', padding: '2px 6px', color: '#dc2626' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Documents DataGrid */}
      <DataGrid
        columns={columns}
        data={currentDocuments}
        renderActions={renderActions}
        searchPlaceholder="Search documents in this folder..."
        emptyMessage="No documents found in this folder. Click '+ New Document' to add one."
      />
    </div>
  );
}