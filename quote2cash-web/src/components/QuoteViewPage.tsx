import React, { useEffect, useState } from "react";
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const updatePdf = async () => {
      const url = await generateQuotePDF(quote);
      setPdfUrl(url);
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
