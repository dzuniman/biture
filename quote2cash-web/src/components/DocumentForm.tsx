import React, { useState } from 'react';
import { createDocument, updateDocument } from '../api';
import { DocumentFolder, DocumentResponse } from '../types';

interface Props {
  document?: DocumentResponse;
  onSuccess: () => void;
  onCancel: () => void;
  folders: DocumentFolder[];
  defaultFolderId?: string | null;
}

export default function DocumentForm({ document, onSuccess, onCancel, folders, defaultFolderId = null }: Props) {
  const [name, setName] = useState(document?.documentName || '');
  const [description, setDescription] = useState(document?.description || '');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(document?.folderId ?? defaultFolderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (document) {
        // Update existing metadata
        await updateDocument(document.id, {
          documentName: name,
          description: description,
          folderId,
        });
      } else {
        // Upload new document
        if (!file) {
          alert('Please select a file');
          setSaving(false);
          return;
        }
        const formData = new FormData();
        formData.append('documentName', name);
        formData.append('description', description);
        if (folderId) formData.append('folderId', folderId);
        formData.append('file', file);
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
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        padding: '24px',
        color: '#0f172a',
        maxWidth: '650px'
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
              Document Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Terms and Conditions"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Folder Location</label>
            <select
              value={folderId ?? ''}
              onChange={e => setFolderId(e.target.value || null)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: 'white' }}
            >
              <option value="">Root documents</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.parentId ? '↳ ' : ''}{folder.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Briefly describe this document"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', minHeight: '80px' }}
          />
        </div>

        {!document && (
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
              File Upload <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#f8fafc' }}
            />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '12px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          <button type="button" onClick={onCancel} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{ padding: '8px 20px', fontSize: '0.88rem', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px' }}
          >
            {saving ? 'Saving...' : document ? 'Update Document' : 'Upload Document'}
          </button>
        </div>
      </form>
    </div>
  );
}