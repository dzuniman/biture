import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { CreditNote } from '../../types';
import { formatAmount } from '../../../formatters';

const project = import.meta.env.VITE_PROJECT;
const logo = new URL(`../../assets/logo-${project}.png`, import.meta.url).href;

async function getProjectInfo() {
  const module = await import(`../../project-info/${project}.ts`);
  return {
    paymentDetails: module.bankingDetails,
    company: module.company,
  };
}

export const generateCreditNotePDF = async (creditNote: CreditNote, save: boolean = false, returnBlob = false) => {
  const { company, paymentDetails } = await getProjectInfo();
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

  // Pre-load logo image
  const logoImg = new Image();
  logoImg.src = logo;
  await new Promise((resolve) => {
    logoImg.onload = resolve;
    logoImg.onerror = () => {
      console.error('PDF Generator: Could not load logo image from', logo);
      resolve(null);
    };
  });

  const allRows = Array.of(Array.of(creditNote.description, formatAmount(creditNote.amount)));

  const margin = 5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm on A4

  // Fixed Y-coordinates locked at the bottom of every page
  const paymentBoxHeight = 25;
  const paymentBoxY = pageHeight - paymentBoxHeight - margin; // 267mm (Banking Details box at bottom)
  const footerRowTopY = paymentBoxY - 15;                     // 252mm (Top of Total Credited & Received By row)
  const signatureY = paymentBoxY - 3;                         // 264mm (Signature just above Banking box)
  const receivedByY = signatureY - 7;                         // 257mm (Received by just above Signature)
  const tableStartY = 56;                                     // Top of table below BILL TO / CREDIT NOTE boxes
  const tableMaxBottomY = footerRowTopY - 3;                  // 249mm (Table spans down to just above Total Credited & Received By)
  const bottomMargin = pageHeight - tableMaxBottomY;

  // Column widths matching tableColumnStyles so vertical grid lines align down to tableMaxBottomY
  const colWidths = Array.of(pageWidth - (margin * 2) - 30, 30);
  let pageRowY = 35;

  const drawPageHeader = () => {
    const companyInfoX = margin;
    const companyInfoY = margin - 10;

    // --- Company Info (Top Left) ---
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(String(company.at(0) ?? ''), companyInfoX, companyInfoY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(String(company.at(1) ?? ''), companyInfoX, companyInfoY + 16);
    doc.text(String(company.at(2) ?? ''), companyInfoX, companyInfoY + 20);

    // --- Logo (Top Right) ---
    const logoHeight = 15;
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
      const logoWidth = logoHeight * aspectRatio;
      doc.addImage(logoImg, 'PNG', pageWidth - margin - logoWidth, margin - 2, logoWidth, logoHeight);
    }

    // --- Bill To Box (Left) ---
    const customerBoxY = companyInfoY + 23;
    const boxWidth = 70;
    const boxHeight = 33;
    const boxX = companyInfoX;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(boxX, customerBoxY, boxWidth, boxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('BILL TO:', boxX + 2, customerBoxY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let custTextY = customerBoxY + 7;

    if (creditNote.client) {
      const clientLines = Array.of(
        creditNote.client.name,
        creditNote.client.addressLine1,
        creditNote.client.addressLine2,
        creditNote.client.addressLine3,
        creditNote.client.addressLine4,
        creditNote.client.vatNumber ? `VAT No: ${creditNote.client.vatNumber}` : null,
        creditNote.client.email ? `Email: ${creditNote.client.email}` : null
      ).filter(Boolean);

      clientLines.forEach(line => {
        doc.text(line!, boxX + 2, custTextY);
        custTextY += 3;
      });

      if (creditNote.client.representativeName || creditNote.client.representativeNumber) {
        if (creditNote.client.representativeName) {
          doc.text(creditNote.client.representativeName, boxX + 2, custTextY);
        }
        if (creditNote.client.representativeNumber) {
          doc.text(creditNote.client.representativeNumber, boxX + boxWidth - 2, custTextY, { align: 'right' });
        }
      }
    }

    // --- Credit Note Block (Right) ---
    const creditNoteDetailsBlockWidth = 70;
    const creditNoteDetailsBlockX = pageWidth - margin - creditNoteDetailsBlockWidth;
    const creditNoteDetailsY = companyInfoY + logoHeight + 8;

    doc.setLineWidth(0.2);
    doc.rect(creditNoteDetailsBlockX, creditNoteDetailsY, creditNoteDetailsBlockWidth, boxHeight);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CREDIT NOTE', pageWidth - margin - 2, creditNoteDetailsY + 4, { align: 'right' });

    doc.setFontSize(7);
    let detailY = creditNoteDetailsY + 7;

    const addCreditNoteDetailRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, creditNoteDetailsBlockX + 2, detailY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, creditNoteDetailsBlockX + creditNoteDetailsBlockWidth - 2, detailY, { align: 'right' });
      detailY += 4;
    };

    addCreditNoteDetailRow('CREDIT NOTE NUMBER:', creditNote.creditNoteNumber);
    addCreditNoteDetailRow('DATE:', formatDate(creditNote.createdAt));

    // Label drawn here; right-aligned 'x of y' value drawn after autoTable completes
    pageRowY = detailY;
    doc.setFont('helvetica', 'bold');
    doc.text('PAGE:', creditNoteDetailsBlockX + 2, detailY);
  };

  // Draws full-height vertical column borders and bottom border down to tableMaxBottomY on every page
  const drawFullHeightTableBorders = () => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.1);

    let currentX = margin;
    doc.line(currentX, tableStartY, currentX, tableMaxBottomY); // Left outer border
    colWidths.forEach((w) => {
      currentX += w;
      doc.line(currentX, tableStartY, currentX, tableMaxBottomY);
    });

    // Bottom horizontal border right above Total Credited & Received By
    doc.setLineWidth(0.2);
    doc.line(margin, tableMaxBottomY, pageWidth - margin, tableMaxBottomY);
  };

  const drawFixedFooter = () => {
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);

    // 1. Left Side: Received and Approved by + Signature (just above Banking Details)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Received and Approved by: _______________________________________________', margin, receivedByY);
    doc.text('Signature: _____________________________________________________________', margin, signatureY);

    // 2. Right Side: Total Credited just above Banking Details
    const summaryX = pageWidth - margin;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Credited:', summaryX - 45, receivedByY);
    doc.text(formatAmount(creditNote.amount), summaryX, receivedByY, { align: 'right' });

    // 3. Bottom: Banking Details Box pinned at bottom of page
    const paymentBoxX = margin;
    const paymentBoxWidth = pageWidth - (margin * 2);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(paymentBoxX, paymentBoxY, paymentBoxWidth, paymentBoxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 0, 0);
    doc.text('OUR BANKING DETAILS ARE AS FOLLOWS:', paymentBoxX + 4, paymentBoxY + 5);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    let paymentTextY = paymentBoxY + 8;
    paymentDetails.forEach((line: string) => {
      doc.text(line, paymentBoxX + 4, paymentTextY);
      paymentTextY += 3;
    });
  };

  autoTable(doc, {
    startY: tableStartY,
    margin: {
      top: tableStartY,
      bottom: bottomMargin,
      left: margin,
      right: margin,
    },
    head: Array.of(Array.of('DESCRIPTION', 'AMOUNT')),
    body: allRows,
    rowPageBreak: 'avoid',
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      textColor: '#000000',
      lineColor: '#000000',
      lineWidth: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    headStyles: {
      fillColor: '#F3F4F6',
      textColor: '#000000',
      fontStyle: 'bold',
      lineWidth: { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 },
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'right' },
    },
    didDrawPage: () => {
      drawFullHeightTableBorders();
      drawPageHeader();
      drawFixedFooter();
    },
  });

  // Draw right-aligned 'x of y' on every page after total page count is known
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(`${i} of ${totalPages}`, pageWidth - margin - 2, pageRowY, { align: 'right' });
  }

  if (save) {
    doc.save(`CreditNote_${creditNote.creditNoteNumber || 'N-A'}.pdf`);
    return '';
  }

  if (returnBlob) {
    return doc.output('blob');
  } else {
    return doc.output('arraybuffer');
  }
};
