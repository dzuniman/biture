import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { Quote, Client } from '../types'; // Ensure Client type is imported
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';
import { generateQuotePDF } from './QuotePdfGenerator'; // Import the Quote generator
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface Props {
  quote: Quote;
  onEdit: () => void;
  onDuplicate: () => void;
  onBack: () => void;
}

export default function QuoteViewPage({ quote, onEdit, onDuplicate, onBack }: Props) {
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
        const blob = await generateQuotePDF(quote, false, true) as Blob;
        if (blob && blob.size > 0) {
          url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } catch (err) {
        console.error("Quote PDF preview generation failed:", err);
      }
    };
    updatePdf();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
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
