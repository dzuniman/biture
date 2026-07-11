import React, { useEffect, useState } from "react";
import { formatAmount } from '../../formatters';
import type { DeliveryNote, Client } from '../types';
import logo from '../assets/logo.png';
import { generateDeliveryNotePDF } from './DeliveryNotePdfGenerator';
import { getDeliveryNote } from '../api';

interface Props {
  deliveryNote: DeliveryNote;
  onEdit: () => void;
  onBack: () => void;
}

export default function DeliveryNoteViewPage({ deliveryNote, onEdit, onBack }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const updatePdf = async () => {
      const url = await generateDeliveryNotePDF(deliveryNote);
      setPdfUrl(url);
    };
    updatePdf();
  }, [deliveryNote]);

  const handleDownloadDeliveryNotePdf = async () => {
    try {
      await generateDeliveryNotePDF(deliveryNote, true); // save mode
    } catch (err) {
      console.error("Delivery Note PDF save failed:", err);
      alert("Could not save Delivery Note PDF. Please check the console for errors.");
    }
  };

  const formatDate = (dateValue?: string | null) => {
    if (!dateValue) return '—';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const createdDate = formatDate(deliveryNote.createdAt);
  const quote = deliveryNote.quote;
  const items = (quote?.items ?? []).slice().sort((a, b) => {
    const aNum = Number(a.itemNumber);
    const bNum = Number(b.itemNumber);
    return aNum - bNum;
  });

  const displayClient: Client | null | undefined = quote?.client || null;
  const vat = Number(quote?.vat ?? 0);
  const subTotal = Number(quote?.subTotal ?? 0);
  const total = subTotal + vat;

  return (
    <div className="page-section">
      <div className="section-header no-print">
        <div>
          <h2>{deliveryNote.deliveryNoteNumber}</h2>
          <p>Delivery Note for {deliveryNote.reference || quote?.reference || 'selected quote'}</p>
        </div>
        <button onClick={onBack} className="btn-secondary no-print">
          ← Back to Delivery Notes
        </button>
        <button type="button" onClick={onEdit} className="btn-primary">
          Edit Delivery Note
        </button>
        <button type="button" onClick={handleDownloadDeliveryNotePdf} className="btn-secondary">
          Download PDF
        </button>
      </div>
      <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '28px' }}>
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            width="100%"
            height="600px"
            style={{ border: "1px solid #ccc", marginTop: "1rem" }}
          />
        )}
      </div>
    </div >
  );
}
