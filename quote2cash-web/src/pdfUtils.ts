import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote } from './types';
import { formatAmount } from '../formatters';
import logo from './assets/logo.png';

const loadImageDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to convert logo to data URL'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

export const generateQuotePDF = async (quote: Quote) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const bottomMargin = 15;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  try {
    const logoDataUrl = await loadImageDataUrl(logo);
    doc.addImage(logoDataUrl, 'PNG', margin, currentY, 32, 20);
  } catch {
    // Continue if the logo cannot be loaded.
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('EPEC SOLUTIONS (PTY) LTD', margin + 38, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Reg: 2012/118990/07   VAT No: 4470275886', margin + 38, currentY + 8);
  doc.text('259 Kent Avenue, Randburg, Johannesburg, Gauteng, 2194', margin + 38, currentY + 12);
  doc.text('email: sales@epec.co.za   Phone: 065 835 4371', margin + 38, currentY + 16);

  const rightX = pageWidth - margin;
  const labelX = rightX - 78;

  currentY += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SALES QUOTATION', rightX, currentY, { align: 'right' });

  currentY += 5;
  const formattedDate = new Date(quote.date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const quoteDetails = [
    ['QUOTE NUMBER:', `#${quote.quoteNumber}`],
    ['REFERENCE:', quote.reference],
    ['DATE:', formattedDate],
    ['VALIDITY:', `${quote.validityDays} Days`],
    ['VENDOR NUMBER:', quote.vendorNumber || '']
  ];

  doc.setFontSize(6.5);
  quoteDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, labelX, currentY, { align: 'left' });
    const labelWidth = doc.getTextWidth(label);
    doc.setFont('helvetica', 'normal');
    doc.text(value, labelX + labelWidth + 2, currentY, { align: 'left' });
    currentY += 3.5;
  });

  const customerBoxTop = margin + 18;
  const customerBoxWidth = 75;
  const customerBoxHeight = 48;
  const customerBoxX = pageWidth - margin - customerBoxWidth;

  doc.setDrawColor(0);
  doc.setLineWidth(0.35);
  doc.rect(customerBoxX, customerBoxTop, customerBoxWidth, customerBoxHeight);
  doc.rect(customerBoxX, customerBoxTop, customerBoxWidth, 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('CUSTOMER', customerBoxX + customerBoxWidth / 2, customerBoxTop + 4, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  let customerTextY = customerBoxTop + 8;
  const customerLines = [];
  if (quote.client?.name) customerLines.push(quote.client.name);
  if (quote.client?.addressLine1) customerLines.push(quote.client.addressLine1);
  if (quote.client?.addressLine2) customerLines.push(quote.client.addressLine2);
  if (quote.client?.addressLine3) customerLines.push(quote.client.addressLine3);
  if (quote.client?.addressLine4) customerLines.push(quote.client.addressLine4);

  customerLines.forEach((line) => {
    doc.text(line, customerBoxX + 2, customerTextY);
    customerTextY += 4;
  });

  doc.text(`Representative: ${quote.client?.representativeName || '-'}`, customerBoxX + 2, customerBoxTop + customerBoxHeight - 8);
  doc.text(`Contact Number: ${quote.client?.representativeNumber || '-'}`, customerBoxX + 2, customerBoxTop + customerBoxHeight - 3);

  const tableStartY = Math.max(customerBoxTop + customerBoxHeight + 8, currentY + 4, 65);
  const tableStartX = margin;
  const tableWidth = pageWidth - margin * 2;

  const sortedItems = quote.items.slice().sort((a, b) => {
    const aNum = Number(a.itemNumber);
    const bNum = Number(b.itemNumber);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
    return a.itemNumber.toString().localeCompare(b.itemNumber.toString(), undefined, { numeric: true });
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [['ITEM', 'QTY', 'UOM', 'DESCRIPTION', 'UNIT PRICE', 'TOTAL']],
    body: sortedItems.map((item) => [
      item.itemNumber.toString(),
      item.quantity.toString(),
      item.uom,
      item.description,
      formatAmount(item.unitPrice),
      formatAmount(item.totalPrice)
    ]),
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 6,
      textColor: 0,
      cellPadding: 1.2,
      lineWidth: 0
    },
    headStyles: {
      fillColor: [243, 243, 243],
      textColor: 0,
      fontStyle: 'bold',
      fontSize: 6.5,
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      fontSize: 6,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'left' },
      1: { cellWidth: 14, halign: 'left' },
      2: { cellWidth: 14, halign: 'left' },
      3: { cellWidth: 78, halign: 'left' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' }
    },
    margin: { left: margin, right: margin },
    didDrawCell: (data) => {
      const cell = data.cell;
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      if (cell.section === 'head' || cell.section === 'body') {
        doc.line(cell.x, cell.y, cell.x, cell.y + cell.height);
        if (data.column.index === data.table.columns.length - 1) {
          doc.line(cell.x + cell.width, cell.y, cell.x + cell.width, cell.y + cell.height);
        }
      }
      if (cell.section === 'head') {
        doc.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
      }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || tableStartY;
  const tableBottomY = finalY;
  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  doc.line(tableStartX, tableStartY, tableStartX + tableWidth, tableStartY);
  doc.line(tableStartX, tableBottomY, tableStartX + tableWidth, tableBottomY);
  doc.line(tableStartX, tableStartY, tableStartX, tableBottomY);
  doc.line(tableStartX + tableWidth, tableStartY, tableStartX + tableWidth, tableBottomY);

  const totalsTopY = Math.min(tableBottomY + 6, pageHeight - bottomMargin - 60);
  let statsY = totalsTopY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('Sub Total', rightX - 42, statsY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(formatAmount(quote.subTotal), rightX, statsY, { align: 'right' });

  statsY += 3.4;
  doc.setFont('helvetica', 'bold');
  doc.text('VAT', rightX - 42, statsY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(formatAmount(quote.vat), rightX, statsY, { align: 'right' });

  statsY += 3.4;
  doc.setFont('helvetica', 'bold');
  doc.text('Total', rightX - 42, statsY, { align: 'right' });
  doc.text(formatAmount(quote.total), rightX, statsY, { align: 'right' });

  const approvalTop = pageHeight - bottomMargin - 46;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Received and Approved by: ___________________________________________', margin, approvalTop);
  doc.text('Signature: ___________________________________________', margin, approvalTop + 6);

  doc.setFontSize(6);
  const footerText = [
    'A written order is required should the quote be accepted',
    'A soft copy of a purchase order should be forwarded to sales@epec.co.za'
  ];
  doc.text(footerText.join('  |  '), margin, approvalTop + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('THIS QUOTE IS SUBJECT TO THE FOLLOWING:', margin, approvalTop + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  const terms = [
    '1) This quote automatically expires after thirty (30) days irrespective of the valid date above.',
    '2) The standard terms and conditions of sale of EPEC (Pty) Ltd shall apply (such terms and conditions available on request)',
    '3) Foreign Exchange: The price quoted is subject of an ROE of ZAR 19.10 to the USD. In the event that the Rand devalues against the US Dollar from date of this quotation, until the goods are received by EPEC (Pty) Ltd. EPEC (Pty) Ltd reserves the right to increase the amount payable by the customer in respect of such goods by the percentage of such change.',
    '5) Errors and omissions are excluded',
    '6) Upon placing of order, please quote this quote number',
    '7) Payment terms must be adhered to - Upon default, customer will be re-invoiced at standard pricing.',
    '8) This quotation is conditional upon your signed acceptance thereof, including the terms and conditions referred above and that it is returned to EPEC (Pty) Ltd within thirty (30) working days.'
  ];

  let termY = approvalTop + 22;
  const termLineHeight = 3.2;
  terms.forEach((term) => {
    const wrapped = doc.splitTextToSize(term, contentWidth);
    wrapped.forEach((line: string) => {
      if (termY > pageHeight - bottomMargin) return;
      doc.text(line, margin, termY);
      termY += termLineHeight;
    });
  });

  const fileName = `${quote.quoteNumber} ${quote.client?.name || 'Client'} ${quote.reference}`
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();

  doc.save(`${fileName}.pdf`);
};
