import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { DeliveryNote, QuoteItem } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';

export const generateDeliveryNotePDF = async (deliveryNote: DeliveryNote) => {
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
  doc.text('BITURE (PTY) LTD   Reg: K2013/194395/07   VAT No: 4480272220', margin, companyY);
  companyY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Cnr Fred Versepute and Asparagus Road Midrand 1685', margin, companyY);
  companyY += 4;
  doc.text('Email: BetrothM@biture.co.za   Tel: +2765 835 4371 | +2783 249 8510', margin, companyY);
  companyY += 6;

  const logoHeight = 20;
  if (logoImg.complete && logoImg.naturalWidth > 0) {
    const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
    doc.addImage(logoImg, 'PNG', margin, companyY, logoHeight * aspect, logoHeight);
  }
  const finalCompanyY = companyY + logoHeight + 5;

  // ── Delivery Note Details (right) ──
  const detailBlockW = 75;
  const detailBlockX = pageWidth - margin - detailBlockW;
  let detailY = currentY;
  const lineH = 3.5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY NOTE', pageWidth - margin, detailY, { align: 'right' });
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

  addDetailRow('DELIVERY NOTE NUMBER:', deliveryNote.deliveryNoteNumber);
  addDetailRow('DATE:', formatDate(deliveryNote.createdAt ? new Date(deliveryNote.createdAt) : undefined));
  addDetailRow('REFERENCE:', deliveryNote.reference || '—');
  addDetailRow('PO NUMBER:', deliveryNote.quote?.poNumber || '—');

  // ── Client Box (right) ──
  const client = deliveryNote.quote?.client;
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
  const tableRows = (deliveryNote.quote?.items ?? [])
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
  if (deliveryNote.description) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('REMARKS:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(deliveryNote.description, pageWidth - margin * 2 - 28);
    doc.text(descLines, margin + 28, currentY);
    const descHeight = descLines.length * 4;
    currentY += Math.max(descHeight, 5) + 4;
  }

  // ── Received / Approved & Signature Lines ──
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerBlockHeight = 38;
  currentY = Math.max(currentY + 5, pageHeight - margin - footerBlockHeight);

  currentY += 18;
  const contentWidth = pageWidth - (margin * 2);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('OUR BANKING DETAILS ARE AS FOLLOWS:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 4;
  const terms = [
    'Account Name: BITURE (PTY) LTD',
    'Bank: Standard Bank',
    'Account Number: 10142678536',
    'Branch Code: 051001',
    'Thank you for your Purchase Order. For product or services related purchases, the invoice will only be due once the goods have been delivered or the services rendered. Please confirm your payment by e-mailing your proof of payment or remittance advise to BetrothM@biture.co.za'
  ];
  terms.forEach(term => {
    const wrappedTerm = doc.splitTextToSize(term, contentWidth);
    wrappedTerm.forEach((line: string) => {
      doc.text(line, margin, currentY);
      currentY += 3;
    });
  });

  // Save
  doc.save(`DeliveryNote_${deliveryNote.deliveryNoteNumber || 'N-A'}.pdf`);
};
