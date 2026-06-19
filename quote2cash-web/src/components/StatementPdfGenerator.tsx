// quote2cash-web/src/components/StatementPdfGenerator.tsx
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Statement, Invoice, Client } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';

export const generateStatementPDF = async (statement: Statement, invoices: Invoice[]) => {
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
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin;

  // Pre-load logo image
  const logoImg = new Image();
  logoImg.src = logo;

  try {
    await new Promise((resolve) => {
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        resolve(null);
        return;
      }
      logoImg.onload = () => resolve(null);
      logoImg.onerror = (err) => {
        console.error("PDF Generator: Could not load logo image", err);
        resolve(null);
      };
      if (logoImg.src.startsWith('data:')) {
        logoImg.onload?.(new Event("load"));
      }
    });
  } catch (error) {
    console.error("Error during logo image loading for PDF:", error);
  }

  // --- Top Section: Company Info (Left) and Statement Details (Right) ---
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
  companyInfoY += 6;

  const logoHeight = 20;
  if (logoImg.complete && logoImg.naturalWidth > 0) {
    const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
    const logoWidth = logoHeight * aspectRatio;
    doc.addImage(logoImg, 'PNG', companyInfoStartX, companyInfoY, logoWidth, logoHeight);
  }
  const finalCompanyInfoY = companyInfoY + logoHeight + 5;

  // Statement Details Block (Right)
  const detailsBlockWidth = 70;
  const detailsLabelColWidth = 25;
  const detailsValueColWidth = detailsBlockWidth - detailsLabelColWidth - 2;

  const detailsBlockX = pageWidth - margin - detailsBlockWidth;
  let detailsY = currentY;

  // STATEMENT OF ACCOUNT Title
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('STATEMENT OF ACCOUNT', pageWidth - margin, detailsY, { align: 'right' });
  detailsY += 4;

  // Statement Details
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const detailLineHeight = 2.8;

  const addDetailRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, detailsBlockX, detailsY, { align: 'left' });
    doc.setFont('helvetica', 'normal');

    const wrappedValue = doc.splitTextToSize(value, detailsValueColWidth);
    wrappedValue.forEach((line: string) => {
      doc.text(line, pageWidth - margin, detailsY, { align: 'right' });
      detailsY += detailLineHeight;
    });
  };

  const client: Client | null = statement.client || (statement as any).Client;

  addDetailRow('STATEMENT NO:', statement.statementNumber || (statement as any).StatementNumber || '—');
  addDetailRow('STATEMENT DATE:', formatDate(statement.createdAt || (statement as any).CreatedAt));
  addDetailRow('VENDOR NUMBER:', client?.vendorNumber || '—');

  // --- Customer Box (Right) ---
  const spaceAfterDetailsBeforeCustomerBox = 5;
  let customerBoxY = detailsY + spaceAfterDetailsBeforeCustomerBox;

  if (client) {
    const boxWidth = 70;
    const boxHeight = 26;
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
      client.name,
      client.addressLine1,
      client.addressLine2,
      client.addressLine3,
      client.addressLine4,
      client.vatNumber ? `VAT No: ${client.vatNumber}` : null
    ].filter(Boolean);

    clientLines.forEach(line => {
      doc.text(line!, boxX + 2, custTextY);
      custTextY += 3;
    });
    detailsY = customerBoxY + boxHeight + 8;
  }

  currentY = Math.max(finalCompanyInfoY, detailsY);
  currentY += 5;

  // Horizontal Divider
  doc.setDrawColor(204, 204, 204);
  doc.line(margin, currentY - 4, pageWidth - margin, currentY - 4);

  // --- Items Calculations ---
  const items = statement.items || (statement as any).Items || [];

  const invoiceMap: Record<string, Invoice> = {};
  invoices.forEach(inv => { invoiceMap[inv.id] = inv; });

  const paymentsByInvoice: Record<string, number> = {};
  items.forEach((item: any) => {
    const id = item.invoiceId || item.InvoiceId;
    paymentsByInvoice[id] = (paymentsByInvoice[id] || 0) + (item.paymentAmount || item.PaymentAmount || 0);
  });

  const uniqueInvoiceIds = Array.from(new Set(items.map((i: any) => i.invoiceId || i.InvoiceId))) as string[];

  const tableRows = uniqueInvoiceIds.map(id => {
    const inv = invoiceMap[id];
    const paid = paymentsByInvoice[id] || 0;
    const outstanding = (inv?.amount ?? 0) - paid;
    return [
      inv?.invoiceNumber || '—',
      formatDate(inv?.dueDate),
      client?.vendorNumber || '—',
      formatAmount(inv?.amount ?? 0),
      formatAmount(outstanding)
    ];
  });

  const totalOutstanding = uniqueInvoiceIds.reduce((sum, id) => {
    const invAmount = invoiceMap[id]?.amount ?? 0;
    return sum + (invAmount - (paymentsByInvoice[id] || 0));
  }, 0);

  // --- AutoTable Generation for Statement Items ---
  autoTable(doc, {
    startY: currentY,
    head: [['INVOICE #', 'DUE DATE', 'VENDOR #', 'INVOICE AMOUNT', 'OUTSTANDING']],
    body: tableRows,
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
      0: { cellWidth: 30 },                  // INVOICE #
      1: { cellWidth: 35 },                  // DUE DATE
      2: { cellWidth: 25 },                  // VENDOR #
      3: { cellWidth: 'auto', halign: 'right' }, // INVOICE AMOUNT
      4: { cellWidth: 35, halign: 'right' },    // OUTSTANDING
    },
    margin: margin,
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // --- Total Outstanding ---
  const summaryX = pageWidth - margin;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Outstanding:', summaryX - 45, currentY);
  doc.text(formatAmount(totalOutstanding), summaryX, currentY, { align: 'right' });
  currentY += 6;

  // --- Aging Calculations ---
  let currentBucket = 0;
  let overdue30 = 0;
  let overdue60 = 0;
  let overdue90 = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  uniqueInvoiceIds.forEach(id => {
    const inv = invoiceMap[id];
    if (!inv) return;

    const paid = paymentsByInvoice[id] || 0;
    const outstanding = (inv?.amount ?? 0) - paid;
    if (outstanding <= 0) return;

    const dueDate = new Date(inv.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      currentBucket += outstanding;
    } else if (diffDays >= 30 && diffDays < 60) {
      overdue30 += outstanding;
    } else if (diffDays >= 60 && diffDays < 90) {
      overdue60 += outstanding;
    } else {
      overdue90 += outstanding;
    }
  });

  // --- Aging Table Header Title ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT ANALYSIS', margin, currentY);
  currentY += 2;

  // --- Aging Table Generation ---
  autoTable(doc, {
    startY: currentY,
    head: [['Current', '30 Days Overdue', '60 Days Overdue', '90+ Days Overdue']],
    body: [[
      formatAmount(currentBucket),
      formatAmount(overdue30),
      formatAmount(overdue60),
      formatAmount(overdue90)
    ]],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      halign: 'right'
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.1,
      halign: 'right'
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 'auto' }
    },
    margin: margin,
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- Payment Details ---
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerBlockHeight = 22;
  currentY = Math.max(currentY + 5, pageHeight - margin - footerBlockHeight);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
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

  const filename = `Statement_${statement.statementNumber || 'N/A'}.pdf`;
  doc.save(filename);
};
