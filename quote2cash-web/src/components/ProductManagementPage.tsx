import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getProductsPage, createProduct, updateProduct, deleteProduct, uploadProductImage, getProductImageUrl, downloadProductsTemplate, uploadProductsExcel } from '../api';
import type { Product, ProductCreateRequest } from '../types';
import { formatAmount } from '../../formatters';
import Pagination from './Pagination';
import ProductViewPage from './ProductViewPage'; // Import the new view page

interface Props {
  onBack: () => void;
  onRefreshApp?: () => Promise<void>;
  onView?: (product: any) => void;
}

type EditableProductRow = {
  id?: string;
  tempId: string;
  code: string;
  name: string;
  uom: string;
  description: string;
  price: number;
  imagePath: string | null;
  isDirty?: boolean;
  isNew?: boolean;
  isSaving?: boolean;
  imagePreviewUrl?: string;
};

async function fetchSecureProductImage(imagePath: string): Promise<string | undefined> {
  if (!imagePath) return undefined;
  const token = localStorage.getItem('token');
  const url = getProductImageUrl(imagePath);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Unauthorized');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to load product image', err);
    return undefined;
  }
}

export default function ProductManagementPage({ onBack, onRefreshApp, onView }: Props) {
  const [rows, setRows] = useState<EditableProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalProducts, setTotalProducts] = useState(0);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await getProductsPage(currentPage, itemsPerPage, search);
      setTotalProducts(page.total);
      const loadedRows: EditableProductRow[] = page.data.map((product) => ({
        id: product.id,
        tempId: product.id,
        code: product.code || '',
        name: product.name || '',
        uom: product.uom || '',
        description: product.description || '',
        price: product.price || 0,
        imagePath: product.image || null,
        isDirty: false,
        isNew: false,
        imagePreviewUrl: product.image ? (product.image.startsWith('blob:') || product.image.startsWith('http') ? product.image : getProductImageUrl(product.image)) : undefined
      }));
      setRows(loadedRows);
    } catch (err: any) {
      setError('Failed to load products: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [currentPage, itemsPerPage, search]);

  const handleAddLine = () => {
    const newTempId = 'new_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newRow: EditableProductRow = {
      tempId: newTempId,
      code: '',
      name: '',
      uom: '',
      description: '',
      price: 0,
      imagePath: null,
      isDirty: true,
      isNew: true
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleFieldChange = (tempId: string, field: keyof EditableProductRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, [field]: value, isDirty: true } : r))
    );
  };

  const handleImageUpload = async (tempId: string, file: File) => {
    try {
      const uploadedPath = await uploadProductImage(file);
      const previewUrl = URL.createObjectURL(file);
      setRows((prev) =>
        prev.map((r) =>
          r.tempId === tempId
            ? { ...r, imagePath: uploadedPath, imagePreviewUrl: previewUrl, isDirty: true }
            : r
        )
      );
    } catch (err: any) {
      alert('Failed to upload image: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSaveRow = async (row: EditableProductRow) => {
    if (!row.code.trim()) {
      alert('Code is required.');
      return;
    }
    if (!row.name.trim()) {
      alert('Name is required.');
      return;
    }

    setRows((prev) => prev.map((r) => (r.tempId === row.tempId ? { ...r, isSaving: true } : r)));

    try {
      const payload: ProductCreateRequest = {
        code: row.code.trim(),
        name: row.name.trim(),
        uom: row.uom.trim(),
        description: row.description.trim(),
        price: Number(row.price) || 0,
        image: row.imagePath || null,
      };

      if (row.id && !row.isNew) {
        const updated = await updateProduct(row.id, payload);
        setRows((prev) =>
          prev.map((r) =>
            r.tempId === row.tempId
              ? {
                ...r,
                code: updated.code,
                name: updated.name,
                uom: updated.uom,
                description: updated.description,
                price: updated.price,
                imagePath: updated.image || null,
                isDirty: false,
                isSaving: false
              }
              : r
          )
        );
      } else {
        const created = await createProduct(payload);
        setRows((prev) =>
          prev.map((r) =>
            r.tempId === row.tempId
              ? {
                ...r,
                id: created.id,
                tempId: created.id,
                code: created.code,
                name: created.name,
                uom: created.uom,
                description: created.description,
                price: created.price,
                imagePath: created.image || null,
                isDirty: false,
                isNew: false,
                isSaving: false
              }
              : r
          )
        );
      }

      if (onRefreshApp) {
        await onRefreshApp();
      }
    } catch (err: any) {
      alert('Error saving product: ' + (err.response?.data?.message || err.message || 'Unknown error'));
      setRows((prev) => prev.map((r) => (r.tempId === row.tempId ? { ...r, isSaving: false } : r)));
    }
  };

  const handleMoveRow = (tempId: string, direction: 'up' | 'down') => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.tempId === tempId);
      if (idx === -1) return prev;
      const newRows = [...prev];
      if (direction === 'up' && idx > 0) {
        [newRows[idx - 1], newRows[idx]] = [newRows[idx], newRows[idx - 1]];
      } else if (direction === 'down' && idx < newRows.length - 1) {
        [newRows[idx], newRows[idx + 1]] = [newRows[idx + 1], newRows[idx]];
      }
      return newRows;
    });
  };

  const handleDeleteRow = async (row: EditableProductRow) => {
    if (row.id && !row.isNew) {
      if (!window.confirm('Are you sure you want to delete this product?')) return;
      try {
        await deleteProduct(row.id);
        setRows((prev) => prev.filter((r) => r.tempId !== row.tempId));
        if (onRefreshApp) await onRefreshApp();
      } catch (err: any) {
        alert('Failed to delete product: ' + (err.message || 'Unknown error'));
      }
    } else {
      setRows((prev) => prev.filter((r) => r.tempId !== row.tempId));
    }
  };

  const totalValue = useMemo(() => {
    return rows.reduce((sum, r) => sum + (Number(r.price) || 0), 0);
  }, [rows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDownloadTemplate = async () => {
    try {
      const fileBlob = await downloadProductsTemplate();
      const url = URL.createObjectURL(fileBlob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'products_template.xlsx';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download template: ' + (err.message || 'Unknown error'));
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadMessage(null);
      const response = await uploadProductsExcel(file);
      setUploadMessage(response.message || 'Products imported successfully.');
      await loadData();
      setCurrentPage(1);
    } catch (err: any) {
      alert('Failed to import products: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Products Management</h2>
          <p>Manage products</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={handleAddLine} className="btn-primary">
            + Add Product
          </button>
        </div>
      </div>

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

      <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Code, Name, Description, ID..."
            className="search-input"
            style={{ width: '320px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
          <button type="button" className="btn-secondary" onClick={handleDownloadTemplate}>
            ⬇ Download Template
          </button>
          <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            ⬆ Upload Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', fontWeight: 600 }}>
          <span style={{ background: '#f3f4f6', padding: '6px 14px', borderRadius: '20px', color: '#374151' }}>
            Total Products: <strong>{totalProducts}</strong>
          </span>
          <span style={{ background: '#ecfdf5', padding: '6px 14px', borderRadius: '20px', color: '#065f46' }}>
            Total Value: <strong>{formatAmount(totalValue)}</strong>
          </span>
        </div>
      </div>
      {uploadMessage && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: '#f0fdf4', color: '#064e3b' }}>
          {uploadMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading products…</div>
      ) : (
        <div className="table-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e293b', color: '#f8fafc' }}>
                <th style={{ padding: '12px 10px', textAlign: 'left', width: '120px' }}>Code</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', minWidth: '200px' }}>Name</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', minWidth: '200px' }}>Description</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', width: '90px' }}>UOM</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', width: '110px' }}>Image</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', width: '120px' }}>Price</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', width: '195px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No products found. Click <strong>"+ Add Product"</strong> to add your first product.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.tempId}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: row.isDirty ? '#fffbe6' : 'white',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="text"
                        value={row.code}
                        onChange={(e) => handleFieldChange(row.tempId, 'code', e.target.value)}
                        placeholder="Code"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleFieldChange(row.tempId, 'name', e.target.value)}
                        placeholder="Name"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => handleFieldChange(row.tempId, 'description', e.target.value)}
                        placeholder="Description"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="text"
                        value={row.uom}
                        onChange={(e) => handleFieldChange(row.tempId, 'uom', e.target.value)}
                        placeholder="UOM"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </td>

                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        {row.imagePreviewUrl ? (
                          <img
                            src={row.imagePreviewUrl}
                            alt="Product"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No Image</span>
                        )}
                        <label className="btn-secondary small" style={{ fontSize: '0.65rem', color: 'black', padding: '2px 6px', cursor: 'pointer', margin: 0 }}>
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleImageUpload(row.tempId, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </td>

                    <td style={{ padding: '8px 10px' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.price}
                        onChange={(e) => handleFieldChange(row.tempId, 'price', parseFloat(e.target.value) || 0)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}
                      />
                    </td>

                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {/* Up / Down */}
                        <button
                          type="button"
                          title="Move Up"
                          onClick={() => handleMoveRow(row.tempId, 'up')}
                          style={{ padding: '4px 7px', fontSize: '0.75rem', background: '#081d31', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', lineHeight: 1 }}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          title="Move Down"
                          onClick={() => handleMoveRow(row.tempId, 'down')}
                          style={{ padding: '4px 7px', fontSize: '0.75rem', background: '#081d31', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', lineHeight: 1 }}
                        >
                          ▼
                        </button>
                        {/* View */}
                        <button
                          type="button"
                          className="btn-secondary small"
                          onClick={() => onView?.(row)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#081d31' }}
                        >
                          View
                        </button>
                        {/* Save */}
                        <button
                          type="button"
                          className="btn-primary small"
                          onClick={() => handleSaveRow(row)}
                          disabled={row.isSaving || (!row.isDirty && !row.isNew)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            opacity: !row.isDirty && !row.isNew ? 0.6 : 1
                          }}
                        >
                          {row.isSaving ? '...' : row.isDirty || row.isNew ? 'Save' : 'Saved'}
                        </button>
                        {/* Delete */}
                        <button
                          type="button"
                          className="btn-danger small"
                          onClick={() => handleDeleteRow(row)}
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
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
      )}
      {totalProducts > 0 && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
            <label style={{ fontWeight: 600 }}>Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value={10}>10</option>
              <option value={12}>12</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(totalProducts / itemsPerPage))}
            itemsPerPage={itemsPerPage}
            totalItems={totalProducts}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
