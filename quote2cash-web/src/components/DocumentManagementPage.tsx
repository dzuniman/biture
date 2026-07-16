import React, { useState, useEffect } from 'react';
import DocumentListPage from './DocumentListPage'; // New component for listing documents
import DocumentForm from './DocumentForm'; // Existing component for document form
import { getDocuments, deleteDocument, downloadDocument } from '../api'; // Assuming downloadDocument exists
import type { DocumentResponse } from '../types';


interface Props {
  onBack: () => void;
  onRefreshApp: () => Promise<void>; // To refresh documents in App.tsx after changes
}

type DocumentView = 'list' | 'manage';

export default function DocumentManagementPage({ onBack, onRefreshApp }: Props) { // Added onRefreshApp
  const [documentView, setDocumentView] = useState<DocumentView>('list');
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [editingDocument, setEditingDocument] = useState<DocumentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err: any) {
      setError('Failed to load documents: ' + (err.message || 'Unknown error'));
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCreateNew = () => {
    setEditingDocument(null);
    setDocumentView('manage');
  };

  const handleEditDocument = (doc: DocumentResponse) => {
    setEditingDocument(doc);
    setDocumentView('manage');
  };

  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setIsLoading(true);
      setError(null);
      try {
        await deleteDocument(id);
        await loadDocuments();
        await onRefreshApp(); // Refresh global app state if needed
      } catch (err: any) {
        setError('Failed to delete document: ' + (err.message || 'Unknown error'));
        console.error('Failed to delete document:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDocumentFormSuccess = async () => {
    setDocumentView('list');
    setEditingDocument(null);
    await loadDocuments();
    await onRefreshApp(); // Refresh global app state if needed
  };

  const handleDocumentFormCancel = () => {
    setDocumentView('list');
    setEditingDocument(null);
  };

  const handleDownloadDocument = async (doc: DocumentResponse) => {
    try {
      const blob = await downloadDocument(doc.id);

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Use the document name or fallback
      link.setAttribute('download', doc.documentName || 'download.pdf');

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="page-section">
      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #fecaca'
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '12px',
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading…
        </div>
      )}

      {!isLoading && documentView === 'list' && (
        <DocumentListPage
          documents={documents}
          onEdit={handleEditDocument}
          onDelete={handleDeleteDocument}
          onCreateNew={handleCreateNew}
          onDownload={handleDownloadDocument}
          onBack={onBack} // Pass onBack to DocumentListPage
        />
      )}

      {!isLoading && documentView === 'manage' && (
        <>
          <div className="section-header">
            <div>
              <h2>{editingDocument ? 'Edit Document' : 'Upload Document'}</h2>
              <p>{editingDocument ? 'Update document details' : 'Add a new document to the system'}</p>
            </div>
            <button onClick={handleDocumentFormCancel} className="btn-secondary">
              ← Back
            </button>
          </div>
          <DocumentForm
            document={editingDocument ?? undefined}
            onSuccess={handleDocumentFormSuccess}
            onCancel={handleDocumentFormCancel}
          />
        </>
      )}
    </div>
  );
}