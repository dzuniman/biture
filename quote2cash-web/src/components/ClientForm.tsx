import React, { useState, useEffect, type FormEvent } from 'react';
import type { Client, ClientCreateRequest } from '../types';

interface Props {
  initialData?: Client | null;
  onSubmit: (payload: ClientCreateRequest) => Promise<void>;
  onCancel?: () => void;
}

export default function ClientForm({ initialData, onSubmit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [vendorNumber, setVendorNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressLine3, setAddressLine3] = useState('');
  const [addressLine4, setAddressLine4] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeNumber, setRepresentativeNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? '');
      setVendorNumber(initialData.vendorNumber ?? '');
      setAddressLine1(initialData.addressLine1 ?? '');
      setAddressLine2(initialData.addressLine2 ?? '');
      setAddressLine3(initialData.addressLine3 ?? '');
      setAddressLine4(initialData.addressLine4 ?? '');
      setRepresentativeName(initialData.representativeName ?? '');
      setRepresentativeNumber(initialData.representativeNumber ?? '');
      setVatNumber(initialData.vatNumber ?? '');
      setEmail(initialData.email ?? '');
    } else {
      setName('');
      setVendorNumber('');
      setAddressLine1('');
      setAddressLine2('');
      setAddressLine3('');
      setAddressLine4('');
      setRepresentativeName('');
      setRepresentativeNumber('');
      setVatNumber('');
      setEmail('');
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      await onSubmit({
        name: name.trim(),
        vendorNumber: vendorNumber.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
        addressLine2: addressLine2.trim() || undefined,
        addressLine3: addressLine3.trim() || undefined,
        addressLine4: addressLine4.trim() || undefined,
        representativeName: representativeName.trim() || undefined,
        representativeNumber: representativeNumber.trim() || undefined,
        vatNumber: vatNumber.trim(),
        email: email.trim(),
      });
    } catch (error) {
      console.error("Client Update failed:", error);
      alert("Failed to update client. Please check if all fields are valid.");
    } finally {
      setIsSaving(false);
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
        color: '#0f172a'
      }}
    >
      <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>
          {initialData ? 'Edit Client Profile' : 'Add New Client'}
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
          Enter client details and contact information
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            Client Name *
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="e.g. Acme Corporation"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            Vendor Number
            <input
              type="text"
              value={vendorNumber}
              onChange={(event) => setVendorNumber(event.target.value)}
              placeholder="e.g. VEN-1002"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            VAT Number
            <input
              type="text"
              value={vatNumber}
              onChange={(event) => setVatNumber(event.target.value)}
              placeholder="e.g. 4900123456"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="e.g. info@acme.com"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            Representative Name
            <input
              type="text"
              value={representativeName}
              onChange={(event) => setRepresentativeName(event.target.value)}
              placeholder="e.g. John Doe"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            Representative Phone
            <input
              type="text"
              value={representativeNumber}
              onChange={(event) => setRepresentativeNumber(event.target.value)}
              placeholder="e.g. +27 82 123 4567"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            Address Line 1
            <input
              type="text"
              value={addressLine1}
              onChange={(event) => setAddressLine1(event.target.value)}
              placeholder="Street address..."
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            Address Line 2
            <input
              type="text"
              value={addressLine2}
              onChange={(event) => setAddressLine2(event.target.value)}
              placeholder="Suburb / District..."
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            Address Line 3
            <input
              type="text"
              value={addressLine3}
              onChange={(event) => setAddressLine3(event.target.value)}
              placeholder="City..."
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            Address Line 4 (Postal Code)
            <input
              type="text"
              value={addressLine4}
              onChange={(event) => setAddressLine4(event.target.value)}
              placeholder="Postal code..."
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel} style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={isSaving}
            style={{ padding: '8px 20px', fontSize: '0.88rem', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px' }}
          >
            {isSaving ? 'Saving…' : initialData ? 'Update Client' : 'Save Client'}
          </button>
        </div>
      </form>
    </div>
  );
}
