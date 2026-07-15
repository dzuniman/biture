// quote2cash-web/src/components/StatementPdfGenerator.tsx
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Statement, Invoice, Client, CreditNote } from '../types';
import { formatAmount } from '../../formatters';
import logo from '../assets/logo.png';

export const generateStatementPDF = async (statement: Statement,
  invoices: Invoice[],
  creditNotes: CreditNote[] = [],
  save: boolean = false,
  returnBlob = false) => {
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
      console.error("PDF Generator: Could not load logo image from", logo);
      resolve(null);
    };
  });

  const items = statement.items || (statement as any).Items || [];

  const invoiceMap: Record<string, Invoice> = {};
  invoices.forEach(inv => { invoiceMap[inv.id] = inv; });

  const creditNoteMap: Record<string, CreditNote> = {};
  creditNotes.forEach(cn => { creditNoteMap[cn.id] = cn; });

  const paymentsByInvoice: Record<string, number> = {};
  items.forEach((item: any) => {
    const id = item.invoiceId || item.InvoiceId;
    if (id) paymentsByInvoice[id] = (paymentsByInvoice[id] || 0) + (item.paymentAmount || item.PaymentAmount || 0);
  });

  const uniqueInvoiceIds = Array.from(new Set(
    items.filter((i: any) => !!(i.invoiceId || i.InvoiceId)).map((i: any) => i.invoiceId || i.InvoiceId)
  )) as string[];

  const uniqueCreditNoteIds = Array.from(new Set(
    items.filter((i: any) => !!(i.creditNoteId || i.CreditNoteId)).map((i: any) => i.creditNoteId || i.CreditNoteId)
  )) as string[];

  // Invoice rows
  const invoiceRows = uniqueInvoiceIds.map(id => {
    const inv = invoiceMap[id];
    const paid = paymentsByInvoice[id] || 0;
    const outstanding = (inv?.amount ?? 0) - paid;
    const poNumber = (inv as any)?.quote?.poNumber || (inv as any)?.Quote?.PoNumber || '—';
    const documentType = (inv as any)?.description || '—';
    return [
      inv?.invoiceNumber || '—',
      formatDate(inv?.dueDate),
      'INVOICE',
      poNumber,
      formatAmount(inv?.amount ?? 0),
      formatAmount(outstanding)
    ];
  });

  // Credit Note rows
  const creditNoteRows = uniqueCreditNoteIds.map(id => {
    const cn = creditNoteMap[id];
    const cnAmount = cn?.amount ?? 0;
    return [
      cn?.creditNoteNumber || '—',
      '',
      'CREDIT NOTE',
      '',
      formatAmount(cnAmount),
      `(${formatAmount(cnAmount)})`
    ];
  });

  const allRows = [...invoiceRows, ...creditNoteRows];

  const MAX_ROWS_PER_PAGE = 20;
  const totalPages = Math.ceil(allRows.length / MAX_ROWS_PER_PAGE);
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerBlockHeight = 55;
  const summaryHeight = 20;
  const totalFooterHeight = summaryHeight + footerBlockHeight;

  for (let i = 0; i < allRows.length; i += MAX_ROWS_PER_PAGE) {
    const currentPage = Math.floor(i / MAX_ROWS_PER_PAGE) + 1;
    let chunk = allRows.slice(i, i + MAX_ROWS_PER_PAGE);

    while (chunk.length < MAX_ROWS_PER_PAGE) {
      chunk.push(['', '', '', '', '', '', '']);
    }

    const margin = 5;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = margin;

    // --- Company Info (Top Left) ---
    const companyInfoX = margin;
    let companyInfoY = currentY - 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('BITURE (PTY) LTD   Reg: K2013/194395/07   VAT No: 4480272220', companyInfoX, companyInfoY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Cnr Fred Versepute and Asparagus Road Midrand 1685', companyInfoX, companyInfoY + 16);
    doc.text('Email: BetrothM@biture.co.za   Tel: +27 65 835 4371 | +27 83 249 8510', companyInfoX, companyInfoY + 20);

    // --- Logo (Top Right) ---
    const logoHeight = 15;
    let logoWidth = 0;
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      const aspectRatio = logoImg.naturalWidth / logoImg.naturalHeight;
      logoWidth = logoHeight * aspectRatio;
      doc.addImage(logoImg, 'PNG', pageWidth - margin - logoWidth, currentY - 2, logoWidth, logoHeight);
    }

    // --- Bill To Box (below company info) ---
    let customerBoxY = companyInfoY + 23;
    const boxWidth = 70;
    const boxHeight = 33; // fixed height to match Tax Invoice block
    const boxX = companyInfoX;

    doc.setLineWidth(0.2);
    doc.rect(boxX, customerBoxY, boxWidth, boxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('BILL TO:', boxX + 2, customerBoxY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    let custTextY = customerBoxY + 7;

    if (statement.client) {
      // Build client lines WITHOUT representative
      const clientLines = [
        statement.client.name,
        statement.client.addressLine1,
        statement.client.addressLine2,
        statement.client.addressLine3,
        statement.client.addressLine4,
        statement.client.vatNumber ? `VAT No: ${statement.client.vatNumber}` : null,
        statement.client.email ? `Email: ${statement.client.email}` : null
      ].filter(Boolean);

      // Draw normal client lines
      clientLines.forEach(line => {
        doc.text(line!, boxX + 2, custTextY);
        custTextY += 3;
      });

      // Draw representative line separately (name left, number right, separator in middle)
      if (statement.client.representativeName || statement.client.representativeNumber) {
        const repLineY = custTextY;
        const separatorX = boxX + (boxWidth / 2);

        if (statement.client.representativeName) {
          doc.text(statement.client.representativeName, boxX + 2, repLineY);
        }

        if (statement.client.representativeNumber) {
          doc.text(statement.client.representativeNumber, boxX + boxWidth - 2, repLineY, { align: 'right' });
        }

        custTextY += 3;
      }
    }

    // Statement Details Block (Right)
    const detailsBlockWidth = 70;
    const detailsLabelColWidth = 25;
    const detailsValueColWidth = detailsBlockWidth - detailsLabelColWidth - 2;

    const detailsBlockX = pageWidth - margin - detailsBlockWidth;
    let detailsY = currentY;

    // STATEMENT OF ACCOUNT Title
    const statementDetailsBlockWidth = 70;
    const statementDetailsBlockX = pageWidth - margin - statementDetailsBlockWidth;
    const statementDetailsY = companyInfoY + logoHeight + 8;

    doc.setLineWidth(0.2);
    doc.rect(statementDetailsBlockX, statementDetailsY, statementDetailsBlockWidth, boxHeight);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('STATEMENT OF ACCOUNT', pageWidth - margin - 2, statementDetailsY + 4, { align: 'right' });

    // Statement Details
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    let detailY = statementDetailsY + 7;

    const addStatementDetailRow = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, statementDetailsBlockX + 2, detailY);

      doc.setFont('helvetica', 'normal');
      doc.text(value, statementDetailsBlockX + statementDetailsBlockWidth - 2, detailY, { align: 'right' });

      detailY += 4;
    };

    const client: Client | null = statement.client || (statement as any).Client;

    addStatementDetailRow('STATEMENT NO:', statement.statementNumber || (statement as any).StatementNumber || '—');
    addStatementDetailRow('STATEMENT DATE:', formatDate(statement.createdAt || (statement as any).CreatedAt));
    addStatementDetailRow("ACCOUNT TYPE:", `${statement.dueDays || (statement as any).dueDays} DAYS`);
    addStatementDetailRow('VENDOR NUMBER:', client?.vendorNumber || '-');
    addStatementDetailRow('PAGE:', `${currentPage} of ${totalPages}` || '—');

    let totalOutstanding = uniqueInvoiceIds.reduce((sum, id) => {
      const invAmount = invoiceMap[id]?.amount ?? 0;
      return sum + (invAmount - (paymentsByInvoice[id] || 0));
    }, 0);
    uniqueCreditNoteIds.forEach(id => { totalOutstanding -= creditNoteMap[id]?.amount ?? 0; });

    // --- Table Start ---
    currentY = Math.max(customerBoxY + boxHeight, statementDetailsY + boxHeight) + 5;

    // --- AutoTable Generation for Statement Items ---
    autoTable(doc, {
      startY: currentY,
      head: [['Document No', 'Due Date', 'Document Type', 'PO Number', 'Amount', 'Outstanding']],
      body: chunk,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: { top: 0, right: 0.1, bottom: 0, left: 0.1 }, // verticals only
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 },
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 30 },
        2: { cellWidth: 28 },
        3: { cellWidth: 20 },
        4: { cellWidth: 'auto', halign: 'right' },
        5: { cellWidth: 28, halign: 'right' },
      }, didDrawCell: (data) => {
        if (
          data.section === 'body' &&
          data.row.index === chunk.length - 1 &&
          data.column.index === data.table.columns.length - 1
        ) {
          const y = data.cell.y + data.cell.height;
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.2);
          doc.line(margin, y, pageWidth - margin, y);
        }
      },
      margin: margin,
    });

    // --- Summary + Footer + Payment Box (runs on every page) ---
    const table = (doc as any).lastAutoTable;
    currentY = Math.max(table.finalY + 8, pageHeight - margin - totalFooterHeight);
    currentY += 10;

    currentY = Math.max((doc as any).lastAutoTable.finalY + 6, pageHeight - margin - totalFooterHeight);
    currentY += 5
    // --- Total Outstanding ---
    const summaryX = pageWidth - margin;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Outstanding:', summaryX - 55, currentY);
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

    currentY = (doc as any).lastAutoTable.finalY + 4;

    // Approval + Terms
    currentY = Math.max(currentY + 5, pageHeight - margin - footerBlockHeight);
    currentY += -0;
    doc.setFontSize(8);
    doc.text('Received and Approved by: __________________________________________________________', margin, currentY);
    currentY += 8;
    doc.text('Signature: ________________________________________________________________________', margin, currentY);

    // Payment Details Box
    const paymentBoxX = margin;
    const paymentBoxY = pageHeight - 29;
    const paymentBoxWidth = pageWidth - (margin * 2);
    const paymentBoxHeight = 25;

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
    const paymentDetails = [
      'Bank: STANDARD BANK',
      'Branch: MIDRAND',
      'Branch Code: 123456',
      'Account Name: BITURE (PTY) LTD',
      'Account Number: 9876543210',
      'SWIFT Code: SBZAZAJJ'
    ];
    paymentDetails.forEach(line => {
      doc.text(line, paymentBoxX + 4, paymentTextY);
      paymentTextY += 3;
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Add new page if more chunks remain
    if (i + MAX_ROWS_PER_PAGE < allRows.length) {
      doc.addPage();
    }
  }

  if (save) {
    // Trigger a download
    doc.save(`Statement_${statement.statementNumber}.pdf`);
    return ""; // nothing needed for preview in this case
  }
  if (returnBlob) {
    // Return a Blob for react-pdf
    const blob = doc.output("blob");
    return blob;
  } else {
    // Return blob URL for iframe preview
    const blob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(blob);
    return pdfUrl;
  }
};
