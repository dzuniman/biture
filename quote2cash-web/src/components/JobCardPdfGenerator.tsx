import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { JobCard, QuoteItem } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';

export const generateJobCardPDF = async (jobCard: JobCard) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const formatDate = (date?: Date) => {
    if (!date || isNaN(date.getTime()) || date.getFullYear() <= 1) return '—';
    return date.toLocaleDateString('en-ZA', {
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

  // ── Job Card Details (right) ──
  const detailBlockW = 75;
  const detailBlockX = pageWidth - margin - detailBlockW;
  let detailY = currentY;
  const lineH = 3.5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('JOB CARD', pageWidth - margin, detailY, { align: 'right' });
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

  addDetailRow('JOB CARD NUMBER:', jobCard.jobCardNumber);
  addDetailRow('DATE:', formatDate(jobCard.createdAt ? new Date(jobCard.createdAt) : undefined));
  addDetailRow('REFERENCE:', jobCard.reference || '—');
  addDetailRow('PO NUMBER:', jobCard.quote?.poNumber || '—');

  // ── Client Box (right) ──
  const client = jobCard.quote?.client;
  if (client) {
    const boxW = 75;
    const boxH = 34;
    const boxX = pageWidth - margin - boxW;
    const boxY = detailY + 4;
    doc.setLineWidth(0.25);
    doc.rect(boxX, boxY, boxW, boxH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('SITE DETAILS:', boxX + 2, boxY + 4);
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

  // ── Items Table — Item + Qty + Description only ──
  const tableRows = (jobCard.quote?.items ?? [])
    .slice()
    .sort((a: QuoteItem, b: QuoteItem) => {
      const aNum = Number(a.itemNumber);
      const bNum = Number(b.itemNumber);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return String(a.itemNumber).localeCompare(String(b.itemNumber), undefined, { numeric: true });
    })
    .map((item: QuoteItem) => [item.itemNumber, item.quantity, item.description]);

  autoTable(doc, {
    startY: currentY,
    head: [['ITEM', 'QTY', 'DESCRIPTION']],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ── Description Block ──
  if (jobCard.description) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('REMARKS:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(jobCard.description, pageWidth - margin * 2 - 28);
    doc.text(descLines, margin + 28, currentY);
    const descHeight = descLines.length * 4;
    currentY += Math.max(descHeight, 5) + 4;
  }

  // ── Summary (Sub-total / VAT / Total) ──
  const subTotal = Number(jobCard.quote?.subTotal ?? 0);
  const vat = Number(jobCard.quote?.vat ?? 0);
  const total = subTotal + vat;
  const summaryX = pageWidth - margin;
  const labelX = summaryX - 50;

  doc.setFontSize(8);
  const addSummaryRow = (label: string, value: number, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, labelX, currentY);
    doc.text(formatAmount(value), summaryX, currentY, { align: 'right' });
    currentY += 5;
  };

  // ── Received / Approved & Signature Lines ──
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerBlockHeight = 38;
  currentY = Math.max(currentY + 5, pageHeight - margin - footerBlockHeight);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  doc.setFontSize(8);
  doc.text('Received and Approved by: __________________________________________________________', margin, currentY);
  currentY += 8;
  doc.text('Signature: ________________________________________________________________________', margin, currentY);
  currentY += 10;

  // ── Payment Details ──
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', margin, currentY);
  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  [
    'Bank: Nedbank',
    'Account Name: EPEC SOLUTIONS (PTY) LTD',
    'Account No: 1223326799',
    'Account Type: Cheque',
    'Branch Code: 198765',
  ].forEach(line => {
    doc.text(line, margin, currentY);
    currentY += 4;
  });

  // Save
  doc.save(`JobCard_${jobCard.jobCardNumber || 'N-A'}.pdf`);
};
