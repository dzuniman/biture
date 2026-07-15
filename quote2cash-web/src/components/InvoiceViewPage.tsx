import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { getInvoice } from '../api';
import type { Invoice, Client, Quote, InvoiceQuote } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';
import { generateInvoicePDF } from './InvoicePdfGenerator'; // Import the new generator
import { generateQuotePDF } from "../pdfUtils";

interface Props {
  invoice: Invoice;
  onEdit: () => void;
  onBack: () => void;
}

export default function InvoiceViewPage({ invoice, onEdit, onBack }: Props) {
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);

  useEffect(() => {
    const updatePdf = async () => {
      const blob = await generateInvoicePDF(invoice, false, true) as Blob;
      const url = URL.createObjectURL(blob);
      setPdfBlob(url);
    };
    updatePdf();
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
      <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '20px' }}>
        {pdfBlob && (
          <Document file={pdfBlob}>
            <Page pageNumber={1} />
          </Document>
        )}
      </div>
    </div>
  );
}
