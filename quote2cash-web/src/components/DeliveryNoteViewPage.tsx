import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { formatAmount } from '../../formatters';
import type { DeliveryNote, Client } from '../types';
import logo from '../assets/logo.png';
import { generateDeliveryNotePDF } from './DeliveryNotePdfGenerator';
import { getDeliveryNote } from '../api';
import { generateQuotePDF } from "./QuotePdfGenerator";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface Props {
  deliveryNote: DeliveryNote;
  onEdit: () => void;
  onBack: () => void;
}

export default function DeliveryNoteViewPage({ deliveryNote, onEdit, onBack }: Props) {
  // Override any other module-level worker settings to use the correct local worker
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [width, setWidth] = useState<number>(Math.min(window.innerWidth - 32, 800));

  useEffect(() => {
    const handleResize = () => {
      setWidth(Math.min(window.innerWidth - 32, 800));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    let url: string | null = null;
    const updatePdf = async () => {
      try {
        const blob = await generateDeliveryNotePDF(deliveryNote, false, true) as Blob;
        if (blob && blob.size > 0) {
          url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } catch (err) {
        console.error("Delivery Note PDF preview generation failed:", err);
      }
    };
    updatePdf();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", overflowX: "auto" }}>
        {pdfUrl && (
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          >
            {Array.from({ length: numPages }, (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))}
          </Document>
        )}
      </div>
    </div >
  );
}
