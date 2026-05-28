import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from './types';
import { formatAmount } from '../formatters';

/**
 * Generates a professional PDF for a Quote matching the EPEC format.
 * Layout includes company header with logo, client details, items table, totals, and terms & conditions.
 */
export const generateQuotePDF = async (quote: Quote) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let currentY = marginTop;

  // --- HEADER SECTION ---
  // Company branding on left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('EPEC SOLUTIONS (PTY) LTD   Reg: 2012/118990/07   VAT No: 4470275886', marginLeft, currentY);
  
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('259 Kent Avenue, Randburg, Johannesburg, Gauteng, 2194', marginLeft, currentY);
  
  currentY += 4;
  doc.text('email: sales@epec.co.za   Phone: 065 835 4371', marginLeft, currentY);

  // Quote title and metadata on right
  currentY = marginTop;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('QUOTE', pageWidth - marginRight, currentY, { align: 'right' });

  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Quote Number: ${quote.quoteNumber}`, pageWidth - marginRight, currentY, { align: 'right' });
  
  currentY += 4;
  const formattedDate = new Date(quote.date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Date: ${formattedDate}`, pageWidth - marginRight, currentY, { align: 'right' });
  
  currentY += 4;
  doc.text(`Validity: ${quote.validityDays} Days`, pageWidth - marginRight, currentY, { align: 'right' });
  
  if (quote.vendorNumber) {
    currentY += 4;
    doc.text(`Vendor Number: ${quote.vendorNumber}`, pageWidth - marginRight, currentY, { align: 'right' });
  }

  // Separator line
  currentY = 35;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);

  currentY += 8;

  // --- BILL TO SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('BILL TO:', marginLeft, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (quote.client) {
    doc.text(quote.client.name, marginLeft, currentY);
    currentY += 4;

    const addressLines = [
      quote.client.addressLine1,
      quote.client.addressLine2,
      quote.client.addressLine3,
      quote.client.addressLine4
    ].filter(Boolean) as string[];

    addressLines.forEach(line => {
      doc.text(line, marginLeft, currentY);
      currentY += 3;
    });

    if (quote.client.representativeName) {
      currentY += 1;
      doc.text(`Attention: ${quote.client.representativeName}`, marginLeft, currentY);
      currentY += 3;
    }
  }

  // Reference field
  doc.setFont('helvetica', 'bold');
  doc.text('Reference:', marginLeft, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.reference, marginLeft + 22, currentY);

  currentY += 8;

  // --- LINE ITEMS TABLE ---
  const tableStartY = currentY;
  autoTable(doc, {
    startY: tableStartY,
    head: [['#', 'Qty', 'UOM', 'Description', 'Unit Price', 'Total']],
    body: quote.items.map(item => [
      item.itemNumber.toString(),
      item.quantity.toString(),
      item.uom,
      item.description,
      formatAmount(item.unitPrice),
      formatAmount(item.totalPrice)
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: 0,
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.3,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [200, 200, 200]
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' },
      5: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: marginLeft, right: marginRight },
    didDrawPage: function() {
      // Ensure clean borders
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- TOTALS SECTION ---
  const totalLabelX = pageWidth - marginRight - 40;
  const totalValueX = pageWidth - marginRight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Subtotal:', totalLabelX, currentY, { align: 'right' });
  doc.text(formatAmount(quote.subTotal), totalValueX, currentY, { align: 'right' });

  currentY += 4;
  doc.text('VAT (15%):', totalLabelX, currentY, { align: 'right' });
  doc.text(formatAmount(quote.vat), totalValueX, currentY, { align: 'right' });

  currentY += 3;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(totalLabelX - 5, currentY, totalValueX, currentY);

  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL:', totalLabelX, currentY, { align: 'right' });
  doc.text(formatAmount(quote.total), totalValueX, currentY, { align: 'right' });

  // --- APPROVAL SECTION ---
  currentY += 12;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Received and Approved by: ___________________________________________', marginLeft, currentY);

  currentY += 8;
  doc.text('Signature: ___________________________________________', marginLeft, currentY);

  // --- FOOTER INSTRUCTIONS ---
  currentY += 8;
  doc.setFontSize(7);
  const footerText = [
    'A written order is required should the quote be accepted',
    'A soft copy of a purchase order should be forwarded to sales@epec.co.za'
  ];
  doc.text(footerText.join('  |  '), marginLeft, currentY);

  // --- TERMS AND CONDITIONS ---
  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('THIS QUOTE IS SUBJECT TO THE FOLLOWING:', marginLeft, currentY);

  currentY += 3;
  doc.setFont('helvetica', 'normal');
  const terms = [
    '1) This quote automatically expires after thirty (30) days irrespective of the valid date above.',
    '2) The standard terms and conditions of sale of EPEC (Pty) Ltd shall apply (such terms and conditions available on request)',
    '3) Foreign Exchange: The price quoted is subject of an ROE of ZAR 19.10 to the USD. In the event that the Rand devalues against the US Dollar from date of this quotation, until the goods are received by EPEC (Pty) Ltd. EPEC (Pty) Ltd reserves the right to increase the amount payable by the customer in respect of such goods by the percentage of such change.',
    '5) Errors and omissions are excluded',
    '6) Upon placing of order, please quote this quote number',
    '7) Payment terms must be adhered to - Upon default, customer will be re-invoiced at standard pricing.',
    '8) This quotation is conditional upon your signed acceptance thereof, including the terms and conditions referred above and that it is returned to EPEC (Pty) Ltd within thirty (30) working days.'
  ];

  doc.setFontSize(6);
  terms.forEach(term => {
    const wrappedText = doc.splitTextToSize(term, contentWidth);
    wrappedText.forEach((line: string) => {
      if (currentY > pageHeight - 15) {
        doc.addPage();
        currentY = marginTop;
      }
      doc.text(line, marginLeft, currentY);
      currentY += 2.5;
    });
  });

  // Save the PDF
  doc.save(`Quote_${quote.quoteNumber}_${quote.client?.name.replace(/\s+/g, '_') || 'Draft'}.pdf`);
};