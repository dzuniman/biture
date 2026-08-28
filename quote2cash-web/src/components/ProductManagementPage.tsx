import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage, getProductImageUrl, downloadProductsTemplate, uploadProductsExcel } from '../api';
import type { Product, ProductCreateRequest } from '../types';
import { formatAmount } from '../../formatters';
import DataGrid, { ColumnDef } from './DataGrid';
import ActionMenu from './ActionMenu';

interface Props {
  onBack: () => void;
  onRefreshApp?: () => Promise<void>;
  onView?: (product: any) => void;
}

export type EditableProductRow = {
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

export default function ProductManagementPage({ onBack, onRefreshApp, onView }: Props) {
  const [rows, setRows] = useState<EditableProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      const loadedRows: EditableProductRow[] = data.map((product) => ({
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
        imagePreviewUrl: product.image
          ? product.image.startsWith('blob:') || product.image.startsWith('http')
            ? product.image
            : getProductImageUrl(product.image)
          : undefined
      }));
      setRows(loadedRows);
    } catch (err: any) {
      setError('Failed to load products: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    setRows((prev) => [newRow, ...prev]);
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
    } catch (err: any) {
      alert('Failed to import products: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const totalValue = useMemo(() => {
    return rows.reduce((sum, r) => sum + (Number(r.price) || 0), 0);
  }, [rows]);

  const columns: ColumnDef<EditableProductRow>[] = useMemo(
    () => [
      {
        key: 'code',
        label: 'Code',
        type: 'text',
        getValue: r => r.code,
        render: (row) => (
          <input
            type="text"
            value={row.code}
            onChange={(e) => handleFieldChange(row.tempId, 'code', e.target.value)}
            placeholder="Code"
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        )
      },
      {
        key: 'name',
        label: 'Product Name',
        type: 'text',
        getValue: r => r.name,
        render: (row) => (
          <input
            type="text"
            value={row.name}
            onChange={(e) => handleFieldChange(row.tempId, 'name', e.target.value)}
            placeholder="Name"
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        )
      },
      {
        key: 'uom',
        label: 'UOM',
        type: 'text',
        getValue: r => r.uom,
        render: (row) => (
          <input
            type="text"
            value={row.uom}
            onChange={(e) => handleFieldChange(row.tempId, 'uom', e.target.value)}
            placeholder="UOM"
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        )
      },
      {
        key: 'description',
        label: 'Description',
        type: 'text',
        getValue: r => r.description,
        render: (row) => (
          <input
            type="text"
            value={row.description}
            onChange={(e) => handleFieldChange(row.tempId, 'description', e.target.value)}
            placeholder="Description"
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        )
      },
      {
        key: 'imagePath',
        label: 'Image',
        type: 'custom',
        align: 'center',
        render: (row) => (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            {row.imagePreviewUrl ? (
              <img
                src={row.imagePreviewUrl}
                alt="Product"
                style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            ) : (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No Image</span>
            )}
            <label className="btn-secondary small" style={{ fontSize: '0.65rem', color: '#0f172a', padding: '2px 6px', cursor: 'pointer', margin: 0 }}>
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
        )
      },
      {
        key: 'price',
        label: 'Price',
        type: 'currency',
        getValue: r => r.price,
        format: v => formatAmount(Number(v) || 0),
        render: (row) => (
          <input
            type="number"
            step="0.01"
            min="0"
            value={row.price}
            onChange={(e) => handleFieldChange(row.tempId, 'price', parseFloat(e.target.value) || 0)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}
          />
        )
      }
    ],
    []
  );

  const statsSummary = (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
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
          Total Products: <strong>{rows.length}</strong>
        </span>
        <span style={{ background: '#ecfdf5', padding: '6px 14px', borderRadius: '20px', color: '#065f46' }}>
          Total Value: <strong>{formatAmount(totalValue)}</strong>
        </span>
      </div>
    </div>
  );

  const renderActions = (row: EditableProductRow) => (
    <ActionMenu
      items={[
        { label: 'View', icon: '👁️', onClick: () => onView?.(row) },
        {
          label: row.isSaving ? 'Saving...' : row.isDirty || row.isNew ? 'Save' : 'Saved',
          icon: '💾',
          onClick: () => handleSaveRow(row),
          variant: row.isDirty || row.isNew ? 'success' : 'normal',
          disabled: row.isSaving || (!row.isDirty && !row.isNew)
        },
        { label: 'Delete', icon: '🗑️', onClick: () => handleDeleteRow(row), variant: 'danger' }
      ]}
    />
  );

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Products Management</h2>
          <p>Manage product catalog and prices</p>
        </div>
        <button onClick={handleAddLine} className="btn-primary-lg">
          + Add Product
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
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

      {uploadMessage && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: '#f0fdf4', color: '#064e3b' }}>
          {uploadMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading products…</div>
      ) : (
        <DataGrid
          columns={columns}
          data={rows}
          keyField="tempId"
          renderActions={renderActions}
          statsSummary={statsSummary}
          searchPlaceholder="Search products by code, name, UOM, or description..."
          emptyMessage="No products found. Click '+ Add Product' to create one."
          defaultPageSize={12}
        />
      )}
    </div>
  );
}
