import React, { useState, useEffect, type FormEvent } from 'react';
import type { Client, ClientCreateRequest } from '../types';

interface Props {
  initialData?: Client | null; // Allow null for initialData
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
  // New state for VAT Number and Email
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
      // Set new fields
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
        // Include new fields in payload
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
    <div className="card">
      <h2>{initialData ? 'Edit Client' : 'Add Client'}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Client name
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Address line 1
          <input type="text" value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} />
        </label>
        <label>
          Address line 2
          <input type="text" value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} />
        </label>
        <label>
          Address line 3
          <input type="text" value={addressLine3} onChange={(event) => setAddressLine3(event.target.value)} />
        </label>
        <label>
          Address line 4
          <input type="text" value={addressLine4} onChange={(event) => setAddressLine4(event.target.value)} />
        </label>
        <label>
          Vendor number
          <input type="text" value={vendorNumber} onChange={(event) => setVendorNumber(event.target.value)} />
        </label>
        {/* New VAT Number and Email fields */}
        <label>
          VAT Number
          <input type="text" value={vatNumber} onChange={(event) => setVatNumber(event.target.value)} />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {/* End of new fields */}
        <label>
          Representative name
          <input type="text" value={representativeName} onChange={(event) => setRepresentativeName(event.target.value)} />
        </label>
        <label>
          Representative number
          <input type="text" value={representativeNumber} onChange={(event) => setRepresentativeNumber(event.target.value)} />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : initialData ? 'Update Client' : 'Save Client'}
          </button>
          {initialData && onCancel && (
            <button type="button" className="secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
