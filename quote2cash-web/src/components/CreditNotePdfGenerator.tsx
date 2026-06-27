import { jsPDF } from 'jspdf';
import type { CreditNote } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';

export const generateCreditNotePDF = async (creditNote: CreditNote) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

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

  const margin = 5;
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = margin;

  // Pre-load logo
  const logoImg = new Image();
  logoImg.src = logo;
  try {
    await new Promise((resolve) => {
      if (logoImg.complete && logoImg.naturalWidth > 0) { resolve(null); return; }
      logoImg.onload = () => resolve(null);
      logoImg.onerror = () => resolve(null);
    });
  } catch { /* continue without logo */ }

  // ── Company Info (left) ──
  let companyY = currentY;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('EPEC SOLUTIONS (PTY) LTD   Reg: 2012/118990/07   VAT No: 4470275886', margin, companyY);
  companyY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('259 Kent Avenue, Randburg, Johannesburg, Gauteng, 2194', margin, companyY);
  companyY += 4;
  doc.text('email: sales@epec.co.za   Phone: 065 835 4371', margin, companyY);
  companyY += 6;

  const logoHeight = 20;
  if (logoImg.complete && logoImg.naturalWidth > 0) {
    const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
    doc.addImage(logoImg, 'PNG', margin, companyY, logoHeight * aspect, logoHeight);
  }
  const finalCompanyY = companyY + logoHeight + 5;

  // ── Credit Note Details (right) ──
  const detailBlockW = 70;
  const detailBlockX = pageWidth - margin - detailBlockW;
  let detailY = currentY;
  const lineH = 3.5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CREDIT NOTE', pageWidth - margin, detailY, { align: 'right' });
  detailY += 5;

  doc.setFontSize(7);
  const addDetailRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, detailBlockX, detailY);
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(value, detailBlockW - 30);
    wrapped.forEach((line: string) => {
      doc.text(line, pageWidth - margin, detailY, { align: 'right' });
      detailY += lineH;
    });
  };

  addDetailRow('CREDIT NOTE NUMBER:', creditNote.creditNoteNumber);
  addDetailRow('DATE:', formatDate(creditNote.createdAt));

  // ── Client Box (right) ──
  const client = creditNote.client;
  if (client) {
    const boxW = 70;
    const boxH = 34;
    const boxX = pageWidth - margin - boxW;
    const boxY = detailY + 4;
    doc.setLineWidth(0.25);
    doc.rect(boxX, boxY, boxW, boxH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('BILL TO:', boxX + 2, boxY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let cy = boxY + 8;
    const lines = [
      client.name,
      client.addressLine1,
      client.addressLine2,
      client.addressLine3,
      client.addressLine4,
      client.vatNumber ? `VAT No: ${client.vatNumber}` : null,
      client.email ? `Email: ${client.email}` : null,
      `${client.representativeName || '—'}`,
      `${client.representativeNumber || '—'}`
    ].filter(Boolean) as string[];
    lines.forEach(line => { doc.text(line, boxX + 2, cy); cy += 3; });
    detailY = boxY + boxH + 5;
  }

  currentY = Math.max(finalCompanyY, detailY);
  currentY += 4;

  // Horizontal divider
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  // ── Main Section Table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'FD');
  doc.text('DESCRIPTION', margin + 2, currentY + 4.5);
  doc.text('AMOUNT', pageWidth - margin - 30, currentY + 4.5, { align: 'right' });
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.15);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  const descLines = doc.splitTextToSize(creditNote.description || 'Client Credit Note Adjustment', pageWidth - margin * 2 - 40);
  doc.text(descLines, margin + 2, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(formatAmount(creditNote.amount), pageWidth - margin - 2, currentY + 6, { align: 'right' });
  
  const textHeight = Math.max(descLines.length * 4, 10);
  currentY += textHeight + 6;
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Total Credited Box
  currentY += 4;
  const summaryX = pageWidth - margin;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Credited:', summaryX - 45, currentY);
  doc.text(formatAmount(creditNote.amount), summaryX, currentY, { align: 'right' });
  currentY += 20;

  // Signature Block
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerBlockHeight = 25;
  currentY = Math.max(currentY, pageHeight - margin - footerBlockHeight);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Issued and Approved by: __________________________________________________________', margin, currentY);
  currentY += 8;
  doc.text('Signature: ________________________________________________________________________', margin, currentY);

  // Save
  doc.save(`CreditNote_${creditNote.creditNoteNumber || 'N-A'}.pdf`);
};
