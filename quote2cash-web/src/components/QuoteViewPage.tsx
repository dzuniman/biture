import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { Quote, Client } from '../types'; // Ensure Client type is imported
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';
import { generateQuotePDF } from './QuotePdfGenerator'; // Import the Quote generator

interface Props {
  quote: Quote;
  onEdit: () => void;
  onDuplicate: () => void;
  onBack: () => void;
}

export default function QuoteViewPage({ quote, onEdit, onDuplicate, onBack }: Props) {
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);

  useEffect(() => {
    const updatePdf = async () => {
      const blob = await generateQuotePDF(quote, false, true) as Blob;
      const url = URL.createObjectURL(blob);
      setPdfBlob(url);
    };
    updatePdf();
  }, [quote]);

  const handleDownloadQuotePdf = async () => {
    try {
      await generateQuotePDF(quote, true); // save mode
    } catch (err) {
      console.error("Quote PDF save failed:", err);
      alert("Could not save Quote PDF. Please check the console for errors.");
    }
  };

  const formattedDate = new Date(quote.date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });


  return (
    <div className="page-section">
      <div className="section-header no-print">
        <div>
          <h2>{quote.reference}</h2>
          <p>Quote Number: {quote.quoteNumber}</p>
        </div>
        <button onClick={onBack} className="btn-secondary no-print">
          ← Back to Quotes
        </button>
        <button onClick={onEdit} className="btn-primary" type="button">
          Edit Quote
        </button>
        <button onClick={onDuplicate} className="btn-secondary" type="button">
          Duplicate Quote
        </button>
        <button
          onClick={handleDownloadQuotePdf} // Call the corrected handler
          className="btn-secondary"
          type="button"
        >
          Download PDF
        </button>
      </div>
      <div className="view-actions no-print">
        {pdfBlob && (
          <Document file={pdfBlob}>
            <Page pageNumber={1} />
          </Document>
        )}
      </div>
    </div>
  );
}
