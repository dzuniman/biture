// quote2cash-web/src/components/InvoicePdfGenerator.tsx
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable'; // Ensure you have jspdf-autotable installed
import type { Invoice, QuoteItem, Client } from '../types'; // Import necessary types
import { formatAmount } from '../../formatters'; // Assuming formatAmount is available at this path
import logo from '../assets/logo.png'; // Assuming logo path is correct

export const generateInvoicePDF = async (invoice: Invoice) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const formatDate = (date?: Date) => {
    // Handle null, undefined, invalid dates, or the "0001-01-01" default from the backend
    if (!date || isNaN(date.getTime()) || date.getFullYear() <= 1) return '—';
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const margin = 5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin; // Unified Y cursor for sequential content flow

  // Pre-load logo image to ensure it's available for the PDF
  const logoImg = new Image();
  logoImg.src = logo; // This should be a base64 string or a valid URL if not using a local asset import
  
  // For local assets, you might need to import it differently or handle its loading
  // If the logo import is causing issues here, you might need to fetch it via URL or embed base64.
  // For now, we'll assume `logo` is a path that `jsPDF` can potentially handle if the build process makes it available.
  // A more robust solution for local assets would be to convert them to base64 and embed them directly.

  try {
    await new Promise((resolve, reject) => {
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        resolve(null); // Already loaded
        return;
      }
      logoImg.onload = () => resolve(null);
      logoImg.onerror = (err) => {
        console.error("PDF Generator: Could not load logo image from", logo, err);
        resolve(null); // Resolve even on error to allow PDF generation to continue without logo
      };
      // If logo is a data URL, it might already be loaded.
      if (logoImg.src.startsWith('data:')) {
         logoImg.onload?.(new Event("load")); // Trigger load if it's already a data URL
      }
    });
  } catch (error) {
    console.error("Error during logo image loading for PDF:", error);
  }


  // --- Top Section: Company Info (Left) and Invoice Details (Right) ---
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
    const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
    const logoWidth = logoHeight * aspectRatio;
    doc.addImage(logoImg, 'PNG', companyInfoStartX, companyInfoY, logoWidth, logoHeight);
  }
  const finalCompanyInfoY = companyInfoY + logoHeight + 5; // Final Y for left block

  // Invoice Details Block (Right)
  const quoteDetailsBlockWidth = 70;
  const quoteDetailsLabelColWidth = 25;
  const quoteDetailsValueColWidth = quoteDetailsBlockWidth - quoteDetailsLabelColWidth - 2;

  const quoteDetailsBlockX = pageWidth - margin - quoteDetailsBlockWidth;
  let quoteDetailsY = currentY;

  // TAX INVOICE Title
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - margin, quoteDetailsY, { align: 'right' });
  quoteDetailsY += 4;

  // Invoice Details
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const detailLineHeight = 2.8;

  const addInvoiceDetailRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, quoteDetailsBlockX, quoteDetailsY, { align: 'left' });
    doc.setFont('helvetica', 'normal');

    const wrappedValue = doc.splitTextToSize(value, quoteDetailsValueColWidth);
    wrappedValue.forEach((line: string) => {
      doc.text(line, pageWidth - margin, quoteDetailsY, { align: 'right' });
      quoteDetailsY += detailLineHeight;
    });
  };

  addInvoiceDetailRow('INVOICE:', invoice.invoiceNumber);
  addInvoiceDetailRow('INVOICE DATE:', formatDate(invoice.createdAt ? new Date(invoice.createdAt) : undefined));
  addInvoiceDetailRow('DUE DATE:', formatDate(invoice.dueDate ? new Date(invoice.dueDate) : undefined));
  addInvoiceDetailRow('VENDOR NUMBER:', invoice.client?.vendorNumber || '—');
  if (invoice.description) {
    addInvoiceDetailRow('DESCRIPTION:', invoice.description);
  }
 
  // --- Customer Box (Right) ---
  const spaceAfterQuoteDetailsBeforeCustomerBox = 5;
  let customerBoxY = quoteDetailsY + spaceAfterQuoteDetailsBeforeCustomerBox;
  
  if (invoice.client) {
    const boxWidth = 70;
    const boxHeight = 30;
    const boxX = pageWidth - margin - boxWidth;

    doc.setLineWidth(0.2);
    doc.rect(boxX, customerBoxY, boxWidth, boxHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('BILL TO:', boxX + 2, customerBoxY + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let custTextY = customerBoxY + 7;
    const clientLines = [
      invoice.client.name,
      invoice.client.addressLine1,
      invoice.client.addressLine2,
      invoice.client.addressLine3,
      invoice.client.addressLine4,
      (invoice.client.vatNumber || invoice.client.vendorNumber) ? `VAT No: ${invoice.client.vatNumber || invoice.client.vendorNumber}` : null,
      invoice.client.email ? `Email: ${invoice.client.email}` : null,
      `Rep: ${invoice.client.representativeName || '-'}`,
      `Tel: ${invoice.client.representativeNumber || '-'}`
    ].filter(Boolean);

    clientLines.forEach(line => {
      doc.text(line!, boxX + 2, custTextY);
      custTextY += 3;
    });
    quoteDetailsY = customerBoxY + boxHeight + 8; // Update right column Y after customer box
  }

  currentY = Math.max(finalCompanyInfoY, quoteDetailsY);
  currentY += 5; // Add some space before the table

  // Horizontal Divider
  doc.setDrawColor(204, 204, 204);
  doc.line(margin, currentY - 4, pageWidth - margin, currentY - 4);

  // --- Items Table ---
  const tableRows = (invoice.quote?.items ?? []).slice().sort((a: QuoteItem, b: QuoteItem) => {
    const aNum = Number(a.itemNumber);
    const bNum = Number(b.itemNumber);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
    return a.itemNumber.toString().localeCompare(b.itemNumber.toString(), undefined, { numeric: true });
  }).map((item: QuoteItem) => [
    item.itemNumber,
    item.quantity,
    item.code || '—',
    item.uom,
    item.description,
    formatAmount(item.unitPrice),
    formatAmount(item.totalPrice),
  ]);

  // Apply styles directly to autoTable options
  autoTable(doc, {
    startY: currentY,
    head: [['QTY', 'DESCRIPTION', 'UNIT PRICE', 'TOTAL']], // Simplified headers as requested
    body: tableRows.map(row => [row[1], row[4], row[5], row[6]]), // Only QTY, DESCRIPTION, UNIT PRICE, TOTAL
    theme: 'grid',
    styles: {
      font: 'helvetica',
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
      0: { cellWidth: 18, halign: 'center' }, // QTY
      1: { cellWidth: 'auto' },             // DESCRIPTION
      2: { cellWidth: 25, halign: 'right' }, // UNIT PRICE
      3: { cellWidth: 25, halign: 'right' }, // TOTAL
    },
    margin: margin,
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- Summary ---
  const summaryX = pageWidth - margin;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Helper to add summary rows consistently
  const addSummaryRow = (label: string, value: number) => {
    doc.text(label, summaryX - 45, currentY);
    doc.text(formatAmount(value), summaryX, currentY, { align: 'right' });
    currentY += 4;
  };

  const subTotal = invoice.quote?.subTotal ?? 0;
  const vat = invoice.quote?.vat ?? 0;
  const total = invoice.amount ?? 0; // Use invoice.amount as the final total

  addSummaryRow('Sub total', subTotal);
  addSummaryRow('VAT', vat);

  // Total line with border
  doc.setLineWidth(0.5);
  doc.setDrawColor(51, 51, 51);
  doc.line(summaryX - 45, currentY, summaryX, currentY);
  currentY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  addSummaryRow('Total', total);
  doc.setFont('helvetica', 'normal');

  // --- Payment Details ---
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerBlockHeight = 22;
  currentY = Math.max(currentY + 5, pageHeight - margin - footerBlockHeight);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold'); // Make "PAYMENT DETAILS:" bold
  doc.text('PAYMENT DETAILS:', margin, currentY);
  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('Bank: Nedbank', margin, currentY);
  currentY += 3;
  doc.text('Account Name: EPEC SOLUTIONS (PTY) LTD', margin, currentY);
  currentY += 3;
  doc.text('Account No: 1223326799', margin, currentY);
  currentY += 3;
  doc.text('Account Type: Cheque', margin, currentY);
  currentY += 3;
  doc.text('Branch Code: 198765', margin, currentY);

  // --- Footer/Terms (Optional - can be added if needed, similar to quote PDF) ---
  // For now, let's just ensure the content doesn't overflow.
  // If you want terms, you'd need to add them similar to the quote PDF generator.

  // Save the PDF
  // Ensure invoice.invoiceNumber is available and valid for filename
  const filename = `Invoice_${invoice.invoiceNumber || 'N/A'}.pdf`;
  doc.save(filename);
};