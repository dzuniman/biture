import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { formatAmount } from '../../formatters';
import type { JobCard, Client } from '../types';
import logo from '../assets/logo.png';
import { generateJobCardPDF } from './JobCardPdfGenerator';
import { getJobCard } from '../api';

interface Props {
  jobCard: JobCard;
  onEdit: () => void;
  onBack: () => void;
}

export default function JobCardViewPage({ jobCard, onEdit, onBack }: Props) {
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);

  useEffect(() => {
    const updatePdf = async () => {
      const blob = await generateJobCardPDF(jobCard, false, true) as Blob;
      const url = URL.createObjectURL(blob);
      setPdfBlob(url);
    };
    updatePdf();
  }, [jobCard]);

  const handleDownloadJobCardPdf = async () => {
    try {
      await generateJobCardPDF(jobCard, true); // save mode
    } catch (err) {
      console.error("Job Card PDF save failed:", err);
      alert("Could not save Job Card PDF. Please check the console for errors.");
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

  const createdDate = formatDate(jobCard.createdAt);
  const quote = jobCard.quote;
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
          <h2>{jobCard.jobCardNumber}</h2>
          <p>Job Card for Quote {jobCard.quoteNumber}</p>
        </div>
        <button onClick={onBack} className="btn-secondary no-print">
          ← Back to Job Cards
        </button>
        <button type="button" onClick={onEdit} className="btn-primary">
          Edit Job Card
        </button>
        <button type="button" onClick={handleDownloadJobCardPdf} className="btn-secondary">
          Download PDF
        </button>
      </div>
      <div className="no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '28px' }}>
        {pdfBlob && (
          <Document file={pdfBlob}>
            <Page pageNumber={1} />
          </Document>
        )}
      </div>
    </div>
  );
}
