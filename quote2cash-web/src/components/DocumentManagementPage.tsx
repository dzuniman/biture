import React, { useState, useEffect } from 'react';
import DocumentForm from './DocumentForm';
import { getDocuments, deleteDocument, downloadDocument } from '../api';
import { DocumentResponse } from '../types';

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentResponse | undefined>();
  const [loading, setLoading] = useState(true);

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
              {documents.map(doc => (
                <tr key={doc.id}>
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
              ))}
              {documents.length === 0 && (
                <tr><td colSpan={4} style={{textAlign: 'center'}}>No documents found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}