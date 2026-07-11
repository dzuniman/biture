import React, { useEffect, useState } from "react";
import { formatAmount } from '../../formatters';
import type { CreditNote, Client } from '../types';
import logo from '../assets/logo.png';
import { generateCreditNotePDF } from './CreditNotePdfGenerator';
import { getCreditNote } from '../api';

interface Props {
  creditNote: CreditNote;
  onEdit: () => void;
  onBack: () => void;
}

export default function CreditNoteViewPage({ creditNote, onEdit, onBack }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const updatePdf = async () => {
      const url = await generateCreditNotePDF(creditNote);
      setPdfUrl(url);
    };
    updatePdf();
  }, [creditNote]);

  const handleDownloadCreditNotePdf = async () => {
    try {
      await generateCreditNotePDF(creditNote); // save mode
    } catch (err) {
      console.error("Credit Note PDF save failed:", err);
      alert("Could not save Credit Note PDF. Please check the console for errors.");
    }
  };

  return (
    <div className="page-section">
      <div className="section-header no-print">
        <div>
          <h2>{creditNote.creditNoteNumber}</h2>
          <p>Credit Note for Client {creditNote.client?.name}</p>
        </div>
        <button onClick={onBack} className="btn-secondary no-print">
          ← Back to Credit Notes
        </button>
        <button type="button" onClick={onEdit} className="btn-primary">
          Edit Credit Note
        </button>
        <button type="button" onClick={handleDownloadCreditNotePdf} className="btn-secondary">
          Download PDF
        </button>
      </div>
      <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '40px' }}>
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            width="100%"
            height="600px"
            style={{ border: "1px solid #ccc", marginTop: "1rem" }}
          />
        )}
      </div>
    </div>
  );
}
