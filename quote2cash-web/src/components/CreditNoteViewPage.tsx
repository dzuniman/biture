import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { formatAmount } from '../../formatters';
import type { CreditNote, Client } from '../types';
import logo from '../assets/logo.png';
import { generateCreditNotePDF } from './CreditNotePdfGenerator';
import { getCreditNote } from '../api';

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface Props {
  creditNote: CreditNote;
  onEdit: () => void;
  onBack: () => void;
}

export default function CreditNoteViewPage({ creditNote, onEdit, onBack }: Props) {
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
        const blob = await generateCreditNotePDF(creditNote, false, true) as Blob;
        if (blob && blob.size > 0) {
          url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } catch (err) {
        console.error("Credit Note PDF preview generation failed:", err);
      }
    };
    updatePdf();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [creditNote]);

  const handleDownloadCreditNotePdf = async () => {
    try {
      await generateCreditNotePDF(creditNote, true); // save mode
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
    </div>
  );
}
