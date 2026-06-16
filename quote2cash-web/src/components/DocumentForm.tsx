import React, { useState } from 'react';
import { createDocument, updateDocument } from '../api';
import { DocumentResponse } from '../types';

interface Props {
  document?: DocumentResponse;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DocumentForm({ document, onSuccess, onCancel }: Props) {
  const [name, setName] = useState(document?.documentName || '');
  const [description, setDescription] = useState(document?.description || '');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (document) {
        // Update existing metadata
        await updateDocument(document.id, {
          documentName: name,
          description: description
        });
      } else {
        // Upload new document
        if (!file) {
          alert('Please select a file');
          setSaving(false);
          return;
        }
        const formData = new FormData();
        formData.append('DocumentName', name);
        formData.append('Description', description);
        formData.append('File', file);
        await createDocument(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document. It may already exist.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="management-form">
      <div className="form-group">
        <label>Document Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          required 
          placeholder="e.g. Terms and Conditions"
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Briefly describe this document"
        />
      </div>
      {!document && (
        <div className="form-group">
          <label>File</label>
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} required />
        </div>
      )}
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : document ? 'Update' : 'Upload'}
        </button>
      </div>
    </form>
  );
}