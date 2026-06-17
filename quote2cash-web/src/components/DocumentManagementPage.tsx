import React, { useState, useEffect, useMemo } from 'react';
import DocumentForm from './DocumentForm';
import { getDocuments, deleteDocument, downloadDocument } from '../api';
import { DocumentResponse } from '../types';

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentResponse | undefined>();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(id);
        await fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const data = await downloadDocument(id);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const filteredDocuments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((doc) =>
      (doc.documentName?.toLowerCase() || '').includes(term) ||
      (doc.description?.toLowerCase() || '').includes(term)
    );
  }, [documents, searchTerm]);

  if (isEditing) {
    return (
      <div className="page-section">
        <h2>{selectedDoc ? 'Edit Document' : 'Upload New Document'}</h2>
        <DocumentForm 
          document={selectedDoc} 
          onSuccess={() => { setIsEditing(false); fetchDocuments(); }}
          onCancel={() => setIsEditing(false)} 
        />
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Documents Management</h2>
          <p>Manage your business documents and templates.</p>
        </div>
        <button onClick={() => { setSelectedDoc(undefined); setIsEditing(true); }} className="btn-primary">
          + Add Document
        </button>
      </div>

      <div className="management-container">
        {loading ? (
          <p>Loading documents...</p>
        ) : (
          <>
            <div className="table-toolbar">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search documents by name or description..."
                className="search-input"
              />
            </div>
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.length === 0 ? (
                    <tr style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }}>
                      <td colSpan={4} className="empty-row" style={{textAlign: 'center'}}>
                        No documents found.
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map(doc => (
                      <tr key={doc.id} style={{ backgroundColor: 'hsl(240, 21%, 18%)', color: '#FFFFFF' }} className="table-row-dark-hover">
                        <td>{doc.documentName}</td>
                        <td>{doc.description || '-'}</td>
                        <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => handleDownload(doc.id, doc.documentName)} className="btn-small">
                              Download
                            </button>
                            <button onClick={() => { setSelectedDoc(doc); setIsEditing(true); }} className="btn-small">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(doc.id)} className="btn-small btn-danger">
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
          </>
        )}
      </div>
    </div>
  );
}