import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { getInvoice } from '../api';
import type { Invoice, Client, Quote, InvoiceQuote } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';
import { generateInvoicePDF } from './InvoicePdfGenerator'; // Import the new generator
import { generateQuotePDF } from "../pdfUtils";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

interface Props {
  invoice: Invoice;
  onEdit: () => void;
  onBack: () => void;
}

export default function InvoiceViewPage({ invoice, onEdit, onBack }: Props) {
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
        const blob = await generateInvoicePDF(invoice, false, true) as Blob;
        if (blob && blob.size > 0) {
          url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } catch (err) {
        console.error("Invoice PDF preview generation failed:", err);
      }
    };
    updatePdf();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [invoice]);

  const handleDownloadInvoicePdf = async () => {
    try {
      await generateInvoicePDF(invoice, true); // save mode
    } catch (err) {
      console.error("Invoice PDF save failed:", err);
      alert("Could not save Invoice PDF. Please check the console for errors.");
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


  return (
    <div className="page-section">
      <div className="section-header no-print">
        <div>
          <h2>{invoice.quote?.reference}</h2>
          <p>Invoice Number: {invoice.invoiceNumber}</p>
        </div>
        <div>
          <button onClick={onBack} className="btn-secondary no-print">
            ← Back to Invoices
          </button>
        </div>
        <button type="button" onClick={onEdit} className="btn-primary">
          Edit Invoice
        </button>
        <button type="button" onClick={handleDownloadInvoicePdf} className="btn-secondary">
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
