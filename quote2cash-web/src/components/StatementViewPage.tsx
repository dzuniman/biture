import React, { useMemo, useEffect, useState } from 'react';
import type { Statement, Invoice, Client, CreditNote } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';
import { generateStatementPDF } from './StatementPdfGenerator';

interface Props {
  statement: Statement;
  invoices: Invoice[];
  creditNotes?: CreditNote[];
  onEdit: () => void;
  onBack: () => void;
}

export const StatementViewPage: React.FC<Props> = ({ statement, invoices, creditNotes = [], onEdit, onBack }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const updatePdf = async () => {
      const url = await generateStatementPDF(statement, invoices, creditNotes);
      setPdfUrl(url);
    };
    updatePdf();
  }, [statement, invoices, creditNotes]);

  const handleDownloadStatementPdf = async () => {
    try {
      await generateStatementPDF(statement, invoices, creditNotes, true); // save mode
    } catch (err) {
      console.error("Satement PDF save failed:", err);
      alert("Could not save Statement PDF. Please check the console for errors.");
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
          <h2>{statement.statementNumber || (statement as any).StatementNumber}</h2>
          <p>Statement Number: {statement.statementNumber ?? 'selected client'}</p>
        </div>
        <button onClick={onBack} className="btn-secondary no-print">
          ← Back to Statements
        </button>
        <button type="button" onClick={onEdit} className="btn-primary">
          Edit Statement
        </button>
        <button type="button" onClick={handleDownloadStatementPdf} className="btn-secondary">
          Download PDF
        </button>
      </div>
      <div className="view-actions no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '20px' }}>
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
};
