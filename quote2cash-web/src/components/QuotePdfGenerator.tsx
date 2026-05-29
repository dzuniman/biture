import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Quote } from '../types';
import { formatAmount } from '../../formatters';
const logo = "/logo.png";

export const generateQuotePDF = async (quote: Quote) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin; // Unified Y cursor for sequential content flow

  // Pre-load logo image to ensure it's available for the PDF
  const logoImg = new Image();
  logoImg.src = logo;
  await new Promise((resolve) => {
    logoImg.onload = resolve;
    logoImg.onerror = () => {
      console.error("PDF Generator: Could not load logo image from", logo);
      resolve(null);
    };
  });

  // --- Top Section: Company Info (Left) and Quote Details (Right) ---
  const companyInfoStartX = margin;
  let companyInfoY = currentY;

  // Company Info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('EPEC SOLUTIONS (PTY) LTD   Reg: 2012/118990/07   VAT No: 4470275886', companyInfoStartX, companyInfoY);
  companyInfoY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('259 Kent Avenue, Randburg, Johannesburg, Gauteng, 2194', companyInfoStartX, companyInfoY);
  companyInfoY += 4;
  doc.text('email: sales@epec.co.za   Phone: 065 835 4371', companyInfoStartX, companyInfoY);
  companyInfoY += 6; // Space before logo

  const logoHeight = 20;
  if (logoImg.complete && logoImg.naturalWidth > 0) {
    // Add logo with calculated width to maintain aspect ratio
    const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
    const logoWidth = logoHeight * aspectRatio;
    doc.addImage(logoImg, 'PNG', companyInfoStartX, companyInfoY, logoWidth, logoHeight);
  }
  companyInfoY += logoHeight + 5; // Final Y for left block

  // Quote Details Block (Right)
  const quoteDetailsBlockWidth = 70; // Width for the entire quote details block
  const quoteDetailsLabelColWidth = 25; // Width for labels like "QUOTE NUMBER:"
  const quoteDetailsValueColWidth = quoteDetailsBlockWidth - quoteDetailsLabelColWidth - 2; // Width for values, with a small gap

  const quoteDetailsBlockX = pageWidth - margin - quoteDetailsBlockWidth;
  let quoteDetailsY = currentY; // Start at the same Y as company info

  // SALES QUOTATION Title
  doc.setFontSize(7.5); // Matching customer box title font size
  doc.setFont('helvetica', 'bold');
  doc.text('SALES QUOTATION', pageWidth - margin, quoteDetailsY, { align: 'right' });
  quoteDetailsY += 4; // Tightened spacing after title

  // Quote Details
  doc.setFontSize(7); // Matching customer box content font size
  doc.setFont('helvetica', 'normal');
  const detailLineHeight = 2.8; // Further reduced line height

  const addQuoteDetailRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, quoteDetailsBlockX, quoteDetailsY, { align: 'left' });
    doc.setFont('helvetica', 'normal');

    const wrappedValue = doc.splitTextToSize(value, quoteDetailsValueColWidth);
    wrappedValue.forEach((line: string) => {
      doc.text(line, pageWidth - margin, quoteDetailsY, { align: 'right' });
      quoteDetailsY += detailLineHeight;
    });
  };

  addQuoteDetailRow('QUOTE NUMBER:', `#${quote.quoteNumber}`);
  addQuoteDetailRow('REFERENCE:', quote.reference); // This will now wrap
  addQuoteDetailRow('DATE:', new Date(quote.date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }));
  addQuoteDetailRow('VALIDITY:', `${quote.validityDays} Days`);
  addQuoteDetailRow('VENDOR NUMBER:', quote.vendorNumber || '—');

  // --- Customer Box (Right) ---
  // Ensure spacing between vendor number and customer box
  const spaceAfterQuoteDetailsBeforeCustomerBox = 5; // Increased spacing buffer
  let customerBoxY = quoteDetailsY + spaceAfterQuoteDetailsBeforeCustomerBox;
  
  if (quote.client) {
    const boxWidth = 70;
    const boxHeight = 26;
    const boxX = pageWidth - margin - boxWidth;

    doc.setLineWidth(0.2);
    doc.rect(boxX, customerBoxY, boxWidth, boxHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('CUSTOMER', boxX + 2, customerBoxY + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let custTextY = customerBoxY + 7;
    const clientLines = [
      quote.client.name,
      quote.client.addressLine1,
      quote.client.addressLine2,
      quote.client.addressLine3,
      quote.client.addressLine4,
      `Representative: ${quote.client.representativeName || '-'}`,
      `Contact Number: ${quote.client.representativeNumber || '-'}`,
      ``
    ].filter(Boolean);

    clientLines.forEach(line => {
      doc.text(line!, boxX + 2, custTextY);
      custTextY += 3;
    });
    quoteDetailsY = customerBoxY + boxHeight + 8; // Update right column Y after customer box
  }

  // Determine the starting Y for the table, taking into account both left and right column content
  currentY = Math.max(companyInfoY, quoteDetailsY);
  currentY += 5; // Add some space before the table

  // Horizontal Divider
  doc.setDrawColor(204, 204, 204);
  doc.line(margin, currentY - 4, pageWidth - margin, currentY - 4);

  // 4. Items Table
  const tableRows = quote.items.slice().sort((a, b) => {
    const aNum = Number(a.itemNumber);
    const bNum = Number(b.itemNumber);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
    return a.itemNumber.toString().localeCompare(b.itemNumber.toString(), undefined, { numeric: true }); // Ensure proper sorting
  }).map(item => [
    item.itemNumber,
    item.quantity,
    item.uom,
    item.description,
    formatAmount(item.unitPrice), // Formatted for display
    formatAmount(item.totalPrice), // Formatted for display
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['ITEM', 'QTY', 'UOM', 'DESCRIPTION', 'UNIT PRICE', 'TOTAL']],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica', // Ensure font consistency
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 12 }, 1: { cellWidth: 12 }, 2: { cellWidth: 15 },
      3: { cellWidth: 'auto' }, 4: { cellWidth: 25, halign: 'right' }, 5: { cellWidth: 25, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 5. Summary
  const summaryX = pageWidth - margin;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal'); // Ensure normal font for labels
  doc.text('Sub Total', summaryX - 45, currentY);
  doc.text(formatAmount(quote.subTotal), summaryX, currentY, { align: 'right' });
  currentY += 4;
  doc.text('VAT (15%)', summaryX - 45, currentY);
  doc.text(formatAmount(quote.vat), summaryX, currentY, { align: 'right' });
  currentY += 2;
  doc.setLineWidth(0.5);
  doc.setDrawColor(51, 51, 51);
  doc.line(summaryX - 45, currentY, summaryX, currentY);
  currentY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Total', summaryX - 45, currentY);
  doc.text(formatAmount(quote.total), summaryX, currentY, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // 6. Approval and Terms
  const pageHeight = doc.internal.pageSize.getHeight();
  // Combined height of approval lines, footer text, and the terms list is approx 55mm.
  // We calculate a starting Y that pushes this block to the bottom of the A4 page.
  const footerBlockHeight = 55;
  currentY = Math.max(currentY + 5, pageHeight - margin - footerBlockHeight);

  doc.setFontSize(8);
  doc.text('Received and Approved by: __________________________________________________________', margin, currentY);
  currentY += 8;
  doc.text('Signature: _________________________________________________________________________', margin, currentY);
  currentY += 10;
  doc.setFontSize(7);
  doc.text('A written order is required should the quote be accepted', margin, currentY);
  doc.text('A soft copy of a purchase order should be forwarded to sales@epec.co.za', pageWidth - margin, currentY, { align: 'right' });
  
  currentY += 8;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('THIS QUOTE IS SUBJECT TO THE FOLLOWING:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 4;
  const terms = [
    '1) This quote automatically expires after thirty (30) days irrespective of the valid date above.',
    '2) The standard terms and conditions of sale of EPEC (Pty) Ltd shall apply (such terms and conditions available on request)',
    '3) Foreign Exchange: The price quoted is subject of an ROE of ZAR 19.10 to the USD. In the event that Rand devalues against US Dollar, EPEC reserves the right to increase the amount payable.',
    '5) Errors and omissions are excluded. 6) Upon placing of order, please quote this quote number.',
    '7) Payment terms must be adhered to. 8) This quotation is conditional upon your signed acceptance and return within 30 days.'
  ];
  terms.forEach(term => {
    const wrappedTerm = doc.splitTextToSize(term, contentWidth);
    wrappedTerm.forEach((line: string) => {
      doc.text(line, margin, currentY);
      currentY += 3;
    });
  });

  doc.save(`Quote_${quote.quoteNumber}_${quote.reference}.pdf`);
};